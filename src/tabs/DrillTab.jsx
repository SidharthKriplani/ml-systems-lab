import { useState } from 'react'
import TrainerTab from './TrainerTab.jsx'
import CombinatorTab from './CombinatorTab.jsx'

// Merged entry for the two drill modes over the same question bank:
//   • Untimed practice  → spaced-repetition drill + weakness heatmap (TrainerTab)
//   • Timed exam        → mixed-domain mock under a clock (CombinatorTab)
// One nav item, one mental model ("drill the bank"), two modes. The underlying
// engines are unchanged — this only unifies the entry point.

export default function DrillTab({ onNavigate }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('msl_drill_mode') || 'practice' } catch { return 'practice' }
  })

  const pick = (m) => {
    setMode(m)
    try { localStorage.setItem('msl_drill_mode', m) } catch {}
  }

  const seg = (active) => ({
    flex: 1,
    padding: '9px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: active ? 'var(--prime)' : 'transparent',
    color: active ? '#000' : 'var(--ink-mid)',
    transition: 'background 0.15s',
  })

  return (
    <div>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 4px 0' }}>
        <div style={{
          display: 'flex',
          border: '1px solid var(--rim)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--surface)',
          marginBottom: 4,
        }}>
          <button style={seg(mode === 'practice')} onClick={() => pick('practice')}>
            Untimed practice
          </button>
          <button style={seg(mode === 'timed')} onClick={() => pick('timed')}>
            Timed exam
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-low)', margin: '0 0 8px', lineHeight: 1.5 }}>
          {mode === 'practice'
            ? 'Spaced-repetition drill over the full question bank, with a weakness heatmap. No clock — build recall.'
            : 'Mixed-domain mock under a timer. Same bank, interview pressure — measure where you stand.'}
        </p>
      </div>
      {mode === 'practice'
        ? <TrainerTab onNavigate={onNavigate} />
        : <CombinatorTab onNavigate={onNavigate} />}
    </div>
  )
}
