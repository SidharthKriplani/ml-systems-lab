export const PRODUCTION_MODULES = [
  {
    id: 'training_serving_skew',
    interactiveId: 'train_serve_skew_viz',
    title: 'Training-Serving Skew',
    subtitle: 'Definition, causes, detection, remediation',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['training-serving skew', 'production ML', 'feature drift'],
    interactivePrompt: `Before you touch the controls: a fraud model was trained on Python-computed features and is served with a Java microservice computing the "same" features — would you expect them to agree?`,
    summary: `Your fraud model scored beautifully in offline testing. In production it is 15% worse. The features look right. No exception is thrown. The pipeline reports success every hour. So what broke?

[FIGURE: skew]

One feature broke: "number of transactions in the last 7 days." At training time you computed it from a historical database — exact counts, every transaction, counted precisely. In production it comes from a real-time streaming service that counts *approximately* to stay fast (it uses a probabilistic sketch under the hood). The two numbers are close but not equal. For high-volume power users the gap is big enough to move the prediction — and those are exactly the users most likely to be committing fraud. The model learned from exact counts and is now judging approximate ones. That mismatch has a name: **training-serving skew.**

---

**Why this is so dangerous: it is completely silent.**

No alarm sounds when the database says 47 and the stream says 43. Nothing crashes. The model just quietly gets a little worse. And this is not some rare, big-company problem — it appears the moment your training code and your serving code are two different pieces of code. A two-person team with a scikit-learn model and a Flask endpoint has exactly the same exposure as a giant org. What matters is not infrastructure size; it is whether the feature is computed by *the same logic* in both places — not similar logic, the same logic.

---

**The five ways skew sneaks in.**

*Different code:* training in Python, serving in Java — rounding and null-handling differ, and tiny differences compound. *Different freshness:* training reads a complete history offline; serving reads a real-time value that is slightly stale or approximate. *Schema drift:* serving quietly reorders columns while the model expects a fixed layout. *Preprocessing mismatch:* the scaler was fit on training data (mean 120, std 45) but serving refits it or loads defaults, so the numbers land in a totally different range. *Leakage:* a training feature used information that won't exist at serving time, inflating the offline score against data the model will never actually see.

---

**The fix is structural, not a patch.**

Build one feature-computation layer that both training and serving call — a feature store. The *same function* counts transactions whether you are assembling a training set or answering a live request, so four of the five root causes simply cannot occur. To catch anything left over, use log-and-replay: record the exact features every production request saw alongside its prediction, then re-score those logged features offline and compare to real production results. Any gap is skew, measured directly. The core idea: a model cannot fix bad inputs — the only durable defense is making the two codepaths *the same code.*`,
    keyPoints: [
      `**Use it when you have separate training and serving codepaths for the same feature.** The diagnostic question: if you ran the training pipeline and the serving pipeline on the same raw event at the same moment, would they produce the identical feature value? If the answer is anything other than "yes, by construction," skew is accumulating. The specific failure to watch for is language differences: a Python Spark training job and a Java serving microservice implementing the "same" feature will diverge. Floating-point operations are not associative across languages. Null handling defaults differ. Timezone parsing behavior differs. These differences are individually tiny and collectively catastrophic.`,
      `**The most common production trap is preprocessing parameter mismatch.** The StandardScaler is fit on training data — mean=120, std=45. Then one of three things goes wrong: (1) the serving code refits the scaler on production data instead of loading the saved parameters; (2) the scaler is saved correctly but deserialized incorrectly, silently using default parameters; (3) a new serving engineer reimplements the normalization from scratch. In all three cases, the model receives feature values in a completely different numerical range than it was trained on. The fix is architectural: serialize the fitted scaler inside the model artifact as a single sklearn Pipeline, not as a separate file. The scaler travels with the model weights and is loaded atomically. Any other approach relies on operational discipline that will eventually break.`,
      `**The diagnostic is log-and-replay.** Instrument production to log every raw input feature value alongside every prediction. After 24 hours, run offline evaluation on the logged features and compare to actual production performance. The gap between them is skew, measured directly. Then compute PSI for each feature between the logged production distribution and the training distribution. Any feature with PSI > 0.1 is a candidate. Sort by feature importance — a high-PSI feature that ranks 47th in importance is not your problem; a high-PSI feature that ranks 2nd is. This narrows the investigation from "something is wrong" to "it is this specific feature, and here is why."`,
    ],
    takeaway: `Training-serving skew is an infrastructure problem, not a modeling problem. The model cannot compensate for receiving different feature values than it was trained on. Two separately maintained codepaths will always drift. The only reliable fix is a single shared computation function with serialized preprocessing parameters — anything else is relying on discipline that will eventually fail at the worst moment.`,
    checkQuestions: [
      {
        q: `Your model predicts churn well offline but performs randomly in production, though aggregate feature distributions look similar. Select the two mechanisms most likely to explain this.`,
        options: [
          `A) Label definition mismatch — production redefines "churn" using a 45-day inactivity window vs. training's 30-day window`,
          `B) The optimizer's momentum term was set to 0.99 instead of 0.9, causing gradient oscillation that only surfaces under production load`,
          `C) High null rates on a handful of high-importance features, caused by a broken upstream join and silently imputed to zero at serving time`,
          `D) The production load balancer routes 20% of traffic through a CDN edge cache, adding 40ms of latency to each request`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `You find that a "user_7d_purchase_count" feature has PSI=0.35 between training and production. What is the investigation and remediation process?`,
        options: [
          `A) PSI=0.35 is within normal range — only values above the 1.0 threshold used by the Kolmogorov-Smirnov drift test require action, so no investigation is needed`,
          `B) Immediately retrain the model on production data using a 3-day rolling window and redeploy without further investigation, since retraining always absorbs distribution shift`,
          `C) Check window alignment, data completeness, and staleness between train and serve; fix the divergent code path, then recalibrate`,
          `D) Replace the feature with a 30-day window and apply exponential smoothing with alpha=0.3 to reduce the variance causing the PSI spike`,
        ],
        answer: `C`,
      },
      {
        q: `A model is trained with a StandardScaler fit on training data. How do you ensure the scaler is applied correctly at serving, and what goes wrong if it is not?`,
        options: [
          `A) Refit the scaler on incoming production batches every Sunday at midnight using a 7-day trailing window so it stays current with recent traffic`,
          `B) Serialize the fitted scaler with the model weights; at serving, load that same fitted scaler rather than refitting`,
          `C) The scaler only matters during training gradient descent; once the weights converge, the scaler object can be safely deleted before export to ONNX`,
          `D) StandardScaler parameters are invariant to dataset changes because they are derived from the model architecture, so the serving scaler always matches`,
        ],
        answer: `B`,
      },
      {
        q: `A model trained on historical data uses a "days_since_last_login" feature. At training time, this was computed relative to today's date. Explain the skew this creates and how to fix it.`,
        options: [
          `A) The skew is negligible because the model's L2 regularization term (lambda=0.01) automatically compensates for any time-offset drift during training`,
          `B) The skew causes the feature to be systematically larger in production by exactly 90 days on average, but this can be corrected by subtracting a fixed 90-day offset at serving time`,
          `C) Training anchors the feature to the run date; at serving months later, values are inflated. Fix by computing relative to the event timestamp in both paths`,
          `D) Computing relative to today's date is correct practice as long as both training and serving use UTC timestamps synchronized via NTP, so there is no skew`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Training-serving skew is an infrastructure problem, not a modeling problem. A model cannot compensate for receiving different feature values than it was trained on. Two separately maintained codepaths will always drift. The only reliable fix is a single shared computation function with serialized preprocessing parameters — anything else is relying on discipline that will eventually fail at the worst moment.`,
    figures: {
      skew: `<svg viewBox="0 0 360 118" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">same feature, two codepaths — they drift, silently</text>
  <rect x="6" y="20" width="150" height="30" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="81" y="33" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">TRAIN: Python / SQL</text>
  <text x="81" y="44" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">exact count = 47</text>
  <rect x="204" y="20" width="150" height="30" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="279" y="33" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">SERVE: Java / Redis</text>
  <text x="279" y="44" text-anchor="middle" fill="var(--ink-mid)" font-size="7.5">approx count = 43</text>
  <path d="M156,35 l46,0" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4 2"/>
  <text x="179" y="31" text-anchor="middle" fill="#ef4444" font-size="7.5" font-weight="700">≠</text>
  <rect x="6" y="62" width="348" height="24" rx="5" fill="none" stroke="#ef4444"/>
  <text x="180" y="77" text-anchor="middle" fill="#ef4444" font-size="8" font-weight="700">model scores value it never trained on — worst on high-volume users</text>
  <rect x="6" y="94" width="348" height="20" rx="5" fill="var(--prime-faint)" stroke="#22c55e"/>
  <text x="180" y="107" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">FIX: one shared computation path → 47 = 47 by construction</text>
</svg>`,
    },
    recap: [
      `**Training-serving skew = the model scores values it never learned from.** Silent, no exception, no crash.`,
      `**Infrastructure problem, not modeling.** Team size irrelevant — exposure appears the moment training code ≠ serving code.`,
      `**Five culprits:** different code (Python vs Java), freshness, schema drift, preprocessing mismatch, leakage.`,
      `**Preprocessing trap:** scaler fit at train (mean=120, std=45) refit/defaulted at serve → values land in wrong range.`,
      `**Fix is structural:** one shared feature-computation path (feature store) + serialize scaler *inside* the model artifact as one \`Pipeline\`.`,
      `**Diagnostic = log-and-replay:** log prod features + predictions, re-score offline, compare. Gap = skew, measured directly.`,
      `**Then PSI per feature vs training; PSI > 0.1 sorted by importance** — a high-PSI feature ranked 2nd is the problem, ranked 47th is noise.`,
    ],
  },
  {
    id: 'feature_engineering_prod',
    interactiveId: 'point_in_time_join_viz',
    title: 'Feature Engineering in Production',
    subtitle: 'Online vs offline features, point-in-time joins, backfill risk',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['feature engineering', 'online features', 'point-in-time', 'backfill'],
    summary: `A fraud model ships with 94% offline AUC. In production it scores 82%. No code changed. No error fired. The model is even getting the exact feature it trained on — "number of transactions in the last 7 days" — but the *value* is wrong.

At training time that number came from a SQL query over a history table: an exact count. In production it comes from a Redis structure that counts approximately to stay fast. For most users the two agree. For high-volume accounts — the very users most likely to be fraud — the approximation drifts from the true count by up to 15%. The model was taught to trust these counts as exact, and now it is scoring live traffic on values it never learned from. Twelve points of accuracy, gone. Not a model failure — an infrastructure failure.

---

**The same five culprits, in feature terms.**

*Language:* the Python training code and the Java serving code implement one formula two ways, and the small differences add up. *Data source:* batch SQL and real-time Redis handle nulls and completeness differently. *Timestamp:* training computes the feature at label time, serving computes it at request time hours later — for a rolling 7-day window that gap matters. *Preprocessing:* a scaler saved under one library version can load differently under a newer one, shifting every value silently. *Leakage:* a training feature used data that won't exist at serving time, inflating the offline score.

One shared computation path removes all five at once: a single library or service computes "transactions in last 7 days" identically whether the caller is the training pipeline or the live endpoint.

---

**Point-in-time joins: the rule that keeps training honest.**

[FIGURE: pit]

Here is the subtle one. When you build a training row for a fraud event at time T, you must join only feature values that existed *before* T. Grab a value from T + 1 hour — easy to do by accident, because the training job ran later — and you've leaked the future into the past. For a rolling 7-day window computed an hour late, the count can include transactions that happened *after* the event you're trying to predict. The model learns a pattern built partly on future data. In production it never has the future, so the offline number is a mirage and production comes in lower.

---

**One warning worth internalizing.** "It's the same logic, just in another language" is a hope, not a fact — it's only true once you've tested that both produce byte-identical output on identical input. Re-implementing SQL window logic in Java quietly changes null handling, overflow, and rounding, and on high-value accounts those small differences can outweigh the model's entire learned signal for that user.`,
    keyPoints: [
      `**Build one feature computation path shared by training and serving, even if it means running Python at serving time or invoking a service from the training pipeline.**\n\nThe cost of maintaining two codepaths is not the engineering time to write them — it is the silent accuracy degradation that accumulates once they diverge. Every language boundary, data source switch, and library version difference is a potential skew source. One path eliminates all of them structurally.`,
      `**Trap: point-in-time join mistakes are the most common leakage source in production ML.**\n\nWhen constructing a training row for an event at time T, join only features that were computed and available before T. Using a feature from after T — even by one second — is leakage. The model learns a relationship that includes future information. In production it never has that information. Offline AUC looks great; production performance is worse than expected, and you spend weeks debugging the wrong things.`,
      `**Diagnostic: run both pipelines on the same 1,000 held-out examples and compute mean absolute difference per feature.**\n\nAny feature with MAD greater than 1% of its standard deviation is a training-serving skew candidate. Sort by feature importance. A high-skew feature that ranks 47th in importance is noise; a high-skew feature that ranks 2nd is your accuracy gap. This narrows the investigation from "something is wrong" to "it is this specific feature, and here is the computation difference that causes it."`,
    ],
    interactivePrompt: `Before you touch the controls: a fraud model trains on Python-computed SQL window counts and serves with a Java Redis approximation — at what transaction volume does the 0-15% approximation error start shifting predictions enough to matter?`,
    checkQuestions: [
      {
        q: `You are building a loan default prediction model with a "total_outstanding_loan_balance" feature. Which two statements about implementing training and serving correctly are true?`,
        options: [
          `A) For training, use today's balance for all historical examples because it reflects the most accurate current state; for serving, also use current balance`,
          `B) For training, retrieve balance via a temporal join (SUM where loan_opened <= label_date AND not yet closed), excluding future loans`,
          `C) For serving, run the identical temporal-join logic at current time through a shared function, and monitor PSI weekly for drift`,
          `D) Balance features are exempt from point-in-time requirements because the core banking ledger applies T+2 settlement, which guarantees retroactive accuracy`,
        ],
        answer: ['B', 'C'],
      },
      {
        q: `Your team is rebuilding a feature pipeline that has a known bug affecting 5% of users. You need to retrain the model with corrected features. What are the risks?`,
        options: [
          `A) There are no significant risks — fixing a known bug that used a fallback default of -1 for 5% of users always produces a strictly safer model regardless of operation order`,
          `B) The main risk is that retraining takes too long — the pipeline rebuild adds roughly 3 weeks to the release calendar, and the model goes stale while it's being fixed`,
          `C) The retrained model expects correct features, but serving may still emit buggy ones — fix serving first, then backfill, then retrain, never the reverse order`,
          `D) The risk is that corrected features will have a materially different distribution (mean shift of roughly 12%) than what the model expects, so the only safe option is to deploy without retraining`,
        ],
        answer: `C`,
      },
      {
        q: `Explain why a 30-day rolling average feature is particularly prone to training-serving skew.`,
        options: [
          `A) Rolling averages are inherently unstable due to floating-point accumulation error in Welford's online variance algorithm and should be replaced with cumulative sums`,
          `B) The 30-day window aggregates roughly 720 hourly samples, enough to smooth out any skew — rolling averages are actually among the most skew-resistant feature types`,
          `C) Differences in reference timestamp, timezone handling, and null treatment compound across 30 days; a centralized feature store with one authoritative pipeline is the fix`,
          `D) Rolling averages are prone to skew only when the lookback window exceeds 7 days and crosses a daylight-saving boundary in the US-East timezone; 30-day windows are otherwise perfectly reliable`,
        ],
        answer: `C`,
      },
      {
        q: `A product team wants to add a real-time "user_session_length_so_far" feature to a fraud detection model. Latency SLA is 20ms. How do you evaluate and implement this?`,
        options: [
          `A) Reject the feature immediately — any real-time feature will violate a 20ms SLA due to Redis lookup overhead, which averages 45ms P99 under the standard connection-pool config`,
          `B) Implement it as a daily batch feature computed by a 2am Spark job and accept up to 24h staleness — real-time session features are too operationally complex for fraud systems`,
          `C) Verify offline predictive value first; if significant, store session_start_time in Redis for sub-ms lookup and compute length at serving; replay logs to reconstruct training values`,
          `D) Compute session length from the full event log at inference time using a 90-day Elasticsearch index with a custom scroll API — querying historical events is more accurate than maintaining Redis state`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Training-serving skew is not discovered through monitoring — it is prevented by building a single feature computation path that makes two diverging implementations structurally impossible.`,
    figures: {
      pit: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="8" y="13" fill="var(--ink-low)" font-size="8">building a training row for event T — join only what existed before T</text>
  <line x1="12" y1="50" x2="348" y2="50" stroke="var(--ink-low)" stroke-width="1"/>
  <rect x="40" y="40" width="140" height="20" rx="3" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="110" y="54" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">7-day window (≤ T) ✓</text>
  <rect x="180" y="40" width="120" height="20" rx="3" fill="#ef4444" fill-opacity="0.22" stroke="#ef4444"/>
  <text x="240" y="54" text-anchor="middle" fill="#ef4444" font-size="8" font-weight="700">after T ✗ leak</text>
  <line x1="180" y1="32" x2="180" y2="68" stroke="var(--amber)" stroke-width="2"/>
  <text x="180" y="27" text-anchor="middle" fill="var(--amber)" font-size="8.5" font-weight="700">event T</text>
  <text x="8" y="88" fill="var(--ink-low)" font-size="7.5">grab a value from T+1h and the future leaks into the past → offline AUC is a mirage</text>
</svg>`,
    },
    recap: [
      `**Same feature, wrong value:** SQL exact count at train vs Redis approximate count at serve → 94% AUC drops to 82%.`,
      `**Worst on high-volume accounts** — the very users most likely to be fraud.`,
      `**Five culprits, feature terms:** language, data source, timestamp, preprocessing, leakage. One shared path kills all five.`,
      `**Point-in-time join = the honesty rule:** for an event at T, join only values that existed *before* T.`,
      `**Rolling window leak:** feature computed an hour late can include post-event transactions → offline AUC is a mirage.`,
      `**Diagnostic:** run both pipelines on same 1,000 examples, MAD per feature; MAD > 1% of std = skew candidate, sort by importance.`,
      `**"Same logic, other language" is a hope, not a fact** — only true once byte-identical output is tested.`,
    ],
  },
  {
    id: 'feature_store',
    title: 'Feature Store Architecture',
    subtitle: 'Offline store, online store, registry, materialisation, latency SLAs',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['feature store', 'MLOps', 'architecture', 'feature serving'],
    summary: `Five ML teams at one company all need the same thing: "user average spend in last 30 days." Each team builds its own pipeline. Five nightly SQL jobs. Five Redis keys. Five different implementations of the 30-day window, each with its own null handling, timezone quirks, and new-user edge cases. A user spends ten thousand dollars at midnight, and each team's copy of the feature updates at a slightly different time with a slightly different number. The fraud model and the recommendation model now disagree about this user's spending. Neither team can see the other's value. Neither is wrong by its own logic. Yet they are quietly inconsistent, and both models suffer for it.

A feature store fixes this by computing each feature *once,* correctly, and serving that one answer to everyone — through two storage backends built for two very different jobs.

[FIGURE: stores]

---

**The offline store: history, for building training sets.**

It keeps every past value of a feature, stamped with time. That is what lets you ask, "What was this user's 30-day average spend *as of* time T?" — the point-in-time query that prevents leakage. Without it, your training pipeline reaches for *today's* values when building rows for last month's events, and every rolling aggregate silently swallows data that didn't exist yet when the prediction would have been made.

---

**The online store: the current value, fast.**

A live fraud request needs this user's spend average in under 5ms. The online store (Redis, DynamoDB, Cassandra) holds only the *latest* value per user and returns it at memory speed. No history — that's the offline store's job. It's sized for latency at peak traffic, not for storage.

---

**The registry and materialization: the parts a plain database lacks.**

The *registry* is the governance layer: it records each feature's definition, owner, freshness SLA, upstream dependencies, and which models consume it — so teams can find what already exists and know what breaks if a pipeline is retired. *Materialization* is the act of computing features from raw data and writing them to both stores: batch (Spark, Airflow, hourly/daily) when some staleness is fine, or streaming (Kafka → Flink → Redis) when 5-minute freshness matters, like fraud or live inventory.

And that's the real answer to "isn't this just a database?" A database stores bytes. A feature store adds four things a database won't: point-in-time-correct history, one shared computation path across online and offline, a registry for discovery and lineage, and materialization with freshness monitoring. With all four, training-serving consistency becomes a property of the *system* — not a hope resting on individual engineers remembering to match each other.`,
    keyPoints: [
      `**Establish point-in-time join correctness in your training pipeline before building anything else — this is the hardest invariant to get right and the primary reason feature stores exist.**\n\nEverything else in a feature store is optimization. The offline store's value is precisely that it can answer "what were this user's features at timestamp T" using only data available before T. Without this guarantee, training datasets contain temporal leakage, offline metrics are inflated, and the gap between evaluation and production performance is structural.`,
      `**Trap: materialization lag creates freshness gaps that can be catastrophic for time-sensitive applications.**\n\nIf a feature is computed hourly and a user event happens 50 minutes into the cycle, the online store has 50-minute-old data. For fraud detection, a user who just moved 100K dollars is invisible for up to an hour. Design materialization frequency based on the feature's staleness tolerance — and monitor actual freshness, not scheduled frequency. The schedule and the actual update time are not the same thing.`,
      `**Diagnostic: compare feature values your model sees at training time versus at serving time for the same user events.**\n\nAny systematic difference — even small — is training-serving skew that will silently degrade accuracy. The dual-write pattern makes this check explicit: run the old pipeline and the new feature store simultaneously on real traffic, compare outputs on a sample of entities, and assert identity before cutting over. Do this before the feature store is in the critical path, not after.`,
    ],
    interactivePrompt: `Before you touch the controls: five teams each compute "user average spend in 30 days" independently — what specific difference in implementation would cause the fraud team's value to be higher than the recommendation team's for the same user at the same moment?`,
    checkQuestions: [
      {
        q: `A data scientist wants to reuse "user_30d_purchase_count" computed by another team. Select the two things the feature store provides that make this safe.`,
        options: [
          `A) The exact computation definition, data type/range, and freshness SLA for the feature, recorded in the registry`,
          `B) A copy of the raw upstream event data so each team can recompute the feature independently with their own join logic`,
          `C) Upstream lineage, current consumers, and the owning team, so breaking changes can be communicated before they ship`,
          `D) A guarantee of identical values only when both teams use the same model architecture and framework version`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `Your online store (Redis) is serving a feature at 3ms P50 but 800ms P99. What is causing this and how do you fix it?`,
        options: [
          `A) P99 spiking to 800ms while P50 stays at 3ms indicates a thundering-herd retry storm overloading the connection pool at exactly 14:00 UTC — all requests queue and P50 itself is misleading`,
          `B) The feature value is too large to serialize under Redis's default 512MB string limit; compress all feature vectors with LZ4 before storing them`,
          `C) Likely causes: a hot-key problem on popular entities, memory pressure causing evictions, or large vector deserialization; fix with key hashing, added capacity, and a circuit breaker`,
          `D) Redis P99 spikes are always caused by stop-the-world garbage collection pauses in the JVM client; upgrade to a Redis version with concurrent mark-and-sweep GC`,
        ],
        answer: `C`,
      },
      {
        q: `Describe the materialisation pipeline for a feature "user_last_7d_app_opens" that needs to be available in the online store with <5 minute staleness.`,
        options: [
          `A) Run a daily Spark batch job at 3am UTC that recomputes the 7-day count for all 40 million users and writes to Redis; 5-minute staleness is achievable if the job runs every 5 minutes`,
          `B) Stream events through Kafka to a Flink job maintaining a rolling 7-day count, writing to Redis every 5 minutes and to S3 with timestamps for point-in-time training joins`,
          `C) Maintain a running total in the primary Postgres application database behind a connection pool of 200, and read it directly at serving time; database reads are fast enough to meet the 5-minute SLA`,
          `D) A 5-minute staleness SLA requires a dedicated in-memory compute cluster running Apache Ignite; Redis alone, lacking built-in TTL support, cannot guarantee sub-5-minute freshness`,
        ],
        answer: `B`,
      },
      {
        q: `A feature was deprecated 3 months ago but a model in production still uses it. The feature computation pipeline was shut down. What is the failure mode and how do you prevent it?`,
        options: [
          `A) The model will immediately throw a key-not-found exception when the feature is missing from the Redis keyspace after its 30-day TTL expires, causing a clear and detectable outage`,
          `B) The pipeline shutdown has no effect on production because feature values are cached inside the model's ONNX graph at export time and never re-fetched from Redis`,
          `C) Redis serves the last computed value until its TTL expires, then returns null; the model silently imputes null as default, causing gradual degradation with no exception thrown`,
          `D) The failure mode only occurs if the model was retrained after the pipeline shutdown using the new registry schema version; models never read stale feature values from Redis`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `A feature store is not storage — it is the infrastructure that makes training-serving consistency a structural property rather than an agreement between engineers who will eventually disagree.`,
    figures: {
      stores: `<svg viewBox="0 0 360 116" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <rect x="120" y="6" width="120" height="20" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="180" y="19" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">materialization (compute once)</text>
  <path d="M120,26 l-30,20" stroke="var(--ink-low)" stroke-width="1"/>
  <path d="M240,26 l30,20" stroke="var(--ink-low)" stroke-width="1"/>
  <rect x="6" y="48" width="160" height="44" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="86" y="62" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">OFFLINE store</text>
  <text x="86" y="74" text-anchor="middle" fill="var(--ink-mid)" font-size="7">every past value, time-stamped</text>
  <text x="86" y="85" text-anchor="middle" fill="var(--ink-mid)" font-size="7">"as of T" → training sets</text>
  <rect x="194" y="48" width="160" height="44" rx="6" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="274" y="62" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">ONLINE store</text>
  <text x="274" y="74" text-anchor="middle" fill="var(--ink-mid)" font-size="7">latest value only (Redis)</text>
  <text x="274" y="85" text-anchor="middle" fill="var(--ink-mid)" font-size="7">&lt;5ms → live serving</text>
  <text x="86" y="106" text-anchor="middle" fill="var(--ink-low)" font-size="7">history, sized for storage</text>
  <text x="274" y="106" text-anchor="middle" fill="var(--ink-low)" font-size="7">current, sized for latency</text>
</svg>`,
    },
    recap: [
      `**Problem:** five teams compute "30d avg spend" five ways → silent inconsistency, all models suffer.`,
      `**Fix = compute once, serve everyone,** through two backends for two jobs.`,
      `**Offline store = history, stamped by time** → point-in-time "as of T" queries that prevent leakage.`,
      `**Online store = latest value only, fast** (Redis/DynamoDB/Cassandra), <5ms, sized for latency not storage.`,
      `**Registry = governance:** definition, owner, freshness SLA, lineage, consumers.`,
      `**Materialization = compute + write both stores:** batch (Spark/Airflow) or streaming (Kafka→Flink→Redis) when 5-min freshness matters.`,
      `**Not "just a database":** point-in-time history + one shared path + registry + monitored freshness = consistency as a *system* property.`,
    ],
  },
  {
    id: 'feature_store_traps',
    title: 'Feature Store API Traps',
    subtitle: 'Stale features, cold-start, versioning, deprecation',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['feature store', 'cold start', 'staleness', 'versioning'],
    summary: `A new user signs up. Your feature "average spend in last 30 days" has no history for them, so the feature store returns null. The model — which only ever saw users with 30+ days of history — gets a null where its main spend signal should be. It still produces a score. The score looks plausible. It is garbage. This is the **cold start** problem, and it fires on the very first request for every new user, item, or account, across every feature built on history.

And nothing warns you. The null gets quietly turned into zero (shoving the model toward its most extreme low-spend prediction) or passed straight through the network (behaving however that architecture happens to behave). Either way the model was never trained for this input, and a real user gets a confidently wrong answer.

[FIGURE: coldstart]

Cold start is one of four silent failure modes in production feature stores. Here are the other three.

---

**Stale features.** A materialization job dies overnight, the online store stops updating, and the model starts serving yesterday's — or last week's — numbers. The API call succeeds. No exception, no alert, unless you built one. The only real defense is to ship a \`feature_last_updated_timestamp\` in every serving response and monitor it against the freshness SLA.

---

**Version deprecation in place.** A team redefines "user_purchase_count" from a 7-day window to a 30-day window *under the same name.* A model trained on 7-day counts now silently receives 30-day counts — for a steady user, roughly 4× larger — and its predictions drift upward with no error anywhere. The fix is a rule: never change a feature's meaning in place. Give the new definition a new name and sunset the old one with notice to its consumers.

---

**Backfill that leaks the future.** To train on a brand-new feature you need historical values, so you backfill them. Those values must use only data that existed at each past timestamp. The classic bug: backfilling a "7-day rolling average" using everything up to the *backfill run date* instead of the true window at each point. Now the training set contains future information, offline metrics look great, and production disappoints.

---

**The theme:** don't expect the store to handle these for you. Cold-start defaults, freshness SLAs, and deprecation workflows are decisions you make *per feature.* The infrastructure computes and serves values; it has no idea what a sensible default is for a new user, what "fresh enough" means for your use case, or which models break when a pipeline is turned off. Those calls are yours.`,
    keyPoints: [
      `**Define a cold start strategy for every feature before deployment — either a carefully chosen fallback default or a separate model trained on sparse-history users.**\n\nUndocumented cold start behavior is a production incident waiting to happen. Zero is almost never the right default: in a feature distribution where the median is 5, a default of zero pushes the model toward its most extreme low-value prediction for every new user. Use the population median from the training set, and add an explicit \`is_new_entity\` binary feature so the model can distinguish cold start inputs from established users with genuinely low feature values.`,
      `**Trap: backfilling a new feature incorrectly is one of the most common sources of temporal leakage in production ML.**\n\nAlways verify that backfilled values use only data available at each historical timestamp. The check: compare the backfilled feature distribution for last month against what you would have computed last month in real time. Any systematic difference — even a few percent — means the backfill used future data and the training set is contaminated.`,
      `**Diagnostic: monitor the null rate of each feature in the online store in production.**\n\nA feature that was 0% null in training but 5% null in production indicates a cold start or freshness issue the model was never trained to handle. Null rate is the earliest and most reliable signal for feature store failures — it responds immediately to pipeline outages, join failures, and deprecation events, before downstream model metrics have time to degrade.`,
    ],
    interactivePrompt: `Before you touch the controls: a new user's feature "average spend in last 30 days" is null — the model gets zero after imputation — what prediction does the model produce, and is that prediction meaningful?`,
    checkQuestions: [
      {
        q: `Your recommendation model suddenly degrades in production. Feature distributions look normal on average, but P99 latency for feature retrieval spiked from 5ms to 800ms. What happened and what do you do?`,
        options: [
          `A) A P99 spike to 800ms while P50 stays at 5ms is just statistical noise from garbage collection in the monitoring agent; ignore it and monitor only the P50 trend instead`,
          `B) High P99 retrieval latency causes the endpoint to timeout and fall back to null/default features; investigate Redis hot keys and memory eviction, then add a circuit breaker`,
          `C) The model itself is running slowly due to a software regression in the ONNX runtime's graph optimizer; P99 feature retrieval latency is always caused by model inference time, never I/O`,
          `D) Degrade gracefully by disabling all personalization features until P99 returns below the 100ms SLA baseline — feature retrieval is non-essential to the core ranking model`,
        ],
        answer: `B`,
      },
      {
        q: `A new product launches with 10,000 new items and the recommendation model ranks them very low. Select the two true statements about why, and how to fix it.`,
        options: [
          `A) New items have null or zero engagement features (clicks, purchases, views), so the model ranks them as low-engagement rather than unknown`,
          `B) The model correctly infers from a Bayesian prior that items with zero purchase history are inherently lower quality than established items`,
          `C) Effective fixes include content-based features, exploration injection, warm-start embeddings from similar items, and Bayesian smoothing of the engagement prior`,
          `D) This is a cold-start problem on the user side, not the item side — the correct fix is refreshing user features on a tighter schedule`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `Explain how a feature version change from "purchase_count_7d" to "purchase_count_30d" with the same feature name would manifest in model performance over time.`,
        options: [
          `A) The model would immediately produce errors because the value range change trips a strict schema validator with a hard-coded max of 50, triggering alerts`,
          `B) Performance would improve because the 30-day window captures roughly 4x more purchase events as signal; version changes under the same name are encouraged whenever the new version is strictly better`,
          `C) The model receives values ~4x larger than it trained on, causing systematically inflated predictions visible as a sudden upward shift in score distribution monitoring`,
          `D) The effect would be negligible because gradient-boosted trees learn relative rank-order patterns rather than absolute feature values, per the model's monotonicity constraints`,
        ],
        answer: `C`,
      },
      {
        q: `How do you implement a testing strategy for a feature pipeline to catch backfill inconsistencies before they reach training data?`,
        options: [
          `A) Run the new pipeline on live data only — backfill testing is unnecessary because historical data is immutable once written to the Parquet lake and covered by S3 object-lock`,
          `B) Store expected values for 100 sampled entities at 10 timestamps; assert recomputed values match on pipeline changes, and fail before backfilled data enters training`,
          `C) Compare the new pipeline's output schema against the old schema using a Great Expectations suite; if column names and types match, the backfill is fully consistent`,
          `D) Backfill inconsistencies can only be caught after a full model retraining cycle by comparing offline AUC between the old and new models on a held-out 90-day window`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Feature store failures are silent — no exception fires when a feature is stale, null, or semantically different from what the model expects, and the only mechanism that finds them before users do is explicit monitoring that you built specifically for that purpose.`,
    figures: {
      coldstart: `<svg viewBox="0 0 360 76" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">new user, no history → the silent path to confident garbage</text>
  ${['new user', 'feature = null', 'imputed → 0', 'confident\\ngarbage'].map((t, i) => `
  <rect x="${6 + i * 90}" y="26" width="80" height="30" rx="5" fill="${i === 3 ? 'none' : 'var(--prime-faint)'}" stroke="${i === 3 ? '#ef4444' : 'var(--prime)'}"/>
  <text x="${46 + i * 90}" y="45" text-anchor="middle" fill="${i === 3 ? '#ef4444' : 'var(--ink-hi)'}" font-size="7.5" font-weight="700">${t.replace('\\n', ' ')}</text>
  ${i < 3 ? `<path d="M${86 + i * 90},41 l4,0" stroke="var(--ink-low)" stroke-width="1.5"/>` : ''}`).join('')}
  <text x="6" y="72" fill="var(--ink-low)" font-size="7">fix: population median, never 0, plus an explicit is_new_entity flag</text>
</svg>`,
    },
    recap: [
      `**Four silent failure modes:** cold start, stale features, in-place version change, backfill that leaks the future.`,
      `**Cold start:** new entity → null → imputed to zero → confident garbage. Fires on the first request for every new user/item.`,
      `**Default fix:** population median, never zero; add explicit \`is_new_entity\` binary so the model can tell cold-start from genuinely low.`,
      `**Stale:** materialization dies, store serves last week's numbers, API still succeeds. Ship \`feature_last_updated_timestamp\` + monitor vs SLA.`,
      `**Version-in-place:** redefine 7d→30d under same name → values ~4× larger → predictions drift up, no error. Rule: new meaning = new name.`,
      `**Backfill leak:** use only data available at each past timestamp, not the backfill run date.`,
      `**Best signal = null rate per feature:** 0% at train, 5% in prod = cold-start or freshness issue, and it responds *before* model metrics degrade.`,
    ],
  },
  {
    id: 'late_arriving_data',
    interactiveId: 'label_delay_viz',
    title: 'Late-Arriving Data',
    subtitle: 'Watermarking, streaming late data handling, impact on labels, remediation',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['late data', 'streaming', 'watermark', 'label quality'],
    summary: `A fraud system scores an order the instant it is placed — call that T+0. The truth about that order arrives much later: a fraudulent chargeback gets filed 7 days on. That chargeback *is* the label. But your training job runs daily and can only trust labels that have had time to settle. So the most recent week of your training data shows almost no fraud — not because fraud stopped, but because the evidence hasn't shown up yet. This is **label delay,** and it is everywhere that the truth arrives after the thing you're predicting.

---

**Don't guess the wait — measure it.**

The lazy fix is "just wait longer before training." It works, but it throws away recency. The real fix is to learn the *shape* of the delay: for your data, what fraction of chargebacks are in by day 1, day 3, day 7? That's the **completeness curve.** At 50% completeness you have half the labels; at 95%, nearly all. Set your incubation period — how long before you call a label final — at the 99th percentile of that curve, not at some round number that felt about right.

[FIGURE: completeness]

---

**Late data wrecks features too, not just labels.**

"Transactions in the last 5 minutes," computed at 14:02, should cover 13:57–14:02. But a phone that dropped signal for three minutes uploads its events at 14:04 — after the window closed. The feature was computed on incomplete data. And the miss isn't random: it systematically undercounts users with flaky connectivity, which tracks with geography and device. Bias, not noise.

---

**Watermarks and event time.**

A *watermark* is how a streaming system announces "every event up to time T is now in." You set it by measuring the real lateness of your source: too tight and you throw away real events, too loose and every result waits on stragglers that may never come. The deeper rule underneath all of this: use **event time** (when it happened), never **processing time** (when your system received it). In real distributed systems — retries, clock skew, phones uploading hours later — events *always* arrive out of order. Design for out-of-order arrival from the start, because assuming order silently distorts every aggregate, every label, and every model built on them.`,
    keyPoints: [
      `**Design your training pipeline around label delay from day one — decide the label cutoff window empirically and build a consistent data split that respects it.**\n\nModels trained with inconsistent label windows give unreliable offline metrics. If chargebacks arrive over 7 days, your training data from the last 7 days has systematically under-labeled positives. Either exclude that window entirely or weight labels by expected completeness at training time. The completeness curve — fraction of expected labels received as a function of days since the event — tells you exactly where to draw the line.`,
      `**Trap: using processing time instead of event time for feature windows produces features that drift with pipeline latency.**\n\n"Transactions in the last hour" computed from processing time expands and contracts as pipeline throughput varies. Use event timestamps for all business logic. This requires watermarks that account for the actual lateness distribution of your data source — measure the 99th percentile of event arrival lag and set your watermark tolerance accordingly.`,
      `**Diagnostic: plot the distribution of event arrival lag (event time vs processing time) for your specific data source.**\n\nIf the 99th percentile lag is greater than 5 minutes and your feature windows are shorter than 1 hour, you need watermarks with at least 5-minute tolerance. Re-measure this distribution whenever upstream systems change — a new mobile OS version, a new attribution pipeline, or a new data collection method can shift the completeness curve significantly.`,
    ],
    interactivePrompt: `Before you touch the controls: a fraudulent chargeback arrives 7 days after the order — if your training pipeline runs daily and uses labels from the last 30 days, what fraction of your positive examples in the most recent week are missing?`,
    checkQuestions: [
      {
        q: `You are training a click model for mobile ads. Labels are generated 1 hour after impression, and precision is much lower on mobile than desktop. Select the two accurate statements.`,
        options: [
          `A) Mobile devices batch-upload events when reconnected, so clicks arrive 2-12 hours after the 1-hour cutoff and are labeled as no-clicks`,
          `B) Mobile users inherently have lower CTR than desktop users because smaller touch targets reduce tap accuracy by roughly 30%`,
          `C) The fix is to measure click lateness by platform and extend the mobile label incubation window to 24-48 hours`,
          `D) The correct fix is to always use an infinite label window and retrain only once every event in history has arrived`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `A Flink streaming job computes "user_session_click_count" in a 30-minute tumbling window with 5-minute allowed lateness. An event arrives 8 minutes late. What happens to the feature?`,
        options: [
          `A) Flink automatically extends the allowed_lateness parameter to 12 minutes at runtime via its adaptive watermark heuristic and recomputes the window`,
          `B) The event is buffered in Flink's internal RocksDB state backend and silently incorporated into the next 30-minute window's computation instead`,
          `C) The event falls outside the 5-minute allowed_lateness window and is dropped or routed to a side output; the session count underestimates by at least one click`,
          `D) The window remains open indefinitely, ignoring the configured allowed_lateness entirely, until all late events arrive and it closes with the fully complete count`,
        ],
        answer: `C`,
      },
      {
        q: `Your fraud model trains on features at transaction time with labels available 7 days later (when chargebacks are processed). The last 7 days of data in your training set have systematically lower fraud rates than older data. Why?`,
        options: [
          `A) Fraud rates are genuinely lower in recent data because the model's production deployment 6 weeks ago has already reduced the underlying fraud rate by roughly 15%`,
          `B) This is delayed feedback bias — recent transactions haven't yet received chargebacks, so they show near-zero positive labels; fix by excluding data newer than the resolution time`,
          `C) Recent data is lower quality because the Spark ingestion pipeline has a 3-day processing backlog; exclude the last 7 days from all features, not just labels`,
          `D) The lower fraud rate in recent data is correct — fraudsters adapt to detection models within a 2-3 week cycle and become less detectable over time, which the training set accurately reflects`,
        ],
        answer: `B`,
      },
      {
        q: `Design a label generation system for a recommender model where user engagement signals arrive with varying latency (watch completion: 0-2h, like: 0-7d, share: 0-30d).`,
        options: [
          `A) Wait a full 30 days for all signals before generating any label at all, since a fixed engineering rule holds that incomplete data always corrupts a model more severely than training delay costs ever could`,
          `B) Use only watch completion as the label since it arrives within 2 hours and correlates at r=0.9 with long-term satisfaction; discard likes and shares entirely`,
          `C) Define per-signal incubation periods (watch at t+4h, like at t+10d, share at t+35d) and use completeness-weighted multi-stage labels, monitoring the completeness curves quarterly`,
          `D) Use a single fixed 24-hour cutoff for all three signal types and apply equal weight of 0.33 each — this balances recency against completeness`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Label delay and late-arriving events are not edge cases — they are structural properties of asynchronous systems, and the only safe design measures the actual completeness curve for your specific data source rather than assuming any default.`,
    figures: {
      completeness: `<svg viewBox="0 0 360 104" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">completeness curve — set incubation at the 99th percentile, not a round number</text>
  <line x1="30" y1="20" x2="30" y2="86" stroke="var(--ink-low)" stroke-width="0.75"/>
  <line x1="30" y1="86" x2="350" y2="86" stroke="var(--ink-low)" stroke-width="0.75"/>
  <text x="26" y="24" text-anchor="end" fill="var(--ink-ghost)" font-size="6.5">100%</text>
  <text x="26" y="88" text-anchor="end" fill="var(--ink-ghost)" font-size="6.5">0%</text>
  <path d="M30,86 C90,40 160,26 350,22" fill="none" stroke="var(--prime)" stroke-width="1.75"/>
  <line x1="70" y1="20" x2="70" y2="86" stroke="#ef4444" stroke-width="1.25"/>
  <text x="70" y="98" text-anchor="middle" fill="#ef4444" font-size="7">day 1 (~50%)</text>
  <line x1="250" y1="20" x2="250" y2="86" stroke="#22c55e" stroke-width="1" stroke-dasharray="3 2"/>
  <text x="250" y="98" text-anchor="middle" fill="#22c55e" font-size="7">day 7 = p99 ✓</text>
  <text x="200" y="34" fill="var(--ink-low)" font-size="7">cut too early → recent positives missing</text>
</svg>`,
    },
    recap: [
      `**Label delay:** truth arrives after the event — chargeback filed 7 days on. Recent week looks fraud-free because evidence hasn't shown up.`,
      `**Don't guess the wait, measure it:** the completeness curve = fraction of labels in by day 1/3/7. Set incubation at the 99th percentile.`,
      `**Late data wrecks features too:** "txns last 5 min" at 14:02 misses a phone uploading at 14:04. Bias, not noise — undercounts flaky connectivity.`,
      `**Watermark = "everything up to T is in."** Too tight drops real events, too loose waits on stragglers.`,
      `**Use event time (when it happened), never processing time (when received).**`,
      `**Events always arrive out of order** — retries, clock skew, delayed uploads. Design for it from the start.`,
    ],
  },
  {
    id: 'data_quality',
    title: 'Data Quality for ML',
    subtitle: 'Schema drift, distribution shift in features, null rates, automated validation',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['data quality', 'schema drift', 'validation', 'Great Expectations'],
    summary: `It is 3am. An alert fires: the fraud model has stopped returning high-confidence positives. Nothing was deployed in the last two days. The model? Running fine. The feature pipeline? Reported success. The upstream transaction table? Zero rows for the last two hours — an ingestion outage upstream. No error was ever thrown. The pipeline happily ran on empty windows, produced all-zero feature vectors, and the model scored every transaction as low-risk. Thousands of fraudulent orders sailed through unflagged.

---

**The one asymmetry that makes data quality hard: bad data doesn't raise exceptions.**

An empty table returns in 5 milliseconds. A feature that nulls out because a join failed hands you a number, not an error. A model fed all zeros returns a confident score. At every layer the system reports *success* while quietly producing garbage. That is why "did the pipeline run?" tells you almost nothing — you have to actively *check the data itself.*

---

**So you check it at every stage.**

At *ingestion:* does the data even exist, in the expected volume, with the expected schema? At *feature computation:* are null rates in bounds, are distributions close to training? At *training:* does the label rate match history, has any feature's mean drifted more than 2σ? At *serving:* does the live feature schema still match training, are values in range?

---

**The five checks that catch the most.**

[FIGURE: checks]

*Freshness* — is data arriving on time (alert when nothing new for longer than expected). *Completeness* — null rates within bounds, per feature. *Validity* — values in range, categories from the known set. *Volume* — row count within ±30% of the rolling weekly average. *Schema consistency* — no surprise column renames or type changes from upstream. Tools like Great Expectations and TensorFlow Data Validation turn these into assertions that *fail the pipeline loudly* — not dashboards someone has to remember to open.

And the mindset that ties it together: data quality is never "done at launch." Upstream teams change schemas, inject nulls, and shift distributions all the time, and they will not tell you. The real question isn't "is our data clean today?" — it's "will our monitoring catch the problem before the model does?" A pipeline that screams on day one of a schema change beats one that silently retrains on corrupted features for six weeks.`,
    keyPoints: [
      `**Add freshness and volume checks first — they catch 80% of data pipeline failures and take 30 minutes to implement.**\n\nA table that should have 10,000 rows but has 0 is an emergency. Catching it before the feature pipeline runs is the difference between a 30-minute incident and a 6-hour one. Alert when no new rows have arrived for more than the expected latency, and alert when record count falls below 70% of the rolling 7-day average. These two checks are the floor, not the ceiling.`,
      `**Trap: monitoring aggregate statistics but not per-slice quality hides the failures that matter most.**\n\nA table with 10,000 rows and 0.1% overall null rate can have 100% null rate for iOS users — exactly the segment most affected by a specific data pipeline bug. Always monitor data quality stratified by the key business dimensions your model cares about: platform, geography, user segment, device type. Aggregate metrics pass; per-slice checks catch the real failures.`,
      `**Diagnostic: set up a daily data quality report that diffs current column statistics against a snapshot from training time.**\n\nAny column whose mean shifts more than 2σ from the training distribution is a drift candidate requiring investigation. This check costs one SQL query per feature and catches the silent degradation pattern — upstream changes the data, the pipeline reports success, the model retrains on shifted features, and no one notices until a business metric moves six weeks later.`,
    ],
    interactivePrompt: `Before you touch the controls: the transaction table has zero rows for the last two hours, but the feature pipeline reported success — what specific check would have caught this before the model scored any traffic?`,
    checkQuestions: [
      {
        q: `Your training pipeline runs successfully every day, but model performance has been slowly degrading over 3 weeks with no code changes. Select the two correct diagnostic steps.`,
        options: [
          `A) Check per-feature PSI over time and null-rate trends across the 3-week window for a slow, spike-free drift pattern`,
          `B) Redeploy the exact same model artifact to reset an internal staleness counter that Kubernetes maintains for long-running pods`,
          `C) Check label distribution shifts, data volume changes, and upstream schema changes over the same period`,
          `D) Gradual degradation without any spikes is always caused by concept drift specifically; retrain immediately on only the most recent 7 days`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `You add a new upstream data source to your feature pipeline. How do you validate data quality before using it in training?`,
        options: [
          `A) If the pipeline runs without exceptions using the default Airflow retry policy of 3 attempts, the data source is valid — schema errors would always fail the job at the Avro deserialization step`,
          `B) Validate schema and non-null constraints, verify row counts by date for continuity, inspect distributions against domain expectations, and measure join quality with the main entity table`,
          `C) Run a sample of 100 rows through the feature pipeline with a fixed random seed of 42; if the output looks reasonable on manual inspection, approve the data source for production`,
          `D) Data quality validation is only needed for existing data sources that have a documented SLA breach history; new sources are assumed clean until proven otherwise by a downstream metric regression`,
        ],
        answer: `B`,
      },
      {
        q: `A feature pipeline runs successfully but produces the wrong values — all "user_account_age" values are approximately 365 days regardless of actual account age. How does data validation catch this?`,
        options: [
          `A) Range validation would catch this because 365 falls exactly on the upper boundary of a [0, 365] range check that was actually configured for an unrelated tenure feature, not account age`,
          `B) Schema validation catches this because the data type silently flips from int32 to float64 whenever the upstream Airflow DAG computes values incorrectly`,
          `C) Variance/standard-deviation expectations catch this — a constant feature produces stdev near zero, failing an expect_column_stdev_to_be_between assertion`,
          `D) This bug cannot be caught by any automated validation currently in place; it requires a manual weekly spot-check of 500 sampled records by an engineer`,
        ],
        answer: `C`,
      },
      {
        q: `How do you implement data quality checks that catch issues before they affect model training, without slowing down the pipeline significantly?`,
        options: [
          `A) Run all data quality checks after model training completes, via a nightly Airflow DAG with a 6-hour SLA, so they never block the pipeline's critical path`,
          `B) Use a stratified strategy: real-time schema validation at ingestion, fast statistical checks after each batch, and full PSI checks daily; gate training on all checks passing`,
          `C) Sample exactly 1% of records using reservoir sampling for quality checks and extrapolate the results, since full dataset validation is too slow for any daily pipeline`,
          `D) Data quality checks should run in a fully separate pipeline on a different Kubernetes namespace that never blocks model training at all — alerts get addressed only after deployment`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Bad data throws no exceptions — the only thing that distinguishes "pipeline ran" from "pipeline ran on data the model was trained to handle" is data quality assertions you wrote before the incident happened.`,
    figures: {
      checks: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">five assertions that fail the pipeline loudly — not dashboards you must remember to open</text>
  ${[['Freshness', 'arriving on time?'], ['Complete', 'null rate in bounds'], ['Validity', 'range / categories'], ['Volume', '±30% weekly avg'], ['Schema', 'no surprise change']].map((c, i) => `
  <rect x="${6 + i * 70}" y="26" width="64" height="40" rx="5" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="${38 + i * 70}" y="42" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">${c[0]}</text>
  <text x="${38 + i * 70}" y="54" text-anchor="middle" fill="var(--ink-mid)" font-size="6">${c[1]}</text>`).join('')}
  <rect x="6" y="74" width="348" height="18" rx="4" fill="none" stroke="#ef4444"/>
  <text x="180" y="86" text-anchor="middle" fill="#ef4444" font-size="7.5" font-weight="700">any check fails → stop the pipeline before the model trains on garbage</text>
</svg>`,
    },
    recap: [
      `**The asymmetry:** bad data raises no exceptions. Empty table returns in 5ms, failed join returns a number, all-zeros model returns a confident score.`,
      `**"Did the pipeline run?" tells you almost nothing** — you must check the data itself.`,
      `**Check at every stage:** ingestion (exists? schema?), features (nulls, distribution), training (label rate, 2σ drift), serving (schema, range).`,
      `**Five checks:** freshness, completeness (null rate), validity (range/categories), volume (±30% of weekly avg), schema consistency.`,
      `**Tools (Great Expectations, TFDV) fail the pipeline loudly** — assertions, not dashboards someone must remember to open.`,
      `**Watch per-slice, not just aggregate:** 0.1% overall null can hide 100% null for iOS users — the exact segment a bug hit.`,
      `**The real question isn't "is data clean today?" but "will monitoring catch it before the model does?"**`,
    ],
  },
  {
    id: 'label_generation',
    title: 'Label Generation',
    subtitle: 'Programmatic labeling, label noise, weak supervision, distant supervision',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['labeling', 'label noise', 'weak supervision', 'programmatic labeling'],
    summary: `You want to predict which support tickets will need escalation. You have 500,000 old tickets — plenty of data. Then the label reality hits: "escalation" meant something different before 2022, 60% of tickets have no recorded outcome at all, and the outcomes that exist only showed up 14 days after the ticket closed. This is harder than picking a model. It is harder than building features. In most real production ML, *getting the labels right is the actual bottleneck.*

---

**Four ways to get labels, each with its own cost, delay, and noise.**

*Natural labels* come free from user behavior — clicks, purchases, chargebacks. The label already exists; the only catch is delay (clicks in seconds, chargebacks in days), so you design the pipeline around that wait.

*Human annotation* has experts or crowd workers label examples directly — Scale AI or Surge for hard tasks, MTurk for easy ones, running from roughly fifty cents to five dollars an example. You *must* measure quality: inter-annotator agreement (Cohen's κ) above 0.7 is acceptable, 0.8 is good, and below 0.6 means the task itself is ambiguous — fix the guidelines before spending on more labels.

*Weak supervision* (Snorkel) writes many noisy labeling rules — keywords, regex, heuristics, model votes — and combines them into one probabilistic label that's better than any single rule.

*Active learning* trains a model, finds the examples it's most unsure about, and sends only those to humans — often reaching the same accuracy as random labeling with 5–10× fewer labels.

---

**The trap almost everyone hits: label delay.**

If the truth for an event at time T only arrives at T+7 days, you must drop the last 7 days from training. Skip that, and your recent examples are full of positives that simply haven't been labeled yet. The model sees a near-zero positive rate in the latest window and "learns" that recent traffic is safe. That's not a pattern — it's an artifact of how you built the dataset.

---

**And the myth to kill:** "we have tons of data, we don't need labels." Data is not labeled data. Ten million unlabeled rows teach a supervised model nothing. Label quality is the ceiling on model quality — a model can't learn the right thing from the wrong signal, no matter how much you feed it. Spend on annotation *quality* before annotation *quantity.*`,
    keyPoints: [
      `**Invest in annotation quality infrastructure before annotation quantity — a 95%-accurate labeling interface with inter-annotator tracking produces better models than 3× more labels from a 75%-accurate interface.**\n\nLabel quality sets the ceiling on model quality. A model trained on systematically biased labels learns the bias as signal and reproduces it at inference. No amount of additional data fixes systematic noise. Measure Cohen's κ on a 200-example sample before scaling. If κ < 0.6, the labeling task is too ambiguous — refine the guidelines before committing budget to 10,000 more noisy labels.`,
      `**Trap: ignoring label delay in training data construction is the most common subtle bug in production ML pipelines.**\n\nIf ground truth for event at time T arrives at T+7 days, exclude the last 7 days from training to avoid future leakage. Training pipelines that use "the last 30 days of data" without respecting label delay will have systematically under-labeled positive examples in the most recent window. The model learns that recent traffic is low-converting — a temporal artifact of the data construction, not a real pattern.`,
      `**Diagnostic: compute inter-annotator agreement on a 200-example sample before scaling annotation.**\n\nIf κ < 0.6, the labeling task is too ambiguous to scale. The agreement number tells you whether the problem is the guidelines (fixable), the task definition (refine), or genuine boundary ambiguity (accept and use label smoothing). Collecting 10,000 more labels with κ = 0.5 does not improve the model — it amplifies the inconsistency.`,
    ],
    interactivePrompt: `Before you touch the controls: 60% of your support tickets have no outcome recorded, and outcomes that do exist took 14 days to appear — which labeling approach do you reach for first, and what is the first thing you measure?`,
    checkQuestions: [
      {
        q: `You are building a content moderation model. Human labelling is too expensive at scale. Walk through a programmatic labelling workflow.`,
        options: [
          `A) Collect gold-labeled examples, write labeling functions (regex, classifiers, heuristics), aggregate with a Snorkel label model, then train an end model on the probabilistic labels`,
          `B) Use a single large language model with a zero-shot prompt and temperature 0 to label all examples in one pass — LLMs are strictly more accurate than programmatic labeling functions and need no iteration`,
          `C) Start by training a small BERT-base model on 2,000 labeled examples, then use it to pseudo-label the full 500,000-row corpus at a fixed 0.9 confidence threshold`,
          `D) Programmatic labeling only works reliably for binary classification tasks with balanced classes; for multi-class content moderation with 12 categories, human annotation is strictly required`,
        ],
        answer: `A`,
      },
      {
        q: `Your model achieves 92% test accuracy, but manual inspection reveals it is wrong on most examples involving a specific demographic group. Select the two accurate diagnoses/fixes.`,
        options: [
          `A) The group is underrepresented in the test set, so its low accuracy is hidden inside the aggregate 92% figure`,
          `B) The model is correct as-is — 92% overall accuracy means performance is acceptable across every subgroup by construction`,
          `C) The disparity likely also reflects systematic labeling bias; fix with per-group metrics, confident-learning label audits, and minority-class reweighting`,
          `D) High aggregate accuracy with demographic disparity is purely a sampling artifact that always resolves itself with a larger test set`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `You have 10,000 examples labelled by humans with inter-annotator agreement of kappa=0.45. How do you handle this in model training?`,
        options: [
          `A) kappa=0.45 is acceptable for a 5-class problem since chance-corrected agreement above 0.4 meets the standard industry threshold cited in most annotation style guides; proceed with majority-vote labels`,
          `B) Diagnose whether ambiguity is task-inherent or guideline-unclear; use label smoothing and soft labels (mean annotator agreement as probability); revise guidelines and relabel boundary cases`,
          `C) Discard the dataset entirely and start a fresh annotation round from scratch — kappa below the 0.6 threshold means the data is categorically unusable for any model training`,
          `D) Increase the number of annotators per example from 3 to 7 until kappa exceeds 0.6 on a rolling basis, then proceed with standard cross-entropy training unmodified`,
        ],
        answer: `B`,
      },
      {
        q: `What is the failure mode of using a model trained on weak labels to generate more labels for the same dataset, and how do you avoid it?`,
        options: [
          `A) The only failure mode is computational cost — the model, running on a single V100 GPU, takes roughly 40 hours to label the full 2-million-row dataset`,
          `B) The model inherits the same biases as its weak labels; relabeling the data it trained on creates a circular feedback loop that amplifies errors; apply model labels only to held-out data`,
          `C) There is no failure mode — a model trained on weak labels with 65% precision will always, by construction, produce strictly higher-quality labels than the original Snorkel weak-supervision source it was trained on`,
          `D) The failure mode is that model-generated labels converge too closely to human gold labels within 3 iterations, reducing the training set's overall label diversity`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Label quality sets the ceiling on model quality — a model cannot learn the right pattern from wrong labels, and collecting more labels from the same biased process amplifies the bias rather than fixing it.`,
    recap: [
      `**Getting labels right is usually the real bottleneck** — harder than picking a model or building features.`,
      `**Natural labels** = free from behavior (clicks, purchases, chargebacks); the catch is delay.`,
      `**Human annotation** = \\$0.50–\\$5/example; measure Cohen's κ — >0.7 acceptable, >0.8 good, <0.6 = ambiguous task, fix guidelines first.`,
      `**Weak supervision (Snorkel):** many noisy rules → one probabilistic label. **Active learning:** label only uncertain examples, 5–10× fewer labels.`,
      `**Label-delay trap:** truth at T+7d → drop the last 7 days, or the model "learns" recent traffic is safe.`,
      `**Kill the myth "we have tons of data, we don't need labels":** unlabeled rows teach a supervised model nothing.`,
      `**Spend on label quality before quantity** — quality is the ceiling; more labels from a biased process amplify the bias.`,
    ],
  },
  {
    id: 'pipelines',
    title: 'ML Pipeline Architecture',
    subtitle: 'Batch vs streaming ingestion, orchestration, idempotency, pipeline failures',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['MLOps', 'pipelines', 'orchestration', 'Airflow', 'idempotency'],
    summary: `A team has a training script, a deployment script, and a cron job. They call it "the pipeline." Six months later nobody can say which data the live model was trained on. The training script hard-codes a local file path that broke when they moved to the cloud. The last model update took a week of manual fiddling to reproduce. That isn't a pipeline — it's a pile of scripts held together by memory that is quietly fading as people forget and move on.

---

**What a real pipeline is: eight stages, end to end.**

[FIGURE: stages]

*Ingestion* pulls the data, checks the schema, and writes a versioned snapshot. *Feature engineering* runs reproducible transforms into versioned tables. *Training* is pinned to a data version, hyperparameters, and a random seed, producing a versioned artifact. *Evaluation* scores it on a fixed holdout and compares to the current production model. *A deployment gate* auto-promotes if it clears the bar, or routes to a human if not. *Serving* looks up the model, computes online features, logs predictions. *Monitoring* watches drift and performance. *A retraining trigger* — on a schedule or an event — kicks the whole loop off again.

---

**Three properties separate infrastructure from debt.**

*Idempotency:* re-running a step on the same input gives the identical output, no duplicates — done with fixed seeds, content-hashed data, and atomic overwrites. *Fast-fail on bad data:* check availability and schema *before* any compute runs, because a model trained on 60% of the data is worse than not retraining at all. *Complete lineage:* every artifact traces back to its exact data version, code commit, and parameters — without it, debugging is archaeology.

The orchestrator you pick (Airflow, Prefect, Kubeflow, Metaflow) matters far less than whether it enforces those three.

---

**The real test.** Training and deployment are just two of the eight stages; without the other six you have technical debt dressed up as a system. So ask one question: can a new person reproduce the current production model from scratch, deterministically, in under two hours, without asking anyone? If yes, you have a pipeline. If no, you have scripts — and a week-long reconstruction waiting for you at the worst possible moment.`,
    keyPoints: [
      `**Build the evaluation step before optimizing model quality — an automated gate that compares new models to the current production model prevents regressions and eliminates manual review bottlenecks.**\n\nThis is the highest-leverage infrastructure investment. Without an evaluation gate, every model update requires human judgment under time pressure with incomplete information. With one, the decision was made in advance under no pressure: "a challenger must match or exceed the champion on these specific metrics before promotion." That is the decision-making context you want.`,
      `**Trap: non-idempotent pipelines make debugging impossible — if rerunning a step produces different outputs, you can never reproduce a historical result or isolate a regression.**\n\nEnforce idempotency from the start: fix random seeds, version data snapshots by content hash, use UPSERT instead of INSERT, and overwrite partitions atomically. The test is simple: run the same step twice on the same input and assert identical output. If the assertion fails, you have a non-idempotent step that will silently produce different models on different runs.`,
      `**Diagnostic: ask "can a new team member reproduce the current production model from scratch in under 2 hours using only documented steps?"**\n\nIf the answer is no, the pipeline has critical gaps. The gaps are exactly where the next incident will live: undocumented data transformations, implicit file path assumptions, preprocessing parameters stored in someone's local environment, or model artifacts without provenance. Name the gaps before the incident names them for you.`,
    ],
    interactivePrompt: `Before you touch the controls: the training script is a cron job running weekly — if the upstream data source changes its schema on Tuesday, when do you find out, and what does the deployed model do in the meantime?`,
    checkQuestions: [
      {
        q: `Your daily retraining pipeline fails on day 3 because the upstream data source was unavailable. Select the two correct design choices for handling this gracefully.`,
        options: [
          `A) Use a data availability sensor at pipeline start that fails fast and alerts if data hasn't arrived within N hours, while continuing to serve the last good model`,
          `B) Configure the pipeline to train on whatever partial data happens to be available and deploy that model — partial data beats no update at all`,
          `C) Ensure idempotent backfill with upsert semantics once data recovers, and use automatic retry with backoff for transient failures`,
          `D) Increase the pipeline's memory allocation to 128GB so it can cache the previous day's raw data as an automatic fallback source`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `You need to ensure that if a feature computation step fails and is rerun, it does not create duplicate records in your feature store. How do you design this?`,
        options: [
          `A) Add a deduplication step after every write using a SELECT DISTINCT query scheduled hourly via a cron job on the warehouse's replica cluster`,
          `B) Use UPSERT keyed on (entity_id, feature_name, computation_date) rather than INSERT; overwrite Parquet partitions atomically; verify idempotency in CI by running the step twice`,
          `C) Use a distributed lock via ZooKeeper with a 30-second lease to prevent concurrent runs — the duplicate problem only occurs when two pipeline runs overlap in time`,
          `D) Idempotency is only needed for streaming pipelines running on Kafka consumer groups with at-least-once delivery; batch pipelines can safely use plain INSERT because scheduler retries are statistically rare events`,
        ],
        answer: `B`,
      },
      {
        q: `A model is retrained daily. You discover that 4 days ago, a bug was introduced in the feature computation that corrupted 3 features. What is the remediation process?`,
        options: [
          `A) Retrain with the buggy features using the standard weekly schedule and deploy immediately — the model, given enough training epochs, will reliably learn to compensate for the corruption on its own`,
          `B) Halt training; audit all models trained in the past 4 days via lineage; rollback production to the last pre-bug model; fix the bug, backfill the corrupted partitions, and retrain`,
          `C) Delete all 4 days of corrupted training data entirely and retrain from scratch using only historical data older than 6 months, discarding recent labels`,
          `D) Deploy a hotfix directly to the serving pipeline to correct the 3 corrupted features at inference time using a static lookup table; no retraining is needed at all`,
        ],
        answer: `B`,
      },
      {
        q: `What is the difference between a pipeline failure and a pipeline bug, and why does this distinction matter for ML systems?`,
        options: [
          `A) There is no meaningful distinction between the two failure classes as defined in the SRE playbook — both result in a model that underperforms and should be handled with the identical rollback runbook`,
          `B) A failure is detectable — the pipeline throws and alerts fire. A bug is silent — the pipeline succeeds on wrong data, and degradation surfaces weeks later; only output assertions catch bugs`,
          `C) A pipeline failure, per the orchestrator's retry policy, affects only the current training run; a bug silently affects all future runs until someone notices and fixes it`,
          `D) Failures are always caused by infrastructure issues like disk-full errors; bugs are always caused by bad upstream data — both require the identical response of rolling back to the last good model`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `A pipeline that reports success tells you nothing about whether it produced correct data — the gap between "ran without errors" and "produced correct outputs" is exactly where silent bugs live, and only data quality assertions on pipeline outputs close it.`,
    figures: {
      stages: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="8">eight stages — training + deploy are only two of them</text>
  ${['Ingest', 'Features', 'Train', 'Eval'].map((t, i) => `
  <rect x="${6 + i * 88}" y="20" width="76" height="22" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="${44 + i * 88}" y="34" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">${t}</text>
  ${i < 3 ? `<line x1="${82 + i * 88}" y1="31" x2="${94 + i * 88}" y2="31" stroke="var(--ink-low)" stroke-width="1.5"/>` : ''}`).join('')}
  ${['Gate', 'Serve', 'Monitor', 'Retrain'].map((t, i) => `
  <rect x="${6 + i * 88}" y="54" width="76" height="22" rx="4" fill="var(--prime-faint)" stroke="var(--prime)"/>
  <text x="${44 + i * 88}" y="68" text-anchor="middle" fill="var(--ink-hi)" font-size="8" font-weight="700">${t}</text>
  ${i < 3 ? `<line x1="${82 + i * 88}" y1="65" x2="${94 + i * 88}" y2="65" stroke="var(--ink-low)" stroke-width="1.5"/>` : ''}`).join('')}
  <line x1="332" y1="42" x2="332" y2="54" stroke="var(--ink-low)" stroke-width="1.5"/>
  <text x="180" y="92" text-anchor="middle" fill="var(--ink-low)" font-size="7.5">idempotent · fast-fail on bad data · complete lineage — retrain loops back to ingest</text>
</svg>`,
    },
    recap: [
      `**"Training script + deploy script + cron" is not a pipeline** — it's a pile of scripts held together by fading memory.`,
      `**Eight stages:** ingestion → feature engineering → training → evaluation → deployment gate → serving → monitoring → retraining trigger.`,
      `**Three properties separate infra from debt:** idempotency, fast-fail on bad data, complete lineage.`,
      `**Idempotency:** re-run same input → identical output. Fixed seeds, content-hashed data, atomic overwrites, UPSERT not INSERT.`,
      `**Fast-fail:** check availability + schema *before* compute — a model trained on 60% of the data is worse than not retraining.`,
      `**Orchestrator choice (Airflow/Prefect/Kubeflow) matters less than whether it enforces those three.**`,
      `**The real test:** can a new person reproduce prod from scratch, deterministically, in <2 hours, without asking anyone?`,
    ],
  },
  {
    id: 'model_registry',
    title: 'Model Registry & Versioning',
    subtitle: 'Artifact storage, metadata, lineage, deployment gating, experiment tracking',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['model registry', 'MLflow', 'versioning', 'deployment'],
    summary: `Your fraud model was updated four weeks ago. A new fraud pattern shows up and the model is missing it. Now you need answers, fast: when was it updated? What data trained it? What metrics did it hit? Who approved it? Can you roll it back in the next ten minutes? Without a model registry, every one of those is archaeology — digging through Slack, squinting at S3 timestamps, hunting down the engineer who ran the job. And the whole time, the business is eating the cost of a degraded model.

---

**What a registry actually is.**

It's the governance layer sitting between training and production. It holds the model artifact and its full lineage — the exact dataset (with a content hash), the code commit, the feature versions used, the hyperparameters. It holds deployment history: which version went where, who approved it, what gate it passed. And it holds lifecycle state: Experiment → Staging → Production → Archived.

[FIGURE: lifecycle]

---

**Weights alone are not the artifact.**

This is the part teams underbuild. A model trained on scaler-normalized features, deployed *without* that fitted scaler, will get raw inputs, treat them as normalized, and output confident garbage — no error thrown. So the registry must store the *complete inference artifact:* weights **plus** the fitted preprocessing pipeline **plus** the feature schema. One load, everything you need.

---

**Rollback is the part that's time-critical.**

When a model goes bad, you promote the previous version back to Production in a single API call. But only if that artifact still exists — delete it and your "rollback" becomes rebuilding from scratch mid-incident, hours instead of minutes. So never delete production artifacts; a year of storage costs less than one hour of a live incident.

That's the whole difference from "just an S3 folder." Plain storage hands you a file. A registry gives you an approval trail, deployment lineage (what changed between v7 and v8?), instant rollback, and a record of which model made which decision when. A named folder that relies on people staying disciplined under deadline pressure is not a registry — it's a filesystem with good intentions, and it fails you exactly in the first ten minutes of an incident, when you need those answers instantly.`,
    keyPoints: [
      `**Register every model artifact before deployment — even for teams of one — and store the complete inference artifact: weights plus preprocessing pipeline plus feature schema.**\n\nWhen something goes wrong in production, the registry is the first place you look. A model registered without its scaler requires manual reconstruction of preprocessing parameters during an incident. A model registered without its dataset hash cannot be compared to the previous model to identify what changed. Register everything, atomically, before the model ever touches production traffic.`,
      `**Trap: storing only model weights without preprocessing artifacts will cause a silent production failure the first time the scaler version or schema ordering changes.**\n\nA StandardScaler fit on training data with mean=120, std=45, deployed without the fitted scaler, will receive raw feature values and interpret them as if they were normalized. The model has never seen inputs in that range. Predictions will be wrong with full confidence and no error. Serialize the fitted scaler inside the model artifact as a single sklearn Pipeline — the scaler travels with the weights and is loaded atomically.`,
      `**Diagnostic: attempt to reproduce a model registered 3 months ago using only the registry metadata.**\n\nIf you cannot, the registry is incomplete. The gaps you find are exactly where the next incident investigation will stall. Add dataset version tracking and code commit hash to every registration as mandatory fields, not optional ones. Lineage that is optional gets skipped under deadline pressure — which is exactly when you need it most.`,
    ],
    interactivePrompt: `Before you touch the controls: a fraud model was updated 4 weeks ago and is now missing a new fraud pattern — what three registry queries do you run in the first 5 minutes of the incident?`,
    checkQuestions: [
      {
        q: `Your production model is found to be biased against a demographic group after deployment. Select the two ways the model registry helps you remediate.`,
        options: [
          `A) Query the registry for the previous production version and promote it back to Production for a fast one-call rollback`,
          `B) The registry provides the model's raw source code so the bias can be manually patched in place without any retraining`,
          `C) Use lineage to reproduce the exact training run, identify the data bias, and add fairness gates to future deployment criteria`,
          `D) The registry is only useful for rollback and cannot help diagnose bias at all — a wholly separate bias-detection tool is always required`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `Two data scientists train models independently using different hyperparameters. How does experiment tracking in the registry help them collaborate and pick the best model?`,
        options: [
          `A) Experiment tracking only stores the final loss and accuracy metrics; comparing training dynamics between the two scientists always requires manually sharing raw TensorBoard log files`,
          `B) Both log all hyperparameters, metrics, and dataset versions to the same experiment; the comparison UI shows all runs sortable by any metric, with full reproducibility`,
          `C) Experiment tracking is entirely redundant if both scientists use the same monorepo codebase and share hyperparameter YAML configs through Git version control`,
          `D) The registry automatically picks the single best model based on validation AUC using a fixed 0.5 decision threshold — no human collaboration between the scientists is needed`,
        ],
        answer: `B`,
      },
      {
        q: `You need to deploy a model to 3 different environments (dev, staging, prod) with different data schemas in each. How do you design the registry to handle this?`,
        options: [
          `A) Maintain three fully separate model registries, one per environment, each backed by its own Postgres metadata store — sharing a single registry across environments always creates schema conflicts`,
          `B) Store environment-specific config separately from model weights; associate (model_version, env, config_version) at promotion; run schema compatibility gates before each promotion`,
          `C) Store only one model version per registry entry and let each of the three environments apply its own independent preprocessing logic at inference time`,
          `D) Deploy the exact same artifact to all three environments and rely entirely on environment variables read at container startup to handle schema differences at runtime`,
        ],
        answer: `B`,
      },
      {
        q: `A model trained 6 months ago is performing better than a newly retrained model on the holdout set. What does this tell you about your data pipeline, and how does the registry help debug it?`,
        options: [
          `A) The older model is better because it was trained on 3x more historical data spanning two full business cycles; always prefer the older model for long-term stability`,
          `B) This signals a data pipeline regression — a feature bug, label quality drop, or training window change; use lineage to compare exact dataset versions and feature definitions between the two models`,
          `C) The holdout set has drifted by a KS statistic of 0.4 and no longer represents production traffic; discard both models and retrain from scratch on the most recent 90 days`,
          `D) Newly retrained models always underperform older models on holdout sets because gradient boosting inherently overfits to the most recent 30 days of training data every single cycle; this is expected, entirely benign behavior`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The three questions that matter during a production incident — what is live, what produced it, what is the rollback target — have no reliable answers without mandatory lineage and programmatic gates enforced by the registry.`,
    figures: {
      lifecycle: `<svg viewBox="0 0 360 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">lifecycle states + the complete artifact travelling with them</text>
  ${['Experiment', 'Staging', 'Production', 'Archived'].map((t, i) => `
  <rect x="${6 + i * 88}" y="22" width="78" height="24" rx="5" fill="var(--prime-faint)" stroke="${i === 2 ? '#22c55e' : 'var(--prime)'}"/>
  <text x="${45 + i * 88}" y="37" text-anchor="middle" fill="var(--ink-hi)" font-size="7.5" font-weight="700">${t}</text>
  ${i < 3 ? `<path d="M${84 + i * 88},34 l4,0" stroke="var(--ink-low)" stroke-width="1.5"/>` : ''}`).join('')}
  <path d="M45,46 C45,64 250,64 250,48" fill="none" stroke="var(--amber)" stroke-width="1.25" stroke-dasharray="3 2"/>
  <text x="150" y="70" text-anchor="middle" fill="var(--amber)" font-size="7">rollback = promote previous version (one API call)</text>
  <rect x="6" y="78" width="348" height="18" rx="4" fill="none" stroke="#ef4444"/>
  <text x="180" y="90" text-anchor="middle" fill="#ef4444" font-size="7.5" font-weight="700">artifact = weights + fitted preprocessing + schema (weights alone → confident garbage)</text>
</svg>`,
    },
    recap: [
      `**Registry = governance layer between training and production.** Without it, every incident answer is archaeology through Slack and S3 timestamps.`,
      `**Holds three things:** the artifact + full lineage (dataset hash, code commit, features, hyperparams), deployment history, lifecycle state (Experiment→Staging→Production→Archived).`,
      `**Weights alone are not the artifact:** store the complete inference artifact = weights + fitted preprocessing pipeline + feature schema.`,
      `**Deploy scaler-normalized weights without the scaler** → raw inputs treated as normalized → confident garbage, no error.`,
      `**Rollback is time-critical:** promote previous version in one API call — but only if the artifact still exists.`,
      `**Never delete production artifacts** — a year of storage costs less than one hour of a live incident.`,
      `**Not "just an S3 folder":** approval trail + deployment lineage + instant rollback + a record of which model decided what, when.`,
    ],
  },
  {
    id: 'ab_infra',
    title: 'A/B Infrastructure',
    subtitle: 'Traffic splitting, treatment assignment, exposure logging, interaction effects',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['A/B testing', 'experimentation', 'traffic splitting', 'exposure logging'],
    summary: `A team runs an A/B test the simple way: even user IDs go to control, odd IDs to treatment. Three weeks later they realize their hashing put the *same* 15% of power users into treatment across all six experiments running at once. Those users saw six new experiences stacked on top of each other, and their behavior is now tangled up in all six at the same time. That's **experiment interference,** and it doesn't just complicate the reading — it structurally breaks all six results. The groups aren't comparable, the p-values aren't valid, and every decision made from them rests on corrupted evidence.

---

**Why an A/B bug is scarier than a model bug: it hides behind real-looking statistics.**

A biased assignment still produces a p-value, a confidence interval, a tidy result summary — and every number in that chain is wrong. Nothing crashes, the experiment completes, and a decision gets made on bad data. That's why getting the infrastructure right isn't an implementation detail; it's the precondition for every statistical claim downstream.

---

**The pieces that make assignment trustworthy.**

*Deterministic assignment* — hash(user_id + experiment_id) so a user always lands in the same bucket, making their events attributable. *Orthogonal splitting* — a different salt per experiment so simultaneous tests assign users independently and don't correlate. *An experiment registry* — tracks what's live and blocks conflicting experiments from overlapping. *Traffic ramp-up* — 1% → 5% → 20% → 50%, to catch bugs before full exposure. *Guardrail metrics* — automatic regression alerts that fire before anyone reads the primary metric.

---

**The single most important check: Sample Ratio Mismatch.**

You intended 50/50 and observed 52/48. That is *not* noise — it's the fingerprint of a systematic bug in assignment or logging. Even a 1% mismatch means your two groups came from different populations, and then every comparison is invalid no matter how significant it looks. Run a χ² test on the raw split *before* you open any metric dashboard. Above 1% SRM, there is no valid analysis to do.

[FIGURE: srm]

---

**And for the long view: holdout groups.** Permanently hold 5–10% of traffic out of *all* experiments and compare production against it over time. This catches novelty effects — the wins that look great in a two-week test but fade once the shine wears off — and shows the true cumulative impact of your ML work. All of this is why "A/B testing is just feature flags and if/else" misses the point: the flag is the mechanism; everything above is the safety system that makes the mechanism produce answers you can trust.`,
    keyPoints: [
      `**Implement an experiment registry before running more than 2 simultaneous experiments — without it, experiment interference silently invalidates results and you make product decisions on corrupted data.**\n\nhash(user_id + experiment_id) % 100 gives orthogonal assignments only if each experiment uses a different salt. Without the registry tracking what is running, two experiments may accidentally share users in ways that correlate treatment assignments, confound their effects, and produce results that look significant but measure the interaction, not the treatment.`,
      `**Trap: running experiments past their planned duration on a fixed sample size is a form of p-hacking, regardless of your statistical reasoning for the extension.**\n\nOnce an experiment runs past its pre-specified duration, extending it is outcome-dependent stopping. You looked at the data, saw it was close to significance, and extended. That is exactly what p-hacking looks like from the outside. Plan sample size before starting. If you need to extend, use sequential testing methods (mSPRT) that account for the additional looks.`,
      `**Diagnostic: audit your last 10 A/B test results — if more than 30% were positive, your testing framework likely has inflated Type I error.**\n\nUnder pure noise at α=0.05 with a single primary metric and no peeking, you expect 5% false positives. If your win rate is 30%, you are either measuring real effects (unlikely across all features) or you have peeking, multiple comparisons, or SRM issues inflating the Type I error. The win rate is the fastest diagnostic for whether your experimentation infrastructure is measuring reality.`,
    ],
    interactivePrompt: `Before you touch the controls: you split even/odd user IDs into control and treatment — what specific property of user IDs would cause this assignment to be systematically biased rather than random?`,
    checkQuestions: [
      {
        q: `An A/B test with an intended 50/50 split shows 52% of unique users in treatment, 48% in control. Select the two correct responses.`,
        options: [
          `A) Do not look at primary metrics yet — the SRM indicates a systematic assignment or logging bug that makes the groups non-comparable`,
          `B) The 52/48 split is well within acceptable statistical variance for any 50/50 experiment regardless of sample size; proceed straight to analysis`,
          `C) Debug the hash function, bot filtering, and session/user assignment mismatch, then restart the experiment only after the root cause is fixed`,
          `D) Apply a post-hoc statistical correction, such as a Bonferroni adjustment, to the metric p-values to compensate for the 2% imbalance`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `Your A/B test shows a 5% lift in click-through rate. The experiment ran for 3 days. What validity threats should you consider before claiming the win?`,
        options: [
          `A) A statistically significant result at p<0.05 after 3 days is valid regardless of duration, since the central limit theorem guarantees the sampling distribution has already converged`,
          `B) Day-of-week effects and novelty effects threaten validity, along with peeking bias and SRM; run for at least 7-14 days before declaring a win`,
          `C) The only validity threat is sample size — if the 95% confidence interval excludes zero by even a small margin, the result is valid at any duration whatsoever`,
          `D) Three-day experiments are only invalid for negative or null results; a positive lift of any size is inherently more statistically reliable regardless of duration`,
        ],
        answer: `B`,
      },
      {
        q: `How do you design an A/B infrastructure for testing ML model changes when models have different computational costs and serving latency?`,
        options: [
          `A) Test the two models in separate sequential experiments spaced 4 weeks apart to avoid latency confounding — never A/B test models with different serving times simultaneously under any circumstances`,
          `B) Ensure both models meet the latency SLA before launch; run a canary first (1-5% traffic) to catch errors; route assignment before model execution, and log model_version with every prediction`,
          `C) Use the faster model, at 12ms P50, as control and the slower model, at 45ms P50, as treatment — this naturally accounts for any latency differences in the downstream analysis`,
          `D) Latency differences between the two models, even a 30ms gap, are irrelevant to A/B validity as long as the sample sizes in each arm are exactly equal`,
        ],
        answer: `B`,
      },
      {
        q: `A marketplace A/B test treats seller-side UI (treated sellers get a new dashboard). Control sellers are unaffected. But analysis shows control buyer behaviour also changed. What is happening?`,
        options: [
          `A) The control group has been contaminated by a completely separate, unrelated pricing experiment that happens to be running concurrently on the same seller cohort`,
          `B) This is network interference (a SUTVA violation) — treated sellers change pricing and listing behavior, which directly affects buyers interacting with them in the control group`,
          `C) Control buyer behaviour changing by roughly 8% is expected under any two-sided marketplace design and should simply be folded directly into the primary metric calculation without further investigation`,
          `D) The buyer-side behavior change conclusively proves the seller UI treatment is working exactly as intended across both arms; this fully validates the experiment result`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `A biased assignment generates a p-value, a confidence interval, and a recommendation — every number in the chain is invalid, no alarm fires, and there is no statistical correction for a compromised experiment.`,
    figures: {
      srm: `<svg viewBox="0 0 360 92" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">intended 50/50, observed 52/48 — the χ² test runs BEFORE any metric dashboard</text>
  <text x="6" y="30" fill="var(--ink-mid)" font-size="7.5" font-weight="700">intended</text>
  <rect x="60" y="22" width="145" height="12" fill="var(--prime)" opacity="0.55"/>
  <rect x="205" y="22" width="145" height="12" fill="var(--prime)" opacity="0.85"/>
  <text x="132" y="31" text-anchor="middle" fill="var(--ink-hi)" font-size="7">control 50%</text>
  <text x="277" y="31" text-anchor="middle" fill="var(--ink-hi)" font-size="7">treatment 50%</text>
  <text x="6" y="54" fill="var(--ink-mid)" font-size="7.5" font-weight="700">observed</text>
  <rect x="60" y="46" width="139" height="12" fill="#ef4444" opacity="0.45"/>
  <rect x="199" y="46" width="151" height="12" fill="#ef4444" opacity="0.75"/>
  <text x="129" y="55" text-anchor="middle" fill="var(--ink-hi)" font-size="7">48%</text>
  <text x="274" y="55" text-anchor="middle" fill="var(--ink-hi)" font-size="7">52%</text>
  <rect x="6" y="70" width="348" height="18" rx="4" fill="none" stroke="#ef4444"/>
  <text x="180" y="82" text-anchor="middle" fill="#ef4444" font-size="7.5" font-weight="700">SRM &gt; 1% = assignment/logging bug — no valid analysis exists downstream</text>
</svg>`,
    },
    recap: [
      `**Experiment interference:** same power users land in treatment across six concurrent tests → all six results structurally broken.`,
      `**An A/B bug is scarier than a model bug:** it hides behind real-looking p-values and confidence intervals.`,
      `**Trustworthy assignment:** deterministic \`hash(user_id + experiment_id)\`, orthogonal splitting (per-experiment salt), registry, traffic ramp 1→5→20→50%, guardrail metrics.`,
      `**Most important check = Sample Ratio Mismatch:** intended 50/50, observed 52/48 is a bug fingerprint, not noise.`,
      `**Run a χ² test on the raw split *before* opening any metric dashboard.** Above 1% SRM there's no valid analysis.`,
      `**Extending a fixed-N experiment past its planned duration = p-hacking** — use sequential methods (mSPRT) if you must look again.`,
      `**Permanent 5–10% holdout** across all experiments catches novelty effects and shows true cumulative ML impact.`,
    ],
  },
  {
    id: 'online_learning',
    title: 'Online Learning & Model Staleness',
    subtitle: 'Continuous training, concept drift, staleness management, shadow deployment',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['online learning', 'concept drift', 'model staleness', 'shadow mode', 'canary'],
    summary: `A news recommender retrains once a week. A big crypto story breaks Tuesday and interest spikes within hours. The weekly model doesn't surface crypto until Sunday — five days after the peak, three days after it started fading. An online model, updating on every click in real time, is surfacing crypto within minutes. For trending content, that five-day lag is real lost engagement.

[FIGURE: lag]

That's the case for online learning. But it's a *narrow* case, so start with a measurement, not a preference.

---

**First ask: is batch actually too slow?**

Compare a daily-retrained model against an online model on the metric you care about. If daily is close enough, take the simpler system — because online learning gives up three things a good model wants. It's harder to *debug* (the model changes constantly — which update broke it?), harder to *audit* (there's no fixed version to evaluate), and harder to *roll back* (revert to what?). Reach for it only when retraining latency demonstrably hurts the business metric.

---

**If it's warranted, pick the right algorithm — and mind deep models.**

FTRL is Google's workhorse for large-scale online *linear* models (ads serving), efficient with sparse gradients and L1/L2. Online SGD updates weights per example or mini-batch, fine for linear models and shallow nets. But deep models hit **catastrophic forgetting:** trained on a stream, they overwrite what they haven't seen lately. Feed a recommender two weeks of crypto-heavy traffic and it starts recommending *only* crypto, having forgotten sports, politics, and finance. Fixes: *experience replay* (mix a buffer of diverse old examples into each update) and *elastic weight consolidation* (protect the weights that mattered for older patterns).

---

**The sneakiest failure: feedback loops.**

The model's own predictions shape user behavior, that behavior becomes training data, and the data reinforces the predictions. A model that leans slightly toward crypto drives crypto clicks, which show up as a strong crypto signal, which makes it lean harder — a filter bubble compounding at the speed of online updates. Break it with *exploration* (ε-greedy, Thompson sampling).

---

**The bottom line:** "more current is always better" is wrong, because recency is only one virtue — auditability, debuggability, and one-click rollback are others, and batch retraining has all of them (rollback is just a registry promotion). For most systems, periodic batch retraining is the more reliable choice. Online learning wins only when the metric clearly suffers from retraining lag *and* the measured gain justifies the extra complexity.`,
    keyPoints: [
      `**Use FTRL or online SGD only when the retraining-to-deployment cycle is measurably too slow for your use case — establish this empirically before committing to the infrastructure.**\n\nCompare a daily-retrained model against an online model on a key business metric. If the gap is small, choose the simpler system. The engineering cost of online learning — continuous deployment pipeline, feedback loop monitoring, catastrophic forgetting mitigations, audit trail for a model that changes every second — is only worth paying when the measurement shows a gap that matters to the business.`,
      `**Trap: feedback loops in online learning create filter bubbles and popularity bias that compound over time.**\n\nThe model's predictions influence user behavior, which becomes training data, which reinforces the predictions. A small initial bias amplifies on every update cycle. Add exploration (ε-greedy, Thompson sampling) to the online model to break the feedback loop — without exploration, the model collapses toward the already-popular and the already-predicted, destroying the diversity that makes recommendations valuable.`,
      `**Diagnostic: track concept drift metrics alongside the online model's performance — if drift is low but performance is degrading, the feedback loop is the problem; if drift is high and performance is degrading, the model is not adapting fast enough.**\n\nThese two failure modes look similar from the outside (degrading performance) but require opposite interventions. Feedback loop: add exploration, reduce learning rate, increase replay buffer diversity. Insufficient adaptation: increase learning rate, reduce replay buffer weight, consider triggered full retraining on large drift events.`,
    ],
    interactivePrompt: `Before you touch the controls: a news recommendation model updates on every user interaction in real time — after two weeks of heavy crypto traffic, what does the model's recommendation distribution look like, and why?`,
    checkQuestions: [
      {
        q: `Your fraud detection model's precision starts dropping 3 weeks after deployment with no code changes, and feature distributions are stable. Select the two correct diagnoses/actions.`,
        options: [
          `A) This is most likely real concept drift — fraudsters have adapted and the relationship P(fraud|features) has changed`,
          `B) Stable feature distributions guarantee stable model performance by definition; the precision drop must be a monitoring dashboard artifact`,
          `C) Investigate false positive clusters for new fraud patterns and retrain with recency-weighted recent data on a shortened retraining cycle`,
          `D) Stable features with dropping precision means the model was undertrained from the start; increase training epochs by 50% and redeploy the same architecture`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `You are deploying a new recommendation model. Walk through the shadow mode and canary release process.`,
        options: [
          `A) Deploy directly to 50% traffic using a fixed traffic-splitting cookie, monitor for exactly 24 hours, then promote to 100% automatically if metrics stay stable`,
          `B) Shadow mode (1-2 weeks): deploy alongside production, log both models' predictions without serving the challenger; then canary from 1% to 100% with metric gates at each step`,
          `C) Shadow mode is only needed for models with a significantly different transformer architecture; for same-architecture models sharing a tokenizer, go directly to canary at 10%`,
          `D) Skip shadow mode entirely and run the canary for a fixed 3 days at 50% traffic split on a single availability zone — a longer canary period is inherently more informative than any shadow-mode comparison`,
        ],
        answer: `B`,
      },
      {
        q: `A streaming recommendation model is trained online (each user interaction updates the model weights immediately). After 2 weeks, you notice the model systematically recommends items from only 3 categories. What has happened?`,
        options: [
          `A) The model has correctly identified, via a Thompson-sampling bandit layer, the 3 most popular categories and is now optimally optimizing purely for short-term engagement`,
          `B) Catastrophic forgetting from recency bias — 2 weeks of category skew has overwritten other categories through repeated SGD updates; fix with a replay buffer and elastic weight consolidation`,
          `C) Three-category collapse is a well-known random-seed initialization artifact specific to two-tower recommendation models trained with Xavier initialization; simply reinitialize the embedding layer and retrain from scratch`,
          `D) Online learning, by construction, cannot ever cause category collapse; the real issue must be in the feature pipeline producing systematically biased category one-hot encodings`,
        ],
        answer: `B`,
      },
      {
        q: `Define covariate shift, label shift, and concept drift precisely. For each, describe whether retraining is required and what other interventions are available.`,
        options: [
          `A) All three types of drift, per the standard MLOps taxonomy used across most large production teams today, require immediate full retraining on at least 30 days of fresh incoming data — distinguishing between them is considered a purely academic exercise`,
          `B) Covariate shift (P(X) changes, P(Y|X) stable): importance weighting can correct it without retraining. Label shift (P(Y) changes): threshold recalibration may suffice. Concept drift (P(Y|X) changes): retraining is required`,
          `C) Covariate shift always requires full retraining on a GPU cluster; label shift and concept drift can both be fixed with simple threshold recalibration alone, no retraining needed`,
          `D) Only concept drift requires any intervention at all; covariate shift and label shift both self-correct automatically as the model receives more streaming data over time`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Online learning solves a real problem — retraining latency — but creates three new ones: feedback loops, catastrophic forgetting, and a continuously changing model that cannot be audited, debugged, or rolled back the way a batch-trained model can; use it only when the measurement shows the tradeoff is worth it.`,
    figures: {
      lag: `<svg viewBox="0 0 360 96" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="6" y="12" fill="var(--ink-low)" font-size="7.5">crypto interest spikes Tue — retraining lag is the whole tradeoff</text>
  <line x1="20" y1="52" x2="350" y2="52" stroke="var(--ink-low)" stroke-width="0.75"/>
  <path d="M20,52 C80,52 95,22 110,22 C130,22 150,50 350,50" fill="none" stroke="var(--amber)" stroke-width="1.5"/>
  <text x="110" y="18" text-anchor="middle" fill="var(--amber)" font-size="7">true interest (peaks Tue)</text>
  <line x1="110" y1="22" x2="110" y2="72" stroke="#22c55e" stroke-width="1" stroke-dasharray="2 2"/>
  <text x="110" y="82" text-anchor="middle" fill="#22c55e" font-size="7">online: surfaces in minutes</text>
  <line x1="300" y1="22" x2="300" y2="72" stroke="#ef4444" stroke-width="1.25"/>
  <text x="300" y="82" text-anchor="middle" fill="#ef4444" font-size="7">weekly batch: Sunday</text>
  <path d="M114,66 l182,0" stroke="#ef4444" stroke-width="1" marker-end="url(#lg)"/>
  <text x="205" y="63" text-anchor="middle" fill="#ef4444" font-size="7" font-weight="700">5-day lag = lost engagement</text>
  <defs><marker id="lg" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5" fill="#ef4444"/></marker></defs>
  <text x="6" y="94" fill="var(--ink-low)" font-size="7">but batch keeps auditability, debuggability, one-click rollback — use online only if the gain is measured</text>
</svg>`,
    },
    recap: [
      `**Case for online:** weekly news recommender lags a crypto spike by 5 days; an online model surfaces it in minutes.`,
      `**But start with a measurement, not a preference:** is daily-retrained batch actually too slow on the metric you care about?`,
      `**Online gives up three things:** harder to debug (which update broke it?), audit (no fixed version), roll back (revert to what?).`,
      `**Algorithms:** FTRL for large sparse linear (ads), online SGD for linear/shallow. Deep models hit **catastrophic forgetting.**`,
      `**Catastrophic forgetting:** 2 weeks of crypto traffic → recommends only crypto. Fix with experience replay + elastic weight consolidation.`,
      `**Feedback loops:** predictions shape behavior → behavior becomes training data → bias compounds. Break with exploration (ε-greedy, Thompson).`,
      `**"More current is always better" is wrong:** batch has auditability, debuggability, one-click rollback. Use online only when the measured gain justifies it.`,
    ],
  },
]
