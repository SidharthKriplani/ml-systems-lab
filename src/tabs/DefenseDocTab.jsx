import { useState, useEffect } from 'react'

// ── Keyword map (JD parsing) ──────────────────────────────────────────────────
const KEYWORD_MAP = [
  { keywords: ['feature store', 'feast', 'tecton'], topic: 'Feature Stores', tab: 'features', tier: 'must', weight: 3 },
  { keywords: ['recommendation', 'ranking', 'retrieval', 'two-tower', 'embedding'], topic: 'Recommendation Systems', tab: 'design', tier: 'must', weight: 3 },
  { keywords: ['mlops', 'ml platform', 'model deployment', 'serving', 'inference'], topic: 'MLOps & Deployment', tab: 'mlops_deploy', tier: 'must', weight: 3 },
  { keywords: ['spark', 'pyspark', 'distributed training', 'dataproc'], topic: 'Distributed Compute (Spark)', tab: 'spark', tier: 'must', weight: 3 },
  { keywords: ['experiment', 'a/b test', 'causal', 'uplift'], topic: 'Experimentation & Causality', tab: 'causal', tier: 'must', weight: 3 },
  { keywords: ['monitoring', 'drift', 'data quality', 'observability'], topic: 'Model Monitoring', tab: 'monitor', tier: 'must', weight: 3 },
  { keywords: ['deep learning', 'neural network', 'pytorch', 'tensorflow', 'transformer'], topic: 'Deep Learning', tab: 'dl', tier: 'must', weight: 3 },
  { keywords: ['system design', 'architecture', 'scalable'], topic: 'ML System Design', tab: 'design', tier: 'must', weight: 3 },
  { keywords: ['gradient boosting', 'xgboost', 'lightgbm', 'gbm', 'trees'], topic: 'Classical ML & Ensembles', tab: 'classical', tier: 'important', weight: 2 },
  { keywords: ['evaluation', 'metrics', 'auc', 'ndcg', 'precision', 'recall'], topic: 'Model Evaluation', tab: 'eval', tier: 'important', weight: 2 },
  { keywords: ['pipeline', 'airflow', 'orchestration', 'dag', 'workflow'], topic: 'Pipelines & Orchestration', tab: 'airflow', tier: 'important', weight: 2 },
  { keywords: ['sql', 'query', 'warehouse', 'bigquery', 'snowflake', 'redshift'], topic: 'SQL & Data Modeling', tab: 'modeling', tier: 'important', weight: 2 },
  { keywords: ['fine-tuning', 'llm', 'language model', 'bert', 'gpt', 'rlhf'], topic: 'LLM Fine-Tuning', tab: 'dl_finetune', tier: 'important', weight: 2 },
  { keywords: ['data modeling', 'dbt', 'dimensional', 'star schema'], topic: 'Data Modeling & dbt', tab: 'dbt', tier: 'important', weight: 2 },
  { keywords: ['time series', 'forecasting', 'anomaly detection', 'arima'], topic: 'Time Series', tab: 'ts', tier: 'important', weight: 2 },
  { keywords: ['feature engineering', 'feature selection', 'imputation'], topic: 'Feature Engineering', tab: 'features', tier: 'important', weight: 2 },
  { keywords: ['statistics', 'hypothesis', 'bayesian', 'probability'], topic: 'Statistics & DS', tab: 'ds', tier: 'important', weight: 2 },
  { keywords: ['model math', 'optimization', 'gradient descent', 'backprop'], topic: 'Models & Math', tab: 'models', tier: 'good', weight: 1 },
  { keywords: ['triton', 'torchserve', 'bentoml', 'inference optimization'], topic: 'DL Serving', tab: 'dl_serving', tier: 'good', weight: 1 },
  { keywords: ['causal inference', 'did', 'iv', 'regression discontinuity'], topic: 'Causal Inference', tab: 'causal', tier: 'good', weight: 1 },
]

