import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive group leakage: an SVG of 8 patients (each a cluster of visit-dots).
// Under a random split, a patient's visits scatter across train (gold) and test
// (blue) — the model is graded on memorised patients, and the reported bar floats
// above the true production bar. A group split keeps each patient on one side.

const DEFAULTS = { visitsPerPatient: 6, groupSplit: false }
const HONEST = 0.73
const MEMORISED = 0.99
const PATIENTS = 8

export const LeakageSplitViz = forwardRef(function LeakageSplitViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), [])

  const v = s.visitsPerPatient
  const pSeen = s.groupSplit ? 0 : 1 - Math.pow(0.2, Math.max(v - 1, 0))
  const reported = s.groupSplit ? HONEST : pSeen * MEMORISED + (1 - pSeen) * HONEST
  const gap = (reported - HONEST) * 100
  const leaking = !s.groupSplit && gap > 1
  const pct = x => (x * 100).toFixed(1)

  // deterministic assignment of each visit to train/test
  const rnd = (p, i) => ((Math.sin((p * 31 + i * 7.13) * 12.9898) * 43758.5) % 1 + 1) % 1
  const W = 360, H = 92, colW = W / PATIENTS
  const dotR = 3.2

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <text x="4" y="9" fill="var(--ink-low)" fontSize="8">8 patients × {v} visits — ● train  ● test  (group split forces one side)</text>
        {Array.from({ length: PATIENTS }).map((_, p) => {
          const side = rnd(p, 99) < 0.75 ? 'train' : 'test' // patient's home side for group split
          let split = false
          const dots = Array.from({ length: v }).map((_, i) => {
            let inTrain
            if (s.groupSplit) inTrain = side === 'train'
            else inTrain = rnd(p, i) < 0.8
            return inTrain
          })
          if (!s.groupSplit) split = dots.some(d => d) && dots.some(d => !d)
          const cx0 = p * colW + colW / 2
          return (
            <g key={p}>
              {dots.map((inTrain, i) => {
                const row = Math.floor(i / 3), col = i % 3
                const cx = cx0 + (col - 1) * 9, cy = 22 + row * 9
                return <circle key={i} cx={cx} cy={cy} r={dotR} fill={inTrain ? 'var(--prime)' : '#4aa3ff'} opacity="0.9" />
              })}
              {split && <rect x={p * colW + 2} y={16} width={colW - 4} height={H - 26} fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" rx="3" />}
              <text x={cx0} y={H - 4} textAnchor="middle" fontSize="6.5" fill={split ? '#ef4444' : 'var(--ink-ghost)'}>{split ? 'LEAK' : `P${p + 1}`}</text>
            </g>
          )
        })}
      </svg>

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>visits (rows) per patient</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{v}</span></div>
        <input type="range" min={1} max={9} value={v} onChange={e => set('visitsPerPatient', +e.target.value)} style={{ width: '100%' }} />
      </div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.groupSplit} onChange={e => set('groupSplit', e.target.checked)} />
        group split (every visit of a patient stays on one side)
      </label>

      <div style={{ fontSize: '0.64rem', color: 'var(--ink-low)', marginBottom: 4 }}>chance a validation patient was also seen in training: <b style={{ color: leaking ? '#ef4444' : 'var(--ink-hi)' }}>{pct(pSeen)}%</b></div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: `1px solid ${leaking ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>reported validation</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: leaking ? '#ef4444' : '#22c55e' }}>{pct(reported)}%</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>production (new patients)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink-hi)' }}>{pct(HONEST)}%</div>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.76rem', fontWeight: 800, textAlign: 'center', color: leaking ? '#ef4444' : '#22c55e' }}>
        {leaking ? `Leak: validation inflated by ${gap.toFixed(1)} points` : 'Honest: validation matches production'}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Random split → a patient's other visits leak into training (red-boxed patients appear on both sides), so the model is graded partly on memorised patients — and more visits widen the illusion. A group split makes every validation patient genuinely new, so the reported number is the one you'll actually get.
      </div>
    </div>
  )
})
