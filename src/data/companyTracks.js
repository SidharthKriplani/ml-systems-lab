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
export const COMPANY_TRACK_ITEMS = {}

export function trackKey(company, role, level) {
  return `${company}|${role}|${level}`
}

export function getCompanyTrackItems(company, role, level) {
  return COMPANY_TRACK_ITEMS[trackKey(company, role, level)] || []
}
