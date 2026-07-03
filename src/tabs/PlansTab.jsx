import { useState } from 'react'
import { ACCESS_CODE, STORAGE_KEY, isUnlocked } from '../utils/unlock.js'
import { authEnabled } from '../utils/supabase.js'
import { Icon } from '../components/Icon.jsx'

// ── PlansTab — pricing + conversion surface ───────────────────────────────────
//
// 4 plan cards (Stripe coming soon — "Get early access" → WhatsApp/DM)
// Beta banner: sign-in state + access code unlock (current beta mechanism)
// Feature comparison table

const WHATSAPP_LINK = 'https://chat.whatsapp.com/KqFoGxAW0XMF9hNllGyAo9'
const FOUNDER_WA    = 'https://wa.me/917838438784'

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '₹799',
    per: '/month',
    desc: 'Billed monthly. Cancel anytime.',
    highlight: false,
    badge: null,
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    price: '₹1,999',
    per: '/quarter',
    desc: 'Save ~17% vs monthly.',
    highlight: false,
    badge: null,
  },
  {
    id: 'annual',
    label: 'Annual',
    price: '₹5,999',
    per: '/year',
    desc: 'Best value — save ~37%.',
    highlight: true,
    badge: 'Best Value',
  },
  {
    id: 'sprint',
    label: 'Interview Sprint',
    price: '₹2,499',
    per: '/ 14 days',
    desc: 'One focused sprint before your interview.',
    highlight: false,
    badge: null,
  },
]

const TABLE_ROWS = [
  { label: 'Practice scenarios',              guest: '1 per module',  free: '3 per module',   full: 'All 300+' },
  { label: 'Difficulty access',               guest: 'Junior',        free: 'Junior–Senior',  full: 'Junior → Staff' },
  { label: 'Progress & streak',               guest: null,            free: true,             full: true },
  { label: 'Daily streak',                    guest: null,            free: true,             full: true },
  { label: 'Gradient — 50 production essays', guest: true,            free: true,             full: true },
  { label: 'Defense Plan (free tool)',        guest: true,            free: true,             full: true },
  { label: 'Math Foundations',               guest: true,            free: true,             full: true },
  { label: 'Cross-device sync',              guest: null,            free: true,             full: true },
  { label: 'Interview Q&A — 128 questions',  guest: null,            free: null,             full: true },
  { label: 'Combinator timed exam',          guest: null,            free: null,             full: true },
  { label: 'Verbal Practice',               guest: null,            free: null,             full: true },
  { label: 'Cross-Domain Challenges (12 cases)', guest: null,         free: null,             full: true },
  { label: 'ML Coding — live Pyodide',      guest: null,            free: null,             full: true },
  { label: 'Project Labs (3 notebooks)',    guest: null,            free: null,             full: true },
  { label: 'Staff Layer reveals',           guest: null,            free: null,             full: true },
  { label: 'Spot the Flaw',                guest: null,            free: null,             full: true },
  { label: 'Bug Hunt',                      guest: null,            free: null,             full: true },
  { label: 'System Design · Spark · dbt',  guest: null,            free: null,             full: true },
  { label: 'Deep Learning suite',          guest: null,            free: null,             full: true },
  { label: 'Monitoring + Drift Lab',       guest: null,            free: null,             full: true },
]

