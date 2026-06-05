import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { trackTabSwitch } from './analytics.js'
import GlobalSearch from './components/GlobalSearch.jsx'
import ContentMap   from './components/ContentMap.jsx'
import AccessGate   from './components/AccessGate.jsx'
import FeedbackChip from './components/FeedbackChip.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import AuthModal    from './components/auth/AuthModal.jsx'
import { ACCESS_CODE, STORAGE_KEY, isUnlocked as checkUnlocked } from './utils/unlock.js'
import { authEnabled, onAuthStateChange } from './utils/supabase.js'
import { pullProgressFromSupabase } from './utils/syncProgress.js'


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
const CausalInferenceTab = lazy(() => import('./tabs/CausalInferenceTab.jsx'))
const TimeSeriesTab     = lazy(() => import('./tabs/TimeSeriesTab.jsx'))
const AirflowTab        = lazy(() => import('./tabs/AirflowTab.jsx'))
const DbtTab            = lazy(() => import('./tabs/dbtTab.jsx'))
const DataModelingTab   = lazy(() => import('./tabs/DataModelingTab.jsx'))
const TakeHomeTab    = lazy(() => import('./tabs/TakeHomeTab.jsx'))
const TrainerTab     = lazy(() => import('./tabs/TrainerTab.jsx'))
const CombinatorTab  = lazy(() => import('./tabs/CombinatorTab.jsx'))
const CodeBugsTab    = lazy(() => import('./tabs/CodeBugsTab.jsx'))
const CaseStudiesTab = lazy(() => import('./tabs/CaseStudiesTab.jsx'))
const StaffLayerTab  = lazy(() => import('./tabs/StaffLayerTab.jsx'))
const DefenseDocTab  = lazy(() => import('./tabs/DefenseDocTab.jsx'))
const VerbatimTab    = lazy(() => import('./tabs/VerbatimTab.jsx'))
const SpotTheFlawTab    = lazy(() => import('./tabs/SpotTheFlawTab.jsx'))
const IncidentRoomTab   = lazy(() => import('./tabs/IncidentRoomTab.jsx'))
const MLCodingTab       = lazy(() => import('./tabs/MLCodingTab.jsx'))
const ProjectLabTab     = lazy(() => import('./tabs/ProjectLabTab.jsx'))
const LoanDefaultTab = lazy(() => import('./tabs/LoanDefaultTab.jsx'))
const FraudDetectionTab = lazy(() => import('./tabs/FraudDetectionTab.jsx'))
const PlansTab          = lazy(() => import('./tabs/PlansTab.jsx'))
const ProfilePage       = lazy(() => import('./tabs/ProfilePage.jsx'))
const SignedOutHome     = lazy(() => import('./tabs/SignedOutHome.jsx'))

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
  { id: 'causal',       component: CausalInferenceTab },
  { id: 'ts',           component: TimeSeriesTab },
  { id: 'monitor',      component: MonitoringTab },
  { id: 'mlops_deploy', component: MLOpsDeployTab },
  { id: 'mlops_pipes',  component: MLOpsPipelinesTab },
  { id: 'interview',    component: InterviewPrepTab },
  { id: 'gradient',     component: GradientTab },
  { id: 'landscape',    component: LandscapeTab },
  // New feature tabs
  { id: 'takehome',    component: TakeHomeTab },
  { id: 'trainer',     component: TrainerTab },
  { id: 'combinator',  component: CombinatorTab },
  { id: 'codebugs',    component: CodeBugsTab },
  { id: 'casestudies', component: CaseStudiesTab },
  { id: 'stafflayer',  component: StaffLayerTab },
  { id: 'defense',     component: DefenseDocTab },
  { id: 'verbal',      component: VerbatimTab },
  { id: 'spottheflaw',   component: SpotTheFlawTab },
  { id: 'incidentroom',  component: IncidentRoomTab },
  { id: 'mlcoding',      component: MLCodingTab },
  { id: 'projectlab',    component: ProjectLabTab },
  { id: 'loan_default', component: LoanDefaultTab },
  { id: 'fraud_detection', component: FraudDetectionTab },
  { id: 'plans',   component: PlansTab },
  { id: 'profile', component: ProfilePage },
]

