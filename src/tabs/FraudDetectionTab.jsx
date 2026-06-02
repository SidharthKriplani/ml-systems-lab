import { useState } from 'react'
import PythonCell from '../components/PythonCell.jsx'

// ─── LocalStorage key ─────────────────────────────────────────────────────────
const LS_KEY = 'msl_projectlab_fraud_data'

// ─── Checkpoint data ──────────────────────────────────────────────────────────
const CHECKPOINT_F1 = {
  id: 'cpF1',
  question: 'Your fraud detection model is trained on 10,000 transactions with 50 fraud cases (0.5% positive rate). On the held-out test set, you observe: accuracy=99.3%, AUC=0.91, F1=0.48 (at 0.5 threshold), precision@100=0.62. Your fraud operations team can review 100 flagged transactions per day. Which metric should drive your model selection and threshold decision?',
  options: [
    { id: 'a', text: 'AUC — it measures ranking quality across all thresholds and is robust to class imbalance. AUC=0.91 is strong and is the correct metric for model comparison.' },
    { id: 'b', text: 'Accuracy — 99.3% is the standard business metric and shows the model is performing well overall.' },
    { id: 'c', text: "Precision@K where K=100 (your team's daily review capacity). At K=100, 62% of flagged transactions are real fraud — that is the metric that directly measures whether your analysts's time is being used effectively. AUC guides model selection; precision@K drives the operational threshold." },
    { id: 'd', text: 'F1 at 0.5 threshold — it balances precision and recall and is the standard binary classification metric for imbalanced datasets.' },
  ],
  correct: 'c',
  explanation: "At 0.5% positive rate, accuracy is meaningless — predicting all negative gives 99.5% accuracy. AUC=0.91 is a good model selection metric (it measures ranking quality regardless of threshold) but it does not determine the operating threshold. F1 at 0.5 is arbitrary — 0.5 is not the right threshold for a 1:200 imbalance. The correct operational metric is precision@K, where K is the team's review capacity (100 transactions/day). Precision@100=0.62 means 62 of the 100 flagged transactions are real fraud — that directly measures analyst efficiency. If precision@K is too low, analysts waste time on false positives and lose trust in the model. The correct workflow: use AUC to select the best model architecture, then choose the threshold that maximises precision@K given the team's review capacity. Recall is a secondary concern — you can catch more fraud by lowering the threshold, but only if the team can handle the increased review volume.",
}

