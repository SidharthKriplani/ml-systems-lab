import { useState, useEffect } from 'react'
import AccessGate from '../components/AccessGate.jsx'
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

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODELS = [
  {
    id: 'decision-tree',
    name: 'Decision Tree',
    difficulty: 'junior',
    isFree: true,
    silentFailure: 'Unpruned tree memorizes training set. Accuracy looks fine on IID test set but collapses on any distribution shift. The feature splits become nonsensical — 0.00001 thresholds on continuous variables.',
    story: '"Our churn model had 98% train accuracy, 91% val accuracy. Deployed, got 54% in production. The val set was from the same week as train. Real distribution shift = new user cohort = every leaf was wrong."',
    diagnosticSignal: 'Tree depth > 15, any leaf with < 5 samples, feature importances showing single feature at 0.95+.',
    fix: 'max_depth=5–8, min_samples_leaf=20. Run val on a time-held-out split, not random split. Never deploy a tree with depth > 20.',
    productionNote: 'Decision trees are best used as components in ensembles, not standalone. If you\'re using a single tree in production in 2025, you need a very good reason.',
    codeHint: 'DecisionTreeClassifier(max_depth=6, min_samples_leaf=20)',
  },
  {
    id: 'random-forest',
    name: 'Random Forest',
    difficulty: 'junior',
    isFree: true,
    silentFailure: 'Correlated features split importance across duplicates. You have 50 features, 30 are correlated. Importances look "spread out" and healthy. Remove any one feature and model degrades dramatically — you can\'t tell which features actually matter.',
    story: '"Feature importance told us customer_age was 3rd most important. We tried to collect it at signup. Didn\'t matter — turns out account_age_days (correlation 0.94) was doing the same work."',
    diagnosticSignal: 'Permutation importance ≠ impurity-based importance on val set. Run both. Also: inference time grows linearly with n_estimators — 500 trees × 5ms each = 2.5s per request.',
    fix: 'Use permutation importance over impurity importance. Drop correlated features before fitting. For latency-sensitive serving: use n_jobs=-1 + n_estimators=100 max, or convert to ONNX.',
    productionNote: 'n_estimators=1000 is almost never better than n_estimators=200 for accuracy but is 5x slower. Always profile inference time before deploying.',
    codeHint: 'RandomForestClassifier(n_estimators=100, n_jobs=-1)\n# then: permutation_importance(model, X_val, y_val)',
  },
  {
    id: 'xgboost',
    name: 'XGBoost / LightGBM',
    difficulty: 'mid',
    isFree: false,
    silentFailure: 'Over-tuning on val set. 50 rounds of Bayesian hyperparameter search → model learns the specific quirks of your val set. Kaggle-style optimization does not transfer to production distribution.',
    story: '"Spent 2 days tuning. Val AUC 0.94. Production AUC 0.81. The val set was 3 months old, production data was from last week with new feature distributions."',
    diagnosticSignal: 'Val AUC improved by >3% during tuning but test-on-time-holdout AUC didn\'t move. Learning curves show training AUC >> val AUC even after regularization.',
    fix: 'Time-based val splits. Limit hyperparameter search to 20 trials max. Prioritize: n_estimators + learning_rate + max_depth (in that order of impact). Use early stopping, not fixed rounds.',
    productionNote: 'XGBoost\'s scale_pos_weight for imbalanced data is critical and often forgotten. Default is 1. For 100:1 imbalance, set to 100.',
    codeHint: 'xgb.train(params, dtrain,\n  evals=[(dval,"val")],\n  early_stopping_rounds=20)',
  },
  {
    id: 'logistic-regression',
    name: 'Logistic Regression',
    difficulty: 'junior',
    isFree: true,
    silentFailure: 'Predicted probabilities are not calibrated. Model says 80% probability but actual rate in production is 45%. Business team sets threshold at 0.5, gets totally wrong decision boundaries.',
    story: '"Our fraud model had 0.87 AUC. Fraud ops set a threshold at 0.6. In production, 60% model confidence corresponded to 20% actual fraud rate. We were flagging way too much."',
    diagnosticSignal: 'Calibration plot (reliability diagram) shows predicted probs systematically above/below the diagonal. Brier score on val set.',
    fix: 'Add Platt scaling (CalibratedClassifierCV(cv=5, method=\'sigmoid\')). Or use isotonic regression for larger datasets. Always plot calibration curve before deploying any classifier as a scorer.',
    productionNote: 'Logistic regression assumes features are on similar scales — always StandardScaler. Multicollinearity inflates coefficient variance and makes them uninterpretable (but doesn\'t hurt predictive accuracy).',
    codeHint: 'from sklearn.calibration import CalibratedClassifierCV\ncal = CalibratedClassifierCV(lr, cv=5, method="sigmoid")',
  },
  {
    id: 'svm',
    name: 'SVM',
    difficulty: 'mid',
    isFree: false,
    silentFailure: 'Training time scales as O(n²) to O(n³). Works fine in dev on 10k samples. At 500k samples, training takes 18 hours. Nobody notices until the retraining job times out in production.',
    story: '"We built the model on a 10k sample for speed during prototyping. Went to retrain on full data in production. Job ran for 6 hours and was killed by the cluster timeout."',
    diagnosticSignal: 'Training time on 10k vs 50k vs 200k samples — plot the curve. If it\'s not linear, you have a problem.',
    fix: 'Use LinearSVC for large n (scales linearly). Use SGDClassifier with hinge loss for streaming. If you need kernel SVM on large data, use the Nyström approximation (sklearn.kernel_approximation.Nystroem).',
    productionNote: 'SVM has no native probability output. probability=True uses 5-fold cross-validation internally — adds significant training time. Use logistic regression if you need calibrated probabilities.',
    codeHint: 'from sklearn.svm import LinearSVC  # O(n) scaling\n# or: SGDClassifier(loss="hinge")  # streaming',
  },
  {
    id: 'knn',
    name: 'k-NN',
    difficulty: 'junior',
    isFree: true,
    silentFailure: 'Prediction latency scales with training set size. O(n) per query. Add 1M rows of training data and your previously-fast API becomes unusably slow.',
    story: '"k-NN worked great for our recommendation cold-start at 50k users. 6 months later, 500k users, API went from 12ms to 120ms. Had to emergency migrate to FAISS."',
    diagnosticSignal: 'Benchmark prediction time at 1k, 10k, 100k, 1M training samples. It should grow linearly.',
    fix: 'For any k-NN serving at scale, use Approximate Nearest Neighbor (ANN): FAISS (Facebook AI), ScaNN (Google), or Annoy (Spotify). Accept 1-5% recall loss for 100x speed gain.',
    productionNote: 'k-NN has no training phase — it IS the training data. This means model "updates" are just adding rows. But it also means there\'s no compression — you\'re storing every training point in memory.',
    codeHint: '# Production: switch to FAISS\nimport faiss\nindex = faiss.IndexFlatL2(d)\nindex.add(X_train)',
  },
  {
    id: 'naive-bayes',
    name: 'Naive Bayes',
    difficulty: 'junior',
    isFree: true,
    silentFailure: 'Feature independence assumption violated → probabilities collapse toward 0 or 1 on correlated features. Downstream calibration is impossible. "Zero probability" problem kills any sample with an unseen feature value.',
    story: '"Our spam classifier used Multinomial NB on TF-IDF. Any email containing a word not in the training vocabulary got probability 0.00 for both classes. np.argmax on [0, 0] returns 0 = \'not spam\' by default. Every novel spam got through."',
    diagnosticSignal: 'Check predicted probability histogram — if you see spikes at 0.0 and 1.0, independence assumption is being violated. Use add-1 (Laplace) smoothing: alpha=1.0.',
    fix: 'Always use alpha > 0 (Laplace smoothing). For text: BernoulliNB for binary features, MultinomialNB for counts, ComplementNB for imbalanced text classification. Consider calibrating probabilities post-training.',
    productionNote: 'Despite its flaws, Naive Bayes is often the right call for: very high-dimensional sparse features (text), very small datasets, when inference speed is paramount.',
    codeHint: 'MultinomialNB(alpha=1.0)  # never use alpha=0\n# ComplementNB for imbalanced classes',
  },
  {
    id: 'linear-regression',
    name: 'Linear Regression',
    difficulty: 'junior',
    isFree: true,
    silentFailure: 'Extrapolation outside training range gives nonsensical predictions with false confidence. Prediction intervals are not surfaced. Downstream systems treat extrapolated predictions as equally reliable.',
    story: '"House price model trained on $100k–$800k homes. A $2M listing came through. Model predicted $950k with no uncertainty signal. System auto-approved a mortgage based on a prediction that was outside the model\'s valid range by 150%."',
    diagnosticSignal: 'Monitor input feature distributions vs training distributions in production. Alert when inputs are >2 std devs from training mean. Check Cook\'s distance for influential training points.',
    fix: 'Add prediction intervals (not just point estimates). Use quantile regression for uncertainty bounds. Enforce input validation ranges derived from training data. For heteroscedastic data: use Huber loss or log-transform the target.',
    productionNote: 'Linear regression\'s MSE loss penalizes large errors quadratically — one massive outlier in training can dominate the entire fit. Always inspect residuals. For robust regression: HuberRegressor or RANSAC.',
    codeHint: '# Quantile regression for uncertainty bounds\nfrom sklearn.linear_model import QuantileRegressor\nq_lo = QuantileRegressor(quantile=0.1)\nq_hi = QuantileRegressor(quantile=0.9)',
  },
]

