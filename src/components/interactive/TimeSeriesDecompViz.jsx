import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// Seeded RNG — mulberry32
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSeries(trendSlope, seasonalAmplitude, noiseStd, seed) {
  const rng = mulberry32(seed);
  const n = 104;
  const series = [];
  const trend = [];
  const seasonal = [];
  const noise = [];
  const baseline = 50;
  for (let t = 0; t < n; t++) {
    const tr = baseline + trendSlope * t;
    const se = seasonalAmplitude * Math.sin(2 * Math.PI * t / 52);
    const u1 = rng(), u2 = rng();
    const no = noiseStd * Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
    trend.push(tr);
    seasonal.push(se);
    noise.push(no);
    series.push(tr + se + no);
  }
  return { series, trend, seasonal, noise };
}

function computeSNR(trend, seasonal, noise) {
  const signal = trend.map((tr, i) => tr + seasonal[i]);
  const signalMean = signal.reduce((a, b) => a + b, 0) / signal.length;
  const signalVar = signal.reduce((a, b) => a + (b - signalMean) ** 2, 0) / signal.length;
  const noiseMean = noise.reduce((a, b) => a + b, 0) / noise.length;
  const noiseVar = noise.reduce((a, b) => a + (b - noiseMean) ** 2, 0) / noise.length;
  if (noiseVar < 1e-10) return Infinity;
  return 10 * Math.log10(signalVar / noiseVar);
}

function dataRange(arr) {
  let mn = Infinity, mx = -Infinity;
  for (const v of arr) { if (v < mn) mn = v; if (v > mx) mx = v; }
  // Add some padding
  const pad = (mx - mn) * 0.12 || 1;
  return [mn - pad, mx + pad];
}

