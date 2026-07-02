import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'

function loss(w1, w2) {
  return (
    0.5 * w1 ** 2 +
    2 * w2 ** 2 +
    0.8 * Math.sin(2 * w1) * Math.cos(2 * w2) +
    0.3 * Math.sin(5 * w1 + 1) +
    0.2 * w1 * w2
  )
}

function gradLoss(w1, w2) {
  const dw1 =
    w1 + 1.6 * Math.cos(2 * w1) * Math.cos(2 * w2) + 1.5 * Math.cos(5 * w1 + 1) + 0.2 * w2
  const dw2 = 4 * w2 - 1.6 * Math.sin(2 * w1) * Math.sin(2 * w2) + 0.2 * w1
  return [dw1, dw2]
}

const DOMAIN = [-3, 3]
const START = [-2.5, 2.0]
const MAX_STEPS = 200

const OPTIMIZERS = [
  { key: 'sgd',      label: 'SGD',      color: '#e85d4a' },
  { key: 'momentum', label: 'Momentum', color: '#4a9ebb' },
  { key: 'adam',     label: 'Adam',     color: null }, // uses var(--prime) → resolved at render
]

function makeOptimizerState() {
  return {
    sgd: {
      w: [...START],
      path: [[...START]],
      step: 0,
    },
    momentum: {
      w: [...START],
      v: [0, 0],
      path: [[...START]],
      step: 0,
    },
    adam: {
      w: [...START],
      m: [0, 0],
      v: [0, 0],
      t: 0,
      path: [[...START]],
      step: 0,
    },
  }
}

function stepSGD(state) {
  if (state.step >= MAX_STEPS) return
  const [g1, g2] = gradLoss(state.w[0], state.w[1])
  const lr = 0.05
  state.w[0] -= lr * g1
  state.w[1] -= lr * g2
  state.step++
  state.path.push([state.w[0], state.w[1]])
}

function stepMomentum(state) {
  if (state.step >= MAX_STEPS) return
  const [g1, g2] = gradLoss(state.w[0], state.w[1])
  const lr = 0.05
  const beta = 0.9
  state.v[0] = beta * state.v[0] + g1
  state.v[1] = beta * state.v[1] + g2
  state.w[0] -= lr * state.v[0]
  state.w[1] -= lr * state.v[1]
  state.step++
  state.path.push([state.w[0], state.w[1]])
}

function stepAdam(state) {
  if (state.step >= MAX_STEPS) return
  const [g1, g2] = gradLoss(state.w[0], state.w[1])
  const lr = 0.1
  const beta1 = 0.9
  const beta2 = 0.999
  const eps = 1e-8
  state.t++
  state.m[0] = beta1 * state.m[0] + (1 - beta1) * g1
  state.m[1] = beta1 * state.m[1] + (1 - beta1) * g2
  state.v[0] = beta2 * state.v[0] + (1 - beta2) * g1 * g1
  state.v[1] = beta2 * state.v[1] + (1 - beta2) * g2 * g2
  const mHat0 = state.m[0] / (1 - beta1 ** state.t)
  const mHat1 = state.m[1] / (1 - beta1 ** state.t)
  const vHat0 = state.v[0] / (1 - beta2 ** state.t)
  const vHat1 = state.v[1] / (1 - beta2 ** state.t)
  state.w[0] -= lr * mHat0 / (Math.sqrt(vHat0) + eps)
  state.w[1] -= lr * mHat1 / (Math.sqrt(vHat1) + eps)
  state.step++
  state.path.push([state.w[0], state.w[1]])
}

function advanceAll(optState, n = 1) {
  for (let i = 0; i < n; i++) {
    stepSGD(optState.sgd)
    stepMomentum(optState.momentum)
    stepAdam(optState.adam)
  }
}

// Pre-compute loss grid for heatmap
const GRID = 80
const lossGrid = new Float32Array(GRID * GRID)
let lossMin = Infinity
let lossMax = -Infinity
for (let j = 0; j < GRID; j++) {
  for (let i = 0; i < GRID; i++) {
    const w1 = DOMAIN[0] + (i / (GRID - 1)) * (DOMAIN[1] - DOMAIN[0])
    const w2 = DOMAIN[0] + (j / (GRID - 1)) * (DOMAIN[1] - DOMAIN[0])
    const v = loss(w1, w2)
    lossGrid[j * GRID + i] = v
    if (v < lossMin) lossMin = v
    if (v > lossMax) lossMax = v
  }
}

