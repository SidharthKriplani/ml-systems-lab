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

**Outliers are not the same as impossible values.**

These two get lumped together, but they need different treatment. An **outlier** is a data point that is extreme but potentially *valid* — a $50,000 transaction is unusual, not wrong. An **impossible value** violates a hard constraint and is *always* an error — the \`age = -3\` row from a moment ago is not "an unusual customer," it is broken data, and it gets nullified before anything else runs. Confusing the two is dangerous in both directions: nullifying a legitimate extreme value throws away real signal, while treating a constraint violation as "just an outlier" lets broken data quietly train the model.

And "outlier" itself is not automatically noise to be removed. In fraud or anomaly detection, the fraud rows *are* the outliers — rare and extreme by definition, relative to the mass of normal transactions. A blanket "remove the outliers" step, applied without asking what the outliers *are* in this dataset, strips out most of the positive class before the model ever sees it, leaving a detector that has learned to predict "not fraud" almost every time.

---

**The sneakiest failure: rows that silently vanish.**

One failure deserves special mention because it hides so well. Join two tables on customer ID, and if some IDs in one table have no match in the other, those rows simply *disappear* — no error, the pipeline reports success, and 120,000 training examples are gone. And they are almost never a random 120,000: they tend to be a specific group (older customers, one region), which is now missing entirely from training. Your model quietly learns nothing about them.

[FIGURE: silent_row_loss]

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
          `A) The model trains 30% faster since fewer rows remain, but loses calibration on high-value transactions specifically, requiring a full threshold recalibration sweep before deployment and launch.`,
          `B) Fraud transactions are inherently outliers — rare and anomalous by definition. Removing outliers would strip out most of the positive class, leaving a model that almost never predicts fraud.`,
          `C) Removing outliers reduces variance but introduces bias toward the mean transaction profile, which specifically causes the model to underperform on weekend and holiday transaction patterns.`,
          `D) The model becomes overconfident on the majority class, but this is fully corrected by applying SMOTE with a 5:1 oversampling ratio right after the outlier removal step.`,
        ],
        answer: `B`,
      },
      {
        q: `You join two tables on a customer ID and your training set shrinks from 500,000 to 380,000 rows without any error. What likely happened and why does it matter?`,
        options: [
          `A) A deduplication step silently ran during the join on the customer_id key, removing duplicate rows. This is expected, and the remaining 380,000 rows are still a representative random sample.`,
          `B) A filter on the signup-date column excluded customers who joined before 2019 during the join, but since the remaining sample is still 380,000 rows, the model generalizes without issue.`,
          `C) The join used an implicit DISTINCT clause, collapsing multi-purchase customers to one row per customer ID, which slightly underrepresents heavy buyers but leaves the label distribution unchanged.`,
          `D) Referential integrity failure: 120,000 rows were lost because their customer IDs had no match in the second table — likely a specific region or cohort, so the model trains on a biased subset.`,
        ],
        answer: `D`,
      },
      {
        q: `What is the difference between an outlier and an impossible value, and why should they be handled differently?`,
        options: [
          `A) An outlier is extreme but potentially valid (a 50,000-dollar transaction is unusual). An impossible value violates a hard constraint (age = -3) and is always an error, nullified before anything else.`,
          `B) An outlier is any value above the 99th percentile; an impossible value is any value above the 99.9th percentile. Both should be clipped to the 99th percentile before training to stabilize the model.`,
          `C) An outlier is a data entry error; an impossible value is a measurement instrument failure. Outliers should be removed entirely; impossible values should be imputed with the domain-specific minimum valid value.`,
          `D) Both terms describe the same phenomenon — any value that falls outside two standard deviations from the column mean. The distinction is purely semantic and never changes how either should be handled.`,
        ],
        answer: `A`,
      },
      {
        q: `You run a data profile on training set in January and model performs well. You retrain in June without re-profiling and performance drops. What data quality issue is most likely responsible?`,
        options: [
          `A) The model's hyperparameters are no longer optimal because the June dataset grew by 40%, so the January grid search must be fully rerun before the model can be trusted again.`,
          `B) Random seed differences between the January and June training runs caused the optimizer to converge to a different local minimum, which alone accounts for the performance drop.`,
          `C) Distribution shift between January and June that a re-profile would catch — a new null rate, an upstream encoding change, or a real-world shift the pipeline can't see without looking again.`,
          `D) The validation split was proportionally smaller in June because the training set grew, so the June evaluation is noisier and meaningfully less representative of true production performance overall.`,
        ],
        answer: `C`,
      },
      {
        q: `A column has 55% null values. A colleague says to impute with the median. What should you do before accepting that advice?`,
        options: [
          `A) Run a Shapiro-Wilk test to confirm the non-null 45% of values are normally distributed; if they are, switch to mean imputation instead of median and proceed without further checks.`,
          `B) First determine the mechanism of missingness. If MNAR, median imputation fills in systematically wrong values for exactly the highest-risk cases — verify this before accepting median as the fix.`,
          `C) Check whether the column has more than 10 unique values; if so, KNN imputation with k=5 is always superior to median imputation, regardless of the missingness mechanism at play.`,
          `D) Immediately drop the column entirely — any feature carrying more than 30% nulls introduces more downstream bias than predictive value, and per best practice should never be imputed under any circumstance.`,
        ],
        answer: `B`,
      },
      {
        q: `Two features are each 20% missing. In feature A, the missingness is unrelated to anything; in feature B, high earners systematically decline to report the value. How do you classify each, and why does it change your handling?`,
        options: [
          `A) Both are MCAR because the missing rate happens to be identical at 20%, so mean or median imputation is equally safe and statistically unbiased for both features, regardless of which rows are missing or why.`,
          `B) Feature A is MCAR — its missingness is unrelated to any value, so simple imputation is safe. Feature B is MNAR: high earners are the ones missing, biasing any ordinary imputation on high-value cases.`,
          `C) Feature A is actually MAR and feature B is MCAR here, so both should simply be handled identically with a k=5 nearest-neighbor imputer trained on all the other observed columns in the dataset.`,
          `D) The MCAR/MAR/MNAR classification is irrelevant in this case — with 20% missing on both features, the safest move is to simply drop both of them regardless of the underlying missingness mechanism.`,
        ],
        answer: `B`,
      },
      {
        q: `Your feature pipeline is clean on every column, but the model underperforms badly for one region and one device type. Aggregate metrics look fine. Which TWO of the following are true about what went wrong and how to catch it earlier?`,
        options: [
          `A) You skipped hyperparameter tuning — regional and device-level underperformance is always a model-capacity problem, reliably fixed by training a larger model with more trees or layers.`,
          `B) You skipped a sample-coverage audit: a dataset can be valid on every column yet under-represent a segment (a region, device, or channel), so the model is confidently wrong exactly where the data was thin.`,
          `C) Aggregate metrics look fine because they average away the exact groups that are failing — evaluating performance broken down by region, device, and channel would have surfaced this gap before production.`,
          `D) Nothing was skipped here — per-segment underperformance on an otherwise-clean dataset is simply random noise from small sample sizes, and requires no further investigation or action.`,
        ],
        answer: ['B', 'C'],
      },
    ],
    figures: {
      silent_row_loss: `<svg viewBox="0 0 360 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">a join on customer_id silently drops the unmatched rows</text>
  <text x="55" y="40" text-anchor="middle" fill="var(--ink-low)" font-size="9">table A (500k)</text>
  <rect x="20" y="48" width="70" height="96" rx="4" fill="none" stroke="var(--prime)" stroke-width="1.4"/>
  <rect x="26" y="54" width="58" height="12" rx="2" fill="var(--prime)" opacity="0.7"/>
  <rect x="26" y="70" width="58" height="12" rx="2" fill="var(--prime)" opacity="0.7"/>
  <rect x="26" y="86" width="58" height="12" rx="2" fill="var(--amber)"/>
  <rect x="26" y="102" width="58" height="12" rx="2" fill="var(--amber)"/>
  <rect x="26" y="118" width="58" height="12" rx="2" fill="var(--amber)"/>
  <text x="180" y="40" text-anchor="middle" fill="var(--ink-low)" font-size="9">table B (has only some IDs)</text>
  <rect x="150" y="48" width="60" height="96" rx="4" fill="none" stroke="var(--ink-low)" stroke-width="1.2" opacity="0.6"/>
  <rect x="156" y="54" width="48" height="12" rx="2" fill="var(--prime)" opacity="0.5"/>
  <rect x="156" y="70" width="48" height="12" rx="2" fill="var(--prime)" opacity="0.5"/>
  <path d="M92,60 H 148" stroke="var(--prime)" stroke-width="1.2"/>
  <path d="M92,76 H 148" stroke="var(--prime)" stroke-width="1.2"/>
  <path d="M92,92 H 130" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="3,3"/>
  <path d="M92,108 H 130" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="3,3"/>
  <path d="M92,124 H 130" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="3,3"/>
  <text x="290" y="40" text-anchor="middle" fill="var(--ink-low)" font-size="9">result (380k)</text>
  <rect x="260" y="48" width="60" height="46" rx="4" fill="none" stroke="var(--prime)" stroke-width="1.4"/>
  <rect x="266" y="54" width="48" height="12" rx="2" fill="var(--prime)" opacity="0.7"/>
  <rect x="266" y="70" width="48" height="12" rx="2" fill="var(--prime)" opacity="0.7"/>
  <text x="290" y="112" text-anchor="middle" fill="var(--amber)" font-size="9" font-weight="700">120k gone</text>
  <text x="290" y="124" text-anchor="middle" fill="var(--ink-low)" font-size="8">no error</text>
  <text x="180" y="164" text-anchor="middle" fill="var(--ink-low)" font-size="9">the dropped rows are a group (a region, a cohort) — never a random sample</text>
</svg>`,
    },
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

