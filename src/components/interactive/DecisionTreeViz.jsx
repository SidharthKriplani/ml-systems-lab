import { useRef, useEffect, useState } from "react";

// mulberry32 seeded RNG
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generatePoints() {
  const rng = mulberry32(42);
  const pts = [];
  // Class 0 (blue): 20 points mostly lower-left [0,0.5]x[0,0.5]
  for (let i = 0; i < 20; i++) {
    const x = rng() * 0.5 + rng() * 0.15;
    const y = rng() * 0.5 + rng() * 0.15;
    pts.push({ x: Math.min(Math.max(x, 0.02), 0.98), y: Math.min(Math.max(y, 0.02), 0.98), cls: 0 });
  }
  // Class 1 (amber): 20 points mostly upper-right [0.5,1]x[0.5,1]
  for (let i = 0; i < 20; i++) {
    const x = 0.5 + rng() * 0.5 - rng() * 0.15;
    const y = 0.5 + rng() * 0.5 - rng() * 0.15;
    pts.push({ x: Math.min(Math.max(x, 0.02), 0.98), y: Math.min(Math.max(y, 0.02), 0.98), cls: 1 });
  }
  // 8 noisy overlapping points
  const noisy = [
    { x: 0.48, y: 0.52, cls: 0 }, { x: 0.53, y: 0.44, cls: 1 },
    { x: 0.42, y: 0.58, cls: 1 }, { x: 0.57, y: 0.42, cls: 0 },
    { x: 0.31, y: 0.62, cls: 1 }, { x: 0.68, y: 0.37, cls: 0 },
    { x: 0.45, y: 0.46, cls: 0 }, { x: 0.55, y: 0.55, cls: 1 },
  ];
  return [...pts, ...noisy];
}

const POINTS = generatePoints();

// Hardcoded splits per depth level
// Each split: { axis: 'x'|'y', threshold, region: null|{axis,min,max} }
// region = null means the split applies globally; otherwise only in that sub-region
const SPLITS_BY_DEPTH = {
  1: [
    { axis: "x", threshold: 0.50, x1: 0.50, y1: 0, x2: 0.50, y2: 1 },
  ],
  2: [
    { axis: "x", threshold: 0.50, x1: 0.50, y1: 0, x2: 0.50, y2: 1 },
    { axis: "y", threshold: 0.48, x1: 0, y1: 0.48, x2: 0.50, y2: 0.48 },
  ],
  3: [
    { axis: "x", threshold: 0.50, x1: 0.50, y1: 0, x2: 0.50, y2: 1 },
    { axis: "y", threshold: 0.48, x1: 0, y1: 0.48, x2: 0.50, y2: 0.48 },
    { axis: "y", threshold: 0.62, x1: 0.50, y1: 0.62, x2: 1, y2: 0.62 },
    { axis: "x", threshold: 0.28, x1: 0.28, y1: 0.48, x2: 0.28, y2: 1 },
  ],
  4: [
    { axis: "x", threshold: 0.50, x1: 0.50, y1: 0, x2: 0.50, y2: 1 },
    { axis: "y", threshold: 0.48, x1: 0, y1: 0.48, x2: 0.50, y2: 0.48 },
    { axis: "y", threshold: 0.62, x1: 0.50, y1: 0.62, x2: 1, y2: 0.62 },
    { axis: "x", threshold: 0.28, x1: 0.28, y1: 0.48, x2: 0.28, y2: 1 },
    { axis: "x", threshold: 0.72, x1: 0.72, y1: 0, x2: 0.72, y2: 0.62 },
    { axis: "y", threshold: 0.22, x1: 0, y1: 0.22, x2: 0.28, y2: 0.22 },
  ],
};

// Predict class for a point given depth using a simple rule tree
function predictDepth(px, py, depth) {
  if (depth === 1) {
    return px > 0.50 ? 1 : 0;
  }
  if (depth === 2) {
    if (px > 0.50) return 1;
    return py > 0.48 ? 1 : 0;
  }
  if (depth === 3) {
    if (px > 0.50) {
      return py > 0.62 ? 0 : 1;
    }
    if (px > 0.28) {
      return py > 0.48 ? 1 : 0;
    }
    return 0;
  }
  // depth 4
  if (px > 0.50) {
    if (px > 0.72) {
      return py > 0.62 ? 0 : 1;
    }
    return py > 0.62 ? 0 : 1;
  }
  if (px > 0.28) {
    return py > 0.48 ? 1 : 0;
  }
  return py > 0.22 ? 0 : 0;
}

