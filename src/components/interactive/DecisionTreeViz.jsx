import React, { useRef, useEffect, useState, useMemo, useCallback, useImperativeHandle, forwardRef } from "react";

// ── Seeded RNG ────────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Dataset (seed-parameterized so reseed shows instability) ──────────────────
function generatePoints(seed) {
  const rng = mulberry32(seed);
  const pts = [];
  // Class 0: mostly lower-left
  for (let i = 0; i < 20; i++) {
    const x = rng() * 0.5 + rng() * 0.15;
    const y = rng() * 0.5 + rng() * 0.15;
    pts.push({ x: Math.min(Math.max(x, 0.02), 0.98), y: Math.min(Math.max(y, 0.02), 0.98), cls: 0 });
  }
  // Class 1: mostly upper-right
  for (let i = 0; i < 20; i++) {
    const x = 0.5 + rng() * 0.5 - rng() * 0.15;
    const y = 0.5 + rng() * 0.5 - rng() * 0.15;
    pts.push({ x: Math.min(Math.max(x, 0.02), 0.98), y: Math.min(Math.max(y, 0.02), 0.98), cls: 1 });
  }
  // 8 noisy overlapping points in the ambiguous middle zone (seed-dependent)
  for (let i = 0; i < 8; i++) {
    pts.push({
      x: Math.min(Math.max(0.3 + rng() * 0.4, 0.02), 0.98),
      y: Math.min(Math.max(0.3 + rng() * 0.4, 0.02), 0.98),
      cls: rng() > 0.5 ? 1 : 0,
    });
  }
  return pts;
}

const SEEDS = [42, 0xABCDEF, 0x13579BD, 0xFEDCBA];

// ── Real decision tree (greedy Gini) ──────────────────────────────────────────
function gini(pts) {
  if (!pts.length) return 0;
  const n1 = pts.filter(p => p.cls === 1).length;
  const p1 = n1 / pts.length, p0 = 1 - p1;
  return 1 - p0 * p0 - p1 * p1;
}

function buildTree(pts, maxDepth, depth = 0) {
  const n1 = pts.filter(p => p.cls === 1).length;
  const majority = n1 >= pts.length / 2 ? 1 : 0;
  if (pts.length <= 2 || depth >= maxDepth) return { leaf: true, cls: majority };

  let bestGain = -1, bestAxis = 'x', bestThreshold = 0.5;
  const parentG = gini(pts);

  for (const axis of ['x', 'y']) {
    const vals = [...new Set(pts.map(p => p[axis]))].sort((a, b) => a - b);
    for (let i = 0; i < vals.length - 1; i++) {
      const thr = (vals[i] + vals[i + 1]) / 2;
      const left = pts.filter(p => p[axis] < thr);
      const right = pts.filter(p => p[axis] >= thr);
      if (!left.length || !right.length) continue;
      const gain = parentG - (left.length * gini(left) + right.length * gini(right)) / pts.length;
      if (gain > bestGain) { bestGain = gain; bestAxis = axis; bestThreshold = thr; }
    }
  }

  if (bestGain <= 0) return { leaf: true, cls: majority };
  const left = pts.filter(p => p[bestAxis] < bestThreshold);
  const right = pts.filter(p => p[bestAxis] >= bestThreshold);
  return {
    leaf: false, axis: bestAxis, threshold: bestThreshold,
    left: buildTree(left, maxDepth, depth + 1),
    right: buildTree(right, maxDepth, depth + 1),
  };
}

function predictTree(tree, px, py) {
  if (tree.leaf) return tree.cls;
  return (tree.axis === 'x' ? px < tree.threshold : py < tree.threshold)
    ? predictTree(tree.left, px, py)
    : predictTree(tree.right, px, py);
}

// Collect split line segments, clipped to bounding boxes (so splits only draw
// in their region — no line segments bleeding across sibling partitions)
function collectSplits(tree, box = { x0: 0, x1: 1, y0: 0, y1: 1 }) {
  if (!tree || tree.leaf) return [];
  const { axis, threshold: thr } = tree;
  if (axis === 'x') return [
    { x1: thr, y1: box.y0, x2: thr, y2: box.y1 },
    ...collectSplits(tree.left,  { ...box, x1: thr }),
    ...collectSplits(tree.right, { ...box, x0: thr }),
  ];
  return [
    { x1: box.x0, y1: thr, x2: box.x1, y2: thr },
    ...collectSplits(tree.left,  { ...box, y1: thr }),
    ...collectSplits(tree.right, { ...box, y0: thr }),
  ];
}

function computeAccuracy(pts, tree) {
  const correct = pts.filter(p => predictTree(tree, p.x, p.y) === p.cls).length;
  return Math.round((correct / pts.length) * 100);
}

