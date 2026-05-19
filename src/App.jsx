import { useState, useEffect, useCallback } from 'react'
import { trackTabSwitch } from './analytics.js'
import GlobalSearch from './components/GlobalSearch.jsx'

import HomeTab          from './tabs/HomeTab.jsx'
import SparkLabTab      from './tabs/SparkLabTab.jsx'
import FeatureEngTab    from './tabs/FeatureEngTab.jsx'
import ModelEvalTab     from './tabs/ModelEvalTab.jsx'
import ModelsMathTab    from './tabs/ModelsMathTab.jsx'
import SystemDesignTab  from './tabs/SystemDesignTab.jsx'
import MonitoringTab    from './tabs/MonitoringTab.jsx'
import InterviewPrepTab from './tabs/InterviewPrepTab.jsx'
import GradientTab      from './tabs/GradientTab.jsx'
import LandscapeTab     from './tabs/LandscapeTab.jsx'
import ClassicalMLTab   from './tabs/ClassicalMLTab.jsx'
import MLOpsDeployTab   from './tabs/MLOpsDeployTab.jsx'
import MLOpsPipelinesTab from './tabs/MLOpsPipelinesTab.jsx'
import DeepLearningTab  from './tabs/DeepLearningTab.jsx'
import DLFineTuningTab  from './tabs/DLFineTuningTab.jsx'
import DLServingTab     from './tabs/DLServingTab.jsx'
import DataScienceTab    from './tabs/DataScienceTab.jsx'
import CausalInferenceTab from './tabs/CausalInferenceTab.jsx'
import TimeSeriesTab     from './tabs/TimeSeriesTab.jsx'
import AirflowTab        from './tabs/AirflowTab.jsx'
import DbtTab           from './tabs/dbtTab.jsx'
import DataModelingTab  from './tabs/DataModelingTab.jsx'

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
]

// ── Sidebar structure ─────────────────────────────────────────────────────────
const SIDEBAR_GROUPS = [
  {
    id: 'mle', label: 'ML Engineering', color: 'var(--mint)',
    tabs: [
      { id: 'models',    label: 'Math Foundations' },
      { id: 'features',  label: 'Features' },
      { id: 'eval',      label: 'Evaluation' },
      { id: 'design',    label: 'System Design' },
      { id: 'classical', label: 'Classical ML' },
    ],
  },
  {
    id: 'de', label: 'Data Engineering', color: 'var(--ember)',
    tabs: [
      { id: 'spark',    label: 'Spark Lab' },
      { id: 'airflow',  label: 'Airflow' },
      { id: 'dbt',      label: 'dbt' },
      { id: 'modeling', label: 'Data Modeling' },
    ],
  },
  {
    id: 'dl', label: 'Deep Learning', color: 'var(--violet)',
    tabs: [
      { id: 'dl',          label: 'Training Lab' },
      { id: 'dl_finetune', label: 'Fine-tuning' },
      { id: 'dl_serving',  label: 'Serving' },
    ],
  },
  {
    id: 'ds', label: 'Data Science', color: 'var(--sky)',
    tabs: [
      { id: 'ds',     label: 'DS Fundamentals' },
      { id: 'causal', label: 'Causal Inference' },
      { id: 'ts',     label: 'Time Series' },
    ],
  },
  {
    id: 'mlops', label: 'MLOps', color: 'var(--rose)',
    tabs: [
      { id: 'monitor',      label: 'Monitoring' },
      { id: 'mlops_deploy', label: 'Deployment' },
      { id: 'mlops_pipes',  label: 'CI/CD & Infra' },
    ],
  },
]

const BOTTOM_LINKS = [
  { id: 'interview', label: 'Interview Prep' },
  { id: 'gradient',  label: '∇ Gradient' },
  { id: 'landscape', label: 'Landscape' },
]

