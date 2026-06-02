import React, { useState, useEffect } from 'react'
import { toggleBookmark, isBookmarked } from '../utils/bookmarks.js'

// ─── ML Incident Room ────────────────────────────────────────────────────────

const INCIDENTS = [
  {
    id: 'stale_embed',
    title: 'Silent Recommendation Degradation',
    severity: 'P1',
    severityColor: 'var(--prime)',
    tagline: 'CTR dropped 18% over 4 days. No alerts fired.',
    context: 'You run a two-tower recommendation system. Item embeddings are refreshed daily from a feature pipeline. User embeddings are refreshed hourly. Your monitoring tracks accuracy@10 and latency. It\'s Tuesday 2am — PagerDuty fires for the first time.',
    clues: [
      { id: 'metrics', label: 'Metrics dashboard',
        content: 'CTR: -18% (Day-over-day). Accuracy@10: -12%. P50 latency: 45ms (normal). P99 latency: 210ms (normal). Model version: v2.3 (deployed 5 days ago, no change since). A/B test running: no.' },
      { id: 'pipeline', label: 'Feature pipeline logs',
        content: 'Day 1: item_embedding_pipeline SUCCESS 02:14\nDay 2: item_embedding_pipeline SUCCESS 02:11\nDay 3: item_embedding_pipeline FAILED 02:18 — "S3 path not found: s3://features/items/2025-01-14/"\nDay 4: item_embedding_pipeline FAILED 02:09 — "S3 path not found"\nDay 5 (today): item_embedding_pipeline FAILED 02:21 — "S3 path not found"\n\n⚠ No alert was configured on pipeline failure. Serving fell back to last successful embeddings silently.' },
      { id: 'freshness', label: 'Feature freshness log',
        content: 'user_embeddings: last_updated=2h ago (FRESH)\nitem_embeddings: last_updated=3 days 21h ago (STALE ⚠)\nuser_context_features: last_updated=45m ago (FRESH)\nitem_metadata: last_updated=6h ago (FRESH)\n\nFreshness SLA breach: item_embeddings exceeded 26h threshold (3 days ago). No consumer alert configured.' },
      { id: 'drift', label: 'Item catalog drift',
        content: 'New items added last 3 days: 14,200\nItems with no embedding (added after last successful pipeline): 14,200\nCoverage: 73% of catalogue has fresh embeddings (down from 99%)\nImpact: 27% of eligible items cannot be retrieved — model defaults to popular-item fallback for all users.' },
    ],
    diagnosis: 'stale_pipeline',
    diagnosisOptions: [
      { id: 'model_bug',        label: 'Model regression — v2.3 introduced a bug' },
      { id: 'stale_pipeline',   label: 'Feature pipeline failure — item embeddings are 4 days stale' },
      { id: 'infra',            label: 'Infrastructure issue — serving cluster degraded' },
      { id: 'data_drift',       label: 'Input distribution shift — user behaviour changed' },
    ],
    fix: 'Immediately: re-run the item embedding pipeline with a manual backfill. Configure pipeline failure alerts. Add a feature freshness monitor that pages on-call if item_embeddings > 26h stale. Add a serving-layer health check that compares embedding coverage against catalogue size.',
    lesson: 'Silent fallbacks are silent failures. A serving system that degrades gracefully without alerting is worse than one that crashes loudly — you lose days of recovery time.',
  },
  {
    id: 'label_leak',
    title: 'Fraud Model Performance Cliff',
    severity: 'P0',
    severityColor: 'var(--prime)',
    tagline: 'Precision dropped from 0.91 to 0.43 in production overnight.',
    context: 'A gradient boosted fraud detection model was retrained last night on 60 days of data. Offline metrics were excellent: AUC 0.97, precision 0.91. It was promoted to production this morning. By noon, fraud operations is overwhelmed by false positives.',
    clues: [
      { id: 'metrics', label: 'Online vs offline metrics',
        content: 'Offline (validation): AUC 0.97 | Precision 0.91 | Recall 0.88\nOnline (production): AUC 0.61 | Precision 0.43 | Recall 0.71\n\nValidation set period: Jan 1 – Mar 1\nTraining cutoff: Mar 1\nProduction serving: Mar 2 onwards\n\nNote: Offline metrics computed on held-out validation set carved from same dataset.' },
      { id: 'features', label: 'Feature list (top by importance)',
        content: '1. transaction_count_30d           (importance: 0.22)\n2. avg_txn_amount_30d              (importance: 0.19)\n3. is_disputed_resolved            (importance: 0.17) ← POST-EVENT FEATURE\n4. chargeback_filed_within_7d      (importance: 0.14) ← POST-EVENT FEATURE\n5. velocity_1h                     (importance: 0.11)\n6. device_fingerprint_match        (importance: 0.08)\n...\n\n⚠ Features #3 and #4 are derived from dispute outcomes — they are only available AFTER fraud is confirmed. During training they were accidentally joined using transaction_id without timestamp filtering.' },
      { id: 'pipeline', label: 'Feature engineering code diff',
        content: '# Previous version (correct)\nfeatures = transactions.join(\n    labels,\n    on="txn_id",\n    how="left"\n).join(\n    dispute_outcomes.filter(\n        F.col("resolved_at") < F.col("transaction_at")  # time guard\n    ),\n    on="txn_id",\n    how="left"\n)\n\n# New version (introduced in last retrain)\nfeatures = transactions.join(\n    labels, on="txn_id", how="left"\n).join(\n    dispute_outcomes,  # ← time guard removed in refactor\n    on="txn_id",\n    how="left"\n)' },
      { id: 'shadow', label: 'Shadow model comparison',
        content: 'Previous model (v4.1, still serving shadow): AUC 0.93 | Precision 0.87\nNew model (v4.2, promoted this morning): AUC 0.43 | Precision 0.43\n\nNote: Shadow mode was running but was NOT configured to block promotion if shadow AUC < champion AUC. Promotion was manual.' },
    ],
    diagnosis: 'label_leak',
    diagnosisOptions: [
      { id: 'model_complexity',  label: 'Model overfitting — too many trees, too deep' },
      { id: 'label_leak',        label: 'Label leakage — post-event features used during training' },
      { id: 'distribution_shift',label: 'Distribution shift — March fraud patterns differ from Jan–Feb' },
      { id: 'threshold_wrong',   label: 'Decision threshold not calibrated for production' },
    ],
    fix: 'Immediately: rollback to v4.1. Re-run feature engineering with timestamp filtering on all dispute outcome joins. Retrain, validate on a time-ordered hold-out set (not random split). Add an automated leakage check: verify that no feature has > 0.3 correlation with the label in a causality-excluded window.',
    lesson: 'Label leakage shows up as suspiciously good offline metrics. If your model\'s top features are outcome-derived (disputes, chargebacks, resolutions), run a temporal validity check before training. Never use random train/test splits for fraud or churn — always use time-ordered splits.',
  },
  {
    id: 'skew_serving',
    title: 'Search Ranking Latency Explosion',
    severity: 'P1',
    severityColor: 'var(--prime)',
    tagline: 'P99 latency hit 8 seconds. P50 still fine at 120ms.',
    context: 'You run a two-stage search ranking system: ANN retrieval (fast) + cross-encoder reranking (slow). A new reranker model was deployed yesterday. P50 latency is fine but P99 started climbing 6 hours after deployment.',
    clues: [
      { id: 'latency', label: 'Latency percentiles (last 24h)',
        content: 'P50: 120ms (baseline: 115ms) ✓\nP95: 890ms (baseline: 340ms) ⚠\nP99: 7,800ms (baseline: 450ms) ✗✗\nP99.9: 28,000ms ✗✗✗\n\nBreakdown by stage:\n  ANN retrieval P99: 45ms (normal)\n  Reranker P99: 7,750ms (up from 400ms baseline)\n  Feature fetch P99: 12ms (normal)\n\nQuery distribution:\n  Queries < 5 tokens: 67% of traffic — P99: 180ms ✓\n  Queries 5–20 tokens: 28% of traffic — P99: 650ms ⚠\n  Queries > 20 tokens: 5% of traffic — P99: 28,000ms ✗' },
      { id: 'model', label: 'Model change log',
        content: 'v3.1 (yesterday, 14:00): New cross-encoder deployed\n  - Architecture: BERT-base → BERT-large (110M → 340M params)\n  - Sequence length: max_len=128 → max_len=512\n  - Batch size: fixed 32 → dynamic (fills to max_len)\n  - Reranking candidates: top-100 retrieval results (unchanged)\n\nkey change: dynamic batching fills sequences to max_len=512 — long queries trigger full 512-token computation for ALL 100 candidates.' },
      { id: 'infra', label: 'Serving infrastructure',
        content: 'GPU: A10G (24GB) — 100% utilisation on long-query instances\nCPU fallback: triggered when GPU queue > 500ms\nTimeout: 10s hard cutoff (user sees error)\n\nQueue depth (last 6h):\n  Short queries: 0–2 items queued\n  Long queries: 40–120 items queued\n\nGPU memory: 21/24 GB used (up from 14 GB with v3.0)\nOOM events: 3 in last hour (restarted pod automatically)' },
      { id: 'traces', label: 'Request traces (sample)',
        content: 'Query: "comfortable lightweight running shoes for wide feet flat arch support"\n  Token count: 13\n  Candidates: 100\n  Reranker time: 6,800ms\n  Padded sequence: 512 × 100 = 51,200 tokens processed\n\nQuery: "shoes"\n  Token count: 1\n  Candidates: 100\n  Reranker time: 145ms\n  Padded sequence: 512 × 100 = 51,200 tokens processed ← same!\n\nRoot cause: both queries process 51,200 tokens because batch is padded to max_len=512 regardless of actual query length.' },
    ],
    diagnosis: 'padding_batching',
    diagnosisOptions: [
      { id: 'model_too_large',   label: 'Model too large — BERT-large cannot fit on A10G' },
      { id: 'padding_batching',  label: 'Dynamic batching pads all sequences to max_len=512 — long queries create massive tensors' },
      { id: 'candidate_count',   label: 'Too many reranking candidates (100) for BERT-large' },
      { id: 'gpu_thermal',       label: 'GPU thermal throttling under sustained load' },
    ],
    fix: 'Short-term: rollback to BERT-base or reduce max_len to 128. Medium-term: implement sequence-length bucketing — batch queries of similar length together, pad only to the longest in the bucket. Add a per-query latency budget and a reranker bypass for queries already exceeding budget. Monitor P99 separately for each query-length bucket.',
    lesson: 'P99 latency issues are often distribution problems, not mean problems. Always segment latency by input characteristics (query length, candidate count, user tier). Padding-induced quadratic compute is a classic reranker trap — BERT attention scales as O(n²) in sequence length.',
  },
]

function ClueCard({ clue, isOpen, onToggle }) {
  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s', borderColor: isOpen ? 'rgba(240,165,0,0.35)' : undefined }}
      onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>{clue.icon}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: isOpen ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{clue.label}</span>
        </div>
        <span style={{ color: 'var(--ink-low)', fontSize: '12px' }}>{isOpen ? '▲ hide' : '▼ reveal'}</span>
      </div>
      {isOpen && (
        <pre style={{ marginTop: '14px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.75, whiteSpace: 'pre-wrap', overflowX: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--rim)', borderRadius: '8px', padding: '12px', margin: 0 }}>
          {clue.content}
        </pre>
      )}
    </div>
  )
}

function IncidentRoom() {
  const [incidentIdx, setIncidentIdx] = useState(0)
  const [openClues,   setOpenClues]   = useState({})
  const [selected,    setSelected]    = useState(null)
  const [showFix,     setShowFix]     = useState(false)

  const inc = INCIDENTS[incidentIdx]

  function selectIncident(i) {
    setIncidentIdx(i)
    setOpenClues({})
    setSelected(null)
    setShowFix(false)
  }

  function toggleClue(id) {
    setOpenClues(o => ({ ...o, [id]: !o[id] }))
  }

  const revealedCount = Object.values(openClues).filter(Boolean).length
  const isCorrect = selected === inc.diagnosis

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Incident selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {INCIDENTS.map((inc, i) => (
          <button key={inc.id} onClick={() => selectIncident(i)}
            className={`sub-tab ${incidentIdx === i ? 'active' : 'inactive'}`}>
            <span style={{ marginRight: '6px', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: inc.severityColor, color: 'var(--white)', fontWeight: 700 }}>{inc.severity}</span>
            {inc.title}
          </button>
        ))}
      </div>

      {/* Incident brief */}
      <div className="card" style={{ borderColor: inc.severityColor + '66', background: `linear-gradient(135deg, var(--depth), rgba(0,0,0,0.1))` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: inc.severityColor, color: 'var(--white)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inc.severity}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: '18px', color: 'var(--prime)' }}>{inc.title}</span>
        </div>
        <p style={{ fontSize: '14px', color: inc.severityColor, fontWeight: 600, marginBottom: '10px' }}>"{inc.tagline}"</p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.7, margin: 0 }}>{inc.context}</p>
      </div>

      {/* Evidence */}
      <div>
        <div style={{ fontSize: '13px', color: 'var(--ink-low)', marginBottom: '12px' }}>
          Explore the evidence below. Reveal what you need — don't peek at everything at once.
          <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>{revealedCount}/{inc.clues.length} revealed</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {inc.clues.map(clue => (
            <ClueCard key={clue.id} clue={clue} isOpen={!!openClues[clue.id]} onToggle={() => toggleClue(clue.id)} />
          ))}
        </div>
      </div>

      {/* Diagnosis */}
      <div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '15px', color: 'var(--ink-hi)', marginBottom: '12px' }}>
          What's the root cause?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {inc.diagnosisOptions.map(opt => {
            const isSelected = selected === opt.id
            const isRight    = isSelected && opt.id === inc.diagnosis
            const isWrong    = isSelected && opt.id !== inc.diagnosis
            return (
              <button key={opt.id}
                onClick={() => { if (!selected) { setSelected(opt.id); if (opt.id === inc.diagnosis) setShowFix(true) } }}
                disabled={!!selected && !isSelected}
                style={{
                  textAlign: 'left', padding: '12px 16px', borderRadius: '8px', cursor: selected ? (isSelected ? 'default' : 'not-allowed') : 'pointer',
                  border: `1px solid ${isRight ? 'rgba(52,211,153,0.50)' : isWrong ? 'rgba(244,63,94,0.5)' : 'var(--rim)'}`,
                  background: isRight ? 'rgba(240,165,0,0.14)' : isWrong ? 'rgba(244,63,94,0.15)' : 'var(--depth)',
                  color: isRight ? 'var(--mint)' : isWrong ? 'var(--rose)' : isSelected ? 'var(--ink-hi)' : 'var(--ink-low)',
                  fontFamily: "'Inter',sans-serif", fontSize: '13.5px', opacity: selected && !isSelected ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}>
                {isRight && '✓ '}{isWrong && '✗ '}{opt.label}
              </button>
            )
          })}
        </div>

        {selected && !isCorrect && (
          <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(244,63,94,0.14)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '8px', fontSize: '13px', color: 'var(--rose)' }}>
            Not quite. Review the evidence again — particularly the feature pipeline logs and freshness data.
            <button onClick={() => { setSelected(null); setShowFix(false) }}
              style={{ marginLeft: '12px', background: 'none', border: '1px solid rgba(244,63,94,0.4)', color: 'var(--rose)', borderRadius: '6px', padding: '2px 10px', cursor: 'pointer', fontSize: '12px' }}>
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Fix + lesson */}
      {showFix && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card" style={{ borderColor: 'rgba(240,165,0,0.30)', background: 'rgba(240,165,0,0.10)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--prime)', marginBottom: '8px' }}>✓ Correct diagnosis. Here's the fix:</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.75, margin: 0 }}>{inc.fix}</p>
          </div>
          <div className="card" style={{ borderColor: 'rgba(240,165,0,0.20)', background: 'rgba(240,165,0,0.07)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--prime)', marginBottom: '8px' }}>Lesson</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.75, margin: 0 }}>{inc.lesson}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── DS Ownership Chain ──────────────────────────────────────────────────────

