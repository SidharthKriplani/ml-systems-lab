import { useState } from 'react'
import PythonCell from '../components/PythonCell.jsx'
import AccessGate from '../components/AccessGate.jsx'
import { isUnlocked } from '../utils/unlock.js'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'
import FidelityBadge from '../components/FidelityBadge.jsx'

function BookmarkButton({ tabId, moduleId, label }) {
  const [saved, setSaved] = useState(() => isBookmarked(tabId, moduleId))
  function handle() {
    toggleBookmark(tabId, moduleId, label)
    setSaved(isBookmarked(tabId, moduleId))
  }
  return (
    <button onClick={handle} style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
      background: saved ? 'rgba(240,165,0,0.12)' : 'transparent',
      border: saved ? '1px solid rgba(240,165,0,0.35)' : '1px solid var(--rim)',
      color: saved ? 'var(--prime)' : 'var(--ink-ghost)',
      fontSize: '11px', fontFamily: 'var(--font-sans)', fontWeight: 600,
      transition: 'all 0.15s'
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

// ─── PCA Explorer ────────────────────────────────────────────────────────────
const PCA_CODE = (nComponents, nSamples, nFeatures, noise) => `
import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import make_classification

# Generate synthetic dataset
np.random.seed(42)
X, y = make_classification(
    n_samples=${nSamples}, n_features=${nFeatures},
    n_informative=4, n_redundant=${Math.max(1, nFeatures - 6)},
    n_clusters_per_class=1, random_state=42
)
X += np.random.randn(*X.shape) * ${noise}

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

pca = PCA()
pca.fit(X_scaled)

# ── Figure: explained variance + 2D projection ──
fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))

# Left: scree plot
cumvar = np.cumsum(pca.explained_variance_ratio_) * 100
axes[0].bar(range(1, len(pca.explained_variance_ratio_)+1),
            pca.explained_variance_ratio_ * 100,
            color='var(--prime)', alpha=0.7, label='Per component')
axes[0].plot(range(1, len(cumvar)+1), cumvar,
             color='var(--sky)', linewidth=2, marker='o', markersize=4, label='Cumulative')
axes[0].axhline(y=90, color='var(--gold)', linestyle='--', alpha=0.7, label='90% threshold')
axes[0].set_xlabel('Component', fontsize=10)
axes[0].set_ylabel('Explained variance (%)', fontsize=10)
axes[0].set_title('Scree Plot', fontsize=12, fontweight='bold')
axes[0].legend(fontsize=9)
axes[0].grid(True, alpha=0.3)

# Right: 2D projection (first 2 PCs)
pca2 = PCA(n_components=2)
X_2d = pca2.fit_transform(X_scaled)
colors = ['var(--violet)', 'var(--sky)']
for cls in [0, 1]:
    mask = y == cls
    axes[1].scatter(X_2d[mask, 0], X_2d[mask, 1],
                    c=colors[cls], alpha=0.6, s=18, label=f'Class {cls}')
axes[1].set_xlabel(f'PC1 ({pca2.explained_variance_ratio_[0]*100:.1f}% var)', fontsize=10)
axes[1].set_ylabel(f'PC2 ({pca2.explained_variance_ratio_[1]*100:.1f}% var)', fontsize=10)
axes[1].set_title('2D Projection (PC1 vs PC2)', fontsize=12, fontweight='bold')
axes[1].legend(fontsize=9)

plt.tight_layout(pad=2)

# Print stats
n_for_90 = np.searchsorted(cumvar, 90) + 1
print(f"Dataset: {${nSamples}} samples × {${nFeatures}} features")
print(f"PC1 explains: {pca.explained_variance_ratio_[0]*100:.1f}%")
print(f"PC2 explains: {pca.explained_variance_ratio_[1]*100:.1f}%")
print(f"Components needed for 90% variance: {n_for_90}")
print(f"Dimensionality reduction: {${nFeatures}} → {n_for_90} ({100*(1 - n_for_90/${nFeatures}):.0f}% reduction)")
`

function PCAExplorer() {
  const [nComponents, setNComponents] = useState(4)
  const [nSamples,    setNSamples]    = useState(300)
  const [nFeatures,   setNFeatures]   = useState(12)
  const [noise,       setNoise]       = useState(0.5)
  const [key,         setKey]         = useState(0)

  const code = PCA_CODE(nComponents, nSamples, nFeatures, noise)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>PCA Explorer</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Adjust the dataset parameters, then hit Run to execute real sklearn PCA in your browser.
          Watch the scree plot change as you add noise or dimensions.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Samples', value: nSamples, set: setNSamples, min: 100, max: 1000, step: 50 },
          { label: 'Features (dimensions)', value: nFeatures, set: setNFeatures, min: 4, max: 30, step: 1 },
          { label: 'Noise level', value: noise, set: setNoise, min: 0, max: 3, step: 0.1 },
        ].map(ctrl => (
          <div key={ctrl.label} className="card" style={{ padding: 'var(--card-pad-secondary)' }}>
            <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
              {ctrl.label}: <span style={{ color: 'var(--prime)', fontWeight: 600 }}>{ctrl.value}</span>
            </label>
            <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step}
              value={ctrl.value} onChange={e => ctrl.set(+e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '4px' }}>
              <span>{ctrl.min}</span><span>{ctrl.max}</span>
            </div>
          </div>
        ))}
      </div>

      <PythonCell key={key} initialCode={code} withPlot height={260} label="PCA · sklearn + matplotlib" />

      <div className="card" style={{ padding: 'var(--card-pad-secondary)', background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.15)' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: 'var(--prime)' }}>What to watch:</strong> Increase noise → PCA needs more components for 90% variance.
          Add more features with the same info → most variance concentrates in early PCs.
          The scree "elbow" is where you should cut.
        </p>
      </div>
    </div>
  )
}

