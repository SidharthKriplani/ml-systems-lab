import { useState, useEffect, useCallback } from 'react'
import { trackTabSwitch } from './analytics.js'
import GlobalSearch from './components/GlobalSearch.jsx'

import HomeTab           from './tabs/HomeTab.jsx'
import SparkLabTab       from './tabs/SparkLabTab.jsx'
import FeatureEngTab     from './tabs/FeatureEngTab.jsx'
import ModelEvalTab      from './tabs/ModelEvalTab.jsx'
import ModelsMathTab     from './tabs/ModelsMathTab.jsx'
import SystemDesignTab   from './tabs/SystemDesignTab.jsx'
import MonitoringTab     from './tabs/MonitoringTab.jsx'
import InterviewPrepTab  from './tabs/InterviewPrepTab.jsx'
import GradientTab       from './tabs/GradientTab.jsx'
import LandscapeTab      from './tabs/LandscapeTab.jsx'
import ClassicalMLTab    from './tabs/ClassicalMLTab.jsx'
import MLOpsDeployTab    from './tabs/MLOpsDeployTab.jsx'
import MLOpsPipelinesTab from './tabs/MLOpsPipelinesTab.jsx'
import DeepLearningTab   from './tabs/DeepLearningTab.jsx'
import DLFineTuningTab   from './tabs/DLFineTuningTab.jsx'
import DLServingTab      from './tabs/DLServingTab.jsx'
import DataScienceTab    from './tabs/DataScienceTab.jsx'
import CausalInferenceTab from './tabs/CausalInferenceTab.jsx'
import TimeSeriesTab     from './tabs/TimeSeriesTab.jsx'
import AirflowTab        from './tabs/AirflowTab.jsx'
import DbtTab            from './tabs/dbtTab.jsx'
import DataModelingTab   from './tabs/DataModelingTab.jsx'
import AskTab            from './tabs/AskTab.jsx'
import TakeHomeTab    from './tabs/TakeHomeTab.jsx'
import TrainerTab     from './tabs/TrainerTab.jsx'
import CombinatorTab  from './tabs/CombinatorTab.jsx'
import CodeBugsTab    from './tabs/CodeBugsTab.jsx'
import CaseStudiesTab from './tabs/CaseStudiesTab.jsx'
import StaffLayerTab  from './tabs/StaffLayerTab.jsx'
import JDPrepTab      from './tabs/JDPrepTab.jsx'
import DefenseDocTab  from './tabs/DefenseDocTab.jsx'
import VerbatimTab    from './tabs/VerbatimTab.jsx'

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
]

// ── Zone routing ──────────────────────────────────────────────────────────────
const TAB_TO_ZONE = {
  home: 'today', landscape: 'today',
  gradient: 'read',
  interview: 'interview',
  takehome: 'interview', combinator: 'interview',
  jdprep: 'interview', defense: 'interview', verbal: 'interview',
  ask: 'ask',
}
const ZONE_DEFAULTS = {
  today: 'home', practice: null, read: 'gradient', interview: null, ask: 'ask',
}
function getZoneForTab(id) { return TAB_TO_ZONE[id] ?? 'practice' }

// ── Bottom nav zones ──────────────────────────────────────────────────────────
const NAV_ZONES = [
  { id: 'today',     label: 'Today',     icon: '◎', accent: 'var(--prime)' },
  { id: 'practice',  label: 'Practice',  icon: '⊞', accent: 'var(--mint)' },
  { id: 'read',      label: 'Read',      icon: '∇', accent: 'var(--sky)' },
  { id: 'interview', label: 'Interview', icon: '◈', accent: 'var(--gold)' },
  { id: 'ask',       label: 'Ask',       icon: '✦', accent: 'var(--violet)' },
]

