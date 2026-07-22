// src/components/foundations/GlossaryTerm.jsx — hover (desktop) / tap (mobile)
// glossary popover — Glossary 2.0 (G0, 2026-07-22), GSL's GlossaryTerm.jsx is
// the cross-lab reference implementation for this pass.
//
// Rendered by src/utils/renderMd.jsx around the FIRST occurrence of a
// glossary term (see src/data/glossary.js) inside a rendered module body.
//
// NAV STATUS — unchanged from pre-G0, FLAGGED not silently threaded: the
// "→ Full lesson: <module>" / "Taught in: <module>" line is still LABEL-ONLY,
// not a clickable link. G0's own rule is "if the nav prop isn't plumbed to
// the glossary component in a lab, FLAG the component chain — do not thread
// new props silently," and that's exactly this lab's situation, confirmed
// fresh this turn: renderMd(text, containerStyle, figures, moduleId) is a
// plain function (not a JSX component receiving props down a tree), called
// from every one of the 19 *FoundationTab.jsx files; threading a nav
// callback here means adding a 5th param to renderMd AND updating every one
// of those 19 call sites, which is a much bigger, separate-scoped change
// than "upgrade the card component." VERIFIED call shape for whenever that
// follow-up happens (do not re-derive, just wire this): MyTracksTab.jsx's
// "Resume →" button calls `onNavigate(nextUp.tabId, nextUp.moduleId)`
// (MyTracksTab.jsx:635) — this lab's GLOSSARY entries already carry the
// exact matching fields needed, `entry.sourceTabId` + `entry.sourceModuleId`
// (see data/glossary.js), so the eventual wired call is simply
// `onNavigate(entry.sourceTabId, entry.sourceModuleId)`. No `currentModuleId`
// self-hide (GSL has one; MSL's original component never did, and adding it
// isn't in G0's scope here since renderMd's existing `moduleId` param isn't
// threaded into the glossary-matching stage either — flagged as a possible
// follow-up for cross-lab parity, not added silently).
//
// POSITIONING — upgraded from the pre-G0 inline `position:absolute` (nested
// in the trigger span, always opened upward) to a body portal +
// getBoundingClientRect, matching GSL's reference implementation exactly —
// needed to correctly implement "flip above when it would clip the viewport
// bottom" (a real flip needs real collision detection; the old approach had
// none, it just always opened upward regardless of fit). This is a visible
// direction change from the pre-G0 popover (default is now BELOW the term,
// flipping ABOVE only when there's no room below) — deliberate, not a silent
// regression, called out here and in this turn's ledger row.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GLOSSARY } from '../../data/glossary'

const COLLAPSED_WIDTH = 264
const EXPANDED_WIDTH = 320
const EXPANDED_MAX_HEIGHT = 320
const CLOSE_DELAY_MS = 220

