// ── StudyRoom.jsx ─────────────────────────────────────────────────────────────
// Private spaced-repetition study room for MSL Anki decks.
//
// Entry:    Shift+Ctrl+K keypress (set in App.jsx)
// Security: renders nothing if user is null — component is in bundle but
//           all content is fetched from Supabase behind RLS. No card text
//           ships in the JS bundle.
// Schema:   see supabase/study_schema.sql
// Import:   see scripts/import_anki.py (run once from terminal)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase.js'
import { getNextInterval } from './sr.js'

// ── Lane metadata ─────────────────────────────────────────────────────────────
const LANE_LABELS = {
  lane1: 'RecSys & Ranking',
  lane2: 'DL & PyTorch',
  lane3: 'MLOps',
  lane4: 'Spark / PySpark',
  lane5: 'Cloud & Storage',
  lane6: 'sklearn & pandas',
}

// ── Rating config ─────────────────────────────────────────────────────────────
const RATINGS = [
  { value: 1, label: 'Again', color: 'var(--rose)',  hint: '1 day',   key: '1' },
  { value: 2, label: 'Hard',  color: 'var(--ember)', hint: '3 days',  key: '2' },
  { value: 3, label: 'Good',  color: 'var(--green)', hint: '7 days',  key: '3' },
  { value: 4, label: 'Easy',  color: 'var(--sky)',   hint: '14 days', key: '4' },
]

