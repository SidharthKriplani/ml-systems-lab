import { useRef, useEffect, useState } from "react";

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateSVMPoints() {
  const rng = mulberry32(99);
  const pts = [];
  // Class -1 (blue): 12 points around (0.25, 0.5), spread 0.15
  for (let i = 0; i < 12; i++) {
    const angle = rng() * Math.PI * 2;
    const r = rng() * 0.15;
    pts.push({ x: 0.25 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle), cls: -1 });
  }
  // Class +1 (amber): 12 points around (0.75, 0.5), spread 0.15
  for (let i = 0; i < 12; i++) {
    const angle = rng() * Math.PI * 2;
    const r = rng() * 0.15;
    pts.push({ x: 0.75 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle), cls: 1 });
  }
  return pts.map(p => ({
    ...p,
    x: Math.min(Math.max(p.x, 0.04), 0.96),
    y: Math.min(Math.max(p.y, 0.04), 0.96),
  }));
}

const SVM_POINTS = generateSVMPoints();

// Find the 2 support vectors on each side (closest to boundary x=0.50)
const NEG_SORTED = [...SVM_POINTS.filter(p => p.cls === -1)].sort((a, b) => b.x - a.x);
const POS_SORTED = [...SVM_POINTS.filter(p => p.cls === 1)].sort((a, b) => a.x - b.x);
const SUPPORT_VECTORS = new Set([
  NEG_SORTED[0], NEG_SORTED[1],
  POS_SORTED[0], POS_SORTED[1],
]);

// Precompute RBF grid (20x20)
function computeRBFGrid() {
  const N = 20;
  const grid = [];
  // RBF centered around class +1 cluster (0.75, 0.5)
  for (let gy = 0; gy < N; gy++) {
    const row = [];
    for (let gx = 0; gx < N; gx++) {
      const nx = gx / (N - 1);
      const ny = gy / (N - 1);
      // Sum of RBF responses from class +1 minus class -1
      let score = 0;
      for (const p of SVM_POINTS) {
        const dx = nx - p.x;
        const dy = ny - p.y;
        const d2 = dx * dx + dy * dy;
        const gamma = 18;
        score += p.cls * Math.exp(-gamma * d2);
      }
      row.push(score > 0 ? 1 : -1);
    }
    grid.push(row);
  }
  return grid;
}

const RBF_GRID = computeRBFGrid();

