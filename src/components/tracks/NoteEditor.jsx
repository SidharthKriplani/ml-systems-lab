import { useState, useRef, useEffect, useCallback } from 'react'
import { updateNote } from '../../utils/tracks.js'

// ── URL helpers ───────────────────────────────────────────────────────────────

function detectVideo(url) {
  try {
    const u = new URL(url)
    const yt = u.hostname.match(/youtube\.com|youtu\.be/)
    if (yt) {
      const id = u.hostname === 'youtu.be'
        ? u.pathname.slice(1)
        : u.searchParams.get('v') || u.pathname.split('/').pop()
      if (id) return { platform: 'youtube', videoId: id }
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      if (id) return { platform: 'vimeo', videoId: id }
    }
    if (u.hostname.includes('loom.com') && u.pathname.includes('/share/')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      if (id) return { platform: 'loom', videoId: id }
    }
  } catch {}
  return null
}

function videoThumb(platform, videoId) {
  if (platform === 'youtube') return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  if (platform === 'vimeo') return null // no public thumb API without token
  if (platform === 'loom') return null
  return null
}

function videoEmbedUrl(platform, videoId) {
  if (platform === 'youtube') return `https://www.youtube.com/embed/${videoId}?autoplay=1`
  if (platform === 'vimeo') return `https://player.vimeo.com/video/${videoId}?autoplay=1`
  if (platform === 'loom') return `https://www.loom.com/embed/${videoId}?autoplay=1`
  return null
}

function isUrl(str) {
  try { return Boolean(new URL(str)) } catch { return false }
}

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ── Auto-fetch link metadata ──────────────────────────────────────────────────

// A readable title derived from the URL itself — used when the OG-tag fetch fails
// (the proxy is flaky/rate-limited), so a saved link is NEVER left title-less.
function fallbackTitle(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    const seg = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() || ''
    const clean = decodeURIComponent(seg)
      .replace(/\.[a-z0-9]{1,5}$/i, '')     // strip extension
      .replace(/[-_+]+/g, ' ')
      .trim()
    return clean ? `${clean} · ${host}` : host
  } catch { return url }
}

async function fetchMeta(url) {
  const fallback = fallbackTitle(url)
  // Try allorigins proxy to get og tags; on any failure fall back to a URL-derived title.
  try {
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    const res = await fetch(proxy, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return { title: fallback, summary: '' }
    const json = await res.json()
    const html = json.contents || ''
    const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
      || html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
      || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    return {
      title: titleMatch ? titleMatch[1].trim().slice(0, 120) : fallback,
      summary: descMatch ? descMatch[1].trim().slice(0, 300) : '',
    }
  } catch {
    return { title: fallback, summary: '' }
  }
}

// ── Block components ──────────────────────────────────────────────────────────

function TextBlock({ block, onChange, onPaste, onDelete, autoFocus }) {
  const ref = useRef(null)

  useEffect(() => {
    if (autoFocus && ref.current) ref.current.focus()
  }, [autoFocus])

  function handleInput(e) {
    onChange({ ...block, content: e.target.value })
  }

  function handleKeyDown(e) {
    if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault()
      onDelete()
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={ref}
        value={block.content}
        onChange={handleInput}
        onPaste={onPaste}
        onKeyDown={handleKeyDown}
        placeholder="Write something… or paste a YouTube / Vimeo / Loom URL to embed a video, any other URL to save a page."
        rows={1}
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'none', overflow: 'hidden',
          background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--ink-hi)', fontSize: '0.92rem', lineHeight: 1.7,
          fontFamily: 'var(--font-sans)', padding: '0.1rem 0',
        }}
        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
      />
    </div>
  )
}

function VideoBlock({ block, onDelete, onUpdateTitle }) {
  const [playing, setPlaying] = useState(false)
  const thumb = videoThumb(block.platform, block.videoId)
  const embedUrl = videoEmbedUrl(block.platform, block.videoId)

  return (
    <div style={{
      border: '1px solid var(--rim)', borderRadius: 8, overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      {playing && embedUrl ? (
        <iframe
          src={embedUrl}
          style={{ width: '100%', aspectRatio: '16/9', border: 'none', display: 'block' }}
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : (
        <div
          onClick={() => setPlaying(true)}
          style={{
            position: 'relative', cursor: 'pointer', background: '#000',
            aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {thumb
            ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            : <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--ink-low)', fontSize: '0.8rem' }}>{block.platform}</span>
              </div>
          }
          <div style={{
            position: 'absolute', width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: '1.3rem', marginLeft: 3 }}>▶</span>
          </div>
        </div>
      )}
      <div style={{ padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--prime)', background: 'var(--depth)', padding: '0.1rem 0.4rem', borderRadius: 3,
        }}>{block.platform}</span>
        <input
          value={block.title || ''}
          onChange={e => onUpdateTitle(e.target.value)}
          placeholder="Add a title…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--ink-mid)', fontSize: '0.82rem', fontFamily: 'var(--font-sans)',
          }}
        />
        <a href={block.url} target="_blank" rel="noreferrer"
          style={{ color: 'var(--ink-low)', fontSize: '0.75rem', textDecoration: 'none' }}>↗</a>
        <button onClick={onDelete} title="Remove"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '0.8rem', padding: 0 }}>✕</button>
      </div>
    </div>
  )
}

