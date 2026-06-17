import { useState } from 'react'

// ─── Bias-Variance Tradeoff Curve (post 74) ──────────────────────────────────
export function BiasVariancePlot() {
  const W = 520, H = 240, PL = 52, PR = 20, PT = 18, PB = 40
  const cW = W - PL - PR, cH = H - PT - PB

  // x = model complexity 0..1
  const pts = n => Array.from({ length: n }, (_, i) => i / (n - 1))
  const xs = pts(80)

  const bias2  = xs.map(x => 0.85 * Math.exp(-3 * x) + 0.02)
  const vari   = xs.map(x => 0.04 + 0.8 * Math.pow(x, 2.4))
  const total  = xs.map((x, i) => bias2[i] + vari[i] + 0.05)

  const toSVG = (arr, yScale) =>
    arr.map((y, i) => {
      const sx = PL + xs[i] * cW
      const sy = PT + cH - Math.min(y / yScale, 1) * cH
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`
    }).join(' ')

  const yMax = 1.0
  const minTotal = Math.min(...total)
  const minIdx   = total.indexOf(minTotal)
  const optX     = PL + xs[minIdx] * cW
  const optY     = PT + cH - (minTotal / yMax) * cH

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        ⟩ Bias-Variance Tradeoff
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block', overflow: 'visible' }}>
        {/* axes */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="var(--rim)" strokeWidth="1" />
        <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="var(--rim)" strokeWidth="1" />
        {/* labels */}
        <text x={PL + cW / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--ink-mid)" fontFamily="var(--font-mono)">Model Complexity →</text>
        <text x={14} y={PT + cH / 2} textAnchor="middle" fontSize="11" fill="var(--ink-mid)" fontFamily="var(--font-mono)" transform={`rotate(-90,14,${PT + cH / 2})`}>Error</text>
        {/* curves */}
        <path d={toSVG(bias2, yMax)} fill="none" stroke="#4EA8DE" strokeWidth="2" strokeDasharray="5,3" />
        <path d={toSVG(vari,  yMax)} fill="none" stroke="#F4845F" strokeWidth="2" strokeDasharray="5,3" />
        <path d={toSVG(total, yMax)} fill="none" stroke="var(--prime)" strokeWidth="2.5" />
        {/* optimal point */}
        <circle cx={optX} cy={optY} r="5" fill="var(--prime)" />
        <line x1={optX} y1={PT} x2={optX} y2={PT + cH} stroke="var(--prime)" strokeWidth="1" strokeDasharray="4,3" strokeOpacity="0.5" />
        <text x={optX + 6} y={optY - 6} fontSize="10" fill="var(--prime)" fontFamily="var(--font-mono)">Optimal</text>
        {/* legend */}
        <rect x={PL + cW - 140} y={PT + 4} width="135" height="62" rx="6" fill="var(--surface)" stroke="var(--rim)" />
        <line x1={PL + cW - 130} y1={PT + 18} x2={PL + cW - 110} y2={PT + 18} stroke="#4EA8DE" strokeWidth="2" strokeDasharray="4,2" />
        <text x={PL + cW - 105} y={PT + 22} fontSize="10" fill="var(--ink-mid)" fontFamily="var(--font-mono)">Bias²</text>
        <line x1={PL + cW - 130} y1={PT + 36} x2={PL + cW - 110} y2={PT + 36} stroke="#F4845F" strokeWidth="2" strokeDasharray="4,2" />
        <text x={PL + cW - 105} y={PT + 40} fontSize="10" fill="var(--ink-mid)" fontFamily="var(--font-mono)">Variance</text>
        <line x1={PL + cW - 130} y1={PT + 54} x2={PL + cW - 110} y2={PT + 54} stroke="var(--prime)" strokeWidth="2.5" />
        <text x={PL + cW - 105} y={PT + 58} fontSize="10" fill="var(--prime)" fontFamily="var(--font-mono)">Total Error</text>
      </svg>
      <p style={{ fontSize: '12px', color: 'var(--ink-mid)', marginTop: '8px', lineHeight: 1.6 }}>
        The optimal model complexity minimises total error. Left of optimal: high bias (underfitting). Right: high variance (overfitting).
      </p>
    </div>
  )
}

// ─── NDCG Position Discounting (post 71) ─────────────────────────────────────
export function NDCGVisual() {
  const items = [
    { label: 'Result 1', rel: 3, color: '#4CAF50' },
    { label: 'Result 2', rel: 0, color: 'var(--rim)' },
    { label: 'Result 3', rel: 2, color: '#8BC34A' },
    { label: 'Result 4', rel: 1, color: '#CDDC39' },
    { label: 'Result 5', rel: 0, color: 'var(--rim)' },
  ]
  const dcgAt = (arr) => arr.reduce((s, it, i) => s + (Math.pow(2, it.rel) - 1) / Math.log2(i + 2), 0)
  const ideal = [...items].sort((a, b) => b.rel - a.rel)
  const dcg   = dcgAt(items)
  const idcg  = dcgAt(ideal)
  const ndcg  = idcg > 0 ? (dcg / idcg).toFixed(3) : '—'

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        ⟩ NDCG — Position Discounting
      </div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {['Actual Ranking', 'Ideal Ranking'].map((label, side) => {
          const list = side === 0 ? items : ideal
          return (
            <div key={side} style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>{label}</div>
              {list.map((it, i) => {
                const discount = (1 / Math.log2(i + 2)).toFixed(3)
                const gain     = (Math.pow(2, it.rel) - 1).toFixed(0)
                const contrib  = ((Math.pow(2, it.rel) - 1) / Math.log2(i + 2)).toFixed(3)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{ width: '18px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', flexShrink: 0 }}>#{i+1}</div>
                    <div style={{ flex: 1, background: it.color, opacity: it.rel === 0 ? 0.2 : 0.7 + it.rel * 0.1,
                      height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#000' }}>rel={it.rel}</span>
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', flexShrink: 0 }}>
                      ×{discount}={contrib}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: '14px', padding: '12px 16px', background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px',
        fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--ink)' }}>
        DCG = {dcg.toFixed(3)} &nbsp;·&nbsp; IDCG = {idcg.toFixed(3)} &nbsp;·&nbsp; <span style={{ color: 'var(--prime)' }}>NDCG = {ndcg}</span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--ink-mid)', marginTop: '8px', lineHeight: 1.6 }}>
        Items at lower positions contribute less regardless of relevance. A highly relevant item buried at position 5 barely moves the score.
      </p>
    </div>
  )
}

// ─── Attention Heatmap (post 54) ─────────────────────────────────────────────
export function AttentionHeatmap() {
  const tokens = ['The', 'cat', 'sat', 'on', 'mat']
  // Simulated attention weights (row = query token, col = key token)
  const weights = [
    [0.70, 0.10, 0.08, 0.06, 0.06],
    [0.12, 0.65, 0.10, 0.07, 0.06],
    [0.06, 0.15, 0.58, 0.12, 0.09],
    [0.08, 0.08, 0.10, 0.60, 0.14],
    [0.05, 0.08, 0.12, 0.18, 0.57],
  ]
  const [hoveredCell, setHoveredCell] = useState(null)
  const cell = 52

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        ⟩ Attention Weight Matrix
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr>
              <td style={{ padding: '4px 8px', color: 'var(--ink-mid)', fontSize: '10px' }}>Q↓ K→</td>
              {tokens.map(t => <th key={t} style={{ padding: '4px 8px', color: 'var(--ink-mid)', fontWeight: 500, width: cell }}>{t}</th>)}
            </tr>
          </thead>
          <tbody>
            {weights.map((row, r) => (
              <tr key={r}>
                <td style={{ padding: '4px 8px', color: 'var(--ink-mid)', fontWeight: 500, whiteSpace: 'nowrap' }}>{tokens[r]}</td>
                {row.map((w, c) => {
                  const alpha = 0.1 + w * 0.9
                  const isHov = hoveredCell && hoveredCell[0] === r && hoveredCell[1] === c
                  return (
                    <td key={c}
                      onMouseEnter={() => setHoveredCell([r, c])}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{ width: cell, height: cell, textAlign: 'center', cursor: 'default', position: 'relative',
                        background: `rgba(240,165,0,${alpha})`,
                        outline: isHov ? '2px solid var(--prime)' : 'none',
                        color: w > 0.4 ? '#000' : 'var(--ink)', transition: 'outline var(--t-fast)' }}>
                      {w.toFixed(2)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--ink-mid)', marginTop: '10px', lineHeight: 1.6 }}>
        Each row is a query token attending to all key tokens. Diagonal dominance shows each token primarily attends to itself; off-diagonal entries capture syntactic relationships.
      </p>
    </div>
  )
}

// ─── L1 vs L2 Regularisation Geometry (post 112) ────────────────────────────
export function L1L2Geometry() {
  const W = 480, H = 220, cx = 120, cy = 110, r = 75
  // Elliptical loss contours centred at (260, 80)
  const lcx = 290, lcy = 75
  const contours = [0.8, 0.6, 0.4]

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        ⟩ L1 (Lasso) vs L2 (Ridge) Constraint Regions
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        {/* ── L1 panel (left) ── */}
        <text x={cx} y={18} textAnchor="middle" fontSize="11" fill="var(--prime)" fontFamily="var(--font-mono)">L1 (Lasso)</text>
        {/* diamond constraint region */}
        <polygon points={`${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}`}
          fill="rgba(78,168,222,0.12)" stroke="#4EA8DE" strokeWidth="1.5" />
        {/* loss contours */}
        {contours.map((s, i) => (
          <ellipse key={i} cx={cx + 55 - i*10} cy={cy - 40 + i*8} rx={30 + i*18} ry={20 + i*12}
            fill="none" stroke="var(--rim)" strokeWidth="1" strokeDasharray="3,2" />
        ))}
        {/* optimal point — at corner of diamond → sparse solution */}
        <circle cx={cx} cy={cy - r} r="4" fill="var(--prime)" />
        <text x={cx + 6} y={cy - r - 4} fontSize="9" fill="var(--prime)" fontFamily="var(--font-mono)">θ₁=0 (sparse)</text>
        {/* axes */}
        <line x1={cx - r - 10} y1={cy} x2={cx + r + 10} y2={cy} stroke="var(--rim)" strokeWidth="1" />
        <line x1={cx} y1={cy - r - 10} x2={cx} y2={cy + r + 10} stroke="var(--rim)" strokeWidth="1" />
        <text x={cx + r + 12} y={cy + 4} fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">θ₁</text>
        <text x={cx + 3} y={cy - r - 12} fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">θ₂</text>

        {/* ── divider ── */}
        <line x1={W/2} y1={10} x2={W/2} y2={H-10} stroke="var(--rim)" strokeWidth="1" strokeDasharray="4,3" />

        {/* ── L2 panel (right) ── */}
        {(() => {
          const rx2 = W/2 + (W/2 - W/2)/2 + W/4 - 30
          const rcx = W * 3/4, rcy = cy
          return (
            <>
              <text x={rcx} y={18} textAnchor="middle" fontSize="11" fill="#F4845F" fontFamily="var(--font-mono)">L2 (Ridge)</text>
              {/* circle constraint region */}
              <circle cx={rcx} cy={rcy} r={r} fill="rgba(244,132,95,0.12)" stroke="#F4845F" strokeWidth="1.5" />
              {/* loss contours */}
              {contours.map((s, i) => (
                <ellipse key={i} cx={rcx + 45 - i*8} cy={rcy - 35 + i*8} rx={28 + i*18} ry={18 + i*12}
                  fill="none" stroke="var(--rim)" strokeWidth="1" strokeDasharray="3,2" />
              ))}
              {/* optimal point — on curve → non-zero coefficients */}
              <circle cx={rcx - r * 0.27} cy={rcy - r * 0.96} r="4" fill="#F4845F" />
              <text x={rcx - r * 0.27 + 6} y={rcy - r * 0.96 - 4} fontSize="9" fill="#F4845F" fontFamily="var(--font-mono)">θ₁≠0 (shrunk)</text>
              {/* axes */}
              <line x1={rcx - r - 10} y1={rcy} x2={rcx + r + 10} y2={rcy} stroke="var(--rim)" strokeWidth="1" />
              <line x1={rcx} y1={rcy - r - 10} x2={rcx} y2={rcy + r + 10} stroke="var(--rim)" strokeWidth="1" />
              <text x={rcx + r + 12} y={rcy + 4} fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">θ₁</text>
              <text x={rcx + 3} y={rcy - r - 12} fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">θ₂</text>
            </>
          )
        })()}
      </svg>
      <p style={{ fontSize: '12px', color: 'var(--ink-mid)', marginTop: '8px', lineHeight: 1.6 }}>
        L1's diamond corners sit on axes → optimal solution hits a corner → exact zeros (sparsity). L2's smooth circle → optimal solution rarely hits an axis → small but nonzero coefficients.
      </p>
    </div>
  )
}

// ─── Precision-Recall Threshold Slider (post 114) ───────────────────────────
export function PRThresholdSlider() {
  const [threshold, setThreshold] = useState(0.5)

  // Simulated PR curve data
  const prCurve = [
    [0.0, 1.0], [0.1, 0.98], [0.2, 0.95], [0.3, 0.91], [0.4, 0.86],
    [0.5, 0.79], [0.6, 0.70], [0.7, 0.58], [0.8, 0.42], [0.9, 0.22], [1.0, 0.08]
  ]
  // At threshold t: recall ~ 1-t, precision from curve
  const recall    = Math.max(0, 1 - threshold)
  const precision = Math.min(1, 0.3 + 0.7 * (1 - threshold * 0.8))
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0

  const W = 300, H = 220, PL = 40, PB = 36, PT = 14, PR = 14
  const cW = W - PL - PR, cH = H - PB - PT

  const toPath = arr => arr.map(([r, p], i) => {
    const x = PL + r * cW
    const y = PT + (1 - p) * cH
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const dotX = PL + recall * cW
  const dotY = PT + (1 - precision) * cH

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        ⟩ Precision-Recall Trade-off — drag the threshold
      </div>
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, maxWidth: '100%', display: 'block', flexShrink: 0 }}>
          <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="var(--rim)" strokeWidth="1" />
          <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="var(--rim)" strokeWidth="1" />
          <text x={PL + cW / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--ink-mid)" fontFamily="var(--font-mono)">Recall →</text>
          <text x={12} y={PT + cH / 2} textAnchor="middle" fontSize="10" fill="var(--ink-mid)" fontFamily="var(--font-mono)" transform={`rotate(-90,12,${PT + cH / 2})`}>Precision</text>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <g key={v}>
              <text x={PL - 4} y={PT + (1 - v) * cH + 4} textAnchor="end" fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">{v.toFixed(2)}</text>
              <line x1={PL - 2} y1={PT + (1 - v) * cH} x2={PL} y2={PT + (1 - v) * cH} stroke="var(--rim)" strokeWidth="1" />
              <text x={PL + v * cW} y={PT + cH + 14} textAnchor="middle" fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">{v.toFixed(1)}</text>
            </g>
          ))}
          <path d={toPath(prCurve)} fill="none" stroke="var(--prime)" strokeWidth="2" />
          <circle cx={dotX} cy={dotY} r="6" fill="var(--prime)" opacity="0.9" />
        </svg>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
              Threshold: <span style={{ color: 'var(--prime)' }}>{threshold.toFixed(2)}</span>
            </label>
            <input type="range" min="0" max="1" step="0.01" value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--prime)' }} />
          </div>
          {[['Precision', precision], ['Recall', recall], ['F1', f1]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', border: '1px solid var(--rim)', borderRadius: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)' }}>{k}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: k === 'F1' ? 'var(--prime)' : 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{v.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--ink-mid)', marginTop: '10px', lineHeight: 1.6 }}>
        Drag the threshold. Higher threshold → higher precision, lower recall. F1 peaks at the threshold that best balances both.
      </p>
    </div>
  )
}

// ─── Transformer Block Architecture (post 55) ────────────────────────────────
export function TransformerBlock() {
  const W = 320, H = 360
  const blocks = [
    { y: 20,  h: 36, label: 'Input Embeddings + Positional Encoding', fill: 'rgba(78,168,222,0.15)', stroke: '#4EA8DE' },
    { y: 70,  h: 36, label: 'Multi-Head Self-Attention', fill: 'rgba(240,165,0,0.12)', stroke: 'var(--prime)' },
    { y: 120, h: 28, label: 'Add & Layer Norm', fill: 'rgba(255,255,255,0.04)', stroke: 'var(--rim)' },
    { y: 162, h: 36, label: 'Feed-Forward Network (×2 MLP)', fill: 'rgba(244,132,95,0.12)', stroke: '#F4845F' },
    { y: 212, h: 28, label: 'Add & Layer Norm', fill: 'rgba(255,255,255,0.04)', stroke: 'var(--rim)' },
    { y: 254, h: 28, label: '× N layers', fill: 'transparent', stroke: 'var(--rim)', dashed: true },
    { y: 296, h: 36, label: 'Linear + Softmax → Logits', fill: 'rgba(76,175,80,0.12)', stroke: '#4CAF50' },
  ]
  const cx = W / 2

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        ⟩ Transformer Decoder Block
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        {blocks.map((b, i) => (
          <g key={i}>
            {i > 0 && (
              <line x1={cx} y1={blocks[i-1].y + blocks[i-1].h} x2={cx} y2={b.y}
                stroke="var(--rim)" strokeWidth="1.5" markerEnd="url(#arr)" />
            )}
            <rect x={40} y={b.y} width={W - 80} height={b.h} rx="8"
              fill={b.fill} stroke={b.stroke} strokeWidth="1.5"
              strokeDasharray={b.dashed ? '5,3' : 'none'} />
            <text x={cx} y={b.y + b.h / 2 + 4} textAnchor="middle"
              fontSize="11" fill="var(--ink)" fontFamily="var(--font-mono)">{b.label}</text>
          </g>
        ))}
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="var(--rim)" />
          </marker>
        </defs>
        {/* residual connection arrow for attention */}
        <path d={`M 32,88 C 8,88 8,134 32,134`} fill="none" stroke="var(--prime)" strokeWidth="1.5" strokeDasharray="3,2" />
        <text x={4} y={112} fontSize="8" fill="var(--prime)" fontFamily="var(--font-mono)">skip</text>
        {/* residual connection arrow for FFN */}
        <path d={`M 32,180 C 8,180 8,226 32,226`} fill="none" stroke="#F4845F" strokeWidth="1.5" strokeDasharray="3,2" />
        <text x={4} y={204} fontSize="8" fill="#F4845F" fontFamily="var(--font-mono)">skip</text>
      </svg>
      <p style={{ fontSize: '12px', color: 'var(--ink-mid)', marginTop: '8px', lineHeight: 1.6 }}>
        Each transformer block: Multi-Head Attention → residual add → LayerNorm → FFN → residual add → LayerNorm. N such blocks are stacked. The residual connections are what allow gradients to flow through hundreds of layers.
      </p>
    </div>
  )
}

// ─── Calibration Reliability Diagram (post 76) ───────────────────────────────
export function CalibrationPlot() {
  const bins = [
    { mid: 0.1, acc: 0.05 },
    { mid: 0.2, acc: 0.12 },
    { mid: 0.3, acc: 0.18 },
    { mid: 0.4, acc: 0.30 },
    { mid: 0.5, acc: 0.38 },
    { mid: 0.6, acc: 0.48 },
    { mid: 0.7, acc: 0.58 },
    { mid: 0.8, acc: 0.68 },
    { mid: 0.9, acc: 0.78 },
  ]
  const W = 300, H = 240, PL = 40, PB = 36, PT = 16, PR = 16
  const cW = W - PL - PR, cH = H - PB - PT
  const toX = v => PL + v * cW
  const toY = v => PT + (1 - v) * cH
  const bW  = cW / 10

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        ⟩ Reliability Diagram — Overconfident Model
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="var(--rim)" strokeWidth="1" />
        <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="var(--rim)" strokeWidth="1" />
        {/* perfect calibration diagonal */}
        <line x1={toX(0)} y1={toY(0)} x2={toX(1)} y2={toY(1)} stroke="var(--rim)" strokeWidth="1" strokeDasharray="4,3" />
        <text x={toX(0.72)} y={toY(0.78)} fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">Perfect</text>
        {/* bars */}
        {bins.map((b, i) => (
          <rect key={i}
            x={toX(b.mid) - bW / 2} y={toY(b.acc)} width={bW} height={toY(0) - toY(b.acc)}
            fill="rgba(240,165,0,0.5)" stroke="var(--prime)" strokeWidth="1" />
        ))}
        {/* axes labels */}
        <text x={PL + cW / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--ink-mid)" fontFamily="var(--font-mono)">Mean Predicted Probability</text>
        <text x={12} y={PT + cH / 2} textAnchor="middle" fontSize="10" fill="var(--ink-mid)" fontFamily="var(--font-mono)" transform={`rotate(-90,12,${PT + cH / 2})`}>Actual Accuracy</text>
        {[0, 0.5, 1].map(v => (
          <g key={v}>
            <text x={PL - 3} y={toY(v) + 4} textAnchor="end" fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">{v.toFixed(1)}</text>
            <text x={toX(v)} y={PT + cH + 14} textAnchor="middle" fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">{v.toFixed(1)}</text>
          </g>
        ))}
      </svg>
      <p style={{ fontSize: '12px', color: 'var(--ink-mid)', marginTop: '8px', lineHeight: 1.6 }}>
        Bars below the diagonal = overconfidence. When the model says 80% probability, only 68% of those predictions are correct. Fix: temperature scaling (T &gt; 1 softens the distribution).
      </p>
    </div>
  )
}

// ─── Two-Tower vs Cross-Encoder (post 70) ────────────────────────────────────
export function TwoTowerDiagram() {
  const W = 480, H = 200

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        ⟩ Two-Tower Retrieval vs Cross-Encoder Re-ranking
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        {/* ── Left: Two-Tower ── */}
        <text x={110} y={18} textAnchor="middle" fontSize="11" fill="var(--prime)" fontFamily="var(--font-mono)">Stage 1: Two-Tower</text>
        {/* Query encoder */}
        <rect x={20} y={28} width={80} height={32} rx="6" fill="rgba(240,165,0,0.12)" stroke="var(--prime)" strokeWidth="1.5" />
        <text x={60} y={49} textAnchor="middle" fontSize="10" fill="var(--ink)" fontFamily="var(--font-mono)">Query Enc.</text>
        {/* Item encoder */}
        <rect x={20} y={76} width={80} height={32} rx="6" fill="rgba(240,165,0,0.12)" stroke="var(--prime)" strokeWidth="1.5" />
        <text x={60} y={97} textAnchor="middle" fontSize="10" fill="var(--ink)" fontFamily="var(--font-mono)">Item Enc.×M</text>
        <text x={60} y={108} textAnchor="middle" fontSize="8" fill="var(--ink-mid)" fontFamily="var(--font-mono)">(precomputed)</text>
        {/* dot product */}
        <circle cx={155} cy={80} r={16} fill="rgba(240,165,0,0.1)" stroke="var(--prime)" strokeWidth="1.5" />
        <text x={155} y={84} textAnchor="middle" fontSize="12" fill="var(--prime)" fontFamily="var(--font-mono)">·</text>
        {/* arrows */}
        <line x1={100} y1={44} x2={140} y2={72} stroke="var(--rim)" strokeWidth="1.5" />
        <line x1={100} y1={92} x2={140} y2={84} stroke="var(--rim)" strokeWidth="1.5" />
        {/* ANN */}
        <rect x={182} y={62} width={52} height={36} rx="6" fill="rgba(76,175,80,0.12)" stroke="#4CAF50" strokeWidth="1.5" />
        <text x={208} y={80} textAnchor="middle" fontSize="9" fill="var(--ink)" fontFamily="var(--font-mono)">ANN</text>
        <text x={208} y={91} textAnchor="middle" fontSize="8" fill="var(--ink-mid)" fontFamily="var(--font-mono)">top-K</text>
        <line x1={171} y1={80} x2={182} y2={80} stroke="var(--rim)" strokeWidth="1.5" />
        {/* timing */}
        <text x={110} y={150} textAnchor="middle" fontSize="10" fill="#4CAF50" fontFamily="var(--font-mono)">~10ms · Millions of items</text>

        {/* ── Divider ── */}
        <line x1={245} y1={20} x2={245} y2={180} stroke="var(--rim)" strokeWidth="1" strokeDasharray="4,3" />
        <line x1={235} y1={80} x2={255} y2={80} stroke="var(--prime)" strokeWidth="1.5" />
        <text x={245} y={76} textAnchor="middle" fontSize="9" fill="var(--prime)" fontFamily="var(--font-mono)">K</text>
        <text x={245} y={87} textAnchor="middle" fontSize="9" fill="var(--prime)" fontFamily="var(--font-mono)">↓</text>

        {/* ── Right: Cross-Encoder ── */}
        <text x={365} y={18} textAnchor="middle" fontSize="11" fill="#F4845F" fontFamily="var(--font-mono)">Stage 2: Cross-Encoder</text>
        <rect x={258} y={48} width={214} height={64} rx="8" fill="rgba(244,132,95,0.1)" stroke="#F4845F" strokeWidth="1.5" />
        <text x={365} y={73} textAnchor="middle" fontSize="10" fill="var(--ink)" fontFamily="var(--font-mono)">[Query + Candidate]</text>
        <text x={365} y={87} textAnchor="middle" fontSize="10" fill="var(--ink)" fontFamily="var(--font-mono)">→ BERT → score</text>
        <text x={365} y={100} textAnchor="middle" fontSize="8" fill="var(--ink-mid)" fontFamily="var(--font-mono)">(sees full interaction)</text>
        <text x={365} y={150} textAnchor="middle" fontSize="10" fill="#F4845F" fontFamily="var(--font-mono)">~100ms · K candidates only</text>

        {/* labels */}
        <text x={110} y={175} textAnchor="middle" fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">Fast, approximate, scalable</text>
        <text x={365} y={175} textAnchor="middle" fontSize="9" fill="var(--ink-mid)" fontFamily="var(--font-mono)">Slow, precise, full-context</text>
      </svg>
      <p style={{ fontSize: '12px', color: 'var(--ink-mid)', marginTop: '8px', lineHeight: 1.6 }}>
        Two-tower encodes query and item independently → dot-product similarity → ANN lookup. Fast enough for 10M+ items. Cross-encoder sees both together → accurate but O(K) forward passes. Always two-stage in production.
      </p>
    </div>
  )
}

// ─── Gradient Descent on Loss Surface (post 56) ──────────────────────────────
export function GradientDescentPath() {
  const [step, setStep] = useState(0)
  const W = 340, H = 240, PL = 48, PB = 36, PT = 16, PR = 16
  const cW = W - PL - PR, cH = H - PB - PT

  // Contour levels for a bowl-shaped loss: L(w1,w2) = (w1-2)^2 + 2(w2-1)^2
  const contours = [0.3, 0.8, 1.8, 3.2, 5.0]
  // Gradient descent path (SGD with LR=0.3, some noise)
  const path = [
    [6.5, 5.2], [5.8, 4.6], [5.1, 3.9], [4.4, 3.3], [3.8, 2.8],
    [3.3, 2.4], [2.9, 2.1], [2.6, 1.8], [2.4, 1.5], [2.2, 1.3], [2.1, 1.1], [2.0, 1.0]
  ]
  const wMin = 0, wMax = 8

  const toSX = w => PL + (w - wMin) / (wMax - wMin) * cW
  const toSY = w => PT + (1 - (w - wMin) / (wMax - wMin)) * cH

  // Ellipse for each contour
  const ellipses = contours.map(c => {
    // (w1-2)^2 + 2(w2-1)^2 = c → rx = sqrt(c), ry = sqrt(c/2)
    const rx = Math.sqrt(c) * cW / (wMax - wMin)
    const ry = Math.sqrt(c / 2) * cH / (wMax - wMin)
    return { rx, ry }
  })
  const optX = toSX(2), optY = toSY(1)
  const visPath = path.slice(0, Math.max(2, step + 1))

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
        ⟩ Gradient Descent — Loss Contours
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, maxWidth: '100%', display: 'block', flexShrink: 0 }}>
          <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="var(--rim)" strokeWidth="1" />
          <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="var(--rim)" strokeWidth="1" />
          <text x={PL + cW / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--ink-mid)" fontFamily="var(--font-mono)">w₁</text>
          <text x={14} y={PT + cH / 2} textAnchor="middle" fontSize="10" fill="var(--ink-mid)" fontFamily="var(--font-mono)" transform={`rotate(-90,14,${PT + cH / 2})`}>w₂</text>
          {/* contours */}
          {ellipses.map((e, i) => (
            <ellipse key={i} cx={optX} cy={optY} rx={e.rx} ry={e.ry}
              fill="none" stroke={`rgba(240,165,0,${0.15 + i * 0.12})`} strokeWidth="1.5" />
          ))}
          {/* path */}
          {visPath.length > 1 && (
            <polyline
              points={visPath.map(([w1, w2]) => `${toSX(w1)},${toSY(w2)}`).join(' ')}
              fill="none" stroke="#4EA8DE" strokeWidth="2" />
          )}
          {/* current point */}
          <circle cx={toSX(visPath[visPath.length-1][0])} cy={toSY(visPath[visPath.length-1][1])} r="5" fill="#4EA8DE" />
          {/* optimum */}
          <circle cx={optX} cy={optY} r="4" fill="var(--prime)" />
          <text x={optX + 6} y={optY - 5} fontSize="9" fill="var(--prime)" fontFamily="var(--font-mono)">min</text>
        </svg>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
              Step: <span style={{ color: 'var(--prime)' }}>{step}</span> / {path.length - 1}
            </label>
            <input type="range" min="0" max={path.length - 1} step="1" value={step}
              onChange={e => setStep(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--prime)' }} />
          </div>
          {[['w₁', path[step][0].toFixed(2)], ['w₂', path[step][1].toFixed(2)],
            ['Loss', ((path[step][0]-2)**2 + 2*(path[step][1]-1)**2).toFixed(3)]].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
              padding: '7px 10px', border: '1px solid var(--rim)', borderRadius: '7px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)' }}>{k}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: k === 'Loss' ? 'var(--prime)' : 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--ink-mid)', marginTop: '10px', lineHeight: 1.6 }}>
        Drag to watch gradient descent navigate the loss surface. Each step moves in the direction of steepest descent. Elliptical contours mean the loss is more sensitive to w₂ than w₁ — a higher learning rate on w₁ would help.
      </p>
    </div>
  )
}

// ─── Registry: post ID → component ───────────────────────────────────────────
export const POST_VISUALS = {
  54:  AttentionHeatmap,
  55:  TransformerBlock,
  56:  GradientDescentPath,
  70:  TwoTowerDiagram,
  71:  NDCGVisual,
  74:  BiasVariancePlot,
  76:  CalibrationPlot,
  112: L1L2Geometry,
  114: PRThresholdSlider,
}
