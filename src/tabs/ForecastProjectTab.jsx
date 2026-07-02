import React from 'react'
import { ProjectLabSkeleton } from './ProjectLabSkeleton.jsx'

const SPEC = {
  kicker: 'Project Lab · Forecasting',
  title: 'Forecast Demand: Backtest Like It’s Production',
  subtitle: 'A time-series project built around the one thing tabular labs can’t teach — temporal validation. Walk-forward backtesting, seasonality, leakage from the future, and honest prediction intervals.',
  archetype: 'Time-series forecasting (demand / engagement). The evaluation protocol itself is the hard part — a random train/test split is silently wrong here.',
  why: 'Most candidates forecast with a random split and leak the future into the past without noticing. This lab forces the production protocol: a seasonal-naive baseline first, walk-forward (rolling-origin) backtesting, feature construction that respects the as-of time, and intervals that quantify uncertainty instead of a single deceptive point estimate.',
  phases: [
    { name: 'Framing & baseline', desc: 'Define horizon and granularity; fit a seasonal-naive / ETS baseline that any model must beat. Skipping the baseline is the first failure.' },
    { name: 'Temporal features (as-of correct)', desc: 'Lags, rolling stats, calendar/holiday effects — all computed with point-in-time discipline so no future value leaks into a training row.' },
    { name: 'Modeling', desc: 'Classical (ARIMA/Prophet-style) vs gradient-boosted lags vs a neural forecaster; compare on the same backtest, not a single holdout.' },
    { name: 'Walk-forward backtest', desc: 'Rolling-origin evaluation across multiple folds; report MASE/sMAPE and their variance, not one lucky window.' },
    { name: 'Intervals & monitoring', desc: 'Prediction intervals (quantile / conformal), coverage check, and a drift plan for when the series regime shifts.' },
  ],
  checkpoints: [
    'Why a random train/test split is invalid here — and exactly what leaks when you use one.',
    'The seasonal-naive baseline: your fancy model beats it by 2% — is that worth the complexity and serving cost?',
    'Point-in-time feature construction — spotting the rolling-mean-computed-over-the-whole-series bug.',
    'Backtest variance: fold 3 looks great, fold 5 is terrible. Do you ship, and what does the spread tell you?',
    'Prediction intervals that undercover — is it the model, the noise assumption, or a regime change?',
  ],
  datasetNote: 'Planned dataset: a retail/streaming demand series with real seasonality and holiday spikes, Pyodide-runnable. Includes a deliberately leaky feature for the checkpoint.',
}

export function ForecastProjectTab() {
  return <ProjectLabSkeleton spec={SPEC} />
}

export default ForecastProjectTab
