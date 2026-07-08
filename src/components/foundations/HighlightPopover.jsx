import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { AddToTrackPopover } from '../tracks/AddToTrackPopover.jsx'
import { quickAddItem, getQuickAdd } from '../../utils/tracks.js'

// 4 fixed swatches, mapped to MSL's existing theme vars — no arbitrary hex.
const COLORS = [
  { id: 'gold',  value: 'var(--prime)' },
  { id: 'teal',  value: 'var(--teal)' },
  { id: 'green', value: 'var(--green)' },
  { id: 'red',   value: '#e05050' }, // matches the "advanced" difficulty accent used across foundation tabs
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
 * v1 scope: saves a SNAPSHOT of the highlighted passage (text + color + a
 * link back to the source module) as a generic 'highlight' item in the
 * existing Tracks system. It does NOT repaint the highlight back onto the
 * page on revisit — anchoring arbitrary selections across re-renders is a
 * separate, harder problem and is explicitly out of scope for this pass.
 *
 * Save re-uses the exact quick-add/picker/portal mechanism AddTrackBtn
 * already uses elsewhere: quick-add on + a last track present saves straight
 * through with a flash toast; otherwise (or with Alt/Cmd/Ctrl/Shift held)
 * it opens the same AddToTrackPopover used everywhere else in the app.
 */
export function HighlightPopover({ containerRef, sourceTabId, sourceModuleId, sourceLabel }) {
  const [toolbar, setToolbar] = useState(null) // { top, left, right, text }
  const [color, setColor] = useState(null)
  const [pending, setPending] = useState(null) // { id, label, meta, pos } — picker mode
  const [flash, setFlash] = useState(null) // { name, top, left }
  const flashTimer = useRef(null)

  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current) }, [])

  const updateFromSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setToolbar(null); return }
    const text = sel.toString()
    if (!text || !text.trim()) { setToolbar(null); return }
    const node = sel.anchorNode
    if (!containerRef?.current || !node || !containerRef.current.contains(node)) { setToolbar(null); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (!rect || (rect.width === 0 && rect.height === 0)) { setToolbar(null); return }
    setColor(null)
    setToolbar({ top: rect.top, left: rect.left + rect.width / 2, right: window.innerWidth - rect.right, text })
  }, [containerRef])

  useEffect(() => {
    function onMouseUp() { setTimeout(updateFromSelection, 0) }
    function onSelectionChange() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) setToolbar(null)
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('selectionchange', onSelectionChange)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('selectionchange', onSelectionChange)
    }
  }, [updateFromSelection])

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

  function handleSave(e) {
    if (!toolbar || !color) return
    const id = genId()
    const label = truncate(toolbar.text, 80)
    const meta = {
      text: toolbar.text.trim(),
      color,
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
          style={{
            position: 'fixed', top: Math.max(8, toolbar.top - 46), left: toolbar.left,
            transform: 'translateX(-50%)', zIndex: 9999,
            background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '9px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)', padding: '0.4rem 0.5rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}
        >
          {COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => setColor(c.id)}
              title={c.id}
              style={{
                width: 18, height: 18, borderRadius: '50%', cursor: 'pointer', padding: 0,
                background: c.value,
                border: color === c.id ? '2px solid var(--ink-hi)' : '2px solid transparent',
                boxShadow: color === c.id ? `0 0 0 2px ${c.value}` : 'none',
              }}
            />
          ))}
          <button
            onClick={handleSave}
            disabled={!color}
            title={getQuickAdd() ? 'Save · Alt/Cmd-click to choose a track' : 'Save'}
            style={{
              marginLeft: '0.2rem', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-sans)',
              padding: '0.25rem 0.6rem', borderRadius: '6px', border: 'none',
              cursor: color ? 'pointer' : 'default', opacity: color ? 1 : 0.55,
              background: color ? 'var(--prime)' : 'var(--rim)', color: color ? '#000' : 'var(--ink-ghost)',
            }}
          >Save</button>
        </div>,
        document.body
      )}

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