const DS_CHAIN = [
  {
    id: 'problem_framing',
    title: 'Problem Framing',
    short: 'Define the prediction target, not the engineering task.',
    what: 'Translate a business ask ("reduce churn") into a precise ML problem: prediction target, entity grain, prediction horizon, and decision it feeds.',
    own: 'You own the framing document — and the right to push back if the framing will produce a useless model. A model that predicts what no one can act on is a waste.',
    failure: 'Building a regression when a classification threshold was needed. Or predicting 30-day churn when the retention team can only act on 7-day signals.',
    tiers: {
      junior:  'Can restate the business goal as a prediction problem.',
      analyst: 'Identifies the entity, grain, and prediction horizon. Flags if the target is unactionable.',
      senior:  'Writes a 1-page framing doc including failure modes of the framing itself.',
      staff:   'Challenges the business ask, proposes alternative framings, and defines the decision criteria for choosing between them.',
    },
  },
  {
    id: 'success_metric',
    title: 'Success Metric Definition',
    short: 'Translate business KPI into an ML objective with constraints.',
    what: 'Choose the ML metric that best proxies the business KPI, and define constraints (e.g., FPR < 5%). Document why accuracy is wrong for this problem.',
    own: 'The metric choice is a commitment. If you choose AUC and the team ships based on precision, someone made a disconnect you need to have caught.',
    failure: 'Optimising AUC on an imbalanced dataset and declaring victory. Reporting RMSE without context on what error magnitude is operationally meaningful.',
    tiers: {
      junior:  'Knows AUC, F1, precision/recall. Can compute them.',
      analyst: 'Selects metric based on class imbalance and cost structure. Explains why accuracy fails.',
      senior:  'Defines a metric + constraint pair. Documents business cost ratio of FP vs FN. Sets the threshold policy.',
      staff:   'Aligns metric to the business decision function. Defines a multi-metric evaluation framework and negotiates with stakeholders on acceptable tradeoff zones.',
    },
  },
  {
    id: 'data_grain',
    title: 'Data Sourcing & Grain',
    short: 'Define row-level granularity before touching any data.',
    what: 'Specify the grain (one row = one what?) before writing any SQL. Identify every data source and the join keys. Document the population of eligible training examples.',
    own: 'The grain definition is the contract. Everything downstream — features, labels, evaluation — is contaminated if the grain is wrong.',
    failure: 'Training on (user, session) but serving at (user, day). Accidentally fan-out joining a many-to-many table and getting row duplication without noticing.',
    tiers: {
      junior:  'Can define what a row represents in a given table.',
      analyst: 'Defines the grain before querying. Detects fan-out joins in SQL.',
      senior:  'Documents the population definition, eligibility criteria, and possible sampling biases. Validates grain consistency across all feature sources.',
      staff:   'Audits grain consistency across the full data lineage. Establishes grain contracts for the feature store and training pipelines.',
    },
  },
  {
    id: 'label_construction',
    title: 'Label Construction',
    short: 'Define what counts as a positive — and when you can know it.',
    what: 'Write the exact label definition: what event, at what timestamp, relative to the prediction time. Account for the observation window (delayed labels).',
    own: 'The label is the ground truth you are training toward. Sloppy labels = sloppy model. The gap between prediction time and label observation time is your model\'s minimum production latency.',
    failure: 'Using labels from after the prediction timestamp (label leakage). Ignoring that only 60% of events resolve within 7 days, training on an unrepresentative positive set.',
    tiers: {
      junior:  'Can identify the target column in a dataset.',
      analyst: 'Writes a point-in-time correct label definition. Identifies the observation window.',
      senior:  'Handles delayed labels — uses only aged labels, documents the label distribution curve over time.',
      staff:   'Defines a label policy for the organisation: what observation window to use, how to handle label noise, and how to retrain as the label distribution shifts.',
    },
  },
  {
    id: 'point_in_time',
    title: 'Point-in-Time Correctness',
    short: 'Every feature must be computed from data available before prediction_ts.',
    what: 'For each event (entity, event_ts), join the feature table on max(feature_ts) ≤ event_ts. This is an asof join — not a standard date join.',
    own: 'The most common silent killer of model validity. A standard join uses the feature value as of today, not as of prediction time, introducing future information into training.',
    failure: 'Joining on user_id without a timestamp guard. Using a feature whose value is retrospectively updated (e.g., "did the user eventually convert?") as a training feature.',
    tiers: {
      junior:  'Understands what future leakage means.',
      analyst: 'Implements asof joins. Audits feature timestamps against prediction timestamps.',
      senior:  'Writes a feature leakage check — validates that no feature has > 0.3 correlation with the label in a causality-excluded window.',
      staff:   'Enforces point-in-time correctness at the feature store level. No consumer can inadvertently bypass temporal guards.',
    },
  },
  {
    id: 'feature_engineering',
    title: 'Feature Engineering',
    short: 'Transform raw events into model inputs — and own every transformation.',
    what: 'Choose aggregation windows, encoding strategies, imputation approaches, and normalisations. Write them in a way that can be reproduced identically at serving time.',
    own: 'You own the transformation code, not just the notebook. If the serving system recomputes features differently, you own the divergence.',
    failure: 'Fitting a scaler on the full dataset before CV splits. Using the test set mean for imputation. Hardcoding aggregation logic that diverges from what the feature store computes.',
    tiers: {
      junior:  'Can one-hot encode, scale, and aggregate features.',
      analyst: 'Uses sklearn Pipelines to prevent leakage. Documents every transformation.',
      senior:  'Validates that training features = serving features with a parity test. Handles MCAR/MAR/MNAR missing data correctly.',
      staff:   'Defines feature engineering standards for the team. Builds reusable feature library that serves both training and production.',
    },
  },
  {
    id: 'training_pipeline',
    title: 'Training Pipeline Design',
    short: 'Reproducible end-to-end: data → features → train → evaluate → register.',
    what: 'Orchestrate the full pipeline with parameterised, versioned steps. Every run should be reproducible with pinned seeds, dependencies, and data snapshots.',
    own: 'You own the pipeline code, not just the model artifact. "It worked on my laptop" is a pipeline ownership failure.',
    failure: 'Notebooks as pipelines. Non-reproducible runs due to unfixed random seeds. Pipeline steps that silently succeed but produce different outputs depending on environment.',
    tiers: {
      junior:  'Can run a training script end to end.',
      analyst: 'Parameterises pipeline runs. Pins seeds and library versions. Logs all hyperparameters.',
      senior:  'Builds a pipeline with explicit DAG dependencies, failure retry, and data validation steps.',
      staff:   'Designs a training infrastructure that supports parallel experimentation, data versioning, and lineage tracking.',
    },
  },
  {
    id: 'validation_strategy',
    title: 'Validation Strategy',
    short: 'Choose the evaluation protocol before you see a single number.',
    what: 'Stratified k-fold for classification on i.i.d. data. Forward-chained (expanding window) split for time series. Group-aware split when entity observations are correlated.',
    own: 'The validation strategy determines whether your offline metrics mean anything. Choose it before training, not after to make numbers look good.',
    failure: 'Random 80/20 split on time-series data. Random split when the same user appears in train and test. Choosing k-fold after seeing that one split gave better numbers.',
    tiers: {
      junior:  'Can split data into train/val/test.',
      analyst: 'Selects the correct split strategy for the data structure. Explains why random split fails for time series.',
      senior:  'Implements group-aware and time-aware splits. Documents the validation protocol before running experiments.',
      staff:   'Defines team-wide validation standards. Audits existing models for split correctness.',
    },
  },
  {
    id: 'baseline',
    title: 'Baseline Model',
    short: 'Build the simplest possible model before the complex one.',
    what: 'Business rule → majority-class heuristic → single-feature logistic regression → full model. Each step must beat the previous to justify complexity.',
    own: 'A baseline is not a formality — it is evidence. Without a documented baseline, you cannot prove your model adds value over naive strategies.',
    failure: 'Skipping baselines and reporting AUC=0.85 without context. A majority-class classifier might achieve AUC=0.83 on your imbalanced dataset.',
    tiers: {
      junior:  'Can implement a majority-class baseline.',
      analyst: 'Builds a hierarchy: rule → heuristic → logistic regression → model. Documents each step.',
      senior:  'Uses baselines to bound the complexity budget: if LR achieves 90% of the gain, the complex model must justify its operational cost.',
      staff:   'Defines baseline standards for the team. Establishes that no complex model ships without documented baseline comparison.',
    },
  },
  {
    id: 'model_training',
    title: 'Model Selection & Training',
    short: 'Own the training loop, not just the API call.',
    what: 'Choose architecture based on feature types, data volume, and latency budget. Tune hyperparameters with principled search. Handle class imbalance explicitly.',
    own: 'Selecting XGBoost because "it usually works" without understanding its assumptions is not ownership. You must know why each choice was made.',
    failure: 'Grid search on all hyperparameters simultaneously without fixing n_estimators first. Using SMOTE without understanding its geometric assumptions.',
    tiers: {
      junior:  'Can fit an sklearn model with default parameters.',
      analyst: 'Makes deliberate architecture and hyperparameter choices. Handles imbalance with threshold tuning or class weights.',
      senior:  'Profiles training time vs performance tradeoffs. Fixes the most expensive hyperparameter (n_estimators) with early stopping, then optimises the rest.',
      staff:   'Designs the model selection process as a systematic comparison with documented decision criteria and compute budget constraints.',
    },
  },
  {
    id: 'offline_eval',
    title: 'Offline Evaluation',
    short: 'Disaggregate performance by slice before calling it ready.',
    what: 'Compute the right primary metric, then disaggregate by slice (demographics, geography, value tier). Check calibration. Compare against all baselines.',
    own: 'Aggregate AUC is a lie. A model that performs well on 80% of users but catastrophically on a key segment is not ready.',
    failure: 'Reporting only AUC. No slice analysis. No calibration check. Promotion to production based on aggregate metrics on a biased validation set.',
    tiers: {
      junior:  'Can compute precision, recall, AUC.',
      analyst: 'Runs slice analysis. Checks calibration with a reliability diagram. Validates against all baselines.',
      senior:  'Defines the minimum acceptable per-slice performance bar. Flags failure modes before they reach production.',
      staff:   'Establishes org-wide evaluation standards. Defines what "production ready" means quantitatively for every model type.',
    },
  },
  {
    id: 'shadow_deploy',
    title: 'Shadow Deployment',
    short: 'Run the challenger in parallel before it touches real traffic.',
    what: 'Deploy the new model to receive production traffic without serving its predictions. Compare score distributions, latency, and downstream feature patterns against the champion.',
    own: 'Shadow mode is your insurance policy. If you skip it, the first feedback loop on your model is a production incident.',
    failure: 'Promoting a model to production directly from offline evaluation. Missing that the score distribution shifted even though AUC looked fine in shadow.',
    tiers: {
      junior:  'Understands what shadow mode is.',
      analyst: 'Sets up shadow instrumentation and compares score distributions.',
      senior:  'Defines shadow exit criteria: what score distribution delta or AUC gap triggers a block on promotion.',
      staff:   'Builds shadow mode into the standard deployment protocol. Defines automated gates that block promotion if shadow metrics diverge.',
    },
  },
  {
    id: 'ab_design',
    title: 'A/B Experiment Design',
    short: 'Pre-register MDE, power, and guardrails before flipping any flag.',
    what: 'Define the primary metric, MDE, power (≥80%), expected duration, randomisation unit, and guardrail metrics before the experiment starts.',
    own: 'The experiment design is a commitment. Post-hoc adjustments based on results are p-hacking. You own the statistical validity of the test.',
    failure: 'Peeking and stopping early. Using the wrong randomisation unit (user vs device vs session). No SRM check. Declaring significance at p=0.049 after 3 peeks.',
    tiers: {
      junior:  'Knows what a p-value and significance level mean.',
      analyst: 'Pre-registers MDE, power, duration. Runs SRM check before reading results.',
      senior:  'Designs the randomisation unit based on SUTVA violation risk. Uses sequential testing if early stopping is needed.',
      staff:   'Owns the experimentation platform standards. Defines what constitutes a valid experiment for the org. Handles network effects and interference.',
    },
  },
  {
    id: 'prod_serving',
    title: 'Production Serving',
    short: 'Own the latency budget from feature fetch to prediction.',
    what: 'Decompose the end-to-end latency: feature lookup + model inference + postprocessing + I/O overhead. Validate against the SLA. Define the serving degradation strategy.',
    own: 'Handing off a model artifact and calling it "done" is not ownership. The serving path — feature store integration, batching, caching — is yours.',
    failure: 'Not knowing the P99 latency of your model in production. No graceful degradation when the feature store is down. Serving a model whose features take 800ms to compute for a 200ms SLA.',
    tiers: {
      junior:  'Can deploy a model behind a REST endpoint.',
      analyst: 'Profiles and decomposes latency. Validates against SLA.',
      senior:  'Designs graceful degradation (fallback scores, simplified model). Owns the serving SLA formally.',
      staff:   'Designs the serving architecture — online feature store, model server, caching strategy, traffic shaping. Defines serving SLAs as engineering contracts.',
    },
  },
  {
    id: 'feature_store',
    title: 'Feature Store Integration',
    short: 'Training features must equal serving features — single computation code.',
    what: 'Implement features once, run them both in training (offline store / Hive) and serving (online store / Redis). Any divergence is training-serving skew.',
    own: 'The feature store integration is the hardest part of keeping a model honest. You own the parity contract — training and serving compute the same numbers.',
    failure: 'Python feature logic in training, Java/SQL feature logic in serving, slight timestamp handling difference. Result: model trained on one distribution, served on another. Silent, persistent, hard to detect.',
    tiers: {
      junior:  'Understands why training and serving features must match.',
      analyst: 'Implements features in the feature store and validates training/serving parity with a test set.',
      senior:  'Builds a continuous skew monitor that compares training distribution to serving distribution for each feature.',
      staff:   'Designs the feature registry and enforces a single-compute-path principle as an architectural standard.',
    },
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Alerting',
    short: 'Three-layer monitoring: data quality → feature drift → model performance.',
    what: 'Layer 1: data quality (null rates, schema drift). Layer 2: feature drift (PSI/KS vs training baseline, alert on PSI > 0.2). Layer 3: model performance (proxy metrics if labels are delayed).',
    own: 'Monitoring is not "set up a dashboard." It is a configured alert system with known thresholds and documented on-call runbooks.',
    failure: 'No alerts on feature pipeline failure. No PSI monitoring. Model silently degrading because item embeddings went stale (see: Silent Recommendation Degradation incident).',
    tiers: {
      junior:  'Knows PSI and KS exist. Can compute them.',
      analyst: 'Configures PSI/KS monitors with thresholds. Sets up data quality alerts.',
      senior:  'Builds a monitoring system covering all three layers. Documents runbook for each alert type.',
      staff:   'Designs the monitoring architecture for a model portfolio. Defines organisational alerting standards and incident response protocols.',
    },
  },
  {
    id: 'retraining',
    title: 'Retraining & Model Lifecycle',
    short: 'Define retraining triggers, rollback criteria, and the champion/challenger protocol.',
    what: 'Specify retraining cadence triggers (schedule vs drift-triggered). Define champion/challenger protocol for promotion. Document rollback criteria and execution procedure.',
    own: 'Retraining is not running a cron job. You own the decision policy: when to retrain, when to promote, and when to roll back — in writing, before a crisis.',
    failure: 'No rollback procedure. Retraining on all available data without considering label delay. Automatic promotion without a shadow or canary gate.',
    tiers: {
      junior:  'Can retrain a model with new data.',
      analyst: 'Defines retraining triggers (drift threshold, schedule). Documents the promotion checklist.',
      senior:  'Designs the champion/challenger protocol with automated gates. Defines rollback SLA (time-to-rollback < 30min).',
      staff:   'Owns the model lifecycle policy for the platform. Designs automated retraining infrastructure with drift-triggered pipelines and safety gates.',
    },
  },
]