**The alternative to imputing: dropping the rows.** Before reaching for any fill-in method, some teams simply drop every row that has a null anywhere — this is **complete-case analysis**. It's only safe under MCAR: if the blanks are pure chance, the rows left behind are still a random sample, so nothing is biased. But under MAR or MNAR, dropping the rows with nulls also drops a *systematically different* slice of the population — for example, dropping every patient without a creatinine reading disproportionately removes the critically ill patients whose test was skipped for exactly that reason. A model trained on what remains never learns that population, so it can look strong on a validation split drawn from the same biased subset, then degrade once it meets, in production, the very patients complete-case analysis quietly deleted.

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
          `A) Median imputation is only valid for normally distributed columns; the statistically correct choice for these right-skewed lab values is mean imputation after a Box-Cox transform of the column.`,
          `B) The missingness rate of 30% is well within the safe range for complete-case analysis — dropping these rows is both simpler than imputation and completely unbiased for any downstream model.`,
          `C) Median imputation will inflate the variance of the imputed column by roughly the missing fraction, causing the model to systematically and measurably overweight this feature relative to others.`,
          `D) Lab tests are ordered based on how sick the clinician privately judges the patient to be — a judgment that isn't captured in any other column — so the test is more likely MISSING exactly for the patients whose result would have been worst. This is MNAR: add a was-test-ordered indicator, but know imputation alone can't fully fix it.`,
        ],
        answer: `D`,
      },
      {
        q: `Why is it data leakage to fit a mean imputer on the full dataset (train + test) before splitting?`,
        options: [
          `A) Computing the mean on the full dataset means it reflects test values too — training data indirectly contains test info, inflating accuracy. Fit every transformer on the training fold only.`,
          `B) Fitting on the full dataset computes a mean systematically biased toward the majority class's typical values, causing the imputer to consistently overestimate every minority-class row's value.`,
          `C) The imputer fitted on the full dataset will have measurably higher variance than one fitted on the training set alone, producing noisier imputed values that directly hurt model performance.`,
          `D) Fitting the imputer before splitting prevents you from using cross-validation later at all, because the imputer's already-fitted parameters cannot be re-fitted separately inside each fold.`,
        ],
        answer: `A`,
      },
      {
        q: `What is the difference between mean imputation and MICE, and when does the difference matter most?`,
        options: [
          `A) Mean imputation is statistically biased for large datasets while MICE remains provably unbiased at any dataset size; this difference always matters, regardless of the missingness rate involved.`,
          `B) Mean imputation always uses the training-set mean, while MICE always uses a fresh test-set mean computed during inference; the difference only matters when train and test distributions genuinely differ.`,
          `C) Mean imputation replaces missing values with the column mean — fast, but it ignores relationships between columns. MICE instead regresses each gap on the other columns, iterating until convergence.`,
          `D) Mean imputation and MICE produce numerically identical results for continuous columns; the difference only matters for categorical columns, where MICE substitutes a classifier in place of a regressor.`,
        ],
        answer: `C`,
      },
      {
        q: `A model trained with complete-case analysis (dropping all rows with any null) achieves 92% accuracy. When you deploy, accuracy drops to 84%. What is the most likely explanation?`,
        options: [
          `A) The model overfit specifically to the complete-case rows during training; adding L2 regularization with strength 0.1 would have fully prevented this particular 8-point accuracy gap.`,
          `B) The dropped rows were not MCAR — they were systematically different, so the model tuned its decision boundary to a biased subset it won't fully meet again in production.`,
          `C) The production dataset simply has a higher null rate than the training set had, which causes the model's already-learned coefficients to extrapolate outside their original training range.`,
          `D) The 92% training accuracy figure was computed on the very same rows used to drop nulls in the first place, introducing a subtle selection bias directly into the accuracy estimate itself.`,
        ],
        answer: `B`,
      },
      {
        q: `You single-impute a 25%-missing feature with MICE, train a model, and report tight confidence intervals on its coefficients. A statistician says your uncertainty is understated. Why, and what's the fix?`,
        options: [
          `A) The statistician is simply wrong here — MICE is a regression-based method, so by construction its imputed values are mathematically exact and add zero additional uncertainty to the model.`,
          `B) Single imputation fills each blank with one value the model treats as certain — part of the feature is fabricated. Fix: generate several imputed datasets and pool the estimates.`,
          `C) The reported intervals are too tight only because the training sample is unusually large; deliberately collecting and training on less data would widen them to an appropriately honest level.`,
          `D) The correct fix is to switch entirely from MICE to plain mean imputation, which reliably produces wider and therefore more statistically honest confidence intervals on the coefficients.`,
        ],
        answer: `B`,
      },
      {
        q: `You're deciding how to handle missing values for two candidate models: a LightGBM gradient-boosting model and a logistic regression. Which TWO of the following are true?`,
        options: [
          `A) Both require exactly the same explicit mean imputation before training, since every model family treats missing values completely identically regardless of its internal mechanism.`,
          `B) LightGBM handles missing values natively — it learns a default split direction for NaNs at each tree node — so you can often feed it the raw gaps directly without imputing at all.`,
          `C) Logistic regression has no native missing-value mechanism and requires explicit imputation plus feature scaling before training, unlike LightGBM's built-in NaN handling.`,
          `D) Neither model can accept missing values in any form, so both strictly require dropping every row containing any null value before training can begin.`,
        ],
        answer: ['B', 'C'],
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

A raw date means nothing on its own. But "days since last transaction" is a direct *recency* signal, and "transactions in the last 30 days" is a *velocity* signal. Neither exists in the original data — you compute them against a reference time. These are **temporal features**, earned by realising the model wants a time gap, not a calendar entry. And when a time field is *cyclical* — hour of day, day of week — encoding it as a plain integer is a trap: hour 23 and hour 0 are one hour apart in reality but 23 apart as integers, so a sin/cos pair placing each hour on a circle is what keeps midnight next to 11pm.

[FIGURE: cyclical_encoding]

---

**Income and account age together: the interaction.**

Income alone does not tell you whether it is typical for how long someone has held the account, and account age alone does not either — but **income relative to account age** does: a $200,000 income on an account opened last month reads very differently from the same income on a decade-old account. This is an **interaction feature**: a joint signal that neither parent carries by itself. A tree model can sometimes discover it on its own; a linear model never will unless you hand it the ratio explicitly.

---

**Doesn't deep learning make this obsolete?**

For images and text, largely yes — raw pixels and words already carry rich structure a network can exploit. But for *tabular* data like this, no. The model just sees bare numbers with no idea what they mean, so even gradient boosting — which handles non-linearities well — routinely gains 5–20% from good ratios and time lags — though not from log transforms specifically, since trees split on thresholds and a monotonic transform never changes which threshold is optimal. Feature engineering is not busywork; it is the craft of encoding what you know into the geometry of the input, so that a solvable problem actually becomes solvable.

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
          `A) The integer encoding creates a class imbalance between daytime and nighttime hours; the fix is to oversample late-night training examples using SMOTE with a 3:1 ratio before training begins.`,
          `B) Integer encoding treats midnight as the arbitrary midpoint of the day rather than a true boundary; the fix is to shift all 24 values by 12 so that noon instead maps cleanly to 0.`,
          `C) Raw integers place hour 23 and hour 0 at maximum distance, when they're really 1 hour apart. Fix: sin/cos encoding puts each hour on a circle, so 23 and 0 sit close together.`,
          `D) Integer encoding assigns disproportionate weight to the hour feature relative to every other feature in the model; the fix is to standardize the hour column with a StandardScaler transform.`,
        ],
        answer: `C`,
      },
      {
        q: `Why does log-transforming an income feature help a linear regression model but not a random forest?`,
        options: [
          `A) Linear regression assumes linearity, so skewed income makes it overweight extremes. Random forest splits on thresholds — log doesn't change which threshold is optimal, so it barely helps trees.`,
          `B) Log transformation improves both model types equally in practice; the only difference is that random forests already regularize through bagging, which fully masks the benefit from view.`,
          `C) Log transformation helps linear regression because it mathematically removes outliers entirely; random forests are unaffected since they naturally ignore outliers through majority-vote ensembling.`,
          `D) Log transformation converts multiplicative relationships into additive ones, which matters for linear regression only when the true underlying relationship is multiplicative rather than additive.`,
        ],
        answer: `A`,
      },
      {
        q: `You are building a fraud detection model and add interaction term: transaction_amount × is_international. What does this feature capture?`,
        options: [
          `A) It captures the total transaction volume for international merchants specifically, which turns out to be the exact same signal as simply summing all international amounts over a rolling window.`,
          `B) It captures geographic risk entirely independent of amount — flagging every international transaction regardless of its size, which is mathematically equivalent to using is_international alone.`,
          `C) It captures a combined effect: a high amount is suspicious specifically when international, not domestic. The product is large only when both hold — a linear model can't discover this on its own.`,
          `D) It captures the variance in transaction amounts across international versus domestic transactions, which is actually better estimated by computing the ratio of international mean to domestic mean.`,
        ],
        answer: `C`,
      },
      {
        q: `A data scientist creates 200 interaction features from 20-feature dataset and reports improved validation accuracy. What risk does this improvement mask?`,
        options: [
          `A) The risk is multicollinearity — 200 interaction features will be highly correlated with their 20 parent features, making every coefficient estimate unstable and essentially impossible to interpret.`,
          `B) With 200 mostly-noise features added, the model gains far more capacity to overfit — if validation tuned or selected features, the reported gain is optimistic. Verify with an untouched test set.`,
          `C) The risk is that the 200 interaction features may simply not be available at serving time, since the underlying raw features are computed in separate pipelines with different latency requirements.`,
          `D) The validation accuracy improvement is real but temporary — the model will degrade within a few retraining cycles as the interaction features cause growing numerical instability in gradient descent.`,
        ],
        answer: `B`,
      },
      {
        q: `You engineer a "transactions in the last 7 days" feature for a fraud model and validation AUC jumps to 0.97, but production performance is far worse. The feature itself is predictive. What's the likely bug?`,
        options: [
          `A) The feature is simply too predictive on its own, so the model overfits heavily to just this single signal; the correct fix is to remove the feature entirely before retraining.`,
          `B) The rolling aggregate almost certainly skipped a point-in-time join — it included label-day transactions, leaking future data. Recompute using data strictly before the label timestamp.`,
          `C) The 7-day window is simply too short for this fraud pattern; extending the rolling window to a full 30 days will make the training and production computations match exactly.`,
          `D) Production simply sees fewer transactions per account than training did, so the feature is naturally noisier there — there is nothing to actually fix in the pipeline itself.`,
        ],
        answer: `B`,
      },
      {
        q: `Your tabular model uses a "merchant_id" column with 40,000 distinct values. One-hot encoding is a poor choice here — which TWO of the following are genuinely better options and why?`,
        options: [
          `A) One-hot is actually the ideal choice here — all 40,000 binary columns together give the model the maximum possible information about each individual merchant's identity and behavior.`,
          `B) One-hot would create ~40,000 mostly-zero columns — huge, sparse, and starved of data per column. Grouping rare merchants into "Other," or hashing ids into a fixed bucket count, avoids this.`,
          `C) Smoothed target encoding — blending each merchant's outcome average toward the global mean — works well here too, but must be computed strictly out-of-fold within CV to avoid leaking the label.`,
          `D) The only valid option is ordinal encoding — assigning each merchant an arbitrary integer from 1 to 40,000 — which compactly preserves all categorical information without any loss at all.`,
        ],
        answer: ['B', 'C'],
      },
    ],
    figures: {
      cyclical_encoding: `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="90" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">integer hour</text>
  <text x="270" y="18" text-anchor="middle" fill="var(--ink-hi)" font-size="10" font-weight="700">sin / cos on a circle</text>
  <line x1="20" y1="150" x2="160" y2="150" stroke="var(--ink-low)" stroke-width="1"/>
  <line x1="20" y1="40" x2="20" y2="150" stroke="var(--ink-low)" stroke-width="1"/>
  <text x="14" y="150" text-anchor="end" fill="var(--ink-low)" font-size="8">0</text>
  <text x="14" y="46" text-anchor="end" fill="var(--ink-low)" font-size="8">23</text>
  <circle cx="150" cy="46" r="4" fill="var(--prime)"/>
  <circle cx="26" cy="150" r="4" fill="var(--amber)"/>
  <path d="M150,46 L 26,150" stroke="var(--amber)" stroke-width="1.3" stroke-dasharray="4,3"/>
  <text x="90" y="175" text-anchor="middle" fill="var(--amber)" font-size="8">23 and 0 look 23 apart</text>
  <text x="90" y="187" text-anchor="middle" fill="var(--ink-low)" font-size="8">- a huge, false gap</text>
  <circle cx="270" cy="95" r="55" fill="none" stroke="var(--rim)" stroke-width="1.2"/>
  <line x1="270" y1="95" x2="270" y2="40" stroke="var(--ink-low)" stroke-width="0.8" opacity="0.5"/>
  <circle cx="270" cy="40" r="4" fill="var(--prime)"/><text x="270" y="33" text-anchor="middle" fill="var(--ink-low)" font-size="8">0</text>
  <circle cx="284" cy="42" r="4" fill="var(--amber)"/><text x="298" y="40" fill="var(--ink-low)" font-size="8">23</text>
  <circle cx="325" cy="95" r="3" fill="var(--ink-low)" opacity="0.6"/><text x="332" y="98" fill="var(--ink-low)" font-size="8">6</text>
  <circle cx="270" cy="150" r="3" fill="var(--ink-low)" opacity="0.6"/><text x="270" y="166" text-anchor="middle" fill="var(--ink-low)" font-size="8">12</text>
  <text x="270" y="188" text-anchor="middle" fill="var(--teal)" font-size="8" font-weight="700">23 sits right beside 0</text>
</svg>`,
    },
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
- **Medium** (15–50): one-hot, unless there is a *real* order (education: high-school < college < grad), in which case **ordinal** encoding respects it. Do not impose an order where none exists — a linear model reads ordinal integers as literal numeric magnitude, so on an *unordered* feature like city, a category coded 49 is treated as having roughly 49x the weighted effect of a category coded 1, purely because of where it landed in an arbitrary label order, not because of any real signal. One-hot avoids this by giving every category its own independent coefficient.
- **High** (50+: cities, merchants): **target encoding** (out-of-fold), or frequency encoding.
- **Very high, with a neural network** (user IDs, product IDs): **embeddings** — the network learns a small dense vector per category, and categories that behave alike end up close together in that space.

[FIGURE: encoding_schemes]

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

