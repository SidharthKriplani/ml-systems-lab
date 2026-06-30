import React, { useState, useRef, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';

// Seeded LCG
function makeLCG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

// Box-Muller normals via LCG
function normalPair(rng) {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1));
  return [r * Math.cos(2 * Math.PI * u2), r * Math.sin(2 * Math.PI * u2)];
}

// Generate 40 correlated 2D points at given rho, always same base noise
function generateCorrelated(rho, n = 40) {
  const rng = makeLCG(0xC0FFEE42);
  const std = 0.4;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const [z1, z2] = normalPair(rng);
    const x = std * z1;
    const y = std * (rho * z1 + Math.sqrt(Math.max(0, 1 - rho * rho)) * z2);
    pts.push({ x, y });
  }
  return pts;
}

// 2x2 eigendecomposition via closed form
// matrix [[a, b], [c, d]] — for symmetric covariance: b === c
function eigen2x2(a, b, d) {
  const mean = (a + d) / 2;
  const disc = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b));
  const lam1 = mean + disc; // larger eigenvalue
  const lam2 = mean - disc;

  // Eigenvector for lam1: [b, lam1 - a] or [lam1 - d, b]
  let v1x, v1y;
  if (Math.abs(b) > 1e-12) {
    v1x = b; v1y = lam1 - a;
  } else {
    // Already diagonal
    v1x = (a >= d) ? 1 : 0;
    v1y = (a >= d) ? 0 : 1;
  }
  const norm1 = Math.sqrt(v1x * v1x + v1y * v1y) || 1;
  v1x /= norm1; v1y /= norm1;

  // PC2 is perpendicular to PC1
  const v2x = -v1y;
  const v2y = v1x;

  return { lam1, lam2, v1: [v1x, v1y], v2: [v2x, v2y] };
}

function computeStats(pts) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  // Center
  const centered = pts.map((p) => ({ x: p.x - mx, y: p.y - my }));
  const vx = centered.reduce((s, p) => s + p.x * p.x, 0) / (n - 1);
  const vy = centered.reduce((s, p) => s + p.y * p.y, 0) / (n - 1);
  const cxy = centered.reduce((s, p) => s + p.x * p.y, 0) / (n - 1);
  const { lam1, lam2, v1, v2 } = eigen2x2(vx, cxy, vy);
  const totalVar = lam1 + lam2;
  const pct1 = totalVar > 0 ? (lam1 / totalVar) * 100 : 0;
  const pct2 = totalVar > 0 ? (lam2 / totalVar) * 100 : 0;
  return { centered, vx, vy, cxy, lam1, lam2, v1, v2, pct1, pct2 };
}

