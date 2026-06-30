import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Forest data generation ───────────────────────────────────────────────────
const BASE_RNG = mulberry32(42);
const BASE_ERRORS = Array.from({ length: 8 }, () => 0.22 + BASE_RNG() * 0.10);

function generateForest(featureRatio) {
  const correlation = featureRatio * featureRatio;
  const ensembleErrors = BASE_ERRORS.map((_, k) => {
    const T = k + 1;
    const avgErr = BASE_ERRORS.slice(0, T).reduce((a, b) => a + b, 0) / T;
    return avgErr * (1 + (T - 1) * correlation * 0.5) / T;
  });
  return { baseErrors: BASE_ERRORS, ensembleErrors, correlation };
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
    display: 'block', width: '100%', height: '340px',
    borderRadius: 6, border: '1px solid var(--rim, #333)',
    background: 'var(--depth, #111)',
  },
  canvasSmall: {
    display: 'block', width: '100%', height: '160px',
    borderRadius: 6, border: '1px solid var(--rim, #333)',
    background: 'var(--depth, #111)',
    marginBottom: 8,
  },
  controls: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginTop: 12, flexWrap: 'wrap',
  },
  btn: {
    padding: '6px 14px', borderRadius: 6,
    border: '1px solid var(--rim, #555)',
    background: 'var(--depth, #111)', color: 'var(--ink-hi, #eee)',
    cursor: 'pointer', fontSize: 13,
    fontFamily: 'var(--font-sans, sans-serif)',
  },
  btnPrime: {
    padding: '6px 14px', borderRadius: 6,
    border: '1px solid var(--prime, #F0A500)',
    background: 'var(--prime, #F0A500)', color: '#000',
    cursor: 'pointer', fontSize: 13, fontWeight: 600,
    fontFamily: 'var(--font-sans, sans-serif)',
  },
  sliderRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, color: 'var(--ink-mid, #aaa)',
    marginTop: 12,
  },
  slider: { accentColor: 'var(--prime, #F0A500)', flex: 1 },
  formula: {
    marginTop: 12, padding: '8px 12px',
    background: 'rgba(240,165,0,0.08)',
    border: '1px solid rgba(240,165,0,0.25)',
    borderRadius: 6, fontSize: 12,
    color: 'var(--ink-mid, #aaa)',
    fontFamily: 'var(--font-mono, monospace)',
    lineHeight: 1.7,
  },
};

