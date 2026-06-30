import React, { useState, useMemo, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

function entropy(probs) {
  let h = 0;
  for (const p of probs) {
    if (p > 0) h -= p * Math.log2(p);
  }
  return h;
}

function klDivergence(P, Q) {
  let kl = 0;
  for (let i = 0; i < P.length; i++) {
    if (P[i] > 0 && Q[i] === 0) return Infinity;
    if (P[i] > 0) kl += P[i] * Math.log2(P[i] / Q[i]);
  }
  return kl;
}

function normalizeDist(vals) {
  // vals is [p1, p2, p3] for the first three; p4 = 1 - sum, clamped to >= 0
  const s = vals[0] + vals[1] + vals[2];
  const p4 = Math.max(0, 1 - s);
  const total = vals[0] + vals[1] + vals[2] + p4;
  if (total === 0) return [0.25, 0.25, 0.25, 0.25];
  return [vals[0] / total, vals[1] / total, vals[2] / total, p4 / total];
}

// Clamp slider so sum of first 3 stays <= 1
function clampSlider(vals, idx, newVal) {
  const updated = [...vals];
  updated[idx] = newVal;
  const sum = updated[0] + updated[1] + updated[2];
  if (sum > 1) {
    // Scale back proportionally except for the one just changed
    const excess = sum - 1;
    const others = [0, 1, 2].filter(i => i !== idx);
    const otherSum = others.reduce((s, i) => s + updated[i], 0);
    if (otherSum > 0) {
      for (const i of others) {
        updated[i] = Math.max(0, updated[i] - excess * (updated[i] / otherSum));
      }
    }
  }
  return updated;
}

const LABELS = ['A', 'B', 'C', 'D'];
const MAX_ENTROPY_4 = Math.log2(4); // 2.0 bits

// Presets for entropy mode
const ENTROPY_PRESETS = {
  uniform: { vals: [0.25, 0.25, 0.25], label: 'Uniform (max entropy)' },
  peaked:  { vals: [0.70, 0.10, 0.10], label: 'Peaked (one outcome dominates)' },
  certain: { vals: [1.00, 0.00, 0.00], label: 'Certain (one outcome = 1)' },
};

function BarChart({ probs, colors, maxH = 100 }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: `${maxH}px` }}>
      {probs.map((p, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono, monospace)', color: colors[i], marginBottom: '2px' }}>
            {p.toFixed(2)}
          </div>
          <div style={{
            width: '100%',
            height: `${p * (maxH - 20)}px`,
            background: colors[i],
            borderRadius: '3px 3px 0 0',
            minHeight: p > 0 ? '2px' : '0px',
            transition: 'height 0.15s',
          }} />
          <div style={{ fontSize: '11px', color: 'var(--ink-mid, #888)', marginTop: '4px', fontFamily: 'var(--font-mono, monospace)' }}>
            {LABELS[i]}
          </div>
        </div>
      ))}
    </div>
  );
}

function DistSliders({ vals, onChange, label, color }) {
  const dist = normalizeDist(vals);
  const p4 = Math.max(0, 1 - vals[0] - vals[1] - vals[2]);

  return (
    <div>
      {label && (
        <div style={{ fontSize: '11px', color, fontFamily: 'var(--font-mono, monospace)', marginBottom: '6px', fontWeight: 600 }}>
          {label}
        </div>
      )}
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-mid, #888)', fontFamily: 'var(--font-mono, monospace)', minWidth: '16px' }}>
            {LABELS[i]}:
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={vals[i]}
            onChange={e => {
              const newVals = clampSlider(vals, i, Number(e.target.value));
              onChange(newVals);
            }}
            style={{ flex: 1, accentColor: color }}
          />
          <span style={{ fontSize: '11px', color, fontFamily: 'var(--font-mono, monospace)', minWidth: '36px', textAlign: 'right' }}>
            {dist[i].toFixed(2)}
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-mid, #888)', fontFamily: 'var(--font-mono, monospace)', minWidth: '16px' }}>D:</span>
        <div style={{ flex: 1, height: '4px', background: 'var(--rim, #2a2a2a)', borderRadius: '2px', position: 'relative' }}>
          <div style={{ width: `${p4 * 100}%`, height: '100%', background: color, borderRadius: '2px', opacity: 0.5 }} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', minWidth: '36px', textAlign: 'right' }}>
          {dist[3].toFixed(2)}
        </span>
      </div>
      <div style={{ fontSize: '10px', color: 'var(--ink-ghost, #3a3a3a)', fontFamily: 'var(--font-mono, monospace)', marginTop: '4px' }}>
        D = 1 - A - B - C, clamped to 0
      </div>
    </div>
  );
}

