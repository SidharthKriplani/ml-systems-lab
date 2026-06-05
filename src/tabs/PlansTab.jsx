import { useState } from 'react'
import { ACCESS_CODE, STORAGE_KEY, isUnlocked } from '../utils/unlock.js'

// ── PlansTab — conversion surface ─────────────────────────────────────────────
// Modelled on PAL's Plans page: outcome-framed tier cards + feature table.
// 2 tiers (no auth yet): Free → Full Lab (access code).
// Auth sprint will add a 3rd "Free Account" tier between them.

const WHATSAPP_LINK = 'https://chat.whatsapp.com/KqFoGxAW0XMF9hNllGyAo9'
const FOUNDER_PHONE = '+91-7838438784'

// Feature comparison table rows
// value: true = ✓, false/null = —, string = custom cell text
const TABLE_ROWS = [
  { feature: 'Practice scenarios',        free: '4 free modules',  full: 'All 300+' },
  { feature: 'Difficulty progression',    free: 'Junior only',     full: 'Junior → Staff' },
  { feature: 'Progress & streak',         free: true,              full: true },
  { feature: 'Gradient — 50 essays',      free: true,              full: true },
  { feature: 'Interview Q&A (128 q)',      free: null,              full: true },
  { feature: 'Combinator timed exam',     free: null,              full: true },
  { feature: 'Verbal Practice',           free: null,              full: true },
  { feature: 'Defense Plan',              free: true,              full: true },
  { feature: 'Incident Room',             free: null,              full: '6 cross-domain cases' },
  { feature: 'ML Coding (live Pyodide)',   free: null,              full: '7 problems' },
  { feature: 'Project Labs (Pyodide)',     free: null,              full: '3 end-to-end notebooks' },
  { feature: 'Staff Layer reveals',        free: null,              full: true },
  { feature: 'Spot the Flaw',             free: null,              full: true },
  { feature: 'Bug Hunt',                  free: null,              full: true },
  { feature: 'Case Studies',              free: null,              full: true },
  { feature: 'System Design',             free: null,              full: true },
  { feature: 'Spark · Airflow · dbt',     free: null,              full: true },
  { feature: 'Deep Learning suite',       free: null,              full: true },
  { feature: 'Monitoring + Drift Lab',    free: null,              full: true },
  { feature: 'Deployment · CI/CD',        free: null,              full: true },
]

