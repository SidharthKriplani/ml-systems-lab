import { useState, useEffect } from 'react'
import { downloadProgressJSON } from '../utils/export.js'

// ── Recently added — update when new content ships ────────────────────────────
const RECENTLY_ADDED = [
  { date: '2026-06-18', label: 'Gradient — 5 new posts (122–126)', desc: 'Graph ML for Fraud · Real-Time Features · LLM Serving · Hierarchical Forecasting · Auction Theory', tab: 'gradient' },
  { date: '2026-06-18', label: 'ML Coding — 4-type framework', desc: 'Type 2: Debug (leaking CV), Type 3: Optimise (10× pandas), Type 4: Design (feature store 100K QPS)', tab: 'mlcoding' },
  { date: '2026-06-18', label: 'Gradient — 9 inline visualisations', desc: 'Interactive: attention heatmap, bias-variance, L1/L2 geometry, PR threshold slider, gradient descent path…', tab: 'gradient' },
  { date: '2026-06-18', label: 'Interview Cheatsheet',      desc: '4-tier last-minute prep: 50 flashcards · 12 formulas · traps · domain audit · 7-day plan + company profiles', tab: 'cheatsheet' },
  { date: '2026-06-18', label: 'Gradient — 200 interview Qs', desc: '4 Q&As per post across posts 51–100: RecSys, Search, Fraud, Pricing, Causal, DL, and more', tab: 'gradient' },
]

// ── Section tab registry ───────────────────────────────────────────────────────
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
  { label: 'Preparing for interviews',     desc: "Build the framing that separates a pass from a hire — Q&A bank, timed exam, verbal practice.",    tab: 'interview',    cta: 'Go to Interview →' },
  { label: 'Sharpening production skills', desc: "Scenario-based practice across features, evaluation, system design, and monitoring.",               tab: 'features',     cta: 'Go to Scenarios →' },
  { label: 'Building foundations',         desc: "Statistics, classical ML, and math — the vocabulary that makes every other section land.",           tab: 'models',       cta: 'Go to Foundations →' },
]

