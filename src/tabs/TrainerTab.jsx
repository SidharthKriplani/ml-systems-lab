import { useState, useRef } from 'react'
import { shuffle } from '../utils/shuffle.js'
import { TRAINER_QUESTIONS } from '../data/questionBank.js'
import { trackModuleComplete } from '../analytics'
import FidelityBadge from '../components/FidelityBadge.jsx'

// ─── MCQ Bank ────────────────────────────────────────────────────────────────

const ALL_QUESTIONS = TRAINER_QUESTIONS

const ALL_DOMAINS = [
  'Feature Engineering', 'Model Evaluation', 'ML Systems',
  'Statistics & Probability', 'Deep Learning', 'MLOps',
  'Ranking & Retrieval', 'Experiment Design', 'SQL & Data', 'Optimization',
]

// shuffle moved to utils/shuffle.js

// ─── Setup Screen ────────────────────────────────────────────────────────────

// ── Coming Soon ───────────────────────────────────────────────────────────────
const COMING_SOON = []

// ── Domain weakness helpers ───────────────────────────────────────────────────
function computeDomainAccuracy(history) {
  const domainAccuracy = {}
  history.forEach(session => {
    if (session.domainBreakdown) {
      session.domainBreakdown.forEach(({ domain, correct, total }) => {
        if (!domainAccuracy[domain]) domainAccuracy[domain] = { correct: 0, total: 0 }
        domainAccuracy[domain].correct += correct
        domainAccuracy[domain].total += total
      })
    }
  })
  return domainAccuracy
}

