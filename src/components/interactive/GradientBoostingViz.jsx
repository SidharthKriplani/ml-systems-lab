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

// ─── Fixed dataset: 15 points, y = sin(2πx) + 0.1*noise ─────────────────────
const N_POINTS = 15;

function buildDataset() {
  const rng = mulberry32(0xDEADBEEF);
  const pts = [];
  for (let i = 0; i < N_POINTS; i++) {
    const x = i / (N_POINTS - 1);
    const noise = (rng() - 0.5) * 2 * 0.1;
    const y = Math.sin(2 * Math.PI * x) + noise;
    pts.push({ x, y });
  }
  return pts;
}

const DATASET = buildDataset();
const Y_MEAN = DATASET.reduce((s, p) => s + p.y, 0) / N_POINTS;

// ─── Decision stump fitting ───────────────────────────────────────────────────
function fitStump(xs, residuals) {
  // Try all midpoints between sorted unique xs as split thresholds
  let bestLoss = Infinity;
  let bestThreshold = 0.5;
  let bestLeft = 0;
  let bestRight = 0;

  // Try N_POINTS - 1 split points (midpoints between consecutive xs)
  const sorted = [...xs.map((x, i) => ({ x, r: residuals[i] }))].sort((a, b) => a.x - b.x);

  for (let s = 0; s < sorted.length - 1; s++) {
    const threshold = (sorted[s].x + sorted[s + 1].x) / 2;

    const leftR = sorted.filter(p => p.x < threshold).map(p => p.r);
    const rightR = sorted.filter(p => p.x >= threshold).map(p => p.r);

    if (leftR.length === 0 || rightR.length === 0) continue;

    const leftMean = leftR.reduce((a, b) => a + b, 0) / leftR.length;
    const rightMean = rightR.reduce((a, b) => a + b, 0) / rightR.length;

    const loss =
      leftR.reduce((s, r) => s + (r - leftMean) ** 2, 0) +
      rightR.reduce((s, r) => s + (r - rightMean) ** 2, 0);

    if (loss < bestLoss) {
      bestLoss = loss;
      bestThreshold = threshold;
      bestLeft = leftMean;
      bestRight = rightMean;
    }
  }

  return { threshold: bestThreshold, leftVal: bestLeft, rightVal: bestRight };
}

function applyStump(stump, x) {
  return x < stump.threshold ? stump.leftVal : stump.rightVal;
}

function buildAllStumps(eta) {
  const stumps = [];
  const preds = DATASET.map(() => Y_MEAN);

  for (let round = 0; round < 8; round++) {
    const xs = DATASET.map(p => p.x);
    const residuals = DATASET.map((p, i) => p.y - preds[i]);
    const stump = fitStump(xs, residuals);
    stumps.push({ stump, residuals: [...residuals] });
    for (let i = 0; i < N_POINTS; i++) {
      preds[i] += eta * applyStump(stump, DATASET[i].x);
    }
  }
  return stumps;
}

// ─── Smooth ensemble prediction line ─────────────────────────────────────────
const N_CURVE = 200;
const X_CURVE = Array.from({ length: N_CURVE }, (_, i) => i / (N_CURVE - 1));

function computeEnsembleCurve(round, stumpsData, eta) {
  return X_CURVE.map(x => {
    let y = Y_MEAN;
    for (let r = 0; r < round; r++) {
      y += eta * applyStump(stumpsData[r].stump, x);
    }
    return y;
  });
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
const MAR = { top: 28, right: 12, bottom: 28, left: 32 };
const Y_RANGE = { min: -1.6, max: 1.6 };

function toCanvasX(x, W) {
  return MAR.left + x * (W - MAR.left - MAR.right);
}
function toCanvasY(y, H, yMin, yMax) {
  const plotH = H - MAR.top - MAR.bottom;
  return MAR.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;
}

function drawGrid(ctx, W, H, yMin, yMax, rimColor, inkLow) {
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 0.5;

  // Vertical grid
  for (let xi = 0; xi <= 5; xi++) {
    const cx = toCanvasX(xi / 5, W);
    ctx.beginPath();
    ctx.moveTo(cx, MAR.top);
    ctx.lineTo(cx, H - MAR.bottom);
    ctx.stroke();
  }

  // Horizontal grid
  const yStep = 0.5;
  for (let yv = Math.ceil(yMin / yStep) * yStep; yv <= yMax + 1e-9; yv += yStep) {
    const cy = toCanvasY(yv, H, yMin, yMax);
    ctx.beginPath();
    ctx.moveTo(MAR.left, cy);
    ctx.lineTo(W - MAR.right, cy);
    ctx.stroke();
  }

  // Zero line
  ctx.strokeStyle = inkLow;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4, 4]);
  const cy0 = toCanvasY(0, H, yMin, yMax);
  ctx.beginPath();
  ctx.moveTo(MAR.left, cy0);
  ctx.lineTo(W - MAR.right, cy0);
  ctx.stroke();
  ctx.setLineDash([]);

  // Axis tick labels
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.textAlign = 'center';
  for (let xi = 0; xi <= 4; xi++) {
    const cx = toCanvasX(xi / 4, W);
    ctx.fillText((xi / 4).toFixed(2), cx, H - 6);
  }
  ctx.textAlign = 'right';
  for (let yv = Math.ceil(yMin / yStep) * yStep; yv <= yMax + 1e-9; yv += yStep) {
    const cy = toCanvasY(yv, H, yMin, yMax);
    ctx.fillText(yv.toFixed(1), MAR.left - 3, cy + 3);
  }
}

