import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: AdaGrad's accumulator only grows, so on a dense (constant-gradient)
// layer the effective LR α/√G collapses to zero and training stalls. RMSProp
// swaps the cumulative sum for an EMA (ρ), so G stabilises and the LR holds.
// Drive the gradient scale + ρ + steps and watch the two effective-LR curves.

const STEPS = 200
const ALPHA = 0.1
const EPS = 1e-8

const DEFAULTS = {
  g2: 1.0,   // typical squared-gradient magnitude on a dense layer
  rho: 0.9,  // RMSProp EMA decay
  viewSteps: 200,
}

const W = 320, H = 150, PADL = 34, PADB = 22, PADT = 10

export const AdaGradRMSPropViz = forwardRef(function AdaGradRMSPropViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const n = s.viewSteps
  // Effective LR trajectories under a roughly-constant squared gradient s.g2
  const ada = []   // AdaGrad: G += g2  -> eff = α/√(G+ε)
  const rms = []   // RMSProp: G = ρG + (1-ρ)g2 -> eff = α/√(G+ε)
  let Ga = 0, Gr = 0
  for (let t = 1; t <= STEPS; t++) {
    Ga += s.g2
    Gr = s.rho * Gr + (1 - s.rho) * s.g2
    ada.push(ALPHA / Math.sqrt(Ga + EPS))
    rms.push(ALPHA / Math.sqrt(Gr + EPS))
  }
  const lrMax = ALPHA / Math.sqrt(s.g2 * (1 - s.rho) + EPS) // RMSProp steady scale as ceiling-ish
  const yMax = Math.max(ada[0], rms[0], lrMax) * 1.05

  const x = (i) => PADL + (i / (n - 1)) * (W - PADL - 6)
  const y = (v) => PADT + (1 - v / yMax) * (H - PADT - PADB)
  const path = (arr) => arr.slice(0, n).map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const adaFinal = ada[n - 1]
  const rmsFinal = rms[n - 1]
  const collapse = (rmsFinal / (adaFinal + 1e-12)).toFixed(0)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Typical squared gradient g² (dense layer)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.g2.toFixed(2)}</span>
        </div>
        <input type="range" min={0.1} max={4} step={0.1} value={s.g2} onChange={e => set('g2', +e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>RMSProp ρ (EMA decay — memory window ≈ 1/(1−ρ))</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.rho.toFixed(2)} (~{Math.round(1 / (1 - s.rho))} steps)</span>
        </div>
        <input type="range" min={0.5} max={0.99} step={0.01} value={s.rho} onChange={e => set('rho', +e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Steps elapsed</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.viewSteps}</span>
        </div>
        <input type="range" min={10} max={STEPS} step={5} value={s.viewSteps} onChange={e => set('viewSteps', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', background: 'var(--depth)', borderRadius: 8 }}>
        <line x1={PADL} y1={PADT} x2={PADL} y2={H - PADB} stroke="var(--rim)" strokeWidth="1" />
        <line x1={PADL} y1={H - PADB} x2={W - 6} y2={H - PADB} stroke="var(--rim)" strokeWidth="1" />
        <text x={4} y={PADT + 8} fill="var(--ink-low)" fontSize="8">eff. LR</text>
        <text x={W - 30} y={H - 8} fill="var(--ink-low)" fontSize="8">steps</text>
        <path d={path(ada)} fill="none" stroke="var(--amber)" strokeWidth="2" />
        <path d={path(rms)} fill="none" stroke="var(--prime)" strokeWidth="2" />
        <circle cx={x(n - 1)} cy={y(adaFinal)} r="3" fill="var(--amber)" />
        <circle cx={x(n - 1)} cy={y(rmsFinal)} r="3" fill="var(--prime)" />
      </svg>

      <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '0.68rem' }}>
        <span style={{ color: 'var(--amber)', fontWeight: 700 }}>■ AdaGrad (cumulative sum)</span>
        <span style={{ color: 'var(--prime)', fontWeight: 700 }}>■ RMSProp (EMA)</span>
      </div>

      <div style={{ marginTop: '10px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <span style={{ color: 'var(--ink-low)' }}>Effective LR at step {s.viewSteps}</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>
            AdaGrad {adaFinal.toExponential(1)} · RMSProp {rmsFinal.toExponential(1)}
          </span>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '6px', lineHeight: 1.5 }}>
          On a dense layer every parameter gets a gradient every step, so AdaGrad's G grows like g²·T and its
          learning rate decays as α/√T toward zero — here it is <b>{collapse}×</b> smaller than RMSProp's, which
          holds steady because its EMA forgets old gradients. Lower ρ forgets faster; raise g² and both start lower,
          but only AdaGrad keeps sinking. That collapse is why AdaGrad stalls on deep nets and RMSProp does not.
        </div>
      </div>
    </div>
  )
})
