import React from 'react'

// Shared scaffold for BUILD project labs that are planned but not yet authored.
// Renders the intended archetype, the phase arc, and the judgment checkpoints so
// the page is a real blueprint (and a promise to the user), not a dead "TODO".
// To ship a lab: build the Pyodide notebook and swap this out for the real tab.

export function ProjectLabSkeleton({ spec }) {
  const {
    kicker, title, subtitle, why, archetype,
    phases = [], checkpoints = [], datasetNote,
  } = spec

  const s = {
    wrap: { maxWidth: 860, margin: '0 auto', padding: '8px 4px 48px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans, sans-serif)' },
    badge: { display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--prime)', border: '1px solid var(--rim)', borderRadius: 999, padding: '3px 10px', marginBottom: 14 },
    wip: { display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--amber, #d97706)', border: '1px solid var(--amber, #d97706)', borderRadius: 6, padding: '3px 8px', marginLeft: 8 },
    h1: { fontSize: 26, fontWeight: 800, margin: '0 0 6px', lineHeight: 1.15 },
    sub: { fontSize: 15, color: 'var(--ink-mid)', margin: '0 0 20px', lineHeight: 1.5 },
    card: { background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 },
    sectionLabel: { fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--ink-low)', margin: '0 0 10px' },
    why: { fontSize: 14, color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 },
    phaseRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--rim)' },
    phaseNum: { flex: '0 0 26px', height: 26, borderRadius: 6, background: 'var(--depth)', border: '1px solid var(--rim)', color: 'var(--prime)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    phaseName: { fontWeight: 600, fontSize: 14, color: 'var(--ink-hi)' },
    phaseDesc: { fontSize: 13, color: 'var(--ink-mid)', lineHeight: 1.5, marginTop: 2 },
    check: { display: 'flex', gap: 10, padding: '8px 0', fontSize: 13.5, color: 'var(--ink-mid)', lineHeight: 1.5 },
    checkMark: { color: 'var(--prime)', flex: '0 0 auto', fontWeight: 700 },
    note: { fontSize: 12.5, color: 'var(--ink-low)', lineHeight: 1.6, marginTop: 6 },
    archetype: { fontSize: 12.5, color: 'var(--ink-low)', marginBottom: 18 },
  }

  return (
    <div style={s.wrap}>
      <div>
        <span style={s.badge}>{kicker}</span>
        <span style={s.wip}>In development</span>
      </div>
      <h1 style={s.h1}>{title}</h1>
      <p style={s.sub}>{subtitle}</p>
      <div style={s.archetype}><strong style={{ color: 'var(--ink-mid)' }}>Archetype:</strong> {archetype}</div>

      <div style={s.card}>
        <p style={s.sectionLabel}>Why this project exists</p>
        <p style={s.why}>{why}</p>
      </div>

      <div style={s.card}>
        <p style={s.sectionLabel}>Planned phase arc</p>
        {phases.map((p, i) => (
          <div key={i} style={{ ...s.phaseRow, ...(i === phases.length - 1 ? { borderBottom: 'none' } : {}) }}>
            <div style={s.phaseNum}>{i + 1}</div>
            <div>
              <div style={s.phaseName}>{p.name}</div>
              <div style={s.phaseDesc}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <p style={s.sectionLabel}>Judgment checkpoints</p>
        {checkpoints.map((c, i) => (
          <div key={i} style={s.check}>
            <span style={s.checkMark}>▹</span>
            <span>{c}</span>
          </div>
        ))}
        {datasetNote && <p style={s.note}>{datasetNote}</p>}
      </div>
    </div>
  )
}

export default ProjectLabSkeleton
