import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";

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

// RBF grid (20x20) -- gamma is a parameter, not baked in, so the boundary can
// actually animate/redraw as gamma changes (a fixed gamma made "play" a no-op
// in this mode, since nothing else here responds to time).
function computeRBFGrid(gamma) {
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
        score += p.cls * Math.exp(-gamma * d2);
      }
      row.push(score > 0 ? 1 : -1);
    }
    grid.push(row);
  }
  return grid;
}

// Concentric-circle data for the "kernel lift" mode -- not separable by ANY straight
// line in raw (x,y), which is the whole point of this mode: the kernel trick's
// classic textbook example. phi(x,y) = (x, y, r^2) with r^2 = (x-0.5)^2+(y-0.5)^2
// lifts these into two flat, height-separated bands in 3D.
function generateConcentricPoints() {
  const rng = mulberry32(7);
  const pts = [];
  // inner ring (class -1, blue), r in [0.03, 0.13]
  for (let i = 0; i < 14; i++) {
    const angle = rng() * Math.PI * 2;
    const r = 0.03 + rng() * 0.10;
    pts.push({ x: 0.5 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle), cls: -1 });
  }
  // outer ring (class +1, amber), r in [0.27, 0.42]
  for (let i = 0; i < 16; i++) {
    const angle = rng() * Math.PI * 2;
    const r = 0.27 + rng() * 0.15;
    pts.push({ x: 0.5 + r * Math.cos(angle), y: 0.5 + r * Math.sin(angle), cls: 1 });
  }
  return pts;
}
const CONCENTRIC_POINTS = generateConcentricPoints();
const R2 = (p) => (p.x - 0.5) ** 2 + (p.y - 0.5) ** 2;
const INNER_MAX_R2 = Math.max(...CONCENTRIC_POINTS.filter(p => p.cls === -1).map(R2));
const OUTER_MIN_R2 = Math.min(...CONCENTRIC_POINTS.filter(p => p.cls === 1).map(R2));
const PLANE_Z = (INNER_MAX_R2 + OUTER_MIN_R2) / 2; // the separating plane's height

