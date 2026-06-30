import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const TRUE_P = [0.2, 0.6, 0.9, 0.4];
const N_ARMS = 4;
const ALPHA = 0.1;
const EMA_BETA = 0.9;
const SEED = 42;

// ──────────────────────────────────────────────
// Seeded RNG — mulberry32
// ──────────────────────────────────────────────
function makeMulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ──────────────────────────────────────────────
// Policy helpers
// ──────────────────────────────────────────────
function softmax(logits) {
  const maxL = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxL));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function sampleAction(probs, rng) {
  const u = rng();
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (u < cum) return i;
  }
  return probs.length - 1;
}

// ──────────────────────────────────────────────
// One episode
// ──────────────────────────────────────────────
function runEpisode(logits, baselineRef, rng) {
  const probs = softmax(logits);
  const a = sampleAction(probs, rng);
  const R = rng() < TRUE_P[a] ? 1 : 0;
  const advantage = R - baselineRef.current;

  // Update baseline
  baselineRef.current = EMA_BETA * baselineRef.current + (1 - EMA_BETA) * R;

  // REINFORCE update: θ_j += α * advantage * (1[j==a] - π(j))
  for (let j = 0; j < N_ARMS; j++) {
    logits[j] += ALPHA * advantage * ((j === a ? 1 : 0) - probs[j]);
  }

  return R;
}

