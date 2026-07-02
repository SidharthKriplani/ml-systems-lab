import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: real-time latency is a budget in ms, not a vibe. Allocate ms across
// components; serial vs parallel feature fetch changes the sum; watch the SLA.

const SLA = 50 // ms

const DEFAULTS = {
  featA: 8, featB: 8, featC: 8, featD: 8, // four feature sources
  inference: 15,
  network: 4,
  serialization: 2,
  parallelFeatures: true,
}

const barColor = (over) => (over ? '#ef4444' : 'var(--prime)')

export const LatencyBudgetViz = forwardRef(function LatencyBudgetViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))

  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const feats = [s.featA, s.featB, s.featC, s.featD]
  const featCost = s.parallelFeatures ? Math.max(...feats) : feats.reduce((a, b) => a + b, 0)
  const total = featCost + s.inference + s.network + s.serialization
  const over = total > SLA

  const rows = [
    { label: `Feature fetch (${s.parallelFeatures ? 'parallel: max' : 'serial: sum'})`, val: featCost, fixed: true },
    { label: 'Model inference', key: 'inference', val: s.inference, min: 3, max: 45 },
    { label: 'Network', key: 'network', val: s.network, min: 1, max: 15 },
    { label: 'Serialization', key: 'serialization', val: s.serialization, min: 0, max: 10 },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: '4px' }}>Four feature sources (ms each)</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['featA', 'featB', 'featC', 'featD'].map((k, i) => (
            <div key={k} style={{ flex: 1 }}>
              <input type="range" min={1} max={30} value={s[k]} onChange={e => set(k, +e.target.value)} style={{ width: '100%' }} />
              <div style={{ textAlign: 'center', fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>{['A', 'B', 'C', 'D'][i]}: {s[k]}</div>
            </div>
          ))}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={s.parallelFeatures} onChange={e => set('parallelFeatures', e.target.checked)} />
          Async fan-out (fetch features in parallel, pay the max not the sum)
        </label>
      </div>

      {rows.filter(r => r.key).map(r => (
        <div key={r.key} style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span>{r.label}</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{r.val}ms</span>
          </div>
          <input type="range" min={r.min} max={r.max} value={r.val} onChange={e => set(r.key, +e.target.value)} style={{ width: '100%' }} />
        </div>
      ))}

      <div style={{ marginTop: '10px' }}>
        {rows.map((r, i) => {
          const pct = Math.min(100, (r.val / SLA) * 100)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <div style={{ width: 130, fontSize: '0.62rem', color: 'var(--ink-low)', textAlign: 'right' }}>{r.label.split(' (')[0]}</div>
              <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 4, height: 14, position: 'relative' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: barColor(over), borderRadius: 4, opacity: 0.8 }} />
              </div>
              <div style={{ width: 34, fontSize: '0.62rem', color: 'var(--ink-mid)' }}>{r.val}ms</div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '10px', background: 'var(--depth)', border: `1px solid ${over ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>Total P99 vs {SLA}ms SLA</span>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: over ? '#ef4444' : '#22c55e' }}>
          {total.toFixed(0)}ms {over ? '✗ SLA MISS' : '✓'}
        </span>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Turn off async fan-out and four 8ms features cost 32ms instead of 8ms — the SLA
        breaks before the model even runs. The bottleneck is almost never where you expect.
      </div>
    </div>
  )
})
