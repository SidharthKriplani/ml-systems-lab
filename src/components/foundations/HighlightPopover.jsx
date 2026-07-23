import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AddToTrackPopover } from '../tracks/AddToTrackPopover.jsx'
import { quickAddItem, getQuickAdd } from '../../utils/tracks.js'
import { addHighlight, removeHighlight, listHighlights, occurrenceOfSelection, applyAll, unpaint } from '../../utils/localHighlights.js'
import { addCard } from '../../utils/reviewCards.js'

// 4 fixed swatches, mapped to MSL's existing theme vars — no arbitrary hex.
const COLORS = [
  { id: 'gold',  value: 'var(--prime)' },
  { id: 'teal',  value: 'var(--teal)' },
  { id: 'green', value: 'var(--green)' },
  { id: 'red',   value: '#e05050' }, // matches the "advanced" difficulty accent used across foundation tabs
  { id: 'sky',    value: '#38bdf8' },
  { id: 'pink',   value: '#f472b6' },
  { id: 'lime',   value: '#a3e635' },
  { id: 'orange', value: '#fb923c' },
]

function genId() {
  return `hl_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function truncate(raw, n) {
  const t = raw.trim().replace(/\s+/g, ' ')
  return t.length > n ? t.slice(0, n).trim() + '…' : t
}

/**
 * Highlight-to-track MVP toolbar. Mount as a sibling of the module-content
 * container, passing a ref to that container via `containerRef`. On text
 * selection inside the container it shows a small floating color-swatch +
 * Save toolbar above the selection.
 *
 * Two actions, two meanings (2026-07-17):
 * - SWATCH CLICK = instant in-place marker-pen highlight. Persisted locally
 *   (localHighlights.js), repainted on revisit, click the mark to remove.
 *   No track is involved.
 * - SAVE = snapshot the passage into the Tracks system (existing flow),
 *   color defaults to gold.
 *
 * Save re-uses the exact quick-add/picker/portal mechanism AddTrackBtn
 * already uses elsewhere: quick-add on + a last track present saves straight
 * through with a flash toast; otherwise (or with Alt/Cmd/Ctrl/Shift held)
 * it opens the same AddToTrackPopover used everywhere else in the app.
 *
 * Q3 Wave A item 1 (2026-07-22): clicking an already-painted mark opens a
 * small popover with "Remove highlight" — that popover now also has
 * "+ Add to review". It reads the mark's own text as the cloze answer, walks
 * up to the nearest block ancestor for surrounding context (prefix/suffix),
 * and stores a card via reviewCards.js — same pageKey the highlight itself
 * lives under, so it rides the same sync bucket. ReviewTab.jsx renders these
 * cards inline in its existing due/later queue, term hidden until "Show
 * answer" is clicked. See reviewCards.js's header for the storage-shape
 * rationale (mirrors localHighlights.js on purpose).
 */
export function HighlightPopover({ containerRef, sourceTabId, sourceModuleId, sourceLabel }) {
  const [toolbar, setToolbar] = useState(null) // { top, left, right, text }
  const [color, setColor] = useState(null)
  const [pending, setPending] = useState(null) // { id, label, meta, pos } — picker mode
  const [flash, setFlash] = useState(null) // { name, top, left }
  const [removePop, setRemovePop] = useState(null) // { id, top, left } — click a painted mark
  // Marker mode (2026-07-22): pick a color once, every subsequent selection
  // paints instantly. Persisted across modules/tabs; exit via chip or Esc.
  const [marker, setMarker] = useState(() => { try { return localStorage.getItem('msl-marker-mode-v1') || '' } catch { return '' } })
  const [markerPalette, setMarkerPalette] = useState(false) // marker chip's bloomed color picker
  const setMarkerMode = (cid) => { setMarker(cid); try { cid ? localStorage.setItem('msl-marker-mode-v1', cid) : localStorage.removeItem('msl-marker-mode-v1') } catch {} }
  const pageKey = `${sourceTabId}::${sourceModuleId || ''}`
  const flashTimer = useRef(null)

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current) }, [])

  // In-place highlights: repaint saved marks after the content settles, and
  // open a small Remove popover when a painted mark is clicked. Two delayed
  // applyAll passes cover async content (applyAll is idempotent).
  useEffect(() => {
    const el = containerRef?.current
    if (!el) return
    const t1 = setTimeout(() => applyAll(el, pageKey), 0)
    const t2 = setTimeout(() => applyAll(el, pageKey), 450)
    function onDocClick(e) {
      const sel = window.getSelection()
      if (sel && !sel.isCollapsed) return // a drag-selection, not a mark click
      const mark = e.target && e.target.closest && e.target.closest('mark[data-hl-id]')
      if (mark && el.contains(mark)) {
        const r = mark.getBoundingClientRect()
        setRemovePop({ id: mark.getAttribute('data-hl-id'), top: r.bottom + 6, left: r.left + r.width / 2 })
      } else {
        setRemovePop(null)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => { clearTimeout(t1); clearTimeout(t2); document.removeEventListener('click', onDocClick) }
  }, [containerRef, pageKey])

  const updateFromSelection = useCallback(() => {
    // Never react to selections inside editable fields (note editor textareas,
    // inputs) — the toolbar over half-selected textarea text was noise, and
    // textarea content isn't in the DOM text stream anyway (can't be painted).
    const ae = document.activeElement
    if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT' || ae.isContentEditable)) { setToolbar(null); return }
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setToolbar(null); return }
    const text = sel.toString()
    if (!text || !text.trim()) { setToolbar(null); return }
    const node = sel.anchorNode
    if (!containerRef?.current || !node || !containerRef.current.contains(node)) { setToolbar(null); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (!rect || (rect.width === 0 && rect.height === 0)) { setToolbar(null); return }
    if (marker) {
      const el = containerRef.current
      if (el && (el.textContent || '').includes(text)) {
        const n = occurrenceOfSelection(el, text)
        addHighlight(pageKey, { id: genId(), text, n, color: marker })
        applyAll(el, pageKey)
      }
      try { sel.removeAllRanges() } catch { /* ignore */ }
      setToolbar(null)
      return
    }
    setColor(null)
    setToolbar({ top: rect.top, left: rect.left + rect.width / 2, right: window.innerWidth - rect.right, text })
  }, [containerRef, marker, pageKey])

  useEffect(() => {
    function onMouseUp() { setTimeout(updateFromSelection, 0) }
    // Mobile: native touch text-selection doesn't reliably fire `mouseup`.
    // `touchend` fires when the user lifts their finger after dragging the
    // selection handles; a slightly longer delay lets the OS selection UI
    // (handles) settle before we read getSelection()/getBoundingClientRect().
    function onTouchEnd() { setTimeout(updateFromSelection, 150) }
    function onSelectionChange() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) setToolbar(null)
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('selectionchange', onSelectionChange)
    }
  }, [updateFromSelection])

  useEffect(() => {
    if (!marker) return
    const onKey = (e) => { if (e.key === 'Escape') setMarkerMode('') }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [marker])

  function showFlash(name, pos) {
    setFlash({ name, ...pos })
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 1400)
  }

  function reset() {
    setToolbar(null)
    setColor(null)
    try { window.getSelection()?.removeAllRanges() } catch { /* ignore */ }
  }

  // Swatch click = instant in-place highlight (no track involved): anchor the
  // selection as (text, nth-occurrence), persist locally, repaint, done.
  function handlePaint(cid) {
    if (!toolbar || !containerRef?.current) return
    const el = containerRef.current
    const text = toolbar.text
    if (!(el.textContent || '').includes(text)) { reset(); return } // cross-boundary selection we can't anchor — skip, never guess
    const n = occurrenceOfSelection(el, text)
    addHighlight(pageKey, { id: genId(), text, n, color: cid })
    applyAll(el, pageKey)
    reset()
  }

  // "+ Add to review" on a painted mark's popover — build a cloze card from
  // the mark's own text (the answer) + its surrounding block text (context),
  // and hand it to reviewCards.js. Never guesses: if the mark isn't findable
  // in the live DOM anymore (repainted away, content changed underneath it),
  // it bails without creating a broken card.
  function handleAddToReview() {
    if (!removePop || !containerRef?.current) return
    const el = containerRef.current
    const markEl = el.querySelector(`mark[data-hl-id="${removePop.id}"]`)
    if (!markEl) { setRemovePop(null); return }
    const term = (markEl.textContent || '').trim()
    if (!term) { setRemovePop(null); return }

    const hl = listHighlights(pageKey).find(h => h.id === removePop.id)
    const block = markEl.closest('p, li, blockquote, dd, dt, td, th, div') || markEl.parentElement
    const blockText = (block && block.textContent) || term
    const idx = blockText.indexOf(term)
    let prefix = '', suffix = ''
    if (idx !== -1) {
      const rawPrefix = blockText.slice(Math.max(0, idx - 90), idx)
      const rawSuffix = blockText.slice(idx + term.length, idx + term.length + 90)
      // Trim to a clean word boundary so the card doesn't open mid-word.
      prefix = idx - 90 > 0 ? rawPrefix.replace(/^\S*\s/, '') : rawPrefix
      suffix = idx + term.length + 90 < blockText.length ? rawSuffix.replace(/\s\S*$/, '') : rawSuffix
    }

    addCard(pageKey, {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      term,
      prefix: prefix.trim(),
      suffix: suffix.trim(),
      color: (hl && hl.color) || 'gold',
      tabId: sourceTabId,
      moduleId: sourceModuleId,
      moduleTitle: sourceLabel || '',
      reviews: 0,
      lastReviewed: null,
    })

    const r = markEl.getBoundingClientRect()
    showFlash('review queue', { top: Math.max(8, r.top - 46), left: r.left + r.width / 2 })
    setRemovePop(null)
  }

  function handleSave(e) {
    if (!toolbar) return
    const id = genId()
    const label = truncate(toolbar.text, 80)
    const meta = {
      text: toolbar.text.trim(),
      color: color || 'gold',
      note: '',
      sourceLabel: sourceLabel || '',
      sourceTabId,
      sourceModuleId,
    }
    const flashPos = { top: Math.max(8, toolbar.top - 46), left: toolbar.left }
    const forcePicker = e.altKey || e.metaKey || e.ctrlKey || e.shiftKey

    if (!forcePicker && getQuickAdd()) {
      const t = quickAddItem('highlight', id, label, meta)
      if (t) { showFlash(t.name, flashPos); reset(); return }
    }
    // No quick-add (or no last track yet, or a modifier forced it) — open the
    // same picker used everywhere else, anchored near the vanishing toolbar.
    setPending({ id, label, meta, pos: { top: toolbar.top + 30, right: toolbar.right } })
    setToolbar(null)
  }

  return (
    <>
      {toolbar && createPortal(
        <div
          onMouseDown={e => e.preventDefault()} // keep the selection alive through the click
          onTouchStart={e => e.preventDefault()} // same, for touch text-selection
          style={{
            position: 'fixed', top: Math.max(8, toolbar.top - 50), left: toolbar.left,
            transform: 'translateX(-50%)', zIndex: 9999,
            background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '10px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)', padding: '0.35rem',
            display: 'flex', alignItems: 'center', gap: '0.15rem',
            maxWidth: 'calc(100vw - 16px)',
          }}
        >
          {COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => handlePaint(c.id)}
              title={c.id}
              style={{
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', flexShrink: 0,
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: '50%', display: 'block',
                background: c.value,
                border: color === c.id ? '2px solid var(--ink-hi)' : '2px solid transparent',
                boxShadow: color === c.id ? `0 0 0 2px ${c.value}` : 'none',
              }} />
            </button>
          ))}
          <button
            onClick={() => { setMarkerMode(color || 'gold'); reset() }}
            title="Marker mode: keep highlighting with this color on every selection (Esc to exit)"
            style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-sans)', padding: '0.45rem 0.5rem', minHeight: 36,
              borderRadius: '7px', border: '1px solid var(--rim)', cursor: 'pointer', background: 'transparent', color: 'var(--ink-mid)', flexShrink: 0 }}
          >Marker</button>
          <button
            onClick={() => {
              if (!toolbar) return
              const q = toolbar.text.length > 140 ? toolbar.text.slice(0, 140).trim() + '…' : toolbar.text.trim()
              window.dispatchEvent(new CustomEvent('sticky-create-at', { detail: { x: toolbar.left, y: toolbar.top + 12, text: '"' + q + '"\n' } }))
              reset()
            }}
            title="Drop a sticky note anchored to this text"
            style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-sans)', padding: '0.45rem 0.5rem', minHeight: 36,
              borderRadius: '7px', border: '1px solid var(--rim)', cursor: 'pointer', background: 'transparent', color: 'var(--ink-mid)', flexShrink: 0 }}
          >Note</button>
          <button
            onClick={handleSave}
            title={getQuickAdd() ? 'Save to track · Alt/Cmd-click to choose a track' : 'Save to track'}
            style={{
              marginLeft: '0.15rem', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-sans)',
              padding: '0.5rem 0.75rem', minHeight: 36, borderRadius: '7px', border: 'none',
              cursor: 'pointer', background: 'var(--prime)', color: '#000',
            }}
          >Save</button>
        </div>,
        document.body
      )}

      {marker && createPortal(
        <div
          style={{ position: 'fixed', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 250,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'var(--surface)', color: 'var(--ink-hi)', border: '1px solid var(--rim)',
            borderRadius: 20, padding: '6px 14px', fontSize: '0.75rem', fontWeight: 600,
            boxShadow: '0 6px 18px rgba(0,0,0,0.45)' }}>
          {markerPalette ? (
            <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
              {COLORS.map(c => (
                <span key={c.id} onClick={() => { setMarkerMode(c.id); setMarkerPalette(false) }}
                  style={{ width: 11, height: 11, borderRadius: '50%', background: c.value, cursor: 'pointer', opacity: c.id === marker ? 1 : 0.85 }} />
              ))}
            </span>
          ) : (
            <span title="Change marker color" onClick={() => setMarkerPalette(true)}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 4px', margin: '-7px -4px', cursor: 'pointer' }}>
              <span style={{ width: 22, height: 3, borderRadius: 2, background: (COLORS.find(c => c.id === marker) || COLORS[0]).value, pointerEvents: 'none' }} />
            </span>
          )}
          <span onClick={() => { setMarkerMode(''); setMarkerPalette(false) }} title="Exit marker mode (or press Esc)" style={{ cursor: 'pointer' }}>
            Marker on — click to exit
          </span>
        </div>, document.body)}

      {flash && createPortal(
        <div style={{
          position: 'fixed', top: flash.top, left: flash.left, transform: 'translateX(-50%)', zIndex: 9999,
          background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '7px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.30)', padding: '0.4rem 0.7rem', fontSize: '0.75rem',
          color: 'var(--ink-hi)', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          ✓ Saved to <strong>{flash.name}</strong>
        </div>,
        document.body
      )}

      {removePop && createPortal(
        <div style={{
          position: 'fixed', top: removePop.top, left: removePop.left, transform: 'translateX(-50%)', zIndex: 9999,
          background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '8px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.35)', padding: '0.3rem',
          display: 'flex', alignItems: 'center', gap: '0.3rem',
        }}>
          <button
            onClick={handleAddToReview}
            style={{
              fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-sans)',
              padding: '0.4rem 0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: 'var(--prime)', color: '#000', whiteSpace: 'nowrap',
            }}
          >+ Add to review</button>
          <button
            onClick={() => {
              const el = containerRef?.current
              if (el) unpaint(el, removePop.id)
              removeHighlight(pageKey, removePop.id)
              setRemovePop(null)
            }}
            style={{
              fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-sans)',
              padding: '0.4rem 0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: 'var(--rim)', color: 'var(--ink-hi)', whiteSpace: 'nowrap',
            }}
          >Remove highlight</button>
        </div>,
        document.body
      )}

      {pending && createPortal(
        <AddToTrackPopover
          itemType="highlight"
          itemId={pending.id}
          label={pending.label}
          itemMeta={pending.meta}
          onClose={() => { setPending(null); reset() }}
          fixedPos={pending.pos}
        />,
        document.body
      )}
    </>
  )
}
