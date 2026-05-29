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

// ─── Module 1: Deployment Strategy ───────────────────────────────────────────
const STRATEGIES = [
  { id: 'canary',      label: 'Canary',               desc: '% traffic ramp, metric gates' },
  { id: 'shadow',      label: 'Shadow Mode',           desc: 'No live traffic, parallel scoring' },
  { id: 'bluegreen',   label: 'Blue-Green',            desc: 'Full traffic switch, instant rollback' },
  { id: 'featureflag', label: 'Feature Flag',          desc: 'User-segment rollout, owner-controlled' },
  { id: 'rolling',     label: 'Rolling Update',        desc: 'Gradual instance replacement' },
  { id: 'immediate',   label: 'Immediate Full Deploy', desc: 'Risky, only specific cases' },
]

const DEPLOY_SCENARIOS = [
  {
    id: 1,
    title: 'Fraud detection model',
    body: "New fraud detection model. Can't test offline — fraud patterns require live traffic. Need to limit blast radius if it fires too aggressively.",
    correct: 'canary',
    reasoning: "Start at 1%, watch false positive rate and block rate vs champion. Shadow would generate no real decisions so you can't measure business impact. Feature flag requires explicit user targeting which doesn't make sense for fraud.",
    awsCallout: { service: 'SageMaker Deployment Guardrails', desc: 'configure automatic traffic shifting with metric-gated rollback — halt the canary ramp if false positive rate exceeds your threshold.' },
  },
  {
    id: 2,
    title: 'New embedding architecture',
    body: 'Updated recommendation model. New embedding architecture — completely different score distribution. You need to compare engagement metrics over 2 weeks.',
    correct: 'shadow',
    reasoning: 'Shadow Mode first, then Canary. Shadow lets you collect predictions without impacting users. After offline comparison passes, canary 5% → 20% → 50% → 100% with engagement guardrails. Never go straight to canary on a completely different score distribution.',
    awsCallout: { service: 'SageMaker Shadow Testing', desc: 'routes a copy of live traffic to the shadow variant and logs predictions without serving them — the managed AWS primitive for this exact pattern.' },
  },
  {
    id: 3,
    title: 'Critical serving code bug fix',
    body: 'Critical bug fix in the model serving code (NaN handling). Identical model weights, just a one-line code fix.',
    correct: 'rolling',
    reasoning: 'Rolling Update (or Blue-Green). No model change means no need for gradual traffic ramp. Rolling is standard; Blue-Green if you want instant rollback capability.',
    awsCallout: { service: 'SageMaker Endpoints', desc: 'support rolling updates natively; pair with CodeDeploy blue/green if you need instant rollback without instance churn.' },
  },
  {
    id: 4,
    title: 'Multi-surface ranking model',
    body: 'New content ranking model. Different teams own different user surfaces (homepage, search, notifications). You want team leads to control when their surface gets the new model.',
    correct: 'featureflag',
    reasoning: "Segment by surface. Each team lead can flip their surface independently. Canary can't express this ownership structure.",
    awsCallout: { service: 'SageMaker Multi-Model Endpoints', desc: 'let each surface route to a distinct model variant on the same endpoint — team leads swap their variant without touching others.' },
  },
  {
    id: 5,
    title: 'Internal analyst tool',
    body: 'Model passed all offline evals. Deploying to an internal tool used by 20 data analysts. No external customers affected.',
    correct: 'immediate',
    reasoning: 'Low blast radius, known user base, internal only. Over-engineering deployment here wastes time. Ship it, monitor it.',
    awsCallout: { service: 'SageMaker Serverless Inference', desc: 'ideal for low-traffic internal tools — zero idle cost, auto-scaling, no instance management overhead.' },
  },
  {
    id: 6,
    title: 'LLM serving upgrade',
    body: 'LLM serving upgrade: new version produces slightly different token probabilities. Need to compare response quality but automated metrics aren\'t reliable for this.',
    correct: 'shadow',
    reasoning: 'Shadow Mode with human eval. LLM quality requires human judgment, not just automated metrics. Run both versions, collect shadow outputs, run human preference evaluation before any live traffic.',
    awsCallout: { service: 'SageMaker Shadow Testing', desc: 'captures challenger outputs alongside champion responses without serving them — feed those logs into a human evaluation pipeline before promoting the new version.' },
  },
]