// ── Inner component — all hooks live here (user guaranteed non-null) ───────────
function StudyRoomInner({ user, onClose }) {
  const [queue,      setQueue]      = useState([])
  const [idx,        setIdx]        = useState(0)
  const [revealed,   setRevealed]   = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [done,       setDone]       = useState(0)
  const [laneFilter, setLaneFilter] = useState('all')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)

  // ── Fetch due cards ───────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    setLoading(true)
    setError(null)

    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD

    const { data, error: err } = await supabase
      .from('card_progress')
      .select(`
        id,
        interval_days,
        due_date,
        study_cards (
          id, lane, topic, front, back, card_type
        )
      `)
      .eq('user_id', user.id)
      .lte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(100)

    if (err) {
      setError('Failed to load queue: ' + err.message)
      setLoading(false)
      return
    }

    let cards = (data || [])
      .filter(p => p.study_cards)
      .map(p => ({
        id:           p.study_cards.id,
        progress_id:  p.id,
        lane:         p.study_cards.lane,
        topic:        p.study_cards.topic,
        front:        p.study_cards.front,
        back:         p.study_cards.back,
        card_type:    p.study_cards.card_type,
        interval_days: p.interval_days,
        due_date:     p.due_date,
      }))

    if (laneFilter !== 'all') {
      cards = cards.filter(c => c.lane === laneFilter)
    }

    setQueue(cards)
    setIdx(0)
    setDone(0)
    setRevealed(false)
    setLoading(false)
  }, [user.id, laneFilter])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (loading || submitting) return
      const card = queue[idx]
      if (!card) return
      if ((e.key === ' ' || e.key === 'Enter') && !revealed) {
        e.preventDefault()
        setRevealed(true)
        return
      }
      if (revealed && e.key >= '1' && e.key <= '4') {
        e.preventDefault()
        handleRate(parseInt(e.key, 10))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, submitting, queue, idx, revealed])

  // ── Rate a card and advance queue ─────────────────────────────────────────
  async function handleRate(rating) {
    const card = queue[idx]
    if (!card || submitting) return
    setSubmitting(true)

    const { nextInterval, nextDue } = getNextInterval(card.interval_days, rating)

    const { error: upErr } = await supabase
      .from('card_progress')
      .update({
        interval_days: nextInterval,
        due_date:      nextDue,
        last_reviewed: new Date().toISOString(),
        last_rating:   rating,
      })
      .eq('id', card.progress_id)

    if (upErr) {
      console.error('SR update failed:', upErr.message)
    }

    setDone(d => d + 1)
    setIdx(i => i + 1)
    setRevealed(false)
    setSubmitting(false)
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const card      = queue[idx]
  const remaining = queue.length - idx
  const isDone    = !loading && !error && !card

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--void)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 201,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '48px',
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--rim)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--prime)',
          }}>
            Study Room
          </span>
          {!loading && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)',
              background: 'var(--surface)', border: '1px solid var(--rim)',
              padding: '2px 7px', borderRadius: '5px',
            }}>
              {remaining > 0
                ? `${remaining} due`
                : done > 0
                  ? `${done} done today`
                  : '0 due'}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          title="Close (Esc)"
          style={{
            background: 'none', border: '1px solid var(--rim)', borderRadius: '6px',
            color: 'var(--ink-low)', cursor: 'pointer', padding: '4px 10px',
            fontFamily: 'var(--font-sans)', fontSize: '12px',
            transition: 'border-color var(--t-fast), color var(--t-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rim-hi)'; e.currentTarget.style.color = 'var(--ink-hi)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-low)' }}
        >
          Esc
        </button>
      </div>

      {/* ── Lane filter pills ── */}
      <div style={{
        padding: '14px 20px 0',
        display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0,
      }}>
        {['all', ...Object.keys(LANE_LABELS)].map(lane => {
          const active = laneFilter === lane
          return (
            <button
              key={lane}
              onClick={() => setLaneFilter(lane)}
              style={{
                padding: '5px 12px', borderRadius: '20px',
                border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
                background: active ? 'var(--prime-faint)' : 'transparent',
                color: active ? 'var(--prime)' : 'var(--ink-low)',
                fontSize: '11px', fontFamily: 'var(--font-sans)',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {lane === 'all' ? 'All lanes' : LANE_LABELS[lane]}
            </button>
          )
        })}
      </div>

      {/* ── Main content ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '28px 20px 80px', maxWidth: '720px', width: '100%',
        margin: '0 auto', boxSizing: 'border-box',
      }}>

        {/* Loading */}
        {loading && (
          <div style={{
            color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)',
            fontSize: '12px', marginTop: '80px',
          }}>
            Loading queue...
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            marginTop: '60px', padding: '16px 20px',
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)',
            borderRadius: '10px', color: 'var(--rose)',
            fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6,
          }}>
            {error}
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={fetchQueue}
                style={{
                  background: 'none', border: '1px solid var(--rim)',
                  borderRadius: '6px', color: 'var(--ink-low)',
                  cursor: 'pointer', padding: '5px 12px',
                  fontFamily: 'var(--font-sans)', fontSize: '12px',
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* All done */}
        {isDone && (
          <div style={{ textAlign: 'center', marginTop: '80px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', color: 'var(--prime)' }}>✓</div>
            <h2 style={{
              fontFamily: 'var(--font-sans)', fontSize: '26px', fontWeight: 800,
              color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: '0 0 10px',
            }}>
              {done > 0 ? 'All done for today' : 'Nothing due today'}
            </h2>
            <p style={{
              color: 'var(--ink-low)', fontSize: '14px',
              fontFamily: 'var(--font-sans)', margin: '0 0 24px', lineHeight: 1.65,
            }}>
              {done > 0
                ? `${done} card${done !== 1 ? 's' : ''} reviewed. Come back tomorrow.`
                : 'No cards due. If you just imported your deck, check that cards have due_date ≤ today.'}
            </p>
            <button
              onClick={fetchQueue}
              style={{
                padding: '9px 20px', background: 'var(--surface)',
                border: '1px solid var(--rim)', borderRadius: '8px',
                color: 'var(--ink-low)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: '13px',
                transition: 'border-color var(--t-fast), color var(--t-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rim-hi)'; e.currentTarget.style.color = 'var(--ink-hi)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-low)' }}
            >
              Refresh queue
            </button>
          </div>
        )}

        {/* Active card */}
        {card && !loading && (
          <div style={{ width: '100%' }}>

            {/* Progress bar */}
            <div style={{
              height: '2px', background: 'var(--rim)',
              borderRadius: '1px', marginBottom: '24px',
            }}>
              <div style={{
                height: '100%',
                width: queue.length > 0 ? `${(done / queue.length) * 100}%` : '0%',
                background: 'var(--prime)', borderRadius: '1px',
                transition: 'width 0.4s ease',
              }} />
            </div>

            {/* Lane tag */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.12em',
                color: 'var(--prime)', background: 'var(--prime-faint)',
                border: '1px solid rgba(232,160,48,0.25)',
                padding: '3px 8px', borderRadius: '4px',
              }}>
                {LANE_LABELS[card.lane] || card.lane}
              </span>
              {card.topic && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '9px',
                  color: 'var(--ink-ghost)', background: 'var(--surface)',
                  border: '1px solid var(--rim)', padding: '3px 8px', borderRadius: '4px',
                }}>
                  {card.topic}
                </span>
              )}
            </div>

            {/* Card front */}
            <div style={{
              background: 'var(--depth)', border: '1px solid var(--rim)',
              borderRadius: '14px', padding: '28px',
              marginBottom: revealed ? '16px' : '24px',
            }}>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: '16px',
                color: 'var(--ink-hi)', lineHeight: 1.7, fontWeight: 500,
              }}>
                {card.front}
              </div>
            </div>

            {/* Reveal button */}
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                style={{
                  width: '100%', padding: '13px 20px',
                  background: 'var(--prime)', border: 'none',
                  borderRadius: '10px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px',
                  color: 'var(--void)', letterSpacing: '-0.01em',
                  transition: 'opacity var(--t-fast)',
                  boxShadow: '0 0 24px var(--prime-glow)',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Reveal answer
                <span style={{ opacity: 0.55, fontSize: '11px', marginLeft: '10px', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>Space</span>
              </button>
            )}

            {/* Card back + rating */}
            {revealed && (
              <>
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--rim-hi)',
                  borderLeft: '3px solid var(--prime)',
                  borderRadius: '14px', padding: '24px 28px',
                  marginBottom: '24px',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 700,
                    color: 'var(--ink-ghost)', letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: '12px',
                  }}>
                    Answer
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: '14px',
                    color: 'var(--ink-mid)', lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {card.back}
                  </div>
                </div>

                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px',
                }}>
                  How did it go?
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {RATINGS.map(r => (
                    <button
                      key={r.value}
                      onClick={() => handleRate(r.value)}
                      disabled={submitting}
                      style={{
                        padding: '10px 8px',
                        background: 'var(--depth)',
                        border: `1px solid ${r.color}40`,
                        borderRadius: '10px',
                        cursor: submitting ? 'default' : 'pointer',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '4px',
                        transition: 'background var(--t-fast), border-color var(--t-fast)',
                        opacity: submitting ? 0.55 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!submitting) {
                          e.currentTarget.style.background = `${r.color}14`
                          e.currentTarget.style.borderColor = r.color
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--depth)'
                        e.currentTarget.style.borderColor = `${r.color}40`
                      }}
                    >
                      <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>{r.key}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: r.color }}>{r.label}</span>
                      <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>{r.hint}</span>
                    </button>
                  ))}
                </div>

                <p style={{
                  marginTop: '12px', textAlign: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)',
                  letterSpacing: '0.06em',
                }}>
                  Press 1 · 2 · 3 · 4 to rate
                </p>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// ── Outer wrapper — guard before hooks ────────────────────────────────────────
export default function StudyRoom({ user, onClose }) {
  if (!user || !supabase) return null
  return <StudyRoomInner user={user} onClose={onClose} />
}