// ── Guided paths ───────────────────────────────────────────────────────────────
const GUIDED_PATHS = [
  {
    id: 'senior_mle',
    label: 'Senior MLE in 4 weeks',
    desc: 'The complete interview loop — framing, Q&A, timed exam, incident diagnosis, live coding.',
    steps: [
      { tabId: 'classical',   label: 'Classical ML',   scoreKey: 'msl_score:classical' },
      { tabId: 'defense',     label: 'Defense Plan',   scoreKey: null,               checkFn: () => !!localStorage.getItem('msl_defense_progress') },
      { tabId: 'interview',   label: 'Q&A Bank (128)', scoreKey: 'msl_score:interview' },
      { tabId: 'combinator',  label: 'Combinator Exam',scoreKey: 'msl_score:combinator' },
      { tabId: 'incidentroom',label: 'Incident Room',  scoreKey: 'msl_score:incidentroom' },
      { tabId: 'mlcoding',    label: 'ML Coding',      scoreKey: 'msl_score:mlcoding' },
      { tabId: 'verbal',      label: 'Verbal Practice',scoreKey: null, checkFn: () => !!localStorage.getItem('msl_verbal_history') },
    ],
  },
  {
    id: 'data_eng',
    label: 'Data Engineering Focus',
    desc: 'Spark, Airflow, dbt, data modeling — the stack behind every ML pipeline.',
    steps: [
      { tabId: 'spark',    label: 'Spark Lab',      scoreKey: 'msl_score:spark' },
      { tabId: 'airflow',  label: 'Airflow',         scoreKey: 'msl_score:airflow' },
      { tabId: 'dbt',      label: 'dbt',             scoreKey: 'msl_score:dbt' },
      { tabId: 'modeling', label: 'Data Modeling',   scoreKey: 'msl_score:modeling' },
      { tabId: 'mlcoding', label: 'ML Coding',       scoreKey: 'msl_score:mlcoding' },
    ],
  },
  {
    id: 'quick_cal',
    label: 'Quick Calibration',
    desc: 'Two hours. Covers your weakest areas — classical ML, hyperparam judgment, and timed MCQs.',
    steps: [
      { tabId: 'classical',  label: 'Classical ML',   scoreKey: 'msl_score:classical' },
      { tabId: 'features',   label: 'Feature Eng',    scoreKey: 'msl_score:features' },
      { tabId: 'eval',       label: 'Model Eval',     scoreKey: 'msl_score:eval' },
      { tabId: 'trainer',    label: 'Trainer',        scoreKey: 'msl_score:trainer' },
      { tabId: 'combinator', label: 'Combinator Exam',scoreKey: 'msl_score:combinator' },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
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

function readAndUpdateStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const last  = localStorage.getItem('msl_last_visit')
    let streak  = parseInt(localStorage.getItem('msl_streak') || '0', 10)
    if (last === today) return streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    streak = last === yesterday ? streak + 1 : 1
    localStorage.setItem('msl_streak', String(streak))
    localStorage.setItem('msl_last_visit', today)
    localStorage.setItem(`msl_activity_${today}`, '1')
    return streak
  } catch { return 0 }
}

function readActivity() {
  const data = {}
  for (let i = 0; i < 91; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    const v = localStorage.getItem(`msl_activity_${d}`)
    if (v) data[d] = 1
  }
  return data
}

function readChallengeStats() {
  let totalWrong = 0
  const gapTabs = []
  const allTabs = Object.values(SECTION_TABS).flat()
  allTabs.forEach(tabId => {
    try {
      const raw = localStorage.getItem(`msl_score:${tabId}`)
      if (raw) {
        const p = JSON.parse(raw)
        totalWrong += Math.max(0, (p.attempted || 0) - (p.correct || 0))
      } else {
        gapTabs.push(tabId)
      }
    } catch {}
  })
  return { totalWrong, gapTabs, total: allTabs.length }
}

function buildSimPrompt(sectionProgress) {
  const lines = ['=== ML Systems Lab — Interview Sim Context ===', '']
  lines.push('SCORE SUMMARY')
  Object.entries(sectionProgress).forEach(([section, prog]) => {
    if (prog.total > 0) {
      const pct = prog.pct
      const flag = pct === 0 ? '⬛ not started' : pct < 40 ? '🔴 weak' : pct < 70 ? '🟡 partial' : '🟢 strong'
      lines.push(`  ${section.padEnd(14)} ${String(prog.attempted).padStart(3)}/${prog.total}  ${pct}%  ${flag}`)
    }
  })
  lines.push('')
  const weak = Object.entries(sectionProgress).filter(([, p]) => p.total > 0 && p.pct < 50).map(([s]) => s)
  if (weak.length) lines.push(`WEAK AREAS: ${weak.join(', ')}`)
  const lastTab = (() => { try { return localStorage.getItem('msl_tab') } catch { return null } })()
  if (lastTab) lines.push(`LAST ACTIVE: ${lastTab}`)
  lines.push('')
  lines.push('INSTRUCTIONS FOR TRAINER')
  lines.push('Use this context to run a mock ML interview. Start with weak areas. Ask one question at a time.')
  lines.push('After each answer, give brief feedback then move to the next question. Focus on production judgment.')
  return lines.join('\n')
}

function readBookmarks() {
  try { return JSON.parse(localStorage.getItem('msl_bookmarks') || '[]') }
  catch { return [] }
}

function stepDone(step) {
  if (step.checkFn) return step.checkFn()
  if (!step.scoreKey) return false
  try {
    const raw = localStorage.getItem(step.scoreKey)
    if (!raw) return false
    const p = JSON.parse(raw)
    return (p.attempted || 0) > 0 || (p.correct || 0) > 0
  } catch { return false }
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function HomeTab({ onNavigate }) {
  const [sectionProgress, setSectionProgress] = useState(() => readSectionProgress())
  const [streak] = useState(() => readAndUpdateStreak())
  const [bookmarks] = useState(() => readBookmarks())
  const [activity] = useState(() => readActivity())
  const [challengeStats] = useState(() => readChallengeStats())
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

  // Strongest + not-started
  const rankedSections = SECTIONS
    .map(s => ({ ...s, pct: sectionProgress[s.id]?.pct || 0, total: sectionProgress[s.id]?.total || 0 }))
    .filter(s => s.total > 0)
  const strongest  = rankedSections.reduce((best, s) => (s.pct > (best?.pct || -1) ? s : best), null)
  const notStarted = rankedSections.find(s => s.pct === 0)

  return (
    <div style={{ maxWidth: '660px', margin: '0 auto', paddingBottom: '48px' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: '40px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--prime)' }}>ML Systems Lab</div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '999px', padding: '2px 8px' }}>
              {streak} day streak
            </div>
          )}
        </div>
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
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>{totalAttempted}/{totalScenarios} scenarios</span>
          </div>
        )}
      </div>

      {/* ── First-session directive (new users only) ─────────────────────── */}
      {totalAttempted === 0 && (
        <div style={{ marginBottom: '28px', padding: '14px 18px', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)', borderLeft: '3px solid var(--prime)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>New here?</div>
            <div style={{ fontSize: '13px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>Start with a 10-minute calibration — production judgment scenarios, no setup.</div>
          </div>
          <button onClick={() => onNavigate('classical')}
            style={{ flexShrink: 0, fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--prime)', background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.35)', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Start first session →
          </button>
        </div>
      )}

      {/* ── Recently added ────────────────────────────────────────────────── */}
      {totalAttempted > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '10px' }}>Recently added</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {RECENTLY_ADDED.slice(0, 3).map(item => (
              <button key={item.label} onClick={() => onNavigate(item.tab)}
                style={{ textAlign: 'left', padding: '10px 14px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', flexShrink: 0, minWidth: '68px' }}>{item.date.slice(5)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', marginBottom: '1px' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Progress callouts ─────────────────────────────────────────────── */}
      {(strongest || notStarted) && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {strongest && strongest.pct > 0 && (
            <button onClick={() => onNavigate(strongest.defaultTab)} style={{ flex: 1, minWidth: '180px', textAlign: 'left', padding: '10px 14px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', cursor: 'pointer' }}>
              <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Strongest area</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{strongest.label} · {strongest.pct}%</div>
            </button>
          )}
          {notStarted && (
            <button onClick={() => onNavigate(notStarted.defaultTab)} style={{ flex: 1, minWidth: '180px', textAlign: 'left', padding: '10px 14px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: '8px', cursor: 'pointer' }}>
              <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--rose)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Not started</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{notStarted.label} →</div>
            </button>
          )}
        </div>
      )}

      {/* ── Entry paths ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '12px' }}>Where to start</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ENTRY_PATHS.map(path => <EntryCard key={path.tab} path={path} onNavigate={onNavigate} />)}
        </div>
      </div>

      {/* ── Guided paths ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '12px' }}>Guided paths</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {GUIDED_PATHS.map(path => <PathCard key={path.id} path={path} onNavigate={onNavigate} />)}
        </div>
      </div>

      {/* ── Section overview ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '12px' }}>Sections</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {SECTIONS.map(section => (
            <SectionRow key={section.id} section={section} prog={sectionProgress[section.id] || { pct: 0, attempted: 0, total: 0 }} onNavigate={onNavigate} />
          ))}
        </div>
      </div>

      {/* ── Activity heatmap ─────────────────────────────────────────────── */}
      {Object.keys(activity).length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '10px' }}>91-day activity</div>
          <ActivityHeatmap activity={activity} />
        </div>
      )}

      {/* ── Challenge log ─────────────────────────────────────────────────── */}
      {totalAttempted > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '10px' }}>Challenge log</div>
          <ChallengeLog stats={challengeStats} onNavigate={onNavigate} />
        </div>
      )}

      {/* ── Interview Sim export ──────────────────────────────────────────── */}
      {totalAttempted > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <InterviewSimExport sectionProgress={sectionProgress} />
        </div>
      )}

      {/* ── Bookmarks ─────────────────────────────────────────────────────── */}
      {bookmarks.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '10px' }}>Bookmarks</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {bookmarks.map(bm => (
              <button key={bm.id || bm} onClick={() => onNavigate(bm.tabId || bm)}
                style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                {bm.label || bm.tabId || bm} →
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Continue ─────────────────────────────────────────────────────── */}
      {lastTab && lastTab !== 'home' && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '10px' }}>Continue</div>
          <ResumeBtn lastTab={lastTab} onNavigate={onNavigate} />
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>
          {totalAttempted > 0 ? `${totalAttempted} scenarios attempted` : 'No progress yet — pick a path above.'}
        </span>
        <button onClick={downloadProgressJSON}
          style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-low)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-ghost)'}>
          ↓ export progress
        </button>
      </div>

    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function EntryCard({ path, onNavigate }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={() => onNavigate(path.tab)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ textAlign: 'left', padding: '14px 16px', background: hov ? 'var(--card-tint)' : 'var(--surface)', border: `1px solid ${hov ? 'var(--rim-hi)' : 'var(--rim)'}`, borderRadius: '10px', cursor: 'pointer', width: '100%', transition: 'border-color var(--t), background var(--t)' }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '4px' }}>{path.label}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, marginBottom: '8px' }}>{path.desc}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--prime)', fontWeight: 600 }}>{path.cta}</div>
    </button>
  )
}

