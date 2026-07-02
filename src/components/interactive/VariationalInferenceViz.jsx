import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// ── True posterior (bimodal) ──────────────────────────────────────────────────

function trueLogPosterior(z1, z2) {
  const logP1 = -0.5 * ((z1 - 1.5) ** 2 / 0.4 + (z2 - 1.0) ** 2 / 0.6)
  const logP2 = -0.5 * ((z1 + 1.5) ** 2 / 0.5 + (z2 + 0.5) ** 2 / 0.4)
  const m = Math.max(logP1, logP2)
  return m + Math.log(Math.exp(logP1 - m) + Math.exp(logP2 - m))
}

// ── Normal sampler (Box-Muller) ───────────────────────────────────────────────

let _spare = null
function sampleNormal() {
  if (_spare !== null) { const s = _spare; _spare = null; return s }
  const u = Math.random(), v = Math.random()
  const mag = Math.sqrt(-2 * Math.log(u + 1e-10))
  _spare = mag * Math.sin(2 * Math.PI * v)
  return mag * Math.cos(2 * Math.PI * v)
}

// ── ELBO computation ──────────────────────────────────────────────────────────

function computeELBO(mu1, mu2, logSig1, logSig2, nSamples = 50) {
  const sig1 = Math.exp(logSig1), sig2 = Math.exp(logSig2)
  let elbo = 0
  for (let i = 0; i < nSamples; i++) {
    const eps1 = sampleNormal(), eps2 = sampleNormal()
    const z1 = mu1 + sig1 * eps1, z2 = mu2 + sig2 * eps2
    const logQ = -0.5 * (eps1 ** 2 + eps2 ** 2) - logSig1 - logSig2 - Math.log(2 * Math.PI)
    const logP = trueLogPosterior(z1, z2) - Math.log(2 * Math.PI)
    elbo += (logP - logQ)
  }
  return elbo / nSamples
}

// ── Numerical gradient of ELBO ────────────────────────────────────────────────

function elboGrad(mu1, mu2, logSig1, logSig2, eps = 0.01, nSamples = 80) {
  const f = (a, b, c, d) => computeELBO(a, b, c, d, nSamples)
  const base = f(mu1, mu2, logSig1, logSig2)
  return {
    dmu1:     (f(mu1 + eps, mu2,      logSig1,       logSig2)       - base) / eps,
    dmu2:     (f(mu1,       mu2 + eps, logSig1,       logSig2)       - base) / eps,
    dlogSig1: (f(mu1,       mu2,      logSig1 + eps, logSig2)       - base) / eps,
    dlogSig2: (f(mu1,       mu2,      logSig1,       logSig2 + eps) - base) / eps,
  }
}

// ── Precompute true posterior heatmap on 80×80 grid ──────────────────────────

const GRID = 80
const Z_MIN = -4, Z_MAX = 4
const gridValues = new Float64Array(GRID * GRID)

;(() => {
  let maxV = -Infinity
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      const z1 = Z_MIN + (i / (GRID - 1)) * (Z_MAX - Z_MIN)
      const z2 = Z_MAX - (j / (GRID - 1)) * (Z_MAX - Z_MIN)
      const v = Math.exp(trueLogPosterior(z1, z2))
      gridValues[j * GRID + i] = v
      if (v > maxV) maxV = v
    }
  }
  for (let k = 0; k < gridValues.length; k++) gridValues[k] /= maxV
})()

// ── Precompute p(z1) marginal from grid ───────────────────────────────────────

const pZ1Marginal = new Float64Array(GRID)
;(() => {
  for (let i = 0; i < GRID; i++) {
    let s = 0
    for (let j = 0; j < GRID; j++) s += gridValues[j * GRID + i]
    pZ1Marginal[i] = s
  }
  const maxM = Math.max(...pZ1Marginal)
  for (let i = 0; i < pZ1Marginal.length; i++) pZ1Marginal[i] /= maxM
})()

// ── Gaussian PDF ──────────────────────────────────────────────────────────────

