import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: group leakage inflates your validation score. Patients have several visits;
// a random split scatters one patient's visits across train and test, so the model is
// graded partly on memorised patients. A group split keeps each patient on one side and
// reports the honest number. Slide the visits-per-patient up to widen the illusion.

const DEFAULTS = {
  visitsPerPatient: 6, // how many rows each patient contributes
  groupSplit: false,   // false = random split (leaks), true = group split (honest)
}

// Honest generalisation accuracy the model can actually reach on brand-new patients.
const HONEST = 0.73
// Ceiling accuracy on a patient the model has already memorised.
const MEMORISED = 0.99

export const LeakageSplitViz = forwardRef(function LeakageSplitViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  // Random split: a validation visit's patient is also in train with probability that
  // grows as visits-per-patient grows (more visits -> more likely some landed in train).
  // P(at least one of the other v-1 visits is in the 80% train side).
  const v = s.visitsPerPatient
  const pSeen = s.groupSplit ? 0 : 1 - Math.pow(0.2, Math.max(v - 1, 0))

  // Reported validation accuracy = blend of memorised ceiling (seen patients) and honest.
  const reported = s.groupSplit
    ? HONEST
    : pSeen * MEMORISED + (1 - pSeen) * HONEST

  const production = HONEST
  const gap = (reported - production) * 100
  const leaking = !s.groupSplit && gap > 1

  const pct = (x) => (x * 100).toFixed(1)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Visits (rows) per patient</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{v}</span>
        </div>
        <input type="range" min={1} max={12} value={v} onChange={e => set('visitsPerPatient', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.groupSplit} onChange={e => set('groupSplit', e.target.checked)} />
        Use a group split (every visit of a patient stays on one side)
      </label>

      <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', marginBottom: '6px' }}>
        Chance a validation patient was <em>also</em> seen in training:
        <span style={{ color: leaking ? '#ef4444' : 'var(--ink-hi)', fontWeight: 700 }}> {pct(pSeen)}%</span>
      </div>
      <div style={{ background: 'var(--depth)', borderRadius: 4, height: 14, overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ width: `${pSeen * 100}%`, height: '100%', background: leaking ? '#ef4444' : 'var(--prime)', opacity: 0.8, transition: 'width .15s' }} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: `1px solid ${leaking ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Reported validation</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: leaking ? '#ef4444' : '#22c55e' }}>{pct(reported)}%</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Production (new patients)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink-hi)' }}>{pct(production)}%</div>
        </div>
      </div>

      <div style={{ marginTop: '8px', fontSize: '0.78rem', fontWeight: 800, color: leaking ? '#ef4444' : '#22c55e', textAlign: 'center' }}>
        {leaking ? `Leak: validation is inflated by ${gap.toFixed(1)} points` : 'Honest: validation matches production'}
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        With a random split, a patient's other visits leak into training, so the model is
        graded partly on patients it memorised — and more visits per patient make the illusion
        bigger. The gap between the reported number and production is pure leakage. A group
        split forces every validation patient to be genuinely new, so the number you report is
        the number you'll actually get.
      </div>
    </div>
  )
})
