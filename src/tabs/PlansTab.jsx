import { useState } from 'react'
import { ACCESS_CODE, STORAGE_KEY, isUnlocked } from '../utils/unlock.js'
import { authEnabled } from '../utils/supabase.js'

// ── PlansTab — conversion surface (PAL 3-tier model) ─────────────────────────
//
// Tiers (from MONETIZATION.md):
//   Guest     — no code, no account: free modules only (isFree scenarios)
//   Free      — future auth tier: same as guest until Supabase ships
//   Full Lab  — access code: everything unlocked permanently
//
// PAL reference: "Try a real case for free. Sign in to build a practice habit.
// Unlock to prep like you're already in the room."

const WHATSAPP_LINK = 'https://chat.whatsapp.com/KqFoGxAW0XMF9hNllGyAo9'
const FOUNDER_WA    = 'https://wa.me/917838438784'

const TRAINER_PROMPT = `You are my dedicated interview-prep trainer, mentor, evaluator, and prep manager.
Your job is not only to answer questions. Your job is to run my interview preparation as a structured, traceable operating system.
I do not want to manage the prep system manually. You own the prep ledger, choose the next best drill, score my answers, repair weaknesses, update progress, and tell me exactly what to do next.
My job is only this:
Answer one active question at a time.
────────────────────────────────────────────
CORE OPERATING PRINCIPLE
────────────────────────────────────────────
Use a living "Interview Prep Observability Trace."
Every case, question, or drill must become a traceable unit:
Not Started → Attempted → Scored → Repaired → Retested → Green → Revision Ready
Do not let the prep become messy or scattered. Maintain lineage.
After every scored drill, track:
- What was asked
- My answer quality
- Score
- Time taken
- What was strong
- What was weak
- Bridge to target score
- Final answer spine
- Pressure follow-ups
- Next action
However, do not update the full trace after every micro-attempt unless required by the trace update rules.
────────────────────────────────────────────
ASSISTANT CONTROL RULE
────────────────────────────────────────────
You control the preparation.
Do not keep asking me what to do next.
You choose the next best drill based on:
- Interview context
- Weakest open case
- Highest-probability interview topic
- Lowest score
- Time remaining
- Importance of the case type
- Progress dashboard
- Remaining high-priority cases
- Score velocity
- Response-time trend
Only ask me to choose when two options are equally important.
────────────────────────────────────────────
SESSION FLOW
────────────────────────────────────────────
The preparation runs in sessions.
At the start of a session, I may say:
SESSION START
If I paste an existing trace:
1. Read the trace.
2. Identify current readiness.
3. Show the progress dashboard.
4. Pick the next highest-priority drill.
5. Ask me only that drill.
If I do not paste a trace:
1. Create a fresh trace.
2. Ask for company, role, round, and time available.
3. Build the Minimum Sufficient Case Set.
4. Show the starting progress dashboard.
5. Start the highest-priority drill.
During the session:
- Keep working notes internally.
- Score each valid timed attempt.
- Do not return the full trace after every micro-attempt.
- Return compact feedback unless a full trace update is triggered.
At the end of a session, I may say:
SESSION OVER
When I say SESSION OVER:
1. Ask me to paste the latest trace if I have not already pasted it.
2. Update the entire trace.
3. Return the full updated trace in one clean copy-pasteable code block.
4. Include latest scores, timing, statuses, progress, active weaknesses, and next recommended drill.
────────────────────────────────────────────
FULL TRACE UPDATE RULES
────────────────────────────────────────────
Do not update the full trace after every small attempt.
Update the full trace only when one of these happens:
1. I say SESSION OVER.
2. A case reaches the target score.
3. A case hits the max attempt cap for the current session.
4. A case meaningfully changes state (Red → Orange, Orange → Green, Green → Gold, Active → Capped, Active → Deferred).
5. A full pass is completed.
6. I explicitly ask for the full updated trace.
Between full trace updates, provide compact updates only:
- Latest score
- What improved
- What is still weak
- Bridge to target
- Next action
────────────────────────────────────────────
MANDATORY TIMING RULE
────────────────────────────────────────────
Every drill answer must be timed.
My answer must include either:
  duration_secs: [number]
  OR
  start_ts: [time] / end_ts: [time]
If timing is missing: do not score it. Tell me "Timing missing. Please retry with duration_secs or start_ts and end_ts." Then ask me to answer again.
Default spoken answer targets:
- RCA: 60–90 seconds
- Experiment design: 60–90 seconds
- Experiment readout: 60–90 seconds
- KPI framework: 60–90 seconds
- Behavioral answer: 90–120 seconds
- Technical explanation: 60–120 seconds
────────────────────────────────────────────
MAX ATTEMPT AND ANTI-MEMORIZATION RULE
────────────────────────────────────────────
Default max attempts per case per session:
- 1 initial attempt
- 2 repair attempts
- Maximum 3 total per case per session
After 3 attempts: stop, mark "Capped for Session," move to next highest-ROI case.
A case becomes Green only if I can answer cleanly without relying on immediate memorization.
────────────────────────────────────────────
BOUNDED AND COMPRESSED PREP RULE
────────────────────────────────────────────
At the start of prep, create a finite "Minimum Sufficient Case Set."
Define: total required cases, core cases, high-priority cases, optional stretch cases, current case number, cases completed, cases remaining.
Always keep the prep bounded around the smallest set of cases that makes me dangerous for the interview.
────────────────────────────────────────────
PROGRESS DASHBOARD RULE
────────────────────────────────────────────
After every meaningful case update, show a progress dashboard including:
1. Coverage Progress: Cases at target score / Total required cases
2. Attempt Progress: Attempted cases / Total required cases
3. Readiness estimate (score-weighted, rough range)
4. Remaining Work: cases left, Red/Orange/capped counts, estimated prep time
5. Active Case Gap: current score, target, gap, latest duration, target duration, main blocker
────────────────────────────────────────────
SCORING SYSTEM
────────────────────────────────────────────
Score each valid timed attempt out of 10.
- 0–4: Not interview-safe
- 5–6: Directionally okay but weak
- 7: Interview-safe with risk (Red)
- 8: Strong (Orange)
- 8.5: Very strong (Green threshold)
- 9: Dangerous / high-confidence (Gold)
- 9.5–10: Exceptional
A case is not done until it reaches at least 8.5/10. Core cases target 9/10.
────────────────────────────────────────────
REVISION PHASE
────────────────────────────────────────────
Enter Revision Phase when: overall readiness ~80%+, no Red cases, core cases average 8.5+, high-priority cases near 9+.
Revision scoring: target-9 cases pass revision at 8+. Any case dropping below 7 goes back into active repair.
────────────────────────────────────────────
GENERAL DRILL LOOP
────────────────────────────────────────────
For every case:
1. Select next highest-priority drill.
2. Ask me the question.
3. Require timing.
4. If timing missing, reject and ask for retry.
5. Score the valid timed answer strictly but fairly.
6. Identify what was strong / what was weak.
7. Explain the bridge to 8.5 or 9.
8. Give a repaired answer spine.
9. Ask one pressure follow-up if needed.
10. Track timing and score movement.
11. Decide: continue, cap, defer, mark Green, or move on.
12. Show progress dashboard when meaningful.
13. Tell me the next drill.
────────────────────────────────────────────
FEEDBACK STYLE
────────────────────────────────────────────
Be direct, practical, and strict. No vague reassurance. No fake consulting language.
Tell me what worked, what failed, why it failed, and what I should say instead.
Judge underlying logic before punishing spoken imperfections.
Be strict on: structure, metric clarity, decision quality, prioritization, trade-offs, final recommendation, follow-up survival, time.
────────────────────────────────────────────
CASE TYPES SUPPORTED
────────────────────────────────────────────
1. Business case / RCA
2. Product sense
3. KPI / metric design
4. Experiment design
5. Experiment readout
6. SQL / Python / coding
7. ML / statistics / data science
8. GenAI / LLM / AI systems
9. Resume defense
10. Behavioral / leadership
11. Hiring manager / director-level judgment
12. Company-specific strategy or domain cases
────────────────────────────────────────────
STARTING BEHAVIOR
────────────────────────────────────────────
If I paste an existing ledger: read it, show the dashboard, pick the next drill.
If I do not paste a ledger: create v0.1, ask for company/role/round/time, build the Minimum Sufficient Case Set, start the highest-priority drill.
Always require timing for my answer.
────────────────────────────────────────────
IMPORTANT
────────────────────────────────────────────
This is not a notes document. This is an interview-prep control system.
Reduce my decision fatigue. Increase my interview performance.
Keep the work bounded, compressed, scored, timed, and traceable.
Keep me moving one unit at a time.`

