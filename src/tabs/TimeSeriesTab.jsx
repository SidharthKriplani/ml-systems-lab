import { useState } from 'react'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'
import FidelityBadge from '../components/FidelityBadge.jsx'

// ── Forecast Failure Zoo ──────────────────────────────────────────────────────
const FORECAST_FAILURES = [
  {
    id: 'leakage',
    title: 'Revenue Forecast Collapses at Month Boundary',
    context: 'Your revenue forecast was 97% accurate on the test set. In production, it started over-predicting by 30–40% at every month-end. The model uses 30-day rolling features, lag-1 revenue, and day-of-week dummies.',
    clue: 'Test set was carved by random 80/20 split from a 2-year dataset.',
    options: [
      { id: 'leak', label: 'Target leakage — future revenue leaked into rolling features during training' },
      { id: 'dist', label: 'Distribution shift — month-end revenue patterns changed after training' },
      { id: 'split', label: 'Wrong train/test split — random split allowed future data into training features' },
      { id: 'overfit', label: 'Overfitting — model memorized monthly patterns in training data' },
    ],
    correct: 'split',
    answer: 'The random 80/20 split is the root cause. With time-series data, a random split allows future observations into the training set. Your 30-day rolling feature at time T was computed using data that included future time points T+1, T+2, etc. — which were in the training set despite being temporally after the test point. In production, those future points don\'t exist, so the features look completely different.',
    fix: 'Always use a time-ordered split for time-series: train on first 80% of the timeline, test on last 20%. Never random-shuffle a time series before splitting.',
    lesson: 'Random splits are catastrophic for time-series. The 97% test accuracy was meaningless — you measured performance on future-contaminated features.',
  },
  {
    id: 'seasonality',
    title: 'Holiday Spike Completely Missed',
    context: 'Your demand forecast missed Black Friday by 4×. The model was trained on 18 months of data and uses ARIMA with weekly seasonality. It performs well 48 weeks of the year.',
    clue: 'Black Friday and Cyber Monday are in the 4 weeks it misses. Training data had only one prior Black Friday (last year).',
    options: [
      { id: 'arima', label: 'ARIMA cannot model multiplicative seasonality — use SARIMA instead' },
      { id: 'sparse', label: 'One training example of Black Friday is not enough to learn the pattern' },
      { id: 'lag', label: 'The model\'s seasonal lag window only covers 7 days, missing the 52-week annual cycle' },
      { id: 'horizon', label: 'ARIMA forecasts degrade beyond 4 weeks ahead — the holiday was too far in the future to predict' },
    ],
    correct: 'sparse',
    answer: 'One training example of Black Friday is statistically insufficient — the model has no reliable estimate of how extreme the holiday effect is. ARIMA\'s seasonal component learned from a single Black Friday is highly unstable. You need either: multiple years of holiday data, or an explicit holiday feature/regressor in the model. Option A is a real ARIMA limitation but not the primary cause — the model performs fine 48/52 weeks. Option C is a real problem worth fixing (a 52-week lag should be included) but even with it, one data point for the holiday effect is still statistically unreliable.',
    fix: 'Add a binary holiday indicator as an external regressor. Use Prophet or a SARIMAX model with explicit holiday effects. Or use a hybrid: statistical model + holiday multipliers from business knowledge.',
    lesson: 'Rare high-magnitude events (Black Friday, Super Bowl, product launches) are underrepresented in any training set. Model them explicitly with calendar features, not from seasonal patterns.',
  },
  {
    id: 'nonstationarity',
    title: 'Sales Forecast Drifts Upward Over 3 Months',
    context: 'Your sales forecast was accurate in January. By March, it was systematically underpredicting by 25%. The model was trained on 2 years of historical data. No model changes were made.',
    clue: 'The company launched an aggressive marketing campaign in February. User acquisition rate tripled.',
    options: [
      { id: 'drift', label: 'Concept drift — the data-generating process changed (new marketing campaign)' },
      { id: 'model', label: 'Model decay — the model parameters need re-estimation' },
      { id: 'feature', label: 'Missing feature — marketing spend is not in the model' },
      { id: 'all', label: 'All of the above — they describe the same root cause at different levels' },
    ],
    correct: 'all',
    answer: 'All three describe the same root cause: a regime change caused by the marketing campaign. This is concept drift (the relationship between features and target shifted), model decay (parameters trained on pre-campaign data are now biased), and a missing feature (marketing spend is a causal driver not in the model). The distinction matters for the fix: feature addition solves the problem permanently; retraining solves it temporarily until the next regime change.',
    fix: 'Add marketing spend as a feature. Retrain on recent data with the campaign period included. Implement drift monitoring (PSI on predictions vs actuals) to detect future regime changes earlier.',
    lesson: 'Forecast drift after a business change is almost always concept drift. The model learned patterns from a different regime. Monitoring prediction residuals with a control chart catches this 2–4 weeks earlier than waiting for stakeholder complaints.',
  },
  {
    id: 'granularity',
    title: 'Aggregate Forecast Accurate, SKU Forecast Useless',
    context: 'Your demand forecast at the total category level (all products) has 5% MAPE. But when you break down by individual SKU (3,000 products), MAPE is 85%. The supply chain team needs SKU-level forecasts for inventory planning.',
    clue: 'You trained one global model on all SKUs combined with SKU ID as a feature.',
    options: [
      { id: 'noise', label: 'Individual SKU time series are too noisy for any model to forecast accurately' },
      { id: 'sparse', label: 'SKU-level data is too sparse — most SKUs have intermittent demand' },
      { id: 'hierarchy', label: 'Hierarchical reconciliation is needed — aggregate forecasts don\'t decompose to SKU level correctly' },
      { id: 'feature', label: 'Missing SKU-level features — the model doesn\'t have enough information to differentiate SKUs' },
    ],
    correct: 'hierarchy',
    answer: 'This is a hierarchical forecasting problem. When you sum up individual SKU forecasts they don\'t equal the category total (which is accurate), and vice versa — disaggregating the category total doesn\'t give accurate SKU forecasts. You need hierarchical reconciliation methods (bottom-up, top-down, or optimal reconciliation via MinT/WLS) to ensure forecasts are coherent across all levels of the hierarchy.',
    fix: 'Use hierarchical forecasting frameworks (statsforecast HierarchicalForecast, Prophet with hierarchies). Apply optimal reconciliation (MinT) to make SKU forecasts sum to category forecasts while minimizing error at each level.',
    lesson: 'Aggregate accuracy masks SKU-level accuracy. These are separate problems. Good category-level forecasts are often achieved by cancellation of errors — individual SKU errors cancel when summed. At the SKU level, every error matters.',
  },
  {
    id: 'autocorrelation',
    title: 'Confidence Intervals Are Too Narrow — Actual Values Constantly Outside',
    context: 'Your forecast model produces 95% prediction intervals, but actual values fall outside those intervals 40% of the time (should be ~5%). The point forecast is reasonably accurate but the uncertainty estimates are badly underconfident.',
    clue: 'You computed prediction intervals assuming IID residuals: interval = forecast ± 1.96 * σ.',
    options: [
      { id: 'autocorr', label: 'Residuals are autocorrelated — naive σ underestimates true uncertainty' },
      { id: 'heavy', label: 'Residuals have heavy tails — normal distribution assumption wrong' },
      { id: 'model', label: 'The model is underfitting — residuals contain predictable signal' },
      { id: 'calibration', label: 'The σ estimate is too small — should use a larger multiplier than 1.96' },
    ],
    correct: 'autocorr',
    answer: 'Autocorrelated residuals are the root cause. IID (independent and identically distributed) residuals are an assumption for the ±1.96σ interval formula. When residuals are correlated across time — which is almost always true in time-series forecasts — the effective sample size is much smaller than the nominal sample size, and uncertainty is systematically underestimated. You need to account for serial correlation in your uncertainty model.',
    fix: 'Check autocorrelation with ACF/PACF of residuals. Use conformal prediction for valid intervals without distributional assumptions. Alternatively, use block bootstrap to compute intervals (preserves temporal structure). Or use a model that explicitly captures residual autocorrelation (ARIMA on residuals, GARCH for volatility).',
    lesson: 'Time-series residuals are almost never IID. Naive interval formulas that assume independence will always produce overconfident (too narrow) intervals. Correct uncertainty estimation requires explicitly modeling or testing for residual autocorrelation.',
  },
  {
    id: 'trend_break',
    title: 'Forecast Was Great for 18 Months, Then Broke Instantly',
    context: 'A product usage forecast that had been running reliably for 18 months suddenly became useless. Actual values dropped 60% below forecast in a single week and never recovered. No retraining, no model changes.',
    clue: 'The company discontinued a major product bundle that had been driving 60% of usage.',
    options: [
      { id: 'structural', label: 'Structural break — the data-generating process changed abruptly' },
      { id: 'anomaly', label: 'Temporary anomaly — should be treated as an outlier and excluded' },
      { id: 'retrain', label: 'Model needs retraining on more recent data' },
      { id: 'feature', label: 'Need to add product bundle as a feature' },
    ],
    correct: 'structural',
    answer: 'This is a structural break — a permanent, irreversible change in the data-generating process. The old time series ended; a new one began. Retraining on pre-break data will not help. The model needs to be rebuilt on post-break data. Structural breaks cannot be handled by standard forecasting models — they require intervention modeling, Bayesian change-point detection, or manual regime detection.',
    fix: 'Detect the break point (CUSUM test, Bayesian change-point detection). Discard pre-break training data entirely or use it only as a prior. Rebuild the model on post-break regime data. Add operational event features (product launches/discontinuations) as external regressors.',
    lesson: 'Structural breaks are not concept drift — they\'re permanent regime changes. Retraining on old data is useless or harmful. You need a process to detect and respond to structural breaks in near-real-time, not just monitor accuracy after the fact.',
  },
  {
    id: 'intermittent',
    title: 'Forecast Predicts 0 for High-Value Product Spike',
    context: 'A medical device has sales of 0 for 47 out of 52 weeks, then occasionally spikes to 200–500 units. Your model consistently predicts near-zero (correctly, most weeks) but completely misses the spikes that matter most to the business.',
    clue: 'Model is a standard ARIMA trained on weekly totals.',
    options: [
      { id: 'croston', label: 'Intermittent demand requires specialized methods (Croston\'s method, IMAPA)' },
      { id: 'class', label: 'This should be a two-stage model: classify spike vs no-spike, then predict magnitude' },
      { id: 'features', label: 'Need leading indicators (orders in pipeline, sales calls) as features' },
      { id: 'all', label: 'Intermittent demand is genuinely hard — some combination of all approaches is needed' },
    ],
    correct: 'all',
    answer: 'Intermittent demand is a genuinely hard problem with no single clean solution. Croston\'s method and its variants (SBA, TSB, IMAPA) are designed for this and outperform ARIMA. A two-stage classifier (will we sell anything this week?) + regressor (how much?) is often more useful for business decisions. Leading indicators (pipeline data, customer orders) are the most valuable signal if available. In practice, the best approach combines all three.',
    fix: 'Try Croston\'s method or IMAPA as baseline. If you have pipeline data (purchase orders, quotes), use those as leading features. Consider framing as: what\'s the probability of a spike this week, and if so, what\'s the expected magnitude? Service-level optimization (stock to meet 95% demand) is often more useful than point forecasting for intermittent series.',
    lesson: 'Standard forecasting methods assume reasonably continuous demand. Intermittent demand (many zeros, occasional spikes) violates these assumptions. The business rarely needs an accurate point forecast — they need to know how much safety stock to hold.',
  },
  {
    id: 'multivariate_lag',
    title: 'Adding More Features Made the Forecast Worse',
    context: 'You added 15 macroeconomic indicators as features to your sales forecast model, expecting improvement. RMSE on the test set increased by 20%. The model was a gradient boosted tree.',
    clue: 'The macroeconomic indicators are released monthly, but your forecast is weekly. You used the most recent monthly value for all 4 weeks of each month.',
    options: [
      { id: 'lookahead', label: 'Look-ahead bias — some macro features may not be released before the forecast date' },
      { id: 'lag', label: 'Feature timestamp mismatch — using a monthly feature as if it\'s contemporaneous introduces noise' },
      { id: 'curse', label: 'Curse of dimensionality — too many features relative to training samples' },
      { id: 'relevance', label: 'The macro features are not actually predictive of this specific product\'s sales' },
    ],
    correct: 'lag',
    answer: 'The fundamental problem is feature timestamp mismatch. Monthly macro indicators are typically released with a 4–6 week lag. If your model uses the "current month\'s" GDP growth but that figure won\'t be published until 6 weeks later, you have look-ahead bias. Even if the release timing is correct, treating a monthly value as weekly ignores the within-month variation and creates artificial precision in the feature.',
    fix: 'For all external features, check: when is this data actually available at prediction time? Use publication date, not reference date. Align macro features with their actual release schedule. If weekly macro data is unavailable, consider using daily/weekly proxies (stock indices, search trends) instead of lagged monthly series.',
    lesson: 'External features can introduce look-ahead bias if their availability isn\'t carefully audited. The question isn\'t "what does this feature measure?" but "when is this feature actually available in production?"',
  },
]

