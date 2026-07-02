import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: alert fatigue is a calibration problem. A loose threshold catches
// every real incident but buries the team in false positives; past ~20% FP the
// team rationally starts ignoring the alert, so a real P0 gets waved off. A
// duration requirement (must persist N hours) filters transient noise. Move the
// PSI threshold and the persistence requirement; watch the FP rate and the
// "ignored" verdict flip.

const DEFAULTS = {
  threshold: 0.10,   // PSI alert threshold
  persistHrs: 0,     // must persist this many hours before paging
}

// A stylized incident population. Each has a peak PSI and how long it persists (hrs).
// "real" = a genuine incident worth paging; noise = transient seasonal wiggle.
const INCIDENTS = [
  { psi: 0.32, hrs: 6, real: true },
  { psi: 0.26, hrs: 4, real: true },
  { psi: 0.21, hrs: 5, real: true },
  { psi: 0.18, hrs: 1, real: false },
  { psi: 0.16, hrs: 1, real: false },
  { psi: 0.15, hrs: 2, real: false },
  { psi: 0.14, hrs: 1, real: false },
  { psi: 0.13, hrs: 1, real: false },
  { psi: 0.12, hrs: 1, real: false },
  { psi: 0.11, hrs: 1, real: false },
]

export const AlertThresholdViz = forwardRef(function AlertThresholdViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))

  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const fired = INCIDENTS.filter(x => x.psi >= s.threshold && x.hrs >= s.persistHrs)
  const tp = fired.filter(x => x.real).length
  const fp = fired.filter(x => !x.real).length
  const totalReal = INCIDENTS.filter(x => x.real).length
  const missed = totalReal - tp
  const fpRate = fired.length ? fp / fired.length : 0
  const ignored = fpRate > 0.20 // team rationally tunes it out past ~20%

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: '10px' }}>
        Ten drift events fired this month — 3 real incidents, 7 transient wiggles. Tune the alert to
        catch the real ones without drowning the team in false positives.
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>PSI alert threshold</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.threshold.toFixed(2)}</span>
        </div>
        <input type="range" min={5} max={30} value={Math.round(s.threshold * 100)} onChange={e => set('threshold', +e.target.value / 100)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Must persist for</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.persistHrs}h before paging</span>
        </div>
        <input type="range" min={0} max={6} value={s.persistHrs} onChange={e => set('persistHrs', +e.target.value)} style={{ width: '100%' }} />
      </div>

      {/* incident strip */}
      <div style={{ marginBottom: '10px' }}>
        {INCIDENTS.map((x, i) => {
          const passes = x.psi >= s.threshold && x.hrs >= s.persistHrs
          const color = !passes ? 'var(--depth)' : x.real ? '#22c55e' : '#ef4444'
          const bd = !passes ? 'var(--rim)' : x.real ? '#22c55e' : '#ef4444'
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <div style={{ width: 84, fontSize: '0.62rem', color: 'var(--ink-low)' }}>PSI {x.psi.toFixed(2)} · {x.hrs}h</div>
              <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 4, height: 12, position: 'relative' }}>
                <div style={{ width: `${Math.min(100, (x.psi / 0.35) * 100)}%`, height: '100%', background: color, border: `1px solid ${bd}`, borderRadius: 4, opacity: 0.85 }} />
              </div>
              <div style={{ width: 62, fontSize: '0.58rem', color: passes ? (x.real ? '#22c55e' : '#ef4444') : 'var(--ink-ghost)' }}>
                {passes ? (x.real ? 'true page' : 'FALSE') : 'silent'}
              </div>
            </div>
          )
        })}
      </div>

      {/* verdict */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Stat label="Caught" val={`${tp}/${totalReal}`} color={missed > 0 ? '#ef4444' : '#22c55e'} />
        <Stat label="False pos" val={`${fp}`} color={fp > 1 ? '#ef4444' : 'var(--ink-hi)'} />
        <Stat label="FP rate" val={`${(fpRate * 100).toFixed(0)}%`} color={ignored ? '#ef4444' : '#22c55e'} />
      </div>

      <div style={{ marginTop: '10px', background: 'var(--depth)', border: `1px solid ${ignored || missed > 0 ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ignored ? '#ef4444' : missed > 0 ? '#f59e0b' : '#22c55e' }}>
          {ignored
            ? `FP rate ${(fpRate * 100).toFixed(0)}% > 20% — the team tunes this alert out. The next real P0 gets waved off.`
            : missed > 0
              ? `Threshold too high: ${missed} real incident${missed > 1 ? 's' : ''} slipped through silently.`
              : `All ${totalReal} real incidents caught, FP rate under 20% — this alert stays trusted.`}
        </span>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Loosen the threshold and you catch every incident — but the false-positive rate climbs past 20%
        and the alert becomes wallpaper. Add a persistence requirement and the transient one-hour wiggles
        drop out while the multi-hour real incidents still fire. Calibration, not headcount, fixes fatigue.
      </div>
    </div>
  )
})

function Stat({ label, val, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.58rem', color: 'var(--ink-low)' }}>{label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 800, color }}>{val}</div>
    </div>
  )
}
