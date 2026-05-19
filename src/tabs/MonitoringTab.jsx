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
          height: '1px', background: '#f59e0b', opacity: 0.6,
          borderTop: '1px dashed #f59e0b', zIndex: 2,
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
          ? <line key={i} x1={`${(i + 0.5) * w}%`} x2={`${(i + 0.5) * w}%`} y1="0" y2={height} stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: '#eaecff', marginBottom: '6px', letterSpacing: '-0.02em' }}>Drift Dashboard</h3>
        <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6 }}>
          A model is running in production. Concept drift is injected at a hidden day (slide to reveal). Configure your PSI alert threshold — too tight means alert fatigue, too loose means silent degradation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '10px' }}>
            PSI alert threshold: <span style={{ color: psiThreshold < 0.1 ? '#f43f5e' : psiThreshold > 0.3 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>{psiThreshold}</span>
            {psiThreshold < 0.1 && <span style={{ color: '#f43f5e', fontSize: '10px', marginLeft: '6px' }}>⚠ alert fatigue</span>}
            {psiThreshold > 0.3 && <span style={{ color: '#f59e0b', fontSize: '10px', marginLeft: '6px' }}>⚠ too loose</span>}
          </label>
          <input type="range" min={0.05} max={0.5} step={0.01} value={psiThreshold} onChange={e => setPsiThreshold(+e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#2d3260', marginTop: '4px' }}>
            <span>0.05 (tight)</span><span>0.5 (loose)</span>
          </div>
          <p style={{ fontSize: '11px', color: '#2d3260', marginTop: '8px', margin: '8px 0 0' }}>Standard: PSI &gt; 0.2 = significant shift. PSI &gt; 0.1 = monitor closely.</p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '10px' }}>
            Drift onset: {revealed ? <span style={{ color: '#f43f5e', fontWeight: 600 }}>Day {driftDay}</span> : <span style={{ color: '#525a82' }}>hidden</span>}
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
          { label: 'Model accuracy', field: 'accuracy', color: '#6366f1', fmt: v => (v * 100).toFixed(1) + '%' },
          { label: 'PSI (input drift)', field: 'psi', color: '#f59e0b', threshold: psiThreshold, fmt: v => v.toFixed(3) },
          { label: 'KS statistic', field: 'ksStatistic', color: '#22d3ee', threshold: 0.1, fmt: v => v.toFixed(3) },
        ].map(c => {
          const current = data[data.length - 1]
          return (
            <div key={c.field} className="card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace" }}>{c.label}</span>
                <span style={{ fontSize: '13px', color: c.color, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{c.fmt(current[c.field])}</span>
              </div>
              <MiniChart data={data} field={c.field} color={c.color} threshold={c.threshold} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#2d3260', marginTop: '4px' }}>
                <span>Day 1</span><span>Day 60</span>
              </div>
            </div>
          )
        })}

        {/* Alert timeline */}
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace", marginBottom: '8px' }}>Alert fired (PSI &gt; {psiThreshold})</div>
          <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
            {data.map((d, i) => (
              <div key={i} title={`Day ${d.day}`} style={{
                width: '9px', height: '24px', borderRadius: '2px',
                background: d.alertFired ? '#f43f5e' : (d.hasDrift && revealed) ? 'rgba(244,63,94,0.2)' : '#1c2040',
                transition: 'background 0.1s',
              }} />
            ))}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: missed ? '#f43f5e' : alertDelay !== null && alertDelay > 7 ? '#f59e0b' : '#10b981' }}>
            {missed ? '🔕 No alert fired — drift undetected' :
             alertDelay === 0 ? '✓ Alert fired same day as drift onset' :
             `⚠ Alert fired ${alertDelay} day${alertDelay !== 1 ? 's' : ''} after drift onset`}
          </div>
        </div>
      </div>

      {revealed && (
        <div className="card animate-slide-up" style={{ padding: '18px', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '15px', color: '#eaecff', marginBottom: '10px' }}>📊 Post-mortem</div>
          <p style={{ fontSize: '13px', color: '#8891b8', lineHeight: 1.7, margin: 0 }}>
            Drift started on <strong style={{ color: '#f43f5e' }}>Day {driftDay}</strong>.
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

  const psiColor = result.totalPSI < 0.1 ? '#10b981' : result.totalPSI < 0.2 ? '#f59e0b' : '#f43f5e'
  const psiLabel = result.totalPSI < 0.1 ? 'Stable' : result.totalPSI < 0.2 ? 'Some shift — monitor' : 'Significant shift — alert'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: '#eaecff', marginBottom: '6px', letterSpacing: '-0.02em' }}>PSI Lab</h3>
        <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6 }}>
          Population Stability Index from scratch. Slide the distribution shift and watch PSI change in real time.
          Understand why 0.2 is the standard threshold — and when it's wrong.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '10px' }}>
            Distribution shift (σ): <span style={{ color: '#818cf8', fontWeight: 600 }}>{shiftAmount.toFixed(1)}</span>
          </label>
          <input type="range" min={0} max={3} step={0.1} value={shiftAmount} onChange={e => setShiftAmount(+e.target.value)} />
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '10px' }}>
            Bins: <span style={{ color: '#818cf8', fontWeight: 600 }}>{nBins}</span>
          </label>
          <input type="range" min={5} max={20} step={1} value={nBins} onChange={e => setNBins(+e.target.value)} />
        </div>
      </div>

      {/* PSI score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '40px', fontWeight: 700, color: psiColor }}>
          {result.totalPSI.toFixed(4)}
        </div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, color: psiColor, fontSize: '15px' }}>{psiLabel}</div>
          <div style={{ fontSize: '12px', color: '#525a82' }}>PSI = Σ (Actual% − Expected%) × ln(Actual% / Expected%)</div>
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
                <div style={{ width: '100%', background: '#6366f1', height: `${(b.ref / maxRef) * 60}px`, opacity: 0.7, borderRadius: '2px 2px 0 0' }} />
                <div style={{ width: '100%', background: '#22d3ee', height: `${(b.cur / maxRef) * 60}px`, opacity: 0.8, borderRadius: '2px 2px 0 0' }} />
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#525a82' }}>
            <div style={{ width: '10px', height: '10px', background: '#6366f1', borderRadius: '2px', opacity: 0.7 }} /> Reference
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#525a82' }}>
            <div style={{ width: '10px', height: '10px', background: '#22d3ee', borderRadius: '2px', opacity: 0.8 }} /> Current
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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>KS Test Explorer</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          The Kolmogorov-Smirnov test detects distribution shift without assuming any particular shape — it measures the maximum gap between two empirical CDFs. Adjust the sliders to see exactly how D, the KS statistic, moves.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '8px' }}>
            Mean shift: <span style={{ color: 'var(--violet)', fontWeight: 600 }}>{meanShift.toFixed(1)}σ</span>
          </label>
          <input type="range" min={0} max={2.5} step={0.1} value={meanShift} onChange={e => setMeanShift(+e.target.value)} />
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '8px' }}>
            Std ratio: <span style={{ color: 'var(--sky)', fontWeight: 600 }}>{stdRatio.toFixed(2)}×</span>
          </label>
          <input type="range" min={0.5} max={2.0} step={0.05} value={stdRatio} onChange={e => setStdRatio(+e.target.value)} />
        </div>
        <div className="card" style={{ padding: '14px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '8px' }}>
            Sample size n: <span style={{ color: 'var(--mint)', fontWeight: 600 }}>{nSamples.toLocaleString()}</span>
          </label>
          <input type="range" min={50} max={5000} step={50} value={nSamples} onChange={e => setNSamples(+e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KS Statistic (D)</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '32px', fontWeight: 700, color: statusColor }}>{result.ksStatistic.toFixed(4)}</div>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginTop: '4px' }}>max |F₁(x) − F₂(x)|</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>p-value</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '32px', fontWeight: 700, color: significant ? 'var(--rose)' : 'var(--mint)' }}>{result.pValue.toFixed(4)}</div>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginTop: '4px' }}>threshold: 0.05</div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', background: significant ? 'rgba(244,63,94,0.05)' : 'rgba(6,214,160,0.05)', border: `1px solid ${significant ? 'rgba(244,63,94,0.2)' : 'rgba(6,214,160,0.2)'}` }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verdict</div>
          <div style={{ fontSize: '12px', color: statusColor, fontWeight: 600, lineHeight: 1.4 }}>
            {significant ? 'Significant difference — reject H₀' : 'No significant difference — fail to reject H₀'}
          </div>
        </div>
      </div>

      {/* CDF plot */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--ink-low)', marginBottom: '12px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>Empirical CDFs — reference vs current distribution</div>
        <svg viewBox={`0 0 ${W} ${H + 4}`} style={{ width: '100%', height: '160px', overflow: 'visible' }}>
          {[0.25, 0.5, 0.75].map(v => (
            <line key={v} x1="0" y1={H - v * H} x2={W} y2={H - v * H} stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
          ))}
          {/* Shaded gap area between CDFs */}
          <path
            d={`${pathD('f1')} L${result.points.slice().reverse().map((p, i) => {
              const x = ((p.x - (-5)) / 12) * W
              const y = H - p.f2 * H
              return `${x.toFixed(1)},${y.toFixed(1)}`
            }).join(' L')} Z`}
            fill="rgba(245,158,11,0.07)" stroke="none"
          />
          <path d={pathD('f1')} fill="none" stroke="var(--violet)" strokeWidth="1.8" />
          <path d={pathD('f2')} fill="none" stroke="var(--sky)"    strokeWidth="1.8" />
          {/* KS gap marker */}
          {kp && (
            <g>
              <line x1={kx} y1={ky1} x2={kx} y2={ky2} stroke="var(--ember)" strokeWidth="1.5" strokeDasharray="3,2" />
              <circle cx={kx} cy={ky1} r="3" fill="var(--violet)" />
              <circle cx={kx} cy={ky2} r="3" fill="var(--sky)" />
              <text x={kx + 4} y={Math.min(ky1, ky2) - 3} fontSize="7" fill="var(--ember)" fontFamily="JetBrains Mono, monospace">
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
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '12px' }}>KS Test vs PSI — choosing the right tool</div>
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
      <div className="card" style={{ padding: '14px', background: 'rgba(129,140,248,0.04)', border: '1px solid rgba(129,140,248,0.15)' }}>
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
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Alert Tuner</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Configure alert rules and simulate how they'd perform against a 30-day production window. Balance detection speed against alert fatigue — both kill on-call teams in different ways.
        </p>
      </div>

      {/* Drift day */}
      <div className="card" style={{ padding: '14px' }}>
        <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '8px' }}>
          Drift onset: <span style={{ color: 'var(--rose)', fontWeight: 600 }}>Day {driftDay}</span>
        </label>
        <input type="range" min={5} max={25} step={1} value={driftDay} onChange={e => setDriftDay(+e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '4px' }}>
          <span>Day 5</span><span>Day 25</span>
        </div>
      </div>

      {/* Rules */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: 'var(--ink-mid)', fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", marginBottom: '2px' }}>Alert Rules</div>
        {rules.map(rule => (
          <div key={rule.id} className="card" style={{ padding: '14px', opacity: rule.enabled ? 1 : 0.5, transition: 'opacity 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Toggle */}
                <button onClick={() => updateRule(rule.id, 'enabled', !rule.enabled)}
                  style={{ width: '36px', height: '20px', borderRadius: '10px', background: rule.enabled ? 'var(--mint)' : 'var(--rim)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: '2px', left: rule.enabled ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '8px', background: 'white', transition: 'left 0.15s' }} />
                </button>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)' }}>{rule.label}</span>
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
                <label style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '6px' }}>
                  Threshold: <span style={{ color: SEV[rule.severity], fontWeight: 600 }}>{rule.threshold.toFixed(2)}</span>
                </label>
                <input type="range" min={0.01} max={0.5} step={0.01} value={rule.threshold} onChange={e => updateRule(rule.id, 'threshold', +e.target.value)} disabled={!rule.enabled} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '6px' }}>
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
            <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{stat.label}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* 30-day timeline */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ fontSize: '12px', color: 'var(--ink-low)', marginBottom: '10px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>Alert timeline — 30 days</div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${((driftDay - 1) / 30) * 100}%`, right: 0, background: 'rgba(244,63,94,0.05)', borderLeft: '1px dashed rgba(244,63,94,0.3)', pointerEvents: 'none' }} />
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
      <div className="card" style={{ padding: '16px', background: sim.falsePos > 5 ? 'rgba(244,63,94,0.04)' : sim.delay === null ? 'rgba(245,158,11,0.04)' : 'rgba(6,214,160,0.04)', border: `1px solid ${sim.falsePos > 5 ? 'rgba(244,63,94,0.2)' : sim.delay === null ? 'rgba(245,158,11,0.2)' : 'rgba(6,214,160,0.2)'}` }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '8px' }}>📋 Recommendation</div>
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

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'drift', label: 'Drift Dashboard', icon: '📉', component: DriftDashboard },
  { id: 'psi',   label: 'PSI Lab',         icon: '📏', component: PSILab },
  { id: 'ks',    label: 'KS Test',         icon: '📐', component: KSTestExplorer },
  { id: 'alert', label: 'Alert Tuner',     icon: '🔔', component: AlertTuner },
]

export default function MonitoringTab() {
  const [active, setActive] = useState('drift')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? DriftDashboard

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>📡</span>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: '#eaecff', letterSpacing: '-0.04em' }}>Monitoring & Drift</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#525a82', lineHeight: 1.6, maxWidth: '580px' }}>
          Models don't break on deploy day. They degrade silently. Configure thresholds, watch drift develop, build alerts that actually work.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)} className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>
            <span style={{ marginRight: '6px' }}>{m.icon}</span>{m.label}
          </button>
        ))}
      </div>
      <ActiveModule />
    </div>
  )
}
