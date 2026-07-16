import { useState, useEffect } from 'react'
import TabHeader from '../components/TabHeader.jsx'
import FidelityBadge from '../components/FidelityBadge.jsx'
import HowToStrip from '../components/HowToStrip.jsx'
import { markActivity } from '../utils/activity.js'
import { CompanyLogoRow } from '../components/CompanyLogoRow.jsx'
import { companiesForIncident } from '../data/questionCompanies.js'
import LiveIncidentSection from '../components/LiveIncident.jsx'

const LS_KEY = 'msl_score:incidentroom'

// ── Incident scenarios ────────────────────────────────────────────────────────
// Each incident has 2–3 sequential diagnostic steps.
// Format: multi-step branching — choose first action, see finding, choose next action.

const INCIDENTS = [
  {
    id: 'inc1',
    title: 'AUC Drop + Latency Spike After Feature Migration',
    domain: 'Cross-domain: Feature Eng → Serving → MLOps',
    readMin: 10,
    situation: `72 hours after a feature store migration, the production recommendation model shows:
• AUC dropped from 0.847 → 0.803 (–5.2%)
• Serving P95 latency increased from 48ms → 89ms
• No pipeline failures. No data quality alerts. Recsys team wants to rollback immediately.

Your on-call shift starts in 10 minutes. What do you check first?`,
    steps: [
      {
        question: 'First diagnostic action:',
        options: [
          { id: 'a', text: 'Roll back the feature store migration immediately — two simultaneous degradations always share a root cause' },
          { id: 'b', text: 'Run PSI on the migrated features to check if distribution shifted during migration' },
          { id: 'c', text: 'Check serving infrastructure — latency spike may be independent of the model degradation' },
          { id: 'd', text: 'Retrain the model on post-migration data to re-establish baseline' },
        ],
        correct: 'b',
        finding: `PSI results on migrated features:
• user_embedding: PSI = 0.34 (ALERT — significant shift)
• item_embedding: PSI = 0.31 (ALERT)
• session_features: PSI = 0.04 (stable)

The embedding features drifted during migration. Old embeddings were L2-normalised; the migration script omitted the normalisation step — raw dot products now score differently.`,
        whatsTested: 'Whether you run PSI on migrated features before rolling back — diagnosing before acting.',
        antiPattern: 'Rolling back immediately without diagnosis means you will hit the same issue on the next migration attempt.',
        staffFraming: 'Two metrics degrading simultaneously after one change = shared root cause. Diagnose first, then decide whether to rollback.',
      },
      {
        question: 'Latency is also up 40ms. What explains it given the PSI finding?',
        options: [
          { id: 'a', text: 'Higher PSI = more computation per embedding lookup, increasing latency' },
          { id: 'b', text: 'The new embeddings are 512-dim vs 128-dim — ANN retrieval is slower and serving payload is larger' },
          { id: 'c', text: 'Latency is a coincidence — unrelated infra issue running in parallel' },
          { id: 'd', text: 'Model reranking is slower because scores are more uniform (less separation)' },
        ],
        correct: 'b',
        finding: `Confirmed: new feature store schema bumped embedding dimensions 128→512. ANN index (HNSW) query time scales roughly with dimension. Serving latency increased 41ms. The AUC drop and latency spike share the same root cause: the migration changed both normalisation and dimensionality.

Resolution: rollback the migration, fix the normalisation script and dimensionality, re-validate offline before re-deploying.`,
        whatsTested: 'Whether you understand that ANN query time scales with embedding dimension, linking the latency spike to the migration.',
        antiPattern: 'Treating the latency spike as an unrelated infra issue delays diagnosis by hours — concurrent degradations after a single change almost never coincide by accident.',
        staffFraming: 'Schema migration checklist: normalisation, dimensionality, data type, null handling. Miss one and you get a production incident.',
      },
    ],
    lesson: 'Two simultaneous degradations after a single change almost always share a root cause. Diagnose before rolling back — a rollback without root cause identification means you\'ll hit the same issue on the next migration.',
  },
  {
    id: 'inc2',
    title: 'Silent CTR Drop — No Alerts Fired',
    domain: 'Cross-domain: Monitoring → Feature Eng → Cold Start',
    readMin: 10,
    situation: `Recommendation CTR has dropped 8.3% over 21 days. No alerts fired during this period:
• Feature pipeline: all green
• Model serving: all green
• PSI on all monitored features: < 0.10

The drop is gradual, not sudden. PM is escalating. What's your first diagnostic move?`,
    steps: [
      {
        question: 'No standard alerts fired. Where is the signal hiding?',
        options: [
          { id: 'a', text: 'Check prediction score distribution — a coverage collapse can appear as stable PSI while scores shift' },
          { id: 'b', text: 'Add more PSI monitors since existing ones are clearly misconfigured' },
          { id: 'c', text: 'Trigger a full model retrain — gradual drops are always concept drift' },
          { id: 'd', text: 'Check for a traffic composition change (new user cohorts diluting CTR average)' },
        ],
        correct: 'a',
        finding: `Score distribution analysis reveals:
• 23.4% of items are scoring exactly 0.000
• 3 weeks ago this was 4.1%
• The 0.000-scoring items are entirely new catalog items added in the last 3 weeks

New items have no interaction history → feature lookup returns null → null coerced to 0.0 → ranked last or not surfaced. 23% of catalog is effectively invisible to users.`,
        whatsTested: 'Whether you check prediction score distributions for coverage collapse — PSI on feature values will stay stable because affected items have no features to drift.',
        antiPattern: 'Adding more PSI monitors when existing ones show green is the wrong move — the monitoring gap is a coverage metric, not a feature metric.',
        staffFraming: 'PSI monitors features. Coverage monitors items. A 23% catalog blind spot shows up in neither until you explicitly track % items scoring above threshold.',
      },
      {
        question: 'The cause is identified. What is the correct immediate fix?',
        options: [
          { id: 'a', text: 'Remove new items from the catalog until the model has enough data to score them' },
          { id: 'b', text: 'Implement a cold-start fallback: score new items using content embeddings + global popularity, bypass the interaction-history model' },
          { id: 'c', text: 'Set a floor score of 0.5 for all items with < 100 interactions' },
          { id: 'd', text: 'Retrain the model weekly to incorporate new items faster' },
        ],
        correct: 'b',
        finding: `Cold-start fallback implemented: items with < 50 interactions scored via content similarity (category + title embedding) + global CTR baseline. Score floor for new items set at P25 of active item distribution.

CTR recovered to –1.2% within 48 hours (residual gap = genuine quality difference between new and established items).

Monitoring added: "items scoring exactly 0.0" as a daily alert with threshold > 5%.`,
        whatsTested: 'Whether you know cold-start fallback is the right fix — removing items or setting floor scores are both wrong.',
        antiPattern: 'Setting a score floor of 0.5 for new items is dangerous — it artificially elevates unscored items above known-good items without any signal.',
        staffFraming: 'Cold-start is a product design decision, not a monitoring fix. Content embeddings + global popularity baseline is the standard solution. The monitoring alert on 0.0 scores is the prevention layer.',
      },
    ],
    lesson: 'Coverage collapse is a monitoring blind spot — PSI on feature values stays stable because the affected items have no features to drift. Add explicit catalog coverage metrics: % items with scores above threshold, % items returned zero score.',
  },
  {
    id: 'inc3',
    title: 'A/B Test Shows 12% Lift — But Traffic Split Is Off',
    domain: 'Cross-domain: Experimentation → Frontend → Statistics',
    readMin: 10,
    situation: `An experiment ran for 5 days shows:
• Control CTR: 4.21% | Treatment CTR: 4.73% — 12.4% relative lift, p = 0.003
• Control traffic: 48.2% | Treatment traffic: 51.8%
• Team wants to ship immediately based on the strong result.

You are reviewing before sign-off. What do you flag?`,
    steps: [
      {
        question: 'The traffic split is 48.2/51.8 instead of 50/50. Is this a problem?',
        options: [
          { id: 'a', text: 'Minor variance — traffic splits are never perfectly 50/50 in practice, result is still valid' },
          { id: 'b', text: 'Run a Sample Ratio Mismatch (SRM) check — a 3.6pp split deviation at this sample size requires a formal test before trusting any results' },
          { id: 'c', text: 'Re-weight the results by the traffic ratio to correct for the imbalance' },
          { id: 'd', text: 'Run the experiment for 2 more weeks to let the split stabilise naturally' },
        ],
        correct: 'b',
        finding: `SRM test result:
Chi-squared statistic: 14.2
p-value: 0.0002

SRM confirmed. The traffic split deviation is not random noise — it is statistically significant. This means the randomisation is broken. The measured 12.4% lift cannot be trusted: self-selection bias may explain part or all of the difference.

Stop analysis. Do not ship based on this result.`,
        whatsTested: 'Whether you run the SRM check before reading the primary metric — a significant SRM invalidates all downstream analysis.',
        antiPattern: 'Correcting for the traffic imbalance by reweighting does not fix an SRM — if randomisation is broken, the groups differ in unknown ways that cannot be reweighted away.',
        staffFraming: 'SRM check is gate zero. If it fails, stop reading your primary metric. Investigate randomisation first, then rerun.',
      },
      {
        question: 'SRM is confirmed. What caused it?',
        options: [
          { id: 'a', text: 'The experiment flagging logic ran on the server which creates timing-based assignment skew' },
          { id: 'b', text: 'The treatment variant is 200ms slower to render — mobile users bounce before the assignment event fires, so they are never counted as treatment' },
          { id: 'c', text: 'The control group was larger because it launched one hour earlier on the first day' },
          { id: 'd', text: 'Ad-blockers affect treatment and control differently due to different page structure' },
        ],
        correct: 'b',
        finding: `Performance profiling confirmed: treatment page renders 220ms slower on mobile (new image lazy-loading implementation). On mobile devices, 7.1% of users close the tab before the assignment event fires and the page load completes — these users are never recorded as treatment exposure.

The "lift" partially reflects the survivorship bias of mobile users who wait longer. After fixing the performance regression, re-running the experiment showed 3.1% CTR lift (genuine, ships).

Fix: assignment events must fire at page request, not at page-load completion.`,
        whatsTested: 'Whether you can trace SRM to an assignment event timing bug — mobile page-load latency causing 7% of treatment users to be unrecorded.',
        antiPattern: 'Running the experiment longer to let the split stabilise will not fix a structural assignment bug — more data compounds the systematic bias.',
        staffFraming: 'Assignment event fires at page request, not page load. This is a standard implementation pattern that prevents mobile drop-off from contaminating the exposure log.',
      },
    ],
    lesson: 'Always run the SRM check before looking at your primary metric. A significant SRM means your randomisation is broken and any observed effect is untrustworthy — even if it looks like a win. Fixing performance regressions in experiments is part of the experiment discipline.',
  },
  {
    id: 'inc4',
    title: 'Model Retrain Made Predictions Worse Overnight',
    domain: 'Cross-domain: Training Pipeline → Data Quality → Monitoring',
    readMin: 12,
    situation: `Weekly retrain ran successfully at 2am. By 6am, the fraud detection model's precision dropped from 0.91 → 0.67, recall from 0.84 → 0.89. No pipeline alerts fired. The retrain log shows no errors.

• Model artifact: successfully uploaded to S3
• Serving endpoint: updated to new version
• Training data window: last 90 days

What is your first diagnostic action?`,
    steps: [
      {
        question: 'Precision dropped 24 points, recall improved slightly. What failure mode does this suggest?',
        options: [
          { id: 'a', text: 'Data leakage — a feature correlated with the label was accidentally included in training' },
          { id: 'b', text: 'Class imbalance shifted — the training set now has proportionally more negatives, biasing the model toward precision' },
          { id: 'c', text: 'Label contamination — recent fraudulent transactions were incorrectly resolved as legitimate in the training data' },
          { id: 'd', text: 'Model serialization error — the wrong model weights were loaded onto the endpoint' },
        ],
        correct: 'c',
        finding: `Investigation of the last 90-day training window:
• Fraud labels come from a case management system that resolves investigations
• Resolution lag: genuine fraud cases take 30–90 days to confirm
• The most recent 30 days of training data contains many true fraud cases still labeled "unresolved" → treated as negative
• Model learned that recent transactions = not fraud (because confirmed fraud hasn't been labeled yet)

This is label leakage via resolution lag — a classic supervised learning failure mode in fraud.`,
        whatsTested: 'Whether you recognise precision drop + recall rise as a label contamination pattern — true positives being mislabeled as negatives.',
        antiPattern: 'Suspecting class imbalance or serialization error before checking the training label distribution — the retrain log showing SUCCESS does not validate label quality.',
        staffFraming: 'Precision drop with recall rise = model shifted toward predicting negative. In fraud with investigation lag, that means recent true fraud was relabeled as legitimate during training.',
      },
      {
        question: 'Resolution lag is confirmed. What is the correct training data fix?',
        options: [
          { id: 'a', text: 'Exclude the last 30 days from training — use only fully resolved cases' },
          { id: 'b', text: 'Add a "days_since_transaction" feature to let the model learn to discount recent transactions' },
          { id: 'c', text: 'Use only the most recent 30 days — more recent data = better signal' },
          { id: 'd', text: 'Upsample confirmed fraud cases from the recent 30-day window' },
        ],
        correct: 'a',
        finding: `Training data corrected: exclude all transactions with created_at within 45 days of training cutoff (conservative buffer above the 30-day resolution lag). Retrained model achieved precision 0.89, recall 0.83 — back to baseline.

Monitoring added: label resolution rate by cohort (week). If resolution rate for the most recent 30-day cohort < 60%, trigger an alert and skip the weekly retrain until labels stabilise.`,
        whatsTested: 'Whether you know to exclude the most recent unresolved window from training, not just add a feature for recency.',
        antiPattern: 'Adding days_since_transaction as a feature cannot fix the problem — the model still trains on mislabeled examples and learns a fundamentally wrong relationship.',
        staffFraming: 'Label cutoff = training cutoff minus resolution lag buffer. This is non-negotiable in any domain where ground truth is confirmed retrospectively.',
      },
    ],
    lesson: 'In fraud and any domain with investigation lag, the most recent data is the most dangerous for training. Labels take time to be confirmed. Always check resolution rate by cohort before including recent data in a training set.',
  },
  {
    id: 'inc5',
    title: 'Feature Store Returns Stale Values in Production',
    domain: 'Cross-domain: Feature Engineering → Serving → Data Engineering',
    readMin: 12,
    situation: `Your real-time fraud model uses a feature store for online serving. Two days after a schema migration in the upstream event pipeline, alerts show:

• user_txn_count_1h: values are uniformly 0 for all users
• user_avg_amount_7d: values are at their defaults (–1.0)
• Fraud catch rate: dropped 31% overnight
• Feature store write jobs: all show "SUCCESS" in logs

What is your first diagnostic step?`,
    steps: [
      {
        question: 'Feature store writes succeed but values are wrong. What do you check first?',
        options: [
          { id: 'a', text: 'Check if the serving endpoint is using cached features from before the migration' },
          { id: 'b', text: 'Inspect the feature store write job logs for schema mismatch warnings (not errors)' },
          { id: 'c', text: 'Verify the feature store TTL — values may have expired and fallen back to defaults' },
          { id: 'd', text: 'Roll back the upstream schema migration immediately' },
        ],
        correct: 'b',
        finding: `Feature store write job logs (full, not just status):
• WARNING: column "user_txn_count_1h" not found in source schema — defaulting to 0
• WARNING: column "user_avg_amount_7d" not found in source schema — defaulting to -1.0
• Job status: SUCCESS (warnings do not fail the job)

The upstream event pipeline migration renamed the columns (txn_count_1h → transaction_count_1h). The feature store write job silently defaulted the missing columns and reported SUCCESS. No error was raised.`,
        whatsTested: 'Whether you inspect full job logs for WARNING lines — a SUCCESS status with schema warnings is the most dangerous pipeline failure mode.',
        antiPattern: 'Rolling back the upstream migration before checking logs destroys evidence and skips diagnosis — you will not know the root cause until you read the warnings.',
        staffFraming: 'Job status SUCCESS ≠ data correctness. After any schema migration, scan pipeline logs for WARNING, not just ERROR. Silent defaults write garbage and report green.',
      },
      {
        question: 'Silent schema mismatch is confirmed. What is the systemic fix beyond patching the column names?',
        options: [
          { id: 'a', text: 'Add a post-write validation step: assert that feature distributions match the last 24h baseline before marking the job successful' },
          { id: 'b', text: 'Fail the write job on any unrecognised column — never default silently' },
          { id: 'c', text: 'Add schema version pinning on the feature store write contract — the job should fail if the source schema version changes' },
          { id: 'd', text: 'All of the above — each catches a different failure mode' },
        ],
        correct: 'd',
        finding: `Three-layer fix implemented:
1. Schema contract: write job fails if source schema version != expected version (catch upstream renames before they write)
2. Fail on unknown column (option B): write job fails, not warns, if expected feature columns are absent
3. Post-write distribution check (option A): automated check comparing feature mean ± 3σ vs rolling 7-day baseline — fires a P1 alert if deviation > 20%

All three are needed: schema contract catches renaming, fail-on-unknown catches deletion, distribution check catches silent value corruption (e.g., a column present but computed incorrectly).`,
        whatsTested: 'Whether you recognise that no single check is sufficient — schema contract, fail-on-unknown, and distribution validation each catch a different failure class.',
        antiPattern: 'Adding only schema version pinning misses column deletion and silent value corruption — a column can be present with the right name but computed incorrectly.',
        staffFraming: 'Defense in depth for feature pipelines: schema contract (catch renames), fail-on-unknown (catch deletions), post-write distribution check (catch value corruption). All three required.',
      },
    ],
    lesson: 'Feature store write jobs that warn but succeed are the most dangerous failure mode — all health checks show green while the model silently receives garbage. Add post-write distribution assertions as a mandatory step in any feature pipeline that feeds a production model.',
  },
  {
    id: 'inc6',
    title: 'Batch Scoring Job Produces Identical Predictions for All Users',
    domain: 'Cross-domain: Training Pipeline → Serving → Feature Engineering',
    readMin: 10,
    situation: `Your daily batch scoring job completed in 40 minutes (normal). But when the downstream email campaign team queries predicted scores:

• All 2.1M users have score = 0.493
• Score variance: 0.000 (literally zero)
• Model accuracy on holdout: 0.84 (still looks correct in MLflow)
• No serving errors, no pipeline failures

The campaign launches in 3 hours. What do you check first?`,
    steps: [
      {
        question: 'Model accuracy is fine but all predictions are the same. What is the likely cause?',
        options: [
          { id: 'a', text: 'The model is outputting the mean of its calibration distribution — calibration step has a bug' },
          { id: 'b', text: 'All input features are the same value — the batch scoring job read the wrong feature snapshot' },
          { id: 'c', text: 'The sigmoid output layer saturated — all logits are near 0, producing 0.5 output' },
          { id: 'd', text: 'The model file is corrupt — the scores are random noise that happens to cluster near 0.493' },
        ],
        correct: 'b',
        finding: `Inspect the feature snapshot used by the batch job:
• job_config.feature_snapshot_date = 2024-01-01 (hardcoded in the config file)
• Today's date: 2024-04-15
• All 2.1M users have features from Jan 1 — a 3.5 month old snapshot
• user_recency_days = 1 for all users (Jan 1 data treated as "yesterday")
• The constant features produced a near-constant output from the model

Root cause: a config file was not updated when the batch scoring job was templated from an old run.`,
        whatsTested: 'Whether your first reflex on zero-variance predictions is to check input features, not the model.',
        antiPattern: 'Suspecting sigmoid saturation or a corrupt model file before checking inputs wastes hours — the model is correct, it is receiving constant inputs.',
        staffFraming: 'Zero-variance predictions = identical inputs. Check feature snapshot date before anything else. The model cannot discriminate on features it never sees vary.',
      },
      {
        question: 'Stale snapshot confirmed. The campaign launches in 2.5 hours. What do you do?',
        options: [
          { id: 'a', text: 'Delay the campaign — never send based on known-bad scores' },
          { id: 'b', text: 'Re-run the batch job against the correct snapshot; monitor closely; launch only if job completes with non-trivial score variance' },
          { id: 'c', text: 'Use last week\'s valid scores — better than stale features from January' },
          { id: 'd', text: 'Randomly sample 50% of users as a control; use last week\'s scores for treatment — run it as an experiment' },
        ],
        correct: 'b',
        finding: `Batch job re-run against correct feature snapshot (today's date):
• Runtime: 38 minutes (completed with 52 minutes to spare)
• Score variance: 0.041 (normal range: 0.035–0.055)
• P10: 0.31, P50: 0.49, P90: 0.71 — healthy distribution

Campaign launched on time. Post-mortem: feature_snapshot_date must be a runtime parameter, not hardcoded in config. Added CI check: fail the job if snapshot_date is > 7 days stale.`,
        whatsTested: 'Whether you re-run immediately with the correct snapshot rather than falling back to last week\'s scores, given you have time.',
        antiPattern: 'Using last week\'s valid scores avoids the immediate problem but sends the campaign on 7-day-old propensity scores — cohorts shift weekly in most products.',
        staffFraming: 'Re-run is always the right call if you have runway. Document the config bug and add the stale-date CI check to prevent recurrence — that is the post-mortem, not just the fix.',
      },
    ],
    lesson: 'Zero-variance predictions are always a data problem, not a model problem. The model is working correctly on constant inputs and producing constant outputs. The diagnostic reflex: check the input feature distribution first, before touching the model.',
  },
  {
    id: 'inc7',
    title: 'Retraining Made the Model Worse — Pipeline Ran on Stale Data',
    domain: 'Cross-domain: Data Eng → MLOps → Monitoring',
    readMin: 10,
    situation: `Monday morning retrain completed successfully. All pipeline checks passed. Model was auto-promoted to production. By noon:
• Precision@100 dropped from 0.71 → 0.54 (–24%)
• No data quality alerts
• Training loss was lower than the previous run (0.43 → 0.38)
• Feature coverage: 100% on all columns

The ML platform engineer says "the pipeline is healthy." What went wrong?`,
    steps: [
      {
        question: 'Training loss went down but production precision collapsed. First hypothesis:',
        options: [
          { id: 'a', text: 'The model overfit to the training data — lower loss means overfitting at this dataset size' },
          { id: 'b', text: 'Check the training data date range — lower loss on stale data means the model learned outdated patterns' },
          { id: 'c', text: 'The evaluation metric changed — precision@100 is not aligned with the training objective' },
          { id: 'd', text: 'The model architecture was changed — check git diff on the model config' },
        ],
        correct: 'b',
        finding: `Training data audit shows the Monday retrain pulled data from the S3 partition using a date filter bug: it trained on data from 3 weeks ago instead of the last 7 days. The pipeline reported "100% coverage" because the stale partition was complete — no nulls, no schema errors. Training loss improved because the model fit the old distribution more tightly. But production traffic reflects current user behaviour — which diverged 3 weeks ago.`,
        whatsTested: 'Whether you check the training data date range when loss improves but production metrics collapse.',
        antiPattern: 'Trusting pipeline health checks that report row count and coverage — these tell you the data arrived, not that it is the right data.',
        staffFraming: 'In production, "pipeline passed" means schema and completeness checks passed. It does not mean temporal correctness. Always audit the actual date range of training data as the first step in a post-retrain regression. A lower training loss after a retrain is not always good news — it can mean the model fit stale patterns more precisely.',
      },
      {
        question: 'How do you prevent this class of failure going forward?',
        options: [
          { id: 'a', text: 'Add a row count check — if training data is below expected volume, fail the pipeline' },
          { id: 'b', text: 'Add a data freshness check: assert max(event_date) >= today - 1d before training starts' },
          { id: 'c', text: 'Switch to online learning so the model always trains on the most recent data' },
          { id: 'd', text: 'Add a holdout set that mirrors production traffic and evaluate on it before promotion' },
        ],
        correct: 'b',
        finding: `A data freshness assertion — checking that the maximum event date in the training set is within an expected recency window — would have caught this at pipeline start, before training consumed any compute. Row count checks miss temporal bugs entirely: a stale but complete partition passes row count with flying colours. A production-mirroring holdout is useful but it catches the failure after training, not before.`,
        whatsTested: 'Whether you know that data freshness checks and row count checks are different things and catch different failure modes.',
        antiPattern: 'Adding more volume checks when the bug is a date filter — a larger stale partition still passes a row count check.',
        staffFraming: 'Every training pipeline should assert temporal correctness before model fit: max(label_date) >= now - max_allowed_lag. This is a one-line check that prevents an entire class of silent production regressions. It belongs in the data validation step, not the model evaluation step.',
      },
    ],
    lesson: 'Pipeline health checks validate schema and completeness, not temporal correctness. A training data freshness assertion is a distinct, mandatory check. Lower training loss after a retrain is not inherently good — always audit the date range.',
  },
  {
    id: 'inc8',
    title: 'Serving Precision Collapsed — Training Metrics Were Fine',
    domain: 'Cross-domain: Feature Eng → Serving → MLOps',
    readMin: 10,
    situation: `A ranking model ships after passing all offline evaluations:
• Offline NDCG@10: 0.68 (above the 0.65 threshold)
• Offline Precision@20: 0.74
• Shadow mode A/B: no significant difference

48 hours after full traffic promotion:
• Live Precision@20: 0.41 (–44% vs offline)
• Click-through rate: down 18%
• Serving logs show predictions in range [0.0, 1.0] — no clipping errors

What explains the gap between offline and online performance?`,
    steps: [
      {
        question: 'Offline metrics were strong, shadow mode showed no gap, but live metrics collapsed. Most likely cause:',
        options: [
          { id: 'a', text: 'The model underfit — offline NDCG of 0.68 was too low to generalise' },
          { id: 'b', text: 'Training and serving compute features differently — a preprocessing step applied offline was not applied in the serving path' },
          { id: 'c', text: 'Shadow mode did not run long enough — 48 hours is needed for statistical power' },
          { id: 'd', text: 'The live traffic distribution is genuinely different — retrain on live data' },
        ],
        correct: 'b',
        finding: `Comparing the training pipeline and the serving feature store: training applied a log1p transform to the item_popularity feature. The serving path reads item_popularity raw (no transform). At training time, item_popularity was in the range [0, 12.5]. At serving time, it arrives in the range [1, 150,000]. The model sees feature values 4–5 orders of magnitude outside its training distribution. Shadow mode missed this because it replayed historical requests that were also logged without the transform — the shadow evaluation had the same bug.`,
        whatsTested: 'Whether you immediately compare training and serving preprocessing when offline metrics look good but online metrics collapse.',
        antiPattern: 'Trusting shadow mode as a complete proxy for online performance — shadow mode replays logged features, which may themselves be mis-transformed.',
        staffFraming: 'Training-serving skew is one of the highest-impact and hardest-to-detect failure modes in production ML. The canonical defence: a feature registry that logs both the training transform and the serving transform, and a CI check that diffs them on every model version. Shadow mode validates model outputs, not feature preprocessing.',
      },
      {
        question: 'How should you have caught this before promotion?',
        options: [
          { id: 'a', text: 'Run a longer shadow mode period — 7 days to cover weekly traffic patterns' },
          { id: 'b', text: 'Log training feature values at training time and serving feature values at inference time, then compare distributions before promotion' },
          { id: 'c', text: 'Add a schema check to the serving path to reject out-of-range features' },
          { id: 'd', text: 'Use the same codebase for training and serving features (e.g. a shared feature library)' },
        ],
        correct: 'b',
        finding: `Logging and comparing training vs serving feature distributions is the direct detection mechanism for training-serving skew. A shared feature library (option D) is the prevention mechanism — both are correct, but the question asks about detection before promotion. A schema range check would block extreme values but wouldn't identify that the transform is missing. PSI computed between training features and live serving features, run as a pre-promotion gate, would have caught the item_popularity divergence immediately.`,
        whatsTested: 'Whether you know that training-serving skew detection requires comparing feature distributions, not just model output distributions.',
        antiPattern: 'Running PSI only on model outputs — output PSI catches symptom, not cause. Feature-level PSI is needed to diagnose which input caused the drift.',
        staffFraming: 'Pre-promotion checklist for every model: (1) diff training transforms vs serving transforms in code, (2) run PSI on all feature distributions comparing training vs recent serving logs. Both checks must pass before promotion. This adds 30 minutes to the release process and prevents hours of live incident response.',
      },
    ],
    lesson: 'Training-serving skew is silent — offline metrics look good because evaluation uses the same mis-transformed features as training. The only reliable detection is explicitly comparing training and serving feature distributions before every promotion.',
  },
  {
    id: 'inc9',
    title: 'New User Cohort Tanks Engagement — Cold Start Failure',
    domain: 'Cross-domain: Recsys → Feature Eng → Monitoring',
    readMin: 8,
    situation: `A recommendation system serves personalised feeds. After a marketing campaign drove 140,000 new signups in 48 hours:
• New user 7-day retention: 18% (vs 34% for organic cohorts)
• Average session CTR for new users: 0.9% (vs 3.1% for existing users)
• Model serving: all green
• No pipeline alerts
• Existing user metrics: unchanged

The engineering lead says "the model is working — existing users are fine." What's happening?`,
    steps: [
      {
        question: 'New users have dramatically lower engagement despite the model reporting healthy. Root cause:',
        options: [
          { id: 'a', text: 'New users are lower quality — marketing campaigns attract less engaged audiences' },
          { id: 'b', text: 'The model has no signal for new users — cold start means recommendations default to popularity-based fallback, which is poorly calibrated' },
          { id: 'c', text: 'The model needs retraining — the new user cohort represents a distribution shift' },
          { id: 'd', text: 'The feature store is returning null values for new users, causing the model to produce random scores' },
        ],
        correct: 'b',
        finding: `New users have zero interaction history. The model\'s user-side features (embedding, historical CTR, session depth, long-term affinity scores) are all zero or missing. The system falls back to a popularity-based ranker. But the popularity fallback was calibrated on organic users — it surfaces tech/productivity content that performs well for engaged users. The marketing campaign drove a demographically different cohort. Popularity fallback + wrong demographic = near-random recommendations for a cohort that needed genre diversity exploration.`,
        whatsTested: 'Whether you understand that cold start is a feature coverage failure, not a model failure, and that popularity fallback quality depends on cohort alignment.',
        antiPattern: 'Treating "model is healthy for existing users" as evidence the system is working — cold start affects a separate code path (fallback ranker), not the main model.',
        staffFraming: 'Cold start is a separate product problem from recommendation quality. The fallback ranker needs its own evaluation: is it calibrated for the incoming cohort? A/B test the fallback independently of the main model. When a campaign drives new cohorts, pre-validate the fallback against that cohort\'s demographic profile before the campaign launches.',
      },
      {
        question: 'What\'s the highest-leverage cold start mitigation you can ship in 48 hours?',
        options: [
          { id: 'a', text: 'Collect more onboarding signals — add interest selection at signup to seed the user embedding' },
          { id: 'b', text: 'Retrain the main model with new user interaction data from this cohort' },
          { id: 'c', text: 'Replace the popularity fallback with a diversity-promoting ranker that explores content categories' },
          { id: 'd', text: 'Add a cold start threshold: serve only when the model has ≥10 interactions for a user' },
        ],
        correct: 'a',
        finding: `Onboarding interest selection gives the model immediate signal without requiring interaction history. Three interest tags from a signup screen are enough to pick a non-generic user embedding from a cluster of similar users. This is shippable in 48 hours (UI + a lookup table mapping interest tags to user cluster embeddings). Retraining takes days and won\'t help users arriving now. Diversity-promoting rankers help but don\'t address the signal poverty problem. A cold start threshold withholds recommendations entirely — that kills retention faster.`,
        whatsTested: 'Whether you know that onboarding signals (explicit preference collection) are the fastest cold start mitigation and don\'t require model retraining.',
        antiPattern: 'Waiting for enough interaction data before improving cold start performance — by the time you have 10 interactions, the user has already churned.',
        staffFraming: 'Cold start mitigation priority: (1) explicit signals (onboarding), (2) context signals (device, location, referral source), (3) collaborative filtering on similar users, (4) diversity-promoting fallback. Each tier takes progressively longer to ship. When you have an incident, start at tier 1.',
      },
    ],
    lesson: 'Cold start is a feature coverage failure in a separate code path from the main model. The fallback ranker needs independent calibration for incoming cohorts. Onboarding signals are the highest-ROI cold start mitigation and are shippable in hours.',
  },
  {
    id: 'inc10',
    title: 'Inference Latency Tripled — GPU OOM Triggers Silent Fallback',
    domain: 'Cross-domain: DL Serving → MLOps → Monitoring',
    readMin: 9,
    situation: `A text embedding service used for semantic search reports:
• P95 latency: 340ms (up from 110ms baseline)
• P50 latency: 95ms (unchanged)
• Error rate: 0.0% — no serving errors
• GPU memory usage: 98% (up from 71%)
• Business metric: search relevance score down 12%

The infrastructure team says "no errors, model is serving." Why is relevance down if there are no errors?`,
    steps: [
      {
        question: 'P95 tripled but P50 is unchanged and error rate is 0%. What\'s the most likely explanation?',
        options: [
          { id: 'a', text: 'P95 is being pulled up by a small number of very long queries — a text length issue, not an infrastructure issue' },
          { id: 'b', text: 'GPU OOM is triggering a silent CPU fallback for overflow requests — CPU inference runs correctly but 3× slower, and the fallback is logged as "success"' },
          { id: 'c', text: 'The embedding model is batching requests differently — larger batches increase GPU utilisation and latency' },
          { id: 'd', text: 'Network routing is sending some requests to an under-provisioned replica' },
        ],
        correct: 'b',
        finding: `Serving logs show two request classes: GPU path (mean 95ms, all healthy) and a CPU fallback path (mean 340ms, triggered when GPU memory is exhausted). The fallback produces valid embeddings from the same model weights on CPU — hence 0.0% error rate. But the CPU path activates for ~5% of requests (the highest-traffic queries that arrive during peak GPU utilisation). These are the searches most likely to be high-value — high-traffic queries are typically navigational, where relevance matters most. GPU memory grew because a recent update loaded a larger batch buffer without resizing the instance.`,
        whatsTested: 'Whether you understand that a CPU fallback can be functionally correct but latency-degraded, and that 0% error rate does not mean 0% degradation.',
        antiPattern: 'Concluding "no errors = no problem" — silent fallbacks are designed to not error. The signal is in latency percentile divergence, not error rate.',
        staffFraming: 'When P95 and P50 diverge dramatically with zero error rate, the correct hypothesis is always: a subset of requests is hitting a slower code path that is still returning 200s. In GPU serving, that path is almost always CPU fallback. Monitor the fallback activation rate as a first-class metric — not a debug log.',
      },
      {
        question: 'What monitoring would have caught this before it affected relevance?',
        options: [
          { id: 'a', text: 'Alert on GPU memory % — trigger when utilisation exceeds 85% sustained for 5 minutes' },
          { id: 'b', text: 'Alert on the CPU fallback activation rate — any non-zero fallback rate in production should trigger a page' },
          { id: 'c', text: 'Alert on P95/P50 ratio — when this ratio exceeds 2.5, it indicates bimodal latency distribution from a fallback path' },
          { id: 'd', text: 'All three — GPU memory, fallback rate, and latency ratio are complementary signals for this failure mode' },
        ],
        correct: 'd',
        finding: `All three metrics are needed: GPU memory gives early warning before fallback activates. Fallback rate is the direct signal. P95/P50 ratio detects bimodal latency even if the fallback path isn\'t explicitly logged. No single metric is sufficient — GPU memory can spike without triggering fallback (if requests are short), fallback can activate without appearing in P50 (if it\'s rare), and P95/P50 ratio can diverge for other reasons (long queries). Together they triangulate to a confident diagnosis in minutes rather than hours.`,
        whatsTested: 'Whether you know that GPU serving failure modes require multiple complementary monitoring signals, not a single metric.',
        antiPattern: 'Monitoring only error rate for a serving system — error rate is the last signal to trigger for a well-engineered fallback.',
        staffFraming: 'Production GPU serving monitoring checklist: (1) device memory utilisation with headroom alert, (2) fallback path activation rate as a first-class metric, (3) latency percentile spread (P99/P50 or P95/P50), (4) per-path latency breakdown if multiple serving paths exist. Wire all four before the first traffic hits a GPU-served model.',
      },
    ],
    lesson: 'Silent fallbacks produce valid outputs at degraded performance — error rate stays zero while quality degrades. The signal is latency percentile divergence and explicit fallback activation rate monitoring, not error rate.',
  },
  {
    id: 'inc11',
    title: 'Model AUC Looks Great — But It\'s Leaking the Label',
    domain: 'Cross-domain: Feature Eng → Training → Data Quality',
    readMin: 8,
    situation: `A fraud detection model ships after 4 weeks of development:
• Training AUC: 0.97
• Holdout AUC: 0.96
• Production precision@1%: 0.23 (expected ≥0.55 based on holdout)

The model that looked production-ready in evaluation is catching less than half the fraud you predicted. What happened?`,
    steps: [
      {
        question: 'High holdout AUC that collapses in production is a classic symptom of:',
        options: [
          { id: 'a', text: 'Overfitting — the model memorised training data and fails to generalise' },
          { id: 'b', text: 'A feature that encodes the label — the model learned the outcome, not its predictors' },
          { id: 'c', text: 'Class imbalance — 0.96 AUC is misleadingly high when fraud is rare' },
          { id: 'd', text: 'Distribution shift — fraud patterns changed between training data collection and deployment' },
        ],
        correct: 'b',
        finding: `Feature audit surfaces the culprit: the training pipeline included \`days_to_dispute\` — the number of days between a transaction and its dispute filing. For fraudulent transactions, this field is populated (median 12 days). For legitimate transactions, it is NULL or zero. The feature directly encodes whether a fraud event occurred. The model learned one feature and achieved near-perfect separation. In production, \`days_to_dispute\` is always NULL at inference time (disputes haven\'t been filed yet — they happen after the fact). The model scores every production transaction as low-risk.`,
        whatsTested: 'Whether you immediately audit features for post-event information when holdout AUC is suspiciously high.',
        antiPattern: 'Accepting 0.96 holdout AUC as validation — in fraud detection, AUC this high almost always indicates a leaking feature, not a good model.',
        staffFraming: 'An AUC of 0.96+ on a fraud detection problem is a red flag, not a green light. Fraud is hard. Legitimate 0.9+ AUC requires years of feature engineering. The right response to very high holdout performance is not celebration — it\'s a feature audit. Every feature should be audited for temporal validity: "would this feature be available at inference time?" If the answer is "not always" or "only after the event," the feature is leaking.',
      },
      {
        question: 'How do you systematically prevent label leakage in future training pipelines?',
        options: [
          { id: 'a', text: 'Use only features that were available at the time of the transaction, not features computed after its outcome was known' },
          { id: 'b', text: 'Run a correlation check between each feature and the label — features with correlation > 0.5 are suspicious' },
          { id: 'c', text: 'Implement a point-in-time feature construction: features are computed using only data available up to the transaction timestamp' },
          { id: 'd', text: 'Both A and C — temporal validity is the principle, point-in-time construction is the implementation' },
        ],
        correct: 'd',
        finding: `Point-in-time correctness is the implementation of temporal validity. For every training example at timestamp T, features must be computed using only data with event_time ≤ T. This prevents any post-event information from entering the training pipeline. Correlation checks (option B) help but are insufficient — a leaking feature can have moderate correlation if fraud labels are noisy. The gold standard is a feature construction audit: for every feature, answer "at training time (timestamp T), could this value have been known?" If not, exclude it.`,
        whatsTested: 'Whether you know that point-in-time feature construction is the correct implementation of temporal validity, not just a correlation check.',
        antiPattern: 'Relying on correlation thresholds to detect leakage — a leaking feature with noisy labels can have moderate correlation and still cause significant inflation of offline metrics.',
        staffFraming: 'Label leakage audit is mandatory before any model ships to production. Two checks: (1) for every feature, verify it is temporally valid (available at inference time), (2) run ablation — remove the top 5 features by importance and check if AUC drops dramatically. A legitimate model\'s AUC should degrade gracefully across feature ablations. A leaking model\'s AUC collapses when the leaking feature is removed.',
      },
    ],
    lesson: 'Suspiciously high AUC is a red flag, not a green light. Temporal validity audit and point-in-time feature construction are non-negotiable before any predictive model ships to production.',
  },
  {
    id: 'inc12',
    title: 'Canary Rollout: Latency Looks Fine, But Users Are Churning',
    domain: 'Cross-domain: MLOps → Monitoring → Recsys',
    readMin: 9,
    situation: `A new recommendation model is deployed via 5% canary:
• Canary P95 latency: 82ms (vs 78ms baseline — within SLA)
• Canary error rate: 0.0%
• Canary vs control: no statistically significant difference in CTR after 24 hours
• Decision: promote to 100% traffic

36 hours after full promotion:
• 7-day retention for the post-promotion cohort: down 11%
• Session depth (pages/session): down 14%
• CTR: unchanged

The model passed every canary check. What happened?`,
    steps: [
      {
        question: 'Canary passed all standard checks but long-term retention collapsed. The gap is explained by:',
        options: [
          { id: 'a', text: 'The canary ran for too short a period — 24 hours is insufficient for a weekly-pattern product' },
          { id: 'b', text: 'CTR is the wrong metric for canary evaluation — it measures clicks, not satisfaction or return probability' },
          { id: 'c', text: 'Retention and session depth are affected by the cumulative effect of multiple sessions — a canary measuring single-session CTR cannot detect multi-session degradation' },
          { id: 'd', text: 'All three — duration, metric choice, and accumulation effect all contributed' },
        ],
        correct: 'd',
        finding: `Three compounding factors: (1) 24 hours is one news cycle, not a habit cycle — retention signals require 5–7 days minimum. (2) CTR measures click intent, not satisfaction — a recommendation system can inflate CTR with clickbait thumbnails while degrading long-term engagement. (3) The new model optimised for short-term CTR at the expense of recommendation diversity. Users clicked more in session 1 but found their feed homogeneous by session 3. Diversity collapse doesn\'t show up in single-session canary metrics — it shows up in return rates after 48–72 hours.`,
        whatsTested: 'Whether you understand that canary metrics must match the product\'s success horizon — short-term metrics can be orthogonal to long-term retention.',
        antiPattern: 'Using CTR as the sole canary metric for a recommendation system — CTR measures immediate engagement, not the product quality signal that drives retention.',
        staffFraming: 'Canary metric selection is a product decision, not an engineering decision. For recommendation systems, the minimum canary metric set is: (1) session CTR (short-term), (2) session depth or scroll depth (mid-term satisfaction proxy), (3) 3-day return rate if canary duration allows, (4) diversity metric (intra-list diversity or novelty score). CTR alone is insufficient and actively misleading for systems where engagement quality determines long-term retention.',
      },
      {
        question: 'How long should the canary have run before promotion was considered safe?',
        options: [
          { id: 'a', text: '48 hours — enough to capture a full weekday/weekend cycle' },
          { id: 'b', text: '5–7 days — long enough to observe whether users return for a second and third session' },
          { id: 'c', text: '2 weeks — to cover two full weekly traffic cycles and seasonal variation' },
          { id: 'd', text: 'Duration is secondary — the right metrics at 24 hours are more important than running longer with the wrong metrics' },
        ],
        correct: 'b',
        finding: `5–7 days is the practical minimum for a recommendation system canary that must detect retention effects. This captures: first return visit (typically 24–48h for engaged users), second return visit (confirms habit formation vs one-time return), and weekend/weekday traffic composition differences. 2 weeks provides stronger statistical power but delays launches significantly — it\'s appropriate for high-risk changes. 48 hours is insufficient to measure return rate. Option D is directionally correct but incomplete — better metrics at 24h would help, but diversity collapse requires observing multiple sessions which requires time.`,
        whatsTested: 'Whether you know the appropriate canary duration for a system where the key metric (retention) is inherently delayed.',
        antiPattern: 'Minimising canary duration to ship faster — for recommendation systems, the business cost of a post-promotion rollback typically exceeds the cost of 5 additional canary days.',
        staffFraming: 'Canary duration is set by the latency of the signal you are trying to detect. If your success metric is 7-day retention, your canary must run long enough to observe retention behaviour. A useful heuristic: canary duration ≥ 2× the expected time between user sessions for your median user. For a daily-use product, 2 days minimum. For a weekly-use product, 10–14 days minimum.',
      },
    ],
    lesson: 'Canary metrics must match the product\'s success horizon. CTR is a click signal, not a retention signal. For recommendation systems: canary duration ≥ 2× median inter-session time, and the metric set must include session depth and short-term return rate alongside CTR.',
  },
  {
    id: 'inc-uber-seasonality',
    title: 'Surge Model Blind to New Year\'s Eve — 90-Day Window Erased Annual Seasonality',
    domain: 'Cross-domain: Training Data → Forecasting → Monitoring',
    readMin: 8,
    situation: `Uber's dynamic surge pricing model failed during New Year's Eve. The model predicted normal demand, surge was not applied early enough, and thousands of riders faced 45-minute waits.
• Post-incident: the model had never seen NYE data at this year's scale — it used a 90-day rolling training window.
• A 90-day window trained in Nov–Dec contains no NYE data (the last NYE was 365+ days ago), so annual seasonality is completely invisible.

The pricing team wants to know how this slipped through. What could have caught it?`,
    steps: [
      {
        question: 'What monitoring would have caught this before New Year\'s Eve?',
        options: [
          { id: 'a', text: 'Track only model accuracy metrics' },
          { id: 'b', text: 'Shadow-score upcoming high-risk dates using historical data; alert when forecast diverges from event-adjusted baseline' },
          { id: 'c', text: 'Only monitor real-time prediction errors' },
          { id: 'd', text: 'Check model version in production' },
        ],
        correct: 'b',
        finding: `Proactive shadow evaluation: 1 week before NYE, run the model on last year's NYE patterns. Compare output to expected surge. Alert if model predicts normal demand on a known high-event date.`,
        whatsTested: 'Whether you monitor by proactively shadow-scoring known high-risk future dates rather than waiting for live prediction errors.',
        antiPattern: 'Monitoring only accuracy or real-time errors detects the failure while it is already happening — too late for a once-a-year event.',
        staffFraming: 'For rare, high-impact events, monitoring must be forward-looking: replay the model against historical instances of the upcoming event and alert when it under-forecasts before the date arrives.',
      },
      {
        question: 'How should surge pricing balance explore/exploit — accuracy vs. user experience?',
        options: [
          { id: 'a', text: 'Always maximize accuracy' },
          { id: 'b', text: 'Use contextual bandits to test different surge levels, learning true elasticity curves' },
          { id: 'c', text: 'Only apply surge during confirmed events' },
          { id: 'd', text: 'Set surge manually during all major events' },
        ],
        correct: 'b',
        finding: `True demand elasticity is unknown. Contextual bandit: try different surge levels in similar contexts, observe supply response and rider cancellations. Balances exploration (learn elasticity) with exploitation (apply optimal surge).`,
        whatsTested: 'Whether you recognise that surge levels must be learned online via contextual bandits because true elasticity is never known a priori.',
        antiPattern: 'Always maximising accuracy or setting surge manually ignores that the elasticity curve itself is unknown and must be estimated from live supply/cancellation response.',
        staffFraming: 'When the ground-truth response function is unobservable, treat pricing as a bandit: explore surge levels to learn elasticity, exploit to apply the optimal level.',
      },
    ],
    lesson: 'A short rolling training window silently erases annual seasonality — the model never sees events that happen once a year. Fix the data strategy (stratified temporal sampling that always retains historical holiday examples, plus a dedicated event-spike model), and make monitoring forward-looking by shadow-scoring high-risk dates before they arrive.',
  },
  {
    id: 'inc-doordash-drift',
    title: 'ETA Overestimates 8 Minutes After Batched Delivery Launch — Concept Drift, No Batching Features',
    domain: 'Cross-domain: Concept Drift → Feature Eng → Segmented Monitoring',
    readMin: 8,
    situation: `DoorDash's delivery ETA model showed systematic 8-minute overestimates in dense urban areas during lunch rush, causing order cancellations.
• A new 'batched delivery' feature (one driver picks up multiple orders) had recently launched.
• The model had no batching features and was trained on pre-batching data.

Same distance + same traffic now implies a longer time due to multi-stop routing — but the model can't see it. What kind of shift is this, and how do you monitor for it?`,
    steps: [
      {
        question: "What type of distribution shift occurred and why didn't the model detect it?",
        options: [
          { id: 'a', text: 'Covariate shift only' },
          { id: 'b', text: "Concept drift — delivery mechanics changed, making P(delivery_time | features) different post-batching, with no batching features in the model" },
          { id: 'c', text: 'Label shift only' },
          { id: 'd', text: 'Sample selection bias' },
        ],
        correct: 'b',
        finding: `Batched delivery changes P(Y|X): same distance + same traffic now implies longer time due to multi-stop route. The model had no batching features, so this new causal mechanism was invisible to monitoring.`,
        whatsTested: 'Whether you can distinguish concept drift (P(Y|X) changed) from covariate/label shift, and connect it to the missing batching features.',
        antiPattern: 'Calling it covariate or label shift misdiagnoses the cause — the input distribution barely moved; it is the relationship between features and delivery time that changed.',
        staffFraming: 'When a product mechanic changes the causal relationship between existing features and the target, that is concept drift — and it is invisible to feature-distribution monitoring because the features themselves look unchanged.',
      },
      {
        question: 'How would you set up online monitoring to catch this within 30 minutes of onset?',
        options: [
          { id: 'a', text: 'Monitor overall RMSE daily' },
          { id: 'b', text: 'Real-time tracking of prediction residuals by delivery type with CUSUM anomaly detection; alert when 30-min residual exceeds 2 minutes' },
          { id: 'c', text: 'Monitor only driver ratings' },
          { id: 'd', text: 'Check model version daily' },
        ],
        correct: 'b',
        finding: `CUSUM on 30-min residuals by segment (batched/non-batched, urban/suburban, time-of-day). Triggers within minutes of systematic shift. Segmented monitoring ensures urban/batched degradation doesn't get averaged away.`,
        whatsTested: 'Whether you monitor residuals segmented by delivery type with a fast changepoint detector, rather than a single aggregate metric.',
        antiPattern: 'Monitoring overall daily RMSE averages the urban/batched degradation away — the systematic error hides inside the aggregate and takes days to surface.',
        staffFraming: 'Segment monitoring by the dimension where drift concentrates (delivery type, geo, time-of-day) and use CUSUM on residuals so a systematic bias trips an alert within minutes instead of days.',
      },
    ],
    lesson: 'A new product mechanic can change P(Y|X) — concept drift — while feature distributions look unchanged, so it evades standard drift monitoring. The durable fix is to add features encoding the new mechanic (is_batched, batch_size, batch_position, route detour) and to monitor residuals segmented by that mechanic with a fast changepoint detector.',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
function IncidentCard({ incident, completed, onComplete, onNavigate, autoExpand }) {
  const [expanded, setExpanded]   = useState(autoExpand || false)
  const [stepIdx, setStepIdx]     = useState(0)
  const [picks, setPicks]         = useState([])
  const [revealed, setRevealed]   = useState([])
  const [done, setDone]           = useState(completed)

  const step      = incident.steps[stepIdx]
  const stepPick  = picks[stepIdx]
  const stepRevld = revealed[stepIdx]

  function pickOption(id) {
    if (stepPick) return
    const next = [...picks]
    next[stepIdx] = id
    setPicks(next)
  }

  function revealStep() {
    const next = [...revealed]
    next[stepIdx] = true
    setRevealed(next)
    markActivity()
  }

  function nextStep() {
    if (stepIdx + 1 < incident.steps.length) {
      setStepIdx(stepIdx + 1)
    } else {
      setDone(true)
      onComplete(incident.id, picks)
    }
  }

  return (
    <div style={{ border: `1px solid ${done ? 'var(--mint)' : 'var(--rim)'}`, borderLeft: `3px solid ${done ? 'var(--mint)' : 'var(--prime)'}`, borderRadius: '10px', overflow: 'hidden', background: 'var(--surface)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {incident.domain}
            </span>
            {incident.readMin && (
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>~{incident.readMin} min</span>
            )}
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--rose)', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '4px', padding: '1px 6px' }}>senior</span>
            <CompanyLogoRow companies={companiesForIncident(incident)} size={14} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
            {incident.title}
          </div>
        </div>
        <span style={{ fontSize: '13px', color: done ? 'var(--mint)' : 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '2px' }}>
          {done ? '✓ done' : expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* Situation */}
          <div style={{ background: 'var(--card-scrim)', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', border: '1px solid var(--rim)' }}>
            <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Situation</div>
            <pre style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {incident.situation}
            </pre>
          </div>

          {/* Current step */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', marginBottom: '10px' }}>
              Step {stepIdx + 1} of {incident.steps.length}
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '12px', fontFamily: 'var(--font-sans)' }}>
              {step.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {step.options.map(opt => {
                const picked  = stepPick === opt.id
                const correct = opt.id === step.correct
                const right   = stepPick && picked && correct
                const wrong   = stepPick && picked && !correct
                return (
                  <button
                    key={opt.id}
                    className={`msl-option-btn${right ? ' correct' : wrong ? ' wrong' : ''}`}
                    onClick={() => pickOption(opt.id)}
                    disabled={!!stepPick}
                  >
                    {opt.text}
                  </button>
                )
              })}
            </div>

            {stepPick && !stepRevld && (
              <button className="btn-primary" onClick={revealStep} style={{ fontSize: '12px' }}>
                See finding →
              </button>
            )}

            {stepRevld && (
              <div style={{ marginTop: '12px' }}>
                <div className="msl-reveal-panel" style={{ padding: '14px 16px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: stepPick === step.correct ? 'var(--mint)' : 'var(--rose)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {stepPick === step.correct ? '✓ Correct action' : '✗ Suboptimal — here\'s what the data showed'}
                  </div>
                  <pre style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {step.finding}
                  </pre>
                  {step.whatsTested && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>What this tests · </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>{step.whatsTested}</span>
                    </div>
                  )}
                  {step.antiPattern && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--rose)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Anti-pattern · </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>{step.antiPattern}</span>
                    </div>
                  )}
                  {step.staffFraming && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px' }}>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--violet)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>How a senior frames this · </span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.55 }}>{step.staffFraming}</span>
                    </div>
                  )}
                </div>
                {!done && (
                  <button className="btn-primary" onClick={nextStep} style={{ fontSize: '12px' }}>
                    {stepIdx + 1 < incident.steps.length ? 'Next diagnostic step →' : 'Complete incident →'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Lesson + What to do next (shown when complete) */}
          {done && (
            <>
              <div style={{ padding: '12px 16px', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '8px', marginTop: '8px' }}>
                <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Key lesson</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{incident.lesson}</p>
              </div>
              <div style={{ marginTop: '12px', padding: '12px 16px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>What to do next</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {onNavigate && (
                    <button onClick={() => onNavigate('combinator')} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                      Test in Combinator →
                    </button>
                  )}
                  {onNavigate && (
                    <button onClick={() => onNavigate('mlcoding')} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                      ML Coding Lab →
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function IncidentRoomTab({ onNavigate }) {
  const urlScenario = new URLSearchParams(window.location.search).get('scenario')

  const [completedIds, setCompletedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(completedIds))
  }, [completedIds])

  function handleComplete(id) {
    setCompletedIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const done  = completedIds.length
  const total = INCIDENTS.length

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Interview zone</div>
        <TabHeader title="
          Cross-Domain Challenges
        " style={{ margin: '0 0 10px' }} />
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '580px', margin: '0 0 4px' }}>
          Cross-domain production incidents — each requires reasoning across Feature Engineering, Monitoring, Serving, and Experimentation simultaneously. This is the judgment interviewers test when they ask "what would you check first?"
        </p>
        <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-sans)', margin: '4px 0 10px' }}>
          Not code bugs, not isolated domain MCQs — multi-step diagnosis with branching findings.
        </p>
        <div style={{ marginTop: '8px' }}><FidelityBadge tier="conceptual" /></div>
      </div>
      <HowToStrip
        skill="Cross-domain production incident diagnosis"
        steps={['Read the situation — no scrolling ahead', 'Choose your first diagnostic action', 'Follow the finding to the root cause']}
      />

      {/* Progress */}
      {done > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: 'var(--card-pad-primary)', background: 'var(--card-scrim)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Incidents resolved</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ width: `${Math.round((done / total) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{done}/{total}</span>
        </div>
      )}

      {/* Empty state for first-time visitors */}
      {done === 0 && !urlScenario && (
        <div style={{ marginBottom: '20px', padding: '16px 18px', borderRadius: '10px', background: 'rgba(240,165,0,0.08)', border: '1px dashed rgba(240,165,0,0.30)' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', fontWeight: 700 }}>Start here</div>
          <div style={{ fontSize: '13px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
            New to Cross-Domain Challenges? Start with <strong style={{ color: 'var(--ink-hi)' }}>incident #1 — Recommender CTR drop</strong>. It introduces the cross-domain diagnostic pattern: production symptom → upstream signal → root cause. Once it clicks, the other 11 incidents take 8-10 minutes each.
          </div>
        </div>
      )}

      {/* Live incidents — timed, stateful sev-1 simulations (2026-07-16) */}
      <LiveIncidentSection />

      {/* Incidents */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {INCIDENTS.map(inc => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            completed={completedIds.includes(inc.id)}
            onComplete={handleComplete}
            onNavigate={onNavigate}
            autoExpand={urlScenario === inc.id}
          />
        ))}
      </div>

      {/* Forward pointer */}
      {onNavigate && (
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
          <button
            onClick={() => onNavigate('combinator')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ fontSize: '12px', color: 'var(--prime)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Test cross-domain judgment in Combinator</span>
            <span style={{ fontSize: '12px', color: 'var(--prime)' }}>→</span>
          </button>
        </div>
      )}
    </div>
  )
}
