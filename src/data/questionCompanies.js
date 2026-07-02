// Multi-company "brand borrowing" attribution for interview questions + incidents.
//
// The idea: instead of tagging a question with a single company, we attribute it
// to the real cluster of top employers that actually ask (or would recognise)
// that kind of question. Seeing "Meta · Google · Netflix  +4" on a recsys
// design question primes the way real interview prep does.
//
// HARD CONSTRAINT: every company name returned here MUST resolve in
// companyDomains.js (COMPANY_DOMAINS) so a favicon logo renders. All names below
// are copied verbatim from that map's keys. The heuristic fallback would still
// produce *a* logo for most single-token names, but we stay curated on purpose.
//
// DATA-FILE SYNTAX: single quotes only, escape apostrophes as \', no backticks.

// ── Topic clusters → ordered company lists ────────────────────────────────────
// Ordering is intentional: the companies most identified with that problem
// space come first (they show as the visible logos before the "+N more" chip).
// All names verified against COMPANY_DOMAINS keys.
const TOPIC_COMPANIES = {
  // Feed / social ranking
  feed:         ['Meta', 'LinkedIn', 'Pinterest', 'ShareChat', 'Google'],
  // Recommendations / streaming / content
  recsys:       ['Netflix', 'Spotify', 'Amazon', 'Google', 'Meta', 'Pinterest'],
  streaming:    ['Netflix', 'Spotify', 'Disney+ Hotstar', 'Amazon Prime Video', 'SonyLIV'],
  // Search / retrieval / ANN
  search:       ['Google', 'Amazon', 'Airbnb', 'Flipkart', 'LinkedIn'],
  // Ads / bidding / auctions
  ads:          ['Google', 'Meta', 'Criteo', 'The Trade Desk', 'PubMatic', 'AppLovin'],
  // Fraud / risk / payments
  fraud:        ['Stripe', 'PayPal', 'Razorpay', 'Visa', 'Uber', 'PhonePe'],
  payments:     ['Stripe', 'PayPal', 'Razorpay', 'PhonePe', 'Paytm', 'Visa'],
  // Two-sided marketplaces / logistics / ETA / surge
  marketplace:  ['Airbnb', 'Uber', 'DoorDash', 'Swiggy', 'Zomato', 'Ola'],
  eta:          ['Uber', 'DoorDash', 'Swiggy', 'Zomato', 'Ola'],
  // Experimentation / A-B testing
  experiment:   ['Netflix', 'Airbnb', 'Booking.com', 'Meta', 'Uber'],
  // ML platform / infra / MLOps
  platform:     ['Google', 'Uber', 'Netflix', 'DoorDash', 'Databricks'],
  serving:      ['Google', 'Uber', 'Netflix', 'Meta', 'DoorDash'],
  // Data engineering / Spark
  spark:        ['Databricks', 'Uber', 'Netflix', 'Meta', 'Walmart Global Tech'],
  // Time-series / forecasting / demand
  forecasting:  ['Uber', 'DoorDash', 'Amazon', 'Swiggy', 'Zomato'],
  // Fintech / credit / lending
  credit:       ['CRED', 'Groww', 'Navi', 'JP Morgan Chase', 'Goldman Sachs', 'Capital One'],
  // NLP / LLM / embeddings
  nlp:          ['Google', 'Meta', 'Microsoft', 'Nvidia', 'Amazon'],
  // Computer vision
  vision:       ['Google', 'Meta', 'Nvidia', 'Tesla', 'Apple'],
  // Classical ML / stats / trees / regression
  classical:    ['Google', 'Amazon', 'Microsoft', 'JP Morgan Chase', 'LinkedIn'],
  // Cold start
  coldstart:    ['Netflix', 'Spotify', 'Airbnb', 'Meta', 'Pinterest'],
  // Behavioral / leadership
  behavioral:   ['Amazon', 'Google', 'Meta', 'Microsoft', 'Netflix'],
}

// ── Interview-question category (`cat`) → topic key ───────────────────────────
const CAT_TOPIC = {
  'System Design':      'recsys',
  'Features':           'platform',
  'Evaluation':         'experiment',
  'Spark':              'spark',
  'Coding':             'classical',
  'Architecture':      'serving',
  'Statistics':         'experiment',
  'Trees & Ensembles':  'classical',
  'SQL':                'spark',
  'Regression':         'classical',
  'Behavioral':         'behavioral',
}

