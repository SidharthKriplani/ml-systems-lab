import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: PSI is a sum over bins of (p_train - p_new) * ln(p_train/p_new).
// Move probability mass between the "new" bins and watch PSI cross the
// 0.1 (investigate) and 0.2 (act) action bands. Small local shifts barely
// move PSI; concentrating mass into one bin blows past 0.2 fast.

const N_BINS = 5
const BIN_LABELS = ['<40K', '40–55K', '55–70K', '70–90K', '>90K']
// Training distribution: fixed, roughly bell-shaped over income bins.
const TRAIN = [0.10, 0.25, 0.30, 0.22, 0.13]
// New distribution defaults to a mild rightward shift (income creeping up).
const DEFAULT_NEW = [0.08, 0.20, 0.28, 0.26, 0.18]

const EPS = 1e-4

function normalize(arr) {
  const s = arr.reduce((a, b) => a + b, 0)
  return arr.map(v => v / s)
}

function psi(train, newD) {
  const p = normalize(newD)
  return train.reduce((acc, t, i) => {
    const tt = Math.max(t, EPS)
    const nn = Math.max(p[i], EPS)
    return acc + (tt - nn) * Math.log(tt / nn)
  }, 0)
}

const band = (v) =>
  v < 0.1 ? { label: 'stable', color: '#22c55e' }
    : v < 0.2 ? { label: 'investigate', color: '#f59e0b' }
      : { label: 'act — real drift', color: '#ef4444' }

export const PSICalculatorViz = forwardRef(function PSICalculatorViz(props, ref) {
  const [newD, setNewD] = useState([...DEFAULT_NEW])

  useImperativeHandle(ref, () => ({ reset: () => setNewD([...DEFAULT_NEW]) }))

  const set = useCallback((i, v) => {
    setNewD(prev => {
      const next = [...prev]
      next[i] = v
      return next
    })
  }, [])

  const p = normalize(newD)
  const value = psi(TRAIN, newD)
  const b = band(value)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginBottom: '8px' }}>
        Income feature, 5 bins. Training distribution is fixed (blue). Drag the sliders to reshape
        the <b>new</b> production distribution (orange) and watch PSI move across the action bands.
      </div>

      {/* per-bin comparison bars */}
      <div style={{ marginBottom: '10px' }}>
        {TRAIN.map((t, i) => {
          const scale = 200 // px for probability = 0.5
          return (
            <div key={i} style={{ marginBottom: '7px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', marginBottom: '2px' }}>
                <span style={{ color: 'var(--ink-low)' }}>{BIN_LABELS[i]}</span>
                <span style={{ color: 'var(--ink-ghost)' }}>train {t.toFixed(2)} · new {p[i].toFixed(2)}</span>
              </div>
              <div style={{ position: 'relative', height: 14, marginBottom: '3px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: 6, width: `${Math.min(100, t * scale)}%`, background: 'var(--prime)', borderRadius: 3, opacity: 0.7 }} />
                <div style={{ position: 'absolute', top: 8, left: 0, height: 6, width: `${Math.min(100, p[i] * scale)}%`, background: '#f59e0b', borderRadius: 3, opacity: 0.85 }} />
              </div>
              <input
                type="range" min={0} max={50} value={Math.round(newD[i] * 100)}
                onChange={e => set(i, +e.target.value / 100)}
                style={{ width: '100%' }}
              />
            </div>
          )
        })}
      </div>

      {/* PSI readout + action band scale */}
      <div style={{ marginTop: '4px', background: 'var(--depth)', border: `1px solid ${b.color}`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>PSI = Σ (p<sub>train</sub> − p<sub>new</sub>) ln(p<sub>train</sub>/p<sub>new</sub>)</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: b.color }}>{value.toFixed(3)}</span>
        </div>
        <div style={{ position: 'relative', height: 10, marginTop: '8px', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: '33.3%', background: '#22c55e', opacity: 0.35 }} />
          <div style={{ width: '33.3%', background: '#f59e0b', opacity: 0.35 }} />
          <div style={{ width: '33.4%', background: '#ef4444', opacity: 0.35 }} />
          {/* marker: map PSI 0..0.3 across the bar */}
          <div style={{ position: 'absolute', top: -2, left: `${Math.min(100, (value / 0.3) * 100)}%`, width: 2, height: 14, background: 'var(--ink-hi)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--ink-ghost)', marginTop: '2px' }}>
          <span>0</span><span>0.1</span><span>0.2</span><span>0.3+</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: b.color, fontWeight: 700, marginTop: '4px' }}>
          {b.label}
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        A gentle spread barely nudges PSI. But shove the mass into the top bins — the loan population
        aging from 55K toward 70K+ — and PSI clears 0.2, the "act" band, months before any label confirms harm.
      </div>
    </div>
  )
})
