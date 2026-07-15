import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

// Fixed hidden-layer weights that solve XOR the same way this module's own text
// describes it: h1 fires like an OR gate (low only at 0,0), h2 fires like an AND
// gate (high only at 1,1) -- so h1 - h2 is high only on "exactly one input on".
const W1 = { w: [8, 8], b: -4 };   // OR-like
const W2 = { w: [8, 8], b: -12 };  // AND-like

function hidden(x1, x2) {
  const h1 = sigmoid(W1.w[0] * x1 + W1.w[1] * x2 + W1.b);
  const h2 = sigmoid(W2.w[0] * x1 + W2.w[1] * x2 + W2.b);
  return [h1, h2];
}

const XOR_POINTS = [
  { x: 0, y: 0, label: 0 },
  { x: 1, y: 0, label: 1 },
  { x: 0, y: 1, label: 1 },
  { x: 1, y: 1, label: 0 },
];

const RANGE = [-0.25, 1.25];
const GRID_N = 12;
const SAMPLES = 24;

// Precomputed once at module load: each grid line as a sequence of (x1,x2) input
// points. Warping is applied per-frame in draw() so the shape below stays fixed.
function buildGridLines() {
  const lines = [];
  for (let i = 0; i <= GRID_N; i++) {
    const v = RANGE[0] + (i / GRID_N) * (RANGE[1] - RANGE[0]);
    const hLine = [];
    const vLine = [];
    for (let s = 0; s <= SAMPLES; s++) {
      const u = RANGE[0] + (s / SAMPLES) * (RANGE[1] - RANGE[0]);
      hLine.push([u, v]);
      vLine.push([v, u]);
    }
    lines.push(hLine, vLine);
  }
  return lines;
}
const GRID_LINES = buildGridLines();

// Decision boundary lives in hidden (h1,h2) space: h1 - h2 = 0.5, extended across
// the plotted range. It only becomes a valid separator once t -> 1.
const BOUNDARY = [[-0.25, -0.75], [1.25, 0.75]];

export const NeuralNetGeometryViz = forwardRef(function NeuralNetGeometryViz(props, ref) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [t, setT] = useState(0); // 0 = raw input space, 1 = fully warped hidden space
  const rafRef = useRef(null);
  const dirRef = useRef(1);
  const lastTsRef = useRef(0);
  const holdRef = useRef(0); // ms remaining to rest at an endpoint before reversing

  const play = useCallback(() => {
    if (rafRef.current) return;
    lastTsRef.current = 0;
    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      if (holdRef.current > 0) {
        holdRef.current -= dt;
      } else {
        setT(prev => {
          let next = prev + dirRef.current * dt / 5800;
          if (next >= 1) { next = 1; dirRef.current = -1; holdRef.current = 700; }
          if (next <= 0) { next = 0; dirRef.current = 1; holdRef.current = 700; }
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const pause = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    lastTsRef.current = 0;
    holdRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    pause();
    dirRef.current = 1;
    setT(0);
  }, [pause]);

  const step = useCallback(() => {
    pause();
    setT(prev => (prev < 0.999 ? 1 : 0));
  }, [pause]);

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const Wpx = canvas.clientWidth, Hpx = canvas.clientHeight;
    if (!Wpx || !Hpx) return;
    const PAD = 22;
    const plotW = Wpx - PAD * 2, plotH = Hpx - PAD * 2;
    ctx.clearRect(0, 0, Wpx, Hpx);

    function toCanvas([u, v]) {
      const nx = (u - RANGE[0]) / (RANGE[1] - RANGE[0]);
      const ny = (v - RANGE[0]) / (RANGE[1] - RANGE[0]);
      return [PAD + nx * plotW, Hpx - PAD - ny * plotH];
    }

    function warp([x1, x2]) {
      const [h1, h2] = hidden(x1, x2);
      return [x1 + (h1 - x1) * t, x2 + (h2 - x2) * t];
    }

    // grid lines -- straight at t=0, bent by the hidden layer's sigmoid squash as t rises
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(240,165,0,0.16)";
    for (const line of GRID_LINES) {
      ctx.beginPath();
      line.forEach((p, i) => {
        const [cx, cy] = toCanvas(warp(p));
        if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }

    // decision boundary -- a straight line only in (h1,h2) space, fading in as t rises
    if (t > 0.02) {
      ctx.save();
      ctx.globalAlpha = t;
      ctx.strokeStyle = "#F0A500";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      const [cx1, cy1] = toCanvas(BOUNDARY[0]);
      const [cx2, cy2] = toCanvas(BOUNDARY[1]);
      ctx.beginPath(); ctx.moveTo(cx1, cy1); ctx.lineTo(cx2, cy2); ctx.stroke();
      ctx.restore();
    }

    // XOR points
    for (const p of XOR_POINTS) {
      const [cx, cy] = toCanvas(warp([p.x, p.y]));
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 1 ? "#F0A500" : "#5080DC";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // space label, crossfading from "input space" to "hidden space (h1, h2)"
    ctx.font = "10px var(--font-sans, sans-serif)";
    ctx.fillStyle = `rgba(240,165,0,${1 - t})`;
    ctx.fillText("input space (x₁, x₂)", PAD, 14);
    ctx.fillStyle = `rgba(240,165,0,${t})`;
    ctx.fillText("hidden space (h₁, h₂)", PAD, 14);
  }, [t]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current, container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} style={{ fontFamily: "var(--font-sans, sans-serif)", color: "var(--ink-hi, #eee)" }}>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: 320, borderRadius: 6, border: "1px solid var(--rim, #333)", background: "var(--depth, #111)" }}
      />
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 13, color: "var(--ink-mid, #aaa)" }}>
          Warp: input space (t=0) &rarr; hidden space (t=1)
          <input
            type="range" min={0} max={1} step={0.01} value={t}
            onChange={e => { pause(); setT(Number(e.target.value)); }}
            style={{ width: "100%", marginTop: 4, accentColor: "var(--prime, #F0A500)", cursor: "pointer" }}
          />
        </label>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-mid, #aaa)", display: "flex", gap: 20, flexWrap: "wrap" }}>
        <span>t = <strong style={{ color: "var(--prime, #F0A500)" }}>{t.toFixed(2)}</strong></span>
        <span style={{ color: "#F0A500" }}>&#9679; XOR = 1</span>
        <span style={{ color: "#5080DC" }}>&#9679; XOR = 0</span>
      </div>
      <p style={{ marginTop: 10, fontSize: 11, color: "var(--ink-low, #888)", lineHeight: 1.5 }}>
        Every grid line is straight in the raw input space -- no line can separate the amber corners from the blue corners here. Drag the slider (or press play) to watch the hidden layer's a = &sigma;(Wx + b) bend that same grid into curves: the two classes pull apart into two clusters, and by t=1 a single straight line (dashed) finally separates them. This is what every hidden layer in a network is doing to its input.
      </p>
    </div>
  );
});
