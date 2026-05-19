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

// ── Domain → module hierarchy ─────────────────────────────────────────────────
const DOMAINS = [
  {
    id: 'home',
    label: 'Home',
    color: 'var(--prime)',
    bg: 'rgba(240,165,0,0.08)',
    tabs: [
      { id: 'home', label: 'Overview', component: HomeTab },
    ],
  },
  {
    id: 'mle',
    label: 'ML Engineering',
    color: 'var(--mint)',
    bg: 'rgba(52,211,153,0.08)',
    tabs: [
      { id: 'models',   label: 'Math Foundations', component: ModelsMathTab },
      { id: 'features', label: 'Features',        component: FeatureEngTab },
      { id: 'eval',     label: 'Evaluation',      component: ModelEvalTab },
      { id: 'design',    label: 'System Design',  component: SystemDesignTab },
      { id: 'classical', label: 'Classical ML',   component: ClassicalMLTab },
    ],
  },
  {
    id: 'de',
    label: 'Data Engineering',
    color: 'var(--ember)',
    bg: 'rgba(249,115,22,0.08)',
    tabs: [
      { id: 'spark',    label: 'Spark Lab',       component: SparkLabTab },
      { id: 'airflow',  label: 'Airflow',          component: AirflowTab },
      { id: 'dbt',      label: 'dbt',              component: DbtTab },
      { id: 'modeling', label: 'Data Modeling',    component: DataModelingTab },
    ],
  },
  {
    id: 'dl',
    label: 'Deep Learning',
    color: 'var(--violet)',
    bg: 'rgba(99,102,241,0.08)',
    tabs: [
      { id: 'dl',         label: 'Training Lab',    component: DeepLearningTab },
      { id: 'dl_finetune',label: 'Fine-tuning',     component: DLFineTuningTab },
      { id: 'dl_serving', label: 'Serving',         component: DLServingTab },
    ],
  },
  {
    id: 'mlops',
    label: 'MLOps',
    color: 'var(--rose)',
    bg: 'rgba(244,63,94,0.08)',
    tabs: [
      { id: 'monitor',      label: 'Monitoring',  component: MonitoringTab },
      { id: 'mlops_deploy', label: 'Deployment',  component: MLOpsDeployTab },
      { id: 'mlops_pipes',  label: 'CI/CD & Infra', component: MLOpsPipelinesTab },
    ],
  },
  {
    id: 'ds',
    label: 'Data Science',
    color: 'var(--sky)',
    bg: 'rgba(34,211,238,0.08)',
    tabs: [
      { id: 'ds',       label: 'DS Fundamentals',     component: DataScienceTab },
      { id: 'causal',   label: 'Causal Inference',    component: CausalInferenceTab },
      { id: 'ts',       label: 'Time Series',         component: TimeSeriesTab },
    ],
  },
  {
    id: 'resources',
    label: 'Resources',
    color: 'var(--gold)',
    bg: 'rgba(251,191,36,0.08)',
    tabs: [
      { id: 'interview', label: 'Interview Prep', component: InterviewPrepTab },
      { id: 'gradient',  label: '∇ Gradient',    component: GradientTab },
      { id: 'landscape', label: 'Landscape',      component: LandscapeTab },
    ],
  },
]

// Flat list for backward-compat (hash routing, search, progress)
const ALL_TABS = DOMAINS.flatMap(d => d.tabs)

