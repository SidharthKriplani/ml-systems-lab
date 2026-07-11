// src/components/foundations/QnAPanel.jsx — Interview QnA view (QNA-INTERVIEW-STANDARD.md).
// Rendered as a completion-gated third view (Full / Quick recap / Interview QnA) by every
// foundation family tab via FoundationViewTabs. States:
//   - no qnaBank entry (or status 'draft') → "coming soon" stub
//   - status 'parked'                      → questions visible, answers "in progress" (self-quiz)
//   - status 'answered'                    → full grid: beats, level chips, tap-to-reveal,
//                                            per-level expand-all, traps, follow-up jumps,
//                                            L3 cases, "Beyond this module" handoffs.
// Question IDs are global + permanent; element ids are `qna-<id>` for anchors/deep links.

import { useState, useEffect } from 'react'
import { renderMd } from '../../utils/renderMd'
import { qnaForModule, qnaQuestionCount } from '../../data/qnaBank.js'

export function LockIcon({ size = 11, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke={color} strokeWidth="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke={color} strokeWidth="2" />
    </svg>
  )
}

const LEVEL_META = {
  0: { label: 'L0', desc: 'definition', color: 'var(--ink-low)' },
  1: { label: 'L1', desc: 'mechanism', color: 'var(--prime)' },
  2: { label: 'L2', desc: 'tradeoff', color: '#b45309' },
  3: { label: 'L3', desc: 'case', color: '#e05050' },
}

function LevelChip({ level }) {
  const m = LEVEL_META[level] || LEVEL_META[0]
  return (
    <span style={{
      flexShrink: 0, fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
      color: m.color, border: `1px solid ${m.color}`, borderRadius: '3px',
      padding: '0.05rem 0.3rem', lineHeight: 1.4, opacity: 0.9, marginTop: '2px',
    }}>
      {m.label}
    </span>
  )
}

