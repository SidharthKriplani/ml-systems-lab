import { useState } from 'react'
import { renderMd } from '../../utils/renderMd'

// Shared "Go Deeper — Academic" panel for all 19 Foundations tabs. Renders the same
// collapsible trigger everywhere so the feature is visually consistent across every
// family, even where content hasn't been written yet.
//
// - When `deeperMath` is a populated array (see the one authored module in
//   data/foundations/deepLearningModules.js — the `attention` module — for the shape:
//   an array of markdown strings, or `{content}` objects), it renders the real content,
//   identical to the original pilot implementation in DeepLearningFoundationTab.jsx.
// - When `deeperMath` is undefined/null/empty, it still renders the trigger, but expanding
//   it shows a lightweight amber "Coming soon" placeholder instead of crashing or being
//   silently absent — same rgba(245,158,11,...) accent already used by the
//   "Before you touch the controls" interactivePrompt block in every foundation tab.
//
// Manages its own expand/collapse state. Callers should pass `key={selected.id}` at the
// call site (mirroring every tab's existing `useEffect(() => { setDeeperOpen(false) },
// [selectedId])` reset behavior) so switching modules always starts collapsed instead of
// carrying over the previous module's expanded state.
//
// 2026-07-09 — built as the shared extraction point for the 18-tab Go-Deeper skeleton
// rollout (see docs/BACKLOG.md). Content population for the other 18 families' modules
// is explicitly NOT part of this pass — this component's job is only to make the entry
// point exist everywhere and degrade cleanly.
export function GoDeeperPanel({ deeperMath, figures }) {
  const [open, setOpen] = useState(false)
  const hasContent = Array.isArray(deeperMath) && deeperMath.length > 0

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px',
      padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Go Deeper — Academic
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--ink-low)' }}>{open ? '▾ collapse' : '▸ expand'}</span>
      </button>
      {open && (
        <div style={{ marginTop: '0.9rem' }}>
          {hasContent ? (
            deeperMath.map((block, i) => (
              <div key={i} style={{ marginBottom: '0.9rem' }}>
                {renderMd(typeof block === 'string' ? block : block.content, { fontSize: '0.88rem', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }, figures || {})}
              </div>
            ))
          ) : (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '8px',
              padding: '0.9rem 1.1rem',
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309', marginBottom: '0.3rem' }}>
                Coming soon
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-low)', lineHeight: 1.55 }}>
                Deeper academic math for this module hasn't been written yet.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
