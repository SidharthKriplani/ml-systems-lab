import { useState, useEffect, useRef, useCallback } from 'react'
import { TRAINER_QUESTIONS, EXAM_ONLY_MCQ } from '../data/questionBank.js'
import { trackModuleComplete } from '../analytics'
import FidelityBadge from '../components/FidelityBadge.jsx'
import HowToStrip from '../components/HowToStrip.jsx'

// ─── Question Bank ──────────────────────────────────────────────────────────

const MCQ_QUESTIONS = [...TRAINER_QUESTIONS.map(q => ({ ...q, id: 'T' + q.id, type: 'mcq' })), ...EXAM_ONLY_MCQ]

const SA_QUESTIONS = [
  { id: 'SA1', domain: 'Feature Engineering', type: 'sa',
    q: 'Explain the difference between covariate shift and concept drift. Give a production example of each.',
    modelAnswer: 'Covariate shift: P(X) changes but P(Y|X) stays the same. Example: new user cohort from a marketing campaign has different age distribution but same purchase intent given demographics. Concept drift: P(Y|X) changes. Example: CTR model trained pre-COVID predicts irrelevant items post-COVID because user interest patterns fundamentally changed. Covariate shift: recalibrate or retrain on new distribution. Concept drift: must retrain — model\'s learned relationship is stale.' },
  { id: 'SA2', domain: 'ML Systems', type: 'sa',
    q: 'Describe how you would implement a real-time fraud scoring system. What are the key latency bottlenecks?',
    modelAnswer: 'Architecture: client → API gateway → feature retrieval (Redis for user history, device fingerprint) → GBT model inference → rules engine → decision. Latency breakdown: network to Redis ~2ms, feature assembly ~1ms, GBT inference ~5ms, total ~10ms. Bottlenecks: (1) Redis round-trips — batch all feature lookups in one pipeline call. (2) Cold cache — warm user features proactively. (3) Model size — use quantized GBT, benchmark with hardware profiling. (4) Rules engine — implement as lookup table not sequential if-else.' },
  { id: 'SA3', domain: 'Statistics', type: 'sa',
    q: 'When would you use a non-parametric test instead of a t-test? Give two examples.',
    modelAnswer: 'Use non-parametric when: (1) Normality assumption violated (heavy-tailed distributions, ordinal data). (2) Small sample where CLT hasn\'t kicked in. (3) Outliers that would distort means. Examples: (1) Mann-Whitney U test for comparing session duration (right-skewed) between A and B groups — uses rank ordering, robust to outliers. (2) Wilcoxon signed-rank for paired pre/post measurements (e.g., satisfaction scores 1-5 before/after feature change) — ordinal scale doesn\'t support t-test.' },
  { id: 'SA4', domain: 'Deep Learning', type: 'sa',
    q: 'What is catastrophic forgetting in neural networks? How do you mitigate it?',
    modelAnswer: 'Catastrophic forgetting: when a neural network trained on task B forgets task A because gradient updates overwrite the weights important for A. Critical in continual/lifelong learning. Mitigations: (1) Elastic Weight Consolidation (EWC) — penalize changes to weights important for previous tasks (Fisher information diagonal as penalty). (2) Replay/experience replay — maintain a buffer of previous task examples, mix into new training. (3) Progressive Neural Networks — freeze old task columns, add new lateral columns. (4) In RecSys: retrain periodically with a mix of recent + historical data to prevent forgetting long-term patterns.' },
  { id: 'SA5', domain: 'MLOps', type: 'sa',
    q: 'Explain the concept of a model card. What should it contain?',
    modelAnswer: 'Model card: standardized documentation artifact for a trained ML model (Mitchell et al., Google 2019). Contents: (1) Model details: architecture, training date, version, authors. (2) Intended use: primary use cases, out-of-scope uses. (3) Training data: data sources, preprocessing, date range. (4) Evaluation results: metrics on overall and demographic subgroups. (5) Ethical considerations: potential biases, fairness analysis. (6) Caveats and limitations: known failure modes, performance on edge cases. (7) Quantitative analysis: disaggregated evaluation across factors (gender, age, geography). Purpose: transparency, responsible AI documentation, regulatory compliance.' },
  { id: 'SA6', domain: 'Ranking', type: 'sa',
    q: 'What is position bias in click data and how do you correct for it in training?',
    modelAnswer: 'Position bias: items shown at top of results get more clicks regardless of relevance (users rarely scroll). Naive training on clicks yields a model that just re-ranks by position. Correction methods: (1) Inverse Propensity Scoring (IPS): weight each click by 1/propensity(position) where propensity is empirically estimated click rate at position k on neutral items. (2) Randomization: inject random ranking on small traffic slice to observe true propensities. (3) Examination hypothesis: clicks ~ Examination(position) × Relevance(item). Estimate both via EM algorithm (Joachims et al.). (4) Unbiased LambdaMART: directly incorporates propensity weights in listwise objective.' },
  { id: 'SA7', domain: 'Experiment Design', type: 'sa',
    q: 'Your experiment has 95% power and p=0.06. Your manager asks to extend the experiment to get p<0.05. What do you tell them?',
    modelAnswer: 'This is p-hacking / optional stopping. Concerns: (1) The critical value α=0.05 was set before the experiment. Changing the stopping rule post-hoc inflates the true Type I error far above 5%. (2) With 95% power, if the true effect were real, p=0.06 suggests the effect is near or below the pre-specified MDE — possibly not practically significant. Alternatives: (1) Pre-register a Bayesian update with a new experiment using updated priors from this result. (2) Use sequential testing (mSPRT) prospectively in future experiments to allow valid peeking. (3) Report the result honestly: p=0.06, 95% CI [a, b], effect size X%. Let stakeholders decide on practical significance vs. rerunning.' },
  { id: 'SA8', domain: 'SQL', type: 'sa',
    q: 'Write a SQL query to find the top 3 users by revenue in each country for the last 30 days.',
    modelAnswer: 'WITH ranked AS (\n  SELECT\n    u.country,\n    u.user_id,\n    SUM(o.revenue) AS total_revenue,\n    ROW_NUMBER() OVER (\n      PARTITION BY u.country\n      ORDER BY SUM(o.revenue) DESC\n    ) AS rn\n  FROM orders o\n  JOIN users u ON o.user_id = u.user_id\n  WHERE o.created_at >= CURRENT_DATE - INTERVAL \'30 days\'\n  GROUP BY u.country, u.user_id\n)\nSELECT country, user_id, total_revenue\nFROM ranked\nWHERE rn <= 3\nORDER BY country, rn;\n\nKey points: CTE with window function ROW_NUMBER PARTITION BY country, ORDER BY revenue DESC. Filter before aggregation for performance.' },
  { id: 'SA9', domain: 'Systems', type: 'sa',
    q: 'Describe the CAP theorem and its implications for a distributed feature store.',
    modelAnswer: 'CAP theorem: a distributed system can guarantee at most 2 of: Consistency (all nodes see same data), Availability (every request gets a response), Partition tolerance (system works despite network splits). Partition tolerance is non-negotiable in distributed systems. So: CP (consistent but may be unavailable during partition) vs. AP (available but may return stale data). Feature store implications: (1) Online serving (Redis): typically AP — prefer availability and tolerate stale features over serving errors. A slightly stale user embedding is better than a 500 error. (2) Offline training (Delta/Hive): typically CP — consistency matters for reproducible training. (3) Feature updates: eventual consistency with bounded staleness (e.g., max 60s stale) — configurable per feature SLA.' },
  { id: 'SA10', domain: 'Optimization', type: 'sa',
    q: 'Explain mixed-precision training. What are the risks and how are they mitigated?',
    modelAnswer: 'Mixed precision: store weights/activations in FP16 (half precision) for speed and memory, but maintain master copy in FP32 for numerical stability. Speedup: 2-8x on modern GPUs with Tensor Cores. Memory: ~2x reduction. Risks: (1) Underflow — FP16 range is [6e-5, 65504]; very small gradients underflow to zero. Mitigation: loss scaling (multiply loss by scale factor before backward, unscale before optimizer step). (2) Gradient explosion — FP16 has limited range; large gradients overflow. Mitigation: dynamic loss scaling (automatically adjust scale factor). (3) Accumulation errors in batch norm, softmax — keep these in FP32. Implementation: PyTorch torch.cuda.amp.autocast() with GradScaler.' },
]

