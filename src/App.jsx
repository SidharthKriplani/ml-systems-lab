import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { trackTabSwitch } from './analytics.js'
import ContentMap   from './components/ContentMap.jsx'
import AccessGate   from './components/AccessGate.jsx'
import { Icon }    from './components/Icon.jsx'
import { BrandMark } from './components/BrandMark.jsx'
import FeedbackChip from './components/FeedbackChip.jsx'
import LoadingSpinner from './components/LoadingSpinner.jsx'
import AuthModal    from './components/auth/AuthModal.jsx'
import { ACCESS_CODE, STORAGE_KEY, isUnlocked as checkUnlocked } from './utils/unlock.js'
import { authEnabled, onAuthStateChange } from './utils/supabase.js'
import { pullProgressFromSupabase } from './utils/syncProgress.js'
import { upsertLeaderboardRow } from './utils/leaderboard.js'
import StudyRoom from './study/StudyRoom.jsx'
import { BUILD_PROJECTS } from './tabs/BuildHubTab.jsx'


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
const DrillTab       = lazy(() => import('./tabs/DrillTab.jsx'))
const InterviewQuestionsTab = lazy(() => import('./tabs/InterviewQuestionsTab.jsx'))
const CompanyTracksTab = lazy(() => import('./tabs/CompanyTracksTab.jsx'))
const ReviewTab = lazy(() => import('./tabs/ReviewTab.jsx'))
const AboutTab = lazy(() => import('./tabs/AboutTab.jsx'))
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
const BehavioralBankTab = lazy(() => import('./tabs/BehavioralBankTab.jsx'))
const RankingProjectTab = lazy(() => import('./tabs/RankingProjectTab.jsx'))
const ForecastProjectTab = lazy(() => import('./tabs/ForecastProjectTab.jsx'))
const NLPContentProjectTab = lazy(() => import('./tabs/NLPContentProjectTab.jsx'))
const StartHereTab      = lazy(() => import('./tabs/StartHereTab.jsx'))
const BuildHubTab       = lazy(() => import('./tabs/BuildHubTab.jsx'))
const DrillBrowser      = lazy(() => import('./components/judge/DrillBrowser.jsx'))
const PlansTab          = lazy(() => import('./tabs/PlansTab.jsx'))
const ProfilePage       = lazy(() => import('./tabs/ProfilePage.jsx'))
const ResourcesTab      = lazy(() => import('./tabs/ResourcesTab.jsx'))
const CheatsheetTab     = lazy(() => import('./tabs/CheatsheetTab.jsx'))
const AskTab            = lazy(() => import('./tabs/AskTab.jsx'))
const MockInterviewTab  = lazy(() => import('./tabs/MockInterviewTab.jsx'))
const SignedOutHome     = lazy(() => import('./tabs/SignedOutHome.jsx'))
// Leaderboard + Progress (named exports → wrap for lazy)
const LeaderboardTab    = lazy(() => import('./tabs/LeaderboardTab.jsx').then(m => ({ default: m.LeaderboardTab })))
const ProgressTab       = lazy(() => import('./tabs/ProgressTab.jsx').then(m => ({ default: m.ProgressTab })))
// Foundation runners (all named exports)
const MathStatsFoundationTab      = lazy(() => import('./tabs/foundations/MathStatsFoundationTab.jsx').then(m => ({ default: m.MathStatsFoundationTab })))
const ClassicalMLFoundationTab    = lazy(() => import('./tabs/foundations/ClassicalMLFoundationTab.jsx').then(m => ({ default: m.ClassicalMLFoundationTab })))
const EvalFoundationTab           = lazy(() => import('./tabs/foundations/EvalFoundationTab.jsx').then(m => ({ default: m.EvalFoundationTab })))
const UnsupervisedFoundationTab   = lazy(() => import('./tabs/foundations/UnsupervisedFoundationTab.jsx').then(m => ({ default: m.UnsupervisedFoundationTab })))
const CausalFoundationTab         = lazy(() => import('./tabs/foundations/CausalFoundationTab.jsx').then(m => ({ default: m.CausalFoundationTab })))
const ProductionFoundationTab     = lazy(() => import('./tabs/foundations/ProductionFoundationTab.jsx').then(m => ({ default: m.ProductionFoundationTab })))
const MonitoringFoundationTab     = lazy(() => import('./tabs/foundations/MonitoringFoundationTab.jsx').then(m => ({ default: m.MonitoringFoundationTab })))
const SystemDesignFoundationTab   = lazy(() => import('./tabs/foundations/SystemDesignFoundationTab.jsx').then(m => ({ default: m.SystemDesignFoundationTab })))
const RecSysFoundationTab         = lazy(() => import('./tabs/foundations/RecSysFoundationTab.jsx').then(m => ({ default: m.RecSysFoundationTab })))
const PricingFoundationTab        = lazy(() => import('./tabs/foundations/PricingFoundationTab.jsx').then(m => ({ default: m.PricingFoundationTab })))
const DeepLearningFoundationTab   = lazy(() => import('./tabs/foundations/DeepLearningFoundationTab.jsx').then(m => ({ default: m.DeepLearningFoundationTab })))
// New foundation runners — 6 additional domains
const RLFoundationTab             = lazy(() => import('./tabs/foundations/RLFoundationTab.jsx').then(m => ({ default: m.RLFoundationTab })))
const TimeSeriesFoundationTab     = lazy(() => import('./tabs/foundations/TimeSeriesFoundationTab.jsx').then(m => ({ default: m.TimeSeriesFoundationTab })))
const SelfSupervisedFoundationTab = lazy(() => import('./tabs/foundations/SelfSupervisedFoundationTab.jsx').then(m => ({ default: m.SelfSupervisedFoundationTab })))
const GraphMLFoundationTab        = lazy(() => import('./tabs/foundations/GraphMLFoundationTab.jsx').then(m => ({ default: m.GraphMLFoundationTab })))
const BanditsFoundationTab        = lazy(() => import('./tabs/foundations/BanditsFoundationTab.jsx').then(m => ({ default: m.BanditsFoundationTab })))
const ProbabilisticMLFoundationTab = lazy(() => import('./tabs/foundations/ProbabilisticMLFoundationTab.jsx').then(m => ({ default: m.ProbabilisticMLFoundationTab })))
const OptimizationFoundationTab    = lazy(() => import('./tabs/foundations/OptimizationFoundationTab.jsx').then(m => ({ default: m.OptimizationFoundationTab })))
const DataFoundationTab            = lazy(() => import('./tabs/foundations/DataFoundationTab.jsx').then(m => ({ default: m.DataFoundationTab })))
const MyTracksTab                  = lazy(() => import('./tabs/MyTracksTab.jsx').then(m => ({ default: m.MyTracksTab })))

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
  { id: 'behavioral',   component: BehavioralBankTab },
  { id: 'gradient',     component: GradientTab },
  { id: 'landscape',    component: LandscapeTab },
  // New feature tabs
  { id: 'takehome',    component: TakeHomeTab },
  { id: 'trainer',     component: TrainerTab },
  { id: 'combinator',  component: CombinatorTab },
  { id: 'drill',       component: DrillTab },
  { id: 'interview_questions', component: InterviewQuestionsTab },
  { id: 'company_tracks', component: CompanyTracksTab },
  { id: 'review', component: ReviewTab },
  { id: 'about', component: AboutTab },
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
  { id: 'ranking_project', component: RankingProjectTab },
  { id: 'forecast_project', component: ForecastProjectTab },
  { id: 'nlp_content_project', component: NLPContentProjectTab },
  { id: 'build',     component: BuildHubTab },
  { id: 'plans',     component: PlansTab },
  { id: 'profile',   component: ProfilePage },
  { id: 'resources',   component: ResourcesTab },
  { id: 'cheatsheet', component: CheatsheetTab },
  { id: 'ask',        component: AskTab },
  { id: 'mock_interview', component: MockInterviewTab },
  // Leaderboard + Progress
  { id: 'leaderboard',             component: LeaderboardTab },
  { id: 'progress',                component: ProgressTab },
  // Foundation runners — original 9
  { id: 'math_stats_foundation',    component: MathStatsFoundationTab },
  { id: 'classical_ml_foundation',  component: ClassicalMLFoundationTab },
  { id: 'eval_foundation',          component: EvalFoundationTab },
  { id: 'unsupervised_foundation',  component: UnsupervisedFoundationTab },
  { id: 'causal_foundation',        component: CausalFoundationTab },
  { id: 'production_foundation',    component: ProductionFoundationTab },
  { id: 'monitoring_foundation',    component: MonitoringFoundationTab },
  { id: 'system_design_foundation', component: SystemDesignFoundationTab },
  { id: 'recsys_foundation',        component: RecSysFoundationTab },
  { id: 'pricing_foundation',       component: PricingFoundationTab },
  { id: 'dl_foundation',            component: DeepLearningFoundationTab },
  // Foundation runners — 6 new domains
  { id: 'rl_foundation',             component: RLFoundationTab },
  { id: 'time_series_foundation',    component: TimeSeriesFoundationTab },
  { id: 'self_supervised_foundation',component: SelfSupervisedFoundationTab },
  { id: 'graph_ml_foundation',       component: GraphMLFoundationTab },
  { id: 'bandits_foundation',        component: BanditsFoundationTab },
  { id: 'probabilistic_ml_foundation', component: ProbabilisticMLFoundationTab },
  { id: 'optimization_foundation',     component: OptimizationFoundationTab },
  { id: 'data_foundation',             component: DataFoundationTab },
  { id: 'my_tracks',                   component: MyTracksTab },
  { id: 'start_here',                  component: StartHereTab },
  { id: 'judge_browser',               component: DrillBrowser },
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
  'projectlab', 'loan_default', 'fraud_detection', 'ranking_project', 'forecast_project', 'nlp_content_project',
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
  home: 'today', landscape: 'today', plans: 'today', profile: 'today', resources: 'today',
  leaderboard: 'today', progress: 'today',
  gradient: 'read', cheatsheet: 'read',
  mock_interview: 'interview',
  interview: 'interview',
  takehome: 'interview', combinator: 'interview',
  defense: 'interview', verbal: 'interview',
  spottheflaw: 'interview',
  incidentroom: 'interview',
  mlcoding: 'interview',
  ask: 'ask',
  // Foundation runners — all map to 'know' zone (FOUNDATIONS live under KNOW)
  math_stats_foundation: 'know', classical_ml_foundation: 'know',
  eval_foundation: 'know', unsupervised_foundation: 'know',
  causal_foundation: 'know', production_foundation: 'know',
  monitoring_foundation: 'know', system_design_foundation: 'know',
  recsys_foundation: 'know',
  pricing_foundation: 'know',
  dl_foundation: 'know',
  rl_foundation: 'know', time_series_foundation: 'know',
  self_supervised_foundation: 'know', graph_ml_foundation: 'know',
  bandits_foundation: 'know', probabilistic_ml_foundation: 'know',
  optimization_foundation: 'know', data_foundation: 'know',
  // Library also lives under KNOW
  gradient: 'know', cheatsheet: 'know',
  // BUILD landing (projects grid) — its own frame, routed directly from the sidebar
  build: 'build',
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
  { id: 'incidentroom', label: 'Cross-Domain Challenges', desc: '3 cross-domain production incidents. Each requires reasoning across Feature Eng, Monitoring, Serving, and Experimentation — multi-step diagnosis with branching findings.', step: null, accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { id: 'mlcoding', label: 'ML Coding', desc: '3 ML-specific Python problems that appear in real senior/staff interviews — custom loss, vectorised features, k-fold from scratch. Live execution via Pyodide.', step: null, accent: 'var(--prime)',
    svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
]



// ── Nav structure ─────────────────────────────────────────────────────────────
// KNOW (foundations + library) → DO → BUILD → JUDGE → PREP & ASSESS → EXTRAS
const NAV_SECTIONS = [
  {
    id: 'know',
    label: 'KNOW',
    icon: 'layers',
    groups: [
      {
        label: 'ML THEORY',
        items: [
          { id: 'math_stats_foundation',      label: 'Math & Stats',        desc: 'Probability, linear algebra, calculus, MLE/MAP — the mathematical core of ML.' },
          { id: 'classical_ml_foundation',    label: 'Classical ML',        desc: 'Linear models, trees, SVMs, regularization, generalization theory.' },
          { id: 'probabilistic_ml_foundation',label: 'Probabilistic ML',    desc: 'Gaussian processes, variational inference, BNNs, calibration, information geometry.' },
          { id: 'eval_foundation',            label: 'Evaluation',          desc: 'Metrics from first principles, validation traps, offline vs online.' },
          { id: 'unsupervised_foundation',    label: 'Unsupervised',        desc: 'Clustering, dimensionality reduction, anomaly detection.' },
          { id: 'causal_foundation',          label: 'Causal Inference',    desc: 'Potential outcomes, DAGs, uplift modeling, experiment design.' },
          { id: 'optimization_foundation',    label: 'Optimization',        desc: 'Gradient descent, SGD, momentum, Adam, LR schedules, loss landscapes, gradient flow.' },
          { id: 'data_foundation',            label: 'Data & Features',     desc: 'Data quality, feature engineering, encoding, scaling, imbalance, distribution shift, leakage.' },
        ],
      },
      {
        label: 'NEURAL & SEQUENTIAL',
        items: [
          { id: 'dl_foundation',              label: 'Deep Learning',       desc: 'Neural nets, backprop, attention, transformers, fine-tuning, serving.' },
          { id: 'self_supervised_foundation', label: 'Self-supervised',     desc: 'Contrastive learning, SimCLR, MoCo, BYOL, MAE, CLIP, downstream adaptation.' },
          { id: 'rl_foundation',              label: 'Reinforcement Learning', desc: 'MDPs, Bellman equations, policy gradients, PPO, RLHF, reward modeling.' },
        ],
      },
      {
        label: 'SYSTEMS & APPLIED',
        items: [
          { id: 'production_foundation',      label: 'Feature Eng & Prod',  desc: 'Training-serving skew, feature stores, pipeline architecture.' },
          { id: 'monitoring_foundation',      label: 'Monitoring & Drift',  desc: 'Data drift, concept drift, prediction monitoring, ML incidents.' },
          { id: 'system_design_foundation',   label: 'ML System Design',    desc: '6-step framework, RecSys, two-tower models, ML platform design.' },
          { id: 'recsys_foundation',          label: 'Recommender Systems', desc: 'Two-stage funnel, two-tower retrieval, learning-to-rank, cold start, feedback-loop bias, offline vs online eval.' },
          { id: 'pricing_foundation',         label: 'Pricing Analytics', desc: 'Price elasticity, dynamic/surge pricing, price optimization, causal price experiments, promo uplift, willingness-to-pay. (In development.)' },
          { id: 'time_series_foundation',     label: 'Time Series',         desc: 'Stationarity, ARIMA, STL, neural forecasting (N-BEATS, TFT), causal impact.' },
          { id: 'graph_ml_foundation',        label: 'Graph ML',            desc: 'GCNs, GraphSAGE, GAT, message passing, link prediction, GNNs at scale.' },
          { id: 'bandits_foundation',         label: 'Bandits & Exploration', desc: 'UCB, Thompson sampling, contextual bandits, LinUCB, OPE, recsys exploration.' },
        ],
      },
      {
        label: 'LIBRARY',
        items: [
          { id: 'gradient',   label: 'Gradient',   desc: 'Long-form essays — the MLE Path + Foundations Path, with production tells.' },
          { id: 'cheatsheet', label: 'Cheatsheet', desc: '4-tier last-minute prep — flashcards, formulas, trade-offs, 7-day plan.' },
        ],
      },
    ],
  },
  {
    id: 'do',
    label: 'DO',
    icon: 'terminal',
    groups: [
      {
        label: 'CODE',
        items: [
          { id: 'mlcoding', label: 'ML Coding',            desc: 'ML-specific Python problems — implement/debug/optimise/design, live Pyodide.' },
          { id: 'codebugs', label: 'Bug Hunt',             desc: 'Read code, find the buried bug — ML/DL/pipeline debugging.' },
          { id: 'ext_python', label: 'Python fluency → PL ↗', external: true, href: 'https://programming-lab.vercel.app/#/pylab', desc: 'General Python & DSA fluency lives in Programming Lab (sibling lab).' },
          { id: 'ext_sql',    label: 'SQL fluency → PAL ↗', external: true, href: 'https://product-analytics-lab.vercel.app/#/sql-lab', desc: 'The canonical SQL problem bank lives in Product Analytics Lab (sibling lab).' },
        ],
      },
      {
        label: 'DATA ENG · adjacent',
        items: [
          { id: 'spark',    label: 'Spark Lab',            desc: 'PySpark optimization — shuffle, skew, broadcast joins, AQE.' },
          { id: 'dbt',      label: 'dbt / SQL transforms', desc: 'Analytics-engineering SQL transformation patterns.' },
          { id: 'airflow',  label: 'Airflow',              desc: 'DAG failures, backfill, late data.' },
          { id: 'modeling', label: 'Data Modeling',        desc: 'Star/OBT, SCDs, OLAP formats.' },
        ],
      },
    ],
  },
  {
    id: 'build',
    label: 'BUILD',
    icon: 'hammer',
    // landing: clicking the BUILD frame header navigates to this tab (the projects
    // grid on the right) instead of toggling the accordion open. `items` are still
    // the source-of-truth list (mirrored from BuildHubTab.BUILD_PROJECTS) so
    // getTabSection / getNavLabel keep resolving each project to the BUILD frame,
    // but they are NOT rendered as a sidebar accordion (see DesktopSidebar).
    landing: 'build',
    items: BUILD_PROJECTS,
  },
  {
    id: 'judge',
    label: 'JUDGE',
    icon: 'scale',
    groups: [
      {
        // flattenWhenSingle: while there is only ONE drill type, the renderer
        // shows the single child directly as a leaf (no redundant "Drills"
        // wrapper). Add a second item here and the "DRILLS" group re-nests
        // automatically — no other change required.
        label: 'DRILLS',
        flattenWhenSingle: true,
        items: [
          { id: 'judge_browser', label: 'Judgment Drills', desc: '440 drills across 10 subjects incl. multi-step case-chains — filter by subject and level, junior → staff.' },
        ],
      },
      {
        label: 'INCIDENTS',
        flattenWhenSingle: true,
        items: [
          { id: 'incidentroom', label: 'Cross-Domain Challenges',  desc: 'Cross-domain, multi-step incident diagnosis.' },
        ],
      },
    ],
  },
  {
    id: 'assess',
    label: 'PREP & ASSESS',
    icon: 'clipboard',
    items: [
      { id: 'interview_questions', label: 'Interview Questions', desc: 'One open-ended bank — Q&A, Behavioral/STAR, system-design take-homes, and the defend-your-project round.' },
      { id: 'drill',               label: 'Drill',               desc: 'Self-test the MCQ bank — untimed spaced-rep practice or a timed mock exam.' },
      { id: 'company_tracks',      label: 'Company Tracks',      desc: 'Curated prep by company × role × seniority — items open the exact module or drill. (Scaffold.)' },
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
// ── Sidebar helpers (module scope — must persist across renders so the
//    grid-row height transition animates instead of remounting/snapping) ──
function SidebarCollapsible({ open, children }) {
  const ref = useRef(null)
  const [height, setHeight] = useState(open ? 'auto' : '0px')
  const mounted = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!mounted.current) { mounted.current = true; return }  // don't animate on first mount

    let raf1, raf2
    function onEnd(e) {
      if (e.target !== el || e.propertyName !== 'height') return
      if (open) setHeight('auto')           // let nested content grow freely once open
      el.removeEventListener('transitionend', onEnd)
    }

    if (open) {
      setHeight(el.scrollHeight + 'px')     // 0 -> measured height
      el.addEventListener('transitionend', onEnd)
    } else {
      setHeight(el.scrollHeight + 'px')     // auto -> fixed px first...
      raf1 = requestAnimationFrame(() => {  // ...then next frame collapse to 0 (so it transitions)
        raf2 = requestAnimationFrame(() => setHeight('0px'))
      })
    }
    return () => {
      el.removeEventListener('transitionend', onEnd)
      if (raf1) cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [open])

  return (
    <div ref={ref} style={{
      height,
      overflow: 'hidden',
      transition: 'height 0.30s cubic-bezier(0.33,1,0.68,1)',
      willChange: 'height',
    }}>
      {children}
    </div>
  )
}

function SidebarChevron({ open, active }) {
  return (
    <span aria-hidden="true" style={{
      fontSize: '9px', flexShrink: 0, display: 'inline-block',
      color: active ? 'var(--prime)' : 'var(--ink-ghost)',
      transition: 'transform 0.24s cubic-bezier(0.4,0,0.2,1), color var(--t-fast)',
      transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
    }}>&#9662;</span>
  )
}

function SidebarNavItem({ id, label, desc, href, external, indent = false, activeTabId, goTo, tabProgress, isUnlocked }) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" title={desc || ''}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '7px',
          width: '100%', boxSizing: 'border-box', textAlign: 'left',
          padding: indent ? '5px 11px 5px 18px' : '6px 11px',
          borderRadius: 'var(--r-sm)', textDecoration: 'none', cursor: 'pointer',
          color: 'var(--ink-low)', fontFamily: 'var(--font-sans)',
          fontSize: indent ? '12.5px' : '13px', lineHeight: 1.5, letterSpacing: '-0.005em',
          transition: 'background var(--t-fast), color var(--t-fast)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-low)' }}>
        <span>{label}</span>
        <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', flexShrink: 0 }}>&#8599;</span>
      </a>
    )
  }
  const isActive = activeTabId === id
  const pr = tabProgress?.[id]
  const pct = (!pr || pr.total === 0) ? 0 : Math.round((pr.attempted / pr.total) * 100)
  const isDimmed = PREMIUM_TABS.has(id) && !isUnlocked
  return (
    <button
      onClick={() => goTo(id)}
      title={desc || ''}
      aria-current={isActive ? 'page' : undefined}
      className={isActive ? 'sidebar-item-active' : ''}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '7px',
        width: '100%', textAlign: 'left',
        padding: indent ? '5px 11px 5px 18px' : '6px 11px',
        borderRadius: 'var(--r-sm)', border: 'none',
        background: isActive ? undefined : 'transparent',
        color: isActive ? undefined : 'var(--ink-low)',
        fontFamily: 'var(--font-sans)',
        fontWeight: isActive ? 600 : 400,
        fontSize: indent ? '12.5px' : '13px', lineHeight: 1.5, letterSpacing: '-0.005em',
        cursor: 'pointer',
        transition: 'background var(--t-fast), color var(--t-fast)',
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink-mid)' } }}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-low)' } }}
    >
      <span>{label}</span>
      {pct > 0
        ? <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: isActive ? 'var(--prime)' : 'var(--ink-ghost)', flexShrink: 0 }}>{pct}%</span>
        : isDimmed
          ? <span style={{ fontSize: '8px', color: 'var(--ink-ghost)', opacity: 0.6, flexShrink: 0 }}>pro</span>
          : null}
    </button>
  )
}

