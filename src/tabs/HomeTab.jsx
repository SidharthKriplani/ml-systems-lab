import { useState, useEffect } from 'react'
import { getAllProgress, getNextRecommendation, getTrackMastery, inferMastery } from '../utils/progress.js'
import { getBookmarks, toggleBookmark } from '../utils/bookmarks.js'
import { downloadProgressJSON } from '../utils/export.js'
import TESTIMONIALS from '../data/testimonials.js'

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


// ── Changelog ─────────────────────────────────────────────────────────────────
const CHANGELOG = [
  { date: 'Jun 2026', text: 'Project Lab complete — 5-phase Telco Churn pipeline (EDA → Features → Model → Monitoring → Deployment). Loan Default lab (credit risk, ECOA fairness audit, 3 of 4 phases). Fraud Detection lab (1:200 imbalance, precision@K). 2 new Gradient posts. 20 scenario framings rewritten.' },
  { date: 'May 2026', text: '100 interview questions + bookmarking on every judgment tab. 5 new modules: Broadcast Join Decisions, OOM Diagnosis, TS Model Selector, TS Feature Engineering, RAG Architecture.' },
  { date: 'May 2026', text: 'YouTube embeds for all 25 Gradient posts. Difficulty filter (easy/medium/hard), keyboard nav (1–4), module bookmarks, and progress export across all judgment modules.' },
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


// ── Mastery ───────────────────────────────────────────────────────────────────
const MASTERY_COLORS = { exploring: 'var(--ink-ghost)', practicing: 'var(--prime)', mastered: 'var(--prime-hi)' }
const MASTERY_LABELS = { exploring: 'Exploring', practicing: 'Practicing', mastered: 'Mastered' }

// ── Track grid ────────────────────────────────────────────────────────────────
const TRACKS = [
  // ML Engineering
  { id: 'models',       label: 'Math Foundations',    type: 'sandbox',  accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['PCA Explorer', 'SVD Decomposer', 'NumPy Internals', 'Calibration Curves'], description: 'The math behind the decisions — PCA, SVD, calibration, regularization. Python cells for hands-on exploration.' },
  { id: 'features',     label: 'Feature Engineering', type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Skew Simulator', 'Feature Store Designer', 'Leakage Zoo', 'Online/Offline Decider'], description: 'Training-serving skew, feature stores, leakage patterns. The bugs that silently corrupt production models.' },
  { id: 'eval',         label: 'Model Evaluation',    type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Metric Selector', 'Shadow Mode Sim'], description: 'Pick the wrong metric and you ship a model that looks great on paper while failing in production.' },
  { id: 'design',       label: 'System Design',       type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Incident Room', 'Design Canvas', 'Two-Tower Explorer', 'Serving Tradeoffs'], description: 'Production incident diagnosis, ML platform design, two-tower retrieval, serving architecture decisions.' },
  { id: 'classical',    label: 'Classical ML',        type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Model Failure Zoo', 'Ensemble Lab', 'Hyperparameter Priority'], description: 'When random forests, SVMs, and gradient boosting silently fail in production and why.' },
  // Data Engineering
  { id: 'spark',        label: 'Spark Lab',           type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Shuffle Hell', 'Skew Doctor', 'Partition Tuner'], description: 'PySpark execution mechanics. Diagnose shuffle bottlenecks, fix data skew, read execution DAGs.' },
  { id: 'airflow',      label: 'Airflow',             type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['DAG Failure Room', 'Backfill Lab', 'Late Data Handler'], description: 'Pipeline orchestration failures — broken DAGs, backfill decisions, late-arriving data.' },
  { id: 'dbt',          label: 'dbt',                 type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Materialization Oracle', 'Schema Drift Clinic', 'Incremental Decisions'], description: 'Transformation layer decisions. When incremental models break, schema drift diagnosis.' },
  { id: 'modeling',     label: 'Data Modeling',       type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Star vs OBT', 'SCD Types', 'OLAP Format Showdown'], description: 'Star schema vs OBT, SCD type decisions, Iceberg vs Delta vs Hive tradeoffs.' },
  // Deep Learning
  { id: 'dl',           label: 'Training Lab',        type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Training Failure Diagnosis', 'Backprop Debugging'], description: 'Diagnose training failures from telemetry — loss spikes, vanishing gradients, data leakage.' },
  { id: 'dl_finetune',  label: 'Fine-tuning',         type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Freeze vs LoRA', 'LR Strategy', 'PEFT Methods'], description: 'When to freeze, full fine-tune, or LoRA. The decision most people get wrong the first time.' },
  { id: 'dl_serving',   label: 'DL Serving',          type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Quantization', 'GPU Memory Calculator', 'Serving Architecture'], description: 'Quantization decisions, GPU memory math, and which serving pattern for your traffic shape.' },
  // MLOps
  { id: 'monitor',      label: 'Monitoring',          type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Drift Dashboard', 'PSI Lab', 'Incident Triage', 'Coverage Audit'], description: 'Drift detection, PSI/KS thresholds, incident triage, monitoring blind spots.' },
  { id: 'mlops_deploy', label: 'Deployment',          type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Deploy Strategies', 'Champion-Challenger', 'Rollback Decisions'], description: 'Blue-green vs canary vs shadow. Champion-challenger promotion. When to roll back immediately.' },
  { id: 'mlops_pipes',  label: 'CI/CD & Infra',       type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['CI/CD Gate Design', 'Infra Decisions', 'Model Registry'], description: 'Which CI gates block vs warn. REST vs Triton vs vLLM. Model registry patterns.' },
  // Data Science
  { id: 'ds',           label: 'DS Fundamentals',     type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Model Selection Oracle', 'Analysis Mistakes', 'Calibration', 'Metric Design Pitfalls'], description: 'Model selection, statistical testing pitfalls, calibration, and metric design under Goodhart\'s Law.' },
  { id: 'causal',       label: 'Causal Inference',    type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Causal vs Predictive', 'Identification Strategies', 'Confounder or Collider'], description: 'When prediction isn\'t enough. Identification strategies, confounders vs colliders, uplift modeling.' },
  { id: 'ts',           label: 'Time Series',         type: 'judgment', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Forecast Failure Zoo', 'Stationarity & Transforms', 'Anomaly Detection Tiers'], description: 'Why forecasts fail in production. Stationarity decisions, anomaly detection tier selection.' },
  // Resources
  { id: 'interview',    label: 'Interview Prep',      type: 'reference', accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['52 Questions', 'Fluency Drills', 'Timed Practice'], description: 'MLE interview bank for Spotify, Meta, Google, Airbnb, Uber, Netflix. Timed practice with 4-tier scoring.' },
  { id: 'gradient',     label: 'Gradient',            type: 'reading',  accent: 'var(--prime)', border: 'rgba(240,165,0,0.20)', bg: 'rgba(240,165,0,0.07)', modules: ['Feature engineering', 'Spark shuffle', 'System design', 'Post-mortems'], description: 'Long-form production ML writing. Architecture reasoning, failure analysis, engineering decisions.' },
]

const TAB_ACCENT = {
  models: 'var(--prime)', features: 'var(--prime)',
  eval: 'var(--prime)', classical: 'var(--prime)', design: 'var(--prime)',
  spark: 'var(--prime)', airflow: 'var(--prime)', dbt: 'var(--prime)', modeling: 'var(--prime)',
  dl: 'var(--prime)', dl_finetune: 'var(--prime)', dl_serving: 'var(--prime)',
  monitor: 'var(--prime)', mlops_deploy: 'var(--prime)', mlops_pipes: 'var(--prime)',
  ds: 'var(--prime)', causal: 'var(--prime)', ts: 'var(--prime)',
  interview: 'var(--prime)', gradient: 'var(--prime)', landscape: 'var(--prime)',
}

// ── Daily case scenarios ──────────────────────────────────────────────────────
const DAILY_CASES = [
  { domain: 'Feature Engineering', accent: 'var(--prime)', tab: 'features', q: "Offline AUC is 0.91. Online CTR dropped 18% on day 3 post-deploy. Pipeline logs are clean. What's the first thing you check?" },
  { domain: 'Model Evaluation',    accent: 'var(--prime)', tab: 'eval',     q: 'Precision is 0.92 on your test set. The fraud team is furious — the model keeps missing real fraud. What did you measure wrong?' },
  { domain: 'Spark',               accent: 'var(--prime)', tab: 'spark',    q: 'One Spark executor is processing 10x more data than the others. The job is 40 minutes late. No code changed. What caused this?' },
  { domain: 'ML System Design',    accent: 'var(--prime)', tab: 'design',   q: "You're building a two-tower retrieval model for 100M users. What's the biggest failure mode at serving time that won't show up in offline eval?" },
  { domain: 'Monitoring',          accent: 'var(--prime)', tab: 'monitor',  q: 'PSI on your top feature jumped from 0.08 to 0.31 overnight. Model performance metrics are unchanged. Is this a problem?' },
  { domain: 'Deployment',          accent: 'var(--prime)', tab: 'mlops_deploy', q: 'Canary at 5% traffic. New model P95 latency is 40ms higher. Accuracy looks the same. Do you roll back, investigate, or expand to 20%?' },
  { domain: 'Deep Learning',       accent: 'var(--prime)', tab: 'dl',       q: "Training loss decreases smoothly but validation loss diverges after epoch 3. You haven't touched the data pipeline. What's the most likely cause?" },
  { domain: 'DL Serving',          accent: 'var(--prime)', tab: 'dl_serving', q: 'Your quantized model passes all offline tests but accuracy degrades 8 points after deploying to the GPU cluster. Why?' },
  { domain: 'Airflow',             accent: 'var(--prime)', tab: 'airflow',  q: 'A daily pipeline missed its SLA by 3 hours. No task shows as failed. DAG logs look clean. Downstream data is wrong. What happened?' },
  { domain: 'Causal Inference',    accent: 'var(--prime)', tab: 'causal',   q: 'A/B test shows +4% conversion for treatment. Your data scientist says the result is invalid before even looking at the p-value. What check did they run?' },
  { domain: 'Time Series',         accent: 'var(--prime)', tab: 'ts',       q: "Demand forecast MAPE was 8% for 18 months. It jumped to 34% last week. No model changes were deployed. What's the most likely structural cause?" },
  { domain: 'Classical ML',        accent: 'var(--prime)', tab: 'classical', q: 'Your gradient boosting model has 97% accuracy. Business reports it fails on 40% of real transactions. You were not shown class distribution during training. What happened?' },
  { domain: 'Data Modeling',       accent: 'var(--prime)', tab: 'modeling', q: 'An analyst joined your fact table to a dimension table and got duplicate rows. No bug in their query. Which SCD type caused this and why?' },
  { domain: 'Fine-tuning',         accent: 'var(--prime)', tab: 'dl_finetune', q: 'Fine-tuned BERT on 50K examples. Strong eval set performance, but the model regresses badly on general NLP benchmarks. What happened?' },
  { domain: 'Data Science',        accent: 'var(--prime)', tab: 'ds',       q: 'You shipped a model that optimized the business metric. Three months later the metric improved but the actual outcome got worse. Name the effect.' },
]

// ── Role sequences ─────────────────────────────────────────────────────────────
const ROLE_SEQUENCES = {
  mle_interview:  [{ label: 'Defense Plan',  tab: 'defense'      }, { label: 'Combinator',   tab: 'combinator'  }, { label: 'Verbal Practice', tab: 'verbal'      }],
  production_ml:  [{ label: 'Feature Eng.',  tab: 'features'     }, { label: 'System Design', tab: 'design'     }, { label: 'Monitoring',      tab: 'monitor'     }],
  data_engineer:  [{ label: 'Spark Lab',     tab: 'spark'        }, { label: 'Airflow',       tab: 'airflow'    }, { label: 'dbt',             tab: 'dbt'         }],
  deep_learning:  [{ label: 'Training Lab',  tab: 'dl'           }, { label: 'Fine-tuning',   tab: 'dl_finetune'}, { label: 'DL Serving',      tab: 'dl_serving'  }],
  data_scientist: [{ label: 'Classical ML',  tab: 'classical'    }, { label: 'Model Eval',    tab: 'eval'       }, { label: 'Data Science',    tab: 'ds'          }],
  mlops:          [{ label: 'Deployment',    tab: 'mlops_deploy' }, { label: 'Monitoring',    tab: 'monitor'    }, { label: 'CI/CD & Infra',   tab: 'mlops_pipes' }],
  staff:          [{ label: 'System Design', tab: 'design'       }, { label: 'Staff Layer',   tab: 'stafflayer' }, { label: 'Defense Plan',    tab: 'defense'     }],
}

// ── Progress ring ─────────────────────────────────────────────────────────────
function Ring({ pct, size = 44, stroke = 3.5, accent = 'var(--prime)' }) {
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
  { key: 'mle',       label: 'ML Engineering',   tracks: ['models','features','eval','design','classical'], accent: 'var(--prime)' },
  { key: 'de',        label: 'Data Engineering',  tracks: ['spark','airflow','dbt','modeling'],             accent: 'var(--prime)' },
  { key: 'dl',        label: 'Deep Learning',     tracks: ['dl','dl_finetune','dl_serving'],                accent: 'var(--prime)' },
  { key: 'mlops',     label: 'MLOps',             tracks: ['monitor','mlops_deploy','mlops_pipes'],         accent: 'var(--prime)' },
  { key: 'ds',        label: 'Data Science',      tracks: ['ds','causal','ts'],                             accent: 'var(--prime)' },
  { key: 'resources', label: 'Resources',         tracks: ['interview','gradient'],                         accent: 'var(--prime)' },
]

// ── Guided paths ──────────────────────────────────────────────────────────────
const GUIDED_PATHS = [
  {
    id: 'foundations',
    label: 'Foundations Path',
    desc: 'Core ML judgment from the ground up',
    accent: 'var(--prime)',
    steps: [
      { tabId: 'features',  label: 'Feature Engineering' },
      { tabId: 'eval',      label: 'Model Evaluation' },
      { tabId: 'classical', label: 'Classical ML' },
      { tabId: 'monitor',   label: 'Monitoring' },
      { tabId: 'design',    label: 'System Design' },
    ],
  },
  {
    id: 'interview',
    label: 'Interview Prep',
    desc: 'MLE interview ready in 2 weeks',
    accent: 'var(--prime)',
    steps: [
      { tabId: 'defense',    label: 'Defense Plan' },
      { tabId: 'combinator', label: 'Combinator Mock' },
      { tabId: 'verbal',     label: 'Verbal Practice' },
      { tabId: 'design',     label: 'System Design' },
      { tabId: 'interview',  label: 'Q&A Bank' },
    ],
  },
  {
    id: 'production',
    label: 'Production Incidents',
    desc: 'Debug ML systems like a senior engineer',
    accent: 'var(--prime)',
    steps: [
      { tabId: 'monitor',      label: 'Monitoring' },
      { tabId: 'mlops_deploy', label: 'Deployment' },
      { tabId: 'codebugs',     label: 'Code Bugs' },
      { tabId: 'mlops_pipes',  label: 'CI/CD & Infra' },
      { tabId: 'stafflayer',   label: 'Staff Layer' },
    ],
  },
]

const TYPE_BADGE = {
  judgment:  { label: 'judgment',  color: 'var(--prime)',   bg: 'var(--prime-faint)',        border: 'rgba(240,165,0,0.22)' },
  sandbox:   { label: 'sandbox',   color: 'var(--ink-low)', bg: 'rgba(255,255,255,0.04)',    border: 'var(--rim)' },
  reference: { label: 'reference', color: 'var(--ink-low)', bg: 'rgba(255,255,255,0.04)',    border: 'var(--rim)' },
  reading:   { label: 'reading',   color: 'var(--ink-low)', bg: 'rgba(255,255,255,0.04)',    border: 'var(--rim)' },
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function HomeTab({ onNavigate }) {
  const [progress,       setProgress]       = useState([])
  const [nextUp,         setNextUp]         = useState(null)
  const [role,           setRole]           = useState(() => localStorage.getItem('msl_role') || null)

  const [bookmarks,      setBookmarks]      = useState(() => getBookmarks())
  const [showChangelog,  setShowChangelog]  = useState(false)
  const [streak,         setStreak]         = useState(0)
  const [activityGrid,   setActivityGrid]   = useState([])
  const [jumpBackTab,    setJumpBackTab]    = useState(null)
  const [showBanner,     setShowBanner]     = useState(() => {
    if (localStorage.getItem('msl_onboarded')) return false
    if (localStorage.getItem('msl_tab')) return false
    if (localStorage.getItem('msl_access')) return false
    const hasScore = Object.keys(localStorage).some(k => k.startsWith('msl_score:'))
    return !hasScore
  })

  function refresh() {
    setProgress(getAllProgress())
    setNextUp(getNextRecommendation())
  }


  function refreshBookmarks() { setBookmarks(getBookmarks()) }
  useEffect(() => {
    refresh()
    window.addEventListener('msl_progress', refresh)
    window.addEventListener('msl_bookmarks', refreshBookmarks)
    // --- Streak + activity tracking ---
    const today = new Date().toISOString().slice(0, 10)
    try { localStorage.setItem(`msl_activity_${today}`, String(parseInt(localStorage.getItem(`msl_activity_${today}`) || '0') + 1)) } catch(_) {}
    const lastVisit = localStorage.getItem('msl_last_visit')
    const saved = parseInt(localStorage.getItem('msl_streak') || '0')
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const newStreak = lastVisit === today ? (saved || 1) : lastVisit === yesterday ? saved + 1 : 1
    localStorage.setItem('msl_streak', String(newStreak))
    localStorage.setItem('msl_last_visit', today)
    setStreak(newStreak)
    // Build 91-day grid
    const grid = []
    for (let i = 90; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      grid.push({ date: d, count: parseInt(localStorage.getItem(`msl_activity_${d}`) || '0') })
    }
    setActivityGrid(grid)
    // Jump Back In
    const lastTab = localStorage.getItem('msl_tab')
    if (lastTab && lastTab !== 'home') setJumpBackTab(lastTab)

    return () => {
      window.removeEventListener('msl_progress', refresh)
      window.removeEventListener('msl_bookmarks', refreshBookmarks)
    }
  }, [])

  function pickRole(key) {
    const next = role === key ? null : key
    setRole(next)
    if (next) localStorage.setItem('msl_role', next)
    else localStorage.removeItem('msl_role')
  }

  const getTrackPct = id => progress.find(p => p.tab === id)?.pct ?? 0
  const activeRole  = ROLES.find(r => r.key === role)

  // Today's Case — deterministic per calendar day
  const todayCase = (() => {
    const d = new Date().toISOString().slice(0, 10)
    const seed = d.split('-').reduce((a, c) => a + parseInt(c, 10), 0)
    return DAILY_CASES[seed % DAILY_CASES.length]
  })()

  const jumpBackLabel = jumpBackTab ? (TRACKS.find(t => t.id === jumpBackTab)?.label ?? jumpBackTab) : null


  // ── Recommend first module based on role ──────────────────────────────────
  const ROLE_FIRST_MODULES = {
    mle_interview:  'defense',
    production_ml:  'features',
    data_engineer:  'spark',
    deep_learning:  'dl',
    data_scientist: 'classical',
    mlops:          'mlops_deploy',
    staff:          'design',
  }
  const recommendedFirstTab = role && ROLE_FIRST_MODULES[role] ? ROLE_FIRST_MODULES[role] : null
  const recommendedFirstModule = recommendedFirstTab ? TRACKS.find(t => t.id === recommendedFirstTab) : null
  // ── Domain completion data ──────────────────────────────────────────────
  const DOMAIN_COMPLETION_MAP = [
    { name: 'ML Engineering', accent: 'var(--prime)', trackIds: ['models','features','eval','design','classical'] },
    { name: 'Data Engineering', accent: 'var(--prime)', trackIds: ['spark','airflow','dbt','modeling'] },
    { name: 'Deep Learning', accent: 'var(--prime)', trackIds: ['dl','dl_finetune','dl_serving'] },
    { name: 'MLOps', accent: 'var(--prime)', trackIds: ['monitor','mlops_deploy','mlops_pipes'] },
    { name: 'Data Science', accent: 'var(--prime)', trackIds: ['ds','causal','ts'] },
  ]

  function getDomainProgress(domainData) {
    const trackProgress = domainData.trackIds.map(id => getTrackPct(id))
    const totalProgress = trackProgress.length > 0 ? Math.round(trackProgress.reduce((a,b) => a+b, 0) / trackProgress.length) : 0
    const completedTracks = trackProgress.filter(p => p > 0).length
    return { completed: completedTracks, total: domainData.trackIds.length, percent: totalProgress }
  }

  function navigateToDomain(trackIds) {
    const firstUnstarted = trackIds.find(id => getTrackPct(id) === 0)
    if (firstUnstarted) onNavigate(firstUnstarted)
    else onNavigate(trackIds[0])
  }

  function computeReadiness() {
    const DOMAIN_MAP = {
      mle:   ['Feature Engineering', 'Model Evaluation', 'ML Systems'],
      dl:    ['Deep Learning'],
      mlops: ['MLOps'],
      ds:    ['Experiment Design', 'Statistics & Probability', 'Ranking & Retrieval'],
      de:    ['SQL & Data'],
    }
    let trainerHistory = []
    let combHistory = []
    try { trainerHistory = JSON.parse(localStorage.getItem('msl_trainer_history') || '[]').slice(-10) } catch (_) {}
    try { combHistory = JSON.parse(localStorage.getItem('msl_combinator_history') || '[]').slice(-10) } catch (_) {}

    const sessionDomains = {}
    for (const session of [...trainerHistory, ...combHistory]) {
      const bd = session.domainBreakdown || {}
      for (const [d, stats] of Object.entries(bd)) {
        if (!sessionDomains[d]) sessionDomains[d] = { correct: 0, total: 0 }
        sessionDomains[d].correct += (stats.correct || 0)
        sessionDomains[d].total  += (stats.total || 0)
      }
    }

    const result = {}
    for (const [key, domainStrings] of Object.entries(DOMAIN_MAP)) {
      let sessCorrect = 0, sessTotal = 0
      for (const d of domainStrings) {
        if (sessionDomains[d]) { sessCorrect += sessionDomains[d].correct; sessTotal += sessionDomains[d].total }
      }
      result[key] = sessTotal > 0 ? Math.round((sessCorrect / sessTotal) * 100) : null
    }

    // Store readiness snapshot in localStorage
    try {
      const readinessSnapshot = {}
      for (const [key, accuracy] of Object.entries(result)) {
        if (accuracy !== null) {
          readinessSnapshot[key] = {
            accuracy,
            seniority: mapAccuracyToSeniority(accuracy),
            timestamp: new Date().toISOString()
          }
        }
      }
      if (Object.keys(readinessSnapshot).length > 0) {
        localStorage.setItem('msl_readiness_score', JSON.stringify(readinessSnapshot))
      }
    } catch (_) {}

    return result
  }

  function mapAccuracyToSeniority(accuracy) {
    if (accuracy >= 90) return 'Staff'
    if (accuracy >= 75) return 'Senior'
    if (accuracy >= 60) return 'Mid'
    return 'Junior'
  }

  function getSeniorityColor(seniority) {
    const colors = {
      'Junior': 'var(--ink-ghost)',
      'Mid': 'var(--ink-low)',
      'Senior': 'var(--prime)',
      'Staff': 'var(--mint)'
    }
    return colors[seniority] || 'var(--ink-ghost)'
  }

  const readinessScores = computeReadiness()

  function dismissBanner() {
    localStorage.setItem('msl_onboarded', '1')
    setShowBanner(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <style>{`@media (max-width: 480px) { .today-row { grid-template-columns: 1fr !important; } }`}</style>

      {/* ── Cold-state orientation banner ── */}
      {showBanner && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.35)', borderRadius: 'var(--r)', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>
            New here? Start with{' '}
            <button
              onClick={() => { dismissBanner(); onNavigate('features') }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--prime)', fontWeight: 700, fontSize: '13px', fontFamily: 'var(--font-sans)', textDecoration: 'underline' }}
            >Feature Engineering</button>
            {' '}(free) or enter code{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'rgba(240,165,0,0.13)', border: '1px solid rgba(240,165,0,0.30)', borderRadius: '4px', padding: '1px 6px', color: 'var(--prime)' }}>DAI2026</span>
            {' '}for full access.
          </span>
          <button
            onClick={dismissBanner}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: '16px', lineHeight: 1, padding: '0 4px', flexShrink: 0, fontFamily: 'var(--font-mono)' }}
            aria-label="Dismiss"
          >×</button>
        </div>
      )}

      {/* ── Jump Back In ── */}
      {jumpBackLabel && (
        <div
          onClick={() => onNavigate(jumpBackTab)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start', background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.28)', borderRadius: '24px', padding: '6px 16px 6px 10px', cursor: 'pointer', transition: 'background 0.15s' }}
        >
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--prime)', boxShadow: '0 0 8px rgba(240,165,0,0.8)', flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: '12px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>Continue: {jumpBackLabel} →</span>
        </div>
      )}


      {/* ── TODAY ── */}
      <section>
        <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '12px' }}>
          Today · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
        <div className="today-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '10px', alignItems: 'stretch' }}>
          {/* Case */}
          <div onClick={() => onNavigate(todayCase.tab)} style={{ background: 'var(--depth)', border: `1px solid var(--rim)`, borderLeft: `3px solid ${todayCase.accent}`, borderRadius: '12px', padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: todayCase.accent, textTransform: 'uppercase', letterSpacing: '0.08em', background: `${todayCase.accent}18`, border: `1px solid ${todayCase.accent}40`, borderRadius: '4px', padding: '2px 8px' }}>{todayCase.domain}</span>
              <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>Try it →</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--ink-hi)', lineHeight: 1.65, margin: 0, fontFamily: 'var(--font-sans)' }}>{todayCase.q}</p>
          </div>
          {/* Activity — hide grid when sparse, show streak number only */}
          {activityGrid.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '14px 16px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '12px' }}>
              {streak > 0 && (
                <>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--prime)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{streak}</div>
                  <div style={{ fontSize: '9px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>day streak</div>
                </>
              )}
              {activityGrid.filter(d => d.count > 0).length > 3 ? (
                <>
                  <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 8px)', gridAutoFlow: 'column', gridAutoColumns: '8px', gap: '2px', marginTop: '4px' }}>
                    {activityGrid.slice(-28).map(({ date, count }) => (
                      <div key={date} title={count > 0 ? `${date} · ${count} visit${count !== 1 ? 's' : ''}` : date} style={{ width: '8px', height: '8px', borderRadius: '1px', background: count > 0 ? 'var(--prime)' : 'rgba(255,255,255,0.06)', opacity: count > 0 ? Math.min(0.4 + count * 0.2, 1) : 1 }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>4 weeks</div>
                </>
              ) : (
                <div style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.5 }}>Day {streak} — keep going</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Role focus (collapsed when unset — no cold-state pill grid) ── */}
      <section>
        {role ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: activeRole ? '12px' : 0 }}>
              <span style={{ fontSize: '9px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Focus:</span>
              <span style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(240,165,0,0.45)', background: 'rgba(240,165,0,0.10)', color: 'var(--prime)', fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>{activeRole.label}</span>
              <button onClick={() => pickRole(role)} style={{ fontSize: '10px', color: 'var(--ink-ghost)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', textDecoration: 'underline', padding: 0, transition: 'color var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink-mid)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-ghost)' }}>change</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Focus area:</span>
            {ROLES.map(r => (
              <button key={r.key} onClick={() => pickRole(r.key)}
                style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--rim)', background: 'transparent', color: 'var(--ink-ghost)', fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer', transition: 'border-color var(--t-fast), color var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rim-hi)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-ghost)' }}>
                {r.label}
              </button>
            ))}
          </div>
        )}
        {activeRole && (
          <div style={{ padding: '14px 16px', background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.16)', borderRadius: '10px' }}>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: '0 0 12px' }}>{activeRole.desc}</p>
            {ROLE_SEQUENCES[activeRole.key] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Path:</span>
                {ROLE_SEQUENCES[activeRole.key].map((step, i) => (
                  <span key={step.tab} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <button onClick={() => onNavigate(step.tab)} style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.28)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-sans)', fontWeight: 600, cursor: 'pointer' }}>
                      {`${String(i + 1).padStart(2, '0')} ${step.label}`}
                    </button>
                    {i < ROLE_SEQUENCES[activeRole.key].length - 1 && <span style={{ color: 'var(--ink-ghost)', fontSize: '10px' }}>→</span>}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary"   onClick={() => onNavigate(activeRole.cta1.tab)}>{activeRole.cta1.label}</button>
              <button className="btn-secondary" onClick={() => onNavigate(activeRole.cta2.tab)}>{activeRole.cta2.label}</button>
            </div>
          </div>
        )}
      </section>

      {/* ── Guided Paths ── */}

      {/* ── Start Here (role-based first module recommendation) ── */}
      {role && recommendedFirstModule && (
        <section>
          <div style={{ padding: '16px 18px', background: 'linear-gradient(135deg, rgba(240,165,0,0.15) 0%, rgba(240,165,0,0.05) 100%)', border: '1px solid rgba(240,165,0,0.30)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all var(--t-fast)' }} onClick={() => onNavigate(recommendedFirstTab)} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(240,165,0,0.50)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240,165,0,0.18) 0%, rgba(240,165,0,0.08) 100%)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(240,165,0,0.30)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240,165,0,0.15) 0%, rgba(240,165,0,0.05) 100%)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Start here</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', marginBottom: '2px' }}>{recommendedFirstModule.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{recommendedFirstModule.description}</div>
            </div>
            <button style={{ padding: '8px 16px', background: 'var(--prime)', border: 'none', borderRadius: '6px', color: 'var(--void)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 700, cursor: 'pointer', flexShrink: 0, transition: 'all var(--t-fast)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--prime-hi)'; e.currentTarget.style.transform = 'scale(1.05)' }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--prime)'; e.currentTarget.style.transform = 'scale(1)' }}>
              Start →
            </button>
          </div>
        </section>
      )}

      <section>
        <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '12px' }}>Guided Paths</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {GUIDED_PATHS.map(path => {
            const started = path.steps.filter(s => (progress.find(p => p.tab === s.tabId)?.pct ?? 0) > 0).length
            const pct     = Math.round((started / path.steps.length) * 100)
            const nextStep = path.steps.find(s => (progress.find(p => p.tab === s.tabId)?.pct ?? 0) === 0) ?? path.steps[path.steps.length - 1]
            return (
              <div key={path.id} className="card card-interactive" style={{ padding: '14px 16px', borderLeft: `3px solid ${path.accent}`, display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: path.accent, fontFamily: 'var(--font-sans)', marginBottom: '2px' }}>{path.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-low)', lineHeight: 1.5 }}>{path.desc}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>{started}/{path.steps.length} steps</span>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: pct > 0 ? path.accent : 'var(--ink-ghost)' }}>{pct}%</span>
                  </div>
                  <div style={{ height: '2px', background: 'var(--rim)', borderRadius: '1px' }}>
                    <div className="progress-fill-animated" style={{ width: `${pct}%`, height: '100%', background: path.accent, borderRadius: '1px' }} />
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(nextStep.tabId)}
                  style={{ marginTop: '2px', padding: '5px 10px', background: `${path.accent}15`, border: `1px solid ${path.accent}35`, borderRadius: '6px', color: path.accent, fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  {pct === 0 ? 'Start' : pct === 100 ? 'Review' : 'Continue'}: {nextStep.label} →
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Continue ── */}
      {nextUp && nextUp.pct > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', background: 'var(--depth)', border: '1px solid var(--rim-hi)', borderLeft: `3px solid ${TAB_ACCENT[nextUp?.tab] ?? 'var(--prime)'}`, borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.50), 0 1px 4px rgba(0,0,0,0.3)', transition: 'transform 0.18s ease, box-shadow 0.18s' }}
          onClick={() => onNavigate(nextUp.tab)}>
          <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Continue</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{TRACKS.find(t => t.id === nextUp.tab)?.label ?? nextUp.tab}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ width: '72px', height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
              <div className="progress-fill-animated" style={{ width: `${nextUp.pct}%`, height: '100%', background: TAB_ACCENT[nextUp.tab] ?? 'var(--prime)', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{nextUp.pct}%</span>
          </div>
          <span style={{ color: 'var(--ink-low)', fontSize: '13px', flexShrink: 0 }}>→</span>
        </div>
      )}


      {/* ── Bookmarks ── */}
      {bookmarks.length > 0 && (
        <section>
          <div className="eyebrow">Bookmarked modules</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            {bookmarks.map(bm => (
              <div key={bm.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', minWidth: '80px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{bm.tabId}</span>
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{bm.label}</span>
                <button onClick={() => { localStorage.setItem('msl_goto_module', bm.moduleId); onNavigate(bm.tabId) }} style={{ fontSize: '11px', padding: '4px 12px', background: 'var(--prime)10', border: '1px solid var(--prime)30', borderRadius: '6px', color: 'var(--prime)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  Open →
                </button>
                <button onClick={() => { toggleBookmark(bm.tabId, bm.moduleId, bm.label); setBookmarks(getBookmarks()) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: '14px', padding: '0 4px' }}
                  title="Remove bookmark">✕</button>
              </div>
            ))}
          </div>
        </section>
      )}



      {/* ── Domain Progress Bars ── */}
      <section style={{ borderTop: '1px solid var(--rim)', paddingTop: '40px' }}>
        <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '12px' }}>Your Progress</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '32px' }}>
          {DOMAIN_COMPLETION_MAP.map(domain => {
            const { completed, total, percent } = getDomainProgress(domain)
            return (
              <div
                key={domain.name}
                onClick={() => navigateToDomain(domain.trackIds)}
                style={{
                  padding: '12px 16px',
                  background: 'var(--depth)',
                  border: '1px solid var(--rim)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color var(--t-fast), transform var(--t-fast)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--rim-hi)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--rim)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{domain.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)' }}>{completed}/{total}</div>
                </div>
                <div style={{ height: '4px', background: 'var(--rim)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${percent}%`, background: domain.accent, borderRadius: '2px', transition: 'width 0.3s ease', boxShadow: percent > 0 ? `0 0 6px ${domain.accent}50` : 'none' }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── All tracks ── */}
      <section style={{ borderTop: '1px solid var(--rim)', paddingTop: '40px' }}>
        {/* Domain completion overview */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '12px' }}>Readiness by domain</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DOMAIN_LABELS.filter(d => d.key !== 'resources').map(domain => {
              const domainTracks = TRACKS.filter(t => domain.tracks.includes(t.id))
              const completionPct = domainTracks.length > 0
                ? Math.round(domainTracks.reduce((sum, t) => sum + getTrackPct(t.id), 0) / domainTracks.length)
                : 0
              const started = domainTracks.filter(t => getTrackPct(t.id) > 0).length
              const sessScore = readinessScores[domain.key] ?? null
              const seniority = sessScore !== null ? mapAccuracyToSeniority(sessScore) : null
              const seniorityColor = seniority ? getSeniorityColor(seniority) : null
              return (
                <div key={domain.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-sans)', color: 'var(--ink-mid)', minWidth: '130px', flexShrink: 0 }}>{domain.label}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '4px', background: 'var(--rim)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div className="progress-fill-animated" style={{ width: `${completionPct}%`, height: '100%', background: domain.accent, borderRadius: '2px', boxShadow: completionPct > 0 ? `0 0 8px ${domain.accent}60` : 'none' }} />
                    </div>
                    {sessScore !== null && (
                      <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', marginTop: '2px' }}>
                        {started}/{domainTracks.length} modules
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, minWidth: '140px', justifyContent: 'flex-end' }}>
                    {sessScore !== null ? (
                      <>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)' }}>
                          {sessScore}%
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: seniorityColor,
                          background: `${seniorityColor}18`,
                          border: `1px solid ${seniorityColor}40`,
                          borderRadius: '4px',
                          padding: '2px 8px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase'
                        }}>
                          {seniority}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>
                        {started}/{domainTracks.length} started
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Role Readiness Summary */}
          {Object.values(readinessScores).some(s => s !== null) && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
              <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '10px' }}>Role Readiness Badges</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                {DOMAIN_LABELS.filter(d => d.key !== 'resources').map(domain => {
                  const sessScore = readinessScores[domain.key] ?? null
                  const seniority = sessScore !== null ? mapAccuracyToSeniority(sessScore) : null
                  const seniorityColor = seniority ? getSeniorityColor(seniority) : null

                  if (sessScore === null) return null

                  return (
                    <div key={domain.key} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      background: 'var(--depth)',
                      border: `1px solid ${seniorityColor}30`,
                      borderRadius: '8px'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 600,
                        color: 'var(--ink-hi)',
                        textAlign: 'center'
                      }}>
                        {domain.label}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: seniorityColor,
                        background: `${seniorityColor}18`,
                        border: `1.5px solid ${seniorityColor}50`,
                        borderRadius: '6px',
                        padding: '4px 10px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}>
                        {seniority}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--ink-ghost)'
                      }}>
                        {sessScore}% accuracy
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--rim)', margin: '0 0 16px' }} />
        <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '16px' }}>All tracks</div>
        {DOMAIN_LABELS.map(domain => {
          const domainTracks = TRACKS.filter(t => domain.tracks.includes(t.id))
          return (
            <div key={domain.key} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '8px' }}>{domain.label}</div>
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
                        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: t.accent }}>{t.label}</span>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          {t.type && (() => { const tb = TYPE_BADGE[t.type]; return <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', background: tb.bg, color: tb.color, border: `1px solid ${tb.border}`, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{tb.label}</span> })()}
                          {mastery && <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: MASTERY_COLORS[mastery], padding: '1px 5px', border: `1px solid ${MASTERY_COLORS[mastery]}30`, borderRadius: '999px' }}>{MASTERY_LABELS[mastery]}</span>}
                          {pct > 0 && !mastery && <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)' }}>{pct}%</span>}
                        </div>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--ink-low)', lineHeight: 1.5, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {t.modules.slice(0, 3).map(m => (
                          <span key={m} style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', color: 'var(--ink-low)', borderRadius: '4px', padding: '1px 6px' }}>{m}</span>
                        ))}
                        {t.modules.length > 3 && <span style={{ fontSize: '9px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>+{t.modules.length - 3}</span>}
                      </div>
                      {pct > 0 && (() => {
                        const tp = progress.find(p => p.tab === t.id)
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                              <span style={{ fontSize: '9px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>{tp?.done ?? 0}/{tp?.total ?? 0}</span>
                              <span style={{ fontSize: '9px', color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                            </div>
                            <div style={{ width: '100%', height: '2px', background: 'var(--rim)', borderRadius: '1px', marginTop: '4px' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--prime)', borderRadius: '1px', transition: 'width 0.5s ease' }} />
                            </div>
                          </>
                        )
                      })()}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>



      {/* ── Export Progress ── */}
      <section style={{ borderTop: '1px solid var(--rim)', paddingTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="eyebrow" style={{ margin: 0 }}>Export Progress</div>
          <button onClick={downloadProgressJSON} style={{ padding: '6px 14px', background: 'var(--prime)10', border: '1px solid var(--prime)30', borderRadius: '6px', color: 'var(--prime)', fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600, cursor: 'pointer', transition: 'all var(--t-fast)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--prime)15'; e.currentTarget.style.borderColor = 'var(--prime)40' }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--prime)10'; e.currentTarget.style.borderColor = 'var(--prime)30' }}>
            Download JSON ↓
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, marginTop: '10px' }}>Backup all your progress, bookmarks, and settings. File includes all msl_* localStorage keys.</p>
      </section>

      {/* ── Testimonials ── */}
      {TESTIMONIALS.length > 0 && (
        <section style={{ paddingTop: '32px', borderTop: '1px solid var(--rim)' }}>
          <div className="section-eyebrow" style={{ marginBottom: '16px' }}>What engineers say</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {TESTIMONIALS.filter(t => t.approved).map((t, i) => (
              <div key={i} style={{
                padding: '16px 18px',
                border: '1px solid var(--rim)',
                borderLeft: '3px solid var(--prime)',
                borderRadius: '10px',
                background: 'rgba(240,165,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>{t.role} · {t.company}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--prime)', letterSpacing: '1px', flexShrink: 0 }}>
                    {'★'.repeat(t.rating)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Changelog ── */}
      <section>
        <button
          onClick={() => setShowChangelog(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showChangelog ? '12px' : 0 }}
        >
          <div className="eyebrow" style={{ margin: 0 }}>Changelog</div>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', transition: 'transform 0.15s', display: 'inline-block', transform: showChangelog ? 'rotate(90deg)' : 'rotate(0deg)' }}>▸</span>
        </button>
        {showChangelog && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {CHANGELOG.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', padding: '11px 0', borderBottom: i < CHANGELOG.length - 1 ? '1px solid var(--rim)' : 'none', alignItems: 'baseline' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', minWidth: '72px', flexShrink: 0 }}>{entry.date}</span>
                <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{entry.text}</span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
