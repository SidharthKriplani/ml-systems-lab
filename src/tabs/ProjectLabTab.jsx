import { useState, useEffect } from 'react'
import { CheckMark, CrossMark, WarningMark } from '../components/Icons'
import PythonCell from '../components/PythonCell.jsx'

// ─── LocalStorage key ─────────────────────────────────────────────────────────
const LS_KEY = 'msl_projectlab_churn_data'

// ─── Judgment checkpoint data ─────────────────────────────────────────────────
const CHECKPOINT_1 = {
  id: 'cp1',
  question: 'You\'ve run schema inspection and found: (1) "TotalCharges" is stored as object/string despite being numeric, (2) "tenure" has 0s that likely represent new customers, (3) "SeniorCitizen" is coded 0/1 not as a boolean, (4) ~11 rows with blank TotalCharges. Which two issues would you fix before any EDA or model training?',
  options: [
    { id: 'a', text: 'Fix TotalCharges dtype (string → float) and drop the 11 blank rows immediately. Dtype errors corrupt any numeric computation; blanks are too few to impute reliably.' },
    { id: 'b', text: 'Recode SeniorCitizen to True/False and re-label tenure=0 as "new_customer" category. Semantic clarity improves model interpretability and helps tree splits.' },
    { id: 'c', text: 'Fix TotalCharges dtype and leave tenure=0 as-is — it carries real signal (new customers churn at different rates). Drop only if it\'s a data entry error, not a business state.' },
    { id: 'd', text: 'Impute the 11 blank TotalCharges with median, then fix the dtype. Missing data must be handled before type casting.' },
  ],
  correct: 'c',
  explanation: 'TotalCharges as object is a silent killer — every numeric operation (correlation, scaling, model training) will fail or silently produce NaN. That\'s the critical fix. The 11 blanks are likely new customers with zero charges but non-null tenure — inspect them first (they\'re probably the tenure=0 group). tenure=0 is not an error; new customers churn at high rates, so it\'s a legitimate and important segment. Recoding SeniorCitizen is cosmetic. The production lesson: fix dtypes first, treat apparent anomalies as signal until proven otherwise.',
}

const CHECKPOINT_2 = {
  id: 'cp2',
  question: 'The correlation heatmap shows "TotalCharges" and "tenure" are highly correlated (r ≈ 0.83), and "MonthlyCharges" and "TotalCharges" are also correlated (r ≈ 0.65). You\'re building a logistic regression to predict churn. What do you do?',
  options: [
    { id: 'a', text: 'Drop TotalCharges entirely — it\'s the most redundant of the three (it\'s basically tenure × MonthlyCharges). Retain MonthlyCharges and tenure as they carry distinct signals.' },
    { id: 'b', text: 'Keep all three. High correlation doesn\'t automatically mean you should drop — logistic regression is sensitive to multicollinearity (inflated std errors, unstable coefficients), but tree-based models are not. Decide based on your model class.' },
    { id: 'c', text: 'Engineer a new feature: avg_monthly = TotalCharges / tenure, then drop TotalCharges and tenure separately. This collapses the multicollinearity into one semantically meaningful feature.' },
    { id: 'd', text: 'Apply PCA to the three correlated features and use the first principal component. This fully removes multicollinearity while retaining variance.' },
  ],
  correct: 'b',
  explanation: 'This is a model-class question, not a correlation question. For logistic regression: high multicollinearity inflates coefficient standard errors, makes coefficients unstable across samples, and distorts feature importance — dropping or engineering is the right call. For tree-based models (Random Forest, XGBoost): each split is univariate; multicollinearity doesn\'t affect split quality, only how importance is allocated across correlated features. The production rule: check your model class before dropping correlated features. Option A is defensible for LR but wrong as a universal rule. Option C (avg_monthly) is a clever domain-aware feature worth trying. PCA destroys interpretability — rarely the right call in production churn models.',
}

const CHECKPOINT_3 = {
  id: 'cp3',
  question: 'You computed avg_spend_last_7d — the customer\'s average daily spend over the 7 days before the observation date — using the FULL dataset before splitting into train/test. Your model\'s AUC jumped from 0.76 to 0.89. Does this feature constitute data leakage?',
  options: [
    { id: 'a', text: 'Yes — leakage. The feature was computed on the full dataset including test rows. The model has indirectly seen test-set spend patterns during training, inflating AUC.' },
    { id: 'b', text: 'No — it\'s fine. The feature uses only historical spend data (7 days before observation), which would be available at prediction time. Temporal correctness is all that matters.' },
    { id: 'c', text: 'Depends — if the 7-day window uses only pre-observation data, there\'s no target leakage. But computing it on the full dataset before splitting is still train-test leakage: test rows influenced the aggregation.' },
    { id: 'd', text: 'No — leakage only occurs when future target values are used. Spend data is a feature, not the target. This is standard feature engineering practice.' },
  ],
  correct: 'c',
  explanation: 'This is train-test contamination, not target leakage — but it\'s still leakage. The issue: when you compute avg_spend_last_7d on the full dataset, test rows contribute to the global mean and variance used in aggregation (if using group-based stats). More critically, if the computation involves any aggregation that crosses the train/test boundary (e.g. user-level rolling windows that span both splits), test-set information leaks into training features. The AUC jump from 0.76 to 0.89 is the red flag — a legitimate feature rarely produces a 13-point gain. In production, this feature would be computed on a rolling basis from data available at inference time only. The fix: split first, then compute features independently on each fold. For time series data, always use a time-based split and compute features only from data before the split point.',
}

const CHECKPOINT_4 = {
  id: 'cp4',
  question: 'Your GradientBoosting churn model is trained. Val set: AUC=0.81, ECE=0.12 (before Platt scaling). The downstream system gates retention offers on raw probabilities — customers with score > 0.6 get an offer. P95 inference latency=38ms on 2 vCPUs. Class imbalance in training data is 1:4. Do you ship this model?',
  options: [
    { id: 'a', text: 'Ship — AUC 0.81 is strong. 38ms is within SLA. Class imbalance 1:4 was handled with class_weight during training. System is ready.' },
    { id: 'b', text: 'Block — ECE=0.12 makes the probability threshold (>0.6) unreliable. The system gates on raw probabilities; an uncalibrated model will systematically mis-trigger. Run Platt scaling, re-measure ECE < 0.05 in the 0.5-0.7 range, then ship.' },
    { id: 'c', text: 'Block — 38ms P95 is too slow for a real-time churn scoring system. Optimize the model or switch to LogisticRegression.' },
    { id: 'd', text: 'Ship with caveats — document the calibration gap. AUC 0.81 means ranking is reliable; just switch to a relative threshold (top-20% of scores) instead of absolute >0.6.' },
  ],
  correct: 'b',
  explanation: 'The blocker is the downstream usage pattern, not the AUC. When business logic is gated on raw probabilities (score > 0.6 → offer), ECE directly determines whether that threshold behaves as designed. ECE=0.12 means the model\'s predicted 60% confidence maps to actual churn rates anywhere from 48-72% — the threshold is effectively arbitrary. Correct call: run Platt scaling (Cell 10), measure ECE specifically in the 0.5-0.7 bucket, ship if < 0.05. Option D is valid only if the system is redesigned to use ranking — but the problem states absolute thresholds. Option A ignores how the model will actually be used. Option C: 38ms is fine for batch or near-real-time scoring.',
}

const CHECKPOINT_5 = {
  id: 'cp5',
  question: 'PSI=0.18 on tenure (amber — above 0.10 monitor threshold), KS test p=0.03 on monthly_charges (statistically significant at α=0.05). P95 inference latency unchanged at 38ms. No upstream schema changes in the last 72 hours. No known business events. Both signals appeared simultaneously 6 hours after your last model deployment. What do you do?',
  options: [
    { id: 'a', text: 'Page the on-call engineer immediately. Two independent drift signals firing simultaneously post-deployment is a pattern — not noise. Investigate whether the deployment changed preprocessing behaviour before asserting it is real data drift.' },
    { id: 'b', text: 'Log and watch for 24 hours. PSI=0.18 is amber not red (>0.25), and KS significance alone does not confirm harmful drift. A single monitoring window is not enough signal.' },
    { id: 'c', text: 'Auto-rollback the model deployment immediately. Two signals = confirmed drift. Roll back to the prior version.' },
    { id: 'd', text: 'Disable drift alerting for 48 hours to establish a new baseline — the deployment may have legitimately shifted the score distribution.' },
  ],
  correct: 'a',
  explanation: 'Two independent signals firing simultaneously within hours of a deployment is the highest-priority pattern in production ML monitoring. PSI=0.18 alone is amber (watch); KS p=0.03 alone is a flag worth investigating; together immediately post-deployment they strongly suggest the deployment changed something — preprocessing logic, feature scaling, a code path — rather than organic data drift. The correct call is page + investigate, not rollback (rollback before diagnosis is expensive and may be wrong) and not watch-and-wait (simultaneous signals post-deployment is not a case for patience). Option D is dangerous — disabling alerting on a new baseline hides real future drift.',
}

const CELL_11_CODE = `# Cell 11 — Population Stability Index (PSI)
import numpy as np
import pandas as pd

np.random.seed(42)
n = 600
tenure     = np.random.exponential(25, n).clip(1, 72).round(1)
monthly    = np.random.normal(65, 25, n).clip(18, 120).round(2)
contract_c = np.random.choice([0, 1, 2], n, p=[0.55, 0.24, 0.21])
p_churn    = (0.55 - 0.006*tenure - 0.15*(contract_c > 0) + np.random.normal(0, 0.08, n)).clip(0.04, 0.9)
churn      = (np.random.uniform(size=n) < p_churn).astype(int)

# Simulate a "drifted" production sample — higher tenure, slightly different charges
np.random.seed(99)
n_prod = 300
tenure_prod  = np.random.exponential(32, n_prod).clip(1, 72).round(1)
monthly_prod = np.random.normal(70, 27, n_prod).clip(18, 120).round(2)
contract_prod = np.random.choice([0, 1, 2], n_prod, p=[0.50, 0.27, 0.23])

def compute_psi(expected, actual, n_bins=10):
    bins = np.linspace(min(expected.min(), actual.min()),
                       max(expected.max(), actual.max()) + 1e-9, n_bins + 1)
    exp_counts, _ = np.histogram(expected, bins=bins)
    act_counts, _ = np.histogram(actual, bins=bins)
    exp_pct = (exp_counts + 1e-6) / len(expected)
    act_pct = (act_counts + 1e-6) / len(actual)
    psi_vals = (act_pct - exp_pct) * np.log(act_pct / exp_pct)
    return psi_vals.sum()

features = {
    'tenure':        (tenure,  tenure_prod),
    'monthly_charges': (monthly, monthly_prod),
    'contract_code': (contract_c.astype(float), contract_prod.astype(float)),
}

print("=" * 56)
print("POPULATION STABILITY INDEX (PSI)  —  FEATURE DRIFT")
print("=" * 56)
print(f"  {'Feature':<22}  {'PSI':>8}  {'Status'}")
print("  " + "─"*50)
for feat, (exp, act) in features.items():
    psi = compute_psi(exp, act)
    if psi < 0.10:   status = "✓ Stable      (<0.10)"
    elif psi < 0.25: status = "⚠ Monitor     (0.10–0.25)"
    else:            status = "✗ Retrain now (>0.25)"
    print(f"  {feat:<22}  {psi:>8.4f}  {status}")

print()
print("─── PSI interpretation ───")
print("  < 0.10  → distribution is stable. No action.")
print("  0.10–0.25 → moderate shift. Increase monitoring frequency.")
print("  > 0.25  → significant shift. Trigger retraining pipeline.")
print()
print("─── What PSI measures ───")
print("  PSI quantifies how much a feature's distribution has shifted")
print("  between training (expected) and production (actual).")
print("  It does NOT tell you whether model performance has dropped —")
print("  only that inputs have changed. A feature can drift without")
print("  harming AUC if it is not predictive. Track PSI alongside")
print("  performance metrics, not as a standalone signal.")
`

