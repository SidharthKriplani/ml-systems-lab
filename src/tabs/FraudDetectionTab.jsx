import { useState } from 'react'
import { CheckMark, CrossMark, WarningMark } from '../components/Icons'
import PythonCell from '../components/PythonCell.jsx'
import FidelityBadge from '../components/FidelityBadge.jsx'

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
print(f"  Fraud median amount:       \${fraud['amount'].median():.0f}")
print(f"  Legit median amount:       \${legit['amount'].median():.0f}")
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

// ─── Phase 2 cell codes ──────────────────────────────────────────────────────
const CHECKPOINT_F2 = {
  id: 'cpF2',
  question: 'You evaluate two imbalance strategies on your fraud model. GBC with class_weight="balanced": AUC=0.93, Precision@100=0.64 (64 of top 100 are fraud). GBC with SMOTE on training set only: AUC=0.91, Precision@100=0.71 (71 of top 100 are fraud). Your fraud operations team can review 100 transactions per day. Which model do you deploy to production?',
  options: [
    { id: 'a', text: 'class_weight model (AUC=0.93). AUC is the standard ML metric for comparing models, and 0.93 is excellent. Higher AUC always means better model performance.' },
    { id: 'b', text: 'SMOTE model (AUC=0.91, P@100=0.71). Although AUC is slightly lower, Precision@100 is 7 percentage points higher. Given the team reviews 100/day, the extra 7 flagged transactions per day that are true fraud directly translates to 7 more caught cases — that is the operational metric that matters.' },
    { id: 'c', text: 'Neither — run both in parallel (A/B test) until you have statistical significance.' },
    { id: 'd', text: 'Deploy the class_weight model but with a custom threshold. The choice of model should follow from AUC; the threshold is tuned to optimize precision@K.' },
  ],
  correct: 'b',
  explanation: "At 1:200 imbalance, Precision@K (K=team capacity) is the deployment metric, while AUC guides model selection. Here, both models are already trained and evaluated. The SMOTE model has 7 percentage points higher Precision@100, meaning 71% of the top 100 scored transactions are real fraud vs. 64% for class_weight. The team reviews 100/day. That 7-point gap is 7 extra caught frauds per day. AUC=0.93 vs 0.91 is a statistical difference, but operationally it is not material compared to the precision@100 difference. The correct reasoning: AUC is good for architecture selection (should I use LR vs RF vs GBC?); Precision@K is good for deployment decision (of two architectures already trained, which one should I run in production?). The answer is SMOTE because it delivers superior precision at the operational threshold (K=100). Option (d) is wrong: you already have both models trained; there is no reason to add threshold tuning to the already-higher-precision SMOTE model.",
}

const CHECKPOINT_F3 = {
  id: 'cpF3',
  question: 'Scenario: 48 hours post-deployment, monitoring shows PSI=0.31 on transaction amount (RED zone — above 0.25 retrain threshold). KS tests on user tenure and device fingerprint age are not significant (p > 0.05). Fraud rate in the analyst feedback loop appears unchanged — analysts report reviewing similar fraud patterns. What do you do?',
  options: [
    { id: 'a', text: 'Wait 48 more hours. Analysts report no change in fraud patterns, so there is no problem. Monitor PSI again tomorrow. Only act if it stays above 0.25 for 3+ consecutive days.' },
    { id: 'b', text: 'Alert the team immediately and start a retraining job. PSI=0.31 > 0.25 is your retrain threshold. Statistical signals (PSI) are more reliable than analyst feedback because analysts only observe what the model flagged, not what it missed.' },
    { id: 'c', text: 'Investigate the specific merchants driving the amount shift. Suppress flagging for merchants with high transaction amounts (since they have low fraud rates anyway). This reduces false positives without retraining.' },
    { id: 'd', text: 'PSI is a lagging indicator. Since KS tests on other features are not significant, the shift is minor. Continue monitoring but do not act until you see performance degradation (e.g., precision@100 drops below 0.60).' },
  ],
  correct: 'b',
  explanation: "PSI=0.31 > 0.25 is a hard signal that the training distribution has shifted from production. This is a leading indicator (early warning), not lagging. The analyst feedback loop is unreliable for drift detection: analysts only see transactions the model flagged, so they do NOT see fraud cases the model missed. If a shift in amount distribution moved fraudulent transactions to lower model scores, those cases now fall below the flag threshold — analysts will never see them and will report no change in patterns. The correct action: alert immediately and start retraining. PSI on one feature (amount) is sufficient reason to act if it exceeds the threshold, even if other features are stable. KS tests not being significant does not contradict PSI — they measure different aspects (KS detects large shifts; PSI is more sensitive). Option (c) is wrong because suppressing flags for high-amount merchants would reduce fraud detection, making the problem worse. Option (a) is wrong because waiting defeats the purpose of threshold-based alerts. Option (d) is wrong because waiting for performance degradation means you are catching fraud at a lower rate already — the shift is already hurting you.",
}

const CELL_F4_CODE = `# Cell 4 — Stratified Train/Val/Test Split at 1:200 Imbalance
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

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

# Stratified split: train 60%, val 20%, test 20%
# stratify=y preserves the 1:200 fraud ratio in each partition
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp
)

print("=" * 70)
print("STRATIFIED TRAIN/VAL/TEST SPLIT — 1:200 IMBALANCE")
print("=" * 70)
print(f"Total:     {len(y):5d} rows  |  Fraud: {y.sum():3d}  |  Ratio: 1:{(len(y)-y.sum())//max(y.sum(),1)}")
print()
print(f"Training:  {len(y_train):5d} rows  |  Fraud: {y_train.sum():3d}  |  Ratio: 1:{(len(y_train)-y_train.sum())//max(y_train.sum(),1)}  |  {100*len(y_train)/len(y):.1f}%")
print(f"Validation:{len(y_val):5d} rows  |  Fraud: {y_val.sum():3d}  |  Ratio: 1:{(len(y_val)-y_val.sum())//max(y_val.sum(),1)}  |  {100*len(y_val)/len(y):.1f}%")
print(f"Test:      {len(y_test):5d} rows  |  Fraud: {y_test.sum():3d}  |  Ratio: 1:{(len(y_test)-y_test.sum())//max(y_test.sum(),1)}  |  {100*len(y_test)/len(y):.1f}%")
print()
print("--- Stratification note ---")
print("At 1:200 imbalance, stratified splitting is ESSENTIAL.")
print("Without stratify=y, random splits can create partitions with")
print("0 fraud cases (especially in small validation/test sets).")
print("With stratify=y, each partition gets ~50 fraud cases proportionally.")
`

