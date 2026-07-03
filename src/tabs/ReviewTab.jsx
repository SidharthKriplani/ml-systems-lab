import { useState, useEffect, useCallback } from 'react'
import { computeReadiness } from '../utils/readiness.js'

// Module title arrays — imported light, only for resolving a moduleId → title.
import { MATH_STATS_MODULES }     from '../data/foundations/mathStatsModules.js'
import { CLASSICAL_ML_MODULES }   from '../data/foundations/classicalMLModules.js'
import { PROBABILISTIC_ML_MODULES } from '../data/foundations/probabilisticMLModules.js'
import { EVAL_MODULES }           from '../data/foundations/evalModules.js'
import { UNSUPERVISED_MODULES }   from '../data/foundations/unsupervisedModules.js'
import { CAUSAL_MODULES }         from '../data/foundations/causalModules.js'
import { DEEP_LEARNING_MODULES }  from '../data/foundations/deepLearningModules.js'
import { SELF_SUPERVISED_MODULES } from '../data/foundations/selfSupervisedModules.js'
import { RL_MODULES }             from '../data/foundations/rlModules.js'
import { PRODUCTION_MODULES }     from '../data/foundations/productionModules.js'
import { MONITORING_MODULES }     from '../data/foundations/monitoringModules.js'
import { SYSTEM_DESIGN_MODULES }  from '../data/foundations/systemDesignModules.js'
import { RECSYS_MODULES }         from '../data/foundations/recsysModules.js'
import { PRICING_MODULES }        from '../data/foundations/pricingModules.js'
import { TIME_SERIES_MODULES }    from '../data/foundations/timeSeriesModules.js'
import { GRAPH_ML_MODULES }       from '../data/foundations/graphMLModules.js'
import { BANDITS_MODULES }        from '../data/foundations/banditsModules.js'
import { OPTIMIZATION_MODULES }   from '../data/foundations/optimizationModules.js'
import { DATA_MODULES }           from '../data/foundations/dataModules.js'

// Canonical domain map: foundation localStorage key → nav tabId + room label +
// its module array. Mirrors FOUNDATION_STORES in ProgressTab.jsx. Titles resolve
// from the module arrays; if an import is missing a module id we fall back to the id.
const DOMAINS = [
  { lsKey: 'msl-math-stats-foundation-v1',       tabId: 'math_stats_foundation',       label: 'Math & Stats',        modules: MATH_STATS_MODULES },
  { lsKey: 'msl-classical-ml-foundation-v1',     tabId: 'classical_ml_foundation',     label: 'Classical ML',        modules: CLASSICAL_ML_MODULES },
  { lsKey: 'msl-probabilistic-ml-foundation-v1', tabId: 'probabilistic_ml_foundation', label: 'Probabilistic ML',    modules: PROBABILISTIC_ML_MODULES },
  { lsKey: 'msl-eval-foundation-v1',             tabId: 'eval_foundation',             label: 'Evaluation',          modules: EVAL_MODULES },
  { lsKey: 'msl-unsupervised-foundation-v1',     tabId: 'unsupervised_foundation',     label: 'Unsupervised',        modules: UNSUPERVISED_MODULES },
  { lsKey: 'msl-causal-foundation-v1',           tabId: 'causal_foundation',           label: 'Causal',              modules: CAUSAL_MODULES },
  { lsKey: 'msl-dl-foundation-v1',               tabId: 'dl_foundation',               label: 'Deep Learning',       modules: DEEP_LEARNING_MODULES },
  { lsKey: 'msl-self-supervised-foundation-v1',  tabId: 'self_supervised_foundation',  label: 'Self-supervised',     modules: SELF_SUPERVISED_MODULES },
  { lsKey: 'msl-rl-foundation-v1',               tabId: 'rl_foundation',               label: 'Reinforcement L.',    modules: RL_MODULES },
  { lsKey: 'msl-production-foundation-v1',       tabId: 'production_foundation',       label: 'Production',          modules: PRODUCTION_MODULES },
  { lsKey: 'msl-monitoring-foundation-v1',       tabId: 'monitoring_foundation',       label: 'Monitoring',          modules: MONITORING_MODULES },
  { lsKey: 'msl-system-design-foundation-v1',    tabId: 'system_design_foundation',    label: 'System Design',       modules: SYSTEM_DESIGN_MODULES },
  { lsKey: 'msl-recsys-foundation-v1',           tabId: 'recsys_foundation',           label: 'Recommender Systems', modules: RECSYS_MODULES },
  { lsKey: 'msl-pricing-foundation-v1',          tabId: 'pricing_foundation',          label: 'Pricing Analytics',   modules: PRICING_MODULES },
  { lsKey: 'msl-time-series-foundation-v1',      tabId: 'time_series_foundation',      label: 'Time Series',         modules: TIME_SERIES_MODULES },
  { lsKey: 'msl-graph-ml-foundation-v1',         tabId: 'graph_ml_foundation',         label: 'Graph ML',            modules: GRAPH_ML_MODULES },
  { lsKey: 'msl-bandits-foundation-v1',          tabId: 'bandits_foundation',          label: 'Bandits',             modules: BANDITS_MODULES },
  { lsKey: 'msl-optimization-foundation-v1',     tabId: 'optimization_foundation',     label: 'Optimization',        modules: OPTIMIZATION_MODULES },
  { lsKey: 'msl-data-foundation-v1',             tabId: 'data_foundation',             label: 'Data',                modules: DATA_MODULES },
]

