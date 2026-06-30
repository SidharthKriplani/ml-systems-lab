import { useRef, useEffect, useState, useCallback } from 'react'

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const CLASS_COLORS = ['#4a9ebb', '#e85d4a', '#4eb87c', 'var(--prime)']
const CLASS_SHAPES = ['circle', 'triangle', 'square', 'diamond']
const N_CLASSES = 4
const PTS_PER_CLASS = 5
const CLASS_CENTERS = [[-2, -2], [2, -2], [2, 2], [-2, 2]]
const VIEW = [-4, 4]

function initPoints() {
  const rng = mulberry32(42)
  const points = []
  const classIds = []
  for (let c = 0; c < N_CLASSES; c++) {
    for (let p = 0; p < PTS_PER_CLASS; p++) {
      // Box-Muller for Gaussian noise
      const u1 = rng(); const u2 = rng()
      const z1 = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2)
      const u3 = rng(); const u4 = rng()
      const z2 = Math.sqrt(-2 * Math.log(u3 + 1e-10)) * Math.cos(2 * Math.PI * u4)
      points.push([CLASS_CENTERS[c][0] + z1 * 1.2, CLASS_CENTERS[c][1] + z2 * 1.2])
      classIds.push(c)
    }
  }
  return { points, classIds }
}

function simulateStep(points, classIds, temperature, lr) {
  const n = points.length
  const nClasses = 4
  const centroids = Array.from({ length: nClasses }, () => [0, 0])
  const counts = new Array(nClasses).fill(0)
  for (let i = 0; i < n; i++) {
    centroids[classIds[i]][0] += points[i][0]
    centroids[classIds[i]][1] += points[i][1]
    counts[classIds[i]]++
  }
  for (let c = 0; c < nClasses; c++) {
    centroids[c][0] /= counts[c]; centroids[c][1] /= counts[c]
  }
  return points.map((p, i) => {
    const cId = classIds[i]
    let dx = lr * (centroids[cId][0] - p[0])
    let dy = lr * (centroids[cId][1] - p[1])
    for (let c = 0; c < nClasses; c++) {
      if (c === cId) continue
      const ddx = p[0] - centroids[c][0]
      const ddy = p[1] - centroids[c][1]
      const dist = Math.hypot(ddx, ddy) + 0.1
      const force = lr * 0.4 / (dist * temperature)
      dx += force * ddx / dist
      dy += force * ddy / dist
    }
    return [p[0] + dx, p[1] + dy]
  })
}

function drawShape(ctx, x, y, r, shape) {
  ctx.beginPath()
  if (shape === 'circle') {
    ctx.arc(x, y, r, 0, Math.PI * 2)
  } else if (shape === 'triangle') {
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r * 0.866, y + r * 0.5)
    ctx.lineTo(x - r * 0.866, y + r * 0.5)
    ctx.closePath()
  } else if (shape === 'square') {
    ctx.rect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6)
  } else if (shape === 'diamond') {
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r, y)
    ctx.lineTo(x, y + r)
    ctx.lineTo(x - r, y)
    ctx.closePath()
  }
}

function computeStats(points, classIds) {
  // Intra-class: average distance of each point to its class centroid
  const centroids = Array.from({ length: N_CLASSES }, () => [0, 0])
  const counts = new Array(N_CLASSES).fill(0)
  for (let i = 0; i < points.length; i++) {
    centroids[classIds[i]][0] += points[i][0]
    centroids[classIds[i]][1] += points[i][1]
    counts[classIds[i]]++
  }
  for (let c = 0; c < N_CLASSES; c++) {
    centroids[c][0] /= counts[c]; centroids[c][1] /= counts[c]
  }
  let intra = 0
  for (let i = 0; i < points.length; i++) {
    intra += Math.hypot(points[i][0] - centroids[classIds[i]][0], points[i][1] - centroids[classIds[i]][1])
  }
  intra /= points.length

  // Inter-class: average pairwise distance between class centroids
  let inter = 0, pairs = 0
  for (let a = 0; a < N_CLASSES; a++) {
    for (let b = a + 1; b < N_CLASSES; b++) {
      inter += Math.hypot(centroids[a][0] - centroids[b][0], centroids[a][1] - centroids[b][1])
      pairs++
    }
  }
  inter /= pairs
  return { intra, inter }
}

function toCanvas(val, w) {
  return ((val - VIEW[0]) / (VIEW[1] - VIEW[0])) * w
}

