import { useState, useMemo, useEffect, useRef } from 'react'

// ─── Drift Dashboard ─────────────────────────────────────────────────────────
function generateTimeSeries(driftDay, psiThreshold, windowDays) {
  const days = 60
  const data = []
  for (let i = 0; i < days; i++) {
    const hasDrift = i >= driftDay
    const driftIntensity = hasDrift ? Math.min(1, (i - driftDay) / 20) : 0
    const noise = (Math.random() - 0.5) * 0.04

    const accuracy   = 0.84 - driftIntensity * 0.12 + noise * 0.5
    const psi        = 0.02 + driftIntensity * 0.35 + Math.max(0, noise)
    const ksStatistic= 0.04 + driftIntensity * 0.28 + Math.max(0, noise * 0.5)
    const alertFired = psi > psiThreshold

    data.push({ day: i + 1, accuracy, psi, ksStatistic, alertFired, hasDrift })
  }
  return data
}

function MiniChart({ data, field, color, threshold, height = 60 }) {
  const max = Math.max(...data.map(d => d[field]))
  const min = Math.min(...data.map(d => d[field]))
  const range = max - min || 1
  const w = 100 / data.length

  return (
    <div style={{ height, position: 'relative', overflow: 'visible' }}>
      {/* Threshold line */}
      {threshold != null && (
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: `${((max - threshold) / range) * height}px`,
          height: '1px', background: 'var(--gold)', opacity: 0.6,
          borderTop: '1px dashed var(--gold)', zIndex: 2,
        }} />
      )}
      <svg width="100%" height={height} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area */}
        <polyline
          fill={`url(#grad-${field})`}
          stroke="none"
          points={[
            ...data.map((d, i) => `${(i + 0.5) * w}%,${((max - d[field]) / range) * (height - 4) + 2}`),
            `100%,${height}`, `0%,${height}`
          ].join(' ')}
        />
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          points={data.map((d, i) => `${(i + 0.5) * w}%,${((max - d[field]) / range) * (height - 4) + 2}`).join(' ')}
        />
        {/* Drift mark */}
        {data.map((d, i) => d.hasDrift && !data[i - 1]?.hasDrift
          ? <line key={i} x1={`${(i + 0.5) * w}%`} x2={`${(i + 0.5) * w}%`} y1="0" y2={height} stroke="var(--rose)" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
          : null
        )}
      </svg>
    </div>
  )
}

function DriftDashboard() {
  const [psiThreshold, setPsiThreshold] = useState(0.2)
  const [driftDay, setDriftDay]         = useState(35)
  const [revealed, setRevealed]         = useState(false)

  const data = useMemo(() => generateTimeSeries(driftDay, psiThreshold, 7), [driftDay, psiThreshold])

  const firstAlert = data.find(d => d.alertFired)
  const alertDelay = firstAlert ? firstAlert.day - driftDay : null
  const missed     = !firstAlert

  const degradedDays = data.filter((d, i) => d.hasDrift && d.accuracy < 0.80).length
  const finalAccuracy = data[data.length - 1].accuracy

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Drift Dashboard</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          A model is running in production. Concept drift is injected at a hidden day (slide to reveal). Configure your PSI alert threshold — too tight means alert fatigue, too loose means silent degradation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
            PSI alert threshold: <span style={{ color: psiThreshold < 0.1 ? 'var(--rose)' : psiThreshold > 0.3 ? 'var(--gold)' : 'var(--mint)', fontWeight: 600 }}>{psiThreshold}</span>
            {psiThreshold < 0.1 && <span style={{ color: 'var(--rose)', fontSize: '10px', marginLeft: '6px' }}>⚠ alert fatigue</span>}
            {psiThreshold > 0.3 && <span style={{ color: 'var(--gold)', fontSize: '10px', marginLeft: '6px' }}>⚠ too loose</span>}
          </label>
          <input type="range" min={0.05} max={0.5} step={0.01} value={psiThreshold} onChange={e => setPsiThreshold(+e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '4px' }}>
            <span>0.05 (tight)</span><span>0.5 (loose)</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '8px', margin: '8px 0 0' }}>Standard: PSI &gt; 0.2 = significant shift. PSI &gt; 0.1 = monitor closely.</p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
            Drift onset: {revealed ? <span style={{ color: 'var(--rose)', fontWeight: 600 }}>Day {driftDay}</span> : <span style={{ color: 'var(--ink-low)' }}>hidden</span>}
          </label>
          <input type="range" min={10} max={50} step={1} value={driftDay} onChange={e => setDriftDay(+e.target.value)} disabled={!revealed} style={{ opacity: revealed ? 1 : 0.3 }} />
          {!revealed && (
            <button className="btn-secondary" onClick={() => setRevealed(true)} style={{ marginTop: '12px', fontSize: '12px', padding: '6px 14px' }}>
              Reveal drift day →
            </button>
          )}
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {[
          { label: 'Model accuracy', field: 'accuracy', color: 'var(--prime)', fmt: v => (v * 100).toFixed(1) + '%' },
          { label: 'PSI (input drift)', field: 'psi', color: 'var(--gold)', threshold: psiThreshold, fmt: v => v.toFixed(3) },
          { label: 'KS statistic', field: 'ksStatistic', color: 'var(--sky)', threshold: 0.1, fmt: v => v.toFixed(3) },
        ].map(c => {
          const current = data[data.length - 1]
          return (
            <div key={c.field} className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{c.label}</span>
                <span style={{ fontSize: '13px', color: c.color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{c.fmt(current[c.field])}</span>
              </div>
              <MiniChart data={data} field={c.field} color={c.color} threshold={c.threshold} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ink-ghost)', marginTop: '4px' }}>
                <span>Day 1</span><span>Day 60</span>
              </div>
            </div>
          )
        })}

        {/* Alert timeline */}
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Alert fired (PSI &gt; {psiThreshold})</div>
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
            {data.map((d, i) => (
              <div key={i} title={`Day ${d.day}`} style={{
                width: '9px', height: '24px', borderRadius: '2px',
                background: d.alertFired ? 'var(--rose)' : (d.hasDrift && revealed) ? 'rgba(244,63,94,0.2)' : 'var(--rim)',
                transition: 'background 0.1s',
              }} />
            ))}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: missed ? 'var(--rose)' : alertDelay !== null && alertDelay > 7 ? 'var(--gold)' : 'var(--mint)' }}>
            {missed ? 'No alert fired — drift undetected' :
             alertDelay === 0 ? '✓ Alert fired same day as drift onset' :
             `⚠ Alert fired ${alertDelay} day${alertDelay !== 1 ? 's' : ''} after drift onset`}
          </div>
        </div>
      </div>

      {revealed && (
        <div className="card animate-slide-up" style={{ padding: '18px', background: 'rgba(244,63,94,0.11)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)', marginBottom: '10px' }}>Post-mortem</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
            Drift started on <strong style={{ color: 'var(--rose)' }}>Day {driftDay}</strong>.
            {missed
              ? ` Your PSI threshold (${psiThreshold}) was too loose — the alert never fired. Model silently degraded to ${(finalAccuracy * 100).toFixed(1)}% accuracy.`
              : alertDelay > 7
              ? ` Alert fired ${alertDelay} days late. During that window, accuracy dropped ${((0.84 - data[driftDay].accuracy) * 100).toFixed(1)}pp. Try PSI < 0.15 for faster detection.`
              : ` Alert fired quickly (Day ${firstAlert?.day}). Good balance. Watch for false positives if data has natural weekly seasonality.`
            }
          </p>
        </div>
      )}
    </div>
  )
}

