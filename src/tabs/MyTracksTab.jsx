import { useState, useEffect, useRef } from 'react'
import {
  getTracks, createTrack, renameTrack, deleteTrack,
  createNote, deleteNote, removeItem, reorderItems, moveItem, seedTierTracks,
  updateItemMeta,
} from '../utils/tracks.js'
import { NoteEditor } from '../components/tracks/NoteEditor.jsx'

const TAB_LABELS = {
  math_stats_foundation:       'Math & Stats',
  classical_ml_foundation:     'Classical ML',
  eval_foundation:             'Evaluation',
  unsupervised_foundation:     'Unsupervised',
  causal_foundation:           'Causal Inference',
  production_foundation:       'Feature Eng & Prod',
  monitoring_foundation:       'Monitoring',
  system_design_foundation:    'ML System Design',
  recsys_foundation:           'Recommender Systems',
  pricing_foundation:          'Pricing Analytics',
  dl_foundation:               'Deep Learning',
  rl_foundation:               'Reinforcement Learning',
  time_series_foundation:      'Time Series',
  self_supervised_foundation:  'Self-supervised',
  graph_ml_foundation:         'Graph ML',
  bandits_foundation:          'Bandits',
  probabilistic_ml_foundation: 'Probabilistic ML',
  optimization_foundation:     'Optimization',
  data_foundation:             'Data & Features',
}

const DIFF_COLORS = {
  foundational: { color: 'var(--ink-low)',  border: 'var(--rim)' },
  intermediate: { color: 'var(--prime)',    border: 'var(--prime)' },
  advanced:     { color: '#e05050',         border: '#e05050' },
}

function DiffBadge({ d }) {
  if (!d) return null
  const cfg = DIFF_COLORS[d] || DIFF_COLORS.foundational
  return (
    <span style={{
      fontSize: '0.63rem', fontWeight: 700, color: cfg.color,
      border: `1px solid ${cfg.border}`, borderRadius: '4px',
      padding: '0.05rem 0.35rem', opacity: 0.85, flexShrink: 0,
    }}>
      {d.charAt(0).toUpperCase() + d.slice(1)}
    </span>
  )
}

// ── Note preview helpers ──────────────────────────────────────────────────────

function notePreview(note) {
  const textBlock = (note.blocks || []).find(b => b.type === 'text' && b.content?.trim())
  return textBlock ? textBlock.content.slice(0, 80) : ''
}

function noteBlockSummary(note) {
  const blocks = note.blocks || []
  const videos = blocks.filter(b => b.type === 'video').length
  const links = blocks.filter(b => b.type === 'link').length
  const texts = blocks.filter(b => b.type === 'text' && b.content?.trim()).length
  const parts = []
  if (texts) parts.push(`${texts} text`)
  if (videos) parts.push(`${videos} video${videos > 1 ? 's' : ''}`)
  if (links) parts.push(`${links} link${links > 1 ? 's' : ''}`)
  return parts.join(' · ') || 'empty'
}

// ── TrackList sidebar ─────────────────────────────────────────────────────────

