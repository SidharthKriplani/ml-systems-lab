import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches point-in-time correctness. Building a training row for a fraud event at
// time T, you join a rolling feature. If you compute it "as of now" (the backfill
// run date) it swallows transactions that happened AFTER T -> future leaks into the
// past -> offline AUC is inflated and production comes in lower by exactly that gap.
// Toggle point-in-time-correct joins to remove the leak.

const DEFAULTS = {
  joinLagHrs: 3,       // how late (after event T) the join snapshot is taken
  pointInTime: false,  // enforce: join only values that existed strictly before T
}

// leakage grows with how far past T the join reaches. Point-in-time = 0 leak.
function derive(s) {
  const lag = s.pointInTime ? 0 : s.joinLagHrs
  const leak = Math.min(11, lag * 1.4)   // AUC points of inflation from future info
  const trueAuc = 82                       // what production actually delivers
  const offlineAuc = trueAuc + leak        // inflated offline number
  return { lag, leak, trueAuc, offlineAuc }
}

export const PointInTimeJoinViz = forwardRef(function PointInTimeJoinViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const { lag, leak, trueAuc, offlineAuc } = derive(s)
  const leaking = leak > 0.5

  // timeline: event T in the middle, window [T-5d, T]; late join reaches to T+lag
  const W = 336, x0 = 12, x1 = 324
  const tX = x0 + (x1 - x0) * 0.62          // event T position
  const winStart = x0 + (x1 - x0) * 0.14    // window opens (T - 5d)
  const joinX = Math.min(x1, tX + (x1 - tX) * (lag / 12) * 2.2) // join snapshot reach

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox="0 0 336 96" style={{ width: '100%', maxWidth: 336 }}>
        <line x1={x0} y1={64} x2={x1} y2={64} stroke="var(--ink-low)" strokeWidth="1" />
        {/* the legitimate window: T-5d .. T */}
        <rect x={winStart} y={54} width={tX - winStart} height={20} rx={3} fill="var(--prime-faint)" stroke="var(--prime)" />
        {/* the leaked region: T .. join snapshot */}
        {leaking && <rect x={tX} y={54} width={joinX - tX} height={20} rx={3} fill="#ef4444" opacity="0.28" stroke="#ef4444" />}
        {/* event marker */}
        <line x1={tX} y1={40} x2={tX} y2={80} stroke="var(--amber)" strokeWidth="2" />
        <text x={tX} y={34} textAnchor="middle" fill="var(--amber)" fontSize="8" fontWeight="700">event T</text>
        {/* join snapshot marker */}
        <line x1={joinX} y1={46} x2={joinX} y2={80} stroke={leaking ? '#ef4444' : 'var(--prime)'} strokeWidth="1.5" strokeDasharray="3 2" />
        <text x={Math.min(joinX, x1 - 30)} y={92} textAnchor="middle" fill={leaking ? '#ef4444' : 'var(--ink-low)'} fontSize="7.5">
          join snapshot {s.pointInTime ? '(at T)' : `(+${lag}h)`}
        </text>
        <text x={winStart} y={50} fill="var(--ink-low)" fontSize="7">7-day window</text>
      </svg>

      <div style={{ marginTop: 6, marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Join snapshot lag after the event (the backfill ran later)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.pointInTime ? '0h (as of T)' : `${s.joinLagHrs}h`}</span>
        </div>
        <input type="range" min={0} max={12} value={s.joinLagHrs} disabled={s.pointInTime}
          onChange={e => set('joinLagHrs', +e.target.value)} style={{ width: '100%', opacity: s.pointInTime ? 0.4 : 1 }} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.pointInTime} onChange={e => set('pointInTime', e.target.checked)} />
        Point-in-time-correct join — join <em>only</em> values that existed strictly before T
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Offline AUC (what you report)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: leaking ? '#f59e0b' : '#22c55e' }}>{offlineAuc.toFixed(1)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Production AUC (reality)</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>{trueAuc.toFixed(1)}</div>
        </div>
      </div>

      <div style={{ marginTop: 10, background: 'var(--depth)', border: `1px solid ${leaking ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem', color: leaking ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
        {leaking
          ? `Leak = ${leak.toFixed(1)} AUC points. The red band is post-event transactions the rolling window swallowed — future data the model will never have in production.`
          : 'No leak. Offline equals production, because the join used only data available at T.'}
      </div>
      <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        The bug is easy to write by accident: the backfill runs later, so "compute the 7-day count" quietly
        reaches forward past T. Offline looks great; production is exactly the leak-worth lower.
      </div>
    </div>
  )
})