function getTabFromHash() {
  const hash = window.location.hash.replace('#', '')
  return ALL_TABS.find(t => t.id === hash)?.id ?? null
}
function setHash(tabId) {
  window.history.replaceState(null, '', tabId === 'home' ? window.location.pathname : `#${tabId}`)
}
function getDomainForTab(tabId) {
  return DOMAINS.find(d => d.tabs.some(t => t.id === tabId)) ?? DOMAINS[0]
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const initTab    = getTabFromHash() || localStorage.getItem('msl_tab') || 'home'
  const initDomain = getDomainForTab(initTab).id

  const [activeTab,    setActiveTab]    = useState(initTab)
  const [activeDomain, setActiveDomain] = useState(initDomain)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [searchOpen,   setSearchOpen]   = useState(false)

  useEffect(() => {
    localStorage.setItem('msl_tab', activeTab)
    setHash(activeTab)
  }, [activeTab])

  // Persist last-visited tab per domain for smart domain-click behaviour
  useEffect(() => {
    localStorage.setItem(`msl_dtab_${activeDomain}`, activeTab)
  }, [activeTab, activeDomain])

  useEffect(() => {
    function onHashChange() {
      const t = getTabFromHash()
      if (t) { setActiveTab(t); setActiveDomain(getDomainForTab(t).id) }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const goTo = useCallback((tabId) => {
    setActiveTab(tabId)
    setActiveDomain(getDomainForTab(tabId).id)
    setMenuOpen(false)
    setSearchOpen(false)
    trackTabSwitch(tabId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Clicking a domain pill: resume last visited tab in that domain
  function pickDomain(domainId) {
    const domain = DOMAINS.find(d => d.id === domainId)
    if (!domain) return
    const saved = localStorage.getItem(`msl_dtab_${domainId}`)
    const tab   = domain.tabs.find(t => t.id === saved) ?? domain.tabs[0]
    goTo(tab.id)
  }

  const currentDomain   = DOMAINS.find(d => d.id === activeDomain) ?? DOMAINS[0]
  const showModuleNav   = currentDomain.tabs.length > 1
  const ActiveComponent = ALL_TABS.find(t => t.id === activeTab)?.component ?? HomeTab

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(12,10,8,0.93)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--rim)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

          {/* Top row: logo + search + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
            <button onClick={() => goTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: 'linear-gradient(135deg, var(--prime), var(--violet))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '10px', color: '#fff',
              }}>ML</div>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', letterSpacing: '-0.02em' }}>
                Systems Lab
              </span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setSearchOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--prime-faint)', border: '1px solid var(--rim)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '13px', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,247,0.35)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-low)' }}>
                <span style={{ fontSize: '13px' }}>⌕</span>
                <span style={{ display: 'none' }} className="md-block">Search</span>
                <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', background: 'var(--rim)', padding: '1px 5px', borderRadius: '4px', color: 'var(--ink-low)', display: 'none' }} className="md-block">⌘K</kbd>
              </button>

              <button className="btn-ghost" onClick={() => setMenuOpen(o => !o)} style={{ display: 'none' }} className="lg-hidden">
                {menuOpen
                  ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Domain row — desktop */}
          <nav style={{ display: 'flex', gap: '2px', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: showModuleNav ? '0' : '-1px' }}>
            {DOMAINS.map(domain => {
              const isActive = domain.id === activeDomain
              return (
                <button key={domain.id} onClick={() => pickDomain(domain.id)}
                  style={{
                    padding: '7px 13px',
                    border: 'none',
                    borderBottom: isActive ? `2px solid ${domain.color}` : '2px solid transparent',
                    background: isActive ? domain.bg : 'transparent',
                    color: isActive ? domain.color : 'var(--ink-low)',
                    fontSize: '12px',
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                    letterSpacing: '-0.01em',
                    borderRadius: isActive ? '4px 4px 0 0' : '4px 4px 0 0',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--ink-mid)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--ink-low)'; e.currentTarget.style.background = 'transparent' } }}>
                  {domain.label}
                </button>
              )
            })}
          </nav>

          {/* Module sub-nav — only when domain has 2+ tabs */}
          {showModuleNav && (
            <nav style={{ display: 'flex', gap: 0, overflowX: 'auto', marginBottom: '-1px', borderTop: '1px solid var(--rim)' }}>
              {currentDomain.tabs.map(tab => (
                <button key={tab.id} onClick={() => goTo(tab.id)}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}>
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Mobile dropdown — grouped by domain */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid var(--rim)', padding: '12px 20px 16px', background: 'var(--void)' }}>
            {DOMAINS.map(domain => (
              <div key={domain.id} style={{ marginBottom: '14px' }}>
                {domain.id !== 'home' && (
                  <div style={{ fontSize: '10px', color: domain.color, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: '4px', fontWeight: 700 }}>
                    {domain.label}
                  </div>
                )}
                {domain.tabs.map(tab => (
                  <button key={tab.id} onClick={() => goTo(tab.id)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px', fontWeight: 500, marginBottom: '2px', background: activeTab === tab.id ? domain.bg : 'none', color: activeTab === tab.id ? domain.color : 'var(--ink-low)', transition: 'all 0.12s' }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '40px 20px' }} className="fade-in">
        <ActiveComponent onNavigate={goTo} />
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--rim)', marginTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'linear-gradient(135deg,var(--prime),var(--violet))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono',monospace" }}>ML</div>
            <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>ML Systems Lab · Sidharth Kriplani</span>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[
              ['GenAI Systems Lab', 'https://genai-systems-lab-ivory.vercel.app'],
              ['GitHub', 'https://github.com/SidharthKriplani'],
            ].map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '12px', color: 'var(--ink-low)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--prime-hi)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-low)'}>
                {label} ↗
              </a>
            ))}
          </div>
        </div>
      </footer>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} onNavigate={goTo} />}
    </div>
  )
}
