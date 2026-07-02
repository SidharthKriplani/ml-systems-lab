import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: training-serving skew is silent and NOT uniform. The serving path
// approximates a count; the error grows with volume, so it lands hardest on the
// high-volume users who are the most likely to be fraud. Aggregate accuracy barely
// moves; accuracy on the tail collapses. Sharing one codepath (approxError=0) fixes it.

const DEFAULTS = {
  approxErrPct: 8,   // % error the serving-side approximation introduces at high volume
  tailShare: 15,     // % of traffic that is "high-volume" (where the approx error bites)
  sharedPath: false, // one shared feature-computation path -> zero skew
}

// crude but honest: accuracy loss scales with the effective error the model sees.
// low-volume users see ~0 error; high-volume (tail) users see the full approxErr.
function scores(s) {
  const err = s.sharedPath ? 0 : s.approxErrPct
  const tail = s.tailShare / 100
  const tailDrop = Math.min(30, err * 1.6)   // tail users hit hard
  const bulkDrop = Math.min(4, err * 0.12)   // bulk users barely move
  const baseline = 94
  const tailAcc = baseline - tailDrop
  const bulkAcc = baseline - bulkDrop
  const aggAcc = bulkAcc * (1 - tail) + tailAcc * tail
  return { baseline, tailAcc, bulkAcc, aggAcc, err }
}

export const TrainServeSkewViz = forwardRef(function TrainServeSkewViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const { baseline, tailAcc, bulkAcc, aggAcc } = scores(s)
  const bad = aggAcc < baseline - 3 || tailAcc < baseline - 8

  const Bar = ({ label, val, hi }) => {
    const pct = Math.max(0, Math.min(100, val))
    const color = hi ? (val < 80 ? '#ef4444' : val < 90 ? '#f59e0b' : '#22c55e') : 'var(--prime)'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <div style={{ width: 148, fontSize: '0.64rem', color: 'var(--ink-low)', textAlign: 'right' }}>{label}</div>
        <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 4, height: 15, position: 'relative' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, opacity: 0.85 }} />
        </div>
        <div style={{ width: 42, fontSize: '0.64rem', color: 'var(--ink-hi)', fontWeight: 700 }}>{val.toFixed(1)}</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Serving-side approximation error (high-volume users)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.sharedPath ? '0 (shared path)' : `${s.approxErrPct}%`}</span>
        </div>
        <input type="range" min={0} max={15} value={s.approxErrPct} disabled={s.sharedPath}
          onChange={e => set('approxErrPct', +e.target.value)} style={{ width: '100%', opacity: s.sharedPath ? 0.4 : 1 }} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Share of traffic that is high-volume (the fraud-prone tail)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.tailShare}%</span>
        </div>
        <input type="range" min={2} max={40} value={s.tailShare} onChange={e => set('tailShare', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.sharedPath} onChange={e => set('sharedPath', e.target.checked)} />
        One shared feature-computation path (feature store) — training and serving run the <em>same</em> code
      </label>

      <Bar label="Offline AUC (training path)" val={baseline} />
      <Bar label="Bulk users (low volume)" val={bulkAcc} hi />
      <Bar label="Tail users (high volume)" val={tailAcc} hi />
      <Bar label="Production AUC (aggregate)" val={aggAcc} hi />

      <div style={{ marginTop: 10, background: 'var(--depth)', border: `1px solid ${bad ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: '0.72rem', color: bad ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
          {s.sharedPath
            ? 'Shared path → offline = production. No skew to detect.'
            : bad
              ? `Silent skew: offline says ${baseline}, production is ${aggAcc.toFixed(1)} — and it is ${(baseline - tailAcc).toFixed(1)} pts worse on exactly the users most likely to be fraud.`
              : 'Small error → aggregate looks fine, but note the tail is already sliding.'}
        </div>
      </div>
      <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        No exception is ever thrown. The aggregate AUC barely moves because the tail is small — which is
        exactly why skew hides. Turn on the shared path and the two numbers become identical by construction.
      </div>
    </div>
  )
})
