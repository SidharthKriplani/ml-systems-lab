import { useState } from 'react'
import { CheckMark, CrossMark, WarningMark } from '../components/Icons'
import PythonCell from '../components/PythonCell.jsx'

// ─── LocalStorage key ─────────────────────────────────────────────────────────
const LS_KEY = 'msl_projectlab_loan_data'

// ─── Checkpoint data ──────────────────────────────────────────────────────────
const CHECKPOINT_L1 = {
  id: 'cpL1',
  question: 'Schema inspection reveals: annual_income (float), loan_amount (int), credit_score (int, 580–850), employment_length (int, years), home_ownership (categorical: RENT/OWN/MORTGAGE), loan_purpose (categorical: debt_consolidation/home_improvement/other), default (binary target, 14.2% positive rate). Correlations: employment_length r=0.44 with default, home_ownership r=0.38, annual_income r=0.31. You are deploying this model for a bank loan decision system. Before training, which features require regulatory scrutiny, and why?',
  options: [
    { id: 'a', text: 'annual_income only — it is the strongest direct financial signal and the most likely to correlate with protected class membership (race, national origin) under disparate impact doctrine.' },
    { id: 'b', text: 'employment_length and home_ownership — employment_length can proxy for age (a protected class under ECOA); home_ownership proxies for neighbourhood, which correlates with race. Both require disparate impact analysis before inclusion, even if they are predictive.' },
    { id: 'c', text: 'All features require scrutiny — any feature in a credit model can have disparate impact and must be tested for fairness before deployment.' },
    { id: 'd', text: 'None — if features are not explicitly demographic (race, gender, age, religion), they are legally safe to use in a credit model without additional scrutiny.' },
  ],
  correct: 'b',
  explanation: 'The Equal Credit Opportunity Act (ECOA) and Fair Housing Act prohibit credit decisions that have a disparate impact on protected classes — even when using facially neutral features. employment_length is a classic age proxy: older applicants tend to have longer employment histories, so penalising short employment systematically disadvantages younger applicants. home_ownership proxies for neighbourhood and wealth accumulation patterns that correlate with race due to historical redlining. Both have strong predictive power AND known disparate impact risk — they cannot be included without a business necessity analysis and alternatives test. Option A: annual_income is a legitimate financial metric and less likely to be a protected class proxy than the others. Option C is too broad — credit_score and loan_amount have no significant proxy risk for protected classes. Option D is wrong: disparate impact doctrine explicitly covers facially neutral features.',
}

// ─── Cell code strings ────────────────────────────────────────────────────────
const CELL_L1_CODE = `# Cell 1 — Loan Default: Schema Inspection
# Regulatory framing: this is a bank credit decision model — every feature
# needs to be evaluated not just for predictive power but for disparate impact risk.

import numpy as np
import pandas as pd

np.random.seed(42)
n = 800

annual_income      = np.random.lognormal(mean=11.0, sigma=0.5, size=n).clip(25000, 500000).round(-2)
loan_amount        = np.random.lognormal(mean=9.5, sigma=0.6, size=n).clip(1000, 100000).round(-2).astype(int)
credit_score       = np.random.normal(680, 60, n).clip(580, 850).round().astype(int)
employment_length  = np.random.exponential(4, n).clip(0, 30).round(1)
home_ownership     = np.random.choice(['RENT', 'OWN', 'MORTGAGE'], n, p=[0.45, 0.20, 0.35])
loan_purpose       = np.random.choice(['debt_consolidation', 'home_improvement', 'other'], n, p=[0.55, 0.25, 0.20])

p_default = (
    0.35
    - 0.00000015 * annual_income
    - 0.0004 * credit_score
    + 0.012 * (home_ownership == 'RENT').astype(int)
    - 0.008 * employment_length
    + np.random.normal(0, 0.06, n)
).clip(0.02, 0.75)
default = (np.random.uniform(size=n) < p_default).astype(int)

df = pd.DataFrame({
    'annual_income':     annual_income,
    'loan_amount':       loan_amount,
    'credit_score':      credit_score,
    'employment_length': employment_length,
    'home_ownership':    home_ownership,
    'loan_purpose':      loan_purpose,
    'default':           default,
})

print("=" * 56)
print("LOAN DEFAULT — SCHEMA INSPECTION")
print("=" * 56)
print(f"Shape: {df.shape[0]} rows x {df.shape[1]} columns")
print()

print("--- Dtypes ---")
for col, dtype in df.dtypes.items():
    print(f"  {col:<22} {str(dtype):<12}")

print()
print("--- Nulls ---")
nulls = df.isnull().sum()
if nulls.sum() == 0:
    print("  No nulls in this synthetic dataset.")
else:
    for col, n_null in nulls[nulls > 0].items():
        print(f"  {col:<22} {n_null} missing")

print()
print("--- Target distribution ---")
n_default = df['default'].sum()
n_total   = len(df)
print(f"  Default (1): {n_default} ({100*n_default/n_total:.1f}%)")
print(f"  No default (0): {n_total-n_default} ({100*(n_total-n_default)/n_total:.1f}%)")
print()
print("--- Regulatory note ---")
print("  This is a credit decision model. ECOA and Fair Housing Act apply.")
print("  Before training: identify features that may proxy for protected")
print("  classes (race, age, national origin, religion, sex, familial status).")
print("  Predictive power does not override disparate impact risk.")
`

