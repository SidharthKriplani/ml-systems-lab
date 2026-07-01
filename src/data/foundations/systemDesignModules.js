export const SYSTEM_DESIGN_MODULES = [
  {
    id: 'design_framework',
    title: 'The 6-Step ML System Design Framework',
    subtitle: 'Clarify → scope → data → model → serving → monitoring',
    difficulty: 'foundational',
    estimatedMin: 20,
    tags: ['system design', 'framework', 'ML design interview'],
    summary: `Most failed ML projects don't fail on the model — they fail because the problem was never properly scoped. Engineers jump to architecture before clarifying latency requirements, label availability, or the actual business metric that matters. A junior engineer proposes a transformer for a problem that needed a decision tree, or designs offline batch scoring for a system that needs sub-50ms online inference. The 6-step framework forces the constraints to surface before any architectural decision is made: (1) Clarify requirements, (2) Frame as an ML problem, (3) Data strategy, (4) Model design, (5) Serving architecture, (6) Monitoring. Skipping to step 4 without steps 1-3 is the most common mistake in ML system design interviews — and in real projects.`,
    keyPoints: [
      `**Steps 1–3 constrain every architecture decision: clarify, frame, and plan data before touching a model.**\n\nWithout knowing QPS, latency requirement, label availability, and the cost asymmetry between error types, every subsequent decision is a guess. A model chosen before requirements are known will either miss the latency SLA, need unavailable labels, or optimize the wrong metric.`,
      `**Steps 4–5 are where the real tradeoffs live: model selection and serving architecture are tightly coupled.**\n\nA transformer that takes 200ms cannot serve a real-time recommendation. A model requiring 50GB RAM cannot run on a single server. These constraints must be resolved together, not sequentially—choosing the model first and then discovering the serving problem wastes weeks.`,
      `**Step 6 is not optional: a deployed model has no mechanism to signal its own degradation.**\n\nWithout monitoring input distributions, prediction distributions, and business metrics, the first sign of model failure is a business metric drop—days after the damage began. Define retraining triggers before deployment, not after the first incident.`,
    ],
    interactivePrompt: `Before you touch the controls: what is the first clarifying question you ask before designing any ML system, and why does the answer change everything downstream?`,
    checkQuestions: [
      {
        q: `You are asked to "design a spam filter for email." What are the first 5 clarifying questions you ask?`,
        options: [
          `A) Model architecture, training data size, feature engineering approach, evaluation metric, and deployment environment`,
          `B) Scale/QPS, latency (synchronous block vs async), available labelled spam/ham data, precision vs recall cost tradeoff, and spam definition scope (marketing/phishing/malware — one model or many?)`,
          `C) Team size, project timeline, infrastructure budget, stakeholder requirements, and regulatory compliance constraints`,
          `D) Language distribution of emails, user demographics, email client type, server location, and storage capacity`,
        ],
        answer: `B`,
      },
    ],
  },
  {
    id: 'recsys_overview',
    title: 'Recommender System Overview',
    subtitle: 'Retrieval vs ranking vs diversity, architecture overview, data flywheel',
    difficulty: 'intermediate',
    estimatedMin: 20,
    tags: ['recommender system', 'RecSys', 'retrieval', 'ranking'],
    summary: `A single ranking model cannot serve both the scale problem and the quality problem simultaneously. Running a high-quality ranking model over 10 million items in under 50ms is not computationally feasible — at even 1ms per item that's 10,000 seconds.

This is why every large-scale recommender system uses a staged funnel: retrieval (candidate generation) narrows millions to thousands using fast, approximate methods; ranking orders the candidates using expensive, precise models; re-ranking applies diversity, freshness, and business constraints on top. Each stage is a different engineering tradeoff. The data flywheel — more users produce more interaction data, which trains better models, which drives more engagement, which attracts more users — is why incumbent recommender systems are nearly impossible to displace once they reach scale.`,
    keyPoints: [
      `**The staged funnel exists because the accuracy problem and the scale problem cannot be solved by the same model simultaneously.**\n\nRetrieval must be fast and high-recall—a missed item at retrieval can never be recovered downstream. Ranking must be precise and can afford to be expensive because it only runs over hundreds of candidates, not millions. These are different optimization problems requiring different architectures.`,
      `**The data flywheel compounds the incumbent advantage: more users → more interaction data → better models → more engagement → more users.**\n\nNew entrants without interaction history cannot use collaborative filtering and must rely on content-based signals until they accumulate a user base. This is why early-stage recommenders systematically underperform incumbents even with identical architecture.`,
      `**Exploration is not optional: a pure exploitation system shrinks user consumption sets over time and starves the model of signal on new items.**\n\nWithout deliberate injection of novel items, the system converges to a small subset of popular content—destroying long-tail coverage and, eventually, user satisfaction. The tradeoff is real: exploration hurts short-term engagement and helps long-term health.`,
    ],
    interactivePrompt: `Before you touch the controls: why can't a single ranking model serve 10 million items in real time, and what constraint forces the multi-stage design?`,
    checkQuestions: [
      {
        q: `TikTok shows you relevant videos even in your first session before any watch history. How?`,
        options: [
          `A) TikTok requires account linking to another social platform to import interest signals before the first session`,
          `B) TikTok delays personalization until the second session, showing only globally popular content on first visit`,
          `C) TikTok trains a per-user model in real time using gradient descent on each watch event within the session`,
          `D) Context signals (device, language, location, time of day), content-based video features (metadata, hashtags, audio), popularity/trending fallback, and rapid exploitation of early watch-time signals to update the real-time user embedding within the session`,
        ],
        answer: `D`,
      },
    ],
  },
  {
    id: 'recsys_stack',
    title: 'RecSys Stack Deep-Dive',
    subtitle: 'Candidate generation, ranking, re-ranking, diversity, A/B',
    difficulty: 'advanced',
    estimatedMin: 25,
    tags: ['RecSys', 'ranking', 'candidate generation', 're-ranking'],
    summary: `The gap between a working recommender prototype and a production recommender system is the full engineering stack that sits around the model. A prototype runs a ranker over a few thousand items and returns results. A production system must do this for millions of users simultaneously, within a 100ms total latency budget, with independent A/B testing for each stage, graceful fallback when any component fails, and position-bias correction to avoid the feedback loop where the ranking model learns to surface whatever the previous model already ranked highly. Each stage of the funnel — candidate generation, deduplication, ranking, re-ranking, mixing — is independently trained, monitored, and deployable. The stack is what allows a 10-person team to iterate on retrieval without touching ranking.`,
    keyPoints: [
      `**Each stage is independently trained, monitored, and deployable—this is what allows a team to iterate on retrieval without touching ranking.**\n\nMixing responsibilities between stages collapses this independence. The pipeline becomes a single deployable unit where changing one thing requires testing everything. The staged architecture is an organizational decision as much as a technical one.`,
      `**Feedback loop management is the hardest correctness problem in RecSys: the ranking model trains on interactions shaped by what the previous model chose to show.**\n\nPosition 1 gets more clicks regardless of quality. Training on raw clicks teaches the model to replicate position effects, not relevance. Counterfactual learning and inverse propensity score weighting are the tools for recovering an unbiased relevance estimate.`,
      `**Latency budget allocation must be explicit: each stage has a hard time budget, and a single overrunning stage cascades through the rest.**\n\nIf feature retrieval takes 25ms instead of 10ms, only 15ms remains for ranking, forcing either fewer candidates or a simpler model—both of which hurt quality. The budget must be measured end-to-end in production, not estimated from individual component benchmarks.`,
    ],
    interactivePrompt: `Before you touch the controls: if candidate generation is the first stage, what is the failure mode if it has low recall—and why can't the ranker fix it?`,
    checkQuestions: [
      {
        q: `Your ranking model has a 95ms inference latency for 1000 candidates. Total budget is 100ms. How do you bring latency down to 40ms?`,
        options: [
          `A) Model compression (FP32→INT8 quantisation, weight pruning), architecture change to GBM or knowledge-distilled neural model, single batched forward pass, GPU/accelerator serving, reduce candidates to 300-500, and early-exit two-stage scoring (coarse all 1000, detailed top 100)`,
          `B) Increase the candidate pool to 2000 so the model has more context, then apply stricter post-hoc filtering to reduce output to 40 items within budget`,
          `C) Switch from synchronous to asynchronous serving and return cached results from the previous request while the new score computes in the background`,
          `D) Add more ranking model layers to improve quality so fewer candidates need to be re-ranked in a downstream re-ranking stage`,
        ],
        answer: `A`,
      },
    ],
  },
  {
    id: 'two_tower',
    title: 'Two-Tower Models',
    subtitle: 'Architecture, dot-product vs cross-attention, embedding serving, ANN',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['two-tower', 'embeddings', 'ANN', 'retrieval'],
    summary: `The core retrieval problem at scale is: a cross-attention model that jointly encodes user and item would be the most accurate, but it requires computing a score for every (user, item) pair at inference time — O(n×m) operations, which is 10 billion computations for 10M items and 1000 users per second. That's not real-time retrieval, that's a data warehouse job. Two-tower models break the coupling: user and item are encoded independently into the same embedding space, and similarity is measured by dot product.

Because item embeddings don't depend on the query user, they can be precomputed offline and indexed for approximate nearest neighbour search. Retrieval becomes a 10ms operation even across 100M items.

The tradeoff is that the model cannot capture user-item feature interactions — that's left to the cross-attention ranker downstream.`,
    keyPoints: [
      `**Two-tower enables precomputing item embeddings offline and indexing them for approximate nearest-neighbour search—this is what makes real-time retrieval over 100M items possible.**\n\nBecause item embeddings don't depend on the query user, they can be computed once and indexed. Retrieval becomes a 10ms operation: compute one user embedding in real time, then do an ANN lookup against the precomputed index. Cross-attention destroys this because item encoding depends on the user.`,
      `**In-batch softmax training with hard negative mining is the standard recipe: the other items in the batch serve as negatives, and explicitly mining high-scoring but unclicked items provides stronger gradient signal.**\n\nRandom negatives are easy—the model distinguishes a user's clicked video from a random video in the corpus with minimal gradient. Hard negatives force the model to learn fine-grained distinctions between items that are superficially similar to what the user wants.`,
      `**ANN index staleness is an operational cost that scales with catalog volatility: when item features change, the indexed embedding no longer reflects the current item.**\n\nFor fast-changing catalogs (price updates, inventory changes), delta updates recompute only changed items. For stable catalogs, full rebuilds on a weekly schedule are acceptable. Staleness is not a corner case—it's a continuous tradeoff between freshness and rebuild cost.`,
    ],
    interactivePrompt: `Before you touch the controls: why does a cross-attention model that jointly encodes user and item fail at retrieval scale, even though it's more accurate?`,
    checkQuestions: [
      {
        q: `You build a two-tower model and find that the recall@100 is 60% — only 60% of actually-clicked items are in the retrieved 100. How do you improve recall?`,
        options: [
          `A) Switch from dot-product similarity to L2 distance, which is more numerically stable for high-dimensional embeddings and reduces false misses`,
          `B) Reduce embedding dimensions from 256 to 64 so the ANN index is smaller and more items are reachable within the search budget`,
          `C) Hard negative mining (high-scoring but unclicked items), temperature tuning, larger embedding dimensions (64→256), richer features, popularity-bias correction, and expanding ANN candidates (100→500) with the ranker filtering downstream`,
          `D) Replace contrastive training loss with a pointwise regression loss on explicit ratings to produce more calibrated scores`,
        ],
        answer: `C`,
      },
    ],
  },
  {
    id: 'semantic_search',
    title: 'Semantic Search & Embeddings',
    subtitle: 'Bi-encoder vs cross-encoder, ANN indexes: FAISS/ScaNN/HNSW',
    difficulty: 'advanced',
    estimatedMin: 20,
    tags: ['semantic search', 'FAISS', 'HNSW', 'embeddings', 'retrieval'],
    summary: `Keyword search fails the moment the user's vocabulary doesn't match the document's vocabulary. A user searching "heart attack symptoms" misses documents that say "myocardial infarction presentation." BM25 has no concept of synonymy. Semantic search solves this by mapping queries and documents into an embedding space where meaning — not literal string overlap — determines similarity. But this creates a new engineering problem: the most accurate approach (cross-encoders that jointly process query and document) cannot scale beyond a few hundred documents per query. Bi-encoders (two-tower) enable precomputing document embeddings and doing ANN retrieval, scaling to billions of documents at the cost of some precision. The production answer is always bi-encoder for retrieval, cross-encoder for re-ranking the top results.`,
    keyPoints: [
      `**Bi-encoder for retrieval, cross-encoder for re-ranking: this split is forced by the scale constraint, not a quality preference.**\n\nA cross-encoder that jointly encodes query and document is more accurate because it models their interaction directly. But at O(N) inference cost over 50M documents, it cannot run at query time. The bi-encoder precomputes document embeddings offline; the cross-encoder re-ranks the top 50–200 retrieved candidates. Each stage does what only it can do.`,
      `**Raw BERT embeddings are poor for semantic similarity—BERT was trained with MLM, not similarity.**\n\nSBERT adds mean pooling and contrastive fine-tuning to produce embeddings that cluster by meaning. Modern bi-encoders (E5, BGE) trained with hard negatives achieve substantially higher recall than first-generation SBERT. The pretraining objective of the encoder determines whether its embeddings are useful for retrieval.`,
      `**Every ANN index has a parameter that trades recall for latency, and the operating point must be calibrated on representative queries, not benchmarks.**\n\nHead queries (high-frequency, well-covered in training data) have higher recall than tail queries at the same ef_search or nprobe setting. Calibrate on a stratified query sample that includes tail queries. A 15ms P99 SLA met on head queries will be violated on tail queries if you only tune on the former.`,
    ],
    interactivePrompt: `Before you touch the controls: if a cross-encoder is more accurate than a bi-encoder, why can't you use a cross-encoder alone to serve a 50M-document corpus?`,
    checkQuestions: [
      {
        q: `You need to build a semantic search system for 50M product descriptions with P99 latency < 15ms and recall@10 > 0.95. Choose an architecture.`,
        options: [
          `A) Cross-encoder only over all 50M items in parallel on a large GPU cluster — achieves the highest precision without a retrieval stage`,
          `B) Bi-encoder (SBERT/E5) for offline encoding of all 50M items, HNSW index (ef_search=100, recall@100 ≈ 0.97, ~2ms), cross-encoder re-ranking of top-50 retrieved candidates on GPU (~10ms) — total ~12ms, within 15ms budget, recall@10 > 0.95`,
          `C) BM25 keyword retrieval for speed, with a cross-encoder re-ranker to recover semantic matches missed by the keyword index`,
          `D) Single bi-encoder with exact nearest neighbour search — no ANN approximation ensures recall@10 > 0.95 without a re-ranking stage`,
        ],
        answer: `B`,
      },
    ],
  },
  {
    id: 'ml_platform',
    title: 'ML Platform Design',
    subtitle: 'Feature store, training infra, model registry, serving infra, observability',
    difficulty: 'advanced',
    estimatedMin: 25,
    tags: ['ML platform', 'MLOps', 'infrastructure', 'system design'],
    summary: `Two teams building separate models both need user purchase history. One computes it in Spark, the other in Python, with slightly different null-handling and timezone logic. Their models see different feature values at training time. During serving, the real-time computation diverges further. Meanwhile, a third team is building the same feature for a third model. Each team is debugging a different version of the same thing. An ML platform solves the coordination problem: features are computed once, registered centrally, and consumed by any model.

Training pulls point-in-time correct historical features. Serving retrieves the same computation at low latency. The investment only makes sense at scale — for a single model with two data scientists, bespoke infrastructure is simpler. For ten models across multiple teams, the platform amortises its cost rapidly and the alternative becomes a coordination disaster.`,
    keyPoints: [
      `**The feature store solves the coordination problem: features are computed once, registered centrally, and consumed by any model with point-in-time correctness.**\n\nWithout a feature store, each team reinvents the same features with subtle divergences—different null handling, different timezone logic, different aggregation windows. When models go to production, training-serving skew appears: the feature computed at training time and the feature computed at serving time diverge. Debugging this across three separate implementations is a week of engineering time per incident.`,
      `**A model registry with versioning and lineage is what enables one-click rollback—without it, rollback means finding the correct artifact manually and hoping nothing changed in the serving environment.**\n\nThe registry connects a deployed model to its training run, the training data it used, and its evaluation metrics. When a model degrades in production, rollback is a single API call rather than an investigation. This is not a nice-to-have: the first time a production model degrades without a registry, the investigation takes days.`,
      `**Build the platform when you have 10+ models across teams; before that, the overhead exceeds the value.**\n\nFor 1–2 models, bespoke infrastructure is simpler and faster. The break-even point is roughly 5 models with shared features, where deduplication of feature computation and serving infrastructure starts saving more time than the platform itself costs to maintain. The common failure mode is building platform infrastructure before any model is in production—premature abstraction with no users to amortize it.`,
    ],
    interactivePrompt: `Before you touch the controls: if two teams compute the same feature independently with slightly different logic, what is the downstream consequence when both models go to production?`,
    checkQuestions: [
      {
        q: `A startup has 3 data scientists building their first production ML model. Should they build an ML platform?`,
        options: [
          `A) Yes — a feature store prevents training-serving skew from day one, and it is easier to build the platform before models exist than to retrofit it later`,
          `B) Yes — model registry and serving infrastructure are required for any production deployment regardless of team size`,
          `C) Yes, but only the online feature store component — offline training infrastructure can be deferred until a second model is added`,
          `D) Not yet — start with MLflow/W&B for experiment tracking, FastAPI + Docker for serving, pandas/SQL features versioned in git, and manual dashboards; invest in platform infrastructure when you have > 3 production models, > 5 data scientists, or > 20% of engineering time going to tooling`,
        ],
        answer: `D`,
      },
    ],
  },
  {
    id: 'ranking_systems',
    title: 'Learning-to-Rank Systems',
    subtitle: 'Pointwise vs pairwise vs listwise, LambdaMART, position bias, online distillation',
    difficulty: 'advanced',
    estimatedMin: 25,
    tags: ['LTR', 'learning-to-rank', 'LambdaMART', 'position bias'],
    summary: `Training a classifier to predict relevance and then sorting by score is not the same as training a ranker. A classifier optimized for per-item accuracy can assign correct absolute scores to every item individually but still produce the wrong ordering — because ranking is a relative problem, not an absolute one. Pointwise LTR misses this. Pairwise LTR fixes it for pairs but ignores that NDCG improvements at rank 1 matter far more than at rank 100. Listwise LTR optimizes the whole list but is computationally expensive and sensitive to label noise. The practical answer for tabular ranking (web search, ad ranking) is LambdaMART — gradient boosted trees with gradients derived from NDCG impact — which combines the training speed of GBMs with ranking-aware loss. The deeper problem that none of these fixes on their own is position bias: click data is contaminated by which position items were shown at, and training on raw clicks teaches the model position effects rather than relevance.`,
    keyPoints: [
      `**LambdaMART is the production workhorse: gradient boosted trees with gradients derived from NDCG impact, combining training speed with ranking-aware loss.**\n\nAt each boosting step, each item's gradient is the sum of LambdaRank gradients over all pairs involving that item, weighted by NDCG impact. A swap at rank 1 vs 2 receives a much larger gradient than a swap at rank 98 vs 99. This makes the training signal NDCG-aware without requiring NDCG to be differentiable—which it isn't.`,
      `**Position bias is the correctness problem that ranking-aware loss alone cannot fix: click data is contaminated by which position items were shown at.**\n\nPosition 1 gets roughly 10× the clicks of position 10 regardless of relevance. Training on raw clicks teaches the model to surface whatever the previous model already ranked highly—a self-reinforcing loop. The fix is Inverse Propensity Weighting: weight each training example by 1/P(click|position), so items shown at position 1 get low weight and items shown at position 5 get high weight.`,
      `**Online distillation decouples model quality from serving latency: a large teacher model is trained offline with expensive features, and a small student model matches its rankings without needing those features at inference time.**\n\nThe teacher's expensive features (cross-attention, full user history) drive label quality without incurring serving cost. The student matches the teacher's ranking on held-out data and serves at low latency. This is the standard pattern when the most accurate model is too slow to serve directly.`,
    ],
    interactivePrompt: `Before you touch the controls: if a classifier assigns correct relevance scores to every item individually, why might it still produce the wrong ranking?`,
    checkQuestions: [
      {
        q: `Your LTR model is trained on click data but evaluation shows much better precision@1 for bottom-ranked positions than top-ranked ones. What is the cause and fix?`,
        options: [
          `A) Position bias — top positions receive more clicks regardless of relevance, so training on raw clicks teaches the model to rank previously-top-positioned items higher (self-reinforcing loop); fix with Inverse Propensity Scoring (weight examples by 1/P(click|position)), randomisation experiments for unbiased data, and trusting lower-position clicks more`,
          `B) Label noise — bottom-ranked items have fewer clicks so their labels are noisier; fix by collecting more human editorial judgements for items shown at lower positions`,
          `C) Overfitting to head queries — the model performs well on rare tail queries at lower positions but overfits to high-frequency head queries shown at top positions; fix with query frequency-weighted sampling`,
          `D) Feature leakage — item popularity features are correlated with historical position, so the model learns a proxy for position rather than relevance; fix by removing popularity features from the training set`,
        ],
        answer: `A`,
      },
    ],
  },
  {
    id: 'real_time_ml',
    title: 'Real-Time ML',
    subtitle: 'Streaming features, model latency SLAs, caching strategies, throughput batching',
    difficulty: 'advanced',
    estimatedMin: 25,
    tags: ['real-time ML', 'latency', 'streaming', 'caching', 'serving'],
    summary: `A fraud detection model that returns results in 500ms is worthless — the transaction either completes in 200ms or the user abandons. A recommendation model that takes 2 seconds to load the page has already lost the session. Real-time ML has a hard constraint that batch ML does not: the prediction must be available before the user's patience runs out. Every additional feature improves accuracy but adds latency. Every additional model layer improves accuracy but adds latency. Designing a real-time ML system is an exercise in making these tradeoffs explicit with numbers — not "this adds some latency" but "this adds 15ms and the SLA is 50ms, so we have 35ms left for everything else." The fundamental challenge is that the people who build models optimize for accuracy and the people who build serving infrastructure optimize for latency, and they are often different people with different incentives.`,
    keyPoints: [
      `**The latency budget must be broken down before deployment, not discovered in production—each component has a hard allocation and exceeding any one cascades through the rest.**\n\nA typical 50ms fraud budget: feature retrieval 5–10ms, model inference 10–20ms, network overhead 2–5ms, serialization 1–2ms. If model inference alone takes 40ms, there is no room for feature retrieval. Profile the full end-to-end system before committing to a model architecture, because the bottleneck is almost never where engineers expect it.`,
      `**Async fan-out for feature retrieval is non-negotiable: issue all feature store requests in parallel and wait for the max, not the sum.**\n\nFour features each taking 8ms in parallel cost 8ms total; in serial they cost 32ms. Every real-time ML system with multiple feature sources must implement async fan-out. The corollary: design a timeout so that a slow feature source triggers a default value rather than blocking the entire request past the latency SLA.`,
      `**Every real-time ML system must have a documented fallback defined before deployment—not improvised during an incident.**\n\nWithout a predefined fallback, engineers make hasty decisions under pressure during incidents and consistently make them worse. Define the response to 'what happens when the model endpoint is slow or unavailable': popularity-based response, rule-based scoring, or previous cached prediction. Circuit breaker pattern: if error rate exceeds a threshold for 30 seconds, route all traffic to the fallback immediately.`,
    ],
    interactivePrompt: `Before you touch the controls: if a model has 150ms P99 latency and the SLA is 50ms, where in the stack would you look first to find the bottleneck?`,
    checkQuestions: [
      {
        q: `Your payment fraud model has a 150ms P99 latency but the payment processing SLA requires < 50ms. What is your approach?`,
        options: [
          `A) Increase the model\`s decision threshold to reduce the number of fraud alerts, which reduces the number of expensive downstream lookups and brings average latency down`,
          `B) Move fraud scoring to a nightly batch job and use the previous day\`s risk scores at transaction time, accepting staleness in exchange for eliminating real-time inference entirely`,
          `C) Profile to break down the 150ms (feature retrieval, inference, network); co-located Redis for features (<2ms, async parallel fetch); ONNX+TensorRT or GBM (~5ms) with INT8 quantisation; precompute user risk scores via streaming pipeline cached in Redis (serving = cache lookup + lightweight adjustment); if still >50ms, use async decision — let transaction proceed, score in parallel, reverse if fraudulent within 30s`,
          `D) Add a request queue and process fraud checks sequentially to avoid resource contention, which stabilises P99 by eliminating tail latency spikes from concurrent requests`,
        ],
        answer: `C`,
      },
    ],
  },
]
