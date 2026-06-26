import { useState, useRef, useEffect, useCallback } from 'react'

// ── Activation function definitions ──────────────────────────────────────────

function sigmoid(z) { return 1 / (1 + Math.exp(-z)) }
function tanhF(z)   { return Math.tanh(z) }
function relu(z)    { return Math.max(0, z) }
function leakyRelu(z) { return z >= 0 ? z : 0.1 * z }
function gelu(z) {
  return 0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z ** 3)))
}

// Derivatives
function dSigmoid(z) { const s = sigmoid(z); return s * (1 - s) }
function dTanh(z)    { const t = Math.tanh(z); return 1 - t * t }
function dRelu(z)    { return z >= 0 ? 1 : 0 }
function dLeakyRelu(z) { return z >= 0 ? 1 : 0.1 }
function dGelu(z) {
  // Numerical derivative
  const h = 1e-5
  return (gelu(z + h) - gelu(z - h)) / (2 * h)
}

const FUNCTIONS = [
  { name: 'Sigmoid', fn: sigmoid, dfn: dSigmoid, color: '#f0a500' },   // amber (prime)
  { name: 'Tanh',    fn: tanhF,   dfn: dTanh,    color: '#4EA8DE' },   // blue
  { name: 'ReLU',    fn: relu,    dfn: dRelu,     color: '#4CAF50' },   // teal/green
  { name: 'Leaky ReLU', fn: leakyRelu, dfn: dLeakyRelu, color: '#F4845F' }, // coral
  { name: 'GELU',    fn: gelu,    dfn: dGelu,     color: '#A78BFA' },   // purple
]

const X_MIN = -4, X_MAX = 4
const Y_MIN = -1.2, Y_MAX = 1.5
const N_POINTS = 300

function drawActivations(canvas, showDerivative) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height
  const PL = 44, PR = 16, PT = 16, PB = 36
  const cW = W - PL - PR
  const cH = H - PT - PB

  const style = getComputedStyle(canvas)
  const rimColor  = style.getPropertyValue('--rim').trim()      || '#333'
  const inkMid    = style.getPropertyValue('--ink-mid').trim()  || '#aaa'
  const fontMono  = style.getPropertyValue('--font-mono').trim() || 'monospace'
  const bgDepth   = style.getPropertyValue('--depth').trim()    || 'transparent'

  ctx.clearRect(0, 0, W, H)

  const toX = z  => PL + (z - X_MIN) / (X_MAX - X_MIN) * cW
  const toY = y  => PT + (Y_MAX - y) / (Y_MAX - Y_MIN) * cH
  const clampY = y => Math.max(Y_MIN - 0.3, Math.min(Y_MAX + 0.3, y))

  // Grid lines
  ctx.strokeStyle = rimColor
  ctx.globalAlpha = 0.2
  ctx.lineWidth = 1
  const yGrids = [-1, -0.5, 0, 0.5, 1, 1.5]
  yGrids.forEach(g => {
    const y = toY(g)
    if (y < PT || y > PT + cH) return
    ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(PL + cW, y); ctx.stroke()
  })
  const xGrids = [-4, -2, 0, 2, 4]
  xGrids.forEach(g => {
    const x = toX(g)
    ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + cH); ctx.stroke()
  })
  ctx.globalAlpha = 1

  // Axes
  ctx.strokeStyle = rimColor
  ctx.lineWidth = 1
  // Y-axis (at x=0)
  const zeroX = toX(0)
  ctx.beginPath(); ctx.moveTo(zeroX, PT); ctx.lineTo(zeroX, PT + cH); ctx.stroke()
  // X-axis (at y=0)
  const zeroY = toY(0)
  ctx.beginPath(); ctx.moveTo(PL, zeroY); ctx.lineTo(PL + cW, zeroY); ctx.stroke()
  // Border
  ctx.beginPath(); ctx.moveTo(PL, PT); ctx.lineTo(PL, PT + cH); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(PL, PT + cH); ctx.lineTo(PL + cW, PT + cH); ctx.stroke()

  // X-axis tick labels
  ctx.fillStyle = inkMid
  ctx.font = `10px ${fontMono}`
  ctx.textAlign = 'center'
  xGrids.forEach(g => { ctx.fillText(g.toString(), toX(g), PT + cH + 14) })

  // Y-axis tick labels
  ctx.textAlign = 'right'
  yGrids.forEach(g => {
    const y = toY(g)
    if (y < PT || y > PT + cH) return
    ctx.fillText(g.toFixed(1), PL - 4, y + 3)
  })

  // Draw each function
  const xs = Array.from({ length: N_POINTS + 1 }, (_, i) => X_MIN + (X_MAX - X_MIN) * i / N_POINTS)

  FUNCTIONS.forEach(({ fn, dfn, color }) => {
    const fToUse = showDerivative ? dfn : fn
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.lineCap  = 'round'

    let firstPoint = true
    xs.forEach(x => {
      const rawY = fToUse(x)
      const y = clampY(rawY)
      const cx = toX(x)
      const cy = toY(y)
      if (firstPoint) {
        ctx.moveTo(cx, cy)
        firstPoint = false
      } else {
        ctx.lineTo(cx, cy)
      }
    })
    ctx.stroke()
  })
}

export function ActivationFunctions() {
  const [showDerivative, setShowDerivative] = useState(false)
  const canvasRef = useRef(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = canvas.clientWidth  || 550
    canvas.height = canvas.clientHeight || 220
    drawActivations(canvas, showDerivative)
  }, [showDerivative])

  useEffect(() => {
    redraw()
    window.addEventListener('resize', redraw)
    return () => window.removeEventListener('resize', redraw)
  }, [redraw])

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        {['Function', 'Derivative'].map((label, i) => {
          const active = showDerivative === (i === 1)
          return (
            <button
              key={label}
              onClick={() => setShowDerivative(i === 1)}
              style={{
                padding: '5px 16px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                fontWeight: active ? 700 : 400,
                background: active ? 'var(--prime)' : 'transparent',
                color: active ? '#000' : 'var(--ink-mid)',
                border: '1px solid',
                borderColor: active ? 'var(--prime)' : 'var(--rim)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          )
        })}
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginLeft: '4px' }}>
          {showDerivative ? `f'(z)` : 'f(z)'}  · x ∈ [-4, 4]
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '220px',
          display: 'block',
          borderRadius: '6px',
          border: '1px solid var(--rim)',
          background: 'transparent',
        }}
      />

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        marginTop: '10px',
        padding: '8px 14px',
        background: 'var(--depth)',
        border: '1px solid var(--rim)',
        borderRadius: '6px',
      }}>
        {FUNCTIONS.map(({ name, color }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '18px',
              height: '3px',
              background: color,
              borderRadius: '2px',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)' }}>
              {name}
            </span>
          </div>
        ))}
      </div>

      {/* Annotation note */}
      <div style={{
        marginTop: '10px',
        padding: '8px 12px',
        background: 'rgba(240,165,0,0.06)',
        border: '1px solid rgba(240,165,0,0.18)',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--ink-mid)',
        lineHeight: 1.6,
      }}>
        {showDerivative
          ? `Sigmoid & tanh gradients → 0 for |z| > 2 (vanishing gradient). ReLU gradient = 1 for z > 0.`
          : `Sigmoid & tanh saturate for large |z|, causing vanishing gradients in deep nets. ReLU avoids this — gradient = 1 for z > 0.`}
      </div>
    </div>
  )
}
