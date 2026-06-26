import { useState, useRef, useEffect } from 'react';

function makeLCG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}
function normalPair(rng) {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1));
  return [r * Math.cos(2 * Math.PI * u2), r * Math.sin(2 * Math.PI * u2)];
}

function generateP5() {
  const rng = makeLCG(0x11111111);
  const pts = [];

  // Class 0: 8 pts around (-6,-6), 7 pts around (-4,-8), spread 0.8
  for (let i = 0; i < 8; i++) {
    const [dx, dy] = normalPair(rng);
    pts.push({ x: -6 + dx * 0.8, y: -6 + dy * 0.8, cls: 0 });
  }
  for (let i = 0; i < 7; i++) {
    const [dx, dy] = normalPair(rng);
    pts.push({ x: -4 + dx * 0.8, y: -8 + dy * 0.8, cls: 0 });
  }

  // Class 1: 12 pts around (6,6) spread 1.0, 3 outliers spread 2.5
  for (let i = 0; i < 12; i++) {
    const [dx, dy] = normalPair(rng);
    pts.push({ x: 6 + dx * 1.0, y: 6 + dy * 1.0, cls: 1 });
  }
  for (let i = 0; i < 3; i++) {
    const [dx, dy] = normalPair(rng);
    pts.push({ x: 6 + dx * 2.5, y: 6 + dy * 2.5, cls: 1 });
  }

  // Class 2: 15 pts along diagonal from (0,4) to (4,0), spread 0.6
  for (let i = 0; i < 15; i++) {
    const t = i / 14;
    const cx = t * 4;
    const cy = 4 - t * 4;
    const [dx, dy] = normalPair(rng);
    pts.push({ x: cx + dx * 0.6, y: cy + dy * 0.6, cls: 2 });
  }

  // Class 3: 8 pts around (-5,5), 7 pts around (-7,3), spread 0.8
  for (let i = 0; i < 8; i++) {
    const [dx, dy] = normalPair(rng);
    pts.push({ x: -5 + dx * 0.8, y: 5 + dy * 0.8, cls: 3 });
  }
  for (let i = 0; i < 7; i++) {
    const [dx, dy] = normalPair(rng);
    pts.push({ x: -7 + dx * 0.8, y: 3 + dy * 0.8, cls: 3 });
  }

  return pts;
}

function generateP30() {
  const rng = makeLCG(0x22222222);
  const pts = [];
  const centers = [[-6, -5], [6, 5], [5, -5], [-5, 5]];
  for (let cls = 0; cls < 4; cls++) {
    const [cx, cy] = centers[cls];
    for (let i = 0; i < 15; i++) {
      const [dx, dy] = normalPair(rng);
      pts.push({ x: cx + dx * 1.5, y: cy + dy * 1.5, cls });
    }
  }
  return pts;
}

function generateP100() {
  const rng = makeLCG(0x33333333);
  const pts = [];
  const centers = [[-3, -3], [3, 3], [3, -3], [-3, 3]];
  for (let cls = 0; cls < 4; cls++) {
    const [cx, cy] = centers[cls];
    for (let i = 0; i < 15; i++) {
      const [dx, dy] = normalPair(rng);
      pts.push({ x: cx + dx * 2.5, y: cy + dy * 2.5, cls });
    }
  }
  return pts;
}

const TSNE_P5 = generateP5();
const TSNE_P30 = generateP30();
const TSNE_P100 = generateP100();

const CLASS_COLORS = ['#F0A500', '#4a90d9', '#2abf8f', '#e85050'];

const TABS = [
  { label: 'Perplexity = 5', data: TSNE_P5, key: 'p5' },
  { label: 'Perplexity = 30', data: TSNE_P30, key: 'p30' },
  { label: 'Perplexity = 100', data: TSNE_P100, key: 'p100' },
];

const INSIGHTS = {
  p5: `Too low — t-SNE only sees local neighborhood. Artificial subclusters appear.`,
  p30: `Good — captures both local and global structure.`,
  p100: `Too high — global distances dominate, losing cluster tightness.`,
};

const W = 430;
const H = 300;
const PAD = 28;

