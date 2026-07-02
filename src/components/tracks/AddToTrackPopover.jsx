import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getTracks, createTrack, addModule, getTracksForModule, addItem, getTracksForItem } from '../../utils/tracks.js'

/**
 * Popover for adding content to a track.
 * Legacy module mode:  tabId, moduleId, label, difficulty, onClose, anchorRef
 * Generic item mode:   itemType, itemId, label, itemMeta, onClose, anchorRef, fixedPos
 */
export function AddToTrackPopover({
  // legacy module props
  tabId, moduleId, difficulty,
  // generic item props
  itemType, itemId, itemMeta,
  // shared
  label,
  onClose, anchorRef,
  fixedPos, // { top, right } — use position:fixed (for portal / overflow:hidden escape)
}) {
  const isGeneric = !!itemType

  const getIn = () =>
    isGeneric ? getTracksForItem(itemType, String(itemId)) : getTracksForModule(tabId, moduleId)

  const doAdd = (trackId) => {
    if (isGeneric) addItem(trackId, itemType, String(itemId), label || '', itemMeta || {})
    else addModule(trackId, tabId, moduleId, label || '', difficulty)
  }

  const [tracks, setTracks]   = useState(() => getTracks())
  const [inTracks, setInTracks] = useState(getIn)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const popoverRef = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    function handle(e) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target))
      ) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose, anchorRef])

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus()
  }, [creating])

  function refresh() {
    setTracks(getTracks())
    setInTracks(getIn())
  }

  function handleToggle(trackId) {
    if (!inTracks.includes(trackId)) doAdd(trackId)
    refresh()
  }

  function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const t = createTrack(newName.trim())
    doAdd(t.id)
    setNewName('')
    setCreating(false)
    refresh()
  }

  const posStyle = fixedPos
    ? { position: 'fixed', top: fixedPos.top, right: fixedPos.right }
    : { position: 'absolute', top: '100%', right: 0, marginTop: '6px' }

  return (
    <div
      ref={popoverRef}
      style={{
        ...posStyle,
        zIndex: 9999,
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.30)',
        minWidth: '220px', maxWidth: '270px', padding: '0.6rem 0', fontSize: '0.82rem',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ padding: '0.25rem 0.85rem 0.5rem', fontWeight: 700, fontSize: '0.72rem', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Add to Track
      </div>

      {tracks.length === 0 && !creating && (
        <div style={{ padding: '0.3rem 0.85rem 0.5rem', color: 'var(--ink-low)', fontSize: '0.8rem' }}>No tracks yet.</div>
      )}

      {tracks.map(t => {
        const added = inTracks.includes(t.id)
        return (
          <button
            key={t.id}
            onClick={() => handleToggle(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.55rem',
              width: '100%', textAlign: 'left', background: 'none', border: 'none',
              cursor: added ? 'default' : 'pointer', padding: '0.45rem 0.85rem',
              color: added ? 'var(--prime)' : 'var(--ink-hi)', fontWeight: added ? 600 : 400,
              fontSize: '0.83rem', transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (!added) e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: 4,
              border: added ? '2px solid var(--prime)' : '2px solid var(--rim)',
              background: added ? 'var(--prime)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: '0.65rem', color: '#fff',
            }}>
              {added ? '✓' : ''}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.name}</span>
          </button>
        )
      })}

      <div style={{ borderTop: '1px solid var(--rim)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.45rem 0.85rem',
              color: 'var(--prime)', fontSize: '0.83rem', fontWeight: 600,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span> New track
          </button>
        ) : (
          <form onSubmit={handleCreate} style={{ padding: '0.35rem 0.65rem', display: 'flex', gap: '0.4rem' }}>
            <input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Track name…"
              style={{
                flex: 1, fontSize: '0.8rem', padding: '0.3rem 0.5rem',
                background: 'var(--depth)', border: '1px solid var(--rim)',
                borderRadius: '5px', color: 'var(--ink-hi)', outline: 'none',
              }}
              onKeyDown={e => { if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              style={{
                background: 'var(--prime)', color: '#fff', border: 'none',
                borderRadius: '5px', padding: '0.3rem 0.6rem', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 600, opacity: newName.trim() ? 1 : 0.4,
              }}
            >Add</button>
          </form>
        )}
      </div>
    </div>
  )
}

/**
 * Self-contained + button that opens AddToTrackPopover via React portal.
 * Safe inside overflow:hidden containers — uses getBoundingClientRect + position:fixed.
 * Props: itemType, itemId, label, itemMeta
 */
export function AddTrackBtn({ itemType, itemId, label, itemMeta = {} }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, right: 0 })

  function toggle(e) {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Add to track"
        style={{
          background: 'none',
          border: '1px solid var(--rim)',
          borderRadius: '5px',
          cursor: 'pointer',
          padding: '2px 7px',
          fontSize: '13px',
          color: 'var(--prime)',
          flexShrink: 0,
          lineHeight: 1,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
        }}
      >+</button>
      {open && createPortal(
        <AddToTrackPopover
          itemType={itemType}
          itemId={itemId}
          label={label}
          itemMeta={itemMeta}
          onClose={() => setOpen(false)}
          anchorRef={btnRef}
          fixedPos={pos}
        />,
        document.body
      )}
    </>
  )
}
