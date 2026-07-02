import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive scaling: distance = √(age² + income²) drawn as a right triangle —
// the age leg and income leg. Unscaled, income's leg dwarfs age's, so "nearest
// neighbour" quietly means "closest income". Scaling makes the legs comparable.

const DEFAULTS = { incomeRange: 500000, ageDiff: 30, incomeDiff: 2000, scaled: false }
const AGE_RANGE = 100

export const FeatureScalingViz = forwardRef(function FeatureScalingViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), [])

  const ageComp = s.scaled ? s.ageDiff / AGE_RANGE : s.ageDiff
  const incComp = s.scaled ? s.incomeDiff / s.incomeRange : s.incomeDiff
  const dist = Math.hypot(ageComp, incComp)
  const agePct = dist ? (ageComp * ageComp) / (dist * dist) * 100 : 0
  const incPct = 100 - agePct
  const dominator = incPct > agePct ? 'income' : 'age'
  const lopsided = Math.max(agePct, incPct) > 90

  // triangle geometry: legs normalized so the larger = 180px
  const W = 360, H = 170, ox = 55, oy = H - 28
  const mx = Math.max(ageComp, incComp) || 1
  const aLeg = (ageComp / mx) * 180, iLeg = (incComp / mx) * 150
  const bx = ox + aLeg, by = oy - iLeg

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        {/* legs */}
        <line x1={ox} y1={oy} x2={bx} y2={oy} stroke="var(--amber)" strokeWidth="3" />
        <line x1={bx} y1={oy} x2={bx} y2={by} stroke="var(--prime)" strokeWidth="3" />
        {/* hypotenuse = distance */}
        <line x1={ox} y1={oy} x2={bx} y2={by} stroke="var(--ink-hi)" strokeWidth="2" strokeDasharray="5 3" />
        <circle cx={ox} cy={oy} r="4" fill="var(--ink-hi)" />
        <circle cx={bx} cy={by} r="4" fill="var(--ink-hi)" />
        <text x={ox} y={oy + 14} fontSize="8" fill="var(--ink-low)">customer A</text>
        <text x={bx + 4} y={by - 4} fontSize="8" fill="var(--ink-hi)">customer B</text>
        <text x={(ox + bx) / 2} y={oy + 12} textAnchor="middle" fontSize="8" fill="var(--amber)">age leg ({agePct.toFixed(0)}%)</text>
        <text x={bx + 5} y={(oy + by) / 2} fontSize="8" fill="var(--prime)">income leg ({incPct.toFixed(0)}%)</text>
        <text x={ox + 6} y={by + 4} fontSize="8" fill="var(--ink-mid)" transform={`rotate(0)`}>distance</text>
      </svg>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>income range in the data</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>0–{s.incomeRange.toLocaleString()}</span></div>
        <input type="range" min={100} max={1000000} step={100} value={s.incomeRange} onChange={e => set('incomeRange', +e.target.value)} style={{ width: '100%' }} />
        <div style={{ fontSize: '0.6rem', color: 'var(--ink-ghost)' }}>age always ranges 0–100</div>
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>A↔B age gap</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.ageDiff} yrs</span></div>
        <input type="range" min={0} max={100} value={s.ageDiff} onChange={e => set('ageDiff', +e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>A↔B income gap</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{Math.min(s.incomeDiff, s.incomeRange).toLocaleString()}</span></div>
        <input type="range" min={0} max={s.incomeRange} step={100} value={Math.min(s.incomeDiff, s.incomeRange)} onChange={e => set('incomeDiff', +e.target.value)} style={{ width: '100%' }} />
      </div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.scaled} onChange={e => set('scaled', e.target.checked)} />
        scale each feature by its range before measuring distance
      </label>

      <div style={{ background: 'var(--depth)', border: `1px solid ${lopsided && !s.scaled ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: s.scaled ? '#22c55e' : lopsided ? '#ef4444' : 'var(--ink-hi)' }}>
          {s.scaled ? 'Scaled: both legs count on their own merits' : `Unscaled: ${dominator} controls ${Math.max(agePct, incPct).toFixed(0)}% of the distance`}
        </div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Distance is the hypotenuse of the two feature legs. Income spans thousands of units and age only 100, so unscaled the income leg dominates and "nearest neighbour" means "closest income." Scaling divides each by its range → comparable legs. Trees split on thresholds, so this never affects them.
      </div>
    </div>
  )
})
