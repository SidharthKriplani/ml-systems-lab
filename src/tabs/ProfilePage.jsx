// src/tabs/ProfilePage.jsx — MSL profile. Standardized 5-CARD layout (cross-lab parity).
// The 5 canonical cards (same set + order in every lab), each filled with MSL's OWN data:
//   1. Readiness score          — computeReadiness() (readiness.js, capped-breadth model)
//   2. Company target + countdown — msl-readiness-target {company,date} + COMPANIES list
//   3. Streak + activity        — msl_activity_<date> heatmap-derived streak + recent completions
//   4. Leaderboard / vs-average — leaderboard (Supabase) rank + vs-average of total_solved
//   5. Completion by area       — foundation + practice room completion (ProgressTab sources)
// Identity / practice stats / sync / study plan / settings are preserved alongside.
import { useState, useEffect } from 'react'
import { signOut } from '../utils/auth.js'
import { pushProgressToSupabase, pullProgressFromSupabase } from '../utils/syncProgress.js'
import { authEnabled, supabase } from '../utils/supabase.js'
import { downloadProgressJSON } from '../utils/export.js'
import { Icon } from '../components/Icon.jsx'
import { readFoundationsRead, overallCompletion } from '../data/foundationsPath.js'
import { computeReadiness, readinessLabel, readinessColor } from '../utils/readiness.js'
import { computeWeightedScore, fetchLeaderboard } from '../utils/leaderboard.js'
import { COMPANIES } from '../data/companyTracks.js'

// ── Completion-by-area sources (mirror ProgressTab) ──────────────────────────
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
  { lsKey: 'msl-math-stats-foundation-v1',       tabId: 'math_stats_foundation',       label: 'Math & Stats',       total: 18 },
  { lsKey: 'msl-classical-ml-foundation-v1',     tabId: 'classical_ml_foundation',     label: 'Classical ML',       total: 14 },
  { lsKey: 'msl-probabilistic-ml-foundation-v1', tabId: 'probabilistic_ml_foundation', label: 'Probabilistic ML',   total:  9 },
  { lsKey: 'msl-eval-foundation-v1',             tabId: 'eval_foundation',             label: 'Eval',               total: 10 },
  { lsKey: 'msl-unsupervised-foundation-v1',     tabId: 'unsupervised_foundation',     label: 'Unsupervised',       total: 10 },
  { lsKey: 'msl-causal-foundation-v1',           tabId: 'causal_foundation',           label: 'Causal',             total: 10 },
  { lsKey: 'msl-dl-foundation-v1',               tabId: 'dl_foundation',               label: 'Deep Learning',      total: 14 },
  { lsKey: 'msl-self-supervised-foundation-v1',  tabId: 'self_supervised_foundation',  label: 'Self-supervised',    total:  9 },
  { lsKey: 'msl-rl-foundation-v1',               tabId: 'rl_foundation',               label: 'RL',                 total: 10 },
  { lsKey: 'msl-production-foundation-v1',       tabId: 'production_foundation',       label: 'Production',         total: 11 },
  { lsKey: 'msl-monitoring-foundation-v1',       tabId: 'monitoring_foundation',       label: 'Monitoring',         total:  8 },
  { lsKey: 'msl-system-design-foundation-v1',    tabId: 'system_design_foundation',    label: 'System Design',      total:  8 },
  { lsKey: 'msl-recsys-foundation-v1',           tabId: 'recsys_foundation',           label: 'Recommender Systems',total:  8 },
  { lsKey: 'msl-pricing-foundation-v1',          tabId: 'pricing_foundation',          label: 'Pricing Analytics',  total:  7 },
  { lsKey: 'msl-time-series-foundation-v1',      tabId: 'time_series_foundation',      label: 'Time Series',        total:  9 },
  { lsKey: 'msl-graph-ml-foundation-v1',         tabId: 'graph_ml_foundation',         label: 'Graph ML',           total:  9 },
  { lsKey: 'msl-bandits-foundation-v1',          tabId: 'bandits_foundation',          label: 'Bandits',            total:  9 },
  { lsKey: 'msl-optimization-foundation-v1',     tabId: 'optimization_foundation',     label: 'Optimization',       total: 12 },
  { lsKey: 'msl-data-foundation-v1',             tabId: 'data_foundation',             label: 'Data',               total: 11 },
]

