import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Power / MDE explorer for ML launches.
// Sliders: baseline rate, MDE, sample size. Live: achieved power + required-n.
// CUPED toggle shrinks metric variance -> smaller MDE detectable at the same n.
// A small "peeking" illustration shows repeated looks inflating the false-positive rate.

const DEFAULTS = { base: 10, mde: 1.0, n: 20000, cuped: false }
const ALPHA = 0.05
const Z_ALPHA = 1.96   // two-sided 0.05
const Z_POWER = 0.84   // 80% power
const CUPED_VAR = 0.6  // CUPED keeps ~60% of variance (40% reduction)

// Normal CDF (Abramowitz-Stegun) for turning a z into power.
function normCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp(-z * z / 2)
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return z > 0 ? 1 - p : p
}

// Peeking: probability at least one of k independent looks crosses alpha under the null
// (upper bound illustration — real sequential correlation is milder, but the shape is right).
const peekFPR = (looks) => 1 - Math.pow(1 - ALPHA, looks)

export const ExperimentPowerViz = forwardRef(function ExperimentPowerViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), [])

  const p = s.base / 100                       // baseline conversion probability
  const delta = (s.mde / 100)                  // absolute lift we want to detect (as a rate)
  const varFactor = s.cuped ? CUPED_VAR : 1
  // Bernoulli variance per arm, scaled by CUPED reduction.
  const variance = p * (1 - p) * varFactor

  // Required n per arm for target 80% power at this MDE:  n = (z_a + z_b)^2 * 2*var / delta^2
  const requiredN = Math.ceil(Math.pow(Z_ALPHA + Z_POWER, 2) * 2 * variance / (delta * delta))

  // Achieved power at the chosen n:  z_b = sqrt(n * delta^2 / (2*var)) - z_a
  const zBeta = Math.sqrt((s.n * delta * delta) / (2 * variance)) - Z_ALPHA
  const power = Math.max(0, Math.min(1, normCdf(zBeta)))
  const powered = power >= 0.8
  const powerPct = (power * 100).toFixed(0)

  // Smallest MDE this n can detect at 80% power:  delta = (z_a+z_b)*sqrt(2*var/n)
  const detectableMDE = ((Z_ALPHA + Z_POWER) * Math.sqrt(2 * variance / s.n) * 100)

  const sliders = [
    { key: 'base', label: 'Baseline rate', min: 1, max: 50, step: 1, fmt: v => v + '%' },
    { key: 'mde', label: 'MDE (lift to detect)', min: 0.2, max: 5, step: 0.1, fmt: v => v.toFixed(1) + '%' },
    { key: 'n', label: 'Sample size / arm', min: 2000, max: 200000, step: 2000, fmt: v => (v / 1000) + 'k' },
  ]

  // Power curve sweep across n for the SVG.
  const W = 340, H = 132, x0 = 40, x1 = 320, y0 = 116, y1 = 16
  const nMax = 200000
  const curveX = (n) => x0 + (n / nMax) * (x1 - x0)
  const curveY = (pw) => y0 - pw * (y0 - y1)
  const pts = []
  for (let i = 0; i <= 40; i++) {
    const n = (i / 40) * nMax
    const zb = Math.sqrt((n * delta * delta) / (2 * variance)) - Z_ALPHA
    pts.push(`${curveX(n).toFixed(1)},${curveY(Math.max(0, Math.min(1, normCdf(zb)))).toFixed(1)}`)
  }

  const looks = [1, 2, 5, 10, 20]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      {/* live readout */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, padding: '8px 10px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8 }}>
          <div style={{ fontSize: '0.58rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>Achieved power</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: powered ? 'var(--prime)' : '#ef4444' }}>{powerPct}%</div>
          <div style={{ fontSize: '0.62rem', color: powered ? 'var(--ink-low)' : '#ef4444' }}>{powered ? 'adequately powered' : 'underpowered — a coin flip'}</div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8 }}>
          <div style={{ fontSize: '0.58rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>Required n / arm</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink-hi)' }}>{requiredN >= 1000 ? (requiredN / 1000).toFixed(1) + 'k' : requiredN}</div>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>for 80% power at {s.mde.toFixed(1)}% MDE</div>
        </div>
      </div>

      {/* power curve */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 8px' }}>
        <line x1={x0} y1={y0} x2={x1} y2={y0} stroke="var(--ink-low)" strokeWidth="1" />
        <line x1={x0} y1={y0} x2={x0} y2={y1} stroke="var(--ink-low)" strokeWidth="1" />
        <text x={(x0 + x1) / 2} y={H - 2} textAnchor="middle" fill="var(--ink-low)" fontSize="8">sample size per arm →</text>
        <text x="10" y={(y0 + y1) / 2} textAnchor="middle" fill="var(--ink-low)" fontSize="8" transform={`rotate(-90 10 ${(y0 + y1) / 2})`}>power</text>
        {/* 80% target line */}
        <line x1={x0} y1={curveY(0.8)} x2={x1} y2={curveY(0.8)} stroke="var(--amber)" strokeWidth="1" strokeDasharray="4,3" />
        <text x={x0 + 4} y={curveY(0.8) - 3} fill="var(--amber)" fontSize="8">target 0.80</text>
        {/* power curve */}
        <polyline points={pts.join(' ')} fill="none" stroke="var(--prime)" strokeWidth="2.4" />
        {/* current operating point */}
        <line x1={curveX(s.n)} y1={y0} x2={curveX(s.n)} y2={curveY(power)} stroke="var(--ink-low)" strokeWidth="1" strokeDasharray="2,2" />
        <circle cx={curveX(s.n)} cy={curveY(power)} r="4" fill={powered ? 'var(--prime)' : '#ef4444'} stroke="var(--depth)" strokeWidth="1.5" />
        <text x={Math.min(curveX(s.n) + 6, x1 - 60)} y={curveY(power) - 6} fill="var(--ink-hi)" fontSize="8.5" fontWeight="700">you: {powerPct}%</text>
      </svg>

      {/* sliders */}
      {sliders.map(sl => (
        <div key={sl.key} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
            <span>{sl.label}</span>
            <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{sl.fmt(s[sl.key])}</span>
          </div>
          <input type="range" min={sl.min} max={sl.max} step={sl.step} value={s[sl.key]} onChange={e => set(sl.key, +e.target.value)} style={{ width: '100%' }} />
        </div>
      ))}

      {/* CUPED toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0', cursor: 'pointer', padding: '7px 10px', background: s.cuped ? 'var(--prime-faint)' : 'var(--depth)', border: `1px solid ${s.cuped ? 'var(--prime)' : 'var(--rim)'}`, borderRadius: 8 }}>
        <input type="checkbox" checked={s.cuped} onChange={e => set('cuped', e.target.checked)} />
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-hi)', fontWeight: 600 }}>CUPED variance reduction (−40%)</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.64rem', color: 'var(--ink-low)' }}>
          smallest detectable lift: <b style={{ color: s.cuped ? 'var(--prime)' : 'var(--ink-mid)' }}>{detectableMDE.toFixed(2)}%</b>
        </span>
      </label>
      <div style={{ fontSize: '0.65rem', color: 'var(--ink-low)', lineHeight: 1.5, marginBottom: 12 }}>
        CUPED subtracts predictable pre-period variance — the effect estimate is unchanged, but the noise drops, so the <i>same n</i> detects a smaller lift (or your required-n falls at the same MDE). Toggle it and watch required-n and the detectable-lift both shrink.
      </div>

      {/* peeking illustration */}
      <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase', marginBottom: 4 }}>Peeking inflates the false-positive rate</div>
      <svg viewBox="0 0 340 96" style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 4px' }}>
        <line x1="40" y1="78" x2="330" y2="78" stroke="var(--ink-low)" strokeWidth="1" />
        {/* nominal alpha reference */}
        {(() => { const yA = 78 - (ALPHA / 0.7) * 60; return (
          <g>
            <line x1="40" y1={yA} x2="330" y2={yA} stroke="var(--amber)" strokeWidth="1" strokeDasharray="4,3" />
            <text x="44" y={yA - 3} fill="var(--amber)" fontSize="8">nominal α = 5%</text>
          </g>
        )})()}
        {looks.map((k, i) => {
          const fpr = peekFPR(k)
          const bw = 40, gap = (330 - 40 - looks.length * bw) / (looks.length + 1)
          const x = 40 + gap + i * (bw + gap)
          const h = Math.min(1, fpr / 0.7) * 60
          const y = 78 - h
          const bad = fpr > 0.06
          return (
            <g key={k}>
              <rect x={x} y={y} width={bw} height={h} fill={bad ? '#ef4444' : 'var(--prime)'} opacity="0.85" rx="2" />
              <text x={x + bw / 2} y={y - 3} textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--ink-hi)">{(fpr * 100).toFixed(0)}%</text>
              <text x={x + bw / 2} y="90" textAnchor="middle" fontSize="7.5" fill="var(--ink-low)">{k} look{k > 1 ? 's' : ''}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ fontSize: '0.65rem', color: 'var(--ink-low)', lineHeight: 1.5 }}>
        Each extra peek at a fixed-horizon test is another chance for noise to cross the line. Look 20 times and the true false-positive rate is ~64%, not 5%. Sequential / always-valid methods spend the error budget across looks so you <i>can</i> stop early without this inflation.
      </div>
    </div>
  )
})
