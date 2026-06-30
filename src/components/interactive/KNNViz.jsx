import { useRef, useEffect, useState, useCallback } from "react";

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateKNNPoints() {
  const rng = mulberry32(77);
  const pts = [];

  const clusters = [
    { cx: 0.2, cy: 0.7, cls: "A", n: 6 },
    { cx: 0.35, cy: 0.3, cls: "A", n: 6 },
    { cx: 0.65, cy: 0.7, cls: "B", n: 6 },
    { cx: 0.8, cy: 0.3, cls: "B", n: 6 },
    { cx: 0.5, cy: 0.55, cls: "C", n: 6 },
    { cx: 0.5, cy: 0.45, cls: "C", n: 6 },
  ];

  for (const cl of clusters) {
    for (let i = 0; i < cl.n; i++) {
      const angle = rng() * Math.PI * 2;
      const r = rng() * 0.12;
      pts.push({
        x: Math.min(Math.max(cl.cx + r * Math.cos(angle), 0.04), 0.96),
        y: Math.min(Math.max(cl.cy + r * Math.sin(angle), 0.04), 0.96),
        cls: cl.cls,
      });
    }
  }
  return pts;
}

const TRAIN_POINTS = generateKNNPoints();
const CLASS_COLORS = { A: "#F0A500", B: "#5080DC", C: "#3CB371" };
const ODD_KS = [1, 3, 5, 7, 9, 11];

function knnPredict(query, k, points) {
  const dists = points.map(p => ({
    p,
    d: Math.sqrt((p.x - query.x) ** 2 + (p.y - query.y) ** 2),
  })).sort((a, b) => a.d - b.d);

  const neighbors = dists.slice(0, k);
  const votes = { A: 0, B: 0, C: 0 };
  for (const n of neighbors) votes[n.p.cls]++;
  const predicted = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
  const kthDist = neighbors[k - 1].d;
  return { predicted, votes, kthDist, neighbors };
}

function computeDecisionGrid(k) {
  const N = 20;
  const grid = [];
  for (let gy = 0; gy < N; gy++) {
    const row = [];
    for (let gx = 0; gx < N; gx++) {
      const nx = gx / (N - 1);
      const ny = gy / (N - 1);
      const { predicted } = knnPredict({ x: nx, y: ny }, k, TRAIN_POINTS);
      row.push(predicted);
    }
    grid.push(row);
  }
  return grid;
}

// Precompute grids for all k values
const GRIDS = {};
for (const k of ODD_KS) GRIDS[k] = computeDecisionGrid(k);