Learned embeddings are powerful for neural nets but have their own knobs. **Dimension**: a common heuristic is min(50, cardinality^0.25 × 4) — bigger for higher-cardinality columns, but too large overfits. (The scaling constant varies by source; fastai's alternative rule of thumb is min(50, (cardinality+1)//2).) **Minimum frequency**: categories seen only a handful of times can't learn a good vector, so group rare ones into a shared "rare" token. **Cold start**: a brand-new category at inference has no trained embedding — you need a reserved "unknown" embedding to fall back on. And embeddings need **enough data per category** and some **regularisation** or they memorise. They're not free lunch; they're target encoding's expressive, data-hungry sibling.

---

**Native categorical handling differs by library.**

"The tree library handles categoricals" is true but the *details* differ and matter. **LightGBM** has native categorical splits (good to a few hundred values). **XGBoost** added native categorical support more recently. **CatBoost** is the standout: it uses **ordered target statistics** — it draws a random permutation of the training rows, then encodes each row's category using only the target values of rows that come *before* it in that permutation, so a row's own label is structurally excluded from its own encoding (unlike plain target encoding, where every row's mean includes its own label unless you explicitly hold folds out) — which is why it often wins on categorical-heavy data with minimal preprocessing. So if your data is dominated by high-cardinality categoricals, CatBoost is worth trying specifically for this reason.

---

**Rare categories and new categories in production.**

Two operational rules. **Rare-category policy**: fold categories below a minimum-count threshold into an explicit "Other" bucket rather than trusting three-row estimates. **New-category monitoring**: production will see categories that never appeared in training, and different encodings fail differently — one-hot has no column for an unseen city, so it silently encodes the row as all-zero; ordinal has no integer assigned to it at all; target encoding, hashing, and embeddings each need an explicit fallback (global mean for target encoding, a hash bucket, an "unknown" embedding). Define that fallback *and* monitor the **rate of unseen categories** — a rising unknown rate means your encoding is increasingly guessing, and it's an early signal that the category space has drifted and you should retrain.`,
    keyPoints: [
      `**Use target encoding with out-of-fold isolation for any categorical feature with cardinality above 50 — it is the highest-signal encoding for tree models and takes one line of code with the category-encoders library.**\n\nFor the 5,000-city feature: target encoding produces a single dense column where each city's value reflects actual churn signal from training data. One-hot produces 5,000 sparse columns where most cities have fewer than 20 training examples — a regime that guarantees memorization rather than generalization.`,
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
          `A) Ordinal encoding increases the effective cardinality of the feature space, causing gradient descent on the full 50-city column to converge noticeably more slowly than plain one-hot would.`,
          `B) Ordinal encoding introduces a dummy-variable trap here because the integers 0 through 49 sum to a fixed, predictable total, creating perfect multicollinearity with the model's intercept term.`,
          `C) Ordinal encoding forces the model to treat all 50 cities as equally spaced points on a continuous scale, which slightly underestimates the true effect of the single most common city.`,
          `D) Ordinal encoding assigns integers 0-49 arbitrarily, so linear regression assumes city 49 has 49x the effect of city 1. One-hot avoids this by giving each city its own coefficient instead.`,
        ],
        answer: `D`,
      },
      {
        q: `Walk through exactly why target encoding without cross-validation causes data leakage.`,
        options: [
          `A) Computing the mean target for category X includes the row being trained on — its own label leaks into its own encoded value. Fix: fold-based encoding using training folds only.`,
          `B) Target encoding without cross-validation leaks because the encoding is fitted on the validation set instead of the training set, allowing validation labels to contaminate training feature values.`,
          `C) Target encoding causes leakage by allowing the model to memorize category-level statistics instead of learning the underlying patterns, which inflates training accuracy but not test accuracy.`,
          `D) Target encoding without cross-validation leaks because the global mean target used as a fallback for unseen categories reveals the class balance of the full dataset including the test set.`,
        ],
        answer: `A`,
      },
      {
        q: `At inference time, your model receives a city it has never seen in training. How does each encoding strategy handle this, and which is most robust?`,
        options: [
          `A) All four encoding strategies raise a hard KeyError for unseen categories; the only robust approach is adding an explicit "unknown" category during training with enough examples to learn it.`,
          `B) One-hot encoding and target encoding both fail silently for unseen categories in production; ordinal encoding is actually the most robust since it can always assign the next available integer.`,
          `C) One-hot silently zeroes all indicator columns. Ordinal has no valid integer for a new city. Target encoding falls back to the global mean. Hashing always yields a valid bucket — most robust.`,
          `D) Target encoding is the most robust choice for unseen categories, because its global-mean fallback produces exactly the same prediction as the base rate, which is always the safest default.`,
        ],
        answer: `C`,
      },
      {
        q: `A feature has 5,000 unique merchant IDs and you are training a neural network. Which TWO of the following are true reasons one-hot encoding is a bad choice here?`,
        options: [
          `A) One-hot encoding 5,000 merchant IDs is computationally feasible but semantically wrong — it falsely implies every merchant sits equally distant from every other merchant in feature space.`,
          `B) One-hot on 5,000 IDs creates ~5,000 columns; with 100,000 rows each column averages only 20 non-zero values — an extremely sparse input that neural nets learn poorly from via weak gradients.`,
          `C) One-hot encoding 5,000 IDs creates a dummy-variable trap at scale — the 5,000 columns sum to exactly 1 for every single row, producing perfect multicollinearity that makes gradient descent diverge.`,
          `D) One-hot encoding is a bad choice mainly because merchant IDs change over time as new merchants onboard, requiring the entire model to be retrained from scratch whenever any new merchant appears.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `You target-encode a high-cardinality column and a category that appears only twice in training gets an encoded value equal to those two rows' average outcome — a wild, unreliable estimate. What technique tames this, and how does it work?`,
        options: [
          `A) Drop every category with fewer than 100 rows from the dataset entirely, since rare categories below that threshold can never be encoded reliably by any method available.`,
          `B) Smoothing: (n·cat_mean + m·global_mean)/(n+m). For n=2 the estimate is pulled toward the global mean; large-n categories stay close to their own mean.`,
          `C) Switch entirely to one-hot encoding instead, which by construction never produces unreliable or wildly swinging estimates for rare categories, regardless of how few rows they have.`,
          `D) Multiply every encoded value by the category's raw frequency count, which automatically and correctly down-weights rare categories toward zero during model training.`,
        ],
        answer: `B`,
      },
      {
        q: `Your dataset is dominated by several high-cardinality categorical columns. A colleague suggests CatBoost specifically. What's the technical reason CatBoost is well-suited here?`,
        options: [
          `A) CatBoost one-hot encodes every categorical column internally by default, which is always the mathematically optimal choice regardless of how high the cardinality happens to be.`,
          `B) CatBoost uses ordered target statistics — encoding computed over a randomized row order so each row never sees its own label — avoiding the leakage plain target encoding suffers.`,
          `C) CatBoost simply ignores categorical columns entirely and trains only on the remaining numeric features, which is exactly what prevents it from overfitting to any high-cardinality category.`,
          `D) CatBoost requires no validation set whatsoever, because its internal categorical handling automatically and completely eliminates every possible form of model overfitting on its own.`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      encoding_schemes: `<svg viewBox="0 0 360 210" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">three ways to turn "city" into numbers</text>
  <text x="20" y="42" fill="var(--ink-hi)" font-size="9" font-weight="700">one-hot</text>
  <text x="20" y="54" fill="var(--ink-low)" font-size="8">one column per value - sparse at scale</text>
  <rect x="150" y="34" width="20" height="16" rx="2" fill="var(--prime)" opacity="0.85"/><text x="160" y="46" text-anchor="middle" fill="#fff" font-size="9">1</text>
  <rect x="174" y="34" width="20" height="16" rx="2" fill="var(--depth)" stroke="var(--rim)"/><text x="184" y="46" text-anchor="middle" fill="var(--ink-low)" font-size="9">0</text>
  <rect x="198" y="34" width="20" height="16" rx="2" fill="var(--depth)" stroke="var(--rim)"/><text x="208" y="46" text-anchor="middle" fill="var(--ink-low)" font-size="9">0</text>
  <text x="228" y="46" fill="var(--ink-low)" font-size="8">... x 5000</text>
  <line x1="20" y1="66" x2="340" y2="66" stroke="var(--rim)" stroke-width="0.8"/>
  <text x="20" y="90" fill="var(--ink-hi)" font-size="9" font-weight="700">ordinal</text>
  <text x="20" y="102" fill="var(--ink-low)" font-size="8">one integer - implies a false order</text>
  <rect x="150" y="82" width="60" height="16" rx="2" fill="var(--amber)" opacity="0.85"/><text x="180" y="94" text-anchor="middle" fill="#000" font-size="9" font-weight="700">SF = 37</text>
  <text x="218" y="94" fill="var(--amber)" font-size="8">37x city #1?</text>
  <line x1="20" y1="114" x2="340" y2="114" stroke="var(--rim)" stroke-width="0.8"/>
  <text x="20" y="138" fill="var(--ink-hi)" font-size="9" font-weight="700">target</text>
  <text x="20" y="150" fill="var(--ink-low)" font-size="8">one dense signal-bearing number</text>
  <rect x="150" y="130" width="80" height="16" rx="2" fill="var(--teal)" opacity="0.85"/><text x="190" y="142" text-anchor="middle" fill="#000" font-size="9" font-weight="700">SF churn = .28</text>
  <text x="238" y="142" fill="var(--teal)" font-size="8">out-of-fold!</text>
  <text x="180" y="176" text-anchor="middle" fill="var(--ink-low)" font-size="9">every encoding makes a claim; the wrong claim is learned as true</text>
  <text x="180" y="194" text-anchor="middle" fill="var(--ink-low)" font-size="8">low card -> one-hot | real order -> ordinal | high card -> target (OOF)</text>
</svg>`,
    },
  },
  {
    id: 'feature_scaling',
    interactiveId: 'feature_scaling_viz',
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

**RobustScaler** uses the *median* and the middle-50% spread — the **interquartile range (IQR)**, the span between the 25th and 75th percentiles — instead of the mean and standard deviation. A lone 10-million earner does not budge the median, so the other 99,999 people get scaled sensibly. It is the safe default when real-but-extreme values are present.

---

**When it matters, and when to skip it.**

Scaling is essential whenever a model measures *distances* or is sensitive to feature *magnitude*: kNN, K-Means and other distance-based clustering, SVMs, PCA, gradient-descent-trained linear/logistic regression, and neural networks. (For K-Means, the reason is the same as kNN's: cluster assignment is decided by Euclidean distance, so a large-range feature like income dominates the distance calculation and a small-range feature like age is effectively ignored. For linear and logistic regression trained by gradient descent, an unscaled huge-range feature produces gradient updates on a completely different scale than a small-range feature, so a single learning rate is too large for one and too small for the other — the optimizer crawls instead of converging cleanly; standardizing puts every feature's gradient on a comparable footing. Regularised linear models add a second, separate reason on top of that: fairness — the penalty judges coefficients by size, and an income coefficient is naturally tiny next to an age coefficient, so without scaling the penalty hits them unequally. For neural nets, wildly different input scales make the gradients lurch and training unstable.)

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
      `**Diagnostic: StandardScaler's post-fit variance is exactly 1 by construction on the data it was fit on (Var(z) = Var(x)/std(x)² = 1) — this holds regardless of outliers, so "check that variance ≈ 1" can never actually catch anything and is not a usable diagnostic.**\n\nTo actually screen for outliers, check *before* scaling: flag values beyond roughly 1.5×IQR from the 25th/75th percentiles, or eyeball a boxplot. A second, valid post-hoc check: transform a *held-out* set with the training-fit scaler — if its variance comes out far from 1, that set contains values the training data never saw. Either way, winsorize or log-transform the offending feature before scaling.`,
      `**Preserve sparsity, and remember scaling is mandatory for NNs and material for PCA.**\n\nStandardScaler mean-centering turns a sparse matrix dense (memory blowup) — use \`with_mean=False\` or MaxAbsScaler to keep zeros as zeros for TF-IDF/one-hot data. For neural nets, input scale drives gradient magnitudes, activation saturation, and LR sensitivity, so scaling is effectively required, not just "fair." And PCA is variance-based, so unscaled features let the largest-unit column dominate the components — standardise before PCA or you'll discover the wrong directions. Treat extreme outliers first (winsorize/clip/log), then scale.`,
      `**Scale the right columns (and sometimes the target) inside a pipeline.**\n\nUse a ColumnTransformer to scale numeric columns, encode categoricals, and leave 0/1 flags alone — all fit inside each CV fold via a Pipeline so fit-on-train-only is structural. For regression/NN, scaling the target can stabilise the loss, but you must inverse-transform predictions back to original units before reporting metrics. Don't scale tree-model inputs or binary flags — it changes nothing for trees and is meaningless for 0/1 columns.`,
    ],
    interactivePrompt: `Before you touch the controls: if age ranges from 0 to 100 and annual income ranges from 0 to 500,000 — what does a kNN model actually learn when you do not scale the features?`,
    takeaway: `Unscaled features hand large-magnitude inputs disproportionate control over distance metrics, gradient steps, and regularization penalties — not because they are more important, but because they are measured in larger units.`,
    recap: [
      `**Unscaled features hand large-unit inputs disproportionate control** over distances, gradients, and regularization — not more importance, just bigger units.`,
      `**RobustScaler as the tabular default:** median + IQR, so one \$10M income doesn't crush every other customer toward zero like StandardScaler does.`,
      `**Fit the scaler on train only** — learning test's μ/σ leaks the test distribution into training.`,
      `**Diagnostic:** StandardScaler's post-fit variance is exactly 1 by construction (not a signal) — screen for outliers *before* scaling via the IQR rule, or check a held-out set's transformed variance for values it wasn't fit on.`,
      `**Preserve sparsity:** mean-centering densifies sparse matrices — use \`with_mean=False\` or MaxAbsScaler for TF-IDF/one-hot.`,
      `**Scaling is mandatory for NNs** (gradient magnitudes, activation saturation) and material for PCA (variance-based — standardise first).`,
      `**Scale the right columns via a ColumnTransformer** in a Pipeline; don't scale tree inputs or 0/1 flags — meaningless.`,
    ],
    checkQuestions: [
      {
        q: `You fit a StandardScaler on your entire dataset (train + test combined) before splitting. What exactly is wrong?`,
        options: [
          `A) Computing mean and std over the full dataset means the statistics reflect test values — a leak. Fit the scaler on the training fold only, then apply that same fit to validation and test.`,
          `B) Fitting on the full dataset computes a mean that overrepresents the majority class specifically, causing the scaler to center every feature at a value unrepresentative of the minority class rows.`,
          `C) Fitting the scaler before splitting means you technically cannot reuse the same fitted scaler inside cross-validation folds, forcing a brand-new scaler fit for every single fold, which increases runtime.`,
          `D) The StandardScaler implementation requires a minimum of 1,000 samples per class to compute stable mean and standard deviation estimates; fitting on the smaller full dataset inflates both estimates.`,
        ],
        answer: `A`,
      },
      {
        q: `A K-Means clustering of customer data with features [age (range 20-80), annual_income (range 20,000-200,000)] produces clusters entirely separated by income and ignores age. Why and fix?`,
        options: [
          `A) K-Means computes Euclidean distance — a \$1,000 income gap contributes 1,000 units versus 1 for a 1-year age gap, so income dominates. Fix: standardize both features before clustering.`,
          `B) K-Means assigns cluster membership purely based on whichever feature has the highest raw variance; since income has higher variance than age, it automatically and permanently dominates every boundary.`,
          `C) The clustering is actually correct as-is — income is simply a more important segmentation variable than age for most business use cases, and standardizing would artificially inflate age's importance.`,
          `D) K-Means uses Manhattan distance by default in scikit-learn, which already gives every feature equal weight regardless of scale — the income-dominated clusters suggest age was recorded incorrectly.`,
        ],
        answer: `A`,
      },
      {
        q: `You are doing 5-fold cross-validation and you fit a MinMaxScaler on the full training set before the CV loop. What is the consequence?`,
        options: [
          `A) Fitting the MinMaxScaler before the CV loop means all 5 folds share the same scaling parameters, which reduces variance in the CV estimate but introduces a small amount of pessimistic bias.`,
          `B) The MinMaxScaler fitted before the CV loop will have its parameters invalidated when the CV loop creates train/validation subsets, causing sklearn to automatically refit the scaler on each fold anyway.`,
          `C) MinMaxScaler computes min/max across all 5 folds combined, so fold 1's own values already shaped its scaling parameters before being used as validation — leakage. Fit it inside the CV loop instead.`,
          `D) The consequence is purely computational — fitting the scaler once before the loop is more efficient than fitting it inside each fold, and the accuracy difference is negligible for min-max scaling.`,
        ],
        answer: `C`,
      },
      {
        q: `Why does applying StandardScaler to inputs of a random forest not improve performance, while applying it to logistic regression typically does?`,
        options: [
          `A) StandardScaler improves both model types equally when features have different units; the perceived difference in benefit is due to random forest's higher baseline accuracy masking the improvement.`,
          `B) Random forest splits on thresholds, so raw versus standardized values give the same answer — ordering is preserved. Logistic regression's gradient descent updates a huge-range feature far slower; standardizing fixes that.`,
          `C) Random forest does not benefit from StandardScaler because it uses rank-based splits internally, which are already scale-invariant by design, unlike logistic regression which uses raw feature values.`,
          `D) StandardScaler helps logistic regression only when features have different units (e.g., dollars vs. years); when all features are in the same units, the benefit disappears for both model types.`,
        ],
        answer: `B`,
      },
      {
        q: `You apply StandardScaler to a large sparse TF-IDF matrix and your job runs out of memory. Which TWO of the following correctly explain why and what the fix is?`,
        options: [
          `A) StandardScaler is simply slow on matrices this large; the correct fix is to throw more RAM at the job or shrink the TF-IDF vocabulary to a smaller fixed size before scaling.`,
          `B) StandardScaler subtracts the mean, turning the matrix's many zeros into small non-zero values — the sparse matrix becomes dense, and memory usage explodes from megabytes to gigabytes.`,
          `C) The fix is to scale without centering — StandardScaler(with_mean=False) or MaxAbsScaler — both leave zeros as zeros and fully preserve the matrix's original sparsity structure.`,
          `D) TF-IDF values are already normalized and scaled, so applying StandardScaler on top double-scales them and corrupts the matrix entirely — the scaler should simply be removed.`,
        ],
        answer: ['B', 'C'],
      },
      {
        q: `You're training a neural network to predict house prices that range up to several million. Training is unstable and the loss occasionally explodes. Beyond scaling the inputs, what else should you consider, and what must you not forget?`,
        options: [
          `A) Nothing else needs to change — input scaling is the only factor that ever affects neural network training stability, so scaling just the inputs will fully resolve the instability.`,
          `B) Scale the target too — millions-valued targets destabilize gradients, so standardizing keeps the loss well-conditioned. Inverse-transform predictions to dollars before reporting metrics.`,
          `C) Switch to a tree-based model entirely, since neural networks are fundamentally incapable of handling large-valued regression targets no matter how the inputs or target are scaled.`,
          `D) Multiply the learning rate by the target's maximum observed value to compensate for its scale, while deliberately leaving the target itself completely unscaled during training.`,
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

This one does not touch training at all. A classifier outputs a *probability*; turning it into a yes/no needs a **threshold**, and the default 0.5 is almost never right here. If a missed fraud costs 10,000 and a false alarm costs 50 in review time — a 200:1 asymmetry — you should flag on much weaker suspicion: the cost-minimizing threshold works out to roughly 0.005, not 0.5. The threshold is a *business-cost* decision, not a modeling one: plot precision against recall across thresholds and pick the point that minimises your expected cost.

---

**And above all: stop reporting accuracy.**

The deepest fix is the metric itself. On imbalanced data, use **precision, recall, and PR-AUC**, which actually measure how you do on the rare class. Even ROC-AUC can read a flattering 0.97 while the model catches almost no fraud, because the huge pile of true negatives swamps its denominator. Accuracy on an imbalanced problem is not a partial truth — it is actively misleading.

---

**The fuller metric menu.**

Precision/recall/PR-AUC are the start; know the rest so you can pick the honest single number. **Balanced accuracy** (average recall across classes) doesn't reward always-predict-majority. **MCC** (Matthews correlation) uses all four confusion cells and is often the best single summary under imbalance. **Macro/micro/weighted F1** average per-class F1 differently: macro treats classes equally, weighted scales by class size, and micro pools every prediction into one global count — which collapses to plain accuracy in binary classification, the exact number this module just told you not to trust. **Specificity** (TNR) and the **FPR/FNR** matter when the cost of each error type differs. And when action is capacity-limited — a fraud team reviews the top K — **precision@K**, **recall@K**, and **lift@K** are the right frame, because the model only has to rank the worst cases to the top.

---

**A fair word on ROC-AUC — and how resampling breaks calibration.**

ROC-AUC isn't *useless* under imbalance — it's a valid ranking metric — but it's **misleading** because the huge true-negative pile keeps FPR tiny, so it can read 0.97 while precision is terrible; PR-AUC is usually more informative for rare positives. A subtler cost: **class weighting and resampling distort probability calibration.** Both change the class balance the model trains on, so its predicted probabilities come out too high for the minority class. If you need real probabilities (for cost-based thresholds), **recalibrate** afterward (Platt or isotonic) and check the reliability curve — the ranking may be fine while the numbers lie.

---

**Validating rare events.**

With few positives, careless validation is noise. Use **stratified** splits so every fold holds enough positives (a random split can leave a fold with almost none), prefer **repeated cross-validation** to average out the high variance of a single split, and put **confidence intervals** around recall and precision — "recall 0.8" on 20 positives has an enormous interval. For fraud and any time-ordered data, use a **temporal split** (train on the past, test on the future), because a random split lets the model peek across the fraud timeline.

---

**Sampling alternatives, and losses built for imbalance.**

[FIGURE: resampling]

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
          `C) Check the AUC-ROC score — if AUC-ROC comes back above 0.95, the accuracy figure is meaningful and the model is genuinely distinguishing fraud from legitimate transactions well.`,
          `D) First check the baseline: predicting "not fraud" for everything already yields ~99% accuracy here. Check recall, precision, and AUC-PR directly — they measure performance on the minority class, which accuracy hides.`,
        ],
        answer: `D`,
      },
      {
        q: `Why is applying SMOTE to the full dataset before splitting into train and test sets invalid?`,
        options: [
          `A) SMOTE interpolates between real minority samples. Applied before splitting, synthetic points can land near real test examples, so the holdout is no longer valid. Split first, then SMOTE the training set.`,
          `B) SMOTE applied before splitting is invalid because it changes the class balance of the test set, making it impossible to compute meaningful precision and recall metrics on the held-out data.`,
          `C) SMOTE applied before splitting is invalid because it requires knowing the class labels of the test set, which means the model has implicitly seen the test labels during preprocessing.`,
          `D) SMOTE applied before splitting is mainly computationally wasteful — synthetic samples get discarded once the test set is held out, so applying it inside training alone is simply more efficient.`,
        ],
        answer: `A`,
      },
      {
        q: `Compare class weighting and SMOTE for a 50:1 imbalanced tabular dataset. Which TWO of the following are true?`,
        options: [
          `A) Always use SMOTE for tabular data regardless of minority size — class weighting only adjusts the loss function, while SMOTE physically creates new training examples with real decision-boundary detail.`,
          `B) Class weighting is almost always the first choice for tabular data — no data modification, integrates cleanly with cross-validation, and scales cleanly to any imbalance ratio you throw at it.`,
          `C) SMOTE is worth reaching for specifically when the minority class is genuinely sparse in feature space — say only 50 rows at 50:1 — where reweighting alone can't give the model enough boundary to learn.`,
          `D) Choose between them purely based on model type: class weighting always works best for gradient-boosted trees, while SMOTE always works best for logistic regression and neural networks.`,
        ],
        answer: ['B', 'C'],
      },
      {
        q: `You lower classification threshold from 0.5 to 0.2 and recall increases 0.6 to 0.9 but precision drops 0.8 to 0.3. Is this an improvement?`,
        options: [
          `A) No — the F1 score decreased overall. F1 is the harmonic mean of precision and recall, and a precision drop from 0.8 to 0.3 clearly outweighs a recall gain from 0.6 to 0.9 in the combined score.`,
          `B) Depends entirely on the relative cost of false negatives versus false positives — compute expected cost at each threshold (fraud cost x FN plus review cost x FP) and pick the minimum.`,
          `C) Yes — recall is always the primary metric for fraud detection specifically, so any improvement in recall is unconditionally an improvement in a fraud model, regardless of the precision impact.`,
          `D) Yes — the model now catches 90% of all fraud cases, which comfortably exceeds the widely cited industry-standard threshold of 85% recall required for production fraud systems.`,
        ],
        answer: `B`,
      },
      {
        q: `What is the SMOTE failure mode when minority and majority classes heavily overlap in feature space?`,
        options: [
          `A) When classes overlap heavily, SMOTE generates synthetic samples that become visually indistinguishable from majority examples, causing the model to wrongly learn that entire high-density regions are minority.`,
          `B) Heavy class overlap causes SMOTE to generate synthetic samples that end up as near-exact duplicates of existing minority points, adding no real new geometric information and wasting the oversampling effort.`,
          `C) Heavy class overlap makes SMOTE noticeably slower, because its k-NN search must examine a much larger fraction of the dataset to find each sample's k nearest minority neighbors reliably.`,
          `D) SMOTE interpolates between minority samples. When classes overlap, some sit surrounded by majority points, so synthetic points can land INSIDE the majority region — a signal that SMOTE-ENN later cleans up.`,
        ],
        answer: `D`,
      },
      {
        q: `You fix imbalance with class weighting, and the model's ranking (PR-AUC) is excellent, but downstream cost-based thresholding behaves oddly because the predicted probabilities seem systematically too high for the fraud class. What happened, and what do you do?`,
        options: [
          `A) Nothing is actually wrong here — class weighting mathematically never affects predicted probabilities in any way, so the downstream thresholding logic must simply contain a bug.`,
          `B) Class weighting changes the effective class balance trained on, inflating minority-class probabilities even when ranking is fine. Recalibrate afterward and check the reliability curve.`,
          `C) Switch entirely from class weighting to plain accuracy as the reported metric, which will automatically make the model's predicted probabilities correct again.`,
          `D) The probabilities themselves are completely fine as they are; the real fix is to always use a fixed 0.5 threshold regardless of any underlying business costs involved.`,
        ],
        answer: `B`,
      },
      {
        q: `You have a 1:50,000 imbalance (a few hundred positives in tens of millions of rows) and single-classifier approaches keep failing. What overall design and validation approach fits?`,
        options: [
          `A) Simply crank class_weight higher and higher until a single classifier fully separates the classes — extreme imbalance like this is always solvable given a large enough weight value.`,
          `B) At this rarity, treat it as a systems problem: a two-stage pipeline — a high-recall generator narrows millions to a pool, then a ranker orders it against review capacity.`,
          `C) Randomly undersample the majority class down to a clean 1:1 ratio and train a single logistic regression — this fully and permanently solves extreme imbalance with absolutely no downsides.`,
          `D) Simply report plain accuracy as the headline metric, which at a 1:50,000 imbalance ratio will read near 100% and conclusively prove the model is working correctly.`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      resampling: `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">three ways to rebalance 999 : 1</text>
  <text x="60" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">undersample</text>
  <text x="60" y="52" text-anchor="middle" fill="var(--ink-low)" font-size="8">drop majority</text>
  <g fill="var(--prime)" opacity="0.35"><circle cx="35" cy="70" r="5"/><circle cx="50" cy="70" r="5"/><circle cx="65" cy="70" r="5"/><circle cx="80" cy="70" r="5"/></g>
  <g fill="var(--prime)"><circle cx="42" cy="88" r="5"/><circle cx="72" cy="88" r="5"/></g>
  <circle cx="57" cy="106" r="6" fill="var(--amber)"/>
  <text x="60" y="132" text-anchor="middle" fill="var(--ink-low)" font-size="8">fast, throws</text>
  <text x="60" y="143" text-anchor="middle" fill="var(--ink-low)" font-size="8">data away</text>
  <text x="180" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">oversample</text>
  <text x="180" y="52" text-anchor="middle" fill="var(--ink-low)" font-size="8">duplicate minority</text>
  <g fill="var(--prime)"><circle cx="155" cy="70" r="5"/><circle cx="170" cy="70" r="5"/><circle cx="185" cy="70" r="5"/><circle cx="200" cy="70" r="5"/></g>
  <circle cx="170" cy="90" r="6" fill="var(--amber)"/>
  <circle cx="190" cy="90" r="6" fill="var(--amber)" stroke="var(--amber)" stroke-dasharray="2,2"/>
  <circle cx="180" cy="108" r="6" fill="var(--amber)" stroke="var(--amber)" stroke-dasharray="2,2"/>
  <text x="180" y="132" text-anchor="middle" fill="var(--ink-low)" font-size="8">exact copies -></text>
  <text x="180" y="143" text-anchor="middle" fill="var(--ink-low)" font-size="8">overfit risk</text>
  <text x="300" y="40" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">SMOTE</text>
  <text x="300" y="52" text-anchor="middle" fill="var(--ink-low)" font-size="8">interpolate new</text>
  <circle cx="278" cy="88" r="6" fill="var(--amber)"/>
  <circle cx="322" cy="104" r="6" fill="var(--amber)"/>
  <line x1="284" y1="90" x2="316" y2="102" stroke="var(--teal)" stroke-width="1.2" stroke-dasharray="3,2"/>
  <circle cx="300" cy="96" r="6" fill="var(--teal)"/>
  <text x="300" y="132" text-anchor="middle" fill="var(--ink-low)" font-size="8">synthetic on the</text>
  <text x="300" y="143" text-anchor="middle" fill="var(--ink-low)" font-size="8">line between two</text>
  <text x="180" y="178" text-anchor="middle" fill="var(--ink-low)" font-size="9">all of this happens inside the training fold - never before the split</text>
  <text x="180" y="192" text-anchor="middle" fill="var(--amber)" font-size="8">try class weights first; SMOTE only when the minority is truly sparse</text>
</svg>`,
    },
  },
  {
    id: 'data_splits_and_leakage',
    interactiveId: 'leakage_split_viz',
    title: 'Data Splits and Leakage',
    subtitle: `Understand why models that look great in development fail in production — and the exact mistakes that cause it.`,
    difficulty: 'intermediate',
    estimatedMin: 50,
    tags: ['train-test split', 'cross-validation', 'data leakage', 'temporal leakage', 'overfitting'],
    interactivePrompt: `Before you touch the controls: you split patient records 80/20 at random, trained a readmission model, and got 99% validation accuracy — what would you check before trusting that number?`,
    summary: `You are predicting hospital readmission from records of 5,000 patients — and some patients appear many times, once per visit. You do a normal random 80/20 split, train, and get **99% validation accuracy**. You ship it. Production accuracy: **73%.** Nothing errored. Where did 26 points go?

Here is the leak. Patient 147 has nine visits in your data. The random split scattered seven of them into training and two into validation. So during training the model memorised patient 147 — their exact labs, age, history — and when it "predicted" their two validation visits, it was not generalising to a new patient at all; it was recognising someone it had already studied. Your validation score was partly measuring *memorisation*, and memorisation does not exist in production, where every patient is new. This is **leakage**: information from the evaluation set sneaking into training. It fires no error, the metrics look great, and the model fails on real data. It comes in four flavours.

[FIGURE: leakage_types]

---

**The same entity on both sides.**

That was patient 147: related rows (same patient, user, or household) split across train and test, so the test set is not truly independent — this is **group leakage**. The fix is a **group split** — every row from a given patient goes entirely to one side, so validation always contains patients the model has never seen.

---

**Training on the future.**

With time-ordered data, a random split lets the model train on March to predict January — the reverse of reality, where you never have tomorrow's data today. That's **temporal leakage**. The fix is a **time cutoff**: train on everything before a date, validate on everything after.

---

**The quiet one.**

Fit a scaler (or imputer) on all 5,000 records *before* splitting, and its mean and spread were computed partly from the validation rows — so the training transform is tainted by the data you are supposed to be judging on. This is **preprocessing leakage**. **Target encoding leaks worse, and differently.** A target encoder replaces each category with the *mean of the label* for that category — fit it on all 5,000 records before splitting, and every validation row's encoded value was computed using the labels of the very validation rows it will later be graded on. That is not a distributional statistic sneaking across the boundary like a scaler's mean and spread; it is the label itself, smuggled into a feature column before training even starts. Fit every transformer — scaler, imputer, or target encoder — on the *training* data only, then apply it to validation. A pipeline enforces this so you do not have to remember.

---

**The answer hiding in a column.**

A feature like "rehospitalised_within_30_days" on a readmission-prediction row *is the label wearing a disguise* — it could only be known after the outcome. This is **feature leakage**: any feature that needs knowledge of the future is unavailable at prediction time. The classic tell: a single new feature makes accuracy jump 15 points. Real features never do that.

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

Two final structural traps. **Selection leakage**: correlation filtering, mutual-information ranking, PCA, RFE, and any *target-based* feature selection must happen **inside** the CV folds — pick features using the full data before splitting and you've let the test set influence which features exist. And **production parity**: every feature you keep must be *computable at prediction time* with the same freshness, latency, and timestamp constraints as offline — a feature that's trivial to compute over historical tables but unavailable (or stale) in the real-time path is a leak that only surfaces after deployment. Feature selection itself — which method to use, wrapper versus filter tradeoffs, and stability across resamples — is deep enough to earn its own treatment: that's exactly where the next module, Feature Selection, picks up.`,
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
      `**Group-split shared entities** (patient, user, household) — a random split with 10 rows/patient measures memorization, not generalization.`,
      `**Fit preprocessing inside each CV fold** on the training portion only — scalers and imputers leak distributional stats, target encoders leak the label itself; use a Pipeline so it's structurally impossible to get wrong.`,
      `**Dedupe before splitting** — exact/near-duplicate rows across folds leak like group leakage; augment after the split.`,
      `**Target-leakage test:** "would this value exist at prediction time?" catches post-outcome, label-derived, proxy, and future-window features.`,
      `**Never reuse the test set** — repeated tuning drifts the metric optimistic; touch test once, use nested CV when tuning hard.`,
      `**Do temporal CV with structure:** expanding or sliding windows, a gap/embargo so rolling features can't bleed across the boundary, and backtest across multiple cutoffs — one split is an anecdote.`,
      `**Match the split to deployment:** new users → group split, new sessions → session split, future events → temporal split.`,
      `**Select features inside CV folds, not before:** correlation/MI/PCA/RFE/target-based selection on the full data before splitting lets the test set influence which features exist; every kept feature must also be computable at serving time with production-matching freshness.`,
    ],
    checkQuestions: [
      {
        q: `You build a model to predict customer churn. You include 'support_tickets_after_churn_date' as a feature. The model achieves 98% accuracy. What is the problem?`,
        options: [
          `A) Label leakage: this feature can only be known AFTER the customer churns, so it's essentially the answer in disguise. For a currently active customer it's unavailable, and accuracy collapses once deployed.`,
          `B) The model is simply overfitting to the raw support-ticket count, which is an inherently noisy signal — the fix is adding L2 regularization and capping the feature at the 95th percentile.`,
          `C) The 98% accuracy is actually completely legitimate here — support-ticket behavior is a genuinely strong predictor of churn intent, since dissatisfied customers naturally submit more tickets before leaving.`,
          `D) The feature mainly introduces multicollinearity, since support-ticket count correlates with tenure, causing the model's coefficient estimates to become unstable and the reported 98% accuracy unreliable.`,
        ],
        answer: `A`,
      },
      {
        q: `Why does random train-test splitting fail for time-series forecasting, and what is the correct splitting strategy?`,
        options: [
          `A) Random splitting fails mainly because it changes the class balance between the train and test sets; time-series data instead requires stratified splitting by time period to preserve the distribution.`,
          `B) Random splitting fails because time-series data carries autocorrelation, so randomly shuffled examples violate the independence assumption most ML algorithms rely on, inflating the reported accuracy.`,
          `C) Random splitting shuffles examples across time, so the model might train on March data to predict January — backwards, since March data doesn't exist yet. Correct: temporal split, train on 0 to T, validate afterward.`,
          `D) Random splitting fails mostly because weekly, monthly, and annual seasonality patterns get split across train and test, so the model learns incomplete cycles that never generalize to full ones in production.`,
        ],
        answer: `C`,
      },
      {
        q: `You run 5-fold cross-validation on a medical imaging dataset with 500 patients and 20 images per patient. You get CV accuracy of 94%. You deploy and get 71%. What happened?`,
        options: [
          `A) The 5-fold CV setup simply used too few folds — with 500 patients, 10-fold or full leave-one-out CV is required for a genuinely unbiased estimate, and 5 folds optimistically inflates it.`,
          `B) Group leakage: the random split put different images of the same patient in different folds — the model learned patient traits and validated on patients it already knew. Fix: grouped k-fold.`,
          `C) The model was trained on a dataset drawn entirely from one scanner, but the deployed model encounters images from different scanners — a distribution-shift problem unrelated to the splitting strategy.`,
          `D) The 94% CV accuracy was computed largely on augmented images during training, while the 71% production number reflects the model's true performance on unaugmented images once deployed.`,
        ],
        answer: `B`,
      },
      {
        q: `List three preprocessing operations that can cause leakage when applied before the train-test split.`,
        options: [
          `A) Feature selection, hyperparameter tuning, and model selection all cause leakage specifically when performed repeatedly before the split, because they use test-set performance to guide decisions.`,
          `B) Outlier removal, duplicate detection, and missing-value imputation all cause leakage because each one uses global dataset statistics that structurally incorporate rows from the held-out test set.`,
          `C) Log transformation, binning, and interaction-feature creation all cause leakage because they change the statistical properties of training features based on the entire dataset's distribution.`,
          `D) (1) Scalers fit on the full dataset reflect test statistics. (2) Imputers' fill values are influenced by test rows. (3) Target encoding leaks test-set labels into every row's encoded value.`,
        ],
        answer: `D`,
      },
      {
        q: `What is the correct order of operations for preprocessing inside a k-fold cross-validation loop?`,
        options: [
          `A) For each fold: fit transformers on training indices only, transform both sides with that fit, then train and evaluate — validation uses only training-derived parameters.`,
          `B) Fit all preprocessing transformers on the full training set once before the CV loop begins, then just transform each fold's train and validation portions inside the loop and evaluate normally.`,
          `C) Inside each fold, first evaluate the model on raw, unprocessed validation data to get a baseline score, then fit transformers on the training fold and report the improvement over that baseline.`,
          `D) Fit all preprocessing transformers exactly once on the entire combined dataset — train plus test — before any splitting happens, to keep feature distributions consistent across every fold.`,
        ],
        answer: `A`,
      },
      {
        q: `You aggressively tune hyperparameters and select features by repeatedly checking performance on the same held-out set, then report that set's score as your final number. Which TWO of the following are true?`,
        options: [
          `A) It's not optimistic at all — a held-out set is completely immune to overfitting no matter how many times or how aggressively you evaluate models and tune choices against it.`,
          `B) Repeatedly making choices — architectures, thresholds, feature sets — based on the same held-out set leaks your decisions into it, so its reported score gradually drifts above true performance.`,
          `C) The fix is to touch the final test set only once, and when tuning aggressively, use nested cross-validation — an inner loop for tuning, an outer loop for the honest estimate.`,
          `D) The fix is to report training accuracy instead of any held-out metric, since training accuracy is structurally never affected by how many times the test set gets reused.`,
        ],
        answer: ['B', 'C'],
      },
      {
        q: `You augment your image training set (rotations, crops) and also deduplicate, but do both before the train/validation split. Why can this still leak, and what's the correct order?`,
        options: [
          `A) It genuinely can't leak here — augmentation and deduplication are both standard preprocessing steps that are always completely safe to run before any train/validation splitting occurs.`,
          `B) Augmenting before the split lets copies of one image land on both sides, so validation gets near-duplicates. Correct: dedupe first, split by image, augment training only.`,
          `C) The leak comes only from the random crops, not the rotations, so cropping specifically should be removed while rotation augmentation is safely kept before the split happens.`,
          `D) There's honestly no real fix for this — image augmentation always leaks in some form, so the only safe option is to never augment image data at all, under any circumstances.`,
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
    id: 'feature_selection_data',
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

**L1 (Lasso)** regularisation drives useless features' weights to exactly zero *during* fitting, so selection and training happen in one run — no separate step. The reason is geometric: L1's penalty region is a diamond whose corners sit exactly on the axes, so the optimum often lands on a corner — a weight at exactly zero. (Ridge/L2's penalty region is a smooth sphere with no corners, so the optimum rarely lands on an axis; weights shrink toward zero but almost never reach it, so it does not select.)

---

**Permutation importance — the honest referee.**

Train any model, then *shuffle* one feature's values and see how much performance drops on held-out data. A big drop means the feature was pulling its weight; no drop means it was redundant or noise. This is the method to trust, because it measures real, out-of-sample usefulness — and it catches a nasty trap that tree-based importance falls into. That trap: a tree's built-in importance is biased toward *high-cardinality* columns. Feed it a \`customer_id\` and it will "split" on individual IDs to memorise the training set, scoring the ID as hugely important — while on new customers it is worth exactly nothing. Permutation importance on validation data exposes this instantly (shuffling the ID changes nothing), where the tree's own numbers are fooled.

---

[FIGURE: selection_families]

**The trap that snares all four: correlation is not importance.**

It is tempting to say "these two features are 95% correlated, drop one." Resist it. Two correlated features can still both help — keeping both can make the model steadier when one of them drifts at serving time. Correlation describes the *inputs*; it does not tell you the *predictive contribution*. So decide what to keep by measuring importance directly — permutation importance on validation data — not by eyeballing a correlation matrix.

---

**A separate problem for linear models: multicollinearity.**

Keeping correlated features helps *predictive* stability, but for a *linear* model specifically, near-duplicates (\`height_cm\` and \`height_inches\`, correlated 0.97) create a different failure. The design matrix is nearly singular, so infinitely many weight combinations — a large positive weight on one feature, a canceling negative weight on the other — fit the training data almost equally well. Predictions stay fine; the *individual coefficients* become wildly unstable and impossible to interpret. This is **multicollinearity**, measured by **VIF** (variance inflation factor: \`VIF = 1 / (1 - R²)\`, where R² comes from regressing that feature on the rest) — a high VIF flags exactly this instability, a separate concern from the importance-vs-correlation trap above.

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
          `A) Retaining only 20 features likely dropped several highly correlated features that were providing redundant but stabilizing signal; ridge regression on all 100 would have been a better choice.`,
          `B) The top-20 Pearson correlation cutoff was too aggressive — retaining the top 40 features instead would have preserved enough signal for good performance while still reducing overfitting risk.`,
          `C) Pearson correlation measures linear dependence for a single feature IN ISOLATION and misses interactions and non-linear (U-shaped) relationships. Fix: mutual information or a wrapper method instead.`,
          `D) The model overfit to the 20 selected features because the smaller feature set gave gradient descent fewer parameters to regularize, causing it to memorize the training data more aggressively.`,
        ],
        answer: `C`,
      },
      {
        q: `Why does LASSO shrink some coefficients to exactly zero while Ridge (L2) rarely does?`,
        options: [
          `A) LASSO uses a higher default regularization strength than Ridge, causing more aggressive shrinkage; if Ridge were tuned to the same regularization strength as LASSO, it would also produce exact zeros.`,
          `B) The constraint geometry differs: L2's penalty is a smooth sphere, so the optimum rarely lands on an axis. L1's penalty is a diamond whose corners sit on the axes, producing exact zeros there.`,
          `C) LASSO uses coordinate descent optimization while Ridge uses gradient descent; coordinate descent naturally produces exact zeros as a numerical artifact of updating one coefficient at a time.`,
          `D) LASSO applies the penalty to the raw coefficient values while Ridge applies it to the squared coefficients; squaring small values makes them even smaller, which paradoxically prevents Ridge from reaching zero.`,
        ],
        answer: `B`,
      },
      {
        q: `You compute feature importance from a gradient boosted tree and find that 'customer_id' is the second most important feature. Which TWO of the following are true about what happened and the fix?`,
        options: [
          `A) Customer IDs encode temporal information — older customers have lower IDs and newer ones higher — so the model uses ID as a legitimate proxy for customer tenure, a genuinely predictive signal.`,
          `B) Tree feature importance is biased toward high-cardinality features. customer_id is a unique identifier, so the tree can memorize training rows via it — huge importance at training time, zero generalization.`,
          `C) The real fix is removing identifier columns before training, or using permutation importance instead, which measures actual held-out performance degradation rather than training-time impurity reduction.`,
          `D) The feature-importance computation simply has a bug — customer_id should have been excluded from the matrix before training, and every other feature's score needs recomputing without it.`,
        ],
        answer: ['B', 'C'],
      },
      {
        q: `A linear model has two features that are 0.97 correlated (e.g., 'height_cm' and 'height_inches'). What specific failure mode does this cause and fix?`,
        options: [
          `A) Two near-identical features let the model assign a large weight to one and negative to the other — infinitely many combinations give the same prediction, so coefficients become wildly unstable.`,
          `B) Two near-identical features cause the model to systematically double-count the effect of height, producing coefficients that come out at exactly half the true value for each of the two features.`,
          `C) Near-perfect correlation between the two features causes gradient descent to oscillate noticeably during training, requiring a much smaller learning rate specifically to reach convergence reliably.`,
          `D) Two features with 0.97 correlation will produce a VIF of exactly 16.9, computed as 1/(1-0.97 squared); since this sits below the common 50 threshold, intervention isn't strictly required here.`,
        ],
        answer: `A`,
      },
      {
        q: `You rank all 500 features by mutual information with the target on the full dataset, keep the top 50, then run cross-validation and report the CV score. Why is that score optimistic?`,
        options: [
          `A) It genuinely isn't optimistic here — mutual information is fundamentally an unsupervised metric, so ranking features on the full dataset before splitting simply cannot leak anything.`,
          `B) Feature selection used labels from the whole dataset, including rows that later become CV folds — those folds already helped pick the features. Run the ranking inside each fold instead.`,
          `C) The reported score is optimistic only because keeping just 50 features is too few overall; expanding the kept set to 100 features would completely remove the underlying bias.`,
          `D) Mutual information is simply the wrong metric to use here; switching to plain Pearson correlation while keeping the same overall procedure fully removes the optimism in the score.`,
        ],
        answer: `B`,
      },
      {
        q: `A feature adds a genuine but tiny 0.1% AUC improvement, but computing it at serving time requires a call to a flaky third-party API with 300ms latency. A colleague insists on keeping it "because it helps." How should you frame the decision?`,
        options: [
          `A) Keep it unconditionally — any feature that measurably improves validation AUC, no matter how small the gain, should always be included in the final production model.`,
          `B) Feature selection isn't only accuracy — weigh latency and dependency risk. A 0.1% gain with 300ms and a flaky call usually fails cost-benefit; drop it unless critical.`,
          `C) Keep it, but cache the third-party API response for a full week, which entirely eliminates every dependency and freshness concern for this feature going forward.`,
          `D) The decision here is purely statistical — if the 0.1% AUC gain tests significant at p less than 0.05, keep the feature; operational cost is simply not a modeling concern.`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      selection_families: `<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">four families: 500 features down to 50</text>
  <text x="20" y="42" fill="var(--ink-hi)" font-size="9" font-weight="700">filter</text>
  <text x="90" y="42" fill="var(--ink-low)" font-size="8">score each feature alone - fast, misses interactions</text>
  <rect x="20" y="48" width="320" height="8" rx="2" fill="var(--depth)"/><rect x="20" y="48" width="60" height="8" rx="2" fill="var(--prime)" opacity="0.8"/>
  <text x="20" y="78" fill="var(--ink-hi)" font-size="9" font-weight="700">wrapper</text>
  <text x="90" y="78" fill="var(--ink-low)" font-size="8">RFE: retrain, drop weakest, repeat - model-aware, slow</text>
  <rect x="20" y="84" width="320" height="8" rx="2" fill="var(--depth)"/><rect x="20" y="84" width="200" height="8" rx="2" fill="var(--prime)" opacity="0.8"/>
  <text x="20" y="114" fill="var(--ink-hi)" font-size="9" font-weight="700">embedded</text>
  <text x="90" y="114" fill="var(--ink-low)" font-size="8">L1/Lasso zeroes weak weights during fitting</text>
  <rect x="20" y="120" width="320" height="8" rx="2" fill="var(--depth)"/><rect x="20" y="120" width="120" height="8" rx="2" fill="var(--prime)" opacity="0.8"/>
  <text x="20" y="150" fill="var(--teal)" font-size="9" font-weight="700">permutation</text>
  <text x="105" y="150" fill="var(--ink-low)" font-size="8">shuffle on held-out data - the honest referee</text>
  <rect x="20" y="156" width="320" height="8" rx="2" fill="var(--depth)"/><rect x="20" y="156" width="160" height="8" rx="2" fill="var(--teal)"/>
  <text x="180" y="188" text-anchor="middle" fill="var(--amber)" font-size="8" font-weight="700">all four leak if run on full data before the split - do it inside CV folds</text>
</svg>`,
    },
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

All of this is invisible without monitoring, so detection has to come *before* diagnosis. Watch each important feature's distribution against its training baseline — a common gauge is **PSI** (population stability index): under 0.1 is calm, 0.1–0.2 says "go investigate," and over 0.2 is a retraining trigger. Watch the *prediction* distribution too; if it drifts while the inputs look stable, that is a fingerprint of concept drift. And a neat trick to confirm covariate shift: train a quick classifier to tell "training row" from "production row" — if it succeeds easily, the two worlds really have diverged. Build this monitoring in from day one, or the business will discover the shift before you do.

---

**The three shifts, in notation.**

The names map cleanly to which probability moved. **Covariate shift**: P(X) changes, P(Y|X) holds — the inputs move but the rule is intact. **Label/prior shift**: P(Y) changes, P(X|Y) holds — the class mix moves but each class still looks the same. **Concept drift**: P(Y|X) changes — the *rule itself* moves, which is the one no reweighting can fix. Being able to say "which distribution changed?" is exactly how you pick the response, so it's worth carrying the notation, not just the stories.

---

**Detection has a metric menu, not just PSI.**

PSI is the industry default, but know the alternatives and when they're better. The **KS test** measures the largest gap between two CDFs (good for continuous features) — but its p-value is sample-size-sensitive: with enough production traffic, even a trivial, practically meaningless shift reads as statistically significant, so always check the *magnitude* (e.g. via PSI) before acting on a low p-value alone. **Wasserstein (earth-mover) distance** captures *how far* the mass moved, which PSI's binning can miss. **KL / Jensen-Shannon divergence** quantify distributional difference (JS is symmetric and bounded). **MMD** (maximum mean discrepancy) is a kernel-based two-sample test that works in high dimensions. For **categorical** features, compare frequencies (chi-squared) and watch for new categories. Use several — a shift that hides from one metric often shows in another.

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
          `A) This is covariate shift: P(X) has changed because fraudulent transactions now have different feature distributions overall. It can be fully corrected by importance-weighting old training data to match today's distribution.`,
          `B) This is label shift: P(Y) has changed because the overall fraud rate has decreased as fraudsters succeed at mimicking legitimate transactions. It can be corrected using Black Box Shift Estimation on the predictions.`,
          `C) This is concept drift: P(Y|X) changed — the same feature values now carry a different label, since fraud mimics legitimate patterns. Reweighting can't fix it; only fresh labeled data and retraining work.`,
          `D) This is both covariate shift and concept drift happening simultaneously; the only reliable fix is a complete model rebuild using solely 2024 data, discarding all 2022 training data entirely.`,
        ],
        answer: `C`,
      },
      {
        q: `Describe what happens to a model's confidence scores under distribution shift, and why this makes shift especially dangerous. Which TWO of the following are true?`,
        options: [
          `A) Under distribution shift, model confidence scores reliably decrease toward 0.5 as the model becomes uncertain about unfamiliar inputs, giving a natural alert signal when average confidence drops.`,
          `B) A confidence score is a function of the model's learned parameters applied to the input, not of whether that input resembles training data — shifted inputs can easily land in high-confidence regions.`,
          `C) Unlike a database query that errors on invalid input, the model silently returns a wrong answer at high confidence under shift — only ground-truth labels or distribution-level tests can catch it.`,
          `D) Under mild distribution shift, confidence scores remain essentially stable; only severe shift, roughly PSI above 0.5, causes confidence to diverge from its training-time distribution detectably.`,
        ],
        answer: ['B', 'C'],
      },
      {
        q: `What is the difference between covariate shift and concept drift, and why does the distinction determine whether you can avoid retraining?`,
        options: [
          `A) Covariate shift specifically affects numeric features while concept drift specifically affects categorical features; the distinction determines which reweighting or re-encoding strategy applies.`,
          `B) Covariate shift always happens gradually over months while concept drift always happens suddenly in response to a discrete event; this determines whether to use a sliding window or the full history.`,
          `C) Covariate shift and concept drift are really just two names for the same underlying phenomenon — any input change that degrades performance, both fixed identically by trigger-based retraining.`,
          `D) Covariate shift: P(X) changes but P(Y|X) holds, so old labels stay correct and reweighting fixes it. Concept drift: P(Y|X) changes, so old labels become wrong and fresh data is required.`,
        ],
        answer: `D`,
      },
      {
        q: `You run a KS test comparing training and production distributions of your top 5 features and find p < 0.01 for one feature. What does this mean and what should you do?`,
        options: [
          `A) p < 0.01 lets you reject H0 with 99% confidence, but check MAGNITUDE too — large samples make trivial shifts significant. Use PSI, find the cause, and only retrain if performance actually degraded.`,
          `B) p < 0.01 means the feature distribution has shifted and the model must be immediately retrained before serving any additional predictions — statistical significance at this level indicates the model's outputs are no longer valid.`,
          `C) p < 0.01 is below the standard significance threshold of 0.05, which means the null hypothesis is rejected too strongly — this is likely a false positive caused by the large sample size, and no action is needed unless p < 0.001.`,
          `D) p < 0.01 means the single shifted feature has invalidated the entire model; all 5 features should be re-engineered from scratch using only production data collected after the shift was detected.`,
        ],
        answer: `A`,
      },
      {
        q: `A model deployed in January shows 89% AUC. By June, AUC has drifted to 78%. Feature distribution monitoring shows stable PSI across all features. What type of shift does this suggest?`,
        options: [
          `A) The stable PSI here rules out any possible form of distribution shift entirely — the AUC drop must instead be caused by a bug in the model-serving infrastructure introduced between January and June.`,
          `B) The combination of stable features and degraded performance suggests label shift: P(Y) has risen (fraud rate increased) while P(X|Y) stays stable. Fix: BBSE reweights predicted probabilities without retraining.`,
          `C) Stable PSI but degraded AUC signals concept drift: P(X) is unchanged but P(Y|X) has changed — January's mapping no longer holds. Fix: new labeled data and retraining; PSI alone can't catch this.`,
          `D) Stable PSI with degraded AUC indicates covariate shift specifically in features not currently being monitored — the top 5 are stable but secondary features have shifted. Expand PSI monitoring to all features first.`,
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
  <text x="305" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="8">0.1%</text>
  <text x="345" y="118" text-anchor="middle" fill="var(--ink-low)" font-size="8">0.3%</text>
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

Each data type has its own safe transformations. **Images**: flip, crop, colour jitter. **Text**: back-translation (translate to another language and back to get a natural paraphrase), or swapping in synonyms. **Tabular**: a little random noise on numeric columns, or SMOTE for a rare class (synthesizes new minority-class rows by interpolating between real ones and their nearest neighbors, rather than just duplicating existing rows). **Time series and audio**: shift the pitch, stretch the time, add background noise. In every case, the same rule applies — does the change keep the label true?

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
      `**Start with horizontal flip plus random crop for image tasks where left-right mirroring doesn't change the label — these two augmentations alone capture most of the regularization gain, but flip is invalid whenever orientation carries meaning (letters, digits, dashboard gauges), same as the letter-flip trap above.**\n\nFor the dog/cat classifier: horizontal flip is valid (a flipped dog is still a dog), random crop forces the model to recognize the animal from partial views. Together they drive validation accuracy from 72% to ~83%. More exotic augmentations — CutMix, MixUp, RandAugment — give diminishing returns beyond this baseline. Start with the cheap wins before adding complexity.`,
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
        q: `You are training a digit recognition model and augment by rotating all training images up to 180 degrees. Performance degrades. What went wrong?`,
        options: [
          `A) Rotating training images up to 180 degrees does increase the effective dataset size, but it mainly reduces signal-to-noise, since rotated digits are rarer in the real-world handwritten-digit distribution.`,
          `B) Many digits aren't rotationally invariant to large angles — a "6" rotated 180° looks like a "9," giving conflicting supervision. Modest 10-15° rotations are typically safer for digit recognition.`,
          `C) Rotating by up to 180 degrees is label-safe for every digit except "6" and "9"; the fix is simply applying the same 180-degree rotation to every other digit class while excluding those two.`,
          `D) The 180-degree rotation augmentation is fundamentally correct but was applied too early in training — augmentation should only begin once the model has fully converged on the original, non-augmented data.`,
        ],
        answer: `B`,
      },
      {
        q: `What is Mixup augmentation and why does it act as a regularizer?`,
        options: [
          `A) Mixup randomly selects a subset of training examples and replaces their labels with the mode label of their k-nearest neighbors — it acts as a regularizer by smoothing label noise in the training set.`,
          `B) Mixup applies multiple random augmentations (rotation, flip, crop) to each training image and averages the predictions — it acts as a regularizer by reducing model variance through ensemble averaging during training.`,
          `C) Mixup trains the model on pairs of training examples simultaneously by concatenating them along the feature axis — it acts as a regularizer by exposing the model to longer input sequences than it will encounter at inference time.`,
          `D) Mixup builds new examples by linearly interpolating two training examples — new_x = lambda*x1+(1-lambda)*x2, new_y = lambda*y1+(1-lambda)*y2. It regularizes by forcing smooth, near-linear predictions between training pairs.`,
        ],
        answer: `D`,
      },
      {
        q: `When does augmentation help and when does it not? Which TWO of the following correctly describe a helps-scenario and a doesn't-help-scenario?`,
        options: [
          `A) Augmentation helps when the model OVERFITS — near-perfect training accuracy but poor validation accuracy on a small dataset — since it adds diversity and reduces variance, as in a 500-image medical classifier.`,
          `B) Augmentation does NOT help when the model UNDERFITS — if training accuracy is already only 60%, adding variations of unlearnable data makes the problem harder without fixing the true capacity issue.`,
          `C) Augmentation helps for image and text data but categorically never helps for tabular data, since the lack of spatial or semantic structure means augmented rows never represent realistic variations.`,
          `D) Augmentation helps specifically when validation accuracy sits below 80%; above that fixed threshold, the model is already generalizing well and augmentation provides no further measurable benefit.`,
        ],
        answer: ['A', 'B'],
      },
      {
        q: `Why should augmentation transformations be applied on-the-fly during training rather than pre-computed and saved to disk?`,
        options: [
          `A) Pre-computing augmentations creates files that are simply too large to fit in memory, while on-the-fly augmentation generates only the current batch's versions, meaningfully reducing peak memory usage.`,
          `B) Pre-computed augmentations fundamentally cannot be used with data loaders that shuffle examples each epoch, while on-the-fly augmentation works correctly no matter what shuffling order is applied.`,
          `C) If pre-computed once, the model sees the SAME augmented version every epoch and eventually memorizes it, with no benefit. On-the-fly re-randomizes each step, forcing the model to learn true invariances.`,
          `D) Pre-computed augmentations bias the model toward whichever specific transformations were chosen ahead of time, while on-the-fly augmentation lets the strategy be updated between runs without regenerating data.`,
        ],
        answer: `C`,
      },
      {
        q: `You add strong image augmentation and notice training accuracy dropped from 98% to 88%, while validation accuracy rose from 80% to 86%. A colleague says "training accuracy fell, so the augmentation is too aggressive — turn it down." Are they right?`,
        options: [
          `A) Yes — any drop in training accuracy at all is a direct sign that the augmentation is corrupting labels and must be immediately reduced or removed entirely from the pipeline.`,
          `B) No. Effective augmentation makes examples harder, so training accuracy falling while validation improves is the regularizer working. Too-aggressive augmentation looks different: validation gets worse.`,
          `C) Yes — training and validation accuracy should always rise together under good augmentation, so this kind of divergence between the two curves means something is fundamentally broken.`,
          `D) No, but only because the 88% training accuracy figure is still above the 85% minimum bar required for deployment; if it had fallen below 85% the colleague would actually be right.`,
        ],
        answer: `B`,
      },
      {
        q: `You're augmenting a customer-churn tabular dataset by adding Gaussian noise to numeric columns and using SMOTE for the rare churn class. Why is this riskier than flipping images, and what should you watch for?`,
        options: [
          `A) It genuinely isn't riskier at all — tabular augmentation behaves identically to image augmentation, so adding noise or applying SMOTE is always completely safe regardless of the feature.`,
          `B) Tabular augmentation can create unrealistic records image flips never do — noise can push "age" negative, SMOTE can violate real correlations. Use SMOTE only in training folds.`,
          `C) The only real risk here is that SMOTE runs somewhat slowly on very large tabular datasets; the synthetic records it generates are otherwise always fully realistic and safe.`,
          `D) Tabular augmentation is risky only because it can silently change the number of columns produced, which then breaks the model's expected fixed input shape entirely.`,
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

The core idea is simple: **a model is a function of three things — its training data, its code, and its hyperparameters — and to reproduce a model you must be able to recover all three.** Code versioning (Git) is second nature. The piece teams forget is the *data*. Tools like **DVC** fix this by storing a tiny pointer file — essentially a fingerprint of the dataset — right next to your code in Git, so checking out any past commit gives you back the code and the data's fingerprint from that point; a separate \`dvc checkout\` (or \`dvc pull\`) then materializes the actual data to match it. A tool like **MLflow** captures the third leg, logging each run's code version, data fingerprint, hyperparameters, and results, so any past experiment can be rebuilt from its run ID instead of from memory.

---

**The other silent killer: training-serving skew.**

Here is a failure that bites far more teams than expect it. The logic that computes your features usually gets written *twice* — once in Python for training, once in SQL or Java for the live serving system. Over time the two quietly drift apart: a timezone handled differently, a null treated differently, a rounding difference in an aggregate. Now the model is fed inputs at serving time that are subtly different from anything it trained on. Offline it scores **91%**; in production it scores **77%** — and *nothing errors*.

[FIGURE: train_serving_skew]

There is only one real fix, and it is structural: compute each feature in *one* canonical place that both training and serving use. This is exactly what a **feature store** (Feast, Tecton, Hopsworks) does — it keeps a single definition of each feature and serves it to both the training pipeline and the live system, so the two can never drift apart.

---

**Is this overkill for a small team?**

It is tempting to skip all this as heavyweight process. But the maths is stark. Adding DVC to a repo costs a couple of hours, once. The *first* time a silent data bug causes a production incident without it, you lose days digging — and you may not be able to confidently roll back at all, because you cannot reproduce the good state. A good test of whether you are actually versioned: *could a teammate who was never on the project reproduce this exact model from scratch in half an hour, given only the commit hash?* If not, you do not really have a versioned pipeline yet.

---

**The fourth leg: environment and dependencies.**

Code + data + hyperparameters isn't quite the whole story — the *environment* is a fourth leg of reproducibility. A different scikit-learn version can change a default and shift results; a different CUDA/cuDNN or GPU can change floating-point outputs; an un-pinned dependency can silently upgrade under you. So version the environment too: **lockfiles** (Conda, Poetry, pip freeze), a **Docker image** (or documented base image + CUDA/library versions), and a note of the hardware/runtime. "It reproduced on my machine" isn't reproducibility until the machine itself is pinned.

---

**The model registry and its lifecycle.**

Trained artifacts need governance, which is what a **model registry** (MLflow Registry, SageMaker, Vertex) provides. It tracks each model version through **lifecycle stages** — MLflow's actual stage names are None → Staging → Production → Archived — with **approval gates** between them, one-command **rollback** to a prior version, **lineage** back to the training run, and a **model card** documenting intended use, metrics, and limitations. This is what turns "which model is live and how do I revert it?" from an incident into an API call.

---

**Pipeline orchestration.**

The steps (ingest → features → train → evaluate → deploy) run as an orchestrated **DAG** in tools like Airflow, Prefect, Dagster, or Kubeflow. What the orchestrator buys you: **retries** and failure **alerts**, **scheduling** and **backfills** (re-run a date range after a fix), and — critically — **idempotency** (re-running a step on the same input produces the same output with no duplicates). Without idempotency you can't safely retry, and without alerts a silent stage failure becomes next month's mystery.

---

**Feature store: two stores, freshness, materialization.**

The feature store that cures training-serving skew has real internal structure worth knowing. It has an **offline store** (historical values, point-in-time-correct, for building training sets) and an **online store** (the latest value per entity, low-latency, for serving). **Materialization** is the job that computes features and writes them to both; each feature has a **freshness SLA** and often a **TTL**. The hard parts are keeping online **latency** low and getting **backfill correctness** right — recomputing historical features with point-in-time correctness so training and serving see the same values.

**Point-in-time correctness, spelled out:** it means a feature's value for an example labeled at time T must reflect what was true *as of T* — not a value recomputed later from data that didn't exist yet. Skip this and you get **temporal leakage**: label a purchase example from 6 months ago, but compute its '30-day purchase count' feature from *today's* data, and that count includes purchases the customer made *after* the label date — information the model could never have had at prediction time. The model trains on leaked future signal, looks great offline, then fails once that future data isn't available at serving time.

---

**Data contracts and experiment tracking, spelled out.**

A **data contract** is the enforceable interface a producing team commits to: **schema**, **types**, **null-rate** ceiling, **value ranges**, **cardinality**, **uniqueness**, **volume**, **freshness SLA**, and clear **ownership** — so an upstream breaking change is caught at the boundary. **Experiment tracking** should capture everything needed to rebuild and compare a run: **code commit**, **dataset hash**, **feature-set version**, **config file**, **random seeds**, **split IDs**, **hyperparameters**, **metrics**, and per-slice **evaluation reports**. If a run can't be rebuilt from its logged record alone, the tracking is incomplete.

---

**CI/CD for ML, and end-to-end lineage.**

ML needs its own **CI/CD**: **unit tests** for feature logic, **data-validation tests** on incoming batches, **training smoke tests** (does a tiny run complete?), **model-performance gates** (block deploy if a metric regresses), and **canary** rollouts with automated rollback. Tying it all together is **lineage**: for any production prediction you should be able to trace *backward* — prediction → model version → the exact feature values used → the feature-computation code → the raw data snapshot → the training run. That backward trace is what makes an incident debuggable in hours instead of weeks, and it's the ultimate payoff of versioning code, data, environment, and pipeline together.`,
    keyPoints: [
      `**Add DVC to any project the moment you have a second training run — tracking data versions retroactively is harder than starting upfront. DVC setup is a \`dvc init\` plus a \`dvc add\`/\`dvc.yaml\` entry per dataset — not a Makefile — and it adds no overhead to training itself.**\n\nFor the iOS debugging scenario: \`dvc checkout\` restores the exact dataset used six months ago. Without DVC, the training table has been updated, overwritten, or partitioned differently since then. Reproducing the model state is impossible, not just hard.`,
      `**Trap: versioning model artifacts but not data. If you can reproduce the model checkpoint but not the training data, you cannot audit why the model behaves the way it does. Data versioning is more important than model versioning.**\n\nMLflow saves the trained model weights. DVC saves the dataset hash. You need both. Model weights tell you what the model learned; the dataset hash tells you what it learned from. Without the dataset, you cannot audit for label errors, investigate training distribution, or reproduce a retraining run.`,
      `**Diagnostic: ask yourself "can I reproduce this model from scratch in under 30 minutes?" If the answer is no, you do not have a versioned pipeline.**\n\nThe test is concrete: given only the Git commit hash for a past training run, a colleague who was not on the project should be able to reproduce the model checkpoint within 30 minutes. If this is not possible — because data is untracked, pipeline stages are undocumented, or hyperparameters were set interactively — the pipeline is not versioned in any meaningful sense.`,
      `**Reproducibility has four legs, and production ML needs a registry, orchestration, and a feature store.**\n\nCode + data + hyperparameters + environment — pin dependencies with lockfiles and a Docker image (CUDA/library versions included), since a package bump can silently change results. A model registry manages lifecycle (MLflow's stage names: None → Staging → Production → Archived) with approval gates, one-command rollback, lineage, and model cards. Orchestrators (Airflow/Prefect/Dagster/Kubeflow) give retries, alerts, backfills, and idempotency. The feature store has an offline store (point-in-time history for training) and online store (latest value, low latency for serving), joined by materialization with a freshness SLA.`,
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
          `A) The model likely overfits the offline evaluation set, since the offline pipeline relies on a single fixed train-test split rather than cross-validation, making the 91% AUC estimate optimistically biased.`,
          `B) Training-serving skew: features are computed differently at serving than training. Distributions look stable, but if the VALUES are wrong, the model sees inputs it never trained on.`,
          `C) The 14-point AUC gap is honestly within normal variance for real-world ML deployments and doesn't indicate any specific technical problem — it just reflects the inherent gap between offline and production.`,
          `D) The production AUC drop mainly indicates that the model's hyperparameters were tuned specifically for the offline distribution and now need re-tuning directly on production data before redeployment.`,
        ],
        answer: `B`,
      },
      {
        q: `You need to reproduce a model trained 8 months ago to debug a regression. You have the training code at the exact commit, but you cannot reproduce the results. What is missing?`,
        options: [
          `A) The random seed used during training is missing entirely — without fixing the seed for both the train-test split and model initialization, identical code will still produce a different model.`,
          `B) The exact hyperparameter configuration is missing — without the original learning rate, regularization strength, and tree depth, the same code will simply converge to a different model.`,
          `C) The precise Python package versions are missing — without the exact scikit-learn, pandas, and numpy versions used originally, identical code on a different version produces different numerical results.`,
          `D) Data versioning is missing. Training code alone can't reproduce a model — the exact dataset matters too, and upstream data has likely changed since. Fix: commit a DVC pointer with each run.`,
        ],
        answer: `D`,
      },
      {
        q: `What is point-in-time correctness in a feature store and what goes wrong without it? Which TWO of the following are true?`,
        options: [
          `A) Point-in-time correctness means using feature values AS THEY EXISTED at time T when labeling an example from time T, not their current values assembled months later.`,
          `B) Point-in-time correctness mainly ensures training and serving use the identical timestamp format, UTC versus local time, preventing timezone-related feature skew between the two paths.`,
          `C) Without it, temporal leakage results — using today's "30-day purchase count" to label an example from 6 months ago includes purchases that actually happened AFTER the label date.`,
          `D) Point-in-time correctness mainly ensures the feature store's online layer serves features below the model's latency SLA; without it, spikes force a fallback to default values.`,
        ],
        answer: ['A', 'C'],
      },
      {
        q: `An upstream team renames a column from 'transaction_value' to 'txn_amount' without notifying your team. Your retraining pipeline reads the table into a pandas DataFrame (schema-on-read, no explicit column check) and runs successfully with no errors. Six weeks later, model performance dropped. What happened and how would a data contract have prevented it?`,
        options: [
          `A) The DataFrame lookup for the renamed column returned NaN, since schema-on-read tools like pandas silently fill a missing/renamed column with null rather than raising an error (a SQL engine doing a named-column SELECT would instead reject the query outright). The imputer silently filled it, so the model trained on pure noise. A data contract would fail the pipeline immediately instead.`,
          `B) The pipeline automatically mapped the old column name to the new one using fuzzy string matching, but the mapping introduced a one-day lag that shifted every temporal feature by 24 hours, degrading predictions gradually.`,
          `C) The renamed column caused a schema mismatch that the pipeline silently handled by dropping it entirely; the model retrained without the feature, losing exactly the predictive power attributable to transaction value.`,
          `D) The pipeline cached the old column schema from the previous training run and kept reading correct data for 6 weeks until the cache expired, at which point the mismatch finally surfaced as a drop.`,
        ],
        answer: `A`,
      },
      {
        q: `You can reproduce a model's exact weights from 8 months ago (you versioned code, data, hyperparameters, and seeds), but running the same pipeline today gives slightly different numeric results. What did you likely miss, and how do you fix it?`,
        options: [
          `A) Nothing at all is wrong — identical code, data, and seeds always produce perfectly bit-identical results regardless of everything else, so this must simply be a measurement error.`,
          `B) The environment is unversioned — a different library version, CUDA build, or hardware can change floating-point results even with identical code. Pin it too, with lockfiles and Docker.`,
          `C) The random seed apparently must not have actually been fixed after all; re-fixing the seed correctly is the only thing that genuinely affects reproducibility here.`,
          `D) The dataset hash must have silently changed on its own for some reason; simply recomputing it fresh will make the training results match again exactly.`,
        ],
        answer: `B`,
      },
      {
        q: `Your team can reproduce models but debugging a bad production prediction still takes weeks. What capability is missing, and what does it let you do?`,
        options: [
          `A) You mainly need a faster GPU here — the entire debugging speed problem is purely a raw compute bottleneck that better hardware would directly solve.`,
          `B) End-to-end lineage is missing — tracing a prediction back through model version, features, and raw snapshot to the training run finds root cause in hours, not weeks.`,
          `C) You mainly need to retrain more frequently, which prevents bad predictions from occurring at all and removes the need to debug them after the fact.`,
          `D) You mainly need to disable monitoring entirely, since the constant stream of alerts is what's actually slowing down the team's debugging process the most.`,
        ],
        answer: `B`,
      },
    ],
    figures: {
      train_serving_skew: `<svg viewBox="0 0 360 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:360px;font-family:var(--font-sans,sans-serif)">
  <text x="180" y="16" text-anchor="middle" fill="var(--ink-hi)" font-size="11" font-weight="700">feature logic written twice, drifts apart</text>
  <rect x="20" y="34" width="140" height="40" rx="6" fill="none" stroke="var(--prime)" stroke-width="1.4"/>
  <text x="90" y="52" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">training path</text>
  <text x="90" y="66" text-anchor="middle" fill="var(--ink-low)" font-size="8">Python, batch SQL</text>
  <rect x="200" y="34" width="140" height="40" rx="6" fill="none" stroke="var(--amber)" stroke-width="1.4"/>
  <text x="270" y="52" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">serving path</text>
  <text x="270" y="66" text-anchor="middle" fill="var(--ink-low)" font-size="8">Java, live DB</text>
  <path d="M90,74 V 104" stroke="var(--prime)" stroke-width="1.3"/>
  <path d="M270,74 V 104" stroke="var(--amber)" stroke-width="1.3"/>
  <text x="90" y="120" text-anchor="middle" fill="var(--prime)" font-size="9" font-weight="700">avg = 41.0</text>
  <text x="270" y="120" text-anchor="middle" fill="var(--amber)" font-size="9" font-weight="700">avg = 41.7</text>
  <text x="180" y="120" text-anchor="middle" fill="var(--ink-low)" font-size="12" font-weight="700">≠</text>
  <text x="180" y="140" text-anchor="middle" fill="var(--ink-low)" font-size="8">timezone / null / rounding handled differently</text>
  <rect x="70" y="150" width="220" height="26" rx="6" fill="var(--teal)" opacity="0.15" stroke="var(--teal)" stroke-width="1.2"/>
  <text x="180" y="167" text-anchor="middle" fill="var(--ink-hi)" font-size="9" font-weight="700">fix: one canonical definition (feature store) feeds both</text>
</svg>`,
    },
  },
]
