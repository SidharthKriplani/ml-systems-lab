import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Reactive walk-forward backtest: an SVG stack of folds (train + test-horizon bars)
// over a fixed 60-point series. Push the horizon or initial-train up and folds
// collapse; toggle expanding vs rolling to change what each fold trains on.

const N = 60
const DEFAULTS = { initial: 24, horizon: 6, step: 3, expanding: true }

function computeFolds({ initial, horizon, step, expanding }) {
  const folds = []; let origin = initial
  while (origin + horizon <= N) {
    folds.push({ trainStart: expanding ? 0 : Math.max(0, origin - initial), trainEnd: origin, testStart: origin, testEnd: origin + horizon })
    origin += step
  }
  return folds
}

export const WalkForwardViz = forwardRef(function WalkForwardViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(p => ({ ...p, [k]: v })), [])

  const folds = computeFolds(s)
  const nFolds = folds.length
  const tested = new Set(); folds.forEach(f => { for (let i = f.testStart; i < f.testEnd; i++) tested.add(i) })
  const coverage = Math.round((tested.size / N) * 100)
  const tooFew = nFolds < 3

  const shown = folds.slice(0, 8)
  const W = 360, padL = 8, rowH = 15, plotW = W - padL - 8
  const H = 22 + shown.length * rowH + (folds.length > 8 ? 12 : 0)
  const px = i => padL + (i / N) * plotW

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <svg viewBox={`0 0 ${W} ${Math.max(H, 40)}`} style={{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto 4px' }}>
        <text x={padL} y="10" fill="var(--ink-low)" fontSize="8">■ train  ■ test horizon — each row is a fold over the {N}-point series</text>
        {shown.map((f, i) => {
          const y = 16 + i * rowH
          return (
            <g key={i}>
              <line x1={padL} y1={y + rowH / 2 - 1} x2={W - 8} y2={y + rowH / 2 - 1} stroke="var(--depth)" strokeWidth="2" />
              <rect x={px(f.trainStart)} y={y} width={px(f.trainEnd) - px(f.trainStart)} height={rowH - 5} fill="var(--prime)" opacity="0.8" rx="1.5" />
              <rect x={px(f.testStart)} y={y} width={px(f.testEnd) - px(f.testStart)} height={rowH - 5} fill="var(--amber)" rx="1.5" />
            </g>
          )
        })}
        {folds.length > 8 && <text x={padL} y={H - 2} fontSize="7.5" fill="var(--ink-low)">+ {folds.length - 8} more folds…</text>}
        {folds.length === 0 && <text x={padL} y="28" fontSize="8.5" fill="#ef4444">No folds fit — initial train + horizon exceed the series. Shrink one.</text>}
      </svg>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
        {[['initial', 'Initial train', 6, 40], ['horizon', 'Horizon', 1, 24], ['step', 'Step', 1, 12]].map(([k, l, mn, mx]) => (
          <div key={k} style={{ flex: '1 1 90px', minWidth: 90 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}><span>{l}</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s[k]}</span></div>
            <input type="range" min={mn} max={mx} value={s[k]} onChange={e => set(k, +e.target.value)} style={{ width: '100%' }} />
          </div>
        ))}
      </div>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.expanding} onChange={e => set('expanding', e.target.checked)} />
        expanding window (train grows). Uncheck for rolling (fixed-size train, drops old data).
      </label>

      <div style={{ background: 'var(--depth)', border: `1px solid ${tooFew ? '#ef4444' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>backtest folds</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: tooFew ? '#ef4444' : '#22c55e' }}>{nFolds}{tooFew ? ' ✗ too few' : ''}</div></div>
        <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>series ever tested</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink-hi)' }}>{coverage}%</div></div>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: 8, lineHeight: 1.5 }}>
        Push the horizon up and the fold rows vanish — a 24-step horizon on 60 points leaves almost nothing to slide over, so your metric rests on 2–3 noisy estimates. The horizon you deploy is the horizon you must backtest at; evaluating at h=1 and shipping at h=24 is lookahead by another name.
      </div>
    </div>
  )
})
