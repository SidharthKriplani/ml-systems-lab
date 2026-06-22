import { useState } from 'react'

const TIERS = {
  faithful: {
    label: 'Mathematically Faithful',
    short: '✓ Real',
    color: 'var(--mint)',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.30)',
    desc: 'Runs real computation — exact algorithm, live output. What you see is what ships.',
  },
  simplified: {
    label: 'Simplified',
    short: '~ Simplified',
    color: 'var(--prime)',
    bg: 'var(--prime-bg-light)',
    border: 'rgba(240,165,0,0.30)',
    desc: 'Correct concept, illustrative scale. Dimensionality or data is reduced for browser performance.',
  },
  conceptual: {
    label: 'Conceptual',
    short: '◈ Conceptual',
    color: 'var(--ink-low)',
    bg: 'rgba(255,255,255,0.06)',
    border: 'var(--rim)',
    desc: 'Judgment scenarios — builds the mental model. Not a runnable implementation.',
  },
}

export default function FidelityBadge({ tier }) {
  const [open, setOpen] = useState(false)
  const t = TIERS[tier] ?? TIERS.conceptual
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={`Fidelity: ${t.label}. Click for detail.`}
        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', background: t.bg, border: `1px solid ${t.border}`, color: t.color, fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', textTransform: 'uppercase' }}
      >
        {t.short}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '28px', left: 0, zIndex: 20, minWidth: '220px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '8px', padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.color, fontFamily: 'var(--font-sans)', marginBottom: '4px' }}>{t.label}</div>
          <div style={{ fontSize: '12px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>{t.desc}</div>
        </div>
      )}
    </div>
  )
}