// ── Study checklist items per topic ──────────────────────────────────────────
const CHECKLISTS = {
  'Feature Stores': ['Online vs. offline store architecture', 'Point-in-time correct joins', 'Training-serving skew', 'Feast vs. Tecton tradeoffs'],
  'Recommendation Systems': ['Two-tower retrieval architecture', 'Cold-start strategies', 'ANN serving (FAISS/HNSW)', 'Re-ranking stage design', 'Offline recall@K vs. online CTR'],
  'MLOps & Deployment': ['CI/CD for ML models', 'Canary vs. shadow deployment', 'Model versioning and registry', 'Rollback triggers', 'A/B test integration'],
  'Distributed Compute (Spark)': ['Spark RDD vs. DataFrame API', 'Shuffle optimization and broadcast joins', 'Structured Streaming checkpointing', 'Partitioning strategies'],
  'Experimentation & Causality': ['A/B test design: power analysis, MDE', 'CUPED variance reduction', 'Network effects and SUTVA', 'Sequential testing (mSPRT)'],
  'Model Monitoring': ['Feature drift: PSI and KL divergence', 'Prediction distribution monitoring', 'Label feedback loops', 'Alerting and escalation paths'],
  'Deep Learning': ['Transformer attention mechanism', 'Training stability: gradient clipping, warmup', 'Regularization: dropout, weight decay', 'Mixed precision training'],
  'ML System Design': ['Feature store + model serving architecture', 'Latency budget allocation', 'Training pipeline design', 'Online vs. batch learning'],
  'Classical ML & Ensembles': ['Bias-variance tradeoff', 'Tree ensemble methods', 'Regularization (L1/L2)', 'Feature selection techniques'],
  'Model Evaluation': ['Calibration vs. discrimination', 'NDCG@K for ranking', 'Precision-recall at threshold', 'Offline vs. online metrics'],
  'SQL & Data Modeling': ['Window functions', 'CTEs and query optimization', 'Partitioning strategies', 'SCD Type 2'],
  'Pipelines & Orchestration': ['DAG structure and dependencies', 'Backfill strategies', 'Late data handling', 'SLA and alerting'],
  'LLM Fine-Tuning': ['LoRA and PEFT methods', 'Instruction fine-tuning vs. RLHF', 'Catastrophic forgetting', 'Evaluation: ROUGE vs. human eval'],
  'Data Modeling & dbt': ['Materialization strategies', 'Schema drift handling', 'Incremental models', 'Testing in dbt'],
  'Time Series': ['Stationarity and unit root tests', 'ARIMA vs. ML approaches', 'Walk-forward validation', 'Anomaly detection methods'],
  'Feature Engineering': ['Target encoding with k-fold', 'Feature store time-travel', 'Imputation without leakage', 'High-cardinality handling'],
  'Statistics & DS': ['Central limit theorem application', 'Type I vs. Type II error', 'Calibration of probability outputs', 'Bootstrap confidence intervals'],
  'Models & Math': ['PCA and SVD', 'Gradient descent variants', 'Kernel methods', 'Backpropagation'],
  'DL Serving': ['Quantization (INT8/FP16)', 'GPU memory optimization', 'Batching strategies', 'Latency vs. throughput tradeoffs'],
  'Causal Inference': ['Identification strategies', 'DiD and parallel trends', 'IV and regression discontinuity', 'Uplift modeling'],
}
const DEFAULT_CHECKLIST = ['Review core concepts', 'Work through production scenarios', 'Articulate reasoning out loud']

// ── Interview round → skill mapping ──────────────────────────────────────────
const ROUND_SKILLS = {
  'ML Coding':         ['Feature Engineering', 'Classical ML & Ensembles', 'Model Evaluation', 'Models & Math', 'Statistics & DS'],
  'ML System Design':  ['ML System Design', 'MLOps & Deployment', 'Feature Stores', 'Recommendation Systems', 'Deep Learning', 'Distributed Compute (Spark)'],
  'Depth / Onsite':    ['Experimentation & Causality', 'Model Monitoring', 'LLM Fine-Tuning', 'DL Serving', 'Time Series', 'Data Modeling & dbt', 'Pipelines & Orchestration'],
  'Behavioral':        [],
}

