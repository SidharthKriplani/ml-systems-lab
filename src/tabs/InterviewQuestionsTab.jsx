import { useState } from 'react'
import InterviewPrepTab from './InterviewPrepTab.jsx'
import { BehavioralBankTab } from './BehavioralBankTab.jsx'
import DefendYourProjectTab from './DefendYourProjectTab.jsx'

// Unified open-ended interview-question bank. One entry, three sharp modes,
// each rendered by its native engine:
//   Q&A            → filterable question bank + model answers (InterviewPrepTab)
//   Behavioral     → STAR-scaffolded behavioral (BehavioralBankTab)
//   Defend project → the project deep-dive round (DefendYourProjectTab)
// Timed practice / fluency → Drill; design judgment → JUDGE (not duplicated here).

const MODES = [
  { id: 'qa',        label: 'Q&A',            hint: 'Senior/staff questions with model answers — filter by topic, company, and level.' },
  { id: 'behavioral', label: 'Behavioral',    hint: 'STAR-scaffolded behavioral questions — what each round is testing.' },
  { id: 'defend',    label: 'Defend project', hint: 'The project deep-dive round — probes into your own work.' },
]

export default function InterviewQuestionsTab({ onNavigate }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('msl_iq_mode') || 'qa' } catch { return 'qa' }
  })
  const pick = (m) => {
    setMode(m)
    try { localStorage.setItem('msl_iq_mode', m) } catch {}
  }

  const active = MODES.find(m => m.id === mode) || MODES[0]

  const tab = (m) => ({
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid var(--rim)',
    borderRadius: 8,
    background: mode === m.id ? 'var(--prime)' : 'transparent',
    color: mode === m.id ? '#000' : 'var(--ink-mid)',
    whiteSpace: 'nowrap',
  })

  return (
    <div>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 4px 0' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {MODES.map(m => (
            <button key={m.id} style={tab(m)} onClick={() => pick(m.id)}>{m.label}</button>
          ))}
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-low)', margin: '0 0 8px', lineHeight: 1.5 }}>{active.hint}</p>
      </div>
      {mode === 'qa'         && <InterviewPrepTab onNavigate={onNavigate} />}
      {mode === 'behavioral' && <BehavioralBankTab />}
      {mode === 'defend'     && <DefendYourProjectTab />}
    </div>
  )
}