const TIER_COLORS = { junior: 'var(--ink-mid)', analyst: 'var(--ink-low)', senior: 'var(--prime)', staff: 'var(--prime)' }

function DSOwnershipChain() {
  const [openId,    setOpenId]    = useState(null)
  const [reviewed,  setReviewed]  = useState({})
  const [activeTier,setActiveTier]= useState('senior')

  const reviewedCount = Object.values(reviewed).filter(Boolean).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.6, maxWidth: '560px' }}>
            17 concepts a production DS/MLE must personally own — not delegate, not half-understand. In the sequence they appear in a real project.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{reviewedCount}/{DS_CHAIN.length} reviewed</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['junior','analyst','senior','staff'].map(t => (
              <button key={t} onClick={() => setActiveTier(t)}
                style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '6px', border: `1px solid ${activeTier === t ? TIER_COLORS[t] : 'var(--rim)'}`, background: activeTier === t ? `${TIER_COLORS[t]}15` : 'transparent', color: activeTier === t ? TIER_COLORS[t] : 'var(--ink-low)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chain */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {DS_CHAIN.map((node, i) => {
          const isOpen = openId === node.id
          const isDone = !!reviewed[node.id]
          return (
            <div key={node.id} style={{ display: 'flex', gap: '0' }}>
              {/* Spine */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '36px', flexShrink: 0 }}>
                <button onClick={() => setReviewed(r => ({ ...r, [node.id]: !r[node.id] }))}
                  style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isDone ? 'var(--prime)' : isOpen ? 'var(--prime)' : 'var(--rim)'}`, background: isDone ? 'var(--prime)' : 'var(--depth)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: isDone ? 'var(--void)' : 'var(--ink-low)', fontWeight: 700, zIndex: 1 }}>
                  {isDone ? '✓' : String(i + 1).padStart(2,'0').slice(-2)}
                </button>
                {i < DS_CHAIN.length - 1 && (
                  <div style={{ width: '2px', flex: 1, minHeight: '16px', background: isDone ? 'rgba(52,211,153,0.35)' : 'var(--rim)', marginTop: '2px', marginBottom: '2px' }} />
                )}
              </div>

              {/* Node card */}
              <div style={{ flex: 1, marginBottom: i < DS_CHAIN.length - 1 ? '6px' : '0', marginLeft: '10px' }}>
                <button onClick={() => setOpenId(isOpen ? null : node.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: isOpen ? 'rgba(240,165,0,0.11)' : 'transparent', border: `1px solid ${isOpen ? 'var(--prime-glow)' : 'var(--rim)'}`, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.12s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '13px', color: isOpen ? 'var(--prime)' : isDone ? 'var(--prime)' : 'var(--ink-hi)' }}>{node.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-low)', marginLeft: '10px' }}>{node.short}</span>
                    </div>
                    <span style={{ color: 'var(--ink-low)', fontSize: '11px', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div style={{ margin: '4px 0 6px', padding: '16px 18px', background: 'var(--depth)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>What it means</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{node.what}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>Common failure if skipped</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{node.failure}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: TIER_COLORS[activeTier], textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>{activeTier.charAt(0).toUpperCase() + activeTier.slice(1)} ownership</div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.7, margin: 0 }}>{node.tiers[activeTier]}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>Ownership means</div>
                      <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>{node.own}</p>
                    </div>
                    <button onClick={() => setReviewed(r => ({ ...r, [node.id]: !r[node.id] }))}
                      style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '5px 14px', borderRadius: '6px', border: `1px solid ${isDone ? 'var(--prime)' : 'var(--rim)'}`, background: isDone ? 'rgba(240,165,0,0.15)' : 'transparent', color: isDone ? 'var(--prime)' : 'var(--ink-low)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {isDone ? '✓ Marked as reviewed' : 'Mark as reviewed'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Incident Scenarios (business pressure) ──────────────────────────────────

const SCENARIOS = [
  {
    id: 'late_pipeline',
    title: 'Feature Pipeline Late',
    pressure: 'Launch is in 2 hours. Your feature pipeline failed 3 hours ago. The model is serving 6-hour-old features. The PM is asking if it\'s fine to proceed.',
    context: 'You run a real-time fraud model. Features include transaction velocity (1h, 24h windows), device fingerprint match, and user risk score. The pipeline that refreshes user risk scores failed silently at 04:00. Serving is using a stale fallback. Traffic is 40% of daily peak.',
    decision: 'What do you do?',
    tiers: {
      junior:  'Restart the pipeline and wait. Tell the PM "we\'re working on it."',
      analyst: 'Quantify staleness impact: which features are affected, by how much. Estimate expected precision degradation. Give the PM a risk number, not just "working on it."',
      senior:  'Implement a serving bypass that flags stale-feature predictions as low-confidence. Enforce a conservative threshold for flagged predictions. Communicate: "risk score features are 6h stale, we\'re increasing the fraud threshold temporarily to compensate, expected FP rate increases by ~X%."',
      staff:   'All of the above plus: escalate the silent failure root cause (why did no alert fire?). Post-incident: require pipeline health gates before any serving traffic is allowed. Define a "feature freshness SLA breach" protocol in the runbook.',
    },
    lesson: 'Quantify degradation before deciding. A confident "here\'s the risk number" is more useful than "we\'re fixing it." Degraded service with known bounds beats unknown service.',
  },
  {
    id: 'srm_failure',
    title: 'A/B Test SRM Failure',
    pressure: 'Your A/B test shows +2.1% CTR (p=0.002). The PM wants to ship today. You notice the SRM check shows a 52:48 split instead of 50:50.',
    context: 'The experiment ran for 14 days. Primary metric: CTR. Secondary metrics: add-to-cart (+0.8%, ns), revenue per user (+1.2%, ns). Experiment population: all users in the US. SRM p-value: 0.003.',
    decision: 'Do you ship? What do you tell the PM?',
    tiers: {
      junior:  '"The test passed, let\'s ship."',
      analyst: '"We have an SRM — the assignment ratio is wrong. The result is statistically invalid. We need to find the cause and rerun before shipping."',
      senior:  'Investigates SRM cause before deciding direction: logging bug (affects metric), assignment bug (biased sample), or novelty effect (unlikely at 14 days). Tells PM: "The test result cannot be trusted as-is. We have a 2% assignment imbalance. If it\'s a logging bug on the control side, the CTR lift may be inflated. Recommend: fix and rerun, 7-day minimum. I can give you a bias-corrected point estimate while we wait, but I won\'t call it valid."',
      staff:   'All of the above plus: root-causes the SRM systematically, fixes the assignment or logging system, establishes a mandatory SRM-check gate in the experimentation platform that blocks result reads if SRM p < 0.01, and creates an org-wide policy: "SRM = invalid experiment, no exceptions."',
    },
    lesson: 'SRM invalidates the randomisation assumption of the test. A significant p-value on a biased sample is not evidence — it\'s noise. The correct answer is always "rerun," not "ship."',
  },
  {
    id: 'offline_online_gap',
    title: 'Offline/Online Performance Gap',
    pressure: 'Your new model scores AUC=0.94 offline. After 6 hours in production, precision is 0.31 (down from champion\'s 0.71). Fraud ops is overwhelmed.',
    context: 'The new model was trained on 90 days of data and promoted this morning after shadow metrics looked comparable. Offline validation: AUC 0.94, precision 0.88. Production (6h): AUC 0.62, precision 0.31. Champion (still in shadow): AUC 0.92, precision 0.69.',
    decision: 'What do you do right now and what was the likely cause?',
    tiers: {
      junior:  'Roll back. Investigate later.',
      analyst: 'Roll back immediately. The champion is still in shadow and performing correctly — rollback risk is low. Likely cause: label leakage (offline precision 0.88 was too good) or a feature that\'s available in training but not at serving time.',
      senior:  'Rollback in <15 min. Immediately compare top feature importances between champion and challenger. Check if any feature has >0.15 importance and was derived from post-event data. Run a calibration check — a model with AUC 0.94 offline and 0.62 online has fundamentally different score distributions, pointing to feature leakage or serving-training skew. Post-mortem in 24h.',
      staff:   'All of the above plus: establish a promotion gate — if shadow AUC < champion AUC * 0.95, block automated promotion. Require an offline-to-online parity test before any fraud model promotion. Review the shadow instrumentation to understand why it didn\'t catch this.',
    },
    lesson: 'Offline AUC 0.94 → online AUC 0.62 is not a generalisation gap — it\'s a data integrity failure. Suspiciously good offline metrics are a red flag, not a green light.',
  },
  {
    id: 'drift_alert',
    title: 'Feature Drift Alert',
    pressure: 'PSI alert fires: input feature user_age_bucket has PSI=0.41 (alert threshold: 0.2). Product says no changes were made. Business metrics look normal.',
    context: 'The model is a 6-month-old churn predictor. user_age_bucket is the 3rd most important feature. PSI has been stable at 0.05–0.08 for 5 months. The spike happened overnight. Labels are delayed by 14 days so no performance signal yet.',
    decision: 'How do you respond? What are the possible causes and what do you investigate first?',
    tiers: {
      junior:  '"Alert fired, looking into it."',
      analyst: 'Checks the feature computation code and the upstream data source. Plots the distribution shift — is it a new bucket, a missing bucket, or a shift in proportions? Rules out pipeline bug before concluding it\'s real drift.',
      senior:  'Systematic triage: (1) Is this a data pipeline bug? Check upstream table row counts and schema. (2) Is this a population composition change? Check if a new user cohort was onboarded. (3) Is this a real behavioural shift? Check if the distribution change tracks with a product launch or external event. Only escalate to model team after ruling out pipeline cause. Sets a 14-day monitoring watch for model performance given label delay.',
      staff:   'All of the above plus: if this is real drift, initiates the retraining protocol. Defines a "PSI triage playbook" so any analyst can follow the same steps. Reviews whether the monitoring thresholds need calibration given this model\'s feature distributions.',
    },
    lesson: 'High PSI does not automatically mean model degradation — it means something changed. Pipeline bugs cause more high-PSI alerts than real drift. Always rule out instrumentation before concluding the world changed.',
  },
  {
    id: 'delayed_labels',
    title: 'Retraining with Delayed Labels',
    pressure: 'You\'re asked to retrain the model. 40% of events from the last 30 days don\'t have resolved labels yet (they\'re still in a 30-day observation window). Your manager says "just use what\'s available."',
    context: 'The model predicts 30-day conversion. Labels resolve 30 days after the event. Training data spans 12 months. The most recent 30 days have 40% label coverage. The model hasn\'t been retrained in 90 days and PSI alerts are firing on two features.',
    decision: 'How do you handle the label delay? What do you tell your manager?',
    tiers: {
      junior:  'Train on the 40% labelled subset from the last 30 days.',
      analyst: 'Exclude the last 30 days of events from training (not enough labels resolved). Train on events from 30+ days ago where labels are fully resolved. Tell manager: "Using partial labels introduces a survivorship bias — the 40% that resolved early may be the easiest cases. I\'ll use t-30 as the training cutoff."',
      senior:  'Uses t-30 cutoff for label completeness. But also checks the label distribution curve: how many labels resolve by day 7, 14, 21, 30? If 80% resolve by day 7, can train a proxy model on day-7 labels with a recalibration on fully-resolved labels. Quantifies the bias from using partial labels vs the staleness cost of using t-30 cutoff. Gives manager a concrete recommendation with tradeoff.',
      staff:   'All of the above plus: defines an organisational standard for label readiness (minimum 90% resolved before any event is used in training). Designs a two-model architecture: early-signal model (day-7 labels) + full-window model (day-30 labels), serving the early model where latency matters and the full model for long-horizon decisions.',
    },
    lesson: 'Training on partially-resolved labels is not "using what\'s available" — it\'s training on a biased sample. The models that resolve early are systematically different from the full population.',
  },
  {
    id: 'model_rollback',
    title: 'Model Rollback Decision',
    pressure: 'Your new model has been live for 8 hours (50% traffic). Primary A/B metric (CTR) is neutral (+0.1%, p=0.8). Secondary metric: support ticket volume is up 34% since launch. On-call is asking if you should roll back.',
    context: 'The new model is a recommendation system update. Training included 6 new item features. The support tickets are about "irrelevant recommendations." 50% of users are on the new model. The old champion is still serving the other 50%.',
    decision: 'Do you roll back? What is your decision framework?',
    tiers: {
      junior:  '"Primary metric is neutral, let it run."',
      analyst: '"Support tickets +34% is a guardrail metric breach. Roll back. Primary metric being neutral doesn\'t override a significant user-harm signal."',
      senior:  'Rolls back within 30 minutes. Defines the decision: guardrail metrics trump primary metric neutrality when there is a significant user harm signal (support tickets are a lagging but real signal). Post-rollback investigation: was the support ticket increase concentrated on a specific user segment or item category? Which of the 6 new features most correlates with low-quality recommendations?',
      staff:   'All of the above plus: enforces that guardrail metrics are pre-registered and blocking (not advisory). Adds support ticket rate as a formal guardrail metric for all recommendation experiments going forward. Defines rollback SLA: guardrail breach → rollback decision within 30 min, execution within 60 min.',
    },
    lesson: 'A neutral primary metric with a breached guardrail metric means "we stopped something bad, not proved something good." Roll back and understand before redeploying.',
  },
]

const SCENARIO_TIERS = [
  { key: 'junior',  label: 'Junior',  color: 'var(--ink-mid)' },
  { key: 'analyst', label: 'Analyst', color: 'var(--ink-low)' },
  { key: 'senior',  label: 'Senior',  color: 'var(--prime)' },
  { key: 'staff',   label: 'Staff',   color: 'var(--prime)' },
]

function IncidentScenarios() {
  const [idx,          setIdx]          = useState(0)
  const [showTiers,    setShowTiers]    = useState(false)
  const [selfAssessed, setSelfAssessed] = useState(null)

  const sc = SCENARIOS[idx]

  function nextScenario() {
    setIdx(i => Math.min(i + 1, SCENARIOS.length - 1))
    setShowTiers(false)
    setSelfAssessed(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.6, maxWidth: '560px' }}>
          Six real scenarios with business pressure. Read the situation, form your response, then reveal the tier breakdown.
        </p>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{idx + 1} / {SCENARIOS.length}</span>
      </div>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {SCENARIOS.map((s, i) => (
          <button key={s.id} onClick={() => { setIdx(i); setShowTiers(false); setSelfAssessed(null) }}
            className={`sub-tab ${idx === i ? 'active' : 'inactive'}`} style={{ fontSize: '12px' }}>
            {s.title}
          </button>
        ))}
      </div>

      {/* Pressure card */}
      <div style={{ padding: '20px 24px', background: 'rgba(244,63,94,0.11)', border: '1px solid rgba(244,63,94,0.22)', borderRadius: '12px' }}>
        <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Business pressure</div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 500, color: 'var(--ink-hi)', lineHeight: 1.55, margin: 0 }}>"{sc.pressure}"</p>
      </div>

      {/* Context */}
      <div style={{ padding: '16px 20px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '10px' }}>
        <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>Context</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{sc.context}</p>
      </div>

      {/* Decision prompt */}
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>
        {sc.decision}
      </div>
      <p style={{ fontSize: '12px', color: 'var(--ink-low)', margin: '-14px 0 0', fontStyle: 'italic' }}>Think through your answer first, then reveal the tier breakdown below.</p>

      {/* Reveal tiers */}
      {!showTiers ? (
        <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setShowTiers(true)}>Reveal tier breakdown →</button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SCENARIO_TIERS.map(t => (
            <div key={t.key} style={{ padding: '14px 18px', background: selfAssessed === t.key ? `${t.color}0f` : 'var(--depth)', border: `1px solid ${selfAssessed === t.key ? t.color + '40' : 'var(--rim)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.12s' }}
              onClick={() => setSelfAssessed(t.key)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '12px', color: t.color, minWidth: '50px' }}>{t.label}</span>
                {selfAssessed === t.key && <span style={{ fontSize: '10px', color: t.color, fontFamily: 'var(--font-mono)' }}>← your level</span>}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{sc.tiers[t.key]}</p>
            </div>
          ))}

          {/* Lesson */}
          <div style={{ marginTop: '4px', padding: '14px 18px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.18)', borderRadius: '10px' }}>
            <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>Key lesson</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.7, margin: 0 }}>{sc.lesson}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
            <button className="btn-primary" onClick={nextScenario} disabled={idx === SCENARIOS.length - 1}>Next scenario →</button>
            <button className="btn-ghost" onClick={() => { setIdx(0); setShowTiers(false); setSelfAssessed(null) }}>↺ Restart</button>
          </div>
        </div>
      )}

      {/* Dot progress */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {SCENARIOS.map((_, i) => (
          <button key={i} onClick={() => { setIdx(i); setShowTiers(false); setSelfAssessed(null) }}
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: i < idx ? 'var(--prime)' : i === idx ? 'var(--prime)' : 'var(--rim)', border: 'none', cursor: 'pointer', padding: 0 }} />
        ))}
      </div>
    </div>
  )
}