const CELL_F5_CODE = `# Cell 5 — Compare class_weight='balanced' vs SMOTE
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score

try:
    from imblearn.over_sampling import SMOTE
    has_imblearn = True
except ImportError:
    has_imblearn = False
    print("Note: imbalanced-learn not available. Install: pip install imbalanced-learn")

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

X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp
)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_val_s   = scaler.transform(X_val)

def precision_at_k(y_true, scores, k=100):
    top_k = np.argsort(scores)[::-1][:k]
    return y_true[top_k].sum() / k

print("=" * 90)
print("APPROACH 1: class_weight='balanced' (in-model reweighting)")
print("=" * 90)
print(f"{'Model':<22} {'AUC':>8} {'P@50':>8} {'P@100':>8} {'P@200':>8}")
print("-" * 90)

for name, clf, needs_scale in [
    ('LogisticRegression', LogisticRegression(class_weight='balanced', max_iter=500, random_state=42), True),
    ('RandomForest',       RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42), False),
    ('GradientBoosting',   GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42), False),
]:
    Xtr = X_train_s if needs_scale else X_train
    Xv  = X_val_s   if needs_scale else X_val
    clf.fit(Xtr, y_train)
    proba = clf.predict_proba(Xv)[:, 1]
    auc   = roc_auc_score(y_val, proba)
    p50   = precision_at_k(y_val, proba, k=50)
    p100  = precision_at_k(y_val, proba, k=100)
    p200  = precision_at_k(y_val, proba, k=200)
    print(f"{name:<22} {auc:>8.4f} {p50:>8.3f} {p100:>8.3f} {p200:>8.3f}")

if has_imblearn:
    print()
    print("=" * 90)
    print("APPROACH 2: SMOTE on training set only (synthetic oversampling)")
    print("=" * 90)
    print(f"{'Model':<22} {'AUC':>8} {'P@50':>8} {'P@100':>8} {'P@200':>8}")
    print("-" * 90)

    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)

    X_train_smote_s = scaler.fit_transform(X_train_smote)

    for name, clf, needs_scale in [
        ('LogisticRegression', LogisticRegression(max_iter=500, random_state=42), True),
        ('RandomForest',       RandomForestClassifier(n_estimators=100, random_state=42), False),
        ('GradientBoosting',   GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42), False),
    ]:
        Xtr = X_train_smote_s if needs_scale else X_train_smote
        Xv  = X_val_s   if needs_scale else X_val
        clf.fit(Xtr, y_train_smote)
        proba = clf.predict_proba(Xv)[:, 1]
        auc   = roc_auc_score(y_val, proba)
        p50   = precision_at_k(y_val, proba, k=50)
        p100  = precision_at_k(y_val, proba, k=100)
        p200  = precision_at_k(y_val, proba, k=200)
        print(f"{name:<22} {auc:>8.4f} {p50:>8.3f} {p100:>8.3f} {p200:>8.3f}")

print()
print("--- Interpretation ---")
print("class_weight: High AUC, lower Precision@K (more false positives in top K)")
print("SMOTE:        Lower AUC, higher Precision@K (cleaner top K predictions)")
print()
print("At 1:200 imbalance, SMOTE often wins Precision@K because it expands the")
print("minority class to 1:1, allowing the model to learn richer fraud patterns.")
print("However, this comes at the cost of slightly lower global ranking (AUC).")
`

const CELL_F6_CODE = `# Cell 6 — Precision@K Curve (K=10 to K=500)
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score

try:
    from imblearn.over_sampling import SMOTE
    has_imblearn = True
except ImportError:
    has_imblearn = False

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

X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp
)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_val_s   = scaler.transform(X_val)

# Train SMOTE + GBC model (best from cell 5)
if has_imblearn:
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
    X_train_smote_s = scaler.fit_transform(X_train_smote)
    clf = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X_train_smote_s, y_train_smote)
else:
    clf = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42, subsample=0.8)
    clf.fit(X_train_s, y_train)

proba = clf.predict_proba(X_val_s)[:, 1]

def precision_at_k(y_true, scores, k):
    if k > len(y_true):
        k = len(y_true)
    top_k = np.argsort(scores)[::-1][:k]
    return y_true[top_k].sum() / k if k > 0 else 0

K_values = np.arange(10, 501, 10)
p_at_k = [precision_at_k(y_val, proba, k) for k in K_values]

fig, ax = plt.subplots(figsize=(11, 6))
ax.plot(K_values, p_at_k, linewidth=2.5, color='#f0a500', marker='o', markersize=4, alpha=0.8)
ax.axvline(x=100, color='#f43f5e', linestyle='--', linewidth=2, alpha=0.6, label='K=100 (team capacity)')
ax.scatter([100], [precision_at_k(y_val, proba, 100)], color='#f43f5e', s=120, zorder=5, marker='s')

ax.set_xlabel('K (number of top-scored transactions reviewed)', fontsize=12, fontweight='bold')
ax.set_ylabel('Precision@K (fraction that are fraud)', fontsize=12, fontweight='bold')
ax.set_title('Precision@K Curve — Best Model', fontsize=14, fontweight='bold')
ax.grid(True, alpha=0.3, linestyle=':')
ax.legend(fontsize=11)
ax.set_ylim([0, 1.0])

plt.tight_layout()
plt.show()

print("Precision@K curve computed for K=10 to K=500")
print(f"At K=100 (team capacity): Precision = {precision_at_k(y_val, proba, 100):.3f}")
print(f"This means: of the 100 highest-scored transactions, ~{int(100*precision_at_k(y_val, proba, 100))} are true fraud.")
`

