import React, { useRef, useEffect, useCallback, useMemo, useState, useImperativeHandle, forwardRef } from 'react';

// Seeded deterministic RNG
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── True target function ──────────────────────────────────────────────────────
// A smooth wavy boundary the models are trying to recover. p(x) is the "right
// answer"; each model only sees noisy points and guesses a jagged version of it.
function trueP(x) {
  return 0.5 + 0.28 * Math.sin(x * Math.PI * 2.1);
}

// One high-variance model: fit a noisy bootstrap sample with an over-flexible
// piecewise-constant regressor (many narrow bins). Because it chases the noise
// in its particular sample, each model's prediction curve is jagged and every
// model is jagged in a DIFFERENT way. That per-model wobble is the "variance".
const BINS = 24;
function makeModel(seed) {
  const rng = mulberry32(seed);
  const binSum = new Array(BINS).fill(0);
  const binCnt = new Array(BINS).fill(0);
  // 40 noisy training points drawn for THIS model (its bootstrap sample)
  for (let i = 0; i < 40; i++) {
    const x = rng();
    const y = trueP(x) + (rng() - 0.5) * 0.55; // heavy noise
    const b = Math.min(BINS - 1, Math.floor(x * BINS));
    binSum[b] += y;
    binCnt[b] += 1;
  }
  // Bin means; empty bins fall back to the global mean so the curve is defined
  const globalMean = binCnt.reduce((a, c, i) => a + binSum[i], 0) /
                     Math.max(1, binCnt.reduce((a, c) => a + c, 0));
  const bins = binSum.map((s, i) => (binCnt[i] ? s / binCnt[i] : globalMean));
  return (x) => bins[Math.min(BINS - 1, Math.floor(x * BINS))];
}

// Sample x-grid once
const GRID = Array.from({ length: 100 }, (_, i) => (i + 0.5) / 100);

// Build a fixed pool of models (deterministic). The slider reveals the first N.
const POOL_SIZE = 60;
const MODEL_POOL = Array.from({ length: POOL_SIZE }, (_, i) => makeModel(1000 + i * 7));

// Ensemble prediction = average of the first N models, evaluated on the grid.
function ensembleCurve(n) {
  return GRID.map((x) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += MODEL_POOL[i](x);
    return s / n;
  });
}

// Variance of the ensemble estimator: how much the averaged curve would jump
// around across independent runs. For an average of N i.i.d. models it scales
// like Var(single)/N. We measure it empirically by splitting the pool into
// disjoint groups of N and looking at the spread of their averaged curves.
function ensembleVariance(n) {
  const groups = Math.floor(POOL_SIZE / n);
  if (groups < 2) {
    // Not enough disjoint groups to measure spread — fall back to the theoretical
    // single-model variance divided by N (same 1/N law).
    return singleVariance() / n;
  }
  const curves = [];
  for (let g = 0; g < groups; g++) {
    const curve = GRID.map((x) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += MODEL_POOL[g * n + i](x);
      return s / n;
    });
    curves.push(curve);
  }
  // Average per-x variance across the groups
  let total = 0;
  for (let k = 0; k < GRID.length; k++) {
    const vals = curves.map((c) => c[k]);
    const m = vals.reduce((a, v) => a + v, 0) / vals.length;
    total += vals.reduce((a, v) => a + (v - m) * (v - m), 0) / vals.length;
  }
  return total / GRID.length;
}

let _singleVar = null;
function singleVariance() {
  if (_singleVar != null) return _singleVar;
  let total = 0;
  for (let k = 0; k < GRID.length; k++) {
    const vals = MODEL_POOL.map((m) => m(GRID[k]));
    const mean = vals.reduce((a, v) => a + v, 0) / vals.length;
    total += vals.reduce((a, v) => a + (v - mean) * (v - mean), 0) / vals.length;
  }
  _singleVar = total / GRID.length;
  return _singleVar;
}

const TRUE_COLOR = '#4ade80';   // green — the target we want to recover
const MODEL_COLOR = 'rgba(120,150,220,0.35)'; // faint blue — individual noisy models
const ENSEMBLE_COLOR = '#F0A500'; // prime — the averaged prediction

