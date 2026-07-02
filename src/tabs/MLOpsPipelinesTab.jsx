import { useState, useMemo, useEffect } from 'react'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'
import FidelityBadge from '../components/FidelityBadge.jsx'

// ─── Shared style helpers ─────────────────────────────────────────────────────
const mono = { fontFamily: 'var(--font-mono)' }
const grotesk = { fontFamily: 'var(--font-sans)' }

const pill = (color) => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 600,
  background: `${color}20`,
  color: color,
  ...mono,
})

// ─── Shared AccordionMCQ ─────────────────────────────────────────────────────
function AccordionMCQ({ scenarios, accentColor = 'var(--prime)', storageKey = null }) {
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

  function toggle(i) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, open: !it.open } : it))
  }
  function pick(i, opt) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, picked: opt, revealed: true } : it))
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

  const attempted = items.filter(it => it.revealed).length
  const correct   = items.filter((it, i) => it.revealed && it.picked === scenarios[i].answer).length
  const pct       = attempted === 0 ? 0 : Math.round((correct / attempted) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

      {/* Score strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', background: 'linear-gradient(160deg, var(--card-tint) 0%, var(--depth) 40%)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 4px 14px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.11)' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{attempted}/{scenarios.length} attempted</span>
        {attempted > 0 && <span style={{ fontSize: '11px', color: pct >= 70 ? 'var(--mint)' : 'var(--ember)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{correct} correct ({pct}%)</span>}
        <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
          <div style={{ width: `${(attempted / scenarios.length) * 100}%`, height: '100%', background: accentColor, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
      </div>

      {scenarios.map((sc, i) => { if (diffFilter !== 'all' && getDiff(i, scenarios.length) !== diffFilter) return null;
        const it = items[i]
        const isCorrect = it.revealed && it.picked === sc.answer
        return (
          <div key={sc.id} style={{ border: `1px solid ${it.open ? accentColor + '55' : 'rgba(255,255,255,0.15)'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
            {/* Header row */}
            <button onClick={() => toggle(i)} style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: it.open ? accentColor + '08' : 'var(--depth)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.15s' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '20px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', textAlign: 'left' }}>{sc.title}</span>
              {it.revealed && <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>{isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--ink-ghost)', transition: 'transform 0.2s', transform: it.open ? 'rotate(90deg)' : 'rotate(0deg)' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 2l4 3-4 3"/></svg></span>
            </button>

            {/* Body */}
            {it.open && (
              <div className="accordion-enter" style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Context */}
                <div style={{ padding: '12px 16px', background: 'var(--card-tint)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.30)', marginTop: '4px' }}>
                  {Array.isArray(sc.context) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {sc.context.map((line, li) => <p key={li} style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{line}</p>)}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{sc.context}</p>
                  )}
                </div>

                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', margin: 0 }}>{sc.question}</p>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {sc.options.map((opt, oi) => {
                    const isPicked = it.picked === oi
                    const isAns    = sc.answer === oi
                    let bg = 'var(--depth)', border = 'var(--rim)', color = 'var(--ink-mid)'
                    if (it.revealed) {
                      if (isAns)          { bg = 'rgba(52,211,153,0.15)'; border = 'rgba(52,211,153,0.35)'; color = 'var(--ink-hi)' }
                      else if (isPicked)  { bg = 'rgba(239,68,68,0.15)';  border = 'rgba(239,68,68,0.35)'; color = 'var(--ink-mid)' }
                    } else if (isPicked)  { bg = accentColor + '10'; border = accentColor + '50'; color = 'var(--ink-hi)' }
                    return (
                      <button key={oi} disabled={it.revealed} onClick={() => pick(i, oi)}
                        style={{ textAlign: 'left', padding: 'var(--card-pad-primary)', borderRadius: '8px', background: bg, border: `1px solid ${border}`, cursor: it.revealed ? 'default' : 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start', transition: 'all 0.12s' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '14px', paddingTop: '2px' }}>{['A','B','C','D'][oi]}</span>
                        <span style={{ fontSize: '13px', color, lineHeight: 1.5 }}>{opt}</span>
                        {it.revealed && isAns && <span style={{ marginLeft: 'auto', color: 'var(--mint)', fontSize: '12px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
                      </button>
                    )
                  })}
                </div>

                {/* Explanation */}
                {it.revealed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="msl-reveal-panel" style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>Diagnosis</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.diagnosis}</p>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>Production fix</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.fix}</p>
                    </div>
                    {sc.awsCallout && (
                      <div className="msl-cloud-map">
                        <strong>AWS in production →</strong>{' '}
                        <span className="msl-cloud-chip">{sc.awsCallout.service}</span>{' '}
                        {sc.awsCallout.desc}
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

// ─── Module 1: CI/CD Gate Design ─────────────────────────────────────────────
const GATES = [
  {
    id: 'unit',
    name: 'Unit tests on feature pipeline',
    desc: 'Does each feature compute correctly on known inputs',
    expertInclude: true,
    expertSeverity: 'block',
    reason: 'Schema mismatch or feature bugs = guaranteed production failure.',
  },
  {
    id: 'schema',
    name: 'Schema validation',
    desc: 'Does the model input schema match production serving schema',
    expertInclude: true,
    expertSeverity: 'block',
    reason: 'Schema mismatch = guaranteed production failure. Must block.',
  },
  {
    id: 'metric',
    name: 'Offline metric threshold',
    desc: 'AUC > 0.82 on held-out test set',
    expertInclude: true,
    expertSeverity: 'block',
    reason: "Metric regression = you're shipping a worse model. Block.",
  },
  {
    id: 'calibration',
    name: 'Calibration check',
    desc: 'ECE < 0.05 on held-out test set',
    expertInclude: true,
    expertSeverity: 'warn',
    reason: 'Important but rarely blocks a deploy on its own. Warn and document.',
  },
  {
    id: 'perf',
    name: 'Performance regression test',
    desc: 'p99 latency < 60ms on benchmark dataset',
    expertInclude: true,
    expertSeverity: 'block',
    reason: 'Latency regression = SLA breach in production. Block.',
  },
  {
    id: 'freshness',
    name: 'Training data freshness',
    desc: 'Training data from last 7 days, not stale',
    expertInclude: true,
    expertSeverity: 'warn',
    reason: 'Stale training data is worth flagging but sometimes acceptable. Warn.',
  },
  {
    id: 'drift',
    name: 'Feature drift detection',
    desc: 'PSI < 0.2 on key features vs last month',
    expertInclude: true,
    expertSeverity: 'warn',
    reason: 'Drift is informational context for reviewers. Warn, don\'t block.',
  },
  {
    id: 'shadow',
    name: 'Shadow comparison',
    desc: 'Challenger win rate > 50% on last 30 days shadow data',
    expertInclude: true,
    expertSeverity: 'block',
    reason: 'If shadow has been running, this is your strongest signal. Block if challenger loses.',
  },
]

export function CiCdGates() {
  const [config, setConfig] = useState(() =>
    Object.fromEntries(GATES.map(g => [g.id, { include: true, severity: 'block' }]))
  )
  const [revealed, setRevealed] = useState(false)

  function toggleInclude(id) {
    setConfig(c => ({ ...c, [id]: { ...c[id], include: !c[id].include } }))
    setRevealed(false)
  }

  function toggleSeverity(id) {
    setConfig(c => ({ ...c, [id]: { ...c[id], severity: c[id].severity === 'block' ? 'warn' : 'block' } }))
    setRevealed(false)
  }

  const matches = useMemo(() => {
    return GATES.filter(g => {
      const u = config[g.id]
      return u.include === g.expertInclude && u.severity === g.expertSeverity
    }).length
  }, [config])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ ...grotesk, fontSize: '18px', fontWeight: 800, color: 'var(--prime)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          CI/CD Gate Design
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Configure a CI/CD pipeline for an ML model deploy. Toggle each gate: include or exclude, and set severity (block or warn). Then compare to expert recommendation.
        </p>
      </div>

      {/* Gates list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {GATES.map(g => {
          const u = config[g.id]
          const matchExpert = revealed && u.include === g.expertInclude && u.severity === g.expertSeverity
          const mismatch = revealed && !(u.include === g.expertInclude && u.severity === g.expertSeverity)
          return (
            <div key={g.id} className="card" style={{
              padding: '14px 16px',
              border: matchExpert ? '1px solid rgba(34,197,94,0.3)' : mismatch ? '1px solid rgba(244,63,94,0.3)' : '1px solid var(--rim)',
              background: matchExpert ? 'rgba(34,197,94,0.10)' : mismatch ? 'rgba(244,63,94,0.10)' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...grotesk, fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '2px' }}>
                    {g.name}
                  </div>
                  <div style={{ ...mono, fontSize: '11px', color: 'var(--ink-low)' }}>{g.desc}</div>
                  {revealed && (
                    <div style={{ ...mono, fontSize: '11px', color: mismatch ? 'var(--rose)' : 'var(--mint)', marginTop: '6px', lineHeight: 1.5 }}>
                      Expert: {g.expertInclude ? (g.expertSeverity === 'block' ? 'Include — block' : 'Include — warn') : '— Exclude'} — {g.reason}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => toggleInclude(g.id)}
                    style={{
                      ...mono, fontSize: '11px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
                      border: `1.5px solid ${u.include ? 'var(--mint)' : 'var(--rim)'}`,
                      background: u.include ? 'rgba(34,197,94,0.1)' : 'transparent',
                      color: u.include ? 'var(--mint)' : 'var(--ink-low)',
                    }}>
                    {u.include ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg> Include' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Exclude'}
                  </button>
                  {u.include && (
                    <button onClick={() => toggleSeverity(g.id)}
                      style={{
                        ...mono, fontSize: '11px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
                        border: `1.5px solid ${u.severity === 'block' ? 'var(--rose)' : 'var(--gold)'}`,
                        background: u.severity === 'block' ? 'rgba(244,63,94,0.1)' : 'rgba(240,165,0,0.1)',
                        color: u.severity === 'block' ? 'var(--rose)' : 'var(--gold)',
                      }}>
                      {u.severity === 'block' ? 'Block' : 'Warn'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!revealed ? (
        <button className="btn-primary" onClick={() => setRevealed(true)} style={{ alignSelf: 'flex-start' }}>
          Compare to expert recommendation
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card animate-slide-up" style={{ padding: '18px', background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.2)' }}>
            <div style={{ ...grotesk, fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '10px' }}>
              {matches}/{GATES.length} gates matched expert config
            </div>
            <div style={{ ...grotesk, fontSize: '14px', fontWeight: 700, color: 'var(--prime)', marginBottom: '8px' }}>
              Key insight
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
              ML CI/CD differs from software CI/CD: you can't unit test model quality exhaustively.{' '}
              <strong style={{ color: 'var(--ink-hi)' }}>Shadow mode is your integration test. Canary ramp is your production smoke test.</strong>{' '}
              Schema mismatch and metric regression are the only two things that should reliably block a ship.
              Everything else is signal — worth knowing, rarely worth blocking.
            </p>
          </div>
          <div className="msl-cloud-map">
            <strong>AWS in production →</strong>{' '}
            <span className="msl-cloud-chip">SageMaker Projects</span>{' '}
            provides MLOps project templates that wire these CI/CD gates — schema validation, offline metrics, and shadow comparison — into a CodePipeline workflow with automatic approval steps.
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Module 2: Infrastructure Decision ───────────────────────────────────────
const INFRA_OPTIONS = [
  {
    id: 'rest_single',
    name: 'REST API + single instance',
    tech: 'FastAPI / Flask',
    good: (r, s, m, t) => s === 'low' && t === 'early' && m === 'small',
    pros: 'Fastest to ship. Zero infra overhead.',
    cons: 'No scaling. Single point of failure.',
    whenBreaks: 'Breaks at >1k RPM or if instance goes down.',
  },
  {
    id: 'rest_k8s',
    name: 'Containerized REST + horizontal scaling',
    tech: 'Docker + k8s',
    good: (r, s, m, t) => (s === 'mid' || s === 'high') && m !== 'large' && t !== 'early',
    pros: 'Scalable, standard, battle-tested.',
    cons: 'k8s complexity. Needs platform team.',
    whenBreaks: 'Breaks on large models (memory limits) or teams without k8s experience.',
  },
  {
    id: 'triton',
    name: 'Triton Inference Server',
    tech: 'NVIDIA Triton',
    good: (r, s, m, t) => m === 'medium' && s === 'high' && r === 'realtime',
    pros: 'GPU-optimized. Dynamic batching. Multi-model.',
    cons: 'Ops overhead. Requires ML platform team.',
    whenBreaks: 'Overkill for small models. Complex to debug.',
  },
  {
    id: 'ray',
    name: 'Ray Serve / BentoML',
    tech: 'Ray Serve / BentoML',
    good: (r, s, m, t) => m === 'medium' && t === 'mid' && r !== 'batch',
    pros: 'Python-native. Easy batching. Complex pipelines.',
    cons: 'Ray cluster management. Less mature than k8s.',
    whenBreaks: 'Ray cluster instability at very high scale.',
  },
  {
    id: 'batch',
    name: 'Batch inference',
    tech: 'Spark / Databricks',
    good: (r, s, m, t) => r === 'batch',
    pros: 'Handles massive scale. Scores don\'t need freshness.',
    cons: 'No real-time. Scores can go stale.',
    whenBreaks: 'Useless if predictions need to be fresh at request time.',
  },
  {
    id: 'serverless',
    name: 'Serverless',
    tech: 'Lambda + SageMaker',
    good: (r, s, m, t) => t === 'early' && s !== 'high' && m === 'small',
    pros: 'Zero infra management. Auto-scaling.',
    cons: 'Cold starts. Max execution time limits.',
    whenBreaks: 'Cold start latency unacceptable for real-time SLAs. Large models exceed memory limits.',
  },
  {
    id: 'vllm',
    name: 'vLLM / TGI',
    tech: 'vLLM / Text Generation Inference',
    good: (r, s, m, t) => m === 'large',
    pros: 'Continuous batching. KV cache management. Purpose-built for LLMs.',
    cons: 'GPU-only. Complex to deploy.',
    whenBreaks: 'Not suitable for non-LLM models.',
  },
]

const INFRA_PARAMS = {
  request: [
    { id: 'realtime',  label: 'Real-time', sub: '<100ms SLA' },
    { id: 'nearrt',    label: 'Near-real-time', sub: '100ms–1s' },
    { id: 'batch',     label: 'Batch', sub: 'minutes/hours' },
    { id: 'streaming', label: 'Streaming', sub: 'continuous' },
  ],
  scale: [
    { id: 'low',  label: '<1k RPM' },
    { id: 'mid',  label: '1k–100k RPM' },
    { id: 'high', label: '>100k RPM' },
  ],
  model: [
    { id: 'small',  label: 'Small', sub: '<100MB' },
    { id: 'medium', label: 'Medium', sub: '100MB–2GB' },
    { id: 'large',  label: 'Large', sub: '>2GB / LLMs' },
  ],
  team: [
    { id: 'early', label: 'Early stage', sub: 'no k8s' },
    { id: 'mid',   label: 'Mid-stage', sub: 'k8s + basic CI' },
    { id: 'mature', label: 'Mature', sub: 'full platform' },
  ],
}

export function InfraDecision() {
  const [params, setParams] = useState({ request: 'realtime', scale: 'mid', model: 'medium', team: 'mid' })

  const ranked = useMemo(() => {
    return INFRA_OPTIONS.map(opt => ({
      ...opt,
      score: opt.good(params.request, params.scale, params.model, params.team) ? 2 : 0,
    })).sort((a, b) => b.score - a.score)
  }, [params])

  const top = ranked[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ ...grotesk, fontSize: '18px', fontWeight: 800, color: 'var(--prime)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Infrastructure Decision
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Set four constraints to get a serving infrastructure recommendation with tradeoffs.
        </p>
      </div>

      {/* Parameter selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
        {[
          { key: 'request', label: 'Request pattern', options: INFRA_PARAMS.request },
          { key: 'scale',   label: 'Scale',           options: INFRA_PARAMS.scale },
          { key: 'model',   label: 'Model size',      options: INFRA_PARAMS.model },
          { key: 'team',    label: 'Team infra maturity', options: INFRA_PARAMS.team },
        ].map(({ key, label, options }) => (
          <div key={key} className="card" style={{ padding: '14px' }}>
            <div style={{ ...mono, fontSize: '11px', color: 'var(--prime)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {options.map(opt => (
                <button key={opt.id} onClick={() => setParams(p => ({ ...p, [key]: opt.id }))}
                  style={{
                    border: `1.5px solid ${params[key] === opt.id ? 'var(--prime)' : 'var(--rim)'}`,
                    borderRadius: '7px', padding: '7px 10px', cursor: 'pointer', textAlign: 'left',
                    background: params[key] === opt.id ? 'rgba(240,165,0,0.15)' : 'transparent',
                    transition: 'all 0.12s',
                  }}>
                  <div style={{ ...grotesk, fontSize: '12px', fontWeight: 600, color: params[key] === opt.id ? 'var(--prime)' : 'var(--ink-hi)' }}>
                    {opt.label}
                  </div>
                  {opt.sub && (
                    <div style={{ ...mono, fontSize: '10px', color: 'var(--ink-low)', marginTop: '1px' }}>{opt.sub}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Top recommendation */}
      <div className="card animate-slide-up" style={{ padding: '20px', background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.25)' }}>
        <div style={{ ...mono, fontSize: '11px', color: 'var(--prime)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Recommended
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div style={{ ...grotesk, fontSize: '20px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em' }}>
            {top.name}
          </div>
          <span style={{ ...pill('var(--prime)'), fontSize: '11px' }}>{top.tech}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
          <div>
            <div style={{ ...mono, fontSize: '11px', color: 'var(--prime)', marginBottom: '4px' }}>Pros</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{top.pros}</p>
          </div>
          <div>
            <div style={{ ...mono, fontSize: '11px', color: 'var(--ink-low)', marginBottom: '4px' }}>Cons</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{top.cons}</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '10px' }}>
          <div style={{ ...mono, fontSize: '11px', color: 'var(--ink-low)', marginBottom: '4px' }}>Where it breaks</div>
          <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{top.whenBreaks}</p>
        </div>
      </div>

      {/* Other options */}
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '10px' }}>
          Other options
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ranked.slice(1).map(opt => (
            <div key={opt.id} className="card" style={{ padding: '12px 14px', opacity: 0.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ ...grotesk, fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)' }}>{opt.name}</span>
                <span style={{ ...pill('var(--ink-low)'), fontSize: '10px' }}>{opt.tech}</span>
              </div>
              <p style={{ ...mono, fontSize: '11px', color: 'var(--ink-low)', margin: '4px 0 0', lineHeight: 1.5 }}>
                {opt.pros} — Breaks: {opt.whenBreaks}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Module 3: Model Registry Patterns ───────────────────────────────────────
const REGISTRY_OPTIONS = [
  { id: 'stage',    label: 'Register as staging',     color: 'var(--prime)' },
  { id: 'promote',  label: 'Promote to production',   color: 'var(--prime)' },
  { id: 'rollback', label: 'Rollback to previous',    color: 'var(--prime)' },
  { id: 'archive',  label: 'Archive',                 color: 'var(--ink-low)' },
  { id: 'flag',     label: 'Flag for review',         color: 'var(--ink-low)' },
  { id: 'delete',   label: 'Delete',                  color: 'var(--ink-low)' },
]

const REGISTRY_SCENARIOS = [
  {
    id: 1,
    title: 'All gates passed, canary metrics nominal',
    body: 'Challenger model passed all offline evals and 2-week shadow. Canary at 5% for 3 days shows metrics matching champion.',
    correct: 'promote',
    reasoning: 'All gates passed. Canary data confirms offline eval held up. This is the normal promotion path.',
    awsCallout: { service: 'SageMaker Model Registry', desc: 'transition model version status from Staging → Production via a SageMaker Pipelines approval step — the registry records who approved, when, and which eval metrics passed.' },
  },
  {
    id: 2,
    title: 'Stale staging model, 6 months old, never deployed',
    body: "Model trained 6 months ago is still registered as 'staging'. It was never deployed — a better version was trained instead.",
    correct: 'archive',
    reasoning: "Don't delete (you might want the weights for comparison or rollback reference). Archive indicates 'valid but superseded.' Keeps the registry clean without losing history.",
    awsCallout: { service: 'SageMaker Model Registry', desc: 'supports Archived status natively — pair with an S3 lifecycle policy to move the artifact to Glacier after 90 days if storage cost matters.' },
  },
  {
    id: 3,
    title: 'Data leakage found in training set — model is live',
    body: "Production model's training data was found to contain test set labels (data leakage). Model is currently serving live traffic.",
    correct: 'rollback',
    reasoning: 'Leakage = model results are invalid. Roll back immediately, then audit: how long was the leaky model live? What decisions did it influence? Flag for incident review.',
    awsCallout: { service: 'SageMaker Pipelines', desc: 'maintains a full lineage graph from raw S3 training data through to deployed endpoint — use the lineage API to pinpoint when the leaky data first entered training and which model versions are affected.' },
  },
  {
    id: 4,
    title: 'Schema mismatch caught in CI — feature renamed',
    body: "New model version failed schema validation in CI — the feature 'user_country' was renamed to 'country_code' in the feature pipeline.",
    correct: 'stage',
    reasoning: "Don't promote. The schema mismatch would cause production errors. Fix the schema alignment, re-run CI, then promote if it passes.",
    awsCallout: { service: 'SageMaker Feature Store', desc: 'feature group schema is versioned and immutable — a rename requires creating a new feature group, making the breaking change explicit and blocking accidental promotion through CI.' },
  },
  {
    id: 5,
    title: '2-year-old model consuming 40GB in registry',
    body: 'Model version from 2 years ago is taking up 40GB in the registry. It has been superseded by 12 newer versions.',
    correct: 'archive',
    reasoning: 'If retention policy says keep 6 months, delete it. If no formal policy, archive. Never delete a model that was in production without confirming audit requirements are met.',
    awsCallout: { service: 'SageMaker Model Registry', desc: 'combined with S3 Intelligent-Tiering, archived model artifacts automatically shift to lower-cost storage tiers — set a lifecycle rule to expire artifacts beyond your compliance retention window.' },
  },
  {
    id: 6,
    title: 'Better engagement, worse fairness metric',
    body: 'A/B test shows challenger is better on engagement but worse on a fairness metric (higher false positive rate on minority subgroup).',
    correct: 'flag',
    reasoning: "This is not a pure technical decision — it requires product/legal/policy review. Don't promote, don't rollback the canary, but don't just reject either. Escalate with the data.",
    awsCallout: { service: 'SageMaker Clarify', desc: 'generates a bias report per subgroup for both pre-training data and post-training predictions — attach the Clarify report as a registry artifact so the product/legal review has structured evidence to evaluate.' },
  },
]

export function RegistryPatterns() {
  const [picks, setPicks] = useState({})
  const [revealed, setRevealed] = useState({})
  const [active, setActive] = useState(0)

  const scenario = REGISTRY_SCENARIOS[active]
  const pick = picks[scenario.id]
  const isRevealed = !!revealed[scenario.id]
  const answered = Object.keys(revealed).length
  const score = REGISTRY_SCENARIOS.filter(s => picks[s.id] === s.correct).length

  function choose(optId) {
    if (isRevealed) return
    setPicks(p => ({ ...p, [scenario.id]: optId }))
    setRevealed(r => ({ ...r, [scenario.id]: true }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ ...grotesk, fontSize: '18px', fontWeight: 800, color: 'var(--prime)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Model Registry Patterns
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Six scenarios about model versioning, staging, and promotion. Pick the right registry action.
        </p>
      </div>

      {/* Scenario nav */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {REGISTRY_SCENARIOS.map((s, i) => {
          const done = !!revealed[s.id]
          const correct = picks[s.id] === s.correct
          return (
            <button key={s.id} onClick={() => setActive(i)}
              style={{
                ...mono, fontSize: '12px', padding: '5px 10px', borderRadius: '6px',
                border: active === i ? '1.5px solid var(--prime)' : '1.5px solid var(--rim)',
                background: active === i ? 'rgba(240,165,0,0.15)' : done ? (correct ? 'rgba(34,197,94,0.14)' : 'rgba(244,63,94,0.14)') : 'transparent',
                color: active === i ? 'var(--prime)' : done ? (correct ? 'var(--mint)' : 'var(--rose)') : 'var(--ink-low)',
                cursor: 'pointer',
              }}>
              {done ? (correct ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>') : '·'} {i + 1}
            </button>
          )
        })}
        {answered > 0 && (
          <span style={{ ...mono, fontSize: '12px', color: 'var(--ink-low)', marginLeft: '4px' }}>
            {score}/{answered} correct
          </span>
        )}
      </div>

      {/* Scenario card */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ ...mono, fontSize: '11px', color: 'var(--prime)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Scenario {scenario.id} / {REGISTRY_SCENARIOS.length}
        </div>
        <div style={{ ...grotesk, fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          {scenario.title}
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
          {scenario.body}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
        {REGISTRY_OPTIONS.map(opt => {
          const isPicked = pick === opt.id
          const isCorrect = opt.id === scenario.correct
          let borderColor = 'var(--rim)'
          let bg = 'transparent'
          if (isRevealed && isPicked && isCorrect) { borderColor = 'var(--mint)'; bg = 'rgba(34,197,94,0.15)' }
          else if (isRevealed && isPicked && !isCorrect) { borderColor = 'var(--rose)'; bg = 'rgba(244,63,94,0.15)' }
          else if (isRevealed && isCorrect) { borderColor = 'var(--mint)'; bg = 'rgba(34,197,94,0.11)' }
          return (
            <button key={opt.id} onClick={() => choose(opt.id)}
              style={{
                border: `1.5px solid ${borderColor}`, borderRadius: '10px', padding: '14px',
                background: bg, cursor: isRevealed ? 'default' : 'pointer', textAlign: 'left',
                opacity: isRevealed && !isPicked && !isCorrect ? 0.4 : 1, transition: 'all 0.15s',
              }}>
              <div style={{ ...grotesk, fontSize: '13px', fontWeight: 600, color: opt.color }}>
                {isRevealed && isCorrect && <span style={{ color: 'var(--mint)', marginRight: '5px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
                {isRevealed && isPicked && !isCorrect && <span style={{ color: 'var(--rose)', marginRight: '5px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
                {opt.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Reasoning */}
      {isRevealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card animate-slide-up" style={{
            padding: '18px',
            background: picks[scenario.id] === scenario.correct ? 'rgba(34,197,94,0.13)' : 'rgba(244,63,94,0.13)',
            border: `1px solid ${picks[scenario.id] === scenario.correct ? 'rgba(34,197,94,0.25)' : 'rgba(244,63,94,0.25)'}`,
          }}>
            <div style={{ ...grotesk, fontSize: '13px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '8px' }}>
              {picks[scenario.id] === scenario.correct ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg> Correct' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Not quite'} — Reasoning
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: 'var(--ink-hi)' }}>
                {REGISTRY_OPTIONS.find(o => o.id === scenario.correct)?.label}:
              </strong>{' '}
              {scenario.reasoning}
            </p>
          </div>
          {scenario.awsCallout && (
            <div className="msl-cloud-map">
              <strong>AWS in production →</strong>{' '}
              <span className="msl-cloud-chip">{scenario.awsCallout.service}</span>{' '}
              {scenario.awsCallout.desc}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-ghost" onClick={() => setActive(a => Math.max(0, a - 1))} disabled={active === 0}>
          ← Previous
        </button>
        <button className="btn-secondary" onClick={() => setActive(a => Math.min(REGISTRY_SCENARIOS.length - 1, a + 1))} disabled={active === REGISTRY_SCENARIOS.length - 1}>
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Module 4: Model Registry Patterns (AccordionMCQ) ────────────────────────
const MODEL_REGISTRY_SCENARIOS = [
  {
    id: 'mreg1',
    title: 'Semantic versioning breaks under continuous training',
    context: 'Your team uses semantic versioning (1.0.0, 1.1.0, 2.0.0) for model artifacts in S3. Models are retrained weekly. After 6 months you have 26 versions. A downstream team pinned their serving config to "model >= 1.x" and accidentally picked up a model with a breaking input schema change that was released as v1.9.0 instead of v2.0.0.',
    question: 'What versioning strategy prevents this class of failure?',
    options: [
      'Use stricter semantic versioning discipline — major version for any schema change.',
      'Hash-based versioning (content-addressed by model artifact hash) with an explicit schema contract file checked into the registry alongside every artifact.',
      'Require all downstream consumers to pin exact versions, not ranges.',
      'Add a model changelog document that engineers read before upgrading.',
    ],
    answer: 1,
    diagnosis: 'Semantic versioning requires human judgment to correctly classify breaking vs. non-breaking changes. Under weekly retraining with multiple engineers, version bumping discipline degrades. Hash-based versioning removes the judgment call: the hash is the version. Schema contracts checked into the registry make breaking changes detectable programmatically.',
    fix: 'Move to content-addressed artifact versioning: `sha256(model_artifact)` as the canonical version ID. Register a `schema.json` with every artifact (input feature names + dtypes, output schema). Add a compatibility check in the promotion gate: if `schema.json` differs from the currently deployed version, block auto-promotion and require explicit sign-off.',
    awsCallout: { service: 'SageMaker Model Registry', desc: 'stores model metadata including custom schema contracts alongside each artifact version — attach schema.json as a registry property and enforce the compatibility check in a SageMaker Pipelines approval step.' },
  },
  {
    id: 'mreg2',
    title: 'Shadow mode promotion gate fails silently',
    context: 'Your MLOps platform runs new models in shadow mode for 48 hours before promoting to canary. Shadow mode logs predictions but does not serve them to users. After promotion, a model that performed well in shadow mode shows 12% higher error rate in canary. Investigation reveals shadow traffic was sampled from cached requests, not live traffic.',
    question: 'What was the root failure in the shadow mode gate?',
    options: [
      'Shadow mode should have been run for 2 weeks, not 48 hours — insufficient time to capture weekly traffic cycles.',
      'The canary rollout percentage was too high — 5% canary is the standard maximum for initial promotion.',
      'Shadow traffic did not represent the live distribution — cached requests have different feature distributions than real-time requests. The gate passed a model that was never tested on actual live traffic.',
      'The shadow mode comparison metric (error rate) should have been AUC-PR, not mean absolute error.',
    ],
    answer: 2,
    diagnosis: 'Shadow mode is only as valid as its traffic sample. Cached requests have higher hit rates, different session lengths, and different feature value distributions than real-time traffic. A model that performs well on cached traffic may degrade on real-time traffic with cold-start features, fresh user state, or recent inventory changes.',
    fix: 'Verify shadow traffic provenance before trusting gate results. Live shadow mode must intercept actual inference requests, not replay cached ones. Add a traffic distribution check to the gate: compare feature value distributions between shadow traffic and the last 7 days of production traffic. Flag divergence > 10% PSI as a gate failure.',
    awsCallout: { service: 'SageMaker Shadow Testing', desc: 'intercepts live endpoint invocations and mirrors them to the shadow variant in real time — eliminates the cached-replay problem because traffic is sourced directly from the production request path.' },
  },
  {
    id: 'mreg3',
    title: 'Rollback trigger: when to rollback vs. retrain',
    context: 'Your production recommendation model shows a sudden AUC drop from 0.81 to 0.74 at 2am. Monitoring also shows PSI = 0.31 on the `user_age` feature (upstream data pipeline changed bucketing logic). P95 serving latency is unchanged.',
    question: 'What is the correct immediate response?',
    options: [
      'Rollback to the previous model version immediately.',
      'Retrain the model on recent data and promote to production.',
      'The AUC drop is caused by the upstream feature distribution shift, not model degradation. Fix the upstream pipeline first. Rollback would restore the model but not fix the feature — the rollback model would also degrade on the same corrupted feature.',
      'Increase canary traffic to the previous model version while investigating.',
    ],
    answer: 2,
    diagnosis: 'Rollback addresses model failures, not data failures. When PSI on an input feature exceeds 0.25, the feature distribution has fundamentally shifted — both the current and previous model will produce degraded outputs on the same bad feature. Rollback without fixing the upstream pipeline is a no-op.',
    fix: 'Classify the failure before responding: if monitoring shows feature PSI > 0.25 alongside metric degradation, the root cause is upstream, not the model. Escalate to the data engineering team for pipeline fix. If the fix takes >2 hours, consider temporarily routing traffic to a model that does not depend on the degraded feature. Reserve model rollback for cases where the model artifact itself is the failure source.',
    awsCallout: { service: 'SageMaker Model Monitor', desc: 'data quality jobs compute PSI on incoming feature distributions continuously — the PSI > 0.25 alarm is your signal to page data engineering rather than triggering a model rollback.' },
  },
]

export function ModelRegistryPatterns() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>MLOps Patterns</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Model Registry Patterns</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          Versioning strategies, promotion gates, and rollback decisions — the operational state machine that separates teams that ship safely from teams that page at 2am.
        </p>
      </div>
      <AccordionMCQ scenarios={MODEL_REGISTRY_SCENARIOS} accentColor="var(--prime)" storageKey="mlops_pipeline_registry" />
    </div>
  )
}

// ─── Module 5: Schema Cascade Failure ────────────────────────────────────────
const SCHEMA_CASCADE_SCENARIOS = [
  {
    id: 'sc1',
    title: 'Upstream column rename breaks four models silently',
    context: 'A data engineering team renames `user_tenure_days` to `account_age_days` in the feature store as part of a schema cleanup. The change passes CI because no tests check column names against downstream consumers. Four production models that use `user_tenure_days` as a top-5 feature continue serving — they silently receive NaN for the missing column and fall back to imputed mean values.',
    question: 'Why did model monitoring not catch this immediately?',
    options: [
      'The models were retrained after the rename and learned to ignore the missing column via feature selection.',
      'NaN imputation with mean values keeps the feature distribution superficially stable — PSI stays low because the imputed mean resembles historical distribution. Prediction quality degrades without triggering a distribution alert.',
      'The monitoring system was configured to track prediction drift, not feature-level null rates.',
      'PSI monitoring only detects shifts in non-null values — silent NaN injection requires a dedicated null-rate monitor.',
    ],
    answer: 1,
    diagnosis: 'Mean imputation is the silent killer: replacing a missing column with its historical mean produces a feature value that looks statistically valid. PSI compares the new distribution to the reference — if the reference also included some mean-imputed values, the shift is masked. Model performance degrades because the signal is gone, but the distribution appears stable.',
    fix: 'Add null-rate monitoring as a first-class signal alongside PSI. A null rate jump from 0.2% to 100% for any feature should trigger an immediate alert, regardless of imputation strategy. In CI/CD, add a schema compatibility check: before merging any feature store schema change, run a consumer scan that lists all models depending on the affected columns.',
    awsCallout: { service: 'SageMaker Feature Store', desc: 'enforces schema on ingestion and tracks which feature groups each model consumed — a consumer scan before merging a column rename surfaces every downstream model that will silently receive nulls.' },
  },
  {
    id: 'sc2',
    title: 'dbt model rename cascades to serving pipeline',
    context: [
      'A dbt model `fct_user_events` is renamed to `fct_events_v2` and the old model is deprecated. The dbt CI passes.',
      'Three days later, the real-time feature computation service — which reads from the dbt output table directly via a Spark job — begins returning stale features. The Spark job silently fails to find the renamed table and falls back to a cached snapshot from 3 days prior.',
    ],
    question: 'What gating mechanism would have prevented this?',
    options: [
      'The dbt model should have maintained a backward-compatible view under the old name during a deprecation window.',
      'A cross-system lineage check in the dbt CI pipeline: before deprecating any model, verify no downstream consumers (Spark jobs, ML pipelines, dashboards) reference the old table name. Block merge if live consumers exist.',
      'The Spark job should have used a table alias registered in a central catalog, not a hardcoded table name.',
      'Feature store caching TTL should be set to zero to prevent stale fallback hiding the failure.',
    ],
    answer: 1,
    diagnosis: 'dbt CI only validates the dbt DAG. It has no visibility into Spark jobs, ML serving pipelines, or dashboards that read from dbt output tables directly. A rename that passes dbt CI can still silently break every downstream consumer that was not part of the dbt graph.',
    fix: 'Build cross-system lineage: maintain a registry of all consumers of each dbt model (Spark jobs, ML features, dashboards). Integrate this registry into dbt CI — any rename or deprecation triggers a consumer scan. Block merge until all consumers are either updated or explicitly acknowledged. Tools like DataHub, OpenLineage, or a simple internal YAML consumer manifest work for this.',
    awsCallout: { service: 'AWS Lake Formation', desc: 'combined with AWS Glue Data Catalog, tracks table-level lineage across Glue jobs, Spark, and Athena — use the catalog to enumerate all consumers of a table before approving a rename in dbt.' },
  },
  {
    id: 'sc3',
    title: 'Feature dtype change causes silent score inflation',
    context: 'A feature pipeline changes `purchase_count_30d` from `int32` to `float32` as part of a standardisation pass. The change is backward-compatible in Python. Model serving normalises all features by dividing by their historical max. The historical max for `purchase_count_30d` was computed as integer 847 — stored as int in the normalisation config. After the dtype change, floating-point division produces slightly different normalised values due to precision differences.',
    question: 'What is the most production-dangerous aspect of this failure?',
    options: [
      'Float features use more memory than int features.',
      'The score change is small enough to stay within monitoring thresholds — no alert fires. But the model was trained on int-normalised values, so the serving distribution has silently diverged from the training distribution for every request.',
      'The normalisation config should be recomputed after every dtype change.',
      'Int32 to float32 is a breaking schema change that should require a major version bump.',
    ],
    answer: 1,
    diagnosis: 'Training-serving skew without an alert: the dtype change introduces a tiny, consistent numerical difference in every normalised feature value. The PSI on the normalised feature stays near zero (the distribution shape is identical, just shifted by a small constant). But the model was never trained on float-normalised values — the skew is real and permanent.',
    fix: 'Add a training-serving consistency check to the serving pipeline: periodically sample a batch of serving requests, run the same features through the training-time normalisation pipeline, and compare outputs. Any consistent difference > 1e-4 in feature value should trigger a review. Lock normalisation configs to the training pipeline version and require recomputation — not just dtype-safe migration — when any input schema changes.',
    awsCallout: { service: 'SageMaker Model Monitor', desc: 'model quality monitoring jobs can detect training-serving skew by comparing live prediction distributions against a baseline captured at training time — catches the silent normalisation drift before it affects business metrics.' },
  },
]

export function SchemaCascade() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Pipeline Failure Modes</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Schema Cascade Failure</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          A schema change in an upstream table breaks downstream models without raising an exception. Trace the cascade and design the gating strategy that would have caught it.
        </p>
      </div>
      <AccordionMCQ scenarios={SCHEMA_CASCADE_SCENARIOS} accentColor="var(--prime)" storageKey="mlops_pipeline_schema" />
    </div>
  )
}

// ─── Tab shell ────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'cicd',            label: 'CI/CD Gate Design',       icon: '',  component: CiCdGates },
  { id: 'infra',           label: 'Infrastructure Decision',  icon: '',  component: InfraDecision },
  { id: 'registry',        label: 'Model Registry Patterns',  icon: '',  component: RegistryPatterns },
  { id: 'model_registry',  label: 'Model Registry',           icon: '',  component: ModelRegistryPatterns },
  { id: 'schema_cascade',  label: 'Schema Cascade',           icon: '',  component: SchemaCascade },
]

// ── Coming Soon ───────────────────────────────────────────────────────────────
// devBrief fields are internal build guidance only — not rendered to users.
const COMING_SOON = []

// ── BookmarkButton ─────────────────────────────────────────────────────────────
function BookmarkButton({ tabId, moduleId, label }) {
  const [saved, setSaved] = useState(() => isBookmarked(tabId, moduleId))
  function handle() {
    toggleBookmark(tabId, moduleId, label)
    setSaved(isBookmarked(tabId, moduleId))
  }
  return (
    <button onClick={handle} style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
      background: saved ? 'var(--prime-bg-light)' : 'transparent',
      border: saved ? '1px solid rgba(240,165,0,0.35)' : '1px solid var(--rim)',
      color: saved ? 'var(--prime)' : 'var(--ink-ghost)',
      fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600,
      transition: 'all 0.15s'
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

export default function MLOpsPipelinesTab({ onNavigate }) {
  const [active, setActive] = useState('cicd')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? CiCdGates
  const activeModuleData = MODULES.find(m => m.id === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ ...grotesk, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            MLOps: Pipelines & Infrastructure
          </h1>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
            background: 'rgba(240,165,0,0.2)', color: 'var(--prime)', ...mono,
          }}>MLOps</span>
          <FidelityBadge tier="conceptual" />
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '600px' }}>
          CI/CD gate design, infrastructure selection, and model registry patterns. The plumbing decisions that determine whether a model makes it from training to production reliably.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}
            style={active === m.id ? { borderColor: 'var(--prime)', color: 'var(--prime)', background: 'rgba(240,165,0,0.15)' } : {}}>{m.label}
          </button>
        ))}
      </div>

      {activeModuleData && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <BookmarkButton tabId="mlops_pipes" moduleId={active} label={activeModuleData.label} />
        </div>
      )}

      <div key={active} className="tab-enter"><ActiveModule /></div>
      {/* ── Coming Soon ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '48px' }}>
        <div className="eyebrow" style={{ marginBottom: '12px' }}>What's building</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {COMING_SOON.map(m => (
            <div key={m.label} className="card" style={{ padding: 'var(--card-pad-secondary)', opacity: 0.65, borderLeft: '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--ink-mid)' }}>{m.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'var(--card-tint)', color: 'var(--ink-ghost)', borderRadius: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>soon</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.userBrief}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
