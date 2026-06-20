import { useState, useEffect } from 'react'
import { writeOnboarding } from '../data/recommendationEngine.js'
import { track } from '../analytics.js'

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'New to ML — start at basics' },
  { value: 'mid',      label: 'Mid-level — fill production gaps' },
  { value: 'senior',   label: 'Senior — interview prep, high yield' },
]

const URGENCY_OPTIONS = [
  { value: 'week',     label: 'Interview this week' },
  { value: 'month',    label: 'Interview this month' },
  { value: 'learning', label: 'Just learning' },
]

export default function QuizCard({ onComplete }) {
  const [level, setLevel] = useState(null)
  const [urgency, setUrgency] = useState(null)

  useEffect(() => { track('onboarding_quiz_shown') }, [])

  function pickLevel(v) {
    setLevel(v)
    track('onboarding_quiz_q1_answered', { level: v })
  }

  function pickUrgency(v) {
    setUrgency(v)
    track('onboarding_quiz_q2_answered', { urgency: v })
  }

  function submit() {
    if (!level || !urgency) return
    writeOnboarding({ level, urgency, completed: true })
    track('onboarding_quiz_submitted', { level, urgency })
    if (onComplete) onComplete({ level, urgency })
  }

  function skip() {
    writeOnboarding({ level: null, urgency: null, completed: true })
    track('onboarding_quiz_skipped')
    if (onComplete) onComplete({ level: null, urgency: null })
  }

  const canSubmit = !!level && !!urgency

  return (
    <div style={{
      padding: '28px 30px',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, rgba(240,165,0,0.10) 0%, rgba(240,165,0,0.04) 100%)',
      border: '1px solid rgba(240,165,0,0.28)',
      marginBottom: '28px',
    }}>
      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px', fontWeight: 700 }}>
        Welcome
      </div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', marginBottom: '6px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
        Give me 5 seconds and I'll point you at the right thing to do today.
      </div>
      <div style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', marginBottom: '24px' }}>
        Two quick questions. Or skip and I'll default to the safest start.
      </div>

      {/* Q1 — Level */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          Where are you?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {LEVEL_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => pickLevel(opt.value)}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1px solid ${level === opt.value ? 'rgba(240,165,0,0.45)' : 'var(--rim)'}`,
                background: level === opt.value ? 'rgba(240,165,0,0.14)' : 'transparent',
                color: level === opt.value ? 'var(--prime)' : 'var(--ink-mid)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: level === opt.value ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: `1px solid ${level === opt.value ? 'var(--prime)' : 'var(--rim-hi)'}`, background: level === opt.value ? 'var(--prime)' : 'transparent', flexShrink: 0 }} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Q2 — Urgency */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          When do you need this?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {URGENCY_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => pickUrgency(opt.value)}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1px solid ${urgency === opt.value ? 'rgba(240,165,0,0.45)' : 'var(--rim)'}`,
                background: urgency === opt.value ? 'rgba(240,165,0,0.14)' : 'transparent',
                color: urgency === opt.value ? 'var(--prime)' : 'var(--ink-mid)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: urgency === opt.value ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', border: `1px solid ${urgency === opt.value ? 'var(--prime)' : 'var(--rim-hi)'}`, background: urgency === opt.value ? 'var(--prime)' : 'transparent', flexShrink: 0 }} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={submit} disabled={!canSubmit}
          style={{
            padding: '11px 22px',
            borderRadius: '8px',
            border: 'none',
            background: canSubmit ? 'var(--prime)' : 'rgba(240,165,0,0.25)',
            color: canSubmit ? 'var(--void)' : 'var(--ink-ghost)',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}>
          See my next 30 min →
        </button>
        <button onClick={skip}
          style={{
            padding: '11px 18px',
            borderRadius: '8px',
            border: '1px solid var(--rim)',
            background: 'transparent',
            color: 'var(--ink-low)',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
          Skip
        </button>
      </div>
    </div>
  )
}