// ── Sidebar component ─────────────────────────────────────────────────────────
function Sidebar({ activeTab, onNavigate }) {
  return (
    <div style={{
      width: '220px', flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      padding: '16px 0 24px',
      overflowY: 'auto', scrollbarWidth: 'none',
      height: '100%',
    }}>
      {/* Home */}
      <div style={{ padding: '0 10px', marginBottom: '12px' }}>
        <SidebarItem
          label="Home"
          isActive={activeTab === 'home'}
          accent="var(--prime)"
          onClick={() => onNavigate('home')}
        />
      </div>

      {/* Domain groups */}
      {SIDEBAR_GROUPS.map(group => (
        <div key={group.id} style={{ marginBottom: '6px' }}>
          <div style={{
            padding: '5px 20px 3px',
            fontSize: '9px', fontFamily: "'JetBrains Mono',monospace",
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            color: group.color, opacity: 0.9,
          }}>
            {group.label}
          </div>
          <div style={{ padding: '2px 10px' }}>
            {group.tabs.map(tab => (
              <SidebarItem
                key={tab.id}
                label={tab.label}
                isActive={activeTab === tab.id}
                accent={group.color}
                onClick={() => onNavigate(tab.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--rim)', margin: '10px 14px 10px' }} />

      {/* Bottom links */}
      <div style={{ padding: '0 10px' }}>
        {BOTTOM_LINKS.map(tab => (
          <SidebarItem
            key={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            accent="var(--gold)"
            onClick={() => onNavigate(tab.id)}
          />
        ))}
      </div>

      {/* Footer credit */}
      <div style={{ marginTop: 'auto', padding: '20px 20px 0', borderTop: '1px solid var(--rim)', marginLeft: 0 }}>
        <div style={{ fontSize: '11px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          ML Systems Lab
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>Sidharth Kriplani</div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          {[
            ['GitHub', 'https://github.com/SidharthKriplani'],
            ['GenAI Lab', 'https://genai-systems-lab-ivory.vercel.app'],
          ].map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '10px', color: 'var(--ink-low)', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--prime)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-low)'}>
              {label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function SidebarItem({ label, isActive, accent, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '6px 10px',
        borderRadius: '6px',
        border: 'none',
        borderLeft: isActive ? `2px solid ${accent}` : '2px solid transparent',
        paddingLeft: isActive ? '8px' : '10px',
        cursor: 'pointer',
        fontFamily: "'Space Grotesk',sans-serif",
        fontSize: '13px',
        fontWeight: isActive ? 600 : 400,
        background: isActive
          ? 'rgba(255,255,255,0.07)'
          : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: isActive ? 'var(--ink-hi)' : hovered ? 'var(--ink-mid)' : 'var(--ink-low)',
        transition: 'all 0.12s',
        marginBottom: '1px',
      }}>
      {label}
    </button>
  )
}

// ── Routing helpers ───────────────────────────────────────────────────────────
function getTabFromHash() {
  const hash = window.location.hash.replace('#', '')
  return ALL_TABS.find(t => t.id === hash)?.id ?? null
}
function setHash(tabId) {
  window.history.replaceState(null, '', tabId === 'home' ? window.location.pathname : `#${tabId}`)
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab,  setActiveTab]  = useState(() => getTabFromHash() || localStorage.getItem('msl_tab') || 'home')
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('msl_tab', activeTab)
    setHash(activeTab)
  }, [activeTab])

  useEffect(() => {
    function onHashChange() {
      const t = getTabFromHash()
      if (t) setActiveTab(t)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') { setSearchOpen(false); setMenuOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const goTo = useCallback((tabId) => {
    setActiveTab(tabId)
    setMenuOpen(false)
    setSearchOpen(false)
    trackTabSwitch(tabId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const ActiveComponent = ALL_TABS.find(t => t.id === activeTab)?.component ?? HomeTab

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--void)' }}>

      {/* ── Topbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, height: '48px',
        display: 'flex', alignItems: 'center',
        background: 'rgba(12,10,8,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--rim)',
        padding: '0 20px',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <button onClick={() => goTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--prime), var(--violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '9px', color: '#fff',
          }}>ML</div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', letterSpacing: '-0.02em' }}>
            Systems Lab
          </span>
        </button>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search button */}
          <button onClick={() => setSearchOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--prime-faint)', border: '1px solid var(--rim)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '12px', transition: 'all 0.15s', fontFamily: "'Space Grotesk',sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,247,0.35)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-low)' }}>
            <span>⌕</span>
            <span>Search</span>
            <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: '4px', color: 'var(--ink-low)' }}>⌘K</kbd>
          </button>

          {/* Hamburger — mobile only */}
          <button className="hamburger-btn"
            onClick={() => setMenuOpen(o => !o)}
            style={{ alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: menuOpen ? 'rgba(255,255,255,0.08)' : 'none', border: '1px solid var(--rim)', borderRadius: '7px', cursor: 'pointer', color: 'var(--ink-mid)' }}>
            {menuOpen
              ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>

        {/* Desktop sidebar */}
        <aside className="sidebar-desktop" style={{
          width: '220px', flexShrink: 0,
          position: 'sticky', top: '48px',
          height: 'calc(100vh - 48px)',
          borderRight: '1px solid var(--rim)',
          background: 'rgba(0,0,0,0.18)',
        }}>
          <Sidebar activeTab={activeTab} onNavigate={goTo} />
        </aside>

        {/* Mobile sidebar overlay */}
        {menuOpen && (
          <div className="sidebar-overlay">
            <Sidebar activeTab={activeTab} onNavigate={goTo} />
          </div>
        )}

        {/* Main content */}
        <main className="content-area fade-in" style={{ flex: 1, minWidth: 0, padding: '40px 48px', maxWidth: '960px' }}>
          <ActiveComponent onNavigate={goTo} />
        </main>
      </div>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} onNavigate={goTo} />}
    </div>
  )
}