function SetupScreen({ onStart }) {
  const [selectedDomains, setSelectedDomains] = useState(new Set(ALL_DOMAINS))
  const [count, setCount] = useState('10')

  // Read session history for adaptive panels
  const history = (() => {
    try { return JSON.parse(localStorage.getItem('msl_trainer_history') || '[]') } catch (_) { return [] }
  })()

  const domainAccuracy = computeDomainAccuracy(history)
  const sortedDomains = Object.entries(domainAccuracy)
    .filter(([, v]) => v.total >= 3)
    .map(([d, v]) => ({ domain: d, pct: Math.round((v.correct / v.total) * 100) }))
    .sort((a, b) => a.pct - b.pct)
  const weakestDomain = sortedDomains[0]?.domain || null
  const hasHistory = history.length > 0

  function toggleDomain(d) {
    setSelectedDomains(prev => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  function handleStart() {
    const pool = shuffle(ALL_QUESTIONS.filter(q => selectedDomains.has(q.domain)))
    const final = count === 'All' ? pool : pool.slice(0, parseInt(count))
    if (final.length === 0) return
    onStart(final)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 55%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          ML Trainer
        </h1>
        <p style={{ color: 'var(--ink-mid)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
          Sharpen your ML interview skills with targeted MCQ drills.
        </p>
        <p style={{ color: 'var(--ink-low)', marginTop: '0.3rem', fontSize: '0.8rem', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>Select your domains and question count, work through each question one at a time, then review your accuracy per domain in the debrief.</p>
        <div style={{ marginTop: '8px' }}><FidelityBadge tier="conceptual" /></div>
      </div>

      {/* ── Weak Domain Drill ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.1rem 1.35rem', marginBottom: '1.25rem',
        borderLeft: hasHistory && weakestDomain ? '3px solid var(--prime)' : '1px solid var(--rim)',
      }}>
        <p className="section-eyebrow" style={{ marginBottom: '0.75rem', color: hasHistory && weakestDomain ? 'var(--prime)' : 'var(--ink-ghost)' }}>
          Your Weak Spots
        </p>
        {!hasHistory || sortedDomains.length === 0 ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-ghost)', margin: 0 }}>
            Complete a session to see your weak domains here.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.9rem' }}>
              {sortedDomains.slice(0, 4).map(({ domain, pct }) => (
                <div key={domain}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-mid)' }}>{domain}</span>
                    <span style={{
                      fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                      color: 'var(--prime)',
                      fontWeight: 600,
                    }}>{pct}%</span>
                  </div>
                  <div style={{ background: 'var(--rim)', borderRadius: 99, height: 5 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 99,
                      background: 'var(--prime)',
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
            {weakestDomain && (
              <button
                onClick={() => {
                  setSelectedDomains(new Set([weakestDomain]))
                  setCount('10')
                  const pool = ALL_QUESTIONS.filter(q => q.domain === weakestDomain)
                  const final = [...pool].sort(() => Math.random() - 0.5).slice(0, 10)
                  if (final.length > 0) onStart(final)
                }}
                style={{
                  background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)',
                  borderRadius: 8, padding: '0.5rem 1.1rem',
                  fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer',
                  color: 'var(--prime)', fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
              >
                Drill Weakest: {weakestDomain}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Review Queue (Spaced Repetition) ─────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.1rem 1.35rem', marginBottom: '1.5rem',
      }}>
        <p className="section-eyebrow" style={{ marginBottom: '0.65rem' }}>
          Review Queue
        </p>
        {!hasHistory ? (
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-ghost)', margin: 0 }}>
            No sessions yet — complete a session to build your review queue.
          </p>
        ) : (
          (() => {
            const recent = history.slice(-5)
            const recentDomainAcc = computeDomainAccuracy(recent)
            const weakRecent = Object.entries(recentDomainAcc)
              .filter(([, v]) => v.total > 0)
              .map(([d, v]) => ({ domain: d, pct: Math.round((v.correct / v.total) * 100) }))
              .sort((a, b) => a.pct - b.pct)
              .slice(0, 2)

            if (weakRecent.length === 0) {
              return <p style={{ fontSize: '0.82rem', color: 'var(--ink-ghost)', margin: 0 }}>No domain data in recent sessions.</p>
            }

            return (
              <>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-mid)', margin: '0 0 0.65rem', lineHeight: 1.5 }}>
                  Based on your last {Math.min(5, recent.length)} session{recent.length > 1 ? 's' : ''}, these domains need work:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  {weakRecent.map(({ domain, pct }) => (
                    <span key={domain} style={{
                      padding: '0.25rem 0.65rem', borderRadius: 99,
                      background: 'var(--prime-bg-light)',
                      border: '1px solid rgba(240,165,0,0.25)',
                      fontSize: '0.78rem', color: 'var(--prime)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {domain} · {pct}%
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const reviewDomains = new Set(weakRecent.map(w => w.domain))
                    const pool = ALL_QUESTIONS.filter(q => reviewDomains.has(q.domain))
                    const final = [...pool].sort(() => Math.random() - 0.5).slice(0, 10)
                    if (final.length > 0) onStart(final)
                  }}
                  style={{
                    background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)',
                    borderRadius: 8, padding: '0.5rem 1.1rem',
                    fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer',
                    color: 'var(--prime)', fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                >
                  Start Review Session
                </button>
              </>
            )
          })()
        )}
      </div>

      {/* Domain selector */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--ink-hi)', fontSize: '0.95rem' }}>Domains</span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setSelectedDomains(new Set(ALL_DOMAINS))}
              style={{ background: 'none', border: 'none', color: 'var(--prime)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
            >Select all</button>
            <button
              onClick={() => setSelectedDomains(new Set())}
              style={{ background: 'none', border: 'none', color: 'var(--ink-low)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
            >Clear</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
          {ALL_DOMAINS.map(d => {
            const checked = selectedDomains.has(d)
            return (
              <label key={d} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                background: checked ? 'rgba(240,165,0,0.1)' : 'var(--depth)',
                border: `1px solid ${checked ? 'var(--prime)' : 'var(--rim)'}`,
                transition: 'all 0.15s',
              }}>
                <input
                  type="checkbox" checked={checked}
                  onChange={() => toggleDomain(d)}
                  style={{ accentColor: 'var(--prime)', width: 15, height: 15 }}
                />
                <span style={{ fontSize: '0.85rem', color: checked ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{d}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Count selector */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '2rem',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--ink-hi)', fontSize: '0.95rem', display: 'block', marginBottom: '0.75rem' }}>
          Question Count
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['10', '20', 'All'].map(opt => {
            const active = count === opt
            return (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1.25rem', borderRadius: 8, cursor: 'pointer',
                background: active ? 'rgba(240,165,0,0.15)' : 'var(--depth)',
                border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="count" value={opt} checked={active}
                  onChange={() => setCount(opt)}
                  style={{ accentColor: 'var(--prime)' }}
                />
                <span style={{ fontSize: '0.9rem', color: active ? 'var(--prime)' : 'var(--ink-mid)', fontWeight: active ? 600 : 400 }}>{opt}</span>
              </label>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={selectedDomains.size === 0}
        style={{
          background: selectedDomains.size === 0 ? 'var(--rim)' : 'var(--prime)',
          color: selectedDomains.size === 0 ? 'var(--ink-ghost)' : 'var(--void)',
          border: 'none', borderRadius: 10, padding: '0.85rem 2.5rem',
          fontSize: '1rem', fontWeight: 700, cursor: selectedDomains.size === 0 ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'all 0.15s',
        }}
      >
        Start Drill
      </button>
    </div>
  )
}

// ─── Drill Screen ────────────────────────────────────────────────────────────

const DOMAIN_COLORS = {
  'Feature Engineering': 'var(--prime)',
  'Model Evaluation': 'var(--prime)',
  'ML Systems': 'var(--prime)',
  'Statistics & Probability': 'var(--prime)',
  'Deep Learning': 'var(--prime)',
  'MLOps': 'var(--prime)',
  'Ranking & Retrieval': 'var(--prime)',
  'Experiment Design': 'var(--prime)',
  'SQL & Data': 'var(--prime)',
  'Optimization': 'var(--prime)',
}

function DrillScreen({ questions, onFinish, onAbort }) {
  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState(null) // index of chosen option or null
  const [score, setScore] = useState(0)
  // domainStats: { domain: { correct, total } }
  const [domainStats, setDomainStats] = useState({})
  // Refs to always hold latest values for the finish handler
  const scoreRef = useRef(0)
  const domainStatsRef = useRef({})

  const q = questions[idx]
  const total = questions.length
  const isCorrect = answered !== null && answered === q.correct
  const domainColor = DOMAIN_COLORS[q.domain] || 'var(--prime)'

  function handleAnswer(optIdx) {
    if (answered !== null) return
    setAnswered(optIdx)
    const correct = optIdx === q.correct
    const newScore = score + (correct ? 1 : 0)
    if (correct) setScore(newScore)
    scoreRef.current = newScore
    const newDomainStats = {
      ...domainStatsRef.current,
      [q.domain]: {
        correct: (domainStatsRef.current[q.domain]?.correct || 0) + (correct ? 1 : 0),
        total: (domainStatsRef.current[q.domain]?.total || 0) + 1,
      },
    }
    domainStatsRef.current = newDomainStats
    setDomainStats(newDomainStats)
  }

  function handleNextFixed() {
    if (idx + 1 >= total) {
      onFinish(scoreRef.current, domainStatsRef.current, questions)
      return
    }
    setIdx(i => i + 1)
    setAnswered(null)
  }

  function optionStyle(optIdx) {
    const base = {
      width: '100%', textAlign: 'left', padding: '0.85rem 1.1rem',
      borderRadius: 10, fontSize: '0.95rem', cursor: answered !== null ? 'default' : 'pointer',
      fontFamily: 'var(--font-sans)',
      border: '1px solid var(--rim)',
      background: 'var(--depth)',
      color: 'var(--ink-hi)',
      transition: 'all 0.2s',
    }
    if (answered === null) return { ...base, cursor: 'pointer' }
    if (optIdx === q.correct) return { ...base, background: 'rgba(52,211,153,0.15)', borderColor: 'var(--mint)', color: 'var(--mint)' }
    if (optIdx === answered && answered !== q.correct) return { ...base, background: 'rgba(244,63,94,0.15)', borderColor: 'var(--rose)', color: 'var(--rose)' }
    return { ...base, opacity: 0.45 }
  }

  const progressPct = ((idx) / total) * 100

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button
          onClick={onAbort}
          style={{
            background: 'none', border: '1px solid var(--rim)', borderRadius: 8,
            color: 'var(--ink-low)', cursor: 'pointer', fontSize: '0.8rem',
            padding: '0.35rem 0.85rem', fontFamily: 'var(--font-sans)',
          }}
        >
          Abort
        </button>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.9rem',
          color: 'var(--prime)', fontWeight: 600,
        }}>
          {score} / {idx + (answered !== null ? 1 : 0)} correct
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--rim)', borderRadius: 99, height: 6, marginBottom: '0.5rem' }}>
        <div style={{
          width: `${progressPct}%`, height: '100%', borderRadius: 99,
          background: 'var(--prime)', transition: 'width 0.3s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          Question {idx + 1} of {total}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          {Math.round(progressPct)}%
        </span>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 14, padding: '1.75rem',
      }}>
        {/* Domain badge */}
        <span style={{
          display: 'inline-block', padding: '0.3rem 0.8rem',
          borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
          background: `${domainColor}20`, color: domainColor,
          border: `1px solid ${domainColor}50`,
          marginBottom: '1.1rem',
        }}>
          {q.domain}
        </span>

        {q.whatsTested && (
          <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderLeft: '3px solid var(--prime)', borderRadius: 8, padding: '0.5rem 0.85rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)' }}>Testing: </span>
            <span style={{ fontSize: '11px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{q.whatsTested}</span>
          </div>
        )}
        {/* Question */}
        <p style={{
          fontSize: '1.08rem', fontWeight: 700, color: 'var(--ink-hi)',
          lineHeight: 1.55, marginBottom: '1.5rem', marginTop: 0,
        }}>
          {q.q}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {q.options.map((opt, i) => (
            <button key={i} style={optionStyle(i)} onClick={() => handleAnswer(i)}>
              <span style={{
                display: 'inline-block', width: 22, height: 22, lineHeight: '22px',
                textAlign: 'center', borderRadius: '50%', marginRight: '0.75rem',
                background: 'var(--rim)', fontSize: '0.78rem', fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {answered !== null && (
          <div style={{
            marginTop: '1.25rem', padding: '1rem 1.1rem',
            background: isCorrect ? 'rgba(52,211,153,0.15)' : 'rgba(244,63,94,0.15)',
            border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`,
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1rem' }}>{isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}</span>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700,
                color: isCorrect ? 'var(--mint)' : 'var(--rose)',
              }}>
                {isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.6 }}>
              {q.explanation}
            </p>
            {q.antiPattern && <div style={{ marginTop: '0.65rem', padding: '0.45rem 0.75rem', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.18)', borderLeft: '3px solid var(--rose)', borderRadius: 8 }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--rose)' }}>Trap: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{q.antiPattern}</span></div>}
            {q.staffFraming && <div style={{ marginTop: '0.4rem', padding: '0.45rem 0.75rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', borderLeft: '3px solid rgba(139,92,246,0.6)', borderRadius: 8 }}><span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(139,92,246,0.9)' }}>Senior frame: </span><span style={{ fontSize: '11px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{q.staffFraming}</span></div>}
          </div>
        )}
      </div>

      {/* Next button */}
      {answered !== null && (
        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button
            onClick={handleNextFixed}
            style={{
              background: 'var(--prime)', color: 'var(--void)',
              border: 'none', borderRadius: 10, padding: '0.75rem 2rem',
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {idx + 1 >= total ? 'See Results' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Results Screen ──────────────────────────────────────────────────────────

function ResultsScreen({ score, total, domainStats, onDrillAgain, onNewSession }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const [copied, setCopied] = useState(false)

  const scoreColor = 'var(--prime)'

  // All domains that appeared
  const domains = Object.keys(domainStats)

  const weakest = [...Object.keys(domainStats)].sort((a, b) => {
    const accA = domainStats[a].total > 0 ? domainStats[a].correct / domainStats[a].total : 0
    const accB = domainStats[b].total > 0 ? domainStats[b].correct / domainStats[b].total : 0
    return accA - accB
  })[0] || ''

  function handleShare() {
    const text = `ML Systems Lab Trainer: ${score}/${total} · ${pct}% · Weak: ${weakest} → ml-systems-lab-v9xe.vercel.app`
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }

  // Sort by accuracy ascending (weakest first)
  const sortedDomains = [...domains].sort((a, b) => {
    const accA = domainStats[a].total > 0 ? domainStats[a].correct / domainStats[a].total : 0
    const accB = domainStats[b].total > 0 ? domainStats[b].correct / domainStats[b].total : 0
    return accA - accB
  })

  function domainBarColor(acc) {
    return 'var(--prime)'
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink-hi)', margin: 0, marginBottom: '0.35rem' }}>
          Session Complete
        </h2>
        <p style={{ color: 'var(--ink-mid)', fontSize: '0.9rem', margin: 0 }}>
          Here is how you did
        </p>
      </div>

      {/* Big score */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 16, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
          {score} / {total}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 600, color: scoreColor, marginTop: '0.5rem' }}>
          {pct}%
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--ink-low)', marginTop: '0.35rem' }}>
          {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort — keep drilling the weak spots.' : 'Keep practicing — review the explanations.'}
        </div>
      </div>

      {/* Focus Areas (weakness heatmap) */}
      {sortedDomains.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--rim)',
          borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Focus Areas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sortedDomains.map(d => {
              const { correct, total: dtotal } = domainStats[d]
              const acc = dtotal > 0 ? correct / dtotal : 0
              const barColor = domainBarColor(acc)
              const domainColor = DOMAIN_COLORS[d] || 'var(--prime)'
              return (
                <div key={d}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-mid)' }}>{d}</span>
                    <span style={{
                      fontSize: '0.8rem', fontFamily: 'var(--font-mono)',
                      color: barColor, fontWeight: 600,
                    }}>
                      {correct}/{dtotal} ({Math.round(acc * 100)}%)
                    </span>
                  </div>
                  <div style={{ background: 'var(--rim)', borderRadius: 99, height: 7 }}>
                    <div style={{
                      width: `${acc * 100}%`, height: '100%', borderRadius: 99,
                      background: barColor, transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-domain breakdown (all domains sorted by name) */}
      {domains.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--rim)',
          borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '2rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Domain Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
            {[...domains].sort().map(d => {
              const { correct, total: dtotal } = domainStats[d]
              const acc = dtotal > 0 ? correct / dtotal : 0
              const barColor = domainBarColor(acc)
              return (
                <div key={d} style={{
                  background: 'var(--depth)', border: '1px solid var(--rim)',
                  borderRadius: 10, padding: '0.75rem',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-low)', marginBottom: '0.35rem' }}>{d}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: barColor, fontFamily: 'var(--font-mono)' }}>
                    {correct}/{dtotal}
                  </div>
                  <div style={{ background: 'var(--rim)', borderRadius: 99, height: 4, marginTop: '0.4rem' }}>
                    <div style={{ width: `${acc * 100}%`, height: '100%', borderRadius: 99, background: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={onDrillAgain}
          style={{
            background: 'var(--prime)', color: 'var(--void)',
            border: 'none', borderRadius: 10, padding: '0.8rem 1.75rem',
            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Drill Again
        </button>
        <button
          onClick={onNewSession}
          style={{
            background: 'none', color: 'var(--ink-mid)',
            border: '1px solid var(--rim)', borderRadius: 10, padding: '0.8rem 1.75rem',
            fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          New Session
        </button>
        <button
          onClick={handleShare}
          style={{
            background: 'none', border: '1px solid var(--rim)',
            borderRadius: 10, padding: '0.8rem 1.75rem',
            fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', color: copied ? 'var(--prime)' : 'var(--ink-mid)',
            transition: 'color 0.2s',
          }}
        >
          {copied ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg> Copied!' : '⎘ Share Score'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TrainerTab({ onNavigate }) {
  const [screen, setScreen] = useState('setup') // 'setup' | 'drill' | 'results'
  const [questions, setQuestions] = useState([])
  const [results, setResults] = useState(null) // { score, total, domainStats }
  const [lastQuestions, setLastQuestions] = useState([])

  function handleStart(qs) {
    setQuestions(qs)
    setLastQuestions(qs)
    setResults(null)
    setScreen('drill')
  }

  function handleFinish(score, domainStats, qs) {
    const total = qs.length
    trackModuleComplete('trainer_session', 'trainer', Math.round((score / total) * 100))

    // Build domain breakdown for storage
    const domainBreakdown = Object.entries(domainStats).map(([domain, s]) => ({
      domain, correct: s.correct, total: s.total,
    }))

    // Save to localStorage
    try {
      const history = JSON.parse(localStorage.getItem('msl_trainer_history') || '[]')
      history.push({
        date: new Date().toISOString(),
        score,
        total,
        domainBreakdown,
      })
      localStorage.setItem('msl_trainer_history', JSON.stringify(history))
    } catch (_) {}

    setResults({ score, total, domainStats })
    setScreen('results')
  }

  function handleDrillAgain() {
    // Re-shuffle the same config
    setQuestions(shuffle(lastQuestions))
    setResults(null)
    setScreen('drill')
  }

  function handleNewSession() {
    setScreen('setup')
    setResults(null)
  }

  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--void)',
      color: 'var(--ink-hi)',
      fontFamily: 'var(--font-sans)',
    }}>
      {screen === 'setup' && (
        <SetupScreen onStart={handleStart} />
      )}
      {screen === 'drill' && (
        <DrillScreen
          questions={questions}
          onFinish={handleFinish}
          onAbort={() => setScreen('setup')}
        />
      )}
      {screen === 'results' && results && (
        <ResultsScreen
          score={results.score}
          total={results.total}
          domainStats={results.domainStats}
          onDrillAgain={handleDrillAgain}
          onNewSession={handleNewSession}
        />
      )}

      {onNavigate && screen === 'setup' && (
        <div style={{ background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>AUC Is Not Your Friend: A Guide to ML Metric Selection</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}
    </div>
  )
}