// ── Stationarity Selector ─────────────────────────────────────────────────────
const STATIONARITY_SCENARIOS = [
  {
    id: 'trend',
    name: 'Upward trend, no seasonality',
    desc: 'Time series steadily increases over time. Mean is not constant. Variance appears stable.',
    pattern: [10, 12, 13, 16, 18, 20, 22, 25, 27, 30, 32, 34],
    issue: 'Non-stationary (mean non-constant)',
    transform: 'First differencing: yt - yt-1. Makes the series stationary by removing the trend.',
    check: 'ADF test (Augmented Dickey-Fuller). p < 0.05 → stationary after differencing.',
    dont: 'Don\'t use log transform alone — it won\'t remove a linear trend, only stabilize variance.',
    accent: 'var(--prime)',
  },
  {
    id: 'seasonal',
    name: 'Clear weekly/yearly seasonality',
    desc: 'Same pattern repeats every week or year. Mean is relatively constant, but seasonal variation is large.',
    pattern: [20, 30, 28, 22, 18, 15, 20, 30, 29, 21, 19, 14],
    issue: 'Seasonally non-stationary',
    transform: 'Seasonal differencing: yt - yt-s where s is the seasonal period (7 for weekly, 52 for yearly). Or use STL decomposition + model the residuals.',
    check: 'KPSS test for seasonal stationarity. Visual ACF plot — spikes at lag s confirm seasonality.',
    dont: 'Don\'t ignore seasonality and model raw series — models will be confused by repeating patterns.',
    accent: 'var(--prime)',
  },
  {
    id: 'hetero',
    name: 'Growing variance with level',
    desc: 'As the series grows, the amplitude of fluctuations also grows. Variance is proportional to the mean.',
    pattern: [5, 7, 4, 9, 15, 10, 20, 28, 18, 35, 25, 42],
    issue: 'Heteroscedastic (non-constant variance)',
    transform: 'Log transform: log(yt). Stabilizes variance when it grows proportionally with the level. Box-Cox transformation for more general variance stabilization.',
    check: 'Plot the series and its absolute residuals over time. Increasing spread = heteroscedasticity.',
    dont: 'Don\'t use first differencing alone — it won\'t fix multiplicative variance growth. Log first, then difference if trend remains.',
    accent: 'var(--prime)',
  },
  {
    id: 'stationary',
    name: 'Stable mean and variance, no trend',
    desc: 'Series fluctuates around a constant mean. No trend, no seasonality. Variance appears constant.',
    pattern: [22, 18, 24, 21, 19, 23, 20, 22, 18, 21, 23, 19],
    issue: 'Already stationary',
    transform: 'No transformation needed. Fit ARMA/ARIMA(p,0,q) directly. Identify p and q from ACF/PACF.',
    check: 'ADF test p < 0.05, KPSS test p > 0.05 — both confirm stationarity.',
    dont: 'Don\'t over-transform. Differencing a stationary series introduces unnecessary autocorrelation and makes modeling harder.',
    accent: 'var(--prime)',
  },
  {
    id: 'structural',
    name: 'Sudden mean shift (structural break)',
    desc: 'Series is stable, then abruptly jumps to a new level and stays there. Two distinct regimes.',
    pattern: [20, 21, 19, 22, 20, 21, 38, 40, 39, 42, 40, 41],
    issue: 'Structural break — not classical non-stationarity',
    transform: 'Detect the break point (CUSUM test, Bayesian change-point detection). Fit separate models per regime, OR add a level shift indicator variable at the break point.',
    check: 'Plot the series and inspect visually. Chow test for break at a known date. CUSUM for unknown break dates.',
    dont: 'Don\'t just difference or detrend — differencing a level-shift series creates a spike at the break point and is wrong. Standard stationarity tests may incorrectly reject stationarity.',
    accent: 'var(--prime)',
  },
  {
    id: 'unit_root',
    name: 'Random walk (unit root)',
    desc: 'Series wanders with no clear trend but never mean-reverts. Each step is independent. Could go anywhere.',
    pattern: [20, 22, 20, 24, 22, 19, 23, 20, 18, 22, 25, 21],
    issue: 'Unit root — first-order integrated I(1)',
    transform: 'First differencing removes the unit root. After differencing, fit ARMA to the differenced series. This is the "I" in ARIMA(p,d,q) — d=1 means one round of differencing.',
    check: 'ADF test: if p > 0.05, fail to reject null of unit root. KPSS test: if p < 0.05, reject stationarity. Both tests together give stronger evidence.',
    dont: 'Don\'t forecast a random walk far into the future — forecast uncertainty grows linearly with horizon. Wide intervals are correct, not a model failure.',
    accent: 'var(--prime)',
  },
]

