import { useRef, useEffect, useCallback } from 'react';

// Seeded deterministic RNG
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generatePoints() {
  const rng = mulberry32(99);
  const points = [];

  // Class 0: lower-left, with some noise
  for (let i = 0; i < 15; i++) {
    const x = rng() * 0.55;
    const y = rng() * 0.55;
    points.push({ x, y, label: 0 });
  }

  // Class 1: upper-right, with some noise
  for (let i = 0; i < 15; i++) {
    const x = 0.4 + rng() * 0.55;
    const y = 0.4 + rng() * 0.55;
    points.push({ x: Math.min(x, 0.98), y: Math.min(y, 0.98), label: 1 });
  }

  return points;
}

const POINTS = generatePoints();

// Decision stumps
const STUMPS = [
  {
    name: 'Stump A',
    predict: (x, y) => x > 0.45 ? 1 : 0,
    boundary: { type: 'vertical', val: 0.45 },
  },
  {
    name: 'Stump B',
    predict: (x, y) => y > 0.50 ? 1 : 0,
    boundary: { type: 'horizontal', val: 0.50 },
  },
  {
    name: 'Stump C',
    predict: (x, y) => x + y > 0.95 ? 1 : 0,
    boundary: { type: 'diagonal', val: 0.95 },
  },
];

function ensemblePredict(x, y) {
  const votes = STUMPS.reduce((acc, s) => acc + s.predict(x, y), 0);
  return votes >= 2 ? 1 : 0;
}

function accuracy(predictFn) {
  let correct = 0;
  for (const p of POINTS) {
    if (predictFn(p.x, p.y) === p.label) correct++;
  }
  return Math.round((correct / POINTS.length) * 100);
}

const STUMP_ACCURACIES = STUMPS.map(s => accuracy(s.predict));
const ENSEMBLE_ACCURACY = accuracy(ensemblePredict);

const CLASS0_COLOR = '#4A9EFF';
const CLASS1_COLOR = '#F0A500';
const WRONG_COLOR = '#FF6B6B';

function drawPanel(canvas, predictFn, boundary, isEnsemble) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const PAD = 20;
  const dw = W - 2 * PAD, dh = H - 2 * PAD;

  const toCanvas = (x, y) => [PAD + x * dw, PAD + (1 - y) * dh];

  // Background
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--depth').trim() || '#0F1117';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Background shading for prediction regions
  const steps = 40;
  for (let xi = 0; xi < steps; xi++) {
    for (let yi = 0; yi < steps; yi++) {
      const cx = (xi + 0.5) / steps;
      const cy = (yi + 0.5) / steps;
      const pred = predictFn(cx, cy);
      const [px, py] = toCanvas(cx, cy);
      const cellW = dw / steps, cellH = dh / steps;
      ctx.fillStyle = pred === 1
        ? `${CLASS1_COLOR}18`
        : `${CLASS0_COLOR}18`;
      ctx.fillRect(px - cellW / 2, py - cellH / 2, cellW, cellH);
    }
  }

  // Decision boundary
  const primeColor = getComputedStyle(document.documentElement).getPropertyValue('--prime').trim() || '#F0A500';
  ctx.strokeStyle = isEnsemble ? primeColor : (getComputedStyle(document.documentElement).getPropertyValue('--ink-mid').trim() || '#888');
  ctx.lineWidth = isEnsemble ? 2 : 1.5;
  ctx.setLineDash([5, 4]);

  if (boundary && boundary.type === 'vertical') {
    const [bx] = toCanvas(boundary.val, 0);
    ctx.beginPath();
    ctx.moveTo(bx, PAD);
    ctx.lineTo(bx, H - PAD);
    ctx.stroke();
  } else if (boundary && boundary.type === 'horizontal') {
    const [, by] = toCanvas(0, boundary.val);
    ctx.beginPath();
    ctx.moveTo(PAD, by);
    ctx.lineTo(W - PAD, by);
    ctx.stroke();
  } else if (boundary && boundary.type === 'diagonal') {
    // x + y = val => y = val - x
    const x0 = 0, y0 = boundary.val - x0;
    const x1 = 1, y1 = boundary.val - x1;
    const [cx0, cy0] = toCanvas(x0, Math.max(0, Math.min(1, y0)));
    const [cx1, cy1] = toCanvas(x1, Math.max(0, Math.min(1, y1)));
    ctx.beginPath();
    ctx.moveTo(cx0, cy0);
    ctx.lineTo(cx1, cy1);
    ctx.stroke();
  } else if (isEnsemble) {
    // Draw a rough ensemble boundary via contour
    // (skip explicit boundary, background shading shows it)
  }
  ctx.setLineDash([]);

  // Points
  for (const p of POINTS) {
    const pred = predictFn(p.x, p.y);
    const correct = pred === p.label;
    const [cx, cy] = toCanvas(p.x, p.y);
    const pointColor = p.label === 1 ? CLASS1_COLOR : CLASS0_COLOR;

    if (correct) {
      ctx.fillStyle = pointColor;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Wrong: draw X
      ctx.strokeStyle = WRONG_COLOR;
      ctx.lineWidth = 2;
      const s = 5;
      ctx.beginPath();
      ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
      ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
      ctx.stroke();
    }
  }
}

