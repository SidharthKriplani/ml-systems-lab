import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { trackTabSwitch } from './analytics.js'
import GlobalSearch from './components/GlobalSearch.jsx'
import ContentMap   from './components/ContentMap.jsx'
import AccessGate   from './components/AccessGate.jsx'
import FeedbackChip from './components/FeedbackChip.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import { INTERVIEW_EXPERIENCES } from './data/interviewExperiences.js'

const HomeTab           = lazy(() => import('./tabs/HomeTab.jsx'))
const SparkLabTab       = lazy(() => import('./tabs/SparkLabTab.jsx'))
const FeatureEngTab     = lazy(() => import('./tabs/FeatureEngTab.jsx'))
const ModelEvalTab      = lazy(() => import('./tabs/ModelEvalTab.jsx'))
const ModelsMathTab     = lazy(() => import('./tabs/ModelsMathTab.jsx'))
const SystemDesignTab   = lazy(() => import('./tabs/SystemDesignTab.jsx'))
const MonitoringTab     = lazy(() => import('./tabs/MonitoringTab.jsx'))
const InterviewPrepTab  = lazy(() => import('./tabs/InterviewPrepTab.jsx'))
const GradientTab       = lazy(() => import('./tabs/GradientTab.jsx'))
const LandscapeTab      = lazy(() => import('./tabs/LandscapeTab.jsx'))
const ClassicalMLTab    = lazy(() => import('./tabs/ClassicalMLTab.jsx'))
const MLOpsDeployTab    = lazy(() => import('./tabs/MLOpsDeployTab.jsx'))
const MLOpsPipelinesTab = lazy(() => import('./tabs/MLOpsPipelinesTab.jsx'))
const DeepLearningTab   = lazy(() => import('./tabs/DeepLearningTab.jsx'))
const DLFineTuningTab   = lazy(() => import('./tabs/DLFineTuningTab.jsx'))
const DLServingTab      = lazy(() => import('./tabs/DLServingTab.jsx'))
const DataScienceTab    = lazy(() => import('./tabs/DataScienceTab.jsx'))
const CausalInferenceTab = lazy(() => import('./tabs/CausalInferenceTab.jsx'))
const TimeSeriesTab     = lazy(() => import('./tabs/TimeSeriesTab.jsx'))
const AirflowTab        = lazy(() => import('./tabs/AirflowTab.jsx'))
const DbtTab            = lazy(() => import('./tabs/dbtTab.jsx'))
const DataModelingTab   = lazy(() => import('./tabs/DataModelingTab.jsx'))
const AskTab            = lazy(() => import('./tabs/AskTab.jsx'))
const TakeHomeTab    = lazy(() => import('./tabs/TakeHomeTab.jsx'))
const TrainerTab     = lazy(() => import('./tabs/TrainerTab.jsx'))
const CombinatorTab  = lazy(() => import('./tabs/CombinatorTab.jsx'))
const CodeBugsTab    = lazy(() => import('./tabs/CodeBugsTab.jsx'))
const CaseStudiesTab = lazy(() => import('./tabs/CaseStudiesTab.jsx'))
const StaffLayerTab  = lazy(() => import('./tabs/StaffLayerTab.jsx'))
const JDPrepTab      = lazy(() => import('./tabs/JDPrepTab.jsx'))
const DefenseDocTab  = lazy(() => import('./tabs/DefenseDocTab.jsx'))
const VerbatimTab    = lazy(() => import('./tabs/VerbatimTab.jsx'))
const SpotTheFlawTab = lazy(() => import('./tabs/SpotTheFlawTab.jsx'))
const ProjectLabTab  = lazy(() => import('./tabs/ProjectLabTab.jsx'))
const LoanDefaultTab = lazy(() => import('./tabs/LoanDefaultTab.jsx'))
const FraudDetectionTab = lazy(() => import('./tabs/FraudDetectionTab.jsx'))

// ── Tab registry ──────────────────────────────────────────────────────────────
const ALL_TABS = [
  { id: 'home',         component: HomeTab },
  { id: 'models',       component: ModelsMathTab },
  { id: 'features',     component: FeatureEngTab },
  { id: 'eval',         component: ModelEvalTab },
  { id: 'design',       component: SystemDesignTab },
  { id: 'classical',    component: ClassicalMLTab },
  { id: 'spark',        component: SparkLabTab },
  { id: 'airflow',      component: AirflowTab },
  { id: 'dbt',          component: DbtTab },
  { id: 'modeling',     component: DataModelingTab },
  { id: 'dl',           component: DeepLearningTab },
  { id: 'dl_finetune',  component: DLFineTuningTab },
  { id: 'dl_serving',   component: DLServingTab },
  { id: 'ds',           component: DataScienceTab },
  { id: 'causal',       component: CausalInferenceTab },
  { id: 'ts',           component: TimeSeriesTab },
  { id: 'monitor',      component: MonitoringTab },
  { id: 'mlops_deploy', component: MLOpsDeployTab },
  { id: 'mlops_pipes',  component: MLOpsPipelinesTab },
  { id: 'interview',    component: InterviewPrepTab },
  { id: 'gradient',     component: GradientTab },
  { id: 'landscape',    component: LandscapeTab },
  { id: 'ask',          component: AskTab },
  // New feature tabs
  { id: 'takehome',    component: TakeHomeTab },
  { id: 'trainer',     component: TrainerTab },
  { id: 'combinator',  component: CombinatorTab },
  { id: 'codebugs',    component: CodeBugsTab },
  { id: 'casestudies', component: CaseStudiesTab },
  { id: 'stafflayer',  component: StaffLayerTab },
  { id: 'jdprep',      component: JDPrepTab },
  { id: 'defense',     component: DefenseDocTab },
  { id: 'verbal',      component: VerbatimTab },
  { id: 'spottheflaw', component: SpotTheFlawTab },
  { id: 'projectlab',  component: ProjectLabTab },
  { id: 'loan_default', component: LoanDefaultTab },
  { id: 'fraud_detection', component: FraudDetectionTab },
]

