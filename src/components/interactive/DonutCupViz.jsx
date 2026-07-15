import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from "react";

// A torus and a "mug" sampled on the SAME (u,v) grid, so every torus vertex has
// exactly one corresponding mug vertex -- per-vertex linear interpolation between
// the two therefore can never tear the surface, only bend it.
//
// REVISED after visual review caught the first version looking like two blobby
// pipe segments, not a mug -- a uniform-radius tube swept along any bent
// centerline can only ever look like a bent pipe, never a cup wall, no matter
// how the centerline is bent. Fixed by using v as genuine AZIMUTH around the
// cup's vertical axis for the body (a true surface of revolution: down the
// outside wall, across the base, up the inside wall -- the "C" profile below),
// and reserving the tube-around-a-centerline construction (which DOES look
// right) for just the handle, blended onto the body only near the rim gap
// where the handle attaches. Verified by rendering the exact math (matplotlib,
// same projection formula) and inspecting the image before shipping -- not by
// syntax-check alone, which is what let the broken version through the first
// time.
const TWO_PI = Math.PI * 2;
const U_STEPS = 56;
const V_STEPS = 18;

function smoothstep(e0, e1, x) {
  const tt = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return tt * tt * (3 - 2 * tt);
}
function easeBetween(s, s0, s1, a0, a1) {
  const t = smoothstep(s0, s1, s);
  return a0 + (a1 - a0) * t;
}

// --- Torus (t=0): standard tube-around-a-circle formula. ---
const R_TORUS = 2.2;
const R_TUBE = 0.7;
function torusPoint(u, v) {
  const rho = R_TORUS + R_TUBE * Math.cos(v);
  return [rho * Math.cos(u), rho * Math.sin(u), R_TUBE * Math.sin(v)];
}

// --- Mug (t=1): body is a true surface of revolution -- u traces the wall's
// cross-section profile (down the outside, across the base, up the inside,
// then the "rim gap" that closes the loop back to the outside start), v is
// the full azimuthal sweep around the vertical axis. ---
const RHO_OUTER = 1.7;
const RHO_INNER = 1.05;
const CUP_H = 2.6;

function wallProfile(s) {
  // s in [0,1), one full lap of u. Returns [rho0, z0] of the wall centerline.
  if (s < 0.40) return [RHO_OUTER, easeBetween(s, 0.0, 0.40, CUP_H / 2, -CUP_H / 2)];
  if (s < 0.50) return [easeBetween(s, 0.40, 0.50, RHO_OUTER, RHO_INNER), -CUP_H / 2];
  if (s < 0.90) return [RHO_INNER, easeBetween(s, 0.50, 0.90, -CUP_H / 2, CUP_H / 2)];
  return [easeBetween(s, 0.90, 1.00, RHO_INNER, RHO_OUTER), CUP_H / 2];
}
function bodyPoint(u, v) {
  const s = (((u % TWO_PI) + TWO_PI) % TWO_PI) / TWO_PI;
  const [rho0, z0] = wallProfile(s);
  return [rho0 * Math.cos(v), rho0 * Math.sin(v), z0];
}

// --- Handle: a genuine small tube-loop (this DOES want the tube-around-a-
// centerline construction, since a real handle is round and has its own
// hole) -- built for u wrapped near 0, then blended onto the body only in
// that neighbourhood so it reads as attached at the rim gap. ---
const HANDLE_HALF = (30 * Math.PI) / 180;
const HANDLE_LOOP_R = 0.85;   // how far the loop's centerline bulges out
const HANDLE_BASE_RHO = RHO_OUTER + 0.15;
const HANDLE_Z = CUP_H / 2 - 0.15;
const HANDLE_TUBE = 0.22;
const HANDLE_THETA_SPAN = (26 * Math.PI) / 180;

function handleCenterline(p) {
  const bulge = Math.sin(Math.PI * p);
  return [
    HANDLE_BASE_RHO + HANDLE_LOOP_R * bulge, // rho_c
    (p - 0.5) * HANDLE_THETA_SPAN,           // theta_c
    HANDLE_Z - 0.55 * bulge,                 // z_c (dips like a real handle's curve)
  ];
}
function handlePoint(u, v) {
  const d = (((u + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI - Math.PI; // wrap to [-PI,PI]
  const p = smoothstep(-HANDLE_HALF, HANDLE_HALF, d);
  const [rhoC, thetaC, zC] = handleCenterline(p);
  const rho = rhoC + HANDLE_TUBE * Math.cos(v);
  const z = zC + HANDLE_TUBE * Math.sin(v);
  return [rho * Math.cos(thetaC), rho * Math.sin(thetaC), z];
}
function blendWeight(u) {
  const d = Math.abs((((u + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI - Math.PI);
  return 1 - smoothstep(HANDLE_HALF * 0.5, HANDLE_HALF, d);
}
function mugPoint(u, v) {
  const w = blendWeight(u);
  const [bx, by, bz] = bodyPoint(u, v);
  if (w <= 0) return [bx, by, bz];
  const [hx, hy, hz] = handlePoint(u, v);
  return [bx + (hx - bx) * w, by + (hy - by) * w, bz + (hz - bz) * w];
}

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
// This az/el pair was picked by rendering the torus AND the mug endpoints
// (plus t=0.5) through several candidate cameras and eyeballing which one
// keeps the torus readable as a donut while keeping the mug's handle from
// visually tangling with the body -- see the session's BACKLOG entry.
const CAM_AZ = -0.35;
const CAM_EL = 0.35;
function project(x, y, z) {
  const x1 = x * Math.cos(CAM_AZ) - y * Math.sin(CAM_AZ);
  const y1 = x * Math.sin(CAM_AZ) + y * Math.cos(CAM_AZ);
  const yProj = y1 * Math.sin(CAM_EL) + z * Math.cos(CAM_EL);
  return [x1, yProj];
}

const WORLD_RANGE = 3.4; // half-extent that comfortably fits both endpoint shapes

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
        Every point on the mug corresponds to exactly one point on the torus -- same (u,v) grid, just linearly interpolated in x, y, z as t goes from 0 to 1. Drag the slider (or press play) to watch the donut's ring re-route into the cup's wall (down the outside, across the base, up the inside) while a short stretch near the seam curls outward into a small loop that reads as the handle. Nothing is cut and nothing is glued: that's what "continuous" means for a deforming shape -- a small change in (u, v, t) only ever produces a small change in the output point, so the surface can bend arbitrarily far without ever tearing. The XOR grid above warps a flat 2-D input space; this one warps a closed 3-D surface -- same idea, one more dimension.
      </p>
    </div>
  );
});