// ── Practice domain config ────────────────────────────────────────────────────
const PRACTICE_DOMAINS = [
  {
    id: 'mle', label: 'ML Engineering', accent: 'var(--mint)', bg: 'rgba(52,211,153,0.06)',
    tabs: [
      { id: 'models',    label: 'Math Foundations',    desc: 'PCA, SVD, calibration — Python in browser' },
      { id: 'features',  label: 'Feature Engineering', desc: 'Skew, leakage, feature stores' },
      { id: 'eval',      label: 'Model Evaluation',    desc: 'Metrics, shadow mode, calibration' },
      { id: 'design',    label: 'System Design',       desc: 'Incident room, two-tower, ML platform' },
      { id: 'classical', label: 'Classical ML',        desc: 'Failure zoo, ensembles, hyperparams' },
    ],
  },
  {
    id: 'de', label: 'Data Engineering', accent: 'var(--ember)', bg: 'rgba(249,115,22,0.06)',
    tabs: [
      { id: 'spark',    label: 'Spark Lab',     desc: 'Shuffle, skew, broadcast join decisions' },
      { id: 'airflow',  label: 'Airflow',       desc: 'DAG failures, backfill, late data' },
      { id: 'dbt',      label: 'dbt',           desc: 'Materialization, schema drift' },
      { id: 'modeling', label: 'Data Modeling', desc: 'Star/OBT, SCDs, OLAP formats' },
    ],
  },
  {
    id: 'dl', label: 'Deep Learning', accent: 'var(--violet)', bg: 'rgba(99,102,241,0.06)',
    tabs: [
      { id: 'dl',          label: 'Training Lab', desc: 'Loss spikes, gradients, debugging' },
      { id: 'dl_finetune', label: 'Fine-tuning',  desc: 'LoRA, freeze, LR strategy' },
      { id: 'dl_serving',  label: 'DL Serving',   desc: 'Quantization, GPU memory, serving' },
    ],
  },
  {
    id: 'ds', label: 'Data Science', accent: 'var(--sky)', bg: 'rgba(34,211,238,0.06)',
    tabs: [
      { id: 'ds',     label: 'DS Fundamentals',  desc: 'Model selection, calibration, metrics' },
      { id: 'causal', label: 'Causal Inference', desc: 'Identification, uplift, obs vs exp' },
      { id: 'ts',     label: 'Time Series',      desc: 'Failures, stationarity, anomaly detection' },
    ],
  },
  {
    id: 'mlops', label: 'MLOps', accent: 'var(--rose)', bg: 'rgba(244,63,94,0.06)',
    tabs: [
      { id: 'monitor',      label: 'Monitoring',    desc: 'Drift, PSI, incident triage' },
      { id: 'mlops_deploy', label: 'Deployment',    desc: 'Strategies, champion-challenger, rollback' },
      { id: 'mlops_pipes',  label: 'CI/CD & Infra', desc: 'Gates, infra decisions, model registry' },
    ],
  },
  {
    id: 'iprep', label: 'Interview Tools', accent: 'var(--prime)', bg: 'rgba(240,165,0,0.06)',
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
  { id: 'interview',  label: 'Interview Q&A',   desc: '50+ curated questions with model answers', icon: '◈', accent: 'var(--sky)' },
  { id: 'takehome',   label: 'Take-Home Bank',   desc: '15 open-ended questions · self-scored',    icon: '✎', accent: 'var(--mint)' },
  { id: 'combinator', label: 'Combinator',       desc: 'Timed mock session — 30 / 45 / 60 min',    icon: '⊕', accent: 'var(--rose)' },
  { id: 'jdprep',     label: 'JD Prep',          desc: 'Paste a JD → ranked study topics',          icon: '⚑', accent: 'var(--prime)' },
  { id: 'defense',    label: 'Defense Doc',      desc: 'Weighted study brief + PDF export',         icon: '⛊', accent: 'var(--ember)' },
  { id: 'verbal',     label: 'Verbal Practice',  desc: 'Voice-record answers · Chrome / Edge',      icon: '◉', accent: 'var(--violet)' },
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
      <circle cx="8" cy="8" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <circle cx="8" cy="8" r={r} fill="none" stroke={accent} strokeWidth="2"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 8 8)" opacity={0.8} />
    </svg>
  )
}

