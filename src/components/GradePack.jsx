import { useState } from 'react'

// GradePack — interactive attempt -> self-score -> BYO-LLM grade-pack export.
// No in-app LLM: the learner writes their answer, self-scores against the anchored
// rubric, then exports a portable prompt (answer + reference + anchored checklist +
// calibration/red-team/no-research instructions) to paste into ANY LLM for a graded,
// adversarial report. The checklist anchors ARE the market bar.

const PRIME = 'var(--prime, #f59e0b)'
const MARKS = [
  { id: 'hit', label: 'Hit', color: '#34d399' },
  { id: 'partial', label: 'Partial', color: '#fbbf24' },
  { id: 'miss', label: 'Miss', color: '#fb7185' },
]

function buildGradePack(brief, answer) {
  const role = brief.difficulty === 'staff' ? 'STAFF' : 'SENIOR'
  const rubric = brief.rubric || []
  const checklist = rubric
    .map((r, i) => `${i + 1}. ${r.dim} | anchor: ${r.anchor} | cost if missed: ${r.cost}`)
    .join('\n')
  const reference = brief.reference && brief.reference.worked
    ? brief.reference.worked
    : brief.reference && brief.reference.type
    ? `(reference type: ${brief.reference.type} — may be partial; anchor on the checklist)`
    : '(no reference provided — anchor strictly on the checklist)'
  return `You are a skeptical ${role} engineer at a top product company, grading a candidate's answer to the design problem below. Calibrate to that bar:
 - strong-hire = clears EVERY checklist anchor AND names the key tradeoff
 - hire        = clears all but one anchor
 - lean-no     = misses one anchor OR hand-waves the central tradeoff
 - no-hire     = misses >= 2 anchors
Do NOT be encouraging. Do NOT grade harshly for its own sake. Grade REALISTICALLY against the checklist below — the checklist IS the market bar; do not invent your own. Do NOT browse or research; grade only against the material provided here.

[PROBLEM]
${brief.prompt || brief.title}
${brief.context ? 'Context: ' + brief.context : ''}

[WHAT A STRONG ANSWER PRODUCES]
${brief.produce && brief.produce.artifact ? brief.produce.artifact : 'A complete design / decision doc.'}

[CANDIDATE ANSWER]
${answer.trim() || '(the candidate left this blank)'}

[REFERENCE]
${reference}

[CHECKLIST]  (dim | anchor = the concrete thing the answer must show | cost if missed)
${checklist || '(none)'}

Do, in order:
1. GRADE — for each checklist item, mark hit / partial / miss, citing the exact line of the candidate answer as evidence (or noting its absence).
2. RED-TEAM — attack the single weakest assumption in the answer, then list the 3 sharpest follow-up questions a ${role.toLowerCase()} interviewer would fire next.
3. VERDICT — the hire-signal above, plus the top 2 gaps to fix first.
4. OUTPUT the final line exactly as: SCORE: x/${rubric.length} | SIGNAL: <band> | GAPS: <a>; <b>`
}

export default function GradePack({ brief }) {
  const key = `msl_gradepack_${brief.id}`
  const [answer, setAnswer] = useState(() => {
    try { return localStorage.getItem(key) || '' } catch { return '' }
  })
  const [scores, setScores] = useState({})
  const [copied, setCopied] = useState(false)
  const [showPack, setShowPack] = useState(false)

  if (!brief.rubric || !brief.rubric.length) return null

  const onAnswer = (v) => {
    setAnswer(v)
    try { localStorage.setItem(key, v) } catch {}
  }
  const pack = buildGradePack(brief, answer)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pack)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setShowPack(true)
    }
  }

  return (
    <div style={{ border: '1px solid #27272a', borderRadius: 10, padding: '0.9rem', marginTop: '0.5rem' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fafafa', marginBottom: 6 }}>Attempt → self-score → grade</div>
      <textarea
        value={answer}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Write your design from scratch — no peeking. Then self-score each anchor below and export a grade pack to run through any LLM."
        rows={8}
        style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#e4e4e7', fontSize: '0.82rem', lineHeight: 1.5, padding: '0.6rem', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
      <div style={{ fontSize: '0.72rem', color: '#71717a', margin: '10px 0 4px' }}>Self-score each anchor honestly — you grade what you actually wrote:</div>
      {brief.rubric.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <div style={{ flex: 1, fontSize: '0.78rem', color: '#d4d4d8' }}>{r.dim}</div>
          {MARKS.map((m) => (
            <button key={m.id} onClick={() => setScores({ ...scores, [i]: m.id })}
              style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${scores[i] === m.id ? m.color : '#3f3f46'}`,
                background: scores[i] === m.id ? m.color + '22' : 'transparent',
                color: scores[i] === m.id ? m.color : '#a1a1aa' }}>
              {m.label}
            </button>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <button onClick={copy}
          style={{ fontSize: '0.78rem', fontWeight: 600, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', border: 'none', background: PRIME, color: '#000' }}>
          {copied ? 'Copied ✓' : 'Copy grade pack'}
        </button>
        <button onClick={() => setShowPack(!showPack)}
          style={{ fontSize: '0.75rem', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', border: '1px solid #3f3f46', background: 'transparent', color: '#a1a1aa' }}>
          {showPack ? 'Hide preview' : 'Preview'}
        </button>
        <span style={{ fontSize: '0.68rem', color: '#52525b' }}>Paste into any LLM (free is fine) for an adversarial graded report.</span>
      </div>
      {showPack && (
        <pre style={{ marginTop: 10, background: '#09090b', border: '1px solid #27272a', borderRadius: 8, padding: '0.6rem', color: '#a1a1aa', fontSize: '0.7rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', maxHeight: 320, overflow: 'auto' }}>{pack}</pre>
      )}
    </div>
  )
}
