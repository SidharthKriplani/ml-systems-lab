import { useState, useEffect } from 'react'
import { getAllProgress, getNextRecommendation, getTrackMastery, inferMastery } from '../utils/progress.js'

// ── Roles ─────────────────────────────────────────────────────────────────────
const ROLES = [
  { key: 'mle_interview',  label: 'MLE Interview',    desc: 'Preparing for system design and ML rounds at Spotify, Meta, Google, or Airbnb.',         cta1: { label: 'Interview Prep →',   tab: 'interview' },   cta2: { label: 'System Design',   tab: 'design' } },
  { key: 'production_ml',  label: 'Production MLE',   desc: 'Deepening production skills — features, Spark, monitoring, system design.',               cta1: { label: 'Spark Lab →',        tab: 'spark' },       cta2: { label: 'Monitoring',      tab: 'monitor' } },
  { key: 'data_engineer',  label: 'Data Engineer',    desc: 'Pipeline orchestration, dbt transformations, data modeling, OLAP storage decisions.',     cta1: { label: 'Spark Lab →',        tab: 'spark' },       cta2: { label: 'Airflow',         tab: 'airflow' } },
  { key: 'deep_learning',  label: 'Deep Learning',    desc: 'Training failures, fine-tuning decisions, and serving a model at p99 in production.',     cta1: { label: 'Training Lab →',     tab: 'dl' },          cta2: { label: 'DL Serving',      tab: 'dl_serving' } },
  { key: 'data_scientist', label: 'Data Scientist',   desc: 'Classical ML failure modes, model selection, statistical testing pitfalls, calibration.',  cta1: { label: 'Classical ML →',     tab: 'classical' },   cta2: { label: 'Data Science',    tab: 'ds' } },
  { key: 'mlops',          label: 'MLOps / Platform', desc: 'Deployment patterns, champion-challenger decisions, CI/CD for models, drift monitoring.',  cta1: { label: 'Deployment →',       tab: 'mlops_deploy' }, cta2: { label: 'CI/CD & Infra',  tab: 'mlops_pipes' } },
  { key: 'staff',          label: 'Staff / Principal',desc: 'ML platform design, cross-domain trade-offs, and engineering judgment at scale.',          cta1: { label: 'ML System Design →', tab: 'design' },      cta2: { label: 'Gradient Posts',  tab: 'gradient' } },
]

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { n: '7',   label: 'Domains' },
  { n: '100+', label: 'Production scenarios' },
  { n: '4',   label: 'Career levels' },
  { n: 'Free', label: 'No account needed' },
]

// ── Changelog ─────────────────────────────────────────────────────────────────
const CHANGELOG = [
  { date: 'May 2026', text: 'Causal Inference tab: causal vs predictive, identification strategies (RCT/DiD/PSM/IV/RDD/SC), DAG confounder/collider/mediator.' },
  { date: 'May 2026', text: 'Time Series tab: forecast failure zoo, stationarity selector, anomaly detection tiers.' },
  { date: 'May 2026', text: 'MLOps domain: Deployment strategies, Champion-Challenger, CI/CD & Infra (9 modules).' },
  { date: 'May 2026', text: 'Data Science domain expanded: Analysis Mistakes, Calibration, Metric Design Pitfalls.' },
  { date: 'May 2026', text: 'Deep Learning domain: Training Lab, Fine-tuning, Serving — 8 production judgment modules.' },
  { date: 'May 2026', text: 'Data Engineering domain: Airflow, dbt, Data Modeling & Storage — 9 modules.' },
  { date: 'May 2026', text: 'Classical ML tab: Model Failure Zoo, Ensemble Lab, Hyperparameter Priority.' },
  { date: 'May 2026', text: 'Domain-grouped navigation — 7 domains, 60+ modules across the lab.' },
  { date: 'Apr 2026', text: '77 interview questions, Fluency Drills, 4-tier self-assessment, Timed Practice.' },
  { date: 'Mar 2026', text: 'Python in browser via Pyodide — sklearn, numpy, matplotlib.' },
]

// ── Ecosystem ─────────────────────────────────────────────────────────────────
const ECOSYSTEM = [
  { name: 'GenAI Systems Lab', desc: 'Prompt engineering, RAG pipelines, LLM evaluation, hallucination measurement. The production GenAI counterpart.', accent: 'var(--violet)', border: 'rgba(167,139,250,0.25)', url: 'https://genai-systems-lab-ivory.vercel.app' },
  { name: 'Experimentation Lab', desc: 'A/B testing mechanics, SRM detection, CUPED, power analysis. Experiment design for product and ML teams.', accent: 'var(--sky)', border: 'rgba(34,211,238,0.25)', url: 'https://experimentation-lab.vercel.app' },
]

