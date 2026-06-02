import { useState, useEffect } from 'react'
import PythonCell from '../components/PythonCell.jsx'
import FidelityBadge from '../components/FidelityBadge.jsx'

const LS_KEY = 'msl_score:mlcoding'

// ── Problem bank ──────────────────────────────────────────────────────────────
// Tightly scoped to ML-specific Python that appears in real senior/staff interviews.
// NOT generic Python (no string manipulation, no DSA).
// Each problem: starter code + expected output validation + judgment checkpoint.

const PROBLEMS = [
  {
    id: 'mlc1',
    title: 'Custom Cross-Entropy Loss',
    domain: 'Model Training',
    difficulty: 'mid',
    prompt: `Implement a numerically stable binary cross-entropy loss function from scratch.
Do NOT use sklearn or torch — implement the formula directly with numpy.

Expected: a function bce_loss(y_true, y_pred) that:
• Accepts numpy arrays of true labels (0/1) and predicted probabilities (0–1)
• Clips predictions to avoid log(0)
• Returns the mean loss as a float`,
    starter: `import numpy as np

def bce_loss(y_true, y_pred):
    # Your implementation here
    pass

# Test
y_true = np.array([1, 0, 1, 1, 0])
y_pred = np.array([0.9, 0.1, 0.8, 0.6, 0.3])
print(f"Loss: {bce_loss(y_true, y_pred):.6f}")
# Expected: ~0.236 (you can verify with sklearn)
`,
    solution: `import numpy as np

def bce_loss(y_true, y_pred):
    # Clip to avoid log(0) — standard practice
    eps = 1e-9
    y_pred = np.clip(y_pred, eps, 1 - eps)
    return -np.mean(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))

y_true = np.array([1, 0, 1, 1, 0])
y_pred = np.array([0.9, 0.1, 0.8, 0.6, 0.3])
loss = bce_loss(y_true, y_pred)
print(f"Loss: {loss:.6f}")

# Verify with sklearn
from sklearn.metrics import log_loss
sklearn_loss = log_loss(y_true, y_pred)
print(f"sklearn matches: {abs(loss - sklearn_loss) < 1e-6}")
`,
    checkpoint: 'Your implementation is correct — but what happens if you remove the clipping and a prediction is exactly 0.0 or 1.0?',
    checkpointAnswer: 'log(0) = -infinity. Without clipping, a single perfectly-wrong prediction (predicting 0.0 for a positive example) makes the entire loss undefined (nan/inf). The clip is not optional — it\'s required for numerical stability. Standard clip values are 1e-9 or 1e-7 depending on float precision requirements.',
  },
  {
    id: 'mlc2',
    title: 'Vectorised Feature Engineering — No Loops',
    domain: 'Feature Engineering',
    difficulty: 'mid',
    prompt: `Given a DataFrame of user sessions, compute the following features WITHOUT using any Python for-loops or .apply():
1. days_since_last_purchase: days between each row's date and that user's most recent purchase date
2. purchase_velocity_7d: number of purchases by that user in the 7 days before the row's date (exclusive)
3. is_repeat_item: 1 if that user has purchased the same item_id before this row's date, else 0

All three must be computed using vectorised pandas/numpy operations only.`,
    starter: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    'user_id':   [1, 1, 1, 2, 2],
    'date':      pd.to_datetime(['2024-01-01','2024-01-05','2024-01-10','2024-01-03','2024-01-08']),
    'item_id':   [101, 102, 101, 201, 201],
    'purchased': [1, 1, 1, 1, 1],
})

# Your implementation here — no for-loops, no .apply()

