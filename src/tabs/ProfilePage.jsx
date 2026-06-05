import { useState, useEffect } from 'react'
import { signOut } from '../utils/auth.js'
import { pushProgressToSupabase, pullProgressFromSupabase } from '../utils/syncProgress.js'
import { authEnabled } from '../utils/supabase.js'
import { downloadProgressJSON } from '../utils/export.js'

// ── ProfilePage — 5 cards (PAL pattern) ──────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--depth)', border: '1px solid var(--rim)',
      borderRadius: '14px', padding: '24px 28px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardLabel({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: '14px' }}>
      {children}
    </div>
  )
}

function MetricTile({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface)', borderRadius: '10px', minWidth: '80px' }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 900, color: 'var(--prime)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

function readAllScores() {
  const tabs = new Set()
  let total = 0, attempted = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith('msl_score:')) continue
      const val = localStorage.getItem(k)
      if (!val) continue
      const tabId = k.replace('msl_score:', '').split('_')[0]
      tabs.add(tabId)
      try {
        const arr = JSON.parse(val)
        if (Array.isArray(arr)) {
          total += arr.length
          attempted += arr.filter(x => x?.revealed || x?.completed).length
        }
      } catch {}
    }
  } catch {}
  return { tabCount: tabs.size, total, attempted }
}

export default function ProfilePage({ user, onNavigate, onShowAuth }) {
  const [syncState, setSyncState] = useState('idle') // idle | syncing | done | error
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('msl_theme') || 'dark' } catch { return 'dark' } })
  const scores = readAllScores()
  const bookmarks = (() => { try { return JSON.parse(localStorage.getItem('msl_bookmarks') || '[]').length } catch { return 0 } })()

  // Signed-out state
  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '0 20px' }}>
        <Card>
          <CardLabel>Profile</CardLabel>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 20px' }}>
            Sign in to see your profile, sync progress across devices, and track your preparation over time.
          </p>
          {authEnabled ? (
            <button onClick={onShowAuth} className="btn-primary" style={{ width: '100%', padding: '11px', fontSize: '13px' }}>
              Sign in →
            </button>
          ) : (
            <p style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>
              Auth not configured — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel env vars.
            </p>
          )}
        </Card>
      </div>
    )
  }

  // Provider label
  const provider = user.app_metadata?.provider
  const providerLabel = provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'Email'

  // Avatar
  const avatar = user.user_metadata?.avatar_url
  const name   = user.user_metadata?.full_name || user.user_metadata?.name || user.user_metadata?.user_name || ''
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user.email?.[0]?.toUpperCase() || 'U'

  async function handleSync() {
    setSyncState('syncing')
    const { error: pushErr } = await pushProgressToSupabase(user)
    const { error: pullErr } = await pullProgressFromSupabase(user)
    setSyncState(pushErr || pullErr ? 'error' : 'done')
    setTimeout(() => setSyncState('idle'), 3000)
  }

  async function handleSignOut() {
    await signOut()
    // onAuthStateChange in App.jsx will set user to null
  }

  function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('msl_theme', next) } catch {}
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        Object.entries(data).forEach(([k, v]) => {
          if (k.startsWith('msl_')) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v))
        })
        window.location.reload()
      } catch {}
    }
    reader.readAsText(file)
  }

  const activeGuidedPath = (() => {
    try { return JSON.parse(localStorage.getItem('msl_active_path') || 'null') } catch { return null }
  })()

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px 80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Card 1 — Identity */}
      <Card>
        <CardLabel>Account</CardLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          {avatar ? (
            <img src={avatar} alt={name} style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid var(--rim-hi)' }} />
          ) : (
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--prime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '18px', color: 'var(--depth)', flexShrink: 0 }}>
              {initials}
            </div>
          )}
          <div>
            {name && <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '2px' }}>{name}</div>}
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-low)' }}>{user.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '4px', padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{providerLabel}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)' }}>since {new Date(user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid var(--rim)', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', cursor: 'pointer' }}>
          Sign out
        </button>
      </Card>

      {/* Card 2 — Practice stats */}
      <Card>
        <CardLabel>Practice stats</CardLabel>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <MetricTile label="Attempted" value={scores.attempted} />
          <MetricTile label="Sections" value={scores.tabCount} />
          <MetricTile label="Bookmarks" value={bookmarks} />
        </div>
        <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--prime)', padding: 0, textDecoration: 'underline' }}>
          View full progress →
        </button>
      </Card>

      {/* Card 3 — Cross-device sync */}
      <Card>
        <CardLabel>Cross-device sync</CardLabel>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 16px' }}>
          Push your local progress to the cloud and pull it down on another device.
        </p>
        <button
          onClick={handleSync}
          disabled={syncState === 'syncing'}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '12px', opacity: syncState === 'syncing' ? 0.6 : 1 }}
        >
          {syncState === 'idle'    && 'Sync now'}
          {syncState === 'syncing' && 'Syncing…'}
          {syncState === 'done'    && '✓ Synced'}
          {syncState === 'error'   && 'Error — retry'}
        </button>
      </Card>

      {/* Card 4 — Study plans */}
      <Card>
        <CardLabel>Study plan</CardLabel>
        {activeGuidedPath ? (
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', marginBottom: '8px' }}>{activeGuidedPath.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>Step {activeGuidedPath.step} of {activeGuidedPath.total}</div>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--prime)', padding: 0, textDecoration: 'underline' }}>
              Resume on Home →
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)', lineHeight: 1.6, margin: '0 0 14px' }}>No active guided path. Start one from the Home dashboard.</p>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--prime)', padding: 0, textDecoration: 'underline' }}>
              Go to Home →
            </button>
          </div>
        )}
      </Card>

      {/* Card 5 — Settings */}
      <Card>
        <CardLabel>Settings</CardLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>Theme</span>
            <button onClick={handleThemeToggle} style={{ background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', cursor: 'pointer' }}>
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
          </div>
          {/* Export */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>Export progress</span>
            <button onClick={downloadProgressJSON} style={{ background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', cursor: 'pointer' }}>
              Download JSON
            </button>
          </div>
          {/* Import */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>Import progress</span>
            <label style={{ background: 'var(--surface)', border: '1px solid var(--rim-hi)', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', cursor: 'pointer' }}>
              Upload JSON
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </Card>

    </div>
  )
}