// ── Mastery ───────────────────────────────────────────────────────────────────
const MASTERY_COLORS = { exploring: 'var(--sky)', practicing: 'var(--ember)', mastered: 'var(--mint)' }
const MASTERY_LABELS = { exploring: 'Exploring', practicing: 'Practicing', mastered: 'Mastered' }

// ── Learning paths ────────────────────────────────────────────────────────────
const LEARNING_PATHS = [
  {
    id: 'mle_interview',
    name: 'MLE Interview Ready',
    duration: '2 weeks',
    outcome: 'Confident across system design, evaluation, and ML rounds at Meta, Spotify, Google, or Airbnb.',
    accent: 'var(--gold)', border: 'rgba(251,191,36,0.22)', bg: 'rgba(251,191,36,0.04)',
    steps: [
      { tab: 'interview',  label: 'Question Bank — System Design',  desc: 'Work through all system design questions. Build a reusable 6-step framework.' },
      { tab: 'interview',  label: 'Fluency Drills',                 desc: '30 weak→strong vocabulary pairs. Replace vague phrases with production-grade ones.' },
      { tab: 'causal',     label: 'Causal vs Predictive',           desc: 'A DS interview trap. Know when prediction isn\'t the right tool before the interviewer asks.' },
      { tab: 'design',     label: 'ML Incident Room',               desc: 'Diagnose production incidents under pressure. Senior/Staff expected output.' },
      { tab: 'design',     label: 'Two-Tower Explorer',             desc: 'The architecture powering YouTube, Spotify, TikTok retrieval. Know it cold.' },
      { tab: 'eval',       label: 'Metric Selector',                desc: 'When to use PR-AUC vs ROC-AUC vs calibration. Interviewers will ask.' },
      { tab: 'interview',  label: 'Timed Practice — full mock',     desc: '45-minute session. Use 4-tier self-assessment. Aim for Analyst on every question.' },
    ],
  },
  {
    id: 'data_engineering',
    name: 'Data Engineering Track',
    duration: '3 weeks',
    outcome: 'Design, debug, and operate production data pipelines — from Spark to orchestration to storage.',
    accent: 'var(--ember)', border: 'rgba(249,115,22,0.22)', bg: 'rgba(249,115,22,0.04)',
    steps: [
      { tab: 'spark',    label: 'Shuffle Hell + Skew Doctor',      desc: 'Understand Spark execution mechanics. Diagnose and fix data skew.' },
      { tab: 'airflow',  label: 'DAG Failure Room',                desc: 'Diagnose 8 types of broken DAGs. Trigger rules, timezone bugs, zombie tasks.' },
      { tab: 'airflow',  label: 'Backfill Decision Lab',           desc: 'When to backfill, from when, in what order. The risks most teams skip.' },
      { tab: 'dbt',      label: 'Materialization Oracle',          desc: 'Table vs view vs incremental vs ephemeral — when each breaks in production.' },
      { tab: 'dbt',      label: 'Schema Drift Clinic',             desc: 'What breaks downstream when upstream columns change.' },
      { tab: 'modeling', label: 'Star vs OBT + OLAP Format Showdown', desc: 'Data modeling decisions and Iceberg vs Delta vs Hive tradeoffs.' },
    ],
  },
  {
    id: 'deep_learning_prod',
    name: 'Deep Learning for Production',
    duration: '2 weeks',
    outcome: 'Debug training failures, make fine-tuning decisions, and serve models at p99 without an oncall incident.',
    accent: 'var(--violet)', border: 'rgba(99,102,241,0.22)', bg: 'rgba(99,102,241,0.04)',
    steps: [
      { tab: 'dl',          label: 'Training Failure Diagnosis',     desc: '8 scenarios: NaN loss, vanishing gradients, dead ReLUs, data leakage.' },
      { tab: 'dl',          label: 'Backprop Debugging',             desc: 'Per-layer gradient norms. Which layers are learning, which are dead.' },
      { tab: 'dl_finetune', label: 'Freeze vs Fine-tune vs LoRA',    desc: 'Given model size and data size — which approach and why.' },
      { tab: 'dl_finetune', label: 'LR Strategy',                    desc: '8 scenarios on learning rate choices. The knob that matters most.' },
      { tab: 'dl_serving',  label: 'Quantization Tradeoffs',         desc: 'FP32 vs FP16 vs INT8 vs INT4 — given your hardware and accuracy tolerance.' },
      { tab: 'dl_serving',  label: 'GPU Memory Calculator + Serving Architecture', desc: 'Will the model fit? Which serving pattern for your traffic shape?' },
    ],
  },
  {
    id: 'production_ml',
    name: 'Production ML Fundamentals',
    duration: '3 weeks',
    outcome: 'Build, debug, and monitor an ML pipeline end-to-end. Know what breaks and why before it pages you.',
    accent: 'var(--mint)', border: 'rgba(52,211,153,0.22)', bg: 'rgba(52,211,153,0.04)',
    steps: [
      { tab: 'features',    label: 'Skew Simulator',                 desc: 'Break features intentionally. Build intuition for training-serving skew.' },
      { tab: 'features',    label: 'Feature Store Designer',         desc: 'Point-in-time correct joins. Dual-layer feature store design.' },
      { tab: 'classical',   label: 'Model Failure Zoo',              desc: 'Silent failure modes for 8 classical models. War stories + diagnostic signals.' },
      { tab: 'eval',        label: 'Metric Selector + Shadow Mode',  desc: 'Pick the right metric. Run shadow before canary. Always.' },
      { tab: 'causal',      label: 'Causal vs Predictive',           desc: 'Before running your next A/B test — know what you\'re actually trying to estimate.' },
      { tab: 'monitor',     label: 'Drift Dashboard',                desc: 'PSI/KS thresholds. Model health alerts before degradation compounds.' },
      { tab: 'mlops_deploy',label: 'Champion-Challenger',            desc: 'Walk through a real promotion decision: metrics, latency SLA, rollback trigger.' },
    ],
  },
  {
    id: 'staff_design',
    name: 'Staff-Level System Design',
    duration: '4 weeks',
    outcome: 'Design and defend end-to-end ML platforms. Trade-off reasoning at the Staff/Principal level.',
    accent: 'var(--sky)', border: 'rgba(34,211,238,0.22)', bg: 'rgba(34,211,238,0.04)',
    steps: [
      { tab: 'design',     label: 'Design Canvas',                  desc: 'Full ML system design: rec systems, fraud detection, search ranking.' },
      { tab: 'design',     label: 'Two-Tower Explorer',             desc: 'The retrieval architecture behind every major recommendation system.' },
      { tab: 'design',     label: 'DS Ownership Chain',             desc: '17-node production ML lifecycle. Where each role owns the decision.' },
      { tab: 'modeling',   label: 'OLAP Format Showdown',           desc: 'Iceberg vs Delta vs Hive. Storage layer decisions at Staff level.' },
      { tab: 'mlops_deploy',label: 'Deployment Strategy + Rollback', desc: 'Blue-green vs canary vs shadow. When to rollback immediately vs investigate.' },
      { tab: 'ts',         label: 'Forecast Failure Zoo',            desc: 'Staff-level sign-off: know the 8 ways forecasting pipelines silently break.' },
      { tab: 'gradient',   label: 'Read all Gradient posts',        desc: 'Long-form architecture reasoning. How real systems are built and why.' },
    ],
  },
  {
    id: 'ds_track',
    name: 'Data Scientist Track',
    duration: '2 weeks',
    outcome: 'Model selection, causal identification, and time series judgment — the three areas that separate good DS from great DS.',
    accent: 'var(--sky)', border: 'rgba(34,211,238,0.22)', bg: 'rgba(34,211,238,0.04)',
    steps: [
      { tab: 'ds',     label: 'Model Selection Oracle',    desc: 'When linear vs tree vs neural — the defaults that get you 80% of the way.' },
      { tab: 'ds',     label: 'Analysis Mistakes',         desc: '8 antipatterns: p-hacking, Simpson\'s paradox, survivorship bias, Goodhart\'s Law.' },
      { tab: 'ds',     label: 'Calibration',               desc: 'When your probabilities are lying to you. Platt scaling vs isotonic regression.' },
      { tab: 'causal', label: 'Causal vs Predictive',      desc: 'The framing question before every analysis. Prediction and causation need different tools.' },
      { tab: 'causal', label: 'Identification Strategies', desc: 'RCT, DiD, PSM, IV, RDD, Synthetic Control — match strategy to constraint.' },
      { tab: 'ts',     label: 'Forecast Failure Zoo',      desc: 'Why forecasts fail: leakage, nonstationarity, structural breaks, sparse series.' },
    ],
  },
  {
    id: 'mlops_track',
    name: 'MLOps & Deployment',
    duration: '2 weeks',
    outcome: 'Ship models safely, monitor them continuously, and respond to production degradation without panic.',
    accent: 'var(--rose)', border: 'rgba(244,63,94,0.22)', bg: 'rgba(244,63,94,0.04)',
    steps: [
      { tab: 'mlops_deploy', label: 'Deployment Strategy',          desc: 'Blue-green, canary, shadow, feature flag — which for which situation.' },
      { tab: 'mlops_deploy', label: 'Champion-Challenger',          desc: 'The 4-decision promotion framework. Metrics, SLA, rollback triggers.' },
      { tab: 'mlops_deploy', label: 'Rollback Decisions',           desc: '8 production alerts — rollback now, investigate first, or monitor only?' },
      { tab: 'mlops_pipes',  label: 'CI/CD Gate Design',            desc: 'Which gates block, which warn. How ML CI/CD differs from software.' },
      { tab: 'mlops_pipes',  label: 'Infrastructure Decision',      desc: 'REST vs Triton vs Ray Serve vs vLLM — given your scale and model size.' },
      { tab: 'monitor',      label: 'Drift Dashboard',              desc: 'PSI/KS thresholds, alert tuning, and what gradual drift looks like.' },
    ],
  },
]