function DesktopSidebar({ activeTabId, goTo, onSearch, tabProgress, isUnlocked, open = false, onClose }) {
  const activeSection = getTabSection(activeTabId)
  // On mobile this sidebar is a drawer — navigating anywhere should close it.
  const goToClose = (tabId) => { goTo(tabId); if (onClose) onClose() }
  const JUDGE = NAV_SECTIONS.find(s => s.groups)
  const subKey = (sid, label) => sid + ':' + label
  function activeSubKeyFor() {
    for (const sec of NAV_SECTIONS) {
      if (!sec.groups) continue
      const g = sec.groups.find(gr => gr.items.some(it => it.id === activeTabId))
      if (g) return subKey(sec.id, g.label)
    }
    return JUDGE ? subKey(JUDGE.id, JUDGE.groups[0].label) : null
  }
  const [openFrame, setOpenFrame] = useState(() => activeSection || (NAV_SECTIONS[0] && NAV_SECTIONS[0].id))
  const [openSub, setOpenSub]     = useState(() => activeSubKeyFor())

  useEffect(() => {
    const sec = getTabSection(activeTabId)
    if (sec) setOpenFrame(sec)
    for (const s of NAV_SECTIONS) {
      if (!s.groups) continue
      const g = s.groups.find(gr => gr.items.some(it => it.id === activeTabId))
      if (g) setOpenSub(subKey(s.id, g.label))
    }
  }, [activeTabId])

  function toggleFrame(id) { setOpenFrame(cur => (cur === id ? null : id)) }
  function toggleSub(key)  { setOpenSub(cur => (cur === key ? null : key)) }

  const navProps = { activeTabId, goTo: goToClose, tabProgress, isUnlocked }

  return (
    <aside className={`desktop-sidebar${open ? ' open' : ''}`} style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: '220px',
      background: 'var(--depth)',
      backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
      borderRight: '2px solid var(--rim-hi)',
      flexDirection: 'column', overflowY: 'auto',
      zIndex: 60, scrollbarWidth: 'none',
    }}>

      {/* Logo (PAL proportions) */}
      <div style={{ padding: '15px 13px 9px', flexShrink: 0 }}>
        <button
          onClick={() => goToClose('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: '9px',
            background: 'none', border: 'none', cursor: 'pointer', width: '100%',
            padding: '4px 3px', borderRadius: 'var(--r-sm)',
            transition: 'opacity var(--t)',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.78' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <BrandMark variant='full' stacked descriptor='ML Systems' accent='#F0A500' size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '2px 8px 10px', overflowY: 'auto', scrollbarWidth: 'none' }}>

        {/* TRACK (top, always visible) */}
        <SidebarNavItem id="home" label="Home" {...navProps} />
        <SidebarNavItem id="profile" label="Profile" {...navProps} />
        <SidebarNavItem id="progress" label="My Progress" {...navProps} />
        <SidebarNavItem id="review" label="Review" {...navProps} />
        <SidebarNavItem id="my_tracks" label="My Tracks" {...navProps} />
        <SidebarNavItem id="leaderboard" label="Leaderboard" {...navProps} />
        <SidebarNavItem id="start_here" label="Start Here" {...navProps} />
        <SidebarNavItem id="plans" label="Plans & Access" {...navProps} />
        <SidebarNavItem id="resources" label="Resources" {...navProps} />
        <SidebarNavItem id="about" label="About" {...navProps} />

        {NAV_SECTIONS.map(section => {
          // Landing frames (BUILD): the header navigates to a right-pane landing
          // tab instead of toggling the accordion. Its items stay routable (they're
          // still in NAV_SECTIONS for getTabSection/getNavLabel) but are never
          // rendered as a sidebar list — the collapsible is forced closed.
          const isLanding = !!section.landing
          const frameOpen = isLanding ? false : openFrame === section.id
          const frameActive = activeSection === section.id || (isLanding && activeTabId === section.landing)
          return (
            <div key={section.id} style={{ marginTop: '3px' }}>
              <button
                onClick={() => { if (isLanding) { goToClose(section.landing) } else { toggleFrame(section.id) } }}
                aria-expanded={isLanding ? undefined : frameOpen}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left', padding: '9px 10px 5px',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {section.icon && <Icon name={section.icon} size={13} color={frameActive ? 'var(--prime)' : 'var(--ink-low)'} style={{ flexShrink: 0, opacity: frameActive ? 1 : 0.62 }} />}
                  <span style={{
                    fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
                    color: frameActive ? 'var(--prime)' : 'var(--ink-low)', opacity: frameActive ? 1 : 0.6,
                    transition: 'color var(--t-fast)',
                  }}>{section.label}</span>
                </span>
                {isLanding
                  ? <span aria-hidden="true" style={{ fontSize: '11px', flexShrink: 0, color: frameActive ? 'var(--prime)' : 'var(--ink-ghost)' }}>&#8594;</span>
                  : <SidebarChevron open={frameOpen} active={frameActive} />}
              </button>

              {!isLanding && (
              <SidebarCollapsible open={frameOpen}>
                {section.groups ? (
                  section.groups.map(group => {
                    // Flatten a single-child drills-group to a bare leaf — no
                    // pointless "Drills" wrapper when there is exactly one item.
                    // Re-nests automatically once a second item is added.
                    if (group.flattenWhenSingle && group.items.length === 1) {
                      const only = group.items[0]
                      return (
                        <SidebarNavItem key={only.id} id={only.id} label={only.label} desc={only.desc} href={only.href} external={only.external} {...navProps} />
                      )
                    }
                    const key = subKey(section.id, group.label)
                    const subOpen = openSub === key
                    const subActive = group.items.some(it => it.id === activeTabId)
                    return (
                      <div key={group.label}>
                        <button
                          onClick={() => toggleSub(key)}
                          aria-expanded={subOpen}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', textAlign: 'left', padding: '5px 11px',
                            borderRadius: 'var(--r-sm)', border: 'none', background: 'none', cursor: 'pointer',
                            color: subActive ? 'var(--ink-mid)' : 'var(--ink-low)',
                            fontFamily: 'var(--font-sans)', fontWeight: subActive ? 600 : 500,
                            fontSize: '12px', letterSpacing: '0.02em', opacity: subActive ? 1 : 0.72,
                            transition: 'color var(--t-fast)',
                          }}
                        >
                          <span>{group.label}</span>
                          <SidebarChevron open={subOpen} active={subActive} />
                        </button>
                        <SidebarCollapsible open={subOpen}>
                          <div style={{ borderLeft: '1px solid var(--rim)', margin: '1px 0 3px 15px', paddingLeft: '2px' }}>
                            {group.items.map(item => (
                              <SidebarNavItem key={item.id} id={item.id} label={item.label} desc={item.desc} href={item.href} external={item.external} indent {...navProps} />
                            ))}
                          </div>
                        </SidebarCollapsible>
                      </div>
                    )
                  })
                ) : (
                  section.items.map(item => (
                    <SidebarNavItem key={item.id} id={item.id} label={item.label} desc={item.desc} href={item.href} external={item.external} {...navProps} />
                  ))
                )}
              </SidebarCollapsible>
              )}
            </div>
          )
        })}
      </nav>

      {/* Search */}
      <div style={{ padding: '9px 10px', borderTop: '1px solid var(--rim)', flexShrink: 0 }}>
        <button
          onClick={onSearch}
          style={{
            width: '100%', padding: '7px 11px',
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'var(--surface)', border: '1px solid var(--rim)',
            borderRadius: 'var(--r-sm)', cursor: 'pointer', color: 'var(--ink-low)',
            fontSize: '13px', fontFamily: 'var(--font-sans)', letterSpacing: '-0.005em',
            transition: 'border-color var(--t-fast), color var(--t-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rim-hi)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-low)' }}
        >
          <span style={{ fontSize: '13px' }}>&#9906;</span>
          <span style={{ flex: 1, textAlign: 'left' }}>Ask / Search</span>
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', background: 'var(--depth)', padding: '1px 5px', borderRadius: '4px', color: 'var(--ink-ghost)', border: '1px solid var(--rim)' }}>&#8984;K</kbd>
        </button>
      </div>

    </aside>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState(() =>
    getTabFromHash() || localStorage.getItem('msl_tab') || 'home'
  )
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tabProgress, setTabProgress] = useState(() => readTabProgress())
  const [isUnlocked,  setIsUnlocked]  = useState(() => checkUnlocked())
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('msl_theme') || 'dark' } catch { return 'dark' }
  })
  // ── Auth state ───────────────────────────────────────────────────────────────
  const [user,      setUser]      = useState(null)
  const [showAuth,  setShowAuth]  = useState(false)
  const [studyOpen, setStudyOpen] = useState(false)

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
          // upsertLeaderboardRow was never actually called anywhere in the app —
          // signed-in users with real progress never got a leaderboard row written,
          // so they'd never appear on the board no matter how much they'd done.
          upsertLeaderboardRow(session.user)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setActiveTab('home')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Reactive redirect: a signed-in user lands on Progress, not the marketing Home
  // (uniform with PAL/GSL — Home is the signed-out surface).
  useEffect(() => {
    if (user && activeTab === 'home') setActiveTab('progress')
  }, [user, activeTab])

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
  const [pendingOpen, setPendingOpen] = useState(null)
  const goTo = useCallback((tabId, openTarget = null) => {
    setActiveTab(tabId)
    setPendingOpen(openTarget)
    setSearchOpen(false)
    setSidebarOpen(false)
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
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      // Shift+Ctrl/Cmd+K → toggle private study room (requires sign-in)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'K') { e.preventDefault(); if (user) setStudyOpen(s => !s) }
      if (e.key === 'Escape') { setSearchOpen(false); setStudyOpen(false) }
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
    if (PREMIUM_TABS.has(activeTab)) {
      // Auth gate fires first — sign-in required for all premium content
      if (authEnabled && !user) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 20px' }}>
            <div style={{ maxWidth: '400px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '16px' }}>Sign in required</div>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 12px', lineHeight: 1.2 }}>
                Create a free account to continue
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.65, margin: '0 0 24px' }}>
                Sign in to access this section. A full-lab access code unlocks everything on top of your free account.
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="btn-primary"
                style={{ padding: '11px 28px', fontSize: '13px' }}
              >
                Sign in →
              </button>
            </div>
          </div>
        )
      }
      // Content gate fires second — access code required for premium content
      if (!isUnlocked) {
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
    // Leaderboard needs user + onOpenProfile
    if (activeTab === 'leaderboard') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <LeaderboardTab user={user} onOpenProfile={(uid) => { window.location.hash = '#/u/' + uid }} />
        </Suspense>
      )
    }
    // Progress needs user + onNavigate
    if (activeTab === 'progress') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <ProgressTab user={user} onNavigate={goTo} />
        </Suspense>
      )
    }
    if (activeTab === 'my_tracks') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <MyTracksTab onNavigate={goTo} />
        </Suspense>
      )
    }
    // Free tabs with two-gate model need user + onShowAuth
    const FREE_TABS_WITH_AUTH = new Set(['features', 'eval', 'classical', 'models'])
    if (FREE_TABS_WITH_AUTH.has(activeTab)) {
      const Component = ALL_TABS.find(t => t.id === activeTab)?.component
      return Component ? (
        <Suspense fallback={<LoadingSpinner />}>
          <Component onNavigate={goTo} openModuleId={pendingOpen} user={user} onShowAuth={() => setShowAuth(true)} />
        </Suspense>
      ) : null
    }
    const Component = ALL_TABS.find(t => t.id === activeTab)?.component
    return Component ? (
      <Suspense fallback={<LoadingSpinner />}>
        <Component onNavigate={goTo} openModuleId={pendingOpen} />
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

      {/* ── Sidebar — fixed rail on desktop, off-canvas drawer on mobile ── */}
      <DesktopSidebar activeTabId={activeTab} goTo={goTo} onSearch={() => setSearchOpen(true)} tabProgress={tabProgress} isUnlocked={isUnlocked} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Scrim behind the open drawer (mobile only, via CSS) ── */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' show' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

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
          {/* Hamburger — opens the nav drawer (mobile only, hidden on desktop via CSS) */}
          <button
            className="ml-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            style={{ alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', marginLeft: '-6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-low)', flexShrink: 0, padding: 0 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
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
            <span style={{ display: 'inline' }}>Ask / Search</span>
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

      {/* Bottom nav removed — mobile navigation now uses the drawer (hamburger in topbar). */}

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--rim)', padding: '14px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginBottom: '8px', opacity: 0.85 }}>
          <BrandMark variant='wordmark' size={13} />
          <span style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>· ML Systems · part of BreakLabs</span>
        </div>
        <p style={{ margin: '0 0 8px', fontSize: '11px' }}>
          <a href="https://chat.whatsapp.com/JbIaqV87fwh8Ym3ufH5CFx?mode=gi_t" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--prime)', textDecoration: 'underline', textUnderlineOffset: '3px', fontWeight: 600 }}>Join the community →</a>
        </p>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
          Also by the same team:{' '}
          <a href="https://genai-systems-lab-ivory.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-ghost)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>GenAI Systems Lab</a>
          {' · '}
          <a href="https://product-analytics-lab.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-ghost)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Product Analytics Lab</a>
          {' · '}
          <a href="https://programming-lab.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-ghost)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Programming Lab</a>
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

      {/* ── Study Room — Shift+Ctrl+K, private, requires sign-in ── */}
      {studyOpen && <StudyRoom user={user} onClose={() => setStudyOpen(false)} />}

      {/* ── Auth modal — MUST be last in return, never inside a transformed panel ── */}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />

    </div>
  )
}
