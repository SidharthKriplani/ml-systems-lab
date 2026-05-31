import { useState, useEffect } from 'react'
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
              {isCorrect ? '✓ Correct' : '✗ See explanation'}
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
              {revealed && isCorrectOpt && <span style={{ marginLeft: '8px', color: 'var(--mint)', fontSize: '12px' }}>✓</span>}
              {revealed && isSelected && !isCorrectOpt && <span style={{ marginLeft: '8px', color: 'var(--rose)', fontSize: '12px' }}>✗</span>}
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
            Phase 1 of 5
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
          Project Lab — Churn Prediction
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '680px', marginBottom: '14px' }}>
          A sequential data science notebook — run real Python in the browser, make production decisions at each checkpoint.
          Phase 1 covers data ingestion and EDA. Run each cell in order. Edit the code and re-run freely — the notebook remembers where you left off.
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
            background: state.cellsDone.includes('cell1') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('cell1') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell1') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('cell1') ? '✓' : '1'}
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
              {state.checkpointsDone.includes('cp1') ? '✓' : '?'}
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
            background: state.cellsDone.includes('cell2') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('cell2') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell2') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('cell2') ? '✓' : '2'}
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
            background: state.cellsDone.includes('cell3') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
            border: `1px solid ${state.cellsDone.includes('cell3') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell3') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
              {state.cellsDone.includes('cell3') ? '✓' : '3'}
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
              {state.checkpointsDone.includes('cp2') ? '✓' : '?'}
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
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--prime)', background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', padding: '2px 7px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--rim)', borderRadius: '8px', maxWidth: '400px' }}>
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
              background: state.cellsDone.includes('cell4') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
              border: `1px solid ${state.cellsDone.includes('cell4') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell4') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell4') ? '✓' : '4'}
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
              background: state.cellsDone.includes('cell5') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
              border: `1px solid ${state.cellsDone.includes('cell5') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell5') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell5') ? '✓' : '5'}
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
              background: state.cellsDone.includes('cell6') ? 'rgba(52,211,153,0.15)' : 'rgba(240,165,0,0.12)',
              border: `1px solid ${state.cellsDone.includes('cell6') ? 'rgba(52,211,153,0.4)' : 'rgba(240,165,0,0.35)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: state.cellsDone.includes('cell6') ? 'var(--mint)' : 'var(--prime)', fontWeight: 700 }}>
                {state.cellsDone.includes('cell6') ? '✓' : '6'}
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
                {state.checkpointsDone.includes('cp3') ? '✓' : '?'}
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

      {/* ── Roadmap: phases 3–5 ── */}
      <div style={{ borderTop: '1px solid var(--rim)', paddingTop: '28px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '16px' }}>What's next in Project Lab</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { phase: 3, label: 'Model Training & Evaluation', desc: 'LogisticRegression + RandomForest + XGBoost, AUC/F1/calibration, threshold selection, ship-or-not checkpoint' },
            { phase: 4, label: 'Monitoring', desc: 'PSI on held-out split, KS test, prediction drift, alerting decision checkpoint' },
            { phase: 5, label: 'Deployment Scaffold', desc: 'FastAPI /predict endpoint, Dockerfile, K8s manifest, CI/CD stub, AWS mapping callout' },
          ].map(p => (
            <div key={p.phase} style={{ display: 'flex', gap: '12px', padding: '12px 14px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--rim)', borderRadius: '8px', opacity: 0.7 }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--depth)', border: '1px solid var(--rim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', fontWeight: 700 }}>{p.phase}</span>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', marginBottom: '3px' }}>{p.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
