import { useState } from 'react'
import CodeBugsTab from './CodeBugsTab.jsx'
import SpotTheFlawTab from './SpotTheFlawTab.jsx'

// Unified "Defect Hunt" entry over the two defect-spotting pools:
//   • Code bugs      -> read code, find the buried bug (CodeBugsTab)
//   • Analysis flaws -> read an ML analysis, find the methodological flaw (SpotTheFlawTab)
// One nav item, one mental model, two payloads. Renderers unchanged.

export default function DefectHuntTab({ onNavigate, openModuleId }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('msl_defect_mode') || 'code' } catch { return 'code' }
  })
  const pick = (m) => { setMode(m); try { localStorage.setItem('msl_defect_mode', m) } catch {} }
  const seg = (active) => ({
    flex: 1, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: 'none', background: active ? 'var(--prime)' : 'transparent',
    color: active ? '#000' : 'var(--ink-mid)', transition: 'background 0.15s',
  })
  return (
    <div>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 4px 0' }}>
        <div style={{ display: 'flex', border: '1px solid var(--rim)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)', marginBottom: 4 }}>
          <button style={seg(mode === 'code')} onClick={() => pick('code')}>Code bugs</button>
          <button style={seg(mode === 'analysis')} onClick={() => pick('analysis')}>Analysis flaws</button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-low)', margin: '0 0 8px', lineHeight: 1.5 }}>
          {mode === 'code'
            ? 'Read the code, find the buried bug: ML/DL/pipeline defects that pass silently in review.'
            : 'Read a real ML analysis, find the one buried methodological flaw before the interviewer does.'}
        </p>
      </div>
      {mode === 'code'
        ? <CodeBugsTab onNavigate={onNavigate} openModuleId={openModuleId} />
        : <SpotTheFlawTab onNavigate={onNavigate} openModuleId={openModuleId} />}
    </div>
  )
}
