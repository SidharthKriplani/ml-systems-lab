import { getMLCodingContinueInfo } from '../../utils/mlCodingContinue.js';

// Shared "Continue" chip for ML Coding — Q1 leftover, ported from PAL's
// SqlLabContinueStrip.jsx pattern (single read rule, onOpen-only variation).
// See mlCodingContinue.js header for the honest typed-wins scope note: this
// resolves last-OPENED only, not typed-vs-opened (no draft signal exists here).
// `onOpen({ id, mode })` lets the caller restore the right mode + item.
export function MLCodingContinueStrip({ problems, exercises, onOpen }) {
  const { continueItem, mode } = getMLCodingContinueInfo(problems, exercises);
  if (!continueItem) return null;

  const label = mode === 'rounds'
    ? `Continue: ${continueItem.title} · ${continueItem.difficulty}`
    : `Continue: ${continueItem.title || continueItem.id} · drill`;

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '16px' }}>
      <button
        onClick={() => onOpen({ id: continueItem.id, mode })}
        style={{
          textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-sans)',
          padding: '0.4rem 0.75rem', borderRadius: '8px',
          background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)',
          color: 'var(--prime)', fontSize: '12px', fontWeight: 600,
        }}
      >
        {label}
      </button>
    </div>
  );
}
