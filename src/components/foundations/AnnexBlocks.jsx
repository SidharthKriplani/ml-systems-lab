// src/components/foundations/AnnexBlocks.jsx — shared renderer for the three
// annex view tiers (Academic / Cloud / 20:80), ported from GSL's AnnexBlocks
// (2026-07-23 skeleton port). Item shapes: string (paragraph) | { h } sub-heading |
// { eq } display-equation card | { list: [...] } bullet group |
// { table: { head, rows } } bordered table. Content arrives from each module's
// optional `deeperMath` / `cloudMap` / `interviewMin` data fields — a module
// without the field simply never shows the tab (that's the whole skeleton
// contract: UI ships now, content lands later without further UI work).
import React from 'react'

// Minimal inline markdown: **bold** and `code` only (matches what annex content
// uses; deliberately NOT the full renderMd — no $math$, no underscore italics).
function Inline({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i} style={{ color: 'var(--ink-hi, #fff)' }}>{p.slice(2, -2)}</strong>
        if (/^`[^`]+`$/.test(p)) return <code key={i} style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.85em', background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '4px', padding: '0 0.25rem' }}>{p.slice(1, -1)}</code>
        return <React.Fragment key={i}>{p}</React.Fragment>
      })}
    </>
  )
}

export function AnnexBlocks({ items, accent = '#e8a030' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {items.map((item, i) => {
        if (typeof item === 'string') {
          return <p key={i} style={{ fontSize: '0.92rem', lineHeight: 1.65, color: 'var(--ink-mid)', margin: 0 }}><Inline text={item} /></p>
        }
        if (item?.h) {
          return (
            <p key={i} style={{
              margin: 0, paddingTop: i === 0 ? 0 : '0.9rem',
              borderTop: i === 0 ? 'none' : '1px solid var(--rim)',
              fontSize: '0.68rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em', color: accent,
            }}>{item.h}</p>
          )
        }
        if (item?.eq) {
          return (
            <div key={i} style={{ border: '1px solid var(--rim)', borderRadius: '8px', background: 'var(--surface)', padding: '0.7rem 0.9rem', overflowX: 'auto' }}>
              <pre style={{ margin: 0, fontSize: '0.82rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--ink-hi, #fff)', lineHeight: 1.6, whiteSpace: 'pre' }}>{item.eq}</pre>
            </div>
          )
        }
        if (item?.table) {
          return (
            <div key={i} style={{ border: '1px solid var(--rim)', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--rim)', background: 'var(--surface)' }}>
                    {item.table.head.map((hc, j) => (
                      <th key={j} style={{ padding: '0.5rem 0.7rem', fontSize: '0.64rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent }}>{hc}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.table.rows.map((row, r) => (
                    <tr key={r} style={{ borderBottom: r < item.table.rows.length - 1 ? '1px solid var(--rim)' : 'none' }}>
                      {row.map((cell, c) => (
                        <td key={c} style={{ padding: '0.55rem 0.7rem', fontSize: '0.85rem', lineHeight: 1.55, verticalAlign: 'top', color: c === 0 ? 'var(--ink-low)' : 'var(--ink-mid)', fontWeight: c === 0 ? 600 : 400 }}>
                          <Inline text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (item?.list) {
          return (
            <ul key={i} style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {item.list.map((li, j) => (
                <li key={j} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--ink-mid)' }}>
                  <span style={{ color: accent, flexShrink: 0, marginTop: '0.1rem' }}>▸</span>
                  <span><Inline text={li} /></span>
                </li>
              ))}
            </ul>
          )
        }
        return null
      })}
    </div>
  )
}

// One-stop panel used by the 19 foundation tabs: picks the right data field,
// title, accent, and footer line for whichever annex view is active.
const ANNEX_CFG = {
  academic: { field: 'deeperMath', title: 'Academic — formal setup & derivations', accent: '#e8a030', footer: 'Derivation-grade tier — the Full view teaches the intuition this formalizes.' },
  cloud: { field: 'cloudMap', title: 'Cloud — the concept in AWS / GCP / Azure', accent: '#38bdf8', footer: "Service names churn; the primitives don't — anchor on the primitive, then speak whichever vendor the interviewer runs." },
  min: { field: 'interviewMin', title: 'Interview Minimum — the 20% that carries 80%', accent: '#34d399', footer: 'This is the floor, not the ceiling — the Full view and Interview QnA carry the rest.' },
}

export function AnnexPanel({ mode, module: mod }) {
  const cfg = ANNEX_CFG[mode]
  const items = cfg && mod ? mod[cfg.field] : null
  if (!items?.length) return null
  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <p style={{ margin: '0 0 0.9rem 0', fontSize: '0.7rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: cfg.accent }}>{cfg.title}</p>
      <div style={{ border: `1px solid ${cfg.accent}33`, background: `${cfg.accent}0d`, borderRadius: '10px', padding: '1.1rem 1.2rem' }}>
        <AnnexBlocks items={items} accent={cfg.accent} />
      </div>
      <p style={{ margin: '0.6rem 0 0 0', fontSize: '0.72rem', color: 'var(--ink-low)' }}>{cfg.footer}</p>
    </section>
  )
}