const CELL_L2_CODE = `# Cell 2 — Loan Default: EDA
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

np.random.seed(42)
n = 800
annual_income      = np.random.lognormal(mean=11.0, sigma=0.5, size=n).clip(25000, 500000).round(-2)
loan_amount        = np.random.lognormal(mean=9.5, sigma=0.6, size=n).clip(1000, 100000).round(-2).astype(int)
credit_score       = np.random.normal(680, 60, n).clip(580, 850).round().astype(int)
employment_length  = np.random.exponential(4, n).clip(0, 30).round(1)
home_ownership     = np.random.choice(['RENT', 'OWN', 'MORTGAGE'], n, p=[0.45, 0.20, 0.35])
loan_purpose       = np.random.choice(['debt_consolidation', 'home_improvement', 'other'], n, p=[0.55, 0.25, 0.20])
p_default = (0.35 - 0.00000015*annual_income - 0.0004*credit_score + 0.012*(home_ownership=='RENT').astype(int) - 0.008*employment_length + np.random.normal(0,0.06,n)).clip(0.02, 0.75)
default = (np.random.uniform(size=n) < p_default).astype(int)
df = pd.DataFrame({'annual_income': annual_income, 'loan_amount': loan_amount, 'credit_score': credit_score, 'employment_length': employment_length, 'home_ownership': home_ownership, 'loan_purpose': loan_purpose, 'default': default})

d1 = df[df['default']==1]
d0 = df[df['default']==0]

fig = plt.figure(figsize=(13, 8))
gs  = gridspec.GridSpec(2, 3, figure=fig, hspace=0.45, wspace=0.38)

# Class balance
ax1 = fig.add_subplot(gs[0, 0])
counts = df['default'].value_counts().sort_index()
ax1.pie(counts, labels=['No default','Default'], autopct='%1.1f%%',
        colors=['#374151','#f0a500'], startangle=90, textprops={'fontsize':10})
ax1.set_title('Class Balance', fontsize=11, fontweight='bold')

# Credit score by default
ax2 = fig.add_subplot(gs[0, 1])
ax2.hist(d0['credit_score'], bins=20, alpha=0.7, color='#6b7280', label='No default', edgecolor='none')
ax2.hist(d1['credit_score'], bins=20, alpha=0.8, color='#f0a500', label='Default',    edgecolor='none')
ax2.set_title('Credit Score by Default', fontsize=11, fontweight='bold')
ax2.set_xlabel('Credit score', fontsize=9)
ax2.legend(fontsize=8); ax2.grid(True, alpha=0.2)

# Annual income by default (log scale)
ax3 = fig.add_subplot(gs[0, 2])
ax3.hist(d0['annual_income']/1000, bins=20, alpha=0.7, color='#6b7280', label='No default', edgecolor='none')
ax3.hist(d1['annual_income']/1000, bins=20, alpha=0.8, color='#f0a500', label='Default',    edgecolor='none')
ax3.set_title('Annual Income by Default (k)', fontsize=11, fontweight='bold')
ax3.set_xlabel('Income (thousands)', fontsize=9)
ax3.legend(fontsize=8); ax3.grid(True, alpha=0.2)

# Default rate by home ownership
ax4 = fig.add_subplot(gs[1, 0])
ho_rate = df.groupby('home_ownership')['default'].mean() * 100
bars = ax4.bar(ho_rate.index, ho_rate.values, color='#f0a500', alpha=0.85, edgecolor='none')
ax4.set_title('Default Rate by Home Ownership', fontsize=11, fontweight='bold')
ax4.set_ylabel('Default rate (%)', fontsize=9)
for b in bars: ax4.text(b.get_x()+b.get_width()/2, b.get_height()+0.3, f'{b.get_height():.1f}%', ha='center', fontsize=9)
ax4.grid(True, alpha=0.2, axis='y')

# Default rate by loan purpose
ax5 = fig.add_subplot(gs[1, 1])
lp_rate = df.groupby('loan_purpose')['default'].mean() * 100
bars5 = ax5.barh(lp_rate.index, lp_rate.values, color='#f0a500', alpha=0.85, edgecolor='none')
ax5.set_title('Default Rate by Loan Purpose', fontsize=11, fontweight='bold')
ax5.set_xlabel('Default rate (%)', fontsize=9)
ax5.grid(True, alpha=0.2, axis='x')

# Correlations with default
ax6 = fig.add_subplot(gs[1, 2])
corr_cols = ['annual_income','loan_amount','credit_score','employment_length']
corrs = [df[c].corr(df['default']) for c in corr_cols]
colors_bar = ['#f0a500' if abs(c) > 0.2 else '#6b7280' for c in corrs]
ax6.barh(corr_cols, corrs, color=colors_bar, edgecolor='none', alpha=0.85)
ax6.axvline(0, color='#374151', lw=0.8)
ax6.set_title('Feature Correlation with Default', fontsize=11, fontweight='bold')
ax6.set_xlabel('Pearson r', fontsize=9)
ax6.grid(True, alpha=0.2, axis='x')

plt.tight_layout()
plt.show()

print("--- Correlations with default ---")
for col, r in zip(corr_cols, corrs):
    print(f"  {col:<22} r = {r:+.4f}")
print()
print("--- Regulatory flag ---")
print("  employment_length r = strongest numeric predictor.")
print("  Also proxies for AGE -- a protected class under ECOA.")
print("  home_ownership: RENT group has highest default rate.")
print("  home_ownership proxies for neighbourhood (race, wealth).")
print("  Both features require disparate impact analysis before inclusion.")
`

const CELL_L3_CODE = `# Cell 3 — Loan Default: Proxy Feature Audit
# Before training: test whether candidate features have disparate impact
# across demographic proxies. This is standard pre-modelling due diligence
# for any consumer credit model under ECOA / Fair Housing Act.

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

np.random.seed(42)
n = 800
annual_income      = np.random.lognormal(mean=11.0, sigma=0.5, size=n).clip(25000, 500000).round(-2)
loan_amount        = np.random.lognormal(mean=9.5, sigma=0.6, size=n).clip(1000, 100000).round(-2).astype(int)
credit_score       = np.random.normal(680, 60, n).clip(580, 850).round().astype(int)
employment_length  = np.random.exponential(4, n).clip(0, 30).round(1)
home_ownership     = np.random.choice(['RENT', 'OWN', 'MORTGAGE'], n, p=[0.45, 0.20, 0.35])
loan_purpose       = np.random.choice(['debt_consolidation', 'home_improvement', 'other'], n, p=[0.55, 0.25, 0.20])
p_default = (0.35 - 0.00000015*annual_income - 0.0004*credit_score + 0.012*(home_ownership=='RENT').astype(int) - 0.008*employment_length + np.random.normal(0,0.06,n)).clip(0.02, 0.75)
default = (np.random.uniform(size=n) < p_default).astype(int)
df = pd.DataFrame({'annual_income': annual_income, 'loan_amount': loan_amount, 'credit_score': credit_score, 'employment_length': employment_length, 'home_ownership': home_ownership, 'loan_purpose': loan_purpose, 'default': default})

# Simulate age proxy for employment_length (short tenure = likely younger)
emp_quartiles = pd.qcut(df['employment_length'], q=4, labels=['Q1\n(0-2yr)','Q2\n(2-4yr)','Q3\n(4-8yr)','Q4\n(8yr+)'])

# 4/5ths rule (80% rule) — disparate impact threshold
# If selection rate for group A / selection rate for group B < 0.80 -> adverse impact
ho_approval = df.groupby('home_ownership')['default'].apply(lambda x: 1 - x.mean())
max_approval = ho_approval.max()
fourfifths   = ho_approval / max_approval

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Home ownership: approval rate proxy
axes[0].bar(ho_approval.index, ho_approval.values * 100, color=['#f0a500' if r < 0.80 else '#6b7280' for r in fourfifths], alpha=0.85, edgecolor='none')
axes[0].axhline(ho_approval.max() * 100 * 0.8, color='#f97316', lw=1.5, linestyle='--', label='4/5ths threshold')
axes[0].set_title('Approval Rate by Home Ownership\n(proxy for neighbourhood/race)', fontsize=11, fontweight='bold')
axes[0].set_ylabel('Simulated approval rate (%)', fontsize=9)
axes[0].legend(fontsize=8); axes[0].grid(True, alpha=0.2, axis='y')
for i, (k, v) in enumerate(ho_approval.items()):
    axes[0].text(i, v*100+0.5, f'{v*100:.1f}%', ha='center', fontsize=9)

# Employment length quartiles: approval rate proxy (age)
emp_approval = df.groupby(emp_quartiles, observed=True)['default'].apply(lambda x: 1-x.mean())
fourfifths_e = emp_approval / emp_approval.max()
axes[1].bar(emp_approval.index, emp_approval.values*100, color=['#f0a500' if r < 0.80 else '#6b7280' for r in fourfifths_e], alpha=0.85, edgecolor='none')
axes[1].axhline(emp_approval.max()*100*0.8, color='#f97316', lw=1.5, linestyle='--', label='4/5ths threshold')
axes[1].set_title('Approval Rate by Employment Length\n(proxy for age)', fontsize=11, fontweight='bold')
axes[1].set_ylabel('Simulated approval rate (%)', fontsize=9)
axes[1].legend(fontsize=8); axes[1].grid(True, alpha=0.2, axis='y')

plt.tight_layout()
plt.show()

print("--- 4/5ths rule (disparate impact threshold) ---")
print("  Ratio < 0.80 = statistically adverse impact on that group.")
print()
print("Home ownership adverse impact ratios:")
for k, v in fourfifths.items():
    flag = " <- ADVERSE IMPACT" if v < 0.80 else ""
    print(f"  {k:<12} {v:.3f}{flag}")
print()
print("Employment length (age proxy) adverse impact ratios:")
for k, v in fourfifths_e.items():
    flag = " <- ADVERSE IMPACT" if v < 0.80 else ""
    print(f"  {k}  {v:.3f}{flag}")
print()
print("--- What this means ---")
print("  Features that trigger the 4/5ths rule require a business necessity")
print("  justification AND an alternatives test before inclusion.")
print("  'But they are predictive' is not a sufficient justification under ECOA.")
`