// ─── SVD Decomposer ──────────────────────────────────────────────────────────
const SVD_CODE = (rank) => `
import numpy as np
import matplotlib.pyplot as plt

# Create a rank-deficient-ish matrix (simulates a user-item or term-doc matrix)
np.random.seed(7)
n, m = 20, 25
true_rank = 4
U_true = np.random.randn(n, true_rank)
V_true = np.random.randn(true_rank, m)
A = U_true @ V_true + np.random.randn(n, m) * 0.3  # noisy low-rank matrix

# Full SVD
U, s, Vt = np.linalg.svd(A, full_matrices=False)

# Truncated reconstruction
k = ${rank}
A_approx = (U[:, :k] * s[:k]) @ Vt[:k, :]

error = np.linalg.norm(A - A_approx, 'fro') / np.linalg.norm(A, 'fro')
var_explained = (s[:k]**2).sum() / (s**2).sum() * 100

fig, axes = plt.subplots(1, 3, figsize=(12, 4))

# Original
im0 = axes[0].imshow(A, cmap='RdBu', vmin=-3, vmax=3, aspect='auto')
axes[0].set_title('Original matrix A', fontsize=11, fontweight='bold')
axes[0].set_xlabel(f'{m} columns'); axes[0].set_ylabel(f'{n} rows')
plt.colorbar(im0, ax=axes[0], fraction=0.046)

# Rank-k approximation
im1 = axes[1].imshow(A_approx, cmap='RdBu', vmin=-3, vmax=3, aspect='auto')
axes[1].set_title(f'Rank-{k} approximation', fontsize=11, fontweight='bold')
axes[1].set_xlabel(f'{m} columns')
plt.colorbar(im1, ax=axes[1], fraction=0.046)

# Singular values
axes[2].bar(range(1, len(s)+1), s, color='#6366f1', alpha=0.7)
axes[2].axvline(x=k+0.5, color='#f43f5e', linestyle='--', linewidth=2, label=f'k={k} cutoff')
axes[2].set_xlabel('Singular value index'); axes[2].set_ylabel('σ value')
axes[2].set_title('Singular value spectrum', fontsize=11, fontweight='bold')
axes[2].legend()

plt.tight_layout(pad=2)

print(f"Rank cutoff k = {k}")
print(f"Variance explained: {var_explained:.1f}%")
print(f"Frobenius reconstruction error: {error*100:.1f}%")
print(f"Storage: full={n*m} floats → compressed={(n*k + k + k*m)} floats ({(n*k+k+k*m)/(n*m)*100:.0f}%)")
`