function drawCanvas(canvas, pts, stats, rho) {
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const cs = getComputedStyle(document.documentElement);
  const depth = cs.getPropertyValue('--depth').trim() || '#111';
  const rim = cs.getPropertyValue('--rim').trim() || '#333';
  const inkLow = cs.getPropertyValue('--ink-low').trim() || '#666';
  const inkMid = cs.getPropertyValue('--ink-mid').trim() || '#999';
  const prime = cs.getPropertyValue('--prime').trim() || '#F0A500';

  const STEEL = '#4a90d9';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Canvas center = data origin
  const ox = W / 2;
  const oy = H / 2;
  // Scale: map data range ~[-1.4, 1.4] to canvas
  const SCALE = Math.min(W, H) * 0.33;

  const toCanvas = (dx, dy) => ({ cx: ox + dx * SCALE, cy: oy - dy * SCALE });

  // Grid lines through origin
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.5;
  // Axes
  ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();

  // Light grid at ±0.4, ±0.8, ±1.2
  ctx.setLineDash([2, 4]);
  ctx.lineWidth = 0.4;
  for (const t of [-1.2, -0.8, -0.4, 0.4, 0.8, 1.2]) {
    const xc = ox + t * SCALE;
    const yc = oy - t * SCALE;
    ctx.beginPath(); ctx.moveTo(xc, 0); ctx.lineTo(xc, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, yc); ctx.lineTo(W, yc); ctx.stroke();
  }
  ctx.setLineDash([]);

  // Axis labels
  ctx.fillStyle = inkLow;
  ctx.font = `10px var(--font-mono, monospace)`;
  ctx.fillText('x', W - 12, oy - 4);
  ctx.fillText('y', ox + 4, 10);

  // Draw data points
  pts.forEach((p) => {
    const { cx, cy } = toCanvas(p.x, p.y);
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = inkMid;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  if (!stats) return;

  const { centered, v1, v2, lam1, lam2 } = stats;

  // Draw projections of each point onto PC1 (ticks)
  const { cx: ox2, cy: oy2 } = toCanvas(0, 0);
  ctx.strokeStyle = `${prime}55`;
  ctx.lineWidth = 0.8;
  centered.forEach((p) => {
    const proj = p.x * v1[0] + p.y * v1[1]; // scalar projection onto PC1
    const projX = proj * v1[0];
    const projY = proj * v1[1];
    const { cx: px, cy: py } = toCanvas(p.x, p.y);
    const { cx: ppx, cy: ppy } = toCanvas(projX, projY);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ppx, ppy);
    ctx.stroke();

    // Tick mark on PC1 line
    ctx.beginPath();
    ctx.arc(ppx, ppy, 2, 0, Math.PI * 2);
    ctx.fillStyle = prime;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // PC1 arrow — scale by sqrt(eigenvalue) x2.5 for visual clarity
  const PC1_LEN = Math.sqrt(lam1) * 2.5;
  const PC2_LEN = Math.sqrt(Math.max(0, lam2)) * 2.5;

  const drawArrow = (dir, len, color, label) => {
    const ex = dir[0] * len;
    const ey = dir[1] * len;
    const { cx: x2, cy: y2 } = toCanvas(ex, ey);
    const { cx: x0, cy: y0 } = toCanvas(-ex * 0.5, -ey * 0.5);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(y2 - y0, x2 - x0);
    const ARR = 9;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - ARR * Math.cos(angle - Math.PI / 6),
      y2 - ARR * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      x2 - ARR * Math.cos(angle + Math.PI / 6),
      y2 - ARR * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Label
    ctx.fillStyle = color;
    ctx.font = `bold 11px var(--font-sans, sans-serif)`;
    ctx.fillText(label, x2 + 5, y2 - 5);
    ctx.restore();
  };

  drawArrow(v2, PC2_LEN, STEEL, 'PC2');
  drawArrow(v1, PC1_LEN, prime, 'PC1');
}

const styles = {
  root: { fontFamily: `var(--font-sans, sans-serif)`, color: `var(--ink-hi, #eee)`, maxWidth: 700 },
  title: { margin: '0 0 4px 0', fontSize: 17, fontWeight: 700, color: `var(--ink-hi, #eee)` },
  subtitle: { margin: '0 0 14px 0', fontSize: 13, color: `var(--ink-low, #888)`, fontFamily: `var(--font-mono, monospace)` },
  canvas: { display: 'block', width: '100%', borderRadius: 6, border: `1px solid var(--rim, #333)` },
  controls: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  sliderLabel: { fontSize: 13, color: `var(--ink-mid, #aaa)`, display: 'flex', alignItems: 'center', gap: 8 },
  slider: { accentColor: `var(--prime, #F0A500)`, width: 160 },
  mono: { fontFamily: `var(--font-mono, monospace)`, color: `var(--prime, #F0A500)`, fontSize: 13 },
  statsRow: {
    marginTop: 12, display: 'flex', gap: 20, fontSize: 12,
    color: `var(--ink-mid, #aaa)`, fontFamily: `var(--font-mono, monospace)`, flexWrap: 'wrap',
  },
  statItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  statLabel: { color: `var(--ink-low, #888)`, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' },
  statVal: { color: `var(--ink-hi, #eee)`, fontSize: 14 },
  note: {
    marginTop: 12, padding: '8px 14px',
    background: 'rgba(240, 165, 0, 0.06)', border: '1px solid rgba(240, 165, 0, 0.25)',
    borderRadius: 6, fontSize: 12, color: `var(--ink-mid, #aaa)`,
    fontFamily: `var(--font-sans, sans-serif)`,
    lineHeight: 1.5,
  },
  pc1bar: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
  },
  barTrack: {
    flex: 1, height: 5, background: `var(--rim, #333)`, borderRadius: 3, overflow: 'hidden',
  },
};

export const PCAViz = forwardRef(function PCAViz(props, ref) {
  const canvasRef = useRef(null);
  const [rho, setRho] = useState(0.85);

  const animRef = useRef(null)

  const play = useCallback(() => {
    if (animRef.current) return
    animRef.current = setInterval(() => {
      setRho(prev => {
        const next = parseFloat((prev + 0.05).toFixed(2))
        return next > 0.98 ? 0 : next
      })
    }, 400)
  }, [])

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
  }, [])

  const reset = useCallback(() => {
    pause()
    setRho(0.85)
  }, [pause])

  const step = useCallback(() => {
    pause()
    setRho(prev => {
      const next = parseFloat((prev + 0.05).toFixed(2))
      return next > 0.98 ? 0.98 : next
    })
  }, [pause])

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step])

  useEffect(() => {
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [])

  const pts = useMemo(() => generateCorrelated(rho), [rho]);
  const stats = useMemo(() => computeStats(pts), [pts]);

  // DPR scaling: resize canvas backing store to match physical pixels
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawCanvas(canvasRef.current, pts, stats, rho);
    }
  }, [pts, stats, rho]);

  useEffect(() => { redraw(); }, [redraw]);

  const { pct1, pct2 } = stats;
  const highCorr = rho >= 0.93;

  return (
    <div style={styles.root}>
      <p style={styles.title}>PCA Visualizer</p>
      <p style={styles.subtitle}>{`40 correlated 2D points — drag ρ to watch PC1 absorb variance`}</p>

      <canvas
        ref={canvasRef}
        width={640}
        height={300}
        style={styles.canvas}
      />

      <div style={styles.controls}>
        <label style={styles.sliderLabel}>
          <span>ρ (correlation)</span>
          <input
            type="range" min={0} max={0.98} step={0.01} value={rho}
            onChange={(e) => setRho(parseFloat(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.mono}>{rho.toFixed(2)}</span>
        </label>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>PC1 variance</span>
          <div style={styles.pc1bar}>
            <span style={{ ...styles.statVal, color: '#F0A500' }}>{`${pct1.toFixed(1)}%`}</span>
            <div style={styles.barTrack}>
              <div style={{ width: `${pct1}%`, height: '100%', background: '#F0A500', borderRadius: 3 }} />
            </div>
          </div>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>PC2 variance</span>
          <div style={styles.pc1bar}>
            <span style={{ ...styles.statVal, color: '#4a90d9' }}>{`${pct2.toFixed(1)}%`}</span>
            <div style={styles.barTrack}>
              <div style={{ width: `${pct2}%`, height: '100%', background: '#4a90d9', borderRadius: 3 }} />
            </div>
          </div>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Points</span>
          <span style={styles.statVal}>40</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Correlation ρ</span>
          <span style={{ ...styles.statVal, color: `var(--prime, #F0A500)` }}>{rho.toFixed(2)}</span>
        </div>
      </div>

      {highCorr && (
        <div style={styles.note}>
          {`At ρ ≈ ${rho.toFixed(2)}, PC1 captures ${pct1.toFixed(0)}% of variance. You could drop PC2 with minimal information loss — this is dimensionality reduction.`}
        </div>
      )}
    </div>
  );
})
