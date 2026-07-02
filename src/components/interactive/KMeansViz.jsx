import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// Seeded LCG random — produces deterministic floats in [0,1)
function makeLCG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

// Generate 42 points in 3 natural clusters, always identical
function generatePoints() {
  const rng = makeLCG(0xDEADBEEF);
  const clusters = [
    { cx: 0.2, cy: 0.7, spread: 0.12, n: 14 },
    { cx: 0.6, cy: 0.3, spread: 0.10, n: 14 },
    { cx: 0.8, cy: 0.75, spread: 0.10, n: 14 },
  ];
  const pts = [];
  clusters.forEach((cl, ci) => {
    for (let i = 0; i < cl.n; i++) {
      // Box-Muller for normal distribution
      const u1 = Math.max(1e-10, rng());
      const u2 = rng();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(Math.max(1e-10, rng()))) * Math.cos(2 * Math.PI * rng());
      pts.push({
        x: Math.min(0.97, Math.max(0.03, cl.cx + z0 * cl.spread)),
        y: Math.min(0.97, Math.max(0.03, cl.cy + z1 * cl.spread)),
        trueCluster: ci,
      });
    }
  });
  return pts;
}

const POINTS = generatePoints();

const CLUSTER_COLORS = ['#F0A500', '#4a90d9', '#e85050', '#2abf8f', '#8b5cf6'];

function initCentroids(k) {
  const rng = makeLCG(0xBEEFCAFE + k * 0x1337);
  const pts = POINTS;
  const chosen = [];
  const used = new Set();
  while (chosen.length < k) {
    const idx = Math.floor(rng() * pts.length);
    if (!used.has(idx)) {
      used.add(idx);
      chosen.push({ x: pts[idx].x, y: pts[idx].y });
    }
  }
  return chosen;
}

function assignPoints(points, centroids) {
  return points.map((p) => {
    let best = 0;
    let bestDist = Infinity;
    centroids.forEach((c, ci) => {
      const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
      if (d < bestDist) { bestDist = d; best = ci; }
    });
    return { ...p, cluster: best };
  });
}

function updateCentroids(assignedPoints, k) {
  return Array.from({ length: k }, (_, ci) => {
    const members = assignedPoints.filter((p) => p.cluster === ci);
    if (members.length === 0) return { x: Math.random(), y: Math.random() };
    const mx = members.reduce((s, p) => s + p.x, 0) / members.length;
    const my = members.reduce((s, p) => s + p.y, 0) / members.length;
    return { x: mx, y: my };
  });
}

function centroidMoveDist(prev, next) {
  return prev.reduce((sum, c, i) => sum + Math.sqrt((c.x - next[i].x) ** 2 + (c.y - next[i].y) ** 2), 0);
}

function drawCanvas(canvas, points, centroids, phase, k) {
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const cs = getComputedStyle(document.documentElement);
  const depth = cs.getPropertyValue('--depth').trim() || '#111';
  const rim = cs.getPropertyValue('--rim').trim() || '#333';
  const inkLow = cs.getPropertyValue('--ink-low').trim() || '#666';

  // Padding
  const PAD = 20;
  const plotW = W - 2 * PAD;
  const plotH = H - 2 * PAD;

  const toCanvas = (px, py) => ({
    cx: PAD + px * plotW,
    cy: PAD + (1 - py) * plotH,
  });

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Light grid
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.5;
  for (let g = 0; g <= 4; g++) {
    const frac = g / 4;
    const x = PAD + frac * plotW;
    const y = PAD + frac * plotH;
    ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + plotW, y); ctx.stroke();
  }

  // Draw points
  points.forEach((p) => {
    const { cx, cy } = toCanvas(p.x, p.y);
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    if (phase === 'init' || p.cluster === undefined) {
      ctx.fillStyle = inkLow;
    } else {
      ctx.fillStyle = CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length];
      ctx.globalAlpha = 0.75;
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Draw centroids
  if (phase !== 'init' && centroids.length > 0) {
    centroids.forEach((c, ci) => {
      const { cx, cy } = toCanvas(c.x, c.y);
      const color = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
      const SIZE = 9;
      ctx.save();
      ctx.translate(cx, cy);

      // White backing cross
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-SIZE, -SIZE); ctx.lineTo(SIZE, SIZE);
      ctx.moveTo(SIZE, -SIZE); ctx.lineTo(-SIZE, SIZE);
      ctx.stroke();

      // Colored cross
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-SIZE, -SIZE); ctx.lineTo(SIZE, SIZE);
      ctx.moveTo(SIZE, -SIZE); ctx.lineTo(-SIZE, SIZE);
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();

      // Label
      ctx.fillStyle = color;
      ctx.font = `bold 10px var(--font-mono, monospace)`;
      ctx.fillText(`C${ci + 1}`, cx + 11, cy - 6);
    });
  }
}

