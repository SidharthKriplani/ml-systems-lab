import { lazy, Suspense } from 'react'

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
  ensemble_viz:               lazy(() => import('./EnsembleViz').then(m => ({ default: m.EnsembleViz }))),
  hypothesis_testing_viz:     lazy(() => import('./HypothesisTestingViz').then(m => ({ default: m.HypothesisTestingViz }))),
  calibration_curve_viz:      lazy(() => import('./CalibrationCurveViz').then(m => ({ default: m.CalibrationCurveViz }))),
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
          <Component />
        </Suspense>
      </div>
    </div>
  )
}
