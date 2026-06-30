import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const FUNCTIONS = {
  sinpi: {
    label: 'sin(πx)',
    fn: x => Math.sin(Math.PI * x),
    maxF: 1.0,
    trueVal: 2 / Math.PI,
    trueLabel: '2/π ≈ 0.6366',
  },
  xsq: {
    label: 'x²',
    fn: x => x * x,
    maxF: 1.0,
    trueVal: 1 / 3,
    trueLabel: '1/3 ≈ 0.3333',
  },
  expx: {
    label: 'eˣ',
    fn: x => Math.exp(x),
    maxF: Math.E,
    trueVal: Math.E - 1,
    trueLabel: 'e−1 ≈ 1.7183',
  },
}

const TRUE_PI = Math.PI
const MAX_DOTS = 2000

export const MonteCarloViz = forwardRef(function MonteCarloViz(props, ref) {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    samples: [],        // [{x,y,inside}] for pi panel
    intSamples: [],     // [{x,y,under}] for integration panel
    rng: mulberry32(12345),
    step: 0,
  })
  const [n, setN] = useState(0)
  const [funcKey, setFuncKey] = useState('sinpi')
  const [, forceRender] = useState(0)

  // Re-seed RNG when function changes so integration resets cleanly
  const funcKeyRef = useRef(funcKey)
  funcKeyRef.current = funcKey

  const resetAll = useCallback(() => {
    stateRef.current = {
      samples: [],
      intSamples: [],
      rng: mulberry32(12345),
      step: 0,
    }
    setN(0)
    forceRender(r => r + 1)
  }, [])

  // When funcKey changes, reset integration samples but keep pi samples
  useEffect(() => {
    stateRef.current.intSamples = []
    stateRef.current.rng = mulberry32(12345 + stateRef.current.step * 17)
    forceRender(r => r + 1)
  }, [funcKey])

  const addSamples = useCallback((count) => {
    const s = stateRef.current
    const { fn, maxF } = FUNCTIONS[funcKeyRef.current]
    for (let i = 0; i < count; i++) {
      const px = s.rng()
      const py = s.rng()
      const inside = px * px + py * py <= 1.0
      s.samples.push({ x: px, y: py, inside })

      const ix = s.rng()
      const iy = s.rng() * maxF
      const under = iy <= fn(ix)
      s.intSamples.push({ x: ix, y: iy, under })

      s.step++
    }
    const newN = s.samples.length
    setN(newN)
  }, [])

  const animRef = useRef(null)

  const play = useCallback(() => {
    if (animRef.current) return
    animRef.current = setInterval(() => {
      addSamples(50)
    }, 300)
  }, [addSamples])

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
  }, [])

  const reset = useCallback(() => {
    pause()
    resetAll()
  }, [pause, resetAll])

  const step = useCallback(() => {
    pause()
    addSamples(50)
  }, [pause, addSamples])

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step])

  useEffect(() => {
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [])

  // Draw everything
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    if (W === 0 || H === 0) return

    // Sync backing store to display size
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.scale(dpr, dpr)
    }

    ctx.clearRect(0, 0, W, H)

    const half = W / 2
    const PAD = 18
    const panelW = half - PAD * 1.5
    const panelH = H - PAD * 2

    // --- Left panel: Pi estimation ---
    const piX = PAD
    const piY = PAD
    const piSize = Math.min(panelW, panelH)

    // Background square
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--depth') || '#1a1a2e'
    ctx.fillRect(piX, piY, piSize, piSize)
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--rim') || '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(piX, piY, piSize, piSize)

    // Quarter circle arc
    ctx.beginPath()
    ctx.arc(piX, piY + piSize, piSize, -Math.PI / 2, 0)
    ctx.strokeStyle = 'rgba(99,179,237,0.45)'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(piX, piY + piSize, piSize, -Math.PI / 2, 0)
    ctx.lineTo(piX, piY + piSize)
    ctx.closePath()
    ctx.fillStyle = 'rgba(99,179,237,0.07)'
    ctx.fill()

    // Dots
    const s = stateRef.current
    const dotsToShow = s.samples.slice(0, MAX_DOTS)
    for (const pt of dotsToShow) {
      const cx = piX + pt.x * piSize
      const cy = piY + piSize - pt.y * piSize
      ctx.beginPath()
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2)
      ctx.fillStyle = pt.inside ? 'rgba(99,179,237,0.85)' : 'rgba(252,129,129,0.75)'
      ctx.fill()
    }

    // Pi stats overlay
    const total = s.samples.length
    const insideCount = s.samples.filter(p => p.inside).length
    const piEst = total > 0 ? 4 * insideCount / total : 0
    const piErr = total > 0 ? Math.abs(piEst - TRUE_PI) : 0

    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--ink') || '#e0e0e0'
    ctx.font = `bold 11px monospace`
    ctx.fillText(`π̂ = ${piEst.toFixed(4)}`, piX + piSize + 6, piY + 20)
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--ink-ghost') || '#888'
    ctx.font = `10px monospace`
    ctx.fillText(`err ${piErr.toFixed(4)}`, piX + piSize + 6, piY + 36)
    ctx.fillText(`n = ${total}`, piX + piSize + 6, piY + 52)

    // Label
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--prime') || '#63b3ed'
    ctx.font = `bold 10px sans-serif`
    ctx.fillText('π Estimation', piX, piY - 5)

    // --- Vertical divider ---
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--rim') || '#333'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(half, 0)
    ctx.lineTo(half, H)
    ctx.stroke()

    // --- Right panel: MC Integration ---
    const intX = half + PAD * 0.5
    const intY = PAD
    const intW = half - PAD * 1.5
    const splitY = intY + Math.floor(panelH * 0.57)
    const intH = splitY - intY

    const fk = funcKeyRef.current
    const { fn, maxF, trueVal } = FUNCTIONS[fk]

    // Function area background
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--depth') || '#1a1a2e'
    ctx.fillRect(intX, intY, intW, intH)
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--rim') || '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(intX, intY, intW, intH)

    // Function curve
    ctx.beginPath()
    for (let px = 0; px <= intW; px++) {
      const xi = px / intW
      const yi = fn(xi) / maxF
      const cx = intX + px
      const cy = intY + intH - yi * intH
      if (px === 0) ctx.moveTo(cx, cy)
      else ctx.lineTo(cx, cy)
    }
    ctx.strokeStyle = 'rgba(154,230,180,0.9)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Integration dots
    const intDots = s.intSamples.slice(0, MAX_DOTS)
    for (const pt of intDots) {
      const cx = intX + pt.x * intW
      const cy = intY + intH - (pt.y / maxF) * intH
      ctx.beginPath()
      ctx.arc(cx, cy, 2.0, 0, Math.PI * 2)
      ctx.fillStyle = pt.under ? 'rgba(99,179,237,0.75)' : 'rgba(252,129,129,0.65)'
      ctx.fill()
    }

    // Integration label
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--prime') || '#63b3ed'
    ctx.font = `bold 10px sans-serif`
    ctx.fillText('MC Integration', intX, intY - 5)

    const intTotal = s.intSamples.length
    const underCount = s.intSamples.filter(p => p.under).length
    const intEst = intTotal > 0 ? maxF * underCount / intTotal : 0
    const intErr = intTotal > 0 ? Math.abs(intEst - trueVal) : 0

    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--ink') || '#e0e0e0'
    ctx.font = `bold 10px monospace`
    ctx.fillText(`I ≈ ${intEst.toFixed(4)}`, intX + 4, intY + intH - 28)
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--ink-ghost') || '#888'
    ctx.font = `10px monospace`
    ctx.fillText(`true ${trueVal.toFixed(4)}  err ${intErr.toFixed(4)}`, intX + 4, intY + intH - 14)

    // --- Convergence plot (bottom of right panel) ---
    const convY = splitY + 10
    const convH = H - convY - PAD
    const convW = intW

    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--depth') || '#1a1a2e'
    ctx.fillRect(intX, convY, convW, convH)
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--rim') || '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(intX, convY, convW, convH)

    // Axes label
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--ink-ghost') || '#888'
    ctx.font = `9px sans-serif`
    ctx.fillText('n (log)', intX + convW / 2 - 12, convY + convH - 2)
    ctx.fillText('Convergence', intX + 4, convY + 10)

    if (intTotal >= 2) {
      // Compute running estimates at log-spaced checkpoints
      const checkpoints = []
      const maxLog = Math.log10(intTotal)
      const steps = Math.min(60, intTotal)
      for (let i = 1; i <= steps; i++) {
        const frac = i / steps
        const cnt = Math.max(1, Math.round(Math.pow(10, frac * maxLog)))
        if (checkpoints.length === 0 || checkpoints[checkpoints.length - 1] !== cnt) {
          checkpoints.push(cnt)
        }
      }

      // Build cumulative "under" at each checkpoint
      const cumUnder = new Array(intTotal)
      let cu = 0
      for (let i = 0; i < intTotal; i++) {
        if (s.intSamples[i].under) cu++
        cumUnder[i] = cu
      }

      const estimates = checkpoints.map(cnt => ({
        cnt,
        est: maxF * cumUnder[cnt - 1] / cnt,
      }))

      // Y range: trueVal ± some margin
      const estVals = estimates.map(e => e.est)
      const yMin = Math.min(trueVal * 0.7, ...estVals) - 0.05
      const yMax = Math.max(trueVal * 1.3, ...estVals) + 0.05
      const yRange = yMax - yMin || 0.1

      const toScreenX = cnt => intX + (Math.log10(cnt) / maxLog) * convW
      const toScreenY = val => convY + convH - ((val - yMin) / yRange) * convH

      // True value dashed line
      ctx.beginPath()
      ctx.setLineDash([4, 3])
      ctx.strokeStyle = 'rgba(154,230,180,0.7)'
      ctx.lineWidth = 1.2
      const trueScreenY = toScreenY(trueVal)
      ctx.moveTo(intX, trueScreenY)
      ctx.lineTo(intX + convW, trueScreenY)
      ctx.stroke()
      ctx.setLineDash([])

      // Running estimate curve
      ctx.beginPath()
      for (let i = 0; i < estimates.length; i++) {
        const sx = toScreenX(estimates[i].cnt)
        const sy = toScreenY(estimates[i].est)
        if (i === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.strokeStyle = 'rgba(99,179,237,0.9)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // True value label
      ctx.fillStyle = 'rgba(154,230,180,0.9)'
      ctx.font = `9px monospace`
      ctx.fillText(`true=${trueVal.toFixed(4)}`, intX + 4, trueScreenY - 3)
    }
  }, [])

  // Redraw whenever state changes
  useEffect(() => {
    draw()
  })

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      // force redraw
      forceRender(r => r + 1)
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const s = stateRef.current
  const insideCount = s.samples.filter(p => p.inside).length
  const piEst = n > 0 ? 4 * insideCount / n : 0
  const piErr = n > 0 ? Math.abs(piEst - TRUE_PI) : 0

  const btnStyle = (active = false) => ({
    padding: '0.3rem 0.75rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    borderRadius: '5px',
    border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
    background: active ? 'var(--prime)' : 'var(--depth)',
    color: active ? 'var(--bg)' : 'var(--ink)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '300px',
          display: 'block',
          borderRadius: '6px',
          border: '1px solid var(--rim)',
        }}
      />

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginTop: '0.75rem',
        alignItems: 'center',
      }}>
        <button style={btnStyle()} onClick={() => addSamples(10)}>+ 10</button>
        <button style={btnStyle()} onClick={() => addSamples(100)}>+ 100</button>
        <button style={btnStyle()} onClick={() => addSamples(1000)}>+ 1000</button>
        <button
          style={{ ...btnStyle(), marginLeft: '0.25rem', color: 'var(--ink-ghost)' }}
          onClick={resetAll}
        >
          Reset
        </button>

        <span style={{ color: 'var(--rim)', margin: '0 0.25rem' }}>|</span>

        {Object.entries(FUNCTIONS).map(([key, { label }]) => (
          <button
            key={key}
            style={btnStyle(funcKey === key)}
            onClick={() => setFuncKey(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{
        marginTop: '0.5rem',
        fontSize: '0.75rem',
        color: 'var(--ink-ghost)',
        fontFamily: 'monospace',
      }}>
        {`n = ${n} samples | π̂ = ${piEst.toFixed(4)} (error: ${piErr.toFixed(4)})`}
      </div>
    </div>
  )
})
