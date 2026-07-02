import { CompanyLogo } from './CompanyLogo.jsx';

// A compact row of company logos for "brand borrowing" attribution.
// Shows the first `max` companies as spaced CompanyLogos, then a muted
// "+N more" chip listing the remainder in its title attr on hover.
//
// Props:
//   companies — ordered array of canonical company names
//   max       — how many logos to show before collapsing (default 3)
//   size      — square px size of each logo (default 16)
export function CompanyLogoRow({ companies, max = 3, size = 16 }) {
  const list = Array.isArray(companies) ? companies.filter(Boolean) : [];
  if (list.length === 0) return null;

  const shown = list.slice(0, max);
  const rest = list.slice(max);

  return (
    <span
      title={list.join(' · ')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        verticalAlign: 'middle',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        {shown.map((c, i) => (
          <CompanyLogo key={c + i} company={c} size={size} />
        ))}
      </span>
      {rest.length > 0 && (
        <span
          title={rest.join(' · ')}
          style={{
            fontSize: Math.max(9, Math.round(size * 0.62)) + 'px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-ghost)',
            background: 'var(--depth)',
            border: '1px solid var(--rim)',
            borderRadius: '999px',
            padding: '1px 6px', lineHeight: 1.4,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          +{rest.length} more
        </span>
      )}
    </span>
  );
}
