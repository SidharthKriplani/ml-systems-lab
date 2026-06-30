import React, { useState, useRef, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';

const MODELS = {
  perfect: {
    label: 'Perfectly calibrated',
    pred:   [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95],
    actual: [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95],
    counts: [42,   55,   60,   58,   54,   51,   56,   52,   48,   44],
  },
  overconfident: {
    label: 'Overconfident',
    pred:   [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95],
    actual: [0.03, 0.08, 0.18, 0.30, 0.42, 0.58, 0.70, 0.82, 0.92, 0.97],
    counts: [18,   22,   30,   40,   55,   60,   45,   35,   28,   20],
  },
  underconfident: {
    label: 'Underconfident',
    pred:   [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95],
    actual: [0.12, 0.20, 0.32, 0.40, 0.48, 0.52, 0.60, 0.68, 0.78, 0.88],
    counts: [25,   38,   52,   60,   68,   65,   58,   48,   35,   22],
  },
};

const MODEL_KEYS = ['perfect', 'overconfident', 'underconfident'];

function computeECE(pred, actual, counts) {
  const N = counts.reduce((a, b) => a + b, 0);
  let ece = 0;
  for (let i = 0; i < pred.length; i++) {
    ece += (counts[i] / N) * Math.abs(actual[i] - pred[i]);
  }
  return ece;
}

const CW = 400;
const CH = 300;
const PAD = { top: 20, right: 20, bottom: 50, left: 55 };

export const CalibrationCurveViz = forwardRef(function CalibrationCurveViz(props, ref) {
  const [modelKey, setModelKey] = useState('perfect');
  const canvasRef = useRef(null);
  const histRef   = useRef(null);
  const animRef   = useRef(null);

  const model = MODELS[modelKey];

  const ece = useMemo(
    () => computeECE(model.pred, model.actual, model.counts),
    [model]
  );

  // Calibration canvas
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

    function toX(v) { return PAD.left + v * plotW; }
    function toY(v) { return PAD.top + (1 - v) * plotH; }

    // Grid
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = rim;
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      ctx.beginPath();
      ctx.moveTo(toX(t), PAD.top);
      ctx.lineTo(toX(t), PAD.top + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAD.left, toY(t));
      ctx.lineTo(W - PAD.right, toY(t));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = inkMid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, PAD.top + plotH);
    ctx.lineTo(W - PAD.right, PAD.top + plotH);
    ctx.stroke();

    // Perfect calibration diagonal
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(1), toY(1));
    ctx.strokeStyle = inkLow;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Shade region between curve and diagonal
    const { pred, actual } = model;

    // Build the shaded region as a closed polygon
    ctx.beginPath();
    ctx.moveTo(toX(pred[0]), toY(actual[0]));
    for (let i = 1; i < pred.length; i++) {
      ctx.lineTo(toX(pred[i]), toY(actual[i]));
    }
    // Walk back along the diagonal
    for (let i = pred.length - 1; i >= 0; i--) {
      ctx.lineTo(toX(pred[i]), toY(pred[i]));
    }
    ctx.closePath();

    // Color based on model type
    const shadeColor = modelKey === 'overconfident'
      ? 'rgba(239,68,68,0.18)'
      : modelKey === 'underconfident'
        ? 'rgba(96,165,250,0.18)'
        : 'rgba(240,165,0,0.12)';
    ctx.fillStyle = shadeColor;
    ctx.fill();

    // Calibration curve line
    ctx.beginPath();
    ctx.moveTo(toX(pred[0]), toY(actual[0]));
    for (let i = 1; i < pred.length; i++) {
      ctx.lineTo(toX(pred[i]), toY(actual[i]));
    }
    ctx.strokeStyle = prime;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dots
    for (let i = 0; i < pred.length; i++) {
      const x = toX(pred[i]);
      const y = toY(actual[i]);
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, 2 * Math.PI);
      ctx.fillStyle = prime;
      ctx.fill();
      ctx.strokeStyle = depth;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Axis tick labels
    ctx.fillStyle = inkMid;
    ctx.font = `10px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      ctx.fillText(t.toFixed(1), toX(t), PAD.top + plotH + 16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      ctx.fillText(t.toFixed(1), PAD.left - 6, toY(t) + 4);
    }

    // Axis labels
    ctx.fillStyle = inkMid;
    ctx.font = `11px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'center';
    ctx.fillText('Mean predicted probability', PAD.left + plotW / 2, H - 8);

    ctx.save();
    ctx.translate(14, PAD.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Fraction of positives', 0, 0);
    ctx.restore();

    // ECE label
    ctx.fillStyle = prime;
    ctx.font = `bold 12px var(--font-mono, monospace)`;
    ctx.textAlign = 'left';
    ctx.fillText(`ECE = ${ece.toFixed(4)}`, PAD.left + 6, PAD.top + 16);

  }, [model, modelKey, ece]);

  // Histogram canvas
  useEffect(() => {
    const canvas = histRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.scale(dpr, dpr);
    const cs = getComputedStyle(canvas);

    const prime  = cs.getPropertyValue('--prime').trim()   || '#F0A500';
    const inkMid = cs.getPropertyValue('--ink-mid').trim() || '#94a3b8';
    const rim    = cs.getPropertyValue('--rim').trim()     || '#334155';
    const depth  = cs.getPropertyValue('--depth').trim()   || '#0f172a';

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const hPad = { top: 8, right: 20, bottom: 28, left: 55 };
    const plotW = W - hPad.left - hPad.right;
    const plotH = H - hPad.top - hPad.bottom;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = depth;
    ctx.fillRect(0, 0, W, H);

    const counts = model.counts;
    const maxCount = Math.max(...counts);
    const binW = plotW / counts.length;

    counts.forEach((c, i) => {
      const bh = (c / maxCount) * plotH;
      const bx = hPad.left + i * binW + 2;
      const by = hPad.top + plotH - bh;
      ctx.fillStyle = `${prime}99`;
      ctx.fillRect(bx, by, binW - 4, bh);
      ctx.strokeStyle = prime;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, binW - 4, bh);
    });

    // Axis labels
    ctx.fillStyle = inkMid;
    ctx.font = `10px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    const labels = ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'];
    labels.forEach((lbl, i) => {
      ctx.fillText(lbl, hPad.left + (i + 0.5) * binW, H - 8);
    });

    ctx.textAlign = 'left';
    ctx.fillText('Prediction frequency', hPad.left, hPad.top + 8);

    ctx.strokeStyle = rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hPad.left, hPad.top + plotH);
    ctx.lineTo(W - hPad.right, hPad.top + plotH);
    ctx.stroke();
  }, [model]);

  const play = useCallback(() => {
    if (animRef.current) return;
    animRef.current = setInterval(() => {
      setModelKey(k => {
        const idx = MODEL_KEYS.indexOf(k);
        return MODEL_KEYS[(idx + 1) % MODEL_KEYS.length];
      });
    }, 800);
  }, []);

  const pause = useCallback(() => {
    clearInterval(animRef.current);
    animRef.current = null;
  }, []);

  const reset = useCallback(() => {
    pause();
    setModelKey('perfect');
  }, [pause]);

  const step = useCallback(() => {
    pause();
    setModelKey(k => {
      const idx = MODEL_KEYS.indexOf(k);
      return MODEL_KEYS[(idx + 1) % MODEL_KEYS.length];
    });
  }, [pause]);

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step]);

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '480px',
    }}>
      <h3 style={{ color: 'var(--ink-hi)', margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
        Calibration Curve (Reliability Diagram)
      </h3>

      {/* Model selector tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {MODEL_KEYS.map(key => (
          <button
            key={key}
            onClick={() => setModelKey(key)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${modelKey === key ? 'var(--prime)' : 'var(--rim)'}`,
              background: modelKey === key ? 'var(--prime)' : 'var(--depth)',
              color: modelKey === key ? '#000' : 'var(--ink-mid)',
              fontSize: '12px',
              fontWeight: modelKey === key ? 700 : 400,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans, sans-serif)',
              transition: 'all 0.15s',
            }}
          >
            {MODELS[key].label}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        style={{ display: 'block', borderRadius: '8px', maxWidth: '100%', width: '100%', height: `${CH}px` }}
      />

      <div style={{ marginTop: '8px' }}>
        <canvas
          ref={histRef}
          style={{ display: 'block', borderRadius: '6px', maxWidth: '100%', width: '100%', height: '80px' }}
        />
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px',
      }}>
        {MODEL_KEYS.map(key => {
          const m = MODELS[key];
          const e = computeECE(m.pred, m.actual, m.counts);
          const active = key === modelKey;
          return (
            <div key={key} style={{
              background: 'var(--depth)',
              border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
              borderRadius: '8px', padding: '8px 6px', textAlign: 'center',
            }}>
              <div style={{ color: 'var(--ink-low)', fontSize: '10px', marginBottom: '4px' }}>
                {m.label.split(' ').slice(0, 1).join(' ')}
              </div>
              <div style={{
                color: active ? 'var(--prime)' : 'var(--ink-mid)',
                fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: active ? 700 : 400,
              }}>
                ECE {e.toFixed(4)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '14px', padding: '12px 14px',
        background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '8px',
        color: 'var(--ink-mid)', fontSize: '11.5px', lineHeight: 1.6,
      }}>
        A well-calibrated model&apos;s confidence scores reflect true probabilities. Overconfident models need
        temperature scaling or Platt scaling to fix their calibration. ECE = 0 means perfect calibration.
      </div>
    </div>
  );
})
