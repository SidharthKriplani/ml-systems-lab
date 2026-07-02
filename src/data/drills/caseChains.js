// Case-chain drills — multi-step chained reasoning across coupled ML failures.
// Each drill forces later steps to depend on earlier findings.
// type: 'multistep'. Authored for senior/staff ML interview prep.

export const CASE_CHAIN_DRILLS = [
  // 1a — XGBoost + class imbalance + calibration + threshold + delayed labels (FRAUD)
  {
    id: 'chain-fraud-xgb-calib-threshold',
    subject: 'classical_ml',
    subtopic: 'imbalance + calibration + threshold',
    level: 'staff',
    type: 'multistep',
    title: 'XGBoost fraud model: great AUC, business bleeding money at the chosen cutoff',
    context: [
      'Card-fraud model. Base fraud rate 0.4%. XGBoost, 800 trees, scale_pos_weight=250.',
      'Offline: ROC-AUC 0.96, PR-AUC 0.41. Deployed at a fixed 0.5 score threshold.',
      'Ops: at 0.5 almost nothing is declined; when threshold lowered to 0.1, false-decline complaints spike.',
      'Fraud chargebacks confirm 45–90 days after the transaction; training labels use a 30-day window.'
    ],
    steps: [
      {
        question: 'AUC 0.96 but PR-AUC only 0.41 at 0.4% prevalence. What does the gap tell you first?',
        options: [
          'The model is broken — AUC and PR-AUC should agree',
          'AUC is inflated by the huge true-negative mass; PR-AUC is the honest view for this imbalance and it is mediocre',
          'PR-AUC is always lower so the gap is meaningless',
          'You should switch to accuracy as the headline metric'
        ],
        answer: 1,
        finding: 'On extreme imbalance, ROC-AUC is dominated by easy negatives and stays high even when the positive class is poorly separated. PR-AUC reflects precision at operating points that matter. 0.41 is the real ceiling to reason about.'
      },
      {
        question: 'Almost nothing declines at 0.5 but complaints spike at 0.1. Before touching the threshold again, what must you check?',
        options: [
          'Whether scores are calibrated — scale_pos_weight=250 distorts probabilities, so 0.5 is not a meaningful probability cutoff',
          'Whether the GPU is saturated',
          'Whether to add more trees',
          'Whether to switch to a neural net'
        ],
        answer: 0,
        finding: 'scale_pos_weight up-weights positives and pushes raw scores toward the middle/high range, so the output is not a calibrated probability. A 0.5 cut has no principled meaning. Calibrate (isotonic / Platt) on a held-out set first, then the threshold sweep is interpretable.'
      },
      {
        question: 'After calibration you sweep the threshold on your validation set. Why might that operating point still be wrong in production?',
        options: [
          'Validation labels used a 30-day window but true chargebacks land at 45–90 days, so recent "negatives" are unripened positives — your precision/recall estimates are optimistic',
          'Thresholds never transfer between datasets',
          'Calibration undoes the threshold sweep',
          'Validation is always representative once calibrated'
        ],
        answer: 0,
        finding: 'Label maturity is the hidden trap. A 30-day window mislabels late-confirming fraud as legitimate, deflating measured fraud rate and inflating precision. The threshold chosen on immature labels is set against a fiction.'
      },
      {
        question: 'Given all three findings, what is the correct operating decision?',
        options: [
          'Ship at 0.1 since it declines the most fraud',
          'Pick the threshold to hit a target precision/recall on calibrated scores using a matured label set (90-day), weighted by chargeback cost vs false-decline cost',
          'Keep 0.5 to minimise complaints',
          'Remove scale_pos_weight and retrain with no imbalance handling'
        ],
        answer: 1,
        finding: 'The operating point is a cost decision on calibrated probabilities against matured labels. Fraud loss per missed case vs revenue/goodwill loss per false decline sets the cutoff — not a default 0.5 or a panic 0.1.'
      }
    ],
    diagnosis: 'A strong ranker crippled by three compounding operational faults: an imbalance-inflated headline metric, uncalibrated scores making the threshold meaningless, and immature labels making the tuning set a fiction.',
    explanation: 'AUC hid weak precision (imbalance). scale_pos_weight made 0.5 arbitrary (calibration). The 30-day window mislabeled late fraud as legit (label maturity), so any threshold tuned on it is optimistic. Each fault feeds the next: you cannot pick a threshold before calibrating, and you cannot trust the sweep before labels mature.',
    fix: 'Report PR-AUC as headline. Calibrate scores (isotonic) on held-out data. Rebuild the eval set with a 90-day matured label window. Choose the threshold by cost-weighted precision/recall on calibrated, matured data. Re-tune quarterly as fraud patterns drift.',
    source: 'Authored · Case-chain'
  },

  // 1b — XGBoost + imbalance + calibration + threshold + delayed labels (CHURN)
  {
    id: 'chain-churn-xgb-calib-delayed',
    subject: 'classical_ml',
    subtopic: 'imbalance + calibration + delayed labels',
    level: 'staff',
    type: 'multistep',
    title: 'Churn model: retention team says the "high-risk" list is full of loyal users',
    context: [
      'B2C subscription churn. Monthly churn base rate 3%. XGBoost with scale_pos_weight=30.',
      'Offline PR-AUC 0.28, ROC-AUC 0.88. Retention team targets everyone scored > 0.5.',
      'Retention spends heavily on the top list but save-rate is low; many targeted users had no intent to leave.',
      'Churn is only confirmed after a 60-day non-renewal; the training label used "cancelled within 30 days".'
    ],
    steps: [
      {
        question: 'Retention targets score > 0.5 and gets a low save-rate. What is the first structural suspect?',
        options: [
          'The users are simply unsaveable',
          'scale_pos_weight=30 uncalibrates scores, so > 0.5 does not mean 50% churn probability — the "high-risk" cut is arbitrary',
          'Churn cannot be modelled',
          'The team should target score > 0.9 with no other change'
        ],
        answer: 1,
        finding: 'As with any positive up-weighting, raw XGBoost scores are pushed high and are not probabilities. A 0.5 cut selects a band that may be mostly moderate-risk users, wasting retention budget.'
      },
      {
        question: 'You calibrate and re-rank. PR-AUC is still only 0.28. What does that force you to accept about the intervention strategy?',
        options: [
          'Precision at the top is inherently limited, so target the smallest highest-precision slice and accept you cannot save everyone economically',
          'PR-AUC of 0.28 means the model is random',
          'Calibration should have raised PR-AUC',
          'Lower the threshold to capture more churners'
        ],
        answer: 0,
        finding: 'Calibration fixes the meaning of scores but not separability. PR-AUC 0.28 caps achievable precision. The correct response is a small, high-precision top-slice sized to intervention ROI, not a wide net.'
      },
      {
        question: 'Why might even the calibrated top-slice underperform when measured against the label the model was trained on?',
        options: [
          'The 30-day cancellation label misses users who churn at day 45–60, so the model was taught a truncated definition of churn and mislabels slow churners as retained',
          'Labels never affect calibration',
          'The top slice is always correct after calibration',
          '60-day churn is identical to 30-day churn'
        ],
        answer: 0,
        finding: 'The delayed-label problem: true churn confirms at 60 days but the label used 30. Slow churners are trained as negatives, so the model both learns a wrong target and is evaluated against it — the top slice looks worse than it is on real churn.'
      }
    ],
    diagnosis: 'Wasted retention spend driven by uncalibrated scores over an arbitrary cutoff, a low separability ceiling, and a truncated churn label that mislabels slow churners.',
    explanation: 'The 0.5 cut was meaningless (calibration). Even calibrated, PR-AUC 0.28 limits precision, so a wide list must underperform. And the 30-day label omitted day-45–60 churners, corrupting both training target and evaluation. The chain: fix score meaning, accept the precision ceiling, then fix the label definition before trusting any of it.',
    fix: 'Calibrate scores. Size the intervention list to the highest-precision slice that clears retention ROI. Redefine the churn label to a 60-day non-renewal window and retrain. Measure save-rate against matured churn, not 30-day cancellations.',
    source: 'Authored · Case-chain'
  },

  // 2a — Target-encoding leakage (data)
  {
    id: 'chain-target-encoding-leak-prod',
    subject: 'data',
    subtopic: 'target encoding leakage',
    level: 'staff',
    type: 'multistep',
    title: 'Model that looked incredible in CV collapses in production — target encoding suspected',
    context: [
      'Lead-scoring model. Categorical feature "campaign_id" has ~40k levels, many with < 5 rows.',
      'Feature engineered as target encoding: mean conversion per campaign_id.',
      'Offline CV AUC 0.94. Production AUC 0.71 in week one, on the same feature pipeline.',
      'The target encoder was fit on the full training set, then CV splits were made afterwards.'
    ],
    steps: [
      {
        question: 'CV 0.94 vs prod 0.71 with an identical pipeline. What class of bug does this signature most strongly suggest?',
        options: [
          'Concept drift over one week',
          'Train/serve leakage in a feature that saw the target — inflated CV, honest prod',
          'A latency bug',
          'Random seed variance'
        ],
        answer: 1,
        finding: 'A large CV→prod drop with the same pipeline and no time gap is the classic leakage signature, not drift. Something in training used information unavailable at serving. Target encoding is the prime suspect.'
      },
      {
        question: 'The encoder was fit on the full training set before CV splitting. Why does that inflate CV specifically?',
        options: [
          'It does not — order of fitting is irrelevant',
          'Each validation row\'s own target leaked into its campaign_id mean during encoding, so CV scored a feature that peeked at the answer',
          'It only affects the test set',
          'It slows training but does not leak'
        ],
        answer: 1,
        finding: 'Fitting the encoder on all rows means a validation fold\'s conversions contributed to the mean used to score that same fold. The feature literally contains the label. CV is measuring memorisation.'
      },
      {
        question: 'campaign_id has 40k levels, many with < 5 rows. Even with leakage fixed, what second failure mode remains?',
        options: [
          'None — leakage was the only issue',
          'High-cardinality low-count encoding: rare campaigns get noisy or shrunk means, so the feature is unstable and near-useless in prod where new campaign_ids appear',
          'Cardinality helps generalisation',
          'The model will overfit less with more levels'
        ],
        answer: 1,
        finding: 'Even leak-free, a campaign seen 3 times gives a target mean that is pure noise, and brand-new campaign_ids at serving have no encoding at all. High-cardinality target encoding needs smoothing and an unseen-category strategy.'
      },
      {
        question: 'What is the correct rebuild?',
        options: [
          'Drop CV and trust production only',
          'Compute target encoding inside each CV fold on train-only rows, add Bayesian smoothing toward the global mean, and define a fallback for unseen categories',
          'Increase model depth to compensate',
          'One-hot encode all 40k levels'
        ],
        answer: 1,
        finding: 'Leak-free target encoding must be fit only on training rows within each fold (out-of-fold encoding), smoothed by count so rare levels shrink to the prior, with an explicit unseen-category value. That gives an honest CV that will track production.'
      }
    ],
    diagnosis: 'Target-encoding leakage inflated CV, masking a high-cardinality feature that is genuinely weak and unstable on rare and unseen campaigns.',
    explanation: 'Fitting the encoder before splitting leaked each fold\'s target into its own feature, so CV memorised. Prod, which cannot peek, told the truth. Underneath the leakage sat a real problem: 40k sparse levels give noisy means and no value for new campaigns. Fixing leakage exposes the weak feature; both must be handled.',
    fix: 'Move target encoding inside the CV loop, out-of-fold, train-only. Add count-based Bayesian smoothing toward the global conversion rate. Define an explicit unseen-category fallback. Re-measure — expect CV to drop toward prod, then improve the feature honestly.',
    source: 'Authored · Case-chain'
  },

  // 2b — Target encoding leakage (data) — time-series flavour
  {
    id: 'chain-target-encoding-leak-temporal',
    subject: 'data',
    subtopic: 'target encoding + temporal leakage',
    level: 'staff',
    type: 'multistep',
    title: 'Encoded feature leaks the future: model degrades week over week after launch',
    context: [
      'Demand-forecast classifier. Feature "store_x_sku" target-encoded as historical sell-through rate.',
      'Encoding computed over the entire training period (Jan–Dec) with a random 80/20 split.',
      'Backtest AUC 0.89. Live AUC starts at 0.80 and drifts down to 0.68 over four weeks.',
      'Retraining is monthly; serving uses the most recent monthly encoding table.'
    ],
    steps: [
      {
        question: 'A random 80/20 split on a time-series forecasting task — what is the first red flag independent of encoding?',
        options: [
          'Random splits are fine for time series',
          'Random splitting lets future rows train a model evaluated on past rows, breaking temporal order and inflating the backtest',
          'The split ratio is wrong, should be 70/30',
          'Time series needs no special handling'
        ],
        answer: 1,
        finding: 'Forecasting must be validated with a forward-chaining (walk-forward) split. A random split trains on the future and tests on the past, so the backtest is optimistic before encoding even enters.'
      },
      {
        question: 'The target encoding was computed over all of Jan–Dec. Why does this compound the random-split problem?',
        options: [
          'It does not compound anything',
          'Each row\'s sell-through mean includes future months\' outcomes, so the feature carries future target information — leakage on top of the split leakage',
          'Encoding over more data is always safer',
          'It only affects storage size'
        ],
        answer: 1,
        finding: 'A January row is encoded with a mean that includes December sell-through. The feature literally knows the future. Combined with the random split, the backtest is doubly leaked.'
      },
      {
        question: 'Live AUC starts at 0.80 and decays to 0.68 over four weeks. Why the decay rather than an instant drop?',
        options: [
          'The model is fine and this is noise',
          'The encoding table is fixed at retrain time; as live weeks move away from the last encoding refresh, the historical means grow staler relative to current demand',
          'AUC always decays',
          'The GPU degrades over four weeks'
        ],
        answer: 1,
        finding: 'The decay signature points to a static feature going stale between monthly retrains — encoded rates computed at retrain drift from reality as the month progresses. This is separate from the backtest leakage and explains the slope.'
      }
    ],
    diagnosis: 'A doubly-leaked backtest (random split plus full-period encoding) inflated offline scores, while a static monthly encoding table causes real in-month decay in production.',
    explanation: 'The random split and full-period target encoding both let the future leak into training, so 0.89 was never real. The gentle live decay is a different problem: the encoding table is frozen at retrain and drifts out of date within the month. Offline was fiction; the live slope is a genuine staleness issue.',
    fix: 'Use walk-forward validation. Compute target encoding only from data strictly before each row\'s timestamp (expanding window). Refresh the encoding table more often than monthly, or make it a rolling as-of feature computed at serve time. Re-backtest — expect the honest number near the live 0.68–0.75 band.',
    source: 'Authored · Case-chain'
  },

  // 3a — Delayed labels + point-in-time + eval integrity (production)
  {
    id: 'chain-delayed-labels-pit-eval',
    subject: 'production',
    subtopic: 'delayed labels + point-in-time',
    level: 'staff',
    type: 'multistep',
    title: 'Offline eval says +6% AUC but the improvement never shows up in the business KPI',
    context: [
      'Loan-default model. Default confirmed 6–12 months after origination.',
      'New model version shows +6% AUC on the backtest vs the incumbent.',
      'Backtest uses loans originated in the last 12 months, labelled as default/no-default as of today.',
      'Feature store is snapshotted daily; the training join used current feature values, not as-of-origination values.'
    ],
    steps: [
      {
        question: 'Defaults confirm 6–12 months out, but the backtest labels last-12-months loans as of today. What is wrong with the recent cohort?',
        options: [
          'Nothing — 12 months is enough',
          'Loans from the last 6–12 months have immature labels: many future defaults are still recorded as non-default, so the label set is censored and optimistic',
          'Recent loans are always the cleanest',
          'The cohort should be larger'
        ],
        answer: 1,
        finding: 'Right-censoring: a loan originated 3 months ago has not had time to default, yet it is labelled non-default. The recent cohort systematically undercounts defaults, biasing every metric computed on it.'
      },
      {
        question: 'The training join used current feature values, not as-of-origination. Why does that break the +6% claim specifically?',
        options: [
          'Feature freshness never matters',
          'Current feature values encode information from after origination (e.g., updated credit score post-default), leaking future signal into the training features — point-in-time correctness is violated',
          'It only affects serving latency',
          'Using current values improves generalisation'
        ],
        answer: 1,
        finding: 'A point-in-time violation: joining today\'s feature snapshot to a loan means features reflect events that happened after the prediction moment. The model trains on the future. The +6% may be entirely this leakage.'
      },
      {
        question: 'Given censored labels AND a point-in-time violation, why does the business KPI stay flat despite +6% AUC?',
        options: [
          'The KPI is measured wrong',
          'The +6% is an artifact of leaked features and immature labels; at serving the model only has as-of-origination data and mature outcomes, so the real lift is near zero',
          'AUC and KPI are unrelated',
          'The KPI needs more time — it will rise'
        ],
        answer: 1,
        finding: 'Both faults inflate offline only. Production sees no future features and eventually mature labels, so the leaked advantage evaporates. The flat KPI is the honest signal; the backtest was measuring a leak.'
      },
      {
        question: 'What is the correct eval rebuild?',
        options: [
          'Trust AUC and ship',
          'Restrict the cohort to loans old enough for mature labels, and rebuild features via as-of-origination point-in-time joins from the snapshotted store',
          'Add more recent loans for freshness',
          'Switch the metric to accuracy'
        ],
        answer: 1,
        finding: 'Honest eval needs mature labels (drop the censored recent cohort or use survival-aware labeling) and point-in-time feature joins that reconstruct exactly what was known at origination. Only then does offline lift predict online lift.'
      }
    ],
    diagnosis: 'A phantom +6% produced by right-censored labels on the recent cohort and a point-in-time violation that leaked post-origination features into training.',
    explanation: 'Recent loans lacked time to default (censoring), so the label set undercounted the positive class. The feature join used today\'s values, leaking events after the decision moment (point-in-time violation). Both inflate offline metrics only; at serving neither advantage exists, so the KPI stays flat. The chain: the leak explains the gap the censoring alone could not.',
    fix: 'Rebuild the eval cohort to loans with matured outcomes (or use survival/time-to-event labeling). Reconstruct all features via as-of-origination point-in-time joins from the daily snapshots. Re-backtest; expect the +6% to shrink toward the true lift, which should now track the KPI.',
    source: 'Authored · Case-chain'
  },

  // 3b — Delayed labels + eval integrity (production) — online experiment flavour
  {
    id: 'chain-delayed-labels-experiment-readout',
    subject: 'production',
    subtopic: 'delayed labels + experiment readout',
    level: 'staff',
    type: 'multistep',
    title: 'A/B test reads positive on day 7, negative on day 30 — which do you trust?',
    context: [
      'Recommendation model A/B test. Primary metric: 30-day retained purchases per user.',
      'Team reads out at day 7 using purchases-so-far as a proxy and sees treatment +4%.',
      'At day 30 with matured labels the effect is -2% and significant.',
      'Treatment surfaced aggressive short-term upsells; conversions land fast, cancellations land slow.'
    ],
    steps: [
      {
        question: 'Day-7 proxy is +4%, day-30 matured is -2%. What is the core measurement error at day 7?',
        options: [
          'Day 7 had too few users',
          'The day-7 proxy captures fast-landing conversions but not slow-landing cancellations/refunds, so it systematically over-credits treatment',
          'The metric changed between reads',
          'Day 30 is simply noisier'
        ],
        answer: 1,
        finding: 'Outcome latency asymmetry: positive signals (purchases) confirm quickly, negative signals (cancellations, refunds, churn) confirm slowly. A short-window proxy sees the upside before the downside arrives.'
      },
      {
        question: 'Treatment pushes aggressive upsells. How does that interact with the label delay to make day 7 actively misleading?',
        options: [
          'It does not interact',
          'Aggressive upsells maximise exactly the fast-landing positive that the proxy measures while deferring the harm the proxy cannot yet see — the proxy is biased in treatment\'s favour, not just noisy',
          'Upsells only affect the control',
          'The delay cancels out across arms'
        ],
        answer: 1,
        finding: 'This is the dangerous case: the treatment behavior is correlated with the label-latency structure. It front-loads measurable good and back-loads unmeasurable bad, so the proxy is systematically, not randomly, wrong.'
      },
      {
        question: 'Which readout do you trust, and what does it imply about early-stopping on the proxy?',
        options: [
          'Trust day 7 — earlier is fresher',
          'Trust the day-30 matured metric; early-stopping on a latency-biased proxy would have shipped a regression',
          'Average the two reads',
          'Re-run the test at day 7 only'
        ],
        answer: 1,
        finding: 'The matured 30-day metric is the decision metric by design. Stopping early on the proxy would have shipped a -2% change. Proxy metrics for early reads are only safe when they are unbiased for the final metric — here they are not.'
      }
    ],
    diagnosis: 'A latency-biased proxy metric made a harmful treatment look positive at day 7; the matured 30-day label reveals a regression.',
    explanation: 'Purchases confirm fast, cancellations confirm slow, so any short-window proxy over-credits. The treatment amplified this by front-loading upsells — its behavior is correlated with the label-delay structure, making the proxy directionally wrong rather than merely noisy. Early-stopping would have shipped the regression. Only the matured metric is trustworthy.',
    fix: 'Define the decision metric as the matured 30-day outcome and do not stop early on unvalidated proxies. If early reads are needed, use a surrogate validated to be unbiased for the final metric, or apply a delayed-feedback correction. Run the test to label maturity before shipping.',
    source: 'Authored · Case-chain'
  },

  // 4a — Transformer fine-tuning: NaN loss (deep_learning)
  {
    id: 'chain-transformer-nan-loss',
    subject: 'deep_learning',
    subtopic: 'fine-tuning instability',
    level: 'staff',
    type: 'multistep',
    title: 'Fine-tuning a transformer: loss goes to NaN at step ~300 every run',
    context: [
      'Fine-tuning a 1.3B decoder on domain text. fp16, LR 5e-4, no warmup, batch 8, seq 2048.',
      'Loss trends down then spikes to inf/NaN around step 300, reproducibly.',
      'Grad-norm logging shows a spike to ~1e4 just before the NaN.',
      'Switching to fp32 delays but does not fully remove the blowup.'
    ],
    steps: [
      {
        question: 'NaN preceded by a grad-norm spike to 1e4. What is the immediate mechanism?',
        options: [
          'The dataset is corrupt',
          'An exploding gradient overflows fp16 range, producing inf then NaN once it propagates through the update',
          'The model is too small',
          'The tokenizer is wrong'
        ],
        answer: 1,
        finding: 'A grad-norm spike into 1e4 followed by NaN is exploding gradients hitting fp16\'s ~6.5e4 ceiling. The inf contaminates weights on the next update. The mechanism is numerical, driven by an optimization instability.'
      },
      {
        question: 'LR 5e-4 with no warmup on a 1.3B model. Why does that specifically cause the early spike?',
        options: [
          'LR is irrelevant to stability',
          'A high LR applied from step 0, before Adam\'s second-moment estimates stabilise, produces huge early updates — warmup exists precisely to prevent this',
          'No-warmup only affects the final accuracy',
          'Larger models need higher LR without warmup'
        ],
        answer: 1,
        finding: 'Without warmup, Adam\'s variance estimates are unreliable early, so a 5e-4 LR yields oversized steps in the first hundreds of steps — exactly where the blowup occurs. Warmup ramps the LR while moment estimates settle.'
      },
      {
        question: 'fp32 delays but does not remove the blowup. What does that tell you about the fix priority?',
        options: [
          'The problem is purely precision — just use fp32',
          'Precision only widens the overflow ceiling; the root cause is the optimization step size, so warmup + grad clipping + lower peak LR are the real fix, with mixed-precision loss scaling as support',
          'fp32 should have fully fixed it, so the data is bad',
          'Use fp64'
        ],
        answer: 1,
        finding: 'If fp32 only delays it, precision was masking not curing. The instability is in the update dynamics. Fix the step (warmup, clip grad-norm ~1.0, reduce peak LR); keep fp16 with dynamic loss scaling for the numerical safety margin.'
      }
    ],
    diagnosis: 'Exploding gradients from an aggressive no-warmup learning rate overflow fp16 into NaN; precision changes only delay it.',
    explanation: 'The grad-norm spike to 1e4 is the cause; fp16 overflow is the messenger. The 5e-4 LR with no warmup produces oversized early Adam steps before the second-moment estimates settle, which is why it blows up reproducibly near step 300. fp32 widens the overflow margin but does not tame the step, so it only delays — proving the root cause is optimization, not precision.',
    fix: 'Add LR warmup (e.g., 100–500 steps), clip gradient norm to ~1.0, and lower peak LR (5e-5 to 1e-4 for a 1.3B fine-tune). Keep fp16/bf16 with dynamic loss scaling. bf16 preferred where available for its wider exponent range.',
    source: 'Authored · Case-chain'
  },

  // 4b — Transformer fine-tuning: overfit vs latency tradeoff (deep_learning)
  {
    id: 'chain-transformer-overfit-latency',
    subject: 'deep_learning',
    subtopic: 'overfit + latency tradeoff',
    level: 'senior',
    type: 'multistep',
    title: 'Fine-tuned model memorises the 8k-example set and is too slow to serve',
    context: [
      'Fine-tuning a 7B model on 8,000 curated examples, 6 epochs, full-parameter tuning.',
      'Train loss near zero by epoch 3; held-out loss rises after epoch 2 (classic overfit).',
      'Serving p99 latency 1,400ms against a 400ms SLA; full 7B in fp16.',
      'Product needs both: better held-out quality AND under-SLA latency.'
    ],
    steps: [
      {
        question: 'Held-out loss rises after epoch 2 while train loss keeps falling. On 8k examples with full-parameter tuning, what is the first lever?',
        options: [
          'Train for more epochs',
          'Overfitting on a small set: reduce epochs / early-stop at epoch 2, and switch to parameter-efficient tuning (LoRA) to shrink the effective capacity being fit',
          'Increase model size',
          'Remove the held-out set'
        ],
        answer: 1,
        finding: '8k examples cannot support full 7B-parameter tuning for 6 epochs without memorising. Early-stop at the held-out minimum and use LoRA/adapters to limit trainable capacity, which regularises and cuts checkpoint size.'
      },
      {
        question: 'p99 is 1,400ms vs a 400ms SLA. Which lever attacks latency without re-introducing the overfit you just fixed?',
        options: [
          'Train longer to make the model faster',
          'Post-training compression — quantise to int8/int4 and/or distil to a smaller student — which reduces latency independently of the overfitting fix',
          'Raise the SLA to 1,400ms',
          'Add more layers'
        ],
        answer: 1,
        finding: 'Latency is a serving-side concern. Quantisation (int8/int4) and distillation cut compute per token without touching the training-regime overfit fix. These are orthogonal levers — that separation is the senior insight.'
      },
      {
        question: 'You want both quality and latency. In what order do you apply the levers and why?',
        options: [
          'Quantise first, then worry about quality',
          'Fix the training regime first (early-stop + LoRA) to get an honest quality baseline, then compress to hit latency and measure the quality cost of compression against that baseline',
          'Do both blindly at once',
          'Only fix latency; quality is fine'
        ],
        answer: 1,
        finding: 'Order matters: establish the correct-quality model first, then compress and measure the quality/latency tradeoff against a clean baseline. Compressing an overfit model would bake in the wrong behavior and confound the tradeoff.'
      }
    ],
    diagnosis: 'Two orthogonal problems — small-data overfitting from full-parameter tuning and a serving latency miss — that must be solved in the right order.',
    explanation: 'Full 7B tuning on 8k examples for 6 epochs memorises; held-out loss rising after epoch 2 confirms it. Early-stopping plus LoRA fixes quality and shrinks the artifact. Latency is a separate serving lever — quantisation and distillation. The senior move is recognising they are independent and sequencing quality-first so the compression tradeoff is measured against a correct baseline.',
    fix: 'Early-stop at epoch 2; switch to LoRA to regularise and reduce trainable params. Establish the held-out-best baseline. Then quantise to int8 (or distil to a smaller student) to meet the 400ms SLA, measuring quality delta against the clean baseline. Iterate compression until latency and quality both clear.',
    source: 'Authored · Case-chain'
  },

  // 5a — Three-way drift diagnosis (monitoring)
  {
    id: 'chain-three-way-drift-diagnosis',
    subject: 'monitoring',
    subtopic: 'data vs concept vs infra drift',
    level: 'staff',
    type: 'multistep',
    title: 'Accuracy dropped 8 points overnight — data, concept, or infra drift?',
    context: [
      'Production classifier. Accuracy fell from 0.91 to 0.83 between Tuesday and Wednesday.',
      'Input feature distributions (PSI) are stable — no meaningful data drift.',
      'A feature-pipeline deploy shipped Tuesday night; one feature now arrives null 30% of the time.',
      'Label-outcome relationship (where measurable) looks unchanged over the same window.'
    ],
    steps: [
      {
        question: 'PSI on inputs is stable. What does that rule out first?',
        options: [
          'Nothing can be ruled out',
          'Covariate/data drift — if input distributions are stable, the accuracy drop is not explained by the population shifting',
          'It rules out infra drift',
          'It rules out concept drift only'
        ],
        answer: 1,
        finding: 'Stable PSI means the incoming feature distributions have not shifted, so classic data (covariate) drift is not the cause. That narrows the field to concept drift or an infra/pipeline fault.'
      },
      {
        question: 'The P(y|x) relationship looks unchanged. What does that rule out, and where does it point?',
        options: [
          'It confirms concept drift',
          'It rules out concept drift (the world\'s label mapping is stable) and points toward an infra/pipeline cause correlated with the Tuesday deploy',
          'It points to data drift after all',
          'It means the model is fine'
        ],
        answer: 1,
        finding: 'Concept drift means P(y|x) changes; here it is stable, so concept drift is out. With data and concept drift eliminated and a deploy landing exactly at the break, the cause is infrastructural.'
      },
      {
        question: 'A feature is now 30% null after the deploy, yet PSI looked stable. How do you reconcile that?',
        options: [
          'PSI must be wrong',
          'PSI was likely computed on non-null rows or imputed values, masking the nulls; the null-injection is the infra drift and directly degrades the model on 30% of traffic',
          'Nulls do not affect accuracy',
          'The deploy is unrelated'
        ],
        answer: 1,
        finding: 'The reconciliation: monitoring hid the nulls (computed post-imputation or on present values). The real change is a pipeline regression injecting nulls, which the model handles poorly. This is textbook infra drift masquerading as no-drift.'
      }
    ],
    diagnosis: 'Infrastructure drift — a pipeline deploy injecting 30% nulls into a feature — after data drift and concept drift were both eliminated.',
    explanation: 'Stable PSI ruled out data drift; stable P(y|x) ruled out concept drift; a deploy coinciding with the break and a newly-null feature pinpoint infra drift. The trap was PSI looking clean because null-rate was not monitored (or nulls were imputed before the PSI calc). The elimination chain forces the conclusion the surface metric hid.',
    fix: 'Roll back or fix the Tuesday pipeline deploy so the feature populates. Add null-rate and freshness monitors alongside PSI so infra drift is not masked by imputation. Backfill/repair affected predictions. Long-term: monitor data, concept, and infra drift as three distinct signals, not one accuracy number.',
    source: 'Authored · Case-chain'
  },

  // 5b — Three-way drift diagnosis (monitoring) — concept drift version
  {
    id: 'chain-drift-concept-vs-data',
    subject: 'monitoring',
    subtopic: 'concept drift isolation',
    level: 'senior',
    type: 'multistep',
    title: 'Model decays slowly over 3 months with clean pipelines — which drift?',
    context: [
      'Fraud model, accuracy sliding from 0.90 to 0.82 over ~3 months, gradual not sudden.',
      'No deploys in the window; feature freshness and null-rates are clean (no infra drift).',
      'PSI on inputs shows moderate shift in two features tied to a new payment method.',
      'Among transactions with the new payment method, the same feature values now map to fraud far more often.'
    ],
    steps: [
      {
        question: 'Gradual decay, no deploys, clean freshness/null-rate. What does that eliminate?',
        options: [
          'It eliminates concept drift',
          'It eliminates infra drift — no deploy, clean pipeline signals — so the cause is data or concept drift',
          'It eliminates data drift',
          'It eliminates everything'
        ],
        answer: 1,
        finding: 'A slow slide with no code change and healthy pipeline metrics is not infra drift. That leaves data drift (input distribution shift) and/or concept drift (relationship shift) as candidates.'
      },
      {
        question: 'PSI shows two features shifting with a new payment method. Is that alone enough to call it data drift?',
        options: [
          'Yes — PSI shift is definitionally data drift, case closed',
          'Not necessarily — input shift can occur with or without a change in P(y|x); you must check whether the label mapping also changed before concluding',
          'PSI shift always means retrain only the encoder',
          'PSI shift means the model is fine'
        ],
        answer: 1,
        finding: 'PSI shift confirms the inputs moved, but data drift alone (stable P(y|x)) is often survivable. The senior step is to test whether the outcome relationship changed too, which determines the fix.'
      },
      {
        question: 'For the new payment method, identical feature values now predict fraud far more often. What is the diagnosis and why does it matter for the fix?',
        options: [
          'Pure data drift — just reweight the training set',
          'Concept drift: P(fraud | x) changed for the new segment, so reweighting is insufficient — the model must relearn the new relationship with fresh labeled data from that segment',
          'Infra drift after all',
          'No drift; accuracy noise'
        ],
        answer: 1,
        finding: 'Same x mapping to different y is the definition of concept drift. Reweighting or re-sampling old data will not help because the old labels encode the old relationship. You need fresh labels from the drifted segment.'
      }
    ],
    diagnosis: 'Concept drift localised to a new payment-method segment — the fraud relationship changed, on top of a benign input (data) shift.',
    explanation: 'Infra drift was eliminated by clean pipelines and no deploys. PSI confirmed input drift, but input drift alone would not necessarily cost 8 points. The decisive evidence is the same feature values now mapping to fraud more often for the new segment — a change in P(y|x), i.e., concept drift. That distinction dictates the fix: relearn, not reweight.',
    fix: 'Prioritise fresh labeled data from the new-payment-method segment and retrain (or fine-tune) so the model learns the new fraud relationship. Add segment-level performance monitoring so concept drift in a sub-population is caught before it drags the aggregate. Consider more frequent retrains for volatile segments.',
    source: 'Authored · Case-chain'
  },

  // 6a — RecSys retrieval caps ranker (recsys)
  {
    id: 'chain-recsys-retrieval-caps-ranker',
    subject: 'recsys',
    subtopic: 'retrieval recall ceiling',
    level: 'staff',
    type: 'multistep',
    title: 'New ranker crushes offline NDCG but online engagement barely moves',
    context: [
      'Two-stage recommender: retrieval (ANN, top-500 candidates) then a learned ranker.',
      'New ranker: offline NDCG@10 +12% on logged candidate sets. Online CTR +0.3% (flat).',
      'Retrieval recall@500 vs the ideal relevant set is measured at ~55%.',
      'Offline eval re-ranks the SAME logged candidates the old system retrieved.'
    ],
    steps: [
      {
        question: 'Offline NDCG +12% but online CTR flat. Given a two-stage system, where do you look first?',
        options: [
          'The ranker is broken',
          'The offline eval only re-ranks logged candidates, so it measures ranker skill within a fixed candidate pool — it cannot reflect items retrieval never surfaced',
          'CTR is the wrong metric',
          'Increase ranker depth'
        ],
        answer: 1,
        finding: 'Offline NDCG on logged candidates is conditioned on what retrieval already fetched. A better ranker reorders the same pool beautifully, but if the best items are not in the pool, online reality does not improve as much. The two-stage coupling is the suspect.'
      },
      {
        question: 'Retrieval recall@500 is ~55%. What ceiling does that impose on the whole system?',
        options: [
          'No ceiling — the ranker can recover missed items',
          'The ranker can only order what retrieval returns; 45% of relevant items are never candidates, so no ranker improvement can surface them — retrieval recall is a hard ceiling',
          'Recall@500 is irrelevant to ranking',
          'The ranker fixes retrieval misses automatically'
        ],
        answer: 1,
        finding: 'The core insight: a two-stage system\'s ceiling is set by retrieval recall. At 55%, nearly half the relevant items cannot be shown regardless of ranker quality. Ranker gains apply only to the 55% that made it through.'
      },
      {
        question: 'Why did offline NDCG rise 12% while online stayed flat, despite the same ranker?',
        options: [
          'Offline and online use different rankers',
          'Offline re-ranks a fixed logged pool so the ranker\'s reordering fully counts; online, the retrieval-limited pool means most reordering happens over already-mediocre candidates, so user-visible gains are small',
          'Online CTR is mismeasured',
          'The offline metric is random'
        ],
        answer: 1,
        finding: 'Offline gives the ranker full credit for reordering the logged set; online, the same reordering happens inside a recall-capped pool, so the marginal user sees little new. The gap between offline and online is exactly the retrieval ceiling.'
      },
      {
        question: 'What is the right next investment?',
        options: [
          'Keep tuning the ranker',
          'Improve retrieval recall (better embeddings, hybrid dense+sparse, larger/better candidate generation) so the ranker has good items to order — then re-measure ranker lift',
          'Remove the ranker',
          'Lower top-500 to top-100 for speed'
        ],
        answer: 1,
        finding: 'When retrieval caps the system, the highest-leverage work is retrieval recall, not more ranker tuning. Raise recall first; the existing ranker gains only materialise once the good items are in the candidate set.'
      }
    ],
    diagnosis: 'A retrieval recall ceiling (~55%) caps the whole recommender; a stronger ranker cannot surface items retrieval never fetched, so offline NDCG gains do not reach users.',
    explanation: 'Offline eval re-ranks logged candidates, giving the ranker full credit for reordering. Online, that reordering happens inside a candidate pool missing 45% of relevant items, so most user-visible value is capped. The +12% offline is real but confined to the 55% that retrieval surfaced — hence flat CTR. The chain: measure the ceiling, attribute the offline/online gap to it, then invest in retrieval.',
    fix: 'Invest in retrieval recall: better candidate-generation embeddings, hybrid dense+sparse retrieval, multiple retrieval sources, or a larger top-K. Add recall@K monitoring as a first-class metric. Re-run online tests after recall improves — the ranker\'s offline gains should then convert to CTR.',
    source: 'Authored · Case-chain'
  },

  // 6b — RecSys retrieval caps ranker (recsys) — cold-start flavour
  {
    id: 'chain-recsys-retrieval-coldstart-ceiling',
    subject: 'recsys',
    subtopic: 'retrieval ceiling + cold start',
    level: 'staff',
    type: 'multistep',
    title: 'Ranker A/B wins offline but new items never get shown despite the win',
    context: [
      'Two-stage recommender. Ranker retrained to boost fresh/cold-start items via a recency feature.',
      'Offline NDCG@10 +9% and offline fresh-item exposure +20%.',
      'Online, fresh-item impressions barely change; catalog coverage stays flat.',
      'Retrieval uses collaborative-filtering embeddings that require interaction history to place an item.'
    ],
    steps: [
      {
        question: 'The ranker boosts fresh items offline, but online fresh-item impressions do not move. What is the structural block?',
        options: [
          'The ranker feature is broken',
          'Fresh items must first be retrieved to be rankable; if retrieval never surfaces them, the ranker\'s freshness boost has nothing to act on',
          'Online logging is broken',
          'Fresh items are simply bad'
        ],
        answer: 1,
        finding: 'Same two-stage coupling: the ranker can only promote candidates retrieval returns. A freshness-aware ranker is moot for items that never enter the candidate set.'
      },
      {
        question: 'Retrieval uses CF embeddings needing interaction history. Why does that specifically starve cold-start items?',
        options: [
          'CF embeddings handle new items fine',
          'A brand-new item has no interactions, so its CF embedding is undefined or poorly placed — it is systematically absent from ANN candidate sets, a cold-start retrieval gap',
          'CF is unrelated to retrieval',
          'History only matters for the ranker'
        ],
        answer: 1,
        finding: 'CF embeddings are learned from interactions; a new item has none, so it cannot be embedded meaningfully and is invisible to nearest-neighbor retrieval. The cold-start deficit lives in retrieval, not ranking.'
      },
      {
        question: 'Why did offline show +20% fresh exposure while online showed none?',
        options: [
          'Offline used a different ranker',
          'Offline re-ranked logged candidate sets that happened to already contain some fresh items; online, cold items are absent from the CF-retrieval pool entirely, so there is nothing to re-rank',
          'Online metrics are wrong',
          'Offline exposure is random'
        ],
        answer: 1,
        finding: 'The offline pool included whatever fresh items past retrieval occasionally surfaced, so the ranker could promote them. Online, the CF retrieval systematically excludes cold items, so the promotion never fires. The offline/online gap is the cold-start retrieval ceiling.'
      }
    ],
    diagnosis: 'A cold-start retrieval gap: CF-embedding retrieval cannot place interaction-less new items, so a freshness-aware ranker has no cold items to promote.',
    explanation: 'The ranker fix targeted the wrong stage. Fresh items need interactions to get a CF embedding, so retrieval systematically omits them. Offline the logged pool contained some fresh items to re-rank (+20%), but online the CF retrieval excludes cold items outright, so the ranker\'s boost never activates. Retrieval, not ranking, is the ceiling for cold start.',
    fix: 'Add content-based / two-tower retrieval that embeds new items from metadata (no interactions needed), or an explicit exploration slot for cold items in candidate generation. Monitor catalog coverage and cold-item recall. Then the ranker\'s freshness feature will have candidates to promote.',
    source: 'Authored · Case-chain'
  },

  // 7 — High offline AUC, poor online (eval)
  {
    id: 'chain-offline-auc-online-gap',
    subject: 'eval',
    subtopic: 'offline-online gap',
    level: 'staff',
    type: 'multistep',
    title: 'Offline AUC 0.92, online it behaves like 0.75 — chase the gap',
    context: [
      'Click-prediction model. Offline AUC 0.92 on a random holdout of logged data.',
      'Online it underperforms; measured online AUC on served traffic ~0.75.',
      'Training data is logged impressions — items the CURRENT policy chose to show.',
      'One strong feature is "historical CTR of this item", updated in near-real-time.'
    ],
    steps: [
      {
        question: 'Offline 0.92 on a random holdout, online 0.75. What sampling issue does "logged impressions from the current policy" introduce?',
        options: [
          'None — logs are representative',
          'Selection/feedback-loop bias: training sees only items the current policy showed, so the model never learns on the items it will newly rank; the holdout shares this bias and is optimistic',
          'Random holdout removes all bias',
          'The log is too small'
        ],
        answer: 1,
        finding: 'Logged data is not a random sample of item-user pairs — it is what the deployed policy chose. A random holdout of that log inherits the selection bias, so offline AUC overstates performance on the true serving distribution.'
      },
      {
        question: 'The "historical CTR" feature updates in near-real-time. How can that inflate offline AUC but not online?',
        options: [
          'Real-time features are always fine',
          'If the offline feature snapshot reflects CTR as of scoring time (or later), it partially encodes the very click being predicted — a subtle leakage the online request cannot reproduce',
          'It only affects latency',
          'CTR features never leak'
        ],
        answer: 1,
        finding: 'A near-real-time aggregate can leak: if the offline join uses CTR computed at or after the impression, it contains information about the outcome. Online, the feature is strictly as-of request time, so the leaked signal disappears — widening the gap.'
      },
      {
        question: 'With both selection bias and a possibly-leaky feature, how do you get an honest offline estimate?',
        options: [
          'Trust the 0.92 and ship',
          'Use point-in-time feature snapshots (as-of request), and evaluate with bias-corrected offline methods (e.g., inverse-propensity weighting) or a proper online/interleaving test',
          'Increase the holdout size',
          'Switch to accuracy'
        ],
        answer: 1,
        finding: 'Honest offline eval needs point-in-time features to kill the leak and a bias correction (IPS/counterfactual eval) or an online experiment to account for selection bias. Only then will offline predict online.'
      }
    ],
    diagnosis: 'The offline/online gap comes from feedback-loop selection bias in logged data plus a near-real-time CTR feature that leaks the outcome offline.',
    explanation: 'Training and holdout both come from what the current policy showed, so offline overstates performance on the true serving distribution (selection bias). Separately, a real-time CTR feature joined at/after impression time leaks the click offline but is unavailable online, further inflating offline AUC. Both push the same direction, explaining 0.92 vs 0.75.',
    fix: 'Rebuild features with strict point-in-time (as-of request) joins to remove the CTR leak. Correct selection bias via inverse-propensity-weighted offline eval or rely on online/interleaving tests for the decision. Add exploration to the logging policy so future training data covers unshown items.',
    source: 'Authored · Case-chain'
  },

  // 8 — PR-AUC improves but ops complains about alert volume (monitoring)
  {
    id: 'chain-prauc-up-alert-volume',
    subject: 'monitoring',
    subtopic: 'precision-recall vs ops load',
    level: 'senior',
    type: 'multistep',
    title: 'New anomaly model improves PR-AUC but the on-call queue doubles',
    context: [
      'Infra anomaly detector. New model: PR-AUC 0.30 -> 0.38. Team ships it.',
      'On-call: daily alert volume doubled; most new alerts are dismissed as noise.',
      'Operating threshold was kept identical to the old model\'s threshold.',
      'Event base rate is ~0.5%; on-call can triage ~40 alerts/day sustainably.'
    ],
    steps: [
      {
        question: 'PR-AUC went up but alert volume doubled. What did keeping the same threshold ignore?',
        options: [
          'Nothing — same threshold is correct',
          'PR-AUC summarises the whole curve; the old threshold sits at a different precision/recall point on the new curve, so score meaning shifted and the same cutoff now fires more often',
          'PR-AUC and threshold are the same thing',
          'Alert volume is unrelated to threshold'
        ],
        answer: 1,
        finding: 'A better PR-AUC does not mean a fixed threshold gives the same operating point. The new model\'s score distribution differs, so reusing the old cutoff lands at a higher-recall/lower-precision point — more alerts, more noise.'
      },
      {
        question: 'On-call sustains ~40 alerts/day. How should the threshold actually be set?',
        options: [
          'At the old value for consistency',
          'At the precision/recall point that yields a manageable alert volume (a precision-at-fixed-budget or alerts-per-day constraint), not a value inherited from the old model',
          'At 0.5 always',
          'To maximise recall regardless of volume'
        ],
        answer: 1,
        finding: 'The operating point is a capacity constraint: pick the threshold on the new curve that yields ~40 alerts/day at the best achievable precision. PR-AUC improving means you can get more true positives within that same budget — if you re-tune.'
      },
      {
        question: 'Once you re-tune to the alert budget, how do you confirm the new model is actually better in ops terms?',
        options: [
          'PR-AUC alone proves it',
          'At equal alert volume (equal ops cost), compare precision / true-positives caught — the better PR-AUC should now yield more real incidents per alert',
          'Compare raw alert counts',
          'Trust the offline curve'
        ],
        answer: 1,
        finding: 'The fair comparison holds ops cost constant: at ~40 alerts/day, does the new model catch more true incidents at higher precision? A higher PR-AUC predicts yes, but you must operate both models at the same budget to see it.'
      }
    ],
    diagnosis: 'A genuinely better model (higher PR-AUC) was deployed at an inherited threshold, landing at a noisier operating point and doubling ops load.',
    explanation: 'PR-AUC measures the whole curve, but ops experiences a single operating point. Reusing the old threshold on a new score distribution moved the operating point toward higher recall and lower precision, so alerts doubled. The model is better in aggregate; the deployment picked the wrong point. Re-tuning to the alert budget realises the PR-AUC gain as higher precision at equal volume.',
    fix: 'Re-tune the threshold to the on-call budget (~40 alerts/day) using precision-at-fixed-volume. Compare old vs new at equal alert volume to confirm the new model catches more true incidents per alert. Monitor alerts-per-day and precision as first-class ops SLOs, not just PR-AUC.',
    source: 'Authored · Case-chain'
  },

  // 9 — Model staleness with no obvious alert (monitoring)
  {
    id: 'chain-staleness-silent',
    subject: 'monitoring',
    subtopic: 'silent staleness',
    level: 'senior',
    type: 'multistep',
    title: 'No alerts fired, yet the model has been silently stale for weeks',
    context: [
      'Ranking model retrained weekly by a scheduled job. All dashboards green.',
      'A stakeholder notices recommendations feel outdated; investigation confirms performance slid.',
      'Prediction latency, error rate, and input PSI monitors are all healthy.',
      'The retrain job has been silently failing for 3 weeks; serving pins the last good model artifact.'
    ],
    steps: [
      {
        question: 'All operational monitors are green but quality slid. What blind spot does that reveal?',
        options: [
          'The monitors are lying',
          'Serving-health monitors (latency, errors, PSI) do not observe model freshness; a stale-but-serving model looks perfectly healthy on those signals',
          'PSI should have caught it',
          'Latency proves the model is fresh'
        ],
        answer: 1,
        finding: 'Operational health and model freshness are different axes. A pinned old artifact serves fast with no errors and, if inputs drift slowly, stable PSI — so nothing red fires despite the model aging.'
      },
      {
        question: 'The retrain job failed silently for 3 weeks. Why did that not trip any alert?',
        options: [
          'Job failures always alert',
          'There was no monitor on job success/model age; the pipeline failed open — serving fell back to the last artifact instead of paging anyone',
          'PSI monitors job status',
          'Latency monitors retrain jobs'
        ],
        answer: 1,
        finding: 'The retrain job had no success/freshness alerting, and serving\'s fallback to the last good artifact is silent by design. Failing open kept the product up but hid the staleness — no page, no red dashboard.'
      },
      {
        question: 'What monitor would have caught this, and how do you distinguish staleness from concept drift here?',
        options: [
          'Add more latency alerts',
          'Alert on model age / retrain-job success and on a rolling live-quality metric; staleness (model unchanged, world moving) vs concept drift (relationship changed) is distinguished by whether a fresh retrain restores performance',
          'Trust PSI more',
          'Nothing could have caught it'
        ],
        answer: 1,
        finding: 'A model-age/freshness alert plus rolling live-quality tracking catches silent staleness. To separate it from concept drift: if a successful retrain on recent data restores performance, it was staleness; if not, the relationship itself changed (concept drift).'
      }
    ],
    diagnosis: 'Silent model staleness: the retrain job failed for 3 weeks with no freshness monitor, and serving failed open to the last artifact, so no operational alert fired while quality decayed.',
    explanation: 'Latency, error, and PSI monitors track serving health, not model age, so a pinned stale model passed them all. The retrain failure was silent because nothing watched job success or artifact freshness, and the fallback-to-last-good behavior masked it. Quality slid because the world moved while the model stood still — invisible to every monitor in place.',
    fix: 'Add model-freshness alerting: retrain-job success/failure paging and a max-model-age SLO. Track a rolling live-quality metric independent of serving health. On staleness, run a fresh retrain — if it restores performance it was staleness; if not, investigate concept drift. Make the retrain pipeline fail loud, not silently open.',
    source: 'Authored · Case-chain'
  }
];
