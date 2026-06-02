// ── LoadingSpinner ───────────────────────────────────────────────────────────
// Minimal fallback UI for React.lazy() + Suspense boundaries

export default function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* Animated spinner */}
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(240,165,0,0.2)',
          borderTopColor: 'var(--prime)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{
          fontSize: '13px',
          color: 'var(--ink-low)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
        }}>
          Loading...
        </span>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