// ─── Design Review (DesignCanvas) ─────────────────────────────────────────────

const DESIGN_REVIEW_HINTS = {
  objective:   'Before picking, ask whether optimising a single engagement proxy might create an incentive the business did not intend.',
  cold_start:  'Consider what happens to a new item after the initial fallback strategy runs — does your answer close the feedback loop or leave it permanently open?',
  recall_drop: 'Think about what two components in a retrieval pipeline must stay in sync for recall to be valid at all.',
  skew:        'Ask whether your answer detects skew before it reaches production or only after it has already caused harm.',
  diversity:   'Trace the mechanism: what caused the training data to become less diverse, and does your fix address that cause or only the symptom?',
}

const DESIGN_REVIEW_SECTIONS = [
  {
    id: 'objective',
    title: 'ML Objective',
    question: 'What is your primary ML objective for this recommendation system?',
    options: [
      {
        text: 'Maximize CTR — we optimize for click-through rate as the main signal.',
        tier: 'junior',
        feedback: 'CTR optimization creates Goodhart\'s Law failure: the model learns to recommend clickbait. Users click, don\'t engage, and churn. CTR is a proxy; optimizing only for it breaks the actual goal.'
      },
      {
        text: 'Optimize engagement (watch time / listen time) as a single north-star metric.',
        tier: 'analyst',
        feedback: 'Better than CTR — watch time is harder to game. But a single metric still creates blind spots: engagement can be maximized by showing addictive content at the expense of diversity and long-term user satisfaction.'
      },
      {
        text: 'Multi-objective: engagement + satisfaction signal, with a constraint on diversity minimum.',
        tier: 'senior',
        feedback: 'Good production thinking. Explicit diversity constraint prevents filter bubbles. But without product-defined tradeoff weights, your model will find unexpected Pareto optima that satisfy the constraint technically but not spiritually.'
      },
      {
        text: 'Multi-objective: listen-rate + 30-day return + diversity, with explicit product-defined tradeoff weights and a living document that records why those weights were chosen.',
        tier: 'staff',
        feedback: 'This is correct. Three signals covering short-term engagement, long-term retention, and ecosystem health. Explicit weights with recorded rationale means the objective can be debated, audited, and updated. The model optimizes what the business actually wants.'
      },
    ],
  },
  {
    id: 'cold_start',
    title: 'Cold Start',
    question: 'How do you handle the cold-start problem for new items with no interaction history?',
    options: [
      {
        text: 'Show popular items to all users when a new item has no embedding.',
        tier: 'junior',
        feedback: 'Popular-item fallback guarantees the rich get richer. New items never accumulate interactions, can never enter the recommendation loop, and the catalog becomes increasingly stale. This is not a solution — it\'s deferring the problem forever.'
      },
      {
        text: 'Use item metadata (genre, tags, description) to build a content-based embedding for new items.',
        tier: 'analyst',
        feedback: 'Correct first step. Content-based retrieval for new items solves the cold-start. But without a transition strategy, you stay in content-based mode too long — even after the item has real interaction signal you could use.'
      },
      {
        text: 'Two-stage: content-based retrieval for new items using metadata embeddings, transition to collaborative filtering after ~20 interactions.',
        tier: 'senior',
        feedback: 'Good. The transition threshold matters — 20 interactions may be too low for statistically stable embeddings depending on the domain. You also need to monitor whether the content → collaborative transition actually improves recommendation quality or regresses it.'
      },
      {
        text: 'Two-stage: content-based retrieval for new items using metadata embeddings, merge with collaborative signal after 50+ interactions, monitor the cold-start cohort separately with its own metrics dashboard, and validate that the transition improves downstream metrics.',
        tier: 'staff',
        feedback: 'This is the right design. Separate monitoring for the cold-start cohort is the insight most engineers miss — without it, poor cold-start performance is averaged away in aggregate metrics and never gets fixed.'
      },
    ],
  },
  {
    id: 'recall_drop',
    title: 'Recall Drop',
    question: 'Your retrieval recall@100 dropped from 87% to 64% overnight. What are your first three things to check?',
    options: [
      {
        text: 'Check if a new model version was deployed yesterday.',
        tier: 'junior',
        feedback: 'Checking model version is reasonable, but it\'s one signal, not a systematic process. If no model change happened, you\'re stuck. A recall drop has many possible causes — you need a checklist, not a single hypothesis.'
      },
      {
        text: 'Check model version, then look at latency graphs, then check if A/B traffic split changed.',
        tier: 'analyst',
        feedback: 'Better — you\'re checking multiple signals. But latency is unlikely to explain a recall drop, and A/B traffic split is a low-probability cause. You\'re not checking the most likely failure modes for a retrieval system specifically.'
      },
      {
        text: 'Check embedding freshness, then ANN index rebuild status, then training data for distribution shift.',
        tier: 'senior',
        feedback: 'This is retrieval-system-specific thinking — exactly right. Stale embeddings and stale ANN index are the two most common causes of overnight recall drops in a two-tower system. Distribution shift is a valid third check.'
      },
      {
        text: 'Systematic: (1) embedding freshness/coverage — are item embeddings current and does the ANN index match? (2) ANN index staleness — when was it last rebuilt and with what data? (3) training data composition shift — did the label distribution or interaction data pipeline change?',
        tier: 'staff',
        feedback: 'Correct. Three specific, retrieval-system-native hypotheses in priority order. Embedding coverage and index staleness are the fastest to check and most likely causes. Label distribution shift requires more investigation but rules out model training issues.'
      },
    ],
  },
  {
    id: 'skew',
    title: 'Training-Serving Skew',
    question: 'How do you detect and prevent training-serving skew in your two-tower model?',
    options: [
      {
        text: 'Compare offline AUC to online AUC — if they diverge significantly, there\'s skew.',
        tier: 'junior',
        feedback: 'Offline vs online AUC divergence is a lagging indicator — by the time you notice it, you\'ve been serving a skewed model for days or weeks. This detects skew after it\'s causing harm, not before.'
      },
      {
        text: 'Log features at serving time, sample them, and periodically compare the distribution to training features.',
        tier: 'analyst',
        feedback: 'Good direction. Feature distribution comparison is the right approach. But "periodically compare" is not a production-grade answer — you need continuous monitoring with thresholds and alerts, not ad hoc analysis.'
      },
      {
        text: 'Continuous feature distribution monitoring with PSI thresholds, plus a scheduled validation run that scores a labeled holdout set and alerts if online score distribution drifts from training.',
        tier: 'senior',
        feedback: 'This is production-quality. PSI-gated alerts catch data drift early. Scheduled validation on a holdout set catches model degradation. Together they give you early warning on both feature and model skew.'
      },
      {
        text: 'Feature parity test (assert training and serving compute the same feature values for identical inputs) + continuous score distribution monitoring (KL divergence alert) + scheduled ember test on labeled holdout — all three gates must pass before any model promotion.',
        tier: 'staff',
        feedback: 'This is the complete answer. Feature parity tests are deterministic — they catch code-level skew before deployment. Score distribution monitoring catches runtime drift. The ember test catches model degradation. Making all three promotion gates prevents any single point of failure from slipping through.'
      },
    ],
  },
  {
    id: 'diversity',
    title: 'Diversity Collapse',
    question: 'Your recommendation diversity has dropped 40% over 6 weeks with no model changes. What is the root cause?',
    options: [
      {
        text: 'The model has overfit to recent data. Retrain it on a longer history window.',
        tier: 'junior',
        feedback: 'Retraining is not the root cause fix — it is the exact mechanism that will reproduce the problem. If you retrain on data generated by a biased model, you\'ll get a more biased model. Understanding the cause matters before prescribing the fix.'
      },
      {
        text: 'The training data has become less diverse over time. Augment it with more diverse examples.',
        tier: 'analyst',
        feedback: 'Correct observation — the training data is less diverse. But this is effect, not cause. Why did the training data become less diverse? Augmentation treats the symptom without understanding the feedback loop that caused it.'
      },
      {
        text: 'Feedback loop: model recommendations influenced user behaviour, user behaviour became training labels, model reinforced popular items. Break the loop by adding a diversity regularization term in the loss.',
        tier: 'senior',
        feedback: 'You\'ve identified the feedback loop — this is the key insight. But diversity regularization alone doesn\'t fix data that\'s already been corrupted by the feedback loop. You also need a clean holdout and probably a long-term behavioral holdout to measure ecosystem health.'
      },
      {
        text: 'Feedback loop: model shaped behaviour → behaviour became labels → model reinforced itself. Fix requires: (1) a long-term behavioral holdout (never touched by the recommender) to get unbiased training signal, (2) diversity constraint in objective, (3) causal correction or inverse propensity weighting to debias historical labels.',
        tier: 'staff',
        feedback: 'This is the complete answer. The behavioral holdout is the critical piece most engineers omit — without unbiased data, you can\'t break the loop. IPW debiasing is the statistically correct way to use historical logged data when the logging policy was your own model.'
      },
    ],
  },
]

const TIER_META = {
  junior:  { color: 'var(--ink-mid)', label: 'Junior' },
  analyst: { color: 'var(--ink-low)', label: 'Analyst' },
  senior:  { color: 'var(--prime)',   label: 'Senior' },
  staff:   { color: 'var(--prime)',   label: 'Staff' },
}

const TIER_ORDER = ['junior', 'analyst', 'senior', 'staff']

