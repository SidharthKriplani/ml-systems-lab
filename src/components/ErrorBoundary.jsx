import React from 'react'

// MSL had no top-level error boundary anywhere (App.jsx / main.jsx) — an
// uncaught render error in ANY tab/component unmounts the entire React tree,
// leaving nothing but the raw <body> background showing (`--void: #111111`
// in dark theme) — a fully black screen with no error message, no way back,
// just a reload away from working again. That's almost certainly the "page
// simply blacks out" bug: some specific module/interaction throws, and with
// no boundary catching it, the whole app disappears instead of just that tab.
// Mirrors product-analytics-lab's ErrorBoundary (components/shared/ErrorBoundary.jsx)
// — same reset-on-key-change mechanism, MSL's own color vars.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('MSL ErrorBoundary caught:', error, info)
  }

  // Reset whenever resetKey changes (App.jsx passes resetKey={activeTab}) so
  // navigating away from the tab that crashed recovers automatically.
  static getDerivedStateFromProps(props, state) {
    if (state.hasError && props.resetKey !== state.lastResetKey) {
      return { hasError: false, lastResetKey: props.resetKey }
    }
    if (!state.hasError) {
      return { lastResetKey: props.resetKey }
    }
    return null
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: '2rem', textAlign: 'center', width: '100%',
        }}>
          <div style={{
            background: 'var(--surface, #1a1a1a)', border: '1px solid var(--rim, #333)',
            borderRadius: '12px', padding: '2rem 2.5rem', maxWidth: '420px',
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink-hi, #f4f4f4)', marginBottom: '0.5rem', fontFamily: 'var(--font-sans)' }}>
              Something went wrong
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--ink-low, #999)', marginBottom: '1.5rem', lineHeight: 1.55, fontFamily: 'var(--font-sans)' }}>
              An unexpected error occurred in this section. Your progress is saved locally — reloading will restore it.
            </div>
            <button
              onClick={() => { window.location.reload() }}
              style={{
                padding: '0.55rem 1.4rem', background: 'var(--prime, #e8a030)', color: '#111',
                border: 'none', borderRadius: '8px', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