// ─── Cell code strings ────────────────────────────────────────────────────────
const CELL_F1_CODE = `# Cell 1 — Fraud Detection: Schema Inspection
# Extreme class imbalance: 0.5% fraud rate (50 fraud in 10,000 transactions)
# Context: fraud operations team reviews flagged transactions manually.
# Key constraint: team capacity = 100 transactions/day.

import numpy as np
import pandas as pd

np.random.seed(42)
n = 10000
n_fraud = 50  # 0.5% positive rate

# Non-fraud transactions (99.5%)
amount_legit    = np.random.lognormal(mean=3.5, sigma=1.2, size=n-n_fraud).clip(1, 5000).round(2)
merchant_legit  = np.random.choice(['grocery','restaurant','gas','online','travel'], n-n_fraud, p=[0.30,0.22,0.18,0.20,0.10])
hour_legit      = np.random.choice(range(24), n-n_fraud, p=[0.02]*6 + [0.04]*3 + [0.08]*6 + [0.06]*6 + [0.04]*3)
tenure_legit    = np.random.exponential(400, n-n_fraud).clip(1, 3000).round().astype(int)
intl_legit      = np.random.binomial(1, 0.08, n-n_fraud)
fp_age_legit    = np.random.exponential(180, n-n_fraud).clip(1, 1000).round().astype(int)

# Fraud transactions (0.5%) — higher amounts, more international, newer devices, late hours
amount_fraud    = np.random.lognormal(mean=5.2, sigma=0.9, size=n_fraud).clip(50, 8000).round(2)
merchant_fraud  = np.random.choice(['grocery','restaurant','gas','online','travel'], n_fraud, p=[0.05,0.05,0.10,0.50,0.30])
hour_fraud      = np.random.choice(range(24), n_fraud, p=[0.10]*6 + [0.02]*3 + [0.03]*6 + [0.03]*6 + [0.08]*3)
tenure_fraud    = np.random.exponential(60, n_fraud).clip(1, 500).round().astype(int)
intl_fraud      = np.random.binomial(1, 0.55, n_fraud)
fp_age_fraud    = np.random.exponential(15, n_fraud).clip(1, 200).round().astype(int)

df = pd.DataFrame({
    'amount':                np.concatenate([amount_legit,   amount_fraud]),
    'merchant_category':     np.concatenate([merchant_legit, merchant_fraud]),
    'hour_of_day':           np.concatenate([hour_legit,     hour_fraud]),
    'user_tenure_days':      np.concatenate([tenure_legit,   tenure_fraud]),
    'is_international':      np.concatenate([intl_legit,     intl_fraud]),
    'device_fingerprint_age':np.concatenate([fp_age_legit,   fp_age_fraud]),
    'fraud':                 np.concatenate([np.zeros(n-n_fraud), np.ones(n_fraud)]).astype(int),
})
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

print("=" * 60)
print("FRAUD DETECTION — SCHEMA INSPECTION")
print("=" * 60)
print(f"Shape: {df.shape[0]:,} rows x {df.shape[1]} columns")
print()

print("--- Dtypes ---")
for col, dtype in df.dtypes.items():
    print(f"  {col:<26} {str(dtype)}")

print()
print("--- Class distribution ---")
n_f = df['fraud'].sum()
n_t = len(df)
print(f"  Fraud (1):    {n_f:5d} ({100*n_f/n_t:.2f}%)")
print(f"  Legit (0): {n_t-n_f:7,} ({100*(n_t-n_f)/n_t:.2f}%)")
print(f"  Ratio:        1 : {(n_t-n_f)//n_f}")
print()
print("--- Imbalance implications ---")
print("  Positive rate = 0.5%. Predicting ALL transactions as")
print("  legitimate gives accuracy = 99.5% — a useless baseline.")
print()
print("  Standard metrics to AVOID at this imbalance:")
print("  * Accuracy: always misleadingly high")
print("  * F1 at 0.5 threshold: arbitrary threshold, not operationally meaningful")
print()
print("  Metrics to USE:")
print("  * AUC: ranking quality, threshold-independent, good for model selection")
print("  * Precision@K: where K = team review capacity (100/day)")
print("    'Of the top K transactions we flag, what fraction are real fraud?'")
print("  * Recall@FPR: how many fraud cases we catch at a given false positive rate")
`