const styles = {
  root: {
    fontFamily: `var(--font-sans, sans-serif)`,
    color: `var(--ink-hi, #eee)`,
    maxWidth: 700,
  },
  title: { margin: '0 0 4px 0', fontSize: 17, fontWeight: 700, color: `var(--ink-hi, #eee)` },
  subtitle: { margin: '0 0 14px 0', fontSize: 13, color: `var(--ink-low, #888)`, fontFamily: `var(--font-mono, monospace)` },
  canvas: { display: 'block', width: '100%', borderRadius: 6, border: `1px solid var(--rim, #333)` },
  controls: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  sliderLabel: { fontSize: 13, color: `var(--ink-mid, #aaa)`, display: 'flex', alignItems: 'center', gap: 8 },
  slider: { accentColor: `var(--prime, #F0A500)`, width: 110 },
  mono: { fontFamily: `var(--font-mono, monospace)`, color: `var(--prime, #F0A500)`, fontSize: 13 },
  btn: {
    padding: '6px 14px', borderRadius: 6, border: `1px solid var(--rim, #555)`,
    background: `var(--depth, #111)`, color: `var(--ink-hi, #eee)`,
    cursor: 'pointer', fontSize: 13, fontFamily: `var(--font-sans, sans-serif)`,
  },
  btnPrime: {
    padding: '6px 14px', borderRadius: 6, border: `1px solid var(--prime, #F0A500)`,
    background: `var(--prime, #F0A500)`, color: '#000',
    cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: `var(--font-sans, sans-serif)`,
  },
  statusRow: {
    marginTop: 12, display: 'flex', gap: 16, fontSize: 12,
    color: `var(--ink-mid, #aaa)`, fontFamily: `var(--font-mono, monospace)`, flexWrap: 'wrap',
    alignItems: 'center',
  },
  convergedBadge: {
    marginTop: 10, padding: '8px 14px', background: 'rgba(74, 222, 128, 0.1)',
    border: '1px solid rgba(74, 222, 128, 0.35)', borderRadius: 6,
    color: '#4ade80', fontSize: 13,
  },
};

