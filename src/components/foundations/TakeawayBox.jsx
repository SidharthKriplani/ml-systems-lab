import { useState, useEffect, useRef } from 'react'
import { getTakeaway, setTakeaway } from '../../utils/takeaway.js'

// TakeawayBox — user-writable "my takeaway" text box, one per module page.
// Q3 Wave A item 2 (MSL, 2026-07-23) — mirrors GSL's FoundationsRunner.jsx
// inline implementation, extracted into ONE shared component here because
// MSL's recap block is duplicated inline across all 19
// *FoundationTab.jsx files (the NotesBox lesson: one shared component + 19
// one-line call sites, not 19 hand-rolled copies).
//
// Mount with `key={selected.id}` from the caller so the component remounts
// (fresh state) on module switch — simpler than GSL's "adjust state during
// render" workaround, which was only needed there because FoundationsRunner
// itself doesn't remount when the module changes. Each of MSL's 19 tabs
// already re-renders its recap block fresh per selectedId, so a keyed
// remount is sufficient here — no derived-state-in-render trick needed.
export function TakeawayBox({ pageKey }) {
  const [text, setText] = useState(() => getTakeaway(pageKey))
  const loadedRef = useRef(text)

  // Debounced write-through — only fires when the text actually differs from
  // what's persisted, so merely viewing a module (no edit) never bumps its
  // stored editedTs or fires a spurious annotations-changed/sync push.
  useEffect(() => {
    if (text === loadedRef.current) return
    const t = setTimeout(() => {
      setTakeaway(pageKey, text)
      loadedRef.current = text
    }, 700)
    return () => clearTimeout(t)
  }, [pageKey, text])

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px',
      padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--prime)', textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: '0.9rem' }}>Your Takeaway</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your own one-line takeaway for this module…"
        rows={2}
        style={{
          width: '100%', boxSizing: 'border-box', fontSize: '0.85rem', color: 'var(--ink-hi)',
          lineHeight: 1.5, borderRadius: '8px', padding: '0.6rem 0.75rem', resize: 'vertical',
          background: 'var(--depth)', border: '1px solid var(--rim)', outline: 'none',
          fontFamily: 'var(--font-sans)',
        }}
      />
    </div>
  )
}