const CELL_F7_CODE = `# Cell 7 — PSI (Population Stability Index) on Production Shift
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

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

X_train, X_hold, y_train, y_hold = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

# Simulate production data 48h later (small shift in amount distribution)
np.random.seed(100)
n_prod = 2000
amount_prod_legit = np.random.lognormal(mean=3.8, sigma=1.3, size=int(n_prod*0.995)).clip(1, 6000).round(2)
amount_prod_fraud = np.random.lognormal(mean=5.5, sigma=0.95, size=int(n_prod*0.005)).clip(50, 9000).round(2)
amount_prod = np.concatenate([amount_prod_legit, amount_prod_fraud])

merchant_prod = np.random.choice([0,1,2,3,4], n_prod, p=[0.28,0.24,0.17,0.22,0.09])

def calculate_psi(baseline, production, n_bins=10):
    baseline_counts, bin_edges = np.histogram(baseline, bins=n_bins)
    production_counts, _ = np.histogram(production, bins=bin_edges)

    baseline_prop = baseline_counts / baseline.shape[0]
    production_prop = production_counts / production.shape[0]

    baseline_prop = np.where(baseline_prop == 0, 0.0001, baseline_prop)
    production_prop = np.where(production_prop == 0, 0.0001, production_prop)

    psi = np.sum((production_prop - baseline_prop) * np.log(production_prop / baseline_prop))
    return psi

psi_amount = calculate_psi(X_train[:, 0], amount_prod)

merchant_train = X_train[:, 1].astype(int)
psi_merchant = calculate_psi(merchant_train, merchant_prod.astype(int), n_bins=5)

print("=" * 70)
print("PSI — PRODUCTION DRIFT DETECTION (48h post-deployment)")
print("=" * 70)
print(f"Transaction Amount PSI:    {psi_amount:.4f}  ", end="")
if psi_amount > 0.25:
    print("RED (>0.25 retrain threshold)")
elif psi_amount > 0.10:
    print("YELLOW (0.10-0.25 caution)")
else:
    print("GREEN (<0.10 stable)")

print(f"Merchant Category PSI:     {psi_merchant:.4f}  ", end="")
if psi_merchant > 0.25:
    print("RED")
elif psi_merchant > 0.10:
    print("YELLOW")
else:
    print("GREEN")

print()
print("--- Threshold guidance ---")
print("PSI < 0.10: Minimal shift — no action")
print("PSI 0.10-0.25: Caution — monitor for next 48h")
print("PSI > 0.25: Red zone — alert + investigate + consider retraining")
`

const CELL_F8_CODE = `# Cell 8 — Kolmogorov–Smirnov Test for Feature Shift
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.model_selection import train_test_split

np.random.seed(42)
n = 10000
n_fraud = 50
amount_legit    = np.random.lognormal(mean=3.5, sigma=1.2, size=n-n_fraud).clip(1, 5000).round(2)
tenure_legit    = np.random.exponential(400, n-n_fraud).clip(1, 3000).round().astype(int)
fp_age_legit    = np.random.exponential(180, n-n_fraud).clip(1, 1000).round().astype(int)
amount_fraud    = np.random.lognormal(mean=5.2, sigma=0.9, size=n_fraud).clip(50, 8000).round(2)
tenure_fraud    = np.random.exponential(60, n_fraud).clip(1, 500).round().astype(int)
fp_age_fraud    = np.random.exponential(15, n_fraud).clip(1, 200).round().astype(int)

X = np.column_stack([
    np.concatenate([amount_legit, amount_fraud]),
    np.concatenate([tenure_legit, tenure_fraud]),
    np.concatenate([fp_age_legit, fp_age_fraud]),
])
y = np.concatenate([np.zeros(n-n_fraud), np.ones(n_fraud)]).astype(int)

idx = np.random.permutation(n)
X, y = X[idx], y[idx]

X_train, X_hold, y_train, y_hold = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

# Simulate production data with slight shift in all features
np.random.seed(100)
n_prod = 2000
amount_prod = np.random.lognormal(mean=3.8, sigma=1.3, size=n_prod).clip(1, 6000).round(2)
tenure_prod = np.random.exponential(420, size=n_prod).clip(1, 3200).round().astype(int)
fp_age_prod = np.random.exponential(190, size=n_prod).clip(1, 1100).round().astype(int)

print("=" * 70)
print("KOLMOGOROV-SMIRNOV TEST — FEATURE DISTRIBUTION SHIFT")
print("=" * 70)
print("H0: Training and production distributions are the same.")
print("If p-value < 0.05, reject H0 (shift detected).")
print()

features = [
    ('Transaction Amount', X_train[:, 0], amount_prod),
    ('User Tenure (days)', X_train[:, 1], tenure_prod),
    ('Device Age (days)', X_train[:, 2], fp_age_prod),
]

print(f"{'Feature':<25} {'KS Statistic':>15} {'p-value':>15} {'Significant?':>15}")
print("-" * 70)

for feat_name, baseline, production in features:
    ks_stat, p_val = stats.ks_2samp(baseline, production)
    sig = 'Yes (p<0.05)' if p_val < 0.05 else 'No (p>=0.05)'
    print(f"{feat_name:<25} {ks_stat:>15.4f} {p_val:>15.4f} {sig:>15}")

print()
print("--- Interpretation ---")
print("Significant shifts (p<0.05) suggest distributional drift.")
print("Non-significant results do NOT mean no drift (test may lack power).")
print("Use KS test alongside PSI and visual inspection.")
`

