export const TIME_SERIES_MODULES = [
  {
    id: 'stationarity',
    interactiveId: 'stationarity_viz',
    title: 'Stationarity & Differencing',
    subtitle: 'Unit root tests, spurious regression, integration order, cointegration',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['stationarity', 'unit-root', 'differencing', 'cointegration', 'ADF', 'KPSS'],
    summary: `Regress two independent random walks against each other and you'll get R² near 1 and t-statistics in double digits — not because they're related, but because both are trending. That's spurious regression, and it invalidates every downstream conclusion. It's the reason stationarity matters: non-stationary series have growing variance and shifting means, so the statistical tests that assume constant moments produce completely unreliable results. The ADF and KPSS tests tell you whether you have a unit root; differencing removes trends; seasonal differencing removes periodicity. The flip side of non-stationarity is cointegration — two non-stationary series can share a long-run equilibrium whose spread is stationary, and error correction models exploit that structure rather than discarding it.`,
    keyPoints: [
      `**Two random walks regressed against each other will look strongly related — R² > 0.5, |t| > 2 — with zero true relationship.** The tell is Durbin-Watson near 0: residuals are nearly perfectly autocorrelated, which is the signature of a spurious regression between two non-stationary series. OLS standard errors assume independent residuals; when they're serially correlated, standard errors are severely underestimated and all inference collapses. This is not a small-sample problem — it gets worse with more data.`,
      `**Weak (covariance) stationarity requires three properties: constant mean E[Y_t] = μ, constant variance Var(Y_t) = σ², and autocovariance Cov(Y_t, Y_{t-k}) = γ(k) that depends only on lag k, not on t.** A random walk

$Y_t = Y_{t-1} + ε_t violates all three — variance grows as tσ², so the series wanders without bound. O$

ne difference gives ΔY_t = ε_t, which is stationary. The I(d) notation means d differences are needed to achieve stationarity.`,
      `**ADF test has H₀: unit root present, H₁: stationary.** Includes lags of ΔY_t to purge residual autocorrelation. Critical values are non-standard (more negative than t-distribution). The test has low power in small samples and often fails to reject even when the series is trend-stationary. KPSS flips the null: H₀ is stationary, H₁ is unit root. Running both together resolves ambiguity: ADF rejects and KPSS doesn't reject → stationarity. ADF doesn't reject and KPSS rejects → unit root. Both rejecting → possible fractional integration or local non-stationarity.`,
      `**Trend-stationary and difference-stationary series look similar in plots but require different treatment.** A trend-stationary series (Y_t = α + βt + ε_t) should be detrended — regress out the linear trend and model residuals. A difference-stationary series needs differencing. The error matters: detrending a difference-stationary series leaves residuals that still have a unit root. Differencing a trend-stationary series removes real signal and induces unnecessary MA structure.`,
      `**Cointegration is the productive flip side of non-stationarity.** Two I(1) series X_t and Y_t are cointegrated when there exists β such that Y_t − βX_t is I(0). The spread is stationary even though the individual series are not. Economically, the series share a long-run equilibrium. The Engle-Granger test runs ADF on the residuals of a regression of Y on X. The Johansen trace/max-eigenvalue test handles multiple cointegrating vectors simultaneously.`,
      `**Error Correction Model: ΔY_t = α(Y_{t-1} − βX_{t-1}) + short-run dynamics.** The error-correction term α(Y_{t-1} − βX_{t-1}) pulls the system back toward equilibrium; α < 0 ensures mean reversion. If you difference cointegrated series without including the error-correction term, you throw away the long-run relationship. The short-run model (first differences) tells you about dynamics; the error-correction term tells you about the equilibrium.`,
      `**Stationarity is not a one-time check at model training time.** A series that was stationary from 2015-2019 can develop a unit root after a structural shift (new competitor, regulatory change, macroeconomic shock). Rolling ADF tests with a sliding window, CUSUM tests on residuals, or online variance monitoring catch this. A single ADF on historical data at training time is insufficient for a deployed model — stationarity must be monitored continuously in production.`,
    ],
    checkQuestions: [
      {
        q: `You regress daily revenue on daily temperature for 3 years and get R² = 0.72 with t-stat = 18. The DW statistic is 0.12. What is wrong and how do you fix it?`,
        options: [
          `A) The model is correctly specified; DW near 0 confirms no autocorrelation, so the high R² reflects genuine co-movement between revenue and temperature.`,
          `B) DW ≈ 0.12 indicates near-perfect residual autocorrelation — a hallmark of spurious regression. Test both series with ADF/KPSS; if both I(1) test for cointegration; if not cointegrated work in first differences (ΔRevenue on ΔTemperature); if cointegrated use an ECM.`,
          `C) The issue is heteroskedasticity, not autocorrelation. Apply White robust standard errors and the regression remains valid.`,
          `D) DW near 0 means the model is over-differenced. Re-fit without differencing and the spurious correlation disappears.`,
        ],
        answer: `B`,
      },
      {
        q: `ADF says your series is stationary but KPSS also rejects its null. What does this mean and what do you do?`,
        options: [
          `A) Both tests rejecting confirms the series is definitely stationary — ADF is the stronger test, so difference once and proceed.`,
          `B) The conflicting signals are a data quality issue; collect more observations and re-run both tests before drawing any conclusion.`,
          `C) KPSS rejecting can be ignored when ADF rejects stationarity; KPSS has lower power and its null rejection is unreliable in small samples.`,
          `D) Both rejecting suggests fractional integration I(d) with 0 < d < 1, local stationarity with structural breaks, or too-short a sample. Test for structural breaks (Zivot-Andrews), try ARFIMA, and do not blindly difference.`,
        ],
        answer: `D`,
      },
      {
        q: `You have two financial time series (stock price and its futures contract price) that are both I(1). How do you decide whether to model them separately in first differences or jointly?`,
        options: [
          `A) Test for cointegration using the Johansen trace test. Spot and futures are theoretically cointegrated by no-arbitrage; if one cointegrating vector is found, use a VECM — modelling each in first differences ignores the long-run equilibrium and discards valuable information.`,
          `B) Always model them separately in first differences; cointegration is a theoretical concept that rarely holds in practice with real financial data.`,
          `C) Use the Engle-Granger two-step on the levels; if the residuals are I(0) then cointegration is confirmed and you can proceed with OLS on levels directly.`,
          `D) Run cross-correlation between the two series; if it is above 0.9 then model jointly, otherwise use first differences for both series independently.`,
        ],
        answer: `A`,
      },
      {
        q: `Your revenue series passes ADF stationarity test. You fit an ARIMA(1,0,1) and the residuals look clean. Six months later the model performance degrades sharply. What likely happened and how do you detect it earlier?`,
        options: [
          `A) The ARIMA order was mis-specified at training time; re-running auto-ARIMA on the full dataset including the degraded period will identify the correct orders.`,
          `B) The model likely overfit during training; reduce the AR and MA orders to avoid capturing noise, and performance will recover.`,
          `C) A structural break changed the underlying data-generating process. Detect it earlier with rolling ADF over a 90-180 day window, CUSUM/MOSUM tests on rolling mean/variance, and a CUSUM chart on forecast errors.`,
          `D) Stationarity guarantees model stability indefinitely; the degradation is caused by an upstream data pipeline issue rather than a modelling problem.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Stationarity is not a box to check once at model training time — spurious regression is the immediate consequence of skipping it, and structural breaks mean a series that was stationary at training time may not be stationary in production. The most important inference to demonstrate is knowing when two non-stationary series should be modelled jointly (cointegration + ECM preserves the long-run relationship) versus separately in first differences (when no cointegrating vector exists and the long-run relationship is meaningless).`,
  },

  {
    id: 'arima_family',
    interactiveId: 'arima_viz',
    title: 'ARIMA Family',
    subtitle: 'AR/MA intuition, ACF/PACF identification, SARIMA, Box-Jenkins, structural break failure',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['ARIMA', 'SARIMA', 'ACF', 'PACF', 'Box-Jenkins', 'autoregression'],
    summary: `Monthly airline passenger counts tell a story that breaks every naive forecasting approach. The Box-Jenkins 1976 dataset shows a clear upward trend plus strong yearly seasonality — summer peaks, winter troughs — with amplitude that grows as the level grows. A straight regression on time misses the seasonality. A seasonal average ignores the trend. Feed the raw series into a model without preprocessing and the non-stationary mean will invalidate every coefficient estimate.

ARIMA is built to handle exactly this. The "I" — integrated — is the trend fix: difference the series once (y_t − y_{t-1}) and the linear trend disappears, leaving a stationary series the AR and MA components can model. AR(p) captures autocorrelation through the series' own past: the current value is a weighted sum of the last p observations. MA(q) captures dependence on past shock terms. Together they describe how today's value relates to yesterday's observations and yesterday's surprises.

For the airline data, the seasonal structure at period s=12 requires SARIMA: seasonal AR(P) at lags 12, 24, 36; seasonal differencing at lag 12 to remove the repeating yearly cycle; seasonal MA(Q) for dependence on past seasonal shocks. The SARIMA(p,d,q)(P,D,Q)[12] notation stacks non-seasonal and seasonal layers into one model.

**NOT this.** "ARIMA is outdated and should always be replaced by ML methods." ARIMA is interpretable, requires no GPU, handles small datasets (n < 200) well, and its parameters have direct statistical interpretations: φ₁ is the momentum coefficient, θ₁ is the shock decay rate. For monthly aggregate forecasting with fewer than 5 years of data, ARIMA is often competitive with or better than neural methods. The real limitation is the Box-Jenkins identification workflow: ACF/PACF cutoffs appear cleanly only in simulated data. Real series mix AR and MA contributions, making the cutoffs ambiguous. The workflow is iterative — tentatively identify orders, fit, diagnose residuals, revise — and it breaks at scale. At 50,000 SKUs, per-series ARIMA identification is impractical regardless of accuracy.`,
    keyPoints: [
      `**AR(p) captures momentum: Y_t = φ₁Y_{t-1} + ... + φ_pY_{t-p} + ε_t.**\n\nThe current value is a weighted sum of p lagged values plus noise. Positive φ₁ captures persistence — values tend to continue in the same direction. Negative φ₁ captures oscillation. The "I" in ARIMA handles non-stationarity by differencing d times before fitting: one difference removes a linear trend, so ARIMA(p,1,q) is the appropriate model for a trending series. Over-differencing (d=2) is a common error — if d=1 residuals still show a unit root, suspect a structural break, not more differencing.`,
      `**ACF/PACF give a starting point, not a recipe: AR(p) shows PACF cutoff at lag p; MA(q) shows ACF cutoff at lag q; ARMA shows both decaying.**\n\nIn practice these clean cutoffs appear only in simulated data. Real series mix AR and MA contributions, so textbook cutoffs are rarely visible. Treat ACF/PACF as a prior for candidate orders, then compare ARIMA(1,1,0), ARIMA(0,1,1), ARIMA(1,1,1) by AIC. The Ljung-Box test on residuals must pass at all lags including seasonal ones — a p-value of 0.42 overall can mask a lag-12 spike that signals missing seasonality.`,
      `**ARIMA's structural break failure is its most consequential limitation in production.**\n\nThe model assumes p, d, q are constant over time. A regime change — competitor entry, regulatory shift, macroeconomic shock — violates this. After a break, the model absorbs the shift as a long-lag autocorrelation effect, producing biased forecasts indefinitely. CUSUM detects gradual drift; Zivot-Andrews ADF tests for an unknown break date. The correct response is to re-identify ARIMA orders on post-break data, not to add more lags to the existing model.`,
    ],
    interactivePrompt: `Before you touch the controls: the airline passenger series has both a trend and seasonal spikes that grow with the level. Which component of ARIMA handles the trend, and what does differencing once actually do to the series?`,
    checkQuestions: [
      {
        q: `Your ACF shows significant spikes at lags 1, 2, 3 that decay, and your PACF shows a single significant spike at lag 1 that cuts off. What model do you fit and why?`,
        options: [
          `A) MA(3) — the three significant ACF spikes indicate three MA terms; the PACF pattern is consistent with MA order selection.`,
          `B) AR(1) — PACF cuts off at lag 1 and ACF decays, the textbook signature of an AR(1) process. Fit ARIMA(1,0,0) and check residuals with Ljung-Box; if autocorrelation remains at lag 2+ try AR(2) or ARMA.`,
          `C) ARMA(1,1) — whenever both ACF and PACF show non-zero values at early lags, a mixed model is required regardless of the decay pattern.`,
          `D) ARIMA(3,1,0) — differencing is needed because three lags in the ACF are significant, indicating a unit root with AR structure of order 3.`,
        ],
        answer: `B`,
      },
      {
        q: `You fit ARIMA(2,1,2) to a monthly sales series. The Ljung-Box test on residuals passes (p=0.42), but the ACF of residuals shows a significant spike at lag 12. What does this mean and what is the fix?`,
        options: [
          `A) A passing Ljung-Box with p=0.42 is sufficient; a single spike at lag 12 in the ACF is within normal sampling variation and can be ignored.`,
          `B) The significant lag-12 spike indicates the differencing order d should be increased to 2 to remove the remaining autocorrelation structure.`,
          `C) The model has overfit at short lags, causing the residual energy to concentrate at lag 12; reduce to ARIMA(1,1,1) to redistribute the autocorrelation evenly.`,
          `D) The Ljung-Box passing overall does not guarantee all lags are clean. The lag-12 spike indicates uncaptured seasonal pattern; upgrade to SARIMA(2,1,2)(1,0,1)[12] or add seasonal differencing D=1.`,
        ],
        answer: `D`,
      },
      {
        q: `Your e-commerce platform has 50,000 product SKUs. You need daily sales forecasts for each. Why is per-SKU ARIMA unrealistic and what do you use instead?`,
        options: [
          `A) Per-SKU ARIMA is unrealistic because order selection is expensive for 50k series, many SKUs have intermittent demand ARIMA cannot handle, cold-start is unsolvable for new SKUs, and frequent structural breaks occur. Better: global neural models (N-BEATS, LightGBM with lag features), Croston\`s for intermittent demand, and hierarchical forecasting with MinT reconciliation.`,
          `B) Per-SKU ARIMA is unrealistic only because of the computational cost; once parallelised across a cluster, ARIMA remains the most accurate method for individual SKU-level forecasting.`,
          `C) Per-SKU ARIMA fails primarily because ARIMA requires at least 5 years of history per series; for SKUs with less data, use a simple seasonal naive forecast instead.`,
          `D) Per-SKU ARIMA is unrealistic due to the cold-start problem alone; the fix is to pre-train a single ARIMA model on aggregate data and then fine-tune per SKU.`,
        ],
        answer: `A`,
      },
      {
        q: `You fit ARIMA(0,1,1) and ARIMA(1,1,0) to the same series. Both pass diagnostics. The MA model has lower AIC. A colleague argues the AR model is more interpretable for business stakeholders. How do you decide?`,
        options: [
          `A) Always choose the model with lower AIC regardless of stakeholder considerations; interpretability arguments are not a valid statistical reason to prefer a higher-AIC model.`,
          `B) Prefer the AR model unconditionally — AR models are always more interpretable because lagged values are observable, while MA error terms are latent and cannot be explained to non-statisticians.`,
          `C) ARIMA(0,1,1) with θ≈1 approximates exponential smoothing; ARIMA(1,1,0) with φ≈1 approximates a random walk with momentum. Use lower AIC (MA model) for forecast-only use, AR for stakeholder comms; verify on out-of-sample holdout; if forecasts are nearly identical deploy the simpler one.`,
          `D) Fit both models simultaneously as a mixture, weighting them equally; this avoids the model-selection problem and produces better calibrated prediction intervals than either model alone.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `ARIMA's "I" solves non-stationarity by differencing — one difference removes a linear trend, enabling the AR and MA components to model the stationary residuals. ACF/PACF cutoffs are a starting point, not a recipe: textbook-clean patterns only appear in simulated data, so Box-Jenkins is always iterative via residual diagnostics. The most consequential failure mode is the structural break: after a regime change the model absorbs the shift as a spurious long-lag effect, producing biased forecasts indefinitely — the fix is re-identifying orders on post-break data, not adding more lags.`,
  },

  {
    id: 'seasonality_decomposition',
    interactiveId: 'time_series_decomp_viz',
    title: 'Seasonality & Decomposition',
    subtitle: 'STL, additive vs multiplicative, X-13-ARIMA-SEATS, Fourier terms, irregular seasonality',
    difficulty: 'intermediate',
    estimatedMin: 40,
    tags: ['seasonality', 'STL', 'decomposition', 'Fourier', 'X-13', 'additive', 'multiplicative'],
    summary: `A time series with both trend and seasonality is hard to model directly: the trend makes the series non-stationary, and the seasonal component repeats at a fixed period but with amplitude that may scale with the trend level. Modelling the combined series forces a single model to represent structure operating at two different timescales simultaneously. Decomposition separates these into three components — trend, seasonal, residual — so each can be modelled, forecast, and analysed independently. Choosing additive versus multiplicative decomposition is not aesthetic: it determines whether the seasonal component is a fixed absolute number or a fraction of the current level. Get it wrong and every downstream forecast inherits systematic bias. STL dominates classical decomposition for most ML work because it lets the seasonal component evolve and is robust to outliers. But STL's biggest limitation is also its most common production failure: it encodes seasonality at a fixed calendar period and cannot handle events that shift across the calendar, like Black Friday.`,
    keyPoints: [
      `**Additive decomposition: Y_t = T_t + S_t + R_t.** The seasonal component is a fixed absolute number regardless of the trend level — a store that always sells exactly 200 extra units in December. Multiplicative: Y_t = T_t × S_t × R_t. The seasonal component is a fraction of the current level — 20% higher December sales, so the absolute lift grows as the business grows. Diagnosing which applies: if seasonal amplitude stays constant as the trend grows, use additive; if it scales with the level, use multiplicative or log-transform first.`,
      `**Classical decomposition extracts trend via centred moving average, computes seasonal indices as per-period averages, and residualises.** Two fatal flaws: the seasonal component is forced identical across all years (it cannot evolve), and trend estimates are missing at the endpoints (the first and last s/2 observations). For business time series where seasonal patterns shift over years, classical decomposition produces a systematically biased seasonal estimate for recent data — the period you most care about.`,
      `**STL (Seasonal and Trend decomposition using Loess): iterative smoother alternating inner seasonal loop and outer trend loop.** Key parameters are period (s), trend window (t.window), and seasonal window (s.window). s.window="periodic" forces the seasonal component identical across all years — correct only when the seasonal driver is physically fixed (daylight hours). A finite s.window allows the seasonal component to evolve over time. The robust option downweights outliers in LOESS fitting so anomalies don't corrupt the seasonal estimate.`,
      `**Multiple seasonalities require iterative STL (MSTL).** Hourly data with both daily and weekly patterns: decompose at weekly period first, then decompose the remainder at the daily period. Single STL cannot handle two simultaneous seasonal frequencies. This is a common failure mode for high-frequency data (hourly electricity, real-time traffic) where practitioners apply a single STL and wonder why the residuals still have structure.`,
      `**Fourier terms replace seasonal dummy variables with K pairs of sin/cos: sin(2πkt/s) and cos(2πkt/s) for k=1,...,K.** The advantage: works for non-integer periods like annual seasonality in daily data (period = 365.25 days — no integer period exists for dummies) and very long periods where dummies are impractical. K controls seasonal shape complexity — K=s/2 is equivalent to dummies. Fourier terms are fitted as OLS regression coefficients, making them computationally cheap and easy to include in any regression model.`,
      `**Calendar-shifting events are where STL breaks down completely.** Black Friday falls on the fourth Thursday of November — it shifts by up to six days from year to year. In STL with a fixed 52-week period, that spike smears across 3-4 weeks in the seasonal component and the peak estimate is attenuated by a factor of ~3-6. Explicit holiday calendars (Prophet, X-13) or event features (days_to_black_friday, is_black_friday_week) are the correct tool. STL applied to series with calendar-shifting events will systematically underforecast the peak.`,
      `**X-13-ARIMA-SEATS is what national statistics agencies use for official economic data.** It runs ARIMA before decomposition to handle outliers, trading day effects (months have different numbers of weekdays each year), and holiday effects explicitly. More rigorous than STL; appropriate when you need auditable, reproducible decompositions on economic data. For most ML applications, STL with explicit holiday features is simpler and sufficient.`,
      `**A common pipeline: decompose → model trend, seasonal, and residual components separately → recompose.** The residual after removing trend and seasonality is close to stationary, making it much easier to model with ARIMA or a neural forecaster. Forecasting on the residual alone often outperforms forecasting on the raw series because the model no longer has to simultaneously capture multiple structure types at different timescales.`,
    ],
    checkQuestions: [
      {
        q: `You apply STL decomposition to weekly website traffic and the seasonal component shows the amplitude doubling over 3 years while the trend also doubles. Is additive or multiplicative STL more appropriate and how does this change your downstream modelling?`,
        options: [
          `A) Additive STL is always preferable because it is more interpretable; an evolving seasonal component in additive STL simply requires a wider s.window to capture the growth correctly.`,
          `B) Multiplicative STL is appropriate because the seasonal amplitude scales with trend. Apply STL to log(Y_t), forecast log trend and log seasonal separately, then exponentiate; prediction intervals computed on the log scale will be asymmetric on the original scale.`,
          `C) Neither additive nor multiplicative STL is appropriate; use classical decomposition instead, which explicitly handles proportional seasonal components without requiring a log transformation.`,
          `D) The doubling seasonal amplitude is irrelevant to the choice; select additive or multiplicative based solely on whether the residuals are heteroskedastic after decomposition.`,
        ],
        answer: `B`,
      },
      {
        q: `You are building a real-time anomaly detector for server error rates, which show strong daily and weekly patterns. STL fails because STL requires the series to be longer than two periods and the seasonal window must be odd. For 10-minute data with both daily (144 points/period) and weekly (1008 points/period) seasonality, what is your approach?`,
        options: [
          `A) Apply a single STL at the dominant (weekly) period and ignore the daily seasonality; residual daily patterns will average out and not materially affect anomaly detection.`,
          `B) Use MSTL: decompose at weekly period (1008) first, then at daily period (144). Alternatively, use Fourier terms in an online regression updated on a rolling 4-week window; use the residual as the anomaly signal.`,
          `C) Aggregate the 10-minute data to hourly before applying STL; the coarser granularity eliminates the dual-seasonality problem and makes standard STL applicable.`,
          `D) Apply two independent STL models — one at the daily period and one at the weekly period — then subtract both seasonal components from the raw series before thresholding.`,
        ],
        answer: `D`,
      },
      {
        q: `A stakeholder asks why your Black Friday sales forecast is consistently off by 20%. Your model uses STL decomposition with a fixed 52-week seasonal pattern. What is the root cause?`,
        options: [
          `A) Black Friday shifts by up to ±3 business days year to year. STL with a fixed 52-week period smears the spike across 3-4 weeks, attenuating the peak estimate. Fix: explicit holiday indicator features, Prophet or X-13 holiday effects, or a days_to_black_friday feature in a gradient-boosted model.`,
          `B) The 20% error is due to insufficient training data; STL needs at least 5 years of history to correctly identify the Black Friday spike within a 52-week seasonal period.`,
          `C) The issue is the additive vs multiplicative choice; switching to multiplicative STL will correctly capture the Black Friday peak because holiday sales scale proportionally with overall revenue level.`,
          `D) The fixed 52-week seasonal pattern is correctly specified; the forecast error is caused by year-over-year revenue trend growth that STL cannot extrapolate — add a linear trend regression on top of the decomposition.`,
        ],
        answer: `A`,
      },
      {
        q: `What does it mean to set s.window="periodic" in STL, when is it correct to do so, and what is the risk of always using it?`,
        options: [
          `A) s.window="periodic" increases the number of LOESS smoothing iterations, making the seasonal estimate more statistically robust; the risk of overuse is longer computation time.`,
          `B) s.window="periodic" forces the seasonal component to evolve rapidly year-over-year; the risk is that it overfits recent seasonal patterns and performs poorly in the trend extrapolation step.`,
          `C) s.window="periodic" forces the seasonal component to be identical across all years, appropriate when the driver is physically fixed (e.g., daylight hours). The risk: if seasonal patterns evolve due to behaviour shifts, the fixed template misfits recent years leaving systematic residuals. Detect by plotting seasonal component by year.`,
          `D) s.window="periodic" disables the outer robustness loop in STL, making the decomposition faster but more sensitive to outliers corrupting the seasonal estimate.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `The practical insight that separates strong candidates is knowing when STL fails and what to do instead. STL handles smoothly evolving seasonality at a fixed calendar period but is blind to calendar-shifting events (Black Friday, Ramadan, Easter) because it assumes the seasonal spike falls at the same calendar week each year. The diagnostic — "seasonal component smeared across 3-4 weeks, peak attenuated" — identifies STL failure, and the fix is explicit holiday features or event indicators rather than encoding the event in the seasonal component.`,
  },

  {
    id: 'prophet_framework',
    title: 'Prophet',
    subtitle: 'Piecewise growth, Fourier seasonality, changepoints, uncertainty, failure modes',
    difficulty: 'intermediate',
    estimatedMin: 40,
    tags: ['prophet', 'changepoints', 'Fourier', 'piecewise-linear', 'uncertainty', 'holiday'],
    summary: `Most time series forecasting tools require deep domain expertise to configure — choosing ARIMA orders, specifying seasonal structure, diagnosing residuals. Prophet was built to solve a specific operational problem at Meta: let analysts without time series expertise produce sensible forecasts for thousands of business KPIs without model-by-model tuning. It achieves this by encoding strong structural assumptions: piecewise linear growth with sparse changepoints, Fourier seasonality at weekly and annual periods, and an explicit holiday calendar. These assumptions work well for typical business metrics (daily active users, weekly revenue, annual seasonal sales). The mistake is treating Prophet as a general-purpose forecaster. Feed it a volatile financial series, a mean-reverting series, or anything where recent trend doesn't extrapolate linearly, and it will produce confidently wrong forecasts. Knowing the failure modes matters more than knowing the feature list.`,
    keyPoints: [
      `**Prophet is a structural additive regression model: y(t) = g(t) + s(t) + h(t) + ε_t. g(t) is piecewise linear (or logistic) growth, s(t) is Fourier seasonality, h(t) is holiday effects.** Each component is a separate, interpretable regression. This makes Prophet easy to inspect and debug — you can plot each component and check whether the trend extrapolation, seasonal pattern, and holiday effects make domain-knowledge sense.`,
      `**Piecewise linear growth: rate changes δ_j at potential changepoints are regularised with a Laplace prior, so most changepoints have δ ≈ 0 — sparsity by design.** Changepoints are placed automatically across the first 80% of training data. This means the last 20% of training data has few changepoints — recent trend changes go undetected. changepoint_prior_scale (default 0.05) controls how aggressively trend changes are allowed; it is the single most consequential hyperparameter. Too large → overfits recent trend at the forecast boundary; too small → sluggish response to genuine structural breaks.`,
      `**Seasonality is modelled via Fourier series: S(t) = Σ [aₙ cos(2πnt/P) + bₙ sin(2πnt/P)] with N=10 harmonics for yearly (P=365.25) and N=3 for weekly (P=7).** These coefficients are fitted by OLS as part of the additive regression. Not spectral estimation — just linear regression on engineered features. This is why Prophet works natively with non-integer periods like 365.25, where seasonal dummies are impractical.`,
      `**changepoint_prior_scale is the most consequential hyperparameter because it controls trend extrapolation.** Too large: the model fits every recent zigzag as a changepoint and extrapolates the last slope aggressively — produces trend explosions at the forecast boundary. Too small: the model ignores genuine structural breaks and forecasts with a stale trend. Don't leave it at the default without running cross-validation and checking whether the trend extrapolation at the forecast horizon makes domain-knowledge sense.`,
      `**Uncertainty in Prophet comes in two forms.** MAP estimation (the default) is fast but prediction intervals capture only observation noise and future changepoint sampling uncertainty — they do not propagate parameter uncertainty. MCMC (mcmc_samples > 0) gives full posterior uncertainty and properly calibrated intervals. For business forecasts where interval width drives decisions (inventory safety stock, budget reserves), MAP intervals are systematically too narrow. Always check empirical coverage via cross-validation before reporting intervals.`,
      `**Prophet's failure modes are predictable from its structural assumptions.** Mean-reverting series (stock spreads, some financial metrics): Prophet assumes piecewise linear trend; a mean-reverting series has no long-run trend and the piecewise linear model will produce upward-drifting forecasts. Multiplicative seasonality: supported via seasonality_mode="multiplicative" but only as a global mode — all seasons are multiplicative or none are. External shocks: add_regressor is too rigid for series dominated by unpredictable events. Less than 1-2 years of history: annual seasonality identification degrades significantly.`,
      `**add_regressor adds exogenous features as linear terms in the regression.** The critical production trap: the regressor must be available at forecast time. If you add observed weather as a regressor during training and backtesting, the model appears accurate — but in production, you'd need weather forecasts for the forecast horizon. Substituting forecast weather for actual weather introduces regressor error that inflates MAPE. Always backtest with the same information available at deployment time.`,
      `**Prophet's cross-validation: prophet.diagnostics.cross_validation() with initial (training window), period (spacing between cutoffs), and horizon.** This is rolling-origin evaluation, not random train-test split. performance_metrics() summarises MAPE/RMSE/MAE by forecast horizon — essential for understanding where accuracy degrades. Empirical interval coverage from this output tells you whether MAP or MCMC intervals are needed.`,
    ],
    checkQuestions: [
      {
        q: `Your Prophet model produces a forecast for next quarter that shows a sharp trend acceleration starting exactly where your training data ends. What is the likely cause and how do you fix it?`,
        options: [
          `A) The Fourier seasonality terms are constructively interfering at the forecast boundary; increase the number of yearly harmonics from N=10 to N=20 to smooth the transition.`,
          `B) This is a changepoint detection artifact: Prophet places changepoints only in the first 80% of training data, so recent trend shifts go undetected and the last extrapolated slope accelerates at the boundary. Fix: inspect plot_components(), reduce changepoint_prior_scale, set changepoint_range=0.95, add logistic growth cap, and validate with a domain-knowledge check.`,
          `C) The acceleration is a correct forecast; Prophet\`s piecewise linear growth reliably captures genuine trend accelerations that ARIMA would miss, so no intervention is needed unless domain knowledge contradicts it.`,
          `D) The sharp acceleration indicates over-differencing in the internal trend model; set growth="flat" to disable trend extrapolation and re-fit the model.`,
        ],
        answer: `B`,
      },
      {
        q: `You add daily temperature as an external regressor to Prophet to forecast energy demand. During backtesting, MAPE is 3%. In production, MAPE is 22%. What happened?`,
        options: [
          `A) The model overfit to temperature during training; remove the regressor and retrain on the demand series alone to restore production-level accuracy.`,
          `B) The energy demand series has a structural break between the backtest period and production; the temperature regressor is not responsible for the degradation.`,
          `C) The changepoint_prior_scale is too high, causing trend explosion in production that dominates the temperature regressor signal; reduce it to 0.001 and retrain.`,
          `D) Lookahead bias: backtesting used actual observed temperatures for the forecast period, but production requires weather forecasts. Substituting forecasted temperatures introduces regressor error that inflates MAPE. Backtest using only temperature forecasts beyond each cutoff to simulate production conditions.`,
        ],
        answer: `D`,
      },
      {
        q: `A manager wants a 90% prediction interval for monthly revenue 6 months out. You have a trained Prophet model. What are the steps to produce well-calibrated intervals and what are their limitations?`,
        options: [
          `A) Enable MCMC (mcmc_samples=300), set interval_width=0.9, evaluate calibration via cross_validation() with horizon=6 months, and check coverage_rate. Limitations: uncertainty only from future changepoints and observation noise — not regime changes; 6-month forecasts often undercover; heavy-tailed noise not handled by Gaussian likelihood.`,
          `B) MAP estimation is sufficient for calibrated intervals; set interval_width=0.9 and report directly — MCMC is only needed for horizons beyond 12 months.`,
          `C) Run Monte Carlo simulation by perturbing the holiday effect parameters 1000 times; aggregate the resulting forecast distribution to produce the 90% interval.`,
          `D) Prophet prediction intervals are always well-calibrated by construction because the Laplace prior on changepoints is a proper Bayesian prior; no additional steps are needed.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `Prophet is a specific tool for a specific problem: business KPIs with trend + weekly + yearly seasonality, designed for analysts who need sensible forecasts without deep time series expertise. Its failure modes are predictable from its structural assumptions — trend explosion at the forecast boundary when changepoint_prior_scale is too high, silently using future regressor values during backtesting, and underconfident MAP intervals. changepoint_prior_scale is the single most consequential hyperparameter and must be validated via rolling-origin cross-validation rather than left at the default.`,
  },

  {
    id: 'exponential_smoothing',
    title: 'Exponential Smoothing & ETS',
    subtitle: 'SES, Holt, Holt-Winters, ETS state space, connection to ARIMA, MLE tuning',
    difficulty: 'intermediate',
    estimatedMin: 40,
    tags: ['exponential smoothing', 'ETS', 'Holt-Winters', 'state space', 'SES', 'MLE'],
    summary: `ARIMA requires ACF/PACF identification to choose p, d, q — a manual process that breaks at scale and fails for practitioners without time series expertise. Exponential smoothing methods sidestep this by imposing a simple structural assumption: past observations should be weighted by recency, with exponentially decaying weights. SES does this for level; Holt's method adds a trend component; Holt-Winters adds seasonality. The mistake is treating these as heuristic update rules. ETS (Error-Trend-Seasonality) is a proper statistical state space model — it has a likelihood function, parameters estimated via MLE, and AIC-based model selection across 30 component combinations.

This means ETS implicitly performs ARIMA order selection without the ACF/PACF identification step, which is why ETS consistently outperforms ARIMA on large benchmark datasets like M3 and M4.`,
    keyPoints: [
      `**ARIMA order selection requires ACF/PACF interpretation, which is manual, error-prone, and impossible at scale.** ETS bypasses this entirely: it assumes exponentially decaying weights on past observations, estimates the decay parameter α via MLE, and selects among Error-Trend-Seasonality component combinations via AIC. The automation is the point — ETS delivers ARIMA-quality forecasts without per-series manual identification.`,
      `**Simple Exponential Smoothing (SES): ŷ_{t+1} = αY_t + (1-α)ŷ_t = Σ α(1-α)^j Y_{t-j}. α ∈ (0,1) controls recency weighting — α=1 is a naïve forecast (only yesterday matters), α→0 weights all history equally.** Optimal α is estimated by MLE. SES is the optimal forecast for a random walk with Gaussian noise — it is exactly equivalent to ARIMA(0,1,1) with

$θ = 1-α. A high fitted α (e.g., 0.92) means the series has near-$

random-walk dynamics: past values beyond one period ago carry almost no predictive information.`,
      `**Holt's double exponential smoothing adds a trend component.** Level:

$L_t = αY_t + (1-α)(L_{t-1} + b_{t-1}). Slope: b_t = β(L_t - L_{t-1}) + (1-β)b_{t-1}. Forecast: ŷ_{t+h} = L_t + hb_t$

. Linear trend extrapolation at long horizons is dangerous — a series that has been trending up for 2 years is not guaranteed to continue. The damped trend variant (damped-trend Holt) multiplies the slope by φ^h with φ ∈ (0.8, 0.98): the slope shrinks toward zero at long horizons. This is one of the most reliable improvements for medium-horizon forecasting.`,
      `**Holt-Winters adds a seasonal component.** Additive: S_t = γ(Y_t - L_{t-1} - b_{t-1}) + (1-γ)S_{t-s}. Multiplicative:

$S_t = γ(Y_t / (L_{t-1} + b_{t-1})) + (1-γ)S_{t-s}. All parameters (α, β, γ) are estimated jointly by MLE — not$

independently. Multiplicative seasonality handles the case where seasonal amplitude scales with level; log-transforming and using additive is an equivalent approach.`,
      `**ETS(E, T, S) notation: E ∈ {A, M} for error type (additive or multiplicative), T ∈ {N, A, Ad, M, Md} for trend (none, additive, additive damped, multiplicative, multiplicative damped), S ∈ {N, A, M} for seasonality.** Up to 30 valid combinations. AIC over all valid ETS variants selects the best automatically — this is the equivalent of Box-Jenkins order selection done via likelihood comparison rather than ACF/PACF reading.`,
      `**ETS-ARIMA equivalence proves that exponential smoothing is not ad hoc.** SES (ETS(A,N,N)) = ARIMA(0,1,1). Holt's method (ETS(A,A,N)) = ARIMA(0,2,2). Holt-Winters additive (ETS(A,A,A)) = ARIMA(0,1,m+1)(0,1,0)[m]. ETS implicitly selects ARIMA order via structural assumptions rather than ACF/PACF exploration. This equivalence explains why ETS and ARIMA perform similarly on benchmark datasets — they're fitting the same class of models via different parameterisations.`,
      `**ETS outperforms ARIMA in practice for two reasons.** Parsimony: ETS has fewer parameters with stronger regularisation via structural assumptions, reducing overfitting on short series. Multiplicative error models: ETS(M,...) handles heteroskedasticity (variance increasing with level) naturally by multiplying the noise term by the current level. ARIMA with Gaussian errors assumes constant variance, which misspecifies series with growing amplitude. Holt-Winters multiplicative error produces correct prediction intervals for heteroskedastic series where ARIMA does not.`,
      `**Croston's method handles intermittent demand (series with many zeros) — separately exponentially smooths demand size and inter-demand interval.** SES and Holt-Winters produce nonzero forecasts even when zeros dominate, which is wrong by construction for spare-parts or SKU-level intermittent series. For series with more than 30-50% zeros, Croston or ADIDA (Aggregated-Disaggregated Intermittent Demand Approach) are the correct starting points.`,
    ],
    checkQuestions: [
      {
        q: `You fit SES to a daily sales series and find the optimal α = 0.92 via MLE. What does this imply about the data and what model class does SES correspond to at this parameter value?`,
        options: [
          `A) α = 0.92 means almost all weight is on recent observations, implying near-random-walk dynamics (very little autocorrelation at lags > 1). SES with α ≈ 1 corresponds to ARIMA(0,1,1) with θ = 1 − α ≈ 0.08 — a near-random-walk where point forecasts collapse to the last observation.`,
          `B) α = 0.92 is an unusually high value indicating the MLE optimisation has converged to a local minimum; constrain α to [0.1, 0.5] and re-fit to obtain a more reliable parameter estimate.`,
          `C) α = 0.92 indicates strong long-range autocorrelation because the high weight on recent observations causes information from many past periods to accumulate in the smoothed level.`,
          `D) SES with α = 0.92 corresponds to ARIMA(1,0,0) with φ = 0.92, because exponential smoothing and autoregression are mathematically equivalent at all values of α.`,
        ],
        answer: `A`,
      },
      {
        q: `Your ETS model is ETS(M,A,M) — multiplicative error, additive trend, multiplicative seasonality. What forecast distribution does this imply and why are prediction intervals different from ETS(A,A,A)?`,
        options: [
          `A) Both ETS(M,A,M) and ETS(A,A,A) produce Gaussian prediction intervals; the only difference is that ETS(M,A,M) requires more observations to estimate parameters reliably.`,
          `B) ETS(M,A,M) produces narrower intervals than ETS(A,A,A) because multiplicative errors self-correct — deviations from trend are proportionally smaller as the level grows.`,
          `C) ETS(M,A,M) uses additive errors internally despite the M notation; the multiplicative label refers only to the seasonality component, so prediction interval formulas are identical to ETS(A,A,A).`,
          `D) ETS(M,A,M) has multiplicative errors (variance grows with level — heteroskedastic), implying an approximately log-normal forecast distribution. Prediction intervals must be computed via simulation, not the Gaussian formula used for ETS(A,A,A) which has constant variance and analytical PI.`,
        ],
        answer: `D`,
      },
      {
        q: `The M4 forecasting competition showed that ETS and ARIMA individually perform worse than simple combination methods. How does this affect how you should use ETS in production?`,
        options: [
          `A) Model uncertainty is large enough that ensembling reduces variance without proportionally increasing bias. In production: ensemble ARIMA + ETS + Prophet, use the theta method as a baseline, estimate combination weights on a validation window or use equal weights; computation overhead is dominated by data IO so ensembling is cheap even at 50k+ series.`,
          `B) The M4 result applies only to the specific dataset distribution used in the competition; for domain-specific series (retail, energy), a single well-tuned ETS model outperforms naive combinations.`,
          `C) The M4 result means ETS should be abandoned in favour of gradient-boosted tree models; the competition showed that statistical methods are outclassed by machine learning regardless of combination strategy.`,
          `D) Use ETS only as a component of combinations, never as a standalone model; always combine with at least 5 other methods to reproduce the M4 accuracy gains in production.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `ETS is not a heuristic — it is a proper state space model whose parameters are estimated by MLE and whose AIC-selected variant implicitly performs ARIMA order selection without the ACF/PACF identification step. The ETS-ARIMA equivalence (SES = ARIMA(0,1,1), Holt = ARIMA(0,2,2)) proves these are the same underlying model class in different parameterisations. The practical M4 conclusion: always ensemble ETS with ARIMA and a simple baseline, because model uncertainty across forecast horizons is large enough that combination consistently dominates any single method.`,
  },

  {
    id: 'neural_forecasting',
    title: 'Neural Forecasting',
    subtitle: 'N-BEATS, N-HiTS, TFT, PatchTST, when transformers lose to MLPs, foundation models',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['N-BEATS', 'N-HiTS', 'TFT', 'PatchTST', 'transformer', 'neural forecasting', 'TimeGPT', 'MOIRAI'],
    summary: `Electricity demand forecasting is the benchmark problem for neural time series methods: 1-year history, predict 24 hours ahead. A sequence of Transformer-based papers — Informer, Autoformer, FEDformer — each claimed state-of-the-art on this benchmark. Then a 2023 paper (Zeng et al.) showed that a single linear layer applied to the flattened lookback window outperforms all of them. The reason exposes a structural flaw: Transformer attention is permutation-equivariant. Attention scores are computed from pairwise content similarity — dot products of embeddings — not from temporal position. Shuffle the timestamps and performance barely changes. A model that ignores temporal order cannot model autocorrelation, trend, or seasonality. Positional encodings are added but don't fix this — they make position part of the content, which still allows position-insensitive mixing.

N-BEATS and N-HiTS sidestep this entirely. N-BEATS uses MLP stacks with a doubly-residual architecture: each block produces a backcast (reconstruction of its input) and a forecast; the backcast is subtracted before the next block, so each block models only what previous blocks couldn't explain. N-HiTS extends this with hierarchical multi-rate sampling — a coarse stack captures trends from downsampled series, a fine stack captures high-frequency variation — which is the right inductive bias for the 24-hour-ahead problem where trend and daily cycle operate at different timescales.

The Temporal Fusion Transformer (TFT) is competitive despite using attention because it preserves temporal structure everywhere else. An LSTM encoder processes the sequence before attention, variable selection networks gate which features matter per timestep, and attention operates on LSTM outputs rather than raw timestamps. TFT wins when rich covariates exist — static entity features, known future inputs — and N-HiTS wins without them.

**NOT this.** "Transformer-based models always outperform ARIMA and classical methods." N-BEATS, TFT, and other deep learning methods win on long-horizon multi-step forecasting with many series. On short, well-behaved univariate series with fewer than 2 years of history, ARIMA with seasonal decomposition frequently wins. The M4 and M5 competitions showed that feature-engineering with LightGBM beats most neural methods on the aggregate leaderboard. The right question is not which neural architecture to use but whether any neural model beats a well-tuned statistical baseline — that comparison must include DLinear.`,
    keyPoints: [
      `**Transformer self-attention is permutation-equivariant: it computes scores from content similarity, not temporal position, so shuffling timestamps barely changes performance on ETT benchmarks.**\n\nThis is why DLinear — a single linear layer on the flattened lookback window — outperforms Informer, Autoformer, and FEDformer. The architectural complexity of these Transformers does not compensate for discarding temporal order. DLinear is the mandatory baseline for any neural forecasting paper claim. If a proposed model does not beat DLinear, the complexity is not justified.`,
      `**N-BEATS's doubly-residual architecture gives each MLP block a smaller, well-defined task: model only what prior blocks failed to explain.**\n\nEach block produces a backcast (reconstruction of its input window) and a forecast. The backcast is subtracted via a residual connection before the next block sees the input — subsequent blocks work on harder residuals. N-HiTS extends this with hierarchical multi-rate sampling: coarse stacks downsample the input to capture slow trends; fine stacks operate at full resolution for high-frequency patterns. N-HiTS outperforms N-BEATS on horizons beyond 96 steps and handles the daily-plus-weekly double seasonality of the electricity problem naturally.`,
      `**Foundation models (TimeGPT, MOIRAI) win exactly one scenario: cold start with fewer than 30 observations per series.**\n\nWith 2+ years of in-domain history, local statistical or global neural models trained on your data dominate zero-shot foundation models. Foundation models are calibrated to their pretraining distribution — pharmaceutical sales patterns (approval spikes, generic entry cliffs), industrial sensor data, or niche domain series that differ from the training corpus show degraded zero-shot performance. The global-vs-local decision is separate: global models (N-BEATS, TFT) train across series jointly and benefit from cross-series patterns, but only when series are related enough for transfer to help.`,
    ],
    interactivePrompt: `Before you touch the controls: the electricity demand series has a clear 24-hour cycle and a 7-day pattern. If you shuffle the timestamps randomly, which model architectures would perform worst, and why?`,
    checkQuestions: [
      {
        q: `A colleague trains an Informer model on your ETT dataset and reports 15% lower MSE than ARIMA. You are sceptical. What do you do before trusting this result?`,
        options: [
          `A) Accept the result immediately — a 15% MSE reduction is large enough to be practically significant and unlikely to be explained by evaluation methodology differences.`,
          `B) Compare against DLinear (single linear layer on flattened lookback), which Zeng et al. showed outperforms Informer on ETT. Also check NLinear, verify both models use identical lookback windows and horizons, confirm the test split was not used for Informer tuning, and verify ARIMA was evaluated rolling-origin not single-fit.`,
          `C) Replicate the result using a different random seed; if the 15% gap is consistent across 3 seeds, the Informer result is trustworthy without further analysis.`,
          `D) The Informer result is impossible — Zeng et al. definitively proved that Transformers cannot outperform linear models on any time series benchmark, so the colleague made an error.`,
        ],
        answer: `B`,
      },
      {
        q: `You need to forecast hourly electricity demand for 1000 substations, 168 hours ahead (one week). You have 3 years of historical data per substation. TFT vs N-HiTS vs SARIMA — which do you use and why?`,
        options: [
          `A) SARIMA per-substation is the correct choice; 3 years of hourly data provides sufficient history for reliable parameter estimation, and statistical methods are more interpretable for utility operators than neural models.`,
          `B) TFT is always the best choice for multi-step forecasting with multiple series because its variable selection network automatically identifies the most informative features without manual feature engineering.`,
          `C) N-HiTS is the strongest starting point: hierarchical pooling handles the 168-hour horizon well, a global model across 1000 series is more efficient than 1000 SARIMA models, and SARIMA cannot natively handle double seasonality (daily + weekly). Use TFT if meaningful covariates exist; always fit a SARIMA baseline and prefer it if N-HiTS does not beat it by >5% MASE.`,
          `D) Ensemble all three equally; with 3 years of data per substation the computation cost of fitting all three models is negligible and ensemble always outperforms any individual model.`,
        ],
        answer: `C`,
      },
      {
        q: `You train a TimeGPT zero-shot model on a new domain (pharmaceutical sales) without fine-tuning. It performs worse than Holt-Winters. When would you expect a foundation model to outperform statistical methods, and what limits them?`,
        options: [
          `A) Foundation models always outperform statistical methods given enough compute; the underperformance here indicates a bug in the TimeGPT API call rather than a genuine model limitation.`,
          `B) Foundation models outperform when: cold start (<30 observations), heterogeneous portfolio where per-series fitting is infeasible, or target domain is well-represented in pretraining corpus. Limits here: pharmaceutical patterns (approval spikes, generic entry cliffs) differ from pretraining; no fine-tuning mechanism; with 3 years of data Holt-Winters fitting is reliable.`,
          `C) Foundation models outperform only on univariate series; with multivariate pharmaceutical sales data the zero-shot performance will always be degraded compared to univariate statistical methods.`,
          `D) Fine-tune TimeGPT on all 3 years of pharmaceutical data; zero-shot performance is always poor, but after fine-tuning foundation models uniformly outperform statistical methods regardless of domain.`,
        ],
        answer: `B`,
      },
      {
        q: `What is the doubly residual architecture in N-BEATS and why does it improve forecasting over a plain deep MLP?`,
        options: [
          `A) Doubly residual means N-BEATS uses two separate residual streams — one for the AR component and one for the MA component — analogous to ARMA, which is why it outperforms plain MLPs on time series.`,
          `B) Doubly residual refers to using dropout twice per block (once after each FC layer), which provides stronger regularisation than standard single-dropout MLPs and reduces overfitting on short series.`,
          `C) Each N-BEATS block produces a backcast b̂_t (reconstruction of its input) and a forecast f̂_{t+h}. The residual connection subtracts the backcast before the next block (x_{t+1} = x_t − b̂_t), and forecasts are summed across blocks. Each block focuses on what prior blocks could not explain; the backcast acts as a self-supervised signal forcing meaningful representations; residual connections improve gradient flow. This outperforms plain MLP because each block is constrained to a smaller hypothesis class.`,
          `D) Doubly residual means N-BEATS applies a residual connection at both the block level and the stack level; the block-level connection handles short-range patterns while the stack-level connection handles long-range trends, a decomposition that plain MLPs cannot achieve.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Transformer self-attention ignores temporal order by design, which is why DLinear outperforms Informer on standard benchmarks — always include DLinear as a baseline before claiming any neural forecasting win. N-HiTS retains temporal inductive bias through hierarchical multi-rate MLP stacks and beats N-BEATS on long horizons; TFT is competitive only when rich covariates exist. Foundation models win exactly one scenario: cold start with fewer than 30 observations per series.`,
  },

  {
    id: 'forecast_evaluation',
    title: 'Forecast Evaluation',
    subtitle: 'MASE, pinball loss, Winkler score, Diebold-Mariano, rolling vs expanding window',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['MASE', 'MAPE', 'pinball loss', 'Winkler score', 'Diebold-Mariano', 'backtesting', 'lookahead bias'],
    summary: `MAPE is the default metric most teams use, and it has three distinct failure modes that make it actively misleading. It's undefined when actuals are near zero (division by zero). It systematically biases selection toward models that underpredict, because over-forecasts generate larger percentage errors than under-forecasts of equal absolute magnitude. And it's not comparable across series with different scales. MASE solves all three by normalising against the in-sample naïve forecast — scale-free, symmetric, defined when Y_t = 0, and interpretable (MASE < 1 means you beat the naïve baseline). But metric choice is the second problem. The first is backtesting design: a rolling-origin evaluation that faithfully simulates production conditions is the only reliable proxy for live performance. Fitting normalisation scalers on the full dataset including the test period is ubiquitous and inflates reported performance by 5-15% — not from overfitting the model, but from the preprocessing pipeline implicitly seeing the future.`,
    keyPoints: [
      `**MAPE fails in three distinct ways.** Division by zero: any series with zero values on some days breaks it — daily new user counts, SKU-level sales with stockouts, any count series. Asymmetric penalty: over-forecasting by 50% produces a larger MAPE contribution than under-forecasting by 50% — MAPE is minimised by systematically underforecasting, biasing model selection toward conservative forecasters even when over-forecasting is equally costly. Scale dependence: MAPE on a series with mean 10 versus mean 10,000 are not comparable, making cross-series performance comparison meaningless.`,
      `**MASE (Hyndman & Koehler 2006) solves all three MAPE failure modes.** MASE = MAE / (MAE of in-sample naïve forecast). MASE < 1 means the model beats the naïve baseline on average. Scale-free: the normalisation makes MASE comparable across series with different scales. Symmetric: over- and under-forecasting of equal magnitude contribute equally. Defined when Y_t = 0: the denominator uses historical naïve errors which are well-defined even when actuals are zero. The M4 competition chose MASE as the primary metric — treat it as the default.`,
      `**Probabilistic forecast evaluation captures what point metrics miss.** A point forecast of 100 with ±5 uncertainty and ±500 uncertainty have identical point forecast errors but completely different decision implications for inventory or capacity planning. Pinball (quantile) loss: L_q(y, ŷ) = q(y - ŷ) if y ≥ ŷ, else (1-q)(ŷ - y). Averaging over all quantiles gives CRPS — the gold standard for distributional forecasts. Winkler score penalises interval width plus extra penalty for actuals outside the interval, directly measuring calibration and sharpness.`,
      `**Diebold-Mariano test: statistically tests whether two forecasters have equal expected loss.** Test statistic based on d_t = L(e₁_t) − L(e₂_t), using Newey-West standard errors for autocorrelated loss differentials. Both models must be evaluated on the same test set at the same horizon. For a portfolio of 1000 series: compute per-series MASE difference d_i, run a paired t-test or Wilcoxon signed-rank on {d_i}. Report effect size (median MASE difference) alongside p-value — a statistically significant difference of 0.001 MASE is operationally irrelevant.`,
      `**Rolling vs expanding window: expanding window uses all available history (training window grows over time) — correct for stationary DGPs where more data always helps.** Rolling window uses a fixed training size — simulates non-stationary environments where only recent data is relevant. Rolling gives more evaluation cutoffs per total dataset length. Start with expanding; switch to rolling if model performance degrades systematically on more recent cutoffs (a signal of non-stationarity in the DGP).`,
      `**Lookahead bias is the most common way backtesting results fail to transfer to production.** Four forms: (1) Using future covariate values at forecast time — the most obvious form. (2) Fitting normalisation (mean, std) on the full dataset including the test period — the scaler "knows" the future level. (3) Feature lag calculation errors without proper temporal shifts — feature at time t accidentally includes values from t+1. (4) Selecting the model with best test MAPE and reporting it as unbiased — the test set has been implicitly used for selection. The fix: strict temporal split, all preprocessing fitted on training data only, a validation set for model selection, and the test set touched exactly once for final unbiased evaluation.`,
      `**Lookahead bias magnitude: fitting a Z-score normaliser on training + test combined inflates performance because test-period values are included in the mean and standard deviation.** If the test period has a higher mean (trending series), the full-dataset normalisation partially de-trends the test values, making the model appear more accurate than it would be in production. Empirically, this inflates reported MASE by 5-15% for non-stationary series. Always fit preprocessing on training data only and apply to test using training-fitted parameters.`,
    ],
    checkQuestions: [
      {
        q: `You have two models. Model A has MAPE = 8%, Model B has MAPE = 12%. Model A looks better. But 15% of your series have true values below 5. Which model should you trust and how do you decide?`,
        options: [
          `A) Trust Model A unconditionally — MAPE is the industry standard metric and a 4-percentage-point gap is large enough that it holds even after excluding the near-zero series.`,
          `B) MAPE is unreliable when 15% of series have Y_t < 5, as those series dominate the average with inflated percentage errors. Compute MASE (robust to near-zero), separately evaluate the near-zero subset, and compare MAPE excluding near-zero series. Use MAE/MASE as primary metric if business cost is proportional to absolute error.`,
          `C) Exclude the 15% near-zero series from evaluation entirely; MAPE is valid and comparable for the remaining 85% of series where Y_t ≥ 5.`,
          `D) Apply symmetric MAPE (sMAPE) instead of MAPE to both models; sMAPE is well-defined for near-zero values and will give the correct comparison between Model A and Model B.`,
        ],
        answer: `B`,
      },
      {
        q: `You are comparing two forecasting models across 1,000 series. How do you statistically test which model is better, controlling for the multiple-series problem?`,
        options: [
          `A) Run the Diebold-Mariano test once on the concatenated forecast errors from all 1000 series; treating the full error sequence as a single time series controls for the multiple-comparison problem automatically.`,
          `B) Apply a Bonferroni correction: run Diebold-Mariano per-series at significance level α/1000; a model wins if it is significantly better on the majority of series after correction.`,
          `C) Compute per-series MASE for each model, compute d_i = MASE₁_i − MASE₂_i, run a paired t-test (or Wilcoxon signed-rank) on {d_i}, bootstrap for robustness. Effect size matters more than p-value: report median MASE and fraction of series each model wins.`,
          `D) Use a fixed-effects panel regression of forecast errors on a model-indicator variable with series fixed effects; the coefficient on the model indicator is the average performance difference controlling for series-level heterogeneity.`,
        ],
        answer: `C`,
      },
      {
        q: `You fit your preprocessing pipeline (including Z-score normalisation) on the full training+test set combined, evaluate on the held-out test, and get MASE = 0.83. What is wrong and how large could the bias be?`,
        options: [
          `A) Nothing is wrong — Z-score normalisation is a linear transformation that cannot introduce lookahead bias; only non-linear preprocessing steps (e.g., Box-Cox) create evaluation artifacts.`,
          `B) The issue is that MASE = 0.83 is suspiciously close to 1.0; the bias comes from normalising the entire dataset, which makes the naïve benchmark appear artificially strong rather than the model appearing artificially accurate.`,
          `C) Lookahead bias in preprocessing: Z-score computed on training + test uses test-period mean and std, so the scaler encodes future level information. This biases MASE toward underestimating error, inflating reported accuracy by 5-15% for non-stationary series. Fix: fit scaler on training data only, apply training-fitted parameters to test.`,
          `D) The bias direction is toward overestimating error (pessimistic), not underestimating; including test-period variance in the scaler inflates the denominator of Z-score, making test errors appear larger than they are in production.`,
        ],
        answer: `C`,
      },
      {
        q: `A PM asks why your 95% prediction interval contains the actual value only 81% of the time in production. What are the likely causes and how do you diagnose them?`,
        options: [
          `A) 81% coverage with a 95% PI is within acceptable sampling variation; for a test set of <500 observations, the confidence interval around 95% coverage is wide enough that 81% is not statistically significant.`,
          `B) The coverage gap is caused exclusively by parameter uncertainty not propagated through MAP estimation; switching from MAP to MCMC will restore 95% coverage without needing further diagnosis.`,
          `C) The 95% PI containing actuals only 81% of the time means intervals are too wide, not too narrow; over-confident interval means PI is too broad and contains too few actuals.`,
          `D) 95% PI with 81% coverage means intervals are too narrow (overconfident). Causes: Gaussian likelihood underestimates tails, MAP estimation does not propagate parameter uncertainty, structural breaks after fitting, or perfect covariates in backtesting vs forecasted covariates in production. Diagnose via empirical coverage by horizon h, residual vs assumed distribution comparison, and PIT histogram.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `MAPE misleads in three ways simultaneously: it's undefined for zero-valued series, penalises over-forecasting more than under-forecasting of equal absolute magnitude, and can't be compared across series with different scales. MASE solves all three and should be the default metric. The more consequential failure mode is backtesting design: fitting preprocessing (normalisation, scaling) on the full dataset including test data is a ubiquitous form of lookahead bias that inflates reported MASE by 5-15% — not from overfitting the model, but from the scaler implicitly encoding future level information.`,
  },

  {
    id: 'ts_anomaly_detection',
    interactiveId: 'anomaly_detection_viz',
    title: 'Time Series Anomaly Detection',
    subtitle: 'Point/contextual/collective anomalies, CUSUM, STL residuals, LSTM autoencoders, adaptive thresholds',
    difficulty: 'advanced',
    estimatedMin: 55,
    tags: ['anomaly detection', 'CUSUM', 'STL', 'LSTM autoencoder', 'isolation forest', 'contextual anomaly'],
    summary: `Time series anomaly detection fails in production for one specific reason more than any other: teams apply a threshold to the raw series instead of the residuals of a properly specified seasonal and trend model. An API error rate of 10,000 per minute is normal during peak traffic and anomalous at 3am — but a static threshold treats both identically. The raw series conflates seasonality, trend, and anomaly signal into a single number; a threshold on raw values fires whenever any component is high, including seasonality that's entirely expected. Decompose first, threshold on the residuals, and nearly all seasonality-driven false positives disappear. The quality ceiling for any anomaly detector is the quality of its baseline model — the residuals are only as clean as the decomposition.`,
    keyPoints: [
      `**Applying a static threshold to a seasonal series produces false positives every time the seasonal component peaks — not because anything unusual happened, but because the underlying cycle reached its expected high.** Decompose

$Y_t = T_t + S_t + R_t, then threshold R_t. Point anomaly: |R_t| > k·σ_R where σ_R is an IQR-based robust standard devia$

tion and k=3-4. The decomposition removes expected variation; the threshold detects unexpected deviation. This single change eliminates the majority of seasonality-driven false positives in most production monitoring systems.`,
      `**Three anomaly types require different detection strategies.** Point anomalies: a single observation far from expected (latency spike, sensor error). Contextual anomalies: a value normal in one context but anomalous in another — 500 sales on a random Tuesday versus 500 sales on Black Friday (should be 50,000). Collective anomalies: a sequence of individually normal observations that are jointly anomalous — 5 days of conversion rate 1% below normal, each individually within tolerance but collectively a significant degradation. Each type requires a different detection approach.`,
      `**CUSUM (Cumulative Sum Control Chart): C_t = max(0, C_{t-1} + (Y_t − μ₀ − k)).** Alert when C_t > h. Directional — it accumulates evidence of sustained shift rather than reacting to single spikes. This makes CUSUM naturally suited for detecting collective anomalies (sustained shifts) and resistant to false positives from individual noisy observations. Requires specifying μ₀ and k — doesn't adapt to non-stationary baselines or seasonality without preprocessing (decompose first, then apply CUSUM to residuals).`,
      `**Isolation Forest for time series requires careful feature engineering.** Applied to raw values, it ignores temporal structure entirely — it doesn't know that observation 100 follows observation 99. The correct input is a feature matrix: lag values [Y_{t-1}, Y_{t-2}, ...], rolling mean, rolling std, time-of-day, day-of-week. Without lag features, Isolation Forest is a point anomaly detector with no temporal awareness. It also cannot detect collective anomalies without explicit sliding window features encoding the joint distribution of a sequence.`,
      `**LSTM Autoencoders encode a time window and decode it back, using reconstruction error as the anomaly score.** Trained on normal data only. High reconstruction error = the window is unusual relative to training distribution. The production problem is threshold calibration: the reconstruction error distribution shifts as the system drifts (concept drift), so a static threshold set at training time produces increasing false positives over time. Use a rolling calibration window — 99th percentile of reconstruction error over the past 7-14 days as the threshold, updated daily.`,
      `**Adaptive thresholds are necessary when variance is non-constant, when the series has multiple operating modes, or when you need to directly control the alert rate.** Static 3-sigma fails on all three counts. EWMA control charts adapt to recent variance. Quantile regression estimates conditional quantiles as functions of time features (capturing time-varying variance). Conformal prediction provides coverage-guaranteed anomaly scores without distributional assumptions — the alert fires when the score falls in the top α fraction of calibration set scores, guaranteeing at most α false positive rate by construction.`,
      `**Root cause vs symptom: a single upstream failure propagates through a dependency graph and produces correlated anomalies across dozens of downstream metrics simultaneously, flooding the alert queue.** A DB failure causes API latency, cache miss rate, and error rate to all spike within seconds. Alert flooding without root cause identification means incident responders chase symptoms while the root cause persists. Multi-variate anomaly detection finds correlated joint anomalies; causal graph traversal identifies whether the anomaly originated upstream or is local. Alert correlation groups alerts firing within the same time window into a single incident.`,
      `**Evaluation when labels are scarce: PR-AUC (precision-recall) beats ROC-AUC for imbalanced anomaly detection — imbalance is extreme (1 anomaly per 1000 normal observations), so ROC-AUC is dominated by the large number of true negatives.** NAB (Numenta Anomaly Benchmark) score rewards early detection within a window before impact — detection two hours late is still valuable, just less so than detection immediately. Precision@k (fraction of top-k flagged events that are true anomalies) is practical when operators review top-ranked alerts.`,
    ],
    checkQuestions: [
      {
        q: `Your 3-sigma threshold on raw API error rate generates 200 false-positive alerts per day because of daily and weekly seasonality. What is the right fix?`,
        options: [
          `A) Increase the threshold from 3-sigma to 5-sigma; the higher threshold will reduce false positives caused by seasonal peaks without requiring any decomposition step.`,
          `B) Decompose the series with STL, compute residuals R_t = Y_t − T_t − S_t, apply a 3-sigma threshold on the residuals using IQR-based σ̂, and alert when |R_t| > 3σ̂. Further: use an EWMA control chart on residuals and set alert rate using 99th percentile over a rolling 14-day window.`,
          `C) Apply separate 3-sigma thresholds for each hour of the day and each day of the week; stratifying by calendar period removes the seasonal false positives without requiring a decomposition model.`,
          `D) Switch from a 3-sigma threshold to an interquartile range (IQR) based threshold on the raw series; the IQR is more robust to seasonal outliers than the standard deviation and will reduce false positive rate.`,
        ],
        answer: `B`,
      },
      {
        q: `You use an LSTM autoencoder for multivariate anomaly detection on 50 metrics. The reconstruction error correctly identifies an outage on day 15 of deployment, but by day 90 the false positive rate has tripled. What happened and how do you fix it?`,
        options: [
          `A) The LSTM autoencoder has overfit to the day-15 outage pattern and now flags any deviation from that specific pattern as anomalous; retrain on a dataset that excludes the day-15 outage.`,
          `B) The 50-metric dimensionality causes the autoencoder to gradually memorise normal patterns rather than generalise; apply PCA to reduce to 10 components before feeding into the autoencoder.`,
          `C) The LSTM hidden state becomes saturated after 90 days of continuous inference; reset the hidden state every 7 days and the false positive rate will return to its original level.`,
          `D) Concept drift: normal behaviour shifted over 90 days but the autoencoder still uses its day-0 training distribution, causing new normal data to appear anomalous. Fix: periodic retraining on a rolling 30-60 day window, plus adaptive threshold calibrated daily as 99th percentile of recent reconstruction errors. Trigger retraining when the mean reconstruction error drifts upward.`,
        ],
        answer: `D`,
      },
      {
        q: `You detect a latency spike anomaly in your API service. Your colleague says it is a "real anomaly." You say it is a downstream symptom. How do you distinguish, and what are the implications for incident response?`,
        options: [
          `A) Check whether the API latency anomaly score exceeds the 99th vs 95th percentile threshold; a score above the 99th percentile indicates a root cause, while a 95th-percentile score indicates a downstream symptom.`,
          `B) Run Granger causality from upstream metrics to API latency; if the test is significant at p < 0.05 the API latency is a downstream symptom driven by the upstream metric.`,
          `C) Check temporal order across metrics (did upstream DB anomaly precede API latency?), trace the call graph (API → DB → Storage), and cross-correlate anomaly times to find the earliest-onset metric. Root cause mitigation on the symptom leads to incorrect incident response — build a causal dependency graph and run automated root cause analysis.`,
          `D) Always treat the first anomaly detected as the root cause regardless of metric type; downstream symptoms always appear simultaneously with root causes because modern distributed systems have sub-second propagation latency.`,
        ],
        answer: `C`,
      },
      {
        q: `You are designing an anomaly detection system for 10,000 IoT sensors. Labelled anomalies exist for only 50 sensors. How do you evaluate model performance across all 10,000?`,
        options: [
          `A) Evaluate only on the 50 labelled sensors; performance on unlabelled sensors cannot be measured and reporting it would misrepresent model quality.`,
          `B) Use the 50 labelled sensors to tune thresholds, then apply those thresholds uniformly to all 10,000 sensors and report the alert rate as the primary evaluation metric.`,
          `C) Train a semi-supervised model using the 50 labelled sensors as positive examples and all remaining sensors as negative; the F1-score on the 50 labelled sensors is sufficient evaluation.`,
          `D) Supervised evaluation on 50 labelled sensors (PR-AUC/F1), check representativeness. Surrogate evaluation via synthetic anomaly injection on unlabelled sensors. Monitor alert rate across 10k sensors for miscalibration. Human-review sample 100 triggered alerts to estimate precision. Active learning to prioritise labelling high-scoring ambiguous cases.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Nearly all production false-positive problems in time series anomaly detection trace back to applying a threshold to the raw series instead of the residuals of a properly specified seasonal+trend model. The decompose-first, threshold-on-residuals pattern eliminates seasonality-driven false positives immediately. The second most important insight is distinguishing root causes from downstream symptoms via causal graph traversal: a single upstream failure floods the alert queue with correlated alerts across dozens of metrics, and incident response fails when teams chase symptoms while the root cause persists.`,
  },

  {
    id: 'causal_ts',
    title: 'Causal Inference in Time Series',
    subtitle: 'Granger causality, ITS, synthetic control, CausalImpact, DiD, temporal autocorrelation',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['Granger causality', 'CausalImpact', 'synthetic control', 'interrupted time series', 'DiD', 'BSTS'],
    summary: `Granger causality is the most widely misused concept in applied time series work. It answers a predictive question — does X help predict Y beyond Y's own past? — not a causal one. A shared upstream cause Z that affects both X and Y with different lags produces Granger causality between X and Y with zero direct relationship. Knowing that search volume Granger-causes sales tells you nothing about whether investing in SEO will increase sales. The tools that actually support causal claims — synthetic control, CausalImpact, interrupted time series, difference-in-differences — all require a credible counterfactual: what would have happened to the treated unit absent the intervention. The harder problem in practice is staggered rollouts, where different units receive treatment at different times. Standard two-way fixed effects DiD is biased under treatment effect heterogeneity in this case — already-treated units contaminate the control group — and the fix (Callaway-Sant'Anna) is not widely known.`,
    keyPoints: [
      `**Granger causality tests whether lagged X improves prediction of Y beyond lagged Y alone — it is a predictive test, not a causal test.** A shared upstream cause Z that affects both X and Y with different lags produces Granger causality X → Y with no direct mechanism. TV advertising that simultaneously increases search volume and sales will produce Granger causality from search to sales even if search has no causal effect on sales. The correct interpretation: "X has predictive information about Y beyond Y's own past." The incorrect interpretation: "changing X will change Y."`,
      `**Interrupted Time Series (ITS): OLS regression

$Y_t = β₀ + β₁T + β₂D_t + β₃(T − T*)D_t + ε_t, where D_t = 1{t ≥ T*}. β₂ is the immediate level change; β₃ is t$

he slope change post-intervention.** Critical assumptions: no other intervention coincides at T*, the pre-period trend extrapolates cleanly, and residuals are not autocorrelated (autocorrelated residuals underestimate SE — use Prais-Winsten or Newey-West correction). ITS works without any control unit but requires a credible counterfactual from the pre-period trend extrapolation.`,
      `**Synthetic control (Abadie et al.): constructs a weighted combination of control units that matches the treated unit's pre-treatment outcomes as closely as possible.** The post-treatment gap (treated − synthetic control) is the estimated treatment effect. The critical advantage over DiD: pre-treatment fit quality is directly observable — you can see whether the synthetic control matches the treated unit before claiming an effect. If pre-period fit is poor, the counterfactual is unreliable and the treatment effect estimate is invalid.`,
      `**CausalImpact (Brodersen et al., Google 2015): Bayesian Structural Time Series fitted on the pre-intervention treated series using control series as regressors.** Post-intervention: extrapolate the counterfactual; treatment effect = observed − counterfactual with full posterior credible intervals. Key assumption: the relationship between treated and control series is stable across the intervention. If control series were independently affected by the intervention (spillover), the counterfactual is polluted and the effect estimate is biased.`,
      `**Difference-in-Differences: DiD = (Y_{treated,post} − Y_{treated,pre}) − (Y_{control,post} − Y_{control,pre}).** The parallel trends assumption requires that the treated and control units would have moved identically absent the treatment. Temporal autocorrelation within units inflates t-statistics — cluster standard errors at the unit level. Always plot pre-trend event study coefficients to validate parallel trends before reporting a single DiD estimate.`,
      `**Staggered DiD and the TWFE bias: when different units receive treatment at different times, two-way fixed effects (TWFE) regression uses already-treated units as controls for later-treated units.** With heterogeneous treatment effects (e.g., the effect grows over time), TWFE produces estimates that can be negatively weighted — some comparisons literally subtract true treatment effects. Callaway-Sant'Anna computes cohort-specific ATTs (average treatment effects for each treatment cohort) using only clean controls (never-treated or not-yet-treated) and aggregates properly.`,
      `**Temporal autocorrelation breaks standard causal methods in specific ways.** IV exclusion restrictions become implausible when instrument and outcome share autocorrelated common trends. Regression discontinuity with time as the running variable is especially fragile — observations near the cutoff are highly correlated, conflating the treatment effect with local autocorrelation. Time-varying confounding requires marginal structural models (MSM) with inverse probability of treatment weighting (IPTW), not cross-sectional propensity score matching.`,
      `**Event study (dynamic DiD): estimate effects at each relative time period with Y_{it} = αᵢ + λ_t + Σ_{k≠-1} δ_k 1{t − G_i = k} + ε_{it}.** Pre-treatment δ_k coefficients (k < 0) test parallel trends — a joint F-test on pre-treatment periods is the validation. Post-treatment coefficients show dynamic effect trajectory. Always visualise as an event study plot before reporting a single DiD estimate — if pre-treatment effects are nonzero, the parallel trends assumption fails and the DiD estimate is biased.`,
    ],
    checkQuestions: [
      {
        q: `You find that Google search volume for your brand Granger-causes weekly sales (F-test p < 0.001). A PM wants to invest in SEO to increase search volume and thereby increase sales. What is the problem with this reasoning?`,
        options: [
          `A) The problem is the lag specification; if the PM re-runs the Granger test with lags 1-4 instead of lags 1-8, the significance will disappear and the causal claim will be invalidated.`,
          `B) Granger causality shows lagged search predicts sales beyond sales\` own history — it does NOT establish that increasing search will increase sales. Alternatives: common cause (TV advertising affects both), reverse causality with lag. Distinguish via experiment, instrumental variable, or controlling for advertising spend in the Granger VAR.`,
          `C) The reasoning is correct; Granger causality at p < 0.001 is strong enough statistical evidence to justify the SEO investment, since it demonstrates that search is a leading indicator of sales.`,
          `D) The Granger test is invalid because weekly sales data violates the stationarity assumption required for VAR estimation; first difference both series and re-run before drawing any conclusion.`,
        ],
        answer: `B`,
      },
      {
        q: `You are measuring the impact of a new feature launched to users in Germany on January 15. You have daily active users (DAU) data for Germany (treated) and France (control) from January 2023 onwards. How do you use CausalImpact and what assumptions must hold?`,
        options: [
          `A) Fit BSTS on France DAU using Germany DAU as regressor during the pre-period, then extrapolate post-launch to estimate the counterfactual France trajectory. Assumptions: no spillover to France, stable cross-country relationship, adequate pre-period length.`,
          `B) Run a simple pre-post t-test on Germany DAU before and after January 15; CausalImpact is only needed when you have multiple control units, not a single control country.`,
          `C) Use both Germany and France data in a DiD estimator with country and time fixed effects; CausalImpact is only appropriate when you have no control group at all.`,
          `D) Set pre-period = before Jan 15, post-period = after. Fit BSTS on Germany DAU using France DAU as regressor pre-launch, extrapolate counterfactual post-launch. Assumptions: stable Germany-France relationship, no spillover to France, adequate pre-period (3x post length), parallel pre-trends. Report posterior causal effect with 95% CI.`,
        ],
        answer: `D`,
      },
      {
        q: `Your company rolls out a pricing change to different markets in different months over a 6-month window. You use TWFE DiD to estimate the effect. A colleague says your estimate is biased. Why and what do you do?`,
        options: [
          `A) TWFE is biased because staggered rollout violates the parallel trends assumption; adding market-specific linear time trends to the TWFE regression will correct the bias without changing the estimator.`,
          `B) TWFE DiD is unbiased under staggered rollout as long as you cluster standard errors at the market level; the colleague is confusing standard error bias with point estimate bias.`,
          `C) Staggered timing invalidates TWFE because already-treated markets are used as controls for later-treated markets. With heterogeneous treatment effects, TWFE weights can be negative. Use Callaway-Sant\`Anna (cohort-specific ATTs with clean controls only) or Sun-Abraham estimator. Plot event-study coefficients to detect heterogeneity.`,
          `D) TWFE is biased only when treatment assignment is non-random; since the rollout schedule was set by the company, treatment is as-good-as-random and TWFE gives an unbiased estimate of the average treatment effect.`,
        ],
        answer: `C`,
      },
      {
        q: `You want to estimate the causal effect of an algorithm change on user engagement, but the change was rolled out gradually to all users with no holdout group. CausalImpact, synthetic control, and ITS all require a control group or counterfactual. What do you do?`,
        options: [
          `A) Use a pre-post comparison with a paired t-test on engagement metrics before and after the rollout; without a control group this is the only valid causal identification strategy.`,
          `B) Retrospectively identify a set of users who adopted the new algorithm later as a natural control group; compare early adopters to late adopters using standard DiD.`,
          `C) Apply CausalImpact using a competitor platform\`s engagement metric as the control regressor; competitor metrics are always valid synthetic controls for internal product changes.`,
          `D) Without a holdout group, options include: ITS with internal counterfactual (pre-change BSTS extrapolation), regression discontinuity in time at the rollout date (with CCT bandwidth and robust SE for temporal autocorrelation), or external series as synthetic control donors. Honest answer: causal ID without a holdout requires strong untestable assumptions — the right fix is a prospective holdout design for future launches.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Granger causality is the most frequently misused concept in applied time series work: it measures predictive priority, not causation, and a common upstream cause produces Granger causality between two otherwise unrelated series. The second most important insight for applied causal time series is that TWFE DiD is biased under staggered rollouts with heterogeneous treatment effects — already-treated units contaminate the control group, and the fix is Callaway-Sant'Anna, not just clustering standard errors. Always run an event study plot before reporting any DiD estimate.`,
  },
]