// Feature comparison table
// value: true=✓  null=—  string=custom
const TABLE_ROWS = [
  { label: 'Practice scenarios',           guest: 'Junior only',   free: 'Junior only',    full: 'All 300+' },
  { label: 'Difficulty progression',       guest: 'Junior',        free: 'Junior',         full: 'Junior → Staff' },
  { label: 'Progress & streak',            guest: true,            free: true,             full: true },
  { label: 'Gradient — 50 production essays', guest: true,         free: true,             full: true },
  { label: 'Defense Plan (free tool)',     guest: true,            free: true,             full: true },
  { label: 'Math Foundations (4 modules)', guest: true,            free: true,             full: true },
  { label: 'Feature Engineering (3 free)', guest: true,            free: true,             full: true },
  { label: 'Model Evaluation (1 free)',    guest: true,            free: true,             full: true },
  { label: 'Classical ML (6 free)',        guest: true,            free: true,             full: true },
  { label: 'Cross-device sync',           guest: null,            free: '(coming soon)',  full: '(coming soon)' },
  { label: 'Interview Q&A — 128 questions', guest: null,           free: null,             full: true },
  { label: 'Combinator timed exam',        guest: null,            free: null,             full: true },
  { label: 'Verbal Practice',             guest: null,            free: null,             full: true },
  { label: 'Incident Room (6 cases)',      guest: null,            free: null,             full: true },
  { label: 'ML Coding — live Pyodide',    guest: null,            free: null,             full: true },
  { label: 'Project Labs (3 notebooks)',  guest: null,            free: null,             full: true },
  { label: 'Staff Layer reveals',          guest: null,            free: null,             full: true },
  { label: 'Spot the Flaw',               guest: null,            free: null,             full: true },
  { label: 'Bug Hunt',                    guest: null,            free: null,             full: true },
  { label: 'System Design · Spark · dbt', guest: null,            free: null,             full: true },
  { label: 'Deep Learning suite',         guest: null,            free: null,             full: true },
  { label: 'Monitoring + Drift Lab',      guest: null,            free: null,             full: true },
]

