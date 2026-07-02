import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function boxMuller(rng) {
  const u = rng() + 1e-10, v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ─── Series generators ────────────────────────────────────────────────────────
const N = 120;

function genAR1(seed = 42) {
  const rng = mulberry32(seed);
  const y = [0];
  for (let t = 1; t < N; t++) y.push(0.7 * y[t - 1] + boxMuller(rng));
  return y;
}

function genRandomWalk(seed = 42) {
  const rng = mulberry32(seed);
  const y = [0];
  for (let t = 1; t < N; t++) y.push(y[t - 1] + boxMuller(rng));
  return y;
}

function genTrend(seed = 42) {
  const rng = mulberry32(seed);
  return Array.from({ length: N }, (_, t) => 0.3 * t + boxMuller(rng));
}

function genSeasonal(seed = 42) {
  const rng = mulberry32(seed);
  return Array.from({ length: N }, (_, t) => 10 * Math.sin(2 * Math.PI * t / 12) + 0.5 * boxMuller(rng));
}

// ─── Differencing ─────────────────────────────────────────────────────────────
function firstDiff(series) {
  return series.slice(1).map((v, i) => v - series[i]);
}

// ─── Rolling stats ────────────────────────────────────────────────────────────
function rollingMean(series, window) {
  const result = [];
  for (let i = 0; i < series.length; i++) {
    if (i < window - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += series[j];
    result.push(sum / window);
  }
  return result;
}

function rollingVariance(series, window) {
  const result = [];
  for (let i = 0; i < series.length; i++) {
    if (i < window - 1) { result.push(null); continue; }
    const slice = series.slice(i - window + 1, i + 1);
    const m = slice.reduce((a, b) => a + b, 0) / window;
    const v = slice.reduce((s, v) => s + (v - m) ** 2, 0) / window;
    result.push(Math.sqrt(v)); // std dev
  }
  return result;
}

// ─── ACF ─────────────────────────────────────────────────────────────────────
function computeACF(series, maxLag) {
  const n = series.length;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const variance = series.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  if (variance < 1e-10) return new Array(maxLag).fill(0);
  return Array.from({ length: maxLag }, (_, k) => {
    let sum = 0;
    for (let t = k + 1; t < n; t++) sum += (series[t] - mean) * (series[t - k - 1] - mean);
    return sum / (n * variance);
  });
}

// ─── Series config ────────────────────────────────────────────────────────────
const SERIES_CONFIG = [
  {
    id: 'ar1',
    label: 'Stationary AR(1)',
    gen: () => genAR1(42),
    adf: { stat: -4.2, p: '< 0.05', stationary: true },
    color: '#4a9ebb',
  },
  {
    id: 'rw',
    label: 'Random Walk',
    gen: () => genRandomWalk(99),
    adf: { stat: -0.8, p: '= 0.38', stationary: false },
    color: '#d45a5a',
  },
  {
    id: 'trend',
    label: 'Trend',
    gen: () => genTrend(7),
    adf: { stat: -1.3, p: '= 0.19', stationary: false },
    color: '#e07b4a',
  },
  {
    id: 'seasonal',
    label: 'Seasonal',
    gen: () => genSeasonal(13),
    adf: { stat: -3.1, p: '= 0.06', stationary: false },
    color: '#9b7fd4',
  },
];

const GHOST = 'rgba(255,255,255,0.38)';
const RIM = 'rgba(255,255,255,0.1)';
const BG = '#111';
const PRIME = '#f5b942';
const ACF_LAGS = 20;

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function drawSeriesLine(ctx, series, padL, padR, panelTop, panelH, color, dash = false) {
  const n = series.length;
  const vals = series.filter(v => v !== null);
  if (!vals.length) return;
  const yMin = Math.min(...vals);
  const yMax = Math.max(...vals);
  const yRange = yMax - yMin || 1;
  const pad = { top: 22, bottom: 12 };
  const iW = (ctx.canvas.width / (window.devicePixelRatio || 1)) - padL - padR;
  const iH = panelH - pad.top - pad.bottom;

  const toX = (i) => padL + (i / (n - 1)) * iW;
  const toY = (v) => panelTop + pad.top + iH - (v - yMin) / yRange * iH;

  if (dash) ctx.setLineDash([4, 3]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < n; i++) {
    if (series[i] === null) { started = false; continue; }
    if (!started) { ctx.moveTo(toX(i), toY(series[i])); started = true; }
    else ctx.lineTo(toX(i), toY(series[i]));
  }
  ctx.stroke();
  ctx.setLineDash([]);
  return { yMin, yMax };
}

// ─── Main component ───────────────────────────────────────────────────────────
export const StationarityViz = forwardRef(function StationarityViz(props, ref) {
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [showDiff, setShowDiff] = useState(false);
  const [window_size, setWindowSize] = useState(20);

  const canvasRef = useRef(null);

  const config = SERIES_CONFIG[seriesIdx];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const series = config.gen();
    const diffSeries = firstDiff(series);
    const displaySeries = showDiff ? diffSeries : series;
    const displayN = displaySeries.length;

    const padL = 52, padR = 16;
    const iW = W - padL - padR;

    // Panel heights: 40% / 30% / 30%
    const p1H = Math.round(H * 0.40);
    const p2H = Math.round(H * 0.30);
    const p3H = H - p1H - p2H;

    const toX = (i, n) => padL + (i / (n - 1)) * iW;

    // ── Panel 1: Time series ──────────────────────────────────────────────────
    {
      const pTop = 0;
      const pad = { top: 24, bottom: 14 };
      const iH = p1H - pad.top - pad.bottom;
      const vals = displaySeries;
      const yMin = Math.min(...vals);
      const yMax = Math.max(...vals);
      const yRange = yMax - yMin || 1;
      const toY = (v) => pTop + pad.top + iH - (v - yMin) / yRange * iH;

      ctx.fillStyle = GHOST;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        showDiff ? `First Difference Δy_t  [${config.label}]` : `Time Series y_t  [${config.label}]`,
        padL, pTop + 14
      );

      // Grid
      ctx.strokeStyle = RIM;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const v = yMin + yRange * i / 4;
        const y = toY(v);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + iW, y); ctx.stroke();
        ctx.fillStyle = GHOST;
        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(v.toFixed(1), padL - 4, y + 3);
      }

      // Zero line
      if (yMin < 0 && yMax > 0) {
        const zy = toY(0);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(padL, zy); ctx.lineTo(padL + iW, zy); ctx.stroke();
        ctx.setLineDash([]);
      }

      // Series line
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      for (let i = 0; i < displayN; i++) {
        i === 0 ? ctx.moveTo(toX(i, displayN), toY(vals[i])) : ctx.lineTo(toX(i, displayN), toY(vals[i]));
      }
      ctx.stroke();

      // Time axis labels
      ctx.fillStyle = GHOST;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (let t = 0; t <= displayN; t += 20) {
        ctx.fillText(t, toX(t, displayN + 1), pTop + p1H - 2);
      }

      // Separator
      ctx.strokeStyle = RIM;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, pTop + p1H); ctx.lineTo(W, pTop + p1H); ctx.stroke();
    }

    // ── Panel 2: Rolling mean + std ───────────────────────────────────────────
    {
      const pTop = p1H;
      const pad = { top: 22, bottom: 12 };
      const iH = p2H - pad.top - pad.bottom;

      const rmean = rollingMean(displaySeries, window_size);
      const rstd = rollingVariance(displaySeries, window_size);
      const validMean = rmean.filter(v => v !== null);
      const validStd = rstd.filter(v => v !== null);

      const mMin = validMean.length ? Math.min(...validMean) : -1;
      const mMax = validMean.length ? Math.max(...validMean) : 1;
      const sMin = validStd.length ? 0 : 0;
      const sMax = validStd.length ? Math.max(...validStd) : 1;

      // Combined range for both
      const allVals = [...validMean, ...validStd];
      const yMin = Math.min(...allVals, 0) - 0.1;
      const yMax = Math.max(...allVals) + 0.1;
      const yRange = yMax - yMin || 1;
      const toY = (v) => pTop + pad.top + iH - (v - yMin) / yRange * iH;

      ctx.fillStyle = GHOST;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Rolling Mean & Std Dev (window=${window_size})`, padL, pTop + 14);

      // Grid
      ctx.strokeStyle = RIM;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 3; i++) {
        const v = yMin + yRange * i / 3;
        const y = toY(v);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + iW, y); ctx.stroke();
        ctx.fillStyle = GHOST;
        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(v.toFixed(1), padL - 4, y + 3);
      }

      const n = displayN;

      // Rolling std (dashed, secondary color)
      ctx.strokeStyle = '#9b7fd4';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        if (rstd[i] === null) { started = false; continue; }
        if (!started) { ctx.moveTo(toX(i, n), toY(rstd[i])); started = true; }
        else ctx.lineTo(toX(i, n), toY(rstd[i]));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Rolling mean (solid)
      ctx.strokeStyle = PRIME;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      started = false;
      for (let i = 0; i < n; i++) {
        if (rmean[i] === null) { started = false; continue; }
        if (!started) { ctx.moveTo(toX(i, n), toY(rmean[i])); started = true; }
        else ctx.lineTo(toX(i, n), toY(rmean[i]));
      }
      ctx.stroke();

      // Legend
      const lx = W - padR - 90;
      const ly = pTop + pad.top;
      ctx.strokeStyle = PRIME; ctx.lineWidth = 1.8; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(lx, ly + 6); ctx.lineTo(lx + 14, ly + 6); ctx.stroke();
      ctx.fillStyle = GHOST; ctx.font = '8.5px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Mean', lx + 17, ly + 9);
      ctx.strokeStyle = '#9b7fd4'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(lx, ly + 18); ctx.lineTo(lx + 14, ly + 18); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = GHOST;
      ctx.fillText('Std Dev', lx + 17, ly + 21);

      // Stationary annotation
      const annotText = config.adf.stationary
        ? 'Flat mean & variance → stationary'
        : 'Drifting mean/variance → non-stationary';
      ctx.fillStyle = config.adf.stationary ? 'rgba(80,200,80,0.7)' : 'rgba(212,90,90,0.7)';
      ctx.font = '8.5px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(annotText, padL + iW / 2, pTop + p2H - 4);

      // Separator
      ctx.strokeStyle = RIM;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, pTop + p2H); ctx.lineTo(W, pTop + p2H); ctx.stroke();
    }

    // ── Panel 3: ACF ──────────────────────────────────────────────────────────
    {
      const pTop = p1H + p2H;
      const pad = { top: 22, bottom: 20 };
      const iH = p3H - pad.top - pad.bottom;

      const acfSeries = showDiff ? diffSeries : series;
      const acfValues = computeACF(acfSeries, ACF_LAGS);
      const acfBound = 1.96 / Math.sqrt(acfSeries.length);

      ctx.fillStyle = GHOST;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`ACF  (lags 1–${ACF_LAGS})`, padL, pTop + 14);

      const barW = iW / ACF_LAGS;
      const zeroY = pTop + pad.top + iH / 2;
      const yScale = (iH / 2) / 1;

      // Significance bounds
      const bPos = zeroY - acfBound * yScale;
      const bNeg = zeroY + acfBound * yScale;
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(padL, bPos); ctx.lineTo(padL + iW, bPos); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, bNeg); ctx.lineTo(padL + iW, bNeg); ctx.stroke();
      ctx.setLineDash([]);

      // Zero line
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(padL, zeroY); ctx.lineTo(padL + iW, zeroY); ctx.stroke();

      // Bars
      acfValues.forEach((val, i) => {
        const inside = Math.abs(val) <= acfBound;
        const bx = padL + i * barW + barW * 0.15;
        const bw = barW * 0.7;
        const barH = Math.abs(val) * yScale;
        const by = val >= 0 ? zeroY - barH : zeroY;
        ctx.fillStyle = inside ? PRIME : config.color;
        ctx.fillRect(bx, by, bw, barH);

        ctx.fillStyle = GHOST;
        ctx.font = '8px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i + 1, bx + bw / 2, pTop + pad.top + iH + 12);
      });

      // Y labels
      ctx.fillStyle = GHOST;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('1.0', padL - 4, pTop + pad.top + 4);
      ctx.fillText('0', padL - 4, zeroY + 3);
      ctx.fillText('-1.0', padL - 4, pTop + pad.top + iH);

      // Bound label
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`±${acfBound.toFixed(2)}`, padL + iW, bPos - 2);

      // X axis label
      ctx.fillStyle = GHOST;
      ctx.font = '8.5px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Lag', padL + iW / 2, pTop + pad.top + iH + pad.bottom - 2);
    }
  }, [seriesIdx, showDiff, window_size, config]);

  useEffect(() => { draw(); }, [draw]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  const btnStyle = (active, color) => ({
    padding: '0.28rem 0.65rem',
    fontSize: '0.77rem',
    fontWeight: 600,
    border: `1px solid ${active ? (color || 'var(--prime)') : 'var(--rim)'}`,
    background: active ? `${color || 'var(--prime)'}22` : 'var(--depth)',
    color: active ? (color || 'var(--prime)') : 'var(--ink)',
    borderRadius: '5px',
    cursor: 'pointer',
  });

  const cfg = SERIES_CONFIG[seriesIdx];

  const reset = useCallback(() => {
    setSeriesIdx(0);
    setShowDiff(false);
  }, []);

  useImperativeHandle(ref, () => ({ reset }), [reset]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '0.55rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.1rem' }}>
          Stationarity & Differencing Visualizer
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          Top: time series · Middle: rolling mean & std · Bottom: ACF at lags 1–20
        </div>
      </div>

      {/* Series selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
        {SERIES_CONFIG.map((s, i) => (
          <button key={s.id} style={btnStyle(seriesIdx === i, s.color)} onClick={() => setSeriesIdx(i)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.2rem', marginBottom: '0.5rem', alignItems: 'center' }}>
        <button
          style={btnStyle(showDiff, PRIME)}
          onClick={() => setShowDiff(d => !d)}
        >
          {showDiff ? 'Showing: Δy_t (differenced)' : 'Show differenced'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.79rem' }}>
          <span style={{ color: 'var(--ink)' }}>
            Rolling window: <span style={{ color: 'var(--prime)', fontWeight: 700 }}>{window_size}</span>
          </span>
          <input
            type="range" min={10} max={30} step={1} value={window_size}
            onChange={e => setWindowSize(Number(e.target.value))}
            style={{ accentColor: 'var(--prime)', width: 100 }}
          />
        </div>
      </div>

      {/* ADF stats */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '0.77rem',
        marginBottom: '0.5rem',
        padding: '0.3rem 0.6rem',
        background: 'var(--depth)',
        borderRadius: '5px',
        border: `1px solid ${cfg.adf.stationary ? 'rgba(80,200,80,0.3)' : 'rgba(212,90,90,0.3)'}`,
        color: cfg.adf.stationary ? 'rgba(80,200,80,0.9)' : 'rgba(212,90,90,0.9)',
      }}>
        ADF statistic: {cfg.adf.stat.toFixed(1)}  (p {cfg.adf.p})
        {' '}
        {cfg.adf.stationary
          ? <span style={{ fontWeight: 700 }}>Stationary</span>
          : <span style={{ fontWeight: 700 }}>Non-stationary</span>}
        {showDiff && !cfg.adf.stationary && (
          <span style={{ color: 'rgba(80,200,80,0.85)', marginLeft: '0.8rem' }}>
            → after differencing: typically stationary
          </span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '420px', borderRadius: '6px', display: 'block', background: 'var(--depth)' }}
      />

      {/* Legend */}
      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem 1rem', fontSize: '0.73rem', color: 'var(--ink-ghost)' }}>
        {[
          { color: cfg.color, label: `${cfg.label} series` },
          { color: PRIME, label: 'Rolling mean' },
          { color: '#9b7fd4', label: 'Rolling std dev (dashed)' },
          { color: PRIME, label: 'ACF (within bounds)' },
          { color: cfg.color, label: 'ACF (exceeds bounds)' },
          { color: 'rgba(255,255,255,0.28)', label: '±1.96/√n bounds (dashed)' },
        ].map((it, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ display: 'inline-block', width: 14, height: 2, borderTop: `2px solid ${it.color}`, flexShrink: 0 }} />
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
})