const PRACTICE_ROOMS = [
  { tabId: 'models',    keys: TRACK_MODULES.models,    label: 'Math Practice' },
  { tabId: 'features',  keys: TRACK_MODULES.features,  label: 'Feature Eng' },
  { tabId: 'eval',      keys: TRACK_MODULES.eval,      label: 'Model Eval' },
  { tabId: 'design',    keys: TRACK_MODULES.design,    label: 'System Design Drills' },
  { tabId: 'spark',     keys: TRACK_MODULES.spark,     label: 'Spark Lab' },
  { tabId: 'monitor',   keys: TRACK_MODULES.monitor,   label: 'Monitoring' },
  { tabId: 'interview', keys: TRACK_MODULES.interview, label: 'Interview Q&A' },
  { tabId: 'gradient',  keys: TRACK_MODULES.gradient,  label: 'Gradient Reading' },
]

function countTabProgress(tabId, moduleKeys) {
  let done = 0
  for (const k of moduleKeys) {
    if (localStorage.getItem(`msl_done_${tabId}_${k}`) === '1') done++
  }
  return done
}

function getFoundationDone(lsKey) {
  try {
    const data = JSON.parse(localStorage.getItem(lsKey) || '{}')
    return Object.values(data).filter(v => v?.completedAt).length
  } catch { return 0 }
}

// ── Company → domain map (for logos via Google favicon service) ──────────────
// Covers every entry in COMPANIES (companyTracks.js). Used by <CompanyLogo/>.
const COMPANY_DOMAINS = {
  'Google': 'google.com',
  'Meta': 'meta.com',
  'Amazon': 'amazon.com',
  'Microsoft': 'microsoft.com',
  'Netflix': 'netflix.com',
  'Uber': 'uber.com',
  'LinkedIn': 'linkedin.com',
  'Adobe': 'adobe.com',
  'Salesforce': 'salesforce.com',
  'Walmart Global Tech': 'walmart.com',
  'Flipkart': 'flipkart.com',
  'Swiggy': 'swiggy.com',
  'Zomato': 'zomato.com',
  'Myntra': 'myntra.com',
  'PhonePe': 'phonepe.com',
  'Razorpay': 'razorpay.com',
  'CRED': 'cred.club',
  'Meesho': 'meesho.com',
  'ShareChat': 'sharechat.com',
  'Ola': 'olacabs.com',
  'Paytm': 'paytm.com',
  'Dream11': 'dream11.com',
  'Sprinklr': 'sprinklr.com',
  'Atlassian': 'atlassian.com',
  'Navi': 'navi.com',
  'Groww': 'groww.in',
  'Pocket FM': 'pocketfm.com',
  'Nutanix': 'nutanix.com',
}

// Small company logo (Google favicon service + initial fallback). Amber theme.
function CompanyLogo({ company, size = 20 }) {
  const [failed, setFailed] = useState(false)
  const domain = COMPANY_DOMAINS[company] || null
  const initial = (String(company || '').trim()[0] || '?').toUpperCase()
  const radius = Math.max(3, Math.round(size * 0.22))
  if (!domain || failed) {
    return (
      <span aria-hidden="true"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontWeight: 800, width: size, height: size, borderRadius: radius,
          background: 'var(--surface)', border: '1px solid var(--rim)', color: 'var(--prime)',
          fontSize: Math.max(9, Math.round(size * 0.5)), lineHeight: 1 }}>
        {initial}
      </span>
    )
  }
  return (
    <img src={'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64'} alt={company}
      onError={() => setFailed(true)}
      style={{ flexShrink: 0, objectFit: 'contain', width: size, height: size, borderRadius: radius }} />
  )
}

// ── Company target (mirror ReadinessWidget) ──────────────────────────────────
const TARGET_KEY = 'msl-readiness-target'
function readTarget() {
  try {
    const raw = localStorage.getItem(TARGET_KEY)
    if (!raw) return { company: '', date: '' }
    const v = JSON.parse(raw)
    return { company: v.company || '', date: v.date || '' }
  } catch { return { company: '', date: '' } }
}
function writeTarget(next) {
  try {
    if (next && (next.company || next.date)) localStorage.setItem(TARGET_KEY, JSON.stringify(next))
    else localStorage.removeItem(TARGET_KEY)
  } catch { /* ignore */ }
}
function daysUntil(isoDate) {
  if (!isoDate) return null
  const target = new Date(isoDate + 'T00:00:00')
  if (isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

// ── Streak + activity (heatmap-derived, read-only) ───────────────────────────
function readStreakInfo() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Consecutive days ending today
    let streak = 0
    for (let i = 0; i < 364; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      if (localStorage.getItem(`msl_activity_${ds}`)) streak++
      else break
    }
    // Active days in last 28
    let activeDays = 0
    for (let i = 0; i < 28; i++) {
      const ds = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      if (localStorage.getItem(`msl_activity_${ds}`)) activeDays++
    }
    return { streak, activeDays }
  } catch { return { streak: 0, activeDays: 0 } }
}

