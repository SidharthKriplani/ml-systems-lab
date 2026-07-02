import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive funnel: the trapezoid reshapes as you set each stage's keep-size.
// Teaches: narrow retrieval → latency drops but the recall ceiling falls, and
// no downstream stage recovers an item retrieval never passed.

const CORPUS = 10_000_000
const STAGE = [
  { name: 'Retrieval', per: 0.0000008 },
  { name: 'Pre-rank',  per: 0.00004 },
  { name: 'Rank',      per: 0.02 },
  { name: 'Re-rank',   per: 0.05 },
]
const DEFAULTS = [5000, 500, 100, 20]
const SLA = 100

const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(0) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(n)
const retrievalRecall = (keep) => Math.max(0, Math.min(0.99, (Math.log10(keep) / Math.log10(50000)) * 0.99))
const logW = (n) => Math.log10(Math.max(10, n)) / Math.log10(CORPUS) // 0..1

export const RetrievalFunnelViz = forwardRef(function RetrievalFunnelViz(props, ref) {
  const [keep, setKeep] = useState([...DEFAULTS])
  useImperativeHandle(ref, () => ({ reset: () => setKeep([...DEFAULTS]) }))

  const setStage = useCallback((i, v) => setKeep(prev => {
    const n = [...prev]; n[i] = v
    for (let j = i + 1; j < n.length; j++) if (n[j] > n[j - 1]) n[j] = n[j - 1]
    for (let j = i - 1; j >= 0; j--) if (n[j] < n[j + 1]) n[j] = n[j + 1]
    return n
  }), [])

  const inputs = [CORPUS, keep[0], keep[1], keep[2]]
  const lat = STAGE.map((s, i) => inputs[i] * s.per)
  const total = lat.reduce((a, b) => a + b, 0)
  const recall = retrievalRecall(keep[0])
  const over = total > SLA

  // funnel geometry: 4 horizontal bands, width ∝ log(count kept)
  const W = 360, H = 150, bandH = H / 4
  const widths = keep.map(k => 30 + logW(k) * (W - 60))

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        {keep.map((k, i) => {
          const wTop = i === 0 ? W - 20 : widths[i - 1]
          const wBot = widths[i]
          const y = i * bandH, cx = W / 2
          const pts = `${cx - wTop / 2},${y} ${cx + wTop / 2},${y} ${cx + wBot / 2},${y + bandH - 4} ${cx - wBot / 2},${y + bandH - 4}`
          return (
            <g key={i}>
              <polygon points={pts} fill="var(--prime-faint)" stroke="var(--prime)" strokeWidth="1" />
              <text x={cx} y={y + bandH / 2} textAnchor="middle" fill="var(--ink-hi)" fontSize="9" fontWeight="700">{STAGE[i].name} · {fmt(k)}</text>
              <text x={cx} y={y + bandH / 2 + 11} textAnchor="middle" fill="var(--ink-low)" fontSize="7.5">{fmt(inputs[i])} in · {lat[i].toFixed(lat[i] < 1 ? 2 : 1)}ms</text>
            </g>
          )
        })}
      </svg>

      {STAGE.map((s, i) => (
        <div key={s.name} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span>{s.name} keeps</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{fmt(keep[i])}</span>
          </div>
          <input type="range" min={i === 0 ? 500 : 10} max={i === 0 ? 50000 : i === 1 ? 5000 : i === 2 ? 500 : 100}
            step={i === 0 ? 500 : 10} value={keep[i]} onChange={e => setStage(i, +e.target.value)} style={{ width: '100%' }} />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>Total latency</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: over ? '#ef4444' : '#22c55e' }}>{total.toFixed(1)}ms {over ? '✗' : '✓'}</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--ink-ghost)' }}>SLA {SLA}ms</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>Recall ceiling</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: recall > 0.9 ? '#22c55e' : recall > 0.75 ? '#f59e0b' : '#ef4444' }}>{(recall * 100).toFixed(0)}%</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--ink-ghost)' }}>final recall can't exceed this</div>
        </div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Narrow the top band → latency falls but the recall ceiling drops with it. Widen the expensive Rank band → latency explodes. The funnel is the only shape that satisfies both.
      </div>
    </div>
  )
})
