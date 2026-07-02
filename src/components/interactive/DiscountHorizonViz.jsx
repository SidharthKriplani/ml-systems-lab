import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive discount curve: an SVG plot of γ^t decaying over t, with the effective
// horizon 1/(1−γ) marked and the 1/e reference line. Slide γ and watch how far the
// future reaches — and how the horizon (and value variance) grows.

const DEFAULT_GAMMA = 0.9
const horizon = (g) => (g >= 1 ? Infinity : 1 / (1 - g))

export const DiscountHorizonViz = forwardRef(function DiscountHorizonViz(props, ref) {
  const [gamma, setGamma] = useState(DEFAULT_GAMMA)
  useImperativeHandle(ref, () => ({ reset: () => setGamma(DEFAULT_GAMMA) }))

  const h = horizon(gamma)
  const pathValue = (len) => Math.pow(gamma, len) * 1 - 0.01 * (1 - Math.pow(gamma, len)) / (1 - gamma || 1e-6)
  const v5 = pathValue(5), v10 = pathValue(10)

  const W = 360, H = 130, padL = 30, padB = 20, top = 12, TMAX = 100
  const sx = t => padL + (t / TMAX) * (W - padL - 12)
  const sy = w => (H - padB) - w * (H - padB - top)
  const pts = []
  for (let t = 0; t <= TMAX; t += 1) pts.push(`${sx(t).toFixed(1)},${sy(Math.pow(gamma, t)).toFixed(1)}`)
  const hx = sx(Math.min(h, TMAX))

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <line x1={padL} y1={H - padB} x2={W - 12} y2={H - padB} stroke="var(--rim)" />
        <line x1={padL} y1={top} x2={padL} y2={H - padB} stroke="var(--rim)" />
        {/* 1/e reference */}
        <line x1={padL} y1={sy(0.368)} x2={W - 12} y2={sy(0.368)} stroke="var(--ink-low)" strokeDasharray="2 3" opacity="0.5" />
        <text x={W - 12} y={sy(0.368) - 2} textAnchor="end" fontSize="7" fill="var(--ink-ghost)">1/e</text>
        {/* horizon marker */}
        {isFinite(h) && h <= TMAX && <line x1={hx} y1={top} x2={hx} y2={H - padB} stroke="var(--prime)" strokeWidth="1.5" strokeDasharray="4 3" />}
        {isFinite(h) && h <= TMAX && <text x={hx + 3} y={top + 8} fontSize="7.5" fill="var(--prime)">horizon ~{Math.round(h)}</text>}
        <polyline points={pts.join(' ')} fill="none" stroke="var(--prime)" strokeWidth="2.5" />
        <text x={padL} y={top - 2} fontSize="8" fill="var(--ink-low)">γᵗ (value of +1 t steps away)</text>
        <text x={W - 12} y={H - padB + 12} textAnchor="end" fontSize="8" fill="var(--ink-ghost)">t (steps) →</text>
      </svg>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}><span>discount factor γ</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{gamma.toFixed(3)}</span></div>
        <input type="range" min={0} max={0.999} step={0.001} value={gamma} onChange={e => setGamma(+e.target.value)} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--ink-ghost)' }}><span>0 (myopic)</span><span>0.999 (far-sighted)</span></div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>effective horizon 1/(1−γ)</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--prime)' }}>{isFinite(h) ? `~${Math.round(h)} steps` : '∞'}</div>
        </div>
        <div style={{ flex: 1.3, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>grid robot (+1 goal, −0.01/step)</div>
          <div style={{ fontSize: '0.72rem' }}>5-step <b style={{ color: 'var(--ink-hi)' }}>{v5.toFixed(3)}</b> · 10-step <b style={{ color: 'var(--ink-hi)' }}>{v10.toFixed(3)}</b></div>
          <div style={{ fontSize: '0.66rem', color: v5 > v10 ? 'var(--prime)' : 'var(--amber)' }}>shorter path wins by {(v5 - v10).toFixed(3)}</div>
        </div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        At γ=0.9 a reward 100 steps away is worth 0.00003 — invisible. Push γ to 0.99 and the curve barely bends: that reward is now worth 0.37 and the agent plans 10× further — but every value estimate carries 10× the variance. Horizon is a training-difficulty dial, not a free knob.
      </div>
    </div>
  )
})