// ── Spaced-repetition schedule ───────────────────────────────────────────────
// SM-2-lite: intervals grow with the number of times an item has been reviewed.
// review 0 (never reviewed since learning) → due 3 days after learning.
// review 1 → 7 days, review 2 → 21, review 3 → 45, then 90 thereafter.
const REVIEW_KEY = 'msl-review-v1' // { [moduleKey]: { reviews, lastReviewed } }
const INTERVALS_DAYS = [3, 7, 21, 45, 90]
const DAY_MS = 24 * 60 * 60 * 1000

function intervalForReviews(n) {
  return INTERVALS_DAYS[Math.min(n, INTERVALS_DAYS.length - 1)]
}

function readReviewState() {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}') || {}
  } catch {
    return {}
  }
}

function writeReviewState(state) {
  try {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(state))
    window.dispatchEvent(new CustomEvent('msl_progress'))
  } catch {}
}

// A stable per-item key across domains.
function itemKey(tabId, moduleId) {
  return `${tabId}:${moduleId}`
}

function titleFor(modules, moduleId) {
  const m = (modules || []).find(x => x && x.id === moduleId)
  return (m && m.title) || moduleId
}

// Build the list of review candidates from the foundation blobs, then layer the
// review schedule on top of each. Returns items with a `dueAt` timestamp.
function collectCandidates() {
  const reviewState = readReviewState()
  const now = Date.now()
  const items = []

  for (const d of DOMAINS) {
    let blob = {}
    try {
      blob = JSON.parse(localStorage.getItem(d.lsKey) || '{}') || {}
    } catch {
      blob = {}
    }
    for (const [moduleId, val] of Object.entries(blob)) {
      const completedAt = val && val.completedAt
      if (!completedAt) continue
      const learnedMs = new Date(completedAt).getTime()
      if (!Number.isFinite(learnedMs)) continue

      const key = itemKey(d.tabId, moduleId)
      const sr = reviewState[key] || { reviews: 0, lastReviewed: null }
      // The clock for the next review runs from the last review, or from when it
      // was learned if it has never been reviewed.
      const anchorMs = sr.lastReviewed
        ? new Date(sr.lastReviewed).getTime()
        : learnedMs
      const dueAt = anchorMs + intervalForReviews(sr.reviews) * DAY_MS

      items.push({
        key,
        tabId: d.tabId,
        moduleId,
        room: d.label,
        title: titleFor(d.modules, moduleId),
        learnedMs,
        reviews: sr.reviews,
        dueAt,
        due: dueAt <= now,
      })
    }
  }
  return items
}

// ── Formatting ───────────────────────────────────────────────────────────────
function agoLabel(ms) {
  const diff = Date.now() - ms
  const days = Math.floor(diff / DAY_MS)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return 'a week ago'
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 60) return 'a month ago'
  return `${Math.floor(days / 30)} months ago`
}

