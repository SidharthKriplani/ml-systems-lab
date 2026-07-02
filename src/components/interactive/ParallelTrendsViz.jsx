import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: DiD only works if the treated group WOULD HAVE tracked control absent
// treatment. Tilt the treated group's pre-trend and the DiD estimate absorbs
// that pre-existing divergence as if it were the policy effect. The naive DiD
// number stays "significant" while being flat-out wrong.

const TRUE_EFFECT = 12 // the real jump the policy caused, at the last post point

const DEFAULTS = {
  preSlope: 0, // extra downward drift in treated group BEFORE the policy (0..8)
}

const W = 340, H = 150, PAD_L = 34, PAD_B = 26, X0 = PAD_L, X1 = W - 10
const CUT = 0.5 // policy at midpoint

export const ParallelTrendsViz = forwardRef(function ParallelTrendsViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const yTop = 14, yBot = H - PAD_B
  const toX = (t) => X0 + t * (X1 - X0)
  const toY = (v) => yBot - (v / 100) * (yBot - yTop) // v in 0..100

  // Control: flat-ish rising line. Treated shares the same common trend PLUS a
  // pre-period drift (preSlope) that violates parallel trends, PLUS the true
  // policy effect after the cutoff.
  const ctrl = { pre0: 55, pre1: 62, post1: 70 }
  const drift = s.preSlope
  const trTrue = { pre0: 50 - 0, pre1: 57 - drift } // treated diverges pre-period
  // counterfactual: apply control's post change to treated's pre-cut value
  const treatedAtCut = trTrue.pre1
  const controlPostDelta = ctrl.post1 - ctrl.pre1
  const cfPost = treatedAtCut + controlPostDelta
  const trPost = cfPost + TRUE_EFFECT

  // Naive DiD = (treated post - treated pre) - (control post - control pre)
  const naiveDiD = (trPost - trTrue.pre0) - (ctrl.post1 - ctrl.pre0)
  const bias = naiveDiD - TRUE_EFFECT

  const cutX = toX(CUT)
  const ctrlPts = `${toX(0)},${toY(ctrl.pre0)} ${cutX},${toY(ctrl.pre1)} ${toX(1)},${toY(ctrl.post1)}`
  const trPts = `${toX(0)},${toY(trTrue.pre0)} ${cutX},${toY(trTrue.pre1)} ${toX(1)},${toY(trPost)}`
  const cfPts = `${cutX},${toY(treatedAtCut)} ${toX(1)},${toY(cfPost)}`

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <span>Treated pre-trend divergence (parallel-trends violation)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.preSlope}</span>
        </div>
        <input type="range" min={0} max={8} step={1} value={s.preSlope} onChange={e => set('preSlope', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: `${W}px`, fontFamily: 'var(--font-sans,sans-serif)' }}>
        <line x1={X0} y1={yBot} x2={X1} y2={yBot} stroke="var(--rim)" />
        <line x1={X0} y1={yTop} x2={X0} y2={yBot} stroke="var(--rim)" />
        <line x1={cutX} y1={yTop} x2={cutX} y2={yBot} stroke="var(--ink-low)" strokeDasharray="3 3" />
        <text x={cutX} y={yBot + 16} textAnchor="middle" fill="var(--ink-low)" fontSize="8">policy</text>
        <text x={toX(0.22)} y={yBot + 16} textAnchor="middle" fill="var(--ink-low)" fontSize="8">pre</text>
        <text x={toX(0.78)} y={yBot + 16} textAnchor="middle" fill="var(--ink-low)" fontSize="8">post</text>
        <polyline points={ctrlPts} fill="none" stroke="var(--ink-mid)" strokeWidth="2" />
        <polyline points={cfPts} fill="none" stroke="var(--prime)" strokeWidth="1.4" strokeDasharray="4 3" />
        <polyline points={trPts} fill="none" stroke="var(--prime)" strokeWidth="2" />
        <line x1={toX(1)} y1={toY(cfPost)} x2={toX(1)} y2={toY(trPost)} stroke="#22c55e" strokeWidth="3" />
        <text x={toX(1) - 4} y={toY((cfPost + trPost) / 2)} textAnchor="end" fill="#22c55e" fontSize="7.5" fontWeight="700">true</text>
        <text x={X1} y={toY(ctrl.post1) + 3} fill="var(--ink-mid)" fontSize="7.5">ctrl</text>
        <text x={X1} y={toY(trPost) - 3} fill="var(--prime)" fontSize="7.5" fontWeight="700">treated</text>
      </svg>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 8, padding: '7px 10px', border: '1px solid var(--rim)' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>True policy effect</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#22c55e' }}>+{TRUE_EFFECT.toFixed(1)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 8, padding: '7px 10px', border: `1px solid ${Math.abs(bias) > 1 ? '#ef4444' : 'var(--rim)'}` }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Naive DiD estimate</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: Math.abs(bias) > 1 ? '#ef4444' : 'var(--ink-hi)' }}>+{naiveDiD.toFixed(1)}</div>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        At 0 the treated line is parallel to control pre-policy and the naive DiD nails the true +12.
        Tilt the pre-trend and the DiD swallows the pre-existing drift — reporting a bigger "effect" that
        is really divergence that started before the policy. An event study on the pre-period catches this.
      </div>
    </div>
  )
})
