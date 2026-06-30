import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ─── Latent space constants ───────────────────────────────────────────────────
const CENTERS = [[-2, -1.5], [1.5, -2], [2, 1.5], [-1.5, 2], [0, 0]];
const COLORS  = ['#4a9ebb', '#e85d4a', '#4eb87c', 'var(--prime)', '#9b7fd4'];
const LABELS  = ['Class A', 'Class B', 'Class C', 'Class D', 'Class E'];
const STD     = 0.7;
const AXIS_MIN = -4;
const AXIS_MAX = 4;
const GRID_N   = 12;

function generatePoints() {
  const rng = mulberry32(42);
  const pts = [];
  for (let c = 0; c < CENTERS.length; c++) {
    for (let i = 0; i < 40; i++) {
      const u1 = Math.max(1e-15, rng());
      const u2 = rng();
      const nx = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const u3 = Math.max(1e-15, rng());
      const u4 = rng();
      const ny = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);
      pts.push({ z1: CENTERS[c][0] + STD * nx, z2: CENTERS[c][1] + STD * ny, cls: c });
    }
  }
  return pts;
}

const POINTS = generatePoints();

// ─── Decode: produce 12×12 intensity grid from z1, z2 ────────────────────────
function decode(z1, z2) {
  const grid = [];
  for (let row = 0; row < GRID_N; row++) {
    const rowArr = [];
    for (let col = 0; col < GRID_N; col++) {
      const r = (row / (GRID_N - 1)) * 2 - 1;
      const c = (col / (GRID_N - 1)) * 2 - 1;
      const val =
        Math.sin(z1 * r + z2 * c) * 0.5 +
        Math.cos((z1 + z2) * (r + c) * 0.5) * 0.3 +
        (z1 * z2 * r * c) * 0.2;
      rowArr.push(Math.max(0, Math.min(1, (val + 1) / 2)));
    }
    grid.push(rowArr);
  }
  return grid;
}

// ─── Nearest class ────────────────────────────────────────────────────────────
function nearestClass(z1, z2) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < CENTERS.length; i++) {
    const d = Math.sqrt((z1 - CENTERS[i][0]) ** 2 + (z2 - CENTERS[i][1]) ** 2);
    if (d < bestD) { bestD = d; best = i; }
  }
  return { cls: best, d: bestD };
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────
function latentToCanvas(z, w, h, pad) {
  const range = AXIS_MAX - AXIS_MIN;
  return {
    x: pad + ((z.z1 - AXIS_MIN) / range) * (w - 2 * pad),
    y: pad + ((AXIS_MAX - z.z2) / range) * (h - 2 * pad),
  };
}

function canvasToLatent(cx, cy, w, h, pad) {
  const range = AXIS_MAX - AXIS_MIN;
  const z1 = AXIS_MIN + ((cx - pad) / (w - 2 * pad)) * range;
  const z2 = AXIS_MAX - ((cy - pad) / (h - 2 * pad)) * range;
  return { z1, z2 };
}