function computeAccuracy(depth) {
  let correct = 0;
  for (const p of POINTS) {
    if (predictDepth(p.x, p.y, depth) === p.cls) correct++;
  }
  return Math.round((correct / POINTS.length) * 100);
}

const ACCURACIES = { 1: computeAccuracy(1), 2: computeAccuracy(2), 3: computeAccuracy(3), 4: computeAccuracy(4) };

export function DecisionTreeViz() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [depth, setDepth] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const style = getComputedStyle(document.documentElement);
    const prime = style.getPropertyValue("--prime").trim() || "#F0A500";
    const rimColor = style.getPropertyValue("--rim").trim() || "#333";
    const W = canvas.width;
    const H = canvas.height;
    const PAD = 20;
    const plotW = W - PAD * 2;
    const plotH = H - PAD * 2;

    function toCanvas(x, y) {
      return [PAD + x * plotW, PAD + (1 - y) * plotH];
    }

    // Paint background regions
    const cellSize = 6;
    for (let gx = 0; gx < plotW; gx += cellSize) {
      for (let gy = 0; gy < plotH; gy += cellSize) {
        const nx = gx / plotW;
        const ny = 1 - gy / plotH;
        const pred = predictDepth(nx, ny, depth);
        ctx.fillStyle = pred === 1
          ? "rgba(240,165,0,0.07)"
          : "rgba(80,130,220,0.07)";
        ctx.fillRect(PAD + gx, PAD + gy, cellSize, cellSize);
      }
    }

    // Draw splits
    const splits = SPLITS_BY_DEPTH[depth];
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(220,220,220,0.7)";
    ctx.lineWidth = 1.5;
    for (const s of splits) {
      const [sx1, sy1] = toCanvas(s.x1, s.y1);
      const [sx2, sy2] = toCanvas(s.x2, s.y2);
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Draw points
    for (const p of POINTS) {
      const [cx, cy] = toCanvas(p.x, p.y);
      const pred = predictDepth(p.x, p.y, depth);
      const misclassified = pred !== p.cls;
      const r = 5;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = p.cls === 1 ? "#F0A500" : "#5080DC";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (misclassified) {
        // Draw X mark
        ctx.save();
        ctx.strokeStyle = "#ff4444";
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
    ctx.fillStyle = "rgba(180,180,180,0.6)";
    ctx.font = "10px var(--font-sans, sans-serif)";
    ctx.fillText("x", W - 12, H - 6);
    ctx.fillText("y", 4, 14);
  }, [depth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const observer = new ResizeObserver(() => {
      const w = Math.min(container.clientWidth, 450);
      canvas.width = w;
      canvas.height = Math.round(w * (300 / 450));
    });
    observer.observe(container);
    canvas.width = Math.min(container.clientWidth, 450);
    canvas.height = Math.round(canvas.width * (300 / 450));
    return () => observer.disconnect();
  }, []);

  const depthNote = depth <= 2
    ? "Underfitting — misses patterns in the data"
    : depth === 3
    ? "Good balance"
    : "Overfitting — splits memorize noise";

  return (
    <div ref={containerRef} style={{ fontFamily: "var(--font-sans, sans-serif)", color: "var(--ink-hi, #eee)" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", borderRadius: 6, border: "1px solid var(--rim, #333)", background: "var(--depth, #111)" }}
      />
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, color: "var(--ink-mid, #aaa)" }}>
          Tree depth:
          <input
            type="range" min={1} max={4} step={1} value={depth}
            onChange={e => setDepth(Number(e.target.value))}
            style={{ marginLeft: 8, accentColor: "var(--prime, #F0A500)", verticalAlign: "middle" }}
          />
        </label>
        <span style={{ fontSize: 13, color: "var(--prime, #F0A500)", fontWeight: 600 }}>
          Depth {depth}: {ACCURACIES[depth]}% training accuracy
        </span>
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--ink-mid, #aaa)", fontStyle: "italic" }}>
        {depthNote}
      </div>
      <p style={{ marginTop: 10, fontSize: 11, color: "var(--ink-low, #888)", lineHeight: 1.5 }}>
        Each split partitions the feature space by a threshold on one feature. Deeper trees fit training data better but generalize worse — this is why we prune or use max_depth.
      </p>
      <div style={{ marginTop: 6, fontSize: 11, color: "var(--ink-ghost, #555)", display: "flex", gap: 16 }}>
        <span style={{ color: "#F0A500" }}>&#9679; Class 1</span>
        <span style={{ color: "#5080DC" }}>&#9679; Class 0</span>
        <span style={{ color: "#ff4444" }}>&#10005; Misclassified</span>
      </div>
    </div>
  );
}
