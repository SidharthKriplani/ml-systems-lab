// src/components/foundations/FoundationViewTabs.jsx — the Full / Quick recap / Interview QnA
// view toggle shared by all 19 foundation family tabs (QNA-INTERVIEW-STANDARD.md UI rules).
// The Interview QnA tab is completion-gated: visible always, locked (SVG padlock, not clickable)
// until the module is marked complete. Hover OR tap on the locked tab explains the gate
// (tap matters — mobile has no hover, and a dead-feeling button reads as a bug).
// When `unlocked` flips false→true while mounted (user just hit "Mark as complete"),
// the tab pulses briefly so the unlock is visible from the bottom of the page.

import { useState, useRef, useEffect } from 'react'
import { LockIcon } from './QnAPanel.jsx'

export function FoundationViewTabs({ hasRecap, recapMode, setRecapMode, qnaMode, setQnaMode, unlocked, annex = {}, annexMode = null, setAnnexMode = () => {} }) {
  const [lockMsg, setLockMsg] = useState(false)
  const [tip, setTip] = useState(null)  // hover description chip (annex-tab skeleton, 2026-07-23)
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
      <button onClick={() => { setRecapMode(false); setQnaMode(false); setAnnexMode(null) }}
        onMouseEnter={() => setTip('Full — the complete lesson: teaching, worked examples, key points')}
        onMouseLeave={() => setTip(null)}
        style={btn(!recapMode && !qnaMode && !annexMode, 'var(--prime)')}>
        Full module
      </button>
      {annex?.academic?.length > 0 && (
        <button onClick={() => { setAnnexMode('academic'); setRecapMode(false); setQnaMode(false) }}
          onMouseEnter={() => setTip('Academic — formal setup and derivations: the math behind the lesson, with primary sources')}
          onMouseLeave={() => setTip(null)}
          style={btn(annexMode === 'academic', '#e8a030')}>
          Academic
        </button>
      )}
      {annex?.cloud?.length > 0 && (
        <button onClick={() => { setAnnexMode('cloud'); setRecapMode(false); setQnaMode(false) }}
          onMouseEnter={() => setTip('Cloud — this concept in AWS / GCP / Azure: names, deltas, costs, vendor-lock answers')}
          onMouseLeave={() => setTip(null)}
          style={btn(annexMode === 'cloud', '#38bdf8')}>
          Cloud
        </button>
      )}
      {annex?.min?.length > 0 && (
        <button onClick={() => { setAnnexMode('min'); setRecapMode(false); setQnaMode(false) }}
          onMouseEnter={() => setTip('20:80 — the interview minimum: the 20% of this module that carries 80% of interview asks')}
          onMouseLeave={() => setTip(null)}
          style={btn(annexMode === 'min', '#34d399')}>
          20:80
        </button>
      )}
      {hasRecap && (
        <button onClick={() => { setRecapMode(true); setQnaMode(false); setAnnexMode(null) }}
          onMouseEnter={() => setTip('Compressed refresher of what this module taught')}
          onMouseLeave={() => setTip(null)}
          style={btn(recapMode && !qnaMode, 'var(--prime)')}>
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
          setQnaMode(true); setRecapMode(false); setAnnexMode(null)
        }}
        onMouseEnter={() => { if (!unlocked) setLockMsg(true); else setTip('Interview QnA — real interview questions with answers for this module') }}
        onMouseLeave={() => { setLockMsg(false); setTip(null) }}
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
      {tip && !lockMsg && (
        <span style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '0.35rem', zIndex: 30,
          fontSize: '0.7rem', fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'nowrap',
          color: 'var(--ink-mid)', background: 'var(--surface)', border: '1px solid var(--rim)',
          borderRadius: '6px', padding: '0.35rem 0.6rem', boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        }}>{tip}</span>
      )}
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