function LinkBlock({ block, onDelete, onUpdateSummary, onUpdateTitle }) {
  const favicon = `https://www.google.com/s2/favicons?domain=${block.domain}&sz=32`

  return (
    <div style={{
      border: '1px solid var(--rim)', borderRadius: 8,
      background: 'var(--surface)', padding: '0.75rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src={favicon} alt="" width={14} height={14} style={{ borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-low)' }}>{block.domain}</span>
        <a href={block.url} target="_blank" rel="noreferrer"
          style={{ marginLeft: 'auto', color: 'var(--ink-low)', fontSize: '0.75rem', textDecoration: 'none', flexShrink: 0 }}>Open ↗</a>
        <button onClick={onDelete} title="Remove"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-low)', fontSize: '0.8rem', padding: 0, flexShrink: 0 }}>✕</button>
      </div>
      <input
        value={block.title || ''}
        onChange={e => onUpdateTitle(e.target.value)}
        placeholder="Title…"
        style={{
          background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--ink-hi)', fontSize: '0.88rem', fontWeight: 600, fontFamily: 'var(--font-sans)',
        }}
      />
      <textarea
        value={block.summary || ''}
        onChange={e => onUpdateSummary(e.target.value)}
        placeholder="Summary or notes about this page…"
        rows={2}
        style={{
          background: 'transparent', border: 'none', outline: 'none', resize: 'none',
          color: 'var(--ink-mid)', fontSize: '0.82rem', lineHeight: 1.5, fontFamily: 'var(--font-sans)',
        }}
      />
    </div>
  )
}

// ── Pending link block (while fetching) ───────────────────────────────────────

function PendingLinkBlock({ url }) {
  return (
    <div style={{
      border: '1px solid var(--rim)', borderRadius: 8,
      background: 'var(--surface)', padding: '0.75rem 1rem',
      display: 'flex', alignItems: 'center', gap: '0.6rem',
    }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--ink-low)' }}>Fetching {domainOf(url)}…</span>
    </div>
  )
}

// ── Main NoteEditor ───────────────────────────────────────────────────────────

