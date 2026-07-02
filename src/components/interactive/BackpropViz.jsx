import { useState, useMemo, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';

// Default weights — now live in state so the user can edit them.
const DEFAULT_W = {
  W1: [[0.5, -0.3], [0.2, 0.8]],
  b1: [0.1, -0.1],
  W2: [[0.7, -0.5]],
  b2: [0.0],
};

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
function relu(x) { return Math.max(0, x); }

function forwardPass(x1, x2, W) {
  const { W1, b1, W2, b2 } = W;
  const z1 = [
    W1[0][0] * x1 + W1[0][1] * x2 + b1[0],
    W1[1][0] * x1 + W1[1][1] * x2 + b1[1],
  ];
  const a1 = [relu(z1[0]), relu(z1[1])];
  const z2 = W2[0][0] * a1[0] + W2[0][1] * a1[1] + b2[0];
  const output = sigmoid(z2);
  return { z1, a1, z2, output };
}

function backwardPass(x1, x2, fwd, target, W) {
  const { W2 } = W;
  const { z1, a1, z2, output } = fwd;
  const dLoss_dout = 2 * (output - target);
  const dout_dz2 = sigmoid(z2) * (1 - sigmoid(z2));
  const dLoss_dz2 = dLoss_dout * dout_dz2;

  const dLoss_dW2 = [dLoss_dz2 * a1[0], dLoss_dz2 * a1[1]];
  const dLoss_da1 = [W2[0][0] * dLoss_dz2, W2[0][1] * dLoss_dz2];
  const dLoss_dz1 = [
    dLoss_da1[0] * (z1[0] > 0 ? 1 : 0),
    dLoss_da1[1] * (z1[1] > 0 ? 1 : 0),
  ];
  const dLoss_dW1 = [
    [dLoss_dz1[0] * x1, dLoss_dz1[0] * x2],
    [dLoss_dz1[1] * x1, dLoss_dz1[1] * x2],
  ];

  return { dLoss_dout, dout_dz2, dLoss_dz2, dLoss_dW2, dLoss_da1, dLoss_dz1, dLoss_dW1 };
}

function fmt(v) { return v.toFixed(4); }
function fmtShort(v) { return v.toFixed(3); }

function edgeThickness(val, maxVal) {
  const abs = Math.abs(val);
  const norm = maxVal > 0 ? abs / maxVal : 0;
  return 1 + norm * 4;
}

function edgeOpacity(val, maxVal) {
  const abs = Math.abs(val);
  const norm = maxVal > 0 ? abs / maxVal : 0;
  return 0.2 + norm * 0.8;
}

const NODE_R = 20;

export const BackpropViz = forwardRef(function BackpropViz(props, ref) {
  const [x1, setX1] = useState(1.0);
  const [x2, setX2] = useState(0.5);
  const [target, setTarget] = useState(1.0);
  const [mode, setMode] = useState('forward'); // 'forward' | 'backward'
  // Editable weights — deep-cloned from defaults so edits recompute both passes.
  const [W, setW] = useState(() => ({
    W1: DEFAULT_W.W1.map(r => [...r]),
    b1: [...DEFAULT_W.b1],
    W2: DEFAULT_W.W2.map(r => [...r]),
    b2: [...DEFAULT_W.b2],
  }));
  const { W1, b1, W2, b2 } = W;

  const setWeight = useCallback((path, val) => {
    setW(prev => {
      const next = {
        W1: prev.W1.map(r => [...r]), b1: [...prev.b1],
        W2: prev.W2.map(r => [...r]), b2: [...prev.b2],
      };
      path(next, val);
      return next;
    });
  }, []);

  const fwd = useMemo(() => forwardPass(x1, x2, W), [x1, x2, W]);
  const bwd = useMemo(() => backwardPass(x1, x2, fwd, target, W), [x1, x2, fwd, target, W]);
  const loss = (fwd.output - target) ** 2;

  // SVG layout
  const SVG_W = 420, SVG_H = 220;
  const layers = [
    [{ x: 70, y: 80, label: 'x₁' }, { x: 70, y: 160, label: 'x₂' }],
    [{ x: 210, y: 80, label: 'h₁' }, { x: 210, y: 160, label: 'h₂' }],
    [{ x: 350, y: 120, label: 'out' }],
  ];

  // Determine max weight/gradient for scaling
  const forwardWeights = [
    Math.abs(W1[0][0]), Math.abs(W1[0][1]),
    Math.abs(W1[1][0]), Math.abs(W1[1][1]),
    Math.abs(W2[0][0]), Math.abs(W2[0][1]),
  ];
  const maxFwdW = Math.max(...forwardWeights);

  const backwardGrads = [
    Math.abs(bwd.dLoss_dW1[0][0]), Math.abs(bwd.dLoss_dW1[0][1]),
    Math.abs(bwd.dLoss_dW1[1][0]), Math.abs(bwd.dLoss_dW1[1][1]),
    Math.abs(bwd.dLoss_dW2[0]), Math.abs(bwd.dLoss_dW2[1]),
  ];
  const maxBwdG = Math.max(...backwardGrads, 0.0001);

  // Edges: [from_layer, from_idx, to_layer, to_idx, weight_fwd, grad_bwd]
  const edges = [
    [0, 0, 1, 0, W1[0][0], bwd.dLoss_dW1[0][0]],
    [0, 1, 1, 0, W1[0][1], bwd.dLoss_dW1[0][1]],
    [0, 0, 1, 1, W1[1][0], bwd.dLoss_dW1[1][0]],
    [0, 1, 1, 1, W1[1][1], bwd.dLoss_dW1[1][1]],
    [1, 0, 2, 0, W2[0][0], bwd.dLoss_dW2[0]],
    [1, 1, 2, 0, W2[0][1], bwd.dLoss_dW2[1]],
  ];

  const primeColor = '#F0A500';

  const nodeLabel = (layerIdx, nodeIdx) => {
    if (mode === 'forward') {
      if (layerIdx === 0) return nodeIdx === 0 ? fmtShort(x1) : fmtShort(x2);
      if (layerIdx === 1) return nodeIdx === 0 ? fmtShort(fwd.a1[0]) : fmtShort(fwd.a1[1]);
      if (layerIdx === 2) return fmtShort(fwd.output);
    } else {
      if (layerIdx === 0) return '';
      if (layerIdx === 1) return nodeIdx === 0
        ? fmtShort(bwd.dLoss_dz1[0])
        : fmtShort(bwd.dLoss_dz1[1]);
      if (layerIdx === 2) return fmtShort(bwd.dLoss_dz2);
    }
    return '';
  };

  const edgeLabel = (edge) => {
    const [, , , , wFwd, gBwd] = edge;
    if (mode === 'forward') return fmtShort(wFwd);
    return fmtShort(gBwd);
  };

  const edgeColor = (edge) => {
    const [, , , , wFwd, gBwd] = edge;
    const val = mode === 'forward' ? wFwd : gBwd;
    const maxVal = mode === 'forward' ? maxFwdW : maxBwdG;
    const op = edgeOpacity(val, maxVal);
    if (val >= 0) return `rgba(240,165,0,${op})`;
    return `rgba(100,149,255,${op})`;
  };

  const edgeWidth = (edge) => {
    const [, , , , wFwd, gBwd] = edge;
    const val = mode === 'forward' ? wFwd : gBwd;
    const maxVal = mode === 'forward' ? maxFwdW : maxBwdG;
    return edgeThickness(val, maxVal);
  };

  useImperativeHandle(ref, () => ({
    play: () => {},
    pause: () => {},
    reset: () => {
      setMode('forward');
      setX1(1.0); setX2(0.5); setTarget(1.0);
      setW({
        W1: DEFAULT_W.W1.map(r => [...r]), b1: [...DEFAULT_W.b1],
        W2: DEFAULT_W.W2.map(r => [...r]), b2: [...DEFAULT_W.b2],
      });
    },
    step: () => setMode(m => m === 'forward' ? 'backward' : 'forward'),
  }), [])

  const sliderStyle = { width: '100%', accentColor: 'var(--prime)', cursor: 'pointer' };
  const inkMid = { color: 'var(--ink-mid)', fontSize: 13 };
  const monoVal = { fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--prime)', minWidth: 50, display: 'inline-block', textAlign: 'right' };

  const btnBase = {
    padding: '6px 18px', borderRadius: 6, border: '1px solid var(--rim)',
    cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
    transition: 'all 0.15s',
  };

  const tdStyle = { padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: 12 };
  const thStyle = { ...tdStyle, color: 'var(--ink-low)', fontWeight: 500, textAlign: 'left', borderBottom: '1px solid var(--rim)' };

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: 12, padding: 24, fontFamily: 'var(--font-sans)' }}>
      <h3 style={{ margin: '0 0 4px', color: 'var(--ink-hi)', fontSize: 18, fontWeight: 700 }}>Backpropagation Visualizer</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--ink-mid)', fontSize: 13 }}>
        2 inputs → 2 hidden (ReLU) → 1 output (sigmoid)
      </p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setMode('forward')}
          style={{ ...btnBase, background: mode === 'forward' ? primeColor : 'var(--depth)', color: mode === 'forward' ? '#000' : 'var(--ink-mid)', borderColor: mode === 'forward' ? primeColor : 'var(--rim)' }}
        >
          Forward Pass
        </button>
        <button
          onClick={() => setMode('backward')}
          style={{ ...btnBase, background: mode === 'backward' ? primeColor : 'var(--depth)', color: mode === 'backward' ? '#000' : 'var(--ink-mid)', borderColor: mode === 'backward' ? primeColor : 'var(--rim)' }}
        >
          Backward Pass
        </button>
      </div>

      {/* SVG Network */}
      <div style={{ border: '1px solid var(--rim)', borderRadius: 8, background: 'var(--depth)', padding: 8, marginBottom: 16 }}>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', display: 'block' }}>
          {/* Layer labels */}
          {['Input', 'Hidden (ReLU)', 'Output'].map((label, li) => (
            <text key={li} x={layers[li][0].x} y={18} textAnchor="middle"
              fill="var(--ink-low)" fontSize="11" fontFamily="var(--font-sans)">
              {label}
            </text>
          ))}

          {/* Edges */}
          {edges.map((edge, ei) => {
            const [fl, fi, tl, ti] = edge;
            const from = layers[fl][fi], to = layers[tl][ti];
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <g key={ei}>
                <line
                  x1={from.x + NODE_R} y1={from.y}
                  x2={to.x - NODE_R} y2={to.y}
                  stroke={edgeColor(edge)}
                  strokeWidth={edgeWidth(edge)}
                />
                <text x={midX} y={midY - 4} textAnchor="middle"
                  fill="var(--ink-mid)" fontSize="9" fontFamily="var(--font-mono)">
                  {edgeLabel(edge)}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {layers.map((layer, li) =>
            layer.map((node, ni) => {
              const isDeadRelu = li === 1 && mode === 'backward' && fwd.z1[ni] <= 0;
              return (
                <g key={`${li}-${ni}`}>
                  <circle cx={node.x} cy={node.y} r={NODE_R}
                    fill="var(--surface)" stroke={isDeadRelu ? '#555' : primeColor}
                    strokeWidth={isDeadRelu ? 1 : 2} />
                  {/* Node static label */}
                  <text x={node.x} y={node.y - 6} textAnchor="middle"
                    fill="var(--ink-low)" fontSize="9" fontFamily="var(--font-sans)">
                    {node.label}
                  </text>
                  {/* Value */}
                  <text x={node.x} y={node.y + 7} textAnchor="middle"
                    fill={isDeadRelu ? '#555' : 'var(--ink-hi)'} fontSize="10" fontFamily="var(--font-mono)">
                    {nodeLabel(li, ni)}
                  </text>
                  {isDeadRelu && (
                    <text x={node.x} y={node.y + 16} textAnchor="middle"
                      fill="#FF6B6B" fontSize="8" fontFamily="var(--font-sans)">
                      dead
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Loss label */}
          <text x={SVG_W - 10} y={120} textAnchor="end"
            fill="var(--ink-mid)" fontSize="11" fontFamily="var(--font-mono)">
            {`Loss: ${fmtShort(loss)}`}
          </text>
        </svg>
      </div>

      {/* Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'x₁', val: x1, set: setX1, min: -2, max: 2, step: 0.1 },
          { label: 'x₂', val: x2, set: setX2, min: -2, max: 2, step: 0.1 },
          { label: 'Target y', val: target, set: setTarget, min: 0, max: 1, step: 0.05 },
        ].map(({ label, val, set, min, max, step }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ ...inkMid, fontWeight: 600 }}>{label}</label>
              <span style={monoVal}>{val.toFixed(2)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={e => set(parseFloat(e.target.value))} style={sliderStyle} />
          </div>
        ))}
      </div>

      {/* Editable weights */}
      <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--prime)', fontWeight: 700, marginBottom: 10 }}>
          Weights (editable) — drag to change the network, both passes recompute
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px 16px' }}>
          {[
            { label: 'W1[0][0]', val: W1[0][0], set: v => setWeight((n, x) => { n.W1[0][0] = x }, v) },
            { label: 'W1[0][1]', val: W1[0][1], set: v => setWeight((n, x) => { n.W1[0][1] = x }, v) },
            { label: 'W1[1][0]', val: W1[1][0], set: v => setWeight((n, x) => { n.W1[1][0] = x }, v) },
            { label: 'W1[1][1]', val: W1[1][1], set: v => setWeight((n, x) => { n.W1[1][1] = x }, v) },
            { label: 'b1[0]',    val: b1[0],    set: v => setWeight((n, x) => { n.b1[0] = x }, v) },
            { label: 'b1[1]',    val: b1[1],    set: v => setWeight((n, x) => { n.b1[1] = x }, v) },
            { label: 'W2[0]',    val: W2[0][0], set: v => setWeight((n, x) => { n.W2[0][0] = x }, v) },
            { label: 'W2[1]',    val: W2[0][1], set: v => setWeight((n, x) => { n.W2[0][1] = x }, v) },
            { label: 'b2',       val: b2[0],    set: v => setWeight((n, x) => { n.b2[0] = x }, v) },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)' }}>{label}</label>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--prime)' }}>{val.toFixed(2)}</span>
              </div>
              <input type="range" min={-2} max={2} step={0.05} value={val}
                onChange={e => set(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--prime)', cursor: 'pointer' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Data table */}
      <div style={{ overflowX: 'auto' }}>
        {mode === 'forward' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['x₁', 'x₂', 'z₁[0]', 'z₁[1]', 'a₁[0]', 'a₁[1]', 'z₂', 'output', 'Loss'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {[x1, x2, fwd.z1[0], fwd.z1[1], fwd.a1[0], fwd.a1[1], fwd.z2, fwd.output, loss].map((v, i) => (
                  <td key={i} style={{ ...tdStyle, color: 'var(--ink-hi)' }}>{fmt(v)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['∂L/∂z₂', '∂L/∂a₁[0]', '∂L/∂a₁[1]', '∂L/∂z₁[0]', '∂L/∂z₁[1]'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {[bwd.dLoss_dz2, bwd.dLoss_da1[0], bwd.dLoss_da1[1], bwd.dLoss_dz1[0], bwd.dLoss_dz1[1]].map((v, i) => (
                  <td key={i} style={{ ...tdStyle, color: Math.abs(v) < 0.0001 ? '#FF6B6B' : 'var(--ink-hi)' }}>
                    {fmt(v)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-low)', lineHeight: 1.6, borderTop: '1px solid var(--rim)', paddingTop: 12 }}>
        Backprop applies the chain rule layer by layer. Each gradient = local derivative &times; upstream gradient. Dead ReLU neurons (z &lt; 0) stop gradient flow — gradient is 0.
      </p>

      {/* Gradient shrinkage panel — shown in backward mode */}
      {mode === 'backward' && (
        <div style={{
          marginTop: 12, background: 'var(--depth)', border: '1px solid var(--rim)',
          borderRadius: 8, padding: '12px 14px',
        }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--prime)', fontWeight: 700, marginBottom: 8 }}>
            Gradient magnitude per layer (vanishing gradient check)
          </div>
          {(() => {
            const layers = [
              { name: 'Output layer', grad: Math.abs(bwd.dLoss_dz2), note: `σ'(z₂) = ${(sigmoid(fwd.z2) * (1 - sigmoid(fwd.z2))).toFixed(3)} ≤ 0.25` },
              { name: 'Hidden h₁ (ReLU)', grad: Math.abs(bwd.dLoss_dz1[0]), note: fwd.z1[0] > 0 ? "ReLU active → gradient passes through" : "ReLU dead → gradient = 0" },
              { name: 'Hidden h₂ (ReLU)', grad: Math.abs(bwd.dLoss_dz1[1]), note: fwd.z1[1] > 0 ? "ReLU active → gradient passes through" : "ReLU dead → gradient = 0" },
            ];
            const maxG = Math.max(...layers.map(l => l.grad), 0.0001);
            return layers.map((l, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                  <span>{l.name}</span>
                  <span style={{ color: l.grad < 0.001 ? '#ef4444' : 'var(--prime)' }}>|∂L/∂z| = {l.grad.toFixed(4)}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--rim)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${Math.max(2, (l.grad / maxG) * 100)}%`,
                    background: l.grad < 0.001 ? '#ef4444' : 'var(--prime)',
                    transition: 'width 0.2s',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{l.note}</div>
              </div>
            ));
          })()}
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-low)', lineHeight: 1.6, borderTop: '1px solid var(--rim)', paddingTop: 8 }}>
            Sigmoid derivative σ'(z) ≤ 0.25 always. With 10 sigmoid layers: (0.25)¹⁰ ≈ 10⁻⁶ — vanished. ReLU derivative is either 0 (dead) or 1 (full pass-through), so gradients don't shrink per layer. This is why deep nets use ReLU.
          </div>
        </div>
      )}
    </div>
  );
})