function dueLabel(dueAt) {
  const diff = dueAt - Date.now()
  if (diff <= 0) return 'due now'
  const days = Math.ceil(diff / DAY_MS)
  if (days === 1) return 'due tomorrow'
  if (days < 7) return `due in ${days} days`
  return `due ${new Date(dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

// ── Sub-components ───────────────────────────────────────────────────────────
function ReviewRow({ item, onOpen, onMarkReviewed }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderLeft: '3px solid var(--prime)',
      borderRadius: '10px',
      padding: '0.8rem 1rem',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: 'var(--prime)', marginBottom: '0.2rem',
        }}>
          {item.room}
        </div>
        <div style={{
          fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.title}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-low)', marginTop: '0.2rem' }}>
          learned {agoLabel(item.learnedMs)}
          {item.reviews > 0 ? ` · reviewed ${item.reviews}×` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
        <button
          onClick={() => onOpen(item)}
          style={{
            background: 'var(--prime)', color: '#111',
            border: 'none', borderRadius: '6px',
            padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
          }}
        >
          Review →
        </button>
        <button
          onClick={() => onMarkReviewed(item)}
          style={{
            background: 'none', color: 'var(--ink-mid)',
            border: '1px solid var(--rim)', borderRadius: '6px',
            padding: '0.35rem 0.85rem', fontSize: '0.74rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap',
          }}
        >
          ✓ Mark reviewed
        </button>
      </div>
    </div>
  )
}

function ScheduledRow({ item }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.55rem 0.9rem',
      borderBottom: '1px solid var(--rim)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--ink-mid)', fontWeight: 600 }}>
          {item.title}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-low)', marginLeft: '0.5rem' }}>
          {item.room}
        </span>
      </div>
      <span style={{
        fontSize: '0.7rem', color: 'var(--ink-low)',
        fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {dueLabel(item.dueAt)}
      </span>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ReviewTab({ onNavigate }) {
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])

  // Re-render on any progress change (a review mark dispatches msl_progress).
  useEffect(() => {
    window.addEventListener('msl_progress', refresh)
    return () => window.removeEventListener('msl_progress', refresh)
  }, [refresh])

  // Recomputed each render — cheap localStorage scan, and `tick` forces it after writes.
  const candidates = collectCandidates()
  void tick // referenced so the recompute is tied to tick

  const due = candidates
    .filter(c => c.due)
    .sort((a, b) => a.dueAt - b.dueAt)
  const later = candidates
    .filter(c => !c.due)
    .sort((a, b) => a.dueAt - b.dueAt)

  const hasQueue = candidates.length > 0

  function handleOpen(item) {
    if (onNavigate) onNavigate(item.tabId, item.moduleId)
  }

  function handleMarkReviewed(item) {
    const state = readReviewState()
    const prev = state[item.key] || { reviews: 0, lastReviewed: null }
    state[item.key] = {
      reviews: prev.reviews + 1,
      lastReviewed: new Date().toISOString(),
    }
    writeReviewState(state)
    refresh()
  }

  // Weakest area pointer from readiness — used in the empty state.
  const readiness = computeReadiness()
  const weakest = readiness && readiness.weakest
  // Map the readiness area key to a sensible nav target.
  const weakestNav = weakest && weakest.key === 'foundations'
    ? { tabId: 'math_stats_foundation', label: 'Math & Stats Foundations' }
    : { tabId: 'classical', label: 'Classical ML practice' }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem', fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: 'var(--prime)', marginBottom: '0.3rem',
        }}>
          Spaced Repetition
        </div>
        <h1 style={{
          fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink-hi)',
          letterSpacing: '-0.025em', margin: '0 0 0.5rem 0',
        }}>
          Review
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.6, maxWidth: '540px' }}>
          Foundations you have finished come back on a schedule so they stick. Clear what is due,
          and each item pushes further out every time you review it — 3 days, then a week, then longer.
        </p>
        {hasQueue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: due.length > 0 ? 'var(--prime)' : 'var(--ink-low)',
              background: due.length > 0 ? 'var(--prime-faint)' : 'var(--surface)',
              border: '1px solid ' + (due.length > 0 ? 'rgba(232,160,48,0.3)' : 'var(--rim)'),
              borderRadius: '10px', padding: '0.15rem 0.55rem',
            }}>
              {due.length} due today
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-low)' }}>
              {later.length} scheduled later · {candidates.length} in queue
            </span>
          </div>
        )}
      </div>

      {/* Due list */}
      {due.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.75rem' }}>
          {due.map(item => (
            <ReviewRow
              key={item.key}
              item={item}
              onOpen={handleOpen}
              onMarkReviewed={handleMarkReviewed}
            />
          ))}
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: '12px',
          padding: '2.25rem 1.5rem',
          textAlign: 'center',
          marginBottom: '1.75rem',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--prime-faint)', border: '1px solid rgba(232,160,48,0.3)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '0.9rem', color: 'var(--prime)', fontSize: '1.3rem', fontWeight: 800,
          }}>
            ✓
          </div>
          {!hasQueue ? (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '0.4rem' }}>
                Nothing to review yet.
              </div>
              <p style={{
                fontSize: '0.85rem', color: 'var(--ink-low)', margin: '0 auto 1.25rem',
                lineHeight: 1.6, maxWidth: '400px',
              }}>
                Finish a few foundation modules. Anything you complete shows up here on a spaced
                schedule, so your weak spots resurface before you forget them.
                {weakest ? ` Start with ${weakestNav.label} — it's your thinnest area right now.` : ''}
              </p>
              <button
                onClick={() => onNavigate && onNavigate(weakestNav.tabId)}
                style={{
                  background: 'var(--prime)', color: '#111', border: 'none', borderRadius: '8px',
                  padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                Go to {weakestNav.label} →
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '0.4rem' }}>
                Nothing due — you're caught up.
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-low)', margin: 0, lineHeight: 1.6 }}>
                {later.length > 0
                  ? `Next review ${dueLabel(later[0].dueAt)}.`
                  : 'Everything is reviewed.'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Scheduled later */}
      {later.length > 0 && (
        <div>
          <div style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.09em', color: 'var(--ink-low)', marginBottom: '0.6rem',
          }}>
            Scheduled later
          </div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--rim)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            {later.slice(0, 12).map(item => (
              <ScheduledRow key={item.key} item={item} />
            ))}
          </div>
          {later.length > 12 && (
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-low)', marginTop: '0.5rem', textAlign: 'center' }}>
              + {later.length - 12} more scheduled
            </div>
          )}
        </div>
      )}
    </div>
  )
}
