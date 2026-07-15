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

(1) Clarify requirements — QPS (queries per second), latency SLA (service-level agreement), label availability, the cost asymmetry between a false positive and a false negative. (2) Frame as an ML problem — is this ranking, classification, regression, retrieval? (3) Data strategy — where do labels come from, how fresh, how biased. (4) Model design. (5) Serving architecture. (6) Monitoring. The single most common interview failure is skipping to step 4.

---

**Why the ordering is load-bearing.** Every downstream choice is a function of the earlier answers. A 200ms transformer is disqualified the instant the SLA turns out to be 50ms. A supervised model is disqualified the instant you learn there are no labels and none are coming. If you pick the model first, you discover these walls after weeks of work instead of in the first five minutes.`,
    keyPoints: [
      `**Steps 1–3 constrain every architecture decision: clarify, frame, and plan data before touching a model.** Without QPS, latency SLA, label availability, and the cost asymmetry between error types, every later decision is a guess. Concretely: a "design a spam filter" prompt has no single right answer until you know whether it blocks the email synchronously (needs <100ms) or quarantines async (can take seconds), and whether a false positive (real mail lost) costs more than a false negative (spam delivered). That asymmetry can even dictate the architecture itself — e.g. a two-stage design (cheap model auto-approves, expensive model reviews the rest) plus a human-in-the-loop — decided in step 1, not tuned later as class weights inside the model.`,
      `**Steps 4–5 are coupled, not sequential: model choice and serving architecture must be solved together.** A model whose memory footprint exceeds your target serving hardware's capacity can't run there as a single instance; a 200ms model cannot serve real-time. Choosing the model first and discovering the serving wall later wastes the most expensive weeks of a project.`,
      `**Step 6 is not optional: a deployed model has no built-in signal for its own decay.** Without monitoring input distributions, prediction distributions, and the business metric, the first symptom of failure is a revenue drop days after the damage began. Define the retraining trigger before launch, not after the first incident.`,
    ],
    takeaway: `ML system design is constraint-propagation: the latency SLA, label availability, and error-cost asymmetry established in steps 1–3 disqualify most architectures before you ever compare models — which is why jumping to step 4 is the defining junior mistake.`,
    checkQuestions: [
      {
        q: `You're asked to "design a spam filter for email." Which opening move best separates a senior from a junior answer?`,
        options: [
          `A) State the model architecture — a fine-tuned transformer over email text — plus a target training-data size of 5M labeled messages, then refine.`,
          `B) Establish scale/QPS, sync (<100ms, blocks delivery) vs async filtering, label source/freshness, and the FP/FN cost asymmetry — each answer rules out whole design classes.`,
          `C) Propose the evaluation metric (F1 at a fixed 0.5 threshold) and the deployment region first, since evaluation supposedly drives every later choice.`,
          `D) Enumerate the feature set — sender reputation, link count, character n-grams, embedded-URL flags — so model design and hyperparameter search can begin right away without any further discussion.`,
        ],
        answer: `B`,
      },
      {
        q: `A candidate designs a 180ms deep model, then at the end learns the product SLA is 40ms. What does the framework say went wrong?`,
        options: [
          `A) Nothing structural — quantize and distill the 180ms model down to 40ms with INT8 weights, keeping the rest of the original architecture and design exactly as-is for the initial production launch.`,
          `B) The evaluation metric was picked too late; had F1 been fixed first, the 40ms latency ceiling would have surfaced on its own.`,
          `C) Latency is a step-1 requirement elicited before model design; discovering a hard SLA after picking the architecture forces a redo — the exact failure the ordering prevents.`,
          `D) The monitoring plan was missing, so nobody caught the regression in staging — adding step 6's dashboards alone resolves it.`,
        ],
        answer: `C`,
      },
      {
        q: `Select the two correct statements about why the false-positive vs false-negative cost asymmetry belongs in step 1 rather than step 4.`,
        options: [
          `A) It sets the operating point and even the framing — e.g. a two-stage design (cheap auto-approve, expensive review) plus a human-in-the-loop, decided before modeling begins.`,
          `B) It determines the learning rate and batch size used during training, which is why it's fundamentally a step-4 hyperparameter concern.`,
          `C) It's one of the constraints elicited in step 1 -- without it, every downstream decision, including step 4's model choice, is effectively a guess rather than a reasoned pick.`,
          `D) Regulators require the exact cost ratio documented in a compliance filing before deployment, independent of the system's actual design.`,
        ],
        answer: ['A', 'C'],
      },
    ],
    recap: [
      `**The 6 steps in order:** clarify requirements → frame as an ML problem → data strategy → model → serving → monitoring. Jumping straight to "model" (step 4) is the single most common interview failure — the classic junior tell.`,
      `**Steps 1–3 are load-bearing constraints, not preamble:** QPS, latency SLA, label availability, and the FP-vs-FN cost asymmetry disqualify most architectures up front. A 200ms transformer dies the instant the SLA turns out to be 50ms; a supervised model dies the instant you learn there are no labels coming. Elicit these in the first five minutes, not after weeks of work.`,
      `**Model and serving are coupled, solve them together:** a 200ms model can't serve real-time, a model whose memory footprint exceeds the target hardware's capacity can't run there as a single instance. Choose the model first and you discover the serving wall after the most expensive weeks are spent.`,
      `**Monitoring (step 6) is not optional:** a deployed model has no built-in signal for its own decay, so without monitoring input distributions, prediction distributions, and the business metric, the first symptom of failure is a revenue drop days after the damage began. Define the retraining trigger before launch.`,
      `**Cost asymmetry shapes the whole design, not just training:** if a false positive (blocking a legit transaction) costs far more than a false negative, you may need a two-stage design (cheap model auto-approves, expensive model reviews the rest) plus a human-in-the-loop — architectural choices that must be decided before modeling, not tuned as class weights inside it.`,
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

**Re-ranking exists because "most relevant" and "best final list" aren't the same thing.** A ranker sorted purely by predicted engagement will happily fill the whole list with near-duplicates of one dominant interest — each individually well-scored, but repetitive as a set. Re-ranking corrects for that after ranking, not instead of it: it caps how many near-duplicate items can sit together, injects freshness the ranker alone would never favor, and applies business rules (e.g., no two ads back-to-back) on top of the ranker's precision-ordered list. Skip re-ranking and the ranker's raw output ships as-is — accurate item-by-item, but monotonous overall.

---

**The data flywheel is why incumbents are so hard to displace.** More users → more interaction data → better models → more engagement → more users. Much of that model quality comes from collaborative filtering — inferring what a user will like from patterns across *other* users' interactions (people who watched X also watched Y), not from anything intrinsic to the item itself. A new entrant with no interaction history can't run collaborative filtering at all and must limp along on content features until it accumulates a base.

---

**Cold start is the flywheel's edge case, and it has a specific playbook.** A user with zero watch history can't be served by collaborative filtering, so the system leans on what it does have: context (device, time of day, location), content features (the item's own attributes, not who else liked it), and a popularity fallback (globally or regionally trending items) to make the first few recommendations reasonable. From there, every watch-time signal in the session — a 2-second skip vs. a 30-second watch — updates a real-time embedding for that user, so personalization sharpens within the same session rather than waiting for a next login.`,
    interactivePrompt: `Before you touch the controls: this simulator models the fuller production funnel — including the Pre-rank stage and ~100ms budget *recsys_stack* covers in depth next. For now, just watch Retrieval: if you narrow it to cut latency, which metric has a hard ceiling you can never recover downstream — and why?`,
    keyPoints: [
      `**The funnel exists because accuracy and scale can't be one model.** Retrieval must be fast and high-recall (a missed item is unrecoverable); ranking can be expensive and precise because it only sees hundreds of candidates. Different objectives → different architectures → different stages.`,
      `**Retrieval recall caps final quality.** If retrieval's recall@1000 is 0.7, then 30% of the items a user would have loved are already gone before ranking starts — and no amount of ranking sophistication recovers them. Diagnose a "great ranker, mediocre results" system by auditing retrieval recall first.`,
      `**Re-ranking curates the ranked list, it doesn't re-score it.** A ranker optimizing pure predicted engagement can fill an entire list with near-duplicates of one dominant interest — 10 videos from the same creator, each well-scored individually but monotonous as a set. Re-ranking caps near-duplicates, injects freshness, and layers business rules on top of the ranker's output after the fact.`,
      `**The data flywheel compounds the incumbent advantage.** Collaborative signal (patterns across other users' interactions) requires interaction history; a cold platform has none, so it underperforms an incumbent even with identical architecture until it accrues data. Exploration is the deliberate cost that keeps the flywheel fed with signal on new items.`,
      `**Cold start leans on context + content + popularity, then adapts fast.** With no watch history to run collaborative filtering on, a first session opens on context, content features, and a trending fallback; early watch-time signals (a skip vs. a long watch) then update a real-time embedding within that same session, so personalization sharpens without waiting for a next login.`,
      `**Pure exploitation collapses the catalog, not just short-term diversity.** Always serving the highest-predicted-engagement item narrows the system onto a shrinking set of popular items and starves the long tail of the signal it would need to ever be scored well, so coverage falls over time even as short-term clicks look fine — see *cold_start_system_design* and *recsys_feedback_loops* for the full collapse mechanism and the exploration-based fix.`,
    ],
    takeaway: `A recommender is a recall-then-precision funnel: retrieval cheaply maximizes recall over millions (and sets an unraiseable ceiling on final quality), ranking expensively maximizes precision over the survivors — one model can't occupy both ends.`,
    checkQuestions: [
      {
        q: `TikTok shows relevant videos in your very first session, before any watch history exists. What best explains how?`,
        options: [
          `A) It trains a fresh per-user neural network from scratch, running full gradient descent after each watch event inside the session.`,
          `B) It withholds all personalization until session two, serving only a fixed globally-popular list on the very first visit.`,
          `C) It leans on context, content features, and a popularity fallback, then rapidly updates a real-time embedding from early watch-time signals.`,
          `D) It requires linking a separate social account first, so prior interest signals can be fully imported before the session even starts, without exception.`,
        ],
        answer: `C`,
      },
      {
        q: `Your ranker scores 0.95 AUC offline, but users complain the recommendations miss obvious interests. Retrieval recall@500 is 0.6. Where's the bug?`,
        options: [
          `A) The ranker — 0.95 AUC came from a biased offline test set; retrain it with harder mined negatives and see whether the online gap closes.`,
          `B) Retrieval — recall@500 of 0.6 means 40% of relevant items never reach the ranker, capping quality regardless of AUC; fix retrieval before the ranker.`,
          `C) Re-ranking — the diversity layer is suppressing genuinely relevant items across the board; disabling diversity should let overall satisfaction improve immediately.`,
          `D) The metric — AUC is simply the wrong offline metric to use here; switching to NDCG@10 alone should make the discrepancy disappear entirely.`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two correct consequences of a pure-exploitation recommender (always serving the highest predicted-engagement item).`,
        options: [
          `A) It collapses onto a shrinking set of popular items and starves the model of signal on long-tail items, even as clicks look fine short-term.`,
          `B) It always remains optimal by definition, since maximizing predicted engagement each round is mathematically the best achievable policy.`,
          `C) User consumption narrows over time, so coverage and long-term satisfaction fall even though nothing about the model's accuracy has changed.`,
          `D) Inference latency rises over time because the unbounded candidate cache must be fully rescanned on every single request.`,
        ],
        answer: ['A', 'C'],
      },
    ],
    recap: [
      `**One model can't do scale AND quality at once:** scoring 10M items with a good model at ~1ms each is ~10,000s — five orders of magnitude past a 50ms budget. That impossibility is why every large recommender is a funnel, not a single model.`,
      `**The funnel is three stages, each a different tradeoff:** retrieval (candidate generation) cheaply narrows millions → thousands optimising *recall*; ranking runs an expensive precise model over the survivors optimising *precision*; re-ranking layers diversity, freshness, and business rules on top. The cheap stage must run over everything; the expensive stage only over what the cheap stage kept.`,
      `**Retrieval recall is a ceiling you can never raise downstream:** an item retrieval drops is gone — no ranker can score an item it never received, so if recall@1000 is 0.7, 30% of items the user would have loved are already lost. Tell: "great ranker, mediocre results" → audit retrieval recall first, before touching the ranker.`,
      `**The data flywheel is why incumbents are hard to displace:** more users → more interaction data → better models → more engagement → more users. A cold platform has no interaction history, so it can't run collaborative filtering at all and must limp along on content features until it accrues a base.`,
      `**Exploration is a deliberate, non-optional cost:** pure exploitation (always serve the highest predicted-engagement item) collapses onto a shrinking set of popular items, starves the model of signal on new/long-tail items, and narrows users — coverage falls even as short-term clicks look fine. Exploration trades a little engagement now to keep the flywheel fed.`,
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
    summary: `The gap between a recommender *prototype* and a recommender *system* is the entire engineering stack around the model. A prototype runs a ranker over a few thousand items and prints results. Production has to serve millions of users inside a ~100ms end-to-end budget — of which the four funnel stages below account for roughly 30ms of actual compute, the remainder consumed by network round-trips between services, feature-store lookups, and serialization at each hop — A/B-test each stage independently, degrade gracefully when any component dies, and correct position bias so the ranker doesn't just resurface whatever the last model showed.

[FIGURE: fourstage]

---

**Modern stacks have four stages, not three.** Between cheap retrieval and the expensive ranker sits a **pre-ranking** (a.k.a. coarse-ranking) stage: a lightweight model that trims thousands of retrieved candidates to a few hundred before the heavy ranker runs. Without it, the full ranker either blows the latency budget or is forced to score too few candidates. Retrieval (10M→5k, ~1ms) → pre-rank (5k→500, ~5ms) → rank (500→50, ~20ms) → re-rank (50→10, ~5ms). Re-ranking is a distinct final pass, not a smaller repeat of ranking: it takes the ranker's top ~50 scored candidates and applies constraints a per-item relevance score can't express on its own — deduplicating near-identical items, enforcing diversity across categories or sources, and injecting business rules (promotions, freshness floors, do-not-show lists) — before the top ~10 go to the user. See *reranking_diversity* for the algorithms and *recsys_feedback_loops* for how re-ranking's choices feed the position-bias problem below.

---

**Latency is allocated, not hoped for.** Each stage has a hard millisecond budget and a single overrunning stage cascades. The Rank stage's ~20ms budget, for example, splits roughly 10ms for feature retrieval and 10ms for the model's forward pass; if feature retrieval slips from 10ms to 15ms, only 5ms remains for scoring — forcing fewer candidates or a simpler model, both of which cost quality. Measure the budget end-to-end in production, never from component microbenchmarks.

---

**The hardest correctness problem is the feedback loop.** The ranker itself is a learning-to-rank (LTR) model — trained to order candidates against each other, not just score each one in isolation — and its quality is measured with rank-sensitive metrics like precision@1 (whether the single top-ranked item is actually relevant). The ranker trains on interactions shaped by what the *previous* ranker chose to show. Position 1 gets clicks regardless of quality; train on raw clicks and you teach the model to reproduce position effects, not relevance. Inverse-propensity weighting — reweighting each observed click by 1/P(click|position) to cancel out position's effect on the raw signal — and counterfactual learning are the tools that recover an unbiased relevance estimate.`,
    interactivePrompt: `Before you touch the controls: widen the Rank stage to score more candidates. Which stage's latency dominates, and why does the pre-ranking stage exist to prevent exactly this?`,
    keyPoints: [
      `**Pre-ranking is the stage most people forget.** Retrieval returns thousands; the full ranker can't afford to score thousands in-budget. A cheap pre-ranker (small two-tower or GBM) cuts 5k→500 so the expensive ranker only scores hundreds. Consistency matters: if the pre-ranker and ranker disagree wildly, good candidates get cut before the ranker ever sees them (pre-ranking/ranking consistency is its own tuning problem).`,
      `**Each stage is independently trained, monitored, and deployed — that's an organizational choice as much as technical.** It lets a 10-person team improve retrieval this week without re-testing ranking. Blur the boundaries and the pipeline becomes one un-shippable unit.`,
      `**Latency budgets are hard allocations measured end-to-end.** A stage that overruns steals from the next. The bottleneck is usually feature retrieval, not inference — profile the whole request path in production before committing to a model size.`,
    ],
    takeaway: `Production RecSys is a 4-stage funnel — retrieval, pre-ranking, ranking, re-ranking — where pre-ranking exists precisely because the heavy ranker can't score thousands of candidates in-budget, and every stage runs on its own hard latency allocation with position-bias correction stitched through.`,
    checkQuestions: [
      {
        q: `Select the two correct effects of inserting a pre-ranking stage when the ranker takes 95ms for 1000 candidates against a 100ms budget.`,
        options: [
          `A) A cheap model trims 1000→200 candidates so the heavy ranker scores 200 instead of 1000, cutting ranking latency roughly 5×.`,
          `B) It frees up budget for retrieval and feature fetch, which had nothing left once the ranker alone consumed 95 of the 100ms.`,
          `C) It removes the need for a latency budget entirely, since the pre-ranker absorbs all future growth in candidate volume.`,
          `D) It increases the candidate pool to 2000 items for more context, then applies a stricter score-based filter afterward.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Your LTR ranker shows higher precision@1 for items that were historically shown at low positions than high positions. Cause and fix?`,
        options: [
          `A) Label noise — low-position items collect fewer clicks and noisier implicit labels; collecting more editorial relevance judgments for those items fixes it.`,
          `B) Position bias — top positions rack up clicks from visibility alone (~10x a low position, regardless of relevance), diluting their true-relevance rate, while an item that earned clicks despite a low position is a purer relevance signal; fix with propensity weighting.`,
          `C) Overfitting to head queries that are consistently shown at top positions; fix it with query-frequency-weighted sampling during every single training run.`,
          `D) Feature leakage from popularity features that are strongly correlated with historical position; remove every popularity feature entirely from the set.`,
        ],
        answer: `B`,
      },
      {
        q: `Why is a pre-ranker that's simply a smaller copy of the ranker still worth having, even though it's less accurate?`,
        options: [
          `A) It isn't — if it's less accurate you should just run the real ranker on fewer retrieved candidates instead.`,
          `B) Its job is a cheap, recall-oriented cut from thousands to hundreds so the accurate ranker fits budget; fewer candidates lowers recall instead.`,
          `C) Because the pre-ranker's weights can be copied directly into the ranker's first layer to speed up training convergence.`,
          `D) Because a smaller model is inherently better calibrated by construction than any larger model could ever be, which directly and reliably improves the final ranking scores across the board.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Production RecSys is a 4-stage funnel, not 3:** retrieval (10M→5k, ~1ms) → pre-rank (5k→500, ~5ms) → rank (500→50, ~20ms) → re-rank (50→10, ~5ms). The gap between a *prototype* and a *system* is this entire stack — serving millions inside ~100ms, A/B-testing each stage, degrading gracefully, correcting position bias.`,
      `**Pre-ranking (coarse-ranking) is the stage interviews forget:** a lightweight model (small two-tower or GBM) trims thousands → hundreds so the heavy ranker fits its budget — without it the ranker either blows latency or scores too few candidates. Its own tuning problem is *pre-rank/rank consistency*: if the two disagree wildly, good candidates get cut before the ranker ever sees them.`,
      `**Latency is allocated, not hoped for — a hard per-stage budget measured end-to-end.** One overrunning stage cascades: the Rank stage's 20ms splits ~10ms feature fetch + ~10ms scoring, so if feature fetch slips 10ms→15ms, scoring loses 5ms and must drop candidates or simplify. Profile the whole request path in production; the bottleneck is usually feature retrieval, not inference.`,
      `**Each stage is independently trained, monitored, and deployed** — an organizational choice as much as technical, letting a small team improve retrieval this week without re-testing ranking. Blur the boundaries and the pipeline becomes one un-shippable unit.`,
      `**The feedback loop is the hardest correctness bug:** the ranker trains on interactions shaped by what the *previous* ranker showed, and position 1 gets clicks regardless of quality — train on raw clicks and you learn position effects, not relevance. Fix with inverse-propensity weighting (weight by 1/P(click|position)) plus occasional randomization for unbiased data.`,
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
    interactiveId: 'retrieval_funnel_viz',
    interactivePrompt: 'Two-tower models power the retrieval stage — watch the funnel narrow millions of candidates to the shortlist the ranker can afford to score.',
    title: 'Two-Tower Models',
    subtitle: 'Encode separately, compare cheaply — the retrieval workhorse',
    difficulty: 'advanced',
    estimatedMin: 22,
    tags: ['two-tower', 'embeddings', 'ANN', 'retrieval'],
    summary: `The most accurate way to score a user against an item is to feed them into one model together so it can weigh every interaction. The problem is arithmetic: that means scoring *every* user against *every* item at query time. For 10M items at 1000 users/second, that's 10 billion joint forward passes per second — an overnight warehouse job, not real-time retrieval.

[FIGURE: twotower]

---

**The two-tower trick: encode separately, compare with a dot product.** A user tower and an item tower map into the same embedding space; similarity is a plain dot product. Because an item's embedding no longer depends on who's asking, you compute *all* item embeddings offline, once, and index them for approximate-nearest-neighbor (ANN) search. At query time you encode just the one user and look up neighbors — ~10ms across 100M items. Retrieval quality itself is measured as **recall@K**: the fraction of truly relevant items that land inside the top K candidates the tower hands to the ranker. A tower with recall@100 of 60% is failing to surface 40% of the relevant items before the ranker ever sees them — no ranker can recover items retrieval never returned.

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
          `A) Cross-attention overfits badly on large catalogs, so its accuracy advantage disappears entirely above roughly 1M items.`,
          `B) Its representation depends on the query user, so embeddings can't be precomputed — every item must be scored fresh per query, orders of magnitude over budget.`,
          `C) Cross-attention requires specialized GPUs that physically can't be co-located with the ANN index at all, adding fatal cross-datacenter network latency to every query.`,
          `D) It can't produce fixed-length vector embeddings, so standard ANN libraries simply reject its raw output format.`,
        ],
        answer: `B`,
      },
      {
        q: `A two-tower model's recall@100 — the fraction of truly relevant items that make it into its top-100 candidates — is stuck at 60%. Which single change most directly attacks that low recall?`,
        options: [
          `A) Hard-negative mining plus richer features and a larger embedding dimension, to better separate close items in the space.`,
          `B) Expand the ANN candidate set from 100 to 500, letting the downstream ranker filter more aggressively over more survivors.`,
          `C) Reduce embedding dim from 256 down to 64 so the ANN index shrinks and more items become individually reachable.`,
          `D) Switch dot-product similarity to L2 distance instead, mainly for numerical stability in high-dimensional spaces.`,
        ],
        answer: `A`,
      },
      {
        q: `Your item catalog updates prices every few minutes, but the ANN index is rebuilt nightly. What's the failure mode and the right fix?`,
        options: [
          `A) No failure at all — price is purely a ranking-stage feature, so a stale retrieval index is completely harmless here.`,
          `B) Items whose relevance changed are retrieved with yesterday's stale embedding. Fix with continuous delta re-embedding of just the changed items.`,
          `C) The dot product silently overflows whenever prices change; simply normalizing embeddings nightly fixes the overflow.`,
          `D) It's actually the user tower that goes stale here, not the items; retraining the user tower hourly lets the item index safely stay on its nightly schedule.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Joint (cross-attention) scoring is most accurate but impossible at retrieval scale:** scoring every user against every item is O(all items)/query — 10M items × 1000 users/s = 10B joint forward passes/second, an overnight warehouse job, not real-time retrieval.`,
      `**Two-tower: encode separately, compare via u·v.** Item embeddings are query-independent → precompute + ANN-index once; query time = encode user + lookup, ~10ms/100M items.`,
      `**What you give up, and who restores it:** encoding the two sides apart loses fine user×item feature interactions — exactly what the joint model was good at. That job is handed downstream to the cross-attention *ranker*, which only scores the few hundred candidates retrieval already narrowed. Two-tower for recall, cross-encoder for precision.`,
      `**Training recipe = in-batch softmax + hard-negative mining:** other items in the batch serve as negatives; explicitly mining high-scoring-but-unclicked items forces fine distinctions. Random negatives are too easy — separating a clicked video from a random one gives near-zero gradient and teaches nothing subtle.`,
      `**Ops: ANN staleness scales with catalog volatility.** When item features change, the indexed embedding is stale. Fast-changing catalogs (price, inventory) need delta re-embedding of changed items; stable catalogs tolerate weekly full rebuilds. Staleness is a continuous freshness-vs-cost tradeoff, not a corner case.`,
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
    interactiveId: 'neighbor_explosion_viz',
    interactivePrompt: 'Semantic search is nearest-neighbor over embeddings — turn the knob and see the recall–latency tradeoff of scanning more neighbors.',
    title: 'Semantic Search & Embeddings',
    subtitle: 'Bi-encoder vs cross-encoder, ANN indexes: HNSW / IVF',
    difficulty: 'advanced',
    estimatedMin: 22,
    tags: ['semantic search', 'HNSW', 'IVF', 'embeddings', 'retrieval'],
    summary: `Keyword search breaks the moment the user's words don't match the document's. "heart attack symptoms" misses a page that says "myocardial infarction presentation" — same meaning, zero shared tokens, and BM25 has no idea. Semantic search maps queries and documents into an embedding space where *meaning* decides similarity.

[FIGURE: encoders]

---

**Solving vocabulary creates a scale problem.** The most accurate comparison is a **cross-encoder** — feed query and document in together so the model weighs every interaction. But it reruns per query-document pair, so it can't exceed a few hundred documents per query. Useless over 50M docs. The **bi-encoder** (two-tower) encodes each side separately: slightly less precise, but document embeddings are query-independent, so precompute them offline and retrieve with ANN (Approximate Nearest Neighbor) over billions in milliseconds.

---

**Production uses both, in sequence.** Bi-encoder retrieves the top few hundred from millions (fast); cross-encoder re-ranks just those hundreds (slow but precise, where the cost is affordable). Each does the job the other can't — the same recall-then-precision split as RecSys.

---

**The encoder's pretraining objective decides whether its embeddings are usable.** Raw BERT (trained with masked-LM) makes poor similarity embeddings; SBERT adds pooling + contrastive fine-tuning, and modern encoders (E5, BGE) trained with hard negatives push recall much higher — measured as recall@K, the fraction of queries whose correct document lands in the top K results returned. And every ANN index has a recall-vs-latency knob: HNSW's ef_search sets how many candidates stay in the search frontier during graph traversal (bigger ef_search = more of the graph explored = higher recall, higher latency), while IVF's nprobe sets how many inverted-list clusters get scanned per query (more clusters probed = more of the data actually checked = higher recall, higher latency). That knob must be calibrated on tail queries, not benchmarks — a 15ms P99 met on head queries will break on the tail.`,
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
          `A) Run a cross-encoder over all 50M items in parallel on a very large GPU cluster for maximum precision, skipping the retrieval stage entirely.`,
          `B) Bi-encoder embeddings in an HNSW index (ef_search≈100, ~2ms), then cross-encoder re-rank of the top 50 on GPU (~10ms) — ~12ms total.`,
          `C) BM25 keyword retrieval for raw speed, paired with a cross-encoder re-ranker to recover semantic matches BM25 missed.`,
          `D) A single bi-encoder using exact brute-force nearest-neighbor search, to guarantee full recall without any approximation.`,
        ],
        answer: `B`,
      },
      {
        q: `A team uses raw \`bert-base-uncased\` [CLS] embeddings for semantic retrieval and gets poor recall. Why, and what's the minimal fix?`,
        options: [
          `A) BERT embeddings are simply too high-dimensional here; applying PCA down to 128 dimensions should make recall recover fully.`,
          `B) BERT was pretrained with masked-LM, not a similarity objective, so embeddings don't cluster by meaning; fine-tune with contrastive pretraining.`,
          `C) [CLS] pooling is the only real issue here; switching to a max-pooling scheme over tokens makes raw BERT work perfectly fine for retrieval overall.`,
          `D) The index itself is the problem, not the encoder; switching FAISS-IVF over to HNSW alone should make recall recover fully.`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two correct statements about why an HNSW index meets P99 in load tests but violates it for a minority of production queries.`,
        options: [
          `A) ef_search was tuned on head queries; rare tail queries need deeper graph traversal to reach the same recall, exceeding budget.`,
          `B) Calibrating the operating point on a stratified sample that includes tail queries — or explicitly capping ef_search — addresses the gap.`,
          `C) HNSW is fundamentally non-deterministic, so the latency spikes are random noise that switching to IVF alone eliminates.`,
          `D) Production embeddings quietly use a different float precision than the offline load test, which is unrelated to query type.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    recap: [
      `**Keyword (BM25) breaks on vocabulary mismatch; embeddings match on meaning:** "heart attack symptoms" misses "myocardial infarction presentation" — same meaning, zero shared tokens. Semantic search maps queries and documents into a space where meaning, not token overlap, decides similarity.`,
      `**Cross-encoder vs bi-encoder is forced by scale, not preference:** a cross-encoder feeds query and document in together (most accurate) but reruns per query-document pair → O(N)/query, so it caps at a few hundred docs = re-ranking only. A bi-encoder (two-tower) encodes each side separately (slightly less precise) so document embeddings are query-independent → precompute offline + ANN over billions = retrieval.`,
      `**Production uses both in sequence:** bi-encoder retrieves the top few hundred from millions (fast), cross-encoder re-ranks just those hundreds (slow but precise, where the cost is affordable). The same recall-then-precision split as RecSys.`,
      `**Embedding quality is set by the pretraining objective:** raw BERT trained with masked-LM makes poor similarity embeddings that don't cluster by meaning; SBERT adds pooling + contrastive fine-tuning, and E5/BGE trained with hard negatives push recall much higher. Don't reach for raw \`bert-base\` and expect recall.`,
      `**Every ANN index has a recall-vs-latency knob:** HNSW's ef_search controls how many candidates stay in the search frontier during graph traversal (bigger = more explored = higher recall, higher latency); IVF's nprobe controls how many inverted-list clusters get scanned per query (more probed = higher recall, higher latency). Calibrate it on *tail* queries, not benchmarks. A 15ms P99 met on head queries breaks on the tail, because rare/poorly-covered queries need deeper traversal to reach the same recall.`,
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

**Every head must be calibrated, not just correctly ranked, or the sum lies.** The value model adds the heads together as if each pᵢ were a real probability on the same 0–1 scale. Say the true click probability for an item is p(click) = 0.1, but the click head is uncalibrated and outputs 0.2 — that head's contribution to the value score is now double what it should be, silently outweighing a correctly-calibrated dwell head standing right next to it in the same sum. A head can have perfect ranking accuracy (it sorts items in the right order) and still wreck the value model this way, because ranking accuracy only cares about order, not the actual magnitude of the probability.

---

**Guardrails ride in the same score.** Harm signals (report, "see fewer", hide) enter the value model as *negative* weights, so harmful-but-clicky content is demoted at ranking time rather than filtered after the fact.`,
    interactivePrompt: `Before you touch the controls: predict what happens to the report-rate of the top-3 items as you push the CTR weight up and the report penalty toward zero — and why no single weight vector wins every objective.`,
    keyPoints: [
      `**Multi-task ≠ multi-objective. The model predicts multiple heads; the value model combines them.** Keep them separate conceptually: the heads are learned (p(click), p(dwell), …); the combination weights are chosen to encode business value and tuned online.`,
      `**Shared-bottom is cheap but suffers negative transfer when tasks conflict; MMoE's per-task gates route conflicting tasks to different experts.** Symptom of negative transfer: adding a task *lowers* another task's metric versus training it alone. MMoE (or PLE — Progressive Layered Extraction, a variant that stacks shared and task-specific expert layers instead of MMoE's single shared layer) is the standard fix at scale.`,
      `**Value-model weights are tuned online, not offline.** Offline loss can't see long-term retention or harm. Weights are calibrated by A/B tests against a north-star metric — which is why every prediction head must be *calibrated* (a probability, not just a rank score) for the weighted sum to be meaningful.`,
    ],
    takeaway: `Staff-level ranking predicts several calibrated outcomes with a multi-task model (MMoE routes conflicting tasks to separate experts) and fuses them with a value model whose weights are a business decision tuned by online A/B tests — with harm signals entering as negative weights so guardrails live inside the ranking score.`,
    checkQuestions: [
      {
        q: `A shared-bottom model jointly trains click and dwell heads. Adding the click task *lowers* dwell-head accuracy versus training dwell alone. What's happening and what's the standard fix?`,
        options: [
          `A) Overfitting — the added click task brings extra parameters; adding dropout specifically to the dwell head fixes it.`,
          `B) Negative transfer — click and dwell conflict, pulling the shared trunk in opposing directions. MMoE routes conflicting tasks to separate experts.`,
          `C) Label leakage from the click signal seeping directly into dwell labels; removing all click-derived features from the dwell head resolves it completely.`,
          `D) A learning-rate mismatch between heads; giving each head its own optimizer makes the conflict disappear entirely.`,
        ],
        answer: `B`,
      },
      {
        q: `Why must each prediction head be *calibrated* before the value model combines them as w₁·p₁ + w₂·p₂ + …?`,
        options: [
          `A) Calibration only matters for the primary click head; every other head is free to output uncalibrated raw rank scores.`,
          `B) The weighted sum treats each pᵢ as a real probability; an inflated head (say, 2× true probability) silently doubles its effective weight.`,
          `C) Uncalibrated heads cause numerical NaNs to silently appear inside the weighted dot product computation during standard GPU inference passes.`,
          `D) Calibration isn't required at all — sorting by the weighted sum is mathematically invariant to any per-head scaling.`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two correct statements about how value-model weights (click, dwell, share, report) should be set.`,
        options: [
          `A) They should be treated as a product decision, tuned via online A/B tests against a north-star metric like 30-day retention.`,
          `B) Offline click loss alone can't see long-term value or harm, so grid-searching a ranking metric like NDCG (Normalized Discounted Cumulative Gain, an offline ranking-quality score) on the click label alone isn't sufficient.`,
          `C) Fitting them by minimizing offline cross-entropy on historical logs is sufficient, since the logs already encode the true optimum.`,
          `D) Setting the report weight to the exact negative of the click weight and leaving the rest at 1.0 gives the optimum by symmetry.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    recap: [
      `**Real feeds rank by a value model, not one metric:** "rank by engagement" is not a design; "rank by 1.0·p(click) + 1.2·p(dwell) + 0.5·p(share) − 3.0·p(report)" is. A staff-level ranker predicts several outcomes, then the value model combines them into the single score that decides order.`,
      `**Multi-task ≠ multi-objective — keep them separate:** the *multi-task model* learns multiple heads (p(click), p(dwell), p(share), p(report)); the *value model* is the weighted combination of those heads. Heads are learned; combination weights are chosen.`,
      `**Shared-bottom is cheap but negative-transfers when tasks conflict:** one trunk feeding all heads gets pulled in opposite directions (clickbait maximizes clicks but minimizes dwell), so every task suffers. Tell of negative transfer: adding a task *lowers* another's metric vs training it alone. **MMoE/PLE** (PLE = Progressive Layered Extraction, a variant that stacks shared and task-specific expert layers on top of MMoE's single shared layer) fixes it — several expert sub-networks with per-task gates that route conflicting tasks to different experts.`,
      `**Value-model weights are a business decision, tuned online, not a learned parameter:** they encode what a share is worth vs a click, how hard to penalize a report — and no weight vector maxes every objective (pushing CTR up promotes clickbait). Tune them by online A/B against a north-star (long-term retention), not offline loss.`,
      `**Heads must be calibrated or the weights lie:** the weighted sum treats each pᵢ as a real probability with comparable scale — an uncalibrated head that outputs 2× true probability has its effective weight doubled. **Guardrails ride the same score as negative weights** on harm signals (report, "see fewer", hide), so harmful-but-clicky content is demoted at ranking time, not filtered after.`,
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
      `**The feature store solves coordination: features computed once, registered, consumed with point-in-time correctness.** Without it, each team reinvents features with subtle divergences (nulls, timezones, windows), and training-serving skew appears when models ship. Debugging skew across three implementations is a week of engineering per incident. Point-in-time correctness also blocks a specific failure mode: a training row for event time t must only be enriched with feature values computed by t — a feature computed after t (for example, a 7-day aggregate that includes days after the label) leaks future information into training and inflates offline metrics.`,
      `**A model registry with versioning and lineage is what makes rollback one API call.** It links the deployed model to its training run, data, and eval metrics. The first production degradation without a registry turns into a multi-day investigation.`,
      `**Build the platform at ~5–10 models across teams, not before.** For 1–2 models, MLflow/W&B + FastAPI + git-versioned SQL features + manual dashboards is simpler and faster. Premature platform-building is abstraction with no users to amortize it.`,
    ],
    takeaway: `An ML platform is a coordination technology, not a modeling one: the feature store kills training-serving skew by making each feature a single point-in-time-correct definition, and the registry makes rollback one call — but both only amortize past roughly 5–10 models, so building them for the first model is premature abstraction.`,
    checkQuestions: [
      {
        q: `Select the two correct statements about whether a 3-data-scientist startup shipping its first model should build a full ML platform now.`,
        options: [
          `A) Not yet — MLflow/W&B tracking plus FastAPI + Docker serving and git-versioned SQL features cover this stage well.`,
          `B) Platform infra amortizes past roughly 5–10 production models, or once a large share of engineering time goes to tooling.`,
          `C) A feature store must be built before any model exists, because retrofitting it later is provably impossible.`,
          `D) A model registry and full serving infra are mandatory for any production deployment, regardless of team size.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `What specific failure does point-in-time correctness in a feature store prevent?`,
        options: [
          `A) Model overfitting caused specifically by having too many correlated features present in the training set.`,
          `B) Label leakage from the future: a training row for event time t gets enriched with feature values computed after t, inflating offline metrics.`,
          `C) Slow feature retrieval at serving time, caused specifically by unindexed lookups against a poorly-configured, legacy online feature store deployment.`,
          `D) Embedding staleness inside the ANN retrieval index, unrelated to how the feature-store joins are performed.`,
        ],
        answer: `B`,
      },
      {
        q: `A production model's quality silently dropped last night. With a model registry + lineage, what does the response look like versus without one?`,
        options: [
          `A) Identical either way — the registry only stores artifacts and doesn't help diagnose or roll back a live regression.`,
          `B) With a registry you compare the served version to the previous one and roll back with one call; without it, you manually hunt for the last-good artifact.`,
          `C) Without a registry it's actually faster overall, because engineers are forced to fix forward instead of wasting time rolling anything back.`,
          `D) The registry only matters for compliance audits and internal paperwork trails, not for actual live production incident response or postmortem write-ups either.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**The problem a platform fixes is coordination, not modeling:** N teams each reimplement "user purchase history" in Spark, Python, SQL with subtly different null-handling and timezone logic — so their models see *different* values for the "same" feature at training time, drift further apart at serving, and each team debugs its own copy of one problem.`,
      `**The feature store makes the feature the shared thing:** computed once, registered centrally, consumed by any model. Training pulls point-in-time-correct history; serving pulls the identical computation at low latency — one definition, one source of truth, no three-way skew. Point-in-time joins specifically prevent future-leakage (a 7-day aggregate that includes days after the label).`,
      `**A model registry with versioning + lineage makes rollback one API call:** it links the deployed model to its training run, data, and eval metrics. Without it, the first production degradation becomes a multi-day manual hunt for the last-good artifact.`,
      `**It only amortizes past ~5–10 models across teams:** for 1–2 models and a couple of data scientists, MLflow/W&B + FastAPI + Docker + git-versioned SQL features + manual dashboards is genuinely simpler and faster.`,
      `**The classic failure is building the platform before any model ships** — abstraction with no users to amortize it. The skill is knowing which side of the break-even line you're on.`,
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
    summary: `A trap that catches almost everyone: training a classifier to predict relevance and sorting by its score is *not* the same as training a ranker. A classifier tuned for per-item accuracy can achieve low average error across all items and still order them wrong — because ranking is *relative*. What matters is which item beats which, not the exact number on each.

[FIGURE: ltr]

---

**Three ways to train for order.** *Pointwise* scores each item alone and misses the relative point. *Pairwise* learns "A should rank above B" — fixes pairs but treats a swap at rank 1 the same as a swap at rank 100. *Listwise* optimizes the whole list, which is what you want, but it's expensive and sensitive to label noise. For tabular ranking (web search, ads) the practical winner is **LambdaMART**: gradient-boosted trees whose gradients are weighted by NDCG impact, so a swap near the top gets a far bigger push than one near the bottom — a ranking-aware signal without needing NDCG to be differentiable (it isn't).

---

**The deeper problem none of these fixes alone: position bias.** Click data is contaminated by *where* items were shown. Position 1 collects clicks whether or not it deserved them, so training on raw clicks teaches the model to reproduce position effects — a self-reinforcing loop where it keeps promoting whatever the last model promoted. Breaking it needs inverse-propensity weighting: weight each example by 1/P(click|position), so position-1 examples count less and position-5 examples count more.`,
    keyPoints: [
      `**LambdaMART is the tabular workhorse: GBM with gradients weighted by NDCG impact.** Each item's gradient sums LambdaRank pair-gradients weighted by how much swapping the pair changes NDCG. A rank-1-vs-2 swap gets a much larger gradient than rank-98-vs-99 — NDCG-aware training without a differentiable NDCG.`,
      `**Position bias is a correctness bug that loss choice alone can't fix.** Position 1 gets ~10× the clicks of position 10 regardless of relevance — because users scan top-down and rarely look past the first few results, so top slots accumulate clicks from visibility alone, not just quality; raw-click training reproduces the prior model's ranking. Inverse-propensity weighting (1/P(click|position)) plus occasional randomization recovers unbiased relevance.`,
      `**Online distillation decouples quality from serving latency.** A large teacher with expensive features (cross-attention, full history) trains offline; a small student matches its rankings without those features and serves fast. The standard pattern when the most accurate model is too slow to serve directly — but the student only learned to imitate the teacher on the queries it was trained on, so as live traffic drifts from that training distribution, the student's imitation quality degrades even though it still matches the teacher on held-out data (distribution shift between training and serving).`,
    ],
    takeaway: `Ranking is a relative problem, so you train for order (LambdaMART weights each gradient by NDCG impact) not for per-item accuracy — but click-trained rankers also inherit position bias, which only inverse-propensity weighting (not a better loss) removes.`,
    checkQuestions: [
      {
        q: `A classifier achieves high average accuracy on its relevance-score predictions across all items, yet its ranking is worse than a pairwise model with less accurate scores. How is that possible?`,
        options: [
          `A) It isn't possible — high average accuracy across all items mathematically guarantees a correct final ordering.`,
          `B) A classifier spends capacity getting easy items' absolute scores right and can misorder the few hard, high-value pairs near the top.`,
          `C) The classifier's raw scores need an additional softmax normalization step before sorting; without that step the resulting order is arbitrary.`,
          `D) Only if the classifier is uncalibrated — calibrating it would make its ranking exactly match the pairwise model's.`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two correct statements about why LambdaMART weights each pairwise gradient by |ΔNDCG| instead of optimizing NDCG directly.`,
        options: [
          `A) NDCG is piecewise-constant with zero gradient almost everywhere, so it can't be optimized directly by gradient descent.`,
          `B) Weighting each pair's gradient by |ΔNDCG| injects the ranking-position signal into a well-defined gradient the GBM can follow.`,
          `C) |ΔNDCG| weighting is mathematically equivalent to adding L2 regularization on the underlying trees.`,
          `D) Direct NDCG optimization requires full listwise relevance labels, which the |ΔNDCG| scheme supplies automatically.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You deploy an online-distilled student ranker. It matches the teacher on held-out ranking but underperforms in production. What's the most likely cause tied to distillation?`,
        options: [
          `A) The student simply has fewer parameters and is therefore underfit; enlarging it all the way to the teacher's full size resolves this completely.`,
          `B) Distribution shift: the student only mimics the teacher where it was trained, so drifting live queries degrade its imitation quality.`,
          `C) Distillation always loses precisely the teacher's top-1 accuracy on every deployment, by mathematical construction.`,
          `D) The student can't use the teacher's expensive features at serving time, so it must be fed those same features anyway.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Sorting a classifier ≠ training a ranker:** ranking is *relative* — what matters is which item beats which, not the exact score on each. A classifier tuned for per-item accuracy can achieve low average error across all items and still misorder the few hard, high-value pairs near the top.`,
      `**Three ways to train for order, cost and fidelity rising together:** *pointwise* scores each item alone (misses the relative point); *pairwise* learns "A ranks above B" (fixes pairs but treats a rank-1 swap like a rank-100 swap); *listwise* optimizes the whole list (what you want, but expensive and label-noise sensitive).`,
      `**LambdaMART is the tabular workhorse:** gradient-boosted trees whose gradients are weighted by |ΔNDCG| — a swap near the top gets a far bigger push than one near the bottom, injecting a ranking-aware signal without needing NDCG to be differentiable (it's sorting-based, zero-gradient almost everywhere).`,
      `**Position bias is a correctness bug loss choice alone can't fix:** position 1 gets ~10× the clicks of position 10 regardless of relevance — top slots accumulate clicks from visibility alone since users scan top-down and rarely reach lower results — so raw-click training reproduces the prior model's ranking in a self-reinforcing loop. Break it with inverse-propensity weighting (weight each example by 1/P(click|position)) plus occasional randomization — not a better loss.`,
      `**Online distillation decouples quality from serving latency:** a large teacher with expensive features (cross-attention, full history) trains offline; a small student matches its rankings without those features and serves fast. The standard pattern when the most accurate model is too slow — watch for train/serve distribution shift as live traffic drifts from the distillation set.`,
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
    id: 'cold_start_system_design',
    title: 'Cold-Start Strategies',
    subtitle: 'New user, new item, new platform — bootstrapping without interaction history',
    difficulty: 'intermediate',
    estimatedMin: 22,
    tags: ['cold start', 'RecSys', 'exploration', 'content-based'],
    summary: `Collaborative filtering learns from interactions — so it has nothing to say about a user who just signed up or an item posted a minute ago. Cold start is the systematic failure mode of every recommender, and interviewers probe it because the naive design silently serves garbage to exactly the users and creators you most want to keep.

[FIGURE: coldstart]

---

**Three distinct cold-start problems, three different fixes.** *New user:* no history → fall back to context (device, geo, time), onboarding signals (a quick interest picker), and demographic/popularity priors, then update a real-time embedding fast from the first interactions. *New item:* no interactions → lean on content features (text, image, audio, creator) via a content-based or two-tower model that embeds items from features alone, so a brand-new item lands near similar known items. *New platform:* no data at all, for any user or item → run the New-user and New-item playbooks simultaneously across the whole catalog until enough interactions accrue to bootstrap collaborative signal (the flywheel's ignition problem).

---

**Exploration is the engine that ends cold start.** A pure-exploitation system never shows the new item enough to learn whether it's good — so you must deliberately allocate impressions to under-explored items (ε-greedy, UCB, or Thompson sampling on the value estimate). The cost is real: exploration spends some engagement now to buy the signal that makes future ranking possible. Framed as a bandit, cold start *is* the exploration-exploitation tradeoff.`,
    keyPoints: [
      `**"Cold start" is three problems — new user, new item, new platform — with different fixes.** New user → context + onboarding + popularity prior, fast embedding update. New item → content features so it embeds without interactions. New platform → content-based until the flywheel ignites.`,
      `**Content-based models are the bridge because they embed from features, not interactions.** A two-tower item tower fed text/image/creator features can place a never-seen item in embedding space immediately — the single most important architectural choice for item cold start.`,
      `**Exploration is mandatory, and it's a measurable cost.** Under-explored items never accumulate signal under pure exploitation. Allocate impressions via ε-greedy/UCB/Thompson; budget the short-term engagement you spend to gain long-term catalog coverage.`,
    ],
    takeaway: `Cold start is three separate problems (new user / new item / new platform) unified by one cause — no interaction history — and solved by two levers: content-based embeddings that represent entities from features alone, and deliberate exploration that spends present engagement to buy the signal collaborative filtering needs.`,
    checkQuestions: [
      {
        q: `Select the two correct elements of a fix for new video uploads getting almost no impressions (item cold start).`,
        options: [
          `A) Embed new items from content features (title, transcript, thumbnail, creator) via a two-tower item tower, before any interactions exist.`,
          `B) Pair the content-based embedding with a guaranteed exploration budget so new items receive a minimum impression allocation.`,
          `C) Lower the retrieval recall threshold globally so a larger share of all items — new and old alike — passes through into ranking.`,
          `D) Retrain the collaborative-filtering model hourly instead of daily, so new items surface sooner via the same interaction signal.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why does a pure-exploitation recommender never solve item cold start on its own, regardless of model quality?`,
        options: [
          `A) It does eventually solve it, just slowly, as the model periodically retrains on whatever fresh data trickles in.`,
          `B) A new item has uncertain/low predicted engagement, so pure exploitation never shows it — a chicken-and-egg loop only exploration breaks.`,
          `C) Because exploitation increases per-request inference latency, which crowds out new items from being scored at all.`,
          `D) Because collaborative filtering mathematically and provably assigns every brand-new item a score of exactly zero, forever, by strict definition.`,
        ],
        answer: `B`,
      },
      {
        q: `For a brand-new user with zero history, which combination is the sound first-session strategy?`,
        options: [
          `A) Show a fixed globally-popular list to every new user, and wait until session two before attempting personalization.`,
          `B) Combine context signals, an onboarding interest picker, and a popularity prior, while rapidly updating a real-time embedding within the session.`,
          `C) Require every new user to link an external social account so their prior interest history can be fully imported before serving them anything at all.`,
          `D) Train a fresh per-user model online completely from scratch during the very first session, with no priors.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Cold start = the systematic failure of every recommender when there's no interaction history** — collaborative filtering learns from interactions, so it has nothing to say about a just-signed-up user or a minute-old item. The naive design silently serves garbage to exactly the users and creators you most want to keep.`,
      `**New user (no history):** fall back to context (device, geo, time), onboarding signals (a quick interest picker), and demographic/popularity priors, then rapidly update a real-time user embedding from the first few interactions within the session.`,
      `**New item (no interactions):** lean on content features (text, image, audio, creator) via a content-based or two-tower item tower that embeds from features alone — so a brand-new item lands near similar known items and is retrievable before any interaction. This is the single most important architectural choice for item cold start.`,
      `**New platform (no data at all):** every user and every item is cold on day one, so the New-user and New-item playbooks above run simultaneously across the whole catalog, until enough interactions accrue to bootstrap collaborative signal — the flywheel's ignition problem.`,
      `**Exploration is the engine that ends cold start, and it's a measurable cost:** pure exploitation never shows a new item enough to learn if it's good, so deliberately allocate impressions (ε-greedy/UCB/Thompson) — spending some engagement now to buy the signal future ranking needs. Framed as a bandit, cold start *is* the explore/exploit tradeoff.`,
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

**Counterfactual (off-policy) evaluation lets you estimate a new ranker's online performance from logged data, before serving it.** Because logs were collected under the *old* policy, you reweight by inverse propensity (how likely the old policy was to show each item — an item the old policy showed only 5% of the time gets its logged outcome weighted ×20, since 1/0.05 = 20) to estimate what the *new* policy would have earned. It's how you kill bad candidates before they ever touch live traffic.`,
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
          `A) Nothing breaks — expected value only ever needs correct relative ordering of pCTR, which the model still has.`,
          `B) Overconfidence inflates expected value non-uniformly across items; calibrate pCTR with Platt or isotonic scaling on held-out data.`,
          `C) It's actually the bid that needs calibration, not the pCTR; normalizing every single bid value into the [0,1] range fixes it instead completely.`,
          `D) Switch entirely from ranking by pCTR×bid to ranking by pCTR alone, which sidesteps the calibration requirement.`,
        ],
        answer: `B`,
      },
      {
        q: `Select the two correct statements about an A/B test that lifts engagement 2% (stat-sig) but raises the harmful-content report rate 15%.`,
        options: [
          `A) The report-rate guardrail exists specifically to protect users, and a 15% regression is a hard veto regardless of the engagement win.`,
          `B) The right response is to not ship on the primary metric alone — investigate what the change promoted before shipping.`,
          `C) Ship it as-is — the primary metric is the stated objective and it won with statistical significance, which settles the decision.`,
          `D) Guardrail metrics are purely advisory context in every experiment and were never designed to actually block a launch.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You want to estimate a new ranker's online CTR from logs collected under the current ranker, before any live test. Which approach is valid and what's its main risk?`,
        options: [
          `A) Just compute the new ranker's average predicted CTR directly on the logs — treat that number as its online CTR.`,
          `B) Inverse-propensity weighting: reweight impressions by 1/P(shown|old policy); main risk is high variance when policies diverge.`,
          `C) Retrain the new ranker on the same logs and simply report its resulting training accuracy as the online estimate.`,
          `D) Compare offline NDCG of both rankers computed directly on the logs; whichever has higher NDCG is guaranteed to win the online test.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**"Order-only" breaks the moment the score becomes a number:** the second it feeds an ad auction (expected value = pCTR × bid), a value model (weighted sum of heads), or a threshold ("auto-approve if fraud prob < 0.01"), the *magnitude* matters, not just the order. An uncalibrated 0.9 that's really 0.6 systematically overbids, mis-weights, and mis-thresholds.`,
      `**Calibration means the number is a probability:** of all items scored 0.7, about 70% should be positive. Measure it with a reliability diagram and Expected Calibration Error; fix it with Platt scaling or isotonic regression on a held-out set. Deep rankers are systematically overconfident, so calibration is a required post-processing step whenever the score is consumed as a probability.`,
      `**Guardrail metrics are the veto, not the goal:** you *optimize* engagement but *guard* the metrics that must not regress — latency, harmful-content rate, creator diversity, complaint rate. A launch that lifts engagement 2% but raises the report rate 15% should not ship, no matter how the primary metric looks.`,
      `**Counterfactual (off-policy) evaluation estimates online lift from logs before serving:** because logs were collected under the *old* policy, reweight each outcome by inverse propensity (1/P(old policy showed this item)) to estimate what the *new* policy would have earned — the tool for killing bad rankers before they touch live traffic.`,
      `**IPW's failure mode is variance:** when the new policy diverges far from the logged one, rarely-shown actions get huge 1/P weights and a single record dominates. Clipped or doubly-robust estimators tame it — but extreme propensities still force a real A/B test.`,
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
    interactivePrompt: `Before you touch the controls: turn off async fan-out for four feature sources. With the sliders at their defaults, predict whether the total (features + inference + network + serialization) still crosses the 50ms SLA once everything is summed — and why parallel fetch is the difference between paying the max and paying the sum.`,
    keyPoints: [
      `**The latency budget is a hard per-component allocation set before deployment.** A 50ms fraud budget: features 5–10ms, inference 10–20ms, network 2–5ms, serialization 1–2ms. If inference alone eats 40ms, there's no room for features. Profile end-to-end in production, measured at P99 (the 99th-percentile latency — the slow-tail request that determines whether the SLA is actually met, not the average): a typical fraud-scoring trace splits like 27ms of feature-store round-trips against 9ms of inference out of a 40ms total, which is why the bottleneck is usually feature retrieval, not inference.`,
      `**Async fan-out turns a sum into a max.** Four 8ms features cost 8ms in parallel, 32ms in serial. Every multi-source system must fan out and time out (slow source → default value, not a blocked request).`,
      `**A predefined fallback + circuit breaker is mandatory.** Without it, engineers improvise under incident pressure and make it worse. Define the degraded response (popularity/rule/cache) and trip to it automatically when error rate spikes.`,
    ],
    takeaway: `Real-time ML is latency budgeting in milliseconds: accuracy and latency trade off continuously, async fan-out converts feature-fetch cost from a sum to a max, and a predefined fallback behind a circuit breaker is what keeps the system answering when the model can't — with the budget made explicit so accuracy and serving teams don't each optimize half.`,
    checkQuestions: [
      {
        q: `Select the two correct parts of the fix when a fraud model has 150ms P99 against a 50ms SLA.`,
        options: [
          `A) Profile to attribute the 150ms across features, inference, and network before changing anything else.`,
          `B) Cache precomputed feature aggregates so serving is a lookup, and fetch the remaining live features with async parallel calls plus per-source timeouts instead of serial round-trips.`,
          `C) Move fraud scoring entirely to a nightly batch job and use yesterday's risk score at transaction time.`,
          `D) Add a request queue and process fraud checks strictly sequentially to remove concurrency spikes.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Four feature sources each take 8ms. Your service fetches them one after another and blames the model for a 40ms+ latency. What's the actual problem?`,
        options: [
          `A) The model itself is genuinely too slow; the correct fix is quantizing its weights down to INT8 precision.`,
          `B) Serial fetch pays the sum (4×8=32ms) instead of the max; async fan-out with per-request timeouts drops it to ~8ms.`,
          `C) 8ms per feature lookup is simply impossible at this scale; the feature store must be badly misconfigured somewhere.`,
          `D) Reduce down to a single feature source entirely to cut latency, accepting whatever accuracy loss results.`,
        ],
        answer: `B`,
      },
      {
        q: `Why is a documented fallback + circuit breaker considered part of the *design*, not an ops afterthought?`,
        options: [
          `A) It's genuinely an ops-only concern; the design is considered done once the model meets the SLA in load tests.`,
          `B) The availability contract depends on it: the degraded-response choice determines what users see, and a circuit breaker automates the switch.`,
          `C) Because a documented fallback improves the model's offline accuracy metrics reported during the full evaluation and benchmarking phase cycle.`,
          `D) Because regulators require a fallback flowchart to be included in the written design document before launch.`,
        ],
        answer: `B`,
      },
    ],
    recap: [
      `**Real-time ML has one hard constraint batch never faces:** the prediction must arrive before the user's patience runs out. A fraud model answering in 500ms is useless when the transaction clears in 200ms; a 2-second recommender has already lost the session.`,
      `**Budget milliseconds like money, not vibes:** everything that makes the model better (more features, more layers) makes it slower, so design in numbers — "this adds 15ms, the SLA is 50ms, so 35ms is left." A 50ms fraud budget: features 5–10ms, inference 10–20ms, network 2–5ms, serialization 1–2ms. Profile end-to-end in production at P99 (the 99th-percentile latency, not the average) — a typical trace splits like 27ms of feature-store round-trips against 9ms of inference out of a 40ms total, which is why the bottleneck is usually feature retrieval, not inference.`,
      `**Async fan-out turns a sum into a max:** issue all feature-store requests in parallel and wait for the *max*, not the *sum* — four 8ms features cost 8ms in parallel, 32ms in serial. Pair each with a timeout that returns a default rather than blocking past the SLA.`,
      `**Precompute and cache what you can:** stream user aggregates into a cache so serving is a lookup plus a light adjustment, not a heavy recompute.`,
      `**Fallback + circuit breaker are design, not ops:** every real-time system needs a documented answer to "what happens when the model endpoint is slow or down" — a popularity response, rule-based score, or last cached prediction, behind a circuit breaker that trips automatically when error rate crosses a threshold. Define it before the incident, and make the budget explicit so accuracy and serving teams don't each optimize only half.`,
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
    interactivePrompt: 'This is the same self-attention math SASRec runs over a session: pick a token to set its query, then watch it score against every other position\'s key. Toggle the causal mask for GPT-style (look only backward) vs BERT-style (look both ways) attention, and toggle ÷√d to see why unscaled dot products saturate the softmax. SASRec applies this exact mechanism to session items instead of words, so a later item can attend directly back to an early one instead of the signal decaying through a GRU\'s hidden state.',
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
          `A) The embedding dimension is too small to hold both the running-gear and blender interests at once; increasing it fixes this.`,
          `B) The model aggregates history into an order-less profile, missing the in-session trajectory; a sequential encoder fixes it.`,
          `C) The blender category is simply over-sampled during training; down-weighting it lets the running items naturally win.`,
          `D) The ANN index has gone stale and keeps returning yesterday's candidates; rebuilding it more frequently resolves it.`,
        ],
        answer: `B`,
      },
      {
        q: `On sessions averaging 60 events, a GRU4Rec model under-weights items from early in the session versus a SASRec model. Why does self-attention help here?`,
        options: [
          `A) Self-attention simply uses many more trainable parameters overall, so it can better memorize longer sessions purely by brute force alone.`,
          `B) SASRec actually ignores item order entirely, and that happens to coincidentally help it on very long sessions.`,
          `C) The GRU compresses history into one hidden state, so early items decay via vanishing gradients; attention preserves long-range signal.`,
          `D) GRUs are architecturally incapable of processing sessions longer than 32 events, silently truncating the earliest ones.`,
        ],
        answer: `C`,
      },
      {
        q: `Select the two correct statements about how the system correctly recommended a 5th cooking video despite a strong lifetime indie-film profile.`,
        options: [
          `A) The long-term profile and session encoder are concatenated into the ranker as separate signals, not merged destructively.`,
          `B) The in-session cooking-video state can outweigh the lifetime indie-film profile for the next slot without the profile itself being deleted.`,
          `C) The model retrained online on just the 4 cooking videos, permanently and irreversibly overwriting the indie-film profile.`,
          `D) A hard-coded business rule forces cooking-video recommendations after any 3 consecutive cooking-video views in a row.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    recap: [
      `**Order carries intent that a bag-of-items loses:** two-tower and matrix-factorization treat a user as a static bag — they know *what* you clicked but throw away order. [tent → sleeping bag → boots] is mid-mission and predicts a headlamp; the same three reshuffled tells a different story. Use sequential features when the *next action* depends on the *recent trajectory*.`,
      `**Session-based models predict the next item from the ordered history:** GRU4Rec runs a recurrent net carrying a hidden state that summarizes everything seen; SASRec / transformers4rec replaces recurrence with self-attention so each position can look back at any earlier item directly.`,
      `**Self-attention beats GRU on long sessions:** a GRU compresses the whole history into one recurrently-updated hidden state, so early items decay through vanishing gradients; self-attention lets position t attend directly to position 1, keeping early signal alive over a 50-event session.`,
      `**Fuse short-term (session) and long-term (profile) — neither alone is enough:** your long-term profile says "indie films," but 4 straight cooking videos means you want a fifth *now*. Concatenate both into the ranker so the in-session state can override lifetime taste for the next slot, without erasing the profile that survives for tomorrow.`,
      `**Sequence encoders are cheap enough for ranking, not just retrieval:** one self-attention layer at L=50, d=128 costs O(L²·d) ≈ 320k multiply-adds — sub-millisecond — so the encoded session becomes just another embedding the funnel already knows how to consume.`,
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
    summary: `Once retrieval is a dot product between a query embedding and every item embedding, the bottleneck is search, not the model. Exact nearest-neighbor over 100M vectors of dimension 256 is 100M·256 ≈ 25.6 billion multiply-adds per query — that's 51.2 billion FLOPs (each multiply-add counts as 2), and even a well-optimized multi-core CPU sustaining ~50 billion FLOP/s of dot-product throughput needs ≈1 second per query, ~100× over the 10ms budget, before counting the ~100GB of vectors (100M × 256 × 4 bytes) that would have to stream from memory on every query — hopeless in 10ms. Approximate nearest-neighbor (ANN) trades a sliver of recall for two-to-three orders of magnitude speedup.

---

**HNSW builds a navigable graph; IVF-PQ partitions and compresses.** HNSW (hierarchical navigable small world) links each vector to a few neighbors across layered graphs, so a query "greedily walks" from an entry point to its neighborhood in ~log(N) hops — very fast, very high recall, but the full float vectors sit in RAM (100M × 256 × 4 bytes ≈ 100GB). IVF-PQ instead clusters vectors into, say, 4096 cells (search only the nearest few), and product-quantizes each vector — splitting 256 dims into 32 sub-vectors, each mapped to one of 256 centroids — so a vector shrinks from 1024 bytes to 32 bytes, a 32× compression that fits 100M vectors in ~3GB.

---

**Recall and latency are one knob, turned at query time.** HNSW's \`efSearch\` (how many candidates to keep on the walk) and IVF's \`nprobe\` (how many cells to scan) both trade recall for latency continuously: nprobe=8 might hit 0.92 recall at 3ms, nprobe=64 hits 0.99 recall at 12ms. You don't pick "an index" — you pick an operating point on its recall–latency curve, and that point is a product decision (how many good candidates can the funnel afford to lose?).

[FIGURE: ann]

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
        q: `Select the two correct statements about indexing 200M 256-dim vectors with only 8GB RAM per serving node.`,
        options: [
          `A) IVF-PQ clusters vectors into cells and product-quantizes each one, shrinking memory footprint drastically (~6.4GB for 200M).`,
          `B) The recall loss from PQ's lossy quantization is generally acceptable at retrieval since the downstream ranker re-scores anyway.`,
          `C) Reducing the embedding dimension all the way down to 4 keeps recall high because low-dimensional spaces are easier to search.`,
          `D) Storing all vectors on disk and doing exact brute-force search per query is viable, since SSD read latency is negligible here.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Retrieval recall is 0.92 at nprobe=8 and 3ms. The latency budget allows 12ms and the ranker keeps missing relevant items. What's the correct single-knob change?`,
        options: [
          `A) Rebuild the index nightly instead of weekly — the real issue here is staleness, not the recall number itself.`,
          `B) Raise nprobe from 8 to 64 so more IVF cells are scanned, lifting recall toward ~0.99 within the 12ms budget.`,
          `C) Lower nprobe down to 2 to speed up the search further, freeing extra time for the ranker to compensate.`,
          `D) Switch from dot-product similarity to cosine similarity instead; recall improves automatically at no cost.`,
        ],
        answer: `B`,
      },
      {
        q: `A catalog adds and removes thousands of items per minute. Retrieval keeps returning deleted items and missing brand-new ones, even though HNSW recall benchmarks are excellent. What's the underlying issue?`,
        options: [
          `A) HNSW recall degrades sharply above roughly 10M vectors; sharding the index into smaller pieces resolves it.`,
          `B) efSearch is set too high, causing the graph walk to keep revisiting deleted nodes; simply lowering it fixes this.`,
          `C) Product quantization is silently corrupting only the newly-added vectors each cycle; disabling PQ entirely resolves the freshness problem.`,
          `D) HNSW graphs are costly to mutate, so a periodic rebuild goes stale between builds; fix with a small refreshed side index.`,
        ],
        answer: `D`,
      },
    ],
    recap: [
      `**Once retrieval is a dot product, the bottleneck is search, not the model:** exact NN over 100M vectors of dim 256 is 100M·256 ≈ 25.6B multiply-adds/query — hopeless in 10ms. ANN (approximate nearest-neighbor) trades a sliver of recall for 100–1000× speedup; it's not an optimization, it's the only way retrieval runs in real time.`,
      `**HNSW builds a navigable graph:** each vector links to a few neighbors across layered graphs, so a query greedily walks from an entry point to its neighborhood in ~log(N) hops — very fast, very high recall, but the full float vectors sit in RAM (100M × 256 × 4B ≈ 100GB).`,
      `**IVF-PQ partitions and compresses:** cluster vectors into ~4096 cells (search only the nearest few), and product-quantize each — splitting 256 dims into 32 sub-vectors, each mapped to one of 256 centroids — so a vector shrinks 1024B → 32B (32×), fitting 100M vectors in ~3GB, mildly lossy. Choose HNSW vs IVF-PQ by whether recall or RAM is the binding constraint.`,
      `**Recall and latency are one knob, turned at query time:** HNSW's efSearch and IVF's nprobe both trade recall for latency continuously (nprobe=8 → 0.92 recall at 3ms; nprobe=64 → 0.99 at 12ms). You don't pick "an index," you pick an operating point on its recall–latency curve — a product decision about how many good candidates the funnel can afford to lose.`,
      `**Build cost and quantization loss are the operational tax:** HNSW graphs are O(N·log N) to build and expensive to mutate, so high-churn catalogs use periodic rebuilds or a small "fresh" index searched alongside the main one. PQ's compression is lossy — acceptable at retrieval (the ranker re-scores anyway), never in the final ranker.`,
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

**DPP models diversity as volume, not pairwise patching.** A Determinantal Point Process assigns a set a probability proportional to the *determinant* of a kernel matrix built from item quality and similarity — geometrically, the squared volume the item vectors span. Redundant items are near-parallel vectors spanning near-zero volume, so DPP naturally down-weights whole redundant *sets*, not just adjacent pairs. It's the principled cousin of MMR. Concretely, using the same A/B/C items from the MMR example above: for the redundant set {A, B}, the 2×2 kernel L = [[0.9², 0.9·0.88·0.95], [0.9·0.88·0.95, 0.88²]] = [[0.81, 0.752], [0.752, 0.774]] has det(L) = 0.81·0.774 − 0.752² ≈ 0.061 — tiny, because A and B are near-parallel (0.95 similar). For the diverse set {A, C}, L = [[0.81, 0.9·0.80·0.2], [0.9·0.80·0.2, 0.64]] = [[0.81, 0.144], [0.144, 0.64]] has det(L) = 0.81·0.64 − 0.144² ≈ 0.498 — about 8× larger, because A and C actually span volume (only 0.2 similar). DPP assigns {A, C} far higher probability than {A, B}, the same call MMR made by picking C over B — but reached by comparing whole-set volumes instead of one pairwise penalty.

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
        q: `Select the two correct statements about why a feed's top-10 by ranker score can be 10 near-identical basketball clips.`,
        options: [
          `A) The ranker scores each item independently, so it structurally can't represent that item #2 adds little given item #1.`,
          `B) Redundancy is a set-level property; the fix is a re-ranking step like MMR or DPP that penalizes similarity to chosen items.`,
          `C) The ranker is overfit specifically to basketball content, and adding L2 regularization alone makes the duplicates disappear.`,
          `D) The candidates being shown are simply stale, so refreshing the retrieval stage alone resolves the diversity problem.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Using MMR with λ=0.7: item A has relevance 0.9; item B has relevance 0.88 but similarity 0.95 to the already-picked A; item C has relevance 0.80 and similarity 0.2 to A. Which is picked next and why?`,
        options: [
          `A) B — it has the higher raw relevance score (0.88 > 0.80), and MMR is defined to always prefer higher relevance.`,
          `B) C — its MMR score of 0.50 beats B's ≈0.33, because B's near-duplication of the already-picked A collapses its value.`,
          `C) A — it gets re-picked a second time here, since it still holds the single highest relevance score of the three items overall.`,
          `D) B and C tie exactly under MMR, so the ranker's original score order breaks the tie in B's favor instead.`,
        ],
        answer: `B`,
      },
      {
        q: `A platform wants to guarantee "no more than 2 posts from the same creator in the top 10" and give brand-new posts a visibility boost. Where do these belong and why?`,
        options: [
          `A) In re-ranking: the per-creator cap is a set-level constraint the ranker can't enforce, and the freshness boost counters under-scoring.`,
          `B) In the ranker's loss function as two extra penalty terms added directly, since it already scores every item.`,
          `C) In retrieval, by fetching at most 2 items per creator and restricting candidates to only recently-published items.`,
          `D) In the ANN index itself, by weighting creator identity and recency directly into every single item's embedding vector representation instead.`,
        ],
        answer: `A`,
      },
    ],
    recap: [
      `**The ranker scores each item independently, so the top-k by score is often a redundant set:** it answers "how good is this item for this user?" one at a time, with no notion that #2 adds nothing after #1 if they're near-duplicates. "Best 10 items" ≠ "best set of 10" — diversity is a *set* property the per-item ranker structurally cannot express, so it must be imposed after scoring.`,
      `**MMR trades relevance against redundancy greedily:** pick items one at a time to maximize λ·relevance(i) − (1−λ)·max-similarity(i, already-chosen). λ high → mostly follow the ranker; λ low → aggressively diversify. Concretely, a 0.88-relevance item that's 0.95-similar to an already-picked item collapses in marginal value, letting a less-similar 0.80 item leapfrog it. Cheap, tunable — the default production diversifier.`,
      `**DPP models diversity as spanned volume, not pairwise patching:** a Determinantal Point Process gives a set probability ∝ the determinant of a quality×similarity kernel = the squared volume the item vectors span. Redundant items are near-parallel vectors spanning ~0 volume, so DPP down-weights whole redundant *sets*, not just adjacent pairs — the principled cousin of MMR, at higher compute. Concretely, using the earlier A/B/C example: {A, C}'s kernel determinant (≈0.498) is about 8× {A, B}'s (≈0.061) — DPP prefers the diverse set for the same reason MMR does, just measured as spanned volume instead of a pairwise penalty.`,
      `**Freshness/exploration slots counter the ranker's under-scoring of new items:** thin engagement history makes an engagement-trained ranker systematically under-score fresh items (a cold-start feedback trap), so a freshness boost or explicit exploration slot in re-ranking counteracts it.`,
      `**Hard business rules are set-level, so they ride the same re-rank stage after scoring:** "no more than 2 items per creator in the top 10," quotas, "at least 1 from a followed account" — these constrain the *set*, which the per-item ranker cannot enforce, so they're applied post-scoring, not in the ranker.`,
    ],
    figures: {
      rerank: `<svg viewBox="0 0 360 124" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="14" fill="var(--ink-low)" font-size="7.5">ranker top-k (by score)</text>
  ${['🏀','🏀','🏀','🏀','🏀'].map((_, i) => '<rect x="' + (8 + i*30) + '" y="22" width="26" height="20" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/><text x="' + (21 + i*30) + '" y="36" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">B</text>').join('')}
  <text x="8" y="58" fill="var(--ink-low)" font-size="7.5">after MMR / DPP re-rank (diverse set)</text>
  ${[['B','var(--prime)'],['C','var(--amber)'],['B','var(--prime)'],['D','var(--rim)'],['C','var(--amber)']].map((s, i) => '<rect x="' + (8 + i*30) + '" y="66" width="26" height="20" rx="4" fill="var(--depth)" stroke="' + s[1] + '"/><text x="' + (21 + i*30) + '" y="80" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">' + s[0] + '</text>').join('')}
  <text x="8" y="102" fill="var(--ink-mid)" font-size="7">λ·relevance − (1−λ)·max-similarity-to-chosen · + freshness + business rules</text>
  <text x="8" y="116" fill="var(--ink-mid)" font-size="6.5">B = basketball (this module's running example) · C, D = other content categories · B repeats twice below, illustrating the "≤2 per creator" cap</text>
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

**Popularity self-reinforces into a rich-get-richer spiral.** A popular item is shown more → gets more clicks (partly *because* it was shown more, not because it's better) → the model reads those clicks as quality → shows it even more. An illustrative sketch, not a derived computation: item X and item Y are equally good, but X starts with 2× the exposure. X collects ~2× the clicks, the model scores it higher, so it gets even more exposure next round — no formula here fixes the exact multiple, it just keeps compounding cycle over cycle (a 2× exposure head start can plausibly become 3×, then 5×, and climbing) even though true quality never differed. The long tail starves.

---

**Exposure bias is the formal name; IPW is the standard correction.** Inverse-Propensity Weighting reweights each logged example by 1/P(shown) — an item shown 10% of the time counts 10× when it *is* clicked, an item shown 90% of the time counts ~1.1×. This mathematically un-does the exposure imbalance so the model estimates *relevance* rather than *what got shown*. IPW needs the logging propensities (the probability each item was shown), which is why serious systems log them, and it has high variance when propensities are tiny — so it's paired with randomization: a small fraction of traffic serves items uniformly (or ε-greedy: serve randomly with probability ε, otherwise serve the current best) to inject unbiased exposure the model can learn from.

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
          `A) Label noise — Y's click labels are simply noisier; collecting more data on Y should let the scores equalize on their own.`,
          `B) Exposure/popularity bias — X's extra clicks partly come from extra exposure; IPW plus randomized exposure recovers true equality.`,
          `C) A calibration error specific to the click head; re-calibrating that head alone should make X and Y's scores converge.`,
          `D) Overfitting to X's particular input features; adding dropout to the relevant layers should make the popularity bias disappear entirely.`,
        ],
        answer: `B`,
      },
      {
        q: `A team wants to apply inverse-propensity weighting to de-bias its ranker. What must it have logged, and what's IPW's main failure mode?`,
        options: [
          `A) Only the raw clicks are needed; IPW infers propensities directly from click frequency, and its main issue is slow training.`,
          `B) It needs the item embeddings only; IPW's failure mode is that it actually increases popularity bias further over time.`,
          `C) It must have logged P(item shown) per impression; IPW's main failure mode is high variance when propensities are tiny.`,
          `D) It needs editorial relevance labels collected separately; IPW's main weakness is that it can't be computed online.`,
        ],
        answer: `C`,
      },
      {
        q: `Select the two correct statements about users converging to a narrow topic while per-user engagement rises but catalog coverage collapses.`,
        options: [
          `A) This is an echo-chamber feedback loop: the model reads the narrowing itself as stronger preference and narrows further.`,
          `B) The right fix is propensity de-biasing (IPW) combined with deliberate exploration or diversity injection into serving.`,
          `C) This is a genuine win — rising per-user engagement simply means the model learned individual preferences more accurately.`,
          `D) This is an ANN index staleness problem specifically, and rebuilding the retrieval index alone should make coverage recover.`,
        ],
        answer: ['A', 'B'],
      },
    ],
    recap: [
      `**A recommender manufactures its own training data:** you can only click what you were shown, and what you were shown was yesterday's model's choice — so logs aren't a neutral sample of preference, they're preference *conditioned on the old policy*. Train naively and the system teaches itself to keep doing what it already did.`,
      `**Popularity self-reinforces into a rich-get-richer spiral:** a popular item is shown more → gets more clicks (partly *because* shown more, not better) → the model reads clicks as quality → shows it even more. Two equally-good items where one starts with 2× exposure diverge every cycle — an illustrative 2× → 3× → 5× exposure lead, not a derived formula — even though true quality never differed. The long tail starves.`,
      `**Exposure bias is the formal name; IPW is the standard correction:** Inverse-Propensity Weighting reweights each logged example by 1/P(shown) — an item shown 10% of the time counts 10× when clicked, one shown 90% counts ~1.1× — un-doing the exposure imbalance so the model estimates *relevance*, not *what got shown*. Requires logged propensities.`,
      `**IPW is high-variance when P(shown) is tiny** (1/P blows up), so it's paired with **randomization / ε-greedy exploration** — a small traffic slice serving items uniformly injects unbiased exposure the model can learn from, keeping propensities bounded away from zero.`,
      `**Left uncorrected, the loop produces filter bubbles and echo chambers:** a user shown one viewpoint clicks it → the model infers preference → shows more → the world narrows, and the *narrowing itself* is misread as stronger preference. Short-term engagement rises while coverage collapses. Same fix as popularity: propensity de-biasing plus deliberate exploration/diversity injection.`,
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
