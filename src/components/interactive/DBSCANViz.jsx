import { useRef, useEffect, useState, useCallback } from 'react';

// Seeded deterministic RNG (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generatePoints() {
  const rng = mulberry32(42);
  const points = [];

  // Cluster A: ring shape around (0.2, 0.5), radius ~0.1, 18 points
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * 2 * Math.PI + rng() * 0.3 - 0.15;
    const r = 0.085 + rng() * 0.03;
    points.push({ x: 0.2 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle), id: points.length });
  }

  // Cluster B: crescent shape around (0.65, 0.5), 18 points
  for (let i = 0; i < 18; i++) {
    const angle = -Math.PI / 2 + (i / 18) * Math.PI + rng() * 0.25 - 0.125;
    const r = 0.09 + rng() * 0.025;
    points.push({ x: 0.65 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle) * 1.3, id: points.length });
  }

  // Cluster C: dense cluster at (0.5, 0.8), 14 points
  for (let i = 0; i < 14; i++) {
    points.push({ x: 0.5 + (rng() - 0.5) * 0.1, y: 0.8 + (rng() - 0.5) * 0.08, id: points.length });
  }

  // Noise: 5 random scattered points
  for (let i = 0; i < 5; i++) {
    points.push({ x: 0.05 + rng() * 0.9, y: 0.05 + rng() * 0.9, id: points.length });
  }

  return points;
}

const POINTS = generatePoints();

function runDBSCAN(points, eps, minPts) {
  const n = points.length;
  const labels = new Array(n).fill(-1); // -1 = unvisited
  const NOISE = -2;
  let clusterId = 0;

  function getNeighbors(idx) {
    const neighbors = [];
    const px = points[idx].x, py = points[idx].y;
    for (let i = 0; i < n; i++) {
      const dx = points[i].x - px, dy = points[i].y - py;
      if (Math.sqrt(dx * dx + dy * dy) <= eps) neighbors.push(i);
    }
    return neighbors;
  }

  for (let i = 0; i < n; i++) {
    if (labels[i] !== -1) continue;
    const neighbors = getNeighbors(i);
    if (neighbors.length < minPts) {
      labels[i] = NOISE;
      continue;
    }
    labels[i] = clusterId;
    const queue = [...neighbors.filter(j => j !== i)];
    while (queue.length > 0) {
      const j = queue.shift();
      if (labels[j] === NOISE) labels[j] = clusterId;
      if (labels[j] !== -1) continue;
      labels[j] = clusterId;
      const jNeighbors = getNeighbors(j);
      if (jNeighbors.length >= minPts) {
        for (const k of jNeighbors) {
          if (labels[k] === -1 || labels[k] === NOISE) queue.push(k);
        }
      }
    }
    clusterId++;
  }

  // Identify core vs border
  const isCore = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (labels[i] < 0) continue;
    const neighbors = getNeighbors(i);
    if (neighbors.length >= minPts) isCore[i] = true;
  }

  return { labels, isCore, numClusters: clusterId };
}

const CLUSTER_COLORS = ['#F0A500', '#4A9EFF', '#2DD4BF', '#FF6B6B'];