// ──────────────────────────────────────────────
// Drawing
// ──────────────────────────────────────────────
function draw(canvas, logits, rewardHistory, episodeCount) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (W === 0 || H === 0) return;

  const style = getComputedStyle(document.documentElement);
  const prime = style.getPropertyValue('--prime').trim() || '#F59E0B';
  const depth = style.getPropertyValue('--depth').trim() || '#0d1117';
  const rim = style.getPropertyValue('--rim').trim() || '#30363d';
  const inkLow = style.getPropertyValue('--ink-low').trim() || '#484f58';
  const inkMid = style.getPropertyValue('--ink-mid').trim() || '#8b949e';
  const inkHi = style.getPropertyValue('--ink-hi').trim() || '#e6edf3';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const probs = softmax(logits);
  const bestArm = probs.indexOf(Math.max(...probs));

  // Panel split: left 60%, right 40%
  const leftW = Math.floor(W * 0.6);
  const rightW = W - leftW;

  // ── LEFT PANEL: Policy bars ──────────────────
  {
    const PAD_L = 24;
    const PAD_R = 16;
    const PAD_T = 40;
    const PAD_B = 40;
    const panelW = leftW;
    const chartW = panelW - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    // Title
    ctx.fillStyle = inkMid;
    ctx.font = `600 12px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Policy probabilities', PAD_L, 12);

    const barSlotW = chartW / N_ARMS;
    const barPad = barSlotW * 0.18;
    const barW = barSlotW - barPad * 2;

    for (let i = 0; i < N_ARMS; i++) {
      const p = probs[i];
      const barH = p * chartH;
      const x = PAD_L + i * barSlotW + barPad;
      const y = PAD_T + chartH - barH;

      // Bar fill
      ctx.fillStyle = i === bestArm ? prime : inkLow;
      ctx.globalAlpha = i === bestArm ? 0.9 : 0.55;
      ctx.fillRect(x, y, barW, barH);
      ctx.globalAlpha = 1.0;

      // True reward marker — horizontal line at TRUE_P[i]
      const markerY = PAD_T + chartH - TRUE_P[i] * chartH;
      ctx.beginPath();
      ctx.moveTo(x - 2, markerY);
      ctx.lineTo(x + barW + 2, markerY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arm label below
      ctx.fillStyle = inkMid;
      ctx.font = `11px var(--font-mono, monospace)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`A${i}`, x + barW / 2, PAD_T + chartH + 6);

      // Probability above bar
      ctx.fillStyle = i === bestArm ? prime : inkMid;
      ctx.font = `bold 11px var(--font-mono, monospace)`;
      ctx.textBaseline = 'bottom';
      const pctStr = `${(p * 100).toFixed(1)}%`;
      ctx.fillText(pctStr, x + barW / 2, y - 3);
    }

    // Y-axis ticks (0, 0.5, 1.0)
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 3]);
    for (const tick of [0, 0.5, 1.0]) {
      const ty = PAD_T + chartH - tick * chartH;
      ctx.beginPath();
      ctx.moveTo(PAD_L - 4, ty);
      ctx.lineTo(PAD_L + chartW, ty);
      ctx.stroke();
      ctx.fillStyle = inkLow;
      ctx.font = `10px var(--font-mono, monospace)`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(tick.toFixed(1), PAD_L - 6, ty);
    }
    ctx.setLineDash([]);

    // Legend: red dashed = true reward
    const legX = PAD_L;
    const legY = PAD_T + chartH + 24;
    ctx.beginPath();
    ctx.moveTo(legX, legY + 5);
    ctx.lineTo(legX + 18, legY + 5);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = inkLow;
    ctx.font = `10px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('true p', legX + 22, legY + 5);
  }

  // Panel divider
  ctx.beginPath();
  ctx.moveTo(leftW, 0);
  ctx.lineTo(leftW, H);
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── RIGHT PANEL: Cumulative avg reward chart ──
  {
    const PAD_L = 20;
    const PAD_R = 16;
    const PAD_T = 40;
    const PAD_B = 40;
    const offsetX = leftW;
    const panelW = rightW;
    const chartW = panelW - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    // Title
    ctx.fillStyle = inkMid;
    ctx.font = `600 12px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Avg reward (50-ep window)', offsetX + PAD_L, 12);

    // Chart background
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(offsetX + PAD_L, PAD_T, chartW, chartH);

    // Y-axis ticks (0, 0.5, 1.0)
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 3]);
    for (const tick of [0, 0.5, 1.0]) {
      const ty = PAD_T + chartH - tick * chartH;
      ctx.beginPath();
      ctx.moveTo(offsetX + PAD_L, ty);
      ctx.lineTo(offsetX + PAD_L + chartW, ty);
      ctx.stroke();
      ctx.fillStyle = inkLow;
      ctx.font = `10px var(--font-mono, monospace)`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(tick.toFixed(1), offsetX + PAD_L - 4, ty);
    }
    ctx.setLineDash([]);

    // Dashed line at max possible reward (0.9)
    const maxRewardY = PAD_T + chartH - 0.9 * chartH;
    ctx.beginPath();
    ctx.moveTo(offsetX + PAD_L, maxRewardY);
    ctx.lineTo(offsetX + PAD_L + chartW, maxRewardY);
    ctx.strokeStyle = 'rgba(239,68,68,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239,68,68,0.6)';
    ctx.font = `10px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('max 0.9', offsetX + PAD_L + chartW - 2, maxRewardY - 2);

    // Sliding window average line
    const history = rewardHistory;
    if (history.length >= 2) {
      const windowSize = 50;
      // Build sliding averages
      const avgs = [];
      for (let i = 0; i < history.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        let sum = 0;
        for (let k = start; k <= i; k++) sum += history[k];
        avgs.push(sum / (i - start + 1));
      }

      // Only plot last chartW points at most (1 pt per px)
      const maxPts = Math.floor(chartW);
      const startIdx = Math.max(0, avgs.length - maxPts);
      const pts = avgs.slice(startIdx);
      const totalPts = pts.length;

      ctx.beginPath();
      for (let i = 0; i < totalPts; i++) {
        const px = offsetX + PAD_L + (i / Math.max(totalPts - 1, 1)) * chartW;
        const py = PAD_T + chartH - pts[i] * chartH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = prime;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // X-axis label
    ctx.fillStyle = inkLow;
    ctx.font = `10px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`episode`, offsetX + PAD_L + chartW / 2, H - 4);

    // Episode count at far right of x axis
    if (episodeCount > 0) {
      ctx.fillStyle = inkLow;
      ctx.font = `10px var(--font-mono, monospace)`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(`${episodeCount}`, offsetX + PAD_L + chartW, PAD_T + chartH + 4);
    }
  }
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export const PolicyGradientViz = forwardRef(function PolicyGradientViz(props, ref) {
  const canvasRef = useRef(null);
  const logitsRef = useRef([0, 0, 0, 0]);
  const baselineRef = useRef(0);
  const rewardHistoryRef = useRef([]);
  const rngRef = useRef(makeMulberry32(SEED));
  const isRunningRef = useRef(false);

  const [episode, setEpisode] = useState(0);

  // ── Draw helper ──
  const redraw = useCallback((ep) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw(canvas, logitsRef.current, rewardHistoryRef.current, ep ?? episode);
  }, [episode]);

  // ── ResizeObserver: DPR-correct canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      draw(canvas, logitsRef.current, rewardHistoryRef.current, episode);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw on episode change
  useEffect(() => {
    redraw(episode);
  }, [redraw, episode]);

  // ── Run N episodes ──
  const runN = useCallback((n) => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    for (let i = 0; i < n; i++) {
      const r = runEpisode(logitsRef.current, baselineRef, rngRef.current);
      rewardHistoryRef.current.push(r);
    }

    const newEp = rewardHistoryRef.current.length;
    setEpisode(newEp);
    isRunningRef.current = false;
  }, []);

  // ── Reset ──
  const handleReset = useCallback(() => {
    isRunningRef.current = false;
    logitsRef.current = [0, 0, 0, 0];
    baselineRef.current = 0;
    rewardHistoryRef.current = [];
    rngRef.current = makeMulberry32(SEED);
    setEpisode(0);
    const canvas = canvasRef.current;
    if (canvas) draw(canvas, logitsRef.current, rewardHistoryRef.current, 0);
  }, []);

  const animRef = useRef(null)

  const play = useCallback(() => {
    if (animRef.current) return
    animRef.current = setInterval(() => {
      if (isRunningRef.current) return
      isRunningRef.current = true
      for (let i = 0; i < 10; i++) {
        const r = runEpisode(logitsRef.current, baselineRef, rngRef.current)
        rewardHistoryRef.current.push(r)
      }
      const newEp = rewardHistoryRef.current.length
      setEpisode(newEp)
      isRunningRef.current = false
    }, 100)
  }, [])

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
  }, [])

  const reset = useCallback(() => {
    pause()
    handleReset()
  }, [pause, handleReset])

  const step = useCallback(() => {
    pause()
    runN(1)
  }, [pause, runN])

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step])

  useEffect(() => {
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [])

  // ── Derived display ──
  const probs = softmax(logitsRef.current);
  const bestArm = probs.indexOf(Math.max(...probs));
  const bestPct = (probs[bestArm] * 100).toFixed(1);
  const converged = episode > 50 && bestArm === 2;

  const btnStyle = {
    padding: '6px 14px',
    borderRadius: '4px',
    border: '1px solid var(--rim, #333)',
    background: 'var(--surface, #1a1a1a)',
    color: 'var(--ink-mid, #888)',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans, sans-serif)',
  };

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi)',
      padding: '24px',
      background: 'var(--depth)',
      borderRadius: '12px',
      maxWidth: '900px',
    }}>
      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--prime)', marginBottom: '4px' }}>
        REINFORCE — Policy Gradient on a 4-Armed Bandit
      </div>
      <div style={{ fontSize: '14px', color: 'var(--ink-mid)', marginBottom: '20px' }}>
        {`Softmax policy over logits θ, updated by α×(R−baseline)×∇log π(a|θ). Watch the agent discover arm A2 (p=0.9).`}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '320px',
          borderRadius: '8px',
          border: '1px solid var(--rim, #333)',
          marginBottom: '16px',
        }}
      />

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => runN(1)} style={btnStyle}>Step x1</button>
        <button onClick={() => runN(10)} style={btnStyle}>Step x10</button>
        <button onClick={() => runN(100)} style={btnStyle}>Step x100</button>
        <button onClick={handleReset} style={btnStyle}>Reset</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '13px',
          color: 'var(--ink-mid)',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          {`Episode `}
          <span style={{ fontWeight: 700, color: 'var(--prime)' }}>{episode}</span>
          {` | Learned best arm: `}
          <span style={{ fontWeight: 700, color: 'var(--prime)' }}>{`A${bestArm} (${bestPct}%)`}</span>
        </div>
        {converged && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            color: 'rgba(34,197,94,0.9)',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
          }}>
            Converged!
          </div>
        )}
      </div>

      {/* Comparison note */}
      <div style={{
        fontSize: '12px',
        color: 'var(--ink-low)',
        lineHeight: 1.6,
        background: 'var(--surface)',
        border: '1px solid var(--rim)',
        borderRadius: '8px',
        padding: '12px 16px',
      }}>
        {`In contrast to Q-learning which uses value estimates, REINFORCE directly adjusts the probability of taking each action based on whether it gave better-than-expected reward. The (R - baseline) term is the advantage estimate.`}
      </div>
    </div>
  );
})
