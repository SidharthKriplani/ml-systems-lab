export const PRODUCTION_MODULES = [
  {
    id: 'training_serving_skew',
    title: 'Training-Serving Skew',
    subtitle: 'Definition, causes, detection, remediation',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['training-serving skew', 'production ML', 'feature drift'],
    interactivePrompt: `Before you touch the controls: a fraud model was trained on Python-computed features and is served with a Java microservice computing the "same" features — would you expect them to agree?`,
    summary: `Your fraud detection model is performing 15% worse in production than it did in offline evaluation. The features look right. No exception has been thrown. The pipeline reports success every hour. What happened?

The culprit is one feature: "number of transactions in the last 7 days." During training, you computed it from a historical database with exact counts. In production, it comes from a real-time streaming service using approximate counting with probabilistic data structures — HyperLogLog under the hood. The values are close but not identical. For power users with high transaction volume, the approximation error is large enough to shift predictions meaningfully. The model was trained on exact counts and is being evaluated on approximate counts. Training-serving skew.

This is not an exotic edge case. It is one of the most common failures in production ML. The moment you compute features in one environment and serve them in another, skew is possible. And it is entirely silent — no alarm sounds when the database returns 47 and the streaming service returns 43.

There are five distinct root causes. First, feature computation mismatch: training uses Python, serving uses Java, and floating-point rounding differences compound across operations. Second, data freshness: training features are computed offline from a full historical record; serving features are real-time with inherent staleness and approximation. Third, schema drift: the serving pipeline changes column ordering, but the model was trained expecting a fixed feature vector layout. Fourth, preprocessing mismatch: the StandardScaler was fit on training data with mean=120 and std=45, but the serving code either refits on production data or assumes default parameters — the normalized values land in a completely different range. Fifth, label leakage: training used features computed with information not available at serving time, inflating offline metrics against data the model will never see in production.

**NOT this.** Most people assume training-serving skew only happens in large organizations with complex infrastructure. Actually, it occurs in every ML project the moment training and serving have separate codepaths. A two-person team with a simple scikit-learn model and a Flask endpoint has exactly the same risk. The complexity of the infrastructure is irrelevant. What matters is whether the feature computation logic is truly identical — not equivalent, not similar, but identical.

The fix is a feature store: a single feature computation layer that serves both training and serving from the same code. For the fraud model, that means the same function computes transaction counts whether you are building a training dataset or answering a real-time scoring request. Log-and-replay validation catches any remaining skew: record all production input features alongside predictions, then run offline evaluation on those logged features and compare to actual production performance. Any gap is skew.

Formally: training-serving skew is the divergence between the feature distribution at training time and the feature distribution at serving time, when that divergence arises from the production environment rather than genuine data drift. Prevention requires that every feature transformation is identically reproducible across both environments, with the same data sources, the same computation logic, and the same preprocessing parameters serialized into the model artifact.`,
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
  },
  {
    id: 'feature_engineering_prod',
    title: 'Feature Engineering in Production',
    subtitle: 'Online vs offline features, point-in-time joins, backfill risk',
    difficulty: 'intermediate',
    estimatedMin: 30,
    tags: ['feature engineering', 'online features', 'point-in-time', 'backfill'],
    summary: `The failure that bites hardest in feature engineering is not a computation error — it is using feature values from the wrong time. If training computes "user's 30-day purchase count" using today's values for historical label events, the feature reflects purchases that happened after the label date. Offline AUC looks great because the model trained on leaky features.

The model ships. In production, the same computation uses only purchases up to the current request time — the feature value it sees is always different from what it trained on. Performance is silently worse than evaluation predicted. This pattern repeats across online versus offline feature discrepancies, backfill pipeline differences, and staleness mismatches.

The fix requires being explicit about every feature's temporal boundary and enforcing that boundary identically in training and serving.`,
    keyPoints: [
      `**Offline features are computed in batch (hourly or daily), stored in a key-value store (Redis or DynamoDB), and retrieved at serving time.** Serving latency is under 5ms, making this the standard pattern for features that tolerate staleness. The risk: the feature value at inference may be hours or days old relative to the event being scored. Define a staleness SLA and alert when it is violated, rather than silently serving stale values.`,
      `**Online features are computed in real-time from live event streams — always fresh, but operationally demanding.** The computation must complete within the serving latency budget (typically under 20ms), must be available at 99.99%+ reliability, and must match the training computation exactly. Any discrepancy between real-time and batch computation is training-serving skew operating through a different channel.`,
      `**Point-in-time correct feature extraction requires that for each training sample with event timestamp t, you retrieve feature values as they existed at time t — not as they exist when the training pipeline runs. "Customer 30-day purchase count" must be the count in the 30 days ending at t, not at today.** This is enforced by a temporal join that retrieves the most recent feature value observed before the event timestamp.`,
      `**Temporal join implementation: SELECT feature_value FROM feature_table WHERE entity_id = ?** AND feature_timestamp <= event_timestamp ORDER BY feature_timestamp DESC LIMIT 1. This retrieves the most recent feature value that existed at the event time, not the current value. Getting this wrong — using the current value — produces training labels contaminated by future information and inflated offline metrics that collapse in production.`,
      `**Backfill risk: when recomputing historical features to regenerate a training dataset, the backfill pipeline may use data or code that was not available at the original event time.** A schema change, a bug fix, or an external data source update can cause backfilled features to differ from what the model would have originally seen. The training set then contains temporal leakage: offline metrics look better than production performance will actually be.`,
      `**Feature freshness SLA: define the maximum acceptable staleness per feature based on how quickly the underlying quantity changes. "User's current cart contents" requires under 1-second freshness. "User's 30-day purchase count" tolerates 1-hour staleness. "User's account age in days" tolerates 24-hour staleness.** SLA violations should trigger pipeline alerts, not silent degradation. A model predicting on a feature that is 48 hours stale when the SLA is 1 hour is operating on wrong information.`,
      `**Feature reuse through a feature store prevents definition drift.** When team A computes "user_active_days" and team B independently reimplements the same feature for a different model, subtle differences in null handling, window boundary conditions, and timezone treatment create two diverging implementations. A central feature store enforces a single definition consumed by all models — drift between teams becomes structurally impossible.`,
      `**Schema validation at serving time enforces the contract between training and production.** Validate feature types, value ranges, and null rates against the schema serialized from training. Log every violation and treat null-coercion-to-zero as a schema violation, not a silent default. A feature that silently becomes null in production (because an upstream join failed) gets imputed as zero — a value the model may never have trained on, which corrupts predictions without any error being thrown.`,
    ],
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
    takeaway: `Point-in-time correctness is not a nice-to-have. Using feature values from the wrong time leaks future information into training — offline AUC looks great, the model ships, and it fails silently in production on real data. Every feature must have an explicit temporal boundary, and that boundary must be enforced identically in training and serving. The gap between those two worlds is the job.`,
  },
  {
    id: 'feature_store',
    title: 'Feature Store Architecture',
    subtitle: 'Offline store, online store, registry, materialisation, latency SLAs',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['feature store', 'MLOps', 'architecture', 'feature serving'],
    summary: `Without a feature store, each team independently builds feature computation pipelines. Team A's "user_30d_purchase_count" is computed in PySpark; Team B recomputes the same concept in SQL for a different model. Subtle differences in null handling and window boundary conditions make the two implementations diverge. Neither team knows. Both models train on what they believe is the same feature. Both models serve different values. A feature store prevents this by centralizing feature computation into one canonical implementation with two storage backends: an offline store (historical values with timestamps, for point-in-time training data generation) and an online store (current values, for low-latency inference). A feature registry tracks which models consume which features, enforcing that deprecating a feature cannot silently break a downstream model. Without the store, training-serving consistency is something you hope for; with it, drift between implementations is structurally prevented.`,
    keyPoints: [
      `**The offline store holds historical feature values with timestamps and is used exclusively for training dataset generation via point-in-time joins.** Implemented in a data warehouse (BigQuery, Snowflake) or columnar storage (Parquet on S3). Query latency is irrelevant for batch training jobs, but the storage must support efficient temporal joins at scale — querying the most recent feature value per entity as of a given event timestamp.`,
      `**The online store serves current feature values at inference time with a P99 latency target under 10ms.** Implemented as a key-value store: Redis for in-memory speed, DynamoDB for horizontal scale, Cassandra for high-write-throughput. Only the most recent value per entity is stored — history lives in the offline store. Low latency is the single design constraint, and the backing store must be sized to hit it at the p99 of traffic peaks.`,
      `**The feature registry is the governance layer: feature name, computation definition, data types, owner, freshness SLA, upstream data dependencies, and which models currently consume each feature.** Without the registry, teams cannot discover existing features and duplicate work is inevitable. More critically, when a feature pipeline is shut down, the registry is the only way to identify which downstream models will be broken before the shutdown happens.`,
      `**Materialization is the process of computing features and writing them to the stores.** Batch materialization runs on a schedule — Spark or Airflow jobs writing to offline and online stores. Stream materialization routes Kafka events through Flink to the online store, enabling online features with under 1-second staleness. The choice between batch and stream materialization depends on the feature's freshness SLA and the operational cost of running streaming infrastructure.`,
      `**Point-in-time joins in the offline store are a native operation in managed feature stores (Feast, Tecton, Hopsworks) and a source of subtle bugs in custom SQL implementations.** The correct join condition is feature_event_time <= label_event_time — retrieve the most recent feature value that existed before the label event. Off-by-one errors in boundary conditions (using < vs <=, UTC vs local time) produce systematic temporal leakage that inflates offline metrics.`,
      `**Feature versioning prevents a schema change from silently breaking all downstream models.** When "user_purchase_count" changes its aggregation window from 7d to 30d, version the new definition as v2 while keeping v1 active for models trained on v1. Without versioning, the schema change propagates immediately to all consumers — models trained on 7d counts now receive 30d counts, their predictions change, and no error is thrown.`,
      `**Feature store economics: the initial investment (roughly 3-6 months of engineering time) breaks even when 5+ models share features.** Below that threshold, the coordination overhead of a shared platform may exceed the cost of independent pipelines. Above it, the redundant computation, consistency bugs, and engineering time spent debugging skew across pipelines exceed the platform cost within an 18-month window.`,
      `**Dual-write pattern for migration: when moving from legacy feature pipelines to a feature store, write to both the old pipeline and the new store simultaneously for 2-4 weeks, then compare outputs on a sample of entities across multiple historical timestamps.** This validates that the new store produces identical values before cutting over — and catches any implementation discrepancy before it affects a production model.`,
    ],
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
    takeaway: `A feature store is not a caching layer. It is the infrastructure that makes training-serving consistency enforceable rather than aspirational — by making it structurally impossible for training and serving to compute the same feature differently. Every team rebuilding features independently accumulates consistency debt. The feature store is how you stop paying that debt in production incidents rather than design decisions.`,
  },
  {
    id: 'feature_store_traps',
    title: 'Feature Store API Traps',
    subtitle: 'Stale features, cold-start, versioning, deprecation',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['feature store', 'cold start', 'staleness', 'versioning'],
    summary: `Feature stores introduce failure modes that look nothing like traditional software bugs. No exception is thrown when a feature is stale because the materialization pipeline failed overnight. No error fires when a new user's features are null because there is no feature history — the model receives a null and returns a confident but wrong prediction. No alarm sounds when a feature team silently upgrades "user_purchase_count" from a 7-day to a 30-day window under the same feature name.

The model trained on 7-day counts now receives 30-day counts, interprets them as 7-day values, and predictions shift without any detected error. In all these cases the model continues running. It returns plausible-looking numbers. The problem surfaces weeks later when a business metric declines and the incident trace says "looks like concept drift" until someone checks the null rate monitor.`,
    keyPoints: [
      `**Staleness: online store features stop updating when the materialization pipeline fails.** The model receives yesterday's features — or last week's features — with no runtime indication that the data is stale. Nothing in the API call tells you the data is hours old. The only protection is explicit staleness checking: include a feature_last_updated_timestamp in the serving response and alert when it exceeds the SLA.`,
      `**Cold-start for new entities: when a new user or item has no feature history, the feature store returns null or a store-default value.** Null propagation through the model's forward pass produces garbage predictions returned with full confidence. The model was never trained on null inputs for the vast majority of features — it learned to operate in the distribution of observed values, not in null space.`,
      `**Default value strategy for cold-start: use the population median from the training set, not zero.** Zero is often an extreme value in the training distribution — 0 purchases when the median is 5 pushes the model toward an extreme prediction that may not reflect a new user at all. Cold-start entities should also carry an explicit binary "is_new_entity" feature so the model can learn the cold-start regime as a distinct pattern rather than conflating it with established users who happen to have low feature values.`,
      `**Version drift: a feature team silently upgrades "user_purchase_count" from a 7-day to a 30-day aggregation window under the same feature name.** The model trained on 7-day counts now receives 30-day counts. The model interprets a 30-day value as if it were a 7-day value — for a user with stable purchase patterns, the 30-day count is approximately 4x larger, pushing the model's predictions systematically upward. No error fires. The fix: always create new feature versions with new names. Never update feature semantics in-place.`,
      `**Deprecation risk: when a feature's computation pipeline is shut down, its Redis keys expire over time as TTLs lapse.** The null rate in the online store rises from 0% to 100% over days. Model predictions degrade as more requests are imputed with defaults. The incident timeline will read "gradual degradation, possible concept drift" until someone correlates it with the pipeline shutdown. The prevention: query the registry for all downstream model consumers before shutting down any pipeline, and require acknowledgment before proceeding.`,
      `**Backfill inconsistency: when the online store pipeline fails and is backfilled from raw event data, the backfill code may use different aggregation windows, timezone handling, or deduplication logic than the original pipeline.** Feature values for the affected time period differ from what was originally computed, creating a distributional shift that looks like data corruption in monitoring but traces back to a code discrepancy in the backfill logic.`,
      `**Testing feature store pipelines requires regression tests on historical snapshots.** For 100 randomly-sampled entities at 10 historical timestamps, store the expected feature values from the original pipeline run. When the pipeline is changed, assert that recomputed values match stored values within tolerance. Distribution comparison across pipeline versions (PSI per feature) catches systematic shifts that individual entity comparisons miss.`,
      `**Null rate SLA: define the maximum acceptable null rate per feature (e.g., "user_7d_purchase_count" null rate must stay below 2%).** When null rate exceeds the SLA, the alert fires before model predictions have degraded significantly — there is time to investigate and remediate before the problem compounds. A null rate monitor is the earliest and most reliable signal for feature store failures.`,
    ],
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
    takeaway: `Feature store failures are silent — no exception fires when a feature is stale, null, or semantically different from what the model expects. Freshness monitoring, null rate alerts, and version governance are not optional add-ons. They are the only mechanism by which you find out before users do, rather than weeks after.`,
  },
  {
    id: 'late_arriving_data',
    title: 'Late-Arriving Data',
    subtitle: 'Watermarking, streaming late data handling, impact on labels, remediation',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['late data', 'streaming', 'watermark', 'label quality'],
    summary: `Late-arriving data corrupts ML systems in two distinct ways, and both are silent. When mobile click events arrive hours after the 1-hour label cutoff, they are classified as no-clicks — false negatives.

The model trains on systematically under-labeled data, learns a lower click-through rate than reality, and you spend months debugging why the model underperforms without looking at the label generation process. Separately, streaming aggregations computed before all events arrive produce incorrect feature values — a session click count that closes its window while 15% of clicks are still in transit will always underestimate sessions near the aggregation boundary. The completeness curve — the fraction of expected events received as a function of time since the originating event — is the empirical foundation for setting watermarks and label incubation periods. Without measuring it for your specific data source, every incubation period and watermark setting is a guess.`,
    keyPoints: [
      `**Watermarks in Flink/Spark streaming declare that all events with event_timestamp <= t have arrived.** Events arriving after the watermark are treated as late. Watermark policy: max_observed_event_time minus allowed_lateness, where allowed_lateness is the maximum expected delay measured from the completeness curve of your data source. Setting this without empirical measurement means either discarding significant fractions of real events (too tight) or delaying all window outputs unnecessarily (too loose).`,
      `**Late event handling involves a fundamental tradeoff.** Short allowed_lateness means windows close quickly and late events are dropped — fast output, incomplete aggregations. Long allowed_lateness means more completeness but longer delays before downstream consumers receive feature values. The right setting is not a default; it is derived from the empirical lateness distribution of your specific data source at a specified percentile of completeness.`,
      `**Label false negatives from late arrivals: for a click-through prediction model with labels generated 1 hour after impression, any click event arriving after the 1-hour cutoff is classified as no-click.** Mobile devices batch events during offline periods, producing arrivals 2-12 hours late. The positive class is systematically under-labeled, the model learns a lower CTR than the true rate, and the gap between model predictions and actual outcomes persists until the label incubation period is fixed.`,
      `**Delayed feedback bias in ad attribution: a user sees an ad impression at t=0 and a conversion event is attributed hours or days later.** Training on impressions with labels available only at t+7d means the most recent 7 days of training data have near-zero positive labels — events that will eventually be attributed have not been yet. The model learns that recent traffic is inherently low-converting, a temporal artifact rather than a real effect.`,
      `**Label incubation period: wait until 95-99% of expected outcome events have arrived before generating training labels.** Measure the lateness distribution for your specific data source empirically — median, 95th, and 99th percentile event lateness. Set the incubation cutoff at the 99th percentile. A training run that uses data from three days ago when the 99th percentile of attribution latency is five days will have systematically under-labeled positive examples in the most recent portion of the training window.`,
      `**Storing raw events in an append-only log rather than only pre-aggregated values enables recomputation of aggregations at any future point using all events received up to that time.** Pre-aggregated values computed before all events arrived cannot be corrected retroactively. This is more expensive to store and compute but is the only design that allows late-arrival correction without data loss.`,
      `**Monitoring label completeness requires plotting the fraction of expected events received as a function of hours since the originating event.** This completeness curve, measured per data source and per event type, tells you exactly when labels are stable enough for training. It must be re-measured whenever upstream systems change — a new mobile OS, a new attribution pipeline, or a new data collection method can shift the completeness curve significantly.`,
      `**Impression discounting for delayed feedback: rather than waiting for full incubation, assign partial labels weighted by expected completeness at training time from the completeness curve.** A conversion label at 3 days in a 7-day attribution window might be weighted 0.7 (expected completeness of 70% at day 3). This allows training on more recent data while accounting for the remaining uncertainty, at the cost of more complex label generation logic.`,
    ],
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
    takeaway: `Late-arriving data creates two distinct corruption patterns — incomplete streaming aggregations and under-labeled positive examples — and both are invisible without explicit monitoring. The incubation period and watermark settings must be derived from empirical completeness curves for your specific data source. Using defaults or estimates without measurement means the model is trained on systematically wrong labels and you will not know it until performance gaps surface much later.`,
  },
  {
    id: 'data_quality',
    title: 'Data Quality for ML',
    subtitle: 'Schema drift, distribution shift in features, null rates, automated validation',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['data quality', 'schema drift', 'validation', 'Great Expectations'],
    summary: `Bad data throws no exceptions. A feature that silently nulls out because an upstream join failed produces wrong predictions without any runtime error, no stack trace, and no alert unless you explicitly built one. An upstream team renames a column; the pipeline reads nulls; the model retrains on a null-imputed version of a feature that should never be null; performance degrades six weeks before anyone traces it back. Production ML requires automated data quality checks at every pipeline stage: ingestion validation, feature computation validation, training data validation before model fit, and serving-time schema validation at inference. The goal is loud failures at the first stage where the problem is detectable, not silent corruption that surfaces six weeks later. Data quality gates are the primary defense — monitoring dashboards, error rates, and model metrics tell you something already went wrong.`,
    keyPoints: [
      `**Schema validation enforces expected column names, data types, and value ranges as programmatic assertions.** Any schema violation — a renamed column, a type change, a column that should never be null becoming nullable — should fail the pipeline with a clear error before any feature computation runs. TensorFlow Data Validation and Great Expectations are the standard tools. Without assertions, the pipeline reports success while producing corrupted features.`,
      `**Distribution validation computes PSI between the current data distribution and a reference (training data statistics serialized as part of the model artifact).** PSI > 0.1 signals moderate drift requiring investigation. PSI > 0.2 signals significant drift requiring action. Check each feature separately — aggregate distribution metrics hide per-feature problems that are masked by features that did not shift.`,
      `**Null rate monitoring tracks the fraction null per feature over time.** A sudden spike — 0.1% to 30% — indicates upstream pipeline failure or schema change. Null rate is the most common leading indicator of data quality degradation because it responds immediately to upstream outages, join failures, and schema changes. Per-feature null rate SLAs should trigger automated alerts, not just populate dashboards that nobody checks.`,
      `**Value range checks flag values outside the training distribution: values outside [min_train, max_train] as out-of-range, and values beyond 5 standard deviations from training mean as statistical outliers.** Each case requires different treatment — a value outside training range might be a data entry error (nullify), an upstream bug (investigate), or legitimate concept drift (investigate and possibly retrain). The check distinguishes "something changed" from "everything is fine" without requiring ground-truth labels.`,
      `**Cardinality drift for categorical features: new categories appearing at serving time get encoded as UNK (unknown), losing all information for those inputs.** Expected categories disappearing indicate an upstream taxonomy change. Neither raises an exception — both silently degrade model performance for the affected inputs. Tracking cardinality per feature and alerting on new or missing categories catches these before they compound.`,
      `**Referential integrity failures produce silent null features.** A join between a user event table and a user profile table fails for 15% of users because of a data source outage. Those users get null profile features. The model treats established users as cold-start entities. No exception is thrown. The join failure rate is often the earliest signal of a data source outage — monitor it explicitly rather than waiting for downstream model metrics to degrade.`,
      `**Expectation suites as code (Great Expectations): define expectations in version-controlled code — expect_column_values_to_not_be_null, expect_column_mean_to_be_between, expect_column_value_lengths_to_be_between — run on every pipeline execution, fail and alert on violation.** The suite is the data contract between data producers and ML consumers. When the contract is violated, the pipeline fails loudly at the validation step rather than propagating the violation into the trained model.`,
      `**Variance checks alongside range checks: a feature where all values equal a constant passes range validation but carries zero information — a silent constant-feature bug.** Add expect_column_stdev_to_be_between expectations to catch this. A constant feature means a computation bug has collapsed a variable into a fixed value, which is invisible to range checks but destroys the feature's predictive contribution without any error.`,
    ],
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
    takeaway: `Bad data produces no exceptions — it silently degrades models while every pipeline status check shows green. Data quality assertions that fail the pipeline loudly are not overhead. They are the only reliable signal that distinguishes "pipeline ran" from "pipeline ran on data the model was trained to handle." A pipeline that fails on day one of a schema change is better than one that silently retrains for six weeks on corrupted features.`,
  },
  {
    id: 'label_generation',
    title: 'Label Generation',
    subtitle: 'Programmatic labeling, label noise, weak supervision, distant supervision',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['labeling', 'label noise', 'weak supervision', 'programmatic labeling'],
    summary: `Systematic label noise is far more harmful than random noise — and the distinction is almost never made before labeling at scale. Random noise (labels flipped uniformly) adds variance: it makes the model harder to train but does not push it in a consistently wrong direction. Systematic noise (specific patterns consistently mislabeled due to annotator bias, collection method, or task ambiguity) adds bias: the model learns the noise as signal, producing a model that is wrong in structured ways for predictable inputs. The fastest way to improve a model trained on large noisy datasets is usually not more data — it is understanding and fixing the structure of the noise. Inter-annotator agreement (Cohen's kappa) is not a measure of label quality; it is a measure of task clarity. Kappa below 0.6 means the task definition is ambiguous, and fixing the definition is worth more than any amount of additional annotation on the current ambiguous task.`,
    keyPoints: [
      `**Random noise (labels flipped uniformly with probability p) adds variance to the model's training signal.** The model learns despite it — with enough data, random noise averages out. Systematic noise (specific input patterns consistently mislabeled) adds bias. The model learns the consistent wrong pattern as if it were signal. A model trained on systematically biased labels will reproduce the bias at inference and no amount of additional training data fixes it.`,
      `**Programmatic labeling (Snorkel) scales label generation by writing labeling functions — each a heuristic (regex, keyword list, ML classifier, distant supervision rule) that labels a subset of examples.** A generative label model aggregates the functions, accounting for their correlations and individual accuracies, and produces probabilistic labels for the full corpus. The key: each labeling function is individually noisy, but combining many independent signals via the label model produces labels more accurate than any single function.`,
      `**Labeling function quality has three dimensions.** Coverage: what fraction of the dataset does the function label? A function that only fires on 2% of examples contributes little to the label model. Accuracy: what fraction of its labels are correct, measured on a small gold-labeled set? Conflict: when two functions label the same example differently, which is more reliable? Low coverage with high accuracy is preferable to high coverage with low accuracy — noise scales with coverage, not accuracy.`,
      `**Distant supervision generates labels heuristically using an external knowledge base.** If entity pair (X, Y) appears in a sentence and the KB states X has relationship R to Y, label the sentence with relationship R. This assumption is noisy: the sentence may mention X and Y in a context unrelated to R. But it is scalable and can bootstrap labeled datasets for any domain with an available knowledge base, without any human annotation.`,
      `**Label smoothing replaces hard 0/1 labels with soft (epsilon, 1-epsilon) labels, typically with epsilon=0.1.** This prevents the model from assigning extreme confidence to potentially noisy training labels and is equivalent to mixing each hard label with a small fraction of the uniform distribution. On genuinely noisy examples, the reduced penalty for near-correct predictions prevents the model from fitting the noise as confidently as the signal.`,
      `**Confident learning (CleanLab) identifies likely mislabeled examples by comparing each example's assigned label against the model's predicted probability distribution.** An example labeled "class A" that the model predicts "class B" with very high confidence is likely mislabeled. This is often the fastest approach to finding systematic annotation errors — the model's confident disagreements with the labels reveal exactly where the labeling process went wrong.`,
      `**Inter-annotator agreement (Cohen's kappa, Krippendorff's alpha) measures how consistently multiple annotators apply the same label to the same examples.** Kappa below 0.6 indicates the task definition is ambiguous — annotators are not making consistent decisions because the guideline does not cover the boundary cases. Collecting more annotations on an ambiguous task compounds the noise. Fix the guideline first, re-label the boundary cases, then scale annotation.`,
      `**Active learning selects the most informative examples for human annotation by querying examples where the current model is most uncertain (entropy sampling) or most disagreed-upon across an ensemble (query by committee).** Starting from an equal budget of labeled examples, active learning typically achieves the same model accuracy as random sampling with 5-10x fewer labeled examples — because it focuses annotation effort on the decision boundary rather than the interior of class regions where the model is already confident.`,
    ],
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
    takeaway: `Systematic label noise teaches the model wrong patterns rather than just adding variance. More labeled data collected from the same biased process amplifies the bias rather than reducing it. The most valuable labeling investment is usually diagnosing and fixing the structure of the noise first — then scaling annotation on the fixed process.`,
  },
  {
    id: 'pipelines',
    title: 'ML Pipeline Architecture',
    subtitle: 'Batch vs streaming ingestion, orchestration, idempotency, pipeline failures',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['MLOps', 'pipelines', 'orchestration', 'Airflow', 'idempotency'],
    summary: `A pipeline that succeeds without data quality checks can be more dangerous than a failed pipeline. A detected failure deploys nothing — the current production model keeps running. A silent bug trains and deploys a corrupt model, and you find out weeks later when a business metric moves. This is the fundamental asymmetry in ML pipeline reliability: failures are detectable, bugs are not. An ML pipeline is the end-to-end computational graph from raw data to deployed predictions. Its reliability rests on three properties: idempotency (re-running with the same inputs produces identical output without duplicates), fast-fail on bad data (validate before computing, not after), and complete lineage tracking (every model traces to its exact data, code, and parameter versions). These properties eliminate the regime where the pipeline says it succeeded but the model was trained on wrong data.`,
    keyPoints: [
      `**Batch pipelines run on a schedule (hourly, daily) — simple, predictable, and appropriate for features that change slowly.** Higher feature staleness is the inherent tradeoff. Airflow DAGs are the standard orchestration tool: each node is an operator, edges encode dependencies, and execution order is enforced. The simplicity of batch pipelines is their main advantage — fewer moving parts means fewer failure modes.`,
      `**Streaming pipelines process events continuously with latency in seconds.** The tradeoffs for real-time feature freshness are significantly higher operational complexity: stateful computation must survive node failures, exactly-once semantics prevent both duplicates and dropped events, and backpressure prevents downstream consumers from being overwhelmed. Flink and Spark Streaming are the standard platforms. Streaming is the right choice only when the SLA requires freshness that batch cannot provide.`,
      `**Idempotency means re-running a pipeline step with the same inputs produces the same output without creating duplicates.** Achieved via upsert semantics (not INSERT — use INSERT OR UPDATE keyed on entity and date), deterministic feature computation (no random seeds without explicit setting, no non-deterministic SQL operations), and atomic partition overwrites in storage. Non-idempotent pipelines produce double-counted feature values when retried after failures — the error is silent and compounds with each retry.`,
      `**Exactly-once semantics in streaming: an event is processed exactly once even under node failures and network partitions.** At-least-once processing (the simpler guarantee) produces duplicates on failure recovery, inflating aggregation counts. Flink achieves exactly-once via distributed checkpointing combined with two-phase commit to Kafka. Without this guarantee, feature counts will occasionally be wrong by an amount that depends on how often failures occur.`,
      `**Fast-fail principle: validate data availability and schema at pipeline start, before any computation runs.** If upstream data is missing or corrupt, fail immediately with a descriptive error rather than training on partial or schema-violated data. A model trained on 60% of expected data or on a null-imputed version of a feature that should never be null is worse than no retrained model — it will make confident predictions from an incomplete or corrupted world model.`,
      `**Lineage tracking records for each trained model: the exact training dataset version (S3 URI and content hash), code commit hash, feature store feature versions at training time, and hyperparameter values.** Full lineage enables two things: reproducing any past run exactly, and root-cause analysis when a model degrades — because you can identify exactly what changed between the last good model and the degraded one.`,
      `**Pipeline testing deserves the same rigor as application testing.** Unit test each transformation (input to expected output, including edge cases and nulls). Integration test the full pipeline on a small representative sample. Add data validation tests at each stage boundary that assert on distribution properties, not just schema. Pipeline code that is not tested will silently introduce bugs that reach production.`,
      `**The distinction between a pipeline failure and a pipeline bug: a failure is detectable — the pipeline throws an error, monitoring catches the gap in output data, and on-call is paged.** A bug is silent — the pipeline succeeds, produces data that passes schema validation, trains a model, deploys it, and you find out weeks later when a business metric declines. Data quality assertions on outputs are the only guard against bugs. Monitoring pipeline success status is necessary but not sufficient.`,
    ],
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
    takeaway: `A pipeline "succeeding" (no errors thrown) tells you nothing about whether it produced correct data. The gap between "ran without errors" and "produced correct outputs" is exactly where silent bugs live. Data quality assertions on pipeline outputs are the only thing that closes it.`,
  },
  {
    id: 'model_registry',
    title: 'Model Registry & Versioning',
    subtitle: 'Artifact storage, metadata, lineage, deployment gating, experiment tracking',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['model registry', 'MLflow', 'versioning', 'deployment'],
    summary: `When a production model degrades, you need to answer three questions in under five minutes: which model version is live, what data and code produced it, and what the rollback target is. Without a model registry, answering any of these questions requires archaeology — searching experiment logs, asking engineers, checking S3 timestamps. With a production incident in progress, that's time the business is absorbing a degraded model.

A model registry stores trained model artifacts, their full lineage, and deployment lifecycle state, so these answers are always one query away.

But the registry is only as useful as what it enforces: lineage fields that are optional get skipped under deadline pressure, and deployment gates that can be bypassed get bypassed during incidents. The value of a registry is proportional to how strictly it mandates lineage capture and enforces quality gates before promotion.`,
    keyPoints: [
      `**A model artifact must contain more than weights: also include the fitted preprocessing pipeline (scaler, encoder), the feature schema (expected features, types, ranges), and training metadata (dataset S3 URI plus content hash, code commit, hyperparameters).** A model that requires manual reconstruction of preprocessing parameters before it can be deployed is not actually stored — it is partially stored, and the rest is a reconstruction task waiting to fail.`,
      `**Model lifecycle stages: Experiment (training run, not validated) → Staging (passed automated gates, ready for human review) → Production (live, serving traffic) → Archived (superseded, retained for rollback).** Transitions require explicit approval and programmatic gate criteria. The model cannot skip stages — the gate logic must be enforced by the registry, not by convention.`,
      `**Deployment gates close the gap between "performs well on my validation set" and "safe to expose to users." Automated checks before promotion: minimum AUC/precision/recall thresholds, comparison against the current production champion (challenger must outperform or match), bias and fairness metric checks per demographic group, and latency and memory budget verification.** A model that passes offline evaluation but fails a latency gate is a model that would have degraded user experience had it shipped — the gate caught what offline metrics could not.`,
      `**Experiment tracking solves the reproducibility problem: log hyperparameters, dataset hash, metric curves (train/val loss by epoch), final metrics, and artifacts for every training run.** MLflow and W&B are standard. Without this, reproducing a result from six weeks ago requires reconstructing exact conditions from memory and guessing at dataset state — which nobody does reliably. The first time you need to reproduce a result and cannot is the moment the cost of not tracking becomes concrete.`,
      `**Full lineage means: for each model version, the exact training dataset version (S3 URI and content hash), the code commit hash, the feature store feature versions at training time, and the preprocessing parameter values are all stored and linked to the model artifact.** Lineage is the audit trail for debugging production incidents — you can identify exactly what changed between the last good model and the degraded one — and for compliance requirements that require traceability to training data.`,
      `**Rollback requires that the previous production artifact and its complete metadata are retained and that rollback can happen within SLA — typically under five minutes.** Never delete production model artifacts. If a model degrades, you promote the previous version from Archived to Production in one registry API call. If that artifact was deleted, your rollback option is rebuilding from scratch during an active incident.`,
      `**Shadow mode for challenger evaluation: deploy a challenger model alongside the production champion, route real traffic to both, log both predictions, but serve only the champion's predictions to users.** Shadow mode provides evidence for promotion decisions that holdout validation cannot: real traffic distribution, edge cases not in validation, latency under actual load. A model that wins on the holdout set but fails on tail traffic in shadow mode should not be promoted.`,
      `**Champion-challenger rotation: run challenger in shadow mode for 7-14 days before promotion.** This catches latency regressions, edge-case failures on the production traffic distribution, and validates that offline metric improvements hold on live traffic. Promoting without shadow mode is accepting that your validation set fully represents production — it never does.`,
    ],
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
    takeaway: `The three questions that matter during a production incident are: what is live, what produced it, and what is the rollback target. Without mandatory lineage and programmatic gates, none of these answers are reliable. A registry where lineage is optional and gates are advisory is a named folder on S3 — the discipline breaks exactly when the stakes are highest.`,
  },
  {
    id: 'ab_infra',
    title: 'A/B Infrastructure',
    subtitle: 'Traffic splitting, treatment assignment, exposure logging, interaction effects',
    difficulty: 'intermediate',
    estimatedMin: 29,
    tags: ['A/B testing', 'experimentation', 'traffic splitting', 'exposure logging'],
    summary: `An A/B infrastructure bug is more dangerous than a model bug because it hides behind statistical outputs that look legitimate. A biased assignment produces a p-value, a confidence interval, a result summary — and every number in that summary is wrong. No alarm fires. The experiment completes. A decision gets made. This is the failure mode that makes A/B infrastructure correctness a precondition for all statistical work downstream, not an implementation detail. The three most consequential components are deterministic assignment (same user always gets the same treatment, so experience is consistent and counts are accurate), correct exposure logging (only count users who actually encountered the change, not everyone who was assigned), and Sample Ratio Mismatch detection (run before looking at any metric — if the observed split is not what was intended, the experiment is compromised and no analysis is valid).`,
    keyPoints: [
      `**Deterministic assignment: hash(user_id + experiment_id) mod 100 < treatment_percentage — the hash is deterministic, so the same user always receives the same treatment within the experiment lifetime.** A user who refreshes does not switch groups. Without determinism, a user who visits three times might see treatment once and control twice — their outcome data becomes uninterpretable and cannot be correctly attributed to either group.`,
      `**Assignment independence: different experiments must not interfere with each other's assignments.** If being in treatment for experiment A is correlated with being in treatment for experiment B, the two experiments' measured effects will be confounded. Use disjoint experiment layers (each user is in exactly one bucket per layer) or orthogonal hash functions (different salt per experiment) to keep assignments uncorrelated across concurrent experiments.`,
      `**Exposure logging records a user as "exposed" only when they actually encounter the treatment — when they view the page, see the button, or receive the recommendation change — not at assignment time.** Logging at assignment inflates the denominator with users who were assigned but never experienced anything, diluting the true effect. A 5% improvement measured on all assigned users might be a 15% improvement measured on actually-exposed users — logging at assignment systematically underestimates effect size.`,
      `**Sample Ratio Mismatch (SRM): you intended 50/50 but observed 52/48.** This is not statistical noise — it signals a systematic bug in assignment or logging. Even SRM of 1% means the two groups were drawn from different populations, making all metric comparisons invalid. Run a chi-squared test on the observed split vs expected split before opening any metric dashboard. Never analyse primary metrics with SRM above 1%.`,
      `**SRM root causes are rarely obvious: bot traffic preferentially filtered in one arm (bots may be filtered from treatment logs but not control logs), session-level vs user-level assignment mismatch (if a user has three sessions, they might count three times in treatment but once in control), different population coverage in treatment vs control logging, or a hash function that produces non-uniform distributions for the specific user ID range in the experiment.**`,
      `**Novelty effects cause experiment results to decay over time: users click on new UI elements because they are novel, not because the design is better.** The measured CTR lift at week 1 is partially novelty. At week 4, it is mostly genuine. Include a "novelty holdout" segment (users whose first exposure is 2-4 weeks post-launch) and compare their week-1 behaviour to early adopters — the difference estimates the novelty component. A 3-day experiment that shows 8% lift is measuring something that may not persist.`,
      `**Network interference occurs when treating some users causally affects control users through interaction — in social networks, a treated user's posts are seen by control users; in marketplaces, a treated seller's prices affect buyer demand for control sellers.** Standard A/B analysis assumes SUTVA (stable unit treatment value assumption) — that the control user's outcome is unaffected by who else is in treatment. Violation means the control group is contaminated. Cluster randomisation at the network or geographic level partially addresses this but requires larger N.`,
      `**Multiple testing correction: running 10 experiments simultaneously at alpha=0.05 expects 0.5 false positives by chance.** Running 20 secondary metrics per experiment and selecting the most significant ones inflates the effective alpha further. Use Benjamini-Hochberg FDR correction for secondary metrics, Bonferroni for primary safety metrics, and sequential testing (mSPRT) if you need to peek at results continuously without inflating Type I error. Pre-specify the primary metric before the experiment runs — post-hoc metric selection is p-hacking regardless of the correction applied.`,
    ],
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
    takeaway: `A/B infrastructure bugs produce valid-looking results that are wrong. A biased assignment generates a p-value, a confidence interval, and a recommendation — every number in the chain is invalid, and no alarm fires. SRM invalidates the experiment regardless of what the metrics say. Check it before looking at results, every time, without exception — there is no statistical fix for a compromised experiment.`,
  },
  {
    id: 'online_learning',
    title: 'Online Learning & Model Staleness',
    subtitle: 'Continuous training, concept drift, staleness management, shadow deployment',
    difficulty: 'advanced',
    estimatedMin: 29,
    tags: ['online learning', 'concept drift', 'model staleness', 'shadow mode', 'canary'],
    summary: `Getting paged at 3am for a model regression usually means one of two things: the model was deployed without shadow mode validation so a failure on production traffic wasn't caught before rollout, or it was deployed without canary gates so a 100% traffic rollout happened before anyone confirmed real-world metrics.

A model that worked in offline evaluation and in shadow mode can still fail when it serves all traffic — the gaps between evaluation, shadow, and full production are where regressions hide. Managing model staleness requires the same care: a model that degrades slowly over weeks because user behaviour shifted is as harmful as a regression, just slower. Concept drift, covariate shift, and label shift are three different problems that require different responses, and conflating them leads to applying the wrong fix. The underlying challenge is that models become wrong for different structural reasons, and the signals that detect staleness (prediction score drift, feature PSI, downstream business metrics) don't always tell you which reason applies.`,
    keyPoints: [
      `**Concept drift taxonomy distinguishes the mechanism of degradation.** Covariate shift: P(X) changes but P(Y|X) is unchanged — feature distributions shift but the model's learned relationship is still valid if it could see the new distribution. Label shift: P(Y) changes but P(X|Y) is stable — the base rate of fraud changes, for example. Real concept drift: P(Y|X) itself changes — fraudsters have learned new attack patterns that the model has never seen. Only real concept drift strictly requires retraining. Applying a full retrain when importance weighting would have fixed covariate shift is compute waste. Applying threshold recalibration when the relationship has fundamentally changed is negligence.`,
      `**Model staleness signals: prediction score distribution drift (if the mean score shifts significantly, the model is seeing inputs it was not calibrated for), feature PSI above 0.2 on high-importance features (the model is operating out of its training distribution), and downstream business metrics (conversion rate, fraud capture rate).** These three signals together distinguish model staleness from data pipeline issues — pipeline issues show up in features and score simultaneously, while staleness typically shows in scores and downstream metrics without feature drift.`,
      `**Periodic batch retraining on a rolling window of recent data (last 90 days, weekly or daily schedule) is simple and auditable.** It is appropriate when drift is slow and the retraining cost is low relative to the staleness cost. The failure mode is in fast-changing environments — trending content, flash sales, adversarial fraud — where the world moves faster than the retraining schedule. A weekly retrain that fires Friday morning misses a fraud pattern that emerged Monday and ran for four days.`,
      `**Online learning updates model weights on each new example using stochastic gradient descent — the model is always fresh but introduces three risks.** Catastrophic forgetting: recent examples progressively overwrite knowledge of rare historical events; if the last two weeks had unusual category distribution, the model starts recommending only those categories. Individual bad examples: a single corrupted training example directly updates production weights. Training-serving parity complexity: the model being updated at training time must produce identical predictions to the serving snapshot — any discrepancy is training-serving skew operating through the update path.`,
      `**Triggered retraining monitors drift metrics (PSI, performance degradation) and fires a retrain automatically when drift exceeds a threshold.** Faster response than scheduled retraining, lower compute than continuous learning. The failure modes are symmetric: too sensitive a threshold triggers expensive retrains on natural data variation that would not affect model quality; too insensitive allows significant staleness to accumulate before triggering. Setting the threshold requires understanding the business cost of staleness versus the cost of unnecessary retraining.`,
      `**Shadow mode deployment routes real production traffic to both the current model and the challenger, logs both predictions, but serves only the current model's responses to users.** The challenger accumulates evidence on real traffic — real feature values, real edge cases, real load — without any user experiencing its predictions. Shadow mode catches the class of failures that neither holdout evaluation nor offline A/B testing reveals: model behavior on the specific tail of the production distribution.`,
      `**Canary release gradually shifts traffic from the current model to the new model — start at 1-5%, monitor for 30-60 minutes, step up to 10%, 25%, 50%, 100% with quantitative metric gates at each step.** Degradation at any step triggers automatic rollback before the majority of users are affected. The gates must be defined before the canary launches: "if new model CTR is more than 2% below baseline on 1000 impressions, rollback immediately." Manual rollback decisions under time pressure during an incident are unreliable — the whole point of the gates is that the decision was made in advance, under no pressure.`,
      `**Rollback preparedness: define rollback conditions quantitatively before any deployment begins, retain the previous production artifact so rollback is a registry promotion (not a rebuild), and verify that rollback takes under five minutes.** A deployment without pre-defined rollback conditions is a deployment with no recovery plan — the decision gets made under time pressure, with incomplete information, by people who are exhausted. That's the worst possible decision-making context.`,
      `**Training-serving parity for online learning is harder than for batch models because the model being updated continuously at training time must produce identical predictions to the serving snapshot at inference time.** Any preprocessing, feature normalisation, or embedding lookup that differs between the training update path and the serving path creates training-serving skew — the same inputs will produce different outputs in training versus serving. This class of bug is extremely hard to detect because the model metrics still look reasonable; the skew is present but hidden in the continuous update stream.`,
    ],
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
    takeaway: `Model staleness is not a single problem. Covariate shift, label shift, and real concept drift require different responses — a full retrain is the right answer for one and waste or negligence for the other two. Shadow mode and canary gates are not optional steps for careful teams; they are the difference between catching a regression on 1% of traffic and getting paged at 3am after 100% rollout.`,
  },
]
