// src/components/foundations/QnAPanel.jsx — Interview QnA view (QNA-INTERVIEW-STANDARD.md).
// Rendered as a completion-gated third view (Full / Quick recap / Interview QnA) by every
// foundation family tab via FoundationViewTabs. States:
//   - no qnaBank entry (or status 'draft') → "coming soon" stub
//   - status 'parked'                      → questions visible, answers "in progress" (self-quiz)
//   - status 'answered'                    → full grid: beats, level chips, tap-to-reveal,
//                                            per-level expand-all, traps, follow-up jumps,
//                                            L3 cases, "Beyond this module" handoffs.
// Question IDs are global + permanent; element ids are `qna-<id>` for anchors/deep links.
//
// Browsing UX (rebuilt — see CLAUDE.md session note on the QnA panel rebuild):
//   - Single-open accordion by default: tapping a question expands it and auto-collapses
//     whichever other question was open. Only one question open at a time in normal browsing.
//   - Two independent filter dimensions, chip rows: Level (L0-L3, real filter) and Difficulty
//     (Easy/Medium/Hard, from each question's `difficulty` field — see qnaBank.js header for the
//     field spec). Both combine with AND logic when active. A separate "All" chip clears both.
//   - Expand-all/Collapse-all is HIDDEN with no filter active (accordion-only default) and
//     APPEARS once a level and/or difficulty filter is active, applying to the filtered set only.
//   - Tie-break for partial-expand state: the control reads "Collapse all" only when every
//     currently-filtered question is expanded; any lesser state (including zero expanded) reads
//     "Expand all" and expanding is idempotent over already-open questions. Opening any single
//     question (via tap or follow-up jump or deep link) always collapses every other question
//     first, so a prior bulk expand-all decays back to solo-accordion behavior on the next open —
//     but closing one question out of a bulk-expanded set only closes that one, not the others.

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

// Level-chip hover tooltips (2026-07-16): each L0-L3 chip's title is the level's real
// definition from QNA-INTERVIEW-STANDARD.md's level taxonomy -- not invented copy.
const LEVEL_META = {
  0: { label: 'L0', desc: 'definition', color: 'var(--ink-low)',
       title: "L0 — definition/recall: what it is, where it lives, what it's for." },
  1: { label: 'L1', desc: 'mechanism', color: 'var(--prime)',
       title: "L1 — mechanism/why: how it works, why it's built this way, what breaks without it." },
  2: { label: 'L2', desc: 'tradeoff', color: '#b45309',
       title: "L2 — comparison/tradeoff: X vs Y, when to use which, where X stops holding." },
  3: { label: 'L3', desc: 'case', color: '#e05050',
       title: "L3 — case: an applied production/diagnostic scenario you walk through step by step." },
}

const DIFFICULTY_META = {
  easy: { label: 'Easy', color: '#16a34a' },
  medium: { label: 'Medium', color: '#b45309' },
  hard: { label: 'Hard', color: '#e05050' },
}

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard']

function LevelChip({ level }) {
  const m = LEVEL_META[level] || LEVEL_META[0]
  return (
    <span title={m.title} style={{
      flexShrink: 0, fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
      color: m.color, border: `1px solid ${m.color}`, borderRadius: '3px',
      padding: '0.05rem 0.3rem', lineHeight: 1.4, opacity: 0.9, marginTop: '2px',
    }}>
      {m.label}
    </span>
  )
}