function SVDDecomposer() {
  const [rank, setRank] = useState(4)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>SVD Decomposer</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Visualise truncated SVD on a synthetic matrix. Slide rank k and see how reconstruction quality degrades.
          This is the math behind collaborative filtering, LSA, and image compression.
        </p>
      </div>

      <div className="card" style={{ padding: 'var(--card-pad-secondary)', maxWidth: '320px' }}>
        <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
          Rank k: <span style={{ color: 'var(--prime)', fontWeight: 600 }}>{rank}</span>
        </label>
        <input type="range" min={1} max={15} step={1} value={rank} onChange={e => setRank(+e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '4px' }}>
          <span>1 (worst)</span><span>15 (best)</span>
        </div>
      </div>

      <PythonCell key={rank} initialCode={SVD_CODE(rank)} withPlot height={200} label="SVD · numpy" />

      <div className="card" style={{ padding: 'var(--card-pad-secondary)', background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.15)' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: 'var(--prime)' }}>The insight:</strong> Most real-world matrices are approximately low-rank.
          A rank-4 approximation of a 20×25 matrix needs only {20*rank + rank + rank*25} numbers instead of {20*25}.
          That's the compression ratio that makes Netflix recommendations possible at scale.
        </p>
      </div>
    </div>
  )
}

// ─── Preprocessing Pipeline Lab ──────────────────────────────────────────────
const PREPROC_CORRECT = `
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=500, n_features=10, random_state=42)

# Introduce 10% missing values
rng = np.random.default_rng(42)
mask = rng.random(X.shape) < 0.10
X[mask] = np.nan

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ✅ CORRECT: fit pipeline only on training data
pipe = Pipeline([
    ('impute', SimpleImputer(strategy='mean')),
    ('scale',  StandardScaler()),
    ('clf',    LogisticRegression(max_iter=300)),
])
pipe.fit(X_train, y_train)

y_pred  = pipe.predict(X_test)
y_proba = pipe.predict_proba(X_test)[:, 1]
print(f"[CORRECT] Test accuracy: {accuracy_score(y_test, y_pred):.3f}")
print(f"[CORRECT] Test AUC:      {roc_auc_score(y_test, y_proba):.3f}")
`

const PREPROC_LEAKY = `
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=500, n_features=10, random_state=42)

rng = np.random.default_rng(42)
mask = rng.random(X.shape) < 0.10
X[mask] = np.nan

# ❌ BUG: imputing & scaling on FULL dataset before split = data leakage
imputer = SimpleImputer(strategy='mean')
X_imputed = imputer.fit_transform(X)    # <-- sees test data!

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_imputed)  # <-- sees test data!

X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

clf = LogisticRegression(max_iter=300)
clf.fit(X_train, y_train)

y_pred  = clf.predict(X_test)
y_proba = clf.predict_proba(X_test)[:, 1]
print(f"[LEAKY]   Test accuracy: {accuracy_score(y_test, y_pred):.3f}  <-- optimistically biased")
print(f"[LEAKY]   Test AUC:      {roc_auc_score(y_test, y_proba):.3f}  <-- you will be surprised in production")
print()
print("The difference looks small here (10% missing) but grows with:")
print("  - More missing data")
print("  - Target-correlated features")
print("  - Smaller datasets")
print("  - More complex transforms (target encoding, PCA, etc.)")
`

function PreprocessingLab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Preprocessing Pipeline Lab</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Two pipelines, same data. One has a data leakage bug. Run both — see if you can spot the difference in metrics,
          and understand why it matters at production scale.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px', color: 'var(--prime)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--prime)', fontSize: '14px' }}>Correct pipeline</span>
          </div>
          <PythonCell initialCode={PREPROC_CORRECT} height={280} label="sklearn Pipeline (correct)" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px', color: 'var(--ink-low)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-low)', fontSize: '14px' }}>Leaky pipeline</span>
          </div>
          <PythonCell initialCode={PREPROC_LEAKY} height={280} label="sklearn (data leakage bug)" />
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--card-pad-secondary)', background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.15)' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: 'var(--prime)' }}>The bug:</strong> When you <code style={{ color: 'var(--ink-low)' }}>fit()</code> a scaler or imputer on the full dataset before splitting,
          test-set statistics leak into the transforms. Your reported metrics will be optimistically biased —
          and you won't know until you hit production.
          Always use <code style={{ color: 'var(--prime)' }}>sklearn.Pipeline</code>: it <code>fit</code>s only on train, <code>transform</code>s test without leaking.
        </p>
      </div>
    </div>
  )
}

