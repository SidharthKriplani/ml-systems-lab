import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// Seeded RNG — mulberry32
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng) {
  // Box-Muller
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function generateData() {
  const rng = mulberry32(0xdeadbeef);
  const points = [];
  for (let i = 0; i < 20; i++) {
    const x = rng() * 2; // [0, 2]
    const y = Math.sin(Math.PI * x) + randn(rng) * 0.25;
    points.push([x, y]);
  }
  return points;
}

const DATA = generateData();

// ---- linear algebra ----
function matMul(A, B) {
  const m = A.length, n = B[0].length, p = B.length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let k = 0; k < p; k++)
      for (let j = 0; j < n; j++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

function transpose(A) {
  const m = A.length, n = A[0].length;
  const T = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      T[j][i] = A[i][j];
  return T;
}

// Gaussian elimination with partial pivoting — solves Ax = b in-place copy
function solveLinear(A, b) {
  const n = A.length;
  // Augmented matrix
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    if (Math.abs(M[col][col]) < 1e-12) continue; // singular column

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++)
        M[row][j] -= factor * M[col][j];
    }
  }

  return M.map((row, i) =>
    Math.abs(M[i][i]) < 1e-14 ? 0 : row[n] / M[i][i]
  );
}

function fitPoly(points, degree) {
  const n = points.length;
  const d = degree;

  // Vandermonde matrix X: n × (d+1)
  const X = points.map(([x]) =>
    Array.from({ length: d + 1 }, (_, k) => Math.pow(x, k))
  );
  const y = points.map(([, yv]) => yv);

  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const Xty = matMul(Xt, y.map(v => [v])).map(r => r[0]);

  try {
    return solveLinear(XtX, Xty);
  } catch {
    return null;
  }
}

function evalPoly(coeffs, x) {
  return coeffs.reduce((sum, c, k) => sum + c * Math.pow(x, k), 0);
}

function computeMSE(points, coeffs) {
  const errors = points.map(([x, y]) => (y - evalPoly(coeffs, x)) ** 2);
  return errors.reduce((a, b) => a + b, 0) / points.length;
}

// ---- canvas drawing ----
const X_MIN = 0, X_MAX = 2;
const Y_MIN = -1.8, Y_MAX = 1.8;

function toCanvasCoords(x, y, W, H) {
  const cx = ((x - X_MIN) / (X_MAX - X_MIN)) * W;
  const cy = H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;
  return [cx, cy];
}

