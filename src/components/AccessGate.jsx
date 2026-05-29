import { useState } from 'react'

const ACCESS_CODE = 'DAI2026'

export default function AccessGate({ onUnlock }) {
  const [code, setCode]     = useState('')
  const [error, setError]   = useState(false)
  const [success, setSuccess] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      setSuccess(true)
      setTimeout(() => onUnlock(code.trim().toUpperCase()), 400)
    } else {
      setError(true)
      setTimeout(() => setError(false), 1800)
    }
  }

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
        {/* Lock icon */}
        <div style={{ marginBottom: '24px', color: 'var(--ink-ghost)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>
          Premium
        </div>

        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.04em', marginBottom: '10px', lineHeight: 1.2 }}>
          This content requires access.
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.65, marginBottom: '28px' }}>
          Advanced modules, interview simulation tools, mock exams, and verbal practice are behind an access code. Enter yours below to unlock everything.
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
              border: `1px solid ${error ? 'var(--rose)' : success ? 'var(--mint)' : 'var(--rim-hi)'}`,
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

          {success && (
            <p style={{ fontSize: '12px', color: 'var(--mint)', marginBottom: '10px', fontFamily: 'var(--font-mono)' }}>
              ✓ Access granted. Unlocking…
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px' }}
          >
            Unlock →
          </button>
        </form>

        <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '20px', lineHeight: 1.6 }}>
          Access code is permanent once entered — no need to enter it again on this device.
        </p>
      </div>
    </div>
  )
}
