# Interactive Coverage Audit

_Last updated: 2026-07-01_

---

## Summary

| Metric | Value |
|---|---|
| Total modules | 181 |
| Modules with interactiveId | 73 |
| Modules without interactiveId | 108 |
| Registered interactive components | 53 |
| **Coverage** | **40%** |

---

## Priority build queue — top 20 new interactives

| Priority | Module | Interactive ID | What it shows |
|---|---|---|---|
| 1 | mathStats/bayesian_inference | bayesian_update_viz | Prior → likelihood → posterior as data points arrive |
| 2 | deepLearning/transformers | transformer_attention_viz | Self-attention, multi-head, positional encoding |
| 3 | causal/dag_confounding | dag_viz | Interactive DAG — add nodes/edges, see blocked/open paths |
| 4 | classicalML/generalization | generalization_viz | Train vs test error, VC dimension, PAC bounds |
| 5 | deepLearning/cnns | cnn_viz | Filter sliding over input, feature map forming, pooling |
| 6 | causal/did | did_viz | Parallel trends, treatment effect, counterfactual line |
| 7 | mathStats/eigendecomposition | eigendecomposition_viz | Eigenvector as fixed direction, eigenvalue as stretch |
| 8 | mathStats/sampling_distributions | clt_viz | CLT: sample means from any distribution → normal |
| 9 | optimization/sgd_and_minibatch | sgd_noise_viz | Full batch vs mini-batch vs SGD noise on 2D landscape |
| 10 | monitoring/data_drift_detection | drift_detection_viz | Feature distribution shift, PSI/KS stat, alert threshold |
| 11 | classicalML/naive_bayes | naive_bayes_viz | Class-conditional distributions, posterior, decision boundary |
| 12 | rl/mdp_framework | mdp_viz | Interactive MDP grid — states, transitions, rewards, value function |
| 13 | selfSupervised/simclr | simclr_viz | Augmentation pairs, embedding similarity, temperature effect |
| 14 | data/distribution_shift | covariate_shift_viz | Train vs test distribution, reweighting, importance sampling |
| 15 | probabilisticML/approximate_inference | mcmc_viz | MCMC chain: random walk, acceptance/rejection, mixing |
| 16 | timeSeries/ts_anomaly_detection | ts_anomaly_viz | Seasonal decomp with anomaly scores, threshold bands |
| 17 | classicalML/calibration | calibration_viz | Reliability diagram, temperature scaling, before/after |
| 18 | optimization/second_order_methods | newton_vs_gd_viz | Newton vs GD on ill-conditioned surface |
| 19 | graphML/spectral_gcn | spectral_graph_viz | Graph Laplacian, eigenvalues, graph Fourier transform |
| 20 | eval/error_analysis | error_analysis_viz | Per-class error breakdown, confusion drill-down |

---

## Quick wins — fix wrong/missing interactiveId (interactive already built)

| Module id | File | Correct interactiveId |
|---|---|---|
| trees | classicalMLModules.js | decision_tree_viz |
| ensembles | classicalMLModules.js | ensemble_viz |
| calibration | classicalMLModules.js | calibration_curve_viz |
| activations | deepLearningModules.js | activation_functions |
| rnns_lstms | deepLearningModules.js | rnn_viz |
| gradient_descent_fundamentals | optimizationModules.js | gradient_descent |
| learning_rate_schedules | optimizationModules.js | lr_schedule_viz |
| loss_landscape_geometry | optimizationModules.js | loss_landscape_viz |
| epsilon_greedy | banditsModules.js | exploration_exploitation_viz |
| ucb_algorithms | banditsModules.js | thompson_sampling_viz |
| simclr | selfSupervisedModules.js | contrastive_viz |
| spatial_gcn | graphMLModules.js | gnn_message_passing_viz |
| auc_roc | evalModules.js | roc_curve_viz |
| calibration | evalModules.js | calibration_curve_viz |

---

## Documented exceptions (no interactive needed)

- deepLearning/dl_debugging — checklist content, no mechanism to animate
- deepLearning/quantization, dl_serving — architecture diagrams
- production/* — system architecture, mostly process flows
- systemDesign/design_framework — framework steps
- eval/ablation — experimental design
- eval/evaluation_in_prod — process flow
- causal/sensitivity_analysis — statistical tables
- mathStats/concentration_inequalities — proof-heavy

---

## Full gap list by domain

### bandits (8 gaps): mab_problem, epsilon_greedy, ucb_algorithms, contextual_bandits, linucb, off_policy_evaluation, bandits_in_recsys, non_stationary_bandits
### causal (10 gaps — 0% coverage): pot_outcomes, dag_confounding, rct_design, observational_ci, iv, did, rdd, uplift_modeling, mediation, sensitivity_analysis
### classicalML (6 gaps): generalization, trees, ensembles, naive_bayes, calibration, feature_selection
### data (10 gaps): data_quality_audit, missing_value_handling, feature_engineering, categorical_encoding, feature_scaling, data_splits_and_leakage, feature_selection, distribution_shift, data_augmentation, data_versioning_and_pipelines
### deepLearning (11 gaps): neural_nets, activations, optimizers, cnns, rnns_lstms, transformers, pretraining, finetune, quantization, dl_serving, dl_debugging
### eval (8 gaps): metrics_first_principles, auc_roc, offline_vs_online, validation_traps, error_analysis, calibration, ablation, evaluation_in_prod
### graphML (8 gaps): graph_representations, spectral_gcn, spatial_gcn, graph_attention, link_prediction, node_classification_at_scale, heterogeneous_graphs, gnn_applications
### mathStats (13 gaps): probability_basics, random_variables, joint_distributions, linear_algebra_basics, eigendecomposition, pca_theory, calculus_ml, matrix_calculus, mle_map, bayesian_inference, em_algorithm, concentration_inequalities, sampling_distributions
### monitoring (8 gaps — 0% coverage): monitoring_taxonomy, data_drift_detection, concept_drift, prediction_monitoring, feature_importance_drift, calibration_monitoring, silent_model_staleness, alerting_runbooks
### optimization (8 gaps): gradient_descent_fundamentals, sgd_and_minibatch, adagrad_rmsprop, learning_rate_schedules, gradient_flow, second_order_methods, loss_landscape_geometry, gradient_clipping_regularization
### probabilisticML (6 gaps): bayesian_inference, approximate_inference, bayesian_neural_networks, calibration, information_geometry, probabilistic_graphical_models
### production (11 gaps — 0% coverage): training_serving_skew, feature_engineering_prod, feature_store, feature_store_traps, late_arriving_data, data_quality, label_generation, pipelines, model_registry, ab_infra, online_learning
### rl (7 gaps): mdp_framework, bellman_equations, temporal_difference, actor_critic, ppo_trpo, rlhf_reward_modeling, rl_production
### selfSupervised (8 gaps): ssl_overview, simclr, moco, byol_barlow, masked_autoencoders, clip_alignment, ssl_for_tabular, downstream_adaptation
### systemDesign (8 gaps — 0% coverage): design_framework, recsys_overview, recsys_stack, two_tower, semantic_search, ml_platform, ranking_systems, real_time_ml
### timeSeries (6 gaps): prophet_framework, exponential_smoothing, neural_forecasting, forecast_evaluation, ts_anomaly_detection, causal_ts
### unsupervised (5 gaps): clustering_overview, hierarchical, tsne_umap, autoencoders_dim_reduction, topic_modeling
