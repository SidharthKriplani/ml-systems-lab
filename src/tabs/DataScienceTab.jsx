import { useState, useMemo } from 'react'

// ── Model Selection Oracle ────────────────────────────────────────────────────
const MODELS = [
  {
    id: 'logreg',
    name: 'Logistic Regression',
    when: { taskType: ['binary', 'multiclass'], dataSize: ['small', 'medium'], interpretability: ['high'], featureType: ['tabular'] },
    score: { small: 3, medium: 2, large: 0 },
    strengths: ['Fully interpretable — coefficients are odds ratios', 'Calibrated probabilities out of the box', 'Fast to train, no hyperparameter tuning needed', 'Works well as a baseline and in ensembles'],
    risks: ['Assumes linear decision boundary — will miss interactions', 'Sensitive to feature scale (always normalise)', 'Breaks under multicollinearity'],
    prodNote: 'Default first model for any tabular binary classification. If a logistic regression can\'t beat random, your features are the problem, not the model.',
    color: 'var(--sky)',
  },
  {
    id: 'rf',
    name: 'Random Forest',
    when: { taskType: ['binary', 'multiclass', 'regression'], dataSize: ['small', 'medium', 'large'], interpretability: ['medium', 'high'], featureType: ['tabular'] },
    score: { small: 3, medium: 3, large: 2 },
    strengths: ['Handles mixed feature types natively', 'Robust to outliers and missing data', 'Feature importances for interpretability', 'No feature scaling required'],
    risks: ['Memory-hungry for large n_estimators', 'Slow prediction with many trees', 'Poor extrapolation beyond training range (regression)'],
    prodNote: 'Strong default for tabular data, especially with mixed types or messy data. Slower than GBMs to train at scale but simpler to tune.',
    color: 'var(--mint)',
  },
  {
    id: 'xgboost',
    name: 'XGBoost / LightGBM',
    when: { taskType: ['binary', 'multiclass', 'regression'], dataSize: ['medium', 'large'], interpretability: ['medium'], featureType: ['tabular'] },
    score: { small: 1, medium: 3, large: 3 },
    strengths: ['State-of-the-art on structured/tabular data', 'Built-in regularisation (L1/L2)', 'SHAP values for production explainability', 'Handles missing values natively'],
    risks: ['Over 20 hyperparameters — easy to over-tune on val set', 'Can overfit small datasets aggressively', 'Harder to explain individual predictions without SHAP'],
    prodNote: 'The default go-to for competitive tabular ML. LightGBM is ~3x faster than XGBoost for large datasets. Always use early stopping to prevent overfitting.',
    color: 'var(--prime)',
  },
  {
    id: 'svm',
    name: 'SVM',
    when: { taskType: ['binary', 'multiclass'], dataSize: ['small', 'medium'], interpretability: ['low', 'medium'], featureType: ['tabular'] },
    score: { small: 3, medium: 2, large: 0 },
    strengths: ['Effective in high-dimensional spaces (text, genomics)', 'Works well when n < p', 'Only support vectors matter — memory efficient post-training'],
    risks: ['O(n²) to O(n³) training time — unusable above ~50k samples', 'Sensitive to feature scale', 'Probability calibration requires additional Platt scaling'],
    prodNote: 'Niche use case in 2025: text classification with small data, or any problem where kernel tricks matter. Otherwise, gradient boosting dominates.',
    color: 'var(--ember)',
  },
  {
    id: 'knn',
    name: 'k-NN',
    when: { taskType: ['binary', 'multiclass', 'regression'], dataSize: ['small'], interpretability: ['high'], featureType: ['tabular'] },
    score: { small: 2, medium: 1, large: 0 },
    strengths: ['Zero training time', 'Naturally handles multi-class', 'Interpretable — "similar to these training examples"'],
    risks: ['O(n) prediction time — scales catastrophically', 'Curse of dimensionality above ~20 features', 'Requires careful distance metric choice'],
    prodNote: 'Useful as an exploratory baseline or for recommendation cold-start. Never deploy raw k-NN at scale — use ANN (Faiss, ScaNN) if you need nearest-neighbour lookup in production.',
    color: 'var(--rose)',
  },
  {
    id: 'linear_reg',
    name: 'Linear / Ridge / Lasso Regression',
    when: { taskType: ['regression'], dataSize: ['small', 'medium'], interpretability: ['high'], featureType: ['tabular'] },
    score: { small: 3, medium: 2, large: 1 },
    strengths: ['Interpretable coefficients', 'Ridge handles multicollinearity', 'Lasso does feature selection implicitly', 'Fast and no hyperparameter tuning (Ridge λ aside)'],
    risks: ['Linear assumption — misses non-linear relationships', 'Sensitive to outliers (use Huber loss if needed)', 'Extrapolation outside training range is risky'],
    prodNote: 'Start here for any regression task. If residuals are non-random, you need a more complex model. Lasso is your friend when you have 100+ features.',
    color: 'var(--violet)',
  },
  {
    id: 'tabnet',
    name: 'Neural Net (MLP / TabNet)',
    when: { taskType: ['binary', 'multiclass', 'regression'], dataSize: ['large'], interpretability: ['low'], featureType: ['tabular'] },
    score: { small: 0, medium: 1, large: 2 },
    strengths: ['Can learn complex interactions without feature engineering', 'Scales with data', 'TabNet: attention-based, interpretable for neural net'],
    risks: ['Rarely beats GBMs on structured data with same n', 'Requires more hyperparameter tuning', 'Longer training time, needs GPU for large datasets'],
    prodNote: 'Neural nets on tabular data are almost never the right call unless: (1) you have millions of rows, (2) you\'re already in a DL serving stack and want to unify, or (3) you need joint embeddings with text/images.',
    color: 'var(--gold)',
  },
]

const TASK_TYPES  = [{ v: 'binary', l: 'Binary classification' }, { v: 'multiclass', l: 'Multiclass' }, { v: 'regression', l: 'Regression' }]
const DATA_SIZES  = [{ v: 'small', l: 'Small (<10k rows)' }, { v: 'medium', l: 'Medium (10k–1M)' }, { v: 'large', l: 'Large (>1M)' }]
const INTERP      = [{ v: 'high', l: 'High — explain to stakeholders' }, { v: 'medium', l: 'Medium — SHAP is acceptable' }, { v: 'low', l: 'Low — accuracy only' }]
const FEAT_TYPES  = [{ v: 'tabular', l: 'Tabular / structured' }, { v: 'text', l: 'Text / NLP' }, { v: 'image', l: 'Images' }]