export function DBSCANViz() {
  const canvasRef = useRef(null);
  const [eps, setEps] = useState(0.08);
  const [minPts, setMinPts] = useState(4);
  const [hovered, setHovered] = useState(null);
  const [result, setResult] = useState(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const PAD = 30;
    const dw = W - 2 * PAD, dh = H - 2 * PAD;

    const toCanvas = (x, y) => [PAD + x * dw, PAD + (1 - y) * dh];

    const { labels, isCore, numClusters } = runDBSCAN(POINTS, eps, minPts);

    // Background
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--depth').trim() || '#0F1117';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines (faint)
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--rim').trim() || '#2A2D3A';
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let g = 0; g <= 5; g++) {
      const t = g / 5;
      const [x0, y0] = toCanvas(t, 0);
      const [x1, y1] = toCanvas(t, 1);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const [x2, y2] = toCanvas(0, t);
      const [x3, y3] = toCanvas(1, t);
      ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x3, y3); ctx.stroke();
    }

    // Epsilon scale reference circle (top-right corner)
    const refX = W - PAD - 20, refY = PAD + 20;
    const refR = eps * dw;
    const primeColor = getComputedStyle(document.documentElement).getPropertyValue('--prime').trim() || '#F0A500';
    ctx.strokeStyle = primeColor + '55';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(refX, refY, refR, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink-low').trim() || '#888';
    ctx.font = '10px var(--font-mono, monospace)';
    ctx.fillText(`ε`, refX + refR + 3, refY + 3);

    // Hovered point eps circle
    if (hovered !== null) {
      const p = POINTS[hovered];
      const [cx, cy] = toCanvas(p.x, p.y);
      ctx.strokeStyle = primeColor + '44';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, eps * dw, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw points
    const NOISE_LABEL = -2;
    let coreCount = 0, borderCount = 0, noiseCount = 0;

    for (let i = 0; i < POINTS.length; i++) {
      const p = POINTS[i];
      const [cx, cy] = toCanvas(p.x, p.y);
      const label = labels[i];
      const core = isCore[i];
      const radius = core ? 6 : 4.5;

      if (label === NOISE_LABEL) {
        noiseCount++;
        const inkLow = getComputedStyle(document.documentElement).getPropertyValue('--ink-low').trim() || '#666';
        ctx.strokeStyle = inkLow;
        ctx.lineWidth = 1.5;
        const s = 4;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy - s); ctx.lineTo(cx + s, cy + s);
        ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy + s);
        ctx.stroke();
      } else {
        const color = CLUSTER_COLORS[label % CLUSTER_COLORS.length];
        if (core) {
          coreCount++;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          borderCount++;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }

      // Hover highlight
      if (i === hovered) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 3, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    setResult({ numClusters, coreCount, borderCount, noiseCount });
  }, [eps, minPts, hovered]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = 1 - (e.clientY - rect.top) / rect.height;
    const PAD_FRAC = 30 / canvas.width;
    const px = (mx - PAD_FRAC) / (1 - 2 * PAD_FRAC);
    const py = (my - PAD_FRAC / (canvas.height / canvas.width)) / (1 - 2 * 30 / canvas.height);

    let closest = null, minDist = Infinity;
    for (let i = 0; i < POINTS.length; i++) {
      const dx = POINTS[i].x - px, dy = POINTS[i].y - py;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) { minDist = d; closest = i; }
    }
    setHovered(minDist < 0.05 ? closest : null);
  }, []);

  const sliderStyle = {
    width: '100%',
    accentColor: 'var(--prime)',
    cursor: 'pointer',
  };

  const labelStyle = {
    fontSize: 13,
    color: 'var(--ink-mid)',
    fontFamily: 'var(--font-mono)',
    minWidth: 48,
    display: 'inline-block',
  };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: 24, fontFamily: 'var(--font-sans)' }}>
      <h3 style={{ margin: '0 0 4px', color: 'var(--ink-hi)', fontSize: 18, fontWeight: 700 }}>DBSCAN Clustering</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--ink-mid)', fontSize: 13 }}>
        Density-Based Spatial Clustering of Applications with Noise
      </p>

      <canvas
        ref={canvasRef}
        width={450}
        height={300}
        style={{ width: '100%', borderRadius: 8, border: '1px solid var(--rim)', display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      />

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label style={{ color: 'var(--ink-hi)', fontSize: 13, fontWeight: 600 }}>
              ε (epsilon) — search radius
            </label>
            <span style={labelStyle}>{eps.toFixed(3)}</span>
          </div>
          <input
            type="range" min={0.02} max={0.2} step={0.005}
            value={eps}
            onChange={e => setEps(parseFloat(e.target.value))}
            style={sliderStyle}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <label style={{ color: 'var(--ink-hi)', fontSize: 13, fontWeight: 600 }}>
              minPts — min neighbors for core point
            </label>
            <span style={labelStyle}>{minPts}</span>
          </div>
          <input
            type="range" min={2} max={8} step={1}
            value={minPts}
            onChange={e => setMinPts(parseInt(e.target.value))}
            style={sliderStyle}
          />
        </div>
      </div>

      {result && (
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--depth)', borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clusters Found</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--prime)' }}>{result.numClusters}</div>
          </div>
          <div style={{ background: 'var(--depth)', borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Core</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4A9EFF' }}>{result.coreCount}</div>
          </div>
          <div style={{ background: 'var(--depth)', borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Border</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#2DD4BF' }}>{result.borderCount}</div>
          </div>
          <div style={{ background: 'var(--depth)', borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Noise</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#888' }}>{result.noiseCount}</div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: 'var(--ink-mid)', flexWrap: 'wrap' }}>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#F0A500', marginRight: 5, verticalAlign: 'middle' }} />
          Core (filled)
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid #F0A500', marginRight: 5, verticalAlign: 'middle' }} />
          Border (outline)
        </span>
        <span style={{ color: '#888' }}>✕ Noise</span>
      </div>

      <p style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-low)', lineHeight: 1.6, borderTop: '1px solid var(--rim)', paddingTop: 12 }}>
        DBSCAN finds arbitrarily shaped clusters and naturally identifies noise. Unlike k-means, you don&apos;t specify the number of clusters — ε and minPts together determine density.
      </p>
    </div>
  );
}