// ── Freemium gate ─────────────────────────────────────────────────────────────
// Free:    home, landscape, gradient, ask, models, features, eval, classical
// Premium: all Interview zone tools, all Labs, all advanced practice modules
// Tiers:   Anonymous (free tabs) → Code holder (all tabs) → Stripe (future)
// See src/utils/unlock.js for the single source of truth on access logic.
const PREMIUM_TABS = new Set([
  // Interview zone
  'interview', 'takehome', 'combinator', 'verbal', 'spottheflaw', 'incidentroom', 'mlcoding',
  // Labs (drill tools + project labs)
  'trainer', 'codebugs', 'casestudies', 'stafflayer',
  'projectlab', 'loan_default', 'fraud_detection',
  // Advanced practice modules
  'design', 'spark', 'airflow', 'dbt', 'modeling',
  'dl', 'dl_finetune', 'dl_serving',
  'causal', 'ts',
  'monitor', 'mlops_deploy', 'mlops_pipes',
])

// ── Gate copy — outcome-framed per surface (PAL pattern) ──────────────────────
// Every locked tab shows copy specific to what the user is missing.
// copy: { title, body, ctaLabel }. ctaLabel defaults to "Get access →".
const GATE_COPY = {
  // ── Interview tools ──
  interview:    { title: '128 curated MLE questions',         body: 'Every question has a model answer and a 4-tier scoring guide. The fastest way to close gaps before the loop starts.' },
  combinator:   { title: 'Full mock exam — 45 minutes',       body: '100 questions locked until the clock stops. A full per-domain debrief when you finish. The closest simulation to the real screen.' },
  verbal:       { title: 'Verbal practice with live recording', body: 'Record yourself answering out loud. Hear the gap between knowing and saying. 25 prompts used in real interview loops.' },
  spottheflaw:  { title: 'Spot the Flaw — 12 adversarial analyses', body: 'Each analysis contains exactly one buried methodological error. Find it before the interviewer does. The hardest format in the loop.' },
  incidentroom: { title: 'Production incident diagnosis',     body: '6 cross-domain incidents requiring reasoning across Feature Eng, Monitoring, Serving, and Experimentation. Multi-step, no MCQ.' },
  mlcoding:     { title: 'ML coding — live in browser',       body: '7 Python problems from real senior/staff loops. Custom loss, vectorized features, k-fold from scratch. Live Pyodide execution.' },
  takehome:     { title: '15 open-ended system design questions', body: 'No time limit. Write your answer, then compare against a senior model response. The format most engineers underestimate.' },
  stafflayer:   { title: 'Staff-level answer reveals',        body: 'The same scenario answered at IC3, IC5, and Staff. See what "Staff-level thinking" actually means — not just a better answer, a different frame.' },
  trainer:      { title: 'MCQ drill + weakness heatmap',      body: '60 questions with immediate feedback. A spaced repetition queue surfaces what to revisit. The fastest feedback loop in the product.' },
  codebugs:     { title: 'Bug Hunt — 20 production snippets', body: 'Each snippet has exactly one buried flaw that ships silently in production. Find it before the interviewer does.' },
  casestudies:  { title: 'Netflix, Uber, Airbnb, DoorDash, Spotify', body: 'Real ML system decisions at scale — not case studies invented for a textbook. What did they actually build and why?' },
  // ── Project Labs ──
  projectlab:     { title: 'End-to-end ML project — Telco Churn',   body: 'A full DS notebook in your browser. Real Pyodide execution across 5 phases: EDA → Features → Model → Monitoring → Deployment.' },
  loan_default:   { title: 'End-to-end ML project — Loan Default',  body: 'Credit risk notebook with ECOA fairness audit, proxy detection, and PSI drift monitoring. 4 phases, live execution.' },
  fraud_detection:{ title: 'End-to-end ML project — Fraud Detection', body: '1:200 class imbalance, SMOTE, precision@K, and an ops runbook. The production ML problem most candidates have never simulated.' },
  // ── Advanced practice modules ──
  design:      { title: 'ML system design scenarios',    body: 'Two-tower systems, ML platform decisions, real incident diagnosis. The format that trips up most senior loop candidates.' },
  spark:       { title: 'Spark production failures',     body: 'Shuffle, skew, broadcast join decisions. The failures you only see when debugging a 6-hour job in production.' },
  airflow:     { title: 'Airflow DAG failures',          body: 'Backfill decisions, late data handling, silent DAG failures. What actually breaks in production orchestration.' },
  dbt:         { title: 'dbt production failures',       body: 'Materialization tradeoffs, schema drift, incremental model failures. The decisions a senior data engineer owns.' },
  modeling:    { title: 'Data modeling scenarios',       body: 'Star schema vs OBT, SCDs, OLAP format decisions. The upstream choices that make or break downstream ML.' },
  dl:          { title: 'Deep learning training failures', body: 'Loss spikes, gradient issues, training instability. The production DL failures that don\'t appear in courses.' },
  dl_finetune: { title: 'Fine-tuning judgment scenarios', body: 'LoRA vs full fine-tune, freeze decisions, LR strategy. What actually moves the needle when adapting a model.' },
  dl_serving:  { title: 'DL serving failures',           body: 'Quantization tradeoffs, GPU memory management, serving latency. The production failures that happen after the model is trained.' },
  causal:      { title: 'Causal inference scenarios',    body: 'Identification, uplift modeling, observational vs experimental. The hardest judgment calls in production data science.' },
  ts:          { title: 'Time series failures',          body: 'Stationarity violations, anomaly detection, seasonality handling. The production failures in forecasting systems.' },
  monitor:     { title: 'Model monitoring — live computation', body: 'PSI, KS statistic, prediction drift — with a live Pyodide computation lab. The production triage skills most ML engineers lack.' },
  mlops_deploy:{ title: 'Deployment strategy scenarios', body: 'Champion-challenger, canary, rollback decisions. What a senior MLE owns when a model goes to production.' },
  mlops_pipes: { title: 'CI/CD & infra decisions',       body: 'Model registry gates, infrastructure decisions, pipeline failure modes. The MLOps judgment layer most engineers skip.' },
}

