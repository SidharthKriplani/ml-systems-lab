import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive uplift curve: cumulative incremental purchases vs budget for BOTH
// strategies (uplift τ̂ green, propensity ŷ grey) as an SVG line chart. Uplift
// fills Persuadables first; propensity wastes budget on Sure Things and hits
// Sleeping Dogs (negative). Move the budget marker; watch the gap.

const SEGMENTS = [
  { name: 'Sure Things', share: 0.25, propensity: 0.80, uplift: 0.00 },
  { name: 'Persuadables', share: 0.20, propensity: 0.35, uplift: 0.30 },
  { name: 'Lost Causes', share: 0.35, propensity: 0.05, uplift: 0.00 },
  { name: 'Sleeping Dogs', share: 0.20, propensity: 0.55, uplift: -0.15 },
]
const BASE = 100
const DEFAULTS = { budgetPct: 30, byUplift: true }

function incAt(byUplift, budgetUsers) {
  const ranked = [...SEGMENTS].sort((a, b) => byUplift ? b.uplift - a.uplift : b.propensity - a.propensity)
  let rem = budgetUsers, inc = 0
  for (const seg of ranked) { const take = Math.min(seg.share * BASE, rem); inc += take * seg.uplift; rem -= take; if (rem <= 0) break }
  return inc
}

export const UpliftTargetingViz = forwardRef(function UpliftTargetingViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), [])

  const chosen = incAt(s.byUplift, (s.budgetPct / 100) * BASE)
  const other = incAt(!s.byUplift, (s.budgetPct / 100) * BASE)

  const W = 360, H = 140, padL = 30, padB = 22, top = 12
  const maxInc = 6.0
  const sx = b => padL + (b / 100) * (W - padL - 12)
  const sy = v => (H - padB) - (v / maxInc) * (H - padB - top)
  const curve = (byUplift) => { const p = []; for (let b = 0; b <= 100; b += 2) p.push(`${sx(b).toFixed(1)},${sy(incAt(byUplift, (b / 100) * BASE)).toFixed(1)}`); return p.join(' ') }
  const bx = sx(s.budgetPct)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <line x1={padL} y1={H - padB} x2={W - 12} y2={H - padB} stroke="var(--rim)" />
        <line x1={padL} y1={top} x2={padL} y2={H - padB} stroke="var(--rim)" />
        <line x1={bx} y1={top} x2={bx} y2={H - padB} stroke="var(--ink-low)" strokeDasharray="3 3" opacity="0.6" />
        <polyline points={curve(false)} fill="none" stroke="var(--ink-low)" strokeWidth="2" />
        <polyline points={curve(true)} fill="none" stroke="#22c55e" strokeWidth="2.5" />
        <circle cx={bx} cy={sy(chosen)} r="4" fill={s.byUplift ? '#22c55e' : 'var(--ink-low)'} />
        <text x={padL} y={top - 2} fontSize="8" fill="var(--ink-low)">incremental buys (k) vs budget %</text>
        <text x={W - 12} y={H - padB + 12} textAnchor="end" fontSize="8" fill="var(--ink-ghost)">budget % →</text>
        <text x={W - 14} y={top + 8} textAnchor="end" fontSize="8" fill="#22c55e">uplift τ̂</text>
        <text x={W - 14} y={top + 18} textAnchor="end" fontSize="8" fill="var(--ink-low)">propensity ŷ</text>
      </svg>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {[{ k: true, l: 'Target by uplift τ̂' }, { k: false, l: 'Target by propensity ŷ' }].map(o => (
          <button key={String(o.k)} onClick={() => set('byUplift', o.k)} style={{ flex: 1, padding: 6, fontSize: '0.7rem', borderRadius: 6, cursor: 'pointer',
            border: `1px solid ${s.byUplift === o.k ? 'var(--prime)' : 'var(--rim)'}`, background: s.byUplift === o.k ? 'var(--prime-faint)' : 'var(--depth)',
            color: s.byUplift === o.k ? 'var(--ink-hi)' : 'var(--ink-low)', fontWeight: s.byUplift === o.k ? 700 : 400 }}>{o.l}</button>
        ))}
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}><span>budget (share contacted)</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.budgetPct}%</span></div>
        <input type="range" min={5} max={100} step={5} value={s.budgetPct} onChange={e => set('budgetPct', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 8, padding: '7px 10px', border: '1px solid var(--prime)' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>incremental ({s.byUplift ? 'uplift' : 'propensity'})</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: chosen >= 0 ? '#22c55e' : '#ef4444' }}>{chosen.toFixed(1)}k</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 8, padding: '7px 10px', border: '1px solid var(--rim)' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>the other strategy</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: other >= 0 ? 'var(--ink-mid)' : '#ef4444' }}>{other.toFixed(1)}k</div>
        </div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        The propensity curve flattens early — every extra dollar hits Sure Things (zero incremental) and eventually Sleeping Dogs (negative). The uplift curve climbs fast because it fills Persuadables first. Same budget, very different lift.
      </div>
    </div>
  )
})