const DURATION_CONFIG = {
  30: { label: '30 min', totalQ: 20 },
  45: { label: '45 min', totalQ: 35 },
  60: { label: '60 min', totalQ: 50 },
}

function buildQuestionSet(totalQ) {
  const mcqCount = Math.round(totalQ * 0.8)
  const saCount = totalQ - mcqCount

  const shuffledMCQ = [...MCQ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, mcqCount)
  const shuffledSA = [...SA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, saCount)
  return [...shuffledMCQ, ...shuffledSA]
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ─── Component ──────────────────────────────────────────────────────────────

// ── Company Tracks ────────────────────────────────────────────────────────────
const COMPANY_TRACKS = [
  {
    id: 'google_mle',
    label: 'Google MLE',
    desc: 'System Design + Spark + MLOps heavy. Production scale, latency constraints.',
    domains: ['ML Systems', 'MLOps', 'Optimization', 'Model Evaluation'],
    icon: 'G',
    domain: 'google.com',
  },
  {
    id: 'meta_mle',
    label: 'Meta MLE',
    desc: 'Feature Engineering + Model Eval + ranking systems + A/B at scale.',
    domains: ['Feature Engineering', 'Model Evaluation', 'Ranking & Retrieval', 'Experiment Design'],
    icon: 'M',
    domain: 'meta.com',
  },
  {
    id: 'stripe_ds',
    label: 'Stripe DS',
    desc: 'Causal inference, A/B testing, fraud modeling, business metrics.',
    domains: ['Statistics & Probability', 'Model Evaluation', 'MLOps', 'Experiment Design'],
    icon: 'S',
    domain: 'stripe.com',
  },
  {
    id: 'startup_ml',
    label: 'Startup/Growth',
    desc: 'Full-stack ML: features → model → deploy → monitor. Breadth over depth.',
    domains: ['Feature Engineering', 'MLOps', 'Model Evaluation', 'ML Systems'],
    icon: 'L',
    domain: null,
  },
]

function CompanyLogo({ domain, fallback, size = 24, radius = 6 }) {
  if (!domain) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: radius, background: 'var(--depth)', border: '1px solid var(--rim)', fontSize: size * 0.45, fontWeight: 700, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>
        {fallback}
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, borderRadius: radius, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--rim)', flexShrink: 0 }}>
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain', display: 'block' }}
        onError={e => {
          e.target.style.display = 'none'
          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
        }}
      />
      <span style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: size * 0.45, fontWeight: 700, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>{fallback}</span>
    </span>
  )
}