export function GlossaryTerm({ display, entry }) {
  const [visible, setVisible] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState(null)
  const [displayedEntry, setDisplayedEntry] = useState(entry)
  const [backStack, setBackStack] = useState([])
  const [expanded, setExpanded] = useState(false)

  const anchorRef = useRef(null)
  const popRef = useRef(null)
  const closeTimerRef = useRef(null)

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  function scheduleClose() {
    if (pinned) return // pinned cards ignore the timer entirely
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => setVisible(false), CLOSE_DELAY_MS)
  }

  function computePos(tall) {
    const r = anchorRef.current?.getBoundingClientRect()
    if (!r) return
    const width = tall ? EXPANDED_WIDTH : COLLAPSED_WIDTH
    const budget = tall ? EXPANDED_MAX_HEIGHT : 96
    const left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - width - 8))
    const spaceBelow = window.innerHeight - (r.bottom + 6)
    if (spaceBelow < budget && r.top > spaceBelow) {
      setPos({ placement: 'above', bottom: window.innerHeight - r.top + 6, left, width })
    } else {
      setPos({ placement: 'below', top: r.bottom + 6, left, width })
    }
  }

  function resetToOriginal() {
    setDisplayedEntry(entry)
    setBackStack([])
    setExpanded(false)
  }

  function closeAll() {
    clearCloseTimer()
    setVisible(false)
    setPinned(false)
    resetToOriginal()
  }

  function openHover() {
    clearCloseTimer()
    computePos(expanded)
    setVisible(true)
  }

  function togglePinClick(e) {
    // Click (mouse) or tap (touch — click fires after touchend on touch
    // devices, no separate touch path needed) pins the card open. A second
    // click while already pinned+open closes it (preserves the prior
    // toggle-to-close behavior).
    e.stopPropagation()
    clearCloseTimer()
    if (pinned && visible) {
      closeAll()
      return
    }
    computePos(expanded)
    setVisible(true)
    setPinned(true)
  }

  // Close on outside click/tap and Esc — ALWAYS, even when pinned. Close on
  // scroll only when NOT pinned — pinned cards survive scroll.
  useEffect(() => {
    if (!visible) return
    function onOutside(e) {
      if (anchorRef.current?.contains(e.target)) return
      if (popRef.current?.contains(e.target)) return
      closeAll()
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') closeAll()
    }
    function onScroll() {
      if (!pinned) setVisible(false)
    }
    document.addEventListener('click', onOutside)
    document.addEventListener('touchstart', onOutside)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('click', onOutside)
      document.removeEventListener('touchstart', onOutside)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, pinned])

  useEffect(() => () => clearCloseTimer(), [])

  function handleSeeAlsoClick(key) {
    const next = GLOSSARY[key]
    if (!next) return
    setBackStack(s => [...s, displayedEntry])
    setDisplayedEntry(next)
    computePos(true)
  }

  function handleBackClick() {
    setBackStack(s => {
      if (!s.length) return s
      const prev = s[s.length - 1]
      setDisplayedEntry(prev)
      return s.slice(0, -1)
    })
    computePos(expanded)
  }

  function handleSeeMoreToggle() {
    const next = !expanded
    setExpanded(next)
    computePos(next)
  }

  const e2 = displayedEntry
  const hasMore = Boolean(e2.more)
  const canGoBack = backStack.length > 0
  const labelStyle = {
    fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '0.3rem',
    fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em',
    fontFamily: 'var(--font-mono)',
  }
  const pointerStyle = { fontSize: '0.7rem', color: 'var(--ink-low)', fontStyle: 'italic', marginTop: '0.45rem' }

  return (
    <span
      ref={anchorRef}
      onMouseEnter={openHover}
      onMouseLeave={scheduleClose}
      onClick={togglePinClick}
      style={{
        display: 'inline',
        borderBottom: '1px dotted var(--prime)',
        cursor: 'help',
        color: 'inherit',
      }}
    >
      {display}

      {visible && pos && createPortal(
        <span
          ref={popRef}
          role="dialog"
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            ...(pos.placement === 'above' ? { bottom: pos.bottom } : { top: pos.top }),
            left: pos.left,
            zIndex: 9999,
            width: pos.width,
            maxHeight: expanded ? EXPANDED_MAX_HEIGHT : undefined,
            overflowY: expanded ? 'auto' : undefined,
            display: 'block',
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
          {canGoBack && (
            <span
              onClick={(ev) => { ev.stopPropagation(); handleBackClick() }}
              style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-low)', cursor: 'pointer' }}
            >
              &#9668; back
            </span>
          )}

          <div style={labelStyle}>{e2.term}</div>
          <div style={{ marginBottom: (!expanded && !hasMore && e2.sourceModuleTitle) ? '0' : undefined }}>
            {e2.def}
          </div>

          {!expanded && hasMore && (
            <span
              onClick={(ev) => { ev.stopPropagation(); handleSeeMoreToggle() }}
              style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--prime)', cursor: 'pointer' }}
            >
              See more &#9662;
            </span>
          )}

          {/* Legacy entries (no `more`) render exactly as before G0 — def +
              the label-only Full-lesson pointer, nothing else. */}
          {!hasMore && e2.sourceModuleTitle && (
            <div style={pointerStyle}>
              &rarr; Full lesson: {e2.sourceModuleTitle}
            </div>
          )}

          {expanded && hasMore && (
            <>
              <div style={{ marginTop: '0.5rem' }}>{e2.more}</div>

              {e2.formula && (
                <div style={{
                  marginTop: '0.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
                  color: 'var(--prime)', background: 'var(--surface)', border: '1px solid var(--rim)',
                  borderRadius: '6px', padding: '0.3rem 0.5rem',
                }}>
                  {e2.formula}
                </div>
              )}

              {Array.isArray(e2.seeAlso) && e2.seeAlso.length > 0 && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {e2.seeAlso.map(key => (
                    GLOSSARY[key] ? (
                      <span
                        key={key}
                        onClick={(ev) => { ev.stopPropagation(); handleSeeAlsoClick(key) }}
                        style={{
                          fontSize: '0.68rem', fontFamily: 'var(--font-mono)', padding: '0.15rem 0.4rem',
                          borderRadius: '5px', border: '1px solid var(--rim)', background: 'var(--surface)',
                          color: 'var(--ink-mid)', cursor: 'pointer',
                        }}
                      >
                        {GLOSSARY[key].term}
                      </span>
                    ) : null
                  ))}
                </div>
              )}

              {e2.sourceModuleTitle && (
                <div style={pointerStyle}>
                  Taught in: {e2.sourceModuleTitle} &rarr;
                </div>
              )}
            </>
          )}
        </span>,
        document.body
      )}
    </span>
  )
}