// ── Freemium gate ─────────────────────────────────────────────────────────────
// Free: home, landscape, gradient, ask, models, features, eval, classical
// Premium: all Interview zone, all interview tools, all advanced practice modules
const PREMIUM_TABS = new Set([
  // Interview zone (Defense Plan is free — has internal gate)
  'interview', 'takehome', 'combinator', 'verbal', 'spottheflaw',
  // Interview tools (Practice > Drills domain)
  'trainer', 'codebugs', 'casestudies', 'stafflayer',
  // Advanced practice modules
  'design', 'spark', 'airflow', 'dbt', 'modeling',
  'dl', 'dl_finetune', 'dl_serving',
  'ds', 'causal', 'ts',
  'monitor', 'mlops_deploy', 'mlops_pipes',
  'projectlab', 'loan_default', 'fraud_detection',
])
const ACCESS_CODE = 'DAI2026'

// ── Zone routing ──────────────────────────────────────────────────────────────
const TAB_TO_ZONE = {
  home: 'today', landscape: 'today',
  gradient: 'read',
  interview: 'interview',
  takehome: 'interview', combinator: 'interview',
  jdprep: 'interview', defense: 'interview', verbal: 'interview',
  spottheflaw: 'interview',
  ask: 'ask',
}
const ZONE_DEFAULTS = {
  today: 'home', practice: null, read: 'gradient', interview: null, ask: 'ask',
}
function getZoneForTab(id) { return TAB_TO_ZONE[id] ?? 'practice' }

// ── Bottom nav zones ──────────────────────────────────────────────────────────
const NAV_ZONES = [
  { id: 'today',     label: 'Today',     icon: '◎', accent: 'var(--prime)' },
  { id: 'practice',  label: 'Practice',  icon: '⊞', accent: 'var(--prime)' },
  { id: 'read',      label: 'Read',      icon: '∇', accent: 'var(--prime)' },
  { id: 'interview', label: 'Interview', icon: '◈', accent: 'var(--prime)' },
  { id: 'ask',       label: 'Search',    icon: '✦', accent: 'var(--prime)' },
]

// ── Practice domain config ────────────────────────────────────────────────────
const PRACTICE_DOMAINS = [
  {
    id: 'mle', label: 'ML Engineering', accent: 'var(--prime)', bg: 'var(--prime-faint)',
    tabs: [
      { id: 'models',    label: 'Math Foundations',    desc: 'PCA, SVD, calibration — Python in browser' },
      { id: 'features',  label: 'Feature Engineering', desc: 'Skew, leakage, feature stores' },
      { id: 'eval',      label: 'Model Evaluation',    desc: 'Metrics, shadow mode, calibration' },
      { id: 'design',    label: 'System Design',       desc: 'Incident room, two-tower, ML platform' },
      { id: 'classical',   label: 'Classical ML',        desc: 'Failure zoo, ensembles, hyperparams' },
      { id: 'projectlab',   label: 'Project Lab',         desc: 'End-to-end DS notebook — churn prediction with Pyodide' },
      { id: 'loan_default', label: 'Loan Default',          desc: 'Credit risk notebook — fairness audit, ECOA, disparate impact' },
      { id: 'fraud_detection', label: 'Fraud Detection', desc: 'Transaction fraud notebook — extreme 1:200 imbalance, precision@K, ops team capacity' },
    ],
  },
  {
    id: 'de', label: 'Data Engineering', accent: 'var(--prime)', bg: 'var(--prime-faint)',
    tabs: [
      { id: 'spark',    label: 'Spark Lab',     desc: 'Shuffle, skew, broadcast join decisions' },
      { id: 'airflow',  label: 'Airflow',       desc: 'DAG failures, backfill, late data' },
      { id: 'dbt',      label: 'dbt',           desc: 'Materialization, schema drift' },
      { id: 'modeling', label: 'Data Modeling', desc: 'Star/OBT, SCDs, OLAP formats' },
    ],
  },
  {
    id: 'dl', label: 'Deep Learning', accent: 'var(--prime)', bg: 'var(--prime-faint)',
    tabs: [
      { id: 'dl',          label: 'Training Lab', desc: 'Loss spikes, gradients, debugging' },
      { id: 'dl_finetune', label: 'Fine-tuning',  desc: 'LoRA, freeze, LR strategy' },
      { id: 'dl_serving',  label: 'DL Serving',   desc: 'Quantization, GPU memory, serving' },
    ],
  },
  {
    id: 'ds', label: 'Data Science', accent: 'var(--prime)', bg: 'var(--prime-faint)',
    tabs: [
      { id: 'ds',     label: 'DS Fundamentals',  desc: 'Model selection, calibration, metrics' },
      { id: 'causal', label: 'Causal Inference', desc: 'Identification, uplift, obs vs exp' },
      { id: 'ts',     label: 'Time Series',      desc: 'Failures, stationarity, anomaly detection' },
    ],
  },
  {
    id: 'mlops', label: 'MLOps', accent: 'var(--prime)', bg: 'var(--prime-faint)',
    tabs: [
      { id: 'monitor',      label: 'Monitoring',    desc: 'Drift, PSI, incident triage' },
      { id: 'mlops_deploy', label: 'Deployment',    desc: 'Strategies, champion-challenger, rollback' },
      { id: 'mlops_pipes',  label: 'CI/CD & Infra', desc: 'Gates, infra decisions, model registry' },
    ],
  },
  {
    id: 'iprep', label: 'Drills', accent: 'var(--prime)', bg: 'var(--prime-faint)',
    tabs: [
      { id: 'trainer',     label: 'Trainer',      desc: 'Flashcard MCQ drill + weakness heatmap' },
      { id: 'codebugs',    label: 'Code Bugs',    desc: '20 Python/SQL production bugs to spot' },
      { id: 'casestudies', label: 'Case Studies', desc: 'Netflix, Uber, Airbnb, DoorDash, Spotify' },
      { id: 'stafflayer',  label: 'Staff Layer',  desc: 'IC3 → IC5 → Staff perspective reveals' },
    ],
  },
]

