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

// ─── Series generation ────────────────────────────────────────────────────────
function generateSeries(seed) {
  const rng = mulberry32(seed);
  const n = 104;
  const y = [];
  let prev = 50;
  for (let t = 0; t < n; t++) {
    const trend = 0.15 * t;
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * 3;
    const ar = 0.7 * (prev - 50 - 0.15 * (t - 1));
    prev = 50 + trend + ar + noise;
    y.push(prev);
  }
  return y;
}

// ─── Differencing ─────────────────────────────────────────────────────────────
function difference(series, d) {
  let s = [...series];
  for (let i = 0; i < d; i++) {
    const next = [];
    for (let j = 1; j < s.length; j++) next.push(s[j] - s[j - 1]);
    s = next;
  }
  return s;
}

// ─── AR fitting via simplified Yule-Walker ────────────────────────────────────
function fitAR(series, p) {
  const n = series.length;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const variance = series.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  if (variance < 1e-10 || p === 0) return { coefs: new Array(p).fill(0), mean };
  const acf = Array.from({ length: p + 1 }, (_, k) => {
    let sum = 0;
    for (let t = k; t < n; t++) sum += (series[t] - mean) * (series[t - k] - mean);
    return sum / (n * variance);
  });
  return { coefs: acf.slice(1), mean };
}

// ─── Forecast ─────────────────────────────────────────────────────────────────
function forecast(series, arCoefs, steps, mean) {
  const p = arCoefs.length;
  const history = [...series];
  const preds = [];
  for (let i = 0; i < steps; i++) {
    let next = mean;
    for (let lag = 0; lag < p; lag++) {
      next += arCoefs[lag] * (history[history.length - 1 - lag] - mean);
    }
    preds.push(next);
    history.push(next);
  }
  return preds;
}

// ─── ACF computation ─────────────────────────────────────────────────────────
function computeACF(series, maxLag) {
  const n = series.length;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const variance = series.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  if (variance < 1e-10) return new Array(maxLag).fill(0);
  return Array.from({ length: maxLag }, (_, k) => {
    const lag = k + 1;
    let sum = 0;
    for (let t = lag; t < n; t++) sum += (series[t] - mean) * (series[t - lag] - mean);
    return sum / (n * variance);
  });
}

// ─── Canvas drawing utilities ─────────────────────────────────────────────────
function cssVar(el, name) {
  return getComputedStyle(el).getPropertyValue(name).trim() || null;
}

const TRAIN_END = 85;
const TOTAL = 104;
const FORECAST_STEPS = TOTAL - TRAIN_END;
const ACF_LAGS = 12;

