// src/data/quizData.js
// Precomputed Quiz Me MCQs — 3 questions per post, posts 1-50.
// Posts 51-126: see NEXT.md for next session.
// Format: { [postId]: [{ q, opts: [A,B,C,D], ans: 0-based index }] }

export const QUIZ = {
  1: [
    { q: "Training-serving skew most commonly originates from:", opts: ["Underfitting the training set","Feature computation logic differing between training pipeline and serving code","Using a validation split that's too small","Low learning rate during training"], ans: 1 },
    { q: "A model achieves 92% offline AUC but only 74% online precision. The most likely culprit is:", opts: ["Model overfitting","Training-serving skew in feature values","Too many features","Class imbalance in training data"], ans: 1 },
    { q: "The safest way to prevent training-serving skew is to:", opts: ["Use the same random seed in both pipelines","Share a single feature computation library between training and serving","Re-train the model weekly","Log training data to a data warehouse"], ans: 1 },
  ],
  2: [
    { q: "In Spark, a shuffle is triggered when:", opts: ["A DataFrame is created from a CSV","A wide transformation like groupBy or join requires data exchange across partitions","A filter operation is applied","A select narrows columns"], ans: 1 },
    { q: "The correct value for spark.sql.shuffle.partitions in production with a 500GB dataset is typically:", opts: ["200 (the default)","2 (one per core)","Roughly 2-4× the number of available cores","Fixed at 1000 regardless of data size"], ans: 2 },
    { q: "Broadcast joins eliminate shuffle when:", opts: ["Both tables exceed 10GB","One table fits in executor memory (typically <10MB by default threshold)","The join key is a string type","Auto-broadcast hint is disabled"], ans: 1 },
  ],
  3: [
    { q: "AUC-ROC is a poor primary metric when:", opts: ["Your dataset has equal class balance","Class imbalance is severe and you care about precision on the positive class","You have more than two classes","Your model outputs probabilities"], ans: 1 },
    { q: "A fraud model achieves 0.98 AUC but flags 1 in 10 legitimate transactions. The correct metric to optimize is:", opts: ["AUC-ROC","Log loss","Precision@K or F-beta with high beta weight on recall","Accuracy"], ans: 2 },
    { q: "Precision-Recall AUC is preferred over ROC AUC for imbalanced datasets because:", opts: ["PR AUC is always higher","PR AUC is not influenced by the large number of true negatives","ROC AUC cannot handle probabilities","PR AUC is faster to compute"], ans: 1 },
  ],
  4: [
    { q: "In a two-tower recommendation architecture, the retrieval stage prioritizes:", opts: ["Exact ranking with all features","Fast approximate nearest neighbor search over a large candidate pool","Re-ranking with cross-features","Personalized pricing"], ans: 1 },
    { q: "The MLE interview framework for RecSys design starts with:", opts: ["Choosing a model architecture","Clarifying the business metric and constraints before any ML design","Selecting a feature store","Estimating QPS requirements"], ans: 1 },
    { q: "Cold-start for new items in a RecSys is typically handled by:", opts: ["Assigning random embeddings","Using content-based features (metadata, category, text) as a proxy until collaborative signal accumulates","Excluding new items until they have 100 interactions","Training separate models per item"], ans: 1 },
  ],
  5: [
    { q: "Concept drift differs from data drift in that:", opts: ["Concept drift is always gradual, data drift is always sudden","Concept drift means P(y|x) has changed; data drift means P(x) has changed","They are the same thing","Data drift always causes concept drift"], ans: 1 },
    { q: "The earliest detectable signal of concept drift in production is typically:", opts: ["A drop in AUC on the test set","An increase in prediction confidence","Divergence between recent label distribution and training label distribution","Slowdown in serving latency"], ans: 2 },
    { q: "Page-Hinkley and ADWIN are algorithms designed to:", opts: ["Optimize model hyperparameters","Detect change points in streaming data distributions","Compress model weights","Balance class distributions"], ans: 1 },
  ],
  6: [
    { q: "PCA reduces dimensionality by:", opts: ["Removing features with low variance","Projecting data onto directions of maximum variance (eigenvectors of the covariance matrix)","Selecting features with highest correlation to the target","Clustering similar features together"], ans: 1 },
    { q: "You must center (subtract mean) before PCA because:", opts: ["Centering improves accuracy","PCA finds directions of variance; without centering, the first component is dominated by the mean direction, not the variance","Centering prevents overfitting","Sklearn requires it"], ans: 1 },
    { q: "Explained variance ratio in PCA tells you:", opts: ["The accuracy of the reconstruction","What proportion of total variance is captured by each principal component","The correlation between components","The optimal number of clusters"], ans: 1 },
  ],
  7: [
    { q: "The core function of a feature store's online serving layer is:", opts: ["Storing model weights","Providing low-latency feature retrieval at serving time (typically from Redis or Cassandra)","Retraining models automatically","Logging predictions to a data lake"], ans: 1 },
    { q: "Point-in-time correctness in a feature store means:", opts: ["Features are computed in real-time","Training features use only data available at the label timestamp, preventing future leakage","Features are stored at midnight each day","The feature server has <1ms latency"], ans: 1 },
    { q: "The biggest operational risk of a shared feature store is:", opts: ["High storage cost","A schema change breaking downstream models silently","Too many features","Slow backfills"], ans: 1 },
  ],
  8: [
    { q: "In ML system design interviews, the most common failure is:", opts: ["Choosing the wrong activation function","Starting with model architecture before establishing the metric and data pipeline","Using too many features","Not using deep learning"], ans: 1 },
    { q: "When asked 'how would you improve this model in production?', the correct first step is:", opts: ["Add more layers","Analyze failure modes using error analysis before proposing any change","Switch to a different framework","Increase training epochs"], ans: 1 },
    { q: "A staff MLE candidate differentiates from a senior by:", opts: ["Knowing more algorithms","Connecting system design decisions to business impact and trade-offs","Writing faster code","Having a larger vocabulary of ML jargon"], ans: 1 },
  ],
  9: [
    { q: "Vanilla gradient descent with a fixed learning rate fails on non-convex loss surfaces primarily because:", opts: ["It uses too much memory","It can get stuck in local minima or saddle points, and the fixed LR can't adapt to curvature","It converges too fast","It requires labeled data"], ans: 1 },
    { q: "Adam optimizer combines:", opts: ["SGD and PCA","Momentum (first moment) and adaptive per-parameter learning rates (second moment)","Gradient descent and random search","Batch normalization and dropout"], ans: 1 },
    { q: "Learning rate warmup is used in Transformer training because:", opts: ["It speeds up inference","Random weight initialization produces large, noisy gradients at first; small LR prevents destructive early updates","It reduces overfitting","It increases batch size"], ans: 1 },
  ],
  10: [
    { q: "SHAP values satisfy three properties that make them reliable feature attributions. The most critical for production debugging is:", opts: ["Efficiency (values sum to prediction)","Consistency (if a feature contributes more in model B than A, its SHAP is higher in B)","Symmetry","Dummy property"], ans: 0 },
    { q: "SHAP TreeExplainer is preferred over permutation importance for correlated features because:", opts: ["It is faster","It computes marginal contributions using actual training data distribution, not out-of-distribution permuted data","It works with any model","It uses fewer samples"], ans: 1 },
    { q: "A SHAP dependence plot for feature X shows a cluster of high positive values when X is between 0.3 and 0.7. This indicates:", opts: ["A bug in the model","A non-linear interaction where moderate X values drive strong positive predictions","X is not important","The model is overfit"], ans: 1 },
  ],
  11: [
    { q: "The cold-start problem for new users is most practically addressed by:", opts: ["Waiting until the user has 50 interactions","Using popularity-based fallback with demographic or contextual features as warm-up signals","Training a separate model per new user","Assigning random recommendations"], ans: 1 },
    { q: "A recommendation system's explore-exploit trade-off is most relevant during:", opts: ["Model training","Serving, when choosing between showing known-good items (exploit) vs novel items (explore)","Feature engineering","Offline evaluation"], ans: 1 },
    { q: "Contextual bandits are preferred over pure collaborative filtering for cold-start because:", opts: ["They are simpler to implement","They incorporate context (time, device, location) to make reasonable predictions with zero interaction history","They require less compute","They eliminate the need for user embeddings"], ans: 1 },
  ],
  12: [
    { q: "Data parallelism in distributed training means:", opts: ["Each GPU holds a different layer of the model","Each GPU holds a full model copy and processes a different data shard; gradients are averaged before the update","GPUs share a single large batch","Model weights are never synchronized"], ans: 1 },
    { q: "Model parallelism is necessary when:", opts: ["You have many GPUs","The model is too large to fit in a single GPU's memory","The dataset is too large","Your batch size is small"], ans: 1 },
    { q: "AllReduce in data-parallel training performs:", opts: ["Gradient clipping","Synchronized gradient aggregation across all workers so each worker updates with the global gradient average","Model checkpoint saving","Forward pass computation"], ans: 1 },
  ],
  13: [
    { q: "The most common ML interview mistake at senior level is:", opts: ["Mentioning the wrong framework","Jumping to model architecture without establishing a baseline or defining the success metric","Using too much math","Proposing ensemble methods too early"], ans: 1 },
    { q: "When asked about model monitoring, candidates typically forget:", opts: ["To mention drift","Input data distribution shift (data drift) — they mention output drift and accuracy but miss that the input distribution itself may have changed","To mention AUC","To mention logging"], ans: 1 },
    { q: "In a system design question, saying 'I would use XGBoost' without justification shows:", opts: ["Strong domain knowledge","Lack of framework: you should state what properties of the problem make tree-based models appropriate (sparse features, tabular data, interpretability needs)","Good knowledge of gradient boosting","Appropriate confidence"], ans: 1 },
  ],
  14: [
    { q: "ML engineers in Big Tech earn significantly more than traditional software engineers primarily because:", opts: ["ML is harder to automate","The leverage is higher: a well-tuned recommendation model can drive hundreds of millions in incremental revenue","There are fewer of them","They work longer hours"], ans: 1 },
    { q: "The largest compensation gap between MLE levels (e.g., L5 vs L6 at Google) is in:", opts: ["Base salary","Equity (RSU refresh + new grants), which can be 3-5× higher at senior levels","Bonus","Health benefits"], ans: 1 },
    { q: "Specializing in recommendation systems or ads ML commands a premium because:", opts: ["These are rare skills","These systems have directly measurable revenue impact, making ROI easy to justify and compensation competitive","They require more PhDs","They use more compute"], ans: 1 },
  ],
  15: [
    { q: "Netflix's shift from rule-based to ML-driven recommendations succeeded because:", opts: ["They hired more engineers","They reframed the problem as learning from implicit feedback (play events) at scale rather than relying on explicit ratings","They switched to deep learning","They moved to the cloud"], ans: 1 },
    { q: "The key organizational insight from Netflix's ML transformation was:", opts: ["Centralizing all ML in one team","Embedding ML engineers within product teams so business context shaped model design, not the other way around","Outsourcing data engineering","Replacing product managers with data scientists"], ans: 1 },
    { q: "Netflix's 'rows as products' insight means:", opts: ["Each row in a database is important","The arrangement of recommendation rows (trending, because you watched, new releases) is itself a personalization problem optimized separately from item ranking","Netflix tracks rows as revenue units","Each row is owned by a different team"], ans: 1 },
  ],
  16: [
    { q: "The component that most teams underinvest in when building their first ML stack is:", opts: ["Model training infrastructure","Data quality and feature validation pipelines — models fail in production due to bad input data, not bad algorithms","GPU clusters","Experiment tracking"], ans: 1 },
    { q: "The reason ML stacks at scale move to feature stores is:", opts: ["Feature stores are faster than databases","Training/serving consistency: the same feature logic must run at training time (batch) and serving time (low-latency), without code duplication","Feature stores are cheaper","Feature stores require less code"], ans: 1 },
    { q: "At production scale, the difference between a notebook prototype and a production ML system is primarily:", opts: ["Model accuracy","Observability, reproducibility, and graceful degradation — none of which a notebook provides","The programming language","Whether the model uses GPUs"], ans: 1 },
  ],
  17: [
    { q: "The architectural shift from AlexNet (2012) to Transformers (2017+) is best characterized as:", opts: ["From supervised to unsupervised learning","From spatial inductive biases (CNNs) to attention-based mechanisms that learn dependencies regardless of distance","From classification to generation","From CPUs to GPUs"], ans: 1 },
    { q: "The reason GPT-3 (2020) marked a qualitative change in AI capability is:", opts: ["It was the first neural network","Few-shot prompting emerged: the model could perform tasks from examples in context without gradient updates","It used more training data","It had a new architecture"], ans: 1 },
    { q: "RLHF (2022) matters because:", opts: ["It makes models faster","It aligns model output with human preferences by training a reward model on human comparisons, then optimizing policy via PPO","It eliminates hallucinations","It reduces model size"], ans: 1 },
  ],
  18: [
    { q: "For an Indian ML engineer targeting international roles, the highest ROI location in 2025 is:", opts: ["UK (London)","UAE/Dubai — no income tax, growing tech sector, accessible to Indian citizens, lower cost than Bay Area","Germany","Singapore"], ans: 1 },
    { q: "Remote roles from India at US/European companies pay less than on-site because:", opts: ["Remote engineers work less","Salary is typically anchored to local market rates in India, even for US companies — parity is only achievable for staff+ engineers at companies with transparent global pay bands","Remote engineers are less productive","Visa constraints"], ans: 1 },
    { q: "The primary factor that determines an ML engineer's market value across geographies is:", opts: ["Years of experience","Demonstrable impact on revenue or product metrics at known companies — geography is secondary to the quality of the story","Which universities they attended","Which frameworks they know"], ans: 1 },
  ],
  19: [
    { q: "The primary difference between L5 (Senior) and L6 (Staff) in ML engineering is:", opts: ["Knowing more ML algorithms","Scope: L5 delivers excellent execution within a defined project; L6 defines the project, sees cross-team dependencies, and raises the floor for others","Years of experience","Using more advanced models"], ans: 1 },
    { q: "A Staff ML Engineer is expected to:", opts: ["Review every pull request","Drive technical direction across teams, identify where ML investment has highest leverage, and mentor seniors to become independent","Train models faster","Write more code than seniors"], ans: 1 },
    { q: "The most common reason Senior MLEs fail to promote to Staff is:", opts: ["Lack of ML knowledge","Impact visibility: their work is high-quality but not clearly tied to measurable business outcomes or cross-team influence","Not enough publications","Being too specialized"], ans: 1 },
  ],
  20: [
    { q: "Target leakage in a classification problem means:", opts: ["The test set is too small","A feature that is causally downstream of the target (or includes the target directly) is used in training, producing unrealistically high offline metrics","The model was trained on too much data","Feature scaling was not applied"], ans: 1 },
    { q: "The most dangerous form of data leakage in time-series ML is:", opts: ["Using a random train/test split","Using features computed with data from after the prediction timestamp","Having too many features","Using a small validation set"], ans: 1 },
    { q: "Group leakage occurs when:", opts: ["Two features are correlated","Records from the same entity (user, patient, household) appear in both train and test, letting the model memorize entity-level patterns instead of generalizing","The model sees test labels","Random seeds differ"], ans: 1 },
  ],
  21: [
    { q: "The feature store time-travel bug occurs when:", opts: ["The feature store is slow","Training retrieves features using the wrong timestamp, pulling values that were computed with data not yet available at prediction time","The feature store runs out of memory","Features have nulls"], ans: 1 },
    { q: "The correct join in feature retrieval for training is:", opts: ["Join on entity ID only","Point-in-time join: for each training label, retrieve the feature values that existed at the label's event timestamp","Join on the latest available values","Join on the training run timestamp"], ans: 1 },
    { q: "A model trained without point-in-time correctness will show:", opts: ["Lower training loss","Inflated offline metrics that collapse in production because the model was trained on features from the future","More overfitting","Slower convergence"], ans: 1 },
  ],
  22: [
    { q: "In a Spark execution DAG, a stage boundary indicates:", opts: ["A network timeout","A shuffle: data must be written to disk, repartitioned, and read by the next stage — the most expensive operation","A cache operation","A filter is applied"], ans: 1 },
    { q: "The primary cause of data skew in Spark joins is:", opts: ["Too many partitions","A key with a highly imbalanced distribution (e.g., a popular user_id) causing one partition to receive most of the data, making that task the bottleneck","Too little memory","Using DataFrame API instead of SQL"], ans: 1 },
    { q: "Salting a skewed join key means:", opts: ["Adding noise to the key","Appending a random suffix (0..N) to the skewed key in both tables to distribute one entity across N partitions, then aggregating after the join","Encrypting the key","Sorting before joining"], ans: 1 },
  ],
  23: [
    { q: "PSI (Population Stability Index) above 0.2 indicates:", opts: ["The model is well-calibrated","Significant distribution shift in a feature that likely requires model retraining","The feature is unimportant","A data quality error"], ans: 1 },
    { q: "The earliest leading indicator of model degradation in production is usually:", opts: ["A drop in AUC on a holdout set","An increase in prediction score distribution shift (output drift) before labels arrive","Label quality degradation","An increase in serving latency"], ans: 1 },
    { q: "KS statistic in drift monitoring measures:", opts: ["Correlation between two features","The maximum absolute difference between the CDFs of two distributions — used to detect feature or prediction drift","Model accuracy","Feature importance change"], ans: 1 },
  ],
  24: [
    { q: "The 6-step ML system design framework starts with:", opts: ["Choosing an architecture","Clarifying the problem: business objective, success metric, constraints (latency, freshness, scale)","Designing the data pipeline","Selecting features"], ans: 1 },
    { q: "In a system design answer, specifying both an offline metric and an online metric is important because:", opts: ["Interviewers like two metrics","Offline metrics (AUC, NDCG) do not always predict online impact (CTR, revenue) — alignment between them must be argued, not assumed","Two metrics are always better","The interviewer specifies this"], ans: 1 },
    { q: "When designing a serving system, the trade-off between retrieval model complexity and latency is resolved by:", opts: ["Using a smaller model","Two-stage design: fast approximate retrieval over millions of candidates, then expensive re-ranking on hundreds","Caching all results","Reducing the candidate pool"], ans: 1 },
  ],
  25: [
    { q: "The most common silent killer of forecasting models in production is:", opts: ["Wrong model architecture","Training-serving feature computation mismatch: the feature pipeline in production computes lags or rolling averages differently than the training pipeline","Underfitting","Using too few lags"], ans: 1 },
    { q: "A forecasting model trained on daily data fails when deployed on hourly data because:", opts: ["The model is too simple","The lag features and seasonality patterns have a completely different structure at different granularities","Daily data has more variance","The model needs retraining"], ans: 0 },
    { q: "Calendar features (holidays, day-of-week) are important in forecasting because:", opts: ["They are easy to compute","They capture systematic demand patterns that time-based lags cannot — a Monday in January behaves differently from a Monday in December","They reduce model complexity","They prevent overfitting"], ans: 1 },
  ],
  26: [
    { q: "Point-in-time correctness breaks when:", opts: ["The feature store is slow","Corrections or late-arriving data are backfilled into the feature store, so a retroactive read returns values that didn't exist at training time","The feature expires","The model retrains"], ans: 1 },
    { q: "The recommended solution to feature store time-travel corruption is:", opts: ["Using a faster database","Immutable, append-only feature storage with event_time and created_at timestamps — always retrieve by event_time, never overwrite historical records","Caching feature values","Retraining more frequently"], ans: 1 },
    { q: "Without point-in-time correctness, a credit model trained on 2-year history will:", opts: ["Train slower","Appear to have excellent offline metrics but fail in production because training features included information that wouldn't be available at prediction time","Overfit to recent data","Have high calibration error"], ans: 1 },
  ],
  27: [
    { q: "Your validation AUC is 0.94 but production CTR uplift is 0 after deployment. The most likely cause is:", opts: ["The model is too complex","The validation set was contaminated with target leakage, inflating the offline metric — the model learned to predict the label artifact, not the true signal","The model underfit","Feature scaling was wrong"], ans: 1 },
    { q: "Random train/test splits are wrong for time-series data because:", opts: ["They are slow","The model trains on future data and is tested on the past — offline metrics will not reflect production performance where only past data is available at prediction time","They use too much memory","They reduce sample size"], ans: 1 },
    { q: "The safest way to detect validation set leakage before deployment is:", opts: ["Increase validation set size","Compare feature importances between model trained with and without suspected leaking feature — a massive drop in AUC when the feature is removed confirms it was carrying the label","Use cross-validation","Add regularization"], ans: 1 },
  ],
  28: [
    { q: "Peeking in an A/B test means:", opts: ["Looking at the product during the test","Checking statistical significance repeatedly during the test and stopping early when p<0.05, causing false positive rates far above 5%","Reading the holdout group data","Looking at competitor data"], ans: 1 },
    { q: "Sample Ratio Mismatch (SRM) indicates:", opts: ["The sample size is too small","The actual traffic split differs from the intended split, suggesting a bug in the experiment infrastructure that invalidates results","A statistically significant result","High variance in the metric"], ans: 1 },
    { q: "The correct solution to the peeking problem is:", opts: ["Never check results until the pre-specified end date","Always-Valid Inference / sequential testing (e.g., mSPRT), which controls false positive rates under continuous monitoring","Run longer experiments","Use a larger sample"], ans: 0 },
  ],
  29: [
    { q: "ARIMA fails in production most commonly when:", opts: ["The data is too large","The stationarity assumption is violated — real-world time series often have structural breaks, regime changes, or non-constant variance that ARIMA cannot model","ARIMA is never used in production","The data has too many features"], ans: 1 },
    { q: "Prophet's multiplicative seasonality mode is appropriate when:", opts: ["Seasonality amplitude is constant over time","Seasonality amplitude scales with the trend level (e.g., holiday spikes are bigger as overall sales grow)","The time series is stationary","You have hourly data"], ans: 1 },
    { q: "LSTMs for time series underperform simple baselines when:", opts: ["The dataset is large","The dataset is small (<1000 samples) — LSTMs need substantial data to learn meaningful temporal patterns; linear models or tree-based approaches with lag features outperform them","The series is non-stationary","The prediction horizon is long"], ans: 1 },
  ],
  30: [
    { q: "FP16 quantization reduces memory by 2× compared to FP32 but introduces risk of:", opts: ["Slower inference","Numerical underflow: values below ~6×10⁻⁵ flush to zero, causing gradient instability during training — mitigated by loss scaling","Higher latency","Increased model size"], ans: 1 },
    { q: "INT8 quantization is preferred over FP16 for inference because:", opts: ["INT8 is more accurate","INT8 requires only 1 byte vs 2 bytes (FP16), enabling 2× more activations in cache, and integer arithmetic is faster on most hardware without floating point units","INT8 has no accuracy loss","FP16 is not supported"], ans: 1 },
    { q: "Post-training quantization (PTQ) differs from quantization-aware training (QAT) in that:", opts: ["PTQ is always more accurate","PTQ applies quantization after training with a calibration dataset; QAT simulates quantization during training, achieving better accuracy at the cost of retraining","PTQ uses INT4, QAT uses INT8","They are the same"], ans: 1 },
  ],
  31: [
    { q: "The feature store API trap in Fintech occurs when:", opts: ["The API is slow","Calling get_features() with a batch timestamp returns the latest values rather than point-in-time values, silently breaking the temporal boundary for credit risk models","The API has rate limits","Features are missing"], ans: 1 },
    { q: "A credit scoring model trained with latest-value feature retrieval (instead of point-in-time) will produce:", opts: ["A more robust model","Inflated offline AUC because it effectively trains with future information — a borrower's delinquency history available at the label date is not what would have been available at the original loan application date","Lower training loss","More features"], ans: 1 },
    { q: "The correct API signature for point-in-time-correct feature retrieval is:", opts: ["get_features(entity_id)","get_features(entity_id, as_of_timestamp) — the timestamp anchors retrieval to only features available before that point","get_features(entity_id, latest=True)","get_features(feature_name)"], ans: 1 },
  ],
  32: [
    { q: "Group-level contamination occurs when:", opts: ["Groups of features are correlated","Observations from the same group (patient, household, store) appear in both training and test sets, inflating metrics because the model memorizes group-level patterns","Groups are underrepresented","Data is grouped by time"], ans: 1 },
    { q: "In a medical ML model, the correct train/test split strategy is:", opts: ["Random 80/20 split","Patient-level split: all records for a given patient belong exclusively to either train or test, preventing the model from 'recognizing' a patient it saw in training","Temporal split only","Stratified by diagnosis"], ans: 1 },
    { q: "The tell-tale sign of group leakage is:", opts: ["High training loss","A large gap between cross-validated performance (random CV) and true hold-out performance (group-aware CV) — group-aware CV will be substantially lower","Low feature importance","High calibration error"], ans: 1 },
  ],
  33: [
    { q: "The retroactive feature trap occurs when:", opts: ["Features are computed incorrectly","A data pipeline retroactively corrects historical records (e.g., late-arriving events, corrections), and training re-reads those corrected values — features no longer represent what was known at label time","The pipeline is slow","Features expire"], ans: 1 },
    { q: "Immutable feature storage prevents the retroactive feature trap by:", opts: ["Making storage faster","Appending new records with new timestamps rather than overwriting — historical feature values remain unchanged as originally computed","Reducing storage cost","Compressing data"], ans: 1 },
    { q: "Late-arriving events are most dangerous for training when:", opts: ["They arrive after a few minutes","They arrive after the training cutoff date is set, causing training to include 'corrected' versions of events that would have appeared different to the production model at inference time","The events are rare","The events affect only a few users"], ans: 1 },
  ],
  34: [
    { q: "Standard k-fold cross-validation is wrong for financial time-series backtesting because:", opts: ["It is too slow","Data leaks across time: a fold may train on 2021 data and validate on 2019 data, which would never occur in deployment","It uses too much memory","It doesn't support regression"], ans: 1 },
    { q: "Walk-forward validation simulates production conditions by:", opts: ["Using all data for training","Training on all data up to time T, testing on T+1 to T+n, then sliding the window forward — the model always sees only past data at each step","Shuffling the time series first","Using expanding windows only"], ans: 1 },
    { q: "The correct retraining frequency in a walk-forward backtest should match:", opts: ["Monthly, always","The production retraining frequency — if you retrain quarterly in production, the backtest should also retrain quarterly to reflect actual costs and performance","Daily, always","The model convergence speed"], ans: 1 },
  ],
  35: [
    { q: "Intermittent demand (many zero values) breaks standard ARIMA because:", opts: ["The data is too sparse","ARIMA assumes a continuous, relatively smooth series — zero-inflated intermittent demand violates stationarity assumptions and is better handled by Croston's method or negative binomial models","The variance is too high","ARIMA can't handle monthly data"], ans: 1 },
    { q: "Hierarchical time series forecasting requires reconciliation because:", opts: ["Summing is expensive","Independently forecasting each level (e.g., SKU, category, total) produces forecasts that don't add up — reconciliation (e.g., MinT) ensures coherence across the hierarchy","Hierarchical models are slow","There are too many series"], ans: 1 },
    { q: "The most common cause of forecast failure in e-commerce is:", opts: ["Using the wrong model","Ignoring promotional calendar and inventory constraints — a model that doesn't know about a flash sale or out-of-stock event will produce confidently wrong forecasts","Using daily instead of weekly data","High seasonality"], ans: 1 },
  ],
  36: [
    { q: "Peeking at an A/B test inflates false positive rate because:", opts: ["It slows down the experiment","Each interim look is an additional test; with 20 looks, the probability of seeing p<0.05 by chance approaches 65% even under the null hypothesis","It reduces statistical power","It changes the sample"], ans: 1 },
    { q: "Sample Ratio Mismatch (SRM) is diagnosed by:", opts: ["Comparing AUC between groups","Running a chi-squared test on the actual vs expected traffic split — a statistically significant difference indicates infrastructure bias in assignment","Measuring latency","Checking feature distributions"], ans: 1 },
    { q: "The correct response when SRM is detected is:", opts: ["Report the results anyway since they look significant","Do not report the results — stop the experiment, investigate the assignment bug, and restart once the root cause is fixed","Use a correction factor","Increase the sample size"], ans: 1 },
  ],
  37: [
    { q: "Catastrophic cancellation in FP16 occurs when:", opts: ["Two very different numbers are added","Two very similar large numbers are subtracted, losing significant bits in the mantissa — especially dangerous in weight updates (new_weight = old_weight - lr * grad)","Division by zero","Overflow"], ans: 1 },
    { q: "Loss scaling in mixed-precision training works by:", opts: ["Reducing the learning rate","Multiplying the loss by a large constant before the backward pass so small gradients are scaled into the representable FP16 range, then unscaling before the optimizer step","Clipping gradients","Using a larger batch size"], ans: 1 },
    { q: "Bfloat16 (BF16) is preferred over FP16 for LLM training because:", opts: ["BF16 is faster on all hardware","BF16 has the same exponent range as FP32 (8 bits), preventing overflow during forward pass; FP16's 5-bit exponent causes overflow with large activations in deep networks","BF16 uses less memory","BF16 has higher precision"], ans: 1 },
  ],
  38: [
    { q: "Feature importance drift means:", opts: ["A feature is missing","A feature that was previously highly predictive loses its importance rank over time, typically because P(x) or P(y|x) has changed in the real world","Feature computation is slow","A feature was added"], ans: 1 },
    { q: "Monitoring SHAP value distributions over time is more informative than monitoring raw feature importance ranks because:", opts: ["SHAP is faster to compute","SHAP attributions show the direction and magnitude of each feature's contribution — rank-only monitoring misses cases where a feature's importance score stays the same but its role reverses","Rank monitoring is deprecated","SHAP doesn't require labels"], ans: 1 },
    { q: "Feature importance drift that precedes performance degradation is a signal to:", opts: ["Retrain immediately with the same features","Investigate whether the feature's real-world semantics have changed (new data collection logic, behavior change) before retraining — blind retraining may perpetuate the drift","Reduce model complexity","Add more features"], ans: 1 },
  ],
  39: [
    { q: "Training-serving skew taxonomy includes all of the following EXCEPT:", opts: ["Feature computation code divergence between training and serving","Staleness: model trained on old distribution deployed against current distribution","Class imbalance in the training data","Schema drift: a feature field changes type or meaning between pipeline versions"], ans: 2 },
    { q: "The most scalable detection method for training-serving skew is:", opts: ["Manual code review","Logging a sample of serving-time feature vectors and comparing their distribution against training feature distributions using PSI or KL divergence","Retraining frequently","A/B testing the model"], ans: 1 },
    { q: "Training-serving skew can be eliminated at the root by:", opts: ["Retraining daily","Using a single feature computation library (e.g., Feast transform functions) that runs identically in both the training pipeline and the serving layer","Increasing model capacity","Monitoring predictions"], ans: 1 },
  ],
  40: [
    { q: "A model with 95% AUC but 40% precision on positive class in production indicates:", opts: ["The model is well-calibrated","Severe class imbalance in training — AUC is insensitive to class ratio because it measures ranking, not calibrated probabilities; the model ranks well but outputs poorly calibrated scores","Model overfitting","Wrong hyperparameters"], ans: 1 },
    { q: "Calibration (reliability diagrams) measures:", opts: ["Whether predictions are ranked correctly","Whether predicted probabilities match empirical frequencies — a model predicting 0.8 should be correct 80% of the time","Model AUC","Feature importance"], ans: 1 },
    { q: "Platt scaling (logistic regression on model outputs) and isotonic regression both serve to:", opts: ["Improve AUC","Re-calibrate probability outputs post-training so predicted probabilities align with observed outcome rates — they don't change ranking, only the probability values","Add regularization","Speed up inference"], ans: 1 },
  ],
  41: [
    { q: "The offline-online performance gap is primarily caused by:", opts: ["Wrong evaluation metric","Distribution shift between the static holdout set (representing past) and the dynamic live traffic (representing the present + feedback loops)","Model underfitting","Wrong train/test split ratio"], ans: 1 },
    { q: "Feedback loops in recommendation systems cause the offline-online gap because:", opts: ["The model trains on noise","The training data is generated by a previous model's decisions — recommended items receive more engagement data, creating a self-fulfilling prophecy that static evaluation cannot capture","The holdout set is too small","The model overfit"], ans: 1 },
    { q: "A/B testing (not offline evaluation) is the gold standard for measuring true model impact because:", opts: ["A/B tests are cheaper","A/B tests measure actual user behavior under the new policy in the real distribution — they capture feedback effects, cannibalization, and novelty that holdout sets cannot","A/B tests don't require labels","Offline metrics are deprecated"], ans: 1 },
  ],
  42: [
    { q: "Label noise in production most commonly comes from:", opts: ["Model errors","Proxy labels: using a downstream observable signal (e.g., purchase click) as a proxy for the true label (e.g., user satisfaction) introduces systematic noise when the proxy and truth diverge","Data collection bugs","Network latency"], ans: 1 },
    { q: "Learning with noisy labels via label smoothing works by:", opts: ["Removing noisy examples","Replacing hard 0/1 labels with soft targets (e.g., 0.9/0.1) so the model does not over-fit to potentially incorrect labels","Adding regularization","Increasing batch size"], ans: 1 },
    { q: "The Confident Learning algorithm (cleanlab) identifies noisy labels by:", opts: ["Manual review","Estimating the joint distribution of noisy observed labels and latent true labels — examples where the model's confident prediction disagrees with the observed label are flagged as likely mislabeled","Using a larger model","Voting between multiple models"], ans: 1 },
  ],
  43: [
    { q: "Sudden concept drift differs from gradual concept drift in that:", opts: ["Sudden drift only affects features","Sudden drift causes an abrupt change in P(y|x) (e.g., COVID lockdown changing purchase patterns overnight); gradual drift causes a slow shift over weeks/months","Sudden drift is always recoverable","Gradual drift is more dangerous"], ans: 1 },
    { q: "The correct monitoring strategy for concept drift requires:", opts: ["Monitoring only prediction scores","Monitoring both upstream (feature distributions) and downstream (label distributions, business metrics) — feature drift is a leading indicator; label drift confirms the model has degraded","Only monitoring AUC","Only monitoring data volume"], ans: 1 },
    { q: "Proactive concept drift handling includes:", opts: ["Ignoring drift until AUC drops","Scheduled retraining with a sliding window of recent data, combined with a champion-challenger framework to automatically promote a retrained model when it outperforms the current champion","Increasing model complexity","Adding more features"], ans: 1 },
  ],
  44: [
    { q: "The cold-start trap in personalization systems disproportionately hurts:", opts: ["Power users","New users who need personalization most but generate the least signal — the system defaults to popularity-based fallbacks that feel generic and may cause early churn","Users in rural areas","Mobile users"], ans: 1 },
    { q: "The most effective short-term solution for new-user cold start is:", opts: ["Wait for 50 interactions","An onboarding flow that explicitly collects preferences — this converts cold start into a warm start with explicit signals before the first recommendation","Show only trending items","Use demographic-based clusters"], ans: 1 },
    { q: "Content-based filtering outperforms collaborative filtering for cold-start because:", opts: ["It uses more data","It relies on item metadata (genre, price, description) rather than interaction history — it can make reasonable recommendations for new users and new items without any historical signal","It is simpler to implement","It has higher AUC"], ans: 1 },
  ],
  45: [
    { q: "Silent model staleness occurs when:", opts: ["The model server crashes","A model continues to serve predictions from an outdated version, while the real-world distribution has drifted — it fails silently because inference keeps running without errors","A model is deleted","Predictions are cached"], ans: 1 },
    { q: "The correct way to detect silent staleness is:", opts: ["Check model file timestamps","Monitor the KL divergence or PSI of model prediction distributions compared to recent baseline — a stable distribution despite real-world changes indicates the model has stopped tracking reality","Restart the model server","Check training logs"], ans: 1 },
    { q: "Automated model versioning with shadow deployment handles staleness by:", opts: ["Manually rotating models","Running a freshly retrained challenger model alongside the champion in shadow mode — when the challenger demonstrates offline improvement on recent data, it is automatically promoted","Increasing retraining frequency unconditionally","Using a larger model"], ans: 1 },
  ],
  46: [
    { q: "A recommendation system that only recommends already-popular items suffers from:", opts: ["Underfitting","Popularity bias / filter bubbles: the system ignores long-tail items and amplifies existing popularity, reducing catalog coverage and user discovery","Cold start","High latency"], ans: 1 },
    { q: "Exposure bias in a RecSys training set means:", opts: ["The model is exposed to too much data","The training signal only reflects items the previous model chose to show — unexposed items have no interaction data, so their quality is systematically underestimated","The model is biased toward recent items","Features have high variance"], ans: 1 },
    { q: "Position bias in click data corrupts a RecSys model because:", opts: ["Users don't click enough","Items shown in higher positions receive more clicks regardless of quality — a model trained on raw clicks learns to imitate the previous ranking rather than true user preference","Clicks are too sparse","Position features are missing"], ans: 1 },
  ],
  47: [
    { q: "The parallel trends assumption in Difference-in-Differences requires:", opts: ["Treatment and control groups are identical","In the absence of treatment, the treated group would have followed the same trend as the control group — this cannot be tested directly, only assessed via pre-treatment period trends","Groups are randomly assigned","The outcome is binary"], ans: 1 },
    { q: "DiD breaks down when:", opts: ["Sample sizes differ","A confounding event affects only the treatment group during the post-period — this violates parallel trends and makes the DiD estimate attributable to the confounder, not the treatment","The control group is larger","The treatment is gradual"], ans: 1 },
    { q: "The event study design in DiD is used to:", opts: ["Speed up computation","Visualize pre-treatment parallel trends and post-treatment divergence across multiple time periods, providing visual evidence for or against the parallel trends assumption","Select the control group","Estimate CATE"], ans: 1 },
  ],
  48: [
    { q: "Network effects create a defensible moat for platforms because:", opts: ["They make the platform faster","Each additional user increases value for all existing users — this creates a compounding advantage that is difficult for competitors to replicate without reaching critical mass","They reduce storage costs","They improve model accuracy"], ans: 1 },
    { q: "The cold-start problem for a new marketplace differs from a RecSys cold-start because:", opts: ["They are identical","It requires bootstrapping both sides simultaneously: attracting sellers requires buyers, and attracting buyers requires sellers — single-sided ML models cannot solve this chicken-and-egg problem","Marketplaces don't use ML","It only affects new users"], ans: 1 },
    { q: "Andrew Chen's 'Escape Velocity' framework argues that startups should:", opts: ["Focus on ML accuracy first","Focus on achieving local density in a specific geography or community before expanding, to generate enough interaction data for early network effects to take hold","Build for scale from day one","Launch globally immediately"], ans: 1 },
  ],
  49: [
    { q: "The RecSys feedback loop perpetuates itself because:", opts: ["The model is deterministic","Items selected by the model receive more engagement data, making the model more confident in those items — unexplored items receive no signal, creating a self-reinforcing popularity bias","Users always click the top result","The training data is too large"], ans: 1 },
    { q: "The correct intervention to break a feedback loop is:", opts: ["Retraining more frequently","Deliberate exploration: randomly holding out a small fraction of recommendations to show unchosen items, generating counterfactual signal that breaks the loop","Using a larger model","Increasing recall"], ans: 1 },
    { q: "Inverse Propensity Scoring (IPS) in offline evaluation corrects for feedback loops by:", opts: ["Using more data","Downweighting interactions from items that were shown with high probability (likely to be clicked regardless) and upweighting interactions from rarely-shown items, approximating what the unbiased interaction distribution would look like","Removing popular items","Using a holdout set"], ans: 1 },
  ],
  50: [
    { q: "CUPED variance reduction works by:", opts: ["Increasing sample size","Regressing out pre-experiment covariate variance from the outcome, reducing unexplained noise and increasing statistical power without collecting more data","Running a longer experiment","Using a different significance threshold"], ans: 1 },
    { q: "CUPED breaks when:", opts: ["The experiment is large","The pre-experiment covariate is weakly correlated with the outcome (low R²) — CUPED's variance reduction is proportional to R²; a covariate with R²=0.01 provides almost no benefit","The covariate is categorical","The sample size is too large"], ans: 1 },
    { q: "The three ways CUPED fails in practice are:", opts: ["Underfitting, overfitting, data leakage","Covariate choice (wrong pre-period metric), temporal leakage (covariate computed using post-experiment data), and heterogeneous treatment effects (CUPED assumes additive effect; multiplicative effects require MLRATE or similar)","Peeking, SRM, and low power","High variance, low bias, wrong metric"], ans: 1 },
  ],
}
