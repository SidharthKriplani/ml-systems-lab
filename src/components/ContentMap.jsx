import { useState, useEffect, useRef } from 'react'

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <div style={{
      fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.13em',
      color: 'var(--ink-ghost)', padding: '10px 4px 5px', userSelect: 'none',
    }}>
      {label}
    </div>
  )
}

function TabCard({ label, desc, isPro, onNav }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onNav}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left', padding: '10px 12px', width: '100%',
        background: hov ? 'rgba(240,165,0,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? 'rgba(240,165,0,0.30)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 'var(--r-sm)', cursor: 'pointer',
        transition: 'background var(--t-fast), border-color var(--t-fast)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--ink-hi)' }}>
          {label}
        </span>
        {isPro && (
          <span style={{
            fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)',
            border: '1px solid var(--rim)', borderRadius: '3px', padding: '1px 4px',
          }}>pro</span>
        )}
      </div>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--ink-ghost)', lineHeight: 1.5, fontFamily: 'var(--font-sans)' }}>
        {desc}
      </p>
    </button>
  )
}

function DomainSection({ domain, checkPro, onNav }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <SectionHeader label={domain.label} />
      <div className="map-grid">
        {domain.tabs.map(t => (
          <TabCard
            key={t.id}
            label={t.label}
            desc={t.desc}
            isPro={checkPro(t.id)}
            onNav={() => onNav(t.id)}
          />
        ))}
      </div>

    </div>
  )
}

function TabRow({ item, isPro, onNav }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => onNav(item.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', textAlign: 'left',
        padding: '9px 12px', marginBottom: '3px',
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
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--ink-ghost)', lineHeight: 1.4, fontFamily: 'var(--font-sans)' }}>
          {item.desc}
        </p>
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

// ── ContentMap ────────────────────────────────────────────────────────────────

const STATIC_TABS = [
  { id: 'gradient',  label: 'Gradient ∇', desc: 'Production ML essays — read, then practice', domain: 'Read' },
  { id: 'landscape', label: 'Landscape',  desc: 'ML tools and infrastructure landscape map', domain: 'Today' },
  { id: 'home',      label: 'Home',       desc: 'Dashboard — streak, role, tracks, continue',  domain: 'Today' },
]

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

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '48px 16px 48px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '700px',
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
            /* ── Filtered results ── */
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
                  <TabRow key={item.id + item.domain} item={item} isPro={checkPro(item.id)} onNav={go} />
                ))}
              </div>
            )
          ) : (
            /* ── Full map view ── */
            <div style={{ padding: '12px' }}>

              {/* Practice domains */}
              {practiceDomains.map(domain => (
                <DomainSection key={domain.id} domain={domain} checkPro={checkPro} onNav={go} />
              ))}

              {/* Interview tools */}
              <SectionHeader label="Interview" />
              <div className="map-grid" style={{ marginBottom: '14px' }}>
                {interviewTools.map(t => (
                  <TabCard key={t.id} label={t.label} desc={t.desc} isPro={checkPro(t.id)} onNav={() => go(t.id)} />
                ))}
              </div>

              {/* Read · Today */}
              <SectionHeader label="Read · Today" />
              <div className="map-grid">
                {STATIC_TABS.filter(t => t.id !== 'home').map(t => (
                  <TabCard key={t.id} label={t.label} desc={t.desc} isPro={false} onNav={() => go(t.id)} />
                ))}
              </div>

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
          <div style={{ display: 'flex', gap: '14px', marginLeft: 'auto' }}>
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
