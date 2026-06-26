import { useState, useEffect, useRef } from 'react';

// Hardcoded dataset: 12 points [x, y, class]
// class 0 = A (blue), class 1 = B (amber)
const DATASET = [
  [0.18, 0.72, 0], [0.25, 0.55, 0], [0.12, 0.40, 0], [0.30, 0.80, 0], [0.22, 0.62, 0], [0.15, 0.30, 0],
  [0.72, 0.25, 1], [0.80, 0.18, 1], [0.65, 0.35, 1], [0.78, 0.30, 1], [0.85, 0.22, 1], [0.70, 0.12, 1],
];

// Bootstrap samples per tree: indices into DATASET (with replacement)
const TREE_SAMPLES = [
  [0, 1, 1, 3, 4, 6, 7, 8, 10, 11, 11, 6],
  [0, 2, 3, 3, 5, 6, 7, 9, 9, 10, 11, 0],
  [1, 2, 2, 4, 5, 6, 8, 8, 9, 10, 11, 7],
  [0, 1, 3, 4, 4, 6, 7, 7, 9, 10, 11, 5],
  [0, 2, 3, 5, 5, 6, 8, 9, 10, 10, 11, 1],
  [1, 2, 4, 4, 5, 6, 7, 9, 9, 11, 0, 8],
  [0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 11, 4],
];

// Decision boundary per tree: line from (x1,y1) to (x2,y2) in [0,1] space
// "above-left of line = class A, below-right = class B"
const TREE_BOUNDARIES = [
  { x1: 0.45, y1: 1.0, x2: 1.0, y2: 0.45 },
  { x1: 0.42, y1: 1.0, x2: 1.0, y2: 0.42 },
  { x1: 0.50, y1: 1.0, x2: 1.0, y2: 0.50 },
  { x1: 0.44, y1: 1.0, x2: 1.0, y2: 0.44 },
  { x1: 0.48, y1: 1.0, x2: 1.0, y2: 0.48 },
  { x1: 0.41, y1: 1.0, x2: 1.0, y2: 0.41 },
  { x1: 0.46, y1: 1.0, x2: 1.0, y2: 0.46 },
];

// Ensemble boundaries per tree count (1,3,5,7)
const ENSEMBLE_BOUNDARIES = {
  1: { x1: 0.45, y1: 1.0, x2: 1.0, y2: 0.45 },
  3: { x1: 0.455, y1: 1.0, x2: 1.0, y2: 0.455 },
  5: { x1: 0.462, y1: 1.0, x2: 1.0, y2: 0.462 },
  7: { x1: 0.465, y1: 1.0, x2: 1.0, y2: 0.465 },
};

const TREE_COUNTS = [1, 3, 5, 7];

const FEATURES = [
  { name: `x₁ (age)`, importance: 0.38 },
  { name: `x₂ (income)`, importance: 0.27 },
  { name: `x₃ (tenure)`, importance: 0.18 },
  { name: `x₄ (clicks)`, importance: 0.12 },
  { name: `x₅ (region)`, importance: 0.05 },
];