export const KMeansViz = forwardRef(function KMeansViz(props, ref) {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const runStateRef = useRef(null);

  // DPR scaling: resize canvas backing store to match physical pixels
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      const { points: cp, centroids: cc, phase: ph, k: ck } = runStateRef.current;
      drawCanvas(canvas, cp, cc, ph, ck);
    });
    ro.observe(canvas);
    // Initial sizing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    }
    return () => ro.disconnect();
  }, []);

  const [k, setK] = useState(3);
  const [phase, setPhase] = useState('init');
  const [points, setPoints] = useState(POINTS);
  const [centroids, setCentroids] = useState([]);
  const [stepCount, setStepCount] = useState(0);
  const [lastDist, setLastDist] = useState(null);
  const [converged, setConverged] = useState(false);
  const [running, setRunning] = useState(false);

  // Keep a ref of current state for the interval loop and ResizeObserver
  runStateRef.current = { points, centroids, stepCount, converged, phase, k };

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawCanvas(canvasRef.current, points, centroids, phase, k);
    }
  }, [points, centroids, phase, k]);

  useEffect(() => { redraw(); }, [redraw]);

  const doOneStep = useCallback((curPoints, curCentroids, curStep) => {
    const assigned = assignPoints(curPoints, curCentroids);
    const newCentroids = updateCentroids(assigned, curCentroids.length);
    const dist = centroidMoveDist(curCentroids, newCentroids);
    const isConverged = dist < 0.001;
    const newStep = curStep + 1;
    setPoints(assigned);
    setCentroids(newCentroids);
    setStepCount(newStep);
    setLastDist(dist);
    setPhase(isConverged ? 'converged' : 'assigned');
    if (isConverged) {
      setConverged(true);
      setRunning(false);
    }
    return { assigned, newCentroids, newStep, isConverged };
  }, []);

  const handleInit = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setConverged(false);
    setStepCount(0);
    setLastDist(null);
    const c = initCentroids(k);
    const assigned = assignPoints(POINTS, c);
    setPoints(assigned);
    setCentroids(c);
    setPhase('assigned');
  }, [k]);

  const handleStep = useCallback(() => {
    if (converged || phase === 'init') return;
    const { points: cp, centroids: cc, stepCount: cs } = runStateRef.current;
    doOneStep(cp, cc, cs);
  }, [converged, phase, doOneStep]);

  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      const { points: cp, centroids: cc, stepCount: cs, converged: cv } = runStateRef.current;
      if (cv) { setRunning(false); clearInterval(intervalRef.current); return; }
      doOneStep(cp, cc, cs);
    }, 600);
    return () => clearInterval(intervalRef.current);
  }, [running, doOneStep]);

  const handleRun = useCallback(() => {
    if (converged || phase === 'init') return;
    setRunning((r) => !r);
  }, [converged, phase]);

  // Re-seed centroids from scratch and auto-run Lloyd's iterations to
  // convergence. Used by the imperative play() so ▶ always restarts the
  // animation from a fresh initialization, even after it has converged.
  const startFresh = useCallback(() => {
    clearInterval(intervalRef.current);
    setConverged(false);
    setStepCount(0);
    setLastDist(null);
    const c = initCentroids(k);
    const assigned = assignPoints(POINTS, c);
    setPoints(assigned);
    setCentroids(c);
    setPhase('assigned');
    setRunning(true);
  }, [k]);

  const handleReset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setConverged(false);
    setStepCount(0);
    setLastDist(null);
    setCentroids([]);
    setPoints(POINTS);
    setPhase('init');
  }, []);

  // Reset when k changes
  useEffect(() => {
    handleReset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);

  useImperativeHandle(ref, () => ({
    // Always re-seed centroids and animate Lloyd's iterations from scratch to
    // convergence — even if the previous run already converged.
    play: startFresh,
    pause: () => { setRunning(false) },
    reset: handleReset,
    step: () => {
      if (phase === 'init') { handleInit(); } else { handleStep(); }
    },
  }), [phase, startFresh, handleInit, handleStep, handleReset])

  return (
    <div style={styles.root}>
      <p style={styles.title}>K-Means Clustering</p>
      <p style={styles.subtitle}>{`42 points · 3 natural clusters · step through E-step / M-step`}</p>

      <div style={{ position: 'relative', width: '100%', minHeight: '320px' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={300}
          style={{ ...styles.canvas, height: '100%', minHeight: '320px' }}
        />
      </div>

      <div style={styles.controls}>
        <label style={styles.sliderLabel}>
          <span>k</span>
          <input
            type="range" min={2} max={5} step={1} value={k}
            onChange={(e) => setK(parseInt(e.target.value, 10))}
            style={styles.slider}
          />
          <span style={styles.mono}>{k}</span>
        </label>

        <button style={styles.btnPrime} onClick={handleInit}>
          Initialize
        </button>

        <button
          style={phase === 'init' || converged ? { ...styles.btn, opacity: 0.4 } : styles.btn}
          onClick={handleStep}
          disabled={phase === 'init' || converged}
        >
          Step
        </button>

        <button
          style={phase === 'init' || converged ? { ...styles.btn, opacity: 0.4 } : running ? styles.btn : styles.btn}
          onClick={handleRun}
          disabled={phase === 'init' || converged}
        >
          {running ? 'Pause' : 'Run'}
        </button>

        <button style={styles.btn} onClick={handleReset}>
          Reset
        </button>
      </div>

      <div style={styles.statusRow}>
        <span>{`Step ${stepCount}`}</span>
        {lastDist !== null && (
          <span style={{ color: converged ? '#4ade80' : `var(--ink-mid, #aaa)` }}>
            {`Centroids last moved: ${lastDist.toFixed(5)}`}
          </span>
        )}
        {phase === 'init' && (
          <span style={{ color: `var(--ink-low, #888)` }}>
            Set k and press Initialize to place centroids
          </span>
        )}
      </div>

      {converged && (
        <div style={styles.convergedBadge}>
          {`Converged in ${stepCount} step${stepCount === 1 ? '' : 's'} — centroids moved < 0.001`}
        </div>
      )}
    </div>
  );
})
