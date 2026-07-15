import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";

// A torus and a "mug" sampled on the SAME (u,v) grid, so every torus vertex has
// exactly one corresponding mug vertex -- per-vertex linear interpolation between
// the two therefore can never tear the surface, only bend it. u = position along
// the tube's closed centerline (0..2*PI), v = angle around the tube's small
// circular cross-section (0..2*PI). This is the classic "donut = coffee mug"
// picture: the torus's one hole becomes the mug's handle hole; nothing is cut or
// glued along the way -- it just sits next to the XOR grid-warp viz as a second,
// 3-D example of the same idea: a continuous function reshaping space.
const TWO_PI = Math.PI * 2;
const U_STEPS = 40;
const V_STEPS = 14;

// --- Torus (t=0): standard tube-around-a-circle formula. ---
const R_TORUS = 2.2;   // centerline circle radius
const R_TUBE = 0.7;    // tube (cross-section) radius, constant everywhere

// --- Mug (t=1): u still sweeps one closed loop, but for most of it (the "body"
// arc) the centerline stops moving azimuthally and instead traces a vertical
// down-the-outside / across-the-base / up-the-inside profile -- a "C" living in
// a single, slightly fanned angular wedge (fanned just enough to read as 3-D).
// The remaining short arc keeps sweeping azimuthally near the torus's own
// radius, offset outward, reading as a small handle stuck on the side. Both
// arcs are built so their two shared endpoints (u=0 and u=HANDLE_END) produce
// IDENTICAL (x,y,z) whichever formula evaluates them -- verified algebraically
// below -- which is what keeps the loop closed with no seam at u=0/2*PI. ---
const HANDLE_END = (50 * Math.PI) / 180; // 50 degrees, in radians
const CUP_H = 3.0;          // cup wall height (top rim down to base and back up)
const RHO_OUTER = 1.7;      // outer wall radius from the cup's vertical axis
const RHO_INNER = 0.9;      // inner wall radius (wall thickness = OUTER - INNER)
const BODY_TUBE = R_TUBE;   // body keeps the torus's own tube radius
const HANDLE_TUBE = 0.35;   // handle tapers thinner at its midpoint
const HANDLE_BULGE = 1.0;   // how far the handle's middle sticks out past the wall
const HANDLE_DIP = 0.3;     // slight vertical sag at the handle's middle

function smoothstep(e0, e1, x) {
  const tt = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return tt * tt * (3 - 2 * tt);
}

function torusPoint(u, v) {
  const rho = R_TORUS + R_TUBE * Math.cos(v);
  return [rho * Math.cos(u), rho * Math.sin(u), R_TUBE * Math.sin(v)];
}

function mugPoint(u, v) {
  let theta, rho0, z0, tube;
  if (u <= HANDLE_END) {
    // Handle arc, u in [0, HANDLE_END]. p=0 is the join with the body's END
    // (u -> 2*PI, wrapping to u=0); p=1 is the join with the body's START
    // (u=HANDLE_END). Bulges outward and dips slightly in the middle.
    const p = u / HANDLE_END;
    theta = u; // same azimuth as the torus -- "keeps close to the torus position"
    rho0 = RHO_INNER + (RHO_OUTER - RHO_INNER) * p + HANDLE_BULGE * Math.sin(Math.PI * p);
    z0 = CUP_H / 2 - HANDLE_DIP * Math.sin(Math.PI * p);
    tube = BODY_TUBE + (HANDLE_TUBE - BODY_TUBE) * Math.sin(Math.PI * p);
  } else {
    // Body arc, u in [HANDLE_END, 2*PI]. s=0 is the rim next to the handle's
    // p=1 end (top-outer); s=1 is the rim next to the handle's p=0 end
    // (top-inner), which is also exactly the u=0 point once u wraps.
    const s = (u - HANDLE_END) / (TWO_PI - HANDLE_END);
    theta = HANDLE_END * (1 - smoothstep(0, 1, s));                          // fans HANDLE_END -> 0
    z0 = (CUP_H / 2) * Math.cos(TWO_PI * s);                                 // top -> base -> top
    rho0 = RHO_OUTER + (RHO_INNER - RHO_OUTER) * smoothstep(0.30, 0.70, s);  // outer wall -> base -> inner wall
    tube = BODY_TUBE;
  }
  const rho = rho0 + tube * Math.cos(v);
  return [rho * Math.cos(theta), rho * Math.sin(theta), z0 + tube * Math.sin(v)];
}
// Junction check (by construction, not runtime-asserted): at u=0, the handle
// formula (p=0) gives theta=0, rho0=RHO_INNER, z0=CUP_H/2, tube=BODY_TUBE --
// exactly what the body formula gives at s=1 (theta=0, rho0=RHO_INNER,
// z0=CUP_H/2, tube=BODY_TUBE). At u=HANDLE_END, the handle formula (p=1) gives
// theta=HANDLE_END, rho0=RHO_OUTER, z0=CUP_H/2, tube=BODY_TUBE -- exactly what
// the body formula gives at s=0. Both seams match exactly, so the loop closes.