// ── Zone routing ──────────────────────────────────────────────────────────────
const TAB_TO_ZONE = {
  home: 'today', landscape: 'today', plans: 'today', profile: 'today',
  gradient: 'read',
  interview: 'interview',
  takehome: 'interview', combinator: 'interview',
  jdprep: 'interview', defense: 'interview', verbal: 'interview',
  spottheflaw: 'interview',
  incidentroom: 'interview',
  mlcoding: 'interview',
  ask: 'ask',
}
const ZONE_DEFAULTS = {
  today: 'home', practice: null, read: 'gradient', interview: null, ask: 'ask',
}
function getZoneForTab(id) { return TAB_TO_ZONE[id] ?? 'practice' }

// ── Bottom nav zones ──────────────────────────────────────────────────────────


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
    id: 'causal_ts', label: 'Causal & Time Series', accent: 'var(--prime)', bg: 'var(--prime-faint)',
    tabs: [
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
  { id: 'incidentroom', label: 'Incident Room', desc: '3 cross-domain production incidents. Each requires reasoning across Feature Eng, Monitoring, Serving, and Experimentation — multi-step diagnosis with branching findings.', step: null, accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { id: 'mlcoding', label: 'ML Coding', desc: '3 ML-specific Python problems that appear in real senior/staff interviews — custom loss, vectorised features, k-fold from scratch. Live execution via Pyodide.', step: null, accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
]



// ── New 5-section nav structure ──────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    id: 'features',
    label: 'FEATURES',
    items: [
      { id: 'features', label: 'Feature Engineering' },
    ],
  },
  {
    id: 'evaluation',
    label: 'EVALUATION',
    items: [
      { id: 'eval',      label: 'Model Evaluation' },
      { id: 'classical', label: 'Classical ML' },
      { id: 'causal',    label: 'Causal Inference' },
      { id: 'ts',        label: 'Time Series' },
    ],
  },
  {
    id: 'systems',
    label: 'SYSTEMS',
    items: [
      { id: 'design',       label: 'System Design' },
      { id: 'dl_serving',   label: 'DL Serving' },
      { id: 'mlops_deploy', label: 'Deployment' },
      { id: 'mlops_pipes',  label: 'CI/CD & Infra' },
      { id: 'monitor',      label: 'Monitoring' },
    ],
  },
  {
    id: 'training',
    label: 'TRAINING',
    items: [
      { id: 'models',      label: 'Math Foundations' },
      { id: 'dl',          label: 'Deep Learning' },
      { id: 'dl_finetune', label: 'Fine-tuning' },
    ],
  },
  {
    id: 'data',
    label: 'DATA',
    items: [
      { id: 'spark',    label: 'Spark Lab' },
      { id: 'airflow',  label: 'Airflow' },
      { id: 'dbt',      label: 'dbt' },
      { id: 'modeling', label: 'Data Modeling' },
    ],
  },
  {
    id: 'interview',
    label: 'INTERVIEW',
    items: [
      { id: 'interview',   label: 'Q&A Bank' },
      { id: 'combinator',  label: 'Timed Exam' },
      { id: 'verbal',      label: 'Verbal Practice' },
      { id: 'defense',     label: 'Defense Plan' },
      { id: 'takehome',    label: 'Take-Home' },
      { id: 'spottheflaw', label: 'Spot the Flaw' },
      { id: 'stafflayer',  label: 'Staff Layer' },
    ],
  },
  {
    id: 'labs',
    label: 'LABS',
    items: [
      { id: 'incidentroom',    label: 'Incident Room' },
      { id: 'mlcoding',        label: 'Code Problems' },
      { id: 'codebugs',        label: 'Bug Hunt' },
      { id: 'trainer',         label: 'Trainer' },
      { id: 'projectlab',      label: 'Project Lab · Telco' },
      { id: 'loan_default',    label: 'Project Lab · Loans' },
      { id: 'fraud_detection', label: 'Project Lab · Fraud' },
      { id: 'casestudies',     label: 'Case Studies' },
    ],
  },
  {
    id: 'learn',
    label: 'LEARN',
    items: [
      { id: 'gradient',  label: 'Deep Dives' },
      { id: 'landscape', label: 'Landscape' },
    ],
  },
]