// ── Keyword → topic key (scanned against the question / incident text) ─────────
// Order matters only for readability; all matching topics are merged.
const KEYWORD_TOPICS = [
  [/\bfeed\b|social network|news ?feed|timeline/i,                      'feed'],
  [/recommend|recsys|two-tower|collaborative filter|personali[sz]/i,    'recsys'],
  [/music|stream|video|watch|content library|home screen/i,            'streaming'],
  [/\bsearch\b|ranking|retrieval|\bANN\b|listing|query/i,               'search'],
  [/\bads?\b|advertis|bidding|auction|\bCTR\b|click.?through|campaign/i, 'ads'],
  [/fraud|chargeback|dispute|risk model|anomaly/i,                      'fraud'],
  [/payment|transaction|checkout|card\b/i,                             'payments'],
  [/marketplace|two-sided|host|driver|rider|supply|demand|deliver/i,   'marketplace'],
  [/\bETA\b|dispatch|routing|surge|pricing/i,                          'eta'],
  [/experiment|a\/b|ab test|randomis|randomiz|\bSRM\b|guardrail|CUPED/i, 'experiment'],
  [/platform|feature store|\bMLOps\b|registry|governance|pipeline/i,   'platform'],
  [/serv(e|ing)|latency|inference|deploy|canary|shadow mode|GPU/i,     'serving'],
  [/spark|shuffle|parquet|catalyst|partition|broadcast join|skew/i,    'spark'],
  [/forecast|time.?series|seasonal|demand predict|surge/i,             'forecasting'],
  [/credit|lend|loan|underwrit|default|scorecard/i,                    'credit'],
  [/\bNLP\b|\bLLM\b|embedding|language model|transformer|token|semantic/i, 'nlp'],
  [/vision|image|object detect|segmentation|OCR/i,                     'vision'],
  [/cold.?start|new user|new item|no history/i,                        'coldstart'],
  [/gradient boost|random forest|xgboost|decision tree|\bGBDT\b/i,     'classical'],
]

// De-duplicate while preserving first-seen order.
function dedupe(arr) {
  const seen = new Set()
  const out = []
  for (const x of arr) {
    if (x && !seen.has(x)) { seen.add(x); out.push(x) }
  }
  return out
}

// Collect the topic keys implied by a category + a free-text string.
function topicsFor(cat, text) {
  const keys = []
  const catTopic = CAT_TOPIC[cat]
  if (catTopic) keys.push(catTopic)
  const hay = String(text || '')
  for (const [re, topic] of KEYWORD_TOPICS) {
    if (re.test(hay)) keys.push(topic)
  }
  return dedupe(keys)
}

// Merge company lists for a set of topic keys. We interleave a little so the
// first company of each matched topic surfaces early, rather than dumping the
// whole first topic before the second.
function companiesForTopics(keys) {
  const lists = keys.map(k => TOPIC_COMPANIES[k]).filter(Boolean)
  if (lists.length === 0) return []
  const merged = []
  const maxLen = Math.max(...lists.map(l => l.length))
  for (let i = 0; i < maxLen; i++) {
    for (const l of lists) {
      if (i < l.length) merged.push(l[i])
    }
  }
  return dedupe(merged)
}

// Public: ordered, de-duplicated company names for an interview question.
// Pins q.company first when it is a real (non-'Any') company.
export function companiesForQuestion(q) {
  if (!q) return []
  const front = []
  if (q.company && q.company !== 'Any' && q.company !== 'Other / Not listed') {
    front.push(q.company)
  }
  const keys = topicsFor(q.cat, q.q)
  let names = companiesForTopics(keys)
  if (names.length === 0) {
    // Fallback cluster — broadly-recognised ML employers.
    names = ['Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix']
  }
  const merged = dedupe([...front, ...names])
  return merged.slice(0, 8)
}

// Public: ordered, de-duplicated company names for an incident.
// Incidents carry a `domain` string (e.g. "Cross-domain: Feature Eng → Serving")
// and a `title`; we scan both plus, when present, the situation text.
export function companiesForIncident(inc) {
  if (!inc) return []
  const text = [inc.domain, inc.title, inc.situation].filter(Boolean).join(' ')
  const keys = topicsFor(null, text)
  let names = companiesForTopics(keys)
  if (names.length === 0) {
    names = ['Google', 'Uber', 'Netflix', 'Meta', 'DoorDash']
  }
  return dedupe(names).slice(0, 8)
}