const ENSEMBLE_SCENARIOS = [
  {
    id: 1,
    situation: 'High-variance model that overfits on your 5k sample dataset.',
    detail: 'Decision tree with max_depth=None. Val accuracy keeps jumping ±8% across splits.',
    options: ['Bagging', 'Boosting', 'Stacking', 'Blending', 'Single model', 'Voting Classifier'],
    answer: 'Bagging',
    reasoning: "Bagging's parallel trees each see different bootstrap samples — reduces variance directly. Boosting would make overfitting worse by doubling down on hard examples. The problem is high variance, not high bias.",
    whyNot: 'Boosting increases model complexity and would amplify the variance issue. Stacking/blending needs more data to be reliable than 5k.',
  },
  {
    id: 2,
    situation: 'Model has high bias — RMSE 0.42 on both train and val, barely beats a mean predictor.',
    detail: 'Train and val error are nearly identical — the model is underfitting, not overfitting.',
    options: ['Bagging', 'Boosting', 'Stacking', 'Blending', 'Single model', 'Voting Classifier'],
    answer: 'Boosting',
    reasoning: 'Boosting sequentially fits residuals — it directly attacks bias. Each new model corrects where the previous one was wrong. Bagging averages parallel models and won\'t help when the underlying model is underfitting.',
    whyNot: 'Bagging reduces variance, not bias. If every tree underfits, averaging them still underfits.',
  },
  {
    id: 3,
    situation: 'You have 3 strong models from different algorithm families: XGBoost, LightGBM, Neural Net.',
    detail: 'Each performs similarly on val set. Errors appear uncorrelated — when XGBoost fails, the Neural Net often gets it right.',
    options: ['Bagging', 'Boosting', 'Stacking', 'Blending', 'Single model', 'Voting Classifier'],
    answer: 'Stacking',
    reasoning: 'Uncorrelated errors from diverse model families = high stacking value. A meta-learner learns when to trust each base model. Simple blending leaves signal on the table — the meta-learner can learn the conditional relationship.',
    whyNot: 'Blending is simpler but treats all models equally. The meta-learner in stacking can discover context-dependent model trust.',
  },
  {
    id: 4,
    situation: 'Kaggle competition. You have 12 models, deadline in 1 hour, no time to train a meta-learner.',
    detail: 'All 12 models have been tuned. You need to combine them fast.',
    options: ['Bagging', 'Boosting', 'Stacking', 'Blending', 'Single model', 'Voting Classifier'],
    answer: 'Blending',
    reasoning: 'Rank-average or mean of probabilities. Fast, surprisingly effective, no overfitting risk from a meta-learner. Rule of thumb: weight models by (val_AUC - 0.5)². Stacking would need a held-out set and time you don\'t have.',
    whyNot: 'Stacking requires training a meta-learner on out-of-fold predictions — no time for that. Single model throws away 11 models worth of work.',
  },
  {
    id: 5,
    situation: 'Binary classifier, dataset is small (2k samples), you want to maximize signal from limited data.',
    detail: 'You\'re tempted to build an ensemble but the dataset is tiny.',
    options: ['Bagging', 'Boosting', 'Stacking', 'Blending', 'Single model', 'Voting Classifier'],
    answer: 'Single model',
    reasoning: 'Ensembles add complexity and require more data to be reliable. A well-regularized single model + stratified k-fold will outperform a hastily assembled ensemble on 2k samples. With small N, ensemble overfitting risk outweighs the variance reduction benefit.',
    whyNot: 'Any ensemble on 2k samples risks overfitting the ensemble structure itself. Use your data budget for cross-validation, not stacking layers.',
  },
  {
    id: 6,
    situation: '3 specialist classifiers: high-precision tuned, high-recall tuned, balanced. Majority vote policy.',
    detail: 'Production requirement: flag fraud if the majority of models say fraud. You want a democratic decision policy.',
    options: ['Bagging', 'Boosting', 'Stacking', 'Blending', 'Single model', 'Voting Classifier'],
    answer: 'Voting Classifier',
    reasoning: 'Each model votes — majority wins. Perfect when you have specialists with complementary objectives and you want a democratic decision policy. Hard voting is ideal here: 2-of-3 models must agree to flag.',
    whyNot: 'Blending averages probabilities and can be dominated by the most confident model. Stacking would lose the intentional specialization of each model.',
  },
]

const HYPERPARAM_SCENARIOS = [
  {
    id: 1,
    model: 'XGBoost',
    problem: 'Validation AUC plateau at 0.82 after 100 trees.',
    detail: 'Learning curves flatten early. You haven\'t hit a wall on max_depth.',
    options: ['max_depth', 'learning_rate + more trees', 'subsample', 'colsample_bytree'],
    answer: 'learning_rate + more trees',
    reasoning: 'Plateau means insufficient model capacity or too-early stopping. Lower LR + more trees (with early stopping) almost always helps. Reducing learning_rate from 0.1 to 0.01 and setting n_estimators=1000 with early_stopping_rounds=20 is the highest-leverage move.',
    impact: 'HIGH',
    whyNotOthers: 'max_depth is secondary — tree structure isn\'t the bottleneck when you plateau at 100 trees. subsample and colsample_bytree are regularization knobs for overfitting, not underfitting.',
  },
  {
    id: 2,
    model: 'Random Forest',
    problem: 'Inference too slow — 800ms per request in production.',
    detail: 'Accuracy is fine. Pure latency problem.',
    options: ['n_estimators', 'max_depth', 'min_samples_leaf', 'max_features'],
    answer: 'n_estimators',
    reasoning: 'Halving n_estimators halves inference time linearly — it\'s a direct 1:1 relationship. If 500 trees → 800ms, try 100 trees → ~160ms. Check if accuracy degrades acceptably. max_depth has a smaller effect on inference.',
    impact: 'HIGH',
    whyNotOthers: 'max_depth affects tree complexity but not the count of trees being traversed. min_samples_leaf changes tree structure but doesn\'t reduce the number of trees. max_features affects training, not inference.',
  },
  {
    id: 3,
    model: 'Logistic Regression',
    problem: 'Large train/val gap (overfitting) on 1k samples.',
    detail: 'Train accuracy 94%, val accuracy 72%. Only 1,000 training samples.',
    options: ['C (regularization)', 'solver', 'max_iter', 'class_weight'],
    answer: 'C (regularization)',
    reasoning: 'C is the only knob that directly controls overfitting in LR. Decrease C (increase regularization). Default C=1 — try C=0.01 or C=0.1 first. solver and max_iter don\'t affect model capacity at all.',
    impact: 'HIGH',
    whyNotOthers: 'solver is about convergence algorithm — doesn\'t change what the model learns. max_iter controls whether optimization converges, not model complexity. class_weight is for imbalance, not overfitting.',
  },
  {
    id: 4,
    model: 'SVM (RBF kernel)',
    problem: 'Model is underfitting — decision boundary too smooth.',
    detail: 'Both train and val accuracy are mediocre. The model isn\'t fitting the training data.',
    options: ['C', 'gamma', 'kernel', 'degree'],
    answer: 'gamma',
    reasoning: 'Gamma controls how far each training example\'s influence reaches. Too-small gamma = model too smooth = underfitting. Increase gamma first (try gamma=\'scale\' → \'auto\' → explicit values), then increase C. gamma is the primary complexity lever for RBF.',
    impact: 'HIGH',
    whyNotOthers: 'C controls the margin penalty — relevant after gamma is set correctly. kernel change is drastic — exhaust RBF tuning first. degree only applies to polynomial kernel.',
  },
  {
    id: 5,
    model: 'Decision Tree',
    problem: 'Massive overfitting — train acc 99%, val acc 61%.',
    detail: 'Classic overfit profile. The tree has memorized the training set.',
    options: ['max_depth', 'min_samples_split', 'min_samples_leaf', 'criterion'],
    answer: 'max_depth',
    reasoning: 'Most direct lever for overfitting in trees. Set max_depth=5 and re-evaluate. This immediately constrains the tree\'s ability to create arbitrarily fine splits. min_samples_leaf is secondary — useful after you have a reasonable max_depth.',
    impact: 'HIGH',
    whyNotOthers: 'min_samples_split helps but is weaker than max_depth at controlling overfit. min_samples_leaf is secondary. criterion (gini vs entropy) almost never matters — 0.1% accuracy difference at most.',
  },
  {
    id: 6,
    model: 'Neural Net (MLP)',
    problem: 'Loss not converging after 50 epochs.',
    detail: 'Loss curve is jagged and oscillating. No clear downward trend.',
    options: ['learning_rate', 'hidden_layer_sizes', 'activation', 'batch_size'],
    answer: 'learning_rate',
    reasoning: 'Non-convergence is almost always an LR problem first. Jagged loss = LR too high. Try 10x lower LR before changing architecture. This is the single highest-impact knob for convergence. Layer sizes are secondary.',
    impact: 'HIGH',
    whyNotOthers: 'hidden_layer_sizes affects capacity but won\'t fix oscillation. activation function rarely causes non-convergence — ReLU is nearly always fine. batch_size affects noise in gradients but LR should be adjusted proportionally anyway.',
  },
  {
    id: 7,
    model: 'k-NN',
    problem: 'Predictions feel noisy and inconsistent across similar inputs.',
    detail: 'Small input changes cause big prediction swings.',
    options: ['n_neighbors (k)', 'weights', 'algorithm', 'leaf_size'],
    answer: 'n_neighbors (k)',
    reasoning: 'Small k = high variance = noise. Increase k (try k = sqrt(n_samples) as a starting rule). More neighbors = smoother decision boundary. weights=\'distance\' is the secondary improvement — closer neighbors get more say.',
    impact: 'HIGH',
    whyNotOthers: 'weights affects how neighbors are combined but doesn\'t reduce the noise from having too few neighbors. algorithm (ball_tree, kd_tree, brute) and leaf_size only affect speed — zero impact on predictions.',
  },
  {
    id: 8,
    model: 'GradientBoostingClassifier',
    problem: 'Training takes 4 hours on 100k samples.',
    detail: 'sklearn GradientBoostingClassifier. Pure speed problem.',
    options: ['n_estimators', 'learning_rate', 'subsample', 'max_features'],
    answer: 'subsample',
    reasoning: 'Setting subsample=0.8 activates stochastic GBM — reduces training time by ~20% while often improving generalisation. But the real fix: switch to LightGBM entirely. It\'s 10-20x faster than sklearn GBM on the same data via histogram-based splitting.',
    impact: 'MEDIUM (switch to LightGBM for HIGH)',
    whyNotOthers: 'n_estimators reduces trees but hurts accuracy proportionally. learning_rate alone doesn\'t affect speed. max_features helps but less than subsample for GBM.',
  },
]

