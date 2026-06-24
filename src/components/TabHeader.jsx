// TabHeader.jsx — shared page-title header (Audit #033 DRY, 2026-06-24).
// Was an identical 200-char inline <h1> gradient style duplicated across 17 tabs.
// `style` prop merges over the canonical (used for per-tab margin variants).
export default function TabHeader({ title, style }) {
  return (
    <h1 style={{
      fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900,
      letterSpacing: '-0.05em', margin: 0,
      background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      ...style,
    }}>
      {title}
    </h1>
  )
}
