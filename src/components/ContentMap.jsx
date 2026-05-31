import { useState, useEffect, useRef } from 'react'

// ── Tree components ────────────────────────────────────────────────────────────

function TabLeaf({ label, desc, isPro, onNav }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
      {/* horizontal connector */}
      <div style={{ width: '16px', flexShrink: 0, borderBottom: '1px solid var(--rim)', marginTop: '19px' }} />
      <button
        onClick={onNav}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          flex: 1, textAlign: 'left', padding: '8px 8px',
          minHeight: '40px',
          background: hov ? 'rgba(240,165,0,0.07)' : 'none',
          border: `1px solid ${hov ? 'rgba(240,165,0,0.22)' : 'transparent'}`,
          borderRadius: 'var(--r-sm)', cursor: 'pointer',
          transition: 'background var(--t-fast), border-color var(--t-fast)',
          display: 'flex', alignItems: 'center', gap: '6px',
          overflow: 'hidden',
        }}
      >
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--ink-hi)', flexShrink: 0 }}>
          {label}
        </span>
        {isPro && (
          <span style={{
            fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)',
            border: '1px solid var(--rim)', borderRadius: '3px', padding: '1px 4px', flexShrink: 0,
          }}>pro</span>
        )}
        {desc && (
          <span
            className="map-leaf-desc"
            style={{
              fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)',
              lineHeight: 1.4, flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            — {desc}
          </span>
        )}
      </button>
    </div>
  )
}

function DomainBranch({ domain, checkPro, onNav }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', marginBottom: '2px' }}>
      {/* horizontal connector to domain label */}
      <div style={{ width: '14px', flexShrink: 0, borderBottom: '1px solid var(--rim)', marginTop: '12px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* domain label */}
        <div style={{
          fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.09em',
          color: 'var(--ink-low)', padding: '4px 0 4px 4px',
          userSelect: 'none',
        }}>
          {domain.label}
        </div>
        {/* tab leaves with vertical spine */}
        <div style={{ borderLeft: '1px solid var(--rim)', marginLeft: '4px', paddingLeft: 0 }}>
          {domain.tabs.map(t => (
            <TabLeaf
              key={t.id}
              label={t.label}
              desc={t.desc}
              isPro={checkPro(t.id)}
              onNav={() => onNav(t.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ZoneSection({ zoneLabel, children }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.14em',
        color: 'var(--prime)', padding: '0 0 6px 0',
        userSelect: 'none',
      }}>
        {zoneLabel}
      </div>
      {/* zone children with vertical spine */}
      <div style={{ borderLeft: '1px solid rgba(240,165,0,0.25)', marginLeft: '3px' }}>
        {children}
      </div>
    </div>
  )
}

// ── Search result row ─────────────────────────────────────────────────────────

function SearchRow({ item, isPro, onNav }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => onNav(item.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', textAlign: 'left',
        padding: '10px 12px', marginBottom: '2px',
        minHeight: '44px',
        background: hov ? 'rgba(240,165,0,0.07)' : 'none',
        border: `1px solid ${hov ? 'rgba(240,165,0,0.22)' : 'transparent'}`,
        borderRadius: 'var(--r-sm)', cursor: 'pointer',
        transition: 'background var(--t-fast), border-color var(--t-fast)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)' }}>
            {item.label}
          </span>
          {isPro && (
            <span style={{
              fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)',
              border: '1px solid var(--rim)', borderRadius: '3px', padding: '1px 4px',
            }}>pro</span>
          )}
        </div>
        {item.desc && (
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--ink-ghost)', lineHeight: 1.4, fontFamily: 'var(--font-sans)' }}>
            {item.desc}
          </p>
        )}
      </div>
      <span style={{
        fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--prime)',
        textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0,
      }}>
        {item.domain}
      </span>
    </button>
  )
}

// ── Static tabs ───────────────────────────────────────────────────────────────

const STATIC_TABS = [
  { id: 'gradient',  label: 'Gradient ∇', desc: 'Production ML essays — read, then practice', domain: 'Read' },
  { id: 'landscape', label: 'Landscape',  desc: 'ML tools and infrastructure landscape map', domain: 'Today' },
  { id: 'home',      label: 'Home',       desc: 'Dashboard — streak, role, tracks, continue',  domain: 'Today' },
]

// ── ContentMap ────────────────────────────────────────────────────────────────

