import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

const BETA_OLS = [2.5, -1.8, 0.3, -0.1, 1.2, -0.6];
const LAMBDA_MIN = 0;
const LAMBDA_MAX = 3;
const LAMBDA_STEPS = 120;

function ridgeCoeff(beta, lambda) {
  return beta / (1 + lambda);
}

function lassoCoeff(beta, lambda) {
  const sign = beta >= 0 ? 1 : -1;
  return sign * Math.max(0, Math.abs(beta) - lambda / 2);
}

function computeCoeffs(mode, lambda) {
  return BETA_OLS.map(b => mode === 'L1' ? lassoCoeff(b, lambda) : ridgeCoeff(b, lambda));
}

// Build path data: lambdas vs coefficients
function buildPaths() {
  const lambdas = Array.from({ length: LAMBDA_STEPS + 1 }, (_, i) => (i / LAMBDA_STEPS) * LAMBDA_MAX);
  return lambdas;
}

const LAMBDAS = buildPaths();

const COEFF_COLORS = [
  '#F0A500', // amber  - prime
  '#60a5fa', // blue
  '#34d399', // green
  '#f87171', // red
  '#a78bfa', // purple
  '#fb923c', // orange
];

function drawBars(canvas, mode, lambda, coeffs) {
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const cs = getComputedStyle(canvas);

  const depth    = cs.getPropertyValue('--depth').trim()    || '#111827';
  const rim      = cs.getPropertyValue('--rim').trim()      || '#2a2a2a';
  const inkLow   = cs.getPropertyValue('--ink-low').trim()  || '#555';
  const inkMid   = cs.getPropertyValue('--ink-mid').trim()  || '#888';
  const prime    = cs.getPropertyValue('--prime').trim()    || '#F0A500';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const PAD_L = 36, PAD_R = 12, PAD_T = 14, PAD_B = 30;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const Y_MIN = -3.2, Y_MAX = 3.2;
  function toY(v) {
    return PAD_T + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
  }
  const zeroY = toY(0);

  // Grid lines at -3,-2,-1,0,1,2,3
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.5;
  for (const v of [-3, -2, -1, 0, 1, 2, 3]) {
    const y = toY(v);
    ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
  }

  // Y axis labels
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.textAlign = 'right';
  for (const v of [-2, -1, 0, 1, 2]) {
    ctx.fillText(v, PAD_L - 4, toY(v) + 3);
  }

  const n = BETA_OLS.length;
  const groupW = plotW / n;
  const barW = groupW * 0.5;

  for (let i = 0; i < n; i++) {
    const cx = PAD_L + groupW * i + groupW / 2;

    // OLS background bar (faint)
    const olsVal = BETA_OLS[i];
    const olsY = toY(olsVal);
    const olsH = Math.abs(olsY - zeroY);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(cx - barW / 2 - 2, Math.min(olsY, zeroY), barW + 4, olsH);

    // Regularized bar
    const regVal = coeffs[i];
    const regY = toY(regVal);
    const regH = Math.abs(regY - zeroY);

    const barColor = regVal >= 0 ? prime : '#60a5fa';
    ctx.fillStyle = barColor;
    ctx.fillRect(cx - barW / 2, Math.min(regY, zeroY), barW, Math.max(regH, 1));

    // X label
    ctx.fillStyle = inkMid;
    ctx.font = `10px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'center';
    ctx.fillText(`β${i + 1}`, cx, H - PAD_B + 14);

    // Value label above/below bar
    if (Math.abs(regVal) > 0.05) {
      ctx.fillStyle = barColor;
      ctx.font = `9px var(--font-mono, monospace)`;
      const labelY = regVal >= 0 ? Math.min(regY, zeroY) - 3 : Math.max(regY, zeroY) + 11;
      ctx.fillText(regVal.toFixed(2), cx, labelY);
    }
  }

  // Zero line
  ctx.strokeStyle = inkMid;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD_L, zeroY); ctx.lineTo(W - PAD_R, zeroY); ctx.stroke();

  // Legend
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(PAD_L + 4, PAD_T, 80, 14);
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.textAlign = 'left';
  ctx.fillText('faint = OLS (unregularized)', PAD_L + 8, PAD_T + 10);
}

function drawPaths(canvas, mode, lambda) {
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const cs = getComputedStyle(canvas);

  const depth  = cs.getPropertyValue('--depth').trim()    || '#111827';
  const rim    = cs.getPropertyValue('--rim').trim()      || '#2a2a2a';
  const inkLow = cs.getPropertyValue('--ink-low').trim()  || '#555';
  const inkMid = cs.getPropertyValue('--ink-mid').trim()  || '#888';

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, W, H);

  const PAD_L = 36, PAD_R = 12, PAD_T = 14, PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const Y_MIN = -3.2, Y_MAX = 3.2;
  function toX(lam) {
    return PAD_L + (lam / LAMBDA_MAX) * plotW;
  }
  function toY(v) {
    return PAD_T + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
  }
  const zeroY = toY(0);

  // Grid
  ctx.strokeStyle = rim;
  ctx.lineWidth = 0.5;
  for (const v of [-2, -1, 0, 1, 2]) {
    const y = toY(v);
    ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(W - PAD_R, y); ctx.stroke();
  }
  for (let l = 0; l <= 3; l++) {
    const x = toX(l);
    ctx.beginPath(); ctx.moveTo(x, PAD_T); ctx.lineTo(x, H - PAD_B); ctx.stroke();
  }

  // Y-axis labels
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.textAlign = 'right';
  for (const v of [-2, -1, 0, 1, 2]) {
    ctx.fillText(v, PAD_L - 4, toY(v) + 3);
  }

  // X-axis labels
  ctx.fillStyle = inkMid;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.textAlign = 'center';
  for (let l = 0; l <= 3; l++) {
    ctx.fillText(l, toX(l), H - PAD_B + 12);
  }

  // X-axis label
  ctx.fillStyle = inkLow;
  ctx.font = `9px var(--font-mono, monospace)`;
  ctx.textAlign = 'center';
  ctx.fillText('λ', W / 2, H - 2);

  // Zero line
  ctx.strokeStyle = inkMid;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD_L, zeroY); ctx.lineTo(W - PAD_R, zeroY); ctx.stroke();

  // Coefficient paths
  for (let i = 0; i < BETA_OLS.length; i++) {
    ctx.strokeStyle = COEFF_COLORS[i];
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let li = 0; li <= LAMBDA_STEPS; li++) {
      const lam = LAMBDAS[li];
      const coeff = mode === 'L1' ? lassoCoeff(BETA_OLS[i], lam) : ridgeCoeff(BETA_OLS[i], lam);
      const x = toX(lam);
      const y = toY(coeff);
      li === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Current lambda vertical line
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  const curX = toX(lambda);
  ctx.beginPath(); ctx.moveTo(curX, PAD_T); ctx.lineTo(curX, H - PAD_B); ctx.stroke();
  ctx.setLineDash([]);

  // Dots at current lambda
  for (let i = 0; i < BETA_OLS.length; i++) {
    const coeff = mode === 'L1' ? lassoCoeff(BETA_OLS[i], lambda) : ridgeCoeff(BETA_OLS[i], lambda);
    const x = toX(lambda);
    const y = toY(coeff);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = COEFF_COLORS[i];
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

export const RegularizationViz = forwardRef(function RegularizationViz(props, ref) {
  const [mode, setMode] = useState('L1');
  const [lambda, setLambda] = useState(0);
  const barRef = useRef(null);
  const pathRef = useRef(null);

  const coeffs = computeCoeffs(mode, lambda);

  const animRef = useRef(null)

  const play = useCallback(() => {
    if (animRef.current) return
    animRef.current = setInterval(() => {
      setLambda(prev => {
        const next = +(prev + 0.1).toFixed(2)
        return next > 3 ? 0 : next
      })
    }, 200)
  }, [])

  const pause = useCallback(() => {
    if (animRef.current) { clearInterval(animRef.current); animRef.current = null }
  }, [])

  const reset = useCallback(() => {
    pause()
    setLambda(0)
    setMode('L1')
  }, [pause])

  const step = useCallback(() => {
    pause()
    setLambda(l => Math.min(3, +(l + 0.1).toFixed(2)))
  }, [pause])

  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step])

  useEffect(() => {
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [])

  const drawAll = useCallback(() => {
    if (barRef.current && barRef.current.clientWidth > 0) {
      drawBars(barRef.current, mode, lambda, coeffs);
    }
    if (pathRef.current && pathRef.current.clientWidth > 0) {
      drawPaths(pathRef.current, mode, lambda);
    }
  }, [mode, lambda, coeffs]);

  // Setup ResizeObserver for both canvases
  useEffect(() => {
    const canvases = [barRef.current, pathRef.current];
    const observers = canvases.map(canvas => {
      if (!canvas) return null;
      const ro = new ResizeObserver(() => {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        drawAll();
      });
      ro.observe(canvas);
      return ro;
    });
    return () => observers.forEach(ro => ro && ro.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const zeroCount = coeffs.filter(c => c === 0).length;

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      color: 'var(--ink-hi, #e5e5e5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {['L1', 'L2'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '5px 16px',
              borderRadius: '6px',
              border: '1px solid var(--rim, #2a2a2a)',
              background: mode === m ? 'var(--prime, #F0A500)' : 'var(--depth, #111)',
              color: mode === m ? '#000' : 'var(--ink-mid, #888)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {m === 'L1' ? 'L1 (Lasso)' : 'L2 (Ridge)'}
          </button>
        ))}
        <span style={{
          fontSize: '12px',
          color: 'var(--ink-low, #555)',
          fontFamily: 'var(--font-mono, monospace)',
          marginLeft: '8px',
        }}>
          {mode === 'L1'
            ? `βj = sign(βj) · max(0, |βj| - λ/2)`
            : `βj = βj / (1 + λ)`}
        </span>
      </div>

      {/* Lambda slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{
          fontSize: '13px',
          color: 'var(--ink-mid, #888)',
          fontFamily: 'var(--font-mono, monospace)',
          whiteSpace: 'nowrap',
        }}>
          {`λ = ${lambda.toFixed(2)}`}
        </label>
        <input
          type="range"
          min={LAMBDA_MIN}
          max={LAMBDA_MAX}
          step={0.01}
          value={lambda}
          onChange={e => setLambda(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--prime, #F0A500)' }}
        />
        <span style={{
          fontSize: '13px',
          color: 'var(--ink-low, #555)',
          fontFamily: 'var(--font-mono, monospace)',
          minWidth: '24px',
        }}>
          3.0
        </span>
      </div>

      {/* Two canvases stacked */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)' }}>
          Current coefficient values
        </div>
        <canvas
          ref={barRef}
          style={{
            width: '100%',
            height: '160px',
            borderRadius: '6px',
            border: '1px solid var(--rim, #2a2a2a)',
            display: 'block',
          }}
        />
        <div style={{ fontSize: '11px', color: 'var(--ink-low, #555)', fontFamily: 'var(--font-mono, monospace)' }}>
          Coefficient paths as {'λ'} increases
        </div>
        <canvas
          ref={pathRef}
          style={{
            width: '100%',
            height: '160px',
            borderRadius: '6px',
            border: '1px solid var(--rim, #2a2a2a)',
            display: 'block',
          }}
        />
      </div>

      {/* Color legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono, monospace)',
      }}>
        {BETA_OLS.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '3px', background: COEFF_COLORS[i], borderRadius: '2px' }} />
            <span style={{ color: 'var(--ink-mid, #888)' }}>
              {`β${i + 1}=${coeffs[i].toFixed(2)}`}
            </span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        fontSize: '13px',
        fontFamily: 'var(--font-mono, monospace)',
        background: 'var(--surface, #1a1a1a)',
        border: '1px solid var(--rim, #2a2a2a)',
        borderRadius: '6px',
        padding: '10px 16px',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ color: 'var(--ink-low, #555)' }}>Mode: </span>
          <span style={{ color: 'var(--prime, #F0A500)', fontWeight: 600 }}>{mode === 'L1' ? 'Lasso' : 'Ridge'}</span>
        </div>
        <div>
          <span style={{ color: 'var(--ink-low, #555)' }}>{'λ'}: </span>
          <span style={{ color: 'var(--ink-hi, #e5e5e5)', fontWeight: 600 }}>{lambda.toFixed(2)}</span>
        </div>
        {mode === 'L1' && (
          <div>
            <span style={{ color: 'var(--ink-low, #555)' }}>Zeroed out: </span>
            <span style={{ color: zeroCount > 0 ? '#22c55e' : 'var(--ink-hi, #e5e5e5)', fontWeight: 600 }}>
              {zeroCount} / {BETA_OLS.length}
            </span>
          </div>
        )}
      </div>

      {/* Insight note */}
      <p style={{
        margin: 0,
        fontSize: '12px',
        color: 'var(--ink-ghost, #3a3a3a)',
        lineHeight: '1.6',
        borderTop: '1px solid var(--rim, #2a2a2a)',
        paddingTop: '10px',
      }}>
        {mode === 'L1'
          ? `L1 drives small coefficients to exactly zero — automatic feature selection. In the path chart, lines hit zero and stay there. Use Lasso when you suspect only a few features are truly relevant.`
          : `L2 keeps all features but makes them small — coefficients shrink toward zero but never reach it. Ridge works well when you believe all features contribute. The path chart shows smooth asymptotic decay.`}
      </p>
    </div>
  );
})
