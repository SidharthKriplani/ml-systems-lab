import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const ROWS = 7;
const COLS = 7;
const N_ACTIONS = 4; // 0=up, 1=right, 2=down, 3=left

// (row, col) walls
const WALL_SET = new Set([
  '1,1', '1,2', '1,3',
  '2,5',
  '3,1', '3,3', '3,4',
  '4,2',
  '5,5', '5,6',
  '6,5',
]);

function isWall(r, c) {
  return WALL_SET.has(`${r},${c}`);
}

const START = [0, 0];
const GOAL = [6, 6];

// Action deltas: up, right, down, left
const DELTAS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const ARROW_CHARS = ['▲', '▶', '▼', '◀'];

// Hyperparameters
const ALPHA = 0.1;
const GAMMA = 0.95;
const EPS_DECAY = 0.995;
const EPS_MIN = 0.05;
const MAX_STEPS = 200;
const REWARD_GOAL = 10;
const REWARD_STEP = -0.1;
const REWARD_WALL = -1;

// ──────────────────────────────────────────────
// Q-table helpers
// ──────────────────────────────────────────────
function makeQTable() {
  // Float32Array of shape [ROWS][COLS][N_ACTIONS] → flat
  return new Float32Array(ROWS * COLS * N_ACTIONS).fill(0);
}

function qIdx(r, c, a) {
  return (r * COLS + c) * N_ACTIONS + a;
}

function getQ(qt, r, c, a) {
  return qt[qIdx(r, c, a)];
}

function setQ(qt, r, c, a, val) {
  qt[qIdx(r, c, a)] = val;
}

function maxQ(qt, r, c) {
  let best = -Infinity;
  for (let a = 0; a < N_ACTIONS; a++) {
    const v = getQ(qt, r, c, a);
    if (v > best) best = v;
  }
  return best;
}

function argmaxQ(qt, r, c) {
  let best = -Infinity;
  let bestA = 0;
  for (let a = 0; a < N_ACTIONS; a++) {
    const v = getQ(qt, r, c, a);
    if (v > best) { best = v; bestA = a; }
  }
  return bestA;
}

// ──────────────────────────────────────────────
// Step the agent once (mutates qt)
// Returns { nextR, nextC, reward, done }
// ──────────────────────────────────────────────
function qStep(qt, r, c, epsilon) {
  // epsilon-greedy action
  let action;
  if (Math.random() < epsilon) {
    action = Math.floor(Math.random() * N_ACTIONS);
  } else {
    action = argmaxQ(qt, r, c);
  }

  const [dr, dc] = DELTAS[action];
  const nr = r + dr;
  const nc = c + dc;

  let reward;
  let nextR, nextC;
  let done = false;

  if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || isWall(nr, nc)) {
    // Illegal move — stay
    reward = REWARD_WALL;
    nextR = r;
    nextC = c;
  } else if (nr === GOAL[0] && nc === GOAL[1]) {
    reward = REWARD_GOAL;
    nextR = nr;
    nextC = nc;
    done = true;
  } else {
    reward = REWARD_STEP;
    nextR = nr;
    nextC = nc;
  }

  // Q-update
  const oldQ = getQ(qt, r, c, action);
  const futureQ = done ? 0 : maxQ(qt, nextR, nextC);
  const newQ = oldQ + ALPHA * (reward + GAMMA * futureQ - oldQ);
  setQ(qt, r, c, action, newQ);

  return { nextR, nextC, reward, done };
}

// Run a full episode synchronously, returns total reward
function runEpisode(qt, epsilonRef) {
  let r = START[0];
  let c = START[1];
  let totalReward = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const res = qStep(qt, r, c, epsilonRef.current);
    totalReward += res.reward;
    r = res.nextR;
    c = res.nextC;
    if (res.done) break;
  }

  epsilonRef.current = Math.max(EPS_MIN, epsilonRef.current * EPS_DECAY);
  return totalReward;
}

