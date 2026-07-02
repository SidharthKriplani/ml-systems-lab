import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react'

// Teaches: calibration is a reliability diagram. A miscalibrated classifier's
// curve sags below the diagonal (overconfident). Temperature scaling divides
// logits by a scalar T > 1 to soften predictions — the curve straightens toward
// y = x, ECE drops, and accuracy never changes (argmax is invariant to T).

// Ten bins. `raw` = mean predicted prob per bin BEFORE calibration; `actual` =
// true positive rate per bin (fixed — the ground truth the model should match).
// The raw model is overconfident: it predicts too high relative to actual.
const BINS = [
  { raw: 0.05, actual: 0.06 },
  { raw: 0.15, actual: 0.11 },
  { raw: 0.25, actual: 0.17 },
  { raw: 0.35, actual: 0.24 },
  { raw: 0.45, actual: 0.31 },
  { raw: 0.55, actual: 0.39 },
  { raw: 0.65, actual: 0.47 },
  { raw: 0.75, actual: 0.56 },
  { raw: 0.85, actual: 0.66 },
  { raw: 0.95, actual: 0.80 },
]

const DEFAULTS = { T: 1.0 }

// Apply temperature to a probability by going through the logit and back:
// p -> logit z = ln(p/(1-p)) -> z/T -> sigmoid. T > 1 pulls p toward 0.5.
const temper = (p, T) => {
  const eps = 1e-6
  const pc = Math.min(1 - eps, Math.max(eps, p))
  const z = Math.log(pc / (1 - pc))
  return 1 / (1 + Math.exp(-z / T))
}

const W = 300, H = 300, PAD = 34
const toX = (p) => PAD + p * (W - 2 * PAD)
const toY = (p) => H - PAD - p * (H - 2 * PAD)

export const TemperatureScalingViz = forwardRef(function TemperatureScalingViz(props, ref) {
  const [s, setS] = useState({ ...DEFAULTS })

  useImperativeHandle(ref, () => ({ reset: () => setS({ ...DEFAULTS }) }))

  const set = useCallback((k, v) => setS(prev => ({ ...prev, [k]: v })), [])

  // Calibrated predicted prob per bin, then ECE = mean |predicted - actual|
  // weighted equally (equal-frequency bins).
  const points = BINS.map(b => ({ pred: temper(b.raw, s.T), actual: b.actual }))
  const ece = points.reduce((acc, p) => acc + Math.abs(p.pred - p.actual), 0) / points.length
  const ecePct = (ece * 100)
  const rawEce = BINS.reduce((acc, b) => acc + Math.abs(b.raw - b.actual), 0) / BINS.length * 100

  const curve = points.map(p => `${toX(p.pred).toFixed(1)},${toY(p.actual).toFixed(1)}`).join(' ')

  const good = ecePct < 3

  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: 'var(--ink-mid)' }}>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 300 }}>
          {/* axes */}
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="var(--ink-low)" strokeWidth="1" />
          <line x1={PAD} y1={H - PAD} x2={PAD} y2={PAD} stroke="var(--ink-low)" strokeWidth="1" />
          {/* diagonal ideal */}
          <line x1={toX(0)} y1={toY(0)} x2={toX(1)} y2={toY(1)} stroke="var(--ink-low)" strokeWidth="1" strokeDasharray="4 3" />
          <text x={toX(0.55)} y={toY(0.62)} fill="var(--ink-low)" fontSize="9" transform={`rotate(-45 ${toX(0.55)} ${toY(0.62)})`}>ideal y = x</text>
          {/* model curve */}
          <polyline points={curve} fill="none" stroke={good ? '#22c55e' : 'var(--prime)'} strokeWidth="2.5" />
          {points.map((p, i) => (
            <circle key={i} cx={toX(p.pred)} cy={toY(p.actual)} r="3" fill={good ? '#22c55e' : 'var(--prime)'} />
          ))}
          <text x={PAD} y={H - 8} fill="var(--ink-low)" fontSize="9">predicted probability →</text>
          <text x={12} y={PAD - 8} fill="var(--ink-low)" fontSize="9">actual rate ↑</text>
        </svg>

        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-low)', marginBottom: '4px' }}>
            Temperature T (divide logits by T)
          </div>
          <input
            type="range" min={0.5} max={3.0} step={0.05} value={s.T}
            onChange={e => set('T', +e.target.value)} style={{ width: '100%' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>
            <span>0.5 sharpen</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>T = {s.T.toFixed(2)}</span><span>soften 3.0</span>
          </div>

          <div style={{ marginTop: '12px', background: 'var(--depth)', border: `1px solid ${good ? '#22c55e' : 'var(--rim)'}`, borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-low)' }}>ECE (mean gap)</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: good ? '#22c55e' : '#ef4444' }}>
                {ecePct.toFixed(1)}%
              </span>
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)', marginTop: '2px' }}>
              uncalibrated (T=1): {rawEce.toFixed(1)}%
            </div>
          </div>

          <div style={{ marginTop: '8px', fontSize: '0.66rem', color: 'var(--ink-low)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Accuracy</span><span style={{ color: 'var(--ink-hi)', fontWeight: 700 }}>unchanged (argmax invariant)</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)', marginTop: '10px', lineHeight: 1.5 }}>
        At T = 1 the curve sags below the diagonal — predict 0.85, only 0.66 actually happen. Raise T and
        every prediction is pulled toward 0.5, the curve climbs onto y = x, and ECE collapses from ~14% to
        ~1–3%. Overshoot (T too high) and it sags the other way — now underconfident. One scalar, zero
        retraining, and accuracy never moves because dividing every logit by the same T can't change which
        class is largest.
      </div>
    </div>
  )
})
