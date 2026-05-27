import { useState, useMemo, useEffect } from 'react'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'

// ─── Shared accordion MCQ component ──────────────────────────────────────────
function AccordionMCQ({ scenarios, accentColor = 'var(--violet)', contextLabel = 'Context', storageKey = null }) {
  const [items, setItems] = useState(() => {
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem('msl_score:' + storageKey))
        if (saved && saved.length === scenarios.length) return saved
      } catch {}
    }
    return scenarios.map(() => ({ open: false, picked: null, revealed: false }))
  })
  const [diffFilter, setDiffFilter] = useState('all')

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem('msl_score:' + storageKey, JSON.stringify(items))
      window.dispatchEvent(new CustomEvent('msl_score_updated'))
    }
  }, [items, storageKey])

  function getDiff(i, total) {
    const t = total / 3
    return i < t ? 'easy' : i < 2 * t ? 'medium' : 'hard'
  }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Difficulty filter */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        {['all','easy','medium','hard'].map(d => (
          <button key={d} onClick={() => setDiffFilter(d)} style={{
            fontSize: '10px', padding: '3px 10px', borderRadius: '999px',
            background: diffFilter === d ? accentColor + '15' : 'transparent',
            border: `1px solid ${diffFilter === d ? accentColor : 'var(--rim)'}`,
            color: diffFilter === d ? accentColor : 'var(--ink-ghost)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {d === 'all' ? 'All' : d === 'easy' ? 'Easy' : d === 'medium' ? 'Med' : 'Hard'}
          </button>
        ))}
        <span style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginLeft: '4px' }}>
          {diffFilter === 'all' ? scenarios.length : scenarios.filter((_,i) => getDiff(i, scenarios.length) === diffFilter).length} scenarios
        </span>
      </div>
      {score.attempted > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '4px' }}>
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

      {scenarios.map((sc, i) => { if (diffFilter !== 'all' && getDiff(i, scenarios.length) !== diffFilter) return null;
        const item = items[i]
        const isCorrect = item.revealed && item.picked === sc.answer
        const isWrong   = item.revealed && item.picked !== sc.answer
        let borderColor = item.open ? accentColor : 'var(--rim)'
        if (isCorrect) borderColor = 'rgba(52,211,153,0.5)'
        if (isWrong)   borderColor = 'rgba(244,63,94,0.5)'

        return (
          <div key={sc.id} style={{ border: `1px solid ${borderColor}`, borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s', background: 'rgba(255,255,255,0.015)' }}>
            {/* Row header */}
            <button onClick={() => toggle(i)} style={{ width: '100%', padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '16px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.4 }}>{sc.title}</span>
              {sc.tier && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{sc.tier}</span>}
              {isCorrect && <span style={{ color: 'var(--mint)', fontSize: '13px', flexShrink: 0 }}>✓</span>}
              {isWrong   && <span style={{ color: 'var(--rose)', fontSize: '13px', flexShrink: 0 }}>✗</span>}
              <span style={{ color: 'var(--ink-ghost)', fontSize: '11px', flexShrink: 0 }}>{item.open ? '▲' : '▼'}</span>
            </button>

            {item.open && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Context */}
                <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: accentColor, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>{contextLabel}</div>
                  {Array.isArray(sc.context) ? sc.context.map((line, j) => (
                    <div key={j} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', padding: '3px 0', lineHeight: 1.5 }}>{line}</div>
                  )) : <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.context}</p>}
                </div>

                {/* Question */}
                <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, fontStyle: 'italic' }}>{sc.question}</p>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sc.options.map((opt, j) => {
                    let bg = 'transparent', border = 'var(--rim)', color = 'var(--ink-mid)'
                    if (item.revealed) {
                      if (j === sc.answer)                   { bg = 'rgba(52,211,153,0.08)';  border = 'var(--mint)'; color = 'var(--mint)' }
                      else if (j === item.picked)            { bg = 'rgba(244,63,94,0.08)';   border = 'var(--rose)'; color = 'var(--rose)' }
                    } else if (j === item.picked) {
                      bg = 'rgba(240,165,0,0.08)'; border = 'var(--prime)'; color = 'var(--prime)'
                    }
                    return (
                      <button key={j} onClick={() => pick(i, j)} disabled={item.revealed}
                        style={{ padding: '10px 14px', borderRadius: '7px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: item.revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.6, minWidth: '14px' }}>{String.fromCharCode(65 + j)}</span>
                        {item.revealed && j === sc.answer         && <span>✓ </span>}
                        {item.revealed && j === item.picked && j !== sc.answer && <span>✗ </span>}
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {/* Reveal */}
                {item.revealed && (
                  <div style={{ padding: '14px 16px', background: isCorrect ? 'rgba(52,211,153,0.05)' : 'rgba(244,63,94,0.05)', border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(244,63,94,0.2)'}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>
                      {isCorrect ? '✓ Correct' : '✗ Wrong'} — {sc.diagnosis}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{sc.explanation}</p>
                    {sc.fix && (
                      <div style={{ padding: '10px 12px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '6px' }}>
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

// ─── Metric Selector ──────────────────────────────────────────────────────────
function MetricSelector() {
  const [imbalance, setImbalance]   = useState(10)
  const [threshold, setThreshold]   = useState(0.5)
  const [picked, setPicked]         = useState(null)
  const [revealed, setRevealed]     = useState(false)

  const metrics = useMemo(() => {
    const total = 1000
    const pos   = Math.round(total * imbalance / 100)
    const neg   = total - pos
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
    { id: 'accuracy', name: 'Accuracy', value: (metrics.accuracy * 100).toFixed(1) + '%', good: imbalance > 20, note: imbalance < 10 ? '⚠ Misleading here — a model that predicts all negative gets ' + (100 - imbalance).toFixed(0) + '% accuracy for free.' : '✓ OK when classes are roughly balanced.' },
    { id: 'auc',      name: 'ROC-AUC',  value: metrics.auc.toFixed(2), good: true, note: 'Measures rank ordering — does the model score positives higher than negatives? ' + (imbalance < 5 ? 'With severe imbalance, AUC can be high while your positive recall is terrible. Use PR-AUC instead.' : 'Good general choice.') },
    { id: 'prauc',    name: 'PR-AUC',   value: '~' + (metrics.precision * metrics.recall * 1.4).toFixed(2), good: imbalance < 15, note: imbalance < 10 ? '✓ Best choice for imbalanced classes — focuses on the minority class you actually care about.' : '✓ Good. Focuses on precision-recall tradeoff at different thresholds.' },
    { id: 'f1',       name: 'F1 Score', value: metrics.f1.toFixed(3), good: imbalance < 30, note: 'Harmonic mean of precision and recall at threshold ' + threshold + '. Threshold-dependent.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Metric Selector</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>Configure your dataset and pick a metric. Then see if you chose correctly — and why.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
            Positive class: <span style={{ color: imbalance < 10 ? 'var(--rose)' : 'var(--violet)', fontWeight: 600 }}>{imbalance}%</span>
            {imbalance < 10 && <span style={{ color: 'var(--rose)', marginLeft: '6px' }}>⚠ imbalanced</span>}
          </label>
          <input type="range" min={1} max={50} value={imbalance} onChange={e => { setImbalance(+e.target.value); setRevealed(false); setPicked(null) }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '4px' }}>
            <span>1% (severe skew)</span><span>50% (balanced)</span>
          </div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
            Decision threshold: <span style={{ color: 'var(--violet)', fontWeight: 600 }}>{threshold}</span>
          </label>
          <input type="range" min={0.1} max={0.9} step={0.05} value={threshold} onChange={e => { setThreshold(+e.target.value); setRevealed(false); setPicked(null) }} />
        </div>
      </div>
      <div className="card" style={{ padding: '16px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '12px' }}>Confusion matrix (1,000 samples)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxWidth: '360px' }}>
          {[{ label: 'TP', val: metrics.tp, color: 'var(--mint)' }, { label: 'FP', val: metrics.fp, color: 'var(--rose)' }, { label: 'FN', val: metrics.fn, color: 'var(--gold)' }, { label: 'TN', val: metrics.tn, color: 'var(--ink-low)' }].map(c => (
            <div key={c.label} style={{ background: 'var(--void)', border: `1px solid ${c.color}30`, borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: c.color, fontFamily: 'var(--font-sans)' }}>{c.val}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{c.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', marginBottom: '12px' }}>Which metric best reflects model quality for this dataset?</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
          {METRICS.map(m => (
            <button key={m.id} onClick={() => { setPicked(m.id); setRevealed(true) }}
              style={{ padding: '14px', borderRadius: '10px', border: `1px solid ${picked === m.id ? (m.good ? 'var(--mint)' : 'var(--rose)') : 'var(--rim)'}`, background: picked === m.id ? (m.good ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)') : 'var(--void)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '4px' }}>{m.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: m.good ? 'var(--mint)' : 'var(--rose)', fontWeight: 700 }}>{m.value}</div>
            </button>
          ))}
        </div>
      </div>
      {revealed && picked && (
        <div className="card animate-slide-up" style={{ padding: '18px', background: METRICS.find(m => m.id === picked)?.good ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)', border: `1px solid ${METRICS.find(m => m.id === picked)?.good ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}` }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '15px', color: METRICS.find(m => m.id === picked)?.good ? 'var(--mint)' : 'var(--rose)', marginBottom: '8px' }}>
            {METRICS.find(m => m.id === picked)?.good ? '✓ Good choice' : '⚠ Think again'}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{METRICS.find(m => m.id === picked)?.note}</p>
        </div>
      )}
    </div>
  )
}

// ─── Shadow Mode Simulator ────────────────────────────────────────────────────
function ShadowModeSim() {
  const [phase, setPhase]     = useState('design')
  const [days, setDays]       = useState(0)
  const [running, setRunning] = useState(false)

  const championMetrics  = { precision: 0.71, recall: 0.68, p99Latency: 45, errorRate: 0.3 }
  const challengerMetrics = { precision: 0.79, recall: 0.74, p99Latency: 82, errorRate: 0.15 }

  function simulate() {
    setRunning(true); setDays(0); setPhase('running')
    let d = 0
    const interval = setInterval(() => {
      d++; setDays(d)
      if (d >= 14) { clearInterval(interval); setPhase('complete'); setRunning(false) }
    }, 120)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Shadow Mode Simulator</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>A challenger model runs in shadow alongside the champion — serving no real traffic, just logging predictions. After 14 days, compare offline metrics and decide on promotion.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {[{ label: 'Champion (v1)', metrics: championMetrics, color: 'var(--mint)' }, { label: 'Challenger (v2)', metrics: challengerMetrics, color: 'var(--prime)' }].map(m => (
          <div key={m.label} className="card" style={{ padding: '18px', border: `1px solid ${m.color}30` }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: m.color, marginBottom: '14px' }}>{m.label}</div>
            {Object.entries(m.metrics).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{k}</span>
                <span style={{ fontSize: '13px', color: 'var(--ink-hi)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{typeof v === 'number' && v < 2 ? v.toFixed(2) : v}{k === 'p99Latency' ? 'ms' : k === 'errorRate' ? '%' : ''}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {phase === 'design' && <button className="btn-primary" onClick={simulate} style={{ alignSelf: 'flex-start' }}>▶ Start 14-day shadow run</button>}
      {(phase === 'running' || phase === 'complete') && (
        <div className="card animate-fade-in" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-low)' }}>Shadow run progress</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '18px', color: 'var(--violet)' }}>Day {days} / 14</span>
          </div>
          <div style={{ height: '8px', background: 'var(--rim)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(days / 14) * 100}%`, background: 'linear-gradient(90deg,#6366f1,#22d3ee)', transition: 'width 0.1s', borderRadius: '4px' }} />
          </div>
        </div>
      )}
      {phase === 'complete' && (
        <div className="card animate-slide-up" style={{ padding: '20px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.25)' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: 'var(--ink-hi)', marginBottom: '12px' }}>📊 Shadow run complete — promote?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--mint)', margin: 0 }}>✓ Precision: +11pp</p>
            <p style={{ fontSize: '13px', color: 'var(--mint)', margin: 0 }}>✓ Recall: +9pp</p>
            <p style={{ fontSize: '13px', color: 'var(--gold)', margin: 0 }}>⚠ P99 latency: +37ms (82ms vs 45ms)</p>
            <p style={{ fontSize: '13px', color: 'var(--mint)', margin: 0 }}>✓ Error rate: lower (0.15% vs 0.3%)</p>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0 }}>
            Recommendation: <strong style={{ color: 'var(--ink-hi)' }}>Promote</strong> — quality gains outweigh latency increase. But gate on SLA: if P99 &gt; 100ms violates your SLA, investigate model quantization first.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Calibration Clinic ───────────────────────────────────────────────────────
const CALIBRATION_SCENARIOS = [
  {
    id: 'overconfident',
    title: 'Model outputs 0.95 but only 60% of those examples are positive',
    tier: 'Senior',
    context: [
      'Reliability diagram: predicted 0.95 bucket → actual positive rate 0.61',
      'Model: gradient boosted tree, trained on 500k samples',
      'ECE (Expected Calibration Error): 0.18',
      'Deployment: fraud scoring — probabilities fed into a decision engine',
    ],
    question: 'What is the primary problem and how should you fix it?',
    options: ['Model is underfitting — improve features', 'Model is overconfident — apply Platt scaling or isotonic regression', 'The threshold is set too high — lower to 0.5', 'ECE of 0.18 is acceptable for this domain'],
    answer: 1,
    diagnosis: 'Overconfident model — needs post-hoc calibration',
    explanation: 'ECE of 0.18 is severely miscalibrated. The 0.95 bucket having only 61% actual positives means your fraud engine is making decisions on inflated confidence. GBTs and neural networks are systematically overconfident. Post-hoc calibration corrects this without retraining.',
    fix: 'Use Platt scaling (logistic regression on held-out calibration set) for small calibration sets. For larger sets, isotonic regression is more flexible. Apply calibration on a held-out set separate from validation — never calibrate on the same set you evaluate on.',
  },
  {
    id: 'underconfident',
    title: 'All model outputs cluster between 0.42 and 0.58 — nothing extreme',
    tier: 'Analyst',
    context: [
      'Model: neural network classifier, output after sigmoid',
      'Probability histogram: 95% of outputs in [0.4, 0.6]',
      'Actual label distribution: 30% positive, 70% negative',
      'ECE: 0.04 — looks good?',
    ],
    question: 'What is happening and is ECE misleading here?',
    options: ['Model is well-calibrated — low ECE confirms this', 'Model is underconfident — temperature scaling needed (T > 1)', 'Model is underconfident — temperature scaling needed (T < 1)', 'Wrong architecture — replace sigmoid with softmax'],
    answer: 2,
    diagnosis: 'Underconfident model — temperature scaling with T < 1 sharpens predictions',
    explanation: 'Low ECE hides the problem here because the model is clustered near 0.5 where the calibration error per bucket is small. But a model that never outputs >0.7 is useless for ranking or thresholding. Temperature scaling divides logits by T before sigmoid. T < 1 sharpens (makes predictions more extreme), T > 1 softens.',
    fix: 'Apply temperature scaling: tune T on a held-out calibration set to minimize NLL. For underconfident models, T < 1 (e.g., 0.6–0.8). Evaluate with reliability diagram, not just ECE — ECE can look good while the model is useless.',
  },
  {
    id: 'platt_vs_isotonic',
    title: 'Choosing calibration method: 300-sample calibration set available',
    tier: 'Staff',
    context: [
      'Model: random forest (known to be poorly calibrated)',
      'Calibration set: 300 samples (20% holdout from 1500-sample dataset)',
      'Positive rate: 15%',
      'Requirement: calibrated probabilities for risk-scoring system',
    ],
    question: 'Which calibration method should you use?',
    options: ['Isotonic regression — more flexible, always better', 'Platt scaling — simpler, more appropriate for small calibration sets', 'Neither — retrain with probability calibration baked in', 'Histogram binning with 20 bins'],
    answer: 1,
    diagnosis: 'Platt scaling — isotonic regression overfits on small sets',
    explanation: 'Isotonic regression is non-parametric and can fit any monotone function — which sounds better, but it has high variance on small datasets. With 300 samples and 15% positive rate, you have ~45 positives. Isotonic regression will overfit. Platt scaling fits just 2 parameters (logistic regression), which is robust here.',
    fix: 'Rule of thumb: use Platt scaling when calibration set < ~1000 samples. Use isotonic regression above that. Always evaluate calibration quality with a reliability diagram and Brier score, not just ECE. sklearn: `CalibratedClassifierCV(method="sigmoid")` for Platt, `method="isotonic"` for isotonic.',
  },
  {
    id: 'calibration_drift',
    title: 'Model calibrated on val set, but miscalibrated 3 months after deploy',
    tier: 'Staff',
    context: [
      'Initial ECE (validation, October): 0.03',
      'Current ECE (production, January): 0.21',
      'Predictions: score distribution unchanged',
      'Actual label distribution: shifted from 12% to 22% positive rate',
    ],
    question: 'What caused calibration to drift and what is the fix?',
    options: ['Model weights changed — retrain the base model', 'Label distribution shifted — recalibrate on recent data', 'The calibration method expired — re-run Platt scaling on original data', 'Temperature parameter needs manual adjustment'],
    answer: 1,
    diagnosis: 'Label distribution shift broke calibration — recalibrate on recent data',
    explanation: 'Platt scaling and isotonic regression learn the mapping from model scores to probabilities given the calibration set\'s base rate. If the positive rate goes from 12% to 22%, the old calibration is wrong — it was fitted assuming a different prior. The model scores are fine; the calibration mapping is stale.',
    fix: 'Maintain a rolling calibration set of recent labeled data. Recalibrate monthly or after significant label distribution shifts. Monitor ECE and Brier score in production as separate metrics from model discrimination (AUC). Trigger recalibration when ECE > threshold.',
  },
  {
    id: 'ensemble_calibration',
    title: 'Averaging 5 models — are the averaged probabilities calibrated?',
    tier: 'Senior',
    context: [
      'Model: ensemble of 5 independently trained neural networks',
      'Each model individually calibrated (ECE ~0.03 per model)',
      'Ensemble strategy: average raw probabilities',
      'Team assumes: calibrated models → calibrated ensemble',
    ],
    question: 'Is this assumption correct?',
    options: ['Yes — averaging calibrated probabilities produces calibrated output', 'No — averaging calibrated probabilities does not guarantee calibrated ensemble', 'Only correct if models are identical architectures', 'Only if you average logits, not probabilities'],
    answer: 1,
    diagnosis: 'Averaging calibrated probabilities does NOT guarantee calibration',
    explanation: 'Each model maps scores to probabilities with a different calibration function. The average of those functions is not itself a calibration function. The ensemble needs to be calibrated as a unit on a held-out set — treat the ensemble as a new model and apply Platt/isotonic on its averaged outputs.',
    fix: 'After building the ensemble, fit a new calibration layer on held-out data using the ensemble\'s averaged outputs as input. Alternatively, average logits before sigmoid (not probabilities) — this tends to be better calibrated naturally because of the linearity of logit space.',
  },
  {
    id: 'brier_vs_ece',
    title: 'ECE is 0.01 but Brier score is 0.28 — conflicting signals',
    tier: 'Senior',
    context: [
      'Classification task: customer churn prediction',
      'ECE: 0.01 (excellent)',
      'Brier score: 0.28 (poor — random baseline is 0.21 for 30% positive rate)',
      'Reliability diagram: well-calibrated across all buckets',
    ],
    question: 'How do you reconcile these conflicting metrics?',
    options: ['ECE is wrong — recalculate with more bins', 'Model is calibrated but has poor discrimination — AUC is likely low', 'Brier score is inappropriate for imbalanced classes', 'Both metrics agree — the model is fine'],
    answer: 1,
    diagnosis: 'Good calibration, poor discrimination — these measure different things',
    explanation: 'ECE measures calibration: does 70% predicted probability correspond to ~70% actual positives? Brier score measures both calibration AND sharpness (how extreme the predictions are). A model that outputs 0.30 for everything is perfectly calibrated for a 30% base rate but useless — Brier score captures this, ECE does not. The model has learned the base rate but not how to discriminate.',
    fix: 'Always report AUC-ROC alongside calibration metrics. Low Brier score with good ECE means model needs better discriminative features or a more powerful architecture. Decompose Brier score into calibration + refinement (sharpness) terms.',
  },
]

function CalibrationClinic() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Calibration Clinic</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '560px' }}>
          A model that outputs 0.95 should be right 95% of the time. Miscalibrated probabilities corrupt downstream decisions. Diagnose and fix 6 calibration failure patterns.
        </p>
      </div>
      <AccordionMCQ scenarios={CALIBRATION_SCENARIOS} accentColor="var(--mint)" contextLabel="Telemetry" storageKey="modeleval_calibration" />
    </div>
  )
}

// ─── Threshold Tuner ──────────────────────────────────────────────────────────
const THRESHOLD_SCENARIOS = [
  {
    id: 'fraud_cost',
    title: 'Fraud detection: FN costs $500, FP costs $5 (manual review)',
    tier: 'Analyst',
    context: [
      'Model: fraud classifier, binary output',
      'False Negative (missed fraud): $500 average loss',
      'False Positive (unnecessary manual review): $5 cost',
      'Current threshold: 0.5',
      'Model outputs well-calibrated probabilities',
    ],
    question: 'Which threshold direction minimizes total cost?',
    options: ['Keep threshold at 0.5 — default is optimal', 'Raise threshold above 0.5 — reduce false positives', 'Lower threshold below 0.5 — reduce false negatives', 'Threshold doesn\'t matter if you use AUC'],
    answer: 2,
    diagnosis: 'Lower the threshold — asymmetric cost favors catching fraud at the cost of more reviews',
    explanation: 'Cost ratio is 100:1 (FN:FP). You should be willing to flag 100 legitimate transactions to prevent one fraud. Lower threshold = higher recall = more FPs but far fewer FNs. The 0.5 default assumes equal cost of both error types, which is almost never true.',
    fix: 'Compute expected cost at each threshold: Cost(t) = FN(t) × $500 + FP(t) × $5. Plot cost curve and find minimum. In practice, stakeholders should define cost ratio — the data scientist\'s job is to surface the tradeoff, not unilaterally pick a threshold.',
  },
  {
    id: 'medical_test',
    title: 'Cancer screening model — missing a positive is catastrophic',
    tier: 'Senior',
    context: [
      'Task: binary cancer screening from imaging',
      'Positive: likely malignant → biopsy ordered',
      'Negative: likely benign → no follow-up',
      'Cost of FN (missed cancer): patient harm, liability',
      'Cost of FP (unnecessary biopsy): anxiety, cost, minor procedure',
    ],
    question: 'What threshold strategy is appropriate here?',
    options: ['0.5 — balanced precision and recall', 'High threshold (e.g., 0.8) — only flag when very confident', 'Low threshold (e.g., 0.1–0.2) — maximize sensitivity even at expense of specificity', 'Optimize F1 score — balances both error types equally'],
    answer: 2,
    diagnosis: 'Very low threshold — sensitivity is paramount in high-stakes screening',
    explanation: 'In screening contexts, the threshold should be set based on clinical requirements: often sensitivity ≥ 0.95 or 0.99. This is a policy decision, not a data science one. Regulators and clinicians define acceptable false negative rates. Your job is to show the precision-recall curve and let clinicians pick the operating point.',
    fix: 'Plot the sensitivity-specificity curve. Surface the operating points where sensitivity = 0.95, 0.97, 0.99 and show the corresponding specificity. The final threshold is chosen jointly with clinical stakeholders. Document it in model card as a clinical parameter, not a model parameter.',
  },
  {
    id: 'churn_discount',
    title: 'Churn model: offer 10% discount to predicted churners',
    tier: 'Senior',
    context: [
      'Intervention: 10% discount coupon sent to predicted churners',
      'Revenue per customer: $50/month',
      'Churn rate: 8%',
      'Discount cost: $5 per targeted customer',
      'Discount effectiveness: 40% of true churners who receive it stay',
    ],
    question: 'What makes this threshold choice different from standard classification?',
    options: ['It\'s the same — optimize F1 as usual', 'Need to account for revenue uplift minus intervention cost, not just classification error', 'Minimize false positives at all costs to save on discount budget', 'Maximize recall — always better to send more discounts'],
    answer: 1,
    diagnosis: 'Uplift modeling — optimize net revenue impact, not classification metrics',
    explanation: 'At threshold t, you\'re targeting a set of customers. Each true churner targeted: +$50×0.4 saved - $5 discount = +$15. Each false positive targeted: -$5 (unnecessary discount). At low thresholds you target many false positives; high thresholds miss real churners. The optimal threshold balances these, not accuracy.',
    fix: 'Build an uplift curve: for each threshold, compute [true churners saved × $50 × 0.4] - [all targeted × $5]. Find the threshold that maximizes this. This is not standard ML threshold tuning — it requires modeling customer response, not just churn probability.',
  },
  {
    id: 'multiclass_threshold',
    title: 'Multi-class model: single threshold vs per-class thresholds',
    tier: 'Senior',
    context: [
      'Task: 5-class document routing (billing, tech, refund, complaint, other)',
      'Current: argmax over softmax output (implicit threshold 0.2)',
      'Problem: "complaint" class has high FP rate — routed incorrectly often',
      'Team proposes: lower threshold for complaint class specifically',
    ],
    question: 'Is per-class threshold tuning valid here?',
    options: ['No — multi-class models require a single threshold for consistency', 'Yes — per-class confidence thresholds can improve precision on specific classes', 'Only valid if you retrain with class weights first', 'Apply Platt scaling first, then single threshold'],
    answer: 1,
    diagnosis: 'Per-class thresholds are valid and often necessary in multi-class',
    explanation: 'Argmax is equivalent to using equal thresholds per class. But classes have different base rates and costs. A complaint misrouted to "billing" has higher cost than billing → other. Per-class thresholds let you require higher confidence before routing to high-stakes classes, with a fallback to "other" or human queue.',
    fix: 'For each class, tune threshold on validation set to hit target precision. Samples below all thresholds go to a "low confidence" queue. This is standard in production: treat multi-class output as 5 independent binary classifiers, each with its own business constraint.',
  },
  {
    id: 'moving_threshold',
    title: 'Fraud rate doubles on weekends — static threshold underperforms',
    tier: 'Staff',
    context: [
      'Weekday fraud rate: 2%, Weekend fraud rate: 4–5%',
      'Model: trained on mixed data, good AUC',
      'Static threshold: 0.3 (tuned on weekday data)',
      'Weekend: FPR doubles, review team overwhelmed',
    ],
    question: 'What is the correct approach to handle time-varying fraud rates?',
    options: ['Lower threshold on weekends manually', 'Dynamic threshold based on estimated base rate (Bayesian update)', 'Retrain separate models for weekdays and weekends', 'Accept the FPR increase — more fraud means more reviews'],
    answer: 1,
    diagnosis: 'Dynamic threshold via base-rate adjustment — Bayesian prior update',
    explanation: 'Model outputs P(fraud | features). But the operating threshold should account for P(fraud) base rate. When P(fraud) doubles, you should expect more fraud in the review queue and may want to adjust threshold to maintain constant FPR rather than constant recall. This is a form of decision theory, not model retraining.',
    fix: 'Compute expected precision at each threshold given current base rate using Bayes: P(fraud|score) = P(score|fraud)×P(fraud) / P(score). Store weekend vs weekday threshold profiles. Trigger threshold shifts based on observed rolling fraud rate. Alert when base rate shifts unexpectedly.',
  },
  {
    id: 'threshold_stability',
    title: 'Threshold optimal on validation is suboptimal on held-out test',
    tier: 'Staff',
    context: [
      'Threshold tuned on validation set: 0.43 (maximizes F1)',
      'Test set F1 at 0.43: 0.61',
      'Test set F1 at 0.50: 0.67',
      'Validation and test sets have same label distribution',
    ],
    question: 'Why did the validation-tuned threshold underperform on test?',
    options: ['Validation set too small — threshold overfit to validation noise', 'Should have used a different metric (precision vs recall)', 'Test set has distribution shift', 'F1 is not a good metric for threshold selection'],
    answer: 0,
    diagnosis: 'Threshold overfit to validation set noise',
    explanation: 'Threshold tuning is a form of model selection — it can overfit the validation set. A small or imbalanced validation set produces noisy F1 curves, and the "optimal" threshold is largely noise. The test performance at 0.50 being better shows the true optimal is near the default, and the 0.43 was fitting noise.',
    fix: 'Use cross-validation across multiple splits to find a stable threshold. Smooth the F1 curve before finding the max (e.g., apply moving average). Prefer threshold ranges over point estimates: "F1 is stable between 0.4 and 0.55 — use 0.5 as production default." Report threshold confidence intervals.',
  },
]

function ThresholdTuner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Threshold Tuner</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '560px' }}>
          The default threshold of 0.5 is almost always wrong. Business costs, asymmetric errors, and base rate shifts all demand deliberate threshold choices. 6 real-world cases.
        </p>
      </div>
      <AccordionMCQ scenarios={THRESHOLD_SCENARIOS} accentColor="var(--gold)" contextLabel="Setup" storageKey="modeleval_threshold" />
    </div>
  )
}

// ─── Ranking Metrics ──────────────────────────────────────────────────────────
const RANKING_SCENARIOS = [
  {
    id: 'ndcg_vs_map',
    title: 'E-commerce search: products vary in relevance (highly relevant, relevant, irrelevant)',
    tier: 'Analyst',
    context: [
      'Task: product search ranking',
      'Relevance labels: 3 levels (0 = irrelevant, 1 = relevant, 2 = highly relevant)',
      'System returns 10 results per query',
      'Team debating: MAP vs NDCG',
    ],
    question: 'Which metric is more appropriate and why?',
    options: ['MAP — it handles position better', 'NDCG — it supports graded relevance and position discounting', 'MRR — only the first relevant result matters in e-commerce', 'Precision@10 — simpler and equally informative'],
    answer: 1,
    diagnosis: 'NDCG — graded relevance + logarithmic position discount',
    explanation: 'MAP assumes binary relevance (relevant or not). With 3-level labels, MAP collapses "highly relevant" and "relevant" together, losing signal. NDCG uses graded gains (DCG = Σ (2^rel - 1) / log2(rank+1)) and normalizes by ideal ranking (IDCG). The log discount captures that position 1 matters more than position 3, which matters more than position 7.',
    fix: 'Use NDCG@K (typically K=5 or K=10) for graded relevance systems. Compute offline with human-labeled or click-based relevance. Complement with online A/B tests measuring CTR and purchase rate — NDCG and business outcomes don\'t always correlate.',
  },
  {
    id: 'mrr',
    title: 'Autocomplete: user only cares about the first correct suggestion',
    tier: 'Analyst',
    context: [
      'Task: search query autocomplete',
      'User behavior: clicks first acceptable suggestion or types more',
      'Evaluation data: queries with one "correct" completion per query',
      'Current metric: NDCG@5',
    ],
    question: 'Is NDCG@5 the right metric here?',
    options: ['Yes — NDCG handles position correctly', 'No — MRR is more appropriate when there\'s one correct answer per query', 'No — Precision@1 is better since only the top result matters', 'Yes — always use NDCG for ranking tasks'],
    answer: 1,
    diagnosis: 'MRR — Mean Reciprocal Rank is designed for single-correct-answer scenarios',
    explanation: 'MRR = mean of 1/rank_of_first_correct_answer. If the correct suggestion is at position 1: 1.0. Position 2: 0.5. Position 3: 0.33. This is exactly what autocomplete needs: did the right suggestion appear early? NDCG is designed for multiple relevant items with graded labels, which doesn\'t fit here.',
    fix: 'Use MRR when: one correct answer per query, task is to find it quickly. Use NDCG when: multiple relevant items, graded relevance. Use MAP when: binary relevance, all relevant items matter equally. Use Precision@K when: top-K precision matters, regardless of deeper ranks.',
  },
  {
    id: 'precision_at_k',
    title: 'News feed: 10-slot carousel, all positions equally visible',
    tier: 'Analyst',
    context: [
      'Task: news article recommendation',
      'UI: horizontal carousel, 10 slots, all equally prominent',
      'Goal: maximize number of relevant articles user sees in carousel',
      'User behavior: scans all 10 positions before clicking',
    ],
    question: 'Which ranking metric is most aligned with this UI behavior?',
    options: ['NDCG@10 — still best because it discounts later positions', 'MRR — user cares about first relevant item', 'Precision@10 — all positions equally weighted', 'MAP — evaluates full precision-recall curve'],
    answer: 2,
    diagnosis: 'Precision@10 — flat position weighting matches equal-visibility carousel',
    explanation: 'NDCG applies a logarithmic position discount: rank 1 weighted ~2x more than rank 3. This is appropriate for sequential lists (search results) where users scan top-to-bottom. A horizontal carousel with equal visual prominence doesn\'t have this position bias. Precision@K simply measures: what fraction of the K shown items are relevant?',
    fix: 'Match your metric to your UI. If A/B testing confirms position bias even in the carousel (users click position 1 more), switch to NDCG. If carousel has a "top pick" slot with higher CTR, use a weighted Precision@K with custom position weights derived from click logs.',
  },
  {
    id: 'ndcg_cutoff',
    title: 'Video recommendation: engagement drops sharply after position 3',
    tier: 'Senior',
    context: [
      'Platform: short-form video app',
      'Analytics: 70% of video plays come from positions 1–3',
      'Current metric: NDCG@10',
      'Team argues NDCG@10 is too forgiving of bad top-3 results',
    ],
    question: 'Should you switch from NDCG@10 to NDCG@3?',
    options: ['No — NDCG@10 is the industry standard, don\'t change it', 'Yes — NDCG@3 focuses optimization where it matters most (top 3 positions)', 'Use both — report NDCG@3 and NDCG@10 separately', 'Switch to MRR@3 instead'],
    answer: 2,
    diagnosis: 'Report both NDCG@3 and NDCG@10 — cutoff choice depends on business context',
    explanation: 'NDCG@K controls the "evaluation horizon." If only positions 1–3 drive engagement, NDCG@10 dilutes signal with less important positions. But using only NDCG@3 can miss failures deeper in the list. Best practice: report primary metric aligned with business (NDCG@3) and diagnostic metric (NDCG@10). Track both in your model card.',
    fix: 'Set primary offline metric = NDCG@3 (matches user behavior). Secondary = NDCG@10 (catch regressions in deeper positions). Validate cutoff choice with click log analysis: what is the empirical position CTR decay curve? Set K where cumulative CTR reaches 85–90%.',
  },
  {
    id: 'map_binary',
    title: 'Document retrieval: legal case search with binary relevance',
    tier: 'Senior',
    context: [
      'Task: legal precedent retrieval — retrieve all relevant cases for a query',
      'Relevance labels: binary (relevant / not relevant)',
      'All relevant documents matter — attorneys need complete coverage',
      'Query set: 500 queries, each with 3–15 relevant documents in corpus',
    ],
    question: 'Which metric best captures this requirement?',
    options: ['NDCG@10 — best for ranked retrieval', 'MAP (Mean Average Precision) — evaluates all relevant documents across full ranked list', 'Precision@5 — top 5 is what attorneys review', 'Recall@100 — ensure high coverage'],
    answer: 1,
    diagnosis: 'MAP — evaluates complete recall and ordering across all relevant documents',
    explanation: 'MAP = mean over queries of Average Precision. Average Precision (AP) = average precision at each rank where a relevant document appears, across all relevant documents. This rewards systems that rank ALL relevant documents highly, not just the first few. NDCG@10 only looks at top 10. Precision@5 misses recall. MAP evaluates both precision and recall jointly.',
    fix: 'MAP is the right metric when all relevant items matter (legal retrieval, academic search, inventory lookup). For systems where top-K is the UX (web search, recommendations), NDCG@K is more appropriate. Both assume a ranked list; for unranked retrieval use F1 at fixed recall.',
  },
  {
    id: 'diversity',
    title: 'Top-10 NDCG is high, but all 10 results are about the same topic',
    tier: 'Staff',
    context: [
      'News recommendation, NDCG@10: 0.87 (excellent)',
      'User survey: "I keep seeing the same story from different sources"',
      'Manual inspection: 8 of 10 results are about the same breaking news event',
      'Engagement: high initial CTR, low return rate (users feel the feed is stale)',
    ],
    question: 'What does this reveal about NDCG as the sole optimization target?',
    options: ['NDCG is wrong — switch to MAP', 'NDCG optimizes relevance but not diversity — need diversity-aware metrics', 'Add more data to fix relevance distribution', 'The model is correct — relevance and diversity are the same thing'],
    answer: 1,
    diagnosis: 'NDCG captures relevance, not diversity — Intra-List Diversity needed',
    explanation: 'NDCG measures whether the ranked items are relevant to the query, but doesn\'t penalize redundancy. A list of 10 highly relevant but identical articles scores perfectly. In practice, novelty and diversity are separate dimensions. Users who see the same story 8 times learn nothing new — engagement drops even if initial CTR is high.',
    fix: 'Add diversity metrics: Intra-List Diversity (ILD) = average pairwise distance between recommended items. Or use MMR (Maximal Marginal Relevance) to balance relevance and novelty in retrieval. In production: re-rank top-K results with a diversity penalty after the initial retrieval step. Track both NDCG and return rate.',
  },
]

function RankingMetrics() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Ranking Metrics</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '560px' }}>
          NDCG, MAP, MRR, Precision@K — each captures a different aspect of ranking quality. Using the wrong one silently optimizes the wrong thing. 6 scenarios, one right answer each.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
        {[['NDCG', 'Graded relevance + position discount', 'var(--violet)'], ['MAP', 'Binary relevance, all positions', 'var(--mint)'], ['MRR', 'Single correct answer', 'var(--sky)'], ['P@K', 'Top-K precision', 'var(--gold)']].map(([name, desc, color]) => (
          <div key={name} style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${color}30`, background: `${color}08` }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color }}>{name}</span>
            <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', marginLeft: '8px' }}>{desc}</span>
          </div>
        ))}
      </div>
      <AccordionMCQ scenarios={RANKING_SCENARIOS} accentColor="var(--violet)" contextLabel="System" storageKey="modeleval_ranking" />
    </div>
  )
}

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'metric',       label: 'Metric Selector',    icon: '📉', component: MetricSelector },
  { id: 'calibration', label: 'Calibration Clinic',  icon: '📐', component: CalibrationClinic },
  { id: 'threshold',   label: 'Threshold Tuner',     icon: '🎚', component: ThresholdTuner },
  { id: 'ranking',     label: 'Ranking Metrics',     icon: '📊', component: RankingMetrics },
  { id: 'shadow',      label: 'Shadow Mode',         icon: '👥', component: ShadowModeSim },
]

export default function ModelEvalTab({ onNavigate }) {
  const [active, setActive] = useState('metric')
  const [, forceUpdate] = useState(0)
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? MetricSelector

  useEffect(() => {
    const goto = localStorage.getItem('msl_goto_module')
    if (goto) {
      const found = MODULES.find(m => m.id === goto)
      if (found) {
        setActive(goto)
        localStorage.removeItem('msl_goto_module')
      }
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>Evaluation</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '580px' }}>
          Offline metrics lie. Pick the wrong metric and you'll ship a model that looks great on paper while failing in production.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button onClick={() => setActive(m.id)} className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`} style={{ paddingRight: '8px' }}>{m.label}</button>
            <button onClick={(e) => { e.stopPropagation(); toggleBookmark('modeleval', m.id, m.label); forceUpdate(n => n+1) }}
              title={isBookmarked('modeleval', m.id) ? 'Remove bookmark' : 'Bookmark module'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '12px', color: isBookmarked('modeleval', m.id) ? 'var(--prime)' : 'var(--ink-ghost)', lineHeight: 1 }}>
              {isBookmarked('modeleval', m.id) ? '★' : '☆'}
            </button>
          </div>
        ))}
      </div>

      <ActiveModule />
      {onNavigate && (
        <div style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            📖 Go deeper → Read <strong style={{ color: 'var(--sky)' }}>AUC Is Not Your Friend: A Guide to ML Metric Selection</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: '6px', color: 'var(--sky)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}
    </div>
  )
}
