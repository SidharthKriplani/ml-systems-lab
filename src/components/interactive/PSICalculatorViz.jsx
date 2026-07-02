import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive PSI: two histograms (training baseline vs live traffic) over 6 buckets.
// Drag "drift" to tilt the live distribution; PSI updates live and crosses the
// 0.1 (investigate) and 0.25 (retrain) action thresholds.

const TRAIN = [0.05, 0.14, 0.31, 0.29, 0.15, 0.06]  // baseline score buckets
const LABELS = ['0-.2', '.2-.4', '.4-.6', '.6-.8', '.8-.9', '.9-1']
const EPS = 1e-4

function liveDist(drift) {
  const k = drift * 1.1, c = 2.5
  const w = TRAIN.map((p, i) => p * Math.exp(k * (i - c)))
  const s = w.reduce((a, b) => a + b, 0)
  return w.map(v => v / s)
}
const psi = (a, b) => a.reduce((sum, ai, i) => {
  const p = Math.max(ai, EPS), q = Math.max(b[i], EPS)
  return sum + (q - p) * Math.log(q / p)
}, 0)

const band = (v) => v < 0.1 ? { c: '#22c55e', t: 'stable — no action' } : v < 0.25 ? { c: '#f59e0b', t: 'shift — investigate' } : { c: '#ef4444', t: 'major — retrain' }

export const PSICalculatorViz = forwardRef(function PSICalculatorViz(props, ref) {
  const [drift, setDrift] = useState(1.6)
  useImperativeHandle(ref, () => ({ reset: () => setDrift(1.6) }))

  const live = liveDist(drift)
  const val = psi(TRAIN, live)
  const b = band(val)

  const W = 360, H = 120, pad = 22, bw = (W - pad * 2) / 6, maxP = 0.45
  const y = (p) => H - 20 - (p / maxP) * (H - 40)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <line x1={pad} y1={H - 20} x2={W - pad} y2={H - 20} stroke="var(--rim)" />
        {TRAIN.map((p, i) => {
          const x = pad + i * bw
          return (
            <g key={i}>
              <rect x={x + 2} y={y(p)} width={bw - 4} height={H - 20 - y(p)} fill="none" stroke="var(--ink-low)" strokeWidth="1" strokeDasharray="2 2" />
              <rect x={x + bw * 0.18} y={y(live[i])} width={bw * 0.64} height={H - 20 - y(live[i])} fill={b.c} opacity="0.8" rx="1" />
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" fill="var(--ink-ghost)" fontSize="7">{LABELS[i]}</text>
            </g>
          )
        })}
        <text x={pad} y="12" fill="var(--ink-low)" fontSize="8">- - baseline (train)   ■ live traffic</text>
      </svg>

      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>distribution drift</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{drift.toFixed(1)}</span></div>
        <input type="range" min={0} max={3} step={0.1} value={drift} onChange={e => setDrift(+e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: `1px solid ${b.c}`, borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>PSI = Σ (q−p)·ln(q/p)</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: b.c }}>{val.toFixed(3)}</div>
          <div style={{ fontSize: '0.62rem', color: b.c }}>{b.t}</div>
        </div>
        <div style={{ flex: 1, fontSize: '0.62rem', color: 'var(--ink-low)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
          <div><span style={{ color: '#22c55e', fontWeight: 700 }}>&lt; 0.10</span> stable</div>
          <div><span style={{ color: '#f59e0b', fontWeight: 700 }}>0.10–0.25</span> investigate</div>
          <div><span style={{ color: '#ef4444', fontWeight: 700 }}>&gt; 0.25</span> retrain</div>
        </div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Each bucket contributes (q−p)·ln(q/p), so mass moving <i>either</i> direction adds up. PSI needs no labels — that's why it's the first drift alarm, days before accuracy can be measured.
      </div>
    </div>
  )
})