// ─── Left panel draw: grid of trees + ensemble accuracy curve ─────────────────
function drawForestPanel(canvas, nActive, featureRatio) {
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
  const prime = cs.getPropertyValue('--prime').trim() || '#F0A500';
  const inkLow = cs.getPropertyValue('--ink-low').trim() || '#666';
  const inkMid = cs.getPropertyValue('--ink-mid').trim() || '#999';
  const inkHi = cs.getPropertyValue('--ink-hi').trim() || '#eee';

  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const { baseErrors, ensembleErrors } = generateForest(featureRatio);

  // ── Grid section (top 55%) ────────────────────────────────────────────────
  const gridH = Math.floor(H * 0.55);
  const PAD = 12;
  const cols = 4;
  const rows = 2;
  const cellW = (W - PAD * 2 - (cols - 1) * 6) / cols;
  const cellH = (gridH - PAD * 2 - (rows - 1) * 6) / rows;

  for (let i = 0; i < 8; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PAD + col * (cellW + 6);
    const y = PAD + row * (cellH + 6);

    const isActive = i < nActive;
    const accuracy = 1 - baseErrors[i];
    const fillFrac = isActive ? accuracy : 0;

    // Card background
    ctx.fillStyle = isActive ? `rgba(240,165,0,0.06)` : `rgba(255,255,255,0.02)`;
    ctx.strokeStyle = isActive ? `rgba(240,165,0,0.5)` : rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, cellW, cellH, 4);
    ctx.fill();
    ctx.stroke();

    // OOB accuracy bar (fills from bottom)
    if (isActive) {
      const barH = Math.round((cellH - 20) * fillFrac);
      const barY = y + cellH - 10 - barH;
      const hue = Math.round(accuracy * 120); // 0=red, 120=green
      ctx.fillStyle = `hsl(${hue}, 70%, 45%)`;
      ctx.beginPath();
      ctx.roundRect(x + 4, barY, cellW - 8, barH, 2);
      ctx.fill();
    }

    // Label
    ctx.fillStyle = isActive ? inkHi : inkLow;
    ctx.font = `bold 10px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    ctx.fillText(`T${i + 1}`, x + cellW / 2, y + cellH - 3);

    if (isActive) {
      ctx.fillStyle = prime;
      ctx.font = `9px var(--font-mono, monospace)`;
      ctx.fillText(`${(accuracy * 100).toFixed(0)}%`, x + cellW / 2, y + 10);
    }
  }
  ctx.textAlign = 'left';

  // Section label
  ctx.fillStyle = inkLow;
  ctx.font = `10px var(--font-sans, sans-serif)`;
  ctx.fillText('TREE GRID — OOB accuracy fill', PAD, gridH - 2);

  // ── Accuracy curve (bottom 45%) ───────────────────────────────────────────
  const curveTop = gridH + 4;
  const curveH = H - curveTop - 10;
  const cPAD = 36;
  const plotW = W - cPAD - PAD;
  const plotH = curveH - 20;

  // Axes
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cPAD, curveTop + 4);
  ctx.lineTo(cPAD, curveTop + 4 + plotH);
  ctx.lineTo(cPAD + plotW, curveTop + 4 + plotH);
  ctx.stroke();

  // Y axis label
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.save();
  ctx.translate(10, curveTop + 4 + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('accuracy', 0, 0);
  ctx.restore();
  ctx.textAlign = 'left';

  // X ticks
  for (let i = 0; i < 8; i++) {
    const px = cPAD + (i / 7) * plotW;
    ctx.fillStyle = inkLow;
    ctx.font = `9px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    ctx.fillText(i + 1, px, curveTop + 4 + plotH + 12);
  }
  ctx.textAlign = 'left';

  // Ensemble error → accuracy curve (all 8, dimmed)
  const allAccuracies = ensembleErrors.map(e => 1 - e);
  const yMin = 0.6, yMax = 1.0;
  const toY = (acc) => curveTop + 4 + plotH - ((acc - yMin) / (yMax - yMin)) * plotH;
  const toX = (i) => cPAD + (i / 7) * plotW;

  ctx.strokeStyle = `${inkMid}44`;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  allAccuracies.forEach((acc, i) => {
    i === 0 ? ctx.moveTo(toX(i), toY(acc)) : ctx.lineTo(toX(i), toY(acc));
  });
  ctx.stroke();
  ctx.setLineDash([]);

  // Active portion of curve
  if (nActive > 0) {
    ctx.strokeStyle = prime;
    ctx.lineWidth = 2;
    ctx.beginPath();
    allAccuracies.slice(0, nActive).forEach((acc, i) => {
      i === 0 ? ctx.moveTo(toX(i), toY(acc)) : ctx.lineTo(toX(i), toY(acc));
    });
    ctx.stroke();

    // Dots
    allAccuracies.slice(0, nActive).forEach((acc, i) => {
      ctx.beginPath();
      ctx.arc(toX(i), toY(acc), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = prime;
      ctx.fill();
    });

    // Current accuracy label
    const lastAcc = allAccuracies[nActive - 1];
    ctx.fillStyle = prime;
    ctx.font = `bold 11px var(--font-mono, monospace)`;
    ctx.fillText(`${(lastAcc * 100).toFixed(1)}%`, toX(nActive - 1) + 6, toY(lastAcc) - 4);
  }

  // Y axis ticks
  for (const acc of [0.65, 0.75, 0.85, 0.95]) {
    const py = toY(acc);
    ctx.strokeStyle = `${rim}88`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cPAD, py);
    ctx.lineTo(cPAD + plotW, py);
    ctx.stroke();
    ctx.fillStyle = inkLow;
    ctx.font = `8px var(--font-mono, monospace)`;
    ctx.textAlign = 'right';
    ctx.fillText(`${(acc * 100).toFixed(0)}`, cPAD - 3, py + 3);
  }
  ctx.textAlign = 'left';

  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.fillText('ensemble accuracy vs. trees added', cPAD + 4, curveTop + 13);
}

