import { useState, useRef } from 'react'

// ─── MCQ Bank ────────────────────────────────────────────────────────────────

const ALL_QUESTIONS = [
  // Feature Engineering
  {
    id: 1, domain: 'Feature Engineering',
    q: 'Which of the following best prevents target leakage in a feature pipeline?',
    options: [
      'Normalizing features after train/test split',
      'Computing rolling statistics using only past data relative to the label timestamp',
      'One-hot encoding categorical variables',
      'Removing features with >50% null rate',
    ],
    correct: 1,
    explanation: 'Target leakage occurs when features incorporate information from the future. Using only past data for rolling statistics ensures no future signal contaminates training.',
  },
  {
    id: 2, domain: 'Feature Engineering',
    q: 'A categorical feature has 10,000 unique values. Which encoding strategy is most appropriate for a gradient boosted tree?',
    options: [
      'One-hot encoding',
      'Target encoding with cross-validation',
      'Label encoding with random assignment',
      'Dropping the feature',
    ],
    correct: 1,
    explanation: 'Target encoding maps categories to their mean target value. Cross-validation folding prevents leakage. OHE creates 10k sparse dimensions; GBTs handle target encoding well.',
  },
  {
    id: 3, domain: 'Feature Engineering',
    q: 'You have a feature with distribution shift between train and production. PSI = 0.35. What action do you take?',
    options: [
      'Ignore — PSI below 0.5 is acceptable',
      'Retrain the model immediately',
      'Investigate root cause, consider feature removal or recalibration',
      'Add the feature to the monitoring dashboard only',
    ],
    correct: 2,
    explanation: 'PSI >0.25 indicates significant shift. Investigate: data pipeline changes, upstream schema drift. Options: remove feature, apply transformation, retrain. Monitoring alone is insufficient.',
  },
  // Model Evaluation
  {
    id: 4, domain: 'Model Evaluation',
    q: 'AUC-ROC is 0.95 on test set but precision at top 1% is only 0.12. What does this suggest?',
    options: [
      'The model is excellent across all thresholds',
      'Class imbalance makes AUC misleading; precision-recall metrics are more informative',
      'The test set is too small',
      'The model has high recall but low specificity',
    ],
    correct: 1,
    explanation: 'With severe class imbalance, AUC can be inflated by easy negatives. Precision-recall AUC and precision@K are more relevant for top-K prediction tasks.',
  },
  {
    id: 5, domain: 'Model Evaluation',
    q: "You're tuning a fraud model. A false negative costs $500, a false positive costs $5. How do you set the classification threshold?",
    options: [
      'Maximize F1 score',
      'Use the default 0.5 threshold',
      'Lower the threshold to increase recall, weighted by cost ratio',
      'Maximize AUC-ROC',
    ],
    correct: 2,
    explanation: 'Cost-sensitive threshold: set threshold where expected cost is minimized. FN cost 100x FP means we should recall aggressively. Lower threshold = higher recall = fewer costly FN.',
  },
  {
    id: 6, domain: 'Model Evaluation',
    q: 'What is the primary risk of using accuracy as the sole metric for a dataset with 99% negative class?',
    options: [
      'It over-penalizes false positives',
      'A model predicting all negatives achieves 99% accuracy with zero predictive value',
      'It ignores the AUC score',
      'It makes cross-validation unreliable',
    ],
    correct: 1,
    explanation: 'With 99% negative class, a trivial classifier gets 99% accuracy. Use precision, recall, F1, or AUC-PR which are insensitive to class imbalance.',
  },
  // ML Systems
  {
    id: 7, domain: 'ML Systems',
    q: 'A model trained monthly shows degraded performance in week 3. Which monitoring signal would detect this earliest?',
    options: [
      'Model accuracy on a holdout set',
      'Input feature distribution shift (PSI)',
      'Prediction score distribution shift',
      'Business metric (CTR) drop',
    ],
    correct: 2,
    explanation: "Prediction score distribution shifts before business metrics degrade, with no label delay. Feature PSI is also early but doesn't capture model behavior directly.",
  },
  {
    id: 8, domain: 'ML Systems',
    q: 'What is the primary advantage of a two-phase serving architecture (retrieval + ranking)?',
    options: [
      'Reduces model training time',
      'Allows end-to-end gradient flow',
      'Enables candidate pruning from millions to hundreds before expensive ranking',
      'Eliminates the need for feature stores',
    ],
    correct: 2,
    explanation: 'Retrieval (ANN/heuristics) narrows from O(millions) to O(hundreds) at low cost. Ranker then applies expensive features only to candidates. This is the standard RecSys architecture.',
  },
  {
    id: 9, domain: 'ML Systems',
    q: 'Your batch prediction pipeline must complete within 2 hours for 100M users. Spark job takes 6 hours. What is your first optimization?',
    options: [
      'Switch to a larger instance type',
      'Increase the number of output partitions',
      'Investigate data skew — hot keys cause stragglers',
      'Cache the model weights in broadcast variable',
    ],
    correct: 2,
    explanation: 'In distributed systems, 80% of slowdowns come from skew. A few hot keys (e.g., superusers) overwhelm specific partitions. Salt the join key or repartition by user cohort.',
  },
  // Statistics & Probability
  {
    id: 10, domain: 'Statistics & Probability',
    q: 'You run 20 A/B tests simultaneously. How many would you expect to show p<0.05 by chance?',
    options: ['0', '1', '5', '10'],
    correct: 1,
    explanation: 'With α=0.05 and 20 independent tests, expected false positives = 0.05 × 20 = 1. Apply Bonferroni correction (α/20 = 0.0025) or Benjamini-Hochberg FDR control.',
  },
  {
    id: 11, domain: 'Statistics & Probability',
    q: 'Which distribution best models the time between user events in a recommendation system?',
    options: ['Normal', 'Binomial', 'Exponential', 'Uniform'],
    correct: 2,
    explanation: 'Inter-arrival times for Poisson processes follow an exponential distribution. User events (clicks, purchases) are often modeled as Poisson processes, making exponential the natural choice.',
  },
  {
    id: 12, domain: 'Statistics & Probability',
    q: 'A bootstrap confidence interval for mean session duration is [4.2, 4.8] minutes. What does this mean?',
    options: [
      '95% of sessions are between 4.2 and 4.8 minutes',
      'The true mean is definitely in [4.2, 4.8]',
      'If we repeated this sampling procedure many times, 95% of resulting CIs would contain the true mean',
      'There is a 5% chance the mean is exactly 4.5 minutes',
    ],
    correct: 2,
    explanation: 'Frequentist confidence intervals: the procedure produces intervals that contain the true parameter 95% of the time across repeated samples. This specific interval may or may not contain the truth.',
  },
  // Deep Learning
  {
    id: 13, domain: 'Deep Learning',
    q: 'Gradient vanishing in a deep network is most effectively addressed by:',
    options: [
      'Increasing learning rate',
      'Using sigmoid activations throughout',
      'Residual connections (skip connections)',
      'Reducing batch size',
    ],
    correct: 2,
    explanation: 'Residual connections (ResNet-style) allow gradients to flow directly through skip paths, bypassing saturating nonlinearities. Batch normalization also helps. Sigmoid worsens vanishing.',
  },
  {
    id: 14, domain: 'Deep Learning',
    q: 'Why is layer normalization preferred over batch normalization in transformer architectures?',
    options: [
      'LayerNorm is computationally cheaper',
      'BatchNorm requires large batch sizes and is unstable with variable sequence lengths',
      'LayerNorm uses fewer parameters',
      "BatchNorm doesn't work with attention",
    ],
    correct: 1,
    explanation: 'BatchNorm normalizes across the batch dimension — problematic for variable-length sequences and small batches (e.g., in autoregressive decoding). LayerNorm normalizes across feature dim, independent of batch.',
  },
  {
    id: 15, domain: 'Deep Learning',
    q: 'What is the purpose of the temperature parameter in softmax for knowledge distillation?',
    options: [
      'Prevent overfitting to hard labels',
      'Soften probability distributions to expose more information in non-top class probabilities',
      'Speed up convergence during training',
      'Reduce memory usage during inference',
    ],
    correct: 1,
    explanation: "High temperature T flattens the teacher's output distribution, revealing relative similarities between classes (dark knowledge). Student learns richer structure than from one-hot hard labels.",
  },
  // MLOps
  {
    id: 16, domain: 'MLOps',
    q: 'Which deployment strategy allows you to gradually shift traffic to a new model while monitoring metrics?',
    options: [
      'Blue-green deployment',
      'Shadow deployment',
      'Canary deployment',
      'Rolling restart',
    ],
    correct: 2,
    explanation: "Canary: route X% of traffic to new model, monitor metrics, gradually increase %. Blue-green: instant switch (less gradual). Shadow: new model runs but responses aren't served (no user impact).",
  },
  {
    id: 17, domain: 'MLOps',
    q: 'Your CI/CD pipeline for ML models should include which validation step before production promotion?',
    options: [
      'Unit tests for feature transformations only',
      'Manual review by a senior engineer',
      'Offline evaluation against a holdout set + statistical comparison to current production model',
      'Load testing only',
    ],
    correct: 2,
    explanation: 'Champion-challenger comparison: new model must beat production on held-out data with statistical significance. Plus: data validation, integration tests, latency benchmarks.',
  },
  {
    id: 18, domain: 'MLOps',
    q: 'What is concept drift in production ML?',
    options: [
      "The model's weights drift due to floating point errors",
      'The relationship between input features and target variable changes over time',
      'Training data becomes unavailable',
      'API endpoints change breaking client calls',
    ],
    correct: 1,
    explanation: 'Concept drift: P(Y|X) changes. E.g., user behavior patterns shift post-COVID. Distinct from covariate drift (P(X) changes). Requires model retraining, not just recalibration.',
  },
  // Ranking & Retrieval
  {
    id: 19, domain: 'Ranking & Retrieval',
    q: 'NDCG@10 measures:',
    options: [
      'The number of relevant documents in top 10',
      'Discounted cumulative gain normalized by ideal ordering, capturing position-weighted relevance',
      'Precision at rank 10',
      'The ratio of relevant to irrelevant items',
    ],
    correct: 1,
    explanation: 'NDCG@K = DCG@K / IDCG@K. DCG discounts relevance by log2(rank+1), rewarding top-ranked relevant items. Normalized by ideal DCG enables comparison across queries.',
  },
  {
    id: 20, domain: 'Ranking & Retrieval',
    q: 'Approximate Nearest Neighbor (ANN) search trades off:',
    options: [
      'Model quality vs. training speed',
      'Recall vs. query latency/memory',
      'Precision vs. NDCG',
      'Batch size vs. embedding dimension',
    ],
    correct: 1,
    explanation: 'ANN algorithms (HNSW, IVF-PQ) reduce exact search cost by trading recall. HNSW: high recall, high memory. IVF-PQ: lower memory via quantization, slightly lower recall. Tune ef_search for recall/latency tradeoff.',
  },
  {
    id: 21, domain: 'Ranking & Retrieval',
    q: 'In learning-to-rank, listwise approaches differ from pointwise approaches in that:',
    options: [
      'Listwise uses more training data',
      'Listwise optimizes a list-level metric (e.g., NDCG) directly rather than individual document scores',
      'Listwise is faster to train',
      'Listwise requires no negative examples',
    ],
    correct: 1,
    explanation: 'Pointwise: regress/classify each item independently. Pairwise: compare item pairs. Listwise: optimize the whole list ordering (e.g., LambdaMART optimizes NDCG directly). Listwise best aligns with ranking metrics.',
  },
  // Experiment Design
  {
    id: 22, domain: 'Experiment Design',
    q: 'CUPED (Controlled-experiment Using Pre-Experiment Data) primarily reduces:',
    options: [
      'Bias in treatment effect estimates',
      'Variance in the outcome metric, enabling smaller sample sizes',
      'The probability of Type I errors',
      'Experiment duration',
    ],
    correct: 1,
    explanation: 'CUPED uses pre-experiment covariate (e.g., pre-period metric) to reduce residual variance: Y_cuped = Y - θ·X_pre. Same expected value, lower variance → smaller MDE → shorter experiments.',
  },
  {
    id: 23, domain: 'Experiment Design',
    q: 'An experiment shows significant lift on engagement but a drop in revenue. How do you decide?',
    options: [
      'Ship — engagement outweighs revenue',
      'Kill — revenue is more important',
      'Analyze the tradeoff using a composite metric or OEC (Overall Evaluation Criterion)',
      'Run the experiment longer',
    ],
    correct: 2,
    explanation: 'Conflicting metrics require pre-defined OEC or guardrail thresholds. Define: engagement is a primary metric, revenue is a guardrail. If guardrail is violated, do not ship regardless of primary metric lift.',
  },
  {
    id: 24, domain: 'Experiment Design',
    q: 'What is a switchback experiment and when is it appropriate?',
    options: [
      'An experiment where users switch between A and B repeatedly',
      'A time-series experiment where treatment alternates across time periods, appropriate when geographic/user randomization is infeasible',
      'An experiment with automatic winner selection',
      'A multi-armed bandit with switching costs',
    ],
    correct: 1,
    explanation: 'Switchback: used in marketplace settings (e.g., Uber surge pricing) where all users in a market must receive the same treatment. Alternate treatment/control by time window, account for carryover effects.',
  },
  // SQL & Data
  {
    id: 25, domain: 'SQL & Data',
    q: 'Which window function calculates a running total?',
    options: [
      'GROUP BY with SUM',
      'SUM() OVER (ORDER BY date ROWS UNBOUNDED PRECEDING)',
      'CUMSUM() aggregation',
      'PARTITION BY date',
    ],
    correct: 1,
    explanation: 'Window functions with ROWS UNBOUNDED PRECEDING compute cumulative aggregates without collapsing rows. PARTITION BY resets the running total per group.',
  },
  {
    id: 26, domain: 'SQL & Data',
    q: 'You need to find users who made a purchase within 7 days of their first visit. Most efficient approach?',
    options: [
      'Self-join on user_id with date difference filter',
      'Correlated subquery for each user',
      'Full table scan with WHERE clause',
      'CROSS JOIN all visits and purchases',
    ],
    correct: 0,
    explanation: 'Self-join: JOIN first_visit_table ON user_id AND purchase_date BETWEEN first_visit_date AND first_visit_date+7. Use indexed columns. Correlated subquery is O(N²).',
  },
  {
    id: 27, domain: 'SQL & Data',
    q: 'A query with SELECT DISTINCT on 100M rows is slow. Best optimization strategy?',
    options: [
      'Add more ORDER BY clauses',
      'Use GROUP BY instead (often better optimized by query planners)',
      'Increase memory allocation',
      'Switch to a subquery',
    ],
    correct: 1,
    explanation: 'GROUP BY can be better optimized than DISTINCT in many query planners (e.g., hash aggregation vs. sort-based dedup). Also consider: is DISTINCT truly needed? Can you filter earlier?',
  },
  // Optimization
  {
    id: 28, domain: 'Optimization',
    q: 'Adam optimizer vs. SGD with momentum: when is SGD preferred?',
    options: [
      'Always — Adam is obsolete',
      'When training very large transformers',
      'When generalization is critical — SGD often finds flatter minima that generalize better',
      'When training speed is the priority',
    ],
    correct: 2,
    explanation: 'Adam converges faster but often to sharper minima (higher test loss). SGD+momentum with learning rate warmup and cosine decay finds flatter minima. Many production models use SGD for final training after Adam warmup.',
  },
  {
    id: 29, domain: 'Optimization',
    q: 'What is gradient clipping and why is it used in RNN/transformer training?',
    options: [
      'Removing gradients below a threshold to speed up training',
      'Capping gradient norms to prevent exploding gradients from destabilizing training',
      'Zeroing gradients for specific layers during fine-tuning',
      'A regularization technique to prevent overfitting',
    ],
    correct: 1,
    explanation: 'Exploding gradients (common in RNNs, transformers on long sequences) cause parameter updates to diverge. Clip by global norm: scale all gradients uniformly when ||g|| > threshold.',
  },
  {
    id: 30, domain: 'Optimization',
    q: 'Learning rate warmup in transformer training serves what purpose?',
    options: [
      'Prevents the model from memorizing early training examples',
      'Stabilizes training in early steps when weight initialization produces high-variance gradients',
      'Reduces the total number of training steps needed',
      'Prevents catastrophic forgetting',
    ],
    correct: 1,
    explanation: 'At initialization, weights are random and gradients are noisy. High LR early → large unstable updates. Warmup starts with tiny LR, increases linearly. Prevents early divergence, especially with Adam.',
  },
]

