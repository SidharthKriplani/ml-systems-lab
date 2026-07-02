import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive receptive-field blowup: an SVG log-scale bar chart of nodes reached per
// hop (degree^K full-batch), against the memory budget line. Neighbor sampling caps
// each hop's fan-out → bounded cost, the mechanism behind mini-batch GNN training.

const MEM = 5_000_000
const DEFAULTS = { batch: 512, degree: 100, layers: 3, sampled: true, s1: 25, s2: 10, s3: 5 }
const fmt = (n) => n >= 1e9 ? (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : String(Math.round(n))

export const NeighborExplosionViz = forwardRef(function NeighborExplosionViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), [])

  const sizes = [s.s1, s.s2, s.s3]
  const perHop = []; let running = 1, nodesPerTarget = 1
  for (let h = 0; h < s.layers; h++) { running *= (s.sampled ? sizes[h] : s.degree); perHop.push(running); nodesPerTarget += running }
  const total = s.batch * nodesPerTarget
  const over = total > MEM

  const W = 360, H = 118, base = H - 20, top = 14, bx = 44
  const logMax = Math.log10(Math.max(1e6, ...perHop, total / s.batch) + 1)
  const barW = (W - bx - 60)
  const wForHop = (n) => Math.max(2, (Math.log10(n + 1) / logMax) * barW)
  const budgetPerTarget = MEM / s.batch
  const budgetX = bx + wForHop(budgetPerTarget)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <text x="4" y="10" fill="var(--ink-low)" fontSize="8">nodes reached per target, by hop (log scale)</text>
        {perHop.map((n, i) => {
          const y = top + i * ((base - top) / Math.max(perHop.length, 1)), h = (base - top) / Math.max(perHop.length, 1) - 4
          return (
            <g key={i}>
              <text x={bx - 5} y={y + h - 1} textAnchor="end" fontSize="8" fill="var(--ink-low)">hop {i + 1}</text>
              <rect x={bx} y={y} width={wForHop(n)} height={h} fill={over ? '#ef4444' : 'var(--prime)'} opacity="0.85" rx="1" />
              <text x={bx + wForHop(n) + 4} y={y + h - 1} fontSize="8" fill="var(--ink-mid)">{fmt(n)}</text>
            </g>
          )
        })}
        {/* budget line (per-target) */}
        <line x1={budgetX} y1={top - 4} x2={budgetX} y2={base} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
        <text x={budgetX} y={base + 12} textAnchor="middle" fontSize="7.5" fill="#ef4444">budget/target</text>
      </svg>

      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        {[['batch', 'Batch', 64, 2048, 64], ['degree', 'Avg degree', 5, 300, 5], ['layers', 'Layers K', 1, 3, 1]].map(([k, l, mn, mx, st]) => (
          <div key={k} style={{ flex: 1, minWidth: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}><span>{l}</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s[k]}</span></div>
            <input type="range" min={mn} max={mx} step={st} value={s[k]} onChange={e => set(k, +e.target.value)} style={{ width: '100%' }} />
          </div>
        ))}
      </div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.sampled} onChange={e => set('sampled', e.target.checked)} />
        neighbor sampling (cap fan-out per hop)
      </label>
      {s.sampled && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {['s1', 's2', 's3'].map((k, i) => (
            <div key={k} style={{ flex: 1, opacity: i < s.layers ? 1 : 0.35 }}>
              <input type="range" min={1} max={50} value={s[k]} disabled={i >= s.layers} onChange={e => set(k, +e.target.value)} style={{ width: '100%' }} />
              <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--ink-ghost)' }}>hop {i + 1}: {s[k]}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--depth)', border: `1px solid ${over ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>feature lookups / batch <span style={{ fontSize: '0.6rem' }}>vs {fmt(MEM)} budget</span></span>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: over ? '#ef4444' : '#22c55e' }}>{fmt(total)} {over ? '✗ INFEASIBLE' : '✓'}</span>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Turn sampling off at degree 100, K=3: each target pulls ~1M nodes and the batch blows past any GPU. Sampling caps fan-out at [25,10,5] → ≤250 nodes per target regardless of true degree. The cost: a sampled neighborhood is a noisy estimate of the real one.
      </div>
    </div>
  )
})
