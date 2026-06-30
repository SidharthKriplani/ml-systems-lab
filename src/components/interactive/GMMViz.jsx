import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// Seeded LCG random — deterministic floats in [0,1)
function makeLCG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

// Generate 45 points in 3 natural clusters, always identical
function generatePoints() {
  const rng = makeLCG(0xABCD1234);
  const clusters = [
    { cx: 0.2, cy: 0.7, spread: 0.08, n: 15 },
    { cx: 0.7, cy: 0.65, spread: 0.09, n: 15 },
    { cx: 0.5, cy: 0.25, spread: 0.10, n: 15 },
  ];
  const pts = [];
  clusters.forEach((cl, ci) => {
    for (let i = 0; i < cl.n; i++) {
      const u1 = Math.max(1e-10, rng());
      const u2 = rng();
      const u3 = Math.max(1e-10, rng());
      const u4 = rng();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const z1 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);
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

const GAUSS_COLORS = ['#F0A500', '#4a90d9', '#2abf8f'];

// Hardcoded EM steps: step 0 = initial, steps 1-6 = converging
const EM_STEPS = [
  { means: [[0.3, 0.5], [0.5, 0.5], [0.7, 0.5]], covScales: [0.12, 0.12, 0.12] },
  { means: [[0.22, 0.62], [0.55, 0.45], [0.62, 0.60]], covScales: [0.11, 0.10, 0.11] },
  { means: [[0.20, 0.67], [0.51, 0.30], [0.67, 0.62]], covScales: [0.09, 0.10, 0.10] },
  { means: [[0.20, 0.69], [0.50, 0.26], [0.69, 0.64]], covScales: [0.08, 0.09, 0.09] },
  { means: [[0.20, 0.70], [0.50, 0.25], [0.70, 0.65]], covScales: [0.08, 0.09, 0.09] },
  { means: [[0.20, 0.70], [0.50, 0.25], [0.70, 0.65]], covScales: [0.08, 0.09, 0.09] },
  { means: [[0.20, 0.70], [0.50, 0.25], [0.70, 0.65]], covScales: [0.08, 0.09, 0.09] },
];

// Compute soft responsibilities for each point given the current step
function computeResponsibilities(points, stepIdx) {
  const { means, covScales } = EM_STEPS[stepIdx];
  return points.map((p) => {
    const raw = means.map((m, k) => {
      const dx = p.x - m[0];
      const dy = p.y - m[1];
      const dist2 = dx * dx + dy * dy;
      return Math.exp(-dist2 / (2 * covScales[k] * covScales[k]));
    });
    const sum = raw.reduce((a, b) => a + b, 0) || 1e-10;
    return raw.map((r) => r / sum);
  });
}

// Blend Gaussian colors by responsibility weights
function blendColors(colors, weights) {
  const hexToRgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const rgbs = colors.map(hexToRgb);
  const r = Math.round(rgbs.reduce((s, c, i) => s + c[0] * weights[i], 0));
  const g = Math.round(rgbs.reduce((s, c, i) => s + c[1] * weights[i], 0));
  const b = Math.round(rgbs.reduce((s, c, i) => s + c[2] * weights[i], 0));
  return `rgb(${r},${g},${b})`;
}

function drawCanvas(canvas, points, stepIdx, mode) {
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

  const PAD = 28;
  const plotW = W - 2 * PAD;
  const plotH = H - 2 * PAD;

  const toCanvas = (px, py) => ({
    cx: PAD + px * plotW,
    cy: PAD + (1 - py) * plotH,
  });

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Light grid (4x4)
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.5;
  for (let g = 0; g <= 4; g++) {
    const frac = g / 4;
    const x = PAD + frac * plotW;
    const y = PAD + frac * plotH;
    ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + plotW, y); ctx.stroke();
  }

  const { means, covScales } = EM_STEPS[stepIdx];

  // Draw Gaussian ellipses (dashed circles at each mean)
  means.forEach((m, k) => {
    const { cx, cy } = toCanvas(m[0], m[1]);
    const rx = covScales[k] * plotW;
    const ry = covScales[k] * plotH;
    ctx.save();
    ctx.strokeStyle = GAUSS_COLORS[k];
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    // 2-sigma ellipse
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 2, ry * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // Draw arrows from current mean to next mean (if step < 6)
  const showArrows = stepIdx < 6 && (mode === 'mstep' || mode === 'estep');
  const arrowAlpha = mode === 'mstep' ? 0.9 : 0.45;
  if (showArrows) {
    const nextStep = EM_STEPS[stepIdx + 1];
    means.forEach((m, k) => {
      const { cx: x1, cy: y1 } = toCanvas(m[0], m[1]);
      const { cx: x2, cy: y2 } = toCanvas(nextStep.means[k][0], nextStep.means[k][1]);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;

      ctx.save();
      ctx.strokeStyle = GAUSS_COLORS[k];
      ctx.lineWidth = mode === 'mstep' ? 2 : 1.5;
      ctx.globalAlpha = arrowAlpha;
      ctx.setLineDash([3, 3]);

      // Line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Arrowhead
      ctx.setLineDash([]);
      const angle = Math.atan2(dy, dx);
      const arrowLen = 7;
      const arrowAngle = Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - arrowLen * Math.cos(angle - arrowAngle),
        y2 - arrowLen * Math.sin(angle - arrowAngle)
      );
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - arrowLen * Math.cos(angle + arrowAngle),
        y2 - arrowLen * Math.sin(angle + arrowAngle)
      );
      ctx.stroke();
      ctx.restore();
    });
  }

  // Compute responsibilities and draw points
  const resps = computeResponsibilities(points, stepIdx);
  points.forEach((p, i) => {
    const { cx, cy } = toCanvas(p.x, p.y);
    const color = blendColors(GAUSS_COLORS, resps[i]);
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Draw '+' marks at each mean (on top of everything)
  means.forEach((m, k) => {
    const { cx, cy } = toCanvas(m[0], m[1]);
    const SIZE = 7;
    ctx.save();
    ctx.translate(cx, cy);

    // White backing
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-SIZE, 0); ctx.lineTo(SIZE, 0);
    ctx.moveTo(0, -SIZE); ctx.lineTo(0, SIZE);
    ctx.stroke();

    // Colored cross
    ctx.strokeStyle = GAUSS_COLORS[k];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-SIZE, 0); ctx.lineTo(SIZE, 0);
    ctx.moveTo(0, -SIZE); ctx.lineTo(0, SIZE);
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = GAUSS_COLORS[k];
    ctx.fill();

    ctx.restore();

    // Label
    ctx.fillStyle = GAUSS_COLORS[k];
    ctx.font = `bold 10px var(--font-mono, monospace)`;
    ctx.fillText(`G${k + 1}`, cx + 10, cy - 8);
  });
}

const styles = {
  root: { fontFamily: `var(--font-sans, sans-serif)`, color: `var(--ink-hi, #eee)`, maxWidth: 700 },
  title: { margin: '0 0 4px 0', fontSize: 17, fontWeight: 700, color: `var(--ink-hi, #eee)` },
  subtitle: { margin: '0 0 14px 0', fontSize: 13, color: `var(--ink-low, #888)`, fontFamily: `var(--font-mono, monospace)` },
  canvas: { display: 'block', width: '100%', borderRadius: 6, border: `1px solid var(--rim, #333)` },
  controls: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  btn: { padding: '6px 14px', borderRadius: 6, border: `1px solid var(--rim, #555)`, background: `var(--depth, #111)`, color: `var(--ink-hi, #eee)`, cursor: 'pointer', fontSize: 13, fontFamily: `var(--font-sans, sans-serif)` },
  btnPrime: { padding: '6px 14px', borderRadius: 6, border: `1px solid var(--prime, #F0A500)`, background: `var(--prime, #F0A500)`, color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: `var(--font-sans, sans-serif)` },
  btnActive: { padding: '6px 14px', borderRadius: 6, border: `1px solid var(--prime, #F0A500)`, background: 'transparent', color: `var(--prime, #F0A500)`, cursor: 'pointer', fontSize: 13, fontFamily: `var(--font-sans, sans-serif)` },
  mono: { fontFamily: `var(--font-mono, monospace)`, color: `var(--prime, #F0A500)`, fontSize: 13 },
  note: { marginTop: 12, padding: '10px 14px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 6, fontSize: 12, color: `var(--ink-mid, #aaa)`, lineHeight: 1.6 },
  sliderLabel: { fontSize: 13, color: `var(--ink-mid, #aaa)`, display: 'flex', alignItems: 'center', gap: 8 },
  slider: { accentColor: `var(--prime, #F0A500)`, width: 130 },
  modeRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
};

export const GMMViz = forwardRef(function GMMViz(props, ref) {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState('estep'); // 'estep' | 'mstep'

  const redraw = useCallback(() => {
    if (canvasRef.current) {
      drawCanvas(canvasRef.current, POINTS, step, mode);
    }
  }, [step, mode]);

  useEffect(() => { redraw(); }, [redraw]);

  useEffect(() => {
    const obs = new ResizeObserver(() => redraw());
    if (canvasRef.current) obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, [redraw]);

  // Auto-advance when running
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= 6) {
          setRunning(false);
          clearInterval(intervalRef.current);
          return s;
        }
        return s + 1;
      });
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const handleStep = useCallback(() => {
    setStep((s) => Math.min(6, s + 1));
  }, []);

  const handleReset = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setStep(0);
  }, []);

  const handleRun = useCallback(() => {
    if (step >= 6) return;
    setRunning((r) => !r);
  }, [step]);

  const play = useCallback(() => { if (step < 6) setRunning(true); }, [step]);
  const pause = useCallback(() => { setRunning(false); }, []);

  useImperativeHandle(ref, () => ({
    play,
    pause,
    reset: handleReset,
    step: handleStep,
  }), [play, pause, handleReset, handleStep]);

  return (
    <div style={styles.root}>
      <p style={styles.title}>Gaussian Mixture Model — EM Algorithm</p>
      <p style={styles.subtitle}>{`45 points · 3 Gaussians · soft assignments via E-step / M-step`}</p>

      <canvas
        ref={canvasRef}
        style={{ ...styles.canvas, height: '290px' }}
      />

      {/* Step slider */}
      <div style={styles.controls}>
        <label style={styles.sliderLabel}>
          <span style={{ color: `var(--ink-mid, #aaa)` }}>EM Step</span>
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={step}
            onChange={(e) => {
              clearInterval(intervalRef.current);
              setRunning(false);
              setStep(parseInt(e.target.value, 10));
            }}
            style={styles.slider}
          />
          <span style={styles.mono}>{`${step}/6`}</span>
        </label>

        <button
          style={step >= 6 ? { ...styles.btn, opacity: 0.4 } : styles.btn}
          onClick={handleStep}
          disabled={step >= 6}
        >
          {`Step ▶`}
        </button>

        <button
          style={step >= 6 ? { ...styles.btnPrime, opacity: 0.5 } : styles.btnPrime}
          onClick={handleRun}
          disabled={step >= 6}
        >
          {running ? 'Pause' : 'Run'}
        </button>

        <button style={styles.btn} onClick={handleReset}>
          Reset
        </button>
      </div>

      {/* Mode toggle */}
      <div style={styles.modeRow}>
        <span style={{ fontSize: 12, color: `var(--ink-low, #888)` }}>View:</span>
        <button
          style={mode === 'estep' ? styles.btnActive : styles.btn}
          onClick={() => setMode('estep')}
        >
          E-step view
        </button>
        <button
          style={mode === 'mstep' ? styles.btnActive : styles.btn}
          onClick={() => setMode('mstep')}
        >
          M-step view
        </button>
      </div>

      <div style={styles.note}>
        {`EM alternates: E-step computes soft cluster assignments for each point, M-step moves the Gaussian parameters to best explain those assignments. Unlike k-means, GMM gives probabilistic (soft) assignments.`}
      </div>
    </div>
  );
})
