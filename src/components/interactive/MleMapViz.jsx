import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: MAP = prior x likelihood. Watch the estimate slide between the prior's
// belief and the data's MLE. A Beta(a,b) prior acts like (a-1)+(b-1) pseudo-observations.
// As real data grows, the likelihood swamps the prior -> MAP -> MLE. This is exactly
// why L2 regularisation should shrink as the dataset grows.

const DEFAULTS = {
  heads: 7,     // observed heads
  n: 10,        // observed flips
  priorA: 2,    // Beta prior alpha
  priorB: 2,    // Beta prior beta
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export const MleMapViz = forwardRef(function MleMapViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))

  const set = useCallback((k, v) => setS(prev => {
    const next = { ...prev, [k]: v }
    if (next.heads > next.n) next.heads = next.n
    return next
  }), [])

  const { heads, n, priorA, priorB } = s
  const tails = n - heads

  const mle = n > 0 ? heads / n : 0.5
  const priorMean = priorA / (priorA + priorB)
  const postA = priorA + heads
  const postB = priorB + tails
  const map = (postA + postB - 2) > 0 ? (postA - 1) / (postA + postB - 2) : priorMean
  const pseudo = (priorA - 1) + (priorB - 1)

  const W = 340, H = 120, PAD = 6
  const x = (theta) => PAD + theta * (W - 2 * PAD)
  const N = 60
  const betaShape = (a, b) => {
    const pts = []
    let maxv = 1e-9
    for (let i = 0; i <= N; i++) {
      const tt = clamp(i / N, 1e-4, 1 - 1e-4)
      const v = Math.pow(tt, a - 1) * Math.pow(1 - tt, b - 1)
      pts.push(v); if (v > maxv) maxv = v
    }
    return pts.map((v, i) => ({ t: i / N, y: v / maxv }))
  }
  const toPath = (pts, h) => pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${(h - PAD - p.y * (h - 2 * PAD - 14)).toFixed(1)}`
  ).join(' ')

  const priorPts = betaShape(priorA, priorB)
  const likePts = betaShape(heads + 1, tails + 1)
  const postPts = betaShape(postA, postB)

  const bar = { display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: 2 }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: 10 }}>
        <div style={bar}><span>Observed heads: {heads}</span><span>out of {n} flips</span></div>
        <input type="range" min={0} max={n} value={heads} onChange={e => set('heads', +e.target.value)} style={{ width: '100%' }} />
        <div style={{ ...bar, marginTop: 6 }}><span>Sample size n</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{n}</span></div>
        <input type="range" min={1} max={500} value={n} onChange={e => set('n', +e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: 4 }}>
          Prior Beta(&alpha;, &beta;) &mdash; injects {pseudo.toFixed(0)} pseudo-observations
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--ink-ghost)', textAlign: 'center' }}>&alpha; (prior heads+1): {priorA}</div>
            <input type="range" min={1} max={40} value={priorA} onChange={e => set('priorA', +e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--ink-ghost)', textAlign: 'center' }}>&beta; (prior tails+1): {priorB}</div>
            <input type="range" min={1} max={40} value={priorB} onChange={e => set('priorB', +e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, fontFamily: 'var(--font-sans)' }}>
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--rim)" />
        <path d={toPath(priorPts, H)} fill="none" stroke="var(--ink-mid)" strokeWidth="1.2" strokeDasharray="3 2" />
        <path d={toPath(likePts, H)} fill="none" stroke="var(--amber)" strokeWidth="1.4" />
        <path d={toPath(postPts, H)} fill="none" stroke="var(--prime)" strokeWidth="2" />
        <line x1={x(mle)} y1={PAD} x2={x(mle)} y2={H - PAD} stroke="var(--amber)" strokeDasharray="2 2" />
        <line x1={x(map)} y1={PAD} x2={x(map)} y2={H - PAD} stroke="var(--prime)" strokeDasharray="2 2" />
        <text x={x(priorMean)} y={12} textAnchor="middle" fill="var(--ink-mid)" fontSize="8">prior</text>
        <text x={clamp(x(mle), 16, W - 16)} y={22} textAnchor="middle" fill="var(--amber)" fontSize="8" fontWeight="700">MLE</text>
        <text x={clamp(x(map), 16, W - 16)} y={H - PAD - 2} textAnchor="middle" fill="var(--prime)" fontSize="8" fontWeight="700">MAP</text>
      </svg>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {[
          { lbl: 'MLE (data only)', val: mle, col: 'var(--amber)' },
          { lbl: 'MAP (posterior)', val: map, col: 'var(--prime)' },
          { lbl: 'Prior mean', val: priorMean, col: 'var(--ink-mid)' },
        ].map(c => (
          <div key={c.lbl} style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>{c.lbl}</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: c.col }}>{c.val.toFixed(3)}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        With 3 heads out of 3, MLE says the coin is <b>always</b> heads (1.000) &mdash; overconfident.
        The prior pulls MAP back toward 0.5. Now drag n up: the likelihood peak sharpens and MAP
        marches to the MLE. The prior&rsquo;s influence is fixed pseudo-counts, so its <b>relative</b>
        weight &mdash; the regularisation strength &mdash; shrinks as the data grows.
      </div>
    </div>
  )
})
