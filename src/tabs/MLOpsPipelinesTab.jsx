import { useState, useMemo } from 'react'

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

function CiCdGates() {
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
        <h3 style={{ ...grotesk, fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
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
                    {u.include ? '✓ Include' : '✗ Exclude'}
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
        <div className="card animate-slide-up" style={{ padding: '18px', background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <div style={{ ...grotesk, fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '10px' }}>
            {matches}/{GATES.length} gates matched expert config
          </div>
          <div style={{ ...grotesk, fontSize: '14px', fontWeight: 700, color: 'var(--rose)', marginBottom: '8px' }}>
            Key insight
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
            ML CI/CD differs from software CI/CD: you can't unit test model quality exhaustively.{' '}
            <strong style={{ color: 'var(--ink-hi)' }}>Shadow mode is your integration test. Canary ramp is your production smoke test.</strong>{' '}
            Schema mismatch and metric regression are the only two things that should reliably block a ship.
            Everything else is signal — worth knowing, rarely worth blocking.
          </p>
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

function InfraDecision() {
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
        <h3 style={{ ...grotesk, fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
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
            <div style={{ ...mono, fontSize: '11px', color: 'var(--rose)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              {label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {options.map(opt => (
                <button key={opt.id} onClick={() => setParams(p => ({ ...p, [key]: opt.id }))}
                  style={{
                    border: `1.5px solid ${params[key] === opt.id ? 'var(--rose)' : 'var(--rim)'}`,
                    borderRadius: '7px', padding: '7px 10px', cursor: 'pointer', textAlign: 'left',
                    background: params[key] === opt.id ? 'rgba(244,63,94,0.15)' : 'transparent',
                    transition: 'all 0.12s',
                  }}>
                  <div style={{ ...grotesk, fontSize: '12px', fontWeight: 600, color: params[key] === opt.id ? 'var(--rose)' : 'var(--ink-hi)' }}>
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
      <div className="card animate-slide-up" style={{ padding: '20px', background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.25)' }}>
        <div style={{ ...mono, fontSize: '11px', color: 'var(--rose)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Recommended
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div style={{ ...grotesk, fontSize: '20px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em' }}>
            {top.name}
          </div>
          <span style={{ ...pill('var(--sky)'), fontSize: '11px' }}>{top.tech}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
          <div>
            <div style={{ ...mono, fontSize: '11px', color: 'var(--mint)', marginBottom: '4px' }}>Pros</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{top.pros}</p>
          </div>
          <div>
            <div style={{ ...mono, fontSize: '11px', color: 'var(--rose)', marginBottom: '4px' }}>Cons</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{top.cons}</p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '10px' }}>
          <div style={{ ...mono, fontSize: '11px', color: 'var(--gold)', marginBottom: '4px' }}>Where it breaks</div>
          <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{top.whenBreaks}</p>
        </div>
      </div>

      {/* Other options */}
      <div>
        <div style={{ ...mono, fontSize: '11px', color: 'var(--ink-low)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>
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
  { id: 'stage',    label: 'Register as staging',     color: 'var(--sky)' },
  { id: 'promote',  label: 'Promote to production',   color: 'var(--mint)' },
  { id: 'rollback', label: 'Rollback to previous',    color: 'var(--gold)' },
  { id: 'archive',  label: 'Archive',                 color: 'var(--ink-low)' },
  { id: 'flag',     label: 'Flag for review',         color: 'var(--violet)' },
  { id: 'delete',   label: 'Delete',                  color: 'var(--rose)' },
]

const REGISTRY_SCENARIOS = [
  {
    id: 1,
    title: 'All gates passed, canary metrics nominal',
    body: 'Challenger model passed all offline evals and 2-week shadow. Canary at 5% for 3 days shows metrics matching champion.',
    correct: 'promote',
    reasoning: 'All gates passed. Canary data confirms offline eval held up. This is the normal promotion path.',
  },
  {
    id: 2,
    title: 'Stale staging model, 6 months old, never deployed',
    body: "Model trained 6 months ago is still registered as 'staging'. It was never deployed — a better version was trained instead.",
    correct: 'archive',
    reasoning: "Don't delete (you might want the weights for comparison or rollback reference). Archive indicates 'valid but superseded.' Keeps the registry clean without losing history.",
  },
  {
    id: 3,
    title: 'Data leakage found in training set — model is live',
    body: "Production model's training data was found to contain test set labels (data leakage). Model is currently serving live traffic.",
    correct: 'rollback',
    reasoning: 'Leakage = model results are invalid. Roll back immediately, then audit: how long was the leaky model live? What decisions did it influence? Flag for incident review.',
  },
  {
    id: 4,
    title: 'Schema mismatch caught in CI — feature renamed',
    body: "New model version failed schema validation in CI — the feature 'user_country' was renamed to 'country_code' in the feature pipeline.",
    correct: 'stage',
    reasoning: "Don't promote. The schema mismatch would cause production errors. Fix the schema alignment, re-run CI, then promote if it passes.",
  },
  {
    id: 5,
    title: '2-year-old model consuming 40GB in registry',
    body: 'Model version from 2 years ago is taking up 40GB in the registry. It has been superseded by 12 newer versions.',
    correct: 'archive',
    reasoning: 'If retention policy says keep 6 months, delete it. If no formal policy, archive. Never delete a model that was in production without confirming audit requirements are met.',
  },
  {
    id: 6,
    title: 'Better engagement, worse fairness metric',
    body: 'A/B test shows challenger is better on engagement but worse on a fairness metric (higher false positive rate on minority subgroup).',
    correct: 'flag',
    reasoning: "This is not a pure technical decision — it requires product/legal/policy review. Don't promote, don't rollback the canary, but don't just reject either. Escalate with the data.",
  },
]

function RegistryPatterns() {
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
        <h3 style={{ ...grotesk, fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
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
                border: active === i ? '1.5px solid var(--rose)' : '1.5px solid var(--rim)',
                background: active === i ? 'rgba(244,63,94,0.15)' : done ? (correct ? 'rgba(34,197,94,0.14)' : 'rgba(244,63,94,0.14)') : 'transparent',
                color: active === i ? 'var(--rose)' : done ? (correct ? 'var(--mint)' : 'var(--rose)') : 'var(--ink-low)',
                cursor: 'pointer',
              }}>
              {done ? (correct ? '✓' : '✗') : '·'} {i + 1}
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
        <div style={{ ...mono, fontSize: '11px', color: 'var(--rose)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
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
                {isRevealed && isCorrect && <span style={{ color: 'var(--mint)', marginRight: '5px' }}>✓</span>}
                {isRevealed && isPicked && !isCorrect && <span style={{ color: 'var(--rose)', marginRight: '5px' }}>✗</span>}
                {opt.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Reasoning */}
      {isRevealed && (
        <div className="card animate-slide-up" style={{
          padding: '18px',
          background: picks[scenario.id] === scenario.correct ? 'rgba(34,197,94,0.13)' : 'rgba(244,63,94,0.13)',
          border: `1px solid ${picks[scenario.id] === scenario.correct ? 'rgba(34,197,94,0.25)' : 'rgba(244,63,94,0.25)'}`,
        }}>
          <div style={{ ...grotesk, fontSize: '13px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '8px' }}>
            {picks[scenario.id] === scenario.correct ? '✓ Correct' : '✗ Not quite'} — Reasoning
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
            <strong style={{ color: 'var(--ink-hi)' }}>
              {REGISTRY_OPTIONS.find(o => o.id === scenario.correct)?.label}:
            </strong>{' '}
            {scenario.reasoning}
          </p>
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

// ─── Tab shell ────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'cicd',     label: 'CI/CD Gate Design',       icon: '⚙️',  component: CiCdGates },
  { id: 'infra',    label: 'Infrastructure Decision',  icon: '🏗',  component: InfraDecision },
  { id: 'registry', label: 'Model Registry Patterns',  icon: '📦',  component: RegistryPatterns },
]

export default function MLOpsPipelinesTab({ onNavigate }) {
  const [active, setActive] = useState('cicd')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? CiCdGates

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ ...grotesk, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--rose) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            MLOps: Pipelines & Infrastructure
          </h1>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
            background: 'rgba(244,63,94,0.2)', color: 'var(--rose)', ...mono,
          }}>MLOps</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '600px' }}>
          CI/CD gate design, infrastructure selection, and model registry patterns. The plumbing decisions that determine whether a model makes it from training to production reliably.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}
            style={active === m.id ? { borderColor: 'var(--rose)', color: 'var(--rose)', background: 'rgba(244,63,94,0.15)' } : {}}>{m.label}
          </button>
        ))}
      </div>

      <div key={active} className="tab-enter"><ActiveModule /></div>
    </div>
  )
}