const CHECKPOINT_L2 = {
  id: 'cpL2',
  question: 'Your GradientBoosting model on the loan default dataset achieves val AUC=0.77, ECE=0.14. The bank wants to automatically deny loan applications where predicted default probability > 0.35. Before deploying this threshold, what must you verify under ECOA and Fair Housing Act requirements?',
  options: [
    { id: 'a', text: 'Verify AUC > 0.75 on the held-out test set. AUC=0.77 on val is strong but must be confirmed on test before production deployment.' },
    { id: 'b', text: 'Run a disparate impact analysis on the threshold. At p(default) > 0.35, verify that the denial rate for protected demographic groups does not exceed the 4/5ths adverse impact threshold compared to the group with the lowest denial rate. AUC and ECE alone are insufficient for ECOA compliance.' },
    { id: 'c', text: 'Recalibrate first — ECE=0.14 means the 0.35 probability threshold is unreliable. Apply Platt scaling, re-measure ECE in the 0.30–0.40 range, then deploy.' },
    { id: 'd', text: 'Run the model in shadow mode for 30 days before enabling automatic denials. Shadow mode collects production predictions without affecting loan decisions — once shadow AUC matches val AUC, the threshold is safe to activate.' },
  ],
  correct: 'b',
  explanation: 'ECOA and Fair Housing Act compliance requires disparate impact analysis — not just model performance metrics. A threshold of 0.35 may be well-calibrated (option C is also partially correct) but calibration alone does not satisfy legal requirements. The 4/5ths rule: if the denial rate for any protected group is less than 80% of the denial rate for the group with the lowest denial rate, the policy has adverse impact and requires a business necessity justification and alternatives test. AUC of 0.77 (option A) and shadow mode (option D) are valid operational steps but neither addresses the legal compliance requirement. The correct first step before enabling automatic denials is disparate impact analysis across income brackets (age proxy), home ownership type (race proxy), and any other demographic dimensions available in the data.',
}

// ─── Cell code strings (Phase 2) ─────────────────────────────────────────────
const CELL_L4_CODE = `# Cell 4 — Loan Default: Train / Val / Test Split
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

np.random.seed(42)
n = 800
annual_income      = np.random.lognormal(mean=11.0, sigma=0.5, size=n).clip(25000, 500000).round(-2)
loan_amount        = np.random.lognormal(mean=9.5, sigma=0.6, size=n).clip(1000, 100000).round(-2).astype(int)
credit_score       = np.random.normal(680, 60, n).clip(580, 850).round().astype(int)
employment_length  = np.random.exponential(4, n).clip(0, 30).round(1)
home_ownership     = np.random.choice(['RENT', 'OWN', 'MORTGAGE'], n, p=[0.45, 0.20, 0.35])
loan_purpose       = np.random.choice(['debt_consolidation', 'home_improvement', 'other'], n, p=[0.55, 0.25, 0.20])
p_default = (0.35 - 0.00000015*annual_income - 0.0004*credit_score + 0.012*(home_ownership=='RENT').astype(int) - 0.008*employment_length + np.random.normal(0,0.06,n)).clip(0.02, 0.75)
default = (np.random.uniform(size=n) < p_default).astype(int)

ho_enc = {'RENT': 0, 'OWN': 1, 'MORTGAGE': 2}
lp_enc = {'debt_consolidation': 0, 'home_improvement': 1, 'other': 2}
X = np.column_stack([annual_income, loan_amount, credit_score, employment_length,
                     [ho_enc[v] for v in home_ownership], [lp_enc[v] for v in loan_purpose]])
y = default

X_temp, X_test, y_temp, y_test   = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
X_train, X_val,  y_train, y_val  = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)

print("=" * 52)
print("LOAN DEFAULT — TRAIN / VAL / TEST SPLIT")
print("=" * 52)
for name, y_split in [('Train', y_train), ('Val  ', y_val), ('Test ', y_test)]:
    n_pos = y_split.sum()
    n_tot = len(y_split)
    print(f"  {name}  {n_tot:4d} rows  |  default={n_pos} ({100*n_pos/n_tot:.1f}%)  no-default={n_tot-n_pos} ({100*(n_tot-n_pos)/n_tot:.1f}%)")

print()
print("─── Class imbalance considerations ───")
print("  Default rate: ~14%. Not as extreme as fraud (1:200)")
print("  but minority class still needs explicit handling.")
print()
print("  Options:")
print("  1. class_weight='balanced' — upweights minority during training.")
print("     Recommended for LR and RF — no data duplication.")
print("  2. SMOTE — synthetic minority oversampling in training set only.")
print("     Apply AFTER splitting, NEVER on full dataset before split.")
print("  3. Threshold adjustment — train without reweighting,")
print("     then choose threshold that meets recall/precision target.")
print()
print("─── Regulatory note ───")
print("  For ECOA compliance, the split must preserve the demographic")
print("  distribution of the training data. If the training set")
print("  underrepresents a protected group, the model may generalize")
print("  poorly to that group even with good overall AUC.")
`

const CELL_L5_CODE = `# Cell 5 — Loan Default: Model Training
import numpy as np
import time
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, f1_score

np.random.seed(42)
n = 800
annual_income      = np.random.lognormal(mean=11.0, sigma=0.5, size=n).clip(25000, 500000).round(-2)
loan_amount        = np.random.lognormal(mean=9.5, sigma=0.6, size=n).clip(1000, 100000).round(-2).astype(int)
credit_score       = np.random.normal(680, 60, n).clip(580, 850).round().astype(int)
employment_length  = np.random.exponential(4, n).clip(0, 30).round(1)
home_ownership     = np.random.choice(['RENT', 'OWN', 'MORTGAGE'], n, p=[0.45, 0.20, 0.35])
loan_purpose       = np.random.choice(['debt_consolidation', 'home_improvement', 'other'], n, p=[0.55, 0.25, 0.20])
p_default = (0.35 - 0.00000015*annual_income - 0.0004*credit_score + 0.012*(home_ownership=='RENT').astype(int) - 0.008*employment_length + np.random.normal(0,0.06,n)).clip(0.02, 0.75)
default = (np.random.uniform(size=n) < p_default).astype(int)

ho_enc = {'RENT': 0, 'OWN': 1, 'MORTGAGE': 2}
lp_enc = {'debt_consolidation': 0, 'home_improvement': 1, 'other': 2}
X = np.column_stack([annual_income, loan_amount, credit_score, employment_length,
                     [ho_enc[v] for v in home_ownership], [lp_enc[v] for v in loan_purpose]])
y = default

X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_val_s   = scaler.transform(X_val)

models = [
    ('LogisticRegression', LogisticRegression(class_weight='balanced', max_iter=500, random_state=42), True),
    ('RandomForest',       RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42), False),
    ('GradientBoosting',   GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42), False),
]

print("=" * 64)
print("LOAN DEFAULT — MODEL TRAINING")
print("=" * 64)
print(f"  {'Model':<22}  {'Val AUC':>8}  {'Val F1':>7}  {'Time':>8}")
print("  " + "─"*56)

for name, clf, needs_scale in models:
    Xtr = X_train_s if needs_scale else X_train
    Xv  = X_val_s   if needs_scale else X_val
    t0  = time.time()
    clf.fit(Xtr, y_train)
    elapsed = time.time() - t0
    proba = clf.predict_proba(Xv)[:, 1]
    pred  = (proba >= 0.5).astype(int)
    auc   = roc_auc_score(y_val, proba)
    f1    = f1_score(y_val, pred, zero_division=0)
    print(f"  {name:<22}  {auc:>8.4f}  {f1:>7.4f}  {elapsed:>7.3f}s")

print()
print("─── Credit model specifics ───")
print("  AUC: how well the model ranks defaulters above non-defaulters.")
print("  F1 at 0.5 threshold: meaningful only if 0.5 is the business threshold.")
print("  For loan decisions, the business threshold is set by risk appetite")
print("  (e.g., deny loans where P(default) > 0.35) — not by 0.5.")
print()
print("─── ECOA checkpoint ───")
print("  class_weight='balanced' handles the 14% imbalance in training.")
print("  It does NOT address disparate impact. A balanced model can still")
print("  produce denial rates that violate the 4/5ths rule across groups.")
`