function DeployStrategy() {
  const [picks, setPicks] = useState({})
  const [revealed, setRevealed] = useState({})
  const [active, setActive] = useState(0)

  const scenario = DEPLOY_SCENARIOS[active]
  const pick = picks[scenario.id]
  const isRevealed = !!revealed[scenario.id]

  function choose(stratId) {
    if (isRevealed) return
    setPicks(p => ({ ...p, [scenario.id]: stratId }))
    setRevealed(r => ({ ...r, [scenario.id]: true }))
  }

  const score = DEPLOY_SCENARIOS.filter(s => picks[s.id] === s.correct).length
  const answered = Object.keys(revealed).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ ...grotesk, fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Deployment Strategy
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Six production scenarios. Pick the right deployment strategy for each. Reveal engineering reasoning after.
        </p>
      </div>

      {/* Scenario nav */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {DEPLOY_SCENARIOS.map((s, i) => {
          const done = !!revealed[s.id]
          const correct = picks[s.id] === s.correct
          return (
            <button key={s.id} onClick={() => setActive(i)}
              style={{
                ...mono,
                fontSize: '12px',
                padding: '5px 10px',
                borderRadius: '6px',
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
          <span style={{ ...mono, fontSize: '12px', color: 'var(--ink-low)', alignSelf: 'center', marginLeft: '8px' }}>
            {score}/{answered} correct
          </span>
        )}
      </div>

      {/* Scenario card */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ ...mono, fontSize: '11px', color: 'var(--rose)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Scenario {scenario.id} of {DEPLOY_SCENARIOS.length}
        </div>
        <div style={{ ...grotesk, fontSize: '17px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          {scenario.title}
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
          {scenario.body}
        </p>
      </div>

      {/* Strategy options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {STRATEGIES.map(s => {
          const isPicked = pick === s.id
          const isCorrect = s.id === scenario.correct
          let borderColor = 'var(--rim)'
          let bg = 'transparent'
          if (isRevealed && isPicked && isCorrect) { borderColor = 'var(--mint)'; bg = 'rgba(34,197,94,0.14)' }
          else if (isRevealed && isPicked && !isCorrect) { borderColor = 'var(--rose)'; bg = 'rgba(244,63,94,0.14)' }
          else if (isRevealed && isCorrect) { borderColor = 'var(--mint)'; bg = 'rgba(34,197,94,0.11)' }
          return (
            <button key={s.id} onClick={() => choose(s.id)}
              style={{
                border: `1.5px solid ${borderColor}`,
                borderRadius: '10px',
                padding: '14px',
                background: bg,
                cursor: isRevealed ? 'default' : 'pointer',
                textAlign: 'left',
                opacity: isRevealed && !isPicked && !isCorrect ? 0.45 : 1,
                transition: 'all 0.15s',
              }}>
              <div style={{ ...grotesk, fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '3px' }}>
                {isRevealed && isCorrect && <span style={{ color: 'var(--mint)', marginRight: '5px' }}>✓</span>}
                {isRevealed && isPicked && !isCorrect && <span style={{ color: 'var(--rose)', marginRight: '5px' }}>✗</span>}
                {s.label}
              </div>
              <div style={{ ...mono, fontSize: '11px', color: 'var(--ink-low)', lineHeight: 1.5 }}>{s.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Reasoning reveal */}
      {isRevealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card animate-slide-up" style={{
            padding: '18px',
            background: picks[scenario.id] === scenario.correct ? 'rgba(34,197,94,0.13)' : 'rgba(244,63,94,0.13)',
            border: `1px solid ${picks[scenario.id] === scenario.correct ? 'rgba(34,197,94,0.25)' : 'rgba(244,63,94,0.25)'}`,
          }}>
            <div style={{ ...grotesk, fontSize: '13px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '8px' }}>
              {picks[scenario.id] === scenario.correct ? '✓ Correct' : '✗ Not quite'} — Engineering reasoning
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: 'var(--ink-hi)' }}>
                {STRATEGIES.find(s => s.id === scenario.correct)?.label}:
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
        <button className="btn-secondary" onClick={() => setActive(a => Math.min(DEPLOY_SCENARIOS.length - 1, a + 1))} disabled={active === DEPLOY_SCENARIOS.length - 1}>
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Module 2: Champion-Challenger ────────────────────────────────────────────
const METRICS_TABLE = [
  { metric: 'AUC-PR',              champion: '0.847',  challenger: '0.861', delta: '+1.7%',  status: '✓ Better', statusColor: 'var(--mint)' },
  { metric: 'Calibration (ECE)',   champion: '0.043',  challenger: '0.038', delta: '-12%',   status: '✓ Better', statusColor: 'var(--mint)' },
  { metric: 'p50 latency',         champion: '12ms',   challenger: '18ms',  delta: '+50%',   status: '⚠ Worse',  statusColor: 'var(--gold)' },
  { metric: 'p99 latency',         champion: '45ms',   challenger: '89ms',  delta: '+98%',   status: '✗ Bad',    statusColor: 'var(--rose)' },
  { metric: 'Memory per instance', champion: '420MB',  challenger: '780MB', delta: '+86%',   status: '⚠ Worse',  statusColor: 'var(--gold)' },
  { metric: 'False positive rate', champion: '4.2%',   challenger: '3.8%',  delta: '-10%',   status: '✓ Better', statusColor: 'var(--mint)' },
  { metric: 'Coverage (% scored)', champion: '99.1%',  challenger: '99.3%', delta: '+0.2%',  status: '✓ Better', statusColor: 'var(--mint)' },
  { metric: 'Training time',       champion: '4h',     challenger: '7h',    delta: '+75%',   status: '⚠ Worse',  statusColor: 'var(--gold)' },
]

const CC_QUESTIONS = [
  {
    q: 'Q1: Based on these metrics, what is your initial recommendation?',
    options: [
      { id: 'promote',    label: 'Promote challenger' },
      { id: 'keep',       label: 'Keep champion' },
      { id: 'conditions', label: 'Promote with conditions' },
      { id: 'reject',     label: 'Reject and iterate' },
    ],
    correct: 'conditions',
    reasoning: 'The p99 latency jump from 45ms → 89ms is a red flag if there\'s an SLA. Accuracy gains are real but you need to resolve the latency issue first before promoting.',
    awsCallout: { service: 'SageMaker Inference Recommender', desc: 'benchmarks challenger latency across instance types so you have real numbers before committing to a conditional promotion.' },
  },
  {
    q: 'Q2: The SLA for this service is p99 < 100ms. Does the challenger meet it?',
    options: [
      { id: 'yes',      label: 'Yes, 89ms < 100ms, it passes' },
      { id: 'no',       label: 'No, 98% increase is too close to the limit' },
      { id: 'depends',  label: 'Depends on traffic variance' },
      { id: 'moredata', label: 'Need more data' },
    ],
    correct: 'depends',
    reasoning: '89ms on current traffic might be 110ms under peak load. 11ms headroom at p99 is insufficient. You need load testing under peak traffic, not just current traffic.',
    awsCallout: { service: 'SageMaker Inference Recommender', desc: 'runs load tests at configured peak traffic levels and reports p99 latency and throughput — use this before trusting any single-traffic-level latency number.' },
  },
  {
    q: 'Q3: Load test shows p99 = 103ms under peak load — just over SLA. What do you do?',
    options: [
      { id: 'reject',    label: 'Reject the challenger entirely' },
      { id: 'profile',   label: 'Profile and optimize the hot path' },
      { id: 'lowtraffic', label: 'Deploy to only low-traffic segments' },
      { id: 'negotiate', label: 'Negotiate new SLA with the business' },
    ],
    correct: 'profile',
    reasoning: 'The accuracy gains are real and worth preserving. First: profile what\'s causing the extra 50ms (is it the new features? model size? I/O?). Often 80% of latency gain comes from one inefficiency. Don\'t throw away a better model because of an undiagnosed bottleneck.',
    awsCallout: { service: 'SageMaker Endpoints', desc: 'expose CloudWatch metrics per variant (CPU/GPU utilisation, invocation time) — start profiling the hot path there before reaching for a heavier profiling tool.' },
  },
  {
    q: 'Q4: After optimization, challenger runs at p99 = 67ms under peak. Promote?',
    options: [
      { id: 'immediately',  label: 'Yes — promote immediately' },
      { id: 'canary',       label: 'Yes — canary ramp then full deploy' },
      { id: 'rollback',     label: 'Yes — but set up automatic rollback trigger' },
      { id: 'keeptest',     label: 'No — keep testing' },
    ],
    correct: 'rollback',
    reasoning: 'Never promote directly to 100%. Ramp 5% → 20% → 50% → 100% with rollback trigger: if p99 > 80ms OR false positive rate > 5% over 1-hour window → auto-rollback to champion.',
    awsCallout: { service: 'SageMaker Deployment Guardrails', desc: 'automates the canary ramp and fires automatic rollback to the champion endpoint if your CloudWatch alarm thresholds are breached during promotion.' },
  },
]

function ChampionChallenger() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState([])
  const [currentPick, setCurrentPick] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const done = step >= CC_QUESTIONS.length

  function answer(optId) {
    if (revealed) return
    setCurrentPick(optId)
    setRevealed(true)
  }

  function next() {
    setAnswers(a => [...a, { pick: currentPick, correct: CC_QUESTIONS[step].correct }])
    setStep(s => s + 1)
    setCurrentPick(null)
    setRevealed(false)
  }

  function reset() {
    setStep(0); setAnswers([]); setCurrentPick(null); setRevealed(false)
  }

  const score = answers.filter(a => a.pick === a.correct).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ ...grotesk, fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Champion-Challenger
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          A challenger model has been running in shadow/canary for 2 weeks. Work through 4 decisions to determine whether to promote.
        </p>
      </div>

      {/* Context */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Champion', desc: 'Production GBDT model', sub: '18 months in production', color: 'var(--sky)' },
          { label: 'Challenger', desc: 'LightGBM + new feature set', sub: '2 weeks in shadow/canary', color: 'var(--rose)' },
        ].map(m => (
          <div key={m.label} className="card" style={{ padding: '14px', borderColor: `${m.color}40` }}>
            <span style={{ ...pill(m.color) }}>{m.label}</span>
            <div style={{ ...grotesk, fontSize: '14px', fontWeight: 600, color: 'var(--ink-hi)', marginTop: '8px' }}>{m.desc}</div>
            <div style={{ ...mono, fontSize: '11px', color: 'var(--ink-low)', marginTop: '3px' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Metrics table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ ...mono, fontSize: '11px', color: 'var(--rose)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 16px 8px', borderBottom: '1px solid var(--rim)' }}>
          Evaluation Report Card
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '480px', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Metric', 'Champion', 'Challenger', 'Delta', 'Status'].map(h => (
                <th key={h} style={{ ...mono, padding: '8px 14px', textAlign: 'left', color: 'var(--ink-low)', fontWeight: 600, borderBottom: '1px solid var(--rim)', fontSize: '11px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS_TABLE.map((row, i) => (
              <tr key={row.metric} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ ...grotesk, padding: '8px 14px', color: 'var(--ink-hi)', fontWeight: 500, fontSize: '12px' }}>{row.metric}</td>
                <td style={{ ...mono, padding: '8px 14px', color: 'var(--ink-mid)' }}>{row.champion}</td>
                <td style={{ ...mono, padding: '8px 14px', color: 'var(--ink-mid)' }}>{row.challenger}</td>
                <td style={{ ...mono, padding: '8px 14px', color: row.statusColor, fontWeight: 600 }}>{row.delta}</td>
                <td style={{ ...mono, padding: '8px 14px', color: row.statusColor, fontWeight: 600 }}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Decision steps */}
      {!done && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {CC_QUESTIONS.map((_, i) => (
              <div key={i} style={{
                width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...mono, fontSize: '11px', fontWeight: 700,
                background: i < step ? 'rgba(34,197,94,0.15)' : i === step ? 'rgba(244,63,94,0.15)' : 'var(--rim)',
                color: i < step ? 'var(--mint)' : i === step ? 'var(--rose)' : 'var(--ink-low)',
                border: i === step ? '1.5px solid var(--rose)' : '1.5px solid transparent',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
            ))}
            <span style={{ ...mono, fontSize: '11px', color: 'var(--ink-low)', marginLeft: '6px' }}>Decision {step + 1} of 4</span>
          </div>

          <div className="card" style={{ padding: '18px' }}>
            <div style={{ ...grotesk, fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '14px', letterSpacing: '-0.01em' }}>
              {CC_QUESTIONS[step].q}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {CC_QUESTIONS[step].options.map(opt => {
                const isPicked = currentPick === opt.id
                const isCorrect = opt.id === CC_QUESTIONS[step].correct
                let borderColor = 'var(--rim)'
                let bg = 'transparent'
                if (revealed && isPicked && isCorrect) { borderColor = 'var(--mint)'; bg = 'rgba(34,197,94,0.15)' }
                else if (revealed && isPicked && !isCorrect) { borderColor = 'var(--rose)'; bg = 'rgba(244,63,94,0.15)' }
                else if (revealed && isCorrect) { borderColor = 'var(--mint)'; bg = 'rgba(34,197,94,0.11)' }
                return (
                  <button key={opt.id} onClick={() => answer(opt.id)}
                    style={{
                      border: `1.5px solid ${borderColor}`,
                      borderRadius: '8px', padding: '11px 14px',
                      background: bg, cursor: revealed ? 'default' : 'pointer',
                      textAlign: 'left', opacity: revealed && !isPicked && !isCorrect ? 0.4 : 1,
                      transition: 'all 0.15s', ...grotesk, fontSize: '13px', color: 'var(--ink-hi)',
                    }}>
                    {revealed && isCorrect && <span style={{ color: 'var(--mint)', marginRight: '6px' }}>✓</span>}
                    {revealed && isPicked && !isCorrect && <span style={{ color: 'var(--rose)', marginRight: '6px' }}>✗</span>}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {revealed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="card animate-slide-up" style={{
                padding: '16px',
                background: currentPick === CC_QUESTIONS[step].correct ? 'rgba(34,197,94,0.13)' : 'rgba(244,63,94,0.13)',
                border: `1px solid ${currentPick === CC_QUESTIONS[step].correct ? 'rgba(34,197,94,0.25)' : 'rgba(244,63,94,0.25)'}`,
              }}>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: '0 0 12px' }}>
                  {CC_QUESTIONS[step].reasoning}
                </p>
                <button className="btn-primary" onClick={next} style={{ fontSize: '13px', padding: '8px 16px' }}>
                  {step < CC_QUESTIONS.length - 1 ? 'Next decision →' : 'See summary →'}
                </button>
              </div>
              {CC_QUESTIONS[step].awsCallout && (
                <div className="msl-cloud-map">
                  <strong>AWS in production →</strong>{' '}
                  <span className="msl-cloud-chip">{CC_QUESTIONS[step].awsCallout.service}</span>{' '}
                  {CC_QUESTIONS[step].awsCallout.desc}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {done && (
        <div className="card animate-slide-up" style={{ padding: '22px', background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <div style={{ ...grotesk, fontSize: '20px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', marginBottom: '6px' }}>
            {score}/4 correct
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {answers.map((a, i) => (
              <span key={i} style={{ ...pill(a.pick === a.correct ? 'var(--mint)' : 'var(--rose)') }}>
                Q{i + 1} {a.pick === a.correct ? '✓' : '✗'}
              </span>
            ))}
          </div>
          <div style={{ ...grotesk, fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px' }}>
            Key lesson
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: '0 0 16px' }}>
            Champion-challenger isn't a single decision — it's a decision process. A latency regression that looks like a failure might be one profiling session away from a successful promotion. Always diagnose before rejecting.
          </p>
          <button className="btn-ghost" onClick={reset} style={{ fontSize: '13px' }}>↺ Restart</button>
        </div>
      )}
    </div>
  )
}

// ─── Module 3: Rollback Decision ──────────────────────────────────────────────
const ROLLBACK_OPTIONS = [
  { id: 'rollback',    label: 'Rollback immediately',   color: 'var(--rose)' },
  { id: 'investigate', label: 'Investigate before deciding', color: 'var(--gold)' },
  { id: 'monitor',     label: 'Monitor only',           color: 'var(--sky)' },
  { id: 'noaction',    label: 'No action needed',       color: 'var(--ink-low)' },
]

const ROLLBACK_SCENARIOS = [
  {
    id: 1,
    title: 'Error rate spike — NullPointerExceptions',
    alert: 'Model error rate jumped from 0.1% to 2.3% within 5 minutes of deploy. Errors are NullPointerExceptions in the feature pipeline.',
    correct: 'rollback',
    reasoning: "Sharp spike immediately post-deploy = deploy caused it. Don't investigate first — you're actively erroring on 2% of traffic. Roll back, then investigate safely.",
    awsCallout: { service: 'SageMaker Deployment Guardrails', desc: 'with automatic rollback triggers — configure a CloudWatch alarm on error rate > 1% to roll back the endpoint to the previous variant automatically, no on-call page required.' },
  },
  {
    id: 2,
    title: 'AUC-PR degradation — no recent deploys',
    alert: 'Model AUC-PR dropped from 0.847 to 0.831 over the past 3 days. No recent deploys.',
    correct: 'investigate',
    reasoning: 'Gradual metric degradation with no deploy is data drift, not a code bug. Rolling back won\'t help. Investigate: which features drifted? Is this seasonal? What changed upstream?',
    awsCallout: { service: 'SageMaker Model Monitor', desc: 'schedules continuous data quality and model quality monitoring jobs — set up a baseline from production traffic and alert when feature distributions exceed PSI thresholds.' },
  },
  {
    id: 3,
    title: 'Latency increase — Monday morning ramp',
    alert: 'p99 latency increased from 45ms to 62ms over the past 2 hours. Currently 8am Monday — traffic ramping up for start of business.',
    correct: 'monitor',
    reasoning: 'Traffic-correlated latency increase at start-of-business is expected. 62ms is still within SLA. Alert is noisy. No action until you\'re outside SLA or the pattern persists at stable traffic.',
    awsCallout: { service: 'SageMaker Endpoints', desc: 'auto-scaling policies adjust instance count based on InvocationsPerInstance — ensure your scaling policy has time to warm up before Monday peaks instead of treating the ramp as an incident.' },
  },
  {
    id: 4,
    title: '40% of predictions returning exactly 0.5000',
    alert: '40% of predictions are returning score exactly 0.5000 since the last feature pipeline deploy 30 minutes ago.',
    correct: 'rollback',
    reasoning: 'Predictions collapsing to a single constant value = feature pipeline is broken, likely returning null/zero features. Not a model problem — a data problem. Rollback the pipeline deploy.',
    awsCallout: { service: 'SageMaker Feature Store', desc: 'version-controlled feature groups let you roll back the pipeline to a previous ingestion snapshot while you debug the broken feature compute logic.' },
  },
  {
    id: 5,
    title: 'Business metric down 8%, model metrics unchanged',
    alert: 'Business metric (conversion rate on ranked items) dropped 8% over the past week. Model metrics unchanged.',
    correct: 'investigate',
    reasoning: "Model metrics unchanged but business metric down = either (a) the feature the model optimizes doesn't correlate with conversion as expected, or (b) external factor (seasonality, competitor). Rollback won't fix it if the model is technically correct.",
    awsCallout: { service: 'SageMaker Experiments', desc: 'track the A/B split between model variants alongside business metrics in one place — makes it easier to rule out model causality before chasing external explanations.' },
  },
  {
    id: 6,
    title: 'Canary 5% showing 2x false positive rate',
    alert: 'New model version deployed to canary 5% shows false positive rate 2x the champion on the 5% slice.',
    correct: 'rollback',
    reasoning: "This is what canary is for — caught it at 5%. The 2x false positive rate would cause real user pain if promoted. Rollback the canary, investigate the eval set vs production distribution mismatch.",
    awsCallout: { service: 'SageMaker Deployment Guardrails', desc: 'canary mode with a false-positive-rate alarm would have triggered the automatic rollback before you needed a human decision — this is the automated form of what you just did manually.' },
  },
  {
    id: 7,
    title: 'Training job failed — model 26 hours old',
    alert: 'Model training job failed — no new model produced today. Current model is 26 hours old (daily retrain schedule).',
    correct: 'monitor',
    reasoning: "A single missed retrain rarely causes quality degradation. Monitor staleness. If model age > 48h and drift is detected, then escalate. Don't rollback — there's nothing to roll back to that's better.",
    awsCallout: { service: 'SageMaker Pipelines', desc: 'conditional step logic can skip promotion and send an alert when a training job fails, keeping the current production model live and paging the on-call only after the staleness threshold is crossed.' },
  },
  {
    id: 8,
    title: 'GPU memory up 40% after deploy — no OOM yet',
    alert: 'GPU memory usage on serving cluster increased 40% after latest deploy. No OOM errors yet but trending toward it.',
    correct: 'investigate',
    reasoning: 'Not a rollback trigger yet (no errors) but it\'s a pre-failure signal. Profile: did the new model use more memory? Is it a memory leak? Act before OOM hits.',
    awsCallout: { service: 'SageMaker Inference Recommender', desc: 'run a right-sizing job on the new model artifact to confirm its memory footprint before the next deploy — catches GPU memory bloat in pre-production rather than at 2am.' },
  },
]

function RollbackDecision() {
  const [picks, setPicks] = useState({})
  const [revealed, setRevealed] = useState({})
  const [active, setActive] = useState(0)

  const scenario = ROLLBACK_SCENARIOS[active]
  const pick = picks[scenario.id]
  const isRevealed = !!revealed[scenario.id]

  function choose(optId) {
    if (isRevealed) return
    setPicks(p => ({ ...p, [scenario.id]: optId }))
    setRevealed(r => ({ ...r, [scenario.id]: true }))
  }

  const answered = Object.keys(revealed).length
  const score = ROLLBACK_SCENARIOS.filter(s => picks[s.id] === s.correct).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ ...grotesk, fontSize: '18px', fontWeight: 800, color: 'var(--rose)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          Rollback Decision
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Eight production alerts. For each: decide whether to rollback now, investigate first, or take no action.
        </p>
      </div>

      {/* Alert nav */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {ROLLBACK_SCENARIOS.map((s, i) => {
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

      {/* Alert card */}
      <div className="card" style={{ padding: '20px', borderLeft: '3px solid var(--rose)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ ...mono, fontSize: '11px', color: 'var(--rose)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Alert {scenario.id} / {ROLLBACK_SCENARIOS.length}
          </span>
        </div>
        <div style={{ ...grotesk, fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          {scenario.title}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
          {scenario.alert}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
        {ROLLBACK_OPTIONS.map(opt => {
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                {ROLLBACK_OPTIONS.find(o => o.id === scenario.correct)?.label}:
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
        <button className="btn-secondary" onClick={() => setActive(a => Math.min(ROLLBACK_SCENARIOS.length - 1, a + 1))} disabled={active === ROLLBACK_SCENARIOS.length - 1}>
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── ForwardPointer ───────────────────────────────────────────────────────────
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

// ─── Tab shell ────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'deploy',    label: 'Deployment Strategy',  icon: '', component: DeployStrategy },
  { id: 'champion',  label: 'Champion-Challenger',  icon: '', component: ChampionChallenger },
  { id: 'rollback',  label: 'Rollback Decision',    icon: '', component: RollbackDecision },
]

export default function MLOpsDeployTab({ onNavigate }) {
  const [active, setActive] = useState('deploy')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? DeployStrategy

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ ...grotesk, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--rose) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            MLOps: Deploy & Promote
          </h1>
          <span style={{ ...pill('var(--rose)'), fontSize: '12px' }}>MLOps</span>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '600px' }}>
          Deployment strategy, champion-challenger promotion, and rollback decisions. The judgment calls that separate careful operators from cowboy deploys.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
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

      {onNavigate && <ForwardPointer label="Practice deployment decisions in Combinator" tab="combinator" onNavigate={onNavigate} accent="var(--ember)" />}
    </div>
  )
}
