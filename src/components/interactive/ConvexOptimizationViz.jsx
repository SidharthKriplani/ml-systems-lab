import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Loss functions ───────────────────────────────────────────────────────────
function lossConvex(x) { return (x + 1) ** 2; }
function lossNonConvex(x) { return x ** 4 - 4 * x ** 2 + x + 3; }

function gradConvex(x) { return 2 * (x + 1); }
function gradNonConvex(x) { return 4 * x ** 3 - 8 * x + 1; }

function gdConvex(start, lr, steps) {
  let x = start;
  const path = [x];
  for (let i = 0; i < steps; i++) {
    const g = gradConvex(x);
    x -= lr * g;
    path.push(x);
    if (Math.abs(g) < 0.001) break;
  }
  return path;
}

function gdNonConvex(start, lr, steps) {
  let x = start;
  const path = [x];
  for (let i = 0; i < steps; i++) {
    const g = gradNonConvex(x);
    x -= lr * g;
    path.push(x);
    if (Math.abs(g) < 0.001) break;
  }
  return path;
}

// ─── 2D GD for right panel ────────────────────────────────────────────────────
function runGD2D(kappa, lr, steps = 80) {
  let w1 = 1.5, w2 = 1.5;
  const path = [[w1, w2]];
  for (let i = 0; i < steps; i++) {
    w1 -= lr * 2 * kappa * w1;
    w2 -= lr * 2 * w2;
    path.push([w1, w2]);
    if (Math.hypot(w1, w2) < 0.01) break;
  }
  return path;
}

const KAPPAS = [1, 5, 10, 20, 50];
const KAPPA_COLORS = ['#4a9ebb', '#7fd47f', '#f5b942', '#e07b4a', '#d45a5a'];
const X_MIN = -2.5, X_MAX = 2.5;
const W1_MIN = -2, W1_MAX = 2, W2_MIN = -2, W2_MAX = 2;
const GHOST = 'rgba(255,255,255,0.38)';
const RIM = 'rgba(255,255,255,0.1)';
const BG = '#111';
const PRIME = '#f5b942';