function Check({ col }) {
  const color = col === 'full' ? 'var(--prime)' : col === 'free' ? 'var(--mint)' : 'var(--ink-mid)'
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function CellVal({ value, col }) {
  const color = col === 'full' ? 'var(--prime)' : col === 'free' ? 'var(--mint)' : 'var(--ink-low)'
  if (value === null) return <span style={{ color: 'var(--ink-ghost)' }}>—</span>
  if (value === true) return <Check col={col} />
  return <span style={{ fontSize: '11px', fontWeight: 600, color, fontFamily: 'var(--font-sans)' }}>{value}</span>
}

export default function PlansTab({ onNavigate, onShowAuth, user }) {
  const already = isUnlocked()
  const [code,  setCode]  = useState('')
  const [error, setError] = useState(false)
  const [done,  setDone]  = useState(false)
  const unlocked = already || done

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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '30px', fontWeight: 900, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: '0 0 10px', lineHeight: 1.1 }}>
          How you want to prepare
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: 0 }}>
          Full access to every scenario, difficulty level, and debrief.
        </p>
      </div>

      {/* 4 pricing cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px,100%),1fr))', gap: '14px', marginBottom: '24px' }}>
        {PLANS.map(plan => (
          <div
            key={plan.id}
            style={{
              position: 'relative',
              background: 'var(--depth)',
              border: plan.highlight ? '1.5px solid var(--mint)' : '1px solid var(--rim)',
              borderRadius: '12px',
              padding: '24px 20px',
              boxShadow: plan.highlight ? '0 0 0 1px rgba(52,211,153,0.12), 0 16px 48px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            {plan.badge && (
              <div style={{
                position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--mint)', color: '#0a1628',
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '4px 12px', borderRadius: '0 0 6px 6px', whiteSpace: 'nowrap',
              }}>
                {plan.badge}
              </div>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '12px', marginTop: plan.badge ? '10px' : 0 }}>
              {plan.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, color: 'var(--ink-hi)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {plan.price}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-ghost)' }}>
                {plan.per}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, margin: '0 0 20px' }}>
              {plan.desc}
            </p>
            <a
              href={FOUNDER_WA}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', width: '100%', boxSizing: 'border-box',
                padding: '10px', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700,
                background: plan.highlight ? 'var(--mint)' : 'var(--surface)',
                border: plan.highlight ? '1px solid var(--mint)' : '1px solid var(--rim-hi)',
                borderRadius: '7px',
                color: plan.highlight ? '#0a1628' : 'var(--ink-mid)',
                textAlign: 'center', textDecoration: 'none', cursor: 'pointer',
              }}
            >
              Get early access →
            </a>
          </div>
        ))}
      </div>

      {/* Beta banner — access code + sign-in */}
      <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '12px', padding: '20px 24px', marginBottom: '32px' }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-low)', margin: '0 0 14px', textAlign: 'center', lineHeight: 1.6 }}>
          Subscriptions activate at launch.{' '}
          <strong style={{ color: 'var(--ink-hi)' }}>Currently in beta</strong>
          {' '}— sign in to save your progress, or enter a beta access code to unlock the full lab now.
        </p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Sign-in state */}
          {user ? (
            <div style={{ padding: '9px 18px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--mint)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon name="check" size={12} /> Signed in
            </div>
          ) : authEnabled ? (
            <button
              onClick={onShowAuth}
              style={{ padding: '9px 18px', background: 'var(--surface)', border: '1px solid var(--mint)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--mint)', cursor: 'pointer' }}
            >
              Sign in →
            </button>
          ) : null}

          {/* Access code */}
          {unlocked ? (
            <div style={{ padding: '9px 18px', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--prime)' }}>
              {done ? 'Unlocked — reloading…' : '✓ Full lab unlocked'}
            </div>
          ) : (
            <form onSubmit={handleUnlock} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text" value={code} onChange={e => { setCode(e.target.value); setError(false) }}
                placeholder="Beta access code"
                style={{ padding: '9px 14px', background: 'var(--surface)', border: `1px solid ${error ? 'var(--rose)' : 'var(--rim-hi)'}`, borderRadius: '7px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--ink-hi)', outline: 'none', letterSpacing: '0.06em', width: '180px', transition: 'border-color 0.15s' }}
              />
              <button type="submit" style={{ padding: '9px 16px', background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '7px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--ink-mid)', cursor: 'pointer' }}>
                Unlock
              </button>
            </form>
          )}
        </div>
        {error && <p style={{ fontSize: '11px', color: 'var(--rose)', fontFamily: 'var(--font-mono)', textAlign: 'center', margin: '8px 0 0' }}>Incorrect code. Try again.</p>}
        <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', textAlign: 'center', margin: '10px 0 0' }}>
          No code?{' '}
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--prime)', textDecoration: 'none' }}>Join the beta group</a>
          {' '}or{' '}
          <a href={FOUNDER_WA} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--prime)', textDecoration: 'none' }}>DM the founder</a>
        </p>
      </div>

      {/* Feature table */}
      <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { label: 'Feature',       align: 'left',   col: null },
                { label: 'Guest',         align: 'center', col: 'guest' },
                { label: 'Free Account',  align: 'center', col: 'free' },
                { label: 'Full Lab',      align: 'center', col: 'full' },
              ].map(h => (
                <th key={h.label} style={{
                  padding: '11px 14px', textAlign: h.align,
                  fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                  color: h.col === 'full' ? 'var(--prime)' : h.col === 'free' ? 'var(--mint)' : 'var(--ink-ghost)',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  borderBottom: '1px solid var(--rim)',
                  background: h.col === 'full' ? 'rgba(240,165,0,0.05)' : h.col === 'free' ? 'rgba(52,211,153,0.04)' : 'rgba(0,0,0,0.12)',
                  width: h.col ? '120px' : undefined,
                }}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row, i) => (
              <tr key={row.label}>
                <td style={{ padding: '10px 14px', borderBottom: i < TABLE_ROWS.length - 1 ? '1px solid var(--rim)' : 'none', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-low)' }}>
                  {row.label}
                </td>
                {(['guest','free','full']).map(col => (
                  <td key={col} style={{
                    padding: '10px 14px', textAlign: 'center', verticalAlign: 'middle',
                    borderBottom: i < TABLE_ROWS.length - 1 ? '1px solid var(--rim)' : 'none',
                    background: col === 'full' ? 'rgba(240,165,0,0.03)' : col === 'free' ? 'rgba(52,211,153,0.02)' : 'transparent',
                  }}>
                    <CellVal value={row[col]} col={col} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', lineHeight: 1.8, margin: 0 }}>
          Sign in separately to access free cases and save progress · Access code unlocks the full lab on top of sign-in · Questions?{' '}
          <a href={FOUNDER_WA} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--prime)', textDecoration: 'none' }}>DM on WhatsApp</a>
        </p>
      </div>

    </div>
  )
}
