import { useState, useEffect, useRef } from 'react';

// LCG seeded RNG
function makeLCG(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// Generate 40 normal points around (0.5, 0.5) with spread ~0.12
function generateNormalPoints() {
  const rng = makeLCG(99);
  const pts = [];
  for (let i = 0; i < 40; i++) {
    // Box-Muller for gaussian-ish distribution
    const u1 = rng();
    const u2 = rng();
    const r = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * 0.12;
    const theta = 2 * Math.PI * u2;
    const x = Math.max(0.02, Math.min(0.98, 0.5 + r * Math.cos(theta)));
    const y = Math.max(0.02, Math.min(0.98, 0.5 + r * Math.sin(theta)));
    pts.push({ x, y, type: 'normal' });
  }
  return pts;
}

const NORMAL_POINTS = generateNormalPoints();

// 5 anomaly points
const ANOMALY_POINTS = [
  { x: 0.05, y: 0.90, type: 'anomaly' },
  { x: 0.95, y: 0.10, type: 'anomaly' },
  { x: 0.10, y: 0.05, type: 'anomaly' },
  { x: 0.90, y: 0.95, type: 'anomaly' },
  { x: 0.50, y: 0.05, type: 'anomaly' },
];

const ANOMALY_SCORES_LIST = [0.82, 0.88, 0.75, 0.91, 0.72];

// Assign anomaly scores to normal points, ascending by distance from center
function assignNormalScores() {
  const rng = makeLCG(77);
  return NORMAL_POINTS.map((p) => {
    const dist = Math.sqrt((p.x - 0.5) ** 2 + (p.y - 0.5) ** 2);
    // base score from distance, clamped and randomized
    const base = 0.12 + dist * 1.1 + (rng() - 0.5) * 0.08;
    return Math.max(0.12, Math.min(0.45, base));
  });
}

const NORMAL_SCORES = assignNormalScores();

// All 45 points with scores
const ALL_POINTS = [
  ...NORMAL_POINTS.map((p, i) => ({ ...p, score: NORMAL_SCORES[i] })),
  ...ANOMALY_POINTS.map((p, i) => ({ ...p, score: ANOMALY_SCORES_LIST[i] })),
];

// Hardcoded isolation splits (rectangles around most anomalous point: x=0.9,y=0.95, score 0.91)
// Each split is { x1, y1, x2, y2 } in [0,1] space
const ISOLATION_SPLITS = [
  { x1: 0.65, y1: 0.0, x2: 0.65, y2: 1.0 },   // vertical split isolating right side
  { x1: 0.65, y1: 0.72, x2: 1.0, y2: 0.72 },   // horizontal split in right region
  { x1: 0.80, y1: 0.72, x2: 0.80, y2: 1.0 },   // further vertical in top-right
  { x1: 0.80, y1: 0.88, x2: 1.0, y2: 0.88 },   // horizontal isolating top strip
];

const CANVAS_W = 420;
const CANVAS_H = 280;

function drawCanvas(canvas, threshold, showSplits) {
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
  const inkLow = style.getPropertyValue('--ink-low').trim() || '#6B7280';

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

  // Isolation splits
  if (showSplits) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(245,158,11,0.45)';
    ctx.lineWidth = 1.5;
    ISOLATION_SPLITS.forEach(({ x1, y1, x2, y2 }) => {
      ctx.beginPath();
      ctx.moveTo(toX(x1), toY(y1));
      ctx.lineTo(toX(x2), toY(y2));
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();

    // Highlight the isolated region with faint overlay
    ctx.save();
    ctx.fillStyle = 'rgba(255,107,107,0.08)';
    ctx.fillRect(toX(0.80), toY(1.0), toX(1.0) - toX(0.80), toY(0.88) - toY(1.0));
    ctx.restore();
  }

  // Draw all points
  ALL_POINTS.forEach(({ x, y, score }) => {
    const isAnomaly = score >= threshold;
    // size proportional to score: min 4px, max 10px
    const r = 4 + (score - 0.12) / (0.91 - 0.12) * 6;

    ctx.beginPath();
    ctx.arc(toX(x), toY(y), r, 0, Math.PI * 2);

    if (isAnomaly) {
      ctx.fillStyle = 'rgba(255,107,107,0.85)';
      ctx.strokeStyle = '#CC3333';
    } else {
      ctx.fillStyle = 'rgba(59,130,246,0.70)';
      ctx.strokeStyle = '#1D4ED8';
    }

    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Threshold legend
  ctx.fillStyle = inkLow;
  ctx.font = `10px var(--font-mono, monospace)`;
  ctx.fillText(`threshold = ${threshold.toFixed(2)}`, PAD + 2, PAD + 12);
}

export function AnomalyDetectionViz() {
  const [threshold, setThreshold] = useState(0.6);
  const [showSplits, setShowSplits] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) drawCanvas(canvasRef.current, threshold, showSplits);
  }, [threshold, showSplits]);

  const flagged = ALL_POINTS.filter((p) => p.score >= threshold);
  const trueAnomaliesDetected = ALL_POINTS
    .filter((p, i) => i >= 40 && p.score >= threshold).length;

  const s = {
    wrapper: {
      fontFamily: `var(--font-sans, sans-serif)`,
      color: `var(--ink-hi)`,
      padding: '24px',
      background: `var(--depth)`,
      borderRadius: '12px',
      maxWidth: '900px',
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
    mainRow: {
      display: 'flex',
      gap: '20px',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    },
    sidebar: {
      flex: '0 0 200px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    },
    conceptBox: {
      background: `var(--surface)`,
      border: `1px solid var(--rim)`,
      borderRadius: '8px',
      padding: '12px',
    },
    conceptTitle: {
      fontSize: '11px',
      fontWeight: 600,
      color: `var(--ink-mid)`,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: '8px',
    },
    splitLines: {
      display: 'flex',
      flexDirection: 'column',
      gap: '3px',
      marginBottom: '6px',
    },
    splitLine: {
      height: '2px',
      borderRadius: '1px',
    },
    conceptLabel: {
      fontSize: '11px',
      color: `var(--ink-low)`,
      lineHeight: 1.5,
    },
    controlRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '12px',
    },
    statsRow: {
      display: 'flex',
      gap: '12px',
      marginTop: '14px',
      flexWrap: 'wrap',
    },
    statBox: {
      background: `var(--surface)`,
      border: `1px solid var(--rim)`,
      borderRadius: '8px',
      padding: '10px 16px',
      fontSize: '13px',
      color: `var(--ink-mid)`,
    },
    statVal: {
      display: 'inline',
      fontWeight: 700,
      color: `var(--prime)`,
      fontFamily: `var(--font-mono, monospace)`,
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

  // Visual split count representations: normal needs many, anomaly needs few
  const normalSplitBars = [0.15, 0.30, 0.45, 0.60, 0.75, 0.90];
  const anomalySplitBars = [0.35, 0.70];

  return (
    <div style={s.wrapper}>
      <div style={s.heading}>Isolation Forest</div>
      <div style={s.subheading}>Anomalies are isolated faster — they need fewer random splits</div>

      <div style={s.controlRow}>
        <span style={{ fontSize: '13px', color: `var(--ink-mid)` }}>Threshold:</span>
        <input
          type="range"
          min={0.3}
          max={0.9}
          step={0.01}
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          style={{ accentColor: `var(--prime)`, cursor: 'pointer', flex: 1, maxWidth: '200px' }}
        />
        <span style={{
          fontFamily: `var(--font-mono, monospace)`,
          fontSize: '14px',
          fontWeight: 700,
          color: `var(--prime)`,
          minWidth: '36px',
        }}>{threshold.toFixed(2)}</span>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: `var(--ink-mid)`,
          cursor: 'pointer',
          marginLeft: '16px',
        }}>
          <input
            type="checkbox"
            checked={showSplits}
            onChange={(e) => setShowSplits(e.target.checked)}
            style={{ accentColor: `var(--prime)`, cursor: 'pointer' }}
          />
          Show isolation splits
        </label>
      </div>

      <div style={s.mainRow}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', borderRadius: '8px', flexShrink: 0, maxWidth: '100%' }}
        />

        <div style={s.sidebar}>
          <div style={s.conceptBox}>
            <div style={s.conceptTitle}>Normal point</div>
            <div style={s.splitLines}>
              {normalSplitBars.map((w, i) => (
                <div key={i} style={{
                  ...s.splitLine,
                  width: `${w * 100}%`,
                  background: `rgba(59,130,246,${0.3 + i * 0.1})`,
                }} />
              ))}
            </div>
            <div style={s.conceptLabel}>
              Many splits needed<br />
              Deep tree<br />
              <span style={{ color: `var(--prime)` }}>Low anomaly score</span>
            </div>
          </div>

          <div style={s.conceptBox}>
            <div style={s.conceptTitle}>Anomaly</div>
            <div style={s.splitLines}>
              {anomalySplitBars.map((w, i) => (
                <div key={i} style={{
                  ...s.splitLine,
                  width: `${w * 100}%`,
                  background: `rgba(255,107,107,${0.5 + i * 0.25})`,
                }} />
              ))}
            </div>
            <div style={s.conceptLabel}>
              Few splits needed<br />
              Shallow tree<br />
              <span style={{ color: '#FF6B6B' }}>High anomaly score</span>
            </div>
          </div>

          <div style={{
            fontSize: '11px',
            color: `var(--ink-ghost, #374151)`,
            lineHeight: 1.5,
            padding: '8px',
          }}>
            <span style={{ color: '#3B82F6' }}>●</span> score &lt; threshold: normal<br />
            <span style={{ color: '#FF6B6B' }}>●</span> score ≥ threshold: anomaly<br />
            Circle size ∝ anomaly score
          </div>
        </div>
      </div>

      <div style={s.statsRow}>
        <div style={s.statBox}>
          Flagged as anomaly:{` `}
          <span style={s.statVal}>{flagged.length} pts</span>
          {` `}({(flagged.length / 45 * 100).toFixed(1)}%)
        </div>
        <div style={s.statBox}>
          True anomalies detected:{` `}
          <span style={s.statVal}>{trueAnomaliesDetected}/5</span>
        </div>
      </div>

      <div style={s.note}>
        {`Isolation Forest doesn't model what 'normal' looks like — it just finds points that are easy to isolate. This makes it fast and effective for high-dimensional data without assumptions about the distribution.`}
      </div>
    </div>
  );
}
