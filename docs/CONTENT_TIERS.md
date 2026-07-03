# MSL Content Tiers — Interview Weight + Depth Audit
_Last updated: 2026-07-01_

---

## S-TIER — Comes up in virtually every MLE interview

| # | Module | id | File | Depth Score | Critical Gaps |
|---|--------|-----|------|-------------|---------------|
| 1 | Logistic Regression | `logistic_regression` | classicalMLModules.js | 7/10 | Missing sigmoid figure, algebraic cross-entropy derivation, softmax extension |
| 2 | Bias-Variance / Generalisation | `generalization` | classicalMLModules.js | 6/10 | No numerical decomposition, VC dimension barely touched, no U-curve figure, no double descent figure |
| 3 | L1/L2 Regularisation | `regularization` | classicalMLModules.js | 7/10 | Missing Bayesian interpretation (L2=Gaussian prior, L1=Laplace prior), soft-thresholding mechanics, scale sensitivity |
| 4 | Gradient Descent | `gradient_descent_fundamentals` | optimizationModules.js | 7/10 | Missing convergence rate analysis, no Newton's method comparison (why not 2nd order?), batch vs full-batch here or link |
| 5 | Gradient Boosting / XGBoost | `gradient_boosting` | classicalMLModules.js | 8.5/10 | ✅ Just deepened — strongest module now |
| 6 | Decision Trees | `trees` | classicalMLModules.js | 6/10 | **No worked Gini/entropy split with numbers**, pre vs post pruning mechanics thin, no figure showing a split |
| 7 | Random Forests | `random_forest` | classicalMLModules.js | 7.5/10 | No figure, extrapolation failure not mentioned, when RF beats boosting not explained |
| 8 | Cross-Validation | `cross_validation` | evalModules.js | 6.5/10 | **BUG: Q2 answer marked `B` but correct is `A`**, **BUG: Q3 answer marked `A` but correct is `B`**, k-value selection rationale missing, purge gap not explained |
| 9 | AUC-ROC / PR-AUC | `auc_roc` | evalModules.js | 7.5/10 | **BUG: Q2+Q3 options not wrapped in backtick template literals**, partial AUC missing |
| 10 | Backpropagation | `backprop` | deepLearningModules.js | 6.5/10 | No worked numerical example, exploding gradients not covered, gradient clipping missing, no computational graph figure |

---

## Priority order for S-tier rewrites

1. **Decision Trees** — no numerical split example is inexcusable for this topic. Needs: Gini walk-through with real numbers, pre/post pruning distinction, figure.
2. **Backpropagation** — conceptually explained but never shown. Needs: worked 3-node example, exploding gradients, computational graph figure.
3. **Generalisation Theory** — VC dimension mentioned in subtitle but barely in body. Needs: numerical decomposition, U-curve figure, double descent figure.
4. **Cross-Validation** — has wrong answer keys (bugs). Fix immediately, then deepen k-selection rationale and nested CV.
5. **Logistic Regression** — good but missing the algebraic proof that cross-entropy cancels σ'(z). Add sigmoid figure.
6. **Regularisation** — good geometry, missing Bayesian prior interpretation.
7. **Gradient Descent** — good, add Newton's method contrast + convergence rate.
8. **Random Forests** — good, add extrapolation failure + figure.
9. **AUC-ROC** — fix option format bugs, add partial AUC.
10. **Gradient Boosting** ✅ — done.

---

## Visualization wishlist for S-tier

| Module | Figure needed |
|--------|--------------|
| Logistic Regression | Sigmoid curve + decision boundary in 2D |
| Generalisation Theory | Bias-variance U-curve + double descent curve side by side |
| Decision Trees | One split with computed Gini (before/after) |
| Backpropagation | Computational graph with cached intermediates |
| Random Forests | Bootstrap sampling → tree ensemble → average |
| Cross-Validation | Already has k-fold figure ✅ |
| AUC-ROC | Already has ROC curve figure ✅ |
| Regularisation | Already has L1/L2 geometry figure ✅ |
| Gradient Descent | Already has convergence figure ✅ |

---

## A-TIER — Senior/staff interviews + most mid-level

| # | Module | id | File |
|---|--------|-----|------|
| 11 | Adam / AdamW | `adam` | optimizationModules.js |
| 12 | Batch Normalisation | `batch_norm` | deepLearningModules.js |
| 13 | Dropout | (in batch_norm module) | deepLearningModules.js |
| 14 | SVMs | `svm` | classicalMLModules.js |
| 15 | CNNs | `cnns` | deepLearningModules.js |
| 16 | Attention / Transformers | `pretraining` | deepLearningModules.js |
| 17 | Class Imbalance | `class_imbalance` | classicalMLModules.js |
| 18 | PCA | `pca` | unsupervisedModules.js |
| 19 | K-Means | `kmeans` | unsupervisedModules.js |
| 20 | Naive Bayes | `naive_bayes` | classicalMLModules.js |
| 21 | Calibration | `calibration` | classicalMLModules.js |
| 22 | Concept Drift | `concept_drift` | monitoringModules.js |
| 23 | A/B Testing | `ab_infra` | productionModules.js |
| 24 | Offline vs Online Eval | `offline_vs_online` | evalModules.js |

---

## B-TIER — Staff/principal or specialist roles

| # | Module | id | File |
|---|--------|-----|------|
| 25 | MAP vs MLE | `mle_map` | mathStatsModules.js |
| 26 | EM Algorithm | `em_algorithm` | mathStatsModules.js |
| 27 | LSTMs / RNNs | `rnns_lstms` | deepLearningModules.js |
| 28 | Fine-tuning / Transfer | `finetune` | deepLearningModules.js |
| 29 | Causal Inference | `confounding` etc. | causalModules.js |
| 30 | Gaussian Processes | `gaussian_processes` | probabilisticMLModules.js |
| 31 | Quantisation | `quantization` | deepLearningModules.js |
| 32 | Anomaly Detection | `anomaly_detection` | unsupervisedModules.js |
| 33 | Ranking Metrics | `ranking_metrics` | evalModules.js |
| 34 | Online Learning | `online_learning` | productionModules.js |

---

## Immediate bugs to fix (before any rewrites)

1. `cross_validation` Q2: answer key says `B` (yes, just report mean) — correct is `A` (investigate outlier fold)
2. `cross_validation` Q3: answer key says `A` (Optuna is unbiased) — correct is `B` (nested CV problem)
3. `auc_roc` Q2 + Q3: options are plain strings, not backtick-wrapped — will not render correctly