const CELL_F2_CODE = `# Cell 2 — Fraud Detection: EDA
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

np.random.seed(42)
n = 10000
n_fraud = 50
amount_legit    = np.random.lognormal(mean=3.5, sigma=1.2, size=n-n_fraud).clip(1, 5000).round(2)
merchant_legit  = np.random.choice(['grocery','restaurant','gas','online','travel'], n-n_fraud, p=[0.30,0.22,0.18,0.20,0.10])
hour_legit      = np.random.choice(range(24), n-n_fraud, p=[0.02]*6 + [0.04]*3 + [0.08]*6 + [0.06]*6 + [0.04]*3)
tenure_legit    = np.random.exponential(400, n-n_fraud).clip(1, 3000).round().astype(int)
intl_legit      = np.random.binomial(1, 0.08, n-n_fraud)
fp_age_legit    = np.random.exponential(180, n-n_fraud).clip(1, 1000).round().astype(int)
amount_fraud    = np.random.lognormal(mean=5.2, sigma=0.9, size=n_fraud).clip(50, 8000).round(2)
merchant_fraud  = np.random.choice(['grocery','restaurant','gas','online','travel'], n_fraud, p=[0.05,0.05,0.10,0.50,0.30])
hour_fraud      = np.random.choice(range(24), n_fraud, p=[0.10]*6 + [0.02]*3 + [0.03]*6 + [0.03]*6 + [0.08]*3)
tenure_fraud    = np.random.exponential(60, n_fraud).clip(1, 500).round().astype(int)
intl_fraud      = np.random.binomial(1, 0.55, n_fraud)
fp_age_fraud    = np.random.exponential(15, n_fraud).clip(1, 200).round().astype(int)

df = pd.DataFrame({
    'amount': np.concatenate([amount_legit, amount_fraud]),
    'merchant_category': np.concatenate([merchant_legit, merchant_fraud]),
    'hour_of_day': np.concatenate([hour_legit, hour_fraud]),
    'user_tenure_days': np.concatenate([tenure_legit, tenure_fraud]),
    'is_international': np.concatenate([intl_legit, intl_fraud]),
    'device_fingerprint_age': np.concatenate([fp_age_legit, fp_age_fraud]),
    'fraud': np.concatenate([np.zeros(n-n_fraud), np.ones(n_fraud)]).astype(int),
})

fraud = df[df['fraud']==1]
legit = df[df['fraud']==0]

fig = plt.figure(figsize=(13, 8))
gs  = gridspec.GridSpec(2, 3, figure=fig, hspace=0.45, wspace=0.38)

# Transaction amount distribution
ax1 = fig.add_subplot(gs[0, 0])
ax1.hist(np.log1p(legit['amount']), bins=30, alpha=0.7, color='#6b7280', label='Legit', edgecolor='none')
ax1.hist(np.log1p(fraud['amount']), bins=20, alpha=0.9, color='#f0a500', label='Fraud', edgecolor='none')
ax1.set_title('Transaction Amount (log)', fontsize=11, fontweight='bold')
ax1.set_xlabel('log(1 + amount)', fontsize=9)
ax1.legend(fontsize=8); ax1.grid(True, alpha=0.2)

# Fraud rate by merchant category
ax2 = fig.add_subplot(gs[0, 1])
mc_rate = df.groupby('merchant_category')['fraud'].mean() * 100
mc_rate_sorted = mc_rate.sort_values(ascending=True)
ax2.barh(mc_rate_sorted.index, mc_rate_sorted.values, color='#f0a500', alpha=0.85, edgecolor='none')
ax2.set_title('Fraud Rate by Merchant', fontsize=11, fontweight='bold')
ax2.set_xlabel('Fraud rate (%)', fontsize=9)
ax2.grid(True, alpha=0.2, axis='x')

# Hour of day
ax3 = fig.add_subplot(gs[0, 2])
hour_rate = df.groupby('hour_of_day')['fraud'].mean() * 100
ax3.bar(hour_rate.index, hour_rate.values, color='#f0a500', alpha=0.85, edgecolor='none')
ax3.set_title('Fraud Rate by Hour', fontsize=11, fontweight='bold')
ax3.set_xlabel('Hour of day (24h)', fontsize=9)
ax3.set_ylabel('Fraud rate (%)', fontsize=9)
ax3.grid(True, alpha=0.2, axis='y')

# International vs domestic
ax4 = fig.add_subplot(gs[1, 0])
intl_rate = df.groupby('is_international')['fraud'].mean() * 100
ax4.bar(['Domestic', 'International'], intl_rate.values, color=['#6b7280','#f0a500'], alpha=0.85, edgecolor='none')
ax4.set_title('Fraud Rate: Intl vs Domestic', fontsize=11, fontweight='bold')
ax4.set_ylabel('Fraud rate (%)', fontsize=9)
for i, v in enumerate(intl_rate.values):
    ax4.text(i, v+0.02, f'{v:.2f}%', ha='center', fontsize=10)
ax4.grid(True, alpha=0.2, axis='y')

# User tenure
ax5 = fig.add_subplot(gs[1, 1])
ax5.hist(legit['user_tenure_days'].clip(0, 800), bins=30, alpha=0.7, color='#6b7280', label='Legit', edgecolor='none')
ax5.hist(fraud['user_tenure_days'].clip(0, 800), bins=15, alpha=0.9, color='#f0a500', label='Fraud', edgecolor='none')
ax5.set_title('User Tenure (days)', fontsize=11, fontweight='bold')
ax5.set_xlabel('Days since account created', fontsize=9)
ax5.legend(fontsize=8); ax5.grid(True, alpha=0.2)

# Device fingerprint age
ax6 = fig.add_subplot(gs[1, 2])
ax6.hist(legit['device_fingerprint_age'].clip(0, 400), bins=30, alpha=0.7, color='#6b7280', label='Legit', edgecolor='none')
ax6.hist(fraud['device_fingerprint_age'].clip(0, 400), bins=15, alpha=0.9, color='#f0a500', label='Fraud', edgecolor='none')
ax6.set_title('Device Fingerprint Age (days)', fontsize=11, fontweight='bold')
ax6.set_xlabel('Days device seen before', fontsize=9)
ax6.legend(fontsize=8); ax6.grid(True, alpha=0.2)

plt.tight_layout()
plt.show()

print("--- Key signals ---")
print(f"  International fraud rate:  {df[df['is_international']==1]['fraud'].mean()*100:.2f}%")
print(f"  Domestic fraud rate:       {df[df['is_international']==0]['fraud'].mean()*100:.2f}%")
print(f"  Fraud median amount:       ${fraud['amount'].median():.0f}")
print(f"  Legit median amount:       ${legit['amount'].median():.0f}")
print(f"  Fraud median tenure:       {fraud['user_tenure_days'].median():.0f} days")
print(f"  Legit median tenure:       {legit['user_tenure_days'].median():.0f} days")
print()
print("--- What this tells you ---")
print("  Fraud skews toward: international, high amount, new accounts,")
print("  new devices, late hours, online/travel merchants.")
print("  These are the rule-based signals that existed BEFORE ML.")
print("  The model's value is in combining weak signals that individually")
print("  have too many false positives to use as hard rules.")
`