const CELL_F9_CODE = `# Cell 9 — Model Score Distribution Drift
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler

try:
    from imblearn.over_sampling import SMOTE
    has_imblearn = True
except ImportError:
    has_imblearn = False

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

X_train, X_hold, y_train, y_hold = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_hold_s = scaler.transform(X_hold)

if has_imblearn:
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
    X_train_smote_s = scaler.fit_transform(X_train_smote)
    clf = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X_train_smote_s, y_train_smote)
    baseline_scores = clf.predict_proba(X_hold_s)[:, 1]
else:
    clf = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X_train_s, y_train)
    baseline_scores = clf.predict_proba(X_hold_s)[:, 1]

# Simulate production data (48h shift)
np.random.seed(100)
n_prod = 2000
n_prod_fraud = max(1, int(n_prod * 0.005))
amount_prod_legit = np.random.lognormal(mean=3.8, sigma=1.3, size=n_prod-n_prod_fraud).clip(1, 6000).round(2)
amount_prod_fraud = np.random.lognormal(mean=5.5, sigma=0.95, size=n_prod_fraud).clip(50, 9000).round(2)
merchant_prod = np.random.choice([0,1,2,3,4], n_prod, p=[0.28,0.24,0.17,0.22,0.09])
hour_prod = np.random.choice(range(24), n_prod, p=[0.02]*6+[0.05]*3+[0.07]*6+[0.06]*6+[0.05]*3)
tenure_prod = np.random.exponential(420, n_prod).clip(1, 3200).round().astype(int)
intl_prod = np.random.binomial(1, 0.10, n_prod)
fp_age_prod = np.random.exponential(190, n_prod).clip(1, 1100).round().astype(int)

X_prod = np.column_stack([
    np.concatenate([amount_prod_legit, amount_prod_fraud]),
    merchant_prod,
    hour_prod,
    tenure_prod,
    intl_prod,
    fp_age_prod,
])

X_prod_s = scaler.transform(X_prod)
prod_scores = clf.predict_proba(X_prod_s)[:, 1]

fig, ax = plt.subplots(figsize=(11, 6))
ax.hist(baseline_scores, bins=30, alpha=0.6, label='Baseline (training)', color='#6b7280', edgecolor='none')
ax.hist(prod_scores, bins=30, alpha=0.6, label='Production (48h)', color='#f0a500', edgecolor='none')
ax.set_xlabel('Model Score (P(fraud))', fontsize=12, fontweight='bold')
ax.set_ylabel('Count', fontsize=12, fontweight='bold')
ax.set_title('Prediction Score Distribution: Baseline vs Production', fontsize=14, fontweight='bold')
ax.legend(fontsize=11)
ax.grid(True, alpha=0.2, axis='y')

plt.tight_layout()
plt.show()

print("Model score distributions plotted.")
print(f"Baseline mean: {baseline_scores.mean():.4f}, Prod mean: {prod_scores.mean():.4f}")
print(f"Baseline median: {np.median(baseline_scores):.4f}, Prod median: {np.median(prod_scores):.4f}")
`

const CELL_F10_CODE = `# FastAPI /score Endpoint
# Deploy with: uvicorn app:app --host 0.0.0.0 --port 8000

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import pickle
import time

app = FastAPI(title="Fraud Detection Service")

# Load model and scaler at startup
# model = pickle.load(open("model.pkl", "rb"))
# scaler = pickle.load(open("scaler.pkl", "rb"))

class Transaction(BaseModel):
    amount: float
    merchant_category: int
    hour_of_day: int
    user_tenure_days: int
    is_international: int
    device_fingerprint_age: int

class ScoreResponse(BaseModel):
    transaction_id: str
    fraud_probability: float
    flagged: bool  # True if fraud_probability > threshold (e.g., 0.5)
    latency_ms: float

@app.post("/score", response_model=ScoreResponse)
def score_transaction(txn: Transaction, txn_id: str = "default_id"):
    """
    Synchronous fraud scoring endpoint.
    Requirement: <100ms latency (p99).

    Input: 6-dim transaction feature vector
    Output: fraud probability + flag decision
    """
    t0 = time.time()

    try:
        # Prepare features
        features = np.array([
            txn.amount,
            txn.merchant_category,
            txn.hour_of_day,
            txn.user_tenure_days,
            txn.is_international,
            txn.device_fingerprint_age,
        ]).reshape(1, -1)

        # Scale
        # features_scaled = scaler.transform(features)

        # Score
        # proba = model.predict_proba(features_scaled)[0, 1]
        # (Mock for demo)
        proba = np.random.uniform(0, 1)

        # Decision: flag if proba > threshold
        threshold = 0.5
        flagged = proba > threshold

        latency_ms = (time.time() - t0) * 1000

        return ScoreResponse(
            transaction_id=txn_id,
            fraud_probability=float(proba),
            flagged=bool(flagged),
            latency_ms=round(latency_ms, 2)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}
`

const CELL_F11_CODE = `# Dockerfile — Fraud Detection Model Service

FROM python:3.11-slim

WORKDIR /app

# Copy dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY app.py .
COPY model.pkl .
COPY scaler.pkl .

# Expose port
EXPOSE 8000

# Run service
ENTRYPOINT ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

# requirements.txt should include:
# fastapi==0.104.0
# uvicorn==0.24.0
# pydantic==2.4.0
# numpy==1.24.0
# scikit-learn==1.3.2
# pandas==2.1.0
`

const CELL_F12_CODE = `# Kubernetes Deployment Manifest
# Save as: fraud-detection-deployment.yaml
# Deploy with: kubectl apply -f fraud-detection-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: fraud-detection
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fraud-detection
  template:
    metadata:
      labels:
        app: fraud-detection
    spec:
      containers:
      - name: fraud-detector
        image: fraud-detection:v1.0.0  # Your image registry
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8000

        # Latency SLA monitoring
        resources:
          requests:
            cpu: "500m"        # Reserve 0.5 CPU per pod
            memory: "512Mi"    # Reserve 512MB memory
          limits:
            cpu: "1000m"       # Max 1 CPU
            memory: "1Gi"      # Max 1GB

        # Readiness probe: /health endpoint
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10

        # Liveness probe: restart if unhealthy
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  name: fraud-detection-service
spec:
  selector:
    app: fraud-detection
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
`

