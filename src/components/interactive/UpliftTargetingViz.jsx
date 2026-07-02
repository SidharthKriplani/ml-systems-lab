import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: targeting the top users by PURCHASE PROBABILITY spends the budget on
// Sure Things (buy anyway → zero incremental) and can hit Sleeping Dogs
// (negative uplift). Targeting by UPLIFT (τ̂) spends it on Persuadables. Move
// the budget slider and flip the strategy — watch incremental purchases diverge.

// Four segments as shares of a 100k-user base, each with a baseline buy-rate
// and an uplift (incremental buy prob from the discount).
const SEGMENTS = [
  { name: 'Sure Things', share: 0.25, propensity: 0.80, uplift: 0.00, color: 'var(--ink-mid)' },
  { name: 'Persuadables', share: 0.20, propensity: 0.35, uplift: 0.30, color: 'var(--prime)' },
  { name: 'Lost Causes', share: 0.35, propensity: 0.05, uplift: 0.00, color: 'var(--ink-low)' },
  { name: 'Sleeping Dogs', share: 0.20, propensity: 0.55, uplift: -0.15, color: '#ef4444' },
]
const BASE = 100 // thousands of users

const DEFAULTS = { budgetPct: 30, byUplift: true }

// Greedy fill: order segments by the chosen score, spend budget top-down.
function incrementalPurchases(byUplift, budgetUsers) {
  const ranked = [...SEGMENTS].sort((a, b) =>
    byUplift ? b.uplift - a.uplift : b.propensity - a.propensity
  )
  let remaining = budgetUsers
  let inc = 0
  const filled = []
  for (const seg of ranked) {
    const segUsers = seg.share * BASE
    const take = Math.min(segUsers, remaining)
    inc += take * seg.uplift
    filled.push({ ...seg, take })
    remaining -= take
    if (remaining <= 0) break
  }
  return { inc, filled }
}

export const UpliftTargetingViz = forwardRef(function UpliftTargetingViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const budgetUsers = (s.budgetPct / 100) * BASE
  const chosen = incrementalPurchases(s.byUplift, budgetUsers)
  const other = incrementalPurchases(!s.byUplift, budgetUsers)
  const gain = other.inc !== 0 ? chosen.inc / Math.max(0.001, other.inc) : 0

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {[{ k: true, l: 'Target by uplift τ̂' }, { k: false, l: 'Target by propensity ŷ' }].map(o => (
          <button key={String(o.k)} onClick={() => set('byUplift', o.k)}
            style={{ flex: 1, padding: '6px', fontSize: '0.7rem', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${s.byUplift === o.k ? 'var(--prime)' : 'var(--rim)'}`,
              background: s.byUplift === o.k ? 'var(--prime-faint)' : 'var(--depth)',
              color: s.byUplift === o.k ? 'var(--ink-hi)' : 'var(--ink-low)', fontWeight: s.byUplift === o.k ? 700 : 400 }}>
            {o.l}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <span>Budget (share of users contacted)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.budgetPct}% ({budgetUsers.toFixed(0)}k)</span>
        </div>
        <input type="range" min={5} max={100} step={5} value={s.budgetPct} onChange={e => set('budgetPct', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ fontSize: '0.64rem', color: 'var(--ink-low)', marginBottom: '4px' }}>Who the budget reaches (filled top-down by the chosen score)</div>
      {chosen.filled.map((seg, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: 92, fontSize: '0.62rem', color: 'var(--ink-mid)', textAlign: 'right' }}>{seg.name}</div>
          <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 4, height: 14, position: 'relative' }}>
            <div style={{ width: `${(seg.take / BASE) * 100 * 2.5}%`, maxWidth: '100%', height: '100%', background: seg.color, borderRadius: 4, opacity: 0.85 }} />
          </div>
          <div style={{ width: 44, fontSize: '0.6rem', color: 'var(--ink-low)' }}>{seg.take.toFixed(0)}k · τ{seg.uplift >= 0 ? '+' : ''}{seg.uplift}</div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 8, padding: '7px 10px', border: '1px solid var(--prime)' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Incremental buys ({s.byUplift ? 'uplift' : 'propensity'})</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: chosen.inc >= 0 ? '#22c55e' : '#ef4444' }}>{chosen.inc.toFixed(1)}k</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 8, padding: '7px 10px', border: '1px solid var(--rim)' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>If instead ({!s.byUplift ? 'uplift' : 'propensity'})</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: other.inc >= 0 ? 'var(--ink-mid)' : '#ef4444' }}>{other.inc.toFixed(1)}k</div>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        At a small budget, propensity targeting spends every dollar on Sure Things — zero incremental —
        and reaches Sleeping Dogs whose uplift is negative. Uplift targeting fills Persuadables first.
        {gain > 1.2 && s.budgetPct < 100 ? ` Here uplift wins by ${gain.toFixed(1)}×.` : ''}
      </div>
    </div>
  )
})