const CELL_12_CODE = `# Cell 12 — Kolmogorov-Smirnov Test for Distribution Shift
import numpy as np
from scipy import stats

np.random.seed(42)
n = 600
tenure     = np.random.exponential(25, n).clip(1, 72).round(1)
monthly    = np.random.normal(65, 25, n).clip(18, 120).round(2)
contract_c = np.random.choice([0, 1, 2], n, p=[0.55, 0.24, 0.21])

np.random.seed(99)
n_prod = 300
tenure_prod  = np.random.exponential(32, n_prod).clip(1, 72).round(1)
monthly_prod = np.random.normal(70, 27, n_prod).clip(18, 120).round(2)
contract_prod = np.random.choice([0, 1, 2], n_prod, p=[0.50, 0.27, 0.23]).astype(float)

features = {
    'tenure':          (tenure,       tenure_prod),
    'monthly_charges': (monthly,      monthly_prod),
    'contract_code':   (contract_c.astype(float), contract_prod),
}

print("=" * 64)
print("KOLMOGOROV-SMIRNOV TEST  —  DISTRIBUTION SHIFT DETECTION")
print("=" * 64)
print(f"  {'Feature':<22}  {'KS stat':>9}  {'p-value':>10}  {'Result (α=0.05)'}")
print("  " + "─"*58)
for feat, (train, prod) in features.items():
    stat, pval = stats.ks_2samp(train, prod)
    result = "<CrossMark />Significant shift" if pval < 0.05 else "<CheckMark />No significant shift"
    print(f"  {feat:<22}  {stat:>9.4f}  {pval:>10.4f}  {result}")

print()
print("─── What KS tests ───")
print("  The two-sample KS test measures the maximum distance between")
print("  two empirical CDFs. H₀: both samples come from the same")
print("  distribution. p < 0.05 → reject H₀ → statistically significant")
print("  shift detected.")
print()
print("─── KS vs PSI ───")
print("  PSI: magnitude of shift, binned. Good for monitoring dashboards.")
print("  KS:  statistical significance of shift. Good for automated alerts.")
print("  Use both: PSI gives you 'how much', KS gives you 'is this real'.")
print("  A large dataset makes KS p-values tiny even for trivial shifts —")
print("  always check the KS statistic alongside p-value.")
`

const CELL_13_CODE = `# Cell 13 — Prediction Drift: Score Distribution Shift
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier

np.random.seed(42)
n = 600
tenure     = np.random.exponential(25, n).clip(1, 72).round(1)
monthly    = np.random.normal(65, 25, n).clip(18, 120).round(2)
contract_c = np.random.choice([0, 1, 2], n, p=[0.55, 0.24, 0.21])
p_churn    = (0.55 - 0.006*tenure - 0.15*(contract_c > 0) + np.random.normal(0, 0.08, n)).clip(0.04, 0.9)
churn      = (np.random.uniform(size=n) < p_churn).astype(int)

X = np.column_stack([tenure, monthly, contract_c])
y = churn
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

clf = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42)
clf.fit(X_train, y_train)

# Simulate a production drift — customers have shifted to longer tenures
np.random.seed(99)
n_prod = 300
tenure_prod  = np.random.exponential(32, n_prod).clip(1, 72).round(1)
monthly_prod = np.random.normal(70, 27, n_prod).clip(18, 120).round(2)
contract_prod = np.random.choice([0, 1, 2], n_prod, p=[0.50, 0.27, 0.23])
X_prod = np.column_stack([tenure_prod, monthly_prod, contract_prod])

scores_val  = clf.predict_proba(X_val)[:, 1]
scores_prod = clf.predict_proba(X_prod)[:, 1]

fig, axes = plt.subplots(1, 2, figsize=(12, 4))

axes[0].hist(scores_val,  bins=20, color='#6b7280', alpha=0.7, edgecolor='none', label='Validation (training dist.)')
axes[0].hist(scores_prod, bins=20, color='#f0a500', alpha=0.7, edgecolor='none', label='Production (shifted dist.)')
axes[0].set_title('Score Distribution Overlap', fontsize=11, fontweight='bold')
axes[0].set_xlabel('Predicted churn probability', fontsize=9)
axes[0].legend(fontsize=8)
axes[0].grid(True, alpha=0.2)

val_sorted  = np.sort(scores_val)
prod_sorted = np.sort(scores_prod)
axes[1].plot(val_sorted,  np.linspace(0, 1, len(val_sorted)),  color='#6b7280', lw=2, label='Validation CDF')
axes[1].plot(prod_sorted, np.linspace(0, 1, len(prod_sorted)), color='#f0a500', lw=2, label='Production CDF')
axes[1].set_title('Cumulative Score Distribution', fontsize=11, fontweight='bold')
axes[1].set_xlabel('Predicted churn probability', fontsize=9)
axes[1].legend(fontsize=8)
axes[1].grid(True, alpha=0.2)

plt.tight_layout()
plt.show()

print(f"Validation  — mean score: {scores_val.mean():.4f}  std: {scores_val.std():.4f}")
print(f"Production  — mean score: {scores_prod.mean():.4f}  std: {scores_prod.std():.4f}")
print(f"Mean shift: {scores_prod.mean() - scores_val.mean():+.4f}")
print()
print("─── What prediction drift tells you ───")
print("  Score distribution shift → model is seeing different inputs.")
print("  Shift LEFT (lower scores): customers churn less → business improved?")
print("  or model degrades on high-risk segment.")
print("  Shift RIGHT (higher scores): more customers scored as high-risk →")
print("  true drift OR preprocessing change introduced bias.")
print("  Always correlate prediction drift with feature PSI to diagnose cause.")
`

const CELL_14_CODE = `# Cell 14 — Label Drift: Delayed Feedback and Proxy Signals
import numpy as np
import matplotlib.pyplot as plt

# Label drift is the hardest monitoring problem in production ML:
# ground truth labels arrive LATE (days, weeks, months after prediction).
# You cannot directly measure AUC drift in real-time.
# Solution: use PROXY SIGNALS that correlate with labels and arrive sooner.

np.random.seed(42)
days = 60

# Simulate true churn rate over 60 days (ground truth — delayed by 30 days)
true_churn_rate = 0.27 + 0.002 * np.arange(days) + np.random.normal(0, 0.015, days)
true_churn_rate = true_churn_rate.clip(0.15, 0.60)

# Proxy signal 1: support ticket rate (available same day, correlates with churn)
proxy_support = 0.18 + 0.0015 * np.arange(days) + np.random.normal(0, 0.02, days)

# Proxy signal 2: login frequency drop (available same day)
proxy_login_drop = 0.10 + 0.0012 * np.arange(days) + np.random.normal(0, 0.01, days)

fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))

# Left: label delay problem
axes[0].plot(range(days), true_churn_rate, color='#f0a500', lw=2, label='True churn rate (ground truth)')
axes[0].axvline(30, color='#6b7280', lw=1.5, linestyle='--', label='Labels available (30-day lag)')
axes[0].fill_betweenx([0, 1], 0, 30, alpha=0.07, color='#f97316')
axes[0].text(15, 0.50, 'BLIND\\nZONE', ha='center', va='center', fontsize=9,
             color='#f97316', fontweight='bold', fontfamily='monospace')
axes[0].set_ylim(0.10, 0.65)
axes[0].set_title('Label Delay — The Blind Zone', fontsize=11, fontweight='bold')
axes[0].set_xlabel('Day', fontsize=9)
axes[0].set_ylabel('Churn rate', fontsize=9)
axes[0].legend(fontsize=8)
axes[0].grid(True, alpha=0.2)

# Right: proxy signals bridge the gap
axes[1].plot(range(days), true_churn_rate,  color='#f0a500', lw=2, label='True churn (lagged)')
axes[1].plot(range(days), proxy_support,    color='#6b7280', lw=1.5, linestyle='--', label='Proxy: support tickets')
axes[1].plot(range(days), proxy_login_drop, color='#374151', lw=1.5, linestyle=':',  label='Proxy: login drop rate')
axes[1].set_ylim(0.05, 0.65)
axes[1].set_title('Proxy Signals Bridge the Blind Zone', fontsize=11, fontweight='bold')
axes[1].set_xlabel('Day', fontsize=9)
axes[1].legend(fontsize=8)
axes[1].grid(True, alpha=0.2)

plt.tight_layout()
plt.show()

print("─── Label drift in production ───")
print("  Churn labels arrive 30 days after prediction (definition: cancelled")
print("  within 30 days of observation). You cannot measure real AUC until")
print("  then — but you need to detect model degradation NOW.")
print()
print("─── Proxy signal strategy ───")
print("  Identify signals that correlate with labels and arrive sooner:")
print("  - Support ticket rate → correlates with churn intent")
print("  - Login frequency drop → leading indicator of disengagement")
print("  - NPS survey score → lagged but less delayed than churn label")
print("  Track proxy correlation coefficient over time. If proxy-label")
print("  correlation drops, the proxies themselves may have drifted.")
`


// ─── Python cell code strings ─────────────────────────────────────────────────

