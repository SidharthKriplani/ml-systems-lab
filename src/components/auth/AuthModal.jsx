import { useState } from 'react'
import { signInWithGoogle, signInWithGitHub, signInWithEmail } from '../../utils/auth.js'

// ── AuthModal ─────────────────────────────────────────────────────────────────
// Fixed overlay. MUST be rendered at the END of the App return fragment —
// never inside a panel with transform or position:fixed (breaks viewport anchor).
//
// Props: open bool, onClose fn

export default function AuthModal({ open, onClose }) {
  const [step,    setStep]    = useState('main') // 'main' | 'sent'
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  if (!open) return null

  async function handleGoogle() {
    setLoading(true); setError('')
    const { error: e } = await signInWithGoogle() || {}
    if (e) { setError(e.message); setLoading(false) }
    // redirect happens — component unmounts
  }

  async function handleGitHub() {
    setLoading(true); setError('')
    const { error: e } = await signInWithGitHub() || {}
    if (e) { setError(e.message); setLoading(false) }
  }

  async function handleEmail(ev) {
    ev.preventDefault()
    if (!email.trim()) return
    setLoading(true); setError('')
    const { error: e } = await signInWithEmail(email.trim()) || {}
    setLoading(false)
    if (e) { setError(e.message) } else { setStep('sent') }
  }

  function handleClose() {
    setStep('main'); setEmail(''); setError(''); setLoading(false)
    onClose()
  }

  const btnBase = {
    width: '100%', padding: '11px 16px', borderRadius: '8px',
    fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    transition: 'opacity 0.15s',
    opacity: loading ? 0.6 : 1,
  }

  return (
    <div
      onClick={handleClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '400px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '16px', padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }}
      >
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--prime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '9px', color: 'var(--depth)' }}>ML</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>ML Systems Lab</span>
          </div>
          {step === 'main' ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 6px' }}>Sign in to save your progress</h2>
              <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: 0 }}>Free account — cross-device sync coming soon. Junior scenarios always free.</p>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 6px' }}>Check your email</h2>
              <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: 0 }}>We sent a sign-in link to <strong style={{ color: 'var(--ink-mid)' }}>{email}</strong>. Click it to continue.</p>
            </>
          )}
        </div>

        {step === 'main' && (
          <>
            {/* OAuth buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button onClick={handleGoogle} disabled={loading} style={{ ...btnBase, background: 'var(--surface)', border: '1px solid var(--rim-hi)', color: 'var(--ink-hi)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <button onClick={handleGitHub} disabled={loading} style={{ ...btnBase, background: 'var(--surface)', border: '1px solid var(--rim-hi)', color: 'var(--ink-hi)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Continue with GitHub
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--rim)' }} />
              <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>or email</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--rim)' }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmail}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '8px', padding: '11px 14px', fontSize: '14px', fontFamily: 'var(--font-sans)', color: 'var(--ink-hi)', outline: 'none', marginBottom: '10px', transition: 'border-color 0.15s' }}
              />
              {error && <p style={{ fontSize: '11px', color: 'var(--rose)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: '13px' }}>
                {loading ? 'Sending…' : 'Send sign-in link →'}
              </button>
            </form>

            <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '16px 0 0', textAlign: 'center' }}>
              No password. No newsletter. Just a sign-in link.
            </p>
          </>
        )}

        {step === 'sent' && (
          <button onClick={handleClose} style={{ ...btnBase, background: 'var(--surface)', border: '1px solid var(--rim-hi)', color: 'var(--ink-mid)', marginTop: '8px' }}>
            Back to the lab
          </button>
        )}
      </div>
    </div>
  )
}