// ─── Right panel top: individual tree errors (bar chart) ─────────────────────
function drawErrorBars(canvas, featureRatio) {
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
  const inkHi = cs.getPropertyValue('--ink-hi').trim() || '#eee';

  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const { baseErrors } = generateForest(featureRatio);
  const PAD = { top: 20, right: 8, bottom: 22, left: 28 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const barW = plotW / 8 - 4;
  const maxErr = 0.35;

  // Title
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-sans, sans-serif)`;
  ctx.fillText('Individual tree errors', PAD.left, 12);

  // Bars
  baseErrors.forEach((err, i) => {
    const x = PAD.left + i * (plotW / 8) + 2;
    const barH = (err / maxErr) * plotH;
    const y = PAD.top + plotH - barH;

    // Color: low error = gold, high error = red
    const t = err / maxErr; // 0 = low err, 1 = high err
    const r = Math.round(t * 220 + (1 - t) * 240);
    const g = Math.round(t * 50 + (1 - t) * 165);
    const b = Math.round(t * 50 + (1 - t) * 0);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 2);
    ctx.fill();

    // X label
    ctx.fillStyle = inkLow;
    ctx.font = `8px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    ctx.fillText(`T${i + 1}`, x + barW / 2, PAD.top + plotH + 12);
  });

  // Y axis
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top);
  ctx.lineTo(PAD.left, PAD.top + plotH);
  ctx.stroke();

  ctx.fillStyle = inkLow;
  ctx.font = `8px var(--font-mono, monospace)`;
  ctx.textAlign = 'right';
  for (const v of [0.1, 0.2, 0.3]) {
    const py = PAD.top + plotH - (v / maxErr) * plotH;
    ctx.fillText(`${(v * 100).toFixed(0)}%`, PAD.left - 2, py + 3);
    ctx.strokeStyle = `${rim}66`;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(PAD.left, py);
    ctx.lineTo(W - PAD.right, py);
    ctx.stroke();
  }
  ctx.textAlign = 'left';
}