function drawCanvas(canvas, points) {
  const ctx = canvas.getContext('2d');

  // Compute min/max
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const p of points) {
    if (p.x < xMin) xMin = p.x;
    if (p.x > xMax) xMax = p.x;
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const xPad = Math.max(xRange * 0.1, 0.5);
  const yPad = Math.max(yRange * 0.1, 0.5);
  xMin -= xPad; xMax += xPad;
  yMin -= yPad; yMax += yPad;

  const toCanvasX = (x) => PAD + (x - xMin) / (xMax - xMin) * (W - 2 * PAD);
  const toCanvasY = (y) => PAD + (1 - (y - yMin) / (yMax - yMin)) * (H - 2 * PAD);

  // Background
  const bg = getComputedStyle(canvas).getPropertyValue('--depth').trim() || '#111';
  ctx.fillStyle = bg || '#111';
  ctx.fillRect(0, 0, W, H);

  // Grid
  const rimColor = getComputedStyle(canvas).getPropertyValue('--rim').trim() || '#333';
  ctx.strokeStyle = rimColor || '#333';
  ctx.lineWidth = 0.5;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const t = i / gridLines;
    // Vertical
    const gx = PAD + t * (W - 2 * PAD);
    ctx.beginPath();
    ctx.moveTo(gx, PAD);
    ctx.lineTo(gx, H - PAD);
    ctx.stroke();
    // Horizontal
    const gy = PAD + t * (H - 2 * PAD);
    ctx.beginPath();
    ctx.moveTo(PAD, gy);
    ctx.lineTo(W - PAD, gy);
    ctx.stroke();
  }

  // Points
  for (const p of points) {
    const px = toCanvasX(p.x);
    const py = toCanvasY(p.y);
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fillStyle = CLASS_COLORS[p.cls];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

const S = {
  root: { fontFamily: `var(--font-sans, sans-serif)`, color: `var(--ink-hi, #eee)`, maxWidth: 700 },
  title: { margin: '0 0 4px 0', fontSize: 17, fontWeight: 700 },
  subtitle: { margin: '0 0 14px 0', fontSize: 13, color: `var(--ink-low, #888)`, fontFamily: `var(--font-mono, monospace)` },
  tabs: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  tab: (active) => ({ padding: '6px 14px', borderRadius: 6, border: `1px solid ${active ? 'var(--prime, #F0A500)' : 'var(--rim, #555)'}`, background: active ? 'rgba(240,165,0,0.12)' : `var(--depth, #111)`, color: active ? `var(--prime, #F0A500)` : `var(--ink-mid, #aaa)`, cursor: 'pointer', fontSize: 13 }),
  canvas: { display: 'block', width: '100%', borderRadius: 6, border: `1px solid var(--rim, #333)` },
  legend: { display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: `var(--ink-mid, #aaa)` },
  legendDot: (color) => ({ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }),
  insight: { marginTop: 10, padding: '8px 12px', background: `var(--depth, #111)`, border: `1px solid var(--rim, #333)`, borderRadius: 6, fontSize: 13, color: `var(--ink-mid, #aaa)` },
  note: { marginTop: 12, padding: '10px 14px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 6, fontSize: 12, color: `var(--ink-mid, #aaa)`, lineHeight: 1.6 },
};

export function TSNEViz() {
  const [activeIdx, setActiveIdx] = useState(1);
  const canvasRef = useRef(null);

  const activeTab = TABS[activeIdx];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas(canvas, activeTab.data);
  }, [activeIdx]);

  return (
    <div style={S.root}>
      <p style={S.title}>t-SNE Visualization</p>
      <p style={S.subtitle}>{'sklearn.manifold.TSNE — effect of perplexity'}</p>

      <div style={S.tabs}>
        {TABS.map((tab, i) => (
          <button
            key={tab.key}
            style={S.tab(i === activeIdx)}
            onClick={() => setActiveIdx(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={S.canvas}
      />

      <div style={S.legend}>
        {CLASS_COLORS.map((color, i) => (
          <div key={i} style={S.legendItem}>
            <div style={S.legendDot(color)} />
            <span>{`Class ${i}`}</span>
          </div>
        ))}
      </div>

      <div style={S.insight}>
        <strong>{'Insight: '}</strong>{INSIGHTS[activeTab.key]}
      </div>

      <div style={S.note}>
        <strong>{'Note: '}</strong>
        {`t-SNE is for visualization only — distances in the 2D plot are NOT meaningful for prediction. It is non-parametric (can't embed new points), non-deterministic (run it twice, get different results), and O(n²) without approximation.`}
      </div>
    </div>
  );
}
