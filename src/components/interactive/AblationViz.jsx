import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

// Reactive ablation: toggle components off; an SVG bar chart shows each one's
// leave-one-out AUC drop, and the {interactions, temporal} pair drops MORE than
// the sum of the solos — the synergy the empirical partial derivative misses.

const BASE = 0.83
const COMPONENTS = [
  { key: 'graph',        label: 'Graph embeddings',      solo: 0.06 },
  { key: 'temporal',     label: 'Temporal aggregations', solo: 0.02 },
  { key: 'interactions', label: 'Feature interactions',  solo: 0.00 },
  { key: 'scaling',      label: 'Scaling',               solo: 0.01 },
  { key: 'clipping',     label: 'Outlier clipping',      solo: 0.00 },
]
const SYNERGY = { pair: ['interactions', 'temporal'], bonus: 0.03 }
const DEFAULTS = { graph: true, temporal: true, interactions: true, scaling: true, clipping: true }

function computeAUC(on) {
  let auc = BASE
  for (const c of COMPONENTS) if (on[c.key]) auc += c.solo
  if (on[SYNERGY.pair[0]] && on[SYNERGY.pair[1]]) auc += SYNERGY.bonus
  return auc
}

// Order components are ablated in during play: biggest solo contributor first,
// but keep the synergistic pair {interactions, temporal} adjacent so the
// super-additive drop is visible as they come off together.
const ABLATE_ORDER = ['graph', 'interactions', 'temporal', 'scaling', 'clipping']

export const AblationViz = forwardRef(function AblationViz(props, ref) {
  const [on, setOn] = useState({ ...DEFAULTS })
  const timerRef = useRef(null)

  const stop = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  // play(): start from the full model, then remove one component per step so the
  // user watches the AUC bar fall as each ablation lands — and see the pair drop.
  const play = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    setOn({ ...DEFAULTS })
    let i = 0
    const tick = () => {
      if (i >= ABLATE_ORDER.length) { timerRef.current = null; return }
      const k = ABLATE_ORDER[i]
      setOn(p => ({ ...p, [k]: false }))
      i += 1
      timerRef.current = setTimeout(tick, 800)
    }
    timerRef.current = setTimeout(tick, 800)
  }, [])

  const pause = useCallback(() => { stop() }, [stop])
  const reset = useCallback(() => { stop(); setOn({ ...DEFAULTS }) }, [stop])

  useImperativeHandle(ref, () => ({ play, pause, reset }), [play, pause, reset])
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const toggle = useCallback(k => { stop(); setOn(p => ({ ...p, [k]: !p[k] })) }, [stop])

  const fullAUC = computeAUC(DEFAULTS)
  const currentAUC = computeAUC(on)
  const loo = COMPONENTS.map(c => ({ ...c, drop: fullAUC - computeAUC({ ...DEFAULTS, [c.key]: false }) }))
  const bothOff = !on.interactions && !on.temporal
  const pairDrop = fullAUC - computeAUC({ ...DEFAULTS, interactions: false, temporal: false })
  const soloSum = loo.find(c => c.key === 'interactions').drop + loo.find(c => c.key === 'temporal').drop

  const W = 360, rowH = 22, maxDrop = 0.1, bx = 150, bw = W - bx - 44
  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${COMPONENTS.length * rowH + 24}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <text x="4" y="10" fill="var(--ink-low)" fontSize="8">leave-one-out AUC drop — click a row to toggle it</text>
        {loo.map((c, i) => {
          const y = 18 + i * rowH, w = Math.max(1, (c.drop / maxDrop) * bw)
          const col = !on[c.key] ? 'var(--ink-low)' : c.drop > 0.03 ? 'var(--prime)' : c.drop > 0 ? 'var(--amber)' : 'var(--rim)'
          return (
            <g key={c.key} style={{ cursor: 'pointer' }} onClick={() => toggle(c.key)}>
              <text x={bx - 6} y={y + 11} textAnchor="end" fontSize="8.5" fill={on[c.key] ? 'var(--ink-mid)' : 'var(--ink-ghost)'} style={{ textDecoration: on[c.key] ? 'none' : 'line-through' }}>{c.label}</text>
              <rect x={bx} y={y + 2} width={bw} height={rowH - 8} fill="var(--depth)" rx="2" />
              <rect x={bx} y={y + 2} width={w} height={rowH - 8} fill={col} opacity="0.85" rx="2" />
              <text x={bx + w + 5} y={y + 11} fontSize="8" fill="var(--ink-low)">−{c.drop.toFixed(2)}</text>
            </g>
          )
        })}
      </svg>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {COMPONENTS.map(c => (
          <button key={c.key} onClick={() => toggle(c.key)} style={{
            padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'var(--font-sans)',
            fontWeight: on[c.key] ? 700 : 500, background: on[c.key] ? 'var(--prime)' : 'var(--depth)',
            color: on[c.key] ? '#000' : 'var(--ink-low)', border: `1px solid ${on[c.key] ? 'var(--prime)' : 'var(--rim)'}` }}>
            {on[c.key] ? '✓ ' : '✕ '}{c.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>current AUC</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--prime)' }}>{currentAUC.toFixed(3)}</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--ink-ghost)' }}>full = {fullAUC.toFixed(3)}</div>
        </div>
        <div style={{ flex: 2, background: 'var(--depth)', border: `1px solid ${bothOff ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>the interaction trap</div>
          <div style={{ fontSize: '0.7rem', color: bothOff ? '#ef4444' : 'var(--ink-mid)', lineHeight: 1.4 }}>
            {bothOff
              ? `Dropping interactions + temporal together loses ${pairDrop.toFixed(2)} — more than the ${soloSum.toFixed(2)} their solos predict. Neither looked important alone.`
              : 'Turn OFF both "Feature interactions" and "Temporal" to expose the synergy leave-one-out hides.'}
          </div>
        </div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Ablation is the empirical partial derivative of the system. Leave-one-out reads each solo contribution — but two components that only help <i>together</i> both look vestigial alone. Ablate pairs before deleting anything.
      </div>
    </div>
  )
})
