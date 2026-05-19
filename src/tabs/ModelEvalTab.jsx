import { useState, useMemo } from 'react'

// ─── Metric Selector ──────────────────────────────────────────────────────────
function MetricSelector() {
  const [imbalance, setImbalance]   = useState(10)   // % positive class
  const [threshold, setThreshold]   = useState(0.5)
  const [picked, setPicked]         = useState(null)
  const [revealed, setRevealed]     = useState(false)

  // Simulate confusion matrix given imbalance + threshold
  const metrics = useMemo(() => {
    const total = 1000
    const pos   = Math.round(total * imbalance / 100)
    const neg   = total - pos

    // Simulated model: decent but not perfect
    const sensitivity = 0.85
    const specificity = 0.70 + (imbalance / 100) * 0.15

    const tp = Math.round(pos  * sensitivity * (threshold < 0.5 ? 1.1 : threshold > 0.7 ? 0.75 : 1))
    const fn = pos - Math.min(tp, pos)
    const tn = Math.round(neg  * specificity * (threshold > 0.5 ? 1.05 : 0.9))
    const fp = neg - Math.min(tn, neg)

    const precision = tp / (tp + fp + 0.001)
    const recall    = tp / (tp + fn + 0.001)
    const f1        = 2 * precision * recall / (precision + recall + 0.001)
    const accuracy  = (tp + tn) / total
    const auc       = 0.82 + (imbalance < 5 ? -0.05 : 0)

    return { tp, fp, tn, fn, precision, recall, f1, accuracy, auc, pos, neg }
  }, [imbalance, threshold])

  const METRICS = [
    {
      id: 'accuracy', name: 'Accuracy',
      value: (metrics.accuracy * 100).toFixed(1) + '%',
      good: imbalance > 20,
      note: imbalance < 10
        ? '⚠ Misleading here — a model that predicts all negative gets ' + (100 - imbalance).toFixed(0) + '% accuracy for free.'
        : '✓ OK when classes are roughly balanced.',
    },
    {
      id: 'auc', name: 'ROC-AUC',
      value: metrics.auc.toFixed(2),
      good: true,
      note: 'Measures rank ordering — does the model score positives higher than negatives? ' +
            (imbalance < 5 ? 'With severe imbalance, AUC can be high while your positive recall is terrible. Use PR-AUC instead.' : 'Good general choice.'),
    },
    {
      id: 'prauc', name: 'PR-AUC',
      value: '~' + (metrics.precision * metrics.recall * 1.4).toFixed(2),
      good: imbalance < 15,
      note: imbalance < 10
        ? '✓ Best choice for imbalanced classes — focuses on the minority class you actually care about.'
        : '✓ Good. Focuses on precision-recall tradeoff at different thresholds.',
    },
    {
      id: 'f1', name: 'F1 Score',
      value: metrics.f1.toFixed(3),
      good: imbalance < 30,
      note: 'Harmonic mean of precision and recall at the chosen threshold (' + threshold + '). ' +
            'Threshold-dependent — will change if you move the cutoff.',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: '#eaecff', marginBottom: '6px', letterSpacing: '-0.02em' }}>Metric Selector</h3>
        <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6 }}>
          Configure your dataset and pick a metric. Then see if you chose correctly — and why.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '10px' }}>
            Positive class: <span style={{ color: imbalance < 10 ? '#f43f5e' : '#818cf8', fontWeight: 600 }}>{imbalance}%</span>
            {imbalance < 10 && <span style={{ color: '#f43f5e', marginLeft: '6px' }}>⚠ imbalanced</span>}
          </label>
          <input type="range" min={1} max={50} value={imbalance} onChange={e => { setImbalance(+e.target.value); setRevealed(false); setPicked(null) }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#2d3260', marginTop: '4px' }}>
            <span>1% (severe skew)</span><span>50% (balanced)</span>
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '10px' }}>
            Decision threshold: <span style={{ color: '#818cf8', fontWeight: 600 }}>{threshold}</span>
          </label>
          <input type="range" min={0.1} max={0.9} step={0.05} value={threshold} onChange={e => { setThreshold(+e.target.value); setRevealed(false); setPicked(null) }} />
        </div>
      </div>

      {/* Confusion matrix */}
      <div className="card" style={{ padding: '16px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '12px' }}>Confusion matrix (1,000 samples)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxWidth: '360px' }}>
          {[
            { label: 'TP', val: metrics.tp, color: '#10b981' },
            { label: 'FP', val: metrics.fp, color: '#f43f5e' },
            { label: 'FN', val: metrics.fn, color: '#f59e0b' },
            { label: 'TN', val: metrics.tn, color: '#525a82' },
          ].map(c => (
            <div key={c.label} style={{ background: '#0b0d1a', border: `1px solid ${c.color}30`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: c.color, fontFamily: "'Space Grotesk',sans-serif" }}>{c.val}</div>
              <div style={{ fontSize: '11px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric choice */}
      <div>
        <p style={{ fontSize: '13px', color: '#8891b8', marginBottom: '12px' }}>
          Which metric best reflects model quality for this dataset?
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {METRICS.map(m => (
            <button key={m.id} onClick={() => { setPicked(m.id); setRevealed(true) }}
              style={{
                padding: '14px',
                borderRadius: '10px',
                border: `1px solid ${picked === m.id ? (m.good ? '#10b981' : '#f43f5e') : '#1c2040'}`,
                background: picked === m.id ? (m.good ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)') : '#0b0d1a',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: '#eaecff', marginBottom: '4px' }}>{m.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', color: m.good ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{m.value}</div>
            </button>
          ))}
        </div>
      </div>

      {revealed && picked && (
        <div className="card animate-slide-up" style={{ padding: '18px', background: METRICS.find(m=>m.id===picked)?.good ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)', border: `1px solid ${METRICS.find(m=>m.id===picked)?.good ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}` }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '15px', color: METRICS.find(m=>m.id===picked)?.good ? '#10b981' : '#f43f5e', marginBottom: '8px' }}>
            {METRICS.find(m=>m.id===picked)?.good ? '✓ Good choice' : '⚠ Think again'}
          </div>
          <p style={{ fontSize: '13px', color: '#8891b8', lineHeight: 1.7, margin: 0 }}>
            {METRICS.find(m=>m.id===picked)?.note}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── A/B Test Designer ────────────────────────────────────────────────────────
function ABTestDesigner() {
  const [baseline, setBaseline]     = useState(5.0)  // %
  const [mde, setMde]               = useState(10)   // relative % lift
  const [alpha, setAlpha]           = useState(5)    // significance level %
  const [power, setPower]           = useState(80)   // %
  const [dailyUsers, setDailyUsers] = useState(10000)

  const result = useMemo(() => {
    const p1 = baseline / 100
    const p2 = p1 * (1 + mde / 100)
    const a  = alpha / 100
    const pw = power / 100

    // z-scores (normal approximation)
    const z_alpha = a === 0.01 ? 2.576 : a === 0.05 ? 1.96 : a === 0.1 ? 1.645 : 1.96
    const z_beta  = pw === 0.80 ? 0.842 : pw === 0.90 ? 1.282 : pw === 0.95 ? 1.645 : 0.842

    const pooled = (p1 + p2) / 2
    const n = Math.ceil(
      (z_alpha * Math.sqrt(2 * pooled * (1 - pooled)) +
       z_beta  * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
      / (p2 - p1) ** 2
    )

    const daysNeeded = Math.ceil((n * 2) / dailyUsers)
    return { nPerGroup: n, totalN: n * 2, p2: (p2 * 100).toFixed(2), daysNeeded }
  }, [baseline, mde, alpha, power, dailyUsers])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: '#eaecff', marginBottom: '6px', letterSpacing: '-0.02em' }}>A/B Test Designer</h3>
        <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6 }}>
          Configure your experiment parameters. See how sample size and experiment duration change with each lever.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Baseline conversion rate', value: baseline, set: setBaseline, min: 0.5, max: 30, step: 0.5, suffix: '%' },
          { label: 'Minimum detectable effect', value: mde, set: setMde, min: 1, max: 50, step: 1, suffix: '% relative lift' },
          { label: 'Significance level (α)', value: alpha, set: setAlpha, min: 1, max: 20, step: 1, suffix: '%' },
          { label: 'Statistical power', value: power, set: setPower, min: 50, max: 99, step: 5, suffix: '%' },
          { label: 'Daily users (both groups)', value: dailyUsers, set: setDailyUsers, min: 100, max: 100000, step: 100, suffix: '' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '16px' }}>
            <label style={{ fontSize: '11px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '10px' }}>
              {c.label}: <span style={{ color: '#818cf8', fontWeight: 600 }}>{c.value}{c.suffix}</span>
            </label>
            <input type="range" min={c.min} max={c.max} step={c.step} value={c.value} onChange={e => c.set(+e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Sample per group', value: result.nPerGroup.toLocaleString(), color: '#818cf8' },
          { label: 'Total sample needed', value: result.totalN.toLocaleString(), color: '#22d3ee' },
          { label: 'Target conversion', value: result.p2 + '%', color: '#10b981' },
          { label: 'Days to run', value: result.daysNeeded + ' days', color: result.daysNeeded > 30 ? '#f43f5e' : '#10b981' },
        ].map(r => (
          <div key={r.label} className="card" style={{ padding: '18px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '24px', fontWeight: 700, color: r.color, marginBottom: '4px' }}>{r.value}</div>
            <div style={{ fontSize: '11px', color: '#525a82', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</div>
          </div>
        ))}
      </div>

      {result.daysNeeded > 30 && (
        <div className="card animate-slide-up" style={{ padding: '16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p style={{ fontSize: '13px', color: '#f59e0b', margin: 0, lineHeight: 1.7 }}>
            ⚠ {result.daysNeeded} days is too long. Consider: increasing MDE (detect larger effects), raising significance level (accept more FP risk),
            or increasing daily traffic allocation. Long experiments risk novelty effects and external validity issues.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Shadow Mode Simulator ────────────────────────────────────────────────────
function ShadowModeSim() {
  const [phase, setPhase]   = useState('design')
  const [days, setDays]     = useState(0)
  const [running, setRunning] = useState(false)

  const championMetrics = { precision: 0.71, recall: 0.68, p99Latency: 45, errorRate: 0.3 }
  const challengerMetrics = { precision: 0.79, recall: 0.74, p99Latency: 82, errorRate: 0.15 }

  function simulate() {
    setRunning(true)
    setDays(0)
    setPhase('running')
    let d = 0
    const interval = setInterval(() => {
      d++
      setDays(d)
      if (d >= 14) {
        clearInterval(interval)
        setPhase('complete')
        setRunning(false)
      }
    }, 120)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: '#eaecff', marginBottom: '6px', letterSpacing: '-0.02em' }}>Shadow Mode Simulator</h3>
        <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.6 }}>
          A challenger model runs in shadow alongside the champion — serving no real traffic, just logging predictions.
          After 14 days, compare offline metrics and decide on promotion.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {[
          { label: '🏆 Champion (v1)', metrics: championMetrics, color: '#10b981' },
          { label: '🥊 Challenger (v2)', metrics: challengerMetrics, color: '#6366f1' },
        ].map(m => (
          <div key={m.label} className="card" style={{ padding: '18px', border: `1px solid ${m.color}30` }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: m.color, marginBottom: '14px' }}>{m.label}</div>
            {Object.entries(m.metrics).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#525a82', fontFamily: "'JetBrains Mono',monospace" }}>{k}</span>
                <span style={{ fontSize: '13px', color: '#eaecff', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
                  {typeof v === 'number' && v < 2 ? v.toFixed(2) : v}{k === 'p99Latency' ? 'ms' : k === 'errorRate' ? '%' : ''}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {phase === 'design' && (
        <button className="btn-primary" onClick={simulate} style={{ alignSelf: 'flex-start' }}>▶ Start 14-day shadow run</button>
      )}

      {(phase === 'running' || phase === 'complete') && (
        <div className="card animate-fade-in" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: '#525a82' }}>Shadow run progress</span>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '18px', color: '#818cf8' }}>Day {days} / 14</span>
          </div>
          <div style={{ height: '8px', background: '#1c2040', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(days / 14) * 100}%`, background: 'linear-gradient(90deg,#6366f1,#22d3ee)', transition: 'width 0.1s', borderRadius: '4px' }} />
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <div className="card animate-slide-up" style={{ padding: '20px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '16px', color: '#eaecff', marginBottom: '12px' }}>📊 Shadow run complete — promote?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>✓ Precision: +11pp ({championMetrics.precision.toFixed(2)} → {challengerMetrics.precision.toFixed(2)})</p>
            <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>✓ Recall: +9pp</p>
            <p style={{ fontSize: '13px', color: '#f59e0b', margin: 0 }}>⚠ P99 latency: +{challengerMetrics.p99Latency - championMetrics.p99Latency}ms ({challengerMetrics.p99Latency}ms vs {championMetrics.p99Latency}ms)</p>
            <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>✓ Error rate: lower ({challengerMetrics.errorRate}% vs {championMetrics.errorRate}%)</p>
          </div>
          <p style={{ fontSize: '13px', color: '#525a82', lineHeight: 1.7, margin: 0 }}>
            Recommendation: <strong style={{ color: '#eaecff' }}>Promote</strong> — quality gains outweigh latency increase.
            But gate on SLA: if P99 &gt; 100ms violates your SLA, investigate model quantization first.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'metric',   label: 'Metric Selector',   icon: '📉', component: MetricSelector },
  { id: 'ab',       label: 'A/B Test Designer',  icon: '🧪', component: ABTestDesigner },
  { id: 'shadow',   label: 'Shadow Mode',        icon: '👥', component: ShadowModeSim },
]

export default function ModelEvalTab() {
  const [active, setActive] = useState('metric')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? MetricSelector

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '28px' }}>📊</span>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: '#eaecff', letterSpacing: '-0.04em' }}>Model Evaluation</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#525a82', lineHeight: 1.6, maxWidth: '580px' }}>
          Offline metrics lie. Pick the wrong metric and you'll ship a model that looks great on paper while failing in production.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>
            <span style={{ marginRight: '6px' }}>{m.icon}</span>{m.label}
          </button>
        ))}
      </div>

      <ActiveModule />
    </div>
  )
}
