import { useState, useRef, useEffect } from 'react';

const T = 100;

function computeSchedules(alpha0, warmupSteps) {
  const alphaMin = 0;
  const stepSize = T / 4;
  const gamma = 0.5;

  const constant = [];
  const stepDecay = [];
  const cosine = [];
  const warmupCosine = [];

  for (let t = 0; t < T; t++) {
    // Constant
    constant.push(alpha0);

    // Step decay
    stepDecay.push(alpha0 * Math.pow(gamma, Math.floor(t / stepSize)));

    // Cosine annealing
    cosine.push(alphaMin + 0.5 * (alpha0 - alphaMin) * (1 + Math.cos(Math.PI * t / (T - 1))));

    // Warmup + cosine
    let wc;
    if (t < warmupSteps) {
      wc = warmupSteps > 0 ? alpha0 * (t / warmupSteps) : alpha0;
    } else {
      const remaining = T - 1 - warmupSteps;
      const tCos = t - warmupSteps;
      wc = remaining > 0
        ? alphaMin + 0.5 * (alpha0 - alphaMin) * (1 + Math.cos(Math.PI * tCos / remaining))
        : alphaMin;
    }
    warmupCosine.push(wc);
  }

  return { constant, stepDecay, cosine, warmupCosine };
}

const SCHEDULES = [
  { key: 'constant',     label: 'Constant',         color: '#f59e0b' },
  { key: 'stepDecay',    label: 'Step Decay',        color: '#60a5fa' },
  { key: 'cosine',       label: 'Cosine Annealing',  color: '#2dd4bf' },
  { key: 'warmupCosine', label: 'Warmup + Cosine',   color: '#f87171' },
];

function drawChart(canvas, schedules, alpha0) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const pad = { top: 20, right: 20, bottom: 36, left: 46 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  const yMax = alpha0 * 1.1;
  const toX = (t) => pad.left + (t / (T - 1)) * cw;
  const toY = (v) => pad.top + (1 - v / yMax) * ch;

  // Grid lines
  ctx.save();
  ctx.strokeStyle = 'rgba(150,150,150,0.15)';
  ctx.lineWidth = 1;
  [0, 0.25, 0.5, 0.75, 1.0].forEach((f) => {
    const y = toY(f * yMax);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + cw, y);
    ctx.stroke();

    ctx.fillStyle = 'rgba(150,150,150,0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText((f * yMax).toFixed(2), pad.left - 6, y + 3);
  });
  // Vertical grid
  [0, 25, 50, 75, 99].forEach((t) => {
    const x = toX(t);
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + ch);
    ctx.stroke();

    ctx.fillStyle = 'rgba(150,150,150,0.6)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t === 99 ? T : t, x, pad.top + ch + 16);
  });
  ctx.restore();

  // Axes
  ctx.save();
  ctx.strokeStyle = 'rgba(200,200,200,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + ch);
  ctx.lineTo(pad.left + cw, pad.top + ch);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = 'rgba(150,150,150,0.8)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Training Step', pad.left + cw / 2, H - 4);
  ctx.save();
  ctx.translate(12, pad.top + ch / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('LR', 0, 0);
  ctx.restore();
  ctx.restore();

  // Lines
  SCHEDULES.forEach(({ key, color }) => {
    const vals = schedules[key];
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    vals.forEach((v, t) => {
      const x = toX(t);
      const y = toY(v);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  });
}

export function LRScheduleViz() {
  const [alpha0, setAlpha0] = useState(0.5);
  const [warmupPct, setWarmupPct] = useState(10); // percent of T
  const canvasRef = useRef(null);

  const warmupSteps = Math.round((warmupPct / 100) * T);
  const schedules = computeSchedules(alpha0, warmupSteps);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawChart(canvas, schedules, alpha0);
  }, [schedules, alpha0]);

  const sliderStyle = {
    accentColor: 'var(--prime)',
    width: '100%',
    cursor: 'pointer',
  };

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
        LR Schedule Comparison
      </h3>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', display: 'block', marginBottom: '0.25rem' }}>
            {`Base LR α₀ = `}<span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>{alpha0.toFixed(2)}</span>
          </label>
          <input
            type="range" min="0.1" max="1.0" step="0.05"
            value={alpha0}
            onChange={(e) => setAlpha0(+e.target.value)}
            style={sliderStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--ink-mid)', display: 'block', marginBottom: '0.25rem' }}>
            Warmup = <span style={{ color: '#f87171', fontFamily: 'var(--font-mono)' }}>{warmupSteps} steps ({warmupPct}%)</span>
          </label>
          <input
            type="range" min="0" max="30" step="1"
            value={warmupPct}
            onChange={(e) => setWarmupPct(+e.target.value)}
            style={sliderStyle}
          />
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={560}
        height={260}
        style={{
          width: '100%',
          borderRadius: '0.4rem',
          border: '1px solid var(--rim)',
          display: 'block',
        }}
      />

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginTop: '0.75rem',
      }}>
        {SCHEDULES.map(({ key, label, color }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '2px',
              background: color,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-mid)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Current values at step 50 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem',
        marginTop: '0.75rem',
      }}>
        {SCHEDULES.map(({ key, label, color }) => (
          <div key={key} style={{
            padding: '0.4rem 0.5rem',
            background: 'var(--depth)',
            borderRadius: '0.35rem',
            borderTop: `2px solid ${color}`,
            fontSize: '0.7rem',
          }}>
            <div style={{ color: 'var(--ink-low)', marginBottom: '0.15rem' }}>@ step 50</div>
            <div style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {schedules[key][50].toFixed(4)}
            </div>
          </div>
        ))}
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
        {`Warmup prevents large updates from unstable initial weights. Cosine annealing helps the optimizer settle into flat minima. Step decay is simple but creates discontinuities. Most modern Transformer training uses warmup + cosine.`}
      </p>
    </div>
  );
}