function gaussianPDF(x, mu, sig) {
  return Math.exp(-0.5 * ((x - mu) / sig) ** 2) / (sig * Math.sqrt(2 * Math.PI))
}

// ── Prime color from CSS var ──────────────────────────────────────────────────

function getPrime() {
  if (typeof document === 'undefined') return [124, 110, 245]
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--prime').trim()
  // try parse hex
  if (raw.startsWith('#')) {
    const hex = raw.slice(1)
    if (hex.length === 6) {
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
    }
  }
  return [124, 110, 245]
}

// ── Component ─────────────────────────────────────────────────────────────────

const INIT_STATE = { mu1: 0, mu2: 0, logSig1: 0, logSig2: 0 }

export const VariationalInferenceViz = forwardRef(function VariationalInferenceViz(props, ref) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const stateRef  = useRef({ ...INIT_STATE })
  const elboHistRef = useRef([])

  const [displayState, setDisplayState] = useState({ ...INIT_STATE })
  const [elboVal,      setElboVal]      = useState(null)
  const [optimizing,   setOptimizing]   = useState(false)

  // ── Draw ──────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    if (canvas.width !== cw * devicePixelRatio || canvas.height !== ch * devicePixelRatio) {
      canvas.width  = cw * devicePixelRatio
      canvas.height = ch * devicePixelRatio
    }
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.clearRect(0, 0, cw, ch)

    const leftW    = Math.floor(cw * 0.45)
    const rightW   = cw - leftW
    const topH     = Math.floor(ch * 0.55)
    const bottomH  = ch - topH
    const divX     = leftW

    const { mu1, mu2, logSig1, logSig2 } = stateRef.current
    const sig1 = Math.exp(logSig1), sig2 = Math.exp(logSig2)

    // get prime color components
    const [pr, pg, pb] = getPrime()

    // ── Panel 1: 2D latent space heatmap ────────────────────────────────────
    const imgData = ctx.createImageData(leftW, ch)
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const t   = gridValues[j * GRID + i]
        const r   = Math.round(10  + t * pr)
        const g   = Math.round(10  + t * pg)
        const b   = Math.round(20  + t * pb)

        // Map grid cell to canvas pixels
        const px0 = Math.floor((i / GRID) * leftW)
        const px1 = Math.floor(((i + 1) / GRID) * leftW)
        const py0 = Math.floor((j / GRID) * ch)
        const py1 = Math.floor(((j + 1) / GRID) * ch)

        for (let py = py0; py < py1; py++) {
          for (let px = px0; px < px1; px++) {
            const idx = (py * leftW + px) * 4
            imgData.data[idx]     = r
            imgData.data[idx + 1] = g
            imgData.data[idx + 2] = b
            imgData.data[idx + 3] = 255
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0)

    // Helper: world → panel1 pixel
    const wToP = (z1, z2) => {
      const x = ((z1 - Z_MIN) / (Z_MAX - Z_MIN)) * leftW
      const y = ch - ((z2 - Z_MIN) / (Z_MAX - Z_MIN)) * ch
      return [x, y]
    }

    // 1-sigma ellipse for q
    ctx.beginPath()
    ctx.setLineDash([5, 4])
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth   = 1.5
    for (let angle = 0; angle <= 2 * Math.PI + 0.01; angle += 0.05) {
      const z1 = mu1 + sig1 * Math.cos(angle)
      const z2 = mu2 + sig2 * Math.sin(angle)
      const [px, py] = wToP(z1, z2)
      if (angle === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])

    // centroid dot
    const [cx, cy] = wToP(mu1, mu2)
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fill()

    // Panel 1 label
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font      = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Latent space  — p(z|x) heatmap + q(z) ellipse', 6, 13)

    // ── Divider ──────────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth   = 1
    ctx.beginPath(); ctx.moveTo(divX, 0); ctx.lineTo(divX, ch); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(divX, topH); ctx.lineTo(cw, topH); ctx.stroke()

    // ── Panel 2: ELBO history (top right) ───────────────────────────────────
    const elboHist = elboHistRef.current
    const rX = divX + 10, rY = 10
    const rW = rightW - 20, rH = topH - 20

    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font      = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('ELBO over iterations', rX, rY + 10)

    if (elboHist.length > 1) {
      const minE = Math.min(...elboHist) - 0.5
      const maxE = Math.max(...elboHist) + 0.5
      const iters = elboHist.length

      const toCanv = (iter, val) => ({
        x: rX + (iter / 100) * rW,
        y: rY + 20 + rH - 20 - ((val - minE) / (maxE - minE)) * (rH - 30),
      })

      // ELBO line
      ctx.beginPath()
      ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.9)`
      ctx.lineWidth   = 2
      const p0 = toCanv(0, elboHist[0])
      ctx.moveTo(p0.x, p0.y)
      for (let i = 1; i < iters; i++) {
        const p = toCanv(i, elboHist[i])
        ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()

      // axes
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth   = 1
      ctx.beginPath()
      ctx.moveTo(rX, rY + 20); ctx.lineTo(rX, rY + rH)
      ctx.moveTo(rX, rY + rH); ctx.lineTo(rX + rW, rY + rH)
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.font      = '9px sans-serif'
      ctx.fillText('0', rX, rY + rH + 10)
      ctx.fillText('100', rX + rW - 16, rY + rH + 10)
      ctx.fillText('iter', rX + rW / 2 - 8, rY + rH + 10)
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.font      = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Click "Optimize" to start', rX + rW / 2, rY + rH / 2 + 5)
    }

    // ── Panel 3: marginals (bottom right) ────────────────────────────────────
    const bX = divX + 10, bY = topH + 8
    const bW = rightW - 20, bH = bottomH - 18

    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font      = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('p(z₁) marginal: true vs q(z₁)', bX, bY + 10)

    // true marginal
    ctx.beginPath()
    ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.8)`
    ctx.lineWidth   = 2
    for (let i = 0; i < GRID; i++) {
      const x = bX + (i / (GRID - 1)) * bW
      const y = bY + 18 + (1 - pZ1Marginal[i]) * (bH - 22)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // q marginal (Gaussian)
    const z1Range = Z_MAX - Z_MIN
    let maxQval = 0
    for (let i = 0; i < GRID; i++) {
      const z1 = Z_MIN + (i / (GRID - 1)) * z1Range
      const v = gaussianPDF(z1, mu1, sig1)
      if (v > maxQval) maxQval = v
    }
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([4, 3])
    for (let i = 0; i < GRID; i++) {
      const z1 = Z_MIN + (i / (GRID - 1)) * z1Range
      const v  = gaussianPDF(z1, mu1, sig1) / (maxQval || 1)
      const x  = bX + (i / (GRID - 1)) * bW
      const y  = bY + 18 + (1 - v) * (bH - 22)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // mini legend
    ctx.fillStyle = `rgba(${pr},${pg},${pb},0.8)`
    ctx.fillRect(bX, bY + bH - 20, 12, 3)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font      = '9px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('true p(z₁)', bX + 15, bY + bH - 15)
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(bX + 80, bY + bH - 19)
    ctx.lineTo(bX + 92, bY + bH - 19)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText('q(z₁)', bX + 95, bY + bH - 15)

    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }, [])

  // ── Optimization ─────────────────────────────────────────────────────────

  const optimize = useCallback(() => {
    // Always restart from the initial state: cancel any in-flight loop and
    // clear the ELBO history so the descent animates fresh from step 0.
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    stateRef.current  = { ...INIT_STATE }
    elboHistRef.current = []
    setDisplayState({ ...INIT_STATE })
    setElboVal(null)
    setOptimizing(true)

    const LR     = 0.05
    const STEPS  = 100
    const PER_FRAME = 10
    let step = 0

    const tick = () => {
      for (let i = 0; i < PER_FRAME && step < STEPS; i++, step++) {
        const { mu1, mu2, logSig1, logSig2 } = stateRef.current
        const grad = elboGrad(mu1, mu2, logSig1, logSig2)
        stateRef.current = {
          mu1:     mu1     + LR * grad.dmu1,
          mu2:     mu2     + LR * grad.dmu2,
          logSig1: logSig1 + LR * grad.dlogSig1,
          logSig2: logSig2 + LR * grad.dlogSig2,
        }
        const elbo = computeELBO(stateRef.current.mu1, stateRef.current.mu2, stateRef.current.logSig1, stateRef.current.logSig2, 50)
        elboHistRef.current.push(elbo)
        setElboVal(elbo)
      }

      const { mu1, mu2, logSig1, logSig2 } = stateRef.current
      setDisplayState({ mu1, mu2, logSig1, logSig2 })
      draw()

      if (step < STEPS) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        setOptimizing(false)
      }
    }

    animRef.current = requestAnimationFrame(tick)
  }, [optimizing, draw])

  const reset = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    stateRef.current    = { ...INIT_STATE }
    elboHistRef.current = []
    setDisplayState({ ...INIT_STATE })
    setElboVal(null)
    setOptimizing(false)
    draw()
  }, [draw])

  const pause = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    setOptimizing(false)
  }, [])

  const stepOnce = useCallback(() => {
    pause()
    const LR = 0.05
    const { mu1, mu2, logSig1, logSig2 } = stateRef.current
    const grad = elboGrad(mu1, mu2, logSig1, logSig2)
    stateRef.current = {
      mu1:     mu1     + LR * grad.dmu1,
      mu2:     mu2     + LR * grad.dmu2,
      logSig1: logSig1 + LR * grad.dlogSig1,
      logSig2: logSig2 + LR * grad.dlogSig2,
    }
    const elbo = computeELBO(stateRef.current.mu1, stateRef.current.mu2, stateRef.current.logSig1, stateRef.current.logSig2, 50)
    elboHistRef.current.push(elbo)
    setElboVal(elbo)
    setDisplayState({ ...stateRef.current })
    draw()
  }, [pause, draw])

  useImperativeHandle(ref, () => ({ play: optimize, pause, reset, step: stepOnce }), [optimize, pause, reset, stepOnce])

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => draw())
    ro.observe(canvas)
    draw()
    return () => {
      ro.disconnect()
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, []) // eslint-disable-line

  const { mu1, mu2, logSig1, logSig2 } = displayState
  const sig1 = Math.exp(logSig1).toFixed(2)
  const sig2 = Math.exp(logSig2).toFixed(2)

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <button
          onClick={optimize}
          disabled={optimizing}
          style={{
            padding: '0.3rem 0.9rem', borderRadius: '5px', border: 'none',
            background: optimizing ? 'var(--rim, #333)' : 'var(--prime, #7c6ef5)',
            color: '#fff', cursor: optimizing ? 'not-allowed' : 'pointer', fontSize: '0.8rem',
          }}
        >
          {optimizing ? 'Optimizing…' : 'Optimize'}
        </button>

        <button
          onClick={reset}
          style={{
            padding: '0.3rem 0.9rem', borderRadius: '5px',
            border: '1px solid var(--rim, #444)',
            background: 'transparent', color: 'var(--ink, #ccc)',
            cursor: 'pointer', fontSize: '0.8rem',
          }}
        >
          Reset
        </button>

        <span style={{ fontSize: '0.78rem', color: 'var(--ink-ghost, #888)', fontFamily: 'monospace' }}>
          μ = ({mu1.toFixed(2)}, {mu2.toFixed(2)}) | σ = ({sig1}, {sig2})
        </span>

        {elboVal !== null && (
          <span style={{ fontSize: '0.78rem', color: 'var(--prime, #7c6ef5)', fontFamily: 'monospace' }}>
            ELBO: {elboVal.toFixed(2)}
          </span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '380px', display: 'block', borderRadius: '6px' }}
      />

      {/* Note */}
      <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: 'var(--ink-ghost, #888)', lineHeight: 1.4 }}>
        q(z) is forced to be Gaussian — it can approximate only one mode of the true bimodal posterior.
        This is mean-field VI's core limitation.
      </p>
    </div>
  )
})