const CELL_F13_CODE = `# Fraud Ops Runbook
# Deployment playbook for fraud detection in production.

## Real-time vs Batch Scoring Decision

**Use real-time (/score endpoint):**
- When latency < 100ms is achievable (FastAPI + K8s)
- When analyst needs immediate decision for high-value/suspicious txns
- When volume <= 10K txns/sec (one pod cluster can handle ~5K/sec at p99)

**Use batch overnight:**
- When latency tolerance is 4–6h (daily batch runs)
- When post-transaction analysis (next-day fraud callbacks) is acceptable
- When volume is lower and consistency matters more than speed

For most fraud systems: **Real-time for online detection + Batch for retroactive labeling**.

---

## Escalation Path: Decision Tree

~~~
Score > 0.8 (high confidence fraud)?
  └─> BLOCK immediately (no analyst review needed)
       Notify user via SMS: "Transaction blocked. Call support."
       Log for retraining (true positive candidate)

0.5 < Score <= 0.8 (medium confidence)?
  └─> FLAG for analyst review
       Place in analyst queue (FIFO)
       SLA: review within 2h (100 txns/day = 2.4 sec per txn on average)
       Analyst decision: ALLOW / HARD_BLOCK / ESCALATE_TO_USER

0.3 < Score <= 0.5 (low confidence)?
  └─> ALLOW with logging
       Do NOT flag analyst
       Track for false positive rate monitoring

Score <= 0.3?
  └─> ALLOW (no fraud signal)

~~~

---

## Analyst Feedback Loop → Retraining

**Flow:**
1. Analyst reviews flagged transactions (daily batch of 100)
2. Analyst marks: FRAUD / NOT_FRAUD / UNCERTAIN
3. Each day, accumulate 100 labels → retrain on (historical data + new labels)
4. A/B test new model vs. baseline (hold out 10% traffic)
5. After 1 week: if new model P@100 > baseline P@100, promote

**Key metric:** Precision@100, NOT AUC.

---

## Alert Suppression Protocol: Known False Positives

**Problem:** Merchant X (e.g., airline ticket seller) always triggers fraud score > 0.7 due to high txn amounts, but has near-zero fraud rate.

**Solution:**
- Track false positive patterns by merchant category
- If FP rate for merchant M > 20%, add suppression rule:
  \`if merchant_id == M: reduce_score_by(0.2)\` or \`skip_flag\`
- Document suppressions in config file (no hardcode in model)
- Review suppression list quarterly (merchants change)

**Caution:** Suppressions reduce coverage. Balance false positive rate vs. false negative rate.

---

## Monitoring SLOs

- **P@100 >= 0.65:** Analyst productivity (65%+ of reviewed txns are fraud)
- **Latency p99 < 100ms:** User experience (payment doesn't feel slow)
- **Drift detection (PSI > 0.25):** Trigger alert + manual review + retrain planning
- **Blocked txn rate < 2% of all txns:** Avoid over-blocking legitimate users
- **Analyst queue depth < 1000 txns:** Prevent backlog
`

const CELL_F14_CODE = `# Bias Audit: Merchant Category & Geographic Parity

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler

try:
    from imblearn.over_sampling import SMOTE
except ImportError:
    SMOTE = None

np.random.seed(42)
n = 10000
n_fraud = 50
amount_legit = np.random.lognormal(mean=3.5, sigma=1.2, size=n-n_fraud).clip(1, 5000).round(2)
merchant_legit = np.random.choice([0,1,2,3,4], n-n_fraud, p=[0.30,0.22,0.18,0.20,0.10])
hour_legit = np.random.choice(range(24), n-n_fraud, p=[0.02]*6+[0.04]*3+[0.08]*6+[0.06]*6+[0.04]*3)
tenure_legit = np.random.exponential(400, n-n_fraud).clip(1, 3000).round().astype(int)
intl_legit = np.random.binomial(1, 0.08, n-n_fraud)
fp_age_legit = np.random.exponential(180, n-n_fraud).clip(1, 1000).round().astype(int)

amount_fraud = np.random.lognormal(mean=5.2, sigma=0.9, size=n_fraud).clip(50, 8000).round(2)
merchant_fraud = np.random.choice([0,1,2,3,4], n_fraud, p=[0.05,0.05,0.10,0.50,0.30])
hour_fraud = np.random.choice(range(24), n_fraud, p=[0.10]*6+[0.02]*3+[0.03]*6+[0.03]*6+[0.08]*3)
tenure_fraud = np.random.exponential(60, n_fraud).clip(1, 500).round().astype(int)
intl_fraud = np.random.binomial(1, 0.55, n_fraud)
fp_age_fraud = np.random.exponential(15, n_fraud).clip(1, 200).round().astype(int)

X = np.column_stack([
    np.concatenate([amount_legit, amount_fraud]),
    np.concatenate([merchant_legit, merchant_fraud]),
    np.concatenate([hour_legit, hour_fraud]),
    np.concatenate([tenure_legit, tenure_fraud]),
    np.concatenate([intl_legit, intl_fraud]),
    np.concatenate([fp_age_legit, fp_age_fraud]),
])
y = np.concatenate([np.zeros(n-n_fraud), np.ones(n_fraud)]).astype(int)

idx = np.random.permutation(n)
X, y = X[idx], y[idx]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.transform(X_test)

if SMOTE:
    smote = SMOTE(random_state=42)
    X_train_smote, y_train_smote = smote.fit_resample(X_train, y_train)
    X_train_smote_s = scaler.fit_transform(X_train_smote)
    clf = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X_train_smote_s, y_train_smote)
else:
    clf = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    clf.fit(X_train_s, y_train)

scores = clf.predict_proba(X_test_s)[:, 1]
flags = scores > 0.5

merchant_cat_test = X_test[:, 1].astype(int)
is_intl_test = X_test[:, 4].astype(int)

print("=" * 80)
print("BIAS AUDIT — FRAUD DETECTION MODEL")
print("=" * 80)
print()

print("--- Merchant Category Parity ---")
print(f"{'Merchant':<15} {'Count':>8} {'Fraud %':>10} {'Flagged %':>12} {'Flag Rate':>12}")
print("-" * 80)

merchant_names = ["grocery", "restaurant", "gas", "online", "travel"]
for m in range(5):
    mask = merchant_cat_test == m
    count = mask.sum()
    if count > 0:
        fraud_rate = 100 * y_test[mask].mean()
        flag_rate = 100 * flags[mask].mean()
        fraud_in_flagged = flags[mask].sum()
        print(f"{merchant_names[m]:<15} {count:>8} {fraud_rate:>10.2f}% {flag_rate:>12.2f}% {flag_rate/fraud_rate:>12.2f}x")

print()
print("--- Geographic Parity (International vs Domestic) ---")
print(f"{'Region':<15} {'Count':>8} {'Fraud %':>10} {'Flagged %':>12} {'Flag Rate':>12}")
print("-" * 80)

for intl_flag in [0, 1]:
    mask = is_intl_test == intl_flag
    count = mask.sum()
    if count > 0:
        fraud_rate = 100 * y_test[mask].mean()
        flag_rate = 100 * flags[mask].mean()
        region = "Domestic" if intl_flag == 0 else "International"
        print(f"{region:<15} {count:>8} {fraud_rate:>10.2f}% {flag_rate:>12.2f}% {flag_rate/fraud_rate:>12.2f}x")

print()
print("--- Bias Audit Summary ---")
print("Flag Rate Ratio = model flag rate / actual fraud rate")
print("Ratio > 1.5: potential bias (flagging one group disproportionately)")
print("Ratio < 0.67: potential underdetection (missing fraud in one group)")
print()
print("No material bias detected if all ratios are within [0.67, 1.5].")
`

