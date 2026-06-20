import { useState } from 'react'
import { readFoundationsRead, overallCompletion, FOUNDATIONS_TIERS } from '../data/foundationsPath.js'

// Signal map — scan a JD for keywords that route to MSL Tiers + topic emphasis.
const SIGNAL_MAP = {
  // Production engineering
  'training-serving skew':   { tier: 't7', weight: 3, topic: 'training-serving skew' },
  'feature store':           { tier: 't7', weight: 3, topic: 'feature stores' },
  'feature pipeline':        { tier: 't7', weight: 2, topic: 'feature pipelines' },
  'point-in-time':           { tier: 't7', weight: 3, topic: 'point-in-time correctness' },
  'real-time inference':     { tier: 't7', weight: 2, topic: 'serving latency' },
  'low latency':             { tier: 't7', weight: 2, topic: 'serving latency' },
  // Monitoring
  'monitoring':              { tier: 't8', weight: 3, topic: 'production monitoring' },
  'drift':                   { tier: 't8', weight: 3, topic: 'drift detection' },
  'retrain':                 { tier: 't8', weight: 2, topic: 'retraining cadence' },
  'mlops':                   { tier: 't8', weight: 3, topic: 'MLOps' },
  'model deployment':        { tier: 't8', weight: 2, topic: 'deployment' },
  // System design
  'system design':           { tier: 't9', weight: 3, topic: 'ML system design' },
  'recommendation system':   { tier: 't9', weight: 3, topic: 'recommendation systems' },
  'recsys':                  { tier: 't9', weight: 3, topic: 'recommendation systems' },
  'ranking':                 { tier: 't9', weight: 2, topic: 'ranking' },
  'retrieval':               { tier: 't9', weight: 2, topic: 'retrieval' },
  'two-tower':               { tier: 't9', weight: 3, topic: 'two-tower architecture' },
  'search':                  { tier: 't9', weight: 2, topic: 'search systems' },
  // Classical algorithms
  'xgboost':                 { tier: 't3', weight: 2, topic: 'gradient boosted trees' },
  'lightgbm':                { tier: 't3', weight: 2, topic: 'gradient boosted trees' },
  'gradient boosting':       { tier: 't3', weight: 2, topic: 'gradient boosted trees' },
  'random forest':           { tier: 't3', weight: 2, topic: 'random forests' },
  'class imbalance':         { tier: 't3', weight: 3, topic: 'class imbalance' },
  'smote':                   { tier: 't3', weight: 2, topic: 'class imbalance' },
  // Evaluation
  'evaluation':              { tier: 't5', weight: 2, topic: 'model evaluation' },
  'auc':                     { tier: 't5', weight: 2, topic: 'AUC and metric selection' },
  'precision':               { tier: 't5', weight: 2, topic: 'precision-recall' },
  'calibration':             { tier: 't5', weight: 3, topic: 'calibration' },
  'leakage':                 { tier: 't5', weight: 3, topic: 'data leakage' },
  // Domain
  'fraud':                   { tier: 't3', weight: 3, topic: 'fraud detection' },
  'risk':                    { tier: 't3', weight: 2, topic: 'risk modeling' },
  'recommendation':          { tier: 't9', weight: 3, topic: 'recommendations' },
  'time series':             { tier: 't6', weight: 3, topic: 'time series' },
  'forecasting':             { tier: 't6', weight: 2, topic: 'forecasting' },
  // Seniority
  'staff':                   { tier: 't10', weight: 3, topic: 'staff-level expectations' },
  'principal':               { tier: 't10', weight: 3, topic: 'principal-level expectations' },
  'senior':                  { tier: 't10', weight: 2, topic: 'senior MLE expectations' },
}

function scanJD(jdText) {
  const text = (jdText || '').toLowerCase()
  const signals = []
  for (const [keyword, meta] of Object.entries(SIGNAL_MAP)) {
    if (text.includes(keyword)) signals.push({ keyword, ...meta })
  }
  // Tier weights
  const tierWeights = {}
  for (const s of signals) {
    tierWeights[s.tier] = (tierWeights[s.tier] || 0) + s.weight
  }
  const topTiers = Object.entries(tierWeights).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tier]) => tier)
  const topics = [...new Set(signals.map(s => s.topic))].slice(0, 8)
  return { signals, topTiers, topics }
}