// Shared chip button for the Level / Difficulty / All filter rows.
function FilterChip({ active, color, onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
      color: active ? '#000' : color, background: active ? color : 'transparent',
      border: `1px solid ${color}`, borderRadius: '4px', padding: '0.12rem 0.45rem',
      cursor: 'pointer', opacity: active ? 1 : 0.85,
    }}>
      {children}
    </button>
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
  const [levelFilter, setLevelFilter] = useState(null)
  const [difficultyFilter, setDifficultyFilter] = useState(null)

  // Opening a single question (tap, follow-up jump, or deep-link arrival) always collapses
  // every other question first — accordion behavior. Closing one question out of a
  // bulk-expanded set (see expand-all below) only closes that one.
  const openOnly = (id) => setExpanded(new Set([id]))

  // Deep-link arrival: a `qna-<id>` anchor in the URL auto-expands its question.
  useEffect(() => {
    if (!entry || (entry.status !== 'answered' && entry.status !== 'parked' && entry.status !== 'draft')) return
    const allNodesForLink = [...(entry.beats || []).flatMap(b => b.questions), ...(entry.cases || [])]
    const m = (window.location.hash || '').match(/qna-[a-z0-9-]+/)
    if (!m) return
    const id = m[0]
    if (!allNodesForLink.some(n => n.id === id)) return
    openOnly(id)
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId])

  const header = (label) => (
    <div style={{
      fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase',
      letterSpacing: '0.08em', marginBottom: '0.75rem',
    }}>{label}</div>
  )

  // Draft entries (questions written, not yet light-question-audited) now render like
  // parked ones -- 2026-07-11 supersedes the original "draft = not rendered" rule in
  // QNA-INTERVIEW-STANDARD.md at the user's explicit direction.
  if (!entry) {
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

  const toggle = (id) => setExpanded(prev => {
    if (prev.has(id)) {
      // Closing one question out of whatever's currently open only closes that one.
      const s = new Set(prev)
      s.delete(id)
      return s
    }
    // Opening a question collapses every other question first (solo accordion).
    return new Set([id])
  })

  const jump = (id) => {
    openOnly(id)
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const levelsPresent = [...new Set(allNodes.map(n => n.level))].sort()
  const difficultiesPresent = DIFFICULTY_ORDER.filter(d => allNodes.some(n => n.difficulty === d))
  const hasActiveFilter = levelFilter !== null || difficultyFilter !== null
  const clearFilters = () => { setLevelFilter(null); setDifficultyFilter(null) }
  const toggleLevel = (l) => setLevelFilter(prev => (prev === l ? null : l))
  const toggleDifficulty = (d) => setDifficultyFilter(prev => (prev === d ? null : d))

  const filterMatches = (n) =>
    (levelFilter === null || n.level === levelFilter) &&
    (difficultyFilter === null || n.difficulty === difficultyFilter)

  const filteredBeats = entry.beats
    .map(b => ({ ...b, questions: b.questions.filter(filterMatches) }))
    .filter(b => b.questions.length > 0)
  const filteredCases = (entry.cases || []).filter(filterMatches)
  const visibleNodes = [...filteredBeats.flatMap(b => b.questions), ...filteredCases]

  // Expand-all/Collapse-all applies only to whatever the current filter shows. Tie-break:
  // the control reads "Collapse all" only when every visible question is already expanded;
  // any partial state (including none expanded) reads "Expand all".
  const allVisibleExpanded = visibleNodes.length > 0 && visibleNodes.every(n => expanded.has(n.id))
  const toggleExpandAll = () => setExpanded(prev => {
    const s = new Set(prev)
    if (allVisibleExpanded) {
      visibleNodes.forEach(n => s.delete(n.id))
    } else {
      visibleNodes.forEach(n => s.add(n.id))
    }
    return s
  })

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {header('Interview QnA')}

      {entry.status === 'draft' && (
        <div style={{
          border: '1px solid rgba(161, 161, 170, 0.35)', background: 'rgba(161, 161, 170, 0.08)',
          borderRadius: '8px', padding: '0.7rem 0.9rem', marginBottom: '0.9rem',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.55 }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: '#71717a', marginRight: '0.45rem' }}>DRAFT</span>
            These questions are early, unaudited drafts -- phrasing and scope haven't passed the
            light question-audit yet. Answers are still being written. Use them to self-quiz, but
            treat the questions themselves as provisional.
          </p>
        </div>
      )}

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

      <div style={{ fontSize: '0.72rem', color: 'var(--ink-low)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.5rem' }}>
        {hasActiveFilter ? `${visibleNodes.length} of ${allNodes.length} questions match filters` : `${allNodes.length} questions`} · tap to reveal
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono, monospace)', marginRight: '0.15rem' }}>level:</span>
        <FilterChip active={!hasActiveFilter} color="var(--ink-low)" onClick={clearFilters}>All</FilterChip>
        {levelsPresent.map(l => (
          <FilterChip key={l} active={levelFilter === l} color={LEVEL_META[l].color} title={LEVEL_META[l].title} onClick={() => toggleLevel(l)}>
            {LEVEL_META[l].label} · {LEVEL_META[l].desc}
          </FilterChip>
        ))}
      </div>

      {difficultiesPresent.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono, monospace)', marginRight: '0.15rem' }}>difficulty:</span>
          {difficultiesPresent.map(d => (
            <FilterChip key={d} active={difficultyFilter === d} color={DIFFICULTY_META[d].color} onClick={() => toggleDifficulty(d)}>
              {DIFFICULTY_META[d].label}
            </FilterChip>
          ))}
        </div>
      )}

      {hasActiveFilter && (
        <div style={{ marginBottom: '0.75rem' }}>
          <button onClick={toggleExpandAll} style={{
            fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--prime)', border: '1px solid var(--prime)', background: 'transparent',
            borderRadius: '5px', padding: '0.25rem 0.6rem', cursor: 'pointer',
          }}>
            {allVisibleExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      )}

      {hasActiveFilter && visibleNodes.length === 0 && (
        <p style={{ fontSize: '0.83rem', color: 'var(--ink-low)', margin: '0.5rem 0 1rem', lineHeight: 1.55 }}>
          No questions match this filter combination.
        </p>
      )}

      {filteredBeats.map((beat, bi) => (
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

      {filteredCases.length > 0 && (
        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, color: '#e05050',
            fontFamily: 'var(--font-mono, monospace)', marginBottom: '0.55rem',
          }}>Cases — walk the diagnosis out loud</div>
          {filteredCases.map(node => (
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
