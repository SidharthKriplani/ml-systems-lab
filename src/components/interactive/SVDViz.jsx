import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ─── SVD for 2×2 matrix ───────────────────────────────────────────────────────
function svd2x2(a, b, c, d) {
  const ata00 = a * a + c * c;
  const ata01 = a * b + c * d;
  const ata11 = b * b + d * d;

  const trace = ata00 + ata11;
  const det = ata00 * ata11 - ata01 * ata01;
  const disc = Math.sqrt(Math.max(0, (trace / 2) ** 2 - det));
  const lam1 = trace / 2 + disc;
  const lam2 = trace / 2 - disc;
  const s1 = Math.sqrt(Math.max(0, lam1));
  const s2 = Math.sqrt(Math.max(0, lam2));

  let v1x, v1y;
  if (Math.abs(ata01) > 1e-10) {
    v1x = lam1 - ata11;
    v1y = ata01;
    const n = Math.hypot(v1x, v1y);
    v1x /= n;
    v1y /= n;
  } else {
    v1x = 1;
    v1y = 0;
  }
  const v2x = -v1y, v2y = v1x;

  let u1x = a * v1x + b * v1y;
  let u1y = c * v1x + d * v1y;
  if (s1 > 1e-10) {
    u1x /= s1;
    u1y /= s1;
  } else {
    u1x = 1;
    u1y = 0;
  }
  const u2x = -u1y, u2y = u1x;

  return {
    U: [[u1x, u2x], [u1y, u2y]],
    S: [s1, s2],
    Vt: [[v1x, v1y], [v2x, v2y]],
  };
}

// Interpolate between identity transform and full transform for animation
function interpolateTransform(mat, t) {
  // mat is [[m00,m01],[m10,m11]], t in [0,1]
  // lerp each entry from identity toward mat
  const I = [[1, 0], [0, 1]];
  return [
    [I[0][0] + (mat[0][0] - I[0][0]) * t, I[0][1] + (mat[0][1] - I[0][1]) * t],
    [I[1][0] + (mat[1][0] - I[1][0]) * t, I[1][1] + (mat[1][1] - I[1][1]) * t],
  ];
}

function matMul(A, B) {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
}

function applyMat(M, x, y) {
  return [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
}

// ─── Unit circle points ────────────────────────────────────────────────────────
function unitCircle(n = 100) {
  return Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / n;
    return [Math.cos(t), Math.sin(t)];
  });
}