// ─── AccordionMCQ ─────────────────────────────────────────────────────────────

function AccordionMCQ({ scenarios, accentColor = 'var(--prime)', contextLabel = 'Context', storageKey = null }) {
  const [items, setItems] = useState(() => {
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem('msl_score:' + storageKey))
        if (saved && saved.length === scenarios.length) return saved
      } catch {}
    }
    return scenarios.map(() => ({ open: false, picked: null, revealed: false }))
  })
  const [diffFilter, setDiffFilter] = useState('all')

  useState(() => {
    if (storageKey) {
      localStorage.setItem('msl_score:' + storageKey, JSON.stringify(items))
      window.dispatchEvent(new CustomEvent('msl_score_updated'))
    }
  })

  function getDiff(i, total) {
    const t = total / 3
    return i < t ? 'easy' : i < 2 * t ? 'medium' : 'hard'
  }

  const score = items.reduce((acc, item, i) => ({
    attempted: acc.attempted + (item.revealed ? 1 : 0),
    correct:   acc.correct   + (item.revealed && item.picked === scenarios[i].answer ? 1 : 0),
  }), { attempted: 0, correct: 0 })

  function toggle(i) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, open: !it.open } : it))
  }

  function pick(i, optIdx) {
    if (items[i].revealed) return
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, picked: optIdx, revealed: true, open: true } : it))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Difficulty filter */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        {['all','easy','medium','hard'].map(d => (
          <button key={d} onClick={() => setDiffFilter(d)} style={{
            fontSize: '10px', padding: '3px 10px', borderRadius: '999px',
            background: diffFilter === d ? accentColor + '15' : 'transparent',
            border: `1px solid ${diffFilter === d ? accentColor : 'var(--rim)'}`,
            color: diffFilter === d ? accentColor : 'var(--ink-ghost)', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            {d === 'all' ? 'All' : d === 'easy' ? 'Easy' : d === 'medium' ? 'Med' : 'Hard'}
          </button>
        ))}
        <span style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', marginLeft: '4px' }}>
          {diffFilter === 'all' ? scenarios.length : scenarios.filter((_,i) => getDiff(i, scenarios.length) === diffFilter).length} scenarios
        </span>
      </div>
      {score.attempted > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: '8px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>Score:</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--prime)' }}>
            {score.correct}/{score.attempted}
          </span>
          <div style={{ flex: 1, height: '4px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${(score.correct / Math.max(scenarios.length, 1)) * 100}%`, background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)' }}>{scenarios.length - score.attempted} left</span>
        </div>
      )}

      {scenarios.map((sc, i) => {
        if (diffFilter !== 'all' && getDiff(i, scenarios.length) !== diffFilter) return null
        const it = items[i]
        const isCorrect = it.revealed && it.picked === sc.answer
        const isWrong   = it.revealed && it.picked !== sc.answer
        let borderColor = it.open ? accentColor : 'var(--rim)'
        if (isCorrect) borderColor = 'rgba(52,211,153,0.5)'
        if (isWrong)   borderColor = 'rgba(244,63,94,0.5)'

        return (
          <div key={sc.id} style={{ border: `1px solid ${borderColor}`, borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s', background: 'rgba(255,255,255,0.015)' }}>
            <button onClick={() => toggle(i)} style={{ width: '100%', padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '16px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-hi)', lineHeight: 1.4 }}>{sc.title}</span>
              {isCorrect && <span style={{ color: 'var(--mint)', fontSize: '13px', flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
              {isWrong   && <span style={{ color: 'var(--rose)', fontSize: '13px', flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
              <span style={{ color: 'var(--ink-ghost)', fontSize: '11px', flexShrink: 0 }}>{it.open ? '▲' : '▼'}</span>
            </button>

            {it.open && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '10px', color: accentColor, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', fontWeight: 600 }}>{contextLabel}</div>
                  <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.context}</p>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, fontStyle: 'italic' }}>{sc.question}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} onKeyDown={(e) => { if (['1','2','3','4'].includes(e.key) && !it.revealed) { e.preventDefault(); pick(i, parseInt(e.key)-1) } else if (e.key === 'Enter' && !it.revealed && it.picked !== null) { e.preventDefault(); reveal(i) } }} tabIndex={0}>
                  {sc.options.map((opt, oi) => {
                    const isAns    = oi === sc.answer
                    const isPicked = oi === it.picked
                    return (
                      <button key={oi} disabled={it.revealed} onClick={() => pick(i, oi)}
                        className={`msl-option-btn${it.revealed && isAns ? ' correct' : ''}${it.revealed && isPicked && !isAns ? ' wrong' : ''}${!it.revealed && isPicked ? ' selected' : ''}`}
                        style={{ textAlign: 'left', padding: 'var(--card-pad-primary)', borderRadius: '8px', cursor: it.revealed ? 'default' : 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start', width: '100%' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.6, minWidth: '14px', flexShrink: 0, marginTop: '2px' }}>{String.fromCharCode(65 + oi)}</span>
                        <span style={{ fontSize: '13px', fontFamily: 'var(--font-sans)', fontWeight: 500, lineHeight: 1.55 }}>
                          {it.revealed && isAns && <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
                          {it.revealed && isPicked && !isAns && <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
                          {opt}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {it.revealed && (
                  <div style={{ padding: '14px 16px', background: isCorrect ? 'rgba(52,211,153,0.11)' : 'rgba(244,63,94,0.11)', border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(244,63,94,0.2)'}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700, color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>
                      {isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg> Correct' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Wrong'} — {sc.diagnosis}
                    </div>
                    {sc.fix && (
                      <div style={{ padding: '10px 12px', background: 'rgba(240,165,0,0.13)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px', fontWeight: 600 }}>Production Fix</div>
                        <p style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.fix}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── ForwardPointer ───────────────────────────────────────────────────────────

function ForwardPointer({ label, tab, onNavigate, accent = 'var(--ink-low)' }) {
  return (
    <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
      <button
        onClick={() => onNavigate(tab)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '12px', color: accent, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '12px', color: accent }}>→</span>
      </button>
    </div>
  )
}

// ─── Naive Bayes Failure Modes ────────────────────────────────────────────────

const NAIVE_BAYES_SCENARIOS = [
  {
    id: 'nb1',
    title: 'Text classification with correlated features',
    difficulty: 'mid',
    isFree: false,
    context: 'You are building a spam classifier using Multinomial Naive Bayes on bag-of-words features. Training accuracy is 97%. In production, performance drops to 71%. Investigation shows that spam emails consistently contain both "free" and "money" together, while your model treats them as independent features.',
    question: 'Why does Naive Bayes fail here, and what is the correct fix?',
    options: [
      'Naive Bayes requires more training data — 97% training accuracy means the model is underfitted.',
      'The conditional independence assumption is violated: P("money" | spam) and P("free" | spam) are not independent — they co-occur systematically. Naive Bayes multiplies these probabilities as if they are independent, amplifying the spam signal far beyond its true strength and making the model overconfident on correlated features.',
      'Bag-of-words features should be replaced with TF-IDF before using Naive Bayes.',
      'Naive Bayes cannot handle binary classification — use logistic regression instead.',
    ],
    answer: 1,
    diagnosis: 'The independence assumption is the core limitation of Naive Bayes. When features co-occur systematically (as in spam: "free" + "money" + "click"), the model multiplies their conditional probabilities, treating them as independent evidence. This causes probability estimates to become extremely overconfident — Naive Bayes will assign probabilities near 1.0 to spam when correlated features appear, making it poorly calibrated even when directionally correct.',
    fix: 'Three options: (1) Accept the limitation and use Naive Bayes for its speed/simplicity, monitoring calibration separately. (2) Add feature selection to remove highly correlated features, reducing redundant evidence. (3) Switch to a model that handles feature dependencies: logistic regression, random forest, or gradient boosting — all of which model feature interactions without assuming independence.',
  },
  {
    id: 'nb2',
    title: 'Gaussian Naive Bayes on skewed numeric features',
    difficulty: 'mid',
    isFree: false,
    context: 'A fraud detection model uses Gaussian Naive Bayes on transaction amount, time since last transaction, and account age. Training AUC is 0.82. In production, high-value transactions (>$10,000) are almost never flagged as fraud, even when other signals are strong. Investigation reveals transaction amounts follow a heavy-tailed Pareto distribution.',
    question: 'What is the core failure mode?',
    options: [
      'Gaussian Naive Bayes requires feature standardisation (z-score normalisation) before training.',
      'The model needs more fraud examples for high-value transactions (class imbalance).',
      'Gaussian Naive Bayes assumes each feature follows a Gaussian (normal) distribution. Transaction amounts follow a heavy-tailed Pareto distribution — the Gaussian assumption severely underestimates the probability of high-value amounts under the fraud class, making the model systematically ignore high-value transactions.',
      'Naive Bayes cannot handle financial data — use a neural network instead.',
    ],
    answer: 2,
    diagnosis: 'The Gaussian NB likelihood P(amount | fraud) is computed assuming the feature is normally distributed. For a Pareto-distributed feature, the Gaussian fit places nearly zero probability mass on values in the tail (>$10,000). This means even if $10,000 transactions are disproportionately fraudulent, the model assigns near-zero P(amount=$10,000 | fraud), dominating the posterior and suppressing the fraud prediction.',
    fix: 'Replace Gaussian assumption with a distribution that fits the data: log-transform the transaction amount (making it approximately log-normal) before training, or use a kernel density estimator (KDE NB) which makes no parametric assumption about the feature distribution. Alternatively, bucket the amount feature into quantile bins and use Categorical/Multinomial NB, which makes no distributional assumption.',
  },
  {
    id: 'nb3',
    title: 'Zero-frequency problem in production',
    difficulty: 'junior',
    isFree: true,
    context: 'A product category classifier uses Multinomial Naive Bayes trained on 50,000 product descriptions. In production, it fails with a probability of 0.0 for any product containing a word not seen during training — even if every other word strongly indicates the category.',
    question: 'What causes this and what is the standard fix?',
    options: [
      'The training vocabulary needs to be expanded — the model did not see enough training examples.',
      'The zero-frequency problem: if a word never appeared in training, P(word | class) = 0. Since Naive Bayes multiplies all feature probabilities, a single zero collapses the entire posterior to 0.0, regardless of how strong the other signals are. One unseen word destroys the prediction.',
      'Out-of-vocabulary words should be removed from the input before prediction.',
      'The model needs to be retrained with TF-IDF instead of raw counts.',
    ],
    answer: 1,
    diagnosis: 'Multinomial Naive Bayes computes the product of P(word_i | class) for all words in the document. If any word has P(word_i | class) = 0 (because it never appeared in training), the entire product evaluates to 0.0 regardless of how many other words strongly indicate the class. This is a fundamental failure mode for any real deployment where the input vocabulary will differ from training.',
    fix: 'Apply Laplace smoothing (add-1 smoothing): add 1 to every word count in training, including words that never appeared. This gives every possible word a small non-zero probability. In sklearn: `MultinomialNB(alpha=1.0)` (default). For stronger smoothing on rare words, tune alpha: higher alpha = more smoothing = more conservative probability estimates. Also implement an OOV (out-of-vocabulary) token for unknown words.',
  },
]

function NaiveBayesFailures() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Classical ML</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Naive Bayes Failure Modes</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          Three failure modes that look fine in training and break in production. The independence assumption, the Gaussian assumption, and the zero-frequency problem.
        </p>
      </div>
      <AccordionMCQ scenarios={NAIVE_BAYES_SCENARIOS} accentColor="var(--prime)" storageKey="classical_naive_bayes" />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModelFailureZoo() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)

  const model = MODELS.find(m => m.id === selectedModel)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>
          Each model has production failure modes that don't show up in your val metrics. Select a model to see exactly how it breaks — silently — in production.
        </p>
      </div>

      {/* Model pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {MODELS.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: selectedModel === m.id ? '1px solid var(--prime)' : '1px solid var(--rim)',
              background: selectedModel === m.id ? 'var(--prime-bg-light)' : 'var(--surface)',
              color: selectedModel === m.id ? 'var(--prime)' : 'var(--ink-mid)',
              fontSize: '13px',
              fontWeight: selectedModel === m.id ? 600 : 400,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Failure card */}
      {model && (
        <div className="card animate-slide-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: 'var(--prime)', fontFamily: 'var(--font-mono)',
            }}>
              ML
            </div>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 800, color: 'var(--prime)' }}>
                {model.name}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                PRODUCTION FAILURE MODES
              </span>
            </div>
          </div>

          {/* Silent failure */}
          <div style={{ borderLeft: '3px solid var(--prime)', paddingLeft: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', marginBottom: '6px', letterSpacing: '0.05em' }}>
              SILENT FAILURE
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
              {model.silentFailure}
            </p>
          </div>

          {/* Story */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--rim)',
            borderRadius: '8px',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', marginBottom: '8px', letterSpacing: '0.05em' }}>
              PRODUCTION INCIDENT
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, fontStyle: 'italic' }}>
              {model.story}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Diagnostic signal */}
            <div style={{ borderLeft: '3px solid var(--prime)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                DIAGNOSTIC SIGNAL
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                {model.diagnosticSignal}
              </p>
            </div>

            {/* Fix */}
            <div style={{ borderLeft: '3px solid var(--prime)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                FIX
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                {model.fix}
              </p>
            </div>
          </div>

          {/* Code hint */}
          <pre style={{
            margin: 0,
            padding: '12px 14px',
            background: 'var(--void)',
            border: '1px solid var(--rim)',
            borderRadius: '6px',
            fontSize: '12px',
            color: 'var(--ink-hi)',
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            lineHeight: 1.6,
          }}>
            {model.codeHint}
          </pre>

          {/* Production note */}
          <div style={{
            background: 'rgba(240,165,0,0.08)',
            border: '1px solid rgba(240,165,0,0.18)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            gap: '10px',
          }}>
            <span style={{ fontSize: '14px', flexShrink: 0, color: 'var(--prime)' }}>→</span>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--prime)', fontWeight: 600 }}>Production note: </strong>
              {model.productionNote}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function EnsembleDecisionLab() {
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})

  const pick = (scenarioId, option) => {
    setAnswers(prev => ({ ...prev, [scenarioId]: option }))
  }

  const reveal = (scenarioId) => {
    setRevealed(prev => ({ ...prev, [scenarioId]: true }))
  }

  const correct = Object.keys(revealed).filter(id => {
    const s = ENSEMBLE_SCENARIOS.find(s => s.id === parseInt(id))
    return answers[id] === s.answer
  }).length

  const attempted = Object.keys(revealed).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0, maxWidth: '560px' }}>
          6 production scenarios. Pick the right ensemble strategy, then reveal the reasoning. There's always one best answer — and a clear reason why the others fall short.
        </p>
        {attempted > 0 && (
          <div style={{
            padding: '8px 16px',
            borderRadius: '20px',
            background: 'rgba(240,165,0,0.1)',
            border: '1px solid rgba(240,165,0,0.2)',
            fontSize: '13px',
            color: 'var(--prime)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>
            {correct}/{attempted} correct
          </div>
        )}
      </div>

      {ENSEMBLE_SCENARIOS.map(scenario => {
        const userAnswer = answers[scenario.id]
        const isRevealed = revealed[scenario.id]
        const isCorrect = userAnswer === scenario.answer

        return (
          <div key={scenario.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Scenario header */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: isRevealed ? (isCorrect ? 'rgba(52,211,153,0.15)' : 'rgba(244,114,182,0.15)') : 'var(--surface)',
                border: `1px solid ${isRevealed ? (isCorrect ? 'var(--mint)' : 'var(--rose)') : 'var(--rim)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700,
                color: isRevealed ? (isCorrect ? 'var(--mint)' : 'var(--rose)') : 'var(--ink-low)',
                fontFamily: 'var(--font-mono)',
                flexShrink: 0, marginTop: '2px',
              }}>
                {isRevealed ? (isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>') : scenario.id}
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>
                  {scenario.situation}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.5 }}>
                  {scenario.detail}
                </p>
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {scenario.options.map(opt => {
                const isSelected = userAnswer === opt
                const isCorrectOpt = opt === scenario.answer

                let borderColor = 'var(--rim)'
                let bgColor = 'var(--surface)'
                let textColor = 'var(--ink-mid)'

                if (isRevealed) {
                  if (isCorrectOpt) { borderColor = 'var(--mint)'; bgColor = 'rgba(52,211,153,0.1)'; textColor = 'var(--mint)' }
                  else if (isSelected && !isCorrectOpt) { borderColor = 'var(--rose)'; bgColor = 'rgba(244,114,182,0.15)'; textColor = 'var(--rose)' }
                } else if (isSelected) {
                  borderColor = 'var(--prime)'; bgColor = 'rgba(240,165,0,0.1)'; textColor = 'var(--prime)'
                }

                return (
                  <button
                    key={opt}
                    onClick={() => !isRevealed && pick(scenario.id, opt)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: `1px solid ${borderColor}`,
                      background: bgColor,
                      color: textColor,
                      fontSize: '12px',
                      fontWeight: isSelected || (isRevealed && isCorrectOpt) ? 600 : 400,
                      fontFamily: 'var(--font-sans)',
                      cursor: isRevealed ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            {/* Reveal button */}
            {!isRevealed && (
              <button
                onClick={() => reveal(scenario.id)}
                className="btn-secondary"
                style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 14px' }}
              >
                Reveal answer
              </button>
            )}

            {/* Reasoning */}
            {isRevealed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--rim)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--mint)', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                      ANSWER: {scenario.answer.toUpperCase()}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                      {scenario.reasoning}
                    </p>
                  </div>
                </div>
                <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '6px', padding: '10px 12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Why not the others: </span>
                  <span style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6 }}>{scenario.whyNot}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HyperparamPriority() {
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState({})

  const pick = (id, opt) => setAnswers(prev => ({ ...prev, [id]: opt }))
  const reveal = (id) => setRevealed(prev => ({ ...prev, [id]: true }))

  const correct = Object.keys(revealed).filter(id => {
    const s = HYPERPARAM_SCENARIOS.find(s => s.id === parseInt(id))
    return answers[id] === s.answer
  }).length

  const attempted = Object.keys(revealed).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0, maxWidth: '560px' }}>
          8 scenarios. You have 1 hour to tune. Which hyperparameter do you touch FIRST? Wrong answer = you burned your time on something that barely moves the needle.
        </p>
        {attempted > 0 && (
          <div style={{
            padding: '8px 16px',
            borderRadius: '20px',
            background: 'rgba(240,165,0,0.1)',
            border: '1px solid rgba(240,165,0,0.2)',
            fontSize: '13px',
            color: 'var(--prime)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>
            {correct}/{attempted} correct
          </div>
        )}
      </div>

      {HYPERPARAM_SCENARIOS.map(scenario => {
        const userAnswer = answers[scenario.id]
        const isRevealed = revealed[scenario.id]
        const isCorrect = userAnswer === scenario.answer

        return (
          <div key={scenario.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: isRevealed ? (isCorrect ? 'rgba(52,211,153,0.15)' : 'rgba(244,114,182,0.15)') : 'var(--surface)',
                border: `1px solid ${isRevealed ? (isCorrect ? 'var(--mint)' : 'var(--rose)') : 'var(--rim)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700,
                color: isRevealed ? (isCorrect ? 'var(--mint)' : 'var(--rose)') : 'var(--ink-low)',
                fontFamily: 'var(--font-mono)',
                flexShrink: 0, marginTop: '2px',
              }}>
                {isRevealed ? (isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>') : scenario.id}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '10px',
                    background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)',
                    fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)',
                  }}>
                    {scenario.model}
                  </span>
                </div>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px', color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>
                  {scenario.problem}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.5 }}>
                  {scenario.detail}
                </p>
              </div>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {scenario.options.map(opt => {
                const isSelected = userAnswer === opt
                const isCorrectOpt = opt === scenario.answer

                let borderColor = 'var(--rim)'
                let bgColor = 'var(--surface)'
                let textColor = 'var(--ink-mid)'

                if (isRevealed) {
                  if (isCorrectOpt) { borderColor = 'var(--mint)'; bgColor = 'rgba(52,211,153,0.1)'; textColor = 'var(--mint)' }
                  else if (isSelected && !isCorrectOpt) { borderColor = 'var(--rose)'; bgColor = 'rgba(244,114,182,0.15)'; textColor = 'var(--rose)' }
                } else if (isSelected) {
                  borderColor = 'var(--prime)'; bgColor = 'rgba(240,165,0,0.1)'; textColor = 'var(--prime)'
                }

                return (
                  <button
                    key={opt}
                    onClick={() => !isRevealed && pick(scenario.id, opt)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '16px',
                      border: `1px solid ${borderColor}`,
                      background: bgColor,
                      color: textColor,
                      fontSize: '12px',
                      fontWeight: isSelected || (isRevealed && isCorrectOpt) ? 600 : 400,
                      fontFamily: 'var(--font-sans)',
                      cursor: isRevealed ? 'default' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            {/* Reveal */}
            {!isRevealed && (
              <button
                onClick={() => reveal(scenario.id)}
                className="btn-secondary"
                style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '6px 14px' }}
              >
                Reveal answer
              </button>
            )}

            {/* Explanation */}
            {isRevealed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--rim)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--mint)', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                        TUNE FIRST: {scenario.answer.toUpperCase()}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '8px',
                        background: 'rgba(240,165,0,0.1)',
                        border: '1px solid rgba(240,165,0,0.2)',
                        fontSize: '10px',
                        color: 'var(--prime)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        IMPACT: {scenario.impact}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                      {scenario.reasoning}
                    </p>
                  </div>
                </div>
                <div style={{ background: 'var(--void)', border: '1px solid var(--rim)', borderRadius: '6px', padding: '10px 12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Why not others: </span>
                  <span style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6 }}>{scenario.whyNotOthers}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Decision Boundary Lab ────────────────────────────────────────────────────

const CLASS_0 = [
  [1.2, 1.8], [1.5, 2.1], [0.9, 1.5], [1.8, 1.3], [1.1, 2.4], [2.0, 1.9], [0.8, 2.0], [1.6, 1.1],
  [1.3, 2.7], [2.2, 2.0], [0.6, 1.7], [1.9, 2.5], [1.4, 1.0], [0.7, 2.3], [2.1, 1.5],
  [4.5, 4.8], [4.8, 5.2], [5.1, 4.6], [4.3, 5.0], [5.3, 4.9], [4.7, 5.5], [5.0, 5.1],
]
const CLASS_1 = [
  [1.0, 4.5], [1.3, 4.8], [0.8, 5.1], [1.6, 4.3], [1.1, 5.4], [1.8, 4.7], [0.6, 4.2], [2.0, 5.0],
  [1.4, 5.6], [0.9, 4.9], [1.7, 5.2], [0.5, 5.3], [2.1, 4.4],
  [4.5, 1.5], [4.8, 1.2], [5.1, 1.8], [4.3, 1.0], [5.3, 1.4], [4.7, 0.8], [5.0, 1.9], [4.2, 1.6],
  [5.4, 1.1], [4.9, 2.0], [5.2, 0.7], [4.6, 2.2],
]

const CLASSIFIERS = [
  {
    id: 'linear_svm',
    label: 'Linear SVM',
    accuracy: '~52%',
    description: 'Linear boundary fails on XOR-structured data. Accuracy ~52% — barely above random. In production: if your classes aren\'t linearly separable (common in any real feature space), a linear kernel is leaving performance on the table.',
    // boundary fn: class 1 if col > row + 2  (in grid coords 0-19)
    boundary: (row, col) => col > row + 2 ? 1 : 0,
  },
  {
    id: 'rbf_svm',
    label: 'RBF SVM',
    accuracy: '~95%',
    description: 'Radial Basis Function kernel captures nonlinear structure. Accuracy ~95%. The kernel trick maps data to infinite-dimensional space where it becomes linearly separable. Correct for this structure.',
    // XOR pattern: bottom-left and top-right = class 0; top-left and bottom-right = class 1
    boundary: (row, col) => ((row < 10 && col < 10) || (row > 10 && col > 10)) ? 0 : 1,
  },
  {
    id: 'dt_depth1',
    label: 'Decision Tree (depth=1)',
    accuracy: '~50%',
    description: 'A single split (stump) can only divide the space with one axis-aligned line. Accuracy ~50%. Useful as a weak learner in boosting, but never alone.',
    // horizontal split at row 10 — top half class 1, bottom half class 0
    boundary: (row, _col) => row < 10 ? 1 : 0,
  },
  {
    id: 'dt_depth5',
    label: 'Decision Tree (depth=5)',
    accuracy: '~72% train / ~58% test',
    description: 'Deep tree memorizes training data. Accuracy ~72% (train) but likely 55–60% on held-out data. The jagged boundary is the visual signature of overfitting — the model learned noise, not structure.',
    // Checkerboard-ish pattern — many small regions (simulates overfitting)
    boundary: (row, col) => {
      const block = Math.floor(row / 3) + Math.floor(col / 3)
      // Also include the XOR macro-structure to partially get it right
      const xor = ((row < 10 && col < 10) || (row > 10 && col > 10)) ? 0 : 1
      return (block % 2 === 0) ? xor : (1 - xor)
    },
  },
  {
    id: 'random_forest',
    label: 'Random Forest',
    accuracy: '~88%',
    description: 'Random Forest averages many trees, smoothing the jagged boundary and reducing variance. Accuracy ~88%. The boundary is nonlinear but more stable than any single deep tree. This is why ensemble methods dominate tabular ML.',
    // Similar to RBF but slightly smoother — allow a small buffer zone
    boundary: (row, col) => {
      const xor = ((row < 10 && col < 10) || (row > 10 && col > 10)) ? 0 : 1
      // Smooth edges: at boundary cells, add slight transition
      const nearEdge = Math.abs(row - 10) <= 1 || Math.abs(col - 10) <= 1
      if (nearEdge) return (row + col) % 2 === 0 ? xor : (1 - xor)
      return xor
    },
  },
]

// Grid cell component (needed to avoid hooks in .map)
function GridCell({ row, col, classValue }) {
  const bg = classValue === 0 ? 'var(--sky)' : 'var(--ember)'
  const opacity = 0.15
  // Map grid coords (0-19) → SVG space (0-6)
  const x = (col / 20) * 6
  const y = (19 - row) / 20 * 6
  const size = 6 / 20
  return <rect x={x} y={y} width={size} height={size} fill={bg} fillOpacity={opacity} />
}

function DecisionBoundaryLab() {
  const [activeClassifier, setActiveClassifier] = useState('linear_svm')
  const [viewed, setViewed] = useState(new Set(['linear_svm']))

  const clf = CLASSIFIERS.find(c => c.id === activeClassifier)

  function handleSelect(id) {
    setActiveClassifier(id)
    setViewed(prev => {
      const next = new Set(prev)
      next.add(id)
      if (next.size === CLASSIFIERS.length) {
        localStorage.setItem('msl_score:classical_boundary', JSON.stringify({ completed: true, ts: Date.now() }))
        window.dispatchEvent(new CustomEvent('msl_score_updated'))
      }
      return next
    })
  }

  useEffect(() => {
    setViewed(prev => { const n = new Set(prev); n.add('linear_svm'); return n })
  }, [])

  // Build grid once per classifier
  const gridCells = []
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 20; col++) {
      gridCells.push({ row, col, classValue: clf.boundary(row, col) })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Interactive Visualization</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Decision Boundary Lab</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          Same 2D dataset, 5 classifiers. The XOR-like structure separates the classifiers that get it from those that don't. Watch how boundaries change — and what that means for production.
        </p>
      </div>

      {/* Classifier selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {CLASSIFIERS.map(c => (
          <button key={c.id} onClick={() => handleSelect(c.id)} style={{
            padding: '7px 14px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: activeClassifier === c.id ? 600 : 400,
            border: `1px solid ${activeClassifier === c.id ? 'var(--prime)' : 'var(--rim)'}`,
            background: activeClassifier === c.id ? 'rgba(6,214,160,0.12)' : 'var(--surface)',
            color: activeClassifier === c.id ? 'var(--prime)' : 'var(--ink-mid)',
            transition: 'all 0.15s',
          }}>
            {c.label}
            {viewed.has(c.id) && c.id !== activeClassifier && <span style={{ marginLeft: '6px', fontSize: '9px', color: 'var(--ink-ghost)' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
          </button>
        ))}
        <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', alignSelf: 'center', marginLeft: '4px' }}>
          {viewed.size}/{CLASSIFIERS.length} explored
        </span>
      </div>

      {/* SVG Canvas */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
          <svg viewBox="0 0 6 6" width="100%" style={{ maxWidth: '500px', display: 'block', border: '1px solid var(--rim)', borderRadius: '8px', background: 'var(--void)' }}>
            {/* Background regions */}
            {gridCells.map(({ row, col, classValue }) => (
              <GridCell key={`${row}-${col}`} row={row} col={col} classValue={classValue} />
            ))}

            {/* Grid lines (subtle) */}
            {[1,2,3,4,5].map(v => (
              <g key={v}>
                <line x1={v} y1={0} x2={v} y2={6} stroke="var(--rim)" strokeWidth="0.02" strokeOpacity="0.4" />
                <line x1={0} y1={v} x2={6} y2={v} stroke="var(--rim)" strokeWidth="0.02" strokeOpacity="0.4" />
              </g>
            ))}

            {/* Class 1 points (ember/red) */}
            {CLASS_1.map(([x, y], i) => (
              <circle key={i} cx={x} cy={6 - y} r="0.12" fill="var(--ember)" fillOpacity="0.9" stroke="var(--void)" strokeWidth="0.03" />
            ))}

            {/* Class 0 points (sky/blue) */}
            {CLASS_0.map(([x, y], i) => (
              <circle key={i} cx={x} cy={6 - y} r="0.12" fill="var(--sky)" fillOpacity="0.9" stroke="var(--void)" strokeWidth="0.03" />
            ))}
          </svg>
        </div>

        {/* Axis labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '500px' }}>
          <span style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>Feature 2 (vertical)</span>
          <span style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>Feature 1 (horizontal)</span>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--sky)', display: 'inline-block' }} />
            Class 0 region
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--ember)', display: 'inline-block' }} />
            Class 1 region
          </span>
        </div>
      </div>

      {/* Classifier info card */}
      <div style={{ background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: 'var(--ink-hi)' }}>{clf.label}</span>
          <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600,
            background: clf.accuracy.startsWith('~9') || clf.accuracy.startsWith('~8') ? 'rgba(52,211,153,0.13)' : 'rgba(249,115,22,0.13)',
            color: clf.accuracy.startsWith('~9') || clf.accuracy.startsWith('~8') ? 'var(--mint)' : 'var(--ember)',
            border: `1px solid ${clf.accuracy.startsWith('~9') || clf.accuracy.startsWith('~8') ? 'rgba(52,211,153,0.25)' : 'rgba(249,115,22,0.25)'}` }}>
            Accuracy {clf.accuracy}
          </span>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{clf.description}</p>
      </div>

      {/* Completion note */}
      {viewed.size === CLASSIFIERS.length && (
        <div style={{ padding: '12px 16px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', fontSize: '13px', color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>
          All 5 classifiers explored — progress saved.
        </div>
      )}
    </div>
  )
}

// ─── Bias-Variance Visualizer ─────────────────────────────────────────────────

// Pre-computed curve data (static arrays, no Pyodide)
// X axis: complexity 0–100 (41 points, step 2.5)
// Training error: starts 0.75, falls steeply, levels near 0.05
// Validation error: starts 0.80, dips to 0.18 at ~complexity 45, rises to 0.72
const BV_POINTS = (() => {
  const pts = []
  for (let i = 0; i <= 40; i++) {
    const t = i / 40   // 0..1 maps to complexity 0..100
    const cx = t * 100
    // Training error: fast initial drop, asymptote near 0.05
    const trainErr = 0.05 + 0.70 * Math.exp(-4.5 * t)
    // Validation error: U-shape, min near t=0.45
    // Use a simple quadratic-ish blend
    const dist = t - 0.45
    const valErr = 0.18 + 0.62 * dist * dist * 4.5 + 0.02 * Math.exp(-8 * t)
    pts.push({ cx, trainErr: Math.min(0.80, Math.max(0.03, trainErr)), valErr: Math.min(0.80, Math.max(0.14, valErr)) })
  }
  return pts
})()

// Noise floor: constant line at 0.15
const NOISE_FLOOR = 0.15
// Sweet-spot complexity: ~45
const SWEET_SPOT_CX = 45

// Map complexity (0-100) → pixel X in viewBox (0-500)
function cxToSvgX(cx) { return 52 + (cx / 100) * 410 }
// Map error (0–1) → pixel Y in viewBox (0-280); error=0 → top, error=1 → bottom
function errToSvgY(err) { return 260 - err * 210 }

// Interpolate a curve value at a given complexity (0-100)
function interpCurve(cx, key) {
  const idx = (cx / 100) * 40
  const lo = Math.min(39, Math.floor(idx))
  const hi = lo + 1
  const frac = idx - lo
  return BV_POINTS[lo][key] * (1 - frac) + BV_POINTS[hi][key] * frac
}

function BiasVarianceVisualizer() {
  const [complexity, setComplexity] = useState(45)

  const trainErr = interpCurve(complexity, 'trainErr')
  const valErr   = interpCurve(complexity, 'valErr')

  // Regime detection
  let regime
  if (complexity <= 30)      regime = 'bias'
  else if (complexity <= 65) regime = 'sweet'
  else                       regime = 'variance'

  const regimeMeta = {
    bias: {
      label: 'High Bias (Underfitting)',
      borderColor: 'var(--rose)',
      badgeColor: 'rgba(244,63,94,0.12)',
      trainLabel: 'High',
      valLabel: 'High',
      production: 'A model in high-bias territory will fail silently on both training and serving data — RMSE looks bad everywhere but the team blames data quality rather than model capacity. Adding more training data will not help. The fix is always more model capacity: deeper trees, more features, polynomial transforms, or switching algorithm families.',
    },
    sweet: {
      label: 'Good Fit (Sweet Spot)',
      borderColor: 'var(--mint)',
      badgeColor: 'rgba(52,211,153,0.10)',
      trainLabel: 'Low',
      valLabel: 'Near minimum',
      production: 'This is the deployable region. Generalisation gap (val error − train error) is small. The model captures real signal without memorising noise. In production monitoring, watch for val error creeping up over time — that\'s distribution shift, not overfitting. Re-tune periodically rather than letting the model age past this window.',
    },
    variance: {
      label: 'High Variance (Overfitting)',
      borderColor: 'var(--ember)',
      badgeColor: 'rgba(249,115,22,0.12)',
      trainLabel: 'Very low',
      valLabel: 'Rising fast',
      production: 'A high-variance model looks excellent in training and CI pipelines, then silently degrades on production traffic as the distribution shifts even slightly. Classic tell: train accuracy 98%, production accuracy 73%. The model memorised the training set. Fix: add regularisation (L2, dropout, max_depth), reduce features, gather more diverse training data, or use an ensemble.',
    },
  }

  const meta = regimeMeta[regime]

  // Build SVG path strings from BV_POINTS
  const trainPath = BV_POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${cxToSvgX(p.cx).toFixed(1)},${errToSvgY(p.trainErr).toFixed(1)}`).join(' ')
  const valPath   = BV_POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${cxToSvgX(p.cx).toFixed(1)},${errToSvgY(p.valErr).toFixed(1)}`).join(' ')

  // Bias² shaded region: between noise floor and val curve, on low-complexity side (cx 0..45)
  const biasRegionPts = [
    ...BV_POINTS.filter(p => p.cx <= SWEET_SPOT_CX).map(p => `${cxToSvgX(p.cx).toFixed(1)},${errToSvgY(p.valErr).toFixed(1)}`),
    // close bottom: walk back along noise floor
    ...BV_POINTS.filter(p => p.cx <= SWEET_SPOT_CX).reverse().map(p => `${cxToSvgX(p.cx).toFixed(1)},${errToSvgY(NOISE_FLOOR).toFixed(1)}`),
  ].join(' ')

  // Variance shaded region: between sweet-spot val error level and val curve, on high-complexity side (cx 45..100)
  const sweetValErr = interpCurve(SWEET_SPOT_CX, 'valErr')
  const varRegionPts = [
    ...BV_POINTS.filter(p => p.cx >= SWEET_SPOT_CX).map(p => `${cxToSvgX(p.cx).toFixed(1)},${errToSvgY(p.valErr).toFixed(1)}`),
    ...BV_POINTS.filter(p => p.cx >= SWEET_SPOT_CX).reverse().map(p => `${cxToSvgX(p.cx).toFixed(1)},${errToSvgY(sweetValErr).toFixed(1)}`),
  ].join(' ')

  // Current-complexity x position in SVG
  const curX = cxToSvgX(complexity)
  const dotTrainY = errToSvgY(trainErr)
  const dotValY   = errToSvgY(valErr)

  // Sweet-spot x
  const sweetX = cxToSvgX(SWEET_SPOT_CX)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Classical ML</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>
          Bias-Variance Tradeoff
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          Drag the complexity slider to move through the underfitting-to-overfitting spectrum. Watch how training and validation error diverge — and what it means when a model lands here in production.
        </p>
      </div>

      {/* SVG Chart */}
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <svg
          viewBox="0 0 500 280"
          width="100%"
          style={{ display: 'block', borderRadius: 'var(--r)', border: '1px solid var(--rim)', background: 'var(--void)' }}
        >
          {/* Shaded Bias² region */}
          <polygon points={biasRegionPts} fill="var(--rose)" fillOpacity="0.10" />
          {/* Shaded Variance region */}
          <polygon points={varRegionPts} fill="var(--ember)" fillOpacity="0.10" />

          {/* Noise floor line */}
          <line
            x1={cxToSvgX(0)} y1={errToSvgY(NOISE_FLOOR)}
            x2={cxToSvgX(100)} y2={errToSvgY(NOISE_FLOOR)}
            stroke="var(--ink-ghost)" strokeWidth="1" strokeDasharray="4 3"
          />
          <text x={cxToSvgX(101)} y={errToSvgY(NOISE_FLOOR) + 4} fontSize="8" fill="var(--ink-ghost)" fontFamily="var(--font-mono)">noise</text>

          {/* Sweet-spot dashed vertical */}
          <line
            x1={sweetX} y1={errToSvgY(0.85)}
            x2={sweetX} y2={errToSvgY(0)}
            stroke="var(--mint)" strokeWidth="1" strokeDasharray="4 3" strokeOpacity="0.5"
          />
          {/* Sweet-spot star marker */}
          <text x={sweetX - 5} y={errToSvgY(0.82)} fontSize="11" fill="var(--mint)" fillOpacity="0.8" fontFamily="var(--font-sans)">✦</text>

          {/* Training error curve */}
          <path d={trainPath} fill="none" stroke="var(--sky)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Validation error curve */}
          <path d={valPath} fill="none" stroke="var(--prime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Current complexity vertical line */}
          <line
            x1={curX} y1={errToSvgY(0.85)}
            x2={curX} y2={errToSvgY(0)}
            stroke="var(--ink-mid)" strokeWidth="1.5" strokeOpacity="0.7"
          />

          {/* Highlight dots */}
          <circle cx={curX} cy={dotTrainY} r="5" fill="var(--sky)" stroke="var(--void)" strokeWidth="2" />
          <circle cx={curX} cy={dotValY}   r="5" fill="var(--prime)" stroke="var(--void)" strokeWidth="2" />

          {/* Region labels */}
          <text x={cxToSvgX(14)} y={errToSvgY(0.75)} fontSize="8" fill="var(--rose)" fillOpacity="0.75" fontFamily="var(--font-mono)" textAnchor="middle">Bias²</text>
          <text x={cxToSvgX(78)} y={errToSvgY(0.60)} fontSize="8" fill="var(--ember)" fillOpacity="0.75" fontFamily="var(--font-mono)" textAnchor="middle">Variance</text>

          {/* Legend */}
          <line x1="58" y1="16" x2="76" y2="16" stroke="var(--sky)"   strokeWidth="2" />
          <text x="79" y="20" fontSize="9" fill="var(--sky)"   fontFamily="var(--font-mono)">Train error</text>
          <line x1="58" y1="30" x2="76" y2="30" stroke="var(--prime)" strokeWidth="2" />
          <text x="79" y="34" fontSize="9" fill="var(--prime)" fontFamily="var(--font-mono)">Val error</text>

          {/* X axis */}
          <line x1={cxToSvgX(0)} y1={errToSvgY(0)} x2={cxToSvgX(100)} y2={errToSvgY(0)} stroke="var(--rim)" strokeWidth="1" />
          <text x={cxToSvgX(0)}   y="276" fontSize="8" fill="var(--ink-ghost)" fontFamily="var(--font-mono)" textAnchor="middle">Low</text>
          <text x={cxToSvgX(50)}  y="276" fontSize="8" fill="var(--ink-ghost)" fontFamily="var(--font-mono)" textAnchor="middle">Model Complexity</text>
          <text x={cxToSvgX(100)} y="276" fontSize="8" fill="var(--ink-ghost)" fontFamily="var(--font-mono)" textAnchor="middle">High</text>

          {/* Y axis */}
          <line x1={cxToSvgX(0)} y1={errToSvgY(0)} x2={cxToSvgX(0)} y2={errToSvgY(0.85)} stroke="var(--rim)" strokeWidth="1" />
          <text x="10" y={errToSvgY(0.82)} fontSize="8" fill="var(--ink-ghost)" fontFamily="var(--font-mono)" textAnchor="middle" transform={`rotate(-90, 10, ${errToSvgY(0.42)})`}>Error</text>
        </svg>
      </div>

      {/* Slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '560px' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Complexity</span>
        <input
          type="range"
          min="0"
          max="100"
          value={complexity}
          onChange={e => setComplexity(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--prime)', cursor: 'pointer' }}
        />
        <span style={{ fontSize: '11px', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)', minWidth: '28px', textAlign: 'right' }}>{complexity}</span>
      </div>

      {/* Live readout */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ padding: '8px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(99,179,237,0.10)', border: '1px solid rgba(99,179,237,0.2)' }}>
          <div style={{ fontSize: '9px', color: 'var(--sky)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: '3px' }}>TRAIN ERROR</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--sky)', fontFamily: 'var(--font-mono)' }}>{trainErr.toFixed(2)}</div>
          <div style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>{meta.trainLabel}</div>
        </div>
        <div style={{ padding: '8px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.18)' }}>
          <div style={{ fontSize: '9px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: '3px' }}>VAL ERROR</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>{valErr.toFixed(2)}</div>
          <div style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>{meta.valLabel}</div>
        </div>
        <div style={{ padding: '8px 14px', borderRadius: 'var(--r-sm)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--rim)' }}>
          <div style={{ fontSize: '9px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: '3px' }}>GAP (VAL − TRAIN)</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: (valErr - trainErr) > 0.15 ? 'var(--ember)' : 'var(--ink-mid)', fontFamily: 'var(--font-mono)' }}>{(valErr - trainErr).toFixed(2)}</div>
          <div style={{ fontSize: '10px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>generalisation gap</div>
        </div>
      </div>

      {/* Diagnosis panel */}
      <div style={{
        borderLeft: `3px solid ${meta.borderColor}`,
        background: meta.badgeColor,
        borderRadius: '0 var(--r) var(--r) 0',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{meta.label}</span>
          <span style={{
            padding: '2px 8px', borderRadius: '99px',
            fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600,
            background: meta.badgeColor,
            border: `1px solid ${meta.borderColor}`,
            color: meta.borderColor,
          }}>
            complexity {complexity}
          </span>
        </div>
        {/* In-production callout */}
        <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--r-sm)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '12px', color: 'var(--prime)', flexShrink: 0, marginTop: '1px' }}>→</span>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: '5px', fontWeight: 600 }}>IN PRODUCTION</div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>{meta.production}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const MODULES = [
  { id: 'zoo',              label: 'Model Failure Zoo',        component: ModelFailureZoo,       difficulty: 'junior', isFree: true,  fidelityTier: 'conceptual' },
  { id: 'ensemble',         label: 'Ensemble Decision Lab',    component: EnsembleDecisionLab,   difficulty: 'mid',    isFree: false, fidelityTier: 'conceptual' },
  { id: 'hyperparam',       label: 'Hyperparameter Priority',  component: HyperparamPriority,    difficulty: 'senior', isFree: false, fidelityTier: 'conceptual' },
  { id: 'naive_bayes',      label: 'Naive Bayes Failures',     component: NaiveBayesFailures,    difficulty: 'mid',    isFree: false, fidelityTier: 'conceptual' },
  { id: 'decision_boundary',label: 'Decision Boundary Lab',    component: DecisionBoundaryLab,   difficulty: 'mid',    isFree: false, fidelityTier: 'simplified' },
  { id: 'bias_variance',    label: 'Bias-Variance Tradeoff',   component: BiasVarianceVisualizer,difficulty: 'junior', isFree: true,  fidelityTier: 'conceptual' },
]

// ── Coming Soon ───────────────────────────────────────────────────────────────
const COMING_SOON = []

export default function ClassicalMLTab({ onNavigate, accessCode = null }) {
  const [activeModule, setActiveModule] = useState('zoo')
  const accessCodeFromStorage = accessCode ?? localStorage.getItem('msl_access')

  const ActiveComponent = MODULES.find(m => m.id === activeModule)?.component
  const activeModuleData = MODULES.find(m => m.id === activeModule)

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div className="eyebrow" style={{ color: 'var(--prime)', marginBottom: '8px' }}>
          Classical ML
        </div>
        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          margin: '0 0 10px',
          lineHeight: 1.1,
          background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          When Models Break in Production
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--ink-low)',
          lineHeight: 1.65,
          margin: 0,
          maxWidth: '600px',
        }}>
          You know how these models work. This covers when they break in production — silently, confidently, and in ways the training metrics never warned you about.
        </p>
      </div>

      {/* Module nav */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {MODULES.map(mod => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 18px',
              borderRadius: '24px',
              border: activeModule === mod.id ? '1px solid var(--prime)' : '1px solid var(--rim)',
              background: activeModule === mod.id ? 'rgba(240,165,0,0.1)' : 'var(--surface)',
              color: activeModule === mod.id ? 'var(--prime)' : 'var(--ink-mid)',
              fontSize: '13px',
              fontWeight: activeModule === mod.id ? 600 : 400,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {mod.label}
          </button>
        ))}
      </div>
      {activeModuleData && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
          <FidelityBadge tier={activeModuleData.fidelityTier ?? 'conceptual'} />
          <BookmarkButton tabId="classical" moduleId={activeModule} label={activeModuleData.label} />
        </div>
      )}

      {/* Module content */}
      <div className="animate-slide-up">
        {activeModuleData && activeModuleData.isFree === false && accessCodeFromStorage !== 'DAI2026' ? (
          <AccessGate onUnlock={() => localStorage.setItem('msl_access', 'DAI2026')} />
        ) : (
          ActiveComponent && <ActiveComponent />
        )}
      </div>
      {/* ── Coming Soon ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '48px' }}>
        <div className="eyebrow" style={{ marginBottom: '12px' }}>What's building</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {COMING_SOON.map(m => (
            <div key={m.label} className="card" style={{ padding: 'var(--card-pad-secondary)', opacity: 0.65, borderLeft: '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--ink-mid)' }}>{m.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'rgba(255,255,255,0.07)', color: 'var(--ink-ghost)', borderRadius: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>soon</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.userBrief}</p>
            </div>
          ))}
        </div>
      </div>
      {onNavigate && <ForwardPointer label="Test classical ML judgment in Combinator" tab="combinator" onNavigate={onNavigate} accent="var(--prime)" />}
    </div>
  )
}
