import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: concept drift is confirmed only against labels, so the label delay
// sets a hard floor on how long the model can be wrong before you KNOW.
// Leading signals (feature PSI / score shift) fire earlier but only say
// "investigate," not "confirmed." Move the label delay and the drift shape;
// watch the confirmed-detection point slide right while the lead signal stays.

const DAYS = 60
const DRIFT_DAY = 20 // the day the world actually changes

const DEFAULTS = {
  labelDelay: 7,       // days until labels arrive
  shape: 'sudden',     // sudden | gradual
  leadDay: 4,          // days after drift the leading signal (PSI/score) trips
}

const SHAPES = ['sudden', 'gradual']

export const DriftLagViz = forwardRef(function DriftLagViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))

  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  // leading signal fires leadDay after drift (bounded to the window)
  const leadFireDay = Math.min(DAYS, DRIFT_DAY + s.leadDay)
  // labels confirm: gradual drift needs a few extra days of accumulated evidence
  const confirmExtra = s.shape === 'gradual' ? 6 : 1
  const confirmDay = Math.min(DAYS, DRIFT_DAY + s.labelDelay + confirmExtra)
  const blindWindow = confirmDay - DRIFT_DAY

  const W = 340, H = 90, x0 = 10
  const dayToX = (d) => x0 + (d / DAYS) * W

  // error curve path: flat, then rises at DRIFT_DAY per shape
  const errorY = (d) => {
    if (d < DRIFT_DAY) return H - 12
    const t = (d - DRIFT_DAY) / (DAYS - DRIFT_DAY)
    const rise = s.shape === 'sudden' ? Math.min(1, t * 6) : t
    return H - 12 - rise * 52
  }
  let path = ''
  for (let d = 0; d <= DAYS; d += 2) {
    path += `${d === 0 ? 'M' : 'L'}${dayToX(d).toFixed(1)},${errorY(d).toFixed(1)} `
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: '8px' }}>
        The world changes on day {DRIFT_DAY} (red line). A leading signal fires soon after; labels
        only <b>confirm</b> the drift after their delay. The gap is the blind window.
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span>Label delay</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.labelDelay}d</span>
          </div>
          <input type="range" min={1} max={30} value={s.labelDelay} onChange={e => set('labelDelay', +e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span>Lead-signal lag</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.leadDay}d</span>
          </div>
          <input type="range" min={1} max={15} value={s.leadDay} onChange={e => set('leadDay', +e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {SHAPES.map(sh => (
          <button
            key={sh}
            onClick={() => set('shape', sh)}
            style={{
              flex: 1, padding: '5px 0', fontSize: '0.7rem', cursor: 'pointer',
              borderRadius: 6, textTransform: 'capitalize',
              border: `1px solid ${s.shape === sh ? 'var(--prime)' : 'var(--rim)'}`,
              background: s.shape === sh ? 'var(--prime-faint)' : 'var(--depth)',
              color: s.shape === sh ? 'var(--ink-hi)' : 'var(--ink-low)',
              fontWeight: s.shape === sh ? 700 : 400,
            }}
          >{sh} drift</button>
        ))}
      </div>

      <svg viewBox={`0 0 360 ${H + 16}`} style={{ width: '100%', fontFamily: 'var(--font-sans)' }}>
        <line x1={x0} y1={H - 12} x2={x0 + W} y2={H - 12} stroke="var(--rim)" strokeWidth="1" />
        {/* drift line */}
        <line x1={dayToX(DRIFT_DAY)} y1={6} x2={dayToX(DRIFT_DAY)} y2={H - 12} stroke="#ef4444" strokeWidth="1.5" />
        <text x={dayToX(DRIFT_DAY) + 3} y={14} fill="#ef4444" fontSize="7">drift (day {DRIFT_DAY})</text>
        {/* blind window shading */}
        <rect x={dayToX(DRIFT_DAY)} y={6} width={dayToX(confirmDay) - dayToX(DRIFT_DAY)} height={H - 18} fill="#ef4444" opacity="0.08" />
        {/* lead fire */}
        <line x1={dayToX(leadFireDay)} y1={10} x2={dayToX(leadFireDay)} y2={H - 12} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" />
        <text x={dayToX(leadFireDay) + 2} y={H - 2} fill="#f59e0b" fontSize="6.5">lead signal</text>
        {/* confirm */}
        <line x1={dayToX(confirmDay)} y1={10} x2={dayToX(confirmDay)} y2={H - 12} stroke="#22c55e" strokeWidth="1.2" />
        <text x={dayToX(confirmDay) + 2} y={20} fill="#22c55e" fontSize="6.5">labels confirm</text>
        {/* error curve */}
        <path d={path} fill="none" stroke="var(--prime)" strokeWidth="1.6" />
        <text x={x0} y={H + 12} fill="var(--ink-low)" fontSize="6.5">error rate over 60 days</text>
      </svg>

      <div style={{ marginTop: '8px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>Blind window (drift → confirmed)</span>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: blindWindow > 14 ? '#ef4444' : '#f59e0b' }}>{blindWindow} days</span>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Push label delay up and the green confirmation slides right — you stay wrong longer. The orange
        lead signal fires early but only says "investigate." Gradual drift needs extra days of evidence,
        so it confirms later still. This is why leading indicators exist: to shrink the blind window.
      </div>
    </div>
  )
})
