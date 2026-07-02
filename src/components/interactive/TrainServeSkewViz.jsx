import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive skew: an SVG bar chart of Offline vs Bulk vs Tail vs Production AUC.
// Skew hits the high-volume tail hardest; aggregate barely moves because the tail
// is small — which is exactly why it hides. Shared codepath (toggle) zeroes it.

const DEFAULTS = { approxErrPct: 8, tailShare: 15, sharedPath: false }
function scores(s) {
  const err = s.sharedPath ? 0 : s.approxErrPct
  const tail = s.tailShare / 100
  const tailAcc = 94 - Math.min(30, err * 1.6)
  const bulkAcc = 94 - Math.min(4, err * 0.12)
  const aggAcc = bulkAcc * (1 - tail) + tailAcc * tail
  return { baseline: 94, tailAcc, bulkAcc, aggAcc }
}

export const TrainServeSkewViz = forwardRef(function TrainServeSkewViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), [])

  const { baseline, tailAcc, bulkAcc, aggAcc } = scores(s)
  const bad = aggAcc < baseline - 3 || tailAcc < baseline - 8
  const bars = [
    { label: 'Offline (train)', v: baseline, c: 'var(--ink-low)' },
    { label: 'Bulk (low-vol)', v: bulkAcc, c: 'var(--prime)' },
    { label: 'Tail (high-vol)', v: tailAcc, c: tailAcc < 80 ? '#ef4444' : tailAcc < 90 ? '#f59e0b' : '#22c55e' },
    { label: 'Production (agg)', v: aggAcc, c: aggAcc < 88 ? '#ef4444' : aggAcc < 92 ? '#f59e0b' : '#22c55e' },
  ]
  const W = 360, H = 130, base = H - 22, top = 12, yMin = 60
  const sy = v => base - ((v - yMin) / (baseline - yMin)) * (base - top)
  const bw = 62, gap = (W - bars.length * bw) / (bars.length + 1)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <line x1="0" y1={sy(baseline)} x2={W} y2={sy(baseline)} stroke="var(--ink-low)" strokeDasharray="3 3" opacity="0.5" />
        <text x={W - 2} y={sy(baseline) - 3} textAnchor="end" fontSize="7.5" fill="var(--ink-ghost)">offline {baseline}</text>
        {bars.map((b, i) => {
          const x = gap + i * (bw + gap), y = sy(b.v)
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={base - y} fill={b.c} opacity="0.85" rx="2" />
              <text x={x + bw / 2} y={y - 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ink-hi)">{b.v.toFixed(1)}</text>
              <text x={x + bw / 2} y={base + 12} textAnchor="middle" fontSize="7.3" fill="var(--ink-low)">{b.label}</text>
            </g>
          )
        })}
      </svg>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>serving approximation error (high-vol)</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.sharedPath ? '0 (shared)' : s.approxErrPct + '%'}</span></div>
        <input type="range" min={0} max={15} value={s.approxErrPct} disabled={s.sharedPath} onChange={e => set('approxErrPct', +e.target.value)} style={{ width: '100%', opacity: s.sharedPath ? 0.4 : 1 }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>high-volume tail share (fraud-prone)</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.tailShare}%</span></div>
        <input type="range" min={2} max={40} value={s.tailShare} onChange={e => set('tailShare', +e.target.value)} style={{ width: '100%' }} />
      </div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.sharedPath} onChange={e => set('sharedPath', e.target.checked)} />
        one shared feature codepath (feature store) → train & serve run the same code
      </label>

      <div style={{ background: 'var(--depth)', border: `1px solid ${bad ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: '0.72rem', color: bad ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
          {s.sharedPath ? 'Shared path → offline = production. No skew to detect.'
            : bad ? `Silent skew: offline ${baseline}, production ${aggAcc.toFixed(1)} — and ${(baseline - tailAcc).toFixed(1)} pts worse on exactly the users most likely to be fraud.`
            : 'Small error → aggregate looks fine, but the tail bar is already sliding.'}
        </div>
      </div>
      <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        No exception is ever thrown. The Production bar barely dips below Offline because the tail is small — that's why skew hides. Toggle the shared path and Offline = Production by construction.
      </div>
    </div>
  )
})
