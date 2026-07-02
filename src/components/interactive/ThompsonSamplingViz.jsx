import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// ── Seeded RNG ──────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Math helpers ─────────────────────────────────────────────────────────────
function lgamma(x) {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x--;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betaPDF(x, a, b) {
  if (x <= 0 || x >= 1) return 0;
  const logBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta);
}

function sampleGamma(k, rng) {
  if (k < 1) return sampleGamma(1 + k, rng) * Math.pow(rng(), 1 / k);
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x, v;
    do {
      const u1 = Math.max(1e-10, rng());
      const u2 = rng();
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = Math.pow(1 + c * x, 3);
    } while (v <= 0);
    const u = rng();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function sampleBeta(a, b, rng) {
  if (a > 1 && b > 1) {
    const mu = a / (a + b);
    const v = (a * b) / (Math.pow(a + b, 2) * (a + b + 1));
    const sigma = Math.sqrt(v);
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0.001, Math.min(0.999, mu + sigma * z));
  }
  const ga = sampleGamma(a, rng);
  const gb = sampleGamma(b, rng);
  return ga / (ga + gb);
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TRUE_PROBS = [0.2, 0.5, 0.35, 0.7, 0.45];
const N_ARMS = 5;
const MAX_REWARD = Math.max(...TRUE_PROBS); // 0.7
const SEED = 0xDEADBEEF;

const ARM_COLORS = ['#4a9ebb', '#e85d4a', '#7c5cbf', null, '#4eb87c']; // arm3 uses --prime
function getArmColor(i, primeColor) {
  return i === 3 ? (primeColor || '#F0A500') : ARM_COLORS[i];
}

const ALGO_COLORS = {
  thompson: '#5b8fd4',
  epsilon: '#e8924a',
  ucb: '#a06cd5',
};

function initThompson() {
  return {
    alphas: new Array(N_ARMS).fill(1),
    betas: new Array(N_ARMS).fill(1),
    cumulativeRegret: [0],
  };
}

function initEpsilonGreedy() {
  return {
    counts: new Array(N_ARMS).fill(0),
    means: new Array(N_ARMS).fill(0),
    cumulativeRegret: [0],
  };
}

function initUCB() {
  return {
    counts: new Array(N_ARMS).fill(0),
    means: new Array(N_ARMS).fill(0),
    cumulativeRegret: [0],
    totalPulls: 0,
  };
}

// ── Draw: Beta posterior curves ───────────────────────────────────────────────
function drawBetaCanvas(canvas, alphas, betas, primeColor) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const PL = 44, PR = 16, PT = 18, PB = 36;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const cs = getComputedStyle(canvas);
  const rimColor = cs.getPropertyValue('--rim').trim() || '#333';
  const inkLow = cs.getPropertyValue('--ink-low').trim() || '#666';
  const inkMid = cs.getPropertyValue('--ink-mid').trim() || '#aaa';
  const depth = cs.getPropertyValue('--depth').trim() || '#111';
  const prime = primeColor || cs.getPropertyValue('--prime').trim() || '#F0A500';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Compute max density across all arms for y-axis
  let yMax = 0;
  const N_SAMPLES = 200;
  const curves = alphas.map((a, i) => {
    const pts = [];
    for (let j = 0; j <= N_SAMPLES; j++) {
      const x = j / N_SAMPLES;
      const y = betaPDF(x, a, betas[i]);
      pts.push({ x, y });
      if (isFinite(y)) yMax = Math.max(yMax, y);
    }
    return pts;
  });
  yMax = Math.max(yMax * 1.1, 1);

  const toX = (x) => PL + x * cW;
  const toY = (y) => PT + cH - (y / yMax) * cH;

  // Grid
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 0.5;
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const yVal = (yMax / yTicks) * i;
    const cy = toY(yVal);
    ctx.beginPath();
    ctx.moveTo(PL, cy);
    ctx.lineTo(PL + cW, cy);
    ctx.stroke();
    if (i > 0) {
      ctx.fillStyle = inkLow;
      ctx.font = `9px var(--font-mono, monospace)`;
      ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(1), PL - 4, cy + 3);
    }
  }
  // X-axis ticks
  for (let t = 0; t <= 4; t++) {
    const xVal = t * 0.25;
    const cx = toX(xVal);
    ctx.beginPath();
    ctx.moveTo(cx, PT + cH);
    ctx.lineTo(cx, PT + cH + 4);
    ctx.strokeStyle = rimColor;
    ctx.stroke();
    ctx.fillStyle = inkLow;
    ctx.font = `9px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    ctx.fillText(xVal.toFixed(2), cx, PT + cH + 13);
  }

  // Axes
  ctx.strokeStyle = inkMid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PL, PT);
  ctx.lineTo(PL, PT + cH);
  ctx.lineTo(PL + cW, PT + cH);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = inkMid;
  ctx.font = `10px var(--font-sans, sans-serif)`;
  ctx.textAlign = 'center';
  ctx.fillText('p (reward probability)', PL + cW / 2, H - 2);
  ctx.save();
  ctx.translate(10, PT + cH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('density', 0, 0);
  ctx.restore();

  // Draw each arm curve
  curves.forEach((pts, i) => {
    const color = getArmColor(i, prime);
    ctx.strokeStyle = color;
    ctx.lineWidth = i === 3 ? 2.5 : 1.8;
    ctx.beginPath();
    let first = true;
    pts.forEach(({ x, y }) => {
      if (!isFinite(y)) { first = true; return; }
      const cx = toX(x);
      const cy = toY(y);
      if (first) { ctx.moveTo(cx, cy); first = false; }
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
  });

  // Compact legend top-right (arm chips only — α/β shown below the chart)
  const legendX = PL + cW - 4;
  const legendY = PT + 6;
  alphas.forEach((a, i) => {
    const color = getArmColor(i, prime);
    const ly = legendY + i * 13;
    ctx.fillStyle = color;
    ctx.fillRect(legendX - 26, ly, 8, 8);
    ctx.font = `9px var(--font-mono, monospace)`;
    ctx.textAlign = 'left';
    ctx.fillText(`A${i}`, legendX - 15, ly + 7);
  });
}

// ── Draw: Cumulative regret chart ─────────────────────────────────────────────
function drawRegretCanvas(canvas, thompsonRegret, epsilonRegret, ucbRegret) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const PL = 50, PR = 16, PT = 18, PB = 36;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const cs = getComputedStyle(canvas);
  const rimColor = cs.getPropertyValue('--rim').trim() || '#333';
  const inkLow = cs.getPropertyValue('--ink-low').trim() || '#666';
  const inkMid = cs.getPropertyValue('--ink-mid').trim() || '#aaa';
  const depth = cs.getPropertyValue('--depth').trim() || '#111';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const n = Math.max(thompsonRegret.length, epsilonRegret.length, ucbRegret.length, 2);
  const allVals = [...thompsonRegret, ...epsilonRegret, ...ucbRegret];
  const yMax = Math.max(...allVals, 1) * 1.15;

  const toX = (i) => PL + (i / (n - 1)) * cW;
  const toY = (y) => PT + cH - (y / yMax) * cH;

  // Grid
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 0.5;
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const yVal = (yMax / yTicks) * i;
    const cy = toY(yVal);
    ctx.beginPath();
    ctx.moveTo(PL, cy);
    ctx.lineTo(PL + cW, cy);
    ctx.stroke();
    ctx.fillStyle = inkLow;
    ctx.font = `9px var(--font-mono, monospace)`;
    ctx.textAlign = 'right';
    ctx.fillText(yVal.toFixed(1), PL - 4, cy + 3);
  }
  // X-axis ticks
  const xTickCount = Math.min(6, n - 1);
  for (let i = 0; i <= xTickCount; i++) {
    const idx = Math.round((i / xTickCount) * (n - 1));
    const cx = toX(idx);
    ctx.beginPath();
    ctx.moveTo(cx, PT + cH);
    ctx.lineTo(cx, PT + cH + 4);
    ctx.strokeStyle = rimColor;
    ctx.stroke();
    ctx.fillStyle = inkLow;
    ctx.font = `9px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    ctx.fillText(idx.toString(), cx, PT + cH + 13);
  }

  // Axes
  ctx.strokeStyle = inkMid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PL, PT);
  ctx.lineTo(PL, PT + cH);
  ctx.lineTo(PL + cW, PT + cH);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = inkMid;
  ctx.font = `10px var(--font-sans, sans-serif)`;
  ctx.textAlign = 'center';
  ctx.fillText('trial', PL + cW / 2, H - 2);
  ctx.save();
  ctx.translate(10, PT + cH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('cumulative regret', 0, 0);
  ctx.restore();

  // Draw lines
  const drawLine = (data, color) => {
    if (data.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((val, i) => {
      const cx = toX(i);
      const cy = toY(val);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
  };

  drawLine(ucbRegret, ALGO_COLORS.ucb);
  drawLine(epsilonRegret, ALGO_COLORS.epsilon);
  drawLine(thompsonRegret, ALGO_COLORS.thompson);

  // Legend
  const legend = [
    { label: 'Thompson', color: ALGO_COLORS.thompson },
    { label: 'ε-Greedy', color: ALGO_COLORS.epsilon },
    { label: 'UCB1', color: ALGO_COLORS.ucb },
  ];
  legend.forEach(({ label, color }, i) => {
    const lx = PL + 8 + i * 82;
    const ly = PT + 4;
    ctx.fillStyle = color;
    ctx.fillRect(lx, ly, 14, 3);
    ctx.fillStyle = inkMid;
    ctx.font = `9px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + 18, ly + 4);
  });
}

// ── Main component ─────────────────────────────────────────────────────────────
export const ThompsonSamplingViz = forwardRef(function ThompsonSamplingViz(props, ref) {
  const [trialCount, setTrialCount] = useState(0);

  const betaCanvasRef = useRef(null);
  const regretCanvasRef = useRef(null);

  // Algorithm state stored in refs to avoid stale closures during batch steps
  const thompsonRef = useRef(initThompson());
  const egRef = useRef(initEpsilonGreedy());
  const ucbRef = useRef(initUCB());
  const rngRef = useRef(mulberry32(SEED));
  const trialsRef = useRef(0);
  const animRef = useRef(null);

  // Prime color ref (read once on mount, used in draw functions)
  const primeColorRef = useRef('#F0A500');
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const p = cs.getPropertyValue('--prime').trim();
    if (p) primeColorRef.current = p;
  }, []);

  // Canvas resize observer for beta canvas
  useEffect(() => {
    const canvas = betaCanvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      drawBetaCanvas(canvas, thompsonRef.current.alphas, thompsonRef.current.betas, primeColorRef.current);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Canvas resize observer for regret canvas
  useEffect(() => {
    const canvas = regretCanvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      drawRegretCanvas(
        canvas,
        thompsonRef.current.cumulativeRegret,
        egRef.current.cumulativeRegret,
        ucbRef.current.cumulativeRegret,
      );
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Redraw canvases when trialCount changes
  useEffect(() => {
    drawBetaCanvas(betaCanvasRef.current, thompsonRef.current.alphas, thompsonRef.current.betas, primeColorRef.current);
    drawRegretCanvas(
      regretCanvasRef.current,
      thompsonRef.current.cumulativeRegret,
      egRef.current.cumulativeRegret,
      ucbRef.current.cumulativeRegret,
    );
  }, [trialCount]);

  // Run N trials for all three algorithms using the same RNG for reward draws
  const runTrials = useCallback((n) => {
    const ts = thompsonRef.current;
    const eg = egRef.current;
    const ucb = ucbRef.current;
    const rng = rngRef.current;

    for (let i = 0; i < n; i++) {
      const t = trialsRef.current;

      // ── Thompson Sampling ──────────────────────────────────────────
      let tsBest = 0;
      let tsBestTheta = -1;
      for (let arm = 0; arm < N_ARMS; arm++) {
        const theta = sampleBeta(ts.alphas[arm], ts.betas[arm], rng);
        if (theta > tsBestTheta) { tsBestTheta = theta; tsBest = arm; }
      }
      const tsReward = rng() < TRUE_PROBS[tsBest] ? 1 : 0;
      ts.alphas[tsBest] += tsReward;
      ts.betas[tsBest] += 1 - tsReward;
      const tsRegret = (ts.cumulativeRegret[ts.cumulativeRegret.length - 1] || 0)
        + (MAX_REWARD - TRUE_PROBS[tsBest]);
      ts.cumulativeRegret.push(tsRegret);

      // ── Epsilon-Greedy (ε=0.1) ─────────────────────────────────────
      let egArm;
      if (rng() < 0.1) {
        egArm = Math.floor(rng() * N_ARMS);
      } else {
        egArm = eg.means.indexOf(Math.max(...eg.means));
        // Break ties randomly among equals
        const maxMean = eg.means[egArm];
        const ties = eg.means.reduce((acc, m, idx) => { if (m === maxMean) acc.push(idx); return acc; }, []);
        if (ties.length > 1) egArm = ties[Math.floor(rng() * ties.length)];
      }
      const egReward = rng() < TRUE_PROBS[egArm] ? 1 : 0;
      eg.counts[egArm]++;
      eg.means[egArm] += (egReward - eg.means[egArm]) / eg.counts[egArm];
      const egRegret = (eg.cumulativeRegret[eg.cumulativeRegret.length - 1] || 0)
        + (MAX_REWARD - TRUE_PROBS[egArm]);
      eg.cumulativeRegret.push(egRegret);

      // ── UCB1 ───────────────────────────────────────────────────────
      let ucbArm;
      const unvisited = ucb.counts.findIndex((c) => c === 0);
      if (unvisited !== -1) {
        ucbArm = unvisited;
      } else {
        const lnt = Math.log(t + 1);
        let bestUCB = -Infinity;
        ucbArm = 0;
        for (let arm = 0; arm < N_ARMS; arm++) {
          const score = ucb.means[arm] + Math.sqrt((2 * lnt) / ucb.counts[arm]);
          if (score > bestUCB) { bestUCB = score; ucbArm = arm; }
        }
      }
      const ucbReward = rng() < TRUE_PROBS[ucbArm] ? 1 : 0;
      ucb.counts[ucbArm]++;
      ucb.means[ucbArm] += (ucbReward - ucb.means[ucbArm]) / ucb.counts[ucbArm];
      ucb.totalPulls++;
      const ucbRegret = (ucb.cumulativeRegret[ucb.cumulativeRegret.length - 1] || 0)
        + (MAX_REWARD - TRUE_PROBS[ucbArm]);
      ucb.cumulativeRegret.push(ucbRegret);

      trialsRef.current++;
    }

    setTrialCount(trialsRef.current);
  }, []);

  const handleReset = useCallback(() => {
    thompsonRef.current = initThompson();
    egRef.current = initEpsilonGreedy();
    ucbRef.current = initUCB();
    rngRef.current = mulberry32(SEED);
    trialsRef.current = 0;
    setTrialCount(0);
  }, []);

  const play = useCallback(() => {
    if (animRef.current) return
    animRef.current = setInterval(() => {
      runTrials(5)
    }, 100)
  }, [runTrials])

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
  }, [])

  const reset = useCallback(() => {
    pause()
    handleReset()
  }, [pause, handleReset])

  const step = useCallback(() => {
    pause()
    runTrials(1)
  }, [pause, runTrials])

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step])

  useEffect(() => {
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [])

  const ts = thompsonRef.current;
  const eg = egRef.current;
  const ucb = ucbRef.current;

  const tsRegret = ts.cumulativeRegret[ts.cumulativeRegret.length - 1] || 0;
  const egRegret = eg.cumulativeRegret[eg.cumulativeRegret.length - 1] || 0;
  const ucbRegret = ucb.cumulativeRegret[ucb.cumulativeRegret.length - 1] || 0;

  const minRegret = Math.min(tsRegret, egRegret, ucbRegret);
  const winnerLabel = tsRegret === minRegret && trialCount > 0
    ? 'Thompson winning'
    : egRegret === minRegret && trialCount > 0
    ? 'ε-Greedy winning'
    : ucbRegret === minRegret && trialCount > 0
    ? 'UCB1 winning'
    : '';

  // Infer best arm learned by Thompson (arm with highest alpha/(alpha+beta))
  const tsMeans = ts.alphas.map((a, i) => a / (a + ts.betas[i]));
  const tsLearnedBest = tsMeans.indexOf(Math.max(...tsMeans));

  const s = {
    root: {
      fontFamily: 'var(--font-sans, sans-serif)',
      background: 'var(--surface, #1a1a1a)',
      border: '1px solid var(--rim, #333)',
      borderRadius: 10,
      padding: '18px 20px',
      maxWidth: 760,
      color: 'var(--ink-hi, #eee)',
    },
    title: {
      margin: '0 0 2px 0',
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--ink-hi, #eee)',
    },
    subtitle: {
      margin: '0 0 14px 0',
      fontSize: 12,
      color: 'var(--ink-low, #888)',
      fontFamily: 'var(--font-mono, monospace)',
    },
    canvasBlock: {
      display: 'block',
      width: '100%',
      borderRadius: 6,
      border: '1px solid var(--rim, #333)',
    },
    label: {
      fontSize: 11,
      color: 'var(--ink-low, #666)',
      fontFamily: 'var(--font-mono, monospace)',
      marginBottom: 4,
      marginTop: 12,
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      flexWrap: 'wrap',
    },
    btn: {
      padding: '6px 13px',
      borderRadius: 6,
      border: '1px solid var(--rim-hi, #555)',
      background: 'var(--depth, #111)',
      color: 'var(--ink-hi, #eee)',
      cursor: 'pointer',
      fontSize: 13,
      fontFamily: 'var(--font-sans, sans-serif)',
    },
    btnPrime: {
      padding: '6px 13px',
      borderRadius: 6,
      border: '1px solid var(--prime, #F0A500)',
      background: 'var(--prime, #F0A500)',
      color: '#000',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'var(--font-sans, sans-serif)',
    },
    trialInfo: {
      fontSize: 12,
      color: 'var(--ink-mid, #aaa)',
      fontFamily: 'var(--font-mono, monospace)',
      marginLeft: 4,
    },
    statsRow: {
      display: 'flex',
      gap: 16,
      marginTop: 12,
      fontSize: 12,
      color: 'var(--ink-mid, #aaa)',
      fontFamily: 'var(--font-mono, monospace)',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    stat: (color) => ({
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      borderLeft: `3px solid ${color}`,
      paddingLeft: 8,
    }),
    statLabel: {
      fontSize: 10,
      color: 'var(--ink-low, #888)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    statVal: {
      fontSize: 14,
      color: 'var(--ink-hi, #eee)',
    },
    winner: {
      fontSize: 11,
      color: '#4ade80',
      marginLeft: 'auto',
      fontStyle: 'italic',
    },
    armInfo: {
      display: 'flex',
      gap: 10,
      marginTop: 10,
      flexWrap: 'wrap',
      fontSize: 11,
      fontFamily: 'var(--font-mono, monospace)',
    },
  };

  return (
    <div style={s.root}>
      <p style={s.title}>Multi-Armed Bandit: Thompson Sampling vs ε-Greedy vs UCB1</p>
      <p style={s.subtitle}>
        5 arms · true p = [0.20, 0.50, 0.35, <span style={{ color: 'var(--prime, #F0A500)' }}>0.70</span>, 0.45] · best = arm 3 · Bernoulli rewards
      </p>

      {/* Beta posteriors canvas */}
      <canvas
        ref={betaCanvasRef}
        style={{ ...s.canvasBlock, height: '240px' }}
      />

      <p style={s.label}>thompson sampling beta posteriors — each arm&apos;s belief about its true reward probability</p>

      {/* Regret canvas */}
      <canvas
        ref={regretCanvasRef}
        style={{ ...s.canvasBlock, height: '180px', marginTop: 12 }}
      />

      {/* Controls */}
      <div style={s.controls}>
        <button style={s.btnPrime} onClick={() => runTrials(1)}>Step ×1</button>
        <button style={s.btn} onClick={() => runTrials(10)}>Step ×10</button>
        <button style={s.btn} onClick={() => runTrials(100)}>Step ×100</button>
        <button style={s.btn} onClick={handleReset}>Reset</button>
        <span style={s.trialInfo}>
          Trial {trialCount} / Best arm: arm 3 (p=0.70)
          {trialCount > 0 && tsLearnedBest === 3 && (
            <span style={{ color: '#4ade80' }}> · Thompson identified arm 3</span>
          )}
        </span>
      </div>

      {/* Regret stats */}
      <div style={s.statsRow}>
        <div style={s.stat(ALGO_COLORS.thompson)}>
          <span style={s.statLabel}>Thompson regret</span>
          <span style={s.statVal}>{tsRegret.toFixed(2)}</span>
        </div>
        <div style={s.stat(ALGO_COLORS.epsilon)}>
          <span style={s.statLabel}>ε-Greedy regret</span>
          <span style={s.statVal}>{egRegret.toFixed(2)}</span>
        </div>
        <div style={s.stat(ALGO_COLORS.ucb)}>
          <span style={s.statLabel}>UCB1 regret</span>
          <span style={s.statVal}>{ucbRegret.toFixed(2)}</span>
        </div>
        {winnerLabel && <span style={s.winner}>{winnerLabel}</span>}
      </div>

      {/* Per-arm Thompson posterior means */}
      {trialCount > 0 && (
        <div style={s.armInfo}>
          {ts.alphas.map((a, i) => {
            const mean = (a / (a + ts.betas[i])).toFixed(3);
            const isLearnedBest = i === tsLearnedBest;
            return (
              <span
                key={i}
                style={{
                  color: isLearnedBest ? 'var(--prime, #F0A500)' : 'var(--ink-low, #888)',
                  fontWeight: isLearnedBest ? 700 : 400,
                }}
              >
                A{i}: μ̂={mean}
              </span>
            );
          })}
          <span style={{ color: 'var(--ink-low, #666)', marginLeft: 4 }}>
            (Thompson posterior means)
          </span>
        </div>
      )}
    </div>
  );
})
