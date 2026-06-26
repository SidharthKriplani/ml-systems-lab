import { useState, useMemo } from 'react';

// ─── Module-scope math ───────────────────────────────────────────────────────

const W_h = [[0.5, -0.3, 0.2], [-0.4, 0.6, -0.1], [0.3, -0.2, 0.7]];
const W_x = [[0.8, -0.5], [0.3, 0.9], [-0.6, 0.4]];
const b   = [0.1, -0.1, 0.05];
const h0  = [0, 0, 0];

const WORDS    = ['I', 'love', 'ML', 'because'];
const WORD_EMB = [[1.0, 0.0], [0.8, 0.6], [0.3, 0.9], [0.6, 0.3]];

function matVec(M, v) {
  return M.map(row => row.reduce((s, m, j) => s + m * v[j], 0));
}

function rnnStep(h_prev, x) {
  const wh = matVec(W_h, h_prev);
  const wx = matVec(W_x, x);
  return wh.map((v, i) => Math.tanh(v + wx[i] + b[i]));
}

const h1 = rnnStep(h0, WORD_EMB[0]);
const h2 = rnnStep(h1, WORD_EMB[1]);
const h3 = rnnStep(h2, WORD_EMB[2]);
const h4 = rnnStep(h3, WORD_EMB[3]);

const HIDDEN_STATES = [h1, h2, h3, h4];
const H_PREV        = [h0, h1, h2, h3];

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
  gradSection:{ marginTop: 16 },
  gradTitle:  { fontSize: 13, fontWeight: 600, color: `var(--ink-hi, #eee)`, marginBottom: 8 },
  gradRow:    { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  gradLabel:  { fontSize: 12, fontFamily: `var(--font-mono, monospace)`, color: `var(--ink-mid, #aaa)`, width: 110, flexShrink: 0 },
  gradBar:    (frac) => ({ height: 14, width: `${Math.round(frac * 100)}%`, background: `var(--prime, #F0A500)`, borderRadius: 2, opacity: 0.4 + 0.6 * frac }),
  note:       { marginTop: 12, padding: '10px 14px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 6, fontSize: 12, color: `var(--ink-mid, #aaa)`, lineHeight: 1.6 },
};

// ─── Gradient data ───────────────────────────────────────────────────────────

const GRAD_DATA = [
  { label: 'h_1 ||∇|| ≈ 0.12', frac: 0.12 },
  { label: 'h_2 ||∇|| ≈ 0.32', frac: 0.32 },
  { label: 'h_3 ||∇|| ≈ 0.65', frac: 0.65 },
  { label: 'h_4 ||∇|| ≈ 1.00', frac: 1.00 },
];

// ─── SVG layout constants ────────────────────────────────────────────────────

const VB_W   = 600;
const VB_H   = 220;
const STEP_X = [75, 225, 375, 525];   // center x of each time-step column

const BOX_W_X = 90; const BOX_H_X = 36; const BOX_Y_X = 165;
const BOX_W_H = 90; const BOX_H_H = 56; const BOX_Y_H = 88;

const AMBER = '#F0A500';

function fmt(v) { return v.toFixed(4); }
function fmtVec(h) { return `[${h.map(fmt).join(', ')}]`; }

// ─── SVG sub-components ───────────────────────────────────────────────────────

function ArrowMarker({ id, color }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill={color} />
    </marker>
  );
}