function drawTreeCanvas(canvas, treeIndex, nTrees) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const style = getComputedStyle(document.documentElement);
  const prime = style.getPropertyValue('--prime').trim() || '#F59E0B';
  const depth = style.getPropertyValue('--depth').trim() || '#111827';
  const rim = style.getPropertyValue('--rim').trim() || '#374151';
  const inkLow = style.getPropertyValue('--ink-low').trim() || '#6B7280';
  const inkHi = style.getPropertyValue('--ink-hi').trim() || '#F9FAFB';

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  const PAD = 10;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;

  const toX = (v) => PAD + v * plotW;
  const toY = (v) => PAD + (1 - v) * plotH;

  const bnd = TREE_BOUNDARIES[treeIndex];

  // Background regions
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(PAD, PAD);
  ctx.lineTo(toX(bnd.x1), toY(1.0));
  ctx.lineTo(toX(bnd.x2), toY(bnd.y2));
  ctx.lineTo(toX(1.0), toY(0.0));
  ctx.lineTo(PAD, toY(0.0));
  ctx.closePath();
  ctx.fillStyle = 'rgba(59,130,246,0.07)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(toX(bnd.x1), toY(1.0));
  ctx.lineTo(toX(1.0), toY(1.0));
  ctx.lineTo(toX(1.0), toY(bnd.y2));
  ctx.lineTo(toX(bnd.x2), toY(bnd.y2));
  ctx.closePath();
  ctx.fillStyle = 'rgba(245,158,11,0.07)';
  ctx.fill();
  ctx.restore();

  // Decision boundary
  ctx.beginPath();
  ctx.moveTo(toX(bnd.x1), toY(1.0));
  ctx.lineTo(toX(bnd.x2), toY(bnd.y2));
  ctx.strokeStyle = prime;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Bootstrap sample points
  const indices = TREE_SAMPLES[treeIndex];
  const countMap = {};
  indices.forEach((idx) => { countMap[idx] = (countMap[idx] || 0) + 1; });

  Object.entries(countMap).forEach(([idxStr, count]) => {
    const idx = parseInt(idxStr);
    const [px, py, cls] = DATASET[idx];
    const offsets = count === 1
      ? [[0, 0]]
      : [[-3, -2], [3, 2], [0, -3], [0, 3]].slice(0, count);

    offsets.forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(toX(px) + ox, toY(py) + oy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = cls === 0 ? '#3B82F6' : prime;
      ctx.fill();
    });
  });

  // Label
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.fillText(`T${treeIndex + 1}`, PAD + 2, PAD + 10);
}

