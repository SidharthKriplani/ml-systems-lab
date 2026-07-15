export const TIME_SERIES_MODULES = [
  {
    id: 'stationarity',
    interactiveId: 'stationarity_viz',
    title: 'Stationarity & Differencing',
    subtitle: 'Unit root tests, spurious regression, integration order, cointegration',
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['stationarity', 'unit-root', 'differencing', 'cointegration', 'ADF', 'KPSS'],
    summary: `Regress two independent random walks against each other and you'll get R² near 1 and t-statistics in double digits — not because they're related, but because both are trending. That's spurious regression, and it invalidates every downstream conclusion.

[FIGURE: stationary_vs_trending]

It's the reason stationarity matters: non-stationary series have growing variance and shifting means, so the statistical tests that assume constant moments produce completely unreliable results. The ADF and KPSS tests tell you whether you have a unit root; differencing removes trends; seasonal differencing removes periodicity. The flip side of non-stationarity is cointegration — two non-stationary series can share a long-run equilibrium whose spread is stationary, and error correction models exploit that structure rather than discarding it.`,
    keyPoints: [
      `**Two random walks regressed against each other will look strongly related — R² > 0.5, |t| > 2 — with zero true relationship.** The tell is Durbin-Watson near 0: residuals are nearly perfectly autocorrelated, which is the signature of a spurious regression between two non-stationary series. OLS standard errors assume independent residuals; when they're serially correlated, standard errors are severely underestimated and all inference collapses. This is not a small-sample problem — it gets worse with more data.`,
      `**Weak (covariance) stationarity requires three properties: constant mean E[Y_t] = μ, constant variance Var(Y_t) = σ², and autocovariance Cov(Y_t, Y_{t-k}) = γ(k) that depends only on lag k, not on t.** A random walk Y_t = Y_{t-1} + ε_t violates two of the three — variance grows as tσ² and the autocovariance depends on t, so the series wanders without bound (the unconditional mean E[Y_t] = Y_0 stays constant for this driftless walk; a random walk with drift would violate the mean too). One difference gives ΔY_t = ε_t, which is stationary. The I(d) notation means d differences are needed to achieve stationarity.`,
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
          `A) The model is correctly specified; DW near 0 actually confirms no autocorrelation is present, so the high R² and large t-stat reflect genuine, causal co-movement between revenue and temperature.`,
          `B) DW ≈ 0.12 signals near-perfect residual autocorrelation — the hallmark of spurious regression. Test with ADF/KPSS, then work in first differences or use cointegration/ECM if a long-run relationship exists.`,
          `C) The issue is heteroskedasticity, not autocorrelation. Apply a Newey-West or White robust standard error correction after a Breusch-Pagan pre-test, and the OLS regression remains fully valid.`,
          `D) DW near 0 means the model is over-differenced at lag one, inducing artificial negative MA(1) noise into the residual structure. Re-fit with a Cochrane-Orcutt correction instead of differencing and the spurious correlation fully disappears.`,
        ],
        answer: `B`,
      },
      {
        q: `Which TWO of the following statements about ADF and KPSS are correct?`,
        options: [
          `A) ADF's null hypothesis is a unit root while KPSS's null is stationarity — the tests are complementary because they test in opposite directions, which is exactly why running both resolves ambiguous cases.`,
          `B) ADF is always the more statistically reliable test regardless of sample size, so when the two tests disagree the correct rule is to simply trust ADF and discard the KPSS result entirely without further checks.`,
          `C) When ADF rejects the unit-root null (implying stationarity) and KPSS also rejects the stationarity null (implying a unit root) — the two tests pointing in contradictory directions — this can indicate fractional integration or a structural break, and blindly differencing further is not the right fix.`,
          `D) Both ADF and KPSS require at least exactly 100 observations to produce statistically valid results, and any sample below that threshold makes both tests entirely uninterpretable regardless of context.`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `You have two financial time series (stock price and its futures contract price) that are both I(1). How do you decide whether to model them separately in first differences or jointly?`,
        options: [
          `A) Test for cointegration with the Johansen trace test — spot and futures are cointegrated by no-arbitrage. If a vector is found, use a VECM instead of separate first differences, which discards the equilibrium.`,
          `B) Always model them separately in first differences regardless of theory or context; cointegration is a purely academic construct that almost never survives contact with noisy real-world financial tick data feeds.`,
          `C) Use the Engle-Granger two-step regression on the raw levels; if residuals pass an ADF test at I(0), cointegration is confirmed and the OLS coefficients on levels are directly interpretable and unbiased.`,
          `D) Run a simple Pearson cross-correlation between the two raw level series; if the coefficient exceeds 0.9 then model them jointly with a VAR, otherwise fall back to first differences independently.`,
        ],
        answer: `A`,
      },
      {
        q: `Your revenue series passes ADF stationarity test. You fit an ARIMA(1,0,1) and the residuals look clean. Six months later the model performance degrades sharply. What likely happened and how do you detect it earlier?`,
        options: [
          `A) The ARIMA order was mis-specified from the start; re-running auto-ARIMA with a wider search grid on the full dataset, including the degraded period, will identify the correct orders retroactively.`,
          `B) The model likely overfit during the original training window by capturing noise as signal; reduce the AR and MA orders to a simpler ARIMA(1,0,1) specification and performance will recover on its own.`,
          `C) A structural break changed the underlying data-generating process. Detect it earlier with rolling ADF tests, CUSUM/MOSUM on rolling mean and variance, and a CUSUM chart on forecast residuals.`,
          `D) Stationarity, once confirmed by ADF, guarantees model stability indefinitely for the life of the series; the degradation is instead caused by an upstream data pipeline bug, not a modelling problem.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Stationarity is not a box to check once at model training time — spurious regression is the immediate consequence of skipping it, and structural breaks mean a series that was stationary at training time may not be stationary in production. The most important inference to demonstrate is knowing when two non-stationary series should be modelled jointly (cointegration + ECM preserves the long-run relationship) versus separately in first differences (when no cointegrating vector exists and the long-run relationship is meaningless).`,
    recap: [
      `**Spurious regression:** two random walks → R²>0.5, |t|>2, DW≈0, zero true relation.`,
      `**Weak stationarity = constant mean + variance + lag-only autocovariance γ(k).**`,
      `**ADF (H₀: unit root) + KPSS (H₀: stationary) run together resolve ambiguity.**`,
      `**Trend-stationary → detrend; difference-stationary → difference.** Wrong choice leaves a unit root or induces MA noise.`,
      `**Cointegration:** two I(1) series, spread I(0) — model jointly via ECM, don't difference away the equilibrium.`,
      `**ECM:** \`α(Y_{t-1}−βX_{t-1})\` term, α<0 pulls back to equilibrium.`,
      `**Not a one-time check:** structural breaks kill stationarity in production — monitor with rolling ADF/CUSUM.`,
    ],
    figures: {
      stationary_vs_trending: `<svg viewBox="0 0 360 152" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">Stationary — constant mean, bounded variance</text>
  <line x1="8" y1="42" x2="352" y2="42" stroke="var(--rim)" stroke-width="0.75" stroke-dasharray="3 3"/>
  <text x="352" y="39" text-anchor="end" fill="var(--ink-low)" font-size="6.5">mean μ</text>
  <polyline fill="none" stroke="var(--prime)" stroke-width="1.5" points="8,42 26,30 44,50 62,38 80,52 98,34 116,48 134,40 152,52 170,32 188,46 206,38 224,50 242,36 260,48 278,42 296,52 314,34 332,46 352,40"/>
  <text x="8" y="82" fill="var(--ink-low)" font-size="8">Trending (random walk) — mean drifts, variance grows as t·σ²</text>
  <polyline fill="none" stroke="var(--gold)" stroke-width="1.5" points="8,138 26,132 44,134 62,124 80,128 98,116 116,120 134,106 152,110 170,96 188,100 206,88 224,92 242,78 260,82 278,70 296,74 314,62 332,66 352,54"/>
  <line x1="8" y1="140" x2="352" y2="140" stroke="var(--rim)" stroke-width="0.75"/>
  <text x="180" y="150" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">Regress two random walks against each other → spurious R²; difference once → stationary</text>
</svg>`,
    },
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
          `A) MA(3) — the three significant ACF spikes directly indicate three MA terms; the observed PACF pattern is fully consistent with this MA(3) order selection under Box-Jenkins rules.`,
          `B) AR(1) — PACF cuts off at lag 1 and ACF decays, the textbook signature of an AR(1) process. Fit ARIMA(1,0,0), check residuals with Ljung-Box; if autocorrelation remains at lag 2+, try AR(2).`,
          `C) ARMA(1,1) — whenever both ACF and PACF show any non-zero values at early lags at all, a mixed model is always strictly required regardless of the specific decay-versus-cutoff pattern actually observed.`,
          `D) ARIMA(3,1,0) — differencing is needed because three lags in the ACF are significant, which by itself indicates a unit root paired with an AR structure of order exactly 3, before checking PACF at all.`,
        ],
        answer: `B`,
      },
      {
        q: `You fit ARIMA(2,1,2) to a monthly sales series; Ljung-Box on residuals passes overall (p=0.42) but the residual ACF shows a spike at lag 12. Which TWO statements are correct?`,
        options: [
          `A) A passing overall Ljung-Box p-value does not guarantee every individual lag is clean; a seasonal-lag spike can hide underneath an acceptable aggregate p-value across the tested lag range.`,
          `B) The significant lag-12 spike indicates the non-seasonal differencing order d should be increased from 1 to 2, which will remove the remaining autocorrelation structure entirely and immediately.`,
          `C) The lag-12 spike indicates uncaptured seasonal structure; the fix is upgrading to a seasonal model such as SARIMA(2,1,2)(1,0,1)[12] or adding seasonal differencing, not more non-seasonal lags.`,
          `D) The model has overfit at short lags, causing residual energy to concentrate artificially at lag 12; reducing to a simpler ARIMA(1,1,1) would redistribute the autocorrelation more evenly across all lags.`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `Your e-commerce platform has 50,000 product SKUs. You need daily sales forecasts for each. Why is per-SKU ARIMA unrealistic and what do you use instead?`,
        options: [
          `A) Order selection is expensive at 50k series and many SKUs have intermittent demand ARIMA can't handle. Better: global neural models, Croston's for intermittent demand, hierarchical MinT reconciliation.`,
          `B) Per-SKU ARIMA is unrealistic only because of raw computational cost; once fully parallelised across a large enough cluster, ARIMA remains the single most accurate method for individual SKU-level forecasting.`,
          `C) Per-SKU ARIMA fails primarily because ARIMA requires at least 5 full years of history per series; for any SKU with less data, use a simple seasonal-naive forecast as a drop-in replacement instead.`,
          `D) Per-SKU ARIMA is unrealistic due to the cold-start problem alone; the correct fix is to pre-train one global ARIMA model on aggregated demand and then fine-tune its coefficients separately per SKU.`,
        ],
        answer: `A`,
      },
      {
        q: `You fit ARIMA(0,1,1) and ARIMA(1,1,0) to the same series. Both pass diagnostics. The MA model has lower AIC. A colleague argues the AR model is more interpretable for business stakeholders. How do you decide?`,
        options: [
          `A) Always choose the model with strictly lower AIC regardless of any stakeholder considerations; interpretability arguments are never a statistically valid reason to prefer a higher-AIC model.`,
          `B) Prefer the AR model unconditionally in every single case — AR models are always more interpretable because lagged values are directly observable, while MA error terms are latent and totally unexplainable to non-statisticians.`,
          `C) ARIMA(0,1,1) with θ≈1 approximates exponential smoothing; ARIMA(1,1,0) with φ≈1 approximates a random walk. Use lower-AIC MA for forecasting, AR for stakeholder comms; verify on a holdout, deploy the simpler if tied.`,
          `D) Fit both models simultaneously as an equally weighted mixture ensemble; this sidesteps the model-selection debate entirely and always produces better-calibrated prediction intervals than either model alone.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `ARIMA's "I" solves non-stationarity by differencing — one difference removes a linear trend, enabling the AR and MA components to model the stationary residuals. ACF/PACF cutoffs are a starting point, not a recipe: textbook-clean patterns only appear in simulated data, so Box-Jenkins is always iterative via residual diagnostics. The most consequential failure mode is the structural break: after a regime change the model absorbs the shift as a spurious long-lag effect, producing biased forecasts indefinitely — the fix is re-identifying orders on post-break data, not adding more lags.`,
    recap: [
      `**AR(p) = momentum** ($Y_t=Σφ_iY_{t-i}+ε_t$); **MA(q) = shocks**; **I(d) = differencing** removes trend.`,
      `**One difference removes a linear trend** — ARIMA(p,1,q) for trending series; d=2 usually over-differencing.`,
      `**ACF/PACF = starting point, not recipe:** clean cutoffs only in simulated data; compare candidates by AIC.`,
      `**Ljung-Box must pass at ALL lags** — overall p=0.42 can hide a lag-12 seasonal spike → go SARIMA.`,
      `**Structural break = worst failure:** model absorbs regime shift as long-lag effect, biased forecasts forever.`,
      `**Fix a break by re-identifying orders on post-break data**, not adding more lags.`,
      `**Per-SKU ARIMA doesn't scale** (50k series, cold start, intermittent) → global models / Croston's.`,
    ],
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
      `**STL (Seasonal and Trend decomposition using Loess): an inner loop that estimates both the seasonal and trend components via LOESS, wrapped in an outer robustness loop that downweights outlier-influenced points using remainder-based weights (0 iterations unless robust=True).** Key parameters are period (s), trend window (t.window), and seasonal window (s.window). s.window="periodic" forces the seasonal component identical across all years — correct only when the seasonal driver is physically fixed (daylight hours). A finite s.window allows the seasonal component to evolve over time. The robust option downweights outliers in LOESS fitting so anomalies don't corrupt the seasonal estimate.`,
      `**Multiple seasonalities require iterative STL (MSTL), processing periods shortest-first.** Hourly data with both daily and weekly patterns: decompose at the daily period first, then decompose the remainder at the weekly period — ascending order avoids the shorter cycle being absorbed into the longer one. Single STL cannot handle two simultaneous seasonal frequencies. This is a common failure mode for high-frequency data (hourly electricity, real-time traffic) where practitioners apply a single STL and wonder why the residuals still have structure.`,
      `**Fourier terms replace seasonal dummy variables with K pairs of sin/cos: sin(2πkt/s) and cos(2πkt/s) for k=1,...,K.** The advantage: works for non-integer periods like annual seasonality in daily data (period = 365.25 days — no integer period exists for dummies) and very long periods where dummies are impractical. K controls seasonal shape complexity — K=s/2 is equivalent to dummies. Fourier terms are fitted as OLS regression coefficients, making them computationally cheap and easy to include in any regression model.`,
      `**Calendar-shifting events are where STL breaks down completely.** Black Friday falls on the fourth Thursday of November — it shifts by up to six days from year to year. In STL with a fixed 52-week period, that spike smears across 3-4 weeks in the seasonal component and the peak estimate is attenuated by a factor of ~3-6. Explicit holiday calendars (Prophet, X-13) or event features (days_to_black_friday, is_black_friday_week) are the correct tool. STL applied to series with calendar-shifting events will systematically underforecast the peak.`,
      `**X-13-ARIMA-SEATS is what national statistics agencies use for official economic data.** It runs ARIMA before decomposition to handle outliers, trading day effects (months have different numbers of weekdays each year), and holiday effects explicitly. More rigorous than STL; appropriate when you need auditable, reproducible decompositions on economic data. For most ML applications, STL with explicit holiday features is simpler and sufficient.`,
      `**A common pipeline: decompose → model trend, seasonal, and residual components separately → recompose.** The residual after removing trend and seasonality is close to stationary, making it much easier to model with ARIMA or a neural forecaster. Forecasting on the residual alone often outperforms forecasting on the raw series because the model no longer has to simultaneously capture multiple structure types at different timescales.`,
    ],
    checkQuestions: [
      {
        q: `Weekly website traffic shows seasonal amplitude doubling over 3 years while trend also doubles. Which TWO statements about additive vs multiplicative decomposition are correct?`,
        options: [
          `A) If seasonal amplitude grows in proportion to the trend level, multiplicative decomposition (or an additive fit on log(Y_t)) is the appropriate choice, not a fixed-amplitude additive model applied directly.`,
          `B) Additive decomposition is always the more interpretable choice regardless of how the seasonal amplitude behaves relative to the trend, so it should be the default model in every single case encountered.`,
          `C) When seasonal amplitude stays constant in absolute terms as the trend grows, additive decomposition correctly captures the seasonal component without requiring any log transformation beforehand.`,
          `D) Classical moving-average decomposition explicitly and correctly handles multiplicative seasonality without any log transform, which is why it is generally preferred over STL for proportional seasonal patterns.`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `You are building a real-time anomaly detector for server error rates, which show strong daily and weekly patterns. STL fails because STL requires the series to be longer than two periods and the seasonal window must be odd. For 10-minute data with both daily (144 points/period) and weekly (1008 points/period) seasonality, what is your approach?`,
        options: [
          `A) Apply a single STL at the dominant (weekly) period and ignore the daily seasonality; residual daily patterns will average out and not materially affect anomaly detection.`,
          `B) Use MSTL: decompose at daily period (144) first, then at weekly period (1008) — shortest period first, so the short cycle isn't absorbed into the long one. Alternatively, use Fourier terms in an online regression updated on a rolling 4-week window; use the residual as the anomaly signal.`,
          `C) Aggregate the 10-minute data to hourly before applying STL; the coarser granularity eliminates the dual-seasonality problem and makes standard STL applicable.`,
          `D) Apply two independent STL models — one at the daily period and one at the weekly period — then subtract both seasonal components from the raw series before thresholding.`,
        ],
        answer: `B`,
      },
      {
        q: `A stakeholder asks why your Black Friday sales forecast is consistently off by 20%. Your model uses STL decomposition with a fixed 52-week seasonal pattern. What is the root cause?`,
        options: [
          `A) Black Friday shifts by up to ±3 business days yearly. STL with a fixed 52-week period smears the spike across 3-4 weeks, attenuating the peak. Fix: explicit holiday features or Prophet/X-13 holiday effects.`,
          `B) The 20% error is due to insufficient training data alone; STL needs at least 5 full years of history to correctly identify the Black Friday spike within a fixed 52-week seasonal period.`,
          `C) The root issue is the additive-versus-multiplicative choice; switching to multiplicative STL will correctly capture the Black Friday peak since holiday sales scale proportionally with overall revenue level.`,
          `D) The fixed 52-week seasonal pattern is correctly specified as-is; the forecast error is caused instead by year-over-year revenue trend growth — add a separate linear trend regression on top of the decomposition.`,
        ],
        answer: `A`,
      },
      {
        q: `What does it mean to set s.window="periodic" in STL, when is it correct to do so, and what is the risk of always using it?`,
        options: [
          `A) s.window="periodic" increases the number of LOESS smoothing iterations in the inner loop, making the seasonal estimate more statistically robust; the only risk of overuse is longer computation time.`,
          `B) s.window="periodic" forces the seasonal component to evolve rapidly year over year; the risk is that it overfits recent seasonal patterns and performs poorly in the subsequent trend extrapolation step.`,
          `C) s.window="periodic" forces the seasonal component identical across years, correct only when the driver is physically fixed (daylight hours). Risk: evolving patterns leave systematic residuals in recent years.`,
          `D) s.window="periodic" disables the outer robustness loop in STL entirely, making the decomposition run faster but leaving it far more sensitive to outliers corrupting the resulting seasonal estimate.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `The practical insight that separates strong candidates is knowing when STL fails and what to do instead. STL handles smoothly evolving seasonality at a fixed calendar period but is blind to calendar-shifting events (Black Friday, Ramadan, Easter) because it assumes the seasonal spike falls at the same calendar week each year. The diagnostic — "seasonal component smeared across 3-4 weeks, peak attenuated" — identifies STL failure, and the fix is explicit holiday features or event indicators rather than encoding the event in the seasonal component.`,
    recap: [
      `**Additive \`Y=T+S+R\`** (fixed absolute season) vs **multiplicative \`Y=T×S×R\`** (season scales with level).`,
      `**Diagnose:** amplitude constant → additive; amplitude grows with trend → multiplicative or log first.`,
      `**Classical decomposition:** season forced identical across years + missing endpoints → biased recent estimate.`,
      `**STL:** LOESS smoother; \`s.window="periodic"\` fixes season (correct only if driver physically fixed, e.g. daylight).`,
      `**Multiple seasonalities need MSTL** (daily then weekly — shortest period first); single STL leaves residual structure.`,
      `**Fourier terms** (K sin/cos pairs) handle non-integer periods like 365.25 and long periods cheaply.`,
      `**STL breaks on calendar-shifting events** (Black Friday smears across 3-4 weeks) → explicit holiday features.`,
    ],
  },

  {
    id: 'prophet_framework',
    title: 'Prophet',
    subtitle: 'Piecewise growth, Fourier seasonality, changepoints, uncertainty, failure modes',
    difficulty: 'intermediate',
    estimatedMin: 40,
    tags: ['prophet', 'changepoints', 'Fourier', 'piecewise-linear', 'uncertainty', 'holiday'],
    summary: `Most time series forecasting tools require deep domain expertise to configure — choosing ARIMA orders, specifying seasonal structure, diagnosing residuals. Prophet was built to solve a specific operational problem at Meta: let analysts without time series expertise produce sensible forecasts for thousands of business KPIs without model-by-model tuning. It achieves this by encoding strong structural assumptions: piecewise linear growth with sparse changepoints, Fourier seasonality at weekly and annual periods, and an explicit holiday calendar. These assumptions work well for typical business metrics (daily active users, weekly revenue, annual seasonal sales).

[FIGURE: prophet_additive]

The mistake is treating Prophet as a general-purpose forecaster. Feed it a volatile financial series, a mean-reverting series, or anything where recent trend doesn't extrapolate linearly, and it will produce confidently wrong forecasts. Knowing the failure modes matters more than knowing the feature list.`,
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
          `A) The Fourier seasonality terms are constructively interfering right at the forecast boundary; increase the number of yearly harmonics from N=10 to N=20 to smooth out the transition point.`,
          `B) A changepoint artifact: Prophet places changepoints only in the first 80% of training data, so recent trend shifts go undetected. Fix: lower changepoint_prior_scale and set changepoint_range=0.95.`,
          `C) The acceleration is simply a correct forecast in this situation; Prophet's piecewise linear growth reliably captures genuine trend accelerations that ARIMA would otherwise miss entirely, so no intervention is needed at all.`,
          `D) The sharp acceleration indicates over-differencing inside the internal trend model; set growth="flat" to fully disable trend extrapolation and re-fit the entire model from scratch.`,
        ],
        answer: `B`,
      },
      {
        q: `You add daily temperature as an external regressor to Prophet to forecast energy demand. During backtesting, MAPE is 3%. In production, MAPE is 22%. What happened?`,
        options: [
          `A) The model overfit to the temperature signal during training; simply remove the regressor entirely and retrain on the demand series alone to restore production-level accuracy immediately.`,
          `B) The energy demand series developed a structural break between the backtest period and production deployment; the temperature regressor itself is not responsible for the observed degradation.`,
          `C) The changepoint_prior_scale is set too high, causing a trend explosion in production that dominates and drowns out the temperature regressor signal; reduce it to 0.001 and retrain from scratch.`,
          `D) Lookahead bias: backtesting used actual observed temperatures, but production needs forecasts. Substituting forecast temperature inflates MAPE. Backtest using only forecasts beyond each cutoff to simulate production.`,
        ],
        answer: `D`,
      },
      {
        q: `A manager wants a 90% prediction interval for monthly revenue 6 months out. Which TWO statements about producing and limiting well-calibrated Prophet intervals are correct?`,
        options: [
          `A) Enabling MCMC sampling and evaluating coverage via cross_validation() at the target horizon is the right approach to check whether the 90% interval actually achieves its nominal coverage rate empirically.`,
          `B) MAP estimation, the default, does not propagate full parameter uncertainty into the interval, so its width is systematically too narrow compared to properly sampled posterior-based intervals from MCMC.`,
          `C) MAP estimation is fully sufficient for calibrated intervals in every case; set interval_width=0.9 and report directly — MCMC sampling is only ever needed for horizons beyond 12 months out.`,
          `D) Prophet's prediction intervals are always well-calibrated by construction because the Laplace prior on changepoints is a proper Bayesian prior, so no additional calibration steps are ever needed.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `Prophet is a specific tool for a specific problem: business KPIs with trend + weekly + yearly seasonality, designed for analysts who need sensible forecasts without deep time series expertise. Its failure modes are predictable from its structural assumptions — trend explosion at the forecast boundary when changepoint_prior_scale is too high, silently using future regressor values during backtesting, and underconfident MAP intervals. changepoint_prior_scale is the single most consequential hyperparameter and must be validated via rolling-origin cross-validation rather than left at the default.`,
    recap: [
      `**Prophet = structural additive regression:** \`y(t)=g(t)+s(t)+h(t)+ε\` — growth + Fourier seasonality + holidays.`,
      `**Built for analysts:** sensible KPI forecasts (DAU, revenue) without per-series tuning.`,
      `**Piecewise linear growth**, changepoints only in first 80% of data → recent trend shifts undetected.`,
      `**changepoint_prior_scale (default 0.05) is THE hyperparameter:** too high → trend explosion at boundary; too low → sluggish.`,
      `**MAP intervals (default) are too narrow** — capture only noise + changepoint sampling, not parameter uncertainty; use MCMC.`,
      `**add_regressor trap:** regressor must exist at forecast time — backtesting with actuals inflates accuracy.`,
      `**Fails on mean-reverting / volatile series** and <1-2yr history; validate via rolling-origin CV.`,
    ],
    figures: {
      prophet_additive: `<svg viewBox="0 0 360 192" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="11" fill="var(--ink-low)" font-size="7.5">g(t) — piecewise-linear growth (changepoints ▲, only first 80%)</text>
  <polyline fill="none" stroke="var(--prime)" stroke-width="1.5" points="8,34 120,24 230,26 352,10"/>
  <path d="M120,34 l-3,-5 l6,0 z" fill="var(--gold)"/>
  <path d="M230,34 l-3,-5 l6,0 z" fill="var(--gold)"/>
  <line x1="288" y1="6" x2="288" y2="186" stroke="var(--rim)" stroke-width="0.75" stroke-dasharray="2 3"/>
  <text x="291" y="184" fill="var(--ink-low)" font-size="6">forecast →</text>
  <text x="8" y="59" fill="var(--ink-low)" font-size="7.5">+ s(t) — Fourier seasonality (weekly N=3, yearly N=10)</text>
  <polyline fill="none" stroke="var(--green)" stroke-width="1.3" points="8,74 26,64 44,80 62,66 80,82 98,66 116,80 134,64 152,82 170,66 188,80 206,64 224,82 242,66 260,80 278,64 296,82 314,66 332,80 352,66"/>
  <text x="8" y="104" fill="var(--ink-low)" font-size="7.5">+ h(t) — holiday spikes (explicit calendar)</text>
  <line x1="8" y1="124" x2="352" y2="124" stroke="var(--rim)" stroke-width="0.75"/>
  <line x1="70" y1="124" x2="70" y2="110" stroke="var(--gold)" stroke-width="2"/>
  <line x1="185" y1="124" x2="185" y2="106" stroke="var(--gold)" stroke-width="2"/>
  <line x1="300" y1="124" x2="300" y2="112" stroke="var(--gold)" stroke-width="2"/>
  <text x="8" y="146" fill="var(--ink-hi)" font-size="7.5" font-weight="700">= y(t) forecast, with prediction interval</text>
  <path d="M8,176 L120,168 L230,170 L352,158 L352,150 L230,160 L120,158 L8,166 Z" fill="var(--prime-faint)" stroke="none"/>
  <polyline fill="none" stroke="var(--prime)" stroke-width="1.6" points="8,171 120,163 230,165 352,154"/>
  <text x="180" y="190" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">MAP intervals omit parameter uncertainty (too narrow) — use MCMC when width drives decisions</text>
</svg>`,
    },
  },

  {
    id: 'exponential_smoothing',
    title: 'Exponential Smoothing & ETS',
    subtitle: 'SES, Holt, Holt-Winters, ETS state space, connection to ARIMA, MLE tuning',
    difficulty: 'intermediate',
    estimatedMin: 40,
    tags: ['exponential smoothing', 'ETS', 'Holt-Winters', 'state space', 'SES', 'MLE'],
    summary: `ARIMA requires ACF/PACF identification to choose p, d, q — a manual process that breaks at scale and fails for practitioners without time series expertise. Exponential smoothing methods sidestep this by imposing a simple structural assumption: past observations should be weighted by recency, with exponentially decaying weights. SES does this for level; Holt's method adds a trend component; Holt-Winters adds seasonality.

[FIGURE: exp_decay_weights]

The mistake is treating these as heuristic update rules. ETS (Error-Trend-Seasonality) is a proper statistical state space model — it has a likelihood function, parameters estimated via MLE, and AIC-based model selection across 30 component combinations.

This means ETS implicitly performs ARIMA order selection without the ACF/PACF identification step, which is why ETS consistently outperforms ARIMA on large benchmark datasets like M3 and M4.`,
    keyPoints: [
      `**ARIMA order selection requires ACF/PACF interpretation, which is manual, error-prone, and impossible at scale.** ETS bypasses this entirely: it assumes exponentially decaying weights on past observations, estimates the decay parameter α via MLE, and selects among Error-Trend-Seasonality component combinations via AIC. The automation is the point — ETS delivers ARIMA-quality forecasts without per-series manual identification.`,
      `**Simple Exponential Smoothing (SES): ŷ_{t+1} = αY_t + (1-α)ŷ_t = Σ α(1-α)^j Y_{t-j}. α ∈ (0,1) controls recency weighting — α=1 is a naïve forecast (only yesterday matters), α→0 weights all history equally.** Optimal α is estimated by MLE. SES is the optimal forecast for a random walk with Gaussian noise — it is exactly equivalent to ARIMA(0,1,1) with θ = α-1. A high fitted α (e.g., 0.92) means the series has near-random-walk dynamics: past values beyond one period ago carry almost no predictive information.`,
      `**Holt's double exponential smoothing adds a trend component.** Level: L_t = αY_t + (1-α)(L_{t-1} + b_{t-1}). Slope: b_t = β(L_t - L_{t-1}) + (1-β)b_{t-1}. Forecast: ŷ_{t+h} = L_t + hb_t. Linear trend extrapolation at long horizons is dangerous — a series that has been trending up for 2 years is not guaranteed to continue. The damped trend variant (damped-trend Holt) multiplies the slope by φ^h with φ ∈ (0.8, 0.98): the slope shrinks toward zero at long horizons. This is one of the most reliable improvements for medium-horizon forecasting.`,
      `**Holt-Winters adds a seasonal component.** Additive: S_t = γ(Y_t - L_{t-1} - b_{t-1}) + (1-γ)S_{t-s}. Multiplicative: S_t = γ(Y_t / (L_{t-1} + b_{t-1})) + (1-γ)S_{t-s}. All parameters (α, β, γ) are estimated jointly by MLE — not independently. Multiplicative seasonality handles the case where seasonal amplitude scales with level; log-transforming and using additive is an equivalent approach.`,
      `**ETS(E, T, S) notation: E ∈ {A, M} for error type (additive or multiplicative), T ∈ {N, A, Ad, M, Md} for trend (none, additive, additive damped, multiplicative, multiplicative damped), S ∈ {N, A, M} for seasonality.** Up to 30 valid combinations. AIC over all valid ETS variants selects the best automatically — this is the equivalent of Box-Jenkins order selection done via likelihood comparison rather than ACF/PACF reading.`,
      `**ETS-ARIMA equivalence proves that exponential smoothing is not ad hoc.** SES (ETS(A,N,N)) = ARIMA(0,1,1). Holt's method (ETS(A,A,N)) = ARIMA(0,2,2). Holt-Winters additive (ETS(A,A,A)) = ARIMA(0,1,m+1)(0,1,0)[m]. ETS implicitly selects ARIMA order via structural assumptions rather than ACF/PACF exploration. This equivalence explains why ETS and ARIMA perform similarly on benchmark datasets — they're fitting the same class of models via different parameterisations.`,
      `**ETS outperforms ARIMA in practice for two reasons.** Parsimony: ETS has fewer parameters with stronger regularisation via structural assumptions, reducing overfitting on short series. Multiplicative error models: ETS(M,...) handles heteroskedasticity (variance increasing with level) naturally by multiplying the noise term by the current level. ARIMA with Gaussian errors assumes constant variance, which misspecifies series with growing amplitude. Holt-Winters multiplicative error produces correct prediction intervals for heteroskedastic series where ARIMA does not.`,
      `**Croston's method handles intermittent demand (series with many zeros) — separately exponentially smooths demand size and inter-demand interval.** SES and Holt-Winters produce nonzero forecasts even when zeros dominate, which is wrong by construction for spare-parts or SKU-level intermittent series. For series with more than 30-50% zeros, Croston or ADIDA (Aggregated-Disaggregated Intermittent Demand Approach) are the correct starting points.`,
    ],
    checkQuestions: [
      {
        q: `You fit SES to a daily sales series and find the optimal α = 0.92 via MLE. What does this imply about the data and what model class does SES correspond to at this parameter value?`,
        options: [
          `A) α ≈ 0.92 means almost all weight is on recent data, implying near-random-walk dynamics. SES with α ≈ 1 corresponds to ARIMA(0,1,1) with θ = α−1 ≈ −0.08 — forecasts collapse to the last observation.`,
          `B) α = 0.92 is an unusually high value indicating the MLE optimisation has converged to a poor local minimum; constrain α to the range [0.1, 0.5] and re-fit to obtain a more reliable parameter estimate.`,
          `C) α = 0.92 indicates strong long-range autocorrelation, because the high weight placed on recent observations causes information from many past periods to gradually accumulate in the smoothed level.`,
          `D) SES with α = 0.92 corresponds exactly to ARIMA(1,0,0) with φ = 0.92, because exponential smoothing and autoregression are mathematically equivalent constructions at all values of α.`,
        ],
        answer: `A`,
      },
      {
        q: `ETS(M,A,M) has multiplicative error, additive trend, multiplicative seasonality. Which TWO statements about it versus ETS(A,A,A) are correct?`,
        options: [
          `A) ETS(M,A,M) has multiplicative, heteroskedastic errors implying a log-normal-like forecast distribution whose variance grows with the level, unlike ETS(A,A,A)'s constant-variance Gaussian errors.`,
          `B) Because ETS(M,A,M)'s error variance is not constant, its prediction intervals must generally be computed via simulation rather than the closed-form analytical Gaussian formula that applies to ETS(A,A,A).`,
          `C) ETS(M,A,M) uses additive errors internally despite the M notation; the multiplicative label refers only to seasonality, so its interval formulas are identical to ETS(A,A,A)'s in every respect.`,
          `D) ETS(M,A,M) produces systematically narrower intervals than ETS(A,A,A), because multiplicative errors self-correct — deviations from trend become proportionally smaller as the overall level grows.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `The M4 forecasting competition showed that ETS and ARIMA individually perform worse than simple combination methods. How does this affect how you should use ETS in production?`,
        options: [
          `A) Model uncertainty is large enough that ensembling reduces variance without proportionally increasing bias. In production: ensemble ARIMA+ETS+Prophet, add a theta baseline, weight equally or via validation.`,
          `B) The M4 combination result applies only to the specific dataset distribution used inside that competition; for domain-specific series like retail or energy, a single well-tuned ETS model always outperforms naive combinations.`,
          `C) The M4 result means ETS should be abandoned entirely in favour of gradient-boosted tree models; the competition proved statistical methods are outclassed by machine learning regardless of combination strategy used.`,
          `D) Use ETS only ever as a component within combinations, never as a standalone model; always combine with at least 5 other distinct methods to reproduce the M4 accuracy gains reliably in production.`,
        ],
        answer: `A`,
      },
    ],
    takeaway: `ETS is not a heuristic — it is a proper state space model whose parameters are estimated by MLE and whose AIC-selected variant implicitly performs ARIMA order selection without the ACF/PACF identification step. The ETS-ARIMA equivalence (SES = ARIMA(0,1,1), Holt = ARIMA(0,2,2)) proves these are the same underlying model class in different parameterisations. The practical M4 conclusion: always ensemble ETS with ARIMA and a simple baseline, because model uncertainty across forecast horizons is large enough that combination consistently dominates any single method.`,
    recap: [
      `**Exponential smoothing = recency-weighted average**, sidesteps ACF/PACF identification.`,
      `**SES (level) → Holt (+trend) → Holt-Winters (+seasonality)**; all params estimated jointly by MLE.`,
      `**Damped trend** (slope × φ^h, φ∈0.8–0.98) — most reliable medium-horizon improvement.`,
      `**ETS(E,T,S)** = proper state space model; AIC over ~30 variants auto-selects (Box-Jenkins via likelihood).`,
      `**ETS-ARIMA equivalence:** SES=ARIMA(0,1,1), Holt=ARIMA(0,2,2) — same model class, different parameterisation.`,
      `**Multiplicative-error ETS handles heteroskedasticity** (variance grows with level) where Gaussian ARIMA misspecifies.`,
      `**Croston's for intermittent demand** (>30-50% zeros); **M4 lesson:** always ensemble ETS+ARIMA+baseline.`,
    ],
    figures: {
      exp_decay_weights: `<svg viewBox="0 0 360 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">SES weight on past observations: α(1−α)ʲ  (here α = 0.5)</text>
  <line x1="20" y1="104" x2="352" y2="104" stroke="var(--rim)" stroke-width="0.75"/>
  <rect x="24"  y="24"  width="26" height="80" rx="2" fill="var(--prime)"/>
  <rect x="66"  y="64"  width="26" height="40" rx="2" fill="var(--prime)" opacity="0.85"/>
  <rect x="108" y="84"  width="26" height="20" rx="2" fill="var(--prime)" opacity="0.7"/>
  <rect x="150" y="94"  width="26" height="10" rx="2" fill="var(--prime)" opacity="0.55"/>
  <rect x="192" y="99"  width="26" height="5"  rx="2" fill="var(--prime)" opacity="0.45"/>
  <rect x="234" y="101" width="26" height="3"  rx="2" fill="var(--prime)" opacity="0.35"/>
  <rect x="276" y="102" width="26" height="2"  rx="2" fill="var(--prime)" opacity="0.28"/>
  <rect x="318" y="103" width="26" height="1"  rx="2" fill="var(--prime)" opacity="0.22"/>
  <text x="37"  y="118" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">Yₜ</text>
  <text x="79"  y="118" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">Yₜ₋₁</text>
  <text x="121" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">Yₜ₋₂</text>
  <text x="163" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">Yₜ₋₃</text>
  <text x="205" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">Yₜ₋₄</text>
  <text x="290" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">older…</text>
  <text x="352" y="30" text-anchor="end" fill="var(--ink-low)" font-size="6.5">α→1: only yesterday (≈random walk)</text>
  <text x="352" y="42" text-anchor="end" fill="var(--ink-low)" font-size="6.5">α→0: weights all history equally</text>
</svg>`,
    },
  },

  {
    id: 'neural_forecasting',
    title: 'Neural Forecasting',
    subtitle: 'N-BEATS, N-HiTS, TFT, PatchTST, when transformers lose to MLPs, foundation models',
    difficulty: 'advanced',
    estimatedMin: 60,
    tags: ['N-BEATS', 'N-HiTS', 'TFT', 'PatchTST', 'transformer', 'neural forecasting', 'TimeGPT', 'MOIRAI'],
    summary: `Electricity demand forecasting is the benchmark problem for neural time series methods: 1-year history, predict 24 hours ahead. A sequence of Transformer-based papers — Informer, Autoformer, FEDformer — each claimed state-of-the-art on this benchmark. Then a 2023 paper (Zeng et al.) showed that a single linear layer applied to the flattened lookback window outperforms all of them. The reason exposes a structural flaw: Transformer attention is permutation-equivariant. Attention scores are computed from pairwise content similarity — dot products of embeddings — not from temporal position. Shuffle the timestamps and performance barely changes. A model that ignores temporal order cannot model autocorrelation, trend, or seasonality.

[FIGURE: attention_permutation]
 Positional encodings are added but don't fix this — they make position part of the content, which still allows position-insensitive mixing.

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
        q: `A colleague reports Informer beats ARIMA by 15% lower MSE on ETT. Which TWO checks are appropriate before trusting this result?`,
        options: [
          `A) Compare against DLinear, which Zeng et al. showed outperforms Informer on the ETT benchmark, and verify both models use identical lookback windows and forecast horizons in the comparison.`,
          `B) Confirm the test split was not used anywhere during Informer's hyperparameter tuning; leakage from the test set into tuning would inflate the reported 15% MSE improvement over ARIMA artificially.`,
          `C) Accept the result immediately as-is — a 15% MSE reduction is large enough to be practically significant on its own and unlikely to be explained away by evaluation methodology differences at all.`,
          `D) The Informer result is simply impossible — Zeng et al. definitively proved Transformer architectures can never outperform linear models on any time series benchmark, so the colleague must have erred.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You need to forecast hourly electricity demand for 1000 substations, 168 hours ahead (one week). You have 3 years of historical data per substation. TFT vs N-HiTS vs SARIMA — which do you use and why?`,
        options: [
          `A) SARIMA per-substation is the correct choice here; 3 years of hourly data provides more than sufficient history for reliable parameter estimation, and statistical methods stay more interpretable for utility operators.`,
          `B) TFT is always the single best choice for multi-step forecasting with multiple series, because its variable selection network automatically identifies the most informative features without any manual engineering.`,
          `C) N-HiTS is the strongest start: hierarchical pooling handles the 168h horizon well, a global model beats 1000 SARIMAs, SARIMA can't handle double seasonality. Use TFT with covariates; keep a SARIMA baseline.`,
          `D) Ensemble all three approaches equally; with 3 years of data per substation the computation cost of fitting all three models is negligible, and an equal-weight ensemble always outperforms any individual model chosen alone.`,
        ],
        answer: `C`,
      },
      {
        q: `You train a TimeGPT zero-shot model on a new domain (pharmaceutical sales) without fine-tuning. It performs worse than Holt-Winters. When would you expect a foundation model to outperform statistical methods, and what limits them?`,
        options: [
          `A) Foundation models always outperform statistical methods given enough compute budget; the underperformance observed here indicates a bug in the TimeGPT API call rather than any genuine model limitation.`,
          `B) Outperform when: cold start (<30 obs), heterogeneous portfolios, or domain well-represented in pretraining. Here: pharma patterns differ from pretraining; 3yr data favors Holt-Winters instead.`,
          `C) Foundation models outperform only on strictly univariate series; with multivariate pharmaceutical sales data the zero-shot performance will always be structurally degraded compared to univariate statistical methods.`,
          `D) Fine-tune TimeGPT on the full 3 years of pharmaceutical data; zero-shot performance is always poor by design, but after fine-tuning foundation models uniformly outperform statistical methods regardless of domain.`,
        ],
        answer: `B`,
      },
      {
        q: `What is the doubly residual architecture in N-BEATS and why does it improve forecasting over a plain deep MLP?`,
        options: [
          `A) Doubly residual means N-BEATS uses two separate residual streams — one for an AR component and one for an MA component — directly analogous to ARMA, which is why it outperforms plain MLPs on time series.`,
          `B) Doubly residual refers to applying dropout twice per block, once after each fully-connected layer, which provides stronger regularisation than standard single-dropout MLPs and reduces overfitting on short series.`,
          `C) Each block produces a backcast b̂_t and forecast f̂_{t+h}; the backcast is subtracted before the next block (x_{t+1}=x_t−b̂_t), forecasts sum across blocks. Each block only learns what prior blocks couldn't explain.`,
          `D) Doubly residual means N-BEATS applies a residual connection at both the block level and the stack level; the block connection handles short-range patterns while the stack handles long-range trends instead.`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Transformer self-attention ignores temporal order by design, which is why DLinear outperforms Informer on standard benchmarks — always include DLinear as a baseline before claiming any neural forecasting win. N-HiTS retains temporal inductive bias through hierarchical multi-rate MLP stacks and beats N-BEATS on long horizons; TFT is competitive only when rich covariates exist. Foundation models win exactly one scenario: cold start with fewer than 30 observations per series.`,
    recap: [
      `**Transformer attention is permutation-equivariant** — ignores temporal order; shuffling timestamps barely changes MSE.`,
      `**DLinear (one linear layer) beats Informer/Autoformer/FEDformer** — mandatory baseline before any neural claim.`,
      `**N-BEATS doubly-residual:** each block backcasts + forecasts, subtracts before next → smaller task per block.`,
      `**N-HiTS adds hierarchical multi-rate sampling** — beats N-BEATS beyond 96-step horizons, handles double seasonality.`,
      `**TFT competitive only with rich covariates.**`,
      `**Foundation models (TimeGPT, MOIRAI) win exactly one case:** cold start, <30 obs/series.`,
      `**With 2+ years of in-domain data, local/global models trained on your data dominate zero-shot.**`,
    ],
    figures: {
      attention_permutation: `<svg viewBox="0 0 360 156" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="12" fill="var(--ink-low)" font-size="8">Self-attention scores from content similarity, not position…</text>
  <text x="8" y="34" fill="var(--ink-mid)" font-size="7.5">original</text>
  <text x="8" y="80" fill="var(--ink-mid)" font-size="7.5">shuffled</text>
  <g font-size="8" font-weight="700" text-anchor="middle">
    <rect x="70"  y="24" width="26" height="18" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="83"  y="37" fill="var(--ink-hi)">x1</text>
    <rect x="120" y="24" width="26" height="18" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="133" y="37" fill="var(--ink-hi)">x2</text>
    <rect x="170" y="24" width="26" height="18" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="183" y="37" fill="var(--ink-hi)">x3</text>
    <rect x="220" y="24" width="26" height="18" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="233" y="37" fill="var(--ink-hi)">x4</text>
    <rect x="270" y="24" width="26" height="18" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="283" y="37" fill="var(--ink-hi)">x5</text>
    <rect x="70"  y="66" width="26" height="18" rx="3" fill="var(--depth)" stroke="var(--rim)"/><text x="83"  y="79" fill="var(--ink-mid)">x3</text>
    <rect x="120" y="66" width="26" height="18" rx="3" fill="var(--depth)" stroke="var(--rim)"/><text x="133" y="79" fill="var(--ink-mid)">x1</text>
    <rect x="170" y="66" width="26" height="18" rx="3" fill="var(--depth)" stroke="var(--rim)"/><text x="183" y="79" fill="var(--ink-mid)">x5</text>
    <rect x="220" y="66" width="26" height="18" rx="3" fill="var(--depth)" stroke="var(--rim)"/><text x="233" y="79" fill="var(--ink-mid)">x2</text>
    <rect x="270" y="66" width="26" height="18" rx="3" fill="var(--depth)" stroke="var(--rim)"/><text x="283" y="79" fill="var(--ink-mid)">x4</text>
  </g>
  <text x="8" y="108" fill="var(--ink-hi)" font-size="8" font-weight="700">…so MSE barely changes → attention ignores temporal order</text>
  <rect x="8" y="118" width="344" height="28" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="180" y="135" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">DLinear — one linear layer on the flattened window —</text>
  <text x="180" y="145" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">beats Informer / Autoformer / FEDformer</text>
</svg>`,
    },
  },

  {
    id: 'forecast_evaluation',
    interactiveId: 'walk_forward_viz',
    title: 'Forecast Evaluation',
    subtitle: 'MASE, pinball loss, Winkler score, Diebold-Mariano, rolling vs expanding window',
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['MASE', 'MAPE', 'pinball loss', 'Winkler score', 'Diebold-Mariano', 'backtesting', 'lookahead bias'],
    summary: `MAPE is the default metric most teams use, and it has three distinct failure modes that make it actively misleading. It's undefined when actuals are near zero (division by zero). It systematically biases selection toward models that underpredict, because over-forecasts generate larger percentage errors than under-forecasts of equal absolute magnitude. And it's not comparable across series with different scales. MASE solves all three by normalising against the in-sample naïve forecast — scale-free, symmetric, defined when Y_t = 0, and interpretable (MASE < 1 means you beat the naïve baseline). But metric choice is the second problem. The first is backtesting design: a rolling-origin evaluation that faithfully simulates production conditions is the only reliable proxy for live performance. Fitting normalisation scalers on the full dataset including the test period is ubiquitous and inflates reported performance by 5-15% — not from overfitting the model, but from the preprocessing pipeline implicitly seeing the future.`,
    interactivePrompt: `Before you touch the controls: with a fixed dataset length, what do you trade away when you lengthen the forecast horizon — and how does switching from expanding to rolling change the number of usable backtest folds?`,
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
          `A) Trust Model A unconditionally in this case — MAPE is the industry-standard metric and a 4-percentage-point gap is large enough to hold up even after excluding the near-zero series entirely.`,
          `B) MAPE is unreliable when 15% of series have Y_t<5, since those dominate with inflated percentage errors. Compute MASE and separately evaluate the near-zero subset; prefer MAE/MASE if cost is absolute.`,
          `C) Exclude the 15% near-zero series from evaluation entirely and report only on the remainder; MAPE remains valid and directly comparable for the remaining 85% of series where Y_t ≥ 5.`,
          `D) Apply symmetric MAPE (sMAPE) instead of standard MAPE to both models; sMAPE is fully well-defined for near-zero values and will give the statistically correct comparison between Model A and Model B.`,
        ],
        answer: `B`,
      },
      {
        q: `You are comparing two forecasting models across 1,000 series. How do you statistically test which model is better, controlling for the multiple-series problem?`,
        options: [
          `A) Run the Diebold-Mariano test once on the concatenated forecast errors from all 1000 series; treating the full error sequence as one long time series controls for the multiple-comparison problem automatically.`,
          `B) Apply a Bonferroni correction: run Diebold-Mariano separately per-series at significance level α/1000; declare a model the winner if it's significantly better on the majority of series after correction.`,
          `C) Compute per-series MASE, take d_i=MASE₁ᵢ−MASE₂ᵢ, run a paired t-test/Wilcoxon on {d_i}, bootstrap for robustness. Effect size beats p-value: report median MASE gap and fraction of series each model wins.`,
          `D) Use a fixed-effects panel regression of forecast errors on a model-indicator variable with series fixed effects; the coefficient on this indicator is the average performance difference controlling for series heterogeneity.`,
        ],
        answer: `C`,
      },
      {
        q: `You fit your preprocessing pipeline (including Z-score normalisation) on the full training+test set combined, evaluate on the held-out test, and get MASE = 0.83. What is wrong and how large could the bias be?`,
        options: [
          `A) Nothing is wrong here — Z-score normalisation is a purely linear transformation that cannot introduce lookahead bias; only non-linear preprocessing steps like Box-Cox create genuine evaluation artifacts.`,
          `B) The issue is that MASE = 0.83 is suspiciously close to 1.0; the bias comes from normalising the entire dataset, which makes the naïve benchmark appear artificially strong rather than the model appearing accurate.`,
          `C) Lookahead bias: Z-score on train+test uses test-period mean/std, encoding future level info. Biases MASE toward underestimating error, inflating accuracy 5-15% for non-stationary series. Fix: fit scaler on train only.`,
          `D) The bias direction is toward overestimating error, not underestimating it; including test-period variance in the scaler inflates the Z-score denominator, making test errors appear larger than they truly are in production.`,
        ],
        answer: `C`,
      },
      {
        q: `A PM asks why your 95% prediction interval contains the actual value only 81% of the time in production. Which TWO statements are correct?`,
        options: [
          `A) 81% coverage on a 95% target means the intervals are too narrow (overconfident); likely causes include Gaussian likelihoods underestimating tail risk and MAP estimation not propagating parameter uncertainty.`,
          `B) Diagnosing under-coverage requires checking empirical coverage broken out by forecast horizon and comparing the PIT histogram against a uniform distribution, not just trusting the single aggregate interval width.`,
          `C) 81% coverage against a 95% PI target is well within acceptable sampling variation for any reasonably sized test set, so the gap is not statistically significant and requires no further investigation at all.`,
          `D) The coverage gap is caused exclusively by parameter uncertainty not propagated through MAP estimation; simply switching from MAP to MCMC sampling will restore full 95% coverage without any further diagnosis.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    takeaway: `MAPE misleads in three ways simultaneously: it's undefined for zero-valued series, penalises over-forecasting more than under-forecasting of equal absolute magnitude, and can't be compared across series with different scales. MASE solves all three and should be the default metric. The more consequential failure mode is backtesting design: fitting preprocessing (normalisation, scaling) on the full dataset including test data is a ubiquitous form of lookahead bias that inflates reported MASE by 5-15% — not from overfitting the model, but from the scaler implicitly encoding future level information.`,
    recap: [
      `**MAPE fails 3 ways:** undefined at Y=0, penalises over- more than under-forecasting, not scale-comparable.`,
      `**MASE = MAE / naïve-MAE** — scale-free, symmetric, defined at zero; <1 beats naïve. Default metric (M4).`,
      `**Probabilistic eval:** pinball/quantile loss → CRPS; Winkler score penalises width + misses.`,
      `**Diebold-Mariano** tests equal expected loss; across many series use paired t-test/Wilcoxon on per-series MASE.`,
      `**Effect size > p-value:** a significant 0.001 MASE gap is operationally irrelevant.`,
      `**Expanding window** (stationary DGP) vs **rolling window** (non-stationary); rolling gives more cutoffs.`,
      `**Lookahead bias inflates MASE 5-15%:** fit ALL preprocessing on train only; touch test set exactly once.`,
    ],
  },

  {
    id: 'ts_anomaly_detection',
    title: 'Time Series Anomaly Detection',
    subtitle: 'Point/contextual/collective anomalies, CUSUM, STL residuals, LSTM autoencoders, adaptive thresholds',
    difficulty: 'advanced',
    estimatedMin: 55,
    tags: ['anomaly detection', 'CUSUM', 'STL', 'LSTM autoencoder', 'isolation forest', 'contextual anomaly'],
    summary: `Time series anomaly detection fails in production for one specific reason more than any other: teams apply a threshold to the raw series instead of the residuals of a properly specified seasonal and trend model. An API error rate of 10,000 per minute is normal during peak traffic and anomalous at 3am — but a static threshold treats both identically. The raw series conflates seasonality, trend, and anomaly signal into a single number; a threshold on raw values fires whenever any component is high, including seasonality that's entirely expected. Decompose first, threshold on the residuals, and nearly all seasonality-driven false positives disappear. The quality ceiling for any anomaly detector is the quality of its baseline model — the residuals are only as clean as the decomposition.`,
    keyPoints: [
      `**Applying a static threshold to a seasonal series produces false positives every time the seasonal component peaks — not because anything unusual happened, but because the underlying cycle reached its expected high.** Decompose Y_t = T_t + S_t + R_t, then threshold R_t. Point anomaly: |R_t| > k·σ_R where σ_R is an IQR-based robust standard deviation and k=3-4. The decomposition removes expected variation; the threshold detects unexpected deviation. This single change eliminates the majority of seasonality-driven false positives in most production monitoring systems.`,
      `**Three anomaly types require different detection strategies.** Point anomalies: a single observation far from expected (latency spike, sensor error). Contextual anomalies: a value normal in one context but anomalous in another — 500 sales on a random Tuesday versus 500 sales on Black Friday (should be 50,000). Collective anomalies: a sequence of individually normal observations that are jointly anomalous — 5 days of conversion rate 1% below normal, each individually within tolerance but collectively a significant degradation. Each type requires a different detection approach.`,
      `**CUSUM (Cumulative Sum Control Chart): C_t = max(0, C_{t-1} + (Y_t − μ₀ − k)).** Alert when C_t > h. Directional — it accumulates evidence of sustained shift rather than reacting to single spikes. This makes CUSUM naturally suited for detecting collective anomalies (sustained shifts) and resistant to false positives from individual noisy observations. Requires specifying μ₀ and k — doesn't adapt to non-stationary baselines or seasonality without preprocessing (decompose first, then apply CUSUM to residuals).`,
      `**Isolation Forest for time series requires careful feature engineering.** Applied to raw values, it ignores temporal structure entirely — it doesn't know that observation 100 follows observation 99. The correct input is a feature matrix: lag values [Y_{t-1}, Y_{t-2}, ...], rolling mean, rolling std, time-of-day, day-of-week. Without lag features, Isolation Forest is a point anomaly detector with no temporal awareness. It also cannot detect collective anomalies without explicit sliding window features encoding the joint distribution of a sequence.`,
      `**LSTM Autoencoders encode a time window and decode it back, using reconstruction error as the anomaly score.** Trained on normal data only. High reconstruction error = the window is unusual relative to training distribution. The production problem is threshold calibration: the reconstruction error distribution shifts as the system drifts (concept drift), so a static threshold set at training time produces increasing false positives over time. Use a rolling calibration window — 99th percentile of reconstruction error over the past 7-14 days as the threshold, updated daily.`,
      `**Adaptive thresholds are necessary when variance is non-constant, when the series has multiple operating modes, or when you need to directly control the alert rate.** Static 3-sigma fails on all three counts. EWMA control charts adapt to recent variance. Quantile regression estimates conditional quantiles as functions of time features (capturing time-varying variance). Conformal prediction provides coverage-guaranteed anomaly scores without distributional assumptions — the alert fires when the score falls in the top α fraction of calibration set scores, guaranteeing at most α false positive rate by construction.`,
      `**Root cause vs symptom: a single upstream failure propagates through a dependency graph and produces correlated anomalies across dozens of downstream metrics simultaneously, flooding the alert queue.** A DB failure causes API latency, cache miss rate, and error rate to all spike within seconds. Alert flooding without root cause identification means incident responders chase symptoms while the root cause persists. Multi-variate anomaly detection finds correlated joint anomalies; causal graph traversal identifies whether the anomaly originated upstream or is local. Alert correlation groups alerts firing within the same time window into a single incident.`,
      `**Evaluation when labels are scarce: PR-AUC (precision-recall) beats ROC-AUC for imbalanced anomaly detection — imbalance is extreme (1 anomaly per 1000 normal observations), so ROC-AUC is dominated by the large number of true negatives.** NAB (Numenta Anomaly Benchmark) score rewards early detection within a window before impact — detection two hours late is still valuable, just less so than detection immediately. Precision@k (fraction of top-k flagged events that are true anomalies) is practical when operators review top-ranked alerts. When labels cover only a small subset of a much larger population (50 of 10,000 sensors), evaluation can't stop there: check that the labeled subset is representative of the rest (similar sensor types, deployment conditions, failure modes) before trusting it to generalize; inject synthetic anomalies into the unlabeled sensors to get a proxy precision/recall reading where no real labels exist; monitor alert-rate drift over time as an unsupervised health check — a sudden change in firing rate with no matching real-world event usually means the model or data distribution moved, not that anomalies increased; and route a sample of unlabeled-sensor alerts to human reviewers to estimate live precision directly.`,
    ],
    checkQuestions: [
      {
        q: `Your 3-sigma threshold on raw API error rate generates 200 false-positive alerts per day from seasonality. Which TWO fixes are correct?`,
        options: [
          `A) Decompose the series with STL first, compute residuals R_t=Y_t−T_t−S_t, and threshold on those residuals rather than the raw series — this removes seasonality-driven false positives directly at the source.`,
          `B) An EWMA control chart applied to the residuals, with the alert rate calibrated via a rolling percentile of recent residual magnitude, adapts the threshold as normal behaviour gradually drifts over time.`,
          `C) Increase the threshold from 3-sigma to 5-sigma across the raw series; the higher threshold alone will reduce false positives caused by seasonal peaks without requiring any decomposition step at all.`,
          `D) Apply separate 3-sigma thresholds for each hour and day of week directly on the raw series; stratifying by calendar period alone fully substitutes for an explicit trend-and-seasonal decomposition model.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You use an LSTM autoencoder for multivariate anomaly detection on 50 metrics. The reconstruction error correctly identifies an outage on day 15 of deployment, but by day 90 the false positive rate has tripled. What happened and how do you fix it?`,
        options: [
          `A) The LSTM autoencoder has overfit specifically to the day-15 outage pattern and now flags any deviation from that exact pattern as anomalous; retrain on a dataset that fully excludes the day-15 outage window.`,
          `B) The 50-metric input dimensionality causes the autoencoder to gradually memorise normal patterns rather than generalise; apply PCA to reduce to 10 components before feeding the data into the autoencoder.`,
          `C) The LSTM hidden state becomes numerically saturated after 90 days of continuous streaming inference; reset the hidden state every 7 days and the false positive rate will return to its original baseline level.`,
          `D) Concept drift: normal behaviour shifted but the autoencoder still uses day-0 distribution. Fix: periodic retraining on a rolling 30-60 day window, plus an adaptive threshold at the 99th percentile of recent errors.`,
        ],
        answer: `D`,
      },
      {
        q: `You detect a latency spike anomaly in your API service. Your colleague says it is a "real anomaly." You say it is a downstream symptom. How do you distinguish, and what are the implications for incident response?`,
        options: [
          `A) Check whether the API latency anomaly score exceeds the 99th versus 95th percentile threshold; a score above the 99th percentile indicates a root cause, while a 95th-percentile score indicates a downstream symptom.`,
          `B) Run a Granger causality test from upstream metrics to API latency; if the test is significant at p < 0.05, the API latency is confirmed to be a downstream symptom driven purely by the upstream metric.`,
          `C) Check temporal order (did DB anomaly precede latency?), trace the call graph, cross-correlate anomaly times for earliest onset. Mitigating the symptom causes incorrect incident response — build a causal graph.`,
          `D) Always treat the first anomaly detected in the alert queue as the root cause regardless of metric type; downstream symptoms always appear simultaneously with root causes since distributed systems propagate in sub-seconds.`,
        ],
        answer: `C`,
      },
      {
        q: `You are designing an anomaly detection system for 10,000 IoT sensors. Labelled anomalies exist for only 50 sensors. How do you evaluate model performance across all 10,000?`,
        options: [
          `A) Evaluate only on the 50 labelled sensors and stop there; performance on the remaining unlabelled sensors cannot be meaningfully measured, and reporting it would misrepresent overall model quality.`,
          `B) Use the 50 labelled sensors purely to tune alert thresholds, then apply those thresholds uniformly across all 10,000 sensors and report the resulting alert rate as the primary evaluation metric.`,
          `C) Train a semi-supervised model treating the 50 labelled sensors as positives and every remaining sensor as a negative example; the resulting F1-score on the 50 labelled sensors alone is sufficient evaluation.`,
          `D) Supervised eval on 50 (PR-AUC/F1), check representativeness; synthetic anomaly injection on unlabelled sensors; monitor alert-rate drift; human-review a sample of alerts for precision.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Nearly all production false-positive problems in time series anomaly detection trace back to applying a threshold to the raw series instead of the residuals of a properly specified seasonal+trend model. The decompose-first, threshold-on-residuals pattern eliminates seasonality-driven false positives immediately. The second most important insight is distinguishing root causes from downstream symptoms via causal graph traversal: a single upstream failure floods the alert queue with correlated alerts across dozens of metrics, and incident response fails when teams chase symptoms while the root cause persists.`,
    recap: [
      `**#1 production failure:** thresholding the raw series instead of decomposition residuals → seasonal false positives.`,
      `**Decompose \`Y=T+S+R\`, threshold R_t** (|R|>k·σ, IQR-based, k=3-4) — kills seasonality-driven alerts.`,
      `**Three types:** point (single spike), contextual (500 sales normal Tue vs Black Friday), collective (sustained drift).`,
      `**CUSUM** accumulates evidence of sustained shift — good for collective anomalies, resistant to single spikes.`,
      `**LSTM autoencoder:** reconstruction error as score, trained on normal data; needs rolling threshold recalibration (concept drift).`,
      `**Adaptive thresholds** (EWMA, quantile regression, conformal) beat static 3-sigma; conformal guarantees ≤α FPR.`,
      `**Root cause vs symptom:** one upstream failure floods alerts across metrics — trace causal graph, don't chase symptoms.`,
      `**Imbalanced eval:** PR-AUC beats ROC-AUC; NAB rewards early detection.`,
    ],
  },

  {
    id: 'causal_ts',
    title: 'Causal Inference in Time Series',
    subtitle: 'Granger causality, ITS, synthetic control, CausalImpact, DiD, temporal autocorrelation',
    difficulty: 'advanced',
    estimatedMin: 65,
    tags: ['Granger causality', 'CausalImpact', 'synthetic control', 'interrupted time series', 'DiD', 'BSTS'],
    summary: `Granger causality is the most widely misused concept in applied time series work. It answers a predictive question — does X help predict Y beyond Y's own past? — not a causal one. A shared upstream cause Z that affects both X and Y with different lags produces Granger causality between X and Y with zero direct relationship. Knowing that search volume Granger-causes sales tells you nothing about whether investing in SEO will increase sales. The tools that actually support causal claims — synthetic control, CausalImpact, interrupted time series, difference-in-differences — all require a credible counterfactual: what would have happened to the treated unit absent the intervention.

[FIGURE: causal_counterfactual]
 The harder problem in practice is staggered rollouts, where different units receive treatment at different times. Standard two-way fixed effects DiD is biased under treatment effect heterogeneity in this case — already-treated units contaminate the control group — and the fix (Callaway-Sant'Anna) is not widely known.`,
    keyPoints: [
      `**Granger causality tests whether lagged X improves prediction of Y beyond lagged Y alone — it is a predictive test, not a causal test.** A shared upstream cause Z that affects both X and Y with different lags produces Granger causality X → Y with no direct mechanism. TV advertising that simultaneously increases search volume and sales will produce Granger causality from search to sales even if search has no causal effect on sales. The correct interpretation: "X has predictive information about Y beyond Y's own past." The incorrect interpretation: "changing X will change Y."`,
      `**Interrupted Time Series (ITS): OLS regression: Y_t = β₀ + β₁T + β₂D_t + β₃(T − T*)D_t + ε_t, where D_t = 1{t ≥ T*}. β₂ is the immediate level change; β₃ is the slope change post-intervention.** Critical assumptions: no other intervention coincides at T*, the pre-period trend extrapolates cleanly, and residuals are not autocorrelated (autocorrelated residuals underestimate SE — use Prais-Winsten or Newey-West correction). ITS works without any control unit but requires a credible counterfactual from the pre-period trend extrapolation.`,
      `**Synthetic control (Abadie et al.): constructs a weighted combination of control units that matches the treated unit's pre-treatment outcomes as closely as possible.** The post-treatment gap (treated − synthetic control) is the estimated treatment effect. The critical advantage over DiD: pre-treatment fit quality is directly observable — you can see whether the synthetic control matches the treated unit before claiming an effect. If pre-period fit is poor, the counterfactual is unreliable and the treatment effect estimate is invalid.`,
      `**CausalImpact (Brodersen et al., Google 2015): Bayesian Structural Time Series fitted on the pre-intervention treated series using control series as regressors.** Post-intervention: extrapolate the counterfactual; treatment effect = observed − counterfactual with full posterior credible intervals. Key assumptions: the relationship between treated and control series is stable across the intervention, and the pre-period is long enough and rich enough for BSTS to estimate that relationship reliably — a short or noisy pre-period gives a wide, unreliable counterfactual regardless of model correctness. If control series were independently affected by the intervention (spillover), the counterfactual is polluted and the effect estimate is biased. Unlike DiD, CausalImpact does not require strict parallel trends — only that the treated/control relationship stays stable, a weaker and often more realistic condition.`,
      `**Difference-in-Differences: DiD = (Y_{treated,post} − Y_{treated,pre}) − (Y_{control,post} − Y_{control,pre}).** The parallel trends assumption requires that the treated and control units would have moved identically absent the treatment. Temporal autocorrelation within units inflates t-statistics — cluster standard errors at the unit level. Always plot pre-trend event study coefficients to validate parallel trends before reporting a single DiD estimate.`,
      `**Staggered DiD and the TWFE bias: when different units receive treatment at different times, two-way fixed effects (TWFE) regression uses already-treated units as controls for later-treated units.** With heterogeneous treatment effects (e.g., the effect grows over time), TWFE produces estimates that can be negatively weighted — some comparisons literally subtract true treatment effects. Callaway-Sant'Anna computes cohort-specific ATTs (average treatment effects for each treatment cohort) using only clean controls (never-treated or not-yet-treated) and aggregates properly. Sun-Abraham is a closely related fix: it uses cohort-by-relative-time interaction terms in an event-study regression (rather than CS's group-time ATT estimation) to get unbiased dynamic treatment-effect estimates under the same staggered-timing conditions. Either estimator resolves the TWFE bias, and the two are commonly cited together as "heterogeneity-robust" staggered-DiD estimators.`,
      `**Temporal autocorrelation breaks standard causal methods in specific ways.** IV exclusion restrictions become implausible when instrument and outcome share autocorrelated common trends. Regression discontinuity with time as the running variable is especially fragile — observations near the cutoff are highly correlated, conflating the treatment effect with local autocorrelation. Time-varying confounding requires marginal structural models (MSM) with inverse probability of treatment weighting (IPTW), not cross-sectional propensity score matching.`,
      `**Event study (dynamic DiD): estimate effects at each relative time period with Y_{it} = αᵢ + λ_t + Σ_{k≠-1} δ_k 1{t − G_i = k} + ε_{it}.** Pre-treatment δ_k coefficients (k < 0) test parallel trends — a joint F-test on pre-treatment periods is the validation. Post-treatment coefficients show dynamic effect trajectory. Always visualise as an event study plot before reporting a single DiD estimate — if pre-treatment effects are nonzero, the parallel trends assumption fails and the DiD estimate is biased.`,
    ],
    checkQuestions: [
      {
        q: `Google search volume Granger-causes weekly sales (p<0.001). A PM wants to invest in SEO to raise sales. Which TWO statements identify the problem correctly?`,
        options: [
          `A) Granger causality shows lagged search predicts sales beyond sales' own past values — it is fundamentally a predictive test, not proof that deliberately raising search volume will causally raise sales.`,
          `B) A shared upstream cause, such as TV advertising simultaneously driving both search volume and sales, can produce Granger causality between search and sales with no direct causal mechanism between them at all.`,
          `C) The reasoning here is correct as stated; Granger causality at p<0.001 is strong enough statistical evidence on its own to justify the SEO investment, since it demonstrates search is a leading indicator of sales.`,
          `D) The Granger test is invalid because weekly sales data violates the stationarity assumption required for VAR estimation entirely; first-difference both series and re-run the whole test before any conclusion.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You are measuring the impact of a new feature launched to users in Germany on January 15. You have daily active users (DAU) data for Germany (treated) and France (control) from January 2023 onwards. How do you use CausalImpact and what assumptions must hold?`,
        options: [
          `A) Fit BSTS on France DAU using Germany DAU as the regressor during the pre-period, then extrapolate post-launch to estimate the counterfactual France trajectory, assuming a stable pre-period relationship.`,
          `B) Run a simple pre-post t-test comparing Germany DAU before and after January 15; CausalImpact is only ever needed when you have multiple control units available, not a single control country like France.`,
          `C) Use both Germany and France data together in a DiD estimator with country and time fixed effects instead; CausalImpact is only appropriate when there is no control group available at all.`,
          `D) Pre=before Jan 15, post=after. Fit BSTS on Germany DAU with France as regressor, extrapolate post-launch. Assumptions: stable relationship, no spillover, adequate pre-period for BSTS to fit reliably — and unlike DiD, no strict parallel-trends requirement.`,
        ],
        answer: `D`,
      },
      {
        q: `Your company rolls out a pricing change to different markets in different months over a 6-month window. You use TWFE DiD to estimate the effect. A colleague says your estimate is biased. Why and what do you do?`,
        options: [
          `A) TWFE is biased because staggered rollout violates the parallel trends assumption entirely; adding market-specific linear time trends into the TWFE regression will correct the bias without changing the estimator itself.`,
          `B) TWFE DiD is fully unbiased under staggered rollout as long as you cluster standard errors at the market level; the colleague is simply confusing standard-error bias with point-estimate bias in this case.`,
          `C) Staggered timing invalidates TWFE — already-treated markets act as controls for later ones, and with heterogeneous effects TWFE weights can go negative. Use Callaway-Sant'Anna or Sun-Abraham instead.`,
          `D) TWFE is biased only when treatment assignment is non-random; since the rollout schedule was set by the company itself, treatment is as-good-as-random and TWFE gives an unbiased estimate of the average treatment effect.`,
        ],
        answer: `C`,
      },
      {
        q: `You want to estimate the causal effect of an algorithm change on user engagement, but the change was rolled out gradually to all users with no holdout group. CausalImpact, synthetic control, and ITS all require a control group or counterfactual. What do you do?`,
        options: [
          `A) Use a simple pre-post comparison with a paired t-test on engagement metrics measured before and after the rollout date; without any control group, this is the only statistically valid causal identification strategy.`,
          `B) Retrospectively identify a set of users who happened to adopt the new algorithm later as a natural control group; compare early adopters against late adopters directly using a standard DiD estimator.`,
          `C) Apply CausalImpact using a competitor platform's engagement metric as the control regressor; competitor metrics are always valid synthetic controls to use for internal product changes like this.`,
          `D) Without a holdout: ITS with pre-change BSTS extrapolation, regression discontinuity in time, or external synthetic-control donors. Honest answer: no holdout means untestable assumptions.`,
        ],
        answer: `D`,
      },
    ],
    takeaway: `Granger causality is the most frequently misused concept in applied time series work: it measures predictive priority, not causation, and a common upstream cause produces Granger causality between two otherwise unrelated series. The second most important insight for applied causal time series is that TWFE DiD is biased under staggered rollouts with heterogeneous treatment effects — already-treated units contaminate the control group, and the fix is Callaway-Sant'Anna, not just clustering standard errors. Always run an event study plot before reporting any DiD estimate.`,
    recap: [
      `**Granger = predictive, NOT causal:** a shared upstream cause Z produces Granger causality with no direct mechanism.`,
      `**ITS:** pre-period trend extrapolation as counterfactual; correct autocorrelated residuals (Newey-West/Prais-Winsten).`,
      `**Synthetic control:** weighted control units matching pre-treatment — pre-fit quality is directly observable.`,
      `**CausalImpact (BSTS):** counterfactual from control regressors; breaks if controls hit by spillover.`,
      `**DiD needs parallel trends** — always plot event-study pre-trend coefficients before reporting an estimate.`,
      `**Staggered TWFE is biased** under heterogeneous effects (already-treated as controls, negative weights) → Callaway-Sant'Anna.`,
      `**No holdout = strong untestable assumptions;** the real fix is a prospective holdout design for future launches.`,
    ],
    figures: {
      causal_counterfactual: `<svg viewBox="0 0 360 148" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="11" fill="var(--ink-low)" font-size="8">Synthetic control / CausalImpact — effect = observed − counterfactual</text>
  <line x1="215" y1="18" x2="215" y2="118" stroke="var(--rim)" stroke-width="0.75" stroke-dasharray="2 3"/>
  <text x="218" y="26" fill="var(--ink-low)" font-size="6.5">intervention</text>
  <polyline fill="none" stroke="var(--prime)" stroke-width="1.6" points="16,96 55,90 94,92 133,84 172,86 215,80 254,54 293,44 332,30"/>
  <polyline fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="4 3" points="215,80 254,76 293,72 332,66"/>
  <path d="M254,54 L254,76 M293,44 L293,72 M332,30 L332,66" stroke="var(--green)" stroke-width="1" opacity="0.7"/>
  <line x1="16" y1="118" x2="344" y2="118" stroke="var(--rim)" stroke-width="0.75"/>
  <g font-size="6.5">
    <rect x="16" y="126" width="10" height="4" fill="var(--prime)"/><text x="30" y="131" fill="var(--ink-mid)">observed (treated)</text>
    <rect x="150" y="126" width="10" height="4" fill="var(--gold)"/><text x="164" y="131" fill="var(--ink-mid)">counterfactual (synthetic)</text>
    <rect x="300" y="126" width="10" height="4" fill="var(--green)"/><text x="314" y="131" fill="var(--ink-mid)">effect</text>
  </g>
  <text x="180" y="145" text-anchor="middle" fill="var(--ink-low)" font-size="6.5">Pre-period fit is directly observable — a poor match invalidates the counterfactual (and the effect)</text>
</svg>`,
    },
  },
]
