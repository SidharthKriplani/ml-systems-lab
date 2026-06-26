import { useState, useRef, useEffect, useCallback } from 'react'

const DISTS = ['Normal', 'Poisson', 'Exponential', 'Beta']

function normalPDF(x, mu, sigma) {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
}

function poissonPMF(k, lambda) {
  // k! approximated via log-gamma for stability
  let logFact = 0
  for (let i = 2; i <= k; i++) logFact += Math.log(i)
  return Math.exp(k * Math.log(lambda) - lambda - logFact)
}

function exponentialPDF(x, lambda) {
  return x < 0 ? 0 : lambda * Math.exp(-lambda * x)
}

function betaPDF(x, alpha, beta) {
  if (x <= 0 || x >= 1) return 0
  // ln B(a,b) via log-gamma (Stirling approx for integer-ish values; use log-sum)
  function lnGamma(z) {
    // Lanczos approximation
    const g = 7
    const c = [
      0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
    ]
    if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - lnGamma(1 - z)
    z -= 1
    let a = c[0]
    const t = z + g + 0.5
    for (let i = 1; i < g + 2; i++) a += c[i] / (z + i)
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a)
  }
  const lnB = lnGamma(alpha) + lnGamma(beta) - lnGamma(alpha + beta)
  return Math.exp((alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - lnB)
}

function getStats(dist, params) {
  if (dist === 'Normal') {
    const { mu, sigma } = params
    return { mean: mu.toFixed(3), variance: (sigma ** 2).toFixed(3) }
  }
  if (dist === 'Poisson') {
    const { lambda } = params
    return { mean: lambda.toFixed(3), variance: lambda.toFixed(3) }
  }
  if (dist === 'Exponential') {
    const { lambda } = params
    return { mean: (1 / lambda).toFixed(3), variance: (1 / lambda ** 2).toFixed(3) }
  }
  if (dist === 'Beta') {
    const { alpha, beta } = params
    const s = alpha + beta
    const mean = alpha / s
    const variance = (alpha * beta) / (s * s * (s + 1))
    return { mean: mean.toFixed(4), variance: variance.toFixed(5) }
  }
}

function getFormula(dist) {
  if (dist === 'Normal')      return 'f(x) = (1/√(2πσ²)) · e^(-½((x-μ)/σ)²)'
  if (dist === 'Poisson')     return 'P(X=k) = (λ^k · e^{-λ}) / k!'
  if (dist === 'Exponential') return 'f(x) = λ · e^{-λx}  (x ≥ 0)'
  if (dist === 'Beta')        return 'f(x) = x^(α-1)(1-x)^(β-1) / B(α,β)  (0 < x < 1)'
}

