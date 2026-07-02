import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller using seeded RNG
function makeNormal(rng) {
  let spare = null;
  return function (mean, std) {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return mean + std * v;
    }
    let u, v, s;
    do {
      u = rng() * 2 - 1;
      v = rng() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const mul = Math.sqrt(-2 * Math.log(s) / s);
    spare = v * mul;
    return mean + std * u * mul;
  };
}

// ---------------------------------------------------------------------------
// Simulation constants
// ---------------------------------------------------------------------------
const FAN_DEFAULT = 512;
const N_LAYERS = 10;
const N_SAMPLES = 200; // per-sample batch
const N_HIST_BINS = 30;

// weightStd is now a function of fan (fan_in = fan_out) so the fan-in slider
// actually changes the initialisation std, not just a label.
const INIT_STRATEGIES = [
  {
    id: `zeros`,
    label: `Zeros`,
    weightStd: () => 0,
    desc: `All weights = 0. Every neuron sees the same input and produces identical activations — the network is completely dead. No gradient flows.`,
  },
  {
    id: `large`,
    label: `Large Normal`,
    weightStd: () => 1.0,
    desc: `Weights ~ N(0, 1). Each layer multiplies std by √fan_in, causing exponential explosion. Activations become ±∞ within a few layers.`,
  },
  {
    id: `xavier`,
    label: `Xavier`,
    weightStd: (fan) => Math.sqrt(2 / (fan + fan)), // sqrt(2 / (fan_in + fan_out))
    desc: `Weights ~ N(0, √(2/(fan_in+fan_out))). Designed for tanh: keeps variance stable across layers. Slightly shrinks under ReLU (ReLU kills ~50% of neurons).`,
  },
  {
    id: `he`,
    label: `He / Kaiming`,
    weightStd: (fan) => Math.sqrt(2 / fan), // sqrt(2 / fan_in)
    desc: `Weights ~ N(0, √(2/fan_in)). Accounts for ReLU zeroing half of neurons. Keeps variance stable under ReLU. Slight over-shoot for tanh.`,
  },
];

const ACTIVATIONS = [
  { id: `relu`, label: `ReLU`, fn: (x) => Math.max(0, x) },
  { id: `tanh`, label: `tanh`, fn: (x) => Math.tanh(x) },
];

// ---------------------------------------------------------------------------
// Compute simulation: returns array of N_LAYERS objects with { std, histBins }
// ---------------------------------------------------------------------------
function runSimulation(initId, activationId, fan, scale) {
  const rng = mulberry32(0xdeadbeef);
  const randn = makeNormal(rng);

  const strategy = INIT_STRATEGIES.find((s) => s.id === initId);
  const activation = ACTIVATIONS.find((a) => a.id === activationId);
  const FAN = fan;
  // init-scale multiplier lets the user over-/under-shoot any strategy's std.
  const wStd = strategy.weightStd(FAN) * scale;

  // Initialize batch: N_SAMPLES × FAN (first layer input is N(0,1))
  let batch = [];
  for (let i = 0; i < N_SAMPLES; i++) {
    const row = [];
    for (let j = 0; j < FAN; j++) {
      row.push(randn(0, 1));
    }
    batch.push(row);
  }

  const layerStats = [];

  for (let l = 0; l < N_LAYERS; l++) {
    const preActs = []; // one pre-activation value per sample (we'll track the first neuron's distribution)

    if (wStd === 0) {
      // Dead network: all zeros
      for (let i = 0; i < N_SAMPLES; i++) preActs.push(0);
      batch = batch.map(() => new Array(FAN).fill(0));
    } else {
      // For each sample, compute one synthetic pre-activation
      // pre_act_k = sum_j w_kj * h_j  where w_kj ~ N(0, wStd)
      // By CLT: pre_act_k ~ N(0, wStd * sqrt(FAN) * std(h))
      // We approximate: compute std of batch, then sample pre-acts analytically
      // Also propagate batch forward (approximation: new h = activation(N(0, layer_std)) per unit)

      // Compute std of previous batch activations
      let allVals = [];
      for (let i = 0; i < N_SAMPLES; i++) {
        for (let j = 0; j < FAN; j++) allVals.push(batch[i][j]);
      }
      const mean = allVals.reduce((a, b) => a + b, 0) / allVals.length;
      const variance = allVals.reduce((a, v) => a + (v - mean) ** 2, 0) / allVals.length;
      const inputStd = Math.sqrt(variance);

      // std of pre-activation = wStd * sqrt(FAN) * inputStd
      const preActStd = wStd * Math.sqrt(FAN) * inputStd;

      // Sample pre-activations
      for (let i = 0; i < N_SAMPLES; i++) {
        preActs.push(randn(0, preActStd));
      }

      // Propagate batch: each unit gets a fresh pre-activation sample, apply activation
      batch = [];
      for (let i = 0; i < N_SAMPLES; i++) {
        const row = [];
        for (let j = 0; j < FAN; j++) {
          const pre = randn(0, preActStd);
          row.push(activation.fn(pre));
        }
        batch.push(row);
      }
    }

    // Compute stats for histogram
    const n = preActs.length;
    const mean = preActs.reduce((a, b) => a + b, 0) / n;
    const variance = preActs.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);

    // Build histogram
    let lo, hi;
    if (std < 1e-10) {
      lo = -1;
      hi = 1;
    } else {
      const spread = Math.min(std * 4, 1e6);
      lo = mean - spread;
      hi = mean + spread;
    }

    const bins = new Array(N_HIST_BINS).fill(0);
    for (const v of preActs) {
      if (!isFinite(v)) continue;
      const idx = Math.floor(((v - lo) / (hi - lo)) * N_HIST_BINS);
      if (idx >= 0 && idx < N_HIST_BINS) bins[idx]++;
    }

    layerStats.push({ std, mean, lo, hi, bins, preActs });
  }

  return layerStats;
}