// Color interpolation: dark blue → teal → gold
function lossToColor(normVal) {
  // 0 = min (dark blue), 1 = max (warm gold)
  const stops = [
    [0.0,  [15,  25,  60]],
    [0.25, [20,  80, 120]],
    [0.5,  [40, 130, 140]],
    [0.75, [180, 150, 40]],
    [1.0,  [220, 170, 30]],
  ]
  let lo = stops[0], hi = stops[stops.length - 1]
  for (let s = 0; s < stops.length - 1; s++) {
    if (normVal >= stops[s][0] && normVal <= stops[s + 1][0]) {
      lo = stops[s]; hi = stops[s + 1]; break
    }
  }
  const t = lo[0] === hi[0] ? 0 : (normVal - lo[0]) / (hi[0] - lo[0])
  return [
    Math.round(lo[1][0] + t * (hi[1][0] - lo[1][0])),
    Math.round(lo[1][1] + t * (hi[1][1] - lo[1][1])),
    Math.round(lo[1][2] + t * (hi[1][2] - lo[1][2])),
  ]
}

// Build heatmap ImageData once
function buildHeatmap(width, height) {
  const img = new ImageData(width, height)
  const data = img.data
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      // Map pixel to grid
      const gi = (px / (width - 1)) * (GRID - 1)
      const gj = (py / (height - 1)) * (GRID - 1)
      const gi0 = Math.floor(gi), gi1 = Math.min(gi0 + 1, GRID - 1)
      const gj0 = Math.floor(gj), gj1 = Math.min(gj0 + 1, GRID - 1)
      const tx = gi - gi0, ty = gj - gj0
      // Bilinear interpolation
      const v =
        lossGrid[gj0 * GRID + gi0] * (1 - tx) * (1 - ty) +
        lossGrid[gj0 * GRID + gi1] * tx * (1 - ty) +
        lossGrid[gj1 * GRID + gi0] * (1 - tx) * ty +
        lossGrid[gj1 * GRID + gi1] * tx * ty
      const norm = Math.pow((v - lossMin) / (lossMax - lossMin), 0.55)
      const [r, g, b] = lossToColor(norm)
      const idx = (py * width + px) * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }
  return img
}

