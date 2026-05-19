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

// Tab order follows a natural learning path:
// context → foundations → engineering → scale → evaluation → architecture → ops → practice → reading → careers
const TABS = [
  { id: 'home',      label: 'Home',       component: HomeTab },
  { id: 'models',    label: 'Models',     component: ModelsMathTab },
  { id: 'features',  label: 'Features',   component: FeatureEngTab },
  { id: 'spark',     label: 'Spark',      component: SparkLabTab },
  { id: 'eval',      label: 'Evaluation', component: ModelEvalTab },
  { id: 'design',    label: 'Design',     component: SystemDesignTab },
  { id: 'monitor',   label: 'Monitor',    component: MonitoringTab },
  { id: 'interview', label: 'Interview',  component: InterviewPrepTab },
  { id: 'gradient',  label: 'Gradient',   component: GradientTab },
  { id: 'landscape', label: 'Landscape',  component: LandscapeTab },
]

// ── URL hash routing ──────────────────────────────────────────────────────────
function getTabFromHash() {
  const hash = window.location.hash.replace('#', '')
  return TABS.find(t => t.id === hash)?.id ?? null
}
function setHash(tabId) {
  window.history.replaceState(null, '', tabId === 'home' ? window.location.pathname : `#${tabId}`)
}

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
      if (e.key === 'Escape') setSearchOpen(false)
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

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? HomeTab

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,7,14,0.90)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--rim)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
            {/* Logo */}
            <button onClick={() => goTo('home')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: 'linear-gradient(135deg, var(--prime), var(--violet))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'JetBrains Mono',monospace", fontWeight: 700,
                fontSize: '10px', color: '#fff', letterSpacing: '-0.02em',
              }}>ML</div>
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', letterSpacing: '-0.02em', display: 'none' }} className="sm-block">
                Systems Lab
              </span>
            </button>

            {/* Right: search + hamburger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setSearchOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--prime-faint)', border: '1px solid var(--rim)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '13px', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,247,0.35)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-low)' }}>
                <span style={{ fontSize: '13px' }}>⌕</span>
                <span style={{ display: 'none' }} className="md-block">Search</span>
                <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', background: 'var(--rim)', padding: '1px 5px', borderRadius: '4px', color: 'var(--ink-low)', display: 'none' }} className="md-block">⌘K</kbd>
              </button>

              <button className="lg:hidden btn-ghost" onClick={() => setMenuOpen(o => !o)}>
                {menuOpen
                  ? <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Desktop tab nav — text only, no icons */}
          <nav style={{ display: 'flex', gap: 0, overflowX: 'auto', marginBottom: '-1px' }} className="hidden lg:flex">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => goTo(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile dropdown — clean list */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid var(--rim)', padding: '8px 20px 16px', background: 'var(--void)' }} className="lg:hidden">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => goTo(tab.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px', fontWeight: 500, marginBottom: '2px', background: activeTab === tab.id ? 'var(--prime-faint)' : 'none', color: activeTab === tab.id ? 'var(--prime-hi)' : 'var(--ink-low)', transition: 'all 0.12s' }}>
                {tab.label}
              </button>
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