// ─── Main component ───────────────────────────────────────────────────────────
export function VAEViz() {
  const scatterRef = useRef(null);
  const [sample, setSample] = useState(null); // { z1, z2 }
  const [hovered, setHovered] = useState(null);

  // Draw scatter plot
  const drawScatter = useCallback(() => {
    const canvas = scatterRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = 36;

    // Background
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--depth') || '#111';
    ctx.fillRect(0, 0, w, h);

    const axW = w - 2 * pad;
    const axH = h - 2 * pad;

    // Unit circle (KL prior)
    const range = AXIS_MAX - AXIS_MIN;
    const scaleX = axW / range;
    const scaleY = axH / range;
    const cx = pad + (0 - AXIS_MIN) * scaleX;
    const cy = pad + (AXIS_MAX - 0) * scaleY;
    const rx = scaleX; // radius 1 in z-space
    const ry = scaleY;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.8;
    for (let v = AXIS_MIN; v <= AXIS_MAX; v++) {
      const x = pad + (v - AXIS_MIN) * scaleX;
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, pad + axH); ctx.stroke();
      const y = pad + (AXIS_MAX - v) * scaleY;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(pad + axW, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    // x-axis
    ctx.beginPath();
    ctx.moveTo(pad, pad + axH); ctx.lineTo(pad + axW, pad + axH); ctx.stroke();
    // y-axis
    ctx.beginPath();
    ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + axH); ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let v = AXIS_MIN; v <= AXIS_MAX; v += 2) {
      const x = pad + (v - AXIS_MIN) * scaleX;
      ctx.fillText(v, x, pad + axH + 13);
    }
    ctx.textAlign = 'right';
    for (let v = AXIS_MIN; v <= AXIS_MAX; v += 2) {
      const y = pad + (AXIS_MAX - v) * scaleY;
      ctx.fillText(v, pad - 4, y + 3);
    }

    // Axis name labels
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('z₁', pad + axW / 2, pad + axH + 28);
    ctx.save();
    ctx.translate(12, pad + axH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('z₂', 0, 0);
    ctx.restore();

    // Data points
    for (const pt of POINTS) {
      const px = pad + (pt.z1 - AXIS_MIN) * scaleX;
      const py = pad + (AXIS_MAX - pt.z2) * scaleY;
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      const col = COLORS[pt.cls];
      ctx.fillStyle = col.startsWith('var') ? '#f5b942' : col;
      ctx.globalAlpha = 0.75;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Hovered point highlight
    if (hovered) {
      const hx = pad + (hovered.z1 - AXIS_MIN) * scaleX;
      const hy = pad + (AXIS_MAX - hovered.z2) * scaleY;
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Sample point (★ star)
    if (sample) {
      const sx = pad + (sample.z1 - AXIS_MIN) * scaleX;
      const sy = pad + (AXIS_MAX - sample.z2) * scaleY;

      // Crosshair
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(sx, pad); ctx.lineTo(sx, pad + axH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, sy); ctx.lineTo(pad + axW, sy); ctx.stroke();
      ctx.setLineDash([]);

      // Star
      const starPoints = 5;
      const outerR = 9;
      const innerR = 4;
      ctx.beginPath();
      for (let i = 0; i < starPoints * 2; i++) {
        const angle = (i * Math.PI) / starPoints - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = sx + r * Math.cos(angle);
        const y = sy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [sample, hovered]);

  useEffect(() => {
    drawScatter();
  }, [drawScatter]);

  // ResizeObserver
  useEffect(() => {
    const canvas = scatterRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => drawScatter());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [drawScatter]);

  // Click handler
  const handleCanvasClick = useCallback((e) => {
    const canvas = scatterRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pad = 36;
    const { z1, z2 } = canvasToLatent(cx, cy, w, h, pad);
    if (z1 < AXIS_MIN || z1 > AXIS_MAX || z2 < AXIS_MIN || z2 > AXIS_MAX) return;
    setSample({ z1, z2 });
  }, []);

  // Hover handler
  const handleMouseMove = useCallback((e) => {
    const canvas = scatterRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const pad = 36;
    const { z1, z2 } = canvasToLatent(cx, cy, w, h, pad);
    if (z1 < AXIS_MIN || z1 > AXIS_MAX || z2 < AXIS_MIN || z2 > AXIS_MAX) {
      setHovered(null);
    } else {
      setHovered({ z1, z2 });
    }
  }, []);

  const handleMouseLeave = useCallback(() => setHovered(null), []);

  // Random sample
  const sampleRandom = useCallback(() => {
    const rng = mulberry32(Date.now() & 0xFFFFFFFF);
    const z1 = AXIS_MIN + rng() * (AXIS_MAX - AXIS_MIN);
    const z2 = AXIS_MIN + rng() * (AXIS_MAX - AXIS_MIN);
    setSample({ z1, z2 });
  }, []);

  // Decoder output
  const decoderGrid = sample ? decode(sample.z1, sample.z2) : null;
  const nearInfo = sample ? nearestClass(sample.z1, sample.z2) : null;

  // Pixel color for intensity
  function intensityToColor(v) {
    // Use prime color blended from depth to prime
    const r = Math.round(30 + v * 225);
    const g = Math.round(30 + v * 155);
    const b = Math.round(30 + v * 40);
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Title */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.2rem' }}>
          VAE Latent Space Explorer
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          Click the scatter plot to sample a latent point and see the decoded output
        </div>
      </div>

      {/* Two-panel layout */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Left: Scatter */}
        <div style={{ flex: '0 0 55%' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-ghost)', marginBottom: '0.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            2D Latent Space
          </div>
          <canvas
            ref={scatterRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              width: '100%',
              height: '260px',
              borderRadius: '6px',
              cursor: 'crosshair',
              display: 'block',
              background: 'var(--depth)',
            }}
          />
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 0.8rem', marginTop: '0.5rem' }}>
            {LABELS.map((lbl, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', color: 'var(--ink-ghost)' }}>
                <span style={{
                  width: 9, height: 9, borderRadius: '50%', display: 'inline-block',
                  background: COLORS[i].startsWith('var') ? '#f5b942' : COLORS[i],
                  flexShrink: 0,
                }} />
                {lbl}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.73rem', color: 'var(--ink-ghost)' }}>
              <span style={{ fontSize: '0.85rem' }}>★</span> Sample
            </div>
          </div>
          {/* Sample coords */}
          {sample && (
            <div style={{ marginTop: '0.45rem', fontSize: '0.77rem', color: 'var(--ink-ghost)', fontFamily: 'monospace' }}>
              z = ({sample.z1.toFixed(2)}, {sample.z2.toFixed(2)})
            </div>
          )}
        </div>

        {/* Right: Decoder */}
        <div style={{ flex: '0 0 calc(45% - 1rem)', minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-ghost)', marginBottom: '0.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Decoded Output
          </div>
          <div style={{
            background: 'var(--depth)',
            borderRadius: '6px',
            padding: '1rem',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {!sample ? (
              <div style={{ color: 'var(--ink-ghost)', fontSize: '0.82rem', textAlign: 'center' }}>
                Click a point in the latent space<br />to see the decoded output
              </div>
            ) : (
              <>
                {/* Pixel art grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${GRID_N}, 16px)`,
                  gridTemplateRows: `repeat(${GRID_N}, 16px)`,
                  gap: '1px',
                  marginBottom: '0.7rem',
                }}>
                  {decoderGrid.map((row, ri) =>
                    row.map((val, ci) => (
                      <div
                        key={`${ri}-${ci}`}
                        style={{
                          width: 16,
                          height: 16,
                          background: intensityToColor(val),
                          borderRadius: '2px',
                        }}
                      />
                    ))
                  )}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--ink-ghost)', fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.6 }}>
                  Decoded at z = ({sample.z1.toFixed(2)}, {sample.z2.toFixed(2)})
                </div>
                {nearInfo && (
                  <div style={{ fontSize: '0.76rem', marginTop: '0.3rem', color: 'var(--ink-ghost)', textAlign: 'center' }}>
                    Nearest class:{' '}
                    <span style={{
                      color: COLORS[nearInfo.cls].startsWith('var') ? '#f5b942' : COLORS[nearInfo.cls],
                      fontWeight: 600,
                    }}>
                      {LABELS[nearInfo.cls]}
                    </span>{' '}
                    (d={nearInfo.d.toFixed(2)})
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
        <button
          onClick={sampleRandom}
          style={{
            padding: '0.38rem 0.85rem',
            fontSize: '0.8rem',
            background: 'var(--prime)',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Sample random
        </button>
        <button
          onClick={() => setSample(null)}
          disabled={!sample}
          style={{
            padding: '0.38rem 0.85rem',
            fontSize: '0.8rem',
            background: 'var(--depth)',
            color: sample ? 'var(--ink)' : 'var(--ink-ghost)',
            border: '1px solid var(--rim)',
            borderRadius: '5px',
            cursor: sample ? 'pointer' : 'default',
            fontWeight: 600,
          }}
        >
          Clear sample
        </button>
      </div>

      {/* KL note */}
      <div style={{
        marginTop: '0.8rem',
        padding: '0.55rem 0.75rem',
        background: 'var(--depth)',
        borderRadius: '5px',
        border: '1px solid var(--rim)',
        fontSize: '0.76rem',
        color: 'var(--ink-ghost)',
        lineHeight: 1.5,
      }}>
        KL loss penalises z values far from N(0,1). The unit Gaussian prior is shown as the dashed gray circle. Points near the origin are cheap in KL; distant points are penalised.
      </div>

      {/* VAE architecture diagram */}
      <div style={{
        marginTop: '0.9rem',
        padding: '0.65rem 0.9rem',
        background: 'var(--depth)',
        borderRadius: '6px',
        border: '1px solid var(--rim)',
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>
          Architecture
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--ink-ghost)', lineHeight: 1.7 }}>
          <span style={{ color: 'var(--ink)' }}>x</span>
          {' → '}
          <span style={{ border: '1px solid var(--rim)', padding: '1px 6px', borderRadius: 3, color: 'var(--ink)' }}>Encoder q(z|x)</span>
          {' → '}
          <span style={{ border: '1px solid var(--prime)', padding: '1px 6px', borderRadius: 3, color: 'var(--prime)' }}>μ, σ (latent)</span>
          {' → '}
          <span style={{ fontStyle: 'italic' }}>z = μ + σ·ε</span>
          {' → '}
          <span style={{ border: '1px solid var(--rim)', padding: '1px 6px', borderRadius: 3, color: 'var(--ink)' }}>Decoder p(x|z)</span>
          {' → '}
          <span style={{ color: 'var(--ink)' }}>x̂</span>
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--ink-ghost)', marginTop: '0.3rem' }}>
          ELBO = E[log p(x|z)] − β·KL[q(z|x) ‖ N(0,I)]
        </div>
      </div>
    </div>
  );
}
