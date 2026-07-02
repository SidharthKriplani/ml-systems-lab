import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: rolling-origin backtesting is a budget of folds, not a single split.
// Total series length is fixed. Longer horizon and larger initial train window both
// eat into how many folds you can cut; expanding vs rolling changes what each fold
// tests. Watch the fold count and the coverage of the series collapse as you push
// the horizon up — the classic tension behind "why does my backtest have so few points".

const N = 60 // total observations in the series (fixed budget)

const DEFAULTS = {
  initial: 24,   // initial training window
  horizon: 6,    // forecast horizon per fold
  step: 3,       // spacing between successive cutoffs
  expanding: true, // expanding (grow train) vs rolling (fixed-size train)
}

// Compute the rolling-origin folds given the settings.
function computeFolds({ initial, horizon, step, expanding }) {
  const folds = []
  let origin = initial
  while (origin + horizon <= N) {
    const trainStart = expanding ? 0 : Math.max(0, origin - initial)
    folds.push({ trainStart, trainEnd: origin, testStart: origin, testEnd: origin + horizon })
    origin += step
  }
  return folds
}

const COLW = 320 // px width of the timeline area

export const WalkForwardViz = forwardRef(function WalkForwardViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))

  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const folds = computeFolds(s)
  const nFolds = folds.length
  const px = (i) => (i / N) * COLW

  // usable test coverage: fraction of the series that ever appears in a test window
  const testedIdx = new Set()
  folds.forEach(f => { for (let i = f.testStart; i < f.testEnd; i++) testedIdx.add(i) })
  const coverage = Math.round((testedIdx.size / N) * 100)

  const tooFew = nFolds < 3

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {[
          { key: 'initial', label: 'Initial train', min: 6, max: 40 },
          { key: 'horizon', label: 'Horizon', min: 1, max: 24 },
          { key: 'step', label: 'Step', min: 1, max: 12 },
        ].map(c => (
          <div key={c.key} style={{ flex: '1 1 90px', minWidth: 90 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
              <span>{c.label}</span>
              <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s[c.key]}</span>
            </div>
            <input type="range" min={c.min} max={c.max} value={s[c.key]}
              onChange={e => set(c.key, +e.target.value)} style={{ width: '100%' }} />
          </div>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.72rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={s.expanding} onChange={e => set('expanding', e.target.checked)} />
        Expanding window (train grows each fold). Uncheck for rolling (fixed-size train, drops old data).
      </label>

      {/* fold timeline */}
      <div style={{ marginBottom: '8px' }}>
        {folds.length === 0 && (
          <div style={{ fontSize: '0.7rem', color: '#ef4444', padding: '6px 0' }}>
            No folds fit — initial train + horizon exceed the {N}-point series. Shrink one of them.
          </div>
        )}
        {folds.slice(0, 8).map((f, i) => (
          <div key={i} style={{ position: 'relative', height: 12, marginBottom: 3, width: COLW }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 5, height: 2, background: 'var(--depth)' }} />
            <div style={{
              position: 'absolute', left: px(f.trainStart), width: px(f.trainEnd) - px(f.trainStart),
              top: 0, height: 12, background: 'var(--prime)', opacity: 0.8, borderRadius: 2,
            }} />
            <div style={{
              position: 'absolute', left: px(f.testStart), width: px(f.testEnd) - px(f.testStart),
              top: 0, height: 12, background: 'var(--gold)', borderRadius: 2,
            }} />
          </div>
        ))}
        {folds.length > 8 && (
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)', marginTop: 2 }}>+ {folds.length - 8} more folds…</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', fontSize: '0.62rem', color: 'var(--ink-low)', marginBottom: '10px' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 6, background: 'var(--prime)', opacity: 0.8, borderRadius: 2, marginRight: 4 }} />train</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 6, background: 'var(--gold)', borderRadius: 2, marginRight: 4 }} />test horizon</span>
      </div>

      <div style={{
        background: 'var(--depth)', border: `1px solid ${tooFew ? '#ef4444' : 'var(--rim)'}`,
        borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Backtest folds</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: tooFew ? '#ef4444' : '#22c55e' }}>
            {nFolds}{tooFew ? ' ✗ too few' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-low)' }}>Series ever tested</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--ink-hi)' }}>{coverage}%</div>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        Push the horizon up and folds collapse — a 24-step horizon on 60 points leaves almost
        nothing to slide over, so your MASE rests on two or three noisy estimates. Expanding uses all
        history (right for stationary series); rolling holds train size fixed to track a drifting
        regime, at the cost of throwing away old data. The horizon you actually deploy is the horizon
        you must backtest at — evaluating at h=1 and shipping at h=24 is lookahead by another name.
      </div>
    </div>
  )
})