function TrackList({ tracks, selectedId, onSelect, onCreate, onDelete, onMoveItem, onBuildTiers }) {
  const [hoverId, setHoverId] = useState(null)
  const [dropId, setDropId] = useState(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus()
  }, [creating])

  function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    onCreate(newName.trim())
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="mytracks-list" style={{
      width: '240px', flexShrink: 0, borderRight: '1px solid var(--rim)',
      overflowY: 'auto', padding: '1rem 0.5rem',
      background: 'var(--depth)', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>My Tracks</span>
        <button
          onClick={() => setCreating(true)}
          title="New track"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--prime)', fontSize: '1.1rem', lineHeight: 1, padding: '0 0.2rem' }}
        >+</button>
      </div>

      {onBuildTiers && (
        <button
          onClick={onBuildTiers}
          title="S = always asked, A = shows up often, B = the depth that makes you unbreakable (default) -- builds one track per tier from every Foundation module, ranked by interview frequency"
          style={{
            margin: '0 0.5rem 0.75rem', padding: '0.4rem 0.5rem', borderRadius: '7px',
            fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
            color: 'var(--prime)', background: 'var(--prime-faint)', border: '1px solid var(--prime)',
          }}
        >
          Build S / A / B tier tracks
        </button>
      )}

      {creating && (
        <form onSubmit={handleCreate} style={{ padding: '0 0.5rem', marginBottom: '0.5rem', display: 'flex', gap: '0.35rem' }}>
          <input
            ref={inputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Track name…"
            style={{
              flex: 1, fontSize: '0.78rem', padding: '0.28rem 0.45rem',
              background: 'var(--surface)', border: '1px solid var(--rim)',
              borderRadius: '5px', color: 'var(--ink-hi)', outline: 'none',
            }}
            onKeyDown={e => { if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            style={{
              background: 'var(--prime)', color: '#fff', border: 'none',
              borderRadius: '5px', padding: '0.28rem 0.5rem', cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 600, opacity: newName.trim() ? 1 : 0.4,
            }}
          >Add</button>
        </form>
      )}

      {tracks.length === 0 && !creating && (
        <div style={{ padding: '0.5rem 0.75rem', color: 'var(--ink-low)', fontSize: '0.8rem', lineHeight: 1.5 }}>
          No tracks yet. Hit + to create one.
        </div>
      )}

      {tracks.map(t => (
        <div
          key={t.id}
          onClick={() => onSelect(t.id)}
          onMouseEnter={() => setHoverId(t.id)}
          onMouseLeave={() => setHoverId(null)}
          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dropId !== t.id) setDropId(t.id) }}
          onDragLeave={() => setDropId(prev => prev === t.id ? null : prev)}
          onDrop={e => {
            e.preventDefault()
            setDropId(null)
            try {
              const d = JSON.parse(e.dataTransfer.getData('application/x-track-item'))
              if (d && d.fromTrackId && d.fromTrackId !== t.id && Number.isInteger(d.index)) {
                onMoveItem(d.fromTrackId, t.id, d.index)
              }
            } catch (err) {}
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.5rem 0.75rem', borderRadius: '7px', cursor: 'pointer',
            background: dropId === t.id ? 'var(--prime-faint)' : t.id === selectedId ? 'var(--prime-faint)' : hoverId === t.id ? 'var(--surface)' : 'transparent',
            border: `1px solid ${dropId === t.id ? 'var(--prime)' : t.id === selectedId ? 'var(--prime)' : 'transparent'}`,
            marginBottom: '0.2rem', transition: 'all 0.12s',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.83rem', fontWeight: t.id === selectedId ? 700 : 500, color: t.id === selectedId ? 'var(--ink-hi)' : 'var(--ink-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.name}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--ink-ghost)', marginTop: '0.1rem' }}>
              {t.items.length} item{t.items.length !== 1 ? 's' : ''}
            </div>
          </div>
          {hoverId === t.id && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(t.id) }}
              title="Delete track"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: '0.75rem', padding: '0 0.1rem', flexShrink: 0, marginLeft: '0.4rem' }}
            >✕</button>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Generic item type labels ──────────────────────────────────────────────────

const ITEM_TYPE_LABEL = {
  interview: 'Interview Q',
  flashcard: 'Flashcard',
  case: 'Case Study',
  flaw: 'Flaw Hunt',
  bug: 'Code Bug',
  drill: 'Judgment Drill',
  ml_code: 'ML Coding',
  sd_drill: 'Design Drill',
  highlight: 'Highlight',
}

// Highlight swatch ids -> theme var/color (kept in sync with HighlightPopover.jsx).
const HIGHLIGHT_COLOR = { gold: 'var(--prime)', teal: 'var(--teal)', green: 'var(--green)', red: '#e05050' }

// Where each generic item type opens (current rooms after the restructure).
const TYPE_TAB = {
  interview:  'interview_questions',
  flashcard:  'cheatsheet',
  case:       'incidentroom',
  flaw:       'judge_browser',
  bug:        'codebugs',
  drill:      'judge_browser',
  ml_code:    'mlcoding',
  sd_drill:   'design',
}

// ── Item grouping helper ──────────────────────────────────────────────────────

function itemGroup(item) {
  if (item.type === 'module') {
    return { key: `module:${item.tabId}`, label: TAB_LABELS[item.tabId] || item.tabId }
  }
  if (item.type === 'note') {
    return { key: 'note', label: 'Notes' }
  }
  return { key: item.type, label: ITEM_TYPE_LABEL[item.type] || item.type }
}

// ── Highlight item: excerpt + inline-editable note ──────────────────────────
// Mirrors the TrackDetail title-rename UX exactly: a ✎ toggle, an
// input/textarea while editing, Enter/blur to save, Escape to cancel.

function HighlightItemRow({ item, onNoteChange }) {
  const [editingNote, setEditingNote] = useState(false)
  const [draftNote, setDraftNote] = useState(item.meta?.note || '')
  const noteInputRef = useRef(null)

  useEffect(() => { setDraftNote(item.meta?.note || '') }, [item.meta?.note])
  useEffect(() => { if (editingNote && noteInputRef.current) noteInputRef.current.focus() }, [editingNote])

  function submitNote(e) {
    if (e) e.preventDefault()
    onNoteChange(draftNote)
    setEditingNote(false)
  }

  const colorValue = HIGHLIGHT_COLOR[item.meta?.color] || 'var(--prime)'

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--prime)', background: 'var(--prime-faint)', border: '1px solid var(--prime)', borderRadius: '4px', padding: '0.05rem 0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Highlight
        </span>
        {item.meta?.sourceLabel && <span style={{ fontSize: '0.65rem', color: 'var(--ink-ghost)' }}>{item.meta.sourceLabel}</span>}
      </div>

      <div style={{ borderLeft: `3px solid ${colorValue}`, paddingLeft: '0.7rem', marginBottom: '0.5rem' }}>
        <div style={{ fontSize: '0.87rem', color: 'var(--ink-hi)', lineHeight: 1.5 }}>
          {item.meta?.text || item.label}
        </div>
      </div>

      {editingNote ? (
        <form onSubmit={submitNote} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }} onClick={e => e.stopPropagation()}>
          <textarea
            ref={noteInputRef}
            value={draftNote}
            onChange={e => setDraftNote(e.target.value)}
            onBlur={() => submitNote()}
            onKeyDown={e => { if (e.key === 'Escape') { setDraftNote(item.meta?.note || ''); setEditingNote(false) } }}
            rows={2}
            placeholder="Add a note…"
            style={{
              flex: 1, fontSize: '0.8rem', padding: '0.35rem 0.5rem', resize: 'vertical',
              background: 'var(--depth)', border: '1px solid var(--prime)', borderRadius: '6px',
              color: 'var(--ink-hi)', outline: 'none', fontFamily: 'var(--font-sans)',
            }}
          />
          <button type="submit" style={{ background: 'var(--prime)', color: '#000', border: 'none', borderRadius: '5px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>Save</button>
        </form>
      ) : item.meta?.note ? (
        <div
          onClick={e => { e.stopPropagation(); setEditingNote(true) }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-low)', lineHeight: 1.4 }}>{item.meta.note}</span>
          <span style={{ color: 'var(--ink-ghost)', fontSize: '0.72rem', flexShrink: 0 }}>✎</span>
        </div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); setEditingNote(true) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: '0.75rem', padding: 0, fontFamily: 'var(--font-sans)' }}
        >+ Add note</button>
      )}
    </div>
  )
}

