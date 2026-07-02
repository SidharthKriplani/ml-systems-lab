import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// ─── Seeded RNG (mulberry32) ──────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Box–Muller using seeded rng
function randNormal(rng) {
  const u1 = Math.max(1e-15, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ─── Kernel ───────────────────────────────────────────────────────────────────
function rbf(x1, x2, sigmaF, l) {
  const d = x1 - x2;
  return sigmaF * sigmaF * Math.exp(-(d * d) / (2 * l * l));
}

// ─── Cholesky solve ───────────────────────────────────────────────────────────
function choleskyDecompose(A) {
  const n = A.length;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(1e-10, A[i][i] - sum));
      } else {
        L[i][j] = (A[i][j] - sum) / (L[j][j] + 1e-10);
      }
    }
  }
  return L;
}

function solveCholesky(L, b) {
  const n = L.length;
  const y = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) sum += L[i][j] * y[j];
    y[i] = (b[i] - sum) / (L[i][i] + 1e-10);
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) sum += L[j][i] * x[j];
    x[i] = (y[i] - sum) / (L[i][i] + 1e-10);
  }
  return x;
}

// ─── GP inference ─────────────────────────────────────────────────────────────
const N_PRED = 100;
const X_PRED = Array.from({ length: N_PRED }, (_, i) => i / (N_PRED - 1));

function computeGP(points, l, sigmaF, sigmaN) {
  if (points.length === 0) return null;

  const n = points.length;
  const Xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);

  // K_XX + sigma_n^2 * I
  const K = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => rbf(Xs[i], Xs[j], sigmaF, l) + (i === j ? sigmaN * sigmaN : 0))
  );

  const L = choleskyDecompose(K);
  const alpha = solveCholesky(L, ys);

  const mu = new Array(N_PRED);
  const variance = new Array(N_PRED);

  for (let s = 0; s < N_PRED; s++) {
    const xStar = X_PRED[s];
    const kStar = Xs.map(xi => rbf(xStar, xi, sigmaF, l));

    // mu* = k*^T alpha
    let muVal = 0;
    for (let i = 0; i < n; i++) muVal += kStar[i] * alpha[i];
    mu[s] = muVal;

    // var* = k(x*, x*) - k*^T K^{-1} k*
    // v = L^{-1} k* via forward substitution
    const v = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < i; j++) sum += L[i][j] * v[j];
      v[i] = (kStar[i] - sum) / (L[i][i] + 1e-10);
    }
    const vDotV = v.reduce((acc, vi) => acc + vi * vi, 0);
    variance[s] = Math.max(0, rbf(xStar, xStar, sigmaF, l) - vDotV);
  }

  return { mu, variance };
}

// ─── Prior samples (no observations) ─────────────────────────────────────────
function samplePrior(l, sigmaF, seed) {
  const rng = mulberry32(seed);
  // Build covariance matrix for X_PRED
  const n = N_PRED;
  const K = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => rbf(X_PRED[i], X_PRED[j], sigmaF, l) + (i === j ? 1e-6 : 0))
  );
  const L = choleskyDecompose(K);
  // Sample z ~ N(0, I), return L z
  const z = Array.from({ length: n }, () => randNormal(rng));
  const sample = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      sample[i] += L[i][j] * z[j];
    }
  }
  return sample;
}

// ─── Drawing ──────────────────────────────────────────────────────────────────
const MARGIN = { top: 16, right: 16, bottom: 30, left: 36 };
const Y_MIN = -3;
const Y_MAX = 3;

function toCanvasX(x, W) {
  return MARGIN.left + x * (W - MARGIN.left - MARGIN.right);
}

function toCanvasY(y, H) {
  const plotH = H - MARGIN.top - MARGIN.bottom;
  return MARGIN.top + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
}

function fromCanvasCoords(cx, cy, W, H) {
  const plotW = W - MARGIN.left - MARGIN.right;
  const plotH = H - MARGIN.top - MARGIN.bottom;
  const x = (cx - MARGIN.left) / plotW;
  const y = Y_MIN + (1 - (cy - MARGIN.top) / plotH) * (Y_MAX - Y_MIN);
  return [x, y];
}