// ─── Right panel bottom: correlation heatmap ─────────────────────────────────
function drawCorrHeatmap(canvas, featureRatio) {
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
  const prime = cs.getPropertyValue('--prime').trim() || '#F0A500';

  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const correlation = featureRatio * featureRatio;
  const N = 8;
  const PAD = { top: 18, right: 8, bottom: 8, left: 24 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const cellW = plotW / N;
  const cellH = plotH / N;

  // Title
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-sans, sans-serif)`;
  ctx.fillText('Tree correlation heatmap', PAD.left, 11);

  // Cells
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const t = i === j ? 1.0 : correlation; // diagonal = 1, off-diagonal = correlation
      const x = PAD.left + j * cellW;
      const y = PAD.top + i * cellH;

      // Color: dark (uncorrelated) -> gold (correlated)
      const r = Math.round(t * 240 + (1 - t) * 30);
      const g = Math.round(t * 165 + (1 - t) * 30);
      const b = Math.round(t * 0 + (1 - t) * 80);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
    }
  }

  // Axis labels
  ctx.fillStyle = `${prime}cc`;
  ctx.font = `bold 8px var(--font-mono, monospace)`;
  ctx.textAlign = 'center';
  ctx.fillText(`ρ=${correlation.toFixed(2)}`, PAD.left + plotW / 2, PAD.top + plotH / 2 + 4);
  ctx.textAlign = 'left';

  // Border
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.8;
  ctx.strokeRect(PAD.left, PAD.top, plotW, plotH);

  // Labels T1..T8 on axes
  ctx.fillStyle = inkLow;
  ctx.font = `7px var(--font-mono, monospace)`;
  ctx.textAlign = 'center';
  for (let i = 0; i < N; i++) {
    const cx = PAD.left + i * cellW + cellW / 2;
    const cy = PAD.top + i * cellH + cellH / 2;
    ctx.fillText(`${i + 1}`, cx, PAD.top - 4);
    ctx.fillText(`${i + 1}`, PAD.left - 8, cy + 3);
  }
  ctx.textAlign = 'left';
}

// ─── Main component ───────────────────────────────────────────────────────────
export function RandomForestViz() {
  const [nActive, setNActive] = useState(0);
  const [featureRatio, setFeatureRatio] = useState(0.5);

  const forestCanvasRef = useRef(null);
  const errorCanvasRef = useRef(null);
  const corrCanvasRef = useRef(null);

  const redrawAll = useCallback(() => {
    if (forestCanvasRef.current) drawForestPanel(forestCanvasRef.current, nActive, featureRatio);
    if (errorCanvasRef.current) drawErrorBars(errorCanvasRef.current, featureRatio);
    if (corrCanvasRef.current) drawCorrHeatmap(corrCanvasRef.current, featureRatio);
  }, [nActive, featureRatio]);

  useEffect(() => { redrawAll(); }, [redrawAll]);

  useEffect(() => {
    const obs = new ResizeObserver(() => redrawAll());
    [forestCanvasRef, errorCanvasRef, corrCanvasRef].forEach(r => {
      if (r.current) obs.observe(r.current);
    });
    return () => obs.disconnect();
  }, [redrawAll]);

  const { baseErrors, ensembleErrors, correlation } = generateForest(featureRatio);
  const avgErr = nActive > 0
    ? baseErrors.slice(0, nActive).reduce((a, b) => a + b, 0) / nActive
    : baseErrors[0];
  const ensErr = nActive > 0 ? ensembleErrors[nActive - 1] : null;

  return (
    <div style={S.root}>
      <p style={S.title}>Random Forest — Ensemble Construction</p>
      <p style={S.subtitle}>{'Bagging + feature randomness → variance reduction via diversity'}</p>

      <div style={S.panels}>
        {/* ── Left: Forest grid + accuracy curve ──────────────────────────── */}
        <div style={S.panelLeft}>
          <div style={S.sectionTitle}>Ensemble Construction (8 trees)</div>
          <canvas ref={forestCanvasRef} style={S.canvas} />

          <div style={S.controls}>
            <button
              style={nActive >= 8 ? { ...S.btnPrime, opacity: 0.5 } : S.btnPrime}
              onClick={() => setNActive(n => Math.min(8, n + 1))}
              disabled={nActive >= 8}
            >
              Add Tree
            </button>
            <button style={S.btn} onClick={() => setNActive(0)}>
              Reset
            </button>
            <span style={{ fontSize: 13, color: 'var(--ink-mid, #aaa)', fontFamily: 'var(--font-mono, monospace)' }}>
              {nActive === 0 ? 'no trees yet' : `${nActive}/8 trees`}
              {ensErr !== null && (
                <span style={{ color: 'var(--prime, #F0A500)', marginLeft: 8 }}>
                  {`ensemble acc: ${((1 - ensErr) * 100).toFixed(1)}%`}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* ── Right: Error bars + correlation heatmap ──────────────────────── */}
        <div style={S.panelRight}>
          <div style={S.sectionTitle}>Why Bagging Works</div>

          <canvas ref={errorCanvasRef} style={S.canvasSmall} />
          <canvas ref={corrCanvasRef} style={S.canvasSmall} />

          <div style={S.sliderRow}>
            <span style={{ flexShrink: 0, color: 'var(--ink-mid, #aaa)' }}>
              {`Feature subset ratio: ${featureRatio.toFixed(2)}`}
            </span>
            <input
              type="range"
              min={0.3}
              max={1.0}
              step={0.05}
              value={featureRatio}
              onChange={e => setFeatureRatio(parseFloat(e.target.value))}
              style={S.slider}
            />
          </div>

          <div style={S.formula}>
            <div style={{ color: 'var(--prime, #F0A500)', marginBottom: 4, fontWeight: 700 }}>
              Ensemble error formula
            </div>
            <div>{'Ensemble error ≈ ε(1 + (T-1)ρ) / T'}</div>
            <div style={{ marginTop: 4, color: 'var(--ink-low, #888)' }}>
              {`ε = avg tree error = ${(avgErr * 100).toFixed(1)}%`}
            </div>
            <div style={{ color: 'var(--ink-low, #888)' }}>
              {`ρ = tree correlation = ${correlation.toFixed(3)}`}
            </div>
            <div style={{ color: 'var(--ink-low, #888)', marginTop: 6, fontSize: 11, lineHeight: 1.6 }}>
              High feature ratio → trees see same features → high ρ → ensemble barely beats one tree.
              Low ratio → diverse trees → low ρ → errors cancel → strong ensemble.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