print(df[['user_id','date','item_id','days_since_last_purchase','purchase_velocity_7d','is_repeat_item']])
`,
    solution: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    'user_id':   [1, 1, 1, 2, 2],
    'date':      pd.to_datetime(['2024-01-01','2024-01-05','2024-01-10','2024-01-03','2024-01-08']),
    'item_id':   [101, 102, 101, 201, 201],
    'purchased': [1, 1, 1, 1, 1],
})
df = df.sort_values(['user_id','date']).reset_index(drop=True)

# 1. days_since_last_purchase (shift within user group)
df['last_purchase'] = df.groupby('user_id')['date'].shift(1)
df['days_since_last_purchase'] = (df['date'] - df['last_purchase']).dt.days

# 2. purchase_velocity_7d (expanding merge on self, then count)
df_merge = df[['user_id','date']].copy()
df_merge.columns = ['user_id','ref_date']
joined = df.merge(df_merge, on='user_id')
mask = (joined['date'] < joined['ref_date']) & (joined['date'] >= joined['ref_date'] - pd.Timedelta('7D'))
df['purchase_velocity_7d'] = joined[mask].groupby(joined[mask].index)['user_id'].count().reindex(df.index, fill_value=0)

# 3. is_repeat_item (cumcount of same item per user, shifted)
df['is_repeat_item'] = (df.groupby(['user_id','item_id']).cumcount() > 0).astype(int)

print(df[['user_id','date','item_id','days_since_last_purchase','purchase_velocity_7d','is_repeat_item']])
`,
    checkpoint: 'This implementation works on the toy dataset. What breaks at production scale with 50M rows?',
    checkpointAnswer: 'The self-join (step 2) creates an N² intermediate DataFrame — 50M rows × 50M rows is impossible in memory. Production fix: use a sorted merge with groupby + rolling window, or compute in Spark with a range join. Also: the `reindex` in step 2 is fragile after a merge that changes index alignment. Production feature stores compute velocity features with pre-aggregated lookup tables, not row-level self-joins.',
  },
  {
    id: 'mlc3',
    title: 'K-Fold Cross-Validation From Scratch',
    domain: 'Model Evaluation',
    difficulty: 'junior',
    prompt: `Implement k-fold cross-validation from scratch using only numpy (no sklearn KFold).

Your function cross_val_score(X, y, model_fn, k=5) should:
• Split X, y into k folds (no shuffling required for this implementation)
• For each fold: train model_fn on k-1 folds, evaluate on the held-out fold
• Return the list of per-fold accuracies and the mean

model_fn is a callable that accepts (X_train, y_train, X_test) and returns y_pred.`,
    starter: `import numpy as np

def cross_val_score(X, y, model_fn, k=5):
    # Your implementation here
    pass

# Simple test using a majority-class classifier
def majority_classifier(X_train, y_train, X_test):
    majority = np.bincount(y_train).argmax()
    return np.full(len(X_test), majority)

np.random.seed(42)
X = np.random.randn(100, 4)
y = np.random.randint(0, 2, 100)

scores = cross_val_score(X, y, majority_classifier, k=5)
print(f"Per-fold: {[round(s,3) for s in scores]}")
print(f"Mean: {np.mean(scores):.3f}")
`,
    solution: `import numpy as np

def cross_val_score(X, y, model_fn, k=5):
    n = len(X)
    fold_size = n // k
    scores = []
    for i in range(k):
        start, end = i * fold_size, (i + 1) * fold_size if i < k - 1 else n
        mask = np.zeros(n, dtype=bool)
        mask[start:end] = True
        X_test,  y_test  = X[mask],  y[mask]
        X_train, y_train = X[~mask], y[~mask]
        y_pred = model_fn(X_train, y_train, X_test)
        scores.append(np.mean(y_pred == y_test))
    return scores

def majority_classifier(X_train, y_train, X_test):
    majority = np.bincount(y_train).argmax()
    return np.full(len(X_test), majority)

np.random.seed(42)
X = np.random.randn(100, 4)
y = np.random.randint(0, 2, 100)

scores = cross_val_score(X, y, majority_classifier, k=5)
print(f"Per-fold: {[round(s,3) for s in scores]}")
print(f"Mean: {np.mean(scores):.3f}")
`,
    checkpoint: 'Your implementation is correct for i.i.d. data. What breaks when applied to a time series?',
    checkpointAnswer: 'Standard KFold shuffles or assigns folds sequentially, which means validation data can precede training data in time. The model trains on future data and is tested on the past — the classic temporal leakage pattern. Fix: use time-based split where all training data strictly precedes all validation data. sklearn\'s TimeSeriesSplit implements this correctly.',
  },
]