const CELL_1_CODE = `# Cell 1 — Schema Inspection
# Loads the Telco Churn dataset and inspects structure, dtypes, nulls, cardinality

import numpy as np
import pandas as pd
import io

# Telco Churn — 7043 customers, 21 columns
# Bundled as CSV text to avoid network dependency
CSV = """customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85,No
5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5,No
3668-QPYBK,Male,0,No,No,2,Yes,No,DSL,Yes,Yes,No,No,No,No,Month-to-month,Yes,Mailed check,53.85,108.15,Yes
7795-CFOCW,Male,0,No,No,45,No,No phone service,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer (automatic),42.3,1840.75,No
9237-HQITU,Female,0,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.7,151.65,Yes
9305-CDSKC,Female,0,No,No,8,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Electronic check,99.65,820.5,Yes
1452-KIOVK,Male,0,No,Yes,22,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,No,Month-to-month,Yes,Credit card (automatic),89.1,1949.4,No
6713-OKOMC,Female,0,No,No,10,No,No phone service,DSL,Yes,No,No,No,No,No,Month-to-month,No,Mailed check,29.75,301.9,No
7892-POOKP,Female,0,Yes,No,28,Yes,Yes,Fiber optic,No,No,Yes,Yes,Yes,Yes,Month-to-month,Yes,Electronic check,104.8,3046.05,Yes
6388-TABGU,Male,0,No,Yes,62,Yes,No,DSL,Yes,Yes,No,No,No,No,One year,No,Bank transfer (automatic),56.15,3487.95,No
9763-GRSKD,Male,0,Yes,Yes,13,Yes,No,DSL,Yes,No,No,No,No,No,Month-to-month,Yes,Mailed check,49.95,587.45,Yes
7469-LKBCI,Male,0,No,No,16,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Two year,No,Credit card (automatic),18.95,326.8,No
8091-TTVAX,Male,0,Yes,No,58,Yes,Yes,Fiber optic,No,Yes,Yes,No,Yes,Yes,One year,No,Credit card (automatic),100.35,5979.55,No
0280-XJGEX,Male,0,No,No,49,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Bank transfer (automatic),103.7,5100.75,Yes
5129-JLPIS,Male,0,No,No,25,Yes,No,Fiber optic,Yes,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,79.85,2100.0,No
3655-SNQYZ,Female,0,Yes,No,69,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Credit card (automatic),105.95,7382.25,No
8191-XWSZG,Female,0,No,No,52,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,One year,No,Mailed check,20.65,1022.95,No
9959-WOFKT,Male,0,No,Yes,71,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Bank transfer (automatic),113.25,8107.9,No
4190-MFLUW,Female,0,Yes,No,10,Yes,No,DSL,No,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,59.9,541.9,Yes
4183-MYFRB,Female,0,No,No,21,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,69.65,1397.475,No
"""

df = pd.read_csv(io.StringIO(CSV))

print("=" * 52)
print("TELCO CHURN — SCHEMA INSPECTION")
print("=" * 52)
print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
print()

print("─── Dtypes ───")
for col, dtype in df.dtypes.items():
    print(f"  {col:<22} {str(dtype):<10}")

print()
print("─── Null / blank counts ───")
nulls = df.isnull().sum()
blanks = (df == ' ').sum()
for col in df.columns:
    total_missing = nulls[col] + blanks[col]
    if total_missing > 0:
        print(f"  {col:<22} {total_missing} missing")
if nulls.sum() + blanks.sum() == 0:
    print("  No nulls detected in this sample.")
    print("  Note: Full dataset has ~11 blank TotalCharges rows.")

print()
print("─── Cardinality (categorical cols) ───")
cat_cols = df.select_dtypes(include='object').columns
for col in cat_cols:
    n = df[col].nunique()
    if n <= 6:
        vals = df[col].unique().tolist()
        print(f"  {col:<22} {n} unique: {vals}")
    else:
        print(f"  {col:<22} {n} unique (high cardinality)")

print()
print("─── Numeric summary ───")
num_cols = ['tenure', 'MonthlyCharges']
num_df = df[num_cols].describe().round(2)
print(num_df.to_string())

print()
print("─── Churn distribution ───")
churn_counts = df['Churn'].value_counts()
churn_pct = df['Churn'].value_counts(normalize=True).mul(100).round(1)
for label in churn_counts.index:
    print(f"  {label:<6}  n={churn_counts[label]}  ({churn_pct[label]}%)")
`

const CELL_2_CODE = `# Cell 2 — EDA: Distributions, Class Balance, Key Feature Patterns
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import io

CSV = """customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85,No
5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5,No
3668-QPYBK,Male,0,No,No,2,Yes,No,DSL,Yes,Yes,No,No,No,No,Month-to-month,Yes,Mailed check,53.85,108.15,Yes
7795-CFOCW,Male,0,No,No,45,No,No phone service,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer (automatic),42.3,1840.75,No
9237-HQITU,Female,0,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.7,151.65,Yes
9305-CDSKC,Female,0,No,No,8,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Electronic check,99.65,820.5,Yes
1452-KIOVK,Male,0,No,Yes,22,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,No,Month-to-month,Yes,Credit card (automatic),89.1,1949.4,No
6713-OKOMC,Female,0,No,No,10,No,No phone service,DSL,Yes,No,No,No,No,No,Month-to-month,No,Mailed check,29.75,301.9,No
7892-POOKP,Female,0,Yes,No,28,Yes,Yes,Fiber optic,No,No,Yes,Yes,Yes,Yes,Month-to-month,Yes,Electronic check,104.8,3046.05,Yes
6388-TABGU,Male,0,No,Yes,62,Yes,No,DSL,Yes,Yes,No,No,No,No,One year,No,Bank transfer (automatic),56.15,3487.95,No
9763-GRSKD,Male,0,Yes,Yes,13,Yes,No,DSL,Yes,No,No,No,No,No,Month-to-month,Yes,Mailed check,49.95,587.45,Yes
7469-LKBCI,Male,0,No,No,16,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Two year,No,Credit card (automatic),18.95,326.8,No
8091-TTVAX,Male,0,Yes,No,58,Yes,Yes,Fiber optic,No,Yes,Yes,No,Yes,Yes,One year,No,Credit card (automatic),100.35,5979.55,No
0280-XJGEX,Male,0,No,No,49,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Bank transfer (automatic),103.7,5100.75,Yes
5129-JLPIS,Male,0,No,No,25,Yes,No,Fiber optic,Yes,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,79.85,2100.0,No
3655-SNQYZ,Female,0,Yes,No,69,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Credit card (automatic),105.95,7382.25,No
8191-XWSZG,Female,0,No,No,52,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,One year,No,Mailed check,20.65,1022.95,No
9959-WOFKT,Male,0,No,Yes,71,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Bank transfer (automatic),113.25,8107.9,No
4190-MFLUW,Female,0,Yes,No,10,Yes,No,DSL,No,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,59.9,541.9,Yes
4183-MYFRB,Female,0,No,No,21,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,69.65,1397.475,No
"""

df = pd.read_csv(io.StringIO(CSV))
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['ChurnBinary'] = (df['Churn'] == 'Yes').astype(int)

churn_yes = df[df['Churn'] == 'Yes']
churn_no  = df[df['Churn'] == 'No']

fig = plt.figure(figsize=(13, 8))
gs  = gridspec.GridSpec(2, 3, figure=fig, hspace=0.45, wspace=0.38)

# ── 1. Churn balance (pie)
ax1 = fig.add_subplot(gs[0, 0])
counts = df['Churn'].value_counts()
colors_pie = ['#f0a500', '#374151']
ax1.pie(counts, labels=counts.index, autopct='%1.1f%%', colors=colors_pie,
        startangle=90, textprops={'fontsize': 10})
ax1.set_title('Class Balance', fontsize=11, fontweight='bold')

# ── 2. Tenure distribution by churn
ax2 = fig.add_subplot(gs[0, 1])
ax2.hist(churn_no['tenure'],  bins=8, alpha=0.7, label='No Churn',  color='#6b7280', edgecolor='none')
ax2.hist(churn_yes['tenure'], bins=8, alpha=0.8, label='Churned',   color='#f0a500', edgecolor='none')
ax2.set_title('Tenure by Churn', fontsize=11, fontweight='bold')
ax2.set_xlabel('Months', fontsize=9)
ax2.legend(fontsize=8)
ax2.grid(True, alpha=0.2)

# ── 3. MonthlyCharges distribution by churn
ax3 = fig.add_subplot(gs[0, 2])
ax3.hist(churn_no['MonthlyCharges'],  bins=8, alpha=0.7, label='No Churn',  color='#6b7280', edgecolor='none')
ax3.hist(churn_yes['MonthlyCharges'], bins=8, alpha=0.8, label='Churned',   color='#f0a500', edgecolor='none')
ax3.set_title('Monthly Charges by Churn', fontsize=11, fontweight='bold')
ax3.set_xlabel('USD / month', fontsize=9)
ax3.legend(fontsize=8)
ax3.grid(True, alpha=0.2)

# ── 4. Contract type churn rate
ax4 = fig.add_subplot(gs[1, 0])
contract_churn = df.groupby('Contract')['ChurnBinary'].mean() * 100
bars = ax4.bar(contract_churn.index, contract_churn.values,
               color=['#f0a500', '#6b7280', '#374151'], edgecolor='none')
ax4.set_title('Churn Rate by Contract', fontsize=11, fontweight='bold')
ax4.set_ylabel('Churn %', fontsize=9)
ax4.set_ylim(0, 100)
for bar, val in zip(bars, contract_churn.values):
    ax4.text(bar.get_x() + bar.get_width()/2, val + 2, f'{val:.0f}%', ha='center', fontsize=9)
ax4.tick_params(axis='x', labelsize=8)
ax4.grid(True, alpha=0.2, axis='y')

# ── 5. Internet service churn rate
ax5 = fig.add_subplot(gs[1, 1])
inet_churn = df.groupby('InternetService')['ChurnBinary'].mean() * 100
colors_inet = ['#f0a500' if v > 40 else '#6b7280' for v in inet_churn.values]
bars5 = ax5.bar(inet_churn.index, inet_churn.values, color=colors_inet, edgecolor='none')
ax5.set_title('Churn Rate by Internet', fontsize=11, fontweight='bold')
ax5.set_ylabel('Churn %', fontsize=9)
ax5.set_ylim(0, 100)
for bar, val in zip(bars5, inet_churn.values):
    ax5.text(bar.get_x() + bar.get_width()/2, val + 2, f'{val:.0f}%', ha='center', fontsize=9)
ax5.tick_params(axis='x', labelsize=8)
ax5.grid(True, alpha=0.2, axis='y')

# ── 6. Avg MonthlyCharges: churned vs retained
ax6 = fig.add_subplot(gs[1, 2])
avg_charges = df.groupby('Churn')['MonthlyCharges'].mean()
bars6 = ax6.bar(avg_charges.index, avg_charges.values,
                color=['#f0a500', '#6b7280'], edgecolor='none')
ax6.set_title('Avg Monthly Charge', fontsize=11, fontweight='bold')
ax6.set_ylabel('USD / month', fontsize=9)
for bar, val in zip(bars6, avg_charges.values):
    ax6.text(bar.get_x() + bar.get_width()/2, val + 0.5, f'\${val:.0f}', ha='center', fontsize=10, fontweight='bold')
ax6.grid(True, alpha=0.2, axis='y')

fig.suptitle('Telco Churn — EDA Dashboard', fontsize=13, fontweight='bold', y=1.01)
plt.tight_layout()

# Print key findings
churn_rate = df['ChurnBinary'].mean() * 100
print(f"Overall churn rate: {churn_rate:.1f}%")
print(f"Avg tenure — Churned: {churn_yes['tenure'].mean():.1f} mo  |  Retained: {churn_no['tenure'].mean():.1f} mo")
print(f"Avg monthly charges — Churned: \${churn_yes['MonthlyCharges'].mean():.2f}  |  Retained: \${churn_no['MonthlyCharges'].mean():.2f}")
print()
print("Contract type churn rates:")
for contract, rate in contract_churn.items():
    print(f"  {contract:<25} {rate:.0f}%")
`

