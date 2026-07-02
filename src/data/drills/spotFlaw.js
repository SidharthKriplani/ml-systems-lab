// spotFlaw.js — normalized JUDGE drills migrated from src/tabs/SpotTheFlawTab.jsx.
// Each source scenario had: setup (often a code block), question, options
// [{category, desc}], correctCategory, reveal, fix, flawCategory.
// Normalization → drillPool.js schema:
//   - subject inferred from the item's topic (data / eval / time_series /
//     causal / monitoring / production).
//   - subtopic: 'spot-the-flaw' for all.
//   - type 'code' when the setup carries a code block (code → `code`, the
//     surrounding prose → `context`); otherwise 'mcq'.
//   - options: plain "category — desc" strings; answer = index of the option
//     whose category === correctCategory.
//   - diagnosis = correctCategory, explanation = reveal, fix = fix.
//   - level: 'senior' for most, 'staff' for the subtle ones.
// SKIPPED: stf18 (recsys-popularity duplicate of the exposure-bias family) and
// stf14 (identical KFold(shuffle=True) time-series scenario to stf6).
// Shape: see drillPool.js header.

export const SPOTFLAW_DRILLS = [
  {
    id: 'flaw-churn-imputer-leakage',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'senior', type: 'code',
    title: 'Churn Model Validation',
    context: 'A data scientist builds a churn prediction model for a telecom company. Here is their validation approach. This model reports 0.94 AUC on the test set.',
    code: `# Load full dataset (100,000 customers)
df = pd.read_csv('customers.csv')

# Feature engineering on full dataset
df['avg_monthly_spend_trend'] = df.groupby('customer_id')['monthly_spend'].transform(lambda x: x.diff().mean())
df['days_since_last_contact'] = (pd.Timestamp.today() - df['last_contact_date']).dt.days

# Impute missing values on full dataset
imputer = SimpleImputer(strategy='mean')
df[feature_cols] = imputer.fit_transform(df[feature_cols])

# Split AFTER preprocessing
X_train, X_test, y_train, y_test = train_test_split(df[feature_cols], df['churned'], test_size=0.2, random_state=42)

# Train and evaluate
model = GradientBoostingClassifier()
model.fit(X_train, y_train)
print(f"Test AUC: {roc_auc_score(y_test, model.predict_proba(X_test)[:,1])}")
# Output: Test AUC: 0.94`,
    question: 'This model reports 0.94 AUC on the test set. What is the buried flaw?',
    options: [
      'Data Leakage — Information from the test set contaminated training',
      'Evaluation Error — The evaluation protocol produces inflated results',
      'Distribution Shift — Train and serve distributions differ',
      'Metric Mismatch — AUC is the wrong metric for this problem',
      'Labeling Artifact — The churn labels are systematically biased',
    ],
    answer: 0,
    diagnosis: 'Data Leakage',
    explanation: 'The imputer is fit on the full dataset (including the test set) before the train/test split. `imputer.fit_transform(df[feature_cols])` computes the mean from all 100,000 rows — including the 20,000 test rows. The imputed mean for training data is therefore contaminated with test set statistics. The model learns from features that encode information about the test set. The reported 0.94 AUC is optimistic and will not generalise.',
    fix: 'Fit the imputer on the training set only, then apply (transform only) to the test set: `imputer.fit(X_train)` then `imputer.transform(X_test)`. Same applies to scalers, encoders, and any other stateful preprocessing step. The split should happen before any fit operation.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-ab-test-peeking',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'senior', type: 'mcq',
    title: 'A/B Test Readout',
    context: `An analyst runs an A/B test for a new recommendation algorithm. Results after 7 days:

Control (n=45,230): Conversion rate = 3.21%
Treatment (n=44,891): Conversion rate = 3.47%

Statistical test: two-proportion z-test
p-value: 0.031
Decision: Ship the treatment — statistically significant at alpha=0.05.

Note: The analyst checked results on Day 3 (p=0.12, not significant),
Day 5 (p=0.08, not significant), and Day 7 (p=0.031, significant).`,
    question: 'The analyst declares the test a win at Day 7. What is the buried flaw?',
    options: [
      'Data Leakage — Test group data leaked into control group',
      'Evaluation Error — The evaluation protocol inflates significance',
      'Distribution Shift — User distribution changed during the test',
      'Metric Mismatch — Conversion rate is the wrong success metric',
      'Labeling Artifact — Conversions were miscounted or mislabeled',
    ],
    answer: 1,
    diagnosis: 'Evaluation Error',
    explanation: 'Peeking and optional stopping: checking the p-value at Day 3, Day 5, and Day 7 and stopping when it first crosses 0.05 inflates the false positive rate. Each check is an independent hypothesis test. Running three tests at alpha=0.05 gives a family-wise error rate of approximately 1 - (0.95)^3 approximately 14%. The observed p=0.031 does not represent a 3.1% false positive rate — it represents a much higher rate because the analyst implicitly ran three tests.',
    fix: 'Pre-register the test duration before starting — do not check for significance until the pre-specified end date. If sequential testing is required (e.g. for fast-moving products), use a sequential testing framework (e.g. always-valid p-values, mSPRT) that controls false positive rate under continuous monitoring. The rule: decide the end date before seeing any data.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-fraud-accuracy',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'senior', type: 'mcq',
    title: 'Fraud Detection Model',
    context: `A team builds a real-time fraud detection model for a payments company.

Business context:
- Fraud rate: 0.08% of transactions
- Cost of a missed fraud: $250 average transaction value
- Cost of a false positive (blocking a legitimate transaction): $0 direct cost, but estimated $15 customer friction cost

Model results:
- Accuracy: 99.93%
- The model flags 0.02% of transactions as fraud
- The team declares success and ships to production

Post-deployment: fraud losses increase 40% compared to the rule-based system it replaced.`,
    question: 'Why did the model fail despite 99.93% accuracy?',
    options: [
      'Data Leakage — Training data included future fraud labels',
      'Evaluation Error — The test set was not representative',
      'Distribution Shift — Fraud patterns changed after deployment',
      'Metric Mismatch — Accuracy is the wrong metric for imbalanced fraud detection',
      'Labeling Artifact — Fraud labels were systematically wrong',
    ],
    answer: 3,
    diagnosis: 'Metric Mismatch',
    explanation: 'With 0.08% fraud rate, a model that predicts "not fraud" for every transaction achieves 99.92% accuracy. The deployed model (99.93% accuracy, flagging 0.02% of transactions) is essentially a slightly better version of the all-negative baseline — it catches almost no fraud. Accuracy on imbalanced data rewards the majority class. The model optimised for the wrong objective.',
    fix: 'For fraud detection, the relevant metrics are: Recall (what fraction of actual fraud did we catch?) and Precision (of flagged transactions, how many are real fraud?). At 0.08% fraud rate with asymmetric costs ($250 fraud miss vs $15 false positive), the decision threshold and loss function should reflect the cost ratio. Use F-beta score with beta > 1 to weight recall higher, or directly optimise expected cost: E[cost] = FN_rate * $250 + FP_rate * $15.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-nlp-byline-source',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'staff', type: 'mcq',
    title: 'NLP Feature Importance',
    context: `A team builds a document classifier to predict whether a news article is about finance or sports.

Feature engineering:
- TF-IDF on article body (10,000 features)
- Article length, sentence count
- Named entity count

They run feature importance on the trained model. Top 5 features:
1. "earnings" (TF-IDF) — importance: 0.089
2. "quarterback" (TF-IDF) — importance: 0.071
3. "fiscal" (TF-IDF) — importance: 0.068
4. "Reuters" (TF-IDF) — importance: 0.061  <- byline word
5. "touchdown" (TF-IDF) — importance: 0.055

Test accuracy: 98.7%

The team ships the model. In production on a new news source, accuracy drops to 71%.`,
    question: 'What caused the production accuracy drop?',
    options: [
      'Data Leakage — A feature encodes information not available at prediction time',
      'Evaluation Error — The test set was constructed incorrectly',
      'Distribution Shift — The new news source uses different vocabulary',
      'Metric Mismatch — Accuracy is the wrong metric for document classification',
      'Labeling Artifact — The training labels were systematically biased by source',
    ],
    answer: 2,
    diagnosis: 'Distribution Shift',
    explanation: 'The model learned "Reuters" as a top-5 feature for finance articles — because Reuters was the dominant source for finance content in the training data. "Reuters" is a data source artifact, not a semantic finance signal. The model learned the byline, not the content. When deployed on a new source (not Reuters), this spurious feature provides zero signal, and the model loses a top-5 predictor. This is a form of distribution shift where the covariate distribution (source/byline) differs between train and serve.',
    fix: 'Audit feature importance for spurious correlates: any feature that is a proxy for the data source, labeling process, or collection method rather than the actual semantic signal is a red flag. Remove or exclude byline, author, publication name, and timestamp features unless they are genuinely available and meaningful at serving time. Add a source-stratified cross-validation to detect this class of overfitting earlier.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-recsys-offline-exposure',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'staff', type: 'mcq',
    title: 'Recommendation System Offline Eval',
    context: `A team evaluates a new recommendation model offline before A/B testing. They use a held-out test set from the last 30 days.

Evaluation protocol:
- Training set: user interactions from months 1-10
- Test set: user interactions from month 11 (held out)
- Metric: Precision@10 — for each user, what fraction of top-10 recommendations did the user interact with?

New model Precision@10: 0.31
Old model Precision@10: 0.24

The team concludes the new model is 29% better and starts an A/B test.
The A/B test shows no significant improvement.`,
    question: 'Why did offline eval not predict A/B test results?',
    options: [
      'Data Leakage — Test items appeared in the training data',
      'Evaluation Error — The offline eval protocol has a structural flaw',
      'Distribution Shift — User preferences changed between months',
      'Metric Mismatch — Precision@10 is the wrong metric for recommendations',
      'Labeling Artifact — User interaction labels are biased by the existing recommender',
    ],
    answer: 4,
    diagnosis: 'Labeling Artifact',
    explanation: 'The test set labels (user interactions) were generated by the OLD recommendation model — users only interacted with items that the old model showed them. Items the old model never recommended have zero interactions in the test set, regardless of how relevant they actually are. The new model is evaluated against a label set that is systematically biased toward items the old model preferred. This is "exposure bias" — offline eval rewards models that agree with the old model, not models that find genuinely better items.',
    fix: 'This is a fundamental problem with offline evaluation of recommendation systems. Mitigations: (1) Use counterfactual evaluation (IPS — Inverse Propensity Scoring) to reweight test interactions by the probability that the old model would have shown that item. (2) Evaluate only on a random exploration slice of traffic where items were shown randomly (removes exposure bias). (3) Accept that offline eval is directionally useful but not predictive of online gains — always A/B test.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-timeseries-kfold-shuffle',
    subject: 'time_series', subtopic: 'spot-the-flaw', level: 'senior', type: 'code',
    title: 'Time Series Forecasting Evaluation',
    context: 'A team builds a 7-day sales forecast model. They evaluate using k-fold cross-validation. In production, MAE is consistently 380-420 — far above the CV MAE of 142.',
    code: `from sklearn.model_selection import KFold, cross_val_score
from sklearn.ensemble import GradientBoostingRegressor

kf = KFold(n_splits=5, shuffle=True, random_state=42)
model = GradientBoostingRegressor()
scores = cross_val_score(model, X, y, cv=kf, scoring='neg_mean_absolute_error')
print(f"CV MAE: {-scores.mean():.2f} +/- {scores.std():.2f}")
# Output: CV MAE: 142.30 +/- 18.4

# In production, MAE is consistently 380-420`,
    question: 'Why does production MAE (380-420) far exceed CV MAE (142)?',
    options: [
      'Data Leakage — Future data leaked into the training features',
      'Evaluation Error — The cross-validation protocol is wrong for time series',
      'Distribution Shift — Sales patterns changed after deployment',
      'Metric Mismatch — MAE is the wrong metric for sales forecasting',
      'Labeling Artifact — Sales labels were recorded incorrectly',
    ],
    answer: 0,
    diagnosis: 'Data Leakage',
    explanation: '`KFold(shuffle=True)` randomly assigns data points to folds regardless of time order. This means validation folds contain data from the past that is used to evaluate predictions about the "future" — but the "future" data was used to train the model on other folds. The model sees future data during training (from validation fold data in other splits), producing an optimistic CV estimate. In production, the model has never seen future data — it is a genuinely harder task.',
    fix: 'Use `TimeSeriesSplit` instead of `KFold` for time series data: `from sklearn.model_selection import TimeSeriesSplit`. This ensures training data always precedes validation data temporally. Better: implement a proper walk-forward validation that mimics production: train on months 1-N, evaluate on month N+1, advance by one month, repeat.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-medical-transfer-population',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'senior', type: 'mcq',
    title: 'Transfer Learning for Medical Imaging',
    context: `A team fine-tunes ResNet-50 (pretrained on ImageNet) for chest X-ray pneumonia detection.

Training data: 5,216 X-rays from Hospital A (pediatric patients, ages 1-5)
Test accuracy: 92.3% (evaluated on Hospital A held-out set)

The model is deployed to Hospital B (adult patients).
Hospital B accuracy: 61.4%

The team is surprised — the model was tested rigorously with a proper train/test split.`,
    question: 'What caused the 31-point accuracy drop at Hospital B?',
    options: [
      'Data Leakage — Hospital B patients appeared in the training data',
      'Evaluation Error — The 92.3% test accuracy was computed incorrectly',
      'Distribution Shift — The model was trained on a population it was not deployed on',
      'Metric Mismatch — Accuracy is the wrong metric for medical diagnosis',
      'Labeling Artifact — Pneumonia labels differed between hospitals',
    ],
    answer: 2,
    diagnosis: 'Distribution Shift',
    explanation: 'The training data was exclusively pediatric patients (ages 1-5) from Hospital A. Pediatric chest X-rays differ substantially from adult X-rays: rib cage proportions, heart size relative to lung field, diaphragm position, and the presentation of pneumonia all differ by age. The model learned features specific to pediatric anatomy that do not transfer to adult patients. The 92.3% test accuracy was valid for Hospital A pediatric patients — it was never a valid estimate for Hospital B adults.',
    fix: 'Before deploying any model, characterise the training distribution and the serving distribution. Key dimensions for medical imaging: age range, sex, scanner manufacturer, imaging protocol, institution. If the deployment population differs from training on any of these dimensions, the test accuracy does not apply. Either collect representative training data, or at minimum, report performance metrics broken down by the relevant demographic dimensions. Never report a single aggregate accuracy for a model deployed across heterogeneous populations.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-clv-survivorship',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'staff', type: 'mcq',
    title: 'Customer Lifetime Value Model',
    context: `A team builds a Customer Lifetime Value (CLV) model to predict 12-month revenue per customer. Labels are constructed as:

clv_label = sum(transactions['amount']) for the next 12 months

Training data: customers acquired in Year 1 and Year 2.
The model predicts high CLV for customers with many small transactions.

In production, marketing uses the model to identify high-value customers for a premium tier invitation. Invited customers have much lower actual CLV than predicted.`,
    question: 'What is the flaw in the CLV label construction?',
    options: [
      'Data Leakage — Future transaction data was used in training features',
      'Evaluation Error — The model evaluation metric was incorrect',
      'Distribution Shift — Customer behavior changed between training and serving',
      'Metric Mismatch — Total transaction amount is the wrong definition of CLV',
      'Labeling Artifact — The label construction introduces a systematic bias',
    ],
    answer: 4,
    diagnosis: 'Labeling Artifact',
    explanation: 'The training data only includes customers who were retained for a full 12 months — customers who churned before 12 months have no complete label and are excluded from training. This creates survivorship bias: the model is trained exclusively on customers who stayed, and never sees examples of high-initial-spend customers who churned after 2 months. The model learns to predict CLV for retained customers, not for the full acquisition cohort. High-frequency small-transaction customers tend to be retained (habit-based), creating a spurious correlation between transaction frequency and CLV.',
    fix: 'Include churned customers in training with their partial CLV labels. Use a survival analysis approach (e.g. Weibull regression, or a two-stage model: predict churn probability x predicted spend if retained). Alternatively, use a shorter label window (e.g. 30-day or 90-day revenue) that allows inclusion of all customers regardless of churn timing. Audit the training set for survivorship bias before finalising any label construction for long-horizon prediction tasks.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-sentiment-domain-shift',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'senior', type: 'mcq',
    title: 'Sentiment Analysis Deployment',
    context: `A sentiment analysis model is trained on Amazon product reviews (5-star scale, labeled positive/negative). Training accuracy: 94.1%.

The model is integrated into a customer support system to classify support tickets as positive (resolved, happy) or negative (unresolved, frustrated).

Production accuracy on support tickets: 58.3% — barely better than random.`,
    question: 'Why does a 94.1% accurate model perform at chance on support tickets?',
    options: [
      'Data Leakage — Support ticket text appeared in the training data',
      'Evaluation Error — The 94.1% accuracy was computed on a biased test set',
      'Distribution Shift — Product reviews and support tickets are different text distributions',
      'Metric Mismatch — Accuracy is the wrong metric for sentiment analysis',
      'Labeling Artifact — Support ticket labels are systematically wrong',
    ],
    answer: 2,
    diagnosis: 'Distribution Shift',
    explanation: 'Product reviews and support tickets are completely different text distributions. Reviews use consumer language ("great product", "works perfectly", "terrible quality"). Support tickets use transactional language ("order #12345 not received", "please cancel", "how do I return"). Positive/negative in reviews maps to product satisfaction; positive/negative in support tickets maps to resolution status — an entirely different construct. The model learned review-domain features that have no signal in the support-ticket domain.',
    fix: 'Domain mismatch is one of the most common NLP deployment failures. Before deploying any text model to a new domain, run an embedding similarity check: are the new domain texts similar to training texts in the embedding space? If not, the model will not transfer. The correct approach: collect and label a representative sample of support tickets, fine-tune the model on that domain, and evaluate on held-out support tickets specifically.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-permutation-correlated',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'staff', type: 'mcq',
    title: 'Feature Importance for Model Debugging',
    context: `A team uses permutation feature importance to understand their credit scoring model and identify potentially discriminatory features.

Results show:
- "zip_code" has very low importance (0.002)
- "income" has high importance (0.18)

The team concludes zip_code is not being used meaningfully and the model is not using geography as a proxy for race.

Regulators later find the model produces systematically different scores by geography.`,
    question: 'Why did low permutation importance not mean zip_code was unimportant?',
    options: [
      'Data Leakage — Zip code information leaked through another feature',
      'Evaluation Error — Permutation importance gives misleading results for correlated features',
      'Distribution Shift — Geographic patterns changed after model training',
      'Metric Mismatch — The wrong importance metric was used',
      'Labeling Artifact — Credit labels are biased by geography',
    ],
    answer: 1,
    diagnosis: 'Evaluation Error',
    explanation: 'Permutation importance underestimates the importance of correlated features. When zip_code is permuted (shuffled), the model can partially recover the geographic signal from correlated features: income, home value, employment type, education. The model does not need zip_code once these correlates are available. Permutation importance measures "how much does the model depend on this feature given all other features are available" — not "does the model use geographic information." The model encodes geographic information through its correlates, and permutation importance misses this entirely.',
    fix: 'For fairness audits, permutation importance is insufficient. Use: (1) Conditional importance: measure importance of zip_code after removing correlated features. (2) Subgroup analysis: directly compute model outputs by geographic region and test for disparate impact. (3) Causal feature attribution: use SHAP interaction values to detect how zip_code interacts with other features. Regulatory compliance requires outcome testing, not just feature importance analysis.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-ndcg-offline-online',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'staff', type: 'code',
    title: 'Ranking Model: Offline Wins, Online Drops',
    context: 'A recsys team trains a new ranking model. Offline NDCG@10 improves from 0.41 to 0.47 — a +14.6% lift. They ship to production via A/B test. After 7 days, CTR in the treatment arm is 2.1% vs 2.3% in control — a statistically significant -8.7% drop. The team is confused: how can offline quality improve while online engagement drops?',
    code: `# Offline evaluation
offline_results = {
  'control':   {'NDCG@10': 0.41, 'Precision@5': 0.38},
  'treatment': {'NDCG@10': 0.47, 'Precision@5': 0.44}
}

# Online A/B results (7 days, n=2.1M impressions)
online_results = {
  'control':   {'CTR': 0.023, 'Sessions': 1_050_000},
  'treatment': {'CTR': 0.021, 'Sessions': 1_050_000}
}
# p-value for CTR difference: 0.003 (significant)`,
    question: 'Offline NDCG improved +14.6% but online CTR dropped -8.7%. What is the buried flaw?',
    options: [
      'Data Leakage — The offline test set contained items seen during training',
      'Evaluation Error — The A/B test was not run long enough to be valid',
      'Distribution Shift — User preferences changed between offline eval and the A/B test',
      'Metric Mismatch — NDCG and CTR measure different things — offline quality does not predict online engagement',
      'Labeling Artifact — Click labels in the offline dataset are systematically biased',
    ],
    answer: 3,
    diagnosis: 'Metric Mismatch',
    explanation: 'NDCG measures ranking quality of items the user eventually clicked, using a static offline log. It does not measure whether the ranked items are ones the user would click on a fresh visit. The new model may surface more "relevant-looking" items that are less novel or less clickable in context — improving recall of historically clicked items but hurting discovery. Offline NDCG and online CTR are measuring different things.',
    fix: 'Pair offline NDCG with online-proxy metrics like expected CTR from a click prediction model applied to the ranked slate. Run interleaving experiments before full A/B to catch metric divergence cheaply. Track diversity and novelty alongside relevance — a model that over-indexes on known preferences may have high NDCG but low discovery value.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-annotator-majority-vote',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'staff', type: 'code',
    title: 'Medical Imaging: Annotator Majority-Vote Bias',
    context: 'A team trains a chest X-ray classifier for pneumonia detection using labels from 3 radiologists (majority vote). The model achieves 94% accuracy on held-out test data. In clinical pilot, sensitivity on actual pneumonia cases is 61% — meaning 39% of pneumonia cases are missed. The held-out test set was labeled by the same 3 radiologists using the same majority-vote protocol.',
    code: `# Label distribution analysis
label_stats = {
  'annotator_agreement_rate': 0.71,  # all 3 agree
  'split_2_vs_1':            0.29,  # majority vote resolves these
  'positive_label_rate':     0.18   # 18% pneumonia in training set
}

# Model performance
train_accuracy = 0.94
test_accuracy  = 0.94  # same 3 annotators, same protocol
clinical_sensitivity = 0.61  # true positive rate on real cases`,
    question: 'The model achieves 94% test accuracy but only 61% clinical sensitivity. What is the buried flaw?',
    options: [
      'Data Leakage — Test images were used during model training',
      'Evaluation Error — The test set is too small to be statistically valid',
      'Distribution Shift — Clinical pilot patients differ from training hospital patients',
      'Metric Mismatch — Accuracy is the wrong metric for medical diagnosis',
      'Labeling Artifact — The majority-vote protocol encodes systematic annotator error, not ground truth',
    ],
    answer: 4,
    diagnosis: 'Labeling Artifact',
    explanation: '94% test accuracy is meaningless here because the test set uses the same labeling protocol as training. The 29% of cases where annotators disagreed (2-vs-1) were resolved by majority vote — but majority vote does not resolve clinical ground truth. If two radiologists systematically miss early-stage pneumonia and one catches it, majority vote always labels those cases as negative. The model learns to replicate systematic annotator error, not actual pathology. Test accuracy measures agreement with annotators, not diagnostic accuracy.',
    fix: 'Use adjudicated labels for the test set — cases where annotators disagree should be resolved by a senior radiologist or confirmed via follow-up imaging (CT, biopsy). Never share labeling protocol between train and test when the protocol itself may carry systematic error. Track sensitivity and specificity separately, not just accuracy — in imbalanced clinical tasks, accuracy can look high while sensitivity is dangerously low.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-target-leakage-credit',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'senior', type: 'code',
    title: 'Target Leakage in Credit Scoring',
    context: 'A team builds a credit default prediction model for a lending platform. The target label is `default_90d` — whether the borrower missed payments for 90+ consecutive days. The model reports 0.987 AUC in evaluation but 0.71 in production.',
    code: `feature_cols = [
  'annual_income', 'debt_to_income', 'credit_score',
  'num_open_accounts', 'total_credit_limit',
  'days_past_due',          # <-- days since last missed payment
  'num_delinquencies_2yr',  # <-- delinquency count last 2 years
  'outstanding_balance',
]

model = XGBClassifier()
model.fit(X_train, y_train)
print(f"Test AUC: {roc_auc_score(y_test, model.predict_proba(X_test)[:,1])}")
# Output: Test AUC: 0.987

# Feature importance — top 3:
#   days_past_due          0.61
#   num_delinquencies_2yr  0.14
#   credit_score           0.06`,
    question: 'The model reports 0.987 AUC in evaluation but 0.71 in production. What is the buried flaw?',
    options: [
      'Data Leakage — Information from the test set contaminated training',
      'Evaluation Error — The evaluation protocol produces inflated results',
      'Distribution Shift — Train and serve distributions differ',
      'Metric Mismatch — AUC is the wrong metric for this problem',
      'Labeling Artifact — The default labels are systematically biased',
    ],
    answer: 0,
    diagnosis: 'Data Leakage',
    explanation: '`days_past_due` is a direct proxy for the target label. A borrower who is 90+ days past due IS the event being predicted — the feature is derived from the same underlying event as the label. At training time, the snapshot of `days_past_due` is taken after default has already occurred; at serving time, you are predicting before default occurs. The model achieves 0.987 AUC not because it is powerful, but because it is essentially reading the answer off the label. At serve time, `days_past_due` reflects current (pre-default) payment history — a fundamentally different signal — and the model collapses.',
    fix: 'Audit every feature for causal ordering: does this value become observable before or after the label is determined? Apply a strict point-in-time constraint — all features must reflect the state of the world at the moment of application (loan origination), not the state at label assignment (90 days later). Remove any feature derived from payment behavior that occurs after origination. Use a timeline diagram: draw the prediction point and the label point; every feature must sit to the left of the prediction point.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-icu-ventilator-confounder',
    subject: 'causal', subtopic: 'spot-the-flaw', level: 'staff', type: 'mcq',
    title: 'Spurious Correlation: ICU Ventilator Survival',
    context: `A hospital system trains a mortality prediction model using 3 years of ICU admissions (n=18,400 patients).

Top predictors from the trained logistic regression (positive coefficient = lower mortality risk):

Feature                    Coefficient
-----------------------------------------
ventilator_support          +0.41   <-- more ventilation = lower mortality?
vasopressor_count            -0.38
age                          -0.29
sofa_score                   -0.44
days_in_icu                  +0.18

The team validates on a held-out ICU cohort and achieves AUC = 0.81.
They are excited: ventilator support appears protective.

When the model is piloted at a community hospital (lower-acuity ICU), it systematically underestimates mortality for the sickest patients.`,
    question: 'Why does ventilator support appear protective in training, and why does the model fail at the community hospital?',
    options: [
      'Data Leakage — Future clinical outcomes leaked into training features',
      'Evaluation Error — The held-out validation set was constructed incorrectly',
      'Distribution Shift — The model learned a spurious correlation specific to the training ICU',
      'Metric Mismatch — AUC is the wrong metric for mortality prediction',
      'Labeling Artifact — Mortality labels were inconsistently recorded across units',
    ],
    answer: 2,
    diagnosis: 'Distribution Shift',
    explanation: 'At the training hospital (a tertiary academic center), ventilators are preferentially allocated to patients who are sick but recoverable — patients who are too sick to survive are often not intubated (comfort care decisions, palliative pathways). The population on ventilators is therefore systematically less likely to die not because ventilation is protective, but because the sickest patients are absent from the ventilated group. The model learns a hospital-specific triage policy, not a physiological relationship. At the community hospital, triage protocols differ — more patients are intubated regardless of prognosis — and the spurious protective signal inverts.',
    fix: 'Causal audit every feature that reflects a clinical intervention: interventions are decided by clinicians who already have a prognosis estimate. Use causal DAGs to identify confounders. Before deploying to a new hospital, compare the feature distributions (especially intervention rates) between the training hospital and the target hospital. If they differ, the model may have learned the training hospital\'s implicit triage policy rather than generalizable physiology. External validation on a multi-site dataset is mandatory for clinical deployment.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-document-level-leakage',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'senior', type: 'code',
    title: 'NLP Train/Test Overlap at Document Level',
    context: 'A team builds a sentence-pair similarity model for a legal document search engine. They train on sentence pairs from 10,000 legal contracts and evaluate on a held-out test set. Test F1 is 0.931, but in a live search evaluation with new contracts F1 drops to 0.71.',
    code: `# Dataset construction:
# - 10,000 contracts, each split into sentences
# - Positive pairs: two sentences from the same clause
# - Negative pairs: random sentences from different clauses
# - Train/test split: 80/20 at the sentence-pair level

from sklearn.model_selection import train_test_split
pairs = extract_all_sentence_pairs(contracts)  # ~450,000 pairs
train_pairs, test_pairs = train_test_split(pairs, test_size=0.2, random_state=42)

model = SentenceBERT()
model.fine_tune(train_pairs)
print(f"Test F1: {evaluate(model, test_pairs):.3f}")
# Output: Test F1: 0.931`,
    question: 'Test F1 is 0.931 but live performance is 0.71. What is the structural flaw?',
    options: [
      'Data Leakage — Information from the test set contaminated training',
      'Evaluation Error — The evaluation metric is wrong for similarity models',
      'Distribution Shift — Live contracts use different legal language',
      'Metric Mismatch — F1 is the wrong metric for search relevance',
      'Labeling Artifact — Similarity labels are systematically biased',
    ],
    answer: 0,
    diagnosis: 'Data Leakage',
    explanation: 'The train/test split was performed at the sentence-pair level, not the document level. A contract that appears in training will also have sentence pairs in the test set. The model sees text from contract #4821 during training; test pairs from the same contract share vocabulary, clause structure, and even verbatim boilerplate. The model can partially "memorise" document-specific language and match test sentences to training sentences from the same document — not by understanding semantic similarity but by surface lexical overlap. Live contracts are genuinely unseen at the document level, and the inflated 0.931 F1 does not hold.',
    fix: 'Always split at the natural unit of independence — here, the document. Assign entire contracts to train or test, never split pairs across the same contract. `GroupShuffleSplit(groups=contract_ids)` achieves this in scikit-learn. Similarly, for any task with hierarchical structure (users, sessions, documents, patients), the split must happen at the top level of the hierarchy, not at the leaf level. After fixing, the baseline F1 will drop but will be an honest estimate of generalisation to new documents.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-model-selection-test-set',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'staff', type: 'code',
    title: 'Model Selection Bias on Test Set',
    context: 'A team conducts a hyperparameter sweep to find the best gradient boosting model for predicting customer churn. They have a single fixed test set of 20,000 customers. The best model is reported as AUC 0.891 on held-out data; live AUC measured 6 weeks later is 0.847.',
    code: `search_results = []
for params in hyperparameter_grid:  # 50 configurations
    model = XGBClassifier(**params)
    model.fit(X_train, y_train)
    test_auc = roc_auc_score(y_test, model.predict_proba(X_test)[:,1])
    search_results.append({'params': params, 'test_auc': test_auc})

best = max(search_results, key=lambda x: x['test_auc'])
print(f"Best model test AUC: {best['test_auc']:.3f}")
# Output: Best model test AUC: 0.891

# Reported in the project summary as: "Our model achieves AUC 0.891 on held-out data"`,
    question: 'Why is the reported 0.891 AUC an overestimate of true model quality?',
    options: [
      'Data Leakage — Test data was used to select features during preprocessing',
      'Evaluation Error — Selecting the best model by test performance inflates the reported metric',
      'Distribution Shift — Customer behavior changed between evaluation and deployment',
      'Metric Mismatch — AUC is the wrong metric for churn prediction',
      'Labeling Artifact — Churn labels are inconsistently defined',
    ],
    answer: 1,
    diagnosis: 'Evaluation Error',
    explanation: 'With 50 models evaluated on the same test set, the highest observed test AUC is the maximum of 50 random variables — even if all models had true AUC = 0.860, the expected maximum across 50 evaluations would be substantially higher. Each evaluation is a noisy estimate; picking the peak inflates the estimate. The test set has been used as a selection criterion, meaning it is no longer an unbiased estimator of generalisation performance. This is sometimes called "test set peeking" or "evaluation set overfitting." The gap (0.891 vs 0.847) is the selection inflation.',
    fix: 'Reserve a final holdout set that is only touched once — after all model selection decisions are made. Workflow: use a validation set (or cross-validation) for all hyperparameter tuning and model selection; the test set is evaluated exactly once at the very end on the single chosen model. If a third split is impractical, use nested cross-validation (outer loop estimates generalisation, inner loop tunes hyperparameters). When reporting results, always disclose how many models/configurations were compared against the same test set.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-label-delay-inner-join',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'staff', type: 'code',
    title: 'Label Delay in Streaming Predictions',
    context: 'A fintech company builds a real-time model to predict payment default risk at transaction time. The label is `default_30d` — whether the account misses a payment in the next 30 days. Validation AUC is 0.83 but production AUC is 0.76, with the model underestimating default probability for recently-opened accounts.',
    code: `# Training data construction:
# - Transactions logged in real time with features
# - Labels joined from the payment outcomes table 30 days later
# - Training set: 6 months of transactions with labels attached

# Naive join — assumes all labels are available
df = transactions.merge(outcomes, on='account_id', how='inner')
# Inner join silently drops accounts that haven't yet resolved (< 30 days old)

model.fit(df[feature_cols], df['default_30d'])
print(f"Validation AUC: {roc_auc_score(val_y, model.predict_proba(val_X)[:,1])}")
# Output: Validation AUC: 0.83`,
    question: 'Validation AUC is 0.83 but production AUC is 0.76, with miscalibration on new accounts. What is the buried flaw?',
    options: [
      'Data Leakage — Future payment outcomes contaminated the training features',
      'Evaluation Error — The validation set was constructed using the wrong time window',
      'Distribution Shift — Payment behavior changed after the model was deployed',
      'Metric Mismatch — AUC is the wrong metric for default risk',
      'Labeling Artifact — The training labels are systematically biased by label resolution delay',
    ],
    answer: 4,
    diagnosis: 'Labeling Artifact',
    explanation: 'The inner join silently discards all accounts that have not yet resolved — i.e., accounts opened in the last 30 days at label-creation time. These accounts are disproportionately new customers. New accounts have different risk profiles (no payment history, thin credit file) and are precisely the population where accurate risk assessment matters most. The training set systematically excludes this population, so the model never learns from it. At production time, new accounts arrive constantly and the model encounters a distribution it was never trained on. The inner join creates survivorship bias: only accounts that survived long enough to get a label are included.',
    fix: 'Use a left join and explicitly handle accounts with pending labels (e.g. set a flag `label_resolved = False` for transactions within 30 days of the label cutoff, and exclude them from training or treat them as censored). For survival/delay problems, consider a censored-label model (e.g. survival regression) that can learn from partial observations. Always document the label delay in your data pipeline, and validate that the label window in the training set matches the label window at serving time.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-multicollinearity-coefficients',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'staff', type: 'code',
    title: 'Multicollinearity Masking Feature Importance',
    context: 'A marketing team builds a linear regression model to predict weekly revenue from advertising spend. The feature set includes three spend channels that are always purchased together in the same budget package. The team concludes TV and digital are relatively unimportant (low coefficients) and proposes cutting TV budget entirely.',
    code: `feature_cols = [
    'tv_spend',          # always correlated with digital
    'digital_spend',     # always correlated with tv
    'programmatic_spend',# subset of digital, r=0.97 with digital_spend
    'email_sent_count',
    'promo_active',
]

from sklearn.linear_model import Ridge
model = Ridge(alpha=1.0)
model.fit(X_train, y_train)

# Feature coefficients (importance proxy):
#   tv_spend                  +0.041
#   digital_spend             +0.038
#   programmatic_spend        +0.029
#   email_sent_count          +0.187
#   promo_active              +0.312`,
    question: 'The model assigns low coefficients to TV and digital spend. What is the flaw in concluding they are unimportant?',
    options: [
      'Data Leakage — Spend data from future weeks contaminated the training features',
      'Evaluation Error — Coefficient magnitude is misleading when features are highly correlated',
      'Distribution Shift — The relationship between spend and revenue changed over time',
      'Metric Mismatch — Revenue is the wrong optimisation target for this model',
      'Labeling Artifact — Weekly revenue labels are aggregated incorrectly',
    ],
    answer: 1,
    diagnosis: 'Evaluation Error',
    explanation: 'When features are highly correlated (r=0.97 between `digital_spend` and `programmatic_spend`), the model distributes the total attribution across all correlated features. The combined importance of `tv_spend + digital_spend + programmatic_spend` is actually substantial — it is just split three ways because the model cannot distinguish their individual contributions. Dropping TV spend would remove a large portion of the correlated group, and revenue would drop significantly — but the individual coefficient of `tv_spend` gave no indication of this. This is a known limitation of coefficient magnitude as a feature importance metric under multicollinearity.',
    fix: 'For correlated features, use grouped or permutation importance: permute the entire group of correlated features together (tv + digital + programmatic) and measure the joint importance drop. Alternatively, use VIF (Variance Inflation Factor) to detect multicollinearity before interpreting coefficients — VIF > 10 is a red flag. For budget allocation decisions, consider using marketing mix modeling (Shapley-value attribution or Bayesian MMM) which handles correlated spend channels explicitly. Never cut budget based on coefficient magnitude alone without checking feature correlations first.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-ctr-proxy-metric',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'senior', type: 'code',
    title: 'Optimising CTR While Destroying Session Value',
    context: 'An ad platform trains a CTR (click-through rate) prediction model to rank ads. Offline AUC improves to 0.792 (up from 0.761 baseline). They ship via A/B test. After 14 days (n=4.2M sessions), CTR is up +13.3% but revenue per session is down -8.8%, session length down -22.6%, and 7-day retention down -10.7% (all p < 0.01).',
    code: `# Training objective: binary cross-entropy on click labels
# Label: did the user click the ad (1) or not (0)?

model = DeepFM(embedding_dim=64, hidden_layers=[256, 128, 64])
model.train(click_log_dataset)

# Offline evaluation
offline_auc = evaluate_auc(model, held_out_click_log)
print(f"Offline AUC: {offline_auc:.3f}")   # 0.792 (up from 0.761 baseline)

# A/B (14 days, n=4.2M sessions):
#   CTR                +13.3%  *
#   Revenue/session     -8.8%  *
#   Session length     -22.6%  *
#   7-day retention    -10.7%  *`,
    question: 'CTR improved +13.3% but revenue and retention both declined. What is the buried flaw?',
    options: [
      'Data Leakage — Click labels from the test set contaminated model training',
      'Evaluation Error — The A/B test was not run for long enough',
      'Distribution Shift — User behavior changed between training and deployment',
      'Metric Mismatch — CTR and AUC optimise for clicks, not for business value',
      'Labeling Artifact — Click labels include accidental clicks and bot traffic',
    ],
    answer: 3,
    diagnosis: 'Metric Mismatch',
    explanation: 'The model was trained to maximise click probability, not business value. It learned to surface ads that are "curiosity clicks" — clickbait-style creatives that get clicked but deliver poor post-click experience. Users click, feel disappointed, shorten their session, and are less likely to return. CTR went up because the model got better at generating clicks; revenue per session fell because post-click conversion quality dropped; retention fell because user trust eroded. Optimising for a proxy metric (clicks) that is imperfectly correlated with the true objective (revenue, retention) produced a model that exploited the proxy while undermining the goal.',
    fix: 'Define the objective hierarchy: revenue > retention > CTR. Train the model on the highest-level signal available — ideally conversion value or a weighted combination of clicks, conversions, and session signals. Use multi-task learning to jointly predict CTR, conversion rate, and post-click engagement. Establish guardrail metrics (revenue per session, 7-day retention) in every A/B test, not just the primary proxy metric. Any experiment that wins on the proxy but hurts a guardrail should be flagged for deep analysis before shipping.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-user-level-leakage',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'senior', type: 'code',
    title: 'User-Level vs Request-Level Splitting',
    context: 'A team builds a personalised search ranking model. Each training example is a (user, query, result) triple with a relevance label. Dataset: 2.4M query sessions from 180,000 unique users. Test NDCG@10 is 0.687 but live performance on new users (first 4 weeks post-launch) is 0.531.',
    code: `# Standard random split at the request level
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    features, labels, test_size=0.2, random_state=42
)
# X includes: user_id embedding, query_embedding, item_embedding,
#             user_history_features (avg_clicks_by_category, top_genres)

model = LightGBM()
model.fit(X_train, y_train)
ndcg = evaluate_ndcg(model, X_test, y_test)
print(f"Test NDCG@10: {ndcg:.3f}")   # 0.687`,
    question: 'Test NDCG@10 is 0.687 but live performance on new users is 0.531. What is the buried flaw?',
    options: [
      'Data Leakage — The same users appear in both train and test, inflating evaluation metrics',
      'Evaluation Error — NDCG@10 is computed incorrectly on the test set',
      'Distribution Shift — New users have different preferences than existing users',
      'Metric Mismatch — NDCG is the wrong metric for personalised search',
      'Labeling Artifact — Relevance labels are biased by prior search results',
    ],
    answer: 0,
    diagnosis: 'Data Leakage',
    explanation: 'The split is at the request level, so the same user appears in both training and test sets. A user who made 20 search sessions has ~16 in train and ~4 in test. The model learns user-specific preference patterns from those 16 training sessions; when it sees the same user\'s 4 test sessions, it has already seen that user and can leverage the stored user embedding and history features. This is user-level leakage through personalisation features. In production, new users have no prior sessions — the model must generalise to users it has never seen. The 0.687 NDCG reflects performance on known users, not cold-start performance.',
    fix: 'Split at the user level: all sessions from a given user land entirely in train or test. `GroupShuffleSplit(groups=user_ids)` achieves this. Also evaluate separately on cold-start users (users with fewer than N prior sessions) since that is the hardest and most business-critical subpopulation. If the model relies heavily on user history features, track cold-start performance as a standalone metric in every experiment — new user retention depends on it.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-stock-survivorship',
    subject: 'data', subtopic: 'spot-the-flaw', level: 'staff', type: 'code',
    title: 'Survivorship Bias in Stock Prediction',
    context: 'A quant team builds a 6-month return prediction model using 15 years of US equity data. They source their universe from the current S&P 500 constituent list and pull 15 years of historical prices for those 500 companies. The backtest shows Sharpe of 1.84 but live trading produces Sharpe of 0.31 over 18 months.',
    code: `# Build training universe from current S&P 500 components
current_sp500 = get_current_sp500_tickers()   # 500 tickers as of today

historical_prices = {}
for ticker in current_sp500:
    historical_prices[ticker] = fetch_price_history(ticker, years=15)

df = build_features_and_labels(historical_prices)
# Features: momentum, value ratios, volatility, sector
# Label: 6-month forward return

model = RandomForestRegressor(n_estimators=500)
model.fit(X_train, y_train)
print(f"Out-of-sample Sharpe: {evaluate_sharpe(model, X_test, y_test):.2f}")
# Output: Sharpe: 1.84`,
    question: 'The backtest shows Sharpe of 1.84 but live trading produces 0.31. What is the fundamental flaw?',
    options: [
      'Data Leakage — Future price data was used to construct training features',
      'Evaluation Error — The Sharpe ratio was computed incorrectly',
      'Distribution Shift — Market conditions changed between backtest and live trading',
      'Metric Mismatch — Sharpe ratio is the wrong metric for equity prediction',
      'Labeling Artifact — The training universe contains only surviving companies, biasing returns upward',
    ],
    answer: 4,
    diagnosis: 'Labeling Artifact',
    explanation: 'The training universe was built from today\'s S&P 500 constituents — companies that survived and thrived for 15 years. Over any 15-year window, hundreds of companies were added to or removed from the index: companies that went bankrupt, were acquired at distressed valuations, or declined and were delisted are absent. The model is trained only on winners. Every "historical" data point for a current constituent is actually a survivorship-selected positive example. Return distributions are systematically biased upward. The model learns patterns that correlate with long-term survival, which are not available at prediction time and overstate expected returns for the forward-looking universe.',
    fix: 'Use a point-in-time index membership list: for any training date T, only include companies that were in the index at time T, not companies that happen to still be in the index today. Data vendors (CRSP, Compustat) provide historical constituent lists. At each rebalancing date, the investable universe should be the set of companies that were tradeable at that date — including those that subsequently went bankrupt or were delisted. This is the single most common and most costly mistake in quantitative backtesting.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-feedback-loop-retraining',
    subject: 'monitoring', subtopic: 'spot-the-flaw', level: 'staff', type: 'code',
    title: 'Feedback Loop in Production Retraining',
    context: 'A content moderation team deploys a toxicity classifier. The model runs in production and its predictions are used to hide content flagged as toxic (score > 0.7). Moderators review a sample of flagged content to generate labels, which feed back into retraining every two weeks. After 6 months: false negative rate rose from 8% to 19%, precision on flagged items stays high (0.94) but recall is falling, and content from a specific political subreddit is never flagged despite moderator escalations.',
    code: `# Retraining pipeline (runs every 2 weeks)
def retrain_pipeline():
    # Collect labels from moderator review queue
    new_labels = fetch_moderator_labels()        # labels on model-flagged content
    # Add to training data
    training_data = existing_data + new_labels
    new_model = train_classifier(training_data)
    return new_model`,
    question: 'The model retrains every 2 weeks and precision stays high, but recall is falling and a whole subreddit escapes detection. What is the flaw?',
    options: [
      'Data Leakage — Moderator labels are contaminated with model predictions',
      'Evaluation Error — Precision and recall are computed on a biased evaluation set',
      'Distribution Shift — The feedback loop creates a distribution that diverges from the true data-generating process',
      'Metric Mismatch — Precision is the wrong primary metric for content moderation',
      'Labeling Artifact — Moderators systematically disagree with the model\'s decisions',
    ],
    answer: 2,
    diagnosis: 'Distribution Shift',
    explanation: 'The retraining pipeline only collects labels on content the model already flagged (score > 0.7). Content that the model does not flag is never reviewed and never generates labels. Over successive retraining cycles, the model gets excellent labels for content that looks like what it already thinks is toxic, but zero labels for content it misses. The label distribution drifts toward content the current model catches. New or evolved forms of toxicity — including the specific political subreddit that adapted its language — are never represented in retraining data. The model becomes increasingly confident in catching old patterns while becoming increasingly blind to new ones. Precision stays high because the model is correct about what it flags; recall drops because the uncaught content is never fed back.',
    fix: 'Reserve a random exploration slice of traffic (e.g. 5% of posts) that bypasses the classifier and goes directly to human review. This provides unbiased labels on content the model would have missed. Add a "low-confidence" queue: route content with scores 0.3–0.7 to moderators for labeling (these are the decision boundary cases most valuable for retraining). Track label distribution statistics across retraining cycles — if the positive label rate in new training data drifts significantly, that signals feedback loop degradation. Maintain a frozen evaluation set assembled independently of model predictions.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-unstratified-cv-imbalance',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'senior', type: 'code',
    title: 'Unstratified CV on Severely Imbalanced Data',
    context: 'A team trains a fraud detection model on a severely imbalanced dataset: 1% fraud, 99% non-fraud (100,000 examples: 1,000 fraud, 99,000 legitimate). They report 0.9901 mean CV accuracy. Fold 7 (discovered later) had zero fraud examples in its test split and scored a perfect 1.0.',
    code: `from sklearn.model_selection import KFold, cross_val_score
from sklearn.ensemble import GradientBoostingClassifier

kf = KFold(n_splits=10, shuffle=True, random_state=42)
model = GradientBoostingClassifier()

scores = cross_val_score(model, X, y, cv=kf, scoring='accuracy')
print(f"Mean CV Accuracy: {scores.mean():.4f} +/- {scores.std():.4f}")
# Mean CV Accuracy: 0.9901 +/- 0.0089

# Fold 7 breakdown (discovered later):
#   Fold 7 test:  10,000 examples — 0 fraud (!!!)
#   Fold 7 accuracy: 1.0000 (perfect — the model predicted all non-fraud)`,
    question: 'The model reports 0.9901 mean CV accuracy including a perfect 1.0 fold. What is the flaw?',
    options: [
      'Data Leakage — Fraud labels from the test fold contaminated model training',
      'Evaluation Error — Unstratified CV on imbalanced data produces unstable and misleading folds',
      'Distribution Shift — Fraud patterns differ across folds due to temporal ordering',
      'Metric Mismatch — Accuracy is the wrong metric for fraud detection',
      'Labeling Artifact — Fraud labels are inconsistently applied across the dataset',
    ],
    answer: 1,
    diagnosis: 'Evaluation Error',
    explanation: 'With 1% fraud rate and unstratified 10-fold CV, random chance can assign 0 fraud examples to a fold. Fold 7 had 10,000 test examples and zero fraud cases — the model achieved perfect accuracy by predicting all non-fraud, which is uninformative. The high mean accuracy (0.9901) and high variance (0.0089) are both artifacts of the fold composition instability. The 0.0089 std is inflated by folds with zero positives producing artificially perfect scores. The model was never evaluated on its ability to detect fraud; it was evaluated on its ability to predict the majority class.',
    fix: 'Use `StratifiedKFold` instead of `KFold` for any classification task with imbalance: `StratifiedKFold(n_splits=10, shuffle=True)` ensures each fold preserves the class ratio (approximately 1% fraud in each fold). Also replace accuracy with fraud-relevant metrics: F1 on the positive class, Precision-Recall AUC, or Cohen\'s kappa. As a rule: if any CV fold has fewer than ~30 positive examples, the fold\'s metric estimate is unreliable regardless of stratification — consider using fewer folds or upsampling before CV.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-feature-staleness-cadence',
    subject: 'production', subtopic: 'spot-the-flaw', level: 'staff', type: 'mcq',
    title: 'Temporal Proxy Feature at Serve Time',
    context: `A churn prediction model for a SaaS product is trained using features computed at prediction time (daily batch job). One feature is account_age_days = (today - account_created_at).days, computed fresh daily. Validation AUC: 0.881.

In production, the daily batch job takes 6 hours and is cached. Due to an infrastructure optimisation, the batch job runs only weekly and the cached features are reused for 7 days.

After 3 weeks:
- Churn recall drops from 78% to 51%
- Accounts that churned on day 5 after the last batch run have stale 'account_age_days'
- The model was trained assuming this feature refreshes daily`,
    question: 'Churn recall drops from 78% to 51% after the batch cadence changes from daily to weekly. What is the underlying flaw?',
    options: [
      'Data Leakage — Future churn events were encoded in training features',
      'Evaluation Error — The model was evaluated on a non-representative validation period',
      'Distribution Shift — The feature distribution at serve time differs from training due to staleness',
      'Metric Mismatch — Recall is the wrong metric for churn prioritisation',
      'Labeling Artifact — Churn labels are assigned inconsistently across accounts',
    ],
    answer: 2,
    diagnosis: 'Distribution Shift',
    explanation: 'The model was trained on features refreshed daily — `account_age_days` had at most 1 day of staleness. At weekly batch cadence, the same feature can be up to 7 days stale. The model was trained on a feature distribution where `account_age_days` accurately reflects today\'s account age. At serve time, it receives a feature that may be systematically off by 0–7 days, with a uniform error distribution across the week. Age-sensitive decision boundaries (e.g. "accounts aged 180–190 days have higher churn risk") are shifted. More critically, other time-varying features (days since last login, days since last payment) suffer the same staleness — every time-delta feature in the feature set is now drawn from a different distribution than training.',
    fix: 'Document the expected freshness SLA for every feature at the time the model is trained. Store feature freshness metadata alongside model artifacts: "this model was trained on features with daily refresh; do not serve with staleness > 24 hours." Implement a monitoring check that compares the mean and distribution of time-delta features at serve time against training-time statistics — a stale batch will produce a clear distribution shift signal. If weekly batches are required for cost reasons, retrain the model on weekly-snapshot features so the training and serving distributions match.',
    source: 'Spot the Flaw',
  },
  {
    id: 'flaw-wrong-eval-population',
    subject: 'eval', subtopic: 'spot-the-flaw', level: 'staff', type: 'mcq',
    title: 'Wrong Population for Offline Evaluation',
    context: `A university trains an ML model to predict which students are at risk of dropping out. The goal is to trigger early interventions.

Evaluation setup:
  - Training/test population: all enrolled students (n=12,400)
  - Model predicts dropout risk score (0–1)
  - Test AUC: 0.84, Precision@20%: 0.61

In production, the model is integrated into the existing support system:
  - A rule-based system first flags students with GPA < 2.0 OR missed > 3 advising appointments
  - Only rule-flagged students receive the ML model score
  - Advisors use the ML score to prioritise outreach within the flagged pool

After one semester, advisors report the model "adds no value" — it ranks students within the flagged pool almost randomly. Actual precision within the flagged pool: 0.29 (worse than random for this subgroup).`,
    question: 'Test AUC was 0.84 on all students but the model is useless within the flagged pool. What is the flaw?',
    options: [
      'Data Leakage — Dropout labels from future semesters contaminated the training features',
      'Evaluation Error — The test set was too small to produce a reliable AUC estimate',
      'Distribution Shift — The model was evaluated on the full population but deployed on a pre-filtered subpopulation',
      'Metric Mismatch — AUC is the wrong metric for a ranking-based intervention system',
      'Labeling Artifact — Dropout labels are inconsistently defined across departments',
    ],
    answer: 2,
    diagnosis: 'Distribution Shift',
    explanation: 'The model was trained and evaluated on all 12,400 students — a population that includes low-risk students (GPA 3.8, perfect attendance) who are easy to distinguish from high-risk students. Most of the model\'s discriminative power comes from correctly scoring the easy cases at the extremes of the distribution. In production, the model only operates on students already flagged by the rule-based system (GPA < 2.0 OR missed advising). This flagged population is a hard subgroup: all members already show some risk signal. Within this restricted range, the features that drove the 0.84 AUC on the full population have much less discriminative power — the model was never trained to distinguish high-risk from very-high-risk within this stratum.',
    fix: 'Evaluate the model on the population it will actually serve, not the full population. Re-run offline evaluation exclusively on the subset of students who would be flagged by the rule-based system at each historical time point. This gives an honest estimate of the model\'s value-add within the intervention pipeline. Better still, consider replacing the two-stage system with a single unified ML model trained on the full population but evaluated and calibrated for the operating subpopulation. Whenever a model is downstream of a filter (rule-based, another model, or a business constraint), the evaluation dataset must reflect that filter.',
    source: 'Spot the Flaw',
  },
]