// ---------------------------------------------------------------------------
// Classify std health
// ---------------------------------------------------------------------------
function classifyStd(std) {
  if (std < 1e-6) return `dead`;
  if (std > 100) return `exploding`;
  if (std >= 0.1 && std <= 10) return `stable`;
  return `shrinking`;
}

function stdColor(health) {
  if (health === `dead`) return `#ef4444`;
  if (health === `exploding`) return `#f97316`;
  if (health === `stable`) return `var(--prime, #F0A500)`;
  return `#fb923c`;
}

function diagnosisInfo(layerStats) {
  const last = layerStats[layerStats.length - 1];
  const first = layerStats[0];
  if (last.std < 1e-6) return { label: `Dead Network`, color: `#ef4444`, detail: `All activations collapsed to zero. Gradients cannot flow — weights will never update.` };
  if (last.std > 100) return { label: `Exploding Activations`, color: `#f97316`, detail: `Activations grow without bound. Loss will be NaN/Inf on forward pass.` };
  if (first.std > 0 && last.std / first.std < 0.01) return { label: `Vanishing Activations`, color: `#fb923c`, detail: `Signal attenuates exponentially. Deep layers receive near-zero input; gradients vanish on backprop.` };
  return { label: `Stable`, color: `#4ade80`, detail: `Variance is well-maintained across all layers. Good conditions for training.` };
}