// ── TrackItemRow ──────────────────────────────────────────────────────────────

function TrackItemRow({ item, idx, trackId, onNavigate, onRemoveItem, onOpenNote, onDeleteNote, onUpdateHighlightNote, dragFrom, setDragFrom, onReorderItems }) {
  return (
    <div
      key={idx}
      draggable
      onDragStart={e => {
        setDragFrom(idx)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('application/x-track-item', JSON.stringify({ fromTrackId: trackId, index: idx }))
      }}
      onDragOver={e => e.preventDefault()}
      onDrop={() => { if (dragFrom !== null && dragFrom !== idx) { onReorderItems(dragFrom, idx); setDragFrom(null) } }}
      onDragEnd={() => setDragFrom(null)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
        padding: '0.7rem 0.85rem', borderRadius: '8px',
        background: dragFrom === idx ? 'var(--prime-faint)' : 'var(--surface)',
        border: `1px solid ${dragFrom === idx ? 'var(--prime)' : 'var(--rim)'}`,
        cursor: 'grab', transition: 'all 0.1s',
      }}
    >
      <span style={{ color: 'var(--ink-ghost)', fontSize: '0.7rem', marginTop: '3px', userSelect: 'none', flexShrink: 0 }}>⠿</span>

      {item.type === 'module' && (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--prime)', background: 'var(--prime-faint)', border: '1px solid var(--prime)', borderRadius: '4px', padding: '0.05rem 0.35rem' }}>
                {TAB_LABELS[item.tabId] || item.tabId}
              </span>
              <DiffBadge d={item.difficulty} />
            </div>
            <div style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.3 }}>{item.label}</div>
          </div>
          <button
            onClick={() => onNavigate(item.tabId, item.moduleId)}
            style={{
              background: 'none', border: '1px solid var(--rim)', borderRadius: '5px',
              cursor: 'pointer', color: 'var(--ink-mid)', fontSize: '0.75rem',
              padding: '0.2rem 0.5rem', flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--prime)'; e.currentTarget.style.color = 'var(--prime)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
          >Open →</button>
          <button onClick={() => onRemoveItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: '0.72rem', padding: '0.1rem 0.2rem', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e05050' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-ghost)' }}
          >✕</button>
        </>
      )}

      {item.type === 'note' && (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 Note</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--ink-ghost)' }}>{noteBlockSummary(item)}</span>
            </div>
            <div style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '0.15rem' }}>
              {item.title || 'Untitled note'}
            </div>
            {notePreview(item) && (
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-low)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {notePreview(item)}
              </div>
            )}
          </div>
          <button
            onClick={() => onOpenNote(item)}
            style={{
              background: 'none', border: '1px solid var(--rim)', borderRadius: '5px',
              cursor: 'pointer', color: 'var(--ink-mid)', fontSize: '0.75rem',
              padding: '0.2rem 0.5rem', flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--prime)'; e.currentTarget.style.color = 'var(--prime)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
          >Open →</button>
          <button
            onClick={() => onDeleteNote(item.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: '0.72rem', padding: '0.1rem 0.2rem', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e05050' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-ghost)' }}
          >✕</button>
        </>
      )}

      {item.type === 'highlight' && (
        <>
          <HighlightItemRow item={item} onNoteChange={note => onUpdateHighlightNote(trackId, item.type, item.itemId, note)} />
          {item.meta?.sourceTabId && item.meta?.sourceModuleId && (
            <button
              onClick={() => onNavigate(item.meta.sourceTabId, item.meta.sourceModuleId)}
              style={{
                background: 'none', border: '1px solid var(--rim)', borderRadius: '5px',
                cursor: 'pointer', color: 'var(--ink-mid)', fontSize: '0.75rem',
                padding: '0.2rem 0.5rem', flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.12s', alignSelf: 'flex-start',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--prime)'; e.currentTarget.style.color = 'var(--prime)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
            >Open source →</button>
          )}
          <button onClick={() => onRemoveItem(idx)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: '0.72rem', padding: '0.1rem 0.2rem', flexShrink: 0, alignSelf: 'flex-start' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e05050' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-ghost)' }}
          >✕</button>
        </>
      )}

      {!['module', 'note', 'highlight'].includes(item.type) && (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--prime)', background: 'var(--prime-faint)', border: '1px solid var(--prime)', borderRadius: '4px', padding: '0.05rem 0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {ITEM_TYPE_LABEL[item.type] || item.type}
              </span>
              {item.meta?.cat && <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>{item.meta.cat}</span>}
              {item.meta?.group && <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>{item.meta.group}</span>}
              {item.meta?.company && item.type !== 'case' && <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>{item.meta.company}</span>}
              {item.meta?.domain && <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>{item.meta.domain}</span>}
              {item.meta?.level && <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>{item.meta.level}</span>}
              {item.meta?.category && <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>{item.meta.category}</span>}
              {item.meta?.subject && <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>{item.meta.subject}</span>}
              {item.meta?.tag && <span style={{ fontSize: '0.62rem', color: 'var(--ink-ghost)' }}>{item.meta.tag}</span>}
            </div>
            <div style={{ fontSize: '0.87rem', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.label}
            </div>
          </div>
          {TYPE_TAB[item.type] && (
            <button
              onClick={() => onNavigate(TYPE_TAB[item.type], item.itemId)}
              style={{
                background: 'none', border: '1px solid var(--rim)', borderRadius: '5px',
                cursor: 'pointer', color: 'var(--ink-mid)', fontSize: '0.75rem',
                padding: '0.2rem 0.5rem', flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--prime)'; e.currentTarget.style.color = 'var(--prime)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink-mid)' }}
            >Open →</button>
          )}
          <button onClick={() => onRemoveItem(idx)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: '0.72rem', padding: '0.1rem 0.2rem', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e05050' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-ghost)' }}
          >✕</button>
        </>
      )}
    </div>
  )
}