// ── PracticeCard ──────────────────────────────────────────────────────────────
function PracticeCard({ tab, domain, onSelect, tabProgress }) {
  const [hov, setHov] = useState(false)
  const prog = tabProgress?.[tab.id]
  const pct  = prog && prog.total > 0 ? Math.round((prog.attempted / prog.total) * 100) : 0

  return (
    <button
      onClick={() => onSelect(tab.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left', padding: '14px 16px',
        background: hov ? domain.bg : 'transparent',
        borderTop:    `1px solid ${hov ? domain.accent + '50' : 'var(--rim)'}`,
        borderRight:  `1px solid ${hov ? domain.accent + '50' : 'var(--rim)'}`,
        borderBottom: `1px solid ${hov ? domain.accent + '50' : 'var(--rim)'}`,
        borderLeft:   `3px solid ${domain.accent}`,
        borderRadius: '10px', cursor: 'pointer',
        transition: 'all 0.14s', width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: hov ? 'var(--ink-hi)' : 'var(--ink-mid)', fontFamily: "'Space Grotesk',sans-serif", transition: 'color 0.14s' }}>
          {tab.label}
        </span>
        {prog && prog.total > 0 && (
          <ProgressRing attempted={prog.attempted} total={prog.total} accent={domain.accent} />
        )}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--ink-low)', lineHeight: 1.5, margin: 0 }}>{tab.desc}</p>
      {pct > 0 && (
        <div style={{ marginTop: '9px', height: '2px', background: 'var(--rim)', borderRadius: '1px' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: domain.accent, borderRadius: '1px' }} />
        </div>
      )}
    </button>
  )
}

// ── PracticeGrid ──────────────────────────────────────────────────────────────
function PracticeGrid({ onSelect, tabProgress }) {
  const totalAttempted = Object.values(tabProgress ?? {}).reduce((s, p) => s + (p.attempted || 0), 0)
  const totalScenarios = Object.values(tabProgress ?? {}).reduce((s, p) => s + (p.total || 0), 0)

  return (
    <div style={{ paddingTop: '8px' }}>
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '24px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink-hi)', marginBottom: '4px' }}>
        Practice
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', marginBottom: '6px', lineHeight: 1.6 }}>
        20 domains · 150+ production scenarios
      </p>
      {totalScenarios > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: "'JetBrains Mono',monospace" }}>Your progress</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ width: `${Math.round((totalAttempted / totalScenarios) * 100)}%`, height: '100%', background: 'var(--mint)', borderRadius: '2px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>
            {totalAttempted}/{totalScenarios}
          </span>
        </div>
      )}
      {PRACTICE_DOMAINS.map(domain => (
        <div key={domain.id} style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: domain.accent, marginBottom: '10px', opacity: 0.9 }}>
            {domain.label}
          </div>
          <div className="grid-cards">
            {domain.tabs.map(tab => (
              <PracticeCard key={tab.id} tab={tab} domain={domain} onSelect={onSelect} tabProgress={tabProgress} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── InterviewToolCard ─────────────────────────────────────────────────────────
function InterviewToolCard({ tool, onSelect }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => onSelect(tool.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left', padding: '16px 18px',
        background: hov ? `color-mix(in srgb, ${tool.accent} 8%, transparent)` : 'transparent',
        borderTop:    `1px solid ${hov ? tool.accent + '70' : 'var(--rim)'}`,
        borderRight:  `1px solid ${hov ? tool.accent + '70' : 'var(--rim)'}`,
        borderBottom: `1px solid ${hov ? tool.accent + '70' : 'var(--rim)'}`,
        borderLeft:   `3px solid ${tool.accent}`,
        borderRadius: '10px', cursor: 'pointer', transition: 'all 0.14s', width: '100%',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '16px', color: tool.accent }}>{tool.icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: hov ? 'var(--ink-hi)' : 'var(--ink-mid)', fontFamily: "'Space Grotesk',sans-serif", transition: 'color 0.14s' }}>
          {tool.label}
        </span>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--ink-low)', lineHeight: 1.5, margin: 0 }}>{tool.desc}</p>
    </button>
  )
}