// ── Canvas draw ───────────────────────────────────────────────────────────────
function drawScene(canvas, n) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0) return;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rect.width, H = rect.height;
  const PAD = 24;
  const dw = W - 2 * PAD, dh = H - 2 * PAD;
  const toX = (x) => PAD + x * dw;
  const toY = (y) => PAD + (1 - y) * dh;

  const bg = getComputedStyle(document.documentElement).getPropertyValue('--depth').trim() || '#0F1117';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Faint axis frame
  ctx.strokeStyle = 'rgba(150,150,160,0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, PAD, dw, dh);

  const drawCurve = (vals, color, width, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    vals.forEach((v, i) => {
      const cx = toX(GRID[i]);
      const cy = toY(Math.max(0, Math.min(1, v)));
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.restore();
  };

  // 1) The individual noisy models (faint, jagged, each different)
  for (let i = 0; i < n; i++) {
    const curve = GRID.map((x) => MODEL_POOL[i](x));
    drawCurve(curve, MODEL_COLOR, 1);
  }

  // 2) The true target (green, smooth) — what we're trying to recover
  drawCurve(GRID.map(trueP), TRUE_COLOR, 2, 0.9);

  // 3) The ensemble average (prime, bold) — smooths toward the target as N grows
  drawCurve(ensembleCurve(n), ENSEMBLE_COLOR, 3);

  // Labels (light-colored on the dark canvas)
  ctx.fillStyle = 'rgba(210,210,215,0.75)';
  ctx.font = '11px var(--font-sans, sans-serif)';
  ctx.fillText('prediction', 6, 14);
  ctx.fillText('x', W - 12, H - 8);
}

export const EnsembleViz = forwardRef(function EnsembleViz(props, ref) {
  const canvasRef = useRef(null);
  const [n, setN] = useState(1);

  const variance = useMemo(() => ensembleVariance(n), [n]);
  const baseVariance = useMemo(() => ensembleVariance(1), []);
  const reductionPct = Math.round((1 - variance / baseVariance) * 100);

  const redraw = useCallback(() => { drawScene(canvasRef.current, n); }, [n]);

  useEffect(() => { redraw(); }, [redraw]);

  useEffect(() => {
    const onResize = () => redraw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [redraw]);

  // Slider-driven viz — no animation, so no play/pause exposed.
  const reset = useCallback(() => setN(1), []);
  const step = useCallback(() => setN((v) => Math.min(v + 5, POOL_SIZE)), []);
  useImperativeHandle(ref, () => ({ reset, step }), [reset, step]);

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: 24, fontFamily: 'var(--font-sans)' }}>
      <h3 style={{ margin: '0 0 4px', color: 'var(--ink-hi)', fontSize: 18, fontWeight: 700 }}>Ensembling reduces variance</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--ink-mid)', fontSize: 13 }}>
        Each model is high-variance and jagged. Averaging many of them cancels their individual noise and leaves the shared signal.
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 12, fontSize: 12, color: 'var(--ink-mid)', flexWrap: 'wrap' }}>
        <span style={{ color: TRUE_COLOR }}>— true signal</span>
        <span style={{ color: '#8aa0dc' }}>— individual models (noisy)</span>
        <span style={{ color: ENSEMBLE_COLOR }}>— ensemble average</span>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '240px', display: 'block', borderRadius: 8, border: '1px solid var(--rim)' }}
      />

      {/* The one control that drives everything */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: 'var(--ink-mid)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ color: 'var(--ink-hi)' }}>Models in ensemble</strong>
          <input
            type="range" min={1} max={POOL_SIZE} step={1} value={n}
            onChange={(e) => setN(Number(e.target.value))}
            style={{ accentColor: 'var(--prime)', verticalAlign: 'middle', width: 200 }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--prime)', fontWeight: 700 }}>N = {n}</span>
        </label>
      </div>

      {/* Plain-language cause→effect label */}
      <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-mid)' }}>
        <strong style={{ color: 'var(--prime)' }}>N = {n} models</strong> — averaging cancels their individual noise; variance{' '}
        <span style={{ color: reductionPct > 0 ? '#4ade80' : 'var(--ink-hi)', fontWeight: 700 }}>
          {'↓'} {reductionPct > 0 ? `${reductionPct}%` : '—'}
        </span>{' '}
        vs. a single model.
      </div>

      {/* Live variance metric */}
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--depth)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.8 }}>
        <div>
          <span style={{ color: 'var(--ink-mid)' }}>Ensemble variance: </span>
          <span style={{ color: ENSEMBLE_COLOR, fontWeight: 700 }}>{variance.toFixed(4)}</span>
          <span style={{ color: 'var(--ink-low)' }}> (single model: {baseVariance.toFixed(4)})</span>
        </div>
        <div style={{ color: 'var(--ink-low)', fontSize: 12 }}>
          Var(average of N) {'≈'} Var(single) / N — drag the slider and watch it fall.
        </div>
      </div>

      <p style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-low)', lineHeight: 1.6, borderTop: '1px solid var(--rim)', paddingTop: 12 }}>
        Each faint blue curve is one over-flexible model fit to its own noisy sample — individually unreliable and jagged in its own way. Their errors are uncorrelated, so the orange average settles onto the green true signal as N grows. This is the whole point of bagging and Random Forests: keep the models flexible (low bias), and let averaging kill the variance.
      </p>
    </div>
  );
})