// ── Anomaly Detection Tradeoffs ───────────────────────────────────────────────
const ANOMALY_SCENARIOS = [
  {
    id: 'threshold',
    title: 'CPU usage on 200 production servers',
    context: 'Each server\'s CPU should stay below 80%. Any server above this threshold for >5 minutes needs to be paged.',
    correct: 'rule',
    options: [
      { id: 'rule', label: 'Rule-based threshold (CPU > 80% for 5 min)' },
      { id: 'stat', label: 'Statistical z-score over rolling window' },
      { id: 'ml', label: 'Isolation Forest on multivariate server metrics' },
    ],
    answer: 'Rule-based is correct here. The threshold is known, fixed, and operationally meaningful. A statistical or ML approach would add complexity with no benefit — and might miss the specific threshold the SLA is defined against. Use the right tool for the right job.',
    when_to_upgrade: 'Upgrade to statistical if the threshold varies by server type, time of day, or load profile. Upgrade to ML if correlations between metrics (CPU + memory + network) define anomalies better than any single metric.',
    accent: 'var(--prime)',
  },
  {
    id: 'stat',
    title: 'Revenue per hour across a marketplace',
    context: 'Revenue varies significantly by hour of day, day of week, and season. You want to detect anomalies (sudden drops or spikes) that aren\'t explained by normal patterns.',
    correct: 'stat',
    options: [
      { id: 'rule', label: 'Rule-based threshold (revenue < $X/hour)' },
      { id: 'stat', label: 'ARIMA/STL residual-based anomaly detection' },
      { id: 'ml', label: 'Deep autoencoder on hourly feature vectors' },
    ],
    answer: 'Statistical residual-based is the right tier. Fit an ARIMA or STL model to capture seasonal/trend patterns, then flag residuals beyond ±3σ as anomalies. This accounts for the known seasonality without requiring ML complexity. A fixed threshold ignores normal hourly variation and fires constantly during off-peak hours. An autoencoder is overkill for a univariate series with known seasonality.',
    when_to_upgrade: 'Upgrade to ML when you have multivariate correlated metrics where no single threshold or simple decomposition captures the anomaly (e.g., simultaneously low revenue + low order count + high cart abandonment).',
    accent: 'var(--prime)',
  },
  {
    id: 'ml',
    title: 'Manufacturing sensor array (50 sensors per machine)',
    context: '50 sensors per machine capturing temperature, pressure, vibration, flow rate. Normal operating range varies by machine type and production mode. Failures are characterized by subtle correlations breaking down across sensors.',
    correct: 'ml',
    options: [
      { id: 'rule', label: 'Rule-based threshold per sensor' },
      { id: 'stat', label: 'Univariate z-score per sensor independently' },
      { id: 'ml', label: 'Multivariate anomaly detection (Isolation Forest, Autoencoder)' },
    ],
    answer: 'ML-based multivariate anomaly detection is appropriate here. Failures in manufacturing equipment manifest as correlated deviations across multiple sensors — no single sensor exceeds its individual threshold, but the combination is anomalous. Isolation Forest or an LSTM autoencoder trained on normal operating data can detect these inter-sensor correlation breaks. Rule-based thresholds per sensor would miss the subtle cross-sensor patterns entirely.',
    when_to_upgrade: 'Upgrade to LSTM autoencoder if the anomaly patterns are temporal (sequences of correlated sensor values over time), not just instantaneous cross-sensor correlations.',
    accent: 'var(--prime)',
  },
  {
    id: 'label',
    title: 'Fraud transactions in payment processing',
    context: 'You have labeled historical fraud data. Fraudulent transactions represent 0.2% of traffic. You want to detect new fraud patterns as they emerge.',
    correct: 'hybrid',
    options: [
      { id: 'rule', label: 'Rules from fraud analysts (velocity checks, geo-velocity, device fingerprint)' },
      { id: 'stat', label: 'Statistical outlier detection on transaction features' },
      { id: 'hybrid', label: 'Hybrid: rules as hard filters + supervised model on top' },
    ],
    options_override: [
      { id: 'rule', label: 'Rules only' },
      { id: 'stat', label: 'Unsupervised anomaly detection (Isolation Forest)' },
      { id: 'hybrid', label: 'Supervised model trained on labeled fraud + rule-based pre-filters' },
    ],
    answer: 'Hybrid is correct. Fraud detection with labeled data is a supervised learning problem at its core — use those labels. But rule-based pre-filters from domain experts are fast, interpretable, and catch known fraud patterns without burning model capacity on obvious cases. The supervised model handles the subtle cases that rules miss. Pure unsupervised anomaly detection ignores your labeled data, which is almost always the wrong call when labels exist.',
    when_to_upgrade: 'Add unsupervised components specifically for detecting novel fraud patterns that differ from historical fraud — your supervised model won\'t generalize to genuinely new attack vectors.',
    accent: 'var(--prime)',
  },
  {
    id: 'sparse',
    title: 'API latency spikes for a low-traffic endpoint',
    context: 'An internal API endpoint gets ~50 requests per day. You want to detect latency anomalies without having 100,000s of normal samples to calibrate a statistical model.',
    correct: 'rule',
    options: [
      { id: 'rule', label: 'Rule-based: alert if p99 > 2× 30-day p99 baseline' },
      { id: 'stat', label: 'Statistical: rolling mean ± 3σ on daily aggregates' },
      { id: 'ml', label: 'ML-based: train on historical latency distribution' },
    ],
    answer: 'Rule-based is correct for sparse data. With only 50 requests/day, there\'s insufficient data to reliably fit a statistical model or train an ML model. A simple relative threshold (2× baseline) is robust, interpretable, and doesn\'t require enough data to estimate a distribution. Statistical methods need at minimum hundreds of observations per window to produce reliable σ estimates.',
    when_to_upgrade: 'Aggregate with similar endpoints and train a shared model once you have sufficient data volume. Or use Bayesian methods with strong priors for small-sample settings.',
    accent: 'var(--prime)',
  },
  {
    id: 'concept_drift',
    title: 'Detecting model prediction drift over time',
    context: 'You want to detect when your ML model\'s prediction distribution has shifted significantly from what it was at deployment — without waiting for labels.',
    correct: 'stat',
    options: [
      { id: 'rule', label: 'Rule: alert if mean prediction changes by >5% week-over-week' },
      { id: 'stat', label: 'Statistical: PSI / KS test on prediction score distribution' },
      { id: 'ml', label: 'Train a drift detection model on historical prediction distributions' },
    ],
    answer: 'PSI/KS statistical test is the correct approach. Prediction drift is fundamentally a distribution comparison problem — you\'re asking whether the distribution of scores today matches the training distribution. PSI (Population Stability Index) and KS test are purpose-built for this. A fixed threshold on mean prediction is too crude (distribution can shift in shape without changing mean). Training a separate drift detection model is circular and fragile.',
    when_to_upgrade: 'Use multivariate drift detection (MMD, Maximum Mean Discrepancy) when you want to detect drift across the joint feature distribution, not just the marginals or predictions.',
    accent: 'var(--prime)',
  },
]