// Recent completions across foundation stores (timestamped).
function readRecentCompletions() {
  const entries = []
  for (const f of FOUNDATION_STORES) {
    try {
      const data = JSON.parse(localStorage.getItem(f.lsKey) || '{}')
      for (const [id, val] of Object.entries(data)) {
        if (val?.completedAt) entries.push({ ts: val.completedAt, room: f.label, id })
      }
    } catch { /* skip */ }
  }
  return entries
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 6)
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  catch { return '' }
}

// ── Practice stats ────────────────────────────────────────────────────────────
function readAllScores() {
  const tabs = new Set()
  let total = 0, attempted = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith('msl_score:')) continue
      const val = localStorage.getItem(k)
      if (!val) continue
      const tabId = k.replace('msl_score:', '').split('_')[0]
      tabs.add(tabId)
      try {
        const arr = JSON.parse(val)
        if (Array.isArray(arr)) {
          total += arr.length
          attempted += arr.filter(x => x?.revealed || x?.completed).length
        }
      } catch {}
    }
  } catch {}
  return { tabCount: tabs.size, total, attempted }
}

// ── Primitives ────────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--depth)', border: '1px solid var(--rim)',
      borderRadius: '14px', padding: '24px 28px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardLabel({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '14px', fontWeight: 700 }}>
      {children}
    </div>
  )
}