function detectRole(jdText) {
  const text = (jdText || '').toLowerCase()
  if (text.includes('staff') || text.includes('l6') || text.includes('l7')) return 'Staff ML Engineer'
  if (text.includes('principal')) return 'Principal ML Engineer'
  if (text.includes('senior') || text.includes('l5')) return 'Senior ML Engineer'
  if (text.includes('applied scientist')) return 'Applied Scientist'
  if (text.includes('ml engineer') || text.includes('mle')) return 'ML Engineer'
  if (text.includes('data scientist') || text.includes(' ds ')) return 'Data Scientist'
  if (text.includes('mlops')) return 'MLOps Engineer'
  return 'ML Engineer'
}

function detectCompany(jdText) {
  const text = jdText || ''
  const candidates = ['PhonePe', 'Razorpay', 'Flipkart', 'Swiggy', 'Meesho', 'Zomato', 'Dream11', 'InMobi', 'Google', 'Meta', 'Amazon', 'Netflix', 'Microsoft', 'Apple', 'Uber', 'Stripe', 'Airbnb']
  for (const c of candidates) {
    if (text.toLowerCase().includes(c.toLowerCase())) return c
  }
  return null
}

function readUserGapState() {
  const read = readFoundationsRead()
  const completion = overallCompletion(read)
  const tierStrength = {}
  for (const tier of FOUNDATIONS_TIERS) {
    const readyPosts = tier.posts.filter(p => p.status === 'ready' && p.postId)
    const readCount = readyPosts.filter(p => read.has(p.postId)).length
    tierStrength[tier.id] = readyPosts.length > 0 ? readCount / readyPosts.length : 0
  }
  return { read, completion, tierStrength }
}

function generatePrompt({ jdText, scan, role, company, gapState }) {
  const { topics, topTiers } = scan
  const { completion, tierStrength } = gapState
  const weakTiers = Object.entries(tierStrength)
    .filter(([id]) => topTiers.includes(id))
    .filter(([, strength]) => strength < 0.5)
    .map(([id]) => {
      const tier = FOUNDATIONS_TIERS.find(t => t.id === id)
      return tier ? tier.label : id
    })

  const lines = []
  lines.push('You are an expert senior ML engineering interviewer running a mock interview for a candidate.')
  lines.push('')
  lines.push('=== INTERVIEW CONTEXT ===')
  lines.push('')
  lines.push(`Role: ${role}${company ? ' at ' + company : ''}`)
  lines.push(`Round target: 60-minute mock loop covering ML fundamentals, system design, and production judgment.`)
  lines.push('')
  if (topics.length) {
    lines.push('Topics emphasised in the JD (focus interview questions here):')
    for (const t of topics) lines.push(`  - ${t}`)
    lines.push('')
  }
  if (weakTiers.length) {
    lines.push('Candidate has acknowledged weaker preparation in these areas — probe deeper here:')
    for (const w of weakTiers) lines.push(`  - ${w}`)
    lines.push('')
  }
  lines.push(`Candidate's MLE Path progress: ${completion.read} / ${completion.total} posts read (${Math.round((completion.read / Math.max(1, completion.total)) * 100)}%).`)
  lines.push('')
  lines.push('=== INTERVIEW RULES ===')
  lines.push('')
  lines.push('1. Ask ONE question at a time. Wait for the candidate to answer before continuing.')
  lines.push('2. Probe for production judgment after each answer. Common probes: "what breaks at scale", "what is the failure mode", "what would you monitor".')
  lines.push('3. If the candidate names a concept (e.g. "I would use XGBoost"), ask them to defend that choice against alternatives.')
  lines.push('4. Calibrate to a senior MLE bar. Reject answers that recite definitions without naming the production tell.')
  lines.push('5. After 6-8 questions, give them a 5-bullet feedback summary: strengths, weaknesses, what to study next, calibration vs the senior MLE bar, the question they answered worst.')
  lines.push('')
  lines.push('=== JOB DESCRIPTION ===')
  lines.push('')
  lines.push(jdText.trim() || '(no JD provided — use a generic senior MLE bar)')
  lines.push('')
  lines.push('=== START THE INTERVIEW ===')
  lines.push('')
  lines.push('Begin with question 1. After the candidate answers, follow up with one production-judgment probe before moving to question 2.')

  return lines.join('\n')
}