function drawDecomp(canvas, data) {
  const ctx = canvas.getContext('2d');
  // CRITICAL: use clientWidth/clientHeight for logical drawing after ctx.scale(dpr, dpr)
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  const cs = getComputedStyle(document.documentElement);
  const depth   = cs.getPropertyValue('--depth').trim()   || '#111827';
  const rim     = cs.getPropertyValue('--rim').trim()     || '#2a2a2a';
  const rimHi   = cs.getPropertyValue('--rim-hi').trim()  || '#3a3a3a';
  const prime   = cs.getPropertyValue('--prime').trim()   || '#F0A500';
  const inkLow  = cs.getPropertyValue('--ink-low').trim() || '#555';
  const inkMid  = cs.getPropertyValue('--ink-mid').trim() || '#888';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const { series, trend, seasonal, noise } = data;
  const n = series.length;

  // Panel layout (percentages of H)
  const leftPad = 54;
  const rightPad = 8;
  const topPad = 10;
  const bottomPad = 20;
  const dividerH = 1;

  // Panel height fractions
  const panelFracs = [0.35, 0.25, 0.20, 0.20];
  const drawH = H - topPad - bottomPad;

  // Cumulative top offsets for each panel
  const panelTops = [];
  let cumY = topPad;
  for (const frac of panelFracs) {
    panelTops.push(cumY);
    cumY += frac * drawH;
  }
  const panelHeights = panelFracs.map(f => f * drawH);

  const panels = [
    { label: 'Original', data: series,   color: '#60a5fa', bars: false },
    { label: 'Trend',    data: trend,    color: prime,     bars: false },
    { label: 'Seasonal', data: seasonal, color: '#4ade80', bars: false, baseline: true },
    { label: 'Residual', data: noise,    color: '#9ca3af', bars: true,  baseline: true },
  ];

  const plotW = W - leftPad - rightPad;

  panels.forEach((panel, pi) => {
    const pTop = panelTops[pi];
    const pH   = panelHeights[pi];
    const [yMin, yMax] = dataRange(panel.data);
    const ySpan = yMax - yMin;

    const toX = (i) => leftPad + (i / (n - 1)) * plotW;
    const toY = (v) => pTop + (1 - (v - yMin) / ySpan) * (pH - 4);

    // Panel background (subtle stripe)
    ctx.fillStyle = pi % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0)';
    ctx.fillRect(leftPad, pTop, plotW, pH);

    // Grid lines (horizontal, 3 per panel)
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.5;
    for (let gi = 0; gi <= 3; gi++) {
      const gy = pTop + (gi / 3) * (pH - 4);
      ctx.beginPath();
      ctx.moveTo(leftPad, gy);
      ctx.lineTo(leftPad + plotW, gy);
      ctx.stroke();
    }

    // Vertical grid lines (every 26 weeks ~= 6 months)
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.5;
    for (let w = 0; w <= n; w += 26) {
      const gx = toX(Math.min(w, n - 1));
      ctx.beginPath();
      ctx.moveTo(gx, pTop);
      ctx.lineTo(gx, pTop + pH);
      ctx.stroke();
    }

    // Y-axis baseline for seasonal / residual
    if (panel.baseline) {
      const baseY = toY(0);
      ctx.strokeStyle = rimHi;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftPad, baseY);
      ctx.lineTo(leftPad + plotW, baseY);
      ctx.stroke();
    }

    // Draw data
    if (panel.bars) {
      // Stem plot for residual
      const baseY = toY(0);
      for (let i = 0; i < n; i++) {
        const x = toX(i);
        const y = toY(panel.data[i]);
        const above = panel.data[i] >= 0;
        ctx.strokeStyle = above ? 'rgba(156,163,175,0.7)' : 'rgba(156,163,175,0.5)';
        ctx.lineWidth = Math.max(1.5, plotW / n - 0.5);
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else {
      // Line plot
      ctx.strokeStyle = panel.color;
      ctx.lineWidth = pi === 0 ? 1.5 : 1.8;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = toX(i);
        const y = toY(panel.data[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Y-axis label (left side, rotated)
    ctx.save();
    ctx.translate(10, pTop + pH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = panel.color;
    ctx.font = `bold 9px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    ctx.fillText(panel.label, 0, 0);
    ctx.restore();

    // Y-axis tick values (2 ticks: min and max, rounded)
    ctx.fillStyle = inkLow;
    ctx.font = `9px var(--font-mono, monospace)`;
    ctx.textAlign = 'right';
    const tickVals = [
      { v: yMax, y: pTop + 2 },
      { v: yMin, y: pTop + pH - 6 },
    ];
    for (const tv of tickVals) {
      const label = Math.abs(tv.v) < 100 ? tv.v.toFixed(1) : Math.round(tv.v).toString();
      ctx.fillText(label, leftPad - 4, tv.y + 7);
    }

    // Panel divider (below each panel except last)
    if (pi < panels.length - 1) {
      ctx.strokeStyle = rimHi;
      ctx.lineWidth = dividerH;
      const divY = pTop + pH;
      ctx.beginPath();
      ctx.moveTo(0, divY);
      ctx.lineTo(W, divY);
      ctx.stroke();
    }
  });

  // X-axis labels (weeks, at bottom)
  ctx.fillStyle = inkMid;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.textAlign = 'center';
  const xLabels = [0, 13, 26, 39, 52, 65, 78, 91, 103];
  for (const w of xLabels) {
    const x = leftPad + (w / (n - 1)) * plotW;
    ctx.fillText(`w${w}`, x, H - 4);
  }

  // Left axis line
  ctx.strokeStyle = rimHi;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftPad, topPad);
  ctx.lineTo(leftPad, H - bottomPad);
  ctx.stroke();
}

export const TimeSeriesDecompViz = forwardRef(function TimeSeriesDecompViz(props, ref) {
  const [slope, setSlope] = useState(0.2);
  const [amplitude, setAmplitude] = useState(15);
  const [noiseStd, setNoiseStd] = useState(5);
  const [seed, setSeed] = useState(0xabcdef);

  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const data = generateSeries(slope, amplitude, noiseStd, seed);
  const snr = computeSNR(data.trend, data.seasonal, data.noise);

  const snrColor = snr === Infinity ? '#22c55e'
    : snr > 10 ? '#22c55e'
    : snr > 5  ? '#f59e0b'
    : '#ef4444';

  const snrLabel = snr === Infinity ? '∞ dB (no noise)' : `${snr.toFixed(1)} dB`;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    drawDecomp(canvas, generateSeries(slope, amplitude, noiseStd, seed));
  }, [slope, amplitude, noiseStd, seed]);

  // ResizeObserver — DPR-aware canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      drawDecomp(canvas, generateSeries(slope, amplitude, noiseStd, seed));
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when params change
  useEffect(() => {
    redraw();
  }, [redraw]);

  const play = useCallback(() => {
    if (animRef.current) return;
    animRef.current = setInterval(() => {
      setSeed(s => (s + 1) & 0xffffff);
    }, 800);
  }, []);

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null; }
  }, []);

  const reset = useCallback(() => {
    pause();
    setSlope(0.2); setAmplitude(15); setNoiseStd(5); setSeed(0xabcdef);
  }, [pause]);

  const step = useCallback(() => {
    pause();
    setSeed(s => (s + 1) & 0xffffff);
  }, [pause]);

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step]);

  const sliderContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const labelStyle = {
    fontSize: '12px',
    color: 'var(--ink-low, #555)',
    fontFamily: 'var(--font-mono, monospace)',
  };

  const inputStyle = {
    width: '100%',
    accentColor: 'var(--prime, #F0A500)',
    cursor: 'pointer',
  };

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '6px',
          border: '1px solid var(--rim, #2a2a2a)',
          background: 'var(--depth, #111827)',
          display: 'block',
        }}
      />

      {/* Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        padding: '12px 14px',
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '6px',
      }}>
        {/* Trend slope */}
        <div style={sliderContainerStyle}>
          <label style={labelStyle}>
            {`Trend slope: ${slope.toFixed(2)}`}
          </label>
          <input
            type="range"
            min={-0.5} max={0.5} step={0.05}
            value={slope}
            onChange={e => setSlope(Number(e.target.value))}
            style={inputStyle}
          />
        </div>

        {/* Seasonal amplitude */}
        <div style={sliderContainerStyle}>
          <label style={labelStyle}>
            {`Seasonal amplitude: ${amplitude}`}
          </label>
          <input
            type="range"
            min={0} max={25} step={1}
            value={amplitude}
            onChange={e => setAmplitude(Number(e.target.value))}
            style={inputStyle}
          />
        </div>

        {/* Noise std */}
        <div style={sliderContainerStyle}>
          <label style={labelStyle}>
            {`Noise std: ${noiseStd}`}
          </label>
          <input
            type="range"
            min={0} max={20} step={1}
            value={noiseStd}
            onChange={e => setNoiseStd(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>

      {/* SNR + Regenerate row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          fontSize: '13px',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--ink-low, #555)',
        }}>
          {'SNR: '}
          <span style={{ color: snrColor, fontWeight: 700 }}>{snrLabel}</span>
          <span style={{ fontSize: '11px', color: 'var(--ink-ghost, #3a3a3a)', marginLeft: '8px' }}>
            {'(signal power / noise power)'}
          </span>
        </div>

        <button
          onClick={() => setSeed(s => (s ^ (Date.now() & 0xffffff)) >>> 0)}
          style={{
            padding: '5px 14px',
            background: 'var(--surface, #1a1a1a)',
            border: '1px solid var(--rim-hi, #3a3a3a)',
            borderRadius: '4px',
            color: 'var(--ink-mid, #888)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Regenerate noise
        </button>
      </div>

      {/* Footer note */}
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: 'var(--ink-ghost, #3a3a3a)',
        lineHeight: '1.6',
        borderTop: '1px solid var(--rim, #2a2a2a)',
        paddingTop: '10px',
      }}>
        {`STL decomposition separates a time series into trend + seasonal + residual. The original signal y[t] = trend[t] + seasonal[t] + noise[t]. SNR = 10·log₁₀(Var(trend+seasonal) / Var(noise)). High SNR → signal dominates; low SNR → noise drowns the pattern.`}
      </p>
    </div>
  );
})
