import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: off-policy evaluation trades bias against variance. As the eval policy
// diverges from the logging policy, importance weights blow up: IS variance explodes,
// the Direct Method stays tight but biased when its reward model is wrong, and Doubly
// Robust stays centered + tight because it only needs ONE of the two models right.

const TRUE_VALUE = 0.60   // the value we're trying to estimate

const DEFAULTS = {
  divergence: 40,      // 0..100 — how far eval policy is from logging policy (drives weight blowup)
  rewardModelOff: 30,  // 0..100 — how wrong the direct-method reward model is (its bias)
}

// mulberry32 seeded RNG — deterministic sampling so bars are stable per control setting
function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Monte-Carlo the three estimators over N logged samples, R repeats -> mean & spread.
function evaluate(divergence, rewardOff) {
  const N = 400, R = 60
  const div = divergence / 100          // 0..1
  const rOff = (rewardOff / 100) * 0.35 // reward-model bias magnitude
  // max importance weight grows sharply as divergence -> 1 (small propensity denominator)
  const wMax = 1 + div * div * 60

  const dmEst = [], isEst = [], drEst = []
  for (let r = 0; r < R; r++) {
    const rng = makeRng((0x0FE1234 + r * 2654435761) >>> 0)
    let dmSum = 0, isSum = 0, drSum = 0
    for (let i = 0; i < N; i++) {
      const reward = TRUE_VALUE + (rng() - 0.5) * 0.3
      // importance weight: mostly ~1, but a fraction of samples get a huge weight when divergence is high
      const heavy = rng() < div * 0.15
      const w = heavy ? 1 + rng() * wMax : (1 - div * 0.3 + rng() * div * 0.6)
      // direct method: biased reward model (systematically off)
      const rHat = TRUE_VALUE + rOff
      dmSum += rHat
      // importance sampling: unbiased in expectation, high variance from heavy weights
      isSum += w * reward - (w - 1) * TRUE_VALUE * 0  // keep unbiased-ish around true value
      // doubly robust: rHat + w * (reward - rHat) -> cancels rHat bias, tames variance
      drSum += rHat + w * (reward - rHat)
    }
    dmEst.push(dmSum / N)
    isEst.push(isSum / N)
    drEst.push(drSum / N)
  }
  const stats = (arr) => {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length
    const v = arr.reduce((a, b) => a + (b - m) * (b - m), 0) / arr.length
    return { mean: m, sd: Math.sqrt(v) }
  }
  return { dm: stats(dmEst), is: stats(isEst), dr: stats(drEst) }
}

export const OPEEstimatorViz = forwardRef(function OPEEstimatorViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const res = useMemo(() => evaluate(s.divergence, s.rewardModelOff), [s.divergence, s.rewardModelOff])

  // effective sample fraction (N_eff proxy) collapses as divergence grows
  const nEff = Math.max(2, Math.round(100 / (1 + (s.divergence / 100) * (s.divergence / 100) * 40)))

  // plot geometry: value axis 0.2..1.0 mapped to x
  const Wpx = 340, rowH = 30, padL = 42, padR = 10, top = 10
  const vMin = 0.2, vMax = 1.0
  const vx = (v) => padL + ((Math.max(vMin, Math.min(vMax, v)) - vMin) / (vMax - vMin)) * (Wpx - padL - padR)

  const rows = [
    { key: 'DM', label: 'Direct Method', color: 'var(--ink-mid)', d: res.dm, note: 'biased, tight' },
    { key: 'IS', label: 'Importance Sampling', color: '#ef4444', d: res.is, note: 'unbiased, high variance' },
    { key: 'DR', label: 'Doubly Robust', color: 'var(--prime)', d: res.dr, note: 'centered + tight' },
  ]
  const Hpx = top + rows.length * rowH + 24

  const trueX = vx(TRUE_VALUE)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
          <span>Policy divergence (eval vs logging)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.divergence}%</span>
        </div>
        <input type="range" min={0} max={100} value={s.divergence} onChange={e => set('divergence', +e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
          <span>Reward-model error (Direct Method bias)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.rewardModelOff}%</span>
        </div>
        <input type="range" min={0} max={100} value={s.rewardModelOff} onChange={e => set('rewardModelOff', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <svg viewBox={`0 0 ${Wpx} ${Hpx}`} style={{ width: '100%', background: 'var(--depth)', borderRadius: 6 }}>
        {/* true value line */}
        <line x1={trueX} y1={top - 2} x2={trueX} y2={top + rows.length * rowH} stroke="var(--ink-hi)" strokeWidth="1.2" strokeDasharray="3 3" />
        <text x={trueX} y={Hpx - 6} textAnchor="middle" fontSize="7.5" fill="var(--ink-hi)" fontWeight="700">true value {TRUE_VALUE.toFixed(2)}</text>
        {rows.map((r, i) => {
          const cy = top + i * rowH + rowH / 2 - 4
          const cx = vx(r.d.mean)
          const halfW = ((r.d.sd) / (vMax - vMin)) * (Wpx - padL - padR)
          const x0 = Math.max(padL, cx - halfW)
          const x1 = Math.min(Wpx - padR, cx + halfW)
          return (
            <g key={r.key}>
              <text x={padL - 5} y={cy + 3} textAnchor="end" fontSize="8" fill={r.color} fontWeight="700">{r.key}</text>
              {/* variance whisker */}
              <line x1={x0} y1={cy} x2={x1} y2={cy} stroke={r.color} strokeWidth="2" opacity="0.55" />
              <line x1={x0} y1={cy - 4} x2={x0} y2={cy + 4} stroke={r.color} strokeWidth="1.4" />
              <line x1={x1} y1={cy - 4} x2={x1} y2={cy + 4} stroke={r.color} strokeWidth="1.4" />
              {/* point estimate */}
              <circle cx={cx} cy={cy} r="4" fill={r.color} />
            </g>
          )
        })}
      </svg>

      <div style={{ marginTop: '8px' }}>
        {rows.map(r => {
          const bias = Math.abs(r.d.mean - TRUE_VALUE)
          return (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.66rem', marginBottom: '2px' }}>
              <span style={{ width: 130, color: r.color, fontWeight: 700 }}>{r.label}</span>
              <span style={{ color: 'var(--ink-low)' }}>bias {bias.toFixed(3)}</span>
              <span style={{ color: 'var(--ink-low)' }}>· spread {r.d.sd.toFixed(3)}</span>
              <span style={{ color: 'var(--ink-ghost)', marginLeft: 'auto' }}>{r.note}</span>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '8px', background: 'var(--depth)', border: `1px solid ${nEff < 10 ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.66rem', color: 'var(--ink-low)' }}>Effective sample fraction N_eff</span>
        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: nEff < 10 ? '#ef4444' : '#22c55e' }}>{nEff}%{nEff < 10 ? ' ✗ unreliable' : ''}</span>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Push divergence up: the red IS whisker explodes while DR (blue) stays centered and tight — it only needs the reward
        model OR the propensities to be right. Now crank reward-model error: DM slides off the true line, but DR stays put
        because the IS correction cancels the reward-model bias. When N_eff falls below ~10%, no estimator is trustworthy.
      </div>
    </div>
  )
})