// ─── Panel 1 draw ─────────────────────────────────────────────────────────────
function drawGeometric(canvas, a, b, c, d, animStep, animT) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.scale(dpr, dpr);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  const cs = getComputedStyle(document.documentElement);
  const depth = cs.getPropertyValue('--depth').trim() || '#111';
  const rim = cs.getPropertyValue('--rim').trim() || '#333';
  const inkLow = cs.getPropertyValue('--ink-low').trim() || '#666';
  const inkMid = cs.getPropertyValue('--ink-mid').trim() || '#999';
  const inkHi = cs.getPropertyValue('--ink-hi').trim() || '#eee';
  const prime = cs.getPropertyValue('--prime').trim() || '#F0A500';
  const STEEL = '#4a90d9';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const ox = W / 2;
  const oy = H / 2;
  const SCALE = Math.min(W, H) * 0.3;

  const toC = (x, y) => [ox + x * SCALE, oy - y * SCALE];

  // Grid
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
  ctx.setLineDash([2, 4]);
  ctx.lineWidth = 0.4;
  for (const t of [-1, -0.5, 0.5, 1]) {
    const xc = ox + t * SCALE;
    const yc = oy - t * SCALE;
    ctx.beginPath(); ctx.moveTo(xc, 0); ctx.lineTo(xc, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, yc); ctx.lineTo(W, yc); ctx.stroke();
  }
  ctx.setLineDash([]);

  const circle = unitCircle(100);

  // Compute SVD
  const { U, S, Vt } = svd2x2(a, b, c, d);

  // Matrices:
  // Vt  = [[Vt[0][0], Vt[0][1]], [Vt[1][0], Vt[1][1]]]  (2x2)
  // Sigma = [[S[0],0],[0,S[1]]]
  // U  = [[U[0][0], U[0][1]], [U[1][0], U[1][1]]]  (2x2)
  const Sigma = [[S[0], 0], [0, S[1]]];

  // Full A = U * Sigma * Vt
  const A = [[a, b], [c, d]];

  // Determine intermediate transform based on animStep and animT
  let M;
  if (animStep === 0) {
    // Idle: show final ellipse (A applied)
    M = A;
  } else if (animStep === 1) {
    // Step 1: animate applying Vt
    const Vt_interp = interpolateTransform(Vt, animT);
    M = Vt_interp;
  } else if (animStep === 2) {
    // Step 2: animate applying Sigma after Vt
    const SigmaInterp = interpolateTransform(Sigma, animT);
    M = matMul(SigmaInterp, Vt);
  } else if (animStep === 3) {
    // Step 3: animate applying U after Sigma*Vt
    const Uinterp = interpolateTransform(U, animT);
    M = matMul(Uinterp, matMul(Sigma, Vt));
  } else {
    M = A;
  }

  // Draw original unit circle (gray)
  ctx.beginPath();
  circle.forEach(([x, y], i) => {
    const [cx, cy] = toC(x, y);
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  });
  ctx.closePath();
  ctx.strokeStyle = `${inkMid}66`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw transformed ellipse (gold)
  const transformed = circle.map(([x, y]) => applyMat(M, x, y));
  ctx.beginPath();
  transformed.forEach(([tx, ty], i) => {
    const [cx, cy] = toC(tx, ty);
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  });
  ctx.closePath();
  ctx.strokeStyle = prime;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw principal axes as dashed lines (singular vectors scaled by singular values)
  // These are the columns of U scaled by S
  const ax1x = U[0][0] * S[0], ax1y = U[1][0] * S[0]; // first col of U * s1
  const ax2x = U[0][1] * S[1], ax2y = U[1][1] * S[1]; // second col of U * s2

  const drawAxis = (ex, ey, color, label) => {
    const [x1, y1] = toC(-ex, -ey);
    const [x2, y2] = toC(ex, ey);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Label
    ctx.fillStyle = color;
    ctx.font = `bold 11px var(--font-mono, monospace)`;
    const lx = x2 + (ex >= 0 ? 5 : -28);
    const ly = y2 + (ey >= 0 ? -5 : 14);
    ctx.fillText(label, lx, ly);
    ctx.restore();
  };

  if (animStep === 0 || animStep >= 3) {
    drawAxis(ax1x, ax1y, prime, `σ₁=${S[0].toFixed(2)}`);
    drawAxis(ax2x, ax2y, STEEL, `σ₂=${S[1].toFixed(2)}`);
  }

  // Axis labels
  ctx.fillStyle = inkLow;
  ctx.font = `10px var(--font-mono, monospace)`;
  ctx.fillText('x', W - 12, oy - 4);
  ctx.fillText('y', ox + 4, 10);

  // Step label if animating
  if (animStep >= 1) {
    const stepLabels = ['', 'Step 1: Rotate by Vᵀ', 'Step 2: Scale by Σ', 'Step 3: Rotate by U'];
    ctx.fillStyle = inkHi;
    ctx.font = `bold 11px var(--font-sans, sans-serif)`;
    ctx.fillText(stepLabels[animStep] || '', 10, 18);
  }
}

// ─── Panel 2: power iteration SVD for 8×8 ────────────────────────────────────
const DEMO_MATRIX = [
  [3, 1, 0, 2, 1, 0, 2, 1],
  [1, 4, 1, 0, 2, 1, 0, 2],
  [0, 1, 3, 1, 0, 2, 1, 0],
  [2, 0, 1, 4, 1, 0, 2, 1],
  [1, 2, 0, 1, 3, 1, 0, 2],
  [0, 1, 2, 0, 1, 4, 1, 0],
  [2, 0, 1, 2, 0, 1, 3, 1],
  [1, 2, 0, 1, 2, 0, 1, 4],
];