// ── TrackDetail ───────────────────────────────────────────────────────────────

function TrackDetail({ track, onNavigate, onRename, onNewNote, onOpenNote, onDeleteNote, onRemoveItem, onReorderItems, onUpdateHighlightNote, onBack }) {
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(track.name)
  const [dragFrom, setDragFrom] = useState(null)
  const nameInputRef = useRef(null)

  useEffect(() => {
    setDraftName(track.name)
    setEditingName(false)
  }, [track.id, track.name])

  useEffect(() => {
    if (editingName && nameInputRef.current) nameInputRef.current.focus()
  }, [editingName])

  function submitName(e) {
    if (e) e.preventDefault()
    const n = draftName.trim()
    if (n && n !== track.name) onRename(n)
    setEditingName(false)
  }

  return (
    <div className="mytracks-detail-inner" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', minWidth: 0 }}>

      {/* Mobile-only: back to the track list */}
      {onBack && (
        <button
          className="mytracks-back"
          onClick={onBack}
          style={{
            display: 'none', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem',
            background: 'none', border: '1px solid var(--rim)', borderRadius: '6px',
            color: 'var(--ink-mid)', fontSize: '0.8rem', padding: '0.3rem 0.6rem', cursor: 'pointer',
          }}
        >← All tracks</button>
      )}

      {/* Track title row */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {editingName ? (
          <form onSubmit={submitName} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <input
              ref={nameInputRef}
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onBlur={() => submitName()}
              onKeyDown={e => { if (e.key === 'Escape') { setDraftName(track.name); setEditingName(false) } }}
              style={{
                fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink-hi)',
                background: 'var(--surface)', border: '1px solid var(--prime)',
                borderRadius: '6px', padding: '0.1rem 0.4rem', outline: 'none',
              }}
            />
            <button type="submit" style={{ background: 'var(--prime)', color: '#fff', border: 'none', borderRadius: '5px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem' }}>Save</button>
          </form>
        ) : (
          <>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink-hi)', margin: 0 }}>{track.name}</h2>
            <button onClick={() => setEditingName(true)} title="Rename" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-ghost)', fontSize: '0.8rem', padding: '0.1rem 0.3rem' }}>✎</button>
          </>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-ghost)' }}>
            {track.items.length} item{track.items.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onNewNote}
            style={{
              background: 'var(--prime)', color: '#fff', border: 'none', borderRadius: '6px',
              padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
            }}
          >+ New Note</button>
        </div>
      </div>

      {/* Items */}
      {track.items.length === 0 ? (
        <div style={{ color: 'var(--ink-low)', fontSize: '0.85rem', lineHeight: 1.6, padding: '1rem 0' }}>
          This track is empty.<br />
          Open any foundation tab and hit the + button on a module to add it here, or create a note above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {(() => {
            // Group items by natural source, preserving first-appearance order.
            const order = []
            const groups = {}
            track.items.forEach((item, idx) => {
              const { key, label } = itemGroup(item)
              if (!groups[key]) { groups[key] = { label, entries: [] }; order.push(key) }
              groups[key].entries.push({ item, idx })
            })
            return order.map(key => {
              const g = groups[key]
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 0.1rem' }}>
                    {g.label} · {g.entries.length}
                  </div>
                  {g.entries.map(({ item, idx }) => (
                    <TrackItemRow
                      key={idx}
                      item={item}
                      idx={idx}
                      trackId={track.id}
                      onNavigate={onNavigate}
                      onRemoveItem={onRemoveItem}
                      onOpenNote={onOpenNote}
                      onDeleteNote={onDeleteNote}
                      onUpdateHighlightNote={onUpdateHighlightNote}
                      dragFrom={dragFrom}
                      setDragFrom={setDragFrom}
                      onReorderItems={onReorderItems}
                    />
                  ))}
                </div>
              )
            })
          })()}
        </div>
      )}
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