export const SVMViz = forwardRef(function SVMViz(props, ref) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [mode, setMode] = useState("Linear");
  const [cValue, setCValue] = useState(1);
  const [liftT, setLiftT] = useState(0); // 0 = flat top-down, 1 = fully lifted + tilted view

  const animRef = useRef(null);
  const rafRef = useRef(null);
  const dirRef = useRef(1);
  const lastTsRef = useRef(0);
  const holdRef = useRef(0); // ms remaining to rest at an endpoint before reversing

  const play = useCallback(() => {
    if (animRef.current) return;
    animRef.current = setInterval(() => {
      setCValue(prev => {
        const next = +(prev + 0.5).toFixed(1);
        return next > 10 ? 0.1 : next;
      });
    }, 400);
    if (!rafRef.current) {
      lastTsRef.current = 0;
      const tick = (ts) => {
        if (!lastTsRef.current) lastTsRef.current = ts;
        const dt = ts - lastTsRef.current;
        lastTsRef.current = ts;
        if (holdRef.current > 0) {
          holdRef.current -= dt;
        } else {
          setLiftT(prev => {
            let next = prev + dirRef.current * dt / 5800;
            if (next >= 1) { next = 1; dirRef.current = -1; holdRef.current = 700; }
            if (next <= 0) { next = 0; dirRef.current = 1; holdRef.current = 700; }
            return next;
          });
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    lastTsRef.current = 0;
    holdRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    pause();
    setCValue(1);
    setLiftT(0);
    dirRef.current = 1;
    setMode("Linear");
  }, [pause]);

  const step = useCallback(() => {
    pause();
    setCValue(c => Math.min(10, +(c + 0.5).toFixed(1)));
    setLiftT(l => (l < 0.999 ? 1 : 0));
  }, [pause]);

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step]);

  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (W === 0 || H === 0) return;
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
      ctx.fillText(`margin = ${(marginHalf * 2).toFixed(2)}`, PAD + (0.50 * plotW) - 20, PAD - 6);

      // Draw points
      for (const p of SVM_POINTS) {
        const [cx, cy] = toCanvas(p.x, p.y);
        const isSV = SUPPORT_VECTORS.has(p);
        const r = 5;
        if (isSV) {
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

    } else if (mode === "RBF kernel") {
      // RBF mode: paint grid. gamma is live (driven by liftT, shared with the
      // other modes' progress control) so the boundary actually redraws as it
      // changes -- low gamma = smooth boundary, high gamma = tight bubbles.
      const gamma = 2 + liftT * 38;
      const grid = computeRBFGrid(gamma);
      const N = 20;
      const cellW = plotW / N;
      const cellH = plotH / N;
      for (let gy = 0; gy < N; gy++) {
        for (let gx = 0; gx < N; gx++) {
          const pred = grid[gy][gx];
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
          if (grid[gy][gx] !== grid[gy][gx + 1]) {
            const x = PAD + (gx + 1) * cellW;
            const y1c = PAD + gy * cellH;
            const y2c = PAD + (gy + 1) * cellH;
            ctx.beginPath(); ctx.moveTo(x, y1c); ctx.lineTo(x, y2c); ctx.stroke();
          }
          if (grid[gy][gx] !== grid[gy + 1][gx]) {
            const y = PAD + (gy + 1) * cellH;
            const x1c = PAD + gx * cellW;
            const x2c = PAD + (gx + 1) * cellW;
            ctx.beginPath(); ctx.moveTo(x1c, y); ctx.lineTo(x2c, y); ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Draw points
      for (const p of SVM_POINTS) {
        const [cx, cy] = toCanvas(p.x, p.y);
        const r = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = p.cls === 1 ? "#F0A500" : "#5080DC";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(230,230,230,0.55)";
      ctx.font = "10px var(--font-sans, sans-serif)";
      ctx.fillText(`gamma = ${gamma.toFixed(1)}`, PAD, 16);

    } else {
      // "Kernel lift (3D)" mode -- phi(x,y) = (x, y, r^2). liftT=0 is a flat
      // top-down view (two rings, no straight line separates them); as liftT
      // rises we both raise each point by its r^2 and tilt the view, so the two
      // classes visibly separate into height bands that a flat plane can cut.
      const cx0 = W / 2, cy0 = H / 2 + 10;
      const scale = Math.min(plotW, plotH) * 0.85;
      const elev = liftT * (50 * Math.PI / 180); // 0 -> 50 degrees
      const liftScale = 1.9;

      function project(x, y, z) {
        const X = (x - 0.5) * scale;
        const Y = (y - 0.5) * scale;
        const Z = z * scale * liftScale;
        const Y2 = Y * Math.cos(elev) - Z * Math.sin(elev);
        return [cx0 + X, cy0 - Y2];
      }

      // separating plane at height PLANE_Z, drawn as a translucent sheet that
      // grows outward from the center and fades in continuously as liftT rises
      // (both size AND opacity track t, not just opacity) -- so dragging back
      // toward t=0 visibly shrinks and lowers it rather than just cross-fading
      // a fixed, canvas-filling rectangle in and out.
      if (liftT > 0.1) {
        const progress = Math.min(1, (liftT - 0.1) / 0.9);
        const half = 0.06 + progress * 0.34; // grows from a small square to a modest sheet
        const corners = [
          [0.5 - half, 0.5 - half], [0.5 + half, 0.5 - half],
          [0.5 + half, 0.5 + half], [0.5 - half, 0.5 + half],
        ].map(([x, y]) => project(x, y, PLANE_Z * liftT));
        ctx.save();
        ctx.globalAlpha = progress * 0.14;
        ctx.fillStyle = "#F0A500";
        ctx.beginPath();
        corners.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
        ctx.closePath();
        ctx.fill();
        // a light 3x3 grid inside the sheet so it reads as a plane, not a color block
        ctx.strokeStyle = "#F0A500";
        ctx.lineWidth = 1;
        ctx.globalAlpha = progress * 0.6;
        for (let i = 1; i <= 2; i++) {
          const f = i / 3;
          const a = project(0.5 - half + f * half * 2, 0.5 - half, PLANE_Z * liftT);
          const b = project(0.5 - half + f * half * 2, 0.5 + half, PLANE_Z * liftT);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          const c = project(0.5 - half, 0.5 - half + f * half * 2, PLANE_Z * liftT);
          const d = project(0.5 + half, 0.5 - half + f * half * 2, PLANE_Z * liftT);
          ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
        }
        ctx.globalAlpha = progress * 0.8;
        ctx.beginPath();
        corners.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // points, raised by r^2 * liftT
      for (const p of CONCENTRIC_POINTS) {
        const z = R2(p) * liftT;
        const [px, py] = project(p.x, p.y, z);
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = p.cls === 1 ? "#F0A500" : "#5080DC";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(230,230,230,0.55)";
      ctx.font = "10px var(--font-sans, sans-serif)";
      ctx.fillText(liftT < 0.05 ? "raw (x, y) -- no line separates the rings" : "lifted (x, y, x²+y²) -- a flat plane now does", PAD, 16);
    }
  }, [mode, cValue, liftT]);

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
      ctx.setTransform(1, 0, 0, 1, 0, 0);
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
          {["Linear", "RBF kernel", "Kernel lift (3D)"].map(m => (
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
        {mode === "RBF kernel" && (
          <label style={{ fontSize: 13, color: "var(--ink-mid, #aaa)", flex: 1, minWidth: 180 }}>
            gamma = {(2 + liftT * 38).toFixed(1)} (low = smooth boundary, high = tight bubbles)
            <input
              type="range" min={0} max={1} step={0.01} value={liftT}
              onChange={e => { pause(); setLiftT(Number(e.target.value)); }}
              style={{ width: "100%", marginTop: 4, accentColor: "var(--prime, #F0A500)", cursor: "pointer" }}
            />
          </label>
        )}
        {mode === "Kernel lift (3D)" && (
          <label style={{ fontSize: 13, color: "var(--ink-mid, #aaa)", flex: 1, minWidth: 180 }}>
            Lift: flat (t=0) &rarr; lifted (t=1) — t = {liftT.toFixed(2)}
            <input
              type="range" min={0} max={1} step={0.01} value={liftT}
              onChange={e => { pause(); setLiftT(Number(e.target.value)); }}
              style={{ width: "100%", marginTop: 4, accentColor: "var(--prime, #F0A500)", cursor: "pointer" }}
            />
          </label>
        )}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-mid, #aaa)", display: "flex", gap: 20, flexWrap: "wrap" }}>
        <span>Mode: <strong style={{ color: "var(--prime, #F0A500)" }}>{mode}</strong></span>
        {mode === "Linear" && <span>Support vectors: <strong style={{ color: "var(--prime, #F0A500)" }}>{svCount}</strong></span>}
        {mode === "Linear" && <span>Margin width: <strong style={{ color: "var(--prime, #F0A500)" }}>{marginWidth}</strong></span>}
      </div>
      <p style={{ marginTop: 10, fontSize: 11, color: "var(--ink-low, #888)", lineHeight: 1.5 }}>
        {mode === "Kernel lift (3D)"
          ? "This is the kernel trick made literal: phi(x,y) = (x, y, x²+y²) lifts every point by its squared distance from the center. The inner ring stays low, the outer ring rises higher, and a flat plane -- something no straight line in 2D could do -- now separates them. The SVM's dual form never actually computes phi; it only needs the dot products, i.e. the kernel k(x,x') = phi(x)·phi(x')."
          : "Support vectors are the points closest to the decision boundary — they are the only points that define it. Moving any non-support-vector point doesn't change the boundary. The SVM maximizes the margin between classes."}
      </p>
      <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-ghost, #555)", display: "flex", gap: 16 }}>
        <span style={{ color: "#F0A500" }}>&#9679; Class +1</span>
        <span style={{ color: "#5080DC" }}>&#9679; Class -1</span>
        {mode === "Linear" && <span style={{ color: "rgba(240,165,0,0.7)" }}>&#9675; Support vector</span>}
      </div>
    </div>
  );
})
