import { useState, useEffect } from 'react'
import { SYSTEM_DESIGN_MODULES } from '../../data/foundations/systemDesignModules.js'
import { markModuleDone, isModuleDone, getDoneCount, unmarkModuleDone } from '../../utils/foundations/systemDesignFoundationProgress.js'

const MODULES = SYSTEM_DESIGN_MODULES

function difficultyBadge(d) {
  const map = {
    foundational: { label: 'Foundational', color: 'var(--ink-low)' },
    intermediate:  { label: 'Intermediate', color: 'var(--prime)' },
    advanced:      { label: 'Advanced',     color: '#e05050' },
  }
  const cfg = map[d] || map.foundational
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: cfg.color,
      border: `1px solid ${cfg.color}`, borderRadius: '4px',
      padding: '0.1rem 0.4rem', opacity: 0.85 }}>
      {cfg.label}
    </span>
  )
}

function CheckQuestion({ q, a }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--rim)' }}>
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '0.5rem' }}>{q}</div>
      {!revealed ? (
        <button onClick={() => setRevealed(true)}
          style={{ fontSize: '0.78rem', color: 'var(--prime)', background: 'none', border: '1px solid var(--prime)',
            borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Show answer
        </button>
      ) : (
        <div style={{ fontSize: '0.875rem', color: 'var(--ink-mid)', lineHeight: 1.6,
          background: 'var(--prime-faint)', borderRadius: '6px', padding: '0.6rem 0.875rem', marginTop: '0.35rem' }}>
          {a}
        </div>
      )}
    </div>
  )
}

function MarkDoneButton({ moduleId, onDone }) {
  const done = isModuleDone(moduleId)
  return done ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'var(--prime-faint)', border: '1px solid var(--prime)', borderRadius: '8px',
        padding: '0.6rem 1.1rem' }}>
        <span style={{ color: 'var(--prime)', fontSize: '0.9rem', fontWeight: 700 }}>✓ Completed</span>
      </div>
      <button onClick={() => { unmarkModuleDone(moduleId); onDone() }}
        style={{ fontSize: '0.75rem', color: 'var(--ink-low)', background: 'none',
          border: '1px solid var(--rim)', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        Undo
      </button>
    </div>
  ) : (
    <button onClick={() => { markModuleDone(moduleId); onDone() }}
      style={{ background: 'var(--prime)', color: '#000', fontWeight: 700, fontSize: '0.9rem',
        border: 'none', borderRadius: '8px', padding: '0.7rem 1.5rem', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em' }}>
      Mark as complete →
    </button>
  )
}

export function SystemDesignFoundationTab({ onNavigate }) {
  const [selectedId, setSelectedId] = useState(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const h = () => setTick(t => t + 1)
    window.addEventListener('msl_progress', h)
    return () => window.removeEventListener('msl_progress', h)
  }, [])

  const doneCount = getDoneCount(MODULES)
  const selected = MODULES.find(m => m.id === selectedId)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>
      {/* LEFT: Module browser */}
      <div style={{
        width: selected ? '280px' : '100%',
        minWidth: selected ? '220px' : undefined,
        flexShrink: 0,
        borderRight: selected ? '1px solid var(--rim)' : 'none',
        overflowY: 'auto',
        padding: '1.5rem 1rem',
        background: 'var(--depth)',
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink-hi)', margin: 0, letterSpacing: '-0.02em' }}>
            ML System Design Foundations
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-low)', margin: '0.4rem 0 0', lineHeight: 1.4 }}>
            The 6-step design framework, RecSys architecture, two-tower models, and ML platform design.
          </p>
          <div style={{ marginTop: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-low)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-mid)', fontWeight: 700 }}>{doneCount}/{MODULES.length}</span>
            </div>
            <div style={{ height: '4px', background: 'var(--rim)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${MODULES.length ? (doneCount/MODULES.length)*100 : 0}%`, background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {MODULES.map(m => {
          const done = isModuleDone(m.id)
          const isActive = m.id === selectedId
          return (
            <div
              key={m.id}
              onClick={() => setSelectedId(isActive ? null : m.id)}
              style={{
                padding: '0.6rem 0.75rem', marginBottom: '0.3rem', borderRadius: '8px', cursor: 'pointer',
                background: isActive ? 'var(--prime-faint)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--prime)' : 'transparent'}`,
                display: 'flex', alignItems: 'flex-start', gap: '0.6rem', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                background: done ? 'var(--prime)' : 'transparent',
                border: `2px solid ${done ? 'var(--prime)' : 'var(--rim)'}` }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: done ? 'var(--ink-mid)' : 'var(--ink-hi)', lineHeight: 1.3 }}>
                  {m.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-low)', marginTop: '0.15rem' }}>
                  {m.estimatedMin} min · {m.difficulty}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* RIGHT: Module content */}
      {selected && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', background: 'var(--depth)', minWidth: 0 }}>
          <button onClick={() => setSelectedId(null)}
            style={{ fontSize: '0.78rem', color: 'var(--ink-low)', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', padding: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ← All modules
          </button>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              {difficultyBadge(selected.difficulty)}
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-ghost)', fontWeight: 500 }}>~{selected.estimatedMin} min</span>
              {selected.tags?.map(t => (
                <span key={t} style={{ fontSize: '0.65rem', color: 'var(--ink-ghost)', background: 'var(--surface)',
                  border: '1px solid var(--rim)', borderRadius: '4px', padding: '0.1rem 0.35rem' }}>{t}</span>
              ))}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink-hi)', margin: '0 0 0.4rem', letterSpacing: '-0.025em' }}>
              {selected.title}
            </h1>
            <p style={{ fontSize: '0.925rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>
              {selected.subtitle}
            </p>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px',
            padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Concept</div>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{selected.summary}</p>
          </div>

          {selected.takeaway && (
            <div style={{ background: 'var(--prime-faint)', border: '1px solid var(--prime)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Key Insight</div>
              <p style={{ fontSize: '0.925rem', color: 'var(--ink-hi)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{selected.takeaway}</p>
            </div>
          )}

          <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px',
            padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Key Points</div>
            {selected.keyPoints?.map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.55rem', alignItems: 'flex-start' }}>
                <div style={{ width: '3px', minHeight: '1.4rem', background: 'var(--prime)', borderRadius: '2px', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.88rem', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{pt}</div>
              </div>
            ))}
          </div>

          {selected.checkQuestions?.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px',
              padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Check Questions</div>
              {selected.checkQuestions.map((cq, i) => <CheckQuestion key={i} q={cq.q} a={cq.a} />)}
            </div>
          )}

          <MarkDoneButton moduleId={selected.id} onDone={() => setTick(t => t + 1)} />
        </div>
      )}
    </div>
  )
}
