import { useState } from 'react'

// The project deep-dive / "defend your work" round — a guaranteed part of every
// senior & staff loop. Not questions with model answers; prompts that probe YOUR
// own project decisions. Each card: what they're probing, strong-answer signals,
// and the common trap. Self-contained (no repo imports beyond React).

const PROMPTS = [
  {
    q: 'Walk me through a technical decision on your project you would make differently today.',
    probing: 'Self-awareness and growth — can you critique your own work without being defensive or self-flagellating.',
    signals: ['Names a specific decision and the constraint you had then', 'Explains what new information would change it', 'Owns the tradeoff instead of blaming tooling or teammates'],
    trap: 'Claiming you would change nothing — reads as no reflection, not as competence.',
  },
  {
    q: 'How did you measure the impact of this project? What would have told you it failed?',
    probing: 'Whether you tie ML work to a business outcome and define failure in advance.',
    signals: ['A concrete primary metric and how it moved (quantified)', 'A guardrail metric you watched so a win didn’t hide a harm', 'Pre-registered what "failure" looked like, not post-hoc'],
    trap: 'Only citing offline accuracy — no line to a metric anyone outside the team cares about.',
  },
  {
    q: 'Why this model? Defend it against a simpler baseline someone could have shipped in a day.',
    probing: 'Model-selection judgment and whether complexity was earned.',
    signals: ['States the baseline and its actual number', 'Justifies added complexity by the marginal gain vs serving/maintenance cost', 'Willing to say the simple model was the right first ship'],
    trap: 'Reaching for the most complex model to look sophisticated, with no baseline comparison.',
  },
  {
    q: 'What was the hardest bug or failure in production, and how did you find it?',
    probing: 'Debugging methodology under real conditions — not whether things broke, but how you reason.',
    signals: ['A structured hypothesis-narrowing story, not luck', 'Checked data/inputs before blaming the model', 'A guardrail or test you added so the class of bug can’t recur'],
    trap: 'A vague "we retrained and it fixed itself" — no root cause, no learning.',
  },
  {
    q: 'Where does this system break at 10× the scale or traffic?',
    probing: 'Whether you understand your system’s limits and think past the happy path.',
    signals: ['Names the binding constraint (latency, retrieval recall, feature freshness, cost)', 'Distinguishes what scales linearly vs what falls over', 'Has a concrete next-step mitigation'],
    trap: 'Insisting it just scales — signals you never stress-tested it.',
  },
  {
    q: 'What did you deliberately NOT do, and why?',
    probing: 'Scoping and prioritization judgment — knowing what to cut is a senior signal.',
    signals: ['A conscious cut tied to time/impact, not an oversight', 'Explains what would make you revisit it', 'Shows the cut was communicated, not hidden'],
    trap: 'Framing every cut as "we ran out of time" — reads as poor planning, not judgment.',
  },
  {
    q: 'Who disagreed with your approach, and how did you handle it?',
    probing: 'Collaboration and the ability to hold a position with evidence — or update on it.',
    signals: ['A real disagreement with a named tradeoff', 'How you used data or a small experiment to resolve it', 'Willing to describe a time you were the one who updated'],
    trap: 'No disagreement ever — implies you worked alone or steamrolled people.',
  },
  {
    q: 'If you had to hand this project to a new team tomorrow, what would break or get lost?',
    probing: 'Ownership beyond the model — documentation, monitoring, and operational maturity.',
    signals: ['Names the tacit knowledge and where it lives (or doesn’t)', 'Points to monitoring/runbooks that would catch drift', 'Honest about the bus-factor risks'],
    trap: 'Saying it’s all self-explanatory — no system is, and interviewers know it.',
  },
]

export default function DefendYourProjectTab() {
  const [open, setOpen] = useState(null)

  const s = {
    wrap: { maxWidth: 820, margin: '0 auto', padding: '4px 4px 40px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans, sans-serif)' },
    intro: { fontSize: 13.5, color: 'var(--ink-mid)', lineHeight: 1.6, margin: '0 0 18px' },
    card: { background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 10, marginBottom: 10, overflow: 'hidden' },
    qBtn: { width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--ink-hi)', fontSize: 15, fontWeight: 600, padding: '15px 18px', cursor: 'pointer', lineHeight: 1.4 },
    body: { padding: '0 18px 16px', fontSize: 13.5, lineHeight: 1.6 },
    label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--prime)', margin: '12px 0 5px' },
    li: { color: 'var(--ink-mid)', margin: '3px 0' },
    trap: { color: 'var(--ink-mid)', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 6, padding: '8px 12px', marginTop: 10, fontSize: 13 },
  }

  return (
    <div style={s.wrap}>
      <p style={s.intro}>
        The project deep-dive round every senior/staff loop runs. These probe <strong>your own work</strong> —
        rehearse a real project against each. Strong answers quantify, own tradeoffs, and say what you’d do differently.
      </p>
      {PROMPTS.map((p, i) => (
        <div key={i} style={s.card}>
          <button style={s.qBtn} onClick={() => setOpen(open === i ? null : i)}>
            {p.q}
          </button>
          {open === i && (
            <div style={s.body}>
              <div style={s.label}>What they’re probing</div>
              <div style={{ color: 'var(--ink-mid)' }}>{p.probing}</div>
              <div style={s.label}>Strong-answer signals</div>
              {p.signals.map((x, j) => <div key={j} style={s.li}>▹ {x}</div>)}
              <div style={s.trap}><strong style={{ color: 'var(--ink-hi)' }}>Common trap:</strong> {p.trap}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
