import React, { useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: after a change point, a huge window keeps a stale estimate frozen on a
// collapsed arm; a tiny window tracks fast but is noisy. Sliding-window UCB re-tracks
// reality in ~W rounds. There is a regret-minimising window in between — bias vs variance.

const T = 400            // rounds
const CHANGE = 200       // change point round
const MU_BEFORE = 0.80   // best arm's true mean before collapse
const MU_AFTER = 0.30    // true mean after collapse
const SEED = 0x5EED1234

// deterministic mulberry32 so the plot is stable across renders (no libs, no randomness at runtime)
function makeRng(seed) {
  let s = seed >>> 0
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Fixed reward stream: Bernoulli-ish noisy signal around the true mean, frozen once.
const REWARDS = (() => {
  const rng = makeRng(SEED)
  const out = []
  for (let t = 0; t < T; t++) {
    const mu = t < CHANGE ? MU_BEFORE : MU_AFTER
    // noisy observation in [0,1]
    const noise = (rng() - 0.5) * 0.5
    out.push(Math.max(0, Math.min(1, mu + noise)))
  }
  return out
})()

const DEFAULTS = { W: 40 }

const W_MIN = 5
const W_MAX = 400   // W = T means "accumulate everything" (standard UCB)

export const NonStationaryWindowViz = forwardRef(function NonStationaryWindowViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })
  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))
  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  const { swSeries, accSeries, swRegret, accRegret, lag } = useMemo(() => {
    const W = s.W
    const sw = []   // sliding-window estimate
    const acc = []  // accumulate-everything estimate
    let accSum = 0
    let swRegretSum = 0
    let accRegretSum = 0
    let detected = -1
    for (let t = 0; t < T; t++) {
      accSum += REWARDS[t]
      const accMean = accSum / (t + 1)
      // sliding window mean over last W observations
      const lo = Math.max(0, t - W + 1)
      let wSum = 0
      for (let i = lo; i <= t; i++) wSum += REWARDS[i]
      const swMean = wSum / (t - lo + 1)
      sw.push(swMean)
      acc.push(accMean)
      // regret proxy: after the change, the true best action is NOT this arm, so
      // over-estimating this collapsed arm's value == staying wrong. Use |estimate - trueMu|.
      const trueMu = t < CHANGE ? MU_BEFORE : MU_AFTER
      swRegretSum += Math.abs(swMean - trueMu)
      accRegretSum += Math.abs(accMean - trueMu)
      // "detected the drop" = sw estimate falls below midpoint after change
      if (detected < 0 && t >= CHANGE && swMean < (MU_BEFORE + MU_AFTER) / 2) detected = t
    }
    return {
      swSeries: sw,
      accSeries: acc,
      swRegret: swRegretSum,
      accRegret: accRegretSum,
      lag: detected < 0 ? null : detected - CHANGE,
    }
  }, [s.W])

  // ─── plotting geometry ───
  const Wpx = 340, Hpx = 150, padL = 34, padR = 8, padT = 12, padB = 22
  const x = (t) => padL + (t / (T - 1)) * (Wpx - padL - padR)
  const y = (v) => padT + (1 - v) * (Hpx - padT - padB)
  const path = (series) => series.map((v, t) => `${t === 0 ? 'M' : 'L'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const truePath = `M${x(0)},${y(MU_BEFORE)} L${x(CHANGE - 1)},${y(MU_BEFORE)} L${x(CHANGE)},${y(MU_AFTER)} L${x(T - 1)},${y(MU_AFTER)}`

  const betterSW = swRegret < accRegret

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '2px' }}>
          <span>Sliding window size W</span>
          <span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>{s.W >= T ? 'accumulate all (standard UCB)' : `${s.W} rounds`}</span>
        </div>
        <input type="range" min={W_MIN} max={W_MAX} value={s.W} onChange={e => set('W', +e.target.value)} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--ink-ghost)' }}>
          <span>tiny (fast, noisy)</span><span>huge (stable, frozen)</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${Wpx} ${Hpx}`} style={{ width: '100%', background: 'var(--depth)', borderRadius: 6 }}>
        {/* axes */}
        <line x1={padL} y1={y(0)} x2={Wpx - padR} y2={y(0)} stroke="var(--rim)" strokeWidth="1" />
        <line x1={padL} y1={padT} x2={padL} y2={y(0)} stroke="var(--rim)" strokeWidth="1" />
        <text x={padL - 4} y={y(MU_BEFORE) + 3} textAnchor="end" fontSize="7" fill="var(--ink-ghost)">.80</text>
        <text x={padL - 4} y={y(MU_AFTER) + 3} textAnchor="end" fontSize="7" fill="var(--ink-ghost)">.30</text>
        {/* change point */}
        <line x1={x(CHANGE)} y1={padT} x2={x(CHANGE)} y2={y(0)} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
        <text x={x(CHANGE) + 3} y={padT + 8} fontSize="7" fill="#ef4444" fontWeight="700">change</text>
        {/* true mean */}
        <path d={truePath} fill="none" stroke="var(--ink-hi)" strokeWidth="1.4" />
        {/* accumulate-all estimate */}
        <path d={path(accSeries)} fill="none" stroke="var(--ink-low)" strokeWidth="1.3" strokeDasharray="4 3" />
        {/* sliding window estimate */}
        <path d={path(swSeries)} fill="none" stroke="var(--prime)" strokeWidth="1.7" />
        <text x={Wpx - padR} y={y(0) + 16} textAnchor="end" fontSize="7" fill="var(--ink-ghost)">rounds →</text>
      </svg>

      <div style={{ display: 'flex', gap: '10px', fontSize: '0.64rem', margin: '6px 0 10px' }}>
        <span style={{ color: 'var(--ink-hi)' }}>■ true mean</span>
        <span style={{ color: 'var(--prime)' }}>■ sliding-window W</span>
        <span style={{ color: 'var(--ink-low)' }}>▍ accumulate-all (standard)</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, background: 'var(--depth)', border: `1px solid ${betterSW ? 'var(--prime)' : 'var(--rim)'}`, borderRadius: 8, padding: '7px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>Sliding-window tracking error</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: betterSW ? '#22c55e' : 'var(--ink-hi)' }}>{swRegret.toFixed(1)}</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--ink-ghost)' }}>{lag == null ? 'never re-tracks the drop' : `re-tracks in ~${lag} rounds`}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '7px 10px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--ink-low)' }}>Accumulate-all error</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink-low)' }}>{accRegret.toFixed(1)}</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--ink-ghost)' }}>stays frozen on stale mean</div>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '8px', lineHeight: 1.5 }}>
        {s.W <= 12
          ? 'Tiny W tracks the collapse almost instantly, but the estimate is jittery — high variance eats the gains.'
          : s.W >= T
            ? 'Accumulate-everything = standard UCB: the estimate barely moves after the change and stays frozen on the collapsed arm.'
            : betterSW
              ? 'A window in the middle wins: fast enough to re-track the drop, smooth enough to keep variance down. That sweet spot ≈ √(T/K) is the SW-UCB rule of thumb.'
              : 'This window is large enough to lag badly — push W down until the blue line snaps to the new mean.'}
      </div>
    </div>
  )
})