function TimeStep({ idx, cx, selected, faded, onSelect }) {
  const step  = idx + 1;
  const h     = HIDDEN_STATES[idx];
  const word  = WORDS[idx];

  const isActive  = selected === step;
  const opacity   = faded ? 0.3 : 1;

  const boxColor  = isActive ? AMBER : 'var(--rim, #333)';
  const textColor = isActive ? AMBER : 'var(--ink-mid, #aaa)';
  const hBg       = 'rgba(255,255,255,0.04)';
  const xBg       = 'var(--depth, #111)';

  const xLeft = cx - BOX_W_X / 2;
  const hLeft = cx - BOX_W_H / 2;

  // x_t → h_t vertical arrow: from top of x_t box up to bottom of h_t box
  const arrowX  = cx;
  const arrowY1 = BOX_Y_X;             // top of x_t box
  const arrowY2 = BOX_Y_H + BOX_H_H;  // bottom of h_t box

  const markerId = isActive ? 'arrow-active' : faded ? 'arrow-faded' : 'arrow-normal';

  return (
    <g opacity={opacity} style={{ cursor: 'pointer' }} onClick={() => onSelect(step)}>
      {/* h_t box */}
      <rect
        x={hLeft} y={BOX_Y_H}
        width={BOX_W_H} height={BOX_H_H}
        rx={5}
        fill={hBg}
        stroke={boxColor}
        strokeWidth={isActive ? 1.8 : 1}
      />
      {/* h_t label */}
      <text
        x={cx} y={BOX_Y_H + 13}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono, monospace)"
        fill={textColor}
      >
        {`h${step}`}
      </text>
      {/* hidden values — 3 lines */}
      {h.map((v, i) => (
        <text
          key={i}
          x={cx} y={BOX_Y_H + 24 + i * 11}
          textAnchor="middle"
          fontSize={8}
          fontFamily="var(--font-mono, monospace)"
          fill={isActive ? AMBER : 'var(--ink-low, #666)'}
        >
          {fmt(v)}
        </text>
      ))}

      {/* x_t box */}
      <rect
        x={xLeft} y={BOX_Y_X}
        width={BOX_W_X} height={BOX_H_X}
        rx={5}
        fill={xBg}
        stroke={boxColor}
        strokeWidth={isActive ? 1.8 : 1}
      />
      {/* x_t label + word */}
      <text
        x={cx} y={BOX_Y_X + 13}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono, monospace)"
        fill={textColor}
      >
        {`x${step}`}
      </text>
      <text
        x={cx} y={BOX_Y_X + 26}
        textAnchor="middle"
        fontSize={10}
        fontWeight={isActive ? 700 : 400}
        fontFamily="var(--font-sans, sans-serif)"
        fill={isActive ? AMBER : 'var(--ink-mid, #aaa)'}
      >
        {word}
      </text>

      {/* vertical arrow x_t → h_t */}
      <line
        x1={arrowX} y1={arrowY1 - 2}
        x2={arrowX} y2={arrowY2 + 2}
        stroke={isActive ? AMBER : 'var(--ink-low, #555)'}
        strokeWidth={1.2}
        markerEnd={`url(#${markerId})`}
      />

      {/* step label above h_t box */}
      <text
        x={cx} y={BOX_Y_H - 6}
        textAnchor="middle"
        fontSize={9}
        fill={isActive ? AMBER : 'var(--ink-low, #555)'}
        fontFamily="var(--font-mono, monospace)"
      >
        {`t=${step}`}
      </text>
    </g>
  );
}

function RecurrentArrow({ fromIdx, toIdx, selected, faded }) {
  const fromCx = STEP_X[fromIdx];
  const toCx   = STEP_X[toIdx];
  const y      = BOX_Y_H + BOX_H_H / 2;

  const x1 = fromCx + BOX_W_H / 2;
  const x2 = toCx   - BOX_W_H / 2 - 2;

  const isActive = selected === toIdx + 1;
  const opacity  = faded ? 0.3 : 1;
  const color    = isActive ? AMBER : 'var(--ink-low, #555)';
  const markerId = isActive ? 'arrow-active' : faded ? 'arrow-faded' : 'arrow-normal';

  return (
    <line
      x1={x1} y1={y}
      x2={x2} y2={y}
      stroke={color}
      strokeWidth={1.2}
      opacity={opacity}
      markerEnd={`url(#${markerId})`}
    />
  );
}