// ── Interview zone tools ──────────────────────────────────────────────────────
const INTERVIEW_TOOLS = [
  { id: 'interview',  label: 'Interview Q&A',    desc: '128 curated questions with model answers across system design, ML fundamentals, and behavioural.', step: null, accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { id: 'takehome',   label: 'Take-Home Bank',   desc: '15 open-ended questions. No time limit. Write your answer, then compare against a senior model response.', step: null, accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: 'defense',    label: 'Defense Plan',     desc: 'Paste your JD, self-rate your gaps, get a day-by-day study plan with round-by-round coverage. The strategic core of your prep.', step: '01', accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: 'combinator', label: 'Combinator',       desc: 'Full mock exam. 30, 45, or 60 minutes. Answers locked until you finish. Debrief shows your weakest domains.', step: '02', accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { id: 'verbal',     label: 'Verbal Practice',  desc: 'Record yourself answering out loud. Playback and compare. Closes the gap between knowing the answer and saying it clearly.', step: '03', accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> },
  { id: 'spottheflaw', label: 'Spot the Flaw', desc: '12 real ML analyses each containing exactly one buried methodological flaw. Find it before the interviewer does.', step: null, accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg> },
]

// all practice tabs flat, for label lookup
const ALL_PRACTICE_TABS = PRACTICE_DOMAINS.flatMap(d => d.tabs.map(t => ({ ...t, domainAccent: d.accent })))

// ── Progress helpers ──────────────────────────────────────────────────────────
const SCORE_TAB_MAP = {
  spark: 'spark', ts: 'ts', sysdesign: 'design',
  modeleval: 'eval', deeplearn: 'dl', causal: 'causal',
}

function readTabProgress() {
  const progress = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('msl_score:')) continue
      const rest   = key.slice('msl_score:'.length)
      const prefix = Object.keys(SCORE_TAB_MAP).find(p => rest.startsWith(p + '_'))
      if (!prefix) continue
      const appTab = SCORE_TAB_MAP[prefix]
      if (!progress[appTab]) progress[appTab] = { attempted: 0, total: 0 }
      const items = JSON.parse(localStorage.getItem(key) || '[]')
      progress[appTab].total     += items.length
      progress[appTab].attempted += items.filter(it => it.revealed).length
    }
  } catch {}
  return progress
}

// ── Routing helpers ───────────────────────────────────────────────────────────
function getTabFromHash() {
  const hash = window.location.hash.replace('#', '')
  return ALL_TABS.find(t => t.id === hash)?.id ?? null
}
function setHash(tabId) {
  window.history.replaceState(null, '', tabId === 'home' ? window.location.pathname : `#${tabId}`)
}

// ── ProgressRing ──────────────────────────────────────────────────────────────
function ProgressRing({ attempted, total, accent }) {
  const r = 6, circ = 2 * Math.PI * r
  const dash = total > 0 ? Math.min(attempted / total, 1) * circ : 0
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      <circle cx="8" cy="8" r={r} fill="none" stroke={accent} strokeWidth="2"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 8 8)" opacity={0.8} />
    </svg>
  )
}

