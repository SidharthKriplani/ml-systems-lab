import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: multi-objective ranking = a value model that mixes per-head predictions
// into one score. Move the weights, watch the ranking reorder and the aggregate
// trade-offs move against each other. There is no weight that maxes everything.

// Each item has per-head predicted probabilities/values (already calibrated).
const ITEMS = [
  { id: 'Clickbait',   pCtr: 0.42, pDwell: 0.05, pShare: 0.01, pReport: 0.06 },
  { id: 'Deep essay',  pCtr: 0.09, pDwell: 0.55, pShare: 0.08, pReport: 0.00 },
  { id: 'Meme',        pCtr: 0.30, pDwell: 0.08, pShare: 0.22, pReport: 0.01 },
  { id: 'News',        pCtr: 0.18, pDwell: 0.30, pShare: 0.10, pReport: 0.00 },
  { id: 'Ad-heavy',    pCtr: 0.25, pDwell: 0.10, pShare: 0.02, pReport: 0.09 },
  { id: 'Tutorial',    pCtr: 0.14, pDwell: 0.45, pShare: 0.12, pReport: 0.00 },
]

const DEFAULTS = { ctr: 1.0, dwell: 1.0, share: 0.5, report: 3.0 }

function score(it, w) {
  // report is a guardrail: subtracted (harm penalty)
  return w.ctr * it.pCtr + w.dwell * it.pDwell + w.share * it.pShare - w.report * it.pReport
}

export const ValueModelMixerViz = forwardRef(function ValueModelMixerViz(props, ref) {
  const [w, setW] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setW({ ...DEFAULTS }) }))

  const set = useCallback((k, v) => setW(prev => ({ ...prev, [k]: v })), [])

  const ranked = [...ITEMS]
    .map(it => ({ ...it, s: score(it, w) }))
    .sort((a, b) => b.s - a.s)

  // aggregate top-3 exposure of each objective
  const top3 = ranked.slice(0, 3)
  const agg = {
    ctr: top3.reduce((a, b) => a + b.pCtr, 0) / 3,
    dwell: top3.reduce((a, b) => a + b.pDwell, 0) / 3,
    report: top3.reduce((a, b) => a + b.pReport, 0) / 3,
  }

  const sliders = [
    { key: 'ctr', label: 'CTR weight', max: 3 },
    { key: 'dwell', label: 'Dwell-time weight', max: 3 },
    { key: 'share', label: 'Share weight', max: 3 },
    { key: 'report', label: 'Report penalty (guardrail)', max: 6 },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      {sliders.map(sl => (
        <div key={sl.key} style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span>{sl.label}</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{w[sl.key].toFixed(1)}</span>
          </div>
          <input type="range" min={0} max={sl.max} step={0.1} value={w[sl.key]}
            onChange={e => set(sl.key, +e.target.value)} style={{ width: '100%' }} />
        </div>
      ))}

      <div style={{ marginTop: '10px', marginBottom: '8px' }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Ranking (score = Σ wᵢ·pᵢ − w_report·p_report)</div>
        {ranked.map((it, i) => (
          <div key={it.id} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', marginBottom: '3px',
            background: i < 3 ? 'var(--prime-faint)' : 'var(--depth)',
            border: `1px solid ${i < 3 ? 'var(--prime)' : 'var(--rim)'}`, borderRadius: 6,
          }}>
            <span style={{ width: 16, fontWeight: 800, color: 'var(--ink-low)', fontSize: '0.7rem' }}>{i + 1}</span>
            <span style={{ flex: 1, color: 'var(--ink-hi)', fontWeight: 600, fontSize: '0.75rem' }}>{it.id}</span>
            <span style={{ fontSize: '0.6rem', color: 'var(--ink-ghost)' }}>
              ctr {it.pCtr.toFixed(2)} · dwell {it.pDwell.toFixed(2)} · rpt {it.pReport.toFixed(2)}
            </span>
            <span style={{ width: 40, textAlign: 'right', fontWeight: 700, color: it.s < 0 ? '#ef4444' : 'var(--prime)', fontSize: '0.72rem' }}>{it.s.toFixed(3)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { k: 'ctr', label: 'Top-3 CTR', good: 'high' },
          { k: 'dwell', label: 'Top-3 dwell', good: 'high' },
          { k: 'report', label: 'Top-3 report rate', good: 'low' },
        ].map(m => {
          const v = agg[m.k]
          const bad = m.good === 'low' ? v > 0.03 : v < 0.15
          return (
            <div key={m.k} style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '6px 8px' }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>{m.label}</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: bad ? '#ef4444' : '#22c55e' }}>{(v * 100).toFixed(1)}%</div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Crank CTR weight → clickbait and ad-heavy climb, report-rate rises. Drop the report
        penalty to 0 → harmful content tops the feed. No single weight vector wins every
        objective; the value model <em>is</em> the product decision.
      </div>
    </div>
  )
})
