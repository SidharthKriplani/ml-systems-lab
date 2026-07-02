import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: the discount factor γ is not a hyperparameter you tune blindly — it sets
// the agent's effective planning horizon. γ=0.9 → ~10 steps matter; γ=0.99 → ~100.
// A reward N steps away is worth γ^N now. Slide γ and watch how far the future reaches.

const DEFAULT_GAMMA = 0.9

// effective horizon ≈ 1/(1-γ): the number of steps over which future reward
// still contributes meaningfully (the point where the weight decays to ~1/e).
const horizon = (g) => (g >= 1 ? Infinity : 1 / (1 - g))

const barColor = (w) => (w > 0.5 ? 'var(--prime)' : w > 0.15 ? 'var(--amber)' : 'var(--ink-low)')

export const DiscountHorizonViz = forwardRef(function DiscountHorizonViz(props, ref) {
  const [gamma, setGamma] = useState(DEFAULT_GAMMA)

  useImperativeHandle(ref, () => ({ reset: () => setGamma(DEFAULT_GAMMA) }))

  const set = useCallback((v) => setGamma(v), [])

  // discounted weight γ^N of a unit reward received N steps in the future
  const steps = [0, 1, 2, 5, 10, 20, 50, 100]
  const weights = steps.map(n => Math.pow(gamma, n))

  const h = horizon(gamma)

  // a concrete choice: +1 goal reward, -0.01 per step. Value of a 5-step vs 10-step path.
  const pathValue = (len) => Math.pow(gamma, len) * 1 - 0.01 * (1 - Math.pow(gamma, len)) / (1 - gamma)
  const v5 = pathValue(5)
  const v10 = pathValue(10)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
          <span>Discount factor γ</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{gamma.toFixed(3)}</span>
        </div>
        <input type="range" min={0} max={0.999} step={0.001} value={gamma} onChange={e => set(+e.target.value)} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>
          <span>0 (myopic)</span><span>0.999 (far-sighted)</span>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: '4px' }}>
        Value of +1 received N steps from now = γ<sup>N</sup>
      </div>
      <div style={{ marginBottom: '10px' }}>
        {steps.map((n, i) => {
          const w = weights[i]
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <div style={{ width: 54, fontSize: '0.62rem', color: 'var(--ink-low)', textAlign: 'right' }}>{n} steps</div>
              <div style={{ flex: 1, background: 'var(--depth)', borderRadius: 4, height: 13, position: 'relative' }}>
                <div style={{ width: `${Math.max(1, w * 100)}%`, height: '100%', background: barColor(w), borderRadius: 4, opacity: 0.85 }} />
              </div>
              <div style={{ width: 40, fontSize: '0.62rem', color: 'var(--ink-mid)' }}>{w < 0.001 ? '≈0' : w.toFixed(3)}</div>
            </div>
          )
        })}
      </div>

      <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>Effective horizon ≈ 1/(1−γ)</span>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--prime)' }}>
          {isFinite(h) ? `~${Math.round(h)} steps` : '∞'}
        </span>
      </div>

      <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: '4px' }}>
          Grid robot: +1 at goal, −0.01 per step. Value of each path back to the goal:
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.72rem' }}>
          <span>5-step path: <b style={{ color: 'var(--ink-hi)' }}>{v5.toFixed(3)}</b></span>
          <span>10-step path: <b style={{ color: 'var(--ink-hi)' }}>{v10.toFixed(3)}</b></span>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.72rem', marginTop: '4px', color: v5 > v10 ? 'var(--prime)' : 'var(--amber)' }}>
          shorter path wins by {(v5 - v10).toFixed(3)}
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        At γ=0.9 a reward 100 steps away is worth 0.00003 — invisible. Push γ to 0.99 and that
        same reward is worth 0.37: the agent now plans ten times further, but every value estimate
        carries ten times the Monte-Carlo variance. Horizon is a training-difficulty dial, not a free knob.
      </div>
    </div>
  )
})