// ─── Main component ───────────────────────────────────────────────────────────
export function ARIMAViz() {
  const [p, setP] = useState(2);
  const [d, setD] = useState(1);
  const [q, setQ] = useState(1);
  const [seed, setSeed] = useState(1337);

  const canvasRef = useRef(null);

  // Derived data
  const rawSeries = generateSeries(seed);
  const trainRaw = rawSeries.slice(0, TRAIN_END);
  const testRaw = rawSeries.slice(TRAIN_END);

  // Differenced series
  const diffSeries = difference(trainRaw, d);

  // Fit AR on differenced
  const { coefs: arCoefs, mean: arMean } = fitAR(diffSeries, p);

  // Fitted values on diff series
  const fittedDiff = diffSeries.map((_, i) => {
    if (i < p) return diffSeries[i];
    let val = arMean;
    for (let lag = 0; lag < p; lag++) {
      val += arCoefs[lag] * (diffSeries[i - 1 - lag] - arMean);
    }
    return val;
  });

  // Reconstruct fitted on original scale from differenced fitted
  function reconstructFromDiff(original, fittedDiffArr, dVal) {
    if (dVal === 0) return fittedDiffArr;
    // For d=1: fitted[i] = original[0] + sum(fittedDiff[0..i-1])
    // Approximate by cumsum
    const result = [original[0]];
    for (let i = 1; i < original.length; i++) {
      result.push(result[i - 1] + (fittedDiffArr[i] || 0));
    }
    return result;
  }

  const fittedOriginal = reconstructFromDiff(trainRaw, fittedDiff, d);

  // Forecast: forecast on diff scale, then integrate
  const forecastDiff = forecast(diffSeries, arCoefs, FORECAST_STEPS, arMean);

  function integrateForecast(lastOrig, forecastDiffArr, dVal) {
    if (dVal === 0) return forecastDiffArr;
    const result = [];
    let prev = lastOrig;
    for (const fd of forecastDiffArr) {
      prev = prev + fd;
      result.push(prev);
    }
    return result;
  }

  const forecastOrig = integrateForecast(trainRaw[trainRaw.length - 1], forecastDiff, d);

  // MSE on fitted
  let mse = 0;
  let mseCount = 0;
  for (let i = p; i < trainRaw.length; i++) {
    mse += (fittedOriginal[i] - trainRaw[i]) ** 2;
    mseCount++;
  }
  mse = mseCount > 0 ? mse / mseCount : 0;

  // ACF on differenced training series
  const acfValues = computeACF(diffSeries.length > 1 ? diffSeries : trainRaw, ACF_LAGS);
  const acfBound = 1.96 / Math.sqrt(diffSeries.length || trainRaw.length);

  // ─── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const primeCss = '#f5b942';
    const bg = '#111';
    const ghostColor = 'rgba(255,255,255,0.35)';
    const inkColor = 'rgba(255,255,255,0.85)';
    const rimColor = 'rgba(255,255,255,0.1)';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const pad = { top: 12, left: 48, right: 16, bottom: 16 };

    // Panel heights
    const p1H = Math.round(H * 0.50);
    const p2H = Math.round(H * 0.25);
    const p3H = H - p1H - p2H;

    // ── Panel 1: Original + Forecast ────────────────────────────────────────
    {
      const pTop = 0;
      const pBot = pTop + p1H;
      const innerW = W - pad.left - pad.right;
      const innerH = p1H - pad.top - pad.bottom - 8;

      // Panel title
      ctx.fillStyle = ghostColor;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Original Series + Forecast', pad.left, pTop + pad.top + 1);

      const allY = [...rawSeries, ...forecastOrig];
      const yMin = Math.min(...allY);
      const yMax = Math.max(...allY);
      const yRange = yMax - yMin || 1;

      const xScale = innerW / (TOTAL - 1);
      const yScale = innerH / yRange;
      const ox = pad.left;
      const oy = pTop + pad.top + 14;

      function px(t) { return ox + t * xScale; }
      function py(v) { return oy + innerH - (v - yMin) * yScale; }

      // Divider at train end
      const divX = px(TRAIN_END);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(divX, oy); ctx.lineTo(divX, oy + innerH); ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = ghostColor;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('train', divX - 30, oy - 2);
      ctx.fillText('test', divX + 25, oy - 2);

      // Actual test (gray)
      ctx.strokeStyle = 'rgba(180,180,180,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < testRaw.length; i++) {
        const t = TRAIN_END + i;
        i === 0 ? ctx.moveTo(px(t), py(testRaw[i])) : ctx.lineTo(px(t), py(testRaw[i]));
      }
      ctx.stroke();

      // Training data (blue)
      ctx.strokeStyle = '#4a9ebb';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < TRAIN_END; i++) {
        i === 0 ? ctx.moveTo(px(i), py(rawSeries[i])) : ctx.lineTo(px(i), py(rawSeries[i]));
      }
      ctx.stroke();

      // Fitted (gold, training)
      ctx.strokeStyle = primeCss;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < fittedOriginal.length; i++) {
        if (!isFinite(fittedOriginal[i])) continue;
        if (!started) { ctx.moveTo(px(i), py(fittedOriginal[i])); started = true; }
        else ctx.lineTo(px(i), py(fittedOriginal[i]));
      }
      ctx.stroke();

      // Forecast (dashed gold)
      ctx.strokeStyle = primeCss;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      const startX = px(TRAIN_END - 1);
      const startY = py(fittedOriginal[TRAIN_END - 1] || rawSeries[TRAIN_END - 1]);
      ctx.moveTo(startX, startY);
      for (let i = 0; i < forecastOrig.length; i++) {
        const t = TRAIN_END + i;
        ctx.lineTo(px(t), py(forecastOrig[i]));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Y-axis ticks
      ctx.fillStyle = ghostColor;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'right';
      const nTicks = 4;
      for (let i = 0; i <= nTicks; i++) {
        const v = yMin + (yRange * i) / nTicks;
        const y = py(v);
        ctx.fillText(v.toFixed(0), pad.left - 4, y + 3);
        ctx.strokeStyle = rimColor;
        ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      }

      // Legend
      const lx = W - pad.right - 130;
      const ly = pTop + pad.top + 14;
      const items = [
        { color: '#4a9ebb', label: 'Training data', dash: false },
        { color: primeCss, label: 'AR fitted', dash: false },
        { color: primeCss, label: 'Forecast', dash: true },
        { color: 'rgba(180,180,180,0.6)', label: 'Actual (test)', dash: false },
      ];
      items.forEach((it, i) => {
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 1.5;
        if (it.dash) ctx.setLineDash([4, 2]);
        ctx.beginPath(); ctx.moveTo(lx, ly + i * 14); ctx.lineTo(lx + 18, ly + i * 14); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = ghostColor;
        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(it.label, lx + 22, ly + i * 14 + 3);
      });

      // Separator line
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, pBot); ctx.lineTo(W, pBot); ctx.stroke();
    }

    // ── Panel 2: Differenced series ──────────────────────────────────────────
    {
      const pTop = p1H;
      const pBot = pTop + p2H;
      const innerW = W - pad.left - pad.right;
      const innerH = p2H - pad.top - pad.bottom - 8;

      const seriesForPanel = d === 0 ? trainRaw : diffSeries;
      const panelLabel = d === 0 ? 'd=0: Original' : d === 1 ? 'd=1: Differenced' : 'd=2: Twice-differenced';

      ctx.fillStyle = ghostColor;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(panelLabel, pad.left, pTop + pad.top + 1);

      if (seriesForPanel.length > 0) {
        const yMin = Math.min(...seriesForPanel);
        const yMax = Math.max(...seriesForPanel);
        const yRange = yMax - yMin || 1;
        const xScale = innerW / (seriesForPanel.length - 1);
        const yScale = innerH / yRange;
        const ox = pad.left;
        const oy = pTop + pad.top + 14;

        // Zero line
        if (yMin < 0 && yMax > 0) {
          const zeroY = oy + innerH - (0 - yMin) * yScale;
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.lineWidth = 0.8;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(ox, zeroY); ctx.lineTo(ox + innerW, zeroY); ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.strokeStyle = '#9b7fd4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < seriesForPanel.length; i++) {
          const x = ox + i * xScale;
          const y = oy + innerH - (seriesForPanel[i] - yMin) * yScale;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Y tick
        ctx.fillStyle = ghostColor;
        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(yMax.toFixed(1), pad.left - 4, oy + 4);
        ctx.fillText(yMin.toFixed(1), pad.left - 4, oy + innerH);
      }

      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, pBot); ctx.lineTo(W, pBot); ctx.stroke();
    }

    // ── Panel 3: ACF ─────────────────────────────────────────────────────────
    {
      const pTop = p1H + p2H;
      const innerW = W - pad.left - pad.right;
      const innerH = p3H - pad.top - pad.bottom - 8;

      ctx.fillStyle = ghostColor;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`ACF of differenced series (lags 1–${ACF_LAGS})`, pad.left, pTop + pad.top + 1);

      const ox = pad.left;
      const oy = pTop + pad.top + 14;
      const barW = innerW / ACF_LAGS;

      // ACF range: -1 to 1
      const acfRange = 2;
      const zeroY = oy + innerH / 2;
      const yScale = (innerH / 2) / 1; // 1 unit = half height

      // Bounds
      const boundY_pos = zeroY - acfBound * yScale;
      const boundY_neg = zeroY + acfBound * yScale;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(ox, boundY_pos); ctx.lineTo(ox + innerW, boundY_pos); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, boundY_neg); ctx.lineTo(ox + innerW, boundY_neg); ctx.stroke();
      ctx.setLineDash([]);

      // Zero line
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(ox, zeroY); ctx.lineTo(ox + innerW, zeroY); ctx.stroke();

      // Bars
      acfValues.forEach((val, i) => {
        const inside = Math.abs(val) <= acfBound;
        const bx = ox + i * barW + barW * 0.15;
        const bw = barW * 0.7;
        const barH = Math.abs(val) * yScale;
        const by = val >= 0 ? zeroY - barH : zeroY;

        ctx.fillStyle = inside ? primeCss : 'rgba(150,150,150,0.55)';
        ctx.fillRect(bx, by, bw, barH);

        // Lag label
        ctx.fillStyle = ghostColor;
        ctx.font = '8px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i + 1, bx + bw / 2, oy + innerH + 11);
      });

      // Y labels
      ctx.fillStyle = ghostColor;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('1.0', pad.left - 4, oy + 4);
      ctx.fillText('0', pad.left - 4, zeroY + 3);
      ctx.fillText('-1.0', pad.left - 4, oy + innerH);

      // Bound label
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`±${acfBound.toFixed(2)}`, ox + innerW, boundY_pos - 2);
    }

    // ─── void ───────────────────────────────────────────────────────────────
  }, [p, d, q, seed, rawSeries, trainRaw, testRaw, diffSeries, fittedOriginal, forecastOrig, acfValues, acfBound]);

  useEffect(() => { draw(); }, [draw]);

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  const SliderLabel = ({ label, value, min, max, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
      <span style={{ color: 'var(--ink)', fontWeight: 600, minWidth: 120 }}>{label} = <span style={{ color: 'var(--prime)' }}>{value}</span></span>
      <input
        type="range"
        min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ accentColor: 'var(--prime)', width: 100 }}
      />
    </div>
  );

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Title */}
      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.15rem' }}>
          ARIMA Model Visualizer
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          Adjust p, d, q to see model fit, differencing, and ACF
        </div>
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem', marginBottom: '0.7rem', alignItems: 'center' }}>
        <SliderLabel label="AR order p" value={p} min={0} max={5} onChange={setP} />
        <SliderLabel label="Integration d" value={d} min={0} max={2} onChange={setD} />
        <SliderLabel label="MA order q" value={q} min={0} max={3} onChange={setQ} />
        <button
          onClick={() => setSeed(s => (s * 6364136223846793005 + 1442695040888963407) & 0x7FFFFFFF || 1)}
          style={{
            padding: '0.35rem 0.75rem',
            fontSize: '0.79rem',
            background: 'var(--depth)',
            color: 'var(--ink)',
            border: '1px solid var(--rim)',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Regenerate data
        </button>
      </div>

      {/* Stats */}
      <div style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
        ARIMA({p},{d},{q}) &nbsp;|&nbsp; Training MSE: <span style={{ color: 'var(--prime)', fontWeight: 700 }}>{mse.toFixed(2)}</span>
        &nbsp;|&nbsp; q={q} is visual only (shown in label)
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '380px',
          borderRadius: '6px',
          display: 'block',
          background: 'var(--depth)',
        }}
      />

      {/* Legend note */}
      <div style={{
        marginTop: '0.55rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem 1rem',
        fontSize: '0.73rem',
        color: 'var(--ink-ghost)',
      }}>
        {[
          { color: '#4a9ebb', label: 'Training data', dash: false },
          { color: '#f5b942', label: 'AR fitted values', dash: false },
          { color: '#f5b942', label: 'Forecast', dash: true },
          { color: 'rgba(180,180,180,0.7)', label: 'Actual test', dash: false },
          { color: '#9b7fd4', label: 'Differenced series', dash: false },
          { color: '#f5b942', label: 'ACF (significant)', dash: false },
          { color: 'rgba(150,150,150,0.7)', label: 'ACF (insignificant)', dash: false },
        ].map((it, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{
              display: 'inline-block',
              width: 18,
              height: 2,
              background: it.color,
              borderTop: it.dash ? `2px dashed ${it.color}` : `2px solid ${it.color}`,
              flexShrink: 0,
            }} />
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}