function MetricTile({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface)', borderRadius: '10px', minWidth: '80px' }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 900, color: 'var(--prime)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

export default function ProfilePage({ user, onNavigate, onShowAuth }) {
  const [syncState, setSyncState] = useState('idle') // idle | syncing | done | error
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('msl_theme') || 'dark' } catch { return 'dark' } })
  const scores = readAllScores()
  const bookmarks = (() => { try { return JSON.parse(localStorage.getItem('msl_bookmarks') || '[]').length } catch { return 0 } })()

  // ── Card 2 — company target state ──
  const [target, setTarget] = useState(readTarget)
  function setTargetField(patch) {
    const next = { ...target, ...patch }
    setTarget(next)
    writeTarget(next)
  }

  // ── Card 4 — leaderboard rank + vs-average ──
  const [board, setBoard] = useState(null) // { rows, myScore } | null
  useEffect(() => {
    let cancelled = false
    if (!supabase || !user) return;
    (async () => {
      const rows = await fetchLeaderboard(200)
      if (cancelled) return
      setBoard({ rows: rows || [], myScore: computeWeightedScore() })
    })()
    return () => { cancelled = true }
  }, [user])

  // Signed-out state
  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 20px' }}>
        <Card>
          <CardLabel>Profile</CardLabel>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 20px' }}>
            Sign in to see your profile, sync progress across devices, and track your preparation over time.
          </p>
          {authEnabled ? (
            <button onClick={onShowAuth} className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: '13px' }}>
              Sign in →
            </button>
          ) : (
            <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>
              Auth not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel env vars.
            </p>
          )}
        </Card>
      </div>
    )
  }

  // Provider label + avatar
  const provider = user.app_metadata?.provider
  const providerLabel = provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'Email'
  const avatar = user.user_metadata?.avatar_url
  const name   = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name || ''
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user.email?.[0]?.toUpperCase() || 'U'

  async function handleSync() {
    setSyncState('syncing')
    const { error: pushErr } = await pushProgressToSupabase(user)
    const { error: pullErr } = await pullProgressFromSupabase(user)
    setSyncState(pushErr || pullErr ? 'error' : 'done')
    setTimeout(() => setSyncState('idle'), 3000)
  }

  async function handleSignOut() {
    await signOut()
    // onAuthStateChange in App.jsx will set user to null
  }

  function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('msl_theme', next) } catch {}
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        Object.entries(data).forEach(([k, v]) => {
          if (k.startsWith('msl_') || k.startsWith('msl-')) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
        })
        window.location.reload()
      } catch {}
    }
    reader.readAsText(file)
  }

  const activeGuidedPath = (() => {
    try { return JSON.parse(localStorage.getItem('msl_active_path') || 'null') } catch { return null }
  })()

  const foundationsProg = overallCompletion(readFoundationsRead())
  const foundationsPct = foundationsProg.total ? Math.round((foundationsProg.read / foundationsProg.total) * 100) : 0
  const foundationsComplete = foundationsProg.total > 0 && foundationsProg.read === foundationsProg.total

  function openFoundationsPath() {
    if (onNavigate) onNavigate('gradient')
    setTimeout(() => window.dispatchEvent(new CustomEvent('msl-open-foundations-path')), 50)
  }

  // ── Card 1 + weakest — readiness ──
  const readiness = computeReadiness()
  const rLabel = readinessLabel(readiness.level)
  const rColor = readinessColor(readiness.level)
  const WEAKEST_TAB = { foundations: 'gradient', practice: 'interview_questions' }
  const weakTab = readiness.weakest ? (WEAKEST_TAB[readiness.weakest.key] || 'gradient') : null

  // ── Card 2 derived ──
  const days = daysUntil(target.date)
  const companyLabel = target.company && target.company !== 'Other / Not listed' ? target.company : null
  let countdownText
  if (days == null)      countdownText = 'No target set'
  else if (days < 0)     countdownText = 'Interview date passed'
  else if (days === 0)   countdownText = 'Interview is today'
  else                   countdownText = days + ' day' + (days === 1 ? '' : 's') + ' to go'

  // ── Card 3 derived — streak + activity ──
  const { streak, activeDays } = readStreakInfo()
  const recentCompletions = readRecentCompletions()

  // ── Card 4 derived — rank + vs-average ──
  let rank = null, cohortSize = 0, avgScore = 0, myScore = 0
  if (board) {
    const rows = board.rows
    myScore = board.myScore
    cohortSize = rows.length
    if (rows.length) {
      avgScore = Math.round(rows.reduce((s, r) => s + (r.total_solved || 0), 0) / rows.length)
      const mine = rows.filter(r => r.user_id === user.id)
      if (mine.length) rank = rows.findIndex(r => r.user_id === user.id) + 1
      else rank = rows.filter(r => (r.total_solved || 0) > myScore).length + 1 // provisional if not yet synced
    }
  }

  // ── Card 5 derived — completion by area (rooms that have any progress) ──
  const areaRows = [
    ...FOUNDATION_STORES.map(f => {
      const done = getFoundationDone(f.lsKey)
      return { id: f.lsKey, label: f.label, done, total: f.total, pct: f.total ? Math.round((done / f.total) * 100) : 0 }
    }),
    ...PRACTICE_ROOMS.map(r => {
      const done = countTabProgress(r.tabId, r.keys)
      return { id: r.tabId, label: r.label, done, total: r.keys.length, pct: r.keys.length ? Math.round((done / r.keys.length) * 100) : 0 }
    }),
  ]
  const startedAreas = areaRows.filter(a => a.done > 0).sort((a, b) => b.pct - a.pct)

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px 80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <Card>
        <CardLabel>Account</CardLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          {avatar ? (
            <img src={avatar} alt={name} style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid var(--rim-hi)' }} />
          ) : (
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--prime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '18px', color: 'var(--depth)', flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <div>
            {name && <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '2px' }}>{name}</div>}
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-low)' }}>{user.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '4px', padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{providerLabel}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)' }}>since {new Date(user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid var(--rim)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', cursor: 'pointer' }}>
          Sign out
        </button>
      </Card>

      {/* ── Card 1 — Readiness score ─────────────────────────────────────── */}
      <Card>
        <CardLabel>Readiness score</CardLabel>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '10px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '36px', fontWeight: 900, letterSpacing: '-0.04em', color: rColor }}>
            {readiness.score}%
          </span>
          <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: rColor, fontWeight: 600 }}>
            {rLabel}
          </span>
        </div>
        <div style={{ width: '100%', height: '4px', background: 'var(--rim)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
          <div style={{ width: `${readiness.score}%`, height: '100%', background: rColor, transition: 'width 0.5s' }} />
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)' }}>
          <span title="MLE Path progress">Path {readiness.breakdown.path}%</span>
          <span title="Practice scenarios attempted">Practice {readiness.breakdown.practice}%</span>
          <span title="Active days in last 28">Activity {readiness.breakdown.activity}%</span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginTop: '10px', fontStyle: 'italic' }}>
          Capped-mean of Foundations coverage + practice attempted, so breadth — not grinding one area — moves the score.
        </div>
        {readiness.weakest && weakTab && (
          <button onClick={() => onNavigate && onNavigate(weakTab)}
            style={{ marginTop: '12px', background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--prime)', cursor: 'pointer' }}>
            Work next: {readiness.weakest.label} →
          </button>
        )}
      </Card>

      {/* ── Card 2 — Company target + countdown ──────────────────────────── */}
      <Card>
        <CardLabel>Company target</CardLabel>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 800, color: 'var(--ink-hi)' }}>
            {companyLabel && <CompanyLogo company={companyLabel} size={22} />}
            <span>{companyLabel || 'Set a target company'}</span>
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: days != null && days >= 0 ? 'var(--prime)' : 'var(--ink-ghost)', marginTop: '2px' }}>
            {countdownText}{days != null && days >= 0 && companyLabel ? ' · ' + companyLabel : ''}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '12px', alignItems: 'flex-end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-low)' }}>Target company</span>
            <select value={target.company} onChange={e => setTargetField({ company: e.target.value })}
              style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '7px', padding: '7px 9px', fontSize: '13px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>
              <option value="">No company set</option>
              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-low)' }}>Interview date</span>
            <input type="date" value={target.date} onChange={e => setTargetField({ date: e.target.value })}
              style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '7px', padding: '7px 9px', fontSize: '13px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }} />
          </label>
        </div>
        {(target.company || target.date) ? (
          <button onClick={() => setTargetField({ company: '', date: '' })}
            style={{ marginTop: '12px', background: 'none', border: 'none', padding: 0, fontSize: '11px', color: 'var(--ink-ghost)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Clear target
          </button>
        ) : (
          <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--ink-ghost)', lineHeight: 1.5 }}>
            Set a target company and interview date to turn prep into a countdown. MSL works best as a cram-to-a-date plan.
          </p>
        )}
      </Card>

      {/* ── Card 3 — Streak + activity ───────────────────────────────────── */}
      <Card>
        <CardLabel>Streak &amp; activity</CardLabel>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <MetricTile label="Day streak" value={streak} />
          <MetricTile label="Active days / 28" value={activeDays} />
          <MetricTile label="Attempted" value={scores.attempted} />
        </div>
        {recentCompletions.length > 0 ? (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Recent completions</div>
            <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--rim)' }}>
              {recentCompletions.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '9px 14px', background: 'var(--surface)', borderBottom: i < recentCompletions.length - 1 ? '1px solid var(--rim)' : 'none' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', minWidth: '52px' }}>{fmtDate(a.ts)}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--prime)', flexShrink: 0 }}>{a.room}</span>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'right' }}>{a.id}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ fontSize: '12px', color: 'var(--ink-ghost)' }}>No activity yet — complete a module to start a streak.</p>
        )}
      </Card>

      {/* ── Card 4 — Leaderboard / vs-average ────────────────────────────── */}
      <Card>
        <CardLabel>Leaderboard</CardLabel>
        {!supabase ? (
          <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', lineHeight: 1.5 }}>Leaderboard needs a backend connection. Not configured in this build.</p>
        ) : board == null ? (
          <p style={{ fontSize: '12px', color: 'var(--ink-ghost)' }}>Loading your rank…</p>
        ) : cohortSize === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', lineHeight: 1.5 }}>No ranked players yet. Complete modules and sync to appear on the board.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <MetricTile label="Your rank" value={rank ? '#' + rank : '—'} />
              <MetricTile label="Your score" value={myScore} />
              <MetricTile label="Cohort" value={cohortSize} />
            </div>
            <div style={{ borderRadius: '10px', padding: '11px 14px', fontSize: '12px', background: 'var(--surface)', border: '1px solid var(--rim)' }}>
              <span style={{ color: 'var(--ink-low)' }}>vs cohort average </span>
              <span style={{ fontWeight: 900, color: 'var(--ink-hi)' }}>{avgScore}</span>
              <span style={{ fontWeight: 700, marginLeft: '8px', color: myScore >= avgScore ? 'var(--mint)' : 'var(--prime)' }}>
                {myScore >= avgScore ? '+' : ''}{myScore - avgScore} pts {myScore >= avgScore ? 'above' : 'below'} average
              </span>
            </div>
            <button onClick={() => onNavigate && onNavigate('leaderboard')}
              style={{ marginTop: '12px', background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--prime)', cursor: 'pointer' }}>
              View full leaderboard →
            </button>
          </>
        )}
      </Card>

      {/* ── Card 5 — Completion by area ──────────────────────────────────── */}
      <Card>
        <CardLabel>Completion by area</CardLabel>
        {startedAreas.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', lineHeight: 1.5 }}>
            No areas started yet. Complete modules and they will appear here, weighted by coverage.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {startedAreas.map(a => (
              <div key={a.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>{a.label}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>{a.done}/{a.total} · {a.pct}%</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'var(--rim)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${a.pct}%`, height: '100%', background: 'var(--prime)', transition: 'width 0.4s' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => onNavigate && onNavigate('home')}
          style={{ marginTop: '16px', background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--prime)', cursor: 'pointer' }}>
          View full progress →
        </button>
      </Card>

      {/* ── The MLE Path progress (MSL-specific, preserved) ──────────────── */}
      {foundationsProg.read > 0 && (
        <Card style={{ borderColor: foundationsComplete ? 'rgba(52,211,153,0.3)' : 'var(--rim)', background: foundationsComplete ? 'rgba(52,211,153,0.04)' : 'var(--depth)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <CardLabel>The MLE Path</CardLabel>
              {foundationsComplete ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--mint)', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '999px', padding: '4px 12px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="check" size={11} /> Complete
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>
                    All {foundationsProg.total} MLE Path posts read.
                  </span>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '8px' }}>
                    {foundationsProg.read} / {foundationsProg.total} posts · {foundationsPct}%
                  </div>
                  <div style={{ width: '100%', maxWidth: '220px', height: '6px', background: 'var(--rim)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${foundationsPct}%`, background: 'var(--prime)', borderRadius: '3px', transition: 'width 0.3s' }} />
                  </div>
                </>
              )}
            </div>
            <button onClick={openFoundationsPath}
              style={{ flexShrink: 0, fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: foundationsComplete ? 'var(--mint)' : 'var(--prime)', background: 'transparent', border: `1px solid ${foundationsComplete ? 'rgba(52,211,153,0.3)' : 'rgba(240,165,0,0.3)'}`, borderRadius: '7px', padding: '8px 14px', cursor: 'pointer' }}>
              {foundationsComplete ? 'Revisit path' : 'Continue path →'}
            </button>
          </div>
        </Card>
      )}

      {/* ── Practice stats (preserved) ───────────────────────────────────── */}
      <Card>
        <CardLabel>Practice stats</CardLabel>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <MetricTile label="Attempted" value={scores.attempted} />
          <MetricTile label="Sections" value={scores.tabCount} />
          <MetricTile label="Bookmarks" value={bookmarks} />
        </div>
        <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--prime)', padding: 0, textDecoration: 'underline' }}>
          View full progress →
        </button>
      </Card>

      {/* ── Cross-device sync (preserved) ────────────────────────────────── */}
      <Card>
        <CardLabel>Cross-device sync</CardLabel>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 16px' }}>
          Push your local progress to the cloud and pull it down on another device.
        </p>
        <button
          onClick={handleSync}
          disabled={syncState === 'syncing'}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '12px', opacity: syncState === 'syncing' ? 0.6 : 1 }}
        >
          {syncState === 'idle'    && 'Sync now'}
          {syncState === 'syncing' && 'Syncing…'}
          {syncState === 'done'    && '✓ Synced'}
          {syncState === 'error'   && 'Error — retry'}
        </button>
      </Card>

      {/* ── Study plan (preserved) ───────────────────────────────────────── */}
      <Card>
        <CardLabel>Study plan</CardLabel>
        {activeGuidedPath ? (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>{activeGuidedPath.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>Step {activeGuidedPath.step} of {activeGuidedPath.total}</div>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--prime)', padding: 0, textDecoration: 'underline' }}>
              Resume on Home →
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 14px' }}>No active guided path. Start one from the Home dashboard.</p>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--prime)', padding: 0, textDecoration: 'underline' }}>
              Go to Home →
            </button>
          </div>
        )}
      </Card>

      {/* ── Settings (preserved) ─────────────────────────────────────────── */}
      <Card>
        <CardLabel>Settings</CardLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>Theme</span>
            <button onClick={handleThemeToggle} style={{ background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', cursor: 'pointer' }}>
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
          </div>
          {/* Export */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>Export progress</span>
            <button onClick={downloadProgressJSON} style={{ background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', cursor: 'pointer' }}>
              Download JSON
            </button>
          </div>
          {/* Import */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>Import progress</span>
            <label style={{ background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', cursor: 'pointer' }}>
              Upload JSON
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </Card>

    </div>
  )
}
