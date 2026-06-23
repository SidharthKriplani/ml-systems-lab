// BrandMark.jsx — canonical BreakLabs lockup (D-19, HQ/BRANDMARK-ROLLOUT.md).
// House rule: single quotes. Constant everywhere: seam red + wordmark colour + mono font.
// Per-lab (MSL): descriptor = 'ML Systems', accent = gold '#F0A500' (the lab track accent).
// Token mapping for MSL lives in index.css (--ink-hi / --ink-low / --surface / --rim / --font-mono).

const SEAM = '#FB5247';   // brand red — the fault-glyph (constant, do NOT change)

function Seam({ h = 28 }) {
  const w = Math.round(h * 0.32);
  return (
    <svg width={w} height={h} viewBox='0 0 11 34' aria-hidden='true' style={{ margin: '0 1px', flex: '0 0 auto' }}>
      <path d='M6 2 L3 11 L9 17 L3 23 L6 32' fill='none' stroke={SEAM} strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

// variant: 'full' (wordmark + descriptor) | 'wordmark' | 'monogram'
// stacked: in 'full', drop the descriptor onto a second line UNDER break⌇labs (good for narrow nav)
// accent: the lab's track accent hex (MSL = gold #F0A500)
export function BrandMark({ variant = 'full', descriptor = '', accent = '#F0A500', size = 28, stacked = false }) {
  if (variant === 'monogram') {
    return (
      <span aria-label='BreakLabs' style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: Math.round(size * 0.24),
        background: 'var(--surface, #252525)', border: '1px solid var(--rim, #333333)' }}>
        <Seam h={Math.round(size * 0.62)} />
      </span>
    );
  }

  const wordmark = (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)',
      fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ink-hi, #f4f4f4)', fontSize: size }}>
      break<Seam h={size} />labs
    </span>
  );

  // Stacked: break⌇labs on top, descriptor (accent) on the line below.
  if (variant === 'full' && descriptor && stacked) {
    return (
      <span aria-label={`BreakLabs ${descriptor}`}
        style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: Math.round(size * 0.18) }}>
        {wordmark}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: Math.max(8, Math.round(size * 0.56)),
          fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: accent }}>{descriptor}</span>
      </span>
    );
  }

  // Inline: break⌇labs · ML Systems
  return (
    <span aria-label={descriptor ? `BreakLabs ${descriptor}` : 'BreakLabs'}
      style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-mono)',
        fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ink-hi, #f4f4f4)', fontSize: size }}>
      break<Seam h={size} />labs
      {variant === 'full' && descriptor && (
        <>
          <span style={{ color: 'var(--ink-low, #b8b8b8)', margin: '0 0.4em' }}>·</span>
          <span style={{ color: accent }}>{descriptor}</span>
        </>
      )}
    </span>
  );
}

export default BrandMark;