function matVec(A, v) {
  return A.map(row => row.reduce((s, a, j) => s + a * v[j], 0));
}

function matVecT(A, u) {
  const m = A[0].length;
  return Array.from({ length: m }, (_, j) =>
    A.reduce((s, row, i) => s + row[j] * u[i], 0)
  );
}

function powerIteration(A, k, iters = 80) {
  const n = A.length, m = A[0].length;
  const results = [];
  const Ar = A.map(row => [...row]);

  for (let r = 0; r < k; r++) {
    let v = new Array(m).fill(0).map((_, i) => (i === r % m ? 1 : 0.01 * (i + 1)));
    const vn = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    v = v.map(x => x / vn);

    for (let it = 0; it < iters; it++) {
      const Av = matVec(Ar, v);
      v = matVecT(Ar, Av);
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
      if (norm < 1e-10) break;
      v = v.map(x => x / norm);
    }
    const Av = matVec(Ar, v);
    const sigma = Math.sqrt(Av.reduce((s, x) => s + x * x, 0));
    if (sigma < 1e-10) break;
    const u = Av.map(x => x / sigma);
    results.push({ sigma, u, v });

    // Deflate
    for (let i = 0; i < n; i++)
      for (let j = 0; j < m; j++)
        Ar[i][j] -= sigma * u[i] * v[j];
  }
  return results;
}

function reconstruct(triplets, k, n, m) {
  const R = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let r = 0; r < Math.min(k, triplets.length); r++) {
    const { sigma, u, v } = triplets[r];
    for (let i = 0; i < n; i++)
      for (let j = 0; j < m; j++)
        R[i][j] += sigma * u[i] * v[j];
  }
  return R;
}

function frobeniusError(A, R) {
  let err = 0;
  for (let i = 0; i < A.length; i++)
    for (let j = 0; j < A[0].length; j++)
      err += (A[i][j] - R[i][j]) ** 2;
  return Math.sqrt(err);
}