export default function ContentMap({ onClose, onNavigate, isUnlocked, practiceDomains, interviewTools, premiumTabs }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Build flat list for search
  const allItems = [
    ...practiceDomains.flatMap(d =>
      d.tabs.map(t => ({ id: t.id, label: t.label, desc: t.desc || '', domain: d.label }))
    ),
    ...interviewTools.map(t => ({ id: t.id, label: t.label, desc: t.desc || '', domain: 'Interview' })),
    ...STATIC_TABS,
  ]

  const checkPro = id => premiumTabs.has(id) && !isUnlocked

  const q = query.trim().toLowerCase()
  const filtered = q
    ? allItems.filter(i =>
        i.label.toLowerCase().includes(q) ||
        i.desc.toLowerCase().includes(q) ||
        i.domain.toLowerCase().includes(q)
      )
    : null

  function go(id) { onNavigate(id); onClose() }

  // Overlay top padding: compress on small phones to leave more room
  const overlayPad = typeof window !== 'undefined' && window.innerWidth < 480
    ? '16px 12px'
    : '48px 16px 48px'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: overlayPad, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '620px',
          background: 'var(--depth)',
          border: '1px solid var(--rim)',
          borderRadius: 'var(--r-lg)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.85), 0 0 0 1px rgba(240,165,0,0.10)',
          overflow: 'hidden',
        }}
      >

        {/* ── Search header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px',
          borderBottom: '1px solid var(--rim)',
          background: 'rgba(0,0,0,0.18)',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: 'var(--ink-ghost)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Jump to any tab..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)',
              fontSize: '16px', caretColor: 'var(--prime)',
            }}
          />
          <kbd
            onClick={onClose}
            style={{
              fontSize: '10px', padding: '3px 7px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--rim)', borderRadius: '4px',
              color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)',
              cursor: 'pointer', flexShrink: 0,
            }}
          >esc</kbd>
        </div>

        {/* ── Content ── */}
        <div style={{ maxHeight: '65vh', overflowY: 'auto', scrollbarWidth: 'none' }}>

          {filtered ? (
            /* ── Filtered results (flat list) ── */
            filtered.length === 0 ? (
              <div style={{
                padding: '48px 24px', textAlign: 'center',
                color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', fontSize: '14px',
              }}>
                No tabs match{' '}
                <span style={{ color: 'var(--ink-low)' }}>"{query}"</span>
              </div>
            ) : (
              <div style={{ padding: '8px 12px' }}>
                {filtered.map(item => (
                  <SearchRow key={item.id + item.domain} item={item} isPro={checkPro(item.id)} onNav={go} />
                ))}
              </div>
            )
          ) : (
            /* ── Tree view ── */
            <div style={{ padding: '16px 16px 8px' }}>

              {/* Practice zone */}
              <ZoneSection zoneLabel="Practice">
                {practiceDomains.map(domain => (
                  <DomainBranch key={domain.id} domain={domain} checkPro={checkPro} onNav={go} />
                ))}
              </ZoneSection>

              {/* Interview zone */}
              <ZoneSection zoneLabel="Interview">
                <div style={{ borderLeft: '1px solid var(--rim)', marginLeft: '4px', paddingLeft: 0 }}>
                  {interviewTools.map(t => (
                    <TabLeaf key={t.id} label={t.label} desc={t.desc} isPro={checkPro(t.id)} onNav={() => go(t.id)} />
                  ))}
                </div>
              </ZoneSection>

              {/* Read zone */}
              <ZoneSection zoneLabel="Read">
                <div style={{ borderLeft: '1px solid var(--rim)', marginLeft: '4px', paddingLeft: 0 }}>
                  {STATIC_TABS.filter(t => t.id === 'gradient').map(t => (
                    <TabLeaf key={t.id} label={t.label} desc={t.desc} isPro={false} onNav={() => go(t.id)} />
                  ))}
                </div>
              </ZoneSection>

              {/* Today zone */}
              <ZoneSection zoneLabel="Today">
                <div style={{ borderLeft: '1px solid var(--rim)', marginLeft: '4px', paddingLeft: 0 }}>
                  {STATIC_TABS.filter(t => t.id === 'landscape' || t.id === 'home').map(t => (
                    <TabLeaf key={t.id} label={t.label} desc={t.desc} isPro={false} onNav={() => go(t.id)} />
                  ))}
                </div>
              </ZoneSection>

            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid var(--rim)',
          padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(0,0,0,0.14)',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>
            {allItems.length - 1} destinations
          </span>
          <div className="map-kbd-hints" style={{ display: 'flex', gap: '14px', marginLeft: 'auto' }}>
            {[['↵', 'open'], ['esc', 'close']].map(([k, v]) => (
              <span key={k} style={{
                fontSize: '11px', color: 'var(--ink-ghost)',
                fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <kbd style={{
                  fontSize: '9px', padding: '2px 5px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--rim)', borderRadius: '3px',
                  fontFamily: 'var(--font-mono)',
                }}>{k}</kbd>
                {v}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