function drawCanvas(canvas, dist, params) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height
  const PL = 48, PR = 18, PT = 14, PB = 38
  const cW = W - PL - PR
  const cH = H - PT - PB

  // Read CSS vars
  const style = getComputedStyle(canvas)
  const primeColor   = style.getPropertyValue('--prime').trim()   || '#f0a500'
  const rimColor     = style.getPropertyValue('--rim').trim()     || '#333'
  const inkMid       = style.getPropertyValue('--ink-mid').trim() || '#aaa'
  const fontMono     = style.getPropertyValue('--font-mono').trim() || 'monospace'

  ctx.clearRect(0, 0, W, H)

  // Build data points
  let xs = [], ys = []

  if (dist === 'Normal') {
    const { mu, sigma } = params
    const lo = mu - 4 * sigma, hi = mu + 4 * sigma
    const n = 300
    for (let i = 0; i <= n; i++) {
      const x = lo + (hi - lo) * i / n
      xs.push(x); ys.push(normalPDF(x, mu, sigma))
    }
  } else if (dist === 'Poisson') {
    const { lambda } = params
    const maxK = Math.ceil(lambda + 4 * Math.sqrt(lambda) + 4)
    for (let k = 0; k <= maxK; k++) {
      xs.push(k); ys.push(poissonPMF(k, lambda))
    }
  } else if (dist === 'Exponential') {
    const { lambda } = params
    const hi = Math.min(15, 5 / lambda)
    const n = 300
    for (let i = 0; i <= n; i++) {
      const x = hi * i / n
      xs.push(x); ys.push(exponentialPDF(x, lambda))
    }
  } else if (dist === 'Beta') {
    const { alpha, beta } = params
    const n = 300
    for (let i = 1; i < n; i++) {
      const x = i / n
      xs.push(x); ys.push(betaPDF(x, alpha, beta))
    }
  }

  const xMin = xs[0], xMax = xs[xs.length - 1]
  const yMax = Math.max(...ys) * 1.12 || 1

  const toCanvasX = x => PL + (x - xMin) / (xMax - xMin) * cW
  const toCanvasY = y => PT + cH - (y / yMax) * cH

  // Grid lines
  ctx.strokeStyle = rimColor
  ctx.globalAlpha = 0.25
  ctx.lineWidth = 1
  const gridY = [0.25, 0.5, 0.75, 1.0]
  gridY.forEach(f => {
    const y = PT + cH - f * cH
    ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(PL + cW, y); ctx.stroke()
  })
  ctx.globalAlpha = 1

  // Axes
  ctx.strokeStyle = rimColor
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PL, PT); ctx.lineTo(PL, PT + cH); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(PL, PT + cH); ctx.lineTo(PL + cW, PT + cH); ctx.stroke()

  if (dist === 'Poisson') {
    // Draw PMF as bars
    const barW = cW / (xs.length + 1) * 0.65

    // Faint fill bars
    ctx.fillStyle = primeColor
    ctx.globalAlpha = 0.18
    xs.forEach((x, i) => {
      const cx = toCanvasX(x)
      const cy = toCanvasY(ys[i])
      ctx.fillRect(cx - barW / 2, cy, barW, PT + cH - cy)
    })
    ctx.globalAlpha = 1

    // Stroke bars
    ctx.strokeStyle = primeColor
    ctx.lineWidth = 2
    xs.forEach((x, i) => {
      const cx = toCanvasX(x)
      const cy = toCanvasY(ys[i])
      ctx.strokeRect(cx - barW / 2, cy, barW, PT + cH - cy)
    })

    // Dots on top
    ctx.fillStyle = primeColor
    xs.forEach((x, i) => {
      ctx.beginPath()
      ctx.arc(toCanvasX(x), toCanvasY(ys[i]), 3, 0, 2 * Math.PI)
      ctx.fill()
    })
  } else {
    // Filled area under curve
    ctx.beginPath()
    ctx.moveTo(toCanvasX(xs[0]), PT + cH)
    xs.forEach((x, i) => ctx.lineTo(toCanvasX(x), toCanvasY(ys[i])))
    ctx.lineTo(toCanvasX(xs[xs.length - 1]), PT + cH)
    ctx.closePath()
    ctx.fillStyle = primeColor
    ctx.globalAlpha = 0.12
    ctx.fill()
    ctx.globalAlpha = 1

    // Curve line
    ctx.beginPath()
    ctx.moveTo(toCanvasX(xs[0]), toCanvasY(ys[0]))
    xs.forEach((x, i) => ctx.lineTo(toCanvasX(x), toCanvasY(ys[i])))
    ctx.strokeStyle = primeColor
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  // X-axis labels
  ctx.fillStyle = inkMid
  ctx.font = `11px ${fontMono}`
  ctx.textAlign = 'center'
  const nTicks = 5
  for (let i = 0; i <= nTicks; i++) {
    const xVal = xMin + (xMax - xMin) * i / nTicks
    const cx = PL + (i / nTicks) * cW
    ctx.fillText(
      dist === 'Poisson' ? Math.round(xVal).toString() : xVal.toFixed(xMax - xMin < 2 ? 2 : 1),
      cx, PT + cH + 16
    )
  }

  // Y-axis labels
  ctx.textAlign = 'right'
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0]
  yTicks.forEach(f => {
    const label = (f * yMax).toFixed(2)
    ctx.fillText(label, PL - 5, PT + cH - f * cH + 4)
  })
}