export function SVMViz() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [mode, setMode] = useState("Linear");
  const [cValue, setCValue] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const PAD = 24;
    const plotW = W - PAD * 2;
    const plotH = H - PAD * 2;

    ctx.clearRect(0, 0, W, H);

    function toCanvas(x, y) {
      return [PAD + x * plotW, PAD + (1 - y) * plotH];
    }

    if (mode === "Linear") {
      // Background shading based on x > 0.50
      for (let gx = 0; gx < plotW; gx += 5) {
        for (let gy = 0; gy < plotH; gy += 5) {
          const nx = gx / plotW;
          ctx.fillStyle = nx > 0.50
            ? "rgba(240,165,0,0.06)"
            : "rgba(80,130,220,0.06)";
          ctx.fillRect(PAD + gx, PAD + gy, 5, 5);
        }
      }

      // Margin width: 0.18 base, narrower for high C
      const marginHalf = (0.09 / Math.sqrt(cValue)) * 2.5;
      const leftMarginX = 0.50 - marginHalf;
      const rightMarginX = 0.50 + marginHalf;

      // Margin lines
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(240,165,0,0.7)";
      ctx.lineWidth = 1.5;
      const [lx1] = toCanvas(leftMarginX, 1);
      const [lx2] = toCanvas(leftMarginX, 0);
      ctx.beginPath(); ctx.moveTo(lx1, PAD); ctx.lineTo(lx2, H - PAD); ctx.stroke();
      const [rx1] = toCanvas(rightMarginX, 1);
      const [rx2] = toCanvas(rightMarginX, 0);
      ctx.beginPath(); ctx.moveTo(rx1, PAD); ctx.lineTo(rx2, H - PAD); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Decision boundary
      ctx.save();
      ctx.strokeStyle = "#F0A500";
      ctx.lineWidth = 2;
      const [bx] = toCanvas(0.50, 0);
      ctx.beginPath(); ctx.moveTo(bx, PAD); ctx.lineTo(bx, H - PAD); ctx.stroke();
      ctx.restore();

      // Margin label
      ctx.fillStyle = "rgba(240,165,0,0.6)";
      ctx.font = "10px var(--font-sans, sans-serif)";
      const marginPx = (rightMarginX - leftMarginX) * plotW;
      ctx.fillText(`margin = ${(marginHalf * 2).toFixed(2)}`, PAD + (0.50 * plotW) - 20, PAD - 6);

    } else {
      // RBF mode: paint grid
      const N = 20;
      const cellW = plotW / N;
      const cellH = plotH / N;
      for (let gy = 0; gy < N; gy++) {
        for (let gx = 0; gx < N; gx++) {
          const pred = RBF_GRID[gy][gx];
          ctx.fillStyle = pred === 1
            ? "rgba(240,165,0,0.09)"
            : "rgba(80,130,220,0.09)";
          ctx.fillRect(PAD + gx * cellW, PAD + gy * cellH, cellW, cellH);
        }
      }

      // Draw a curved boundary line by scanning the grid transitions
      ctx.save();
      ctx.strokeStyle = "#F0A500";
      ctx.lineWidth = 2;
      for (let gy = 0; gy < N - 1; gy++) {
        for (let gx = 0; gx < N - 1; gx++) {
          if (RBF_GRID[gy][gx] !== RBF_GRID[gy][gx + 1]) {
            const x = PAD + (gx + 1) * cellW;
            const y1c = PAD + gy * cellH;
            const y2c = PAD + (gy + 1) * cellH;
            ctx.beginPath(); ctx.moveTo(x, y1c); ctx.lineTo(x, y2c); ctx.stroke();
          }
          if (RBF_GRID[gy][gx] !== RBF_GRID[gy + 1][gx]) {
            const y = PAD + (gy + 1) * cellH;
            const x1c = PAD + gx * cellW;
            const x2c = PAD + (gx + 1) * cellW;
            ctx.beginPath(); ctx.moveTo(x1c, y); ctx.lineTo(x2c, y); ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // Draw points
    for (const p of SVM_POINTS) {
      const [cx, cy] = toCanvas(p.x, p.y);
      const isSV = SUPPORT_VECTORS.has(p);
      const r = 5;

      if (mode === "Linear" && isSV) {
        // Support vector ring
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = p.cls === 1 ? "rgba(240,165,0,0.8)" : "rgba(80,130,220,0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = p.cls === 1 ? "#F0A500" : "#5080DC";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [mode, cValue, canvasRef.current && canvasRef.current.width]);

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
    });
    observer.observe(container);
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return () => observer.disconnect();
  }, []);

  const svCount = mode === "Linear" ? SUPPORT_VECTORS.size : "N/A";
  const marginWidth = mode === "Linear"
    ? ((0.09 / Math.sqrt(cValue)) * 2.5 * 2).toFixed(3)
    : "curved";

  return (
    <div ref={containerRef} style={{ fontFamily: "var(--font-sans, sans-serif)", color: "var(--ink-hi, #eee)" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", borderRadius: 6, border: "1px solid var(--rim, #333)", background: "var(--depth, #111)" }}
      />
      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {["Linear", "RBF kernel"].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "4px 14px",
                borderRadius: 4,
                border: "1px solid var(--rim, #333)",
                background: mode === m ? "var(--prime, #F0A500)" : "var(--surface, #1a1a1a)",
                color: mode === m ? "#000" : "var(--ink-mid, #aaa)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: mode === m ? 600 : 400,
              }}
            >
              {m}
            </button>
          ))}
        </div>
        {mode === "Linear" && (
          <label style={{ fontSize: 13, color: "var(--ink-mid, #aaa)" }}>
            C = {cValue.toFixed(1)}
            <input
              type="range" min={0.1} max={10} step={0.1} value={cValue}
              onChange={e => setCValue(Number(e.target.value))}
              style={{ marginLeft: 8, accentColor: "var(--prime, #F0A500)", verticalAlign: "middle" }}
            />
          </label>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-mid, #aaa)", display: "flex", gap: 20, flexWrap: "wrap" }}>
        <span>Mode: <strong style={{ color: "var(--prime, #F0A500)" }}>{mode}</strong></span>
        <span>Support vectors: <strong style={{ color: "var(--prime, #F0A500)" }}>{svCount}</strong></span>
        <span>Margin width: <strong style={{ color: "var(--prime, #F0A500)" }}>{marginWidth}</strong></span>
      </div>
      <p style={{ marginTop: 10, fontSize: 11, color: "var(--ink-low, #888)", lineHeight: 1.5 }}>
        Support vectors are the points closest to the decision boundary — they are the only points that define it. Moving any non-support-vector point doesn't change the boundary. The SVM maximizes the margin between classes.
      </p>
      <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-ghost, #555)", display: "flex", gap: 16 }}>
        <span style={{ color: "#F0A500" }}>&#9679; Class +1</span>
        <span style={{ color: "#5080DC" }}>&#9679; Class -1</span>
        {mode === "Linear" && <span style={{ color: "rgba(240,165,0,0.7)" }}>&#9675; Support vector</span>}
      </div>
    </div>
  );
}