function Check({ col }) {
  const color = col === 'full' ? 'var(--prime)' : col === 'free' ? 'var(--mint)' : 'var(--ink-mid)'
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function CellVal({ value, col }) {
  const highlight = col === 'full'
  const color = highlight ? 'var(--prime)' : col === 'free' ? 'var(--mint)' : 'var(--ink-low)'
  if (value === null) return <span style={{ color: 'var(--ink-ghost)' }}>—</span>
  if (value === true) return <Check col={col} />
  return <span style={{ fontSize: '11px', fontWeight: 600, color, fontFamily: 'var(--font-sans)' }}>{value}</span>
}

export default function PlansTab({ onNavigate, onShowAuth, user }) {
  const already = isUnlocked()
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState(false)
  const [done,    setDone]    = useState(false)
  const [copied,  setCopied]  = useState(false)
  const unlocked = already || done

  function handleCopyPrompt() {
    navigator.clipboard.writeText(TRAINER_PROMPT).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleUnlock(e) {
    e.preventDefault()
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      try { localStorage.setItem(STORAGE_KEY, ACCESS_CODE) } catch {}
      setDone(true)
      setTimeout(() => window.location.reload(), 1200)
    } else {
      setError(true)
      setTimeout(() => setError(false), 1800)
    }
  }

  const cardBase = {
    background: 'var(--depth)', border: '1px solid var(--rim)',
    borderRadius: '14px', padding: '28px 24px',
  }
  const cardHighlight = {
    ...cardBase,
    border: '1px solid rgba(240,165,0,0.5)',
    boxShadow: '0 0 0 1px rgba(240,165,0,0.12), 0 20px 60px rgba(0,0,0,0.5)',
    position: 'relative',
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '30px', fontWeight: 900, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1.1 }}>
          How you want to prepare
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
          Try junior scenarios free, no account needed. Get a code to unlock the full lab — every scenario, every tool, every Project Lab — permanently on this device.
        </p>
      </div>

      {/* 3-tier cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px,100%),1fr))', gap: '16px', marginBottom: '40px' }}>

        {/* Guest */}
        <div style={cardBase}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '10px' }}>Guest</div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.2 }}>
            Try it, no account
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 24px' }}>
            Junior scenarios across four free modules — Feature Engineering, Model Evaluation, Classical ML, and Math Foundations — before deciding if MSL is worth your time.
          </p>
          <button
            onClick={() => onNavigate('classical')}
            style={{ width: '100%', padding: '10px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '8px', color: 'var(--ink-mid)', cursor: 'pointer' }}
          >
            Try a free scenario →
          </button>
        </div>

        {/* Free account — coming soon, highlighted as "start here" */}
        <div style={{ ...cardBase, border: '1px solid rgba(52,211,153,0.35)', boxShadow: '0 0 0 1px rgba(52,211,153,0.08)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-1px', left: '24px', background: 'var(--mint)', color: '#0a1628', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px', borderRadius: '0 0 6px 6px' }}>
            Coming soon
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '10px', marginTop: '10px' }}>Free account</div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.2 }}>
            Build your practice habit
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 24px' }}>
            Every scenario you complete gets saved. Return any day and pick up where you left off — the streak tells you if you're actually being consistent. Cross-device sync via sign-in.
          </p>
          {user ? (
            <div style={{ width: '100%', padding: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', color: 'var(--mint)', textAlign: 'center' }}>
              ✓ Signed in as {user.email}
            </div>
          ) : authEnabled ? (
            <button onClick={onShowAuth} style={{ width: '100%', padding: '10px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', color: 'var(--mint)', cursor: 'pointer' }}>
              Sign in — it's free →
            </button>
          ) : (
            <div style={{ width: '100%', padding: '10px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '8px', color: 'var(--mint)', textAlign: 'center', opacity: 0.6 }}>
              Sign in — coming soon
            </div>
          )}
        </div>

        {/* Full Lab */}
        <div style={cardHighlight}>
          <div style={{ position: 'absolute', top: '-1px', left: '24px', background: 'var(--prime)', color: 'var(--depth)', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 10px', borderRadius: '0 0 6px 6px' }}>
            Full Lab
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '10px', marginTop: '10px' }}>Access code</div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.2 }}>
            Prep like you're already in the room
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 16px' }}>
            One code unlocks everything — full case depth, Junior to Staff difficulty, all interview simulation tools, live coding, and three end-to-end Project Labs.
          </p>

          {unlocked ? (
            <div style={{ padding: '11px 14px', marginBottom: '12px', background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.30)', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--prime)', textAlign: 'center' }}>
              {done ? 'Unlocked — reloading…' : '✓ Full lab unlocked on this device'}
            </div>
          ) : (
            <form onSubmit={handleUnlock} style={{ marginBottom: '12px' }}>
              <input
                type="text" value={code} onChange={e => setCode(e.target.value)}
                placeholder="Enter access code"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: `1px solid ${error ? 'var(--rose)' : 'var(--rim-hi)'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--ink-hi)', outline: 'none', letterSpacing: '0.06em', marginBottom: '8px', transition: 'border-color 0.15s' }}
              />
              {error && <p style={{ fontSize: '11px', color: 'var(--rose)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>Incorrect code. Try again.</p>}
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px', fontSize: '13px' }}>
                Unlock the full lab →
              </button>
            </form>
          )}

          <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: 0, textAlign: 'center' }}>
            No code?{' '}
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--prime)', textDecoration: 'none' }}>Join the beta group</a>
            {' '}or{' '}
            <a href={FOUNDER_WA} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--prime)', textDecoration: 'none' }}>DM the founder</a>
          </p>
        </div>

      </div>

      {/* Feature table */}
      <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { label: 'Feature', align: 'left', col: null },
                { label: 'Guest', align: 'center', col: 'guest' },
                { label: 'Free account', align: 'center', col: 'free' },
                { label: 'Full Lab', align: 'center', col: 'full' },
              ].map(h => (
                <th key={h.label} style={{
                  padding: '11px 14px', textAlign: h.align,
                  fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                  color: h.col === 'full' ? 'var(--prime)' : h.col === 'free' ? 'var(--mint)' : 'var(--ink-ghost)',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  borderBottom: '1px solid var(--rim)',
                  background: h.col === 'full' ? 'rgba(240,165,0,0.05)' : h.col === 'free' ? 'rgba(52,211,153,0.04)' : 'rgba(0,0,0,0.12)',
                  width: h.col ? '130px' : undefined,
                }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row, i) => (
              <tr key={row.label}>
                <td style={{ padding: '10px 14px', borderBottom: i < TABLE_ROWS.length - 1 ? '1px solid var(--rim)' : 'none', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-low)' }}>
                  {row.label}
                </td>
                {(['guest','free','full']).map(col => (
                  <td key={col} style={{
                    padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle',
                    borderBottom: i < TABLE_ROWS.length - 1 ? '1px solid var(--rim)' : 'none',
                    background: col === 'full' ? 'rgba(240,165,0,0.03)' : col === 'free' ? 'rgba(52,211,153,0.02)' : 'transparent',
                  }}>
                    <CellVal value={row[col]} col={col} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Free Resource — Interview Trainer Prompt */}
      <div style={{ marginTop: '32px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '14px', padding: '28px 24px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '10px' }}>Free resource</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.2 }}>
              Interview Trainer Prompt
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.65, margin: '0 0 6px' }}>
              A complete prep control system — not a template. Give it to Claude or ChatGPT along with your resume and the JD. It builds your case set, scores every timed answer, tracks a versioned ledger, and tells you exactly what to drill next. You focus on one answer at a time.
            </p>
            <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', margin: 0 }}>
              Works best with Claude Sonnet or GPT-4o · No signup · Just paste and go
            </p>
          </div>
          <button
            onClick={handleCopyPrompt}
            style={{
              flexShrink: 0, alignSelf: 'center',
              padding: '10px 20px', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700,
              background: copied ? 'rgba(240,165,0,0.12)' : 'var(--surface)',
              border: `1px solid ${copied ? 'rgba(240,165,0,0.4)' : 'var(--rim-hi)'}`,
              borderRadius: '8px', color: copied ? 'var(--prime)' : 'var(--ink-mid)',
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy prompt →'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', lineHeight: 1.8, margin: 0 }}>
          Junior scenarios always free · No account required · One code unlocks everything permanently
          <br/>
          Stripe payments coming soon · Questions?{' '}
          <a href={FOUNDER_WA} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--prime)', textDecoration: 'none' }}>DM on WhatsApp</a>
        </p>
      </div>

    </div>
  )
}
