import { useState, useEffect } from 'react'
import { trackTabSwitch } from './analytics.js'

import HomeTab          from './tabs/HomeTab.jsx'
import SparkLabTab      from './tabs/SparkLabTab.jsx'
import FeatureEngTab    from './tabs/FeatureEngTab.jsx'
import ModelEvalTab     from './tabs/ModelEvalTab.jsx'
import ModelsMathTab    from './tabs/ModelsMathTab.jsx'
import SystemDesignTab  from './tabs/SystemDesignTab.jsx'
import MonitoringTab    from './tabs/MonitoringTab.jsx'
import InterviewPrepTab from './tabs/InterviewPrepTab.jsx'
import GradientTab      from './tabs/GradientTab.jsx'

const TABS = [
  { id: 'home',      label: 'Home',         icon: '⚡', component: HomeTab },
  { id: 'spark',     label: 'Spark Lab',    icon: '🔥', component: SparkLabTab },
  { id: 'features',  label: 'Features',     icon: '🧩', component: FeatureEngTab },
  { id: 'eval',      label: 'Eval',         icon: '📊', component: ModelEvalTab },
  { id: 'models',    label: 'Models & Math',icon: '∑',  component: ModelsMathTab },
  { id: 'design',    label: 'System Design',icon: '🏗',  component: SystemDesignTab },
  { id: 'monitor',   label: 'Monitoring',   icon: '📡', component: MonitoringTab },
  { id: 'interview', label: 'Interview',    icon: '🎯', component: InterviewPrepTab },
  { id: 'gradient',  label: 'Gradient',     icon: '∇',  component: GradientTab },
]

export default function App() {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem('msl_tab') || 'home'
  )
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('msl_tab', activeTab)
  }, [activeTab])

  function goTo(tabId) {
    setActiveTab(tabId)
    setMenuOpen(false)
    trackTabSwitch(tabId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? HomeTab

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50"
        style={{ background: 'rgba(5,6,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #1c2040' }}>
        <div className="max-w-7xl mx-auto px-5">

          {/* Top row: logo + mobile menu */}
          <div className="flex items-center justify-between h-14">
            <button onClick={() => goTo('home')} className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#6366f1,#22d3ee)', color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
                ML
              </div>
              <span className="font-display font-semibold text-sm tracking-tight hidden sm:block"
                style={{ color: '#eaecff', fontFamily: "'Space Grotesk', sans-serif" }}>
                Systems Lab
              </span>
            </button>

            {/* Mobile hamburger */}
            <button className="lg:hidden btn-ghost" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              {menuOpen
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
              }
            </button>
          </div>

          {/* Desktop nav — underline style */}
          <nav className="hidden lg:flex items-center gap-0 overflow-x-auto -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="mr-1.5 text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <div className="lg:hidden px-5 pb-4 pt-2 flex flex-col gap-1"
            style={{ borderTop: '1px solid #1c2040' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => goTo(tab.id)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-glow text-ink-high'
                    : 'text-ink-low hover:text-ink-medium hover:bg-white/3'
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span className="mr-2">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-5 py-10 animate-fade-in">
        <ActiveComponent onNavigate={goTo} />
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #1c2040' }} className="mt-16">
        <div className="max-w-7xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg,#6366f1,#22d3ee)', color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
              ML
            </div>
            <span className="text-xs" style={{ color: '#2d3260' }}>ML Systems Lab · built by Sidharth Kriplani</span>
          </div>
          <div className="flex items-center gap-5 text-xs" style={{ color: '#2d3260' }}>
            <a href="https://genai-systems-lab-ivory.vercel.app" target="_blank" rel="noopener noreferrer"
              className="transition-colors hover:text-indigo-bright">
              GenAI Systems Lab ↗
            </a>
            <a href="https://github.com/SidharthKriplani" target="_blank" rel="noopener noreferrer"
              className="transition-colors hover:text-indigo-bright">
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