// ── Problem card component ────────────────────────────────────────────────────
function ProblemCard({ problem, done, onComplete }) {
  const [expanded, setExpanded]     = useState(false)
  const [showSolution, setShowSol]  = useState(false)
  const [cpRevealed, setCpRevealed] = useState(false)
  const [cpPick, setCpPick]         = useState(null)

  const DIFF_COLOR = { junior: 'var(--mint)', mid: 'var(--prime)', senior: 'var(--rose)', staff: 'var(--violet)' }

  return (
    <div style={{ border: `1px solid ${done ? 'var(--mint)' : 'var(--rim)'}`, borderLeft: `3px solid ${done ? 'var(--mint)' : 'var(--prime)'}`, borderRadius: '10px', overflow: 'hidden', background: 'var(--surface)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', textTransform: 'uppercase' }}>{problem.domain}</span>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: DIFF_COLOR[problem.difficulty], border: `1px solid ${DIFF_COLOR[problem.difficulty]}`, borderRadius: '3px', padding: '0 4px', textTransform: 'uppercase' }}>{problem.difficulty}</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{problem.title}</div>
        </div>
        <span style={{ fontSize: '13px', color: done ? 'var(--mint)' : 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '2px' }}>
          {done ? '✓ done' : expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* Prompt */}
          <div style={{ background: 'var(--card-scrim)', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', border: '1px solid var(--rim)' }}>
            <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Problem</div>
            <pre style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {problem.prompt}
            </pre>
          </div>

          {/* Starter code + live cell */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
              Write your solution:
            </div>
            <PythonCell initialCode={problem.starter} label={`${problem.title} — starter`} height={220} />
          </div>

          {/* Show solution toggle */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => { setShowSol(s => !s) }}
              style={{ fontSize: '12px' }}
            >
              {showSolution ? 'Hide solution' : 'Show solution'}
            </button>
            {!done && (
              <button
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--prime)', background: 'none', color: 'var(--prime)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                onClick={() => onComplete(problem.id)}
              >
                Mark solved
              </button>
            )}
          </div>

          {showSolution && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
                Reference solution:
              </div>
              <PythonCell initialCode={problem.solution} label={`${problem.title} — solution`} height={220} />
            </div>
          )}

          {/* Judgment checkpoint */}
          <div style={{ padding: 'var(--card-pad-secondary)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderLeft: '3px solid var(--prime)', borderRadius: '8px' }}>
            <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Judgment checkpoint</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.65, margin: '0 0 12px', fontStyle: 'italic' }}>
              {problem.checkpoint}
            </p>
            {!cpRevealed ? (
              <button className="btn-primary" onClick={() => setCpRevealed(true)} style={{ fontSize: '12px' }}>
                Reveal answer
              </button>
            ) : (
              <div className="msl-reveal-panel" style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
                  {problem.checkpointAnswer}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function MLCodingTab({ onNavigate }) {
  const [completedIds, setCompletedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(completedIds))
  }, [completedIds])

  function handleComplete(id) {
    setCompletedIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const done  = completedIds.length
  const total = PROBLEMS.length

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Interview zone</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 10px' }}>
          ML Coding Rounds
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '580px', margin: '0 0 4px' }}>
          ML-specific Python problems that appear in real senior/staff interviews — custom loss functions, vectorised feature engineering, evaluation from scratch. Not DSA, not string manipulation. Runs live in your browser via Pyodide.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', margin: '4px 0 10px' }}>
          Each problem ends with a judgment checkpoint: "your code works — but what breaks in production?"
        </p>
        <div style={{ marginTop: '8px' }}><FidelityBadge tier="faithful" /></div>
      </div>

      {done > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: 'var(--card-pad-primary)', background: 'var(--card-scrim)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Problems solved</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ width: `${Math.round((done / total) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{done}/{total}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {PROBLEMS.map(p => (
          <ProblemCard
            key={p.id}
            problem={p}
            done={completedIds.includes(p.id)}
            onComplete={handleComplete}
          />
        ))}
      </div>

      {onNavigate && (
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
          <button
            onClick={() => onNavigate('incidentroom')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ fontSize: '12px', color: 'var(--prime)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Try cross-domain diagnosis in Incident Room</span>
            <span style={{ fontSize: '12px', color: 'var(--prime)' }}>→</span>
          </button>
        </div>
      )}
    </div>
  )
}
