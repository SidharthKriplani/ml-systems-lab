import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive value model: weight sliders combine per-head predictions into one score.
// The ranking reorders live AND an SVG shows the top-3 feed's aggregate CTR / dwell /
// report-rate — push CTR up and clickbait climbs while the report bar (guardrail) rises.

const ITEMS = [
  { id: 'Clickbait',  pCtr: 0.42, pDwell: 0.05, pShare: 0.01, pReport: 0.06 },
  { id: 'Deep essay', pCtr: 0.09, pDwell: 0.55, pShare: 0.08, pReport: 0.00 },
  { id: 'Meme',       pCtr: 0.30, pDwell: 0.08, pShare: 0.22, pReport: 0.01 },
  { id: 'News',       pCtr: 0.18, pDwell: 0.30, pShare: 0.10, pReport: 0.00 },
  { id: 'Ad-heavy',   pCtr: 0.25, pDwell: 0.10, pShare: 0.02, pReport: 0.09 },
  { id: 'Tutorial',   pCtr: 0.14, pDwell: 0.45, pShare: 0.12, pReport: 0.00 },
]
const DEFAULTS = { ctr: 1.0, dwell: 1.0, share: 0.5, report: 3.0 }
const score = (it, w) => w.ctr * it.pCtr + w.dwell * it.pDwell + w.share * it.pShare - w.report * it.pReport

export const ValueModelMixerViz = forwardRef(function ValueModelMixerViz(props, ref) {
  const [w, setW] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setW({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setW(p => ({ ...p, [k]: v })), [])

  const ranked = [...ITEMS].map(it => ({ ...it, s: score(it, w) })).sort((a, b) => b.s - a.s)
  const top3 = ranked.slice(0, 3)
  const agg = {
    ctr: top3.reduce((a, b) => a + b.pCtr, 0) / 3,
    dwell: top3.reduce((a, b) => a + b.pDwell, 0) / 3,
    report: top3.reduce((a, b) => a + b.pReport, 0) / 3,
  }
  const metrics = [
    { k: 'ctr', label: 'Top-3 CTR', v: agg.ctr, good: true, scale: 0.45 },
    { k: 'dwell', label: 'Top-3 dwell', v: agg.dwell, good: true, scale: 0.55 },
    { k: 'report', label: 'Top-3 report', v: agg.report, good: false, scale: 0.10 },
  ]
  const W = 360, H = 96, base = H - 18, top = 14, bw = 74, gap = (W - 3 * bw) / 4
  const sliders = [{ key: 'ctr', label: 'CTR', max: 3 }, { key: 'dwell', label: 'Dwell', max: 3 }, { key: 'share', label: 'Share', max: 3 }, { key: 'report', label: 'Report penalty', max: 6 }]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <text x="4" y="10" fill="var(--ink-low)" fontSize="8">what the top-3 feed actually optimizes (aggregate)</text>
        {metrics.map((m, i) => {
          const x = gap + i * (bw + gap), hgt = Math.min(1, m.v / m.scale) * (base - top), y = base - hgt
          const col = m.good ? 'var(--prime)' : (m.v > 0.03 ? '#ef4444' : 'var(--amber)')
          return (
            <g key={m.k}>
              <rect x={x} y={y} width={bw} height={hgt} fill={col} opacity="0.85" rx="2" />
              <text x={x + bw / 2} y={y - 3} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ink-hi)">{(m.v * 100).toFixed(1)}%</text>
              <text x={x + bw / 2} y={base + 12} textAnchor="middle" fontSize="8" fill={m.good ? 'var(--ink-low)' : '#ef4444'}>{m.label}</text>
            </g>
          )
        })}
      </svg>

      {sliders.map(sl => (
        <div key={sl.key} style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>{sl.label} weight</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{w[sl.key].toFixed(1)}</span></div>
          <input type="range" min={0} max={sl.max} step={0.1} value={w[sl.key]} onChange={e => set(sl.key, +e.target.value)} style={{ width: '100%' }} />
        </div>
      ))}

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase', marginBottom: 4 }}>ranking (score = Σ wᵢ·pᵢ − w·p_report)</div>
        {ranked.map((it, i) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px', marginBottom: 2,
            background: i < 3 ? 'var(--prime-faint)' : 'var(--depth)', border: `1px solid ${i < 3 ? 'var(--prime)' : 'var(--rim)'}`, borderRadius: 6 }}>
            <span style={{ width: 14, fontWeight: 800, color: 'var(--ink-low)', fontSize: '0.7rem' }}>{i + 1}</span>
            <span style={{ flex: 1, color: 'var(--ink-hi)', fontWeight: 600, fontSize: '0.74rem' }}>{it.id}</span>
            <span style={{ fontSize: '0.58rem', color: 'var(--ink-ghost)' }}>ctr {it.pCtr.toFixed(2)}·rpt {it.pReport.toFixed(2)}</span>
            <span style={{ width: 42, textAlign: 'right', fontWeight: 700, fontSize: '0.72rem', color: it.s < 0 ? '#ef4444' : 'var(--prime)' }}>{it.s.toFixed(3)}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Crank CTR → clickbait & ad-heavy climb and the red report bar rises with them. Drop the report penalty to 0 → harmful-but-clicky content tops the feed. No single weight vector wins every objective; the value model <i>is</i> the product decision.
      </div>
    </div>
  )
})
