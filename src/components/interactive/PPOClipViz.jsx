import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: PPO's clipped surrogate. The objective is min(r·A, clip(r,1-ε,1+ε)·A).
// When A>0 it flattens above 1+ε (stop rewarding a good action you already moved onto);
// when A<0 it flattens below 1-ε. Slide ε (trust-region width) and the policy ratio r,
// and watch the gradient get killed the instant you leave the trust region.

const DEFAULTS = { eps: 0.2, adv: 1 }

const clip = (x, lo, hi) => Math.max(lo, Math.min(hi, x))

export const PPOClipViz = forwardRef(function PPOClipViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))

  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const { eps, adv } = s
  const lo = 1 - eps
  const hi = 1 + eps

  // curve: L_CLIP(r) = min(r*A, clip(r,lo,hi)*A)  — plotted over r ∈ [0, 2]
  const W = 320, H = 130, padL = 34, padB = 22, padT = 10
  const rMin = 0, rMax = 2
  const objAt = (r) => Math.min(r * adv, clip(r, lo, hi) * adv)
  const N = 120
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const r = rMin + (rMax - rMin) * (i / N)
    return { r, v: objAt(r) }
  })
  // y-range symmetric around 0 based on |adv|*(1+eps)
  const yMax = Math.abs(adv) * (1 + eps) * 1.1 || 1
  const x = (r) => padL + (r - rMin) / (rMax - rMin) * (W - padL - 6)
  const y = (v) => padT + (yMax - v) / (2 * yMax) * (H - padT - padB)

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.r).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')

  // is the gradient killed at r=hi+0.05 (A>0) / r=lo-0.05 (A<0)?
  const testR = adv >= 0 ? Math.min(rMax, hi + 0.15) : Math.max(rMin, lo - 0.15)
  const slope = (objAt(testR + 0.01) - objAt(testR - 0.01)) / 0.02
  const clipped = Math.abs(slope) < 1e-6

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
          <span>Clip range ε</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{eps.toFixed(2)} → [{lo.toFixed(2)}, {hi.toFixed(2)}]</span>
        </div>
        <input type="range" min={0.02} max={0.6} step={0.01} value={eps} onChange={e => set('eps', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '0.72rem' }}>
        <span>Advantage A</span>
        <button onClick={() => set('adv', 1)} style={{ flex: 1, padding: '4px', borderRadius: 5, cursor: 'pointer', border: `1px solid ${adv >= 0 ? 'var(--prime)' : 'var(--rim)'}`, background: adv >= 0 ? 'var(--prime-faint)' : 'transparent', color: adv >= 0 ? 'var(--ink-hi)' : 'var(--ink-low)' }}>A &gt; 0 (good action)</button>
        <button onClick={() => set('adv', -1)} style={{ flex: 1, padding: '4px', borderRadius: 5, cursor: 'pointer', border: `1px solid ${adv < 0 ? 'var(--amber)' : 'var(--rim)'}`, background: adv < 0 ? 'var(--depth)' : 'transparent', color: adv < 0 ? 'var(--amber)' : 'var(--ink-low)' }}>A &lt; 0 (bad action)</button>
      </label>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', background: 'var(--depth)', borderRadius: 8, border: '1px solid var(--rim)' }}>
        {/* zero axis */}
        <line x1={padL} y1={y(0)} x2={W - 6} y2={y(0)} stroke="var(--rim)" strokeWidth="1" />
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="var(--rim)" strokeWidth="1" />
        {/* trust region shading */}
        <rect x={x(lo)} y={padT} width={x(hi) - x(lo)} height={H - padT - padB} fill="var(--prime-faint)" opacity="0.3" />
        <line x1={x(lo)} y1={padT} x2={x(lo)} y2={H - padB} stroke="var(--ink-low)" strokeWidth="0.7" strokeDasharray="3 3" />
        <line x1={x(hi)} y1={padT} x2={x(hi)} y2={H - padB} stroke="var(--ink-low)" strokeWidth="0.7" strokeDasharray="3 3" />
        <line x1={x(1)} y1={padT} x2={x(1)} y2={H - padB} stroke="var(--ink-low)" strokeWidth="0.5" />
        {/* objective curve */}
        <path d={path} fill="none" stroke={adv >= 0 ? 'var(--prime)' : 'var(--amber)'} strokeWidth="2" />
        {/* labels */}
        <text x={x(lo)} y={H - 8} textAnchor="middle" fill="var(--ink-mid)" fontSize="7.5">1−ε</text>
        <text x={x(1)} y={H - 8} textAnchor="middle" fill="var(--ink-low)" fontSize="7.5">r=1</text>
        <text x={x(hi)} y={H - 8} textAnchor="middle" fill="var(--ink-mid)" fontSize="7.5">1+ε</text>
        <text x={padL - 4} y={y(0) + 3} textAnchor="end" fill="var(--ink-low)" fontSize="7">0</text>
        <text x={x(1.5)} y={padT + 8} fill="var(--ink-low)" fontSize="7.5">objective L(r)</text>
      </svg>

      <div style={{ marginTop: '10px', background: 'var(--depth)', border: `1px solid ${clipped ? 'var(--prime)' : 'var(--amber)'}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem' }}>
        {adv >= 0
          ? <>Good action, policy already moved to <b>r &gt; 1+ε</b>: {clipped ? <span style={{ color: 'var(--prime)' }}>gradient = 0 ✓ (clipped — no more reward for over-committing)</span> : <span style={{ color: 'var(--amber)' }}>still climbing (inside trust region)</span>}</>
          : <>Bad action, policy already moved away to <b>r &lt; 1−ε</b>: {clipped ? <span style={{ color: 'var(--prime)' }}>gradient = 0 ✓ (clipped — no more push away)</span> : <span style={{ color: 'var(--amber)' }}>still pushing (inside trust region)</span>}</>}
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        The flat regions are the whole trick: once the ratio leaves [1−ε, 1+ε], the objective stops
        changing, so the gradient dies and the update can't drag the policy out of the distribution its
        advantage estimates were computed under. Shrink ε toward 0 and the trust region collapses (barely
        any update per batch); widen it toward 0.6 and PPO stops protecting against collapse.
      </div>
    </div>
  )
})
