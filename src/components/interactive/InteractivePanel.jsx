import { lazy, Suspense } from 'react'
import { InteractiveShell } from './InteractiveShell'

const registry = {
  gradient_descent:      lazy(() => import('./GradientDescentDemo').then(m => ({ default: m.GradientDescentDemo }))),
  bayes_calculator:      lazy(() => import('./BayesCalculator').then(m => ({ default: m.BayesCalculator }))),
  distribution_viz:      lazy(() => import('./DistributionVisualizer').then(m => ({ default: m.DistributionVisualizer }))),
  activation_functions:  lazy(() => import('./ActivationFunctions').then(m => ({ default: m.ActivationFunctions }))),
  lr_schedule_viz:       lazy(() => import('./LRScheduleViz').then(m => ({ default: m.LRScheduleViz }))),
  roc_curve_viz:         lazy(() => import('./ROCCurveViz').then(m => ({ default: m.ROCCurveViz }))),
  kmeans_viz:            lazy(() => import('./KMeansViz').then(m => ({ default: m.KMeansViz }))),
  pca_viz:               lazy(() => import('./PCAViz').then(m => ({ default: m.PCAViz }))),
  attention_viz:         lazy(() => import('./AttentionViz').then(m => ({ default: m.AttentionViz }))),
  momentum_viz:          lazy(() => import('./MomentumViz').then(m => ({ default: m.MomentumViz }))),
  confusion_matrix_viz:  lazy(() => import('./ConfusionMatrixViz').then(m => ({ default: m.ConfusionMatrixViz }))),
  linear_regression_viz:      lazy(() => import('./LinearRegressionViz').then(m => ({ default: m.LinearRegressionViz }))),
  bias_variance_viz:          lazy(() => import('./BiasVarianceViz').then(m => ({ default: m.BiasVarianceViz }))),
  logistic_regression_viz:    lazy(() => import('./LogisticRegressionViz').then(m => ({ default: m.LogisticRegressionViz }))),
  regularization_viz:         lazy(() => import('./RegularizationViz').then(m => ({ default: m.RegularizationViz }))),
  cross_validation_viz:       lazy(() => import('./CrossValidationViz').then(m => ({ default: m.CrossValidationViz }))),
  information_theory_viz:     lazy(() => import('./InformationTheoryViz').then(m => ({ default: m.InformationTheoryViz }))),
  dbscan_viz:                 lazy(() => import('./DBSCANViz').then(m => ({ default: m.DBSCANViz }))),
  backprop_viz:               lazy(() => import('./BackpropViz').then(m => ({ default: m.BackpropViz }))),
  neural_net_geometry_viz:    lazy(() => import('./NeuralNetGeometryViz').then(m => ({ default: m.NeuralNetGeometryViz }))),
  eigen_geometry_viz:         lazy(() => import('./EigenGeometryViz').then(m => ({ default: m.EigenGeometryViz }))),
  donut_cup_viz:               lazy(() => import('./DonutCupViz').then(m => ({ default: m.DonutCupViz }))),
  ring_warp_viz:               lazy(() => import('./RingWarpViz').then(m => ({ default: m.RingWarpViz }))),
  transformer_block_viz:       lazy(() => import('./TransformerBlockViz').then(m => ({ default: m.TransformerBlockViz }))),
  ensemble_viz:               lazy(() => import('./EnsembleViz').then(m => ({ default: m.EnsembleViz }))),
  hypothesis_testing_viz:     lazy(() => import('./HypothesisTestingViz').then(m => ({ default: m.HypothesisTestingViz }))),
  calibration_curve_viz:      lazy(() => import('./CalibrationCurveViz').then(m => ({ default: m.CalibrationCurveViz }))),
  decision_tree_viz:       lazy(() => import('./DecisionTreeViz').then(m => ({ default: m.DecisionTreeViz }))),
  svm_viz:                 lazy(() => import('./SVMViz').then(m => ({ default: m.SVMViz }))),
  knn_viz:                 lazy(() => import('./KNNViz').then(m => ({ default: m.KNNViz }))),
  random_forest_viz:       lazy(() => import('./RandomForestViz').then(m => ({ default: m.RandomForestViz }))),
  class_imbalance_viz:     lazy(() => import('./ClassImbalanceViz').then(m => ({ default: m.ClassImbalanceViz }))),
  anomaly_detection_viz:   lazy(() => import('./AnomalyDetectionViz').then(m => ({ default: m.AnomalyDetectionViz }))),
  gmm_viz:                 lazy(() => import('./GMMViz').then(m => ({ default: m.GMMViz }))),
  batch_norm_viz:          lazy(() => import('./BatchNormViz').then(m => ({ default: m.BatchNormViz }))),
  rnn_viz:                 lazy(() => import('./RNNViz').then(m => ({ default: m.RNNViz }))),
  tsne_viz:                lazy(() => import('./TSNEViz').then(m => ({ default: m.TSNEViz }))),
  weight_init_viz:         lazy(() => import('./WeightInitViz').then(m => ({ default: m.WeightInitViz }))),
  thompson_sampling_viz:   lazy(() => import('./ThompsonSamplingViz').then(m => ({ default: m.ThompsonSamplingViz }))),
  gaussian_process_viz:    lazy(() => import('./GaussianProcessViz').then(m => ({ default: m.GaussianProcessViz }))),
  policy_gradient_viz:     lazy(() => import('./PolicyGradientViz').then(m => ({ default: m.PolicyGradientViz }))),
  gradient_boosting_viz:   lazy(() => import('./GradientBoostingViz').then(m => ({ default: m.GradientBoostingViz }))),
  loss_landscape_viz:      lazy(() => import('./LossLandscapeViz').then(m => ({ default: m.LossLandscapeViz }))),
  monte_carlo_viz:         lazy(() => import('./MonteCarloViz').then(m => ({ default: m.MonteCarloViz }))),
  ndcg_viz:                lazy(() => import('./NDCGViz').then(m => ({ default: m.NDCGViz }))),
  svd_viz:                 lazy(() => import('./SVDViz').then(m => ({ default: m.SVDViz }))),
  q_learning_viz:              lazy(() => import('./QLearningViz').then(m => ({ default: m.QLearningViz }))),
  time_series_decomp_viz:      lazy(() => import('./TimeSeriesDecompViz').then(m => ({ default: m.TimeSeriesDecompViz }))),
  exploration_exploitation_viz: lazy(() => import('./ExplorationExploitationViz').then(m => ({ default: m.ExplorationExploitationViz }))),
  hierarchical_clustering_viz: lazy(() => import('./HierarchicalClusteringViz').then(m => ({ default: m.HierarchicalClusteringViz }))),
  contrastive_viz:             lazy(() => import('./ContrastiveViz').then(m => ({ default: m.ContrastiveViz }))),
  gnn_message_passing_viz:     lazy(() => import('./GNNMessagePassingViz').then(m => ({ default: m.GNNMessagePassingViz }))),
  vae_viz:                     lazy(() => import('./VAEViz').then(m => ({ default: m.VAEViz }))),
  arima_viz:                   lazy(() => import('./ARIMAViz').then(m => ({ default: m.ARIMAViz }))),
  adam_viz:                    lazy(() => import('./AdamViz').then(m => ({ default: m.AdamViz }))),
  variational_inference_viz:   lazy(() => import('./VariationalInferenceViz').then(m => ({ default: m.VariationalInferenceViz }))),
  convex_optimization_viz:     lazy(() => import('./ConvexOptimizationViz').then(m => ({ default: m.ConvexOptimizationViz }))),
  stationarity_viz:            lazy(() => import('./StationarityViz').then(m => ({ default: m.StationarityViz }))),
  retrieval_funnel_viz:        lazy(() => import('./RetrievalFunnelViz').then(m => ({ default: m.RetrievalFunnelViz }))),
  latency_budget_viz:          lazy(() => import('./LatencyBudgetViz').then(m => ({ default: m.LatencyBudgetViz }))),
  value_model_mixer_viz:       lazy(() => import('./ValueModelMixerViz').then(m => ({ default: m.ValueModelMixerViz }))),
  dl_recsys_arch_viz:          lazy(() => import('./DLRecSysArchViz').then(m => ({ default: m.DLRecSysArchViz }))),
  negative_sampling_viz:       lazy(() => import('./NegativeSamplingViz').then(m => ({ default: m.NegativeSamplingViz }))),
  experiment_power_viz:        lazy(() => import('./ExperimentPowerViz').then(m => ({ default: m.ExperimentPowerViz }))),
  // Causal
  confounding_bias_viz:        lazy(() => import('./ConfoundingBiasViz').then(m => ({ default: m.ConfoundingBiasViz }))),
  parallel_trends_viz:         lazy(() => import('./ParallelTrendsViz').then(m => ({ default: m.ParallelTrendsViz }))),
  uplift_targeting_viz:        lazy(() => import('./UpliftTargetingViz').then(m => ({ default: m.UpliftTargetingViz }))),
  // Production
  train_serve_skew_viz:        lazy(() => import('./TrainServeSkewViz').then(m => ({ default: m.TrainServeSkewViz }))),
  point_in_time_join_viz:      lazy(() => import('./PointInTimeJoinViz').then(m => ({ default: m.PointInTimeJoinViz }))),
  label_delay_viz:             lazy(() => import('./LabelDelayViz').then(m => ({ default: m.LabelDelayViz }))),
  // Monitoring
  psi_calculator_viz:          lazy(() => import('./PSICalculatorViz').then(m => ({ default: m.PSICalculatorViz }))),
  drift_lag_viz:               lazy(() => import('./DriftLagViz').then(m => ({ default: m.DriftLagViz }))),
  alert_threshold_viz:         lazy(() => import('./AlertThresholdViz').then(m => ({ default: m.AlertThresholdViz }))),
  // Math & Stats
  mle_map_viz:                 lazy(() => import('./MleMapViz').then(m => ({ default: m.MleMapViz }))),
  // Probabilistic ML
  bayesian_updating_viz:       lazy(() => import('./BayesianUpdatingViz').then(m => ({ default: m.BayesianUpdatingViz }))),
  temperature_scaling_viz:     lazy(() => import('./TemperatureScalingViz').then(m => ({ default: m.TemperatureScalingViz }))),
  // Self-Supervised
  mask_ratio_viz:              lazy(() => import('./MaskRatioViz').then(m => ({ default: m.MaskRatioViz }))),
  // RL
  discount_horizon_viz:        lazy(() => import('./DiscountHorizonViz').then(m => ({ default: m.DiscountHorizonViz }))),
  ppo_clip_viz:                lazy(() => import('./PPOClipViz').then(m => ({ default: m.PPOClipViz }))),
  // Time Series
  walk_forward_viz:            lazy(() => import('./WalkForwardViz').then(m => ({ default: m.WalkForwardViz }))),
  // Graph ML
  neighbor_explosion_viz:      lazy(() => import('./NeighborExplosionViz').then(m => ({ default: m.NeighborExplosionViz }))),
  // Bandits
  non_stationary_window_viz:   lazy(() => import('./NonStationaryWindowViz').then(m => ({ default: m.NonStationaryWindowViz }))),
  ope_estimator_viz:           lazy(() => import('./OPEEstimatorViz').then(m => ({ default: m.OPEEstimatorViz }))),
  // Eval
  ablation_viz:                lazy(() => import('./AblationViz').then(m => ({ default: m.AblationViz }))),
  // Optimization
  adagrad_rmsprop_viz:         lazy(() => import('./AdaGradRMSPropViz').then(m => ({ default: m.AdaGradRMSPropViz }))),
  // Data & Features
  feature_scaling_viz:         lazy(() => import('./FeatureScalingViz').then(m => ({ default: m.FeatureScalingViz }))),
  leakage_split_viz:           lazy(() => import('./LeakageSplitViz').then(m => ({ default: m.LeakageSplitViz }))),
  // Deep Learning
  cnn_convolution_viz:         lazy(() => import('./CNNConvolutionViz').then(m => ({ default: m.CNNConvolutionViz }))),
}

export function InteractivePanel({ interactiveId }) {
  if (!interactiveId || !registry[interactiveId]) return null
  const Component = registry[interactiveId]
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderRadius: '10px',
      marginBottom: '1.25rem',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: '0.68rem',
        fontWeight: 700,
        color: 'var(--prime)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '0.55rem 1.25rem',
        borderBottom: '1px solid var(--rim)',
        background: 'var(--depth)',
      }}>
        Interactive
      </div>
      <div style={{ padding: '1.25rem 1.25rem 1rem' }}>
        <Suspense fallback={
          <div style={{ color: 'var(--ink-ghost)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
            Loading...
          </div>
        }>
          <InteractiveShell>
            <Component />
          </InteractiveShell>
        </Suspense>
      </div>
    </div>
  )
}
