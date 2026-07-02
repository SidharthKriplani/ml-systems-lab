import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

const LOSS = (w) => (w - 3) ** 2;
const GRAD = (w) => 2 * (w - 3);

const W_MIN = -0.3;
const W_MAX = 4.3;
const L_MIN = 0;
const L_MAX = 11;

function toCanvas(w, loss, width, height) {
  const x = ((w - W_MIN) / (W_MAX - W_MIN)) * width;
  const y = height - ((loss - L_MIN) / (L_MAX - L_MIN)) * height;
  return { x, y };
}

function drawPlot(canvas, trajectory, currentW) {
  const ctx = canvas.getContext('2d');
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const cs = getComputedStyle(document.documentElement);
  const prime = cs.getPropertyValue('--prime').trim() || '#F0A500';
  const rimColor = cs.getPropertyValue('--rim').trim() || '#333';
  const inkLow = cs.getPropertyValue('--ink-low').trim() || '#666';
  const inkMid = cs.getPropertyValue('--ink-mid').trim() || '#999';
  const depth = cs.getPropertyValue('--depth').trim() || '#111';

  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, width, height);

  // Grid lines (horizontal)
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 0.5;
  for (let l = 0; l <= 10; l += 2) {
    const { y } = toCanvas(0, l, width, height);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.fillStyle = inkLow;
    ctx.font = `10px var(--font-mono, monospace)`;
    ctx.fillText(l.toString(), 4, y - 3);
  }

  // Grid lines (vertical)
  for (let w = 0; w <= 4; w += 1) {
    const { x } = toCanvas(w, 0, width, height);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.fillStyle = inkLow;
    ctx.font = `10px var(--font-mono, monospace)`;
    ctx.fillText(w.toString(), x + 2, height - 4);
  }

  // Axis labels
  ctx.fillStyle = inkMid;
  ctx.font = `11px var(--font-sans, sans-serif)`;
  ctx.fillText('w', width - 14, height - 4);
  ctx.fillText('L(w)', 4, 14);

  // Target line at w=3 (dashed green)
  const { x: tx } = toCanvas(3, 0, width, height);
  ctx.save();
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(tx, 0);
  ctx.lineTo(tx, height);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.fillStyle = '#4ade80';
  ctx.font = `10px var(--font-sans, sans-serif)`;
  ctx.fillText('w*=3', tx + 4, 14);

  // Parabola curve (steel blue)
  ctx.strokeStyle = '#5b8fc7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let first = true;
  for (let wi = W_MIN; wi <= W_MAX; wi += 0.05) {
    const { x, y } = toCanvas(wi, LOSS(wi), width, height);
    if (first) { ctx.moveTo(x, y); first = false; }
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Trajectory dots
  if (trajectory.length > 1) {
    ctx.strokeStyle = '#4a7bb5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    trajectory.forEach(({ w }, i) => {
      const { x, y } = toCanvas(w, LOSS(w), width, height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    trajectory.forEach(({ w }, i) => {
      if (i === trajectory.length - 1) return; // skip current, drawn separately
      const { x, y } = toCanvas(w, LOSS(w), width, height);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(74, 123, 181, ${0.4 + 0.6 * (i / trajectory.length)})`;
      ctx.fill();
    });
  }

  // Current dot (amber, larger)
  const { x: cx, y: cy } = toCanvas(currentW, LOSS(currentW), width, height);
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fillStyle = prime;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export const GradientDescentDemo = forwardRef(function GradientDescentDemo(props, ref) {
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

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

  const [alpha, setAlpha] = useState(0.10);
  const [step, setStep] = useState(0);
  const [w, setW] = useState(0);
  const [trajectory, setTrajectory] = useState([{ w: 0 }]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [diverged, setDiverged] = useState(false);

  const loss = LOSS(w);
  const grad = GRAD(w);

  const drawCanvas = useCallback(() => {
    if (canvasRef.current) {
      drawPlot(canvasRef.current, trajectory, w);
    }
  }, [trajectory, w]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const doStep = useCallback((prevW, prevTrajectory, prevStep, currentAlpha) => {
    const g = GRAD(prevW);
    const newW = prevW - currentAlpha * g;
    const newLoss = LOSS(newW);
    const newStep = prevStep + 1;
    const newTrajectory = [...prevTrajectory, { w: newW }];
    const isDiverted = !isFinite(newW) || Math.abs(newW) > 200 || newLoss > 10000;
    const isDone = newLoss < 0.0001 || newStep >= 120 || isDiverted;
    setW(newW);
    setTrajectory(newTrajectory);
    setStep(newStep);
    if (isDiverted) setDiverged(true);
    if (isDone) {
      setRunning(false);
      setDone(true);
    }
    return { newW, newTrajectory, newStep, isDone };
  }, []);

  const handleStep = useCallback(() => {
    if (done) return;
    doStep(w, trajectory, step, alpha);
  }, [done, doStep, w, trajectory, step, alpha]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setW((prevW) => {
          setTrajectory((prevTraj) => {
            setStep((prevStep) => {
              const g = GRAD(prevW);
              const newW = prevW - alpha * g;
              const newLoss = LOSS(newW);
              const newStep = prevStep + 1;
              const isDone = newLoss < 0.0001 || newStep >= 120;
              if (isDone) {
                setRunning(false);
                setDone(true);
                clearInterval(intervalRef.current);
              }
              // We can't update all state atomically inside setStep callback
              // Use a different approach
              return prevStep; // placeholder
            });
            return prevTraj; // placeholder
          });
          return prevW; // placeholder
        });
      }, 120);
      return () => clearInterval(intervalRef.current);
    }
  }, [running, alpha]);

  // Better auto-run approach: use a ref for the run loop
  const runStateRef = useRef({ w: 0, trajectory: [{ w: 0 }], step: 0 });
  runStateRef.current = { w, trajectory, step };

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      const { w: cw, trajectory: ct, step: cs } = runStateRef.current;
      const g = GRAD(cw);
      const newW = cw - alpha * g;
      const newLoss = LOSS(newW);
      const newStep = cs + 1;
      const newTraj = [...ct, { w: newW }];
      setW(newW);
      setTrajectory(newTraj);
      setStep(newStep);
      const isDiverted = !isFinite(newW) || Math.abs(newW) > 200 || LOSS(newW) > 10000;
      if (isDiverted) setDiverged(true);
      if (newLoss < 0.0001 || newStep >= 120 || isDiverted) {
        setRunning(false);
        setDone(true);
        clearInterval(intervalRef.current);
      }
    }, 120);
    return () => clearInterval(intervalRef.current);
  }, [running, alpha]);

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setDone(false);
    setDiverged(false);
    setStep(0);
    setW(0);
    setTrajectory([{ w: 0 }]);
  };

  const prevLoss = trajectory.length > 1 ? LOSS(trajectory[trajectory.length - 2].w) : null;
  const lossPct = prevLoss != null && prevLoss > 0
    ? (((prevLoss - loss) / prevLoss) * 100).toFixed(1)
    : null;

  const gradSign = grad < 0 ? 'negative' : grad > 0 ? 'positive' : 'zero';
  const dirNote = grad < 0
    ? `gradient is negative → subtracting it pushes w right toward w=3`
    : grad > 0
    ? `gradient is positive → subtracting it pushes w left toward w=3`
    : `gradient is zero → already at the minimum`;

  const newW = w - alpha * grad;

  useImperativeHandle(ref, () => ({
    play: () => { if (!done) setRunning(true) },
    pause: () => { setRunning(false) },
    reset: handleReset,
    step: handleStep,
  }), [done, handleReset, handleStep])

  const styles = {
    root: {
      fontFamily: `var(--font-sans, sans-serif)`,
      background: `var(--surface, #1a1a1a)`,
      border: `1px solid var(--rim, #333)`,
      borderRadius: 10,
      padding: '14px 16px',
      maxWidth: 700,
      color: `var(--ink-hi, #eee)`,
    },
    title: {
      margin: '0 0 2px 0',
      fontSize: 15,
      fontWeight: 700,
      color: `var(--ink-hi, #eee)`,
    },
    subtitle: {
      margin: '0 0 10px 0',
      fontSize: 12,
      color: `var(--ink-low, #888)`,
      fontFamily: `var(--font-mono, monospace)`,
    },
    canvas: {
      display: 'block',
      width: '100%',
      height: 150,
      borderRadius: 6,
      border: `1px solid var(--rim, #333)`,
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
      flexWrap: 'wrap',
    },
    sliderLabel: {
      fontSize: 13,
      color: `var(--ink-mid, #aaa)`,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    slider: {
      accentColor: `var(--prime, #F0A500)`,
      width: 130,
    },
    mono: {
      fontFamily: `var(--font-mono, monospace)`,
      color: `var(--prime, #F0A500)`,
      fontSize: 13,
    },
    btn: {
      padding: '6px 14px',
      borderRadius: 6,
      border: `1px solid var(--rim-hi, #555)`,
      background: `var(--depth, #111)`,
      color: `var(--ink-hi, #eee)`,
      cursor: 'pointer',
      fontSize: 13,
      fontFamily: `var(--font-sans, sans-serif)`,
    },
    btnPrime: {
      padding: '6px 14px',
      borderRadius: 6,
      border: `1px solid var(--prime, #F0A500)`,
      background: `var(--prime, #F0A500)`,
      color: '#000',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: `var(--font-sans, sans-serif)`,
    },
    statsRow: {
      display: 'flex',
      gap: 16,
      marginTop: 10,
      fontSize: 12,
      color: `var(--ink-mid, #aaa)`,
      fontFamily: `var(--font-mono, monospace)`,
      flexWrap: 'wrap',
    },
    statItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    },
    statLabel: {
      color: `var(--ink-low, #888)`,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    statVal: {
      color: `var(--ink-hi, #eee)`,
      fontSize: 13,
    },
    stepPanel: {
      marginTop: 10,
      background: `var(--depth, #111)`,
      border: `1px solid var(--rim, #333)`,
      borderRadius: 8,
      padding: '9px 12px',
      fontSize: 12,
    },
    stepTitle: {
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: `var(--ink-low, #888)`,
      marginBottom: 6,
    },
    mathRow: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      fontFamily: `var(--font-mono, monospace)`,
      fontSize: 11.5,
      color: `var(--ink-mid, #aaa)`,
    },
    highlight: {
      color: `var(--prime, #F0A500)`,
    },
    note: {
      marginTop: 1,
      fontSize: 11,
      color: `var(--ink-low, #888)`,
      fontStyle: 'italic',
      fontFamily: `var(--font-sans, sans-serif)`,
    },
    divider: {
      border: 'none',
      borderTop: `1px solid var(--rim, #333)`,
      margin: '5px 0',
    },
  };

  return (
    <div style={styles.root}>
      <p style={styles.title}>Gradient Descent Demo</p>
      <p style={styles.subtitle}>{`L(w) = (w − 3)²  —  minimize by finding w = 3`}</p>

      <canvas
        ref={canvasRef}
        width={640}
        height={150}
        style={styles.canvas}
      />

      <div style={styles.controls}>
        <label style={styles.sliderLabel}>
          <span>{`α (lr)`}</span>
          <input
            type="range"
            min={0.01}
            max={1.49}
            step={0.01}
            value={alpha}
            onChange={(e) => { setAlpha(parseFloat(e.target.value)); handleReset(); }}
            style={styles.slider}
          />
          <span style={{ ...styles.mono, color: alpha >= 1.0 ? '#ef4444' : 'var(--prime, #F0A500)' }}>
            {alpha.toFixed(2)}
          </span>
        </label>

        <button
          style={styles.btn}
          onClick={handleStep}
          disabled={done}
        >
          Step
        </button>

        <button
          style={running ? styles.btn : styles.btnPrime}
          onClick={() => { if (!done) setRunning((r) => !r); }}
          disabled={done}
        >
          {running ? 'Pause' : 'Run'}
        </button>

        <button style={styles.btn} onClick={handleReset}>
          Reset
        </button>

        {done && !diverged && (
          <span style={{ fontSize: 12, color: '#4ade80' }}>✓ converged</span>
        )}
        {diverged && (
          <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>✗ DIVERGED (α ≥ 1/L)</span>
        )}
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Step</span>
          <span style={styles.statVal}>{step}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>w</span>
          <span style={styles.statVal}>{w.toFixed(6)}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>{`L(w)`}</span>
          <span style={styles.statVal}>{loss.toFixed(6)}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>{`Δ loss`}</span>
          <span style={{ ...styles.statVal, color: lossPct != null ? '#4ade80' : `var(--ink-mid)` }}>
            {lossPct != null ? `−${lossPct}%` : `—`}
          </span>
        </div>
      </div>

      {(() => {
        // For L(w)=(w-3)^2, L=2, optimum lr = 1/L = 0.5, contraction ρ = |1 - 2α|
        const rho = Math.abs(1 - 2 * alpha);
        const converges = alpha < 1.0;
        const stepsToHalve = converges && rho > 0 ? Math.ceil(Math.log(0.5) / Math.log(rho)) : null;
        return (
          <div style={{ ...styles.stepPanel, borderColor: converges ? 'var(--rim,#333)' : '#ef4444' }}>
            <div style={styles.stepTitle}>{`Step math + convergence (step ${step})`}</div>
            <div style={styles.mathRow}>
              <div>
                <span style={{ color: `var(--ink-low)` }}>{`∂L/∂w = 2(${w.toFixed(3)}−3) = `}</span>
                <span style={styles.highlight}>{grad.toFixed(3)}</span>
                <span style={{ color: `var(--ink-low)` }}>{`  ·  w ← ${w.toFixed(3)} − ${alpha.toFixed(2)}×${grad.toFixed(3)} = `}</span>
                <span style={styles.highlight}>{newW.toFixed(3)}</span>
              </div>
              <div>
                <span style={{ color: `var(--ink-low)` }}>{`L(w): ${loss.toFixed(3)} → ${LOSS(newW).toFixed(3)}`}</span>
                {lossPct != null && <span style={{ color: '#4ade80' }}>{`  (−${lossPct}%)`}</span>}
                <span style={{ color: `var(--ink-low)` }}>{`   ${dirNote.startsWith('gradient is negative') ? '→ w moves right' : dirNote.startsWith('gradient is positive') ? '→ w moves left' : '→ at minimum'}`}</span>
              </div>
              <hr style={styles.divider} />
              <div>
                <span style={{ color: 'var(--ink-low)' }}>ρ = |1 − 2α| = </span>
                <span style={{ color: converges ? '#4ade80' : '#ef4444', fontWeight: 700 }}>{rho.toFixed(3)}</span>
                <span style={{ color: 'var(--ink-low)' }}>{converges ? ' < 1 → converges' : ' ≥ 1 → DIVERGES'}</span>
                {converges && stepsToHalve !== null && (
                  <span style={{ color: 'var(--ink-low)' }}>{`  ·  ~${stepsToHalve} steps to halve error`}</span>
                )}
              </div>
              <div style={styles.note}>
                Optimal α = 1/L = 0.5 (fastest). α → 0 slow but safe. α ≥ 2/L = 1.0 diverges.
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
})