// u/v sample parameters, precomputed once (shared by every t).
const U_VALS = Array.from({ length: U_STEPS }, (_, i) => (i / U_STEPS) * TWO_PI);
const V_VALS = Array.from({ length: V_STEPS }, (_, i) => (i / V_STEPS) * TWO_PI);

function worldPoint(ui, vi, t) {
  const u = U_VALS[ui], v = V_VALS[vi];
  const a = torusPoint(u, v);
  const b = mugPoint(u, v);
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// Fixed oblique 3-D -> 2-D projection (same style as SVMViz's "Kernel lift"
// mode: a static elevation + azimuth "camera," no rotation needed over time).
const CAM_AZ = -0.7;
const CAM_EL = 0.5;
function project(x, y, z) {
  const x1 = x * Math.cos(CAM_AZ) - y * Math.sin(CAM_AZ);
  const y1 = x * Math.sin(CAM_AZ) + y * Math.cos(CAM_AZ);
  const yProj = y1 * Math.sin(CAM_EL) + z * Math.cos(CAM_EL);
  return [x1, yProj];
}

const WORLD_RANGE = 3.3; // half-extent that comfortably fits both endpoint shapes

export const DonutCupViz = forwardRef(function DonutCupViz(props, ref) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [t, setT] = useState(0); // 0 = torus, 1 = mug
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
    const scale = Math.min(Wpx, Hpx) / (WORLD_RANGE * 2);
    const cx0 = Wpx / 2, cy0 = Hpx / 2;
    ctx.clearRect(0, 0, Wpx, Hpx);

    function toCanvas(x, y, z) {
      const [X, Y] = project(x, y, z);
      return [cx0 + X * scale, cy0 - Y * scale];
    }

    // Project the whole (u,v) grid once per frame.
    const proj = [];
    for (let i = 0; i < U_STEPS; i++) {
      const row = [];
      for (let j = 0; j < V_STEPS; j++) {
        const [x, y, z] = worldPoint(i, j, t);
        row.push(toCanvas(x, y, z));
      }
      proj.push(row);
    }

    // Cross-section circles: constant u, sweeping v -- the tube's "rings."
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(240,165,0,0.28)";
    for (let i = 0; i < U_STEPS; i++) {
      ctx.beginPath();
      for (let j = 0; j <= V_STEPS; j++) {
        const [px, py] = proj[i][j % V_STEPS];
        if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Meridians: constant v, sweeping u -- each one runs the full closed loop,
    // wrapping the u index back to 0 at the end. That wrap IS the "no seam"
    // guarantee made visible: nothing needs to be drawn specially at u=2*PI.
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = "rgba(240,165,0,0.62)";
    for (let j = 0; j < V_STEPS; j++) {
      ctx.beginPath();
      for (let i = 0; i <= U_STEPS; i++) {
        const [px, py] = proj[i % U_STEPS][j];
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
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
      <div style={{ fontSize: 12, color: "var(--ink-mid, #aaa)", marginBottom: 6 }}>
        t=0: torus (genus 1) &rarr; t=1: mug -- same genus, same hole, no tearing
      </div>
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: 320, borderRadius: 6, border: "1px solid var(--rim, #333)", background: "var(--depth, #111)" }}
      />
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 13, color: "var(--ink-mid, #aaa)" }}>
          Deform: torus (t=0) &rarr; mug (t=1)
          <input
            type="range" min={0} max={1} step={0.01} value={t}
            onChange={e => { pause(); setT(Number(e.target.value)); }}
            style={{ width: "100%", marginTop: 4, accentColor: "var(--prime, #F0A500)", cursor: "pointer" }}
          />
        </label>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-mid, #aaa)", display: "flex", gap: 20, flexWrap: "wrap" }}>
        <span>t = <strong style={{ color: "var(--prime, #F0A500)" }}>{t.toFixed(2)}</strong></span>
      </div>
      <p style={{ marginTop: 10, fontSize: 11, color: "var(--ink-low, #888)", lineHeight: 1.5 }}>
        Every point on the mug corresponds to exactly one point on the torus -- same (u,v) grid, just linearly interpolated in x, y, z as t goes from 0 to 1. Drag the slider (or press play) to watch the donut's single big loop unroll into the cup's wall (down the outside, across the base, up the inside) while a short stretch of that same loop stays put and reads as the handle. Nothing is cut and nothing is glued: that's what "continuous" means for a deforming shape -- a small change in (u, v, t) only ever produces a small change in the output point, so the surface can bend arbitrarily far without ever tearing. The XOR grid above warps a flat 2-D input space; this one warps a closed 3-D surface -- same idea, one more dimension.
      </p>
    </div>
  );
});