const CELL_3_CODE = `# Cell 3 — Correlation Heatmap + Outlier Flags
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import io

CSV = """customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85,No
5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5,No
3668-QPYBK,Male,0,No,No,2,Yes,No,DSL,Yes,Yes,No,No,No,No,Month-to-month,Yes,Mailed check,53.85,108.15,Yes
7795-CFOCW,Male,0,No,No,45,No,No phone service,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer (automatic),42.3,1840.75,No
9237-HQITU,Female,0,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.7,151.65,Yes
9305-CDSKC,Female,0,No,No,8,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Electronic check,99.65,820.5,Yes
1452-KIOVK,Male,0,No,Yes,22,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,No,Month-to-month,Yes,Credit card (automatic),89.1,1949.4,No
6713-OKOMC,Female,0,No,No,10,No,No phone service,DSL,Yes,No,No,No,No,No,Month-to-month,No,Mailed check,29.75,301.9,No
7892-POOKP,Female,0,Yes,No,28,Yes,Yes,Fiber optic,No,No,Yes,Yes,Yes,Yes,Month-to-month,Yes,Electronic check,104.8,3046.05,Yes
6388-TABGU,Male,0,No,Yes,62,Yes,No,DSL,Yes,Yes,No,No,No,No,One year,No,Bank transfer (automatic),56.15,3487.95,No
9763-GRSKD,Male,0,Yes,Yes,13,Yes,No,DSL,Yes,No,No,No,No,No,Month-to-month,Yes,Mailed check,49.95,587.45,Yes
7469-LKBCI,Male,0,No,No,16,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Two year,No,Credit card (automatic),18.95,326.8,No
8091-TTVAX,Male,0,Yes,No,58,Yes,Yes,Fiber optic,No,Yes,Yes,No,Yes,Yes,One year,No,Credit card (automatic),100.35,5979.55,No
0280-XJGEX,Male,0,No,No,49,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Bank transfer (automatic),103.7,5100.75,Yes
5129-JLPIS,Male,0,No,No,25,Yes,No,Fiber optic,Yes,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,79.85,2100.0,No
3655-SNQYZ,Female,0,Yes,No,69,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Credit card (automatic),105.95,7382.25,No
8191-XWSZG,Female,0,No,No,52,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,One year,No,Mailed check,20.65,1022.95,No
9959-WOFKT,Male,0,No,Yes,71,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Bank transfer (automatic),113.25,8107.9,No
4190-MFLUW,Female,0,Yes,No,10,Yes,No,DSL,No,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,59.9,541.9,Yes
4183-MYFRB,Female,0,No,No,21,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,69.65,1397.475,No
"""

df = pd.read_csv(io.StringIO(CSV))
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['ChurnBinary']  = (df['Churn'] == 'Yes').astype(int)
df['SeniorCitizen'] = df['SeniorCitizen'].astype(float)

num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges', 'SeniorCitizen', 'ChurnBinary']
corr = df[num_cols].corr()

fig, axes = plt.subplots(1, 2, figsize=(13, 5))

# ── Left: Correlation heatmap
ax = axes[0]
im = ax.imshow(corr.values, cmap='RdYlGn', vmin=-1, vmax=1, aspect='auto')
plt.colorbar(im, ax=ax, shrink=0.8)
ax.set_xticks(range(len(num_cols)))
ax.set_yticks(range(len(num_cols)))
ax.set_xticklabels(num_cols, rotation=40, ha='right', fontsize=9)
ax.set_yticklabels(num_cols, fontsize=9)
for i in range(len(num_cols)):
    for j in range(len(num_cols)):
        val = corr.values[i, j]
        color = 'black' if abs(val) < 0.7 else 'white'
        ax.text(j, i, f'{val:.2f}', ha='center', va='center', fontsize=9,
                color=color, fontweight='bold' if abs(val) > 0.5 else 'normal')
ax.set_title('Correlation Matrix', fontsize=12, fontweight='bold')

# ── Right: Outlier flags — IQR method on numeric cols
ax2 = axes[1]
outlier_data = {}
for col in ['tenure', 'MonthlyCharges', 'TotalCharges']:
    q1 = df[col].quantile(0.25)
    q3 = df[col].quantile(0.75)
    iqr = q3 - q1
    lo, hi = q1 - 1.5*iqr, q3 + 1.5*iqr
    n_out = ((df[col] < lo) | (df[col] > hi)).sum()
    outlier_data[col] = n_out

cols_  = list(outlier_data.keys())
counts = list(outlier_data.values())
colors_ = ['#f0a500' if c > 0 else '#374151' for c in counts]
bars = ax2.bar(cols_, counts, color=colors_, edgecolor='none')
ax2.set_title('Outliers by IQR (sample)', fontsize=12, fontweight='bold')
ax2.set_ylabel('Count', fontsize=10)
for bar, val in zip(bars, counts):
    ax2.text(bar.get_x() + bar.get_width()/2, val + 0.03,
             str(val), ha='center', fontsize=11, fontweight='bold')
ax2.grid(True, alpha=0.2, axis='y')

plt.tight_layout()

# Print correlation insights
print("─── Correlation with Churn ───")
churn_corr = corr['ChurnBinary'].drop('ChurnBinary').sort_values(key=abs, ascending=False)
for col, val in churn_corr.items():
    direction = '+' if val > 0 else '-'
    print(f"  {col:<20} r = {val:+.3f}  ({direction}{'high' if abs(val)>0.3 else 'low'} correlation)")

print()
print("─── Feature intercorrelation flags ───")
for i, c1 in enumerate(num_cols):
    for j, c2 in enumerate(num_cols):
        if j <= i:
            continue
        r = corr.loc[c1, c2]
        if abs(r) > 0.6:
            print(f"  {c1} × {c2}: r = {r:.3f}  ← multicollinearity risk")
`

const CELL_4_CODE = `# Cell 4 — Feature Encoding: OHE + Target Encoding
# OneHotEncoder for low-cardinality cols, target encoding for medium-cardinality
import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
import io

CSV = """customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85,No
5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5,No
3668-QPYBK,Male,0,No,No,2,Yes,No,DSL,Yes,Yes,No,No,No,No,Month-to-month,Yes,Mailed check,53.85,108.15,Yes
7795-CFOCW,Male,0,No,No,45,No,No phone service,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer (automatic),42.3,1840.75,No
9237-HQITU,Female,0,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.7,151.65,Yes
9305-CDSKC,Female,0,No,No,8,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Electronic check,99.65,820.5,Yes
1452-KIOVK,Male,0,No,Yes,22,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,No,Month-to-month,Yes,Credit card (automatic),89.1,1949.4,No
6713-OKOMC,Female,0,No,No,10,No,No phone service,DSL,Yes,No,No,No,No,No,Month-to-month,No,Mailed check,29.75,301.9,No
7892-POOKP,Female,0,Yes,No,28,Yes,Yes,Fiber optic,No,No,Yes,Yes,Yes,Yes,Month-to-month,Yes,Electronic check,104.8,3046.05,Yes
6388-TABGU,Male,0,No,Yes,62,Yes,No,DSL,Yes,Yes,No,No,No,No,One year,No,Bank transfer (automatic),56.15,3487.95,No
9763-GRSKD,Male,0,Yes,Yes,13,Yes,No,DSL,Yes,No,No,No,No,No,Month-to-month,Yes,Mailed check,49.95,587.45,Yes
7469-LKBCI,Male,0,No,No,16,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Two year,No,Credit card (automatic),18.95,326.8,No
8091-TTVAX,Male,0,Yes,No,58,Yes,Yes,Fiber optic,No,Yes,Yes,No,Yes,Yes,One year,No,Credit card (automatic),100.35,5979.55,No
0280-XJGEX,Male,0,No,No,49,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Bank transfer (automatic),103.7,5100.75,Yes
5129-JLPIS,Male,0,No,No,25,Yes,No,Fiber optic,Yes,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,79.85,2100.0,No
3655-SNQYZ,Female,0,Yes,No,69,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Credit card (automatic),105.95,7382.25,No
8191-XWSZG,Female,0,No,No,52,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,One year,No,Mailed check,20.65,1022.95,No
9959-WOFKT,Male,0,No,Yes,71,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Bank transfer (automatic),113.25,8107.9,No
4190-MFLUW,Female,0,Yes,No,10,Yes,No,DSL,No,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,59.9,541.9,Yes
4183-MYFRB,Female,0,No,No,21,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,69.65,1397.475,No
"""

df = pd.read_csv(io.StringIO(CSV))
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['ChurnBinary'] = (df['Churn'] == 'Yes').astype(int)

# ── OHE: binary + low-cardinality cols
ohe_cols = ['gender', 'Partner', 'Dependents', 'PhoneService', 'PaperlessBilling']
ohe = OneHotEncoder(sparse_output=False, drop='if_binary', handle_unknown='ignore')
ohe_arr = ohe.fit_transform(df[ohe_cols])
ohe_names = ohe.get_feature_names_out(ohe_cols)
df_ohe = pd.DataFrame(ohe_arr, columns=ohe_names, index=df.index)

# ── Target encoding: medium-cardinality (mean of ChurnBinary per category)
te_cols = ['InternetService', 'Contract', 'PaymentMethod']
df_te = df[te_cols].copy()
for col in te_cols:
    means = df.groupby(col)['ChurnBinary'].mean()
    df_te[f'{col}_te'] = df[col].map(means)
df_te = df_te[[f'{c}_te' for c in te_cols]]

# ── Combine
numeric_keep = ['tenure', 'MonthlyCharges', 'TotalCharges', 'SeniorCitizen']
df_model = pd.concat([df[numeric_keep], df_ohe, df_te], axis=1)

print(f"Shape before encoding: {df[numeric_keep + ohe_cols + te_cols].shape}")
print(f"Shape after encoding:  {df_model.shape}")
print()
print("─── OHE columns created ───")
for col in ohe_names:
    print(f"  {col}")
print()
print("─── Target encoding — Contract (mean churn rate per value) ───")
contract_te = df.groupby('Contract')['ChurnBinary'].mean().sort_values(ascending=False)
for contract, rate in contract_te.items():
    print(f"  {contract:<25}  te = {rate:.3f}  ({rate*100:.0f}% churn rate)")
print()
print("─── Feature matrix preview (first 3 rows, selected cols) ───")
preview_cols = list(ohe_names[:4]) + ['Contract_te', 'tenure', 'MonthlyCharges']
print(df_model[preview_cols].head(3).round(3).to_string())
`

const CELL_5_CODE = `# Cell 5 — Scaling + Imputation
# StandardScaler on numeric features, SimpleImputer for missing values
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import io

CSV = """customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85,No
5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5,No
3668-QPYBK,Male,0,No,No,2,Yes,No,DSL,Yes,Yes,No,No,No,No,Month-to-month,Yes,Mailed check,53.85,108.15,Yes
7795-CFOCW,Male,0,No,No,45,No,No phone service,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer (automatic),42.3,1840.75,No
9237-HQITU,Female,0,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.7,151.65,Yes
9305-CDSKC,Female,0,No,No,8,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Electronic check,99.65,820.5,Yes
1452-KIOVK,Male,0,No,Yes,22,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,No,Month-to-month,Yes,Credit card (automatic),89.1,1949.4,No
6713-OKOMC,Female,0,No,No,10,No,No phone service,DSL,Yes,No,No,No,No,No,Month-to-month,No,Mailed check,29.75,301.9,No
7892-POOKP,Female,0,Yes,No,28,Yes,Yes,Fiber optic,No,No,Yes,Yes,Yes,Yes,Month-to-month,Yes,Electronic check,104.8,3046.05,Yes
6388-TABGU,Male,0,No,Yes,62,Yes,No,DSL,Yes,Yes,No,No,No,No,One year,No,Bank transfer (automatic),56.15,3487.95,No
9763-GRSKD,Male,0,Yes,Yes,13,Yes,No,DSL,Yes,No,No,No,No,No,Month-to-month,Yes,Mailed check,49.95,587.45,Yes
7469-LKBCI,Male,0,No,No,16,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Two year,No,Credit card (automatic),18.95,326.8,No
8091-TTVAX,Male,0,Yes,No,58,Yes,Yes,Fiber optic,No,Yes,Yes,No,Yes,Yes,One year,No,Credit card (automatic),100.35,5979.55,No
0280-XJGEX,Male,0,No,No,49,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Bank transfer (automatic),103.7,5100.75,Yes
5129-JLPIS,Male,0,No,No,25,Yes,No,Fiber optic,Yes,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,79.85,2100.0,No
3655-SNQYZ,Female,0,Yes,No,69,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Credit card (automatic),105.95,7382.25,No
8191-XWSZG,Female,0,No,No,52,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,One year,No,Mailed check,20.65,1022.95,No
9959-WOFKT,Male,0,No,Yes,71,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Bank transfer (automatic),113.25,8107.9,No
4190-MFLUW,Female,0,Yes,No,10,Yes,No,DSL,No,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,59.9,541.9,Yes
4183-MYFRB,Female,0,No,No,21,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,69.65,1397.475,No
"""

df = pd.read_csv(io.StringIO(CSV))
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')

numeric_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']

# ── Imputation (median strategy — robust to skew)
imputer = SimpleImputer(strategy='median')
df_imp = df[numeric_cols].copy()
n_before = df_imp.isnull().sum().sum()
df_imp_arr = imputer.fit_transform(df_imp)
df_imp = pd.DataFrame(df_imp_arr, columns=numeric_cols, index=df.index)
n_after = df_imp.isnull().sum().sum()

# ── Scaling
scaler = StandardScaler()
df_scaled_arr = scaler.fit_transform(df_imp)
df_scaled = pd.DataFrame(df_scaled_arr, columns=[f'{c}_scaled' for c in numeric_cols], index=df.index)

print("─── Imputation ───")
print(f"  Missing values before: {n_before}")
print(f"  Missing values after:  {n_after}")
print(f"  Strategy: median  |  Medians: " + ", ".join(f"{c}={v:.2f}" for c, v in zip(numeric_cols, imputer.statistics_)))
print()
print("─── Scaling (StandardScaler) ───")
print(f"  Means:  " + ", ".join(f"{c}={v:.2f}" for c, v in zip(numeric_cols, scaler.mean_)))
print(f"  Stdevs: " + ", ".join(f"{c}={v:.2f}" for c, v in zip(numeric_cols, scaler.scale_)))
print()
print("─── Before vs After scaling (tenure) ───")
comparison = pd.DataFrame({
    'tenure_raw': df['tenure'].values,
    'tenure_scaled': df_scaled['tenure_scaled'].values
}).head(5).round(3)
print(comparison.to_string(index=False))
print()
print("─── Why median imputation? ───")
print("  Mean imputation is sensitive to outliers.")
print("  Median is robust — for TotalCharges (right-skewed), median imputation")
print("  preserves the central tendency better than mean.")
print("  In production: fit imputer on TRAIN set only, transform both train and test.")
`

