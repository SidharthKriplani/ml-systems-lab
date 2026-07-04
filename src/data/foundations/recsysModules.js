export const RECSYS_MODULES = [
  {
    id: 'two_stage_architecture',
    interactiveId: 'retrieval_funnel_viz',
    title: 'The Two-Stage Architecture',
    subtitle: 'Why candidate generation → ranking exists — latency forces a cheap recall stage before an expensive precision stage',
    difficulty: 'foundational',
    estimatedMin: 22,
    tags: ['RecSys', 'candidate generation', 'ranking', 'latency budget'],
    summary: `Every serious recommender answers one question: "of the millions of things I could show this user, which handful do I show *now*?" The naive answer — score every item with your best model and take the top-k — is arithmetically impossible, and understanding *why* is the whole foundation of RecSys design.

[FIGURE: twostage]

---

**The latency wall is the forcing function.** Suppose a good ranker takes 1ms to score one (user, item) pair — generous, since real cross-feature rankers are slower. A catalog of 10M items would need 10,000,000 ms = 10,000 seconds of compute per request. Your latency budget is ~100ms end-to-end. You are off by **five orders of magnitude**. No amount of hardware closes a 100,000× gap at request time; you cannot buy your way out of an asymptotic mismatch.

---

**So the system splits into two stages with opposite objectives.** *Candidate generation* (retrieval) cheaply narrows 10M → ~hundreds using methods so cheap they can touch every item — embedding lookups, approximate nearest neighbor, precomputed lists. It optimizes **recall**: don't lose the good items. *Ranking* then runs an expensive, feature-rich model over only those few hundred survivors and optimizes **precision**: order them exactly right. The cheap stage runs over everything; the expensive stage runs only over what the cheap stage kept.

---

**The consequence that trips up juniors: the two stages have different metrics because they have different jobs.** Retrieval is judged on recall@k (did the relevant items make the shortlist?), ranking on NDCG/precision (are they ordered well?). And retrieval's recall is a *ceiling* — an item retrieval drops is gone forever; no ranker can order an item it never received. A brilliant ranker on top of a mediocre retriever is capped by the retriever. This is why "great model, mediocre recommendations" almost always means: audit retrieval recall first.`,
    interactivePrompt: `Before you touch the controls: the funnel narrows 10M → hundreds → tens. If you make the retrieval stage narrower to save latency, which metric can you never recover downstream, and why?`,
    keyPoints: [
      `**The two-stage split is forced by arithmetic, not taste.** 10M items × ~1ms/item = 10,000s per request against a ~100ms budget — a 100,000× gap. You cannot run the precise model over the full catalog, so a cheap recall stage must run first and an expensive precision stage second.`,
      `**Retrieval optimizes recall; ranking optimizes precision — different jobs, different metrics.** Retrieval's only sin is dropping a good item (unrecoverable); ranking's job is ordering the survivors. Judge retrieval on recall@k, ranking on NDCG/precision@k. Conflating the two is a classic interview tell.`,
      `**Retrieval recall is a hard ceiling on final quality.** If recall@500 = 0.7, then 30% of items the user would have loved never reach the ranker, and no ranking sophistication recovers them. Diagnose a "good ranker, bad results" system by measuring retrieval recall before touching the ranker.`,
      `**The stage counts are a budget allocation.** A typical split: retrieval 10M→~1k in ~2ms, ranking ~1k→~100 in ~20ms, then a re-rank/business-rules pass ~100→~10. Each stage gets a hard millisecond allocation; one overrunning stage steals from the next.`,
    ],
    takeaway: `A recommender is a recall-then-precision funnel forced by a ~100,000× latency gap: cheap candidate generation maximizes recall over millions (setting an unraiseable ceiling on final quality), then an expensive ranker maximizes precision over the few hundred survivors. One model cannot occupy both ends of the funnel.`,
    checkQuestions: [
      {
        q: `An interviewer asks you to "design YouTube recommendations." You have a strong ranking model. What is the correct *first* architectural move?`,
        options: [
          `A) Run the ranking model over the full catalog and cache the top results per user nightly, so serving is a lookup.`,
          `B) Establish that a precise ranker can't score millions of items inside the latency budget, so the system needs a cheap candidate-generation stage (recall) feeding an expensive ranking stage (precision) — then design each stage's objective and budget.`,
          `C) Start with the loss function and negative-sampling scheme for the ranker, since the ranker decides final quality.`,
          `D) Pick the embedding dimension and ANN index, since retrieval is where all the engineering difficulty lives.`,
        ],
        answer: `B`,
      },
      {
        q: `Your ranker scores 0.94 AUC offline, but users say the feed misses obvious interests. Retrieval recall@500 is measured at 0.6. Where is the bug?`,
        options: [
          `A) The ranker — 0.94 AUC on a biased offline set is misleading; retrain with harder negatives and the complaints resolve.`,
          `B) Retrieval — at recall@500 = 0.6, 40% of relevant items never reach the ranker, capping quality regardless of AUC. Fix retrieval (more candidates, better embeddings, hard negatives) before touching the ranker.`,
          `C) The metric — AUC is wrong for feeds; switch to NDCG and the gap disappears without changing the system.`,
          `D) Serving — the ranker is timing out on some requests and returning a fallback; add retries.`,
        ],
        answer: `B`,
      },
      {
        q: `Why can't you simply make candidate generation *also* precise — e.g., use the full ranking model but only over a random 1% sample of the catalog?`,
        options: [
          `A) You can — sampling 1% and ranking it precisely is exactly how production retrieval works.`,
          `B) A random 1% sample has ~1% recall of the relevant items by construction, so you'd throw away ~99% of what the user wants before ranking ever runs. Retrieval must be cheap *and* target the relevant region (via embeddings/ANN), not a blind random cut.`,
          `C) Random sampling breaks the ANN index's distance metric, causing incorrect neighbors.`,
          `D) It works but only if the sample is stratified by item popularity, which is expensive to maintain.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**The two-stage split is forced by a latency wall, not preference:** 10M items × ~1ms each ≈ 10,000s per request vs a ~100ms budget = a 100,000× gap. You cannot score the full catalog with the precise model at request time.`,
      `**Two stages, opposite objectives:** candidate generation (retrieval) is cheap and maximizes *recall* over millions; ranking is expensive and maximizes *precision* over the few hundred survivors. The cheap stage runs over everything; the expensive stage only over what the cheap stage kept.`,
      `**Retrieval recall is an unraiseable ceiling:** an item retrieval drops is gone — no ranker can order an item it never received. recall@500 = 0.6 means 40% of loved items are lost before ranking. Tell: "great ranker, mediocre feed" → audit retrieval recall first.`,
      `**Different jobs → different metrics:** judge retrieval on recall@k, ranking on NDCG/precision@k. Conflating them is a junior tell.`,
      `**Stages are a budget allocation:** e.g. retrieval 10M→1k (~2ms) → rank 1k→100 (~20ms) → re-rank 100→10 (~5ms). Each stage has a hard ms allocation; one overrun steals from the next.`,
    ],
    figures: {
      twostage: `<svg viewBox="0 0 360 92" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <polygon points="10,14 350,14 250,80 110,80" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="180" y="30" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Candidate generation — 10M → ~1000</text>
  <text x="180" y="42" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">cheap · recall · ~2ms · touches every item</text>
  <text x="180" y="62" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">Ranking — ~1000 → top-k</text>
  <text x="180" y="74" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">expensive · precision · ~20ms · survivors only</text>
  <text x="10" y="90" fill="var(--ink-low)" font-size="7">1ms/item over 10M = 10,000s vs a 100ms budget → 100,000× gap</text>
</svg>`,
    },
  },
  {
    id: 'candidate_generation',
    interactiveId: 'retrieval_funnel_viz',
    title: 'Candidate Generation & Retrieval',
    subtitle: 'Two-tower embeddings, ANN retrieval, dot-product scoring, in-batch negatives',
    difficulty: 'intermediate',
    estimatedMin: 24,
    tags: ['RecSys', 'two-tower', 'ANN', 'embeddings', 'in-batch negatives'],
    summary: `Retrieval has to do something that sounds contradictory: score a user against *every* item in the catalog, cheaply enough to run at request time. The trick that makes it possible is decoupling — and it's the single most important architecture in modern RecSys.

[FIGURE: twotower]

---

**Why joint scoring fails and the two-tower model fixes it.** The most accurate way to score a (user, item) pair is to feed both into one model so it can weigh every cross-interaction. But then the item's representation *depends on which user is asking*, so you must recompute all 10M item scores fresh per request — the impossible arithmetic again. The **two-tower** model breaks the dependency: a **user tower** encodes the user into a vector, an **item tower** encodes each item into a vector in the *same* space, and similarity is a plain **dot product** u·v. Because an item's embedding no longer depends on the user, you compute *all* item embeddings **offline, once**, and store them.

---

**ANN turns "score everything" into "look up neighbors."** With every item pre-embedded, retrieval becomes: encode the one live user (one forward pass), then find the item vectors nearest to u. Exact nearest-neighbor over 10M vectors is still too slow, so we use **Approximate Nearest Neighbor** (HNSW, IVF, ScaNN) — index structures that trade a little recall for a huge latency win, returning the top few hundred neighbors in ~10ms. Dot-product (or cosine) is chosen precisely because ANN indexes are built for it.

---

**Training: in-batch negatives are the standard recipe, and *why* matters.** You have positives (user clicked item) but no explicit negatives. The trick: within a training batch, treat every *other* user's clicked item as a negative for this user — one batch of B pairs yields B positives and B×(B−1) negatives for free, trained with a softmax/contrastive loss. But random in-batch negatives are too *easy* — separating a clicked cooking video from a random car-parts listing gives near-zero gradient and teaches nothing subtle. So you add **hard negatives**: high-scoring-but-not-clicked items that force the model to learn fine distinctions. Popularity also biases in-batch negatives (popular items appear as negatives more often, getting over-penalized), which is corrected with a **logQ / sampled-softmax correction**.`,
    interactivePrompt: `Before you touch the controls: the item tower runs offline and the user tower runs live. Which one can you afford to make big and slow, and which must stay cheap — and why does that asymmetry exist?`,
    keyPoints: [
      `**Two towers exist to make item embeddings query-independent.** A joint (cross-attention) scorer ties an item's representation to the querying user, forcing 10M fresh scores per request. Two separate towers + a dot product let you precompute all item vectors offline and index them once.`,
      `**Dot-product / cosine is chosen because ANN indexes are built for it.** Retrieval = encode one user live, then ANN-lookup nearest item vectors (~10ms over 100M). The item tower can be arbitrarily expensive (it runs offline); the user tower must be cheap (it runs per request). That asymmetry is the whole point.`,
      `**In-batch negatives give free negatives, but random ones are too easy.** B positives per batch yield B×(B−1) negatives at no cost. Random negatives produce tiny gradients; hard-negative mining (high-scoring non-clicks) forces fine distinctions and is what actually raises recall.`,
      `**Popularity bias in negatives needs a correction.** Popular items appear as in-batch negatives disproportionately and get over-suppressed; a logQ / sampled-softmax correction (subtract log sampling probability from the logit) restores an unbiased objective.`,
    ],
    takeaway: `Two-tower retrieval decouples user and item encoding so item embeddings can be precomputed offline and ANN-indexed — turning "score 10M items" into "encode one user + a ~10ms neighbor lookup." It's trained with in-batch negatives plus hard-negative mining (random negatives are too easy) and a logQ correction for popularity bias.`,
    checkQuestions: [
      {
        q: `Why can't a cross-attention model that jointly encodes (user, item) be used for retrieval, even though it is more accurate than a two-tower model?`,
        options: [
          `A) Cross-attention overfits on large catalogs, so its accuracy advantage vanishes above ~1M items.`,
          `B) Its item representation depends on the querying user, so item embeddings can't be precomputed or ANN-indexed — every one of the 10M items must be scored fresh per request, which is orders of magnitude over budget. Two-tower removes that dependency so items index offline.`,
          `C) Cross-attention can't output fixed-length vectors, so ANN libraries reject its output.`,
          `D) The dot product required by ANN is undefined for cross-attention outputs.`,
        ],
        answer: `B`,
      },
      {
        q: `Your two-tower retriever gets recall@100 of only 0.55. A teammate proposes switching from random in-batch negatives to hard-negative mining. Why does this attack the recall problem specifically?`,
        options: [
          `A) Hard negatives shrink the embedding dimension, letting the ANN index scan more items in budget.`,
          `B) Random negatives (a clicked cooking video vs a random car part) are separated with near-zero gradient, so the model never learns fine distinctions. Hard negatives (high-scoring non-clicks) produce real gradient, sharpening the boundary between relevant and near-relevant items and lifting recall of the genuinely relevant ones.`,
          `C) Hard negatives calibrate the dot-product scores so ANN distances become exact rather than approximate.`,
          `D) They don't help recall — hard negatives only improve ranking precision downstream.`,
        ],
        answer: `B`,
      },
      {
        q: `After training with in-batch negatives, your retriever systematically *under*-recommends genuinely relevant popular items. What is the most likely cause and fix?`,
        options: [
          `A) The user tower is too small; enlarge it so popular items score higher.`,
          `B) Popular items appear as in-batch negatives far more often than rare ones, so they're over-penalized. Apply a logQ / sampled-softmax correction (subtract each item's log sampling probability from its logit) to restore an unbiased objective.`,
          `C) The ANN index is dropping popular items; rebuild it with a larger ef_search.`,
          `D) Popular items have stale embeddings; retrain the whole tower nightly.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Joint scoring is most accurate but impossible at retrieval scale:** it ties an item's representation to the querying user, forcing 10M fresh scores per request. Two-tower breaks the dependency — user tower + item tower into a shared space, similarity = dot product u·v.`,
      `**Query-independent items → precompute offline + ANN:** compute all item embeddings once, index them (HNSW/IVF/ScaNN). At request time: encode one user (one forward pass) + ANN lookup for nearest item vectors ≈ 10ms over 100M. Dot-product/cosine is chosen because ANN is built for it.`,
      `**Cost asymmetry is the design lever:** the item tower runs offline so it can be big and slow; the user tower runs live so it must be cheap. Exploit this — put expensive features on the item side.`,
      `**In-batch negatives = free negatives but too easy:** a batch of B pairs gives B positives + B×(B−1) negatives. Random negatives yield near-zero gradient; **hard-negative mining** (high-scoring non-clicks) forces fine distinctions and actually lifts recall.`,
      `**Popularity bias in negatives needs a correction:** popular items appear as negatives disproportionately and get over-suppressed → apply a logQ / sampled-softmax correction to restore an unbiased objective.`,
    ],
    figures: {
      twotower: `<svg viewBox="0 0 360 112" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="20" y="18" width="92" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="66" y="35" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">User tower</text>
  <rect x="248" y="18" width="92" height="26" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="294" y="35" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Item tower</text>
  <text x="66" y="58" text-anchor="middle" fill="var(--ink-mid)" font-size="8">u (live, 1×)</text>
  <text x="294" y="58" text-anchor="middle" fill="var(--ink-mid)" font-size="8">v (offline, all items)</text>
  <path d="M112,31 L248,31" stroke="var(--ink-low)" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="180" y="27" text-anchor="middle" fill="var(--ink-low)" font-size="8">u · v (dot product)</text>
  <rect x="232" y="70" width="124" height="20" rx="4" fill="none" stroke="var(--amber)"/>
  <text x="294" y="83" text-anchor="middle" fill="var(--amber)" font-size="7.5">ANN index (precomputed v)</text>
  <text x="20" y="106" fill="var(--ink-low)" font-size="7.5">item side is query-independent → index once, look up in ~10ms</text>
</svg>`,
    },
  },
  {
    id: 'learning_to_rank',
    interactiveId: 'value_model_mixer_viz',
    title: 'Ranking & Learning-to-Rank',
    subtitle: 'Pointwise vs pairwise vs listwise — why the loss must match the ranking objective',
    difficulty: 'intermediate',
    estimatedMin: 24,
    tags: ['RecSys', 'learning to rank', 'LTR', 'pairwise', 'listwise', 'NDCG'],
    summary: `Ranking sits at the expensive end of the funnel: a few hundred candidates, all the features you couldn't afford in retrieval, and one job — get the *order* right. The subtle part is that "get the order right" is not the same objective as "predict each score accurately," and choosing the wrong loss quietly wastes the whole stage.

[FIGURE: ltr]

---

**Pointwise LTR treats ranking as regression/classification per item.** Predict p(click) or a rating for each candidate independently, then sort by the score. It's simple and reuses standard losses (log-loss, MSE). Its blind spot: the loss cares about *absolute* accuracy, not relative order. A model that predicts 0.9 vs 0.8 for two items and one that predicts 0.5 vs 0.4 rank them identically, but pointwise loss treats them as different — spending capacity on calibration the ranking doesn't need, and under-weighting the pairs that actually decide the order.

---

**Pairwise LTR optimizes the thing you actually care about: relative order.** It looks at pairs (i, j) where i is more relevant than j and penalizes ranking j above i (RankNet, LambdaRank, and the ubiquitous BPR for implicit feedback). This aligns the loss with the objective — you're directly minimizing inversions. **LambdaMART** (pairwise gradients weighted by the NDCG change each swap causes) is the classic strong baseline and still wins many tabular ranking bake-offs.

---

**Listwise LTR optimizes the whole ordered list at once** (ListNet, ListMLE, softmax cross-entropy over the list, or directly approximating NDCG). It's the most aligned with metrics like NDCG@k that depend on the entire ranking and its position discounts, but it's harder to optimize and more sensitive to list construction. The practical rule: **pointwise is the easy default, pairwise/listwise align the loss with the ranking objective** — reach for them when relative order and top-of-list quality are what the product is graded on. Note ranking has features retrieval couldn't afford: cross features (user×item), real-time context, candidate-set features, and the user's session so far.`,
    interactivePrompt: `Before you touch the controls: you're combining click, dwell, and share heads into one score. Predict what happens to top-of-list quality if one head is uncalibrated relative to the others — and why the loss family (pointwise vs pairwise) interacts with that.`,
    keyPoints: [
      `**The loss must match the objective: order, not absolute score.** Pointwise minimizes per-item error and can waste capacity calibrating items whose relative order is never in doubt, while under-weighting the boundary pairs that decide the ranking. Pairwise/listwise optimize order directly.`,
      `**Pairwise (RankNet/LambdaRank/BPR) minimizes inversions; LambdaMART weights each pair by its NDCG impact.** This directly targets ranking quality and is the classic strong baseline — especially LambdaMART on tabular features, and BPR for implicit feedback.`,
      `**Listwise (ListNet/ListMLE/approx-NDCG) optimizes the entire ordered list**, matching position-discounted metrics like NDCG@k most closely, at the cost of harder optimization and sensitivity to how the candidate list is built.`,
      `**Ranking uses features retrieval couldn't afford.** Cross features (user×item), real-time context, candidate-set-level features, and the in-session sequence are available here because there are only hundreds of candidates — this is why the stage is worth its cost.`,
    ],
    takeaway: `Learning-to-rank optimizes *order*, not absolute score: pointwise (regression per item) is the easy default but misaligned with ranking; pairwise (minimize inversions; LambdaMART weights pairs by NDCG impact) and listwise (optimize the whole list, matching NDCG@k) align the loss with the objective — and ranking earns its cost by using cross/context/session features retrieval couldn't afford.`,
    checkQuestions: [
      {
        q: `A ranker trained with pointwise log-loss has excellent calibration (predicted p(click) matches observed) but disappointing NDCG@10. What's the most likely explanation?`,
        options: [
          `A) The model is underfit; add capacity and both calibration and NDCG will improve together.`,
          `B) Pointwise loss optimizes absolute per-item accuracy, not relative order. Capacity is spent getting well-separated items' scores exactly right (which doesn't change their order) while the close boundary pairs that actually determine NDCG are under-weighted. A pairwise/listwise objective (or LambdaMART) targets the order directly.`,
          `C) NDCG is simply the wrong metric for a calibrated model; report AUC instead and the problem disappears.`,
          `D) The candidates are too few; retrieve more so NDCG@10 has more items to work with.`,
        ],
        answer: `B`,
      },
      {
        q: `Why does LambdaMART weight each candidate *pair* by the change in NDCG that swapping them would cause, rather than treating all pairs equally (as vanilla RankNet does)?`,
        options: [
          `A) To reduce training time by ignoring pairs, since NDCG-zero pairs can be skipped.`,
          `B) Because NDCG is position-discounted: fixing an inversion near the top of the list matters far more than fixing one deep in the list. Weighting each pair's gradient by its NDCG delta focuses learning on the swaps that actually move the metric, aligning the pairwise objective with top-heavy ranking quality.`,
          `C) Because equal weighting causes gradient explosion in gradient-boosted trees.`,
          `D) Because NDCG weighting makes the loss convex, guaranteeing a global optimum.`,
        ],
        answer: `B`,
      },
      {
        q: `Which feature type is a legitimate reason the ranking stage justifies its cost, even though retrieval already narrowed the candidates?`,
        options: [
          `A) The item's static embedding, since it's already computed in retrieval and just needs re-scoring.`,
          `B) User×item cross features and real-time session context — expensive to compute per pair, unaffordable over millions in retrieval, but affordable over the few hundred survivors, and exactly what lets the ranker distinguish items a two-tower dot product can't.`,
          `C) The catalog size, which the ranker uses to normalize scores.`,
          `D) The ANN index parameters (ef_search/nprobe), which the ranker consumes as features.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**The loss must match the objective — order, not absolute score.** Pointwise (regress/classify each item, then sort) is simple but optimizes absolute accuracy; it wastes capacity on items whose order is never in doubt and under-weights the boundary pairs that decide the ranking.`,
      `**Pairwise LTR minimizes inversions:** RankNet/LambdaRank/BPR penalize ranking a less-relevant item above a more-relevant one — directly aligned with order. **LambdaMART** (pairwise gradients weighted by each swap's NDCG change) is the classic strong tabular baseline; BPR is the implicit-feedback default.`,
      `**Listwise LTR optimizes the whole ordered list** (ListNet/ListMLE/approx-NDCG), matching position-discounted metrics like NDCG@k most closely — but it's harder to optimize and sensitive to list construction.`,
      `**Practical rule:** pointwise = easy default; reach for pairwise/listwise when relative order and top-of-list quality are how the product is graded.`,
      `**Ranking earns its cost via features retrieval couldn't afford:** user×item cross features, real-time context, candidate-set features, and the in-session sequence — affordable over hundreds of candidates, not millions.`,
    ],
    figures: {
      ltr: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  ${[['Pointwise', 'score each item', 'order-blind'], ['Pairwise', 'minimize inversions', 'order-aligned'], ['Listwise', 'optimize whole list', 'NDCG-aligned']].map((s, i) => `
  <rect x="${6 + i * 118}" y="22" width="108" height="40" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="${60 + i * 118}" y="38" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">${s[0]}</text>
  <text x="${60 + i * 118}" y="50" text-anchor="middle" fill="var(--ink-mid)" font-size="7">${s[1]}</text>
  <text x="${60 + i * 118}" y="59" text-anchor="middle" fill="var(--amber)" font-size="7">${s[2]}</text>`).join('')}
  <text x="6" y="14" fill="var(--ink-low)" font-size="7.5">alignment with ranking objective increases left → right (so does optimization difficulty)</text>
  <text x="6" y="82" fill="var(--ink-low)" font-size="7.5">LambdaMART = pairwise gradients weighted by each swap's NDCG delta — the classic strong baseline</text>
</svg>`,
    },
  },
  {
    id: 'features_and_freshness',
    title: 'Features & Freshness',
    subtitle: 'Real-time vs batch features, train/serve skew, the feature-freshness trap',
    difficulty: 'intermediate',
    estimatedMin: 22,
    tags: ['RecSys', 'feature store', 'train-serve skew', 'freshness', 'point-in-time'],
    summary: `A recommender's features come in two speeds, and the boundary between them is where most silent production bugs live. Get the freshness model wrong and your offline metrics look great while the live system quietly recommends yesterday's world.

[FIGURE: freshness]

---

**Batch features are computed on a schedule; real-time features are computed per event.** "User's 90-day purchase count" is a batch feature — recomputed nightly, cheap, stable. "Items viewed in the last 5 minutes" is a real-time feature — it must reflect *this* session, so it's computed online from a streaming store. The two live in different systems (a warehouse vs a low-latency feature store), and the recommender reads both at serving time. The design question is which signals *need* to be fresh: session intent decays in minutes, so a stale "recent views" feature is nearly useless; long-term taste is stable, so a day-old "favorite genre" is fine.

---

**Train/serve skew is the trap: the same feature computed two different ways.** Training features are usually computed in a batch pipeline (Spark/SQL over historical logs); serving features are computed in a live path (streaming/online store). If the two implementations differ — a different null default, a timezone, a window boundary, a slightly different aggregation — the model trains on one distribution and serves on another. The model's live behavior degrades in a way *no offline metric can catch*, because offline evaluation uses the training-side computation. The fix is a **feature store** that guarantees one definition consumed identically at train and serve time.

---

**The feature-freshness trap is skew's time-shifted cousin: point-in-time correctness.** When you build training data, each label (did the user click at time t?) must be joined to feature values *as they were at time t* — not their current values. Join "user's total purchases" as of *today* onto a click from three months ago and you've leaked the future: the model learns from information it won't have at serving time, inflating offline metrics and collapsing in production. Point-in-time-correct joins (as-of joins on event timestamps) are the non-negotiable discipline that makes offline training data match serving reality.`,
    keyPoints: [
      `**Match freshness to signal decay.** Session-intent features (recent views, current query) decay in minutes and must be real-time; long-term taste features (favorite genre, lifetime spend) are stable and can be batch. Making everything real-time wastes infra; making everything batch kills session responsiveness.`,
      `**Train/serve skew = one feature, two implementations, two distributions.** A different null-handling, timezone, or window between the training (batch) and serving (online) computation silently shifts the model's input distribution. No offline metric catches it because offline eval uses the training-side values. A feature store enforces one definition consumed identically at both times.`,
      `**Point-in-time correctness prevents label leakage in training data.** Each label must be joined to feature values *as of the event's timestamp*, not their current values. As-of joins on event time are mandatory; a naive join of current features onto historical labels leaks the future and inflates offline metrics.`,
      `**The two failure modes look identical offline and different in prod.** Both skew and non-point-in-time joins produce great offline numbers and a live regression — so a large offline/online gap is the diagnostic signature to check features first.`,
    ],
    takeaway: `RecSys features split into batch (stable, scheduled) and real-time (session, streamed), and the two hardest bugs both hide behind good offline metrics: train/serve skew (one feature computed two ways → distribution shift no offline metric catches) and non-point-in-time joins (current features glued onto historical labels → future leakage). A feature store with as-of joins is the discipline that closes both.`,
    checkQuestions: [
      {
        q: `Your recommender scores well offline but underperforms live. You discover the "items viewed in last hour" feature is computed with Spark (rounding timestamps to the hour) in training and with a streaming store (exact rolling window) at serving. What is this, and why did offline metrics miss it?`,
        options: [
          `A) Concept drift — user behavior changed between training and serving; retrain on fresher data.`,
          `B) Train/serve skew — the same feature is computed two different ways, so the model trains on one distribution and serves on another. Offline evaluation used the training-side (Spark) values, so the skew is invisible until live traffic hits the streaming path. Fix by sharing one feature definition across train and serve.`,
          `C) Label leakage — the hourly window leaks the click into the feature; shrink the window.`,
          `D) Overfitting — the model memorized the Spark rounding artifact; add regularization.`,
        ],
        answer: `B`,
      },
      {
        q: `When constructing training data, you join each historical click to the user's *current* lifetime-purchase count. Offline AUC jumps to 0.98; production is far worse. What went wrong?`,
        options: [
          `A) Nothing — 0.98 AUC is the model's true skill; production is worse only because of latency, not data.`,
          `B) Non-point-in-time join: the current purchase count reflects purchases made *after* the historical click, leaking future information the model won't have at serving time. This inflates offline metrics and collapses live. Use an as-of join that reconstructs each feature's value at the click's timestamp.`,
          `C) The join duplicated rows, inflating the positive class; deduplicate and re-evaluate.`,
          `D) AUC is the wrong metric for this join; switch to NDCG and the gap closes.`,
        ],
        answer: `B`,
      },
      {
        q: `A teammate proposes making *every* feature real-time "to be safe." Why is that the wrong default?`,
        options: [
          `A) Real-time features are always less accurate than batch ones, so accuracy would drop.`,
          `B) Freshness should match how fast a signal decays. Long-term taste features (favorite genre, lifetime spend) are stable, so real-time computation adds streaming infra cost and complexity for no quality gain; reserve real-time for session-intent signals that decay in minutes. Blanket real-time is expensive over-engineering.`,
          `C) Real-time features can't be stored in a feature store, so they'd break point-in-time joins.`,
          `D) Streaming systems can't compute aggregations, so long-term features would be impossible.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Two feature speeds, matched to signal decay:** batch (scheduled, stable — 90-day purchase count) vs real-time (per-event, streamed — last-5-minutes views). Session intent decays in minutes → must be fresh; long-term taste is stable → batch is fine. Everything-real-time is expensive over-engineering; everything-batch kills responsiveness.`,
      `**Train/serve skew = one feature, two implementations:** a different null default, timezone, or window between the training (batch) and serving (online) path shifts the input distribution. No offline metric catches it (offline eval uses training-side values). A feature store enforcing one definition consumed identically is the fix.`,
      `**Point-in-time correctness stops label leakage:** each label must join to feature values *as of the event timestamp*, not current values. Naive joins of current features onto historical labels leak the future, inflating offline metrics and collapsing in prod. As-of joins on event time are non-negotiable.`,
      `**Both bugs share one signature:** great offline numbers + a live regression. A large offline/online gap → check feature parity and join correctness first.`,
    ],
    figures: {
      freshness: `<svg viewBox="0 0 360 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="10" y="18" width="150" height="34" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="85" y="32" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Batch features</text>
  <text x="85" y="44" text-anchor="middle" fill="var(--ink-mid)" font-size="7">90-day spend · fav genre · nightly</text>
  <rect x="200" y="18" width="150" height="34" rx="6" fill="none" stroke="var(--amber)"/>
  <text x="275" y="32" text-anchor="middle" fill="var(--amber)" font-size="8.5" font-weight="700">Real-time features</text>
  <text x="275" y="44" text-anchor="middle" fill="var(--ink-mid)" font-size="7">last-5-min views · current query</text>
  <text x="180" y="72" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">skew = same feature computed two ways · leakage = current features on old labels</text>
  <text x="180" y="88" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">both look fine offline, break live → feature store + point-in-time (as-of) joins</text>
</svg>`,
    },
  },
  {
    id: 'cold_start',
    title: 'Cold Start',
    subtitle: 'User cold start vs item cold start — content features and exploration',
    difficulty: 'intermediate',
    estimatedMin: 20,
    tags: ['RecSys', 'cold start', 'content features', 'exploration'],
    summary: `Collaborative filtering — the engine of most recommenders — learns from interaction history: "users who liked X also liked Y." That engine has a structural blind spot: it can say nothing about an entity it has never seen interact. This is the **cold-start** problem, and it has two distinct faces that need different fixes.

[FIGURE: coldstart]

---

**User cold start: a brand-new user has no history to collaborate on.** You can't retrieve "items similar to what they liked" because they've liked nothing. The fixes ladder from cheap to smart: (1) fall back to **popularity / trending** (globally or by segment) as a floor; (2) use whatever **context** you do have — device, language, location, time of day, referral source; (3) run a lightweight **onboarding** (pick a few interests) to seed a profile; (4) update a **real-time user embedding** aggressively from the first few interactions, so the system personalizes within the session rather than waiting for a nightly retrain. TikTok's fast first-session personalization is this last move done well.

---

**Item cold start: a brand-new item has no interactions, so collaborative signal can't place it.** A pure two-tower model trained on interaction IDs literally has no embedding for an item nobody has touched. The fix is to build the item tower on **content features** (text, image, audio, category, creator) rather than a learned per-item ID embedding — so a new item gets a reasonable embedding *from its content* on day one, before any interactions exist. This is why content features aren't just a nice-to-have; they're what makes new items recommendable at all.

---

**Exploration is the bridge that turns cold items warm.** Even with content features, the system's estimate of a new item is uncertain, and a pure-exploitation ranker (always show the current best predicted item) will rarely surface it — so it never gathers the interaction data that would improve the estimate, a self-reinforcing starvation. **Exploration** (ε-greedy, or better, uncertainty-aware bandits like Thompson sampling / UCB) deliberately shows uncertain items to gather signal. It trades a little short-term engagement to feed the flywheel — and it's the explicit cost that keeps the long tail and new content alive.`,
    keyPoints: [
      `**Two distinct problems, two fixes.** User cold start (no history for a new user) is solved with popularity fallbacks, context, onboarding, and aggressive real-time embedding updates. Item cold start (no interactions for a new item) is solved by building the item tower on content features rather than a learned per-item ID embedding.`,
      `**Content features are what make a new item recommendable at all.** An ID-embedding two-tower has no vector for an unseen item; content features (text/image/audio/category/creator) give it a reasonable embedding on day one before any interaction exists.`,
      `**Exploration is non-optional for cold items.** A pure-exploitation ranker rarely surfaces uncertain new items, so they never accumulate the data that would improve their estimate — a self-reinforcing starvation. Uncertainty-aware exploration (Thompson sampling/UCB, or ε-greedy) deliberately gathers signal, trading short-term engagement to keep the tail and new content alive.`,
      `**Real-time personalization narrows the user cold-start window.** Updating the user embedding from the first few in-session signals personalizes within the session instead of waiting for a nightly retrain — the difference between a good and a generic first session.`,
    ],
    takeaway: `Cold start has two faces: a new *user* (no history → popularity, context, onboarding, and fast real-time embedding updates) and a new *item* (no interactions → build the item tower on content features so it's embeddable on day one). Exploration is the bridge that turns cold items warm — deliberately surfacing uncertain items so they gather the signal a pure-exploitation ranker would never let them earn.`,
    checkQuestions: [
      {
        q: `A pure ID-embedding two-tower recommender cannot recommend items uploaded in the last hour at all. What is the root cause and the correct architectural fix?`,
        options: [
          `A) The ANN index hasn't rebuilt; force an hourly rebuild and the new items appear.`,
          `B) Item cold start — a learned per-item ID embedding requires interactions to exist, and a one-hour-old item has none, so it has no vector. Fix by building the item tower on content features (text/image/audio/category/creator) so a new item gets a reasonable embedding from its content immediately, before any interaction.`,
          `C) The user tower is stale; retrain it so it can score new items.`,
          `D) Nothing is wrong — new items should be excluded until they accumulate 100+ interactions.`,
        ],
        answer: `B`,
      },
      {
        q: `Your platform adds content features so new items *can* be embedded, yet new items still almost never get shown. Why, and what's the fix?`,
        options: [
          `A) The content features are low quality; engineer better ones and the problem resolves.`,
          `B) A pure-exploitation ranker always shows the current best predicted item, and a new item's uncertain estimate rarely wins that comparison — so it never gathers the interactions that would sharpen its estimate (self-reinforcing starvation). Add exploration (Thompson sampling/UCB or ε-greedy) to deliberately surface uncertain items and gather signal.`,
          `C) The ranking model needs more layers to appreciate content features; deepen it.`,
          `D) New items should be hard-coded into the top 3 slots until they're warm.`,
        ],
        answer: `B`,
      },
      {
        q: `Which approach best handles a brand-new *user* who has zero interaction history?`,
        options: [
          `A) Refuse to personalize and show a fixed editorial list until the nightly retrain includes them.`,
          `B) Combine a popularity/segment fallback as a floor with available context (device, language, location, time) and, most importantly, update a real-time user embedding from the first few in-session interactions so personalization happens within the session, not after a nightly retrain.`,
          `C) Train a fresh neural network per new user online via gradient descent on their first click.`,
          `D) Require the user to link an external social account so history can be imported before the first session.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Cold start = collaborative filtering's structural blind spot:** it learns from interaction history, so it can say nothing about an entity it has never seen interact. Two distinct faces need different fixes.`,
      `**User cold start (new user, no history):** ladder of fixes — popularity/segment fallback (floor) → available context (device, language, location, time) → lightweight onboarding → aggressive **real-time embedding updates** from the first few signals so personalization happens within the session, not after a nightly retrain.`,
      `**Item cold start (new item, no interactions):** a pure ID-embedding two-tower has *no vector* for an unseen item. Build the item tower on **content features** (text/image/audio/category/creator) so a new item is embeddable on day one — content features are what make new items recommendable at all.`,
      `**Exploration bridges cold → warm:** even with content features, a new item's estimate is uncertain and a pure-exploitation ranker rarely surfaces it, so it never gathers improving signal (self-reinforcing starvation). Uncertainty-aware exploration (Thompson/UCB, or ε-greedy) trades a little engagement to feed the flywheel and keep the tail alive.`,
    ],
    figures: {
      coldstart: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="10" y="18" width="160" height="42" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="90" y="33" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">User cold start</text>
  <text x="90" y="45" text-anchor="middle" fill="var(--ink-mid)" font-size="7">popularity · context · onboarding</text>
  <text x="90" y="55" text-anchor="middle" fill="var(--ink-mid)" font-size="7">real-time embedding from 1st signals</text>
  <rect x="190" y="18" width="160" height="42" rx="6" fill="none" stroke="var(--amber)"/>
  <text x="270" y="33" text-anchor="middle" fill="var(--amber)" font-size="8.5" font-weight="700">Item cold start</text>
  <text x="270" y="45" text-anchor="middle" fill="var(--ink-mid)" font-size="7">content features → embeddable day 1</text>
  <text x="270" y="55" text-anchor="middle" fill="var(--ink-mid)" font-size="7">exploration gathers first signal</text>
  <text x="180" y="82" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">exploration is the bridge that turns cold items warm — the flywheel's deliberate cost</text>
</svg>`,
    },
  },
  {
    id: 'feedback_loops_bias',
    title: 'Feedback Loops & Bias',
    subtitle: 'Position bias, popularity bias, the closed-loop causal trap, IPS/debiasing',
    difficulty: 'advanced',
    estimatedMin: 24,
    tags: ['RecSys', 'position bias', 'popularity bias', 'IPS', 'feedback loop'],
    summary: `A recommender trains on logs it generated itself. That single sentence is the source of the field's hardest correctness problem: the data is not a neutral sample of user preference — it's a sample of *what the previous model chose to show*, filtered through *where it chose to show it*. Train naively on that data and you don't learn relevance; you learn to imitate your own past behavior.

[FIGURE: loop]

---

**Position bias: rank determines clicks, so raw clicks aren't relevance.** Users click the top slot far more than the bottom slot *regardless of item quality* — attention drops with position. If you train the next ranker on raw click labels, it learns "items that were at position 1 get clicked" and dutifully re-ranks whatever was already on top. The model reproduces position effects, not relevance — a self-reinforcing loop where good-but-low-ranked items can never climb.

---

**Popularity bias: the flywheel amplifies whatever is already popular.** Popular items get shown more → get more interactions → look even more relevant to the model → get shown more still. Niche and new items are starved of exposure, so the model has little data on them and under-ranks them, deepening the imbalance. Left uncorrected, the catalog collapses toward a shrinking head, coverage falls, and the long tail dies — even as short-term clicks look healthy.

---

**The closed-loop causal trap and how debiasing breaks it.** The core issue is causal: you observe clicks *conditional on* being shown at a position, but you want P(relevant), which requires reasoning about what *would* have happened under a different exposure. **Inverse Propensity Scoring (IPS)** is the standard tool: weight each observed interaction by 1/P(shown | position) so items shown in low-attention slots count *more* when they still got clicked, recovering an unbiased relevance estimate. Propensities are estimated from a position-bias model or from deliberate **randomization** (occasionally shuffling positions to gather unbiased data). The naming to know: **IPS / doubly-robust estimators / counterfactual learning-to-rank** — all attack the same "learn from logs you generated" trap. And randomization/exploration isn't just for cold start; it's how you keep collecting the unbiased signal debiasing needs.`,
    keyPoints: [
      `**Raw clicks are not relevance — position bias contaminates them.** Top slots get clicks regardless of quality, so training on raw clicks teaches the model to resurface whatever was already on top, a self-reinforcing loop. The tell: precision@1 higher for items historically shown at *low* positions (they had to be genuinely good to get clicked there).`,
      `**Popularity bias is the flywheel turned pathological.** Popular items get exposure → interactions → look relevant → more exposure, starving niche/new items of the data needed to rank them. Uncorrected, coverage collapses toward a shrinking head while short-term clicks still look fine.`,
      `**IPS breaks the loop by reweighting.** Weight each interaction by 1/P(shown | position) so clicks earned in low-attention slots count more, recovering an unbiased relevance estimate. Propensities come from a position-bias model or from deliberate randomization; doubly-robust and counterfactual LTR are the same family.`,
      `**Randomization/exploration is the data source debiasing depends on.** Occasionally shuffling positions (or exploring) gathers the unbiased observations that let you estimate propensities and train counterfactually — it's not only a cold-start tool.`,
    ],
    takeaway: `A recommender trains on logs it generated, so raw clicks encode position bias (rank drives clicks) and popularity bias (the flywheel amplifies the head) rather than relevance — a closed-loop causal trap where the model imitates its own past. Inverse Propensity Scoring (weight by 1/P(shown|position)), fed by deliberate randomization, recovers an unbiased relevance estimate; doubly-robust and counterfactual LTR are the same idea.`,
    checkQuestions: [
      {
        q: `Your LTR model shows *higher* precision@1 for items that were historically displayed at low positions than for items displayed at high positions. What does this reveal, and what's the principled fix?`,
        options: [
          `A) Label noise — low-position items have fewer clicks and noisier labels; collect more editorial judgments for them.`,
          `B) Position bias in the training labels: top slots accrue clicks regardless of relevance, so items that still got clicked from low positions were genuinely strong. Training on raw clicks resurfaces previously-top items (self-reinforcing loop). Fix with inverse-propensity weighting (weight each example by 1/P(click|position)) plus occasional position randomization to gather unbiased data.`,
          `C) Overfitting to head queries; fix with query-frequency-weighted sampling.`,
          `D) Feature leakage from popularity features; remove all popularity features and the asymmetry disappears.`,
        ],
        answer: `B`,
      },
      {
        q: `Why does inverse propensity scoring weight a click from a low-attention slot *more* than a click from the top slot?`,
        options: [
          `A) Because low slots have fewer total clicks, so each one is statistically rarer and worth more for balance.`,
          `B) Because P(shown|position) is small for low-attention slots, so a click there is strong evidence of relevance (it overcame low exposure). Dividing by that small propensity up-weights it, correcting the exposure imbalance and recovering an estimate of relevance rather than of attention. Top-slot clicks are down-weighted because they're partly explained by position, not quality.`,
          `C) Because IPS assumes low positions are more trustworthy sources of ground truth.`,
          `D) It doesn't — IPS weights all positions equally after normalization.`,
        ],
        answer: `B`,
      },
      {
        q: `A team wants to remove position bias but refuses to ever randomize the ranking ("it would hurt engagement"). Why is this self-defeating for debiasing?`,
        options: [
          `A) It isn't — propensities can always be derived analytically from the ranking function without any data.`,
          `B) Estimating exposure propensities (and validating any debiasing) requires some observations where position is decoupled from the model's own choices. Without any randomization or exploration, every log is fully confounded by the current model, so there's no unbiased signal to estimate P(shown|position) or to check that the correction worked. A small, controlled randomization budget is the price of an unbiased estimate.`,
          `C) Randomization is only needed for cold start, not for position-bias correction.`,
          `D) Refusing to randomize causes the ANN index to drift, which is the real problem.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**A recommender trains on logs it generated:** the data reflects what the *previous* model showed and *where*, not neutral preference. Train naively and you learn to imitate your own past, not relevance.`,
      `**Position bias:** top slots get clicks regardless of quality, so raw-click training resurfaces whatever was already on top — a self-reinforcing loop. Tell: precision@1 higher for items historically shown at *low* positions (they had to be genuinely good to get clicked there).`,
      `**Popularity bias:** the flywheel turned pathological — popular items get exposure → interactions → look relevant → more exposure, starving niche/new items; coverage collapses toward a shrinking head while short-term clicks still look fine.`,
      `**IPS breaks the loop:** weight each interaction by 1/P(shown|position) so clicks from low-attention slots count more, recovering an unbiased relevance estimate. Propensities come from a position-bias model or deliberate randomization; **doubly-robust** and **counterfactual LTR** are the same family.`,
      `**Randomization/exploration is the unbiased data source** debiasing depends on — occasionally shuffling positions decouples exposure from the model's own choices so propensities can be estimated and corrections validated. Not just a cold-start tool.`,
    ],
    figures: {
      loop: `<svg viewBox="0 0 360 108" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="20" y="16" width="90" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="65" y="31" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">model shows</text>
  <rect x="250" y="16" width="90" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="295" y="31" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">users click</text>
  <rect x="250" y="72" width="90" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="295" y="87" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">logs (biased)</text>
  <rect x="20" y="72" width="90" height="24" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="65" y="87" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">retrain</text>
  <path d="M110,28 L250,28" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#l)"/>
  <path d="M295,40 L295,72" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#l)"/>
  <path d="M250,84 L110,84" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#l)"/>
  <path d="M65,72 L65,40" stroke="var(--ink-low)" stroke-width="1.2" marker-end="url(#l)"/>
  <defs><marker id="l" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
  <text x="180" y="106" text-anchor="middle" fill="var(--amber)" font-size="7.5">IPS + randomization break the loop → recover relevance from biased logs</text>
</svg>`,
    },
  },
  {
    id: 'offline_online_eval',
    title: 'Offline vs Online Evaluation',
    subtitle: 'Why NDCG/recall diverge from CTR/retention — the offline-online gap and A/B tests',
    difficulty: 'advanced',
    estimatedMin: 24,
    tags: ['RecSys', 'NDCG', 'A/B test', 'offline-online gap', 'evaluation'],
    summary: `You can compute a beautiful NDCG@10 on last month's logs, ship the model, and watch engagement *drop*. This isn't a bug in your metric — it's the structural gap between what offline evaluation can measure and what the live system actually does. Understanding *why* the two diverge is what separates a metric-chaser from someone who can be trusted to ship.

[FIGURE: gap]

---

**Offline metrics score a ranking against logged relevance; each measures something narrower than "good recommendations."** **Recall@k** — did the relevant items make the shortlist (retrieval's metric). **NDCG@k** — are relevant items ordered near the top, position-discounted (ranking's metric). **MAP** — mean average precision across the ranked list. **AUC** — probability a random relevant item outranks a random irrelevant one. All are computed on *historical* logs, and that's the catch.

---

**Why offline and online diverge — four structural reasons.** (1) **Logs are biased**: offline "relevance" is what the *old* model exposed, so a new model that surfaces different-but-good items is *penalized* offline for disagreeing with the old model's choices. (2) **Counterfactual blindness**: offline metrics can only score items that were logged; a genuinely better item the old system never showed has no label, so its win is invisible. (3) **Metric ≠ objective**: NDCG on clicks rewards clickbait; the business cares about dwell, retention, revenue, and harm — offline click-NDCG can rise while long-term value falls. (4) **No system effects**: offline eval can't see diversity, freshness, feedback loops, or how the recommendation changes future behavior.

---

**Online evaluation measures the objective directly, via A/B tests.** Split traffic, ship the candidate to one arm, and measure **CTR, dwell, session length, retention, revenue** — the things offline metrics only proxy. The discipline: offline metrics are a cheap *filter* (kill obviously worse models before they touch users), never the *decision* (the A/B test decides). Watch for the traps — novelty effects (a new model gets a temporary bump), delayed metrics (retention takes weeks), guardrail metrics (don't win CTR by tanking a harm metric), and sample-ratio mismatch. The offline-online gap is not eliminated; it's *managed*: use offline to filter, online to decide, and treat a persistent gap as a signal that your offline proxy or your logs are broken.`,
    keyPoints: [
      `**Offline metrics are cheap proxies computed on biased historical logs; online metrics measure the objective on live traffic.** Recall@k / NDCG@k / MAP / AUC each capture a slice of ranking quality; CTR / dwell / retention / revenue capture what the business actually wants. The former filter; the latter decide.`,
      `**The gap is structural, not accidental — four causes.** (1) Logs are biased toward the old model, penalizing new-but-good rankings for disagreeing; (2) counterfactual blindness — unlogged better items have no label; (3) metric ≠ objective (click-NDCG rewards clickbait while retention falls); (4) offline can't see diversity, feedback loops, or downstream behavior change.`,
      `**A/B testing is the decision procedure, with its own traps.** Novelty effects, delayed metrics (retention takes weeks), guardrail metrics (don't win CTR by raising a harm metric), and sample-ratio mismatch all corrupt naive readouts. Ramp gradually and pre-register the north-star + guardrails.`,
      `**Manage the gap, don't pretend it's closed.** Use offline to filter obviously worse models, online to decide, and treat a *persistent* offline-online divergence as evidence your offline proxy or your logging pipeline is broken.`,
    ],
    takeaway: `Offline metrics (recall@k, NDCG@k, MAP, AUC) are cheap proxies on biased historical logs; online metrics (CTR, dwell, retention, revenue) measure the real objective on live traffic. They diverge structurally — biased logs, counterfactual blindness, metric≠objective, and unseen system effects — so the discipline is offline-to-filter, online-A/B-to-decide, treating a persistent gap as a broken-proxy alarm rather than noise.`,
    checkQuestions: [
      {
        q: `A new ranker has clearly higher NDCG@10 offline than the incumbent, but in an A/B test its engagement is *lower*. Which explanation is most consistent with how offline evaluation works?`,
        options: [
          `A) The A/B test is underpowered; run it longer and NDCG's verdict will eventually hold.`,
          `B) Offline NDCG is computed against logged relevance produced by the *incumbent*, so a model that agrees more with the incumbent's past choices scores higher offline — without necessarily being better for users. Live traffic reveals the true objective, which offline logs can't. Trust the A/B test; investigate why the offline proxy disagreed.`,
          `C) NDCG is simply the wrong offline metric; recompute with MAP and the two will agree.`,
          `D) The new ranker overfit the offline set; regularize it and both metrics will move together.`,
        ],
        answer: `B`,
      },
      {
        q: `Why can't offline evaluation reliably credit a model that recommends genuinely great items the old system *never showed*?`,
        options: [
          `A) It can — offline metrics simulate user responses for unshown items using the model's own scores.`,
          `B) Counterfactual blindness: offline metrics can only score items that appear in the logs with a relevance label. An item the old system never exposed has no logged interaction, so its (potentially winning) recommendation is invisible to offline scoring. Only an online test (or a counterfactual estimator with logged propensities) can credit it.`,
          `C) Offline metrics penalize unshown items with a default score of zero, which is always correct.`,
          `D) The ANN index excludes unshown items, so they can't be evaluated at all.`,
        ],
        answer: `B`,
      },
      {
        q: `Your candidate ranker wins CTR in an A/B test. Before shipping, what is the single most important additional check?`,
        options: [
          `A) Whether offline NDCG also improved, to confirm the two metrics agree.`,
          `B) Guardrail and long-term metrics — that the CTR win didn't come at the cost of a harm metric (reports, "see fewer") or of dwell/retention, since click-optimizing models often win short-term CTR by promoting clickbait that degrades long-term value. Also confirm no novelty effect and no sample-ratio mismatch.`,
          `C) Whether the model's inference latency is lower than the incumbent's.`,
          `D) Whether the embedding dimension matches the retrieval stage's.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Offline = cheap proxies on biased logs; online = the real objective on live traffic.** Recall@k (did relevant items make the shortlist), NDCG@k (ordered near the top, position-discounted), MAP, AUC (P(relevant outranks irrelevant)) — all computed on *historical* logs. CTR/dwell/retention/revenue are what the business actually wants.`,
      `**The gap is structural — four causes:** (1) logs are biased toward the old model, so a new-but-good ranking is penalized for disagreeing; (2) counterfactual blindness — unlogged better items have no label; (3) metric ≠ objective (click-NDCG rewards clickbait while retention falls); (4) no system effects (diversity, feedback loops, behavior change).`,
      `**A/B testing is the decision procedure, with traps:** novelty effects (temporary bump), delayed metrics (retention takes weeks), guardrail metrics (don't win CTR by tanking a harm metric), sample-ratio mismatch. Ramp gradually; pre-register north-star + guardrails.`,
      `**Discipline: offline to filter, online to decide.** Offline kills obviously worse models cheaply; the A/B test makes the call. A *persistent* offline-online gap is a signal your offline proxy or logging pipeline is broken — not noise to average away.`,
    ],
    figures: {
      gap: `<svg viewBox="0 0 360 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="10" y="18" width="150" height="42" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="85" y="32" text-anchor="middle" fill="var(--ink-hi)" font-size="8.5" font-weight="700">Offline (filter)</text>
  <text x="85" y="44" text-anchor="middle" fill="var(--ink-mid)" font-size="7">recall@k · NDCG@k · MAP · AUC</text>
  <text x="85" y="54" text-anchor="middle" fill="var(--ink-mid)" font-size="7">cheap · biased logs</text>
  <rect x="200" y="18" width="150" height="42" rx="6" fill="none" stroke="var(--amber)"/>
  <text x="275" y="32" text-anchor="middle" fill="var(--amber)" font-size="8.5" font-weight="700">Online (decide)</text>
  <text x="275" y="44" text-anchor="middle" fill="var(--ink-mid)" font-size="7">CTR · dwell · retention · revenue</text>
  <text x="275" y="54" text-anchor="middle" fill="var(--ink-mid)" font-size="7">A/B test · real objective</text>
  <path d="M160,39 L200,39" stroke="var(--ink-low)" stroke-width="1.2" stroke-dasharray="3 3"/>
  <text x="180" y="78" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">gap causes: biased logs · counterfactual blindness · metric≠objective · system effects</text>
  <text x="180" y="92" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">a persistent gap = broken proxy/logs, not noise</text>
</svg>`,
    },
  },
  {
    id: 'multi_objective_tradeoffs',
    interactiveId: 'value_model_mixer_viz',
    title: 'Multi-Objective & Engagement-vs-Quality Tradeoffs',
    subtitle: 'Value models, engagement vs long-term quality, the Netflix/YouTube objective-design problem',
    difficulty: 'advanced',
    estimatedMin: 24,
    tags: ['RecSys', 'multi-objective', 'value model', 'engagement', 'guardrails'],
    summary: `"Maximize engagement" is not an objective — it's an abdication. The moment a recommender optimizes a single short-term signal, it finds the pathological maximum of that signal: clickbait for CTR, autoplay rabbit holes for watch-time, outrage for comments. Staff-level RecSys is fundamentally about *objective design* — deciding what to optimize so the system is still good in a year, not just this afternoon.

[FIGURE: value]

---

**A value model turns many predictions into one score, and its weights encode what the business values.** A serious ranker predicts several calibrated outcomes — p(click), p(long dwell), p(share), p(complete), p(report) — and combines them: **score = 1.0·p(click) + 1.2·p(dwell) + 0.5·p(share) − 3.0·p(report)**. "Rank by engagement" is not a design; that weighted expression *is*. The weights are a **product decision, not a learned parameter** — there is no weight vector that maximizes every objective at once (pushing CTR up promotes clickbait and raises the report rate), so the weights are tuned by **online A/B tests against a north-star** (long-term retention, healthy-session rate), never by offline loss.

---

**Engagement vs quality is the central tension, and it's a delayed-feedback problem.** The item that maximizes *this session's* watch time (autoplay, ever-more-extreme content) can lower *next month's* retention (users feel manipulated and leave). Short-term engagement is easy to measure and instantly available; long-term quality is what you actually want and takes weeks to observe. This is exactly the trap Netflix and YouTube publicly moved away from — YouTube shifting from click/view optimization toward "valued watch time" and satisfaction surveys; Netflix optimizing for long-term retention over any single session's viewing. The design move is to put a *proxy for long-term value* into the objective (completion, explicit satisfaction, dwell past a threshold) rather than the easy short-term signal.

---

**Guardrails and diversity ride inside the same score.** Harm signals (report, "see fewer", hide) enter the value model as *negative* weights, so harmful-but-clicky content is demoted at ranking time rather than filtered after the fact. Diversity and freshness enter as re-ranking adjustments so the feed doesn't collapse onto one topic. And every head must be **calibrated** — the weighted sum treats each pᵢ as a real probability, so an uncalibrated head silently doubles its own effective weight and corrupts the whole ranking.`,
    interactivePrompt: `Before you touch the controls: push the CTR weight up and the report penalty toward zero. Predict what happens to the report-rate of the top items — and explain why no single weight vector wins every objective at once.`,
    keyPoints: [
      `**A single short-term signal always has a pathological maximum.** CTR → clickbait, watch-time → rabbit holes, comments → outrage. Optimizing one engagement proxy directly produces the failure mode; objective design is the real staff-level skill.`,
      `**The value model's weights are a product decision tuned online, not a learned parameter.** No weight vector maximizes every objective simultaneously, so weights are calibrated by A/B tests against a north-star (long-term retention / healthy sessions), never by offline loss — which can't see long-term value or harm.`,
      `**Engagement vs quality is a delayed-feedback tradeoff.** This session's max watch-time can lower next month's retention. Put a proxy for *long-term* value (completion, satisfaction, dwell-past-threshold) into the objective instead of the easy short-term signal — the Netflix/YouTube "valued watch time / retention over views" move.`,
      `**Guardrails and calibration are load-bearing.** Harm signals enter as negative weights so bad-but-clicky content is demoted in the score, not filtered after; diversity/freshness enter at re-ranking. Every head must be calibrated or its effective weight silently drifts and corrupts the ranking.`,
    ],
    takeaway: `Staff-level RecSys is objective design: a value model fuses several *calibrated* predictions with weights that are a product decision tuned by online A/B tests against a long-term north-star — because any single short-term engagement signal has a pathological maximum (clickbait, rabbit holes). Engagement-vs-quality is a delayed-feedback trap solved by encoding a proxy for long-term value, with harm signals as negative weights so guardrails live inside the score.`,
    checkQuestions: [
      {
        q: `A team sets the ranker's objective to "maximize CTR" and ships it. Engagement rises for two weeks, then 30-day retention falls below baseline. What's the diagnosis?`,
        options: [
          `A) The model overfit; retrain on more recent data and retention recovers.`,
          `B) A single short-term signal has a pathological maximum: CTR-optimization promotes clickbait that wins clicks now but erodes trust, lowering long-term retention. The fix is objective design — combine calibrated heads (dwell, completion, report) in a value model whose weights are tuned online against a long-term north-star, so short-term CTR isn't optimized in isolation.`,
          `C) Retention is unrelated to recommendations; the drop is seasonal noise.`,
          `D) CTR is the correct objective; the retention metric is mis-instrumented.`,
        ],
        answer: `B`,
      },
      {
        q: `Why are value-model weights (click, dwell, share, report) tuned by online A/B tests against a north-star metric rather than fit by minimizing offline loss on historical logs?`,
        options: [
          `A) Because offline loss minimization is computationally infeasible at RecSys scale.`,
          `B) Because the true objective — long-term value and low harm — isn't visible in offline click loss. The weights encode a business tradeoff (what a share is worth vs a click, how hard to penalize a report), and no weight vector maximizes every objective at once, so they must be calibrated against a long-term outcome (e.g., 30-day retention) that only a live experiment can measure.`,
          `C) Because offline logs don't contain the report label, so the weights can't be fit offline.`,
          `D) Because A/B testing is cheaper than offline evaluation.`,
        ],
        answer: `B`,
      },
      {
        q: `Why must every prediction head be calibrated before the value model combines them as w₁·p₁ + w₂·p₂ + … ?`,
        options: [
          `A) Calibration only matters for the click head; the others can be uncalibrated rank scores.`,
          `B) The weighted sum treats each pᵢ as a real probability with comparable scale. If one head is systematically inflated (say, outputs 2× the true probability), its *effective* weight is doubled no matter what wᵢ you chose, silently corrupting the ranking. Calibrated heads make the chosen weights mean what they say.`,
          `C) Because uncalibrated heads produce NaNs in the weighted sum.`,
          `D) It isn't required — sorting by the weighted sum is invariant to per-head scaling.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**"Maximize engagement" is an abdication:** any single short-term signal has a pathological maximum — CTR → clickbait, watch-time → rabbit holes, comments → outrage. Staff-level RecSys is *objective design*: choosing what to optimize so the system is still good in a year.`,
      `**A value model fuses calibrated predictions into one score:** score = 1.0·p(click) + 1.2·p(dwell) + 0.5·p(share) − 3.0·p(report). The weights encode business value and are a *product decision tuned online against a north-star* (long-term retention), never fit by offline loss — no weight vector maxes every objective at once.`,
      `**Engagement vs quality is a delayed-feedback tradeoff:** this session's max watch-time can lower next month's retention. Encode a proxy for *long-term* value (completion, satisfaction, dwell-past-threshold) — the Netflix/YouTube move from views/clicks toward valued watch time and retention.`,
      `**Guardrails ride the same score:** harm signals (report, "see fewer", hide) enter as *negative* weights so bad-but-clicky content is demoted at ranking time, not filtered after; diversity/freshness enter at re-ranking.`,
      `**Calibration is load-bearing:** the weighted sum treats each pᵢ as a real probability — an uncalibrated head silently doubles its own effective weight and corrupts the ranking. Calibrate every head or the weights lie.`,
    ],
    figures: {
      value: `<svg viewBox="0 0 360 108" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  ${[['p(click)', '×1.0'], ['p(dwell)', '×1.2'], ['p(share)', '×0.5'], ['p(report)', '×−3.0']].map((s, i) => `
  <rect x="${6 + i * 89}" y="18" width="80" height="30" rx="5" fill="${i === 3 ? 'none' : 'var(--prime-faint)'}" stroke="${i === 3 ? 'var(--amber)' : 'var(--prime)'}"/>
  <text x="${46 + i * 89}" y="32" text-anchor="middle" fill="${i === 3 ? 'var(--amber)' : 'var(--ink-hi)'}" font-size="8" font-weight="700">${s[0]}</text>
  <text x="${46 + i * 89}" y="43" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">${s[1]}</text>
  <path d="M${46 + i * 89},48 L180,68" stroke="var(--rim)" stroke-width="0.7"/>`).join('')}
  <rect x="130" y="68" width="100" height="22" rx="5" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="180" y="82" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">value model score</text>
  <text x="10" y="104" fill="var(--ink-low)" font-size="7.5">weights = product decision tuned online vs a long-term north-star · harm = negative weight</text>
</svg>`,
    },
  },
  {
    id: 'recsys_dl_architectures',
    interactiveId: 'dl_recsys_arch_viz',
    title: 'Deep-Learning RecSys Architectures',
    subtitle: 'Wide & Deep, DeepFM, DLRM, DIN, and sequence models (SASRec/BERT4Rec) — what each models and when it fits',
    difficulty: 'advanced',
    estimatedMin: 26,
    tags: ['RecSys', 'deep learning', 'DLRM', 'DIN', 'sequence models'],
    summary: `Once retrieval has handed the ranker a few hundred candidates, the interesting modelling question becomes: *how do you turn a pile of categorical features — user id, item id, category, device, hour, the user's last 50 clicks — into a score?* The named architectures interviewers reach for are all answers to that one question, and each one is defined by *which interactions it can represent*.

[FIGURE: embtable]

---

**Everything starts with embedding tables.** A categorical feature like item_id with 10M values can't go into a network as a one-hot vector — that's a 10M-wide input. Instead each id indexes into an **embedding table**: a learned matrix of shape (num_ids × d), where a lookup returns a dense d-vector (d ≈ 16–128). This is the memory reality of deep RecSys: the tables, not the MLP, dominate the parameter count — a single 100M-id feature at d=64 is 6.4B parameters (~25GB in fp32), which is exactly why industrial systems (DLRM) shard embedding tables across many hosts while the dense compute stays small. A **feature cross** is the other primitive: the signal "this *user* likes this *category*" isn't in either feature alone; it lives in their conjunction, and an architecture is largely characterised by whether it learns crosses automatically or needs them hand-engineered.

[FIGURE: archgrid]

---

**Wide & Deep and DeepFM: memorisation plus generalisation.** *Wide & Deep* (Google) runs two paths in parallel: a **wide** linear model over hand-crafted cross-product features (memorises specific "user_X installed app_Y" combinations seen in training) and a **deep** MLP over embeddings (generalises to unseen combinations via dense similarity). The wide side needs a human to specify which crosses matter. *DeepFM* removes that manual step: it replaces the wide part with a **Factorization Machine** that learns *all* pairwise (2nd-order) feature interactions automatically through shared embeddings, then adds a deep MLP for higher-order patterns — same embeddings feed both, no cross engineering.

---

**DLRM, DIN, and sequence models.** *DLRM* (Meta) is the industrial workhorse: embed every categorical, take **explicit pairwise dot products** between all embedding pairs (2nd-order interaction), concatenate with dense features, and pass through an MLP — its identity is the embedding-table-memory reality above. *DIN* (Alibaba) adds **local activation**: instead of pooling a user's behaviour history into one fixed vector, it runs **attention over the history with respect to the candidate item**, so a user's past interest in *running shoes* is up-weighted when scoring a *sneaker* and ignored when scoring a *blender* — the user representation becomes candidate-dependent. *Sequence models* go further and model *order*: **SASRec** uses **unidirectional (causal) self-attention** over the interaction sequence to predict the next item (left-to-right, like a language model); **BERT4Rec** uses **bidirectional** self-attention with a **masked-item** ("cloze") objective, seeing both past and future context during training — stronger representations, but it can't be used autoregressively for pure next-item prediction the way SASRec can. The judgement call: a plain **two-tower + GBDT** ranker is an excellent, cheap default; you reach for these when *feature crosses matter and you don't want to hand-engineer them* (DeepFM/DLRM), when *the recent-history-vs-candidate interaction is the dominant signal* (DIN), or when *sequential order carries the intent* (SASRec/BERT4Rec).`,
    interactivePrompt: `Before you pick an architecture: on the same user (id, category, and a click history), which architectures make the user's representation *depend on the candidate item*, and which produce one fixed user vector regardless of what you're scoring? That distinction is DIN's whole reason to exist.`,
    keyPoints: [
      `**Embedding tables are the memory reality of deep RecSys.** Each categorical id indexes a learned (num_ids × d) matrix; the tables — not the MLP — dominate parameters (100M ids × d=64 ≈ 6.4B params, ~25GB). This is why DLRM-scale systems shard embedding tables across hosts while dense compute stays small.`,
      `**Wide & Deep vs DeepFM = the cost of feature crosses.** Wide & Deep memorises via hand-crafted cross-product features (wide) + generalises via an embedding MLP (deep); DeepFM replaces the manual wide part with a Factorization Machine that learns *all* 2nd-order crosses automatically through shared embeddings — no cross engineering.`,
      `**DLRM makes the interaction explicit; DIN makes the user representation candidate-dependent.** DLRM takes pairwise dot products between all embedding pairs, then an MLP. DIN runs attention over the user's behaviour history *w.r.t. the candidate* (local activation), so relevant past behaviour is up-weighted per candidate instead of pooled into one fixed vector.`,
      `**SASRec vs BERT4Rec = unidirectional vs bidirectional sequence modelling.** SASRec uses causal (left-to-right) self-attention to predict the next item, so it's naturally autoregressive; BERT4Rec uses bidirectional self-attention with a masked-item (cloze) objective, seeing future context in training for stronger representations but not usable for pure autoregressive next-item generation.`,
      `**A two-tower + GBDT ranker is the right default; reach for DL architectures for a specific reason.** DeepFM/DLRM when un-engineered feature crosses matter; DIN when the history-vs-candidate interaction dominates; SASRec/BERT4Rec when sequential order carries intent. Adopting a heavier architecture without one of those reasons buys cost, not accuracy.`,
    ],
    takeaway: `Deep-learning RecSys architectures are all answers to "how do you turn categorical features into a score," and each is defined by which interactions it represents: Wide & Deep (hand-crafted crosses + embedding MLP), DeepFM (FM learns all 2nd-order crosses automatically), DLRM (explicit pairwise dot products, with embedding tables as the memory reality), DIN (attention over history w.r.t. the candidate → candidate-dependent user vector), and SASRec/BERT4Rec (unidirectional vs bidirectional self-attention over the interaction sequence). A two-tower + GBDT ranker is the cheap strong default; you upgrade only when crosses, history-vs-candidate, or order is the dominant signal.`,
    checkQuestions: [
      {
        q: `In a deep RecSys ranker with a few dense features and several high-cardinality categorical features (user_id ~100M, item_id ~10M), where does almost all the parameter count and memory live, and what is the standard consequence?`,
        options: [
          `A) In the MLP layers — deep networks are parameter-heavy, so the fix is to prune hidden units.`,
          `B) In the embedding tables — a 100M-id feature at d=64 is ~6.4B parameters (~25GB fp32), dwarfing the dense MLP. Industrial systems (DLRM) therefore shard embedding tables across many hosts while keeping the dense compute small and replicated.`,
          `C) In the attention layers, which scale quadratically with the number of features.`,
          `D) In the output softmax over items, which is why hierarchical softmax is required.`,
        ],
        answer: `B`,
      },
      {
        q: `What precisely does DeepFM give you over Wide & Deep?`,
        options: [
          `A) It adds a wide linear path that Wide & Deep lacks, improving memorisation of rare combinations.`,
          `B) It replaces Wide & Deep's manually hand-crafted cross-product features with a Factorization Machine that learns *all* pairwise (2nd-order) feature interactions automatically through the shared embeddings — removing the human cross-engineering step while keeping a deep MLP for higher-order patterns.`,
          `C) It removes embedding tables entirely, so it needs far less memory than Wide & Deep.`,
          `D) It uses attention over the user's history, which Wide & Deep cannot do.`,
        ],
        answer: `B`,
      },
      {
        q: `A user's click history contains running shoes, a cookbook, and a phone case. DIN scores two candidates: a sneaker and a blender. What does DIN's local-activation attention do that a fixed pooled user vector cannot?`,
        options: [
          `A) It concatenates the whole history into the MLP, giving both candidates the same richer input.`,
          `B) It attends over the history *with respect to each candidate*: for the sneaker it up-weights the running-shoes interaction (relevant) and for the blender it largely ignores it — making the user's effective representation candidate-dependent, so the same history contributes different signal per item. A single pooled vector is the same for both candidates and can't do this.`,
          `C) It sorts the history by recency and truncates to the last item, which is all that matters.`,
          `D) It applies bidirectional attention over the history, which is what distinguishes DIN from SASRec.`,
        ],
        answer: `B`,
      },
      {
        q: `You want a sequential recommender you can also run autoregressively to predict the *next* item given a prefix. Between SASRec and BERT4Rec, which fits and why?`,
        options: [
          `A) BERT4Rec — its bidirectional attention gives the strongest representations, so it is always preferred for next-item prediction.`,
          `B) SASRec — it uses unidirectional (causal, left-to-right) self-attention trained to predict the next item, so it is naturally autoregressive. BERT4Rec's bidirectional masked-item (cloze) objective sees future context in training and yields strong representations, but it is not a pure left-to-right next-item generator.`,
          `C) Either works identically; the only difference is BERT4Rec is faster to train.`,
          `D) Neither — sequence models can't do next-item prediction; you need a two-tower retriever for that.`,
        ],
        answer: `B`,
      },
      {
        q: `Your team runs a solid two-tower retriever plus a GBDT ranker on tabular features. When is switching the ranker to DLRM or DIN actually justified, rather than cargo-culting?`,
        options: [
          `A) Always — deep architectures strictly dominate GBDTs on tabular ranking, so any switch is an upgrade.`,
          `B) When there's a concrete signal a GBDT captures poorly: many high-cardinality categorical *crosses* you don't want to hand-engineer (DLRM's explicit pairwise interactions over embeddings), or a dominant recent-history-vs-candidate interaction (DIN's local activation). Absent such a signal, the DL model mostly adds serving cost and embedding-table memory for marginal gain.`,
          `C) Whenever offline AUC is below 0.9, since DL models are the only way past that threshold.`,
          `D) Only when the catalog exceeds 1M items, which is the point GBDTs stop training.`,
        ],
        answer: `B`,
      },
      {
        q: `Which statement about feature crosses across these architectures is correct?`,
        options: [
          `A) Wide & Deep and DeepFM both require the engineer to specify which crosses to model.`,
          `B) A raw MLP over concatenated embeddings does *not* automatically learn explicit low-order feature crosses well, which is exactly why DeepFM (FM component) and DLRM (explicit pairwise dot products) add a dedicated interaction mechanism — the "user × category" conjunction lives in neither feature alone and must be modelled explicitly to be captured reliably.`,
          `C) DLRM avoids feature crosses entirely and relies solely on its MLP, which is why it needs so many layers.`,
          `D) Factorization Machines can only model 3rd-order and higher interactions, never pairwise ones.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Embedding tables are the memory reality:** each categorical id indexes a learned (num_ids × d) matrix; tables dominate params (100M ids × d=64 ≈ 6.4B, ~25GB), so DLRM-scale systems shard tables across hosts while dense compute stays small. A feature cross ("user × category") lives in the conjunction, not either feature alone.`,
      `**Wide & Deep vs DeepFM:** Wide & Deep = hand-crafted cross features (wide, memorises) + embedding MLP (deep, generalises). DeepFM replaces the manual wide part with a Factorization Machine that learns *all* 2nd-order crosses automatically via shared embeddings — no cross engineering — plus a deep MLP.`,
      `**DLRM vs DIN:** DLRM embeds every categorical, takes explicit pairwise dot products (2nd-order interaction), then an MLP. DIN adds local activation — attention over the user's behaviour history *w.r.t. the candidate item* — making the user representation candidate-dependent instead of a single pooled vector.`,
      `**SASRec vs BERT4Rec:** both model *order* via self-attention over the interaction sequence. SASRec = unidirectional/causal (next-item, naturally autoregressive); BERT4Rec = bidirectional with a masked-item (cloze) objective (stronger representations from future context in training, not a pure autoregressive generator).`,
      `**Default and upgrade rule:** two-tower + GBDT is the cheap strong default. Upgrade to DeepFM/DLRM for un-engineered crosses, DIN for a dominant history-vs-candidate interaction, SASRec/BERT4Rec when sequential order carries intent — otherwise you buy cost, not accuracy.`,
    ],
    figures: {
      embtable: `<svg viewBox="0 0 360 104" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">categorical id → embedding-table lookup → dense d-vector (tables dominate memory)</text>
  <rect x="14" y="22" width="70" height="22" rx="4" fill="var(--depth)" stroke="var(--rim)"/>
  <text x="49" y="36" text-anchor="middle" fill="var(--ink-hi)" font-size="8">item_id = 7318</text>
  <path d="M84,33 L120,33" stroke="var(--ink-low)" stroke-width="1" marker-end="url(#a1)"/>
  <rect x="122" y="18" width="70" height="60" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="157" y="14" text-anchor="middle" fill="var(--ink-mid)" font-size="7">table (10M × d)</text>
  ${[0,1,2,3].map(i=>`<rect x="130" y="${24+i*13}" width="54" height="9" rx="1.5" fill="${i===2?'var(--amber)':'var(--rim)'}" opacity="${i===2?'0.9':'0.4'}"/>`).join('')}
  <path d="M192,48 L228,48" stroke="var(--ink-low)" stroke-width="1" marker-end="url(#a1)"/>
  <rect x="230" y="38" width="124" height="20" rx="4" fill="none" stroke="var(--amber)"/>
  <text x="292" y="51" text-anchor="middle" fill="var(--amber)" font-size="8" font-weight="700">dense vector (d=64)</text>
  <text x="6" y="96" fill="var(--ink-low)" font-size="7.5">100M ids × d=64 ≈ 6.4B params (~25GB) → DLRM shards tables across hosts</text>
  <defs><marker id="a1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--ink-low)"/></marker></defs>
</svg>`,
      archgrid: `<svg viewBox="0 0 360 116" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  ${[['Wide & Deep','crosses (manual) + deep'],['DeepFM','FM learns all 2nd-order'],['DLRM','explicit pairwise dot-prod'],['DIN','attention over history / candidate'],['SASRec','unidirectional sequence'],['BERT4Rec','bidirectional / masked']].map((s,i)=>{const c=i%3,r=Math.floor(i/3);const seq=i>=4;return `
  <rect x="${8+c*116}" y="${16+r*44}" width="108" height="36" rx="6" fill="${seq?'none':'var(--prime-faint)'}" stroke="${seq?'var(--amber)':'var(--prime)'}"/>
  <text x="${62+c*116}" y="${31+r*44}" text-anchor="middle" fill="${seq?'var(--amber)':'var(--ink-hi)'}" font-size="8.5" font-weight="700">${s[0]}</text>
  <text x="${62+c*116}" y="${43+r*44}" text-anchor="middle" fill="var(--ink-mid)" font-size="6.6">${s[1]}</text>`}).join('')}
  <text x="8" y="112" fill="var(--ink-low)" font-size="7.5">each is defined by which interaction it can represent — crosses, history-vs-candidate, or order</text>
</svg>`,
    },
  },
  {
    id: 'recsys_representation_learning',
    interactiveId: 'negative_sampling_viz',
    title: 'Representation Learning for RecSys',
    subtitle: 'Two-tower objectives, negative sampling (in-batch, hard, popularity-corrected) — why sampling dominates retrieval quality',
    difficulty: 'advanced',
    estimatedMin: 24,
    tags: ['RecSys', 'embeddings', 'negative sampling', 'contrastive', 'logQ correction'],
    summary: `The counter-intuitive lesson of retrieval training is that the *encoder architecture* is rarely what limits recall — the **negative-sampling scheme** is. You can swap a deeper tower in for a shallower one and move recall a point or two; change how you pick negatives and recall can move ten points. This module is about why that is, and about the single most famous failure mode in the field: naive in-batch negatives collapsing under popularity skew.

[FIGURE: objective]

---

**The two-tower objective is contrastive: pull the positive together, push negatives apart.** You have positives (user *u* clicked item *i⁺*) but no labelled negatives. Training frames it as a **softmax over items**: maximise the probability of *i⁺* against a set of sampled negatives, i.e. **sampled softmax** — equivalently the **InfoNCE / contrastive** loss L = −log( exp(u·v⁺) / (exp(u·v⁺) + Σⱼ exp(u·vⱼ⁻)) ). The gradient literally *pulls* u toward v⁺ and *pushes* it away from each negative vⱼ⁻. So the whole learning signal is shaped by **which negatives you put in that denominator** — the positives are fixed by the data; the negatives are your design choice, and they are where retrieval quality is won or lost.

---

**The three negative-sampling schemes, and their tradeoffs.** (1) **In-batch negatives** — the cheap default: within a batch of B (user, item) pairs, use every *other* user's positive as a negative, giving B×(B−1) negatives for free with no extra lookups. The problem: batches are sampled from the *interaction* distribution, so **popular items appear as negatives far more often** than rare ones. (2) **Hard negatives** — mined items that score *high but weren't clicked* (near-misses). Random in-batch negatives are usually trivially easy (a cooking video vs a random car part → near-zero gradient, nothing learned); hard negatives sit right on the decision boundary and produce the gradient that actually sharpens fine distinctions, which is what lifts recall. (3) **Popularity / logQ correction** — because in-batch sampling over-represents popular items as negatives, they get systematically *over-penalised*; the fix is to subtract each item's **log sampling probability** from its logit (u·vⱼ − log Q(j)), the sampled-softmax correction, restoring an unbiased objective.

[FIGURE: collapse]

---

**The classic failure: in-batch popularity collapse.** Follow the mechanism. Popular items are positives for *many* users, so in any batch they show up as *negatives* for everyone whose positive they aren't. The contrastive gradient therefore pushes almost every user's embedding *away* from popular items — even users who would love them. The model learns "popular = negative," over-suppresses head items, and in the pathological case the popular-item embeddings get pushed into a degenerate region and retrieval **collapses**: recall on exactly the items most users want craters. This is why **the logQ correction isn't a nicety — it's what keeps in-batch training from eating itself**, and why an interviewer probing retrieval will ask about it. The takeaway that separates levels: *before you deepen the encoder, fix the negatives* — sampling scheme dominates recall.`,
    interactivePrompt: `Before you touch the controls: with a strong popularity skew and pure in-batch negatives, predict what happens to the *most popular* item's embedding — does it get pulled toward users or pushed away, and why does that tank recall on the very items most users want?`,
    keyPoints: [
      `**The two-tower objective is contrastive (sampled softmax / InfoNCE):** maximise exp(u·v⁺) against a denominator of sampled negatives. The positives are fixed by the data; the *negatives in the denominator* are the design choice, so retrieval quality is decided by the sampling scheme, not mainly by encoder depth.`,
      `**In-batch negatives are free but popularity-biased.** A batch of B pairs yields B×(B−1) negatives with no extra lookups — but batches follow the interaction distribution, so popular items appear as negatives disproportionately and get over-penalised.`,
      `**Hard negatives supply the gradient that lifts recall.** Random negatives (a cooking video vs a random car part) are trivially separable → near-zero gradient → nothing learned. Hard negatives (high-scoring non-clicks near the boundary) produce real gradient that sharpens fine distinctions — the actual recall driver.`,
      `**The logQ / popularity correction de-biases the objective.** Subtract each item's log sampling probability from its logit (u·vⱼ − log Q(j)); this sampled-softmax correction removes the systematic over-suppression of popular items that in-batch sampling introduces.`,
      `**In-batch popularity collapse is the classic failure.** Popular items appear as negatives for nearly everyone, so the gradient pushes almost all users away from them; the model learns "popular = negative," over-suppresses head items, and recall on the most-wanted items collapses. The logQ correction is what prevents this — sampling scheme, not encoder, dominates recall.`,
    ],
    takeaway: `Retrieval embeddings are trained with a contrastive (sampled-softmax / InfoNCE) objective, and the negative-sampling scheme — not the encoder architecture — dominates recall. In-batch negatives are free but follow the interaction distribution, so popular items appear as negatives for nearly everyone; naive in-batch training therefore pushes almost every user away from popular items ("popular = negative"), over-suppressing the head until retrieval collapses. Hard negatives supply the boundary gradient that lifts recall, and a logQ / popularity correction (subtract log sampling probability) de-biases the objective and is what keeps in-batch training from eating itself.`,
    checkQuestions: [
      {
        q: `In a two-tower retriever trained with sampled softmax / InfoNCE, why is the choice of negatives often more decisive for recall than making the encoder deeper?`,
        options: [
          `A) Deeper encoders overfit, so shallow encoders always win; negatives are irrelevant.`,
          `B) The positives are fixed by the data, so the entire learning signal is shaped by which negatives sit in the softmax denominator — they determine what the model is pushed away from. A better encoder refines a signal that the negatives define; wrong negatives (too easy, or popularity-biased) cap recall no matter how deep the tower is.`,
          `C) Encoder depth only affects latency, never accuracy, in two-tower models.`,
          `D) Negatives change the ANN index geometry, which is the only thing that affects recall.`,
        ],
        answer: `B`,
      },
      {
        q: `Why do purely random in-batch negatives often produce near-zero gradient and fail to lift recall, and what fixes it?`,
        options: [
          `A) Random negatives cause exploding gradients; gradient clipping fixes recall.`,
          `B) A random negative (e.g., a cooking video as a negative for a car-parts query) is trivially far from the positive, so the contrastive loss is already near zero and its gradient is tiny — the model learns nothing subtle. Hard negatives (high-scoring non-clicks near the decision boundary) produce meaningful gradient that sharpens fine distinctions, which is what actually raises recall.`,
          `C) Random negatives are too few; increasing batch size alone always solves it.`,
          `D) They don't — random negatives are optimal, and hard negatives only help ranking, not retrieval.`,
        ],
        answer: `B`,
      },
      {
        q: `Trace the in-batch popularity-collapse failure mode. Why does naive in-batch training over-suppress popular items?`,
        options: [
          `A) Popular items have larger embeddings, so their dot products saturate the softmax.`,
          `B) Popular items are positives for many users, so in any batch they appear as *negatives* for every other user in that batch. The contrastive gradient pushes nearly all users' embeddings away from popular items — including users who would love them — so the model learns "popular = negative," over-suppresses the head, and in the pathological case retrieval collapses on the very items most users want.`,
          `C) Popular items are sampled less often, so they are under-trained and their embeddings stay random.`,
          `D) The ANN index deprioritises high-degree nodes, dropping popular items at query time.`,
        ],
        answer: `B`,
      },
      {
        q: `What does the logQ (sampled-softmax) correction do, and why is it more than a nicety for in-batch training?`,
        options: [
          `A) It normalises embedding magnitudes so dot products lie in [-1, 1].`,
          `B) It subtracts each item's log sampling probability from its logit (u·vⱼ − log Q(j)), undoing the fact that in-batch sampling over-represents popular items as negatives. Without it, popular items are systematically over-penalised, which drives the popularity-collapse failure — so the correction is what keeps in-batch training from eating itself, not a marginal tweak.`,
          `C) It adds L2 regularisation to the embedding tables to prevent overfitting.`,
          `D) It replaces the softmax with a sigmoid, which is required for implicit feedback.`,
        ],
        answer: `B`,
      },
      {
        q: `A retriever trained with in-batch negatives under-recommends genuinely relevant popular items, while a colleague's model with the same encoder does not. What is the most likely difference, and the cross-cutting lesson?`,
        options: [
          `A) The colleague used a deeper encoder; deepen yours to match.`,
          `B) The colleague applied a logQ / popularity correction (or a mixed sampling scheme), de-biasing the over-representation of popular items as in-batch negatives. Same encoder, different sampling — which illustrates the general rule that the negative-sampling scheme dominates retrieval recall more than the encoder architecture.`,
          `C) The colleague used a larger embedding dimension, which always fixes popularity bias.`,
          `D) The colleague trained longer; more epochs alone removes popularity bias.`,
        ],
        answer: `B`,
      },
      {
        q: `Where does embedding regularisation fit relative to the negative-sampling story?`,
        options: [
          `A) Regularisation replaces negative sampling — with enough L2 you don't need negatives.`,
          `B) It is complementary and secondary: L2 / normalisation (e.g., unit-norm embeddings) and temperature control the embedding geometry and stabilise training, but they don't fix a biased or too-easy negative distribution. The negatives determine *what* the model learns to separate; regularisation only shapes *how tightly* — so sampling is the first-order lever and regularisation the second-order one.`,
          `C) Regularisation is what causes popularity collapse, so it should be removed from retrieval training.`,
          `D) Embedding regularisation is only relevant to the ranking stage, never retrieval.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Two-tower objective is contrastive (sampled softmax / InfoNCE):** maximise exp(u·v⁺) against a denominator of sampled negatives; the gradient pulls u toward v⁺ and pushes it from each negative. Positives are fixed by data — the *negatives in the denominator* are the design choice that decides recall.`,
      `**In-batch negatives:** free (B×(B−1) per batch, no extra lookups) but sampled from the interaction distribution, so popular items appear as negatives disproportionately and get over-penalised.`,
      `**Hard negatives:** random negatives are trivially easy (near-zero gradient, nothing learned); mined high-scoring non-clicks sit on the boundary and supply the gradient that sharpens fine distinctions — the real recall driver.`,
      `**logQ / popularity correction:** subtract each item's log sampling probability from its logit (u·vⱼ − log Q(j)) to undo in-batch over-representation of popular items — restoring an unbiased objective.`,
      `**In-batch popularity collapse (the classic failure):** popular items appear as negatives for nearly everyone → gradient pushes almost all users away from them → model learns "popular = negative," over-suppresses the head, and recall on the most-wanted items collapses. The logQ correction is what prevents it. Bottom line: fix the negatives before deepening the encoder — sampling dominates recall.`,
    ],
    figures: {
      objective: `<svg viewBox="0 0 360 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">contrastive: pull u → v⁺, push u away from every negative vⱼ⁻</text>
  <circle cx="80" cy="56" r="9" fill="var(--prime)"/><text x="80" y="59" text-anchor="middle" fill="var(--depth)" font-size="8" font-weight="700">u</text>
  <circle cx="150" cy="40" r="8" fill="var(--amber)"/><text x="150" y="43" text-anchor="middle" fill="var(--depth)" font-size="7" font-weight="700">v⁺</text>
  <path d="M92,53 L140,43" stroke="var(--prime)" stroke-width="1.6" marker-end="url(#p1)"/>
  <text x="112" y="40" fill="var(--prime)" font-size="7">pull</text>
  ${[[220,32],[250,66],[210,78]].map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="none" stroke="#ef4444"/><text x="${p[0]}" y="${p[1]+2.5}" text-anchor="middle" fill="#ef4444" font-size="6">v⁻</text><path d="M90,${54+i*2} L${p[0]-8},${p[1]}" stroke="#ef4444" stroke-width="0.8" stroke-dasharray="2 2" marker-end="url(#r1)"/>`).join('')}
  <text x="228" y="18" fill="#ef4444" font-size="7">push (which negatives? = the design choice)</text>
  <text x="6" y="94" fill="var(--ink-low)" font-size="7.5">L = −log exp(u·v⁺) / (exp(u·v⁺) + Σⱼ exp(u·vⱼ⁻))  · negatives shape the whole signal</text>
  <defs><marker id="p1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="var(--prime)"/></marker><marker id="r1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#ef4444"/></marker></defs>
</svg>`,
      collapse: `<svg viewBox="0 0 360 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">in-batch collapse: a popular item is a negative for nearly every user in the batch</text>
  <circle cx="180" cy="54" r="11" fill="#ef4444" opacity="0.85"/><text x="180" y="57" text-anchor="middle" fill="var(--depth)" font-size="7" font-weight="700">popular</text>
  ${[40,80,120,240,280,320].map((x,i)=>`<circle cx="${x}" cy="${i%2?38:72}" r="6" fill="var(--prime)"/><path d="${i<3?`M${x+7},${i%2?40:70} L169,54`:`M${x-7},${i%2?40:70} L191,54`}" stroke="#ef4444" stroke-width="0.8" stroke-dasharray="2 2" marker-end="url(#r2)"/>`).join('')}
  <text x="6" y="92" fill="var(--amber)" font-size="7.5">every user pushed away from it → "popular = negative" → head collapses. logQ correction prevents this.</text>
  <defs><marker id="r2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#ef4444"/></marker></defs>
</svg>`,
    },
  },
]
