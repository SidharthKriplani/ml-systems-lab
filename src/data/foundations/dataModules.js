export const DATA_MODULES = [
  {
    id: 'data_quality_audit',
    title: 'Data Quality Audit',
    subtitle: `Understand what makes data "dirty" and why auditing before modeling is non-negotiable.`,
    difficulty: 'foundational',
    estimatedMin: 35,
    tags: ['data quality', 'profiling', 'missing values', 'outliers'],
    summary: `A vendor hands you a shiny 2-million-row dataset with 47 columns. Before you write a single line of modeling code, you spend 20 minutes just *looking* at the data — a **data quality audit** — and here is what you find. The \`income\` column is stored as text, not numbers. \`date_of_birth\` has values from 1800 to 2300. \`transaction_amount\` is 12% missing, and the missing ones are suspiciously the *large* transactions. And 30,000 rows are exact duplicates. Twenty minutes of looking just saved you a week of chasing a broken model in production.

Here is why this step is non-negotiable, and it is subtler than "garbage in, garbage out." A powerful model does not choke on bad data — it *learns from it, confidently*. Feed a gradient-boosted tree rows where \`age = -3\` and it will happily decide that negative ages predict something. Your training metrics look fine. The model ships. It assigns high confidence to wrong answers and never once flags that anything is off. The real slogan is "garbage in, *confident* garbage out," and the bill arrives weeks later when the true labels do.

---

**What to actually check.**

A good audit sweeps seven things:

- **Schema** — are the column types right, and are all the expected columns present?
- **Missing values** — how much is null per column, and is the missingness random or *patterned*?
- **Duplicates** — exact repeated rows, or near-duplicates on a key?
- **Distribution** — outliers, strange skew, two humps where you expected one?
- **Target** — is the label balanced, and are there noisy or impossible label/feature combos?
- **Leakage** — does any feature secretly use information you would not have at prediction time?
- **Coverage** — does this data actually resemble the population you will deploy against?

---

**The sneakiest failure: rows that silently vanish.**

One failure deserves special mention because it hides so well. Join two tables on customer ID, and if some IDs in one table have no match in the other, those rows simply *disappear* — no error, the pipeline reports success, and 120,000 training examples are gone. And they are almost never a random 120,000: they tend to be a specific group (older customers, one region), which is now missing entirely from training. Your model quietly learns nothing about them.

---

**Make the checks automatic.**

The fix is to turn the whole checklist into *executable assertions* that run on every new batch of data — "column income must be a float between 0 and 10 million with under 5% nulls." Tools like Great Expectations do exactly this. When an assertion fails you get a loud error on day one instead of a mysterious performance drop six weeks later. And re-run these at *every* retrain, not just once: a column that was 2% null in January and 18% null in June is a data-collection problem, and you will never notice it without looking again. A pipeline running without crashing is not the same thing as the data being good.

---

**Missingness has a taxonomy — and it changes what you can do.**

"How much is missing" is only half the question; "*why* is it missing" decides the fix. **MCAR** (missing completely at random): the missingness is unrelated to anything, so dropping or simple imputation is safe. **MAR** (missing at random): the missingness depends on *other observed* features (income missing more often for a certain age group) — you can impute using those features. **MNAR** (missing not at random): the missingness depends on the *missing value itself* (high earners refuse to state income) — and this is the dangerous one, because the missing values carry signal or bias that no ordinary imputation recovers. During the audit, don't just count nulls; look at *what else is true* about the missing rows.

---

**Drift has metrics, not just eyeballs.**

"Does this batch resemble training?" can be measured. For continuous features, **PSI** (population stability index) is the industry-standard drift score (below 0.1 stable, above 0.2 significant), the **KS test** measures the largest gap between two distributions, and **Wasserstein distance** captures how far mass moved. For distributions generally, **KL** and **Jensen-Shannon divergence** quantify how different two are (JS is symmetric and bounded). For **categorical** features, compare category frequencies (chi-squared, or PSI on the buckets) and watch for brand-new categories. Wire these into the audit so drift is a *number that crosses a threshold*, not a vibe.

---

**Audit the labels, not just the features.**

Dirty labels quietly cap model quality more than dirty features. Check for **noisy labels** (wrong ground truth), **conflicting labels** (identical rows labeled differently), **annotation disagreement** (measure inter-annotator agreement), **delayed labels** (the truth arrives weeks later, so recent rows are under-labeled), **label leakage** (a feature encodes the label), and **label-definition drift** (what counts as "fraud" changed between last year and this year). A feature audit that ignores label quality misses the ceiling on how good any model can get.

---

**Train-serving skew and feature freshness.**

Some quality problems only exist *between* environments. **Train-serving skew** is when a feature is computed one way offline (SQL over full history) and another way online (a real-time approximation) — the model then scores on values it never trained on. Related is **staleness**: a feature that's fresh offline may be hours old at serving time. So the audit must track *timestamps*: the **event time** (when it happened), the **ingestion time** (when it landed), and the **feature-computation time** — and enforce a **maximum feature age**. A value that's correct but stale is still wrong at decision time.

---

**Data contracts and a severity policy.**

Mature pipelines formalise this with **data contracts**: the producing team commits to a schema, types, value ranges, cardinality, null-rate ceilings, and a freshness SLA, with clear **ownership** so a breaking change upstream is caught at the boundary, not six weeks downstream. And each failed check needs a **severity/action policy** decided in advance: does this failure **block training**, **quarantine the batch**, fall back to a **previous model**, fire a **warning only**, or route to **human review**? "The check failed" is useless without "…and therefore we do X."

---

**Audit sample coverage, not just column values.**

Finally, check *who* is in the data. A dataset can be clean on every column yet systematically under-represent a **segment** — a geography, a device type, an acquisition channel, a cohort, or the rare high-value population you most care about. Break the audit down by these dimensions and confirm each important segment has enough coverage, because a model trained on a skewed sample is confidently wrong exactly where the data was thin.`,
    keyPoints: [
      `**Run a data quality audit before any EDA or modeling — 30 minutes of auditing routinely saves days of debugging model failures caused by silent data issues.**\n\nThe 2-million-row vendor dataset example is representative: type mismatches, impossible values, structured missingness, and 30,000 duplicates all coexist quietly until you look for them explicitly. Powerful models do not flag dirty data — they learn from it confidently.`,
      `**Trap: auditing only the training set. Data quality gates must run on every new incoming batch in production — upstream systems change schemas, inject nulls, and shift distributions without notice.**\n\nA column with 2% nulls in January training data and 18% nulls in June production data is a structural change in data collection. The model trained on the low-null version will impute using training-fit parameters that no longer fit the incoming distribution, degrading silently on the most information-rich rows.`,
      `**Diagnostic: build a schema snapshot of the training data — column types, value ranges, null rates, cardinality — and diff every new batch against it. A diff that exceeds threshold is a data quality alert, not a model problem.**\n\nGreat Expectations implements this as code: assertions that fail loudly when violated, run in CI/CD on every batch. The alternative is discovering the schema drift 6 weeks later as a "mysterious performance regression."`,
      `**Diagnose missingness by mechanism and measure drift with real metrics.**\n\nDon't just count nulls — determine MCAR (unrelated, safe to impute), MAR (depends on other observed features, impute using them), or MNAR (depends on the missing value itself, so ordinary imputation injects bias). Turn "does this batch look like training?" into numbers: PSI (>0.2 significant) and KS/Wasserstein for continuous features, KL/Jensen-Shannon for distributions, category-frequency comparison for categoricals — with new-category detection. And audit label quality (noisy, conflicting, delayed, leaked, definition-drifted labels), which caps model quality more than dirty features.`,
      `**Guard the boundaries: skew, freshness, contracts, and a severity policy.**\n\nTrain-serving skew (feature computed differently offline vs online) and staleness are cross-environment bugs, so track event/ingestion/computation timestamps and enforce a maximum feature age. Formalise producer-consumer data contracts (schema, types, ranges, cardinality, null-rate ceiling, freshness SLA, ownership) so upstream breaks are caught at the boundary. Give every failed check a pre-decided action — block training, quarantine batch, fall back to previous model, warn, or human-review — and audit sample coverage by segment/geography/device/channel/cohort so no important population is silently thin.`,
    ],
    interactivePrompt: `Before you touch the controls: if your training pipeline ran without a single error and your model achieved 94% accuracy on validation — would you trust the result before looking at the data?`,
    takeaway: `Data quality failures surface as production incidents, not training errors — because models train confidently on garbage and only reveal the problem when ground-truth labels arrive weeks later.`,
    recap: [
      `**Garbage in, *confident* garbage out:** powerful models learn from bad data silently — the bill arrives weeks later with the true labels.`,
      `**Audit before modeling:** 20-min sweep of schema, missing, duplicates, distribution, target, leakage, coverage catches type mismatches, impossible values, 30k dupes.`,
      `**Silent row loss:** a join with unmatched IDs drops rows with no error — and the dropped group (a region, a cohort) is never random.`,
      `**Make checks executable assertions** that run on *every* batch (Great Expectations) — 2% nulls in Jan vs 18% in June is a collection bug you only catch by re-checking.`,
      `**Missingness has a mechanism:** MCAR safe to impute, MAR impute from observed features, MNAR carries bias no ordinary imputation recovers.`,
      `**Drift is a number, not a vibe:** PSI (>0.2 significant), KS/Wasserstein for continuous, KL/JS for distributions, category-frequency + new-category for categoricals.`,
      `**Guard the boundaries:** train-serving skew, feature staleness, data contracts, per-check severity policy, and per-segment coverage audits.`,
    ],
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
          `A) An outlier is statistically extreme but potentially valid (a 50,000-dollar transaction is unusual but possible). An impossible value violates a hard constraint (a person cannot be -3 years old). Outliers require domain judgment; impossible values are always errors and should be nullified before any other processing. Imputing an impossible value propagates the error as if it were real information.`,
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
      {
        q: `Two features are each 20% missing. In feature A, the missingness is unrelated to anything; in feature B, high earners systematically decline to report the value. How do you classify each, and why does it change your handling?`,
        options: [
          `A) Both are MCAR because the missing rate is the same (20%), so median imputation is equally safe for both.`,
          `B) Feature A is MCAR (missingness unrelated to any value) — dropping or simple imputation is safe. Feature B is MNAR (missingness depends on the missing value itself — the high earners are exactly the ones missing), so any ordinary imputation fills in systematically wrong values and biases the model precisely on the high-value cases; you need an explicit missingness indicator, a model of the missingness, or domain handling, not a plain median fill.`,
          `C) Feature A is MAR and feature B is MCAR, and both should be handled identically with KNN imputation.`,
          `D) The classification is irrelevant — with 20% missing, both features should simply be dropped regardless of mechanism.`,
        ],
        answer: `B`,
      },
      {
        q: `Your feature pipeline is clean on every column, but the model underperforms badly for one region and one device type. Aggregate metrics look fine. What audit dimension did you likely skip?`,
        options: [
          `A) You skipped hyperparameter tuning — regional underperformance is always a capacity problem fixed by a larger model.`,
          `B) You skipped a sample-coverage audit: a dataset can be valid on every column yet systematically under-represent a segment (a region, device, channel, or cohort), so the model is confidently wrong exactly where the data was thin. Break the audit down by segment and confirm each important population has enough coverage, rather than trusting aggregate column checks.`,
          `C) You skipped outlier removal for those segments, which is the only reason a clean dataset underperforms on a subgroup.`,
          `D) Nothing was skipped — per-segment underperformance with clean columns is random noise and needs no action.`,
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
    summary: `You are building a model to predict which hospital patients will be readmitted. One column — a creatinine lab result — is missing for 32% of patients. The natural instinct is to ask "how do I fill in these blanks?" But that is the wrong first question. The right one is: **why are they missing?** Because the reason completely changes what you should do.

So you ask the clinical team, and you learn there are actually *two* different reasons. Some patients had mild symptoms, so the doctor never bothered ordering the test — here the missingness depends on things you *can* see (their other symptoms). Other patients were too critically ill to draw blood — here the missingness depends on the very thing you *cannot* see (how bad their creatinine would have been). These two look identical in the data — both just show up as "null" — but they demand completely different treatment.

[FIGURE: missingness_types]

Statisticians name three cases. **MCAR** (missing completely at random): the blanks are pure chance, unrelated to anything — a lab machine randomly dropped some readings. **MAR** (missing at random): the blanks depend on things you *did* observe — mild patients skip the test. **MNAR** (missing not at random): the blanks depend on the missing value *itself* — the sickest patients, with the worst readings, are exactly the ones missing them.

---

**Why the mechanism decides everything.**

For **MCAR** and **MAR**, you can fill the blanks intelligently. Since MAR missingness is explained by other columns, a model can *predict* the missing creatinine from a patient's age, comorbidities, and other labs. That is what **MICE** does: for each column with gaps, it trains a little regression on all the other columns and predicts what belongs in the blank, looping until the estimates settle.

For **MNAR**, you are in trouble, and no clever statistics can rescue you. If the worst readings are precisely the ones missing, then filling in the *average* hands the sickest patients a reassuringly normal number. The model learns that these patients look fine, predicts low risk for them, and systematically fails exactly the people who most need help. You cannot impute your way out of MNAR without explicitly modeling *why* the data is missing.

---

**The imputation ladder, simplest to fanciest.**

**Mean/median**: replace blanks with the column's average. Fast, but it crushes the column's variance and erases its relationships with other features. **KNN**: find the most similar complete rows and borrow their values — respects local structure, but slow and needs scaled features. **MICE**: the regression-based looping method above — most accurate for MAR data, but you have to carry the fitted models around at serving time.

And one rule that holds no matter the mechanism: for any column more than about 5% missing, **add a little yes/no "was this missing?" column next to it.** The mere *fact* that a value was absent is often predictive (a skipped test says something), and a model given both the filled-in value and the was-missing flag can learn from the pattern of absence. Impute alone and you throw that signal away forever.

(And the usual leakage warning: fit your imputer on the *training* data only. Compute the fill-in value using the test set too, and you have leaked the future into the past.)

---

**Single versus multiple imputation: honesty about uncertainty.**

Every method above is **single imputation** — it fills each blank with *one* number and then the model treats that guess as if it were a certainty. But it wasn't a certainty; it was an estimate with error, and pretending otherwise makes the model overconfident and understates the uncertainty in anything downstream. **Multiple imputation** fixes this: generate *several* completed datasets (each with slightly different plausible fills drawn from the imputation model's uncertainty), train/analyse on each, and **pool** the results. The spread across the versions honestly reflects how much the missingness actually costs you. MICE is naturally a multiple-imputation method (run it a few times with different seeds); use it when calibrated uncertainty matters, not just a point prediction.

---

**Handling MNAR properly.**

MNAR can't be imputed away, but it can be *managed*. **Sensitivity analysis**: impute under several assumptions about how the missing values differ from the observed ones, and see whether your conclusions hold across them — if they do, you're robust; if they flip, you've found a real vulnerability. More formal tools **model the missingness itself**: **pattern-mixture models** fit different distributions for the missing-vs-observed groups, and **selection models** explicitly model the probability of being missing. And sometimes the right move is **domain escalation** — go back to the people who generated the data and ask why it's missing, because that answer often changes the whole approach. What you must *not* do is quietly median-fill and move on.

---

**Categorical missingness is its own case.**

For categorical columns, you often don't need to "impute" at all — you can make missing an **explicit "Unknown/Missing" category**. This is clean and lets the model learn whatever the absence signals, without inventing a fake category value. Combine it with **rare-category grouping** (fold sparse categories, including Unknown, into an "Other" bucket if they're too thin to estimate) and, as with numeric columns, a **missingness indicator** where the fact of absence is predictive.

---

**Imputation at serving time.**

Imputation isn't just a training-time step — it has to run *identically* in production, and that's where it breaks. You must **store the fitted imputer** (the training means, the MICE regression models, the KNN reference set) and apply the *same* parameters at serving, never re-fit on live data. You also have to handle **unseen missingness patterns** (a feature that was never missing in training suddenly arrives null) with a defined fallback, and **monitor null-rate drift** — a feature whose null rate jumps from 2% to 30% in production means the imputer is now guessing far more than it was validated to, and quality degrades silently.

---

**Trees can sometimes skip imputation entirely.**

One model-family nuance worth knowing: several tree implementations (**LightGBM**, **XGBoost**, and histogram-based gradient boosting) handle missing values **natively** — they learn, at each split, which direction a missing value should go, so you can feed them NaNs directly and often *shouldn't* impute. Linear models, neural networks, and distance-based methods (k-NN, SVM) have no such mechanism and **require** explicit imputation (and usually scaling) first. So "how do I handle missing values" partly depends on which model you're feeding — trees may want the raw gaps, everything else needs them filled.`,
    keyPoints: [
      `**Always add a binary indicator variable alongside imputation for any column with more than 5% missing — the fact that a value is missing is often more predictive than the imputed value itself.**\n\nFor the creatinine column: a model trained with only imputed values learns from the imputation. A model trained with imputed values plus a \`creatinine_was_null\` indicator can learn that absence itself is a clinical signal. Never throw away the missingness signal by imputing alone.`,
      `**Trap: fitting the imputer on the entire dataset before splitting. This leaks test-set statistics into training. Always fit imputers only on training data, then apply to validation and test.**\n\nFitting a mean imputer on train + test computes a mean influenced by test-set values. The training imputation now reflects the test distribution — a form of leakage that produces optimistic metrics which collapse in production. Use an sklearn Pipeline to enforce fit-on-train-only structurally, not through discipline.`,
      `**Diagnostic: compare model performance trained on imputed-only versus imputed plus indicator columns. If adding the indicator improves AUC, the missingness is *informative* — treat absence as a feature.**\n\nThis test costs one additional training run and shows whether the *fact* of missingness carries signal. Be careful with the conclusion, though: an informative indicator proves the missingness is predictive, but it does **not** by itself prove MNAR — MAR missingness (driven by other observed features) can also make the indicator useful. So use the indicator either way, but don't read "indicator helped" as a definitive MNAR diagnosis; confirm the mechanism with domain knowledge.`,
      `**Single imputation hides uncertainty; MNAR needs management, not a median fill.**\n\nSingle imputation fills one value and treats the guess as certain, making the model overconfident — multiple imputation generates several plausible completed datasets and pools them to reflect the real uncertainty (run MICE with different seeds). MNAR can't be imputed away but can be managed with sensitivity analysis (do conclusions hold under different assumptions?), pattern-mixture/selection models, or domain escalation. For categoricals, prefer an explicit "Unknown" category over inventing a value, plus rare-category grouping.`,
      `**Imputation must run identically at serving, and trees may not need it at all.**\n\nStore the fitted imputer (training means, MICE models, KNN reference set) and apply the same parameters in production — never re-fit on live data — handle unseen missingness patterns with a defined fallback, and monitor null-rate drift (2% → 30% means the imputer is guessing far more than it was validated for). Model family matters: LightGBM/XGBoost/histogram gradient boosting handle NaNs natively (learning a default split direction), so you often shouldn't impute for them, while linear/neural/distance methods require explicit imputation and scaling.`,
    ],
    interactivePrompt: `Before you touch the controls: a lab result is missing for 32% of patients — before choosing any imputation method, what is the one question you need to answer first?`,
    takeaway: `The mechanism of missingness — MCAR, MAR, or MNAR — determines the right treatment; choosing a method before diagnosing the mechanism trains the model on systematically wrong values for the cases where accuracy matters most.`,
    recap: [
      `**Ask *why* it's missing, not *how* to fill it** — the mechanism decides the treatment.`,
      `**MCAR/MAR** are imputable (MAR via a model like \`MICE\` predicting the gap from other columns); **MNAR** can't be imputed away — mean-fill hands the sickest patients a normal number.`,
      `**Imputation ladder:** mean/median (fast, crushes variance) → KNN (local, slow) → MICE (regression loop, most accurate for MAR).`,
      `**Add a \`was_missing\` indicator** for any column >5% missing — the fact of absence is often predictive.`,
      `**Fit imputers on train only** — computing fills on test leaks the future into the past.`,
      `**Single imputation hides uncertainty;** multiple imputation pools several plausible fills to restore honest error bars.`,
      `**Trees may want the raw gaps:** LightGBM/XGBoost/hist-GBM learn a default split direction for NaNs; linear/NN/distance methods require explicit imputation + scaling.`,
    ],
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
      {
        q: `You single-impute a 25%-missing feature with MICE, train a model, and report tight confidence intervals on its coefficients. A statistician says your uncertainty is understated. Why, and what's the fix?`,
        options: [
          `A) The statistician is wrong — MICE is a regression method, so its imputations are exact and add no uncertainty.`,
          `B) Single imputation (even with MICE) fills each blank with one value and the model then treats that guess as a certainty, so 25% of the feature is fabricated-but-treated-as-known and the reported uncertainty ignores the imputation error. The fix is multiple imputation: generate several completed datasets from the imputation model's uncertainty (e.g. MICE with different seeds), fit the model on each, and pool the estimates — the spread across versions restores the honest uncertainty.`,
          `C) The intervals are too tight only because the sample is large; collecting less data would widen them appropriately.`,
          `D) The fix is to switch from MICE to mean imputation, which produces wider and therefore more honest confidence intervals.`,
        ],
        answer: `B`,
      },
      {
        q: `You're deciding how to handle missing values for two candidate models: a LightGBM gradient-boosting model and a logistic regression. How should your approach differ?`,
        options: [
          `A) Both require the same explicit mean imputation before training, since all models treat missing values identically.`,
          `B) LightGBM handles missing values natively — it learns a default split direction for NaNs at each node — so you can often feed it the raw gaps and shouldn't impute. Logistic regression has no such mechanism and requires explicit imputation (plus scaling) before training. So the missing-value strategy depends partly on which model you're feeding: raw NaNs can be fine for the tree, but must be filled for the linear model.`,
          `C) LightGBM requires imputation while logistic regression handles missing values natively, so only the tree needs preprocessing.`,
          `D) Neither model can accept missing values, so both require dropping all rows with any null before training.`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      missingness_types: `<svg viewBox="0 0 390 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:390px;font-family:var(--font-sans,sans-serif)">
  <text x="65" y="20" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">MCAR</text>
  <text x="195" y="20" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">MAR</text>
  <text x="325" y="20" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">MNAR</text>
  <!-- MCAR: random blanks -->
  <g>
    <rect x="40" y="30" width="50" height="18" rx="2" fill="var(--prime)" opacity="0.7"/>
    <rect x="40" y="52" width="50" height="18" rx="2" fill="var(--amber)"/><text x="65" y="65" text-anchor="middle" fill="#000" font-size="11" font-weight="700">?</text>
    <rect x="40" y="74" width="50" height="18" rx="2" fill="var(--prime)" opacity="0.7"/>
    <rect x="40" y="96" width="50" height="18" rx="2" fill="var(--prime)" opacity="0.7"/>
    <rect x="40" y="118" width="50" height="18" rx="2" fill="var(--amber)"/><text x="65" y="131" text-anchor="middle" fill="#000" font-size="11" font-weight="700">?</text>
  </g>
  <text x="65" y="158" text-anchor="middle" fill="var(--ink-low)" font-size="8">blanks fall</text>
  <text x="65" y="169" text-anchor="middle" fill="var(--ink-low)" font-size="8">at random</text>
  <!-- MAR: blanks where a visible trait = mild (top) -->
  <g>
    <rect x="170" y="30" width="50" height="18" rx="2" fill="var(--amber)"/><text x="195" y="43" text-anchor="middle" fill="#000" font-size="11" font-weight="700">?</text>
    <rect x="170" y="52" width="50" height="18" rx="2" fill="var(--amber)"/><text x="195" y="65" text-anchor="middle" fill="#000" font-size="11" font-weight="700">?</text>
    <rect x="170" y="74" width="50" height="18" rx="2" fill="var(--prime)" opacity="0.7"/>
    <rect x="170" y="96" width="50" height="18" rx="2" fill="var(--prime)" opacity="0.7"/>
    <rect x="170" y="118" width="50" height="18" rx="2" fill="var(--prime)" opacity="0.7"/>
  </g>
  <text x="228" y="43" fill="var(--ink-low)" font-size="8">mild</text>
  <text x="228" y="127" fill="var(--ink-low)" font-size="8">sick</text>
  <text x="195" y="158" text-anchor="middle" fill="var(--ink-low)" font-size="8">blanks track a</text>
  <text x="195" y="169" text-anchor="middle" fill="var(--ink-low)" font-size="8">visible trait</text>
  <!-- MNAR: sorted by true value, blanks at the extreme -->
  <g>
    <rect x="300" y="30" width="50" height="18" rx="2" fill="var(--prime)" opacity="0.7"/>
    <rect x="300" y="52" width="50" height="18" rx="2" fill="var(--prime)" opacity="0.7"/>
    <rect x="300" y="74" width="50" height="18" rx="2" fill="var(--prime)" opacity="0.7"/>
    <rect x="300" y="96" width="50" height="18" rx="2" fill="var(--amber)"/><text x="325" y="109" text-anchor="middle" fill="#000" font-size="11" font-weight="700">?</text>
    <rect x="300" y="118" width="50" height="18" rx="2" fill="var(--amber)"/><text x="325" y="131" text-anchor="middle" fill="#000" font-size="11" font-weight="700">?</text>
  </g>
  <text x="358" y="39" fill="var(--ink-low)" font-size="8">low</text>
  <text x="358" y="131" fill="var(--ink-low)" font-size="8">high</text>
  <text x="325" y="158" text-anchor="middle" fill="var(--ink-low)" font-size="8">blanks are the</text>
  <text x="325" y="169" text-anchor="middle" fill="var(--ink-low)" font-size="8">worst values</text>
</svg>`,
    },
  },
  {
    id: 'feature_engineering',
    title: 'Feature Engineering',
    subtitle: `Transform raw columns into representations that expose the signal a model can actually learn from.`,
    difficulty: 'foundational',
    estimatedMin: 45,
    tags: ['feature engineering', 'transformations', 'cyclical encoding', 'interaction terms', 'log transform'],
    interactivePrompt: `Before you touch the controls: if you gave a model three raw numbers — someone's annual income in dollars, the number of days since they opened their account, and the date of their last transaction — could it learn to predict credit default without you doing anything to those columns first?`,
    summary: `You want to predict credit default, and you have three raw columns: income in dollars, account age in days, and the date of the last transaction. You feed them straight into a model and it does poorly. The tempting move is to grab more data or a fancier model. Both are wrong. The problem is that the raw columns do not present the information in a shape the model can use — and reshaping them is called **feature engineering**.

The key thing to internalise: a model sees *nothing but numbers*. It has no idea that income is measured in dollars, that an account opened last week is a different animal from a decade-old one, or that income only means something *relative* to debt. Your job is to bake that knowledge into the numbers themselves. Let us do it column by column.

---

**Income: fix the scale.**

To a raw model, the jump from 50,000 to 51,000 and the jump from 50,000 to 100,000 are just "1,000" and "50,000" apart — so it treats the second as fifty times more important. But for credit risk, doubling someone's income matters enormously while a 1,000 bump is noise. A **log transform** fixes this: on a log scale, 50K → 100K is a big step while 900K → 950K is almost nothing. It stretches out the low range where the real variation lives and squashes the giant tail. The model is not smarter afterward — the *shape* of the feature is finally right.

---

**Account age: hand it the domain knowledge.**

The raw numbers 7 days versus 3,650 days do not capture that a brand-new account behaves nothing like a ten-year one. Bucketing into "new / established / long-term," or building a ratio like "transactions per account-year," gives the model the thing an expert already knows: the first year is a different world from year ten.

---

**Last transaction date: turn a calendar into a signal.**

A raw date means nothing on its own. But "days since last transaction" is a direct *recency* signal, and "transactions in the last 30 days" is a *velocity* signal. Neither exists in the original data — you compute them against a reference time. These are **temporal features**, earned by realising the model wants a time gap, not a calendar entry.

---

**Income and debt together: the interaction.**

Income alone does not tell you whether someone is overextended, and neither does debt alone — but the **income-to-debt ratio** does. This is an **interaction feature**: a joint signal that neither parent carries by itself. A tree model can sometimes discover it on its own; a linear model never will unless you hand it the ratio explicitly.

---

**Doesn't deep learning make this obsolete?**

For images and text, largely yes — raw pixels and words already carry rich structure a network can exploit. But for *tabular* data like this, no. The model just sees bare numbers with no idea what they mean, so even gradient boosting — which handles non-linearities well — routinely gains 5–20% from good ratios, log transforms, and time lags. Feature engineering is not busywork; it is the craft of encoding what you know into the geometry of the input, so that a solvable problem actually becomes solvable.

---

**Categorical columns need encoding too.**

The columns above were numeric; categorical columns ("country," "device," "merchant") have to be turned into numbers, and the choice matters. Quick map: **one-hot** for low-cardinality categories (a column per value), **ordinal** when the categories have a real order, **target encoding** (replace a category with the average outcome for it) for high-cardinality columns, **frequency/count encoding** when popularity itself is predictive, the **hashing trick** for huge or unbounded vocabularies, and **learned embeddings** for neural nets. Each has a different leakage and cardinality profile — the dedicated encoding lesson goes deep; the point here is that "engineer the features" includes choosing a categorical encoding, not just transforming numbers.

---

**Aggregation and window features: where the real signal often lives.**

For behavioural data, the strongest features are usually *aggregates over time*, not raw columns. The classic frame is **RFM** — **Recency** (days since last transaction), **Frequency** (how many in the last N days), **Monetary** (total/average spend) — and it generalises: **rolling** statistics (mean/std/count over a trailing window), **expanding** windows (cumulative to date), and **lag** features (the value k steps ago). These compress a user's history into a few predictive numbers. The non-negotiable rule attached to all of them is the **point-in-time join**: every aggregate must be computed using only data available *strictly before* the label timestamp, or you leak the future — the single most common way aggregate features go wrong.

---

**High-cardinality columns need special care.**

A "merchant_id" or "zip_code" column with 50,000 values can't be one-hot encoded sanely (50,000 columns, most nearly always zero). Options: **group rare categories** into "Other" below a count threshold, the **hashing trick** (map categories into a fixed number of buckets, accepting some collisions), and **smoothed target encoding** — replace each category with a blend of its own outcome average and the global average, shrinking rare categories toward the global mean so a category seen twice doesn't get a wild estimate. And target encoding is a leakage magnet, so it must be done **out-of-fold** inside cross-validation (each row encoded using only the *other* folds), never on the full data.

---

**Text, images, embeddings: where engineering becomes representation learning.**

For unstructured inputs the "features" are learned, not hand-built. Text becomes **TF-IDF** vectors (classic) or **embeddings** from a pretrained model (modern); images become activations from a pretrained CNN; and you often **reduce dimension** afterward. The line to notice: at this point feature engineering has become **representation learning** — the network *learns* the features instead of you crafting them, which is exactly why deep learning displaced hand-engineering for images and text but not for tabular data.

---

**A feature has to exist at prediction time.**

An engineered feature is worthless if you can't compute it live with the same values. **Serving parity** is the discipline: the offline (training) computation and the online (serving) computation must produce identical results, the feature must be **fresh** enough at request time, and **backfilling** it for historical training rows must respect point-in-time correctness. This is what feature stores exist to enforce. A feature that's brilliant offline but arrives stale, or is computed differently online, produces train-serving skew — the model scores on values it never learned from.

---

**Validate new features by ablation.**

Don't trust "accuracy went up after I added 40 features." Validate the way you'd validate a model change: start from a **baseline** with raw features, add one **feature family at a time**, and measure the lift on an **untouched validation/test set** — features selected or tuned against the same set you report on will look better than they are. Pair this with redundancy checks (drop features correlated with existing ones), permutation importance, and a look at whether the picks are **stable across folds**. A feature family that doesn't move held-out performance is overfitting risk, not signal.`,
    keyPoints: [
      `**Use log and sqrt transforms when a continuous feature is right-skewed and your model is not a tree.** Income, transaction counts, prices, and time durations almost always need this. The rule of thumb: if the 95th percentile is more than 10× the median, the raw scale is hurting you. Apply log(x + 1) to handle zeros. For tree-based models, skip it — the relative ordering is all that matters and log transforms change nothing about optimal split thresholds.`,
      `**The most common production trap: computing temporal features without a strict temporal join.** A "7-day rolling transaction count" sounds clean until you realize it was computed using the label day itself. The feature includes the day you are trying to predict. In training this inflates performance; in production the feature is computed before the outcome is known. Every lag feature, rolling mean, or "days since" feature must be computed using only data available strictly before the label timestamp. Validate this by running your feature pipeline on a single row and verifying the computation cutoff date.`,
      `**Diagnose which features are earning their place with permutation importance, not training loss.** Shuffle a feature's values across the validation set and measure the drop in performance. A genuinely useful feature causes a large drop when shuffled. A spurious feature or a duplicate of another feature causes no drop. Features that do not move permutation importance are adding noise and overfitting risk — remove them. Run this check after any batch of new features before shipping to production.`,
      `**Aggregate over time with point-in-time joins, and handle high-cardinality categoricals carefully.**\n\nThe strongest behavioural features are RFM-style aggregates — recency, frequency, monetary, plus rolling/expanding/lag windows — but every one must be computed strictly before the label timestamp (point-in-time join) or it leaks the future. For high-cardinality columns (merchant_id, zip), group rare categories into "Other," use the hashing trick, or smoothed target encoding done out-of-fold in CV (never on the full data, or you leak the label). Encoding choice is part of feature engineering: one-hot for low cardinality, target/frequency/hashing for high, embeddings for neural nets.`,
      `**A feature must survive to serving, and new features earn their place by ablation.**\n\nServing parity is non-negotiable: the offline and online computations must match, the value must be fresh at request time, and backfills must be point-in-time correct — a feature that's great offline but stale or differently-computed online creates train-serving skew. For unstructured data (text/images), features become learned representations (TF-IDF/embeddings), which is where engineering shades into representation learning. Validate additions by ablation — baseline, add one feature family at a time, measure lift on an untouched test set, check stability across folds — rather than trusting a single accuracy bump.`,
    ],
    takeaway: `Raw features encode what was recorded; engineered features encode what the model needs to find the pattern. The right representation can replace millions of additional training rows — the wrong one makes the signal invisible regardless of model complexity.`,
    recap: [
      `**Raw features encode what was recorded; engineered features encode what the model needs** — the right representation can replace millions of rows.`,
      `**Log/sqrt right-skewed inputs for non-tree models** (95th pctile >10× median); use \`log(x+1)\` for zeros. Trees don't care — ordering is all that matters.`,
      `**Temporal features must use a strict point-in-time join:** a 7-day rolling count that includes the label day leaks the future.`,
      `**Permutation importance, not training loss,** decides which features earn their place — shuffle it; no drop means no signal.`,
      `**High-cardinality categoricals:** group rare into Other, hashing trick, or out-of-fold smoothed target encoding (never on full data).`,
      `**Serving parity is non-negotiable:** offline and online computations must match, values must be fresh, backfills point-in-time correct — else train-serving skew.`,
      `**Validate additions by ablation:** baseline, add one feature family at a time, measure lift on an untouched test set, check stability across folds.`,
    ],
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
      {
        q: `You engineer a "transactions in the last 7 days" feature for a fraud model and validation AUC jumps to 0.97, but production performance is far worse. The feature itself is predictive. What's the likely bug?`,
        options: [
          `A) The feature is simply too predictive, so the model overfits to it; the fix is to remove it.`,
          `B) The rolling-window aggregate was almost certainly computed without a strict point-in-time join — it included transactions from the label day itself (or after), so in training the feature secretly contained future information. In production the same window can only use data available before the decision, so the feature is weaker and AUC collapses. Recompute every aggregate/lag/rolling feature using only data strictly before the label timestamp, and verify the cutoff on a single row.`,
          `C) The 7-day window is too short; extending it to 30 days will make training and production match.`,
          `D) Production simply has fewer transactions, so the feature is noisier there — nothing to fix in the pipeline.`,
        ],
        answer: `B`,
      },
      {
        q: `Your tabular model uses a "merchant_id" column with 40,000 distinct values. Why is one-hot encoding a poor choice, and what are better options?`,
        options: [
          `A) One-hot is ideal here — 40,000 binary columns give the model maximum information about each merchant.`,
          `B) One-hot would create ~40,000 mostly-zero columns (huge, sparse, and starved of data per column). Better: group rare merchants into "Other" below a count threshold, use the hashing trick to map ids into a fixed number of buckets, or use smoothed target encoding (blend each merchant's outcome average toward the global mean so rare ids aren't wildly estimated) — done out-of-fold within CV to avoid label leakage. For neural nets, a learned embedding is the standard high-cardinality solution.`,
          `C) One-hot is fine but must be followed by StandardScaler on the 40,000 columns to balance their magnitudes.`,
          `D) The only valid option is ordinal encoding (assign each merchant an integer 1–40,000), which preserves all the information compactly.`,
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
    summary: `You are predicting customer churn, and one of your columns is \`city\` — with 5,000 different values. Models only eat numbers, so you have to turn those city names into numbers somehow. And *how* you do it turns out to matter a lot, because every method quietly makes a *claim* about the categories, and the wrong claim hurts you.

---

**The obvious way, and why it strains at scale.**

The default is **one-hot encoding**: make one yes/no column per city (is it San Francisco? is it Austin? …). For a handful of categories this is perfect. But 5,000 cities means 5,000 near-empty columns, and with 100,000 rows many cities have only a few examples each — so their column is basically noise. The model can "memorise" that San Francisco churned a lot in your training window without learning anything that generalises.

---

**Target encoding: one dense, informative column.**

A better move at high cardinality is **target encoding**: replace each city with the average churn rate *of that city*. San Francisco, with plenty of examples, gets a stable estimate; "Smalltown, OH" with three examples gets nudged toward the overall average so its tiny sample cannot run wild. Instead of 5,000 sparse columns you get *one* meaningful number per row — and for tree models this often beats one-hot outright.

But target encoding has a sharp, specific trap: **leakage**. If you compute a city's average churn using the whole dataset and then feed it back as a feature, each row's encoded value was partly computed from *its own label* — you have handed the model the answer. A city with a single row gets encoded with that row's exact outcome. The fix is to compute the averages *out-of-fold* — each row encoded using only *other* rows — which the \`category_encoders\` library does for you with one setting.

---

**A quick decision guide.**

- **Low cardinality** (under ~15: payment method, device type): **one-hot** is fine — few columns, no leakage worry.
- **Medium** (15–50): one-hot, unless there is a *real* order (education: high-school < college < grad), in which case **ordinal** encoding respects it. Do not impose an order where none exists.
- **High** (50+: cities, merchants): **target encoding** (out-of-fold), or frequency encoding.
- **Very high, with a neural network** (user IDs, product IDs): **embeddings** — the network learns a small dense vector per category, and categories that behave alike end up close together in that space.

One myth to retire: "LightGBM handles categoricals natively, so I can skip all this." Its built-in handling is fine for modest cardinality but degrades past a couple hundred values — for a 5,000-city column, explicit out-of-fold target encoding still wins, and it is one line of code.

---

**Target encoding with smoothing: the actual formula.**

"Nudge rare categories toward the global average" has a precise form worth carrying. The smoothed encoding for a category is a *count-weighted blend* of its own mean and the global mean:

encoded = (n·category_mean + m·global_mean) / (n + m)

where **n** is how many rows that category has and **m** is a smoothing strength. When a category is common (n ≫ m) the encoding ≈ its own mean; when it's rare (n small) it's pulled toward the global mean, so "Smalltown with 3 rows" can't produce a wild estimate. Bigger m means more shrinkage. This smoothing is what makes target encoding safe on long-tailed categories.

---

**The full CV-safe protocol.**

Getting target encoding right end-to-end has three stages, and mixing them up is the classic bug. **For the training set**, use out-of-fold encoding (each row encoded from the *other* folds) so no row sees its own label. **For the test set (and inference)**, encode using statistics computed from the *entire* training set — the test rows never contribute to any mean. So: OOF within train, full-train stats applied to test. Fitting one encoder on all the data, or using OOF stats for the test set, both break it.

---

**Frequency and count encoding.**

A cheaper cousin of target encoding: replace each category with **how often it appears** (its count or frequency). It's useful precisely when *popularity itself is predictive* — a rare merchant may be riskier than a common one — and it has a nice property target encoding lacks: it **doesn't touch the label**, so there's no leakage to guard against. It handles high cardinality in one dense column at almost no cost. It's weaker than target encoding when the outcome, not the frequency, is what matters — but it's a strong, safe default to try alongside.

---

**Hashing: cheap and unbounded, but blind.**

The **hashing trick** maps categories into a fixed number of buckets via a hash function — so it handles *unbounded* vocabularies (new categories just hash into existing buckets) at fixed memory. The costs: **collisions** (different categories share a bucket, blurring them together — worse for rare categories that collide with common ones), total **loss of interpretability** (you can't read a bucket back to a category), and a real **choice of bucket count** (too few = heavy collisions, too many = sparse). Use it when the vocabulary is huge or streaming and you can tolerate some collision noise, not when you need to explain the model.

---

**Embeddings: dimension, cold start, minimum frequency.**

Learned embeddings are powerful for neural nets but have their own knobs. **Dimension**: a rough heuristic is min(50, cardinality^0.25 · few) — bigger for higher-cardinality columns, but too large overfits. **Minimum frequency**: categories seen only a handful of times can't learn a good vector, so group rare ones into a shared "rare" token. **Cold start**: a brand-new category at inference has no trained embedding — you need a reserved "unknown" embedding to fall back on. And embeddings need **enough data per category** and some **regularisation** or they memorise. They're not free lunch; they're target encoding's expressive, data-hungry sibling.

---

**Native categorical handling differs by library.**

"The tree library handles categoricals" is true but the *details* differ and matter. **LightGBM** has native categorical splits (good to a few hundred values). **XGBoost** added native categorical support more recently. **CatBoost** is the standout: it uses **ordered target statistics** — a target-encoding scheme computed in a way that structurally avoids the leakage plain target encoding suffers — which is why it often wins on categorical-heavy data with minimal preprocessing. So if your data is dominated by high-cardinality categoricals, CatBoost is worth trying specifically for this reason.

---

**Rare categories and new categories in production.**

Two operational rules. **Rare-category policy**: fold categories below a minimum-count threshold into an explicit "Other" bucket rather than trusting three-row estimates. **New-category monitoring**: production will see categories that never appeared in training, so define the fallback (global mean for target encoding, a hash bucket, an "unknown" embedding) *and* monitor the **rate of unseen categories** — a rising unknown rate means your encoding is increasingly guessing, and it's an early signal that the category space has drifted and you should retrain.`,
    keyPoints: [
      `**Use target encoding with 5-fold isolation for any categorical feature with cardinality above 50 — it is the highest-signal encoding for tree models and takes one line of code with the category-encoders library.**\n\nFor the 5,000-city feature: target encoding produces a single dense column where each city's value reflects actual churn signal from training data. One-hot produces 5,000 sparse columns where most cities have fewer than 20 training examples — a regime that guarantees memorization rather than generalization.`,
      `**Trap: computing target encoding statistics before the train/test split. This leaks test-set label information into training features and is one of the most common sources of inflated offline metrics.**\n\nThe mechanism: mean churn rate per city is computed across the full dataset. Each row's city feature is now a function of that row's own label (plus its neighbors'). For cities with few rows, the encoded value is nearly the target itself. Fix: compute within folds using category-encoders' cross-val encoding or TargetEncoder with cv parameter.`,
      `**Diagnostic: if a target-encoded feature shows near-100% feature importance in a tree model, check for leakage — the encoding likely included the target row's own label in the mean.**\n\nA legitimately useful encoding produces moderate, plausible importance. An encoding that accidentally includes row-level label information will dominate feature importance because it is effectively a noisy copy of the target. Check by comparing feature importance on train vs. validation — a leaking feature will show much higher importance on training data.`,
      `**Smooth target encoding by count, and know frequency/hashing/embedding trade-offs.**\n\nSmoothed target encoding blends category mean with global mean by count: (n·cat_mean + m·global_mean)/(n+m), pulling rare categories toward the global average. The CV-safe protocol: out-of-fold encoding within train, full-train stats applied to test/inference. Frequency/count encoding is a leakage-free alternative when popularity is predictive. Hashing handles unbounded vocabularies but brings collisions and no interpretability. Embeddings need a chosen dimension, a minimum frequency (group rare into a shared token), and an "unknown" vector for cold start.`,
      `**Library categorical support differs, and production needs a rare/new-category policy.**\n\nLightGBM and XGBoost have native categorical splits (good to a few hundred values); CatBoost's ordered target statistics structurally avoid the leakage plain target encoding suffers, so it often wins on categorical-heavy data with minimal preprocessing. Operationally: fold categories below a minimum count into "Other," define the unseen-category fallback (global mean / hash bucket / unknown embedding), and monitor the rate of unseen categories in production — a rising unknown rate means the category space is drifting and it's time to retrain.`,
    ],
    interactivePrompt: `Before you touch the controls: you have a "city" column with 5,000 unique values — what would happen if you one-hot encoded it before training a logistic regression on 100,000 rows?`,
    takeaway: `Every encoding asserts something about category structure — the wrong assertion is not a preprocessing detail but a false claim the model learns as if it were true, and at high cardinality the wrong choice costs measurable AUC.`,
    recap: [
      `**Every encoding asserts something about category structure** — the wrong assertion is a false claim the model learns as true.`,
      `**High cardinality (>50):** target encoding gives one dense signal-bearing column; one-hot on 5,000 cities is sparse and forces memorization.`,
      `**Target encoding leaks** if computed before the split — the encoded value becomes a noisy copy of the row's own label. Compute out-of-fold.`,
      `**Leakage tell:** a target-encoded feature at ~100% importance, much higher on train than validation.`,
      `**Smooth by count:** \`(n·cat_mean + m·global_mean)/(n+m)\` pulls rare categories toward the global average.`,
      `**Menu:** frequency/count (leakage-free when popularity predicts), hashing (unbounded vocab, collisions), embeddings (need dim + min-freq + unknown vector).`,
      `**Production needs a rare/new-category policy:** fold below-min into Other, define the unseen fallback, monitor unseen rate — rising = drift = retrain.`,
    ],
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
      {
        q: `You target-encode a high-cardinality column and a category that appears only twice in training gets an encoded value equal to those two rows' average outcome — a wild, unreliable estimate. What technique tames this, and how does it work?`,
        options: [
          `A) Drop every category with fewer than 100 rows, since rare categories can never be encoded reliably.`,
          `B) Smoothing: encode as a count-weighted blend of the category's own mean and the global mean — (n·category_mean + m·global_mean)/(n+m). For a category with n=2, the small n means the estimate is pulled strongly toward the global mean, so its two-row average can't dominate; common categories (large n) keep their own mean. The smoothing strength m controls how aggressively rare categories are shrunk.`,
          `C) Switch to one-hot encoding, which never produces unreliable estimates for rare categories.`,
          `D) Multiply every encoded value by the category's frequency, which automatically down-weights rare categories to zero.`,
        ],
        answer: `B`,
      },
      {
        q: `Your dataset is dominated by several high-cardinality categorical columns. A colleague suggests CatBoost specifically. What's the technical reason CatBoost is well-suited here?`,
        options: [
          `A) CatBoost one-hot encodes all categoricals internally, which is always optimal for high cardinality.`,
          `B) CatBoost uses ordered target statistics — a target-encoding scheme computed over a randomized ordering so that each row's encoding never uses its own label — which structurally avoids the leakage that plain target encoding suffers, while still capturing the strong signal target encoding provides. That makes it strong on categorical-heavy data with minimal manual preprocessing. (LightGBM/XGBoost also have native categorical splits, but CatBoost's ordered scheme is the specific reason it shines here.)`,
          `C) CatBoost ignores categorical columns entirely and trains only on numeric features, which prevents overfitting to categories.`,
          `D) CatBoost requires no validation set because its categorical handling eliminates all forms of overfitting automatically.`,
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
    summary: `You are building a k-nearest-neighbours model with two features: **age** (0 to 100) and **annual income** (0 to 500,000). To decide who is "nearest," kNN adds up the squared differences on each feature. But look at the numbers: two people can differ by at most 100 in age, and by up to 500,000 in income. Income's differences are thousands of times larger, so they utterly dominate the sum — the age feature becomes effectively invisible. "Nearest neighbour" quietly comes to mean "most similar income," and age is ignored — not because age does not matter, but purely because it is measured in smaller units.

[FIGURE: scaling]

That is the whole problem **feature scaling** solves: put every feature on a comparable scale so none of them dominates just because of its units. The fix is to rescale each column, and there are three common ways to do it.

---

**Three scalers.**

**StandardScaler** subtracts the mean and divides by the standard deviation, so each feature ends up centred at 0 with a spread of 1. Great for roughly bell-shaped data — but sensitive to outliers: one customer earning 10 million yanks the mean and inflates the spread, squashing everyone else toward zero.

**MinMaxScaler** squeezes each feature into the range 0 to 1. Handy when the zero point matters (word counts, on/off flags), but *even more* outlier-sensitive: the one giant value becomes exactly 1.0 and everyone else is crushed near 0.

**RobustScaler** uses the *median* and the middle-50% spread instead of the mean and standard deviation. A lone 10-million earner does not budge the median, so the other 99,999 people get scaled sensibly. It is the safe default when real-but-extreme values are present.

---

**When it matters, and when to skip it.**

Scaling is essential whenever a model measures *distances* or is sensitive to feature *magnitude*: kNN, SVMs, PCA, regularised linear models, and neural networks. (For a regularised linear model the reason is fairness — the penalty judges coefficients by size, and an income coefficient is naturally tiny next to an age coefficient, so without scaling the penalty hits them unequally. For neural nets, wildly different input scales make the gradients lurch and training unstable.)

You can **skip** scaling for tree-based models — they only compare thresholds ("is income above 40,000?"), which does not care about units at all. Skip it for plain 0/1 flags too (standardising a yes/no column is meaningless).

---

**The one rule you cannot break: fit the scaler on training data only.**

Compute the mean, median, and spread from the *training* rows, then apply that same transformation to the test rows. Fit the scaler on everything at once and the test set's statistics leak into training, and your offline numbers come out flatteringly wrong. Wrap it in a pipeline so this happens automatically, every time.

---

**Sparse data: don't destroy the zeros.**

A subtle trap: **StandardScaler mean-centers**, and on a *sparse* matrix (TF-IDF text, one-hot features that are mostly zero) subtracting the mean turns all those zeros into small non-zero numbers — the matrix becomes **dense**, which can explode memory from megabytes to gigabytes. The fix is to scale *without* centering: \`StandardScaler(with_mean=False)\` or **MaxAbsScaler** (divides by the max absolute value, leaving zeros as zeros). When your features are sparse, preserving sparsity matters more than centering — never mean-center a large sparse matrix.

---

**Neural networks: scale drives training stability.**

For neural nets, scaling isn't just about fairness — it's about whether training works at all. Wildly different input scales make the **gradient magnitudes** wildly different across weights, so a single learning rate is too big for some and too small for others (the condition-number problem at the input layer). Large-magnitude inputs also push **saturating activations** (sigmoid/tanh) into their flat zones where gradients die, and make training **learning-rate-sensitive** and unstable. Standardised inputs keep gradients well-behaved from the first step — which is why scaling is effectively mandatory for neural nets, more so than the "fairness" reason for linear models.

---

**Scaling changes PCA materially — it's not cosmetic.**

PCA finds directions of maximum *variance*, so on **unscaled** data the components are dominated by whichever feature happens to have the largest units (income in dollars swamps age in years). Scale the features first and the principal components can come out **completely different** — this isn't a minor adjustment, it changes what PCA "discovers." So standardise before PCA unless you have a specific reason to let high-variance features dominate. (This is why the PCA lesson calls standardisation non-negotiable.)

---

**Sometimes scale the target, too.**

Scaling usually means the *inputs*, but for **regression and neural nets** it can help to scale the **target** as well — a target ranging in the millions produces huge losses and gradients that destabilise training, while a standardised target keeps the loss well-conditioned. The catch: you must **inverse-transform the predictions back** to the original units before computing business metrics or reporting, or your errors are in the wrong scale. Fit the target scaler on training targets only, same as any other transform.

---

**Outliers before scaling.**

RobustScaler tolerates outliers, but sometimes even it isn't enough — a handful of values many orders of magnitude out will still distort a distance metric or a neural net. Then treat the outliers *before* scaling: **winsorize** or **clip** to a sensible percentile (e.g. cap at the 99th), or apply a **log/sqrt transform** to compress a heavy right tail. The order matters — transform/clip first, then scale the tamed distribution.

---

**In practice: scale numeric columns only, inside a pipeline.**

Real datasets mix continuous and categorical/binary columns, and you don't scale them the same way. The standard tool is a **ColumnTransformer**: scale the numeric columns, one-hot/target-encode the categoricals, and leave 0/1 flags as they are — all in one object. Wrapped in a Pipeline, every transform is **fit inside each CV fold** on the training portion only, which makes the fit-on-train-only rule structural rather than something you have to remember. Scaling a one-hot column or a binary flag is meaningless; the ColumnTransformer is how you apply scaling to exactly the columns that need it.`,
    keyPoints: [
      `**Apply RobustScaler as your default for tabular data — it handles the outliers that are almost always present in real datasets better than StandardScaler, with identical code.**\n\nFor the age/income kNN example: a single 10-million income observation makes StandardScaler compress every other customer's income toward zero. RobustScaler uses the median and IQR, so that one outlier has no effect on how the other 99,999 customers are scaled. The median and IQR are computed from training data only, never from test.`,
      `**Trap: fitting the scaler on train plus test data before splitting. The scaler learns the test set's mean and standard deviation, leaking distributional information into training. Fit only on training data, transform both. Use an sklearn Pipeline to enforce this automatically.**\n\nThe failure mode: μ and σ are computed over all rows including test. Training rows are then transformed using statistics derived partly from test. The model indirectly sees the test distribution's central tendency and spread during training. Evaluation metrics are optimistically biased — the gap between offline metrics and production performance traces to this leak.`,
      `**Diagnostic: after scaling, check that all features have similar variance — near 1 for StandardScaler. If one feature still shows variance 100× the others, it contains extreme outliers that should be winsorized or log-transformed before scaling.**\n\nFor StandardScaler specifically, variance should be 1 by construction — if it is not, there are outliers so extreme that the scaler's μ and σ estimates are distorted. Switch to RobustScaler or apply a monotone transform (log, sqrt) before scaling.`,
      `**Preserve sparsity, and remember scaling is mandatory for NNs and material for PCA.**\n\nStandardScaler mean-centering turns a sparse matrix dense (memory blowup) — use \`with_mean=False\` or MaxAbsScaler to keep zeros as zeros for TF-IDF/one-hot data. For neural nets, input scale drives gradient magnitudes, activation saturation, and LR sensitivity, so scaling is effectively required, not just "fair." And PCA is variance-based, so unscaled features let the largest-unit column dominate the components — standardise before PCA or you'll discover the wrong directions. Treat extreme outliers first (winsorize/clip/log), then scale.`,
      `**Scale the right columns (and sometimes the target) inside a pipeline.**\n\nUse a ColumnTransformer to scale numeric columns, encode categoricals, and leave 0/1 flags alone — all fit inside each CV fold via a Pipeline so fit-on-train-only is structural. For regression/NN, scaling the target can stabilise the loss, but you must inverse-transform predictions back to original units before reporting metrics. Don't scale tree-model inputs or binary flags — it changes nothing for trees and is meaningless for 0/1 columns.`,
    ],
    interactivePrompt: `Before you touch the controls: if age ranges from 0 to 100 and annual income ranges from 0 to 500,000 — what does a kNN model actually learn when you do not scale the features?`,
    takeaway: `Unscaled features hand large-magnitude inputs disproportionate control over distance metrics, gradient steps, and regularization penalties — not because they are more important, but because they are measured in larger units.`,
    recap: [
      `**Unscaled features hand large-unit inputs disproportionate control** over distances, gradients, and regularization — not more importance, just bigger units.`,
      `**RobustScaler as the tabular default:** median + IQR, so one \$10M income doesn't crush every other customer toward zero like StandardScaler does.`,
      `**Fit the scaler on train only** — learning test's μ/σ leaks the test distribution into training.`,
      `**Diagnostic:** post-StandardScaler variance should be ~1; a feature still 100× others has extreme outliers — winsorize or log first.`,
      `**Preserve sparsity:** mean-centering densifies sparse matrices — use \`with_mean=False\` or MaxAbsScaler for TF-IDF/one-hot.`,
      `**Scaling is mandatory for NNs** (gradient magnitudes, activation saturation) and material for PCA (variance-based — standardise first).`,
      `**Scale the right columns via a ColumnTransformer** in a Pipeline; don't scale tree inputs or 0/1 flags — meaningless.`,
    ],
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
          `A) K-Means computes Euclidean distance. Income range = 180,000; age range = 60. A 1-year age difference contributes 1 unit to Euclidean distance; a 1,000-dollar income difference contributes 1,000 units. Income dominates so completely that age is effectively invisible — two customers same income but 30 years apart look nearly identical. Fix: standardize both features before clustering. After standardization, each feature has std=1, so 1-std differences in both features contribute equally to distance.`,
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
      {
        q: `You apply StandardScaler to a large sparse TF-IDF matrix and your job runs out of memory. Why, and what's the fix?`,
        options: [
          `A) StandardScaler is just slow on large matrices; the fix is to use more RAM or a smaller vocabulary.`,
          `B) StandardScaler subtracts the mean (mean-centering), which turns the matrix's many zeros into small non-zero values — the sparse matrix becomes dense, exploding memory. The fix is to scale without centering: StandardScaler(with_mean=False), or use MaxAbsScaler, both of which leave zeros as zeros and preserve sparsity.`,
          `C) TF-IDF values are already scaled, so applying StandardScaler double-scales them and corrupts the matrix — remove the scaler entirely.`,
          `D) The fix is to convert the sparse matrix to dense first, which uses less memory than sparse scaling.`,
        ],
        answer: `B`,
      },
      {
        q: `You're training a neural network to predict house prices that range up to several million. Training is unstable and the loss occasionally explodes. Beyond scaling the inputs, what else should you consider, and what must you not forget?`,
        options: [
          `A) Nothing else — only input scaling affects neural network training, so scale the inputs and the instability will disappear.`,
          `B) Scale the target too. A target in the millions produces huge losses and gradients that destabilise training, so standardising the target keeps the loss well-conditioned. The thing you must not forget: inverse-transform the model's predictions back to the original dollar scale before computing or reporting any error metric, and fit the target scaler on training targets only.`,
          `C) Switch to a tree model, since neural networks can never handle large-valued targets regardless of scaling.`,
          `D) Multiply the learning rate by the target's maximum value to compensate, leaving the target unscaled.`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      scaling: `<svg viewBox="0 0 380 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:380px;font-family:var(--font-sans,sans-serif)">
  <text x="20" y="20" fill="var(--ink-hi)" font-size="10" font-weight="700">before scaling</text>
  <text x="30" y="45" fill="var(--ink-low)" font-size="9">age</text>
  <rect x="90" y="36" width="16" height="12" rx="2" fill="var(--prime)" opacity="0.7"/>
  <text x="30" y="67" fill="var(--ink-low)" font-size="9">income</text>
  <rect x="90" y="58" width="270" height="12" rx="2" fill="var(--prime)"/>
  <text x="20" y="88" fill="var(--ink-low)" font-size="8">distance is basically all income — age is invisible</text>
  <line x1="20" y1="100" x2="360" y2="100" stroke="var(--rim)" stroke-width="1"/>
  <text x="20" y="122" fill="var(--ink-hi)" font-size="10" font-weight="700">after scaling</text>
  <text x="30" y="147" fill="var(--ink-low)" font-size="9">age</text>
  <rect x="90" y="138" width="150" height="12" rx="2" fill="var(--prime)" opacity="0.85"/>
  <text x="30" y="169" fill="var(--ink-low)" font-size="9">income</text>
  <rect x="90" y="160" width="150" height="12" rx="2" fill="var(--prime)" opacity="0.85"/>
  <text x="252" y="162" fill="var(--ink-low)" font-size="8">both count equally</text>
</svg>`,
    },
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
    summary: `You are building a fraud detector. In your data there are 999 legitimate transactions for every 1 fraud. You train a model, it scores **99.9% accuracy**, and your stakeholder is thrilled. You should not be — because a "model" that simply labels *everything* legitimate, learning nothing and looking at no features at all, *also* scores 99.9%. Accuracy is measuring the wrong thing: how often you agree with the majority class, which you can ace by ignoring the rare class entirely.

The rare class is not a flaw in your data — fraud genuinely *is* rare. The trouble is how ordinary training reacts to it. The loss adds up mistakes across all examples, and with 999 legit transactions per fraud, getting the legit ones right dominates the total 999-to-1. The gradient points almost entirely away from fraud, so the model learns to shrug it off. There are three places to fix this, at three points in the pipeline.

---

**Fix 1 — reweight the loss (start here).**

The cleanest first move is **class weights**: tell the loss that a mistake on a fraud example counts as much as roughly 999 mistakes on legit ones (set \`class_weight='balanced'\`, or \`scale_pos_weight\` in XGBoost). Now the rare class pulls on the gradient as hard as the common one. No data added or removed — just a reweighted loss.

---

**Fix 2 — manufacture more minority examples (SMOTE), carefully.**

**SMOTE** takes a different tack: it invents new fraud examples by interpolating *between* real ones in feature space — pick two nearby frauds and drop a synthetic fraud on the line between them. This gives the model a denser minority region to learn a boundary from. But it has a real failure mode: when fraud and legit heavily *overlap*, interpolating between two frauds can plant a synthetic "fraud" right in the middle of legit territory — a contradictory, misleading training point. So SMOTE is not a default; it shines mainly when the minority class is genuinely sparse (a few hundred examples), and it needs care when the classes mix.

---

**Fix 3 — move the decision threshold.**

This one does not touch training at all. A classifier outputs a *probability*; turning it into a yes/no needs a **threshold**, and the default 0.5 is almost never right here. If a missed fraud costs 10,000 and a false alarm costs 50 in review time, you should flag on much weaker suspicion — a threshold of 0.15 or 0.2, not 0.5. The threshold is a *business-cost* decision, not a modeling one: plot precision against recall across thresholds and pick the point that minimises your expected cost.

---

**And above all: stop reporting accuracy.**

The deepest fix is the metric itself. On imbalanced data, use **precision, recall, and PR-AUC**, which actually measure how you do on the rare class. Even ROC-AUC can read a flattering 0.97 while the model catches almost no fraud, because the huge pile of true negatives swamps its denominator. Accuracy on an imbalanced problem is not a partial truth — it is actively misleading.

---

**The fuller metric menu.**

Precision/recall/PR-AUC are the start; know the rest so you can pick the honest single number. **Balanced accuracy** (average recall across classes) doesn't reward always-predict-majority. **MCC** (Matthews correlation) uses all four confusion cells and is often the best single summary under imbalance. **Macro/micro/weighted F1** average per-class F1 differently (macro treats classes equally, weighted by size). **Specificity** (TNR) and the **FPR/FNR** matter when the cost of each error type differs. And when action is capacity-limited — a fraud team reviews the top K — **precision@K**, **recall@K**, and **lift@K** are the right frame, because the model only has to rank the worst cases to the top.

---

**A fair word on ROC-AUC — and how resampling breaks calibration.**

ROC-AUC isn't *useless* under imbalance — it's a valid ranking metric — but it's **misleading** because the huge true-negative pile keeps FPR tiny, so it can read 0.97 while precision is terrible; PR-AUC is usually more informative for rare positives. A subtler cost: **class weighting and resampling distort probability calibration.** Both change the class balance the model trains on, so its predicted probabilities come out too high for the minority class. If you need real probabilities (for cost-based thresholds), **recalibrate** afterward (Platt or isotonic) and check the reliability curve — the ranking may be fine while the numbers lie.

---

**Validating rare events.**

With few positives, careless validation is noise. Use **stratified** splits so every fold holds enough positives (a random split can leave a fold with almost none), prefer **repeated cross-validation** to average out the high variance of a single split, and put **confidence intervals** around recall and precision — "recall 0.8" on 20 positives has an enormous interval. For fraud and any time-ordered data, use a **temporal split** (train on the past, test on the future), because a random split lets the model peek across the fraud timeline.

---

**Sampling alternatives, and losses built for imbalance.**

Beyond plain class weights and vanilla SMOTE, know the toolkit: **random undersampling** (drop majority examples — fast, throws away data), **random oversampling** (duplicate minority — risks overfitting), the **SMOTE + cleaning** hybrids **SMOTE-Tomek** and **SMOTE-ENN** (oversample then remove the confusing points near the boundary), **focal loss** (down-weights easy majority examples so training focuses on the hard minority — popular in detection), and **balanced random forests** (each tree trained on a balanced bootstrap). Match the tool to the model and the imbalance severity rather than reaching for SMOTE reflexively.

---

**The cost-sensitive formula, made explicit.**

"Pick the threshold from costs" has an exact form. Write the per-error costs and choose the threshold that minimises **expected cost = FP·cost_FP + FN·cost_FN** over the validation set (a true-positive/true-negative usually costs 0). Equivalently, when there's a hard **review capacity**, set the threshold to fill that queue with the highest-risk cases (precision@K). This turns "which threshold?" from a guess into an optimisation against numbers you can write down.

---

**In production, imbalance keeps moving.**

Rare-event models need specific monitoring. Track **alert volume** (a spike means the model or the base rate shifted), **precision drift** (are the flags still real?), and **base-rate drift** (the fraud rate itself changes, which silently moves precision even if the model is unchanged). Account for **delayed labels** (confirmation arrives weeks later) and **review capacity**, and close the loop by **retraining on confirmed cases** as they come in. And at **extreme imbalance** (1:10,000+), stop treating it as one classifier: use a **two-stage** system — a high-recall candidate generator narrows millions to a manageable pool, then a precision-focused ranker or human-review queue orders that pool. Extreme rarity is a systems-design problem, not a loss-function tweak.`,
    keyPoints: [
      `**Use cost-sensitive training as your first move on any imbalanced tabular problem.** Set class_weight='balanced' in sklearn or scale_pos_weight in XGBoost. This requires no data modification, carries no SMOTE-before-split leakage risk, and integrates cleanly into cross-validation. Reserve SMOTE for cases where the minority class is so sparse that the model literally cannot learn its decision boundary — roughly, fewer than a few hundred minority examples in training.`,
      `**The most common production trap: applying SMOTE to the full dataset before the train-test split.** Synthetic minority samples are generated by interpolating between real minority examples. If those real examples are in both train and test, the synthetic samples are geometrically close to test-set points. The test set is contaminated with structure derived from training data. Evaluation looks strong; production collapses. Always split on real data first, then apply SMOTE only inside the training fold.`,
      `**Diagnose your model with a precision-recall curve, not a single threshold.** Plot precision vs. recall across all possible thresholds. The shape of the curve tells you how the tradeoff behaves at your operating point. Then compute the business cost at each threshold — multiply false negative count by the cost of a missed fraud, false positive count by the cost of a false review — and pick the threshold that minimizes total expected cost. A model with recall 0.9 and precision 0.3 may be exactly right if the cost asymmetry is 200:1 in favor of catching fraud.`,
      `**Know the full metric menu and that resampling breaks calibration.**\n\nBeyond precision/recall/PR-AUC: balanced accuracy, MCC (best single number under imbalance), macro/micro/weighted F1, specificity, FPR/FNR, and precision@K/recall@K/lift@K when action is capacity-limited. ROC-AUC isn't useless but is misleading under rare positives (huge TN pile keeps FPR tiny) — prefer PR-AUC. Crucially, class weighting and resampling shift the training class balance and inflate minority probabilities, so recalibrate (Platt/isotonic) and check the reliability curve if you need real probabilities.`,
      `**Validate rare events carefully, pick the sampling tool deliberately, and monitor drift.**\n\nUse stratified splits (enough positives per fold), repeated CV, confidence intervals on recall/precision, and temporal splits for fraud. Beyond class weights and SMOTE: random under/oversampling, SMOTE-Tomek/SMOTE-ENN (oversample then clean the boundary), focal loss (down-weight easy majority examples), and balanced random forests. Choose the threshold by minimising expected cost = FP·cost_FP + FN·cost_FN (or to fill review capacity). In production, monitor alert volume, precision drift, and base-rate drift, handle delayed labels, and at 1:10,000+ use a two-stage high-recall-then-precision pipeline.`,
    ],
    takeaway: `Accuracy on an imbalanced dataset measures how well the model predicts the majority class — which it can do by ignoring minority examples entirely. The fix starts with the metric, then the loss function, then the decision threshold. Resampling is a last resort, not a default.`,
    recap: [
      `**Accuracy measures the majority class** — a model can hit 99% by ignoring the minority entirely.`,
      `**Fix order:** the metric first, then the loss function, then the decision threshold. Resampling is a last resort, not a default.`,
      `**Cost-sensitive training is the first move:** \`class_weight='balanced'\` / \`scale_pos_weight\` — no data change, no leakage, clean in CV.`,
      `**SMOTE-before-split leaks:** synthetic points interpolated from real minority rows land near test points. Split first, SMOTE inside the train fold only.`,
      `**PR curve over a single threshold;** pick the threshold that minimizes expected cost = FP·cost_FP + FN·cost_FN.`,
      `**Metric menu:** PR-AUC over ROC-AUC under rare positives; MCC as best single number; precision@K when action is capacity-limited. Resampling breaks calibration — recalibrate.`,
      `**Extreme imbalance (1:10,000+) is a systems problem:** two-stage high-recall candidate generator → precision ranker/human review.`,
    ],
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
          `B) Depends entirely on the relative cost of false negatives vs. false positives in deployment context. Higher recall (0.9) catches 50% more actual fraud. Lower precision (0.3) means more false positives. If each fraud costs 5,000 dollars uncaught and each false positive triggers a 50-dollar manual review, threshold 0.2 is likely right. The decision cannot be made from numbers alone without knowing the business cost ratio — compute expected cost at each threshold and choose the minimum.`,
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
      {
        q: `You fix imbalance with class weighting, and the model's ranking (PR-AUC) is excellent, but downstream cost-based thresholding behaves oddly because the predicted probabilities seem systematically too high for the fraud class. What happened, and what do you do?`,
        options: [
          `A) Nothing is wrong — class weighting never affects predicted probabilities, so the thresholding logic must have a bug.`,
          `B) Class weighting (like resampling) changes the effective class balance the model trains on, so its predicted probabilities are distorted — inflated for the minority class — even when the ranking is fine. If you need calibrated probabilities for cost-based thresholds, recalibrate after training (Platt or isotonic scaling on a held-out set) and check the reliability curve, or correct the prior back to the true base rate. Ranking metrics like PR-AUC won't reveal this because they're threshold-free.`,
          `C) Switch from class weighting to accuracy as the metric, which will make the probabilities correct.`,
          `D) The probabilities are fine; the real fix is to always use a 0.5 threshold regardless of costs.`,
        ],
        answer: `B`,
      },
      {
        q: `You have a 1:50,000 imbalance (a few hundred positives in tens of millions of rows) and single-classifier approaches keep failing. What overall design and validation approach fits?`,
        options: [
          `A) Just crank class_weight higher and higher until a single classifier separates the classes — extreme imbalance is always solvable with a large enough weight.`,
          `B) At this rarity, treat it as a systems problem: a two-stage pipeline where a high-recall candidate generator narrows the tens of millions to a manageable pool, then a precision-focused ranker or human-review queue orders that pool (optimising precision@K against review capacity). Validate with stratified and temporal splits, repeated CV, and confidence intervals on recall/precision since a few hundred positives give noisy estimates — and monitor base-rate and precision drift in production, retraining on confirmed cases.`,
          `C) Randomly undersample the majority down to 1:1 and train a single logistic regression — this fully solves extreme imbalance with no downsides.`,
          `D) Report accuracy, which at 1:50,000 will be near 100% and prove the model works.`,
        ],
        answer: `B`,
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
    summary: `You are predicting hospital readmission from records of 5,000 patients — and some patients appear many times, once per visit. You do a normal random 80/20 split, train, and get **91% validation accuracy**. You ship it. Production accuracy: **73%.** Nothing errored. Where did 18 points go?

Here is the leak. Patient 147 has twelve visits in your data. The random split scattered ten of them into training and two into validation. So during training the model memorised patient 147 — their exact labs, age, history — and when it "predicted" their two validation visits, it was not generalising to a new patient at all; it was recognising someone it had already studied. Your validation score was partly measuring *memorisation*, and memorisation does not exist in production, where every patient is new. This is **leakage**: information from the evaluation set sneaking into training. It fires no error, the metrics look great, and the model fails on real data. It comes in four flavours.

[FIGURE: leakage_types]

---

**Group leakage — the same entity on both sides.**

That was patient 147: related rows (same patient, user, or household) split across train and test, so the test set is not truly independent. The fix is a **group split** — every row from a given patient goes entirely to one side, so validation always contains patients the model has never seen.

---

**Temporal leakage — training on the future.**

With time-ordered data, a random split lets the model train on March to predict January — the reverse of reality, where you never have tomorrow's data today. The fix is a **time cutoff**: train on everything before a date, validate on everything after.

---

**Preprocessing leakage — the quiet one.**

Fit a scaler (or imputer, or encoder) on all 5,000 records *before* splitting, and its mean and spread were computed partly from the validation rows — so the training transform is tainted by the data you are supposed to be judging on. Fit every transformer on the *training* data only, then apply it to validation. A pipeline enforces this so you do not have to remember.

---

**Feature leakage — the answer hiding in a column.**

A feature like "rehospitalised_within_30_days" on a readmission-prediction row *is the label wearing a disguise* — it could only be known after the outcome. Any feature that needs knowledge of the future is unavailable at prediction time. The classic tell: a single new feature makes accuracy jump 15 points. Real features never do that.

---

The through-line: a held-out test set alone does not save you. If a feature was built using future information — even for rows that ended up in *training* — the model learned a pattern that will not exist once it is deployed. Real protection is structural: split *before* fitting anything, judge only on data the model never touched, and check every feature for whether you would actually have it at prediction time.

---

**Duplicates and near-duplicates leak too.**

Group leakage's cousin: **exact or near-duplicate rows** split across train and test. The same product listing scraped twice, the same image at two resolutions, an **augmented copy** of a training example, the same document under two IDs — any of these landing on both sides means the model is tested on something it effectively trained on. Deduplicate (and near-deduplicate on a similarity key) *before* splitting, and make sure augmentation happens *after* the split so an original and its augmentations never straddle the boundary.

---

**The target-leakage taxonomy is bigger than one column.**

"A feature that is the label in disguise" comes in several forms worth naming: **post-outcome features** (computed after the event), **label-derived features** (a transform of the target), **proxy labels** (an innocent column that's a near-perfect stand-in, like a case-ID range that encodes the outcome), **aggregation-window leakage** (a rolling stat whose window reaches past the prediction time), and **future-window leakage** (any feature summarising events after T). The audit question is always the same — *would this exact value exist at prediction time, knowing nothing about the future?* — but the disguises are many.

---

**Test-set reuse and nested CV.**

Leakage isn't only about features — it's also about *decisions*. Every time you tune against the same validation/test set — trying architectures, thresholds, feature sets and keeping whatever scores best — you leak your own choices into it, and the reported number drifts optimistic (you've overfit to the test set through the back door). Guard it: touch the test set once, at the very end. And when you tune hyperparameters or features aggressively, use **nested cross-validation** — an outer loop for the honest estimate, an inner loop for all the tuning — so the reported score reflects data the selection never saw.

---

**Time-series CV: windows, gaps, backtesting.**

A single time cutoff is the start; robust temporal validation has more structure. **Expanding-window** CV trains on all history to date and tests the next slice (more data, stable relationships); **sliding-window** trains on a fixed recent span (better under drift). Add a **gap/embargo** between train and test so rolling-window features can't bleed across the boundary. And **backtest across multiple cutoffs** rather than one — a strategy that works at one date and fails at three others isn't real. One split is an anecdote; a backtest is evidence.

---

**Match the split to the production question.**

The split should mirror what you'll actually predict. Deploying to **new users**? Split by user (group split). Predicting **new sessions** for existing users? Split by session. Scoring **new transactions**, **new products**, or **future events**? Split accordingly — by transaction, by product, or temporally. The distinction between **entity-level** and **event-level** deployment decides the split: if production always sees brand-new entities, your validation must too, or your number answers a question you'll never be asked.

---

**Feature selection leaks, and features must survive to serving.**

Two final structural traps. **Selection leakage**: correlation filtering, mutual-information ranking, PCA, RFE, and any *target-based* feature selection must happen **inside** the CV folds — pick features using the full data before splitting and you've let the test set influence which features exist. And **production parity**: every feature you keep must be *computable at prediction time* with the same freshness, latency, and timestamp constraints as offline — a feature that's trivial to compute over historical tables but unavailable (or stale) in the real-time path is a leak that only surfaces after deployment.`,
    keyPoints: [
      `**Use group-based splits whenever examples share an entity — patient, user, household, time series.** A random split on a medical dataset with ten records per patient puts the same patient in both train and test; validation measures how well the model memorizes patients, not how well it generalizes to new ones. Group k-fold assigns all of a given patient's records to a single fold. This is non-negotiable if entity-level generalization is what you are deploying for.`,
      `**The most common production trap: fitting preprocessing transformers outside the cross-validation loop.** Fitting a StandardScaler or SimpleImputer before the loop means its statistics were computed on data that includes every validation fold. Each fold's validation data contaminated the scaler. The correct order: inside each fold, fit all transformers on the training portion, apply fitted transformers to validation. Use sklearn Pipeline to make this structurally impossible to get wrong.`,
      `**Diagnose leakage with a feature correlation audit and a single-feature accuracy test.** Before training on a new feature: (1) check its correlation with the target — above 0.8 on a complex real-world problem is suspicious; (2) train a model using only that single feature and check accuracy — suspiciously high single-feature performance often indicates label derivation; (3) verify the feature's computation timestamp is strictly before the label timestamp in your data pipeline. A feature that causes a 15+ point accuracy jump in isolation is almost certainly leaking.`,
      `**Deduplicate before splitting, expand the target-leakage taxonomy, and don't reuse the test set.**\n\nExact/near-duplicate rows (rescraped listings, augmented copies, same doc under two IDs) split across folds leak like group leakage — dedupe first and augment after the split. Target leakage includes post-outcome features, label-derived features, proxy labels, and aggregation/future-window leakage, all caught by "would this value exist at prediction time?" And test-set reuse is decision leakage: tuning repeatedly against the same set drifts the metric optimistic, so touch test once and use nested CV when tuning aggressively.`,
      `**Do temporal CV properly, match the split to deployment, and select features inside folds.**\n\nUse expanding or sliding windows with a gap/embargo and backtest across multiple cutoffs, not one. The split must mirror the production question — new users → group split, new sessions → session split, future events → temporal split (entity-level vs event-level deployment decides it). Feature selection (correlation/MI/PCA/RFE/target-based) must run inside CV folds, and every kept feature must be computable at serving time with the same freshness and timestamp constraints or it's a leak that surfaces only after deploy.`,
    ],
    takeaway: `Leakage fires no error and produces no warning — the model trains cleanly, metrics are excellent, and the system ships. It fails when real data arrives. The only protection is structural: enforce the split before any transformer is fit, audit every feature for temporal validity, and never reuse the test set.`,
    recap: [
      `**Leakage fires no error:** the model trains cleanly, metrics look excellent, it ships — and fails on real data.`,
      `**Match the split to deployment:** new users → group split, new sessions → session split, future events → temporal split.`,
      `**Group-split shared entities** (patient, user, household) — a random split with 10 rows/patient measures memorization, not generalization.`,
      `**Fit preprocessing inside each CV fold** on the training portion only; use a Pipeline so it's structurally impossible to get wrong.`,
      `**Dedupe before splitting** — exact/near-duplicate rows across folds leak like group leakage; augment after the split.`,
      `**Target-leakage test:** "would this value exist at prediction time?" catches post-outcome, label-derived, proxy, and future-window features.`,
      `**Never reuse the test set** — repeated tuning drifts the metric optimistic; touch test once, use nested CV when tuning hard.`,
    ],
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
      {
        q: `You aggressively tune hyperparameters and select features by repeatedly checking performance on the same held-out set, then report that set's score as your final number. Why is it optimistic, and what's the fix?`,
        options: [
          `A) It's not optimistic — a held-out set is immune to overfitting no matter how many times you evaluate on it.`,
          `B) Repeatedly making choices (architectures, thresholds, feature sets) based on the same set leaks your decisions into it — you gradually overfit to that set through model selection, so its score drifts above true performance (decision leakage). Fix: touch the final test set only once, and when tuning aggressively use nested cross-validation — an inner loop for all tuning and an outer loop that estimates performance on data the selection never saw.`,
          `C) The score is optimistic only if the held-out set is small; making it larger removes the need to limit how often you evaluate.`,
          `D) The fix is to report training accuracy instead, which is never affected by test-set reuse.`,
        ],
        answer: `B`,
      },
      {
        q: `You augment your image training set (rotations, crops) and also deduplicate, but do both before the train/validation split. Why can this still leak, and what's the correct order?`,
        options: [
          `A) It can't leak — augmentation and deduplication are preprocessing steps that are always safe to do before splitting.`,
          `B) Augmenting before the split means an original image and its rotated/cropped copies can land on opposite sides, so the validation set contains near-duplicates of training images and the model is effectively tested on what it trained on. Similarly, near-duplicate originals split across folds leak. Correct order: deduplicate (and near-deduplicate) first, split by original image (a group split so all copies of one image stay on one side), and augment only the training portion after the split.`,
          `C) The leak comes only from the crops, not the rotations, so cropping should be removed while keeping rotation augmentation before the split.`,
          `D) There's no real fix — image augmentation always leaks, so you must never augment image data.`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      leakage_types: `<svg viewBox="0 0 360 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">group leakage: the same patient on both sides</text>
  <rect x="20" y="34" width="150" height="80" rx="6" fill="none" stroke="var(--prime)" stroke-width="1.5"/>
  <text x="95" y="52" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">train</text>
  <rect x="190" y="34" width="150" height="80" rx="6" fill="none" stroke="var(--prime)" stroke-width="1.5"/>
  <text x="265" y="52" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">test</text>
  <g fill="var(--ink-low)" opacity="0.6">
    <circle cx="45" cy="75" r="6"/><circle cx="70" cy="90" r="6"/><circle cx="120" cy="72" r="6"/><circle cx="145" cy="95" r="6"/><circle cx="95" cy="100" r="6"/>
    <circle cx="215" cy="80" r="6"/><circle cx="290" cy="92" r="6"/><circle cx="315" cy="72" r="6"/>
  </g>
  <circle cx="95" cy="75" r="7" fill="var(--amber)"/><text x="95" y="79" text-anchor="middle" fill="#000" font-size="8" font-weight="700">147</text>
  <circle cx="255" cy="80" r="7" fill="var(--amber)"/><text x="255" y="84" text-anchor="middle" fill="#000" font-size="8" font-weight="700">147</text>
  <path d="M102,72 C 150,55 210,60 248,76" fill="none" stroke="var(--amber)" stroke-width="1.3" stroke-dasharray="4,3"/>
  <text x="180" y="140" text-anchor="middle" fill="var(--ink-low)" font-size="9">the model recognises patient 147 — it does not generalise</text>
</svg>`,
    },
  },
  {
    id: 'feature_selection',
    title: 'Feature Selection',
    subtitle: `Reduce dimensionality to fight overfitting, cut training cost, and build models that generalize.`,
    difficulty: 'intermediate',
    estimatedMin: 45,
    tags: ['feature selection', 'curse of dimensionality', 'LASSO', 'RFE', 'mutual information', 'multicollinearity'],
    summary: `A data warehouse dumps **500 features** into your fraud model — transaction details, user behaviour, device fingerprints, merchant info, and hundreds of derived aggregates. Training on all 500 takes four hours, inference crawls at 900ms per request, and the serving box runs out of memory. You need to get under 50 features. But *which* 50?

There are four families of ways to choose, trading speed for smartness — and one trap that snares all of them.

---

**Filter methods — score each feature alone.**

The fastest approach ranks each feature on its own — how strongly does it relate to fraud, by correlation or mutual information — and keeps the top ones. Cheap and parallel. The catch is baked in: it judges features *one at a time*, so it will happily throw away two features that are useless alone but powerful *together*. Interactions are invisible to it.

---

**Wrapper methods — let the model judge.**

These actually train the model on different feature subsets and keep whichever scores best. **Recursive feature elimination** trains on all 500, drops the single weakest, retrains, and repeats down to 50 — around 450 model fits, but every decision is *model-aware*, so it can tell when two features are redundant given the others.

---

**Embedded methods — select while training.**

**L1 (Lasso)** regularisation drives useless features' weights to exactly zero *during* fitting, so selection and training happen in one run — no separate step. (Ridge/L2 shrinks weights toward zero but almost never all the way, so it does not select.)

---

**Permutation importance — the honest referee.**

Train any model, then *shuffle* one feature's values and see how much performance drops on held-out data. A big drop means the feature was pulling its weight; no drop means it was redundant or noise. This is the method to trust, because it measures real, out-of-sample usefulness — and it catches a nasty trap that tree-based importance falls into. That trap: a tree's built-in importance is biased toward *high-cardinality* columns. Feed it a \`customer_id\` and it will "split" on individual IDs to memorise the training set, scoring the ID as hugely important — while on new customers it is worth exactly nothing. Permutation importance on validation data exposes this instantly (shuffling the ID changes nothing), where the tree's own numbers are fooled.

---

**The trap that snares all four: correlation is not importance.**

It is tempting to say "these two features are 95% correlated, drop one." Resist it. Two correlated features can still both help — keeping both can make the model steadier when one of them drifts at serving time. Correlation describes the *inputs*; it does not tell you the *predictive contribution*. So decide what to keep by measuring importance directly — permutation importance on validation data — not by eyeballing a correlation matrix.

---

**Selection is preprocessing — do it inside the CV folds.**

The trap that quietly inflates every method above: **feature selection uses the labels, so it leaks if done on the full data before splitting.** Rank features by correlation/MI/importance across the whole dataset, then cross-validate, and the "held-out" folds already helped choose the features — your score is optimistic. Selection (filter, wrapper, embedded, RFE, target-based) must run **inside each CV fold** on the training portion only, exactly like a scaler or encoder. Wrap it in a Pipeline so it can't be skipped.

---

**Is the selection stable?**

A feature set from one run can be a fluke of that sample. **Stability selection** reruns the choice across bootstraps or folds and keeps only the features chosen *consistently* — a feature that appears in 90% of runs is real signal, one that flickers in and out is noise dressed as signal. This matters most with **correlated features**, where which one gets picked can flip run to run (Lasso is notorious for this). Stable selections generalise; one-run selections often don't.

---

**Caveats on the tools you'll reach for.**

**Mutual information** catches non-linear dependence (unlike correlation) but as usually applied is **univariate** (misses features that only matter in combination) and is noisy and **sample-size/binning sensitive**. **SHAP** attributes predictions well but **splits credit among correlated features** (a truly important feature can look weak because its twin absorbed the attribution) and shows what the *model* used, **not causation** — high SHAP ≠ causal. **Embedded tree selection** isn't just "use importance": the tree's own knobs (\`min_child_weight\`, \`gamma\`, \`max_depth\`, \`colsample_bytree\`, feature subsampling) *are* a form of regularised selection, pruning weak features during training. Read all of them with the correlation caveat.

---

**Selection versus reduction, and the cost you forget.**

Keep **feature selection** (keeps a subset of your *original, explainable* features) separate from **dimensionality reduction** like PCA (invents new latent components — compact but no longer interpretable). Choose selection when you must explain the model, reduction when you only need fewer numbers. And selection isn't only about accuracy: weigh the **operational cost** of each feature — its serving **latency**, **freshness** requirements, **compute** cost, upstream **data-dependency risk**, and whether it's even **available** at prediction time. A feature that adds 0.1% AUC but depends on a flaky third-party call at serving time is usually not worth keeping. Finally, on **redundancy**: correlated features can actually *help stability* (keep both as insurance against drift), but genuine **duplicates, proxies, and leaky features** should still be removed.`,
    keyPoints: [
      `**Use L1 regularization as your default feature selector for linear models — it zeros vestigial weights during training, giving you feature selection for free without a separate selection step.**\n\nFor the 500-feature fraud dataset: L1 on a logistic regression will drive most of the 450+ redundant or noisy features to exactly zero during a single training run. You get a sparse model with a built-in audit trail of which features are nonzero. No separate RFE pipeline needed.`,
      `**Trap: computing feature importance on the training set. Training-set importance reflects memorization; use a held-out validation set or permutation importance on the same evaluation data used for model selection.**\n\nA tree trained on 500 features will assign high importance to features it memorized in training — including unique identifiers and near-duplicate features. Permutation importance on validation data measures whether shuffling the feature actually hurts predictive performance on unseen examples. These two rankings regularly disagree by large margins.`,
      `**Diagnostic: if removing the bottom 50% of features by importance hurts validation AUC by less than 0.5 points, those features were vestigial. If it hurts by more than 2 points, the importance ranking is likely wrong — the features are correlated and removing one changed others' apparent importance.**\n\nThis threshold test takes one additional evaluation run and tells you whether you have a clean selection or a collinearity problem. If the second case applies, switch from marginal importance ranking to permutation importance or SHAP values, which account for feature interactions.`,
      `**Selection uses the labels, so do it inside the CV folds and check stability.**\n\nRanking features on the full dataset before splitting leaks the held-out folds into the choice and inflates your score — run filter/wrapper/embedded/target-based selection inside each fold on the training portion only, in a Pipeline. And a one-run selection can be a fluke: stability selection reruns the choice across bootstraps/folds and keeps features chosen consistently (in ~90% of runs), which matters most with correlated features where the pick flips run to run (Lasso especially).`,
      `**Read the tools' caveats, separate selection from PCA, and weigh operational cost.**\n\nMutual information catches non-linearity but is univariate and sample-size-sensitive; SHAP splits credit among correlated features and shows model use, not causation; tree knobs (min_child_weight, gamma, colsample) are themselves regularised selection. Keep feature selection (subset of original, explainable features) separate from PCA (new uninterpretable components). And select on more than accuracy — serving latency, freshness, compute, data-dependency risk, and availability at prediction time all count; correlated features can aid stability, but duplicates/proxies/leaky features must go.`,
    ],
    interactivePrompt: `Before you touch the controls: you have 500 features and need to cut to 50 — before running any selection algorithm, what is the one thing you should check that could make your importance rankings unreliable?`,
    takeaway: `Feature selection is a bias-variance decision: too many features and the model memorizes noise; too few and it misses signal — and because correlation is not importance, the right ranking method matters as much as the threshold.`,
    recap: [
      `**Feature selection is a bias-variance decision:** too many features memorize noise, too few miss signal — and correlation is not importance.`,
      `**L1 as the default selector for linear models:** it zeros vestigial weights during training — selection for free, with a sparse audit trail.`,
      `**Importance on train reflects memorization** (IDs, near-duplicates rank high) — use held-out permutation importance instead.`,
      `**Threshold test:** dropping the bottom 50% costs <0.5 AUC → vestigial; >2 AUC → collinearity is fooling the ranking, switch to permutation/SHAP.`,
      `**Selection uses the labels** — run it inside CV folds on the training portion, and check stability across bootstraps (Lasso picks flip run to run).`,
      `**Tool caveats:** mutual info is univariate + sample-sensitive; SHAP splits credit among correlated features and shows use, not causation.`,
      `**Select on more than accuracy:** serving latency, freshness, compute, data-dependency risk, availability — a flaky 0.1%-AUC feature isn't worth it.`,
    ],
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
      {
        q: `You rank all 500 features by mutual information with the target on the full dataset, keep the top 50, then run cross-validation and report the CV score. Why is that score optimistic?`,
        options: [
          `A) It isn't — mutual information is unsupervised, so ranking on the full dataset can't leak.`,
          `B) Feature selection used the labels of the whole dataset, including the rows that later serve as CV validation folds — so those held-out folds already helped choose which features exist, and the model is partly evaluated on data that influenced its feature set. That's selection leakage, and it inflates the CV score. The fix is to run the MI ranking (and any target-based selection) inside each CV fold on the training portion only, e.g. inside a Pipeline.`,
          `C) The score is optimistic only because 50 features is too few; keeping 100 would remove the bias.`,
          `D) Mutual information is the wrong metric; switching to correlation and keeping the same procedure removes the optimism.`,
        ],
        answer: `B`,
      },
      {
        q: `A feature adds a genuine but tiny 0.1% AUC improvement, but computing it at serving time requires a call to a flaky third-party API with 300ms latency. A colleague insists on keeping it "because it helps." How should you frame the decision?`,
        options: [
          `A) Keep it — any feature that improves validation AUC should always be included regardless of anything else.`,
          `B) Feature selection isn't only about accuracy: weigh each feature's operational cost — serving latency, freshness, compute, upstream data-dependency risk, and availability at prediction time. A 0.1% AUC gain that adds 300ms and a flaky external dependency usually fails a cost-benefit test, since the dependency risk and latency can hurt the product far more than the tiny accuracy gain helps. Drop it unless the 0.1% is business-critical and the dependency can be made reliable.`,
          `C) Keep it but cache the API response for a week, which eliminates all dependency and freshness concerns for any feature.`,
          `D) The decision is purely statistical — if the 0.1% gain is significant at p<0.05, keep the feature; operational cost is not a modeling concern.`,
        ],
        answer: `B`,
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
    summary: `You trained a recommendation model on January user data and shipped it in March. By May, engagement is down **30%**. No error, the API responds, the model happily returns predictions. They are just *wrong*. Welcome to **distribution shift** — the quiet killer of production models, and the reason "it worked in testing" is never the end of the story.

Here is the trap that makes it so dangerous: **the model never tells you it is lost.** A confidence score measures how far an input sits from the model's decision boundary — *not* how far that input sits from anything the model was trained on. So a user unlike anyone in training can still get a *high-confidence* prediction that happens to be completely wrong. You do not find out from the model. You find out weeks later, when the real engagement numbers arrive.

The world can shift in three different ways, and telling them apart decides whether you need a five-minute fix or a two-week data effort.

[FIGURE: shift_types]

---

**Covariate shift — the inputs move.**

The *kinds of users* changed (a February product change brought new behaviour), but the underlying rule linking behaviour to engagement still holds. Your old labels are still correct; you just have fewer training examples that look like today's users. This one you can sometimes patch *without* retraining, by **importance weighting** — lean harder on the training examples that resemble current traffic and less on the ones that do not.

---

**Concept drift — the rule itself moves (the bad one).**

Now the *meaning* of the features changed. Fraudsters in 2024 have learned to make fraudulent transactions look legitimate, so a pattern that screamed "fraud" in your training data now looks perfectly innocent. Reweighting old data cannot save you — the old labels are simply *wrong* about today's world. There is no shortcut: you need **fresh labelled data and a retrain.**

---

**Prior shift — just the mix changes (the easy one).**

The fraud *rate* rose from 0.1% to 0.3%, but fraud itself still looks the same. Here you can adjust the model's outputs by re-estimating the new class balance — no retrain required.

---

**You cannot fix what you cannot see.**

All of this is invisible without monitoring, so detection has to come *before* diagnosis. Watch each important feature's distribution against its training baseline — a common gauge is **PSI** (population stability index): under 0.1 is calm, over 0.2 says "go investigate." Watch the *prediction* distribution too; if it drifts while the inputs look stable, that is a fingerprint of concept drift. And a neat trick to confirm covariate shift: train a quick classifier to tell "training row" from "production row" — if it succeeds easily, the two worlds really have diverged. Build this monitoring in from day one, or the business will discover the shift before you do.

---

**The three shifts, in notation.**

The names map cleanly to which probability moved. **Covariate shift**: P(X) changes, P(Y|X) holds — the inputs move but the rule is intact. **Label/prior shift**: P(Y) changes, P(X|Y) holds — the class mix moves but each class still looks the same. **Concept drift**: P(Y|X) changes — the *rule itself* moves, which is the one no reweighting can fix. Being able to say "which distribution changed?" is exactly how you pick the response, so it's worth carrying the notation, not just the stories.

---

**Detection has a metric menu, not just PSI.**

PSI is the industry default, but know the alternatives and when they're better. The **KS test** measures the largest gap between two CDFs (good for continuous features). **Wasserstein (earth-mover) distance** captures *how far* the mass moved, which PSI's binning can miss. **KL / Jensen-Shannon divergence** quantify distributional difference (JS is symmetric and bounded). **MMD** (maximum mean discrepancy) is a kernel-based two-sample test that works in high dimensions. For **categorical** features, compare frequencies (chi-squared) and watch for new categories. Use several — a shift that hides from one metric often shows in another.

---

**Label shift can be estimated without new labels.**

Prior/label shift has a neat property: you can often correct it *without* fresh labels. **Black Box Shift Estimation (BBSE)** uses your existing model's confusion matrix plus the *distribution of its predictions* on the new data to estimate the new class priors, then reweights the outputs. So if only the class balance moved (fraud rate 0.1% → 0.3%, fraud still looks the same), you re-estimate the prior and adjust — no relabelling, no retrain. This is why diagnosing the shift *type* pays off: label shift is the cheapest to fix.

---

**Adaptation strategies, cheapest to most involved.**

Match the response to the shift. **Importance weighting** for covariate shift (up-weight training rows resembling current traffic). **Prior/output correction (BBSE)** for label shift. **Domain adaptation** methods (align feature representations between source and target) when you have unlabelled target data. **Online / continual learning** to keep updating from a stream, and **test-time adaptation** (adjust batch-norm statistics or a few parameters to the incoming batch) for mild drift. And for concept drift, the honest answer remains **fresh labels and a retrain** — there is no free lunch when the underlying rule has genuinely changed.`,
    keyPoints: [
      `**Use PSI per feature as your first production monitoring signal, not aggregate accuracy.** PSI buckets a feature's distribution into deciles and computes weighted divergence from the training baseline. PSI < 0.1 is stable; 0.1–0.2 warrants investigation; > 0.2 is a retraining trigger. Track per-feature, not aggregate — a single important feature shifting while others are stable will be invisible in any aggregate metric. Also monitor the prediction distribution: if P($\\hat{y}$) shifts without any feature shift, you have concept drift.`,
      `**The most common production trap: scheduled retraining (weekly, monthly) in a domain where shift happens in days.** Fraudsters observe your model's behaviour and adapt within weeks of a new deployment. A fixed monthly retraining schedule is already two to four weeks behind by the time it fires. Build trigger-based retraining: fire when PSI exceeds 0.2 on a key feature, or when performance on a labeled validation window drops beyond a threshold. Scheduled retraining is acceptable in stable domains; in adversarial or fast-moving domains, it guarantees you are always working with stale assumptions.`,
      `**Diagnose shift type before choosing a response.** Stable feature PSI but degraded performance = concept drift signature (P(X) unchanged, P(Y|X) changed) — requires new labeled data and retraining, no shortcut. Shifted feature PSI but degraded performance = covariate shift candidate — try importance weighting first, which can buy weeks before a full retrain. To confirm covariate shift, train a logistic regression to classify "is this example from training or production?" If it classifies with high accuracy, the distributions are meaningfully different and importance weighting is appropriate.`,
      `**Name which distribution moved, and detect with more than PSI.**\n\nCovariate shift = P(X) moves, P(Y|X) holds (importance-weight); label/prior shift = P(Y) moves, P(X|Y) holds (correct the prior); concept drift = P(Y|X) moves (retrain, no shortcut). Beyond PSI, detect with the KS test and Wasserstein distance for continuous features, KL/Jensen-Shannon and MMD for distributions, and chi-squared/new-category checks for categoricals — a shift hidden from one metric often shows in another.`,
      `**Match the fix to the shift, cheapest first — and label shift needs no new labels.**\n\nLabel shift can be corrected without relabelling via Black Box Shift Estimation (use the model's confusion matrix and its prediction distribution on new data to re-estimate class priors, then reweight outputs). Adaptation ladder: importance weighting (covariate), prior/output correction (label), domain adaptation with unlabelled target data, online/continual learning and test-time adaptation (mild drift), and fresh labels + retrain for genuine concept drift. Diagnosing the shift type is what tells you whether you need five minutes or two weeks.`,
    ],
    takeaway: `A model outputs confident predictions on shifted data — no error fires, no uncertainty is signaled, and performance degrades silently until ground-truth labels arrive. Whether you can fix it without new labels depends on what type of shift occurred. Only monitoring catches it before the business does.`,
    recap: [
      `**Shift is silent:** the model outputs confident predictions on shifted data, degrading until ground-truth labels arrive. Only monitoring catches it first.`,
      `**Name which distribution moved:** covariate shift = P(X) moves, P(Y|X) holds; label shift = P(Y) moves; concept drift = P(Y|X) moves.`,
      `**Monitor per-feature PSI, not aggregate accuracy:** <0.1 stable, 0.1–0.2 investigate, >0.2 retrain — one shifting feature is invisible in aggregates.`,
      `**Diagnose type before responding:** stable PSI + degraded performance = concept drift (no shortcut); shifted PSI = covariate shift (try importance weighting).`,
      `**Confirm covariate shift** by training a classifier to tell train-vs-production apart — high accuracy means the distributions genuinely differ.`,
      `**Label shift needs no new labels:** BBSE re-estimates class priors from the confusion matrix + prediction distribution, then reweights outputs.`,
      `**Scheduled retraining fails in fast/adversarial domains** — fraudsters adapt in days; fire on PSI/performance triggers, not a monthly calendar.`,
    ],
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
    figures: {
      shift_types: `<svg viewBox="0 0 390 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:390px;font-family:var(--font-sans,sans-serif)">
  <!-- covariate: input curve slides -->
  <text x="65" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">covariate</text>
  <text x="65" y="30" text-anchor="middle" fill="var(--ink-low)" font-size="8">inputs move</text>
  <path d="M15,110 Q45,45 75,110" fill="none" stroke="var(--prime)" stroke-width="1.8"/>
  <path d="M55,110 Q85,45 115,110" fill="none" stroke="var(--amber)" stroke-width="1.8" stroke-dasharray="4,3"/>
  <line x1="12" y1="110" x2="120" y2="110" stroke="var(--ink-low)" stroke-width="1"/>
  <!-- concept: same X, label flips -->
  <text x="195" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">concept</text>
  <text x="195" y="30" text-anchor="middle" fill="var(--ink-low)" font-size="8">the rule moves</text>
  <circle cx="175" cy="75" r="10" fill="var(--teal)" opacity="0.7"/><text x="175" y="79" text-anchor="middle" fill="#000" font-size="8" font-weight="700">ok</text>
  <path d="M192,75 H 210" stroke="var(--ink-low)" stroke-width="1.3" marker-end="url(#sa)"/>
  <circle cx="225" cy="75" r="10" fill="var(--prime)"/><text x="225" y="79" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">bad</text>
  <text x="195" y="108" text-anchor="middle" fill="var(--ink-low)" font-size="8">same features,</text>
  <text x="195" y="119" text-anchor="middle" fill="var(--ink-low)" font-size="8">new label</text>
  <!-- prior: class mix grows -->
  <text x="325" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">prior</text>
  <text x="325" y="30" text-anchor="middle" fill="var(--ink-low)" font-size="8">the mix moves</text>
  <rect x="290" y="45" width="30" height="60" rx="2" fill="var(--ink-low)" opacity="0.5"/><rect x="290" y="99" width="30" height="6" rx="1" fill="var(--prime)"/>
  <rect x="330" y="45" width="30" height="60" rx="2" fill="var(--ink-low)" opacity="0.5"/><rect x="330" y="87" width="30" height="18" rx="1" fill="var(--prime)"/>
  <text x="305" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="8">1%</text>
  <text x="345" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="8">3%</text>
  <text x="195" y="150" text-anchor="middle" fill="var(--ink-low)" font-size="9">tell them apart: reweight, retrain, or just re-estimate the balance</text>
  <defs><marker id="sa" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--ink-low)"/></marker></defs>
</svg>`,
    },
  },
  {
    id: 'data_augmentation',
    title: 'Data Augmentation',
    subtitle: `Artificially expand your training distribution by adding realistic variations — but only ones that preserve the label.`,
    difficulty: 'intermediate',
    estimatedMin: 40,
    tags: ['augmentation', 'SMOTE', 'image augmentation', 'mixup', 'text augmentation', 'back-translation'],
    summary: `Your dog-versus-cat classifier has 500 images per class and is stuck: **95% on training, 72% on validation.** It has *memorised* the exact pixels of your 500 dogs — but it has never seen a cat from the right, a dog in dim light, or a photo with a greenish tint. **Data augmentation** fixes this by showing the model cheap, realistic *variations* of the images it already has: randomly flip them left-right, crop and zoom a little, nudge the brightness and colour. Now, across 20 training passes, the model effectively sees tens of thousands of slightly-different images instead of the same 500, and it learns the thing that actually matters — that a flipped dog is still a dog. Validation jumps to **84%**.

---

**The one rule: the transformation must not change the label.**

This is the whole game, and it is easy to get wrong. An augmentation is valid *only* if it leaves the correct answer unchanged. Flipping a photo left-right is fine for animals (a mirrored dog is a dog) — but fatal for letters (a flipped "b" becomes "d"). Jittering colours is fine for holiday snaps — but ruinous for retinal medical scans, where colour *is* the diagnosis. Warping the timing is fine for some audio — but it destroys the shape of a heartbeat in an ECG. Every augmentation is really a claim: "the model should treat *this* kind of change as meaningless." Only someone who knows the domain can say whether that claim is true; the algorithm cannot. Push it too far and you are simply training on mislabelled data.

[FIGURE: augmentation_rule]

---

**Different data, different tricks.**

Each data type has its own safe transformations. **Images**: flip, crop, colour jitter. **Text**: back-translation (translate to another language and back to get a natural paraphrase), or swapping in synonyms. **Tabular**: a little random noise on numeric columns, or SMOTE for a rare class. **Time series and audio**: shift the pitch, stretch the time, add background noise. In every case, the same rule applies — does the change keep the label true?

---

**Two habits that matter.**

First, **augment on the fly, not once up front.** If you pre-compute a fixed set of rotated images and save them, the model just memorises *those* specific rotations after a few epochs — no gain. Applying a fresh random transformation every pass means it never sees the exact same image twice, so it is forced to learn the invariance instead.

Second, **only augment the training set — never validation or test.** Augmentation is a training-time regulariser; your validation numbers must come from clean, untouched images, or your score becomes a lottery that depends on which random transforms happened to fire.

And read the loss curves the right way round, because this trips people up: healthy, effective augmentation usually makes the training task *harder*, so **training accuracy goes down (or loss up) while validation improves** — that gap closing is the point, not a problem. The signature of augmentation that's *too aggressive* (transforms so severe they change the label) is that *both* training and validation get worse, or validation drops. So don't panic when strong augmentation dents your training number; only worry when validation stops improving.

---

**The modern augmentation menu.**

Flip and crop are the baseline; the field has moved well past them. For **images**: **RandAugment** and **AutoAugment** (search or randomly sample a policy of transforms so you don't hand-tune each), **AugMix** (blend several augmented versions for robustness), **CutMix** (paste a patch of one image onto another and mix the labels proportionally), **MixUp** (linear blend of two images and labels), and **random erasing** (mask out a random rectangle so the model can't rely on one region). For **audio**: **SpecAugment** (mask bands of time and frequency in the spectrogram). For **NLP**: **token masking / random deletion / word dropout**, alongside back-translation and synonym swaps. Knowing this menu — and that policy-search methods (RandAugment) largely replaced hand-tuning — is standard interview fare.

---

**Tabular and text augmentation need extra caution.**

Augmentation is *not* equally safe across data types. **Tabular**: adding random noise or SMOTE-interpolating can produce **unrealistic or constraint-violating** records — a synthetic row with age 45 and "years_employed" 60, or a negative count — which teaches the model nonsense. Respect feature constraints and correlations, and prefer domain-aware perturbations. **Text**: synonym swaps and back-translation can quietly **flip the label** — a synonym can change **sentiment** ("cheap" → "affordable" vs "shoddy"), swap an **entity's meaning**, or alter **intent**; back-translation can drop a negation. Text and tabular augmentation demand label-checking far more than image flips do.

---

**Match augmentation to real production variation.**

The right transforms *mimic the variation you'll actually see at serving time*, not arbitrary distortions. If production images come from phone cameras in varied lighting, brightness/colour jitter and mild blur are on-distribution and helpful; if they're always scanned documents at fixed orientation, rotation augmentation invents variation that never occurs and just adds noise. Ask "does this transform represent something a real input could look like?" — augmentation that pulls training *away* from the deployment distribution hurts.

---

**Augmented copies leak across the split.**

A subtle leakage trap: if you augment *before* splitting, an original image and its augmented versions can land on **opposite sides**, so validation contains near-duplicates of training data and your score is inflated. Always **split first (by original example), then augment only the training portion** — the augmented copies of a training image must never appear in validation or test. This is the augmentation-specific case of the duplicate-leakage rule.

---

**Tune the augmentation policy like a hyperparameter.**

Augmentation strength and probability aren't set-and-forget. **Strength** (how much rotation/jitter) and **application probability** (how often each transform fires) are hyperparameters to tune, ideally by **ablation** — add one augmentation family at a time and measure the lift on *clean* validation data. And the ultimate test is **robustness on the clean validation/test set**: augmentation earns its place only if it improves performance on untouched data, so monitor that, not the training curve.`,
    keyPoints: [
      `**Start with horizontal flip plus random crop for any image task — these two augmentations alone capture most of the regularization gain and are valid for nearly all image classification tasks.**\n\nFor the dog/cat classifier: horizontal flip is valid (a flipped dog is still a dog), random crop forces the model to recognize the animal from partial views. Together they drive validation accuracy from 72% to ~83%. More exotic augmentations — CutMix, MixUp, RandAugment — give diminishing returns beyond this baseline. Start with the cheap wins before adding complexity.`,
      `**Trap: applying augmentation to both training and validation sets. Augmentation is a training regularizer — validation must see clean, unaugmented examples to give a reliable performance estimate.**\n\nIf you augment validation, your performance metric becomes a function of which random transformations happened to be applied during that evaluation run. The estimate is noisy and not comparable across runs. Augmentation lives exclusively in the training data loader. Validation and test loaders apply no random transforms. Related leakage trap: augment *after* the split, by original example — if augmented copies of a training image reach validation, the score is inflated.`,
      `**Diagnostic: read the curves correctly — effective augmentation usually lowers training accuracy while raising validation accuracy.**\n\nBecause augmentation makes each training example harder and more varied, a healthy run often shows training accuracy *drop* (or loss rise) while the train-val gap closes and validation *improves* — that's the regulariser working, not a failure. The signature of augmentation that is genuinely too aggressive (label-violating transforms) is different: *validation* stops improving or gets worse, often alongside worse training too. So don't dial augmentation back just because training accuracy fell; only intervene when validation itself degrades.`,
      `**Know the modern menu, and that tabular/text augmentation is riskier than image flips.**\n\nBeyond flip/crop: RandAugment/AutoAugment (policy search), AugMix, CutMix, MixUp, random erasing for images; SpecAugment for audio; token masking/back-translation for text. Tabular augmentation (noise, SMOTE) can create unrealistic or constraint-violating rows, and text augmentation (synonyms, back-translation) can flip sentiment/intent/entity meaning or drop a negation — both need label-checking that image flips rarely do. Match transforms to real production variation (rotation on always-upright scans just adds noise), not arbitrary distortion.`,
      `**Augment after the split, and tune the policy by clean-set ablation.**\n\nSplit by original example first, then augment only the training portion — augmented copies of a training image leaking into validation inflates the score (the augmentation case of duplicate leakage). Treat augmentation strength and application probability as hyperparameters tuned by ablation (add one family at a time, measure lift on untouched validation). And read the curves correctly: effective augmentation typically lowers training accuracy while raising validation — the gap closing is the win, and only degrading validation signals label-violating transforms.`,
    ],
    interactivePrompt: `Before you touch the controls: you are augmenting a handwritten digit dataset with random rotations up to 90 degrees — can you name one digit that this rotation would break?`,
    takeaway: `Augmentation encodes invariances the model should have — and only a domain expert can verify which transformations preserve the label for each class, because the model cannot distinguish a "different view of a dog" from a "mislabeled digit."`,
    recap: [
      `**Augmentation encodes invariances the model should have** — only a domain expert knows which transforms preserve the label per class.`,
      `**Rotating a digit breaks the label** (6↔9): the model can't tell "different view of a dog" from "mislabeled digit."`,
      `**Start with horizontal flip + random crop for images** — ~72%→83% val accuracy; CutMix/MixUp/RandAugment give diminishing returns.`,
      `**Augment training only, after the split;** clean validation gives a reliable estimate, and augmented copies leaking into val inflate the score.`,
      `**Read the curves right:** effective augmentation *lowers* training accuracy while *raising* validation — the gap closing is the win.`,
      `**Only intervene when validation itself degrades** — that's the signature of label-violating (too-aggressive) transforms.`,
      `**Tabular/text augmentation is riskier:** SMOTE can make impossible rows, back-translation can flip sentiment or drop a negation — both need label-checking.`,
    ],
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
      {
        q: `You add strong image augmentation and notice training accuracy dropped from 98% to 88%, while validation accuracy rose from 80% to 86%. A colleague says "training accuracy fell, so the augmentation is too aggressive — turn it down." Are they right?`,
        options: [
          `A) Yes — any drop in training accuracy means the augmentation is corrupting the labels and must be reduced.`,
          `B) No. Effective augmentation makes each training example harder and more varied, so training accuracy *falling* while the train-val gap closes and validation *improves* is exactly the regulariser working as intended — that's the win, not a warning. The signature of genuinely too-aggressive (label-violating) augmentation is different: validation stops improving or gets worse. Since validation went up, keep the augmentation; only intervene if validation itself degrades.`,
          `C) Yes — the training and validation accuracies should both increase with good augmentation, so a divergence means something is broken.`,
          `D) No, but only because 88% training accuracy is still above the 85% minimum required for deployment; if it fell below 85% the colleague would be right.`,
        ],
        answer: `B`,
      },
      {
        q: `You're augmenting a customer-churn tabular dataset by adding Gaussian noise to numeric columns and using SMOTE for the rare churn class. Why is this riskier than flipping images, and what should you watch for?`,
        options: [
          `A) It isn't riskier — tabular augmentation is identical to image augmentation, so noise and SMOTE are always safe.`,
          `B) Tabular augmentation can create unrealistic or constraint-violating records that image flips never do: Gaussian noise can push "age" negative or make "years_employed" exceed "age," and SMOTE interpolating between rows can produce combinations that violate real feature correlations or business rules — teaching the model nonsense. Watch that augmented rows respect feature constraints and joint distributions, prefer domain-aware perturbations, and (for SMOTE) apply it only inside the training folds after the split. Tabular data lacks the built-in label-preserving invariances that make image flips safe.`,
          `C) The only risk is that SMOTE is slow on large tabular datasets; the generated records are always realistic.`,
          `D) Tabular augmentation is risky only because it changes the number of columns, which breaks the model's input shape.`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      augmentation_rule: `<svg viewBox="0 0 360 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">an augmentation is valid only if the label survives</text>
  <!-- valid row -->
  <rect x="20" y="34" width="56" height="26" rx="4" fill="var(--teal)" opacity="0.2" stroke="var(--teal)" stroke-width="1.2"/><text x="48" y="51" text-anchor="middle" fill="var(--ink-hi)" font-size="11">dog</text>
  <text x="98" y="51" text-anchor="middle" fill="var(--ink-low)" font-size="8">— flip →</text>
  <rect x="126" y="34" width="56" height="26" rx="4" fill="var(--teal)" opacity="0.2" stroke="var(--teal)" stroke-width="1.2"/><text x="154" y="51" text-anchor="middle" fill="var(--ink-hi)" font-size="11">dog</text>
  <text x="200" y="51" fill="var(--teal)" font-size="10" font-weight="700">✓ still a dog</text>
  <!-- invalid row -->
  <rect x="20" y="86" width="56" height="26" rx="4" fill="var(--prime)" opacity="0.12" stroke="var(--prime)" stroke-width="1.2"/><text x="48" y="103" text-anchor="middle" fill="var(--ink-hi)" font-size="11">b</text>
  <text x="98" y="103" text-anchor="middle" fill="var(--ink-low)" font-size="8">— flip →</text>
  <rect x="126" y="86" width="56" height="26" rx="4" fill="var(--amber)" opacity="0.2" stroke="var(--amber)" stroke-width="1.2"/><text x="154" y="103" text-anchor="middle" fill="var(--ink-hi)" font-size="11">d</text>
  <text x="200" y="103" fill="var(--amber)" font-size="10" font-weight="700">✗ label changed</text>
</svg>`,
    },
  },
  {
    id: 'data_versioning_and_pipelines',
    title: 'Data Versioning and Pipelines',
    subtitle: `Models are only reproducible if both code and data are versioned — and production ML breaks when training and serving compute features differently.`,
    difficulty: 'advanced',
    estimatedMin: 40,
    tags: ['DVC', 'feature store', 'data versioning', 'training-serving skew', 'pipeline orchestration', 'reproducibility'],
    summary: `A model you shipped six months ago starts misbehaving: performance on iOS users has fallen off a cliff since October. You go to investigate — and hit a wall. You have *no record* of what data that model was trained on, what the pipeline looked like before a September change, or which features that change touched. So begins two weeks of archaeology. Now imagine the alternative: you \`git log\` the pipeline, run one command to check out the *exact* dataset the model trained on, re-run training, and find the bug in two hours. That is what **data versioning** buys you.

The core idea is simple: **a model is a function of three things — its training data, its code, and its hyperparameters — and to reproduce a model you must be able to recover all three.** Code versioning (Git) is second nature. The piece teams forget is the *data*. Tools like **DVC** fix this by storing a tiny pointer file — essentially a fingerprint of the dataset — right next to your code in Git, so checking out any past commit gives you back both the code *and* the exact data as it was then. A tool like **MLflow** captures the third leg, logging each run's code version, data fingerprint, hyperparameters, and results, so any past experiment can be rebuilt from its run ID instead of from memory.

---

**The other silent killer: training-serving skew.**

Here is a failure that bites far more teams than expect it. The logic that computes your features usually gets written *twice* — once in Python for training, once in SQL or Java for the live serving system. Over time the two quietly drift apart: a timezone handled differently, a null treated differently, a rounding difference in an aggregate. Now the model is fed inputs at serving time that are subtly different from anything it trained on. Offline it scores **91%**; in production it scores **77%** — and *nothing errors*.

There is only one real fix, and it is structural: compute each feature in *one* canonical place that both training and serving use. This is exactly what a **feature store** (Feast, Tecton, Hopsworks) does — it keeps a single definition of each feature and serves it to both the training pipeline and the live system, so the two can never drift apart.

---

**Is this overkill for a small team?**

It is tempting to skip all this as heavyweight process. But the maths is stark. Adding DVC to a repo costs a couple of hours, once. The *first* time a silent data bug causes a production incident without it, you lose days digging — and you may not be able to confidently roll back at all, because you cannot reproduce the good state. A good test of whether you are actually versioned: *could a teammate who was never on the project reproduce this exact model from scratch in half an hour, given only the commit hash?* If not, you do not really have a versioned pipeline yet.

---

**The fourth leg: environment and dependencies.**

Code + data + hyperparameters isn't quite the whole story — the *environment* is a fourth leg of reproducibility. A different scikit-learn version can change a default and shift results; a different CUDA/cuDNN or GPU can change floating-point outputs; an un-pinned dependency can silently upgrade under you. So version the environment too: **lockfiles** (Conda, Poetry, pip freeze), a **Docker image** (or documented base image + CUDA/library versions), and a note of the hardware/runtime. "It reproduced on my machine" isn't reproducibility until the machine itself is pinned.

---

**The model registry and its lifecycle.**

Trained artifacts need governance, which is what a **model registry** (MLflow Registry, SageMaker, Vertex) provides. It tracks each model version through **lifecycle stages** — Experiment → Staging → Production → Archived — with **approval gates** between them, one-command **rollback** to a prior version, **lineage** back to the training run, and a **model card** documenting intended use, metrics, and limitations. This is what turns "which model is live and how do I revert it?" from an incident into an API call.

---

**Pipeline orchestration.**

The steps (ingest → features → train → evaluate → deploy) run as an orchestrated **DAG** in tools like Airflow, Prefect, Dagster, or Kubeflow. What the orchestrator buys you: **retries** and failure **alerts**, **scheduling** and **backfills** (re-run a date range after a fix), and — critically — **idempotency** (re-running a step on the same input produces the same output with no duplicates). Without idempotency you can't safely retry, and without alerts a silent stage failure becomes next month's mystery.

---

**Feature store: two stores, freshness, materialization.**

The feature store that cures training-serving skew has real internal structure worth knowing. It has an **offline store** (historical values, point-in-time-correct, for building training sets) and an **online store** (the latest value per entity, low-latency, for serving). **Materialization** is the job that computes features and writes them to both; each feature has a **freshness SLA** and often a **TTL**. The hard parts are keeping online **latency** low and getting **backfill correctness** right — recomputing historical features with point-in-time correctness so training and serving see the same values.

---

**Data contracts and experiment tracking, spelled out.**

A **data contract** is the enforceable interface a producing team commits to: **schema**, **types**, **null-rate** ceiling, **value ranges**, **cardinality**, **uniqueness**, **volume**, **freshness SLA**, and clear **ownership** — so an upstream breaking change is caught at the boundary. **Experiment tracking** should capture everything needed to rebuild and compare a run: **code commit**, **dataset hash**, **feature-set version**, **config file**, **random seeds**, **split IDs**, **hyperparameters**, **metrics**, and per-slice **evaluation reports**. If a run can't be rebuilt from its logged record alone, the tracking is incomplete.

---

**CI/CD for ML, and end-to-end lineage.**

ML needs its own **CI/CD**: **unit tests** for feature logic, **data-validation tests** on incoming batches, **training smoke tests** (does a tiny run complete?), **model-performance gates** (block deploy if a metric regresses), and **canary** rollouts with automated rollback. Tying it all together is **lineage**: for any production prediction you should be able to trace *backward* — prediction → model version → the exact feature values used → the feature-computation code → the raw data snapshot → the training run. That backward trace is what makes an incident debuggable in hours instead of weeks, and it's the ultimate payoff of versioning code, data, environment, and pipeline together.`,
    keyPoints: [
      `**Add DVC to any project the moment you have a second training run — tracking data versions retroactively is harder than starting upfront. DVC adds fewer than 5 lines to your Makefile and zero overhead to training.**\n\nFor the iOS debugging scenario: \`dvc checkout\` restores the exact dataset used six months ago. Without DVC, the training table has been updated, overwritten, or partitioned differently since then. Reproducing the model state is impossible, not just hard.`,
      `**Trap: versioning model artifacts but not data. If you can reproduce the model checkpoint but not the training data, you cannot audit why the model behaves the way it does. Data versioning is more important than model versioning.**\n\nMLflow saves the trained model weights. DVC saves the dataset hash. You need both. Model weights tell you what the model learned; the dataset hash tells you what it learned from. Without the dataset, you cannot audit for label errors, investigate training distribution, or reproduce a retraining run.`,
      `**Diagnostic: ask yourself "can I reproduce this model from scratch in under 30 minutes?" If the answer is no, you do not have a versioned pipeline.**\n\nThe test is concrete: given only the Git commit hash for a past training run, a colleague who was not on the project should be able to reproduce the model checkpoint within 30 minutes. If this is not possible — because data is untracked, pipeline stages are undocumented, or hyperparameters were set interactively — the pipeline is not versioned in any meaningful sense.`,
      `**Reproducibility has four legs, and production ML needs a registry, orchestration, and a feature store.**\n\nCode + data + hyperparameters + environment — pin dependencies with lockfiles and a Docker image (CUDA/library versions included), since a package bump can silently change results. A model registry manages lifecycle (Experiment → Staging → Production → Archived) with approval gates, one-command rollback, lineage, and model cards. Orchestrators (Airflow/Prefect/Dagster/Kubeflow) give retries, alerts, backfills, and idempotency. The feature store has an offline store (point-in-time history for training) and online store (latest value, low latency for serving), joined by materialization with a freshness SLA.`,
      `**Formalise data contracts and experiment tracking, and wire ML CI/CD with full lineage.**\n\nA data contract commits a producer to schema, types, null-rate, ranges, cardinality, uniqueness, volume, freshness SLA, and ownership. Experiment tracking must log code commit, dataset hash, feature-set version, config, seeds, split IDs, hyperparameters, metrics, and per-slice reports — enough to rebuild the run. ML CI/CD adds unit tests for feature logic, data-validation tests, training smoke tests, performance gates, and canary rollouts. The payoff is end-to-end lineage: trace any production prediction back through model version → feature values → feature code → raw data snapshot → training run.`,
    ],
    interactivePrompt: `Before you touch the controls: a production model was trained 6 months ago and is now showing bugs — you have the training code at the exact Git commit, but what else do you need to reproduce the model?`,
    takeaway: `A model is a function of code, data, and hyperparameters together — versioning only the code leaves the debugging problem half-solved, and the half that is missing is usually the one that caused the incident.`,
    recap: [
      `**A model is a function of code, data, and hyperparameters together** — versioning only code leaves the half that caused the incident missing.`,
      `**Version data, not just model artifacts:** weights say *what* it learned; the dataset hash says what it learned *from*. You need both (DVC + MLflow).`,
      `**Add DVC at the second training run** — \`dvc checkout\` restores the exact past dataset; retroactive versioning is near-impossible.`,
      `**The 30-minute test:** given only a Git commit, a colleague reproduces the checkpoint in <30 min — else the pipeline isn't versioned.`,
      `**Reproducibility has four legs:** code + data + hyperparameters + environment (pin lockfiles + Docker; a package bump silently changes results).`,
      `**Production ML needs a registry** (lifecycle, rollback, model cards), **orchestration** (retries, backfills, idempotency), and a **feature store** (offline point-in-time + online low-latency).`,
      `**End-to-end lineage is the payoff:** trace prediction → model version → feature values → feature code → raw snapshot → training run — hours, not weeks.`,
    ],
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
        answer: `A`,
      },
      {
        q: `You can reproduce a model's exact weights from 8 months ago (you versioned code, data, hyperparameters, and seeds), but running the same pipeline today gives slightly different numeric results. What did you likely miss, and how do you fix it?`,
        options: [
          `A) Nothing — identical code, data, and seeds always produce bit-identical results regardless of anything else, so the difference must be a measurement error.`,
          `B) The environment is unversioned — a different library version (scikit-learn/pandas/numpy), a different CUDA/cuDNN, or different hardware can change defaults and floating-point results even with identical code, data, and seeds. Reproducibility has a fourth leg beyond code/data/hyperparameters: pin the environment with lockfiles (Conda/Poetry) and a Docker image capturing library and CUDA versions, and record the runtime/hardware.`,
          `C) The random seed must not have been fixed after all; re-fixing the seed is the only thing that affects reproducibility.`,
          `D) The dataset hash changed on its own; recompute it and the results will match.`,
        ],
        answer: `B`,
      },
      {
        q: `Your team can reproduce models but debugging a bad production prediction still takes weeks. What capability is missing, and what does it let you do?`,
        options: [
          `A) You need a faster GPU — debugging speed is purely a compute problem.`,
          `B) End-to-end lineage is missing: the ability to trace a specific production prediction backward through the model version that produced it → the exact feature values it used → the feature-computation code → the raw data snapshot → the training run. With lineage wired in (plus a model registry, orchestration, and a feature store), you follow the chain from a bad prediction to its root cause in hours instead of reconstructing everything from memory over weeks.`,
          `C) You need to retrain more frequently, which prevents bad predictions from occurring and removes the need to debug them.`,
          `D) You need to disable monitoring, since alerts slow down the debugging process.`,
        ],
        answer: `B`,
      },
    ],
  },
]
