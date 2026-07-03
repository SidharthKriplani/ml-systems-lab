import { useState, useEffect } from 'react'
import {
  readFoundationsRead, overallCompletion,
} from '../data/foundationsPath.js'
import {
  recommendNext, readOnboarding, readHomeOverride, writeHomeOverride, deriveHomeMode,
} from '../data/recommendationEngine.js'
import { track } from '../analytics.js'
import { computeReadiness, readinessLabel, readinessColor } from '../utils/readiness.js'
import Next30Card from '../components/Next30Card.jsx'

// ── The five frames of the current app ───────────────────────────────────────
// Each maps to its representative launch tab. This is the ground truth for Home —
// deep dashboards live in My Progress; Home is a lean launcher.
const FRAMES = [
  {
    id: 'know',
    label: 'KNOW',
    sub: 'Foundations & theory',
    desc: 'Deep-dive essays and the MLE Path — math, stats, classical ML, deep learning, system design.',
    tab: 'gradient',
    cta: 'Open essays →',
  },
  {
    id: 'do',
    label: 'DO',
    sub: 'Code',
    desc: 'ML coding across four types — implement, debug, optimise, design — plus buggy-code review drills.',
    tab: 'mlcoding',
    cta: 'Start coding →',
  },
  {
    id: 'build',
    label: 'BUILD',
    sub: 'Projects',
    desc: 'End-to-end notebooks in your browser — churn, loan default, and fraud detection with live execution.',
    tab: 'projectlab',
    cta: 'Open project lab →',
  },
  {
    id: 'judge',
    label: 'JUDGE',
    sub: 'Judgment',
    desc: '425 judgment drills across 10 subjects, plus Cross-Domain Challenges for production diagnosis under pressure.',
    tab: 'judge_browser',
    cta: 'Open drills →',
  },
  {
    id: 'prep',
    label: 'PREP & ASSESS',
    sub: 'Interview',
    desc: '210 interview questions — Q&A, behavioral/STAR, take-homes, defend-your-project — and timed drilling.',
    tab: 'interview_questions',
    cta: 'Open questions →',
  },
]

// Where "work next" on a readiness weakness should send the user.
const WEAKEST_TAB = {
  foundations: 'gradient',
  practice:    'interview_questions',
}

// ── Streak (read-only; Home does not gate on it) ─────────────────────────────
function readAndUpdateStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const last  = localStorage.getItem('msl_last_visit')
    let streak  = parseInt(localStorage.getItem('msl_streak') || '0', 10)
    if (last === today) return streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    streak = last === yesterday ? streak + 1 : 1
    localStorage.setItem('msl_streak', String(streak))
    localStorage.setItem('msl_last_visit', today)
    localStorage.setItem(`msl_activity_${today}`, '1')
    return streak
  } catch { return 0 }
}

