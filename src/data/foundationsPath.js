// foundationsPath.js — The sequenced first-principles curriculum.
// 34 posts across 7 tiers. Read in order. Each tier ends with a pointer
// into a practice tab so theory becomes muscle memory immediately.
//
// `postId` references Gradient post ids in src/tabs/GradientTab.jsx POSTS array.
// `status: 'pending'` = post not yet written (Session 3 backlog).

export const PAL_URL = 'https://product-analytics-lab.vercel.app'

export const FOUNDATIONS_TIERS = [
  {
    id: 't0',
    label: 'Tier 0 — Pure Math',
    outcome: 'You can read ML notation in any paper without flinching.',
    prereq: 'High-school math.',
    forward: { tabId: 'models', label: 'Practice → Math Foundations (ModelsMath)' },
    posts: [
      { n: 1, postId: 101, title: 'Probability for ML', status: 'ready' },
      { n: 2, postId: 102, title: 'Linear Algebra for ML', status: 'ready' },
      { n: 3, postId: 103, title: 'Calculus for ML', status: 'ready' },
      { n: 4, postId: 120, title: 'Matrix Calculus', status: 'ready' },
      { n: 5, postId: 104, title: 'Information Theory', status: 'ready' },
      { n: 6, postId: 115, title: 'Convex Optimisation', status: 'ready' },
    ],
  },
  {
    id: 't1',
    label: 'Tier 1 — Statistics & Estimation',
    outcome: 'You understand what every model is mathematically trying to do.',
    prereq: 'Tier 0.',
    forward: { tabId: 'causal', label: 'Practice → Causal & Statistical Inference' },
    palCross: { url: PAL_URL, note: 'PAL covers experimentation depth (CUPED, sequential testing, variance reduction) beyond what MSL teaches in Tier 1.' },
    posts: [
      { n: 7, postId: 113, title: 'Hypothesis Testing', status: 'ready' },
      { n: 8, postId: 105, title: 'MLE and MAP', status: 'ready' },
      { n: 9, postId: 106, title: 'The EM Algorithm', status: 'ready' },
      { n: 10, postId: 75, title: 'Bayesian Inference', status: 'ready' },
    ],
  },
  {
    id: 't2',
    label: 'Tier 2 — Linear Models',
    outcome: 'You can derive how the simplest models fit data and explain regularisation geometrically.',
    prereq: 'Tier 1.',
    forward: { tabId: 'classical', label: 'Practice → Classical ML · Decision Boundary Lab' },
    posts: [
      { n: 11, postId: 111, title: 'OLS and Linear Regression', status: 'ready' },
      { n: 12, postId: 107, title: 'Logistic Regression From Scratch', status: 'ready' },
      { n: 13, postId: 112, title: 'Regularisation Geometry', status: 'ready' },
      { n: 14, postId: 119, title: 'Generalisation Theory', status: 'ready' },
    ],
  },
  {
    id: 't3',
    label: 'Tier 3 — Classical Algorithms',
    outcome: 'You can pick the right classical algorithm for any tabular problem and know its breaking points.',
    prereq: 'Tier 2.',
    forward: { tabId: 'classical', label: 'Practice → Classical ML · Tree & Ensemble modules' },
    posts: [
      { n: 15, postId: null, title: 'K-Nearest Neighbors: Lazy Algorithm, Curse of Dimensionality, and When KNN Wins', status: 'deferred' },
      { n: 16, postId: null, title: 'Naive Bayes: The Independence Assumption, When It Lies, and Why It Still Works', status: 'deferred' },
      { n: 17, postId: 108, title: 'Decision Trees and Random Forests', status: 'ready' },
      { n: 18, postId: 73, title: 'Gradient Boosted Trees (XGBoost)', status: 'ready' },
      { n: 19, postId: 127, title: 'Ensemble Methods: Bagging, Boosting, Stacking — Mechanics and When Each Wins', status: 'ready' },
      { n: 20, postId: 97, title: 'SVMs: The Kernel Trick and Maximum Margin', status: 'ready' },
      { n: 21, postId: 74, title: 'The Bias-Variance Tradeoff', status: 'ready' },
      { n: 22, postId: 76, title: 'Model Calibration', status: 'ready' },
    ],
  },
  {
    id: 't4',
    label: 'Tier 4 — Unsupervised & Dimensionality Reduction',
    outcome: 'You can reduce dimensions and find structure without labels.',
    prereq: 'Tier 1 (Tier 3 helpful).',
    forward: { tabId: 'classical', label: 'Practice → Classical ML · PCA module' },
    posts: [
      { n: 23, postId: 86, title: 'PCA from Scratch', status: 'ready' },
      { n: 24, postId: 87, title: 'Clustering: k-Means and DBSCAN', status: 'ready' },
      { n: 25, postId: null, title: 'Manifold Learning: t-SNE, UMAP, and Why They Distort Distances', status: 'deferred' },
    ],
  },
  {
    id: 't5',
    label: 'Tier 5 — Evaluation & Generalization',
    outcome: 'You pick the right metric, and detect when offline numbers will not hold online.',
    prereq: 'Tier 2.',
    forward: { tabId: 'eval', label: 'Practice → Model Evaluation' },
    palCross: { url: PAL_URL, note: 'PAL goes deeper on online metric design, guardrails, and north-star alignment.' },
    posts: [
      { n: 26, postId: 114, title: 'Evaluation Metrics from First Principles', status: 'ready' },
      { n: 27, postId: 3, title: 'AUC Is Not Your Friend', status: 'ready' },
      { n: 28, postId: 42, title: 'Offline Evaluation ≠ Online Performance', status: 'ready' },
      { n: 29, postId: 20, title: 'The Validation Set Is Lying to You', status: 'ready' },
    ],
  },
  {
    id: 't6',
    label: 'Tier 6 — Sequence, Specialized & Bridge to Production',
    outcome: 'You can handle time-ordered data and you have crossed into production judgment — the rest of MSL builds on top.',
    prereq: 'Tier 1 + Tier 2.',
    forward: { tabId: 'ts', label: 'Practice → Time Series · Monitoring · Causal Inference' },
    posts: [
      { n: 30, postId: 88, title: 'Time Series Forecasting', status: 'ready' },
      { n: 31, postId: 118, title: 'Survival Analysis', status: 'ready' },
      { n: 32, postId: 95, title: 'Anomaly Detection', status: 'ready' },
      { n: 33, postId: 96, title: 'Multi-Armed Bandits', status: 'ready' },
      { n: 34, postId: 117, title: 'Data Preprocessing & Missingness', status: 'ready' },
    ],
  },
]