// ── Components ────────────────────────────────────────────────────────────────
function ForecastFailureZoo() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const s = FORECAST_FAILURES[idx]

  function pick(i) { if (!revealed) setPicked(i) }

  function reveal() {
    if (picked === null) return
    setRevealed(true)
    const c = s.options.findIndex(o => o.id === s.correct)
    if (picked === c) setScore(sc => sc + 1)
  }

  function next() {
    if (idx < FORECAST_FAILURES.length - 1) {
      setIdx(i => i + 1); setPicked(null); setRevealed(false)
    } else { setDone(true) }
  }

  if (done) return (
    <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 700, color: 'var(--prime)', marginBottom: '8px' }}>{score}/{FORECAST_FAILURES.length}</div>
      <p style={{ fontSize: '14px', color: 'var(--ink-low)', marginBottom: '20px' }}>
        {score >= 6 ? 'Sharp time-series diagnostic instincts.' : score >= 4 ? 'Solid. The look-ahead bias and structural break scenarios trip most people.' : 'Focus on the train/test split scenarios — they account for most real production forecast failures.'}
      </p>
      <button className="btn-primary" onClick={() => { setIdx(0); setPicked(null); setRevealed(false); setScore(0); setDone(false) }}>Try again</button>
    </div>
  )

  const correctIdx = s.options.findIndex(o => o.id === s.correct)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {FORECAST_FAILURES.length}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--prime)' }}>{score} correct</span>
      </div>
      <div className="card" style={{ padding: '22px 26px', borderLeft: '3px solid var(--prime)' }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)', marginBottom: '8px' }}>{s.title}</div>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0, marginBottom: '12px' }}>{s.context}</p>
        <div style={{ padding: 'var(--card-pad-primary)', background: 'var(--prime-bg-light)', border: '1px solid var(--prime-glow)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Clue: </span>
          <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.clue}</span>
        </div>
      </div>
      <div className="section-eyebrow">Root cause?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {s.options.map((opt, i) => {
          const isCorrect = i === correctIdx
          const isPicked = i === picked
          let border = 'var(--rim)', bg = 'transparent', color = 'var(--ink-mid)'
          if (revealed) {
            if (isCorrect) { border = 'rgba(52,211,153,0.5)'; bg = 'rgba(52,211,153,0.13)'; color = 'var(--mint)' }
            else if (isPicked) { border = 'rgba(244,63,94,0.5)'; bg = 'rgba(244,63,94,0.13)'; color = 'var(--rose)' }
          } else if (isPicked) { border = 'rgba(240,165,0,0.5)'; bg = 'var(--prime-bg-light)'; color = 'var(--prime)' }
          return (
            <button key={i} onClick={() => pick(i)} disabled={revealed}
              style={{ padding: '13px 16px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontFamily: 'var(--font-sans)', fontSize: '13px', cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
              {opt.label}
            </button>
          )
        })}
      </div>
      {!revealed && <button className="btn-primary" onClick={reveal} disabled={picked === null}>Reveal</button>}
      {revealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ padding: '20px', border: `1px solid ${picked === correctIdx ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}` }}>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0, marginBottom: '12px' }}>{s.answer}</p>
            <div style={{ padding: 'var(--card-pad-primary)', background: 'rgba(52,211,153,0.10)', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.2)', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--mint)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fix: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.fix}</span>
            </div>
            <div style={{ padding: 'var(--card-pad-primary)', background: 'var(--prime-bg-light)', borderRadius: '8px', border: '1px solid var(--prime-glow)' }}>
              <span style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Lesson: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.lesson}</span>
            </div>
          </div>
          <button className="btn-primary" onClick={next}>{idx < FORECAST_FAILURES.length - 1 ? 'Next →' : 'See results'}</button>
        </div>
      )}
    </div>
  )
}