// ── Coming Soon ───────────────────────────────────────────────────────────────
const COMING_SOON = []

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

export default function CombinatorTab({ onNavigate }) {
  // ── Restore saved session from localStorage ──
  const _saved = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('msl_combinator_session') || 'null')
      if (!s) return null
      if (s.savedAt) {
        const elapsed = Math.floor((Date.now() - s.savedAt) / 1000)
        s.timeLeft = Math.max(0, (s.timeLeft || 0) - elapsed)
      }
      return s
    } catch(_) { return null }
  })()

  const [screen, setScreen] = useState(_saved?.screen || 'config')
  const [duration, setDuration] = useState(_saved?.duration || 30)
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [challengeMode, setChallengeMode] = useState(false)
  const [questions, setQuestions] = useState(() => {
    if (!_saved?.questionIds) return []
    const allQ = [...MCQ_QUESTIONS, ...SA_QUESTIONS]
    return _saved.questionIds.map(id => allQ.find(q => String(q.id) === String(id))).filter(Boolean)
  })
  const [currentIdx, setCurrentIdx] = useState(_saved?.currentIdx || 0)
  const [userAnswers, setUserAnswers] = useState(_saved?.userAnswers || {})
  const [timeLeft, setTimeLeft] = useState(_saved?.timeLeft || 0)
  const [timePerQuestion, setTimePerQuestion] = useState(_saved?.timePerQuestion || {})
  const [sessionStarted, setSessionStarted] = useState(_saved?.screen === 'session')
  const [selfRatings, setSelfRatings] = useState(_saved?.selfRatings || {})
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [totalTimeUsed, setTotalTimeUsed] = useState(0)
  const [copied, setCopied] = useState(false)

  const questionStartRef = useRef(null)
  const timerRef = useRef(null)

  // ── Config → Session ──
  function startSession() {
    const cfg = DURATION_CONFIG[duration]
    let totalQ = cfg.totalQ
    if (challengeMode) totalQ = Math.max(totalQ, 20)

    let qs
    if (challengeMode) {
      // Force all domains, interleave to ensure breadth
      const allMCQ = [...MCQ_QUESTIONS].sort(() => Math.random() - 0.5)
      const mcqCount = Math.round(totalQ * 0.8)
      const saCount = totalQ - mcqCount
      const shuffledSA = [...SA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, saCount)
      qs = [...allMCQ.slice(0, mcqCount), ...shuffledSA]
    } else if (selectedTrack) {
      const trackDomains = new Set(selectedTrack.domains)
      const filteredMCQ = MCQ_QUESTIONS.filter(q => trackDomains.has(q.domain))
      const shuffledMCQ = [...filteredMCQ].sort(() => Math.random() - 0.5)
      const mcqCount = Math.round(totalQ * 0.8)
      const saCount = totalQ - mcqCount
      const shuffledSA = [...SA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, saCount)
      qs = [...shuffledMCQ.slice(0, mcqCount), ...shuffledSA]
    } else {
      qs = buildQuestionSet(totalQ)
    }

    setQuestions(qs)
    setCurrentIdx(0)
    setUserAnswers({})
    setTimePerQuestion({})
    setTimeLeft(duration * 60)
    setSessionStarted(true)
    setShowEndConfirm(false)
    questionStartRef.current = Date.now()
    try { localStorage.removeItem('msl_combinator_session') } catch(_) {}
    setScreen('session')
  }

  // ── Timer ──
  useEffect(() => {
    if (screen !== 'session') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          endSession(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [screen])

  // ── Persist session to localStorage ──
  useEffect(() => {
    if (screen !== 'session') return
    try {
      localStorage.setItem('msl_combinator_session', JSON.stringify({
        screen, duration,
        questionIds: questions.map(q => q.id),
        currentIdx, userAnswers, timeLeft, timePerQuestion, selfRatings,
        savedAt: Date.now(),
      }))
    } catch(_) {}
  }, [screen, currentIdx, userAnswers, timeLeft, selfRatings])

  // ── Track time per question ──
  const recordQuestionTime = useCallback((idx) => {
    if (questionStartRef.current !== null) {
      const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
      setTimePerQuestion(prev => ({
        ...prev,
        [idx]: (prev[idx] || 0) + elapsed,
      }))
    }
    questionStartRef.current = Date.now()
  }, [])

  function navigateTo(idx) {
    recordQuestionTime(currentIdx)
    setCurrentIdx(idx)
  }

  function endSession(auto = false) {
    clearInterval(timerRef.current)
    recordQuestionTime(currentIdx)
    const cfg = DURATION_CONFIG[duration]
    const used = cfg.totalQ * 60 - (auto ? 0 : timeLeft) // fallback
    setTotalTimeUsed(duration * 60 - (auto ? 0 : timeLeft))
    setShowEndConfirm(false)
    try { localStorage.removeItem('msl_combinator_session') } catch(_) {}
    saveToHistory()
    const mcqs = questions.filter(q => q.type === 'mcq')
    const correct = mcqs.filter((q) => userAnswers[questions.indexOf(q)] !== undefined && parseInt(userAnswers[questions.indexOf(q)]) === q.correct).length
    trackModuleComplete('combinator_session', 'combinator', mcqs.length > 0 ? Math.round((correct / mcqs.length) * 100) : null)
    setScreen('debrief')
  }

  function saveToHistory() {
    const mcqs = questions.filter(q => q.type === 'mcq')
    const correctCount = mcqs.filter((q, i) => {
      const globalIdx = questions.indexOf(q)
      return userAnswers[globalIdx] !== undefined && parseInt(userAnswers[globalIdx]) === q.correct
    }).length

    const domainBreakdown = {}
    mcqs.forEach(q => {
      const idx = questions.indexOf(q)
      if (!domainBreakdown[q.domain]) domainBreakdown[q.domain] = { correct: 0, total: 0 }
      domainBreakdown[q.domain].total++
      if (userAnswers[idx] !== undefined && parseInt(userAnswers[idx]) === q.correct) {
        domainBreakdown[q.domain].correct++
      }
    })

    const record = {
      date: new Date().toISOString(),
      duration,
      score: correctCount,
      total: mcqs.length,
      domainBreakdown,
    }

    try {
      const existing = JSON.parse(localStorage.getItem('msl_combinator_history') || '[]')
      existing.push(record)
      localStorage.setItem('msl_combinator_history', JSON.stringify(existing.slice(-50)))
    } catch (_) {}
  }

  // ── Timer color ──
  const timerColor = timeLeft < 60 ? 'var(--prime)' : timeLeft < 300 ? 'var(--prime)' : 'var(--prime)'
  const timerPulse = timeLeft < 60

  // ── MCQ score for debrief ──
  const mcqQuestions = questions.filter(q => q.type === 'mcq')
  const correctCount = mcqQuestions.filter(q => {
    const idx = questions.indexOf(q)
    return userAnswers[idx] !== undefined && parseInt(userAnswers[idx]) === q.correct
  }).length
  const answeredCount = Object.keys(userAnswers).length

  // ── Domain breakdown ──
  const domainStats = {}
  mcqQuestions.forEach(q => {
    const idx = questions.indexOf(q)
    if (!domainStats[q.domain]) domainStats[q.domain] = { correct: 0, total: 0 }
    domainStats[q.domain].total++
    if (userAnswers[idx] !== undefined && parseInt(userAnswers[idx]) === q.correct) {
      domainStats[q.domain].correct++
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 1: CONFIG
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'config') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .combinator-pulse { animation: pulse 0.8s ease-in-out infinite; }
        `}</style>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 55%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Combinator</h1>
          <p style={{ color: 'var(--ink-mid)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Timed mock session — all answers locked until time ends
          </p>
          <p style={{ color: 'var(--ink-low)', marginTop: '0.5rem', fontSize: '0.825rem', lineHeight: 1.55, fontFamily: 'var(--font-sans)', maxWidth: '520px' }}>
            Choose a duration, then start the session. Questions are served one at a time — you can't change a submitted answer. When time runs out (or you end early), review your domain breakdown in the debrief.
          </p>
          <div style={{ marginTop: '8px' }}><FidelityBadge tier="conceptual" /></div>
        </div>
        <HowToStrip
          skill="Full mock interview exam under time pressure"
          steps={['Set your duration — answers lock when time ends', 'Answer every question without peeking at results', 'Review your per-domain debrief after the session']}
        />

        {_saved?.screen === 'session' && (
          <div style={{
            padding: '0.875rem 1rem', borderRadius: 8, marginBottom: '1.5rem',
            background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          }}>
            <div>
              <div style={{ color: 'var(--prime)', fontWeight: 700, fontSize: '0.9rem' }}>Session in progress</div>
              <div style={{ color: 'var(--ink-mid)', fontSize: '0.8rem', marginTop: '2px' }}>
                {Math.floor(_saved.timeLeft / 60)}:{String(_saved.timeLeft % 60).padStart(2,'0')} remaining · {Object.keys(_saved.userAnswers || {}).length}/{_saved.questionIds?.length || 0} answered
              </div>
            </div>
            <button onClick={() => {
              setScreen('session')
            }} style={{
              padding: '0.5rem 1rem', borderRadius: 6, background: 'var(--prime)',
              border: 'none', color: 'var(--void)', fontFamily: 'var(--font-sans)',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', flexShrink: 0,
            }}>Resume →</button>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--ink-mid)', fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Session Duration
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {Object.entries(DURATION_CONFIG).map(([mins, cfg]) => (
              <button
                key={mins}
                onClick={() => setDuration(parseInt(mins))}
                style={{
                  flex: 1,
                  padding: '1.25rem 1rem',
                  borderRadius: 10,
                  border: `2px solid ${duration === parseInt(mins) ? 'var(--prime)' : 'var(--rim)'}`,
                  background: duration === parseInt(mins) ? 'rgba(240,165,0,0.15)' : 'var(--surface)',
                  cursor: 'pointer',
                  color: duration === parseInt(mins) ? 'var(--prime)' : 'var(--ink-mid)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{cfg.label}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.7 }}>{cfg.totalQ} questions</div>
              </button>
            ))}
          </div>
        </div>

        {/* Company Tracks */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
            Company Track <span style={{ color: 'var(--ink-ghost)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
            {COMPANY_TRACKS.map(track => {
              const active = selectedTrack?.id === track.id
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    if (active) {
                      setSelectedTrack(null)
                    } else {
                      setSelectedTrack(track)
                      if (challengeMode) setChallengeMode(false)
                    }
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '0.85rem 1rem',
                    borderRadius: 10,
                    border: `2px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
                    background: active ? 'rgba(240,165,0,0.1)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <CompanyLogo domain={track.domain} fallback={track.icon} size={26} radius={6} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: active ? 'var(--prime)' : 'var(--ink-hi)' }}>
                      {track.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-low)', margin: '0 0 0.45rem', lineHeight: 1.4 }}>
                    {track.desc}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {track.domains.map(d => (
                      <span key={d} style={{
                        fontSize: '0.68rem', padding: '0.15rem 0.45rem',
                        borderRadius: 4, background: 'var(--depth)',
                        color: active ? 'var(--prime)' : 'var(--ink-ghost)',
                        border: `1px solid ${active ? 'rgba(240,165,0,0.3)' : 'var(--rim)'}`,
                        fontFamily: 'var(--font-mono)',
                      }}>{d}</span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Challenge Mode toggle */}
        <button
          onClick={() => {
            setChallengeMode(prev => {
              const next = !prev
              if (next) setSelectedTrack(null)
              return next
            })
          }}
          style={{
            width: '100%',
            padding: '0.85rem 1rem',
            borderRadius: 10,
            border: `2px solid ${challengeMode ? 'var(--prime)' : 'var(--rim)'}`,
            background: challengeMode ? 'var(--prime-bg-light)' : 'var(--surface)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '1.5rem',
            transition: 'all 0.15s',
          }}
        >
          <span style={{
            fontSize: '1.1rem',
            filter: challengeMode ? 'none' : 'grayscale(1) opacity(0.5)',
          }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: challengeMode ? 'var(--prime)' : 'var(--ink-hi)' }}>
              Challenge Mode — All Domains
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-low)', marginTop: '0.15rem' }}>
              Forces all domains · 20 questions minimum · breadth test
            </div>
          </div>
          <div style={{
            marginLeft: 'auto',
            width: 36, height: 20, borderRadius: 10,
            background: challengeMode ? 'var(--prime)' : 'var(--rim)',
            position: 'relative', flexShrink: 0,
            transition: 'background 0.15s',
          }}>
            <div style={{
              position: 'absolute', top: 3,
              left: challengeMode ? 18 : 3,
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--void)',
              transition: 'left 0.15s',
            }} />
          </div>
        </button>

        <div style={{
          padding: '0.875rem 1rem',
          borderRadius: 8,
          background: 'rgba(249,115,22,0.15)',
          border: '1px solid rgba(249,115,22,0.25)',
          marginBottom: '1.75rem',
          fontSize: '0.875rem',
          color: 'var(--ink-mid)',
          lineHeight: 1.5,
        }}>
          <span style={{ color: 'var(--prime)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>{' '}
          All answers are locked until the timer runs out. You must attempt every question.
        </div>

        <button
          onClick={startSession}
          style={{
            width: '100%',
            padding: '0.9rem',
            borderRadius: 8,
            background: 'var(--prime)',
            border: 'none',
            color: 'var(--void)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          Start Session
        </button>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 2: SESSION
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'session') {
    const currentQ = questions[currentIdx]
    const isMCQ = currentQ?.type === 'mcq'
    const selectedOption = userAnswers[currentIdx]

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1rem' }}>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .combinator-pulse { animation: pulse 0.8s ease-in-out infinite; }
        `}</style>

        {/* Challenge mode badge */}
        {challengeMode && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.75rem', borderRadius: 99, marginBottom: '0.75rem',
            background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', color: 'var(--prime)' }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--prime)', letterSpacing: '0.04em' }}>
              Cross-Domain Challenge
            </span>
          </div>
        )}

        {/* Timer + progress header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ color: 'var(--ink-low)', fontSize: '0.85rem' }}>
            Q {currentIdx + 1} of {questions.length}
          </span>
          <div
            className={timerPulse ? 'combinator-pulse' : undefined}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              fontWeight: 700,
              color: timerColor,
              letterSpacing: '0.05em',
              lineHeight: 1,
            }}
          >
            {formatTime(timeLeft)}
          </div>
          <span style={{ color: 'var(--ink-low)', fontSize: '0.85rem' }}>
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        {/* Question navigator */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          marginBottom: '1.25rem',
          scrollbarWidth: 'thin',
        }}>
          {questions.map((_, idx) => {
            const isActive = idx === currentIdx
            const isAnswered = userAnswers[idx] !== undefined && userAnswers[idx] !== ''
            return (
              <button
                key={idx}
                onClick={() => navigateTo(idx)}
                style={{
                  minWidth: 40,
                  height: 40,
                  borderRadius: 8,
                  border: isActive ? '2px solid var(--prime)' : '1px solid var(--rim)',
                  background: isActive ? 'rgba(240,165,0,0.15)' : 'var(--surface)',
                  color: isActive ? 'var(--prime)' : isAnswered ? 'var(--prime)' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.1s',
                }}
              >
                {idx + 1}
                {isAnswered && !isActive && (
                  <span style={{
                    position: 'absolute',
                    top: -3,
                    right: -3,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--prime)',
                    display: 'block',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Question card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: 12,
          padding: '1.5rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.6rem',
              borderRadius: 4,
              background: 'var(--prime-bg-light)',
              border: '1px solid rgba(240,165,0,0.2)',
              color: 'var(--prime)',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
            }}>
              {currentQ?.domain}
            </span>
            <p style={{ color: 'var(--ink-hi)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
              {currentQ?.whatsTested && <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderLeft: '3px solid var(--prime)', borderRadius: 7, padding: '0.4rem 0.75rem', marginBottom: '0.65rem' }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)' }}>Testing: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)' }}>{currentQ.whatsTested}</span></div>}
              {currentQ?.q}
            </p>
          </div>

          {isMCQ ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedOption !== undefined && parseInt(selectedOption) === optIdx
                return (
                  <button
                    key={optIdx}
                    onClick={() => setUserAnswers(prev => ({ ...prev, [currentIdx]: String(optIdx) }))}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 8,
                      border: isSelected ? '2px solid var(--rim)' : '1px solid var(--rim)',
                      background: isSelected ? 'rgba(52,46,40,0.6)' : 'var(--depth)',
                      color: isSelected ? 'var(--ink-hi)' : 'var(--ink-mid)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                      outline: isSelected ? '1px solid rgba(240,165,0,0.15)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--ink-low)', marginRight: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {['A', 'B', 'C', 'D'][optIdx]}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          ) : (
            <textarea
              value={userAnswers[currentIdx] || ''}
              onChange={e => setUserAnswers(prev => ({ ...prev, [currentIdx]: e.target.value }))}
              placeholder="Type your answer here..."
              style={{
                width: '100%',
                minHeight: 100,
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid var(--rim)',
                background: 'var(--depth)',
                color: 'var(--ink-hi)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
                lineHeight: 1.6,
              }}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigateTo(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 7,
              border: '1px solid var(--rim)',
              background: 'var(--surface)',
              color: currentIdx === 0 ? 'var(--ink-ghost)' : 'var(--ink-mid)',
              fontFamily: 'var(--font-sans)',
              cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
            }}
          >
            ← Prev
          </button>

          <button
            onClick={() => setShowEndConfirm(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 7,
              border: '1px solid var(--rim)',
              background: 'transparent',
              color: 'var(--ink-low)',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            End Session Early
          </button>

          <button
            onClick={() => navigateTo(Math.min(questions.length - 1, currentIdx + 1))}
            disabled={currentIdx === questions.length - 1}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 7,
              border: '1px solid var(--rim)',
              background: 'var(--surface)',
              color: currentIdx === questions.length - 1 ? 'var(--ink-ghost)' : 'var(--ink-mid)',
              fontFamily: 'var(--font-sans)',
              cursor: currentIdx === questions.length - 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Next →
          </button>
        </div>

        {/* Confirm end modal */}
        {showEndConfirm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(12,10,8,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--rim)',
              borderRadius: 12, padding: '1.75rem', maxWidth: 380, width: '90%',
            }}>
              <h3 style={{ color: 'var(--ink-hi)', marginTop: 0 }}>End session early?</h3>
              <p style={{ color: 'var(--ink-mid)', fontSize: '0.9rem' }}>
                You have {formatTime(timeLeft)} remaining. Unanswered questions will be marked incomplete.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  onClick={() => endSession(false)}
                  style={{
                    flex: 1, padding: '0.65rem', borderRadius: 7,
                    background: 'var(--ink-low)', border: 'none',
                    color: 'var(--white)', fontFamily: 'var(--font-sans)',
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  End Session
                </button>
                <button
                  onClick={() => setShowEndConfirm(false)}
                  style={{
                    flex: 1, padding: '0.65rem', borderRadius: 7,
                    background: 'var(--depth)', border: '1px solid var(--rim)',
                    color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                  }}
                >
                  Keep Going
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 3: DEBRIEF
  // ───────────────────────────────────────────────────────────────────────────
  if (screen === 'debrief') {
    const pct = mcqQuestions.length > 0 ? Math.round((correctCount / mcqQuestions.length) * 100) : 0
    const scoreColor = 'var(--prime)'
    const weakestDomain = Object.entries(domainStats)
      .sort((a, b) => (a[1].correct / Math.max(a[1].total,1)) - (b[1].correct / Math.max(b[1].total,1)))[0]?.[0] || ''
    function handleShare() {
      const text = `ML Systems Lab Combinator: ${correctCount}/${mcqQuestions.length} · ${pct}% · Weak: ${weakestDomain} → ml-systems-lab-v9xe.vercel.app`
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
    }

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        {/* Header */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: 12,
          padding: '1.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-mono)' }}>
            {pct}%
          </div>
          <div style={{ color: 'var(--ink-mid)', marginTop: '0.25rem', fontSize: '1rem' }}>
            {correctCount} / {mcqQuestions.length} MCQ correct
          </div>
          <div style={{ color: 'var(--ink-low)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            {questions.length} total questions · {duration} min session
          </div>
          {challengeMode && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.25rem 0.65rem', borderRadius: 99, marginTop: '0.5rem',
              background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--prime)', display: 'flex', alignItems: 'center', gap: '3px' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Cross-Domain</span>
            </div>
          )}
          {selectedTrack && !challengeMode && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.25rem 0.65rem', borderRadius: 99, marginTop: '0.5rem',
              background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--prime)' }}>{selectedTrack.icon} {selectedTrack.label} Track</span>
            </div>
          )}
          <button onClick={handleShare} style={{
            marginTop: '1rem', background: 'none', border: '1px solid var(--rim)',
            borderRadius: 8, padding: '0.45rem 1.1rem', fontSize: '0.82rem',
            color: copied ? 'var(--prime)' : 'var(--ink-mid)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', transition: 'color 0.2s',
          }}>
            {copied ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg> Copied!' : '⎘ Share Score'}
          </button>
        </div>

        {/* Domain breakdown */}
        {mcqQuestions.length > 0 && (
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="section-eyebrow" style={{ marginBottom: '0.75rem' }}>
              Domain Breakdown
            </div>
            {Object.entries(domainStats)
              .map(([domain, stats]) => [domain, stats, stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0])
              .sort((a, b) => a[2] - b[2])
              .map(([domain, stats, pct]) => {
                const barColor = 'var(--prime)'
                return (
                  <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '110px', fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', flexShrink: 0, textAlign: 'right' }}>{domain}</div>
                    <div style={{ flex: 1, height: '8px', background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                    </div>
                    <div style={{ width: '48px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: barColor, flexShrink: 0 }}>{stats.correct}/{stats.total}</div>
                  </div>
                )
              })
            }
          </div>
        )}

        {/* MCQ review */}
        <h3 style={{ color: 'var(--ink-hi)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          MCQ Review
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
          {mcqQuestions.map((q) => {
            const idx = questions.indexOf(q)
            const userAns = userAnswers[idx]
            const userIdx = userAns !== undefined ? parseInt(userAns) : null
            const isCorrect = userIdx === q.correct
            const timeSpent = timePerQuestion[idx] || 0

            return (
              <div key={q.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.2)' : userIdx !== null ? 'rgba(244,63,94,0.2)' : 'var(--rim)'}`,
                borderRadius: 10,
                padding: '1rem 1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--prime)', fontWeight: 600 }}>{q.domain}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>
                    {timeSpent}s
                  </span>
                </div>
                <p style={{ color: 'var(--ink-hi)', fontSize: '0.9rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{q.q}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {q.options.map((opt, optIdx) => {
                    const isCorrectOpt = optIdx === q.correct
                    const isUserOpt = optIdx === userIdx
                    let bg = 'transparent'
                    let color = 'var(--ink-low)'
                    let border = '1px solid transparent'
                    if (isCorrectOpt) { bg = 'rgba(52,211,153,0.1)'; color = 'var(--mint)'; border = '1px solid rgba(52,211,153,0.3)' }
                    if (isUserOpt && !isCorrectOpt) { bg = 'rgba(244,63,94,0.1)'; color = 'var(--rose)'; border = '1px solid rgba(244,63,94,0.3)' }
                    return (
                      <div key={optIdx} style={{
                        padding: '0.4rem 0.75rem', borderRadius: 8,
                        background: bg, border, color, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                      }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', opacity: 0.7 }}>
                          {['A', 'B', 'C', 'D'][optIdx]}
                        </span>
                        {opt}
                        {isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>correct</span>}
                        {isUserOpt && !isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>your answer</span>}
                      </div>
                    )
                  })}
                </div>

                {userIdx === null && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-low)', margin: '0 0 0.5rem' }}>Not attempted</p>
                )}

                <div style={{
                  padding: '0.6rem 0.75rem',
                  background: 'var(--depth)',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  color: 'var(--ink-mid)',
                  lineHeight: 1.55,
                }}>
                  <span style={{ color: 'var(--prime)', fontWeight: 600, marginRight: '0.4rem' }}>Explanation:</span>
                  {q.explanation}
                  {q.antiPattern && <div style={{ marginTop: '0.55rem', padding: '0.4rem 0.65rem', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.17)', borderLeft: '3px solid var(--rose)', borderRadius: 7 }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--rose)' }}>Trap: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)' }}>{q.antiPattern}</span></div>}
                  {q.staffFraming && <div style={{ marginTop: '0.35rem', padding: '0.4rem 0.65rem', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.16)', borderLeft: '3px solid rgba(139,92,246,0.55)', borderRadius: 7 }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(139,92,246,0.85)' }}>Senior frame: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)' }}>{q.staffFraming}</span></div>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Short-answer review */}
        {questions.filter(q => q.type === 'sa').length > 0 && (
          <>
            <h3 style={{ color: 'var(--ink-hi)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Short-Answer Review
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.75rem' }}>
              {questions.filter(q => q.type === 'sa').map((q) => {
                const idx = questions.indexOf(q)
                const userAns = userAnswers[idx] || ''
                const rating = selfRatings[idx] || 0
                const timeSpent = timePerQuestion[idx] || 0

                return (
                  <div key={q.id} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--rim)',
                    borderRadius: 10,
                    padding: '1rem 1.25rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--prime)', fontWeight: 600 }}>{q.domain}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>
                        {timeSpent}s
                      </span>
                    </div>
                    <p style={{ color: 'var(--ink-hi)', fontSize: '0.9rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{q.q}</p>

                    {userAns && (
                      <div style={{
                        padding: '0.65rem 0.75rem',
                        background: 'rgba(240,165,0,0.08)',
                        border: '1px solid rgba(240,165,0,0.15)',
                        borderRadius: 8,
                        fontSize: '0.85rem',
                        color: 'var(--ink-mid)',
                        lineHeight: 1.55,
                        marginBottom: '0.75rem',
                        whiteSpace: 'pre-wrap',
                      }}>
                        <span style={{ color: 'var(--prime)', fontWeight: 600, marginRight: '0.4rem' }}>Your answer:</span>
                        {userAns}
                      </div>
                    )}

                    <div style={{
                      padding: '0.65rem 0.75rem',
                      background: 'rgba(52,211,153,0.10)',
                      border: '1px solid rgba(52,211,153,0.15)',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      color: 'var(--ink-mid)',
                      lineHeight: 1.55,
                      marginBottom: '0.75rem',
                      whiteSpace: 'pre-wrap',
                    }}>
                      <span style={{ color: 'var(--prime)', fontWeight: 600, marginRight: '0.4rem' }}>Model answer:</span>
                      {q.modelAnswer}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-low)' }}>Self-rate:</span>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setSelfRatings(prev => ({ ...prev, [idx]: n }))}
                          style={{
                            width: 32, height: 40, borderRadius: 8,
                            border: rating >= n ? '1px solid var(--prime)' : '1px solid var(--rim)',
                            background: rating >= n ? 'rgba(240,165,0,0.15)' : 'var(--depth)',
                            color: rating >= n ? 'var(--prime)' : 'var(--ink-ghost)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {n}
                        </button>
                      ))}
                      {rating > 0 && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-low)' }}>
                          {['', 'Needs work', 'Getting there', 'Decent', 'Good', 'Nailed it'][rating]}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={startSession}
            style={{
              flex: 1, padding: '0.75rem',
              borderRadius: 8, background: 'var(--prime)',
              border: 'none', color: 'var(--void)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => setScreen('config')}
            style={{
              flex: 1, padding: '0.75rem',
              borderRadius: 8, background: 'var(--depth)',
              border: '1px solid var(--rim)', color: 'var(--ink-mid)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            New Config
          </button>
        </div>

        {onNavigate && <ForwardPointer label="Build your Defense Plan before the mock" tab="defense" onNavigate={onNavigate} accent="var(--prime)" />}
      </div>
    )
  }

  return null
}
