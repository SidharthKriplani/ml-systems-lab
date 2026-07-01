export const DATA_MODULES = [
  {
    id: 'data_quality_audit',
    title: 'Data Quality Audit',
    subtitle: `Understand what makes data "dirty" and why auditing before modeling is non-negotiable.`,
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['data quality', 'profiling', 'missing values', 'outliers'],
    summary: `A vendor sends you a 2-million-row dataset with 47 features. Before writing a single line of modeling code, you run a data quality audit. Within 20 minutes you find: column \`income\` has type string — it should be float. Column \`date_of_birth\` has values ranging from 1800 to 2300, clearly corrupt. Column \`transaction_amount\` has 12% nulls with a structured pattern — large transactions are far more likely to be missing, meaning the missingness is itself a predictive signal. And 30,000 rows are exact duplicates. Without the audit, you would have trained on this noise for days, watched metrics look reasonable, deployed the model, and begun debugging in production where the cost of each correction is an order of magnitude higher.

The audit checklist covers seven axes. Schema: are column types correct, are expected columns present? Missing values: what is the null rate per column, and is missingness random or structured? Duplicates: exact row matches, near-duplicates on a key column? Distribution: outliers, unexpected skew, bimodal distributions that should be unimodal? Target: class balance, label noise, implausible label-feature combinations? Leakage: any feature that uses information unavailable at prediction time? Coverage: does the population in this dataset match the population the model will be deployed against?

The danger is not that errors exist — it is that powerful models learn from them confidently. A gradient-boosted tree trained on data where \`age = -3\` for some rows will learn that negative ages predict something. Training metrics will look fine. The model will be deployed before anyone notices. This is the correct framing: not "garbage in, garbage out" but "garbage in, confident garbage out." The model assigns high predicted probabilities to wrong outcomes and does not flag uncertainty. The error is invisible until ground-truth labels arrive.

Silent row loss is a specific failure mode that deserves its own mention. A referential integrity failure after a table join — foreign key values in one table that have no match in the other — causes rows to vanish. The pipeline reports success. 120,000 training examples disappear. Those missing rows are almost never a random sample; they are typically a specific cohort, older customers or a different region, that becomes unrepresented in training.

Great Expectations lets you codify the entire checklist as executable assertions: "column income has type float64, range 0–10,000,000, null rate below 5%." Run these on every incoming data batch in CI/CD. A failed assertion is a loud pipeline error on day one. Without them, it is a mysterious production regression six weeks later.

**NOT this.** "If the pipeline runs without errors, the data is good." Silent corruption is more dangerous than crashes. A date column typed as string processes without error but produces garbage features. A join that loses rows reports success. Duplicate rows are not errors. Data quality requires explicit assertions, not the absence of pipeline failures. Profiling is not a one-time setup step either — distributions shift as new cohorts are onboarded, upstream systems change, and business events occur. A column with 2% nulls in January that has 18% nulls in June is a data collection problem, not a model problem. You will not know the difference without running the audit again.`,
    keyPoints: [
      `**Run a data quality audit before any EDA or modeling — 30 minutes of auditing routinely saves days of debugging model failures caused by silent data issues.**\n\nThe 2-million-row vendor dataset example is representative: type mismatches, impossible values, structured missingness, and 30,000 duplicates all coexist quietly until you look for them explicitly. Powerful models do not flag dirty data — they learn from it confidently.`,
      `**Trap: auditing only the training set. Data quality gates must run on every new incoming batch in production — upstream systems change schemas, inject nulls, and shift distributions without notice.**\n\nA column with 2% nulls in January training data and 18% nulls in June production data is a structural change in data collection. The model trained on the low-null version will impute using training-fit parameters that no longer fit the incoming distribution, degrading silently on the most information-rich rows.`,
      `**Diagnostic: build a schema snapshot of the training data — column types, value ranges, null rates, cardinality — and diff every new batch against it. A diff that exceeds threshold is a data quality alert, not a model problem.**\n\nGreat Expectations implements this as code: assertions that fail loudly when violated, run in CI/CD on every batch. The alternative is discovering the schema drift 6 weeks later as a "mysterious performance regression."`,
    ],
    interactivePrompt: `Before you touch the controls: if your training pipeline ran without a single error and your model achieved 94% accuracy on validation — would you trust the result before looking at the data?`,
    takeaway: `Data quality failures surface as production incidents, not training errors — because models train confidently on garbage and only reveal the problem when ground-truth labels arrive weeks later.`,
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
    summary: `You are building a hospital readmission prediction model. Column \`lab_result_creatinine\` is 32% null. The instinct is to ask "how do I fill in these values?" The correct question is "why are these values missing?" — because the answer determines everything about how you should treat them.

You check with the clinical team. Patients with mild conditions often skip this test because the clinician judged it unnecessary — the missingness depends on observed severity indicators. That is MAR: Missing At Random, where "at random" means conditional on observed variables. Separately, patients who are too critically ill to survive the blood draw also have nulls. That is MNAR: Missing Not At Random, where the missing value depends on the value itself — the sickest patients have the most missing creatinine readings.

These require completely different treatments. For MAR, model-based imputation works: MICE trains a regression on all other observed columns and predicts the missing creatinine from patient age, comorbidities, and other labs. It exploits the correlation structure the clinical team told you about. For MNAR, any imputation fills in systematically wrong values for the highest-risk group. If the worst creatinine values are precisely the ones that are missing, imputing the column mean assigns a near-normal value to the sickest patients. The model trains on data where critical patients look average, learns low-risk predictions for them, and systematically misses the people who most need intervention. No statistical method can fix MNAR imputation without modeling the missingness mechanism directly.

The imputation ladder runs from simplest to most sophisticated: mean/median imputation is fast but distorts variance and destroys correlations among features. KNN imputation finds the k most similar rows by Euclidean distance on non-missing features and averages their values — it respects local distribution structure rather than global means, but it is O(n²) and requires feature scaling. MICE iterates: for each missing column, train a regression using all other columns as predictors, impute, then repeat until convergence. It produces the most accurate estimates for MAR data but requires managing fitted models as pipeline state at serving time.

Across all mechanisms, one rule applies: always add a binary indicator column alongside the imputed value for any feature with more than 5% missingness. The indicator captures "this value was absent," which is itself predictive when missingness is informative. A model that sees both the imputed value and the indicator can learn from the pattern of absence. A model with only the imputed value permanently loses that signal.

**NOT this.** "Just fill with mean." Mean imputation shrinks variance and destroys correlations. If 30% of a key feature is missing, imputing the mean creates 600,000 data points all at the same value. The model learns that this value has near-zero variance, inflates confidence on imputed rows, and can create spurious patterns. For missingness above 5%, use MICE or at minimum an indicator variable. The cost of mean imputation is not just accuracy — it is the model systematically performing worst on the patients, customers, or users who most need correct predictions.`,
    keyPoints: [
      `**Always add a binary indicator variable alongside imputation for any column with more than 5% missing — the fact that a value is missing is often more predictive than the imputed value itself.**\n\nFor the creatinine column: a model trained with only imputed values learns from the imputation. A model trained with imputed values plus a \`creatinine_was_null\` indicator can learn that absence itself is a clinical signal. Never throw away the missingness signal by imputing alone.`,
      `**Trap: fitting the imputer on the entire dataset before splitting. This leaks test-set statistics into training. Always fit imputers only on training data, then apply to validation and test.**\n\nFitting a mean imputer on train + test computes a mean influenced by test-set values. The training imputation now reflects the test distribution — a form of leakage that produces optimistic metrics which collapse in production. Use an sklearn Pipeline to enforce fit-on-train-only structurally, not through discipline.`,
      `**Diagnostic: compare model performance trained on imputed-only versus imputed plus indicator columns. If adding the indicator improves AUC by more than 0.5 points, the missingness was informative — MNAR rather than MAR.**\n\nThis test costs one additional training run and directly answers whether the missingness mechanism matters. If the indicator adds nothing, the missingness was approximately random. If it matters, treat the absence as a feature, not as a gap to be filled.`,
    ],
    interactivePrompt: `Before you touch the controls: a lab result is missing for 32% of patients — before choosing any imputation method, what is the one question you need to answer first?`,
    takeaway: `The mechanism of missingness — MCAR, MAR, or MNAR — determines the right treatment; choosing a method before diagnosing the mechanism trains the model on systematically wrong values for the cases where accuracy matters most.`,
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
    summary: `You are predicting customer churn and the dataset includes a \`city\` feature with 5,000 unique values. This is where encoding choices stop being theoretical and start costing performance.

One-hot encoding: 5,000 binary columns, almost all zeros. For a tree model, this adds 5,000 candidate split points. For a linear model, it adds 5,000 weights to fit. With 100,000 training rows, many cities have fewer than 5 examples — their one-hot column is noise, not signal. The model may "memorize" San Francisco simply because San Francisco users happened to churn more in the training window.

Target encoding replaces each city with the mean churn rate in that city, computed on training data only, with k-fold isolation to prevent leakage. San Francisco has enough training examples for a stable estimate. "Smalltown, OH" with 3 examples gets shrunk toward the global mean through additive smoothing. The result: one dense, informative column instead of 5,000 sparse binary ones. For tree models especially, target encoding routinely outperforms one-hot at high cardinality.

The leakage trap in target encoding is specific and severe. If you compute city-level mean churn across the full dataset and then use that encoding during training, each row's encoded value was influenced by its own label. A city with a single row gets encoded with that row's exact target value — the model receives the answer as an input. Fix: compute encoding statistics within folds, never including the row being encoded. The \`category_encoders\` library in Python handles this correctly with one parameter.

Low cardinality (under 15 categories) still favors one-hot: payment method, device type, subscription tier. These have so few categories that sparsity is not a problem and no leakage risk exists. Medium cardinality (15–50) depends on whether there is a genuine ordering — education level warrants ordinal encoding; product category does not. High cardinality (above 50) requires target encoding, frequency encoding, or embeddings.

Embeddings deserve a mention for neural networks and very high cardinality features like user IDs or product IDs. An embedding layer learns a dense vector for each category from gradient updates — categories that behave similarly in training data end up geometrically close in embedding space. Entity embeddings (Guo & Berkhahn 2016) regularly outperform target encoding on these features.

**NOT this.** "LightGBM handles categoricals natively so you can skip encoding." LightGBM's native categorical support uses a greedy split algorithm that works adequately for moderate cardinality but degrades above roughly 200 unique values. For a 5,000-city feature, explicit target encoding with fold isolation reliably beats native handling and takes a single line with category-encoders. Native handling is a reasonable default for low-cardinality features only.`,
    keyPoints: [
      `**Use target encoding with 5-fold isolation for any categorical feature with cardinality above 50 — it is the highest-signal encoding for tree models and takes one line of code with the category-encoders library.**\n\nFor the 5,000-city feature: target encoding produces a single dense column where each city's value reflects actual churn signal from training data. One-hot produces 5,000 sparse columns where most cities have fewer than 20 training examples — a regime that guarantees memorization rather than generalization.`,
      `**Trap: computing target encoding statistics before the train/test split. This leaks test-set label information into training features and is one of the most common sources of inflated offline metrics.**\n\nThe mechanism: mean churn rate per city is computed across the full dataset. Each row's city feature is now a function of that row's own label (plus its neighbors'). For cities with few rows, the encoded value is nearly the target itself. Fix: compute within folds using category-encoders' cross-val encoding or TargetEncoder with cv parameter.`,
      `**Diagnostic: if a target-encoded feature shows near-100% feature importance in a tree model, check for leakage — the encoding likely included the target row's own label in the mean.**\n\nA legitimately useful encoding produces moderate, plausible importance. An encoding that accidentally includes row-level label information will dominate feature importance because it is effectively a noisy copy of the target. Check by comparing feature importance on train vs. validation — a leaking feature will show much higher importance on training data.`,
    ],
    interactivePrompt: `Before you touch the controls: you have a "city" column with 5,000 unique values — what would happen if you one-hot encoded it before training a logistic regression on 100,000 rows?`,
    takeaway: `Every encoding asserts something about category structure — the wrong assertion is not a preprocessing detail but a false claim the model learns as if it were true, and at high cardinality the wrong choice costs measurable AUC.`,
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
    summary: `You are building a kNN model with two features: age (range 0–100) and annual income (range 0–500,000). When kNN computes the Euclidean distance between two customers, it calculates √((age₁−age₂)² + (income₁−income₂)²). The income term can contribute up to 500,000² = 2.5×10¹¹ to the squared distance. The age term contributes at most 100² = 10,000. The model literally cannot see the age feature. "Nearest neighbor" means the person with the most similar income. Every classification decision ignores age entirely — not because age is unimportant, but because of a unit mismatch that has nothing to do with predictive value.

Three scalers, each appropriate for a different situation. StandardScaler computes z = (x − μ) / σ, producing mean 0, standard deviation 1. Works well for roughly Gaussian distributions. It is sensitive to outliers: a single customer with income $10M shifts the mean and inflates σ, compressing every other value toward zero. MinMaxScaler maps to [0, 1], which preserves the zero point — useful when sparsity matters, as in word counts or binary indicators. Maximally sensitive to outliers: the outlier becomes exactly 1.0 and every other value compresses to near-zero. RobustScaler uses median and IQR instead of mean and standard deviation. One outlier at $10M does not affect the median or the IQR. Best for skewed distributions or data with known extreme values that are real rather than erroneous.

When must you scale: kNN, SVM with RBF kernel, PCA, logistic regression with regularization, and neural networks. For neural networks the reason is mechanistic — gradient steps are proportional to feature magnitude, so unscaled inputs with disparate ranges cause unstable gradients in early layers and slow convergence or divergence. For regularized linear models the reason is fairness — L2 penalizes coefficient magnitude, but the coefficient for income is naturally 10,000 times smaller than for age (same effect, different unit), so regularization shrinks the income coefficient 10,000 times less aggressively per unit of actual importance.

When to skip scaling: tree-based models (split thresholds are ordinal comparisons, scale-invariant), binary indicators (standardizing a 0/1 column to mean 0, std 1 is numerically meaningless), and any feature you have log-transformed (log-transforming after standardizing produces a different result than the reverse — always decide the order deliberately).

**NOT this.** "Always standardize all features before modeling." Standardizing a binary indicator is nonsensical — it destroys the zero-mass meaning. Standardizing log-normally distributed data before log-transforming is worse than log-transforming first. Applying StandardScaler when the feature contains outliers that are real data (large but valid transactions, extreme but correct measurements) compresses your most informative values toward zero. Understand the distribution, then choose the scaler.`,
    keyPoints: [
      `**Apply RobustScaler as your default for tabular data — it handles the outliers that are almost always present in real datasets better than StandardScaler, with identical code.**\n\nFor the age/income kNN example: a single $10M income observation makes StandardScaler compress every other customer's income toward zero. RobustScaler uses the median and IQR, so that one outlier has no effect on how the other 99,999 customers are scaled. The median and IQR are computed from training data only, never from test.`,
      `**Trap: fitting the scaler on train plus test data before splitting. The scaler learns the test set's mean and standard deviation, leaking distributional information into training. Fit only on training data, transform both. Use an sklearn Pipeline to enforce this automatically.**\n\nThe failure mode: μ and σ are computed over all rows including test. Training rows are then transformed using statistics derived partly from test. The model indirectly sees the test distribution's central tendency and spread during training. Evaluation metrics are optimistically biased — the gap between offline metrics and production performance traces to this leak.`,
      `**Diagnostic: after scaling, check that all features have similar variance — near 1 for StandardScaler. If one feature still shows variance 100× the others, it contains extreme outliers that should be winsorized or log-transformed before scaling.**\n\nFor StandardScaler specifically, variance should be 1 by construction — if it is not, there are outliers so extreme that the scaler's μ and σ estimates are distorted. Switch to RobustScaler or apply a monotone transform (log, sqrt) before scaling.`,
    ],
    interactivePrompt: `Before you touch the controls: if age ranges from 0 to 100 and annual income ranges from 0 to 500,000 — what does a kNN model actually learn when you do not scale the features?`,
    takeaway: `Unscaled features hand large-magnitude inputs disproportionate control over distance metrics, gradient steps, and regularization penalties — not because they are more important, but because they are measured in larger units.`,
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
    summary: `A data warehouse exports 500 features for your fraud detection model: transaction metadata, user behavior, device fingerprints, merchant info, and hundreds of derived aggregates. Training with all 500: 4 hours, 900ms inference latency (feature computation plus forward pass), and an OOM crash on the serving cluster. You need to cut to fewer than 50 features.

Four approaches, each at a different level of sophistication. Filter methods score each feature independently using mutual information with the target, Spearman correlation, or chi-squared for categoricals. Fast — O(n·d) — and completely parallelizable. The structural limitation: a feature with near-zero marginal correlation to fraud might be essential in combination with a second feature. Filter methods cannot detect this. They discard interactions by design.

Wrapper methods iteratively add or remove features and train a model at each step. Recursive Feature Elimination starts with all 500 features, trains once, drops the lowest-importance feature, trains again, and repeats until reaching the target count. This costs roughly 450 model fits to go from 500 to 50 features, but each elimination decision is model-aware: RFE knows which features are redundant when others are present, which filter methods cannot know.

Embedded methods perform selection during training and cost only one training run. L1 regularization drives some coefficients exactly to zero by the geometry of the L1 constraint region — the optimization landscape intersects the L1 "diamond" at corners where coordinates are zero. Ridge (L2) shrinks toward zero but almost never reaches it. This is feature selection wired into the training objective, no separate pipeline stage needed.

Permutation importance is model-agnostic and post-hoc. Train any model, randomly shuffle one feature at a time, measure the performance drop. A feature that causes a large drop when shuffled is genuinely useful. A feature that causes no drop is either redundant with another feature or carrying no signal. This catches features that tree importance misses because tree importance is biased toward high-cardinality columns — a unique identifier scores high on impurity reduction during training but drops to zero on a validation permutation test.

The trap that affects all four methods: correlation is not importance. Features X and Y might have Spearman correlation 0.95, but both can be important if X is in-sample-stable while Y has a different distribution at serving time. Removing one based on correlation can degrade production performance. Measure importance directly — permutation importance on held-out validation data — not via pairwise correlation.

**NOT this.** "Remove highly correlated features to reduce redundancy." Correlation between features tells you about the input space, not about predictive contribution. Two correlated features can have uncorrelated residual errors — keeping both makes the model more robust to distribution shift in one of them. The correct procedure is permutation importance on validation data, not correlation filtering.`,
    keyPoints: [
      `**Use L1 regularization as your default feature selector for linear models — it zeros vestigial weights during training, giving you feature selection for free without a separate selection step.**\n\nFor the 500-feature fraud dataset: L1 on a logistic regression will drive most of the 450+ redundant or noisy features to exactly zero during a single training run. You get a sparse model with a built-in audit trail of which features are nonzero. No separate RFE pipeline needed.`,
      `**Trap: computing feature importance on the training set. Training-set importance reflects memorization; use a held-out validation set or permutation importance on the same evaluation data used for model selection.**\n\nA tree trained on 500 features will assign high importance to features it memorized in training — including unique identifiers and near-duplicate features. Permutation importance on validation data measures whether shuffling the feature actually hurts predictive performance on unseen examples. These two rankings regularly disagree by large margins.`,
      `**Diagnostic: if removing the bottom 50% of features by importance hurts validation AUC by less than 0.5 points, those features were vestigial. If it hurts by more than 2 points, the importance ranking is likely wrong — the features are correlated and removing one changed others' apparent importance.**\n\nThis threshold test takes one additional evaluation run and tells you whether you have a clean selection or a collinearity problem. If the second case applies, switch from marginal importance ranking to permutation importance or SHAP values, which account for feature interactions.`,
    ],
    interactivePrompt: `Before you touch the controls: you have 500 features and need to cut to 50 — before running any selection algorithm, what is the one thing you should check that could make your importance rankings unreliable?`,
    takeaway: `Feature selection is a bias-variance decision: too many features and the model memorizes noise; too few and it misses signal — and because correlation is not importance, the right ranking method matters as much as the threshold.`,
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
    summary: `A dog-versus-cat image classifier with 500 examples per class: training accuracy 95%, validation accuracy 72%, test accuracy 68%. The model is memorizing pixel arrangements. Training on raw data, it has never seen a cat from the right side, a dog in dim light, or a photo with a green tint instead of a blue one. Augment: random horizontal flip, random crop (224→192, then pad back to 224), color jitter (±0.2 brightness and contrast). Effective training set across 20 epochs: 500 × 8 augmentations × 20 = 80,000 training passes per class instead of 10,000. Validation accuracy: 84%. Test accuracy: 83%. The model learns that a horizontally flipped dog is still a dog.

The principle that makes augmentation work is invariance encoding. An augmentation is valid if and only if the transformation preserves the label. Horizontal flip is valid for animals — a flipped dog is still a dog. Horizontal flip is not valid for reading direction — a flipped "b" becomes "d." Color jitter is valid for natural photographs but not for retinal fundus images, where color is clinically diagnostic. Heavy time warping is valid for some audio tasks but destroys heartbeat morphology in ECG signals. The augmentation policy is a statement about which transformations the model should be invariant to. Only domain knowledge can verify this for a given class — the algorithm cannot.

Domain-specific augmentation matters. For text: back-translation (English → French → English via a different model) produces natural paraphrases with the same semantic content but different vocabulary. EDA (Easy Data Augmentation) — synonym replacement, random insertion, random deletion — is faster but less natural. For tabular data: Gaussian noise on continuous features, SMOTE for class imbalance specifically. For time series: window slicing, magnitude warping, time warping. For audio: pitch shift, time stretch, additive background noise.

Apply augmentations on-the-fly during training, not pre-computed. Pre-computed augmentations mean the model sees the same rotated version at every epoch and memorizes it in a few thousand steps. On-the-fly randomization applies a different random transformation each pass — across many epochs the model trains on a near-infinite variety and must learn the invariance.

**NOT this.** "More augmentation always helps." Aggressive augmentation that violates task invariances trains the model on mislabeled examples. Heavy color jitter on medical images can destroy the diagnostic signal. Excessive time warping on ECG signals can destroy heartbeat morphology. If augmented training improves training loss but not validation loss, the augmentations have added noise rather than invariance — they are too aggressive, not too weak. Test the augmented distribution against domain ground truth before training at scale.`,
    keyPoints: [
      `**Start with horizontal flip plus random crop for any image task — these two augmentations alone capture most of the regularization gain and are valid for nearly all image classification tasks.**\n\nFor the dog/cat classifier: horizontal flip is valid (a flipped dog is still a dog), random crop forces the model to recognize the animal from partial views. Together they drive validation accuracy from 72% to ~83%. More exotic augmentations — CutMix, MixUp, RandAugment — give diminishing returns beyond this baseline. Start with the cheap wins before adding complexity.`,
      `**Trap: applying augmentation to both training and validation sets. Augmentation is a training regularizer — validation must see clean, unaugmented examples to give a reliable performance estimate.**\n\nIf you augment validation, your performance metric becomes a function of which random transformations happened to be applied during that evaluation run. The estimate is noisy and not comparable across runs. Augmentation lives exclusively in the training data loader. Validation and test loaders apply no random transforms.`,
      `**Diagnostic: if augmented training improves training loss but not validation loss, the augmentations are too aggressive and have added noise rather than invariance. Reduce augmentation strength before concluding the approach does not work.**\n\nThe signal: training accuracy improves but validation accuracy does not move or gets worse. This means the augmentations are so severe that the model is learning from examples that no longer represent the class — they are mislabeled by transformation. Halve the rotation range, reduce color jitter magnitude, and re-run before abandoning augmentation.`,
    ],
    interactivePrompt: `Before you touch the controls: you are augmenting a handwritten digit dataset with random rotations up to 90 degrees — can you name one digit that this rotation would break?`,
    takeaway: `Augmentation encodes invariances the model should have — and only a domain expert can verify which transformations preserve the label for each class, because the model cannot distinguish a "different view of a dog" from a "mislabeled digit."`,
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
    summary: `A production model was deployed six months ago. A bug report arrives: model performance on iOS users degraded sharply since October. You check. A data pipeline change happened in September. But you have no record of what data the current model was trained on, what the pipeline code looked like before September, or which features changed in that deployment. Debugging this will take weeks of archaeology. With data versioning: git log the pipeline code, \`dvc checkout\` the training dataset used for that model, reproduce the training run. The bug is found in 2 hours.

A model is a function of three inputs: training data, code, and hyperparameters. All three must be versioned and reproducible. DVC handles the data half: it stores a \`.dvc\` pointer file — a content hash of the dataset — committed alongside the training code in Git. Reverting to any past commit recovers both the code and the exact dataset at that commit. Running \`dvc repro\` re-executes only the pipeline stages whose dependencies changed. Every model in production becomes traceable to the exact dataset it was trained on.

Training-serving skew is the other failure mode, and it is more common than people expect. Feature computation is implemented twice — once in Python for the training pipeline, once in SQL or Java for the serving layer. The two implementations accumulate subtle differences: timezone handling, null treatment, rounding in aggregations, edge cases in window functions. The model receives inputs at serving time that it was never trained on. Offline AUC is 91%. Production AUC is 77%. No error fires. The only fix is structural: a single canonical feature computation implementation shared by both pipelines. Feature stores (Feast, Tecton, Hopsworks) implement this by maintaining one offline store for training and one online store for low-latency serving, both computed by identical logic.

MLflow tracks the third input: each experiment logs the code commit hash, dataset DVC pointer, hyperparameters, evaluation metrics, and model artifact. Given any run ID, you recover everything. Without this, reproducing any past state requires reconstructing conditions from memory, which nobody can do reliably six weeks later.

**NOT this.** "Data versioning is overhead for small teams." The first time a silent data bug causes a production incident, you will spend 2–10 days debugging something that would have taken 2 hours with versioning. The cost of adding DVC to a repo is 2 hours. The cost of not having it when you need it is measured in incident response, stakeholder trust, and model rollbacks you cannot confidently execute. That is the entire ROI calculation.`,
    keyPoints: [
      `**Add DVC to any project the moment you have a second training run — tracking data versions retroactively is harder than starting upfront. DVC adds fewer than 5 lines to your Makefile and zero overhead to training.**\n\nFor the iOS debugging scenario: \`dvc checkout\` restores the exact dataset used six months ago. Without DVC, the training table has been updated, overwritten, or partitioned differently since then. Reproducing the model state is impossible, not just hard.`,
      `**Trap: versioning model artifacts but not data. If you can reproduce the model checkpoint but not the training data, you cannot audit why the model behaves the way it does. Data versioning is more important than model versioning.**\n\nMLflow saves the trained model weights. DVC saves the dataset hash. You need both. Model weights tell you what the model learned; the dataset hash tells you what it learned from. Without the dataset, you cannot audit for label errors, investigate training distribution, or reproduce a retraining run.`,
      `**Diagnostic: ask yourself "can I reproduce this model from scratch in under 30 minutes?" If the answer is no, you do not have a versioned pipeline.**\n\nThe test is concrete: given only the Git commit hash for a past training run, a colleague who was not on the project should be able to reproduce the model checkpoint within 30 minutes. If this is not possible — because data is untracked, pipeline stages are undocumented, or hyperparameters were set interactively — the pipeline is not versioned in any meaningful sense.`,
    ],
    interactivePrompt: `Before you touch the controls: a production model was trained 6 months ago and is now showing bugs — you have the training code at the exact Git commit, but what else do you need to reproduce the model?`,
    takeaway: `A model is a function of code, data, and hyperparameters together — versioning only the code leaves the debugging problem half-solved, and the half that is missing is usually the one that caused the incident.`,
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