function DesignCanvas() {
  const [answers, setAnswers]     = useState({})  // sectionId -> optionIndex
  const [revealed, setRevealed]   = useState({})  // sectionId -> bool
  const [submitted, setSubmitted] = useState(false)

  const totalSections = DESIGN_REVIEW_SECTIONS.length
  const answeredCount = Object.keys(answers).length
  const allAnswered   = answeredCount === totalSections

  function handleSelect(sectionId, idx) {
    if (submitted) return
    setAnswers(a => ({ ...a, [sectionId]: idx }))
  }

  function handleReveal(sectionId) {
    setRevealed(r => ({ ...r, [sectionId]: true }))
  }

  function getVerdict() {
    const tiers = Object.entries(answers).map(([sid, idx]) => {
      const sec = DESIGN_REVIEW_SECTIONS.find(s => s.id === sid)
      return sec.options[idx].tier
    })
    const tierOrder = ['junior','analyst','senior','staff']
    const counts = { junior: 0, analyst: 0, senior: 0, staff: 0 }
    tiers.forEach(t => counts[t]++)
    const seniorStaffCount = (counts.senior || 0) + (counts.staff || 0)
    if (seniorStaffCount === totalSections) return { text: 'Production-ready thinking.', color: 'var(--prime)' }
    if (seniorStaffCount >= 3) return { text: 'Solid foundations — gaps in a few critical areas.', color: 'var(--prime)' }
    if (seniorStaffCount >= 1) return { text: 'Developing — needs deeper production experience.', color: 'var(--ink-low)' }
    return { text: 'Junior level — strong fundamentals, but production patterns need work.', color: 'var(--ink-mid)' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Scenario switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Scenario</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '999px', background: 'rgba(240,165,0,0.12)', border: '1px solid rgba(240,165,0,0.35)', color: 'var(--prime)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
            Recommendation System
          </span>
          {['Fraud Detection', 'Search Ranking'].map(s => (
            <span key={s} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: 'var(--depth)', border: '1px solid var(--rim)', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>
              {s} · coming soon
            </span>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.65, maxWidth: '600px' }}>
          A structured design review with 5 sections. For each, pick the answer that best represents how you think — then see which tier your thinking maps to and why.
        </p>
      </div>

      {/* Sections */}
      {DESIGN_REVIEW_SECTIONS.map((section, si) => {
        const chosen    = answers[section.id]
        const isRevealed = revealed[section.id]
        const hasAnswer  = chosen !== undefined

        return (
          <div key={section.id} className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-low)', minWidth: '18px' }}>0{si + 1}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '14px', color: 'var(--ink-hi)' }}>{section.title}</span>
              {hasAnswer && !submitted && (
                <span style={{ fontSize: '10px', color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>answered</span>
              )}
              {submitted && hasAnswer && (
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: `${TIER_META[section.options[chosen].tier].color}18`, color: TIER_META[section.options[chosen].tier].color, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                  {TIER_META[section.options[chosen].tier].label}
                </span>
              )}
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-hi)', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{section.question}</p>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {section.options.map((opt, oi) => {
                const isChosen  = chosen === oi
                const tier      = opt.tier
                const tm        = TIER_META[tier]
                const showFeedback = isRevealed && isChosen

                return (
                  <div key={oi}>
                    <button
                      onClick={() => handleSelect(section.id, oi)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '12px 16px',
                        background: isChosen ? `${tm.color}0d` : 'var(--depth)',
                        border: `1px solid ${isChosen ? tm.color + '40' : 'var(--rim)'}`,
                        borderRadius: '8px', cursor: submitted ? 'default' : 'pointer',
                        transition: 'all 0.12s', display: 'flex', alignItems: 'flex-start', gap: '10px'
                      }}
                    >
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${isChosen ? tm.color : 'var(--rim)'}`, background: isChosen ? tm.color : 'transparent', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isChosen && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--void)' }} />}
                      </span>
                      <span style={{ fontSize: '13px', color: isChosen ? 'var(--ink-hi)' : 'var(--ink-mid)', lineHeight: 1.6 }}>{opt.text}</span>
                    </button>
                    {showFeedback && (
                      <div style={{ margin: '6px 0 0 0', padding: '12px 16px', background: `${tm.color}08`, border: `1px solid ${tm.color}25`, borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: tm.color, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>
                          {tm.label} — feedback
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{opt.feedback}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Pre-reveal hint */}
            {hasAnswer && !isRevealed && DESIGN_REVIEW_HINTS[section.id] && (
              <div className="msl-hint" style={{ margin: '0 0 10px' }}>
                {DESIGN_REVIEW_HINTS[section.id]}
              </div>
            )}

            {/* Reveal button */}
            {hasAnswer && !isRevealed && (
              <button className="btn-ghost" style={{ alignSelf: 'flex-start', fontSize: '12px' }} onClick={() => handleReveal(section.id)}>
                See feedback for my answer →
              </button>
            )}
          </div>
        )
      })}

      {/* Submit */}
      {!submitted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            className="btn-primary"
            disabled={!allAnswered}
            onClick={() => { setSubmitted(true); setRevealed(Object.fromEntries(DESIGN_REVIEW_SECTIONS.map(s => [s.id, true]))) }}
          >
            Submit design review ({answeredCount}/{totalSections} answered)
          </button>
        </div>
      )}

      {/* Verdict */}
      {submitted && (
        <div style={{ padding: '22px 24px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)' }}>Design review verdict</div>

          {/* Tier breakdown */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {TIER_ORDER.map(tier => {
              const count = DESIGN_REVIEW_SECTIONS.filter(s => answers[s.id] !== undefined && s.options[answers[s.id]].tier === tier).length
              if (count === 0) return null
              return (
                <div key={tier} style={{ padding: '8px 14px', borderRadius: '8px', background: `${TIER_META[tier].color}10`, border: `1px solid ${TIER_META[tier].color}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: TIER_META[tier].color, fontFamily: 'var(--font-sans)' }}>{count}</div>
                  <div style={{ fontSize: '11px', color: TIER_META[tier].color, fontFamily: 'var(--font-sans)' }}>{TIER_META[tier].label}</div>
                </div>
              )
            })}
          </div>

          {/* Verdict line */}
          {(() => {
            const v = getVerdict()
            return (
              <div style={{ padding: '14px 18px', background: `${v.color}08`, border: `1px solid ${v.color}30`, borderRadius: '10px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: v.color, margin: 0, fontFamily: 'var(--font-sans)' }}>{v.text}</p>
              </div>
            )
          })()}

          <button className="btn-ghost" style={{ alignSelf: 'flex-start', fontSize: '12px' }}
            onClick={() => { setAnswers({}); setRevealed({}); setSubmitted(false) }}>
            ↺ Restart review
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Two-Tower Explorer ───────────────────────────────────────────────────────

function computeTradeoffs(embDim, negSampling, annIndex, cadence) {
  // Retrieval quality: base from dim, boosted by neg sampling strategy
  let recall = 60
  if (embDim === 128) recall += 12
  if (embDim === 256) recall += 22
  if (negSampling === 'in_batch') recall += 8
  if (negSampling === 'hard') recall += 15
  if (annIndex === 'hnsw') recall -= 4   // approximate
  if (annIndex === 'flat') recall += 5   // exact but slow
  recall = Math.min(recall, 99)

  // P99 latency (ms)
  let latency = 20
  if (embDim === 128) latency += 15
  if (embDim === 256) latency += 40
  if (annIndex === 'flat') latency += 120
  if (annIndex === 'hnsw') latency += 8
  if (annIndex === 'ivf') latency += 30
  // cadence doesn't affect latency directly

  // Memory (relative label)
  let memScore = 1
  if (embDim === 128) memScore = 2
  if (embDim === 256) memScore = 4
  if (annIndex === 'hnsw') memScore += 1.5  // HNSW graph overhead
  if (annIndex === 'ivf') memScore += 0.5

  const memLabel = memScore <= 1.5 ? 'Low' : memScore <= 3 ? 'Moderate' : memScore <= 5 ? 'High' : 'Very High'
  const memColor = memScore <= 1.5 ? 'var(--prime)' : memScore <= 3 ? 'var(--ink-low)' : memScore <= 5 ? 'var(--ink-low)' : 'var(--rose)'

  // Freshness
  const freshnessMap = {
    hourly:  { label: 'Hourly', color: 'var(--prime)' },
    daily:   { label: 'Daily',  color: 'var(--ink-low)' },
    weekly:  { label: 'Weekly', color: 'var(--ink-low)' },
  }

  // Training stability
  let stability = 90
  if (negSampling === 'hard') stability -= 25   // hard negatives can destabilize
  if (negSampling === 'in_batch') stability -= 8
  if (embDim === 256) stability -= 6
  stability = Math.max(stability, 40)

  const stabilityLabel = stability >= 85 ? 'Stable' : stability >= 65 ? 'Moderate' : 'Unstable'
  const stabilityColor = stability >= 85 ? 'var(--prime)' : stability >= 65 ? 'var(--ink-low)' : 'var(--rose)'

  // Recall color
  const recallColor = recall >= 85 ? 'var(--prime)' : recall >= 70 ? 'var(--ink-low)' : 'var(--ink-low)'

  // Latency color
  const latencyColor = latency <= 30 ? 'var(--prime)' : latency <= 60 ? 'var(--ink-low)' : 'var(--ink-low)'

  return {
    recall, recallColor,
    latency, latencyColor,
    memLabel, memColor,
    freshness: freshnessMap[cadence],
    stabilityLabel, stabilityColor,
  }
}

function getStressTests(embDim, negSampling, annIndex, cadence) {
  // Cold start
  let coldStart, coldColor
  let coldRating
  if (negSampling === 'hard') {
    coldStart = 'Hard negatives make cold-start worse — items with no interactions won\'t surface as hard negatives, so the model sees them rarely during training.'
    coldColor = 'var(--rose)'
    coldRating = 'POOR'
  } else if (embDim === 256) {
    coldStart = 'Large embedding dim helps with representation quality but cold-start items have sparse signal — content-based fallback still needed.'
    coldColor = 'var(--ink-low)'
    coldRating = 'PARTIAL'
  } else {
    coldStart = 'In-batch or random negatives are relatively neutral for cold-start. A content-based metadata tower would be needed to handle new items properly.'
    coldColor = 'var(--prime)'
    coldRating = 'FAIR'
  }

  // Popularity bias
  let popBias, popColor, popRating
  if (negSampling === 'random') {
    popBias = 'Random negatives heavily sample popular items — your model learns to push popular items up even more, amplifying popularity bias.'
    popColor = 'var(--rose)'
    popRating = 'POOR'
  } else if (negSampling === 'in_batch') {
    popBias = 'In-batch negatives are correlated with popularity (popular items appear more in batches). Moderate popularity bias expected.'
    popColor = 'var(--ink-low)'
    popRating = 'PARTIAL'
  } else {
    popBias = 'Hard negatives help reduce popularity bias — the model is forced to distinguish between similar but less popular items. Best option for this stress test.'
    popColor = 'var(--prime)'
    popRating = 'GOOD'
  }

  // Embedding drift
  let drift, driftColor, driftRating
  if (cadence === 'weekly') {
    drift = 'Weekly retraining is slow — after 3 weeks of distribution shift, your embeddings will be severely out of date before the next cycle catches up.'
    driftColor = 'var(--rose)'
    driftRating = 'POOR'
  } else if (cadence === 'daily') {
    drift = 'Daily retraining picks up drift within 24 hours. Good for moderate drift, but rapid behavioral shifts can still cause a 1-day window of degraded recommendations.'
    driftColor = 'var(--ink-low)'
    driftRating = 'PARTIAL'
  } else {
    drift = 'Hourly retraining minimizes embedding staleness. Handles moderate drift well. Rapid catalog changes (new items) still require ANN index rebuild to take effect.'
    driftColor = 'var(--prime)'
    driftRating = 'GOOD'
  }

  return [
    {
      title: 'Cold Start',
      desc: 'New item added with zero interaction history',
      text: coldStart,
      color: coldColor,
      rating: coldRating,
    },
    {
      title: 'Popularity Bias',
      desc: 'Top 1% of items account for 80% of recommendations',
      text: popBias,
      color: popColor,
      rating: popRating,
    },
    {
      title: 'Embedding Drift',
      desc: 'Feature distribution shifts over 3 weeks',
      text: drift,
      color: driftColor,
      rating: driftRating,
    },
  ]
}

function TwoTowerExplorer() {
  const [embDim,      setEmbDim]      = useState(128)
  const [negSampling, setNegSampling] = useState('in_batch')
  const [annIndex,    setAnnIndex]    = useState('hnsw')
  const [cadence,     setCadence]     = useState('daily')

  const t  = computeTradeoffs(embDim, negSampling, annIndex, cadence)
  const st = getStressTests(embDim, negSampling, annIndex, cadence)

  function ConfigRow({ label, options, value, onChange }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', minWidth: '130px' }}>{label}</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {options.map(o => (
            <button key={o.value}
              onClick={() => onChange(o.value)}
              style={{
                fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
                border: `1px solid ${value === o.value ? 'var(--prime)' : 'var(--rim)'}`,
                background: value === o.value ? 'rgba(240,165,0,0.1)' : 'var(--depth)',
                color: value === o.value ? 'var(--prime)' : 'var(--ink-mid)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: value === o.value ? 600 : 400, transition: 'all 0.1s'
              }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  function TradeoffRow({ label, value, color, raw, unit }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--rim)' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-low)', minWidth: '180px', fontFamily: 'var(--font-sans)' }}>{label}</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color, fontFamily: 'var(--font-sans)' }}>
          {raw !== undefined ? `${raw}${unit || ''}` : value}
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.65, maxWidth: '600px' }}>
        Configure your two-tower retrieval system and see how each choice affects production tradeoffs — and how the system handles real stress tests.
      </p>

      {/* Config panel */}
      <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>System configuration</div>
        <ConfigRow label="Embedding dim" value={embDim} onChange={setEmbDim}
          options={[{ value: 64, label: '64d' }, { value: 128, label: '128d' }, { value: 256, label: '256d' }]} />
        <ConfigRow label="Negative sampling" value={negSampling} onChange={setNegSampling}
          options={[{ value: 'random', label: 'Random' }, { value: 'in_batch', label: 'In-batch' }, { value: 'hard', label: 'Hard' }]} />
        <ConfigRow label="ANN index" value={annIndex} onChange={setAnnIndex}
          options={[{ value: 'flat', label: 'Flat (exact)' }, { value: 'ivf', label: 'IVF' }, { value: 'hnsw', label: 'HNSW' }]} />
        <ConfigRow label="Update cadence" value={cadence} onChange={setCadence}
          options={[{ value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]} />
      </div>

      {/* Tradeoff matrix */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>Production tradeoff matrix</div>
        <TradeoffRow label="Retrieval recall@100" raw={t.recall} unit="%" color={t.recallColor} />
        <TradeoffRow label="P99 serving latency" raw={t.latency} unit=" ms" color={t.latencyColor} />
        <TradeoffRow label="Memory footprint" value={t.memLabel} color={t.memColor} />
        <TradeoffRow label="Embedding freshness" value={t.freshness.label} color={t.freshness.color} />
        <TradeoffRow label="Training stability" value={t.stabilityLabel} color={t.stabilityColor} />
      </div>

      {/* Stress tests */}
      <div>
        <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}>Production stress tests</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {st.map(s => (
            <div key={s.title} style={{ padding: '16px 18px', background: 'var(--depth)', border: `1px solid ${s.color}30`, borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: 'var(--ink-hi)' }}>{s.title}</span>
                <span style={{ fontSize: '10px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{s.desc}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: `${s.color}15`, color: s.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{s.rating}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Serving Tradeoff Lab ─────────────────────────────────────────────────────

const ARCHITECTURES = [
  {
    id: 'batch',
    name: 'Batch Offline',
    desc: 'Nightly job → precomputed scores → fast lookup at serving',
  },
  {
    id: 'stream',
    name: 'Near-Real-Time Stream',
    desc: 'Kafka → feature computation → model inference (~1–5 min lag)',
  },
  {
    id: 'online',
    name: 'Online Request-Time',
    desc: 'Feature fetch + model inference on every request',
  },
  {
    id: 'precomp',
    name: 'Precomputed Embeddings + Online Scoring',
    desc: 'Embeddings precomputed, only dot product at serving time',
  },
]

function evalArch(archId, latency, throughput, freshness, depth) {
  // Returns array of { dimension, status: 'meets'|'partial'|'fails', reason }
  const results = []

  // Latency
  const latencyBudgets = { '<50ms': 50, '<200ms': 200, '<1s': 1000, '<10s': 10000 }
  const budgetMs = latencyBudgets[latency]

  if (archId === 'batch') {
    results.push({
      dim: 'Latency', status: 'meets',
      reason: 'Precomputed lookup is a table scan — sub-millisecond, easily meets any budget.',
    })
  } else if (archId === 'stream') {
    const ok = budgetMs >= 200
    results.push({
      dim: 'Latency', status: ok ? 'meets' : 'fails',
      reason: ok
        ? 'Stream inference completes well within 200ms budget given pre-materialized features.'
        : `Stream inference adds 50–150ms overhead — cannot meet ${latency} budget reliably.`,
    })
  } else if (archId === 'online') {
    const ok = budgetMs >= 200
    results.push({
      dim: 'Latency', status: ok ? (budgetMs >= 1000 ? 'meets' : 'partial') : 'fails',
      reason: ok
        ? (budgetMs >= 1000 ? 'Feature fetch + inference can fit within 1s with good engineering.' : `Feature fetch + inference typically 100–400ms — tight for ${latency} budget, requires careful optimization.`)
        : `Online feature fetch (20–80ms) + model inference (50–200ms) cannot reliably meet ${latency}.`,
    })
  } else { // precomp
    const ok = budgetMs >= 50
    results.push({
      dim: 'Latency', status: ok ? 'meets' : 'partial',
      reason: ok
        ? 'Dot product scoring over precomputed embeddings adds <5ms — easily meets the budget.'
        : 'Even dot product scoring at scale can hit 20–40ms at >10k QPS — verify with load test.',
    })
  }

  // Throughput
  const qpsMap = { '<100 QPS': 100, '<1k QPS': 1000, '<10k QPS': 10000, '>10k QPS': 100001 }
  const qps = qpsMap[throughput]

  if (archId === 'batch') {
    results.push({ dim: 'Throughput', status: 'meets', reason: 'Table lookups scale to any QPS with read replicas — no model inference at serving.' })
  } else if (archId === 'stream') {
    results.push({ dim: 'Throughput', status: qps <= 10000 ? 'meets' : 'partial', reason: qps <= 10000 ? 'Kafka-backed stream infrastructure handles <10k QPS comfortably.' : 'Stream inference at >10k QPS requires careful partitioning and consumer scaling.' })
  } else if (archId === 'online') {
    results.push({ dim: 'Throughput', status: qps <= 1000 ? 'meets' : qps <= 10000 ? 'partial' : 'fails', reason: qps <= 1000 ? 'Online inference at <1k QPS is manageable with standard model serving.' : qps <= 10000 ? 'Online inference at this scale requires horizontal scaling and model batching.' : 'Online feature fetch + inference at >10k QPS is expensive — consider precomputed embeddings.' })
  } else {
    results.push({ dim: 'Throughput', status: 'meets', reason: 'Dot product scoring is compute-cheap and horizontally scalable to any QPS.' })
  }

  // Feature freshness
  const freshnessRank = { 'real-time': 0, '<5min': 1, '<1hr': 2, 'daily': 3 }
  const freshnessReq = freshnessRank[freshness]

  if (archId === 'batch') {
    const ok = freshnessReq >= 3
    results.push({ dim: 'Freshness', status: ok ? 'meets' : 'fails', reason: ok ? 'Daily batch is aligned with your daily freshness requirement.' : `Batch scores are computed nightly — freshness is ~24h, cannot meet ${freshness} requirement.` })
  } else if (archId === 'stream') {
    const ok = freshnessReq >= 1
    results.push({ dim: 'Freshness', status: ok ? 'meets' : 'partial', reason: ok ? 'Stream pipeline with 1–5 min lag meets your freshness requirement.' : 'Stream lag is 1–5 minutes — borderline for real-time requirement, depends on pipeline SLA.' })
  } else if (archId === 'online') {
    results.push({ dim: 'Freshness', status: 'meets', reason: 'Online feature fetch is real-time — the freshest possible signals on every request.' })
  } else {
    const ok = freshnessReq >= 2
    results.push({ dim: 'Freshness', status: ok ? 'meets' : 'partial', reason: ok ? 'Precomputed embeddings refreshed on your cadence meet this freshness requirement.' : 'Embeddings are precomputed on a batch schedule — not suitable for sub-hour freshness needs.' })
  }

  // Personalization depth
  // no_personalization | light | deep
  if (archId === 'batch') {
    const ok = depth !== 'deep'
    results.push({ dim: 'Personalization', status: ok ? 'meets' : 'partial', reason: ok ? 'Batch-precomputed user scores provide light to user-level personalization.' : 'Batch cannot capture context-aware per-request signals (device, session state, recent actions).' })
  } else if (archId === 'stream') {
    const ok = depth !== 'deep'
    results.push({ dim: 'Personalization', status: ok ? 'meets' : 'partial', reason: ok ? 'Stream pipeline can incorporate recent user events for user-level personalization.' : 'Per-request context (current session, real-time signals) requires online inference, not stream.' })
  } else if (archId === 'online') {
    results.push({ dim: 'Personalization', status: 'meets', reason: 'Online inference has access to full request context — supports deep, per-request personalization.' })
  } else {
    const ok = depth !== 'deep'
    results.push({ dim: 'Personalization', status: ok ? 'meets' : 'partial', reason: ok ? 'Precomputed user embeddings support user-level personalization at scoring time.' : 'Precomputed user embeddings don\'t capture real-time session context — only user-level signals.' })
  }

  return results
}

function getRecommendedArch(latency, throughput, freshness, depth) {
  const qpsMap = { '<100 QPS': 100, '<1k QPS': 1000, '<10k QPS': 10000, '>10k QPS': 100001 }
  const qps = qpsMap[throughput]
  const freshnessRank = { 'real-time': 0, '<5min': 1, '<1hr': 2, 'daily': 3 }
  const fr = freshnessRank[freshness]
  const latencyBudgets = { '<50ms': 50, '<200ms': 200, '<1s': 1000, '<10s': 10000 }
  const latMs = latencyBudgets[latency]

  if (fr >= 3 && depth !== 'deep') {
    return { id: 'batch', name: 'Batch Offline', reason: 'Daily freshness requirement and no deep per-request personalization — the simplest option. Nightly batch is the lowest-risk, lowest-cost architecture for this use case.' }
  }
  if (fr >= 1 && depth !== 'deep' && qps <= 10000 && latMs >= 200) {
    return { id: 'stream', name: 'Near-Real-Time Stream', reason: 'Sub-hour freshness without per-request context — stream pipeline is the right balance. Simpler than online inference, fresher than batch.' }
  }
  if (depth === 'deep' || fr === 0) {
    if (qps > 10000 || latMs < 200) {
      return { id: 'precomp', name: 'Precomputed Embeddings + Online Scoring', reason: 'Deep personalization or real-time freshness at high scale — precomputed embeddings with online dot-product scoring gives you per-request context without the full cost of online inference.' }
    }
    return { id: 'online', name: 'Online Request-Time', reason: 'Deep per-request personalization or real-time freshness at manageable scale — online inference is the right architecture here, despite higher operational complexity.' }
  }
  return { id: 'precomp', name: 'Precomputed Embeddings + Online Scoring', reason: 'Balances freshness, scale, and personalization needs without the full cost of online inference.' }
}

const WRONG_ARCH_CONSEQUENCES = {
  batch: {
    stream: 'Using batch when you need stream: scores are up to 24h stale. Users who just expressed strong intent get yesterday\'s recommendations.',
    online: 'Using batch when you need online: you\'re missing real-time context entirely. A user who just searched for "shoes" still sees recommendations from their profile built last night.',
    precomp: 'Using batch when you need real-time scoring: you\'re serving the same precomputed scores regardless of what the user is doing right now.',
  },
  default: 'Getting the serving architecture wrong means either serving stale scores (batch when freshness matters), spending 10x on infrastructure (online when batch suffices), or failing your latency SLA under load (online at >10k QPS without careful engineering).',
}

function ServingTradeoffLab() {
  const [latency,    setLatency]    = useState('<200ms')
  const [throughput, setThroughput] = useState('<1k QPS')
  const [freshness,  setFreshness]  = useState('<5min')
  const [depth,      setDepth]      = useState('light')

  const recommended = getRecommendedArch(latency, throughput, freshness, depth)

  function statusIcon(s) {
    if (s === 'meets')   return { label: 'meets',   color: 'var(--mint)' }
    if (s === 'partial') return { label: 'partial',  color: 'var(--ember)' }
    return                     { label: 'fails',    color: 'var(--rose)' }
  }

  function ConfigRow({ label, options, value, onChange }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)', minWidth: '145px' }}>{label}</span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {options.map(o => (
            <button key={o.value} onClick={() => onChange(o.value)}
              style={{
                fontSize: '12px', padding: '5px 12px', borderRadius: '6px',
                border: `1px solid ${value === o.value ? 'var(--prime)' : 'var(--rim)'}`,
                background: value === o.value ? 'rgba(240,165,0,0.1)' : 'var(--depth)',
                color: value === o.value ? 'var(--prime)' : 'var(--ink-mid)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: value === o.value ? 600 : 400, transition: 'all 0.1s'
              }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <p style={{ fontSize: '13px', color: 'var(--ink-low)', margin: 0, lineHeight: 1.65, maxWidth: '600px' }}>
        Set your production requirements and see which serving architectures meet them, which partially meet them, and which fail — with specific reasoning for each.
      </p>

      {/* Requirements */}
      <div className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>Your requirements</div>
        <ConfigRow label="Latency budget" value={latency} onChange={setLatency}
          options={[{ value: '<50ms', label: '<50ms' }, { value: '<200ms', label: '<200ms' }, { value: '<1s', label: '<1s' }, { value: '<10s', label: '<10s' }]} />
        <ConfigRow label="Throughput" value={throughput} onChange={setThroughput}
          options={[{ value: '<100 QPS', label: '<100 QPS' }, { value: '<1k QPS', label: '<1k QPS' }, { value: '<10k QPS', label: '<10k QPS' }, { value: '>10k QPS', label: '>10k QPS' }]} />
        <ConfigRow label="Feature freshness" value={freshness} onChange={setFreshness}
          options={[{ value: 'real-time', label: 'Real-time' }, { value: '<5min', label: '<5 min' }, { value: '<1hr', label: '<1 hr' }, { value: 'daily', label: 'Daily' }]} />
        <ConfigRow label="Personalization" value={depth} onChange={setDepth}
          options={[{ value: 'none', label: 'None' }, { value: 'light', label: 'User-level' }, { value: 'deep', label: 'Deep (per-request)' }]} />
      </div>

      {/* Architecture evaluation table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)' }}>Architecture evaluation</div>
        {ARCHITECTURES.map(arch => {
          const results = evalArch(arch.id, latency, throughput, freshness, depth)
          const isRec   = recommended.id === arch.id
          const fails   = results.filter(r => r.status === 'fails').length
          const partials = results.filter(r => r.status === 'partial').length

          return (
            <div key={arch.id} style={{ padding: '18px 20px', background: 'var(--depth)', border: `1px solid ${isRec ? 'rgba(240,165,0,0.35)' : fails > 0 ? 'rgba(239,68,68,0.20)' : 'var(--rim)'}`, borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '18px' }}>{arch.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '13px', color: isRec ? 'var(--prime)' : 'var(--ink-hi)' }}>
                    {arch.name}
                    {isRec && <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 7px', borderRadius: '5px', background: 'rgba(240,165,0,0.12)', color: 'var(--prime)', fontFamily: 'var(--font-mono)' }}>RECOMMENDED</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-low)' }}>{arch.desc}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--mint)', fontFamily: 'var(--font-mono)' }}>{results.filter(r => r.status === 'meets').length} meets</span>
                  {partials > 0 && <span style={{ fontSize: '11px', color: 'var(--ember)', fontFamily: 'var(--font-mono)' }}>{partials} partial</span>}
                  {fails > 0 && <span style={{ fontSize: '11px', color: 'var(--rose)', fontFamily: 'var(--font-mono)' }}>{fails} fails</span>}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {results.map(r => {
                  const si = statusIcon(r.status)
                  return (
                    <div key={r.dim} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ fontWeight: 700, color: si.color, fontFamily: 'var(--font-mono)', fontSize: '10px', minWidth: '48px', paddingTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{si.label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--ink-low)', minWidth: '100px', fontFamily: 'var(--font-sans)' }}>{r.dim}</span>
                      <span style={{ fontSize: '12px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>{r.reason}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Recommendation */}
      <div style={{ padding: '20px 22px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)' }}>Recommended architecture</div>
        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '15px', color: 'var(--prime)' }}>{recommended.name}</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{recommended.reason}</p>
      </div>

      {/* Why your choice matters */}
      <div style={{ padding: '18px 20px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '10px', color: 'var(--ink-low)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)' }}>Why your choice matters</div>
        <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
          Getting the serving architecture wrong creates compounding problems. <strong style={{ color: 'var(--ink-hi)' }}>Batch offline with a real-time requirement</strong> means serving stale scores to users who just changed their preferences — a user who just bought a camera still sees camera ads. <strong style={{ color: 'var(--ink-hi)' }}>Online inference when batch suffices</strong> costs 5–20x more in infrastructure and adds latency variance. <strong style={{ color: 'var(--ink-hi)' }}>Choosing online at {'>'}10k QPS</strong> without careful model optimization will breach your latency SLA under load when you can least afford it. The right architecture is the simplest one that meets your actual requirements — not the most sophisticated one you can build.
        </p>
      </div>
    </div>
  )
}



// ─── Shared AccordionMCQ ─────────────────────────────────────────────────────
function AccordionMCQ({ scenarios, accentColor = 'var(--prime)', storageKey = null }) {
  const [items, setItems] = React.useState(() => {
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem('msl_score:' + storageKey))
        if (saved && saved.length === scenarios.length) return saved
      } catch {}
    }
    return scenarios.map(() => ({ open: false, picked: null, revealed: false }))
  })
  const [diffFilter, setDiffFilter] = React.useState('all')

  React.useEffect(() => {
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

  React.useEffect(() => {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, var(--depth) 40%)', borderRadius: '10px', border: '1px solid var(--rim)', boxShadow: '0 4px 14px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.11)' }}>
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
          <div key={sc.id} style={{ border: `1px solid ${it.open ? accentColor + '55' : 'var(--rim-hi)'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
            <button onClick={() => toggle(i)} style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: it.open ? accentColor + '08' : 'var(--depth)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.15s' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '20px' }}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)', textAlign: 'left' }}>{sc.title}</span>
              {it.revealed && <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>{isCorrect ? '✓' : '✗'}</span>}
              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--ink-ghost)', transition: 'transform 0.2s', transform: it.open ? 'rotate(90deg)' : 'rotate(0deg)' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 2l4 3-4 3"/></svg></span>
            </button>

            {it.open && (
              <div className="accordion-enter" style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', border: '1px solid var(--rim-hi)', boxShadow: '0 2px 8px rgba(0,0,0,0.30)', marginTop: '4px' }}>
                  {Array.isArray(sc.context) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {sc.context.map((line, li) => <p key={li} style={{ fontSize: '12.5px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{line}</p>)}
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
                    return (
                      <button key={oi} disabled={it.revealed} onClick={() => pick(i, oi)}
                        className={`msl-option-btn${it.revealed && isAns ? ' correct' : ''}${it.revealed && isPicked && !isAns ? ' wrong' : ''}${!it.revealed && isPicked ? ' selected' : ''}`}
                        style={{ textAlign: 'left', padding: '10px 14px', borderRadius: '8px', cursor: it.revealed ? 'default' : 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start', width: '100%' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '14px', paddingTop: '2px' }}>{['A','B','C','D'][oi]}</span>
                        <span style={{ fontSize: '13px', lineHeight: 1.5 }}>{opt}</span>
                        {it.revealed && isAns && <span style={{ marginLeft: 'auto', color: 'var(--mint)', fontSize: '12px' }}>✓</span>}
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
                    <div style={{ padding: '12px 16px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px' }}>
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

// ─── RAG Architecture Judgment ────────────────────────────────────────────────
const RAG_SCENARIOS = [
  {
    id: 'rag1',
    title: 'Chunk size decision',
    context: 'You are building a RAG system over 10,000 legal contracts. Each contract is 20–50 pages. Users ask highly specific questions ("What is the termination notice period in the Acme contract?"). Your initial system uses 2,000-token chunks and retrieves top-3.',
    question: 'Your current system uses 2,000-token chunks and retrieves top-3, but users asking "What is the termination notice period in the Acme contract?" are getting poor results. Users want specific clause-level answers from 20–50 page contracts. Does chunking larger or smaller fix this, and why?',
    options: [
      'Increase to 5,000-token chunks — bigger context is always better for long documents.',
      'Use 256-512 token chunks with sentence boundary awareness — small chunks improve retrieval precision for specific queries.',
      'Keep 2,000-token chunks but retrieve top-10 to ensure the answer is in the context.',
      'Use document-level chunks — retrieve the full contract and let the LLM extract the answer.',
    ],
    answer: 1,
    diagnosis: 'For specific fact-retrieval questions, smaller chunks improve recall precision: the relevant clause is a few sentences, not 2,000 tokens. Large chunks dilute the signal in the embedding — the embedding for a 2,000-token chunk averages over many topics, making it harder to surface the one relevant clause. Retrieving top-10 with large chunks fills the context window with irrelevant content and confuses the LLM.',
    fix: 'Use 256–512 token chunks with sentence-boundary splitting (no mid-sentence cuts). Add 10% overlap between adjacent chunks to preserve context at boundaries. For hierarchical documents, consider "parent document retrieval": retrieve small chunks, then fetch the larger parent chunk for the LLM context window. Evaluate chunk quality with context recall metric (RAGAS).',
  },
  {
    id: 'rag2',
    title: 'Retrieval strategy for keyword-heavy queries',
    context: 'A RAG system over software documentation receives queries like "HTTPConnectionPool timeout error Python 3.11." Dense embedding retrieval (cosine similarity) misses the exact error message and returns semantically related but irrelevant documents. Recall@5 is 42%.',
    question: 'Recall@5 is 42% for queries like "HTTPConnectionPool timeout error Python 3.11." Dense embedding search returns semantically related but wrong documents — it can\'t find the exact error string. Do you switch to BM25, or is there a retrieval design that handles both?',
    options: [
      'Switch entirely to BM25 sparse retrieval — it handles exact keywords better than embeddings.',
      'Use hybrid search: combine BM25 sparse retrieval with dense embedding retrieval, fuse results with RRF or a weighted sum.',
      'Use a larger embedding model — GPT-4 embeddings will handle exact keywords better.',
      'Increase k from 5 to 50 — the answer is in the index, just not in top-5.',
    ],
    answer: 1,
    diagnosis: 'Dense embeddings excel at semantic similarity but struggle with exact-match queries, product names, error codes, and technical jargon (rare tokens get diffused in the embedding space). BM25 handles exact matches perfectly. Hybrid search combines both strengths: BM25 for exact matches, dense for semantic understanding. Switching entirely to BM25 would hurt semantic queries. Increasing k degrades precision and fills the context window with noise.',
    fix: 'Implement hybrid search: (1) Run BM25 (Elasticsearch or BM25Okapi) and dense ANN search in parallel. (2) Merge result lists using Reciprocal Rank Fusion (RRF): score = Σ 1/(k + rank_i) across retrieval methods. (3) Pass top-k fused results to LLM. Most vector DBs now support hybrid search natively (Weaviate, Qdrant, Pinecone). Tune BM25 weight vs dense weight on a labeled evaluation set.',
  },
  {
    id: 'rag3',
    title: 'Reranking decision',
    context: 'Your RAG pipeline retrieves top-20 chunks via ANN search, then passes all 20 to the LLM. The LLM context window fills up and you hit token limit errors. Reducing k to 3 drops answer quality significantly.',
    question: 'Retrieving top-20 chunks blows your context window. Cutting to top-3 tanks answer quality. You\'re stuck between token limits and coverage. What architectural component do you add between retrieval and generation to break this tradeoff?',
    options: [
      'Switch to a model with a larger context window (128k tokens) to fit all 20 chunks.',
      'Add a cross-encoder reranker between retrieval and generation: rerank top-20, pass top-3 to the LLM.',
      'Summarise each of the 20 chunks before passing to the LLM to reduce token count.',
      'Use map-reduce: have the LLM process each chunk independently and aggregate answers.',
    ],
    answer: 1,
    diagnosis: 'A cross-encoder reranker scores each (query, chunk) pair jointly — far more accurate than bi-encoder ANN retrieval because it has direct query-document interaction. Retrieve a large candidate set with fast ANN (high recall, lower precision), rerank with cross-encoder (high precision on top-k). This separates the recall/latency tradeoff from the precision tradeoff.',
    fix: 'Add cohere-rerank, BGE-Reranker, or cross-encoder/ms-marco-MiniLM after ANN retrieval. Pattern: ANN retrieves top-20 (fast, recall-optimised), cross-encoder reranks to top-3 (slow, precision-optimised). The reranker adds 50–200ms latency but dramatically improves top-3 relevance. Evaluate with NDCG@3 before and after reranking. For latency-sensitive systems, use a smaller reranker model (MiniLM vs large models).',
  },
  {
    id: 'rag4',
    title: 'Embedding model choice',
    context: 'A team building a RAG system for medical literature is choosing between: text-embedding-ada-002 (OpenAI), a general-purpose sentence transformer (all-mpnet-base-v2), and a domain-specific biomedical embedding model (BioLinkBERT). Budget is not a primary constraint.',
    question: 'ada-002 is available via API with no setup. all-mpnet-base-v2 is open-source and fast. BioLinkBERT is domain-specific but adds operational complexity. For a medical literature RAG system where queries reference drug names, disease codes, and biological pathways — which do you pick, and what is the concrete mechanism that makes the others lose?',
    options: [
      'text-embedding-ada-002 — it is the best general-purpose model and the simplest to use via API.',
      'all-mpnet-base-v2 — open-source, no API dependency, good general performance.',
      'BioLinkBERT — domain-specific models capture biomedical terminology and relationships that general models cannot represent.',
      'Train a custom embedding model on this specific corpus — production systems always need custom embeddings.',
    ],
    answer: 2,
    diagnosis: 'Medical literature contains domain-specific vocabulary (drug names, disease codes, biological pathways) that general embedding models represent poorly — rare tokens get averaged into generic embeddings. BioLinkBERT was trained on biomedical text and encodes the semantic relationships in medical literature correctly. ada-002 is a strong general baseline but loses to domain-specific models on specialized corpora.',
    fix: 'Use BioLinkBERT or PubMedBERT as the base embedding model. Evaluate on a labeled retrieval benchmark from your specific document corpus (build a small eval set: 50–100 question-answer pairs with ground-truth source chunks). If domain-specific model underperforms surprisingly, fine-tune it on your corpus with a contrastive learning objective. Track NDCG@5 and context recall as primary retrieval metrics.',
  },
  {
    id: 'rag5',
    title: 'RAG evaluation without labels',
    context: 'You have deployed a RAG system with no labeled evaluation dataset. Users are using it, but you have no ground truth question-answer pairs to measure quality. A stakeholder asks for a system quality metric.',
    question: 'Your RAG system is live with real users but you have zero labeled Q&A pairs. A stakeholder wants a quality number by end of week. You can\'t answer "not possible" — what do you actually measure, and how do you get a meaningful signal without ground truth?',
    options: [
      'You cannot evaluate RAG quality without labeled data — tell the stakeholder evaluation is not possible.',
      'Use LLM-as-judge metrics (RAGAS): faithfulness (does the answer contradict the retrieved context?), answer relevance (does the answer address the question?), and context precision (are retrieved chunks relevant?).',
      'Use BLEU/ROUGE scores comparing LLM output to retrieved chunks.',
      'Track user session length — longer sessions indicate better answers.',
    ],
    answer: 1,
    diagnosis: 'RAGAS (Retrieval-Augmented Generation Assessment) provides reference-free metrics using an LLM judge. Faithfulness measures whether the answer is grounded in the retrieved context (hallucination detection). Answer relevance measures whether the answer addresses the question. Context precision/recall measure retrieval quality. These metrics correlate well with human judgment without requiring manually labeled data.',
    fix: 'Implement RAGAS: pip install ragas. Run faithfulness + answer_relevance + context_precision on a sample of 100 production queries. Set threshold dashboards: faithfulness < 0.7 triggers a retrieval pipeline review. For a labeled evaluation set, have domain experts annotate 50 golden Q&A pairs — this is a one-time cost that pays for itself in deployment confidence. Monitor RAGAS scores weekly and alert on regressions.',
  },
  {
    id: 'rag6',
    title: 'Hallucination on out-of-scope queries',
    context: 'A RAG system built on company internal documentation is asked "What is the capital of France?" The system retrieves irrelevant documents and the LLM answers "Paris" — correctly, but from its parametric knowledge, not from the retrieved context. A week later it answers a similar out-of-scope question incorrectly.',
    question: 'Your RAG system answered "What is the capital of France?" correctly — but from the LLM\'s parametric memory, not retrieved documents. A week later it answered a similar out-of-scope question incorrectly. A system prompt instruction to "only use the context" didn\'t stop it. What is the correct production gate?',
    options: [
      'Add "only answer from the provided context" to the system prompt — the LLM will comply.',
      'Implement a retrieval confidence gate: if the top retrieved chunk similarity is below threshold (e.g., 0.6 cosine), respond "I don\'t have information about this in the knowledge base."',
      'Use a more powerful LLM that knows when to say "I don\'t know."',
      'Increase the number of retrieved chunks — if the answer is anywhere in the corpus, more chunks will find it.',
    ],
    answer: 1,
    diagnosis: 'System prompt instructions to "only use context" are not reliable — LLMs frequently ignore them under distribution shift or adversarial phrasing. The root issue is that when no relevant context is retrieved, the LLM falls back to parametric knowledge. A hard threshold on retrieval similarity is a deterministic gate that does not depend on LLM compliance.',
    fix: 'Add a retrieval quality gate: compute max(cosine_similarity) over retrieved chunks. If below threshold (tune empirically, typically 0.55–0.65), return a canned response: "I don\'t have information about this topic in the knowledge base." Include a RAGAS faithfulness check as a post-generation guard: if faithfulness < 0.5, flag the response for human review or refuse. Log all low-confidence retrievals for knowledge base gap analysis.',
  },
]

function RAGArchitecture() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontSize: '13.5px', color: 'var(--ink-low)', lineHeight: 1.65, maxWidth: '600px', margin: 0 }}>
        RAG system design requires judgment at every stage: chunking, retrieval strategy, reranking, evaluation, and hallucination prevention. Each scenario tests a critical production decision.
      </p>
      <AccordionMCQ scenarios={RAG_SCENARIOS} accentColor="var(--prime)" storageKey="sysdesign_rag" />
    </div>
  )
}

// ─── Two-Tower Architecture Diagram ──────────────────────────────────────────
const TT_NODES = [
  {
    id: 'user_features', label: 'User Features', sub: 'activity, demographics, context',
    color: 'var(--ink-low)', bg: 'rgba(240,165,0,0.08)',
    what: 'Raw user signals fed into the user tower: recent activity (clicks, watches, purchases), demographic attributes, and request context (time of day, device, location).',
    decisions: 'Which features to include at query time vs pre-compute in batch. Real-time features (last-5-clicks) add freshness but increase serving latency.',
    failures: 'Including future-leaking features during training (e.g., post-event engagement). Real-time feature retrieval fails under load, causing stale fallback or dropped requests.',
    signal: 'Strong candidates ask: are user features computed at request time or fetched from a feature store? That distinction reveals serving architecture sophistication.',
  },
  {
    id: 'item_features', label: 'Item Features', sub: 'content, metadata, popularity',
    color: 'var(--ink-low)', bg: 'rgba(240,165,0,0.08)',
    what: 'Static and slowly-changing item attributes: content signals (text, image embeddings), metadata (category, price, age), and popularity signals (CTR, rating).',
    decisions: 'How frequently to refresh item features. Popularity signals change hourly; content signals are stable. Mixing staleness tolerances complicates the pipeline.',
    failures: 'Stale item features for trending content. New items have no popularity signal — cold-start problem requires a separate fallback strategy.',
    signal: 'Ask: how do you handle items with no historical signal? The answer reveals whether the candidate has thought about cold-start.',
  },
  {
    id: 'user_tower', label: 'User Tower', sub: 'DNN encoder',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)',
    what: 'Independent DNN that maps user context to a fixed-size embedding vector. Runs at query time on the online path — must be fast (typically <10ms).',
    decisions: 'Embedding dimension (64–512), whether to include real-time features vs batch-only, staleness tolerance. Deeper towers capture more signal but add latency.',
    failures: 'Tower learns popularity bias rather than preference signal; user embedding drifts when behavior shifts after major product changes.',
    signal: 'Staff asks: are user and item towers trained jointly or separately? Joint training leaks future information through the item tower.',
  },
  {
    id: 'item_tower', label: 'Item Tower', sub: 'DNN encoder',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.12)',
    what: 'Mirror DNN that maps item features to the same embedding space as the user tower. Runs offline to pre-compute embeddings for all items in the catalog.',
    decisions: 'Same architecture as user tower (shared dim) to enable dot-product similarity. Separate towers allow independent feature sets for users vs items.',
    failures: 'Architecture mismatch between user and item tower output dims breaks the ANN index at deployment. Schema changes in item features require full re-embedding.',
    signal: 'The item tower runs offline — this is the key enabling constraint for billion-scale retrieval. Candidates who know this understand why two-tower works.',
  },
  {
    id: 'user_emb', label: 'User Embedding', sub: 'd=256 vector',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.15)',
    what: 'Fixed-dimension float vector representing the user in the shared embedding space. Computed at query time by the user tower. Used as the query vector for ANN search.',
    decisions: 'Dimension tradeoff: higher dim = more expressiveness, but larger ANN index and more compute. 64–256 is typical; >512 rarely justified.',
    failures: 'Embedding dimension changed after ANN index was built — requires full index rebuild. User embedding at training time differs from serving time due to feature pipeline divergence.',
    signal: 'The user embedding is computed fresh per request. That freshness is the tradeoff against item embeddings being stale.',
  },
  {
    id: 'item_emb', label: 'Item Embeddings', sub: 'pre-computed offline',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.15)',
    what: 'All item embeddings pre-computed offline and loaded into the ANN index. This decoupling is the core architectural insight that makes billion-scale retrieval possible.',
    decisions: 'Index rebuild frequency (hourly vs daily), handling new items not yet embedded (cold-start fallback to content-based or popularity-based retrieval).',
    failures: 'Stale embeddings serve yesterday\'s catalog. New items invisible until next index rebuild. Deleted items remain in index until rebuild, causing dead links.',
    signal: 'The pre-computation is what makes billion-scale retrieval possible — decoupled encoding is the architectural insight. Ask: how long until a new item appears in retrieval?',
  },
  {
    id: 'ann', label: 'ANN Index', sub: 'FAISS / ScaNN',
    color: 'var(--ink-low)', bg: 'rgba(240,165,0,0.08)',
    what: 'Approximate Nearest Neighbor search index containing all pre-computed item embeddings. Returns top-K items by cosine or dot-product similarity to the user query vector.',
    decisions: 'FAISS IVF vs HNSW vs ScaNN — latency vs recall tradeoff. K size (200–1000). Index must fit in memory; sharding required at billion-item scale.',
    failures: 'ANN recall at 95% means 5% of true nearest neighbors are missed; higher K downstream compensates but adds ranker load. Index too large for single node requires distributed ANN.',
    signal: 'Staff knows: ANN recall is tunable. The right K is determined by ranker capacity, not by "more is better".',
  },
  {
    id: 'candidates', label: 'Top-K Candidates', sub: 'k=500',
    color: 'var(--ink-mid)', bg: 'rgba(255,255,255,0.10)',
    what: 'The set of K approximately-nearest items returned by ANN. These are the candidates passed to the ranker for re-scoring with richer features.',
    decisions: 'K size balances ranker load vs retrieval coverage. K=200 is cheap; K=1000 recovers more ANN misses but multiplies ranker cost by 5x.',
    failures: 'K too small: genuine best items not retrieved, ranker cannot recover them. K too large: ranker becomes the bottleneck at high QPS.',
    signal: 'K is the key tuning knob at the retrieval-ranking boundary. Candidates who know to measure recall@K vs ranker latency understand the system.',
  },
  {
    id: 'ranker', label: 'Ranking Model', sub: 'pointwise or LTR',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.15)',
    what: 'Pointwise or listwise model that re-scores the K candidates with richer features unavailable at retrieval time (e.g., user-item interaction features, business rules).',
    decisions: 'Pointwise (independent scores) vs pairwise vs listwise loss. Whether to add interaction features unavailable at retrieval time. Budget for how many features are practical at K=500.',
    failures: 'Ranker sees a biased candidate set — it can only rank what retrieval surfaced, so retrieval errors compound. Ranker overfits to popular items if training data is not debiased.',
    signal: 'Two-stage is a latency tradeoff: cheap retrieval at scale, expensive ranking on a small set. The split is the design. Staff asks: how do you debias ranker training data?',
  },
  {
    id: 'result', label: 'Final Results', sub: 'Top-10 served',
    color: 'var(--prime)', bg: 'rgba(240,165,0,0.15)',
    what: 'The top-N items after ranking, subject to business rules (diversity constraints, exclusion lists, sponsored slots). What the user sees.',
    decisions: 'Post-ranking business rules: deduplication, diversity enforcement, sponsored item injection. Caching strategy for identical requests.',
    failures: 'Business rules applied inconsistently across platforms. Diversity logic reduces measured CTR in A/B but improves long-term retention — easy to misread.',
    signal: 'Strong candidates mention that "final results" is not just top-N by score — it includes a post-processing layer for business constraints.',
  },
]

const TT_EDGES = [
  { from: 'user_features', to: 'user_tower' },
  { from: 'item_features', to: 'item_tower' },
  { from: 'user_tower',    to: 'user_emb' },
  { from: 'item_tower',    to: 'item_emb' },
  { from: 'item_emb',      to: 'ann',       label: 'offline index build' },
  { from: 'user_emb',      to: 'ann',       label: 'online query' },
  { from: 'ann',           to: 'candidates' },
  { from: 'candidates',    to: 'ranker' },
  { from: 'ranker',        to: 'result' },
]

const TT_LAYOUT = {
  user_features: [0, 1],
  item_features: [0, 3],
  user_tower:    [1, 1],
  item_tower:    [1, 3],
  user_emb:      [2, 1],
  item_emb:      [2, 3],
  ann:           [3, 2],
  candidates:    [4, 2],
  ranker:        [5, 2],
  result:        [6, 2],
}

function TwoTowerArchitecture() {
  const [selected, setSelected] = useState(null)
  const node = TT_NODES.find(n => n.id === selected)

  const COL_W = 155
  const ROW_H = 100
  const NODE_W = 142
  const NODE_H = 56
  const PAD = 8
  const COLS = 7
  const ROWS = 5
  const SVG_W = COLS * COL_W + PAD * 2
  const SVG_H = ROWS * ROW_H + PAD * 2

  function cx(col) { return PAD + col * COL_W + NODE_W / 2 }
  function cy(row) { return PAD + row * ROW_H + NODE_H / 2 }
  function nx(col) { return PAD + col * COL_W }
  function ny(row) { return PAD + row * ROW_H }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow">
          Click any block to explore
        </div>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width={SVG_W}
            height={SVG_H}
            style={{ display: 'block', minWidth: SVG_W, maxWidth: '100%' }}
          >
            <defs>
              <marker id="tt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.25)" />
              </marker>
            </defs>

            {TT_EDGES.map((e, i) => {
              const [fc, fr] = TT_LAYOUT[e.from]
              const [tc, tr] = TT_LAYOUT[e.to]
              const x1 = cx(fc) + (tc > fc ? NODE_W / 2 : tc < fc ? -NODE_W / 2 : 0)
              const y1 = cy(fr) + (tc === fc ? (tr > fr ? NODE_H / 2 : -NODE_H / 2) : 0)
              const x2 = cx(tc) - (tc > fc ? NODE_W / 2 : tc < fc ? -NODE_W / 2 : 0)
              const y2 = cy(tr) - (tc === fc ? (tr > fr ? NODE_H / 2 : -NODE_H / 2) : 0)
              const mx = (x1 + x2) / 2
              const my = (y1 + y2) / 2
              return (
                <g key={i}>
                  <path
                    d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1.5"
                    markerEnd="url(#tt-arrow)"
                  />
                  {e.label && (
                    <text x={mx} y={my - 5} textAnchor="middle"
                      fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="var(--font-mono)">
                      {e.label}
                    </text>
                  )}
                </g>
              )
            })}

            {TT_NODES.map(n => {
              const [col, row] = TT_LAYOUT[n.id]
              const x = nx(col)
              const y = ny(row)
              const isSel = selected === n.id
              return (
                <g key={n.id} onClick={() => setSelected(isSel ? null : n.id)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={x} y={y} width={NODE_W} height={NODE_H} rx="8"
                    fill={isSel ? n.bg : 'rgba(255,255,255,0.07)'}
                    stroke={isSel ? n.color : 'rgba(255,255,255,0.1)'}
                    strokeWidth={isSel ? 2 : 1}
                  />
                  <text x={x + NODE_W / 2} y={y + 20} textAnchor="middle"
                    fill={isSel ? n.color : 'rgba(255,255,255,0.75)'}
                    fontSize="12" fontFamily="var(--font-sans)" fontWeight="600">
                    {n.label}
                  </text>
                  <text x={x + NODE_W / 2} y={y + 36} textAnchor="middle"
                    fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="var(--font-mono)">
                    {n.sub}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {node ? (
        <div style={{ padding: '20px', borderRadius: '10px', background: node.bg, border: `1px solid ${node.color}30` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '14px' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: node.color }}>{node.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ink-low)' }}>{node.sub}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {[
              { label: 'What it is',      text: node.what,      col: 'var(--ink-mid)' },
              { label: 'Key decisions',   text: node.decisions, col: 'var(--prime)' },
              { label: 'Failure modes',   text: node.failures,  col: 'var(--ink-low)' },
              { label: 'Interview signal',text: node.signal,    col: 'var(--prime)' },
            ].map(row => (
              <div key={row.label}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: row.col, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>{row.label}</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{row.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'rgba(240,165,0,0.11)', border: '1px solid rgba(240,165,0,0.15)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Key insight</div>
          <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
            Two-tower decouples user and item encoding so all item embeddings can be pre-computed offline. The online path is just one user tower forward pass + ANN lookup — that's why it scales to billions of items at sub-50ms latency.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Do We Even Need ML? ─────────────────────────────────────────────────────
const DO_WE_NEED_ML_SCENARIOS = [
  {
    id: 'dwml1',
    title: 'Churn prediction email campaign',
    context: 'A growth PM requests a churn prediction model. Users predicted as high-churn will receive a retention email. Your data team has 18 months of historical churn labels and 40 features. Training will take ~2 weeks.',
    question: 'The PM wants a churn model. The intervention is a retention email. You have 18 months of labels and 40 features — the model is buildable. But should you build it? What question do you ask before committing 2 weeks of data team time?',
    options: [
      'Yes — a trained model will identify high-churn users more precisely than rules.',
      'No — if the action is sending an email to high-churn users, send it to everyone. The incremental lift from targeting is likely smaller than the cost of building the model.',
      'Yes — but only if model AUC exceeds 0.80 on the holdout set.',
      'No — use a rules engine based on days-since-last-login and purchase frequency.',
    ],
    answer: 1,
    diagnosis: 'The counterfactual action is "send everyone the email." If the email is cheap and the churn cost is high, the ROI of precision targeting is often negative once model-building cost is included. The question is not "can we build a model?" but "does the model create more value than the baseline action?"',
    fix: 'Before scoping any ML project, ask: what is the counterfactual action if we have no model? What does the model let us do differently? If the difference in action between top-decile and bottom-decile predicted users is small, the model ROI is negative. Ship the email campaign first; add targeting only when you have signal that untargeted outreach has diminishing returns.',
  },
  {
    id: 'dwml2',
    title: 'Support ticket classifier',
    context: 'A support team of 3 agents handles ~8 tickets per day across 6 categories (billing, technical, returns, complaints, general, escalation). A PM wants an ML classifier to auto-route tickets to the right agent.',
    question: 'A PM wants a BERT classifier to auto-route support tickets across 6 categories. Volume is 8 tickets per day across 3 agents. The model is technically buildable. Do you build it?',
    options: [
      'Yes — even at low volume, a classifier eliminates manual routing overhead.',
      'Yes — train a fine-tuned BERT model; it will generalise better as volume grows.',
      'No — at 8 tickets/day, a human reads the ticket in seconds. Regex + keyword rules for the 2 common categories covers 80% of routing. ML ROI is negative at this volume.',
      'No — use a decision tree trained on ticket text, not a neural model.',
    ],
    answer: 2,
    diagnosis: 'At 8 tickets/day, a human agent routes each ticket in under 30 seconds. Building, deploying, and maintaining a text classifier takes weeks and ongoing effort. The break-even volume for ML routing is typically 500+ tickets/day where manual routing becomes the bottleneck.',
    fix: 'Apply the volume test: ML routing pays off when routing is the bottleneck, not when it is a minor inconvenience. For low-volume queues, implement keyword rules for the top-2 categories and let agents handle the rest. Revisit when volume exceeds 200 tickets/day or routing errors cause measurable SLA misses.',
  },
  {
    id: 'dwml3',
    title: 'Fraud flagging at 0.001% base rate',
    context: 'A fintech product processes 500,000 transactions per day. Historical fraud rate is 0.001% — about 5 fraudulent transactions per day. The fraud team manually reviews flagged transactions. A data scientist proposes an XGBoost fraud classifier.',
    question: '500,000 transactions per day, 5 actual frauds per day (0.001% rate), and a 3-person review team. A data scientist proposes an XGBoost classifier. Before approving the sprint, you run the precision-recall math — what does it tell you about whether this model can actually work at this base rate?',
    options: [
      'XGBoost is the wrong algorithm — neural networks handle imbalanced data better.',
      'The dataset is too small to train a reliable model.',
      'At 0.001% base rate, even a 99% precise model flags ~500 false positives per day for every 5 real frauds. The review queue is overwhelmed and the precision economics are broken.',
      'Fraud detection always requires real-time inference, which XGBoost cannot support.',
    ],
    answer: 2,
    diagnosis: 'Precision-recall economics break at extreme class imbalance. A model with 99% precision on 500k transactions flags 5,000 transactions/day as fraud — 4,995 false positives for 5 real frauds. Unless the review team can scale to 5,000 daily reviews, the model creates more work than it saves.',
    fix: 'Before building: compute the maximum tolerable false positive rate given review team capacity, then back-calculate the precision the model needs. At 0.001% base rate with a 3-person team reviewing 50 flags/day, you need >90% precision. Validate whether that precision is achievable before committing. Consider a rules engine for the highest-signal fraud patterns (impossible geolocation, known BIN ranges) as a cheaper first layer.',
  },
]

function DoWeNeedML() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Staff-Level Judgment</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Do We Even Need ML?</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          The most senior judgment call: the counterfactual test. Before scoping any ML project, decide whether a model creates more value than the baseline action. Most ML projects fail this test.
        </p>
      </div>
      <AccordionMCQ scenarios={DO_WE_NEED_ML_SCENARIOS} accentColor="var(--prime)" storageKey="sysdesign_dwml" />
    </div>
  )
}

// ─── Retrieval System Failures ────────────────────────────────────────────────
const RETRIEVAL_SCENARIOS = [
  {
    id: 'ret1',
    title: 'Two-tower embedding drift',
    context: 'A two-tower recommendation model was trained 6 months ago. Item embeddings are recomputed weekly; user embeddings are recomputed daily. Users are complaining that recommendations feel stale — items they already purchased keep appearing.',
    question: 'The two-tower model was trained 6 months ago. User embeddings refresh daily, item embeddings weekly. Users report already-purchased items keep appearing. Your embedding pipeline shows no errors and ANN index is current. What is broken in the system design?',
    options: [
      'The ANN index is using cosine similarity; switch to dot product.',
      'Item embeddings are updated weekly but user behaviour shifts faster — the embedding space mismatch means user vectors point toward item clusters that no longer reflect current inventory or user state.',
      'The model needs more negative samples during training.',
      'Daily user embedding recomputation is too frequent and causing instability.',
    ],
    answer: 1,
    diagnosis: 'Embedding drift: user embeddings are recomputed daily against a model trained 6 months ago. The embedding space has not shifted, but item inventory, pricing, and availability have. Items the user purchased are still in the same embedding cluster as items they might buy — the model cannot distinguish "already owned" from "relevant."',
    fix: 'Add a purchased-item filter as a post-retrieval exclusion layer (fastest fix). Longer-term: retrain the two-tower model more frequently, or add explicit negative feedback signals (purchases, skips) to the training data. Monitor embedding space drift with periodic random sample cosine similarity audits.',
  },
  {
    id: 'ret2',
    title: 'HNSW index staleness under writes',
    context: 'A product search system uses HNSW (Hierarchical Navigable Small World) for approximate nearest-neighbour retrieval over 2M product embeddings. New products are added daily (~500/day). Engineers report that newly added products rarely appear in search results for the first 48 hours after ingestion.',
    question: '500 new products ingested daily, but they don\'t appear in search results for 48 hours after ingestion. Embeddings compute correctly, no pipeline errors, HNSW index shows all items present. What is the structural reason HNSW fails for newly added nodes, and what is the fastest fix?',
    options: [
      'New product embeddings are lower quality because they have fewer purchase signals.',
      'HNSW graph connectivity degrades when new nodes are inserted without a full index rebuild — new items are sparsely connected and rarely reached during beam search.',
      'The embedding model was not fine-tuned on new product categories.',
      'The retrieval system is caching results for 48 hours.',
    ],
    answer: 1,
    diagnosis: 'HNSW is an approximation structure optimised for static datasets. Incremental inserts add nodes with limited graph connectivity — the new node connects to a small neighbourhood but is not back-linked from existing nodes that should point to it. Beam search rarely reaches these weakly-connected new nodes.',
    fix: 'Schedule a full HNSW index rebuild nightly (incremental inserts accumulate connectivity debt). For time-sensitive new items, add a recency-boosted brute-force fallback layer: exact-search over the last 72 hours of new products and merge results with HNSW output before re-ranking. Monitor recall@100 on a held-out new-item test set.',
  },
  {
    id: 'ret3',
    title: 'Query-document domain mismatch',
    context: [
      'A legal document search system embeds queries and documents using a general-purpose sentence-transformer (trained on web text and news). Retrieval precision is 0.41 on the legal domain benchmark.',
      'The same model achieves 0.78 precision on a general news retrieval benchmark.',
    ],
    question: 'Precision is 0.41 on legal documents but 0.78 on general news — same model, same index, same infrastructure. Legal queries use "force majeure," "indemnification," Latin terms. What does this 37-point gap tell you about where the model is failing, and what is the fix?',
    options: [
      'The HNSW index needs more ef_construction parameter tuning.',
      'Legal queries use domain-specific terminology and Latin phrases not present in the model\'s training distribution — query and document embeddings land in different regions of the embedding space for the same legal concept.',
      'The model\'s max token length is too short for long legal documents.',
      'Legal documents need TF-IDF retrieval, not dense embeddings.',
    ],
    answer: 1,
    diagnosis: 'Domain mismatch: "force majeure" in a query and "force majeure" in a document should be near-neighbours in embedding space. For a web-trained model, they may not be — the model has seen these terms in different contexts and assigns them different representations. Precision collapses when query-document vocabulary diverges from training distribution.',
    fix: 'Fine-tune the sentence transformer on legal query-document pairs using contrastive loss (positive pairs: query + relevant document; hard negatives: query + plausible-but-wrong document). Even 5,000–10,000 domain-specific pairs significantly improve in-domain precision. Evaluate on a held-out legal retrieval benchmark before and after fine-tuning.',
  },
]

function RetrievalFailures() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div className="section-eyebrow" style={{ marginBottom: '6px' }}>Production Debugging</div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 800, color: 'var(--ink-hi)', letterSpacing: '-0.03em', margin: '0 0 8px' }}>Retrieval System Failures</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--ink-mid)', lineHeight: 1.65, maxWidth: '560px', margin: 0 }}>
          Your embedding similarity returns results that are semantically plausible but contextually wrong. Diagnose the real failure: embedding drift, index staleness, or domain mismatch.
        </p>
      </div>
      <AccordionMCQ scenarios={RETRIEVAL_SCENARIOS} accentColor="var(--prime)" storageKey="sysdesign_retrieval" />
    </div>
  )
}

// ─── Tab shell ────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'incident',   label: 'ML Incident Room',    component: IncidentRoom },
  { id: 'ownership',  label: 'DS Ownership Chain',  component: DSOwnershipChain },
  { id: 'scenarios',  label: 'Incident Scenarios',  component: IncidentScenarios },
  { id: 'canvas',     label: 'Design Review',        component: DesignCanvas },
  { id: 'two_tower',  label: 'Two-Tower Explorer',   component: TwoTowerExplorer },
  { id: 'serving',    label: 'Serving Tradeoffs',    component: ServingTradeoffLab },
  { id: 'rag',        label: 'RAG Architecture',     component: RAGArchitecture },
  { id: 'two_tower_arch', label: 'Two-Tower Diagram', component: TwoTowerArchitecture },
  { id: 'do_we_need_ml', label: 'Do We Need ML?', component: DoWeNeedML },
  { id: 'retrieval_failures', label: 'Retrieval Failures', component: RetrievalFailures },
]

// ── Coming Soon ───────────────────────────────────────────────────────────────
// devBrief fields are internal build guidance only — not rendered to users.
const COMING_SOON = []


function ForwardPointer({ label, tab, onNavigate, accent = 'var(--ink-low)' }) {
  return (
    <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
      <button
        onClick={() => onNavigate(tab)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <span style={{ fontSize: '12px', color: accent, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '12px', color: accent }}>→</span>
      </button>
    </div>
  )
}

export default function SystemDesignTab({ onNavigate }) {
  const [active, setActive] = useState('incident')
  const [, forceUpdate] = useState(0)
  const ActiveModule = MODULES.find(m => m.id === active)?.component ?? IncidentRoom

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ML System Design</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '580px' }}>
          Production judgment for ML systems — rec system design, deployment failures, ownership decisions, and the tradeoffs that separate junior from staff-level thinking.
        </p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: '6px 0 0', fontFamily: 'var(--font-sans)' }}>Each module opens with a production scenario. Pick your answer — then see what breaks in production and why every wrong option fails.</p>
      </div>

      {/* Module tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {MODULES.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button onClick={() => setActive(m.id)} className={`sub-tab ${active === m.id ? 'active' : 'inactive'}`} style={{ paddingRight: '8px' }}>{m.label}</button>
            <button onClick={(e) => { e.stopPropagation(); toggleBookmark('sysdesign', m.id, m.label); forceUpdate(n => n+1) }}
              title={isBookmarked('sysdesign', m.id) ? 'Remove bookmark' : 'Bookmark module'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontSize: '12px', color: isBookmarked('sysdesign', m.id) ? 'var(--prime)' : 'var(--ink-ghost)', lineHeight: 1 }}>
              {isBookmarked('sysdesign', m.id) ? <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M2 0.5h8a1 1 0 011 1v11.25l-5-2.917-5 2.917V1.5a1 1 0 011-1z"/></svg> : <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M2 1h8a.5.5 0 01.5.5v11L6 9.75 1.5 12.5V1.5A.5.5 0 012 1z"/></svg>}
            </button>
          </div>
        ))}
      </div>

      <div key={active} className="tab-enter"><ActiveModule /></div>
      {onNavigate && <ForwardPointer label="Test this domain in Combinator" tab="combinator" onNavigate={onNavigate} accent="var(--prime)" />}
      {/* ── Coming Soon ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '48px' }}>
        <div className="eyebrow" style={{ marginBottom: '12px' }}>What's building</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {COMING_SOON.map(m => (
            <div key={m.label} className="card" style={{ padding: '16px', opacity: 0.65, borderLeft: '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--ink-mid)' }}>{m.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'rgba(255,255,255,0.07)', color: 'var(--ink-ghost)', borderRadius: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>soon</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.userBrief}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
