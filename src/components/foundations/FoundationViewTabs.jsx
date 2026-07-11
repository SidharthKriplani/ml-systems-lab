// src/components/foundations/FoundationViewTabs.jsx — the Full / Quick recap / Interview QnA
// view toggle shared by all 19 foundation family tabs (QNA-INTERVIEW-STANDARD.md UI rules).
// The Interview QnA tab is completion-gated: visible always, locked (SVG padlock, not clickable)
// until the module is marked complete. Hover OR tap on the locked tab explains the gate
// (tap matters — mobile has no hover, and a dead-feeling button reads as a bug).
// When `unlocked` flips false→true while mounted (user just hit "Mark as complete"),
// the tab pulses briefly so the unlock is visible from the bottom of the page.

import { useState, useRef, useEffect } from 'react'
import { LockIcon } from './QnAPanel.jsx'

export function FoundationViewTabs({ hasRecap, recapMode, setRecapMode, qnaMode, setQnaMode, unlocked }) {
  const [lockMsg, setLockMsg] = useState(false)
  const [pulse, setPulse] = useState(false)
  const prevUnlocked = useRef(unlocked)

  // Deep-link arrival: a `qna-<id>` anchor in the URL opens the QnA view directly
  // (only when unlocked — the gate is never bypassed).
  useEffect(() => {
    if (unlocked && /qna-[a-z0-9-]+/.test(window.location.hash || '')) setQnaMode(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const wasLocked = !prevUnlocked.current
    prevUnlocked.current = unlocked
    if (wasLocked && unlocked) {
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 4000)
      return () => clearTimeout(t)
    }
  }, [unlocked])

  const btn = (active, activeColor) => ({
    fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-sans)', cursor: 'pointer',
    padding: '0.4rem 0.9rem', borderRadius: '7px',
    background: active ? activeColor : 'var(--surface)',
    color: active ? '#000' : 'var(--ink-mid)',
    border: `1px solid ${active ? activeColor : 'var(--rim)'}`,
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
  })

  return (
    <div style={{ position: 'relative', display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
      <button onClick={() => { setRecapMode(false); setQnaMode(false) }} style={btn(!recapMode && !qnaMode, 'var(--prime)')}>
        Full module
      </button>
      {hasRecap && (
        <button onClick={() => { setRecapMode(true); setQnaMode(false) }} style={btn(recapMode && !qnaMode, 'var(--prime)')}>
          ⚡ Quick recap
        </button>
      )}
      <button
        onClick={() => {
          if (!unlocked) {
            setLockMsg(true)
            setTimeout(() => setLockMsg(false), 2400)
            return
          }
          setQnaMode(true); setRecapMode(false)
        }}
        onMouseEnter={() => { if (!unlocked) setLockMsg(true) }}
        onMouseLeave={() => setLockMsg(false)}
        aria-disabled={!unlocked}
        style={{
          ...btn(qnaMode, 'var(--prime)'),
          cursor: unlocked ? 'pointer' : 'not-allowed',
          opacity: unlocked || qnaMode ? 1 : 0.55,
          animation: pulse && !qnaMode ? 'qnaTabPulse 1s ease-in-out 3' : 'none',
        }}
      >
        {!unlocked && <LockIcon size={11} color="var(--ink-low)" />}
        Interview QnA
      </button>
      {lockMsg && !unlocked && (
        <span style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '0.35rem', zIndex: 30,
          fontSize: '0.7rem', fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'nowrap',
          color: 'var(--ink-mid)', background: 'var(--surface)', border: '1px solid var(--rim)',
          borderRadius: '6px', padding: '0.35rem 0.6rem', boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        }}>
          Mark the module complete to unlock Interview QnA
        </span>
      )}
      <style>{`@keyframes qnaTabPulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; border-color: var(--prime); color: var(--prime); } }`}</style>
    </div>
  )
}