// ─── Regularization Lab ──────────────────────────────────────────────────────
const REG_CODE = (alpha, penalty) => `
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

np.random.seed(42)
# Many correlated features — regularization matters most here
X, y = make_classification(
    n_samples=300, n_features=20,
    n_informative=5, n_redundant=12,
    random_state=42
)
scaler = StandardScaler()
X = scaler.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

penalty = '${penalty}'
C = 1.0 / ${alpha}  # sklearn uses C = 1/alpha

clf = LogisticRegression(penalty=penalty, C=C, solver='saga', max_iter=2000, random_state=42)
clf.fit(X_train, y_train)

coefs = clf.coef_[0]
n_zero = (np.abs(coefs) < 1e-4).sum()
train_acc = clf.score(X_train, y_train)
test_acc  = clf.score(X_test, y_test)

fig, axes = plt.subplots(1, 2, figsize=(11, 4))

colors = ['var(--rose)' if abs(c) < 1e-4 else 'var(--prime)' for c in coefs]
axes[0].bar(range(len(coefs)), np.abs(coefs), color=colors, alpha=0.8, edgecolor='none')
axes[0].set_title(f'{penalty.upper()}  α={${alpha}}  — coefficient magnitudes', fontsize=11, fontweight='bold')
axes[0].set_xlabel('Feature index')
axes[0].set_ylabel('|coefficient|')
axes[0].axhline(y=1e-4, color='var(--rose)', linestyle='--', alpha=0.5, label='≈ zero threshold')
axes[0].legend(fontsize=9)

alphas_range = np.logspace(-3, 2, 50)
train_scores, test_scores = [], []
for a in alphas_range:
    m = LogisticRegression(penalty=penalty, C=1/a, solver='saga', max_iter=1000, random_state=42)
    m.fit(X_train, y_train)
    train_scores.append(m.score(X_train, y_train))
    test_scores.append(m.score(X_test, y_test))

axes[1].semilogx(alphas_range, train_scores, color='var(--violet)', label='Train', linewidth=2)
axes[1].semilogx(alphas_range, test_scores,  color='var(--sky)', label='Test',  linewidth=2)
axes[1].axvline(x=${alpha}, color='var(--gold)', linestyle='--', label=f'Current α={${alpha}}')
axes[1].set_xlabel('Regularisation strength (α)')
axes[1].set_ylabel('Accuracy')
axes[1].set_title('Bias-variance tradeoff', fontsize=11, fontweight='bold')
axes[1].legend()
axes[1].grid(True, alpha=0.2)

plt.tight_layout(pad=2)

print(f"Penalty: {penalty.upper()}  |  α (strength): {${alpha}}  |  C: {C:.4f}")
print(f"Coefficients zeroed out: {n_zero} / {len(coefs)} ({n_zero/len(coefs)*100:.0f}%)")
print(f"Train accuracy: {train_acc:.3f}  |  Test accuracy: {test_acc:.3f}")
if penalty == 'l1':
    print(f"L1 sparsity: {n_zero} features effectively removed → automatic feature selection")
else:
    print(f"L2 shrinks all coefficients smoothly — none are exactly zero")
`

function RegularizationLab() {
  const [alpha, setAlpha] = useState(0.1)
  const [penalty, setPenalty] = useState('l2')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Regularization Lab</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          L1 vs L2 on a dataset with 20 features (only 5 informative). See the geometric difference:
          L1 drives coefficients to zero (feature selection), L2 shrinks them smoothly.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: 'var(--card-pad-secondary)', flex: '1', minWidth: '200px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
            Penalty type
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['l1', 'l2', 'elasticnet'].map(p => (
              <button key={p} onClick={() => setPenalty(p)}
                className={`sub-tab ${penalty === p ? 'active' : 'inactive'}`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--card-pad-secondary)', flex: '1', minWidth: '200px' }}>
          <label style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '10px' }}>
            α (strength): <span style={{ color: 'var(--prime)', fontWeight: 600 }}>{alpha}</span>
          </label>
          <input type="range" min={0.001} max={10} step={0.001} value={alpha}
            onChange={e => setAlpha(+e.target.value)} />
        </div>
      </div>

      <PythonCell key={`${alpha}-${penalty}`} initialCode={REG_CODE(alpha, penalty === 'elasticnet' ? 'l2' : penalty)}
        withPlot height={200} label={`${penalty.toUpperCase()} Regularization`} />
    </div>
  )
}

