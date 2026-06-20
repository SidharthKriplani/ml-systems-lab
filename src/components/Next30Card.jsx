import { useEffect } from 'react'
import { writeHomeOverride } from '../data/recommendationEngine.js'
import { track } from '../analytics.js'

export default function Next30Card({ recommendation, onNavigate, onSeeEverything }) {
  useEffect(() => {
    if (recommendation && recommendation.postId) {
      track('next30_card_shown', {
        recommendedPostId: recommendation.postId,
        recommendedPracticeTab: recommendation.practiceTabId || null,
      })
      // Store the recommendation so GradientTab can fire `recommendation_completed`
      // when this exact post is later marked read.
      try {
        localStorage.setItem('msl_last_recommendation', JSON.stringify({
          postId: recommendation.postId,
          shownAt: Date.now(),
        }))
      } catch {}
    }
  }, [recommendation?.postId])

  if (!recommendation || !recommendation.postId) return null

  function handleStart() {
    track('next30_start_clicked', { recommendedPostId: recommendation.postId })
    // Use the existing Gradient deep-link pattern
    try {
      window.history.replaceState(null, '', `?post=${recommendation.postSlug}#gradient`)
    } catch {}
    if (onNavigate) onNavigate('gradient')
  }

  function handleSeeEverything() {
    track('next30_see_everything_clicked')
    writeHomeOverride('dashboard')
    if (onSeeEverything) onSeeEverything()
  }

  return (
    <div style={{
      padding: '28px 30px',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, rgba(240,165,0,0.10) 0%, rgba(240,165,0,0.04) 100%)',
      border: '1px solid rgba(240,165,0,0.28)',
      marginBottom: '28px',
    }}>
      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px', fontWeight: 700 }}>
        Your next 30 minutes
      </div>

      {/* Read line */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
          Read
        </div>
        <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: '4px' }}>
          {recommendation.postTitle}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
          {recommendation.readMin} min{recommendation.practiceLabel ? ' · part of The MLE Path' : ''}
        </div>
      </div>

      {/* Practice line — only when a forward pointer exists */}
      {recommendation.practiceTabId && recommendation.practiceLabel && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            Then practice
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
            {recommendation.practiceLabel}
            <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', fontWeight: 400, marginLeft: '8px' }}>
              ~20 min
            </span>
          </div>
        </div>
      )}

      {/* Why */}
      {recommendation.why && (
        <div style={{ marginBottom: '20px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.16)', border: '1px solid var(--rim)' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', lineHeight: 1.55 }}>
            {recommendation.why}
          </div>
        </div>
      )}

      {/* Start CTA */}
      <button onClick={handleStart}
        style={{
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          background: 'var(--prime)',
          color: 'var(--void)',
          fontSize: '14px',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s',
          letterSpacing: '0.02em',
        }}>
        Start  →
      </button>

      {/* Escape hatch */}
      <div style={{ marginTop: '22px', textAlign: 'center', borderTop: '1px solid var(--rim)', paddingTop: '14px' }}>
        <button onClick={handleSeeEverything}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-low)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            textDecorationColor: 'var(--rim-hi)',
          }}>
          I'm not a beginner — show me everything ↓
        </button>
      </div>
    </div>
  )
}