function drawEnsembleCanvas(canvas, nTrees) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const style = getComputedStyle(document.documentElement);
  const prime = style.getPropertyValue('--prime').trim() || '#F59E0B';
  const depth = style.getPropertyValue('--depth').trim() || '#111827';
  const rim = style.getPropertyValue('--rim').trim() || '#374151';
  const inkLow = style.getPropertyValue('--ink-low').trim() || '#6B7280';

  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = prime;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);

  const PAD = 14;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;

  const toX = (v) => PAD + v * plotW;
  const toY = (v) => PAD + (1 - v) * plotH;

  const bnd = ENSEMBLE_BOUNDARIES[nTrees];

  // Background regions
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(PAD, PAD);
  ctx.lineTo(toX(bnd.x1), toY(1.0));
  ctx.lineTo(toX(bnd.x2), toY(bnd.y2));
  ctx.lineTo(toX(1.0), toY(0.0));
  ctx.lineTo(PAD, toY(0.0));
  ctx.closePath();
  ctx.fillStyle = 'rgba(59,130,246,0.10)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(toX(bnd.x1), toY(1.0));
  ctx.lineTo(toX(1.0), toY(1.0));
  ctx.lineTo(toX(1.0), toY(bnd.y2));
  ctx.lineTo(toX(bnd.x2), toY(bnd.y2));
  ctx.closePath();
  ctx.fillStyle = 'rgba(245,158,11,0.10)';
  ctx.fill();
  ctx.restore();

  // Boundary
  ctx.beginPath();
  ctx.moveTo(toX(bnd.x1), toY(1.0));
  ctx.lineTo(toX(bnd.x2), toY(bnd.y2));
  ctx.strokeStyle = prime;
  ctx.lineWidth = 2;
  ctx.stroke();

  // All 12 original points
  DATASET.forEach(([px, py, cls]) => {
    ctx.beginPath();
    ctx.arc(toX(px), toY(py), 5, 0, Math.PI * 2);
    ctx.fillStyle = cls === 0 ? '#3B82F6' : prime;
    ctx.fill();
    ctx.strokeStyle = cls === 0 ? '#1D4ED8' : '#B45309';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.fillText(`Ensemble (${nTrees} trees)`, PAD + 2, PAD + 10);
}

export function RandomForestViz() {
  const [nTrees, setNTrees] = useState(3);
  const treeCanvasRefs = useRef([]);
  const ensembleCanvasRef = useRef(null);

  // Ensure refs array has enough entries
  if (treeCanvasRefs.current.length !== 7) {
    treeCanvasRefs.current = Array(7).fill(null);
  }

  useEffect(() => {
    for (let i = 0; i < nTrees; i++) {
      const canvas = treeCanvasRefs.current[i];
      if (canvas) drawTreeCanvas(canvas, i, nTrees);
    }
    if (ensembleCanvasRef.current) drawEnsembleCanvas(ensembleCanvasRef.current, nTrees);
  }, [nTrees]);

  const style = {
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
    sectionLabel: {
      fontSize: '13px',
      fontWeight: 600,
      color: `var(--ink-mid)`,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginBottom: '12px',
    },
    sliderRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
    },
    slider: {
      accentColor: `var(--prime)`,
      cursor: 'pointer',
    },
    canvasRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      alignItems: 'flex-end',
      marginBottom: '24px',
    },
    canvasLabel: {
      fontSize: '11px',
      color: `var(--ink-low)`,
      textAlign: 'center',
      marginTop: '4px',
    },
    divider: {
      borderColor: `var(--rim)`,
      margin: '24px 0',
    },
    barRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px',
    },
    featureName: {
      fontSize: '13px',
      color: `var(--ink-mid)`,
      fontFamily: `var(--font-mono, monospace)`,
      width: '110px',
      flexShrink: 0,
    },
    barTrack: {
      flex: 1,
      height: '18px',
      background: `var(--surface)`,
      borderRadius: '4px',
      overflow: 'hidden',
      border: `1px solid var(--rim)`,
    },
    barValue: {
      fontSize: '12px',
      color: `var(--prime)`,
      width: '40px',
      textAlign: 'right',
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

  return (
    <div style={style.wrapper}>
      <div style={style.heading}>Random Forest</div>
      <div style={style.subheading}>Bootstrap aggregation + feature randomness = variance reduction</div>

      {/* Section 1: Bagging */}
      <div style={style.sectionLabel}>Bagging visualization</div>

      <div style={style.sliderRow}>
        <span style={{ fontSize: '13px', color: `var(--ink-mid)` }}>Trees:</span>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={TREE_COUNTS.indexOf(nTrees)}
          onChange={(e) => setNTrees(TREE_COUNTS[parseInt(e.target.value)])}
          style={style.slider}
        />
        <span style={{
          fontSize: '14px',
          fontWeight: 700,
          color: `var(--prime)`,
          fontFamily: `var(--font-mono, monospace)`,
          minWidth: '16px',
        }}>{nTrees}</span>
      </div>

      <div style={style.canvasRow}>
        {Array.from({ length: nTrees }, (_, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <canvas
              ref={(el) => { treeCanvasRefs.current[i] = el; }}
              width={120}
              height={100}
              style={{ display: 'block', borderRadius: '6px' }}
            />
            <div style={style.canvasLabel}>Tree {i + 1}</div>
          </div>
        ))}

        <div style={{ textAlign: 'center', marginLeft: nTrees > 0 ? '12px' : 0 }}>
          <canvas
            ref={ensembleCanvasRef}
            width={200}
            height={160}
            style={{ display: 'block', borderRadius: '6px' }}
          />
          <div style={{ ...style.canvasLabel, color: `var(--prime)` }}>
            Ensemble
          </div>
        </div>
      </div>

      <hr style={style.divider} />

      {/* Section 2: Feature importance */}
      <div style={style.sectionLabel}>Feature importance</div>

      {FEATURES.map((f) => (
        <div key={f.name} style={style.barRow}>
          <div style={style.featureName}>{f.name}</div>
          <div style={style.barTrack}>
            <div style={{
              width: `${f.importance * 100}%`,
              height: '100%',
              background: `var(--prime)`,
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={style.barValue}>{(f.importance * 100).toFixed(0)}%</div>
        </div>
      ))}

      <div style={style.note}>
        Each tree sees a random subset of features at each split — this decorrelates the trees so
        their errors cancel rather than compound. Feature importance = average impurity reduction
        across all splits in all trees.
      </div>
    </div>
  );
}