// ──────────────────────────────────────────────
// Drawing
// ──────────────────────────────────────────────
function draw(canvas, qt, agentR, agentC, episodeCount) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  if (W === 0 || H === 0) return;

  const style = getComputedStyle(document.documentElement);
  const prime = style.getPropertyValue('--prime').trim() || '#F59E0B';
  const depth = style.getPropertyValue('--depth').trim() || '#0d1117';
  const rim = style.getPropertyValue('--rim').trim() || '#30363d';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const PAD = 8;
  const gridW = W - PAD * 2;
  const gridH = H - PAD * 2;
  const cellW = gridW / COLS;
  const cellH = gridH / ROWS;

  // Compute global max Q for heatmap normalisation
  let globalMax = 0.01;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!isWall(r, c)) {
        const v = maxQ(qt, r, c);
        if (v > globalMax) globalMax = v;
      }
    }
  }

  const showPolicy = episodeCount > 5;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = PAD + c * cellW;
      const y = PAD + r * cellH;
      const isStart = r === START[0] && c === START[1];
      const isGoal = r === GOAL[0] && c === GOAL[1];
      const wall = isWall(r, c);

      if (wall) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x, y, cellW, cellH);
      } else if (isGoal) {
        ctx.fillStyle = prime;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, y, cellW, cellH);
        ctx.globalAlpha = 1.0;
      } else {
        // Heatmap: 0 → deep dark, positive → blue-ish
        const v = Math.max(0, maxQ(qt, r, c));
        const t = Math.min(1, v / globalMax);
        const rCh = Math.round(10 + t * 30);
        const gCh = Math.round(15 + t * 80);
        const bCh = Math.round(30 + t * 180);
        ctx.fillStyle = `rgb(${rCh},${gCh},${bCh})`;
        if (isStart) {
          // Green tint overlay
          ctx.fillStyle = `rgba(34,197,94,${0.15 + t * 0.25})`;
          ctx.fillRect(x, y, cellW, cellH);
          ctx.fillStyle = `rgb(${rCh},${gCh},${bCh})`;
        }
        ctx.fillRect(x, y, cellW, cellH);

        if (isStart) {
          ctx.fillStyle = 'rgba(34,197,94,0.25)';
          ctx.fillRect(x, y, cellW, cellH);
        }
      }

      // Policy arrows
      if (showPolicy && !wall && !isGoal) {
        const bestA = argmaxQ(qt, r, c);
        const cx = x + cellW / 2;
        const cy = y + cellH / 2;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = `${Math.min(cellW, cellH) * 0.38}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ARROW_CHARS[bestA], cx, cy);
      }

      // S / G labels
      if (isStart || isGoal) {
        const label = isStart ? 'S' : 'G';
        const cx = x + cellW / 2;
        const cy = y + cellH / 2;
        ctx.fillStyle = isGoal ? '#1a1a1a' : 'rgba(34,197,94,0.9)';
        ctx.font = `bold ${Math.min(cellW, cellH) * 0.42}px var(--font-mono, monospace)`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);
      }
    }
  }

  // Grid lines
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(PAD, PAD + r * cellH);
    ctx.lineTo(PAD + gridW, PAD + r * cellH);
    ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(PAD + c * cellW, PAD);
    ctx.lineTo(PAD + c * cellW, PAD + gridH);
    ctx.stroke();
  }

  // Agent
  const ax = PAD + agentC * cellW + cellW / 2;
  const ay = PAD + agentR * cellH + cellH / 2;
  const ar = Math.min(cellW, cellH) * 0.28;
  ctx.beginPath();
  ctx.arc(ax, ay, ar, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,200,200,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export const QLearningViz = forwardRef(function QLearningViz(props, ref) {
  const canvasRef = useRef(null);
  const qtRef = useRef(makeQTable());
  const epsilonRef = useRef(1.0);
  const agentPosRef = useRef([...START]);
  const isRunningRef = useRef(false);
  const animFrameRef = useRef(null);
  const stepsRef = useRef(0);
  const episodeRewardRef = useRef(0);

  const [episode, setEpisode] = useState(0);
  const [lastReward, setLastReward] = useState(null);
  const [epsilonDisplay, setEpsilonDisplay] = useState(1.0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Draw helper that reads current refs
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw(canvas, qtRef.current, agentPosRef.current[0], agentPosRef.current[1], episode);
  }, [episode]);

  // ResizeObserver — sets canvas physical pixels and rescales
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
      draw(canvas, qtRef.current, agentPosRef.current[0], agentPosRef.current[1], episode);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when episode count changes (policy display threshold)
  useEffect(() => {
    redraw();
  }, [redraw]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isRunningRef.current = false;
    qtRef.current = makeQTable();
    epsilonRef.current = 1.0;
    agentPosRef.current = [...START];
    stepsRef.current = 0;
    episodeRewardRef.current = 0;
    setEpisode(0);
    setLastReward(null);
    setEpsilonDisplay(1.0);
    setIsAnimating(false);
    const canvas = canvasRef.current;
    if (canvas) draw(canvas, qtRef.current, START[0], START[1], 0);
  }, []);

  // ── Animated single episode (Step button) ──
  const handleStep = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsAnimating(true);

    agentPosRef.current = [...START];
    stepsRef.current = 0;
    episodeRewardRef.current = 0;

    // Capture episode count at start for closure
    let localEpisode = episode;

    function tick() {
      const [r, c] = agentPosRef.current;
      if (stepsRef.current >= MAX_STEPS) {
        // Episode over (timeout)
        epsilonRef.current = Math.max(EPS_MIN, epsilonRef.current * EPS_DECAY);
        const finalEp = localEpisode + 1;
        setEpisode(finalEp);
        setLastReward(parseFloat(episodeRewardRef.current.toFixed(2)));
        setEpsilonDisplay(parseFloat(epsilonRef.current.toFixed(4)));
        isRunningRef.current = false;
        setIsAnimating(false);
        return;
      }

      const res = qStep(qtRef.current, r, c, epsilonRef.current);
      episodeRewardRef.current += res.reward;
      stepsRef.current += 1;
      agentPosRef.current = [res.nextR, res.nextC];

      const canvas = canvasRef.current;
      if (canvas) draw(canvas, qtRef.current, res.nextR, res.nextC, localEpisode);

      if (res.done) {
        epsilonRef.current = Math.max(EPS_MIN, epsilonRef.current * EPS_DECAY);
        const finalEp = localEpisode + 1;
        setEpisode(finalEp);
        setLastReward(parseFloat(episodeRewardRef.current.toFixed(2)));
        setEpsilonDisplay(parseFloat(epsilonRef.current.toFixed(4)));
        isRunningRef.current = false;
        setIsAnimating(false);
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);
  }, [episode]);

  // ── Synchronous batch run ──
  const handleRunBatch = useCallback((count) => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsAnimating(true);

    let totalReward = 0;
    for (let i = 0; i < count; i++) {
      totalReward = runEpisode(qtRef.current, epsilonRef);
    }

    agentPosRef.current = [...START];
    const newEp = episode + count;
    setEpisode(newEp);
    setLastReward(parseFloat(totalReward.toFixed(2)));
    setEpsilonDisplay(parseFloat(epsilonRef.current.toFixed(4)));

    const canvas = canvasRef.current;
    if (canvas) draw(canvas, qtRef.current, START[0], START[1], newEp);

    isRunningRef.current = false;
    setIsAnimating(false);
  }, [episode]);

  const animRef = useRef(null)

  const pause = useCallback(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
    isRunningRef.current = false
    setIsAnimating(false)
  }, [])

  const play = useCallback(() => {
    if (animRef.current) return
    animRef.current = setInterval(() => {
      if (isRunningRef.current) return
      isRunningRef.current = true
      let totalReward = 0
      for (let i = 0; i < 10; i++) {
        totalReward = runEpisode(qtRef.current, epsilonRef)
      }
      agentPosRef.current = [...START]
      setEpisode(prev => {
        const newEp = prev + 10
        const canvas = canvasRef.current
        if (canvas) draw(canvas, qtRef.current, START[0], START[1], newEp)
        return newEp
      })
      setLastReward(parseFloat(totalReward.toFixed(2)))
      setEpsilonDisplay(parseFloat(epsilonRef.current.toFixed(4)))
      isRunningRef.current = false
    }, 200)
  }, [])

  const reset = useCallback(() => {
    pause()
    handleReset()
  }, [pause, handleReset])

  const step = useCallback(() => {
    pause()
    if (isRunningRef.current) return
    isRunningRef.current = true
    const totalReward = runEpisode(qtRef.current, epsilonRef)
    agentPosRef.current = [...START]
    setEpisode(prev => {
      const newEp = prev + 1
      const canvas = canvasRef.current
      if (canvas) draw(canvas, qtRef.current, START[0], START[1], newEp)
      return newEp
    })
    setLastReward(parseFloat(totalReward.toFixed(2)))
    setEpsilonDisplay(parseFloat(epsilonRef.current.toFixed(4)))
    isRunningRef.current = false
  }, [pause])

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step])

  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

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

  const btnDisabled = {
    ...btnStyle,
    opacity: 0.4,
    cursor: 'not-allowed',
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
        Q-Learning Grid World
      </div>
      <div style={{ fontSize: '14px', color: 'var(--ink-mid)', marginBottom: '20px' }}>
        {`Agent learns a path from S → G via epsilon-greedy Q-learning. Heatmap = max Q-value. Arrows appear after 5 episodes.`}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '400px',
          borderRadius: '8px',
          border: '1px solid var(--rim, #333)',
          marginBottom: '16px',
        }}
      />

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
        <button
          onClick={handleStep}
          disabled={isAnimating}
          style={isAnimating ? btnDisabled : btnStyle}
        >
          Step (1 ep)
        </button>
        <button
          onClick={() => handleRunBatch(10)}
          disabled={isAnimating}
          style={isAnimating ? btnDisabled : btnStyle}
        >
          Run 10
        </button>
        <button
          onClick={() => handleRunBatch(100)}
          disabled={isAnimating}
          style={isAnimating ? btnDisabled : btnStyle}
        >
          Run 100
        </button>
        <button
          onClick={handleReset}
          style={btnStyle}
        >
          Reset
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '13px',
          color: 'var(--ink-mid)',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          Episode:{' '}
          <span style={{ fontWeight: 700, color: 'var(--prime)' }}>{episode}</span>
        </div>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '13px',
          color: 'var(--ink-mid)',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          {`ε (epsilon):`}{' '}
          <span style={{ fontWeight: 700, color: 'var(--prime)' }}>{epsilonDisplay.toFixed(4)}</span>
        </div>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--rim)',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '13px',
          color: 'var(--ink-mid)',
          fontFamily: 'var(--font-mono, monospace)',
        }}>
          Last ep reward:{' '}
          <span style={{ fontWeight: 700, color: lastReward !== null && lastReward > 0 ? 'var(--prime)' : '#ef4444' }}>
            {lastReward !== null ? lastReward : '—'}
          </span>
        </div>
      </div>

      {/* Note */}
      <div style={{
        fontSize: '12px',
        color: 'var(--ink-low)',
        lineHeight: 1.6,
        background: 'var(--surface)',
        border: '1px solid var(--rim)',
        borderRadius: '8px',
        padding: '12px 16px',
        marginTop: '16px',
      }}>
        {`α=0.1 · γ=0.95 · ε decays 0.995/episode → min 0.05 · Reward: +10 goal, −0.1 step, −1 wall hit · `}
        {`Dark cells are walls. After enough episodes the policy arrows show the greedy path.`}
      </div>
    </div>
  );
})
