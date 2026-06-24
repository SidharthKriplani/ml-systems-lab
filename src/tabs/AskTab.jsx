import { useState, useRef, useEffect } from 'react'
import { searchContent } from '../data/searchIndex.js'

// "Jump to in the app" strip — content-search results (borrowed from the retired GlobalSearch).
function NavStrip({ nav, onNavigate }) {
  return (
    <div style={{ borderTop: '1px solid var(--rim)', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Jump to in the app</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {nav.map((it, i) => (
          <button key={it.id + '-' + i} onClick={() => onNavigate(it.tab)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
              background: 'rgba(212,175,55,0.08)', border: '1px solid var(--rim)', color: 'var(--ink-mid)', fontSize: 12, fontFamily: 'var(--font-sans)' }}>
            <span>{it.icon}</span><span style={{ color: 'var(--prime)', fontWeight: 500 }}>{it.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Knowledge Base ─────────────────────────────────────────────────────────────
const KB = [
  // ML Fundamentals
  {
    id: 'overfitting', cat: 'ML Fundamentals',
    keywords: ['overfitting','overfit','high variance','generalization','train test gap'],
    q: 'What is overfitting and how do I diagnose it?',
    a: 'Overfitting occurs when a model memorizes training data including noise, leading to low training error but high validation/test error. Diagnose by comparing train vs validation loss curves — if training loss keeps decreasing while validation loss plateaus or rises, you\'re overfitting.\n\nFixes: more training data, dropout, L1/L2 regularization, reducing model capacity, early stopping, cross-validation.',
    links: [{ tab: 'models', label: 'Regularization Lab' }, { tab: 'classical', label: 'Model Failure Zoo' }],
  },
  {
    id: 'bias_variance', cat: 'ML Fundamentals',
    keywords: ['bias','variance','bias-variance','underfitting','high bias','tradeoff'],
    q: 'What is the bias-variance tradeoff?',
    a: 'Bias = error from wrong assumptions (underfitting — model too simple). Variance = sensitivity to training fluctuations (overfitting — model too complex). Total error ≈ Bias² + Variance + Irreducible Noise.\n\nHigh bias: bad train AND test. Fix: more complex model, more features.\nHigh variance: good train, bad test. Fix: regularization, more data, simpler model.\n\nBagging (Random Forest) reduces variance. Boosting reduces bias.',
    links: [{ tab: 'models', label: 'Regularization Lab' }, { tab: 'classical', label: 'Ensemble Lab' }],
  },
  {
    id: 'regularization', cat: 'ML Fundamentals',
    keywords: ['regularization','l1','l2','lasso','ridge','elasticnet','weight decay'],
    q: 'When should I use L1 vs L2 regularization?',
    a: 'L1 (Lasso): adds |w| penalty. Produces sparse models — drives weak features to exactly zero. Use when you suspect many irrelevant features and want automatic feature selection.\n\nL2 (Ridge): adds w² penalty. Shrinks all weights evenly, never to zero. Better when all features are potentially useful.\n\nElasticNet: combines both. Best when you have groups of correlated features.',
    links: [{ tab: 'models', label: 'Regularization Lab' }],
  },
  {
    id: 'imbalanced', cat: 'ML Fundamentals',
    keywords: ['imbalanced','class imbalance','smote','oversampling','rare class','minority class'],
    q: 'How do I handle class imbalance?',
    a: "Start with the right metrics (F1, AUC-PR, not accuracy).\n\n1. Threshold tuning: 0.5 default is rarely optimal. Use PR curves.\n2. Class weights: class_weight='balanced' in sklearn.\n3. SMOTE: apply only to training data — never validation/test.\n4. Collect more minority data if possible.\n\nFor fraud/medical: PR-AUC is more informative than ROC-AUC on rare classes.",
    links: [{ tab: 'eval', label: 'Metric Selector' }, { tab: 'ds', label: 'Calibration Clinic' }],
  },
  {
    id: 'cross_validation', cat: 'ML Fundamentals',
    keywords: ['cross validation','k-fold','kfold','stratified','validation','time series split'],
    q: 'Which cross-validation strategy should I use?',
    a: 'Standard K-Fold: for IID data. Stratified K-Fold: when target is imbalanced (preserves class ratio).\n\nTime-series: NEVER use random k-fold (future leaks into past). Use walk-forward validation: train on [0..t], validate on [t..t+k], slide forward.\n\nGroup K-Fold: when rows belong to groups (e.g., same user). Groups must not span train/val.',
    links: [{ tab: 'ts', label: 'Forecast Failure Zoo' }],
  },

  // Evaluation
  {
    id: 'auc_roc', cat: 'Evaluation',
    keywords: ['auc','roc','auroc','auc-roc','roc curve','discrimination'],
    q: 'What does AUC-ROC actually measure?',
    a: 'AUC-ROC = probability a randomly chosen positive is ranked higher than a randomly chosen negative. Range 0-1; 0.5 = random.\n\nROC plots TPR vs FPR at every threshold. AUC summarizes it threshold-independently.\n\nWhen NOT to use: severe class imbalance. With 1% prevalence, many models get high AUC while performing poorly on the minority class. Prefer PR-AUC for fraud, medical diagnosis.',
    links: [{ tab: 'eval', label: 'Metric Selector' }],
  },
  {
    id: 'ndcg', cat: 'Evaluation',
    keywords: ['ndcg','map','ranking metrics','precision at k','mrr','recommendation metrics'],
    q: 'What metrics should I use for ranking / recommendations?',
    a: 'NDCG (Normalized Discounted Cumulative Gain): position-aware — hitting at rank 1 is worth more than rank 10. Best overall ranking metric.\n\nPrecision@K: fraction of top-K that are relevant. Simple but position-blind.\n\nMAP: average precision at each relevant item. Good for binary relevance.\n\nMRR: reciprocal rank of first relevant item. Use when only the first result matters (search, QA).',
    links: [{ tab: 'eval', label: 'Metric Selector' }, { tab: 'design', label: 'Two-Tower Explorer' }],
  },
  {
    id: 'calibration', cat: 'Evaluation',
    keywords: ['calibration','platt scaling','isotonic','ece','reliability diagram','predicted probability'],
    q: 'What is model calibration and when does it matter?',
    a: 'Calibration = do predicted probabilities match actual frequencies? If your model says 80%, it should be correct 80% of the time.\n\nDiagnose: reliability diagram. Curve above diagonal = overconfident. Below = underconfident.\n\nFix: Platt Scaling (logistic regression on outputs, good for SVMs), Isotonic Regression (flexible, needs more data), Temperature Scaling (neural nets — scale logits).\n\nMatters when probabilities feed business decisions (bidding, risk thresholds).',
    links: [{ tab: 'models', label: 'Calibration Curves' }, { tab: 'ds', label: 'Calibration Clinic' }],
  },

  // Features
  {
    id: 'training_serving_skew', cat: 'Feature Engineering',
    keywords: ['training serving skew','skew','feature skew','offline online','mismatch','production features'],
    q: 'What is training-serving skew and how do I prevent it?',
    a: '4 common bugs:\n1. Time leakage: feature uses future data during training\n2. fillna mismatch: train fills nulls with mean, prod leaves them as-is\n3. Scaler version mismatch: prod loads stale scaler stats\n4. Timezone shift: train uses UTC, prod uses local time\n\nFix: feature stores with point-in-time consistency, shared transform code, parity tests comparing train vs serving feature values.',
    links: [{ tab: 'features', label: 'Training-Serving Skew Simulator' }],
  },
  {
    id: 'data_leakage', cat: 'Feature Engineering',
    keywords: ['data leakage','leakage','target leakage','label leakage','temporal leakage','look-ahead'],
    q: 'How do I detect and prevent data leakage?',
    a: 'Types:\n1. Target leakage: feature reveals the label (e.g., "days_until_churn" predicting churn)\n2. Temporal leakage: future data in a past prediction window\n3. Preprocessing leakage: fitting scaler on full dataset before train/test split\n\nDetection: model AUC drops 10-30% at deployment. Suspiciously high feature importance for features that shouldn\'t be predictive.\n\nFix: strict time-ordered splits, fit all transforms on train only.',
    links: [{ tab: 'features', label: 'Training-Serving Skew Simulator' }, { tab: 'ts', label: 'Forecast Failure Zoo' }],
  },
  {
    id: 'feature_importance', cat: 'Feature Engineering',
    keywords: ['feature importance','shap','permutation importance','feature selection'],
    q: 'SHAP vs permutation importance vs gain — which should I use?',
    a: 'Gain (impurity reduction): built into tree models. Fast but biased toward high-cardinality features.\n\nPermutation Importance: shuffle each feature, measure accuracy drop. Model-agnostic, more honest. Computationally expensive.\n\nSHAP: game-theoretic attribution, per-prediction explanation. Most principled, handles interactions. Use for explaining individual predictions, regulatory explainability.\n\nRecommend: SHAP for understanding, permutation for feature selection.',
    links: [{ tab: 'features', label: 'Training-Serving Skew Simulator' }],
  },

  // Spark
  {
    id: 'spark_shuffle', cat: 'Spark',
    keywords: ['spark','shuffle','repartition','coalesce','partitions','wide transformation','spark optimization'],
    q: 'What causes Spark shuffle and how do I optimize it?',
    a: 'Shuffle triggers on: groupBy, join, distinct, orderBy. Data physically moves across executors — expensive due to disk I/O, network, serialization.\n\nOptimizations:\n1. Filter/select before shuffling\n2. Broadcast small tables (< autoBroadcastJoinThreshold)\n3. Enable AQE: spark.sql.adaptive.enabled=true\n4. Tune spark.sql.shuffle.partitions (default 200 is too high for small data, too low for large)\n5. Pre-partition on join key (Bucketing)',
    links: [{ tab: 'spark', label: 'Shuffle Hell Simulator' }, { tab: 'spark', label: 'Partition Tuner' }],
  },
  {
    id: 'spark_oom', cat: 'Spark',
    keywords: ['oom','out of memory','spark memory','executor memory','driver oom','java heap','spill'],
    q: 'How do I debug Spark OOM errors?',
    a: 'Two types:\n1. Driver OOM: too much data collected to driver (collect(), toPandas()). Fix: increase spark.driver.memory, avoid collecting large DFs.\n2. Executor OOM: partition too large or caching too much. Fix: increase spark.executor.memory, add more partitions, unpersist() when done.\n\nDiagnose: Spark UI Executors tab — GC time >30% = memory pressure. Check spill to disk in Stage details.',
    links: [{ tab: 'spark', label: 'OOM Diagnosis' }],
  },
  {
    id: 'spark_skew', cat: 'Spark',
    keywords: ['skew','data skew','salting','hot key','uneven partitions'],
    q: 'How do I fix data skew in Spark?',
    a: 'Diagnose: Spark UI → Stage → Tasks. Max task duration >> median = skew.\n\nFixes:\n1. Salting: add random salt to skewed key, replicate the small table\n2. AQE skew join: spark.sql.adaptive.skewJoin.enabled=true\n3. Broadcast join: if the other table is small\n4. Repartition on join key before the join',
    links: [{ tab: 'spark', label: 'Skew Doctor' }, { tab: 'spark', label: 'Broadcast Join Decisions' }],
  },

  // System Design
  {
    id: 'recommendation_system', cat: 'System Design',
    keywords: ['recommendation','recommender','two tower','collaborative filtering','hnsw','ann','retrieval ranking'],
    q: 'How do I design a recommendation system?',
    a: 'Standard pipeline: Retrieval → Ranking → Reranking\n\n1. Retrieval (millions → hundreds): Two-tower model, HNSW/Faiss ANN. Metric: recall@K.\n2. Ranking (hundreds → tens): point-wise/list-wise model with rich features. Metric: NDCG@K.\n3. Reranking: diversity constraints, freshness boost, business rules.\n\nCold-start: new users → popularity baseline + onboarding signals. New items → content-based retrieval.',
    links: [{ tab: 'design', label: 'Two-Tower Explorer' }, { tab: 'eval', label: 'Metric Selector' }],
  },
  {
    id: 'ml_monitoring', cat: 'MLOps',
    keywords: ['monitoring','drift','concept drift','data drift','psi','ks test','model degradation','production monitoring'],
    q: 'How do I monitor an ML model in production?',
    a: 'Four layers:\n1. Input drift: are incoming features shifting? (PSI for categorical, KS test for continuous)\n2. Prediction drift: is output distribution changing? Leading indicator.\n3. Business metrics: CTR, conversion, revenue. Lagging but most important.\n4. Label drift: when labels return, compare to training distribution.\n\nPSI > 0.2 = significant drift. Design thresholds carefully — flooding on-call with false alarms destroys trust.',
    links: [{ tab: 'monitor', label: 'Drift Dashboard' }, { tab: 'monitor', label: 'PSI Lab' }, { tab: 'monitor', label: 'Alert Tuner' }],
  },
  {
    id: 'rag', cat: 'System Design',
    keywords: ['rag','retrieval augmented generation','vector database','chunking','reranking','hallucination','embeddings'],
    q: 'How do I build a RAG system that actually works?',
    a: '1. Chunking: start with 512 tokens, 128 overlap. Too small = missing context. Too large = noisy.\n2. Embeddings: text-embedding-3-small for cost, 3-large for quality.\n3. Hybrid retrieval: BM25 (sparse) + vector (dense) combined with RRF. Beats either alone.\n4. Reranking: cross-encoder on top 20-50 chunks, keep top 5.\n5. Hallucination gating: "supported/not supported" check on generated answer vs retrieved context.\n\nEval: RAGAS framework (faithfulness, answer relevance, context precision).',
    links: [{ tab: 'design', label: 'RAG Architecture' }],
  },
  {
    id: 'ab_testing', cat: 'System Design',
    keywords: ['a/b test','ab test','experiment','sample size','statistical significance','mde','hypothesis test'],
    q: 'How do I design an A/B test for an ML model?',
    a: '1. Define metric + MDE (minimum detectable effect)\n2. Sample size: ~3150/arm for 5% MDE at 80% power\n3. Randomize at user level (not session)\n4. Run ≥2 weeks (capture weekly seasonality)\n5. Check SRM before analyzing\n6. Analyze by intent-to-treat\n\nCUPED: control for pre-experiment metric to reduce variance 20-50%.',
    links: [{ tab: 'eval', label: 'A/B Test Designer' }, { tab: 'causal', label: 'Causal vs Predictive' }],
  },
  {
    id: 'model_serving', cat: 'System Design',
    keywords: ['serving','inference','batch serving','online serving','latency','throughput','real time'],
    q: 'Batch vs online vs streaming serving — how do I choose?',
    a: 'Batch: precompute predictions periodically. Low cost, no real-time freshness. Use for daily recommendations, email targeting.\n\nOnline (real-time): inference per request at query time. <100ms. Use for pricing, fraud, search ranking.\n\nStreaming: consume events, update predictions continuously. Use for session-level features, live anomaly detection.\n\nRule: start with batch. Move online only when freshness has measurable business impact.',
    links: [{ tab: 'design', label: 'Serving Tradeoffs' }, { tab: 'dl_serving', label: 'Serving Architecture Selector' }],
  },

  // Statistics
  {
    id: 'p_value', cat: 'Statistics',
    keywords: ['p-value','p value','significance','null hypothesis','hypothesis testing','alpha','type 1 error'],
    q: 'What does a p-value actually mean?',
    a: 'P-value = probability of observing your data (or more extreme) IF the null hypothesis is true. It is NOT the probability the null is false.\n\nMisconceptions:\n- p < 0.05 ≠ "the effect is real"\n- p > 0.05 ≠ "no effect" (absence of evidence ≠ evidence of absence)\n- Large n makes tiny effects significant\n\nAlways report: effect size + confidence interval + p-value together.',
    links: [{ tab: 'eval', label: 'A/B Test Designer' }],
  },
  {
    id: 'simpsons_paradox', cat: 'Statistics',
    keywords: ['simpson','simpsons paradox','aggregation bias','lurking variable','subgroup'],
    q: "What is Simpson's Paradox and how does it affect ML?",
    a: "A trend appears in subgroups but reverses in the aggregate, caused by a confounding variable.\n\nML application: your model has good overall accuracy but terrible performance on a subgroup. Aggregate metrics hide disparate group-level performance.\n\nFix: always stratify analysis. Report metrics per subgroup. Don't optimize aggregate metrics without checking slice performance.",
    links: [{ tab: 'causal', label: 'Confounder or Collider' }, { tab: 'ds', label: 'Analysis Mistakes' }],
  },

  // Causal Inference
  {
    id: 'causal_vs_pred', cat: 'Causal Inference',
    keywords: ['causal inference','causal','prediction vs causation','correlation causation','treatment effect','intervention'],
    q: 'How do I know if my problem needs causal inference or prediction?',
    a: 'Key question: PREDICTION or INTERVENTION?\n\nPredictive: "Who will churn?" — rank users by probability. No intervention.\n\nCausal: "Will this discount prevent churn?" — effect of an action. Predictive models model correlations, not causal effects.\n\nNeed causal when: "Will X cause Y?", evaluating a policy, wanting counterfactuals, stakeholders will act on the result.',
    links: [{ tab: 'causal', label: 'Causal vs Predictive' }],
  },
  {
    id: 'confounding', cat: 'Causal Inference',
    keywords: ['confounder','confounding','confounding variable','common cause','spurious correlation'],
    q: 'What is a confounder and how do I control for it?',
    a: 'A confounder causes both treatment (X) and outcome (Y), creating spurious association.\n\nControl:\n1. Randomization: breaks the confounder → treatment path (gold standard)\n2. Regression adjustment: include confounder as covariate\n3. Propensity score matching/weighting\n4. Stratification\n\nCritical: you can only control for observed confounders. Unobserved confounders remain a threat.',
    links: [{ tab: 'causal', label: 'Confounder or Collider' }, { tab: 'causal', label: 'Backdoor Criterion' }],
  },
  {
    id: 'uplift', cat: 'Causal Inference',
    keywords: ['uplift','uplift modeling','cate','treatment effect','heterogeneous','persuadable','t-learner'],
    q: 'What is uplift modeling and when should I use it?',
    a: 'Uplift estimates CATE — not "who will churn?" but "who will respond to intervention?"\n\nFour segments: Persuadables (target), Sure things (wasted spend), Lost causes (wasted spend), Sleeping dogs (intervention makes it worse).\n\nMethods: T-learner (CATE = μ₁ − μ₀), X-learner (better for imbalanced treatment), AIPW (best for observational data).\nEvaluate with Qini curve.',
    links: [{ tab: 'causal', label: 'Uplift Modeling' }],
  },

  // Deep Learning
  {
    id: 'gradient_descent', cat: 'Deep Learning',
    keywords: ['gradient descent','sgd','adam','rmsprop','optimizer','learning rate','momentum'],
    q: 'SGD vs Adam vs RMSProp — which optimizer should I use?',
    a: 'Adam: adaptive LR per parameter. Fast convergence, less LR tuning needed. Default for NLP/transformers.\n\nSGD + momentum: slower convergence but sometimes better generalization. Used in production CNNs (ResNet, etc.).\n\nRMSProp: adaptive LR without momentum. Good for RNNs, non-stationary problems.\n\nPractical: start with Adam (lr=1e-3). For final training with lots of data, try SGD. LR is the most important hyperparameter.',
    links: [{ tab: 'dl', label: 'Training Failure Diagnosis' }, { tab: 'dl_finetune', label: 'Learning Rate Strategy' }],
  },
  {
    id: 'vanishing_gradients', cat: 'Deep Learning',
    keywords: ['vanishing gradient','exploding gradient','gradient flow','dead relu','nan loss'],
    q: 'What causes vanishing/exploding gradients and how do I fix them?',
    a: 'Vanishing: gradients become tiny in early layers → they stop learning. Common with sigmoid/tanh.\nFix: ReLU/GeLU, batch normalization, residual connections, gradient clipping.\n\nExploding: gradients grow → NaN loss.\nFix: gradient clipping (clip_grad_norm, max_norm=1.0), proper weight init (Xavier, He).\n\nBoth: LayerNorm, careful initialization, smaller LR, warmup.',
    links: [{ tab: 'dl', label: 'Training Failure Diagnosis' }, { tab: 'dl', label: 'Backprop Debugging' }],
  },
  {
    id: 'finetuning', cat: 'Deep Learning',
    keywords: ['fine tuning','finetuning','lora','peft','freeze','pretrained','transfer learning'],
    q: 'When should I use LoRA vs full fine-tuning vs frozen features?',
    a: 'Frozen backbone: data < 500 samples. Fast, no overfitting risk.\n\nLoRA: trains <1% of parameters via low-rank decomposition. Near full fine-tuning quality at 10-100x less compute. Default choice for LLMs.\n\nFull fine-tuning: data > 100K samples and task is quite different from pretraining.\n\nDecision: data < 1K → LoRA. 1K–100K → LoRA or layer-wise. > 100K → full fine-tuning viable.',
    links: [{ tab: 'dl_finetune', label: 'Freeze vs Full Fine-tune vs LoRA' }],
  },
  {
    id: 'quantization', cat: 'Deep Learning',
    keywords: ['quantization','int8','fp16','fp32','bf16','model compression','inference optimization'],
    q: 'How does quantization affect model quality vs speed?',
    a: 'FP32 → FP16: minimal quality loss, 2x memory, 2x speed. Default for inference.\nFP32 → INT8: 4x memory, 2-4x speed. ~1-2% quality loss. Good for edge/cost-sensitive.\nFP32 → INT4: 8x memory. Significant quality loss for small models; acceptable for 7B+ LLMs.\n\nPractical: run inference in FP16/BF16. INT8 for cost-sensitive. INT4 (GGUF, GPTQ) for local LLM serving.',
    links: [{ tab: 'dl_serving', label: 'Quantization Tradeoffs' }],
  },

  // MLOps
  {
    id: 'deployment_strategy', cat: 'MLOps',
    keywords: ['deployment','blue green','canary','shadow mode','rollout','model deployment'],
    q: 'Blue-green vs canary vs shadow deployment — which should I use?',
    a: 'Shadow: new model runs in parallel, logs predictions but serves none. Zero risk. Use first.\n\nCanary: route 1-5% of traffic to new model. Ramp up 1→5→20→100%.\n\nBlue-green: instant traffic switch. Enables instant rollback.\n\nDefault: shadow → canary → full rollout with blue-green rollback capability.',
    links: [{ tab: 'mlops_deploy', label: 'Deployment Strategy Selector' }],
  },
  {
    id: 'ml_interview', cat: 'Interview',
    keywords: ['interview','ml interview','system design interview','prepare','how to answer'],
    q: 'How should I approach an ML system design interview?',
    a: '6-step framework:\n1. Clarify: scale, latency, freshness, business objective\n2. ML task: what to predict? Label definition?\n3. Data: sources, labeling, volume, class balance\n4. Features: signals, computation, training-serving consistency\n5. Modeling: model family, offline metrics, baseline\n6. Production: serving, monitoring, retraining trigger\n\nCommon mistakes: jumping to model before understanding data, ignoring monitoring, not addressing cold-start.\n\nEnd every answer: "The first thing I\'d validate is..."',
    links: [{ tab: 'interview', label: 'System Design Questions' }, { tab: 'design', label: 'ML System Design Canvas' }],
  },
  {
    id: 'two_tower', cat: 'System Design',
    keywords: ['two tower','dual encoder','retrieval','faiss','hnsw','embedding retrieval','ann'],
    q: 'How does a two-tower retrieval model work?',
    a: 'Two separate neural nets (user tower, item tower) map to the same embedding space. At inference, find closest items via ANN (HNSW/Faiss).\n\nTraining: contrastive learning with positive pairs + negatives. In-batch negatives are cheap. Hard negatives (items ranked high but not interacted with) improve quality — mix 75% random + 25% hard.\n\nProduction: embed all items offline, build ANN index. User embedding at query time. Retrieval in <10ms for 100M items.',
    links: [{ tab: 'design', label: 'Two-Tower Explorer' }],
  },
  {
    id: 'feature_store', cat: 'System Design',
    keywords: ['feature store','feast','tecton','point-in-time','online store','offline store'],
    q: 'What is a feature store and when do I need one?',
    a: 'Infrastructure for computing, storing, serving features with point-in-time correctness.\n\nOffline store: batch training data in a warehouse/object store.\nOnline store: low-latency feature lookup at serving time (Redis, DynamoDB).\n\nNeed one when: multiple teams computing the same features, recurring training-serving skew, features shared across models.\n\nDon\'t need one: single model, small team, simple features.',
    links: [{ tab: 'features', label: 'Feature Store Designer' }],
  },
]

// ── Random Challenges ──────────────────────────────────────────────────────────
const RANDOM_CHALLENGES = [
  {
    id: 'rc1', tab: 'spark', label: 'Broadcast Join',
    q: 'You\'re joining a 500GB table with a 150MB dimension table. Spark picks sort-merge join. The query runs 3 hours. First optimization?',
    hint: 'Which join strategy avoids shuffling the large table?',
    answer: 'Force a broadcast join. At 150MB it\'s above the default 50MB autoBroadcastJoinThreshold — raise it or use an explicit broadcast() hint. This eliminates the 500GB shuffle entirely.',
  },
  {
    id: 'rc2', tab: 'causal', label: 'Causal or Predictive?',
    q: 'Product asks: "Do users who complete onboarding have better 30-day retention?" They want to invest more if so.',
    hint: 'What is the team actually trying to decide?',
    answer: 'Causal question. Users who complete onboarding self-select — they\'re already motivated. You need to estimate the causal effect of onboarding on retention, likely via A/B test or DiD if rolled out to cohorts.',
  },
  {
    id: 'rc3', tab: 'eval', label: 'Metric Choice',
    q: 'Cancer screening model: sensitivity=90%, specificity=75%. Baseline catches 60% of cases. Should you deploy?',
    hint: 'What does false negative cost in this context?',
    answer: 'Recall is primary here — missing a cancer case (FN) is far worse than a false alarm. 90% vs 60% baseline is a strong improvement. But verify: what happens to FP rate? Patients with false positives face unnecessary procedures.',
  },
  {
    id: 'rc4', tab: 'design', label: 'Offline-Online Gap',
    q: 'Rec model NDCG@10 improved 8% offline. You deploy. 2 days later CTR drops 15%. What happened?',
    hint: 'What causes offline metrics to be misleading?',
    answer: 'Classic offline-online gap. Possible causes: (1) selection bias from previous model\'s exposures, (2) diversity collapsed, (3) popularity bias from in-batch negatives, (4) feature leakage in offline eval.',
  },
  {
    id: 'rc5', tab: 'ts', label: 'Forecast MAPE Spike',
    q: 'Demand forecast has MAPE=12% in validation but 40% in first week of production. Most likely cause?',
    hint: 'What\'s different between your validation setup and production?',
    answer: 'Temporal leakage in validation. Features used future data (e.g., rolling average including post-cutoff days). In production those features are unavailable. Use strict walk-forward validation.',
  },
  {
    id: 'rc6', tab: 'dl', label: 'Training NaN',
    q: 'Training loss drops normally for 10 epochs, then suddenly jumps to NaN. Three most likely causes?',
    hint: 'What causes sudden numerical instability?',
    answer: '1. Exploding gradients → add gradient clipping (clip_grad_norm, max_norm=1.0). 2. LR too high → add warmup, reduce by 10x. 3. Bad batch with NaN features → check pipeline for log(0) or division by zero.',
  },
  {
    id: 'rc7', tab: 'monitor', label: 'PSI Alert',
    q: 'PSI=0.35 on your primary feature after 7-day deploy. Accuracy unchanged. Do you roll back?',
    hint: 'PSI>0.2 is significant, but accuracy is fine. What\'s your playbook?',
    answer: 'Don\'t rollback immediately. Investigate: which feature? Data pipeline issue or real shift? You have lead time before accuracy degrades. Trigger investigation + accelerated retraining, monitor 24-48h while root-causing.',
  },
  {
    id: 'rc8', tab: 'causal', label: 'DAG Analysis',
    q: 'You control for "account age" when estimating effect of premium subscription on spending. Account age affects both subscription likelihood and spending. Correct decision?',
    hint: 'What role does account age play in the causal graph?',
    answer: 'Yes — account age is a confounder: causes both the treatment (subscription) and outcome (spending). Controlling for it blocks the backdoor path and isolates the causal effect of subscription.',
  },
]

// ── Suggested Questions ────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'What is overfitting and how do I fix it?',
  'How do I choose between AUC-ROC and precision-recall?',
  'When should I use causal inference vs predictive modeling?',
  'How do I debug Spark OOM errors?',
  'What metrics should I use for a recommendation system?',
  'How does a two-tower model work?',
  'When should I use LoRA vs full fine-tuning?',
  'How do I design an A/B test?',
]

// ── Search ─────────────────────────────────────────────────────────────────────
function search(query) {
  if (!query.trim()) return []
  const tokens = query.toLowerCase().replace(/[^a-z0-9 '\-]/g, ' ').split(' ').filter(t => t.length > 1)
  if (!tokens.length) return []
  const scored = KB.map(item => {
    let score = 0
    tokens.forEach(t => {
      item.keywords.forEach(k => {
        if (k === t) score += 4
        else if (k.includes(t) || t.includes(k)) score += 2
      })
      if (item.q.toLowerCase().includes(t)) score += 2
      if (item.a.toLowerCase().includes(t)) score += 1
    })
    return { item, score }
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.item)
  return scored
}

// ── Category colors ────────────────────────────────────────────────────────────
const CAT_COLOR = {
  'ML Fundamentals': 'var(--prime)',
  'Evaluation': 'var(--prime)',
  'Feature Engineering': 'var(--prime)',
  'Spark': 'var(--prime)',
  'System Design': 'var(--prime)',
  'Statistics': 'var(--prime)',
  'Causal Inference': 'var(--prime)',
  'Deep Learning': 'var(--prime)',
  'MLOps': 'var(--prime)',
  'Interview': 'var(--prime)',
}

// ── Result Card ────────────────────────────────────────────────────────────────
function ResultCard({ item, faded, onNavigate }) {
  const color = CAT_COLOR[item.cat] || 'var(--ink-mid)'
  const [hoveredLink, setHoveredLink] = useState(null)
  return (
    <div style={{
      padding: '14px 16px',
      borderTop: faded ? '1px solid var(--rim)' : 'none',
      opacity: faded ? 0.72 : 1,
    }}>
      {faded && (
        <div style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--ink-ghost)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}>
          Also relevant
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
          borderRadius: 4,
          padding: '2px 6px',
          whiteSpace: 'nowrap',
        }}>
          {item.cat}
        </span>
        <span style={{
          fontSize: 12,
          color: 'var(--ink-mid)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
        }}>
          {item.q}
        </span>
      </div>
      <p style={{
        margin: 0,
        fontSize: 13,
        lineHeight: 1.65,
        color: 'var(--ink-hi)',
        whiteSpace: 'pre-line',
        fontFamily: 'var(--font-sans)',
      }}>
        {item.a}
      </p>
      {item.links && item.links.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {item.links.map(link => (
            <button
              key={link.tab + link.label}
              onClick={() => onNavigate(link.tab)}
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: hoveredLink === link.tab + link.label ? 'var(--prime)' : 'var(--ink-mid)',
                background: 'transparent',
                border: `1px solid ${hoveredLink === link.tab + link.label ? 'var(--prime)' : 'var(--rim)'}`,
                borderRadius: 6,
                padding: '3px 9px',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={() => setHoveredLink(link.tab + link.label)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {link.label} →
            </button>
          ))}
        </div>
      )}
      <div style={{
        marginTop: 10,
        fontSize: 11,
        color: 'var(--ink-ghost)',
        fontFamily: 'var(--font-sans)',
        fontStyle: 'italic',
      }}>
        LLM integration coming soon — responses are currently from a curated knowledge base.
      </div>
    </div>
  )
}

// ── Surprise Modal ─────────────────────────────────────────────────────────────
function SurpriseModal({ challenge, onClose, onNavigate }) {
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    setShowHint(false)
    setShowAnswer(false)
  }, [challenge?.id])

  if (!challenge) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{
          maxWidth: 560,
          width: '100%',
          padding: 0,
          overflow: 'hidden',
          border: '1px solid var(--rim-hi)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--rim)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--prime)',
              background: 'rgba(var(--prime-rgb,212,175,55),0.12)',
              border: '1px solid rgba(var(--prime-rgb,212,175,55),0.3)',
              borderRadius: 4,
              padding: '2px 7px',
            }}>
              Challenge
            </span>
            <span style={{
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: 'var(--ink-hi)',
            }}>
              {challenge.label}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-ghost)',
              fontSize: 18,
              lineHeight: 1,
              padding: '2px 6px',
            }}
          >
            ×
          </button>
        </div>

        {/* Question */}
        <div style={{ padding: '20px 20px 0' }}>
          <p style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--ink-hi)',
            fontFamily: 'var(--font-sans)',
          }}>
            {challenge.q}
          </p>
        </div>

        {/* Hint */}
        <div style={{ padding: '14px 20px 0' }}>
          <button
            onClick={() => setShowHint(h => !h)}
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--prime)',
              background: 'transparent',
              border: '1px solid rgba(240,165,0,0.3)',
              borderRadius: 6,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            {showHint ? '▲ Hide hint' : '▼ Show hint'}
          </button>
          {showHint && (
            <p style={{
              margin: '10px 0 0',
              fontSize: 13,
              color: 'var(--ink-mid)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }}>
              {challenge.hint}
            </p>
          )}
        </div>

        {/* Answer */}
        <div style={{ padding: '12px 20px 0' }}>
          <button
            onClick={() => setShowAnswer(a => !a)}
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--prime)',
              background: 'transparent',
              border: '1px solid rgba(240,165,0,0.3)',
              borderRadius: 6,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            {showAnswer ? '▲ Hide answer' : '▼ Reveal answer'}
          </button>
          {showAnswer && (
            <p style={{
              margin: '10px 0 0',
              fontSize: 13,
              color: 'var(--ink-hi)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.65,
              whiteSpace: 'pre-line',
            }}>
              {challenge.answer}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          marginTop: 16,
          borderTop: '1px solid var(--rim)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={() => { onNavigate(challenge.tab); onClose() }}
            className="btn-primary"
            style={{ fontSize: 13 }}
          >
            Go to module →
          </button>
          <button
            onClick={onClose}
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-sans)',
              color: 'var(--ink-low)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AskTab ─────────────────────────────────────────────────────────────────────
export default function AskTab({ onNavigate }) {
  const [messages, setMessages] = useState([])
  const [query, setQuery] = useState('')
  const [surprise, setSurprise] = useState(null)
  const [surpriseHovered, setSurpriseHovered] = useState(false)
  const [hoveredSugg, setHoveredSugg] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  function handleSubmit() {
    const q = query.trim()
    if (!q) return
    const results = search(q)
    const nav = searchContent(q)
    const userMsg = { id: Date.now() + '-u', type: 'user', text: q }
    const answerMsg = results.length > 0
      ? { id: Date.now() + '-a', type: 'answer', results, nav }
      : { id: Date.now() + '-n', type: 'none', nav }
    setMessages(prev => [...prev, userMsg, answerMsg])
    setQuery('')
  }

  function handleSuggestion(q) {
    const results = search(q)
    const nav = searchContent(q)
    const userMsg = { id: Date.now() + '-u', type: 'user', text: q }
    const answerMsg = results.length > 0
      ? { id: Date.now() + '-a', type: 'answer', results, nav }
      : { id: Date.now() + '-n', type: 'none', nav }
    setMessages(prev => [...prev, userMsg, answerMsg])
  }

  function handleSurprise() {
    const idx = Math.floor(Math.random() * RANDOM_CHALLENGES.length)
    setSurprise(RANDOM_CHALLENGES[idx])
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: 28,
            fontFamily: 'var(--font-sans)',
            fontWeight: 900,
            letterSpacing: '-0.05em',
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 55%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Ask &amp; Search
          </h2>
          <p style={{
            margin: '6px 0 0',
            fontSize: 14,
            color: 'var(--ink-mid)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.6,
          }}>
            Ask a question to get a KB answer — concepts, trade-offs, failure modes, production patterns — and jump straight to the matching modules and posts.
          </p>
          <p style={{
            margin: '6px 0 0',
            fontSize: 13,
            color: 'var(--ink-low)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.55,
            maxWidth: '500px',
          }}>
            Type a question or pick from the suggestions below. Use "Surprise me" for a random challenge question with a hint and worked answer.
          </p>
        </div>
        <button
          onClick={handleSurprise}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            color: 'var(--prime)',
            background: surpriseHovered ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.28)',
            borderRadius: 8,
            padding: '8px 14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
          onMouseEnter={() => setSurpriseHovered(true)}
          onMouseLeave={() => setSurpriseHovered(false)}
        >
          <span style={{ fontSize: 15 }}>∿</span> Surprise me
        </button>
      </div>

      {/* Suggestions grid — only when no messages */}
      {!hasMessages && (
        <div>
          <div style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--ink-ghost)',
            marginBottom: 10,
          }}>
            Suggested questions
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 8,
          }}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(s)}
                style={{
                  textAlign: 'left',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  color: hoveredSugg === i ? 'var(--ink-hi)' : 'var(--ink-mid)',
                  background: 'var(--depth)',
                  border: `1px solid ${hoveredSugg === i ? 'var(--rim-hi)' : 'var(--rim)'}`,
                  borderRadius: 8,
                  padding: '10px 13px',
                  cursor: 'pointer',
                  lineHeight: 1.4,
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={() => setHoveredSugg(i)}
                onMouseLeave={() => setHoveredSugg(null)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages area */}
      {hasMessages && (
        <div style={{
          maxHeight: 520,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingRight: 4,
        }}>
          {messages.map(msg => {
            if (msg.type === 'user') {
              return (
                <div
                  key={msg.id}
                  style={{
                    marginLeft: 'auto',
                    maxWidth: '70%',
                    background: 'rgba(212,175,55,0.10)',
                    border: '1px solid rgba(212,175,55,0.28)',
                    borderRadius: 12,
                    padding: 'var(--card-pad-primary)',
                  }}
                >
                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'var(--prime)',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}>
                    {msg.text}
                  </p>
                </div>
              )
            }

            if (msg.type === 'none') {
              return (
                <div
                  key={msg.id}
                  style={{
                    maxWidth: '95%',
                    background: 'var(--depth)',
                    border: '1px solid var(--rim)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <p style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'var(--ink-low)',
                    fontFamily: 'var(--font-sans)',
                    lineHeight: 1.55,
                  }}>
                    I don't have a direct KB answer — but here's where in the app to look.
                  </p>
                  {msg.nav && msg.nav.length > 0 && <NavStrip nav={msg.nav} onNavigate={onNavigate} />}
                </div>
              )
            }

            if (msg.type === 'answer') {
              return (
                <div
                  key={msg.id}
                  style={{
                    maxWidth: '95%',
                    background: 'var(--depth)',
                    border: '1px solid var(--rim)',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {msg.results.map((item, idx) => (
                    <ResultCard
                      key={item.id}
                      item={item}
                      faded={idx > 0}
                      onNavigate={onNavigate}
                    />
                  ))}
                  {msg.nav && msg.nav.length > 0 && <NavStrip nav={msg.nav} onNavigate={onNavigate} />}
                </div>
              )
            }

            return null
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          border: '1px solid var(--rim)',
        }}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about overfitting, Spark OOM, two-tower models, A/B tests..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            color: 'var(--ink-hi)',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!query.trim()}
          style={{
            fontSize: 13,
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            color: query.trim() ? 'var(--void)' : 'var(--ink-ghost)',
            background: query.trim() ? 'var(--prime)' : 'var(--surface)',
            border: 'none',
            borderRadius: 7,
            padding: '7px 16px',
            cursor: query.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s, color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          Send
        </button>
      </div>

      {/* Surprise modal */}
      <SurpriseModal
        challenge={surprise}
        onClose={() => setSurprise(null)}
        onNavigate={onNavigate}
      />
    </div>
  )
}
