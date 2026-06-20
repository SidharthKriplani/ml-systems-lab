// recommendationEngine.js — picks the "Your Next 30 Minutes" recommendation
// from (level × urgency) quiz answers, with fall-through to path progress when
// the user has already started.
//
// Output: { postId, postTitle, postSlug, readMin, practiceTabId, practiceLabel, why }
//
// See docs/COLD_HOME_SPEC.md for the spec this implements.

import {
  PATH_SEQUENCE,
  readFoundationsRead,
  prevPostInPath,
  nextPostInPath,
  titleForPostId,
} from './foundationsPath.js'

// Hardcoded post metadata for recommendation results — slugs + read times.
// Keeps the engine self-contained (no Gradient POSTS import at module load).
const POST_META = {
  3:   { slug: 'auc-is-not-your-friend',                                title: 'AUC Is Not Your Friend',                       readMin: 10 },
  1:   { slug: 'training-serving-skew',                                  title: 'Why Training-Serving Skew Silently Kills Production Models', readMin: 8  },
  4:   { slug: 'how-to-design-a-recommendation-system',                  title: 'How to Design a Recommendation System',        readMin: 11 },
  24:  { slug: 'the-6-step-framework-ml-system-design',                  title: 'The 6-Step Framework That Answers Any ML System Design Question', readMin: 12 },
  73:  { slug: 'gradient-boosted-trees-xgboost-internals',               title: 'Gradient Boosted Trees: What XGBoost Is Actually Doing', readMin: 12 },
  101: { slug: 'probability-for-ml',                                     title: 'Probability for ML',                           readMin: 11 },
  119: { slug: 'generalisation-theory-vc-double-descent',                title: 'Generalisation Theory',                        readMin: 11 },
  128: { slug: 'observation-discipline-reading-diagnostics',             title: 'Observation Discipline',                       readMin: 11 },
  132: { slug: 'model-explainability-shap-permutation-local-global',    title: 'Model Explainability: SHAP, Permutation, Local vs Global', readMin: 12 },
}

// Practice tab labels — match POST_PRACTICE values used in GradientTab.
const PRACTICE_LABELS = {
  models:    'Math Foundations',
  features:  'Feature Engineering',
  eval:      'Model Evaluation',
  classical: 'Classical ML',
  design:    'System Design',
  monitor:   'Monitoring',
  causal:    'Causal Inference',
  ts:        'Time Series',
  dl:        'Deep Learning',
}

// 10-entry recommendation table by (level × urgency) per spec.
// Each entry: { postId, practiceTabId, why }
const RECOMMENDATIONS = {
  beginner_week: {
    postId: 3,
    practiceTabId: 'eval',
    why: 'Highest-leverage read for a week-of interview. Reframes how interviews score your metric choice.',
  },
  beginner_month: {
    postId: 128,
    practiceTabId: 'models',
    why: 'Meta-skill first. Before any ML concept, the discipline of reading diagnostics correctly.',
  },
  beginner_learning: {
    postId: 101,
    practiceTabId: 'models',
    why: 'Linear path from the top of Tier 0. The mathematical foundation everything builds on.',
  },
  mid_week: {
    postId: 1,
    practiceTabId: 'features',
    why: 'Production red flag every senior interview probes. The training-serving skew taxonomy.',
  },
  mid_month: {
    postId: 73,
    practiceTabId: 'classical',
    why: 'Tabular workhorse depth. XGBoost mechanics + production tells for tabular ML interviews.',
  },
  mid_learning: {
    postId: 119,
    practiceTabId: 'eval',
    why: 'Bias-variance + double descent. The theory behind why modern overparameterised models work.',
  },
  senior_week: {
    postId: 24,
    practiceTabId: 'design',
    why: 'System design is the highest-variance interview component. Framework first, architectures second.',
  },
  senior_month: {
    postId: 4,
    practiceTabId: 'design',
    why: 'The canonical senior MLE design problem. Recsys as the template for ranking, search, ads, fraud.',
  },
  senior_learning: {
    postId: 132,
    practiceTabId: 'eval',
    why: 'Staff-level signal topic. SHAP, permutation importance, and the traps senior interviewers probe.',
  },
  default: {
    postId: 128,
    practiceTabId: 'models',
    why: 'Useful to everyone — the discipline of reading evidence before naming concepts.',
  },
}

function buildResult(rec) {
  const meta = POST_META[rec.postId]
  if (!meta) return null
  return {
    postId: rec.postId,
    postTitle: meta.title,
    postSlug: meta.slug,
    readMin: meta.readMin,
    practiceTabId: rec.practiceTabId,
    practiceLabel: PRACTICE_LABELS[rec.practiceTabId] || rec.practiceTabId,
    why: rec.why,
  }
}

// Main entry point.
export function recommendNext({ level, urgency } = {}) {
  // Already-started state: continue where they left off in The MLE Path.
  const read = readFoundationsRead()
  if (read.size > 0) {
    // Find the first ready post in path order that the user hasn't read yet.
    const next = PATH_SEQUENCE.find(p => p.status === 'ready' && p.postId && !read.has(p.postId))
    if (next) {
      const meta = POST_META[next.postId] || { slug: '', title: next.title, readMin: 10 }
      return {
        postId: next.postId,
        postTitle: meta.title || next.title,
        postSlug: meta.slug,
        readMin: meta.readMin,
        practiceTabId: null,
        practiceLabel: null,
        why: `Continue your MLE Path — next up in ${next.tierLabel}.`,
      }
    }
  }

  // Fresh user — use quiz answers.
  const key = `${level || ''}_${urgency || ''}`
  const rec = RECOMMENDATIONS[key] || RECOMMENDATIONS.default
  return buildResult(rec)
}

// Storage helpers ---------------------------------------------------------
const LEVEL_KEY    = 'msl_onboarding_level'
const URGENCY_KEY  = 'msl_onboarding_urgency'
const DONE_KEY     = 'msl_onboarding_completed'
const OVERRIDE_KEY = 'msl_home_mode_override'

export function readOnboarding() {
  try {
    return {
      level: localStorage.getItem(LEVEL_KEY) || null,
      urgency: localStorage.getItem(URGENCY_KEY) || null,
      completed: localStorage.getItem(DONE_KEY) === '1',
    }
  } catch {
    return { level: null, urgency: null, completed: false }
  }
}

export function writeOnboarding({ level, urgency, completed = true }) {
  try {
    if (level) localStorage.setItem(LEVEL_KEY, level)
    if (urgency) localStorage.setItem(URGENCY_KEY, urgency)
    if (completed) localStorage.setItem(DONE_KEY, '1')
  } catch {}
}

export function readHomeOverride() {
  try { return localStorage.getItem(OVERRIDE_KEY) || null } catch { return null }
}

export function writeHomeOverride(value) {
  try {
    if (value) localStorage.setItem(OVERRIDE_KEY, value)
    else localStorage.removeItem(OVERRIDE_KEY)
  } catch {}
}

// Derive the home mode from current state. Pure function.
export function deriveHomeMode({ totalAttempted, foundationsReadSize, onboardingCompleted, override }) {
  if (override === 'dashboard') return 'dashboard'
  const isBrandNew = totalAttempted === 0 && foundationsReadSize === 0 && !onboardingCompleted
  if (isBrandNew) return 'quiz'
  const isEarly = totalAttempted < 5 && foundationsReadSize < 3
  if (isEarly) return 'next30'
  return 'dashboard'
}