// ─── Free Python REPL ────────────────────────────────────────────────────────
function FreePythonREPL() {
  const DEFAULT = `# Free Python environment — numpy, sklearn, matplotlib, scipy available
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs
from sklearn.cluster import KMeans

X, true_labels = make_blobs(n_samples=200, centers=4, random_state=42)

kmeans = KMeans(n_clusters=4, random_state=42, n_init='auto')
kmeans.fit(X)

plt.figure(figsize=(7, 5))
colors = ['var(--prime)', 'var(--sky)', 'var(--gold)', 'var(--mint)']
for i in range(4):
    mask = kmeans.labels_ == i
    plt.scatter(X[mask, 0], X[mask, 1], c=colors[i], s=20, alpha=0.7, label=f'Cluster {i}')
plt.scatter(kmeans.cluster_centers_[:, 0], kmeans.cluster_centers_[:, 1],
            c='white', s=150, marker='X', zorder=10, label='Centroids')
plt.title('K-Means Clustering', fontsize=13, fontweight='bold')
plt.legend(fontsize=9)
plt.tight_layout()
print(f"Inertia: {kmeans.inertia_:.2f}")
print(f"Converged in {kmeans.n_iter_} iterations")
`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Python Sandbox</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Full Python environment. Edit and run anything — numpy, sklearn, matplotlib, scipy.
          Your compute. Your browser. No server.
        </p>
      </div>
      <PythonCell initialCode={DEFAULT} height={320} withPlot label="Python sandbox · free" />
    </div>
  )
}

// ─── NumPy Internals ─────────────────────────────────────────────────────────
const NUMPY_BROADCAST_CODE = `
import numpy as np

# ── Broadcasting rules ──────────────────────────────────────────────
a = np.array([[1],[2],[3]])          # shape (3,1)
b = np.array([10,20,30,40])         # shape (4,)
result = a + b                       # broadcasts to (3,4)
print("Broadcasting demo:")
print(f"  a shape: {a.shape}, b shape: {b.shape}")
print(f"  a + b shape: {result.shape}")
print(result)

# ── Views vs copies ──────────────────────────────────────────────────
x = np.arange(12).reshape(3,4)
v = x[1:, ::2]   # VIEW — shares memory
c = x[1:, ::2].copy()  # COPY — new allocation

x[1, 0] = 999
print("\\nViews vs copies:")
print(f"  Original x[1,0] changed to 999")
print(f"  View v[0,0] = {v[0,0]}  (tracks change)")
print(f"  Copy c[0,0] = {c[0,0]}  (frozen)")

print("\\nMemory: v shares base with x:", np.shares_memory(v, x))
print("Memory: c shares base with x:", np.shares_memory(c, x))
`

const NUMPY_BENCH_CODE = `
import numpy as np
import time

N = 5_000_000
x = np.random.randn(N)

# Python loop (slow)
t0 = time.perf_counter()
total = 0.0
for val in x[:10_000]:      # only 10k to keep it fast in Pyodide
    total += val * val
t_loop = (time.perf_counter() - t0) * 1000

# Vectorized (fast)
t0 = time.perf_counter()
total_vec = np.dot(x[:10_000], x[:10_000])
t_vec = (time.perf_counter() - t0) * 1000

print(f"Sum of squares (10k elements):")
print(f"  Python loop : {t_loop:.3f} ms")
print(f"  NumPy dot   : {t_vec:.4f} ms")
print(f"  Speedup     : ~{t_loop/max(t_vec,0.0001):.0f}×")

# strides demo
a = np.arange(16, dtype=np.int32).reshape(4,4)
print(f"\\nStrides of 4×4 int32 array: {a.strides}")
print(f"  Row stride: {a.strides[0]} bytes ({a.strides[0]//4} ints)")
print(f"  Col stride: {a.strides[1]} bytes ({a.strides[1]//4} ints)")
transposed = a.T
print(f"Transposed strides: {transposed.strides}  (same data, reversed strides)")
`