function getRootSplitGini(pts, tree) {
  if (!tree || tree.leaf) return null;
  const { axis, threshold: thr } = tree;
  const left  = pts.filter(p => axis === 'x' ? p.x < thr : p.y < thr);
  const right = pts.filter(p => axis === 'x' ? p.x >= thr : p.y >= thr);
  const gP = gini(pts), gL = gini(left), gR = gini(right);
  const gain = gP - (left.length * gL + right.length * gR) / pts.length;
  return { axis, thr, gP, gL, gR, gain, nLeft: left.length, nRight: right.length };
}

// ── Canvas draw ───────────────────────────────────────────────────────────────
function drawScene(canvas, points, tree, splits) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  if (W === 0 || H === 0) return;

  const PAD = 20;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;
  function toCanvas(x, y) { return [PAD + x * plotW, PAD + (1 - y) * plotH]; }

  ctx.clearRect(0, 0, W, H);

  // Background decision regions
  const cellSize = 6;
  for (let gx = 0; gx < plotW; gx += cellSize) {
    for (let gy = 0; gy < plotH; gy += cellSize) {
      const pred = predictTree(tree, gx / plotW, 1 - gy / plotH);
      ctx.fillStyle = pred === 1 ? 'rgba(240,165,0,0.07)' : 'rgba(80,130,220,0.07)';
      ctx.fillRect(PAD + gx, PAD + gy, cellSize, cellSize);
    }
  }

  // Split lines (clipped to each region by collectSplits)
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = 'rgba(220,220,220,0.7)';
  ctx.lineWidth = 1.5;
  for (const s of splits) {
    const [x1, y1] = toCanvas(s.x1, s.y1);
    const [x2, y2] = toCanvas(s.x2, s.y2);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();

  // Data points
  for (const p of points) {
    const [cx, cy] = toCanvas(p.x, p.y);
    const misclassified = predictTree(tree, p.x, p.y) !== p.cls;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = p.cls === 1 ? '#F0A500' : '#5080DC';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (misclassified) {
      ctx.save();
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 1.5;
      const d = 5;
      ctx.beginPath();
      ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d);
      ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Axis labels
  ctx.fillStyle = 'rgba(180,180,180,0.6)';
  ctx.font = '10px var(--font-sans, sans-serif)';
  ctx.fillText('x', W - 12, H - 6);
  ctx.fillText('y', 4, 14);
}

// ── Component ─────────────────────────────────────────────────────────────────
export const DecisionTreeViz = forwardRef(function DecisionTreeViz(props, ref) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const depthRef = useRef(2);

  const [depth, setDepth] = useState(2);
  const [seedIdx, setSeedIdx] = useState(0);

  const points   = useMemo(() => generatePoints(SEEDS[seedIdx]), [seedIdx]);
  const tree     = useMemo(() => buildTree(points, depth), [points, depth]);
  const splits   = useMemo(() => collectSplits(tree), [tree]);
  const accuracy = useMemo(() => computeAccuracy(points, tree), [points, tree]);
  const giniInfo = useMemo(() => getRootSplitGini(points, tree), [points, tree]);

  useEffect(() => { depthRef.current = depth; }, [depth]);

  // ResizeObserver: resize canvas and redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const size = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.getContext('2d').scale(dpr, dpr);
    };
    const observer = new ResizeObserver(() => { size(); drawScene(canvas, points, tree, splits); });
    observer.observe(container);
    size();
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw whenever data changes
  useEffect(() => {
    drawScene(canvasRef.current, points, tree, splits);
  }, [points, tree, splits]);

  const play = useCallback(() => {
    if (animRef.current) return;
    let lastTime = 0;
    const tick = (time) => {
      if (depthRef.current >= 4) { animRef.current = null; return; }
      if (time - lastTime >= 800) { lastTime = time; setDepth(d => d + 1); }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const pause = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
  }, []);

  const reset = useCallback(() => { pause(); setDepth(1); setSeedIdx(0); }, [pause]);
  const step  = useCallback(() => { pause(); setDepth(d => Math.min(d + 1, 4)); }, [pause]);

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step]);

  const depthNote = depth <= 2
    ? 'Underfitting — misses patterns in the data'
    : depth === 3 ? 'Good balance'
    : 'Overfitting — splits memorize noise';

  return (
    <div ref={containerRef} style={{ fontFamily: 'var(--font-sans, sans-serif)', color: 'var(--ink-hi, #eee)' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', borderRadius: 6, border: '1px solid var(--rim, #333)', background: 'var(--depth, #111)' }}
      />

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: 'var(--ink-mid, #aaa)' }}>
          Tree depth:
          <input
            type="range" min={1} max={4} step={1} value={depth}
            onChange={e => setDepth(Number(e.target.value))}
            style={{ marginLeft: 8, accentColor: 'var(--prime, #F0A500)', verticalAlign: 'middle' }}
          />
        </label>
        <span style={{ fontSize: 13, color: 'var(--prime, #F0A500)', fontWeight: 600 }}>
          Depth {depth}: {accuracy}% training accuracy
        </span>
        <button
          onClick={() => setSeedIdx(i => (i + 1) % SEEDS.length)}
          style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 12,
            border: '1px solid var(--rim,#333)', background: 'var(--depth,#111)',
            color: seedIdx > 0 ? '#22d3ee' : 'var(--prime,#F0A500)',
            cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-mono,monospace)',
          }}
        >
          🎲 Reseed ({seedIdx + 1}/{SEEDS.length})
        </button>
      </div>

      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-mid, #aaa)', fontStyle: 'italic' }}>
        {depthNote}
      </div>

      {seedIdx > 0 && (
        <div style={{
          marginTop: 6, fontSize: 11, color: '#22d3ee', lineHeight: 1.5,
          padding: '6px 10px', background: 'rgba(34,211,238,0.05)',
          borderRadius: 4, border: '1px solid rgba(34,211,238,0.15)',
        }}>
          <strong>Instability demo:</strong> same depth={depth}, different training sample → the tree splits are completely different. Deep trees are highly sensitive to which data points they see — tiny perturbations cause dramatically different partitions. This is exactly why Random Forest trains T trees on different bootstrap samples and averages: individual variance cancels out.
        </div>
      )}

      <p style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-low, #888)', lineHeight: 1.5 }}>
        Tree uses real greedy Gini splits on this dataset. Each split picks the axis+threshold maximizing information gain ΔG. Deeper trees fit training data better but generalize worse.
      </p>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-ghost, #555)', display: 'flex', gap: 16 }}>
        <span style={{ color: '#F0A500' }}>● Class 1</span>
        <span style={{ color: '#5080DC' }}>● Class 0</span>
        <span style={{ color: '#ff4444' }}>✕ Misclassified</span>
      </div>

      {/* Gini impurity panel — updates live with real computed splits */}
      {giniInfo && (
        <div style={{
          marginTop: 10, background: 'var(--depth,#111)', border: '1px solid var(--rim,#333)',
          borderRadius: 6, padding: '10px 14px', fontSize: 12,
          fontFamily: 'var(--font-mono, monospace)', lineHeight: 1.7,
        }}>
          <div style={{ color: 'var(--prime,#F0A500)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Gini Impurity — Root Split ({giniInfo.axis} {'<'} {giniInfo.thr.toFixed(2)})
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', color: 'var(--ink-mid,#aaa)' }}>
            <div>
              <div style={{ color: 'var(--ink-low,#666)', fontSize: 11 }}>Parent (before split)</div>
              <div>G = 1 − p₀² − p₁² = <span style={{ color: 'var(--prime)' }}>{giniInfo.gP.toFixed(3)}</span></div>
              <div style={{ color: 'var(--ink-low)', fontSize: 11 }}>{points.length} samples</div>
            </div>
            <div>
              <div style={{ color: 'var(--ink-low,#666)', fontSize: 11 }}>Left leaf</div>
              <div>G = <span style={{ color: giniInfo.gL < giniInfo.gP ? '#4ade80' : '#ef4444' }}>{giniInfo.gL.toFixed(3)}</span></div>
              <div style={{ color: 'var(--ink-low)', fontSize: 11 }}>{giniInfo.nLeft} samples</div>
            </div>
            <div>
              <div style={{ color: 'var(--ink-low,#666)', fontSize: 11 }}>Right leaf</div>
              <div>G = <span style={{ color: giniInfo.gR < giniInfo.gP ? '#4ade80' : '#ef4444' }}>{giniInfo.gR.toFixed(3)}</span></div>
              <div style={{ color: 'var(--ink-low)', fontSize: 11 }}>{giniInfo.nRight} samples</div>
            </div>
            <div>
              <div style={{ color: 'var(--ink-low,#666)', fontSize: 11 }}>Information gain</div>
              <div>ΔG = <span style={{ color: '#4ade80', fontWeight: 700 }}>{giniInfo.gain.toFixed(3)}</span></div>
              <div style={{ color: 'var(--ink-low)', fontSize: 11 }}>parent − weighted avg</div>
            </div>
          </div>
          <div style={{ color: 'var(--ink-low,#666)', fontSize: 11, marginTop: 6 }}>
            Gini = 1 − Σₖ pₖ² ranges 0 (pure: all one class) to 0.5 (50/50 split). Tree greedily picks the split maximizing ΔG at each node.
          </div>
        </div>
      )}
    </div>
  );
})