function QuestionRow({ node, expanded, onToggle, onJump }) {
  const hasAnswer = !!node.answer // parked questions ship before their answers do
  return (
    <div id={node.id} style={{
      border: '1px solid var(--rim)', borderRadius: '10px', background: 'var(--surface)',
      overflow: 'hidden', marginBottom: '0.45rem',
    }}>
      <div
        onClick={() => hasAnswer && onToggle(node.id)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
          padding: '0.7rem 0.9rem', cursor: hasAnswer ? 'pointer' : 'default',
        }}
      >
        <LevelChip level={node.level} />
        <div style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.45 }}>
          {node.q}
        </div>
        {hasAnswer ? (
          <span style={{ color: 'var(--ink-ghost)', fontSize: '0.85rem', marginTop: '1px' }}>{expanded ? '−' : '+'}</span>
        ) : (
          <span style={{
            flexShrink: 0, fontSize: '0.58rem', fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--ink-ghost)', border: '1px solid var(--rim)', borderRadius: '3px',
            padding: '0.08rem 0.3rem', marginTop: '2px',
          }}>
            answer in progress
          </span>
        )}
      </div>
      {expanded && hasAnswer && (
        <div style={{ padding: '0.2rem 0.9rem 0.9rem', borderTop: '1px solid var(--rim)' }}>
          <div style={{ paddingTop: '0.6rem' }}>
            {renderMd(node.answer, { fontSize: '0.88rem', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 })}
          </div>
          {node.trap && (
            <div style={{
              marginTop: '0.7rem', border: '1px solid rgba(224, 80, 80, 0.35)',
              background: 'rgba(224, 80, 80, 0.06)', borderRadius: '8px', padding: '0.6rem 0.75rem',
            }}>
              <span style={{
                fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
                color: '#e05050', marginRight: '0.45rem', verticalAlign: 'top',
              }}>TRAP</span>
              <span style={{ fontSize: '0.83rem', color: 'var(--ink-mid)', lineHeight: 1.6 }}>
                {renderMd(node.trap, { display: 'inline', fontSize: '0.83rem', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 })}
              </span>
            </div>
          )}
          {node.followUp && (
            <button
              onClick={() => onJump(node.followUp)}
              style={{
                marginTop: '0.6rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              likely follow-up → open it
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function QnAPanel({ moduleId, unlocked }) {
  const entry = qnaForModule(moduleId)
  const [expanded, setExpanded] = useState(() => new Set())
  // Deep-link arrival: a `qna-<id>` anchor in the URL auto-expands its question.
  useEffect(() => {
    if (!entry || (entry.status !== 'answered' && entry.status !== 'parked')) return
    const allNodesForLink = [...(entry.beats || []).flatMap(b => b.questions), ...(entry.cases || [])]
    const m = (window.location.hash || '').match(/qna-[a-z0-9-]+/)
    if (!m) return
    const id = m[0]
    if (!allNodesForLink.some(n => n.id === id)) return
    setExpanded(prev => new Set(prev).add(id))
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId])

  const header = (label) => (
    <div style={{
      fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase',
      letterSpacing: '0.08em', marginBottom: '0.75rem',
    }}>{label}</div>
  )

  if (!entry || entry.status === 'draft') {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
        {header('Interview QnA')}
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-low)', margin: 0, lineHeight: 1.6 }}>
          Interview QnA for this module is coming soon — a question-indexed second pass for
          interview prep, built from this module's own content.
        </p>
      </div>
    )
  }

  if (!unlocked) {
    // Normally unreachable (the tab enforces the gate) — defensive fallback.
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <LockIcon size={14} color="var(--ink-low)" />
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-low)', margin: 0 }}>
          Mark the module complete to unlock its {qnaQuestionCount(entry)} interview questions.
        </p>
      </div>
    )
  }

  const allNodes = [...entry.beats.flatMap(b => b.questions), ...(entry.cases || [])]
  const toggle = (id) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const jump = (id) => {
    setExpanded(prev => new Set(prev).add(id))
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }
  const expandLevel = (level) => setExpanded(prev => {
    const s = new Set(prev)
    allNodes.filter(n => n.level === level).forEach(n => s.add(n.id))
    return s
  })
  const levelsPresent = [...new Set(allNodes.map(n => n.level))].sort()


  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {header('Interview QnA')}

      {entry.status === 'parked' && (
        <div style={{
          border: '1px solid rgba(245, 158, 11, 0.5)', background: 'rgba(245, 158, 11, 0.08)',
          borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '0.9rem',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.55 }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: '#b45309', marginRight: '0.45rem' }}>PARKED</span>
            The question grid is live; audited answers are still being written. Use the questions to
            self-quiz — answer out loud, then check yourself against the module.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-low)', fontFamily: 'var(--font-mono, monospace)' }}>
          {allNodes.length} questions · tap to reveal · expand all:
        </span>
        {levelsPresent.map(l => (
          <button key={l} onClick={() => expandLevel(l)} style={{
            fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
            color: LEVEL_META[l].color, border: `1px solid ${LEVEL_META[l].color}`,
            background: 'transparent', borderRadius: '4px', padding: '0.12rem 0.45rem', cursor: 'pointer',
          }}>
            {LEVEL_META[l].label} · {LEVEL_META[l].desc}
          </button>
        ))}
        {expanded.size > 0 && (
          <button onClick={() => setExpanded(new Set())} style={{
            fontSize: '0.62rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--ink-low)',
            border: '1px solid var(--rim)', background: 'transparent', borderRadius: '4px',
            padding: '0.12rem 0.45rem', cursor: 'pointer',
          }}>
            collapse all
          </button>
        )}
      </div>

      {entry.beats.map((beat, bi) => (
        <div key={bi} style={{ marginBottom: '1.4rem' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-low)',
            fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.55rem',
          }}>{beat.name}</div>
          {beat.questions.map(node => (
            <QuestionRow key={node.id} node={node} expanded={expanded.has(node.id)} onToggle={toggle} onJump={jump} />
          ))}
        </div>
      ))}

      {(entry.cases || []).length > 0 && (
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, color: '#e05050',
            fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.55rem',
          }}>Cases — walk the diagnosis out loud</div>
          {entry.cases.map(node => (
            <QuestionRow key={node.id} node={node} expanded={expanded.has(node.id)} onToggle={toggle} onJump={jump} />
          ))}
        </div>
      )}

      {(entry.beyond || []).length > 0 && (
        <div>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-low)',
            fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.3rem',
          }}>Beyond this module</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-low)', margin: '0 0 0.55rem', lineHeight: 1.5 }}>
            Questions that naturally come up here but whose answers live in other modules.
          </p>
          {entry.beyond.map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              border: '1px solid var(--rim)', borderRadius: '8px', background: 'var(--surface)',
              padding: '0.55rem 0.75rem', marginBottom: '0.4rem',
            }}>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{b.q}</span>
              <span style={{
                flexShrink: 0, fontSize: '0.6rem', fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--ink-low)', border: '1px solid var(--rim)', borderRadius: '3px',
                padding: '0.08rem 0.35rem', marginTop: '2px',
              }}>
                → {b.moduleId} · QnA coming
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
