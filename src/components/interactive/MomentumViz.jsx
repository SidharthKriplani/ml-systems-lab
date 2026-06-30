import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

const W1_RANGE = [-2, 2];
const W2_RANGE = [-2, 2];
const MAX_STEPS = 60;
const CONTOUR_LEVELS = [0.5, 1, 2, 4, 8, 16];

function loss(w1, w2) {
  return w1 * w1 + 10 * w2 * w2;
}

function grad(w1, w2) {
  return [2 * w1, 20 * w2];
}

function worldToCanvas(w1, w2, cw, ch) {
  const px = ((w1 - W1_RANGE[0]) / (W1_RANGE[1] - W1_RANGE[0])) * cw;
  const py = ch - ((w2 - W2_RANGE[0]) / (W2_RANGE[1] - W2_RANGE[0])) * ch;
  return [px, py];
}

function drawScene(ctx, trajectory, color, cw, ch, isDone) {
  // Contours: L = w1² + 10w2² = c  →  ellipse with a=√c, b=√(c/10)
  ctx.save();
  CONTOUR_LEVELS.forEach((c) => {
    const a = Math.sqrt(c); // semi-axis along w1
    const b = Math.sqrt(c / 10); // semi-axis along w2
    const [cx0, cy0] = worldToCanvas(0, 0, cw, ch);
    const scaleX = (cw / (W1_RANGE[1] - W1_RANGE[0])) * a * 2;
    const scaleY = (ch / (W2_RANGE[1] - W2_RANGE[0])) * b * 2;
    ctx.beginPath();
    ctx.ellipse(cx0, cy0, scaleX / 2, scaleY / 2, 0, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(150,150,150,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  });
  ctx.restore();

  // Minimum star at (0,0)
  const [mx, my] = worldToCanvas(0, 0, cw, ch);
  ctx.save();
  ctx.fillStyle = '#22c55e';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', mx, my);
  ctx.restore();

  // Trajectory
  if (trajectory.length > 0) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const [x0, y0] = worldToCanvas(trajectory[0][0], trajectory[0][1], cw, ch);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < trajectory.length; i++) {
      const [xi, yi] = worldToCanvas(trajectory[i][0], trajectory[i][1], cw, ch);
      ctx.lineTo(xi, yi);
    }
    ctx.stroke();

    // Dots
    trajectory.forEach(([w1, w2], idx) => {
      const [px, py] = worldToCanvas(w1, w2, cw, ch);
      ctx.beginPath();
      ctx.arc(px, py, idx === trajectory.length - 1 ? 5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = idx === trajectory.length - 1 ? color : color + '99';
      ctx.fill();
    });
    ctx.restore();
  }
}

function paintCanvas(canvas, trajectoryVanilla, trajectoryMomentum) {
  if (!canvas) return;
  const cw = canvas.clientWidth / 2;
  const ch = canvas.clientHeight;
  if (cw === 0 || ch === 0) return;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // Left panel background
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, cw, ch);
  // Right panel background
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.fillRect(cw, 0, cw, ch);

  // Divider
  ctx.fillStyle = 'rgba(150,150,150,0.3)';
  ctx.fillRect(cw - 1, 0, 2, ch);

  // Panel labels
  ctx.save();
  ctx.fillStyle = 'rgba(200,200,200,0.6)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Vanilla GD', cw / 2, 14);
  ctx.fillText('GD + Momentum', cw + cw / 2, 14);
  ctx.restore();

  // Left: vanilla
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, cw, ch);
  ctx.clip();
  drawScene(ctx, trajectoryVanilla, '#f59e0b', cw, ch);
  ctx.restore();

  // Right: momentum (offset by cw)
  ctx.save();
  ctx.translate(cw, 0);
  ctx.beginPath();
  ctx.rect(0, 0, cw, ch);
  ctx.clip();
  drawScene(ctx, trajectoryMomentum, '#60a5fa', cw, ch);
  ctx.restore();
}

