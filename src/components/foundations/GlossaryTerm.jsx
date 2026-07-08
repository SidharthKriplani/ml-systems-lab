// src/components/foundations/GlossaryTerm.jsx — hover (desktop) / tap (mobile)
// glossary popover. Added 2026-07-08 (Task 1 of a 3-lab glossary rollout —
// see docs/BACKLOG.md). Co-located with the other shared foundation-runner
// component, CheckQuestion.jsx.
//
// Rendered by src/utils/renderMd.jsx around the FIRST occurrence of a
// glossary term (see src/data/glossary.js) inside a rendered module body.
//
// Pointer status: the "→ Full lesson: <module>" line is LABEL-ONLY, not a
// clickable navigation link, this pass. Real in-app navigation to a specific
// module (`onNavigate(tabId, moduleId)`) exists and already works (see
// ClassicalMLFoundationTab.jsx's `openModuleId` handling), but wiring it here
// would mean threading an `onNavigate` prop through every one of the 19
// `*FoundationTab.jsx` call sites into `renderMd`/`CheckQuestion` — exactly
// the set of files this task was scoped to leave untouched. Flagged as the
// natural follow-up if/when the glossary is expanded lab-wide.
import { useEffect, useRef, useState } from 'react'

export function GlossaryTerm({ display, entry }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('click', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [open])

  return (
    <span
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
      style={{
        position: 'relative',
        display: 'inline',
        borderBottom: '1px dotted var(--prime)',
        cursor: 'help',
        color: 'inherit',
      }}
    >
      {display}
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            left: 0,
            bottom: 'calc(100% + 6px)',
            zIndex: 40,
            width: 'min(280px, 80vw)',
            background: 'var(--depth)',
            border: '1px solid var(--rim)',
            borderRadius: '8px',
            padding: '0.65rem 0.8rem',
            boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
            fontSize: '0.78rem',
            lineHeight: 1.5,
            fontWeight: 400,
            whiteSpace: 'normal',
            color: 'var(--ink-mid)',
          }}
        >
          <div style={{
            fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '0.3rem',
            fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em',
            fontFamily: 'var(--font-mono)',
          }}>
            {entry.term}
          </div>
          <div style={{ marginBottom: entry.sourceModuleTitle ? '0.45rem' : 0 }}>
            {entry.def}
          </div>
          {entry.sourceModuleTitle && (
            <div style={{ fontSize: '0.7rem', color: 'var(--ink-low)', fontStyle: 'italic' }}>
              → Full lesson: {entry.sourceModuleTitle}
            </div>
          )}
        </span>
      )}
    </span>
  )
}
