import React, { useState, useMemo, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

// ─── Base weights (recurrent matrix is SCALED live by wScale) ─────────────────

const W_h_BASE = [[0.5, -0.3, 0.2], [-0.4, 0.6, -0.1], [0.3, -0.2, 0.7]];
const W_x = [[0.8, -0.5], [0.3, 0.9], [-0.6, 0.4]];
const b   = [0.1, -0.1, 0.05];
const h0  = [0, 0, 0];

const WORDS = ['I', 'love', 'ML', 'because'];
// Base 2-D word embeddings; input gain multiplies them live.
const WORD_EMB_BASE = [[1.0, 0.0], [0.8, 0.6], [0.3, 0.9], [0.6, 0.3]];

function matVec(M, v) {
  return M.map(row => row.reduce((s, m, j) => s + m * v[j], 0));
}
function scaleMat(M, s) { return M.map(row => row.map(x => x * s)); }

// One tanh RNN step; also returns the pre-activation (raw) so we can compute
// the Jacobian ∂h_t/∂h_{t-1} = diag(1 - h_t²) · W_h for the gradient chain.
function rnnStep(h_prev, x, W_h) {
  const wh = matVec(W_h, h_prev);
  const wx = matVec(W_x, x);
  const raw = wh.map((v, i) => v + wx[i] + b[i]);
  const h = raw.map(Math.tanh);
  return { h, wh, wx, raw };
}

// Full forward pass over the sequence for a given recurrent scale + input gain.
function runForward(wScale, inputGain) {
  const W_h = scaleMat(W_h_BASE, wScale);
  const emb = WORD_EMB_BASE.map(e => e.map(v => v * inputGain));
  const states = [];       // {h, wh, wx, raw}
  let prev = h0;
  for (let t = 0; t < WORDS.length; t++) {
    const step = rnnStep(prev, emb[t], W_h);
    states.push(step);
    prev = step.h;
  }
  return { W_h, emb, states };
}

// Jacobian ∂h_t/∂h_{t-1}  =  diag(1 - h_t²) · W_h  (element (i,j)).
function stepJacobian(h_t, W_h) {
  return W_h.map((row, i) => row.map(w => (1 - h_t[i] * h_t[i]) * w));
}
// Operator 2-norm ≈ largest singular value, approx via power iteration on JᵀJ.
function specNorm(J) {
  const n = J.length;
  // JᵀJ
  const A = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
    for (let k = 0; k < n; k++) A[i][j] += J[k][i] * J[k][j];
  let v = Array(n).fill(1 / Math.sqrt(n));
  for (let it = 0; it < 40; it++) {
    const Av = matVec(A, v);
    const norm = Math.sqrt(Av.reduce((s, x) => s + x * x, 0)) || 1;
    v = Av.map(x => x / norm);
  }
  const Av = matVec(A, v);
  const lambda = v.reduce((s, x, i) => s + x * Av[i], 0);
  return Math.sqrt(Math.max(0, lambda));
}

// Real gradient magnitudes: how much the FINAL loss gradient reaches each h_t.
// ||∂L/∂h_t|| ∝ product of Jacobian norms from t..T-1 (chain through time).
// We take a unit gradient at the last step and propagate it backward exactly.
function gradientNorms(states, W_h) {
  const T = states.length;
  // seed: gradient wrt h_T is a unit vector
  let g = Array(states[0].h.length).fill(1);
  const norms = new Array(T).fill(0);
  norms[T - 1] = Math.sqrt(g.reduce((s, x) => s + x * x, 0));
  for (let t = T - 1; t >= 1; t--) {
    // ∂h_t/∂h_{t-1} = diag(1-h_t²)·W_h ; backprop g ← Jᵀ g
    const J = stepJacobian(states[t].h, W_h);
    const gPrev = Array(g.length).fill(0);
    for (let j = 0; j < g.length; j++)
      for (let i = 0; i < g.length; i++) gPrev[j] += J[i][j] * g[i];
    g = gPrev;
    norms[t - 1] = Math.sqrt(g.reduce((s, x) => s + x * x, 0));
  }
  return norms; // index 0 = ||∂L/∂h_1|| (oldest), last = 1.0 (newest)
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  root:       { fontFamily: `var(--font-sans, sans-serif)`, color: `var(--ink-hi, #eee)`, maxWidth: 700 },
  title:      { margin: '0 0 4px 0', fontSize: 17, fontWeight: 700 },
  subtitle:   { margin: '0 0 14px 0', fontSize: 13, color: `var(--ink-low, #888)`, fontFamily: `var(--font-mono, monospace)` },
  svgWrap:    { background: `var(--depth, #111)`, borderRadius: 8, border: `1px solid var(--rim, #333)`, overflow: 'hidden' },
  controls:   { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  btn:        { padding: '6px 14px', borderRadius: 6, border: `1px solid var(--rim, #555)`, background: `var(--depth, #111)`, color: `var(--ink-hi, #eee)`, cursor: 'pointer', fontSize: 13 },
  btnPrime:   { padding: '6px 14px', borderRadius: 6, border: `1px solid var(--prime, #F0A500)`, background: `var(--prime, #F0A500)`, color: '#000', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  monoBox:    { marginTop: 12, padding: '12px 14px', background: `var(--depth, #111)`, border: `1px solid var(--rim, #333)`, borderRadius: 6, fontFamily: `var(--font-mono, monospace)`, fontSize: 12, color: `var(--ink-mid, #aaa)`, lineHeight: 1.7 },
  sliderCard: { marginTop: 12, padding: '12px 14px', background: `var(--depth, #111)`, border: `1px solid var(--rim, #333)`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 },
  sliderRow:  { display: 'flex', alignItems: 'center', gap: 10 },
  sliderLabel:{ fontSize: 12, fontFamily: `var(--font-mono, monospace)`, color: `var(--ink-mid, #aaa)`, minWidth: 150 },
  slider:     { flex: 1, accentColor: `var(--prime, #F0A500)`, cursor: 'pointer' },
  monoVal:    { fontFamily: `var(--font-mono, monospace)`, fontSize: 12, color: `var(--prime, #F0A500)`, minWidth: 42, textAlign: 'right' },
  gradSection:{ marginTop: 16 },
  gradTitle:  { fontSize: 13, fontWeight: 600, color: `var(--ink-hi, #eee)`, marginBottom: 8 },
  gradRow:    { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  gradLabel:  { fontSize: 12, fontFamily: `var(--font-mono, monospace)`, color: `var(--ink-mid, #aaa)`, width: 150, flexShrink: 0 },
  note:       { marginTop: 12, padding: '10px 14px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 6, fontSize: 12, color: `var(--ink-mid, #aaa)`, lineHeight: 1.6 },
};

const VB_W = 600, VB_H = 220;
const STEP_X = [75, 225, 375, 525];
const BOX_W_X = 90, BOX_H_X = 36, BOX_Y_X = 165;
const BOX_W_H = 90, BOX_H_H = 56, BOX_Y_H = 88;
const AMBER = '#F0A500';

function fmt(v) { return v.toFixed(4); }
function fmtVec(h) { return `[${h.map(fmt).join(', ')}]`; }

function ArrowMarker({ id, color }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill={color} />
    </marker>
  );
}

function TimeStep({ idx, cx, selected, faded, onSelect, hiddenStates }) {
  const step = idx + 1;
  const h = hiddenStates[idx];
  const word = WORDS[idx];
  const isActive = selected === step;
  const opacity = faded ? 0.3 : 1;
  const boxColor = isActive ? AMBER : 'var(--rim, #333)';
  const textColor = isActive ? AMBER : 'var(--ink-mid, #aaa)';
  const hBg = 'rgba(255,255,255,0.04)';
  const xBg = 'var(--depth, #111)';
  const xLeft = cx - BOX_W_X / 2;
  const hLeft = cx - BOX_W_H / 2;
  const arrowX = cx;
  const arrowY1 = BOX_Y_X;
  const arrowY2 = BOX_Y_H + BOX_H_H;
  const markerId = isActive ? 'arrow-active' : faded ? 'arrow-faded' : 'arrow-normal';

  return (
    <g opacity={opacity} style={{ cursor: 'pointer' }} onClick={() => onSelect(step)}>
      <rect x={hLeft} y={BOX_Y_H} width={BOX_W_H} height={BOX_H_H} rx={5} fill={hBg} stroke={boxColor} strokeWidth={isActive ? 1.8 : 1} />
      <text x={cx} y={BOX_Y_H + 13} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono, monospace)" fill={textColor}>{`h${step}`}</text>
      {h.map((v, i) => (
        <text key={i} x={cx} y={BOX_Y_H + 24 + i * 11} textAnchor="middle" fontSize={8} fontFamily="var(--font-mono, monospace)" fill={isActive ? AMBER : 'var(--ink-low, #666)'}>{fmt(v)}</text>
      ))}
      <rect x={xLeft} y={BOX_Y_X} width={BOX_W_X} height={BOX_H_X} rx={5} fill={xBg} stroke={boxColor} strokeWidth={isActive ? 1.8 : 1} />
      <text x={cx} y={BOX_Y_X + 13} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono, monospace)" fill={textColor}>{`x${step}`}</text>
      <text x={cx} y={BOX_Y_X + 26} textAnchor="middle" fontSize={10} fontWeight={isActive ? 700 : 400} fontFamily="var(--font-sans, sans-serif)" fill={isActive ? AMBER : 'var(--ink-mid, #aaa)'}>{word}</text>
      <line x1={arrowX} y1={arrowY1 - 2} x2={arrowX} y2={arrowY2 + 2} stroke={isActive ? AMBER : 'var(--ink-low, #555)'} strokeWidth={1.2} markerEnd={`url(#${markerId})`} />
      <text x={cx} y={BOX_Y_H - 6} textAnchor="middle" fontSize={9} fill={isActive ? AMBER : 'var(--ink-low, #555)'} fontFamily="var(--font-mono, monospace)">{`t=${step}`}</text>
    </g>
  );
}

function RecurrentArrow({ fromIdx, toIdx, selected, faded }) {
  const fromCx = STEP_X[fromIdx];
  const toCx = STEP_X[toIdx];
  const y = BOX_Y_H + BOX_H_H / 2;
  const x1 = fromCx + BOX_W_H / 2;
  const x2 = toCx - BOX_W_H / 2 - 2;
  const isActive = selected === toIdx + 1;
  const opacity = faded ? 0.3 : 1;
  const color = isActive ? AMBER : 'var(--ink-low, #555)';
  const markerId = isActive ? 'arrow-active' : faded ? 'arrow-faded' : 'arrow-normal';
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={1.2} opacity={opacity} markerEnd={`url(#${markerId})`} />;
}

function H0Ghost({ selected }) {
  const cx = 10;
  const y = BOX_Y_H + BOX_H_H / 2;
  const isActive = selected === 1;
  return (
    <g opacity={0.4}>
      <text x={cx + 2} y={BOX_Y_H + BOX_H_H / 2 + 4} fontSize={9} fontFamily="var(--font-mono, monospace)" fill={isActive ? AMBER : 'var(--ink-low, #555)'}>h₀</text>
      <line x1={cx + 16} y1={y} x2={STEP_X[0] - BOX_W_H / 2 - 2} y2={y} stroke={isActive ? AMBER : 'var(--ink-low, #555)'} strokeWidth={1} strokeDasharray="3,3" markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow-faded)'} />
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const RNNViz = forwardRef(function RNNViz(props, ref) {
  const [selectedStep, setSelectedStep] = useState(1);
  const [wScale, setWScale] = useState(1.0);      // recurrent-weight multiplier
  const [inputGain, setInputGain] = useState(1.0); // input-sequence magnitude
  const animRef = useRef(null);

  const play = useCallback(() => {
    if (animRef.current) return;
    animRef.current = setInterval(() => setSelectedStep(s => s < 4 ? s + 1 : 1), 1200);
  }, []);
  const pause = useCallback(() => { if (animRef.current) { clearInterval(animRef.current); animRef.current = null; } }, []);
  const reset = useCallback(() => { pause(); setSelectedStep(1); setWScale(1.0); setInputGain(1.0); }, [pause]);
  const step = useCallback(() => { pause(); setSelectedStep(s => s < 4 ? s + 1 : 1); }, [pause]);
  useImperativeHandle(ref, () => ({ play, pause, reset, step }), [play, pause, reset, step]);
  useEffect(() => () => { if (animRef.current) clearInterval(animRef.current); }, []);

  // Recompute the whole forward pass from the sliders.
  const { W_h, emb, states } = useMemo(() => runForward(wScale, inputGain), [wScale, inputGain]);
  const hiddenStates = states.map(s => s.h);

  // REAL gradient-through-time norms (replaces the old hardcoded GRAD_DATA).
  const gradNorms = useMemo(() => gradientNorms(states, W_h), [states, W_h]);
  const maxGrad = Math.max(...gradNorms, 1e-9);
  // Per-step Jacobian spectral norm — the multiplier that decides vanish/explode.
  const jacNorms = useMemo(
    () => states.map(s => specNorm(stepJacobian(s.h, W_h))),
    [states, W_h]
  );
  const avgJac = jacNorms.reduce((a, b) => a + b, 0) / jacNorms.length;

  const regime = avgJac < 0.85 ? { label: 'vanishing', color: '#fb923c' }
    : avgJac > 1.15 ? { label: 'exploding', color: '#ef4444' }
    : { label: 'stable', color: '#4ade80' };

  const compPanel = useMemo(() => {
    const t = selectedStep - 1;
    const s = states[t];
    const hp = t === 0 ? h0 : states[t - 1].h;
    return { t, h: s.h, hp, x: emb[t], word: WORDS[t], wh: s.wh, wx: s.wx, raw: s.raw };
  }, [selectedStep, states, emb]);

  const { hp, x, word, wh, wx, raw, h } = compPanel;

  return (
    <div style={S.root}>
      <h3 style={S.title}>Recurrent Neural Network (RNN)</h3>
      <p style={S.subtitle}>h_t = tanh(W_h · h_{`{t-1}`} + W_x · x_t + b) — drag the sliders, watch states & gradients recompute</p>

      <div style={S.svgWrap}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <defs>
            <ArrowMarker id="arrow-active" color={AMBER} />
            <ArrowMarker id="arrow-normal" color="#555" />
            <ArrowMarker id="arrow-faded" color="#444" />
          </defs>
          <H0Ghost selected={selectedStep} />
          {[0, 1, 2].map(i => (
            <RecurrentArrow key={i} fromIdx={i} toIdx={i + 1} selected={selectedStep} faded={i + 2 > selectedStep} />
          ))}
          {STEP_X.map((cx, idx) => (
            <TimeStep key={idx} idx={idx} cx={cx} selected={selectedStep} faded={idx + 1 > selectedStep} onSelect={setSelectedStep} hiddenStates={hiddenStates} />
          ))}
        </svg>
      </div>

      {/* ── Live sliders: recurrent weight scale + input gain ── */}
      <div style={S.sliderCard}>
        <div style={S.sliderRow}>
          <span style={S.sliderLabel}>recurrent scale ·W_h</span>
          <input type="range" min={0.2} max={2.5} step={0.05} value={wScale}
            onChange={e => setWScale(parseFloat(e.target.value))} style={S.slider} />
          <span style={S.monoVal}>{wScale.toFixed(2)}×</span>
        </div>
        <div style={S.sliderRow}>
          <span style={S.sliderLabel}>input gain ·x_t</span>
          <input type="range" min={0} max={3} step={0.05} value={inputGain}
            onChange={e => setInputGain(parseFloat(e.target.value))} style={S.slider} />
          <span style={S.monoVal}>{inputGain.toFixed(2)}×</span>
        </div>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-low)' }}>
          mean Jacobian norm ‖∂h_t/∂h_{`{t-1}`}‖ ={' '}
          <span style={{ color: regime.color, fontWeight: 700 }}>{avgJac.toFixed(3)}</span>{' '}
          → <span style={{ color: regime.color, fontWeight: 700 }}>{regime.label}</span>
          {' '}(&lt;1 shrinks gradients each step, &gt;1 explodes them)
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={S.controls}>
        <button style={selectedStep > 1 ? S.btn : { ...S.btn, opacity: 0.4, cursor: 'default' }} onClick={() => setSelectedStep(s => Math.max(1, s - 1))} disabled={selectedStep === 1}>← Prev</button>
        {[1, 2, 3, 4].map(s => (
          <button key={s} style={selectedStep === s ? S.btnPrime : S.btn} onClick={() => setSelectedStep(s)}>{`t=${s}`}</button>
        ))}
        <button style={selectedStep < 4 ? S.btn : { ...S.btn, opacity: 0.4, cursor: 'default' }} onClick={() => setSelectedStep(s => Math.min(4, s + 1))} disabled={selectedStep === 4}>Next →</button>
      </div>

      {/* ── Computation panel ── */}
      <div style={S.monoBox}>
        <div style={{ color: AMBER, marginBottom: 4, fontWeight: 600 }}>{`Computation at t=${selectedStep}  (x_${selectedStep} = "${word}")`}</div>
        <div>{`Formula:  h_t = tanh(${wScale.toFixed(2)}·W_h · h_{t-1} + W_x · x_t + b)`}</div>
        <div style={{ marginTop: 6 }}>{`h_{t-1} = ${fmtVec(hp)}`}</div>
        <div>{`x_t     = [${x.map(v => v.toFixed(2)).join(', ')}]  (gain ${inputGain.toFixed(2)}×)`}</div>
        <div style={{ marginTop: 6 }}>{`W_h · h_{t-1} = [${wh.map(fmt).join(', ')}]`}</div>
        <div>{`W_x · x_t     = [${wx.map(fmt).join(', ')}]`}</div>
        <div>{`b             = [${b.map(fmt).join(', ')}]`}</div>
        <div style={{ marginTop: 6 }}>{`raw sum       = [${raw.map(fmt).join(', ')}]`}</div>
        <div style={{ color: AMBER, marginTop: 4 }}>{`h_${selectedStep} = tanh(raw) = ${fmtVec(h)}`}</div>
      </div>

      {/* ── REAL vanishing/exploding gradient section ── */}
      <div style={S.gradSection}>
        <div style={S.gradTitle}>Gradient through time — ‖∂L/∂h_t‖ (computed live)</div>
        {gradNorms.map((g, i) => {
          const frac = g / maxGrad;
          const barColor = g < 0.05 ? '#fb923c' : g > 5 ? '#ef4444' : 'var(--prime, #F0A500)';
          return (
            <div key={i} style={S.gradRow}>
              <span style={S.gradLabel}>{`h_${i + 1}  ‖∇‖ = ${g < 0.001 ? g.toExponential(1) : g.toFixed(3)}`}</span>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 2, height: 14 }}>
                <div style={{ height: 14, width: `${Math.max(2, Math.round(frac * 100))}%`, background: barColor, borderRadius: 2, opacity: 0.4 + 0.6 * frac, transition: 'width 0.15s' }} />
              </div>
            </div>
          );
        })}
        <div style={S.note}>
          These bars are the <b>actual</b> gradient norms backpropagated through the tanh chain for the current sliders.
          Lower <b>recurrent scale</b> → mean Jacobian norm &lt; 1 → ‖∇‖ at h₁ collapses toward zero (vanishing).
          Push the scale past ~1.4 → norm &gt; 1 → the earliest gradients blow up (exploding). LSTMs add gates that keep this multiplier near 1.
        </div>
      </div>
    </div>
  );
});