const CELL_6_CODE = `# Cell 6 — Permutation Importance
# Train a simple RandomForest, compute permutation importance on held-out rows
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.preprocessing import LabelEncoder
import io

CSV = """customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,OnlineBackup,DeviceProtection,TechSupport,StreamingTV,StreamingMovies,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn
7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85,No
5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5,No
3668-QPYBK,Male,0,No,No,2,Yes,No,DSL,Yes,Yes,No,No,No,No,Month-to-month,Yes,Mailed check,53.85,108.15,Yes
7795-CFOCW,Male,0,No,No,45,No,No phone service,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer (automatic),42.3,1840.75,No
9237-HQITU,Female,0,No,No,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,70.7,151.65,Yes
9305-CDSKC,Female,0,No,No,8,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Electronic check,99.65,820.5,Yes
1452-KIOVK,Male,0,No,Yes,22,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,No,Month-to-month,Yes,Credit card (automatic),89.1,1949.4,No
6713-OKOMC,Female,0,No,No,10,No,No phone service,DSL,Yes,No,No,No,No,No,Month-to-month,No,Mailed check,29.75,301.9,No
7892-POOKP,Female,0,Yes,No,28,Yes,Yes,Fiber optic,No,No,Yes,Yes,Yes,Yes,Month-to-month,Yes,Electronic check,104.8,3046.05,Yes
6388-TABGU,Male,0,No,Yes,62,Yes,No,DSL,Yes,Yes,No,No,No,No,One year,No,Bank transfer (automatic),56.15,3487.95,No
9763-GRSKD,Male,0,Yes,Yes,13,Yes,No,DSL,Yes,No,No,No,No,No,Month-to-month,Yes,Mailed check,49.95,587.45,Yes
7469-LKBCI,Male,0,No,No,16,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,Two year,No,Credit card (automatic),18.95,326.8,No
8091-TTVAX,Male,0,Yes,No,58,Yes,Yes,Fiber optic,No,Yes,Yes,No,Yes,Yes,One year,No,Credit card (automatic),100.35,5979.55,No
0280-XJGEX,Male,0,No,No,49,Yes,Yes,Fiber optic,No,No,Yes,No,Yes,Yes,Month-to-month,Yes,Bank transfer (automatic),103.7,5100.75,Yes
5129-JLPIS,Male,0,No,No,25,Yes,No,Fiber optic,Yes,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,79.85,2100.0,No
3655-SNQYZ,Female,0,Yes,No,69,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Credit card (automatic),105.95,7382.25,No
8191-XWSZG,Female,0,No,No,52,Yes,No,No,No internet service,No internet service,No internet service,No internet service,No internet service,No internet service,One year,No,Mailed check,20.65,1022.95,No
9959-WOFKT,Male,0,No,Yes,71,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Bank transfer (automatic),113.25,8107.9,No
4190-MFLUW,Female,0,Yes,No,10,Yes,No,DSL,No,No,Yes,Yes,No,No,Month-to-month,Yes,Electronic check,59.9,541.9,Yes
4183-MYFRB,Female,0,No,No,21,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,69.65,1397.475,No
"""

df = pd.read_csv(io.StringIO(CSV))
df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce').fillna(0)
df['ChurnBinary']  = (df['Churn'] == 'Yes').astype(int)

# Encode categoricals simply for this demo
cat_cols = ['gender','Partner','Dependents','PhoneService','MultipleLines',
            'InternetService','OnlineSecurity','OnlineBackup','DeviceProtection',
            'TechSupport','StreamingTV','StreamingMovies','Contract',
            'PaperlessBilling','PaymentMethod']
df_enc = df.copy()
for col in cat_cols:
    df_enc[col] = LabelEncoder().fit_transform(df_enc[col].astype(str))

feature_cols = ['tenure','MonthlyCharges','TotalCharges','SeniorCitizen'] + cat_cols
X = df_enc[feature_cols].values
y = df_enc['ChurnBinary'].values

# Small dataset — use all rows for fitting, permutation importance on same rows
rf = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=4)
rf.fit(X, y)

result = permutation_importance(rf, X, y, n_repeats=10, random_state=42)
imp_mean = result.importances_mean
imp_std  = result.importances_std

# Sort
idx_sorted = np.argsort(imp_mean)[::-1]
top_k = 10  # show top 10

fig, ax = plt.subplots(figsize=(9, 5))
bars = ax.barh(
    [feature_cols[i] for i in idx_sorted[:top_k]][::-1],
    [imp_mean[i] for i in idx_sorted[:top_k]][::-1],
    xerr=[imp_std[i] for i in idx_sorted[:top_k]][::-1],
    color='#f0a500', alpha=0.85, edgecolor='none', capsize=3
)
ax.set_xlabel('Mean accuracy decrease on permutation', fontsize=10)
ax.set_title('Permutation Feature Importance (RF, 50 trees)', fontsize=12, fontweight='bold')
ax.grid(True, alpha=0.2, axis='x')
plt.tight_layout()

print("─── Top 10 Features by Permutation Importance ───")
for rank, i in enumerate(idx_sorted[:top_k], 1):
    bar = '█' * max(1, int(imp_mean[i] * 200))
    print(f"  {rank:2}. {feature_cols[i]:<22}  {imp_mean[i]:.4f} ± {imp_std[i]:.4f}  {bar}")
print()
print("─── Interpretation ───")
print("  Permutation importance: shuffle one feature column, measure accuracy drop.")
print("  High importance = model relies heavily on this feature.")
print("  Low/negative = feature adds noise or is redundant given other features.")
print("  Note: correlated features share importance — tenure & TotalCharges")
print("  may both appear lower than expected because each can substitute for the other.")
`

const CELL_7_CODE = `# Cell 7 — Train / Val / Test Split (Stratified)
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

# Synthetic churn dataset — 600 rows, fixed seed, churn-like signal
# Phase 3 cells use synthetic data to enable real ML training in-browser
np.random.seed(42)
n = 600
tenure     = np.random.exponential(25, n).clip(1, 72).round(1)
monthly    = np.random.normal(65, 25, n).clip(18, 120).round(2)
contract_c = np.random.choice([0, 1, 2], n, p=[0.55, 0.24, 0.21])  # 0=mtm, 1=1yr, 2=2yr
p_churn    = (0.55 - 0.006*tenure - 0.15*(contract_c > 0) + np.random.normal(0, 0.08, n)).clip(0.04, 0.9)
churn      = (np.random.uniform(size=n) < p_churn).astype(int)

X = np.column_stack([tenure, monthly, contract_c])
y = churn

# Stratified 60 / 20 / 20 split
X_temp, X_test,  y_temp, y_test  = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
X_train, X_val,  y_train, y_val  = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)
# 0.25 of 0.80 = 0.20 of total

print("=" * 52)
print("TRAIN / VAL / TEST SPLIT  —  STRATIFIED")
print("=" * 52)
for name, y_split in [('Train', y_train), ('Val  ', y_val), ('Test ', y_test)]:
    n_pos = y_split.sum()
    n_tot = len(y_split)
    print(f"  {name}  {n_tot:4d} rows  |  churn={n_pos} ({100*n_pos/n_tot:.1f}%)  no-churn={n_tot-n_pos} ({100*(n_tot-n_pos)/n_tot:.1f}%)")

print()
print("─── Why stratify=y? ───")
print("  Churn rate is ~27% overall. Without stratify, random splits")
print("  create 3-6pp variance in class balance per fold — enough")
print("  to inflate reported AUC by 1-2 points.")
print()
print("─── Seed discipline ───")
print("  random_state=42 on both splits. Changing either seed creates a")
print("  different test set — invalidates all prior results. In production:")
print("  pin seeds and log them as run metadata, not just code.")
`

const CELL_8_CODE = `# Cell 8 — Model Training: LR, RandomForest, GradientBoosting
import numpy as np
import time
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, f1_score

np.random.seed(42)
n = 600
tenure     = np.random.exponential(25, n).clip(1, 72).round(1)
monthly    = np.random.normal(65, 25, n).clip(18, 120).round(2)
contract_c = np.random.choice([0, 1, 2], n, p=[0.55, 0.24, 0.21])
p_churn    = (0.55 - 0.006*tenure - 0.15*(contract_c > 0) + np.random.normal(0, 0.08, n)).clip(0.04, 0.9)
churn      = (np.random.uniform(size=n) < p_churn).astype(int)

X = np.column_stack([tenure, monthly, contract_c])
y = churn

X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)

scaler    = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_val_s   = scaler.transform(X_val)

models = [
    ('LogisticRegression', LogisticRegression(class_weight='balanced', max_iter=500, random_state=42), True),
    ('RandomForest',       RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42), False),
    ('GradientBoosting',   GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42), False),
]

print("=" * 64)
print("MODEL TRAINING  —  VAL SET SCORES")
print("=" * 64)
print(f"  {'Model':<22}  {'Val AUC':>8}  {'Val F1':>7}  {'Time':>8}")
print("  " + "─"*58)

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
print("─── Reading these numbers ───")
print("  Val AUC: how well the model ranks churners above non-churners.")
print("  Val F1: precision-recall balance at 0.5 threshold.")
print("  Threshold=0.5 is usually wrong for imbalanced classes — see Cell 9.")
print()
print("─── Why class_weight='balanced'? ───")
print("  Upweights minority class (churners) during training.")
print("  Without it, LR and RF optimize for majority (no-churn) accuracy,")
print("  producing a high overall accuracy but poor recall on churners.")
`

