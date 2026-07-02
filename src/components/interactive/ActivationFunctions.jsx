import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'

// ── Activation function definitions (parameterised) ──────────────────────────
// leak  → slope of Leaky ReLU for z < 0
// temp  → temperature T for sigmoid/tanh: f(z) = base(z / T). Lower T ⇒ sharper.

function sigmoid(z, T) { return 1 / (1 + Math.exp(-z / T)) }
function tanhF(z, T)   { return Math.tanh(z / T) }
function relu(z)       { return Math.max(0, z) }
function leakyRelu(z, leak) { return z >= 0 ? z : leak * z }
function gelu(z) {
  return 0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z ** 3)))
}

// Derivatives
function dSigmoid(z, T) { const s = sigmoid(z, T); return s * (1 - s) / T }
function dTanh(z, T)    { const t = Math.tanh(z / T); return (1 - t * t) / T }
function dRelu(z)       { return z >= 0 ? 1 : 0 }
function dLeakyRelu(z, leak) { return z >= 0 ? 1 : leak }
function dGelu(z) {
  const h = 1e-5
  return (gelu(z + h) - gelu(z - h)) / (2 * h)
}

// Each entry closes over the current params (leak, temp) so the curve recomputes live.
function buildFunctions(leak, temp) {
  return [
    { id: 'sigmoid', name: 'Sigmoid',    fn: z => sigmoid(z, temp),      dfn: z => dSigmoid(z, temp), color: '#f0a500' },
    { id: 'tanh',    name: 'Tanh',       fn: z => tanhF(z, temp),        dfn: z => dTanh(z, temp),    color: '#4EA8DE' },
    { id: 'relu',    name: 'ReLU',       fn: relu,                       dfn: dRelu,                  color: '#4CAF50' },
    { id: 'leaky',   name: 'Leaky ReLU', fn: z => leakyRelu(z, leak),    dfn: z => dLeakyRelu(z, leak), color: '#F4845F' },
    { id: 'gelu',    name: 'GELU',       fn: gelu,                       dfn: dGelu,                  color: '#A78BFA' },
  ]
}

const X_MIN = -4, X_MAX = 4
const Y_MIN = -1.2, Y_MAX = 1.5
const N_POINTS = 300

