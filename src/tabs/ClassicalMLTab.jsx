import { useState } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const MODELS = [
  {
    id: 'decision-tree',
    name: 'Decision Tree',
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
              border: selectedModel === m.id ? '1px solid var(--mint)' : '1px solid var(--rim)',
              background: selectedModel === m.id ? 'rgba(52,211,153,0.12)' : 'var(--surface)',
              color: selectedModel === m.id ? 'var(--mint)' : 'var(--ink-mid)',
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
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: 'var(--mint)', fontFamily: 'var(--font-mono)',
            }}>
              ML
            </div>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: '17px', fontWeight: 700, color: 'var(--ink-hi)' }}>
                {model.name}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                PRODUCTION FAILURE MODES
              </span>
            </div>
          </div>

          {/* Silent failure */}
          <div style={{ borderLeft: '3px solid var(--rose)', paddingLeft: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--rose)', fontFamily: 'var(--font-mono)', marginBottom: '6px', letterSpacing: '0.05em' }}>
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
            <div style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-mono)', marginBottom: '8px', letterSpacing: '0.05em' }}>
              PRODUCTION INCIDENT
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, fontStyle: 'italic' }}>
              {model.story}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Diagnostic signal */}
            <div style={{ borderLeft: '3px solid var(--sky)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--sky)', fontFamily: 'var(--font-mono)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                DIAGNOSTIC SIGNAL
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                {model.diagnosticSignal}
              </p>
            </div>

            {/* Fix */}
            <div style={{ borderLeft: '3px solid var(--mint)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)', marginBottom: '6px', letterSpacing: '0.05em' }}>
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
            color: 'var(--mint)',
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            lineHeight: 1.6,
          }}>
            {model.codeHint}
          </pre>

          {/* Production note */}
          <div style={{
            background: 'rgba(52,211,153,0.05)',
            border: '1px solid rgba(52,211,153,0.15)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            gap: '10px',
          }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>📌</span>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--mint)', fontWeight: 600 }}>Production note: </strong>
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
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.2)',
            fontSize: '13px',
            color: 'var(--mint)',
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
                {isRevealed ? (isCorrect ? '✓' : '✗') : scenario.id}
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
                  else if (isSelected && !isCorrectOpt) { borderColor = 'var(--rose)'; bgColor = 'rgba(244,114,182,0.08)'; textColor = 'var(--rose)' }
                } else if (isSelected) {
                  borderColor = 'var(--violet)'; bgColor = 'rgba(139,92,246,0.1)'; textColor = 'var(--violet)'
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
                  <span style={{ color: 'var(--mint)', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
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
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.2)',
            fontSize: '13px',
            color: 'var(--mint)',
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
                {isRevealed ? (isCorrect ? '✓' : '✗') : scenario.id}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '10px',
                    background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                    fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)',
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
                  else if (isSelected && !isCorrectOpt) { borderColor = 'var(--rose)'; bgColor = 'rgba(244,114,182,0.08)'; textColor = 'var(--rose)' }
                } else if (isSelected) {
                  borderColor = 'var(--violet)'; bgColor = 'rgba(139,92,246,0.1)'; textColor = 'var(--violet)'
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
                  <span style={{ color: 'var(--mint)', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                        TUNE FIRST: {scenario.answer.toUpperCase()}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '8px',
                        background: scenario.impact.startsWith('HIGH') ? 'rgba(52,211,153,0.1)' : 'rgba(245,158,11,0.1)',
                        border: `1px solid ${scenario.impact.startsWith('HIGH') ? 'rgba(52,211,153,0.2)' : 'rgba(245,158,11,0.2)'}`,
                        fontSize: '10px',
                        color: scenario.impact.startsWith('HIGH') ? 'var(--mint)' : 'var(--gold)',
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

// ─── Main Tab ─────────────────────────────────────────────────────────────────

const MODULES = [
  { id: 'zoo', icon: '💀', label: 'Model Failure Zoo', component: ModelFailureZoo },
  { id: 'ensemble', icon: '🎰', label: 'Ensemble Decision Lab', component: EnsembleDecisionLab },
  { id: 'hyperparam', icon: '🎛', label: 'Hyperparameter Priority', component: HyperparamPriority },
]

export default function ClassicalMLTab({ onNavigate }) {
  const [activeModule, setActiveModule] = useState('zoo')

  const ActiveComponent = MODULES.find(m => m.id === activeModule)?.component

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div className="eyebrow" style={{ color: 'var(--mint)', marginBottom: '8px' }}>
          Classical ML
        </div>
        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '28px',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          margin: '0 0 10px',
          lineHeight: 1.1,
          background: 'linear-gradient(135deg, var(--mint) 0%, var(--ink-hi) 60%)',
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
              border: activeModule === mod.id ? '1px solid var(--mint)' : '1px solid var(--rim)',
              background: activeModule === mod.id ? 'rgba(52,211,153,0.1)' : 'var(--surface)',
              color: activeModule === mod.id ? 'var(--mint)' : 'var(--ink-mid)',
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

      {/* Module content */}
      <div className="animate-slide-up">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}