const CELL_9_CODE = `# Cell 9 — Eval Metrics: ROC, Precision-Recall, Confusion Matrix, Threshold
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (roc_auc_score, precision_recall_curve,
                              roc_curve, confusion_matrix, f1_score)

np.random.seed(42)
n = 600
tenure     = np.random.exponential(25, n).clip(1, 72).round(1)
monthly    = np.random.normal(65, 25, n).clip(18, 120).round(2)
contract_c = np.random.choice([0, 1, 2], n, p=[0.55, 0.24, 0.21])
p_churn    = (0.55 - 0.006*tenure - 0.15*(contract_c > 0) + np.random.normal(0, 0.08, n)).clip(0.04, 0.9)
churn      = (np.random.uniform(size=n) < p_churn).astype(int)

X = np.column_stack([tenure, monthly, contract_c])
y = churn

X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)

clf = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42)
clf.fit(X_train, y_train)
proba_val = clf.predict_proba(X_val)[:, 1]

fpr, tpr, _ = roc_curve(y_val, proba_val)
auc = roc_auc_score(y_val, proba_val)
prec, rec, pr_thresh = precision_recall_curve(y_val, proba_val)

# Best threshold: maximize F1
f1s      = 2 * prec * rec / (prec + rec + 1e-9)
best_idx = f1s[:-1].argmax()  # last element has no corresponding threshold
best_thresh = pr_thresh[best_idx]

pred_best = (proba_val >= best_thresh).astype(int)
cm = confusion_matrix(y_val, pred_best)

fig = plt.figure(figsize=(13, 4.5))
gs  = gridspec.GridSpec(1, 3, figure=fig, wspace=0.42)

ax1 = fig.add_subplot(gs[0, 0])
ax1.plot(fpr, tpr, color='#f0a500', lw=2, label=f'AUC={auc:.3f}')
ax1.plot([0, 1], [0, 1], '--', color='#4b5563', lw=1)
ax1.set_title('ROC Curve', fontsize=11, fontweight='bold')
ax1.set_xlabel('FPR', fontsize=9); ax1.set_ylabel('TPR', fontsize=9)
ax1.legend(fontsize=9); ax1.grid(True, alpha=0.2)

ax2 = fig.add_subplot(gs[0, 1])
ax2.plot(rec, prec, color='#f0a500', lw=2)
ax2.axvline(rec[best_idx], color='#6b7280', lw=1, linestyle='--', label=f'thresh={best_thresh:.2f}')
ax2.set_title('Precision-Recall', fontsize=11, fontweight='bold')
ax2.set_xlabel('Recall', fontsize=9); ax2.set_ylabel('Precision', fontsize=9)
ax2.legend(fontsize=9); ax2.grid(True, alpha=0.2)

ax3 = fig.add_subplot(gs[0, 2])
im = ax3.imshow(cm, cmap='YlOrBr', aspect='auto')
for i in range(2):
    for j in range(2):
        c = 'white' if cm[i, j] > cm.max() * 0.6 else 'black'
        ax3.text(j, i, str(cm[i, j]), ha='center', va='center', fontsize=14, fontweight='bold', color=c)
ax3.set_xticks([0, 1]); ax3.set_yticks([0, 1])
ax3.set_xticklabels(['Pred 0', 'Pred 1'], fontsize=9)
ax3.set_yticklabels(['True 0', 'True 1'], fontsize=9)
ax3.set_title('Confusion Matrix', fontsize=11, fontweight='bold')
plt.colorbar(im, ax=ax3, shrink=0.8)

plt.tight_layout()
plt.show()

tn, fp, fn, tp = cm.ravel()
print(f"Val AUC = {auc:.4f}    Best threshold (max F1) = {best_thresh:.3f}")
print(f"  Precision: {tp/(tp+fp+1e-9):.3f}  Recall: {tp/(tp+fn+1e-9):.3f}  F1: {2*tp/(2*tp+fp+fn+1e-9):.3f}")
print(f"  TN={tn}  FP={fp}  FN={fn}  TP={tp}")
print()
print("─── Threshold selection ───")
print("  Default 0.5 misses many churners (high FN) on imbalanced data.")
print(f"  At {best_thresh:.2f}: recall improves — we catch more churners")
print("  at cost of more false alarms (FP = retention offers on non-churners).")
print("  Business call: compare cost(miss churner) vs cost(wasted offer).")
`

const CELL_10_CODE = `# Cell 10 — Calibration: Reliability Diagram, ECE, Platt Scaling
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve

np.random.seed(42)
n = 600
tenure     = np.random.exponential(25, n).clip(1, 72).round(1)
monthly    = np.random.normal(65, 25, n).clip(18, 120).round(2)
contract_c = np.random.choice([0, 1, 2], n, p=[0.55, 0.24, 0.21])
p_churn    = (0.55 - 0.006*tenure - 0.15*(contract_c > 0) + np.random.normal(0, 0.08, n)).clip(0.04, 0.9)
churn      = (np.random.uniform(size=n) < p_churn).astype(int)

X = np.column_stack([tenure, monthly, contract_c])
y = churn

X_temp, X_test, y_temp, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
X_train, X_val, y_train, y_val = train_test_split(X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp)

# Uncalibrated
clf = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42)
clf.fit(X_train, y_train)
p_uncal = clf.predict_proba(X_val)[:, 1]

# Platt scaling (sigmoid, cv=5)
cal = CalibratedClassifierCV(
    GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42),
    method='sigmoid', cv=5
)
cal.fit(X_train, y_train)
p_cal = cal.predict_proba(X_val)[:, 1]

def ece(proba, labels, n_bins=10):
    bins = np.linspace(0, 1, n_bins + 1)
    result = 0.0
    for i in range(n_bins):
        mask = (proba >= bins[i]) & (proba < bins[i + 1])
        if mask.sum() == 0: continue
        result += (mask.sum() / len(labels)) * abs(proba[mask].mean() - labels[mask].mean())
    return result

ece_before = ece(p_uncal, y_val)
ece_after  = ece(p_cal, y_val)

fp_u, mp_u = calibration_curve(y_val, p_uncal, n_bins=8)
fp_c, mp_c = calibration_curve(y_val, p_cal,   n_bins=8)

fig = plt.figure(figsize=(10, 4.5))
gs  = gridspec.GridSpec(1, 2, figure=fig, wspace=0.42)

for ax, fp_, mp_, label in [
    (fig.add_subplot(gs[0, 0]), fp_u, mp_u, f'Uncalibrated  ECE={ece_before:.3f}'),
    (fig.add_subplot(gs[0, 1]), fp_c, mp_c, f'Platt-scaled  ECE={ece_after:.3f}'),
]:
    ax.plot([0, 1], [0, 1], '--', color='#4b5563', lw=1.5, label='Perfect')
    ax.plot(mp_, fp_, 'o-', color='#f0a500', lw=2, ms=6, label=label)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    ax.set_xlabel('Mean predicted probability', fontsize=9)
    ax.set_ylabel('Fraction of positives', fontsize=9)
    ax.set_title('Reliability Diagram', fontsize=11, fontweight='bold')
    ax.legend(fontsize=8); ax.grid(True, alpha=0.2)

plt.tight_layout()
plt.show()

print(f"ECE before calibration: {ece_before:.4f}")
print(f"ECE after  calibration: {ece_after:.4f}")
print(f"Improvement:            {ece_before - ece_after:+.4f}")
print()
print("─── What ECE tells you ───")
print("  ECE = avg absolute gap between predicted confidence")
print("  and actual fraction of positives in each probability bin.")
print("  ECE < 0.05: well-calibrated. 0.05-0.10: acceptable.")
print("  ECE > 0.10: raw probabilities should not be used as")
print("  absolute thresholds without recalibration first.")
print()
print("─── Platt scaling ───")
print("  Fits a logistic curve on held-out (cv) fold predictions.")
print("  Low cost, often effective for tree models that produce")
print("  overconfident scores near 0 and 1.")
print("  Alternative: isotonic regression (non-parametric, better")
print("  for large datasets; needs more data to fit reliably).")
`

