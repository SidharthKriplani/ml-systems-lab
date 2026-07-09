import React, { useState } from 'react';

// ─── GradientBoostingScenes.jsx ───────────────────────────────────────────────
// Inline 3B1B-style scenes for the `gradient_boosting` module (3B1B-STANDARD.md).
// Persistent object shared across ALL THREE scenes: the same 4 houses and the
// same per-house gradient/Hessian values derived once from F0 = 337.5k (see
// classicalMLModules.js `gradient_boosting`.summary for the by-hand derivation
// this file's constants must match exactly — cross-checked, do not edit one
// without the other).
//
//   House   size (sqft)   price ($k)   residual0 = price − F0   g = −residual0   h
//   A       800           150          −187.5                   187.5           1
//   B       1200          200          −137.5                    137.5          1
//   C       2000          400          +62.5                    −62.5           1
//   D       3000          600          +262.5                   −262.5          1
//
// (g uses the ℓ(y,ŷ)=½(y−ŷ)² convention, so g_i = ŷ_i − y_i = −residual_i and
// h_i = 1 for every sample — squared error has a flat, constant Hessian; the
// module text explains why that's the point of the contrast with log loss.)
//
// Registered in src/data/foundationScenes.js as:
//   "gradient_boosting/residual_relay", "gradient_boosting/gain_bars",
//   "gradient_boosting/missing_route"

const HOUSES = [
  { name: 'A', size: 800, price: 150 },
  { name: 'B', size: 1200, price: 200 },
  { name: 'C', size: 2000, price: 400 },
  { name: 'D', size: 3000, price: 600 },
];

const F0 = 337.5;

// Per-round step-function segments — hand-derived in the module text (round 1:
// split@1600, leaves ∓162.5 × η=0.5 = ∓81.25; round 2: split@2500 on the NEW
// residuals, leaves −60.41667/+181.25 × η=0.5 = −30.20833/+90.625).
const ROUNDS = [
  {
    round: 0,
    preds: [337.5, 337.5, 337.5, 337.5],
    segments: [{ from: 800, to: 3000, y: 337.5 }],
    note: 'F0 — the laziest guess: predict the mean for everyone.',
  },
  {
    round: 1,
    preds: [256.25, 256.25, 418.75, 418.75],
    segments: [
      { from: 800, to: 1600, y: 256.25 },
      { from: 1600, to: 3000, y: 418.75 },
    ],
    splitAt: 1600,
    note: 'Tree 1 splits at size < 1600 — A,B get −81.25k, C,D get +81.25k.',
  },
  {
    round: 2,
    preds: [226.04167, 226.04167, 388.54167, 509.375],
    segments: [
      { from: 800, to: 1600, y: 226.04167 },
      { from: 1600, to: 2500, y: 388.54167 },
      { from: 2500, to: 3000, y: 509.375 },
    ],
    splitAt: 2500,
    note: 'Tree 2 splits at size < 2500 — a NEW boundary, chasing what tree 1 left over.',
  },
];

const VB_W = 520, VB_H = 220;
const PAD = { l: 46, r: 20, t: 20, b: 30 };
function sizeToX(size) {
  return PAD.l + ((size - 800) / (3000 - 800)) * (VB_W - PAD.l - PAD.r);
}
function priceToY(price) {
  const yMin = 100, yMax = 650;
  return VB_H - PAD.b - ((price - yMin) / (yMax - yMin)) * (VB_H - PAD.t - PAD.b);
}

const cssVar = (name, fallback) => `var(${name}, ${fallback})`;

const panelStyle = {
  background: cssVar('--depth', '#1c1c1c'),
  border: `1px solid ${cssVar('--rim', '#333')}`,
  borderRadius: '8px',
  padding: '12px 14px',
  fontFamily: cssVar('--font-sans', 'sans-serif'),
};

const labelStyle = {
  fontSize: '0.68rem',
  fontWeight: 700,
  color: cssVar('--prime', '#e8a030'),
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.5rem',
};