export function NoteEditor({ trackId, note, onBack }) {
  const [title, setTitle] = useState(note.title || '')
  const [blocks, setBlocks] = useState(note.blocks?.length ? note.blocks : [{ id: uid(), type: 'text', content: '' }])
  const [pendingUrl, setPendingUrl] = useState(null) // url being fetched
  const saveTimer = useRef(null)
  const [newBlockFocus, setNewBlockFocus] = useState(null) // id of block to autofocus

  // Debounced save
  const persist = useCallback((nextTitle, nextBlocks) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateNote(trackId, note.id, { title: nextTitle, blocks: nextBlocks })
    }, 600)
  }, [trackId, note.id])

  function setBlocksAndSave(next) {
    setBlocks(next)
    persist(title, next)
  }

  function setTitleAndSave(t) {
    setTitle(t)
    persist(t, blocks)
  }

  function updateBlock(id, patch) {
    const next = blocks.map(b => b.id === id ? { ...b, ...patch } : b)
    setBlocksAndSave(next)
  }

  function deleteBlock(id) {
    const next = blocks.filter(b => b.id !== id)
    const fallback = next.length ? next : [{ id: uid(), type: 'text', content: '' }]
    setBlocksAndSave(fallback)
  }

  function addTextBlock() {
    const b = { id: uid(), type: 'text', content: '' }
    const next = [...blocks, b]
    setBlocksAndSave(next)
    setNewBlockFocus(b.id)
  }

  async function handlePaste(e, blockId) {
    const text = e.clipboardData.getData('text').trim()
    if (!isUrl(text)) return // let normal paste happen

    e.preventDefault()

    const video = detectVideo(text)
    if (video) {
      // Replace the block (or insert after) with a video block
      const vb = { id: uid(), type: 'video', url: text, platform: video.platform, videoId: video.videoId, title: '' }
      const next = blocks.flatMap(b => b.id === blockId ? [vb, { id: uid(), type: 'text', content: '' }] : [b])
      setBlocksAndSave(next)
      return
    }

    // Link — insert pending placeholder, fetch meta
    const lb = { id: uid(), type: 'link', url: text, domain: domainOf(text), title: '', summary: '' }
    const textAfter = { id: uid(), type: 'text', content: '' }
    const next = blocks.flatMap(b => b.id === blockId ? [lb, textAfter] : [b])
    setBlocksAndSave(next)
    setPendingUrl(lb.id)

    const meta = await fetchMeta(text)
    setBlocks(prev => {
      const updated = prev.map(b => b.id === lb.id ? { ...b, title: meta.title, summary: meta.summary } : b)
      persist(title, updated)
      return updated
    })
    setPendingUrl(null)
  }

  function addLinkBlock() {
    const url = window.prompt('Paste a URL:')
    if (!url || !isUrl(url)) return
    const video = detectVideo(url)
    if (video) {
      const vb = { id: uid(), type: 'video', url, platform: video.platform, videoId: video.videoId, title: '' }
      setBlocksAndSave([...blocks, vb, { id: uid(), type: 'text', content: '' }])
      return
    }
    const lb = { id: uid(), type: 'link', url, domain: domainOf(url), title: '', summary: '' }
    setBlocksAndSave([...blocks, lb, { id: uid(), type: 'text', content: '' }])
    setPendingUrl(lb.id)
    fetchMeta(url).then(meta => {
      setBlocks(prev => {
        const updated = prev.map(b => b.id === lb.id ? { ...b, ...meta } : b)
        persist(title, updated)
        return updated
      })
      setPendingUrl(null)
    })
  }

  // Save on unmount
  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current)
      updateNote(trackId, note.id, { title, blocks })
    }
  }, []) // eslint-disable-line

  const blockCount = blocks.filter(b => b.type !== 'text' || b.content.trim()).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.65rem 1.5rem', borderBottom: '1px solid var(--rim)',
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ink-low)', fontSize: '1rem', padding: 0, lineHeight: 1,
        }} title="Back to track">←</button>
        <input
          value={title}
          onChange={e => setTitleAndSave(e.target.value)}
          placeholder="Note title…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--ink-hi)', fontSize: '1rem', fontWeight: 700,
            fontFamily: 'var(--font-sans)',
          }}
        />
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-ghost)', flexShrink: 0 }}>
          {blockCount} block{blockCount !== 1 ? 's' : ''} · auto-saved
        </span>
      </div>

      {/* Editor body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem 3rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {blocks.map(block => {
            if (block.type === 'text') {
              return (
                <TextBlock
                  key={block.id}
                  block={block}
                  autoFocus={newBlockFocus === block.id}
                  onChange={updated => updateBlock(block.id, { content: updated.content })}
                  onPaste={e => handlePaste(e, block.id)}
                  onDelete={() => deleteBlock(block.id)}
                />
              )
            }
            if (block.type === 'video') {
              return (
                <VideoBlock
                  key={block.id}
                  block={block}
                  onDelete={() => deleteBlock(block.id)}
                  onUpdateTitle={t => updateBlock(block.id, { title: t })}
                />
              )
            }
            if (block.type === 'link') {
              if (pendingUrl === block.id) return <PendingLinkBlock key={block.id} url={block.url} />
              return (
                <LinkBlock
                  key={block.id}
                  block={block}
                  onDelete={() => deleteBlock(block.id)}
                  onUpdateTitle={t => updateBlock(block.id, { title: t })}
                  onUpdateSummary={s => updateBlock(block.id, { summary: s })}
                />
              )
            }
            return null
          })}

          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
            <button onClick={addTextBlock} style={{
              background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 6,
              color: 'var(--ink-low)', fontSize: '0.78rem', cursor: 'pointer',
              padding: '0.3rem 0.7rem', fontFamily: 'var(--font-sans)',
            }}>+ Text</button>
            <button onClick={addLinkBlock} style={{
              background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 6,
              color: 'var(--ink-low)', fontSize: '0.78rem', cursor: 'pointer',
              padding: '0.3rem 0.7rem', fontFamily: 'var(--font-sans)',
            }}>+ Video / Link</button>
          </div>
        </div>
      </div>
    </div>
  )
}
