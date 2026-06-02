import { useState } from 'react'
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
              {state.cellsDone.includes('cellL1') ? '✓' : '1'}
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
              {state.cellsDone.includes('cellL2') ? '✓' : '2'}
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
              {state.cellsDone.includes('cellL3') ? '✓' : '3'}
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
              {state.checkpointsDone.includes('cpL1') ? '✓' : '?'}
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

      {/* ── Roadmap: Phases 2–4 ── */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-ghost)', marginBottom: '14px', fontWeight: 700 }}>
          Phases ahead
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { phase: 'Phase 2', label: 'Model Training', desc: 'Logistic regression baseline · class imbalance handling · threshold selection · AUC vs precision-recall tradeoff' },
            { phase: 'Phase 3', label: 'Monitoring', desc: 'Feature drift (PSI) · prediction drift · fairness drift over time · label delay in credit models' },
            { phase: 'Phase 4', label: 'Deployment', desc: 'Model serving · adverse action notices (ECOA requirement) · model card · AWS deployment scaffold' },
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
