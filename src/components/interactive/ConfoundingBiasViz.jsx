import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: a confounder Z drives both treatment and outcome. The naive
// difference-in-means = true effect + selection bias. Adjusting for Z removes
// the bias — but ONLY if Z is measured. Slide the confounder strength and the
// unmeasured share, watch the naive estimate diverge from the truth.

const TRUE_EFFECT = 5 // the real ATE, in outcome units

const DEFAULTS = {
  confounder: 6, // how strongly Z shifts both T-assignment and Y (0..10)
  unmeasured: 0, // fraction of the confounder you failed to measure (0..1)
}

export const ConfoundingBiasViz = forwardRef(function ConfoundingBiasViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  // Selection bias scales with confounder strength. Adjustment removes the
  // MEASURED part; the unmeasured fraction leaks through no matter what.
  const totalBias = s.confounder * 1.4
  const naive = TRUE_EFFECT + totalBias
  const adjusted = TRUE_EFFECT + totalBias * s.unmeasured
  const residual = adjusted - TRUE_EFFECT

  const scale = 2.6 // px per unit
  const barW = (v) => Math.max(2, Math.abs(v) * scale)
  const rows = [
    { label: 'True ATE', val: TRUE_EFFECT, color: '#22c55e' },
    { label: 'Naive (no adjustment)', val: naive, color: '#ef4444' },
    { label: 'Adjusted for measured Z', val: adjusted, color: 'var(--prime)' },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <span>Confounder strength (Z → T and Z → Y)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.confounder}</span>
        </div>
        <input type="range" min={0} max={10} step={1} value={s.confounder} onChange={e => set('confounder', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <span>Fraction of Z left UNmeasured</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{Math.round(s.unmeasured * 100)}%</span>
        </div>
        <input type="range" min={0} max={1} step={0.1} value={s.unmeasured} onChange={e => set('unmeasured', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginTop: '12px' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <div style={{ width: 132, fontSize: '0.62rem', color: 'var(--ink-low)', textAlign: 'right' }}>{r.label}</div>
            <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 4, height: 16, position: 'relative' }}>
              <div style={{ width: `${barW(r.val)}px`, maxWidth: '100%', height: '100%', background: r.color, borderRadius: 4, opacity: 0.85 }} />
            </div>
            <div style={{ width: 34, fontSize: '0.66rem', color: 'var(--ink-hi)', fontWeight: 700 }}>{r.val.toFixed(1)}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '10px', background: 'var(--depth)', border: `1px solid ${Math.abs(residual) > 0.5 ? '#f59e0b' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>Residual bias after adjustment</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: Math.abs(residual) > 0.5 ? '#f59e0b' : '#22c55e' }}>
            {residual >= 0 ? '+' : ''}{residual.toFixed(1)} {Math.abs(residual) > 0.5 ? '' : '✓'}
          </span>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        With 0% unmeasured, adjusting for Z recovers the true ATE exactly — no matter how strong the
        confounding. Leave any of Z unmeasured and the bias leaks straight through: no estimator removes
        confounding from a variable you never recorded.
      </div>
    </div>
  )
})