// Map world coords to canvas coords
function worldToCanvas(w1, w2, size) {
  const x = ((w1 - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * size
  const y = ((w2 - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * size
  // w2 axis: top = DOMAIN[1], bottom = DOMAIN[0] → flip y
  return [x, size - y]
}

const CONTOUR_LEVELS = [0.5, 1.0, 1.5, 2.0, 3.0, 5.0]

export const LossLandscapeViz = forwardRef(function LossLandscapeViz(props, ref) {
  const canvasRef = useRef(null)
  const optStateRef = useRef(makeOptimizerState())
  const rafRef = useRef(null)
  const runningRef = useRef(false)
  const speedRef = useRef(2)
  const lastStepTimeRef = useRef(0)
  const heatmapCacheRef = useRef(null)
  const primColorRef = useRef('#c9a227')

  const [stats, setStats] = useState({ sgd: null, momentum: null, adam: null })
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(2)

  // Resolve --prime CSS variable once mounted
  useEffect(() => {
    const el = document.documentElement
    const prime = getComputedStyle(el).getPropertyValue('--prime').trim()
    if (prime) primColorRef.current = prime
  }, [])

  const getSize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 0
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    return Math.min(w, h)
  }, [])

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const size = getSize()
    if (size <= 0) return

    // Resize canvas backing store if needed
    const needed = Math.round(size * dpr)
    if (canvas.width !== needed || canvas.height !== needed) {
      canvas.width = needed
      canvas.height = needed
      heatmapCacheRef.current = null
    }

    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.scale(dpr, dpr)

    // Draw heatmap
    if (!heatmapCacheRef.current) {
      heatmapCacheRef.current = buildHeatmap(size, size)
    }
    ctx.putImageData(heatmapCacheRef.current, 0, 0)

    // Draw contour lines (iso-lines by band coloring already in heatmap;
    // add thin white lines at contour levels)
    ctx.lineWidth = 0.6
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    const cSize = 100
    for (const level of CONTOUR_LEVELS) {
      // Simple marching-squares: scan rows for crossings
      ctx.beginPath()
      for (let gj = 0; gj < GRID - 1; gj++) {
        for (let gi = 0; gi < GRID - 1; gi++) {
          const v00 = lossGrid[gj * GRID + gi]
          const v10 = lossGrid[gj * GRID + (gi + 1)]
          const v01 = lossGrid[(gj + 1) * GRID + gi]
          const v11 = lossGrid[(gj + 1) * GRID + (gi + 1)]
          const corners = [
            (v00 >= level) ? 1 : 0,
            (v10 >= level) ? 1 : 0,
            (v11 >= level) ? 1 : 0,
            (v01 >= level) ? 1 : 0,
          ]
          const idx = corners[0] | (corners[1] << 1) | (corners[2] << 2) | (corners[3] << 3)
          if (idx === 0 || idx === 15) continue

          // Interpolate edge crossings
          const x0 = (gi / (GRID - 1)) * size
          const x1 = ((gi + 1) / (GRID - 1)) * size
          const y0 = (gj / (GRID - 1)) * size
          const y1 = ((gj + 1) / (GRID - 1)) * size

          function lerp(a, b, va, vb) {
            if (Math.abs(vb - va) < 1e-10) return (a + b) / 2
            return a + (level - va) / (vb - va) * (b - a)
          }

          // Edges: top(0-1), right(1-2), bottom(3-2), left(0-3)
          const edges = {
            top:    [lerp(x0, x1, v00, v10), y0],
            right:  [x1, lerp(y0, y1, v10, v11)],
            bottom: [lerp(x0, x1, v01, v11), y1],
            left:   [x0, lerp(y0, y1, v00, v01)],
          }

          // Standard marching squares cases → pairs of edges
          const lines = {
            1:  [edges.left, edges.top],
            2:  [edges.top, edges.right],
            3:  [edges.left, edges.right],
            4:  [edges.right, edges.bottom],
            5:  [edges.left, edges.top, edges.right, edges.bottom], // ambiguous → 2 segs
            6:  [edges.top, edges.bottom],
            7:  [edges.left, edges.bottom],
            8:  [edges.left, edges.bottom],
            9:  [edges.top, edges.bottom],
            10: [edges.left, edges.top, edges.right, edges.bottom],
            11: [edges.top, edges.right],
            12: [edges.left, edges.right],
            13: [edges.right, edges.bottom],
            14: [edges.left, edges.top],
          }

          const pts = lines[idx]
          if (!pts) continue
          if (pts.length === 4) {
            ctx.moveTo(pts[0][0], pts[0][1])
            ctx.lineTo(pts[1][0], pts[1][1])
            ctx.moveTo(pts[2][0], pts[2][1])
            ctx.lineTo(pts[3][0], pts[3][1])
          } else {
            ctx.moveTo(pts[0][0], pts[0][1])
            ctx.lineTo(pts[1][0], pts[1][1])
          }
        }
      }
      ctx.stroke()
    }

    const optState = optStateRef.current
    const adamColor = primColorRef.current

    // Draw paths
    const pathConfigs = [
      { state: optState.sgd, color: '#e85d4a' },
      { state: optState.momentum, color: '#4a9ebb' },
      { state: optState.adam, color: adamColor },
    ]

    for (const { state, color } of pathConfigs) {
      if (state.path.length < 2) continue
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.85
      const [px0, py0] = worldToCanvas(state.path[0][0], state.path[0][1], size)
      ctx.moveTo(px0, py0)
      for (let i = 1; i < state.path.length; i++) {
        const [px, py] = worldToCanvas(state.path[i][0], state.path[i][1], size)
        ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Mark start □
    const [sx, sy] = worldToCanvas(START[0], START[1], size)
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 1.5
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(sx - 5, sy - 5, 10, 10)
    ctx.strokeRect(sx - 5, sy - 5, 10, 10)

    // Mark global min ★ at approx (0, 0)
    const [mx, my] = worldToCanvas(0, 0, size)
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(size * 0.04)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('★', mx, my)

    // Draw current position circles
    for (const { state, color } of pathConfigs) {
      const last = state.path[state.path.length - 1]
      const [cx, cy] = worldToCanvas(last[0], last[1], size)
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    ctx.restore()
  }, [getSize])

  const updateStats = useCallback(() => {
    const s = optStateRef.current
    setStats({
      sgd: {
        step: s.sgd.step,
        loss: loss(s.sgd.w[0], s.sgd.w[1]),
      },
      momentum: {
        step: s.momentum.step,
        loss: loss(s.momentum.w[0], s.momentum.w[1]),
      },
      adam: {
        step: s.adam.step,
        loss: loss(s.adam.w[0], s.adam.w[1]),
      },
    })
  }, [])

  const animate = useCallback((now) => {
    const s = optStateRef.current
    const allDone =
      s.sgd.step >= MAX_STEPS &&
      s.momentum.step >= MAX_STEPS &&
      s.adam.step >= MAX_STEPS

    // Time-gate: advance a batch of steps only every STEP_INTERVAL ms so a full
    // 200-step run takes ~5s and is actually observable. speed slider scales the
    // number of steps taken per gated tick.
    const STEP_INTERVAL = 140
    const t = typeof now === 'number' ? now : performance.now()
    if (!allDone && t - lastStepTimeRef.current >= STEP_INTERVAL) {
      lastStepTimeRef.current = t
      advanceAll(s, speedRef.current * 3)
      drawFrame()
      updateStats()
    }

    if (!allDone && runningRef.current) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      runningRef.current = false
      setRunning(false)
    }
  }, [drawFrame, updateStats])

  const pause = useCallback(() => {
    runningRef.current = false
    setRunning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const handleRun = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true
    setRunning(true)
    lastStepTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(animate)
  }, [animate])

  const handleReset = useCallback(() => {
    runningRef.current = false
    setRunning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    optStateRef.current = makeOptimizerState()
    drawFrame()
    setStats({ sgd: null, momentum: null, adam: null })
  }, [drawFrame])

  const handleStep = useCallback(() => {
    if (runningRef.current) return
    advanceAll(optStateRef.current, 1)
    drawFrame()
    updateStats()
  }, [drawFrame, updateStats])

  const handleSpeedChange = useCallback((e) => {
    const v = Number(e.target.value)
    speedRef.current = v
    setSpeed(v)
  }, [])

  useImperativeHandle(ref, () => ({ play: handleRun, pause, reset: handleReset, step: handleStep }), [handleRun, pause, handleReset, handleStep])

  // Initial draw + ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    drawFrame()

    const ro = new ResizeObserver(() => {
      heatmapCacheRef.current = null
      drawFrame()
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [drawFrame])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const adamColor = primColorRef.current
  const statsRows = [
    { key: 'sgd', label: 'SGD', color: '#e85d4a' },
    { key: 'momentum', label: 'Momentum', color: '#4a9ebb' },
    { key: 'adam', label: 'Adam', color: adamColor },
  ]

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Canvas */}
      <div style={{ position: 'relative', width: '100%', height: '380px' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            borderRadius: '6px',
          }}
        />
        {/* Legend overlay */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '0.68rem',
          lineHeight: '1.6',
        }}>
          {statsRows.map(({ key, label, color }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '3px',
                background: color,
                borderRadius: '2px',
              }} />
              <span style={{ color: '#eee' }}>{label}</span>
            </div>
          ))}
          <div style={{ marginTop: '4px', color: '#ccc', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '4px' }}>
            <span style={{ marginRight: '8px' }}>□ start</span>
            <span>★ min</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={handleRun}
          disabled={running}
          style={{
            padding: '0.3rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            background: running ? 'var(--rim)' : 'var(--prime)',
            color: running ? 'var(--ink-ghost)' : '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          Run
        </button>
        <button
          onClick={handleStep}
          disabled={running}
          style={{
            padding: '0.3rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            background: 'var(--depth)',
            color: running ? 'var(--ink-ghost)' : 'var(--ink)',
            border: '1px solid var(--rim)',
            borderRadius: '5px',
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          Step
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: '0.3rem 0.75rem',
            fontSize: '0.78rem',
            fontWeight: 600,
            background: 'var(--depth)',
            color: 'var(--ink)',
            border: '1px solid var(--rim)',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--ink-muted)',
          marginLeft: 'auto',
        }}>
          Speed
          <input
            type="range"
            min={1}
            max={10}
            value={speed}
            onChange={handleSpeedChange}
            style={{ width: '80px', accentColor: 'var(--prime)' }}
          />
          <span style={{ minWidth: '1.2ch' }}>{speed}</span>
        </label>
      </div>

      {/* Stats panel */}
      <div style={{
        marginTop: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        background: 'var(--depth)',
        borderRadius: '6px',
        padding: '0.6rem 0.9rem',
        border: '1px solid var(--rim)',
      }}>
        {statsRows.map(({ key, label, color }) => {
          const s = stats[key]
          return (
            <div key={key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              fontFamily: 'var(--mono, monospace)',
            }}>
              <span style={{ color, fontWeight: 700, minWidth: '80px' }}>{label}</span>
              <span style={{ color: 'var(--ink-muted)' }}>
                {s
                  ? `step ${s.step} / ${MAX_STEPS}  ·  loss ${s.loss.toFixed(4)}`
                  : 'not started'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})
