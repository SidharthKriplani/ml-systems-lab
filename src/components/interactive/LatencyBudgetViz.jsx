import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive latency budget: a single stacked bar of the request path vs the SLA
// line. Segments resize live; turning off async fan-out swaps feature cost from
// max(sources) to sum(sources) and the bar visibly blows past the SLA.

const SLA = 50
const DEFAULTS = { featA: 8, featB: 8, featC: 8, featD: 8, inference: 15, network: 4, serialization: 2, parallel: true }
const SEG_COLORS = ['var(--prime)', 'var(--prime)', 'var(--prime)', 'var(--prime)', 'var(--amber)', 'var(--ink-low)', 'var(--ink-ghost)']

export const LatencyBudgetViz = forwardRef(function LatencyBudgetViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), [])

  const feats = [s.featA, s.featB, s.featC, s.featD]
  const featCost = s.parallel ? Math.max(...feats) : feats.reduce((a, b) => a + b, 0)
  const segs = s.parallel
    ? [{ label: `features (max ${featCost})`, v: featCost, c: 'var(--prime)' }]
    : feats.map((v, i) => ({ label: `feat ${'ABCD'[i]}`, v, c: 'var(--prime)' }))
  segs.push({ label: 'inference', v: s.inference, c: 'var(--amber)' })
  segs.push({ label: 'network', v: s.network, c: 'var(--ink-low)' })
  segs.push({ label: 'serialize', v: s.serialization, c: 'var(--ink-ghost)' })
  const total = segs.reduce((a, b) => a + b.v, 0)
  const over = total > SLA

  // scale: bar spans max(total, SLA)*1.1 ms
  const W = 360, scaleMax = Math.max(total, SLA) * 1.12
  const px = (ms) => (ms / scaleMax) * W
  let x = 0

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} 66`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 4px' }}>
        {/* stacked bar */}
        {segs.map((seg, i) => {
          const w = px(seg.v); const rect = <g key={i}>
            <rect x={x} y="16" width={Math.max(0, w - 1)} height="26" fill={seg.c} opacity="0.85" />
            {w > 26 && <text x={x + w / 2} y="32" textAnchor="middle" fill="#000" fontSize="8" fontWeight="700">{seg.v}</text>}
          </g>; x += w; return rect
        })}
        {/* SLA line */}
        <line x1={px(SLA)} y1="8" x2={px(SLA)} y2="50" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
        <text x={px(SLA)} y="60" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="700">SLA {SLA}ms</text>
        <text x="2" y="12" fill="var(--ink-low)" fontSize="8">request path (ms) →</text>
      </svg>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.66rem', color: 'var(--ink-low)', marginBottom: 3 }}>four feature sources (ms)</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['featA', 'featB', 'featC', 'featD'].map((k, i) => (
            <div key={k} style={{ flex: 1 }}>
              <input type="range" min={1} max={30} value={s[k]} onChange={e => set(k, +e.target.value)} style={{ width: '100%' }} />
              <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--ink-ghost)' }}>{'ABCD'[i]}:{s[k]}</div>
            </div>
          ))}
        </div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, fontSize: '0.72rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={s.parallel} onChange={e => set('parallel', e.target.checked)} />
          async fan-out (pay max, not sum)
        </label>
      </div>
      {[['inference', 3, 45], ['network', 1, 15], ['serialization', 0, 10]].map(([k, mn, mx]) => (
        <div key={k} style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>{k}</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s[k]}ms</span></div>
          <input type="range" min={mn} max={mx} value={s[k]} onChange={e => set(k, +e.target.value)} style={{ width: '100%' }} />
        </div>
      ))}

      <div style={{ marginTop: 8, background: 'var(--depth)', border: `1px solid ${over ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>total P99 vs {SLA}ms</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: over ? '#ef4444' : '#22c55e' }}>{total.toFixed(0)}ms {over ? '✗ MISS' : '✓'}</span>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Uncheck async fan-out: the four 8ms features stack to 32ms and the bar shoots past the SLA before the model even runs. Parallel fetch is the difference between paying the max and the sum.
      </div>
    </div>
  )
})