// ─── Left panel: Ensemble fit ─────────────────────────────────────────────────
function drawLeft(ctx, W, H, round, stumpsData, eta, cs) {
  const prime    = cs.getPropertyValue('--prime').trim()     || '#F0A500';
  const depth    = cs.getPropertyValue('--depth').trim()     || '#111827';
  const rimColor = cs.getPropertyValue('--rim').trim()       || '#2a2a2a';
  const inkLow   = cs.getPropertyValue('--ink-low').trim()   || '#555';
  const inkHi    = cs.getPropertyValue('--ink-hi').trim()    || '#e5e5e5';

  const yMin = Y_RANGE.min;
  const yMax = Y_RANGE.max;

  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  drawGrid(ctx, W, H, yMin, yMax, rimColor, inkLow);

  // True sin(2πx) curve — faint dashed
  ctx.beginPath();
  for (let i = 0; i < N_CURVE; i++) {
    const x = X_CURVE[i];
    const y = Math.sin(2 * Math.PI * x);
    const cx = toCanvasX(x, W);
    const cy = toCanvasY(y, H, yMin, yMax);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.strokeStyle = 'rgba(120,120,140,0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Just-added stump as step function (highlighted, round > 0)
  if (round > 0 && stumpsData.length >= round) {
    const lastStump = stumpsData[round - 1].stump;
    const thr = lastStump.threshold;
    const cx_thr = toCanvasX(thr, W);
    const leftY = Y_MEAN;
    let leftPred = leftY;
    let rightPred = leftY;
    // Compute mean of ensemble before this stump
    for (let r = 0; r < round - 1; r++) {
      leftPred += eta * applyStump(stumpsData[r].stump, thr * 0.5);
      rightPred += eta * applyStump(stumpsData[r].stump, (thr + 1) * 0.5);
    }
    // stump contribution
    const leftContrib = eta * lastStump.leftVal;
    const rightContrib = eta * lastStump.rightVal;

    ctx.beginPath();
    ctx.moveTo(toCanvasX(0, W), toCanvasY(leftContrib, H, yMin, yMax));
    ctx.lineTo(cx_thr, toCanvasY(leftContrib, H, yMin, yMax));
    ctx.lineTo(cx_thr, toCanvasY(rightContrib, H, yMin, yMax));
    ctx.lineTo(toCanvasX(1, W), toCanvasY(rightContrib, H, yMin, yMax));
    ctx.strokeStyle = 'rgba(100,180,255,0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ensemble prediction curve
  const ensembleCurve = computeEnsembleCurve(round, stumpsData, eta);
  ctx.beginPath();
  for (let i = 0; i < N_CURVE; i++) {
    const cx = toCanvasX(X_CURVE[i], W);
    const cy = toCanvasY(ensembleCurve[i], H, yMin, yMax);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.strokeStyle = prime;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Data points as gold circles
  DATASET.forEach(p => {
    const cx = toCanvasX(p.x, W);
    const cy = toCanvasY(p.y, H, yMin, yMax);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = prime;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Title
  ctx.fillStyle = inkHi;
  ctx.font = `bold 11px var(--font-sans, sans-serif)`;
  ctx.textAlign = 'left';
  ctx.fillText(`Ensemble fit (round ${round})`, MAR.left, 14);
}

// ─── Right panel: Residuals ───────────────────────────────────────────────────
function drawRight(ctx, W, H, round, stumpsData, cs) {
  const depth    = cs.getPropertyValue('--depth').trim()     || '#111827';
  const rimColor = cs.getPropertyValue('--rim').trim()       || '#2a2a2a';
  const inkLow   = cs.getPropertyValue('--ink-low').trim()   || '#555';
  const inkHi    = cs.getPropertyValue('--ink-hi').trim()    || '#e5e5e5';
  const prime    = cs.getPropertyValue('--prime').trim()     || '#F0A500';

  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Get residuals for current round
  let residuals;
  if (round === 0) {
    residuals = DATASET.map(p => p.y - Y_MEAN);
  } else {
    residuals = stumpsData[round - 1].residuals;
  }

  // MSE
  const mse = residuals.reduce((s, r) => s + r * r, 0) / N_POINTS;

  // Auto-scale y
  const maxAbsR = Math.max(0.01, ...residuals.map(r => Math.abs(r)));
  const yPad = maxAbsR * 0.25;
  const yMin = -(maxAbsR + yPad);
  const yMax = maxAbsR + yPad;

  drawGrid(ctx, W, H, yMin, yMax, rimColor, inkLow);

  // Stem plot
  DATASET.forEach((p, i) => {
    const r = residuals[i];
    const cx = toCanvasX(p.x, W);
    const cy0 = toCanvasY(0, H, yMin, yMax);
    const cy = toCanvasY(r, H, yMin, yMax);

    // Stem line
    ctx.beginPath();
    ctx.moveTo(cx, cy0);
    ctx.lineTo(cx, cy);
    ctx.strokeStyle = r >= 0 ? 'rgba(239,68,68,0.8)' : 'rgba(96,165,250,0.8)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Head circle
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = r >= 0 ? '#EF4444' : '#60A5FA';
    ctx.fill();
  });

  // MSE label top-right
  ctx.fillStyle = prime;
  ctx.font = `bold 11px var(--font-mono, monospace)`;
  ctx.textAlign = 'right';
  ctx.fillText(`MSE: ${mse.toFixed(3)}`, W - MAR.right, 14);

  // Title top-left
  ctx.fillStyle = inkHi;
  ctx.font = `bold 11px var(--font-sans, sans-serif)`;
  ctx.textAlign = 'left';
  ctx.fillText(`Residuals (round ${round})`, MAR.left, 14);
}

// ─── Main draw function: shared canvas, two panels ────────────────────────────
function drawCanvas(canvas, round, stumpsData, eta) {
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (W === 0 || H === 0) return;

  const cs = getComputedStyle(document.documentElement);
  const rimColor = cs.getPropertyValue('--rim').trim() || '#2a2a2a';

  ctx.clearRect(0, 0, W, H);

  const splitX = Math.floor(W * 0.55);
  const rightW = W - splitX;

  // Draw left panel
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX, H);
  ctx.clip();
  drawLeft(ctx, splitX, H, round, stumpsData, eta, cs);
  ctx.restore();

  // Divider
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(splitX, 4);
  ctx.lineTo(splitX, H - 4);
  ctx.stroke();

  // Draw right panel (translate context)
  ctx.save();
  ctx.translate(splitX, 0);
  ctx.beginPath();
  ctx.rect(0, 0, rightW, H);
  ctx.clip();
  drawRight(ctx, rightW, H, round, stumpsData, cs);
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────
export const GradientBoostingViz = forwardRef(function GradientBoostingViz(props, ref) {
  const canvasRef = useRef(null);
  const stumpsRef = useRef([]);
  const stateRef  = useRef({ round: 0, eta: 0.5 });
  const animRef   = useRef(null);

  const [round, setRound] = useState(0);
  const [eta, setEta] = useState(0.5);

  // Recompute stumps whenever eta changes
  useEffect(() => {
    stumpsRef.current = buildAllStumps(eta);
  }, [eta]);

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = { round, eta };
  });

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { round: r, eta: e } = stateRef.current;
    drawCanvas(canvas, r, stumpsRef.current, e);
  }, []);

  // ResizeObserver
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
      redraw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw on state changes
  useEffect(() => {
    redraw();
  }, [round, eta, redraw]);

  const handleAddTree = useCallback(() => {
    setRound(r => Math.min(r + 1, 8));
  }, []);

  const handleReset = useCallback(() => {
    setRound(0);
  }, []);

  const play = useCallback(() => {
    if (animRef.current) return
    let lastTime = 0
    const tick = (time) => {
      if (stateRef.current.round >= 8) { animRef.current = null; return }
      if (time - lastTime >= 800) {
        lastTime = time
        setRound(r => {
          const nr = Math.min(r + 1, 8)
          stateRef.current = { ...stateRef.current, round: nr }
          return nr
        })
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [])

  const pause = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
  }, [])

  useImperativeHandle(ref, () => ({
    play,
    pause,
    reset: handleReset,
    step: handleAddTree,
  }), [play, pause, handleReset, handleAddTree])

  const handleEtaChange = useCallback((e) => {
    const newEta = parseFloat(e.target.value);
    stumpsRef.current = buildAllStumps(newEta);
    setEta(newEta);
    setRound(0);
  }, []);

  const btnBase = {
    padding: '5px 14px',
    borderRadius: '4px',
    border: '1px solid var(--rim, #333)',
    background: 'var(--surface, #1a1a1a)',
    color: 'var(--ink-mid, #888)',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans, sans-serif)',
  };

  const btnPrimary = {
    ...btnBase,
    background: 'var(--prime, #F0A500)',
    color: '#000',
    border: 'none',
    fontWeight: 700,
  };

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '320px',
          borderRadius: '6px',
          border: '1px solid var(--rim, #2a2a2a)',
          display: 'block',
          background: 'var(--depth, #111827)',
        }}
      />

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '6px',
        padding: '10px 14px',
      }}>
        {/* Round indicator */}
        <span style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '13px',
          color: 'var(--prime, #F0A500)',
          fontWeight: 700,
          minWidth: '76px',
        }}>
          {`Round ${round}/8`}
        </span>

        <button
          onClick={handleAddTree}
          disabled={round >= 8}
          style={round >= 8 ? { ...btnPrimary, opacity: 0.4, cursor: 'not-allowed' } : btnPrimary}
        >
          Add tree
        </button>

        <button onClick={handleReset} style={btnBase}>
          Reset
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'var(--rim, #333)' }} />

        {/* Learning rate slider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--ink-mid, #888)',
        }}>
          <span style={{ minWidth: '56px' }}>{`η = ${eta.toFixed(1)}`}</span>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={eta}
            onChange={handleEtaChange}
            style={{ accentColor: 'var(--prime, #F0A500)', width: '100px' }}
          />
        </div>

        <span style={{
          fontSize: '11px',
          color: 'var(--ink-low, #555)',
          fontFamily: 'var(--font-mono, monospace)',
          marginLeft: 'auto',
        }}>
          Changing η resets from round 0
        </span>
      </div>

      {/* Gradient descent in function space — core insight */}
      {round > 0 && (() => {
        const residuals = stumpsRef.current.length >= round ? stumpsRef.current[round - 1].residuals : null;
        const mse = residuals ? residuals.reduce((s, r) => s + r * r, 0) / N_POINTS : null;
        return (
          <div style={{
            background: 'var(--depth,#111)', border: '1px solid var(--rim,#2a2a2a)',
            borderRadius: 6, padding: '10px 14px', fontSize: 12,
            fontFamily: 'var(--font-mono,monospace)', lineHeight: 1.7,
          }}>
            <div style={{ color: 'var(--prime,#F0A500)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Why residuals = gradient descent in function space
            </div>
            <div style={{ color: 'var(--ink-mid,#aaa)' }}>
              Loss: L = Σᵢ (yᵢ − F(xᵢ))². Gradient w.r.t. the prediction F(xᵢ):
            </div>
            <div style={{ color: 'var(--prime)', marginTop: 2 }}>
              ∂L/∂F(xᵢ) = −2(yᵢ − F(xᵢ)) = −2 × residualᵢ
            </div>
            <div style={{ color: 'var(--ink-mid,#aaa)', marginTop: 4 }}>
              Fitting the next tree to residuals is one step of gradient descent in the space of functions — not in weight space. Each tree corrects where the ensemble is currently wrong.
            </div>
            {mse !== null && (
              <div style={{ color: 'var(--ink-low,#666)', marginTop: 4 }}>
                Round {round}: residual MSE = <span style={{ color: 'var(--prime)' }}>{mse.toFixed(4)}</span>
                {round > 1 && stumpsRef.current.length >= round - 1 ? (() => {
                  const prevMse = stumpsRef.current[round - 2].residuals.reduce((s, r) => s + r * r, 0) / N_POINTS;
                  return <span style={{ color: '#4ade80', marginLeft: 8 }}>({((1 - mse / prevMse) * 100).toFixed(1)}% reduction)</span>;
                })() : null}
              </div>
            )}
            <div style={{ color: 'var(--ink-low,#666)', marginTop: 4, fontSize: 11 }}>
              XGBoost gain formula per split: Gain = G_L²/(H_L+λ) + G_R²/(H_R+λ) − G_J²/(H_J+λ) − γ. Where G = Σ gradients, H = Σ hessians per node. λ regularizes leaf weights, γ penalizes splits.
            </div>
          </div>
        );
      })()}

      {/* Legend */}

      <div style={{
        display: 'flex',
        gap: '20px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono, monospace)',
        color: 'var(--ink-low, #555)',
        flexWrap: 'wrap',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            display: 'inline-block', width: '14px', height: '2px',
            background: 'var(--prime, #F0A500)', borderRadius: '1px',
          }} />
          ensemble prediction
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            display: 'inline-block', width: '14px', height: '2px',
            background: 'rgba(120,120,140,0.5)', borderRadius: '1px',
            borderTop: '1px dashed rgba(120,120,140,0.5)',
          }} />
          true sin(2πx)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            display: 'inline-block', width: '6px', height: '6px',
            borderRadius: '50%', background: '#EF4444',
          }} />
          positive residual
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            display: 'inline-block', width: '6px', height: '6px',
            borderRadius: '50%', background: '#60A5FA',
          }} />
          negative residual
        </span>
      </div>
    </div>
  );
})