// ─── AccordionMCQ checkpoint component ────────────────────────────────────────
function JudgmentCheckpoint({ checkpoint, onComplete }) {
  const [picked, setPicked]   = useState(null)
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
          const isSelected = picked === opt.id
          const isCorrectOpt = opt.id === checkpoint.correct
          let bg = 'transparent', borderCol = 'var(--rim)', textCol = 'var(--ink-mid)'

          if (revealed) {
            if (isCorrectOpt) { bg = 'rgba(52,211,153,0.10)'; borderCol = 'rgba(52,211,153,0.45)'; textCol = 'var(--ink-hi)' }
            else if (isSelected) { bg = 'rgba(244,63,94,0.10)'; borderCol = 'rgba(244,63,94,0.40)'; textCol = 'var(--ink-mid)' }
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

// ─── Phase progress tracker ───────────────────────────────────────────────────
function PhaseBar({ cells, checkpoints }) {
  const total = cells + checkpoints
  const done  = cells + checkpoints  // updated by parent via props
  return null  // rendered inline below
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function ProjectLabTab({ onNavigate }) {
  // Track which cells have been run and which checkpoints completed
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

  // Phase 1: cells 1-3 + checkpoints cp1, cp2
  const phase1TotalSteps = 5
  const phase1DoneSteps  = ['cell1','cell2','cell3'].filter(c => state.cellsDone.includes(c)).length
    + ['cp1','cp2'].filter(c => state.checkpointsDone.includes(c)).length

  // Phase 2: cells 4-6 + checkpoint cp3
  const phase2TotalSteps = 4
  const phase2DoneSteps  = ['cell4','cell5','cell6'].filter(c => state.cellsDone.includes(c)).length
    + ['cp3'].filter(c => state.checkpointsDone.includes(c)).length

  const phase1Complete = phase1DoneSteps === phase1TotalSteps

  // Phase 3: cells 7-10 + checkpoint cp4
  const phase3TotalSteps = 5
  const phase3DoneSteps  = ['cell7','cell8','cell9','cell10'].filter(c => state.cellsDone.includes(c)).length
    + ['cp4'].filter(c => state.checkpointsDone.includes(c)).length
  const phase2Complete = phase2DoneSteps === phase2TotalSteps

  // Phase 4: cells 11-14 + checkpoint cp5
  const phase4TotalSteps = 5
  const phase4DoneSteps  = ['cell11','cell12','cell13','cell14'].filter(c => state.cellsDone.includes(c)).length
    + ['cp5'].filter(c => state.checkpointsDone.includes(c)).length
  const phase3Complete = phase3DoneSteps === phase3TotalSteps

  // Phase 5: cells 15-19 (mark-as-read, no checkpoint)
  const phase5TotalSteps = 5
  const phase5DoneSteps  = ['cell15','cell16','cell17','cell18','cell19'].filter(c => state.cellsDone.includes(c)).length
  const phase4Complete = phase4DoneSteps === phase4TotalSteps
  const phase5Complete = phase5DoneSteps === phase5TotalSteps

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
            Phase 1 of 5
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
            <CheckMark /> Real execution
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900,
          letterSpacing: '-0.05em', marginBottom: '10px', lineHeight: 1.1,
          background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Project Lab — Churn Prediction
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
          A sequential data science notebook — run real Python in the browser, make production decisions at each checkpoint.
          Phase 1 covers data ingestion and EDA. Run each cell in order. Edit the code and re-run freely — the notebook remembers where you left off.
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
        <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Dataset — Telco Customer Churn</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
          7,043 customers from a US telecom provider. 21 features: demographics, service subscriptions (phone, internet, streaming), contract type, payment method, monthly and total charges.
          Target: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--depth)', padding: '1px 5px', borderRadius: '3px' }}>Churn</code> (Yes/No, ~26% positive rate).
          A classic DS interview dataset — interviewers expect you to know the class imbalance, the TotalCharges dtype issue, and the tenure-TotalCharges correlation.
          The sample loaded in these cells is 20 rows; production analysis would use the full 7k rows.
        </p>
      </div>

      {/* ── Cell 1 ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('cell1') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
            border: `1px solid ${state.cellsDone.includes('cell1') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell1') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('cell1') ? <CheckMark /> : '1'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Schema Inspection</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>dtypes · nulls · cardinality · class balance</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_1_CODE}
          height={200}
          label="Cell 1 — Schema"
          onResult={r => { if (r.ok) markCellDone('cell1') }}
        />
      </div>

      {/* ── Checkpoint 1 ── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.checkpointsDone.includes('cp1') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
            border: `1px solid ${state.checkpointsDone.includes('cp1') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cp1') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.checkpointsDone.includes('cp1') ? <CheckMark /> : '?'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Data Quality Decision</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>before any EDA or training — what do you fix first?</div>
          </div>
        </div>
        <JudgmentCheckpoint
          checkpoint={CHECKPOINT_1}
          onComplete={() => markCheckpointDone('cp1')}
        />
      </div>

      {/* ── Cell 2 ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('cell2') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
            border: `1px solid ${state.cellsDone.includes('cell2') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell2') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('cell2') ? <CheckMark /> : '2'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>EDA Dashboard</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>distributions · churn rates by segment · class balance</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_2_CODE}
          height={200}
          withPlot={true}
          label="Cell 2 — EDA"
          onResult={r => { if (r.ok) markCellDone('cell2') }}
        />
      </div>

      {/* ── Cell 3 ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.cellsDone.includes('cell3') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
            border: `1px solid ${state.cellsDone.includes('cell3') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell3') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('cell3') ? <CheckMark /> : '3'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Correlation Heatmap + Outlier Flags</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>feature intercorrelation · IQR outlier detection</div>
          </div>
        </div>
        <PythonCell
          initialCode={CELL_3_CODE}
          height={200}
          withPlot={true}
          label="Cell 3 — Correlation"
          onResult={r => { if (r.ok) markCellDone('cell3') }}
        />
      </div>

      {/* ── Checkpoint 2 ── */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: state.checkpointsDone.includes('cp2') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
            border: `1px solid ${state.checkpointsDone.includes('cp2') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cp2') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.checkpointsDone.includes('cp2') ? <CheckMark /> : '?'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Feature Collinearity Decision</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>how do you handle highly correlated features before training?</div>
          </div>
        </div>
        <JudgmentCheckpoint
          checkpoint={CHECKPOINT_2}
          onComplete={() => markCheckpointDone('cp2')}
        />
      </div>

      {/* ── Phase complete callout ── */}
      {phase1Complete && (
        <div className="card animate-slide-up" style={{ padding: '20px 22px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.30)', borderLeft: '3px solid var(--prime)', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', marginBottom: '8px', fontWeight: 700 }}>
            Phase 1 Complete
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: '0 0 12px' }}>
            You've run schema inspection, EDA, and correlation analysis — and made two production data decisions. Phase 2 (Feature Engineering) continues below.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { try { localStorage.removeItem(LS_KEY) } catch {} setState({ cellsDone: [], checkpointsDone: [] }) }}
              style={{ fontSize: '12px', color: 'var(--ink-low)', background: 'none', border: '1px solid var(--rim)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              Reset notebook
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('features')}
                style={{ fontSize: '12px', color: 'var(--prime)', background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.30)', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
              >
                Continue below ↓
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Phase 2 — Feature Engineering ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '28px', marginTop: '8px' }}>

        {/* Phase 2 header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
              ML Engineering
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
              Phase 2 of 5
            </span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800,
            letterSpacing: '-0.04em', marginBottom: '8px', lineHeight: 1.15,
            color: 'var(--ink-hi)',
          }}>
            Phase 2 — Feature Engineering
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
            OHE and target encoding, numeric scaling and imputation, and permutation importance. Make a production call on data leakage at the judgment checkpoint.
          </p>

          {/* Phase 2 progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'var(--card-pad-primary)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px', maxWidth: '400px' }}>
            <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Phase 2 progress</span>
            <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
              <div style={{ width: `${Math.round((phase2DoneSteps / phase2TotalSteps) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 8px rgba(240,165,0,0.5)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{phase2DoneSteps}/{phase2TotalSteps}</span>
          </div>
        </div>

        {/* ── Cell 4 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell4') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell4') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell4') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell4') ? <CheckMark /> : '4'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Encoding</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>OHE for binary/low-cardinality · target encoding for medium-cardinality</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_4_CODE}
            height={200}
            label="Cell 4 — Encoding"
            onResult={r => { if (r.ok) markCellDone('cell4') }}
          />
        </div>

        {/* ── Cell 5 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell5') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell5') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell5') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell5') ? <CheckMark /> : '5'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Scaling + Imputation</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>StandardScaler · median imputation · before vs after comparison</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_5_CODE}
            height={200}
            label="Cell 5 — Scaling"
            onResult={r => { if (r.ok) markCellDone('cell5') }}
          />
        </div>

        {/* ── Cell 6 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell6') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell6') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell6') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell6') ? <CheckMark /> : '6'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Permutation Importance</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>RandomForest · permutation importance · feature ranking chart</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_6_CODE}
            height={200}
            withPlot={true}
            label="Cell 6 — Importance"
            onResult={r => { if (r.ok) markCellDone('cell6') }}
          />
        </div>

        {/* ── Checkpoint 3 ── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.checkpointsDone.includes('cp3') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
              border: `1px solid ${state.checkpointsDone.includes('cp3') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cp3') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.checkpointsDone.includes('cp3') ? <CheckMark /> : '?'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Data Leakage Decision</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>train-test contamination vs target leakage — spot the difference</div>
            </div>
          </div>
          <JudgmentCheckpoint
            checkpoint={CHECKPOINT_3}
            onComplete={() => markCheckpointDone('cp3')}
          />
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── Phase 3 — Model Training & Evaluation ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '28px', marginTop: '8px' }}>

        {/* Phase 3 header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
              ML Engineering
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
              Phase 3 of 5
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '8px', lineHeight: 1.15, color: 'var(--ink-hi)' }}>
            Phase 3 — Model Training &amp; Evaluation
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
            Train three model classes side-by-side, evaluate with ROC / PR curves and confusion matrices, tune the decision threshold, then assess calibration. Ship-or-not judgment at the checkpoint.
          </p>
          {/* Phase 3 progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'var(--card-pad-primary)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px', maxWidth: '400px' }}>
            <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Phase 3 progress</span>
            <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
              <div style={{ width: `${Math.round((phase3DoneSteps / phase3TotalSteps) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 8px rgba(240,165,0,0.5)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{phase3DoneSteps}/{phase3TotalSteps}</span>
          </div>
        </div>

        {/* Synthetic data callout */}
        <div style={{ border: '1px solid var(--rim)', borderRadius: '10px', padding: '12px 16px', background: 'rgba(240,165,0,0.04)', marginBottom: '28px', borderLeft: '3px solid var(--prime)' }}>
          <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Note — Synthetic dataset</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
            Phase 3 cells generate 600 rows of synthetic churn-like data (fixed seed) because the 20-row Telco sample is too small to train meaningfully. Features mirror the real dataset: tenure, monthly charges, contract type. Class balance ~27% churn matches Telco production.
          </p>
        </div>

        {/* ── Cell 7 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell7') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell7') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell7') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell7') ? <CheckMark /> : '7'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Train / Val / Test Split</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>stratified 60/20/20 · reproducible seed · class balance verification</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_7_CODE}
            height={200}
            label="Cell 7 — Split"
            onResult={r => { if (r.ok) markCellDone('cell7') }}
          />
        </div>

        {/* ── Cell 8 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell8') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell8') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell8') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell8') ? <CheckMark /> : '8'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Model Training</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>LogisticRegression · RandomForest · GradientBoosting · val AUC + F1</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_8_CODE}
            height={200}
            label="Cell 8 — Training"
            onResult={r => { if (r.ok) markCellDone('cell8') }}
          />
        </div>

        {/* ── Cell 9 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell9') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell9') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell9') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell9') ? <CheckMark /> : '9'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Eval Metrics</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>ROC · Precision-Recall · confusion matrix · threshold selection</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_9_CODE}
            height={200}
            withPlot={true}
            label="Cell 9 — Eval"
            onResult={r => { if (r.ok) markCellDone('cell9') }}
          />
        </div>

        {/* ── Cell 10 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell10') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell10') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell10') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell10') ? <CheckMark /> : '10'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Calibration</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>reliability diagram · ECE · Platt scaling · before vs after</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_10_CODE}
            height={200}
            withPlot={true}
            label="Cell 10 — Calibration"
            onResult={r => { if (r.ok) markCellDone('cell10') }}
          />
        </div>

        {/* ── Checkpoint 4 ── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.checkpointsDone.includes('cp4') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
              border: `1px solid ${state.checkpointsDone.includes('cp4') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cp4') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.checkpointsDone.includes('cp4') ? <CheckMark /> : '?'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Ship-or-Not Decision</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>AUC=0.81 · ECE=0.12 · p95=38ms · probability-gated downstream — ship?</div>
            </div>
          </div>
          <JudgmentCheckpoint
            checkpoint={CHECKPOINT_4}
            onComplete={() => markCheckpointDone('cp4')}
          />
        </div>

      </div>

      {/* ── Phase 4: Monitoring ── */}
      {phase3Complete && (
      <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '32px', marginTop: '8px' }}>

        {/* Phase 4 header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
              ML Engineering
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
              Phase 4 of 5
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '8px', lineHeight: 1.15, color: 'var(--ink-hi)' }}>
            Phase 4 — Monitoring
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
            Compute PSI and KS drift statistics on a simulated production sample. Track prediction score distribution shift. Understand the label delay problem and proxy signal strategy.
          </p>
          {/* Phase 4 progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'var(--card-pad-primary)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px', maxWidth: '400px' }}>
            <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Phase 4 progress</span>
            <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
              <div style={{ width: `${Math.round((phase4DoneSteps / phase4TotalSteps) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 8px rgba(240,165,0,0.5)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{phase4DoneSteps}/{phase4TotalSteps}</span>
          </div>
        </div>

        {/* Synthetic data callout */}
        <div style={{ border: '1px solid var(--rim)', borderRadius: '10px', padding: '12px 16px', background: 'rgba(240,165,0,0.04)', marginBottom: '28px', borderLeft: '3px solid var(--prime)' }}>
          <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Note — Synthetic dataset</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
            Phase 4 cells generate synthetic churn data (fixed seed 42 for training, seed 99 for a simulated production sample). The production sample has a shifted tenure distribution to simulate real-world drift.
          </p>
        </div>

        {/* ── Cell 11 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell11') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell11') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell11') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell11') ? <CheckMark /> : '11'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Population Stability Index</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>PSI per feature · drift bands · what PSI cannot tell you</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_11_CODE}
            height={200}
            label="Cell 11 — PSI"
            onResult={r => { if (r.ok) markCellDone('cell11') }}
          />
        </div>

        {/* ── Cell 12 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell12') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell12') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell12') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell12') ? <CheckMark /> : '12'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>KS Test</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>scipy.stats.ks_2samp · significance vs magnitude · KS vs PSI</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_12_CODE}
            height={200}
            label="Cell 12 — KS Test"
            onResult={r => { if (r.ok) markCellDone('cell12') }}
          />
        </div>

        {/* ── Cell 13 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell13') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell13') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell13') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell13') ? <CheckMark /> : '13'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Prediction Drift</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>score distribution shift · histogram + CDF · diagnosis framing</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_13_CODE}
            height={200}
            withPlot={true}
            label="Cell 13 — Prediction Drift"
            onResult={r => { if (r.ok) markCellDone('cell13') }}
          />
        </div>

        {/* ── Cell 14 ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell14') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell14') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell14') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell14') ? <CheckMark /> : '14'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Label Drift</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>delayed feedback · blind zone · proxy signal strategy</div>
            </div>
          </div>
          <PythonCell
            initialCode={CELL_14_CODE}
            height={200}
            withPlot={true}
            label="Cell 14 — Label Drift"
            onResult={r => { if (r.ok) markCellDone('cell14') }}
          />
        </div>

        {/* ── Checkpoint 5 ── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.checkpointsDone.includes('cp5') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.08)',
              border: `1px solid ${state.checkpointsDone.includes('cp5') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.checkpointsDone.includes('cp5') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.checkpointsDone.includes('cp5') ? <CheckMark /> : '?'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Alert or Wait?</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>PSI=0.18 + KS p=0.03 simultaneous post-deployment — what do you do?</div>
            </div>
          </div>
          <JudgmentCheckpoint
            checkpoint={CHECKPOINT_5}
            onComplete={() => markCheckpointDone('cp5')}
          />
        </div>

      </div>
      )}

      {/* ── Phase 5: Deployment Scaffold ── */}
      {phase4Complete && (
      <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '32px', marginTop: '8px' }}>

        {/* Phase 5 header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--prime)', fontWeight: 700 }}>
              ML Engineering
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>·</span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
              Phase 5 of 5
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '8px', lineHeight: 1.15, color: 'var(--ink-hi)' }}>
            Phase 5 — Deployment Scaffold
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
            Reference implementation for taking the trained churn model to production. Read each scaffold, understand the production decisions embedded in it. Mark each section as read when done.
          </p>
          {/* Phase 5 progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: 'var(--card-pad-primary)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px', maxWidth: '400px' }}>
            <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Phase 5 progress</span>
            <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
              <div style={{ width: `${Math.round((phase5DoneSteps / phase5TotalSteps) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 8px rgba(240,165,0,0.5)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{phase5DoneSteps}/{phase5TotalSteps}</span>
          </div>
        </div>

        {/* ── Cell 15: FastAPI /predict ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell15') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell15') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell15') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell15') ? <CheckMark /> : '15'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>FastAPI /predict</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>pydantic schema · response model · health endpoint</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>python</span>
              {!state.cellsDone.includes('cell15') && (
                <button onClick={() => markCellDone('cell15')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  Mark as read <CheckMark />
                </button>
              )}
              {state.cellsDone.includes('cell15') && (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
            <pre style={{ margin: 0, padding: 'var(--card-pad-secondary)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre' }}>{`# app/main.py — FastAPI prediction endpoint
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator
import joblib, numpy as np

app = FastAPI(title="Churn Prediction API", version="1.0.0")
model = joblib.load("artifacts/churn_model.pkl")
scaler = joblib.load("artifacts/scaler.pkl")

class PredictRequest(BaseModel):
    tenure: float
    monthly_charges: float
    contract_code: int  # 0=month-to-month, 1=one-year, 2=two-year

    @validator('contract_code')
    def contract_must_be_valid(cls, v):
        if v not in (0, 1, 2): raise ValueError('contract_code must be 0, 1, or 2')
        return v

class PredictResponse(BaseModel):
    churn_probability: float
    churn_predicted: bool
    model_version: str = "1.0.0"

@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    X = np.array([[req.tenure, req.monthly_charges, req.contract_code]])
    prob = float(model.predict_proba(X)[0, 1])
    return PredictResponse(
        churn_probability=round(prob, 4),
        churn_predicted=prob >= 0.42,  # threshold from Cell 9 threshold selection
    )

@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": model is not None}`}</pre>
          </div>
        </div>

        {/* ── Cell 16: Dockerfile ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell16') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell16') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell16') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell16') ? <CheckMark /> : '16'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>Dockerfile</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>multi-stage build · non-root user · lean final image</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>dockerfile</span>
              {!state.cellsDone.includes('cell16') && (
                <button onClick={() => markCellDone('cell16')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  Mark as read <CheckMark />
                </button>
              )}
              {state.cellsDone.includes('cell16') && (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
            <pre style={{ margin: 0, padding: 'var(--card-pad-secondary)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre' }}>{`# ── Stage 1: build dependencies ────────────────────────────────────────────
FROM python:3.11-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/build/deps -r requirements.txt

# ── Stage 2: production image ────────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Copy installed deps from builder (keeps final image lean)
COPY --from=builder /build/deps /usr/local/lib/python3.11/site-packages

# Copy application code and model artifact
COPY app/ ./app/
COPY artifacts/ ./artifacts/

# Non-root user for security
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

# Build: docker build -t churn-api:1.0.0 .
# Run:   docker run -p 8000:8000 churn-api:1.0.0
# Key decisions: multi-stage (lean final image), non-root user,
# workers=2 (tune to vCPU count in production)`}</pre>
          </div>
        </div>

        {/* ── Cell 17: K8s manifest ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell17') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell17') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell17') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell17') ? <CheckMark /> : '17'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>K8s Manifest</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Deployment + Service + HPA · resource limits · health probes</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>yaml</span>
              {!state.cellsDone.includes('cell17') && (
                <button onClick={() => markCellDone('cell17')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  Mark as read <CheckMark />
                </button>
              )}
              {state.cellsDone.includes('cell17') && (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
            <pre style={{ margin: 0, padding: 'var(--card-pad-secondary)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre' }}>{`# ── Deployment ────────────────────────────────────────────────────────────────
apiVersion: apps/v1
kind: Deployment
metadata:
  name: churn-api
  labels: { app: churn-api, version: "1.0.0" }
spec:
  replicas: 2
  selector:
    matchLabels: { app: churn-api }
  template:
    metadata:
      labels: { app: churn-api, version: "1.0.0" }
    spec:
      containers:
        - name: churn-api
          image: <ECR_ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/churn-api:1.0.0
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
# ── Service ──────────────────────────────────────────────────────────────────
apiVersion: v1
kind: Service
metadata: { name: churn-api-svc }
spec:
  selector: { app: churn-api }
  ports: [{ port: 80, targetPort: 8000 }]
  type: ClusterIP
---
# ── HPA (Horizontal Pod Autoscaler) ────────────────────────────────────────────────
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: churn-api-hpa }
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: churn-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 70 }`}</pre>
          </div>
        </div>

        {/* ── Cell 18: CI/CD GitHub Actions ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell18') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell18') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell18') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell18') ? <CheckMark /> : '18'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>CI/CD — GitHub Actions</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>test → build → push → deploy · ECR · EKS rollout</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>yaml</span>
              {!state.cellsDone.includes('cell18') && (
                <button onClick={() => markCellDone('cell18')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  Mark as read <CheckMark />
                </button>
              )}
              {state.cellsDone.includes('cell18') && (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
            <pre style={{ margin: 0, padding: 'var(--card-pad-secondary)', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', lineHeight: 1.65, overflowX: 'auto', whiteSpace: 'pre' }}>{`# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]
    paths: ["app/**", "artifacts/**", "requirements.txt", "Dockerfile"]

jobs:
  test:
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
      - name: Login to ECR
        run: aws ecr get-login-password | docker login --username AWS --password-stdin \${{ secrets.ECR_REGISTRY }}
      - name: Build and push
        run: |
          docker build -t churn-api:\${{ github.sha }} .
          docker tag churn-api:\${{ github.sha }} \${{ secrets.ECR_REGISTRY }}/churn-api:\${{ github.sha }}
          docker push \${{ secrets.ECR_REGISTRY }}/churn-api:\${{ github.sha }}
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name prod-cluster --region us-east-1
          kubectl set image deployment/churn-api churn-api=\${{ secrets.ECR_REGISTRY }}/churn-api:\${{ github.sha }}
          kubectl rollout status deployment/churn-api`}</pre>
          </div>
        </div>

        {/* ── Cell 19: AWS Mapping ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: state.cellsDone.includes('cell19') ? 'rgba(52,211,153,0.15)' : 'var(--prime-bg-light)',
              border: `1px solid ${state.cellsDone.includes('cell19') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell19') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell19') ? <CheckMark /> : '19'}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>AWS Service Mapping</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>ECR · ECS vs EKS · S3 · SageMaker · CodePipeline</div>
            </div>
          </div>
          <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '9px', overflow: 'hidden', borderLeft: '3px solid rgba(240,165,0,0.6)' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--rim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>aws — service mapping</span>
              {!state.cellsDone.includes('cell19') && (
                <button onClick={() => markCellDone('cell19')} style={{ fontSize: '11px', color: 'var(--prime)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  Mark as read <CheckMark />
                </button>
              )}
              {state.cellsDone.includes('cell19') && (
                <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>Read</span>
              )}
            </div>
            <div style={{ padding: 'var(--card-pad-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { component: 'API container registry', aws: 'ECR (Elastic Container Registry)', note: 'Push Docker image here. ECR is free within-region; charges on data transfer out.' },
                { component: 'Container orchestration', aws: 'ECS Fargate vs EKS', note: 'ECS Fargate: simpler, serverless, lower ops overhead. EKS: full K8s, better for multi-service ML platforms. For a single churn API, Fargate wins on simplicity.' },
                { component: 'Model artifacts', aws: 'S3', note: 'Store .pkl model files in versioned S3 bucket. Load at container startup or mount via EFS for large models.' },
                { component: 'Drift monitoring', aws: 'SageMaker Model Monitor + CloudWatch', note: 'SageMaker Model Monitor computes PSI and detects data quality issues automatically. CloudWatch for latency and error rate alarms.' },
                { component: 'Feature store', aws: 'SageMaker Feature Store', note: 'Centralize feature computation. Online store for real-time inference; offline store for training. Eliminates train-serve skew.' },
                { component: 'CI/CD pipeline', aws: 'CodePipeline + CodeBuild', note: 'AWS-native alternative to GitHub Actions. CodeBuild runs tests and builds Docker image; CodePipeline orchestrates source → build → deploy stages.' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', paddingBottom: '12px', borderBottom: i < 5 ? '1px solid var(--rim)' : 'none' }}>
                  <div style={{ flex: '0 0 160px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>component</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{row.component}</div>
                  </div>
                  <div style={{ flex: '0 0 180px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>aws service</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>{row.aws}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>when to use / tradeoffs</div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>{row.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase 5 complete card */}
        {phase5Complete && (
          <div style={{ border: '1px solid rgba(52,211,153,0.35)', borderRadius: '10px', padding: '20px', background: 'rgba(52,211,153,0.06)', textAlign: 'center', marginTop: '8px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--mint)', fontFamily: 'var(--font-sans)', letterSpacing: '-0.03em', marginBottom: '6px' }}>
              Project Lab Complete
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
              You've run a complete ML pipeline — from raw data to a calibrated, monitored, deployment-ready model. That's the full loop: data → features → model → evaluation → monitoring → deployment scaffold.
            </p>
          </div>
        )}

      </div>
      )}

    </div>
  )
}
