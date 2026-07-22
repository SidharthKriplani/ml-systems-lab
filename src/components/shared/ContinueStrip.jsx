// ContinueStrip — "Continue where you left off" card for ProgressTab.
// Reads utils/lastTouched.js (written by each of the 19 foundation tabs on
// module open) and deep-links back via onNavigate(tabId, moduleId) — the
// same App.jsx goTo(tabId, openTarget) contract every other deep-link in
// MSL already uses.
import { getLastTouched } from '../../utils/lastTouched.js'

export default function ContinueStrip({ onNavigate }) {
  const info = getLastTouched()
  if (!info) return null

  return (
    <div
      onClick={() => onNavigate && onNavigate(info.tabId, info.moduleId)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--rim)',
        borderRadius: '12px',
        padding: '0.9rem 1.1rem',
        marginBottom: '1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rim-hi)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)' }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
          Continue
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink-hi)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {info.title || info.moduleId}
        </div>
      </div>
      <span style={{ color: 'var(--prime)', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>Resume &rarr;</span>
    </div>
  )
}
