import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive alerting: 10 drift events plotted on (persistence-hrs × PSI). The two
// threshold sliders draw crosshair lines; the upper-right region "fires". A loose
// threshold buries the team in false positives → past 20% FP the alert is ignored.

const DEFAULTS = { threshold: 0.10, persistHrs: 0 }
const INCIDENTS = [
  { psi: 0.32, hrs: 6, real: true }, { psi: 0.26, hrs: 4, real: true }, { psi: 0.21, hrs: 5, real: true },
  { psi: 0.18, hrs: 1, real: false }, { psi: 0.16, hrs: 1, real: false }, { psi: 0.15, hrs: 2, real: false },
  { psi: 0.14, hrs: 1, real: false }, { psi: 0.13, hrs: 1, real: false }, { psi: 0.12, hrs: 1, real: false },
  { psi: 0.11, hrs: 1, real: false },
]

export const AlertThresholdViz = forwardRef(function AlertThresholdViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), [])

  const fired = INCIDENTS.filter(x => x.psi >= s.threshold && x.hrs >= s.persistHrs)
  const tp = fired.filter(x => x.real).length
  const fp = fired.filter(x => !x.real).length
  const totalReal = INCIDENTS.filter(x => x.real).length
  const missed = totalReal - tp
  const fpRate = fired.length ? fp / fired.length : 0
  const ignored = fpRate > 0.20

  const W = 360, H = 170, pad = 30
  const HRS = 7, PSI = 0.35
  const sx = h => pad + (h / HRS) * (W - pad - 14)
  const sy = p => H - pad - (p / PSI) * (H - pad - 14)
  const tx = sx(s.persistHrs), ty = sy(s.threshold)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        {/* fires region (upper-right of both thresholds) */}
        <rect x={tx} y={sy(PSI)} width={W - 14 - tx} height={ty - sy(PSI)} fill="#ef4444" opacity="0.06" />
        <line x1={pad} y1={H - pad} x2={W - 14} y2={H - pad} stroke="var(--rim)" />
        <line x1={pad} y1={sy(PSI)} x2={pad} y2={H - pad} stroke="var(--rim)" />
        {/* threshold crosshairs */}
        <line x1={pad} y1={ty} x2={W - 14} y2={ty} stroke="var(--prime)" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1={tx} y1={sy(PSI)} x2={tx} y2={H - pad} stroke="var(--prime)" strokeWidth="1.5" strokeDasharray="4 3" />
        {INCIDENTS.map((x, i) => {
          const passes = x.psi >= s.threshold && x.hrs >= s.persistHrs
          const col = !passes ? 'var(--ink-low)' : x.real ? '#22c55e' : '#ef4444'
          return <circle key={i} cx={sx(x.hrs)} cy={sy(x.psi)} r="5" fill={col} opacity={passes ? 0.95 : 0.4}
            stroke={x.real ? '#22c55e' : 'var(--rim)'} strokeWidth={x.real ? 1.5 : 0.5} />
        })}
        <text x={W - 14} y={H - pad + 12} textAnchor="end" fill="var(--ink-ghost)" fontSize="8">persistence (hrs) →</text>
        <text x={pad - 5} y={sy(PSI) + 4} textAnchor="end" fill="var(--ink-ghost)" fontSize="8">PSI</text>
        <text x={W - 16} y={sy(PSI) + 20} textAnchor="end" fill="#ef4444" fontSize="8" opacity="0.8">▲ fires here</text>
      </svg>

      <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)', marginBottom: 6 }}>● green ring = real incident · red = transient noise · dim = below threshold (silent)</div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>PSI threshold</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.threshold.toFixed(2)}</span></div>
        <input type="range" min={5} max={30} value={Math.round(s.threshold * 100)} onChange={e => set('threshold', +e.target.value / 100)} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>must persist</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.persistHrs}h</span></div>
        <input type="range" min={0} max={6} value={s.persistHrs} onChange={e => set('persistHrs', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Stat label="Caught" val={`${tp}/${totalReal}`} color={missed > 0 ? '#ef4444' : '#22c55e'} />
        <Stat label="False pos" val={`${fp}`} color={fp > 1 ? '#ef4444' : 'var(--ink-hi)'} />
        <Stat label="FP rate" val={`${(fpRate * 100).toFixed(0)}%`} color={ignored ? '#ef4444' : '#22c55e'} />
      </div>
      <div style={{ background: 'var(--depth)', border: `1px solid ${ignored || missed > 0 ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: ignored ? '#ef4444' : missed > 0 ? '#f59e0b' : '#22c55e' }}>
          {ignored ? `FP rate ${(fpRate * 100).toFixed(0)}% > 20% — the team tunes this out. The next real P0 gets waved off.`
            : missed > 0 ? `Threshold too high: ${missed} real incident${missed > 1 ? 's' : ''} slipped through silently.`
            : `All ${totalReal} real incidents caught, FP under 20% — this alert stays trusted.`}
        </span>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Lower the PSI line → you catch everything but the false-positive rate climbs and the alert becomes wallpaper. Add a persistence requirement (push the vertical line right) → transient 1-hour wiggles drop out while multi-hour real incidents still fire. Calibration, not headcount, fixes fatigue.
      </div>
    </div>
  )
})

function Stat({ label, val, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 6, padding: 6, textAlign: 'center' }}>
      <div style={{ fontSize: '0.58rem', color: 'var(--ink-low)' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 800, color }}>{val}</div>
    </div>
  )
}