// ── PracticeCard ──────────────────────────────────────────────────────────────
function PracticeCard({ tab, domain, onSelect, tabProgress, isUnlocked }) {
  const [hov, setHov] = useState(false)
  const prog   = tabProgress?.[tab.id]
  const pct    = prog && prog.total > 0 ? Math.round((prog.attempted / prog.total) * 100) : 0
  const locked = PREMIUM_TABS.has(tab.id) && !isUnlocked

  return (
    <button
      onClick={() => onSelect(tab.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left', padding: '14px 16px',
        background: hov ? domain.bg : 'transparent',
        borderTop:    `1px solid ${hov ? domain.accent + '60' : 'var(--rim)'}`,
        borderRight:  `1px solid ${hov ? domain.accent + '60' : 'var(--rim)'}`,
        borderBottom: `1px solid ${hov ? domain.accent + '60' : 'var(--rim)'}`,
        borderLeft:   `3px solid ${locked ? 'var(--rim-hi)' : domain.accent}`,
        borderRadius: '10px', cursor: 'pointer',
        transition: 'all 0.18s ease', width: '100%',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        opacity: locked ? 0.72 : 1,
        boxShadow: hov
          ? `0 16px 48px rgba(0,0,0,0.60), 0 0 0 1px ${domain.accent}30, -4px 0 24px ${domain.accent}18`
          : '0 2px 12px rgba(0,0,0,0.40)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: hov ? 'var(--ink-hi)' : 'var(--ink-mid)', fontFamily: "var(--font-sans)", transition: 'color 0.14s' }}>
          {tab.label}
        </span>
        {locked
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-ghost)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          : prog && prog.total > 0 && <ProgressRing attempted={prog.attempted} total={prog.total} accent={domain.accent} />
        }
      </div>
      <p style={{ fontSize: '11px', color: 'var(--ink-low)', lineHeight: 1.5, margin: 0 }}>{tab.desc}</p>
      {!locked && pct > 0 && (
        <div style={{ marginTop: '9px', height: '2px', background: 'var(--rim)', borderRadius: '1px' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: domain.accent, borderRadius: '1px' }} />
        </div>
      )}
    </button>
  )
}

// ── PracticeDomainCard ───────────────────────────────────────────────────────
// Shown when user clicks on a domain in the practice grid.
// Includes difficulty filter UI above module navigation.
function PracticeDomainCard({ domain, onSelect, onGoBack, tabProgress, isUnlocked }) {
  const DIFFICULTY_OPTIONS = ['easy', 'junior', 'mid', 'senior', 'staff']

  // Load filter from localStorage
  const [selectedDifficulties, setSelectedDifficulties] = useState(() => {
    try {
      const stored = localStorage.getItem('msl_difficulty_filter')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Persist filter to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('msl_difficulty_filter', JSON.stringify(selectedDifficulties))
  }, [selectedDifficulties])

  // Filter tabs based on selected difficulties
  const filteredTabs = selectedDifficulties.length === 0
    ? domain.tabs
    : domain.tabs.filter(tab => {
        return selectedDifficulties.some(difficulty => {
          // This is a conservative filter: if ANY scenario in the tab has the selected difficulty, include it
          // We check the difficulty field that tabs should have from their scenarios
          return true // Will be refined once tab-level difficulty is added
        })
      })

  function toggleDifficulty(difficulty) {
    setSelectedDifficulties(prev => {
      if (prev.includes(difficulty)) {
        return prev.filter(d => d !== difficulty)
      } else {
        return [...prev, difficulty]
      }
    })
  }

  function clearFilter() {
    setSelectedDifficulties([])
  }

  return (
    <div style={{ paddingTop: '8px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '16px', color: 'var(--ink-hi)' }}>
          {domain.label}
        </h2>

        {/* ── Difficulty filter pills ── */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "var(--font-mono)", textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Filter by difficulty
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DIFFICULTY_OPTIONS.map(difficulty => {
              const isSelected = selectedDifficulties.includes(difficulty)
              return (
                <button
                  key={difficulty}
                  onClick={() => toggleDifficulty(difficulty)}
                  className="msl-option-btn"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${isSelected ? 'var(--prime)' : 'var(--rim)'}`,
                    background: isSelected ? 'var(--prime-bg-light)' : 'transparent',
                    color: isSelected ? 'var(--prime)' : 'var(--ink-low)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {difficulty}
                </button>
              )
            })}
          </div>
          {selectedDifficulties.length > 0 && (
            <button
              onClick={clearFilter}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                fontSize: '11px',
                color: 'var(--ink-ghost)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* ── Module navigation ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredTabs.map(tab => (
          <PracticeCard key={tab.id} tab={tab} domain={domain} onSelect={onSelect} tabProgress={tabProgress} isUnlocked={isUnlocked} />
        ))}
      </div>

      {filteredTabs.length === 0 && selectedDifficulties.length > 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-low)', fontSize: '13px' }}>
          No modules match the selected difficulty filters.
        </div>
      )}
    </div>
  )
}

// ── PracticeGrid ──────────────────────────────────────────────────────────────
function PracticeGrid({ onSelect, tabProgress, isUnlocked }) {
  const totalAttempted = Object.values(tabProgress ?? {}).reduce((s, p) => s + (p.attempted || 0), 0)
  const totalScenarios = Object.values(tabProgress ?? {}).reduce((s, p) => s + (p.total || 0), 0)

  return (
    <div style={{ paddingTop: '8px' }}>
      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: "var(--font-mono)", textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Practice</div>
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '8px', color: 'var(--ink-hi)' }}>
          200+ production scenarios.
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '560px', marginBottom: '6px' }}>
          Every module starts with a real incident. No definitions. No theory. You make the call first, then see why you were right or wrong.
        </p>
      </div>
      {totalScenarios > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: 'var(--card-pad-primary)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "var(--font-mono)" }}>Your progress</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ width: `${Math.round((totalAttempted / totalScenarios) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 10px var(--prime-glow)' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: "var(--font-mono)", flexShrink: 0 }}>
            {totalAttempted}/{totalScenarios}
          </span>
        </div>
      )}
      {PRACTICE_DOMAINS.map(domain => (
        <div key={domain.id} style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', fontFamily: "var(--font-mono)", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: domain.accent, textShadow: `0 0 18px ${domain.accent}90`, whiteSpace: 'nowrap' }}>
              {domain.label}
            </span>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${domain.accent}50, transparent)` }} />
          </div>
          <div className="grid-cards">
            {domain.tabs.map(tab => (
              <PracticeCard key={tab.id} tab={tab} domain={domain} onSelect={onSelect} tabProgress={tabProgress} isUnlocked={isUnlocked} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── InterviewToolCard ─────────────────────────────────────────────────────────
function InterviewToolCard({ tool, onSelect, isUnlocked }) {
  const [hov, setHov] = useState(false)
  const locked = PREMIUM_TABS.has(tool.id) && !isUnlocked
  return (
    <button
      onClick={() => onSelect(tool.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left', padding: '20px 22px',
        background: hov
          ? `linear-gradient(160deg, rgba(255,255,255,0.13) 0%, var(--depth) 30%)`
          : `linear-gradient(160deg, rgba(255,255,255,0.07) 0%, var(--depth) 40%)`,
        border: `1px solid ${hov ? tool.accent + '55' : 'rgba(255,255,255,0.15)'}`,
        borderTop: `1px solid ${hov ? tool.accent + '80' : 'rgba(255,255,255,0.11)'}`,
        borderRadius: '14px', cursor: 'pointer',
        transition: 'all 0.18s ease', width: '100%',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        opacity: locked ? 0.72 : 1,
        boxShadow: hov
          ? `0 20px 56px rgba(0,0,0,0.65), 0 0 0 1px ${tool.accent}22, inset 0 1px 0 rgba(255,255,255,0.09)`
          : '0 4px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.11)',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ color: tool.accent, opacity: hov ? 1 : 0.75, transition: 'opacity 0.15s' }}>{tool.svg}</div>
        {locked
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-ghost)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          : tool.step && (
            <span style={{ fontSize: '10px', fontFamily: "var(--font-mono)", color: tool.accent, background: `${tool.accent}18`, border: `1px solid ${tool.accent}35`, borderRadius: '5px', padding: '2px 7px', letterSpacing: '0.06em', flexShrink: 0 }}>
              STEP {tool.step}
            </span>
          )
        }
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: hov ? 'var(--ink-hi)' : 'var(--ink-mid)', fontFamily: "var(--font-sans)", letterSpacing: '-0.02em', marginBottom: '8px', transition: 'color 0.14s' }}>
        {tool.label}
      </div>
      <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{tool.desc}</p>
    </button>
  )
}

// ── TagFrequencyChart ─────────────────────────────────────────────────────────
function TagFrequencyChart({ experiences }) {
  const tagFrequency = {}
  experiences.forEach(exp => {
    exp.tags.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
    })
  })

  const sorted = Object.entries(tagFrequency).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ marginTop: '32px' }}>
      <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: "var(--font-mono)", textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>
        Interview skill coverage
      </div>
      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', marginBottom: '16px' }}>
        Based on {experiences.length} submitted experiences
      </p>
      {sorted.map(([tag, count]) => {
        const pct = Math.round((count / experiences.length) * 100)
        return (
          <div key={tag} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
              <span style={{ color: 'var(--ink-hi)', textTransform: 'capitalize', fontWeight: 500 }}>
                {tag.replace(/_/g, ' ')}
              </span>
              <span style={{ color: 'var(--ink-mid)', fontFamily: "var(--font-mono)" }}>
                {count}/{experiences.length} ({pct}%)
              </span>
            </div>
            <div style={{ height: '6px', background: 'var(--rim)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--prime)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * ── Admin Workflow: Interview Experience Submissions ──
 *
 * When real submissions arrive from Tally form (https://tally.so/r/wMRZzZ):
 *
 * 1. Monitor submissions via Tally dashboard
 * 2. Once N >= 15 real submissions collected, download as JSON export
 * 3. For each submission, create an entry in src/data/interviewExperiences.js with schema:
 *    {
 *      id: 'exp_XXX',
 *      name: string,
 *      company: string,
 *      role: string,
 *      yearsExp: number (0-20),
 *      round: string (Behavioral, System Design, Coding, Deep Dive, Take-home),
 *      date: string (YYYY-MM format),
 *      tags: string[] (selected from skills covered checkboxes),
 *      prepSource: string (mapped from "How did you prepare?" field),
 *      result: string (Offer, Reject, Pending, Advance to next round)
 *    }
 * 4. Tally field mapping:
 *    - "Skills covered" (checkboxes) → tags array
 *    - "How did you prepare?" (optional text) → prepSource
 *    - "Outcome" (multiple choice) → result
 * 5. Add new entries to INTERVIEW_EXPERIENCES array in src/data/interviewExperiences.js
 * 6. Commit + push to trigger Vercel deploy
 * 7. TagFrequencyChart automatically re-renders with updated data
 *
 * Growth metric: Track when N >= 15 real submissions reached to enable
 * visualization v2 (currently seeds with 15 sample records for demo)
 */
function InterviewGrid({ onSelect, isUnlocked }) {
  return (
    <div style={{ paddingTop: '8px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: "var(--font-mono)", textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Interview prep</div>
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', marginBottom: '10px', color: 'var(--ink-hi)' }}>
          Six tools. One loop.
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '560px' }}>
          Steps 01–03 are a sequence: Defense Plan → Combinator → Verbal. Run them in order starting two weeks before your interview. The other tools work any time. Drills (Trainer, Code Bugs, Case Studies, Staff Layer) live in Practice.
        </p>
      </div>
      <div className="grid-cards-wide">
        {INTERVIEW_TOOLS.map(tool => (
          <InterviewToolCard key={tool.id} tool={tool} onSelect={onSelect} isUnlocked={isUnlocked} />
        ))}
      </div>

      {/* ── Interview Experience submission card ── */}
      <div style={{
        marginTop: '28px',
        padding: '18px 20px',
        border: '1px solid var(--rim)',
        borderLeft: '3px solid var(--prime)',
        borderRadius: '10px',
        background: 'var(--prime-faint)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>
            Share your interview experience
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, maxWidth: '480px' }}>
            Help others prepare by sharing your interview journey. We'll add your experience to our community insights and build a skill frequency map over time.
          </div>
        </div>
        <a
          href="https://tally.so/r/wMRZzZ"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flexShrink: 0,
            background: 'var(--prime-bg-light)',
            border: '1px solid var(--prime-glow)',
            borderRadius: '8px',
            padding: '12px 18px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--prime)',
            fontFamily: 'var(--font-sans)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Submit experience →
        </a>
      </div>

      {/* ── Tag Frequency Chart ── */}
      {INTERVIEW_EXPERIENCES && INTERVIEW_EXPERIENCES.length > 0 && (
        <TagFrequencyChart experiences={INTERVIEW_EXPERIENCES} />
      )}
    </div>
  )
}

// ── DesktopSidebar ────────────────────────────────────────────────────────────
// Guiding principle: user always knows where they are and what to do next.
// Flat domain sections — one click to any tab. No lock icons. Progress inline.
function DesktopSidebar({ activeZone, zoneTab, goTo, tabProgress, isUnlocked }) {
  const [openDomains, setOpenDomains] = useState(() => {
    const initial = {}
    PRACTICE_DOMAINS.forEach(d => { initial[d.id] = true })
    return initial
  })

  function toggleDomain(domainId) {
    setOpenDomains(prev => ({ ...prev, [domainId]: !prev[domainId] }))
  }

  const activeTabId = zoneTab[activeZone]

  function getTabPct(tabId) {
    const p = tabProgress?.[tabId]
    if (!p || p.total === 0) return 0
    return Math.round((p.attempted / p.total) * 100)
  }

  const isHomeActive   = activeZone === 'today'
  const isSearchActive = activeZone === 'ask'

  // Shared nav item base — hover handled via onMouseEnter/Leave
  function NavBtn({ id, label, accent, isActive, indent = false, extra = null, onClick }) {
    const [hov, setHov] = useState(false)
    return (
      <button
        onClick={onClick || (() => goTo(id))}
        className={isActive ? 'sidebar-item-active' : ''}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '100%', textAlign: 'left',
          padding: indent ? '4px 12px 4px 26px' : '6px 14px',
          background: isActive ? undefined : hov ? 'rgba(255,255,255,0.04)' : 'none',
          border: 'none', cursor: 'pointer',
          transition: 'background var(--t-fast), color var(--t-fast)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: indent ? '12px' : '13px',
            fontWeight: isActive ? 600 : 400,
            color: isActive ? undefined : hov ? 'var(--ink-mid)' : 'var(--ink-low)',
            transition: 'color var(--t-fast)',
          }}>{label}</span>
          {extra}
        </div>
      </button>
    )
  }

  return (
    <aside className="desktop-sidebar" style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: '220px',
      background: 'var(--depth)',
      backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
      borderRight: '1px solid var(--rim)',
      flexDirection: 'column', overflowY: 'auto',
      zIndex: 60, scrollbarWidth: 'none',
    }}>

      {/* ── Logo ── */}
      <button
        onClick={() => goTo('home')}
        style={{
          padding: '14px 14px 12px', flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--prime-faint)',
          borderBottom: '1px solid var(--rim)',
          border: 'none', cursor: 'pointer', width: '100%',
          transition: 'opacity var(--t)',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        <div style={{
          width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
          background: 'var(--prime)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '9px', color: 'var(--void)',
          boxShadow: '0 0 18px var(--prime-glow), 0 2px 8px rgba(0,0,0,0.6)',
        }}>ML</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '13px', color: 'var(--ink-hi)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Systems Lab</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: 600, color: 'var(--ink-ghost)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>ml · data · mlops</span>
        </div>
      </button>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '6px 0 16px', overflowY: 'auto', scrollbarWidth: 'none' }}>

        {/* Home */}
        <NavBtn id="home" label="Home" accent="var(--prime)" isActive={isHomeActive} onClick={() => goTo('home')} />

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '5px 14px' }} />
        <div style={{ padding: '8px 14px 2px', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'rgba(255,255,255,0.22)', userSelect: 'none' }}>Practice</div>

        {/* Practice domains */}
        {PRACTICE_DOMAINS.map(domain => {
          const isOpen = openDomains[domain.id] !== false
          const domainHasActive = domain.tabs.some(t => t.id === activeTabId) && activeZone === 'practice'
          return (
            <div key={domain.id}>
              {/* Domain header */}
              <button
                onClick={() => toggleDomain(domain.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '4px 12px 3px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  transition: 'opacity var(--t-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                <span style={{
                  fontFamily: 'var(--font-sans)', fontSize: '11px',
                  fontWeight: domainHasActive ? 700 : 500,
                  color: domainHasActive ? domain.accent : 'var(--ink-mid)',
                  letterSpacing: '0.01em',
                  transition: 'color var(--t-fast)',
                }}>{domain.label}</span>
                <span style={{
                  fontSize: '8px', color: 'rgba(255,255,255,0.28)', display: 'inline-block',
                  transition: 'transform var(--t)',
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                }}>▶</span>
              </button>

              {/* Tab items */}
              {isOpen && domain.tabs.map(tab => {
                const isTabActive = activeTabId === tab.id && activeZone === 'practice'
                const pct = getTabPct(tab.id)
                const isDimmed = PREMIUM_TABS.has(tab.id) && !isUnlocked
                return (
                  <NavBtn
                    key={tab.id}
                    id={tab.id}
                    label={tab.label}
                    accent={domain.accent}
                    isActive={isTabActive}
                    indent
                    extra={
                      pct > 0
                        ? <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: isTabActive ? domain.accent : 'var(--ink-ghost)', flexShrink: 0 }}>{pct}%</span>
                        : isDimmed
                          ? <span style={{ fontSize: '8px', color: 'var(--ink-ghost)', opacity: 0.6, flexShrink: 0 }}>pro</span>
                          : null
                    }
                  />
                )
              })}
            </div>
          )
        })}

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '5px 14px' }} />
        <div style={{ padding: '8px 14px 2px', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'rgba(255,255,255,0.22)', userSelect: 'none' }}>Interview</div>

        {/* Interview tools */}
        {INTERVIEW_TOOLS.map(tool => {
          const isToolActive = activeTabId === tool.id && activeZone === 'interview'
          const isDimmed = PREMIUM_TABS.has(tool.id) && !isUnlocked
          return (
            <NavBtn
              key={tool.id}
              id={tool.id}
              label={tool.label}
              accent={tool.accent}
              isActive={isToolActive}
              indent
              extra={
                isDimmed && !isToolActive
                  ? <span style={{ fontSize: '8px', color: 'var(--ink-ghost)', opacity: 0.6, flexShrink: 0 }}>pro</span>
                  : null
              }
            />
          )
        })}

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '5px 14px' }} />
        <div style={{ padding: '8px 14px 2px', fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'rgba(255,255,255,0.22)', userSelect: 'none' }}>Read</div>

        {[
          { id: 'gradient',  label: 'Gradient ∇', accent: 'var(--prime)', zone: 'read' },
          { id: 'landscape', label: 'Landscape',   accent: 'var(--prime)', zone: 'today' },
        ].map(item => {
          const isActive = activeTabId === item.id && activeZone === item.zone
          return <NavBtn key={item.id} id={item.id} label={item.label} accent={item.accent} isActive={isActive} indent />
        })}

      </nav>

      {/* ── Search — PAL-style bottom bar ── */}
      <div style={{ padding: '8px 10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <button
          onClick={() => goTo('ask')}
          className={isSearchActive ? 'sidebar-item-active' : ''}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', textAlign: 'left',
            background: isSearchActive ? undefined : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isSearchActive ? 'var(--prime)' : 'rgba(255,255,255,0.10)'}`,
            borderRadius: 'var(--r-sm)',
            padding: '7px 10px',
            cursor: 'pointer',
            transition: 'border-color var(--t), background var(--t), box-shadow var(--t)',
          }}
          onMouseEnter={e => {
            if (!isSearchActive) {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--prime-bg-light)'
            }
          }}
          onMouseLeave={e => {
            if (!isSearchActive) {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: isSearchActive ? 'var(--prime)' : 'var(--ink-ghost)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: '12px', color: isSearchActive ? undefined : 'var(--ink-low)' }}>Search</span>
          <kbd style={{ fontSize: '9px', padding: '2px 5px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '3px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>⌘K</kbd>
        </button>
      </div>

    </aside>
  )
}

// ── BottomNav ─────────────────────────────────────────────────────────────────
function BottomNav({ activeZone, onZoneNav }) {
  return (
    <nav className="bottom-nav-safe" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--topbar-bg)',
      backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
      borderTop: '1px solid var(--rim)',
      boxShadow: 'inset 0 1px 0 0 var(--prime-glow), 0 -12px 48px rgba(0,0,0,0.55)',
      zIndex: 100,
    }}>
      <div style={{ height: '68px', display: 'flex', alignItems: 'stretch', width: '100%', overflow: 'hidden' }}>
      {NAV_ZONES.map(zone => {
        const isActive = activeZone === zone.id
        return (
          <button key={zone.id} onClick={() => onZoneNav(zone.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? zone.accent : 'rgba(255,255,255,0.62)',
              transition: 'color 0.15s',
              padding: '8px 2px 10px',
              position: 'relative',
              minWidth: 0, overflow: 'hidden',
              WebkitTapHighlightColor: 'transparent',
            }}>
            {/* Active top bar */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '18%', right: '18%',
                height: '3px', background: zone.accent,
                borderRadius: '0 0 4px 4px',
                boxShadow: `0 0 16px ${zone.accent}, 0 0 4px ${zone.accent}`,
              }} />
            )}
            {/* Icon with active glow pill */}
            <div style={{
              width: '36px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px',
              background: isActive
                ? `radial-gradient(ellipse at center, ${zone.accent}38 0%, ${zone.accent}12 60%, transparent 100%)`
                : 'transparent',
              boxShadow: isActive ? `0 0 18px ${zone.accent}50` : 'none',
              transition: 'all 0.20s ease',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '18px', lineHeight: 1, filter: isActive ? `drop-shadow(0 0 6px ${zone.accent})` : 'none', transition: 'filter 0.20s' }}>{zone.icon}</span>
            </div>
            <span style={{
              fontSize: '10px', fontFamily: 'var(--font-sans)',
              fontWeight: isActive ? 700 : 500,
              letterSpacing: '0',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}>{zone.label}</span>
          </button>
        )
      })}
      </div>
    </nav>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeZone, setActiveZone] = useState(() => {
    const tab = getTabFromHash() || localStorage.getItem('msl_tab') || 'home'
    return getZoneForTab(tab)
  })
  const [zoneTab, setZoneTab] = useState(() => {
    const tab  = getTabFromHash() || localStorage.getItem('msl_tab') || 'home'
    const zone = getZoneForTab(tab)
    return { ...ZONE_DEFAULTS, [zone]: zone === 'practice' ? tab : ZONE_DEFAULTS[zone] }
  })
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [tabProgress, setTabProgress] = useState(() => readTabProgress())
  const [isUnlocked,  setIsUnlocked]  = useState(() => localStorage.getItem('msl_access') === ACCESS_CODE)
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('msl_theme') || 'dark' } catch { return 'dark' }
  })

  function handleUnlock(code) {
    if (code === ACCESS_CODE) {
      localStorage.setItem('msl_access', code)
      setIsUnlocked(true)
    }
  }

  // Navigate to any tabId from anywhere
  const goTo = useCallback((tabId) => {
    const zone = getZoneForTab(tabId)
    setActiveZone(zone)
    setZoneTab(prev => ({ ...prev, [zone]: tabId }))
    setSearchOpen(false)
    trackTabSwitch(tabId)
    window.scrollTo(0, 0)
  }, [])

  // Hash + localStorage sync
  useEffect(() => {
    const tab = zoneTab[activeZone] ?? (activeZone === 'today' ? 'home' : activeZone === 'read' ? 'gradient' : activeZone)
    if (tab) {
      localStorage.setItem('msl_tab', tab)
      setHash(tab)
    }
  }, [activeZone, zoneTab])

  // Hash change from browser
  useEffect(() => {
    function onHashChange() {
      const t = getTabFromHash()
      if (t) goTo(t)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [goTo])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Progress ring updates
  useEffect(() => {
    function onProgress() { setTabProgress(readTabProgress()) }
    window.addEventListener('storage', onProgress)
    window.addEventListener('msl_score_updated', onProgress)
    return () => {
      window.removeEventListener('storage', onProgress)
      window.removeEventListener('msl_score_updated', onProgress)
    }
  }, [])

  // Theme persistence — dark: remove attribute, light: set data-theme="light"
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '')
    try { localStorage.setItem('msl_theme', theme) } catch {}
  }, [theme])

  // Bottom nav tap: same zone → reset to default (e.g. back to practice grid)
  function handleZoneNav(zoneId) {
    if (zoneId === activeZone) {
      setZoneTab(prev => ({ ...prev, [zoneId]: ZONE_DEFAULTS[zoneId] }))
    } else {
      setActiveZone(zoneId)
    }
    window.scrollTo(0, 0)
  }

  // Topbar context
  const currentTabId    = zoneTab[activeZone]
  const isPracticeGrid  = activeZone === 'practice'  && !currentTabId
  const isInterviewGrid = activeZone === 'interview' && !currentTabId
  const showBackBtn     = (activeZone === 'practice' || activeZone === 'interview') && !!currentTabId
  const ALL_NAV_TABS    = [
    ...ALL_PRACTICE_TABS,
    ...INTERVIEW_TOOLS.map(t => ({ ...t, domainAccent: t.accent })),
  ]
  const activeTabInfo = showBackBtn ? ALL_NAV_TABS.find(t => t.id === currentTabId) : null

  function renderContent() {
    if (isPracticeGrid)  return <PracticeGrid  onSelect={goTo} tabProgress={tabProgress} isUnlocked={isUnlocked} />
    if (isInterviewGrid) return <InterviewGrid onSelect={goTo} isUnlocked={isUnlocked} />
    // Defense Plan handles its own internal gate; jdprep redirects here
    if (currentTabId === 'defense' || currentTabId === 'jdprep') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <DefenseDocTab onNavigate={goTo} isUnlocked={isUnlocked} onUnlock={handleUnlock} />
        </Suspense>
      )
    }
    if (currentTabId && PREMIUM_TABS.has(currentTabId) && !isUnlocked) {
      return <AccessGate onUnlock={handleUnlock} />
    }
    const Component = ALL_TABS.find(t => t.id === currentTabId)?.component
    return Component ? (
      <Suspense fallback={<LoadingSpinner />}>
        <Component onNavigate={goTo} />
      </Suspense>
    ) : (
      <Suspense fallback={<LoadingSpinner />}>
        <HomeTab onNavigate={goTo} />
      </Suspense>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--void)' }}>

      {/* ── Desktop sidebar (hidden on mobile via CSS) ── */}
      <DesktopSidebar activeZone={activeZone} zoneTab={zoneTab} goTo={goTo} onZoneNav={handleZoneNav} tabProgress={tabProgress} isUnlocked={isUnlocked} />

      {/* ── Desktop main wrapper (offset for sidebar on desktop) ── */}
      <div className="desktop-main-wrapper">

      {/* ── Topbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: 'var(--topbar-bg)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--rim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden', flex: 1 }}>
          {showBackBtn ? (
            <>
              <button
                onClick={() => setZoneTab(prev => ({ ...prev, [activeZone]: null }))}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '13px', fontFamily: "var(--font-sans)", padding: '10px 8px', margin: '-10px -8px' }}>
                ← <span>{activeZone === 'interview' ? 'Tools' : 'Domains'}</span>
              </button>
              {activeTabInfo && (
                <>
                  <span style={{ color: 'var(--rim)', fontSize: '13px' }}>/</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: activeTabInfo.domainAccent || activeTabInfo.accent, fontFamily: "var(--font-sans)", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeTabInfo.label}
                  </span>
                </>
              )}
            </>
          ) : (
            <button onClick={() => handleZoneNav('today')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'var(--prime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: '8px', color: 'var(--white)', flexShrink: 0 }}>ML</div>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', letterSpacing: '-0.02em' }}>Systems Lab</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', background: 'none', border: '1px solid var(--rim)', borderRadius: '7px', cursor: 'pointer', color: 'var(--ink-low)', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rim-hi)'; e.currentTarget.style.color = 'var(--ink-hi)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-low)' }}
          >
            {theme === 'light' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </button>
          {!showBackBtn && (
            <a href="https://github.com/SidharthKriplani/ml-systems-lab" target="_blank" rel="noopener noreferrer"
              className="hide-mobile"
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '6px', color: 'var(--ink-low)', fontSize: '11px', fontFamily: "var(--font-mono)", textDecoration: 'none', transition: 'border-color 0.15s', letterSpacing: '0.02em' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.57v-2.02c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.48 1 .1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.68.83.57C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          )}
          <button
            onClick={() => setSearchOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', borderRadius: '7px', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '12px', fontFamily: "var(--font-sans)" }}>
            <span style={{ fontSize: '13px' }}>⌕</span>
            <span style={{ display: 'inline' }}>Search</span>
            <kbd style={{ fontFamily: "var(--font-mono)", fontSize: '10px', background: 'rgba(255,255,255,0.14)', padding: '1px 5px', borderRadius: '4px', color: 'var(--ink-ghost)' }} className="hide-mobile">⌘K</kbd>
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main
        className="fade-in main-content"
        style={{
          maxWidth: '1080px', width: '100%',
          margin: '0 auto',
          padding: '32px 20px 80px',
          boxSizing: 'border-box',
        }}>
        {renderContent()}
      </main>

      {/* ── Bottom nav (hidden on desktop via CSS) ── */}
      <BottomNav activeZone={activeZone} onZoneNav={handleZoneNav} />

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--rim)', padding: '14px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
          Also by the same team:{' '}
          <a href="https://genai-systems-lab-ivory.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-ghost)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>GenAI Systems Lab</a>
          {' · '}
          <a href="https://experimentation-systems-lab.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-ghost)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Product Analytics Lab</a>
        </p>
      </footer>

      </div>{/* end desktop-main-wrapper */}

      {/* ── Feedback chip (global, fixed bottom-right) ── */}
      <FeedbackChip />

      {/* ── Content map (Cmd+K) ── */}
      {searchOpen && (
        <ContentMap
          onClose={() => setSearchOpen(false)}
          onNavigate={goTo}
          isUnlocked={isUnlocked}
          practiceDomains={PRACTICE_DOMAINS}
          interviewTools={INTERVIEW_TOOLS}
          premiumTabs={PREMIUM_TABS}
        />
      )}
    </div>
  )
}
