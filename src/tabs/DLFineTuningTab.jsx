import { useState, useMemo } from 'react'

// ── Module 1: Freeze vs Fine-tune vs LoRA ─────────────────────────────────────

const MODEL_SIZES   = ['Small (<1B params)', 'Medium (1B–13B)', 'Large (>13B)']
const TASK_SIMS     = ['Very similar (same domain, same task type)', 'Moderate (same domain, different task)', 'Very different (new domain or task type)']
const DATA_SIZES    = ['Tiny (<1k examples)', 'Small (1k–10k)', 'Medium (10k–100k)', 'Large (>100k)']
const HW_TIERS      = ['Single GPU <24GB VRAM', 'Multi-GPU (2–8)', 'Full cluster']

function getRecommendation(modelSize, taskSim, dataSize, hw) {
  const isLarge  = modelSize === 2
  const isMed    = modelSize === 1
  const simHigh  = taskSim === 0
  const simMed   = taskSim === 1
  const dataTiny = dataSize === 0
  const dataSmall= dataSize === 1
  const dataMed  = dataSize === 2
  const dataLarge= dataSize === 3
  const singleGPU= hw === 0

  if (isLarge && (dataTiny || dataSmall) && singleGPU) {
    return {
      method: 'QLoRA',
      tagline: 'Quantized base + low-rank adapters — the only viable path for 13B+ on consumer hardware',
      color: 'var(--violet)',
      reasons: [
        'Large model (>13B params) exceeds single-GPU VRAM even in fp16 — 4-bit quantization is mandatory.',
        'QLoRA keeps the base frozen in 4-bit NF4 format; only LoRA adapter weights are trained in bf16.',
        'Tiny or small dataset means full fine-tune would catastrophically overfit. Adapters constrain expressivity.',
        'Near-full fine-tune performance at 40% of LoRA\'s already-efficient VRAM footprint.',
      ],
      risk: 'Full fine-tune would OOM immediately on a single GPU. Even if you somehow fit it, tiny data + all-weights update = catastrophic forgetting of pretraining knowledge.',
      code: `from transformers import BitsAndBytesConfig, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",         # NormalFloat4 — best for weights
    bnb_4bit_compute_dtype=torch.bfloat16,
)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-13b-hf",
    quantization_config=bnb_config,
    device_map="auto",
)
model = prepare_model_for_kbit_training(model)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
# trainable params: ~4M / 13B total — 0.03%`,
    }
  }

  if (isLarge && dataMed && !singleGPU) {
    return {
      method: 'LoRA',
      tagline: 'Low-rank adapters on attention weights — best VRAM efficiency, near-full-FT performance',
      color: 'var(--violet)',
      reasons: [
        'Large model benefits from the 0.1–1% trainable parameter count — gradients only flow through adapter matrices.',
        'Medium dataset (10k–100k) is large enough for LoRA to learn task-specific patterns without overfitting.',
        'Multi-GPU setup gives you flexibility; LoRA still trains faster than full fine-tune.',
        'LoRA adapters can be merged into base weights at inference — zero latency overhead.',
      ],
      risk: 'Full fine-tune on a large model with medium data risks catastrophic forgetting of lower layers. You also need significantly more VRAM and longer training time with diminishing returns.',
      code: `from peft import LoraConfig, get_peft_model

config = LoraConfig(
    r=16,                    # rank — higher = more capacity
    lora_alpha=32,           # scaling factor
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)
model = get_peft_model(base_model, config)
model.print_trainable_parameters()
# trainable params: 4,194,304 || all params: 6,738,415,616 || trainable%: 0.06%`,
    }
  }

  if (taskSim !== 2 && (dataTiny || dataSmall) && simMed) {
    return {
      method: 'Prefix Tuning / Adapters',
      tagline: 'Lightweight, task-switchable — ideal when swapping between tasks at inference',
      color: 'var(--sky)',
      reasons: [
        'Moderate task similarity means the base model already has useful representations — minimal updates needed.',
        'Tiny/small data heavily limits how many parameters you can reliably optimize.',
        'Prefix tuning learns virtual tokens prepended to each layer, keeping base weights completely frozen.',
        'Multiple prefixes can be swapped at inference without reloading the base model — efficient multi-task serving.',
      ],
      risk: 'Full fine-tune on tiny data will overfit severely. Even LoRA may overfit if rank is set too high (r > 8) with <1k examples.',
      code: `from peft import PrefixTuningConfig, get_peft_model, TaskType

prefix_config = PrefixTuningConfig(
    task_type=TaskType.SEQ_CLS,
    num_virtual_tokens=20,        # learnable prefix length
    encoder_hidden_size=768,
)
model = get_peft_model(base_model, prefix_config)

# At inference, swap prefixes per task:
# model.set_adapter("task_A")
# model.set_adapter("task_B")`,
    }
  }

  if (simHigh && (dataTiny || dataSmall)) {
    return {
      method: 'Freeze (Head-only)',
      tagline: 'Fine-tune only the classification head — the model already knows the representations',
      color: 'var(--mint)',
      reasons: [
        'Very similar task means the pretrained backbone already extracts the exact features you need.',
        'Tiny/small dataset means updating trunk weights will cause overfitting almost immediately.',
        'Head-only training has far fewer parameters — converges quickly and stably.',
        'Preserves all pretrained knowledge. Zero risk of catastrophic forgetting.',
      ],
      risk: 'Full fine-tune risks overwriting powerful pretrained representations with noise from your tiny dataset. You will likely end up worse than head-only, not better.',
      code: `# Freeze all layers except the classification head
for name, param in model.named_parameters():
    if "classifier" not in name and "head" not in name:
        param.requires_grad = False

# Verify: only head parameters are trainable
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total     = sum(p.numel() for p in model.parameters())
print(f"Trainable: {trainable:,} / {total:,} ({trainable/total:.2%})")

# Only train the head
optimizer = torch.optim.AdamW(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=1e-3,   # higher LR fine for a single linear layer
)`,
    }
  }

  if (taskSim === 2 && dataLarge && hw >= 1) {
    return {
      method: 'Full Fine-tune',
      tagline: 'Update all weights — justified only with large data, very different task, and compute to match',
      color: 'var(--ember)',
      reasons: [
        'Very different task means pretrained representations may not transfer well — you need the whole network to adapt.',
        'Large dataset (>100k examples) provides enough signal to update all weights without catastrophic overfitting.',
        'Multi-GPU or cluster makes the compute cost practical.',
        'Highest performance ceiling — no parameter constraints limiting expressivity.',
      ],
      risk: 'Full fine-tune on anything less than large data with a dissimilar task will destroy pretrained knowledge. The model degrades on the original task AND the new one.',
      code: `# Full fine-tune: all parameters trainable (default)
from transformers import TrainingArguments, Trainer

training_args = TrainingArguments(
    output_dir="./output",
    per_device_train_batch_size=8,
    gradient_accumulation_steps=4,    # effective batch = 32
    learning_rate=2e-5,               # lower than head-only
    num_train_epochs=3,
    warmup_ratio=0.03,
    lr_scheduler_type="cosine",
    fp16=True,
    save_strategy="epoch",
    load_best_model_at_end=True,
)
trainer = Trainer(model=model, args=training_args,
                  train_dataset=train_ds, eval_dataset=val_ds)
trainer.train()`,
    }
  }

  // Default fallback: LoRA is almost always the safe choice
  return {
    method: 'LoRA',
    tagline: 'Low-rank adapters — safe default balancing efficiency and performance',
    color: 'var(--violet)',
    reasons: [
      'LoRA covers most fine-tuning scenarios: good efficiency, strong performance, works on any hardware tier.',
      'Adapter weights can be merged at inference for zero latency overhead.',
      'Much less prone to catastrophic forgetting than full fine-tune.',
      'Easy to experiment with different ranks (r=4 for quick tests, r=64 for max capacity).',
    ],
    risk: 'Full fine-tune is rarely justified unless you have large data, a very dissimilar task, and the compute budget to match.',
    code: `from peft import LoraConfig, get_peft_model

config = LoraConfig(
    r=16,                    # rank — higher = more capacity
    lora_alpha=32,           # scaling factor
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)
model = get_peft_model(base_model, config)
model.print_trainable_parameters()
# trainable params: 4,194,304 || all params: 6,738,415,616 || trainable%: 0.06%`,
  }
}

