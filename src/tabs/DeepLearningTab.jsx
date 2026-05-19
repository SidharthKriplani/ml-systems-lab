import { useState } from 'react'

// ── Training Failure Diagnosis ────────────────────────────────────────────────
const FAILURES = [
  {
    id: 'exploding',
    title: 'Loss spikes to NaN after epoch 3',
    symptoms: ['Training loss: 0.42 → 0.39 → 0.41 → NaN', 'Gradient norm: 0.8 → 1.2 → 47.3 → ∞', 'LR: 3e-4, batch 64, no gradient clipping'],
    options: ['Vanishing gradients', 'Exploding gradients', 'Label noise', 'Data loader bug'],
    answer: 1,
    diagnosis: 'Exploding gradients',
    explanation: 'Gradient norm jumped 40x before NaN — classic explosion. The loss going NaN is the terminal symptom, not the cause. Vanishing gradients produce the opposite: loss stalls, gradients approach zero.',
    fix: 'Add gradient clipping (`clip_grad_norm_(params, max_norm=1.0)`) before the optimizer step. Also audit your LR — 3e-4 is aggressive for transformers. Consider warmup + cosine schedule.',
    tier: 'Senior',
  },
  {
    id: 'overfit_early',
    title: 'Train loss 0.08, val loss 2.4 at epoch 5',
    symptoms: ['Train/val loss diverge from epoch 2', 'Dataset: 12k samples, model: 45M params', 'No dropout, no weight decay, full fine-tune'],
    options: ['Wrong loss function', 'Overfitting', 'Distribution shift between train/val', 'Batch norm statistics mismatch'],
    answer: 1,
    diagnosis: 'Overfitting',
    explanation: 'A 45M param model on 12k samples with no regularisation will memorise the training set. The 30x train/val loss gap is the signature. Distribution shift would show from epoch 1, not diverge progressively.',
    fix: 'Freeze the first N layers (fine-tune only the head + last 2 blocks). Add dropout (0.1–0.3). Use weight decay (1e-2). Consider label smoothing. If still diverging, reduce model size or use LoRA.',
    tier: 'Analyst',
  },
  {
    id: 'lr_too_high',
    title: 'Loss oscillates, never converges',
    symptoms: ['Loss: 1.8 → 0.9 → 1.7 → 0.8 → 1.6 ...', 'Gradient norm stable ~0.5', 'LR: 0.1, SGD+momentum, no scheduler'],
    options: ['Exploding gradients', 'Learning rate too high', 'Dead ReLUs', 'Incorrect normalisation'],
    answer: 1,
    diagnosis: 'Learning rate too high',
    explanation: 'Stable gradient norms + oscillating loss = LR overshoot. The loss keeps crossing the minimum without settling. Gradient explosion would show in the norm. Dead ReLUs cause stagnation, not oscillation.',
    fix: 'Drop LR by 10x. Use a cyclical or cosine scheduler. For SGD, typical good ranges are 1e-2 to 1e-3 with momentum 0.9. Switch to Adam if you want less LR sensitivity.',
    tier: 'Junior',
  },
  {
    id: 'vanishing',
    title: 'Loss stagnates from epoch 1, gradients near zero',
    symptoms: ['Loss: 1.38 → 1.37 → 1.37 → 1.37 (ln2 ≈ 0.693 for binary, ln10 for 10-class)', 'Gradient norm: 0.001 → 0.0003 → 0.00008', '20-layer MLP, sigmoid activations, Xavier init'],
    options: ['Vanishing gradients', 'Exploding gradients', 'Dead ReLUs', 'Wrong learning rate'],
    answer: 0,
    diagnosis: 'Vanishing gradients',
    explanation: 'Sigmoid saturates at extremes, squashing gradients to near zero through 20 layers of backprop. The loss stuck near random (ln(10) ≈ 2.3 for 10-class) confirms nothing is being learned. This is the textbook vanishing gradient case.',
    fix: 'Replace sigmoid with ReLU/GELU/SiLU. Use BatchNorm or LayerNorm between layers. For very deep nets, add residual connections. Consider He initialisation instead of Xavier for ReLU activations.',
    tier: 'Senior',
  },
  {
    id: 'dead_relu',
    title: '40% of neurons output exactly 0.0 after epoch 2',
    symptoms: ['Training loss: slowly decreasing but slower than expected', 'Activations histogram: spike at exactly 0 growing each epoch', 'LR: 0.01, ReLU everywhere, negative bias initialisation'],
    options: ['Vanishing gradients', 'Exploding gradients', 'Dead ReLUs', 'Batch size too small'],
    answer: 2,
    diagnosis: 'Dead ReLUs',
    explanation: 'Negative bias init + high LR can push pre-activations permanently below zero. ReLU sets those to 0 and their gradients to 0 permanently — they never recover. The growing spike at 0 in the activation histogram is the tell.',
    fix: 'Use Leaky ReLU (negative_slope=0.01) or ELU to allow small negative gradients. Initialise biases to zero or small positive. Reduce LR. Or switch to GELU which is smooth everywhere.',
    tier: 'Senior',
  },
  {
    id: 'batchnorm_eval',
    title: 'Model accurate in training, random in production',
    symptoms: ['Train accuracy: 94%, val accuracy: 93%', 'Production accuracy: 11% (random for 9-class)', 'Inference runs single samples one by one via REST API'],
    options: ['Distribution shift', 'BatchNorm in train mode during inference', 'Model not saved correctly', 'Wrong preprocessing'],
    answer: 1,
    diagnosis: 'BatchNorm running in train mode during inference',
    explanation: 'BatchNorm in train mode computes stats over the current batch. With batch_size=1, the mean and variance are computed over a single sample, which is essentially random normalisation. The model never saw this at training time.',
    fix: 'Call model.eval() before inference — this switches BatchNorm to use running statistics accumulated during training. Never forget: train() for training loops, eval() for inference. This is one of the most common production bugs.',
    tier: 'Staff',
  },
  {
    id: 'data_leak',
    title: 'Val loss better than train loss throughout training',
    symptoms: ['Val loss consistently 10–15% lower than train loss', 'Val accuracy: 99.2%, train accuracy: 87.4%', 'Data preprocessed before train/val split'],
    options: ['Very strong regularisation', 'Data leakage from val into train', 'Smaller val set has easier samples', 'Dropout only applied at test time'],
    answer: 1,
    diagnosis: 'Data leakage — preprocessing before split',
    explanation: 'When preprocessing (normalisation, feature stats, augmentation parameters) is computed on the full dataset before splitting, val data statistics contaminate train statistics. The model has effectively "seen" val data indirectly. Val loss below train loss is the red flag.',
    fix: 'Always split first, preprocess second. Fit scalers/encoders only on train set, then transform val/test with those fitted parameters. Audit the full data pipeline — leakage is often subtle (e.g., computing mean over all samples, then splitting).',
    tier: 'Staff',
  },
  {
    id: 'wrong_loss',
    title: 'Model predicts only the most common class',
    symptoms: ['Dataset: 95% class A, 5% class B', 'Training loss steadily decreasing', 'Model outputs class A for every input', 'Using CrossEntropyLoss, no class weights'],
    options: ['Vanishing gradients', 'Learning rate too low', 'Class imbalance — model collapsed to majority class', 'Wrong activation in output layer'],
    answer: 2,
    diagnosis: 'Class collapse due to imbalance',
    explanation: 'With 95/5 imbalance, predicting class A always gives 95% accuracy and low cross-entropy. The loss is genuinely minimised by this degenerate solution. The model found the shortcut.',
    fix: 'Use weighted cross-entropy (weight minority class by 1/frequency). Or use focal loss to down-weight easy negatives. Oversample the minority class (SMOTE, or simple duplication). Always check per-class metrics, not just accuracy.',
    tier: 'Analyst',
  },
]