function drawHeatmap(canvas, matrix, label) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.scale(dpr, dpr);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  const cs = getComputedStyle(document.documentElement);
  const depth = cs.getPropertyValue('--depth').trim() || '#111';
  const inkHi = cs.getPropertyValue('--ink-hi').trim() || '#eee';
  const inkLow = cs.getPropertyValue('--ink-low').trim() || '#666';
  const prime = cs.getPropertyValue('--prime').trim() || '#F0A500';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const n = matrix.length;
  const m = matrix[0].length;

  // Find min/max for color scale
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      mn = Math.min(mn, matrix[i][j]);
      mx = Math.max(mx, matrix[i][j]);
    }

  const PADDING = 4;
  const cellW = Math.floor((W - PADDING * 2) / m);
  const cellH = Math.floor((H - PADDING * 2) / n);
  const startX = PADDING + (W - PADDING * 2 - cellW * m) / 2;
  const startY = PADDING + (H - PADDING * 2 - cellH * n) / 2;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const t = mx > mn ? (matrix[i][j] - mn) / (mx - mn) : 0.5;
      // Color scale: deep blue -> gold
      const r = Math.round(t * 240 + (1 - t) * 30);
      const g = Math.round(t * 165 + (1 - t) * 60);
      const bl = Math.round(t * 0 + (1 - t) * 180);
      ctx.fillStyle = `rgb(${r},${g},${bl})`;
      ctx.fillRect(
        startX + j * cellW + 1,
        startY + i * cellH + 1,
        cellW - 2,
        cellH - 2
      );

      // Value label in cell
      ctx.fillStyle = t > 0.5 ? '#111' : '#eee';
      ctx.font = `bold ${Math.min(cellW, cellH) * 0.38}px var(--font-mono, monospace)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        matrix[i][j].toFixed(1),
        startX + j * cellW + cellW / 2,
        startY + i * cellH + cellH / 2
      );
    }
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  root: {
    fontFamily: 'var(--font-sans, sans-serif)',
    color: 'var(--ink-hi, #eee)',
    maxWidth: 900,
  },
  title: { margin: '0 0 4px 0', fontSize: 17, fontWeight: 700 },
  subtitle: {
    margin: '0 0 14px 0', fontSize: 13,
    color: 'var(--ink-low, #888)', fontFamily: 'var(--font-mono, monospace)',
  },
  panels: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  panelLeft: { flex: '0 0 55%', minWidth: 280 },
  panelRight: { flex: '0 0 40%', minWidth: 240 },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: 'var(--prime, #F0A500)',
    marginBottom: 8,
  },
  canvas: {
    display: 'block', width: '100%',
    borderRadius: 6, border: '1px solid var(--rim, #333)',
    background: 'var(--depth, #111)',
  },
  sliderRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 12, color: 'var(--ink-mid, #aaa)',
    fontFamily: 'var(--font-mono, monospace)',
    marginTop: 8,
  },
  sliderLabel: { width: 16, textAlign: 'right', color: 'var(--prime, #F0A500)', fontWeight: 700 },
  slider: { accentColor: 'var(--prime, #F0A500)', flex: 1 },
  sliderVal: { width: 36, textAlign: 'right' },
  statsRow: {
    display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap',
    fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
    color: 'var(--ink-mid, #aaa)',
  },
  statItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  statLabel: {
    fontSize: 10, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: 'var(--ink-low, #888)',
  },
  statVal: { color: 'var(--ink-hi, #eee)', fontSize: 13 },
  matrixDisplay: {
    marginTop: 8, padding: '6px 10px',
    background: 'rgba(255,255,255,0.04)', borderRadius: 5,
    border: '1px solid var(--rim, #333)',
    fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
    color: 'var(--ink-mid, #aaa)', lineHeight: 1.8,
  },
  rankButtons: { display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  rankBtn: (active) => ({
    padding: '4px 12px', borderRadius: 4, border: '1px solid',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'var(--font-mono, monospace)',
    background: active ? 'var(--prime, #F0A500)' : 'transparent',
    borderColor: active ? 'var(--prime, #F0A500)' : 'var(--rim, #444)',
    color: active ? '#111' : 'var(--ink-mid, #aaa)',
    transition: 'all 0.15s',
  }),
  animBtn: {
    marginTop: 10, padding: '5px 14px', borderRadius: 4,
    border: '1px solid var(--prime, #F0A500)',
    background: 'transparent', color: 'var(--prime, #F0A500)',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'var(--font-mono, monospace)',
  },
  errorRow: {
    marginTop: 8, display: 'flex', alignItems: 'center', gap: 10,
    fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
  },
  errorLabel: { color: 'var(--ink-low, #888)', fontSize: 10, textTransform: 'uppercase' },
  errorTrack: {
    flex: 1, height: 5, background: 'var(--rim, #333)',
    borderRadius: 3, overflow: 'hidden',
  },
};

// ─── Main component ───────────────────────────────────────────────────────────
export function SVDViz() {
  // Panel 1 state
  const [matA, setMatA] = useState({ a: 2, b: 1, c: -0.5, d: 1.5 });
  const canvasGeoRef = useRef(null);

  // Animation state
  const [animStep, setAnimStep] = useState(0); // 0=idle, 1=Vt, 2=Sigma, 3=U
  const [animT, setAnimT] = useState(1);
  const animRef = useRef(null);
  const animStateRef = useRef({ step: 0, t: 1 });

  // Panel 2 state
  const [rank, setRank] = useState(2);
  const canvasHeatRef = useRef(null);

  // Precompute SVD triplets for DEMO_MATRIX
  const triplets = useMemo(() => powerIteration(DEMO_MATRIX, 8), []);

  // Current SVD values
  const svd = useMemo(() => svd2x2(matA.a, matA.b, matA.c, matA.d), [matA]);

  // ─── Geometric canvas draw ──────────────────────────────────────────────────
  const redrawGeo = useCallback(() => {
    const canvas = canvasGeoRef.current;
    if (!canvas) return;
    drawGeometric(canvas, matA.a, matA.b, matA.c, matA.d, animStep, animT);
  }, [matA, animStep, animT]);

  useEffect(() => { redrawGeo(); }, [redrawGeo]);

  // ─── Heatmap draw ───────────────────────────────────────────────────────────
  const redrawHeat = useCallback(() => {
    const canvas = canvasHeatRef.current;
    if (!canvas) return;
    const k = rank === 'full' ? 8 : rank;
    const R = reconstruct(triplets, k, 8, 8);
    drawHeatmap(canvas, R, `Rank ${k}`);
  }, [rank, triplets]);

  useEffect(() => { redrawHeat(); }, [redrawHeat]);

  // ─── ResizeObserver for both canvases ───────────────────────────────────────
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      redrawGeo();
      redrawHeat();
    });
    if (canvasGeoRef.current) obs.observe(canvasGeoRef.current);
    if (canvasHeatRef.current) obs.observe(canvasHeatRef.current);
    return () => obs.disconnect();
  }, [redrawGeo, redrawHeat]);

  // ─── Animation ──────────────────────────────────────────────────────────────
  const startAnimation = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animStateRef.current = { step: 1, t: 0 };
    setAnimStep(1);
    setAnimT(0);

    const STEP_DUR = 900; // ms per step
    let startTime = null;

    const tick = (now) => {
      if (startTime === null) startTime = now;
      const { step } = animStateRef.current;
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / STEP_DUR);

      animStateRef.current.t = t;
      setAnimT(t);

      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else if (step < 3) {
        // Advance to next step
        const nextStep = step + 1;
        animStateRef.current.step = nextStep;
        animStateRef.current.t = 0;
        setAnimStep(nextStep);
        setAnimT(0);
        startTime = now;
        animRef.current = requestAnimationFrame(tick);
      } else {
        // Done
        animStateRef.current = { step: 0, t: 1 };
        setAnimStep(0);
        setAnimT(1);
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // Sync animStateRef with state for draw callback
  useEffect(() => {
    animStateRef.current = { step: animStep, t: animT };
  }, [animStep, animT]);

  // ─── Error for current rank ─────────────────────────────────────────────────
  const { error, maxError } = useMemo(() => {
    const k = rank === 'full' ? 8 : rank;
    const R = reconstruct(triplets, k, 8, 8);
    const err = frobeniusError(DEMO_MATRIX, R);
    const R0 = reconstruct(triplets, 0, 8, 8); // all zeros
    const maxErr = frobeniusError(DEMO_MATRIX, R0);
    return { error: err, maxError: maxErr };
  }, [rank, triplets]);

  const { S: sigmas } = svd;

  const RANK_OPTIONS = [1, 2, 4, 'full'];

  return (
    <div style={S.root}>
      <p style={S.title}>Singular Value Decomposition</p>
      <p style={S.subtitle}>A = UΣVᵀ — geometric transform + low-rank approximation</p>

      <div style={S.panels}>
        {/* ── Panel 1: Geometric SVD ──────────────────────────────────────── */}
        <div style={S.panelLeft}>
          <div style={S.sectionTitle}>Geometric View — A = UΣVᵀ</div>

          <canvas
            ref={canvasGeoRef}
            style={{ ...S.canvas, height: 260 }}
          />

          {/* Sliders */}
          {[['a', 'a'], ['b', 'b'], ['c', 'c'], ['d', 'd']].map(([key, lab]) => (
            <div key={key} style={S.sliderRow}>
              <span style={S.sliderLabel}>{lab}</span>
              <input
                type="range" min={-3} max={3} step={0.1}
                value={matA[key]}
                onChange={e => setMatA(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                style={S.slider}
              />
              <span style={S.sliderVal}>{matA[key].toFixed(1)}</span>
            </div>
          ))}

          {/* Matrix display */}
          <div style={S.matrixDisplay}>
            <span style={{ color: 'var(--ink-low, #888)' }}>A = </span>
            {`[[${matA.a.toFixed(1)}, ${matA.b.toFixed(1)}], [${matA.c.toFixed(1)}, ${matA.d.toFixed(1)}]]`}
            {'   '}
            <span style={{ color: 'var(--prime, #F0A500)' }}>σ₁={sigmas[0].toFixed(3)}</span>
            {'  '}
            <span style={{ color: '#4a90d9' }}>σ₂={sigmas[1].toFixed(3)}</span>
          </div>

          {/* Stats */}
          <div style={S.statsRow}>
            <div style={S.statItem}>
              <span style={S.statLabel}>σ₁ (major)</span>
              <span style={{ ...S.statVal, color: 'var(--prime, #F0A500)' }}>{sigmas[0].toFixed(4)}</span>
            </div>
            <div style={S.statItem}>
              <span style={S.statLabel}>σ₂ (minor)</span>
              <span style={{ ...S.statVal, color: '#4a90d9' }}>{sigmas[1].toFixed(4)}</span>
            </div>
            <div style={S.statItem}>
              <span style={S.statLabel}>Condition #</span>
              <span style={S.statVal}>
                {sigmas[1] > 1e-10 ? (sigmas[0] / sigmas[1]).toFixed(2) : '∞'}
              </span>
            </div>
            <div style={S.statItem}>
              <span style={S.statLabel}>|det A|</span>
              <span style={S.statVal}>{(sigmas[0] * sigmas[1]).toFixed(4)}</span>
            </div>
          </div>

          {/* Animate button */}
          <button style={S.animBtn} onClick={startAnimation}>
            {animStep === 0 ? 'Animate: Vᵀ → Σ → U' : 'Animating...'}
          </button>
        </div>

        {/* ── Panel 2: Low-rank approximation ────────────────────────────── */}
        <div style={S.panelRight}>
          <div style={S.sectionTitle}>Low-Rank Approximation — 8×8 Matrix</div>

          <div style={S.rankButtons}>
            {RANK_OPTIONS.map(r => (
              <button
                key={r}
                style={S.rankBtn(rank === r)}
                onClick={() => setRank(r)}
              >
                {r === 'full' ? 'Full' : `Rank ${r}`}
              </button>
            ))}
          </div>

          <canvas
            ref={canvasHeatRef}
            style={{ ...S.canvas, height: 220 }}
          />

          {/* Error bar */}
          <div style={S.errorRow}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <span style={S.errorLabel}>Frobenius error</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...S.statVal, fontSize: 13, fontFamily: 'var(--font-mono, monospace)', color: 'var(--prime, #F0A500)' }}>
                  {error.toFixed(3)}
                </span>
                <div style={S.errorTrack}>
                  <div style={{
                    width: `${maxError > 0 ? (error / maxError) * 100 : 0}%`,
                    height: '100%',
                    background: 'var(--prime, #F0A500)',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Singular values */}
          <div style={{ marginTop: 10 }}>
            <div style={S.statLabel}>Top singular values (power iteration)</div>
            <div style={{
              marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap',
              fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
            }}>
              {triplets.slice(0, 8).map((t, i) => (
                <span key={i} style={{
                  padding: '2px 7px', borderRadius: 3,
                  background: i < (rank === 'full' ? 8 : rank)
                    ? 'rgba(240,165,0,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i < (rank === 'full' ? 8 : rank)
                    ? 'rgba(240,165,0,0.4)' : 'var(--rim, #333)'}`,
                  color: i < (rank === 'full' ? 8 : rank)
                    ? 'var(--prime, #F0A500)' : 'var(--ink-low, #888)',
                }}>
                  σ{i + 1}={t.sigma.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
