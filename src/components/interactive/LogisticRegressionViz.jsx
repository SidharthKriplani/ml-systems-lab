import { useState, useRef, useEffect, useMemo } from 'react';

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
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function generateDataset() {
  const rng = mulberry32(0xcafebabe);
  const points = [];

  // Class 0 — centered at (0.35, 0.35), spread 0.12
  for (let i = 0; i < 20; i++) {
    const x = 0.35 + randn(rng) * 0.12;
    const y = 0.35 + randn(rng) * 0.12;
    points.push({ x, y, label: 0 });
  }
  // Class 1 — centered at (0.65, 0.65), spread 0.12
  for (let i = 0; i < 20; i++) {
    const x = 0.65 + randn(rng) * 0.12;
    const y = 0.65 + randn(rng) * 0.12;
    points.push({ x, y, label: 1 });
  }

  return points;
}

const DATA = generateDataset();

// Decision boundary: w = centroid1 - centroid0, normalised by ||diff||²
const C0 = { x: 0.35, y: 0.35 };
const C1 = { x: 0.65, y: 0.65 };
const diffX = C1.x - C0.x;
const diffY = C1.y - C0.y;
const norm2 = diffX * diffX + diffY * diffY;

// w vector
const WX = diffX / norm2;
const WY = diffY / norm2;

// bias: b = -w · midpoint
const midX = (C0.x + C1.x) / 2;
const midY = (C0.y + C1.y) / 2;
const BIAS = -(WX * midX + WY * midY);

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

function predict(x, y) {
  return sigmoid(WX * x + WY * y + BIAS);
}

// ---- canvas drawing ----
const CANVAS_W = 450;
const CANVAS_H = 300;

function toCanvas(x, y, W, H) {
  return [x * W, (1 - y) * H];
}

function fromCanvas(cx, cy, W, H) {
  return [cx / W, 1 - cy / H];
}

