import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

// Teaches: posterior = prior + data, and the prior's pull is inversely
// proportional to the amount of data. Beta(a,b) prior + h heads / n flips ->
// Beta(a+h, b+(n-h)). With little data the prior dominates the posterior mean;
// with lots of data the likelihood (MLE = h/n) takes over and the prior washes
// out. Slide the prior strength and the data count to watch the posterior mean
// migrate between the prior mean and the MLE.

const DEFAULTS = { priorStrength: 2, flips: 3, headRate: 1.0 }
//  priorStrength: total pseudo-counts a+b of a symmetric Beta (a=b=strength/2)
//  flips: number of observed coin flips
//  headRate: fraction of those flips that were heads (slider picks the outcome)

// log Beta pdf up to a constant, evaluated for plotting the curve shape.
const lgamma = (z) => {
  // Lanczos approximation
  const g = 7
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z)
  z -= 1
  let x = c[0]
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}
const betaPdf = (x, a, b) => {
  if (x <= 0 || x >= 1) return 0
  const logB = lgamma(a) + lgamma(b) - lgamma(a + b)
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logB)
}

const W = 320, H = 190, PAD = 30

export const BayesianUpdatingViz = forwardRef(function BayesianUpdatingViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  // shown: how many of the s.flips observations have been folded in so far.
  // null => not animating, use the full slider value. During play() it steps
  // 0 -> s.flips one observation at a time so the posterior visibly tightens.
  const [shown, setShown] = useState(null)
  const timerRef = useRef(null)

  const stop = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }, [])

  const set = useCallback((k, v) => { stop(); setShown(null); setS(prev => ({ ...prev, [k]: v })) }, [stop])

  // play(): reset to the prior (zero observations folded in), then reveal the
  // observed flips one at a time so the learner watches the posterior migrate
  // off the prior toward the MLE and sharpen as evidence accumulates.
  const play = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    const total = s.flips
    setShown(0)
    if (total <= 0) return
    let n = 0
    const tick = () => {
      n += 1
      setShown(n)
      if (n >= total) { timerRef.current = null; return }
      timerRef.current = setTimeout(tick, 700)
    }
    timerRef.current = setTimeout(tick, 700)
  }, [s.flips])

  const pause = useCallback(() => { stop() }, [stop])
  const reset = useCallback(() => { stop(); setShown(null); setS({ ...DEFAULTS }) }, [stop])

  useImperativeHandle(ref, () => ({ play, pause, reset }), [play, pause, reset])
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  // How many flips are currently "revealed": all of them unless mid-animation.
  const nFlips = shown == null ? s.flips : shown

  const priorA = s.priorStrength / 2
  const priorB = s.priorStrength / 2
  const heads = Math.round(nFlips * s.headRate)
  const tails = nFlips - heads
  const postA = priorA + heads
  const postB = priorB + tails

  const priorMean = priorA / (priorA + priorB) // always 0.5 (symmetric)
  const mle = nFlips > 0 ? heads / nFlips : NaN
  const postMean = postA / (postA + postB)

  // sample both curves and share a common y-scale
  const N = 80
  const xs = Array.from({ length: N + 1 }, (_, i) => i / N)
  const priorY = xs.map(x => betaPdf(x, priorA, priorB))
  const postY = xs.map(x => betaPdf(x, postA, postB))
  const yMax = Math.max(1e-6, ...priorY, ...postY) * 1.08

  const toX = (x) => PAD + x * (W - 2 * PAD)
  const toY = (y) => H - PAD - (y / yMax) * (H - 2 * PAD)
  const path = (ys) => ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${toX(xs[i]).toFixed(1)},${toY(y).toFixed(1)}`).join(' ')

  const priorHeavy = Math.abs(postMean - priorMean) < Math.abs(postMean - (isNaN(mle) ? priorMean : mle))

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }}>
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--ink-low)" strokeWidth="1" />
        <line x1={PAD} y1={H - PAD} x2={PAD} y2={PAD} stroke="var(--ink-low)" strokeWidth="1" />
        <text x={PAD} y={H - 8} fill="var(--ink-low)" fontSize="9">0</text>
        <text x={toX(0.5) - 24} y={H - 8} fill="var(--ink-low)" fontSize="9">θ = P(heads)</text>
        <text x={W - PAD - 4} y={H - 8} fill="var(--ink-low)" fontSize="9">1</text>

        {/* prior */}
        <path d={path(priorY)} fill="none" stroke="var(--ink-low)" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* posterior */}
        <path d={path(postY)} fill="none" stroke="var(--prime)" strokeWidth="2.5" />

        {/* markers */}
        {!isNaN(mle) && (
          <>
            <line x1={toX(mle)} y1={toY(0)} x2={toX(mle)} y2={PAD} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 2" />
            <text x={toX(mle) - 4} y={PAD - 4} fill="#ef4444" fontSize="8.5" fontWeight="700">MLE {mle.toFixed(2)}</text>
          </>
        )}
        <line x1={toX(postMean)} y1={toY(0)} x2={toX(postMean)} y2={PAD + 14} stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="3 2" />
        <text x={toX(postMean) - 4} y={PAD + 12} fill="var(--amber)" fontSize="8.5" fontWeight="700">post {postMean.toFixed(2)}</text>

        <text x={W - PAD - 92} y={PAD + 2} fill="var(--ink-low)" fontSize="8">— — prior (mean 0.50)</text>
        <text x={W - PAD - 92} y={PAD + 13} fill="var(--prime)" fontSize="8" fontWeight="700">—— posterior</text>
      </svg>

      <div style={{ marginTop: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span>Prior strength (pseudo-counts α+β)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>Beta({priorA.toFixed(1)}, {priorB.toFixed(1)})</span>
        </div>
        <input type="range" min={2} max={60} step={1} value={s.priorStrength} onChange={e => set('priorStrength', +e.target.value)} style={{ width: '100%' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '6px' }}>
          <span>Number of flips (data)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{shown == null ? s.flips : `${nFlips}/${s.flips}`} flips → {heads}H / {tails}T</span>
        </div>
        <input type="range" min={0} max={300} step={1} value={s.flips} onChange={e => set('flips', +e.target.value)} style={{ width: '100%' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '6px' }}>
          <span>Observed head rate (MLE)</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{(s.headRate * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min={0} max={1} step={0.05} value={s.headRate} onChange={e => set('headRate', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginTop: '10px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <div><div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>prior mean</div><div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--ink-mid)' }}>0.50</div></div>
        <div><div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>MLE (data)</div><div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ef4444' }}>{isNaN(mle) ? '—' : mle.toFixed(2)}</div></div>
        <div><div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>posterior mean</div><div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--amber)' }}>{postMean.toFixed(2)}</div></div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        {priorHeavy
          ? 'Right now the posterior sits closer to the prior (0.50) than to the MLE — the data is too scarce to overrule your prior belief. This is the low-data regime: your conclusion is prior-driven.'
          : 'Right now the posterior sits closer to the MLE than to the prior — the likelihood has taken over and the prior has washed out. This is the high-data regime: your conclusion is data-driven.'}
        {' '}Crank flips to 300 with any prior and the posterior collapses onto the MLE; drop flips to 3 and even a weak prior visibly pulls the estimate off the degenerate MLE.
      </div>
    </div>
  )
})