// ─── PSI Lab ─────────────────────────────────────────────────────────────────
function PSILab() {
  const [shiftAmount, setShiftAmount] = useState(0)
  const [nBins, setNBins]             = useState(10)

  const result = useMemo(() => {
    // Reference: standard normal
    // Current: shifted normal
    const bins = Array.from({ length: nBins }, (_, i) => {
      const edge_l = -3 + i * (6 / nBins)
      const edge_r = edge_l + (6 / nBins)
      const mid = (edge_l + edge_r) / 2

      // Gaussian PDF approximation
      const ref_pct = Math.exp(-0.5 * mid * mid) / (nBins * 0.4)
      const cur_pct = Math.exp(-0.5 * ((mid - shiftAmount) ** 2)) / (nBins * 0.4)
      const ref = Math.max(ref_pct, 0.001)
      const cur = Math.max(cur_pct, 0.001)
      const psi_i = (cur - ref) * Math.log(cur / ref)
      return { bin: i + 1, ref, cur, psi_i, edge_l: edge_l.toFixed(1), edge_r: edge_r.toFixed(1) }
    })

    const totalPSI = bins.reduce((s, b) => s + b.psi_i, 0)
    return { bins, totalPSI }
  }, [shiftAmount, nBins])

  const psiColor = result.totalPSI < 0.1 ? 'var(--mint)' : result.totalPSI < 0.2 ? 'var(--gold)' : 'var(--rose)'
  const psiLabel = result.totalPSI < 0.1 ? 'Stable' : result.totalPSI < 0.2 ? 'Some shift — monitor' : 'Significant shift — alert'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>PSI Lab</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Population Stability Index from scratch. Slide the distribution shift and watch PSI change in real time.
          Understand why 0.2 is the standard threshold — and when it's wrong.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
            Distribution shift (σ): <span style={{ color: 'var(--violet)', fontWeight: 600 }}>{shiftAmount.toFixed(1)}</span>
          </label>
          <input type="range" min={0} max={3} step={0.1} value={shiftAmount} onChange={e => setShiftAmount(+e.target.value)} />
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
            Bins: <span style={{ color: 'var(--violet)', fontWeight: 600 }}>{nBins}</span>
          </label>
          <input type="range" min={5} max={20} step={1} value={nBins} onChange={e => setNBins(+e.target.value)} />
        </div>
      </div>

      {/* PSI score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '40px', fontWeight: 700, color: psiColor }}>
          {result.totalPSI.toFixed(4)}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: psiColor, fontSize: '15px' }}>{psiLabel}</div>
          <div style={{ fontSize: '12px', color: 'var(--ink-low)' }}>PSI = Σ (Actual% − Expected%) × ln(Actual% / Expected%)</div>
        </div>
      </div>

      {/* Bin bar chart */}
      <div className="card" style={{ padding: '16px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '12px' }}>Bin-by-bin breakdown</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
          {result.bins.map(b => {
            const maxRef = Math.max(...result.bins.map(x => Math.max(x.ref, x.cur)))
            return (
              <div key={b.bin} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: 'var(--prime)', height: `${(b.ref / maxRef) * 60}px`, opacity: 0.7, borderRadius: '2px 2px 0 0' }} />
                <div style={{ width: '100%', background: 'var(--sky)', height: `${(b.cur / maxRef) * 60}px`, opacity: 0.8, borderRadius: '2px 2px 0 0' }} />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-low)' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--prime)', borderRadius: '2px', opacity: 0.7 }} /> Reference
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-low)' }}>
            <div style={{ width: '10px', height: '10px', background: 'var(--sky)', borderRadius: '2px', opacity: 0.8 }} /> Current
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── KS Test Explorer ─────────────────────────────────────────────────────────
function KSTestExplorer() {
  const [meanShift, setMeanShift] = useState(0)
  const [stdRatio,  setStdRatio]  = useState(1.0)
  const [nSamples,  setNSamples]  = useState(1000)

  const result = useMemo(() => {
    const N = 300
    const xMin = -5, xMax = 7
    const xs = Array.from({ length: N }, (_, i) => xMin + (xMax - xMin) * i / (N - 1))

    // Abramowitz & Stegun approximation for normal CDF
    function normCDF(x) {
      const t = 1 / (1 + 0.2316419 * Math.abs(x))
      const d = 0.3989423 * Math.exp(-x * x / 2)
      const p = t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))))
      const cdf = 1 - d * p
      return x >= 0 ? cdf : 1 - cdf
    }

    const points = xs.map(x => {
      const f1 = normCDF(x)
      const f2 = normCDF((x - meanShift) / Math.max(stdRatio, 0.01))
      return { x, f1, f2, diff: Math.abs(f1 - f2) }
    })

    const ksStatistic = Math.max(...points.map(p => p.diff))
    const ksIdx = points.findIndex(p => p.diff >= ksStatistic - 1e-9)

    // Kolmogorov distribution p-value approximation
    const t = ksStatistic * Math.sqrt(nSamples / 2)
    let pValue = 0
    for (let k = 1; k <= 80; k++) {
      pValue += 2 * Math.pow(-1, k - 1) * Math.exp(-2 * k * k * t * t)
    }
    pValue = Math.max(0, Math.min(1, pValue))

    return { points, ksStatistic, ksIdx, pValue, ksX: xs[ksIdx] }
  }, [meanShift, stdRatio, nSamples])

  const significant = result.pValue < 0.05
  const statusColor = significant ? 'var(--rose)' : 'var(--mint)'
  const W = 400, H = 110

  function pathD(field) {
    return result.points.map((p, i) => {
      const x = ((p.x - (-5)) / 12) * W
      const y = H - p[field] * H
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }

  const kp = result.points[result.ksIdx]
  const kx = kp ? ((kp.x - (-5)) / 12) * W : 0
  const ky1 = kp ? H - kp.f1 * H : 0
  const ky2 = kp ? H - kp.f2 * H : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>KS Test Explorer</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          The Kolmogorov-Smirnov test detects distribution shift without assuming any particular shape — it measures the maximum gap between two empirical CDFs. Adjust the sliders to see exactly how D, the KS statistic, moves.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
            Mean shift: <span style={{ color: 'var(--violet)', fontWeight: 600 }}>{meanShift.toFixed(1)}σ</span>
          </label>
          <input type="range" min={0} max={2.5} step={0.1} value={meanShift} onChange={e => setMeanShift(+e.target.value)} />
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
            Std ratio: <span style={{ color: 'var(--sky)', fontWeight: 600 }}>{stdRatio.toFixed(2)}×</span>
          </label>
          <input type="range" min={0.5} max={2.0} step={0.05} value={stdRatio} onChange={e => setStdRatio(+e.target.value)} />
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
            Sample size n: <span style={{ color: 'var(--mint)', fontWeight: 600 }}>{nSamples.toLocaleString()}</span>
          </label>
          <input type="range" min={50} max={5000} step={50} value={nSamples} onChange={e => setNSamples(+e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div className="section-eyebrow" style={{ marginBottom: '6px' }}>KS Statistic (D)</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '32px', fontWeight: 700, color: statusColor }}>{result.ksStatistic.toFixed(4)}</div>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginTop: '4px' }}>max |F₁(x) − F₂(x)|</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div className="section-eyebrow" style={{ marginBottom: '6px' }}>p-value</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '32px', fontWeight: 700, color: significant ? 'var(--rose)' : 'var(--mint)' }}>{result.pValue.toFixed(4)}</div>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginTop: '4px' }}>threshold: 0.05</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', background: significant ? 'rgba(244,63,94,0.11)' : 'rgba(52,211,153,0.11)', border: `1px solid ${significant ? 'rgba(244,63,94,0.2)' : 'rgba(240,165,0,0.18)'}` }}>
          <div className="section-eyebrow" style={{ marginBottom: '10px' }}>Verdict</div>
          <div style={{ fontSize: '12px', color: statusColor, fontWeight: 600, lineHeight: 1.4 }}>
            {significant ? 'Significant difference — reject H₀' : 'No significant difference — fail to reject H₀'}
          </div>
        </div>
      </div>

      {/* CDF plot */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--ink-low)', marginBottom: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Empirical CDFs — reference vs current distribution</div>
        <svg viewBox={`0 0 ${W} ${H + 4}`} style={{ width: '100%', height: '160px', overflow: 'visible' }}>
          {[0.25, 0.5, 0.75].map(v => (
            <line key={v} x1="0" y1={H - v * H} x2={W} y2={H - v * H} stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
          ))}
          {/* Shaded gap area between CDFs */}
          <path
            d={`${pathD('f1')} L${result.points.slice().reverse().map((p, i) => {
              const x = ((p.x - (-5)) / 12) * W
              const y = H - p.f2 * H
              return `${x.toFixed(1)},${y.toFixed(1)}`
            }).join(' L')} Z`}
            fill="rgba(245,158,11,0.14)" stroke="none"
          />
          <path d={pathD('f1')} fill="none" stroke="var(--violet)" strokeWidth="1.8" />
          <path d={pathD('f2')} fill="none" stroke="var(--sky)"    strokeWidth="1.8" />
          {/* KS gap marker */}
          {kp && (
            <g>
              <line x1={kx} y1={ky1} x2={kx} y2={ky2} stroke="var(--ember)" strokeWidth="1.5" strokeDasharray="3,2" />
              <circle cx={kx} cy={ky1} r="3" fill="var(--violet)" />
              <circle cx={kx} cy={ky2} r="3" fill="var(--sky)" />
              <text x={kx + 4} y={Math.min(ky1, ky2) - 3} fontSize="7" fill="var(--ember)" fontFamily="var(--font-mono)">
                D={result.ksStatistic.toFixed(3)}
              </text>
            </g>
          )}
          <line x1="0" y1={H} x2={W} y2={H} stroke="var(--rim)" strokeWidth="0.8" />
        </svg>
        <div style={{ display: 'flex', gap: '20px', marginTop: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-low)' }}>
            <div style={{ width: '16px', height: '2px', background: 'var(--violet)' }} /> Reference N(0, 1)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-low)' }}>
            <div style={{ width: '16px', height: '2px', background: 'var(--sky)' }} /> Current N({meanShift.toFixed(1)}, {stdRatio.toFixed(2)})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ink-low)' }}>
            <div style={{ width: '16px', height: '2px', background: 'var(--ember)', borderTop: '1px dashed' }} /> Max gap D
          </div>
        </div>
      </div>

      {/* KS vs PSI guide */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '12px' }}>KS Test vs PSI — choosing the right tool</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--sky)', fontWeight: 600, marginBottom: '6px' }}>Use KS when:</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.8 }}>
              → Continuous feature distributions<br />
              → No assumption on shape needed<br />
              → Comparing two live samples (A/B)<br />
              → You need a formal p-value<br />
              → Detecting tail shifts PSI can miss
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--violet)', fontWeight: 600, marginBottom: '6px' }}>Use PSI when:</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.8 }}>
              → Comparing sample to reference bins<br />
              → Categorical or already-binned features<br />
              → Industry thresholds (0.1 / 0.2) required<br />
              → Credit scoring / regulated ML<br />
              → Simple dashboard metric, no significance test
            </div>
          </div>
        </div>
      </div>

      {/* Insight: n matters */}
      <div className="card" style={{ padding: '14px', background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.15)' }}>
        <span style={{ fontSize: '12px', color: 'var(--violet)', fontWeight: 600 }}>Key insight — sample size matters: </span>
        <span style={{ fontSize: '12px', color: 'var(--ink-mid)' }}>
          The KS test is sensitive to n. With n = 50, a 0.5σ mean shift may not reach significance. With n = 5,000, even a 0.1σ shift will. In production with millions of predictions, almost any real drift will be statistically significant — the practical question is whether D is large enough to matter.
        </span>
      </div>
    </div>
  )
}