function Cell({ value, highlight }) {
  const color = highlight ? 'var(--prime)' : 'var(--mint)'
  if (value === null || value === false) {
    return <td style={tdStyle(highlight)}><span style={{ color: 'var(--ink-ghost)' }}>—</span></td>
  }
  if (value === true) {
    return (
      <td style={tdStyle(highlight)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </td>
    )
  }
  return (
    <td style={tdStyle(highlight)}>
      <span style={{ fontSize: '12px', fontWeight: 600, color, fontFamily: 'var(--font-sans)' }}>{value}</span>
    </td>
  )
}

function tdStyle(highlight) {
  return {
    padding: '11px 16px', textAlign: 'center', verticalAlign: 'middle',
    borderBottom: '1px solid var(--rim)',
    background: highlight ? 'rgba(240,165,0,0.04)' : 'transparent',
  }
}

export default function PlansTab({ onNavigate }) {
  const already = isUnlocked()
  const [code,  setCode]  = useState('')
  const [error, setError] = useState(false)
  const [done,  setDone]  = useState(false)

  function handleUnlock(e) {
    e.preventDefault()
    if (code.trim().toUpperCase() === ACCESS_CODE) {
      try { localStorage.setItem(STORAGE_KEY, ACCESS_CODE) } catch {}
      setDone(true)
      setTimeout(() => window.location.reload(), 1200)
    } else {
      setError(true)
      setTimeout(() => setError(false), 1800)
    }
  }

  const unlocked = already || done

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontSize: '32px', fontWeight: 900,
          color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1.1,
        }}>
          How you want to prepare
        </h1>
        <p style={{
          fontSize: '15px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)',
          lineHeight: 1.7, maxWidth: '540px', margin: '0 auto',
        }}>
          Try four free modules, no account needed. Get a code to unlock the full lab — every scenario, every tool, every Project Lab — permanently on this device.
        </p>
      </div>

      {/* ── Tier cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px,100%), 1fr))',
        gap: '16px', marginBottom: '40px',
      }}>

        {/* Free tier */}
        <div style={{
          background: 'var(--depth)', border: '1px solid var(--rim)',
          borderRadius: '14px', padding: '28px 24px',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '10px' }}>
            Free
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.2 }}>
            Try it free
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 24px' }}>
            Four interactive modules — Feature Engineering, Model Evaluation, Classical ML, Math Foundations — plus 50 production ML essays. No code, no account.
          </p>
          <button
            onClick={() => onNavigate('classical')}
            style={{
              width: '100%', padding: '11px', fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 700,
              background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '8px',
              color: 'var(--ink-mid)', cursor: 'pointer',
            }}
          >
            Start free →
          </button>
        </div>

        {/* Full Lab tier — highlighted */}
        <div style={{
          background: 'var(--depth)',
          border: '1px solid rgba(240,165,0,0.5)',
          borderRadius: '14px', padding: '28px 24px',
          boxShadow: '0 0 0 1px rgba(240,165,0,0.12), 0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative',
        }}>
          {/* Badge */}
          <div style={{
            position: 'absolute', top: '-1px', left: '24px',
            background: 'var(--prime)', color: 'var(--depth)',
            fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '4px 10px', borderRadius: '0 0 6px 6px',
          }}>
            Full Lab
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '10px', marginTop: '10px' }}>
            Access code
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.2 }}>
            Prep like you're already in the room
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 20px' }}>
            Full case depth, difficulty progression from Junior to Staff, all interview tools, live coding, and three end-to-end Project Labs — everything unlocked permanently.
          </p>

          {/* Unlock state */}
          {unlocked ? (
            <div style={{
              padding: '12px 16px', marginBottom: '16px',
              background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.30)',
              borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px',
              color: 'var(--prime)', textAlign: 'center',
            }}>
              {done ? 'Unlocked — reloading…' : '✓ Full lab unlocked on this device'}
            </div>
          ) : (
            <form onSubmit={handleUnlock} style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Enter access code"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--surface)',
                  border: `1px solid ${error ? 'var(--rose)' : 'var(--rim-hi)'}`,
                  borderRadius: '8px', padding: '10px 14px',
                  fontSize: '14px', fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-hi)', outline: 'none',
                  letterSpacing: '0.06em', marginBottom: '8px',
                  transition: 'border-color 0.15s',
                }}
              />
              {error && (
                <p style={{ fontSize: '11px', color: 'var(--rose)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                  Incorrect code. Try again.
                </p>
              )}
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: '13px' }}>
                Unlock the full lab →
              </button>
            </form>
          )}

          <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: 0, textAlign: 'center' }}>
            No code?{' '}
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--prime)', textDecoration: 'none' }}>
              Join the beta group
            </a>
            {' '}or{' '}
            <a href={`https://wa.me/${FOUNDER_PHONE.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--prime)', textDecoration: 'none' }}>
              DM the founder
            </a>
          </p>
        </div>

      </div>

      {/* ── Feature comparison table ── */}
      <div style={{
        background: 'var(--depth)', border: '1px solid var(--rim)',
        borderRadius: '14px', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{
                padding: '12px 16px', textAlign: 'left',
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.12em',
                borderBottom: '1px solid var(--rim)', background: 'rgba(0,0,0,0.15)',
              }}>Feature</th>
              <th style={{
                padding: '12px 16px', textAlign: 'center', width: '130px',
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.12em',
                borderBottom: '1px solid var(--rim)', background: 'rgba(0,0,0,0.15)',
              }}>Free</th>
              <th style={{
                padding: '12px 16px', textAlign: 'center', width: '160px',
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em',
                borderBottom: '1px solid var(--rim)', background: 'rgba(240,165,0,0.06)',
              }}>Full Lab</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row, i) => (
              <tr key={row.feature}>
                <td style={{
                  padding: '11px 16px', borderBottom: i < TABLE_ROWS.length - 1 ? '1px solid var(--rim)' : 'none',
                  fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-low)',
                }}>
                  {row.feature}
                </td>
                <Cell value={row.free} highlight={false} />
                <Cell value={row.full} highlight={true} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', marginTop: '28px' }}>
        <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', lineHeight: 1.8, margin: 0 }}>
          No account required · Progress stored locally on your device · One code unlocks everything permanently
          <br />
          Stripe payments coming soon · Questions?{' '}
          <a href={`https://wa.me/${FOUNDER_PHONE.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--prime)', textDecoration: 'none' }}>
            DM on WhatsApp
          </a>
        </p>
      </div>

    </div>
  )
}
