import { useState } from 'react';

const TOKENS = ['The', 'cat', 'sat', 'on', 'mat'];

const WEIGHTS = {
  encoder: [
    [0.40, 0.25, 0.10, 0.15, 0.10],
    [0.30, 0.45, 0.10, 0.08, 0.07],
    [0.10, 0.20, 0.40, 0.15, 0.15],
    [0.10, 0.10, 0.30, 0.35, 0.15],
    [0.15, 0.10, 0.15, 0.20, 0.40],
  ],
  decoder: [
    [1.00, 0.00, 0.00, 0.00, 0.00],
    [0.40, 0.60, 0.00, 0.00, 0.00],
    [0.15, 0.30, 0.55, 0.00, 0.00],
    [0.10, 0.15, 0.35, 0.40, 0.00],
    [0.10, 0.15, 0.20, 0.20, 0.35],
  ],
};

export function AttentionViz() {
  const [mode, setMode] = useState('encoder');
  const [selectedRow, setSelectedRow] = useState(0);

  const weights = WEIGHTS[mode];
  const selectedWeights = weights[selectedRow];

  const cellBg = (w) => {
    if (w === 0) return 'transparent';
    return `rgba(245, 158, 11, ${w * 0.85 + 0.05})`;
  };

  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
      color: 'var(--ink-hi)',
      padding: '1.5rem',
      background: 'var(--surface)',
      borderRadius: '0.75rem',
      border: '1px solid var(--rim)',
      maxWidth: '560px',
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>
        Attention Heatmap
      </h3>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { key: 'encoder', label: 'Encoder (BERT)' },
          { key: 'decoder', label: 'Decoder (GPT)' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '0.4rem',
              border: `1px solid ${mode === key ? 'var(--prime)' : 'var(--rim)'}`,
              background: mode === key ? 'var(--prime)' : 'var(--depth)',
              color: mode === key ? '#000' : 'var(--ink-mid)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: mode === key ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.3rem 0.5rem', color: 'var(--ink-low)', fontSize: '0.7rem', textAlign: 'right' }}>
                Q \ K
              </th>
              {TOKENS.map((t) => (
                <th
                  key={t}
                  style={{
                    padding: '0.3rem 0.5rem',
                    color: 'var(--ink-mid)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    textAlign: 'center',
                    minWidth: '52px',
                  }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOKENS.map((rowToken, i) => (
              <tr
                key={rowToken}
                onClick={() => setSelectedRow(i)}
                style={{ cursor: 'pointer' }}
              >
                <td
                  style={{
                    padding: '0.3rem 0.6rem',
                    color: selectedRow === i ? 'var(--prime)' : 'var(--ink-mid)',
                    fontSize: '0.78rem',
                    fontWeight: selectedRow === i ? 600 : 400,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {rowToken}
                </td>
                {weights[i].map((w, j) => (
                  <td
                    key={j}
                    title={`${rowToken} → ${TOKENS[j]}: ${w.toFixed(2)}`}
                    style={{
                      padding: '0',
                      width: '52px',
                      height: '44px',
                      textAlign: 'center',
                      background: cellBg(w),
                      border: selectedRow === i
                        ? '2px solid var(--prime)'
                        : '1px solid var(--rim)',
                      borderRadius: '3px',
                      fontSize: '0.72rem',
                      color: w > 0.4 ? '#000' : 'var(--ink-hi)',
                      fontFamily: 'var(--font-mono)',
                      transition: 'background 0.2s',
                    }}
                  >
                    {selectedRow === i ? w.toFixed(2) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar chart for selected row */}
      <div style={{ marginTop: '1.25rem' }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--ink-mid)',
          marginBottom: '0.5rem',
        }}>
          Attention from <span style={{ color: 'var(--prime)', fontWeight: 600 }}>
            {TOKENS[selectedRow]}
          </span> to each key token:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {TOKENS.map((t, j) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                width: '30px',
                textAlign: 'right',
                fontSize: '0.75rem',
                color: 'var(--ink-mid)',
                flexShrink: 0,
              }}>
                {t}
              </span>
              <div style={{
                flex: 1,
                height: '16px',
                background: 'var(--depth)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${selectedWeights[j] * 100}%`,
                  height: '100%',
                  background: 'var(--prime)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{
                width: '34px',
                fontSize: '0.72rem',
                color: 'var(--ink-low)',
                fontFamily: 'var(--font-mono)',
                flexShrink: 0,
              }}>
                {selectedWeights[j].toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <p style={{
        marginTop: '1.25rem',
        fontSize: '0.72rem',
        color: 'var(--ink-low)',
        lineHeight: 1.6,
        borderTop: '1px solid var(--rim)',
        paddingTop: '0.75rem',
      }}>
        {`Encoder: each token sees all others (BERT, classification). Decoder: each token only sees its past (GPT, generation). Causal masking makes the upper triangle −∞ before softmax → 0 after.`}
      </p>
    </div>
  );
}