// h_0 ghost label at far left
function H0Ghost({ selected }) {
  const cx   = 10;
  const y    = BOX_Y_H + BOX_H_H / 2;
  const isActive = selected === 1;
  return (
    <g opacity={0.4}>
      <text
        x={cx + 2} y={BOX_Y_H + BOX_H_H / 2 + 4}
        fontSize={9}
        fontFamily="var(--font-mono, monospace)"
        fill={isActive ? AMBER : 'var(--ink-low, #555)'}
      >
        h₀
      </text>
      <line
        x1={cx + 16} y1={y}
        x2={STEP_X[0] - BOX_W_H / 2 - 2} y2={y}
        stroke={isActive ? AMBER : 'var(--ink-low, #555)'}
        strokeWidth={1}
        strokeDasharray="3,3"
        markerEnd={isActive ? 'url(#arrow-active)' : 'url(#arrow-faded)'}
      />
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RNNViz() {
  const [selectedStep, setSelectedStep] = useState(1);

  const compPanel = useMemo(() => {
    const t    = selectedStep - 1;  // 0-indexed
    const h    = HIDDEN_STATES[t];
    const hp   = H_PREV[t];
    const x    = WORD_EMB[t];
    const word = WORDS[t];

    const wh = matVec(W_h, hp);
    const wx = matVec(W_x, x);
    const raw = wh.map((v, i) => v + wx[i] + b[i]);

    return { t, h, hp, x, word, wh, wx, raw };
  }, [selectedStep]);

  const { t, h, hp, x, word, wh, wx, raw } = compPanel;

  return (
    <div style={S.root}>
      <h3 style={S.title}>Recurrent Neural Network (RNN)</h3>
      <p style={S.subtitle}>h_t = tanh(W_h · h_{`{t-1}`} + W_x · x_t + b) — click a time step to inspect</p>

      {/* ── SVG Diagram ── */}
      <div style={S.svgWrap}>
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <ArrowMarker id="arrow-active" color={AMBER} />
            <ArrowMarker id="arrow-normal" color="#555" />
            <ArrowMarker id="arrow-faded"  color="#444" />
          </defs>

          {/* h_0 ghost */}
          <H0Ghost selected={selectedStep} />

          {/* Recurrent arrows between steps */}
          {[0, 1, 2].map(i => (
            <RecurrentArrow
              key={i}
              fromIdx={i}
              toIdx={i + 1}
              selected={selectedStep}
              faded={i + 2 > selectedStep}
            />
          ))}

          {/* Time steps */}
          {STEP_X.map((cx, idx) => (
            <TimeStep
              key={idx}
              idx={idx}
              cx={cx}
              selected={selectedStep}
              faded={idx + 1 > selectedStep}
              onSelect={setSelectedStep}
            />
          ))}
        </svg>
      </div>

      {/* ── Controls ── */}
      <div style={S.controls}>
        <button
          style={selectedStep > 1 ? S.btn : { ...S.btn, opacity: 0.4, cursor: 'default' }}
          onClick={() => setSelectedStep(s => Math.max(1, s - 1))}
          disabled={selectedStep === 1}
        >
          ← Prev
        </button>
        {[1, 2, 3, 4].map(s => (
          <button
            key={s}
            style={selectedStep === s ? S.btnPrime : S.btn}
            onClick={() => setSelectedStep(s)}
          >
            {`t=${s}`}
          </button>
        ))}
        <button
          style={selectedStep < 4 ? S.btn : { ...S.btn, opacity: 0.4, cursor: 'default' }}
          onClick={() => setSelectedStep(s => Math.min(4, s + 1))}
          disabled={selectedStep === 4}
        >
          Next →
        </button>
      </div>

      {/* ── Computation panel ── */}
      <div style={S.monoBox}>
        <div style={{ color: AMBER, marginBottom: 4, fontWeight: 600 }}>
          {`Computation at t=${selectedStep}  (x_${selectedStep} = "${word}")`}
        </div>
        <div>{`Formula:  h_t = tanh(W_h · h_{t-1} + W_x · x_t + b)`}</div>
        <div style={{ marginTop: 6 }}>
          {`h_{t-1} = ${fmtVec(hp)}`}
        </div>
        <div>{`x_t     = [${x.map(v => v.toFixed(2)).join(', ')}]`}</div>
        <div style={{ marginTop: 6 }}>
          {`W_h · h_{t-1} = [${wh.map(fmt).join(', ')}]`}
        </div>
        <div>{`W_x · x_t     = [${wx.map(fmt).join(', ')}]`}</div>
        <div>{`b             = [${b.map(fmt).join(', ')}]`}</div>
        <div style={{ marginTop: 6 }}>
          {`raw sum       = [${raw.map(fmt).join(', ')}]`}
        </div>
        <div style={{ color: AMBER, marginTop: 4 }}>
          {`h_${selectedStep} = tanh(raw) = ${fmtVec(h)}`}
        </div>
      </div>

      {/* ── Vanishing gradient section ── */}
      <div style={S.gradSection}>
        <div style={S.gradTitle}>Vanishing Gradient Problem</div>
        {GRAD_DATA.map(({ label, frac }) => (
          <div key={label} style={S.gradRow}>
            <span style={S.gradLabel}>{label}</span>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 2, height: 14 }}>
              <div style={S.gradBar(frac)} />
            </div>
          </div>
        ))}
        <div style={S.note}>
          {`Gradients shrink exponentially going back through time — the vanishing gradient problem. LSTM solves this with gates that control gradient flow.`}
        </div>
      </div>
    </div>
  );
}