function drawScene(canvas, points, l, sigmaF, sigmaN, priorSeeds) {
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  if (W === 0 || H === 0) return;

  const cs = getComputedStyle(document.documentElement);
  const prime     = cs.getPropertyValue('--prime').trim()     || '#F0A500';
  const depth     = cs.getPropertyValue('--depth').trim()     || '#111827';
  const rimColor  = cs.getPropertyValue('--rim').trim()       || '#2a2a2a';
  const inkLow    = cs.getPropertyValue('--ink-low').trim()   || '#555';
  const inkGhost  = cs.getPropertyValue('--ink-ghost').trim() || '#3a3a3a';
  const primeFaint = cs.getPropertyValue('--prime-faint').trim() || '#3a2e00';

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Plot area clip
  const plotW = W - MARGIN.left - MARGIN.right;
  const plotH = H - MARGIN.top - MARGIN.bottom;

  // Grid lines
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 0.5;
  for (let xi = 0; xi <= 5; xi++) {
    const x = xi / 5;
    const cx = toCanvasX(x, W);
    ctx.beginPath(); ctx.moveTo(cx, MARGIN.top); ctx.lineTo(cx, MARGIN.top + plotH); ctx.stroke();
  }
  for (let yi = Y_MIN; yi <= Y_MAX; yi++) {
    const cy = toCanvasY(yi, H);
    ctx.beginPath(); ctx.moveTo(MARGIN.left, cy); ctx.lineTo(MARGIN.left + plotW, cy); ctx.stroke();
  }

  // Axis labels
  ctx.fillStyle = inkLow;
  ctx.font = `10px var(--font-mono, monospace)`;
  ctx.textAlign = 'center';
  for (let xi = 0; xi <= 5; xi++) {
    const x = xi / 5;
    const cx = toCanvasX(x, W);
    ctx.fillText(x.toFixed(1), cx, H - 4);
  }
  ctx.textAlign = 'right';
  for (let yi = Y_MIN; yi <= Y_MAX; yi++) {
    const cy = toCanvasY(yi, H);
    ctx.fillText(yi.toString(), MARGIN.left - 4, cy + 4);
  }

  // Zero line
  ctx.strokeStyle = inkLow;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4, 4]);
  const cy0 = toCanvasY(0, H);
  ctx.beginPath(); ctx.moveTo(MARGIN.left, cy0); ctx.lineTo(MARGIN.left + plotW, cy0); ctx.stroke();
  ctx.setLineDash([]);

  if (points.length === 0) {
    // Draw 5 prior sample paths
    const alphas = [0.55, 0.45, 0.40, 0.50, 0.42];
    for (let s = 0; s < 5; s++) {
      const sample = samplePrior(l, sigmaF, priorSeeds[s]);
      ctx.beginPath();
      for (let i = 0; i < N_PRED; i++) {
        const cx = toCanvasX(X_PRED[i], W);
        const cy = toCanvasY(sample[i], H);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      // inkGhost with varying opacity
      ctx.strokeStyle = inkGhost;
      ctx.globalAlpha = alphas[s];
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  } else {
    const gp = computeGP(points, l, sigmaF, sigmaN);
    if (gp) {
      const { mu, variance } = gp;

      // 95% CI band
      ctx.beginPath();
      for (let i = 0; i < N_PRED; i++) {
        const cx = toCanvasX(X_PRED[i], W);
        const hi = mu[i] + 1.96 * Math.sqrt(variance[i]);
        const cy = toCanvasY(hi, H);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      for (let i = N_PRED - 1; i >= 0; i--) {
        const cx = toCanvasX(X_PRED[i], W);
        const lo = mu[i] - 1.96 * Math.sqrt(variance[i]);
        const cy = toCanvasY(lo, H);
        ctx.lineTo(cx, cy);
      }
      ctx.closePath();
      // semi-transparent band
      ctx.fillStyle = primeFaint || 'rgba(240,165,0,0.15)';
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Posterior mean
      ctx.beginPath();
      for (let i = 0; i < N_PRED; i++) {
        const cx = toCanvasX(X_PRED[i], W);
        const cy = toCanvasY(mu[i], H);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.strokeStyle = prime;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  // Observation points
  for (const [px, py] of points) {
    const cx = toCanvasX(px, W);
    const cy = toCanvasY(py, H);
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = prime;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
const PRIOR_SEEDS = [42, 137, 256, 512, 999];

export const GaussianProcessViz = forwardRef(function GaussianProcessViz(props, ref) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [l, setL] = useState(0.3);
  const [sigmaF, setSigmaF] = useState(1.0);
  const [sigmaN, setSigmaN] = useState(0.1);

  // Params ref for use in resize observer without stale closure
  const stateRef = useRef({ points, l, sigmaF, sigmaN });
  useEffect(() => {
    stateRef.current = { points, l, sigmaF, sigmaN };
  });

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const { points: p, l: lv, sigmaF: sf, sigmaN: sn } = stateRef.current;
    drawScene(canvas, p, lv, sf, sn, PRIOR_SEEDS);
  }, []);

  // ResizeObserver — set canvas backing store size and redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      redraw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw on state changes
  useEffect(() => {
    redraw();
  }, [points, l, sigmaF, sigmaN, redraw]);

  // ── Interaction helpers ───────────────────────────────────────────────────
  const getXY = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    return fromCanvasCoords(cx, cy, rect.width, rect.height);
  }, []);

  const findNearest = useCallback((x, y) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const [px, py] = points[i];
      const cx = toCanvasX(px, rect.width);
      const cy = toCanvasY(py, rect.height);
      const mx = toCanvasX(x, rect.width);
      const my = toCanvasY(y, rect.height);
      const d = Math.hypot(mx - cx, my - cy);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return bestDist < 14 ? best : -1;
  }, [points]);

  const handleClick = useCallback((e) => {
    if (e.button !== 0) return;
    const [x, y] = getXY(e);
    if (x < 0 || x > 1) return;
    const idx = findNearest(x, y);
    if (idx !== -1) return;
    setPoints(prev => [...prev, [x, Math.max(Y_MIN, Math.min(Y_MAX, y))]]);
  }, [getXY, findNearest]);

  const handleDoubleClick = useCallback((e) => {
    const [x, y] = getXY(e);
    const idx = findNearest(x, y);
    if (idx !== -1) setPoints(prev => prev.filter((_, i) => i !== idx));
  }, [getXY, findNearest]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const [x, y] = getXY(e);
    const idx = findNearest(x, y);
    if (idx !== -1) setPoints(prev => prev.filter((_, i) => i !== idx));
  }, [getXY, findNearest]);

  // "Add 5 points" — y ~ sin(2πx) + noise, seeded
  const addFivePoints = useCallback(() => {
    const rng = mulberry32(Date.now() & 0xffffffff);
    const newPts = Array.from({ length: 5 }, () => {
      const x = rng();
      const y = Math.sin(2 * Math.PI * x) + 0.3 * randNormal(rng);
      return [x, Math.max(Y_MIN, Math.min(Y_MAX, y))];
    });
    setPoints(prev => [...prev, ...newPts]);
  }, []);

  const addOnePoint = useCallback(() => {
    setPoints(prev => {
      const rng = mulberry32((Date.now() + prev.length * 1337) & 0xffffffff);
      const x = rng();
      const y = Math.sin(2 * Math.PI * x) + 0.3 * randNormal(rng);
      return [...prev, [x, Math.max(Y_MIN, Math.min(Y_MAX, y))]];
    });
  }, []);

  const play = useCallback(() => {
    // Restart from the beginning every time: cancel any running loop and
    // clear all observations so the GP re-fills from the prior.
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    setPoints([]);
    let lastTime = 0;
    const tick = (time) => {
      if (time - lastTime >= 800) {
        lastTime = time;
        setPoints(prev => {
          if (prev.length >= 20) {
            if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
            return prev;
          }
          const rng = mulberry32((Date.now() + prev.length * 1337) & 0xffffffff);
          const x = rng();
          const y = Math.sin(2 * Math.PI * x) + 0.3 * randNormal(rng);
          return [...prev, [x, Math.max(Y_MIN, Math.min(Y_MAX, y))]];
        });
      }
      if (animRef.current !== null) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const pause = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }, []);

  const resetPoints = useCallback(() => {
    pause();
    setPoints([]);
  }, [pause]);

  useImperativeHandle(ref, () => ({
    play,
    pause,
    reset: resetPoints,
    step: addOnePoint,
  }), [play, pause, resetPoints, addOnePoint]);

  // ── Button style ──────────────────────────────────────────────────────────
  const btnStyle = {
    padding: '6px 14px',
    borderRadius: '4px',
    border: '1px solid var(--rim, #333)',
    background: 'var(--surface, #1a1a1a)',
    color: 'var(--ink-mid, #888)',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans, sans-serif)',
  };

  const sliderRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--ink-mid, #888)',
  };

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={{
          width: '100%',
          height: '340px',
          borderRadius: '6px',
          border: '1px solid var(--rim, #2a2a2a)',
          cursor: 'crosshair',
          display: 'block',
          background: 'var(--depth, #111827)',
        }}
      />

      {/* Sliders */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '6px',
        padding: '12px 16px',
      }}>
        <div style={sliderRowStyle}>
          <span style={{ minWidth: '160px' }}>{`Length scale: ${l.toFixed(2)}`}</span>
          <input
            type="range" min="0.05" max="1.0" step="0.05"
            value={l}
            onChange={e => setL(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--prime, #F0A500)' }}
          />
        </div>
        <div style={sliderRowStyle}>
          <span style={{ minWidth: '160px' }}>{`Signal std: ${sigmaF.toFixed(1)}`}</span>
          <input
            type="range" min="0.1" max="3.0" step="0.1"
            value={sigmaF}
            onChange={e => setSigmaF(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--prime, #F0A500)' }}
          />
        </div>
        <div style={sliderRowStyle}>
          <span style={{ minWidth: '160px' }}>{`Noise: ${sigmaN.toFixed(2)}`}</span>
          <input
            type="range" min="0.01" max="0.5" step="0.01"
            value={sigmaN}
            onChange={e => setSigmaN(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--prime, #F0A500)' }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setPoints([])} style={btnStyle}>
          Reset points
        </button>
        <button onClick={addFivePoints} style={btnStyle}>
          Add 5 points
        </button>
      </div>

      {/* Info */}
      <div style={{
        display: 'flex',
        gap: '24px',
        fontSize: '12px',
        fontFamily: 'var(--font-mono, monospace)',
        color: 'var(--ink-low, #555)',
      }}>
        <span>{`n observations: ${points.length}`}</span>
        <span>{`Click to add · Right-click to remove`}</span>
      </div>
    </div>
  );
})