export default function MockInterviewTab({ onNavigate }) {
  const [jdText, setJdText] = useState('')
  const [generated, setGenerated] = useState(null)
  const [copied, setCopied] = useState(false)

  function handleGenerate() {
    const scan = scanJD(jdText)
    const role = detectRole(jdText)
    const company = detectCompany(jdText)
    const gapState = readUserGapState()
    const prompt = generatePrompt({ jdText, scan, role, company, gapState })
    setGenerated({ prompt, scan, role, company, gapState })
  }

  function copyPrompt() {
    if (!generated) return
    try {
      navigator.clipboard.writeText(generated.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {}
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 0 80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Mock Interview</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--ink-hi)', marginBottom: '10px', lineHeight: 1.15 }}>
          Paste a JD. Get an interviewer prompt calibrated to it.
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
          MSL scans your JD for the topics that round will probe, reads your MLE Path progress to find your weak areas, and generates a tailored interviewer system prompt. Paste it into Claude, ChatGPT, or any LLM. The interview takes ~60 minutes and ends with a calibrated feedback summary.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginTop: '12px', fontStyle: 'italic' }}>
          No backend. No API keys collected. Your JD and progress stay in your browser.
        </p>
      </div>

      <textarea
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        placeholder="Paste the full job description here. Include responsibilities, requirements, the company name if mentioned. The more text, the better the prompt."
        style={{
          width: '100%', minHeight: '220px', padding: '16px 18px', borderRadius: '10px',
          background: 'var(--depth)', border: '1px solid var(--rim)', color: 'var(--ink-hi)',
          fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: 1.6, resize: 'vertical',
          outline: 'none',
        }}
      />

      <button onClick={handleGenerate} disabled={jdText.trim().length < 50}
        style={{
          padding: '12px 22px', borderRadius: '8px', border: 'none',
          background: jdText.trim().length >= 50 ? 'var(--prime)' : 'rgba(240,165,0,0.25)',
          color: jdText.trim().length >= 50 ? 'var(--void)' : 'var(--ink-ghost)',
          fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700,
          cursor: jdText.trim().length >= 50 ? 'pointer' : 'not-allowed',
          alignSelf: 'flex-start',
        }}>
        Generate interviewer prompt →
      </button>

      {generated && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Summary card */}
          <div style={{ padding: '16px 18px', borderRadius: '10px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.18)' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 700 }}>
              How I read this JD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>
              <div><strong style={{ color: 'var(--ink-hi)' }}>Role:</strong> {generated.role}{generated.company ? ` at ${generated.company}` : ''}</div>
              {generated.scan.topics.length > 0 && (
                <div><strong style={{ color: 'var(--ink-hi)' }}>Topics emphasised:</strong> {generated.scan.topics.join(', ')}</div>
              )}
              {generated.scan.topTiers.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--ink-hi)' }}>MLE Path tiers in scope:</strong>{' '}
                  {generated.scan.topTiers.map(id => {
                    const t = FOUNDATIONS_TIERS.find(x => x.id === id)
                    return t ? t.label.replace(/^Tier \d+ — /, '') : id
                  }).join(' · ')}
                </div>
              )}
              <div>
                <strong style={{ color: 'var(--ink-hi)' }}>Your readiness:</strong>{' '}
                {generated.gapState.completion.read} / {generated.gapState.completion.total} path posts read
              </div>
            </div>
          </div>

          {/* Prompt block */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Interviewer prompt</div>
              <button onClick={copyPrompt}
                style={{ padding: '6px 14px', borderRadius: '7px', background: copied ? 'rgba(52,211,153,0.16)' : 'var(--prime)', color: copied ? 'var(--mint)' : 'var(--void)', border: copied ? '1px solid rgba(52,211,153,0.3)' : 'none', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>
                {copied ? '✓ Copied' : 'Copy to clipboard'}
              </button>
            </div>
            <pre style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '10px', padding: '16px 18px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowX: 'auto', margin: 0, maxHeight: '500px', overflowY: 'auto' }}>
              {generated.prompt}
            </pre>
          </div>

          {/* Next steps */}
          <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(0,0,0,0.18)', border: '1px solid var(--rim)' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 700 }}>How to run the interview</div>
            <ol style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0, paddingLeft: '20px' }}>
              <li>Paste the prompt above into Claude, ChatGPT, or any LLM as a system message.</li>
              <li>Reply as the candidate. Answer in voice or in text — whichever simulates the real round better.</li>
              <li>The interviewer will ask 6–8 questions and end with a calibrated feedback summary.</li>
              <li>Use the feedback to identify the MLE Path tiers worth re-reading before your real interview.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
