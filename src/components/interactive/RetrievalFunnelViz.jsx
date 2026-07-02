import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: why a staged funnel exists. Each stage trades recall for latency.
// The user sets how aggressively each stage cuts; the viz shows candidates
// surviving, cumulative latency, and the recall lost at retrieval (unrecoverable).

const CORPUS = 10_000_000

// per-candidate cost (ms) at each stage — cheap → expensive left to right
const STAGE = [
  { name: 'Retrieval',  perItem: 0.0000008, model: 'ANN dot-product' },
  { name: 'Pre-rank',   perItem: 0.00004,   model: 'small GBM / two-tower' },
  { name: 'Rank',       perItem: 0.02,      model: 'full DLRM / cross-features' },
  { name: 'Re-rank',    perItem: 0.05,      model: 'diversity + business rules' },
]

const DEFAULTS = [5000, 500, 100, 20]

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k'
  return String(n)
}

// crude recall model: retrieval recall rises with how many candidates it keeps
// (log-saturating). Downstream stages don't lose recall of *relevant* items much
// because they re-order, so the teaching point is: retrieval width caps final recall.
function retrievalRecall(keep) {
  const r = Math.log10(keep) / Math.log10(50000) // ~1.0 at 50k
  return Math.max(0, Math.min(0.99, r * 0.99))
}

export const RetrievalFunnelViz = forwardRef(function RetrievalFunnelViz(props, ref) {
  const [keep, setKeep] = useState([...DEFAULTS])

  useImperativeHandle(ref, () => ({
    reset: () => setKeep([...DEFAULTS]),
  }))

  const setStage = useCallback((i, v) => {
    setKeep(prev => {
      const next = [...prev]
      next[i] = v
      // enforce monotonic narrowing
      for (let j = i + 1; j < next.length; j++) if (next[j] > next[j - 1]) next[j] = next[j - 1]
      for (let j = i - 1; j >= 0; j--) if (next[j] < next[j + 1]) next[j] = next[j + 1]
      return next
    })
  }, [])

  const inputs = [CORPUS, keep[0], keep[1], keep[2]]
  const latencies = STAGE.map((s, i) => inputs[i] * s.perItem)
  const totalLatency = latencies.reduce((a, b) => a + b, 0)
  const recall = retrievalRecall(keep[0])
  const SLA = 100
  const over = totalLatency > SLA

  const maxLat = Math.max(...latencies, SLA * 0.4)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {STAGE.map((s, i) => {
          const survive = i === 0 ? keep[0] : keep[i]
          const inCount = inputs[i]
          const w = 20 + 80 * (Math.log10(survive) / Math.log10(CORPUS))
          return (
            <div key={s.name} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>{s.name}</div>
              <div style={{
                margin: '0 auto', width: `${w}%`, minWidth: 34,
                background: 'var(--prime-faint)', border: '1px solid var(--prime)',
                borderRadius: 6, padding: '6px 2px', color: 'var(--ink-hi)', fontWeight: 700, fontSize: '0.72rem',
              }}>{fmt(survive)}</div>
              <div style={{ fontSize: '0.58rem', color: 'var(--ink-ghost)', marginTop: '3px' }}>{fmt(inCount)} in</div>
              <div style={{ fontSize: '0.58rem', color: 'var(--ink-ghost)' }}>{latencies[i].toFixed(latencies[i] < 1 ? 2 : 1)}ms</div>
            </div>
          )
        })}
      </div>

      {STAGE.map((s, i) => {
        if (i === 0) {
          return (
            <div key="ret" style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                <span>Retrieval keeps</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{fmt(keep[0])}</span>
              </div>
              <input type="range" min={500} max={50000} step={500} value={keep[0]}
                onChange={e => setStage(0, +e.target.value)} style={{ width: '100%' }} />
            </div>
          )
        }
        return (
          <div key={s.name} style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
              <span>{s.name} keeps</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{fmt(keep[i])}</span>
            </div>
            <input type="range" min={10} max={i === 1 ? 5000 : i === 2 ? 500 : 100} step={10} value={keep[i]}
              onChange={e => setStage(i, +e.target.value)} style={{ width: '100%' }} />
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>Total latency</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: over ? '#ef4444' : '#22c55e' }}>
            {totalLatency.toFixed(1)}ms {over ? '✗' : '✓'}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-ghost)' }}>SLA {SLA}ms</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>Retrieval recall ceiling</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: recall > 0.9 ? '#22c55e' : recall > 0.75 ? '#f59e0b' : '#ef4444' }}>
            {(recall * 100).toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-ghost)' }}>final recall can't exceed this</div>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Narrow retrieval → latency drops but the recall ceiling falls, and no downstream
        stage can recover an item retrieval never passed. Widen the expensive Rank stage →
        latency explodes. The funnel is the only shape that satisfies both.
      </div>
    </div>
  )
})
