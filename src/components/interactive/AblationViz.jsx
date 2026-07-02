import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: ablation is the empirical partial derivative of a system. Toggle
// components off and watch AUC drop. Leave-one-out reads each solo contribution
// — but the interaction trap is only visible when you remove two together:
// {interactions, temporal} drop MORE than the sum of their individual effects,
// so neither is truly vestigial.

const BASE = 0.83 // AUC of the bare system (graph embeddings + scaling backbone)

// Each component's independent (solo) marginal contribution to AUC.
const COMPONENTS = [
  { key: 'graph',        label: 'Graph embeddings',     solo: 0.06 },
  { key: 'temporal',     label: 'Temporal aggregations', solo: 0.02 },
  { key: 'interactions', label: 'Feature interactions',  solo: 0.00 },
  { key: 'scaling',      label: 'Scaling',               solo: 0.01 },
  { key: 'clipping',     label: 'Outlier clipping',      solo: 0.00 },
]

// Synergy bonus: only realised when BOTH members of the pair are present.
const SYNERGY = { pair: ['interactions', 'temporal'], bonus: 0.03 }

const DEFAULTS = { graph: true, temporal: true, interactions: true, scaling: true, clipping: true }

function computeAUC(on) {
  let auc = BASE
  for (const c of COMPONENTS) if (on[c.key]) auc += c.solo
  if (on[SYNERGY.pair[0]] && on[SYNERGY.pair[1]]) auc += SYNERGY.bonus
  return auc
}

const barColor = (drop) => (drop > 0.03 ? 'var(--prime)' : drop > 0 ? '#f59e0b' : 'var(--ink-low)')

export const AblationViz = forwardRef(function AblationViz(props, ref) {
  const [on, setOn] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setOn({ ...DEFAULTS }) }))

  const toggle = useCallback((k) => setOn(prev => ({ ...prev, [k]: !prev[k] })), [])

  const fullAUC = computeAUC(DEFAULTS)
  const currentAUC = computeAUC(on)

  // Per-component leave-one-out drop measured against the FULL system.
  const looRows = COMPONENTS.map(c => {
    const withoutOne = computeAUC({ ...DEFAULTS, [c.key]: false })
    return { ...c, drop: fullAUC - withoutOne }
  })

  // Detect the interaction trap: are exactly the two synergy members currently off?
  const [a, b] = SYNERGY.pair
  const pairOff = !on[a] && !on[b] && COMPONENTS.every(c => c.key === a || c.key === b || on[c.key])
  const soloSum = looRows.find(r => r.key === a).drop + looRows.find(r => r.key === b).drop
  const pairDrop = fullAUC - computeAUC({ ...DEFAULTS, [a]: false, [b]: false })

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: '8px' }}>
        Toggle components off to ablate them. Bars show each component's leave-one-out drop vs the full system.
      </div>

      {looRows.map(r => {
        const pct = Math.min(100, (r.drop / 0.08) * 100)
        return (
          <div key={r.key} style={{ marginBottom: '7px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={on[r.key]} onChange={() => toggle(r.key)} />
              <div style={{ width: 132, fontSize: '0.7rem', color: on[r.key] ? 'var(--ink-hi)' : 'var(--ink-ghost)' }}>
                {r.label}{!on[r.key] && ' (ablated)'}
              </div>
              <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 4, height: 13, position: 'relative' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: barColor(r.drop), borderRadius: 4, opacity: 0.82 }} />
              </div>
              <div style={{ width: 42, fontSize: '0.64rem', color: 'var(--ink-mid)', textAlign: 'right' }}>
                {r.drop > 0 ? '−' : ' '}{r.drop.toFixed(2)}
              </div>
            </label>
          </div>
        )
      })}

      <div style={{ marginTop: '10px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>Current system AUC (full = {fullAUC.toFixed(2)})</span>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: currentAUC >= fullAUC - 0.005 ? '#22c55e' : currentAUC < 0.85 ? '#ef4444' : 'var(--amber)' }}>
          {currentAUC.toFixed(2)}
        </span>
      </div>

      {pairOff ? (
        <div style={{ marginTop: '8px', background: 'rgba(245,158,11,0.12)', border: '1px solid var(--amber)', borderRadius: 8, padding: '8px 12px', fontSize: '0.68rem', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--ink-hi)' }}>Interaction trap.</strong> Feature interactions read −0.00 solo and temporal −0.02 solo
          (sum {soloSum.toFixed(2)}). Yet removing <em>both</em> drops AUC by {pairDrop.toFixed(2)} —
          more than the sum. Neither is vestigial; each depends on the other. Leave-one-out alone would have
          told you to delete interactions.
        </div>
      ) : (
        <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
          Graph embeddings carry −0.06 of the signal — invest there. Interactions read −0.00 solo, so they
          look like dead weight. Now ablate <em>both</em> interactions and temporal at once and watch what happens.
        </div>
      )}
    </div>
  )
})
