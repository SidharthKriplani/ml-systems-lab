# Interactive Component Rubric — ML Systems Lab

_Audited 2026-07-01. 53 components. Rubric: 5 dimensions × 1–3 each = 5–15 total. Flag if ≤ 9._

---

## Rubric Dimensions

| Dimension | 1 | 2 | 3 |
|---|---|---|---|
| **Concept Fidelity** | Decorative / loosely related to the concept | Demonstrates concept but misses the core insight | Directly demonstrates the mechanism — you can't watch it and not understand |
| **Interactivity Quality** | Only play/pause or a single slider with no payoff | Multiple controls but no new insight surfaces | Controls directly expose a parameter that changes behavior in a conceptually important way |
| **Visual Clarity** | Cluttered / unlabeled / hard to interpret | Readable but missing labels, legends, or axis context | Self-explanatory to a user who doesn't know the concept yet |
| **DPR Safety** | Uses `canvas.width`/`canvas.height` for drawing coordinates (retina bug) | Partially correct — some draws use `clientWidth` but some don't | Consistently uses `canvas.clientWidth`/`canvas.clientHeight` for all logical coordinates (or is SVG/HTML, no canvas) |
| **Teaching Payoff** | Cool but no intuition built | Partial intuition — user understands what but not why | After using it, user understands WHY the concept works |

---

## Scores

| Component | Fidelity | Interactivity | Clarity | DPR | Teaching | Total | Flag |
|---|---|---|---|---|---|---|---|
| gradient_descent | 3 | 3 | 3 | 1 | 3 | 13 | |
| bayes_calculator | 3 | 3 | 3 | 3 | 3 | 15 | |
| distribution_viz | 3 | 3 | 3 | 3 | 2 | 14 | |
| activation_functions | 3 | 2 | 3 | 3 | 3 | 14 | |
| lr_schedule_viz | 3 | 2 | 3 | 1 | 2 | 11 | |
| roc_curve_viz | 3 | 3 | 3 | 1 | 3 | 13 | |
| kmeans_viz | 3 | 3 | 3 | 1 | 3 | 13 | |
| pca_viz | 3 | 3 | 3 | 1 | 3 | 13 | |
| attention_viz | 2 | 2 | 3 | 3 | 2 | 12 | |
| momentum_viz | 3 | 3 | 3 | 1 | 3 | 13 | |
| confusion_matrix_viz | 3 | 3 | 3 | 3 | 2 | 14 | |
| linear_regression_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| bias_variance_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| logistic_regression_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| regularization_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| cross_validation_viz | 3 | 2 | 3 | 3 | 2 | 13 | |
| information_theory_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| dbscan_viz | 3 | 3 | 3 | 1 | 3 | 13 | |
| backprop_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| ensemble_viz | 3 | 1 | 3 | 1 | 2 | 10 | |
| hypothesis_testing_viz | 3 | 3 | 3 | 1 | 3 | 13 | |
| calibration_curve_viz | 3 | 2 | 3 | 1 | 2 | 11 | |
| decision_tree_viz | 3 | 2 | 3 | 1 | 2 | 11 | |
| svm_viz | 3 | 2 | 3 | 1 | 2 | 11 | |
| knn_viz | 3 | 3 | 3 | 1 | 3 | 13 | |
| random_forest_viz | 2 | 2 | 2 | 1 | 2 | 9 | NEEDS ATTENTION |
| class_imbalance_viz | 3 | 2 | 3 | 1 | 2 | 11 | |
| anomaly_detection_viz | 3 | 2 | 3 | 1 | 2 | 11 | |
| gmm_viz | 3 | 3 | 3 | 1 | 3 | 13 | |
| batch_norm_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| rnn_viz | 3 | 2 | 3 | 3 | 3 | 14 | |
| tsne_viz | 2 | 2 | 3 | 1 | 2 | 10 | |
| weight_init_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| thompson_sampling_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| gaussian_process_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| policy_gradient_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| gradient_boosting_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| loss_landscape_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| monte_carlo_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| ndcg_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| svd_viz | 3 | 3 | 3 | 1 | 3 | 13 | |
| q_learning_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| time_series_decomp_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| exploration_exploitation_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| hierarchical_clustering_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| contrastive_viz | 2 | 2 | 2 | 3 | 2 | 11 | |
| gnn_message_passing_viz | 3 | 2 | 3 | 3 | 3 | 14 | |
| vae_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| arima_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| adam_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| variational_inference_viz | 3 | 2 | 3 | 3 | 3 | 14 | |
| convex_optimization_viz | 3 | 3 | 3 | 3 | 3 | 15 | |
| stationarity_viz | 3 | 3 | 3 | 3 | 3 | 15 | |

---

## Needs Attention (total ≤ 9)

**1. random_forest_viz — 9**
Fidelity=2, Interactivity=2, Clarity=2, DPR=1, Teaching=2.
Hardcoded small canvas sizes. Feature importance bars are static and pre-computed. The "forest" panel shows a fixed pixel grid without animating tree growth or showing individual tree decisions. No control exposes a parameter that changes ensemble behavior visually (e.g., n_trees, max_depth, bootstrap fraction). A user can observe that random forests exist but cannot understand why bagging + feature subsampling reduces variance. Needs: animated tree-by-tree construction, a slider that varies n_trees and shows OOB error converging, and correct DPR scaling.

---

## DPR Violations (DPR = 1) — 19 components

These components use `canvas.width` / `canvas.height` as logical drawing coordinates without applying a device pixel ratio scale. On retina / HiDPI displays this causes blurry or mispositioned rendering. The correct pattern is:

```js
const dpr = window.devicePixelRatio || 1
canvas.width = Math.round(rect.width * dpr)
canvas.height = Math.round(rect.height * dpr)
ctx.scale(dpr, dpr)
// then draw with rect.width / rect.height (logical CSS pixels)
```

| Component | Notes |
|---|---|
| gradient_descent | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| lr_schedule_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| roc_curve_viz | ResizeObserver sets `canvas.width = rect.width` with no dpr |
| kmeans_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| pca_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| momentum_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| dbscan_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| ensemble_viz | Hardcoded `canvas.width = 300` / `canvas.height = 200`, no dpr |
| hypothesis_testing_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| calibration_curve_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| decision_tree_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| svm_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| knn_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| random_forest_viz | Hardcoded canvas sizes, no dpr scale |
| class_imbalance_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| anomaly_detection_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| gmm_viz | Sets `canvas.width = canvas.offsetWidth` with no dpr scale |
| tsne_viz | Hardcoded `width={430} height={300}` JSX props, no dpr scale |
| svd_viz | `drawGeometric` and `drawHeatmap` both set `canvas.width = canvas.clientWidth` without dpr multiplier |

---

## Score Distribution

- Total = 15 (perfect): 27 components
- Total 13–14: 18 components
- Total 10–12: 7 components
- Total ≤ 9: 1 component (random_forest_viz)

DPR=3 (safe): 34 components  
DPR=1 (violation): 19 components  
DPR=2 (partial): 0 components