// Keep the selected track in the URL (?track=<id>#my_tracks) so browser Back
// from a module lands on the SAME track, and deep links to a track work.
function syncTrackUrl(id) {
  try {
    window.history.replaceState(null, '', id ? `?track=${id}#my_tracks` : window.location.pathname + '#my_tracks')
  } catch {}
}

export function MyTracksTab({ onNavigate, openTrackId }) {
  const [tracks, setTracks] = useState(() => getTracks())
  const [selectedId, setSelectedId] = useState(() => {
    // Restore selection from URL (set on track select + preserved across
    // browser Back from a module opened out of this track).
    try {
      const t = new URLSearchParams(window.location.search).get('track')
      if (t && getTracks().some(tr => tr.id === t)) return t
    } catch {}
    return null
  })
  const [openNote, setOpenNote] = useState(null) // { trackId, note }

  useEffect(() => {
    const h = () => setTracks(getTracks())
    window.addEventListener('msl_tracks', h)
    return () => window.removeEventListener('msl_tracks', h)
  }, [])

  // Explicit "open this track" request (e.g. a module's "← Back to My Tracks")
  useEffect(() => {
    if (openTrackId && getTracks().some(tr => tr.id === openTrackId)) {
      setOpenNote(null)
      setSelectedId(openTrackId)
      syncTrackUrl(openTrackId)
    }
  }, [openTrackId])

  // Auto-select the first track only on desktop. On phones the list is the
  // master view — leaving selectedId null keeps the user on the list until they
  // tap a track (and lets the "← All tracks" back button actually return here).
  const didAutoSelect = useRef(false)
  useEffect(() => {
    if (didAutoSelect.current) return
    // Selection already restored (URL / explicit open) — don't auto-override later.
    if (selectedId) { didAutoSelect.current = true; return }
    if (!selectedId && tracks.length > 0) {
      const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 700px)').matches
      if (!isMobile) { setSelectedId(tracks[0].id); didAutoSelect.current = true }
    }
  }, [tracks, selectedId])

  function refresh() { setTracks(getTracks()) }

  const selectedTrack = tracks.find(t => t.id === selectedId) || null

  // If a note is open, refresh the note object from latest track state
  const liveNote = openNote
    ? (tracks.find(t => t.id === openNote.trackId)?.items.find(i => i.type === 'note' && i.id === openNote.note.id) || null)
    : null

  function handleNewNote() {
    if (!selectedId) return
    const note = createNote(selectedId, 'Untitled note')
    refresh()
    setOpenNote({ trackId: selectedId, note })
  }

  function handleOpenNote(note) {
    setOpenNote({ trackId: selectedId, note })
  }

  function handleNoteBack() {
    refresh()
    setOpenNote(null)
  }

  // On phones this two-pane view becomes master-detail: the track list is the
  // "master"; once a track is selected (or a note is open) the detail pane takes
  // over full-width. data-open drives the CSS collapse in index.css.
  const detailOpen = !!(selectedTrack || (openNote && liveNote))

  return (
    <div className="mytracks-split" data-open={detailOpen ? '1' : '0'} style={{ display: 'flex', height: 'calc(100vh - 48px)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      <TrackList
        tracks={tracks}
        selectedId={selectedId}
        onSelect={id => { setOpenNote(null); setSelectedId(id); syncTrackUrl(id) }}
        onCreate={name => { const t = createTrack(name); refresh(); setSelectedId(t.id); syncTrackUrl(t.id) }}
        onDelete={id => {
          if (!window.confirm('Delete this track? This cannot be undone.')) return
          deleteTrack(id)
          refresh()
          if (selectedId === id) { setSelectedId(null); setOpenNote(null); syncTrackUrl(null) }
        }}
        onMoveItem={(fromTrackId, toTrackId, index) => { moveItem(fromTrackId, toTrackId, index); refresh() }}
        onBuildTiers={() => {
          if (!window.confirm('Build the S / A / B tier tracks? This creates (or rebuilds) three tracks — S Tier, A Tier, B Tier — from every Foundation module, ranked by senior-MLE interview frequency.')) return
          const res = seedTierTracks()
          const next = getTracks()
          setTracks(next)
          setOpenNote(null)
          const sTrack = next.find(t => t.name === 'S Tier')
          if (sTrack) { setSelectedId(sTrack.id); syncTrackUrl(sTrack.id) }
          const get = n => res.find(r => r.name === n)?.count ?? 0
          const total = res.reduce((n, r) => n + r.count, 0)
          window.alert(`Done: S (${get('S Tier')}), A (${get('A Tier')}), B (${get('B Tier')}) — ${total} modules across 3 tracks.`)
        }}
      />

      <div className="mytracks-detail" style={{ flex: 1, overflow: 'hidden', background: 'var(--depth)', display: 'flex', flexDirection: 'column' }}>
        {/* Note editor — full pane */}
        {openNote && liveNote ? (
          <NoteEditor
            trackId={openNote.trackId}
            note={liveNote}
            onBack={handleNoteBack}
          />
        ) : selectedTrack ? (
          <TrackDetail
            key={selectedTrack.id}
            track={selectedTrack}
            // Carry the origin so the destination tab's back button can return
            // to THIS track (in-app), and browser Back restores it via ?track=.
            onNavigate={(tabId, target) => onNavigate(tabId, target, { origin: { tab: 'my_tracks', trackId: selectedTrack.id } })}
            onRename={name => { renameTrack(selectedTrack.id, name); refresh() }}
            onNewNote={handleNewNote}
            onOpenNote={handleOpenNote}
            onDeleteNote={noteId => { if (!window.confirm('Delete this note? This cannot be undone.')) return; deleteNote(selectedTrack.id, noteId); refresh() }}
            onRemoveItem={idx => { removeItem(selectedTrack.id, idx); refresh() }}
            onReorderItems={(from, to) => { reorderItems(selectedTrack.id, from, to); refresh() }}
            onUpdateHighlightNote={(trackId, type, itemId, note) => { updateItemMeta(trackId, type, itemId, { note }); refresh() }}
            onBack={() => { setOpenNote(null); setSelectedId(null); syncTrackUrl(null) }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-ghost)', fontSize: '0.9rem' }}>
            {tracks.length === 0 ? 'Create a track to get started.' : 'Select a track.'}
          </div>
        )}
      </div>
    </div>
  )
}