const btnBase = {
  padding: '5px 12px',
  borderRadius: '5px',
  border: `1px solid ${cssVar('--rim', '#333')}`,
  background: cssVar('--surface', '#252525'),
  color: cssVar('--ink-mid', '#ddd'),
  fontSize: '0.78rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: cssVar('--font-sans', 'sans-serif'),
};

const btnPrimary = {
  ...btnBase,
  background: cssVar('--prime', '#e8a030'),
  color: '#1a1208',
  border: 'none',
};

// ─── Scene 1 — the residual relay ─────────────────────────────────────────────
export function GBResidualRelayScene() {
  const [round, setRound] = useState(0);
  const [gateAsked, setGateAsked] = useState(false);
  const [gateChoice, setGateChoice] = useState(null);

  const data = ROUNDS[round];
  const residuals = HOUSES.map((h, i) => h.price - data.preds[i]);
  const mae = residuals.reduce((s, r) => s + Math.abs(r), 0) / 4;
  const mse = residuals.reduce((s, r) => s + r * r, 0) / 4;
  const prevMse = round > 0 ? (() => {
    const prevResid = HOUSES.map((h, i) => h.price - ROUNDS[round - 1].preds[i]);
    return prevResid.reduce((s, r) => s + r * r, 0) / 4;
  })() : null;

  function handleNext() {
    if (round === 0) { setRound(1); return; }
    if (round === 1 && !gateAsked) { setGateAsked(true); return; }
  }
  function handleGateChoice(i) {
    setGateChoice(i);
    setRound(2);
  }
  function handleReset() {
    setRound(0); setGateAsked(false); setGateChoice(null);
  }

  const GATE_OPTIONS = [
    'A,B | C,D — same grouping as round 1',
    'A alone | B,C,D',
    'A,B,C | D',
  ];
  const CORRECT_GATE = 2;

  return (
    <div style={panelStyle}>
      <div style={labelStyle}>Scene · The residual relay</div>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', height: 220, display: 'block' }}>
        {/* axes */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={VB_H - PAD.b} stroke={cssVar('--rim', '#333')} strokeWidth="1" />
        <line x1={PAD.l} y1={VB_H - PAD.b} x2={VB_W - PAD.r} y2={VB_H - PAD.b} stroke={cssVar('--rim', '#333')} strokeWidth="1" />
        <text x={PAD.l} y={14} fontSize="9" fill={cssVar('--ink-low', '#999')}>price ($k)</text>
        <text x={VB_W - PAD.r} y={VB_H - 8} fontSize="9" textAnchor="end" fill={cssVar('--ink-low', '#999')}>size (sqft) →</text>

        {/* prediction step-function */}
        {data.segments.map((seg, i) => {
          const x1 = sizeToX(seg.from), x2 = sizeToX(seg.to), y = priceToY(seg.y);
          return <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke={cssVar('--prime', '#e8a030')} strokeWidth="2.4" />;
        })}
        {data.segments.slice(1).map((seg, i) => {
          const prev = data.segments[i];
          const x = sizeToX(seg.from);
          return <line key={`v${i}`} x1={x} y1={priceToY(prev.y)} x2={x} y2={priceToY(seg.y)}
            stroke={cssVar('--prime', '#e8a030')} strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />;
        })}

        {/* residual stems + house points */}
        {HOUSES.map((h, i) => {
          const x = sizeToX(h.size);
          const yPred = priceToY(data.preds[i]);
          const yTrue = priceToY(h.price);
          const r = residuals[i];
          const stemColor = r >= 0 ? '#EF4444' : '#60A5FA';
          return (
            <g key={h.name}>
              <line x1={x} y1={yPred} x2={x} y2={yTrue} stroke={stemColor} strokeWidth="2" />
              <circle cx={x} cy={yTrue} r="5" fill={cssVar('--prime', '#e8a030')} stroke="#000" strokeOpacity="0.4" />
              <text x={x} y={yTrue - 9} fontSize="9" textAnchor="middle" fill={cssVar('--ink-hi', '#f4f4f4')} fontWeight="700">{h.name}</text>
              <text x={x} y={VB_H - PAD.b + 14} fontSize="8" textAnchor="middle" fill={cssVar('--ink-low', '#999')}>{h.size}</text>
              <text x={x + 8} y={(yPred + yTrue) / 2 + 3} fontSize="8" fontFamily={cssVar('--font-mono', 'monospace')}
                fill={stemColor}>{r >= 0 ? '+' : ''}{r.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>

      <div style={{ fontSize: '0.78rem', color: cssVar('--ink-mid', '#ddd'), marginTop: '0.4rem', lineHeight: 1.5 }}>
        <strong style={{ color: cssVar('--ink-hi', '#f4f4f4') }}>Round {round}.</strong> {data.note}
        <div style={{ marginTop: '0.3rem', fontFamily: cssVar('--font-mono', 'monospace'), fontSize: '0.74rem', color: cssVar('--ink-low', '#999') }}>
          MAE = ${mae.toFixed(3)}k · MSE = {mse.toFixed(2)}
          {prevMse !== null && <span style={{ color: '#4ade80', marginLeft: 8 }}>({((1 - mse / prevMse) * 100).toFixed(1)}% MSE drop vs round {round - 1})</span>}
        </div>
      </div>

      {gateAsked && round === 1 && (
        <div style={{
          marginTop: '0.7rem', padding: '0.6rem 0.8rem', borderRadius: '6px',
          border: `1px solid ${cssVar('--prime', '#e8a030')}`, background: 'rgba(232,160,48,0.08)',
        }}>
          <div style={{ fontSize: '0.78rem', color: cssVar('--ink-hi', '#f4f4f4'), marginBottom: '0.5rem', fontWeight: 600 }}>
            Pause and predict: tree 2 fits the NEW residuals (−106.25, −56.25, −18.75, +181.25). Which pair will it group together?
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {GATE_OPTIONS.map((opt, i) => (
              <button key={i} onClick={() => handleGateChoice(i)} style={btnBase}>{opt}</button>
            ))}
          </div>
        </div>
      )}

      {gateChoice !== null && round === 2 && (
        <div style={{
          marginTop: '0.7rem', padding: '0.6rem 0.8rem', borderRadius: '6px',
          border: `1px solid ${gateChoice === CORRECT_GATE ? '#4ade80' : '#f87171'}`,
          background: gateChoice === CORRECT_GATE ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
          fontSize: '0.78rem', color: cssVar('--ink-mid', '#ddd'), lineHeight: 1.5,
        }}>
          {gateChoice === CORRECT_GATE ? 'Correct. ' : `You picked "${GATE_OPTIONS[gateChoice]}" — the actual split is A,B,C | D. `}
          Tree 1 already fixed the small-vs-big gap; the biggest miss left over is D alone (+181.25k, still badly under-priced), so tree 2 isolates D instead of repeating tree 1's split. Boosting never re-groups by the original target — only by whatever the current residual pattern is.
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
        <button onClick={handleNext} disabled={round >= 2 || (round === 1 && gateAsked)}
          style={round >= 2 || (round === 1 && gateAsked) ? { ...btnPrimary, opacity: 0.4, cursor: 'not-allowed' } : btnPrimary}>
          {round === 0 ? 'Fit tree 1 →' : round === 1 ? 'Fit tree 2 →' : 'Done'}
        </button>
        <button onClick={handleReset} style={btnBase}>Reset</button>
      </div>

      {round === 2 && (
        <div style={{ marginTop: '0.7rem', fontSize: '0.76rem', color: cssVar('--ink-low', '#999'), lineHeight: 1.5, borderTop: `1px solid ${cssVar('--rim', '#333')}`, paddingTop: '0.6rem' }}>
          Zoom out: this two-tree relay is the entire boosting loop, run twice. XGBoost runs the same relay hundreds of times across millions of rows — fit a shallow tree to whatever's currently wrong, shrink it by η, add it in, repeat. The grouping is never planned ahead; it falls out of whichever residual is largest right now.
        </div>
      )}
    </div>
  );
}

// ─── Scene 2 — the gain formula picks a split ─────────────────────────────────
const SPLITS = [
  { threshold: 1000, label: 'size < 1000\n(A | B,C,D)', GL: 187.5, HL: 1, GR: -187.5, HR: 3 },
  { threshold: 1600, label: 'size < 1600\n(A,B | C,D)', GL: 325, HL: 2, GR: -325, HR: 2 },
  { threshold: 2500, label: 'size < 2500\n(A,B,C | D)', GL: 262.5, HL: 3, GR: -262.5, HR: 1 },
];
const G_ROOT = 0, H_ROOT = 4;

function rawGain(split, lambda) {
  return 0.5 * ((split.GL * split.GL) / (split.HL + lambda)
    + (split.GR * split.GR) / (split.HR + lambda)
    - (G_ROOT * G_ROOT) / (H_ROOT + lambda));
}

export function GBGainBarsScene() {
  const [revealed, setRevealed] = useState(false);
  const [guess, setGuess] = useState(null);
  const [lambda, setLambda] = useState(0);
  const [gamma, setGamma] = useState(0);

  const gains = SPLITS.map(s => rawGain(s, lambda));
  const maxGain = Math.max(...gains, 1);
  const winnerIdx = gains.reduce((best, g, i) => (g > gains[best] && g >= gamma ? i : best), 0);

  const VW = 480, VH = 170;
  const bw = 90, gap = 40;
  const chartLeft = 40;

  return (
    <div style={panelStyle}>
      <div style={labelStyle}>Scene · The gain formula picks a split</div>

      {!revealed && (
        <div style={{ fontSize: '0.8rem', color: cssVar('--ink-mid', '#ddd'), marginBottom: '0.6rem', lineHeight: 1.5 }}>
          Predict first: does isolating the single cheapest house (<code>size&lt;1000</code>) win, or does grouping the two cheap houses together (<code>size&lt;1600</code>) win?
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
            <button onClick={() => setGuess(0)} style={guess === 0 ? btnPrimary : btnBase}>size&lt;1000 wins</button>
            <button onClick={() => setGuess(1)} style={guess === 1 ? btnPrimary : btnBase}>size&lt;1600 wins</button>
          </div>
          <button onClick={() => setRevealed(true)} disabled={guess === null}
            style={{ ...btnPrimary, marginTop: '0.6rem', opacity: guess === null ? 0.4 : 1, cursor: guess === null ? 'not-allowed' : 'pointer' }}>
            Reveal gains
          </button>
        </div>
      )}

      {revealed && (
        <>
          <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: 170, display: 'block' }}>
            <line x1={chartLeft} y1={VH - 30} x2={VW - 10} y2={VH - 30} stroke={cssVar('--rim', '#333')} strokeWidth="1" />
            {gamma > 0 && (
              <>
                <line x1={chartLeft} y1={VH - 30 - (gamma / maxGain) * (VH - 50)} x2={VW - 10} y2={VH - 30 - (gamma / maxGain) * (VH - 50)}
                  stroke="#f87171" strokeWidth="1.2" strokeDasharray="4,3" />
                <text x={VW - 12} y={VH - 34 - (gamma / maxGain) * (VH - 50)} textAnchor="end" fontSize="8" fill="#f87171">γ = {gamma.toLocaleString()}</text>
              </>
            )}
            {SPLITS.map((s, i) => {
              const g = gains[i];
              const h = Math.max((g / maxGain) * (VH - 50), 1);
              const x = chartLeft + 14 + i * (bw + gap);
              const passes = g >= gamma;
              const isWinner = passes && i === winnerIdx;
              const color = !passes ? cssVar('--ink-low', '#666') : isWinner ? cssVar('--prime', '#e8a030') : cssVar('--ink-mid', '#888');
              return (
                <g key={s.threshold}>
                  <rect x={x} y={VH - 30 - h} width={bw} height={h} fill={color} opacity={passes ? 1 : 0.35} rx="3" />
                  <text x={x + bw / 2} y={VH - 34 - h} textAnchor="middle" fontSize="9" fontFamily={cssVar('--font-mono', 'monospace')}
                    fill={cssVar('--ink-hi', '#f4f4f4')} fontWeight="700">{g.toFixed(0)}</text>
                  {s.label.split('\n').map((ln, li) => (
                    <text key={li} x={x + bw / 2} y={VH - 12 + li * 10} textAnchor="middle" fontSize="8" fill={cssVar('--ink-low', '#999')}>{ln}</text>
                  ))}
                  {isWinner && <text x={x + bw / 2} y={VH - 30 - h - 12} textAnchor="middle" fontSize="8" fill={cssVar('--prime', '#e8a030')} fontWeight="700">WINNER</text>}
                </g>
              );
            })}
          </svg>

          <div style={{ fontSize: '0.78rem', color: cssVar('--ink-mid', '#ddd'), lineHeight: 1.5, marginTop: '0.3rem' }}>
            {guess !== null && (
              <div style={{ marginBottom: '0.4rem' }}>
                {(guess === 1) ? 'Correct — ' : 'Not quite — '}
                size&lt;1600 wins with the highest gain because it splits on the SIGN of the residual (both A,B are under-priced, both C,D are over-priced), while size&lt;1000 only isolates one point and leaves a mixed-sign group of three on the other side.
              </div>
            )}
            Gain(split) = ½[ G²<sub>L</sub>/(H<sub>L</sub>+λ) + G²<sub>R</sub>/(H<sub>R</sub>+λ) − G²<sub>root</sub>/(H<sub>root</sub>+λ) ] − γ. At λ=0 this is exactly half the SSE a plain regression-tree split would remove — the formula generalizes "reduce squared error" to any differentiable loss.
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.74rem', color: cssVar('--ink-low', '#999'), display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              λ (leaf L2 reg) = {lambda}
              <input type="range" min="0" max="8" step="1" value={lambda} onChange={e => setLambda(Number(e.target.value))}
                style={{ accentColor: cssVar('--prime', '#e8a030'), width: '160px' }} />
            </label>
            <label style={{ fontSize: '0.74rem', color: cssVar('--ink-low', '#999'), display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              γ (min-gain bar) = {gamma.toLocaleString()}
              <input type="range" min="0" max="40000" step="2500" value={gamma} onChange={e => setGamma(Number(e.target.value))}
                style={{ accentColor: cssVar('--prime', '#e8a030'), width: '160px' }} />
            </label>
          </div>
          <div style={{ fontSize: '0.72rem', color: cssVar('--ink-low', '#999'), marginTop: '0.4rem', fontFamily: cssVar('--font-mono', 'monospace') }}>
            leaf weight w* = −G/(H+λ) → size&lt;1600 leaves: w*_L = {(-325 / (2 + lambda)).toFixed(2)}, w*_R = {(325 / (2 + lambda)).toFixed(2)}
            {gains[1] < gamma && <span style={{ color: '#f87171' }}> — gain doesn't clear γ, XGBoost refuses this split and the node stays a single leaf.</span>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Scene 3 — sparsity-aware missing-value routing ───────────────────────────
// Same G/H per house as scenes 1-2, reused: g_A=187.5, g_B=137.5, g_C=−62.5,
// g_D=−262.5, h=1 each. Hypothetical second feature `renovation_year`, present
// for B (2010) and D (2015), missing for A and C, candidate threshold 2012.
export function GBMissingRouteScene() {
  const [revealed, setRevealed] = useState(false);

  // missing → left: {A,C,B} vs {D}
  const leftG = 187.5 - 62.5 + 137.5, leftH = 3;
  const leftG2 = -262.5, leftH2 = 1;
  const gainMissingLeft = 0.5 * ((leftG * leftG) / leftH + (leftG2 * leftG2) / leftH2 - (G_ROOT * G_ROOT) / H_ROOT);

  // missing → right: {B} vs {D,A,C}
  const rightG = 137.5, rightH = 1;
  const rightG2 = -262.5 + 187.5 - 62.5, rightH2 = 3;
  const gainMissingRight = 0.5 * ((rightG * rightG) / rightH + (rightG2 * rightG2) / rightH2 - (G_ROOT * G_ROOT) / H_ROOT);

  const leftWins = gainMissingLeft > gainMissingRight;

  const Panel = ({ title, group1, group2, gain, isWinner }) => (
    <div style={{
      flex: 1, minWidth: 180, border: `1px solid ${isWinner && revealed ? cssVar('--prime', '#e8a030') : cssVar('--rim', '#333')}`,
      borderRadius: '7px', padding: '0.6rem 0.7rem',
      background: isWinner && revealed ? 'rgba(232,160,48,0.08)' : 'transparent',
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: cssVar('--ink-hi', '#f4f4f4'), marginBottom: '0.4rem' }}>{title}</div>
      <div style={{ fontSize: '0.72rem', color: cssVar('--ink-mid', '#ddd'), lineHeight: 1.6 }}>
        <div>Left: {group1}</div>
        <div>Right: {group2}</div>
      </div>
      <div style={{ fontFamily: cssVar('--font-mono', 'monospace'), fontSize: '0.78rem', marginTop: '0.4rem', color: isWinner && revealed ? cssVar('--prime', '#e8a030') : cssVar('--ink-low', '#999'), fontWeight: 700 }}>
        Gain = {revealed ? gain.toFixed(2) : '?'}
        {isWinner && revealed && ' ✓ learned default'}
      </div>
    </div>
  );

  return (
    <div style={panelStyle}>
      <div style={labelStyle}>Scene · Sparsity-aware missing-value routing</div>
      <div style={{ fontSize: '0.78rem', color: cssVar('--ink-mid', '#ddd'), marginBottom: '0.6rem', lineHeight: 1.5 }}>
        Add a second feature, <code>renovation_year</code>: recorded for B (2010) and D (2015), missing (<strong>?</strong>) for A and C. Candidate threshold: 2012. Rows A and C have no value to compare against 2012 — XGBoost tries sending them BOTH directions and keeps whichever scores higher.
      </div>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <Panel title="Missing → Left" group1="A(?), C(?), B" group2="D" gain={gainMissingLeft} isWinner={leftWins} />
        <Panel title="Missing → Right" group1="B" group2="D, A(?), C(?)" gain={gainMissingRight} isWinner={!leftWins} />
      </div>
      {!revealed ? (
        <button onClick={() => setRevealed(true)} style={{ ...btnPrimary, marginTop: '0.7rem' }}>Compute both gains</button>
      ) : (
        <div style={{ fontSize: '0.76rem', color: cssVar('--ink-low', '#999'), marginTop: '0.6rem', lineHeight: 1.5, borderTop: `1px solid ${cssVar('--rim', '#333')}`, paddingTop: '0.5rem' }}>
          Missing → left scores {gainMissingLeft.toFixed(2)}, {(gainMissingLeft / gainMissingRight).toFixed(1)}× higher than missing → right's {gainMissingRight.toFixed(2)}. XGBoost stores "left" as this split's default direction — at prediction time, any future row missing <code>renovation_year</code> is routed left automatically, no imputation step required.
        </div>
      )}
    </div>
  );
}
