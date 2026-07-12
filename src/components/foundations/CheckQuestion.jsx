// src/components/foundations/CheckQuestion.jsx — shared Quick-Check quiz component.
// Extracted 2026-07-08 from the 19 near-identical copies duplicated across
// src/tabs/foundations/*FoundationTab.jsx (one per foundation family). All 19 now import this
// instead of defining their own local `CheckQuestion`. Behavior for existing single-select
// questions (`answer: 'A'|'B'|'C'|'D'`) is unchanged. New: `answer` may also be an array of
// letters (e.g. `['A','C']`) for a "Select all that apply" multi-select question — checkbox UI,
// exact-set grading. Data files' `checkQuestions` schema otherwise unchanged.
//
// 2026-07-12: single-select no longer auto-reveals on click (previously clicking an option
// immediately set submitted=true, coloring it green/red instantly with no explicit action).
// Both single- and multi-select now require pressing "Check answer" before revealing
// correct/incorrect, matching GSL's FoundationsRunner QuestionBlock behavior. Added an optional
// `onSubmit` callback (fires once, the moment a question is checked) and a new
// `CheckQuestionsBlock` wrapper that uses it to track "has every check question in this module
// been attempted" for the Mark-complete gate (see each *FoundationTab.jsx's MarkDoneButton).
import { useState, useEffect } from 'react'
import { renderMd } from '../../utils/renderMd'

export function CheckQuestion({ q, options, answer, onSubmit }) {
  const isMulti = Array.isArray(answer)
  const [selected, setSelected] = useState(isMulti ? [] : null)
  const [submitted, setSubmitted] = useState(false)
  const letters = ['A', 'B', 'C', 'D']

  function toggle(letter) {
    if (submitted) return
    if (isMulti) {
      setSelected(prev => prev.includes(letter) ? prev.filter(l => l !== letter) : [...prev, letter].sort())
    } else {
      setSelected(letter)
    }
  }

  function check() {
    if (submitted) return
    if (isMulti ? selected.length === 0 : selected === null) return
    setSubmitted(true)
    onSubmit?.()
  }

  const revealed = submitted
  const canSubmit = isMulti ? selected.length > 0 : selected !== null

  return (
    <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--rim)' }}>
      {renderMd(q, { fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '0.65rem', lineHeight: 1.5 })}
      {isMulti && !revealed && (
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          Select all that apply
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {options?.map((opt, i) => {
          const letter = letters[i]
          const isCorrect = isMulti ? answer.includes(letter) : letter === answer
          const isChosen = isMulti ? selected.includes(letter) : selected === letter
          let bg = 'transparent'
          let border = '1px solid var(--rim)'
          let color = 'var(--ink-mid)'
          if (revealed) {
            if (isChosen && isCorrect)  { bg = 'rgba(34,197,94,0.12)'; border = '1px solid rgba(34,197,94,0.5)'; color = 'var(--ink-hi)' }
            if (isChosen && !isCorrect) { bg = 'rgba(239,68,68,0.1)';  border = '1px solid rgba(239,68,68,0.4)';  color = 'var(--ink-hi)' }
            if (!isChosen && isCorrect) { bg = 'rgba(34,197,94,0.08)'; border = '1px solid rgba(34,197,94,0.35)'; color = 'var(--ink-mid)' }
          } else if (isChosen) {
            bg = 'var(--surface)'
          }
          return (
            <div
              key={letter}
              onClick={() => toggle(letter)}
              style={{
                padding: '0.5rem 0.75rem', borderRadius: '7px', cursor: revealed ? 'default' : 'pointer',
                background: bg, border, color, fontSize: '0.85rem', lineHeight: 1.5, transition: 'all 0.15s',
                display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
              }}
              onMouseEnter={e => { if (!revealed) e.currentTarget.style.background = 'var(--surface)' }}
              onMouseLeave={e => { if (!revealed && !isChosen) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontWeight: 700, flexShrink: 0, opacity: 0.7 }}>{isMulti ? (isChosen ? '☑' : '☐') : letter}</span>
              {renderMd(opt.replace(/^`?[ABCD]\)\s*/, '').replace(/`$/, ''), {})}
            </div>
          )
        })}
      </div>
      {!revealed && (
        <button
          onClick={check}
          disabled={!canSubmit}
          style={{ marginTop: '0.6rem', fontSize: '0.78rem', fontWeight: 700, color: canSubmit ? 'var(--prime)' : 'var(--ink-low)',
            background: 'none', border: `1px solid ${canSubmit ? 'var(--prime)' : 'var(--rim)'}`, borderRadius: '5px',
            padding: '0.3rem 0.7rem', cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-sans)' }}>
          Check answer
        </button>
      )}
      {revealed && (
        <button
          onClick={() => { setSelected(isMulti ? [] : null); setSubmitted(false) }}
          style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--ink-low)', background: 'none',
            border: '1px solid var(--rim)', borderRadius: '5px', padding: '0.25rem 0.6rem',
            cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Try again
        </button>
      )}
    </div>
  )
}

// CheckQuestionsBlock — renders every check question for the currently open module and reports,
// via onAllAnsweredChange, whether all of them have been checked at least once ("attempted" is
// sticky — pressing "Try again" on an individual question does not un-attempt it). Give it
// `key={selected.id}` at the call site so switching modules remounts it with a fresh answered-set
// instead of carrying over the previous module's progress.
export function CheckQuestionsBlock({ checkQuestions, onAllAnsweredChange }) {
  const [answeredIdx, setAnsweredIdx] = useState(() => new Set())

  useEffect(() => {
    onAllAnsweredChange?.(checkQuestions.length > 0 && answeredIdx.size === checkQuestions.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answeredIdx, checkQuestions.length])

  return checkQuestions.map((cq, i) => (
    <CheckQuestion
      key={i}
      q={cq.q}
      options={cq.options}
      answer={cq.answer}
      onSubmit={() => setAnsweredIdx(prev => (prev.has(i) ? prev : new Set(prev).add(i)))}
    />
  ))
}
