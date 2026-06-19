import { useState, useEffect } from 'react'
import { FOUNDATIONS_TIERS, TOTAL_POSTS } from '../data/foundationsPath.js'

// ── Ghost data snippets — float in background to hint at product content ───────
const GHOSTS = [
  'PSI = 0.34', 'AUC drop –5.2%', 'training-serving skew',
  'p99 latency 89ms', 'feature drift detected', 'KS stat 0.41',
  'precision@100 = 0.72', 'shadow mode Δ = –3.1%', 'label leakage',
  'cold start 4.2s', 'SMOTE ratio 1:5', 'gradient explosion',
  'schema drift upstream', 'calibration ECE 0.08', 'champion→challenger',
]

function GhostSnippet({ text, x, y, delay }) {
  return (
    <div style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      fontFamily: 'var(--font-mono)', fontSize: '11px',
      color: 'var(--ink-ghost)', opacity: 0,
      animation: `ghost-fade 6s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none', userSelect: 'none',
      filter: 'blur(0.5px)', whiteSpace: 'nowrap',
    }}>
      {text}
    </div>
  )
}

// Seeded positions so they don't jump on re-render
const GHOST_POSITIONS = [
  { x: 8,  y: 15, d: 0   }, { x: 72, y: 8,  d: 0.8 }, { x: 18, y: 72, d: 1.6 },
  { x: 82, y: 65, d: 2.4 }, { x: 5,  y: 45, d: 3.2 }, { x: 88, y: 30, d: 0.4 },
  { x: 35, y: 85, d: 1.2 }, { x: 62, y: 78, d: 2.0 }, { x: 45, y: 5,  d: 2.8 },
  { x: 78, y: 50, d: 3.6 }, { x: 15, y: 35, d: 1.0 }, { x: 55, y: 92, d: 1.8 },
  { x: 90, y: 82, d: 2.6 }, { x: 30, y: 55, d: 3.4 }, { x: 68, y: 22, d: 0.2 },
]

export default function SignedOutHome({ onShowAuth, onNavigate, onExplore }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t) }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

      <style>{`
        @keyframes ghost-fade {
          0%, 100% { opacity: 0; transform: translateY(0); }
          30%, 70%  { opacity: 0.18; transform: translateY(-4px); }
        }
        @keyframes orb-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes landing-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Background orbs */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,165,0,0.08) 0%, transparent 70%)', top: '-100px', left: '-100px', animation: 'orb-drift 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', bottom: '-80px', right: '-60px', animation: 'orb-drift 16s ease-in-out infinite reverse' }} />
      </div>

      {/* Ghost data snippets */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {GHOSTS.map((text, i) => (
          <GhostSnippet key={text} text={text} x={GHOST_POSITIONS[i].x} y={GHOST_POSITIONS[i].y} delay={GHOST_POSITIONS[i].d} />
        ))}
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative', zIndex: 1, maxWidth: '540px', width: '100%', padding: '0 24px',
        textAlign: 'center',
        opacity: mounted ? 1 : 0,
        animation: mounted ? 'landing-in 0.5s cubic-bezier(0.16,1,0.3,1) both' : 'none',
      }}>
        {/* Logo badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '28px', padding: '6px 12px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '20px' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'var(--prime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '8px', color: 'var(--depth)' }}>ML</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>ML Systems Lab</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.05, margin: '0 0 16px' }}>
          <span style={{ color: 'var(--ink-hi)' }}>You know the theory.</span>
          <br />
          <span style={{ color: 'var(--prime)' }}>Can you debug the failure?</span>
        </h1>

        {/* Subtext */}
        <p style={{ fontSize: '15px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.7, margin: '0 0 24px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
          300+ production ML scenarios across 6 domains. Live Pyodide execution. Interview simulation tools. The judgment that separates a pass from a hire.
        </p>

        {/* The MLE Path teaser */}
        <div style={{ marginBottom: '28px', padding: '14px 16px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '10px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>↥ The MLE Path</div>
          <div style={{ fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, marginBottom: '10px' }}>
            {TOTAL_POSTS}-post complete senior-MLE curriculum: foundations, classical ML, evaluation, production, MLOps, system design, interview.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
            {FOUNDATIONS_TIERS.map(t => (
              <span key={t.id} style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--rim)', borderRadius: '999px', padding: '2px 8px', whiteSpace: 'nowrap' }}>
                {t.label.split('—')[1]?.trim() || t.label}
              </span>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={onShowAuth}
            className="btn-primary"
            style={{ width: '100%', maxWidth: '320px', padding: '14px', fontSize: '15px', fontWeight: 700 }}
          >
            Sign in to practice →
          </button>
          <button
            onClick={() => onExplore ? onExplore() : onNavigate('classical')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-low)', padding: '8px', textDecoration: 'underline', textDecorationColor: 'var(--rim-hi)' }}
          >
            Explore without signing in
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginTop: '24px', lineHeight: 1.6 }}>
          Free to start · Junior scenarios free · No account required for free modules
        </p>
      </div>
    </div>
  )
}