function EntropyMode() {
  const [vals, setVals] = useState([0.25, 0.25, 0.25]);
  const dist = normalizeDist(vals);
  const H = entropy(dist);
  const pctOfMax = (H / MAX_ENTROPY_4) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Presets */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {Object.entries(ENTROPY_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => setVals(preset.vals)}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              border: '1px solid var(--rim, #2a2a2a)',
              background: 'var(--depth, #111)',
              color: 'var(--ink-mid, #888)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              cursor: 'pointer',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Sliders */}
      <DistSliders vals={vals} onChange={setVals} color="var(--prime, #F0A500)" />

      {/* Bar chart */}
      <div style={{
        background: 'var(--depth, #111)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '14px',
      }}>
        <BarChart probs={dist} colors={['var(--prime, #F0A500)', 'var(--prime, #F0A500)', 'var(--prime, #F0A500)', 'var(--prime, #F0A500)']} maxH={110} />
      </div>

      {/* Entropy display */}
      <div style={{
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)' }}>
            H(P) =
          </span>
          <span style={{ fontSize: '26px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--prime, #F0A500)' }}>
            {H.toFixed(4)}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--ink-mid, #888)' }}>bits</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--ink-mid, #888)', fontFamily: 'var(--font-mono, monospace)' }}>
          <span>Max (uniform): log2(4) = 2.0 bits</span>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '4px' }}>
            {`${pctOfMax.toFixed(1)}% of max entropy`}
          </div>
          <div style={{ height: '8px', background: 'var(--depth, #111)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${pctOfMax}%`,
              height: '100%',
              background: 'var(--prime, #F0A500)',
              borderRadius: '4px',
              transition: 'width 0.15s',
            }} />
          </div>
        </div>
      </div>

      <p style={{
        margin: 0,
        fontSize: '12px',
        color: 'var(--ink-ghost, #3a3a3a)',
        lineHeight: '1.6',
        borderTop: '1px solid var(--rim, #2a2a2a)',
        paddingTop: '10px',
      }}>
        {`Entropy is maximized when all outcomes are equally likely — maximum uncertainty. A coin flip has 1 bit; a fair die has log2(6) ≈ 2.58 bits. When one outcome is certain, H = 0.`}
      </p>
    </div>
  );
}

