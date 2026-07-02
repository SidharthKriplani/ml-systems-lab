// StartHereTab — the front door. Explains the lab's 6 layers (each routes in),
// then a level × timeline picker that reuses recommendationEngine to point the
// user at a concrete first read + practice room.

import { useState, useEffect } from 'react'
import { recommendNext, readOnboarding, writeOnboarding } from '../data/recommendationEngine.js'

const LAYERS = [
  { key: 'know',  label: 'KNOW',  tab: 'gradient',      color: 'var(--prime)',
    desc: 'Learn the concepts — 17 foundation rooms (math → deep learning → systems) plus long-form essays, each with figures, interactives, and a quick-recap toggle.' },
  { key: 'do',    label: 'DO',    tab: 'mlcoding',      color: '#4aa3ff',
    desc: 'Write the code — ML-specific Python problems live in the browser, plus the data-engineering stack (Spark, dbt, Airflow).' },
  { key: 'build', label: 'BUILD', tab: 'projectlab',    color: '#22c55e',
    desc: 'Ship an end-to-end project — full notebooks (churn, fraud, loan default) with judgment checkpoints at every phase.' },
  { key: 'judge', label: 'JUDGE', tab: 'design',        color: '#f59e0b',
    desc: 'Exercise judgment — production scenarios and adversarial drills (spot-the-flaw, incident diagnosis, bug hunt) across every domain.' },
  { key: 'prep',  label: 'PREP & ASSESS', tab: 'defense', color: '#a78bfa',
    desc: 'Get interview-ready — paste a JD for a gap map and study plan, drill a Q&A bank, take a timed mock, or rehearse out loud.' },
  { key: 'track', label: 'TRACK', tab: 'my_tracks',     color: 'var(--ink-mid)',
    desc: 'Make it yours — save modules into custom study tracks and revisit them; watch progress across every room.' },
]

const LEVELS = [
  { key: 'beginner', label: 'New to ML',        sub: 'building the foundation' },
  { key: 'mid',      label: 'A few years in',   sub: 'senior MLE / DS track' },
  { key: 'senior',   label: 'Senior / Staff',   sub: 'depth + judgment' },
]
const TIMELINES = [
  { key: 'week',     label: 'Interview this week', sub: 'highest-leverage only' },
  { key: 'month',    label: 'Within a month',      sub: 'targeted prep' },
  { key: 'learning', label: 'Just leveling up',    sub: 'no deadline' },
]

export default function StartHereTab({ onNavigate }) {
  const go = (tab) => onNavigate && onNavigate(tab)
  const [level, setLevel] = useState(null)
  const [timeline, setTimeline] = useState(null)

  useEffect(() => {
    const o = readOnboarding()
    if (o.level) setLevel(o.level)
    if (o.urgency) setTimeline(o.urgency)
  }, [])

  useEffect(() => {
    if (level && timeline) writeOnboarding({ level, urgency: timeline, completed: true })
  }, [level, timeline])

  const rec = level && timeline ? recommendNext({ level, urgency: timeline }) : null

  const card = { background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 10 }
  const pill = (active, color) => ({
    flex: 1, minWidth: 150, textAlign: 'left', cursor: 'pointer', padding: '0.7rem 0.9rem',
    borderRadius: 9, fontFamily: 'var(--font-sans)',
    background: active ? 'var(--prime-faint)' : 'var(--depth)',
    border: `1px solid ${active ? (color || 'var(--prime)') : 'var(--rim)'}`,
  })

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '2.2rem 1.5rem', fontFamily: 'var(--font-sans)' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--prime)', opacity: 0.8, marginBottom: '0.4rem' }}>Getting started</p>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--ink-hi)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Start Here</h1>
      <p style={{ fontSize: '0.92rem', color: 'var(--ink-mid)', margin: '0 0 1.8rem', lineHeight: 1.6, maxWidth: 560 }}>
        MSL is built for senior MLE / DS interview prep. It has six layers — learn, code, build, judge, prep, and track. Tell it where you are and it'll point you at a concrete first step.
      </p>

      {/* the lab map */}
      <h2 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-low)', margin: '0 0 0.7rem' }}>The lab in 60 seconds</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(228px, 1fr))', gap: '0.6rem', marginBottom: '2rem' }}>
        {LAYERS.map(L => (
          <button key={L.key} onClick={() => go(L.tab)} style={{ ...card, padding: '0.9rem 1rem', textAlign: 'left', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = L.color }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.04em', color: L.color }}>{L.label}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--ink-low)' }}>→</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>{L.desc}</p>
          </button>
        ))}
      </div>

      {/* picker */}
      <h2 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-low)', margin: '0 0 0.7rem' }}>Find your starting point</h2>
      <div style={{ ...card, padding: '1.1rem 1.2rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', marginBottom: '0.5rem', fontWeight: 600 }}>Where are you?</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
          {LEVELS.map(o => (
            <button key={o.key} onClick={() => setLevel(o.key)} style={pill(level === o.key)}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: level === o.key ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{o.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)' }}>{o.sub}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-mid)', marginBottom: '0.5rem', fontWeight: 600 }}>What's the timeline?</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {TIMELINES.map(o => (
            <button key={o.key} onClick={() => setTimeline(o.key)} style={pill(timeline === o.key)}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: timeline === o.key ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{o.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-low)' }}>{o.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* recommendation */}
      {rec ? (
        <div style={{ background: 'var(--prime-faint)', border: '1px solid var(--prime)', borderRadius: 10, padding: '1.1rem 1.25rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--prime)', marginBottom: '0.5rem' }}>Your next 30 minutes</div>
          <div style={{ fontSize: '1.02rem', fontWeight: 800, color: 'var(--ink-hi)', marginBottom: '0.3rem' }}>{rec.postTitle}{rec.readMin ? ` · ${rec.readMin} min` : ''}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', margin: '0 0 0.9rem', lineHeight: 1.55 }}>{rec.why}</p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={() => go('gradient')} style={{ background: 'var(--prime)', color: '#000', fontWeight: 700, fontSize: '0.82rem', border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Read it →</button>
            {rec.practiceTabId && (
              <button onClick={() => go(rec.practiceTabId)} style={{ background: 'var(--surface)', color: 'var(--ink-hi)', fontWeight: 700, fontSize: '0.82rem', border: '1px solid var(--rim)', borderRadius: 8, padding: '0.6rem 1.2rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Then practice: {rec.practiceLabel} →</button>
            )}
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-low)', margin: '0.2rem 0 0', fontStyle: 'italic' }}>Pick your level and timeline above to get a recommended first read and practice room.</p>
      )}
    </div>
  )
}