// Draws the selected functions (curve + optional derivative overlay) and a
// vertical marker at the chosen input x with dots at f(x)/f'(x).
function drawActivations(canvas, funcs, activeIds, overlayDeriv, xInput) {
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
  const zeroX = toX(0)
  ctx.beginPath(); ctx.moveTo(zeroX, PT); ctx.lineTo(zeroX, PT + cH); ctx.stroke()
  const zeroY = toY(0)
  ctx.beginPath(); ctx.moveTo(PL, zeroY); ctx.lineTo(PL + cW, zeroY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(PL, PT); ctx.lineTo(PL, PT + cH); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(PL, PT + cH); ctx.lineTo(PL + cW, PT + cH); ctx.stroke()

  // X tick labels
  ctx.fillStyle = inkMid
  ctx.font = `10px ${fontMono}`
  ctx.textAlign = 'center'
  xGrids.forEach(g => { ctx.fillText(g.toString(), toX(g), PT + cH + 14) })
  ctx.textAlign = 'right'
  yGrids.forEach(g => {
    const y = toY(g)
    if (y < PT || y > PT + cH) return
    ctx.fillText(g.toFixed(1), PL - 4, y + 3)
  })

  const xs = Array.from({ length: N_POINTS + 1 }, (_, i) => X_MIN + (X_MAX - X_MIN) * i / N_POINTS)

  const drawCurve = (fToUse, color, dashed) => {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.lineCap  = 'round'
    if (dashed) ctx.setLineDash([5, 4]); else ctx.setLineDash([])
    let firstPoint = true
    xs.forEach(x => {
      const y = clampY(fToUse(x))
      const cx = toX(x)
      const cy = toY(y)
      if (firstPoint) { ctx.moveTo(cx, cy); firstPoint = false } else ctx.lineTo(cx, cy)
    })
    ctx.stroke()
    ctx.setLineDash([])
  }

  const shown = funcs.filter(f => activeIds.includes(f.id))
  shown.forEach(({ fn, dfn, color }) => {
    drawCurve(fn, color, false)
    if (overlayDeriv) drawCurve(dfn, color, true)   // dashed = derivative
  })

  // Vertical input marker + value dots at x = xInput
  const mx = toX(xInput)
  ctx.strokeStyle = inkMid
  ctx.globalAlpha = 0.5
  ctx.setLineDash([3, 3])
  ctx.beginPath(); ctx.moveTo(mx, PT); ctx.lineTo(mx, PT + cH); ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1

  shown.forEach(({ fn, dfn, color }) => {
    const fy = toY(clampY(fn(xInput)))
    ctx.fillStyle = color
    ctx.beginPath(); ctx.arc(mx, fy, 4, 0, Math.PI * 2); ctx.fill()
    if (overlayDeriv) {
      const dy = toY(clampY(dfn(xInput)))
      ctx.beginPath(); ctx.arc(mx, dy, 3.2, 0, Math.PI * 2)
      ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke()
    }
  })
}

export const ActivationFunctions = forwardRef(function ActivationFunctions(props, ref) {
  const [overlayDeriv, setOverlayDeriv] = useState(false)
  const [activeIds, setActiveIds] = useState(['sigmoid', 'tanh', 'relu', 'leaky', 'gelu'])
  const [xInput, setXInput] = useState(1.0)
  const [leak, setLeak] = useState(0.1)
  const [temp, setTemp] = useState(1.0)
  const canvasRef = useRef(null)

  const funcs = buildFunctions(leak, temp)

  const toggleFn = (id) => setActiveIds(prev =>
    prev.includes(id) ? (prev.length > 1 ? prev.filter(f => f !== id) : prev) : [...prev, id]
  )

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = canvas.clientWidth  || 550
    canvas.height = canvas.clientHeight || 220
    drawActivations(canvas, funcs, activeIds, overlayDeriv, xInput)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayDeriv, activeIds, xInput, leak, temp])

  useEffect(() => {
    redraw()
    window.addEventListener('resize', redraw)
    return () => window.removeEventListener('resize', redraw)
  }, [redraw])

  useImperativeHandle(ref, () => ({
    play: () => {},
    pause: () => {},
    reset: () => { setOverlayDeriv(false); setActiveIds(['sigmoid', 'tanh', 'relu', 'leaky', 'gelu']); setXInput(1.0); setLeak(0.1); setTemp(1.0) },
    step: () => setOverlayDeriv(s => !s),
  }), [])

  // Live evaluated values for the readout table
  const rows = funcs.filter(f => activeIds.includes(f.id)).map(f => ({
    name: f.name, color: f.color, fx: f.fn(xInput), dfx: f.dfn(xInput),
  }))

  const showsTemp = activeIds.includes('sigmoid') || activeIds.includes('tanh')
  const showsLeak = activeIds.includes('leaky')

  const chip = (active, color) => ({
    padding: '4px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)',
    fontWeight: active ? 700 : 400,
    background: active ? color : 'transparent',
    color: active ? '#000' : 'var(--ink-mid)',
    border: '1px solid', borderColor: active ? color : 'var(--rim)',
    borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
  })

  const sliderStyle = { flex: 1, accentColor: 'var(--prime)', cursor: 'pointer' }
  const sliderLabel = { fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', minWidth: 78 }
  const monoVal = { fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--prime)', minWidth: 46, textAlign: 'right' }

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Function picker (multi-select) */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', marginRight: 2 }}>show:</span>
        {funcs.map(f => (
          <button key={f.id} onClick={() => toggleFn(f.id)} style={chip(activeIds.includes(f.id), f.color)}>
            {f.name}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button onClick={() => setOverlayDeriv(v => !v)} style={chip(overlayDeriv, 'var(--prime)')}>
          {overlayDeriv ? "f'(x) overlay: on" : "overlay f'(x)"}
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%', height: '220px', display: 'block',
          borderRadius: '6px', border: '1px solid var(--rim)', background: 'transparent',
        }}
      />

      {/* Input + parameter sliders */}
      <div style={{
        marginTop: '10px', padding: '10px 14px', background: 'var(--depth)',
        border: '1px solid var(--rim)', borderRadius: '6px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={sliderLabel}>input x</span>
          <input type="range" min={-4} max={4} step={0.05} value={xInput}
            onChange={e => setXInput(parseFloat(e.target.value))} style={sliderStyle} />
          <span style={monoVal}>{xInput.toFixed(2)}</span>
        </div>
        {showsTemp && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={sliderLabel}>temp T</span>
            <input type="range" min={0.2} max={3} step={0.05} value={temp}
              onChange={e => setTemp(parseFloat(e.target.value))} style={sliderStyle} />
            <span style={monoVal}>{temp.toFixed(2)}</span>
          </div>
        )}
        {showsLeak && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={sliderLabel}>leak α</span>
            <input type="range" min={0} max={0.5} step={0.01} value={leak}
              onChange={e => setLeak(parseFloat(e.target.value))} style={sliderStyle} />
            <span style={monoVal}>{leak.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Live readout at x */}
      <div style={{
        marginTop: '10px', padding: '8px 14px', background: 'var(--depth)',
        border: '1px solid var(--rim)', borderRadius: '6px',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          values at x = {xInput.toFixed(2)}
        </div>
        {rows.map(r => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ width: 14, height: 3, background: r.color, borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', minWidth: 78 }}>{r.name}</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-hi)' }}>f(x) = {r.fx.toFixed(3)}</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: Math.abs(r.dfx) < 0.02 ? '#ef4444' : 'var(--ink-mid)' }}>
              f&apos;(x) = {r.dfx.toFixed(3)}{Math.abs(r.dfx) < 0.02 ? '  ← ~0 (saturated)' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Annotation note */}
      <div style={{
        marginTop: '10px', padding: '8px 12px',
        background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.18)',
        borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)',
        color: 'var(--ink-mid)', lineHeight: 1.6,
      }}>
        Drag <b>input x</b> and watch each f(x) and f&apos;(x) update. Push x past ±2 on Sigmoid/Tanh — f&apos;(x) collapses toward 0 (vanishing gradient).
        Lower <b>temp T</b> sharpens the sigmoid/tanh toward a step; raise the <b>leak α</b> and Leaky ReLU stops zeroing negative gradients.
      </div>
    </div>
  )
})