function pill(label, active, onClick, activeColor = 'var(--sky)') {
  return (
    <button key={label} onClick={onClick}
      style={{ padding: '6px 13px', borderRadius: '7px', border: `1px solid ${active ? activeColor : 'var(--rim)'}`, background: active ? activeColor + '18' : 'transparent', color: active ? activeColor : 'var(--ink-low)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.14s', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}

function ModelSelectionOracle() {
  const [taskType, setTaskType] = useState('binary')
  const [dataSize, setDataSize] = useState('medium')
  const [interp,   setInterp]   = useState('medium')
  const [featType, setFeatType] = useState('tabular')
  const [expanded, setExpanded] = useState(null)

  const ranked = useMemo(() => {
    if (featType !== 'tabular') return []
    return MODELS
      .filter(m => m.when.taskType.includes(taskType) && m.when.featureType.includes(featType))
      .filter(m => {
        if (interp === 'high') return m.when.interpretability.includes('high') || m.when.interpretability.includes('medium')
        if (interp === 'medium') return true
        return true
      })
      .map(m => ({ ...m, rank: m.score[dataSize] }))
      .sort((a, b) => b.rank - a.rank)
  }, [taskType, dataSize, interp, featType])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--sky)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Model Selection Oracle</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Set your problem constraints. Get ranked model recommendations with production tradeoffs.
        </p>
      </div>

      {/* Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Task type', items: TASK_TYPES, val: taskType, set: setTaskType, color: 'var(--sky)' },
          { label: 'Data size', items: DATA_SIZES, val: dataSize, set: setDataSize, color: 'var(--ember)' },
          { label: 'Interpretability requirement', items: INTERP, val: interp, set: setInterp, color: 'var(--violet)' },
          { label: 'Feature type', items: FEAT_TYPES, val: featType, set: setFeatType, color: 'var(--mint)' },
        ].map(g => (
          <div key={g.label} className="card" style={{ padding: '14px' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>{g.label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {g.items.map(item => pill(item.l, g.val === item.v, () => g.set(item.v), g.color))}
            </div>
          </div>
        ))}
      </div>

      {/* Non-tabular notice */}
      {featType !== 'tabular' && (
        <div className="card" style={{ padding: '20px', border: '1px solid var(--rim)', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', marginBottom: '8px' }}>{featType === 'text' ? 'TEXT' : 'IMAGE'}</div>
          <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>
            {featType === 'text'
              ? 'Text data: go to the Deep Learning domain. Transformer-based models (BERT, RoBERTa, DistilBERT) are the correct starting point. Classical ML on TF-IDF features is a valid baseline for small datasets.'
              : 'Image data: go to the Deep Learning domain. Pretrained CNNs (ResNet, EfficientNet) or ViTs are the correct approach. Classical ML is not competitive on raw pixels.'}
          </p>
        </div>
      )}

      {/* Ranked results */}
      {featType === 'tabular' && ranked.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="eyebrow">Ranked recommendations</div>
          {ranked.map((m, i) => (
            <div key={m.id} className="card" style={{ padding: 0, overflow: 'hidden', border: i === 0 ? `1px solid ${m.color}50` : undefined }}>
              <button onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: i === 0 ? m.color : 'var(--ink-low)', fontWeight: 700, minWidth: '24px' }}>#{i + 1}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: i === 0 ? m.color : 'var(--ink-hi)', flex: 1 }}>{m.name}</span>
                {i === 0 && <span style={{ fontSize: '10px', padding: '2px 7px', background: m.color + '18', color: m.color, borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>RECOMMENDED</span>}
                <span style={{ fontSize: '12px', color: 'var(--ink-low)', transition: 'transform 0.15s', transform: expanded === m.id ? 'rotate(90deg)' : 'none' }}>›</span>
              </button>

              {expanded === m.id && (
                <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--rim)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '14px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--mint)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Strengths</div>
                      {m.strengths.map((s, j) => <div key={j} style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, marginBottom: '3px' }}>✓ {s}</div>)}
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--rose)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Watch out for</div>
                      {m.risks.map((r, j) => <div key={j} style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.6, marginBottom: '3px' }}>⚠ {r}</div>)}
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Production note</div>
                    <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{m.prodNote}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Analysis Mistakes ──────────────────────────────────────────────
const STATS_SCENARIOS = [
  {
    id: 1,
    scenario: 'Team ran an A/B test. p-value = 0.049. They declare significance and ship. They checked the p-value at days 3, 5, 7, 10, and 14 and stopped when it crossed 0.05.',
    options: [
      'Peeking / multiple comparisons over time',
      'Sample size was too small',
      'The significance threshold should have been 0.01',
      'They should have used a one-tailed test',
    ],
    correct: 0,
    mistake: 'Peeking / multiple comparisons',
    explanation: 'Checking results repeatedly and stopping when significant inflates the Type I error rate. If you check 5 times at α=0.05, actual false positive rate ≈ 23%. Each look is an independent opportunity to get lucky.',
    fix: 'Pre-register your sample size and analysis date before the experiment starts. Use sequential testing methods (e.g. always-valid p-values / mSPRT) if you need to monitor continuously.',
  },
  {
    id: 2,
    scenario: 'Conversion rate test: control 5.0%, treatment 5.1%. p-value = 0.001 (very significant). Team ships it.',
    options: [
      'The p-value threshold is too lenient',
      'Ignoring practical significance — statistical significance is not business significance',
      'They need a longer experiment runtime',
      'Should have used a two-tailed test',
    ],
    correct: 1,
    mistake: 'Ignoring practical significance',
    explanation: 'Statistical significance ≠ practical significance. With millions of users, even a 0.1% lift is detectable at high confidence. The real question: is a 0.1% absolute lift worth the engineering cost, maintenance burden, and rollout risk?',
    fix: 'Define a Minimum Detectable Effect (MDE) before running the test. Power your experiment to detect the smallest effect that actually matters to the business.',
  },
  {
    id: 3,
    scenario: 'Testing 10 new features simultaneously across 10 separate A/B tests, each at α=0.05.',
    options: [
      'Running too many tests slows down the product',
      'Multiple comparisons without correction — inflated family-wise error rate',
      'Each test needs a separate holdout group',
      'The experiments should be run sequentially, not simultaneously',
    ],
    correct: 1,
    mistake: 'Multiple comparisons without correction',
    explanation: 'Running 10 independent tests at α=0.05 means a ~40% chance of at least one false positive (1 − 0.95^10 ≈ 0.40). You will ship a broken feature.',
    fix: 'Apply Bonferroni correction (α/k = 0.005 per test) for strict control, or use False Discovery Rate (FDR) control via Benjamini-Hochberg for a less conservative approach.',
  },
  {
    id: 4,
    scenario: 'ML model evaluation: 95% accuracy on test set. Baseline (predict majority class) achieves 94%.',
    options: [
      'The model needs more training data',
      'Test set might be too small',
      'Ignoring baseline / class imbalance — 1% lift over majority-class baseline is nearly meaningless',
      'Should use cross-validation instead of a held-out test set',
    ],
    correct: 2,
    mistake: 'Ignoring baseline / class imbalance',
    explanation: 'A model that always predicts the majority class achieves 94% accuracy for free. A 1% improvement over that baseline provides almost no real signal. Accuracy on imbalanced data is a misleading metric.',
    fix: 'Always define and report the baseline. Report F1-score, precision/recall, confusion matrix, and per-class accuracy. For imbalanced problems, accuracy alone is not a useful metric.',
  },
  {
    id: 5,
    scenario: 'Experiment to test new onboarding flow. Treatment users are those who saw the new flow. Control are users who saw the old flow in the prior month.',
    options: [
      'The holdout period is too short',
      'Historical control / selection bias — time effects confound the comparison',
      'Need more treatment users for statistical power',
      'Should segment by device type before comparing',
    ],
    correct: 1,
    mistake: 'Historical control / selection bias',
    explanation: 'Comparing to the prior month mixes time effects with treatment effects. Seasonality, marketing campaigns, product launches, and macro changes all happened between the two periods and are now confounded with your onboarding change.',
    fix: 'Always use a concurrent randomised control — users assigned simultaneously to treatment and control during the same time window.',
  },
  {
    id: 6,
    scenario: 'Ran experiment, got p=0.07. Team re-runs on a larger sample until p < 0.05.',
    options: [
      'p=0.07 is close enough to ship — the difference is marginal',
      'p-hacking / data dredging — inflates false positive rate to whatever you are willing to wait for',
      'The original sample size was underpowered and this is the correct fix',
      'Should have used a one-sided test from the start',
    ],
    correct: 1,
    mistake: 'p-hacking / data dredging',
    explanation: 'Running until significant is the definition of p-hacking. You are exploiting random variation in cumulative data. Inflate your sample long enough and almost any noise will eventually cross 0.05.',
    fix: 'Pre-register sample size via power analysis before the experiment. If the first run did not reach significance, the lift may not exist or not be practically meaningful. Treat this as evidence, not an invitation to keep going.',
  },
  {
    id: 7,
    scenario: 'Model trained on US user data. Evaluated on global user data including regions with very different usage patterns. Reports 85% accuracy.',
    options: [
      'The model needs to be retrained on more data',
      'Aggregation masking subgroup failure — global accuracy hides regional breakdown',
      'The accuracy metric is not appropriate for this model type',
      'Need to apply feature normalisation globally',
    ],
    correct: 1,
    mistake: 'Aggregation bias / Simpson\'s paradox',
    explanation: 'Global 85% accuracy can mask that the model performs at 95% on US data and 50% on non-US data. Aggregated metrics hide failure modes across demographics, regions, and subgroups.',
    fix: 'Always report stratified metrics broken down by key subgroups (region, device, user segment, etc.) before shipping. This is a fairness and product quality requirement, not optional.',
  },
  {
    id: 8,
    scenario: 'Two-sample t-test run on revenue per user: heavily right-skewed distribution where 0.1% of users drive 40% of revenue.',
    options: [
      'The sample sizes are unequal between groups',
      'Should use a paired t-test instead of two-sample',
      'Violated test assumptions — t-test is unreliable on heavily skewed, heavy-tailed distributions',
      'Need to log-transform the p-value, not the data',
    ],
    correct: 2,
    mistake: 'Violated test assumptions',
    explanation: 'The t-test assumes approximately normal sampling distribution of the mean. With a heavy-tailed revenue distribution (a few whales driving most revenue), the Central Limit Theorem convergence is very slow. The resulting p-values are unreliable.',
    fix: 'Use Mann-Whitney U test (non-parametric), bootstrap the difference in means (10k iterations), or log-transform revenue per user before applying the t-test.',
  },
]

function StatisticalTestingPitfalls() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState([])

  const s = STATS_SCENARIOS[current]
  const isCorrect = selected === s.correct
  const allDone = answered.length === STATS_SCENARIOS.length

  function handleSelect(idx) {
    if (revealed) return
    setSelected(idx)
  }

  function handleReveal() {
    if (selected === null) return
    setRevealed(true)
    if (selected === s.correct && !answered.includes(current)) {
      setScore(sc => sc + 1)
      setAnswered(a => [...a, current])
    } else if (!answered.includes(current)) {
      setAnswered(a => [...a, current])
    }
  }

  function handleNext() {
    if (current < STATS_SCENARIOS.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  function handleReset() {
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setAnswered([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--sky)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Analysis Mistakes</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          8 real scenarios. Identify the statistical mistake. Understand why it matters in production.
        </p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {STATS_SCENARIOS.map((_, i) => (
            <div key={i} onClick={() => { setCurrent(i); setSelected(null); setRevealed(false) }}
              style={{ width: '24px', height: '6px', borderRadius: '3px', cursor: 'pointer', background: answered.includes(i) ? 'var(--sky)' : i === current ? 'rgba(34,211,238,0.4)' : 'var(--rim)', transition: 'background 0.2s' }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{score}/{STATS_SCENARIOS.length} correct</span>
      </div>

      {/* Scenario card */}
      <div className="card animate-slide-up" style={{ padding: '22px', borderLeft: '3px solid var(--sky)' }}>
        <div style={{ fontSize: '10px', color: 'var(--sky)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Scenario {current + 1} of {STATS_SCENARIOS.length}</div>
        <p style={{ fontSize: '14px', color: 'var(--ink-hi)', lineHeight: 1.75, margin: 0, fontFamily: 'var(--font-sans)' }}>{s.scenario}</p>
      </div>

      {/* Question */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--ink-low)', marginBottom: '10px', fontFamily: 'var(--font-sans)' }}>What is the primary mistake being made?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {s.options.map((opt, idx) => {
            let borderColor = 'var(--rim)'
            let bg = 'transparent'
            let textColor = 'var(--ink-mid)'
            if (selected === idx && !revealed) { borderColor = 'var(--sky)'; bg = 'rgba(34,211,238,0.14)'; textColor = 'var(--sky)' }
            if (revealed && idx === s.correct) { borderColor = 'var(--mint)'; bg = 'rgba(52,211,153,0.15)'; textColor = 'var(--mint)' }
            if (revealed && selected === idx && idx !== s.correct) { borderColor = 'var(--rose)'; bg = 'rgba(251,113,133,0.15)'; textColor = 'var(--rose)' }
            return (
              <button key={idx} onClick={() => handleSelect(idx)}
                style={{ padding: '12px 16px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: bg, color: textColor, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', minWidth: '18px' }}>{String.fromCharCode(65 + idx)}</span>
                {opt}
                {revealed && idx === s.correct && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✓</span>}
                {revealed && selected === idx && idx !== s.correct && <span style={{ marginLeft: 'auto', fontSize: '11px' }}>✗</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Action buttons */}
      {!revealed && (
        <button className="btn-primary" onClick={handleReveal} disabled={selected === null}
          style={{ alignSelf: 'flex-start', opacity: selected === null ? 0.4 : 1, cursor: selected === null ? 'not-allowed' : 'pointer' }}>
          Reveal answer
        </button>
      )}

      {/* Explanation */}
      {revealed && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '18px', borderLeft: `3px solid ${isCorrect ? 'var(--mint)' : 'var(--rose)'}` }}>
            <div style={{ fontSize: '10px', color: isCorrect ? 'var(--mint)' : 'var(--rose)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              {isCorrect ? 'Correct — ' : 'Incorrect — '}{s.mistake}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: '0 0 10px' }}>{s.explanation}</p>
            <div style={{ padding: '10px 14px', background: 'rgba(34,211,238,0.13)', borderRadius: '6px', border: '1px solid rgba(34,211,238,0.15)' }}>
              <span style={{ fontSize: '10px', color: 'var(--sky)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fix: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.7 }}>{s.fix}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {current < STATS_SCENARIOS.length - 1 && (
              <button className="btn-primary" onClick={handleNext}>Next scenario →</button>
            )}
            <button className="btn-ghost" onClick={handleReset}>Restart</button>
          </div>
        </div>
      )}

      {allDone && revealed && current === STATS_SCENARIOS.length - 1 && (
        <div className="card animate-slide-up" style={{ padding: '20px', textAlign: 'center', borderLeft: '3px solid var(--sky)' }}>
          
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '4px' }}>
            {score}/{STATS_SCENARIOS.length} correct
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: '0 0 14px', lineHeight: 1.6 }}>
            {score === STATS_SCENARIOS.length ? 'Perfect. You can audit your team\'s A/B tests.' : score >= 6 ? 'Strong. A few edge cases to tighten up.' : 'Keep at it — these mistakes are everywhere in industry.'}
          </p>
          <button className="btn-ghost" onClick={handleReset}>Retry all scenarios</button>
        </div>
      )}
    </div>
  )
}

// ── Calibration in Practice ───────────────────────────────────────────────────
const CALIB_SCENARIOS = [
  {
    id: 1,
    scenario: 'Fraud model. Business team sets a threshold at 0.5 to flag transactions. Model predicts 0.80 for many cases that are only 30% fraud in reality. Holdout set: 2k samples.',
    correct: 'platt',
    explanation: 'Threshold-based decision (0.5 cutoff) means calibration matters — the raw score will produce too many false positives. Holdout of 2k samples is too small for isotonic regression (it would overfit). Platt scaling fits a logistic regression on model outputs and works well with ~1k samples.',
    wrong: { isotonic: 'Isotonic regression needs 10k+ samples. With 2k it will overfit the calibration curve.', temperature: 'Temperature scaling is designed for neural network logits, not gradient boosting outputs.', none: 'Calibration matters here — the threshold at 0.5 will misfire because the model\'s 80% is actually 30% fraud.', moredata: 'You have enough data for Platt scaling. No need to delay calibration.' },
  },
  {
    id: 2,
    scenario: 'Recommendation ranker. Output scores used only for ordering items — never converted to probabilities, never used with a threshold.',
    correct: 'none',
    explanation: 'Pure ranking use case. Calibration changes the magnitude of scores but does not change their ordering. If you never threshold or interpret the scores as probabilities, calibration adds zero business value. Save the compute.',
    wrong: { platt: 'Platt scaling would change score values but not rankings. No downstream benefit.', isotonic: 'Same issue — calibration changes magnitudes but rankings are unchanged.', temperature: 'Temperature scaling affects confidence of predictions, not ranking order.', moredata: 'Data is not the constraint — calibration simply is not needed here.' },
  },
  {
    id: 3,
    scenario: 'Neural network text classifier. 10 classes. Model is systematically overconfident — outputs 0.99 for most predictions. 50k validation samples available.',
    correct: 'temperature',
    explanation: 'Neural networks are known to be systematically overconfident. Temperature scaling divides the logits by a single scalar T, reducing confidence without changing class rankings. Computationally cheap, preserves relative ordering, and 50k samples is more than enough to fit one parameter.',
    wrong: { platt: 'Platt scaling does not extend naturally to 10-class problems and does not exploit the logit structure.', isotonic: 'Would work with 50k samples but is overkill — temperature scaling solves exactly this problem with one parameter.', none: 'Model outputs 0.99 for most cases but is often wrong. Calibration is clearly needed.', moredata: 'You already have 50k samples — more than enough.' },
  },
  {
    id: 4,
    scenario: 'Gradient boosting churn model. Calibration plot shows an S-curve (underestimates low probabilities, overestimates high ones). 500 holdout samples.',
    correct: 'platt',
    explanation: 'An S-shaped calibration curve is exactly what Platt scaling is designed to fix — it fits a sigmoid (logistic) function to the model outputs, which corrects the S-curve shape. 500 samples is too small for isotonic regression (it would overfit to noise).',
    wrong: { isotonic: 'Isotonic regression needs 10k+ samples. With 500 it will fit to noise and perform worse than Platt.', temperature: 'Temperature scaling is for neural network logits. It applies a uniform multiplicative scaling that cannot fix an S-curve.', none: 'The model underestimates low probabilities and overestimates high ones — if threshold decisions are made, this matters.', moredata: 'Platt scaling can work at 500 samples. Collecting more data before doing anything is not necessary here.' },
  },
  {
    id: 5,
    scenario: 'Logistic regression trained on highly imbalanced data (1% positive rate). Used for credit risk scoring — loan officers interpret the score directly as a probability.',
    correct: 'platt',
    explanation: 'Class imbalance causes logistic regression to produce miscalibrated probabilities, especially at the extremes. Since loan officers treat the output as a literal probability when making decisions, calibration accuracy is critical. Platt scaling works well here; isotonic is better if you have 10k+ holdout samples.',
    wrong: { isotonic: 'Isotonic regression is the right idea but only if you have 10k+ holdout samples. Mention this caveat — otherwise Platt is the practical default.', temperature: 'Temperature scaling is designed for neural network logits, not logistic regression.', none: 'Loan officers are making decisions based on the probability directly — miscalibrated scores cause direct harm.', moredata: 'If you have enough holdout data (1k+), proceed with Platt. More data enables isotonic.' },
  },
  {
    id: 6,
    scenario: 'Model trained 6 months ago. Recent data shows distribution shift — calibration plot from the last month shows systematic deviation from the diagonal.',
    correct: 'platt',
    explanation: 'Distribution shift causing miscalibration should trigger recalibration (Platt or isotonic depending on holdout size). However, recalibration is a temporary fix — the underlying model may have decayed. Recalibrate now while scheduling a full retraining.',
    wrong: { isotonic: 'Correct approach if you have 10k+ recent samples. Platt is the safer default.', temperature: 'Designed for neural network logit scaling, not general recalibration after distribution shift.', none: 'The calibration plot shows systematic deviation — ignoring it means your probabilities are wrong.', moredata: 'You should have recent production data. Use it for recalibration now, retraining later.' },
  },
  {
    id: 7,
    scenario: 'Random forest model. Predicted probability histogram spikes near 0 and near 1 with very few intermediate values. 5k holdout samples.',
    correct: 'platt',
    explanation: 'Random forest probabilities are notoriously clunky — leaf node averaging produces values clustered near 0 and 1. Platt scaling is the standard fix. With 5k samples you are borderline for isotonic regression — try both with cross-validation and pick the one with lower calibration error.',
    wrong: { isotonic: 'Possible at 5k samples but borderline — try with cross-validation to avoid overfitting. Platt is the safer starting point.', temperature: 'Temperature scaling is for neural network logits and does not address the discrete clustering of RF probabilities.', none: 'The probability histogram spiking at extremes is exactly the problem that Platt/isotonic fix.', moredata: '5k is enough to proceed. Platt scaling needs ~1k, isotonic needs ~10k.' },
  },
  {
    id: 8,
    scenario: 'Brand new model. Holdout set has only 200 samples. Calibration curve suggests the model is miscalibrated.',
    correct: 'moredata',
    explanation: '200 samples gives extremely noisy calibration estimates. Any calibration method (Platt or isotonic) fitted on 200 points will overfit the calibration curve and likely make things worse. Fix the data collection problem first, then calibrate.',
    wrong: { platt: 'Platt scaling on 200 samples will overfit. The fitted sigmoid will chase noise, not signal.', isotonic: 'Isotonic regression would massively overfit at 200 samples — it has no regularisation.', temperature: 'Temperature scaling on 200 samples is unreliable — the estimated temperature will be noisy.', none: 'Once you have enough data, calibration will be needed. This is not a skip — it is a delay.' },
  },
]

const CALIB_OPTIONS = [
  { id: 'platt', label: 'Platt scaling' },
  { id: 'isotonic', label: 'Isotonic regression' },
  { id: 'temperature', label: 'Temperature scaling' },
  { id: 'none', label: 'No calibration needed' },
  { id: 'moredata', label: 'Collect more data first' },
]

const CALIB_REFERENCE = [
  { term: 'Well-calibrated', def: 'Predicted probability = empirical frequency. If the model says 80%, ~80% of those cases are actually positive.' },
  { term: 'Platt scaling', def: 'Logistic regression fitted on model output scores. Corrects sigmoid-shaped miscalibration. Needs ~1k holdout samples.' },
  { term: 'Isotonic regression', def: 'Non-parametric, more flexible than Platt. Needs 10k+ samples. Can overfit on small data.' },
  { term: 'Temperature scaling', def: 'Single parameter T divides neural network logits. Preserves class ranking. Standard for overconfident neural nets and LLMs.' },
  { term: 'No calibration needed', def: 'When the model is used purely for ranking (not threshold-based decisions), calibration adds no value.' },
]

function CalibrationInPractice() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState([])
  const [refOpen, setRefOpen] = useState(true)

  const s = CALIB_SCENARIOS[current]
  const isCorrect = selected === s.correct

  function handleReveal() {
    if (!selected) return
    setRevealed(true)
    if (selected === s.correct && !answered.includes(current)) {
      setScore(sc => sc + 1)
      setAnswered(a => [...a, current])
    } else if (!answered.includes(current)) {
      setAnswered(a => [...a, current])
    }
  }

  function handleNext() {
    if (current < CALIB_SCENARIOS.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  function handleReset() {
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setScore(0)
    setAnswered([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--sky)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Calibration in Practice</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Given a model and scenario, pick the right calibration approach. Understand when and why each method applies.
        </p>
      </div>

      {/* Quick reference */}
      <div className="card" style={{ padding: '16px', border: '1px solid var(--rim)' }}>
        <button onClick={() => setRefOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left' }}>
          <span style={{ fontSize: '10px', color: 'var(--sky)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>Quick reference</span>
          <span style={{ fontSize: '12px', color: 'var(--ink-low)', transform: refOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
        </button>
        {refOpen && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CALIB_REFERENCE.map(r => (
              <div key={r.term} style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--sky)', minWidth: '140px', paddingTop: '1px' }}>{r.term}</span>
                <span style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6 }}>{r.def}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {CALIB_SCENARIOS.map((_, i) => (
            <div key={i} onClick={() => { setCurrent(i); setSelected(null); setRevealed(false) }}
              style={{ width: '24px', height: '6px', borderRadius: '3px', cursor: 'pointer', background: answered.includes(i) ? 'var(--sky)' : i === current ? 'rgba(34,211,238,0.4)' : 'var(--rim)', transition: 'background 0.2s' }} />
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{score}/{CALIB_SCENARIOS.length} correct</span>
      </div>

      {/* Scenario */}
      <div className="card animate-slide-up" style={{ padding: '22px', borderLeft: '3px solid var(--sky)' }}>
        <div style={{ fontSize: '10px', color: 'var(--sky)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Scenario {current + 1} of {CALIB_SCENARIOS.length}</div>
        <p style={{ fontSize: '14px', color: 'var(--ink-hi)', lineHeight: 1.75, margin: 0, fontFamily: 'var(--font-sans)' }}>{s.scenario}</p>
      </div>

      {/* Options */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--ink-low)', marginBottom: '10px', fontFamily: 'var(--font-sans)' }}>Which calibration approach is most appropriate?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CALIB_OPTIONS.map(opt => {
            let borderColor = 'var(--rim)'
            let bg = 'transparent'
            let textColor = 'var(--ink-mid)'
            if (selected === opt.id && !revealed) { borderColor = 'var(--sky)'; bg = 'rgba(34,211,238,0.14)'; textColor = 'var(--sky)' }
            if (revealed && opt.id === s.correct) { borderColor = 'var(--mint)'; bg = 'rgba(52,211,153,0.15)'; textColor = 'var(--mint)' }
            if (revealed && selected === opt.id && opt.id !== s.correct) { borderColor = 'var(--rose)'; bg = 'rgba(251,113,133,0.15)'; textColor = 'var(--rose)' }
            return (
              <button key={opt.id} onClick={() => { if (!revealed) setSelected(opt.id) }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: bg, color: textColor, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: revealed ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {!revealed && (
        <button className="btn-primary" onClick={handleReveal} disabled={!selected}
          style={{ alignSelf: 'flex-start', opacity: !selected ? 0.4 : 1, cursor: !selected ? 'not-allowed' : 'pointer' }}>
          Reveal answer
        </button>
      )}

      {revealed && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '18px', borderLeft: `3px solid ${isCorrect ? 'var(--mint)' : 'var(--rose)'}` }}>
            <div style={{ fontSize: '10px', color: isCorrect ? 'var(--mint)' : 'var(--rose)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              {isCorrect ? 'Correct' : `Incorrect — answer: ${CALIB_OPTIONS.find(o => o.id === s.correct)?.label}`}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: '0 0 12px' }}>{s.explanation}</p>
            {selected !== s.correct && s.wrong[selected] && (
              <div style={{ padding: '10px 14px', background: 'rgba(251,113,133,0.11)', borderRadius: '6px', border: '1px solid rgba(251,113,133,0.15)', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', color: 'var(--rose)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Why {CALIB_OPTIONS.find(o => o.id === selected)?.label} is wrong: </span>
                <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.7 }}>{s.wrong[selected]}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {current < CALIB_SCENARIOS.length - 1 && (
              <button className="btn-primary" onClick={handleNext}>Next scenario →</button>
            )}
            <button className="btn-ghost" onClick={handleReset}>Restart</button>
          </div>
        </div>
      )}

      {answered.length === CALIB_SCENARIOS.length && revealed && current === CALIB_SCENARIOS.length - 1 && (
        <div className="card animate-slide-up" style={{ padding: '20px', textAlign: 'center', borderLeft: '3px solid var(--sky)' }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', marginBottom: '8px', letterSpacing: '0.05em' }}>COMPLETE</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)', marginBottom: '4px' }}>
            {score}/{CALIB_SCENARIOS.length} correct
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: '0 0 14px', lineHeight: 1.6 }}>
            {score === CALIB_SCENARIOS.length ? 'Flawless. You know calibration cold.' : score >= 6 ? 'Solid. A couple of edge cases to revisit.' : 'Calibration is subtle — keep building the intuition.'}
          </p>
          <button className="btn-ghost" onClick={handleReset}>Retry all scenarios</button>
        </div>
      )}
    </div>
  )
}

// ── Metric Design Pitfalls ────────────────────────────────────────────────────
function computeRecommendation({ goal, effectSize, dailyUsers, fpr, varianceReduction }) {
  const alpha = fpr === '5pct' ? 0.05 : fpr === '1pct' ? 0.01 : 0.10
  const power = 0.80
  // z-scores for common alpha/power combos (two-tailed)
  const zAlpha = fpr === '5pct' ? 1.96 : fpr === '1pct' ? 2.576 : 1.645
  const zBeta = 1.28 // 80% power

  // Base relative MDE to absolute delta (rough)
  const baseMDE = effectSize === 'large' ? 0.10 : effectSize === 'medium' ? 0.05 : 0.01
  // Baseline proportion for conversion/churn (assumed)
  const p = goal === 'churn' ? 0.15 : 0.10
  const delta = p * baseMDE

  // Sample size per group: n = 2 * (z_alpha + z_beta)^2 * p*(1-p) / delta^2
  let n = Math.ceil(2 * Math.pow(zAlpha + zBeta, 2) * p * (1 - p) / Math.pow(delta, 2))

  // Revenue has high variance — multiply sample size
  if (goal === 'revenue') n = n * 4

  // CUPED reduces required n by 20-40%
  if (varianceReduction === 'yes') n = Math.ceil(n * 0.70)

  const dailyN = dailyUsers === 'lt1k' ? 500 : dailyUsers === '1k10k' ? 5000 : dailyUsers === '10k100k' ? 50000 : 200000
  const daysNeeded = Math.ceil((n * 2) / dailyN)

  let design = 'Standard A/B'
  let impossible = false
  let impossibleReason = ''

  if (effectSize === 'small' && dailyUsers === 'lt1k' && varianceReduction !== 'yes') {
    impossible = true
    impossibleReason = 'Small effect + fewer than 1k daily users without variance reduction = underpowered by design. You need 6+ months of data for this experiment to have any chance at 80% power. Either increase traffic, use CUPED/CUPAC to reduce variance, or accept that the lift you\'re looking for cannot be measured at this scale.'
  }

  if (goal === 'mlquality') {
    design = 'Shadow mode + offline metrics'
  } else if (daysNeeded <= 7 && dailyUsers === 'gt100k') {
    design = 'Standard A/B'
  }

  return { n, daysNeeded, design, impossible, impossibleReason, alpha }
}

const GOAL_OPTS = [
  { v: 'conversion', l: 'Detect lift in conversion' },
  { v: 'revenue', l: 'Detect lift in revenue' },
  { v: 'churn', l: 'Detect reduction in churn' },
  { v: 'mlquality', l: 'Validate ML model quality' },
]
const EFFECT_OPTS = [
  { v: 'large', l: 'Large (>10% relative)' },
  { v: 'medium', l: 'Medium (2–10%)' },
  { v: 'small', l: 'Small (<2%)' },
]
const USERS_OPTS = [
  { v: 'lt1k', l: '<1k / day' },
  { v: '1k10k', l: '1k–10k / day' },
  { v: '10k100k', l: '10k–100k / day' },
  { v: 'gt100k', l: '>100k / day' },
]
const FPR_OPTS = [
  { v: '5pct', l: '5% (standard)' },
  { v: '1pct', l: '1% (conservative)' },
  { v: '10pct', l: '10% (exploratory)' },
]
const VAR_OPTS = [
  { v: 'no', l: 'No' },
  { v: 'yes', l: 'Yes — CUPED/CUPAC' },
]

const CALLOUTS = [
  {
    title: 'Power',
    color: 'var(--sky)',
    text: 'You want 80% power (β=0.2). This means a 20% chance of missing a real effect. For high-stakes decisions, use 90% power (β=0.1) — this increases required sample size by roughly 25%.',
  },
  {
    title: 'Runtime',
    color: 'var(--violet)',
    text: 'Never extend an experiment that has already been peeked at. Pre-register your runtime before starting. If you need to extend, treat it as a new independent experiment with a corrected alpha.',
  },
  {
    title: 'Guardrails',
    color: 'var(--ember)',
    text: 'Always define guardrail metrics before starting. If treatment lifts conversion but crashes load time by 20%, you need to catch that before shipping. Guardrails are not optional.',
  },
]

const METRIC_SCENARIOS = [
  {
    id: 'goodhart',
    scenario: 'A support team optimizes their ML model for CSAT (customer satisfaction score). Engineers route easy, auto-resolvable tickets to the ML system and hard tickets to humans. CSAT for ML-handled tickets jumps from 3.2 to 4.6. The team celebrates.',
    question: 'What is the metric design failure?',
    options: ['Goodhart\'s Law — the metric became the target, not the outcome', 'Sample size too small for statistical significance', 'CSAT is the wrong metric — should use NPS', 'The model needs recalibration'],
    correct: 0,
    explanation: 'Goodhart\'s Law: when a measure becomes a target, it ceases to be a good measure. The team didn\'t improve customer experience — they gamed the routing to inflate the score. The true metric (resolution quality on hard tickets) got worse. Fix: track CSAT stratified by ticket difficulty, and monitor deflection rate as a counter-metric.',
    color: 'var(--rose)',
  },
  {
    id: 'aggregate_hides',
    scenario: 'A recommendation model achieves overall NDCG@10 of 0.72, up from 0.68. The team ships. Two weeks later, mobile product managers report that mobile user engagement dropped 18%. Desktop engagement improved.',
    question: 'What metric design mistake caused this?',
    options: ['Aggregate metric masked a segment failure', 'NDCG is the wrong metric for recommendations', 'The model was undertrained', 'Mobile users need a different model architecture'],
    correct: 0,
    explanation: 'Aggregate metrics hide segment-level failures. Desktop volume (80% of traffic) dominated the NDCG improvement, masking a significant degradation for mobile users. Fix: always track segment metrics (device, user cohort, geography) alongside aggregate. A top-line improvement that harms a minority segment is not a win.',
    color: 'var(--ember)',
  },
  {
    id: 'proxy_decoupled',
    scenario: 'A fraud model achieves AUC-PR of 0.91, up from 0.84. Offline metrics look great. After deployment, finance reports that fraud losses increased 12% month-over-month.',
    question: 'What is the most likely cause?',
    options: ['The offline metric has decoupled from the true business outcome', 'AUC-PR calculation is wrong', 'The model needs more training data', 'Feature pipeline has a bug'],
    correct: 0,
    explanation: 'AUC-PR measures ranking quality over all thresholds. In production, the model runs at a specific threshold — if that threshold is miscalibrated, high AUC-PR doesn\'t prevent fraud losses. The true metric (fraud dollar loss) and the proxy metric (AUC-PR) have decoupled. Fix: track precision and recall at your operating threshold, not just aggregate AUC. Add dollar-weighted false negative rate as a primary metric.',
    color: 'var(--ember)',
  },
  {
    id: 'rate_vs_count',
    scenario: 'An email spam filter improves precision from 82% to 91%. The team ships. Users complain that important emails are being blocked more frequently than before.',
    question: 'What metric captures what actually went wrong?',
    options: ['Recall dropped — more legitimate emails are being blocked as spam', 'Precision measures the wrong thing here', 'The training set was too small', 'Email features have shifted distribution'],
    correct: 0,
    explanation: 'Higher precision means fewer false positives (spam reaching inbox). But if recall dropped, more legitimate emails are falsely classified as spam. The team optimized one side of the precision-recall tradeoff without tracking the other. Fix: in asymmetric cost scenarios (blocking real email is worse than missing spam), recall is the primary metric. Always define cost asymmetry before choosing which metric to optimize.',
    color: 'var(--gold)',
  },
  {
    id: 'time_horizon',
    scenario: 'A recommendation feature increases 1-week retention from 34% to 38%. The team ships. Six months later, 6-month retention has dropped from 61% to 54%.',
    question: 'What metric design mistake caused this?',
    options: ['Wrong time horizon — optimizing short-term at the expense of long-term', 'Sample size was too small for the 6-month metric', '6-month retention is not a valid ML metric', 'The model degraded due to concept drift'],
    correct: 0,
    explanation: 'The model learned to optimize short-term engagement at the cost of long-term quality. This is a classic metric time horizon mismatch — the recommendation system shows engaging but lower-quality content that spikes 1-week retention but causes burnout. Fix: track both short-term and long-term metrics. If they diverge in opposite directions post-ship, you\'re trading long-term health for short-term gains.',
    color: 'var(--gold)',
  },
  {
    id: 'counter_metric',
    scenario: 'A search ranking model improves CTR from 3.2% to 3.8%. The team ships. SRE reports p99 latency increased from 180ms to 340ms. The team says "that\'s an infra problem, not a model problem."',
    question: 'What was missing from the model\'s success criteria?',
    options: ['A latency counter-metric was never defined as a release gate', 'CTR is the wrong metric for search ranking', 'The model needs to be quantized', 'Infra team should have scaled before the launch'],
    correct: 0,
    explanation: 'CTR-only optimization ignores the cost of getting that CTR. The model likely became more complex or uses more features, increasing inference time. A counter-metric (max latency budget, or latency regression threshold) should be a hard gate on any model ship. Fix: define counter-metrics before shipping: latency, cost per inference, coverage rate. A lift in the primary metric that exceeds counter-metric thresholds is a no-ship.',
    color: 'var(--sky)',
  },
  {
    id: 'leading_lagging',
    scenario: 'A churn prediction model is evaluated on 30-day churn rate (whether a user churned within 30 days of scoring). AUC is high. After deployment, the team notices the model scores correctly but interventions (discount emails) are sent too late to prevent churn.',
    question: 'What is the metric design failure?',
    options: ['The label is a lagging indicator — the event has already started by scoring time', 'AUC is not appropriate for churn prediction', 'The model needs a lower decision threshold', 'Email interventions are the wrong strategy'],
    correct: 0,
    explanation: 'A 30-day churn label is a lagging indicator. By the time a user shows the behavioral signals that predict churn, they may be 25 days into the churn process. Intervening at day 27 is too late. Fix: identify leading indicators (support ticket opens, usage frequency drop, feature disengagement) and predict from those signals 60-90 days out. Evaluate on whether interventions at high-score users reduce churn, not whether the model correctly identifies users who already churned.',
    color: 'var(--sky)',
  },
  {
    id: 'denominator_shift',
    scenario: 'Conversion rate improves from 4.2% to 4.9% after a new recommendation model ships. The business reports overall conversions dropped 8% in the same period.',
    question: 'What happened?',
    options: ['The denominator (eligible traffic) shrank — fewer users were exposed to the model', 'Seasonality caused absolute conversion drop', 'The model has coverage gaps', 'Revenue attribution is miscounted'],
    correct: 0,
    explanation: 'Rate metrics can improve while absolute counts fall if the denominator shrinks. The model may be more conservative — it only recommends when confident, reducing coverage. Fewer recommendations but higher conversion rate = lower total conversions. Fix: track both rate and absolute count. Coverage rate (% of sessions where model fires) is a critical counter-metric for any recommendation or ranking system.',
    color: 'var(--violet)',
  },
]

function MetricDesign() {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState([])

  const s = METRIC_SCENARIOS[idx]
  const isAnswered = answered.includes(idx)
  const isCorrect = selected === s.correct

  function handleAnswer(i) {
    if (isAnswered) return
    setSelected(i)
    setRevealed(true)
    setAnswered(prev => [...prev, idx])
    if (i === s.correct) setScore(sc => sc + 1)
  }

  function next() {
    setIdx(i => Math.min(i + 1, METRIC_SCENARIOS.length - 1))
    setSelected(null)
    setRevealed(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 800, color: 'var(--sky)', letterSpacing: '-0.02em', marginBottom: '4px' }}>Metric Design Pitfalls</h3>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          8 production cases where the metric looked right but led teams wrong. Goodhart's Law, proxy decoupling, time horizons, counter-metrics.
        </p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {METRIC_SCENARIOS.map((_, i) => (
            <div key={i} style={{
              width: '28px', height: '4px', borderRadius: '2px',
              background: answered.includes(i)
                ? (i === idx && !isCorrect ? 'var(--rose)' : answered.includes(i) && METRIC_SCENARIOS[i].correct === (i === idx ? selected : null) ? 'var(--mint)' : answered.includes(i) ? 'var(--mint)' : 'var(--rim)')
                : i === idx ? 'var(--prime)' : 'var(--rim)',
            }} />
          ))}
        </div>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>
          {answered.length}/{METRIC_SCENARIOS.length} correct
        </span>
      </div>

      {/* Scenario */}
      <div className="card" style={{ borderLeft: `3px solid ${s.color}`, padding: '18px 20px' }}>
        <div style={{ fontSize: '10px', color: s.color, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Scenario {idx + 1} of {METRIC_SCENARIOS.length}
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-hi)', lineHeight: 1.7, margin: '0 0 12px' }}>{s.scenario}</p>
        <div style={{ fontSize: '13px', color: 'var(--ink-low)', fontStyle: 'italic' }}>{s.question}</div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {s.options.map((opt, i) => {
          const isSelected = selected === i
          const isRight = i === s.correct
          let bg = 'var(--depth)', border = 'var(--rim)', color = 'var(--ink-hi)'
          if (revealed) {
            if (isRight) { bg = 'rgba(52,211,153,0.15)'; border = 'rgba(52,211,153,0.4)'; color = 'var(--mint)' }
            else if (isSelected && !isRight) { bg = 'rgba(244,63,94,0.15)'; border = 'rgba(244,63,94,0.4)'; color = 'var(--rose)' }
          } else if (isSelected) { bg = 'rgba(240,165,0,0.15)'; border = 'rgba(240,165,0,0.4)' }
          return (
            <button key={i} onClick={() => handleAnswer(i)}
              style={{
                textAlign: 'left', padding: '12px 16px', borderRadius: '8px', cursor: isAnswered ? 'default' : 'pointer',
                border: `1px solid ${border}`, background: bg, color,
                display: 'flex', gap: '10px', alignItems: 'flex-start', transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0, marginTop: '2px', opacity: 0.6 }}>
                {String.fromCharCode(65 + i)}
              </span>
              <span style={{ fontSize: '13px', lineHeight: 1.5 }}>{opt}</span>
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <div className="card animate-slide-up" style={{ background: `color-mix(in srgb, ${s.color} 5%, var(--depth))`, border: `1px solid color-mix(in srgb, ${s.color} 30%, transparent)` }}>
          <div style={{ fontSize: '11px', color: s.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 700 }}>
            {isCorrect ? 'Correct.' : 'Not quite.'} {METRIC_SCENARIOS[idx].options[s.correct]}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.7, margin: 0 }}>{s.explanation}</p>
        </div>
      )}

      {/* Navigation */}
      {revealed && idx < METRIC_SCENARIOS.length - 1 && (
        <button className="btn-primary" onClick={next} style={{ alignSelf: 'flex-start' }}>
          Next scenario →
        </button>
      )}
      {revealed && idx === METRIC_SCENARIOS.length - 1 && (
        <div className="card" style={{ textAlign: 'center', padding: '20px', border: '1px solid var(--prime)' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: 'var(--prime)', marginBottom: '4px' }}>
            {score}/{METRIC_SCENARIOS.length} correct
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ink-low)' }}>
            {score >= 7 ? 'Strong metric judgment.' : score >= 5 ? 'Good instincts — review the ones you missed.' : 'Metric design is a senior skill. Re-read the explanations.'}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Roadmap ───────────────────────────────────────────────────────────────────
const ROADMAP = [
  { label: 'Model Selection Oracle',       desc: 'Given constraints, get ranked model recommendations with production tradeoffs.',                    status: 'live' },
  { label: 'Analysis Mistakes',            desc: 'p-hacking, practical vs statistical significance, multiple comparisons, violated assumptions.',     status: 'live' },
  { label: 'Calibration in Practice',      desc: 'When Platt scaling helps, when it doesn\'t, and why your model\'s 80% confidence means 60%.',      status: 'live' },
  { label: 'Metric Design Pitfalls',       desc: 'Goodhart\'s Law, proxy decoupling, time horizons, counter-metrics — 8 production cases.',          status: 'live' },
  { label: 'Feature Importance vs Causation', desc: 'When SHAP values lie. Spurious correlations in production. Causal inference basics.',           status: 'soon', devBrief: { micro: 'AccordionMCQ, 3 scenarios. When SHAP lies (correlated features, model extrapolation, time-series leakage into importance). Spurious correlations. Brief causal inference intro: what the right diagnostic is when importance misleads.', macro: 'Bridges DataScienceTab (model evaluation) with CausalInferenceTab (identification strategies). Gateway scenario for causal thinking — most practitioners encounter SHAP before they understand why it can mislead.' } },
  { label: 'Classical ML Failure Modes',   desc: '15 ways gradient boosting, random forests, and SVMs silently fail in production.',                 status: 'soon', devBrief: { micro: 'AccordionMCQ, 4 scenarios framed from a DS perspective: XGBoost overfitting to val set via hyperparameter search, RF importance vs permutation importance, SVM scaling failure, LR calibration gap. DS framing: when to use vs when it breaks — not the engineering fix.', macro: 'Bridges DataScienceTab and ClassicalMLTab. This is the Data Science framing (model choice consequence) vs ClassicalMLTab\'s ML Engineering framing (how to fix). Cross-link to ClassicalMLTab for the remediation side.' } },
]

// ── Modules ───────────────────────────────────────────────────────────────────
const DS_MODULES = [
  { id: 'oracle',      label: 'Model Selection Oracle', component: ModelSelectionOracle },
  { id: 'stats',       label: 'Analysis Mistakes', component: StatisticalTestingPitfalls },
  { id: 'calibration', label: 'Calibration in Practice', component: CalibrationInPractice },
  { id: 'expdesign',   label: 'Metric Design Pitfalls', component: MetricDesign },
]

export default function DataScienceTab({ onNavigate }) {
  const [active, setActive] = useState('oracle')
  const ActiveModule = DS_MODULES.find(m => m.id === active)?.component ?? ModelSelectionOracle

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', margin: 0, background: 'linear-gradient(135deg, var(--sky) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Data Science</h1>
        </div>
        <p style={{ fontSize: '15px', color: 'var(--ink-mid)', lineHeight: 1.7, maxWidth: '600px' }}>
          Statistics courses teach you the math. This domain teaches you the judgment — when each model is the wrong choice, which tests are being misused, and why your calibration is broken.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {DS_MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${active === m.id ? 'var(--sky)' : 'var(--rim)'}`, background: active === m.id ? 'rgba(34,211,238,0.10)' : 'transparent', color: active === m.id ? 'var(--sky)' : 'var(--ink-low)', fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Active module */}
      <div key={active} className="tab-enter"><ActiveModule /></div>

      {/* Roadmap */}
      <div>
        <div className="eyebrow" style={{ marginBottom: '16px' }}>What's being built</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {ROADMAP.map(m => (
            <div key={m.label} className="card" style={{ padding: '16px', opacity: m.status === 'live' ? 1 : 0.6, borderLeft: m.status === 'live' ? '2px solid var(--sky)' : '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: m.status === 'live' ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{m.label}</span>
                {m.status === 'live' && <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'rgba(52,211,153,0.12)', color: 'var(--mint)', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>LIVE</span>}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