function PathCard({ path, onNavigate }) {
  const [hov, setHov] = useState(false)
  const doneCount = path.steps.filter(stepDone).length
  const total     = path.steps.length
  const pct       = Math.round((doneCount / total) * 100)
  const nextStep  = path.steps.find(s => !stepDone(s))

  return (
    <div style={{ background: hov ? 'var(--card-tint)' : 'var(--surface)', border: `1px solid ${hov ? 'var(--rim-hi)' : 'var(--rim)'}`, borderRadius: '10px', padding: '14px 16px', transition: 'border-color var(--t), background var(--t)' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)', marginBottom: '3px' }}>{path.label}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.5 }}>{path.desc}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: doneCount === total ? 'var(--mint)' : 'var(--prime)', flexShrink: 0 }}>
          {doneCount}/{total}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {path.steps.map((step, i) => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: stepDone(step) ? 'var(--prime)' : 'var(--rim)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {path.steps.map((step, i) => {
          const done = stepDone(step)
          return (
            <button key={i} onClick={() => onNavigate(step.tabId)}
              style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: '5px', cursor: 'pointer', border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : step === nextStep ? 'rgba(240,165,0,0.4)' : 'var(--rim)'}`, background: done ? 'rgba(52,211,153,0.08)' : step === nextStep ? 'rgba(240,165,0,0.08)' : 'transparent', color: done ? 'var(--mint)' : step === nextStep ? 'var(--prime)' : 'var(--ink-ghost)', fontWeight: step === nextStep ? 700 : 400 }}>
              {step === nextStep && '→ '}{step.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SectionRow({ section, prog, onNavigate }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={() => onNavigate(section.defaultTab)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ textAlign: 'left', padding: '11px 14px', background: hov ? 'var(--card-tint)' : 'var(--surface)', border: `1px solid ${hov ? 'var(--rim-hi)' : 'var(--rim)'}`, borderRadius: '8px', cursor: 'pointer', width: '100%', transition: 'border-color var(--t), background var(--t)', display: 'flex', alignItems: 'center', gap: '12px' }}>
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

function ActivityHeatmap({ activity }) {
  const days = []
  for (let i = 90; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    days.push({ date: d, active: !!activity[d] })
  }
  const weeks = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {week.map(day => (
            <div key={day.date} title={day.date}
              style={{ width: '10px', height: '10px', borderRadius: '2px', background: day.active ? 'var(--prime)' : 'var(--rim)', opacity: day.active ? 1 : 0.5, transition: 'background 0.2s' }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ChallengeLog({ stats, onNavigate }) {
  const { totalWrong, gapTabs, total } = stats
  const covered = total - gapTabs.length
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '140px', padding: '10px 14px', background: totalWrong > 0 ? 'rgba(244,63,94,0.06)' : 'rgba(52,211,153,0.06)', border: `1px solid ${totalWrong > 0 ? 'rgba(244,63,94,0.18)' : 'rgba(52,211,153,0.18)'}`, borderRadius: '8px' }}>
        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: totalWrong > 0 ? 'var(--rose)' : 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Wrong answers</div>
        <div style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--ink-hi)' }}>{totalWrong}</div>
      </div>
      <div style={{ flex: 1, minWidth: '140px', padding: '10px 14px', background: gapTabs.length > 0 ? 'rgba(240,165,0,0.05)' : 'rgba(52,211,153,0.06)', border: `1px solid ${gapTabs.length > 0 ? 'rgba(240,165,0,0.2)' : 'rgba(52,211,153,0.18)'}`, borderRadius: '8px' }}>
        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: gapTabs.length > 0 ? 'var(--prime)' : 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>Tab coverage</div>
        <div style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--ink-hi)' }}>{covered}<span style={{ fontSize: '12px', color: 'var(--ink-ghost)', fontWeight: 400 }}>/{total}</span></div>
      </div>
      {gapTabs.length > 0 && (
        <div style={{ width: '100%', padding: '10px 14px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
          <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Not started ({gapTabs.length})</div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {gapTabs.map(t => (
              <button key={t} onClick={() => onNavigate(t)}
                style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', background: 'transparent', border: '1px solid var(--rim)', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InterviewSimExport({ sectionProgress }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const prompt = open ? buildSimPrompt(sectionProgress) : ''
  function copy() {
    try { navigator.clipboard.writeText(prompt) } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: open ? 'rgba(240,165,0,0.1)' : 'var(--depth)', border: `1px solid ${open ? 'rgba(240,165,0,0.35)' : 'var(--rim)'}`, borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
        <span style={{ fontSize: '13px', color: 'var(--prime)' }}>⬡</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)', flex: 1, textAlign: 'left' }}>Start Interview Sim</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)' }}>generates trainer prompt {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ marginTop: '8px', position: 'relative' }}>
          <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-mid)', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '8px', padding: '14px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7, maxHeight: '240px', overflowY: 'auto' }}>{prompt}</pre>
          <button onClick={copy}
            style={{ position: 'absolute', top: '8px', right: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: copied ? 'var(--mint)' : 'var(--prime)', background: 'var(--surface)', border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(240,165,0,0.3)'}`, borderRadius: '5px', padding: '3px 10px', cursor: 'pointer' }}>
            {copied ? '✓ copied' : 'copy'}
          </button>
        </div>
      )}
    </div>
  )
}

function ResumeBtn({ lastTab, onNavigate }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={() => onNavigate(lastTab)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: hov ? 'var(--card-tint)' : 'var(--surface)', border: `1px solid ${hov ? 'var(--rim-hi)' : 'var(--rim)'}`, borderRadius: '8px', cursor: 'pointer', width: '100%', transition: 'border-color var(--t), background var(--t)' }}>
      <span style={{ fontSize: '16px', lineHeight: 1 }}>↩</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-mid)' }}>
        Resume <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--prime)', fontSize: '12px' }}>{lastTab}</span>
      </span>
    </button>
  )
}
