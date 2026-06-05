// ── HowToStrip ────────────────────────────────────────────────────────────────
// Always-visible entry context for every practice tab.
// Sets the cognitive frame before the user's first choice.
// Pattern from GSL: skill name + 2–3 numbered steps. Never more than 3.
//
// Props:
//   skill   string  — what you're building, e.g. "Production incident diagnosis"
//   steps   string[] — 2–3 steps, each a short imperative phrase

export default function HowToStrip({ skill, steps }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '16px',
      padding: '12px 16px',
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderLeft: '3px solid var(--prime)',
      borderRadius: '8px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '9px',
          color: 'var(--prime)', textTransform: 'uppercase',
          letterSpacing: '0.12em', marginBottom: '3px',
        }}>
          What you're building
        </div>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: '13px',
          fontWeight: 700, color: 'var(--ink-hi)',
        }}>
          {skill}
        </div>
      </div>

      <div style={{ width: '1px', background: 'var(--rim)', alignSelf: 'stretch', flexShrink: 0, margin: '2px 0' }} />

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'rgba(240,165,0,0.15)',
              border: '1px solid rgba(240,165,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '9px',
              fontWeight: 700, color: 'var(--prime)', flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <span style={{
              fontFamily: 'var(--font-sans)', fontSize: '12px',
              color: 'var(--ink-low)', whiteSpace: 'nowrap',
            }}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
