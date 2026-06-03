import { useState, useEffect } from 'react'
import { downloadProgressJSON } from '../utils/export.js'

// ── Section tab registry (mirrors NAV_SECTIONS in App.jsx) ───────────────────
const SECTION_TABS = {
  foundations: ['models', 'classical'],
  scenarios:   ['features', 'spark', 'airflow', 'dbt', 'modeling', 'eval', 'dl', 'dl_finetune', 'design', 'dl_serving', 'mlops_deploy', 'mlops_pipes', 'monitor', 'ts', 'causal'],
  practice:    ['incidentroom', 'mlcoding', 'codebugs', 'projectlab', 'loan_default', 'fraud_detection', 'casestudies'],
  interview:   ['interview', 'combinator', 'verbal', 'stafflayer', 'defense', 'spottheflaw', 'takehome', 'trainer'],
  learn:       ['gradient', 'landscape'],
}

const SECTIONS = [
  { id: 'foundations', label: 'Foundations', desc: 'Math, stats, classical ML.',                     defaultTab: 'models',       icon: '≡' },
  { id: 'scenarios',   label: 'Scenarios',   desc: 'Production failure modes by responsibility.',    defaultTab: 'features',     icon: '⊟' },
  { id: 'practice',    label: 'Practice',    desc: 'Incidents, coding problems, end-to-end labs.',   defaultTab: 'incidentroom', icon: '⚡' },
  { id: 'interview',   label: 'Interview',   desc: '128 questions, timed exam, verbal, behavioral.', defaultTab: 'interview',    icon: '◈' },
  { id: 'learn',       label: 'Learn',       desc: '50 deep-dive posts on production ML.',           defaultTab: 'gradient',     icon: '∇' },
]

const ENTRY_PATHS = [
  { label: 'Preparing for interviews',    desc: "Build the framing that separates a pass from a hire — Q&A bank, timed exam, verbal practice.",             tab: 'interview',    cta: 'Go to Interview →' },
  { label: 'Sharpening production skills',desc: "Scenario-based practice across features, evaluation, system design, and monitoring.",                      tab: 'features',     cta: 'Go to Scenarios →' },
  { label: 'Building foundations',        desc: "Statistics, classical ML, and math — the vocabulary that makes every other section land.",                  tab: 'models',       cta: 'Go to Foundations →' },
]

function readSectionProgress() {
  const result = {}
  Object.entries(SECTION_TABS).forEach(([sectionId, tabs]) => {
    let attempted = 0, total = 0
    tabs.forEach(tabId => {
      try {
        const raw = localStorage.getItem(`msl_score:${tabId}`)
        if (raw) { const p = JSON.parse(raw); attempted += p.attempted || 0; total += p.total || 0 }
      } catch {}
    })
    result[sectionId] = { attempted, total, pct: total > 0 ? Math.round((attempted / total) * 100) : 0 }
  })
  return result
}