// ── Track grid ────────────────────────────────────────────────────────────────
const TRACKS = [
  // ML Engineering
  { id: 'models',       label: 'Math Foundations',    type: 'sandbox',  accent: 'var(--violet)', border: 'rgba(168,85,247,0.2)', bg: 'rgba(168,85,247,0.04)', modules: ['PCA Explorer', 'SVD Decomposer', 'NumPy Internals', 'Calibration Curves'], description: 'The math behind the decisions — PCA, SVD, calibration, regularization. Python cells for hands-on exploration.' },
  { id: 'features',     label: 'Feature Engineering', type: 'judgment', accent: 'var(--violet)', border: 'rgba(168,85,247,0.2)', bg: 'rgba(168,85,247,0.04)', modules: ['Skew Simulator', 'Feature Store Designer', 'Leakage Zoo', 'Online/Offline Decider'], description: 'Training-serving skew, feature stores, leakage patterns. The bugs that silently corrupt production models.' },
  { id: 'eval',         label: 'Model Evaluation',    type: 'judgment', accent: 'var(--mint)',   border: 'rgba(52,211,153,0.2)', bg: 'rgba(52,211,153,0.04)', modules: ['Metric Selector', 'Shadow Mode Sim'], description: 'Pick the wrong metric and you ship a model that looks great on paper while failing in production.' },
  { id: 'design',       label: 'System Design',       type: 'judgment', accent: 'var(--sky)',    border: 'rgba(34,211,238,0.2)', bg: 'rgba(34,211,238,0.04)', modules: ['Incident Room', 'Design Canvas', 'Two-Tower Explorer', 'Serving Tradeoffs'], description: 'Production incident diagnosis, ML platform design, two-tower retrieval, serving architecture decisions.' },
  { id: 'classical',    label: 'Classical ML',         type: 'judgment', accent: 'var(--mint)',   border: 'rgba(52,211,153,0.2)', bg: 'rgba(52,211,153,0.04)', modules: ['Model Failure Zoo', 'Ensemble Lab', 'Hyperparameter Priority'], description: 'When random forests, SVMs, and gradient boosting silently fail in production and why.' },
  // Data Engineering
  { id: 'spark',        label: 'Spark Lab',            type: 'judgment', accent: 'var(--ember)',  border: 'rgba(249,115,22,0.2)', bg: 'rgba(249,115,22,0.04)', modules: ['Shuffle Hell', 'Skew Doctor', 'Partition Tuner'], description: 'PySpark execution mechanics. Diagnose shuffle bottlenecks, fix data skew, read execution DAGs.' },
  { id: 'airflow',      label: 'Airflow',              type: 'judgment', accent: 'var(--ember)',  border: 'rgba(249,115,22,0.2)', bg: 'rgba(249,115,22,0.04)', modules: ['DAG Failure Room', 'Backfill Lab', 'Late Data Handler'], description: 'Pipeline orchestration failures — broken DAGs, backfill decisions, late-arriving data.' },
  { id: 'dbt',          label: 'dbt',                  type: 'judgment', accent: 'var(--ember)',  border: 'rgba(249,115,22,0.2)', bg: 'rgba(249,115,22,0.04)', modules: ['Materialization Oracle', 'Schema Drift Clinic', 'Incremental Decisions'], description: 'Transformation layer decisions. When incremental models break, schema drift diagnosis.' },
  { id: 'modeling',     label: 'Data Modeling',        type: 'judgment', accent: 'var(--ember)',  border: 'rgba(249,115,22,0.2)', bg: 'rgba(249,115,22,0.04)', modules: ['Star vs OBT', 'SCD Types', 'OLAP Format Showdown'], description: 'Star schema vs OBT, SCD type decisions, Iceberg vs Delta vs Hive tradeoffs.' },
  // Deep Learning
  { id: 'dl',           label: 'Training Lab',         type: 'judgment', accent: 'var(--violet)', border: 'rgba(99,102,241,0.2)', bg: 'rgba(99,102,241,0.04)', modules: ['Training Failure Diagnosis', 'Backprop Debugging'], description: 'Diagnose training failures from telemetry — loss spikes, vanishing gradients, data leakage.' },
  { id: 'dl_finetune',  label: 'Fine-tuning',          type: 'judgment', accent: 'var(--violet)', border: 'rgba(99,102,241,0.2)', bg: 'rgba(99,102,241,0.04)', modules: ['Freeze vs LoRA', 'LR Strategy', 'PEFT Methods'], description: 'When to freeze, full fine-tune, or LoRA. The decision most people get wrong the first time.' },
  { id: 'dl_serving',   label: 'DL Serving',           type: 'judgment', accent: 'var(--violet)', border: 'rgba(99,102,241,0.2)', bg: 'rgba(99,102,241,0.04)', modules: ['Quantization', 'GPU Memory Calculator', 'Serving Architecture'], description: 'Quantization decisions, GPU memory math, and which serving pattern for your traffic shape.' },
  // MLOps
  { id: 'monitor',      label: 'Monitoring',           type: 'judgment', accent: 'var(--rose)',   border: 'rgba(244,63,94,0.2)', bg: 'rgba(244,63,94,0.04)', modules: ['Drift Dashboard', 'PSI Lab', 'Incident Triage', 'Coverage Audit'], description: 'Drift detection, PSI/KS thresholds, incident triage, monitoring blind spots.' },
  { id: 'mlops_deploy', label: 'Deployment',           type: 'judgment', accent: 'var(--rose)',   border: 'rgba(244,63,94,0.2)', bg: 'rgba(244,63,94,0.04)', modules: ['Deploy Strategies', 'Champion-Challenger', 'Rollback Decisions'], description: 'Blue-green vs canary vs shadow. Champion-challenger promotion. When to roll back immediately.' },
  { id: 'mlops_pipes',  label: 'CI/CD & Infra',        type: 'judgment', accent: 'var(--rose)',   border: 'rgba(244,63,94,0.2)', bg: 'rgba(244,63,94,0.04)', modules: ['CI/CD Gate Design', 'Infra Decisions', 'Model Registry'], description: 'Which CI gates block vs warn. REST vs Triton vs vLLM. Model registry patterns.' },
  // Data Science
  { id: 'ds',           label: 'DS Fundamentals',      type: 'judgment', accent: 'var(--sky)',    border: 'rgba(34,211,238,0.2)', bg: 'rgba(34,211,238,0.04)', modules: ['Model Selection Oracle', 'Analysis Mistakes', 'Calibration', 'Metric Design Pitfalls'], description: 'Model selection, statistical testing pitfalls, calibration, and metric design under Goodhart\'s Law.' },
  { id: 'causal',       label: 'Causal Inference',     type: 'judgment', accent: 'var(--sky)',    border: 'rgba(34,211,238,0.2)', bg: 'rgba(34,211,238,0.04)', modules: ['Causal vs Predictive', 'Identification Strategies', 'Confounder or Collider'], description: 'When prediction isn\'t enough. Identification strategies, confounders vs colliders, uplift modeling.' },
  { id: 'ts',           label: 'Time Series',          type: 'judgment', accent: 'var(--sky)',    border: 'rgba(34,211,238,0.2)', bg: 'rgba(34,211,238,0.04)', modules: ['Forecast Failure Zoo', 'Stationarity & Transforms', 'Anomaly Detection Tiers'], description: 'Why forecasts fail in production. Stationarity decisions, anomaly detection tier selection.' },
  // Resources
  { id: 'interview',    label: 'Interview Prep',       type: 'reference', accent: 'var(--gold)',  border: 'rgba(251,191,36,0.2)', bg: 'rgba(251,191,36,0.04)', modules: ['52 Questions', 'Fluency Drills', 'Timed Practice'], description: 'MLE interview bank for Spotify, Meta, Google, Airbnb, Uber, Netflix. Timed practice with 4-tier scoring.' },
  { id: 'gradient',     label: 'Gradient',             type: 'reading',  accent: 'var(--sky)',    border: 'rgba(34,211,238,0.2)', bg: 'rgba(34,211,238,0.04)', modules: ['Feature engineering', 'Spark shuffle', 'System design', 'Post-mortems'], description: 'Long-form production ML writing. Architecture reasoning, failure analysis, engineering decisions.' },
]

