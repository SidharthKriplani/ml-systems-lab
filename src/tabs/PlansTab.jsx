import { useState } from 'react'
import { ACCESS_CODE, STORAGE_KEY, isUnlocked } from '../utils/unlock.js'

// ── PlansTab — conversion surface (PAL pattern) ───────────────────────────────
//
// Three tiers: Free → Premium (access code now) → Stripe (future).
// All gate CTAs in the app route here so the conversion surface is consistent.

const FREE_ITEMS = [
  'Home dashboard, streak, guided paths',
  'Landscape — ML tools & infrastructure map',
  'Gradient ∇ — 50 production ML essays',
  'Math Foundations (Pyodide sandbox)',
  'Feature Engineering — 8 interactive modules',
  'Model Evaluation — 5 interactive modules',
  'Classical ML — failure zoo, ensembles, hyperparams',
]

const PREMIUM_ITEMS = [
  'Everything in Free',
  '128-question Q&A Bank with model answers',
  'Combinator — 45-min timed mock exam with debrief',
  'Verbal Practice — live recording, 25 prompts',
  'Defense Plan — JD → gap map → day-by-day study plan',
  'Spot the Flaw — 12 adversarial ML analyses',
  'Incident Room — 6 cross-domain production incidents',
  'ML Coding — 7 live Pyodide problems',
  'Take-Home Bank — 15 open-ended system design questions',
  'Staff Layer — IC3 → IC5 → Staff answer reveals',
  'Trainer — MCQ drill + weakness heatmap',
  'Bug Hunt — 20 production code snippets',
  'Case Studies — Netflix, Uber, Airbnb, DoorDash, Spotify',
  '3 Project Labs — Telco Churn, Loan Default, Fraud Detection (live Pyodide)',
  'System Design, Spark, Airflow, dbt, Data Modeling',
  'Deep Learning, Fine-tuning, DL Serving',
  'Causal Inference, Time Series, Monitoring',
  'Deployment, CI/CD & Infra',
]

function Check({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color || 'var(--prime)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
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

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '12px' }}>
          Access
        </div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '36px', fontWeight: 900, color: 'var(--ink-hi)', letterSpacing: '-0.05em', margin: '0 0 14px', lineHeight: 1.0 }}>
          Production ML judgment.
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
          Four free modules to start. An access code unlocks the full lab — every scenario, every tool, every Project Lab — on this device, permanently.
        </p>
      </div>

      {/* Tier cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: '20px', marginBottom: '48px' }}>

        {/* Free tier */}
        <div style={{
          background: 'var(--depth)',
          border: '1px solid var(--rim)',
          borderRadius: '16px',
          padding: '32px 28px',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
            Free
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, color: 'var(--ink-hi)', letterSpacing: '-0.04em', marginBottom: '4px' }}>
            $0
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginBottom: '24px' }}>
            No account required
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FREE_ITEMS.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Check color="var(--ink-mid)" />
                <span style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium tier */}
        <div style={{
          background: 'var(--depth)',
          border: '1px solid rgba(240,165,0,0.4)',
          borderRadius: '16px',
          padding: '32px 28px',
          boxShadow: '0 0 0 1px rgba(240,165,0,0.10), 0 24px 64px rgba(0,0,0,0.5)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: '-1px', left: '28px',
            background: 'var(--prime)', color: 'var(--depth)',
            fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '4px 10px', borderRadius: '0 0 6px 6px',
          }}>
            Full Lab
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px', marginTop: '12px' }}>
            Premium
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, color: 'var(--ink-hi)', letterSpacing: '-0.04em', marginBottom: '4px' }}>
            Access code
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginBottom: '24px' }}>
            One device, permanent
          </div>

          {already || done ? (
            <div style={{
              padding: '14px 18px',
              background: 'rgba(240,165,0,0.10)',
              border: '1px solid rgba(240,165,0,0.30)',
              borderRadius: '10px',
              fontFamily: 'var(--font-mono)', fontSize: '12px',
              color: 'var(--prime)', marginBottom: '20px',
              textAlign: 'center',
            }}>
              {done ? 'Unlocked — reloading…' : '✓ Full lab unlocked on this device'}
            </div>
          ) : (
            <form onSubmit={handleUnlock} style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Enter access code"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--surface)',
                  border: `1px solid ${error ? 'var(--rose)' : 'var(--rim-hi)'}`,
                  borderRadius: '8px', padding: '11px 14px',
                  fontSize: '14px', fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-hi)', outline: 'none',
                  letterSpacing: '0.06em', marginBottom: '10px',
                  transition: 'border-color 0.15s',
                }}
              />
              {error && (
                <p style={{ fontSize: '11px', color: 'var(--rose)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                  Incorrect code. Try again.
                </p>
              )}
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: '13px' }}>
                Unlock the full lab →
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PREMIUM_ITEMS.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Check />
                <span style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer note */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>
          No account required. No subscription. Progress stored in localStorage on your device.
          <br />
          Don't have a code? Email for access.
        </p>
      </div>

    </div>
  )
}