// Flat list of every post in path order, for prev/next navigation inside PostReader.
export const PATH_SEQUENCE = FOUNDATIONS_TIERS.flatMap(t =>
  t.posts.map(p => ({ ...p, tierId: t.id, tierLabel: t.label }))
)

export const TOTAL_POSTS = PATH_SEQUENCE.length

export function tierForPostId(postId) {
  for (const t of FOUNDATIONS_TIERS) {
    if (t.posts.some(p => p.postId === postId)) return t
  }
  return null
}

export function sequenceIndexForPostId(postId) {
  return PATH_SEQUENCE.findIndex(p => p.postId === postId)
}

export function prevPostInPath(postId) {
  const idx = sequenceIndexForPostId(postId)
  if (idx <= 0) return null
  for (let i = idx - 1; i >= 0; i--) {
    if (PATH_SEQUENCE[i].postId) return PATH_SEQUENCE[i]
  }
  return null
}

export function nextPostInPath(postId) {
  const idx = sequenceIndexForPostId(postId)
  if (idx < 0) return null
  for (let i = idx + 1; i < PATH_SEQUENCE.length; i++) {
    if (PATH_SEQUENCE[i].postId) return PATH_SEQUENCE[i]
  }
  return null
}

// localStorage helpers ----------------------------------------------------------
const READ_KEY = 'msl_foundations_read'
const TIER_KEY = 'msl_foundations_tier'

export function readFoundationsRead() {
  try {
    const raw = localStorage.getItem(READ_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw))
  } catch {
    return new Set()
  }
}

export function markFoundationsRead(postId) {
  try {
    const set = readFoundationsRead()
    set.add(postId)
    localStorage.setItem(READ_KEY, JSON.stringify([...set]))
    return set
  } catch {
    return new Set()
  }
}

export function unmarkFoundationsRead(postId) {
  try {
    const set = readFoundationsRead()
    set.delete(postId)
    localStorage.setItem(READ_KEY, JSON.stringify([...set]))
    return set
  } catch {
    return new Set()
  }
}

export function readActiveTier() {
  return localStorage.getItem(TIER_KEY) || 't0'
}

export function writeActiveTier(tierId) {
  try { localStorage.setItem(TIER_KEY, tierId) } catch {}
}

export function isFoundationsTouched() {
  return readFoundationsRead().size > 0
}

export function tierCompletion(tier, readSet) {
  const readyPosts = tier.posts.filter(p => p.status === 'ready' && p.postId)
  const readCount = readyPosts.filter(p => readSet.has(p.postId)).length
  return { read: readCount, total: readyPosts.length, pending: tier.posts.length - readyPosts.length }
}

export function overallCompletion(readSet) {
  const allReady = PATH_SEQUENCE.filter(p => p.status === 'ready' && p.postId)
  const readCount = allReady.filter(p => readSet.has(p.postId)).length
  return { read: readCount, total: allReady.length, pending: TOTAL_POSTS - allReady.length }
}
