import { useState } from 'react'
import { COMPANIES, ROLES, LEVELS, getCompanyTrackItems } from '../data/companyTracks.js'
import { CompanyLogo } from '../components/CompanyLogo.jsx'

// Company-specific curated prep tracks (SKELETON). Pick a company → role → level
// and get an ordered list of items that open directly via onNavigate(tabId, target).
// Cells are empty until curated tracks are authored into companyTracks.js.

export default function CompanyTracksTab({ onNavigate }) {
  const [company, setCompany] = useState(COMPANIES[0])
  const [role, setRole] = useState(ROLES[0])
  const [level, setLevel] = useState(LEVELS[0])
  const [q, setQ] = useState('')

  const shown = COMPANIES.filter(c => c.toLowerCase().includes(q.toLowerCase()))
  const items = getCompanyTrackItems(company, role, level)

  const chip = (active) => ({
    padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    borderRadius: 7, border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
    background: active ? 'var(--prime)' : 'transparent',
    color: active ? '#000' : 'var(--ink-mid)', whiteSpace: 'nowrap',
  })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      {/* Company list */}
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--rim)', overflowY: 'auto', padding: '1rem 0.6rem', background: 'var(--depth)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 0.4rem', marginBottom: 8 }}>Companies</div>
        <input
          value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
          style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '6px 9px', marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 6, color: 'var(--ink-hi)', outline: 'none' }}
        />
        {shown.map(c => (
          <div key={c} onClick={() => setCompany(c)}
            style={{
              padding: '7px 10px', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem', marginBottom: 2,
              display: 'flex', alignItems: 'center', gap: 8,
              background: c === company ? 'var(--prime-faint)' : 'transparent',
              border: `1px solid ${c === company ? 'var(--prime)' : 'transparent'}`,
              color: c === company ? 'var(--ink-hi)' : 'var(--ink-mid)', fontWeight: c === company ? 700 : 500,
            }}>
            <CompanyLogo company={c} size={18} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>
          </div>
        ))}
      </div>

      {/* Track detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', background: 'var(--depth)', minWidth: 0 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink-hi)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CompanyLogo company={company} size={28} />{company}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-low)', margin: '0 0 18px', lineHeight: 1.5 }}>
          Curated prep for {company} — pick a role and seniority. Items open the exact module, drill, or question set.
        </p>

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Role</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {ROLES.map(r => <button key={r} style={chip(r === role)} onClick={() => setRole(r)}>{r}</button>)}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Seniority</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {LEVELS.map(l => <button key={l} style={chip(l === level)} onClick={() => setLevel(l)}>{l}</button>)}
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--ink-mid)', marginBottom: 10 }}>
          <strong style={{ color: 'var(--ink-hi)' }}>{company}</strong> · {role} · {level}
        </div>

        {items.length === 0 ? (
          <div style={{ border: '1px dashed var(--rim)', borderRadius: 10, padding: '22px 20px', color: 'var(--ink-low)', fontSize: 13.5, lineHeight: 1.6, background: 'var(--surface)' }}>
            No curated track here yet. This scaffold is ready — items added for this company/role/level will appear as a checklist you can open directly.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, i) => (
              <button
                key={i}
                onClick={() => onNavigate(it.tabId, it.target ?? null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  padding: '11px 14px', borderRadius: 9, cursor: 'pointer',
                  background: 'var(--surface)', border: '1px solid var(--rim)', color: 'var(--ink-hi)',
                  fontSize: 14, fontWeight: 600, transition: 'border-color 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--prime)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)' }}
              >
                {it.kind && <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--prime)', border: '1px solid var(--prime)', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{it.kind}</span>}
                <span style={{ flex: 1 }}>{it.label}</span>
                <span style={{ color: 'var(--ink-low)', flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
