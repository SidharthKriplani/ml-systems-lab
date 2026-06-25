import { useState, useEffect } from 'react'
import { signOut } from '../utils/auth.js'
import { pushProgressToSupabase, pullProgressFromSupabase } from '../utils/syncProgress.js'
import { authEnabled } from '../utils/supabase.js'
import { downloadProgressJSON } from '../utils/export.js'
import { Icon } from '../components/Icon.jsx'
import { readFoundationsRead, overallCompletion } from '../data/foundationsPath.js'
import { computeReadiness, readinessLabel, readinessColor } from '../utils/readiness.js'

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

  const foundationsProg = overallCompletion(readFoundationsRead())
  const foundationsPct = foundationsProg.total ? Math.round((foundationsProg.read / foundationsProg.total) * 100) : 0
  const foundationsComplete = foundationsProg.total > 0 && foundationsProg.read === foundationsProg.total

  function openFoundationsPath() {
    if (onNavigate) onNavigate('gradient')
    setTimeout(() => window.dispatchEvent(new CustomEvent('msl-open-foundations-path')), 50)
  }

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

      {/* Card 1.5 — Interview readiness */}
      {(() => {
        const r = computeReadiness()
        return (
          <Card>
            <CardLabel>Interview readiness</CardLabel>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '36px', fontWeight: 900, letterSpacing: '-0.04em', color: readinessColor(r.level) }}>
                {r.score}%
              </span>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: readinessColor(r.level), fontWeight: 600 }}>
                {readinessLabel(r.level)}
              </span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'var(--rim)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ width: `${r.score}%`, height: '100%', background: readinessColor(r.level), transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)' }}>
              <span title="The MLE Path — 50% of readiness">Path {r.breakdown.path}%</span>
              <span title="Practice scenarios (target: 80) — 30% of readiness">Practice {r.breakdown.practice}%</span>
              <span title="Active days in last 28 — 20% of readiness">Activity {r.breakdown.activity}%</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginTop: '10px', fontStyle: 'italic' }}>
              Aggregate of MLE Path progress + practice scenarios attempted + recent activity. Calibrated against senior MLE interview bar.
            </div>
          </Card>
        )
      })()}

      {/* Card 2 — The MLE Path progress + badge + cert/share on completion */}
      {foundationsProg.read > 0 && (
        <Card style={{ borderColor: foundationsComplete ? 'rgba(52,211,153,0.3)' : 'var(--rim)', background: foundationsComplete ? 'rgba(52,211,153,0.04)' : 'var(--depth)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <CardLabel>The MLE Path</CardLabel>
              {foundationsComplete ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--mint)', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '999px', padding: '4px 12px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Icon name="check" size={11} /> Complete
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>
                      All {foundationsProg.total} MLE Path posts read.
                    </span>
                  </div>
                  {(() => {
                    let issuedAt = null
                    try {
                      issuedAt = localStorage.getItem('msl_cert_issued_at')
                      if (!issuedAt) { issuedAt = String(Date.now()); localStorage.setItem('msl_cert_issued_at', issuedAt) }
                    } catch {}
                    const issuedDate = issuedAt ? new Date(parseInt(issuedAt, 10)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
                    const shareUrl = 'https://ml-systems-lab-v9xe.vercel.app/?path=foundations#gradient'
                    const shareText = `I just completed The MLE Path — 54 posts across 11 tiers of senior MLE preparation: observation discipline, math, classical ML, evaluation, production engineering, MLOps, system design, interview bridge.\n\nThe deepest free senior MLE curriculum on the internet.`
                    const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
                    return (
                      <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(52,211,153,0.06)', border: '1px dashed rgba(52,211,153,0.30)' }}>
                        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 700 }}>Certificate</div>
                        <div style={{ fontSize: '13px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>
                          <strong>{user.user_metadata?.full_name || user.email}</strong> completed The MLE Path on {issuedDate}.
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>
                          Certificate ID: msl-mle-{(issuedAt || '').slice(-8)}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <a href={linkedinShareUrl} target="_blank" rel="noopener noreferrer"
                            onClick={() => { try { navigator.clipboard.writeText(shareText) } catch {} }}
                            style={{ padding: '8px 14px', borderRadius: '7px', background: '#0a66c2', color: '#ffffff', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 600, textDecoration: 'none' }}>
                            Share on LinkedIn
                          </a>
                          <button onClick={() => { try { navigator.clipboard.writeText(shareText + '\n\n' + shareUrl) } catch {} }}
                            style={{ padding: '8px 14px', borderRadius: '7px', background: 'transparent', border: '1px solid var(--rim)', color: 'var(--ink-mid)', fontSize: '12px', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
                            Copy text + URL
                          </button>
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginTop: '10px', fontStyle: 'italic' }}>
                          LinkedIn share opens with the URL pre-filled. The text auto-copies to your clipboard — paste it as the post body.
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '8px' }}>
                    {foundationsProg.read} / {foundationsProg.total} posts · {foundationsPct}%
                  </div>
                  <div style={{ width: '100%', maxWidth: '220px', height: '6px', background: 'var(--rim)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${foundationsPct}%`, background: 'var(--prime)', borderRadius: '3px', transition: 'width 0.3s' }} />
                  </div>
                </>
              )}
            </div>
            <button onClick={openFoundationsPath}
              style={{ flexShrink: 0, fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: foundationsComplete ? 'var(--mint)' : 'var(--prime)', background: 'transparent', border: `1px solid ${foundationsComplete ? 'rgba(52,211,153,0.3)' : 'rgba(240,165,0,0.3)'}`, borderRadius: '7px', padding: '8px 14px', cursor: 'pointer' }}>
              {foundationsComplete ? 'Revisit path' : 'Continue path →'}
            </button>
          </div>
        </Card>
      )}

      {/* Card 3 — Practice stats */}
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
