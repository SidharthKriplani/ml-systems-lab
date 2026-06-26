import { useState, useRef, useEffect, useCallback } from 'react';

const INITIAL_POINTS = [
  [0.1, 0.15], [0.2, 0.25], [0.3, 0.20], [0.35, 0.40], [0.45, 0.45],
  [0.55, 0.50], [0.6, 0.58], [0.7, 0.65], [0.8, 0.72], [0.9, 0.85],
];

const POINT_RADIUS = 6;
const HIT_RADIUS = 10;

function computeOLS(points) {
  const n = points.length;
  if (n < 2) return null;

  const xMean = points.reduce((s, p) => s + p[0], 0) / n;
  const yMean = points.reduce((s, p) => s + p[1], 0) / n;

  let num = 0;
  let den = 0;
  for (const [x, y] of points) {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  }

  if (den === 0) return null;

  const slope = num / den;
  const intercept = yMean - slope * xMean;

  let ssRes = 0;
  let ssTot = 0;
  for (const [x, y] of points) {
    const yHat = slope * x + intercept;
    ssRes += (y - yHat) ** 2;
    ssTot += (y - yMean) ** 2;
  }

  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2, xMean, yMean };
}

function toCanvas(x, y, w, h) {
  return { cx: x * w, cy: (1 - y) * h };
}

function fromCanvas(cx, cy, w, h) {
  return [cx / w, 1 - cy / h];
}