function KLMode() {
  const [pVals, setPVals] = useState([0.25, 0.25, 0.25]);
  const [qVals, setQVals] = useState([0.25, 0.25, 0.25]);

  const P = normalizeDist(pVals);
  const Q = normalizeDist(qVals);

  const klPQ = useMemo(() => klDivergence(P, Q), [P, Q]);
  const klQP = useMemo(() => klDivergence(Q, P), [P, Q]);

  const isInfPQ = !isFinite(klPQ);
  const isInfQP = !isFinite(klQP);

  const fmtKL = (v) => {
    if (!isFinite(v)) return '∞ (Q=0 where P>0)';
    return v.toFixed(4) + ' bits';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Two distribution sliders side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{
          background: 'var(--depth, #111)',
          border: '1px solid var(--rim, #2a2a2a)',
          borderRadius: '8px',
          padding: '12px',
        }}>
          <DistSliders vals={pVals} onChange={setPVals} label="P distribution" color="var(--prime, #F0A500)" />
        </div>
        <div style={{
          background: 'var(--depth, #111)',
          border: '1px solid var(--rim, #2a2a2a)',
          borderRadius: '8px',
          padding: '12px',
        }}>
          <DistSliders vals={qVals} onChange={setQVals} label="Q distribution" color="#60a5fa" />
        </div>
      </div>

      {/* Side-by-side bar chart */}
      <div style={{
        background: 'var(--depth, #111)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '14px',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', marginBottom: '8px' }}>
          P (amber) vs Q (blue)
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '100px' }}>
          {P.map((p, i) => {
            const q = Q[i];
            const maxH = 80;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '10px',
                    height: `${p * maxH}px`,
                    background: 'var(--prime, #F0A500)',
                    borderRadius: '2px 2px 0 0',
                    minHeight: p > 0 ? '2px' : '0px',
                  }} />
                  <div style={{
                    width: '10px',
                    height: `${q * maxH}px`,
                    background: '#60a5fa',
                    borderRadius: '2px 2px 0 0',
                    minHeight: q > 0 ? '2px' : '0px',
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-mid, #888)', marginTop: '4px', fontFamily: 'var(--font-mono, monospace)' }}>
                  {LABELS[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KL values */}
      <div style={{
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '8px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', minWidth: '80px' }}>KL(P||Q) =</span>
          <span style={{
            fontSize: '18px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            color: isInfPQ ? '#ef4444' : 'var(--prime, #F0A500)',
          }}>
            {fmtKL(klPQ)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)', minWidth: '80px' }}>KL(Q||P) =</span>
          <span style={{
            fontSize: '18px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            color: isInfQP ? '#ef4444' : '#60a5fa',
          }}>
            {fmtKL(klQP)}
          </span>
        </div>
        {isFinite(klPQ) && isFinite(klQP) && (
          <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--ink-mid, #888)' }}>
            {Math.abs(klPQ - klQP) < 1e-10
              ? `KL(P||Q) = KL(Q||P) — distributions are equal`
              : `Difference: ${Math.abs(klPQ - klQP).toFixed(4)} bits — asymmetry confirmed`}
          </div>
        )}
        <div style={{ fontSize: '12px', color: 'var(--ink-mid, #888)', lineHeight: '1.5' }}>
          KL divergence measures how different Q is from P, in bits. It is NOT symmetric.
        </div>
      </div>

      <p style={{
        margin: 0,
        fontSize: '12px',
        color: 'var(--ink-ghost, #3a3a3a)',
        lineHeight: '1.6',
        borderTop: '1px solid var(--rim, #2a2a2a)',
        paddingTop: '10px',
      }}>
        {`KL(P||Q) = 0 only when P = Q everywhere. KL(P||Q) ≠ KL(Q||P) — it is not a true distance metric. Setting Q(i)=0 where P(i)>0 gives infinite divergence (Q cannot explain what P assigns nonzero probability).`}
      </p>
    </div>
  );
}

export const InformationTheoryViz = forwardRef(function InformationTheoryViz(props, ref) {
  const [tab, setTab] = useState('entropy');
  const animRef = useRef(null);

  const play = useCallback(() => {
    if (animRef.current) return
    animRef.current = setInterval(() => {
      setTab(t => t === 'entropy' ? 'kl' : 'entropy')
    }, 1500)
  }, [])

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
  }, [])

  const reset = useCallback(() => {
    pause()
    setTab('entropy')
  }, [pause])

  const step = useCallback(() => {
    pause()
    setTab(t => t === 'entropy' ? 'kl' : 'entropy')
  }, [pause])

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step])

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { key: 'entropy', label: 'Entropy' },
          { key: 'kl', label: 'KL Divergence' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '5px 18px',
              borderRadius: '6px',
              border: '1px solid var(--rim, #2a2a2a)',
              background: tab === key ? 'var(--prime, #F0A500)' : 'var(--depth, #111)',
              color: tab === key ? '#000' : 'var(--ink-mid, #888)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'entropy' ? <EntropyMode /> : <KLMode />}
    </div>
  );
})
