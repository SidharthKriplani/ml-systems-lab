export const SYSTEM_DESIGN_MODULES = [
  {
    id: 'design_framework',
    title: 'The 6-Step ML System Design Framework',
    subtitle: 'Clarify → scope → data → model → serving → monitoring',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['system design', 'framework', 'ML design interview'],
    summary: `Most failed ML projects don't fail on the model — they fail because the problem was never properly scoped. An engineer proposes a transformer for something a gradient-boosted tree would have solved, or designs offline batch scoring for a system that needs sub-50ms online inference. Both are the same mistake: jumping to architecture before the constraints are known.

[FIGURE: framework]

---

**The framework forces constraints to surface before any architectural decision.**

(1) Clarify requirements — QPS, latency SLA, label availability, the cost asymmetry between a false positive and a false negative. (2) Frame as an ML problem — is this ranking, classification, regression, retrieval? (3) Data strategy — where do labels come from, how fresh, how biased. (4) Model design. (5) Serving architecture. (6) Monitoring. The single most common interview failure is skipping to step 4.

---

**Why the ordering is load-bearing.** Every downstream choice is a function of the earlier answers. A 200ms transformer is disqualified the instant the SLA turns out to be 50ms. A supervised model is disqualified the instant you learn there are no labels and none are coming. If you pick the model first, you discover these walls after weeks of work instead of in the first five minutes.`,
    keyPoints: [
      `**Steps 1–3 constrain every architecture decision: clarify, frame, and plan data before touching a model.** Without QPS, latency SLA, label availability, and the cost asymmetry between error types, every later decision is a guess. Concretely: a "design a spam filter" prompt has no single right answer until you know whether it blocks the email synchronously (needs <100ms) or quarantines async (can take seconds), and whether a false positive (real mail lost) costs more than a false negative (spam delivered).`,
      `**Steps 4–5 are coupled, not sequential: model choice and serving architecture must be solved together.** A model requiring 50GB RAM cannot run on one server; a 200ms model cannot serve real-time. Choosing the model first and discovering the serving wall later wastes the most expensive weeks of a project.`,
      `**Step 6 is not optional: a deployed model has no built-in signal for its own decay.** Without monitoring input distributions, prediction distributions, and the business metric, the first symptom of failure is a revenue drop days after the damage began. Define the retraining trigger before launch, not after the first incident.`,
    ],
    takeaway: `ML system design is constraint-propagation: the latency SLA, label availability, and error-cost asymmetry established in steps 1–3 disqualify most architectures before you ever compare models — which is why jumping to step 4 is the defining junior mistake.`,
    checkQuestions: [
      {
        q: `You're asked to "design a spam filter for email." Which opening move best separates a senior from a junior answer?`,
        options: [
          `A) State the model architecture (a fine-tuned transformer over email text) and the training-data size you'd target, then refine from there.`,
          `B) Establish scale/QPS, whether filtering is synchronous (blocks delivery, <100ms) or asynchronous, label source and freshness, and the precision/recall cost asymmetry — because each answer eliminates whole classes of designs.`,
          `C) Propose the evaluation metric (F1) and the deployment environment first, since evaluation drives everything downstream.`,
          `D) Enumerate the feature set (sender reputation, links, n-grams) so the model design can begin immediately.`,
        ],
        answer: `B`,
      },
      {
        q: `A candidate designs a 180ms deep model, then at the end learns the product SLA is 40ms. What does the framework say went wrong?`,
        options: [
          `A) Nothing structural — they should now quantize and distill the 180ms model down to 40ms and keep the design.`,
          `B) The evaluation metric was chosen too late; had they fixed the metric first, the latency issue would have surfaced.`,
          `C) Latency is a step-1 requirement. It should have been elicited before model design (step 4); discovering a hard SLA after the architecture is chosen means re-doing the design, which is the exact failure the ordering prevents.`,
          `D) The monitoring plan was missing, so the latency regression wasn't caught — add step 6 and the problem is solved.`,
        ],
        answer: `C`,
      },
      {
        q: `For a fraud-blocking system, why does the false-positive vs false-negative cost asymmetry belong in step 1 rather than step 4?`,
        options: [
          `A) It doesn't — cost asymmetry is a modeling detail handled by class weighting during training in step 4.`,
          `B) Because the asymmetry sets the operating point and even the framing: if blocking a legitimate transaction is far costlier than missing fraud, you may need a two-stage design (cheap model auto-approves, expensive model reviews the rest) and a human-in-the-loop — architectural choices that must be known before modeling.`,
          `C) Because regulators require the cost ratio to be documented before deployment, independent of design.`,
          `D) Because the cost ratio determines the learning rate and batch size used in training.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**6 steps:** clarify → frame → data → model → serving → monitoring. Skipping to "model" is the classic junior tell.`,
      `**Steps 1–3 are constraints, not preamble:** QPS, latency SLA, label availability, error-cost asymmetry disqualify architectures up front.`,
      `**Model + serving are coupled:** a 200ms model dies against a 50ms SLA; a 50GB model dies on one box. Solve them together.`,
      `**Monitoring is step 6, not an afterthought:** a model can't signal its own decay — define the retraining trigger pre-launch.`,
      `**Cost asymmetry shapes the whole design:** FP≫FN can force two-stage + human-in-the-loop, decided before modeling.`,
    ],
    figures: {
      framework: `<svg viewBox="0 0 360 70" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  ${['Clarify', 'Frame', 'Data', 'Model', 'Serve', 'Monitor'].map((s, i) => `
  <rect x="${4 + i * 59}" y="22" width="52" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="${30 + i * 59}" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">${s}</text>
  ${i < 5 ? `<path d="M${56 + i * 59},35 l5,0" stroke="var(--ink-low)" stroke-width="1.5" marker-end="url(#a)"/>` : ''}`).join('')}
  <defs><marker id="a" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="var(--ink-low)"/></marker></defs>
  <text x="4" y="14" fill="var(--ink-low)" font-size="7.5">1–3 fix the constraints · 4–5 are coupled · 6 catches decay</text>
</svg>`,
    },
  },
  {
    id: 'recsys_overview',
    interactiveId: 'retrieval_funnel_viz',
    title: 'Recommender System Overview',
    subtitle: 'Retrieval vs ranking vs diversity, the staged funnel, the data flywheel',
    difficulty: 'intermediate',
    estimatedMin: 22,
    tags: ['recommender system', 'RecSys', 'retrieval', 'ranking'],
    summary: `A single ranking model cannot solve the scale problem and the quality problem at once. Score 10 million items with a good model in under 50ms? At even 1ms per item that's 10,000 seconds — you're off by five orders of magnitude.

[FIGURE: funnel]

---

**So every large recommender is a funnel.** Retrieval (candidate generation) narrows millions to thousands with fast approximate methods; ranking orders the survivors with an expensive precise model; re-ranking layers diversity, freshness, and business rules on top. Each stage is a different engineering tradeoff, and the ordering is forced: the cheap stage must run over everything, the expensive stage only over what the cheap stage kept.

---

**Recall at retrieval is a ceiling you can't raise later.** An item retrieval drops is gone — no downstream stage can rank an item it never received. That's why retrieval optimizes recall and ranking optimizes precision: they're different objectives because they sit at different points in the funnel.

---

**The data flywheel is why incumbents are so hard to displace.** More users → more interaction data → better models → more engagement → more users. A new entrant with no interaction history can't run collaborative filtering at all and must limp along on content features until it accumulates a base.`,
    interactivePrompt: `Before you touch the controls: if you narrow the retrieval stage to cut latency, which metric has a hard ceiling you can never recover downstream — and why?`,
    keyPoints: [
      `**The funnel exists because accuracy and scale can't be one model.** Retrieval must be fast and high-recall (a missed item is unrecoverable); ranking can be expensive and precise because it only sees hundreds of candidates. Different objectives → different architectures → different stages.`,
      `**Retrieval recall caps final quality.** If retrieval's recall@1000 is 0.7, then 30% of the items a user would have loved are already gone before ranking starts — and no amount of ranking sophistication recovers them. Diagnose a "great ranker, mediocre results" system by auditing retrieval recall first.`,
      `**The data flywheel compounds the incumbent advantage.** Collaborative signal requires interaction history; a cold platform has none, so it underperforms an incumbent even with identical architecture until it accrues data. Exploration is the deliberate cost that keeps the flywheel fed with signal on new items.`,
    ],
    takeaway: `A recommender is a recall-then-precision funnel: retrieval cheaply maximizes recall over millions (and sets an unraiseable ceiling on final quality), ranking expensively maximizes precision over the survivors — one model can't occupy both ends.`,
    checkQuestions: [
      {
        q: `TikTok shows relevant videos in your very first session, before any watch history exists. What best explains how?`,
        options: [
          `A) It trains a fresh per-user neural network online with gradient descent on each watch event within the session.`,
          `B) It withholds personalization until session two and serves only globally popular content on the first visit.`,
          `C) It leans on context (device, language, location, time), content features (metadata, audio, hashtags), and a trending/popularity fallback, then rapidly updates a real-time user embedding from the first few watch-time signals.`,
          `D) It requires linking another social account so interest signals can be imported before the session starts.`,
        ],
        answer: `C`,
      },
      {
        q: `Your ranker scores 0.95 AUC offline, but users complain the recommendations miss obvious interests. Retrieval recall@500 is 0.6. Where's the bug?`,
        options: [
          `A) The ranker — 0.95 AUC on a biased test set is misleading; retrain the ranker with harder negatives.`,
          `B) Retrieval — at recall@500 = 0.6, 40% of relevant items never reach the ranker, so ranking quality is capped regardless of AUC. Fix retrieval (more candidates, better embeddings, hard negatives) before touching the ranker.`,
          `C) Re-ranking — the diversity layer is suppressing relevant items; disable diversity and results improve.`,
          `D) The metric — AUC is the wrong offline metric; switch to NDCG and the discrepancy disappears.`,
        ],
        answer: `B`,
      },
      {
        q: `Why does a pure-exploitation recommender (always serve the highest predicted-engagement item) degrade over months even if its model is accurate?`,
        options: [
          `A) It doesn't degrade — maximizing predicted engagement every time is optimal by definition.`,
          `B) It collapses onto a shrinking set of popular items, starves the model of signal on new/long-tail items, and narrows user consumption — so coverage and long-term satisfaction fall even as short-term clicks look fine. Exploration deliberately trades a little short-term engagement to keep the flywheel fed.`,
          `C) The model's weights numerically drift toward zero without exploration, causing predictions to decay.`,
          `D) Exploitation increases inference latency over time as the candidate cache grows unbounded.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**One model can't do scale + quality:** 10M items × 1ms ≫ 50ms. Hence the funnel.`,
      `**Funnel = retrieval (recall, cheap, millions) → ranking (precision, costly, hundreds) → re-rank (diversity/business).**`,
      `**Retrieval recall is a hard ceiling:** an item retrieval drops can never be ranked back. Audit retrieval first when "great ranker, bad results."`,
      `**Data flywheel:** users→data→models→engagement→users. New entrants can't do collaborative filtering cold.`,
      `**Exploration is not optional:** pure exploitation shrinks the catalog and starves signal on new items.`,
    ],
    figures: {
      funnel: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <polygon points="10,12 350,12 250,84 110,84" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="180" y="26" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Retrieval — 10M → 1000 · recall · ~2ms</text>
  <text x="180" y="52" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Ranking — 1000 → 100 · precision · ~20ms</text>
  <text x="180" y="78" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Re-rank — 100 → 20 · diversity · ~5ms</text>
</svg>`,
    },
  },
  {
    id: 'recsys_stack',
    interactiveId: 'retrieval_funnel_viz',
    title: 'RecSys Stack Deep-Dive (4-Stage Funnel)',
    subtitle: 'Retrieval → pre-ranking → ranking → re-ranking, latency budgets, feedback loops',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['RecSys', 'ranking', 'pre-ranking', 'candidate generation'],
    summary: `The gap between a recommender *prototype* and a recommender *system* is the entire engineering stack around the model. A prototype runs a ranker over a few thousand items and prints results. Production has to serve millions of users inside a ~100ms budget, A/B-test each stage independently, degrade gracefully when any component dies, and correct position bias so the ranker doesn't just resurface whatever the last model showed.

[FIGURE: fourstage]

---

**Modern stacks have four stages, not three.** Between cheap retrieval and the expensive ranker sits a **pre-ranking** (a.k.a. coarse-ranking) stage: a lightweight model that trims thousands of retrieved candidates to a few hundred before the heavy ranker runs. Without it, the full ranker either blows the latency budget or is forced to score too few candidates. Retrieval (10M→5k, ~1ms) → pre-rank (5k→500, ~5ms) → rank (500→50, ~20ms) → re-rank (50→10, ~5ms).

---

**Latency is allocated, not hoped for.** Each stage has a hard millisecond budget and a single overrunning stage cascades. If feature retrieval slips from 10ms to 25ms, only 15ms remains for ranking — forcing fewer candidates or a simpler model, both of which cost quality. Measure the budget end-to-end in production, never from component microbenchmarks.

---

**The hardest correctness problem is the feedback loop.** The ranker trains on interactions shaped by what the *previous* ranker chose to show. Position 1 gets clicks regardless of quality; train on raw clicks and you teach the model to reproduce position effects, not relevance. Inverse-propensity weighting and counterfactual learning are the tools that recover an unbiased relevance estimate.`,
    interactivePrompt: `Before you touch the controls: widen the Rank stage to score more candidates. Which stage's latency dominates, and why does the pre-ranking stage exist to prevent exactly this?`,
    keyPoints: [
      `**Pre-ranking is the stage most people forget.** Retrieval returns thousands; the full ranker can't afford to score thousands in-budget. A cheap pre-ranker (small two-tower or GBM) cuts 5k→500 so the expensive ranker only scores hundreds. Consistency matters: if the pre-ranker and ranker disagree wildly, good candidates get cut before the ranker ever sees them (pre-ranking/ranking consistency is its own tuning problem).`,
      `**Each stage is independently trained, monitored, and deployed — that's an organizational choice as much as technical.** It lets a 10-person team improve retrieval this week without re-testing ranking. Blur the boundaries and the pipeline becomes one un-shippable unit.`,
      `**Latency budgets are hard allocations measured end-to-end.** A stage that overruns steals from the next. The bottleneck is usually feature retrieval, not inference — profile the whole request path in production before committing to a model size.`,
    ],
    takeaway: `Production RecSys is a 4-stage funnel — retrieval, pre-ranking, ranking, re-ranking — where pre-ranking exists precisely because the heavy ranker can't score thousands of candidates in-budget, and every stage runs on its own hard latency allocation with position-bias correction stitched through.`,
    checkQuestions: [
      {
        q: `Your ranker takes 95ms for 1000 candidates; total budget is 100ms, leaving nothing for retrieval or features. Besides shrinking the model, what architectural change most directly fixes this?`,
        options: [
          `A) Increase the candidate pool to 2000 for more context, then filter harder afterward.`,
          `B) Insert a pre-ranking stage: a cheap model trims 1000→200 so the heavy ranker scores 200 instead of 1000, cutting ranking latency ~5× while a consistency-tuned pre-ranker keeps good candidates from being dropped early.`,
          `C) Switch to asynchronous serving and return the previous request's cached scores while the new ones compute.`,
          `D) Add more ranker layers to improve quality so fewer candidates need re-ranking downstream.`,
        ],
        answer: `B`,
      },
      {
        q: `Your LTR ranker shows higher precision@1 for items that were historically shown at low positions than high positions. Cause and fix?`,
        options: [
          `A) Label noise — low-position items have fewer clicks and noisier labels; collect more editorial judgments for them.`,
          `B) Position bias — top positions accrue clicks regardless of relevance, so training on raw clicks teaches the model to resurface previously-top items (a self-reinforcing loop). Fix with inverse-propensity weighting (weight each example by 1/P(click|position)) plus occasional randomization to gather unbiased data.`,
          `C) Overfitting to head queries shown at top positions; fix with query-frequency-weighted sampling.`,
          `D) Feature leakage from popularity features correlated with historical position; remove all popularity features.`,
        ],
        answer: `B`,
      },
      {
        q: `Why is a pre-ranker that's simply a smaller copy of the ranker still worth having, even though it's less accurate?`,
        options: [
          `A) It isn't — if it's less accurate you should just run the real ranker on fewer retrieved candidates.`,
          `B) Because accuracy on the *full* candidate set isn't the pre-ranker's job — its job is a cheap, recall-oriented cut from thousands to hundreds so the accurate ranker fits the latency budget. Running the real ranker on fewer retrieved candidates instead lowers recall at retrieval, which is the ceiling you most want to protect.`,
          `C) Because the pre-ranker's weights can be copied directly into the ranker to speed up training.`,
          `D) Because a smaller model is inherently better calibrated, improving final scores.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**4 stages, not 3:** retrieval (10M→5k) → pre-rank (5k→500) → rank (500→50) → re-rank (50→10).`,
      `**Pre-ranking exists** because the heavy ranker can't score thousands in-budget; tune pre-rank/rank consistency so good candidates survive.`,
      `**Latency is a hard per-stage budget, measured end-to-end.** One overrun cascades; feature fetch usually dominates, not inference.`,
      `**Stages are independently trained/deployed** → teams iterate on one without re-testing all.`,
      `**Feedback loop is the core correctness bug:** train on raw clicks → learn position, not relevance. Fix with IPW + randomization.`,
    ],
    figures: {
      fourstage: `<svg viewBox="0 0 360 78" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  ${[['Retrieval', '10M→5k', '1ms'], ['Pre-rank', '5k→500', '5ms'], ['Rank', '500→50', '20ms'], ['Re-rank', '50→10', '5ms']].map((s, i) => `
  <rect x="${4 + i * 89}" y="20" width="80" height="34" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="${44 + i * 89}" y="34" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">${s[0]}</text>
  <text x="${44 + i * 89}" y="45" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">${s[1]} · ${s[2]}</text>
  ${i < 3 ? `<path d="M${84 + i * 89},37 l5,0" stroke="var(--ink-low)" stroke-width="1.5"/>` : ''}`).join('')}
  <text x="4" y="14" fill="var(--ink-low)" font-size="7.5">pre-ranking (coarse) is the stage most candidates skip in interviews</text>
  <text x="4" y="70" fill="var(--ink-low)" font-size="7.5">budget ≈ 100ms end-to-end — one stage overrunning steals from the next</text>
</svg>`,
    },
  },
  {
    id: 'two_tower',
    title: 'Two-Tower Models',
    subtitle: 'Encode separately, compare cheaply — the retrieval workhorse',
    difficulty: 'advanced',
    estimatedMin: 22,
    tags: ['two-tower', 'embeddings', 'ANN', 'retrieval'],
    summary: `The most accurate way to score a user against an item is to feed them into one model together so it can weigh every interaction. The problem is arithmetic: that means scoring *every* user against *every* item at query time. For 10M items at 1000 users/second, that's 10 billion joint forward passes per second — an overnight warehouse job, not real-time retrieval.

[FIGURE: twotower]

---

**The two-tower trick: encode separately, compare with a dot product.** A user tower and an item tower map into the same embedding space; similarity is a plain dot product. Because an item's embedding no longer depends on who's asking, you compute *all* item embeddings offline, once, and index them for approximate-nearest-neighbor (ANN) search. At query time you encode just the one user and look up neighbors — ~10ms across 100M items.

---

**What you give up, and who picks it up.** Encoding the two sides apart means the model can't capture fine user×item feature interactions — exactly what the expensive joint model was good at. That job is handed downstream to the cross-attention *ranker*, which only has to look at the few hundred candidates retrieval already narrowed. Two-tower for recall, cross-encoder for precision: the same recall-then-precision split as the whole funnel, in miniature.`,
    keyPoints: [
      `**Two-tower makes real-time retrieval over 100M items possible by precomputing item embeddings offline.** Item embeddings don't depend on the query user, so they're computed once and ANN-indexed; retrieval is one user-embedding computation plus a lookup. Cross-attention destroys this because item encoding would depend on the user.`,
      `**In-batch softmax with hard-negative mining is the standard recipe.** Other items in the batch serve as negatives; explicitly mining high-scoring-but-unclicked items forces the model to learn fine distinctions. Random negatives are too easy — the model separates a clicked video from a random one with near-zero gradient and learns nothing subtle.`,
      `**ANN index staleness scales with catalog volatility.** When item features change, the indexed embedding is stale. Fast-changing catalogs (price, inventory) need delta re-embedding of changed items; stable catalogs tolerate weekly full rebuilds. Staleness is a continuous freshness-vs-cost tradeoff, not a corner case.`,
    ],
    takeaway: `Two-tower breaks the user×item coupling so item embeddings can be precomputed and ANN-indexed — buying ~10ms retrieval over 100M items at the cost of fine feature interactions, which the downstream cross-encoder ranker restores over the few hundred survivors.`,
    checkQuestions: [
      {
        q: `Why does a cross-attention model that jointly encodes user and item fail at retrieval scale even though it's more accurate?`,
        options: [
          `A) Cross-attention overfits on large catalogs, so its accuracy advantage disappears above ~1M items.`,
          `B) Its item representation depends on the query user, so item embeddings can't be precomputed or indexed — every one of the 10M items must be scored fresh per query, which is orders of magnitude over any real-time budget. Two-tower removes that dependency so items can be indexed offline.`,
          `C) Cross-attention requires GPUs that can't be co-located with the ANN index, adding fatal network latency.`,
          `D) It can't produce fixed-length embeddings, so ANN libraries reject its output.`,
        ],
        answer: `B`,
      },
      {
        q: `Your two-tower model has recall@100 of only 60%. Which change most directly attacks the recall problem?`,
        options: [
          `A) Switch dot-product similarity to L2 distance for numerical stability in high dimensions.`,
          `B) Reduce embedding dim from 256 to 64 so the ANN index is smaller and more items are reachable.`,
          `C) Hard-negative mining plus richer features and a larger embedding dimension, and expand the ANN candidate set (100→500) letting the ranker filter downstream — directly increasing the fraction of relevant items retrieved.`,
          `D) Replace contrastive loss with pointwise regression on explicit ratings for better-calibrated scores.`,
        ],
        answer: `C`,
      },
      {
        q: `Your item catalog updates prices every few minutes, but the ANN index is rebuilt nightly. What's the failure mode and the right fix?`,
        options: [
          `A) No failure — price is a ranking feature, so a stale retrieval index is harmless.`,
          `B) Retrieval embeds items on stale features, so items whose relevance changed (e.g., now-discounted) are retrieved with yesterday's embedding — retrieved wrongly or missed. Fix with delta re-embedding: recompute and upsert only changed items into the index continuously, reserving full rebuilds for structural changes.`,
          `C) The dot product overflows when prices change; normalize embeddings nightly to fix it.`,
          `D) The user tower goes stale; retrain the user tower hourly and the index can stay nightly.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Joint (cross-attention) scoring is most accurate but O(all items)/query → impossible at retrieval scale.**`,
      `**Two-tower:** encode user & item separately → dot-product similarity → item embeddings precomputed + ANN-indexed → ~10ms over 100M.`,
      `**Cost:** loses fine user×item interactions → handed to the downstream cross-encoder ranker over ~100s of candidates.`,
      `**Training:** in-batch softmax + hard negatives (random negatives are too easy).`,
      `**Ops:** ANN staleness scales with catalog churn → delta re-embed volatile items, full rebuild the stable ones.`,
    ],
    figures: {
      twotower: `<svg viewBox="0 0 360 110" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="20" y="18" width="90" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="65" y="35" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">User tower</text>
  <rect x="250" y="18" width="90" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="295" y="35" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Item tower</text>
  <text x="65" y="60" text-anchor="middle" fill="var(--ink-mid)" font-size="8">u (live, 1×)</text>
  <text x="295" y="60" text-anchor="middle" fill="var(--ink-mid)" font-size="8">v (offline, all)</text>
  <path d="M110,31 L250,31" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="180" y="27" text-anchor="middle" fill="var(--ink-low)" font-size="8">u · v (dot product)</text>
  <rect x="235" y="70" width="120" height="20" rx="4" fill="none" stroke="var(--amber)"/>
  <text x="295" y="83" text-anchor="middle" fill="var(--amber)" font-size="7.5">ANN index (precomputed v)</text>
  <text x="20" y="104" fill="var(--ink-low)" font-size="7.5">item side is query-independent → index once, look up in ~10ms</text>
</svg>`,
    },
  },
  {
    id: 'semantic_search',
    title: 'Semantic Search & Embeddings',
    subtitle: 'Bi-encoder vs cross-encoder, ANN indexes: FAISS / ScaNN / HNSW',
    difficulty: 'advanced',
    estimatedMin: 22,
    tags: ['semantic search', 'FAISS', 'HNSW', 'embeddings', 'retrieval'],
    summary: `Keyword search breaks the moment the user's words don't match the document's. "heart attack symptoms" misses a page that says "myocardial infarction presentation" — same meaning, zero shared tokens, and BM25 has no idea. Semantic search maps queries and documents into an embedding space where *meaning* decides similarity.

[FIGURE: encoders]

---

**Solving vocabulary creates a scale problem.** The most accurate comparison is a **cross-encoder** — feed query and document in together so the model weighs every interaction. But it reruns per query-document pair, so it can't exceed a few hundred documents per query. Useless over 50M docs. The **bi-encoder** (two-tower) encodes each side separately: slightly less precise, but document embeddings are query-independent, so precompute them offline and retrieve with ANN over billions in milliseconds.

---

**Production uses both, in sequence.** Bi-encoder retrieves the top few hundred from millions (fast); cross-encoder re-ranks just those hundreds (slow but precise, where the cost is affordable). Each does the job the other can't — the same recall-then-precision split as RecSys.

---

**The encoder's pretraining objective decides whether its embeddings are usable.** Raw BERT (trained with masked-LM) makes poor similarity embeddings; SBERT adds pooling + contrastive fine-tuning, and modern encoders (E5, BGE) trained with hard negatives push recall much higher. And every ANN index has a recall-vs-latency knob (HNSW's ef_search, IVF's nprobe) that must be calibrated on tail queries, not benchmarks — a 15ms P99 met on head queries will break on the tail.`,
    keyPoints: [
      `**Bi-encoder for retrieval, cross-encoder for re-ranking — forced by scale, not preference.** Cross-encoder models query×document interaction directly (more accurate) but is O(N) per query; bi-encoder precomputes document embeddings offline. Retrieve top 50–200 with the bi-encoder, re-rank with the cross-encoder.`,
      `**The pretraining objective determines embedding quality.** MLM-trained BERT clusters poorly for similarity; contrastively fine-tuned encoders (SBERT → E5/BGE) with hard negatives are what make retrieval work. Don't reach for raw \`bert-base\` embeddings and expect recall.`,
      `**ANN indexes trade recall for latency, and tail queries are the binding constraint.** Head queries hit high recall at a given ef_search/nprobe; tail queries don't. Calibrate the operating point on a stratified sample that includes the tail, or the SLA silently fails where it's least measured.`,
    ],
    takeaway: `Semantic search is the RecSys funnel for text: a bi-encoder retrieves cheaply over millions and a cross-encoder re-ranks precisely over the survivors, with embedding quality set by the encoder's contrastive pretraining and the recall/latency knob calibrated on tail queries.`,
    checkQuestions: [
      {
        q: `You need semantic search over 50M product descriptions with P99 < 15ms and recall@10 > 0.95. Which architecture fits?`,
        options: [
          `A) Cross-encoder over all 50M items in parallel on a large GPU cluster for maximum precision, no retrieval stage.`,
          `B) Bi-encoder (E5/BGE) embeddings for all 50M items in an HNSW index (ef_search≈100, ~2ms, recall@100≈0.97), then a cross-encoder re-rank of the top 50 on GPU (~10ms) — ~12ms total, recall@10 > 0.95.`,
          `C) BM25 keyword retrieval for speed with a cross-encoder re-ranker to recover semantic matches BM25 missed.`,
          `D) A single bi-encoder with exact (brute-force) nearest-neighbor search to guarantee recall without approximation.`,
        ],
        answer: `B`,
      },
      {
        q: `A team uses raw \`bert-base-uncased\` [CLS] embeddings for semantic retrieval and gets poor recall. Why, and what's the minimal fix?`,
        options: [
          `A) BERT embeddings are too high-dimensional; apply PCA to 128 dims and recall recovers.`,
          `B) BERT was pretrained with masked-LM, not a similarity objective, so its raw embeddings don't cluster by meaning. The minimal fix is an encoder with contrastive/similarity fine-tuning (SBERT, or better E5/BGE trained with hard negatives) — not a dimensionality change.`,
          `C) [CLS] pooling is the only issue; switch to max pooling over tokens and raw BERT works fine for retrieval.`,
          `D) The index is the problem, not the encoder; switch FAISS-IVF to HNSW and recall recovers.`,
        ],
        answer: `B`,
      },
      {
        q: `Your HNSW index meets the 15ms P99 SLA in load tests but violates it in production for a minority of queries. Most likely cause?`,
        options: [
          `A) The GPU is thermally throttling under sustained production load.`,
          `B) ef_search was tuned on head queries; tail queries (rare, poorly covered) need a deeper graph traversal to reach the same recall, so they exceed the latency budget. Calibrate the operating point on a stratified sample that includes tail queries, or cap ef_search and accept lower tail recall explicitly.`,
          `C) Production embeddings use a different float precision than the load test.`,
          `D) HNSW is non-deterministic, so latency randomly spikes; switch to IVF for stable latency.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Keyword (BM25) fails on vocabulary mismatch; embeddings match on meaning.**`,
      `**Cross-encoder = accurate but O(N)/query → re-ranking only. Bi-encoder = precompute + ANN → retrieval.**`,
      `**Production = bi-encoder retrieve (100s from millions) → cross-encoder re-rank (the 100s).**`,
      `**Embedding quality = pretraining objective:** raw BERT (MLM) is poor; SBERT/E5/BGE (contrastive + hard negatives) work.`,
      `**ANN knob (ef_search/nprobe) trades recall vs latency — calibrate on tail queries, not benchmarks.**`,
    ],
    figures: {
      encoders: `<svg viewBox="0 0 360 104" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="90" y="14" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Bi-encoder</text>
  <rect x="30" y="22" width="52" height="20" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="56" y="36" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">enc(q)</text>
  <rect x="98" y="22" width="52" height="20" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="124" y="36" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">enc(d)</text>
  <text x="90" y="58" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">separate → precompute d → ANN (fast)</text>
  <line x1="180" y1="18" x2="180" y2="92" stroke="var(--rim)"/>
  <text x="272" y="14" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Cross-encoder</text>
  <rect x="214" y="22" width="116" height="20" rx="4" fill="none" stroke="var(--amber)"/><text x="272" y="36" text-anchor="middle" fill="var(--amber)" font-size="7.5">enc(q ⊕ d) jointly</text>
  <text x="272" y="58" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">joint → accurate but O(N)/query</text>
  <text x="30" y="86" fill="var(--ink-low)" font-size="7.5">use both: bi-encoder retrieves, cross-encoder re-ranks the survivors</text>
</svg>`,
    },
  },
  {
    id: 'multitask_ranking',
    interactiveId: 'value_model_mixer_viz',
    title: 'Multi-Task & Multi-Objective Ranking',
    subtitle: 'Value models, shared-bottom vs MMoE, combining CTR + dwell + shares',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['multi-task', 'value model', 'MMoE', 'ranking', 'RecSys'],
    summary: `Real feeds don't rank by one thing. A staff-level ranker predicts several outcomes at once — probability of click, of a long dwell, of a share, of a report — and then a **value model** combines them into the single score that decides the order. "Rank by engagement" is not a design; "rank by 1.0·p(click) + 1.2·p(dwell) + 0.5·p(share) − 3.0·p(report)" is.

[FIGURE: mmoe]

---

**One model, many heads.** A **shared-bottom** network learns common representations, then splits into task-specific heads (click head, dwell head, share head). It's cheap but forces all tasks to share one trunk — when tasks conflict (clickbait maximizes clicks but minimizes dwell), the shared trunk is pulled in opposite directions and every task suffers (negative transfer). **MMoE (Multi-gate Mixture-of-Experts)** fixes this: several expert sub-networks, and each task has its own gate that softly picks which experts to use — so conflicting tasks can route to different experts.

---

**The value-model weights are a product decision, not a learned parameter.** They encode what the business values: how much a share is worth relative to a click, how hard to penalize a report. There's no weight vector that maximizes every objective — pushing CTR up promotes clickbait and raises the report rate. The weights are usually tuned by online A/B tests against a north-star metric (long-term retention), not by offline loss.

---

**Guardrails ride in the same score.** Harm signals (report, "see fewer", hide) enter the value model as *negative* weights, so harmful-but-clicky content is demoted at ranking time rather than filtered after the fact.`,
    interactivePrompt: `Before you touch the controls: predict what happens to the report-rate of the top-3 items as you push the CTR weight up and the report penalty toward zero — and why no single weight vector wins every objective.`,
    keyPoints: [
      `**Multi-task ≠ multi-objective. The model predicts multiple heads; the value model combines them.** Keep them separate conceptually: the heads are learned (p(click), p(dwell), …); the combination weights are chosen to encode business value and tuned online.`,
      `**Shared-bottom is cheap but suffers negative transfer when tasks conflict; MMoE's per-task gates route conflicting tasks to different experts.** Symptom of negative transfer: adding a task *lowers* another task's metric versus training it alone. MMoE (or PLE) is the standard fix at scale.`,
      `**Value-model weights are tuned online, not offline.** Offline loss can't see long-term retention or harm. Weights are calibrated by A/B tests against a north-star metric — which is why every prediction head must be *calibrated* (a probability, not just a rank score) for the weighted sum to be meaningful.`,
    ],
    takeaway: `Staff-level ranking predicts several calibrated outcomes with a multi-task model (MMoE routes conflicting tasks to separate experts) and fuses them with a value model whose weights are a business decision tuned by online A/B tests — with harm signals entering as negative weights so guardrails live inside the ranking score.`,
    checkQuestions: [
      {
        q: `A shared-bottom model jointly trains click and dwell heads. Adding the click task *lowers* dwell-head accuracy versus training dwell alone. What's happening and what's the standard fix?`,
        options: [
          `A) Overfitting — the click task adds parameters; add dropout to the dwell head.`,
          `B) Negative transfer — click and dwell conflict (clickbait raises clicks, lowers dwell), so the shared trunk is pulled in opposing directions. Move to MMoE/PLE where per-task gates route the conflicting tasks to different experts, decoupling their representations.`,
          `C) Label leakage from click into dwell; remove click features from the dwell head.`,
          `D) Learning-rate mismatch; give each head its own optimizer and the conflict disappears.`,
        ],
        answer: `B`,
      },
      {
        q: `Why must each prediction head be *calibrated* before the value model combines them as w₁·p₁ + w₂·p₂ + …?`,
        options: [
          `A) Calibration only matters for the click head; other heads can be uncalibrated rank scores.`,
          `B) Because the weighted sum treats each pᵢ as a real probability with comparable scale. If one head outputs inflated scores (e.g., systematically 2× true probability), its effective weight is doubled regardless of the chosen wᵢ, silently corrupting the ranking. Calibrated heads make the weights mean what they say.`,
          `C) Because uncalibrated heads cause NaNs in the dot product.`,
          `D) Calibration isn't required — sorting by the weighted sum is invariant to per-head scaling.`,
        ],
        answer: `B`,
      },
      {
        q: `The team wants to set the value-model weights (click, dwell, share, report) "optimally." What's the right procedure?`,
        options: [
          `A) Fit the weights by minimizing offline cross-entropy on historical logs — the data already encodes the optimum.`,
          `B) Grid-search weights to maximize offline NDCG on the click label, since NDCG is the ranking metric.`,
          `C) Treat the weights as a product/policy choice and tune them with online A/B tests against a north-star metric (e.g., 30-day retention or healthy-session rate), because the objective — long-term value and low harm — isn't visible in offline click loss.`,
          `D) Set report weight to the negative of the click weight and leave the rest at 1.0; symmetry gives the optimum.`,
        ],
        answer: `C`,
      },
    ],
    recap: [
      `**Rank by a value model, not one metric:** score = Σ wᵢ·p(outcomeᵢ) − w·p(harm).`,
      `**Multi-task model = many heads (click/dwell/share/report); value model = the weighted combination.**`,
      `**Shared-bottom** is cheap but negative-transfers on conflicting tasks; **MMoE/PLE** gates route them to separate experts.`,
      `**Weights are a business decision, tuned by online A/B vs a north-star (retention), not offline loss.**`,
      `**Heads must be calibrated** or the weights don't mean what they say. **Guardrails = negative weights** on harm signals.`,
    ],
    figures: {
      mmoe: `<svg viewBox="0 0 360 116" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="140" y="92" width="80" height="18" rx="4" fill="var(--depth)" stroke="var(--rim)"/><text x="180" y="105" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">shared input</text>
  ${['E1', 'E2', 'E3'].map((e, i) => `<rect x="${80 + i * 70}" y="56" width="44" height="18" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="${102 + i * 70}" y="69" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">${e}</text><path d="M180,92 L${102 + i * 70},74" stroke="var(--rim)" stroke-width="0.8"/>`).join('')}
  ${[['click', 60], ['dwell', 150], ['share', 240]].map(([t, x]) => `<rect x="${x - 22}" y="22" width="44" height="18" rx="4" fill="none" stroke="var(--amber)"/><text x="${x}" y="35" text-anchor="middle" fill="var(--amber)" font-size="7.5">${t}</text><path d="M${x},40 L${x},56" stroke="var(--ink-low)" stroke-width="0.8" stroke-dasharray="2 2"/>`).join('')}
  <text x="300" y="35" fill="var(--ink-low)" font-size="7">per-task</text><text x="300" y="45" fill="var(--ink-low)" font-size="7">gates</text>
  <text x="10" y="14" fill="var(--ink-low)" font-size="7.5">MMoE: shared experts, per-task gating → conflicting tasks route apart</text>
</svg>`,
    },
  },
  {
    id: 'ml_platform',
    title: 'ML Platform Design',
    subtitle: 'Feature store, training infra, model registry, serving, observability',
    difficulty: 'advanced',
    estimatedMin: 25,
    tags: ['ML platform', 'MLOps', 'feature store', 'infrastructure'],
    summary: `Two teams build separate models and both need "user purchase history." One computes it in Spark, the other in Python, with slightly different null-handling and timezone logic. Their models already see *different* values for the "same" feature at training time — and at serving time the real-time versions drift further apart. A third team starts building the same feature for a third model. Three teams, three subtly different implementations, each debugging its own copy of one problem.

[FIGURE: platform]

---

**What a platform actually fixes.** It makes the *feature* the shared thing: computed once, registered centrally, consumed by any model. Training pulls point-in-time-correct history; serving pulls the identical computation at low latency. One definition, one source of truth, no three-way skew. A **model registry** with versioning and lineage turns rollback from a manual artifact hunt into one API call — it connects a deployed model to its training run, data, and metrics.

---

**But it only pays off at scale.** For one model and two data scientists, hand-rolled infra is genuinely simpler — build the platform then and you've built abstraction with no users. For ten models across teams, the platform amortizes fast and the hand-rolled path becomes a coordination disaster. The skill is knowing which side of that line you're on; the common failure is building platform infrastructure before any model is in production.`,
    keyPoints: [
      `**The feature store solves coordination: features computed once, registered, consumed with point-in-time correctness.** Without it, each team reinvents features with subtle divergences (nulls, timezones, windows), and training-serving skew appears when models ship. Debugging skew across three implementations is a week of engineering per incident.`,
      `**A model registry with versioning and lineage is what makes rollback one API call.** It links the deployed model to its training run, data, and eval metrics. The first production degradation without a registry turns into a multi-day investigation.`,
      `**Build the platform at ~5–10 models across teams, not before.** For 1–2 models, MLflow/W&B + FastAPI + git-versioned SQL features + manual dashboards is simpler and faster. Premature platform-building is abstraction with no users to amortize it.`,
    ],
    takeaway: `An ML platform is a coordination technology, not a modeling one: the feature store kills training-serving skew by making each feature a single point-in-time-correct definition, and the registry makes rollback one call — but both only amortize past roughly 5–10 models, so building them for the first model is premature abstraction.`,
    checkQuestions: [
      {
        q: `A startup with 3 data scientists is shipping its first production model. Should they build an ML platform (feature store, registry, serving infra)?`,
        options: [
          `A) Yes — a feature store prevents training-serving skew from day one, and it's easier to build before models exist than to retrofit.`,
          `B) Yes, but only the online feature store; defer offline training infra to the second model.`,
          `C) Not yet — start with MLflow/W&B for tracking, FastAPI + Docker for serving, and git-versioned pandas/SQL features with manual dashboards. Invest in platform infra past ~3–5 production models, >5 DS, or when >20% of eng time goes to tooling.`,
          `D) Yes — a model registry and serving infra are mandatory for any production deployment regardless of team size.`,
        ],
        answer: `C`,
      },
      {
        q: `What specific failure does point-in-time correctness in a feature store prevent?`,
        options: [
          `A) Model overfitting caused by too many features in the training set.`,
          `B) Label leakage from the future: without point-in-time joins, a training row for an event at time t can be enriched with feature values computed *after* t (e.g., a 7-day aggregate that includes days after the label), inflating offline metrics and collapsing in production. Point-in-time joins reconstruct feature values as of t.`,
          `C) Slow feature retrieval at serving time due to unindexed lookups.`,
          `D) Embedding staleness in the ANN retrieval index.`,
        ],
        answer: `B`,
      },
      {
        q: `A production model's quality silently dropped last night. With a model registry + lineage, what does the response look like versus without one?`,
        options: [
          `A) Identical — the registry stores artifacts but doesn't help diagnose or roll back a live regression.`,
          `B) With a registry, you compare the currently-served version to the previous one, see which training run/data/metrics changed, and roll back with one call; without it, you manually hunt for the last-good artifact and hope the serving environment hasn't changed — turning minutes into days.`,
          `C) Without a registry it's faster, because you're forced to fix forward rather than roll back.`,
          `D) The registry only matters for compliance audits, not incident response.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Problem:** N teams reimplement the same feature → training-serving skew + duplicated debugging.`,
      `**Feature store:** compute once, register, consume with point-in-time correctness (prevents future-leakage).`,
      `**Model registry + lineage:** links model ↔ run ↔ data ↔ metrics → rollback = one API call.`,
      `**Break-even ~5–10 models.** Below that, hand-rolled (MLflow + FastAPI + git features) is simpler.`,
      `**Classic failure:** building the platform before any model ships — abstraction with no users.`,
    ],
    figures: {
      platform: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  ${[['Feature store', 8], ['Training', 98], ['Registry', 188], ['Serving', 278]].map(([t, x]) => `<rect x="${x}" y="30" width="76" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="${x + 38}" y="46" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">${t}</text>`).join('')}
  <path d="M84,43 l14,0M174,43 l14,0M264,43 l14,0" stroke="var(--ink-low)" stroke-width="1.2"/>
  <text x="8" y="20" fill="var(--ink-low)" font-size="7.5">one feature definition → point-in-time train + low-latency serve (no skew)</text>
  <text x="8" y="76" fill="var(--ink-low)" font-size="7.5">observability spans all four · registry gives one-call rollback</text>
</svg>`,
    },
  },
  {
    id: 'ranking_systems',
    title: 'Learning-to-Rank Systems',
    subtitle: 'Pointwise vs pairwise vs listwise, LambdaMART, position bias, distillation',
    difficulty: 'advanced',
    estimatedMin: 25,
    tags: ['LTR', 'learning-to-rank', 'LambdaMART', 'position bias'],
    summary: `A trap that catches almost everyone: training a classifier to predict relevance and sorting by its score is *not* the same as training a ranker. A classifier tuned for per-item accuracy can get every absolute score right and still order them wrong — because ranking is *relative*. What matters is which item beats which, not the exact number on each.

[FIGURE: ltr]

---

**Three ways to train for order.** *Pointwise* scores each item alone and misses the relative point. *Pairwise* learns "A should rank above B" — fixes pairs but treats a swap at rank 1 the same as a swap at rank 100. *Listwise* optimizes the whole list, which is what you want, but it's expensive and sensitive to label noise. For tabular ranking (web search, ads) the practical winner is **LambdaMART**: gradient-boosted trees whose gradients are weighted by NDCG impact, so a swap near the top gets a far bigger push than one near the bottom — a ranking-aware signal without needing NDCG to be differentiable (it isn't).

---

**The deeper problem none of these fixes alone: position bias.** Click data is contaminated by *where* items were shown. Position 1 collects clicks whether or not it deserved them, so training on raw clicks teaches the model to reproduce position effects — a self-reinforcing loop where it keeps promoting whatever the last model promoted. Breaking it needs inverse-propensity weighting: weight each example by 1/P(click|position), so position-1 examples count less and position-5 examples count more.`,
    keyPoints: [
      `**LambdaMART is the tabular workhorse: GBM with gradients weighted by NDCG impact.** Each item's gradient sums LambdaRank pair-gradients weighted by how much swapping the pair changes NDCG. A rank-1-vs-2 swap gets a much larger gradient than rank-98-vs-99 — NDCG-aware training without a differentiable NDCG.`,
      `**Position bias is a correctness bug that loss choice alone can't fix.** Position 1 gets ~10× the clicks of position 10 regardless of relevance; raw-click training reproduces the prior model's ranking. Inverse-propensity weighting (1/P(click|position)) plus occasional randomization recovers unbiased relevance.`,
      `**Online distillation decouples quality from serving latency.** A large teacher with expensive features (cross-attention, full history) trains offline; a small student matches its rankings without those features and serves fast. The standard pattern when the most accurate model is too slow to serve directly.`,
    ],
    takeaway: `Ranking is a relative problem, so you train for order (LambdaMART weights each gradient by NDCG impact) not for per-item accuracy — but click-trained rankers also inherit position bias, which only inverse-propensity weighting (not a better loss) removes.`,
    checkQuestions: [
      {
        q: `A classifier assigns correct absolute relevance probabilities to every item, yet its ranking is worse than a pairwise model with less accurate scores. How is that possible?`,
        options: [
          `A) It isn't — correct absolute scores imply correct ordering.`,
          `B) Ranking depends only on relative order. A classifier trained on per-item log-loss spends capacity getting easy items' absolute scores right and can misorder the few hard, high-value pairs near the top; a pairwise/listwise objective spends capacity exactly where order matters. Correct on average ≠ correct where the ranking is decided.`,
          `C) The classifier's scores need softmax normalization before sorting; without it the order is arbitrary.`,
          `D) Only if the classifier is uncalibrated — calibrate it and its ranking matches the pairwise model.`,
        ],
        answer: `B`,
      },
      {
        q: `Why does LambdaMART weight each pairwise gradient by |ΔNDCG| rather than training directly to maximize NDCG?`,
        options: [
          `A) Because NDCG is faster to compute as a gradient than as a metric.`,
          `B) Because NDCG is a sorting-based, piecewise-constant metric — it has zero gradient almost everywhere and is non-differentiable, so you can't optimize it directly. Weighting each pair's gradient by how much swapping it would change NDCG injects the ranking-position signal into a well-defined gradient the GBM can follow.`,
          `C) Because |ΔNDCG| weighting is equivalent to L2 regularization on the trees.`,
          `D) Because direct NDCG optimization requires listwise labels, which are never available.`,
        ],
        answer: `B`,
      },
      {
        q: `You deploy an online-distilled student ranker. It matches the teacher on held-out ranking but underperforms in production. What's the most likely cause tied to distillation?`,
        options: [
          `A) The student has fewer parameters, so it must be underfit; just enlarge it to the teacher's size.`,
          `B) Distribution shift between the distillation data and live traffic: the student only mimics the teacher where the teacher was evaluated. If live queries drift from the distillation set (new items, seasonal intent), the student's imitation degrades. Refresh distillation on recent traffic and monitor teacher-student agreement online.`,
          `C) Distillation always loses exactly the teacher's top-1 accuracy; nothing to fix.`,
          `D) The student can't use the teacher's expensive features at serving, so it must be fed them anyway.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Sorting a classifier ≠ ranking.** Ranking is relative; per-item accuracy can still misorder the pairs that matter.`,
      `**Pointwise (scores alone) → pairwise (A>B) → listwise (whole list).** Cost and fidelity rise together.`,
      `**LambdaMART:** GBM with gradients weighted by |ΔNDCG| → top swaps pushed hardest, no differentiable NDCG needed.`,
      `**Position bias:** pos-1 ≈ 10× clicks regardless of relevance → raw-click training self-reinforces. Fix = IPW (1/P(click|pos)) + randomization.`,
      `**Online distillation:** big teacher (expensive features, offline) → small fast student. Watch for train/serve distribution shift.`,
    ],
    figures: {
      ltr: `<svg viewBox="0 0 360 92" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  ${[['Pointwise', 'score each item', 8], ['Pairwise', 'A > B', 128], ['Listwise', 'whole list', 248]].map(([t, s, x]) => `<rect x="${x}" y="26" width="104" height="30" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="${x + 52}" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">${t}</text><text x="${x + 52}" y="51" text-anchor="middle" fill="var(--ink-mid)" font-size="7">${s}</text>`).join('')}
  <text x="8" y="16" fill="var(--ink-low)" font-size="7.5">cost + ranking-fidelity increase left → right</text>
  <text x="8" y="74" fill="var(--ink-low)" font-size="7.5">LambdaMART sits between: pairwise gradients × |ΔNDCG| weighting</text>
</svg>`,
    },
  },
  {
    id: 'cold_start',
    title: 'Cold-Start Strategies',
    subtitle: 'New user, new item, new platform — bootstrapping without interaction history',
    difficulty: 'intermediate',
    estimatedMin: 22,
    tags: ['cold start', 'RecSys', 'exploration', 'content-based'],
    summary: `Collaborative filtering learns from interactions — so it has nothing to say about a user who just signed up or an item posted a minute ago. Cold start is the systematic failure mode of every recommender, and interviewers probe it because the naive design silently serves garbage to exactly the users and creators you most want to keep.

[FIGURE: coldstart]

---

**Three distinct cold-start problems, three different fixes.** *New user:* no history → fall back to context (device, geo, time), onboarding signals (a quick interest picker), and demographic/popularity priors, then update a real-time embedding fast from the first interactions. *New item:* no interactions → lean on content features (text, image, audio, creator) via a content-based or two-tower model that embeds items from features alone, so a brand-new item lands near similar known items. *New platform:* no data at all → content-based until enough interactions accrue to bootstrap collaborative signal (the flywheel's ignition problem).

---

**Exploration is the engine that ends cold start.** A pure-exploitation system never shows the new item enough to learn whether it's good — so you must deliberately allocate impressions to under-explored items (epsilon-greedy, UCB, or Thompson sampling on the value estimate). The cost is real: exploration spends some engagement now to buy the signal that makes future ranking possible. Framed as a bandit, cold start *is* the exploration-exploitation tradeoff.`,
    keyPoints: [
      `**"Cold start" is three problems — new user, new item, new platform — with different fixes.** New user → context + onboarding + popularity prior, fast embedding update. New item → content features so it embeds without interactions. New platform → content-based until the flywheel ignites.`,
      `**Content-based models are the bridge because they embed from features, not interactions.** A two-tower item tower fed text/image/creator features can place a never-seen item in embedding space immediately — the single most important architectural choice for item cold start.`,
      `**Exploration is mandatory, and it's a measurable cost.** Under-explored items never accumulate signal under pure exploitation. Allocate impressions via epsilon-greedy/UCB/Thompson; budget the short-term engagement you spend to gain long-term catalog coverage.`,
    ],
    takeaway: `Cold start is three separate problems (new user / new item / new platform) unified by one cause — no interaction history — and solved by two levers: content-based embeddings that represent entities from features alone, and deliberate exploration that spends present engagement to buy the signal collaborative filtering needs.`,
    checkQuestions: [
      {
        q: `A video platform's recommender serves brand-new uploads almost no impressions, so new creators churn. Which fix most directly addresses the *item* cold-start cause?`,
        options: [
          `A) Increase the ranker's capacity so it can score sparse-interaction items more accurately.`,
          `B) Embed new items from content features (title, transcript, thumbnail, audio, creator) via a content/two-tower item tower so they land near similar known items and are retrievable before any interactions — paired with an exploration budget that guarantees new items a minimum impression allocation.`,
          `C) Lower the retrieval recall threshold so more items pass through overall.`,
          `D) Retrain the collaborative-filtering model more frequently (hourly) so new items appear sooner.`,
        ],
        answer: `B`,
      },
      {
        q: `Why does a pure-exploitation recommender never solve item cold start on its own, regardless of model quality?`,
        options: [
          `A) It does solve it, just slowly, as the model retrains.`,
          `B) A new item has no interactions, so its predicted engagement is uncertain/low; pure exploitation only shows the current best, so the new item is never shown, never gathers interactions, and stays cold — a chicken-and-egg loop. Only deliberate exploration (showing uncertain items) breaks it.`,
          `C) Because exploitation increases inference latency, crowding out new items.`,
          `D) Because collaborative filtering mathematically assigns new items a score of exactly zero forever.`,
        ],
        answer: `B`,
      },
      {
        q: `For a brand-new user with zero history, which combination is the sound first-session strategy?`,
        options: [
          `A) Show a fixed globally-popular list and wait until session two to personalize.`,
          `B) Combine context signals (device, locale, time), any onboarding interest picker, and a popularity prior for the cold ranking, while rapidly updating a real-time user embedding from the first few interactions within the session.`,
          `C) Require the user to link an external account so history can be imported before serving anything.`,
          `D) Train a fresh per-user model online from scratch during the first session.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Cold start = no interaction history.** Three flavors: new user, new item, new platform.`,
      `**New user:** context + onboarding + popularity prior → fast real-time embedding update.`,
      `**New item:** content-based / two-tower item tower embeds from features → lands near similar known items.`,
      `**New platform:** content-based until the flywheel ignites.`,
      `**Exploration ends cold start** (ε-greedy/UCB/Thompson) — a real cost: spend engagement now to buy signal. Cold start *is* explore/exploit.`,
    ],
    figures: {
      coldstart: `<svg viewBox="0 0 360 92" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  ${[['New user', 'context + onboarding + prior', 6], ['New item', 'content-based embedding', 126], ['New platform', 'content → flywheel', 246]].map(([t, s, x]) => `<rect x="${x}" y="26" width="108" height="32" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="${x + 54}" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">${t}</text><text x="${x + 54}" y="51" text-anchor="middle" fill="var(--ink-mid)" font-size="6.8">${s}</text>`).join('')}
  <text x="6" y="16" fill="var(--ink-low)" font-size="7.5">one cause (no history), three fixes</text>
  <text x="6" y="76" fill="var(--amber)" font-size="7.5">exploration is the engine that ends all three</text>
</svg>`,
    },
  },
  {
    id: 'ranking_calibration',
    interactiveId: 'value_model_mixer_viz',
    title: 'Calibration, Guardrails & Counterfactual Eval',
    subtitle: 'Why ranking scores must be probabilities, and how to trust offline numbers',
    difficulty: 'advanced',
    estimatedMin: 24,
    tags: ['calibration', 'guardrails', 'counterfactual', 'off-policy', 'evaluation'],
    summary: `For pure ranking, only the *order* of scores matters — so why calibrate? Because at staff scale the score rarely stays a pure ranking score. The moment it feeds an ad auction (expected value = pCTR × bid), a value model (weighted sum of heads), or a threshold ("auto-approve if fraud prob < 0.01"), the *number* matters, not just the order. An uncalibrated 0.9 that's really 0.6 systematically overbids, mis-weights, and mis-thresholds.

[FIGURE: calib]

---

**Calibration means the number is a probability.** Of all items scored 0.7, about 70% should be positive. Measure it with a reliability diagram and Expected Calibration Error; fix it with Platt scaling or isotonic regression on a held-out set. Deep rankers are systematically overconfident, so calibration is a required post-processing step whenever the score is consumed as a probability.

---

**Guardrail metrics catch the harm your objective ignores.** You optimize engagement; you *guard* the metrics that must not regress — latency, harmful-content rate, creator diversity, complaint rate. In every A/B test the primary metric can win while a guardrail quietly breaks; a launch that lifts engagement 2% but raises the report rate 15% should not ship. Guardrails are the veto, not the goal.

---

**Counterfactual (off-policy) evaluation lets you estimate a new ranker's online performance from logged data, before serving it.** Because logs were collected under the *old* policy, you reweight by inverse propensity (how likely the old policy was to show each item) to estimate what the *new* policy would have earned. It's how you kill bad candidates before they ever touch live traffic.`,
    interactivePrompt: `Before you touch the controls: the report penalty here is a guardrail entering the score as a negative weight. Predict what a launch looks like on the primary metric versus the guardrail as you drop that penalty toward zero.`,
    keyPoints: [
      `**Calibration matters exactly when the score becomes a number, not just an order.** Auctions (pCTR×bid), value models (Σwᵢpᵢ), and thresholds all consume the magnitude. Measure with ECE / reliability diagrams; fix with Platt or isotonic on held-out data. Deep models are overconfident by default.`,
      `**Guardrail metrics are the veto in every experiment.** Define them before launch (latency, harm rate, diversity, complaints). The primary metric winning while a guardrail regresses is the most common way a "successful" A/B test ships damage.`,
      `**Counterfactual/off-policy evaluation estimates online lift from logs via inverse-propensity weighting.** It reweights logged outcomes by 1/P(action|old policy) to approximate the new policy's value — the tool for pruning candidates before an online test. High-variance when the new policy diverges far from the logged one (clipped/doubly-robust estimators tame it).`,
    ],
    takeaway: `Order-only thinking breaks the moment a ranking score feeds an auction, value model, or threshold — then it must be a calibrated probability; guardrail metrics veto launches that win the primary but harm users; and counterfactual (IPW) evaluation estimates a new policy's online value from old logs so bad rankers die before touching traffic.`,
    checkQuestions: [
      {
        q: `An ads system ranks by expected value = pCTR × bid. The pCTR model is a well-ordered but overconfident deep net. What breaks, and what's the fix?`,
        options: [
          `A) Nothing — expected value only needs correct ordering of pCTR, which the model has.`,
          `B) Expected value uses the pCTR *magnitude*, so systematic overconfidence inflates expected value non-uniformly across items, distorting which ad wins and how much it's charged. Calibrate pCTR (Platt/isotonic on held-out data, monitor ECE) so pCTR×bid reflects true expected value.`,
          `C) The bid needs calibration, not the pCTR; normalize bids to [0,1].`,
          `D) Switch from pCTR×bid to ranking by pCTR alone to avoid the calibration requirement.`,
        ],
        answer: `B`,
      },
      {
        q: `An A/B test lifts the primary engagement metric 2% (stat-sig) but the harmful-content report rate rises 15%. What should happen?`,
        options: [
          `A) Ship it — the primary metric is the objective and it won with significance.`,
          `B) Do not ship on the primary alone. The report rate is a guardrail defined to protect users; a 15% regression is a veto regardless of the engagement win. Investigate what the change promoted, and only ship a variant that lifts engagement without breaking the guardrail.`,
          `C) Ship it but lower the report-button visibility to bring the metric back down.`,
          `D) Ship it — guardrail metrics are advisory and don't block launches.`,
        ],
        answer: `B`,
      },
      {
        q: `You want to estimate a new ranker's online CTR from logs collected under the current ranker, before any live test. Which approach is valid and what's its main risk?`,
        options: [
          `A) Just compute the new ranker's average predicted CTR on the logs — that's its online CTR.`,
          `B) Inverse-propensity weighting: reweight each logged impression by 1/P(shown | old policy) to estimate what the new policy would have earned. Main risk is high variance when the new policy diverges from the logged one (rarely-logged actions get huge weights); clipping or a doubly-robust estimator reduces it.`,
          `C) Retrain the new ranker on the logs and report its training accuracy as the online estimate.`,
          `D) Compare offline NDCG of both rankers on the logs; the higher NDCG is guaranteed to win online.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Order-only is a myth at scale:** the score feeds auctions (pCTR×bid), value models (Σwᵢpᵢ), thresholds → magnitude matters.`,
      `**Calibration = the number is a probability.** Measure ECE / reliability diagram; fix with Platt / isotonic. Deep nets are overconfident.`,
      `**Guardrail metrics = the veto:** define harm/latency/diversity pre-launch; primary can win while a guardrail breaks.`,
      `**Counterfactual (off-policy) eval:** IPW-reweight old logs to estimate new-policy value → kill bad rankers pre-traffic.`,
      `**IPW risk = variance** when new policy diverges from logged; clip or use doubly-robust estimators.`,
    ],
    figures: {
      calib: `<svg viewBox="0 0 360 108" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <line x1="40" y1="96" x2="40" y2="14" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="40" y1="96" x2="150" y2="96" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="40" y1="96" x2="150" y2="20" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M40,96 C 80,90 100,78 150,40" fill="none" stroke="var(--prime)" stroke-width="2"/>
  <text x="46" y="14" fill="var(--ink-low)" font-size="7">empirical</text>
  <text x="95" y="34" fill="var(--ink-low)" font-size="7">ideal y=x</text>
  <text x="40" y="107" fill="var(--ink-low)" font-size="7.5">predicted prob →</text>
  <text x="185" y="30" fill="var(--ink-hi)" font-size="8" font-weight="700">overconfident: gap = ECE</text>
  <text x="185" y="48" fill="var(--ink-mid)" font-size="7.5">score below the diagonal →</text>
  <text x="185" y="60" fill="var(--ink-mid)" font-size="7.5">predicted &gt; actual probability</text>
  <text x="185" y="80" fill="var(--amber)" font-size="7.5">fix: Platt / isotonic on held-out</text>
</svg>`,
    },
  },
  {
    id: 'real_time_ml',
    interactiveId: 'latency_budget_viz',
    title: 'Real-Time ML',
    subtitle: 'Streaming features, latency SLAs, caching, async fan-out, fallbacks',
    difficulty: 'advanced',
    estimatedMin: 25,
    tags: ['real-time ML', 'latency', 'streaming', 'caching', 'serving'],
    summary: `A fraud model that answers in 500ms is useless — the transaction clears in 200ms or the user gives up. A recommender that takes 2 seconds has already lost the session. This is the one hard constraint batch ML never faces: the prediction must arrive *before the user's patience runs out.*

[FIGURE: latency]

---

**Everything that makes the model better makes it slower.** Every extra feature buys accuracy and costs latency; every extra layer, the same. So real-time design isn't vague tradeoffs — it's *numbers*: not "this adds latency" but "this adds 15ms, the SLA is 50ms, so 35ms is left for everything else." You budget milliseconds like money, because you can't spend what you don't have.

---

**Async fan-out is non-negotiable.** Issue all feature-store requests in parallel and wait for the *max*, not the *sum*: four 8ms features in parallel cost 8ms, in serial 32ms. Pair each with a timeout that returns a default rather than blocking past the SLA. Precompute what you can — stream user aggregates into a cache so serving is a lookup plus a light adjustment, not a heavy recompute.

---

**Define the fallback before the incident, not during it.** Every real-time system needs a documented answer to "what happens when the model endpoint is slow or down": popularity response, rule-based score, or last cached prediction, behind a circuit breaker that trips to the fallback when error rate crosses a threshold. The organizational catch: model-builders optimize accuracy, serving-builders optimize latency, and unless the budget is explicit and shared, each optimizes its own half and the system misses the SLA that only exists when you add both.`,
    interactivePrompt: `Before you touch the controls: turn off async fan-out for four feature sources. Predict whether the SLA breaks before the model even runs — and why parallel fetch is the difference between max and sum.`,
    keyPoints: [
      `**The latency budget is a hard per-component allocation set before deployment.** A 50ms fraud budget: features 5–10ms, inference 10–20ms, network 2–5ms, serialization 1–2ms. If inference alone eats 40ms, there's no room for features. Profile end-to-end in production — the bottleneck is usually feature retrieval, not inference.`,
      `**Async fan-out turns a sum into a max.** Four 8ms features cost 8ms in parallel, 32ms in serial. Every multi-source system must fan out and time out (slow source → default value, not a blocked request).`,
      `**A predefined fallback + circuit breaker is mandatory.** Without it, engineers improvise under incident pressure and make it worse. Define the degraded response (popularity/rule/cache) and trip to it automatically when error rate spikes.`,
    ],
    takeaway: `Real-time ML is latency budgeting in milliseconds: accuracy and latency trade off continuously, async fan-out converts feature-fetch cost from a sum to a max, and a predefined fallback behind a circuit breaker is what keeps the system answering when the model can't — with the budget made explicit so accuracy and serving teams don't each optimize half.`,
    checkQuestions: [
      {
        q: `Your fraud model has 150ms P99 but the SLA is 50ms. What's the right first move and overall approach?`,
        options: [
          `A) Move fraud scoring to a nightly batch and use yesterday's risk score at transaction time, eliminating real-time inference.`,
          `B) Raise the decision threshold to cut alert volume and reduce downstream lookups, lowering average latency.`,
          `C) Profile to attribute the 150ms (features vs inference vs network); co-locate features in Redis with async parallel fetch (<2ms), serve a distilled/quantized model or GBM (~5ms), precompute streaming user-risk into the cache (serving = lookup + light adjustment); if still >50ms, decide async — let the transaction proceed and reverse within 30s if scored fraudulent.`,
          `D) Add a request queue and process fraud checks sequentially to stabilize P99 by removing concurrency spikes.`,
        ],
        answer: `C`,
      },
      {
        q: `Four feature sources each take 8ms. Your service fetches them one after another and blames the model for a 40ms+ latency. What's the actual problem?`,
        options: [
          `A) The model is genuinely too slow; quantize it to INT8.`,
          `B) Serial feature fetch pays the sum (4×8 = 32ms) instead of the max (8ms). Issue the four requests concurrently (async fan-out) with a per-request timeout, and feature latency drops to ~8ms, freeing the budget the model actually needs.`,
          `C) 8ms per feature is impossible; the feature store must be misconfigured.`,
          `D) Reduce to one feature source to cut latency, accepting the accuracy loss.`,
        ],
        answer: `B`,
      },
      {
        q: `Why is a documented fallback + circuit breaker considered part of the *design*, not an ops afterthought?`,
        options: [
          `A) It's genuinely an ops concern; the design is done once the model meets the SLA in load tests.`,
          `B) Because the system's availability contract depends on it: when the model endpoint degrades (it will), the choice of degraded response — popularity, rule-based, or last cached prediction — determines whether users see something reasonable or an error, and a circuit breaker makes that switch automatic instead of a human improvising mid-incident.`,
          `C) Because fallbacks improve the model's offline accuracy metrics.`,
          `D) Because regulators require a fallback flowchart in the design document.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Real-time = the answer must beat the user's patience.** Batch never faces this.`,
      `**Budget in ms, not vibes:** e.g., 50ms fraud = features 5–10 + inference 10–20 + net 2–5 + serialize 1–2.`,
      `**Async fan-out = max, not sum:** 4×8ms parallel = 8ms; serial = 32ms. Add timeouts → default on slow source.`,
      `**Precompute + cache:** stream aggregates so serving = lookup + light adjust.`,
      `**Fallback + circuit breaker are design, not ops:** define the degraded response (popularity/rule/cache) before the incident.`,
    ],
    figures: {
      latency: `<svg viewBox="0 0 360 84" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="14" fill="var(--ink-low)" font-size="7.5">50ms budget — one bar per component</text>
  ${[['features', 8, 'var(--prime)'], ['inference', 15, 'var(--prime)'], ['network', 4, 'var(--amber)'], ['serialize', 2, 'var(--amber)']].map((r, i) => `<text x="8" y="${34 + i * 13}" fill="var(--ink-mid)" font-size="7.5">${r[0]}</text><rect x="70" y="${26 + i * 13}" width="${r[1] * 5}" height="9" rx="2" fill="${r[2]}" opacity="0.8"/><text x="${74 + r[1] * 5}" y="${34 + i * 13}" fill="var(--ink-low)" font-size="7">${r[1]}ms</text>`).join('')}
  <line x1="70" y1="20" x2="70" y2="80" stroke="var(--rim)"/>
  <line x1="320" y1="20" x2="320" y2="80" stroke="#ef4444" stroke-dasharray="3 3"/><text x="300" y="18" fill="#ef4444" font-size="7">SLA 50ms</text>
</svg>`,
    },
  },
  {
    id: 'sequential_recsys',
    interactiveId: 'attention_viz',
    interactivePrompt: 'SASRec is self-attention over a session. Watch how each position attends back to earlier items — the mechanism that keeps early-session signal alive where a GRU would decay it.',
    title: 'Sequential & Session-Based RecSys',
    subtitle: 'GRU4Rec, SASRec, next-item prediction, short vs long-term intent',
    difficulty: 'advanced',
    estimatedMin: 24,
    tags: ['sequential', 'session-based', 'SASRec', 'GRU4Rec', 'RecSys'],
    summary: `Two-tower and matrix-factorization models treat a user as a static bag of past items — they know *what* you clicked but throw away the *order*. That's wrong for intent. A shopper who viewed [tent, sleeping bag, hiking boots] in that order is mid-mission; the same three items reshuffled tells a different story, and the *next* item (a headlamp) is predictable only from the sequence.

[FIGURE: seq]

---

**Session-based models predict the next item from the ordered history.** GRU4Rec runs a recurrent network over the session, carrying a hidden state that summarizes everything seen so far; SASRec (and transformers4rec) replaces recurrence with self-attention so each position can look back at any earlier item directly. Self-attention wins at scale because it captures long-range dependencies without the vanishing-gradient decay a GRU suffers over a 50-event session.

---

**Short-term vs long-term intent are two different signals that must be fused.** Your *long-term* profile says you love indie films; your *current session* is 4 straight cooking videos — right now you want a fifth cooking video, not an indie trailer. A pure long-term model ignores the session; a pure session model forgets you the moment you leave. Production systems concatenate a long-term user embedding with a session-encoded state, letting the ranker weigh "who you are" against "what you're doing now."

---

**Worked scale:** a session of length L=50 in a d=128 model costs O(L²·d) ≈ 50²·128 ≈ 320k multiply-adds for one self-attention layer — trivial per request. That cheapness is why SASRec-style models moved from retrieval-only into ranking features: the sequence encoder runs in a few hundred microseconds and its output is just another embedding the funnel already knows how to consume.`,
    keyPoints: [
      `**Order carries intent that a bag-of-items loses.** [tent → sleeping bag → boots] implies a camping trip and a predictable next item; the same set unordered does not. Sequential models keep the order; MF/two-tower discard it. Use sequential features when the *next action* depends on the *recent trajectory*, not just the lifetime aggregate.`,
      `**GRU4Rec (recurrence) vs SASRec (self-attention): attention wins on long sessions.** A GRU compresses history into one hidden state and decays old items via vanishing gradients; self-attention lets position t attend directly to position 1, so a 50-event session keeps early signal. transformers4rec is the productionized transformer variant.`,
      `**Fuse short-term (session) and long-term (profile) — neither alone is enough.** The session captures *what you're doing now*; the long-term embedding captures *who you are*. Concatenate both into the ranker so a 4-video cooking binge can override a lifetime indie-film preference for the next slot, without erasing the profile.`,
      `**Sequence encoders are cheap enough to sit in ranking, not just retrieval.** O(L²·d) for L=50, d=128 is ~320k FLOPs — sub-millisecond — so the encoded session becomes just another feature the funnel consumes.`,
    ],
    takeaway: `Sequential recommenders (GRU4Rec, SASRec/transformers4rec) predict the next item from the *ordered* session rather than a bag of past items, and production systems fuse a session-encoded short-term state with a long-term profile embedding so "what you're doing now" can override "who you are" for the next slot.`,
    checkQuestions: [
      {
        q: `A retail model recommends from a lifetime-aggregate user embedding. A user who just viewed [running shoes → socks → shorts] gets recommended a blender (their most-clicked lifetime category). What's the root cause?`,
        options: [
          `A) The embedding dimension is too small to hold both the running and blender interests; increase it.`,
          `B) The model aggregates history into an order-less profile, so it can't see the in-session running-gear trajectory that predicts the next item; a session/sequential encoder that consumes the ordered recent events fixes it.`,
          `C) The blender category is over-sampled in training; down-weight it and the running items win.`,
          `D) The ANN index is stale, returning yesterday's candidates; rebuild the index more frequently.`,
        ],
        answer: `B`,
      },
      {
        q: `On sessions averaging 60 events, a GRU4Rec model under-weights items from early in the session versus a SASRec model. Why does self-attention help here?`,
        options: [
          `A) Self-attention uses more parameters, so it simply memorizes longer sessions.`,
          `B) SASRec ignores order entirely, which coincidentally helps on long sessions.`,
          `C) The GRU compresses the whole history into a single recurrently-updated hidden state, so early items decay through vanishing gradients; self-attention lets each position attend directly to any earlier position, preserving long-range signal.`,
          `D) GRUs cannot process sessions longer than 32 events, truncating the early ones.`,
        ],
        answer: `C`,
      },
      {
        q: `A team fuses a long-term user embedding with a session encoder. A user with a strong lifetime "documentary" profile is mid-session on 5 comedy clips. The system correctly serves a 6th comedy clip. Which design choice made this possible?`,
        options: [
          `A) The long-term embedding was zeroed out at session start so only recent behavior counts.`,
          `B) Both signals are concatenated into the ranker, letting the strong in-session comedy state outweigh the profile for the next slot without deleting the profile — so tomorrow's fresh session can lean documentary again.`,
          `C) The model retrained online on the 5 comedy clips, permanently overwriting the documentary profile.`,
          `D) A business rule hard-codes comedy after any 3 consecutive comedy views.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Order = intent:** [tent→bag→boots] predicts a headlamp; the unordered set doesn't. MF/two-tower discard order, sequential models keep it.`,
      `**GRU4Rec** = recurrence (one decaying hidden state); **SASRec / transformers4rec** = self-attention (each position attends to any earlier one).`,
      `**Self-attention beats GRU on long sessions** — no vanishing-gradient decay of early items.`,
      `**Fuse short-term (session) + long-term (profile):** current binge can override lifetime taste for the next slot, profile survives for tomorrow.`,
      `**Cheap:** O(L²·d) ≈ 320k FLOPs at L=50, d=128 → sub-ms → usable as a ranking feature, not just retrieval.`,
    ],
    figures: {
      seq: `<svg viewBox="0 0 360 108" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="14" fill="var(--ink-low)" font-size="7.5">ordered session → next-item prediction</text>
  <rect x="8" y="24" width="52" height="22" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="34" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">tent</text>
  <rect x="72" y="24" width="66" height="22" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="105" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">sleep bag</text>
  <rect x="150" y="24" width="52" height="22" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="176" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">boots</text>
  <rect x="214" y="24" width="66" height="22" rx="4" fill="none" stroke="var(--amber)" stroke-dasharray="3 2"/><text x="247" y="38" text-anchor="middle" fill="var(--amber)" font-size="7.5" font-weight="700">headlamp?</text>
  <path d="M60,35 l10,0M138,35 l10,0M202,35 l10,0" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="8" y="66" fill="var(--ink-mid)" font-size="7.5">self-attention: each item looks back at all earlier ones</text>
  <path d="M247,50 C200,72 100,72 34,50" stroke="var(--rim)" stroke-width="0.8" fill="none"/>
  <path d="M247,50 C210,80 140,80 105,50" stroke="var(--rim)" stroke-width="0.8" fill="none"/>
  <path d="M247,50 C230,68 190,68 176,50" stroke="var(--rim)" stroke-width="0.8" fill="none"/>
  <text x="8" y="100" fill="var(--ink-low)" font-size="7.5">short-term session state fused with long-term profile embedding</text>
</svg>`,
    },
  },
  {
    id: 'embeddings_ann',
    interactiveId: 'neighbor_explosion_viz',
    interactivePrompt: 'Nearest-neighbour search is what ANN approximates. Turn the knob and watch how many candidates you scan versus how much recall you keep — the efSearch/nprobe recall–latency tradeoff, made visible.',
    title: 'Embeddings + ANN Serving Deep-Dive',
    subtitle: 'HNSW vs IVF-PQ, the recall–latency knob, index build/refresh, quantization',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['ANN', 'HNSW', 'IVF-PQ', 'quantization', 'retrieval'],
    summary: `Once retrieval is a dot product between a query embedding and every item embedding, the bottleneck is search, not the model. Exact nearest-neighbor over 100M vectors of dimension 256 is 100M·256 ≈ 25.6 billion multiply-adds per query — hopeless in 10ms. Approximate nearest-neighbor (ANN) trades a sliver of recall for two-to-three orders of magnitude speedup.

[FIGURE: ann]

---

**HNSW builds a navigable graph; IVF-PQ partitions and compresses.** HNSW (hierarchical navigable small world) links each vector to a few neighbors across layered graphs, so a query "greedily walks" from an entry point to its neighborhood in ~log(N) hops — very fast, very high recall, but the full float vectors sit in RAM (100M × 256 × 4 bytes ≈ 100GB). IVF-PQ instead clusters vectors into, say, 4096 cells (search only the nearest few), and product-quantizes each vector — splitting 256 dims into 32 sub-vectors, each mapped to one of 256 centroids — so a vector shrinks from 1024 bytes to 32 bytes, a 32× compression that fits 100M vectors in ~3GB.

---

**Recall and latency are one knob, turned at query time.** HNSW's \`efSearch\` (how many candidates to keep on the walk) and IVF's \`nprobe\` (how many cells to scan) both trade recall for latency continuously: nprobe=8 might hit 0.92 recall at 3ms, nprobe=64 hits 0.99 recall at 12ms. You don't pick "an index" — you pick an operating point on its recall–latency curve, and that point is a product decision (how many good candidates can the funnel afford to lose?).

---

**Build cost and staleness are the operational tax.** HNSW graph construction is O(N·log N) and expensive to mutate, so high-churn catalogs favor periodic rebuilds or a small "fresh" index searched alongside the main one. Quantization (PQ) is lossy: the 32× compression that saves RAM also blurs fine distances, costing a few points of recall — acceptable at retrieval (the ranker re-scores anyway) but never in the final ranker.`,
    keyPoints: [
      `**Exact NN is infeasible at scale; ANN buys ~100–1000× speedup for a few points of recall.** 100M × 256-dim exact search ≈ 25.6B MACs/query — impossible in budget. ANN is not an optimization, it's the only way retrieval runs in real time.`,
      `**HNSW = graph walk (fast, high recall, RAM-heavy); IVF-PQ = partition + quantize (compact, tunable, mildly lossy).** HNSW keeps full float vectors (~100GB for 100M×256); IVF-PQ compresses 1024B → 32B (~32×, ~3GB) by splitting into sub-vectors and centroid-coding each. Choose by whether RAM or recall is the binding constraint.`,
      `**Recall and latency are a single tunable knob (efSearch / nprobe), set at query time.** More candidates scanned → higher recall, higher latency. You select an operating point on the curve, not a fixed index — and that point is a business call about how many good candidates the funnel can lose.`,
      `**Build cost and quantization loss are the operational reality.** HNSW is costly to mutate → high-churn catalogs use rebuilds or a side "fresh" index; PQ's compression is lossy, tolerable at retrieval (the ranker re-scores) but not in final ranking.`,
    ],
    takeaway: `ANN serving turns retrieval's dot-product-over-millions into a tunable recall–latency tradeoff: HNSW greedily walks a navigable graph (fast, high-recall, RAM-heavy) while IVF-PQ partitions and product-quantizes vectors (32× smaller, mildly lossy), and in both you pick an operating point (efSearch/nprobe) rather than a fixed index.`,
    checkQuestions: [
      {
        q: `You must index 200M 256-dim vectors but have only 8GB of RAM per serving node. Exact search and plain HNSW both overflow memory. Which approach fits, and what's the cost?`,
        options: [
          `A) Reduce embedding dimension to 4 so full vectors fit; recall stays high because low dimensions are easier to search.`,
          `B) Store all vectors on disk and do exact search per query; SSD latency is negligible at this scale.`,
          `C) IVF-PQ: cluster into cells and product-quantize each vector (e.g., 256 dims → 32 sub-vectors × 1 byte = 32B/vector ≈ 6.4GB for 200M), accepting a small recall loss from lossy quantization that the downstream ranker re-scores away.`,
          `D) Switch to a cross-encoder so no index is needed at all.`,
        ],
        answer: `C`,
      },
      {
        q: `Retrieval recall@1000 is 0.90 at nprobe=8 and 3ms. The latency budget allows 12ms and the ranker keeps missing relevant items. What's the correct single-knob change?`,
        options: [
          `A) Rebuild the index nightly instead of weekly — staleness, not recall, is the issue.`,
          `B) Raise nprobe (e.g., 8 → 64) so more IVF cells are scanned, lifting recall toward ~0.99 while staying within the 12ms budget — you're moving along the recall–latency curve, not changing index type.`,
          `C) Lower nprobe to 2 to speed up search, freeing time for the ranker to compensate.`,
          `D) Switch dot-product to cosine similarity; recall improves for free.`,
        ],
        answer: `B`,
      },
      {
        q: `A catalog adds and removes thousands of items per minute. Retrieval keeps returning deleted items and missing brand-new ones, even though HNSW recall benchmarks are excellent. What's the underlying issue?`,
        options: [
          `A) HNSW recall degrades above 10M vectors; shard the index into smaller pieces.`,
          `B) efSearch is set too high, causing the walk to revisit deleted nodes; lower it.`,
          `C) Product quantization is corrupting the new vectors; disable PQ and the freshness problem resolves.`,
          `D) HNSW graphs are costly to mutate, so a periodically-rebuilt index goes stale between builds — new items aren't in it and deleted ones linger. Fix with a small frequently-refreshed "fresh" index searched alongside the main one (or incremental upserts), not a bigger main index.`,
        ],
        answer: `D`,
      },
    ],
    recap: [
      `**Exact NN is hopeless at scale:** 100M × 256-dim ≈ 25.6B MACs/query. ANN trades a little recall for 100–1000× speed.`,
      `**HNSW** = greedy graph walk, ~log N hops, high recall, but full floats in RAM (~100GB @ 100M×256).`,
      `**IVF-PQ** = cluster into cells (scan nearest few) + product-quantize (1024B→32B, ~32×) → ~3GB, mildly lossy.`,
      `**Recall–latency is one knob** (efSearch / nprobe), set at query time — pick an operating point, not an index.`,
      `**Build is costly, PQ is lossy:** high-churn → rebuild or side "fresh" index; quantization loss OK at retrieval (ranker re-scores), never in final ranking.`,
    ],
    figures: {
      ann: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="14" fill="var(--ink-low)" font-size="7.5">recall–latency curve — you pick an operating point</text>
  <line x1="40" y1="96" x2="330" y2="96" stroke="var(--rim)"/><line x1="40" y1="24" x2="40" y2="96" stroke="var(--rim)"/>
  <text x="185" y="112" text-anchor="middle" fill="var(--ink-low)" font-size="7">latency (nprobe / efSearch ↑)</text>
  <text x="14" y="60" fill="var(--ink-low)" font-size="7" transform="rotate(-90 14 60)">recall</text>
  <path d="M50,88 C110,60 180,38 320,32" stroke="var(--prime)" stroke-width="1.5" fill="none"/>
  <circle cx="120" cy="58" r="3" fill="var(--amber)"/><text x="126" y="55" fill="var(--amber)" font-size="6.5">nprobe=8 · 0.92 · 3ms</text>
  <circle cx="250" cy="36" r="3" fill="var(--amber)"/><text x="176" y="34" fill="var(--amber)" font-size="6.5">nprobe=64 · 0.99 · 12ms</text>
  <text x="8" y="108" fill="var(--ink-mid)" font-size="6.5">HNSW: full floats, RAM-heavy · IVF-PQ: 32× smaller, mildly lossy</text>
</svg>`,
    },
  },
  {
    id: 'reranking_diversity',
    interactiveId: 'value_model_mixer_viz',
    interactivePrompt: 'Re-ranking blends competing objectives — relevance, diversity, freshness. Mix the weights and watch the served slate reshuffle; there is no single right blend, only a product operating point.',
    title: 'Re-Ranking for Diversity & Freshness',
    subtitle: 'MMR, DPP, business-rule mixing, why the ranker alone over-concentrates',
    difficulty: 'advanced',
    estimatedMin: 22,
    tags: ['re-ranking', 'diversity', 'MMR', 'DPP', 'freshness'],
    summary: `The ranker scores each item *independently* — it answers "how good is this item for this user?" one item at a time. That's exactly why the top-10 by score can be terrible as a *set*: if the user likes basketball, the 10 highest-scoring items are 10 near-identical basketball clips. The ranker has no notion that showing #2 right after #1 adds almost nothing because they're redundant.

[FIGURE: rerank]

---

**MMR trades relevance against redundancy, greedily.** Maximal Marginal Relevance picks items one at a time to maximize \`λ·relevance(i) − (1−λ)·max similarity(i, already-picked)\`. With λ=0.7 you mostly follow the ranker but penalize an item that's too similar to something already chosen. Concretely: item A scores 0.9, item B scores 0.88 but is 0.95 similar to A — MMR's marginal value for B collapses (0.7·0.88 − 0.3·0.95 ≈ 0.33) so a less-similar 0.80 item can leapfrog it.

---

**DPP models diversity as volume, not pairwise patching.** A Determinantal Point Process assigns a set a probability proportional to the *determinant* of a kernel matrix built from item quality and similarity — geometrically, the squared volume the item vectors span. Redundant items are near-parallel vectors spanning near-zero volume, so DPP naturally down-weights whole redundant *sets*, not just adjacent pairs. It's the principled cousin of MMR.

---

**Freshness and business rules ride the same re-rank stage.** New items have thin engagement history, so the ranker systematically under-scores them (a cold-start feedback trap); a freshness boost or an explicit exploration slot in re-ranking counteracts it. Hard business rules — "no more than 2 items per creator in the top 10", "at least 1 item from a followed account" — are also applied here, *after* scoring, because they constrain the *set*, which the per-item ranker structurally cannot.`,
    keyPoints: [
      `**The ranker scores items independently, so the top-k by score is often a redundant set.** "Best 10 items" ≠ "best set of 10": 10 near-duplicate basketball clips each score high but collectively bore the user. Diversity is a *set* property the per-item ranker cannot express — it must be imposed after scoring.`,
      `**MMR = greedy relevance-minus-redundancy with a λ knob.** Pick to maximize λ·rel − (1−λ)·max-sim-to-chosen. λ high → follow the ranker; λ low → aggressively diversify. Cheap, tunable, the default production diversifier.`,
      `**DPP = diversity as spanned volume, penalizing whole redundant sets.** Set probability ∝ determinant of a quality×similarity kernel = squared volume of the item vectors; near-parallel (redundant) vectors span ~0 volume and are suppressed. More principled than MMR's pairwise patch, at higher compute.`,
      `**Freshness boosts and hard business rules live in re-ranking because they constrain the set.** Cold items are under-scored by an engagement-trained ranker; freshness/exploration slots counteract it. "≤2 per creator", quotas, and mixing rules apply post-scoring — the per-item ranker can't enforce set-level constraints.`,
    ],
    takeaway: `The ranker scores items one at a time, so the top-k by raw score over-concentrates on near-duplicates; re-ranking imposes *set-level* properties — MMR trades relevance against redundancy greedily, DPP models diversity as the volume item vectors span, and freshness boosts plus hard business rules ride the same stage because they too constrain the set.`,
    checkQuestions: [
      {
        q: `A feed's top-10 by ranker score is 9 clips about the same football match. Each individually scores highest for this user. Why can't tuning the ranker fix this, and where does the fix belong?`,
        options: [
          `A) The ranker is overfit to football; add regularization and the duplicates disappear.`,
          `B) The candidates are stale; refresh retrieval and diversity resolves itself.`,
          `C) Football features are over-weighted; drop them from the feature set.`,
          `D) The ranker scores each item independently, so it can't represent that item #2 adds little given item #1 — redundancy is a set property. The fix is a re-ranking step (MMR/DPP) that penalizes similarity to already-chosen items.`,
        ],
        answer: `D`,
      },
      {
        q: `Using MMR with λ=0.7: item A has relevance 0.9; item B has relevance 0.88 but similarity 0.95 to the already-picked A; item C has relevance 0.80 and similarity 0.2 to A. Which is picked next and why?`,
        options: [
          `A) B — it has the higher raw relevance (0.88 > 0.80), and MMR always prefers higher relevance.`,
          `B) C — its MMR score 0.7·0.80 − 0.3·0.2 = 0.50 beats B's 0.7·0.88 − 0.3·0.95 ≈ 0.33, because B's near-duplication of A collapses its marginal value.`,
          `C) A — it is re-picked since it has the highest relevance overall.`,
          `D) B and C tie, so the ranker's original order breaks the tie in B's favor.`,
        ],
        answer: `B`,
      },
      {
        q: `A platform wants to guarantee "no more than 2 posts from the same creator in the top 10" and give brand-new posts a visibility boost. Where do these belong and why?`,
        options: [
          `A) In re-ranking: the per-creator cap is a set-level constraint the independently-scoring ranker can't enforce, and the freshness boost counters the ranker's systematic under-scoring of low-history items — both operate on the assembled set after scoring.`,
          `B) In the ranker's loss function as extra terms, since it already scores every item.`,
          `C) In retrieval, by fetching at most 2 items per creator and only fresh items.`,
          `D) In the ANN index, by weighting creators and recency into the embeddings.`,
        ],
        answer: `A`,
      },
    ],
    recap: [
      `**Ranker scores items independently → top-k is often a redundant set.** "Best 10 items" ≠ "best set of 10".`,
      `**MMR:** greedy pick of λ·rel − (1−λ)·max-sim-to-chosen; λ knob trades relevance vs diversity. Cheap default.`,
      `**DPP:** set probability ∝ determinant (spanned volume) of a quality×similarity kernel → suppresses whole redundant sets, not just pairs.`,
      `**Freshness/exploration slots** counter the ranker's under-scoring of thin-history new items.`,
      `**Hard business rules** ("≤2 per creator", quotas, followed-account guarantees) are set-level → applied post-scoring in re-rank, not in the ranker.`,
    ],
    figures: {
      rerank: `<svg viewBox="0 0 360 110" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="14" fill="var(--ink-low)" font-size="7.5">ranker top-k (by score)</text>
  ${['🏀','🏀','🏀','🏀','🏀'].map((_, i) => '<rect x="' + (8 + i*30) + '" y="22" width="26" height="20" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="' + (21 + i*30) + '" y="36" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">B</text>').join('')}
  <text x="8" y="58" fill="var(--ink-low)" font-size="7.5">after MMR / DPP re-rank (diverse set)</text>
  ${[['B','var(--prime)'],['C','var(--amber)'],['B','var(--prime)'],['D','var(--rim)'],['C','var(--amber)']].map((s, i) => '<rect x="' + (8 + i*30) + '" y="66" width="26" height="20" rx="4" fill="var(--depth)" stroke="' + s[1] + '"/><text x="' + (21 + i*30) + '" y="80" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">' + s[0] + '</text>').join('')}
  <text x="8" y="102" fill="var(--ink-mid)" font-size="7">λ·relevance − (1−λ)·max-similarity-to-chosen · + freshness + business rules</text>
</svg>`,
    },
  },
  {
    id: 'recsys_feedback_loops',
    interactiveId: 'exploration_exploitation_viz',
    interactivePrompt: 'Pure exploitation is what causes the popularity death-spiral: you only ever show what already won, so nothing else gets a chance to prove itself. Trade off exploration vs exploitation and watch the loop break.',
    title: 'Feedback Loops & Popularity Bias',
    subtitle: 'Exposure bias, self-reinforcing popularity, IPW / randomisation, echo chambers',
    difficulty: 'advanced',
    estimatedMin: 24,
    tags: ['feedback loop', 'popularity bias', 'IPW', 'exposure bias', 'RecSys'],
    summary: `A recommender doesn't just observe behavior — it *creates* the data it later trains on. You can only click what you were shown, and what you were shown was chosen by yesterday's model. So the logs aren't a neutral sample of preference; they're a sample of preference *conditioned on the old policy's choices*. Train naively on them and the system teaches itself to keep doing what it already did.

[FIGURE: loop]

---

**Popularity self-reinforces into a rich-get-richer spiral.** A popular item is shown more → gets more clicks (partly *because* it was shown more, not because it's better) → the model reads those clicks as quality → shows it even more. A worked sketch: item X and item Y are equally good, but X starts with 2× the exposure. X collects ~2× the clicks, the model scores it higher, next round X gets 3× exposure, then 5×… the gap widens every cycle even though true quality never differed. The long tail starves.

---

**Exposure bias is the formal name; IPW is the standard correction.** Inverse-Propensity Weighting reweights each logged example by 1/P(shown) — an item shown 10% of the time counts 10× when it *is* clicked, an item shown 90% of the time counts ~1.1×. This mathematically un-does the exposure imbalance so the model estimates *relevance* rather than *what got shown*. IPW needs the logging propensities (the probability each item was shown), which is why serious systems log them, and it has high variance when propensities are tiny — so it's paired with randomization: a small fraction of traffic serves items uniformly (or ε-greedy) to inject unbiased exposure the model can learn from.

---

**Left uncorrected, the loop produces filter bubbles and echo chambers.** A user shown one viewpoint clicks it → the model infers preference → shows more of it → the user's world narrows, and the *narrowing itself* is misread as stronger preference. The fix is the same triad as popularity: propensity correction to de-bias training, plus deliberate exploration/diversity injection to keep feeding the model signal it would otherwise never collect.`,
    keyPoints: [
      `**The recommender generates its own training data — logs are conditioned on the old policy, not neutral.** You can only click what was shown; what was shown was yesterday's model's choice. Naive training on these logs reproduces the old policy rather than learning true preference.`,
      `**Popularity is self-reinforcing: exposure → clicks → higher score → more exposure.** Two equally-good items diverge purely because one started with more exposure; the gap widens each cycle and the long tail starves. This is a systemic bias, not noise.`,
      `**IPW corrects exposure bias by reweighting each example by 1/P(shown).** A rarely-shown item's clicks count more; a heavily-shown item's count less — recovering a relevance estimate instead of an exposure estimate. Requires logged propensities and has high variance when P(shown) is tiny.`,
      `**Randomization/exploration is the necessary partner to IPW.** A small uniform/ε-greedy traffic slice injects unbiased exposure the model can't get from a pure-exploit policy — countering both popularity bias and echo-chamber narrowing at their source.`,
    ],
    takeaway: `A recommender manufactures its own training data — logs are conditioned on the old policy — so popularity self-reinforces (exposure → clicks → score → more exposure) and users drift into echo chambers; the correction is inverse-propensity weighting (reweight by 1/P(shown)) to de-bias training, paired with deliberate randomization/exploration to inject the unbiased signal IPW needs.`,
    checkQuestions: [
      {
        q: `Two items are truly equally relevant, but item X was historically shown twice as often as item Y. Trained on raw click logs, the model scores X well above Y. What is this, and what breaks the cycle?`,
        options: [
          `A) Label noise — Y's clicks are just noisier; collect more data on Y and scores equalize on their own.`,
          `B) Exposure/popularity bias — X's extra clicks come partly from extra exposure, which the model misreads as quality, widening the gap each round. Inverse-propensity weighting (down-weight X's heavily-shown examples, up-weight Y's) plus some randomized exposure recovers their true equality.`,
          `C) A calibration error in the click head; re-calibrate and X and Y converge.`,
          `D) Overfitting to X's features; add dropout and the bias disappears.`,
        ],
        answer: `B`,
      },
      {
        q: `A team wants to apply inverse-propensity weighting to de-bias its ranker. What must it have logged, and what's IPW's main failure mode?`,
        options: [
          `A) Only the clicks are needed; IPW infers propensities from click frequency, and its main issue is slow training.`,
          `B) It needs the item embeddings only; IPW's failure mode is that it increases popularity bias.`,
          `C) It must have logged the propensity P(item shown) for each impression; IPW reweights clicks by 1/P(shown), and its main failure mode is high variance when some propensities are tiny (1/P blows up) — which is why it's paired with randomization to keep propensities bounded away from zero.`,
          `D) It needs editorial relevance labels; IPW's weakness is that it can't be computed online.`,
        ],
        answer: `C`,
      },
      {
        q: `Over months, users on a video app each converge to a narrow topic and engagement per user quietly rises, but catalog coverage collapses. Leadership calls the rising engagement a win. What's actually happening?`,
        options: [
          `A) A genuine win — rising per-user engagement means the model learned preferences better; no action needed.`,
          `B) An echo-chamber feedback loop: showing one viewpoint drives clicks, the model reads narrowing as stronger preference and narrows further. Short-term engagement rises while coverage and long-term satisfaction erode; the fix is propensity de-biasing plus deliberate exploration/diversity injection.`,
          `C) Seasonal drift in content supply; wait for the catalog to rebalance itself.`,
          `D) An ANN staleness problem; rebuild the index and coverage recovers.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**The recommender makes its own data:** logs are conditioned on the old policy — naive training just reproduces it.`,
      `**Popularity self-reinforces:** exposure → clicks → higher score → more exposure. Equal-quality items diverge; the long tail starves.`,
      `**Exposure bias → IPW:** reweight each example by 1/P(shown) to recover relevance, not exposure. Needs logged propensities.`,
      `**IPW is high-variance** when P(shown) is tiny → pair with **randomization / ε-greedy exploration** to inject unbiased signal.`,
      `**Uncorrected loops → filter bubbles / echo chambers:** narrowing is misread as preference. Same fix: de-bias + explore.`,
    ],
    figures: {
      loop: `<svg viewBox="0 0 360 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="14" fill="var(--ink-low)" font-size="7.5">rich-get-richer loop</text>
  <rect x="20" y="26" width="86" height="22" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="63" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">more exposure</text>
  <rect x="254" y="26" width="86" height="22" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="297" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">more clicks</text>
  <rect x="254" y="82" width="86" height="22" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="297" y="96" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">higher score</text>
  <rect x="20" y="82" width="86" height="22" rx="5" fill="none" stroke="var(--amber)"/><text x="63" y="93" text-anchor="middle" fill="var(--amber)" font-size="7">IPW + random</text><text x="63" y="101" text-anchor="middle" fill="var(--amber)" font-size="6.5">breaks the loop</text>
  <path d="M106,37 l148,0" stroke="var(--ink-low)" stroke-width="1" marker-end="url(#ah)"/>
  <path d="M297,48 l0,34" stroke="var(--ink-low)" stroke-width="1" marker-end="url(#ah)"/>
  <path d="M254,93 l-148,0" stroke="var(--rim)" stroke-width="1" stroke-dasharray="3 2"/>
  <path d="M63,82 l0,-34" stroke="var(--ink-low)" stroke-width="1" marker-end="url(#ah)"/>
  <defs><marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="var(--ink-low)"/></marker></defs>
  <text x="8" y="118" fill="var(--ink-mid)" font-size="6.5">equal-quality items diverge purely from an exposure head-start</text>
</svg>`,
    },
  },
]