const CELL_F3_CODE = `# Cell 3 — Fraud Detection: Imbalance Strategies + Precision@K
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score

np.random.seed(42)
n = 10000
n_fraud = 50
amount_legit    = np.random.lognormal(mean=3.5, sigma=1.2, size=n-n_fraud).clip(1, 5000).round(2)
merchant_legit  = np.random.choice([0,1,2,3,4], n-n_fraud, p=[0.30,0.22,0.18,0.20,0.10])
hour_legit      = np.random.choice(range(24), n-n_fraud, p=[0.02]*6+[0.04]*3+[0.08]*6+[0.06]*6+[0.04]*3)
tenure_legit    = np.random.exponential(400, n-n_fraud).clip(1, 3000).round().astype(int)
intl_legit      = np.random.binomial(1, 0.08, n-n_fraud)
fp_age_legit    = np.random.exponential(180, n-n_fraud).clip(1, 1000).round().astype(int)
amount_fraud    = np.random.lognormal(mean=5.2, sigma=0.9, size=n_fraud).clip(50, 8000).round(2)
merchant_fraud  = np.random.choice([0,1,2,3,4], n_fraud, p=[0.05,0.05,0.10,0.50,0.30])
hour_fraud      = np.random.choice(range(24), n_fraud, p=[0.10]*6+[0.02]*3+[0.03]*6+[0.03]*6+[0.08]*3)
tenure_fraud    = np.random.exponential(60, n_fraud).clip(1, 500).round().astype(int)
intl_fraud      = np.random.binomial(1, 0.55, n_fraud)
fp_age_fraud    = np.random.exponential(15, n_fraud).clip(1, 200).round().astype(int)

X = np.column_stack([
    np.concatenate([amount_legit,   amount_fraud]),
    np.concatenate([merchant_legit, merchant_fraud]),
    np.concatenate([hour_legit,     hour_fraud]),
    np.concatenate([tenure_legit,   tenure_fraud]),
    np.concatenate([intl_legit,     intl_fraud]),
    np.concatenate([fp_age_legit,   fp_age_fraud]),
])
y = np.concatenate([np.zeros(n-n_fraud), np.ones(n_fraud)]).astype(int)

idx = np.random.permutation(n)
X, y = X[idx], y[idx]

X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_val_s   = scaler.transform(X_val)

def precision_at_k(y_true, scores, k=100):
    top_k = np.argsort(scores)[::-1][:k]
    return y_true[top_k].sum() / k

models = [
    ('LogisticRegression', LogisticRegression(class_weight='balanced', max_iter=500, random_state=42), True),
    ('RandomForest',       RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42), False),
    ('GradientBoosting',   GradientBoostingClassifier(n_estimators=100, random_state=42), False),
]

print("=" * 72)
print("FRAUD DETECTION — MODEL COMPARISON (imbalance: 1:200)")
print("=" * 72)
print(f"  {'Model':<22}  {'Val AUC':>8}  {'P@50':>7}  {'P@100':>7}  {'P@200':>7}")
print("  " + "-"*64)

for name, clf, needs_scale in models:
    Xtr = X_train_s if needs_scale else X_train
    Xv  = X_val_s   if needs_scale else X_val
    clf.fit(Xtr, y_train)
    proba = clf.predict_proba(Xv)[:, 1]
    auc   = roc_auc_score(y_val, proba)
    p50   = precision_at_k(y_val, proba, k=50)
    p100  = precision_at_k(y_val, proba, k=100)
    p200  = precision_at_k(y_val, proba, k=200)
    print(f"  {name:<22}  {auc:>8.4f}  {p50:>7.3f}  {p100:>7.3f}  {p200:>7.3f}")

print()
print("--- Reading precision@K ---")
print("  P@50  = of the 50 highest-scored transactions, what fraction are fraud?")
print("  P@100 = same for top 100 (team review capacity per day)")
print("  P@200 = same for top 200")
print()
print("  High AUC + low P@K: model ranks well globally but")
print("  top predictions are contaminated with false positives.")
print("  At 1:200 imbalance, this is the key operational gap.")
print()
print("--- Why class_weight alone is insufficient at 1:200 ---")
print("  class_weight='balanced' upweights each fraud case by ~200x.")
print("  This helps recall but can hurt precision@K -- the model may")
print("  flag too many borderline transactions to fill the top-K list.")
print("  Production fraud systems often combine class_weight with")
print("  a custom threshold tuned to the team's review capacity.")
`

