import { useState, useEffect, useRef, useMemo, useImperativeHandle, forwardRef, useCallback } from 'react';

// Seeded pseudo-random (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Beta(a,b) sample via Johnk's method (needs uniform rng)
function betaSample(rng, a, b) {
  // Use Cheng's BB algorithm for integer-like params; simpler: sum of uniforms approximation
  // For Beta(a,b) with integer a,b: use the order statistic / Dirichlet approach
  // Simple: Beta(a,b) ~ X/(X+Y) where X~Gamma(a,1), Y~Gamma(b,1)
  // Gamma(n,1) ~ -ln(U1*U2*...*Un) for integer n
  function gamma(n) {
    let s = 0;
    for (let i = 0; i < n; i++) {
      const u = rng();
      s -= Math.log(u < 1e-10 ? 1e-10 : u);
    }
    return s;
  }
  const x = gamma(a);
  const y = gamma(b);
  return x / (x + y);
}

function generateDataset() {
  const rng = mulberry32(42);
  const data = [];
  // 50 positives from Beta(8,3)
  for (let i = 0; i < 50; i++) {
    data.push({ label: 1, score: betaSample(rng, 8, 3) });
  }
  // 50 negatives from Beta(3,8)
  for (let i = 0; i < 50; i++) {
    data.push({ label: 0, score: betaSample(rng, 3, 8) });
  }
  return data;
}

function computeMetrics(data, threshold) {
  let TP = 0, FP = 0, TN = 0, FN = 0;
  for (const d of data) {
    const pred = d.score >= threshold ? 1 : 0;
    if (d.label === 1 && pred === 1) TP++;
    else if (d.label === 0 && pred === 1) FP++;
    else if (d.label === 0 && pred === 0) TN++;
    else FN++;
  }
  const TPR = (TP + FN) === 0 ? 0 : TP / (TP + FN);
  const FPR = (FP + TN) === 0 ? 0 : FP / (FP + TN);
  const precision = (TP + FP) === 0 ? null : TP / (TP + FP);
  const F1 = (2 * TP + FP + FN) === 0 ? 0 : (2 * TP) / (2 * TP + FP + FN);
  return { TP, FP, TN, FN, TPR, FPR, precision, F1 };
}

function computeROCPoints(data) {
  // Get all unique thresholds plus 0 and 1
  const scores = [...new Set(data.map(d => d.score))].sort((a, b) => a - b);
  const thresholds = [0, ...scores, 1 + 1e-9];
  const points = thresholds.map(t => {
    const m = computeMetrics(data, t);
    return { FPR: m.FPR, TPR: m.TPR };
  });
  // Sort by FPR ascending
  points.sort((a, b) => a.FPR - b.FPR || a.TPR - b.TPR);
  return points;
}

function computeAUC(rocPoints) {
  // Trapezoidal rule
  let auc = 0;
  for (let i = 1; i < rocPoints.length; i++) {
    const dx = rocPoints[i].FPR - rocPoints[i - 1].FPR;
    const avgY = (rocPoints[i].TPR + rocPoints[i - 1].TPR) / 2;
    auc += dx * avgY;
  }
  return Math.abs(auc);
}

// AUC = P(score_pos > score_neg) — the Mann-Whitney U interpretation
// Confirmed by computing exact rank-sum: U / (n_pos * n_neg) = AUC
function computePRPoints(data) {
  const scores = [...new Set(data.map(d => d.score))].sort((a, b) => a - b);
  const thresholds = [0, ...scores, 1 + 1e-9];
  const points = thresholds.map(t => {
    const m = computeMetrics(data, t);
    const prec = m.precision === null ? 1 : m.precision;
    return { recall: m.TPR, precision: prec };
  });
  points.sort((a, b) => a.recall - b.recall || b.precision - a.precision);
  return points;
}

function computePRAUC(prPoints) {
  let auc = 0;
  for (let i = 1; i < prPoints.length; i++) {
    const dx = prPoints[i].recall - prPoints[i - 1].recall;
    const avgY = (prPoints[i].precision + prPoints[i - 1].precision) / 2;
    auc += dx * avgY;
  }
  return Math.max(0, auc);
}

