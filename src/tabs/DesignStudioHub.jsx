import { useState } from 'react'
import DesignStudioTab from './DesignStudioTab.jsx'
import SystemDesignDrills from './SystemDesignDrills.jsx'

// Unified "Design Studio" entry over the two produce-then-self-critique pools:
//   • Artifact briefs -> produce an artifact, self-critique vs reference + rubric (DesignStudioTab)
//   • System design   -> 5-stage system-design scenarios, self-rate coverage (SystemDesignDrills)
// Surfaces the previously-unwired SystemDesignDrills. Renderers unchanged.

export default function DesignStudioHub() {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('msl_designstudio_mode') || 'briefs' } catch { return 'briefs' }
  })
  const pick = (m) => { setMode(m); try { localStorage.setItem('msl_designstudio_mode', m) } catch {} }
  const seg = (active) => ({
    flex: 1, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: 'none', background: active ? 'var(--prime)' : 'transparent',
    color: active ? '#000' : 'var(--ink-mid)', transition: 'background 0.15s',
  })
  return (
    <div>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '8px 4px 0' }}>
        <div style={{ display: 'flex', border: '1px solid var(--rim)', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)', marginBottom: 4 }}>
          <button style={seg(mode === 'briefs')} onClick={() => pick('briefs')}>Artifact briefs</button>
          <button style={seg(mode === 'sysdesign')} onClick={() => pick('sysdesign')}>System design</button>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--ink-low)', margin: '0 0 8px', lineHeight: 1.5 }}>
          {mode === 'briefs'
            ? 'Produce the artifact yourself, then self-critique it against a reference and rubric.'
            : 'Work a system-design scenario through five stages from memory, then self-rate against the model coverage.'}
        </p>
      </div>
      {mode === 'briefs' ? <DesignStudioTab /> : <SystemDesignDrills />}
    </div>
  )
}