// ─── JudgmentCheckpoint component ────────────────────────────────────────────
function JudgmentCheckpoint({ checkpoint, onComplete }) {
  const [picked, setPicked]     = useState(null)
  const [revealed, setRevealed] = useState(false)

  const isCorrect = picked === checkpoint.correct

  function handleReveal() {
    if (!picked) return
    setRevealed(true)
    if (isCorrect) onComplete?.()
  }

  return (
    <div style={{
      border: `1px solid ${revealed ? (isCorrect ? 'rgba(52,211,153,0.35)' : 'rgba(244,63,94,0.35)') : 'var(--rim)'}`,
      borderLeft: `3px solid ${revealed ? (isCorrect ? 'var(--mint)' : 'var(--rose)') : 'var(--prime)'}`,
      borderRadius: '10px',
      background: revealed
        ? (isCorrect ? 'rgba(52,211,153,0.06)' : 'rgba(244,63,94,0.06)')
        : 'rgba(240,165,0,0.04)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--rim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', fontWeight: 700 }}>
            Judgment Checkpoint
          </span>
          {revealed && (
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isCorrect ? 'var(--mint)' : 'var(--rose)', marginLeft: '4px' }}>
              {isCorrect ? '✓ Correct' : '✗ See explanation'}
            </span>
          )}
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-hi)', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
          {checkpoint.question}
        </p>
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {checkpoint.options.map(opt => {
          const isSelected   = picked === opt.id
          const isCorrectOpt = opt.id === checkpoint.correct
          let bg = 'transparent', borderCol = 'var(--rim)', textCol = 'var(--ink-mid)'

          if (revealed) {
            if (isCorrectOpt)        { bg = 'rgba(52,211,153,0.10)'; borderCol = 'rgba(52,211,153,0.45)'; textCol = 'var(--ink-hi)' }
            else if (isSelected)     { bg = 'rgba(244,63,94,0.10)';  borderCol = 'rgba(244,63,94,0.40)';  textCol = 'var(--ink-mid)' }
          } else if (isSelected) {
            bg = 'rgba(240,165,0,0.10)'; borderCol = 'rgba(240,165,0,0.50)'; textCol = 'var(--ink-hi)'
          }

          return (
            <button
              key={opt.id}
              className="msl-option-btn"
              disabled={revealed}
              onClick={() => { if (!revealed) setPicked(opt.id) }}
              style={{
                textAlign: 'left', padding: '11px 14px',
                background: bg,
                border: `1px solid ${borderCol}`,
                borderRadius: '7px',
                cursor: revealed ? 'default' : 'pointer',
                transition: 'all 0.15s',
                color: textCol,
                fontSize: '13px', lineHeight: 1.55,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-ghost)', marginRight: '8px' }}>
                {opt.id.toUpperCase()}.
              </span>
              {opt.text}
              {revealed && isCorrectOpt && <span style={{ marginLeft: '8px', color: 'var(--mint)', fontSize: '12px' }}>✓</span>}
              {revealed && isSelected && !isCorrectOpt && <span style={{ marginLeft: '8px', color: 'var(--rose)', fontSize: '12px' }}>✗</span>}
            </button>
          )
        })}
      </div>

      {!revealed && picked && (
        <div style={{ padding: '0 18px 16px' }}>
          <button
            onClick={handleReveal}
            style={{
              background: 'var(--prime)', color: '#000',
              border: 'none', borderRadius: '7px',
              padding: '9px 20px', fontSize: '13px',
              fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            See explanation →
          </button>
        </div>
      )}

      {revealed && (
        <div className="msl-reveal-panel animate-slide-up" style={{ margin: '0 18px 16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--prime)', marginBottom: '8px', fontWeight: 700 }}>
            Production reasoning
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
            {checkpoint.explanation}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function FraudDetectionTab({ onNavigate }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return { cellsDone: [], checkpointsDone: [] }
  })

  function markCellDone(cellId) {
    setState(prev => {
      if (prev.cellsDone.includes(cellId)) return prev
      const next = { ...prev, cellsDone: [...prev.cellsDone, cellId] }
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function markCheckpointDone(cpId) {
    setState(prev => {
      if (prev.checkpointsDone.includes(cpId)) return prev
      const next = { ...prev, checkpointsDone: [...prev.checkpointsDone, cpId] }
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  // Phase 1: 3 cells + 1 checkpoint = 4 steps
  const phase1TotalSteps = 4
  const phase1DoneSteps  =
    ['fraud_cell1', 'fraud_cell2', 'fraud_cell3'].filter(c => state.cellsDone.includes(c)).length +
    ['cpF1'].filter(c => state.checkpointsDone.includes(c)).length

  const phase1Complete = phase1DoneSteps === phase1TotalSteps

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px 80px', display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
            ML Engineering
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
            Phase 1 of 4
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
            ✓ Real execution
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900,
          letterSpacing: '-0.05em', marginBottom: '10px', lineHeight: 1.1,
          background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Project Lab — Fraud Detection
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
          10,000-transaction fraud dataset with 0.5% positive rate (50 fraud cases). Standard metrics fail at this imbalance. The key judgment: which metric drives the operating threshold for a team that can review 100 transactions per day?
        </p>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px', maxWidth: '400px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Phase 1 progress</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ width: `${Math.round((phase1DoneSteps / phase1TotalSteps) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 8px rgba(240,165,0,0.5)' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{phase1DoneSteps}/{phase1TotalSteps}</span>
        </div>
      </div>

      {/* ── Dataset context card ── */}
      <div style={{ border: '1px solid var(--rim)', borderRadius: '10px', padding: '16px 18px', background: 'rgba(240,165,0,0.04)', marginBottom: '32px', borderLeft: '3px solid var(--prime)' }}>
        <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Dataset — Synthetic Transaction Fraud</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
          Synthetic 10,000-row transaction dataset. 6 features: transaction amount, merchant category, hour of day, user account tenure, international flag, device fingerprint age.
          Target: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--depth)', padding: '1px 5px', borderRadius: '3px' }}>fraud</code> (0.5% positive rate, 50 fraud in 10,000). Imbalance ratio 1:200.
          Constraint: fraud operations team reviews 100 flagged transactions per day.
        </p>
      </div>

      {/* ── Cell F1 — Schema Inspection ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('fraud_cell1') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('fraud_cell1') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell1') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('fraud_cell1') ? '✓' : '1'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Schema Inspection</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>dtypes · extreme 1:200 imbalance · why accuracy fails · precision@K framing</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_F1_CODE}
          height={200}
          label="Cell 1 — Schema"
          onResult={r => { if (r.ok) markCellDone('fraud_cell1') }}
        />
      </div>

      {/* ── Cell F2 — EDA ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('fraud_cell2') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('fraud_cell2') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell2') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('fraud_cell2') ? '✓' : '2'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>EDA</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>fraud signals by merchant, hour, country · amount distribution · tenure vs device age</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_F2_CODE}
          height={200}
          withPlot={true}
          label="Cell 2 — EDA"
          onResult={r => { if (r.ok) markCellDone('fraud_cell2') }}
        />
      </div>

      {/* ── Cell F3 — Imbalance Strategies + Precision@K ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('fraud_cell3') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('fraud_cell3') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell3') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('fraud_cell3') ? '✓' : '3'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Imbalance Strategies + Precision@K</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>AUC vs P@50/100/200 · class_weight at 1:200 · operational threshold framing</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_F3_CODE}
          height={200}
          label="Cell 3 — Imbalance + P@K"
          onResult={r => { if (r.ok) markCellDone('fraud_cell3') }}
        />
      </div>

      {/* ── Checkpoint F1 ── */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.checkpointsDone.includes('cpF1') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
            border: `1px solid ${state.checkpointsDone.includes('cpF1') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cpF1') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.checkpointsDone.includes('cpF1') ? '✓' : '?'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Which Metric Drives Deployment?</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>accuracy=99.3%, AUC=0.91, F1=0.48, precision@100=0.62 — what do you optimise?</div>
          </div>
        </div>
        <JudgmentCheckpoint
          checkpoint={CHECKPOINT_F1}
          onComplete={() => markCheckpointDone('cpF1')}
        />
      </div>

      {/* ── Phase 1 complete callout ── */}
      {phase1Complete && (
        <div className="card animate-slide-up" style={{ padding: '20px 22px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.30)', borderLeft: '3px solid var(--prime)', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', marginBottom: '8px', fontWeight: 700 }}>
            Phase 1 Complete
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: '0 0 12px' }}>
            You have run schema inspection, EDA on fraud signals, evaluated imbalance strategies, and made the precision@K judgment. Phase 2 (Model Training + SMOTE) is coming next.
          </p>
          <button
            onClick={() => { try { localStorage.removeItem(LS_KEY) } catch {} setState({ cellsDone: [], checkpointsDone: [] }) }}
            style={{ fontSize: '12px', color: 'var(--ink-low)', background: 'none', border: '1px solid var(--rim)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            Reset notebook
          </button>
        </div>
      )}

      {/* ── Roadmap: Phases 2–4 ── */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-ghost)', marginBottom: '14px', fontWeight: 700 }}>
          Phases ahead
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { phase: 'Phase 2', label: 'Model Training + SMOTE', desc: 'XGBoost vs LogisticRegression · SMOTE vs class_weight at 1:200 · precision-recall tradeoff at operational K' },
            { phase: 'Phase 3', label: 'Monitoring + Alert Thresholds', desc: 'Precision@K drift detection · false positive rate alerts · analyst queue overflow detection' },
            { phase: 'Phase 4', label: 'Deployment + Ops Runbook', desc: 'Batch scoring pipeline · score explanation for analyst UI · escalation rules · model card' },
          ].map(item => (
            <div key={item.phase} style={{ padding: '14px 16px', border: '1px solid var(--rim)', borderRadius: '9px', background: 'transparent', opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.phase}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)' }}>{item.label}</span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', marginLeft: 'auto' }}>coming soon</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', margin: 0, lineHeight: 1.55, fontFamily: 'var(--font-sans)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
