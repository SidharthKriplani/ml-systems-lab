export const PRODUCTION_MODULES = [
  {
    id: 'training_serving_skew',
    title: 'Training-Serving Skew',
    subtitle: 'Definition, causes, detection, remediation',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['training-serving skew', 'production ML', 'feature drift'],
    interactivePrompt: `Before you touch the controls: a fraud model was trained on Python-computed features and is served with a Java microservice computing the "same" features — would you expect them to agree?`,
    summary: `Your fraud model scored beautifully in offline testing. In production it is 15% worse. The features look right. No exception is thrown. The pipeline reports success every hour. So what broke?

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
        q: `Your model predicts churn well in offline evaluation but performs randomly in production. Feature distributions look similar at the aggregate level. What specific mechanisms do you investigate?`,
        options: [
          `A) Label definition mismatch, feature encoding mismatches, high null rates on key features in production, and prediction horizon differences — aggregate similarity masks skew in tail values and encoding mismatches`,
          `B) The model's learning rate was too high, causing instability that only shows under production load`,
          `C) Production servers use a different hardware architecture, changing floating-point precision enough to shift predictions`,
          `D) The model is overfitting to the validation set, so aggregate feature similarity guarantees it will fail on new data`,
        ],
        answer: `A`,
      },
      {
        q: `You find that a "user_7d_purchase_count" feature has PSI=0.35 between training and production. What is the investigation and remediation process?`,
        options: [
          `A) PSI=0.35 is within normal range — only values above 1.0 require action, so no investigation is needed`,
          `B) Immediately retrain the model on production data to match the new distribution, then redeploy`,
          `C) Check aggregation window alignment, data source completeness, distribution bucket contributions, and feature staleness; once root cause is found, align code paths or fix data freshness, then recalibrate`,
          `D) Replace the feature with a 30-day window to smooth out the variance causing the PSI spike`,
        ],
        answer: `C`,
      },
      {
        q: `A model is trained with a StandardScaler fit on training data. How do you ensure the scaler is applied correctly at serving, and what goes wrong if it is not?`,
        options: [
          `A) Refit the scaler on incoming production batches weekly so it stays current — a stale scaler is the main risk`,
          `B) Serialize the fitted scaler alongside the model weights; at serving, load the same fitted scaler. Re-fitting or using a different scaler causes mean/std shifts that place feature values outside the range the model trained on`,
          `C) The scaler only matters during training; once the model learns the normalized weights, the scaler can be discarded at serving`,
          `D) StandardScaler parameters are invariant to dataset changes, so the serving scaler will produce the same output regardless of where it was fit`,
        ],
        answer: `B`,
      },
      {
        q: `A model trained on historical data uses a "days_since_last_login" feature. At training time, this was computed relative to today's date. Explain the skew this creates and how to fix it.`,
        options: [
          `A) The skew is negligible because the model learns to adjust for the time offset during training`,
          `B) The skew causes the feature to be systematically larger in production, but this can be corrected by subtracting the deployment date from serving values`,
          `C) Training anchors the feature to the pipeline run date, so at serving months later all active users appear to have much larger values than the model trained on; fix by computing relative to the observation event timestamp in both training and serving`,
          `D) Computing relative to today's date is correct practice — both training and serving use the same reference point, so there is no skew`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Training-serving skew is an infrastructure problem, not a modeling problem. A model cannot compensate for receiving different feature values than it was trained on. Two separately maintained codepaths will always drift. The only reliable fix is a single shared computation function with serialized preprocessing parameters — anything else is relying on discipline that will eventually fail at the worst moment.`,
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
        q: `You are building a loan default prediction model with a "total_outstanding_loan_balance" feature. Describe the exact implementation for training and serving, including the point-in-time join logic.`,
        options: [
          `A) For training, use today's balance for all historical examples because it reflects the most accurate current state; for serving, also use current balance — consistency between the two is what matters`,
          `B) For training, retrieve balance using a temporal join (SUM where loan_opened <= label_date AND not yet closed), excluding future loans; for serving, run the same logic at current time using a shared function; monitor PSI weekly`,
          `C) For training, use a daily snapshot table averaged over the prior month; for serving, call the same snapshot API — the averaging reduces the impact of point-in-time errors`,
          `D) Balance features are exempt from point-in-time requirements because financial data is audited and therefore always accurate at query time`,
        ],
        answer: `B`,
      },
      {
        q: `Your team is rebuilding a feature pipeline that has a known bug affecting 5% of users. You need to retrain the model with corrected features. What are the risks?`,
        options: [
          `A) There are no significant risks — fixing a known bug always produces a safer model regardless of the order of operations`,
          `B) The main risk is that retraining takes too long and the model goes stale while the pipeline is being fixed`,
          `C) The retrained model expects correct features but serving may still produce buggy features; the dangerous anti-pattern is retraining on corrected features while still serving buggy ones — fix serving first, then backfill, then retrain`,
          `D) The risk is that corrected features will have a different distribution than what the model expects, so the only safe option is to deploy without retraining`,
        ],
        answer: `C`,
      },
      {
        q: `Explain why a 30-day rolling average feature is particularly prone to training-serving skew.`,
        options: [
          `A) Rolling averages are inherently unstable and should be replaced with simpler cumulative sums to avoid skew`,
          `B) The 30-day window aggregates enough data to smooth out any skew — rolling averages are actually among the most skew-resistant feature types`,
          `C) Differences in reference timestamp, timezone handling, null treatment, and deduplication logic compound across 30 days of data; using a centralized feature store with a single authoritative pipeline is the fix`,
          `D) Rolling averages are prone to skew only when the lookback window exceeds 7 days; 30-day windows are too long for reliable training-serving consistency`,
        ],
        answer: `C`,
      },
      {
        q: `A product team wants to add a real-time "user_session_length_so_far" feature to a fraud detection model. Latency SLA is 20ms. How do you evaluate and implement this?`,
        options: [
          `A) Reject the feature immediately — any real-time feature will violate a 20ms SLA due to the overhead of Redis lookups`,
          `B) Implement it as a daily batch feature and accept up to 24h staleness — real-time session features are too operationally complex for fraud systems`,
          `C) First verify offline predictive value; if significant, store session_start_time in Redis (sub-ms lookup), compute session_length = now() - start at serving; for training, replay session events from logs to reconstruct session lengths at fraud event time`,
          `D) Compute session length from the full event log at inference time — querying historical events is more accurate than maintaining session state in Redis`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Training-serving skew is not discovered through monitoring — it is prevented by building a single feature computation path that makes two diverging implementations structurally impossible.`,
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
        q: `A data scientist wants to reuse "user_30d_purchase_count" computed by another team. What does the feature store provide to make this safe?`,
        options: [
          `A) The feature store provides a copy of the raw data so each team can recompute the feature with their own logic`,
          `B) The feature store provides the exact computation definition, data type/range, freshness SLA, upstream lineage, current consumers, and owner — plus handles all serving logistics so no custom retrieval code is needed`,
          `C) The feature store provides only the serving infrastructure; definition details must still be obtained by asking the owning team`,
          `D) The feature store guarantees identical values only if both teams use the same model architecture`,
        ],
        answer: `B`,
      },
      {
        q: `Your online store (Redis) is serving a feature at 3ms P50 but 800ms P99. What is causing this and how do you fix it?`,
        options: [
          `A) P99 spike to 800ms while P50 is 3ms indicates systematic overload — all requests are queued and the P50 measurement is wrong`,
          `B) The feature value is too large to serialize; compress all feature vectors before storing in Redis`,
          `C) Likely causes include hot key problem on popular entities, Redis memory pressure causing evictions, network packet loss, or large feature vector deserialization; fixes include key hashing to distribute shards, monitoring hit rate and adding capacity, and implementing a circuit breaker with a 50ms timeout`,
          `D) Redis P99 spikes are always caused by garbage collection pauses; upgrade to a Redis version with concurrent GC`,
        ],
        answer: `C`,
      },
      {
        q: `Describe the materialisation pipeline for a feature "user_last_7d_app_opens" that needs to be available in the online store with <5 minute staleness.`,
        options: [
          `A) Run a daily Spark batch job that recomputes the 7-day count for all users and writes to Redis; 5-minute staleness is achievable if the job is scheduled frequently enough`,
          `B) Use streaming materialisation: app open events go to Kafka, a Flink job maintains a rolling 7-day count per user and writes to Redis with a 7-day TTL every 5 minutes; for training, the Flink job also writes to S3 with timestamps for point-in-time joins`,
          `C) Maintain a running total in the application database and read it directly at serving time; database reads are fast enough to meet the 5-minute SLA`,
          `D) A 5-minute staleness SLA requires an in-memory compute cluster; Redis alone cannot guarantee sub-5-minute freshness`,
        ],
        answer: `B`,
      },
      {
        q: `A feature was deprecated 3 months ago but a model in production still uses it. The feature computation pipeline was shut down. What is the failure mode and how do you prevent it?`,
        options: [
          `A) The model will immediately throw a key-not-found exception when the feature is missing, causing a clear and detectable outage`,
          `B) The pipeline shutdown has no effect on production because feature values are cached in the model weights`,
          `C) Redis returns the last computed value until the TTL expires, after which it returns null; the model silently imputes null as a default, causing gradual prediction degradation with no exception thrown; prevention requires registry lineage checks before deprecation, soft-deprecation alerts to consumers, and null rate monitoring`,
          `D) The failure mode only occurs if the model was retrained after the pipeline shutdown; models never read stale feature values from Redis`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `A feature store is not storage — it is the infrastructure that makes training-serving consistency a structural property rather than an agreement between engineers who will eventually disagree.`,
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
          `A) A P99 spike while P50 is normal is just statistical noise in the tail; ignore it and monitor the P50 trend instead`,
          `B) High P99 retrieval latency causes the serving endpoint to timeout or fall back to null/default features; investigate Redis metrics (hot keys, memory eviction, shard distribution), implement a circuit breaker with a 50ms timeout, and scale the Redis cluster`,
          `C) The model itself is running slowly due to a software regression; P99 feature retrieval latency is always caused by model inference time`,
          `D) Degrade gracefully by disabling all personalization features until P99 returns to baseline — feature retrieval is non-essential`,
        ],
        answer: `B`,
      },
      {
        q: `A new product launches with 10,000 new items. The recommendation model starts showing these items at very low rankings. Why and how do you fix it?`,
        options: [
          `A) New items rank low because the model correctly infers that items with no purchase history are low quality`,
          `B) New items have null or zero engagement features (clicks, purchases, views), causing the model to rank them as low-engagement items rather than unknown items; fix with content-based features, exploration injection, warm-start from similar items, and Bayesian smoothing`,
          `C) The recommendation model needs to be retrained on the new items before it can rank them; low rankings are expected until the next training cycle`,
          `D) New items rank low because of a cold-start problem in the user side, not the item side — the fix is to update user features more frequently`,
        ],
        answer: `B`,
      },
      {
        q: `Explain how a feature version change from "purchase_count_7d" to "purchase_count_30d" with the same feature name would manifest in model performance over time.`,
        options: [
          `A) The model would immediately produce errors because the value range has changed, triggering schema validation alerts`,
          `B) Performance would improve because the 30-day window provides more signal; version changes under the same name are encouraged when the new version is strictly better`,
          `C) The model would receive values approximately 4x larger than it trained on, causing systematically inflated predictions; prediction score distribution monitoring would show a sudden upward shift; always create new feature versions with new names, never update semantics in-place`,
          `D) The effect would be negligible because models learn relative patterns rather than absolute feature values`,
        ],
        answer: `C`,
      },
      {
        q: `How do you implement a testing strategy for a feature pipeline to catch backfill inconsistencies before they reach training data?`,
        options: [
          `A) Run the new pipeline on live data only — backfill testing is unnecessary because historical data is immutable`,
          `B) Store expected feature values for 100 sampled entities at 10 historical timestamps; on pipeline changes, assert recomputed values match within tolerance; also run PSI comparison between old and new pipeline on the same date range; fail and alert before backfilled data enters training`,
          `C) Compare the new pipeline's output schema against the old schema; if column names and types match, the backfill is consistent`,
          `D) Backfill inconsistencies can only be caught after model retraining by comparing offline AUC between old and new models`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Feature store failures are silent — no exception fires when a feature is stale, null, or semantically different from what the model expects, and the only mechanism that finds them before users do is explicit monitoring that you built specifically for that purpose.`,
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
    title: 'Late-Arriving Data',
    subtitle: 'Watermarking, streaming late data handling, impact on labels, remediation',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['late data', 'streaming', 'watermark', 'label quality'],
    summary: `A fraud system scores an order the instant it is placed — call that T+0. The truth about that order arrives much later: a fraudulent chargeback gets filed 7 days on. That chargeback *is* the label. But your training job runs daily and can only trust labels that have had time to settle. So the most recent week of your training data shows almost no fraud — not because fraud stopped, but because the evidence hasn't shown up yet. This is **label delay,** and it is everywhere that the truth arrives after the thing you're predicting.