const CELL_L6_CODE = `# Cell 6 — Loan Default: Eval Metrics + Threshold Selection
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import roc_auc_score, precision_recall_curve, roc_curve, confusion_matrix

np.random.seed(42)
n = 800
annual_income      = np.random.lognormal(mean=11.0, sigma=0.5, size=n).clip(25000, 500000).round(-2)
loan_amount        = np.random.lognormal(mean=9.5, sigma=0.6, size=n).clip(1000, 100000).round(-2).astype(int)
credit_score       = np.random.normal(680, 60, n).clip(580, 850).round().astype(int)
employment_length  = np.random.exponential(4, n).clip(0, 30).round(1)
home_ownership     = np.random.choice(['RENT', 'OWN', 'MORTGAGE'], n, p=[0.45, 0.20, 0.35])
loan_purpose       = np.random.choice(['debt_consolidation', 'home_improvement', 'other'], n, p=[0.55, 0.25, 0.20])
p_default = (0.35 - 0.00000015*annual_income - 0.0004*credit_score + 0.012*(home_ownership=='RENT').astype(int) - 0.008*employment_length + np.random.normal(0,0.06,n)).clip(0.02, 0.75)
default = (np.random.uniform(size=n) < p_default).astype(int)

ho_enc = {'RENT': 0, 'OWN': 1, 'MORTGAGE': 2}
lp_enc = {'debt_consolidation': 0, 'home_improvement': 1, 'other': 2}
X = np.column_stack([annual_income, loan_amount, credit_score, employment_length,
                     [ho_enc[v] for v in home_ownership], [lp_enc[v] for v in loan_purpose]])
y = default

X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)

clf = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42)
clf.fit(X_train, y_train)
proba = clf.predict_proba(X_val)[:, 1]

fpr, tpr, _ = roc_curve(y_val, proba)
auc = roc_auc_score(y_val, proba)
prec, rec, pr_thresh = precision_recall_curve(y_val, proba)
f1s = 2*prec*rec / (prec+rec+1e-9)
best_idx = f1s[:-1].argmax()
best_thresh = pr_thresh[best_idx]

# Cost asymmetry: cost of FN (bad loan issued) vs FP (good customer denied)
# Bank estimate: FN costs $5000 avg loss; FP costs $200 foregone interest
thresholds = np.arange(0.10, 0.70, 0.02)
costs = []
for t in thresholds:
    pred_t = (proba >= t).astype(int)
    cm = confusion_matrix(y_val, pred_t, labels=[0,1])
    tn, fp, fn, tp = cm.ravel()
    cost = fn * 5000 + fp * 200
    costs.append(cost)
best_cost_thresh = thresholds[np.argmin(costs)]

fig = plt.figure(figsize=(13, 4.5))
gs  = gridspec.GridSpec(1, 3, figure=fig, wspace=0.42)

ax1 = fig.add_subplot(gs[0, 0])
ax1.plot(fpr, tpr, color='#f0a500', lw=2, label=f'AUC={auc:.3f}')
ax1.plot([0,1],[0,1], '--', color='#4b5563', lw=1)
ax1.set_title('ROC Curve', fontsize=11, fontweight='bold')
ax1.set_xlabel('FPR', fontsize=9); ax1.set_ylabel('TPR', fontsize=9)
ax1.legend(fontsize=9); ax1.grid(True, alpha=0.2)

ax2 = fig.add_subplot(gs[0, 1])
ax2.plot(rec, prec, color='#f0a500', lw=2)
ax2.axvline(rec[best_idx], color='#6b7280', lw=1, linestyle='--', label=f'Max F1 thresh={best_thresh:.2f}')
ax2.set_title('Precision-Recall', fontsize=11, fontweight='bold')
ax2.set_xlabel('Recall', fontsize=9); ax2.set_ylabel('Precision', fontsize=9)
ax2.legend(fontsize=8); ax2.grid(True, alpha=0.2)

ax3 = fig.add_subplot(gs[0, 2])
ax3.plot(thresholds, costs, color='#f0a500', lw=2)
ax3.axvline(best_cost_thresh, color='#6b7280', lw=1, linestyle='--', label=f'Min cost thresh={best_cost_thresh:.2f}')
ax3.set_title('Business Cost by Threshold\\n(FN=$5k, FP=$200)', fontsize=10, fontweight='bold')
ax3.set_xlabel('Threshold', fontsize=9); ax3.set_ylabel('Total cost ($)', fontsize=9)
ax3.legend(fontsize=8); ax3.grid(True, alpha=0.2)

plt.tight_layout()
plt.show()

print(f"Val AUC = {auc:.4f}")
print(f"Max-F1 threshold: {best_thresh:.3f}")
print(f"Min-cost threshold (FN=$5k, FP=$200): {best_cost_thresh:.3f}")
print()
print("─── Credit model threshold logic ───")
print("  Threshold choice is a business + legal decision, not a model decision.")
print("  Lower threshold → deny more loans → fewer bad loans (lower FN cost)")
print("  but more good customers denied (higher FP cost + disparate impact risk).")
print("  The cost-minimizing threshold assumes homogeneous costs —")
print("  in reality, FN and FP costs vary by loan size and customer segment.")
print()
print("─── Next step before deployment ───")
print("  At threshold=", f"{best_cost_thresh:.2f}: run disparate impact analysis.")
print("  Compute denial rate per demographic group. Apply 4/5ths rule.")
print("  If adverse impact found: business necessity justification required.")
`

// ─── Cell code strings (Phase 3) ─────────────────────────────────────────────
const CELL_L7_CODE = `# Cell 7 — Loan Default: Population Stability Index (PSI)
import numpy as np
import pandas as pd

np.random.seed(42)
n = 800
annual_income      = np.random.lognormal(mean=11.0, sigma=0.5, size=n).clip(25000, 500000).round(-2)
loan_amount        = np.random.lognormal(mean=9.5, sigma=0.6, size=n).clip(1000, 100000).round(-2).astype(int)
credit_score       = np.random.normal(680, 60, n).clip(580, 850).round().astype(int)
employment_length  = np.random.exponential(4, n).clip(0, 30).round(1)

# Simulate production drift — credit score distribution shifted (tighter economy)
np.random.seed(77)
n_prod = 400
annual_income_p   = np.random.lognormal(mean=10.8, sigma=0.55, size=n_prod).clip(25000, 500000).round(-2)
credit_score_p    = np.random.normal(655, 65, n_prod).clip(580, 850).round().astype(int)  # lower mean
employment_p      = np.random.exponential(3.5, n_prod).clip(0, 30).round(1)
loan_amount_p     = np.random.lognormal(mean=9.6, sigma=0.65, size=n_prod).clip(1000, 100000).round(-2).astype(int)

def compute_psi(expected, actual, n_bins=10):
    bins = np.linspace(min(expected.min(), actual.min()),
                       max(expected.max(), actual.max()) + 1e-9, n_bins + 1)
    exp_c, _ = np.histogram(expected, bins=bins)
    act_c, _ = np.histogram(actual,   bins=bins)
    exp_p = (exp_c + 1e-6) / len(expected)
    act_p = (act_c + 1e-6) / len(actual)
    return ((act_p - exp_p) * np.log(act_p / exp_p)).sum()

features = {
    'annual_income':     (annual_income,      annual_income_p),
    'credit_score':      (credit_score,        credit_score_p),
    'employment_length': (employment_length,   employment_p),
    'loan_amount':       (loan_amount,          loan_amount_p),
}

print("=" * 60)
print("LOAN DEFAULT — POPULATION STABILITY INDEX")
print("=" * 60)
print(f"  {'Feature':<22}  {'PSI':>8}  {'Status'}")
print("  " + "─"*54)
for feat, (exp, act) in features.items():
    psi = compute_psi(exp, act)
    if psi < 0.10:   status = "✓ Stable      (<0.10)"
    elif psi < 0.20: status = "⚠ Monitor     (0.10–0.20)"
    elif psi < 0.25: status = "⚠⚠ Amber      (0.20–0.25)"
    else:            status = "✗ Retrain now (>0.25)"
    print(f"  {feat:<22}  {psi:>8.4f}  {status}")

print()
print("─── Credit model PSI interpretation ───")
print("  PSI thresholds are the same as other ML models:")
print("  <0.10 stable, 0.10-0.20 monitor, 0.20-0.25 amber, >0.25 retrain.")
print()
print("─── Regulatory dimension ───")
print("  PSI on annual_income and credit_score is particularly important")
print("  for credit models. Drift in these features may reflect a change")
print("  in the applicant population — which can affect disparate impact.")
print("  A distribution shift toward lower-income or lower-credit-score")
print("  applicants changes which groups are most affected by the threshold.")
print("  Monitor demographic proxies (home_ownership, employment_length)")
print("  alongside predictive features when drift is detected.")
`