// ---------------------------------------------------------------------------
// Canvas drawing
// ---------------------------------------------------------------------------
function drawHistograms(canvas, layerStats, initId) {
  if (!canvas) return;
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (W === 0 || H === 0) return;

  const ctx = canvas.getContext(`2d`);
  const dpr = window.devicePixelRatio || 1;

  // Only resize when physical size needs to change
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cs = getComputedStyle(document.documentElement);
  const prime = cs.getPropertyValue(`--prime`).trim() || `#F0A500`;
  const depth = cs.getPropertyValue(`--depth`).trim() || `#111`;
  const rim = cs.getPropertyValue(`--rim`).trim() || `#333`;
  const inkLow = cs.getPropertyValue(`--ink-low`).trim() || `#666`;
  const inkMid = cs.getPropertyValue(`--ink-mid`).trim() || `#999`;

  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const COLS = 5;
  const ROWS = 2;
  const PAD_X = 8;
  const PAD_Y = 8;
  const GAP_X = 6;
  const GAP_Y = 28; // extra for label row at bottom
  const cellW = (W - PAD_X * 2 - GAP_X * (COLS - 1)) / COLS;
  const cellH = (H - PAD_Y * 2 - GAP_Y * (ROWS - 1)) / ROWS;

  for (let i = 0; i < N_LAYERS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x0 = PAD_X + col * (cellW + GAP_X);
    const y0 = PAD_Y + row * (cellH + GAP_Y);

    const stat = layerStats[i];
    const health = classifyStd(stat.std);
    const color = stdColor(health);

    // Cell background
    ctx.fillStyle = `rgba(255,255,255,0.02)`;
    ctx.fillRect(x0, y0, cellW, cellH - 14);

    ctx.strokeStyle = health === `stable` ? `rgba(240,165,0,0.25)` : `rgba(239,68,68,0.25)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, y0, cellW, cellH - 14);

    // Layer label top-left
    ctx.fillStyle = inkMid;
    ctx.font = `bold 10px var(--font-mono, monospace)`;
    ctx.fillText(`L${i + 1}`, x0 + 4, y0 + 11);

    // Histogram
    const histH = cellH - 30;
    const histY0 = y0 + 16;
    const bins = stat.bins;
    const maxBin = Math.max(...bins, 1);
    const barW = (cellW - 4) / N_HIST_BINS;

    for (let b = 0; b < N_HIST_BINS; b++) {
      const barH = (bins[b] / maxBin) * histH;
      const bx = x0 + 2 + b * barW;
      const by = histY0 + histH - barH;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(bx, by, Math.max(barW - 0.5, 0.5), barH);
    }
    ctx.globalAlpha = 1;

    // Baseline
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x0, histY0 + histH);
    ctx.lineTo(x0 + cellW, histY0 + histH);
    ctx.stroke();

    // Std label below histogram (inside cell bottom)
    const stdStr = stat.std < 1e-9 ? `σ=0` : stat.std > 999 ? `σ=∞` : `σ=${stat.std < 0.01 ? stat.std.toExponential(1) : stat.std.toFixed(3)}`;
    ctx.fillStyle = color;
    ctx.font = `9px var(--font-mono, monospace)`;
    ctx.fillText(stdStr, x0 + 3, y0 + cellH - 16);

    // Health tag tiny
    ctx.fillStyle = health === `stable` ? `rgba(74,222,128,0.7)` : health === `dead` ? `rgba(239,68,68,0.7)` : health === `exploding` ? `rgba(249,115,22,0.7)` : `rgba(251,146,60,0.7)`;
    ctx.font = `8px var(--font-sans, sans-serif)`;
    ctx.fillText(health, x0 + 3, y0 + cellH - 5);
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const S = {
  root: {
    fontFamily: `var(--font-sans, sans-serif)`,
    color: `var(--ink-hi, #eee)`,
    maxWidth: 720,
    display: `flex`,
    flexDirection: `column`,
    gap: 14,
  },
  title: { margin: 0, fontSize: 17, fontWeight: 700, color: `var(--ink-hi, #eee)` },
  subtitle: { margin: 0, fontSize: 12, color: `var(--ink-low, #888)`, fontFamily: `var(--font-mono, monospace)` },
  controlRow: { display: `flex`, gap: 6, flexWrap: `wrap`, alignItems: `center` },
  label: { fontSize: 11, color: `var(--ink-low, #888)`, marginRight: 4 },
  btn: (active) => ({
    padding: `5px 13px`,
    borderRadius: 6,
    border: `1.5px solid ${active ? `var(--prime, #F0A500)` : `var(--rim, #444)`}`,
    background: active ? `rgba(240,165,0,0.12)` : `var(--depth, #111)`,
    color: active ? `var(--prime, #F0A500)` : `var(--ink-mid, #aaa)`,
    cursor: `pointer`,
    fontSize: 13,
    fontFamily: `var(--font-sans, sans-serif)`,
    transition: `border-color 0.15s`,
  }),
  canvas: {
    width: `100%`,
    height: 340,
    display: `block`,
    borderRadius: 8,
    border: `1px solid var(--rim, #333)`,
  },
  diagBox: (color) => ({
    padding: `10px 14px`,
    borderRadius: 6,
    border: `1px solid ${color}55`,
    background: `${color}11`,
    display: `flex`,
    flexDirection: `column`,
    gap: 4,
  }),
  diagLabel: (color) => ({
    fontSize: 13,
    fontWeight: 700,
    color,
    fontFamily: `var(--font-mono, monospace)`,
  }),
  diagDetail: {
    fontSize: 12,
    color: `var(--ink-mid, #aaa)`,
    lineHeight: 1.55,
  },
  descBox: {
    padding: `10px 14px`,
    borderRadius: 6,
    border: `1px solid var(--rim, #333)`,
    background: `rgba(255,255,255,0.03)`,
    fontSize: 12,
    color: `var(--ink-mid, #aaa)`,
    lineHeight: 1.6,
  },
  sep: {
    width: 1,
    height: 22,
    background: `var(--rim, #444)`,
    display: `inline-block`,
    margin: `0 4px`,
  },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const WeightInitViz = forwardRef(function WeightInitViz(props, ref) {
  const [initId, setInitId] = useState(`he`);
  const [activationId, setActivationId] = useState(`relu`);
  const [fan, setFan] = useState(FAN_DEFAULT);
  const [scale, setScale] = useState(1.0);
  const canvasRef = useRef(null);

  const reset = useCallback(() => {
    setInitId('he');
    setActivationId('relu');
    setFan(FAN_DEFAULT);
    setScale(1.0);
  }, []);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  // Recompute simulation when inputs change
  const layerStats = (() => {
    try { return runSimulation(initId, activationId, fan, scale); }
    catch { return null; }
  })();

  const draw = useCallback(() => {
    if (!canvasRef.current || !layerStats) return;
    drawHistograms(canvasRef.current, layerStats, initId);
  }, [layerStats, initId]);

  // ResizeObserver: resize canvas buffer on size change, then redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      if (!layerStats) return;
      drawHistograms(canvas, layerStats, initId);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerStats]);

  // Redraw when data changes
  useEffect(() => {
    draw();
  }, [draw]);

  const strategy = INIT_STRATEGIES.find((s) => s.id === initId);
  const diagnosis = layerStats ? diagnosisInfo(layerStats) : null;

  return (
    <div style={S.root}>
      <div>
        <p style={S.title}>Weight Initialization</p>
        <p style={S.subtitle}>{`How init strategy shapes activation distributions through a 10-layer MLP (fan_in = fan_out = ${fan})`}</p>
      </div>

      {/* Controls */}
      <div style={S.controlRow}>
        <span style={S.label}>Init:</span>
        {INIT_STRATEGIES.map((s) => (
          <button key={s.id} style={S.btn(initId === s.id)} onClick={() => setInitId(s.id)}>
            {s.label}
          </button>
        ))}
        <span style={S.sep} />
        <span style={S.label}>Activation:</span>
        {ACTIVATIONS.map((a) => (
          <button key={a.id} style={S.btn(activationId === a.id)} onClick={() => setActivationId(a.id)}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Fan-in + init-scale sliders */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--depth, #111)', border: '1px solid var(--rim, #333)', borderRadius: 8, padding: '10px 14px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 240px' }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: 'var(--ink-mid, #aaa)', minWidth: 118 }}>
            {`fan_in = `}<span style={{ color: 'var(--prime, #F0A500)' }}>{fan}</span>
          </span>
          <input type="range" min={4} max={2048} step={4} value={fan}
            onChange={(e) => setFan(parseInt(e.target.value, 10))}
            style={{ flex: 1, accentColor: 'var(--prime, #F0A500)', cursor: 'pointer' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 240px' }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono, monospace)', color: 'var(--ink-mid, #aaa)', minWidth: 118 }}>
            {`init scale = `}<span style={{ color: 'var(--prime, #F0A500)' }}>{scale.toFixed(2)}×</span>
          </span>
          <input type="range" min={0.25} max={4} step={0.05} value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--prime, #F0A500)', cursor: 'pointer' }} />
        </label>
        <span style={{ fontSize: 11, color: 'var(--ink-low, #888)', fontFamily: 'var(--font-mono, monospace)', flexBasis: '100%' }}>
          effective weight std = strategy(fan) × scale = {(INIT_STRATEGIES.find(s => s.id === initId).weightStd(fan) * scale).toExponential(2)}
        </span>
      </div>

      {/* Canvas grid */}
      <canvas ref={canvasRef} style={S.canvas} />

      {/* Diagnosis */}
      {diagnosis && (
        <div style={S.diagBox(diagnosis.color)}>
          <span style={S.diagLabel(diagnosis.color)}>{`Diagnosis: ${diagnosis.label}`}</span>
          <span style={S.diagDetail}>{diagnosis.detail}</span>
        </div>
      )}

      {/* Strategy description */}
      <div style={S.descBox}>{strategy.desc}</div>
    </div>
  );
})