function drawScene(canvas, degree, coeffs) {
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const cs = getComputedStyle(document.documentElement);

  const depth    = cs.getPropertyValue('--depth').trim()    || '#111827';
  const rimColor = cs.getPropertyValue('--rim').trim()      || '#2a2a2a';
  const inkLow   = cs.getPropertyValue('--ink-low').trim()  || '#555';
  const prime    = cs.getPropertyValue('--prime').trim()    || '#F0A500';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const gx = (i / 4) * W;
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let i = 0; i <= 6; i++) {
    const gy = (i / 6) * H;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // True function — dashed steel blue
  ctx.strokeStyle = '#5b8db8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  const STEPS = 200;
  for (let i = 0; i <= STEPS; i++) {
    const x = X_MIN + (i / STEPS) * (X_MAX - X_MIN);
    const y = Math.sin(Math.PI * x);
    const [cx, cy] = toCanvasCoords(x, y, W, H);
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Fitted polynomial — amber
  if (coeffs) {
    ctx.strokeStyle = prime;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const x = X_MIN + (i / STEPS) * (X_MAX - X_MIN);
      const y = evalPoly(coeffs, x);
      const yC = Math.max(Y_MIN - 0.5, Math.min(Y_MAX + 0.5, y));
      const [cx, cy] = toCanvasCoords(x, yC, W, H);
      i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Data points
  for (const [x, y] of DATA) {
    const [cx, cy] = toCanvasCoords(x, y, W, H);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(160, 160, 170, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Legend
  ctx.font = `11px var(--font-mono, monospace)`;
  ctx.textAlign = 'left';

  // True function legend
  ctx.strokeStyle = '#5b8db8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.beginPath(); ctx.moveTo(10, 14); ctx.lineTo(34, 14); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#5b8db8';
  ctx.fillText('True function', 38, 18);

  // Fitted legend
  ctx.strokeStyle = prime;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(10, 30); ctx.lineTo(34, 30); ctx.stroke();
  ctx.fillStyle = prime;
  ctx.fillText(`Fitted degree-${degree} poly`, 38, 34);

  // Y-axis labels
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.textAlign = 'right';
  for (const v of [-1.5, -1, -0.5, 0, 0.5, 1, 1.5]) {
    const [, cy] = toCanvasCoords(0, v, W, H);
    ctx.fillText(v.toFixed(1), 22, cy + 3);
  }
  ctx.textAlign = 'center';
  for (const v of [0, 0.5, 1, 1.5, 2]) {
    const [cx] = toCanvasCoords(v, 0, W, H);
    ctx.fillText(v.toFixed(1), cx, H - 4);
  }
}

export const BiasVarianceViz = forwardRef(function BiasVarianceViz(props, ref) {
  const [degree, setDegree] = useState(3);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const coeffs = fitPoly(DATA, degree);
  const mse = coeffs ? computeMSE(DATA, coeffs) : null;

  const regime =
    degree <= 2 ? 'under' :
    degree <= 5 ? 'good'  : 'over';

  const regimeNote =
    degree <= 2
      ? 'Underfitting — high bias, model too simple to capture the curve'
      : degree <= 5
      ? 'Good fit — reasonable balance of bias and variance'
      : 'Overfitting — low bias but high variance, wiggles to hit every training point';

  const noteColor =
    regime === 'good' ? '#22c55e' : '#ef4444';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      drawScene(canvas, degree, coeffs);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    drawScene(canvas, degree, coeffs);
  }, [degree, coeffs]);

  const pause = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }, []);

  const play = useCallback(() => {
    if (animRef.current) return;
    const tick = () => {
      setDegree(d => {
        const nd = d >= 12 ? 12 : d + 1;
        if (nd >= 12) {
          animRef.current = null;
          return nd;
        }
        animRef.current = requestAnimationFrame(tick);
        return nd;
      });
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const reset = useCallback(() => {
    pause();
    setDegree(1);
  }, [pause]);

  const step = useCallback(() => {
    pause();
    setDegree(d => Math.min(d + 1, 12));
  }, [pause]);

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step]);

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Degree slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{
          fontSize: '13px',
          color: 'var(--ink-mid, #888)',
          fontFamily: 'var(--font-mono, monospace)',
          whiteSpace: 'nowrap',
        }}>
          Polynomial degree:
        </label>
        <input
          type="range"
          min={1}
          max={12}
          value={degree}
          onChange={e => setDegree(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--prime, #F0A500)' }}
        />
        <span style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--prime, #F0A500)',
          fontFamily: 'var(--font-mono, monospace)',
          minWidth: '20px',
          textAlign: 'right',
        }}>
          {degree}
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '220px',
          borderRadius: '6px',
          border: '1px solid var(--rim, #2a2a2a)',
          display: 'block',
        }}
      />

      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: '24px',
        fontSize: '13px',
        fontFamily: 'var(--font-mono, monospace)',
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '6px',
        padding: '10px 16px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <div>
          <span style={{ color: 'var(--ink-low, #555)' }}>Training MSE: </span>
          <span style={{ color: 'var(--ink-hi, #e5e5e5)', fontWeight: 600 }}>
            {mse !== null ? mse.toFixed(5) : 'N/A'}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--ink-low, #555)' }}>Degree: </span>
          <span style={{ color: 'var(--prime, #F0A500)', fontWeight: 600 }}>
            {degree}
          </span>
        </div>
      </div>

      {/* Regime note */}
      <p style={{
        margin: 0,
        fontSize: '13px',
        color: noteColor,
        fontStyle: 'italic',
        lineHeight: '1.6',
      }}>
        {regimeNote}
      </p>

      {/* Footer note */}
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: 'var(--ink-ghost, #3a3a3a)',
        lineHeight: '1.6',
        borderTop: '1px solid var(--rim, #2a2a2a)',
        paddingTop: '10px',
      }}>
        {`20 points from y = sin(πx) + noise (σ=0.25). Fit via normal equations: β = (XᵀX)⁻¹Xᵀy. MSE is measured on the training set only — validation loss would tell the full story.`}
      </p>
    </div>
  );
})
