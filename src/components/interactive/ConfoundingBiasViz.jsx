import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive scatter: a confounder Z (two colored groups) shifts both X and Y.
// The naive pooled regression line (red) steepens as Z separates the groups,
// while the true within-group effect (green) stays flat. Drag confounder strength.

const TRUE_SLOPE = 0.35
const N = 22
// deterministic jitter so points don't jump each render
const JX = Array.from({ length: N * 2 }, (_, i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 - 0.5)
const JY = Array.from({ length: N * 2 }, (_, i) => ((Math.sin(i * 78.233) * 12543.1234) % 1 + 1) % 1 - 0.5)

function makePoints(conf) {
  const pts = []
  for (let g = 0; g < 2; g++) for (let i = 0; i < N; i++) {
    const idx = g * N + i
    const baseX = 2.5 + g * conf * 3.5 + JX[idx] * 2.4
    const y = TRUE_SLOPE * baseX + g * conf * 4.0 + JY[idx] * 1.3 + 2
    pts.push({ x: baseX, y, g })
  }
  return pts
}
function ols(pts) {
  const n = pts.length, mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n
  let num = 0, den = 0
  for (const p of pts) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2 }
  const b = den ? num / den : 0
  return { b, a: my - b * mx }
}

export const ConfoundingBiasViz = forwardRef(function ConfoundingBiasViz(props, ref) {
  const [conf, setConf] = useState(1.0)
  useImperativeHandle(ref, () => ({ reset: () => setConf(1.0) }))
  const set = useCallback(v => setConf(v), [])

  const { pts, naive, g0, g1 } = useMemo(() => {
    const pts = makePoints(conf)
    return { pts, naive: ols(pts), g0: ols(pts.filter(p => p.g === 0)), g1: ols(pts.filter(p => p.g === 1)) }
  }, [conf])

  const W = 360, H = 170, pad = 26
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
  const xMin = Math.min(...xs) - 0.5, xMax = Math.max(...xs) + 0.5
  const yMin = Math.min(...ys) - 0.5, yMax = Math.max(...ys) + 0.5
  const sx = x => pad + ((x - xMin) / (xMax - xMin)) * (W - pad * 2)
  const sy = y => H - pad - ((y - yMin) / (yMax - yMin)) * (H - pad * 2)
  const line = (m) => ({ x1: sx(xMin), y1: sy(m.a + m.b * xMin), x2: sx(xMax), y2: sy(m.a + m.b * xMax) })
  const nL = line(naive), l0 = line(g0), l1 = line(g1)
  const withinAvg = (g0.b + g1.b) / 2

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 6px' }}>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--rim)" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="var(--rim)" />
        <text x={W - pad} y={H - pad + 12} textAnchor="end" fill="var(--ink-ghost)" fontSize="8">X (treatment)</text>
        <text x={pad - 4} y={pad} textAnchor="end" fill="var(--ink-ghost)" fontSize="8">Y</text>
        {pts.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="3" fill={p.g === 0 ? 'var(--prime)' : '#4aa3ff'} opacity="0.8" />
        ))}
        {/* within-group true-effect lines */}
        <line x1={l0.x1} y1={l0.y1} x2={l0.x2} y2={l0.y2} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1={l1.x1} y1={l1.y1} x2={l1.x2} y2={l1.y2} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" />
        {/* naive pooled line */}
        <line x1={nL.x1} y1={nL.y1} x2={nL.x2} y2={nL.y2} stroke="#ef4444" strokeWidth="2.5" />
        <text x={pad + 4} y={pad + 2} fill="#ef4444" fontSize="8" fontWeight="700">naive (pooled)</text>
        <text x={pad + 4} y={pad + 13} fill="#22c55e" fontSize="8" fontWeight="700">within Z (true)</text>
      </svg>

      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}><span>confounder strength (Z → X and Z → Y)</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{conf.toFixed(1)}</span></div>
        <input type="range" min={0} max={2} step={0.1} value={conf} onChange={e => set(+e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid #ef4444', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>naive slope</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ef4444' }}>{naive.b.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid #22c55e', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>within-Z (true)</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#22c55e' }}>{withinAvg.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', textTransform: 'uppercase' }}>bias</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--amber)' }}>{(naive.b - withinAvg).toFixed(2)}</div>
        </div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        The true effect (green, ~{TRUE_SLOPE}) never changes. But as Z pushes the two groups apart, the pooled red line steepens — that gap is confounding bias. Adjusting for Z (comparing within color) recovers the truth.
      </div>
    </div>
  )
})