// ── InterviewGrid ─────────────────────────────────────────────────────────────
function InterviewGrid({ onSelect }) {
  return (
    <div style={{ paddingTop: '8px' }}>
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '24px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink-hi)', marginBottom: '4px' }}>
        Interview
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', marginBottom: '28px', lineHeight: 1.6 }}>
        6 tools — from Q&amp;A prep to timed mocks to defense docs
      </p>
      <div className="grid-cards-wide">
        {INTERVIEW_TOOLS.map(tool => (
          <InterviewToolCard key={tool.id} tool={tool} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

// ── BottomNav ─────────────────────────────────────────────────────────────────
function BottomNav({ activeZone, onZoneNav }) {
  return (
    <nav className="bottom-nav-safe" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(6,4,2,0.97)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid var(--rim)',
      zIndex: 100,
    }}>
      <div style={{ height: '56px', display: 'flex' }}>
      {NAV_ZONES.map(zone => {
        const isActive = activeZone === zone.id
        return (
          <button key={zone.id} onClick={() => onZoneNav(zone.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? zone.accent : 'rgba(255,255,255,0.22)',
              transition: 'color 0.15s',
              padding: '6px 4px 8px',
              position: 'relative',
              minWidth: 0,
              WebkitTapHighlightColor: 'transparent',
            }}>
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: '22%', right: '22%',
                height: '2px', background: zone.accent,
                borderRadius: '0 0 2px 2px',
              }} />
            )}
            <span style={{ fontSize: '15px', lineHeight: 1 }}>{zone.icon}</span>
            <span style={{ fontSize: '10px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: isActive ? 600 : 400, letterSpacing: '0.01em' }}>{zone.label}</span>
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

  // Navigate to any tabId from anywhere
  const goTo = useCallback((tabId) => {
    const zone = getZoneForTab(tabId)
    setActiveZone(zone)
    setZoneTab(prev => ({ ...prev, [zone]: tabId }))
    setSearchOpen(false)
    trackTabSwitch(tabId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // Bottom nav tap: same zone → reset to default (e.g. back to practice grid)
  function handleZoneNav(zoneId) {
    if (zoneId === activeZone) {
      setZoneTab(prev => ({ ...prev, [zoneId]: ZONE_DEFAULTS[zoneId] }))
    } else {
      setActiveZone(zoneId)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    if (isPracticeGrid)  return <PracticeGrid  onSelect={goTo} tabProgress={tabProgress} />
    if (isInterviewGrid) return <InterviewGrid onSelect={goTo} />
    const Component = ALL_TABS.find(t => t.id === currentTabId)?.component
    return Component ? <Component onNavigate={goTo} /> : <HomeTab onNavigate={goTo} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--void)' }}>

      {/* ── Topbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: 'rgba(6,4,2,0.94)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--rim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden', flex: 1 }}>
          {showBackBtn ? (
            <>
              <button
                onClick={() => setZoneTab(prev => ({ ...prev, [activeZone]: null }))}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '13px', fontFamily: "'Space Grotesk',sans-serif", padding: '4px 0' }}>
                ← <span>{activeZone === 'interview' ? 'Tools' : 'Domains'}</span>
              </button>
              {activeTabInfo && (
                <>
                  <span style={{ color: 'var(--rim)', fontSize: '13px' }}>/</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: activeTabInfo.domainAccent || activeTabInfo.accent, fontFamily: "'Space Grotesk',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeTabInfo.label}
                  </span>
                </>
              )}
            </>
          ) : (
            <button onClick={() => handleZoneNav('today')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'linear-gradient(135deg, var(--prime), var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '8px', color: '#fff', flexShrink: 0 }}>ML</div>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: 'var(--ink-hi)', letterSpacing: '-0.02em' }}>Systems Lab</span>
            </button>
          )}
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', borderRadius: '7px', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '12px', fontFamily: "'Space Grotesk',sans-serif" }}>
          <span style={{ fontSize: '13px' }}>⌕</span>
          <span style={{ display: 'inline' }}>Search</span>
          <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '4px', color: 'var(--ink-ghost)' }} className="hide-mobile">⌘K</kbd>
        </button>
      </header>

      {/* ── Content ── */}
      <main
        className="fade-in main-content"
        style={{
          maxWidth: '900px', width: '100%',
          margin: '0 auto',
          padding: '32px 20px 80px',
          boxSizing: 'border-box',
        }}>
        {renderContent()}
      </main>

      {/* ── Bottom nav ── */}
      <BottomNav activeZone={activeZone} onZoneNav={handleZoneNav} />

      {/* ── Global search ── */}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} onNavigate={goTo} />}
    </div>
  )
}
