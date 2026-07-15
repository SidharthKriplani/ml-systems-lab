import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";

// The module's own worked example: A = [[4,1],[1,4]], eigenvalues 5 and 3,
// eigenvectors [1,1]/sqrt(2) and [1,-1]/sqrt(2) -- same numbers the text already
// walked through as a sum of rank-1 projectors. Visualizing exactly this matrix
// means the picture matches what the reader just read, not a fresh example.
const A = [[4, 1], [1, 4]];
const LAMBDA1 = 5, LAMBDA2 = 3;
const SQ2 = Math.SQRT2;
const V1 = [1 / SQ2, 1 / SQ2];   // unit eigenvector, eigenvalue 5
const V2 = [1 / SQ2, -1 / SQ2];  // unit eigenvector, eigenvalue 3

function applyM(t, [x, y]) {
  // M(t) = I + t*(A - I): identity at t=0, the full matrix A at t=1.
  const m00 = 1 + t * (A[0][0] - 1), m01 = t * A[0][1];
  const m10 = t * A[1][0], m11 = 1 + t * (A[1][1] - 1);
  return [m00 * x + m01 * y, m10 * x + m11 * y];
}

const GRID_EXTENT = 1.2;
const GRID_N = 8;
// Grid lines stay straight under any linear map -- only the two endpoints matter.
const GRID_LINES = (() => {
  const lines = [];
  for (let i = -GRID_N; i <= GRID_N; i++) {
    const v = (i / GRID_N) * GRID_EXTENT;
    lines.push([[-GRID_EXTENT, v], [GRID_EXTENT, v]]);
    lines.push([[v, -GRID_EXTENT], [v, GRID_EXTENT]]);
  }
  return lines;
})();

const CIRCLE_SAMPLES = 72;
const UNIT_CIRCLE = Array.from({ length: CIRCLE_SAMPLES + 1 }, (_, i) => {
  const a = (i / CIRCLE_SAMPLES) * Math.PI * 2;
  return [Math.cos(a), Math.sin(a)];
});

const RANGE = 6.2; // canvas world half-extent, fits the t=1 stretched ellipse (semi-axes 5, 3)

export const EigenGeometryViz = forwardRef(function EigenGeometryViz(props, ref) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [t, setT] = useState(0); // 0 = identity (unit circle), 1 = full A (the ellipse)
  const rafRef = useRef(null);
  const dirRef = useRef(1);
  const lastTsRef = useRef(0);
  const holdRef = useRef(0);

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
    const PAD = 20;
    const plotW = Wpx - PAD * 2, plotH = Hpx - PAD * 2;
    const scale = Math.min(plotW, plotH) / (RANGE * 2);
    const cx0 = Wpx / 2, cy0 = Hpx / 2;
    ctx.clearRect(0, 0, Wpx, Hpx);

    function toCanvas([x, y]) {
      return [cx0 + x * scale, cy0 - y * scale];
    }

    // grid, warped by M(t)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(240,165,0,0.16)";
    for (const [p0, p1] of GRID_LINES) {
      const [cx1, cy1] = toCanvas(applyM(t, p0));
      const [cx2, cy2] = toCanvas(applyM(t, p1));
      ctx.beginPath(); ctx.moveTo(cx1, cy1); ctx.lineTo(cx2, cy2); ctx.stroke();
    }

    // unit circle -> ellipse
    ctx.beginPath();
    UNIT_CIRCLE.forEach((p, i) => {
      const [cx, cy] = toCanvas(applyM(t, p));
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    });
    ctx.strokeStyle = "#F0A500";
    ctx.lineWidth = 2;
    ctx.stroke();

    // eigenvector arrows, growing from unit length to their own eigenvalue's length --
    // direction never changes, only magnitude, which is Av = lambda*v made visible.
    function drawArrow(v, lambda, color, label) {
      const len = 1 + t * (lambda - 1);
      const tip = [v[0] * len, v[1] * len];
      const [ox, oy] = toCanvas([0, 0]);
      const [tx, ty] = toCanvas(tip);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(tx, ty); ctx.stroke();
      const ang = Math.atan2(ty - oy, tx - ox);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - 9 * Math.cos(ang - 0.4), ty - 9 * Math.sin(ang - 0.4));
      ctx.lineTo(tx - 9 * Math.cos(ang + 0.4), ty - 9 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.font = "11px var(--font-mono, monospace)";
      ctx.fillText(label, tx + 8, ty);
    }
    drawArrow(V1, LAMBDA1, "#F0A500", `λ₁v₁ = ${(1 + t * (LAMBDA1 - 1)).toFixed(1)}`);
    drawArrow(V2, LAMBDA2, "#5080DC", `λ₂v₂ = ${(1 + t * (LAMBDA2 - 1)).toFixed(1)}`);

    ctx.fillStyle = "rgba(230,230,230,0.6)";
    ctx.font = "10px var(--font-sans, sans-serif)";
    ctx.fillText(t < 0.05 ? "unit circle, t=0 (identity)" : "A = [[4,1],[1,4]] applied at t=" + t.toFixed(2), PAD, 16);
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
          Apply A: identity (t=0) &rarr; A = [[4,1],[1,4]] (t=1)
          <input
            type="range" min={0} max={1} step={0.01} value={t}
            onChange={e => { pause(); setT(Number(e.target.value)); }}
            style={{ width: "100%", marginTop: 4, accentColor: "var(--prime, #F0A500)", cursor: "pointer" }}
          />
        </label>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-mid, #aaa)", display: "flex", gap: 20, flexWrap: "wrap" }}>
        <span>t = <strong style={{ color: "var(--prime, #F0A500)" }}>{t.toFixed(2)}</strong></span>
        <span style={{ color: "#F0A500" }}>&#9679; v₁ = [1,1]/√2, λ₁ = 5</span>
        <span style={{ color: "#5080DC" }}>&#9679; v₂ = [1,-1]/√2, λ₂ = 3</span>
      </div>
      <p style={{ marginTop: 10, fontSize: 11, color: "var(--ink-low, #888)", lineHeight: 1.5 }}>
        Drag the slider (or press play) to watch A = [[4,1],[1,4]] act on space: the grid stays straight (it's a linear map) but stretches, and the unit circle becomes an ellipse. The two eigenvector arrows never change direction as t rises -- Av = &lambda;v means A only scales along v₁ and v₂, by exactly 5&times; and 3&times;. Every other direction is some mix of these two, so it rotates *and* stretches; only the eigenvectors don't rotate at all.
      </p>
    </div>
  );
});
