// interviewExtraSystems.js — senior/staff ML interview bank (System Design, Architecture, Features, Spark).
// Authored 2026-07-02. Original questions and answers; grounded in real FAANG interview patterns,
// no text reproduced from any source. Shape matches the InterviewPrep bank exactly.
// cat ∈ {'System Design','Architecture','Features','Spark'}
// company ∈ {'Meta','Spotify','Google','Airbnb','Uber','Netflix','Amazon','Any'}
// level ∈ {'Mid','Senior','Staff'}

export const EXTRA_SYSTEMS = [
  // ─────────────────────────────── System Design (9) ───────────────────────────────
  {
    id: 1001,
    cat: 'System Design',
    company: 'Meta',
    level: 'Senior',
    q: 'Design the ranking system for a personalized home feed serving 2B daily users. Walk me through the retrieval-to-ranking funnel and where you spend your latency budget.',
    answer:
      'I would decompose it into a multi-stage funnel because ranking every candidate with a heavy model is infeasible: with millions of eligible posts and a ~150ms budget you cannot score more than a few hundred with a deep net. Stage 1 retrieval pulls ~500–2000 candidates per user from multiple sources — a two-tower embedding ANN index (HNSW/FAISS) for personalization, plus recency and social-graph sources (posts from friends/followed pages) — unioned and deduped. Stage 2 lightweight ranking (a small GBT or shallow MLP over cheap features) trims to ~100–300. Stage 3 heavy ranking runs a multi-task DNN predicting p(like), p(comment), p(share), p(dwell), p(hide), combined into a single value with tuned weights (value = w1·pLike + w2·pComment − w3·pHide …). Stage 4 is a re-ranking/policy layer for diversity (MMR to avoid five posts from one author), integrity down-ranking, and business constraints. Latency budget: retrieval ~30ms (ANN is the cost), light rank ~10ms, heavy rank ~40–60ms batched on GPU, re-rank ~10ms. I would cache user embeddings (refreshed every few minutes) and precompute item embeddings offline so serving is just the interaction/ranking layers.',
    whatsTested:
      'Whether you can structure a real recsys as a staged funnel and reason about latency budget rather than proposing one giant model.',
    antiPattern:
      'Proposing a single deep model that scores every candidate — it ignores that you have millions of items and ~150ms, so it is physically un-servable. Also naming "collaborative filtering" as a whole answer without a retrieval/ranking split.',
    staffFraming:
      'A staff answer ties the funnel to objective design: the multi-task heads exist because raw engagement optimizes for the wrong thing (clickbait, outrage), so the value model blends survey-based "worth your time" signals and down-weights p(hide)/p(report). It also names the offline/online loop — how logged impressions become training data, the position-bias and selection-bias correction needed, and how you would run this as a shadow ranker before ramping.',
  },
  {
    id: 1002,
    cat: 'System Design',
    company: 'Spotify',
    level: 'Senior',
    q: 'Design the recommendation system behind a weekly personalized playlist like Discover Weekly. How do you balance personalization with discovery of genuinely new music?',
    answer:
      'The core tension is exploit (tracks the user will obviously like) vs explore (tracks that expand taste and drive long-term retention). I would blend three candidate sources: (1) collaborative filtering — matrix factorization or a two-tower model over implicit feedback (streams, skips, saves, completion rate), which captures "users like you also played X"; (2) content-based — audio embeddings (from a CNN over spectrograms) plus NLP over playlist co-occurrence and editorial/tags, crucial for cold-start tracks with no play history; (3) an exploration bucket seeded by contextual bandits so we deliberately surface adjacent-but-unheard artists. Ranking scores candidates on p(stream ≥ 30s) and p(save), then a diversity/novelty pass enforces artist and genre spread and injects a controlled fraction of novel tracks (say 20–30% the user has never encountered). Skips are the strongest negative signal — a fast skip is a hard negative, a completion is a strong positive. I would evaluate offline on hit-rate/NDCG but the real metric is week-over-week save rate and 4-week retention, because a playlist that is too safe underperforms on discovery even if short-term streams look fine.',
    whatsTested:
      'Whether you understand the exploit/explore tradeoff, cold-start via content/audio embeddings, and that implicit feedback (skips) needs careful treatment.',
    antiPattern:
      'Pure collaborative filtering only — it collapses into a popularity/echo chamber, never surfaces new artists, and cannot handle cold-start tracks. Treating a play and a skip as equal-weight is another junior tell.',
    staffFraming:
      'Staff level frames it as a long-term-value optimization, not next-click: too much exploit erodes discovery and churns power users, so you A/B test on retention and lifetime streams, not just weekly engagement. It also addresses feedback loops — the model trains on what it recommended, so you need exploration to avoid a self-reinforcing narrowing of taste, and off-policy correction (inverse propensity weighting) when learning from logged bandit data.',
  },
  {
    id: 1003,
    cat: 'System Design',
    company: 'Google',
    level: 'Staff',
    q: 'Design a large-scale search ranking system. How do you combine classic retrieval signals with learned models, and how do you evaluate quality?',
    answer:
      'Search is retrieval then ranking. Retrieval is two complementary paths: lexical (an inverted index with BM25 over billions of docs, fast and precise for rare terms) and semantic (dense dual-encoder embeddings + ANN, which catches paraphrase and intent when the query and doc share no keywords). I union both candidate sets — typically a few thousand docs — into an L1 ranker. L1 is a fast model (GBT / lightweight linear) that prunes to a few hundred using cheap features: BM25 score, embedding similarity, click-through-rate priors, freshness, authority (PageRank-style). L2 is the expensive learning-to-rank model — a cross-encoder or deep pairwise/listwise model (LambdaMART-style objective optimizing NDCG directly) that jointly attends to query and document. For evaluation you need two tracks: offline you use human-rated relevance labels (graded 0–4) to compute NDCG and use interleaving experiments; online you measure CTR at position, long-clicks / dwell (a click followed by no return-to-SERP within seconds is a satisfied click), and abandonment. Interleaving is far more sensitive than A/B for ranking because it controls for the query distribution within a single session.',
    whatsTested:
      'Whether you know retrieval combines lexical and semantic, that ranking is a cascade optimizing a rank metric (NDCG), and that ranking evaluation uses interleaving + long-click signals.',
    antiPattern:
      'Treating search as a classification problem ("relevant vs not") and optimizing accuracy. Ranking is inherently ordinal — you optimize NDCG/MRR, and plain CTR is biased by position, so raw clicks as the only label misleads.',
    staffFraming:
      'Staff adds the sensitivity/measurement argument: interleaving detects a ranking change with orders of magnitude less traffic than A/B, and long-click/dwell is a better proxy for satisfaction than CTR (which optimizes clickbait titles). It also owns the training-label problem — click logs are position- and presentation-biased, so you need a position-bias model (examination hypothesis) or randomized traffic to debias before training the LTR model.',
  },
  {
    id: 1004,
    cat: 'System Design',
    company: 'Meta',
    level: 'Staff',
    q: 'Design an ads ranking and auction system. How do you predict click/conversion probability at scale and turn that into what ad wins and what the advertiser pays?',
    answer:
      'Ads ranking maximizes a value that aligns the platform, user, and advertiser. The rank score is roughly eCPM = bid × pCTR × pConversion (× a quality/relevance term), so you rank ads by expected value per impression, not raw bid — this is why a lower bid with high predicted relevance can win. The pCTR/pCVR models are the heavy lift: massive sparse-feature models (embeddings over user, ad, advertiser, context — think DLRM/DCN-style architectures with feature crosses) trained on billions of impressions, retrained frequently because ad content and user intent drift fast. Calibration is critical: unlike organic ranking where relative order suffices, ads need well-calibrated absolute probabilities because pCTR multiplies the bid and sets the price — a miscalibrated model overcharges or underdelivers, so you apply isotonic/Platt calibration and monitor predicted-vs-actual CTR. The auction is typically a generalized second-price or VCG variant: winner pays the minimum bid needed to keep its position, which makes truthful bidding near-optimal. Serving is a funnel: candidate ad retrieval by targeting/budget eligibility, a light pre-ranker, then the heavy pCTR/pCVR model, then the auction and pacing/budget layer.',
    whatsTested:
      'Whether you understand that ad rank = expected value (bid × predicted probability), that probabilities must be calibrated because they set price, and the basics of a second-price auction.',
    antiPattern:
      'Ranking ads purely by bid amount (highest bidder wins) — it ignores relevance, tanks user experience, and is not how modern auctions work. Also treating pCTR as a pure ranking model where only order matters — in ads, calibration of the absolute value is load-bearing.',
    staffFraming:
      'Staff framing owns the incentive and delayed-feedback problems: conversions arrive hours-to-days later, so pCVR training needs delayed-feedback modeling (importance weighting for not-yet-converted samples) rather than treating recent negatives as true negatives. It also reasons about budget pacing as a control problem (spend the daily budget smoothly, not in the first hour), auction truthfulness, and the marketplace equilibrium — changes to ranking shift advertiser bidding behavior, so you evaluate on long-run advertiser ROI and platform revenue, not a single day.',
  },
  {
    id: 1005,
    cat: 'System Design',
    company: 'Uber',
    level: 'Senior',
    q: 'Design a real-time ETA prediction system for a ride-hailing platform. What signals do you use and how do you keep it fresh under changing traffic?',
    answer:
      'ETA is a regression over a route, and the naive "distance / average speed" fails because it ignores live traffic, time-of-day, weather, and road-segment quirks. I would model it in two layers. A routing layer computes candidate paths on a road graph where each edge (segment) has a predicted traversal time; a graph model (increasingly a GNN, historically gradient-boosted per-segment models) predicts per-edge speed from historical speed profiles by hour/day, live GPS traces from active trips (the freshest signal — aggregated speeds over the last few minutes), weather, and events. The ETA is the sum of edge times plus intersection/turn penalties, then a top-level correction model (GBT) adjusts the summed estimate using trip-level features (pickup congestion, driver behavior, historical residuals on this origin-destination pair) because errors compound along a route. Freshness is the hard part: I stream live GPS into a feature store / real-time aggregation (windowed speed per segment updated every 1–2 minutes) so the model reflects a crash or surge immediately. I would serve with tight p99 latency (sub-100ms) via cached segment predictions refreshed on a stream, and evaluate on MAPE and calibrated quantiles — because a systematically optimistic ETA is worse than a slightly high one for rider trust.',
    whatsTested:
      'Whether you decompose ETA into per-segment prediction + route aggregation, use live streamed GPS as a freshness signal, and think about calibration/asymmetric error costs.',
    antiPattern:
      'A single model that maps origin/destination straight to a time with static historical averages — it cannot react to live incidents, and summing has no notion of the actual road graph. Ignoring that under-estimating and over-estimating ETA have asymmetric business cost.',
    staffFraming:
      'Staff level treats freshness and the streaming feature pipeline as the core engineering problem: the model is only as good as how fast live speed aggregates flow in, so you design the real-time feature store, windowing, and backfill for late GPS. It also frames the loss asymmetrically (pinball/quantile loss so you can bias toward slightly conservative ETAs) and connects ETA quality to downstream systems — dispatch, surge pricing, and driver dispatch all consume it, so a regression here cascades.',
  },
  {
    id: 1006,
    cat: 'System Design',
    company: 'Airbnb',
    level: 'Senior',
    q: 'Design search ranking for a two-sided marketplace where a guest searches listings. How is this different from ranking one-sided content, and what do you optimize?',
    answer:
      'The defining difference is two-sidedness: a listing is inventory a host controls and can decline, and a booking removes that listing from availability, so you are not just predicting a click — you are matching supply to demand under constraints. The objective is not CTR but booking probability and, ultimately, uncancelled-completed-booking value. I would build a learning-to-rank model whose primary label is "did this search lead to a booking of this listing," with features spanning guest (location, past bookings, price sensitivity), listing (price, reviews, amenities, quality/photos, instant-book eligibility), and query-listing interaction (distance to searched area, date availability, price relative to query budget), plus embeddings that capture guest and listing in a shared space so you get personalization and cold-start via similar listings. Beyond pure booking-probability you must inject marketplace health: you re-rank for diversity of price and type, avoid over-concentrating demand on a few top listings (which hurts host supply and creates a fragile marketplace), and account for host rejection probability so you do not rank listings that will decline. Evaluation is online booking conversion and NDCG on booking labels offline, but you also watch host-side metrics (rejection rate, supply retention).',
    whatsTested:
      'Whether you recognize two-sided marketplace dynamics — booking (not click) as the label, host-side constraints, and marketplace-health re-ranking rather than pure relevance.',
    antiPattern:
      'Treating it like content ranking optimizing CTR/clicks. Clicks do not pay — a listing that gets clicks but never books, or that hosts always decline, is worthless. Ignoring the supply side and over-concentrating demand on a handful of listings.',
    staffFraming:
      'Staff framing owns the systemic tradeoff: greedily maximizing per-search booking probability can starve host supply and create winner-take-all concentration, so you optimize marketplace-level GMV and long-run supply liquidity, sometimes deliberately spreading demand. It also addresses the sparse-label problem (bookings are rare vs impressions) with staged labels (click → contact → book) and the location/seasonality biases that make naive offline metrics misleading.',
  },
  {
    id: 1007,
    cat: 'System Design',
    company: 'Netflix',
    level: 'Staff',
    q: 'Design the personalization system for a video streaming home page — rows of titles, artwork, and ordering. What are you actually optimizing and how do you evaluate it?',
    answer:
      'The home page is a page-construction problem, not a single ranked list: you choose which rows (genres/themes) to show, which titles go in each row, the order of rows, and even the artwork per title per user. The north-star is long-term member retention (does this member keep their subscription), not clicks, because a thumbnail that gets a play but leads to a bad session hurts retention. Concretely I would use several models: a title-ranking model predicting p(the member will start and meaningfully watch this title) per candidate, a row-generation/selection model that assembles thematically coherent rows and diversifies them, and a contextual-bandit artwork selection model (different members respond to different images of the same title). Signals are watch history, completion, time-of-day/device, and short-vs-long session patterns. I would rank titles with a personalized model over embeddings, then do page-level optimization (diversity across rows, avoid repeating a title, freshness of new releases) rather than independently ranking each slot. Evaluation is hard: offline you use replay/counterfactual metrics and take-rate on historical logs, but the decision metric is A/B tested retention and engagement over weeks, since a page can look great on day-1 clicks and still not move retention.',
    whatsTested:
      'Whether you frame home-page personalization as page-level construction optimizing long-term retention, and understand bandit-driven artwork and offline/online eval mismatch.',
    antiPattern:
      'Ranking every title by predicted click and filling the page top-down. That ignores row structure, diversity, artwork personalization, and — critically — optimizes short-term clicks instead of retention, which are often anti-correlated (clickbait).',
    staffFraming:
      'Staff owns the metric philosophy: engagement is a proxy and can diverge from retention, so the system is designed and A/B tested against member retention over long horizons, and offline metrics (take-rate, replay) are only directional. It also handles the exploration and feedback-loop problem — new titles have no history, so bandits with exploration prevent the page from freezing around a member\'s past behavior — and it reasons about page-level combinatorics rather than independent slot ranking.',
  },
  {
    id: 1008,
    cat: 'System Design',
    company: 'Any',
    level: 'Senior',
    q: 'Design a feature platform (feature store) that serves the same features to training and online inference. What are the core components and the hardest correctness problem?',
    answer:
      'A feature platform has to solve one thing above all: the same feature definition must produce the same value offline (for training) and online (for serving), or you get train/serve skew. Core components: (1) a feature registry/definitions layer where a feature is declared once (its source, transformation, entity key, TTL) so training and serving share one definition; (2) an offline store — a data lake / warehouse (Parquet on S3, or a table in BigQuery/Snowflake) holding historical feature values for generating training sets; (3) an online store — a low-latency key-value store (Redis, Cassandra, DynamoDB) holding the latest feature value per entity for sub-10ms lookups at serving; (4) ingestion pipelines: batch jobs materialize features into both stores, and streaming pipelines update the online store for fresh features. The hardest correctness problem is point-in-time correctness when building training sets: for a label at time T you must join the feature value as it was at T, not the current value — otherwise you leak future information and offline metrics look inflated while production underperforms. That requires "as-of" / point-in-time joins on event-time, not naive joins. The second hard problem is guaranteeing the offline materialization logic and the online transformation logic are literally the same code path, so skew cannot creep in.',
    whatsTested:
      'Whether you understand the offline/online store split, point-in-time correctness for training-set generation, and that train/serve skew is the central failure mode a feature store exists to prevent.',
    antiPattern:
      'Describing it as "a database of features" without the offline/online distinction, and generating training sets with naive joins to current feature values — which silently leaks the future and produces a model that looks great offline and fails live.',
    staffFraming:
      'Staff framing centers the single-definition, single-code-path principle: skew is prevented by construction (one transformation authored once, executed in both worlds) plus point-in-time joins, not by after-the-fact monitoring. It also owns operational concerns — feature freshness SLAs, backfill of new features onto historical data for training, TTLs and staleness handling, and ownership/governance so a hundred teams do not redefine the same feature five subtly different ways.',
  },
  {
    id: 1009,
    cat: 'System Design',
    company: 'Uber',
    level: 'Staff',
    q: 'Design a real-time fraud detection system for a payments/marketplace platform. How do you catch fraud fast without blocking legitimate users, given extreme class imbalance?',
    answer:
      'Fraud is a low-latency, extreme-imbalance, adversarial problem, so the design has three tiers. First a synchronous inline model at transaction time (must return in tens of ms) that scores each transaction and either allows, challenges (step-up auth), or blocks — kept relatively simple/fast (GBT over streaming features) because it is in the critical path. Second an asynchronous near-real-time layer that runs heavier models and graph analysis (linking accounts/devices/cards to spot fraud rings) within seconds and can retroactively freeze. Third an offline layer for investigation, label generation, and retraining. Features are heavily velocity/aggregation-based: transactions per card per hour, device-account fan-out, time-since-signup, geo-velocity (two cities in five minutes), and graph features. On imbalance (fraud may be <0.1%): I do not chase accuracy — I optimize precision/recall at an operating point set by the cost tradeoff (a false positive blocks a real customer; a false negative is a chargeback), use PR-AUC not ROC-AUC, and calibrate thresholds per segment. Because labels arrive late (chargebacks take weeks) and fraudsters adapt, the system must retrain frequently and use human-in-the-loop review to generate fresh labels.',
    whatsTested:
      'Whether you design tiered synchronous/async scoring under latency limits, use velocity/graph features, and handle extreme imbalance with PR-AUC and cost-based thresholds instead of accuracy.',
    antiPattern:
      'Optimizing accuracy on a 0.1%-positive dataset (a model predicting "never fraud" is 99.9% accurate and useless), or running one heavy model synchronously that blows the latency budget. Ignoring the adversarial/label-delay reality and treating it as a static classification task.',
    staffFraming:
      'Staff owns the adversarial and cost dynamics: fraudsters adapt to your model, so you plan for concept drift with rapid retraining, champion/challenger deployment, and monitoring for score-distribution shifts that signal a new attack. It frames the threshold as a business decision (dollar cost of FP vs FN per segment), builds the label-generation loop (chargebacks + analyst review) as first-class, and uses graph/entity features to catch coordinated rings that per-transaction models miss.',
  },

  // ─────────────────────────────── Architecture (6) ───────────────────────────────
  {
    id: 1010,
    cat: 'Architecture',
    company: 'Any',
    level: 'Senior',
    q: 'Your model serving endpoint has a p99 latency of 400ms but a p50 of 30ms, and the SLA is p99 < 100ms. How do you diagnose and fix the tail latency?',
    answer:
      'A big p50/p99 gap means the average request is fine but a tail is pathological — I attack it systematically. First I break down where the 400ms goes: feature fetching (often the culprit — a slow cache miss hitting the source store), model inference, network, and serialization. I would add per-stage tracing. Common tail causes and fixes: (1) feature-store cache misses — a p99 miss goes to the backing DB; fix with better cache warming, higher TTL, or hedged requests. (2) Garbage collection / JIT pauses — a JVM GC pause spikes tail; fix with tuning or a runtime without stop-the-world pauses. (3) Batching-induced queueing — dynamic batching for GPU efficiency adds wait time; cap the batch timeout so a request never waits more than a few ms. (4) Noisy-neighbor / cold instances after autoscale-up — new pods have cold caches. Concrete tactics for the tail specifically: request hedging (fire a duplicate to a second replica after a short delay and take the first response — this collapses the tail without doubling normal load), timeouts with graceful fallback (serve a cheaper cached prediction if the heavy path exceeds budget), and load-shedding under pressure. p99 is about the worst 1%, so I optimize for consistency, not just the mean.',
    whatsTested:
      'Whether you can diagnose tail latency by stage, name real tail causes (cache misses, GC, batch queueing), and apply tail-specific fixes like hedged requests and fallbacks.',
    antiPattern:
      'Trying to "make the model faster" (which mostly moves p50) when the problem is the tail. Ignoring that p99 is dominated by cache misses, GC pauses, and queueing — not raw compute — and not measuring per-stage before optimizing.',
    staffFraming:
      'Staff framing separates median optimization from tail-latency engineering as distinct disciplines: the tail is a systems/queueing problem (Little\'s law, hedging, load-shedding, timeout-with-fallback), and you design for graceful degradation so a slow dependency degrades quality rather than breaching SLA. It also sets the SLA as a product contract with a fallback path (cached or simpler model) so the system is never in a state where a single slow feature fetch takes down the endpoint.',
  },
  {
    id: 1011,
    cat: 'Architecture',
    company: 'Any',
    level: 'Senior',
    q: 'When would you serve a model with precomputed (batch/offline) predictions versus computing them online in real time? Walk through the tradeoffs.',
    answer:
      'The decision hinges on how many distinct inputs you have, how fresh predictions must be, and your latency budget. Precompute (batch) when the input space is enumerable and stable: e.g., "recommended items for each of 50M users" computed nightly and written to a KV store — serving is then a sub-ms lookup, cost is amortized, and there is no inference latency at request time. It fails when inputs are combinatorial or context-dependent (you cannot precompute a prediction for every possible query × user × time-of-day) or when freshness matters (a fraud score must reflect the current transaction, a feed must react to a post from a minute ago). Online (real-time) inference computes on the fly: it handles unbounded/contextual inputs and fresh features, at the cost of serving infra, latency budget, and higher operational complexity. Most real systems are hybrid: precompute the expensive parts (user/item embeddings offline) and combine them online with fresh context (the current session, real-time features) in a light interaction layer — this is exactly the two-tower pattern where item embeddings are batch-computed and indexed while the query tower runs online. A useful rule: precompute what is stable and expensive; compute online what is fresh and contextual.',
    whatsTested:
      'Whether you can reason about the precompute-vs-online tradeoff along input cardinality, freshness, and latency — and recognize the hybrid pattern most systems actually use.',
    antiPattern:
      'A blanket "always real-time for freshness" or "always batch for cost" answer. Missing that combinatorial input spaces cannot be precomputed, and not recognizing the hybrid (precompute embeddings, combine online) that dominates production recsys.',
    staffFraming:
      'Staff framing generalizes it to a caching/materialization spectrum and ties it to cost-at-scale: precomputation trades storage and staleness for latency and compute cost, and the right split is per-component, not per-system. It also owns the operational consequences — batch pipelines need freshness monitoring and backfill, online paths need capacity planning and fallback — and frames the two-tower/embedding split as the canonical way to get both cheap serving and fresh personalization.',
  },
  {
    id: 1012,
    cat: 'Architecture',
    company: 'Netflix',
    level: 'Staff',
    q: 'How do you safely roll out a new model version to production traffic? Walk me through your deployment strategy and the guardrails.',
    answer:
      'I never flip 100% of traffic to a new model. The progression is: offline validation → shadow → canary/A-B → gradual ramp → full, with automated rollback at every stage. Offline: the new model must beat the incumbent on held-out metrics and pass calibration and slice checks (no regression on key segments). Shadow deployment: the new model scores real production traffic in parallel but its predictions are not served — this validates latency, throughput, and that feature pipelines produce sane values at serving time (catches train/serve skew before any user sees it). Canary / A-B: route a small slice (1–5%) to the new model and compare online business metrics with proper significance testing, watching guardrail metrics (latency p99, error rate, and product KPIs) as well as the target metric. Gradual ramp: increase 5% → 25% → 50% → 100% with automated rollback triggers if any guardrail breaches. Guardrails include serving-error rate, latency SLA, prediction-distribution drift vs the incumbent, and the business KPI. The whole thing is automated with a clear rollback: model versions are immutable artifacts behind a router, so rollback is a config change, not a redeploy.',
    whatsTested:
      'Whether you know the shadow → canary → ramp progression, the distinction between shadow (validate infra/skew) and A-B (validate impact), and automated guardrails/rollback.',
    antiPattern:
      'Deploying the new model to all traffic at once because "offline metrics improved." Offline gains do not guarantee online wins (feature skew, distribution shift), and a bad model at 100% is an incident. Skipping shadow mode and discovering serving-time feature bugs in front of users.',
    staffFraming:
      'Staff framing treats rollout as a risk-management system, not a step: immutable model artifacts behind a routing layer so any version is instantly addressable, automated statistical stopping rules, guardrail metrics with pre-agreed thresholds, and rollback as a one-config-change operation. It also owns the org-level concern — model rollout hygiene applies across dozens of teams, so this is a platform capability (a deployment framework with built-in shadow/canary/guardrails) rather than something each team reinvents.',
  },
  {
    id: 1013,
    cat: 'Architecture',
    company: 'Meta',
    level: 'Staff',
    q: 'A deep ranking model is too slow and expensive to serve at your QPS. How do you make it servable without meaningfully losing quality?',
    answer:
      'I would pursue several levers, prioritizing the cheapest quality tradeoff. (1) Knowledge distillation — train a smaller student model to mimic the large teacher\'s outputs; you often keep the bulk of quality at a fraction of the cost, and this is the standard move for a too-heavy ranker. (2) Quantization — serve in int8/fp16 instead of fp32, cutting memory and latency with minimal accuracy loss, especially with quantization-aware training. (3) Reduce what the heavy model scores — tighten the funnel so the expensive model only ranks a few hundred candidates (a lightweight pre-ranker does the pruning), which attacks cost at the source. (4) Caching and precomputation — cache user-side embeddings/towers so per-request work is only the interaction layer; embeddings that change slowly can be refreshed periodically rather than per request. (5) Hardware/batching — dynamic batching on GPU/accelerators to amortize fixed cost, with a capped batch-wait so latency stays bounded. (6) Feature pruning — drop low-importance features that cost compute for little lift. I would quantify each: distillation and funnel-narrowing usually give the biggest cost win per unit of quality lost, and I would A-B the compressed model against the full one to confirm the online metric holds.',
    whatsTested:
      'Whether you know the model-efficiency toolkit — distillation, quantization, funnel/candidate reduction, embedding caching, batching — and can prioritize by cost-vs-quality.',
    antiPattern:
      'Only reaching for "use a bigger GPU" or "add more replicas" — that scales cost linearly instead of addressing efficiency. Or naively pruning the model until quality collapses without measuring the online metric.',
    staffFraming:
      'Staff framing quantifies the cost/quality Pareto frontier and picks operating points deliberately: distillation + quantization + funnel design together, each validated online, rather than a single trick. It also owns the systemic cost lens — at billions of QPS a 20% inference cost reduction is a large infra budget line — and separates work that is truly needed per-request (interaction layer) from work that can be precomputed and cached (towers/embeddings), which is where most of the savings live.',
  },
  {
    id: 1014,
    cat: 'Architecture',
    company: 'Amazon',
    level: 'Senior',
    q: 'Design the serving architecture for a recommendation model that must handle 100k QPS at p99 < 50ms. Where are the bottlenecks and how do you scale?',
    answer:
      'At 100k QPS with a 50ms tail, the request path has to be lean and horizontally scalable. Shape: a stateless serving layer (many replicas behind a load balancer, autoscaled on QPS/latency) so throughput scales linearly with replicas — nothing request-specific lives on the instance. The heavy per-request work is (a) feature fetching and (b) inference. Feature fetching is usually the first bottleneck: I keep hot features in a low-latency online store (Redis/DynamoDB/Cassandra) sized so p99 lookups stay ~1–5ms, and I batch feature reads into a single multi-get rather than N sequential calls. Inference: precompute item embeddings offline and index them (ANN) so the online model only runs the query tower + interaction layer; run inference on the accelerator with dynamic batching (capped wait) to amortize cost while respecting the tail. Caching: cache full recommendation results for popular/repeat contexts with a short TTL — even a modest hit rate slashes backend load at this QPS. Scaling levers: replicate stateless serving, shard the online feature store and ANN index by entity key, and put a request-hedging/timeout-fallback in front so a slow replica does not breach the SLA. I would capacity-plan headroom (target ~60–70% utilization) so a traffic spike or replica loss does not push the tail over budget.',
    whatsTested:
      'Whether you can architect a stateless, horizontally scalable serving tier, identify feature fetch as the common bottleneck, and use precompute/caching/sharding/hedging to hold a tight tail at high QPS.',
    antiPattern:
      'A stateful monolith that does everything per request and "scales" by vertical upgrades. Sequential feature fetches (N round-trips), no caching, no precomputed embeddings, and running at 95% utilization with no headroom — all of which blow the p99 the moment traffic moves.',
    staffFraming:
      'Staff framing treats it as a capacity + tail-latency problem: statelessness enables linear horizontal scaling, sharding the feature store and ANN index by key removes hotspotting, and headroom/utilization targets plus hedging and load-shedding keep the SLA under spikes and partial failures. It also reasons about the cost curve — caching and precomputation are not just latency wins, they are the difference between a viable and an unaffordable infra bill at 100k QPS.',
  },
  {
    id: 1015,
    cat: 'Architecture',
    company: 'Any',
    level: 'Senior',
    q: 'How do you set up monitoring for a model in production so you catch silent degradation? What do you actually alert on?',
    answer:
      'Model failures are usually silent — no exception is thrown, the model just gets worse — so I monitor at three layers. (1) Operational health: latency (p50/p99), throughput, error rate, resource saturation — standard SRE, alerts on SLA breach. (2) Data/feature health (the layer that catches most silent bugs): input feature distributions vs a training baseline (PSI or KL divergence per feature), null-rate spikes, out-of-range values, and freshness/staleness of streamed features. Most real "model got worse" incidents are actually an upstream data problem — a renamed column, a units change, a pipeline that started emitting nulls — and this layer catches them before the model metric moves. (3) Prediction/model health: prediction-distribution drift (is the score histogram shifting?), calibration monitoring (predicted vs actual rate on labeled samples), and the business/proxy metric where labels exist. The subtlety is that ground-truth labels are often delayed (conversions, chargebacks take days), so you cannot alert on accuracy in real time — you alert on the leading indicators (feature drift, prediction drift) and reconcile with delayed labels for the real quality signal. Concretely I would alert on: feature PSI > 0.25, null-rate deltas, prediction-distribution shift, calibration error, and any SLA breach.',
    whatsTested:
      'Whether you monitor operational, data/feature, and prediction layers — and understand that delayed labels force reliance on leading indicators (feature/prediction drift) rather than real-time accuracy.',
    antiPattern:
      'Only monitoring uptime/latency ("the service is up, so we\'re fine") while the model silently degrades. Or assuming you can alert on accuracy in real time when labels arrive days later. Missing that most degradation originates upstream in the data pipeline.',
    staffFraming:
      'Staff framing owns the leading-vs-lagging distinction: because labels lag, the system alerts on feature and prediction drift as early warnings and reconciles with delayed ground truth, closing the loop. It also frames data-quality monitoring as the highest-ROI investment (most incidents are upstream data bugs, not model bugs) and builds it as a platform capability with baselines, per-segment slicing, and automated retraining/rollback triggers rather than dashboards nobody watches.',
  },

  // ─────────────────────────────── Features (6) ───────────────────────────────
  {
    id: 1016,
    cat: 'Features',
    company: 'Any',
    level: 'Senior',
    q: 'What is train/serve skew, how does it actually happen, and how do you prevent it?',
    answer:
      'Train/serve skew is when a feature has a different value (or distribution) at training time than at serving time, so the model was trained on inputs it never actually sees in production — offline metrics look great and live performance is worse. It happens in a few classic ways: (1) different code paths — the training feature is computed in a Spark/SQL batch job and the serving feature in application code, and the two implementations diverge subtly (rounding, timezone, default handling). (2) Different data freshness — training uses a fully-materialized daily table but serving reads a real-time value that lags or is null. (3) Point-in-time errors — the training set joined the current feature value instead of the value as-of the label time, so training saw future-influenced features that serving cannot. (4) Missing-value handling differences between train and serve. Prevention: define each feature once and execute the same transformation in both worlds — this is the core reason feature stores exist. Concretely: share a single feature-definition/transformation library across training and serving, generate training data from the same store that serves online (with point-in-time joins), and add skew detection that logs served feature values and compares their distribution to the training distribution. The strongest guarantee is "one definition, one code path," so skew is prevented by construction rather than caught after.',
    whatsTested:
      'Whether you can name the concrete mechanisms of skew (divergent code paths, freshness, point-in-time, null handling) and the single-definition/feature-store prevention.',
    antiPattern:
      'Defining skew vaguely as "the model sees different data" without the mechanisms, or proposing to "just retrain more often" — retraining does not fix a feature that is computed differently in serving. Missing that duplicated transformation code is the root cause.',
    staffFraming:
      'Staff framing insists on prevention by construction: a single authored transformation executed identically offline and online, plus point-in-time-correct training-set generation, so skew cannot arise rather than being monitored after the fact. It also adds a detection safety net (log served features, compare to training distribution) and owns the org problem — many teams computing the "same" feature differently is an organizational failure a feature platform is meant to eliminate.',
  },
  {
    id: 1017,
    cat: 'Features',
    company: 'Any',
    level: 'Senior',
    q: 'A model shows suspiciously high offline performance — AUC 0.97 where the domain ceiling was ~0.85. Walk me through how you would find the data leakage.',
    answer:
      'AUC far above the plausible ceiling almost always means leakage — the model is seeing information at training time that will not be available at prediction time. My investigation: (1) Feature-timing audit — the top suspect is a feature that incorporates the future or the label itself. I would rank features by importance and inspect the top ones: is any of them computed after the event I am predicting? Classic examples: a "days_until_churn" style feature, an aggregate that includes the label period, or a field populated only for positive cases. (2) Target-adjacent features — a feature that is a near-proxy or downstream consequence of the label (e.g., predicting fraud but including "account_was_frozen," which only happens after fraud is confirmed). (3) Point-in-time correctness — was the feature joined as-of the label time or as its current value? A current-value join leaks future information for events between the label time and now. (4) Split contamination — target encoding or normalization computed on the full dataset before the split, or the same entity appearing in both train and test (need group-based splits). (5) Duplicate/near-duplicate rows straddling the split. I would test the hypothesis by removing the suspect feature and seeing AUC drop to the plausible range, and by inspecting whether the feature is even populated at true prediction time.',
    whatsTested:
      'Whether you treat implausible offline metrics as a leakage signal and can systematically hunt it — feature timing, target-adjacent features, point-in-time joins, split contamination.',
    antiPattern:
      'Celebrating the 0.97 AUC and shipping it. Or "the model is just really good" — a metric far above the domain ceiling is a red flag, not a triumph. Not auditing feature timing and split hygiene when metrics look too good.',
    staffFraming:
      'Staff framing internalizes "too good to be true is a bug, not a win," and builds guardrails so leakage is caught structurally: point-in-time joins by default, group/temporal splits, a rule that any feature must be provably available at prediction time, and leakage checks in the training pipeline. It also connects the offline/online gap — a leaked model looks great offline and craters live, so the discrepancy itself is a diagnostic signal you design monitoring around.',
  },
  {
    id: 1018,
    cat: 'Features',
    company: 'Uber',
    level: 'Senior',
    q: 'How do you engineer and serve real-time features — like "number of transactions in the last 5 minutes" — and what makes them hard compared to batch features?',
    answer:
      'Real-time aggregation features (windowed counts/sums over recent events) are powerful for fraud, ETA, and dynamic pricing, but they are hard because they must be fresh, computed consistently across train and serve, and correct under late/out-of-order data. Serving: a streaming pipeline (Flink/Kafka Streams/Spark Structured Streaming) maintains windowed aggregates keyed by entity and writes the current value into the online store for sub-ms lookup at inference. The hard parts: (1) Windowing semantics — sliding vs tumbling windows, and event-time vs processing-time. You want event-time windows (based on when the transaction happened) with watermarks to handle events that arrive late, otherwise a delayed event silently corrupts the count. (2) Train/serve consistency — the training set must reconstruct what the aggregate was as-of each label time (point-in-time), which means either logging the served feature value at request time or recomputing historical windows identically; the safest approach is to log the exact feature value that was served and train on those logs, guaranteeing zero skew. (3) State and freshness — maintaining per-entity window state at scale is a stateful-stream engineering problem with its own failure/restart/backfill concerns. So compared to batch features (compute nightly, materialize, done), real-time features add streaming infrastructure, event-time correctness, and a much harder point-in-time story.',
    whatsTested:
      'Whether you understand streaming windowed aggregation, event-time vs processing-time with watermarks, and the point-in-time/logging strategy that keeps real-time features skew-free.',
    antiPattern:
      'Computing "last 5 minutes" with processing-time windows and ignoring late/out-of-order events, or generating training data by recomputing aggregates without point-in-time correctness (leaking the future). Treating a real-time feature like a batch feature with a shorter schedule.',
    staffFraming:
      'Staff framing calls out logging served features as the cleanest skew guarantee (train on exactly what was served) and owns the streaming-systems reality: event-time correctness with watermarks, stateful aggregation at scale, and backfill/restart semantics. It weighs the cost — real-time features carry real infra and operational burden — and reserves them for cases where freshness genuinely moves the metric rather than adding them everywhere.',
  },
  {
    id: 1019,
    cat: 'Features',
    company: 'Any',
    level: 'Senior',
    q: 'How do you handle a high-cardinality categorical feature — say user_id or item_id with tens of millions of values — in a large-scale model?',
    answer:
      'Tens of millions of categories rule out one-hot encoding (you would create tens of millions of sparse dimensions) so the choice depends on the model. For deep models the standard is a learned embedding: map each ID to a dense vector (say 16–128 dims) in an embedding table trained jointly with the model — this captures similarity between IDs and is how recsys/DLRM-style models handle user/item IDs. The catch is table size (tens of millions × embedding dim can be huge) and cold-start (a brand-new ID has no learned embedding), which you handle with hashing tricks, a shared "unknown" bucket, or falling back to content features. For tree models the go-to is target/mean encoding with out-of-fold computation: replace the category with its target mean estimated on other folds so you do not leak the label, and add smoothing so rare categories are pulled toward the global mean rather than overfitting to a handful of examples. Feature hashing (hash the ID into a fixed-size space) is a memory-bounded option but introduces collisions that conflate unrelated IDs — usable when you can tolerate the noise. Key correctness point: any encoding that uses the target (target encoding) must be computed out-of-fold, or you leak the label and inflate offline metrics.',
    whatsTested:
      'Whether you match the encoding to the model (embeddings for deep nets, out-of-fold target encoding for trees), and know the cold-start and leakage pitfalls of high-cardinality features.',
    antiPattern:
      'One-hot encoding tens of millions of categories, or target-encoding on the full dataset before the split (leaks the label). Not smoothing rare categories, so a category with two examples gets an overconfident encoding.',
    staffFraming:
      'Staff framing weighs the tradeoffs explicitly — embedding table memory vs hashing collisions vs target-encoding leakage risk — and owns the cold-start strategy (new IDs need content-based fallback or a shared bucket, or personalization silently fails for new users/items). It also treats embedding tables as a serving/infra concern (sharding, memory, updating embeddings for new entities) rather than just a modeling choice.',
  },
  {
    id: 1020,
    cat: 'Features',
    company: 'Any',
    level: 'Mid',
    q: 'Explain feature freshness. Give an example where a stale feature silently hurts a model in production.',
    answer:
      'Feature freshness is how up-to-date a feature value is relative to when it is used for a prediction. A feature can be perfectly correct yet stale — computed from data that is hours or days old — and staleness can quietly degrade predictions even though nothing errors out. Example: a fraud model uses "transactions in the last hour" for an account. If that feature is served from a batch table refreshed nightly instead of a real-time stream, then during an active fraud burst the model sees "0 recent transactions" (last night\'s value) while the account is actually being drained right now — the freshest, most predictive signal is missing, and the model waves the transaction through. Another example: a recommendation model keys off "items viewed today," but if the feature pipeline lags two hours, a user who just started browsing a new category gets recommendations based on stale interests. The failure is silent because the value is a valid number, just old. Handling freshness means choosing the right pipeline (streaming vs batch) for each feature based on how fast it changes and how much freshness affects the prediction, setting freshness SLAs, and monitoring staleness so an alert fires when a feature falls behind its expected update cadence.',
    whatsTested:
      'Whether you understand freshness as distinct from correctness, and can give a concrete example where a stale-but-valid feature silently degrades predictions.',
    antiPattern:
      'Conflating freshness with correctness ("the value is right, so it\'s fine") and not realizing a valid-but-old value can be silently wrong for a prediction. Assuming batch refresh is always adequate regardless of how fast the underlying signal changes.',
    staffFraming:
      'Staff framing sets per-feature freshness SLAs tied to how much freshness moves the metric, and monitors staleness as a first-class signal (alert when a feature lags its cadence) rather than assuming pipelines are on time. It also owns the pipeline-choice tradeoff — streaming buys freshness at real infra cost — and pushes back on making everything real-time when only a handful of features are freshness-sensitive.',
  },
  {
    id: 1021,
    cat: 'Features',
    company: 'Airbnb',
    level: 'Staff',
    q: 'Two teams each built a "user 30-day booking count" feature and their models behave inconsistently. As a staff engineer, how do you diagnose and fix this class of problem?',
    answer:
      'This is the duplicate-feature-definition problem, and it is an organizational failure as much as a technical one. Two teams computing "30-day booking count" almost certainly differ subtly: one counts calendar days and the other rolling 30×24h; one includes cancelled bookings, the other does not; one uses booking-request time, the other confirmed time; one handles the timezone at UTC, the other in local time. Each is internally reasonable, so models trained on different definitions behave differently and no one is obviously wrong. Diagnosis: pull both definitions, align them on a set of sample users, and diff the values — the mismatches immediately reveal which semantic assumptions differ (cancellations, timezone, event-time). Fix at the instance level: pick one canonical definition, migrate both models to it, and retrain. Fix at the systemic level (the real staff job): this should not be possible in the first place. Establish a shared feature registry where "user_30d_booking_count" is defined once with explicit semantics (which events, which timestamp, which timezone, cancellation handling), owned and versioned, and both teams consume that single definition. That converts a recurring class of silent inconsistency into a solved platform problem and prevents the next twenty duplicate features.',
    whatsTested:
      'Whether you can diagnose subtle definitional divergence and, as a staff engineer, fix the systemic cause (a shared, governed feature registry) rather than just patching two models.',
    antiPattern:
      'Just picking one team\'s number and moving on, leaving the underlying "everyone redefines features their own way" problem intact so it recurs endlessly. Assuming the two definitions are the same because they have the same name.',
    staffFraming:
      'Staff framing elevates it from a bug to a governance and platform problem: features must have a single canonical, documented, versioned definition with clear ownership, consumed from a registry, so semantic divergence cannot happen. It quantifies the cost — silent inconsistency erodes trust in the whole feature platform and causes hard-to-debug model discrepancies — and treats deduplication + governance as the durable fix, not a one-off reconciliation.',
  },

  // ─────────────────────────────── Spark (5) ───────────────────────────────
  {
    id: 1022,
    cat: 'Spark',
    company: 'Any',
    level: 'Senior',
    q: 'A Spark job with a groupBy or join is extremely slow, and the Spark UI shows a few tasks taking far longer than the rest. What is happening and how do you fix it?',
    answer:
      'That signature — most tasks finish fast, a handful run forever — is data skew: the partitioning key is unevenly distributed, so one or a few partitions get a disproportionate share of rows and their tasks become stragglers that dominate wall-clock time (and can OOM). It typically shows up on the shuffle side of a groupBy/join where all rows with the same key must land on one executor. Diagnosis: in the Spark UI look at the shuffle-read size and task duration distribution for the slow stage — skew is a few tasks with 10–100× the shuffle-read of the median. Common cause: a "hot" key (a null key, a default/placeholder value, or a genuinely dominant entity). Fixes: (1) filter/handle nulls and junk keys before the shuffle if they are the culprit. (2) Salting — append a random suffix to the hot key to spread it across N partitions, aggregate the salted keys, then combine — this breaks up the one giant partition. (3) For a large-to-small join, use a broadcast (map-side) join so the small side is shipped to every executor and no shuffle of the large table happens at all — this eliminates the skew problem entirely. (4) In Spark 3+, enable Adaptive Query Execution, which can detect and split skewed partitions automatically. I would first confirm skew in the UI, then pick broadcast (if one side is small) or salting/AQE (if both sides are large).',
    whatsTested:
      'Whether you recognize straggler tasks as data skew on the shuffle key and know the concrete fixes — salting, broadcast join, AQE skew handling, junk-key filtering.',
    antiPattern:
      'Throwing more executors/memory at a skewed job — it does not help because the work is concentrated on one partition, not spread thin. Blaming "Spark is slow" without reading the task-duration distribution in the UI to identify the skew.',
    staffFraming:
      'Staff framing ties it to the shuffle model: a groupBy/join forces same-key rows onto one partition, so an uneven key distribution is inherently a straggler problem, and the fix is to change the data movement (broadcast to avoid the shuffle, salt to redistribute the hot key) rather than add resources. It also reaches for AQE as the modern default and knows when it will not save you (a single mega-key still needs salting), and it thinks about detecting skew proactively in recurring pipelines.',
  },
  {
    id: 1023,
    cat: 'Spark',
    company: 'Any',
    level: 'Senior',
    q: 'Explain what happens during a shuffle in Spark and why shuffles are the main thing to minimize for performance.',
    answer:
      'A shuffle is Spark redistributing data across partitions so that rows sharing a key end up on the same executor — it is triggered by wide transformations like groupByKey, reduceByKey, join, distinct, and repartition. Mechanically: each map task writes its output partitioned by the target key to local disk (shuffle write), and each reduce task then reads the relevant slices from every map task across the network (shuffle read). That makes shuffles expensive on three axes at once: disk I/O (write and read intermediate files), network I/O (all-to-all data movement between executors), and serialization. It is also a stage boundary — Spark cannot pipeline across a shuffle, so it forces materialization and can create stragglers if data is skewed. Because of all this, the biggest Spark wins usually come from reducing or optimizing shuffles: prefer reduceByKey/aggregateByKey over groupByKey (they combine on the map side, so far less data crosses the network), use broadcast joins to avoid shuffling a large table when one side is small, pre-partition data by the join/group key (or bucket it) so repeated operations reuse the partitioning, and filter/project columns before the shuffle so you move less data. The mental model: every shuffle is an all-to-all network + disk operation, so the fastest shuffle is the one you avoid.',
    whatsTested:
      'Whether you can explain the map-side-write / reduce-side-read mechanics of a shuffle, why it is expensive (disk + network + stage boundary), and how to reduce shuffle volume.',
    antiPattern:
      'Describing shuffle vaguely as "moving data around" without the write/read mechanics or the disk+network cost. Using groupByKey where reduceByKey would combine map-side, or not knowing that broadcast joins avoid the shuffle entirely.',
    staffFraming:
      'Staff framing treats shuffle as the dominant cost model of distributed data processing: you design pipelines to minimize all-to-all movement (map-side combine, broadcast, pre-partitioning/bucketing, column pruning and predicate pushdown), and you read the physical plan to see where shuffles happen. It also connects to layout — partitioning and bucketing the stored data by common keys amortizes shuffle cost across many downstream jobs, which is a data-platform-level optimization, not a per-job one.',
  },
  {
    id: 1024,
    cat: 'Spark',
    company: 'Any',
    level: 'Senior',
    q: 'You need to join a 10TB fact table with a 50MB dimension table in Spark. What join strategy do you use and why?',
    answer:
      'This is the textbook case for a broadcast (map-side) join. The default shuffle-hash/sort-merge join would shuffle both tables by the join key across the network — repartitioning 10TB is enormously expensive in disk and network I/O and risks skew stragglers. Instead, because the 50MB dimension easily fits in each executor\'s memory, I broadcast it: Spark ships a full copy of the small table to every executor, and each task joins its local slice of the 10TB fact table against the in-memory copy. No shuffle of the large table happens at all — the join is entirely map-side, which is dramatically faster. Spark does this automatically when the small side is below spark.sql.autoBroadcastJoinThreshold (default ~10MB), and since 50MB exceeds that default I would either raise the threshold or add an explicit broadcast() hint. Caveats I would state: the broadcast table must comfortably fit in executor memory with headroom (50MB is trivial; a few hundred MB starts to strain and risks driver/executor memory issues), and the driver collects then broadcasts it, so extremely large "small" sides defeat the purpose. But at 50MB vs 10TB, broadcast join is unambiguously the right call and avoids the expensive shuffle entirely.',
    whatsTested:
      'Whether you know a broadcast join eliminates shuffling the large table when one side fits in memory, why that beats sort-merge/shuffle join, and the memory-threshold caveats.',
    antiPattern:
      'Using a default sort-merge join and shuffling both tables — needlessly repartitioning 10TB when the tiny dimension could just be broadcast. Or broadcasting a table too large to fit in executor memory and OOMing.',
    staffFraming:
      'Staff framing frames join strategy selection by the data movement it implies: broadcast when one side fits in memory (no large-table shuffle), sort-merge/shuffle-hash when both are large, and it knows the AQE dynamic-broadcast behavior and the threshold tuning. It also thinks about repeatability — if this join runs constantly, bucketing the fact table by the join key or maintaining the dimension as a broadcastable artifact amortizes cost across the whole pipeline.',
  },
  {
    id: 1025,
    cat: 'Spark',
    company: 'Any',
    level: 'Staff',
    q: 'How do you choose partitioning for a large Spark dataset, and how do too many or too few partitions each hurt you?',
    answer:
      'Partitioning is the core knob for parallelism and cost in Spark, and both extremes hurt. Too few partitions: you under-utilize the cluster (fewer tasks than available cores means idle executors), each task processes a huge chunk that can spill to disk or OOM, and you lose the ability to parallelize — a 1TB dataset in 10 partitions means 100GB per task. Too many partitions: you pay per-task scheduling overhead (Spark has fixed cost per task, so millions of tiny tasks waste time in scheduling rather than work), you generate huge numbers of small shuffle files (the "small files problem," brutal on the shuffle and on downstream reads), and the driver strains tracking them. The rule of thumb is to target partition sizes around 100–200MB and have at least 2–4× as many partitions as total executor cores so tasks are balanced and stragglers are cheap. Practical controls: spark.sql.shuffle.partitions governs post-shuffle partition count (the default 200 is often wrong for both tiny and huge data — tune it to the data size); use repartition() to increase parallelism (incurs a shuffle) and coalesce() to reduce partitions without a full shuffle (e.g., before writing output to avoid tiny files). For storage, partition the written data by a low-cardinality column that queries filter on (partition pruning) but avoid high-cardinality partition columns that explode into millions of small directories.',
    whatsTested:
      'Whether you understand the partition-count tradeoff (parallelism/OOM vs scheduling overhead/small files), target sizes, and the repartition/coalesce/shuffle-partitions controls.',
    antiPattern:
      'Leaving spark.sql.shuffle.partitions at the default 200 regardless of data size, or partitioning stored data by a high-cardinality column (creating millions of tiny files). Using repartition when coalesce would avoid an unnecessary shuffle before a write.',
    staffFraming:
      'Staff framing ties partitioning to the whole pipeline economics: partition size drives parallelism, memory pressure, and the small-files problem simultaneously, and the right count depends on data volume and cluster shape, not a fixed default. It distinguishes in-memory partitioning (parallelism/shuffle) from on-disk partitioning (partition pruning for downstream queries), and treats storage layout — partitioning and bucketing by common filter/join keys — as a platform decision that amortizes cost across every job that reads the data.',
  },
  {
    id: 1026,
    cat: 'Spark',
    company: 'Any',
    level: 'Mid',
    q: 'When would you use cache()/persist() in Spark, and what is the trap with lazy evaluation that catches people?',
    answer:
      'Spark transformations are lazy — nothing computes until an action (count, collect, write) triggers it — and by default Spark recomputes a DataFrame\'s full lineage every time an action runs on it. So the trap is: if you reference the same intermediate DataFrame in multiple actions (or iteratively, as in ML training loops), Spark re-executes the entire upstream chain each time, silently doing the same expensive work repeatedly. cache()/persist() fixes this: it materializes the DataFrame after its first computation and keeps it (in memory with cache(), or a chosen storage level with persist() — memory, disk, or both) so subsequent actions reuse it instead of recomputing. Use it when a DataFrame is expensive to produce and reused more than once — a cleaned dataset fed into several aggregations, or the training data in an iterative algorithm. The nuances: caching costs memory, so caching something used only once wastes RAM and can evict other useful data; cache() is also lazy (it marks for caching but only materializes on the next action); and you should unpersist() when done to free memory. So the rule is: cache expensive-and-reused DataFrames, do not cache used-once or cheap ones, and remember an action must run to actually populate the cache.',
    whatsTested:
      'Whether you understand lazy evaluation causes lineage recomputation across actions, and that cache/persist materializes a reused DataFrame — plus the memory-cost and lazy-caching nuances.',
    antiPattern:
      'Not caching a DataFrame reused across many actions (so Spark recomputes the whole lineage every time), or the opposite — caching everything indiscriminately and running out of memory. Assuming cache() takes effect immediately rather than on the next action.',
    staffFraming:
      'Staff framing reasons about caching as a memory/compute tradeoff tied to the DAG: cache at the points where lineage is expensive and reused, choose the storage level (memory-only vs memory-and-disk) based on size and recompute cost, and unpersist to avoid evicting more valuable data. It also flags that over-caching in a shared cluster harms other jobs, so caching decisions are made deliberately against the reuse pattern, not applied reflexively.',
  },
];