export function DistributionVisualizer() {
  const [dist, setDist]     = useState('Normal')
  const [mu, setMu]         = useState(0)
  const [sigma, setSigma]   = useState(1)
  const [poisLambda, setPoisLambda] = useState(3)
  const [expLambda, setExpLambda]   = useState(1)
  const [alpha, setAlpha]   = useState(2)
  const [beta, setBeta]     = useState(2)

  const canvasRef = useRef(null)

  const params = dist === 'Normal'      ? { mu, sigma }
               : dist === 'Poisson'     ? { lambda: poisLambda }
               : dist === 'Exponential' ? { lambda: expLambda }
               :                          { alpha, beta }

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = canvas.clientWidth  || 550
    canvas.height = canvas.clientHeight || 180
    drawCanvas(canvas, dist, params)
  }, [dist, mu, sigma, poisLambda, expLambda, alpha, beta])

  useEffect(() => {
    redraw()
    window.addEventListener('resize', redraw)
    return () => window.removeEventListener('resize', redraw)
  }, [redraw])

  const stats   = getStats(dist, params)
  const formula = getFormula(dist)

  const tabBtn = (label) => ({
    padding: '5px 14px',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    fontWeight: dist === label ? 700 : 400,
    background: dist === label ? 'var(--prime)' : 'transparent',
    color: dist === label ? '#000' : 'var(--ink-mid)',
    border: '1px solid',
    borderColor: dist === label ? 'var(--prime)' : 'var(--rim)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  const sliderRow = (label, value, setter, min, max, step) => (
    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', minWidth: '36px' }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => setter(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--prime)' }} />
      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', minWidth: '36px', textAlign: 'right' }}>
        {value.toFixed(step < 1 ? 2 : 1)}
      </span>
    </div>
  )

  const sliders = dist === 'Normal' ? (
    <>
      {sliderRow('μ', mu, setMu, -3, 3, 0.1)}
      {sliderRow('σ', sigma, setSigma, 0.3, 3, 0.05)}
    </>
  ) : dist === 'Poisson' ? (
    sliderRow('λ', poisLambda, setPoisLambda, 0.5, 15, 0.5)
  ) : dist === 'Exponential' ? (
    sliderRow('λ', expLambda, setExpLambda, 0.1, 3, 0.05)
  ) : (
    <>
      {sliderRow('α', alpha, setAlpha, 0.5, 10, 0.1)}
      {sliderRow('β', beta, setBeta, 0.5, 10, 0.1)}
    </>
  )

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {DISTS.map(d => (
          <button key={d} style={tabBtn(d)} onClick={() => setDist(d)}>{d}</button>
        ))}
      </div>

      {/* Parameter sliders */}
      <div style={{ marginBottom: '10px' }}>{sliders}</div>

      {/* Formula */}
      <div style={{
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--ink-mid)',
        background: 'var(--depth)',
        border: '1px solid var(--rim)',
        borderRadius: '6px',
        padding: '6px 12px',
        marginBottom: '10px',
        letterSpacing: '0.01em',
      }}>
        {formula}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '180px',
          display: 'block',
          borderRadius: '6px',
          border: '1px solid var(--rim)',
          background: 'transparent',
        }}
      />

      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginTop: '10px',
        padding: '8px 14px',
        background: 'var(--depth)',
        border: '1px solid var(--rim)',
        borderRadius: '6px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)' }}>
          E[X] = <span style={{ color: 'var(--prime)' }}>{stats.mean}</span>
        </span>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)' }}>
          Var(X) = <span style={{ color: 'var(--prime)' }}>{stats.variance}</span>
        </span>
        {dist === 'Poisson' && (
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', fontStyle: 'italic' }}>
            (mean = variance for Poisson)
          </span>
        )}
      </div>
    </div>
  )
}