const TAB_ACCENT = {
  models: 'var(--violet)', features: 'var(--violet)',
  eval: 'var(--mint)', classical: 'var(--mint)', design: 'var(--sky)',
  spark: 'var(--ember)', airflow: 'var(--ember)', dbt: 'var(--ember)', modeling: 'var(--ember)',
  dl: 'var(--violet)', dl_finetune: 'var(--violet)', dl_serving: 'var(--violet)',
  monitor: 'var(--rose)', mlops_deploy: 'var(--rose)', mlops_pipes: 'var(--rose)',
  ds: 'var(--sky)', causal: 'var(--sky)', ts: 'var(--sky)',
  interview: 'var(--gold)', gradient: 'var(--sky)', landscape: 'var(--gold)',
}

// ── Progress ring ─────────────────────────────────────────────────────────────
function Ring({ pct, size = 44, stroke = 3.5, accent = 'var(--mint)' }) {
  const r    = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--rim)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={accent} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  )
}

// ── Domain section label ──────────────────────────────────────────────────────
const DOMAIN_LABELS = [
  { key: 'mle',       label: 'ML Engineering',   tracks: ['models','features','eval','design','classical'] },
  { key: 'de',        label: 'Data Engineering',  tracks: ['spark','airflow','dbt','modeling'] },
  { key: 'dl',        label: 'Deep Learning',     tracks: ['dl','dl_finetune','dl_serving'] },
  { key: 'mlops',     label: 'MLOps',             tracks: ['monitor','mlops_deploy','mlops_pipes'] },
  { key: 'ds',        label: 'Data Science',      tracks: ['ds','causal','ts'] },
  { key: 'resources', label: 'Resources',         tracks: ['interview','gradient'] },
]

