import React, { useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react'

// Teaches: MAE's masking ratio is a shortcut-closer, not a hyperparameter. At low
// mask ratios adjacent patches let the model interpolate (no semantics learned);
// at 75% local interpolation is geometrically impossible, forcing global structure.
// Grid = 14x14 = 196 patches (a 224x224 image in 16x16 patches).

const GRID = 14
const N_PATCHES = GRID * GRID // 196

// Deterministic pseudo-random ordering so the mask pattern is stable per ratio.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

// A fixed shuffle of patch indices; the first k are masked for mask ratio k/N.
const SHUFFLE = (() => {
  const rng = mulberry32(7)
  const idx = Array.from({ length: N_PATCHES }, (_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
})()

const DEFAULT_RATIO = 75

export const MaskRatioViz = forwardRef(function MaskRatioViz(props, ref) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO)

  useImperativeHandle(ref, () => ({ reset: () => setRatio(DEFAULT_RATIO) }))

  const set = useCallback(v => setRatio(v), [])

  const nMasked = Math.round((ratio / 100) * N_PATCHES)
  const masked = useMemo(() => {
    const m = new Set()
    for (let i = 0; i < nMasked; i++) m.add(SHUFFLE[i])
    return m
  }, [nMasked])

  // For each masked patch, how many of its 4-neighbours are visible? If a masked
  // patch has >=1 visible neighbour, local interpolation can partly fill it.
  const interpolable = useMemo(() => {
    let fillable = 0
    for (const p of masked) {
      const r = Math.floor(p / GRID), c = p % GRID
      const nbrs = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      let visibleNbr = false
      for (const [nr, nc] of nbrs) {
        if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) continue
        if (!masked.has(nr * GRID + nc)) { visibleNbr = true; break }
      }
      if (visibleNbr) fillable++
    }
    return masked.size ? fillable / masked.size : 0
  }, [masked])

  // Shortcut strength = fraction of masked patches reachable by local interpolation.
  // Semantic pressure is the complement: patches with no visible neighbour force
  // the encoder to reason globally. This is a teaching proxy, not MAE's actual loss.
  const shortcutPct = Math.round(interpolable * 100)
  const semanticPressure = 100 - shortcutPct
  const shortcutHeavy = shortcutPct >= 55
  const sweet = ratio >= 65 && ratio <= 85

  const cell = 15
  const gap = 1
  const svgSize = GRID * (cell + gap) + gap

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
          <span>Mask ratio</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{ratio}% · {nMasked}/{N_PATCHES} patches hidden</span>
        </div>
        <input type="range" min={10} max={90} step={5} value={ratio} onChange={e => set(+e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ flexShrink: 0 }}>
          {Array.from({ length: N_PATCHES }, (_, p) => {
            const r = Math.floor(p / GRID), c = p % GRID
            const isMasked = masked.has(p)
            return (
              <rect
                key={p}
                x={gap + c * (cell + gap)}
                y={gap + r * (cell + gap)}
                width={cell}
                height={cell}
                rx={2}
                fill={isMasked ? 'var(--depth)' : 'var(--prime)'}
                stroke={isMasked ? 'var(--rim)' : 'var(--prime)'}
                opacity={isMasked ? 1 : 0.85}
              />
            )
          })}
        </svg>

        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
              <span>Interpolation shortcut</span>
              <span style={{ color: shortcutHeavy ? '#ef4444' : 'var(--ink-mid)', fontWeight: 700 }}>{shortcutPct}%</span>
            </div>
            <div style={{ background: 'var(--depth)', borderRadius: 4, height: 12, marginTop: 2 }}>
              <div style={{ width: `${shortcutPct}%`, height: '100%', background: shortcutHeavy ? '#ef4444' : 'var(--ink-low)', borderRadius: 4, opacity: 0.85 }} />
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--ink-ghost)', marginTop: 2 }}>masked patches with a visible neighbour to copy from</div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
              <span>Semantic pressure</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>{semanticPressure}%</span>
            </div>
            <div style={{ background: 'var(--depth)', borderRadius: 4, height: 12, marginTop: 2 }}>
              <div style={{ width: `${semanticPressure}%`, height: '100%', background: '#22c55e', borderRadius: 4, opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--ink-ghost)', marginTop: 2 }}>masked patches with no visible neighbour → must infer from global structure</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '10px', background: 'var(--depth)', border: `1px solid ${sweet ? 'var(--rim)' : shortcutHeavy ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sweet ? '#22c55e' : shortcutHeavy ? '#ef4444' : 'var(--ink-hi)' }}>
          {sweet ? '✓ MAE regime (65–85%)' : shortcutHeavy ? '✗ interpolation dominates' : 'partial shortcut'}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)', marginLeft: 8 }}>
          {sweet
            ? 'few masked patches have any visible neighbour — reconstruction needs global semantic structure'
            : shortcutHeavy
              ? 'most masked patches sit next to a visible one — the model bicubic-interpolates and learns no semantics'
              : 'push higher: some patches still copy from neighbours'}
        </span>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Drag from 10% toward 75%. At low ratios almost every hidden patch borders a visible
        one, so the task is solvable by copying pixels — the encoder learns texture, not meaning.
        Only when the mask is dense enough that hidden regions have no local context does
        reconstruction force global understanding. That threshold, not the architecture, is why 75%.
      </div>
    </div>
  )
})