// ── Config ────────────────────────────────────────────────────────────────────
const HORIZONS = [
  { id: 'cram', label: 'Cram Up',  sub: 'Today / tomorrow' },
  { id: '3d',   label: '3 Days',   sub: 'Quick sprint'     },
  { id: '7d',   label: '7 Days',   sub: 'Standard prep'    },
  { id: '14d',  label: '2 Weeks',  sub: 'Deep coverage'    },
]
const RATINGS = [
  { id: 'weak',   label: 'Weak',   color: 'var(--rose)',  inv: 3 },
  { id: 'okay',   label: 'Okay',   color: 'var(--prime)', inv: 2 },
  { id: 'strong', label: 'Strong', color: 'var(--mint)',  inv: 1 },
]
const TIER_COLOR = { must: 'var(--rose)', important: 'var(--prime)', good: 'var(--mint)' }
const ACCESS_CODE = 'DAI2026'
const GATE_SECTION_PCT = 0.35

// ── JD parser ─────────────────────────────────────────────────────────────────
function analyzeJD(jdText) {
  const lower = jdText.toLowerCase()
  const map = new Map()
  for (const entry of KEYWORD_MAP) {
    const matched = entry.keywords.filter(kw => lower.includes(kw))
    if (!matched.length) continue
    const key = entry.topic + '-' + entry.tier
    if (map.has(key)) {
      matched.forEach(kw => { if (!map.get(key).matched.includes(kw)) map.get(key).matched.push(kw) })
    } else {
      map.set(key, { ...entry, matched: [...matched] })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.weight - a.weight).slice(0, 8)
}

// ── Plan generator ────────────────────────────────────────────────────────────
function generatePlan(skills, horizon) {
  const sorted = [...skills].sort((a, b) => b.gapScore - a.gapScore)
  const weak   = sorted.filter(s => s.rating === 'weak')

  if (horizon === 'cram') return [
    { label: 'Priority Focus — highest gaps first', accent: 'var(--rose)', border: 'rgba(244,63,94,0.28)', items: sorted.slice(0, 4) },
  ]
  if (horizon === '3d') return [
    { label: 'Day 1 — Biggest gaps', accent: 'var(--rose)',  border: 'rgba(244,63,94,0.28)',  items: sorted.slice(0, 2) },
    { label: 'Day 2 — Core topics',  accent: 'var(--prime)', border: 'rgba(240,165,0,0.28)',   items: sorted.slice(2, 4) },
    { label: 'Day 3 — Review',       accent: 'var(--mint)',  border: 'rgba(52,211,153,0.28)',  items: sorted.slice(4, 6), bonus: 'Run a 30-min Combinator session to pressure-test.' },
  ]
  if (horizon === '7d') return [
    { label: 'Days 1–2 — Gap Focus',  accent: 'var(--rose)',  border: 'rgba(244,63,94,0.28)',  items: sorted.slice(0, 2) },
    { label: 'Days 3–4 — Build',      accent: 'var(--prime)', border: 'rgba(240,165,0,0.28)',   items: sorted.slice(2, 5) },
    { label: 'Day 5 — Weak spots',    accent: 'var(--ember)', border: 'rgba(249,115,22,0.28)',  items: weak.slice(0, 2) },
    { label: 'Days 6–7 — Simulate',   accent: 'var(--mint)',  border: 'rgba(52,211,153,0.28)',  items: sorted.slice(5), bonus: 'Day 7: full Combinator session + Verbal Practice run-through.' },
  ]
  // 14d
  return [
    { label: 'Week 1 — Days 1–3 — Must Know gaps',    accent: 'var(--rose)',   border: 'rgba(244,63,94,0.28)',   items: sorted.filter(s => s.tier === 'must').slice(0, 3) },
    { label: 'Week 1 — Days 4–5 — Important topics',  accent: 'var(--prime)',  border: 'rgba(240,165,0,0.28)',    items: sorted.filter(s => s.tier === 'important').slice(0, 3) },
    { label: 'Week 1 — Days 6–7 — Weak spots + mock', accent: 'var(--ember)',  border: 'rgba(249,115,22,0.28)',   items: weak, bonus: 'Day 7: Combinator session.' },
    { label: 'Week 2 — Days 8–10 — Breadth pass',     accent: 'var(--sky)',    border: 'rgba(34,211,238,0.28)',   items: sorted.slice(4) },
    { label: 'Week 2 — Days 11–13 — Rounds practice', accent: 'var(--violet)', border: 'rgba(99,102,241,0.28)',   items: sorted.slice(0, 2), bonus: 'Interview Q&A + Take-Home Bank. Answer one question out loud per day.' },
    { label: 'Day 14 — Full simulation',              accent: 'var(--mint)',   border: 'rgba(52,211,153,0.28)',   items: [], bonus: 'Full Combinator session + Verbal Practice. Re-read your Defense Plan from Day 1.' },
  ]
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DefenseDocTab({ onNavigate, isUnlocked, onUnlock }) {
  const [screen,   setScreen]   = useState('input')
  const [jdText,   setJdText]   = useState('')
  const [skills,   setSkills]   = useState([]) // { ...kwEntry, rating, gapScore, checklist }
  const [horizon,  setHorizon]  = useState('7d')
  const [done,     setDone]     = useState(new Set()) // 'topicIdx-itemIdx'
  const [codeInput,     setCodeInput]     = useState('')
  const [codeError,     setCodeError]     = useState(false)
  const [unlocked,      setUnlocked]      = useState(isUnlocked)
  const [inlineSuccess, setInlineSuccess] = useState(false)

  useEffect(() => { setUnlocked(isUnlocked) }, [isUnlocked])

  // Restore
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('msl_defense_progress') || 'null')
      if (!s) return
      if (s.jd)      setJdText(s.jd)
      if (s.skills)  setSkills(s.skills)
      if (s.horizon) setHorizon(s.horizon)
      if (s.done)    setDone(new Set(s.done))
      if (s.screen)  setScreen(s.screen)
    } catch {}
  }, [])

  function persist(patch = {}) {
    try {
      const state = { jd: jdText, skills, horizon, done: [...done], screen, ...patch }
      localStorage.setItem('msl_defense_progress', JSON.stringify(state))
    } catch {}
  }

  // ── Step 1: analyze JD ───────────────────────────────────────────────────
  function handleAnalyze() {
    if (!jdText.trim()) return
    const extracted = analyzeJD(jdText)
    const built = extracted.map((e, i) => ({
      ...e,
      idx: i,
      rating: null,
      gapScore: e.weight * 2, // default "okay"
      checklist: (CHECKLISTS[e.topic] || DEFAULT_CHECKLIST).map(t => ({ text: t })),
    }))
    setSkills(built)
    setScreen('rate')
    persist({ skills: built, screen: 'rate' })
  }

  // ── Step 2: save ratings, go to plan ─────────────────────────────────────
  function handleRate(idx, rating) {
    const updated = skills.map((s, i) => i === idx
      ? { ...s, rating, gapScore: s.weight * RATINGS.find(r => r.id === rating).inv }
      : s
    )
    setSkills(updated)
    persist({ skills: updated })
  }

  function handleViewPlan() {
    setScreen('plan')
    persist({ screen: 'plan' })
  }

  // ── Plan: toggle checklist item ───────────────────────────────────────────
  function toggleDone(key) {
    const next = new Set(done)
    next.has(key) ? next.delete(key) : next.add(key)
    setDone(next)
    persist({ done: [...next] })
  }

  // ── Inline code unlock ────────────────────────────────────────────────────
  function handleInlineUnlock(e) {
    e.preventDefault()
    if (codeInput.trim().toUpperCase() === ACCESS_CODE) {
      localStorage.setItem('msl_access', ACCESS_CODE)
      setInlineSuccess(true)
      setTimeout(() => {
        setUnlocked(true)
        setInlineSuccess(false)
        if (onUnlock) onUnlock(ACCESS_CODE)
      }, 900)
    } else {
      setCodeError(true)
      setTimeout(() => setCodeError(false), 1800)
    }
  }

  function handleReset() {
    setScreen('input'); setJdText(''); setSkills([]); setHorizon('7d')
    setDone(new Set())
    try { localStorage.removeItem('msl_defense_progress') } catch {}
  }

  // ── Plan data ─────────────────────────────────────────────────────────────
  const planSections   = generatePlan(skills, horizon)
  const gateAfterIdx   = Math.max(1, Math.floor(planSections.length * GATE_SECTION_PCT))
  const totalItems     = skills.reduce((s, sk) => s + sk.checklist.length, 0)
  const doneCount      = done.size

  // ── SCREEN: input ─────────────────────────────────────────────────────────
  if (screen === 'input') return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
          Interview Prep
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: '0 0 10px' }}>
          Defense Plan
        </h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
          Paste the job description. We extract what the role actually cares about, ask you to rate yourself honestly, then build a sequenced study plan based on your real gaps — not a generic list.
        </p>
      </div>
      <textarea
        value={jdText}
        onChange={e => setJdText(e.target.value)}
        placeholder="Paste the full job description here…"
        style={{ width: '100%', minHeight: 280, background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 10, padding: 16, fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ink-hi)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.65 }}
      />
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleAnalyze} disabled={!jdText.trim()} className="btn-primary" style={{ fontSize: 14, padding: '11px 26px', opacity: jdText.trim() ? 1 : 0.45 }}>
          Analyze JD →
        </button>
      </div>
    </div>
  )

  // ── SCREEN: rate ──────────────────────────────────────────────────────────
  if (screen === 'rate') return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Step 2 of 3</div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>Rate yourself honestly</h2>
        </div>
        <button onClick={handleReset} style={{ background: 'transparent', border: '1px solid var(--rim)', borderRadius: 7, padding: '7px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-low)', cursor: 'pointer' }}>← New JD</button>
      </div>

      <p style={{ fontSize: 13, color: 'var(--ink-low)', lineHeight: 1.65, marginBottom: 24 }}>
        {skills.length} topics extracted from your JD — ordered by how much the role cares. Rate each one. Weak answers build your plan. Strong answers let us skip what you already know.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {skills.map((sk, i) => (
          <div key={i} style={{ background: 'var(--depth)', border: `1px solid ${sk.rating ? RATINGS.find(r => r.id === sk.rating).color + '50' : 'var(--rim)'}`, borderRadius: 10, padding: '14px 16px', transition: 'border-color 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: TIER_COLOR[sk.tier], textTransform: 'uppercase', letterSpacing: '0.08em' }}>{sk.tier === 'must' ? 'Must Know' : sk.tier === 'important' ? 'Important' : 'Good to Have'}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{sk.topic}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{sk.matched.join(', ')}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {RATINGS.map(r => (
                  <button key={r.id} onClick={() => handleRate(i, r.id)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${sk.rating === r.id ? r.color : 'var(--rim)'}`, background: sk.rating === r.id ? r.color + '22' : 'transparent', color: sk.rating === r.id ? r.color : 'var(--ink-low)', fontSize: 12, fontWeight: sk.rating === r.id ? 700 : 400, fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 0.14s' }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Horizon selector */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', marginBottom: 10 }}>How much time do you have?</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {HORIZONS.map(h => (
            <button key={h.id} onClick={() => setHorizon(h.id)}
              style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${horizon === h.id ? 'var(--prime)' : 'var(--rim)'}`, background: horizon === h.id ? 'rgba(240,165,0,0.14)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.14s' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: horizon === h.id ? 'var(--prime)' : 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>{h.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)' }}>{h.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleViewPlan}
        disabled={skills.some(s => !s.rating)}
        className="btn-primary"
        style={{ fontSize: 14, padding: '12px 28px', opacity: skills.some(s => !s.rating) ? 0.45 : 1 }}
      >
        Build my Defense Plan →
      </button>
      {skills.some(s => !s.rating) && (
        <p style={{ fontSize: 11, color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', marginTop: 8 }}>Rate all skills to continue.</p>
      )}
    </div>
  )

  // ── SCREEN: plan ──────────────────────────────────────────────────────────
  const sortedSkills = [...skills].sort((a, b) => b.gapScore - a.gapScore)
  const maxGap = Math.max(...sortedSkills.map(s => s.gapScore), 1)

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 20px' }} className="defense-doc-print">

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 1.2cm; size: A4; }
          * { visibility: hidden !important; }
          .defense-doc-print, .defense-doc-print * { visibility: visible !important; }
          .defense-doc-print { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; background: #fff !important; color: #000 !important; font-size: 12pt !important; padding: 0 !important; border: none !important; border-radius: 0 !important; }
          .defense-doc-print * { color: #000 !important; background: transparent !important; border-color: #ccc !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>Defense Plan</div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>
            Your personalized prep plan
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()} style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 7, padding: '7px 14px', fontSize: 12, color: 'var(--ink-low)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Print / PDF</button>
          <button onClick={handleReset} style={{ background: 'transparent', border: '1px solid var(--rim)', borderRadius: 7, padding: '7px 14px', fontSize: 12, color: 'var(--ink-low)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>← New JD</button>
        </div>
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div style={{ marginBottom: 24, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Plan progress</span>
          <div style={{ flex: 1, height: 3, background: 'var(--rim)', borderRadius: 2 }}>
            <div style={{ width: `${Math.round((doneCount / totalItems) * 100)}%`, height: '100%', background: 'var(--mint)', borderRadius: 2, transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--mint)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{doneCount}/{totalItems}</span>
        </div>
      )}

      {/* Skill gap bars */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow" style={{ marginBottom: 12 }}>Skill gap map</div>
        {sortedSkills.map((sk, i) => {
          const r = RATINGS.find(r => r.id === sk.rating)
          const barPct = Math.round((sk.gapScore / maxGap) * 100)
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>{sk.topic}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: r?.color || 'var(--ink-ghost)' }}>{r?.label || '—'}</span>
              </div>
              <div style={{ height: 5, background: 'var(--rim)', borderRadius: 3 }}>
                <div style={{ width: `${barPct}%`, height: '100%', background: r?.color || 'var(--rim-hi)', borderRadius: 3, transition: 'width 0.4s' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Round exposure */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow" style={{ marginBottom: 12 }}>Round-by-round exposure</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {Object.entries(ROUND_SKILLS).map(([round, topicNames]) => {
            const roundSkills = topicNames.length === 0
              ? []
              : skills.filter(s => topicNames.includes(s.topic))
            const worstRating = roundSkills.reduce((w, s) => {
              const inv = RATINGS.find(r => r.id === s.rating)?.inv ?? 2
              return Math.max(w, inv)
            }, 0)
            const borderColor = worstRating >= 3 ? 'var(--rose)' : worstRating >= 2 ? 'var(--prime)' : 'var(--mint)'
            return (
              <div key={round} style={{ background: 'var(--depth)', border: `1px solid ${round === 'Behavioral' ? 'var(--rim)' : borderColor + '55'}`, borderLeft: `3px solid ${round === 'Behavioral' ? 'var(--rim-hi)' : borderColor}`, borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', marginBottom: 5 }}>{round}</div>
                {round === 'Behavioral'
                  ? <div style={{ fontSize: 10, color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)' }}>Always present — prepare your stories.</div>
                  : roundSkills.length === 0
                    ? <div style={{ fontSize: 10, color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)' }}>No matched skills from your JD.</div>
                    : roundSkills.map((s, i) => {
                        const r = RATINGS.find(r => r.id === s.rating)
                        return <div key={i} style={{ fontSize: 10, color: r?.color || 'var(--ink-low)', fontFamily: 'var(--font-sans)', marginBottom: 2 }}>· {s.topic}</div>
                      })
                }
              </div>
            )
          })}
        </div>
      </div>

      {/* Day plan sections */}
      <div style={{ marginBottom: 12 }}>
        <div className="section-eyebrow" style={{ marginBottom: 16 }}>
          Your {HORIZONS.find(h => h.id === horizon)?.label} plan
        </div>

        {planSections.map((section, sIdx) => {
          const isGated = sIdx >= gateAfterIdx && !unlocked
          return (
            <div key={sIdx}>
              {/* Gate wall — appears inline between sections */}
              {sIdx === gateAfterIdx && !unlocked && (
                <div style={{ background: inlineSuccess ? 'rgba(240,165,0,0.10)' : 'var(--depth)', border: `1px solid ${inlineSuccess ? 'rgba(240,165,0,0.50)' : 'var(--rim-hi)'}`, borderRadius: 12, padding: '28px 20px', marginBottom: 14, textAlign: 'center', transition: 'background 0.3s, border-color 0.3s' }}>
                  {inlineSuccess ? (
                    <>
                      <style>{`@keyframes ig-unlock-in { from { opacity:0; transform:scale(0.90) } to { opacity:1; transform:scale(1) } }`}</style>
                      <div style={{ animation: 'ig-unlock-in 0.3s cubic-bezier(0.16,1,0.3,1)' }}>
                        <div style={{ color: 'var(--prime)', marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                        </div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 800, color: 'var(--prime)', letterSpacing: '-0.03em' }}>You're in.</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-low)', marginTop: 5 }}>Loading your full plan…</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Premium</div>
                      <p style={{ fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.65, marginBottom: 16, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
                        You've seen enough to know this plan is real. Enter your access code to unlock the full sequence.
                      </p>
                      <form onSubmit={handleInlineUnlock} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="text" value={codeInput} onChange={e => setCodeInput(e.target.value)}
                          placeholder="Access code"
                          style={{ background: 'var(--surface)', border: `1px solid ${codeError ? 'var(--rose)' : 'var(--rim-hi)'}`, borderRadius: 7, padding: '9px 14px', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--ink-hi)', outline: 'none', width: 180, letterSpacing: '0.06em' }}
                        />
                        <button type="submit" className="btn-primary" style={{ fontSize: 13, padding: '9px 18px' }}>Unlock →</button>
                      </form>
                      {codeError && <p style={{ fontSize: 11, color: 'var(--rose)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>Incorrect code.</p>}
                    </>
                  )}
                </div>
              )}

              {/* Plan section */}
              <div style={{ marginBottom: 14, opacity: isGated ? 0.3 : 1, filter: isGated ? 'blur(3px)' : 'none', pointerEvents: isGated ? 'none' : 'auto', transition: 'all 0.2s', background: 'var(--depth)', border: `1px solid ${section.border}`, borderLeft: `3px solid ${section.accent}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: section.accent, fontFamily: 'var(--font-sans)', marginBottom: section.items.length > 0 ? 12 : 0 }}>{section.label}</div>
                {section.items.map((sk, skIdx) => (
                  <div key={skIdx} style={{ marginBottom: skIdx < section.items.length - 1 ? 12 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{sk.topic}</span>
                      <button onClick={() => onNavigate && onNavigate(sk.tab)} style={{ background: section.accent + '22', border: `1px solid ${section.accent}44`, borderRadius: 5, padding: '4px 10px', fontSize: 11, color: section.accent, fontFamily: 'var(--font-sans)', fontWeight: 700, cursor: 'pointer' }}>
                        Study →
                      </button>
                    </div>
                    {sk.checklist.map((item, iIdx) => {
                      const key = `${sk.idx ?? skIdx}-${iIdx}`
                      const isDone = done.has(key)
                      return (
                        <div key={iIdx} onClick={() => toggleDone(key)}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', cursor: 'pointer', borderTop: iIdx > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                          <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${isDone ? 'var(--mint)' : 'var(--rim-hi)'}`, background: isDone ? 'rgba(52,211,153,0.2)' : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isDone && <span style={{ fontSize: 9, color: 'var(--mint)' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 12, color: isDone ? 'var(--ink-ghost)' : 'var(--ink-mid)', textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>{item.text}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
                {section.bonus && (
                  <div className="msl-reveal-panel" style={{ marginTop: section.items.length > 0 ? 10 : 0, padding: '7px 10px', fontSize: 11, color: 'var(--mint)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                    {section.bonus}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