const CELL_L8_CODE = `# Cell 8 — Loan Default: KS Test for Distribution Shift
import numpy as np
from scipy import stats

np.random.seed(42)
n = 800
annual_income    = np.random.lognormal(mean=11.0, sigma=0.5, size=n).clip(25000, 500000).round(-2)
credit_score     = np.random.normal(680, 60, n).clip(580, 850).round().astype(int)
employment_length = np.random.exponential(4, n).clip(0, 30).round(1)
loan_amount      = np.random.lognormal(mean=9.5, sigma=0.6, size=n).clip(1000, 100000).round(-2).astype(int)

np.random.seed(77)
n_prod = 400
annual_income_p   = np.random.lognormal(mean=10.8, sigma=0.55, size=n_prod).clip(25000, 500000).round(-2)
credit_score_p    = np.random.normal(655, 65, n_prod).clip(580, 850).round().astype(int)
employment_p      = np.random.exponential(3.5, n_prod).clip(0, 30).round(1)
loan_amount_p     = np.random.lognormal(mean=9.6, sigma=0.65, size=n_prod).clip(1000, 100000).round(-2).astype(int)

features = {
    'annual_income':     (annual_income,       annual_income_p),
    'credit_score':      (credit_score,         credit_score_p),
    'employment_length': (employment_length,    employment_p),
    'loan_amount':       (loan_amount,           loan_amount_p),
}

print("=" * 68)
print("LOAN DEFAULT — KS TEST FOR DISTRIBUTION SHIFT")
print("=" * 68)
print(f"  {'Feature':<22}  {'KS stat':>9}  {'p-value':>10}  {'Result (α=0.05)'}")
print("  " + "─"*62)
for feat, (train, prod) in features.items():
    stat, pval = stats.ks_2samp(train, prod)
    result = "<CrossMark />Significant shift" if pval < 0.05 else "<CheckMark />No significant shift"
    print(f"  {feat:<22}  {stat:>9.4f}  {pval:>10.4f}  {result}")

print()
print("─── Combined PSI + KS interpretation ───")
print("  PSI tells you magnitude; KS tells you statistical significance.")
print("  For credit models, use both:")
print("  • KS significant + PSI < 0.10: statistically real but small shift. Monitor.")
print("  • KS significant + PSI 0.20+: significant and large shift. Alert + investigate.")
print("  • KS not significant: shift may be sampling noise, not a real change.")
print()
print("─── Credit-specific concern ───")
print("  Shift in credit_score distribution is a red flag for two reasons:")
print("  1. Model was trained on a different credit score distribution.")
print("  2. A lower credit score population may trigger disparate impact")
print("     across demographics that correlate with credit score.")
`

const CELL_L9_CODE = `# Cell 9 — Loan Default: Prediction Score Drift
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier

np.random.seed(42)
n = 800
annual_income      = np.random.lognormal(mean=11.0, sigma=0.5, size=n).clip(25000, 500000).round(-2)
loan_amount        = np.random.lognormal(mean=9.5, sigma=0.6, size=n).clip(1000, 100000).round(-2).astype(int)
credit_score       = np.random.normal(680, 60, n).clip(580, 850).round().astype(int)
employment_length  = np.random.exponential(4, n).clip(0, 30).round(1)
home_ownership     = np.random.choice(['RENT', 'OWN', 'MORTGAGE'], n, p=[0.45, 0.20, 0.35])
loan_purpose       = np.random.choice(['debt_consolidation', 'home_improvement', 'other'], n, p=[0.55, 0.25, 0.20])
p_default = (0.35 - 0.00000015*annual_income - 0.0004*credit_score + 0.012*(home_ownership=='RENT').astype(int) - 0.008*employment_length + np.random.normal(0,0.06,n)).clip(0.02, 0.75)
default = (np.random.uniform(size=n) < p_default).astype(int)

ho_enc = {'RENT':0,'OWN':1,'MORTGAGE':2}
lp_enc = {'debt_consolidation':0,'home_improvement':1,'other':2}
X = np.column_stack([annual_income, loan_amount, credit_score, employment_length,
                     [ho_enc[v] for v in home_ownership], [lp_enc[v] for v in loan_purpose]])
y = default

X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)
clf = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42)
clf.fit(X_train, y_train)

# Production drift — lower incomes, lower credit scores
np.random.seed(77)
n_prod = 400
ai_p = np.random.lognormal(mean=10.8, sigma=0.55, size=n_prod).clip(25000, 500000).round(-2)
la_p = np.random.lognormal(mean=9.6, sigma=0.65, size=n_prod).clip(1000, 100000).round(-2).astype(int)
cs_p = np.random.normal(655, 65, n_prod).clip(580, 850).round().astype(int)
el_p = np.random.exponential(3.5, n_prod).clip(0, 30).round(1)
ho_p = np.random.choice([0,1,2], n_prod, p=[0.50, 0.18, 0.32])
lp_p = np.random.choice([0,1,2], n_prod, p=[0.58, 0.22, 0.20])
X_prod = np.column_stack([ai_p, la_p, cs_p, el_p, ho_p, lp_p])

scores_val  = clf.predict_proba(X_val)[:, 1]
scores_prod = clf.predict_proba(X_prod)[:, 1]

# Denial rate shift at threshold 0.35
denial_val  = (scores_val  >= 0.35).mean()
denial_prod = (scores_prod >= 0.35).mean()

fig = plt.figure(figsize=(12, 4.5))
gs  = gridspec.GridSpec(1, 2, figure=fig, wspace=0.40)

ax1 = fig.add_subplot(gs[0, 0])
ax1.hist(scores_val,  bins=25, alpha=0.7, color='#6b7280', edgecolor='none', label='Validation (training dist.)')
ax1.hist(scores_prod, bins=25, alpha=0.7, color='#f0a500', edgecolor='none', label='Production (shifted dist.)')
ax1.axvline(0.35, color='#f97316', lw=1.5, linestyle='--', label='Decision threshold 0.35')
ax1.set_title('Score Distribution Shift', fontsize=11, fontweight='bold')
ax1.set_xlabel('Predicted default probability', fontsize=9)
ax1.legend(fontsize=8); ax1.grid(True, alpha=0.2)

ax2 = fig.add_subplot(gs[0, 1])
val_s  = np.sort(scores_val)
prod_s = np.sort(scores_prod)
ax2.plot(val_s,  np.linspace(0,1,len(val_s)),  color='#6b7280', lw=2, label='Validation CDF')
ax2.plot(prod_s, np.linspace(0,1,len(prod_s)), color='#f0a500', lw=2, label='Production CDF')
ax2.axvline(0.35, color='#f97316', lw=1.5, linestyle='--', label='Threshold 0.35')
ax2.set_title('Cumulative Score Distribution', fontsize=11, fontweight='bold')
ax2.set_xlabel('Predicted default probability', fontsize=9)
ax2.legend(fontsize=8); ax2.grid(True, alpha=0.2)

plt.tight_layout()
plt.show()

print(f"Validation  — mean score: {scores_val.mean():.4f}  denial rate at 0.35: {denial_val:.3f}")
print(f"Production  — mean score: {scores_prod.mean():.4f}  denial rate at 0.35: {denial_prod:.3f}")
print(f"Score mean shift: {scores_prod.mean() - scores_val.mean():+.4f}")
print(f"Denial rate shift: {denial_prod - denial_val:+.3f} ({(denial_prod-denial_val)*100:+.1f}pp)")
print()
print("─── Credit-specific impact of score shift ───")
print("  A rightward score shift (higher predicted default) at the same")
print("  threshold means MORE applicants are denied. If the population")
print("  has shifted toward lower-income or lower-credit-score applicants")
print("  (as PSI/KS indicated), this denial rate increase may be")
print("  disproportionately affecting protected demographic groups.")
print("  Monitor denial rates by demographic segment alongside PSI.")
`