// ─── ReferenceCellDisplay component (Phase 4 mark-as-read) ──────────────────
function ReferenceCellDisplay({ title, code, onMarkRead, isDone }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      border: `1px solid ${isDone ? 'rgba(52,211,153,0.35)' : 'var(--rim)'}`,
      borderLeft: `3px solid ${isDone ? 'var(--mint)' : 'var(--ink-ghost)'}`,
      borderRadius: '10px',
      background: isDone ? 'rgba(52,211,153,0.04)' : 'rgba(240,165,0,0.02)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--rim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: isDone ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
            border: `1px solid ${isDone ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '14px', color: isDone ? 'var(--mint)' : 'var(--prime)' }}>
              {isDone ? <CheckMark /> : '⟨⟩'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{title}</div>
            <div style={{ fontSize: '10px', color: isDone ? 'var(--mint)' : 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {isDone ? 'Read' : 'Reference code'}
            </div>
          </div>
        </div>
        {!isDone && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px',
              color: 'var(--ink-low)', fontSize: '14px', fontWeight: 700,
            }}
          >
            {expanded ? '−' : '+'}
          </button>
        )}
      </div>

      {expanded && !isDone && (
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--rim)', background: 'rgba(0,0,0,0.2)' }}>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-mid)',
            overflow: 'auto', maxHeight: '300px', margin: 0, lineHeight: 1.5,
            background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px',
          }}>
            {code}
          </pre>
        </div>
      )}

      {!isDone && (
        <div style={{ padding: '0 18px 16px' }}>
          <button
            onClick={onMarkRead}
            style={{
              background: 'var(--prime)', color: '#000',
              border: 'none', borderRadius: '7px',
              padding: '9px 20px', fontSize: '13px',
              fontWeight: 700, cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Mark as read
          </button>
        </div>
      )}
    </div>
  )
}

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
              {isCorrect ? <><CheckMark /> Correct</> : <><CrossMark /> See explanation</>}
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
              {revealed && isCorrectOpt && <span style={{ marginLeft: '8px', color: 'var(--mint)', fontSize: '12px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
              {revealed && isSelected && !isCorrectOpt && <span style={{ marginLeft: '8px', color: 'var(--rose)', fontSize: '12px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
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
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
            Phase 1 of 4
          </span>
          <FidelityBadge tier="faithful" />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'var(--card-pad-primary)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px', maxWidth: '400px' }}>
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
            background: state.cellsDone.includes('fraud_cell1') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
            border: `1px solid ${state.cellsDone.includes('fraud_cell1') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell1') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('fraud_cell1') ? <CheckMark /> : '1'}
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
            background: state.cellsDone.includes('fraud_cell2') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
            border: `1px solid ${state.cellsDone.includes('fraud_cell2') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell2') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('fraud_cell2') ? <CheckMark /> : '2'}
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
            background: state.cellsDone.includes('fraud_cell3') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
            border: `1px solid ${state.cellsDone.includes('fraud_cell3') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell3') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('fraud_cell3') ? <CheckMark /> : '3'}
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
              {state.checkpointsDone.includes('cpF1') ? <CheckMark /> : '?'}
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

      {/* ════════════════════════════════════════════════════════════════════════════
          PHASE 2: Model Training + SMOTE
          ════════════════════════════════════════════════════════════════════════════ */}

      {phase1Complete && (
        <>
          {/* Phase 2 header */}
          <div style={{ marginTop: '52px', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
                ML Engineering
              </span>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
                Phase 2 of 4
              </span>
              <FidelityBadge tier="faithful" />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 900,
              letterSpacing: '-0.05em', marginBottom: '10px', lineHeight: 1.1,
              color: 'var(--ink-hi)',
            }}>
              Model Training + SMOTE
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '0px' }}>
              Compare class_weight='balanced' vs SMOTE resampling on the training set. Both handle the 1:200 imbalance differently. Key metric: Precision@100, not AUC. Which approach gives better precision on the top 100 predicted fraud cases?
            </p>
          </div>

          {/* ── Cell F4 — Stratified Split ── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: state.cellsDone.includes('fraud_cell4') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                border: `1px solid ${state.cellsDone.includes('fraud_cell4') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell4') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                  {state.cellsDone.includes('fraud_cell4') ? <CheckMark /> : '4'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Stratified Train/Val/Test Split</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>60/20/20 split · preserve 1:200 ratio in each partition · print fraud counts</div>
              </div>
            </div>
            <PythonCell
              initialCode={CELL_F4_CODE}
              height={160}
              label="Cell 4 — Stratified Split"
              onResult={r => { if (r.ok) markCellDone('fraud_cell4') }}
            />
          </div>

          {/* ── Cell F5 — Compare class_weight vs SMOTE ── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: state.cellsDone.includes('fraud_cell5') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                border: `1px solid ${state.cellsDone.includes('fraud_cell5') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell5') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                  {state.cellsDone.includes('fraud_cell5') ? <CheckMark /> : '5'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Compare Imbalance Approaches</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>class_weight='balanced' vs SMOTE · LR, RF, GBC · AUC and P@100 metrics</div>
              </div>
            </div>
            <PythonCell
              initialCode={CELL_F5_CODE}
              height={200}
              label="Cell 5 — class_weight vs SMOTE"
              onResult={r => { if (r.ok) markCellDone('fraud_cell5') }}
            />
          </div>

          {/* ── Cell F6 — Precision@K Curve ── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: state.cellsDone.includes('fraud_cell6') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                border: `1px solid ${state.cellsDone.includes('fraud_cell6') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell6') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                  {state.cellsDone.includes('fraud_cell6') ? <CheckMark /> : '6'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Precision@K Curve</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>K=10 to K=500 · annotate K=100 (team capacity) · best model from cell 5</div>
              </div>
            </div>
            <PythonCell
              initialCode={CELL_F6_CODE}
              height={200}
              withPlot={true}
              label="Cell 6 — Precision@K Curve"
              onResult={r => { if (r.ok) markCellDone('fraud_cell6') }}
            />
          </div>

          {/* ── Checkpoint F2 ── */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: state.checkpointsDone.includes('cpF2') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
                border: `1px solid ${state.checkpointsDone.includes('cpF2') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cpF2') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                  {state.checkpointsDone.includes('cpF2') ? <CheckMark /> : '?'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Deploy with class_weight or SMOTE?</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>GBC class_weight (AUC=0.93, P@100=0.64) vs GBC SMOTE (AUC=0.91, P@100=0.71)</div>
              </div>
            </div>
            <JudgmentCheckpoint
              checkpoint={CHECKPOINT_F2}
              onComplete={() => markCheckpointDone('cpF2')}
            />
          </div>

          {/* ════════════════════════════════════════════════════════════════════════════
              PHASE 3: Monitoring
              ════════════════════════════════════════════════════════════════════════════ */}

          {state.checkpointsDone.includes('cpF2') && (
            <>
              {/* Phase 3 header */}
              <div style={{ marginTop: '52px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
                    ML Engineering
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
                    Phase 3 of 4
                  </span>
                  <FidelityBadge tier="faithful" />
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 900,
                  letterSpacing: '-0.05em', marginBottom: '10px', lineHeight: 1.1,
                  color: 'var(--ink-hi)',
                }}>
                  Monitoring + Drift Detection
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '0px' }}>
                  The model is deployed. 48 hours later, you detect distributional shift in production transaction amounts (PSI above retrain threshold). Analyst feedback looks fine. Should you alert and retrain immediately, or wait?
                </p>
              </div>

              {/* ── Cell F7 — PSI ── */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: state.cellsDone.includes('fraud_cell7') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                    border: `1px solid ${state.cellsDone.includes('fraud_cell7') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell7') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                      {state.cellsDone.includes('fraud_cell7') ? <CheckMark /> : '7'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>PSI — Feature Drift</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Population Stability Index · amount and merchant category · detect distribution shift</div>
                  </div>
                </div>
                <PythonCell
                  initialCode={CELL_F7_CODE}
                  height={160}
                  label="Cell 7 — PSI"
                  onResult={r => { if (r.ok) markCellDone('fraud_cell7') }}
                />
              </div>

              {/* ── Cell F8 — KS Test ── */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: state.cellsDone.includes('fraud_cell8') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                    border: `1px solid ${state.cellsDone.includes('fraud_cell8') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell8') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                      {state.cellsDone.includes('fraud_cell8') ? <CheckMark /> : '8'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>KS Test — Statistical Shift</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Kolmogorov–Smirnov · amount, tenure, device age · p-values</div>
                  </div>
                </div>
                <PythonCell
                  initialCode={CELL_F8_CODE}
                  height={160}
                  label="Cell 8 — KS Test"
                  onResult={r => { if (r.ok) markCellDone('fraud_cell8') }}
                />
              </div>

              {/* ── Cell F9 — Prediction Drift ── */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: state.cellsDone.includes('fraud_cell9') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                    border: `1px solid ${state.cellsDone.includes('fraud_cell9') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell9') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                      {state.cellsDone.includes('fraud_cell9') ? <CheckMark /> : '9'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Model Score Distribution</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>baseline (training) vs production (48h) · prediction drift histogram</div>
                  </div>
                </div>
                <PythonCell
                  initialCode={CELL_F9_CODE}
                  height={200}
                  withPlot={true}
                  label="Cell 9 — Prediction Drift"
                  onResult={r => { if (r.ok) markCellDone('fraud_cell9') }}
                />
              </div>

              {/* ── Checkpoint F3 ── */}
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: state.checkpointsDone.includes('cpF3') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
                    border: `1px solid ${state.checkpointsDone.includes('cpF3') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cpF3') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                      {state.checkpointsDone.includes('cpF3') ? <CheckMark /> : '?'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Alert or Wait?</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>PSI=0.31 (above 0.25 threshold) but analyst feedback seems stable</div>
                  </div>
                </div>
                <JudgmentCheckpoint
                  checkpoint={CHECKPOINT_F3}
                  onComplete={() => markCheckpointDone('cpF3')}
                />
              </div>

              {/* ════════════════════════════════════════════════════════════════════════════
                  PHASE 4: Deployment + Ops Runbook
                  ════════════════════════════════════════════════════════════════════════════ */}

              {state.checkpointsDone.includes('cpF3') && (
                <>
                  {/* Phase 4 header */}
                  <div style={{ marginTop: '52px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
                        ML Engineering
                      </span>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
                        Phase 4 of 4
                      </span>
                      <FidelityBadge tier="faithful" />
                    </div>
                    <h2 style={{
                      fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 900,
                      letterSpacing: '-0.05em', marginBottom: '10px', lineHeight: 1.1,
                      color: 'var(--ink-hi)',
                    }}>
                      Deployment + Ops Runbook
                    </h2>
                    <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '0px' }}>
                      Reference architecture for deployment. These cells are display-only code samples. Mark as read to unlock completion. Key: Fraud Ops Runbook (real-time vs batch, escalation paths, analyst feedback loop, alert suppression).
                    </p>
                  </div>

                  {/* ── Cell F10 — FastAPI Endpoint ── */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: state.cellsDone.includes('fraud_cell10') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                        border: `1px solid ${state.cellsDone.includes('fraud_cell10') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell10') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                          {state.cellsDone.includes('fraud_cell10') ? <CheckMark /> : '10'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>FastAPI Scoring Endpoint</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>sync /score endpoint · <100ms latency · reference code</div>
                      </div>
                    </div>
                    <ReferenceCellDisplay
                      title="FastAPI /score Endpoint"
                      code={CELL_F10_CODE}
                      onMarkRead={() => markCellDone('fraud_cell10')}
                      isDone={state.cellsDone.includes('fraud_cell10')}
                    />
                  </div>

                  {/* ── Cell F11 — Dockerfile ── */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: state.cellsDone.includes('fraud_cell11') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                        border: `1px solid ${state.cellsDone.includes('fraud_cell11') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell11') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                          {state.cellsDone.includes('fraud_cell11') ? <CheckMark /> : '11'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Dockerfile</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Python:3.11 slim · pip install dependencies · ENTRYPOINT uvicorn</div>
                      </div>
                    </div>
                    <ReferenceCellDisplay
                      title="Dockerfile"
                      code={CELL_F11_CODE}
                      onMarkRead={() => markCellDone('fraud_cell11')}
                      isDone={state.cellsDone.includes('fraud_cell11')}
                    />
                  </div>

                  {/* ── Cell F12 — K8s Deployment ── */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: state.cellsDone.includes('fraud_cell12') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                        border: `1px solid ${state.cellsDone.includes('fraud_cell12') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell12') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                          {state.cellsDone.includes('fraud_cell12') ? <CheckMark /> : '12'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Kubernetes Deployment</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>replicas=3 · resource limits · latency SLA monitoring</div>
                      </div>
                    </div>
                    <ReferenceCellDisplay
                      title="K8s Deployment Manifest"
                      code={CELL_F12_CODE}
                      onMarkRead={() => markCellDone('fraud_cell12')}
                      isDone={state.cellsDone.includes('fraud_cell12')}
                    />
                  </div>

                  {/* ── Cell F13 — Ops Runbook ── */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: state.cellsDone.includes('fraud_cell13') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                        border: `1px solid ${state.cellsDone.includes('fraud_cell13') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell13') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                          {state.cellsDone.includes('fraud_cell13') ? <CheckMark /> : '13'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Fraud Ops Runbook</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>escalation rules · analyst feedback loop · alert suppression · monitoring SLOs</div>
                      </div>
                    </div>
                    <ReferenceCellDisplay
                      title="Fraud Ops Runbook"
                      code={CELL_F13_CODE}
                      onMarkRead={() => markCellDone('fraud_cell13')}
                      isDone={state.cellsDone.includes('fraud_cell13')}
                    />
                  </div>

                  {/* ── Cell F14 — Bias Audit ── */}
                  <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: state.cellsDone.includes('fraud_cell14') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
                        border: `1px solid ${state.cellsDone.includes('fraud_cell14') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('fraud_cell14') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                          {state.cellsDone.includes('fraud_cell14') ? <CheckMark /> : '14'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Bias Audit</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>merchant category parity · geographic region disparity · audit report</div>
                      </div>
                    </div>
                    <ReferenceCellDisplay
                      title="Bias Audit Report"
                      code={CELL_F14_CODE}
                      onMarkRead={() => markCellDone('fraud_cell14')}
                      isDone={state.cellsDone.includes('fraud_cell14')}
                    />
                  </div>

                  {/* ── Phase 4 Completion Card ── */}
                  {state.cellsDone.includes('fraud_cell14') && (
                    <div className="card animate-slide-up" style={{ padding: '20px 22px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.30)', borderLeft: '3px solid var(--mint)', marginBottom: '32px' }}>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--mint)', marginBottom: '8px', fontWeight: 700 }}>
                        <CheckMark /> Phase 4 Complete
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: '0 0 12px' }}>
                        Fraud Detection lab complete. You have mastered imbalance handling (class_weight vs SMOTE), precision@K thinking (operational metrics vs statistical metrics), drift detection (PSI + KS + prediction shift), and deployment architecture (FastAPI, Docker, K8s, ops runbook). The key judgment: when analyst feedback conflicts with statistical signals, trust the data — they only see what the model flagged, not what it missed.
                      </p>
                      <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(52,211,153,0.15)' }}>
                        Next: LandscapeTab audit fixups and ModelEvalTab hex colors. See NEXT.md.
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

    </div>
  )
}