export function KNNViz() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [k, setK] = useState(5);
  const [query, setQuery] = useState(null);
  const [result, setResult] = useState(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const PAD = 20;
    const plotW = W - PAD * 2;
    const plotH = H - PAD * 2;

    ctx.clearRect(0, 0, W, H);

    function toCanvas(x, y) {
      return [PAD + x * plotW, PAD + (1 - y) * plotH];
    }
    function fromCanvas(cx, cy) {
      return { x: (cx - PAD) / plotW, y: 1 - (cy - PAD) / plotH };
    }

    // Background decision regions
    const grid = GRIDS[k];
    const N = 20;
    const cellW = plotW / N;
    const cellH = plotH / N;
    const alphaMap = { A: "rgba(240,165,0,0.07)", B: "rgba(80,130,220,0.07)", C: "rgba(60,179,113,0.07)" };
    for (let gy = 0; gy < N; gy++) {
      for (let gx = 0; gx < N; gx++) {
        ctx.fillStyle = alphaMap[grid[gy][gx]];
        ctx.fillRect(PAD + gx * cellW, PAD + gy * cellH, cellW, cellH);
      }
    }

    // Query state: search radius circle
    if (query && result) {
      const [qx, qy] = toCanvas(query.x, query.y);
      const radiusPx = result.kthDist * plotW;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(qx, qy, radiusPx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Training points
    for (const p of TRAIN_POINTS) {
      const [cx, cy] = toCanvas(p.x, p.y);
      const isNeighbor = query && result && result.neighbors.some(n => n.p === p);
      const r = 5;

      if (isNeighbor) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = CLASS_COLORS[p.cls];
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = CLASS_COLORS[p.cls];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Query point
    if (query && result) {
      const [qx, qy] = toCanvas(query.x, query.y);
      const color = CLASS_COLORS[result.predicted];

      // Star shape
      ctx.save();
      ctx.translate(qx, qy);
      ctx.beginPath();
      const spikes = 5, outerR = 9, innerR = 4;
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const rr = i % 2 === 0 ? outerR : innerR;
        if (i === 0) ctx.moveTo(Math.cos(angle) * rr, Math.sin(angle) * rr);
        else ctx.lineTo(Math.cos(angle) * rr, Math.sin(angle) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // "Click to classify" instruction (no query yet)
    if (!query) {
      ctx.fillStyle = "rgba(180,180,180,0.5)";
      ctx.font = "12px var(--font-sans, sans-serif)";
      ctx.textAlign = "center";
      ctx.fillText("Click anywhere to classify a point", W / 2, H / 2);
      ctx.textAlign = "start";
    }
  }, [k, query, result]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const observer = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      draw();
    });
    observer.observe(container);
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    draw();
    return () => observer.disconnect();
  }, [draw]);

  const handleCanvasClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const PAD = 20;
    const plotW = canvas.clientWidth - PAD * 2;
    const plotH = canvas.clientHeight - PAD * 2;
    const qx = (cx - PAD) / plotW;
    const qy = 1 - (cy - PAD) / plotH;

    if (qx < 0 || qx > 1 || qy < 0 || qy > 1) return;

    const qPt = { x: qx, y: qy };
    const res = knnPredict(qPt, k, TRAIN_POINTS);
    setQuery(qPt);
    setResult(res);
  }, [k]);

  // Recompute result if k changes and query exists
  useEffect(() => {
    if (query) {
      const res = knnPredict(query, k, TRAIN_POINTS);
      setResult(res);
    }
  }, [k]);

  const kIdx = ODD_KS.indexOf(k);

  return (
    <div ref={containerRef} style={{ fontFamily: "var(--font-sans, sans-serif)", color: "var(--ink-hi, #eee)" }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{ display: "block", width: "100%", borderRadius: 6, border: "1px solid var(--rim, #333)", background: "var(--depth, #111)", cursor: "crosshair" }}
      />
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, color: "var(--ink-mid, #aaa)" }}>
          k = {k}
          <input
            type="range" min={0} max={ODD_KS.length - 1} step={1} value={kIdx}
            onChange={e => setK(ODD_KS[Number(e.target.value)])}
            style={{ marginLeft: 8, accentColor: "var(--prime, #F0A500)", verticalAlign: "middle" }}
          />
        </label>
        <span style={{ fontSize: 11, color: "var(--ink-low, #888)" }}>
          {k === 1 ? "High variance (memorizes)" : k >= 9 ? "High bias (over-smoothed)" : "Balanced"}
        </span>
      </div>

      {query && result ? (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-mid, #aaa)", display: "flex", flexDirection: "column", gap: 4 }}>
          <span>
            Query point →{" "}
            <strong style={{ color: CLASS_COLORS[result.predicted] }}>Class {result.predicted}</strong>
            {" "}(k={k} vote: A={result.votes.A} / B={result.votes.B} / C={result.votes.C})
          </span>
          <span>Distance to k-th neighbor: <strong style={{ color: "var(--prime, #F0A500)" }}>{result.kthDist.toFixed(3)}</strong></span>
        </div>
      ) : (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-low, #888)", fontStyle: "italic" }}>
          Click on the canvas to classify a point
        </div>
      )}

      <p style={{ marginTop: 10, fontSize: 11, color: "var(--ink-low, #888)", lineHeight: 1.5 }}>
        k=1 memorizes training data (high variance). Large k smooths the boundary (high bias). The optimal k depends on the data — use cross-validation to choose. k-NN is a non-parametric method: it stores the entire training set and computes at prediction time.
      </p>
      <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-ghost, #555)", display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span style={{ color: "#F0A500" }}>&#9679; Class A</span>
        <span style={{ color: "#5080DC" }}>&#9679; Class B</span>
        <span style={{ color: "#3CB371" }}>&#9679; Class C</span>
        <span style={{ color: "rgba(255,255,255,0.6)" }}>&#9733; Query point</span>
      </div>
    </div>
  );
}