const CHECKPOINT_L3 = {
  id: 'cpL3',
  question: 'PSI=0.22 on annual_income (crossing the 0.20 amber-to-red boundary), KS p=0.01 on credit_score (highly significant at α=0.05). Both signals appeared 72 hours after deploying the new loan default model. P95 inference latency unchanged. No known business events or upstream schema changes. What do you do?',
  options: [
    { id: 'a', text: 'Alert + investigate immediately. PSI=0.22 is crossing into the red zone (>0.25 requires retraining) and KS p=0.01 is highly significant. Two simultaneous signals 72 hours post-deployment is a pattern — investigate whether the new model changed preprocessing or feature computation before concluding it is organic data drift.' },
    { id: 'b', text: 'Log and watch for 7 days. PSI=0.22 is amber (below 0.25 retrain threshold) and a single KS test is not conclusive. Wait for more data before escalating.' },
    { id: 'c', text: 'Rollback immediately. Any drift signal post-deployment should trigger an automatic rollback to the prior model version.' },
    { id: 'd', text: 'Disable drift alerts for annual_income — it is a volatile feature that will always show PSI variation. Set a higher alert threshold for income-related features.' },
  ],
  correct: 'a',
  explanation: 'PSI=0.22 is approaching the red zone (>0.25) and the direction of travel matters as much as the current value — if this is 72 hours post-deployment, it may still be rising. KS p=0.01 on credit_score is highly significant and an independent corroborating signal. Two drift signals firing simultaneously shortly after a model deployment is a known high-priority pattern: the most likely cause is that the new model changed something in the feature pipeline (different feature version pulled from the feature store, different preprocessing in the new model artifact) rather than genuine data distribution shift. Alert + investigate is correct. Rollback (option C) before diagnosis wastes the opportunity to understand root cause. Log-and-watch (option B) is too passive when PSI is approaching red. Option D is dangerous — disabling alerts on high-signal features because they are "volatile" is how silent degradation happens.',
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
      {/* Header */}
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

      {/* Options */}
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

      {/* Reveal button */}
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

      {/* Explanation */}
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
export default function LoanDefaultTab({ onNavigate }) {
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
    ['cellL1', 'cellL2', 'cellL3'].filter(c => state.cellsDone.includes(c)).length +
    ['cpL1'].filter(c => state.checkpointsDone.includes(c)).length

  const phase1Complete = phase1DoneSteps === phase1TotalSteps

  // Phase 2: cells L4-L6 + checkpoint cpL2
  const phase2TotalSteps = 4
  const phase2DoneSteps  = ['loan_cell4', 'loan_cell5', 'loan_cell6'].filter(c => state.cellsDone.includes(c)).length
    + ['cpL2'].filter(c => state.checkpointsDone.includes(c)).length
  const phase2Complete = phase2DoneSteps === phase2TotalSteps

  // Phase 3: cells L7-L9 + checkpoint cpL3
  const phase3TotalSteps = 4
  const phase3DoneSteps  = ['loan_cell7','loan_cell8','loan_cell9'].filter(c => state.cellsDone.includes(c)).length
    + ['cpL3'].filter(c => state.checkpointsDone.includes(c)).length
  const phase3Complete = phase3DoneSteps === phase3TotalSteps

  // Phase 4: cells 10-14 (display-only, mark as read)
  const phase4TotalSteps = 5
  const phase4DoneSteps  = ['loan_cell10','loan_cell11','loan_cell12','loan_cell13','loan_cell14'].filter(c => state.cellsDone.includes(c)).length
  const phase4Complete   = phase4DoneSteps === phase4TotalSteps

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
            <CheckMark /> Real execution
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900,
          letterSpacing: '-0.05em', marginBottom: '10px', lineHeight: 1.1,
          background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Project Lab — Loan Default
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
          A sequential data science notebook focused on credit risk — with a regulatory lens. Run real Python in the browser, make production decisions at each checkpoint. Phase 1 covers schema inspection, EDA, and a fairness audit before any model training begins.
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
        <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Dataset — Synthetic Loan Applications</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
          800-row synthetic loan application dataset. 7 features: annual income, loan amount, credit score, employment length, home ownership, loan purpose.
          Target: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--depth)', padding: '1px 5px', borderRadius: '3px' }}>default</code> (binary, ~14.2% positive rate).
          Regulatory framing: this is a credit decision model — ECOA and Fair Housing Act apply. Feature selection requires disparate impact analysis, not just predictive power assessment.
        </p>
      </div>

      {/* ── Cell L1 — Schema Inspection ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('cellL1') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('cellL1') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cellL1') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('cellL1') ? <CheckMark /> : '1'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Schema Inspection</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>dtypes · nulls · target distribution · regulatory context</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_L1_CODE}
          height={200}
          label="Cell 1 — Schema"
          onResult={r => { if (r.ok) markCellDone('cellL1') }}
        />
      </div>

      {/* ── Cell L2 — EDA ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('cellL2') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('cellL2') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cellL2') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('cellL2') ? <CheckMark /> : '2'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>EDA</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>class balance · feature distributions · default rate by segment · correlations</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_L2_CODE}
          height={200}
          withPlot={true}
          label="Cell 2 — EDA"
          onResult={r => { if (r.ok) markCellDone('cellL2') }}
        />
      </div>

      {/* ── Cell L3 — Proxy Feature Audit ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('cellL3') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('cellL3') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cellL3') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('cellL3') ? <CheckMark /> : '3'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Proxy Feature Audit</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>4/5ths rule · home ownership · employment length as age proxy</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_L3_CODE}
          height={200}
          withPlot={true}
          label="Cell 3 — Proxy Audit"
          onResult={r => { if (r.ok) markCellDone('cellL3') }}
        />
      </div>

      {/* ── Checkpoint L1 ── */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.checkpointsDone.includes('cpL1') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
            border: `1px solid ${state.checkpointsDone.includes('cpL1') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cpL1') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.checkpointsDone.includes('cpL1') ? <CheckMark /> : '?'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Regulatory Scrutiny Decision</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>which features need disparate impact analysis before training?</div>
          </div>
        </div>
        <JudgmentCheckpoint
          checkpoint={CHECKPOINT_L1}
          onComplete={() => markCheckpointDone('cpL1')}
        />
      </div>

      {/* ── Phase 1 complete callout ── */}
      {phase1Complete && (
        <div className="card animate-slide-up" style={{ padding: '20px 22px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.30)', borderLeft: '3px solid var(--prime)', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', marginBottom: '8px', fontWeight: 700 }}>
            Phase 1 Complete
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: '0 0 12px' }}>
            You have run schema inspection, EDA, and a proxy feature fairness audit — and identified which features require disparate impact analysis before training. Phase 2 (Model Training) is coming next.
          </p>
          <button
            onClick={() => { try { localStorage.removeItem(LS_KEY) } catch {} setState({ cellsDone: [], checkpointsDone: [] }) }}
            style={{ fontSize: '12px', color: 'var(--ink-low)', background: 'none', border: '1px solid var(--rim)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
          >
            Reset notebook
          </button>
        </div>
      )}

      {/* ── Phase 2 header ── */}
      <div style={{ marginBottom: '28px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
            ML Engineering
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
            Phase 2 of 4
          </span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800,
          letterSpacing: '-0.04em', marginBottom: '8px', lineHeight: 1.15,
          color: 'var(--ink-hi)',
        }}>
          Model Training &amp; Evaluation
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
          Train three model classes on the loan default dataset. Evaluate metrics, select a business threshold using cost asymmetry (FN=$5k vs FP=$200). Make the ECOA compliance judgment at the checkpoint.
        </p>

        {/* Phase 2 progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px', maxWidth: '400px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Phase 2 progress</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ width: `${Math.round((phase2DoneSteps / phase2TotalSteps) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 8px rgba(240,165,0,0.5)' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{phase2DoneSteps}/{phase2TotalSteps}</span>
        </div>
      </div>

      {/* ── Cell L4 — Train/Val/Test Split ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('loan_cell4') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('loan_cell4') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell4') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('loan_cell4') ? <CheckMark /> : '4'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Train/Val/Test Split</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>stratified 60/20/20 · class imbalance 14% · SMOTE vs class_weight</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_L4_CODE}
          height={200}
          label="Cell 4 — Split"
          onResult={r => { if (r.ok) markCellDone('loan_cell4') }}
        />
      </div>

      {/* ── Cell L5 — Model Training ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('loan_cell5') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('loan_cell5') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell5') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('loan_cell5') ? <CheckMark /> : '5'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Model Training</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>LR + RF + GradientBoosting · class_weight='balanced' · val AUC + F1</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_L5_CODE}
          height={200}
          label="Cell 5 — Training"
          onResult={r => { if (r.ok) markCellDone('loan_cell5') }}
        />
      </div>

      {/* ── Cell L6 — Eval + Threshold ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('loan_cell6') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('loan_cell6') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell6') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('loan_cell6') ? <CheckMark /> : '6'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Eval + Threshold</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>ROC · PR curve · cost asymmetry threshold · business vs statistical threshold</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_L6_CODE}
          height={200}
          withPlot={true}
          label="Cell 6 — Eval"
          onResult={r => { if (r.ok) markCellDone('loan_cell6') }}
        />
      </div>

      {/* ── Checkpoint L2 ── */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.checkpointsDone.includes('cpL2') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
            border: `1px solid ${state.checkpointsDone.includes('cpL2') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cpL2') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.checkpointsDone.includes('cpL2') ? <CheckMark /> : '?'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>ECOA Threshold Check</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>AUC=0.77, ECE=0.14, bank threshold &gt;0.35 — what must you verify first?</div>
          </div>
        </div>
        <JudgmentCheckpoint
          checkpoint={CHECKPOINT_L2}
          onComplete={() => markCheckpointDone('cpL2')}
        />
      </div>

      {/* ── Phase 2 complete callout ── */}
      {phase2Complete && (
        <div className="card animate-slide-up" style={{ padding: '20px 22px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.30)', borderLeft: '3px solid var(--prime)', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', marginBottom: '8px', fontWeight: 700 }}>
            Phase 2 Complete
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
            You have trained three model classes, evaluated AUC and F1, selected a business-cost threshold, and made the ECOA compliance judgment. Phase 3 (Monitoring) is next.
          </p>
        </div>
      )}

      {/* ── Phase 3 header ── */}
      <div style={{ marginBottom: '28px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
            ML Engineering
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
            Phase 3 of 4
          </span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800,
          letterSpacing: '-0.04em', marginBottom: '8px', lineHeight: 1.15,
          color: 'var(--ink-hi)',
        }}>
          Phase 3 — Monitoring
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
          Compute PSI and KS drift statistics on a simulated production sample with lower credit scores and incomes. Track prediction score distribution shift and the resulting change in denial rates. Make the alert-or-wait judgment at the checkpoint.
        </p>

        {/* Phase 3 progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px', maxWidth: '400px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Phase 3 progress</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ width: `${Math.round((phase3DoneSteps / phase3TotalSteps) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 8px rgba(240,165,0,0.5)' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{phase3DoneSteps}/{phase3TotalSteps}</span>
        </div>
      </div>

      {/* ── Cell L7 — PSI ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('loan_cell7') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('loan_cell7') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell7') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('loan_cell7') ? <CheckMark /> : '7'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>PSI — Feature Drift</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>PSI per feature · amber/red bands · regulatory dimension of income drift</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_L7_CODE}
          height={200}
          label="Cell 7 — PSI"
          onResult={r => { if (r.ok) markCellDone('loan_cell7') }}
        />
      </div>

      {/* ── Cell L8 — KS Test ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('loan_cell8') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('loan_cell8') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell8') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('loan_cell8') ? <CheckMark /> : '8'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>KS Test</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>scipy KS two-sample · significance · combined PSI+KS interpretation</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_L8_CODE}
          height={200}
          label="Cell 8 — KS Test"
          onResult={r => { if (r.ok) markCellDone('loan_cell8') }}
        />
      </div>

      {/* ── Cell L9 — Prediction Drift ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('loan_cell9') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('loan_cell9') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell9') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('loan_cell9') ? <CheckMark /> : '9'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Prediction Drift</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>score distribution shift · denial rate change at threshold · demographic impact framing</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_L9_CODE}
          height={200}
          withPlot={true}
          label="Cell 9 — Prediction Drift"
          onResult={r => { if (r.ok) markCellDone('loan_cell9') }}
        />
      </div>

      {/* ── Checkpoint L3 ── */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.checkpointsDone.includes('cpL3') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
            border: `1px solid ${state.checkpointsDone.includes('cpL3') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cpL3') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.checkpointsDone.includes('cpL3') ? <CheckMark /> : '?'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Alert or Wait?</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>PSI=0.22 on income + KS p=0.01 on credit score — 72h post-deployment</div>
          </div>
        </div>
        <JudgmentCheckpoint
          checkpoint={CHECKPOINT_L3}
          onComplete={() => markCheckpointDone('cpL3')}
        />
      </div>

      {/* ── Phase 3 complete callout ── */}
      {phase3Complete && (
        <div className="card animate-slide-up" style={{ padding: '20px 22px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.30)', borderLeft: '3px solid var(--prime)', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', marginBottom: '8px', fontWeight: 700 }}>
            Phase 3 Complete
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
            You have computed PSI across four features, confirmed distribution shift with KS tests, visualised prediction score drift and its denial rate impact, and made the alert-or-wait judgment. Phase 4 (Deployment) is coming next.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
           PHASE 4 — Deployment Scaffold + Regulatory Model Card
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: '48px' }}>

        {/* Phase 4 header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', fontWeight: 700, background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.30)', borderRadius: '4px', padding: '2px 8px' }}>Phase 4 of 4</span>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
          Phase 4 — Deployment Scaffold
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: '0 0 20px' }}>
          Reference implementation for deploying the loan default model to production. The regulatory model card (Cell 14) is required for any credit decision model — it documents training data demographics, disparate impact test results, threshold documentation, and the appeal process. Read each scaffold, mark as done.
        </p>

        {/* Phase 4 progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{ flex: 1, height: '4px', background: 'var(--depth)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((phase4DoneSteps / phase4TotalSteps) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 8px rgba(240,165,0,0.5)' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{phase4DoneSteps}/{phase4TotalSteps}</span>
        </div>

        {/* ── Cell 10 — FastAPI /predict ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('loan_cell10') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
              border: `1px solid ${state.cellsDone.includes('loan_cell10') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell10') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('loan_cell10') ? <CheckMark /> : '10'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>FastAPI /predict</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>prediction endpoint · pydantic validation · APPROVE/DENY/REVIEW thresholds</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>python</span>
              {!state.cellsDone.includes('loan_cell10') ? (
                <button onClick={() => markCellDone('loan_cell10')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Mark as read <CheckMark /></button>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
            <pre style={{ margin: 0, padding: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre' }}>{`# app/main.py — Loan Default Prediction API
from fastapi import FastAPI
from pydantic import BaseModel, validator
import joblib, numpy as np

app = FastAPI(title="Loan Default API", version="1.0.0")
model  = joblib.load("artifacts/loan_model.pkl")
scaler = joblib.load("artifacts/loan_scaler.pkl")

class LoanRequest(BaseModel):
    annual_income:     float
    loan_amount:       int
    credit_score:      int
    employment_length: float
    home_ownership:    int   # 0=RENT, 1=OWN, 2=MORTGAGE
    loan_purpose:      int   # 0=debt_consolidation, 1=home_improvement, 2=other

    @validator('credit_score')
    def score_in_range(cls, v):
        if not (580 <= v <= 850):
            raise ValueError('credit_score must be 580–850')
        return v

class LoanResponse(BaseModel):
    default_probability: float
    decision:            str   # APPROVE / DENY / REVIEW
    model_version:       str = "1.0.0"

# Decision threshold: >0.35 deny, 0.25–0.35 manual review, <0.25 approve
DENY_THRESHOLD   = 0.35
REVIEW_THRESHOLD = 0.25

@app.post("/predict", response_model=LoanResponse)
async def predict(req: LoanRequest):
    X = np.array([[req.annual_income, req.loan_amount, req.credit_score,
                   req.employment_length, req.home_ownership, req.loan_purpose]])
    X_s  = scaler.transform(X)
    prob = float(model.predict_proba(X_s)[0, 1])
    if prob >= DENY_THRESHOLD:      decision = "DENY"
    elif prob >= REVIEW_THRESHOLD:  decision = "REVIEW"
    else:                           decision = "APPROVE"
    return LoanResponse(default_probability=round(prob, 4), decision=decision)

@app.get("/health")
async def health():
    return {"status": "ok"}`}</pre>
          </div>
        </div>

        {/* ── Cell 11 — Dockerfile ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('loan_cell11') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
              border: `1px solid ${state.cellsDone.includes('loan_cell11') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell11') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('loan_cell11') ? <CheckMark /> : '11'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Dockerfile</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>multi-stage build · non-root user · audit log requirement (ECOA)</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>dockerfile</span>
              {!state.cellsDone.includes('loan_cell11') ? (
                <button onClick={() => markCellDone('loan_cell11')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Mark as read <CheckMark /></button>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
            <pre style={{ margin: 0, padding: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre' }}>{`FROM python:3.11-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/build/deps -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /build/deps /usr/local/lib/python3.11/site-packages
COPY app/ ./app/
COPY artifacts/ ./artifacts/

RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
# Credit models: log every prediction for audit trail (required by ECOA)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000",
     "--workers", "2", "--access-log"]`}</pre>
          </div>
        </div>

        {/* ── Cell 12 — K8s manifest ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('loan_cell12') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
              border: `1px solid ${state.cellsDone.includes('loan_cell12') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell12') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('loan_cell12') ? <CheckMark /> : '12'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Kubernetes Manifest</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>deployment + HPA · compliance annotations · liveness/readiness probes</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>yaml</span>
              {!state.cellsDone.includes('loan_cell12') ? (
                <button onClick={() => markCellDone('loan_cell12')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Mark as read <CheckMark /></button>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
            <pre style={{ margin: 0, padding: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre' }}>{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: loan-default-api
  labels: { app: loan-default-api, version: "1.0.0" }
  annotations:
    # ECOA compliance: record model version in deployment metadata
    compliance/model-version: "1.0.0"
    compliance/disparate-impact-tested: "true"
    compliance/ecoa-model-card: "s3://model-artifacts/loan-model-card-v1.0.0.pdf"
spec:
  replicas: 2
  selector:
    matchLabels: { app: loan-default-api }
  template:
    metadata:
      labels: { app: loan-default-api, version: "1.0.0" }
    spec:
      containers:
        - name: loan-default-api
          image: <ECR>.dkr.ecr.us-east-1.amazonaws.com/loan-default-api:1.0.0
          ports: [{ containerPort: 8000 }]
          resources:
            requests: { cpu: "250m", memory: "512Mi" }
            limits:   { cpu: "1000m", memory: "1Gi" }
          livenessProbe:
            httpGet: { path: /health, port: 8000 }
            initialDelaySeconds: 10
          readinessProbe:
            httpGet: { path: /health, port: 8000 }
            initialDelaySeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: loan-default-api-hpa }
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: loan-default-api
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }`}</pre>
          </div>
        </div>

        {/* ── Cell 13 — CI/CD ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('loan_cell13') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
              border: `1px solid ${state.cellsDone.includes('loan_cell13') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell13') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('loan_cell13') ? <CheckMark /> : '13'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>CI/CD Pipeline</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>compliance-check gate · model card verification · ECR push · EKS rollout</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>yaml</span>
              {!state.cellsDone.includes('loan_cell13') ? (
                <button onClick={() => markCellDone('loan_cell13')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Mark as read <CheckMark /></button>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
            <pre style={{ margin: 0, padding: '16px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre' }}>{`# .github/workflows/deploy-loan-model.yml
name: Loan Model — Build and Deploy

on:
  push:
    branches: [main]
    paths: ["app/**", "artifacts/**", "Dockerfile"]

jobs:
  compliance-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Verify model card exists
        run: |
          [ -f "artifacts/model_card.json" ] || (echo "Model card missing — ECOA requires documentation before deployment" && exit 1)
      - name: Verify disparate impact test results
        run: |
          python scripts/check_disparate_impact.py artifacts/model_card.json

  test:
    needs: compliance-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install -r requirements.txt && pip install pytest
      - run: pytest tests/ -v

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Build and push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin \${{ secrets.ECR_REGISTRY }}
          docker build -t loan-default-api:\${{ github.sha }} .
          docker push \${{ secrets.ECR_REGISTRY }}/loan-default-api:\${{ github.sha }}
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name prod-cluster --region us-east-1
          kubectl set image deployment/loan-default-api loan-default-api=\${{ secrets.ECR_REGISTRY }}/loan-default-api:\${{ github.sha }}
          kubectl rollout status deployment/loan-default-api`}</pre>
          </div>
        </div>

        {/* ── Cell 14 — Regulatory Model Card ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('loan_cell14') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
              border: `1px solid ${state.cellsDone.includes('loan_cell14') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('loan_cell14') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('loan_cell14') ? <CheckMark /> : '14'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Regulatory Model Card</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>ECOA required · training demographics · disparate impact results · appeal process</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', borderLeft: '3px solid var(--prime)', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', fontWeight: 700 }}>ECOA Model Card — Loan Default Predictor v1.0.0</span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Model Name', value: 'Loan Default Predictor v1.0.0' },
                { label: 'Training Data', value: '800-row synthetic dataset. Demographics: RENT 45%, OWN 20%, MORTGAGE 35%. Employment length median 3.5yr. Annual income $25k–$500k log-normal.' },
                { label: 'Disparate Impact Test', value: '4/5ths rule applied to denial rates by home_ownership and employment_length quartile. RENT group denial rate / OWN group denial rate = 0.81 (passes threshold ≥0.80). Q1 employment / Q4 employment = 0.78 (marginally fails — business necessity documented).' },
                { label: 'Decision Threshold', value: '>0.35 → DENY, 0.25–0.35 → REVIEW, <0.25 → APPROVE. Threshold selected to minimize FN cost ($5k) vs FP cost ($200) while maintaining 4/5ths compliance.' },
                { label: 'Monitoring Cadence', value: 'PSI and KS test computed weekly on income and credit score. Alert if PSI > 0.20 on any feature. Disparate impact re-tested monthly. Model retrained if PSI > 0.25 or monthly disparate impact fails.' },
                { label: 'Known Limitations', value: 'Synthetic training data — real deployment requires retraining on actual applicant data. Employment length proxy audit may not capture all age-proxying. Credit score itself is a composite that may embed historical bias.' },
                { label: 'Appeal Process', value: 'Applicants denied automatically (DENY decision) receive written notice of adverse action within 30 days (ECOA §701). Manual review available on request.' },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{row.label}</div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', color: 'var(--ink-mid)', lineHeight: 1.6 }}>{row.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--rim)', display: 'flex', justifyContent: 'flex-end' }}>
              {!state.cellsDone.includes('loan_cell14') ? (
                <button onClick={() => markCellDone('loan_cell14')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Mark as read <CheckMark /></button>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Phase 4 completion card ── */}
        {phase4Complete && (
          <div style={{ border: '1px solid rgba(52,211,153,0.35)', borderRadius: '10px', padding: '20px', background: 'rgba(52,211,153,0.06)', textAlign: 'center', marginTop: '8px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--mint)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em', marginBottom: '6px' }}>Loan Default Lab Complete</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
              Full credit risk pipeline — schema inspection, fairness audit, model training, ECOA threshold analysis, monitoring with disparate impact framing, and a regulatory model card. This is what a credit model review actually looks like.
            </p>
          </div>
        )}

      </div>

    </div>
  )
}
