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

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'drift', label: 'Drift Dashboard', icon: '📉', component: DriftDashboard },
  { id: 'psi',   label: 'PSI Lab',         icon: '📏', component: PSILab },
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
