import { useState } from 'react'

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
    correct: 2,
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
      { id: 'arima', label: 'ARIMA cannot model multiplicative seasonality' },
      { id: 'sparse', label: 'One training example of Black Friday is not enough to learn the pattern' },
      { id: 'lag', label: 'The model\'s lag window doesn\'t reach back 52 weeks' },
      { id: 'scale', label: 'The forecast model doesn\'t scale predictions for high-demand periods' },
    ],
    correct: 1,
    answer: 'One training example of Black Friday is statistically insufficient — the model has no reliable estimate of how extreme the holiday effect is. ARIMA\'s seasonal component learned from a single Black Friday is highly unstable. You need either: multiple years of holiday data, or an explicit holiday feature/regressor in the model.',
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
    correct: 3,
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
    correct: 2,
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
    correct: 0,
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
    correct: 0,
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
    correct: 3,
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
    correct: 1,
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
    accent: 'var(--ember)',
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
    accent: 'var(--sky)',
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
    accent: 'var(--violet)',
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
    accent: 'var(--mint)',
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
    accent: 'var(--rose)',
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
    accent: 'var(--gold)',
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
    accent: 'var(--mint)',
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
    accent: 'var(--sky)',
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
    accent: 'var(--violet)',
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
    accent: 'var(--ember)',
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
    accent: 'var(--rose)',
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
    accent: 'var(--gold)',
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
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '28px', fontWeight: 700, color: 'var(--sky)', marginBottom: '8px' }}>{score}/{FORECAST_FAILURES.length}</div>
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
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)' }}>{idx + 1} / {FORECAST_FAILURES.length}</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--sky)' }}>{score} correct</span>
      </div>
      <div className="card" style={{ padding: '22px 26px', borderLeft: '3px solid var(--rose)' }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '15px', color: 'var(--ink-hi)', marginBottom: '8px' }}>{s.title}</div>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0, marginBottom: '12px' }}>{s.context}</p>
        <div style={{ padding: '10px 14px', background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '8px' }}>
          <span style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>Clue: </span>
          <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.clue}</span>
        </div>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Root cause?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {s.options.map((opt, i) => {
          const isCorrect = i === correctIdx
          const isPicked = i === picked
          let border = 'var(--rim)', bg = 'transparent', color = 'var(--ink-mid)'
          if (revealed) {
            if (isCorrect) { border = 'rgba(52,211,153,0.5)'; bg = 'rgba(52,211,153,0.06)'; color = 'var(--mint)' }
            else if (isPicked) { border = 'rgba(244,63,94,0.5)'; bg = 'rgba(244,63,94,0.06)'; color = 'var(--rose)' }
          } else if (isPicked) { border = 'rgba(34,211,238,0.5)'; bg = 'rgba(34,211,238,0.06)'; color = 'var(--sky)' }
          return (
            <button key={i} onClick={() => pick(i)} disabled={revealed}
              style={{ padding: '13px 16px', borderRadius: '8px', border: `1px solid ${border}`, background: bg, color, fontFamily: "'Space Grotesk',sans-serif", fontSize: '13px', cursor: revealed ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
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
            <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.04)', borderRadius: '8px', border: '1px solid rgba(52,211,153,0.2)', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--mint)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fix: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.fix}</span>
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(240,165,0,0.04)', borderRadius: '8px', border: '1px solid rgba(240,165,0,0.15)' }}>
              <span style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>Lesson: </span>
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
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13px', color: selected === s.id ? s.accent : 'var(--ink-hi)', marginBottom: '4px' }}>{s.name}</div>
            <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
          </button>
        ))}
      </div>
      {selected && (() => {
        const s = STATIONARITY_SCENARIOS.find(x => x.id === selected)
        return (
          <div className="card" style={{ padding: '24px 28px', border: `1px solid ${s.accent}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '15px', color: s.accent }}>{s.name}</div>
              <span style={{ fontSize: '11px', padding: '2px 8px', background: s.accent + '15', color: s.accent, border: `1px solid ${s.accent}30`, borderRadius: '4px', fontFamily: "'JetBrains Mono',monospace" }}>{s.issue}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div style={{ padding: '14px', background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--mint)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Transform</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{s.transform}</p>
              </div>
              <div style={{ padding: '14px', background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--sky)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>How to check</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{s.check}</p>
              </div>
            </div>
            <div style={{ padding: '10px 14px', background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--rose)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>Don\'t: </span>
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
        {['Rule-based', 'Statistical', 'ML-based'].map((tier, i) => {
          const colors = ['var(--mint)', 'var(--sky)', 'var(--violet)']
          const bgs = ['rgba(52,211,153,0.04)', 'rgba(34,211,238,0.04)', 'rgba(99,102,241,0.04)']
          return (
            <div key={tier} style={{ padding: '14px', borderRadius: '10px', background: bgs[i], border: `1px solid ${colors[i]}25`, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '13px', color: colors[i] }}>{tier}</div>
              <div style={{ fontSize: '11px', color: 'var(--ink-low)', marginTop: '4px', fontFamily: "'JetBrains Mono',monospace" }}>{['fast, explicit', 'distributional', 'correlational'][i]}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ANOMALY_SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setSelected(selected === s.id ? null : s.id)}
            style={{ textAlign: 'left', padding: '16px 20px', borderRadius: '10px', border: `1px solid ${selected === s.id ? s.accent + '50' : 'var(--rim)'}`, background: selected === s.id ? s.accent + '06' : 'var(--depth)', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '13.5px', color: selected === s.id ? s.accent : 'var(--ink-hi)', marginBottom: '4px' }}>{s.title}</div>
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
              <span style={{ fontSize: '11px', padding: '3px 10px', background: s.accent + '18', color: s.accent, border: `1px solid ${s.accent}35`, borderRadius: '4px', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>Use: {tierLabels[s.correct]}</span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.75, margin: 0, marginBottom: '12px' }}>{s.answer}</p>
            <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--rim)' }}>
              <span style={{ fontSize: '10px', color: 'var(--gold)', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.07em' }}>When to add complexity: </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{s.when_to_upgrade}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Tab shell ─────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'failures', label: 'Forecast Failure Zoo', component: ForecastFailureZoo },
  { id: 'stationary', label: 'Stationarity & Transforms', component: StationaritySelector },
  { id: 'anomaly', label: 'Anomaly Detection Tiers', component: AnomalyDetectionTiers },
]

export default function TimeSeriesTab() {
  const [active, setActive] = useState('failures')
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? ForecastFailureZoo

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '24px', fontWeight: 700, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: 0 }}>Time Series</h2>
          <span style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(34,211,238,0.1)', color: 'var(--sky)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: '4px', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>judgment</span>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-low)', lineHeight: 1.65, maxWidth: '580px', margin: 0 }}>
          Why good forecasts fail in production — and how to diagnose it. Stationarity decisions, anomaly detection tier selection, and the failure modes that look fine in testing but break in the field.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`}>
            {m.label}
          </button>
        ))}
      </div>

      <ActiveModule />
    </div>
  )
}
