import { useState } from 'react'
import IncidentRoomTab from './IncidentRoomTab.jsx'
import CaseStudiesTab from './CaseStudiesTab.jsx'

// Unified "Case Room" entry over the two scenario-diagnosis pools:
//   • Cross-domain incidents → multi-step production incidents, branching findings (IncidentRoomTab)
//   • Company cases          → company scenarios (Netflix/Uber/Airbnb…), MCQ + open (CaseStudiesTab)
// One nav item, one mental model ("reason a scenario down to its root"), two payloads.
// Underlying renderers unchanged — this only unifies the entry point.

export default function CaseRoomTab({ onNavigate, openModuleId }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('msl_caseroom_mode') || 'incident' } catch { return 'incident' }
  })

  const pick = (m) => {
    setMode(m)
    try { localStorage.setItem('msl_caseroom_mode', m) } catch {}
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
          <button style={seg(mode === 'incident')} onClick={() => pick('incident')}>
            Cross-domain incidents
          </button>
          <button style={seg(mode === 'company')} onClick={() => pick('company')}>
            Company cases
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-low)', margin: '0 0 8px', lineHeight: 1.5 }}>
          {mode === 'incident'
            ? 'Multi-step production incidents crossing Feature Eng, Monitoring, Serving, and Experimentation — diagnose to the root, each fix surfacing the next.'
            : 'Company scenarios (Netflix, Uber, Airbnb, DoorDash, Spotify) — reason through the design and defend your calls.'}
        </p>
      </div>
      {mode === 'incident'
        ? <IncidentRoomTab onNavigate={onNavigate} />
        : <CaseStudiesTab onNavigate={onNavigate} openModuleId={openModuleId} />}
    </div>
  )
}