const TIER_COLORS = { Junior: 'var(--sky)', Analyst: 'var(--mint)', Senior: 'var(--prime)', Staff: 'var(--violet)' }

function TrainingFailureDiagnosis() {
  const [idx,      setIdx]      = useState(0)
  const [picked,   setPicked]   = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score,    setScore]    = useState({ correct: 0, total: 0 })

  const scenario = FAILURES[idx]

  function choose(i) {
    if (revealed) return
    setPicked(i)
    setRevealed(true)
    setScore(s => ({ correct: s.correct + (i === scenario.answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % FAILURES.length)
    setPicked(null)
    setRevealed(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Training Failure Diagnosis</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
            Read the training telemetry. Diagnose before you scroll.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {FAILURES.length}</span>
          {score.total > 0 && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(52,211,153,0.10)', color: 'var(--mint)' }}>
              {score.correct}/{score.total} correct
            </span>
          )}
        </div>
      </div>

      {/* Scenario card */}
      <div className="card" style={{ padding: '22px', borderLeft: `3px solid var(--rose)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontSize: '18px' }}>🔴</span>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)' }}>{scenario.title}</span>
          <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: TIER_COLORS[scenario.tier] + '18', color: TIER_COLORS[scenario.tier], fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{scenario.tier}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {scenario.symptoms.map((s, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: 'var(--ink-mid)', padding: '4px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {scenario.options.map((opt, i) => {
          let bg = 'var(--surface)', border = 'var(--rim)', color = 'var(--ink-mid)'
          if (revealed) {
            if (i === scenario.answer) { bg = 'rgba(52,211,153,0.08)'; border = 'var(--mint)'; color = 'var(--mint)' }
            else if (i === picked) { bg = 'rgba(244,63,94,0.08)'; border = 'var(--rose)'; color = 'var(--rose)' }
          } else if (i === picked) {
            bg = 'rgba(240,165,0,0.08)'; border = 'var(--prime)'; color = 'var(--prime)'
          }
          return (
            <button key={i} onClick={() => choose(i)} disabled={revealed}
              style={{ padding: '12px 14px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {revealed && i === scenario.answer && '✓ '}
              {revealed && i === picked && i !== scenario.answer && '✗ '}
              {opt}
            </button>
          )
        })}
      </div>

      {/* Reveal */}
      {revealed && (
        <div className="card animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '15px', fontWeight: 700, color: picked === scenario.answer ? 'var(--mint)' : 'var(--rose)' }}>
            {picked === scenario.answer ? '✓ Correct — ' : '✗ Wrong — '}{scenario.diagnosis}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.explanation}</p>
          <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.20)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Production Fix</div>
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
  {
    id: 'vanishing_sigmoid',
    title: 'Layers 1–6 gradient norms all < 1e-6, layers 7–12 normal',
    symptoms: [
      'Layer 12 grad_norm: 0.42',
      'Layer 8  grad_norm: 0.31',
      'Layer 6  grad_norm: 0.000003',
      'Layer 1  grad_norm: 0.0000001',
      'Activation: Sigmoid, 12-layer network',
    ],
    options: [
      'Exploding gradients in early layers',
      'Vanishing gradients (sigmoid saturation)',
      'Gradient checkpoint bug',
      'Wrong loss function',
    ],
    answer: 1,
    diagnosis: 'Vanishing gradients (sigmoid saturation)',
    explanation: 'Sigmoid saturates at extremes, derivative max 0.25. Through 12 layers, 0.25^12 ≈ 6e-8. The sharp cutoff at layer 6 shows where saturation becomes total.',
    fix: 'Replace sigmoid with GELU/SiLU. Add LayerNorm between blocks. Consider residual connections to provide gradient highways.',
  },
  {
    id: 'unfrozen_embedding',
    title: 'All layers normal except embedding layer is frozen but updating',
    symptoms: [
      'Embedding layer requires_grad: True',
      'Embedding grad_norm: 847.3',
      'Loss: decreasing normally',
      'Training: fine-tune, frozen backbone expected',
    ],
    options: [
      'Expected behavior',
      'Accidentally unfroze embedding layer',
      'Learning rate too high for embeddings',
      'Weight decay conflict',
    ],
    answer: 1,
    diagnosis: 'Accidentally unfroze embedding layer',
    explanation: 'Embedding grad_norm of 847 while backbone is "frozen" means the freeze didn\'t apply to embeddings. Common when freeze loop uses `model.encoder.parameters()` but embeddings are at `model.embeddings`.',
    fix: '`for name, param in model.named_parameters(): param.requires_grad = \'head\' in name` — always verify with `[n for n,p in model.named_parameters() if p.requires_grad]`.',
  },
  {
    id: 'nan_forward',
    title: 'Loss NaN after gradient clipping — norms were fine',
    symptoms: [
      'grad_norm before clip: 0.87 (normal)',
      'After clip: grad_norm still 0.87',
      'Loss step 312: 0.43 → NaN',
      'Learning rate: 3e-3',
    ],
    options: [
      'Exploding gradients (clipping missed it)',
      'NaN in forward pass (not gradients)',
      'Batch norm instability',
      'Wrong gradient clipping API',
    ],
    answer: 1,
    diagnosis: 'NaN in forward pass (not gradients)',
    explanation: 'If gradient norms are normal but loss is NaN, the NaN originates in the forward pass — e.g., log(0), division by zero, softmax overflow. Gradient clipping can\'t fix what was already NaN in the output.',
    fix: 'Add `torch.autograd.set_detect_anomaly(True)` temporarily. Check for log(x+1e-8) guards, safe_softmax, and input normalization. Common culprits: log loss with 0 predictions, unlucky batch with all-zero inputs to BN.',
  },
  {
    id: 'periodic_spikes',
    title: 'Gradient norms spike every 100 steps periodically',
    symptoms: [
      'Step 100: grad_norm 14.2',
      'Step 200: grad_norm 11.8',
      'Step 300: grad_norm 15.1',
      'Steps 1-99: grad_norm ~0.5',
      'Dataset: shuffled but seeded',
    ],
    options: [
      'Periodic data corruption (bad batch every N steps)',
      'Cyclical LR causing periodic instability',
      'Gradient accumulation misconfiguration',
      'Model architecture resonance',
    ],
    answer: 0,
    diagnosis: 'Periodic data corruption (bad batch every N steps)',
    explanation: 'Perfectly periodic spikes at fixed step intervals with a seeded dataset = same corrupted samples being loaded. The seeded shuffle means every epoch hits the same bad rows at the same position.',
    fix: 'Check dataset for NaN/inf rows (`df.isnull().any()`). Add input validation in `__getitem__`. Use different seed per epoch (`sampler = torch.utils.data.RandomSampler(dataset, generator=torch.Generator().manual_seed(epoch))`).',
  },
  {
    id: 'frozen_layernorm',
    title: 'Layer norms in transformer show all-zero gradients after step 500',
    symptoms: [
      'layernorm.weight grad: tensor([0., 0., 0., ...]',
      'layernorm.bias  grad: tensor([0., 0., 0., ...]',
      'Attention layers: normal grads',
      'Training: continued from checkpoint',
    ],
    options: [
      'LayerNorm frozen in checkpoint',
      'Learning rate decayed to zero',
      'Gradient checkpoint interaction',
      'LayerNorm already converged (expected)',
    ],
    answer: 0,
    diagnosis: 'LayerNorm frozen in checkpoint',
    explanation: 'When loading from checkpoint with `strict=False` or selective loading, norm layers can accidentally have `requires_grad=False` retained from a differently-trained checkpoint.',
    fix: 'After `load_state_dict`, verify: `assert all(p.requires_grad for n,p in model.named_parameters() if \'norm\' in n)`. Re-enable with `model.layernorm.weight.requires_grad_(True)`.',
  },
  {
    id: 'numpy_break',
    title: 'Gradient flow stops at a custom layer — no grad_fn',
    symptoms: [
      'Custom layer output: tensor([...], grad_fn=None)',
      'All layers after: zero gradients',
      'Custom op: uses numpy internally',
    ],
    options: [
      'Missing backward pass implementation',
      'Numpy breaks autograd graph',
      'Wrong loss reduction',
      'Detached tensor passed as input',
    ],
    answer: 1,
    diagnosis: 'Numpy breaks autograd graph',
    explanation: 'Numpy operations break the PyTorch autograd graph. `tensor.numpy()` detaches from computation graph. Any custom layer that converts to numpy and back silently kills gradient flow.',
    fix: 'Replace all numpy operations with PyTorch equivalents. If numpy is required, implement a custom `torch.autograd.Function` with explicit `forward` and `backward`. Check: `output.requires_grad` should be True throughout.',
  },
  {
    id: 'shared_embedding_grad',
    title: 'Shared embedding gradients accumulate unexpectedly across tasks',
    symptoms: [
      'Embedding grad accumulation: 3x expected magnitude',
      'Training: multi-task, 3 tasks sharing embedding layer',
      'optimizer.zero_grad() called once per global step',
    ],
    options: [
      'Gradient accumulation bug',
      'Correct behavior — shared layers receive summed gradients',
      'Weight decay amplifying shared layer updates',
      'Missing gradient clipping',
    ],
    answer: 1,
    diagnosis: 'Correct behavior — shared layers receive summed gradients',
    explanation: 'Shared layers receive gradients from ALL tasks that use them, summed. A 3-task setup with equal loss weight naturally produces 3x gradient magnitude on shared layers. This is mathematically correct, not a bug — but you probably want per-task gradient normalization.',
    fix: 'Scale each task loss by `1/n_tasks` before summing, or use gradient surgery (project conflicting gradients). The naive fix of reducing LR globally also works but is less principled.',
  },
  {
    id: 'amp_underflow',
    title: 'Gradients collapse to zero after mixed precision training enabled',
    symptoms: [
      'Before AMP: grad_norm ~0.5 (normal)',
      'After AMP: grad_norm 0.0 (all steps)',
      'Using torch.cuda.amp.autocast()',
      'GradScaler not used',
    ],
    options: [
      'FP16 underflow — gradients too small to represent',
      'GradScaler required with AMP',
      'Wrong dtype in loss computation',
      'Autocast scope too narrow',
    ],
    answer: 0,
    diagnosis: 'FP16 underflow — GradScaler missing',
    explanation: 'FP16 minimum positive value is ~6e-8. Small gradients underflow to exactly 0 in FP16. GradScaler multiplies loss before backward (scaling gradients up into FP16 representable range), then unscales before optimizer step. Without it, all small gradients vanish.',
    fix: '`scaler = torch.cuda.amp.GradScaler()` → `scaler.scale(loss).backward()` → `scaler.step(optimizer)` → `scaler.update()`. Always use GradScaler with AMP training.',
  },
]

function GradientDebugger() {
  const [idx,      setIdx]      = useState(0)
  const [picked,   setPicked]   = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score,    setScore]    = useState({ correct: 0, total: 0 })

  const scenario = GRAD_SCENARIOS[idx]

  function choose(i) {
    if (revealed) return
    setPicked(i)
    setRevealed(true)
    setScore(s => ({ correct: s.correct + (i === scenario.answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % GRAD_SCENARIOS.length)
    setPicked(null)
    setRevealed(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Backprop Debugging</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
            Read the gradient telemetry. Diagnose the gradient flow problem before you reveal.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {GRAD_SCENARIOS.length}</span>
          {score.total > 0 && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(52,211,153,0.10)', color: 'var(--mint)' }}>
              {score.correct}/{score.total} correct
            </span>
          )}
        </div>
      </div>

      {/* Scenario card */}
      <div className="card" style={{ padding: '22px', borderLeft: `3px solid var(--sky)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontSize: '18px' }}>📉</span>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)' }}>{scenario.title}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {scenario.symptoms.map((s, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: 'var(--ink-mid)', padding: '4px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        {scenario.options.map((opt, i) => {
          let bg = 'var(--surface)', border = 'var(--rim)', color = 'var(--ink-mid)'
          if (revealed) {
            if (i === scenario.answer) { bg = 'rgba(52,211,153,0.08)'; border = 'var(--mint)'; color = 'var(--mint)' }
            else if (i === picked) { bg = 'rgba(244,63,94,0.08)'; border = 'var(--rose)'; color = 'var(--rose)' }
          } else if (i === picked) {
            bg = 'rgba(240,165,0,0.08)'; border = 'var(--prime)'; color = 'var(--prime)'
          }
          return (
            <button key={i} onClick={() => choose(i)} disabled={revealed}
              style={{ padding: '12px 14px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {revealed && i === scenario.answer && '✓ '}
              {revealed && i === picked && i !== scenario.answer && '✗ '}
              {opt}
            </button>
          )
        })}
      </div>

      {/* Reveal */}
      {revealed && (
        <div className="card animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '15px', fontWeight: 700, color: picked === scenario.answer ? 'var(--mint)' : 'var(--rose)' }}>
            {picked === scenario.answer ? '✓ Correct — ' : '✗ Wrong — '}{scenario.diagnosis}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.explanation}</p>
          <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.20)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Production Fix</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.fix}</p>
          </div>
          <button className="btn-primary" onClick={next} style={{ alignSelf: 'flex-start' }}>Next scenario →</button>
        </div>
      )}
    </div>
  )
}

// ── Roadmap cards ─────────────────────────────────────────────────────────────
const ROADMAP = [
  { icon: '🔴', label: 'Training Failure Diagnosis',    desc: 'Loss spikes, vanishing gradients, dead ReLUs, data leakage — diagnose from telemetry.',  status: 'live',   color: 'var(--mint)' },
  { icon: '📉', label: 'Backprop & Gradient Debugging', desc: 'Gradient flow visualisation, which layers are actually learning, per-layer norm analysis.', status: 'live',   color: 'var(--mint)' },
  { icon: '🧊', label: 'Fine-tuning Decision Framework', desc: 'Freeze vs full fine-tune vs LoRA. When each makes sense based on data size and task delta.', status: 'soon',   color: 'var(--ink-low)' },
  { icon: '⚡', label: 'Model Serving & Quantization',  desc: 'INT8/FP16 tradeoffs, batch size vs latency, GPU memory math, KV cache sizing.',             status: 'soon',   color: 'var(--ink-low)' },
  { icon: '🔁', label: 'PyTorch Production Patterns',   desc: 'torch.compile, mixed precision, DDP vs FSDP, memory-efficient training.',                    status: 'soon',   color: 'var(--ink-low)' },
  { icon: '🔷', label: 'Attention & Transformer Internals', desc: 'Multi-head attention math, positional encoding choices, why Flash Attention matters.',   status: 'soon',   color: 'var(--ink-low)' },
  { icon: '📦', label: 'TensorFlow in Production',      desc: 'SavedModel vs keras save, TF Serving config, signature defs, batch inference patterns.',     status: 'soon',   color: 'var(--ink-low)' },
  { icon: '📐', label: 'Architecture Decision Lab',     desc: 'CNN vs Transformer vs hybrid for your task. Benchmark-driven architecture selection.',        status: 'soon',   color: 'var(--ink-low)' },
]

// ── Tab shell ─────────────────────────────────────────────────────────────────
const DL_MODULES = [
  { id: 'diagnosis', label: 'Training Failure Diagnosis', icon: '🔴', component: TrainingFailureDiagnosis },
  { id: 'gradient',  label: 'Backprop Debugging',         icon: '📉', component: GradientDebugger },
]

export default function DeepLearningTab() {
  const [active, setActive] = useState('diagnosis')
  const ActiveModule = DL_MODULES.find(m => m.id === active)?.component ?? TrainingFailureDiagnosis

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>Deep Learning</h1>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'rgba(99,102,241,0.12)', color: 'var(--violet)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>New domain</span>
        </div>
        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '600px' }}>
          DL courses teach you to build. This domain teaches you to debug — training failures, serving bottlenecks, fine-tuning tradeoffs. Real telemetry, real decisions.
        </p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {DL_MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${active === m.id ? 'var(--violet)' : 'var(--rim)'}`, background: active === m.id ? 'rgba(99,102,241,0.10)' : 'transparent', color: active === m.id ? 'var(--violet)' : 'var(--ink-low)', fontSize: '13px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Active module */}
      <ActiveModule />

      {/* Roadmap */}
      <div>
        <div className="eyebrow" style={{ marginBottom: '16px' }}>What's being built</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {ROADMAP.map(m => (
            <div key={m.label} className="card" style={{ padding: '16px', opacity: m.status === 'live' ? 1 : 0.6, borderLeft: m.status === 'live' ? '2px solid var(--violet)' : '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '16px' }}>{m.icon}</span>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', fontWeight: 600, color: m.status === 'live' ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{m.label}</span>
                {m.status === 'live' && <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'rgba(52,211,153,0.12)', color: 'var(--mint)', borderRadius: '3px', fontFamily: "'JetBrains Mono',monospace" }}>LIVE</span>}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