function useCanvas(trajectoryVanilla, trajectoryMomentum) {
  const canvasRef = useRef(null);
  const trajVRef = useRef(trajectoryVanilla);
  const trajMRef = useRef(trajectoryMomentum);
  trajVRef.current = trajectoryVanilla;
  trajMRef.current = trajectoryMomentum;

  // ResizeObserver: resize backing store and redraw
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
      paintCanvas(canvas, trajVRef.current, trajMRef.current);
    });
    ro.observe(canvas);
    // Initial size
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

  // Redraw on trajectory changes
  useEffect(() => {
    paintCanvas(canvasRef.current, trajectoryVanilla, trajectoryMomentum);
  }, [trajectoryVanilla, trajectoryMomentum]);

  return canvasRef;
}

export const MomentumViz = forwardRef(function MomentumViz(props, ref) {
  const [alpha, setAlpha] = useState(0.09);
  const [beta, setBeta] = useState(0.9);
  const [running, setRunning] = useState(false);

  const vanillaRef = useRef({ w: [1.5, 1.5], traj: [[1.5, 1.5]] });
  const momentumRef = useRef({ w: [1.5, 1.5], v: [0, 0], traj: [[1.5, 1.5]] });
  const rafRef = useRef(null);

  const [trajV, setTrajV] = useState([[1.5, 1.5]]);
  const [trajM, setTrajM] = useState([[1.5, 1.5]]);

  const canvasRef = useCanvas(trajV, trajM);

  const step = useCallback(() => {
    const vs = vanillaRef.current;
    const ms = momentumRef.current;

    if (vs.traj.length >= MAX_STEPS && ms.traj.length >= MAX_STEPS) {
      setRunning(false);
      return;
    }

    // Vanilla step
    if (vs.traj.length < MAX_STEPS) {
      const [w1, w2] = vs.w;
      const [g1, g2] = grad(w1, w2);
      vs.w = [w1 - alpha * g1, w2 - alpha * g2];
      vs.traj = [...vs.traj, [...vs.w]];
    }

    // Momentum step
    if (ms.traj.length < MAX_STEPS) {
      const [w1, w2] = ms.w;
      const [g1, g2] = grad(w1, w2);
      ms.v = [beta * ms.v[0] + g1, beta * ms.v[1] + g2];
      ms.w = [w1 - alpha * ms.v[0], w2 - alpha * ms.v[1]];
      ms.traj = [...ms.traj, [...ms.w]];
    }

    setTrajV([...vs.traj]);
    setTrajM([...ms.traj]);
  }, [alpha, beta]);

  const doStep = useCallback(() => {
    step();
  }, [step]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const vs = vanillaRef.current;
      const ms = momentumRef.current;
      if (vs.traj.length >= MAX_STEPS && ms.traj.length >= MAX_STEPS) {
        setRunning(false);
        clearInterval(id);
        return;
      }
      // single step per tick
      if (vs.traj.length < MAX_STEPS) {
        const [w1, w2] = vs.w;
        const [g1, g2] = grad(w1, w2);
        vs.w = [w1 - alpha * g1, w2 - alpha * g2];
        vs.traj = [...vs.traj, [...vs.w]];
      }
      if (ms.traj.length < MAX_STEPS) {
        const [w1, w2] = ms.w;
        const [g1, g2] = grad(w1, w2);
        ms.v = [beta * ms.v[0] + g1, beta * ms.v[1] + g2];
        ms.w = [w1 - alpha * ms.v[0], w2 - alpha * ms.v[1]];
        ms.traj = [...ms.traj, [...ms.w]];
      }
      setTrajV([...vs.traj]);
      setTrajM([...ms.traj]);
    }, 80);
    return () => clearInterval(id);
  }, [running, alpha, beta]);

  const reset = useCallback(() => {
    setRunning(false);
    vanillaRef.current = { w: [1.5, 1.5], traj: [[1.5, 1.5]] };
    momentumRef.current = { w: [1.5, 1.5], v: [0, 0], traj: [[1.5, 1.5]] };
    setTrajV([[1.5, 1.5]]);
    setTrajM([[1.5, 1.5]]);
  }, []);

  useImperativeHandle(ref, () => ({
    play: () => setRunning(true),
    pause: () => setRunning(false),
    reset,
    step: doStep,
  }), [reset, doStep])

  const vLoss = loss(...vanillaRef.current.w);
  const mLoss = loss(...momentumRef.current.w);
  const vSteps = trajV.length - 1;
  const mSteps = trajM.length - 1;

  const sliderStyle = {
    accentColor: 'var(--prime)',
    width: '100%',
    cursor: 'pointer',
  };

  const btnStyle = (active) => ({
    padding: '0.35rem 0.9rem',
    borderRadius: '0.4rem',
    border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
    background: active ? 'var(--prime)' : 'var(--depth)',
    color: active ? '#000' : 'var(--ink-mid)',
    fontFamily: 'var(--font-sans)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
  });

  return (
    <div style={{
      fontFamily: 'var(--font-sans)',
      color: 'var(--ink-hi)',
      padding: '1.5rem',
      background: 'var(--surface)',
      borderRadius: '0.75rem',
      border: '1px solid var(--rim)',
      maxWidth: '620px',
    }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>
        Momentum vs Vanilla GD
      </h3>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', display: 'block', marginBottom: '0.25rem' }}>
            Learning rate α = <span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>{alpha.toFixed(3)}</span>
          </label>
          <input
            type="range" min="0.01" max="0.18" step="0.005"
            value={alpha}
            onChange={(e) => { setAlpha(+e.target.value); reset(); }}
            style={sliderStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', display: 'block', marginBottom: '0.25rem' }}>
            Momentum β = <span style={{ color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{beta.toFixed(2)}</span>
          </label>
          <input
            type="range" min="0.5" max="0.99" step="0.01"
            value={beta}
            onChange={(e) => { setBeta(+e.target.value); reset(); }}
            style={sliderStyle}
          />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button style={btnStyle(false)} onClick={doStep} disabled={running}>Step</button>
        <button style={btnStyle(running)} onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Run'}
        </button>
        <button style={btnStyle(false)} onClick={reset}>Reset</button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '260px',
          borderRadius: '0.4rem',
          border: '1px solid var(--rim)',
          display: 'block',
        }}
      />

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginTop: '0.75rem',
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)',
      }}>
        <div style={{ padding: '0.5rem', background: 'var(--depth)', borderRadius: '0.4rem', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ color: '#f59e0b', fontWeight: 600 }}>Vanilla GD</div>
          <div style={{ color: 'var(--ink-mid)', marginTop: '0.2rem' }}>
            Steps: {vSteps} &nbsp;|&nbsp; L = {vLoss.toFixed(4)}
          </div>
        </div>
        <div style={{ padding: '0.5rem', background: 'var(--depth)', borderRadius: '0.4rem', borderLeft: '3px solid #60a5fa' }}>
          <div style={{ color: '#60a5fa', fontWeight: 600 }}>GD + Momentum</div>
          <div style={{ color: 'var(--ink-mid)', marginTop: '0.2rem' }}>
            Steps: {mSteps} &nbsp;|&nbsp; L = {mLoss.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--ink-low)' }}>
        <span><span style={{ color: '#22c55e' }}>★</span> Global minimum (0, 0)</span>
        <span>Dashed ellipses = loss contours</span>
      </div>

      {/* Note */}
      <p style={{
        marginTop: '1rem',
        fontSize: '0.72rem',
        color: 'var(--ink-low)',
        lineHeight: 1.6,
        borderTop: '1px solid var(--rim)',
        paddingTop: '0.75rem',
      }}>
        {`On this elongated landscape (condition number = 10), vanilla GD oscillates. Momentum builds up velocity in the consistent w1 direction and damps oscillations in w2.`}
      </p>
    </div>
  );
})