---

**Don't guess the wait — measure it.**

The lazy fix is "just wait longer before training." It works, but it throws away recency. The real fix is to learn the *shape* of the delay: for your data, what fraction of chargebacks are in by day 1, day 3, day 7? That's the **completeness curve.** At 50% completeness you have half the labels; at 95%, nearly all. Set your incubation period — how long before you call a label final — at the 99th percentile of that curve, not at some round number that felt about right.

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
        q: `You are training a click model for mobile ads. Labels are generated 1 hour after impression. You find the model has much lower precision on mobile than desktop. Why?`,
        options: [
          `A) Mobile users inherently have lower CTR than desktop users due to smaller screen size reducing click accuracy`,
          `B) Mobile devices batch-upload events when reconnected, so clicks arrive 2-12 hours after the 1-hour cutoff and are labeled as no-clicks; the model learns a spuriously low mobile CTR; fix by measuring click lateness by platform and extending mobile label incubation to 24-48h`,
          `C) The model's features are desktop-optimized; adding mobile-specific features like screen size will equalize precision`,
          `D) Label generation should never use a fixed cutoff — use an infinite window and retrain when all events have arrived`,
        ],
        answer: `B`,
      },
      {
        q: `A Flink streaming job computes "user_session_click_count" in a 30-minute tumbling window with 5-minute allowed lateness. An event arrives 8 minutes late. What happens to the feature?`,
        options: [
          `A) Flink automatically extends the allowed_lateness to accommodate the late event and recomputes the window`,
          `B) The event is buffered and incorporated into the next window's computation`,
          `C) The event falls outside the 5-minute allowed_lateness window and is dropped (or routed to a side output); the session click count underestimates by at least one click; increasing allowed_lateness to 15 minutes would capture it but delay all window outputs`,
          `D) The window remains open indefinitely until all late events arrive, then closes with the complete count`,
        ],
        answer: `C`,
      },
      {
        q: `Your fraud model trains on features at transaction time with labels available 7 days later (when chargebacks are processed). The last 7 days of data in your training set have systematically lower fraud rates than older data. Why?`,
        options: [
          `A) Fraud rates are genuinely lower in recent data because the model's production deployment has reduced fraud`,
          `B) This is delayed feedback bias — transactions from the last 7 days have not yet received chargebacks, so they show near-zero positive labels; the model learns recent traffic is inherently safe; fix by excluding data newer than the chargeback resolution time from training labels`,
          `C) Recent data is lower quality because the data pipeline has not had time to process it fully; exclude the last 7 days from all features, not just labels`,
          `D) The lower fraud rate in recent data is correct — fraudsters adapt and become less detectable over time, which the training set accurately reflects`,
        ],
        answer: `B`,
      },
      {
        q: `Design a label generation system for a recommender model where user engagement signals arrive with varying latency (watch completion: 0-2h, like: 0-7d, share: 0-30d).`,
        options: [
          `A) Wait 30 days for all signals before generating any labels — using incomplete data corrupts the model more than the training delay costs`,
          `B) Use only watch completion as the label since it arrives quickly and is the most reliable signal; discard likes and shares`,
          `C) Define per-signal incubation periods (watch at t+4h, like at t+10d, share at t+35d); generate multi-stage labels or use completeness-weighted labels for real-time retraining; monitor completeness curves quarterly`,
          `D) Use a single 24-hour cutoff for all signals and apply equal weight — this balances recency and completeness`,
        ],
        answer: `C`,
      },
    ],
    takeaway: `Label delay and late-arriving events are not edge cases — they are structural properties of asynchronous systems, and the only safe design measures the actual completeness curve for your specific data source rather than assuming any default.`,
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
        q: `Your training pipeline runs successfully every day, but model performance has been slowly degrading over 3 weeks with no code changes. How do you diagnose this?`,
        options: [
          `A) Three weeks of gradual degradation with no code changes is expected model decay; redeploy the same model to reset the staleness counter`,
          `B) Check per-feature PSI over time, null rate trends, label distribution shifts, data volume changes, and upstream schema changes over the 3-week period — gradual degradation without spikes points to distribution drift, not a sudden failure`,
          `C) Rerun the pipeline with verbose logging to capture any silent exceptions that must be causing the degradation`,
          `D) Gradual degradation is always caused by concept drift; retrain immediately on the most recent 7 days of data`,
        ],
        answer: `B`,
      },
      {
        q: `You add a new upstream data source to your feature pipeline. How do you validate data quality before using it in training?`,
        options: [
          `A) If the pipeline runs without exceptions, the data source is valid — schema errors would fail the job`,
          `B) Validate schema and non-null constraints, verify row counts by date for continuity, inspect distributions against domain expectations, measure join quality with the main entity table, and validate historical backfill PSI against any overlapping period`,
          `C) Run a sample of 100 rows through the feature pipeline; if output looks reasonable, approve the data source`,
          `D) Data quality validation is only needed for existing data sources; new sources are assumed clean until proven otherwise`,
        ],
        answer: `B`,
      },
      {
        q: `A feature pipeline runs successfully but produces the wrong values — all "user_account_age" values are approximately 365 days regardless of actual account age. How does data validation catch this?`,
        options: [
          `A) Range validation would catch this because 365 is outside the valid range for account age`,
          `B) Schema validation catches this because the data type changes when values are computed incorrectly`,
          `C) Variance/standard deviation expectations catch this — a constant or near-constant feature produces a standard deviation near zero, which would fail an expect_column_stdev_to_be_between assertion even though individual values pass range checks`,
          `D) This bug cannot be caught by automated data validation; it requires manual inspection of sampled records`,
        ],
        answer: `C`,
      },
      {
        q: `How do you implement data quality checks that catch issues before they affect model training, without slowing down the pipeline significantly?`,
        options: [
          `A) Run all data quality checks after model training completes so they don't block the pipeline`,
          `B) Use a stratified strategy: real-time schema validation at ingestion (<1ms per record), fast statistical checks after each batch (<5 min), and full distribution PSI checks daily before training; gate training on all checks passing — quality check cost is under 5% of pipeline runtime`,
          `C) Sample 1% of records for quality checks and extrapolate; full dataset validation is too slow for daily pipelines`,
          `D) Data quality checks should run in a separate pipeline that does not block model training — alerts can be addressed after the model is deployed`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Bad data throws no exceptions — the only thing that distinguishes "pipeline ran" from "pipeline ran on data the model was trained to handle" is data quality assertions you wrote before the incident happened.`,
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
          `A) Collect 500-1000 gold-labeled examples; write labeling functions (regex, topic classifiers, rule heuristics); analyze coverage and accuracy on gold set; train a Snorkel label model to aggregate functions; train a discriminative end model on probabilistic labels; iterate`,
          `B) Use a large language model to label all examples in a single pass — LLMs are more accurate than programmatic labeling functions and require no iteration`,
          `C) Start by training a BERT model on a small labeled set, then use it to pseudo-label the full corpus at a 0.9 confidence threshold`,
          `D) Programmatic labeling only works for binary classification; for multi-class content moderation, human annotation is required`,
        ],
        answer: `A`,
      },
      {
        q: `Your model achieves 92% test accuracy, but manual inspection reveals it is wrong on most examples involving a specific demographic group. What is happening and how do you fix it?`,
        options: [
          `A) The model is correct — 92% overall accuracy means performance is acceptable across all groups`,
          `B) The demographic group must be outside the model's training distribution; add more data from that group and retrain`,
          `C) The group is underrepresented in the test set so its low accuracy is hidden in aggregate metrics; likely also reflects systematic labeling bias; fix by computing per-group metrics, auditing labels with confident learning, reweighting the minority class, and adding per-group gates to deployment criteria`,
          `D) High aggregate accuracy with demographic disparity is purely a sampling artifact that resolves with a larger test set`,
        ],
        answer: `C`,
      },
      {
        q: `You have 10,000 examples labelled by humans with inter-annotator agreement of kappa=0.45. How do you handle this in model training?`,
        options: [
          `A) kappa=0.45 is acceptable — proceed with majority-vote labels and standard cross-entropy training`,
          `B) Diagnose whether ambiguity is task-inherent or guideline-unclear; use label smoothing (epsilon ~0.15), soft labels (mean annotator agreement as probability), and consider multi-annotator training; revise guidelines and relabel boundary cases`,
          `C) Discard the dataset entirely — kappa below 0.6 means the data is unusable for any model training`,
          `D) Increase the number of annotators per example until kappa exceeds 0.6, then proceed with standard training`,
        ],
        answer: `B`,
      },
      {
        q: `What is the failure mode of using a model trained on weak labels to generate more labels for the same dataset, and how do you avoid it?`,
        options: [
          `A) The only failure mode is computational cost — the model takes too long to label the full dataset`,
          `B) The model trained on weak labels contains the same biases as the weak labels; using it to label the same data it trained on creates a circular feedback loop that amplifies errors and produces overconfident wrong labels; avoid by applying model-generated labels only to held-out data and retaining gold labels as the authoritative reference`,
          `C) There is no failure mode — a model trained on weak labels will always produce higher-quality labels than the original weak supervision source`,
          `D) The failure mode is that model-generated labels are too similar to human labels, reducing training diversity`,
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
        q: `Your daily retraining pipeline fails on day 3 because the upstream data source was unavailable. How do you design the system to handle this gracefully?`,
        options: [
          `A) Configure the pipeline to train on whatever data is available and deploy the resulting model — partial data is better than no update`,
          `B) Use a data availability sensor at pipeline start; if data doesn't arrive within N hours, fail fast and alert; continue serving the last good model; ensure idempotent backfill with upsert semantics once data recovers; use automatic retry with backoff for transient failures`,
          `C) Increase the pipeline's memory allocation so it can cache the previous day's data as a fallback`,
          `D) Switch to a streaming pipeline — batch pipelines are inherently fragile to upstream data unavailability`,
        ],
        answer: `B`,
      },
      {
        q: `You need to ensure that if a feature computation step fails and is rerun, it does not create duplicate records in your feature store. How do you design this?`,
        options: [
          `A) Add a deduplication step after every write using a SELECT DISTINCT query`,
          `B) Use UPSERT keyed on (entity_id, feature_name, computation_date) rather than INSERT; for Parquet stores, overwrite the partition atomically; use deterministic computation (fixed shuffle seeds, no current_timestamp for windows); verify idempotency in CI by running the step twice and asserting identical output`,
          `C) Use a distributed lock to prevent concurrent runs — the duplicate problem only occurs when two pipeline runs overlap`,
          `D) Idempotency is only needed for streaming pipelines; batch pipelines can safely use INSERT because retries are rare`,
        ],
        answer: `B`,
      },
      {
        q: `A model is retrained daily. You discover that 4 days ago, a bug was introduced in the feature computation that corrupted 3 features. What is the remediation process?`,
        options: [
          `A) Retrain with the buggy features and deploy immediately — the model will learn to compensate for the corruption`,
          `B) Halt training; audit all models trained in the past 4 days via lineage; rollback production to the last pre-bug model; fix the bug and backfill the 4 corrupted date partitions; validate backfilled distributions against pre-bug values; retrain and promote; add a regression test for the bug pattern`,
          `C) Delete the corrupted training data and retrain from scratch on historical data only`,
          `D) Deploy a hotfix to the serving pipeline to correct the features at inference time; no retraining is needed`,
        ],
        answer: `B`,
      },
      {
        q: `What is the difference between a pipeline failure and a pipeline bug, and why does this distinction matter for ML systems?`,
        options: [
          `A) There is no meaningful distinction — both result in a model that underperforms and should be handled the same way`,
          `B) A failure is detectable (pipeline throws an error, monitoring catches it, alerts fire); a bug is silent (pipeline succeeds, produces wrong data, model trains and deploys, and degradation surfaces weeks later through business metrics); only data quality assertions on outputs guard against bugs — monitoring success status alone is not sufficient`,
          `C) A pipeline failure affects only the current training run; a bug affects all future runs until fixed`,
          `D) Failures are caused by infrastructure issues; bugs are caused by bad data — both require the same response of rolling back to the last good model`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `A pipeline that reports success tells you nothing about whether it produced correct data — the gap between "ran without errors" and "produced correct outputs" is exactly where silent bugs live, and only data quality assertions on pipeline outputs close it.`,
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
        q: `Your production model is found to be biased against a demographic group after deployment. How does the model registry help you remediate?`,
        options: [
          `A) The registry helps by providing the model's source code so the bias can be manually patched without retraining`,
          `B) Query the registry for the previous production version and promote it back to Production for fast rollback; use lineage to reproduce the training run and identify the data bias; add fairness gates to deployment criteria; retrain with the data issue fixed and verify the new model passes the gates before promotion`,
          `C) The model registry is only useful for rollback, not for diagnosing bias — a separate bias detection tool is required`,
          `D) Delete the biased model from the registry to ensure it cannot be accidentally redeployed`,
        ],
        answer: `B`,
      },
      {
        q: `Two data scientists train models independently using different hyperparameters. How does experiment tracking in the registry help them collaborate and pick the best model?`,
        options: [
          `A) Experiment tracking only stores final metrics; comparing training dynamics requires sharing raw log files between data scientists`,
          `B) Both log all hyperparameters, metrics, and dataset versions to the same experiment; the comparison UI shows all runs sortable by any metric with full reproducibility; training curve comparisons reveal if models learned differently; lineage prevents the "which model file is this?" problem`,
          `C) Experiment tracking is redundant if both scientists use the same codebase and share hyperparameter configs via version control`,
          `D) The registry picks the best model automatically based on validation AUC — no collaboration is needed`,
        ],
        answer: `B`,
      },
      {
        q: `You need to deploy a model to 3 different environments (dev, staging, prod) with different data schemas in each. How do you design the registry to handle this?`,
        options: [
          `A) Maintain three separate model registries, one per environment — sharing a registry across environments creates schema conflicts`,
          `B) Store environment-specific config (schema, thresholds) separately from model weights; associate (model_version, env, config_version) at promotion; run schema compatibility gates before each environment promotion; enforce dev → staging → prod ordering with manual approval at the prod gate`,
          `C) Store only one model version per registry entry and let each environment apply its own preprocessing at inference time`,
          `D) Deploy the same artifact to all three environments and rely on environment variables to handle schema differences at runtime`,
        ],
        answer: `B`,
      },
      {
        q: `A model trained 6 months ago is performing better than a newly retrained model on the holdout set. What does this tell you about your data pipeline, and how does the registry help debug it?`,
        options: [
          `A) The older model is better because it was trained on more historical data; always prefer older models for stability`,
          `B) This signals a data pipeline regression — likely a feature bug, label quality degradation, or training window change introduced in the last 6 months; use lineage to compare exact dataset versions and feature definitions between the two models; compare feature distributions and label rates to identify what changed`,
          `C) The holdout set has drifted and no longer represents production; discard both models and retrain on the most recent data`,
          `D) Newly retrained models always underperform older models on holdout sets because they overfit to recent data; this is expected behavior`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `The three questions that matter during a production incident — what is live, what produced it, what is the rollback target — have no reliable answers without mandatory lineage and programmatic gates enforced by the registry.`,
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
        q: `You run an A/B test with 50/50 split. Analysis shows 52% of unique users are in treatment, 48% in control. What do you do before looking at metrics?`,
        options: [
          `A) Proceed with analysis but apply a statistical correction to adjust for the 2% imbalance`,
          `B) Do not look at primary metrics — SRM indicates a systematic assignment or logging bug making the groups non-comparable; debug the hash function, bot filtering, session/user assignment mismatch, and logging coverage; restart the experiment after fixing the root cause`,
          `C) The 52/48 split is within acceptable statistical variance for a 50/50 experiment; proceed with analysis`,
          `D) Discard the treatment group entirely and rerun with only the control group as a baseline`,
        ],
        answer: `B`,
      },
      {
        q: `Your A/B test shows a 5% lift in click-through rate. The experiment ran for 3 days. What validity threats should you consider before claiming the win?`,
        options: [
          `A) A statistically significant result at 3 days is valid regardless of duration — significance means the result is real`,
          `B) Day-of-week effects (3 days may miss the weekly cycle), novelty effect (users clicking because it's new, not better), peeking/early stopping bias, SRM, and post-hoc metric selection all threaten validity; run for at least 7-14 days before declaring a win`,
          `C) The only validity threat is sample size — if the confidence interval is narrow, the result is valid at any duration`,
          `D) Three-day experiments are only invalid for negative results; positive results are inherently more reliable`,
        ],
        answer: `B`,
      },
      {
        q: `How do you design an A/B infrastructure for testing ML model changes when models have different computational costs and serving latency?`,
        options: [
          `A) Test models in separate sequential experiments to avoid latency confounding — never A/B test models with different serving times simultaneously`,
          `B) Ensure both models meet the latency SLA before launch; run a canary first (1-5% traffic) to catch errors; route assignment before model execution; log model_version with every prediction and outcome; ensure model assignment and experiment assignment share the same request context`,
          `C) Use the faster model as control and the slower model as treatment — this naturally accounts for any latency differences in the analysis`,
          `D) Latency differences between models are irrelevant to A/B validity as long as the sample sizes are equal`,
        ],
        answer: `B`,
      },
      {
        q: `A marketplace A/B test treats seller-side UI (treated sellers get a new dashboard). Control sellers are unaffected. But analysis shows control buyer behaviour also changed. What is happening?`,
        options: [
          `A) The control group has been contaminated by a separate unrelated experiment running concurrently`,
          `B) This is network interference (SUTVA violation) — treated sellers change behavior (pricing, listings, response time) which directly affects buyers interacting with those sellers in the control group; remedies include cluster randomisation by geographic market, switchback designs, or bipartite experiment estimators`,
          `C) Control buyer behaviour changing is expected and should be factored into the primary metric calculation`,
          `D) The buyer-side change proves the seller UI treatment is working as intended; this validates the experiment result`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `A biased assignment generates a p-value, a confidence interval, and a recommendation — every number in the chain is invalid, no alarm fires, and there is no statistical correction for a compromised experiment.`,
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
        q: `Your fraud detection model's precision starts dropping 3 weeks after deployment with no code changes. Feature distributions are stable. What is the most likely cause and what do you do?`,
        options: [
          `A) Stable features with dropping precision means the model was undertrained; increase training epochs and redeploy`,
          `B) This is most likely real concept drift — fraudsters have adapted and the relationship P(fraud|features) has changed; investigate false positive clusters for new fraud patterns, compare recent false positives to historical true positives, retrain with recency-weighted recent data, and shorten the retraining cycle`,
          `C) Stable feature distributions guarantee stable model performance; the precision drop must be a monitoring artifact`,
          `D) Precision dropping without feature drift means the positive rate in production has increased; recalibrate the decision threshold to match the new base rate`,
        ],
        answer: `B`,
      },
      {
        q: `You are deploying a new recommendation model. Walk through the shadow mode and canary release process.`,
        options: [
          `A) Deploy directly to 50% traffic, monitor for 24 hours, then promote to 100% if metrics are stable`,
          `B) Shadow mode (1-2 weeks): deploy alongside production, log both models' predictions without serving the challenger; check edge cases, errors, and score distributions; canary: step from 1% → 5% → 10% → 25% → 50% → 100% with metric gates at each step and automatic rollback if CTR drops > 2% or P99 latency exceeds SLA`,
          `C) Shadow mode is only needed for models with significantly different architectures; for same-architecture models, go directly to canary at 10%`,
          `D) Skip shadow mode and run the canary for 3 days at 50% — a longer canary period is more informative than shadow mode`,
        ],
        answer: `B`,
      },
      {
        q: `A streaming recommendation model is trained online (each user interaction updates the model weights immediately). After 2 weeks, you notice the model systematically recommends items from only 3 categories. What has happened?`,
        options: [
          `A) The model has correctly identified the 3 most popular categories and is optimizing for engagement`,
          `B) Catastrophic forgetting from recency bias — recent 2-week category skew has overwritten knowledge of other categories through repeated SGD updates; fix with rehearsal (replay buffer of diverse historical examples), reduced learning rate, elastic weight consolidation, or limiting online learning to a shallow adapter layer`,
          `C) Three-category collapse is a common initialization artifact in recommendation models; reinitialize the embedding layer and retrain`,
          `D) Online learning cannot cause category collapse; the issue is in the feature pipeline producing biased category features`,
        ],
        answer: `B`,
      },
      {
        q: `Define covariate shift, label shift, and concept drift precisely. For each, describe whether retraining is required and what other interventions are available.`,
        options: [
          `A) All three types of drift require immediate full retraining — distinguishing between them is academic`,
          `B) Covariate shift (P(X) changes, P(Y|X) stable): importance weighting can correct without retraining if new values are in training support; label shift (P(Y) changes, P(X|Y) stable): threshold recalibration or prior correction may suffice; concept drift (P(Y|X) changes): retraining required, no weighting or threshold fix corrects a changed underlying relationship`,
          `C) Covariate shift requires retraining; label shift and concept drift can both be fixed with threshold recalibration`,
          `D) Only concept drift requires intervention; covariate shift and label shift self-correct as the model receives more data`,
        ],
        answer: `B`,
      },
    ],
    takeaway: `Online learning solves a real problem — retraining latency — but creates three new ones: feedback loops, catastrophic forgetting, and a continuously changing model that cannot be audited, debugged, or rolled back the way a batch-trained model can; use it only when the measurement shows the tradeoff is worth it.`,
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