// ─── Draw left panel ──────────────────────────────────────────────────────────
function drawLeft(ctx, W, H, isConvex, lr, startX) {
  const lossFn = isConvex ? lossConvex : lossNonConvex;
  const gdFn = isConvex ? gdConvex : gdNonConvex;

  // Sample curve
  const N = 400;
  const xs = Array.from({ length: N }, (_, i) => X_MIN + (X_MAX - X_MIN) * i / (N - 1));
  const ys = xs.map(lossFn);
  const yMin = Math.min(...ys) - 0.5;
  const yMax = Math.max(...ys) + 0.5;
  const yRange = yMax - yMin;

  const pad = { top: 28, left: 48, right: 16, bottom: 28 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  function toCanvasX(x) { return pad.left + (x - X_MIN) / (X_MAX - X_MIN) * iW; }
  function toCanvasY(y) { return pad.top + iH - (y - yMin) / yRange * iH; }

  // Panel title
  ctx.fillStyle = GHOST;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(isConvex ? 'Convex: L(x) = (x+1)²' : 'Non-convex: L(x) = x⁴ − 4x² + x + 3', pad.left, 14);

  // Grid lines
  ctx.strokeStyle = RIM;
  ctx.lineWidth = 0.6;
  const nGridY = 4;
  for (let i = 0; i <= nGridY; i++) {
    const v = yMin + yRange * i / nGridY;
    const cy = toCanvasY(v);
    ctx.beginPath(); ctx.moveTo(pad.left, cy); ctx.lineTo(pad.left + iW, cy); ctx.stroke();
    ctx.fillStyle = GHOST;
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(v.toFixed(1), pad.left - 4, cy + 3);
  }

  // Shade regions for non-convex
  if (!isConvex) {
    // local min near x ≈ -1.07, global min near x ≈ 1.37
    const localMinX = -1.07;
    const globalMinX = 1.37;
    // shade around local min (red-ish)
    ctx.fillStyle = 'rgba(220,80,80,0.10)';
    const lx1 = toCanvasX(-2.5), lx2 = toCanvasX(0.3);
    ctx.fillRect(lx1, pad.top, lx2 - lx1, iH);
    // shade around global min (green-ish)
    ctx.fillStyle = 'rgba(80,180,80,0.10)';
    const gx1 = toCanvasX(0.3), gx2 = toCanvasX(2.5);
    ctx.fillRect(gx1, pad.top, gx2 - gx1, iH);
    // labels
    ctx.fillStyle = 'rgba(220,80,80,0.55)';
    ctx.font = '8.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('local min', toCanvasX(localMinX), pad.top + 12);
    ctx.fillStyle = 'rgba(80,180,80,0.55)';
    ctx.fillText('global min', toCanvasX(globalMinX), pad.top + 12);
  }

  // Loss curve
  ctx.strokeStyle = PRIME;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const cx = toCanvasX(xs[i]);
    const cy = toCanvasY(ys[i]);
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  // GD path
  const path = gdFn(startX, lr, 200);
  if (path.length > 1) {
    for (let i = 0; i < path.length - 1; i++) {
      const t = i / (path.length - 2);
      // gold → red
      const r = Math.round(245 + (200 - 245) * t);
      const g = Math.round(185 - 185 * t);
      const b = Math.round(66 - 66 * t);
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(path[i]), toCanvasY(lossFn(path[i])));
      ctx.lineTo(toCanvasX(path[i + 1]), toCanvasY(lossFn(path[i + 1])));
      ctx.stroke();
    }

    // Dots along path (skip some for readability)
    const step = Math.max(1, Math.floor(path.length / 20));
    for (let i = 0; i < path.length; i += step) {
      const t = i / (path.length - 1);
      const r = Math.round(245 + (200 - 245) * t);
      const g2 = Math.round(185 - 185 * t);
      const b = Math.round(66 - 66 * t);
      ctx.fillStyle = `rgb(${r},${g2},${b})`;
      ctx.beginPath();
      ctx.arc(toCanvasX(path[i]), toCanvasY(lossFn(path[i])), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Start circle
    ctx.strokeStyle = '#4a9ebb';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(74,158,187,0.3)';
    ctx.beginPath();
    ctx.arc(toCanvasX(path[0]), toCanvasY(lossFn(path[0])), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Final point star (simplified: filled circle with ring)
    const lastX = path[path.length - 1];
    const lastY = lossFn(lastX);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(255,107,107,0.4)';
    ctx.beginPath();
    ctx.arc(toCanvasX(lastX), toCanvasY(lastY), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // inner dot
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(toCanvasX(lastX), toCanvasY(lastY), 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // X-axis ticks
  ctx.fillStyle = GHOST;
  ctx.font = '9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let xv = -2; xv <= 2; xv++) {
    const cx = toCanvasX(xv);
    ctx.fillText(xv.toFixed(0), cx, H - 6);
    ctx.strokeStyle = RIM;
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(cx, pad.top); ctx.lineTo(cx, pad.top + iH); ctx.stroke();
  }

  // Legend: start / end
  ctx.fillStyle = '#4a9ebb';
  ctx.beginPath(); ctx.arc(pad.left + 4, H - 16, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = GHOST;
  ctx.font = '8.5px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('start', pad.left + 12, H - 13);
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.arc(pad.left + 50, H - 16, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = GHOST;
  ctx.fillText('end', pad.left + 58, H - 13);

  return path;
}

// ─── Draw right panel ─────────────────────────────────────────────────────────
function drawRight(ctx, W, H, kappa, lr) {
  const pad = { top: 28, left: 12, right: 12, bottom: 28 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  function toCanvasX(w1) { return pad.left + (w1 - W1_MIN) / (W1_MAX - W1_MIN) * iW; }
  function toCanvasY(w2) { return pad.top + iH - (w2 - W2_MIN) / (W2_MAX - W2_MIN) * iH; }

  // Panel title
  ctx.fillStyle = GHOST;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`L(w₁,w₂) = κ·w₁² + w₂²   (κ=${kappa})`, pad.left, 14);

  // Draw contour lines via ImageData
  const imgData = ctx.createImageData(Math.round(iW), Math.round(iH));
  const levels = 8;
  const maxLoss = kappa * W1_MAX ** 2 + W2_MAX ** 2;

  for (let py = 0; py < iH; py++) {
    for (let px2 = 0; px2 < iW; px2++) {
      const w1 = W1_MIN + (px2 / iW) * (W1_MAX - W1_MIN);
      const w2 = W2_MAX - (py / iH) * (W2_MAX - W2_MIN);
      const loss = kappa * w1 ** 2 + w2 ** 2;
      const norm = loss / maxLoss;

      // Contour bands
      const level = Math.floor(norm * levels) / levels;
      const nextLevel = (Math.floor(norm * levels) + 1) / levels;
      const isContour = (norm * levels) % 1 < 0.08;

      const idx = (py * Math.round(iW) + px2) * 4;
      if (isContour) {
        imgData.data[idx] = 80;
        imgData.data[idx + 1] = 80;
        imgData.data[idx + 2] = 80;
        imgData.data[idx + 3] = 180;
      } else {
        // gradient fill: dark center to lighter edges
        const intensity = Math.round(15 + norm * 35);
        imgData.data[idx] = intensity;
        imgData.data[idx + 1] = intensity;
        imgData.data[idx + 2] = intensity + Math.round(norm * 20);
        imgData.data[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(imgData, pad.left, pad.top);

  // GD path
  const optLr = 1 / (2 * kappa);
  const path = runGD2D(kappa, lr);
  const isDiverging = Math.hypot(path[path.length - 1][0], path[path.length - 1][1]) > 1.0 && path.length >= 79;

  ctx.setLineDash([3, 2]);
  ctx.lineWidth = 1.8;
  const pathColor = isDiverging ? '#d45a5a' : PRIME;
  ctx.strokeStyle = pathColor;
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const cx = toCanvasX(path[i][0]);
    const cy = toCanvasY(path[i][1]);
    i === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Dots
  const dotStep = Math.max(1, Math.floor(path.length / 15));
  for (let i = 0; i < path.length; i += dotStep) {
    const t = i / (path.length - 1);
    ctx.fillStyle = pathColor;
    ctx.globalAlpha = 0.5 + t * 0.5;
    ctx.beginPath();
    ctx.arc(toCanvasX(path[i][0]), toCanvasY(path[i][1]), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Start marker
  ctx.fillStyle = '#4a9ebb';
  ctx.strokeStyle = '#4a9ebb';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(toCanvasX(1.5), toCanvasY(1.5), 5, 0, Math.PI * 2);
  ctx.fill();

  // Origin marker
  ctx.fillStyle = GHOST;
  ctx.beginPath();
  ctx.arc(toCanvasX(0), toCanvasY(0), 4, 0, Math.PI * 2);
  ctx.fill();

  // Axis lines
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(toCanvasX(0), pad.top); ctx.lineTo(toCanvasX(0), pad.top + iH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.left, toCanvasY(0)); ctx.lineTo(pad.left + iW, toCanvasY(0)); ctx.stroke();

  // Axis labels
  ctx.fillStyle = GHOST;
  ctx.font = '9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('w₁', toCanvasX(W1_MAX) - 8, toCanvasY(0) - 4);
  ctx.textAlign = 'left';
  ctx.fillText('w₂', toCanvasX(0) + 4, pad.top + 10);

  return { path, isDiverging, optLr };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ConvexOptimizationViz() {
  const [isConvex, setIsConvex] = useState(true);
  const [lr, setLr] = useState(0.1);
  const [startX, setStartX] = useState(2.0);
  const [kappa, setKappa] = useState(10);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [pathStats, setPathStats] = useState(null);
  const [rightStats, setRightStats] = useState(null);

  const canvasRef = useRef(null);

  const computeAndDraw = useCallback((doRun) => {
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

    const halfW = Math.floor(W / 2);
    const divX = halfW;

    // Divider
    ctx.strokeStyle = RIM;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(divX, 0); ctx.lineTo(divX, H); ctx.stroke();

    // Left panel
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, halfW, H); ctx.clip();
    let path = null;
    if (doRun) {
      path = drawLeft(ctx, halfW, H, isConvex, lr, startX);
    } else {
      // Draw curve only (no path)
      const lossFn = isConvex ? lossConvex : lossNonConvex;
      const N = 400;
      const xs = Array.from({ length: N }, (_, i) => X_MIN + (X_MAX - X_MIN) * i / (N - 1));
      const ys = xs.map(lossFn);
      const yMin = Math.min(...ys) - 0.5;
      const yMax = Math.max(...ys) + 0.5;
      const yRange = yMax - yMin;
      const pad = { top: 28, left: 48, right: 16, bottom: 28 };
      const iW = halfW - pad.left - pad.right;
      const iH = H - pad.top - pad.bottom;

      ctx.fillStyle = GHOST;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(isConvex ? 'Convex: L(x) = (x+1)²' : 'Non-convex: L(x) = x⁴ − 4x² + x + 3', pad.left, 14);

      if (!isConvex) {
        ctx.fillStyle = 'rgba(220,80,80,0.10)';
        const lx1 = pad.left + ((-2.5 - X_MIN) / (X_MAX - X_MIN)) * iW;
        const lx2 = pad.left + ((0.3 - X_MIN) / (X_MAX - X_MIN)) * iW;
        ctx.fillRect(lx1, pad.top, lx2 - lx1, iH);
        ctx.fillStyle = 'rgba(80,180,80,0.10)';
        const gx1 = pad.left + ((0.3 - X_MIN) / (X_MAX - X_MIN)) * iW;
        const gx2 = pad.left + ((2.5 - X_MIN) / (X_MAX - X_MIN)) * iW;
        ctx.fillRect(gx1, pad.top, gx2 - gx1, iH);
        ctx.fillStyle = 'rgba(220,80,80,0.55)';
        ctx.font = '8.5px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('local min', pad.left + ((-1.07 - X_MIN) / (X_MAX - X_MIN)) * iW, pad.top + 12);
        ctx.fillStyle = 'rgba(80,180,80,0.55)';
        ctx.fillText('global min', pad.left + ((1.37 - X_MIN) / (X_MAX - X_MIN)) * iW, pad.top + 12);
      }

      ctx.strokeStyle = PRIME;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const toCanvasX = (x) => pad.left + (x - X_MIN) / (X_MAX - X_MIN) * iW;
      const toCanvasY = (y) => pad.top + iH - (y - yMin) / yRange * iH;
      for (let i = 0; i < N; i++) {
        i === 0 ? ctx.moveTo(toCanvasX(xs[i]), toCanvasY(ys[i])) : ctx.lineTo(toCanvasX(xs[i]), toCanvasY(ys[i]));
      }
      ctx.stroke();

      // Grid
      ctx.fillStyle = GHOST;
      ctx.font = '9px system-ui, sans-serif';
      for (let xv = -2; xv <= 2; xv++) {
        ctx.textAlign = 'center';
        ctx.fillText(xv.toFixed(0), toCanvasX(xv), H - 6);
      }
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const v = yMin + yRange * i / 4;
        ctx.fillText(v.toFixed(1), pad.left - 4, toCanvasY(v) + 3);
      }

      // Start point marker
      const sx = toCanvasX(startX);
      const sy = toCanvasY(lossFn(startX));
      ctx.strokeStyle = '#4a9ebb';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(74,158,187,0.3)';
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();

    // Right panel
    ctx.save();
    ctx.translate(divX, 0);
    ctx.beginPath(); ctx.rect(0, 0, W - divX, H); ctx.clip();
    const rightResult = drawRight(ctx, W - divX, H, kappa, lr);
    ctx.restore();

    if (doRun && path) {
      const lossFn = isConvex ? lossConvex : lossNonConvex;
      const lastX = path[path.length - 1];
      setPathStats({
        steps: path.length - 1,
        finalX: lastX,
        finalL: lossFn(lastX),
      });
    }
    if (rightResult) {
      setRightStats({
        steps: rightResult.path.length - 1,
        optLr: rightResult.optLr,
        isDiverging: rightResult.isDiverging,
      });
    }
  }, [isConvex, lr, startX, kappa, hasRun]);

  const handleRun = () => {
    setHasRun(true);
    setRunning(true);
    computeAndDraw(true);
    setRunning(false);
  };

  const handleReset = () => {
    setHasRun(false);
    setPathStats(null);
    computeAndDraw(false);
  };

  // Initial draw
  useEffect(() => { computeAndDraw(hasRun); }, [computeAndDraw, hasRun]);

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => computeAndDraw(hasRun));
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [computeAndDraw, hasRun]);

  const btnStyle = (active) => ({
    padding: '0.3rem 0.75rem',
    fontSize: '0.78rem',
    fontWeight: 600,
    border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
    background: active ? 'rgba(245,185,66,0.15)' : 'var(--depth)',
    color: active ? 'var(--prime)' : 'var(--ink)',
    borderRadius: '5px',
    cursor: 'pointer',
  });

  const SliderRow = ({ label, value, min, max, step, onChange, fmt }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.79rem' }}>
      <span style={{ color: 'var(--ink)', minWidth: 110 }}>
        {label}: <span style={{ color: 'var(--prime)', fontWeight: 700 }}>{fmt ? fmt(value) : value}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ accentColor: 'var(--prime)', width: 100 }}
      />
    </div>
  );

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '0.55rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.1rem' }}>
          Convex Optimization & Gradient Descent
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          Left: GD on loss landscape · Right: condition number effect on convergence
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.2rem', marginBottom: '0.55rem', alignItems: 'center' }}>
        {/* Left panel controls */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button style={btnStyle(isConvex)} onClick={() => { setIsConvex(true); setHasRun(false); setPathStats(null); }}>Convex</button>
          <button style={btnStyle(!isConvex)} onClick={() => { setIsConvex(false); setHasRun(false); setPathStats(null); }}>Non-convex</button>
        </div>
        <SliderRow label="Learning rate" value={lr} min={0.01} max={0.5} step={0.01} onChange={setLr} fmt={v => v.toFixed(2)} />
        <SliderRow label="Start x" value={startX} min={-2.5} max={2.5} step={0.1} onChange={setStartX} fmt={v => v.toFixed(1)} />
        <button
          onClick={handleRun}
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.79rem', fontWeight: 700, background: 'var(--prime)', color: '#111', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Run GD
        </button>
        <button
          onClick={handleReset}
          style={{ padding: '0.3rem 0.7rem', fontSize: '0.79rem', fontWeight: 600, background: 'var(--depth)', color: 'var(--ink)', border: '1px solid var(--rim)', borderRadius: '5px', cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>

      {/* Right panel controls: kappa */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.6rem', marginBottom: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.79rem', color: 'var(--ink-ghost)', minWidth: 60 }}>Condition κ:</span>
        {KAPPAS.map((k, i) => (
          <button key={k} style={btnStyle(kappa === k)} onClick={() => setKappa(k)}>
            κ = {k}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 1.5rem', marginBottom: '0.5rem', fontFamily: 'monospace', fontSize: '0.77rem', color: 'var(--ink-ghost)' }}>
        {pathStats && (
          <span>
            Steps to converge: <span style={{ color: PRIME, fontWeight: 700 }}>{pathStats.steps}</span>
            {' | '}Final x: <span style={{ color: PRIME }}>{pathStats.finalX.toFixed(3)}</span>
            {' | '}Final L: <span style={{ color: PRIME }}>{pathStats.finalL.toFixed(3)}</span>
          </span>
        )}
        {rightStats && (
          <span style={{ color: rightStats.isDiverging ? '#d45a5a' : 'var(--ink-ghost)' }}>
            κ = {kappa} | Optimal lr ≤ 1/(2κ) = <span style={{ color: rightStats.isDiverging ? '#d45a5a' : PRIME }}>{rightStats.optLr.toFixed(4)}</span>
            {' | '}Steps: <span style={{ color: rightStats.isDiverging ? '#d45a5a' : PRIME }}>{rightStats.steps}</span>
            {rightStats.isDiverging && <span style={{ color: '#d45a5a', fontWeight: 700 }}> ⚠ lr too large — oscillating/diverging</span>}
          </span>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '360px', borderRadius: '6px', display: 'block', background: 'var(--depth)' }}
      />

      {/* Legend */}
      <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem 1rem', fontSize: '0.73rem', color: 'var(--ink-ghost)' }}>
        {[
          { color: PRIME, label: 'Loss curve', dash: false },
          { color: '#f5b942', label: 'GD path (gold→red)', dash: false },
          { color: '#4a9ebb', label: 'Start point', dash: false },
          { color: '#ff6b6b', label: 'End point', dash: false },
          { color: 'rgba(220,80,80,0.6)', label: 'Local min region', dash: false },
          { color: 'rgba(80,180,80,0.6)', label: 'Global min region', dash: false },
        ].map((it, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ display: 'inline-block', width: 14, height: 2, borderTop: `2px solid ${it.color}`, flexShrink: 0 }} />
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}