function drawScene(canvas, points, showResiduals) {
  const ctx = canvas.getContext('2d');
  const { width: W, height: H } = canvas;
  const cs = getComputedStyle(document.documentElement);
  const prime    = cs.getPropertyValue('--prime').trim()    || '#F0A500';
  const depth    = cs.getPropertyValue('--depth').trim()    || '#111827';
  const rimColor = cs.getPropertyValue('--rim').trim()      || '#2a2a2a';
  const inkLow   = cs.getPropertyValue('--ink-low').trim()  || '#555';
  const inkMid   = cs.getPropertyValue('--ink-mid').trim()  || '#888';

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const gx = (i / 10) * W;
    const gy = (i / 10) * H;
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // Axis tick labels
  ctx.fillStyle = inkLow;
  ctx.font = `10px var(--font-mono, monospace)`;
  ctx.textAlign = 'center';
  for (let i = 0; i <= 10; i += 2) {
    const v = (i / 10).toFixed(1);
    const gx = (i / 10) * W;
    const gy = H - (i / 10) * H;
    ctx.fillText(v, gx, H - 3);
    ctx.textAlign = 'right';
    ctx.fillText(v, 18, gy + 3);
    ctx.textAlign = 'center';
  }

  const ols = computeOLS(points);

  if (ols) {
    const { slope, intercept } = ols;

    // Regression line — clamp endpoints to canvas
    const yAtX0 = intercept;
    const yAtX1 = slope + intercept;
    const { cx: x0, cy: y0 } = toCanvas(0, yAtX0, W, H);
    const { cx: x1, cy: y1 } = toCanvas(1, yAtX1, W, H);

    ctx.strokeStyle = '#4a9ebb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Residuals
    if (showResiduals) {
      ctx.strokeStyle = inkMid;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      for (const [px, py] of points) {
        const yHat = slope * px + intercept;
        const { cx, cy } = toCanvas(px, py, W, H);
        const { cy: cyHat } = toCanvas(px, yHat, W, H);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cyHat);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }

  // Points
  for (const [px, py] of points) {
    const { cx, cy } = toCanvas(px, py, W, H);
    ctx.beginPath();
    ctx.arc(cx, cy, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = prime;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function LinearRegressionViz() {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState(INITIAL_POINTS.map(p => [...p]));
  const [showResiduals, setShowResiduals] = useState(false);

  const ols = computeOLS(points);

  // Draw whenever points or showResiduals change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawScene(canvas, points, showResiduals);
  }, [points, showResiduals]);

  // Handle canvas resize / initial size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      const ctx = canvas.getContext('2d');
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      drawScene(canvas, points, showResiduals);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw on points/residuals change (also covers post-resize)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    drawScene(canvas, points, showResiduals);
  }, [points, showResiduals]);

  const getCanvasXY = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    // logical size = rect size (DPR scaling is on the canvas pixel buffer only)
    return fromCanvas(cx, cy, rect.width, rect.height);
  }, []);

  const findNearPoint = useCallback((x, y) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    for (let i = 0; i < points.length; i++) {
      const [px, py] = points[i];
      const { cx, cy } = toCanvas(px, py, W, H);
      const mx = x * W;
      const my = (1 - y) * H;
      if (Math.hypot(mx - cx, my - cy) <= HIT_RADIUS) return i;
    }
    return -1;
  }, [points]);

  const handleClick = useCallback((e) => {
    if (e.button !== 0) return;
    const [x, y] = getCanvasXY(e);
    const idx = findNearPoint(x, y);
    if (idx !== -1) return; // don't add on top of existing point
    // Clamp to [0,1]
    const cx = Math.max(0, Math.min(1, x));
    const cy = Math.max(0, Math.min(1, y));
    setPoints(prev => [...prev, [cx, cy]]);
  }, [getCanvasXY, findNearPoint]);

  const handleDoubleClick = useCallback((e) => {
    const [x, y] = getCanvasXY(e);
    const idx = findNearPoint(x, y);
    if (idx !== -1) {
      setPoints(prev => prev.filter((_, i) => i !== idx));
    }
  }, [getCanvasXY, findNearPoint]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const [x, y] = getCanvasXY(e);
    const idx = findNearPoint(x, y);
    if (idx !== -1) {
      setPoints(prev => prev.filter((_, i) => i !== idx));
    }
  }, [getCanvasXY, findNearPoint]);

  const r2Color = ols
    ? ols.r2 >= 0.8
      ? '#22c55e'
      : ols.r2 >= 0.5
        ? 'var(--prime, #F0A500)'
        : '#ef4444'
    : 'var(--ink-mid)';

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Instruction text */}
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: 'var(--ink-low, #555)',
        fontFamily: 'var(--font-mono, monospace)',
      }}>
        {`Click to add points · Right-click or double-click to remove`}
      </p>

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
        }}
      />

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setShowResiduals(v => !v)}
          style={{
            padding: '6px 14px',
            borderRadius: '4px',
            border: `1px solid ${showResiduals ? 'var(--prime, #F0A500)' : 'var(--rim, #333)'}`,
            background: showResiduals ? 'var(--prime-faint, #3a2e00)' : 'var(--surface, #1a1a1a)',
            color: showResiduals ? 'var(--prime, #F0A500)' : 'var(--ink-mid, #888)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans, sans-serif)',
          }}
        >
          {showResiduals ? 'Hide residuals' : 'Show residuals'}
        </button>
        <button
          onClick={() => setPoints(INITIAL_POINTS.map(p => [...p]))}
          style={{
            padding: '6px 14px',
            borderRadius: '4px',
            border: '1px solid var(--rim, #333)',
            background: 'var(--surface, #1a1a1a)',
            color: 'var(--ink-mid, #888)',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans, sans-serif)',
          }}
        >
          Reset
        </button>
      </div>

      {/* Stats */}
      {points.length < 2 ? (
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: 'var(--ink-mid, #888)',
          fontStyle: 'italic',
        }}>
          Add at least 2 points to fit a line
        </p>
      ) : ols ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, auto)',
          gap: '6px 24px',
          justifyContent: 'start',
          fontSize: '13px',
          fontFamily: 'var(--font-mono, monospace)',
          background: 'var(--surface, #1a1a1a)',
          border: '1px solid var(--rim, #2a2a2a)',
          borderRadius: '6px',
          padding: '10px 16px',
        }}>
          <span style={{ color: 'var(--ink-low, #555)' }}>Slope β₁</span>
          <span style={{ color: 'var(--ink-hi, #e5e5e5)' }}>{ols.slope.toFixed(4)}</span>

          <span style={{ color: 'var(--ink-low, #555)' }}>Intercept β₀</span>
          <span style={{ color: 'var(--ink-hi, #e5e5e5)' }}>{ols.intercept.toFixed(4)}</span>

          <span style={{ color: 'var(--ink-low, #555)' }}>R²</span>
          <span style={{ color: r2Color, fontWeight: 600 }}>{ols.r2.toFixed(4)}</span>

          <span style={{ color: 'var(--ink-low, #555)' }}>n points</span>
          <span style={{ color: 'var(--ink-hi, #e5e5e5)' }}>{points.length}</span>
        </div>
      ) : (
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: 'var(--ink-mid, #888)',
          fontStyle: 'italic',
        }}>
          All points share the same x value — slope is undefined
        </p>
      )}

      {/* Note */}
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: 'var(--ink-ghost, #3a3a3a)',
        lineHeight: '1.6',
        borderTop: '1px solid var(--rim, #2a2a2a)',
        paddingTop: '10px',
      }}>
        {`OLS minimizes Σ(yᵢ − ŷᵢ)² — the sum of squared residuals. R² measures how much of the variance in y is explained by x. R² = 1 means perfect fit. R² = 0 means the line explains nothing.`}
      </p>
    </div>
  );
}
