import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches label delay + the completeness curve. Chargebacks arrive over days; the
// most recent window is under-labeled because the evidence hasn't shown up yet.
// Slide the incubation cutoff: too short -> recent positives missing -> model
// "learns" recent traffic is safe. Set the cutoff at the ~99th percentile of the
// completeness curve to trade a little recency for honest labels.

const DEFAULTS = {
  cutoffDays: 1,   // how many days you wait before calling a label final
  p99Day: 7,       // the 99th-percentile settle day of the completeness curve
}

// completeness(d) = fraction of a cohort's true positives observed by day d.
// saturating curve reaching ~0.99 at p99Day.
function completeness(d, p99) {
  if (d <= 0) return 0
  const k = 4.6 / Math.max(1, p99)      // so completeness(p99) ~ 0.99
  return 1 - Math.exp(-k * d)
}

export const LabelDelayViz = forwardRef(function LabelDelayViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const observed = completeness(s.cutoffDays, s.p99Day)   // fraction of positives you'd see
  const missingPct = (1 - observed) * 100
  const bad = missingPct > 10

  // curve plot
  const W = 336, H = 96, padL = 26, padR = 8, padT = 8, padB = 20
  const days = 14
  const xOf = d => padL + (W - padL - padR) * (d / days)
  const yOf = c => padT + (H - padT - padB) * (1 - c)
  const pts = []
  for (let d = 0; d <= days; d += 0.5) pts.push(`${xOf(d).toFixed(1)},${yOf(completeness(d, s.p99Day)).toFixed(1)}`)
  const cutX = xOf(s.cutoffDays)
  const p99X = xOf(s.p99Day)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }}>
        {/* axes */}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="var(--ink-low)" strokeWidth="0.75" />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="var(--ink-low)" strokeWidth="0.75" />
        {[0, 0.5, 1].map(c => (
          <text key={c} x={padL - 3} y={yOf(c) + 3} textAnchor="end" fill="var(--ink-ghost)" fontSize="6.5">{(c * 100).toFixed(0)}%</text>
        ))}
        {/* completeness curve */}
        <polyline points={pts.join(' ')} fill="none" stroke="var(--prime)" strokeWidth="1.75" />
        {/* p99 line */}
        <line x1={p99X} y1={padT} x2={p99X} y2={H - padB} stroke="#22c55e" strokeWidth="1" strokeDasharray="3 2" />
        <text x={p99X} y={padT + 6} textAnchor="middle" fill="#22c55e" fontSize="7">p99 day {s.p99Day}</text>
        {/* cutoff line */}
        <line x1={cutX} y1={padT} x2={cutX} y2={H - padB} stroke={bad ? '#ef4444' : 'var(--amber)'} strokeWidth="1.5" />
        <circle cx={cutX} cy={yOf(observed)} r={3} fill={bad ? '#ef4444' : 'var(--amber)'} />
        <text x={W - padR} y={H - padB + 12} textAnchor="end" fill="var(--ink-ghost)" fontSize="6.5">days since event</text>
      </svg>

      <div style={{ marginTop: 6, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Incubation cutoff — how long you wait before a label is "final"</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.cutoffDays} day{s.cutoffDays !== 1 ? 's' : ''}</span>
        </div>
        <input type="range" min={0} max={14} value={s.cutoffDays} onChange={e => set('cutoffDays', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Chargeback settle time (99th pct of the completeness curve)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.p99Day} days</span>
        </div>
        <input type="range" min={2} max={14} value={s.p99Day} onChange={e => set('p99Day', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Positives observed at cutoff</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: bad ? '#ef4444' : '#22c55e' }}>{(observed * 100).toFixed(0)}%</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Fraud silently missing</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: bad ? '#ef4444' : '#22c55e' }}>{missingPct.toFixed(0)}%</div>
        </div>
      </div>

      <div style={{ marginTop: 10, background: 'var(--depth)', border: `1px solid ${bad ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem', color: bad ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
        {bad
          ? `Cutoff too short: ${missingPct.toFixed(0)}% of real fraud hasn't been labeled yet. The model learns recent traffic is "safe" — a data-construction artifact, not a pattern.`
          : `Cutoff at/after the p99 day captures ~all positives. You trade ${s.cutoffDays} days of recency for honest labels.`}
      </div>
      <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Don't guess the wait — measure the completeness curve, then set the incubation period at its 99th
        percentile. Move the green line right (slower chargebacks) and a fixed cutoff misses far more.
      </div>
    </div>
  )
})
