import { useState, useEffect } from 'react'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'

// ── Shared accordion MCQ ──────────────────────────────────────────────────────
function AccordionMCQ({ scenarios, accentColor = 'var(--violet)', contextLabel = 'Context', storageKey = null }) {
  const [items, setItems] = useState(() => {
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem('msl_score:' + storageKey))
        if (saved && saved.length === scenarios.length) return saved
      } catch {}
    }
    return scenarios.map(() => ({ open: false, picked: null, revealed: false }))
  })
  const [diffFilter, setDiffFilter] = useState('all')

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem('msl_score:' + storageKey, JSON.stringify(items))
      window.dispatchEvent(new CustomEvent('msl_score_updated'))
    }
  }, [items, storageKey])

  function getDiff(i, total) {
    const t = total / 3
    return i < t ? 'easy' : i < 2 * t ? 'medium' : 'hard'
  }

  const score = items.reduce((acc, item, i) => ({
    attempted: acc.attempted + (item.revealed ? 1 : 0),
    correct:   acc.correct   + (item.revealed && item.picked === scenarios[i].answer ? 1 : 0),
  }), { attempted: 0, correct: 0 })

  function toggle(i) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, open: !it.open } : it))
  }

  function pick(i, optIdx) {
    if (items[i].revealed) return
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, picked: optIdx, revealed: true, open: true } : it))
  }

  useEffect(() => {
    function handleKey(e) {
      const n = parseInt(e.key)
      if (n >= 1 && n <= 4) {
        const openIdx = items.findIndex(it => it.open && !it.revealed)
        if (openIdx !== -1 && n - 1 < scenarios[openIdx].options.length) pick(openIdx, n - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [items])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Difficulty filter */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        {['all','easy','medium','hard'].map(d => (
          <button key={d} onClick={() => setDiffFilter(d)} style={{
            fontSize: '10px', padding: '3px 10px', borderRadius: '999px',
            background: diffFilter === d ? accentColor + '15' : 'transparent',
            border: `1px solid ${diffFilter === d ? accentColor : 'var(--rim)'}`,
            color: diffFilter === d ? accentColor : 'var(--ink-ghost)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {d === 'all' ? 'All' : d === 'easy' ? 'Easy' : d === 'medium' ? 'Med' : 'Hard'}
          </button>
        ))}
        <span style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginLeft: '4px' }}>
          {diffFilter === 'all' ? scenarios.length : scenarios.filter((_,i) => getDiff(i, scenarios.length) === diffFilter).length} scenarios
        </span>
      </div>
      {score.attempted > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: '8px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>Score:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: score.correct / score.attempted >= 0.7 ? 'var(--mint)' : 'var(--gold)' }}>
            {score.correct}/{score.attempted}
          </span>
          <div style={{ flex: 1, height: '4px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${(score.correct / Math.max(scenarios.length, 1)) * 100}%`, background: 'var(--mint)', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)' }}>{scenarios.length - score.attempted} left</span>
        </div>
      )}

      {scenarios.map((sc, i) => { if (diffFilter !== 'all' && getDiff(i, scenarios.length) !== diffFilter) return null;
        const item = items[i]
        const isCorrect = item.revealed && item.picked === sc.answer
        const isWrong   = item.revealed && item.picked !== sc.answer
        let borderColor = item.open ? accentColor : 'var(--rim)'
        if (isCorrect) borderColor = 'rgba(52,211,153,0.5)'
        if (isWrong)   borderColor = 'rgba(244,63,94,0.5)'

        return (
          <div key={sc.id} style={{ border: `1px solid ${borderColor}`, borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s', background: 'rgba(255,255,255,0.015)' }}>
            <button onClick={() => toggle(i)} style={{ width: '100%', padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '16px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.4 }}>{sc.title}</span>
              {sc.tier && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', background: 'rgba(255,255,255,0.11)', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{sc.tier}</span>}
              {isCorrect && <span style={{ color: 'var(--mint)', fontSize: '13px', flexShrink: 0 }}>✓</span>}
              {isWrong   && <span style={{ color: 'var(--rose)', fontSize: '13px', flexShrink: 0 }}>✗</span>}
              <span style={{ color: 'var(--ink-ghost)', fontSize: '11px', flexShrink: 0 }}>{item.open ? '▲' : '▼'}</span>
            </button>

            {item.open && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: accentColor, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>{contextLabel}</div>
                  {Array.isArray(sc.context) ? sc.context.map((line, j) => (
                    <div key={j} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', padding: '3px 0', lineHeight: 1.5 }}>{line}</div>
                  )) : <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.context}</p>}
                </div>

                <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, fontStyle: 'italic' }}>{sc.question}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sc.options.map((opt, j) => {
                    let bg = 'transparent', border = 'var(--rim)', color = 'var(--ink-mid)'
                    if (item.revealed) {
                      if (j === sc.answer)                            { bg = 'rgba(52,211,153,0.15)';  border = 'var(--mint)'; color = 'var(--mint)' }
                      else if (j === item.picked)                     { bg = 'rgba(244,63,94,0.15)';   border = 'var(--rose)'; color = 'var(--rose)' }
                    } else if (j === item.picked) {
                      bg = 'rgba(240,165,0,0.15)'; border = 'var(--prime)'; color = 'var(--prime)'
                    }
                    return (
                      <button key={j} onClick={() => pick(i, j)} disabled={item.revealed}
                        style={{ padding: '10px 14px', borderRadius: '7px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: item.revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.6, minWidth: '14px' }}>{String.fromCharCode(65 + j)}</span>
                        {item.revealed && j === sc.answer                      && <span>✓ </span>}
                        {item.revealed && j === item.picked && j !== sc.answer && <span>✗ </span>}
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {item.revealed && (
                  <div style={{ padding: '14px 16px', background: isCorrect ? 'rgba(52,211,153,0.11)' : 'rgba(244,63,94,0.11)', border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(244,63,94,0.2)'}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>
                      {isCorrect ? '✓ Correct' : '✗ Wrong'} — {sc.diagnosis}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{sc.explanation}</p>
                    {sc.fix && (
                      <div style={{ padding: '10px 12px', background: 'rgba(240,165,0,0.13)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', fontWeight: 600 }}>Production Fix</div>
                        <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.fix}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Training Failure Diagnosis ────────────────────────────────────────────────
const FAILURES = [
  { id: 'exploding', title: 'Loss spikes to NaN after epoch 3', symptoms: ['Training loss: 0.42 → 0.39 → 0.41 → NaN', 'Gradient norm: 0.8 → 1.2 → 47.3 → ∞', 'LR: 3e-4, batch 64, no gradient clipping'], options: ['Vanishing gradients', 'Exploding gradients', 'Label noise', 'Data loader bug'], answer: 1, diagnosis: 'Exploding gradients', explanation: 'Gradient norm jumped 40x before NaN — classic explosion. The loss going NaN is the terminal symptom, not the cause. Vanishing gradients produce the opposite: loss stalls, gradients approach zero.', fix: 'Add gradient clipping (`clip_grad_norm_(params, max_norm=1.0)`) before the optimizer step. Also audit your LR — 3e-4 is aggressive for transformers. Consider warmup + cosine schedule.', tier: 'Senior' },
  { id: 'overfit_early', title: 'Train loss 0.08, val loss 2.4 at epoch 5', symptoms: ['Train/val loss diverge from epoch 2', 'Dataset: 12k samples, model: 45M params', 'No dropout, no weight decay, full fine-tune'], options: ['Wrong loss function', 'Overfitting', 'Distribution shift between train/val', 'Batch norm statistics mismatch'], answer: 1, diagnosis: 'Overfitting', explanation: 'A 45M param model on 12k samples with no regularisation will memorise the training set. The 30x train/val loss gap is the signature. Distribution shift would show from epoch 1, not diverge progressively.', fix: 'Freeze the first N layers (fine-tune only the head + last 2 blocks). Add dropout (0.1–0.3). Use weight decay (1e-2). Consider label smoothing. If still diverging, reduce model size or use LoRA.', tier: 'Analyst' },
  { id: 'lr_too_high', title: 'Loss oscillates, never converges', symptoms: ['Loss: 1.8 → 0.9 → 1.7 → 0.8 → 1.6 ...', 'Gradient norm stable ~0.5', 'LR: 0.1, SGD+momentum, no scheduler'], options: ['Exploding gradients', 'Learning rate too high', 'Dead ReLUs', 'Incorrect normalisation'], answer: 1, diagnosis: 'Learning rate too high', explanation: 'Stable gradient norms + oscillating loss = LR overshoot. The loss keeps crossing the minimum without settling. Gradient explosion would show in the norm. Dead ReLUs cause stagnation, not oscillation.', fix: 'Drop LR by 10x. Use a cyclical or cosine scheduler. For SGD, typical good ranges are 1e-2 to 1e-3 with momentum 0.9. Switch to Adam if you want less LR sensitivity.', tier: 'Junior' },
  { id: 'vanishing', title: 'Loss stagnates from epoch 1, gradients near zero', symptoms: ['Loss: 1.38 → 1.37 → 1.37 → 1.37', 'Gradient norm: 0.001 → 0.0003 → 0.00008', '20-layer MLP, sigmoid activations, Xavier init'], options: ['Vanishing gradients', 'Exploding gradients', 'Dead ReLUs', 'Wrong learning rate'], answer: 0, diagnosis: 'Vanishing gradients', explanation: 'Sigmoid saturates at extremes, squashing gradients to near zero through 20 layers of backprop. The loss stuck near random confirms nothing is being learned.', fix: 'Replace sigmoid with ReLU/GELU/SiLU. Use BatchNorm or LayerNorm between layers. For very deep nets, add residual connections. Consider He init instead of Xavier for ReLU activations.', tier: 'Senior' },
  { id: 'dead_relu', title: '40% of neurons output exactly 0.0 after epoch 2', symptoms: ['Training loss: slowly decreasing but slower than expected', 'Activations histogram: spike at exactly 0 growing each epoch', 'LR: 0.01, ReLU everywhere, negative bias init'], options: ['Vanishing gradients', 'Exploding gradients', 'Dead ReLUs', 'Batch size too small'], answer: 2, diagnosis: 'Dead ReLUs', explanation: 'Negative bias init + high LR can push pre-activations permanently below zero. ReLU sets those to 0 and their gradients to 0 permanently — they never recover. The growing spike at 0 in the activation histogram is the tell.', fix: 'Use Leaky ReLU (negative_slope=0.01) or ELU to allow small negative gradients. Initialise biases to zero or small positive. Reduce LR. Or switch to GELU which is smooth everywhere.', tier: 'Senior' },
  { id: 'batchnorm_eval', title: 'Model accurate in training, random in production', symptoms: ['Train accuracy: 94%, val accuracy: 93%', 'Production accuracy: 11% (random for 9-class)', 'Inference runs single samples one by one via REST API'], options: ['Distribution shift', 'BatchNorm in train mode during inference', 'Model not saved correctly', 'Wrong preprocessing'], answer: 1, diagnosis: 'BatchNorm running in train mode during inference', explanation: 'BatchNorm in train mode computes stats over the current batch. With batch_size=1, the mean and variance are computed over a single sample — essentially random normalisation.', fix: 'Call model.eval() before inference — this switches BatchNorm to use running statistics accumulated during training. Never forget: train() for training loops, eval() for inference.', tier: 'Staff' },
  { id: 'data_leak', title: 'Val loss better than train loss throughout training', symptoms: ['Val loss consistently 10–15% lower than train loss', 'Val accuracy: 99.2%, train accuracy: 87.4%', 'Data preprocessed before train/val split'], options: ['Very strong regularisation', 'Data leakage from val into train', 'Smaller val set has easier samples', 'Dropout only applied at test time'], answer: 1, diagnosis: 'Data leakage — preprocessing before split', explanation: 'When preprocessing is computed on the full dataset before splitting, val data statistics contaminate train statistics. Val loss below train loss is the red flag.', fix: 'Always split first, preprocess second. Fit scalers/encoders only on train set, then transform val/test with those fitted parameters.', tier: 'Staff' },
  { id: 'wrong_loss', title: 'Model predicts only the most common class', symptoms: ['Dataset: 95% class A, 5% class B', 'Training loss steadily decreasing', 'Model outputs class A for every input', 'Using CrossEntropyLoss, no class weights'], options: ['Vanishing gradients', 'Learning rate too low', 'Class imbalance — model collapsed to majority class', 'Wrong activation in output layer'], answer: 2, diagnosis: 'Class collapse due to imbalance', explanation: 'With 95/5 imbalance, predicting class A always gives 95% accuracy and low cross-entropy. The model found the shortcut.', fix: 'Use weighted cross-entropy (weight minority class by 1/frequency). Or use focal loss. Oversample the minority class. Always check per-class metrics, not just accuracy.', tier: 'Analyst' },
]

const TIER_COLORS = { Junior: 'var(--sky)', Analyst: 'var(--mint)', Senior: 'var(--prime)', Staff: 'var(--violet)' }

function TrainingFailureDiagnosis() {
  const [idx, setIdx]           = useState(0)
  const [picked, setPicked]     = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore]       = useState({ correct: 0, total: 0 })

  const scenario = FAILURES[idx]

  function choose(i) {
    if (revealed) return
    setPicked(i); setRevealed(true)
    setScore(s => ({ correct: s.correct + (i === scenario.answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % FAILURES.length)
    setPicked(null); setRevealed(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--violet)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Training Failure Diagnosis</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>Read the training telemetry. Diagnose before you scroll.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {FAILURES.length}</span>
          {score.total > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(52,211,153,0.10)', color: 'var(--mint)' }}>{score.correct}/{score.total} correct</span>}
        </div>
      </div>

      <div className="card" style={{ padding: '22px', borderLeft: `3px solid var(--rose)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)' }}>{scenario.title}</span>
          <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: TIER_COLORS[scenario.tier] + '18', color: TIER_COLORS[scenario.tier], fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{scenario.tier}</span>
        </div>
        {scenario.symptoms.map((s, i) => <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', padding: '4px 10px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', marginBottom: '4px' }}>{s}</div>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {scenario.options.map((opt, i) => {
          let bg = 'var(--surface)', border = 'var(--rim)', color = 'var(--ink-mid)'
          if (revealed) {
            if (i === scenario.answer)             { bg = 'rgba(52,211,153,0.15)'; border = 'var(--mint)'; color = 'var(--mint)' }
            else if (i === picked)                 { bg = 'rgba(244,63,94,0.15)';  border = 'var(--rose)'; color = 'var(--rose)' }
          } else if (i === picked) { bg = 'rgba(240,165,0,0.15)'; border = 'var(--prime)'; color = 'var(--prime)' }
          return (
            <button key={i} onClick={() => choose(i)} disabled={revealed}
              style={{ padding: '12px 14px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {revealed && i === scenario.answer && '✓ '}
              {revealed && i === picked && i !== scenario.answer && '✗ '}
              {opt}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="card animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: picked === scenario.answer ? 'var(--mint)' : 'var(--rose)' }}>
            {picked === scenario.answer ? '✓ Correct — ' : '✗ Wrong — '}{scenario.diagnosis}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.explanation}</p>
          <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.13)', border: '1px solid rgba(240,165,0,0.20)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Production Fix</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.fix}</p>
          </div>
          <button className="btn-primary" onClick={next} style={{ alignSelf: 'flex-start' }}>Next scenario →</button>
        </div>
      )}
    </div>
  )
}

// ── Gradient Debugger ─────────────────────────────────────────────────────────
const GRAD_SCENARIOS = [
  { id: 'vanishing_sigmoid', title: 'Layers 1–6 gradient norms all < 1e-6, layers 7–12 normal', symptoms: ['Layer 12 grad_norm: 0.42', 'Layer 8  grad_norm: 0.31', 'Layer 6  grad_norm: 0.000003', 'Layer 1  grad_norm: 0.0000001', 'Activation: Sigmoid, 12-layer network'], options: ['Exploding gradients in early layers', 'Vanishing gradients (sigmoid saturation)', 'Gradient checkpoint bug', 'Wrong loss function'], answer: 1, diagnosis: 'Vanishing gradients (sigmoid saturation)', explanation: 'Sigmoid saturates at extremes, derivative max 0.25. Through 12 layers, 0.25^12 ≈ 6e-8. The sharp cutoff at layer 6 shows where saturation becomes total.', fix: 'Replace sigmoid with GELU/SiLU. Add LayerNorm between blocks. Consider residual connections to provide gradient highways.' },
  { id: 'unfrozen_embedding', title: 'All layers normal except embedding layer is frozen but updating', symptoms: ['Embedding layer requires_grad: True', 'Embedding grad_norm: 847.3', 'Loss: decreasing normally', 'Training: fine-tune, frozen backbone expected'], options: ['Expected behavior', 'Accidentally unfroze embedding layer', 'Learning rate too high for embeddings', 'Weight decay conflict'], answer: 1, diagnosis: 'Accidentally unfroze embedding layer', explanation: "Embedding grad_norm of 847 while backbone is 'frozen' means the freeze didn't apply to embeddings. Common when freeze loop uses `model.encoder.parameters()` but embeddings are at `model.embeddings`.", fix: '`for name, param in model.named_parameters(): param.requires_grad = \'head\' in name` — always verify with `[n for n,p in model.named_parameters() if p.requires_grad]`.' },
  { id: 'nan_forward', title: 'Loss NaN after gradient clipping — norms were fine', symptoms: ['grad_norm before clip: 0.87 (normal)', 'After clip: grad_norm still 0.87', 'Loss step 312: 0.43 → NaN', 'Learning rate: 3e-3'], options: ['Exploding gradients (clipping missed it)', 'NaN in forward pass (not gradients)', 'Batch norm instability', 'Wrong gradient clipping API'], answer: 1, diagnosis: 'NaN in forward pass (not gradients)', explanation: "If gradient norms are normal but loss is NaN, the NaN originates in the forward pass — e.g., log(0), division by zero, softmax overflow. Gradient clipping can't fix what was already NaN in the output.", fix: 'Add `torch.autograd.set_detect_anomaly(True)` temporarily. Check for log(x+1e-8) guards, safe_softmax, and input normalization.' },
  { id: 'periodic_spikes', title: 'Gradient norms spike every 100 steps periodically', symptoms: ['Step 100: grad_norm 14.2', 'Step 200: grad_norm 11.8', 'Step 300: grad_norm 15.1', 'Steps 1-99: grad_norm ~0.5', 'Dataset: shuffled but seeded'], options: ['Periodic data corruption (bad batch every N steps)', 'Cyclical LR causing periodic instability', 'Gradient accumulation misconfiguration', 'Model architecture resonance'], answer: 0, diagnosis: 'Periodic data corruption (bad batch every N steps)', explanation: 'Perfectly periodic spikes at fixed step intervals with a seeded dataset = same corrupted samples being loaded. The seeded shuffle means every epoch hits the same bad rows at the same position.', fix: 'Check dataset for NaN/inf rows. Add input validation in `__getitem__`. Use different seed per epoch.' },
  { id: 'frozen_layernorm', title: 'Layer norms in transformer show all-zero gradients after step 500', symptoms: ['layernorm.weight grad: tensor([0., 0., 0., ...]', 'layernorm.bias  grad: tensor([0., 0., 0., ...]', 'Attention layers: normal grads', 'Training: continued from checkpoint'], options: ['LayerNorm frozen in checkpoint', 'Learning rate decayed to zero', 'Gradient checkpoint interaction', 'LayerNorm already converged (expected)'], answer: 0, diagnosis: 'LayerNorm frozen in checkpoint', explanation: 'When loading from checkpoint with `strict=False` or selective loading, norm layers can accidentally have `requires_grad=False` retained from a differently-trained checkpoint.', fix: 'After `load_state_dict`, verify: `assert all(p.requires_grad for n,p in model.named_parameters() if \'norm\' in n)`. Re-enable with `model.layernorm.weight.requires_grad_(True)`.' },
  { id: 'numpy_break', title: 'Gradient flow stops at a custom layer — no grad_fn', symptoms: ['Custom layer output: tensor([...], grad_fn=None)', 'All layers after: zero gradients', 'Custom op: uses numpy internally'], options: ['Missing backward pass implementation', 'Numpy breaks autograd graph', 'Wrong loss reduction', 'Detached tensor passed as input'], answer: 1, diagnosis: 'Numpy breaks autograd graph', explanation: 'Numpy operations break the PyTorch autograd graph. `tensor.numpy()` detaches from computation graph. Any custom layer that converts to numpy and back silently kills gradient flow.', fix: 'Replace all numpy operations with PyTorch equivalents. If numpy is required, implement a custom `torch.autograd.Function` with explicit `forward` and `backward`.' },
  { id: 'shared_embedding_grad', title: 'Shared embedding gradients accumulate unexpectedly across tasks', symptoms: ['Embedding grad accumulation: 3x expected magnitude', 'Training: multi-task, 3 tasks sharing embedding layer', 'optimizer.zero_grad() called once per global step'], options: ['Gradient accumulation bug', 'Correct behavior — shared layers receive summed gradients', 'Weight decay amplifying shared layer updates', 'Missing gradient clipping'], answer: 1, diagnosis: 'Correct behavior — shared layers receive summed gradients', explanation: 'Shared layers receive gradients from ALL tasks that use them, summed. A 3-task setup naturally produces 3x gradient magnitude. This is mathematically correct, not a bug — but you probably want per-task gradient normalization.', fix: 'Scale each task loss by `1/n_tasks` before summing, or use gradient surgery (project conflicting gradients).' },
  { id: 'amp_underflow', title: 'Gradients collapse to zero after mixed precision training enabled', symptoms: ['Before AMP: grad_norm ~0.5 (normal)', 'After AMP: grad_norm 0.0 (all steps)', 'Using torch.cuda.amp.autocast()', 'GradScaler not used'], options: ['FP16 underflow — gradients too small to represent', 'GradScaler required with AMP', 'Wrong dtype in loss computation', 'Autocast scope too narrow'], answer: 0, diagnosis: 'FP16 underflow — GradScaler missing', explanation: 'FP16 minimum positive value is ~6e-8. Small gradients underflow to exactly 0 in FP16. GradScaler multiplies loss before backward (scaling gradients up into FP16 representable range), then unscales before optimizer step.', fix: '`scaler = torch.cuda.amp.GradScaler()` → `scaler.scale(loss).backward()` → `scaler.step(optimizer)` → `scaler.update()`. Always use GradScaler with AMP training.' },
]

function GradientDebugger() {
  const [idx, setIdx]           = useState(0)
  const [picked, setPicked]     = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore]       = useState({ correct: 0, total: 0 })

  const scenario = GRAD_SCENARIOS[idx]

  function choose(i) {
    if (revealed) return
    setPicked(i); setRevealed(true)
    setScore(s => ({ correct: s.correct + (i === scenario.answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % GRAD_SCENARIOS.length)
    setPicked(null); setRevealed(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--violet)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Backprop Debugging</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>Read the gradient telemetry. Diagnose the gradient flow problem before you reveal.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {GRAD_SCENARIOS.length}</span>
          {score.total > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(52,211,153,0.10)', color: 'var(--mint)' }}>{score.correct}/{score.total} correct</span>}
        </div>
      </div>

      <div className="card" style={{ padding: '22px', borderLeft: `3px solid var(--sky)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)' }}>{scenario.title}</span>
        </div>
        {scenario.symptoms.map((s, i) => <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', padding: '4px 10px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', marginBottom: '4px' }}>{s}</div>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {scenario.options.map((opt, i) => {
          let bg = 'var(--surface)', border = 'var(--rim)', color = 'var(--ink-mid)'
          if (revealed) {
            if (i === scenario.answer)         { bg = 'rgba(52,211,153,0.15)'; border = 'var(--mint)'; color = 'var(--mint)' }
            else if (i === picked)             { bg = 'rgba(244,63,94,0.15)';  border = 'var(--rose)'; color = 'var(--rose)' }
          } else if (i === picked) { bg = 'rgba(240,165,0,0.15)'; border = 'var(--prime)'; color = 'var(--prime)' }
          return (
            <button key={i} onClick={() => choose(i)} disabled={revealed}
              style={{ padding: '12px 14px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {revealed && i === scenario.answer && '✓ '}
              {revealed && i === picked && i !== scenario.answer && '✗ '}
              {opt}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="card animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 700, color: picked === scenario.answer ? 'var(--mint)' : 'var(--rose)' }}>
            {picked === scenario.answer ? '✓ Correct — ' : '✗ Wrong — '}{scenario.diagnosis}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.explanation}</p>
          <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.13)', border: '1px solid rgba(240,165,0,0.20)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Production Fix</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.fix}</p>
          </div>
          <button className="btn-primary" onClick={next} style={{ alignSelf: 'flex-start' }}>Next scenario →</button>
        </div>
      )}
    </div>
  )
}

// ── Optimizer Comparison ──────────────────────────────────────────────────────
const OPTIMIZER_SCENARIOS = [
  {
    id: 'sparse_embeddings',
    title: 'NLP model: 90% of embedding rows have zero gradient each step',
    tier: 'Senior',
    context: [
      'Task: text classification, 50k-token vocabulary',
      'Batch size: 32 — most vocab tokens not seen each batch',
      'Embedding layer: 50k × 256 parameters',
      'Optimizer candidates: SGD+momentum, Adam',
    ],
    question: 'Which optimizer handles sparse gradients better and why?',
    options: ['SGD+momentum — simpler and more stable', 'Adam — per-parameter adaptive learning rates handle sparse gradients', 'RMSprop — better than Adam for NLP', 'Both perform identically — sparsity doesn\'t matter'],
    answer: 1,
    diagnosis: 'Adam — per-parameter learning rates adapt to gradient frequency',
    explanation: 'Adam maintains per-parameter moment estimates. For embedding rows that rarely receive gradients, Adam\'s second moment (v_t) stays small, keeping the effective learning rate high for those rows. SGD+momentum applies uniform LR to all parameters — rarely-updated embeddings converge slowly. This is why Adam dominates NLP.',
    fix: 'For sparse gradient problems (embeddings, wide-and-sparse models), use Adam or AdamW. If you need SGD for generalization benefits, use `SparseAdam` which applies updates only to active embedding rows. For pure fine-tuning, AdamW (Adam + proper weight decay decoupling) is the default choice.',
  },
  {
    id: 'large_batch_sgd',
    title: 'Batch size scaled from 256 to 8192 — training unstable with Adam',
    tier: 'Staff',
    context: [
      'Training: ResNet-50 on ImageNet',
      'Hardware: 32 GPUs, BS=8192 for efficiency',
      'Current optimizer: Adam — training diverging',
      'Linear scaling rule: LR × (8192/256) = 32x',
    ],
    question: 'Why does SGD+momentum outperform Adam at very large batch sizes?',
    options: ['SGD is faster to compute than Adam', 'Adam\'s adaptive rates conflict with linear LR scaling; SGD+warmup follows linear scaling cleanly', 'Adam requires more memory at large batch sizes', 'They perform identically — the instability is from LR, not optimizer choice'],
    answer: 1,
    diagnosis: 'Adam\'s adaptive rates disrupt large-batch linear scaling',
    explanation: "The linear scaling rule (LR ∝ batch size) is derived for SGD. Adam's per-parameter adaptive rates already internally scale gradients, making the effective learning rate hard to reason about at scale. Facebook's ResNet training paper (1-hour ImageNet) used SGD+momentum with warmup specifically because it follows the linear scaling rule predictably.",
    fix: 'For large-batch distributed training: use SGD+momentum with linear LR scaling + 5-epoch warmup. Apply learning rate finder to tune base LR. Or use LARS (Layer-wise Adaptive Rate Scaling) which adapts per-layer rather than per-parameter and works well at BS>4096.',
  },
  {
    id: 'bert_finetune',
    title: 'Fine-tuning BERT with SGD — loss not decreasing after epoch 1',
    tier: 'Senior',
    context: [
      'Task: BERT-base fine-tune on 10k sentence classification examples',
      'Optimizer: SGD, LR=0.01, momentum=0.9',
      'Loss: 1.38 at epoch 0, 1.37 at epoch 1, 1.37 at epoch 2',
      'No scheduler, no warmup',
    ],
    question: 'Why is fine-tuning BERT with SGD failing?',
    options: ['SGD is fine — increase LR to 0.1', 'SGD requires too high LR for transformer fine-tuning; use AdamW with warmup', 'BERT requires special optimizer with second-order terms', 'Add weight decay to SGD to fix convergence'],
    answer: 1,
    diagnosis: 'SGD fails for transformer fine-tuning — AdamW + warmup is required',
    explanation: "Transformers have heterogeneous gradient magnitudes across layers (early layers ~0.001, later layers ~0.1). SGD with a single LR either overshoots deep layers or starves early layers. Adam's per-parameter adaptation handles this. Original BERT paper specified AdamW, LR=2e-5, warmup 10% of steps — this is not arbitrary.",
    fix: 'Use AdamW, LR between 1e-5 and 5e-5, linear warmup for first 6–10% of training steps, then linear decay to 0. Do not use SGD for transformer fine-tuning. For LoRA fine-tuning specifically, LR can be slightly higher (1e-4 to 3e-4).',
  },
  {
    id: 'rnn_rmsprop',
    title: 'LSTM training: Adam causing loss oscillation, noisy gradient norms',
    tier: 'Senior',
    context: [
      'Model: 2-layer LSTM, sequence length 128',
      'Adam: loss oscillates ±0.15 per step even with clipping',
      'Gradient norms: high variance (0.2–4.5)',
      'RMSprop was used in original Graves 2013 LSTM paper',
    ],
    question: 'Why might RMSprop outperform Adam for RNNs?',
    options: ['RMSprop is always better than Adam', 'RMSprop\'s decay-only second moment is more stable for highly non-stationary RNN gradients', 'Adam\'s momentum causes gradient buildup in RNNs', 'No meaningful difference — tune LR instead'],
    answer: 1,
    diagnosis: 'RMSprop handles non-stationary gradients better than Adam for RNNs',
    explanation: "Adam maintains both first moment (momentum) and second moment (adaptive rate). For RNNs, gradient magnitude varies dramatically across sequence steps — momentum can amplify instability. RMSprop uses only the second moment (exponential moving average of squared gradients) without momentum accumulation, which is more stable for highly non-stationary sequences. This is why Graves chose it.",
    fix: 'Try RMSprop with LR=1e-3 to 1e-4, rho=0.9. Keep gradient clipping (max_norm=1.0 or 5.0 for LSTMs). If Adam is preferred, reduce beta1 from 0.9 to 0.5 to reduce momentum for RNN stability. Always use gradient clipping with RNNs regardless of optimizer.',
  },
  {
    id: 'adam_generalization',
    title: 'Adam-trained model has wider train-val gap than SGD-trained model',
    tier: 'Staff',
    context: [
      'Image classification, CIFAR-10',
      'Adam: train acc 99.2%, val acc 91.3%',
      'SGD+momentum: train acc 97.8%, val acc 94.1%',
      'Same architecture, same regularization, same number of epochs',
    ],
    question: 'Why does SGD generalize better than Adam in this case?',
    options: ['Adam is incorrectly implemented — should perform identically', 'Adam converges to sharper minima; SGD\'s noise biases toward flatter (better-generalizing) minima', 'SGD uses more computation per step', 'Weight decay is insufficient — increase for Adam'],
    answer: 1,
    diagnosis: 'SGD finds flatter minima — Adam converges to sharper, less generalizable solutions',
    explanation: 'This is a known empirical finding (Wilson et al. 2017, "The Marginal Value of Momentum for Small Learning Rate SGD"). SGD with large LR + high momentum acts as implicit regularization, navigating toward wide, flat minima. Adam\'s adaptive rates efficiently converge to sharp minima that have lower training loss but higher generalization error. Not a bug — a fundamental tradeoff.',
    fix: 'For generalization-critical tasks (fixed datasets, no data augmentation): consider SGD+momentum. For fast convergence and NLP: Adam/AdamW. Hybrid: train with Adam, fine-tune final epochs with SGD to escape sharp minima. Or increase Adam\'s weight decay (1e-2 to 1e-1) to approximate SGD\'s regularization effect.',
  },
  {
    id: 'optimizer_switch',
    title: 'Resuming training: switching from Adam to SGD at step 50k causes loss spike',
    tier: 'Staff',
    context: [
      'Training paused at step 50k (Adam, LR=3e-4)',
      'Resume with SGD to improve generalization (team decided)',
      'Step 50001: loss 0.42 → step 50010: loss 1.8 → step 50020: loss 0.9',
      'Gradient norms: normal throughout spike',
    ],
    question: 'What causes the loss spike when switching optimizers mid-training?',
    options: ['LR mismatch between Adam and SGD effective learning rates', 'SGD has no momentum buffer — the spike is expected and recovers', 'Adam\'s momentum state must be transferred to SGD', 'Optimizer switch requires reloading the model from checkpoint'],
    answer: 0,
    diagnosis: 'LR mismatch — Adam\'s effective LR ≠ SGD\'s nominal LR',
    explanation: "Adam's effective per-parameter LR is approximately alpha / sqrt(v_t + epsilon). After 50k steps, v_t has accumulated — the effective LR is much lower than 3e-4. When you switch to SGD with LR=3e-4, it's far higher than what Adam was effectively using, causing an overshoot spike. The model then adapts and loss recovers.",
    fix: 'When switching optimizers mid-training: use LR warmup from near 0. Reduce SGD LR by 10–100x compared to Adam LR. Alternatively, use a hybrid strategy: copy Adam\'s second moment as the per-parameter weight in AdaGrad-style SGD. Or avoid the switch entirely — use weight averaging (SWA) to improve generalization without changing optimizer.',
  },
]

function OptimizerComparison() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--violet)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Optimizer Comparison</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '560px' }}>
          SGD vs Adam vs AdamW vs RMSprop — each has failure modes the others don't. 6 scenarios where optimizer choice is the deciding factor.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
        {[['SGD', 'Flatter minima, large-batch', 'var(--mint)'], ['Adam', 'Sparse grads, NLP', 'var(--violet)'], ['AdamW', 'Transformers (decoupled WD)', 'var(--sky)'], ['RMSprop', 'RNNs, non-stationary', 'var(--gold)']].map(([name, desc, color]) => (
          <div key={name} style={{ padding: '5px 10px', borderRadius: '5px', border: `1px solid ${color}30`, background: `${color}08` }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color }}>{name}</span>
            <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', marginLeft: '7px' }}>{desc}</span>
          </div>
        ))}
      </div>
      <AccordionMCQ scenarios={OPTIMIZER_SCENARIOS} accentColor="var(--violet)" contextLabel="Telemetry" storageKey="deeplearn_optimizer" />
    </div>
  )
}

// ── Regularization Decisions ──────────────────────────────────────────────────
const REGULARIZATION_SCENARIOS = [
  {
    id: 'image_overfit',
    title: 'Image classifier: train 98%, val 67% — no augmentation applied',
    tier: 'Analyst',
    context: [
      'Task: 10-class image classification',
      'Dataset: 5k training images',
      'Model: ResNet-18 pretrained, full fine-tune',
      'No data augmentation, no dropout in custom head',
    ],
    question: 'What is the highest-leverage regularization intervention?',
    options: ['Add L2 weight decay', 'Add dropout (0.5) to all layers', 'Add data augmentation (flip, crop, color jitter)', 'Reduce model to ResNet-9'],
    answer: 2,
    diagnosis: 'Data augmentation — highest leverage per unit of effort on image tasks',
    explanation: 'With 5k images and no augmentation, the model memorizes specific pixel patterns. Data augmentation (random flips, crops, color jitter, mixup) effectively multiplies dataset size and teaches invariances. This alone typically closes 10–15pp of train/val gap. Weight decay helps but doesn\'t teach invariances. Dropout in a pretrained ResNet backbone can hurt pretrained features.',
    fix: 'Apply: RandomHorizontalFlip, RandomCrop(padding=4), ColorJitter(brightness=0.2, contrast=0.2), optional Mixup (alpha=0.2). After augmentation, if still overfitting, add dropout only to custom classification head (not backbone). Weight decay 1e-4 throughout.',
  },
  {
    id: 'transformer_overfit',
    title: 'Transformer already has dropout=0.1, still overfitting on fine-tune',
    tier: 'Senior',
    context: [
      'Model: BERT-base fine-tuned, dropout=0.1 (default)',
      'Fine-tune dataset: 3k examples',
      'Train loss: 0.12, Val loss: 0.89',
      'Already tried: dropout=0.2, dropout=0.3 — marginal improvement',
    ],
    question: 'What regularization technique is most effective for this scenario?',
    options: ['Increase dropout further to 0.5', 'Use AdamW with higher weight decay (0.1–0.3)', 'Add batch normalization layers', 'Apply label smoothing only'],
    answer: 1,
    diagnosis: 'AdamW with higher weight decay — Adam\'s default WD is too weak',
    explanation: "Standard Adam doesn't decouple weight decay from the adaptive learning rate, making it ineffective. AdamW applies weight decay correctly (as L2 in parameter space, not gradient space). Default AdamW WD is 0.01 — for small fine-tune datasets, 0.1 to 0.3 can significantly reduce overfitting. This is different from dropout which just adds noise.",
    fix: 'Set AdamW weight_decay=0.1. Optionally combine with: layer-wise learning rate decay (lower LR for early layers), early stopping on validation loss. For very small datasets (<1k), consider freezing all but the last 2 transformer blocks.',
  },
  {
    id: 'lstm_overfit',
    title: 'LSTM sequence model: train perfect, val gap, recurrent dropout not applied',
    tier: 'Senior',
    context: [
      'Task: text sequence classification, LSTM 2-layer',
      'Standard dropout between layers: 0.3',
      'Train F1: 0.96, Val F1: 0.71',
      'Recurrent connections: no dropout',
    ],
    question: 'Why is recurrent dropout important here beyond standard dropout?',
    options: ['Standard dropout between layers is sufficient', 'Recurrent dropout applies the same mask across timesteps — regularizes temporal dependencies', 'Recurrent dropout is same as standard dropout — no difference', 'Add dropout to embeddings instead'],
    answer: 1,
    diagnosis: 'Recurrent dropout — same mask across timesteps regularizes memory cell overfitting',
    explanation: 'Standard dropout (different random mask each timestep) in recurrent connections breaks gradient flow and hurts learning. Variational/recurrent dropout uses the SAME mask across all timesteps in a sequence, acting as a structured regularizer on the recurrent transition matrix. This prevents the LSTM from memorizing sequence-specific patterns.',
    fix: 'PyTorch LSTM has `dropout` parameter (between layers) but not recurrent dropout natively. Use `torch.nn.LSTM` with `dropout=0.3` between layers, and implement variational dropout on hidden state separately. Or use AWD-LSTM (ASGD Weight-Dropped LSTM) which applies weight dropout to the recurrent weight matrix directly.',
  },
  {
    id: 'label_smoothing',
    title: 'Model overconfident on easy examples, underperforms on hard ones',
    tier: 'Senior',
    context: [
      'Task: 100-class image classification',
      'Model outputs: 0.995 confidence on easy examples, 0.52 on hard',
      'Calibration ECE: 0.22 (overconfident)',
      'Soft labels from knowledge distillation not feasible (no teacher model)',
    ],
    question: 'Which regularization technique directly addresses overconfidence in outputs?',
    options: ['Dropout — reduces overfitting indirectly', 'Label smoothing — directly softens target distribution', 'Weight decay — reduces parameter magnitude', 'Gradient clipping — prevents extreme updates'],
    answer: 1,
    diagnosis: 'Label smoothing — penalizes overconfident predictions directly',
    explanation: 'Label smoothing replaces hard one-hot targets (1.0 for correct class) with soft targets (e.g., 0.9 for correct, 0.001 for each wrong class). The model is penalized for assigning too much probability to the correct class. This directly addresses ECE and improves calibration without retraining. Shown to improve both accuracy and calibration (e.g., in EfficientNet, ViT training).',
    fix: 'Use `CrossEntropyLoss(label_smoothing=0.1)` in PyTorch. For 100 classes, smoothing=0.1 assigns 0.9 to correct class and 0.001 to each other. Tune smoothing amount: 0.05–0.2 is typical. Combine with mixup (alpha=0.2) for further calibration improvement.',
  },
  {
    id: 'small_dataset',
    title: 'Very small dataset (500 samples): high variance, cannot get stable val results',
    tier: 'Staff',
    context: [
      'Task: medical image classification',
      'Training data: 500 labeled samples (expensive annotation)',
      'Val accuracy: varies ±8pp between runs with same hyperparameters',
      'Model: EfficientNet-B0 fine-tune',
    ],
    question: 'What combination of techniques is most effective for 500-sample fine-tuning?',
    options: ['Large dropout (0.5) + no augmentation', 'Freeze backbone + fine-tune head only + strong augmentation + mixup', 'Full fine-tune with weight decay only', 'Reduce model to linear classifier on frozen features'],
    answer: 1,
    diagnosis: 'Freeze backbone + strong augmentation — preserve pretrained features, diversify scarce data',
    explanation: 'With 500 samples, full fine-tuning destroys pretrained features (catastrophic forgetting). The backbone learned from millions of images — that knowledge is far more valuable than what 500 samples can teach. Freeze the backbone, fine-tune only the head. Add strong augmentation (RandAugment) and mixup to make those 500 samples maximally useful.',
    fix: 'Stage 1: freeze backbone, train head for 20 epochs with LR=1e-3. Stage 2: unfreeze last 2 blocks, train with LR=1e-4, cosine decay, 30 epochs. Augmentation: RandAugment (n=2, m=9) + Mixup (alpha=0.4). Use 5-fold cross-validation to get stable val estimates with 500 samples.',
  },
  {
    id: 'mixup_timing',
    title: 'Mixup applied throughout training — val performance plateaued, test slightly worse',
    tier: 'Staff',
    context: [
      'Training: 100 epochs with mixup alpha=0.4 throughout',
      'Val accuracy plateaued at epoch 70',
      'Test set (held out): slightly worse than expected',
      'Paper says: mixup should improve generalization',
    ],
    question: 'What is the likely issue with applying mixup throughout all 100 epochs?',
    options: ['Mixup alpha=0.4 is too high — reduce to 0.1', 'Mixup throughout prevents final convergence — disable in last 10–20 epochs', 'Mixup incompatible with this architecture', 'Test set has distribution shift — unrelated to mixup'],
    answer: 1,
    diagnosis: 'Mixup prevents sharp convergence — disable in final epochs',
    explanation: 'Mixup is a regularization that blurs decision boundaries. This helps early training but prevents the model from committing to sharp class boundaries in late training. Several papers (CutMix, ResNet training recipes) recommend disabling augmentation/mixup in the final 10–20 epochs to allow final convergence to sharp, accurate boundaries.',
    fix: 'Training recipe: epochs 0–80 with mixup alpha=0.4, epochs 81–100 with no mixup, LR reduced to 1e-5. Or use a linear decay of alpha from 0.4 to 0.0 over the last 20 epochs. This improves final accuracy by 0.5–1pp in typical experiments.',
  },
]

function RegularizationDecisions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--violet)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Regularization Decisions</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '560px' }}>
          Dropout, weight decay, augmentation, label smoothing, mixup — each attacks overfitting differently. 6 scenarios where the wrong regularizer makes things worse.
        </p>
      </div>
      <AccordionMCQ scenarios={REGULARIZATION_SCENARIOS} accentColor="var(--rose)" contextLabel="Setup" storageKey="deeplearn_regularize" />
    </div>
  )
}

// ── Transformer Architecture ──────────────────────────────────────────────────
const TRANSFORMER_SCENARIOS = [
  {
    id: 'context_length_kv',
    title: 'Extending context from 2K to 32K — GPU OOM during inference',
    tier: 'Senior',
    context: [
      'Model: 7B parameter LLM, 32 attention heads, d_model=4096',
      'Training context: 2048 tokens',
      'Inference request: 32k token document summarization',
      'Error: CUDA OOM at attention computation',
    ],
    question: 'What is the primary memory bottleneck and how do you address it?',
    options: ['Model weights are too large — use INT8 quantization', 'KV cache grows quadratically — use sliding window attention or FlashAttention', 'Batch size too high — reduce to 1', 'Attention computation is O(n²) in memory — use FlashAttention'],
    answer: 3,
    diagnosis: 'Attention is O(n²) memory — FlashAttention reduces to O(n)',
    explanation: 'Standard attention materializes the full n×n attention matrix in HBM (GPU memory). At 32k tokens: 32k² × 32 heads × 2 bytes (FP16) ≈ 64GB per layer. FlashAttention tiles the computation — it never materializes the full attention matrix, reducing memory from O(n²) to O(n) while producing identical results. Flash Attention 2 is now standard for long-context inference.',
    fix: 'Install FlashAttention-2 (`pip install flash-attn`). For models not supporting FlashAttention natively, use xFormers memory-efficient attention. For even longer contexts, combine with sliding window attention (Longformer pattern): local attention for most layers, full attention only for final layers.',
  },
  {
    id: 'mha_mqa_gqa',
    title: 'Inference serving: 7B model, p99 latency 2.3s — need <500ms',
    tier: 'Staff',
    context: [
      'Model: 7B LLM, Multi-Head Attention (MHA), 32 heads',
      'KV cache size at max sequence length: 14GB per request',
      'p99 latency bottleneck: KV cache read/write (memory bandwidth bound)',
      'Retrain budget: available for distillation/architectural change',
    ],
    question: 'Which attention architecture change reduces KV cache size with minimal quality loss?',
    options: ['Reduce number of attention heads from 32 to 8', 'Switch from MHA to GQA (Grouped Query Attention)', 'Switch from MHA to MQA (Multi-Query Attention)', 'Use quantized KV cache (INT4)'],
    answer: 1,
    diagnosis: 'GQA — best quality-efficiency tradeoff between MHA and MQA',
    explanation: "MHA: 32 KV heads (full quality, full memory). MQA: 1 KV head shared by all 32 query heads (4x memory reduction, quality drop noticeable). GQA (used in Llama-2-70B, Mistral): G groups (e.g., 8), each group shares 1 KV head among 4 query heads. KV cache reduced 4x vs MHA, quality ~= MHA. Google's paper showed GQA interpolates optimally between MHA and MQA.",
    fix: 'Use GQA with G=8 (32 query heads, 8 KV heads). Requires retraining or GQA-aware distillation. For serving without retraining: quantize KV cache to INT8 (1.7x memory reduction, <1% quality loss). For immediate latency reduction: batch similar-length sequences to minimize KV cache fragmentation.',
  },
  {
    id: 'attention_heads',
    title: 'Scaling from 8 to 32 attention heads: no improvement in validation loss',
    tier: 'Senior',
    context: [
      'd_model = 512, fixed',
      '8 heads: head_dim = 512/8 = 64',
      '32 heads: head_dim = 512/32 = 16',
      'Training from scratch, same total params (linear projections adjusted)',
    ],
    question: 'Why does adding more heads not help when d_model is fixed?',
    options: ['More heads always improve performance — training hyperparameters need tuning', 'More heads with same d_model means smaller head_dim — heads lose representational capacity', 'Attention heads are independent — count doesn\'t affect quality', 'Use rotary positional encoding to fix the head_dim problem'],
    answer: 1,
    diagnosis: 'Smaller head_dim reduces each head\'s representational capacity',
    explanation: 'Each attention head computes similarity in a subspace of dimension head_dim. With head_dim=64, each head can capture complex patterns. With head_dim=16, each head is a very low-dimensional dot product — limited representational power. The empirical sweet spot is head_dim=64 (GPT-2, BERT, original Transformers all used this). More heads with smaller head_dim is not better.',
    fix: 'Keep head_dim ≈ 64 as the target. To scale to more heads, scale d_model proportionally: 16 heads → d_model=1024. Or keep 8 heads with d_model=512. If you must use 32 heads with d_model=512, consider multi-query attention where the reduced head_dim is compensated by sharing KV projections.',
  },
  {
    id: 'rope_vs_alibi',
    title: 'Training at 2k context, need zero-shot generalization to 8k at inference',
    tier: 'Staff',
    context: [
      'Model: decoder-only LLM trained from scratch',
      'Training context length: 2048 tokens',
      'Inference requirement: handle documents up to 8192 tokens at deployment',
      'Positional encoding: choosing between absolute sinusoidal, RoPE, ALiBi',
    ],
    question: 'Which positional encoding generalizes best to lengths beyond training context?',
    options: ['Absolute sinusoidal — used in original Transformer, well-tested', 'Learned absolute positions — fine-tunable at inference', 'RoPE (Rotary Position Embedding) — better length generalization than absolute', 'ALiBi (Attention with Linear Biases) — designed for length generalization'],
    answer: 3,
    diagnosis: 'ALiBi — designed explicitly for length extrapolation',
    explanation: "ALiBi adds a linear bias to attention scores based on distance (not learned positions). The bias is `-m × |i-j|` where m is a per-head slope. This is trivially extensible to longer sequences — just continue the linear penalty. Tested in the original paper to 2048-context training generalizing to 4096. RoPE also generalizes but requires YaRN or NTK-RoPE tricks for large extrapolation. Absolute sinusoidal fails completely beyond training length.",
    fix: 'For length generalization: ALiBi is the safest choice at training time. For models already trained with RoPE (Llama), use YaRN (Yet another RoPE extensioN) or dynamic NTK-scaling at inference — no retraining required. For absolute position models: positional interpolation (linear scaling of position indices) allows modest extrapolation.',
  },
  {
    id: 'prenorm_postnorm',
    title: 'Deep 48-layer transformer unstable at training start with Post-LN',
    tier: 'Staff',
    context: [
      'Model: 48-layer transformer, Post-Layer Norm (original Transformer architecture)',
      'Training: loss diverges in first 1000 steps without learning rate warmup',
      'Warmup helps but requires very careful LR tuning',
      'Team considering Pre-LN architecture',
    ],
    question: 'Why does Pre-LN (layer norm before attention) improve training stability?',
    options: ['Pre-LN has more parameters than Post-LN', 'Pre-LN prevents gradient explosion at initialization by normalizing before each sublayer', 'Pre-LN is computationally faster than Post-LN', 'Post-LN has been deprecated in modern transformers'],
    answer: 1,
    diagnosis: 'Pre-LN normalizes gradients at initialization — stable without warmup',
    explanation: "Post-LN normalizes after residual addition: output = LN(x + sublayer(x)). At initialization, the residual pathway has random magnitude — LN at the end doesn't fully control gradient scale through 48 layers. Pre-LN: output = x + sublayer(LN(x)). The normalization happens before the sublayer, keeping gradient magnitudes controlled through depth. GPT-2, GPT-3, LLaMA all use Pre-LN for this reason.",
    fix: 'Use Pre-LN for transformers deeper than ~12 layers. Post-LN can achieve slightly better final quality with careful warmup (some papers show this), but is fragile. If using Post-LN, warmup for 4–8% of total training steps and use a max LR 10x lower than with Pre-LN. Modern recipe: Pre-LN + AdamW + cosine schedule + warmup.',
  },
  {
    id: 'flash_attention_io',
    title: 'GPU compute utilization 30% during attention — expected higher',
    tier: 'Staff',
    context: [
      'Model: 13B transformer, sequence length 4096',
      'GPU: A100 80GB',
      'Attention computation: standard PyTorch SDPA (no FlashAttention)',
      'Compute utilization: 30% (expected 70%+)',
      'Memory bandwidth: maxed out',
    ],
    question: 'Why is compute utilization low despite memory bandwidth being saturated?',
    options: ['Model is too large for A100 — need H100', 'Attention is memory bandwidth-bound, not compute-bound — IO dominates', 'Batch size too small — scale up to use more compute', 'Mixed precision not enabled — FP32 is slower'],
    answer: 1,
    diagnosis: 'Attention is IO-bound — HBM bandwidth saturated, compute cores idle',
    explanation: "Standard attention has O(n²) HBM reads/writes (materializing the full attention matrix). At 4k tokens, the attention matrix is 4096² × 32 heads = huge. A100 compute is 312 TFLOPS (BF16) but HBM bandwidth is 2TB/s. The ratio of FLOPs to memory access (arithmetic intensity) is too low — the GPU spends more time waiting for data than computing. FlashAttention tiles computation into SRAM (on-chip, 1000x faster than HBM), eliminating most HBM roundtrips.",
    fix: 'Use FlashAttention-2. It achieves 2–4x speedup and reduces HBM memory usage by materializing only small tiles at a time in fast SRAM. In PyTorch 2.0+: `torch.nn.functional.scaled_dot_product_attention` with `enable_flash_sdp(True)` uses FlashAttention automatically. Profile with `torch.profiler` to confirm attention is the bottleneck.',
  },
]

function TransformerArchitecture() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--violet)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Transformer Architecture</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, maxWidth: '560px' }}>
          Attention heads, KV cache, positional encodings, Pre vs Post-LN, FlashAttention — architecture decisions that separate LLM practitioners from LLM users. 6 production scenarios.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
        {[['MHA', 'Multi-Head Attention', 'var(--violet)'], ['GQA', 'Grouped Query Attention', 'var(--sky)'], ['RoPE/ALiBi', 'Positional Encoding', 'var(--mint)'], ['Flash Attn', 'IO-efficient attention', 'var(--gold)']].map(([name, desc, color]) => (
          <div key={name} style={{ padding: '5px 10px', borderRadius: '5px', border: `1px solid ${color}30`, background: `${color}08` }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color }}>{name}</span>
            <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', marginLeft: '7px' }}>{desc}</span>
          </div>
        ))}
      </div>
      <AccordionMCQ scenarios={TRANSFORMER_SCENARIOS} accentColor="var(--sky)" contextLabel="System State" storageKey="deeplearn_transformer" />
    </div>
  )
}

// ── Tab shell ─────────────────────────────────────────────────────────────────
const DL_MODULES = [
  { id: 'diagnosis',    label: 'Training Failures',       icon: '', component: TrainingFailureDiagnosis },
  { id: 'gradient',    label: 'Backprop Debugging',       icon: '', component: GradientDebugger },
  { id: 'optimizer',   label: 'Optimizer Comparison',     icon: '', component: OptimizerComparison },
  { id: 'regularize',  label: 'Regularization Decisions', icon: '', component: RegularizationDecisions },
  { id: 'transformer', label: 'Transformer Architecture', icon: '', component: TransformerArchitecture },
]

export default function DeepLearningTab({ onNavigate }) {
  const [active, setActive] = useState('diagnosis')
  const [, forceUpdate] = useState(0)
  const ActiveModule = DL_MODULES.find(m => m.id === active)?.component ?? TrainingFailureDiagnosis

  useEffect(() => {
    const goto = localStorage.getItem('msl_goto_module')
    if (goto) {
      const found = DL_MODULES.find(m => m.id === goto)
      if (found) {
        setActive(goto)
        localStorage.removeItem('msl_goto_module')
      }
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: '0 0 6px', background: 'linear-gradient(135deg, var(--violet) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Training Lab</h1>
        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '600px', margin: 0 }}>
          DL courses teach you to build. This domain teaches you to debug — training failures, gradient issues, optimizer tradeoffs, regularization choices, transformer internals. Real telemetry, real decisions.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {DL_MODULES.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button onClick={() => setActive(m.id)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${active === m.id ? 'var(--violet)' : 'var(--rim)'}`, background: active === m.id ? 'rgba(99,102,241,0.10)' : 'transparent', color: active === m.id ? 'var(--violet)' : 'var(--ink-low)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
              {m.icon} {m.label}
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleBookmark('deeplearn', m.id, m.label); forceUpdate(n => n+1) }}
              title={isBookmarked('deeplearn', m.id) ? 'Remove bookmark' : 'Bookmark module'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '12px', color: isBookmarked('deeplearn', m.id) ? 'var(--prime)' : 'var(--ink-ghost)', lineHeight: 1 }}>
              {isBookmarked('deeplearn', m.id) ? <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 0.5h8a1 1 0 011 1v11.25l-5-2.917-5 2.917V1.5a1 1 0 011-1z"/></svg> : <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M2 1h8a.5.5 0 01.5.5v11L6 9.75 1.5 12.5V1.5A.5.5 0 012 1z"/></svg>}
            </button>
          </div>
        ))}
      </div>

      <div key={active} className="tab-enter"><ActiveModule /></div>
    </div>
  )
}