function PanelCanvas({ predictFn, boundary, isEnsemble, title, accuracy: acc }) {
  const canvasRef = useRef(null);

  const redraw = useCallback(() => {
    drawPanel(canvasRef.current, predictFn, boundary, isEnsemble);
  }, [predictFn, boundary, isEnsemble]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const prime = '#F0A500';

  return (
    <div style={{
      border: `1px solid ${isEnsemble ? prime : 'var(--rim)'}`,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: isEnsemble ? `0 0 12px ${prime}33` : 'none',
    }}>
      <div style={{
        padding: '7px 12px',
        background: isEnsemble ? `${prime}22` : 'var(--depth)',
        borderBottom: `1px solid ${isEnsemble ? prime : 'var(--rim)'}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: isEnsemble ? prime : 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>
          {title}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: isEnsemble ? prime : 'var(--ink-mid)' }}>
          {acc}% acc
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={180}
        height={160}
        style={{ width: '100%', display: 'block' }}
      />
    </div>
  );
}

export function EnsembleViz() {
  const accA = STUMP_ACCURACIES[0];
  const accB = STUMP_ACCURACIES[1];
  const accC = STUMP_ACCURACIES[2];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: 24, fontFamily: 'var(--font-sans)' }}>
      <h3 style={{ margin: '0 0 4px', color: 'var(--ink-hi)', fontSize: 18, fontWeight: 700 }}>Ensemble Methods</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--ink-mid)', fontSize: 13 }}>
        Three decision stumps combined via majority vote
      </p>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, color: 'var(--ink-mid)', flexWrap: 'wrap' }}>
        <span>
          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: CLASS0_COLOR, marginRight: 5, verticalAlign: 'middle' }} />
          Class 0 (correct)
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: CLASS1_COLOR, marginRight: 5, verticalAlign: 'middle' }} />
          Class 1 (correct)
        </span>
        <span style={{ color: WRONG_COLOR }}>
          ✕ Misclassified
        </span>
        <span style={{ color: 'var(--ink-low)' }}>
          Shading = predicted region
        </span>
      </div>

      {/* 2×2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <PanelCanvas
          predictFn={STUMPS[0].predict}
          boundary={STUMPS[0].boundary}
          isEnsemble={false}
          title="Stump A"
          accuracy={accA}
        />
        <PanelCanvas
          predictFn={STUMPS[1].predict}
          boundary={STUMPS[1].boundary}
          isEnsemble={false}
          title="Stump B"
          accuracy={accB}
        />
        <PanelCanvas
          predictFn={STUMPS[2].predict}
          boundary={STUMPS[2].boundary}
          isEnsemble={false}
          title="Stump C"
          accuracy={accC}
        />
        <PanelCanvas
          predictFn={ensemblePredict}
          boundary={null}
          isEnsemble={true}
          title="Ensemble (majority vote)"
          accuracy={ENSEMBLE_ACCURACY}
        />
      </div>

      {/* Summary bar */}
      <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--depth)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        <span style={{ color: 'var(--ink-mid)' }}>Individual stumps: </span>
        <span style={{ color: 'var(--ink-hi)' }}>{accA}%</span>
        <span style={{ color: 'var(--ink-low)' }}>, </span>
        <span style={{ color: 'var(--ink-hi)' }}>{accB}%</span>
        <span style={{ color: 'var(--ink-low)' }}>, </span>
        <span style={{ color: 'var(--ink-hi)' }}>{accC}%</span>
        <span style={{ color: 'var(--ink-mid)' }}> → Ensemble: </span>
        <span style={{ color: '#F0A500', fontWeight: 700 }}>{ENSEMBLE_ACCURACY}%</span>
      </div>

      <p style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-low)', lineHeight: 1.6, borderTop: '1px solid var(--rim)', paddingTop: 12 }}>
        No single stump is accurate, but their errors are uncorrelated — different stumps make mistakes on different points. Majority voting cancels out individual errors. This is why ensembles work.
      </p>
    </div>
  );
}