function getTabSection(tabId) {
  for (const s of NAV_SECTIONS) {
    const items = s.groups ? s.groups.flatMap(g => g.items) : (s.items || [])
    if (items.some(i => i.id === tabId)) return s.id
  }
  return null
}

function getNavLabel(tabId) {
  for (const s of NAV_SECTIONS) {
    const items = s.groups ? s.groups.flatMap(g => g.items) : (s.items || [])
    const found = items.find(i => i.id === tabId)
    if (found) return found.label
  }
  return null
}

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

// ── DesktopSidebar ────────────────────────────────────────────────────────────
// Guiding principle: user always knows where they are and what to do next.
// Flat domain sections — one click to any tab. No lock icons. Progress inline.
function DesktopSidebar({ activeTabId, goTo, onSearch, tabProgress, isUnlocked }) {
  const activeSection = getTabSection(activeTabId)

  const [openSections, setOpenSections] = useState(() => {
    const s = getTabSection(activeTabId)
    return s ? { [s]: true } : {}
  })

  useEffect(() => {
    const s = getTabSection(activeTabId)
    if (s) setOpenSections(prev => ({ ...prev, [s]: true }))
  }, [activeTabId])

  function toggleSection(id) {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function getTabPct(tabId) {
    const p = tabProgress?.[tabId]
    if (!p || p.total === 0) return 0
    return Math.round((p.attempted / p.total) * 100)
  }

  function NavItem({ id, label, depth = 0 }) {
    const [hov, setHov] = useState(false)
    const isActive = activeTabId === id
    const pct = getTabPct(id)
    const isDimmed = PREMIUM_TABS.has(id) && !isUnlocked
    return (
      <button
        onClick={() => goTo(id)}
        className={isActive ? 'sidebar-item-active' : ''}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '100%', textAlign: 'left',
          padding: depth === 1 ? '4px 12px 4px 28px' : '4px 12px 4px 16px',
          background: isActive ? undefined : hov ? 'var(--prime-faint)' : 'none',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background var(--t-fast)',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: '12px',
          fontWeight: isActive ? 600 : 400,
          color: isActive ? undefined : hov ? 'var(--ink-mid)' : 'var(--ink-low)',
          transition: 'color var(--t-fast)', lineHeight: 1.4,
        }}>{label}</span>
        {pct > 0
          ? <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: isActive ? 'var(--prime)' : 'var(--ink-ghost)', flexShrink: 0, marginLeft: '4px' }}>{pct}%</span>
          : isDimmed
            ? <span style={{ fontSize: '8px', color: 'var(--ink-ghost)', opacity: 0.6, flexShrink: 0 }}>pro</span>
            : null
        }
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

      {/* Logo */}
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
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', fontWeight: 600, color: 'var(--ink-ghost)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>production ml judgment</span>
        </div>
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '6px 0 8px', overflowY: 'auto', scrollbarWidth: 'none' }}>

        <NavItem id="home" label="Home" />
        <NavItem id="plans" label="Plans & Access" />
        <NavItem id="profile" label="Profile" />
        <div style={{ height: '1px', background: 'var(--rim)', margin: '6px 0' }} />

        {NAV_SECTIONS.map(section => {
          const isOpen = !!openSections[section.id]
          const hasActive = activeSection === section.id
          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '7px 12px 5px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span style={{
                  fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.13em',
                  color: hasActive ? 'var(--prime)' : 'var(--ink-ghost)',
                  transition: 'color var(--t-fast)',
                }}>{section.label}</span>
                <span style={{
                  fontSize: '8px', color: hasActive ? 'var(--prime)' : 'var(--ink-ghost)',
                  display: 'inline-block',
                  transform: isOpen ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.18s ease, color var(--t-fast)',
                }}>▶</span>
              </button>

              {isOpen && (
                <div>
                  {section.groups ? (
                    section.groups.map(group => (
                      <div key={group.label}>
                        <div style={{
                          padding: '5px 12px 2px 16px',
                          fontSize: '9px', fontFamily: 'var(--font-mono)',
                          color: 'var(--ink-ghost)', opacity: 0.65,
                          letterSpacing: '0.07em', textTransform: 'uppercase',
                        }}>{group.label}</div>
                        {group.items.map(item => (
                          <NavItem key={item.id} id={item.id} label={item.label} depth={1} />
                        ))}
                      </div>
                    ))
                  ) : (
                    section.items.map(item => (
                      <NavItem key={item.id} id={item.id} label={item.label} />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Search */}
      <div style={{ padding: '8px 10px 10px', borderTop: '1px solid var(--rim)', flexShrink: 0 }}>
        <button
          onClick={onSearch}
          style={{
            width: '100%', padding: '7px 10px',
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)',
            borderRadius: '7px', cursor: 'pointer', color: 'var(--ink-low)',
            fontSize: '12px', fontFamily: 'var(--font-sans)',
            transition: 'border-color var(--t-fast), color var(--t-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rim-hi)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-low)' }}
        >
          <span style={{ fontSize: '13px' }}>⌕</span>
          <span>Search</span>
          <kbd style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '10px', background: 'var(--surface)', padding: '1px 5px', borderRadius: '4px', color: 'var(--ink-ghost)' }}>⌘K</kbd>
        </button>
      </div>

    </aside>
  )
}

// ── BottomNav ─────────────────────────────────────────────────────────────────

const BOTTOM_NAV_ITEMS = [
  { id: 'home',      icon: '◎', label: 'Home',      defaultTab: 'home',         sections: [] },
  { id: 'practice',  icon: '⊟', label: 'Practice',  defaultTab: 'features',     sections: ['features','evaluation','systems','training','data'] },
  { id: 'labs',      icon: '⚡', label: 'Labs',      defaultTab: 'incidentroom', sections: ['labs'] },
  { id: 'interview', icon: '◈', label: 'Interview',  defaultTab: 'interview',    sections: ['interview'] },
  { id: 'learn',     icon: '∇', label: 'Learn',      defaultTab: 'gradient',     sections: ['learn'] },
]

function BottomNav({ activeTabId, goTo }) {
  const activeSection = getTabSection(activeTabId)
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
        {BOTTOM_NAV_ITEMS.map(item => {
          const isActive = item.id === 'home' ? activeTabId === 'home' : item.sections.includes(activeSection)
          return (
            <button key={item.id} onClick={() => goTo(item.defaultTab)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: isActive ? 'var(--prime)' : 'var(--ink-low)',
                transition: 'color 0.15s', padding: '8px 2px 10px',
                position: 'relative', minWidth: 0, overflow: 'hidden',
                WebkitTapHighlightColor: 'transparent',
              }}>
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '18%', right: '18%',
                  height: '3px', background: 'var(--prime)',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: '0 0 16px var(--prime), 0 0 4px var(--prime)',
                }} />
              )}
              <div style={{
                width: '36px', height: '26px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px',
                background: isActive ? 'radial-gradient(ellipse at center, rgba(240,165,0,0.22) 0%, rgba(240,165,0,0.07) 60%, transparent 100%)' : 'transparent',
                boxShadow: isActive ? '0 0 18px rgba(240,165,0,0.3)' : 'none',
                transition: 'all 0.20s ease', flexShrink: 0,
              }}>
                <span style={{ fontSize: '18px', lineHeight: 1, filter: isActive ? 'drop-shadow(0 0 6px var(--prime))' : 'none', transition: 'filter 0.20s' }}>{item.icon}</span>
              </div>
              <span style={{
                fontSize: '10px', fontFamily: 'var(--font-sans)',
                fontWeight: isActive ? 700 : 500, lineHeight: 1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
              }}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState(() =>
    getTabFromHash() || localStorage.getItem('msl_tab') || 'home'
  )
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [tabProgress, setTabProgress] = useState(() => readTabProgress())
  const [isUnlocked,  setIsUnlocked]  = useState(() => checkUnlocked())
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('msl_theme') || 'dark' } catch { return 'dark' }
  })
  // ── Auth state ───────────────────────────────────────────────────────────────
  const [user,     setUser]     = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')
        && session?.user
      ) {
        setUser(session.user)
        setShowAuth(false)
        if (event === 'SIGNED_IN') {
          // Pull remote progress on fresh sign-in (may overwrite local — intentional)
          await pullProgressFromSupabase(session.user)
          setIsUnlocked(checkUnlocked()) // re-check after pull
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setActiveTab('home')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Reactive: if auth is enabled and user is null, show signed-out home
  const [guestMode, setGuestMode] = useState(false)
  const showSignedOut = authEnabled && !user && !guestMode

  function handleUnlock(code) {
    if (code?.trim().toUpperCase() === ACCESS_CODE) {
      try { localStorage.setItem(STORAGE_KEY, ACCESS_CODE) } catch {}
      setIsUnlocked(true)
    }
  }

  // Listen for msl-unlock fired by AccessGate (including scenario-level gates in free tabs)
  useEffect(() => {
    function onUnlockEvent() { setIsUnlocked(true) }
    window.addEventListener('msl-unlock', onUnlockEvent)
    return () => window.removeEventListener('msl-unlock', onUnlockEvent)
  }, [])

  // Navigate to any tabId from anywhere
  const goTo = useCallback((tabId) => {
    setActiveTab(tabId)
    setSearchOpen(false)
    trackTabSwitch(tabId)
    window.scrollTo(0, 0)
  }, [])

  // Hash + localStorage sync
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('msl_tab', activeTab)
      setHash(activeTab)
    }
  }, [activeTab])

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

  // Topbar context
  const currentTabId   = activeTab
  const showBackBtn    = activeTab !== 'home'
  const activeTabLabel = showBackBtn ? getNavLabel(activeTab) : null

  function renderContent() {
    if (activeTab === 'defense') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <DefenseDocTab onNavigate={goTo} isUnlocked={isUnlocked} onUnlock={handleUnlock} />
        </Suspense>
      )
    }
    if (PREMIUM_TABS.has(activeTab) && !isUnlocked) {
      const copy = GATE_COPY[activeTab] || {}
      return (
        <AccessGate
          onUnlock={handleUnlock}
          title={copy.title}
          body={copy.body}
          ctaLabel={copy.ctaLabel}
        />
      )
    }
    // Profile page needs user + onShowAuth props
    if (activeTab === 'profile') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <ProfilePage user={user} onNavigate={goTo} onShowAuth={() => setShowAuth(true)} />
        </Suspense>
      )
    }
    // Plans page needs onShowAuth
    if (activeTab === 'plans') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <PlansTab onNavigate={goTo} onShowAuth={() => setShowAuth(true)} user={user} />
        </Suspense>
      )
    }
    const Component = ALL_TABS.find(t => t.id === activeTab)?.component
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

  // ── Signed-out full-screen landing (only when auth is configured + no session)
  if (showSignedOut) {
    return (
      <>
        <Suspense fallback={<LoadingSpinner />}>
          <SignedOutHome onShowAuth={() => setShowAuth(true)} onNavigate={goTo} onExplore={() => { setGuestMode(true); goTo('classical') }} />
        </Suspense>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--void)' }}>

      {/* ── Desktop sidebar (hidden on mobile via CSS) ── */}
      <DesktopSidebar activeTabId={activeTab} goTo={goTo} onSearch={() => setSearchOpen(true)} tabProgress={tabProgress} isUnlocked={isUnlocked} />

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
                onClick={() => goTo('home')}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '13px', fontFamily: "var(--font-sans)", padding: '10px 8px', margin: '-10px -8px' }}>
                ← <span>Back</span>
              </button>
              {activeTabLabel && (
                <>
                  <span style={{ color: 'var(--rim)', fontSize: '13px' }}>/</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--prime)', fontFamily: "var(--font-sans)", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeTabLabel}
                  </span>
                </>
              )}
            </>
          ) : (
            <button onClick={() => goTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '6px', color: 'var(--ink-low)', fontSize: '11px', fontFamily: "var(--font-mono)", textDecoration: 'none', transition: 'border-color 0.15s', letterSpacing: '0.02em' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.57v-2.02c-3.34.72-4.04-1.61-4.04-1.61-.54-1.38-1.33-1.74-1.33-1.74-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.48 1 .1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.68.83.57C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          )}
          <button
            onClick={() => setSearchOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', borderRadius: '7px', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '12px', fontFamily: "var(--font-sans)" }}>
            <span style={{ fontSize: '13px' }}>⌕</span>
            <span style={{ display: 'inline' }}>Search</span>
            <kbd style={{ fontFamily: "var(--font-mono)", fontSize: '10px', background: 'var(--surface)', padding: '1px 5px', borderRadius: '4px', color: 'var(--ink-ghost)' }} className="hide-mobile">⌘K</kbd>
          </button>
          {authEnabled && (
            user ? (
              <button onClick={() => goTo('profile')} title="Profile"
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--rim-hi)', background: user.user_metadata?.avatar_url ? 'none' : 'var(--prime)', overflow: 'hidden', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '9px', color: 'var(--depth)' }}>{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</span>
                }
              </button>
            ) : (
              <button onClick={() => setShowAuth(true)}
                style={{ padding: '5px 12px', background: 'var(--prime)', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '11px', color: 'var(--depth)', letterSpacing: '0.03em' }}>
                Sign in
              </button>
            )
          )}
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
      <BottomNav activeTabId={activeTab} goTo={goTo} />

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

      {/* ── Auth modal — MUST be last in return, never inside a transformed panel ── */}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />

    </div>
  )
}