function NumPyInternals() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>NumPy Internals</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          Broadcasting, strides, views vs copies, vectorisation benchmark — the internals every ML practitioner should understand but rarely do.
        </p>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '4px' }}>Broadcasting & Views vs Copies</div>
        <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', marginBottom: '12px' }}>
          NumPy broadcasting aligns arrays with compatible shapes without allocating extra memory.
          A <em>view</em> shares the same data buffer — mutating the original mutates the view.
          A <em>copy</em> is independent. Getting this wrong causes subtle, hard-to-debug bugs.
        </p>
        <PythonCell initialCode={NUMPY_BROADCAST_CODE} height={180} withPlot={false} label="broadcasting + views" />
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', marginBottom: '4px' }}>Vectorisation Benchmark + Strides</div>
        <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', marginBottom: '12px' }}>
          Vectorised NumPy operations call optimised BLAS routines in C — typically 10–100× faster than Python loops.
          Strides describe the byte offset to move one step along each dimension — .T doesn't copy, it just reverses strides.
        </p>
        <PythonCell initialCode={NUMPY_BENCH_CODE} height={180} withPlot={false} label="vectorisation + strides" />
      </div>

      <div className="card" style={{ padding: '16px 20px', background: 'rgba(240,165,0,0.10)', borderColor: 'rgba(240,165,0,0.18)' }}>
        <div style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--prime)' }}>Key rules to remember:</strong><br />
          • <code style={{ color: 'var(--ink-low)' }}>x[::2]</code> returns a view; <code style={{ color: 'var(--ink-low)' }}>x[[0,2,4]]</code> (fancy indexing) returns a copy.<br />
          • Boolean indexing always returns a copy.<br />
          • <code style={{ color: 'var(--ink-low)' }}>np.shares_memory(a, b)</code> tells you if two arrays share a buffer.<br />
          • Reshaping preserves the view if the array is contiguous; otherwise numpy copies.<br />
          • Always profile with <code style={{ color: 'var(--ink-low)' }}>%timeit</code> before assuming loop = slow.
        </div>
      </div>
    </div>
  )
}

// ─── Calibration Curves ──────────────────────────────────────────────────────
const CALIBRATION_CODE = `
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.model_selection import train_test_split

np.random.seed(42)
X, y = make_classification(n_samples=2000, n_features=20,
                            n_informative=6, n_redundant=4, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Fit models
lr   = LogisticRegression(max_iter=500).fit(X_train, y_train)
rf   = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_train, y_train)
rf_platt  = CalibratedClassifierCV(RandomForestClassifier(n_estimators=100, random_state=42),
                                   cv=3, method='sigmoid').fit(X_train, y_train)
rf_iso    = CalibratedClassifierCV(RandomForestClassifier(n_estimators=100, random_state=42),
                                   cv=3, method='isotonic').fit(X_train, y_train)

def ece(y_true, probs, n_bins=10):
    bins = np.linspace(0,1,n_bins+1)
    ece_val = 0
    for lo, hi in zip(bins[:-1], bins[1:]):
        mask = (probs >= lo) & (probs < hi)
        if mask.sum() == 0: continue
        acc  = y_true[mask].mean()
        conf = probs[mask].mean()
        ece_val += mask.mean() * abs(acc - conf)
    return ece_val

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

models = [
    ('Logistic Reg', lr, '#06d6a0'),
    ('Random Forest (raw)', rf, '#f97316'),
    ('RF + Platt', rf_platt, '#38bdf8'),
    ('RF + Isotonic', rf_iso, '#a855f7'),
]

for name, model, color in models:
    probs = model.predict_proba(X_test)[:, 1]
    frac, mean_pred = calibration_curve(y_test, probs, n_bins=10)
    ece_score = ece(y_test, probs)
    axes[0].plot(mean_pred, frac, 'o-', color=color, lw=2, ms=5,
                 label=f'{name} (ECE={ece_score:.3f})')

axes[0].plot([0,1],[0,1],'--', color='#0e3040', lw=1.5, label='Perfect calibration')
axes[0].set_xlabel('Mean predicted probability', fontsize=10)
axes[0].set_ylabel('Fraction of positives', fontsize=10)
axes[0].set_title('Reliability Diagram', fontsize=12, fontweight='bold')
axes[0].legend(fontsize=8)
axes[0].grid(True, alpha=0.3)

# Confidence histogram
for name, model, color in models:
    probs = model.predict_proba(X_test)[:, 1]
    axes[1].hist(probs, bins=20, alpha=0.4, color=color, label=name, density=True)

axes[1].set_xlabel('Predicted probability', fontsize=10)
axes[1].set_ylabel('Density', fontsize=10)
axes[1].set_title('Confidence Distribution', fontsize=12, fontweight='bold')
axes[1].legend(fontsize=8)

plt.tight_layout(pad=2)

# Print ECE summary
print("Expected Calibration Error (ECE) — lower is better:")
for name, model, _ in models:
    probs = model.predict_proba(X_test)[:, 1]
    print(f"  {name:<28} ECE = {ece(y_test, probs):.4f}")
print("\\n→ A well-calibrated model: predicted 70% probability ≈ true 70% frequency.")
print("→ Random forests are systematically overconfident — calibration fixes this.")
`

