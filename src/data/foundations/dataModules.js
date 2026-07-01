export const DATA_MODULES = [
  {
    id: 'data_quality_audit',
    title: 'Data Quality Audit',
    subtitle: `Understand what makes data "dirty" and why auditing before modeling is non-negotiable.`,
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['data quality', 'profiling', 'missing values', 'outliers'],
    summary: `The problem with dirty data is not that errors exist — it is that powerful models learn from them confidently. A gradient-boosted tree trained on a dataset where age = -3 for some rows will learn that negative ages predict something, training metrics will look fine, and the model will be deployed before anyone notices.

A single malformed row can silently flip a column from int64 to object, causing the entire column to be dropped. A referential integrity failure after a table join causes rows to silently disappear — the pipeline reports success while 120,000 training examples vanish. Data profiling — per-column statistics, null rates, referential integrity checks, anomaly flags — exposes these problems before training. Without it, you are debugging confident wrong predictions in production rather than catching data errors in development, where the cost is a fraction of the incident response.`,
    keyPoints: [
      `**A null in an "income" field either means the person declined to answer (informative missingness — the null itself is signal) or the field was never collected for that cohort (structural gap — the null carries no information).** Treating both the same destroys one of these signals. Determine the mechanism before choosing the treatment.`,
      `**Duplicates in a dataset where the same row lands in both train and test inflate test-set accuracy directly.** The model memorizes the duplicate training rows, then "predicts" them correctly in the test set. Development metrics look great; production performance falls immediately because real production data has no training duplicates.`,
      `**Before clipping or removing an outlier, determine what process generated it.** A $50,000 transaction in a fraud dataset is an outlier by any statistical measure. Clipping it to the 99th percentile destroys the signal the model most needs — the rare high-value fraud pattern that distinguishes this problem from noise.`,
      `**A column stored as strings that contains mostly numeric values will be silently dropped or error-out in most ML libraries.** A single row containing "N/A" in an otherwise numeric column flips the entire column type at load time. This produces no visible error — the column simply disappears from the feature matrix.`,
      `**Negative ages, future timestamps, and 7-digit zip codes are impossible values — they violate hard domain constraints regardless of statistical context.** They should be nullified and routed through the missing-value pipeline, never imputed. Imputing a -3 age with the column mean propagates the error as if it were real information.`,
      `**Data profiling is not a one-time setup step.** Distributions shift as new cohorts are onboarded, upstream systems change, and business events occur. A column with 2% nulls in January that has 18% nulls in June signals a structural change in data collection — the model trained in January will degrade on that feature when deployed against June data.`,
      `**"Garbage in, garbage out" understates the danger.** With a powerful model, the correct framing is "garbage in, confident garbage out." The model assigns high predicted probabilities to wrong outcomes rather than flagging uncertainty. The error is invisible until ground-truth labels arrive.`,
      `**Referential integrity failures — foreign key values in one table that have no match in the joined table — cause silent row loss after joins. 120,000 rows can disappear and the pipeline reports no error.** Those missing rows are almost never a random sample: they are typically a specific cohort (older customers, a different region) that becomes unrepresented in training.`,
      `**A null rate above ~40% in a single feature means the model learns from that feature on less than 60% of rows.** Interaction terms involving that feature are estimated from an incomplete subset. Whether those 40% missing values share a common cause is the question to answer before deciding whether to include the feature at all.`,
      `**Profile the test set separately from the train set, then compare distributions.** A column with 2% nulls in train and 18% nulls in test signals a structural change between data collection periods. The deployed model trained on the low-null version will encounter the high-null version and behave differently from what evaluation predicted.`,
    ],
    takeaway: `Models are confident even when trained on garbage — training metrics cannot distinguish signal from well-learned noise. Data quality failures surface as production incidents, not training errors. Catch them in profiling before training, not in debugging after deployment.`,
    checkQuestions: [
      {
        q: `A colleague argues that outlier rows should simply be removed before training to keep the model clean. What breaks if you follow this advice blindly on a fraud detection dataset?`,
        options: [
          `A) The model trains faster but loses calibration on high-value transactions, requiring threshold recalibration before deployment.`,
          `B) Fraud transactions are inherently outliers — rare, high-value, anomalous by definition. Removing outliers would systematically eliminate the positive class, leaving a model trained almost entirely on legitimate transactions that achieves 99%+ accuracy while catching zero fraud. Outlier removal requires knowing WHY a value is extreme, not just that it is.`,
          `C) Removing outliers reduces variance but introduces bias toward the mean transaction profile, causing the model to underperform only on weekend transactions.`,
          `D) The model becomes overconfident on the majority class but can be corrected by applying SMOTE after the outlier removal step.`,
        ],
        answer: `B`,
      },
      {
        q: `You join two tables on a customer ID and your training set shrinks from 500,000 to 380,000 rows without any error. What likely happened and why does it matter?`,
        options: [
          `A) A deduplication step silently ran during the join, removing duplicate customer records — this is expected behavior and the remaining rows are a random sample.`,
          `B) A filter on a date column excluded older customers during the join, but since the sample is still large the model will generalize without issue.`,
          `C) The join used a DISTINCT clause internally, collapsing multi-purchase customers to one row per customer ID and slightly underrepresenting heavy buyers.`,
          `D) Referential integrity failure — 120,000 rows were lost because customer IDs had no match in the second table. This matters enormously: the dropped rows are almost certainly not a random sample — likely older customers, different region, or churned customers — so the model trains on a biased subset and generalizes poorly to the full population.`,
        ],
        answer: `D`,
      },
      {
        q: `What is the difference between an outlier and an impossible value, and why should they be handled differently?`,
        options: [
          `A) An outlier is statistically extreme but potentially valid (a $50,000 transaction is unusual but possible). An impossible value violates a hard constraint (a person cannot be -3 years old). Outliers require domain judgment; impossible values are always errors and should be nullified before any other processing. Imputing an impossible value propagates the error as if it were real information.`,
          `B) An outlier is any value above the 99th percentile; an impossible value is any value above the 99.9th percentile. Both should be clipped to the 99th percentile to stabilize model training.`,
          `C) An outlier is a data entry error; an impossible value is a measurement instrument failure. Outliers should be removed; impossible values should be imputed with the domain-specific minimum valid value.`,
          `D) Both terms describe the same phenomenon — values that fall outside two standard deviations from the mean. The distinction is semantic and does not affect handling.`,
        ],
        answer: `A`,
      },
      {
        q: `You run a data profile on training set in January and model performs well. You retrain in June without re-profiling and performance drops. What data quality issue is most likely responsible?`,
        options: [
          `A) The model's hyperparameters are no longer optimal because the dataset grew larger in June, requiring a new grid search.`,
          `B) Random seed differences between January and June training runs caused the model to converge to a different local minimum.`,
          `C) Distribution shift between January and June data that profiling would have caught — new data source added (changed null rate or value range), upstream system changed encoding (categorical field uses different labels), or a business event changed the real-world distribution. Without profiling at retraining time, the pipeline reports no error but the model trains on a different distribution than originally validated.`,
          `D) The validation split was smaller in June due to more training rows, causing the evaluation to be noisier and less representative of true performance.`,
        ],
        answer: `C`,
      },
      {
        q: `A column has 55% null values. A colleague says to impute with the median. What should you do before accepting that advice?`,
        options: [
          `A) Run a Shapiro-Wilk test to confirm the non-null values are normally distributed; if they are, use mean imputation instead of median.`,
          `B) First determine the mechanism of missingness (WHY 55% are missing). If MNAR, imputing with median fills in systematically wrong values for highest-risk cases. Then consider whether the column is worth including at all (45% observed rows creates poorly estimated interactions). Also check if missing rate in test set matches training — if not, there is a structural data collection difference. Median imputation is only appropriate after these questions are answered.`,
          `C) Check whether the column has more than 10 unique values; if so, KNN imputation is always superior to median imputation regardless of the missingness mechanism.`,
          `D) Immediately drop the column — any feature with more than 30% nulls introduces more bias than predictive value and should never be imputed.`,
        ],
        answer: `B`,
      },
    ],
  },
  {
    id: 'missing_value_handling',
    title: 'Missing Value Handling',
    subtitle: `The mechanism of missingness — MCAR, MAR, MNAR — determines the right treatment, not the null rate alone.`,
    difficulty: 'foundational',
    estimatedMin: 40,
    tags: ['missing data', 'imputation', 'MCAR', 'MAR', 'MNAR', 'MICE'],
    summary: `A dataset with missing values has a problem before any model runs: applying the wrong treatment trains the model on fiction. The right treatment depends entirely on WHY values are missing, not just that they are. MCAR (Missing Completely At Random) means missingness is independent of everything — a sensor randomly dropping packets. You can drop rows or impute with minimal bias. MAR (Missing At Random) means missingness depends on observed variables — a patient's income is more likely missing if they are uninsured, but income itself is not the cause. Model-based imputation (MICE, KNN) recovers accurate estimates. MNAR (Missing Not At Random) means the missing value itself predicts its own absence — severely depressed patients skip the depression survey, patients with the worst lab results are the ones whose results are not recorded. Any imputation fills in systematically wrong values for the highest-risk group, and no statistical method fixes this without modeling the missingness mechanism directly. Diagnosing the type precedes choosing the treatment.`,
    keyPoints: [
      `**MCAR is the least common mechanism in real data.** Most production missingness is MAR or MNAR. Mean imputation on MAR data is biased because it ignores predictive structure in other columns. Mean imputation on MNAR data is worse — it fills in an optimistic value for the highest-risk cases, which is exactly the group where wrong predictions cause the most harm.`,
      `**MNAR failure mode in practice: if patients with the worst outcomes are most likely to have a lab value missing, imputing with the column mean fills in a near-average value for the highest-risk group.** The model trains on data where high-risk patients look average, learns low-risk predictions for them, and systematically misses the people who most need intervention.`,
      `**Add a binary missingness indicator alongside any imputation.** The indicator captures the signal that "this field was absent" — which is itself predictive information when the missingness is informative (MNAR or MAR). A model that sees both the imputed value and the indicator can learn from the pattern of absence. A model with only the imputed value loses that signal entirely.`,
      `**MICE trains a regression model for each column with missing values using all other columns as predictors, then iterates until imputed values converge.** This approach is significantly more accurate than mean imputation for MAR data because it exploits the correlation structure. The tradeoff: MICE requires managing a set of fitted models as pipeline state — every serving-time imputation must use the same fitted models from training.`,
      `**KNN imputation finds the k most similar rows by Euclidean distance on non-missing features and averages their values.** It respects local distribution structure rather than global means, which is useful when the relationship between features is non-linear. The constraint: KNN is O(n²) and requires feature scaling before distance computation, making it expensive for large datasets.`,
      `**Dropping rows with missing values is only valid if those rows are MCAR and the fraction dropped is small (under ~5%).** Drop 20% of rows and you have almost certainly removed a non-random subset — patients who skipped a test, customers who declined a survey question, users on a specific platform. The training set is now biased against exactly the production population where the model matters most.`,
      `**Fit all imputers on the training set only, then apply the fitted parameters to train, val, and test.** Fitting on the full dataset lets test-set statistics (the column mean, the KNN neighbor structure) contaminate the imputer's parameters — the training representation now reflects test-set values, producing optimistic metrics that collapse in production.`,
      `**Above ~50% missingness, reconsider whether imputation makes sense at all.** A model learning from 50% of rows on one feature and 100% on another produces poorly estimated interaction terms for that feature. Sometimes dropping the feature and creating a single "feature was missing" binary predictor captures the signal more honestly than imputing half the values.`,
      `**Mode imputation for categoricals inflates the most common category.** If one category represents 70% of observed values, mode imputation assigns that value to every null — artificially boosting its frequency in the training distribution and suppressing signal from the actual distribution of the missing cases.`,
      `**Detect likely MNAR by regressing the missingness indicator on all observed features.** If no observed feature predicts missingness, MNAR is the leading suspect — something unobserved is driving both the missing value and the outcome. Confirm with domain knowledge: does it make sense that the value would be absent precisely when it is most extreme?`,
    ],
    takeaway: `The mechanism of missingness — not the missing rate — determines the right treatment. Imputing MNAR data systematically fills in the wrong values for the cases where your model is most consequential. Choosing a method before diagnosing the mechanism is a modeling error, not a statistical one.`,
    checkQuestions: [
      {
        q: `You are building a model to predict hospital readmission. A lab test result is missing for 30% of patients. A colleague imputes with the median. What is wrong?`,
        options: [
          `A) Median imputation is only valid for normally distributed columns; the correct choice for skewed lab values is mean imputation after log-transforming the column.`,
          `B) The missingness rate of 30% is too low to matter — complete-case analysis (dropping these rows) would be both simpler and unbiased.`,
          `C) Median imputation will inflate the variance of the imputed column, causing the model to overweight this feature during training.`,
          `D) Lab tests are typically ordered when a clinician suspects a problem — the test is more likely MISSING when the patient appears healthy, making this MNAR. Imputing with the median assigns average lab values to untested patients who may be systematically different. The right approach is to add a binary "was this test ordered" indicator feature, which captures the clinical signal of missingness. Model-based imputation from other covariates is also possible but only after acknowledging MNAR risk.`,
        ],
        answer: `D`,
      },
      {
        q: `Why is it data leakage to fit a mean imputer on the full dataset (train + test) before splitting?`,
        options: [
          `A) When you compute the column mean on the full dataset, that mean is influenced by test-set values. Imputing the training set with that mean means training data contains information derived from the test set. The model indirectly sees test-set statistics during training, inflating accuracy. In production, future data is never available when computing the imputer — fit all preprocessing transformers on the training fold only.`,
          `B) Fitting on the full dataset computes a mean that is biased toward the majority class, which causes the imputer to systematically overestimate values for the minority class.`,
          `C) The imputer fitted on the full dataset will have higher variance than one fitted on the training set alone, producing noisier imputations that hurt model performance.`,
          `D) Fitting the imputer before splitting prevents you from using cross-validation later, because the imputer's parameters cannot be re-fitted inside each fold.`,
        ],
        answer: `A`,
      },
      {
        q: `What is the difference between mean imputation and MICE, and when does the difference matter most?`,
        options: [
          `A) Mean imputation is biased for large datasets while MICE is unbiased for any dataset size; the difference always matters regardless of missingness rate.`,
          `B) Mean imputation uses the training-set mean; MICE uses the test-set mean during inference. The difference matters when train and test distributions differ.`,
          `C) Mean imputation replaces missing values with the column mean — fast but ignores column relationships. MICE treats imputation as a prediction problem: for each column with missing values, it trains a regression model using all other columns as features and iterates until convergence. The difference matters most when features are correlated — if missing income values are predictable from education/employment/age, MICE produces accurate imputations while mean imputation produces the overall average regardless of predictors.`,
          `D) Mean imputation and MICE produce identical results for numerical columns; the difference only matters for categorical columns where MICE uses a classifier instead of a regressor.`,
        ],
        answer: `C`,
      },
      {
        q: `A model trained with complete-case analysis (dropping all rows with any null) achieves 92% accuracy. When you deploy, accuracy drops to 84%. What is the most likely explanation?`,
        options: [
          `A) The model overfit to the complete cases during training; adding L2 regularization would have prevented the 8-point accuracy gap.`,
          `B) The dropped rows were not MCAR — they were systematically different from the complete cases. The model trained on a biased subset and tuned decision boundaries to that subset. In production it encounters the full population including the types of rows dropped during training. The 8-point gap reflects distribution mismatch between the training population (complete cases) and the production population (everyone). Complete-case analysis is only valid when MCAR, which is rarely true in practice.`,
          `C) The production dataset has a higher null rate than training, which causes the model's learned coefficients to extrapolate outside their training range.`,
          `D) The 92% training accuracy was computed on the same rows used to drop nulls, introducing a selection bias into the accuracy estimate itself.`,
        ],
        answer: `B`,
      },
    ],
  },
  {
    id: 'feature_engineering',
    title: 'Feature Engineering',
    subtitle: `Transform raw columns into representations that expose the signal a model can actually learn from.`,
    difficulty: 'foundational',
    estimatedMin: 45,
    tags: ['feature engineering', 'transformations', 'cyclical encoding', 'interaction terms', 'log transform'],
    interactivePrompt: `Before you touch the controls: if you gave a model three raw numbers — someone\`s annual income in dollars, the number of days since they opened their account, and the date of their last transaction — could it learn to predict credit default without you doing anything to those columns first?`,
    summary: `You are trying to predict credit default. You have three raw features: income in dollars, account age in days, and last transaction date. You feed them directly into a logistic regression and the model underperforms. The instinct is to add more data or switch to a fancier model. That instinct is wrong — the problem is that the raw features do not have the geometry the model needs to learn from.

Consider income first. The gap between $50,000 and $51,000 annual income is financially irrelevant for credit risk. The gap between $50,000 and $100,000 matters a great deal. But in raw dollar form, both gaps measure as 1,000 or 50,000 units — the model assigns them equal geometric distance. A log transform fixes this: log($50K) to log($100K) is a meaningful step; log($900K) to log($950K) is nearly nothing. The transformation compresses the upper tail and stretches the lower range where the real variation is. The model is not smarter after the transform — the geometry of the problem is finally correct for it to find the relationship.

Account age has a different problem. A person who opened an account last week behaves nothing like someone with a ten-year history, but the raw number 7 versus 3,650 days does not encode this in a useful way. Converting to buckets — "new account," "established," "long-term" — or computing a derived ratio like "transactions per account year" tells the model what domain knowledge already knows: the first year of account behavior is categorically different from year ten.

Last transaction date is even trickier. The raw date is meaningless without a reference point. But "days since last transaction" is a direct recency signal. "Number of transactions in the last 30 days" captures velocity. Neither of these is in the original data — they require computing against a reference timestamp. This is the temporal feature: earned by knowing that what the model actually needs is a time delta, not a calendar date.

The income-to-debt ratio matters more than income alone. Neither feature alone captures whether someone is overextended; their combination does. This is the interaction feature: a joint signal that neither parent feature carries on its own. Tree models can discover this split. Linear models cannot unless you compute it explicitly.

**NOT this.** Most people think neural networks automatically learn the right features, making feature engineering obsolete. Actually, for tabular data this is wrong. Deep learning on images and text works because spatial and semantic structure is preserved in the raw input. For tabular credit data, the model sees nothing but numbers — it does not know that income is denominated in dollars, that accounts opened last week are different from decade-old ones, or that the income-debt ratio has meaning. Even gradient boosting, which handles non-linearities better than linear models, improves by 5–20% when given ratio features, log transforms, and temporal lags. Garbage representation in, garbage predictions out, regardless of model sophistication.

Feature engineering is the formal discipline of encoding domain knowledge into the geometry of the input space. You are not making the model smarter — you are making the problem solvable.`,
    keyPoints: [
      `**Use log and sqrt transforms when a continuous feature is right-skewed and your model is not a tree.** Income, transaction counts, prices, and time durations almost always need this. The rule of thumb: if the 95th percentile is more than 10× the median, the raw scale is hurting you. Apply log(x + 1) to handle zeros. For tree-based models, skip it — the relative ordering is all that matters and log transforms change nothing about optimal split thresholds.`,
      `**The most common production trap: computing temporal features without a strict temporal join.** A "7-day rolling transaction count" sounds clean until you realize it was computed using the label day itself. The feature includes the day you are trying to predict. In training this inflates performance; in production the feature is computed before the outcome is known. Every lag feature, rolling mean, or "days since" feature must be computed using only data available strictly before the label timestamp. Validate this by running your feature pipeline on a single row and verifying the computation cutoff date.`,
      `**Diagnose which features are earning their place with permutation importance, not training loss.** Shuffle a feature\`s values across the validation set and measure the drop in performance. A genuinely useful feature causes a large drop when shuffled. A spurious feature or a duplicate of another feature causes no drop. Features that do not move permutation importance are adding noise and overfitting risk — remove them. Run this check after any batch of new features before shipping to production.`,
    ],
    takeaway: `Raw features encode what was recorded; engineered features encode what the model needs to find the pattern. The right representation can replace millions of additional training rows — the wrong one makes the signal invisible regardless of model complexity.`,
    checkQuestions: [
      {
        q: `You have a 'time_of_day' feature encoded as integer 0-23. Your model performs poorly on predictions for late-night events. What is the encoding problem and fix?`,
        options: [
          `A) The integer encoding creates a class imbalance between daytime and nighttime hours; the fix is to oversample late-night training examples using SMOTE.`,
          `B) Integer encoding treats midnight as the midpoint of the day rather than a boundary; the fix is to shift all values by 12 so that noon maps to 0.`,
          `C) Integer encoding assigns too much weight to the hour feature relative to other features; the fix is to standardize the hour column with StandardScaler.`,
          `D) Raw integer encoding places hour 23 and hour 0 at maximum distance (23 apart), when they are 1 hour apart on the circular clock. The model cannot learn that midnight behavior resembles 11pm. Fix: sin/cos encoding — create sin(2π·hour/24) and cos(2π·hour/24). Together these encode each hour as a point on the unit circle: hour 23 and hour 0 geometrically close. Essential for all cyclical features: day-of-week (period 7), month-of-year (period 12), degrees (period 360).`,
        ],
        answer: `D`,
      },
      {
        q: `Why does log-transforming an income feature help a linear regression model but not a random forest?`,
        options: [
          `A) Linear regression assumes a linear relationship between each feature and the target. Right-skewed income causes the linear model to devote its coefficient's power to distinguishing extreme values, ignoring variation among typical earners. Log-transforming compresses the upper tail, making the linear relationship more valid. Random forest splits on thresholds — monotone transformations like log don't change which threshold is optimal. Log transform matters for models assuming distributional properties (linear, SVM, neural nets) and is largely irrelevant for tree-based models.`,
          `B) Log transformation improves both model types equally; the difference in practice is that random forests already regularize through bagging, so the benefit is masked by that regularization.`,
          `C) Log transformation helps linear regression because it removes outliers; random forests are not affected because they naturally ignore outliers through their majority-vote ensemble mechanism.`,
          `D) Log transformation converts multiplication relationships into addition relationships, which only matters for linear regression when the true relationship is multiplicative rather than additive.`,
        ],
        answer: `A`,
      },
      {
        q: `You are building a fraud detection model and add interaction term: transaction_amount × is_international. What does this feature capture?`,
        options: [
          `A) It captures the total transaction volume for international merchants, which is the same signal as summing all international transaction amounts over a time window.`,
          `B) It captures geographic risk independent of amount — flagging all international transactions regardless of their size, which is equivalent to using is_international alone.`,
          `C) It captures the combined effect: high-value international transactions as a fraud signal — high amounts suspicious specifically when the transaction is international, not when domestic. Individually, transaction_amount captures scale and is_international captures geography. Neither alone captures that their COMBINATION is the key fraud signal. The product is large only when both conditions hold. Linear models cannot discover this from original features; for tree models the explicit feature can speed up training.`,
          `D) It captures the variance in transaction amounts across international vs. domestic transactions, which is better estimated by computing the ratio of international mean to domestic mean.`,
        ],
        answer: `C`,
      },
      {
        q: `A data scientist creates 200 interaction features from 20-feature dataset and reports improved validation accuracy. What risk does this improvement mask?`,
        options: [
          `A) The risk is multicollinearity — 200 interaction features will be highly correlated with their parent features, making coefficient estimates unstable and impossible to interpret.`,
          `B) With 200 additional features (mostly noise), the model has dramatically more capacity to overfit. If the validation set was used to tune hyperparameters or features were selected based on validation performance, the reported improvement is optimistic. To verify: need a held-out test set never touched during feature construction. Also check the training vs. validation accuracy gap — a much larger gap after adding interaction features signals overfitting. Correct approach: select interaction features using domain knowledge or statistical tests on training fold only, before any validation evaluation.`,
          `C) The risk is that the 200 interaction features may not be available at serving time if the underlying raw features are computed in different pipelines with different latency requirements.`,
          `D) The validation accuracy improvement is real but temporary — the model will degrade within a few retraining cycles as the interaction features cause numerical instability in gradient descent.`,
        ],
        answer: `B`,
      },
    ],
  },
  {
    id: 'categorical_encoding',
    title: 'Categorical Encoding',
    subtitle: `Convert categories into numbers without lying to your model about distance, order, or information from the target.`,
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['encoding', 'one-hot', 'target encoding', 'ordinal', 'cardinality', 'embeddings'],
    summary: `The problem with categorical encoding is that every choice makes an implicit claim about category structure, and the wrong claim actively misleads the model. Ordinal encoding (red=0, blue=1, green=2) asserts that blue is twice as different from green as it is from red — a claim with no basis for unordered categories. A linear model trained on ordinal-encoded cities learns a spurious linear trend across an arbitrary integer ordering. One-hot encoding avoids false distance but explodes to hundreds of columns at high cardinality, producing features so sparse that each column has fewer than 10 positive values in a 10,000-row dataset — a regime that causes overfitting and training instability. Target encoding is compact but creates data leakage if computed before the split: the encoded value for each training row reflects its own label, giving the model the answer during training. The right encoding is determined by the cardinality of the feature, the model type consuming it, and whether a genuine distance or ordering relationship exists.`,
    keyPoints: [
      `**Ordinal encoding on unordered categories introduces spurious distance that the model cannot ignore.** A linear regression learns a single coefficient for the city feature, scaled by the integer. Cities with adjacent integers are treated as similar; cities with large integers receive disproportionate weight. The model fits a meaningless trend across an arbitrary ordering. Trees are less affected because they split on thresholds rather than linear relationships, but the spurious encoding still limits what the tree can learn.`,
      `**One-hot encoding at high cardinality creates a sparsity problem. 1,000 cities produce 999 binary columns.** In a 10,000-row dataset, each column has approximately 10 positive values — the model sees a signal for each city on only 10 training examples. Trees overfit to these sparse patterns; linear models assign unstable coefficients. The threshold for switching strategies is around 50 unique values — above that, target encoding, frequency encoding, or embeddings are better choices.`,
      `**Target encoding leakage works through the training row's own label.** When you compute the per-category mean target across the full dataset, each row's encoded value is influenced by its own outcome. For a category with one row, the encoded value is exactly the target — the model receives a direct copy of what it is predicting. Fix: leave-one-out encoding computes the category mean excluding the current row. Cross-validation-based encoding computes the mean from the training folds only, applying it to the validation fold.`,
      `**Frequency encoding replaces each category with its rate of appearance in the training set.** It handles high cardinality without leakage risk — no target values are used. Its structural weakness: two categories that happen to appear at the same rate receive identical encodings even when they are semantically unrelated. The model cannot distinguish them.`,
      `**Unseen categories at serving time expose the fragility of each encoding.** One-hot encoding silently sets all indicator columns to zero — producing an all-zero row the model may never have trained on. Target encoders have no stored mean for the new category and typically fall back to the global mean, losing per-category signal. Hash encoding always handles new categories by mapping them to a bucket — the most naturally robust approach, at the cost of collisions between semantically unrelated categories.`,
      `**Embedding layers learn dense vector representations from data rather than relying on any hand-crafted distance assumption.** Two merchant IDs that behave identically in the data will end up geometrically close in embedding space, regardless of how different their raw IDs are. This is the only encoding that can capture semantic similarity for high-cardinality features like product IDs or user IDs. The tradeoff: categories seen rarely will have poorly trained embeddings — the few gradient updates they receive may not converge.`,
      `**The dummy variable trap: k one-hot columns sum exactly to 1 for every row — perfect multicollinearity.** A linear model with an intercept has an exact linear dependency between the intercept and the k columns. The result is that coefficients are unidentifiable; remove one column (drop_first=True in pandas) to break the dependency. Tree models are unaffected because they do not estimate coefficients.`,
      `**Binary encoding uses the binary representation of each category's integer index — log2(k) columns instead of k.** For 1,000 cities: 10 columns instead of 999. This dramatically reduces dimensionality. The tradeoff is that the bit-string representation imposes arbitrary relationships between categories — city 5 (binary: 00101) and city 4 (binary: 00100) differ by one bit, but that bit has no semantic meaning.`,
      `**Hash encoding maps each category to a bucket via a hash function.** The vocabulary is fixed at encoding time (the number of buckets), it handles unseen categories automatically, and it requires no stored mapping. The failure mode is hash collisions: two different categories land in the same bucket and the model conflates them. With enough buckets relative to categories, collisions are rare enough to be acceptable.`,
      `**Model type and encoding interact strongly.** Trees find their own optimal split thresholds on any encoding, so ordinal encoding harms them less — the tree learns "if code > 25, go left" without caring that the ordering is arbitrary. Linear models treat the integer as a quantitative predictor and multiply it by a coefficient, making ordinal encoding on unordered categories a direct source of bias. Neural networks benefit most from embedding layers for high-cardinality features because one-hot input to dense layers is equivalent to an embedding lookup with redundant computation.`,
    ],
    takeaway: `Every encoding encodes an assumption about category structure. Ordinal encoding asserts that distance between categories is real. One-hot asserts equal distance but creates sparsity at scale. Target encoding is compact but leaks labels without cross-validation. The wrong encoding for the wrong feature is not a preprocessing detail — it is a false claim that the model will learn as if it were true.`,
    checkQuestions: [
      {
        q: `You apply ordinal encoding to a 'city' feature with 50 unique values and train a linear regression. What exactly goes wrong?`,
        options: [
          `A) Ordinal encoding increases the cardinality of the feature, causing gradient descent to converge more slowly than with one-hot encoding.`,
          `B) Ordinal encoding introduces a dummy variable trap because the integers 0–49 sum to a predictable total, creating perfect multicollinearity with the intercept term.`,
          `C) Ordinal encoding forces the model to treat all 50 cities as equally spaced on a continuous scale, which slightly underestimates the effect of the most common city category.`,
          `D) Ordinal encoding assigns integers 0-49 in arbitrary order. Linear regression learns a single coefficient for the city feature, multiplied by the integer. The model is forced to assume city 49 has exactly 49× the effect of city 1 — no basis in reality. Cities with adjacent integers are treated as similar; high integers get disproportionate weight. The model fits a meaningless linear trend across an arbitrary ordering. One-hot encoding gives independent coefficients for each city. Tree models are less affected (they learn threshold splits not linear relationships).`,
        ],
        answer: `D`,
      },
      {
        q: `Walk through exactly why target encoding without cross-validation causes data leakage.`,
        options: [
          `A) When computing target encoding by taking mean target for all rows with category X, you INCLUDE the row you're about to use as a training example. That row's own target value contributes to the encoded feature value. In the extreme case: a category with only one row → encoded value IS the target (direct copy of what model is predicting → artificially perfect training accuracy). Fix: leave-one-out (exclude current row's target from mean) or fold-based encoding (compute means from training folds only).`,
          `B) Target encoding without cross-validation leaks because the encoding is fitted on the validation set instead of the training set, allowing validation labels to contaminate training feature values.`,
          `C) Target encoding causes leakage by allowing the model to memorize category-level statistics instead of learning the underlying patterns, which inflates training accuracy but not test accuracy.`,
          `D) Target encoding without cross-validation leaks because the global mean target used as a fallback for unseen categories reveals the class balance of the full dataset including the test set.`,
        ],
        answer: `A`,
      },
      {
        q: `At inference time, your model receives a city it has never seen in training. How does each encoding strategy handle this, and which is most robust?`,
        options: [
          `A) All encoding strategies raise a KeyError for unseen categories; the only robust approach is to add an explicit "unknown" category during training with enough examples to learn a meaningful representation.`,
          `B) One-hot encoding and target encoding both fail silently for unseen categories; ordinal encoding is the most robust because it can always assign the next available integer.`,
          `C) One-hot: sets all city indicator columns to 0 (silent implicit "other" category, may produce unpredictable behavior). Ordinal: no valid integer for unseen city — must assign "unknown" integer or raise error. Target encoding: no mean target for unseen city — typical fallback is global mean target (reasonable but loses per-category signal). Hash encoding: maps new city to bucket automatically via hash function — ALWAYS produces valid bucket index, most naturally robust to new categories.`,
          `D) Target encoding is most robust for unseen categories because the global mean fallback produces the same prediction as the base rate, which is always the safest default for unknown inputs.`,
        ],
        answer: `C`,
      },
      {
        q: `A feature has 5,000 unique merchant IDs and you are training a neural network. Why is one-hot encoding a bad choice?`,
        options: [
          `A) One-hot encoding 5,000 merchant IDs is computationally feasible but semantically wrong — the binary representation falsely implies that all merchants are equidistant from each other in feature space.`,
          `B) One-hot 5,000 merchant IDs → 4,999 binary columns. With 100,000 rows, each column has average 20 non-zero values — extremely sparse input. Neural networks learn poorly from sparse inputs: gradient flow through nearly-all-zero feature vectors is weak, weight updates small, most neurons learn nothing from most examples. Embedding layer: directly looks up learned dense vector for each merchant ID without constructing 5,000-dimensional sparse input, uses same 5,000 × d parameters, can capture semantic similarity between merchants.`,
          `C) One-hot encoding 5,000 IDs creates the dummy variable trap at scale — the 5,000 columns sum to exactly 1 for every row, producing perfect multicollinearity that causes gradient descent to diverge.`,
          `D) One-hot encoding is a bad choice because merchant IDs change over time as new merchants onboard, requiring the model to be retrained from scratch whenever a new merchant appears.`,
        ],
        answer: `B`,
      },
    ],
  },
  {
    id: 'feature_scaling',
    title: 'Feature Scaling',
    subtitle: `Ensure features are on comparable scales so that gradient descent, distance metrics, and regularization work correctly.`,
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['scaling', 'standardization', 'normalization', 'robust scaling', 'data leakage'],
    summary: `The problem with unscaled features is that most ML algorithms are sensitive to magnitude in ways that have nothing to do with predictive value.

Gradient descent steps are proportional to gradient magnitude — a feature on [0, 100,000] produces gradients 100,000 times larger than a feature on [0, 1], causing the optimizer to devote nearly all of its updates to the large-scale feature and ignore the small-scale one. K-Means and KNN compute Euclidean distance, so annual income in dollars is 1,000 times more influential than age in years — the clustering ignores age entirely without scaling. L1 and L2 regularization penalize coefficient magnitude, but when features live on different scales, the coefficients differ by a factor of that scale even for features with equal effect size, producing a biased penalty that shrinks small-scale features more aggressively than large-scale ones. Tree models are the exception: they split on thresholds, and the relative ordering of values is unchanged by scaling, so trees gain nothing from it. The scaling choice (standardization, min-max, robust) depends on whether outliers are present and meaningful — min-max is destroyed by a single extreme value.`,
    keyPoints: [
      `**Fit the scaler on the training set only, then apply the fitted parameters to train, val, and test.** Fitting on the full dataset computes statistics that include test-set values. The training transformation then reflects the test distribution — a form of data leakage that produces optimistic metrics which collapse when the model encounters truly unseen data.`,
      `**Min-max normalization is the wrong choice when outliers are present.** A column [1, 2, 3, 4, 10000] normalizes to approximately [0, 0, 0, 0, 1.0]. The outlier owns the entire range and every other value collapses to near zero. The model loses the ability to distinguish between values 1 through 4 — they are all mapped to the same region of feature space.`,
      `**Robust scaling (median + IQR) is designed for datasets where extreme values are real data, not errors.** It maps the median to 0 and the interquartile range to a fixed interval, making it far less sensitive to outliers than standardization. The tradeoff is that it does not guarantee a specific output range — values outside the IQR can extend well beyond [-1, 1].`,
      `**Neural networks are particularly sensitive to input scale because gradient magnitudes propagate back through all layers multiplicatively.** A large-scale input feature produces large activations in the first layer, large gradients flowing backward, and large weight updates — while small-scale features receive near-zero gradient updates. Batch normalization mitigates this at intermediate layers but does not replace proper input scaling.`,
      `**K-Means is entirely determined by Euclidean distance.** A customer dataset with age (range 60) and annual income (range 180,000) assigns income a 3,000-times larger contribution to every pairwise distance calculation. Without scaling, K-Means clusters entirely by income and treats age as invisible. After standardization, each feature contributes equally to distance — both features matter.`,
      `**Regularization penalizes coefficient magnitude.** Feature A on [0, 1] and feature B on [0, 1000] have coefficients that differ by a factor of 1000 for the same effect size. L2 penalty applies to both equally — it shrinks A's coefficient far more aggressively relative to its actual importance. Without scaling, regularization punishes small-scale features and leaves large-scale features undertrained.`,
      `**Tree models split on threshold values: "income > 50000" and "income_scaled > 0.5" identify the identical training partition.** The optimal threshold value shifts with scaling but the optimal split does not. Scaling tree inputs wastes computation and provides zero accuracy benefit.`,
      `**In cross-validation, fit the scaler inside each fold on that fold's training data only, then apply to the validation fold using the training-fold parameters.** Fitting the scaler on the full training set before the CV loop leaks fold-level statistics — the validation fold's distribution influences the scaling parameters used to transform it.`,
      `**When adding new features to an existing deployed model, refit the scaler on the updated training set that includes the new features.** Stale scaling parameters from the original training run no longer reflect the distribution of the new features and will silently distort their values at serving time.`,
    ],
    takeaway: `Gradient descent, Euclidean distance, and regularization all implicitly weight large-scale features over small-scale ones — through optimization dynamics, not through any signal about importance. Scale the inputs to remove this artifact. Fit the scaler on training data only, and refit it inside the cross-validation loop, not outside it.`,
    checkQuestions: [
      {
        q: `You fit a StandardScaler on your entire dataset (train + test combined) before splitting. What exactly is wrong?`,
        options: [
          `A) Computing mean and std over the full dataset means statistics are influenced by test-set values. The training data transformation reflects the test distribution — data leakage. CV and test-set accuracy are optimistically biased because the model has seen, through the scaler, statistical properties of examples it is supposedly evaluated on. Correct: fit scaler on training fold only, apply same fitted scaler to both training fold and validation/test.`,
          `B) Fitting on the full dataset computes a mean that overrepresents the majority class, causing the scaler to center features at values unrepresentative of the minority class.`,
          `C) Fitting the scaler before splitting means you cannot use the same scaler inside cross-validation folds, forcing you to fit a new scaler for each fold which increases computation time.`,
          `D) The StandardScaler requires a minimum of 1,000 samples per class to compute stable mean and standard deviation estimates; fitting on the full dataset inflates these estimates.`,
        ],
        answer: `A`,
      },
      {
        q: `A K-Means clustering of customer data with features [age (range 20-80), annual_income (range 20,000-200,000)] produces clusters entirely separated by income and ignores age. Why and fix?`,
        options: [
          `A) K-Means computes Euclidean distance. Income range = 180,000; age range = 60. A 1-year age difference contributes 1 unit to Euclidean distance; a $1,000 income difference contributes 1,000 units. Income dominates so completely that age is effectively invisible — two customers same income but 30 years apart look nearly identical. Fix: standardize both features before clustering. After standardization, each feature has std=1, so 1-std differences in both features contribute equally to distance.`,
          `B) K-Means assigns cluster membership based on the feature with the highest variance; since income has higher variance than age, it automatically dominates. The fix is to use PCA to combine both features into a single principal component before clustering.`,
          `C) The clustering is correct — income is a more important segmentation variable than age for most business use cases. Standardizing would artificially inflate the importance of age.`,
          `D) K-Means uses Manhattan distance by default in sklearn, which gives equal weight to all features regardless of scale. The income-dominated clusters suggest a data quality issue where age was recorded incorrectly.`,
        ],
        answer: `A`,
      },
      {
        q: `You are doing 5-fold cross-validation and you fit a MinMaxScaler on the full training set before the CV loop. What is the consequence?`,
        options: [
          `A) Fitting the MinMaxScaler before the CV loop means all 5 folds share the same scaling parameters, which reduces variance in the CV estimate but introduces a small amount of pessimistic bias.`,
          `B) The MinMaxScaler fitted before the CV loop will have its parameters invalidated when the CV loop creates train/validation subsets, causing sklearn to automatically refit the scaler on each fold anyway.`,
          `C) MinMaxScaler computes min and max across all 5 folds combined. When evaluating fold 1 as validation, scaler was already fit using fold 1 values — fold 1's min/max contributed to scaling parameters. Validation fold transformation reflects statistics derived from validation examples — leakage. Correct approach: fit scaler INSIDE CV loop on training folds, then transform validation fold using only training-fold statistics.`,
          `D) The consequence is purely computational — fitting the scaler once before the loop is more efficient than fitting it inside each fold, and the accuracy difference is negligible for min-max scaling.`,
        ],
        answer: `C`,
      },
      {
        q: `Why does applying StandardScaler to inputs of a random forest not improve performance, while applying it to logistic regression typically does?`,
        options: [
          `A) StandardScaler improves both model types equally when features have different units; the perceived difference in benefit is due to random forest's higher baseline accuracy masking the improvement.`,
          `B) Random forest learns by finding optimal binary splits on individual features: "feature X > threshold T?" Answer is identical regardless of whether X is original scale or standardized — relative ordering preserved, same optimal threshold exists. Logistic regression learns weighted sum: if x1 ranges 0-1 and x2 ranges 0-100,000, gradient descent updates w2 much more slowly and regularization penalizes w1 much more aggressively for same effect size. Standardization removes this asymmetry — faster convergence and fairer regularization.`,
          `C) Random forest does not benefit from StandardScaler because it uses rank-based splits internally, which are already scale-invariant by design, unlike logistic regression which uses raw feature values.`,
          `D) StandardScaler helps logistic regression only when features have different units (e.g., dollars vs. years); when all features are in the same units, the benefit disappears for both model types.`,
        ],
        answer: `B`,
      },
    ],
  },
  {
    id: 'class_imbalance',
    interactiveId: 'class_imbalance_viz',
    title: 'Class Imbalance',
    subtitle: `When 99% of examples are one class, accuracy is a lie — learn the techniques that actually work.`,
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['imbalance', 'SMOTE', 'class weights', 'oversampling', 'undersampling', 'threshold moving'],
    interactivePrompt: `Before you touch the controls: if you trained a model on 999 legitimate transactions and 1 fraud, and it achieved 99.9% accuracy — would you ship it?`,
    summary: `You are building a fraud detection system. Your dataset has 999 legitimate transactions for every 1 fraudulent one. You train a model and it achieves 99.9% accuracy. Your stakeholder is satisfied. You should not be.

A classifier that predicts "legitimate" for every single transaction — no learning, no computation, just a constant output — also achieves 99.9% accuracy on this dataset. The model never needed to look at a single feature. Accuracy is measuring the wrong thing: how often the model matches the majority class, which it can do by ignoring the minority class entirely.

The problem is not in the data. Fraud is rare; that is a fact about the world, not a flaw in the dataset. The problem is in how a standard cross-entropy loss responds to this reality. It sums the loss across all examples. With 999 legitimate transactions per fraud, the loss is driven 999 times harder by getting legitimate transactions right than by catching fraud. The gradient points almost entirely away from fraud. The model learns to ignore it.

Three interventions operate at different points in the pipeline. Cost-sensitive training with class_weight='balanced' adjusts the loss itself: each minority example is weighted by its inverse frequency, so a fraud example contributes as much to the gradient as 999 legitimate examples combined. No data is added or removed — the adjustment is purely in how the loss is computed. This is the cleanest first move.

SMOTE (Synthetic Minority Oversampling Technique) takes a different approach: generate new minority examples by interpolating between existing ones in feature space. Two real fraud transactions are neighbors in feature space; SMOTE creates a synthetic fraud between them. The model trains on a denser minority region and has more decision boundary information to learn from. But SMOTE has a failure mode: when fraud and legitimate transactions heavily overlap in feature space, interpolating between minority examples generates synthetic points that land inside the majority region. The synthetic fraud looks like a legitimate transaction. The training signal is contradictory.

Threshold moving does not touch the training process at all. It asks: given the model\`s probability output, what threshold should trigger a fraud flag? The default is 0.5. But if each missed fraud costs $10,000 and each false positive costs $50 in manual review time, the optimal threshold is far lower — you should flag anything above 0.2 or 0.15. The threshold is not a modeling decision; it is a business cost decision.

**NOT this.** Most people reach for SMOTE as the default answer to class imbalance. Actually, SMOTE is one tool with specific failure modes. For severe imbalance at 1:10,000, cost-sensitive training typically outperforms synthetic sampling because fraud examples are heterogeneous — synthesizing between them produces unrealistic points. For fraud detection specifically, calibrated threshold tuning typically outperforms resampling because the cost asymmetry is extreme and well-defined.

The evaluation metric is the deeper issue. F1 score, precision-recall AUC, and Matthew\`s Correlation Coefficient measure minority class performance directly. AUC-ROC can reach 0.97 on a dataset where the model catches almost no fraud, because the massive true negative count dominates the denominator. Never report accuracy on an imbalanced dataset. It is not a partial truth — it is actively misleading.`,
    keyPoints: [
      `**Use cost-sensitive training as your first move on any imbalanced tabular problem.** Set class_weight='balanced' in sklearn or scale_pos_weight in XGBoost. This requires no data modification, carries no SMOTE-before-split leakage risk, and integrates cleanly into cross-validation. Reserve SMOTE for cases where the minority class is so sparse that the model literally cannot learn its decision boundary — roughly, fewer than a few hundred minority examples in training.`,
      `**The most common production trap: applying SMOTE to the full dataset before the train-test split.** Synthetic minority samples are generated by interpolating between real minority examples. If those real examples are in both train and test, the synthetic samples are geometrically close to test-set points. The test set is contaminated with structure derived from training data. Evaluation looks strong; production collapses. Always split on real data first, then apply SMOTE only inside the training fold.`,
      `**Diagnose your model with a precision-recall curve, not a single threshold.** Plot precision vs. recall across all possible thresholds. The shape of the curve tells you how the tradeoff behaves at your operating point. Then compute the business cost at each threshold — multiply false negative count by the cost of a missed fraud, false positive count by the cost of a false review — and pick the threshold that minimizes total expected cost. A model with recall 0.9 and precision 0.3 may be exactly right if the cost asymmetry is 200:1 in favor of catching fraud.`,
    ],
    takeaway: `Accuracy on an imbalanced dataset measures how well the model predicts the majority class — which it can do by ignoring minority examples entirely. The fix starts with the metric, then the loss function, then the decision threshold. Resampling is a last resort, not a default.`,
    checkQuestions: [
      {
        q: `Your fraud model achieves 99.2% accuracy and your colleague is satisfied. What would you check?`,
        options: [
          `A) Check for class imbalance in the training set and verify the model's F1 score on the test set. If F1 is above 0.9, the 99.2% accuracy is genuine and the model is working correctly.`,
          `B) Check whether the model was trained with sufficient regularization — high accuracy on imbalanced data is often a sign that L2 regularization is too weak and the model has overfit to the majority class.`,
          `C) Check the AUC-ROC score — if AUC-ROC is above 0.95, the accuracy is meaningful and the model is distinguishing fraud from legitimate transactions correctly.`,
          `D) First check baseline: if 99% of transactions are legitimate, predicting "not fraud" for everything yields 99% accuracy. Check recall: what fraction of actual fraud cases does the model correctly flag? A model with 99.2% accuracy and 0% recall catches no fraud. Check precision: of cases flagged as fraud, what fraction are actually fraudulent? Compute AUC-PR which directly measures performance on the minority class. High accuracy + low recall + low AUC-PR = sophisticated version of "always predict not fraud" = useless.`,
        ],
        answer: `D`,
      },
      {
        q: `Why is applying SMOTE to the full dataset before splitting into train and test sets invalid?`,
        options: [
          `A) SMOTE generates synthetic minority samples by interpolating between real minority samples. If applied before splitting, some synthetic samples will be geometrically near real test-set minority examples — the test set then contains synthetic data structurally similar to training points and is no longer a valid holdout. Correct: split into train/test using real data FIRST, then apply SMOTE ONLY to training set. Test set must always contain only real, unmodified examples.`,
          `B) SMOTE applied before splitting is invalid because it changes the class balance of the test set, making it impossible to compute meaningful precision and recall metrics on the held-out data.`,
          `C) SMOTE applied before splitting is invalid because it requires knowing the class labels of the test set, which means the model has implicitly seen the test labels during preprocessing.`,
          `D) SMOTE applied before splitting is computationally wasteful — synthetic samples generated from the full dataset will be discarded when the test set is held out, so applying SMOTE inside the training set is more efficient.`,
        ],
        answer: `A`,
      },
      {
        q: `Compare class weighting and SMOTE: when would you choose one over the other for a 50:1 imbalanced tabular dataset?`,
        options: [
          `A) Always use SMOTE for tabular data — class weighting only adjusts the loss function, while SMOTE physically creates new training examples that give the model more minority-class decision boundary to learn from.`,
          `B) Always use class weighting — SMOTE is only appropriate for image data where interpolating pixel values produces realistic augmented examples, not for tabular data where interpolation between rows lacks domain meaning.`,
          `C) Class weighting is almost always first choice for tabular data: no data modification, works natively in most model implementations, integrates cleanly with cross-validation, scales to any imbalance ratio. SMOTE preferred when the minority class is genuinely underrepresented in feature space — too few minority examples for model to learn a good decision boundary. For 50:1 with thousands of minority examples: class weighting sufficient. For 50:1 with only 50 minority examples: SMOTE creates denser minority region. For deep learning: class weighting almost always preferred.`,
          `D) Choose between them based on model type: class weighting works best for gradient boosted trees while SMOTE works best for logistic regression and neural networks.`,
        ],
        answer: `C`,
      },
      {
        q: `You lower classification threshold from 0.5 to 0.2 and recall increases 0.6 to 0.9 but precision drops 0.8 to 0.3. Is this an improvement?`,
        options: [
          `A) No — the F1 score decreased. F1 is the harmonic mean of precision and recall, and a precision drop from 0.8 to 0.3 outweighs a recall gain from 0.6 to 0.9, so the lower threshold makes the model worse.`,
          `B) Depends entirely on the relative cost of false negatives vs. false positives in deployment context. Higher recall (0.9) catches 50% more actual fraud. Lower precision (0.3) means more false positives. If each fraud costs $5,000 uncaught and each false positive triggers $50 manual review, threshold 0.2 is likely right. The decision cannot be made from numbers alone without knowing the business cost ratio — compute expected cost at each threshold and choose the minimum.`,
          `C) Yes — recall is the primary metric for fraud detection, and any improvement in recall is always an improvement in a fraud model regardless of the precision impact.`,
          `D) Yes — the model now catches 90% of fraud cases, which exceeds the industry standard threshold of 85% recall required for a production fraud detection system.`,
        ],
        answer: `B`,
      },
      {
        q: `What is the SMOTE failure mode when minority and majority classes heavily overlap in feature space?`,
        options: [
          `A) When classes overlap heavily, SMOTE generates synthetic samples that are indistinguishable from majority class examples, causing the model to learn that all high-density regions belong to the minority class.`,
          `B) Heavy class overlap causes SMOTE to generate synthetic samples that are exact duplicates of existing minority samples, providing no new geometric information and negating the benefit of oversampling.`,
          `C) Heavy class overlap makes SMOTE extremely slow because the k-NN search must examine a larger fraction of the dataset to find the k nearest minority neighbors for each sample.`,
          `D) SMOTE generates synthetic minority samples by interpolating between existing minority samples. When classes overlap significantly, some minority samples are surrounded by majority samples. Synthetic points generated by interpolating between minority samples will FALL INSIDE the majority-class region — misleading/contradictory training signal. This is why SMOTE-ENN and SMOTE-Tomek exist: they apply undersampling after SMOTE to remove synthetic samples misclassified by k-NN, cleaning the decision boundary.`,
        ],
        answer: `D`,
      },
    ],
  },
  {
    id: 'data_splits_and_leakage',
    title: 'Data Splits and Leakage',
    subtitle: `Understand why models that look great in development fail in production — and the exact mistakes that cause it.`,
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['train-test split', 'cross-validation', 'data leakage', 'temporal leakage', 'overfitting'],
    interactivePrompt: `Before you touch the controls: you split patient records 80/20 at random, trained a readmission model, and got 91% validation accuracy — what would you check before trusting that number?`,
    summary: `You are predicting hospital readmission. You have records for 5,000 patients, some of whom have been admitted multiple times. You do a standard random 80/20 split, train a model, and get 91% validation accuracy. You feel good. You deploy. Production accuracy is 73%. Nothing in your training pipeline threw an error.

Here is what happened. Patient 147 has twelve hospital visits in the dataset. Your random split put ten of those visits in training and two in validation. The model learned patient 147\`s specific patterns — their particular lab values, their age, their comorbidities — during training. When it saw the remaining two visits in validation, it was not generalizing to new patients; it was recognizing a patient it had already studied. Eighteen percentage points of your "validation accuracy" was measuring memorization, not generalization. This is group leakage: related examples split across train and test, so the test set is not independent of the training set.

Group leakage is one of four leakage types, each requiring a different structural fix. Temporal leakage occurs in time-ordered data when you use a random split: the model trains on records from March to predict records from January, which is the reverse of every real deployment. In production, January always comes before March — you never have future information at prediction time. The fix is a strict temporal cutoff: all training examples before a date, all validation examples after it.

Preprocessing leakage is quieter and extremely common. You fit a StandardScaler on all 5,000 patient records, then split. The scaler\`s mean and standard deviation were computed using validation-set values. The training transformation is colored by the data you are supposedly evaluating on. Every imputer, encoder, and scaler must be fit exclusively on training data and then applied to validation — not the other way around. A sklearn Pipeline enforces this structurally; without one, you rely on discipline, which fails.

Feature leakage hides inside individual columns. A feature called "rehospitalization_within_30_days" on a row labeled for readmission prediction is the answer masquerading as an input. Any feature requiring knowledge of the outcome is a label-derived feature, and it is unavailable at prediction time. A sudden 15-point accuracy jump after adding a single new feature is the canonical signal — genuine features do not produce that kind of gain.

**NOT this.** Most people think that having a held-out test set means their evaluation is valid. Actually, a held-out test set prevents evaluation overfitting but does not prevent feature leakage. If your features were computed using future data — even on rows that ended up in your training set — the model learned a pattern that does not exist at deployment time. The test set was never touched during training, but the features already carry information that will be absent in production. Separation of the dataset means nothing if the feature engineering did not honor the temporal boundary.

Data leakage is formally defined as any mechanism by which information from evaluation examples reaches the training process. It fires no error. Validation metrics look excellent. The model ships. It fails on real data. The only protection is structural: split before fitting any transformer, validate on data the model has never touched, and audit every feature for whether it was available before the prediction timestamp.`,
    keyPoints: [
      `**Use group-based splits whenever examples share an entity — patient, user, household, time series.** A random split on a medical dataset with ten records per patient puts the same patient in both train and test; validation measures how well the model memorizes patients, not how well it generalizes to new ones. Group k-fold assigns all of a given patient\`s records to a single fold. This is non-negotiable if entity-level generalization is what you are deploying for.`,
      `**The most common production trap: fitting preprocessing transformers outside the cross-validation loop.** Fitting a StandardScaler or SimpleImputer before the loop means its statistics were computed on data that includes every validation fold. Each fold\`s validation data contaminated the scaler. The correct order: inside each fold, fit all transformers on the training portion, apply fitted transformers to validation. Use sklearn Pipeline to make this structurally impossible to get wrong.`,
      `**Diagnose leakage with a feature correlation audit and a single-feature accuracy test.** Before training on a new feature: (1) check its correlation with the target — above 0.8 on a complex real-world problem is suspicious; (2) train a model using only that single feature and check accuracy — suspiciously high single-feature performance often indicates label derivation; (3) verify the feature\`s computation timestamp is strictly before the label timestamp in your data pipeline. A feature that causes a 15+ point accuracy jump in isolation is almost certainly leaking.`,
    ],
    takeaway: `Leakage fires no error and produces no warning — the model trains cleanly, metrics are excellent, and the system ships. It fails when real data arrives. The only protection is structural: enforce the split before any transformer is fit, audit every feature for temporal validity, and never reuse the test set.`,
    checkQuestions: [
      {
        q: `You build a model to predict customer churn. You include 'support_tickets_after_churn_date' as a feature. The model achieves 98% accuracy. What is the problem?`,
        options: [
          `A) Label leakage through a target-derived feature. "Support tickets after churn date" can only be known AFTER the customer has already churned — using future information (post-churn behavior) to predict whether the customer churns. At prediction time (before churn happens), this feature is unknown. The model achieves 98% because it has essentially been given the answer. In production, for currently active customers, this feature is unavailable and accuracy will collapse.`,
          `B) The model is overfitting to the support ticket count, which is a noisy signal — the fix is to add regularization and cap the feature at the 95th percentile to reduce its influence on the model.`,
          `C) The 98% accuracy is actually legitimate — support ticket behavior is a strong predictor of churn intent, and customers who submit many tickets before churning do so because they are dissatisfied.`,
          `D) The feature introduces multicollinearity because support ticket count is correlated with tenure, causing the model's coefficient estimates to be unstable and the 98% accuracy to be unreliable.`,
        ],
        answer: `A`,
      },
      {
        q: `Why does random train-test splitting fail for time-series forecasting, and what is the correct splitting strategy?`,
        options: [
          `A) Random splitting fails because it changes the class balance between train and test sets; for time-series data, stratified splitting by time period is required to maintain the correct temporal distribution.`,
          `B) Random splitting fails because time-series data has autocorrelation — randomly shuffled examples violate the independence assumption of most ML algorithms, causing inflated accuracy estimates.`,
          `C) Random splitting shuffles examples across time, so the model might be trained on March data to predict January. In production, January comes before March — March data would never be available when predicting January. The model learns temporal correlations backward, producing accuracy impossible to achieve in deployment. Correct strategy: temporal split — train on time 0 to T, validate on T to T+k. For CV: expanding or sliding window where each fold trains on earlier data and evaluates on immediately subsequent data.`,
          `D) Random splitting fails because seasonality patterns (weekly, monthly, annual) get split across train and test, causing the model to learn incomplete seasonal cycles that do not generalize to full cycles in production.`,
        ],
        answer: `C`,
      },
      {
        q: `You run 5-fold cross-validation on a medical imaging dataset with 500 patients and 20 images per patient. You get CV accuracy of 94%. You deploy and get 71%. What happened?`,
        options: [
          `A) The 5-fold CV used too few folds — with 500 patients, 10-fold or leave-one-out CV is required to get an unbiased estimate. Using only 5 folds optimistically inflates the estimated accuracy.`,
          `B) Group leakage: random 5-fold split put different images from the same patient into different folds. Patient might have 16 images in training and 4 in validation. Model learned patient-specific patterns (lighting, scanner calibration, anatomy) during training and validated on different images of patients it already knew. 94% CV measures generalization to new images of seen patients — much easier than new patients entirely. 71% is true generalization. Fix: grouped k-fold — all images of a given patient must stay in the same fold.`,
          `C) The model was trained on a dataset that included images from the same scanner, but the deployed model encounters images from different scanners — a distribution shift problem unrelated to the splitting strategy.`,
          `D) The 94% CV accuracy was computed on augmented images during training but 71% production accuracy reflects the model's performance on unaugmented images in deployment.`,
        ],
        answer: `B`,
      },
      {
        q: `List three preprocessing operations that can cause leakage when applied before the train-test split.`,
        options: [
          `A) Feature selection, hyperparameter tuning, and model selection all cause leakage when performed before the train-test split because they use test-set performance to make decisions.`,
          `B) Outlier removal, duplicate detection, and missing value imputation all cause leakage because they use global dataset statistics that incorporate test-set rows.`,
          `C) Log transformation, binning, and interaction feature creation all cause leakage because they change the statistical properties of training features based on the full dataset distribution.`,
          `D) (1) StandardScaler and MinMaxScaler: fitting on full dataset computes mean/std/min/max across train and test together — training data normalization reflects test-set statistics; (2) SimpleImputer or KNNImputer: imputing missing values using full-dataset statistics means test-set values influence fill values used in training; (3) Target encoding: computing per-category mean target across full dataset means each row's encoded feature value reflects all other rows' labels including test set — direct channel for label information into training features.`,
        ],
        answer: `D`,
      },
      {
        q: `What is the correct order of operations for preprocessing inside a k-fold cross-validation loop?`,
        options: [
          `A) For each fold: (1) split training indices from validation indices; (2) using ONLY training indices, fit all preprocessing transformers (scaler, imputer, encoder); (3) transform training data using fitted transformers; (4) transform validation data using same fitted transformers (fitted on training only — NEVER refit on validation); (5) train model on transformed training data; (6) evaluate model on transformed validation data. Key invariant: validation data must always be transformed using parameters derived EXCLUSIVELY from training data.`,
          `B) Fit all preprocessing transformers on the full training set before the loop, then inside each fold: transform the training and validation portions, train the model, and evaluate. This is correct because fitting on the full training set avoids fold-specific outliers from influencing the transformer.`,
          `C) Inside each fold: first evaluate the model on the raw validation data to get a baseline, then fit preprocessing transformers on the training fold, transform the training fold, retrain the model, and report the improvement over baseline.`,
          `D) Fit all preprocessing transformers once on the entire dataset (train + test) before any splitting to ensure consistent feature distributions across all folds and the final test evaluation.`,
        ],
        answer: `A`,
      },
    ],
  },
  {
    id: 'feature_selection',
    title: 'Feature Selection',
    subtitle: `Reduce dimensionality to fight overfitting, cut training cost, and build models that generalize.`,
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['feature selection', 'curse of dimensionality', 'LASSO', 'RFE', 'mutual information', 'multicollinearity'],
    summary: `Adding features without adding data is one of the most reliable ways to degrade model generalization. Every new feature adds a dimension to the feature space, and in high-dimensional spaces data points become equidistant — the geometric structure that learning algorithms depend on breaks down. A regression model with 200 features and 500 training rows has more degrees of freedom than examples to constrain them; it will memorize the training noise rather than learning signal. The rule of thumb is roughly 10 training examples per feature for regression to generalize reliably. Feature selection is not about finding which features are "good" — it is about finding the right set that trades accuracy for generalization. Filter methods are fast but blind to interactions. Wrapper methods (RFE) are expensive but model-aware. Embedded methods (LASSO, tree importance) perform selection during training. VIF detects multicollinearity, where two near-collinear features cause each other's coefficients to become unstable and their signs to flip across training runs.`,
    keyPoints: [
      `**~10 training examples per feature is a rule of thumb for regression to generalize reliably.** A 200-feature dataset with 500 rows is severely underdetermined — the model has 200 free parameters to fit 500 examples, and most of those 200 features will absorb noise. Adding features without proportional data growth pushes the model deeper into the overfitting regime.`,
      `**Filter methods evaluate features in isolation using correlation, mutual information, or chi-squared statistics.** A feature with zero marginal correlation to the target might be essential in combination with another feature — it carries no individual signal but captures a critical interaction. Filter methods discard it. This is their structural limitation: they cannot discover features that matter only jointly.`,
      `**Mutual information captures non-linear statistical dependence between a feature and the target.** A feature with a U-shaped or V-shaped relationship to the target has zero Pearson correlation — linear correlation is blind to it. Pearson-based filtering discards it; mutual information retains it. Use mutual information when the feature-target relationship may be non-monotone.`,
      `**RFE trains a model, removes the lowest-importance feature, and repeats until the desired number of features remains.** For p features, this requires p model fits — expensive but effective because each elimination decision is made by a model that sees the interaction structure. The resulting subset is aware of which features are redundant when others are present, which filter methods cannot assess.`,
      `**LASSO (L1 regularization) drives some coefficients to exactly zero by the geometry of the L1 constraint region — the optimization landscape intersects the L1 diamond at corners where coordinates are zero.** Ridge (L2) pushes coefficients toward zero but almost never to exactly zero. Increasing LASSO regularization strength increases sparsity. This is feature selection embedded in the training objective, which avoids the separate selection-then-fitting pipeline.`,
      `**VIF (Variance Inflation Factor) above 10 indicates severe multicollinearity: one feature is a near-linear combination of others.** The consequence is that the feature's coefficient becomes unstable — small changes in training data cause large swings in the estimated coefficient, and its sign can flip. The model cannot attribute credit correctly between the correlated features because both carry nearly the same information.`,
      `**Tree feature importance (total impurity reduction across all splits) is biased toward high-cardinality features.** A feature with many unique values offers more potential split points and therefore produces higher impurity reduction scores even if the feature has no predictive value. Permutation importance is a better diagnostic: shuffle the feature and measure the drop in validation performance. A genuine feature causes a large drop when shuffled; a spurious high-cardinality feature does not.`,
      `**Selecting features based on test-set performance is leakage.** The test set is no longer a valid generalization estimate once it has influenced any modeling decision, including which features to include. Feature selection must happen using training data only, ideally inside each cross-validation fold so that the feature subset is itself not overfit to a particular train-val partition.`,
      `**When regularization is available — LASSO, Ridge, Elastic Net, tree depth limits — explicit feature selection is often unnecessary.** Regularization manages the bias-variance tradeoff automatically during training. Explicit feature selection adds value when the goal is interpretability (a regulator needs to understand which features are used), inference cost reduction (fewer features reduce serving latency), or an auditable fixed feature set that cannot change between retraining runs.`,
      `**Stepwise selection (forward or backward) greedily adds or removes features one at a time.** Each step is optimal given the current set, but greedy choices are irreversible — a feature removed in early backward selection cannot re-enter the set even if its value becomes apparent in combination with later-selected features. Stepwise is computationally tractable but can miss the globally optimal subset.`,
    ],
    takeaway: `More features always increase model capacity and often increase overfitting. Feature selection is a bias-variance tradeoff: too few features and the model misses signal; too many and it memorizes noise. Performing selection on the test set is leakage that invalidates the evaluation — it must happen inside the training process, ideally inside each cross-validation fold.`,
    checkQuestions: [
      {
        q: `You filter features by Pearson correlation with target and retain only top 20. Your model performs worse than with all 100 features. What most likely went wrong?`,
        options: [
          `A) Retaining only 20 features likely dropped several highly correlated features that were providing redundant but stabilizing signal; ridge regression on all 100 features would have been a better choice than filter-based selection.`,
          `B) The top-20 Pearson correlation cutoff was too aggressive — retaining the top 40 features would have preserved enough signal for good performance while still reducing overfitting.`,
          `C) Pearson correlation measures linear dependence between a single feature and target IN ISOLATION. Features with weak marginal correlation may still be essential when combined with other features (capture interaction effects). Additionally, non-linear relationships (quadratic, U-shaped) have near-zero Pearson correlation but strong predictive value. Filter methods cannot detect this — they evaluate features one at a time. Fix: use mutual information (captures non-linear dependence) or wrapper methods (evaluate feature subsets via model performance, capturing interactions).`,
          `D) The model overfit to the 20 selected features because the smaller feature set gave gradient descent fewer parameters to regularize, causing the model to memorize the training data more aggressively.`,
        ],
        answer: `C`,
      },
      {
        q: `Why does LASSO shrink some coefficients to exactly zero while Ridge (L2) rarely does?`,
        options: [
          `A) LASSO uses a higher default regularization strength than Ridge, causing more aggressive shrinkage; if Ridge were tuned to the same regularization strength as LASSO, it would also produce exact zeros.`,
          `B) Geometry of constraint region differs between L1 and L2. L2 adds penalty proportional to sum of squared coefficients — a smooth sphere in coefficient space. The optimization minimum almost never hits a coordinate axis, so coefficients pushed toward (but not to) zero. L1 adds penalty proportional to sum of absolute values — a diamond in coefficient space. Corners of the diamond lie on coordinate axes (where one or more coefficients are exactly zero). The optimization landscape intersects the L1 constraint region AT THESE CORNERS, producing exact zeros. Elastic Net (mixture of L1+L2) provides sparsity while stabilizing selection among correlated features.`,
          `C) LASSO uses coordinate descent optimization while Ridge uses gradient descent; coordinate descent naturally produces exact zeros as a numerical artifact of updating one coefficient at a time.`,
          `D) LASSO applies the penalty to the raw coefficient values while Ridge applies it to the squared coefficients; squaring small values makes them even smaller, which paradoxically prevents Ridge from reaching zero.`,
        ],
        answer: `B`,
      },
      {
        q: `You compute feature importance from a gradient boosted tree and find that 'customer_id' is the second most important feature. What has happened?`,
        options: [
          `A) Customer IDs encode temporal information — older customers have lower IDs and newer customers have higher IDs — so the model has learned to use ID as a proxy for customer tenure, which is a legitimate predictive signal.`,
          `B) The gradient boosted tree has discovered that certain customer IDs belong to VIP customers with systematically different behavior; this is a valid signal that should be preserved as a categorical feature.`,
          `C) The feature importance computation has a bug — customer_id should have been excluded from the feature matrix before training, and the impurity reduction scores for all other features need to be recomputed without it.`,
          `D) Tree feature importance (total impurity reduction across splits) is BIASED TOWARD HIGH-CARDINALITY FEATURES. "customer_id" is a unique identifier with cardinality = number of rows. The tree can use it to memorize training set: split on customer_id = 12345 perfectly isolates a single customer's rows → large impurity reductions at training time but generalizes to ZERO for new customers. Fix: remove identifier columns before training, or use PERMUTATION IMPORTANCE (measures actual performance degradation from shuffling feature rather than training-time impurity reduction).`,
        ],
        answer: `D`,
      },
      {
        q: `A linear model has two features that are 0.97 correlated (e.g., 'height_cm' and 'height_inches'). What specific failure mode does this cause and fix?`,
        options: [
          `A) Two near-identical features → model can achieve same prediction by assigning large positive weight to one and large negative to other — infinitely many coefficient combinations produce identical predictions. Normal equations become numerically near-singular: small data changes cause large coefficient swings. VIF likely >50. Symptoms: unstable coefficients across bootstrap samples, inability to interpret which feature is "important," coefficients may flip sign. Fix: (1) drop one correlated feature; (2) apply Ridge regression (L2 stabilizes under collinearity); (3) create single combined feature (average or principal component).`,
          `B) Two near-identical features cause the model to double-count the effect of height, producing coefficients that are half the true value for each feature. The fix is to divide both coefficients by 2 after fitting.`,
          `C) Near-perfect correlation between features causes gradient descent to oscillate during training, requiring a much smaller learning rate to converge. The fix is to reduce the learning rate by a factor proportional to the correlation coefficient.`,
          `D) Two features with 0.97 correlation will produce a VIF of exactly 33.3 (= 1/(1-0.97²)); if this is below 50, multicollinearity is not severe enough to require intervention.`,
        ],
        answer: `A`,
      },
    ],
  },
  {
    id: 'distribution_shift',
    title: 'Distribution Shift',
    subtitle: `The core assumption of supervised learning — train and deploy distributions match — is almost always violated in production.`,
    difficulty: 'advanced',
    estimatedMin: 55,
    tags: ['distribution shift', 'covariate shift', 'concept drift', 'label shift', 'model monitoring', 'KS test'],
    interactivePrompt: `Before you touch the controls: a recommendation model trained in January is deployed in March — if it starts failing, what would you check first to figure out whether you need to retrain?`,
    summary: `You trained a recommendation model on user behavior data from January and deployed it in March. By May, engagement has dropped 30%. No error was thrown. The API is responding. The model is outputting predictions. They are just wrong.

Here is the mechanism. In January, users engaged primarily with certain content types. A product change in February shifted behavior — new content formats, new interface patterns, different session lengths. The features the model was trained on now represent a different kind of user than they did at training time. This is covariate shift: the distribution of inputs P(X) has changed. The patterns that connected features to engagement outcomes may still hold for the users who behave like January users, but there are fewer and fewer of those in production every week.

Notice what does not happen: the model does not flag uncertainty. It does not return lower confidence scores. Model confidence is a function of learned weights applied to input features — it measures how far the input is from a decision boundary, not how representative the input is of the training distribution. A user who has never been seen by the model can still produce a high-confidence prediction. The prediction is wrong. The confidence score does not know that. You find out when ground-truth engagement labels arrive, weeks later.

The three types of shift require different responses, and confusing them is expensive. Covariate shift — P(X) changes, P(Y|X) stable — means the input distribution moved but the underlying relationship between features and outcomes did not change. The old labels are still correct; you just have fewer training examples that look like current production inputs. This can sometimes be corrected without retraining by importance weighting: upweight training examples that resemble current production, downweight examples that do not.

Concept drift — P(Y|X) changes — is different and worse. The same feature values now correspond to different outcomes. Fraudsters in 2024 have adapted their behavior to mimic legitimate transactions. A transaction that looked fraudulent in your training data now looks legitimate in production — not because the features changed, but because the meaning of those features for prediction has changed. Importance weighting your old training data does not help; the old labels are simply wrong. You need new labeled data and a retrain.

Prior shift — P(Y) changes, P(X|Y) stable — is the simplest case. The fraud rate increased from 0.1% to 0.3% but fraudulent transactions still look the same. The model\`s prediction distribution can be adjusted without retraining by estimating the new class prior.

**NOT this.** Most people respond to distribution shift with "the model needs retraining." Actually, the question is what changed and why, because the answer determines how urgently to act and what to retrain on. Covariate shift with stable P(Y|X) can be corrected by reweighting, buying time before a full retrain. Concept drift requires new labels immediately — there is no shortcut. Understanding which type you are facing is not a theoretical distinction; it is the difference between a hotfix and a two-week data collection effort.

Detection comes before diagnosis. PSI (Population Stability Index) monitors individual feature distributions against the training baseline. PSI < 0.1 is stable; PSI > 0.2 is a trigger for investigation. KS test on continuous features, Jensen-Shannon divergence on the prediction distribution. Track the prediction distribution as well — if P($\\hat{y}$) shifts, something upstream changed, even if you cannot immediately identify which feature. This infrastructure is not optional for any production ML system. Without it, the business discovers the shift before you do.`,
    keyPoints: [
      `**Use PSI per feature as your first production monitoring signal, not aggregate accuracy.** PSI buckets a feature\`s distribution into deciles and computes weighted divergence from the training baseline. PSI < 0.1 is stable; 0.1–0.2 warrants investigation; > 0.2 is a retraining trigger. Track per-feature, not aggregate — a single important feature shifting while others are stable will be invisible in any aggregate metric. Also monitor the prediction distribution: if P($\\hat{y}$) shifts without any feature shift, you have concept drift.`,
      `**The most common production trap: scheduled retraining (weekly, monthly) in a domain where shift happens in days.** Fraudsters observe your model\`s behavior and adapt within weeks of a new deployment. A fixed monthly retraining schedule is already two to four weeks behind by the time it fires. Build trigger-based retraining: fire when PSI exceeds 0.2 on a key feature, or when performance on a labeled validation window drops beyond a threshold. Scheduled retraining is acceptable in stable domains; in adversarial or fast-moving domains, it guarantees you are always working with stale assumptions.`,
      `**Diagnose shift type before choosing a response.** Stable feature PSI but degraded performance = concept drift signature (P(X) unchanged, P(Y|X) changed) — requires new labeled data and retraining, no shortcut. Shifted feature PSI but degraded performance = covariate shift candidate — try importance weighting first, which can buy weeks before a full retrain. To confirm covariate shift, train a logistic regression to classify "is this example from training or production?" If it classifies with high accuracy, the distributions are meaningfully different and importance weighting is appropriate.`,
    ],
    takeaway: `A model outputs confident predictions on shifted data — no error fires, no uncertainty is signaled, and performance degrades silently until ground-truth labels arrive. Whether you can fix it without new labels depends on what type of shift occurred. Only monitoring catches it before the business does.`,
    checkQuestions: [
      {
        q: `Your fraud model was trained in 2022. In 2024, fraudsters adopt a new technique that makes fraudulent transactions look like legitimate ones. What type of shift is this and can it be fixed without new labels?`,
        options: [
          `A) This is covariate shift: P(X) has changed because fraudulent transactions now have different feature distributions. It can be corrected by importance weighting old training data to match the new transaction distribution without requiring new labels.`,
          `B) This is label shift: P(Y) has changed because the fraud rate has decreased as fraudsters succeed in mimicking legitimate transactions. It can be corrected using Black Box Shift Estimation to adjust the predicted probability distribution.`,
          `C) This is concept drift: P(Y|X) has changed. In 2022, feature patterns predicting fraud were valid. In 2024, new fraud technique mimics legitimate transaction patterns — same feature values now have different labels. CANNOT be corrected by reweighting old training data — the 2022 labels are simply wrong for describing the 2024 relationship. Only fix: fresh labeled data (examples of new fraud pattern, labeled by human reviewers or rule-based systems) and retraining/fine-tuning. Covariate shift CAN sometimes be corrected by importance weighting without new labels, but concept drift CANNOT.`,
          `D) This is both covariate shift and concept drift simultaneously; the only reliable fix is a complete model rebuild using only data from 2024 with all 2022 training data discarded.`,
        ],
        answer: `C`,
      },
      {
        q: `Describe what happens to a model's confidence scores under distribution shift, and why this makes shift especially dangerous.`,
        options: [
          `A) Under distribution shift, model confidence scores decrease toward 0.5 as the model becomes uncertain about inputs it has not seen before — this provides a natural detection signal that can trigger alerts when average confidence drops below a threshold.`,
          `B) Model's confidence score is determined by learned parameters applied to input features — it is a function of the model's internal state, NOT of whether input is representative of training distribution. Under distribution shift, shifted inputs often land in regions where model produces HIGH-CONFIDENCE predictions. The model continues outputting 95% confidence even as accuracy collapses. Unlike a database query that errors on invalid input, the model SILENTLY returns a wrong answer with 95% confidence. No automatic error signal — only external ground truth labels or sophisticated distribution-level tests can detect it.`,
          `C) Distribution shift causes confidence scores to become perfectly calibrated — the model's 70% confidence predictions are correct exactly 70% of the time — making it easier to detect shift by comparing calibration curves between training and production.`,
          `D) Under mild distribution shift, confidence scores remain stable; only severe distribution shift (PSI > 0.5) causes confidence scores to diverge from their training-time distribution in a detectable way.`,
        ],
        answer: `B`,
      },
      {
        q: `What is the difference between covariate shift and concept drift, and why does the distinction determine whether you can avoid retraining?`,
        options: [
          `A) Covariate shift affects numeric features while concept drift affects categorical features; the distinction determines which type of reweighting or re-encoding strategy is needed.`,
          `B) Covariate shift happens gradually over months while concept drift happens suddenly in response to discrete events; the distinction determines whether to use a sliding window or a full historical dataset for retraining.`,
          `C) Covariate shift and concept drift are two names for the same phenomenon — any change in the input distribution that causes model performance to degrade. Both require the same fix: trigger-based retraining when PSI exceeds 0.2.`,
          `D) Covariate shift: P(X) changes but P(Y|X) stays same — old labeled training data is still correct, just underrepresents current input distribution. CAN be corrected by importance weighting: up-weight training examples resembling production, without collecting new labels. Concept drift: P(Y|X) changes — same feature values now predict different outcomes. Old training labels are WRONG under new relationship. Importance weighting on wrong labels produces wrong model. NEW LABELS are required. The distinction determines the fix: one requires reweighting (no new labels), the other requires new labeled data.`,
        ],
        answer: `D`,
      },
      {
        q: `You run a KS test comparing training and production distributions of your top 5 features and find p < 0.01 for one feature. What does this mean and what should you do?`,
        options: [
          `A) p < 0.01 on KS test means you can reject H₀ (same distribution) with 99% confidence — feature distribution has statistically significantly shifted. Next steps: (1) investigate MAGNITUDE of shift, not just significance — with large samples, even trivial shifts become significant. Use PSI: PSI > 0.1 warrants concern, PSI > 0.2 requires action; (2) investigate CAUSE: data collection change? new user cohort? seasonal variation?; (3) check whether downstream model performance has degraded — if still on target, shift may not be impacting predictions; (4) if performance degraded: trigger retraining or rollback.`,
          `B) p < 0.01 means the feature distribution has shifted and the model must be immediately retrained before serving any additional predictions — statistical significance at this level indicates the model's outputs are no longer valid.`,
          `C) p < 0.01 is below the standard significance threshold of 0.05, which means the null hypothesis is rejected too strongly — this is likely a false positive caused by the large sample size, and no action is needed unless p < 0.001.`,
          `D) p < 0.01 means the single shifted feature has invalidated the entire model; all 5 features should be re-engineered from scratch using only production data collected after the shift was detected.`,
        ],
        answer: `A`,
      },
      {
        q: `A model deployed in January shows 89% AUC. By June, AUC has drifted to 78%. Feature distribution monitoring shows stable PSI across all features. What type of shift does this suggest?`,
        options: [
          `A) The stable PSI rules out any form of distribution shift — the AUC drop must be caused by a bug introduced in the model serving infrastructure between January and June, not by data-related issues.`,
          `B) The combination of stable feature distributions and degraded performance suggests label shift: P(Y) has changed (the overall fraud rate has increased) but P(X|Y) is stable (fraudulent transactions look the same). Fix: use BBSE to reweight predicted probabilities without retraining.`,
          `C) Stable feature distributions (low PSI) but degraded model performance (AUC drop) = signature of CONCEPT DRIFT: P(X) unchanged (hence stable PSI) but P(Y|X) changed (hence degraded accuracy). The model's learned mapping from features to labels was calibrated to the January relationship — that relationship has since changed. Common causes: seasonal shifts, competitive changes, policy changes, external events. Fix: new labeled data from post-shift period and retraining. Feature monitoring alone (PSI) is insufficient — also need model output distribution and ground-truth label accuracy tracking.`,
          `D) Stable PSI with degraded AUC indicates covariate shift in features not being monitored — the top 5 features are stable but secondary features have shifted. Fix: expand PSI monitoring to all features before considering retraining.`,
        ],
        answer: `C`,
      },
    ],
  },
  {
    id: 'data_augmentation',
    title: 'Data Augmentation',
    subtitle: `Artificially expand your training distribution by adding realistic variations — but only ones that preserve the label.`,
    difficulty: 'intermediate',
    estimatedMin: 40,
    tags: ['augmentation', 'SMOTE', 'image augmentation', 'mixup', 'text augmentation', 'back-translation'],
    summary: `The problem augmentation solves is overfitting from insufficient training data — the model memorizes the training examples instead of learning general invariances. A photo of a cat flipped horizontally is still a cat. A sentence with a synonym substituted still has the same sentiment. By training on modified versions of existing examples, the model learns that these transformations do not change the label, and stops memorizing specific pixel arrangements. The hard constraint that defines the entire approach: every augmentation must preserve the label, and only a domain expert can verify this for each class. Rotating a "6" by 180 degrees produces a "9" — a label-violating transformation that corrupts the training signal.

This means augmentation strategies are domain-specific, cannot be automated without human validation, and do not help when the model is underfitting — adding harder variations to data the model cannot yet learn makes the problem worse, not better.`,
    keyPoints: [
      `**Label preservation is the non-negotiable constraint.** A "6" rotated 180 degrees looks like a "9." A "1" flipped horizontally is still a "1" — but the domain expert must verify this for every class before applying any transformation at scale. The model cannot distinguish label-preserving augmentations from label-violating ones. Applying label-violating augmentations creates conflicting supervision: the same visual pattern receives different labels depending on which rotation was applied, and training diverges or learns the wrong invariances.`,
      `**Mixup creates new training examples by linearly interpolating between two existing examples:

$new_x = λ·x1 + (1-λ)·x2, new_y = λ·y1 + (1-λ)·y2.** The model trains on blended pixe$

ls with blended labels. This forces linear behavior between training examples — the model cannot make arbitrary predictions in the regions between training points. The result is stronger regularization and better calibration. Mixup is particularly effective for image classification and tabular data with continuous labels.`,
      `**Back-translation for text augmentation: translate a sentence to French, then back to English using a different model.** The result is a grammatically natural paraphrase with the same meaning but different vocabulary and phrasing. This is effective precisely because it produces the kind of surface variation that synonym replacement rules cannot replicate — the paraphrase is a real human-like sentence, not a mechanically constructed one.`,
      `**Apply augmentations on-the-fly during training, not as a preprocessing step.** Pre-computed augmentations mean the model sees the same rotated version of an image at every epoch — it memorizes the specific augmented pixel arrangement just as easily as the original. On-the-fly randomization applies a different random transformation at each training step, so across many epochs the model effectively trains on a near-infinite variety of augmented versions and is forced to learn the underlying invariance.`,
      `**Augmentation does not help underfitting models.** If training accuracy is low (the model has not captured the signal in the original data), adding more varied examples makes the problem harder without fixing the capacity or representation issue. The diagnostic: compare training and validation accuracy. High train, low validation means the model is overfitting — augmentation helps. Low train, low validation means the model is underfitting — fix the architecture or features first.`,
      `**Test-time augmentation (TTA) generates multiple augmented versions of each test example, runs each through the model, and averages the predictions.** Because predictions on slightly different versions of the same input vary due to model stochasticity, averaging reduces prediction variance and typically improves accuracy by 1–3 percentage points with no additional training cost.`,
      `**Tabular augmentation has weak empirical support compared to images and text.** There is no obvious label-preserving invariance in tabular data — adding Gaussian noise to a customer's age or income does not produce a "different view of the same customer" in the way horizontal flipping produces a different view of the same cat. Gaussian noise injection helps when the dataset is very small. SMOTE addresses class imbalance specifically, not general regularization.`,
      `**Augmentation strength is a hyperparameter.** Extreme rotations (45+ degrees for digits) or radical color shifts create samples that no longer plausibly represent the class — the augmentation adds noise rather than teaching invariance. Tune augmentation magnitude with the same rigor as learning rate: measure validation accuracy at different augmentation strengths rather than choosing a default.`,
      `**Augmentation in domain adaptation: when you have labeled source domain data and unlabeled target domain data, augmenting source examples with transformations that bring them closer to the target domain distribution is a form of unsupervised domain adaptation.** This is distinct from regularization-focused augmentation — the goal is reducing the distribution gap between domains, not building invariance to label-preserving transformations.`,
    ],
    takeaway: `Augmentation encodes invariances — transformations that should not change the model's prediction. Those invariances must be validated by a domain expert for every class. The model cannot distinguish label-preserving transformations from label-violating ones, and augmenting with the wrong transformations creates conflicting training supervision that degrades rather than improves performance.`,
    checkQuestions: [
      {
        q: `You are training a digit recognition model and augment by rotating all training images up to 45 degrees. Performance degrades. What went wrong?`,
        options: [
          `A) Rotating training images up to 45 degrees increases the effective dataset size but reduces the signal-to-noise ratio because rotated digits are less frequent in the real-world distribution of handwritten digits.`,
          `B) Many handwritten digits are NOT rotationally invariant to large angles. A "6" rotated 180° looks like a "9." A "9" rotated 90° looks ambiguous. By augmenting with 45° rotations, you introduced label-violating samples: images labeled "6" that visually look like "9." The model trains with conflicting supervision — same visual pattern receives different labels depending on whether it is original or augmented. Augmentations must be label-safe for EVERY class; modest rotations (10-15°) are typically safe for digit recognition, 45° rotations are not.`,
          `C) Rotating by up to 45 degrees is label-safe for all digits except "6" and "9"; the fix is to apply the same 45-degree rotation augmentation to all digit classes except those two.`,
          `D) The 45-degree rotation augmentation is correct but was applied too early in training — augmentation should only be applied after the model has converged on the original (non-augmented) training data.`,
        ],
        answer: `B`,
      },
      {
        q: `What is Mixup augmentation and why does it act as a regularizer?`,
        options: [
          `A) Mixup randomly selects a subset of training examples and replaces their labels with the mode label of their k-nearest neighbors — it acts as a regularizer by smoothing label noise in the training set.`,
          `B) Mixup applies multiple random augmentations (rotation, flip, crop) to each training image and averages the predictions — it acts as a regularizer by reducing model variance through ensemble averaging during training.`,
          `C) Mixup trains the model on pairs of training examples simultaneously by concatenating them along the feature axis — it acts as a regularizer by exposing the model to longer input sequences than it will encounter at inference time.`,
          `D) Mixup constructs new training examples by linearly interpolating between two randomly selected training examples: new_x = λ·x1 + (1-λ)·x2 and new_y = λ·y1 + (1-λ)·y2, where λ drawn from Beta distribution. The training example is literally a weighted average of two images with blended labels. Acts as regularizer because it forces the model to predict smooth interpolation of labels in regions BETWEEN training examples — constrains model to be approximately linear between pairs. Reduces overfitting and improves calibration.`,
        ],
        answer: `D`,
      },
      {
        q: `When does augmentation help and when does it not? Give a scenario for each.`,
        options: [
          `A) Augmentation helps when the model OVERFITS: small dataset where model achieves near-perfect training accuracy but poor validation accuracy — augmentation creates more diverse training examples, reduces variance. Example: medical imaging classifier with 500 training images per class. Does NOT help when model UNDERFITS: if training accuracy is 60%, adding more variations of already-unlearnable data makes problem harder without fixing capacity/representation issue. Example: using linear model on image pixel features — augmentation won't fix the fundamental insufficiency of the representation.`,
          `B) Augmentation always helps regardless of whether the model is overfitting or underfitting — the only difference is the magnitude of improvement, which is larger for overfitting models.`,
          `C) Augmentation helps for image and text data but never helps for tabular data — the lack of spatial or semantic structure in tabular features means augmented examples do not represent realistic variations of the original data.`,
          `D) Augmentation helps when the validation accuracy is below 80% — below this threshold, the model needs more diverse training examples to generalize. Above 80%, the model is already generalizing well and augmentation provides no further benefit.`,
        ],
        answer: `A`,
      },
      {
        q: `Why should augmentation transformations be applied on-the-fly during training rather than pre-computed and saved to disk?`,
        options: [
          `A) Pre-computing augmentations creates files that are too large to fit in memory, while on-the-fly augmentation generates only the current batch's augmented versions, reducing peak memory usage.`,
          `B) Pre-computed augmentations cannot be used with data loaders that shuffle training examples at each epoch, while on-the-fly augmentation works correctly regardless of the shuffling order.`,
          `C) If pre-computed (applied once before training), model sees SAME augmented versions at every epoch — in epoch 1 and epoch 5 the model sees exactly the same "cat_image_1_rotated_23deg." After enough epochs, model memorizes these specific augmented versions just as easily as originals — no regularization benefit. On-the-fly augmentation applies RANDOM transformation at each training step: epoch 1 might use rotation=23°, epoch 5 might use rotation=7° for same image. Over thousands of epochs, model effectively trained on near-infinite variety, forced to learn underlying invariances rather than memorizing specific pixel arrangements.`,
          `D) Pre-computed augmentations bias the model toward the specific transformations chosen before training, while on-the-fly augmentation allows the augmentation strategy to be updated between training runs without regenerating the dataset.`,
        ],
        answer: `C`,
      },
    ],
  },
  {
    id: 'data_versioning_and_pipelines',
    title: 'Data Versioning and Pipelines',
    subtitle: `Models are only reproducible if both code and data are versioned — and production ML breaks when training and serving compute features differently.`,
    difficulty: 'advanced',
    estimatedMin: 40,
    tags: ['DVC', 'feature store', 'data versioning', 'training-serving skew', 'pipeline orchestration', 'reproducibility'],
    summary: `A model trained on unknown data with features computed by unknown logic is not reproducible and not debuggable. When a production model degrades, answering "what changed?" requires knowing exactly what training data was used, what feature computation code ran against it, and what preprocessing parameters were applied. Without explicit tooling, this information almost never exists. DVC solves the data versioning half: it stores a content hash pointer alongside the training code in Git, so reverting to any past commit recovers both the code and the exact dataset used. Training-serving skew is the other major failure mode: feature computation is implemented twice — once in Python for training, once in SQL or Java for serving — and the two implementations accumulate subtle differences through timezone handling, null treatment, and rounding.

The model receives inputs it was never trained on, accuracy collapses, and no error fires. Feature stores solve this by centralizing feature computation into a single canonical implementation shared by both pipelines. Beyond these two, data pipelines fail for reasons code pipelines do not: upstream schemas change silently, nullable columns appear in previously non-nullable fields, and tables arrive late. Making pipelines observable — with row-count assertions, schema validation, null rate monitoring — converts silent corruption into loud failures.`,
    keyPoints: [
      `**DVC stores a .dvc pointer file (a content hash of the dataset) committed alongside the training code in Git.** Reverting to any past commit recovers both the training code and the exact dataset state at that commit — full reproducibility. Without this, the "same" code run against "the same" table six months later may produce a different model because the underlying data changed silently.`,
      `**Training-serving skew is responsible for a disproportionate share of production ML incidents.** A model trained on batch SQL features and served with real-time Python logic will behave differently in production even if both codepaths are "correct." Different timezone handling, different null treatment, different aggregation windows — the model was trained on one distribution and is evaluated on another. The fix is not better testing; it is a single feature computation function shared by both the training pipeline and the serving layer. Without this structural fix, the gap silently widens every time either codepath is modified.`,
      `**Feature stores centralize feature computation into one canonical implementation with two storage backends: an offline store (data warehouse or Parquet lake) for point-in-time training data generation, and an online store (Redis, DynamoDB) for low-latency serving.** Both are written by the same computation logic — drift between training and serving becomes structurally impossible rather than aspirationally prevented.`,
      `**Point-in-time correctness is the requirement that a training example for a prediction made at time T uses feature values as they existed at time T, not as they exist when the pipeline runs.** Backfilling a "30-day purchase count" using today's data includes purchases that happened after the label date — future information leaked into training features. This inflates offline metrics and produces a model that systematically outperforms in development and underperforms in production.`,
      `**Minimum viable pipeline observability: row count assertions (1M rows yesterday, 100K rows today → alert), schema validation that fails loudly if a column is renamed or its type changes, null rate monitoring (2% nulls in training, 25% in production → alert), and staleness checks (pipeline has not run in 24 hours → alert).** These are the signals that distinguish a pipeline that ran from a pipeline that ran correctly.`,
      `**Schema drift is a silent failure mode.** An upstream team renames a column from "transaction_value" to "txn_amount." The pipeline reads nulls where it expected values. No error is raised. The model retrains on a null-imputed version of the feature, silently degrades, and the incident trace points to "mysterious performance degradation" six weeks later. A data contract that asserts column names and types at pipeline start catches this on day one.`,
      `**Experiment tracking (MLflow, Weights & Biases) records hyperparameters, metrics, dataset versions, and model artifacts for every training run.** Combined with data versioning, every past run is fully recoverable: given a run ID, you can recover the exact code, data, parameters, and evaluation results. Without this, debugging a production regression requires reconstructing conditions from memory — which nobody can do reliably six weeks later.`,
      `**Data contracts are formal, machine-checkable specifications of upstream source guarantees: column names, types, null rates, value ranges, update frequency.** When the contract is violated, the pipeline fails at the validation step — loudly and on day one — rather than silently propagating the violation through feature computation and into the trained model. The contract is the specification; the validation step is the enforcement.`,
      `**Backfilling historical features requires point-in-time discipline at the feature store layer.** Computing "average purchase value in the last 30 days" across all historical dates using today's data includes purchases that occurred after each historical date — temporal leakage baked into the feature values themselves. A feature store with time-travel support queries feature values as of a specified timestamp, enforcing this automatically.`,
    ],
    takeaway: `A model is a function of code and data together. Versioning only the code leaves half the reproducibility problem unsolved. Centralizing feature computation eliminates training-serving skew by making divergence structurally impossible rather than hoping discipline holds. Loud pipeline failures are better than silent ones — a pipeline that fails on day one is always better than one that silently corrupts a model and surfaces six weeks later.`,
    checkQuestions: [
      {
        q: `A model trained and evaluated in offline pipeline shows 91% AUC. After deployment, production AUC is 77%. No distribution shift detected in features monitored at prediction time. What is the most likely cause?`,
        options: [
          `A) The model overfits the offline evaluation set because the offline pipeline uses a fixed train-test split rather than cross-validation, making the 91% AUC estimate optimistically biased.`,
          `B) Training-serving skew — features used during serving computed differently from features used during training. Monitoring features at prediction time confirms distribution is stable (ruling out distribution shift), but if feature VALUES themselves are wrong (different logic, null handling, time windows), model receives inputs it was never trained on. Common examples: training pipeline used batch SQL snapshot with specific cutoff time; serving system computes from live database including same-day transactions. Or timezone handling differs. Fix: audit feature computation code in both pipelines and compare output values for same raw input on held-out sample.`,
          `C) The 14-point AUC gap is within normal variance for real-world ML deployments and does not indicate a specific technical problem — it reflects the inherent difficulty of generalizing from offline evaluation to production conditions.`,
          `D) The production AUC drop indicates that the model's hyperparameters were tuned for the offline distribution and need to be re-tuned on production data before redeployment.`,
        ],
        answer: `B`,
      },
      {
        q: `You need to reproduce a model trained 8 months ago to debug a regression. You have the training code at the exact commit, but you cannot reproduce the results. What is missing?`,
        options: [
          `A) The random seed used during training is missing — without fixing the random seed for train-test splitting and model initialization, the same code will always produce a different model.`,
          `B) The hyperparameter configuration is missing — without the exact learning rate, regularization strength, and tree depth used in the original training run, the same code will converge to a different model.`,
          `C) The Python package versions are missing — without the exact dependency versions (scikit-learn, pandas, numpy), the same code running on a different package version will produce different numerical results.`,
          `D) Data versioning is missing. Training code alone insufficient to reproduce a model — also need exact dataset used to train it. Eight months ago, training set had specific rows, feature values, and label assignments. Since then, upstream data has likely changed: new rows added, old rows updated/deleted, feature engineering pipelines modified. Without DVC (or equivalent), cannot recover exact dataset state from 8 months ago. Fix for future: use DVC to commit .dvc pointer file alongside each model training run so dataset version permanently associated with code version.`,
        ],
        answer: `D`,
      },
      {
        q: `What is point-in-time correctness in a feature store and what goes wrong without it?`,
        options: [
          `A) Point-in-time correctness ensures that when assembling training example for model predicting on date T, you use feature values AS THEY EXISTED at time T — not as they exist when you assemble the training data (possibly months later). Without it: temporal leakage — for a customer churn model, if you use today's "30-day purchase count" to label a training example from 6 months ago, you INCLUDE purchases from the 5 months AFTER the label date. Feature value contaminated by future information. Feature store with point-in-time support queries feature values "as of" specified timestamp. Without this: every historical training example contaminated by future data, producing inflated accuracy that collapses in production.`,
          `B) Point-in-time correctness ensures that training and serving use the same timestamp format (UTC vs. local time) to prevent timezone-related feature skew. Without it, features computed in training and serving will have different values for the same raw events.`,
          `C) Point-in-time correctness ensures that the feature store's online layer serves features with latency below the model's SLA. Without it, serving latency spikes cause the model to fall back to default feature values, degrading prediction quality.`,
          `D) Point-in-time correctness ensures that the same version of each feature is used across all folds of cross-validation. Without it, different folds may use features computed from different snapshots of the upstream data, introducing fold-to-fold variance in the CV estimate.`,
        ],
        answer: `A`,
      },
      {
        q: `An upstream team renames a column from 'transaction_value' to 'txn_amount' without notifying your team. Your retraining pipeline runs successfully with no errors. Six weeks later, model performance dropped. What happened and how would a data contract have prevented it?`,
        options: [
          `A) The pipeline read renamed column as null (old column name no longer exists; many SQL engines return nulls for missing columns rather than erroring). Imputer filled in mean of now-null column — likely 0 or historical mean from previous imputer. Model retrained on version of transaction value feature that was entirely imputed noise, silently degraded, not discovered for 6 weeks. Data contract would prevent this: specifies upstream table MUST contain column named "transaction_value" of type FLOAT with null rate below 1%. Data validation step runs this check before any feature computation, and when column is absent, pipeline FAILS IMMEDIATELY with descriptive error — blocking corrupted retraining run and alerting team on day 1.`,
          `B) The pipeline automatically mapped the old column name to the new one using fuzzy string matching, but the mapping introduced a one-day lag that shifted all temporal features by 24 hours, gradually degrading time-sensitive predictions.`,
          `C) The renamed column caused a schema mismatch that the pipeline silently handled by dropping the column entirely; the model retrained without the feature, which reduced its predictive power by the amount attributable to transaction value.`,
          `D) The pipeline cached the old column schema from the previous training run and continued reading the correct data for 6 weeks until the cache expired, at which point the column name mismatch surfaced as a performance drop.`,
        ],
        answer: `C`,
      },
    ],
  },
]
