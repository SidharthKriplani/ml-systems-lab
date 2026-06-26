import { useState } from 'react';

const PRESETS = [
  {
    label: `Disease test (1% prevalence)`,
    pH: 0.01,
    pEH: 0.99,
    pEnotH: 0.05,
  },
  {
    label: `Spam filter (20% spam)`,
    pH: 0.20,
    pEH: 0.95,
    pEnotH: 0.10,
  },
  {
    label: `Rare event (0.1%)`,
    pH: 0.001,
    pEH: 0.99,
    pEnotH: 0.05,
  },
];

function fmt(n, digits = 4) {
  return n.toFixed(digits);
}

function fmtPct(n) {
  if (n < 0.001) return `${(n * 100).toFixed(3)}%`;
  if (n < 0.01) return `${(n * 100).toFixed(2)}%`;
  return `${(n * 100).toFixed(1)}%`;
}

export function BayesCalculator() {
  const [pH, setPH] = useState(0.01);
  const [pEH, setPEH] = useState(0.99);
  const [pEnotH, setPEnotH] = useState(0.05);

  const pNotH = 1 - pH;
  const pE = pEH * pH + pEnotH * pNotH;
  const pHE = (pEH * pH) / pE;

  const posterior = pHE;
  const prior = pH;

  const styles = {
    root: {
      fontFamily: `var(--font-sans, sans-serif)`,
      background: `var(--surface, #1a1a1a)`,
      border: `1px solid var(--rim, #333)`,
      borderRadius: 10,
      padding: '20px',
      maxWidth: 660,
      color: `var(--ink-hi, #eee)`,
    },
    title: {
      margin: '0 0 4px 0',
      fontSize: 17,
      fontWeight: 700,
      color: `var(--ink-hi, #eee)`,
    },
    subtitle: {
      margin: '0 0 18px 0',
      fontSize: 13,
      color: `var(--ink-low, #888)`,
    },
    sliderSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      marginBottom: 20,
    },
    sliderRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    sliderLabel: {
      fontSize: 13,
      color: `var(--ink-mid, #aaa)`,
      width: 220,
      flexShrink: 0,
    },
    mono: {
      fontFamily: `var(--font-mono, monospace)`,
      color: `var(--prime, #F0A500)`,
      fontSize: 13,
      minWidth: 60,
      textAlign: 'right',
    },
    slider: {
      accentColor: `var(--prime, #F0A500)`,
      flex: 1,
      minWidth: 120,
    },
    formulaBlock: {
      background: `var(--depth, #111)`,
      border: `1px solid var(--rim, #333)`,
      borderRadius: 8,
      padding: '14px 16px',
      marginBottom: 18,
      fontFamily: `var(--font-mono, monospace)`,
      fontSize: 12.5,
      lineHeight: 1.9,
    },
    formulaTitle: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: `var(--ink-low, #888)`,
      marginBottom: 8,
      fontFamily: `var(--font-sans, sans-serif)`,
    },
    fLine: {
      color: `var(--ink-mid, #aaa)`,
    },
    fVal: {
      color: `var(--prime, #F0A500)`,
    },
    fResult: {
      color: '#4ade80',
      fontWeight: 700,
    },
    divider: {
      border: 'none',
      borderTop: `1px solid var(--rim, #333)`,
      margin: '6px 0',
    },
    insightBox: {
      background: `rgba(240, 165, 0, 0.07)`,
      border: `1px solid rgba(240, 165, 0, 0.25)`,
      borderRadius: 6,
      padding: '10px 14px',
      fontSize: 12.5,
      color: `var(--ink-mid, #aaa)`,
      marginTop: 4,
      marginBottom: 18,
      lineHeight: 1.6,
    },
    barSection: {
      marginBottom: 20,
    },
    barLabel: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: `var(--ink-low, #888)`,
      marginBottom: 10,
    },
    barContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    },
    barRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    barRowLabel: {
      fontSize: 12,
      color: `var(--ink-mid, #aaa)`,
      width: 160,
      flexShrink: 0,
    },
    barTrack: {
      flex: 1,
      height: 20,
      background: `var(--depth, #111)`,
      border: `1px solid var(--rim, #333)`,
      borderRadius: 4,
      overflow: 'hidden',
      position: 'relative',
    },
    barPct: {
      fontSize: 12,
      fontFamily: `var(--font-mono, monospace)`,
      color: `var(--ink-mid, #aaa)`,
      width: 60,
      textAlign: 'right',
      flexShrink: 0,
    },
    presetsSection: {
      marginTop: 4,
    },
    presetsLabel: {
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: `var(--ink-low, #888)`,
      marginBottom: 8,
    },
    presetsRow: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
    },
    presetBtn: {
      padding: '6px 12px',
      borderRadius: 6,
      border: `1px solid var(--rim-hi, #555)`,
      background: `var(--depth, #111)`,
      color: `var(--ink-mid, #aaa)`,
      cursor: 'pointer',
      fontSize: 12,
      fontFamily: `var(--font-sans, sans-serif)`,
      transition: 'border-color 0.15s',
    },
  };

  const barFill = (value, color) => ({
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${Math.min(value * 100, 100)}%`,
    background: color,
    borderRadius: 3,
    transition: 'width 0.25s ease',
    minWidth: value > 0 ? 2 : 0,
  });

  return (
    <div style={styles.root}>
      <p style={styles.title}>{`Bayes' Theorem Calculator`}</p>
      <p style={styles.subtitle}>
        {`See how prior probability, sensitivity, and false positive rate combine to determine P(H|E).`}
      </p>

      {/* Sliders */}
      <div style={styles.sliderSection}>
        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>{`Prior P(H)`}</span>
          <input
            type="range"
            min={0.001}
            max={0.5}
            step={0.001}
            value={pH}
            onChange={(e) => setPH(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.mono}>{fmt(pH, 3)}</span>
        </div>
        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>{`Sensitivity P(E|H)`}</span>
          <input
            type="range"
            min={0.5}
            max={0.999}
            step={0.001}
            value={pEH}
            onChange={(e) => setPEH(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.mono}>{fmt(pEH, 3)}</span>
        </div>
        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>{`False positive rate P(E|¬H)`}</span>
          <input
            type="range"
            min={0.001}
            max={0.5}
            step={0.001}
            value={pEnotH}
            onChange={(e) => setPEnotH(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.mono}>{fmt(pEnotH, 3)}</span>
        </div>
      </div>

      {/* Formula expansion */}
      <div style={styles.formulaBlock}>
        <div style={styles.formulaTitle}>Bayes formula — expanded with your numbers</div>

        <div style={styles.fLine}>
          {`P(H|E)  =  P(E|H) · P(H)  /  P(E)`}
        </div>
        <hr style={styles.divider} />
        <div style={styles.fLine}>
          {`P(E)    =  P(E|H)·P(H)  +  P(E|¬H)·P(¬H)`}
        </div>
        <div>
          <span style={styles.fLine}>{`        =  `}</span>
          <span style={styles.fVal}>{fmt(pEH, 3)}</span>
          <span style={styles.fLine}>{` × `}</span>
          <span style={styles.fVal}>{fmt(pH, 3)}</span>
          <span style={styles.fLine}>{`  +  `}</span>
          <span style={styles.fVal}>{fmt(pEnotH, 3)}</span>
          <span style={styles.fLine}>{` × `}</span>
          <span style={styles.fVal}>{fmt(pNotH, 3)}</span>
        </div>
        <div>
          <span style={styles.fLine}>{`        =  `}</span>
          <span style={styles.fVal}>{fmt(pEH * pH, 5)}</span>
          <span style={styles.fLine}>{`  +  `}</span>
          <span style={styles.fVal}>{fmt(pEnotH * pNotH, 5)}</span>
          <span style={styles.fLine}>{`  =  `}</span>
          <span style={styles.fVal}>{fmt(pE, 5)}</span>
        </div>
        <hr style={styles.divider} />
        <div>
          <span style={styles.fLine}>{`P(H|E)  =  `}</span>
          <span style={styles.fVal}>{fmt(pEH, 3)}</span>
          <span style={styles.fLine}>{` × `}</span>
          <span style={styles.fVal}>{fmt(pH, 3)}</span>
          <span style={styles.fLine}>{`  /  `}</span>
          <span style={styles.fVal}>{fmt(pE, 5)}</span>
          <span style={styles.fLine}>{`  =  `}</span>
          <span style={styles.fResult}>{fmt(pHE, 4)}</span>
          <span style={styles.fLine}>{`  (${fmtPct(pHE)})`}</span>
        </div>
      </div>

      {/* Base rate neglect insight */}
      <div style={styles.insightBox}>
        <strong style={{ color: `var(--prime, #F0A500)` }}>Base rate neglect: </strong>
        {`Even with ${fmtPct(pEH)} sensitivity and only ${fmtPct(pEnotH)} false positive rate, `}
        {`when prior is ${fmtPct(prior)}, the posterior is only `}
        <strong style={{ color: '#4ade80' }}>{fmtPct(posterior)}</strong>
        {`. Most positive results are still false positives because the condition is rare.`}
      </div>

      {/* Visual bars */}
      <div style={styles.barSection}>
        <div style={styles.barLabel}>Probability comparison</div>
        <div style={styles.barContainer}>
          <div style={styles.barRow}>
            <span style={styles.barRowLabel}>{`Prior P(H)`}</span>
            <div style={styles.barTrack}>
              <div style={barFill(prior, '#5b8fc7')} />
            </div>
            <span style={styles.barPct}>{fmtPct(prior)}</span>
          </div>
          <div style={styles.barRow}>
            <span style={styles.barRowLabel}>{`Posterior P(H|E)`}</span>
            <div style={styles.barTrack}>
              <div style={barFill(posterior, 'var(--prime, #F0A500)')} />
            </div>
            <span style={{ ...styles.barPct, color: `var(--prime, #F0A500)` }}>{fmtPct(posterior)}</span>
          </div>
          <div style={styles.barRow}>
            <span style={styles.barRowLabel}>{`P(E) — evidence base`}</span>
            <div style={styles.barTrack}>
              <div style={barFill(pE, '#9b7ec8')} />
            </div>
            <span style={styles.barPct}>{fmtPct(pE)}</span>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div style={styles.presetsSection}>
        <div style={styles.presetsLabel}>Presets</div>
        <div style={styles.presetsRow}>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              style={styles.presetBtn}
              onClick={() => {
                setPH(p.pH);
                setPEH(p.pEH);
                setPEnotH(p.pEnotH);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