function CalibrationCurves() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '6px', letterSpacing: '-0.02em' }}>Calibration Curves</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6 }}>
          A model can have great AUC but terrible calibration — its probability scores don't reflect real likelihoods.
          Reliability diagrams reveal this. Platt scaling and isotonic regression fix it.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {[
          { title: 'What ECE measures', body: 'Expected Calibration Error = weighted mean |confidence − accuracy| across probability bins. ECE < 0.02 is excellent; > 0.05 is concerning.' },
          { title: 'Platt scaling', body: 'Fits a logistic regression on top of the raw model scores. Fast, works well when miscalibration is monotone. Default in sklearn\'s CalibratedClassifierCV.' },
          { title: 'Isotonic regression', body: 'Fits a non-parametric monotone function. More flexible than Platt but needs more data (≥ 1000 test samples). Overfits on small datasets.' },
        ].map(c => (
          <div key={c.title} className="card" style={{ padding: 'var(--card-pad-secondary)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: 'var(--prime)', marginBottom: '6px' }}>{c.title}</div>
            <div style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.65 }}>{c.body}</div>
          </div>
        ))}
      </div>

      <PythonCell initialCode={CALIBRATION_CODE} height={260} withPlot label="reliability diagram · ECE comparison" />
    </div>
  )
}

// ─── Tab shell ───────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'pca',     label: 'PCA Explorer', component: PCAExplorer, difficulty: 'junior', isFree: true },
  { id: 'svd',     label: 'SVD Decomposer', component: SVDDecomposer, difficulty: 'junior', isFree: true },
  { id: 'preproc', label: 'Preprocessing Lab', component: PreprocessingLab, difficulty: 'mid', isFree: false },
  { id: 'reg',     label: 'Regularization Lab', component: RegularizationLab, difficulty: 'junior', isFree: true },
  { id: 'numpy',   label: 'NumPy Internals', component: NumPyInternals, difficulty: 'junior', isFree: true },
  { id: 'calib',   label: 'Calibration Curves', component: CalibrationCurves, difficulty: 'mid', isFree: false },
  { id: 'repl',    label: 'Python Sandbox', component: FreePythonREPL, difficulty: 'easy', isFree: true },
]

export default function ModelsMathTab({ onNavigate }) {
  const [active, setActive] = useState('pca')
  const [unlocked, setUnlocked] = useState(() => isUnlocked())
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? PCAExplorer
  const activeModuleData = MODULES.find(m => m.id === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Math Foundations</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '620px' }}>
          The math behind the decisions — why PCA fails with outliers, when regularization helps vs hurts, what the scree plot is actually telling you, and why calibration breaks after threshold tuning.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a real scenario. Pick your answer — then run the Python cell to verify your intuition against the actual numbers.</p>
        <div style={{ marginTop: '8px' }}><FidelityBadge tier="faithful" /></div>
      </div>

      {/* Module picker */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>{m.label}
          </button>
        ))}
      </div>
      {activeModuleData && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <BookmarkButton tabId="models" moduleId={active} label={activeModuleData.label} />
        </div>
      )}

      {/* Python runtime notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: '8px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0 }}>
          First run loads the Python runtime (~8 MB). Subsequent runs are instant.
          Everything executes locally — your data never leaves the browser.
        </p>
      </div>

      {activeModuleData && !activeModuleData.isFree && !unlocked ? (
        <AccessGate
          onUnlock={() => setUnlocked(true)}
          title="Mid-level math & statistics modules"
          body="Preprocessing decisions, regularization tradeoffs, calibration curves — the mathematical judgment that determines whether a model's outputs can be trusted in production."
        />
      ) : (
        <ActiveModule />
      )}

      {onNavigate && (
        <div style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>PCA: The Intuition No One Teaches</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}

    </div>
  )
}