function drawScene(canvas, threshold) {
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const cs = getComputedStyle(document.documentElement);

  const depth    = cs.getPropertyValue('--depth').trim()    || '#111827';
  const rimColor = cs.getPropertyValue('--rim').trim()      || '#2a2a2a';
  const inkLow   = cs.getPropertyValue('--ink-low').trim()  || '#555';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // --- Background decision regions (4×4 grid downsampled) ---
  const TILE = 4;
  for (let py = 0; py < H; py += TILE) {
    for (let px = 0; px < W; px += TILE) {
      const [fx, fy] = fromCanvas(px + TILE / 2, py + TILE / 2, W, H);
      const p = predict(fx, fy);
      if (p > threshold) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.12)'; // faint blue
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';  // faint red
      }
      ctx.fillRect(px, py, TILE, TILE);
    }
  }

  // --- Decision boundary line where p = threshold ---
  // p = threshold  =>  sigmoid(z) = threshold  =>  z = logit(threshold)
  // z = WX*x + WY*y + BIAS = logit
  // WY*y = logit - WX*x - BIAS
  // y = (logit - WX*x - BIAS) / WY   (if WY != 0)
  const logit = Math.log(threshold / (1 - threshold));

  ctx.strokeStyle = 'rgba(250,250,250,0.55)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();

  if (Math.abs(WY) > 1e-10) {
    // Scan x from 0 to 1 and compute boundary y
    const STEPS = 200;
    let started = false;
    for (let i = 0; i <= STEPS; i++) {
      const fx = i / STEPS;
      const fy = (logit - WX * fx - BIAS) / WY;
      if (fy < 0 || fy > 1) continue;
      const [cx, cy] = toCanvas(fx, fy, W, H);
      if (!started) { ctx.moveTo(cx, cy); started = true; }
      else ctx.lineTo(cx, cy);
    }
    if (started) ctx.stroke();
  }
  ctx.setLineDash([]);

  // --- Grid lines (subtle) ---
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 0.4;
  for (let i = 0; i <= 4; i++) {
    const gx = (i / 4) * W;
    const gy = (i / 4) * H;
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // --- Data points ---
  for (const pt of DATA) {
    const prob = predict(pt.x, pt.y);
    const predictedLabel = prob > threshold ? 1 : 0;
    const misclassified = predictedLabel !== pt.label;

    const [cx, cy] = toCanvas(pt.x, pt.y, W, H);
    const fillColor = pt.label === 0 ? 'rgba(239,68,68,0.85)' : 'rgba(59,130,246,0.85)';
    const strokeColor = pt.label === 0 ? '#ef4444' : '#3b82f6';

    if (misclassified) {
      // Draw open circle with X mark
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // X mark
      const d = 4;
      ctx.beginPath();
      ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d);
      ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // --- Axis labels ---
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.textAlign = 'center';
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    const [cx] = toCanvas(v, 0, W, H);
    ctx.fillText(v.toFixed(2), cx, H - 3);
  }
  ctx.textAlign = 'right';
  for (const v of [0, 0.25, 0.5, 0.75, 1]) {
    const [, cy] = toCanvas(0, v, W, H);
    ctx.fillText(v.toFixed(2), 26, cy + 3);
  }

  // --- Legend (bottom-right) ---
  ctx.font = `10px var(--font-mono, monospace)`;
  ctx.textAlign = 'left';
  // Class 0 - red dot
  ctx.beginPath(); ctx.arc(W - 110, H - 28, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(239,68,68,0.85)'; ctx.fill();
  ctx.fillStyle = inkLow; ctx.fillText('Class 0', W - 102, H - 24);
  // Class 1 - blue dot
  ctx.beginPath(); ctx.arc(W - 110, H - 12, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(59,130,246,0.85)'; ctx.fill();
  ctx.fillStyle = inkLow; ctx.fillText('Class 1', W - 102, H - 8);
}

function computeStats(threshold) {
  let TP = 0, TN = 0, FP = 0, FN = 0;
  for (const pt of DATA) {
    const prob = predict(pt.x, pt.y);
    const pred = prob > threshold ? 1 : 0;
    if (pred === 1 && pt.label === 1) TP++;
    else if (pred === 0 && pt.label === 0) TN++;
    else if (pred === 1 && pt.label === 0) FP++;
    else FN++;
  }
  const accuracy  = (TP + TN) / DATA.length;
  const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
  const recall    = TP + FN > 0 ? TP / (TP + FN) : 0;
  return { TP, TN, FP, FN, accuracy, precision, recall };
}

export function LogisticRegressionViz() {
  const [threshold, setThreshold] = useState(0.5);
  const canvasRef = useRef(null);

  const stats = useMemo(() => computeStats(threshold), [threshold]);

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
      drawScene(canvas, threshold);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    drawScene(canvas, threshold);
  }, [threshold]);

  const fmtPct = v => (v * 100).toFixed(1) + '%';

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Threshold slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{
          fontSize: '13px',
          color: 'var(--ink-mid, #888)',
          fontFamily: 'var(--font-mono, monospace)',
          whiteSpace: 'nowrap',
        }}>
          Threshold:
        </label>
        <input
          type="range"
          min={0.1}
          max={0.9}
          step={0.01}
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--prime, #F0A500)' }}
        />
        <span style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--prime, #F0A500)',
          fontFamily: 'var(--font-mono, monospace)',
          minWidth: '42px',
          textAlign: 'right',
        }}>
          {threshold.toFixed(2)}
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${CANVAS_H}px`,
          borderRadius: '6px',
          border: '1px solid var(--rim, #2a2a2a)',
          display: 'block',
        }}
      />

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, auto)',
        gap: '6px 28px',
        justifyContent: 'start',
        fontSize: '13px',
        fontFamily: 'var(--font-mono, monospace)',
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '6px',
        padding: '10px 16px',
      }}>
        <span style={{ color: 'var(--ink-low, #555)' }}>Accuracy</span>
        <span style={{ color: 'var(--ink-hi, #e5e5e5)', fontWeight: 600 }}>
          {fmtPct(stats.accuracy)}
        </span>

        <span style={{ color: 'var(--ink-low, #555)' }}>Precision</span>
        <span style={{ color: 'var(--ink-hi, #e5e5e5)', fontWeight: 600 }}>
          {fmtPct(stats.precision)}
        </span>

        <span style={{ color: 'var(--ink-low, #555)' }}>Recall</span>
        <span style={{ color: 'var(--ink-hi, #e5e5e5)', fontWeight: 600 }}>
          {fmtPct(stats.recall)}
        </span>

        <span style={{ color: 'var(--ink-low, #555)' }}>TP / TN / FP / FN</span>
        <span style={{ color: 'var(--ink-mid, #888)' }}>
          {stats.TP} / {stats.TN} / {stats.FP} / {stats.FN}
        </span>
      </div>

      {/* Explanatory note */}
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: 'var(--ink-ghost, #3a3a3a)',
        lineHeight: '1.7',
        borderTop: '1px solid var(--rim, #2a2a2a)',
        paddingTop: '10px',
      }}>
        {`The decision boundary shifts as you move the threshold — trading off precision vs recall. At threshold = 0.5, the boundary sits at equal probability. Moving it left (lower threshold) increases recall but reduces precision.`}
      </p>
    </div>
  );
}