function drawScene(canvas, points, classIds) {
  const ctx = canvas.getContext('2d')
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
    canvas.width = W * dpr
    canvas.height = H * dpr
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)

  // Background
  ctx.fillStyle = 'var(--depth)'
  ctx.fillRect(0, 0, W, H)

  const dim = Math.min(W, H)
  const ox = (W - dim) / 2
  const oy = (H - dim) / 2

  function px(v) { return ox + toCanvas(v, dim) }
  function py(v) { return oy + toCanvas(v, dim) }

  // Axes
  ctx.strokeStyle = 'rgba(128,128,128,0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(ox, py(0)); ctx.lineTo(ox + dim, py(0))
  ctx.moveTo(px(0), oy); ctx.lineTo(px(0), oy + dim)
  ctx.stroke()

  // Compute centroids for dashed lines
  const centroids = Array.from({ length: N_CLASSES }, () => [0, 0])
  const counts = new Array(N_CLASSES).fill(0)
  for (let i = 0; i < points.length; i++) {
    centroids[classIds[i]][0] += points[i][0]
    centroids[classIds[i]][1] += points[i][1]
    counts[classIds[i]]++
  }
  for (let c = 0; c < N_CLASSES; c++) {
    centroids[c][0] /= counts[c]; centroids[c][1] /= counts[c]
  }

  // Dashed lines from each point to its class centroid
  ctx.save()
  ctx.setLineDash([3, 4])
  ctx.lineWidth = 1
  for (let i = 0; i < points.length; i++) {
    const c = classIds[i]
    const col = CLASS_COLORS[c]
    // Need to resolve CSS var for canvas — use fallback for var(--prime)
    ctx.strokeStyle = col.startsWith('var') ? '#7c6bff' : col
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.moveTo(px(points[i][0]), py(points[i][1]))
    ctx.lineTo(px(centroids[c][0]), py(centroids[c][1]))
    ctx.stroke()
  }
  ctx.restore()

  // Draw centroid markers (small cross)
  for (let c = 0; c < N_CLASSES; c++) {
    const cx = px(centroids[c][0])
    const cy = py(centroids[c][1])
    const col = CLASS_COLORS[c].startsWith('var') ? '#7c6bff' : CLASS_COLORS[c]
    ctx.strokeStyle = col
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy)
    ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // Draw points
  const r = 8
  for (let i = 0; i < points.length; i++) {
    const c = classIds[i]
    const col = CLASS_COLORS[c].startsWith('var') ? '#7c6bff' : CLASS_COLORS[c]
    const x = px(points[i][0])
    const y = py(points[i][1])
    ctx.fillStyle = col
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 1.2
    ctx.globalAlpha = 0.92
    drawShape(ctx, x, y, r, CLASS_SHAPES[c])
    ctx.fill()
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

export function ContrastiveViz() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const rafRef = useRef(null)
  const roRef = useRef(null)

  const [temperature, setTemperature] = useState(0.5)
  const [lr] = useState(0.05)
  const [stats, setStats] = useState({ intra: 0, inter: 0 })
  const [isRunning, setIsRunning] = useState(false)

  const getState = useCallback(() => {
    if (!stateRef.current) {
      const { points, classIds } = initPoints()
      stateRef.current = { points, classIds }
    }
    return stateRef.current
  }, [])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { points, classIds } = getState()
    drawScene(canvas, points, classIds)
    setStats(computeStats(points, classIds))
  }, [getState])

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    roRef.current = new ResizeObserver(() => { redraw() })
    roRef.current.observe(canvas)
    return () => roRef.current?.disconnect()
  }, [redraw])

  // Initial draw
  useEffect(() => { redraw() }, [redraw])

  const step = useCallback((n = 1, temp = null, lrVal = null) => {
    const state = getState()
    const t = temp ?? temperature
    const l = lrVal ?? lr
    for (let i = 0; i < n; i++) {
      state.points = simulateStep(state.points, state.classIds, t, l)
    }
    redraw()
  }, [getState, temperature, lr, redraw])

  const reset = useCallback(() => {
    const { points, classIds } = initPoints()
    stateRef.current = { points, classIds }
    setIsRunning(false)
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    redraw()
  }, [redraw])

  const run50 = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    let remaining = 50
    const tick = () => {
      if (remaining <= 0) { setIsRunning(false); return }
      step(1, temperature, lr)
      remaining--
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [isRunning, step, temperature, lr])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  const btnStyle = (disabled) => ({
    padding: '0.3rem 0.75rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    background: disabled ? 'var(--rim)' : 'var(--prime)',
    color: disabled ? 'var(--ink-ghost)' : '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.15s',
  })

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '320px', display: 'block', borderRadius: '6px' }}
      />

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
        {CLASS_COLORS.map((col, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--ink-dim)' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: col.startsWith('var') ? '#7c6bff' : col, borderRadius: CLASS_SHAPES[i] === 'circle' ? '50%' : '2px' }} />
            {`Class ${i}`}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
        <button style={btnStyle(isRunning)} disabled={isRunning} onClick={() => step(1)}>Step ×1</button>
        <button style={btnStyle(isRunning)} disabled={isRunning} onClick={() => step(10)}>Step ×10</button>
        <button style={btnStyle(isRunning)} disabled={isRunning} onClick={run50}>Run 50</button>
        <button style={btnStyle(false)} onClick={reset}>Reset</button>
      </div>

      {/* Sliders */}
      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--ink-dim)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ minWidth: '130px' }}>{`Temperature τ: ${temperature.toFixed(1)}`}</span>
          <input
            type="range" min="0.1" max="1.0" step="0.1"
            value={temperature}
            onChange={e => setTemperature(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--prime)' }}
          />
        </label>
      </div>

      {/* Stats */}
      <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--ink-dim)', fontVariantNumeric: 'tabular-nums' }}>
        {`Intra-class dist: ${stats.intra.toFixed(2)} | Inter-class dist: ${stats.inter.toFixed(2)}`}
      </div>
    </div>
  )
}
