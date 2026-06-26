import { useState, useMemo } from 'react';

function MetricBar({ label, value, formatted }) {
  const pct = Math.min(1, Math.max(0, isNaN(value) ? 0 : value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: 'var(--ink-mid)', fontSize: '12px' }}>{label}</span>
        <span style={{
          color: 'var(--prime)',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          fontWeight: 600,
        }}>{formatted}</span>
      </div>
      <div style={{
        height: '6px',
        background: 'var(--void)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${(pct * 100).toFixed(1)}%`,
          background: 'var(--prime)',
          borderRadius: '3px',
          transition: 'width 0.15s ease',
        }} />
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: 'var(--ink-mid)', fontSize: '12px' }}>{label}</span>
        <span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600 }}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%', accentColor: 'var(--prime)' }}
      />
    </div>
  );
}

export function ConfusionMatrixViz() {
  const [TP, setTP] = useState(40);
  const [FP, setFP] = useState(10);
  const [FN, setFN] = useState(15);
  const [TN, setTN] = useState(35);

  const total = TP + FP + FN + TN;

  const metrics = useMemo(() => {
    const fmt = (num, den) => den === 0 ? 'N/A' : (num / den).toFixed(3);
    const fmtPct = (num, den) => den === 0 ? 'N/A' : ((num / den) * 100).toFixed(1) + '%';
    const val = (num, den) => den === 0 ? NaN : num / den;

    return [
      {
        label: 'Accuracy',
        value: val(TP + TN, total),
        formatted: fmtPct(TP + TN, total),
      },
      {
        label: 'Precision',
        value: val(TP, TP + FP),
        formatted: fmt(TP, TP + FP),
      },
      {
        label: 'Recall (TPR)',
        value: val(TP, TP + FN),
        formatted: fmt(TP, TP + FN),
      },
      {
        label: 'Specificity',
        value: val(TN, TN + FP),
        formatted: fmt(TN, TN + FP),
      },
      {
        label: 'F1 Score',
        value: val(2 * TP, 2 * TP + FP + FN),
        formatted: fmt(2 * TP, 2 * TP + FP + FN),
      },
    ];
  }, [TP, FP, FN, TN, total]);

  const matrixCells = [
    {
      label: 'True Positive',
      abbr: 'TP',
      value: TP,
      tint: 'rgba(34,197,94,0.18)',
      border: 'rgba(34,197,94,0.45)',
      text: '#4ade80',
    },
    {
      label: 'False Positive',
      abbr: 'FP',
      value: FP,
      tint: 'rgba(239,68,68,0.18)',
      border: 'rgba(239,68,68,0.45)',
      text: '#f87171',
    },
    {
      label: 'False Negative',
      abbr: 'FN',
      value: FN,
      tint: 'rgba(239,68,68,0.18)',
      border: 'rgba(239,68,68,0.45)',
      text: '#f87171',
    },
    {
      label: 'True Negative',
      abbr: 'TN',
      value: TN,
      tint: 'rgba(34,197,94,0.18)',
      border: 'rgba(34,197,94,0.45)',
      text: '#4ade80',
    },
  ];

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '480px',
    }}>
      <h3 style={{ color: 'var(--ink-hi)', margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>
        Confusion Matrix Builder
      </h3>

      {/* Matrix header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', marginBottom: '4px', gap: '4px' }}>
        <div />
        <div style={{ color: 'var(--ink-low)', fontSize: '11px', textAlign: 'center', paddingBottom: '4px' }}>
          Predicted Positive
        </div>
        <div style={{ color: 'var(--ink-low)', fontSize: '11px', textAlign: 'center', paddingBottom: '4px' }}>
          Predicted Negative
        </div>
      </div>

      {/* Matrix rows */}
      {[['Actual Positive', 0, 1], ['Actual Negative', 2, 3]].map(([rowLabel, idxA, idxB]) => {
        const cellA = matrixCells[idxA];
        const cellB = matrixCells[idxB];
        return (
          <div key={rowLabel} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: '4px', marginBottom: '4px' }}>
            <div style={{
              color: 'var(--ink-low)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '8px',
            }}>
              {rowLabel}
            </div>
            {[cellA, cellB].map(cell => (
              <div key={cell.abbr} style={{
                background: cell.tint,
                border: `1px solid ${cell.border}`,
                borderRadius: '8px',
                padding: '14px 10px',
                textAlign: 'center',
              }}>
                <div style={{ color: cell.text, fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>
                  {cell.label}
                </div>
                <div style={{
                  color: 'var(--ink-hi)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '28px',
                  fontWeight: 700,
                  lineHeight: 1,
                }}>
                  {cell.value}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div style={{ color: 'var(--ink-low)', fontSize: '11px', textAlign: 'center', marginTop: '4px', marginBottom: '20px' }}>
        Total: {total}
      </div>

      {/* Sliders */}
      <div style={{
        background: 'var(--depth)',
        border: '1px solid var(--rim)',
        borderRadius: '8px',
        padding: '16px',
        display: 'grid',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <Slider label="True Positive (TP)" value={TP} onChange={setTP} />
        <Slider label="False Positive (FP)" value={FP} onChange={setFP} />
        <Slider label="False Negative (FN)" value={FN} onChange={setFN} />
        <Slider label="True Negative (TN)" value={TN} onChange={setTN} />
      </div>

      {/* Metrics */}
      <div style={{
        background: 'var(--depth)',
        border: '1px solid var(--rim)',
        borderRadius: '8px',
        padding: '16px',
        display: 'grid',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {metrics.map(m => (
          <MetricBar key={m.label} label={m.label} value={m.value} formatted={m.formatted} />
        ))}
      </div>

      {/* Imbalance note */}
      <div style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: '8px',
        padding: '12px 14px',
        color: 'var(--ink-mid)',
        fontSize: '12px',
        lineHeight: '1.6',
      }}>
        {'Accuracy is misleading when classes are imbalanced — a model predicting all negative on a 95%/5% dataset gets 95% accuracy but 0 recall.'}
      </div>
    </div>
  );
}
