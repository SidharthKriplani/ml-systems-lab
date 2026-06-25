import { useState } from 'react'
import { Icon } from './Icon.jsx'

// ─── Config ───────────────────────────────────────────────────────────────────
// After signing up at formspree.io, replace the ID below with your form ID.
// The form ID is the part after /f/ in your Formspree endpoint URL.
const FORMSPREE_ID = 'REPLACE_WITH_YOUR_FORMSPREE_ID'
const FORMSPREE_URL = `https://formspree.io/f/${FORMSPREE_ID}`

// Don't re-show chip if feedback was submitted within this many days
const COOLDOWN_DAYS = 30
const LS_KEY = 'msl_feedback_last'

const QUESTIONS = [
  { id: 'usefulness', label: 'How useful was this session for your interview prep?' },
  { id: 'realism',   label: 'How realistic is the difficulty vs. actual interviews?' },
  { id: 'recommend', label: 'Would you recommend ML Systems Lab to a peer?' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isCooledDown() {
  try {
    const last = localStorage.getItem(LS_KEY)
    if (!last) return true
    const days = (Date.now() - Number(last)) / (1000 * 60 * 60 * 24)
    return days >= COOLDOWN_DAYS
  } catch { return true }
}

// ─── Star row ─────────────────────────────────────────────────────────────────
function StarRow({ questionId, label, value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5, marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[1,2,3,4,5].map(n => {
          const active = n <= (hovered || value)
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              style={{
                width: '36px', height: '36px',
                borderRadius: '6px',
                border: `1.5px solid ${active ? 'rgba(240,165,0,0.6)' : 'var(--rim)'}`,
                background: active ? 'rgba(240,165,0,0.15)' : 'transparent',
                color: active ? 'var(--prime)' : 'var(--ink-ghost)',
                fontSize: '16px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                transition: 'all 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {n}
            </button>
          )
        })}
        <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', alignSelf: 'center', marginLeft: '4px' }}>
          {value ? `${value}/5` : '—'}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FeedbackChip() {
  const [visible, setVisible] = useState(isCooledDown)
  const [open, setOpen]       = useState(false)
  const [ratings, setRatings] = useState({ usefulness: 0, realism: 0, recommend: 0 })
  const [comment, setComment] = useState('')
  const [status, setStatus]   = useState('idle') // idle | submitting | success | error

  if (!visible) return null

  function setRating(id, val) {
    setRatings(prev => ({ ...prev, [id]: val }))
  }

  const allRated = QUESTIONS.every(q => ratings[q.id] > 0)

  async function handleSubmit() {
    if (!allRated) return
    setStatus('submitting')
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          rating_usefulness: ratings.usefulness,
          rating_realism:    ratings.realism,
          rating_recommend:  ratings.recommend,
          comment:           comment.trim() || '(none)',
          source:            'MSL feedback chip',
          submitted_at:      new Date().toISOString(),
        }),
      })
      if (res.ok) {
        setStatus('success')
        try { localStorage.setItem(LS_KEY, String(Date.now())) } catch {}
        setTimeout(() => { setOpen(false); setVisible(false) }, 1800)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      {/* ── Floating chip ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            bottom: '76px',  // above bottom nav on mobile
            right: '16px',
            zIndex: 400,
            background: 'var(--depth)',
            border: '1px solid var(--rim)',
            borderRadius: '20px',
            padding: '7px 14px',
            display: 'flex', alignItems: 'center', gap: '6px',
            cursor: 'pointer',
            color: 'var(--ink-low)',
            fontSize: '12px',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            letterSpacing: '0.01em',
            boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(240,165,0,0.4)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--rim)'}
        >
          <Icon name="star-filled" size={13} />
          Rate
        </button>
      )}

      {/* ── Modal overlay ── */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: '0 16px 80px 16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--depth)',
              border: '1px solid var(--rim)',
              borderRadius: '14px',
              padding: '22px 22px 18px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em' }}>
                  Rate your session
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  Takes 30 seconds · helps improve the lab
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--ink-ghost)', cursor: 'pointer', fontSize: '18px', padding: '0 0 0 8px', lineHeight: 1 }}>×</button>
            </div>

            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}><Icon name="check" size={28} /></div>
                <div style={{ fontSize: '14px', color: 'var(--mint)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Thanks — feedback received.</div>
              </div>
            ) : (
              <>
                {QUESTIONS.map(q => (
                  <StarRow
                    key={q.id}
                    questionId={q.id}
                    label={q.label}
                    value={ratings[q.id]}
                    onChange={val => setRating(q.id, val)}
                  />
                ))}

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', marginBottom: '6px' }}>
                    Anything specific? (optional)
                  </div>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="What worked? What didn't? Which scenario was most realistic?"
                    maxLength={500}
                    rows={3}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--void)',
                      border: '1px solid var(--rim)',
                      borderRadius: '7px',
                      padding: '10px 12px',
                      color: 'var(--ink-mid)',
                      fontSize: '13px',
                      fontFamily: 'var(--font-sans)',
                      lineHeight: 1.5,
                      resize: 'none',
                      outline: 'none',
                    }}
                  />
                </div>

                {status === 'error' && (
                  <div style={{ fontSize: '12px', color: 'var(--rose)', fontFamily: 'var(--font-sans)', marginBottom: '10px' }}>
                    Submission failed — try again or email directly.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={handleSubmit}
                    disabled={!allRated || status === 'submitting'}
                    style={{
                      flex: 1,
                      background: allRated ? 'var(--prime)' : 'var(--depth)',
                      color: allRated ? 'var(--void)' : 'var(--ink-ghost)',
                      border: `1px solid ${allRated ? 'var(--prime)' : 'var(--rim)'}`,
                      borderRadius: '8px',
                      padding: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-sans)',
                      cursor: allRated ? 'pointer' : 'default',
                      transition: 'all 0.15s',
                    }}
                  >
                    {status === 'submitting' ? 'Sending…' : 'Submit →'}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    style={{ fontSize: '12px', color: 'var(--ink-ghost)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '4px' }}
                  >
                    Skip
                  </button>
                </div>

                {!allRated && (
                  <div style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginTop: '8px', textAlign: 'center' }}>
                    Rate all 3 questions to submit
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
