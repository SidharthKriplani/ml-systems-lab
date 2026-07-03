// companyTracks.js — SKELETON for curated, company-specific prep tracks.
//
// The grid is (company × role × seniority). Each cell holds an ordered list of
// item refs that OPEN DIRECTLY via the app's deep-link (onNavigate(tabId, target)):
//   { tabId, target, label, kind }
//     tabId   — the room to open (e.g. 'system_design_foundation', 'judge_browser',
//               'interview_questions', 'drill', 'mlcoding', ...)
//     target  — the specific module/item id to open inside that room (or null)
//     label   — display text
//     kind    — free-form tag ('foundation' | 'drill' | 'question' | 'project' | ...)
//
// For now every cell is EMPTY — this is the scaffold. Populate ITEMS below (keyed
// by `${company}|${role}|${level}`) as curated tracks get authored; the browser
// renders whatever is present and shows a "coming soon" state where empty.

export const COMPANIES = [
  'Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix', 'Uber', 'LinkedIn',
  'Adobe', 'Salesforce', 'Walmart Global Tech', 'Flipkart', 'Swiggy', 'Zomato',
  'Myntra', 'PhonePe', 'Razorpay', 'CRED', 'Meesho', 'ShareChat', 'Ola',
  'Paytm', 'Dream11', 'Sprinklr', 'Atlassian', 'Navi', 'Groww', 'Pocket FM',
  'Nutanix',
]

export const ROLES = [
  'ML Engineer',
  'Data Scientist',
  'Applied Scientist',
  'ML Research',
]

export const LEVELS = ['Junior', 'Mid', 'Senior', 'Staff']

// Sparse map: '<company>|<role>|<level>' -> [ { tabId, target, label, kind }, ... ]
// Empty for now. Example of the shape a populated cell would take:
//   'Pocket FM|Data Scientist|Senior': [
//     { tabId: 'system_design_foundation', target: 'recsys_overview', label: 'RecSys overview', kind: 'foundation' },
//     { tabId: 'judge_browser',            target: null,             label: 'RecSys judgment drills', kind: 'drill' },
//     { tabId: 'interview_questions',       target: null,             label: 'Ranking & eval Q&A', kind: 'question' },
//   ],
export const COMPANY_TRACK_ITEMS = {
  // ── Meta · ML Engineer · Senior ──────────────────────────────────────────────
  // A senior MLE loop at Meta is ranking/recommendation-heavy: the core signal is
  // whether you can design a large-scale two-stage recommender, reason about
  // production feature/serving realities, evaluate it correctly offline+online,
  // debug it when it breaks, and code the ML primitives live. This track is an
  // ordered arc: RecSys mental model → ML system design framing → production &
  // eval rigor → live coding → cross-domain debugging → studies → mock.
  // Every ref points at a REAL tab id + (where deep-linkable) a REAL module id.
  'Meta|ML Engineer|Senior': [
    // 1) Build the RecSys mental model — the spine of the Meta MLE loop.
    { tabId: 'recsys_foundation', target: 'two_stage_architecture', label: 'The Two-Stage Architecture (retrieval → ranking)', kind: 'foundation' },
    { tabId: 'recsys_foundation', target: 'candidate_generation',   label: 'Candidate Generation & Two-Tower Retrieval', kind: 'foundation' },
    { tabId: 'recsys_foundation', target: 'learning_to_rank',       label: 'Learning to Rank', kind: 'foundation' },
    { tabId: 'recsys_foundation', target: 'multi_objective_tradeoffs', label: 'Multi-Objective Ranking Tradeoffs (value model)', kind: 'foundation' },
    { tabId: 'recsys_foundation', target: 'feedback_loops_bias',    label: 'Feedback Loops & Position Bias', kind: 'foundation' },
    // 2) Frame it as an ML system design answer.
    { tabId: 'system_design_foundation', target: 'design_framework', label: 'The 6-Step ML System Design Framework', kind: 'foundation' },
    { tabId: 'system_design_foundation', target: 'two_tower',        label: 'Two-Tower Models in Depth', kind: 'foundation' },
    { tabId: 'system_design_foundation', target: 'multitask_ranking', label: 'Multi-Task Ranking', kind: 'foundation' },
    { tabId: 'system_design_foundation', target: 'real_time_ml',     label: 'Real-Time ML & Serving', kind: 'foundation' },
    // 3) Production & serving realities the senior bar demands.
    { tabId: 'production_foundation', target: 'training_serving_skew', label: 'Training–Serving Skew', kind: 'foundation' },
    { tabId: 'production_foundation', target: 'feature_store',       label: 'Feature Stores', kind: 'foundation' },
    // 4) Evaluate it correctly — offline metrics and online truth.
    { tabId: 'eval_foundation', target: 'ranking_metrics',          label: 'Ranking Metrics (NDCG, MAP, recall@k)', kind: 'foundation' },
    { tabId: 'eval_foundation', target: 'offline_vs_online',        label: 'Offline vs Online Evaluation', kind: 'foundation' },
    { tabId: 'eval_foundation', target: 'calibration',              label: 'Calibration', kind: 'foundation' },
    // 5) Monitor & catch silent failure.
    { tabId: 'monitoring_foundation', target: 'data_drift_detection', label: 'Data Drift Detection', kind: 'foundation' },
    { tabId: 'monitoring_foundation', target: 'silent_model_staleness', label: 'Silent Model Staleness', kind: 'foundation' },
    // 6) Prove you can code the primitives live.
    { tabId: 'mlcoding', target: null, label: 'ML Coding — live Python (ranking, custom loss, k-fold)', kind: 'coding' },
    // 7) Judgment under pressure — cross-domain incident diagnosis.
    { tabId: 'incidentroom', target: null, label: 'Cross-Domain Challenges — multi-step diagnosis', kind: 'drill' },
    { tabId: 'judge_browser', target: null, label: 'JUDGE — ranking & production judgment drills', kind: 'drill' },
    // 8) Ground it in real systems, then simulate the loop.
    { tabId: 'casestudies', target: null, label: 'Case Studies — Netflix, Uber, Spotify recommenders', kind: 'case' },
    { tabId: 'ranking_project', target: null, label: 'Project Lab — build a ranking model end-to-end', kind: 'project' },
    { tabId: 'interview', target: null, label: 'Interview Q&A — system design, ML fundamentals', kind: 'question' },
    { tabId: 'mock_interview', target: null, label: 'Mock Interview — full timed simulation', kind: 'mock' },
  ],
}

export function trackKey(company, role, level) {
  return `${company}|${role}|${level}`
}

export function getCompanyTrackItems(company, role, level) {
  return COMPANY_TRACK_ITEMS[trackKey(company, role, level)] || []
}
