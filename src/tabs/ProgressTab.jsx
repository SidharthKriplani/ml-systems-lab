import { useState, useEffect } from 'react'
import { computeReadiness, readinessLabel, readinessColor } from '../utils/readiness.js'
import ReadinessWidget from '../components/shared/ReadinessWidget.jsx'
import DailyDrill from '../components/DailyDrill.jsx'

// ── Constants ────────────────────────────────────────────────────────────────

const TRACK_MODULES = {
  spark:     ['shuffle', 'skew', 'partition'],
  features:  ['skew_sim', 'feature_store'],
  eval:      ['metric', 'ab_test', 'shadow'],
  models:    ['pca', 'svd', 'pipeline', 'regularization', 'numpy', 'calibration'],
  design:    ['incident_room', 'canvas', 'two_tower'],
  monitor:   ['drift_dash', 'psi_lab'],
  interview: ['system_design', 'features', 'eval', 'spark', 'coding'],
  gradient:  ['post1','post2','post3','post4','post5','post6','post7','post8','post9','post10','post11','post12','post13'],
}

const FOUNDATION_STORES = [
  { lsKey: 'msl-math-stats-foundation-v1',       tabId: 'math_stats_foundation',        label: 'Math & Stats Foundations',       total: 18 },
  { lsKey: 'msl-classical-ml-foundation-v1',     tabId: 'classical_ml_foundation',      label: 'Classical ML Foundations',       total: 14 },
  { lsKey: 'msl-probabilistic-ml-foundation-v1', tabId: 'probabilistic_ml_foundation',  label: 'Probabilistic ML Foundations',   total:  9 },
  { lsKey: 'msl-eval-foundation-v1',             tabId: 'eval_foundation',              label: 'Eval Foundations',               total: 10 },
  { lsKey: 'msl-unsupervised-foundation-v1',     tabId: 'unsupervised_foundation',      label: 'Unsupervised Foundations',       total: 10 },
  { lsKey: 'msl-causal-foundation-v1',           tabId: 'causal_foundation',            label: 'Causal Foundations',             total: 10 },
  { lsKey: 'msl-dl-foundation-v1',               tabId: 'dl_foundation',                label: 'Deep Learning Foundations',      total: 14 },
  { lsKey: 'msl-self-supervised-foundation-v1',  tabId: 'self_supervised_foundation',   label: 'Self-supervised Foundations',    total:  9 },
  { lsKey: 'msl-rl-foundation-v1',               tabId: 'rl_foundation',                label: 'RL Foundations',                 total: 10 },
  { lsKey: 'msl-production-foundation-v1',       tabId: 'production_foundation',        label: 'Production Foundations',         total: 11 },
  { lsKey: 'msl-monitoring-foundation-v1',       tabId: 'monitoring_foundation',        label: 'Monitoring Foundations',         total:  8 },
  { lsKey: 'msl-system-design-foundation-v1',    tabId: 'system_design_foundation',     label: 'System Design Foundations',      total:  8 },
  { lsKey: 'msl-recsys-foundation-v1',           tabId: 'recsys_foundation',            label: 'Recommender Systems Foundations', total:  8 },
  { lsKey: 'msl-pricing-foundation-v1',          tabId: 'pricing_foundation',           label: 'Pricing Analytics Foundations',  total:  7 },
  { lsKey: 'msl-time-series-foundation-v1',      tabId: 'time_series_foundation',       label: 'Time Series Foundations',        total:  9 },
  { lsKey: 'msl-graph-ml-foundation-v1',         tabId: 'graph_ml_foundation',          label: 'Graph ML Foundations',           total:  9 },
  { lsKey: 'msl-bandits-foundation-v1',          tabId: 'bandits_foundation',           label: 'Bandits & Exploration Foundations', total:  9 },
  { lsKey: 'msl-optimization-foundation-v1',     tabId: 'optimization_foundation',      label: 'Optimization Foundations',          total: 12 },
  { lsKey: 'msl-data-foundation-v1',             tabId: 'data_foundation',              label: 'Data Foundations',                  total: 11 },
]

