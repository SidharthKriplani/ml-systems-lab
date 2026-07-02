import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: unscaled features let the large-unit column dominate a distance metric.
// Two customers, features age (yrs) and income ($). Toggle scaling and watch which
// feature actually decides "who is nearest" — flip income's range to see it dominate.

const DEFAULTS = {
  incomeRange: 500000, // max income spread in dollars
  ageDiff: 30,         // age gap between the two customers (years)
  incomeDiff: 2000,    // income gap between the two customers (dollars)
  scaled: false,
}

const AGE_RANGE = 100

export const FeatureScalingViz = forwardRef(function FeatureScalingViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  // Raw squared contributions to Euclidean distance.
  const rawAge = s.ageDiff * s.ageDiff
  const rawIncome = s.incomeDiff * s.incomeDiff
  // Scaled: divide each difference by its feature's range, then square.
  const scAge = Math.pow(s.ageDiff / AGE_RANGE, 2)
  const scIncome = Math.pow(s.incomeDiff / s.incomeRange, 2)

  const age = s.scaled ? scAge : rawAge
  const income = s.scaled ? scIncome : rawIncome
  const sum = age + income || 1
  const agePct = (age / sum) * 100
  const incPct = (income / sum) * 100

  const dominator = incPct > agePct ? 'income' : 'age'
  const lopsided = Math.max(agePct, incPct) > 90

  const Bar = ({ label, pct, color }) => (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
        <span>{label}</span>
        <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ background: 'var(--depth)', borderRadius: 4, height: 16, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .15s', opacity: 0.85 }} />
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Income range in the data (units)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>0 - {s.incomeRange.toLocaleString()}</span>
        </div>
        <input type="range" min={100} max={1000000} step={100} value={s.incomeRange} onChange={e => set('incomeRange', +e.target.value)} style={{ width: '100%' }} />
        <div style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>age always ranges 0-100</div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Two customers differ in age by</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.ageDiff} yrs</span>
        </div>
        <input type="range" min={0} max={100} value={s.ageDiff} onChange={e => set('ageDiff', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>...and in income by</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.incomeDiff.toLocaleString()}</span>
        </div>
        <input type="range" min={0} max={s.incomeRange} step={100} value={Math.min(s.incomeDiff, s.incomeRange)} onChange={e => set('incomeDiff', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.scaled} onChange={e => set('scaled', e.target.checked)} />
        Scale features to a comparable range before measuring distance
      </label>

      <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', marginBottom: '6px' }}>
        Share of the "who is nearest?" distance each feature controls:
      </div>
      <Bar label="age" pct={agePct} color="var(--amber)" />
      <Bar label="income" pct={incPct} color="var(--prime)" />

      <div style={{ marginTop: '10px', background: 'var(--depth)', border: `1px solid ${lopsided && !s.scaled ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: s.scaled ? '#22c55e' : (lopsided ? '#ef4444' : 'var(--ink-hi)') }}>
          {s.scaled
            ? 'Scaled: both features count on their own merits'
            : `Unscaled: ${dominator} controls ${Math.max(agePct, incPct).toFixed(0)}% of the distance`}
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Unscaled, distance is a sum of squared raw differences. Income spans thousands of
        units while age spans 100, so income's squared gap dwarfs age's — "nearest neighbour"
        quietly means "most similar income" regardless of how much age matters. Turn scaling on
        and each feature is divided by its own range first, so a full-range gap in either counts
        the same. Note: trees split on thresholds, so this never affects them.
      </div>
    </div>
  )
})