export default function HomeTab({ onNavigate }) {
  const [sectionProgress, setSectionProgress] = useState(() => readSectionProgress())
  const lastTab = (() => { try { return localStorage.getItem('msl_tab') } catch { return null } })()

  useEffect(() => {
    function onProg() { setSectionProgress(readSectionProgress()) }
    window.addEventListener('msl_score_updated', onProg)
    window.addEventListener('storage', onProg)
    return () => { window.removeEventListener('msl_score_updated', onProg); window.removeEventListener('storage', onProg) }
  }, [])

  const totalAttempted = Object.values(sectionProgress).reduce((s, p) => s + p.attempted, 0)
  const totalScenarios = Object.values(sectionProgress).reduce((s, p) => s + p.total, 0)
  const overallPct     = totalScenarios > 0 ? Math.round((totalAttempted / totalScenarios) * 100) : 0

  return (
    <div style={{ maxWidth: '660px', margin: '0 auto', paddingBottom: '48px' }}>

      {/* Hero */}
      <div style={{ paddingTop: '40px', marginBottom: '40px' }}>
        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--prime)', marginBottom: '10px' }}>ML Systems Lab</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '30px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.12, color: 'var(--ink-hi)', marginBottom: '14px' }}>
          Production ML judgment.<br />Built through real failure modes.
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '500px', marginBottom: '18px' }}>
          Not theory. The actual failure modes that break production ML systems — and the framing senior practitioners use to reason through them.
        </p>
        {totalScenarios > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '240px', height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
              <div style={{ width: `${overallPct}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 8px var(--prime-glow)' }} />
            </div>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)' }}>{overallPct}%</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>{totalAttempted}/{totalScenarios}</span>
          </div>
        )}
      </div>

      {/* Entry paths */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '12px' }}>Where to start</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ENTRY_PATHS.map(path => <EntryCard key={path.tab} path={path} onNavigate={onNavigate} />)}
        </div>
      </div>

      {/* Section overview */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '12px' }}>Sections</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {SECTIONS.map(section => (
            <SectionRow key={section.id} section={section} prog={sectionProgress[section.id] || { pct: 0, attempted: 0, total: 0 }} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      {/* Continue */}
      {lastTab && lastTab !== 'home' && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '10px' }}>Continue</div>
          <ResumeBtn lastTab={lastTab} onNavigate={onNavigate} />
        </div>
      )}

      {/* Export */}
      <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={downloadProgressJSON} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-low)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-ghost)'}
        >↓ export progress</button>
      </div>

    </div>
  )
}

function EntryCard({ path, onNavigate }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={() => onNavigate(path.tab)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ textAlign: 'left', padding: '14px 16px', background: hov ? 'var(--card-tint)' : 'var(--surface)', border: `1px solid ${hov ? 'var(--rim-hi)' : 'var(--rim)'}`, borderRadius: '10px', cursor: 'pointer', width: '100%', transition: 'border-color var(--t), background var(--t)' }}
    >
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '4px' }}>{path.label}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, marginBottom: '8px' }}>{path.desc}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--prime)', fontWeight: 600 }}>{path.cta}</div>
    </button>
  )
}

function SectionRow({ section, prog, onNavigate }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={() => onNavigate(section.defaultTab)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ textAlign: 'left', padding: '11px 14px', background: hov ? 'var(--card-tint)' : 'var(--surface)', border: `1px solid ${hov ? 'var(--rim-hi)' : 'var(--rim)'}`, borderRadius: '8px', cursor: 'pointer', width: '100%', transition: 'border-color var(--t), background var(--t)', display: 'flex', alignItems: 'center', gap: '12px' }}
    >
      <span style={{ fontSize: '15px', width: '18px', textAlign: 'center', color: 'var(--ink-ghost)', flexShrink: 0 }}>{section.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: prog.total > 0 ? '4px' : '0' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '12px', color: 'var(--ink-hi)' }}>{section.label}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--ink-ghost)' }}>{section.desc}</span>
        </div>
        {prog.total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '120px', height: '2px', background: 'var(--rim)', borderRadius: '2px', flexShrink: 0 }}>
              <div style={{ width: `${prog.pct}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s' }} />
            </div>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: prog.pct > 0 ? 'var(--prime)' : 'var(--ink-ghost)' }}>{prog.pct}%</span>
          </div>
        )}
      </div>
      <span style={{ fontSize: '14px', color: 'var(--ink-ghost)', flexShrink: 0 }}>›</span>
    </button>
  )
}

function ResumeBtn({ lastTab, onNavigate }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={() => onNavigate(lastTab)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: hov ? 'var(--card-tint)' : 'var(--surface)', border: `1px solid ${hov ? 'var(--rim-hi)' : 'var(--rim)'}`, borderRadius: '8px', cursor: 'pointer', width: '100%', transition: 'border-color var(--t), background var(--t)' }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>↩</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-mid)' }}>
        Resume <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--prime)', fontSize: '12px' }}>{lastTab}</span>
      </span>
    </button>
  )
}