function readTotalAttempted() {
  let attempted = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('msl_score:')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const p = JSON.parse(raw)
        if (p && typeof p.attempted === 'number') attempted += p.attempted
      } catch {}
    }
  } catch {}
  return attempted
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function HomeTab({ onNavigate }) {
  const [streak] = useState(() => readAndUpdateStreak())
  const [totalAttempted, setTotalAttempted] = useState(() => readTotalAttempted())
  const [foundationsProg, setFoundationsProg] = useState(() => overallCompletion(readFoundationsRead()))

  useEffect(() => {
    function refresh() {
      setTotalAttempted(readTotalAttempted())
      setFoundationsProg(overallCompletion(readFoundationsRead()))
    }
    window.addEventListener('msl_score_updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('msl_score_updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // ── Cold Home / Next 30 Minutes mode derivation ─────────────────────────
  const [homeMode, setHomeMode] = useState(() => {
    const onboarding = readOnboarding()
    const override = readHomeOverride()
    return deriveHomeMode({
      totalAttempted,
      foundationsReadSize: readFoundationsRead().size,
      onboardingCompleted: onboarding.completed,
      override,
    })
  })
  const [onboardingPick] = useState(() => readOnboarding())
  const [recommendation, setRecommendation] = useState(() =>
    recommendNext({ level: onboardingPick.level, urgency: onboardingPick.urgency })
  )

  function handleSeeEverything() {
    setHomeMode('dashboard')
  }

  function handleBackToFocused() {
    writeHomeOverride(null)
    setRecommendation(recommendNext({ level: onboardingPick.level, urgency: onboardingPick.urgency }))
    setHomeMode('next30')
    track('dashboard_back_to_focused_clicked')
  }

  const isNewUser = totalAttempted === 0 && foundationsProg.read === 0

  // ── Brand-new users are handed to Start Here (the onboarding owner) ──────
  if (homeMode === 'quiz') {
    return (
      <div style={{ maxWidth: '660px', margin: '0 auto', paddingTop: '60px', paddingBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--prime)' }}>ML Systems Lab</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: '1.6rem 1.6rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink-hi)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>New here?</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-mid)', margin: '0 0 1.2rem', lineHeight: 1.6 }}>
            Start Here walks you through the lab's frames and points you at a concrete first read and practice room based on your level and timeline.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('start_here')} style={{ background: 'var(--prime)', color: '#000', fontWeight: 700, fontSize: '0.85rem', border: 'none', borderRadius: 8, padding: '0.65rem 1.3rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Go to Start Here →</button>
            <button onClick={() => setHomeMode('dashboard')} style={{ background: 'var(--depth)', color: 'var(--ink-mid)', fontWeight: 600, fontSize: '0.85rem', border: '1px solid var(--rim)', borderRadius: 8, padding: '0.65rem 1.3rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Skip to launcher</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Next 30 mode — early users see one recommendation ───────────────────
  if (homeMode === 'next30') {
    return (
      <div style={{ maxWidth: '660px', margin: '0 auto', paddingTop: '60px', paddingBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--prime)' }}>ML Systems Lab</div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '999px', padding: '2px 8px' }}>
              {streak} day streak
            </div>
          )}
        </div>
        <Next30Card recommendation={recommendation} onNavigate={onNavigate} onSeeEverything={handleSeeEverything} />
      </div>
    )
  }

  // ── Launcher mode (default) ──────────────────────────────────────────────
  const r = computeReadiness()
  const weakTab = r.weakest ? (WEAKEST_TAB[r.weakest.key] || 'gradient') : null

  return (
    <div style={{ maxWidth: '660px', margin: '0 auto', paddingBottom: '48px' }}>

      {/* Back to focused mode pill — only when user has fewer than 5 attempts AND override is active */}
      {totalAttempted < 5 && readHomeOverride() === 'dashboard' && (
        <div style={{ paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleBackToFocused}
            style={{ padding: '6px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', background: 'rgba(0,0,0,0.18)', border: '1px solid var(--rim)', borderRadius: '999px', cursor: 'pointer' }}>
            ← back to focused mode
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: '40px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--prime)' }}>ML Systems Lab</div>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '999px', padding: '2px 8px' }}>
              {streak} day streak
            </div>
          )}
        </div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.14, color: 'var(--ink-hi)', marginBottom: '10px' }}>
          Production ML judgment.<br />Built through real failure modes.
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '500px' }}>
          Five frames — know it, do it, build it, judge it, and prep for the room. Pick where to work.
        </p>
      </div>

      {/* ── Readiness hero ───────────────────────────────────────────────── */}
      {isNewUser ? (
        <div style={{ marginBottom: '28px', padding: '18px 20px', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)', borderLeft: '3px solid var(--prime)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Start here</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em', marginBottom: '4px' }}>Get your first readiness reading</div>
            <div style={{ fontSize: '13px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', lineHeight: 1.55 }}>
              Ten minutes of production-judgment scenarios calibrates where you stand — no setup.
            </div>
          </div>
          <button onClick={() => onNavigate('start_here')}
            style={{ flexShrink: 0, fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--void)', background: 'var(--prime)', border: 'none', borderRadius: '7px', padding: '10px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Start here →
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '28px', padding: '18px 20px', borderRadius: '12px', background: 'var(--depth)', border: '1px solid var(--rim)' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px', fontWeight: 700 }}>Interview readiness</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '44px', fontWeight: 900, letterSpacing: '-0.04em', color: readinessColor(r.level), lineHeight: 1 }}>
              {r.score}%
            </span>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: readinessColor(r.level), fontWeight: 600 }}>
              {readinessLabel(r.level)}
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--rim)', borderRadius: '2px', overflow: 'hidden', marginBottom: r.weakest ? '14px' : '0' }}>
            <div style={{ width: `${r.score}%`, height: '100%', background: readinessColor(r.level), transition: 'width 0.5s' }} />
          </div>
          {r.weakest && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', color: 'var(--ink-mid)' }}>
                Work next: <span style={{ fontWeight: 700, color: 'var(--ink-hi)' }}>{r.weakest.label}</span>
              </div>
              <button onClick={() => onNavigate(weakTab)}
                style={{ flexShrink: 0, fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--prime)', background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.35)', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Work on it →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Five launch cards ────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-ghost)', marginBottom: '12px' }}>Where to work</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FRAMES.map(frame => <FrameCard key={frame.id} frame={frame} onNavigate={onNavigate} />)}
        </div>
      </div>

      {/* ── New here? → Start Here handoff ─────────────────────────────────── */}
      <div style={{ marginBottom: '28px', padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', marginBottom: '2px' }}>New here?</div>
          <div style={{ fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
            Start Here walks the five frames and points you at a concrete first read and practice room.
          </div>
        </div>
        <button onClick={() => onNavigate('start_here')}
          style={{ flexShrink: 0, fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--prime)', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Go to Start Here →
        </button>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>
          {totalAttempted > 0 ? `${totalAttempted} scenarios attempted` : 'No progress yet — pick a frame above.'}
        </span>
        <button onClick={() => onNavigate('progress')}
          style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-low)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-ghost)'}>
          full dashboard in My Progress →
        </button>
      </div>

    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function FrameCard({ frame, onNavigate }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={() => onNavigate(frame.tab)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ textAlign: 'left', padding: '15px 17px', background: hov ? 'var(--card-tint)' : 'var(--surface)', border: `1px solid ${hov ? 'var(--rim-hi)' : 'var(--rim)'}`, borderRadius: '10px', cursor: 'pointer', width: '100%', transition: 'border-color var(--t), background var(--t)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '5px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: 'var(--prime)' }}>{frame.label}</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--ink-ghost)' }}>{frame.sub}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', color: 'var(--ink-mid)', lineHeight: 1.55, marginBottom: '8px' }}>{frame.desc}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--prime)', fontWeight: 600 }}>{frame.cta}</div>
    </button>
  )
}
