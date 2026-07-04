// moduleTiers.js — interview-frequency tier for every MSL Foundation module,
// for a SENIOR ML ENGINEER loop. S = always asked, A = shows up often,
// B = the depth that makes you unbreakable (default). Powers tier badges and
// the one-click "Build S / A / B tracks" action. Keyed by moduleId; edit the
// two lists below to re-tier. Modules that share a moduleId across families
// share a tier (S wins on conflict).

export const TIER_S = [
  // Classical ML
  'linear_regression', 'logistic_regression', 'regularization', 'generalization',
  'trees', 'random_forest', 'gradient_boosting', 'class_imbalance',
  // Evaluation
  'metrics_first_principles', 'auc_roc', 'ranking_metrics', 'offline_vs_online',
  'offline_online_eval', 'validation_traps', 'cross_validation',
  // Math & Stats
  'probability_basics', 'hypothesis_testing', 'mle_map', 'sampling_distributions',
  // Causal
  'pot_outcomes', 'rct_design',
  // Recommender Systems
  'two_stage_architecture', 'candidate_generation', 'learning_to_rank',
  'cold_start', 'feedback_loops_bias',
  // System Design
  'design_framework', 'recsys_overview', 'recsys_stack',
  // Deep Learning
  'neural_nets', 'backprop', 'attention', 'transformers',
  // Production
  'training_serving_skew', 'ab_infra',
  // Data & Features
  'feature_engineering', 'data_splits_and_leakage',
  // Optimization
  'gradient_descent_fundamentals',
]

export const TIER_A = [
  // Classical ML
  'ensembles', 'svm', 'knn', 'naive_bayes', 'calibration', 'feature_selection',
  // Math & Stats
  'random_variables', 'joint_distributions', 'information_theory',
  'linear_algebra_basics', 'eigendecomposition', 'svd', 'pca_theory',
  'convex_optimization',
  // Evaluation
  'error_analysis', 'ablation', 'evaluation_in_prod',
  // Causal
  'dag_confounding', 'observational_ci', 'iv', 'did', 'rdd', 'uplift_modeling',
  // Deep Learning
  'activations', 'batch_norm', 'optimizers', 'cnns', 'rnns_lstms',
  // Recommender Systems
  'features_and_freshness', 'multi_objective_tradeoffs',
  'recsys_dl_architectures', 'recsys_representation_learning',
  // System Design
  'two_tower', 'semantic_search', 'multitask_ranking', 'ml_platform',
  'ranking_systems', 'real_time_ml', 'sequential_recsys', 'embeddings_ann',
  'reranking_diversity', 'recsys_feedback_loops',
  // Production
  'feature_engineering_prod', 'feature_store', 'feature_store_traps',
  'late_arriving_data', 'data_quality', 'label_generation', 'pipelines',
  'model_registry', 'online_learning',
  // Monitoring
  'monitoring_taxonomy', 'data_drift_detection', 'concept_drift',
  'prediction_monitoring',
  // Data & Features
  'data_quality_audit', 'missing_value_handling', 'categorical_encoding',
  'feature_scaling', 'distribution_shift', 'data_versioning_and_pipelines',
  // Optimization
  'sgd_and_minibatch', 'momentum', 'adagrad_rmsprop', 'adam_adamw',
  'learning_rate_schedules',
  // Unsupervised
  'clustering_overview', 'kmeans', 'gmm', 'anomaly_detection',
  // Bandits
  'mab_problem', 'epsilon_greedy', 'ucb_algorithms', 'thompson_sampling',
  'contextual_bandits', 'bandits_in_recsys',
  // Evaluation (ML launches)
  'online_experimentation_ml',
]

const _S = new Set(TIER_S)
const _A = new Set(TIER_A)

// Everything not in S or A is B (the unbreakable-depth layer).
export function tierOf(moduleId) {
  return _S.has(moduleId) ? 'S' : _A.has(moduleId) ? 'A' : 'B'
}

// MSL amber theme: S = amber, A = indigo, B = grey. CSS vars fall back to hex.
export const TIER_STYLE = {
  S: { label: 'S', color: 'var(--prime)', bg: 'var(--prime-faint)', border: 'var(--prime)' },
  A: { label: 'A', color: '#818cf8', bg: 'rgba(99,102,241,0.14)', border: 'rgba(99,102,241,0.4)' },
  B: { label: 'B', color: '#8a8a94', bg: 'rgba(138,138,148,0.14)', border: 'rgba(138,138,148,0.35)' },
}