const TYPE_BADGE = {
  judgment:  { label: 'judgment',  color: 'var(--sky)',    bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.25)' },
  sandbox:   { label: 'sandbox',   color: 'var(--violet)', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)' },
  reference: { label: 'reference', color: 'var(--gold)',   bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' },
  reading:   { label: 'reading',   color: 'var(--ink-low)',bg: 'rgba(255,255,255,0.04)',border: 'var(--rim)' },
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HomeTab({ onNavigate }) {
  const [progress, setProgress] = useState([])
  const [nextUp,   setNextUp]   = useState(null)
  const [role,     setRole]     = useState(() => localStorage.getItem('msl_role') || null)
  const [openPath, setOpenPath] = useState(null)

  function refresh() {
    setProgress(getAllProgress())
    setNextUp(getNextRecommendation())
  }
  useEffect(() => {
    refresh()
    window.addEventListener('msl_progress', refresh)
    // Auto-open a learning path when navigated from LandscapeTab
    const gotoPath = localStorage.getItem('msl_goto_path')
    if (gotoPath) {
      localStorage.removeItem('msl_goto_path')
      setOpenPath(gotoPath)
      setTimeout(() => {
        document.getElementById('learning-paths')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    }
    return () => window.removeEventListener('msl_progress', refresh)
  }, [])

  function pickRole(key) {
    const next = role === key ? null : key
    setRole(next)
    if (next) localStorage.setItem('msl_role', next)
    else localStorage.removeItem('msl_role')
  }

  const getTrackPct = id => progress.find(p => p.tab === id)?.pct ?? 0
  const activeRole  = ROLES.find(r => r.key === role)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* ── Hero ── */}
      <section>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 800, lineHeight: 1.07, letterSpacing: '-0.04em', marginBottom: '20px' }}>
          You can train a model.<br />
          <span className="text-gradient">Can you debug it in production?</span>
        </h1>

        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', marginBottom: '24px' }}>
          100+ production failure scenarios across 7 domains. Each one puts you inside a real system — Spark pipelines, DL training runs, recommendation stacks — and asks you to make the call.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button className="btn-primary" onClick={() => onNavigate('design')}>Run a failure scenario →</button>
          <button className="btn-secondary" onClick={() => document.getElementById('learning-paths')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Find your path</button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", marginBottom: '28px', letterSpacing: '0.04em' }}>
          Free · no account · 7 domains · 100+ scenarios
        </p>

        {/* ── Role selector ── */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'JetBrains Mono',monospace", marginBottom: '8px' }}>Personalise by role →</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ROLES.map(r => (
              <button key={r.key} onClick={() => pickRole(r.key)} title={r.desc}
                style={{ padding: '5px 12px', borderRadius: '7px', border: `1px solid ${role === r.key ? 'var(--prime)' : 'var(--rim)'}`, background: role === r.key ? 'rgba(240,165,0,0.10)' : 'transparent', color: role === r.key ? 'var(--prime)' : 'var(--ink-mid)', fontSize: '12px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {activeRole && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', padding: '14px 18px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '10px' }}>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{activeRole.desc}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn-primary"   onClick={() => onNavigate(activeRole.cta1.tab)}>{activeRole.cta1.label}</button>
              <button className="btn-secondary" onClick={() => onNavigate(activeRole.cta2.tab)}>{activeRole.cta2.label}</button>
            </div>
          </div>
        )}

        {/* ── Stats strip ── */}
        <div style={{ display: 'flex', border: '1px solid var(--rim)', borderRadius: '10px', overflow: 'hidden' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '12px 16px', borderRight: i < STATS.length - 1 ? '1px solid var(--rim)' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1 }} className="text-gradient">{s.n}</div>
              <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Progress ── */}
      {nextUp && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '10px', cursor: 'pointer' }}
          onClick={() => onNavigate(nextUp.tab)}>
          <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Continue</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: "'Space Grotesk',sans-serif" }}>{TRACKS.find(t => t.id === nextUp.tab)?.label ?? nextUp.tab}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ width: '72px', height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
              <div style={{ width: `${nextUp.pct}%`, height: '100%', background: TAB_ACCENT[nextUp.tab] ?? 'var(--mint)', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>{nextUp.pct}%</span>
          </div>
          <span style={{ color: 'var(--ink-low)', fontSize: '13px', flexShrink: 0 }}>→</span>
        </div>
      )}

      {/* ── Export progress ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn-ghost"
          style={{ fontSize: '11px', padding: '6px 14px' }}
          onClick={() => {
            const snapshot = {}
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i)
              try { snapshot[k] = JSON.parse(localStorage.getItem(k)) }
              catch { snapshot[k] = localStorage.getItem(k) }
            }
            const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
            const url  = URL.createObjectURL(blob)
            const a    = Object.assign(document.createElement('a'), { href: url, download: `msl-progress-${new Date().toISOString().slice(0,10)}.json` })
            a.click(); URL.revokeObjectURL(url)
          }}
        >↓ Export progress snapshot</button>
      </div>

      {/* ── Learning paths ── */}
      <section id="learning-paths">
        <div className="eyebrow">Learning paths</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          Guided sequences. Clear outcomes.
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', marginBottom: '16px', maxWidth: '500px', lineHeight: 1.6 }}>
          Seven paths across every role. Each step links directly to the right module.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {LEARNING_PATHS.map(path => {
            const isOpen = openPath === path.id
            return (
              <div key={path.id} style={{ border: `1px solid ${isOpen ? path.border : 'var(--rim)'}`, borderRadius: '12px', overflow: 'hidden', background: isOpen ? path.bg : 'transparent', transition: 'all 0.15s' }}>
                <button onClick={() => setOpenPath(isOpen ? null : path.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '15px', color: isOpen ? path.accent : 'var(--ink-hi)' }}>{path.name}</span>
                    <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--ink-low)', padding: '2px 8px', border: '1px solid var(--rim)', borderRadius: '999px' }}>{path.duration}</span>
                    <span style={{ fontSize: '11px', color: 'var(--ink-low)' }}>{path.steps.length} steps</span>
                  </div>
                  <span style={{ color: 'var(--ink-low)', fontSize: '13px', transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 20px 20px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, marginBottom: '16px', borderTop: `1px solid ${path.border}`, paddingTop: '14px' }}>
                      <span style={{ fontSize: '10px', color: path.accent, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'JetBrains Mono',monospace", display: 'block', marginBottom: '4px' }}>Outcome</span>
                      {path.outcome}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {path.steps.map((step, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: path.accent, minWidth: '20px', paddingTop: '2px', flexShrink: 0, fontWeight: 700 }}>{String(i+1).padStart(2,'0')}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '3px', fontFamily: "'Space Grotesk',sans-serif" }}>{step.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.55 }}>{step.desc}</div>
                          </div>
                          <button onClick={() => onNavigate(step.tab)}
                            style={{ fontSize: '11px', padding: '4px 10px', background: `${path.accent}15`, border: `1px solid ${path.border}`, borderRadius: '6px', color: path.accent, cursor: 'pointer', flexShrink: 0, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, whiteSpace: 'nowrap' }}>
                            Go →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Track grid ── */}
      <section>
        <div className="eyebrow">All tracks</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', marginBottom: '20px' }}>
          7 domains · 100+ scenarios · all free
        </h2>
        {DOMAIN_LABELS.map(domain => {
          const domainTracks = TRACKS.filter(t => domain.tracks.includes(t.id))
          return (
            <div key={domain.key} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, marginBottom: '8px' }}>{domain.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                {domainTracks.map(t => {
                  const pct     = getTrackPct(t.id)
                  const mastery = getTrackMastery(t.id) || inferMastery(pct)
                  return (
                    <button key={t.id} onClick={() => onNavigate(t.id)} className="card"
                      style={{ textAlign: 'left', padding: '14px 16px', background: `linear-gradient(135deg, var(--depth) 0%, ${t.bg} 100%)`, border: `1px solid ${t.border}`, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${t.border}` }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: t.accent }}>{t.label}</span>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          {t.type && (() => { const tb = TYPE_BADGE[t.type]; return <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: tb.bg, color: tb.color, border: `1px solid ${tb.border}`, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{tb.label}</span> })()}
                          {mastery && <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono',monospace", color: MASTERY_COLORS[mastery], padding: '1px 5px', border: `1px solid ${MASTERY_COLORS[mastery]}30`, borderRadius: '999px' }}>{MASTERY_LABELS[mastery]}</span>}
                          {pct > 0 && !mastery && <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--ink-low)' }}>{pct}%</span>}
                        </div>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--ink-low)', lineHeight: 1.5, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {t.modules.slice(0, 3).map(m => (
                          <span key={m} style={{ fontSize: '9px', fontFamily: "'JetBrains Mono',monospace", background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', color: 'var(--ink-low)', borderRadius: '4px', padding: '1px 6px' }}>{m}</span>
                        ))}
                        {t.modules.length > 3 && <span style={{ fontSize: '9px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>+{t.modules.length - 3}</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Python callout ── */}
      <section className="card-border-gradient" style={{ padding: '28px 32px' }}>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: '6px' }}>Python sandbox</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '20px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '8px', letterSpacing: '-0.03em' }}>
            Run sklearn, numpy, matplotlib — no server, no install.
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '520px', marginBottom: '16px' }}>
            Math Foundations runs real Python via Pyodide. PCA, SVD, calibration, preprocessing — not interactive slides, actual executable code. Use it to build intuition, not to skip reading.
          </p>
          <button className="btn-primary" onClick={() => onNavigate('models')}>Open Math Foundations →</button>
        </div>
      </section>

      {/* ── Ecosystem ── */}
      <section>
        <div className="eyebrow">Part of an ecosystem</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Three labs. One production mindset.</h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', marginBottom: '14px', maxWidth: '520px', lineHeight: 1.6 }}>ML Systems Lab covers core ML, DE, DL, and MLOps. The companion labs handle GenAI and experimentation.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {ECOSYSTEM.map(lab => (
            <div key={lab.name} className="card" style={{ padding: '22px', border: `1px solid ${lab.border}` }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: lab.accent, marginBottom: '8px' }}>{lab.name}</div>
              <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.65, margin: '0 0 14px 0' }}>{lab.desc}</p>
              {lab.url !== '#'
                ? <a href={lab.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: lab.accent, fontFamily: "'JetBrains Mono',monospace", textDecoration: 'none' }}>Visit ↗</a>
                : <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>Coming soon</span>
              }
            </div>
          ))}
        </div>
      </section>

      {/* ── Changelog ── */}
      <section>
        <div className="eyebrow">Changelog</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {CHANGELOG.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', padding: '11px 0', borderBottom: i < CHANGELOG.length - 1 ? '1px solid var(--rim)' : 'none', alignItems: 'baseline' }}>
              <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace", minWidth: '72px', flexShrink: 0 }}>{entry.date}</span>
              <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{entry.text}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