function FreezeLoRAModule() {
  const [modelSize, setModelSize] = useState(null)
  const [taskSim,   setTaskSim]   = useState(null)
  const [dataSize,  setDataSize]  = useState(null)
  const [hw,        setHw]        = useState(null)
  const [showCode,  setShowCode]  = useState(false)

  const allSet = modelSize !== null && taskSim !== null && dataSize !== null && hw !== null
  const rec    = useMemo(() => allSet ? getRecommendation(modelSize, taskSim, dataSize, hw) : null, [modelSize, taskSim, dataSize, hw, allSet])

  function PillGroup({ label, options, value, onChange }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {options.map((opt, i) => (
            <button key={i} onClick={() => onChange(i)}
              style={{
                padding: '7px 14px', borderRadius: '20px', fontSize: '12px',
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${value === i ? 'var(--violet)' : 'var(--rim)'}`,
                background: value === i ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: value === i ? 'var(--violet)' : 'var(--ink-low)',
                transition: 'all 0.15s',
              }}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Freeze vs Fine-tune vs LoRA
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Set your constraints. Get a ranked recommendation with the reasoning.
        </p>
      </div>

      <div className="card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <PillGroup label="Base model size" options={MODEL_SIZES} value={modelSize} onChange={setModelSize} />
        <PillGroup label="Task similarity to pretraining" options={TASK_SIMS} value={taskSim} onChange={setTaskSim} />
        <PillGroup label="Training data size" options={DATA_SIZES} value={dataSize} onChange={setDataSize} />
        <PillGroup label="Hardware constraint" options={HW_TIERS} value={hw} onChange={setHw} />
      </div>

      {rec && (
        <div className="card animate-slide-up" style={{ padding: '24px', borderLeft: `3px solid ${rec.color}`, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Method badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', padding: '4px 12px', borderRadius: '6px', background: rec.color + '18', color: rec.color, fontWeight: 700, letterSpacing: '0.02em' }}>
              {rec.method}
            </span>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px', color: 'var(--ink-mid)', fontStyle: 'italic' }}>{rec.tagline}</span>
          </div>

          {/* Why it fits */}
          <div>
            <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '10px' }}>Why this fits</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {rec.reasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: rec.color, fontSize: '13px', marginTop: '1px', flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk callout */}
          <div style={{ padding: '14px 16px', background: 'rgba(240,165,0,0.07)', border: '1px solid rgba(240,165,0,0.22)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--ember)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '6px' }}>
              Risk: if you used full fine-tune instead
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{rec.risk}</p>
          </div>

          {/* Code snippet */}
          <div>
            <button onClick={() => setShowCode(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showCode ? '12px' : 0 }}>
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: rec.color, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {showCode ? '▾' : '▸'} Key setup code
              </span>
            </button>
            {showCode && (
              <pre style={{
                background: '#0d0d0f', border: '1px solid var(--rim)', borderRadius: '8px',
                padding: '18px', overflowX: 'auto', margin: 0,
                fontFamily: "'JetBrains Mono',monospace", fontSize: '12px',
                color: '#c9d1d9', lineHeight: 1.7,
              }}>
                {rec.code}
              </pre>
            )}
          </div>
        </div>
      )}

      {!allSet && (
        <div style={{ fontSize: '13px', color: 'var(--ink-low)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
          Set all four parameters above to get your recommendation.
        </div>
      )}
    </div>
  )
}

// ── Module 2: Learning Rate Strategy ─────────────────────────────────────────

const LR_SCENARIOS = [
  {
    id: 'bert_ner',
    setup: 'Fine-tuning BERT-base on a 5k-example NER task from scratch (no pretrained weights). Training for 3 epochs.',
    details: ['Model: BERT-base (110M params)', 'Dataset: 5k examples, NER', 'Epochs: 3', 'Starting from random init'],
    answer: 2,
    explanation: 'Linear warmup + cosine decay is the right call. Without warmup, a cold random-weight model gets destructive gradient updates in the first steps — warmup ramps the LR slowly to prevent this. Cosine decay then smoothly reduces the LR toward the end rather than sharp drops that can destabilize training.',
    note: 'Warmup length: typically 10% of total steps (150 steps for a 1500-step run). Peak LR around 2e-5 for BERT.',
  },
  {
    id: 'llama_ft',
    setup: 'Full fine-tune of LLaMA 7B, 100k instruction examples, 2 epochs. Risk of forgetting early layers.',
    details: ['Model: LLaMA 7B (32 layers)', 'Dataset: 100k instruction examples', 'Risk: catastrophic forgetting of early representations', 'Hardware: 4x A100'],
    answer: 3,
    explanation: 'Layer-wise LR decay (LLRD) is the correct choice. Apply a multiplicative decay of ~0.9x per layer going from the output toward the input — so the final classification layer gets full LR, while early embedding layers get LR × 0.9^32 ≈ 3% of the peak. Earlier layers encode universal representations; they need slower updates.',
    note: 'Common LLRD: lr × decay_rate^(num_layers - layer_idx). Typical decay_rate = 0.8–0.95. Use param_groups in the optimizer, one per layer.',
  },
  {
    id: 'cnn_cifar',
    setup: 'Training a small CNN on CIFAR-100 from scratch, 200 epochs, SGD. Want to escape local minima.',
    details: ['Model: small CNN (~5M params)', 'Dataset: CIFAR-100 (50k train)', 'Optimizer: SGD + momentum 0.9', 'Duration: 200 epochs'],
    answer: 4,
    explanation: '1-cycle LR policy (a form of cyclical LR) is ideal here. On long SGD training runs, a single monotonic LR decay gets stuck in sharp minima. 1-cycle warms up to a high LR, then anneals down — the high-LR phase acts like an annealing step that escapes flat/sharp basins. Classic for ResNet + CIFAR.',
    note: 'PyTorch: torch.optim.lr_scheduler.OneCycleLR. Set max_lr ≈ 0.1 for SGD on CIFAR. The high LR phase is ~30% of total steps.',
  },
  {
    id: 'vit_plateau',
    setup: 'Fine-tuning a vision transformer. Validation loss has plateaued at epoch 8/20.',
    details: ['Model: ViT-Base', 'Epoch 8/20: val loss stopped improving', 'Running on a fixed compute budget', 'No prior knowledge of loss landscape shape'],
    answer: 5,
    explanation: 'Reduce on plateau is the right adaptive choice here. You don\'t know when the loss will start moving again, and a pre-scheduled decay would have already reduced the LR or not at all. ReduceLROnPlateau monitors val loss and cuts LR by a factor (typically 0.5) when improvement stalls for N epochs — exactly matching this scenario.',
    note: 'torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, factor=0.5, patience=2, min_lr=1e-7). Good when the plateau epoch is unknown in advance.',
  },
  {
    id: 'lora_gpt2',
    setup: 'LoRA fine-tuning GPT-2 medium, 2k examples, 5 epochs. Very short training run.',
    details: ['Model: GPT-2 medium (355M) + LoRA adapters', 'Dataset: 2k examples', 'Epochs: 5 (~500 training steps)', 'Only LoRA weights are updated'],
    answer: 1,
    explanation: 'Linear warmup then constant LR is the right call for very short training runs. Warmup covers the first 10% of steps (~50 steps) to prevent early instability. After that, keep LR constant — with only 500 steps, cosine decay would reduce the LR to near-zero before the adapters have converged, cutting the effective training short.',
    note: 'Typical LoRA LR: 1e-4 to 3e-4 (higher than full fine-tune since only adapter weights are updated). Warmup: 5–10% of steps.',
  },
  {
    id: 'domain_pretrain',
    setup: 'Continued pretraining of a domain-adaptive LLM, 1B tokens, 1 epoch. Large dataset, need stability.',
    details: ['Base: GPT-2 style LLM', 'Corpus: 1B tokens, 1 epoch', 'Goal: domain adaptation (medical text)', 'Compute: 8x A100'],
    answer: 2,
    explanation: 'Linear warmup + cosine decay is the standard for pretraining and continued pretraining. Warmup over ~2k steps ramps LR gradually to avoid destroying pretrained weights early. Cosine decay runs for the full 1 epoch, ending at 10% of the peak LR — the smooth decay stabilizes training over the full token count.',
    note: 'Peak LR for continued pretraining should be 10–100x lower than from-scratch pretraining (e.g., 1e-5 vs 6e-4). The base already has knowledge — aggressive LRs erase it.',
  },
  {
    id: 'multitask',
    setup: 'Multi-task fine-tuning: alternating between 3 tasks every epoch. Task loss scales differ significantly.',
    details: ['Tasks: NER (loss ~0.1), QA (loss ~1.2), Classification (loss ~0.4)', 'Alternating per-epoch', 'Risk: dominant task collapse', 'Using a single LR across all tasks'],
    answer: 6,
    explanation: 'Per-task LR (separate param groups) with gradient surgery or manual tuning per loss scale is required. A uniform LR collapses to optimizing the highest-loss task — NER gets undertrained because its low-scale gradients get swamped. Each task needs its own LR scaled to its loss magnitude.',
    note: 'PyTorch: optimizer = Adam([{"params": ner_params, "lr": 3e-5}, {"params": qa_params, "lr": 1e-5}, ...]). Alternatively, normalize each task loss by its running standard deviation (gradient surgery).',
  },
  {
    id: 'recsys',
    setup: 'Training a recommendation model: embedding layers (vocab 500k) and dense layers. Embedding updates are noisy.',
    details: ['Embedding table: 500k × 128 dim', 'Dense layers: 3× MLP on top', 'Batch size: 512', 'Optimizer: Adam'],
    answer: 7,
    explanation: 'Different LR per component — embeddings get 10x lower LR than dense layers. Embedding updates from a vocab-500k table are extremely sparse and noisy: most rows receive zero gradient per batch, and the rows that do receive gradient get large updates relative to how often they fire. Dense layers need higher LR to converge from scratch.',
    note: 'optimizer = Adam([{"params": embedding.parameters(), "lr": 1e-4}, {"params": dense.parameters(), "lr": 1e-3}]). Also consider embedding-specific optimizers like Adagrad for sparse updates.',
  },
]

const LR_OPTIONS = [
  { id: 0, label: 'Constant LR (no scheduler)' },
  { id: 1, label: 'Linear warmup → constant' },
  { id: 2, label: 'Linear warmup → cosine decay' },
  { id: 3, label: 'Layer-wise LR decay (LLRD)' },
  { id: 4, label: 'Cyclical LR / 1-cycle policy' },
  { id: 5, label: 'Reduce on plateau' },
  { id: 6, label: 'Per-task LR (separate param groups)' },
  { id: 7, label: 'Different LR per component (embedding vs dense)' },
]

function LRStrategyModule() {
  const [idx,      setIdx]      = useState(0)
  const [picked,   setPicked]   = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score,    setScore]    = useState({ correct: 0, total: 0 })

  const scenario = LR_SCENARIOS[idx]

  function choose(optId) {
    if (revealed) return
    setPicked(optId)
    setRevealed(true)
    setScore(s => ({ correct: s.correct + (optId === scenario.answer ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx(i => (i + 1) % LR_SCENARIOS.length)
    setPicked(null)
    setRevealed(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Learning Rate Strategy</h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
            Given the training setup, pick the correct LR strategy. Then see the explanation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {LR_SCENARIOS.length}</span>
          {score.total > 0 && (
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', padding: '3px 8px', borderRadius: '5px', background: 'rgba(52,211,153,0.10)', color: 'var(--mint)' }}>
              {score.correct}/{score.total} correct
            </span>
          )}
        </div>
      </div>

      {/* Scenario card */}
      <div className="card" style={{ padding: '22px', borderLeft: '3px solid var(--violet)' }}>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '15px', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.6, margin: '0 0 14px 0' }}>
          {scenario.setup}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {scenario.details.map((d, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: 'var(--ink-mid)', padding: '3px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* Options grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
        {LR_OPTIONS.map(opt => {
          let bg = 'var(--surface)', border = 'var(--rim)', color = 'var(--ink-mid)'
          if (revealed) {
            if (opt.id === scenario.answer) { bg = 'rgba(52,211,153,0.08)'; border = 'var(--mint)'; color = 'var(--mint)' }
            else if (opt.id === picked)     { bg = 'rgba(244,63,94,0.08)';  border = 'var(--rose)'; color = 'var(--rose)' }
          } else if (opt.id === picked) {
            bg = 'rgba(99,102,241,0.08)'; border = 'var(--violet)'; color = 'var(--violet)'
          }
          return (
            <button key={opt.id} onClick={() => choose(opt.id)} disabled={revealed}
              style={{ padding: '11px 14px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontSize: '13px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', lineHeight: 1.4 }}>
              {revealed && opt.id === scenario.answer && '✓ '}
              {revealed && opt.id === picked && opt.id !== scenario.answer && '✗ '}
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Reveal */}
      {revealed && (
        <div className="card animate-slide-up" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '15px', fontWeight: 700, color: picked === scenario.answer ? 'var(--mint)' : 'var(--rose)' }}>
            {picked === scenario.answer ? '✓ Correct — ' : '✗ Wrong — '}{LR_OPTIONS.find(o => o.id === scenario.answer)?.label}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.explanation}</p>
          <div style={{ padding: '12px 14px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--violet)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>Practical note</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0 }}>{scenario.note}</p>
          </div>
          <button className="btn-primary" onClick={next} style={{ alignSelf: 'flex-start' }}>Next scenario →</button>
        </div>
      )}
    </div>
  )
}

// ── Module 3: PEFT Method Comparison ─────────────────────────────────────────

const PEFT_CONSTRAINTS = [
  { id: 'vram',      label: 'Minimize VRAM usage' },
  { id: 'perf',      label: 'Maximize task performance' },
  { id: 'switch',    label: 'Fast task switching at inference' },
  { id: 'speed',     label: 'Minimal training time' },
  { id: 'interp',    label: 'Maximum interpretability / control' },
  { id: 'freeze',    label: 'Avoid modifying model weights entirely' },
]

const PEFT_METHODS = [
  {
    id: 'qlora',
    name: 'QLoRA',
    desc: 'LoRA on 4-bit quantized base. Trainable weights in bf16, base frozen in NF4.',
    trainable: '~0.1–1% (same as LoRA)',
    scores: { vram: 5, perf: 3, switch: 3, speed: 3, interp: 2, freeze: 4 },
    vram: 'Excellent (~40% of LoRA)',
    latency: 'Zero (merge at inference)',
    switching: 'Moderate (swap adapter files)',
    ceiling: 'Good (slight quantization loss)',
    complexity: 'High (requires bitsandbytes)',
  },
  {
    id: 'lora',
    name: 'LoRA',
    desc: 'Low-rank decomposition of attention weight matrices. Merges into base at inference.',
    trainable: '~0.1–1% of params',
    scores: { vram: 4, perf: 4, switch: 3, speed: 4, interp: 3, freeze: 3 },
    vram: 'Good (adapters only)',
    latency: 'Zero (merged)',
    switching: 'Moderate (swap adapter files)',
    ceiling: 'Near full fine-tune',
    complexity: 'Low (just peft library)',
  },
  {
    id: 'prefix',
    name: 'Prefix Tuning',
    desc: 'Learnable prefix tokens prepended to each layer\'s KV cache. Base frozen completely.',
    trainable: '~0.01%',
    scores: { vram: 4, perf: 2, switch: 5, speed: 4, interp: 3, freeze: 5 },
    vram: 'Excellent',
    latency: 'Small (prefix in KV cache)',
    switching: 'Excellent (swap prefix tensors)',
    ceiling: 'Moderate',
    complexity: 'Low',
  },
  {
    id: 'adapter',
    name: 'Adapter Layers',
    desc: 'Small bottleneck MLP inserted between transformer sublayers. Modular and composable.',
    trainable: '1–4% of params',
    scores: { vram: 3, perf: 4, switch: 4, speed: 3, interp: 5, freeze: 4 },
    vram: 'Good',
    latency: 'Moderate (extra forward pass per layer)',
    switching: 'Good (plug-in modules)',
    ceiling: 'Good',
    complexity: 'Moderate',
  },
  {
    id: 'prompt',
    name: 'Prompt Tuning',
    desc: 'Learnable soft prompt tokens only. No weight changes at all. Competitive only at very large scale (>10B params).',
    trainable: '<0.01%',
    scores: { vram: 5, perf: 1, switch: 5, speed: 5, interp: 2, freeze: 5 },
    vram: 'Minimal',
    latency: 'Minimal',
    switching: 'Excellent (just swap prompt vectors)',
    ceiling: 'Low-moderate (needs >10B to shine)',
    complexity: 'Minimal',
  },
  {
    id: 'full',
    name: 'Full Fine-tune',
    desc: 'Update all weights. No constraints. Best performance ceiling but worst VRAM and training time.',
    trainable: '100%',
    scores: { vram: 1, perf: 5, switch: 1, speed: 1, interp: 4, freeze: 1 },
    vram: 'Worst (full fp32/fp16)',
    latency: 'Zero (no extra modules)',
    switching: 'None (need separate model copy)',
    ceiling: 'Best',
    complexity: 'Minimal (standard training)',
  },
]

const SCORE_LABELS = ['', '✗', '△', '◇', '✓', '✓✓']
const SCORE_COLORS = ['', 'var(--rose)', 'var(--ember)', 'var(--ink-low)', 'var(--mint)', 'var(--mint)']

function PEFTComparisonModule() {
  const [constraint, setConstraint] = useState(null)

  const ranked = useMemo(() => {
    if (!constraint) return PEFT_METHODS
    return [...PEFT_METHODS].sort((a, b) => b.scores[constraint] - a.scores[constraint])
  }, [constraint])

  const topScore = constraint ? Math.max(...ranked.map(m => m.scores[constraint])) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.02em', marginBottom: '4px' }}>PEFT Method Comparison</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Pick your primary constraint. Methods are reranked. Feature matrix in mono for quick scanning.
        </p>
      </div>

      {/* Constraint selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '11px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Primary constraint</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {PEFT_CONSTRAINTS.map(c => (
            <button key={c.id} onClick={() => setConstraint(c.id)}
              style={{
                padding: '7px 16px', borderRadius: '20px', fontSize: '13px',
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${constraint === c.id ? 'var(--violet)' : 'var(--rim)'}`,
                background: constraint === c.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: constraint === c.id ? 'var(--violet)' : 'var(--ink-low)',
                transition: 'all 0.15s',
              }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Method cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ranked.map((method, rank) => {
          const isTop    = constraint && method.scores[constraint] === topScore
          const accent   = isTop ? 'var(--violet)' : 'var(--rim)'
          const bgBoost  = isTop ? 'rgba(99,102,241,0.04)' : 'transparent'
          return (
            <div key={method.id} className="card" style={{ padding: '18px 20px', borderLeft: `3px solid ${accent}`, background: bgBoost, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                {/* Rank + name */}
                <div style={{ minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {constraint && (
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: isTop ? 'var(--violet)' : 'var(--ink-low)', fontWeight: 700 }}>#{rank + 1}</span>
                    )}
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '15px', fontWeight: 700, color: isTop ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{method.name}</span>
                    {isTop && <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(99,102,241,0.15)', color: 'var(--violet)', borderRadius: '4px', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>BEST FIT</span>}
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)' }}>Trainable: {method.trainable}</span>
                </div>

                {/* Description */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.6, margin: 0 }}>{method.desc}</p>
                </div>

                {/* Feature matrix */}
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)', display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '220px' }}>
                  {[
                    ['VRAM',        method.vram],
                    ['Latency',     method.latency],
                    ['Task switch', method.switching],
                    ['Perf ceil.',  method.ceiling],
                    ['Complexity',  method.complexity],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ width: '76px', color: 'var(--ink-low)', flexShrink: 0 }}>{k}</span>
                      <span style={{ color: 'var(--ink-mid)' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Score for selected constraint */}
                {constraint && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '48px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', color: SCORE_COLORS[method.scores[constraint]], fontWeight: 700 }}>
                      {SCORE_LABELS[method.scores[constraint]]}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', color: 'var(--ink-low)' }}>{method.scores[constraint]}/5</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!constraint && (
        <div style={{ fontSize: '13px', color: 'var(--ink-low)', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
          Select a constraint above to rank methods and highlight the best fit.
        </div>
      )}
    </div>
  )
}

// ── Tab shell ─────────────────────────────────────────────────────────────────

const FT_MODULES = [
  { id: 'freeze', label: 'Freeze vs LoRA',  icon: '🧊', component: FreezeLoRAModule },
  { id: 'lr',     label: 'LR Strategy',     icon: '📉', component: LRStrategyModule },
  { id: 'peft',   label: 'PEFT Comparison', icon: '⚡', component: PEFTComparisonModule },
]

export default function DLFineTuningTab() {
  const [active, setActive] = useState('freeze')
  const ActiveModule = FT_MODULES.find(m => m.id === active)?.component ?? FreezeLoRAModule

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.04em', margin: 0 }}>Fine-tuning & Adaptation</h1>
          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '5px', background: 'rgba(99,102,241,0.12)', color: 'var(--violet)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>DL</span>
        </div>
        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '680px', margin: 0 }}>
          Full fine-tune when you shouldn't, LoRA when you don't need to, freeze when you need to update — these are the real mistakes. Make the right call from constraints.
        </p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {FT_MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
              border: `1px solid ${active === m.id ? 'var(--violet)' : 'var(--rim)'}`,
              background: active === m.id ? 'rgba(99,102,241,0.10)' : 'transparent',
              color: active === m.id ? 'var(--violet)' : 'var(--ink-low)',
              fontSize: '13px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 500,
            }}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Active module */}
      <ActiveModule />

    </div>
  )
}