const ALL_DOMAINS = [
  'Feature Engineering', 'Model Evaluation', 'ML Systems',
  'Statistics & Probability', 'Deep Learning', 'MLOps',
  'Ranking & Retrieval', 'Experiment Design', 'SQL & Data', 'Optimization',
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Setup Screen ────────────────────────────────────────────────────────────

function SetupScreen({ onStart }) {
  const [selectedDomains, setSelectedDomains] = useState(new Set(ALL_DOMAINS))
  const [count, setCount] = useState('10')

  function toggleDomain(d) {
    setSelectedDomains(prev => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  function handleStart() {
    const pool = shuffle(ALL_QUESTIONS.filter(q => selectedDomains.has(q.domain)))
    const final = count === 'All' ? pool : pool.slice(0, parseInt(count))
    if (final.length === 0) return
    onStart(final)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--prime)', margin: 0 }}>
          ML Trainer
        </h1>
        <p style={{ color: 'var(--ink-mid)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
          Sharpen your ML interview skills with targeted MCQ drills.
        </p>
      </div>

      {/* Domain selector */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--ink-hi)', fontSize: '0.95rem' }}>Domains</span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setSelectedDomains(new Set(ALL_DOMAINS))}
              style={{ background: 'none', border: 'none', color: 'var(--sky)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
            >Select all</button>
            <button
              onClick={() => setSelectedDomains(new Set())}
              style={{ background: 'none', border: 'none', color: 'var(--ink-low)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
            >Clear</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
          {ALL_DOMAINS.map(d => {
            const checked = selectedDomains.has(d)
            return (
              <label key={d} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0.75rem', borderRadius: 8, cursor: 'pointer',
                background: checked ? 'rgba(240,165,0,0.1)' : 'var(--depth)',
                border: `1px solid ${checked ? 'var(--prime)' : 'var(--rim)'}`,
                transition: 'all 0.15s',
              }}>
                <input
                  type="checkbox" checked={checked}
                  onChange={() => toggleDomain(d)}
                  style={{ accentColor: 'var(--prime)', width: 15, height: 15 }}
                />
                <span style={{ fontSize: '0.85rem', color: checked ? 'var(--ink-hi)' : 'var(--ink-mid)' }}>{d}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Count selector */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '2rem',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--ink-hi)', fontSize: '0.95rem', display: 'block', marginBottom: '0.75rem' }}>
          Question Count
        </span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['10', '20', 'All'].map(opt => {
            const active = count === opt
            return (
              <label key={opt} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1.25rem', borderRadius: 8, cursor: 'pointer',
                background: active ? 'rgba(240,165,0,0.15)' : 'var(--depth)',
                border: `1px solid ${active ? 'var(--prime)' : 'var(--rim)'}`,
                transition: 'all 0.15s',
              }}>
                <input type="radio" name="count" value={opt} checked={active}
                  onChange={() => setCount(opt)}
                  style={{ accentColor: 'var(--prime)' }}
                />
                <span style={{ fontSize: '0.9rem', color: active ? 'var(--prime)' : 'var(--ink-mid)', fontWeight: active ? 600 : 400 }}>{opt}</span>
              </label>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={selectedDomains.size === 0}
        style={{
          background: selectedDomains.size === 0 ? 'var(--rim)' : 'var(--prime)',
          color: selectedDomains.size === 0 ? 'var(--ink-ghost)' : 'var(--void)',
          border: 'none', borderRadius: 10, padding: '0.85rem 2.5rem',
          fontSize: '1rem', fontWeight: 700, cursor: selectedDomains.size === 0 ? 'not-allowed' : 'pointer',
          fontFamily: "'Space Grotesk', sans-serif",
          transition: 'all 0.15s',
        }}
      >
        Start Drill
      </button>
    </div>
  )
}

// ─── Drill Screen ────────────────────────────────────────────────────────────

const DOMAIN_COLORS = {
  'Feature Engineering': 'var(--sky)',
  'Model Evaluation': 'var(--mint)',
  'ML Systems': 'var(--violet)',
  'Statistics & Probability': 'var(--prime)',
  'Deep Learning': 'var(--ember)',
  'MLOps': 'var(--rose)',
  'Ranking & Retrieval': 'var(--sky)',
  'Experiment Design': 'var(--mint)',
  'SQL & Data': 'var(--prime)',
  'Optimization': 'var(--violet)',
}

function DrillScreen({ questions, onFinish, onAbort }) {
  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState(null) // index of chosen option or null
  const [score, setScore] = useState(0)
  // domainStats: { domain: { correct, total } }
  const [domainStats, setDomainStats] = useState({})
  // Refs to always hold latest values for the finish handler
  const scoreRef = useRef(0)
  const domainStatsRef = useRef({})

  const q = questions[idx]
  const total = questions.length
  const isCorrect = answered !== null && answered === q.correct
  const domainColor = DOMAIN_COLORS[q.domain] || 'var(--prime)'

  function handleAnswer(optIdx) {
    if (answered !== null) return
    setAnswered(optIdx)
    const correct = optIdx === q.correct
    const newScore = score + (correct ? 1 : 0)
    if (correct) setScore(newScore)
    scoreRef.current = newScore
    const newDomainStats = {
      ...domainStatsRef.current,
      [q.domain]: {
        correct: (domainStatsRef.current[q.domain]?.correct || 0) + (correct ? 1 : 0),
        total: (domainStatsRef.current[q.domain]?.total || 0) + 1,
      },
    }
    domainStatsRef.current = newDomainStats
    setDomainStats(newDomainStats)
  }

  function handleNextFixed() {
    if (idx + 1 >= total) {
      onFinish(scoreRef.current, domainStatsRef.current, questions)
      return
    }
    setIdx(i => i + 1)
    setAnswered(null)
  }

  function optionStyle(optIdx) {
    const base = {
      width: '100%', textAlign: 'left', padding: '0.85rem 1.1rem',
      borderRadius: 10, fontSize: '0.95rem', cursor: answered !== null ? 'default' : 'pointer',
      fontFamily: "'Space Grotesk', sans-serif",
      border: '1px solid var(--rim)',
      background: 'var(--depth)',
      color: 'var(--ink-hi)',
      transition: 'all 0.2s',
    }
    if (answered === null) return { ...base, cursor: 'pointer' }
    if (optIdx === q.correct) return { ...base, background: 'rgba(52,211,153,0.15)', borderColor: 'var(--mint)', color: 'var(--mint)' }
    if (optIdx === answered && answered !== q.correct) return { ...base, background: 'rgba(244,63,94,0.15)', borderColor: 'var(--rose)', color: 'var(--rose)' }
    return { ...base, opacity: 0.45 }
  }

  const progressPct = ((idx) / total) * 100

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button
          onClick={onAbort}
          style={{
            background: 'none', border: '1px solid var(--rim)', borderRadius: 8,
            color: 'var(--ink-low)', cursor: 'pointer', fontSize: '0.8rem',
            padding: '0.35rem 0.85rem', fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          Abort
        </button>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem',
          color: 'var(--mint)', fontWeight: 600,
        }}>
          {score} / {idx + (answered !== null ? 1 : 0)} correct
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--rim)', borderRadius: 99, height: 6, marginBottom: '0.5rem' }}>
        <div style={{
          width: `${progressPct}%`, height: '100%', borderRadius: 99,
          background: 'var(--prime)', transition: 'width 0.3s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          Question {idx + 1} of {total}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-ghost)' }}>
          {Math.round(progressPct)}%
        </span>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 14, padding: '1.75rem',
      }}>
        {/* Domain badge */}
        <span style={{
          display: 'inline-block', padding: '0.3rem 0.8rem',
          borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
          background: `${domainColor}20`, color: domainColor,
          border: `1px solid ${domainColor}50`,
          marginBottom: '1.1rem',
        }}>
          {q.domain}
        </span>

        {/* Question */}
        <p style={{
          fontSize: '1.08rem', fontWeight: 700, color: 'var(--ink-hi)',
          lineHeight: 1.55, marginBottom: '1.5rem', marginTop: 0,
        }}>
          {q.q}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {q.options.map((opt, i) => (
            <button key={i} style={optionStyle(i)} onClick={() => handleAnswer(i)}>
              <span style={{
                display: 'inline-block', width: 22, height: 22, lineHeight: '22px',
                textAlign: 'center', borderRadius: '50%', marginRight: '0.75rem',
                background: 'var(--rim)', fontSize: '0.78rem', fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {answered !== null && (
          <div style={{
            marginTop: '1.25rem', padding: '1rem 1.1rem',
            background: isCorrect ? 'rgba(52,211,153,0.08)' : 'rgba(244,63,94,0.08)',
            border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)'}`,
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1rem' }}>{isCorrect ? '✓' : '✗'}</span>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700,
                color: isCorrect ? 'var(--mint)' : 'var(--rose)',
              }}>
                {isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.6 }}>
              {q.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Next button */}
      {answered !== null && (
        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button
            onClick={handleNextFixed}
            style={{
              background: 'var(--prime)', color: 'var(--void)',
              border: 'none', borderRadius: 10, padding: '0.75rem 2rem',
              fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {idx + 1 >= total ? 'See Results' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Results Screen ──────────────────────────────────────────────────────────

function ResultsScreen({ score, total, domainStats, onDrillAgain, onNewSession }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0

  const scoreColor = pct >= 80 ? 'var(--mint)' : pct >= 60 ? 'var(--prime)' : 'var(--rose)'

  // All domains that appeared
  const domains = Object.keys(domainStats)

  // Sort by accuracy ascending (weakest first)
  const sortedDomains = [...domains].sort((a, b) => {
    const accA = domainStats[a].total > 0 ? domainStats[a].correct / domainStats[a].total : 0
    const accB = domainStats[b].total > 0 ? domainStats[b].correct / domainStats[b].total : 0
    return accA - accB
  })

  function domainBarColor(acc) {
    if (acc >= 0.8) return 'var(--mint)'
    if (acc >= 0.5) return 'var(--prime)'
    return 'var(--rose)'
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink-hi)', margin: 0, marginBottom: '0.35rem' }}>
          Session Complete
        </h2>
        <p style={{ color: 'var(--ink-mid)', fontSize: '0.9rem', margin: 0 }}>
          Here is how you did
        </p>
      </div>

      {/* Big score */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--rim)',
        borderRadius: 16, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: scoreColor, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
          {score} / {total}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 600, color: scoreColor, marginTop: '0.5rem' }}>
          {pct}%
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--ink-low)', marginTop: '0.35rem' }}>
          {pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort — keep drilling the weak spots.' : 'Keep practicing — review the explanations.'}
        </div>
      </div>

      {/* Focus Areas (weakness heatmap) */}
      {sortedDomains.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--rim)',
          borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Focus Areas
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sortedDomains.map(d => {
              const { correct, total: dtotal } = domainStats[d]
              const acc = dtotal > 0 ? correct / dtotal : 0
              const barColor = domainBarColor(acc)
              const domainColor = DOMAIN_COLORS[d] || 'var(--prime)'
              return (
                <div key={d}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-mid)' }}>{d}</span>
                    <span style={{
                      fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace",
                      color: barColor, fontWeight: 600,
                    }}>
                      {correct}/{dtotal} ({Math.round(acc * 100)}%)
                    </span>
                  </div>
                  <div style={{ background: 'var(--rim)', borderRadius: 99, height: 7 }}>
                    <div style={{
                      width: `${acc * 100}%`, height: '100%', borderRadius: 99,
                      background: barColor, transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-domain breakdown (all domains sorted by name) */}
      {domains.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--rim)',
          borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '2rem',
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-hi)', margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Domain Breakdown
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
            {[...domains].sort().map(d => {
              const { correct, total: dtotal } = domainStats[d]
              const acc = dtotal > 0 ? correct / dtotal : 0
              const barColor = domainBarColor(acc)
              return (
                <div key={d} style={{
                  background: 'var(--depth)', border: '1px solid var(--rim)',
                  borderRadius: 10, padding: '0.75rem',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-low)', marginBottom: '0.35rem' }}>{d}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: barColor, fontFamily: "'JetBrains Mono', monospace" }}>
                    {correct}/{dtotal}
                  </div>
                  <div style={{ background: 'var(--rim)', borderRadius: 99, height: 4, marginTop: '0.4rem' }}>
                    <div style={{ width: `${acc * 100}%`, height: '100%', borderRadius: 99, background: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={onDrillAgain}
          style={{
            background: 'var(--prime)', color: 'var(--void)',
            border: 'none', borderRadius: 10, padding: '0.8rem 1.75rem',
            fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          Drill Again
        </button>
        <button
          onClick={onNewSession}
          style={{
            background: 'none', color: 'var(--ink-mid)',
            border: '1px solid var(--rim)', borderRadius: 10, padding: '0.8rem 1.75rem',
            fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          New Session
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TrainerTab() {
  const [screen, setScreen] = useState('setup') // 'setup' | 'drill' | 'results'
  const [questions, setQuestions] = useState([])
  const [results, setResults] = useState(null) // { score, total, domainStats }
  const [lastQuestions, setLastQuestions] = useState([])

  function handleStart(qs) {
    setQuestions(qs)
    setLastQuestions(qs)
    setResults(null)
    setScreen('drill')
  }

  function handleFinish(score, domainStats, qs) {
    const total = qs.length

    // Build domain breakdown for storage
    const domainBreakdown = Object.entries(domainStats).map(([domain, s]) => ({
      domain, correct: s.correct, total: s.total,
    }))

    // Save to localStorage
    try {
      const history = JSON.parse(localStorage.getItem('msl_trainer_history') || '[]')
      history.push({
        date: new Date().toISOString(),
        score,
        total,
        domainBreakdown,
      })
      localStorage.setItem('msl_trainer_history', JSON.stringify(history))
    } catch (_) {}

    setResults({ score, total, domainStats })
    setScreen('results')
  }

  function handleDrillAgain() {
    // Re-shuffle the same config
    setQuestions(shuffle(lastQuestions))
    setResults(null)
    setScreen('drill')
  }

  function handleNewSession() {
    setScreen('setup')
    setResults(null)
  }

  return (
    <div style={{
      minHeight: '100%',
      background: 'var(--void)',
      color: 'var(--ink-hi)',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {screen === 'setup' && (
        <SetupScreen onStart={handleStart} />
      )}
      {screen === 'drill' && (
        <DrillScreen
          questions={questions}
          onFinish={handleFinish}
          onAbort={() => setScreen('setup')}
        />
      )}
      {screen === 'results' && results && (
        <ResultsScreen
          score={results.score}
          total={results.total}
          domainStats={results.domainStats}
          onDrillAgain={handleDrillAgain}
          onNewSession={handleNewSession}
        />
      )}
    </div>
  )
}
