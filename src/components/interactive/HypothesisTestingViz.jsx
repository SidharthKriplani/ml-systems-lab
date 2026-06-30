import React, { useState, useRef, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';

// erf approximation (Horner form of Abramowitz & Stegun 7.1.26)
function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.47047 * x);
  const poly = t * (0.3480242 + t * (-0.0958798 + t * 0.7478556));
  const result = 1 - poly * Math.exp(-x * x);
  return sign * result;
}

function normalCDF(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function normalPDF(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

function computeStats(muA, muB, sigma, n) {
  const se = sigma * Math.sqrt(2 / n);
  const t = (muB - muA) / se;
  const pOneTail = 1 - normalCDF(Math.abs(t));
  const pTwoTail = 2 * pOneTail;
  const cohenD = (muB - muA) / sigma;
  const power = normalCDF(Math.abs(muB - muA) / se - 1.645);
  return { t, pTwoTail, cohenD, power };
}

const CW = 500;
const CH = 200;
const PAD = { top: 16, right: 20, bottom: 36, left: 20 };

export const HypothesisTestingViz = forwardRef(function HypothesisTestingViz(props, ref) {
  const [muA, setMuA] = useState(0.80);
  const [muB, setMuB] = useState(0.84);
  const [sigma, setSigma] = useState(0.03);
  const [n, setN] = useState(50);

  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const stats = useMemo(() => computeStats(muA, muB, sigma, n), [muA, muB, sigma, n]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.scale(dpr, dpr);
    const cs = getComputedStyle(canvas);

    const prime    = cs.getPropertyValue('--prime').trim()     || '#F0A500';
    const inkMid   = cs.getPropertyValue('--ink-mid').trim()   || '#94a3b8';
    const inkLow   = cs.getPropertyValue('--ink-low').trim()   || '#64748b';
    const rim      = cs.getPropertyValue('--rim').trim()       || '#334155';
    const depth    = cs.getPropertyValue('--depth').trim()     || '#0f172a';

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = depth;
    ctx.fillRect(0, 0, W, H);

    // Determine x range: cover muA±4σ and muB±4σ
    const xMin = Math.min(muA, muB) - 5 * sigma;
    const xMax = Math.max(muA, muB) + 5 * sigma;
    const xRange = xMax - xMin;

    function toX(v) { return PAD.left + ((v - xMin) / xRange) * plotW; }
    function toY(v, maxPDF) { return PAD.top + plotH - (v / maxPDF) * plotH * 0.9; }

    // Max PDF for scaling
    const maxPDF = normalPDF(muA, muA, sigma);

    const steps = 300;
    const dx = xRange / steps;

    // SE of the mean
    const seMean = sigma / Math.sqrt(n);

    // Alpha thresholds for A (95% CI of sampling dist of A)
    const ciLoA = muA - 1.96 * seMean;
    const ciHiA = muA + 1.96 * seMean;

    // --- Shade tail area (p-value region) ---
    // Tail beyond ciHiA on the right side, in red
    ctx.beginPath();
    let firstTail = true;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      if (x < ciHiA) continue;
      const y = normalPDF(x, muA, sigma);
      const cx = toX(x);
      const cy = toY(y, maxPDF);
      if (firstTail) {
        ctx.moveTo(cx, PAD.top + plotH);
        ctx.lineTo(cx, cy);
        firstTail = false;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.lineTo(toX(xMax), PAD.top + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(239,68,68,0.35)';
    ctx.fill();

    // Left tail too
    ctx.beginPath();
    let firstLTail = true;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      if (x > ciLoA) break;
      const y = normalPDF(x, muA, sigma);
      const cx = toX(x);
      const cy = toY(y, maxPDF);
      if (firstLTail) {
        ctx.moveTo(toX(xMin), PAD.top + plotH);
        ctx.lineTo(cx, cy);
        firstLTail = false;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.lineTo(toX(ciLoA), PAD.top + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(239,68,68,0.35)';
    ctx.fill();

    // --- Distribution A fill ---
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = normalPDF(x, muA, sigma);
      const cx = toX(x);
      const cy = toY(y, maxPDF);
      if (i === 0) ctx.moveTo(cx, PAD.top + plotH);
      ctx.lineTo(cx, cy);
    }
    ctx.lineTo(toX(xMax), PAD.top + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(96,165,250,0.20)';
    ctx.fill();

    // --- Distribution A stroke ---
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = normalPDF(x, muA, sigma);
      const cx = toX(x);
      const cy = toY(y, maxPDF);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Distribution B fill ---
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = normalPDF(x, muB, sigma);
      const cx = toX(x);
      const cy = toY(y, maxPDF);
      if (i === 0) ctx.moveTo(cx, PAD.top + plotH);
      ctx.lineTo(cx, cy);
    }
    ctx.lineTo(toX(xMax), PAD.top + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(240,165,0,0.20)';
    ctx.fill();

    // --- Distribution B stroke ---
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = normalPDF(x, muB, sigma);
      const cx = toX(x);
      const cy = toY(y, maxPDF);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = prime;
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- Alpha boundary lines (95% CI of A) ---
    const ciColors = ['rgba(239,68,68,0.8)', 'rgba(239,68,68,0.8)'];
    [ciLoA, ciHiA].forEach((v, idx) => {
      const cx = toX(v);
      ctx.beginPath();
      ctx.moveTo(cx, PAD.top);
      ctx.lineTo(cx, PAD.top + plotH);
      ctx.strokeStyle = ciColors[idx];
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // --- Mean lines ---
    [{ mu: muA, color: '#60a5fa', label: 'μ_A' }, { mu: muB, color: prime, label: 'μ_B' }].forEach(({ mu, color, label }) => {
      const cx = toX(mu);
      const peakY = toY(maxPDF, maxPDF);
      ctx.beginPath();
      ctx.moveTo(cx, peakY);
      ctx.lineTo(cx, PAD.top + plotH);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = `11px var(--font-mono, monospace)`;
      ctx.textAlign = 'center';
      ctx.fillText(label, cx, peakY - 4);
    });

    // --- X axis ---
    ctx.strokeStyle = inkMid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top + plotH);
    ctx.lineTo(W - PAD.right, PAD.top + plotH);
    ctx.stroke();

    // X axis ticks
    ctx.fillStyle = inkLow;
    ctx.font = `10px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    const tickCount = 6;
    for (let i = 0; i <= tickCount; i++) {
      const v = xMin + (i / tickCount) * xRange;
      const cx = toX(v);
      ctx.fillText(v.toFixed(2), cx, PAD.top + plotH + 14);
      ctx.beginPath();
      ctx.moveTo(cx, PAD.top + plotH);
      ctx.lineTo(cx, PAD.top + plotH + 4);
      ctx.strokeStyle = rim;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Legend
    const legendY = PAD.top + 10;
    ctx.font = `11px var(--font-sans, sans-serif)`;
    [
      { color: '#60a5fa', text: 'Model A (baseline)' },
      { color: prime,    text: 'Model B (new)' },
      { color: 'rgba(239,68,68,0.8)', text: 'p-value region' },
    ].forEach(({ color, text }, i) => {
      const lx = PAD.left + 8 + i * 150;
      ctx.fillStyle = color;
      ctx.fillRect(lx, legendY, 12, 10);
      ctx.fillStyle = inkMid;
      ctx.textAlign = 'left';
      ctx.fillText(text, lx + 16, legendY + 9);
    });

  }, [muA, muB, sigma, n, stats]);

  const play = useCallback(() => {
    if (animRef.current) return
    let lastTime = 0
    const tick = (time) => {
      if (time - lastTime >= 100) {
        lastTime = time
        setMuB(b => {
          const nb = Math.min(0.90, b + 0.005)
          if (nb >= 0.90) { animRef.current = null; return nb }
          return nb
        })
      }
      if (animRef.current !== null) animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [])

  const pause = useCallback(() => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
  }, [])

  const reset = useCallback(() => {
    pause()
    setMuA(0.80); setMuB(0.84); setSigma(0.03); setN(50)
  }, [pause])

  const step = useCallback(() => {
    pause()
    setMuB(b => Math.min(0.90, +(b + 0.01).toFixed(3)))
  }, [pause])

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step])

  const sig = stats.pTwoTail < 0.05;
  const fmt = (v, d = 4) => v.toFixed(d);

  const sliders = [
    { label: 'Baseline accuracy μ_A', value: muA, set: setMuA, min: 0.70, max: 0.90, step: 0.01 },
    { label: 'New model accuracy μ_B', value: muB, set: setMuB, min: 0.70, max: 0.90, step: 0.01 },
    { label: 'Measurement noise σ',    value: sigma, set: setSigma, min: 0.01, max: 0.06, step: 0.005 },
    { label: 'Samples n',                   value: n,     set: setN,     min: 10,   max: 200,  step: 5,     fmt: v => v.toFixed(0) },
  ];

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '560px',
    }}>
      <h3 style={{ color: 'var(--ink-hi)', margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
        Hypothesis Testing: Two-Sample t-Test
      </h3>

      <canvas
        ref={canvasRef}
        style={{ display: 'block', borderRadius: '8px', maxWidth: '100%', width: '100%', height: `${CH}px` }}
      />

      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sliders.map(({ label, value, set, min, max, step, fmt: fmtFn }) => (
          <div key={label}>
            <label style={{
              display: 'flex', justifyContent: 'space-between',
              color: 'var(--ink-mid)', fontSize: '12px', marginBottom: '4px',
            }}>
              <span>{label}</span>
              <span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {fmtFn ? fmtFn(value) : value.toFixed(2)}
              </span>
            </label>
            <input
              type="range" min={min} max={max} step={step} value={value}
              onChange={e => set(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--prime)' }}
            />
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '16px',
      }}>
        {[
          ['t-statistic', fmt(stats.t, 3)],
          ['p-value', fmt(stats.pTwoTail, 4)],
          ['Cohen\'s d', fmt(stats.cohenD, 3)],
        ].map(([label, val]) => (
          <div key={label} style={{
            background: 'var(--depth)', border: '1px solid var(--rim)',
            borderRadius: '8px', padding: '10px 8px', textAlign: 'center',
          }}>
            <div style={{ color: 'var(--ink-low)', fontSize: '10px', marginBottom: '4px' }}>{label}</div>
            <div style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px',
      }}>
        <div style={{
          background: 'var(--depth)', border: `1px solid ${sig ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
          borderRadius: '8px', padding: '10px 8px', textAlign: 'center',
        }}>
          <div style={{ color: 'var(--ink-low)', fontSize: '10px', marginBottom: '4px' }}>
            Significance at α=0.05
          </div>
          <div style={{
            color: sig ? '#4ade80' : '#f87171',
            fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700,
          }}>
            {sig ? 'YES' : 'NO'}
          </div>
        </div>
        <div style={{
          background: 'var(--depth)', border: '1px solid var(--rim)',
          borderRadius: '8px', padding: '10px 8px', textAlign: 'center',
        }}>
          <div style={{ color: 'var(--ink-low)', fontSize: '10px', marginBottom: '4px' }}>Power (1-β)</div>
          <div style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600 }}>
            {(stats.power * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '16px', padding: '12px 14px',
        background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '8px',
        color: 'var(--ink-mid)', fontSize: '11.5px', lineHeight: 1.6,
      }}>
        p-value is the probability of seeing this result if the null hypothesis (no difference) were true.
        p &lt; 0.05 means the difference is unlikely to be random noise — but sample size matters.
        A tiny p-value with n=200 might mean a practically meaningless 0.1% improvement.
      </div>
    </div>
  );
})