// ─── Alert Tuner ─────────────────────────────────────────────────────────────
function AlertTuner() {
  const [rules, setRules] = useState([
    { id: 'psi', label: 'Input drift (PSI)',   metric: 'PSI',        enabled: true,  threshold: 0.20, window: 3, severity: 'high'     },
    { id: 'ks',  label: 'Feature KS stat',     metric: 'KS',         enabled: true,  threshold: 0.10, window: 1, severity: 'medium'   },
    { id: 'acc', label: 'Accuracy drop (abs)', metric: 'accuracy',   enabled: true,  threshold: 0.05, window: 5, severity: 'critical' },
    { id: 'vol', label: 'Prediction volume ↓', metric: 'predVolume', enabled: false, threshold: 0.25, window: 2, severity: 'low'      },
  ])
  const [driftDay, setDriftDay] = useState(18)

  const updateRule = (id, field, val) =>
    setRules(rs => rs.map(r => r.id === id ? { ...r, [field]: val } : r))

  const sim = useMemo(() => {
    const N = 30
    const base  = { PSI: 0.03, KS: 0.04, accuracy: 0.00, predVolume: 0.00 }
    const delta = { PSI: 0.28, KS: 0.18, accuracy: 0.10, predVolume: 0.22 }

    const days = Array.from({ length: N }, (_, i) => {
      const intensity = i >= driftDay ? Math.min(1, (i - driftDay + 1) / 10) : 0
      const noise = () => (Math.random() - 0.5) * 0.03
      return {
        day: i + 1, hasDrift: i >= driftDay,
        PSI: base.PSI + delta.PSI * intensity + Math.max(0, noise()),
        KS:  base.KS  + delta.KS  * intensity + Math.max(0, noise()),
        accuracy:   base.accuracy   + delta.accuracy   * intensity + Math.abs(noise()),
        predVolume: base.predVolume + delta.predVolume  * intensity + Math.abs(noise()),
      }
    })

    const alerts = []
    rules.filter(r => r.enabled).forEach(rule => {
      days.forEach((d, i) => {
        const win = days.slice(Math.max(0, i - rule.window + 1), i + 1)
        const allHigh = win.every(w => w[rule.metric] > rule.threshold)
        const prevAllHigh = i > 0 && days.slice(Math.max(0, i - rule.window), i).every(w => w[rule.metric] > rule.threshold)
        if (allHigh && !prevAllHigh) {
          alerts.push({ day: d.day, ruleId: rule.id, severity: rule.severity, hasDrift: d.hasDrift })
        }
      })
    })

    const truePos  = alerts.filter(a =>  a.hasDrift).length
    const falsePos = alerts.filter(a => !a.hasDrift).length
    const first    = alerts.find(a => a.hasDrift)
    const delay    = first ? first.day - driftDay : null

    return { days, alerts, truePos, falsePos, delay, total: alerts.length }
  }, [rules, driftDay])

  const SEV = { low: 'var(--sky)', medium: 'var(--gold)', high: 'var(--ember)', critical: 'var(--rose)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Alert Tuner</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Configure alert rules and simulate how they'd perform against a 30-day production window. Balance detection speed against alert fatigue — both kill on-call teams in different ways.
        </p>
      </div>

      {/* Drift day */}
      <div className="card" style={{ padding: '14px' }}>
        <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '8px' }}>
          Drift onset: <span style={{ color: 'var(--rose)', fontWeight: 600 }}>Day {driftDay}</span>
        </label>
        <input type="range" min={5} max={25} step={1} value={driftDay} onChange={e => setDriftDay(+e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '4px' }}>
          <span>Day 5</span><span>Day 25</span>
        </div>
      </div>

      {/* Rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: 'var(--ink-mid)', fontWeight: 600, fontFamily: 'var(--font-sans)', marginBottom: '2px' }}>Alert Rules</div>
        {rules.map(rule => (
          <div key={rule.id} className="card" style={{ padding: '14px', opacity: rule.enabled ? 1 : 0.5, transition: 'opacity 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Toggle */}
                <button onClick={() => updateRule(rule.id, 'enabled', !rule.enabled)}
                  style={{ width: '36px', height: '20px', borderRadius: '10px', background: rule.enabled ? 'var(--mint)' : 'var(--rim)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '2px', left: rule.enabled ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '8px', background: 'white', transition: 'left 0.15s' }} />
                </button>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)' }}>{rule.label}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['low', 'medium', 'high', 'critical'].map(s => (
                  <button key={s} onClick={() => updateRule(rule.id, 'severity', s)}
                    style={{ padding: '2px 7px', borderRadius: '4px', border: `1px solid ${rule.severity === s ? SEV[s] : 'var(--rim)'}`, background: rule.severity === s ? `color-mix(in srgb, ${SEV[s]} 15%, transparent)` : 'transparent', cursor: 'pointer', fontSize: '10px', color: rule.severity === s ? SEV[s] : 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '6px' }}>
                  Threshold: <span style={{ color: SEV[rule.severity], fontWeight: 600 }}>{rule.threshold.toFixed(2)}</span>
                </label>
                <input type="range" min={0.01} max={0.5} step={0.01} value={rule.threshold} onChange={e => updateRule(rule.id, 'threshold', +e.target.value)} disabled={!rule.enabled} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '6px' }}>
                  Window (days): <span style={{ color: 'var(--sky)', fontWeight: 600 }}>{rule.window}</span>
                </label>
                <input type="range" min={1} max={7} step={1} value={rule.window} onChange={e => updateRule(rule.id, 'window', +e.target.value)} disabled={!rule.enabled} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[
          { label: 'Total alerts',     value: sim.total,   color: 'var(--ink-hi)' },
          { label: 'True positives',   value: sim.truePos, color: 'var(--mint)' },
          { label: 'False positives',  value: sim.falsePos, color: sim.falsePos > 3 ? 'var(--rose)' : 'var(--gold)' },
          { label: 'Detection delay',  value: sim.delay !== null ? `${sim.delay}d` : 'missed', color: sim.delay === null ? 'var(--rose)' : sim.delay <= 2 ? 'var(--mint)' : 'var(--gold)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div className="section-eyebrow" style={{ marginBottom: '6px' }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 30-day timeline */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--ink-low)', marginBottom: '10px', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Alert timeline — 30 days</div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${((driftDay - 1) / 30) * 100}%`, right: 0, background: 'rgba(244,63,94,0.11)', borderLeft: '1px dashed rgba(244,63,94,0.3)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', gap: '2px', position: 'relative' }}>
            {sim.days.map(d => {
              const dayAlerts = sim.alerts.filter(a => a.day === d.day)
              const sevOrder  = ['none', 'low', 'medium', 'high', 'critical']
              const maxSev    = dayAlerts.reduce((m, a) => sevOrder.indexOf(a.severity) > sevOrder.indexOf(m) ? a.severity : m, 'none')
              return (
                <div key={d.day} title={`Day ${d.day}${dayAlerts.length ? ` — ${dayAlerts.length} alert(s)` : ''}`}
                  style={{ flex: 1, height: '32px', borderRadius: '3px', background: maxSev !== 'none' ? SEV[maxSev] : d.hasDrift ? 'rgba(244,63,94,0.12)' : 'var(--rim)', transition: 'background 0.1s' }} />
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ink-ghost)', marginTop: '6px' }}>
            <span>Day 1</span><span>Day 30</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '14px', marginTop: '10px', flexWrap: 'wrap' }}>
          {Object.entries(SEV).map(([s, c]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--ink-low)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: c }} /> {s}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--ink-low)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(244,63,94,0.12)' }} /> drift (silent)
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="card" style={{ padding: '16px', background: sim.falsePos > 5 ? 'rgba(244,63,94,0.10)' : sim.delay === null ? 'rgba(245,158,11,0.10)' : 'rgba(52,211,153,0.10)', border: `1px solid ${sim.falsePos > 5 ? 'rgba(244,63,94,0.2)' : sim.delay === null ? 'rgba(245,158,11,0.2)' : 'rgba(240,165,0,0.18)'}` }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '8px' }}>Recommendation</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
          {sim.delay === null
            ? 'Drift was missed entirely. Lower thresholds or enable more rules — PSI on input features is usually the fastest leading indicator.'
            : sim.falsePos > 5
            ? `${sim.falsePos} false positives in 30 days will desensitise your team to alerts. Raise thresholds or increase the window size so the metric must persist before firing.`
            : sim.delay > 5
            ? `Detection delay of ${sim.delay} days means silent degradation for almost a week. Consider tightening PSI (a leading indicator) over accuracy (a lagging one).`
            : `Solid configuration: drift detected in ${sim.delay} day${sim.delay !== 1 ? 's' : ''} with only ${sim.falsePos} false positive${sim.falsePos !== 1 ? 's' : ''}. In production, add a 24h cooldown to prevent alert flapping after an incident is acknowledged.`
          }
        </p>
      </div>
    </div>
  )
}

// ─── Incident Triage ─────────────────────────────────────────────────────────
const INCIDENTS = [
  {
    id: 'acc_drop',
    alert: 'Accuracy dropped 8pp overnight. No deployment in last 48h.',
    severity: 'high',
    color: 'var(--rose)',
    immediateAction: 'Investigate first — do not rollback yet',
    hypothesis: 'Data distribution shift (seasonal, upstream schema change, or data pipeline failure). Check PSI on all input features before touching the model.',
    triage: [
      'Check data freshness — is the feature pipeline producing stale or incomplete data?',
      'Run PSI on top-10 features. Isolate which features shifted.',
      'Check if the label distribution changed (delayed labels, label schema change).',
      'If input features are clean but predictions are wrong → model has degraded. Now consider retraining or rollback.',
    ],
    antipattern: 'Immediately rolling back to the previous model. If the cause is data drift, rollback won\'t help — the old model is equally blind to the new distribution.',
  },
  {
    id: 'null_spike',
    alert: 'Null rate on feature `user_session_duration` spiked from 2% to 34%.',
    severity: 'high',
    color: 'var(--rose)',
    immediateAction: 'Page data engineering immediately — this is a pipeline incident',
    hypothesis: 'Upstream event tracking change or ingestion failure. The model is now imputing nulls, producing systematically biased predictions.',
    triage: [
      'Check ingestion pipeline — was there a deploy or schema change in the event tracker?',
      'Check if nulls are correlated with a user segment, device, or geography.',
      'Assess model impact: what does the model output when this feature is null? Is the imputation value causing score collapse?',
      'Hotfix: if imputation is causing harm, route affected traffic to a fallback model that doesn\'t use this feature.',
    ],
    antipattern: 'Treating this as a model problem. The model is behaving correctly given the null — the problem is upstream.',
  },
  {
    id: 'score_collapse',
    alert: 'Model score distribution compressed — 90% of users scoring 0.45–0.55 (was 0.15–0.85).',
    severity: 'medium',
    color: 'var(--ember)',
    immediateAction: 'Investigate — prediction diversity loss, likely feature issue',
    hypothesis: 'A high-weight feature has gone to a constant value or has very low variance. The model is essentially outputting the prior.',
    triage: [
      'Check feature variance for top-5 features by model weight. Look for features that became constant.',
      'Check if a categorical feature encoding changed (e.g., a new category ID that maps to OOV token).',
      'Check serving-side feature computation — is a real-time feature service returning a default value?',
      'If feature is fine but scores are still collapsed: check model serving code for sigmoid/softmax being applied twice.',
    ],
    antipattern: 'Retraining immediately. The feature issue will persist through retraining and you\'ll waste compute.',
  },
  {
    id: 'latency_spike',
    alert: 'P99 inference latency spiked from 45ms to 380ms. P50 unchanged.',
    severity: 'high',
    color: 'var(--rose)',
    immediateAction: 'Check for resource contention — likely a noisy neighbor or batch job',
    hypothesis: 'P50 unchanged but P99 spiked = tail latency issue, not global slowdown. Likely: a co-located batch job, GC pause, or a specific feature query hitting a slow path.',
    triage: [
      'Check CPU/memory utilization on serving nodes — is a batch job co-located?',
      'Profile which requests are slow — do they share a feature, user segment, or input size?',
      'Check if a feature store query has a slow path (e.g., a cache miss that falls back to DB).',
      'Check if model warmup is causing cold-start latency on recent pod restarts.',
    ],
    antipattern: 'Adding more replicas without diagnosing the cause. If it\'s a co-located batch job, scaling serving won\'t help.',
  },
  {
    id: 'label_delay',
    alert: 'Model accuracy looks great but business metric (conversion rate) dropped 4%.',
    severity: 'medium',
    color: 'var(--ember)',
    immediateAction: 'Investigate label pipeline — metric-model disconnect suggests label delay or proxy mismatch',
    hypothesis: 'The model is optimizing a proxy label that has decoupled from the true business metric. Common after a product change.',
    triage: [
      'Check the correlation between model score and the business metric over time — has it broken recently?',
      'Check if a product change altered user behavior in a way the proxy label doesn\'t capture.',
      'Check label delay: if conversion labels take 7 days to arrive, your "accurate" model is trained on stale feedback.',
      'Run a hold-out analysis: compare business metric for high-score vs low-score predictions in the current period.',
    ],
    antipattern: 'Ignoring the business metric because the model metric is green. Model metrics are proxies — they can all look fine while value collapses.',
  },
  {
    id: 'volume_crash',
    alert: 'Prediction volume dropped 60% in 30 minutes. No errors in logs.',
    severity: 'critical',
    color: 'var(--rose)',
    immediateAction: 'Page on-call immediately — this is likely an upstream traffic or routing failure',
    hypothesis: 'Traffic is not reaching the model — not a model failure. Check: load balancer, upstream service, feature flag, A/B routing config.',
    triage: [
      'Check if upstream caller is healthy — is the service that calls the model seeing errors?',
      'Check A/B or feature flag config — was the model\'s traffic allocation changed?',
      'Check load balancer health checks — did a pod fail readiness and get removed from rotation?',
      'Check if the drop is in all regions or just one — suggests geographic routing issue.',
    ],
    antipattern: 'Blaming the model. A 60% volume drop with no errors is almost never a model issue — it\'s a routing/infra issue.',
  },
  {
    id: 'concept_drift',
    alert: 'PSI stable, feature distributions normal, but precision dropped 12pp over 3 weeks.',
    severity: 'medium',
    color: 'var(--ember)',
    immediateAction: 'This is concept drift — the model needs retraining, not investigation',
    hypothesis: 'The relationship between features and labels has changed (concept drift), not the feature distribution (data drift). PSI won\'t catch this.',
    triage: [
      'Plot precision/recall over time — is it a gradual decline (drift) or a step change (incident)?',
      'Check if the label definition or collection process changed around when decline started.',
      'Segment error analysis: which user cohort or feature slice degraded most?',
      'Retrain on recent data. Consider a time-weighted loss or short training window to prioritize recent patterns.',
    ],
    antipattern: 'Waiting for PSI to trigger before acting. PSI measures input drift, not concept drift. You need outcome monitoring too.',
  },
  {
    id: 'schema_mismatch',
    alert: 'Model serving throwing silent errors for 8% of requests, returning fallback scores.',
    severity: 'high',
    color: 'var(--rose)',
    immediateAction: 'Find the schema mismatch — a feature has changed type or name in the serving payload',
    hypothesis: 'A feature pipeline or upstream service changed a field name, type, or encoding. Serving code catches the error silently and returns a default score.',
    triage: [
      'Sample the 8% of requests that are getting fallback scores — what do their feature payloads look like?',
      'Compare feature schema at training time vs current serving schema. Look for renamed columns, int→float coercions, or new categorical values.',
      'Check if a recent upstream deploy changed the event schema or feature computation logic.',
      'Fix: add schema validation at model entry point that raises loudly, not silently. A silent fallback hides the problem.',
    ],
    antipattern: 'Accepting 8% silent errors as normal. Every silent fallback is a real user getting a degraded experience and a missed opportunity to catch the root cause.',
  },
]

function IncidentTriage() {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const incident = INCIDENTS.find(i => i.id === selected)

  const SEV_COLOR = { critical: 'var(--rose)', high: 'var(--ember)', medium: 'var(--gold)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Incident Triage</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          8 production alerts. For each: decide your immediate action before reading the triage protocol. Most wrong answers involve touching the model first.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
        {INCIDENTS.map(inc => (
          <button key={inc.id} onClick={() => { setSelected(inc.id); setRevealed(false) }}
            className="card"
            style={{
              textAlign: 'left', cursor: 'pointer',
              border: `1px solid ${selected === inc.id ? inc.color : 'var(--rim)'}`,
              background: selected === inc.id ? `color-mix(in srgb, ${inc.color} 7%, var(--depth))` : 'var(--depth)',
              transition: 'all 0.15s',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `color-mix(in srgb, ${SEV_COLOR[inc.severity]} 15%, transparent)`, color: SEV_COLOR[inc.severity], textTransform: 'uppercase', letterSpacing: '0.05em' }}>{inc.severity}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-hi)', lineHeight: 1.5, margin: 0 }}>{inc.alert}</p>
          </button>
        ))}
      </div>

      {incident && (
        <div className="card" style={{ border: `1px solid ${incident.color}`, background: `color-mix(in srgb, ${incident.color} 4%, var(--depth))` }}>
          <div style={{ background: `color-mix(in srgb, ${incident.color} 12%, transparent)`, border: `1px solid ${incident.color}`, borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: incident.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', fontWeight: 700 }}>Immediate Action</div>
            <div style={{ fontSize: '14px', color: 'var(--ink-hi)', fontWeight: 600 }}>{incident.immediateAction}</div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div className="section-eyebrow" style={{ marginBottom: '4px' }}>Working Hypothesis</div>
            <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{incident.hypothesis}</div>
          </div>

          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="card"
              style={{ cursor: 'pointer', background: 'rgba(240,165,0,0.15)', border: '1px dashed rgba(240,165,0,0.4)', padding: '12px', textAlign: 'center', width: '100%' }}>
              <span style={{ color: 'var(--prime)', fontWeight: 600, fontSize: '13px' }}>Reveal Triage Protocol + Anti-pattern →</span>
            </button>
          ) : (
            <>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Triage Steps</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {incident.triage.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--mint)', fontWeight: 700, fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>{i + 1}.</span>
                      <span style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.5 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'rgba(244,63,94,0.14)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Anti-pattern to Avoid</div>
                <div style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.6 }}>{incident.antipattern}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Monitor Coverage Audit ───────────────────────────────────────────────────
const PIPELINE_STAGES = [
  {
    id: 'raw_data',
    label: 'Raw Data Ingestion',
    icon: '',
    monitored: ['Volume (row count per batch)', 'Schema validation (column names + types)', 'Freshness (time since last ingest)'],
    blind_spots: [
      { issue: 'Value range violations', example: 'age = -5, revenue = 10^15', signal: 'Silent: model silently uses garbage values', fix: 'Add min/max bounds checks per column. Alert if >0.1% of rows violate bounds.' },
      { issue: 'Referential integrity', example: 'user_id in events has no matching row in users table', signal: 'Null features or silent join failures downstream', fix: 'Run daily uniqueness + FK checks. Alert if match rate drops below 98%.' },
    ],
  },
  {
    id: 'features',
    label: 'Feature Pipeline',
    icon: '',
    monitored: ['Null rates per feature', 'Feature pipeline run time', 'Row count output'],
    blind_spots: [
      { issue: 'Distribution shift (PSI)', example: 'mean_purchase_7d shifted from $45 to $12 after a discount campaign', signal: 'Model scores compress without explanation. PSI > 0.2 on key features.', fix: 'Monitor PSI weekly for top-10 features by model weight. Page if PSI > 0.2.' },
      { issue: 'Aggregation window boundary bugs', example: 'Rolling 7-day window accidentally includes 8 days after DST transition', signal: 'Spike in feature values on specific days. Hard to notice.', fix: 'Unit test window boundaries against known reference dates. Include DST edge cases.' },
    ],
  },
  {
    id: 'model_serving',
    label: 'Model Serving',
    icon: '',
    monitored: ['Request latency (P50, P99)', 'Error rate', 'Request volume'],
    blind_spots: [
      { issue: 'Score distribution monitoring', example: 'Scores compressed to 0.48–0.52 — model outputting near-prior for all users', signal: 'CTR drops. No latency or error spike. Business wonders what happened.', fix: 'Monitor score distribution mean, std, and percentiles. Alert if std drops >50% from baseline.' },
      { issue: 'Prediction confidence calibration', example: 'Model says 90% confidence but is only right 60% of the time', signal: 'Downstream systems over-trust scores. Recall of high-confidence predictions unexpectedly low.', fix: 'Run calibration checks (ECE, reliability diagram) on a holdout set monthly.' },
    ],
  },
  {
    id: 'labels',
    label: 'Label Collection',
    icon: '',
    monitored: ['Label volume', 'Label pipeline freshness'],
    blind_spots: [
      { issue: 'Label delay tracking', example: 'Conversion labels take 7–30 days to arrive. Model trained on last 7 days uses mostly null labels.', signal: 'Training data appears healthy but model performance mysteriously degrades after retraining.', fix: 'Track label coverage rate by prediction cohort. Don\'t train on cohorts with <80% label coverage.' },
      { issue: 'Label distribution shift', example: 'Fraud rate dropped from 1.2% to 0.4% after a rule-based filter was added upstream', signal: 'Model appears to improve (lower FPR) but precision drops because true positives are being filtered.', fix: 'Monitor label positive rate as a KPI. Alert if positive rate changes >20% week-over-week.' },
    ],
  },
  {
    id: 'business',
    label: 'Business Metrics',
    icon: '',
    monitored: ['Daily/weekly KPI dashboard'],
    blind_spots: [
      { issue: 'Model-to-metric correlation monitoring', example: 'Model AUC stable but conversion rate dropping — model is optimizing the wrong proxy', signal: 'Stakeholders notice revenue drop; ML team says model looks fine.', fix: 'Track correlation between model score and business metric weekly. Alert if correlation drops >0.1.' },
      { issue: 'Segment-level monitoring', example: 'Overall metrics stable but mobile users degraded 15pp — hidden by desktop volume', signal: 'A complaint from mobile product team is the first signal.', fix: 'Monitor key segments (device, geo, user cohort) separately. Aggregate metrics hide segment failures.' },
    ],
  },
]

function MonitorCoverageAudit() {
  const [selected, setSelected] = useState(null)
  const [activeBlind, setActiveBlind] = useState(0)
  const stage = PIPELINE_STAGES.find(s => s.id === selected)
  const blind = stage?.blind_spots[activeBlind]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Monitor Coverage Audit</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Every ML pipeline has monitored stages and blind spots. Select a stage to see what most teams monitor — and what they silently miss.
        </p>
      </div>

      {/* Pipeline visualization */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        {PIPELINE_STAGES.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button onClick={() => { setSelected(s.id); setActiveBlind(0) }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${selected === s.id ? 'var(--prime)' : 'var(--rim)'}`,
                background: selected === s.id ? 'rgba(240,165,0,0.15)' : 'var(--depth)',
                transition: 'all 0.15s', minWidth: '80px',
              }}>
              <span style={{ fontSize: '18px' }}>{s.icon}</span>
              <span style={{ fontSize: '10px', color: selected === s.id ? 'var(--prime)' : 'var(--ink-low)', fontWeight: 600, textAlign: 'center', lineHeight: 1.3 }}>{s.label}</span>
            </button>
            {i < PIPELINE_STAGES.length - 1 && (
              <span style={{ color: 'var(--rim)', fontSize: '16px', flexShrink: 0 }}>→</span>
            )}
          </div>
        ))}
      </div>

      {stage && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {/* What's monitored */}
          <div className="card" style={{ border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.10)' }}>
            <div style={{ fontSize: '11px', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 700 }}>Typically Monitored</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {stage.monitored.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--mint)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '13px', color: 'var(--ink-hi)' }}>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blind spots */}
          <div className="card" style={{ border: '1px solid rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.10)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Blind Spots ({stage.blind_spots.length})</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {stage.blind_spots.map((_, i) => (
                  <button key={i} onClick={() => setActiveBlind(i)}
                    style={{ width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', fontWeight: 700, fontSize: '11px', border: `1px solid ${activeBlind === i ? 'var(--rose)' : 'var(--rim)'}`, background: activeBlind === i ? 'rgba(244,63,94,0.2)' : 'transparent', color: activeBlind === i ? 'var(--rose)' : 'var(--ink-low)' }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
            {blind && (
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--rose)' }}>{blind.issue}</div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Example</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-hi)', fontStyle: 'italic', lineHeight: 1.5 }}>{blind.example}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Failure Signal</div>
                  <div style={{ fontSize: '12px', color: 'var(--ember)', lineHeight: 1.5 }}>{blind.signal}</div>
                </div>
                <div style={{ background: 'rgba(99,102,241,0.13)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '6px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Fix</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-hi)', lineHeight: 1.5 }}>{blind.fix}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AccordionMCQ ─────────────────────────────────────────────────────────────
function AccordionMCQ({ scenarios, accentColor = 'var(--violet)', storageKey = null }) {
  const [items, setItems] = useState(() => {
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem('msl_score:' + storageKey))
        if (saved && saved.length === scenarios.length) return saved
      } catch {}
    }
    return scenarios.map(() => ({ open: false, picked: null, revealed: false }))
  })

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem('msl_score:' + storageKey, JSON.stringify(items))
      window.dispatchEvent(new CustomEvent('msl_score_updated'))
    }
  }, [items, storageKey])

  const score = items.reduce((acc, item, i) => ({
    attempted: acc.attempted + (item.revealed ? 1 : 0),
    correct:   acc.correct   + (item.revealed && item.picked === scenarios[i].answer ? 1 : 0),
  }), { attempted: 0, correct: 0 })

  function toggle(i) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, open: !it.open } : it))
  }

  function pick(i, optIdx) {
    if (items[i].revealed) return
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, picked: optIdx, revealed: true, open: true } : it))
  }

  useEffect(() => {
    function handleKey(e) {
      const n = parseInt(e.key)
      if (n >= 1 && n <= 4) {
        const openIdx = items.findIndex(it => it.open && !it.revealed)
        if (openIdx !== -1 && n - 1 < scenarios[openIdx].options.length) pick(openIdx, n - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [items])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {score.attempted > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: '8px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>Score:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: score.correct / score.attempted >= 0.7 ? 'var(--mint)' : 'var(--gold)' }}>
            {score.correct}/{score.attempted}
          </span>
          <div style={{ flex: 1, height: '4px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${(score.correct / Math.max(scenarios.length, 1)) * 100}%`, background: 'var(--mint)', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)' }}>{scenarios.length - score.attempted} left</span>
        </div>
      )}

      {scenarios.map((sc, i) => {
        const item = items[i]
        const isCorrect = item.revealed && item.picked === sc.answer
        const isWrong   = item.revealed && item.picked !== sc.answer
        let borderColor = item.open ? accentColor : 'var(--rim)'
        if (isCorrect) borderColor = 'rgba(52,211,153,0.5)'
        if (isWrong)   borderColor = 'rgba(244,63,94,0.5)'

        return (
          <div key={sc.id} style={{ border: `1px solid ${borderColor}`, borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s', background: 'rgba(255,255,255,0.015)' }}>
            <button onClick={() => toggle(i)} style={{ width: '100%', padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '16px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.4 }}>{sc.title}</span>
              {isCorrect && <span style={{ color: 'var(--mint)', fontSize: '13px', flexShrink: 0 }}>&#10003;</span>}
              {isWrong   && <span style={{ color: 'var(--rose)', fontSize: '13px', flexShrink: 0 }}>&#10007;</span>}
              <span style={{ color: 'var(--ink-ghost)', fontSize: '11px', flexShrink: 0 }}>{item.open ? '▲' : '▼'}</span>
            </button>

            {item.open && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: accentColor, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>Context</div>
                  <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.context}</p>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, fontStyle: 'italic' }}>{sc.question}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sc.options.map((opt, j) => {
                    let bg = 'transparent', border = 'var(--rim)', color = 'var(--ink-mid)'
                    if (item.revealed) {
                      if (j === sc.answer)                        { bg = 'rgba(52,211,153,0.15)';  border = 'var(--mint)'; color = 'var(--mint)' }
                      else if (j === item.picked)                 { bg = 'rgba(244,63,94,0.15)';   border = 'var(--rose)'; color = 'var(--rose)' }
                    } else if (j === item.picked) {
                      bg = 'rgba(240,165,0,0.15)'; border = 'var(--prime)'; color = 'var(--prime)'
                    }
                    return (
                      <button key={j} onClick={() => pick(i, j)} disabled={item.revealed}
                        style={{ padding: '10px 14px', borderRadius: '7px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: item.revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.6, minWidth: '14px' }}>{String.fromCharCode(65 + j)}</span>
                        {item.revealed && j === sc.answer               && <span>&#10003; </span>}
                        {item.revealed && j === item.picked && j !== sc.answer && <span>&#10007; </span>}
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {item.revealed && (
                  <div style={{ padding: '14px 16px', background: isCorrect ? 'rgba(52,211,153,0.11)' : 'rgba(244,63,94,0.11)', border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(244,63,94,0.2)'}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>
                      {isCorrect ? '&#10003; Correct' : '&#10007; Wrong'}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{sc.diagnosis}</p>
                    {sc.fix && (
                      <div style={{ padding: '10px 12px', background: 'rgba(240,165,0,0.13)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', fontWeight: 600 }}>Production Fix</div>
                        <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.fix}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Alerting Decision Tree ───────────────────────────────────────────────────
const ALERTING_SCENARIOS = [
  {
    id: 'alert1',
    title: 'PSI spike on user_age at 3am',
    context: 'Your monitoring system fires at 3:12am: PSI = 0.31 on `user_age` for the fraud detection model. Model AUC has dropped from 0.83 to 0.79 over the last 6 hours. P95 serving latency is unchanged. The upstream user profile pipeline had a scheduled maintenance window from 2am–3am.',
    question: 'What is the correct immediate action?',
    options: [
      'Page the on-call ML engineer and roll back the model immediately.',
      'The PSI spike and AUC drop are consistent with a data pipeline issue during the maintenance window — not a model failure. Log the alert, check whether the upstream pipeline has recovered post-maintenance, and monitor for 30 minutes before escalating.',
      'Retrain the model on the most recent 7 days of data.',
      'Disable the fraud model and fall back to the rules engine.',
    ],
    answer: 1,
    diagnosis: 'Temporal correlation matters: PSI spike overlapping exactly with a scheduled maintenance window is almost certainly a pipeline artifact, not a model failure. Rollback and retraining are expensive and irreversible actions. The correct response is to determine whether the root cause is transient (maintenance window data gap) before escalating.',
    fix: 'Build alert context into your monitoring: tag each alert with any overlapping maintenance windows, recent deployments, or known data pipeline events. If PSI spikes coincide with a known infrastructure event, auto-suppress the page and create a watch-and-log entry instead. Escalate only if PSI remains elevated >1 hour after the maintenance window closes.',
  },
  {
    id: 'alert2',
    title: 'AUC drops 8 points — batch vs. real-time serving',
    context: 'A content recommendation model shows AUC dropping from 0.76 to 0.68 over 48 hours. PSI is stable across all input features. The model serves batch pre-computed recommendations refreshed every 4 hours. Investigation shows that a new content category was launched 3 days ago and now represents 18% of user interactions.',
    question: 'Why is PSI stable while AUC degrades?',
    options: [
      'PSI is calculated incorrectly — the monitoring system has a bug.',
      'Batch serving means the model never saw the new content category — it cannot recommend items it was never trained on. PSI measures input feature distributions, which are stable. AUC degradation comes from missing coverage, not feature drift.',
      'AUC degradation always lags PSI changes by 48 hours.',
      'The new content category is reducing engagement across all recommendations.',
    ],
    answer: 1,
    diagnosis: 'PSI and AUC measure different things. PSI monitors input feature distributions — which are stable because user features have not changed. AUC monitors prediction quality — which degrades because the model has no coverage for a new content category that now drives 18% of interactions. You need output distribution monitoring, not just input monitoring.',
    fix: 'Add coverage monitoring: track the percentage of serving requests where the model has low confidence (prediction score < 0.5) or returns items from a category absent from training data. When a new content category launches, trigger a model evaluation on the new-category slice immediately. For batch serving, shorten the refresh cycle or add a real-time fallback for cold-start categories.',
  },
  {
    id: 'alert3',
    title: 'Latency breach at peak — auto-rollback or hold?',
    context: 'P95 serving latency for your real-time pricing model breaches SLA (>200ms) for 8 consecutive minutes during peak load at 6pm. The breach started immediately after a model update was promoted to 100% traffic. PSI and AUC are both stable. Infrastructure team confirms no server-side issues.',
    question: 'Should you auto-rollback the model or hold and investigate?',
    options: [
      'Hold — latency breaches are infrastructure problems, not model problems.',
      'Auto-rollback immediately — any SLA breach warrants rollback.',
      'The timing correlation (latency breach = model update) and stable PSI/AUC strongly suggest the new model has higher computational complexity. Rollback to the previous model to restore SLA, then profile the new model\'s inference path before re-promoting.',
      'Scale up serving infrastructure and keep the new model live.',
    ],
    answer: 2,
    diagnosis: 'When a latency breach starts precisely at a model update and infrastructure is healthy, the model is the most likely cause — larger model size, more features, or a more complex decision tree depth. Holding and investigating while users experience SLA breaches is wrong. Rollback first, profile second.',
    fix: 'Add latency to the model promotion gate: run a load test at expected peak QPS before promoting any model to 100% traffic. Gate on P95 < 150ms (giving 50ms headroom to SLA). For the specific incident: rollback, then profile the new model — compare feature count, tree depth, and inference time against the previous version. Re-promote only after confirming P95 at peak load.',
  },
]

function AlertingDecisionTree() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>On-Call Judgment</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Alerting Decision Tree</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          Given an alert at 3am — PSI spike, AUC drop, latency breach — decide: page immediately, log and watch, auto-rollback, or suppress. The right answer changes with context.
        </p>
      </div>
      <AccordionMCQ scenarios={ALERTING_SCENARIOS} accentColor="var(--rose)" storageKey="monitoring_alerting" />
    </div>
  )
}

// ─── Drift Attribution ────────────────────────────────────────────────────────
const DRIFT_ATTRIBUTION_SCENARIOS = [
  {
    id: 'drift1',
    title: 'PSI elevated — which feature is actually driving it?',
    context: 'Your aggregate monitoring dashboard shows overall PSI = 0.22 across 47 input features for a credit scoring model. The alert threshold is 0.20. You need to identify which features are driving the drift before filing an incident.',
    question: 'What is the correct attribution approach?',
    options: [
      'Compute PSI for each feature individually and rank by PSI value descending.',
      'PSI is already computed per feature — sort by PSI descending, focus on features with PSI > 0.10, then cross-reference with feature importance from the trained model. A high-PSI feature that is also high-importance is the real risk; a high-PSI feature with near-zero importance is noise.',
      'Retrain the model and compare performance to identify which features degraded.',
      'File the incident based on the aggregate PSI alone — individual feature analysis is too slow for on-call response.',
    ],
    answer: 1,
    diagnosis: 'PSI alone is not enough — it measures distributional shift but not impact. A feature with PSI = 0.45 that contributes 0.1% to model predictions is less dangerous than a feature with PSI = 0.12 that is the top feature by importance. The intersection of drift magnitude and model dependence determines actual risk.',
    fix: 'Build a drift impact score: `drift_impact = PSI_feature × feature_importance_rank`. Sort by drift impact, not raw PSI. In your incident report, list the top 3 features by drift impact, their PSI values, their importance percentile, and the upstream data source responsible. This immediately focuses the data engineering response on the right pipeline.',
  },
  {
    id: 'drift2',
    title: 'Covariate drift vs. label drift — different responses',
    context: 'A loan default model shows: (1) PSI = 0.28 on `debt_to_income_ratio` over the last 30 days — users applying for loans have higher DTI than training distribution. (2) Observed default rate has dropped from 3.2% to 2.1% over the same period. Model predicted default rate is still 3.1%.',
    question: 'Is this covariate drift, label drift, or both — and what is the correct response?',
    options: [
      'Covariate drift only — the feature distribution shifted. Retrain on recent data.',
      'Label drift only — the default rate changed. Update the decision threshold.',
      'Both: covariate drift (DTI distribution shifted) and label drift (true default rate dropped). These require different responses — feature drift requires pipeline investigation, label drift requires threshold recalibration and potentially retraining with recent labels.',
      'Neither — a 1% drop in default rate is within normal seasonal variation.',
    ],
    answer: 2,
    diagnosis: 'Covariate and label drift are independent failure modes that happen to co-occur here. Covariate drift (DTI shift) means the input distribution has changed — model predictions may be less reliable in the new region of feature space. Label drift (true default rate drop) means the model is now miscalibrated — it still predicts 3.1% default when the true rate is 2.1%, causing systematic over-rejection of creditworthy applicants.',
    fix: 'Respond to each independently: (1) For covariate drift — investigate the DTI pipeline, check if loan application eligibility criteria changed, assess whether the model has enough training data in the new DTI range. (2) For label drift — recalibrate the decision threshold using recent outcome data (Platt scaling or isotonic regression on 90-day labels). Schedule a retrain on data from the post-shift period once enough labels accumulate.',
  },
  {
    id: 'drift3',
    title: 'Concept drift without input drift',
    context: 'A fraud detection model shows stable input feature distributions (all PSI < 0.10) and stable serving latency. But precision on confirmed fraud cases has dropped from 0.81 to 0.63 over 6 weeks. The fraud team reports that fraud patterns have changed — new account takeover techniques using legitimate-looking session behaviour.',
    question: 'Why did input feature monitoring fail to catch this?',
    options: [
      'The monitoring system computed PSI incorrectly.',
      'Concept drift: the relationship between features and the fraud label has changed, even though the feature distributions are stable. New fraud techniques produce inputs that look identical to legitimate behaviour — the model\'s learned boundary is no longer valid.',
      'The model needs more training data.',
      'Precision dropped because more legitimate transactions are being processed.',
    ],
    answer: 1,
    diagnosis: 'Concept drift is invisible to input monitoring. PSI measures whether features look different — it cannot detect whether the same feature values now mean something different. New fraud techniques specifically exploit this: they produce feature distributions indistinguishable from legitimate behaviour, making PSI-based monitoring blind to the change.',
    fix: 'Add outcome-based monitoring: track precision, recall, and F1 on confirmed fraud labels as they come in (typically 2–4 week delay). When outcome metrics degrade with stable input distributions, the diagnosis is concept drift. Response: increase human review sampling rate to build a fresh labeled dataset, then retrain on recent data. Add adversarial test cases representing known new fraud patterns to the model evaluation suite.',
  },
]

function DriftAttribution() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Drift Diagnosis</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Drift Attribution</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          PSI is elevated — but which features are actually driving model degradation? Distinguish covariate drift, label drift, and concept drift and respond to each correctly.
        </p>
      </div>
      <AccordionMCQ scenarios={DRIFT_ATTRIBUTION_SCENARIOS} accentColor="var(--gold)" storageKey="monitoring_drift" />
    </div>
  )
}

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'drift',    label: 'Drift Dashboard',   icon: '', component: DriftDashboard },
  { id: 'psi',     label: 'PSI Lab',            icon: '', component: PSILab },
  { id: 'ks',      label: 'KS Test',            icon: '', component: KSTestExplorer },
  { id: 'alert',   label: 'Alert Tuner',        icon: '', component: AlertTuner },
  { id: 'triage',  label: 'Incident Triage',    icon: '', component: IncidentTriage },
  { id: 'coverage',       label: 'Coverage Audit',     icon: '', component: MonitorCoverageAudit },
  { id: 'alerting_tree',  label: 'Alerting Decisions', component: AlertingDecisionTree },
  { id: 'drift_attribution', label: 'Drift Attribution', component: DriftAttribution },
]

// ── Coming Soon ───────────────────────────────────────────────────────────────
// devBrief fields are internal build guidance only — not rendered to users.
const COMING_SOON = []


function ForwardPointer({ label, tab, onNavigate, accent = 'var(--ink-low)' }) {
  return (
    <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
      <button
        onClick={() => onNavigate(tab)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '12px', color: accent, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '12px', color: accent }}>→</span>
      </button>
    </div>
  )
}

export default function MonitoringTab({ onNavigate }) {
  const [active, setActive] = useState('drift')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? DriftDashboard

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--rose) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Monitor</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '580px' }}>
          Models don't break on deploy day. They degrade silently. Configure thresholds, watch drift develop, build alerts that actually work.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)} className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>{m.label}
          </button>
        ))}
      </div>
      <div key={active} className="tab-enter"><ActiveModule /></div>
      {onNavigate && (
        <div style={{ background: 'rgba(34,211,238,0.13)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--sky)' }}>Concept Drift: How to Detect It Before It Destroys Your Model</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: '6px', color: 'var(--sky)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}
      {onNavigate && <ForwardPointer label="Test this in Combinator" tab="combinator" onNavigate={onNavigate} accent="var(--rose)" />}
      {/* ── Coming Soon ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '48px' }}>
        <div className="eyebrow" style={{ marginBottom: '12px' }}>What's building</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {COMING_SOON.map(m => (
            <div key={m.label} className="card" style={{ padding: '16px', opacity: 0.65, borderLeft: '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--ink-mid)' }}>{m.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'rgba(255,255,255,0.07)', color: 'var(--ink-ghost)', borderRadius: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>soon</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.userBrief}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
