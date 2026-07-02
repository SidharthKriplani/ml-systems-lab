import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: a K-layer GNN's receptive field grows as (avg_degree)^K. Full-batch
// loads that whole tree per target node — it explodes. Fixed neighbor sampling
// caps the fan-out per hop, trading a small approximation error for tractability.

const MEM_BUDGET = 5_000_000 // node-feature lookups a batch can afford before it's "infeasible"

const DEFAULTS = {
  batch: 512,      // target nodes per mini-batch
  degree: 100,     // average node degree
  layers: 3,       // K
  sampled: true,   // sampling on/off
  s1: 25, s2: 10, s3: 5, // fixed fan-out per hop
}

const fmt = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return String(Math.round(n))
}

export const NeighborExplosionViz = forwardRef(function NeighborExplosionViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))

  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  // per-hop expansion factor: full-batch uses degree at every hop; sampled uses s1..sK
  const sampleSizes = [s.s1, s.s2, s.s3]
  const perHop = []
  let nodesPerTarget = 1 // the target node itself
  let running = 1
  for (let hop = 0; hop < s.layers; hop++) {
    const factor = s.sampled ? sampleSizes[hop] : s.degree
    running *= factor
    perHop.push(running)
    nodesPerTarget += running
  }
  const total = s.batch * nodesPerTarget
  const over = total > MEM_BUDGET

  const maxHop = Math.max(...perHop, 1)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span>Batch (target nodes)</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.batch}</span>
          </div>
          <input type="range" min={64} max={2048} step={64} value={s.batch} onChange={e => set('batch', +e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span>Avg degree</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.degree}</span>
          </div>
          <input type="range" min={5} max={300} step={5} value={s.degree} onChange={e => set('degree', +e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span>Layers K</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.layers}</span>
          </div>
          <input type="range" min={1} max={3} value={s.layers} onChange={e => set('layers', +e.target.value)} style={{ width: '100%' }} />
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.sampled} onChange={e => set('sampled', e.target.checked)} />
        Neighbor sampling (cap fan-out per hop instead of loading every neighbor)
      </label>

      {s.sampled && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          {['s1', 's2', 's3'].map((k, i) => (
            <div key={k} style={{ flex: 1, opacity: i < s.layers ? 1 : 0.35 }}>
              <input type="range" min={1} max={50} value={s[k]} disabled={i >= s.layers} onChange={e => set(k, +e.target.value)} style={{ width: '100%' }} />
              <div style={{ textAlign: 'center', fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>hop {i + 1}: {s[k]}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: '4px' }}>Nodes reached per target node, by hop</div>
      <div style={{ marginBottom: '10px' }}>
        {perHop.map((n, i) => {
          const pct = Math.min(100, (Math.log10(n + 1) / Math.log10(maxHop + 1)) * 100)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <div style={{ width: 44, fontSize: '0.62rem', color: 'var(--ink-low)', textAlign: 'right' }}>hop {i + 1}</div>
              <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 4, height: 14, position: 'relative' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: over ? '#ef4444' : 'var(--prime)', borderRadius: 4, opacity: 0.8 }} />
              </div>
              <div style={{ width: 48, fontSize: '0.62rem', color: 'var(--ink-mid)' }}>{fmt(n)}</div>
            </div>
          )
        })}
      </div>

      <div style={{ background: 'var(--depth)', border: `1px solid ${over ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>Feature lookups per batch<br /><span style={{ fontSize: '0.62rem' }}>vs ~{fmt(MEM_BUDGET)} budget</span></span>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: over ? '#ef4444' : '#22c55e' }}>
          {fmt(total)} {over ? '✗ INFEASIBLE' : '✓'}
        </span>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Turn sampling off with degree 100 and K=3: each target pulls up to 1M nodes and the batch
        blows past any GPU. Sampling caps the fan-out at [25, 10, 5] → ≤250 nodes per target regardless
        of actual degree — the mechanism that makes mini-batch GNN training possible. The cost is
        approximation error: a sampled neighborhood is a noisy estimate of the true one.
      </div>
    </div>
  )
})