const PRACTICE_ROOMS = [
  { tabId: 'models',    keys: TRACK_MODULES.models,    label: 'Math Foundations' },
  { tabId: 'features',  keys: TRACK_MODULES.features,  label: 'Feature Eng' },
  { tabId: 'eval',      keys: TRACK_MODULES.eval,       label: 'Model Eval' },
  { tabId: 'design',    keys: TRACK_MODULES.design,     label: 'System Design' },
  { tabId: 'spark',     keys: TRACK_MODULES.spark,      label: 'Spark Lab' },
  { tabId: 'monitor',   keys: TRACK_MODULES.monitor,    label: 'Monitoring' },
  { tabId: 'interview', keys: TRACK_MODULES.interview,  label: 'Interview Q&A' },
  { tabId: 'gradient',  keys: TRACK_MODULES.gradient,   label: 'Gradient Reading' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function countTabProgress(tabId, moduleKeys) {
  let done = 0
  for (const k of moduleKeys) {
    if (localStorage.getItem(`msl_done_${tabId}_${k}`) === '1') done++
  }
  return { done, total: moduleKeys.length }
}

function getFoundationDone(lsKey) {
  try {
    const data = JSON.parse(localStorage.getItem(lsKey) || '{}')
    return Object.values(data).filter(v => v?.completedAt).length
  } catch { return 0 }
}

function fmtDate(isoStr) {
  try {
    return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ icon, title, open, onToggle, badge, children }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderRadius: '12px',
      marginBottom: '1rem',
      overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: '0.875rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{title}</span>
          {badge != null && (
            <span style={{
              fontSize: '0.68rem', fontWeight: 700,
              background: 'var(--prime-faint)', color: 'var(--prime)',
              border: '1px solid rgba(232,160,48,0.25)',
              borderRadius: '10px', padding: '0.1rem 0.45rem',
            }}>{badge}</span>
          )}
        </div>
        <span style={{
          fontSize: '0.75rem', color: 'var(--ink-ghost)',
          transition: 'transform 0.15s', display: 'inline-block',
          transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}>▼</span>
      </div>
      {open && (
        <div style={{ padding: '0 1.25rem 1.25rem' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function RoomBar({ label, done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>{label}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>{done}/{total}</span>
      </div>
      <div style={{ height: '5px', background: 'var(--rim)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'var(--prime)',
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ProgressTab({ user, onNavigate }) {
  const [tick, setTick] = useState(0)
  const [overviewOpen,    setOverviewOpen]    = useState(true)
  const [studyPlanOpen,   setStudyPlanOpen]   = useState(true)
  const [challengeLogOpen,setChallengeLogOpen] = useState(true)
  const [settingsOpen,    setSettingsOpen]    = useState(false)
  const [resetStage,      setResetStage]      = useState(0) // 0=idle,1=confirm1,2=confirm2

  // Re-render when progress changes
  useEffect(() => {
    const handler = () => setTick(t => t + 1)
    window.addEventListener('msl_progress', handler)
    return () => window.removeEventListener('msl_progress', handler)
  }, [])

  // ── Gather all progress ────────────────────────────────────────────────────

  const practiceRooms = PRACTICE_ROOMS.map(r => ({
    ...r,
    ...countTabProgress(r.tabId, r.keys),
  }))

  const foundationRooms = FOUNDATION_STORES.map(f => ({
    ...f,
    done: getFoundationDone(f.lsKey),
  }))

  const totalPracticeDone  = practiceRooms.reduce((s, r) => s + r.done, 0)
  const totalPracticeTotal = practiceRooms.reduce((s, r) => s + r.total, 0)
  const totalFoundDone     = foundationRooms.reduce((s, r) => s + r.done, 0)
  const totalFoundTotal    = foundationRooms.reduce((s, r) => s + r.total, 0)
  const grandDone          = totalPracticeDone + totalFoundDone
  const grandTotal         = totalPracticeTotal + totalFoundTotal

  // ── Readiness ──────────────────────────────────────────────────────────────

  const readiness = computeReadiness()
  const rLabel    = readinessLabel(readiness.level)
  const rColor    = readinessColor(readiness.level)

  const readinessDesc = {
    'novice':          'Keep going — every module builds the foundation.',
    'building':        'Good momentum. Focus on foundation modules to solidify core concepts.',
    'competent':       'Solid foundation. Add practice scenarios to sharpen applied skills.',
    'strong':          'Strong across the board. Target system design and interview Q&A.',
    'interview-ready': 'Consistently strong. You are prepared for ML engineer interviews.',
  }[readiness.level] || ''

  // ── Heatmap ───────────────────────────────────────────────────────────────

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const heatmapDays = []
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    heatmapDays.push(d.toISOString().slice(0, 10))
  }

  const activeSet = new Set(
    heatmapDays.filter(d => !!localStorage.getItem(`msl_activity_${d}`))
  )

  // Streak: consecutive days ending today
  let streak = 0
  for (let i = 0; i < 364; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    if (activeSet.has(ds)) streak++
    else break
  }

  // ── Study Plan ────────────────────────────────────────────────────────────

  const studyItems = (() => {
    const items = []

    // Foundations: started but not complete
    for (const f of foundationRooms) {
      if (f.done > 0 && f.done < f.total) {
        items.push({ type: 'continue', label: f.label, done: f.done, total: f.total, nav: f.tabId })
      }
    }
    // Practice rooms: started but not complete
    for (const r of practiceRooms) {
      if (r.done > 0 && r.done < r.total) {
        items.push({ type: 'continue', label: r.label, done: r.done, total: r.total, nav: r.tabId })
      }
    }

    const continueItems = items.slice(0, 5)
    const remaining = 5 - continueItems.length

    // Not started yet (foundations first)
    if (remaining > 0) {
      for (const f of foundationRooms) {
        if (continueItems.length >= 5) break
        if (f.done === 0) {
          continueItems.push({ type: 'start', label: f.label, done: 0, total: f.total, nav: f.tabId })
        }
      }
      for (const r of practiceRooms) {
        if (continueItems.length >= 5) break
        if (r.done === 0) {
          continueItems.push({ type: 'start', label: r.label, done: 0, total: r.total, nav: r.tabId })
        }
      }
    }

    return continueItems.slice(0, 5)
  })()

  // ── Challenge Log ─────────────────────────────────────────────────────────

  const recentLog = (() => {
    const entries = []

    // Foundation completions (have timestamps)
    for (const f of FOUNDATION_STORES) {
      try {
        const data = JSON.parse(localStorage.getItem(f.lsKey) || '{}')
        for (const [id, val] of Object.entries(data)) {
          if (val?.completedAt) {
            entries.push({ ts: val.completedAt, room: f.label, id })
          }
        }
      } catch {}
    }

    // Practice completions — use mastery keys (they give a signal of when it was set)
    // since msl_done_ keys have no timestamps, scan msl_mastery_ for dated info
    // We enumerate all known done keys and use today as fallback if no mastery date
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k || !k.startsWith('msl_mastery_')) continue
        // key format: msl_mastery_<tabId>_<moduleKey>
        const rest = k.slice('msl_mastery_'.length)
        const firstUnderscore = rest.indexOf('_')
        if (firstUnderscore === -1) continue
        const tabId = rest.slice(0, firstUnderscore)
        const moduleKey = rest.slice(firstUnderscore + 1)
        const roomLabel = PRACTICE_ROOMS.find(r => r.tabId === tabId)?.label || tabId
        // Use today's date as best estimate — mastery keys lack timestamps
        entries.push({ ts: new Date().toISOString(), room: roomLabel, id: moduleKey, approx: true })
      }
    } catch {}

    // Sort by ts desc, deduplicate by room+id, take 10
    const seen = new Set()
    return entries
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
      .filter(e => {
        const key = `${e.room}:${e.id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 10)
  })()

  // ── Reset ─────────────────────────────────────────────────────────────────

  function handleReset() {
    if (resetStage === 0) { setResetStage(1); return }
    if (resetStage === 1) { setResetStage(2); return }

    // Stage 2: actually clear
    const toRemove = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (!k) continue
        if (
          k.startsWith('msl_done_') ||
          k.startsWith('msl_mastery_') ||
          k.startsWith('msl_activity_') ||
          k.startsWith('msl_score:')
        ) toRemove.push(k)
      }
    } catch {}

    for (const f of FOUNDATION_STORES) toRemove.push(f.lsKey)

    for (const k of toRemove) {
      try { localStorage.removeItem(k) } catch {}
    }

    setResetStage(0)
    setTick(t => t + 1)
    window.dispatchEvent(new CustomEvent('msl_progress'))
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (grandDone === 0) {
    return (
      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center', fontFamily: 'var(--font-sans)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
          Progress
        </h1>
        <p style={{ color: 'var(--ink-low)', fontSize: '0.925rem', lineHeight: 1.6, margin: '0 0 0.25rem 0' }}>
          MSL builds your ML engineering judgment through structured study and practice.
        </p>
        <p style={{ color: 'var(--ink-low)', fontSize: '0.925rem', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
          Complete modules to track your readiness here.
        </p>
        <div
          onClick={() => onNavigate && onNavigate('math_stats_foundation')}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--rim)',
            borderRadius: '14px',
            padding: '2rem 1.5rem',
            cursor: 'pointer',
            textAlign: 'left',
            maxWidth: '440px',
            margin: '0 auto',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--rim-hi)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--rim)'}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Start Here
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '0.5rem' }}>
            Math &amp; Stats Foundations
          </div>
          <p style={{ color: 'var(--ink-low)', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
            The mathematical bedrock behind every ML model — probability, linear algebra, statistics, and optimization.
          </p>
          <span style={{
            display: 'inline-block',
            background: 'var(--prime)',
            color: '#111',
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
          }}>
            Start Learning &rarr;
          </span>
        </div>
      </div>
    )
  }

  // ── Full render ───────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.025em', marginBottom: '0.4rem', margin: '0 0 0.4rem 0' }}>
          Progress
        </h1>
        <p style={{ color: 'var(--ink-ghost)', fontSize: '0.875rem', margin: 0 }}>
          {grandDone} of {grandTotal} modules completed across all rooms
        </p>
      </div>

      {/* Daily Drill — Progress is the signed-in landing tab (home redirects here),
          so the daily loop must live HERE to be seen. HomeTab keeps its copy for
          signed-out visitors; the card is idempotent (same storage key). */}
      <div style={{ marginBottom: '1rem' }}><DailyDrill onTrain={() => onNavigate && onNavigate('judge_browser')} /></div>

      {/* Readiness widget — score + target-interview countdown + weakest-area CTA */}
      <ReadinessWidget onNavigate={onNavigate} />

      {/* Summary bar */}
      <div style={{
        background: 'var(--prime)',
        borderRadius: '10px',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        gap: '2rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ color: '#111', fontWeight: 700, fontSize: '0.85rem' }}>{grandDone} completed</span>
        <span style={{ color: '#111', fontWeight: 700, fontSize: '0.85rem' }}>Level: {rLabel}</span>
        <span style={{ color: '#111', fontWeight: 700, fontSize: '0.85rem' }}>{streak > 0 ? `${streak} day streak` : 'No streak yet'}</span>
        <span style={{ color: '#111', fontWeight: 700, fontSize: '0.85rem' }}>Readiness: {readiness.score}%</span>
      </div>

      {/* SECTION: Overview */}
      <SectionCard
        icon="~"
        title="Overview"
        open={overviewOpen}
        onToggle={() => setOverviewOpen(o => !o)}
      >
        {/* Readiness widget */}
        <div style={{
          border: `1px solid var(--rim-hi)`,
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          background: 'var(--prime-faint)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: rColor, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {readiness.score}
            </div>
            <div>
              <div style={{
                display: 'inline-block',
                fontSize: '0.7rem', fontWeight: 700,
                color: rColor,
                background: 'var(--depth)',
                border: `1px solid ${rColor}`,
                borderRadius: '6px', padding: '0.2rem 0.5rem',
                marginBottom: '0.3rem',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{rLabel}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-low)', lineHeight: 1.4 }}>{readinessDesc}</div>
            </div>
          </div>
          <div style={{ height: '6px', background: 'var(--rim)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${readiness.score}%`,
              background: rColor,
              borderRadius: '4px',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--ink-ghost)' }}>Path {readiness.breakdown.path}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--ink-ghost)' }}>Practice {readiness.breakdown.practice}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--ink-ghost)' }}>Activity {readiness.breakdown.activity}%</span>
          </div>
        </div>

        {/* Heatmap — canonical section 2 (after readiness, before completion by area) */}
        <div style={{
          border: '1px solid var(--rim)',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem' }}>
            <div style={{
              fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.09em', color: 'var(--ink-ghost)',
            }}>Activity Heatmap</div>
            {streak > 0 ? (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700,
                background: 'var(--prime-faint)', color: 'var(--prime)',
                border: '1px solid rgba(232,160,48,0.25)',
                borderRadius: '10px', padding: '0.1rem 0.5rem',
              }}>{streak} day{streak !== 1 ? 's' : ''} streak</span>
            ) : (
              <span style={{ fontSize: '0.68rem', color: 'var(--ink-ghost)' }}>Practice today to start a streak</span>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(52, 10px)',
              gridTemplateRows: 'repeat(7, 10px)',
              gridAutoFlow: 'column',
              gap: '2px',
              width: 'max-content',
            }}>
              {heatmapDays.map(day => (
                <div
                  key={day}
                  title={day}
                  style={{
                    width: '10px', height: '10px', borderRadius: '2px',
                    background: activeSet.has(day) ? 'var(--prime)' : 'var(--rim)',
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: 'var(--ink-ghost)' }}>
            Last 52 weeks
          </div>
        </div>

        {/* Room progress bars — Practice */}
        <div style={{
          border: '1px solid var(--rim)',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.09em', color: 'var(--ink-ghost)', marginBottom: '1rem',
          }}>Practice Rooms</div>
          {practiceRooms.map(r => (
            <RoomBar key={r.tabId} label={r.label} done={r.done} total={r.total} />
          ))}
        </div>

        {/* Room progress bars — Foundations */}
        <div style={{
          border: '1px solid var(--rim)',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.09em', color: 'var(--ink-ghost)', marginBottom: '1rem',
          }}>Foundation Rooms</div>
          {foundationRooms.map(f => (
            <RoomBar key={f.lsKey} label={f.label} done={f.done} total={f.total} />
          ))}
        </div>
      </SectionCard>

      {/* SECTION: Study Plan */}
      <SectionCard
        icon="--"
        title="Study Plan"
        open={studyPlanOpen}
        onToggle={() => setStudyPlanOpen(o => !o)}
        badge={studyItems.length > 0 ? studyItems.length : undefined}
      >
        {studyItems.length === 0 ? (
          <div style={{
            background: 'var(--prime-faint)',
            border: '1px solid rgba(232,160,48,0.2)',
            borderRadius: '8px',
            padding: '1rem 1.25rem',
            color: 'var(--prime)',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}>
            All rooms complete. Excellent work.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {studyItems.map((item, idx) => (
              <div
                key={`${item.nav}-${idx}`}
                style={{
                  border: '1px solid var(--rim)',
                  borderLeft: `4px solid ${item.type === 'continue' ? 'var(--prime)' : 'var(--rim-hi)'}`,
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  background: 'var(--depth)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '0.2rem' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-ghost)' }}>
                    {item.type === 'continue'
                      ? `${item.done} of ${item.total} done — continue`
                      : `0 of ${item.total} done — not started`}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate && onNavigate(item.nav)}
                  style={{
                    background: item.type === 'continue' ? 'var(--prime)' : 'var(--surface)',
                    color: item.type === 'continue' ? '#111' : 'var(--ink-mid)',
                    border: item.type === 'continue' ? 'none' : '1px solid var(--rim)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.8rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {item.type === 'continue' ? 'Continue →' : 'Start →'}
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* SECTION: Challenge Log */}
      <SectionCard
        icon="*"
        title="Challenge Log"
        open={challengeLogOpen}
        onToggle={() => setChallengeLogOpen(o => !o)}
        badge={recentLog.length > 0 ? recentLog.length : undefined}
      >
        {recentLog.length === 0 ? (
          <div style={{ color: 'var(--ink-ghost)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
            No completions yet. Finish modules to see them here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {recentLog.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0',
                  borderBottom: idx < recentLog.length - 1 ? '1px solid var(--rim)' : 'none',
                }}
              >
                <span style={{
                  fontSize: '0.7rem',
                  color: 'var(--ink-ghost)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'nowrap',
                  minWidth: '60px',
                }}>
                  {entry.approx ? 'recently' : fmtDate(entry.ts)}
                </span>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  color: 'var(--prime)',
                  background: 'var(--prime-faint)',
                  border: '1px solid rgba(232,160,48,0.2)',
                  borderRadius: '4px',
                  padding: '0.1rem 0.4rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>{entry.room}</span>
                <span style={{
                  fontSize: '0.82rem',
                  color: 'var(--ink-mid)',
                  fontFamily: 'var(--font-mono)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{entry.id}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* SECTION: Settings */}
      <SectionCard
        icon="o"
        title="Settings"
        open={settingsOpen}
        onToggle={() => setSettingsOpen(o => !o)}
      >
        <div style={{ paddingTop: '0.25rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-low)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Reset clears all practice completions, mastery marks, activity dates, scores, and foundation progress. This cannot be undone.
          </div>

          {resetStage === 0 && (
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: '1px solid var(--rose)',
                borderRadius: '6px',
                padding: '0.45rem 1rem',
                color: 'var(--rose)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Reset all progress
            </button>
          )}

          {resetStage === 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--ink-low)' }}>Are you sure? All progress will be deleted.</span>
              <button
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: '1px solid var(--rose)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.8rem',
                  color: 'var(--rose)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Yes, I am sure
              </button>
              <button
                onClick={() => setResetStage(0)}
                style={{
                  background: 'none',
                  border: '1px solid var(--rim)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.8rem',
                  color: 'var(--ink-ghost)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {resetStage === 2 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--rose)', fontWeight: 700 }}>Final confirmation — this is irreversible.</span>
              <button
                onClick={handleReset}
                style={{
                  background: 'var(--rose)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.8rem',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Delete everything
              </button>
              <button
                onClick={() => setResetStage(0)}
                style={{
                  background: 'none',
                  border: '1px solid var(--rim)',
                  borderRadius: '6px',
                  padding: '0.35rem 0.8rem',
                  color: 'var(--ink-ghost)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </SectionCard>

    </div>
  )
}
