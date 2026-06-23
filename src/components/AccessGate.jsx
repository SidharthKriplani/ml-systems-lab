import { useState } from 'react'
import { BrandMark } from './BrandMark.jsx'
import { ACCESS_CODE, STORAGE_KEY } from '../utils/unlock.js'

// ── AccessGate ─────────────────────────────────────────────────────────────────
//
// Single gate component. Accepts surface-specific copy via props so every
// locked tab tells the user exactly what they're missing — outcome-framed,
// not feature-listed.
//
// Props:
//   onUnlock   fn(code) → called on successful unlock
//   title      string   → surface-specific headline (e.g. "Full Mock Exam")
//   body       string   → outcome-framed description (what they gain, not what they get)
//   ctaLabel   string   → button label (default "Get access →")

export default function AccessGate({
  onUnlock,
  title    = 'Premium content',
  body     = 'Advanced modules, interview simulation tools, mock exams, and verbal practice are behind an access code. Enter yours to unlock everything on this device.',
  ctaLabel = 'Get access →',
}) {
  const [code,       setCode]       = useState('')
  const [error,      setError]      = useState(false)
  const [showMoment, setShowMoment] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const entered = code.trim().toUpperCase()
    if (entered === ACCESS_CODE) {
      try { localStorage.setItem(STORAGE_KEY, ACCESS_CODE) } catch {}
      window.dispatchEvent(new CustomEvent('msl-unlock'))
      setShowMoment(true)
      setTimeout(() => onUnlock(entered), 1300)
    } else {
      setError(true)
      setTimeout(() => setError(false), 1800)
    }
  }

  // ── Unlock moment ────────────────────────────────────────────────────────────
  if (showMoment) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <style>{`
        @keyframes ag-unlock-in {
          from { opacity: 0; transform: scale(0.88) }
          to   { opacity: 1; transform: scale(1) }
        }
        @keyframes ag-prime-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(240,165,0,0.35), 0 32px 80px rgba(0,0,0,0.65) }
          50%       { box-shadow: 0 0 0 1px rgba(240,165,0,0.70), 0 0 64px rgba(240,165,0,0.28), 0 32px 80px rgba(0,0,0,0.65) }
        }
      `}</style>
      <div style={{
        maxWidth: '420px', width: '100%',
        background: 'var(--depth)',
        borderRadius: '16px',
        padding: '52px 36px',
        textAlign: 'center',
        animation: 'ag-unlock-in 0.35s cubic-bezier(0.16, 1, 0.3, 1), ag-prime-glow 1.1s ease-in-out 0.35s',
      }}>
        <div style={{ color: 'var(--prime)', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>
          Access granted
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '32px', fontWeight: 900, color: 'var(--ink-hi)', letterSpacing: '-0.05em', margin: '0 0 10px', lineHeight: 1.0 }}>
          You're in.
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', lineHeight: 1.6, margin: 0 }}>
          Everything is unlocked on this device.
        </p>
      </div>
    </div>
  )

  // ── Default: code entry ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        maxWidth: '420px', width: '100%',
        background: 'var(--depth)',
        border: '1px solid var(--rim)',
        borderRadius: '16px',
        padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{ marginBottom: '24px', color: 'var(--ink-ghost)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
          Premium
        </div>

        <div style={{ marginBottom: '12px' }}><BrandMark variant='wordmark' size={14} /></div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.04em', marginBottom: '10px', lineHeight: 1.2 }}>
          {title}
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.65, marginBottom: '28px' }}>
          {body}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter access code"
            autoFocus
            style={{
              width: '100%',
              background: 'var(--surface)',
              border: `1px solid ${error ? 'var(--rose)' : 'var(--rim-hi)'}`,
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '16px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-hi)',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '12px',
              letterSpacing: '0.06em',
              transition: 'border-color 0.15s',
            }}
          />
          {error && (
            <p style={{ fontSize: '12px', color: 'var(--rose)', marginBottom: '10px', fontFamily: 'var(--font-mono)' }}>
              Incorrect code. Try again.
            </p>
          )}
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
          >
            {ctaLabel}
          </button>
        </form>

        <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '20px', lineHeight: 1.6 }}>
          Access code is permanent once entered — no need to enter it again on this device.
        </p>
      </div>
    </div>
  )
}