function StationaritySelector() {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0 }}>
        Before modeling a time series, you need to understand its stationarity properties. Select a pattern to see the correct diagnosis and transformation.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
        {STATIONARITY_SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setSelected(selected === s.id ? null : s.id)}
            style={{ textAlign: 'left', padding: '16px 18px', borderRadius: '10px', border: `1px solid ${selected === s.id ? s.accent + '50' : 'var(--rim)'}`, background: selected === s.id ? s.accent + '08' : 'var(--depth)', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: selected === s.id ? s.accent : 'var(--ink-hi)', marginBottom: '4px' }}>{s.name}</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
          </button>
        ))}
      </div>
      {selected && (() => {
        const s = STATIONARITY_SCENARIOS.find(x => x.id === selected)
        return (
          <div className="card" style={{ padding: '24px 28px', border: `1px solid ${s.accent}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: s.accent }}>{s.name}</div>
              <span style={{ fontSize: '11px', padding: '2px 8px', background: s.accent + '15', color: s.accent, border: `1px solid ${s.accent}30`, borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>{s.issue}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div style={{ padding: '14px', background: 'var(--prime-bg-light)', border: '1px solid var(--prime-glow)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Transform</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{s.transform}</p>
              </div>
              <div style={{ padding: '14px', background: 'var(--prime-bg-light)', border: '1px solid var(--prime-glow)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>How to check</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{s.check}</p>
              </div>
            </div>
            <div style={{ padding: 'var(--card-pad-primary)', background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--rose)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Don\'t: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.dont}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

function AnomalyDetectionTiers() {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0 }}>
        Anomaly detection has three tiers of complexity. The most common mistake is using ML when a rule or statistical test would work — adding complexity without adding accuracy. Click a scenario to see the right tier.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {['Rule-based', 'Statistical', 'ML-based'].map((tier, i) => (
          <div key={tier} style={{ padding: '14px', borderRadius: '10px', background: 'var(--prime-bg-light)', border: '1px solid var(--prime-glow)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--prime)' }}>{tier}</div>
            <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{['fast, explicit', 'distributional', 'correlational'][i]}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ANOMALY_SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setSelected(selected === s.id ? null : s.id)}
            style={{ textAlign: 'left', padding: '16px 20px', borderRadius: '10px', border: `1px solid ${selected === s.id ? s.accent + '50' : 'var(--rim)'}`, background: selected === s.id ? s.accent + '06' : 'var(--depth)', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13.5px', color: selected === s.id ? s.accent : 'var(--ink-hi)', marginBottom: '4px' }}>{s.title}</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.55, margin: 0 }}>{s.context}</p>
          </button>
        ))}
      </div>

      {selected && (() => {
        const s = ANOMALY_SCENARIOS.find(x => x.id === selected)
        const tierLabels = { rule: 'Rule-based', stat: 'Statistical', ml: 'ML-based', hybrid: 'Hybrid' }
        return (
          <div className="card" style={{ padding: '22px 26px', border: `1px solid ${s.accent}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', padding: '3px 10px', background: s.accent + '18', color: s.accent, border: `1px solid ${s.accent}35`, borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Use: {tierLabels[s.correct]}</span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0, marginBottom: '12px' }}>{s.answer}</p>
            <div style={{ padding: 'var(--card-pad-primary)', background: 'var(--card-tint)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.30)' }}>
              <span style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>When to add complexity: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.when_to_upgrade}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Shared AccordionMCQ ─────────────────────────────────────────────────────
function AccordionMCQ({ scenarios, accentColor = 'var(--prime)', storageKey = null }) {
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

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem('msl_score:' + storageKey, JSON.stringify(items))
      window.dispatchEvent(new CustomEvent('msl_score_updated'))
    }
  }, [items, storageKey])

  function getDiff(i, total) {
    const t = total / 3
    return i < t ? 'easy' : i < 2 * t ? 'medium' : 'hard'
  }

  function toggle(i) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, open: !it.open } : it))
  }
  function pick(i, opt) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, picked: opt, revealed: true } : it))
  }

  useEffect(() => {
    function handleKey(e) {
      const n = parseInt(e.key)
      if (n >= 1 && n <= 4) {
        const openIdx = items.findIndex(it => it.open && !it.revealed)
        if (openIdx !== -1 && n - 1 < scenarios[openIdx].options.length) pick(openIdx, n - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [items])

  const attempted = items.filter(it => it.revealed).length
  const correct   = items.filter((it, i) => it.revealed && it.picked === scenarios[i].answer).length
  const pct       = attempted === 0 ? 0 : Math.round((correct / attempted) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', background: 'linear-gradient(160deg, var(--card-tint) 0%, var(--depth) 40%)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 4px 14px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.11)' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{attempted}/{scenarios.length} attempted</span>
        {attempted > 0 && <span style={{ fontSize: '11px', color: pct >= 70 ? 'var(--mint)' : 'var(--ember)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{correct} correct ({pct}%)</span>}
        <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
          <div style={{ width: `${(attempted / scenarios.length) * 100}%`, height: '100%', background: accentColor, borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
      </div>

      {scenarios.map((sc, i) => { if (diffFilter !== 'all' && getDiff(i, scenarios.length) !== diffFilter) return null;
        const it = items[i]
        const isCorrect = it.revealed && it.picked === sc.answer
        return (
          <div key={sc.id} style={{ border: `1px solid ${it.open ? accentColor + '55' : 'rgba(255,255,255,0.15)'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
            <button onClick={() => toggle(i)} style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: it.open ? accentColor + '08' : 'var(--depth)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.15s' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '20px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', textAlign: 'left' }}>{sc.title}</span>
              {it.revealed && <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>{isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--ink-ghost)', transition: 'transform 0.2s', transform: it.open ? 'rotate(90deg)' : 'rotate(0deg)' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 2l4 3-4 3"/></svg></span>
            </button>

            {it.open && (
              <div className="accordion-enter" style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px 16px', background: 'var(--card-tint)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.30)', marginTop: '4px' }}>
                  {Array.isArray(sc.context) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {sc.context.map((line, li) => <p key={`ctx-${li}-${line.slice(0,10)}`} style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{line}</p>)}
                    </div>
                  ) : (
                    <p style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{sc.context}</p>
                  )}
                </div>

                <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', margin: 0 }}>{sc.question}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {sc.options.map((opt, oi) => {
                    const isPicked = it.picked === oi
                    const isAns    = sc.answer === oi
                    let bg = 'var(--depth)', border = 'var(--rim)', color = 'var(--ink-mid)'
                    if (it.revealed) {
                      if (isAns)          { bg = 'rgba(52,211,153,0.15)'; border = 'rgba(52,211,153,0.35)'; color = 'var(--ink-hi)' }
                      else if (isPicked)  { bg = 'rgba(239,68,68,0.15)';  border = 'rgba(239,68,68,0.35)'; color = 'var(--ink-mid)' }
                    } else if (isPicked)  { bg = accentColor + '10'; border = accentColor + '50'; color = 'var(--ink-hi)' }
                    return (
                      <button key={`opt-${sc.id}-${oi}`} disabled={it.revealed} onClick={() => pick(i, oi)}
                        style={{ textAlign: 'left', padding: 'var(--card-pad-primary)', borderRadius: '8px', background: bg, border: `1px solid ${border}`, cursor: it.revealed ? 'default' : 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start', transition: 'all 0.12s' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '14px', paddingTop: '2px' }}>{['A','B','C','D'][oi]}</span>
                        <span style={{ fontSize: '13px', color, lineHeight: 1.5 }}>{opt}</span>
                        {it.revealed && isAns && <span style={{ marginLeft: 'auto', color: 'var(--mint)', fontSize: '12px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
                      </button>
                    )
                  })}
                </div>

                {it.revealed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(52,211,153,0.11)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--mint)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>Diagnosis</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.diagnosis}</p>
                    </div>
                    <div style={{ padding: '12px 16px', background: 'var(--prime-bg-light)', border: '1px solid var(--prime-glow)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>Production fix</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.fix}</p>
                    </div>
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

// ─── TS Model Selector ────────────────────────────────────────────────────────
const TS_MODEL_SCENARIOS = [
  {
    id: 'ts_m1',
    title: 'Short stationary series, no seasonality',
    context: 'You have 3 years of weekly sales data for a single product. The series is stationary (ADF p < 0.05). No obvious seasonal pattern. You need next-12-week point forecasts.',
    question: 'Which model family is the best starting point?',
    options: [
      'Prophet — it handles stationarity and autocorrelation automatically without manual parameter selection.',
      'ARIMA — stationary data with no seasonality is a natural ARIMA use case.',
      'LSTM — deep learning will capture non-linear autocorrelation structures better at this horizon.',
      'Exponential smoothing (ETS) — it models autocorrelated stationary series with fewer parameters than ARIMA.',
    ],
    answer: 1,
    diagnosis: 'ARIMA is purpose-built for stationary univariate series. Box-Jenkins ACF/PACF analysis gives you the p,d,q parameters directly. Prophet adds trend and seasonality components you don\'t need here — it will overfit to noise. LSTMs need far more data (thousands of timesteps) to outperform ARIMA. ETS (option D) is a legitimate alternative: simple ETS (SES) handles stationary series and works well, but ARIMA is preferred because ACF/PACF analysis directly diagnoses the autocorrelation structure rather than treating it as a hyperparameter.',
    fix: 'Fit ARIMA(p,0,q): d=0 because series is already stationary. Use auto_arima (pmdarima) or plot ACF/PACF to select p and q. Validate with expanding-window cross-validation, not random split. Baseline: ARIMA(1,0,1) as starting point.',
  },
  {
    id: 'ts_m2',
    title: 'Strong weekly + yearly seasonality',
    context: 'E-commerce site visits: clear weekly cycle (weekend spikes) and yearly holiday seasonality. You have 2 years of daily data (730 points). The series is non-stationary (upward trend).',
    question: 'Which model handles multi-period seasonality most naturally?',
    options: [
      'SARIMA with seasonal differencing.',
      'Prophet — built for multiple seasonality components + trend with additive/multiplicative modes.',
      'Exponential smoothing (Holt-Winters) — designed for trend + seasonality.',
      'ARIMA with Fourier terms as external regressors.',
    ],
    answer: 1,
    diagnosis: 'Prophet\'s core strength is decomposable multi-period seasonality + trend changes. It handles weekly + yearly seasonality automatically with Fourier series. SARIMA can handle one seasonal period cleanly but two seasonalities require hacks. Holt-Winters supports one seasonal period. 730 points is enough for Prophet\'s Bayesian inference.',
    fix: 'from prophet import Prophet; m = Prophet(seasonality_mode="multiplicative"); m.fit(df). Add holiday effects with m.add_country_holidays(). Use multiplicative mode if the amplitude of seasonal swings grows with trend level. Evaluate with cross_validation() from prophet.diagnostics.',
  },
  {
    id: 'ts_m3',
    title: 'Many short related series',
    context: 'You need to forecast demand for 10,000 SKUs across 50 stores. Each SKU-store combination has 18 months of weekly data (78 points). You have shared product features (category, price, weight) and store features (region, size).',
    question: 'What is the most scalable forecasting approach?',
    options: [
      'Fit 500,000 individual ARIMA models — one per SKU-store combination.',
      'Fit a global LightGBM model on all series simultaneously, using lag features + cross-series features.',
      'Fit a Prophet model per SKU (ignore store dimension to reduce models).',
      'Use a single LSTM trained on all series with one sequence per SKU-store.',
    ],
    answer: 1,
    diagnosis: '500k individual ARIMA models are computationally infeasible and statistically poor on 78 points each. A global ML model (LightGBM, XGBoost) trained across all series learns cross-series patterns and leverages product/store features. 78-point series → strong reliance on tabular lag features. Tree models consistently outperform individual deep learning models at this scale with this data volume.',
    fix: 'Create a flat feature table: one row per (sku, store, week) with lag_1, lag_2, lag_4, lag_52 (if available), rolling_mean_4w, rolling_std_4w, plus static product/store features and calendar features. Train LightGBM with time-based train/val split. Tune with Optuna. This approach generalises better than fitting 500k separate models and scales trivially.',
  },
  {
    id: 'ts_m4',
    title: 'Long sequence, non-linear patterns',
    context: 'You are forecasting energy consumption at 5-minute intervals over 3 years (315,000 timesteps). The series has complex non-linear patterns, multiple driver variables (temperature, humidity, day_of_week), and regime changes (COVID lockdowns).',
    question: 'When does a neural time series model beat classical methods here?',
    options: [
      'When the series is long enough that gradient descent converges reliably — 315k points is more than sufficient.',
      'When the sample size is large (100k+), multivariate inputs are available, and non-linear interactions between drivers are expected.',
      'When the series has regime changes — neural models handle changepoints better than ARIMA because they learn from context.',
      'Neural models are not appropriate here because the series is non-stationary and needs differencing first.',
    ],
    answer: 1,
    diagnosis: 'The three conditions for neural TS models to win: (1) large training data (100k+ points), (2) multivariate inputs with non-linear interactions, (3) complex patterns that parametric models cannot represent. All three hold here. 315k timesteps is sufficient for TFT or N-BEATS training. Option A confuses sample size with the correct justification — data volume is necessary but not sufficient; the advantage comes from multi-variate non-linear modeling. Option C is a common practitioner belief but is wrong: regime changes are hard for all model families, and neural models don\'t handle them better without explicit indicators.',
    fix: 'Temporal Fusion Transformer (TFT) or N-BEATS for this use case. TFT natively handles multi-horizon forecasting with multi-variate inputs and produces interpretable attention weights. Add lockdown as a binary covariate. Use PyTorch Forecasting library. Validate on the last 6 months only — not a random split.',
  },
  {
    id: 'ts_m5',
    title: 'Intermittent demand',
    context: 'A spare parts retailer forecasts demand for 5,000 low-velocity SKUs. Many SKUs sell 0 units in most weeks — demand is sporadic and lumpy. Traditional MAPE blows up on zero-demand weeks.',
    question: 'Which approach is designed for intermittent/lumpy demand?',
    options: [
      'Prophet with logistic growth and floor = 0 to prevent negative forecasts.',
      'Croston\'s method — separates non-zero demand size from inter-demand interval.',
      'LightGBM with Tweedie loss objective — handles zero-inflated count-like distributions natively.',
      'SARIMA with seasonal differencing to remove the periodic zero-demand pattern.',
    ],
    answer: 1,
    diagnosis: 'Intermittent demand violates ARIMA and Prophet assumptions (both assume relatively continuous observations). Croston\'s method models the non-zero demand level and the average inter-demand interval separately — purpose-built for this distribution. Option C (LightGBM + Tweedie) is a legitimate production approach and can outperform Croston at scale — it earns credit as a strong alternative. Option A (Prophet with floor) is a common team decision but Prophet\'s Fourier-based seasonality is poorly suited to series that are zero 90% of the time.',
    fix: 'Use Croston\'s method or its improved variant ADIDA (Aggregate-Disaggregate Intermittent Demand Approach). In Python: statsforecast library has CrostonClassic and CrostonOptimized. Evaluate with Mean Absolute Scaled Error (MASE) which handles zeros, not MAPE. For the ML approach: Tweedie regression (LightGBM with tweedie objective) handles zero-inflated continuous approximations of count data.',
  },
  {
    id: 'ts_m6',
    title: 'Very short series cold start',
    context: 'A new product launched 6 weeks ago. You need a week-8 forecast. You have 6 data points and no historical precedent for this exact product. You do have 3 years of data from 200 similar existing products.',
    question: 'How do you forecast for a new series with minimal history?',
    options: [
      'ARIMA requires at least 2× the seasonal period — 6 points is too short. Refuse to forecast.',
      'Use cross-series learning: train a global model on the 200 similar products and apply it to the new product at inference time.',
      'Exponential smoothing with a very low smoothing parameter to avoid overfitting to 6 points.',
      'Naive seasonal: copy the pattern from the most similar existing product.',
    ],
    answer: 1,
    diagnosis: 'With 6 data points, any univariate model overfits trivially. The correct approach exploits the cross-series signal from 200 similar products. A global model trained on all historical data applies immediately to new products — it has learned the typical demand trajectory for this product category even if this specific product is new.',
    fix: 'Train a global LightGBM or N-BEATS model on the 200 existing products. At inference, pass the 6 available lags as features. The model generalises from similar product patterns. Add product attributes (category, price tier, launch campaign size) as static covariates — these drive early-lifecycle behavior. Monitor: compare week 7–10 actuals vs forecast to detect if this product is an outlier from the cluster.',
  },
]

function TSModelSelector() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13.5px', color: 'var(--ink-low)', lineHeight: 1.65, maxWidth: '600px', margin: 0 }}>
        ARIMA vs Prophet vs ML vs Neural — the right model depends on data volume, seasonality structure, and series count. Each scenario tests model selection judgment.
      </p>
      <AccordionMCQ scenarios={TS_MODEL_SCENARIOS} accentColor="var(--prime)" storageKey="ts_model" />
    </div>
  )
}

// ─── TS Feature Engineering ───────────────────────────────────────────────────
const TS_FEAT_SCENARIOS = [
  {
    id: 'ts_f1',
    title: 'Lag feature selection',
    context: 'You are building a tabular ML forecasting model for weekly retail sales. You have 3 years of data. The series has a strong 52-week annual cycle.',
    question: 'Which lag features are most important to include?',
    options: [
      'lag_1, lag_2, lag_3 only — recent history is always the best predictor.',
      'lag_1, lag_2, lag_4, lag_52 — recent lags plus the seasonal lag to capture annual patterns.',
      'All lags from 1 to 52 — let the model select which matter.',
      'lag_52 only — the same week last year is the best predictor for seasonal data.',
    ],
    answer: 1,
    diagnosis: 'Using only lag_1/2/3 misses the seasonal signal entirely. Including all 52 lags causes the curse of dimensionality, multicollinearity, and training instability. lag_52 alone ignores recent short-term dynamics. The right set: lag_1 (momentum), lag_2 (2-week autocorrelation), lag_4 (monthly cycle), lag_52 (same-week-last-year seasonal anchor).',
    fix: 'Start with lag_1, lag_2, lag_4, lag_13 (quarterly), lag_52. Add rolling statistics: rolling_mean_4w, rolling_std_4w, rolling_mean_52w. Use feature importance from your model to prune. For SHAP: the relative importance of lag_52 vs lag_1 tells you whether the series is more seasonally driven or momentum-driven.',
  },
  {
    id: 'ts_f2',
    title: 'Cyclical calendar encoding',
    context: 'You are adding "day of week" (0–6) as a feature to a daily demand model. You encode it as a raw integer (0 = Monday, 6 = Sunday). Your LightGBM model performs poorly on weekends.',
    question: 'What is wrong with raw integer encoding for cyclical features?',
    options: [
      'LightGBM cannot use integer features — use one-hot encoding.',
      'Raw integer encoding implies Sunday (6) is far from Monday (0) — but they are adjacent in the weekly cycle. Use sin/cos encoding.',
      'The feature needs to be standardised to [0, 1] before use.',
      'Day of week is not useful — remove it and use a weekend binary flag instead.',
    ],
    answer: 1,
    diagnosis: 'Raw integer encoding imposes a false linear order: day 6 (Sunday) is numerically far from day 0 (Monday) even though they are 1 day apart in the weekly cycle. Tree models handle this via splits, but linear components cannot represent the cyclic proximity. Sin/cos encoding maps the cycle onto a unit circle — preserving the true distance between days.',
    fix: 'day_sin = sin(2π × day_of_week / 7); day_cos = cos(2π × day_of_week / 7). Same for month_of_year (/12), hour_of_day (/24). These two features together encode any cyclic position correctly. For tree models, one-hot encoding of day_of_week is also fine (7 binary features); for neural/linear models, sin/cos is strongly preferred.',
  },
  {
    id: 'ts_f3',
    title: 'Target leakage via future information',
    context: 'A data scientist adds "sales for the same store, next week" as a feature to predict demand for the current week. The model achieves 99% accuracy in offline eval. In production, accuracy drops to 55%.',
    question: 'What caused the offline-production gap?',
    options: [
      'The model overfit — add dropout or L2 regularisation.',
      '"Next week\'s sales" is a future value — it is not available at prediction time. This is feature leakage.',
      'Production data has a different distribution than the training data.',
      'The 99% accuracy was computed on the test set, which the model also trained on.',
    ],
    answer: 1,
    diagnosis: 'This is a textbook example of temporal leakage: a feature value from the future (next week) was used to predict the present week. During offline eval, the future value exists in the dataset so the model uses it directly — trivially accurate. At serving time, next week has not happened yet, so the feature is absent or zero, and the model fails.',
    fix: 'Enforce strict point-in-time joins: all features used to predict week T must be computed from data available at T-1 or earlier. Audit every feature with the question: "Could I have computed this value at prediction time?" Use the lag feature pattern: if you want "same store performance", use lag_1 (last week\'s sales), not next week\'s. In your data pipeline, use as-of joins.',
  },
  {
    id: 'ts_f4',
    title: 'Rolling statistics window choice',
    context: 'You add rolling_mean_1w, rolling_mean_4w, rolling_mean_13w, rolling_mean_52w as features. Feature importance shows rolling_mean_1w has 80% of the importance weight. Your model is overfit and generalises poorly.',
    question: 'What is likely happening and how do you fix it?',
    options: [
      'rolling_mean_1w has high importance because it is the best feature — keep it and remove the others.',
      'rolling_mean_1w is highly correlated with the target (it is last week\'s average) — high importance signals that the model is overfitting to recent noise rather than learning the seasonal pattern.',
      'The rolling windows need to be standardised before use.',
      'Use an exponentially weighted mean instead of a rolling mean.',
    ],
    answer: 1,
    diagnosis: 'When rolling_mean_1w dominates importance, the model is essentially predicting "next week ≈ this week" — which is often true in the short run but fails to capture seasonal and structural patterns. The model appears accurate in walk-forward validation but degrades for multi-step horizons. High importance on very short windows is a sign of horizon mismatch.',
    fix: 'For horizon h (forecasting h steps ahead), the shortest lag you can use without leakage is lag_h. If forecasting 4 weeks out, rolling_mean_1w uses information from 1 week ago — valid, but ensure the window doesn\'t overlap with the forecast horizon. Balance importance: if rolling_mean_1w dominates, consider dropping it and forcing the model to rely on seasonal lags. Or use a minimum horizon-aware lookback: rolling_mean_4w as the shortest window.',
  },
  {
    id: 'ts_f5',
    title: 'External regressor for known future events',
    context: 'You are forecasting hourly electricity demand. You know the weather forecast for the next 48 hours (temperature, humidity). You want to include this as a feature in your model.',
    question: 'How do you correctly include known-future external regressors in a forecasting model?',
    options: [
      'Do not include weather — it creates a dependency on forecast accuracy that degrades your model.',
      'Include future weather values directly as features at forecast time — these are known-future regressors, not leakage.',
      'Include only historical weather (lagged by 24h) to avoid any future information.',
      'Create a separate model that predicts weather, then chain the two models together.',
    ],
    answer: 1,
    diagnosis: 'Known-future regressors are a different category from leakage: the weather forecast IS available at prediction time (you are using the forecast, not the actual future). This is the correct pattern for exogenous variables with external forecasts — the information is genuinely available when you need to make your prediction.',
    fix: 'In ARIMAX, Prophet, and TFT, add weather as a "future covariate" or exogenous variable. Key: document explicitly that your model depends on weather forecast quality. Degrade analysis: what happens if the weather forecast is off by 5°C? Run sensitivity analysis. For neural models (TFT): weather is a "known future input" — the architecture explicitly separates these from historical-only features.',
  },
  {
    id: 'ts_f6',
    title: 'Cross-series features for global model',
    context: 'You are training a global model across 5,000 SKUs. Each SKU is a different time series. You want to add features that encode each SKU\'s identity so the model can learn SKU-specific patterns.',
    question: 'What is the best way to encode SKU identity in a global ML forecasting model?',
    options: [
      'Use the SKU string as a label-encoded integer — the model will learn the mapping.',
      'Learn SKU embeddings: either pre-trained from product metadata, or learned end-to-end as a trainable embedding layer alongside the forecasting objective.',
      'One-hot encode all 5,000 SKUs — this gives the model full expressivity per SKU.',
      'Add SKU category as a single categorical feature and ignore SKU-level identity.',
    ],
    answer: 1,
    diagnosis: 'Label encoding (integer ID) forces the model to treat SKU identity as a linear feature — SKU 1000 is implied to be halfway between SKU 500 and 1500. One-hot encoding of 5,000 SKUs creates 5,000 sparse features — the model sees very few training examples per SKU feature. Embedding representations learn a dense, low-dimensional representation of each SKU\'s demand pattern.',
    fix: 'Option 1: pre-train SKU embeddings on product metadata (category, price tier, weight) using word2vec or a small neural network, then use as static features. Option 2: learn embeddings end-to-end in a neural forecasting model (TFT or N-BEATS with static covariate input). Option 3: for tree models, use target encoding of SKU ID computed with out-of-fold means to avoid leakage — this is a lightweight approximation of embeddings.',
  },
]

function TSFeatureEngineering() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13.5px', color: 'var(--ink-low)', lineHeight: 1.65, maxWidth: '600px', margin: 0 }}>
        Lag selection, cyclical encoding, leakage prevention, and cross-series embeddings — the feature engineering decisions that separate good TS models from broken ones.
      </p>
      <AccordionMCQ scenarios={TS_FEAT_SCENARIOS} accentColor="var(--prime)" storageKey="ts_features" />
    </div>
  )
}

// ── Tab shell ─────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'failures',   label: 'Forecast Failure Zoo',     component: ForecastFailureZoo },
  { id: 'stationary', label: 'Stationarity & Transforms', component: StationaritySelector },
  { id: 'anomaly',    label: 'Anomaly Detection Tiers',   component: AnomalyDetectionTiers },
  { id: 'model',      label: 'TS Model Selector',         component: TSModelSelector },
  { id: 'features',   label: 'TS Feature Engineering',    component: TSFeatureEngineering },
]

// ── BookmarkButton ─────────────────────────────────────────────────────────────
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
      background: saved ? 'var(--prime-bg-light)' : 'transparent',
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

export default function TimeSeriesTab({ onNavigate }) {
  const [active, setActive] = useState('failures')
  const [, forceUpdate] = useState(0)
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? ForecastFailureZoo
  const activeModuleData = MODULES.find(m => m.id === active)

  useEffect(() => {
    const goto = localStorage.getItem('msl_goto_module')
    if (goto) {
      const found = MODULES.find(m => m.id === goto)
      if (found) {
        setActive(goto)
        localStorage.removeItem('msl_goto_module')
      }
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: 0 }}>Time Series</h2>
          <span style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--prime-bg-light)', color: 'var(--prime)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>judgment</span>
          <FidelityBadge tier="conceptual" />
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-low)', lineHeight: 1.65, maxWidth: '580px', margin: 0 }}>
          Why good forecasts fail in production — and how to diagnose it. Stationarity decisions, anomaly detection tier selection, and the failure modes that look fine in testing but break in the field.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button onClick={() => setActive(m.id)} className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`} style={{ paddingRight: '8px' }}>{m.label}</button>
            <button onClick={(e) => { e.stopPropagation(); toggleBookmark('timeseries', m.id, m.label); forceUpdate(n => n+1) }}
              title={isBookmarked('timeseries', m.id) ? 'Remove bookmark' : 'Bookmark module'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '12px', color: isBookmarked('timeseries', m.id) ? 'var(--prime)' : 'var(--ink-ghost)', lineHeight: 1 }}>
              {isBookmarked('timeseries', m.id) ? <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 0.5h8a1 1 0 011 1v11.25l-5-2.917-5 2.917V1.5a1 1 0 011-1z"/></svg> : <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M2 1h8a.5.5 0 01.5.5v11L6 9.75 1.5 12.5V1.5A.5.5 0 012 1z"/></svg>}
            </button>
          </div>
        ))}
      </div>

      {activeModuleData && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <BookmarkButton tabId="ts" moduleId={active} label={activeModuleData.label} />
        </div>
      )}

      <div key={active} className="tab-enter"><ActiveModule /></div>

      {onNavigate && (
        <div style={{ background: 'var(--prime-bg-light)', border: '1px solid var(--prime-glow)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>The Forecast Failure Zoo: Six Silent Killers of Time Series Models</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}
    </div>
  )
}
