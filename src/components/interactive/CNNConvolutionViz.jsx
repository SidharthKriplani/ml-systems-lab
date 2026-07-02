import React, { useState, useRef, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react'

// Live convolution: a 3x3 kernel slides over an 11x11 "image", computing each
// feature-map cell as the element-wise product of the window and the kernel,
// summed. Pick a kernel and watch which structures it fires on — the core
// intuition for "what a conv layer actually computes."

const N = 11            // input side
const OUT = N - 2       // valid conv, stride 1 → 9x9

// Input image: a filled square with a diagonal streak — gives clean vertical,
// horizontal, and diagonal edges so different kernels light up different things.
const INPUT = (() => {
  const g = Array.from({ length: N }, () => Array(N).fill(0))
  for (let r = 2; r <= 7; r++) for (let c = 3; c <= 8; c++) g[r][c] = 1     // square
  for (let k = 0; k < N; k++) { const c = k; if (g[k] && c >= 0 && c < N) g[k][c] = Math.max(g[k][c], 0.85) } // diagonal
  return g
})()

const KERNELS = {
  edge_v:  { label: 'Vertical edge',   k: [[-1,0,1],[-2,0,2],[-1,0,1]],  norm: 4, blurb: 'Sobel-x: fires on left↔right intensity changes (vertical edges).' },
  edge_h:  { label: 'Horizontal edge', k: [[-1,-2,-1],[0,0,0],[1,2,1]],  norm: 4, blurb: 'Sobel-y: fires on top↕bottom changes (horizontal edges).' },
  sharpen: { label: 'Sharpen',         k: [[0,-1,0],[-1,5,-1],[0,-1,0]], norm: 1, blurb: 'Center minus neighbours: amplifies local contrast.' },
  blur:    { label: 'Blur (box)',      k: [[1,1,1],[1,1,1],[1,1,1]],     norm: 9, blurb: 'Averages the 3×3 window: smooths, kills edges.' },
  emboss:  { label: 'Emboss',          k: [[-2,-1,0],[-1,1,1],[0,1,2]],  norm: 4, blurb: 'Directional gradient: gives a 3-D lit look.' },
  identity:{ label: 'Identity',        k: [[0,0,0],[0,1,0],[0,0,0]],     norm: 1, blurb: 'Copies the center pixel — the "do nothing" kernel.' },
}

function conv(kernel, norm) {
  const out = Array.from({ length: OUT }, () => Array(OUT).fill(0))
  for (let or = 0; or < OUT; or++) for (let oc = 0; oc < OUT; oc++) {
    let s = 0
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += INPUT[or + i][oc + j] * kernel[i][j]
    out[or][oc] = s / norm
  }
  return out
}

const inCell = (v) => `rgba(235,238,245,${(0.06 + v * 0.9).toFixed(3)})`
const outCell = (v) => {
  const a = Math.min(1, Math.abs(v)) * 0.9 + 0.05
  return v >= 0 ? `rgba(240,182,20,${a.toFixed(3)})` : `rgba(239,68,68,${a.toFixed(3)})`
}

export const CNNConvolutionViz = forwardRef(function CNNConvolutionViz(props, ref) {
  const [kernelKey, setKernelKey] = useState('edge_v')
  // Live-editable kernel + its normaliser. A preset seeds these; then the user
  // can hand-edit any of the 9 weights and the whole feature map recomputes.
  const [kernel, setKernel] = useState(KERNELS.edge_v.k.map(r => [...r]))
  const [norm, setNorm] = useState(KERNELS.edge_v.norm)
  const [pos, setPos] = useState(0) // output cell index 0..OUT*OUT-1
  const timer = useRef(null)

  const label = kernelKey === 'custom' ? 'Custom kernel' : KERNELS[kernelKey].label
  const blurb = kernelKey === 'custom'
    ? 'You edited the weights by hand — the feature map is recomputed from your 3×3 filter.'
    : KERNELS[kernelKey].blurb

  const out = useMemo(() => conv(kernel, norm), [kernel, norm])

  const or = Math.floor(pos / OUT), oc = pos % OUT

  const loadPreset = useCallback((key) => {
    setKernelKey(key)
    setKernel(KERNELS[key].k.map(r => [...r]))
    setNorm(KERNELS[key].norm)
  }, [])

  const editKernel = useCallback((r, c, raw) => {
    const v = raw === '' || raw === '-' ? 0 : parseFloat(raw)
    if (Number.isNaN(v)) return
    setKernel(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = v
      return next
    })
    setKernelKey('custom')
  }, [])

  const pause = useCallback(() => { if (timer.current) { clearInterval(timer.current); timer.current = null } }, [])
  const play = useCallback(() => {
    if (timer.current) return
    timer.current = setInterval(() => setPos(p => (p + 1) % (OUT * OUT)), 130)
  }, [])
  const step = useCallback(() => { pause(); setPos(p => (p + 1) % (OUT * OUT)) }, [pause])
  const reset = useCallback(() => { pause(); setPos(0); loadPreset('edge_v') }, [pause, loadPreset])
  useImperativeHandle(ref, () => ({ play, pause, step, reset }), [play, pause, step, reset])

  // current 3x3 window values + products
  const window3 = [], prod3 = []
  for (let i = 0; i < 3; i++) { window3.push([]); prod3.push([]); for (let j = 0; j < 3; j++) {
    const v = INPUT[or + i][oc + j]; window3[i].push(v); prod3[i].push(v * kernel[i][j])
  } }
  const outVal = out[or][oc]

  const cellPx = 17
  const miniPx = 26

  const Grid = ({ data, cellFn, highlight, onCellClick }) => (
    <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${data[0].length}, ${cellPx}px)`, gap: 1, background: 'var(--rim)', padding: 1, borderRadius: 4 }}>
      {data.map((row, r) => row.map((v, c) => {
        const hi = highlight && highlight(r, c)
        return <div key={r + '-' + c}
          onClick={onCellClick ? () => onCellClick(r, c) : undefined}
          style={{ width: cellPx, height: cellPx, background: cellFn(v),
          outline: hi ? '2px solid var(--prime)' : 'none', outlineOffset: -1, zIndex: hi ? 2 : 1,
          cursor: onCellClick ? 'pointer' : 'default' }} />
      }))}
    </div>
  )

  // Clicking a top-left cell of the image moves the 3×3 receptive field there.
  const moveWindow = (r, c) => {
    const rr = Math.min(Math.max(r, 0), OUT - 1)
    const cc = Math.min(Math.max(c, 0), OUT - 1)
    setPos(rr * OUT + cc)
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      {/* kernel picker */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {Object.entries(KERNELS).map(([key, cfg]) => (
          <button key={key} onClick={() => loadPreset(key)} style={{
            padding: '4px 9px', borderRadius: 6, cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'var(--font-sans)',
            fontWeight: kernelKey === key ? 700 : 500,
            background: kernelKey === key ? 'var(--prime)' : 'var(--depth)',
            color: kernelKey === key ? '#000' : 'var(--ink-mid)',
            border: `1px solid ${kernelKey === key ? 'var(--prime)' : 'var(--rim)'}` }}>{cfg.label}</button>
        ))}
        {kernelKey === 'custom' && (
          <span style={{ padding: '4px 9px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
            background: 'var(--prime)', color: '#000', border: '1px solid var(--prime)' }}>Custom</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* input */}
        <div>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-low)', marginBottom: 4 }}>Input 11×11 · click to move filter</div>
          <Grid data={INPUT} cellFn={inCell} highlight={(r, c) => r >= or && r < or + 3 && c >= oc && c < oc + 3} onCellClick={moveWindow} />
        </div>
        {/* feature map */}
        <div>
          <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-low)', marginBottom: 4 }}>Feature map 9×9</div>
          <Grid data={out} cellFn={outCell} highlight={(r, c) => r === or && c === oc} />
          <div style={{ fontSize: '0.58rem', color: 'var(--ink-ghost)', marginTop: 4 }}>gold = +, red = − · one conv layer, one filter</div>
        </div>
      </div>

      {/* the windowed multiply-add */}
      <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '10px 12px' }}>
        <MiniMat title="window" data={window3} px={miniPx} fmt={v => v.toFixed(1)} tint={v => inCell(v)} />
        <span style={{ fontSize: '1.1rem', color: 'var(--ink-low)' }}>⊙</span>
        <EditableKernel title="kernel (editable)" data={kernel} px={miniPx + 6} onEdit={editKernel} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: '0.55rem', color: 'var(--ink-low)' }}>÷ norm</span>
          <input type="number" value={norm} step={1}
            onChange={e => { const n = parseFloat(e.target.value); if (!Number.isNaN(n) && n !== 0) { setNorm(n); setKernelKey('custom') } }}
            style={{ width: 42, padding: '3px 4px', fontSize: '0.62rem', fontFamily: 'var(--font-mono)', textAlign: 'center',
              background: 'var(--depth)', color: 'var(--ink-hi)', border: '1px solid var(--rim)', borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: '1.1rem', color: 'var(--ink-low)' }}>→ Σ =</span>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', marginBottom: 3 }}>output[{or}][{oc}]</div>
          <div style={{ minWidth: 46, padding: '6px 8px', borderRadius: 6, fontWeight: 800, fontSize: '0.9rem',
            background: outCell(outVal), color: 'var(--ink-hi)', textAlign: 'center' }}>{outVal.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 10, lineHeight: 1.5 }}>
        <b style={{ color: 'var(--ink-mid)' }}>{label}:</b> {blurb} The same 3×3 weights (~9 numbers) are reused at
        every position — that <b>weight sharing</b> is why a CNN has orders of magnitude fewer parameters than a dense
        layer and why the feature is detected wherever it appears (translation equivariance). Press ▶ to sweep the filter.
      </div>
    </div>
  )
})

function EditableKernel({ title, data, px, onEdit }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', marginBottom: 3 }}>{title}</div>
      <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(3, ${px}px)`, gap: 1, background: 'var(--rim)', padding: 1, borderRadius: 4 }}>
        {data.map((row, r) => row.map((v, c) => (
          <input
            key={r + '-' + c}
            type="number"
            value={v}
            step={1}
            onChange={e => onEdit(r, c, e.target.value)}
            style={{ width: px, height: px, textAlign: 'center', fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
              color: 'var(--ink-hi)', background: 'var(--surface)', border: 'none', outline: 'none',
              MozAppearance: 'textfield', padding: 0 }}
          />
        )))}
      </div>
    </div>
  )
}

function MiniMat({ title, data, px, fmt, tint }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)', marginBottom: 3 }}>{title}</div>
      <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(3, ${px}px)`, gap: 1, background: 'var(--rim)', padding: 1, borderRadius: 4 }}>
        {data.map((row, r) => row.map((v, c) => (
          <div key={r + '-' + c} style={{ width: px, height: px, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-hi)', background: tint(v) }}>{fmt(v)}</div>
        )))}
      </div>
    </div>
  )
}
