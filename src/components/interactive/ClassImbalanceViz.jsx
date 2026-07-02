import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

// Simple LCG seeded at 42
function makeLCG(seed) {
  let s = seed;
  return function () {
    s = (1664525 * s + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Generate 100 hardcoded points
function generatePoints() {
  const rng = makeLCG(42);
  const pts = [];

  // 90 class-0 (majority) scattered in [0.05, 0.95]^2
  for (let i = 0; i < 90; i++) {
    const x = 0.05 + rng() * 0.90;
    const y = 0.05 + rng() * 0.90;
    pts.push({ x, y, cls: 0 });
  }

  // 10 class-1 (minority) clustered near (0.7, 0.7)
  for (let i = 0; i < 10; i++) {
    const x = 0.7 + (rng() - 0.5) * 0.16;
    const y = 0.7 + (rng() - 0.5) * 0.16;
    pts.push({ x, y, cls: 1 });
  }

  return pts;
}

// Generate synthetic SMOTE points near minority cluster
function generateSMOTE() {
  const rng = makeLCG(137);
  const pts = [];
  for (let i = 0; i < 80; i++) {
    const x = 0.7 + (rng() - 0.5) * 0.30;
    const y = 0.7 + (rng() - 0.5) * 0.30;
    pts.push({ x, y, cls: 1, synthetic: true });
  }
  return pts;
}

const POINTS = generatePoints();
const SMOTE_POINTS = generateSMOTE();

// Which majority indices to "remove" for undersampling (first 80 of class 0)
const REMOVED_MAJORITY = new Set(
  POINTS.reduce((acc, p, i) => { if (p.cls === 0) acc.push(i); return acc; }, []).slice(0, 80)
);

const MODES = ['Original', 'Undersampling', 'Oversampling (SMOTE)'];

const THRESHOLDS = {
  Original: 1.6,
  Undersampling: 1.35,
  'Oversampling (SMOTE)': 1.3,
};

const METRICS = {
  Original: { accuracy: 0.91, precision: 0.50, recall: 0.10, f1: 0.17 },
  Undersampling: { accuracy: 0.72, precision: 0.38, recall: 0.70, f1: 0.49 },
  'Oversampling (SMOTE)': { accuracy: 0.74, precision: 0.33, recall: 0.80, f1: 0.47 },
};

const CANVAS_W = 420;
const CANVAS_H = 280;

function drawCanvas(canvas, mode) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const style = getComputedStyle(document.documentElement);
  const prime = style.getPropertyValue('--prime').trim() || '#F59E0B';
  const depth = style.getPropertyValue('--depth').trim() || '#111827';
  const rim = style.getPropertyValue('--rim').trim() || '#374151';

  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = rim;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  const PAD = 16;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;

  const toX = (v) => PAD + v * plotW;
  const toY = (v) => PAD + (1 - v) * plotH;

  const T = THRESHOLDS[mode];

  // Background shading: x + y < T => blue side, > T => amber side
  // We scan columns (use physical canvas pixels since putImageData bypasses ctx transform)
  const physW = canvas.width;
  const physH = canvas.height;
  const imageData = ctx.createImageData(physW, physH);
  for (let px = 0; px < physW; px++) {
    for (let py = 0; py < physH; py++) {
      const nx = (px / dpr - PAD) / plotW;
      const ny = 1 - (py / dpr - PAD) / plotH;
      const idx = (py * physW + px) * 4;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) continue;
      if (nx + ny < T) {
        // blue side
        imageData.data[idx] = 59;
        imageData.data[idx + 1] = 130;
        imageData.data[idx + 2] = 246;
        imageData.data[idx + 3] = 20;
      } else {
        // amber side
        imageData.data[idx] = 245;
        imageData.data[idx + 1] = 158;
        imageData.data[idx + 2] = 11;
        imageData.data[idx + 3] = 20;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Decision boundary: x + y = T  =>  from (0, T) to (T, 0), clamped to [0,1]
  const bx1 = Math.max(0, T - 1);
  const by1 = Math.min(1, T);
  const bx2 = Math.min(1, T);
  const by2 = Math.max(0, T - 1);

  ctx.beginPath();
  ctx.moveTo(toX(bx1), toY(by1));
  ctx.lineTo(toX(bx2), toY(by2));
  ctx.strokeStyle = prime;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // SMOTE synthetic points (amber squares)
  if (mode === 'Oversampling (SMOTE)') {
    SMOTE_POINTS.forEach(({ x, y }) => {
      ctx.fillStyle = `rgba(245,158,11,0.55)`;
      ctx.strokeStyle = `rgba(245,158,11,0.3)`;
      ctx.lineWidth = 0.5;
      const cx = toX(x);
      const cy = toY(y);
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      ctx.strokeRect(cx - 4, cy - 4, 8, 8);
    });
  }

  // Original points
  POINTS.forEach(({ x, y, cls }, i) => {
    const isRemoved = mode === 'Undersampling' && REMOVED_MAJORITY.has(i);

    ctx.beginPath();
    ctx.arc(toX(x), toY(y), 6, 0, Math.PI * 2);

    if (isRemoved) {
      ctx.fillStyle = 'rgba(59,130,246,0.12)';
      ctx.strokeStyle = 'rgba(59,130,246,0.20)';
    } else if (cls === 0) {
      ctx.fillStyle = 'rgba(59,130,246,0.75)';
      ctx.strokeStyle = '#1D4ED8';
    } else {
      ctx.fillStyle = prime;
      ctx.strokeStyle = '#B45309';
    }

    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

export const ClassImbalanceViz = forwardRef(function ClassImbalanceViz(props, ref) {
  const [mode, setMode] = useState('Original');
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) drawCanvas(canvasRef.current, mode);
  }, [mode]);

  const metrics = METRICS[mode];

  const s = {
    wrapper: {
      fontFamily: `var(--font-sans, sans-serif)`,
      color: `var(--ink-hi)`,
      padding: '24px',
      background: `var(--depth)`,
      borderRadius: '12px',
      maxWidth: '700px',
    },
    heading: {
      fontSize: '18px',
      fontWeight: 700,
      color: `var(--prime)`,
      marginBottom: '4px',
    },
    subheading: {
      fontSize: '14px',
      color: `var(--ink-mid)`,
      marginBottom: '20px',
    },
    tabRow: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      flexWrap: 'wrap',
    },
    metricsRow: {
      display: 'flex',
      gap: '10px',
      marginTop: '16px',
      flexWrap: 'wrap',
    },
    metricBox: {
      flex: '1 1 80px',
      background: `var(--surface)`,
      border: `1px solid var(--rim)`,
      borderRadius: '8px',
      padding: '10px 14px',
      textAlign: 'center',
    },
    metricLabel: {
      fontSize: '11px',
      color: `var(--ink-low)`,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: '4px',
    },
    metricValue: {
      fontSize: '20px',
      fontWeight: 700,
      fontFamily: `var(--font-mono, monospace)`,
      color: `var(--prime)`,
    },
    note: {
      fontSize: '12px',
      color: `var(--ink-low)`,
      lineHeight: 1.6,
      background: `var(--surface)`,
      border: `1px solid var(--rim)`,
      borderRadius: '8px',
      padding: '12px 16px',
      marginTop: '16px',
    },
  };

  // Tab-driven component — "play" previously just cycled through the three
  // resampling modes (a tab toggle), which isn't a real animation. Expose nothing
  // so the shell renders no Play button.
  useImperativeHandle(ref, () => ({}), []);

  return (
    <div style={s.wrapper}>
      <div style={s.heading}>Class Imbalance</div>
      <div style={s.subheading}>90 majority vs 10 minority — how resampling shifts the decision boundary</div>

      <div style={s.tabRow}>
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: mode === m ? 700 : 400,
              border: `1px solid ${mode === m ? `var(--prime)` : `var(--rim)`}`,
              borderRadius: '6px',
              background: mode === m ? `var(--prime-faint)` : `var(--surface)`,
              color: mode === m ? `var(--prime)` : `var(--ink-mid)`,
              cursor: 'pointer',
              fontFamily: `var(--font-sans, sans-serif)`,
              transition: 'all 0.15s ease',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', borderRadius: '8px', maxWidth: '100%' }}
      />

      <div style={s.metricsRow}>
        {[
          { label: 'Accuracy', value: metrics.accuracy },
          { label: 'Precision', value: metrics.precision },
          { label: 'Recall', value: metrics.recall },
          { label: 'F1', value: metrics.f1 },
        ].map(({ label, value }) => (
          <div key={label} style={s.metricBox}>
            <div style={s.metricLabel}>{label}</div>
            <div style={s.metricValue}>{value.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div style={s.note}>
        Accuracy is useless on imbalanced data — a model predicting all 0s gets 90% accuracy here
        but 0 recall. Class 1 (fraud, disease, failure) is usually the important class. Resampling
        changes what the model learns, not the real-world distribution.
      </div>
    </div>
  );
})
