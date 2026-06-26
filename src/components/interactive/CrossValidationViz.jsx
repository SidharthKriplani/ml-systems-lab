import { useState, useMemo } from 'react';

const N_SAMPLES = 30;

// Hardcoded simulated validation accuracies per k value
const FOLD_ACCURACIES = {
  3: [0.82, 0.79, 0.85],
  5: [0.82, 0.79, 0.85, 0.81, 0.83],
  10: [0.82, 0.79, 0.85, 0.81, 0.83, 0.80, 0.84, 0.78, 0.86, 0.82],
};

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function getFoldIndices(k, foldIdx) {
  // Returns which sample indices are in the validation set for foldIdx (0-based)
  const foldSize = Math.floor(N_SAMPLES / k);
  const remainder = N_SAMPLES % k;
  let start = 0;
  for (let f = 0; f < foldIdx; f++) {
    start += foldSize + (f < remainder ? 1 : 0);
  }
  const size = foldSize + (foldIdx < remainder ? 1 : 0);
  const valSet = new Set();
  for (let i = start; i < start + size; i++) valSet.add(i);
  return valSet;
}

const K_INFO = {
  3:  { label: 'k=3',  note: 'Faster, higher variance per fold' },
  5:  { label: 'k=5',  note: 'Standard choice — good bias-variance tradeoff' },
  10: { label: 'k=10', note: 'Expensive but low-variance estimate' },
};

export function CrossValidationViz() {
  const [k, setK] = useState(5);
  const [foldIdx, setFoldIdx] = useState(0); // 0-based

  const valSet = useMemo(() => getFoldIndices(k, foldIdx), [k, foldIdx]);
  const accs = FOLD_ACCURACIES[k];
  const cvMean = mean(accs);
  const cvStd = std(accs);

  const nVal = valSet.size;
  const nTrain = N_SAMPLES - nVal;
  const trainFrac = nTrain / N_SAMPLES;
  const valFrac = nVal / N_SAMPLES;

  function changeK(newK) {
    setK(newK);
    setFoldIdx(0);
  }

  function prev() {
    setFoldIdx(f => (f - 1 + k) % k);
  }

  function next() {
    setFoldIdx(f => (f + 1) % k);
  }

  // Arrange 30 squares: 2 rows of 15
  const rows = [[...Array(15).keys()], [...Array(15).keys()].map(i => i + 15)];

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* k selector */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--ink-mid, #888)', fontFamily: 'var(--font-mono, monospace)' }}>
          k-folds:
        </span>
        {[3, 5, 10].map(kv => (
          <button
            key={kv}
            onClick={() => changeK(kv)}
            style={{
              padding: '4px 14px',
              borderRadius: '6px',
              border: '1px solid var(--rim, #2a2a2a)',
              background: k === kv ? 'var(--prime, #F0A500)' : 'var(--depth, #111)',
              color: k === kv ? '#000' : 'var(--ink-mid, #888)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {kv}
          </button>
        ))}
      </div>

      {/* Sample grid */}
      <div style={{
        background: 'var(--depth, #111)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: '4px' }}>
            {row.map(idx => {
              const isVal = valSet.has(idx);
              return (
                <div
                  key={idx}
                  title={`Sample ${idx + 1}${isVal ? ' — validation' : ' — training'}`}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    background: isVal ? '#ef4444' : 'var(--prime, #F0A500)',
                    opacity: isVal ? 1 : 0.7,
                    border: isVal ? '1px solid #ff6b6b' : '1px solid rgba(240,165,0,0.4)',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--prime, #F0A500)', opacity: 0.7 }} />
            <span style={{ fontSize: '11px', color: 'var(--ink-mid, #888)' }}>Training</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#ef4444' }} />
            <span style={{ fontSize: '11px', color: 'var(--ink-mid, #888)' }}>Validation</span>
          </div>
        </div>
      </div>

      {/* Fold navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={prev}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            border: '1px solid var(--rim, #2a2a2a)',
            background: 'var(--depth, #111)',
            color: 'var(--ink-mid, #888)',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {'<'}
        </button>
        <span style={{
          fontSize: '13px',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--ink-hi, #e5e5e5)',
          minWidth: '140px',
          textAlign: 'center',
        }}>
          {`Fold ${foldIdx + 1} of ${k}`}
        </span>
        <button
          onClick={next}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            border: '1px solid var(--rim, #2a2a2a)',
            background: 'var(--depth, #111)',
            color: 'var(--ink-mid, #888)',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {'>'}
        </button>
        <span style={{
          fontSize: '12px',
          color: 'var(--ink-low, #555)',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          {`train: ${nTrain}   val: ${nVal}`}
        </span>
      </div>

      {/* Train/val bar */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '4px' }}>
          Split ratio
        </div>
        <div style={{ display: 'flex', height: '14px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--rim, #2a2a2a)' }}>
          <div style={{
            width: `${trainFrac * 100}%`,
            background: 'var(--prime, #F0A500)',
            opacity: 0.7,
            transition: 'width 0.2s',
          }} />
          <div style={{
            width: `${valFrac * 100}%`,
            background: '#ef4444',
            transition: 'width 0.2s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginTop: '3px' }}>
          <span>Training {(trainFrac * 100).toFixed(0)}%</span>
          <span>Validation {(valFrac * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Per-fold accuracies */}
      <div style={{
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '12px 16px',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
          Validation accuracy per fold
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {accs.map((acc, fi) => (
            <div key={fi} style={{
              background: fi === foldIdx ? 'var(--prime, #F0A500)' : 'var(--depth, #111)',
              border: `1px solid ${fi === foldIdx ? 'var(--prime, #F0A500)' : 'var(--rim, #2a2a2a)'}`,
              borderRadius: '6px',
              padding: '6px 10px',
              textAlign: 'center',
              minWidth: '48px',
            }}>
              <div style={{ fontSize: '10px', color: fi === foldIdx ? '#000' : 'var(--ink-low, #555)', marginBottom: '2px' }}>
                {`Fold ${fi + 1}`}
              </div>
              <div style={{
                fontSize: '14px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                color: fi === foldIdx ? '#000' : 'var(--ink-hi, #e5e5e5)',
              }}>
                {(acc * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CV score */}
      <div style={{
        background: 'var(--depth, #111)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--ink-low, #555)', marginBottom: '3px' }}>Final CV score</div>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--prime, #F0A500)' }}>
            {`${(cvMean * 100).toFixed(1)}%`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: 'var(--ink-low, #555)', marginBottom: '3px' }}>Std dev</div>
          <div style={{ fontSize: '18px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--ink-hi, #e5e5e5)' }}>
            {`±${(cvStd * 100).toFixed(1)}%`}
          </div>
        </div>
        <div style={{ flex: 1, fontSize: '12px', color: 'var(--ink-mid, #888)', lineHeight: '1.5' }}>
          Each sample is used exactly once as validation. Unbiased estimate of generalization performance.
        </div>
      </div>

      {/* k comparison */}
      <div style={{
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '12px 16px',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
          Tradeoffs by k value
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[3, 5, 10].map(kv => (
            <div key={kv} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                background: kv === k ? 'var(--prime, #F0A500)' : 'var(--depth, #111)',
                color: kv === k ? '#000' : 'var(--ink-mid, #888)',
                border: '1px solid var(--rim, #2a2a2a)',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                minWidth: '32px',
                textAlign: 'center',
              }}>
                {kv}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--ink-mid, #888)' }}>
                {K_INFO[kv].note}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