const CANVAS_W = 420;
const CANVAS_H = 340;
const PAD = { top: 20, right: 20, bottom: 50, left: 55 };

function toCanvasX(fpr) {
  return PAD.left + fpr * (CANVAS_W - PAD.left - PAD.right);
}
function toCanvasY(tpr) {
  return PAD.top + (1 - tpr) * (CANVAS_H - PAD.top - PAD.bottom);
}

export const ROCCurveViz = forwardRef(function ROCCurveViz(props, ref) {
  const dataset = useMemo(() => generateDataset(), []);
  const rocPoints = useMemo(() => computeROCPoints(dataset), [dataset]);
  const auc = useMemo(() => computeAUC(rocPoints), [rocPoints]);
  const prPoints = useMemo(() => computePRPoints(dataset), [dataset]);
  const prauc = useMemo(() => computePRAUC(prPoints), [prPoints]);
  const [showPR, setShowPR] = useState(false);

  const [threshold, setThreshold] = useState(0.5);
  const canvasRef = useRef(null);

  const metrics = useMemo(() => computeMetrics(dataset, threshold), [dataset, threshold]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const cs = getComputedStyle(canvas);

    if (showPR) {
      // ── PR Curve ─────────────────────────────────────────────────────────
      const prime = cs.getPropertyValue('--prime').trim() || '#f59e0b';
      const inkMid = cs.getPropertyValue('--ink-mid').trim() || '#94a3b8';
      const inkLow = cs.getPropertyValue('--ink-low').trim() || '#64748b';
      const rim = cs.getPropertyValue('--rim').trim() || '#334155';
      const depth = cs.getPropertyValue('--depth').trim() || '#0f172a';
      const W = CANVAS_W, H = CANVAS_H;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = depth; ctx.fillRect(0, 0, W, H);
      // Grid
      ctx.strokeStyle = rim; ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        ctx.beginPath(); ctx.moveTo(toCanvasX(t), PAD.top); ctx.lineTo(toCanvasX(t), H - PAD.bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(PAD.left, toCanvasY(t)); ctx.lineTo(W - PAD.right, toCanvasY(t)); ctx.stroke();
      }
      // Axes
      ctx.strokeStyle = inkMid; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(PAD.left, PAD.top); ctx.lineTo(PAD.left, H - PAD.bottom); ctx.lineTo(W - PAD.right, H - PAD.bottom); ctx.stroke();
      // Baseline (random classifier = prevalence = 0.5 for balanced dataset)
      ctx.strokeStyle = inkLow; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(toCanvasX(0), toCanvasY(0.5)); ctx.lineTo(toCanvasX(1), toCanvasY(0.5)); ctx.stroke();
      ctx.setLineDash([]);
      // PR curve
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      prPoints.forEach((p, i) => {
        const x = toCanvasX(p.recall); const y = toCanvasY(p.precision);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      // Labels
      ctx.fillStyle = prime; ctx.font = 'bold 13px var(--font-mono,monospace)'; ctx.textAlign = 'left';
      ctx.fillText(`PR-AUC = ${prauc.toFixed(3)}`, PAD.left + 8, PAD.top + 16);
      ctx.fillStyle = inkLow; ctx.font = '11px var(--font-sans,sans-serif)'; ctx.textAlign = 'center';
      ctx.fillText('Recall', PAD.left + (W - PAD.left - PAD.right) / 2, H - 6);
      ctx.save(); ctx.translate(13, PAD.top + (H - PAD.top - PAD.bottom) / 2);
      ctx.rotate(-Math.PI / 2); ctx.fillText('Precision', 0, 0); ctx.restore();
      for (let i = 0; i <= 5; i++) {
        const t = i / 5;
        ctx.fillStyle = inkMid; ctx.font = '11px var(--font-mono,monospace)'; ctx.textAlign = 'center';
        ctx.fillText(t.toFixed(1), toCanvasX(t), H - PAD.bottom + 16);
        ctx.textAlign = 'right';
        ctx.fillText(t.toFixed(1), PAD.left - 6, toCanvasY(t) + 4);
      }
      return; // skip ROC drawing below
    }

    const prime = cs.getPropertyValue('--prime').trim() || '#f59e0b';
    const inkMid = cs.getPropertyValue('--ink-mid').trim() || '#94a3b8';
    const inkLow = cs.getPropertyValue('--ink-low').trim() || '#64748b';
    const rim = cs.getPropertyValue('--rim').trim() || '#334155';
    const depth = cs.getPropertyValue('--depth').trim() || '#0f172a';

    const W = CANVAS_W;
    const H = CANVAS_H;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = depth;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = rim;
    ctx.lineWidth = 0.5;
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const t = i / gridSteps;
      const gx = toCanvasX(t);
      const gy = toCanvasY(t);
      ctx.beginPath();
      ctx.moveTo(gx, PAD.top);
      ctx.lineTo(gx, H - PAD.bottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAD.left, gy);
      ctx.lineTo(W - PAD.right, gy);
      ctx.stroke();
    }

    // Axis
    ctx.strokeStyle = inkMid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD.left, PAD.top);
    ctx.lineTo(PAD.left, H - PAD.bottom);
    ctx.lineTo(W - PAD.right, H - PAD.bottom);
    ctx.stroke();

    // Diagonal baseline
    ctx.strokeStyle = inkLow;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(0));
    ctx.lineTo(toCanvasX(1), toCanvasY(1));
    ctx.stroke();
    ctx.setLineDash([]);

    // ROC curve
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    rocPoints.forEach((p, i) => {
      const x = toCanvasX(p.FPR);
      const y = toCanvasY(p.TPR);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Axis tick labels
    ctx.fillStyle = inkMid;
    ctx.font = `11px var(--font-mono, monospace)`;
    ctx.textAlign = 'center';
    for (let i = 0; i <= gridSteps; i++) {
      const t = i / gridSteps;
      ctx.fillText(t.toFixed(1), toCanvasX(t), H - PAD.bottom + 16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridSteps; i++) {
      const t = i / gridSteps;
      ctx.fillText(t.toFixed(1), PAD.left - 6, toCanvasY(t) + 4);
    }

    // Axis labels
    ctx.fillStyle = inkMid;
    ctx.font = `12px var(--font-sans, sans-serif)`;
    ctx.textAlign = 'center';
    ctx.fillText('FPR (1-Specificity)', PAD.left + (W - PAD.left - PAD.right) / 2, H - 6);

    ctx.save();
    ctx.translate(13, PAD.top + (H - PAD.top - PAD.bottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('TPR (Recall)', 0, 0);
    ctx.restore();

    // AUC label
    ctx.fillStyle = prime;
    ctx.font = `bold 13px var(--font-mono, monospace)`;
    ctx.textAlign = 'left';
    ctx.fillText(`AUC = ${auc.toFixed(3)}`, PAD.left + 8, PAD.top + 16);

    // Current threshold dot
    const dotX = toCanvasX(metrics.FPR);
    const dotY = toCanvasY(metrics.TPR);

    ctx.beginPath();
    ctx.arc(dotX, dotY, 7, 0, 2 * Math.PI);
    ctx.fillStyle = prime;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

  }, [rocPoints, auc, metrics, showPR, prPoints, prauc]);

  const autoPlayRef = useRef(null)

  useImperativeHandle(ref, () => ({
    play: () => {
      if (autoPlayRef.current) return
      autoPlayRef.current = setInterval(() => {
        setThreshold(t => {
          const next = t + 0.05
          if (next > 1) {
            clearInterval(autoPlayRef.current)
            autoPlayRef.current = null
            return 1
          }
          return parseFloat(next.toFixed(2))
        })
      }, 200)
    },
    pause: () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
        autoPlayRef.current = null
      }
    },
    reset: () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
        autoPlayRef.current = null
      }
      setThreshold(0.5)
    },
    step: () => {
      setThreshold(t => parseFloat(Math.min(1, t + 0.05).toFixed(2)))
    },
  }), [])

  const fmt = (v, digits = 3) => (v === null ? 'N/A' : v.toFixed(digits));

  return (
    <div style={{
      fontFamily: 'var(--font-sans, sans-serif)',
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '480px',
    }}>
      <h3 style={{ color: 'var(--ink-hi)', margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>
        ROC Curve Visualizer
      </h3>

      {/* ROC / PR toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[false, true].map(pr => (
          <button key={String(pr)} onClick={() => setShowPR(pr)} style={{
            padding: '4px 14px', borderRadius: 6, fontSize: 12,
            border: '1px solid var(--rim)', cursor: 'pointer', fontFamily: 'var(--font-mono)',
            background: showPR === pr ? 'var(--prime,#F0A500)' : 'var(--depth,#111)',
            color: showPR === pr ? '#000' : 'var(--ink-mid)',
            fontWeight: showPR === pr ? 700 : 400,
          }}>
            {pr ? 'PR Curve' : 'ROC Curve'}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', borderRadius: '8px', maxWidth: '100%' }}
      />

      <div style={{ marginTop: '16px' }}>
        <label style={{ color: 'var(--ink-mid)', fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span>Threshold</span>
          <span style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{threshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={e => setThreshold(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--prime)' }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        marginTop: '16px',
      }}>
        {[
          ['Threshold', fmt(threshold, 2)],
          ['TPR/Recall', fmt(metrics.TPR)],
          ['FPR', fmt(metrics.FPR)],
          ['Precision', fmt(metrics.precision)],
          ['F1', fmt(metrics.F1)],
        ].map(([label, value]) => (
          <div key={label} style={{
            background: 'var(--depth)',
            border: '1px solid var(--rim)',
            borderRadius: '8px',
            padding: '8px 6px',
            textAlign: 'center',
          }}>
            <div style={{ color: 'var(--ink-low)', fontSize: '10px', marginBottom: '4px' }}>{label}</div>
            <div style={{ color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px' }}>
        <div style={{ color: 'var(--ink-mid)', fontSize: '12px', marginBottom: '8px' }}>Confusion Matrix</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {[
            { label: 'TP', value: metrics.TP, tint: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)' },
            { label: 'FP', value: metrics.FP, tint: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' },
            { label: 'FN', value: metrics.FN, tint: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' },
            { label: 'TN', value: metrics.TN, tint: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)' },
          ].map(({ label, value, tint, border }) => (
            <div key={label} style={{
              background: tint,
              border: `1px solid ${border}`,
              borderRadius: '6px',
              padding: '10px',
              textAlign: 'center',
            }}>
              <div style={{ color: 'var(--ink-low)', fontSize: '10px' }}>{label}</div>
              <div style={{ color: 'var(--ink-hi)', fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Mann-Whitney U interpretation */}
      <div style={{
        marginTop: '16px',
        background: 'var(--depth)',
        border: '1px solid var(--rim)',
        borderRadius: '8px',
        padding: '12px 14px',
        fontSize: '12px',
        lineHeight: '1.7',
        fontFamily: 'var(--font-mono)',
      }}>
        <div style={{ color: 'var(--prime)', fontWeight: 700, marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Why AUC = P(score_pos &gt; score_neg)
        </div>
        <div style={{ color: 'var(--ink-mid)' }}>
          AUC is the normalized Mann-Whitney U statistic. Pick a random positive and a random negative — AUC = probability the positive scores higher.
        </div>
        <div style={{ color: 'var(--prime)', marginTop: 6, fontWeight: 600 }}>
          At AUC = {auc.toFixed(3)}: a positive scores higher than a random negative {(auc * 100).toFixed(1)}% of the time.
        </div>
        <div style={{ color: 'var(--ink-low)', marginTop: 6 }}>
          AUC = 0.5 → no discrimination (random). AUC = 1.0 → perfect separation.
          ROC-AUC is insensitive to class imbalance (averaging over all thresholds uniformly).
          For imbalanced data, PR-AUC is more revealing — switch to the PR Curve tab above.
        </div>
      </div>
    </div>
  );
})
