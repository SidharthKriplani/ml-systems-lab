import React, { useState, useMemo, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

const SCENARIOS = [
  { label: 'Healthy init', values: [-0.8, 0.3, 1.1, -0.4, 0.7, -1.2, 0.5, 0.2] },
  { label: 'Large activations', values: [8.5, -12.3, 6.1, -9.8, 11.2, -7.4, 4.6, -10.1] },
  { label: 'Covariate shift', values: [4.2, 5.1, 3.8, 6.0, 4.7, 5.5, 3.9, 5.8] },
];

const S = {
  root: { fontFamily: `var(--font-sans, sans-serif)`, color: `var(--ink-hi, #eee)`, maxWidth: 700 },
  title: { margin: '0 0 4px 0', fontSize: 17, fontWeight: 700, color: `var(--ink-hi, #eee)` },
  subtitle: { margin: '0 0 14px 0', fontSize: 13, color: `var(--ink-low, #888)`, fontFamily: `var(--font-mono, monospace)` },
  tabs: { display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' },
  tab: (active) => ({ padding: '6px 14px', borderRadius: 6, border: `1px solid ${active ? 'var(--prime, #F0A500)' : 'var(--rim, #555)'}`, background: active ? 'rgba(240,165,0,0.12)' : `var(--depth, #111)`, color: active ? `var(--prime, #F0A500)` : `var(--ink-mid, #aaa)`, cursor: 'pointer', fontSize: 13 }),
  panels: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  panel: { flex: '1 1 200px', background: `var(--depth, #111)`, border: `1px solid var(--rim, #333)`, borderRadius: 8, padding: '12px 14px' },
  panelTitle: { fontSize: 12, color: `var(--ink-low, #888)`, fontFamily: `var(--font-mono, monospace)`, marginBottom: 8 },
  plotWrap: { position: 'relative', height: 80, background: 'rgba(255,255,255,0.03)', borderRadius: 4 },
  statsRow: { marginTop: 14, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, fontFamily: `var(--font-mono, monospace)`, color: `var(--ink-mid, #aaa)` },
  controls: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' },
  sliderLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: `var(--ink-mid, #aaa)` },
  slider: { accentColor: `var(--prime, #F0A500)`, width: 110 },
  mono: { fontFamily: `var(--font-mono, monospace)`, color: `var(--prime, #F0A500)`, fontSize: 13 },
  btn: { padding: '6px 14px', borderRadius: 6, border: `1px solid var(--rim, #555)`, background: `var(--depth, #111)`, color: `var(--ink-hi, #eee)`, cursor: 'pointer', fontSize: 13 },
  btnActive: { padding: '6px 14px', borderRadius: 6, border: `1px solid var(--prime, #F0A500)`, background: 'rgba(240,165,0,0.12)', color: `var(--prime, #F0A500)`, cursor: 'pointer', fontSize: 13 },
  note: { marginTop: 12, padding: '10px 14px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 6, fontSize: 12, color: `var(--ink-mid, #aaa)`, lineHeight: 1.6 },
};

function DotPlot({ values, min, max, color, showMeanLine, showBand, meanVal, stdVal }) {
  const plotWidth = 300;
  const plotHeight = 80;
  const midY = plotHeight / 2;
  const dotR = 6;
  const padding = 16;
  const usableWidth = plotWidth - padding * 2;

  const toX = (v) => {
    const range = max - min;
    if (range === 0) return padding + usableWidth / 2;
    return padding + ((v - min) / range) * usableWidth;
  };

  const meanX = toX(meanVal);
  const bandLeft = toX(meanVal - stdVal);
  const bandRight = toX(meanVal + stdVal);
  const bandWidth = Math.max(0, bandRight - bandLeft);

  return (
    <div style={{ ...S.plotWrap, width: plotWidth }}>
      {/* axis line */}
      <div style={{
        position: 'absolute',
        left: padding,
        right: padding,
        top: midY,
        height: 1,
        background: 'rgba(255,255,255,0.15)',
      }} />

      {/* ±1σ band */}
      {showBand && bandWidth > 0 && (
        <div style={{
          position: 'absolute',
          left: Math.max(padding, bandLeft),
          top: midY - 20,
          width: Math.min(bandWidth, plotWidth - padding - Math.max(padding, bandLeft)),
          height: 40,
          background: `${color}22`,
          borderLeft: `1px dashed ${color}55`,
          borderRight: `1px dashed ${color}55`,
          pointerEvents: 'none',
        }} />
      )}

      {/* mean line */}
      {showMeanLine && meanX >= padding && meanX <= plotWidth - padding && (
        <div style={{
          position: 'absolute',
          left: meanX,
          top: midY - 24,
          width: 1,
          height: 48,
          borderLeft: `2px dashed ${color}cc`,
          pointerEvents: 'none',
        }} />
      )}

      {/* dots */}
      {values.map((v, i) => {
        const x = toX(v);
        if (x < padding - dotR || x > plotWidth - padding + dotR) return null;
        return (
          <div
            key={i}
            title={v.toFixed(3)}
            style={{
              position: 'absolute',
              left: x - dotR,
              top: midY - dotR,
              width: dotR * 2,
              height: dotR * 2,
              borderRadius: '50%',
              background: color,
              opacity: 0.85,
              boxShadow: `0 0 4px ${color}88`,
            }}
          />
        );
      })}

      {/* axis tick labels */}
      <div style={{
        position: 'absolute',
        left: padding,
        bottom: 2,
        fontSize: 9,
        color: 'rgba(255,255,255,0.3)',
        fontFamily: `var(--font-mono, monospace)`,
      }}>
        {min.toFixed(1)}
      </div>
      <div style={{
        position: 'absolute',
        right: padding,
        bottom: 2,
        fontSize: 9,
        color: 'rgba(255,255,255,0.3)',
        fontFamily: `var(--font-mono, monospace)`,
      }}>
        {max.toFixed(1)}
      </div>
    </div>
  );
}

export const BatchNormViz = forwardRef(function BatchNormViz(props, ref) {
  const [scenario, setScenario] = useState(0);
  const [gamma, setGamma] = useState(1.0);
  const [beta, setBeta] = useState(0.0);
  const [showGB, setShowGB] = useState(false);
  const animRef = useRef(null);

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
  }, []);

  const play = useCallback(() => {
    if (animRef.current) return;
    animRef.current = setInterval(() => {
      setScenario(s => (s + 1) % SCENARIOS.length);
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    pause();
    setScenario(0);
    setGamma(1.0);
    setBeta(0.0);
    setShowGB(false);
  }, [pause]);

  const step = useCallback(() => {
    pause();
    setScenario(s => (s + 1) % SCENARIOS.length);
  }, [pause]);

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step]);

  const computed = useMemo(() => {
    const vals = SCENARIOS[scenario].values;
    const n = vals.length;

    const mu = vals.reduce((a, b) => a + b, 0) / n;
    const variance = vals.reduce((a, v) => a + (v - mu) ** 2, 0) / n;
    const sigma = Math.sqrt(variance);
    const eps = 1e-5;

    const normalized = vals.map((v) => (v - mu) / Math.sqrt(variance + eps));
    const withGB = normalized.map((x) => gamma * x + beta);

    const afterVals = showGB ? withGB : normalized;
    const afterMu = afterVals.reduce((a, b) => a + b, 0) / n;
    const afterVar = afterVals.reduce((a, v) => a + (v - afterMu) ** 2, 0) / n;
    const afterSigma = Math.sqrt(afterVar);

    const rawMin = Math.min(...vals);
    const rawMax = Math.max(...vals);
    const rawPad = Math.max((rawMax - rawMin) * 0.15, 0.5);

    const afterRange = showGB ? Math.max(4, gamma * 3.5) : 3;

    return {
      vals,
      mu,
      sigma,
      normalized,
      withGB,
      afterVals,
      afterMu,
      afterSigma,
      rawMin: rawMin - rawPad,
      rawMax: rawMax + rawPad,
      afterMin: -afterRange,
      afterMax: afterRange,
    };
  }, [scenario, gamma, beta, showGB]);

  return (
    <div style={S.root}>
      <p style={S.title}>Batch Normalization</p>
      <p style={S.subtitle}>{`x̂ = (x − μ) / √(σ² + ε)   →   y = γx̂ + β`}</p>

      {/* Scenario tabs */}
      <div style={S.tabs}>
        {SCENARIOS.map((sc, i) => (
          <button key={i} style={S.tab(scenario === i)} onClick={() => setScenario(i)}>
            {sc.label}
          </button>
        ))}
      </div>

      {/* Side-by-side panels */}
      <div style={S.panels}>
        {/* Before panel */}
        <div style={S.panel}>
          <div style={S.panelTitle}>Before BatchNorm</div>
          <DotPlot
            values={computed.vals}
            min={computed.rawMin}
            max={computed.rawMax}
            color="#F0A500"
            showMeanLine={true}
            showBand={true}
            meanVal={computed.mu}
            stdVal={computed.sigma}
          />
          <div style={{ marginTop: 6, fontSize: 11, fontFamily: `var(--font-mono, monospace)`, color: `var(--ink-low, #888)` }}>
            {`values: [${computed.vals.map((v) => v.toFixed(1)).join(', ')}]`}
          </div>
        </div>

        {/* After panel */}
        <div style={S.panel}>
          <div style={S.panelTitle}>
            {showGB ? `After BatchNorm + γ,β` : `After BatchNorm`}
          </div>
          <DotPlot
            values={computed.afterVals}
            min={computed.afterMin}
            max={computed.afterMax}
            color="#38bdf8"
            showMeanLine={true}
            showBand={true}
            meanVal={computed.afterMu}
            stdVal={computed.afterSigma}
          />
          <div style={{ marginTop: 6, fontSize: 11, fontFamily: `var(--font-mono, monospace)`, color: `var(--ink-low, #888)` }}>
            {`values: [${computed.afterVals.map((v) => v.toFixed(2)).join(', ')}]`}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={S.statsRow}>
        <span>
          {`Before: μ=`}
          <span style={S.mono}>{computed.mu.toFixed(3)}</span>
          {`  σ=`}
          <span style={S.mono}>{computed.sigma.toFixed(3)}</span>
        </span>
        {!showGB && (
          <span>
            {`After (normalized): μ≈`}
            <span style={S.mono}>{computed.afterMu.toFixed(3)}</span>
            {`  σ≈`}
            <span style={S.mono}>{computed.afterSigma.toFixed(3)}</span>
          </span>
        )}
        {showGB && (
          <span>
            {`After (γ,β applied): μ=`}
            <span style={S.mono}>{computed.afterMu.toFixed(3)}</span>
            {`  σ=`}
            <span style={S.mono}>{computed.afterSigma.toFixed(3)}</span>
            {`  (expected μ→β=`}
            <span style={S.mono}>{beta.toFixed(3)}</span>
            {`, σ→γ=`}
            <span style={S.mono}>{gamma.toFixed(3)}</span>
            {`)`}
          </span>
        )}
      </div>

      {/* Controls */}
      <div style={S.controls}>
        <label style={S.sliderLabel}>
          <span style={S.mono}>{`γ = ${gamma.toFixed(2)}`}</span>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.05}
            value={gamma}
            onChange={(e) => setGamma(parseFloat(e.target.value))}
            style={S.slider}
          />
        </label>
        <label style={S.sliderLabel}>
          <span style={S.mono}>{`β = ${beta.toFixed(2)}`}</span>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.05}
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            style={S.slider}
          />
        </label>
        <button
          style={showGB ? S.btnActive : S.btn}
          onClick={() => setShowGB((v) => !v)}
        >
          {showGB ? `Hide γ,β effect` : `Show γ,β effect`}
        </button>
      </div>

      {/* Note */}
      <div style={S.note}>
        {`Batch norm solves internal covariate shift — the distribution of activations shifting during training as earlier layers update. By normalizing each mini-batch, gradients flow more stably and higher learning rates become safe. γ and β let the network re-scale and re-center if needed.`}
      </div>
    </div>
  );
})
