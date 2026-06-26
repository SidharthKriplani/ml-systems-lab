import { useState, useEffect } from 'react'
import TabHeader from '../components/TabHeader.jsx'
import FidelityBadge from '../components/FidelityBadge.jsx'
import HowToStrip from '../components/HowToStrip.jsx'

const SCENARIOS = [
  {
    id: 'stf1',
    title: 'Churn Model Validation',
    flawCategory: 'Evaluation Error',
    setup: `A data scientist builds a churn prediction model for a telecom company. Here is their validation approach:

# Load full dataset (100,000 customers)
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
      { category: 'Data Leakage', desc: 'Information from the test set contaminated training' },
      { category: 'Evaluation Error', desc: 'The evaluation protocol produces inflated results' },
      { category: 'Distribution Shift', desc: 'Train and serve distributions differ' },
      { category: 'Metric Mismatch', desc: 'AUC is the wrong metric for this problem' },
      { category: 'Labeling Artifact', desc: 'The churn labels are systematically biased' },
    ],
    correctCategory: 'Data Leakage',
    reveal: 'The imputer is fit on the full dataset (including the test set) before the train/test split. `imputer.fit_transform(df[feature_cols])` computes the mean from all 100,000 rows — including the 20,000 test rows. The imputed mean for training data is therefore contaminated with test set statistics. The model learns from features that encode information about the test set. The reported 0.94 AUC is optimistic and will not generalise.',
    fix: 'Fit the imputer on the training set only, then apply (transform only) to the test set: `imputer.fit(X_train)` then `imputer.transform(X_test)`. Same applies to scalers, encoders, and any other stateful preprocessing step. The split should happen before any fit operation.',
  },
  {
    id: 'stf2',
    title: 'A/B Test Readout',
    flawCategory: 'Evaluation Error',
    setup: `An analyst runs an A/B test for a new recommendation algorithm. Results after 7 days:

Control (n=45,230): Conversion rate = 3.21%
Treatment (n=44,891): Conversion rate = 3.47%

Statistical test: two-proportion z-test
p-value: 0.031
Decision: Ship the treatment — statistically significant at alpha=0.05.

Note: The analyst checked results on Day 3 (p=0.12, not significant),
Day 5 (p=0.08, not significant), and Day 7 (p=0.031, significant).`,
    question: 'The analyst declares the test a win at Day 7. What is the buried flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Test group data leaked into control group' },
      { category: 'Evaluation Error', desc: 'The evaluation protocol inflates significance' },
      { category: 'Distribution Shift', desc: 'User distribution changed during the test' },
      { category: 'Metric Mismatch', desc: 'Conversion rate is the wrong success metric' },
      { category: 'Labeling Artifact', desc: 'Conversions were miscounted or mislabeled' },
    ],
    correctCategory: 'Evaluation Error',
    reveal: 'Peeking and optional stopping: checking the p-value at Day 3, Day 5, and Day 7 and stopping when it first crosses 0.05 inflates the false positive rate. Each check is an independent hypothesis test. Running three tests at alpha=0.05 gives a family-wise error rate of approximately 1 - (0.95)^3 approximately 14%. The observed p=0.031 does not represent a 3.1% false positive rate — it represents a much higher rate because the analyst implicitly ran three tests.',
    fix: 'Pre-register the test duration before starting — do not check for significance until the pre-specified end date. If sequential testing is required (e.g. for fast-moving products), use a sequential testing framework (e.g. always-valid p-values, mSPRT) that controls false positive rate under continuous monitoring. The rule: decide the end date before seeing any data.',
  },
  {
    id: 'stf3',
    title: 'Fraud Detection Model',
    flawCategory: 'Metric Mismatch',
    setup: `A team builds a real-time fraud detection model for a payments company.

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
      { category: 'Data Leakage', desc: 'Training data included future fraud labels' },
      { category: 'Evaluation Error', desc: 'The test set was not representative' },
      { category: 'Distribution Shift', desc: 'Fraud patterns changed after deployment' },
      { category: 'Metric Mismatch', desc: 'Accuracy is the wrong metric for imbalanced fraud detection' },
      { category: 'Labeling Artifact', desc: 'Fraud labels were systematically wrong' },
    ],
    correctCategory: 'Metric Mismatch',
    reveal: 'With 0.08% fraud rate, a model that predicts "not fraud" for every transaction achieves 99.92% accuracy. The deployed model (99.93% accuracy, flagging 0.02% of transactions) is essentially a slightly better version of the all-negative baseline — it catches almost no fraud. Accuracy on imbalanced data rewards the majority class. The model optimised for the wrong objective.',
    fix: 'For fraud detection, the relevant metrics are: Recall (what fraction of actual fraud did we catch?) and Precision (of flagged transactions, how many are real fraud?). At 0.08% fraud rate with asymmetric costs ($250 fraud miss vs $15 false positive), the decision threshold and loss function should reflect the cost ratio. Use F-beta score with beta > 1 to weight recall higher, or directly optimise expected cost: E[cost] = FN_rate * $250 + FP_rate * $15.',
  },
  {
    id: 'stf4',
    title: 'NLP Feature Importance',
    flawCategory: 'Data Leakage',
    setup: `A team builds a document classifier to predict whether a news article is about finance or sports.

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
      { category: 'Data Leakage', desc: 'A feature encodes information not available at prediction time' },
      { category: 'Evaluation Error', desc: 'The test set was constructed incorrectly' },
      { category: 'Distribution Shift', desc: 'The new news source uses different vocabulary' },
      { category: 'Metric Mismatch', desc: 'Accuracy is the wrong metric for document classification' },
      { category: 'Labeling Artifact', desc: 'The training labels were systematically biased by source' },
    ],
    correctCategory: 'Distribution Shift',
    reveal: 'The model learned "Reuters" as a top-5 feature for finance articles — because Reuters was the dominant source for finance content in the training data. "Reuters" is a data source artifact, not a semantic finance signal. The model learned the byline, not the content. When deployed on a new source (not Reuters), this spurious feature provides zero signal, and the model loses a top-5 predictor. This is a form of distribution shift where the covariate distribution (source/byline) differs between train and serve.',
    fix: 'Audit feature importance for spurious correlates: any feature that is a proxy for the data source, labeling process, or collection method rather than the actual semantic signal is a red flag. Remove or exclude byline, author, publication name, and timestamp features unless they are genuinely available and meaningful at serving time. Add a source-stratified cross-validation to detect this class of overfitting earlier.',
  },
  {
    id: 'stf5',
    title: 'Recommendation System Offline Eval',
    flawCategory: 'Evaluation Error',
    setup: `A team evaluates a new recommendation model offline before A/B testing. They use a held-out test set from the last 30 days.

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
      { category: 'Data Leakage', desc: 'Test items appeared in the training data' },
      { category: 'Evaluation Error', desc: 'The offline eval protocol has a structural flaw' },
      { category: 'Distribution Shift', desc: 'User preferences changed between months' },
      { category: 'Metric Mismatch', desc: 'Precision@10 is the wrong metric for recommendations' },
      { category: 'Labeling Artifact', desc: 'User interaction labels are biased by the existing recommender' },
    ],
    correctCategory: 'Labeling Artifact',
    reveal: 'The test set labels (user interactions) were generated by the OLD recommendation model — users only interacted with items that the old model showed them. Items the old model never recommended have zero interactions in the test set, regardless of how relevant they actually are. The new model is evaluated against a label set that is systematically biased toward items the old model preferred. This is "exposure bias" — offline eval rewards models that agree with the old model, not models that find genuinely better items.',
    fix: 'This is a fundamental problem with offline evaluation of recommendation systems. Mitigations: (1) Use counterfactual evaluation (IPS — Inverse Propensity Scoring) to reweight test interactions by the probability that the old model would have shown that item. (2) Evaluate only on a random exploration slice of traffic where items were shown randomly (removes exposure bias). (3) Accept that offline eval is directionally useful but not predictive of online gains — always A/B test.',
  },
  {
    id: 'stf6',
    title: 'Time Series Forecasting Evaluation',
    flawCategory: 'Evaluation Error',
    setup: `A team builds a 7-day sales forecast model. They evaluate using k-fold cross-validation:

from sklearn.model_selection import KFold, cross_val_score
from sklearn.ensemble import GradientBoostingRegressor

kf = KFold(n_splits=5, shuffle=True, random_state=42)
model = GradientBoostingRegressor()
scores = cross_val_score(model, X, y, cv=kf, scoring='neg_mean_absolute_error')
print(f"CV MAE: {-scores.mean():.2f} +/- {scores.std():.2f}")
# Output: CV MAE: 142.30 +/- 18.4

# In production, MAE is consistently 380-420`,
    question: 'Why does production MAE (380-420) far exceed CV MAE (142)?',
    options: [
      { category: 'Data Leakage', desc: 'Future data leaked into the training features' },
      { category: 'Evaluation Error', desc: 'The cross-validation protocol is wrong for time series' },
      { category: 'Distribution Shift', desc: 'Sales patterns changed after deployment' },
      { category: 'Metric Mismatch', desc: 'MAE is the wrong metric for sales forecasting' },
      { category: 'Labeling Artifact', desc: 'Sales labels were recorded incorrectly' },
    ],
    correctCategory: 'Data Leakage',
    reveal: '`KFold(shuffle=True)` randomly assigns data points to folds regardless of time order. This means validation folds contain data from the past that is used to evaluate predictions about the "future" — but the "future" data was used to train the model on other folds. The model sees future data during training (from validation fold data in other splits), producing an optimistic CV estimate. In production, the model has never seen future data — it is a genuinely harder task.',
    fix: 'Use `TimeSeriesSplit` instead of `KFold` for time series data: `from sklearn.model_selection import TimeSeriesSplit`. This ensures training data always precedes validation data temporally. Better: implement a proper walk-forward validation that mimics production: train on months 1-N, evaluate on month N+1, advance by one month, repeat.',
  },
  {
    id: 'stf7',
    title: 'Transfer Learning for Medical Imaging',
    flawCategory: 'Distribution Shift',
    setup: `A team fine-tunes ResNet-50 (pretrained on ImageNet) for chest X-ray pneumonia detection.

Training data: 5,216 X-rays from Hospital A (pediatric patients, ages 1-5)
Test accuracy: 92.3% (evaluated on Hospital A held-out set)

The model is deployed to Hospital B (adult patients).
Hospital B accuracy: 61.4%

The team is surprised — the model was tested rigorously with a proper train/test split.`,
    question: 'What caused the 31-point accuracy drop at Hospital B?',
    options: [
      { category: 'Data Leakage', desc: 'Hospital B patients appeared in the training data' },
      { category: 'Evaluation Error', desc: 'The 92.3% test accuracy was computed incorrectly' },
      { category: 'Distribution Shift', desc: 'The model was trained on a population it was not deployed on' },
      { category: 'Metric Mismatch', desc: 'Accuracy is the wrong metric for medical diagnosis' },
      { category: 'Labeling Artifact', desc: 'Pneumonia labels differed between hospitals' },
    ],
    correctCategory: 'Distribution Shift',
    reveal: 'The training data was exclusively pediatric patients (ages 1-5) from Hospital A. Pediatric chest X-rays differ substantially from adult X-rays: rib cage proportions, heart size relative to lung field, diaphragm position, and the presentation of pneumonia all differ by age. The model learned features specific to pediatric anatomy that do not transfer to adult patients. The 92.3% test accuracy was valid for Hospital A pediatric patients — it was never a valid estimate for Hospital B adults.',
    fix: 'Before deploying any model, characterise the training distribution and the serving distribution. Key dimensions for medical imaging: age range, sex, scanner manufacturer, imaging protocol, institution. If the deployment population differs from training on any of these dimensions, the test accuracy does not apply. Either collect representative training data, or at minimum, report performance metrics broken down by the relevant demographic dimensions. Never report a single aggregate accuracy for a model deployed across heterogeneous populations.',
  },
  {
    id: 'stf8',
    title: 'Customer Lifetime Value Model',
    flawCategory: 'Labeling Artifact',
    setup: `A team builds a Customer Lifetime Value (CLV) model to predict 12-month revenue per customer. Labels are constructed as:

clv_label = sum(transactions['amount']) for the next 12 months

Training data: customers acquired in Year 1 and Year 2.
The model predicts high CLV for customers with many small transactions.

In production, marketing uses the model to identify high-value customers for a premium tier invitation. Invited customers have much lower actual CLV than predicted.`,
    question: 'What is the flaw in the CLV label construction?',
    options: [
      { category: 'Data Leakage', desc: 'Future transaction data was used in training features' },
      { category: 'Evaluation Error', desc: 'The model evaluation metric was incorrect' },
      { category: 'Distribution Shift', desc: 'Customer behavior changed between training and serving' },
      { category: 'Metric Mismatch', desc: 'Total transaction amount is the wrong definition of CLV' },
      { category: 'Labeling Artifact', desc: 'The label construction introduces a systematic bias' },
    ],
    correctCategory: 'Labeling Artifact',
    reveal: 'The training data only includes customers who were retained for a full 12 months — customers who churned before 12 months have no complete label and are excluded from training. This creates survivorship bias: the model is trained exclusively on customers who stayed, and never sees examples of high-initial-spend customers who churned after 2 months. The model learns to predict CLV for retained customers, not for the full acquisition cohort. High-frequency small-transaction customers tend to be retained (habit-based), creating a spurious correlation between transaction frequency and CLV.',
    fix: 'Include churned customers in training with their partial CLV labels. Use a survival analysis approach (e.g. Weibull regression, or a two-stage model: predict churn probability x predicted spend if retained). Alternatively, use a shorter label window (e.g. 30-day or 90-day revenue) that allows inclusion of all customers regardless of churn timing. Audit the training set for survivorship bias before finalising any label construction for long-horizon prediction tasks.',
  },
  {
    id: 'stf9',
    title: 'Sentiment Analysis Deployment',
    flawCategory: 'Distribution Shift',
    setup: `A sentiment analysis model is trained on Amazon product reviews (5-star scale, labeled positive/negative). Training accuracy: 94.1%.

The model is integrated into a customer support system to classify support tickets as positive (resolved, happy) or negative (unresolved, frustrated).

Production accuracy on support tickets: 58.3% — barely better than random.`,
    question: 'Why does a 94.1% accurate model perform at chance on support tickets?',
    options: [
      { category: 'Data Leakage', desc: 'Support ticket text appeared in the training data' },
      { category: 'Evaluation Error', desc: 'The 94.1% accuracy was computed on a biased test set' },
      { category: 'Distribution Shift', desc: 'Product reviews and support tickets are different text distributions' },
      { category: 'Metric Mismatch', desc: 'Accuracy is the wrong metric for sentiment analysis' },
      { category: 'Labeling Artifact', desc: 'Support ticket labels are systematically wrong' },
    ],
    correctCategory: 'Distribution Shift',
    reveal: 'Product reviews and support tickets are completely different text distributions. Reviews use consumer language ("great product", "works perfectly", "terrible quality"). Support tickets use transactional language ("order #12345 not received", "please cancel", "how do I return"). Positive/negative in reviews maps to product satisfaction; positive/negative in support tickets maps to resolution status — an entirely different construct. The model learned review-domain features that have no signal in the support-ticket domain.',
    fix: 'Domain mismatch is one of the most common NLP deployment failures. Before deploying any text model to a new domain, run an embedding similarity check: are the new domain texts similar to training texts in the embedding space? If not, the model will not transfer. The correct approach: collect and label a representative sample of support tickets, fine-tune the model on that domain, and evaluate on held-out support tickets specifically.',
  },
  {
    id: 'stf10',
    title: 'Feature Importance for Model Debugging',
    flawCategory: 'Evaluation Error',
    setup: `A team uses permutation feature importance to understand their credit scoring model and identify potentially discriminatory features.

Results show:
- "zip_code" has very low importance (0.002)
- "income" has high importance (0.18)

The team concludes zip_code is not being used meaningfully and the model is not using geography as a proxy for race.

Regulators later find the model produces systematically different scores by geography.`,
    question: 'Why did low permutation importance not mean zip_code was unimportant?',
    options: [
      { category: 'Data Leakage', desc: 'Zip code information leaked through another feature' },
      { category: 'Evaluation Error', desc: 'Permutation importance gives misleading results for correlated features' },
      { category: 'Distribution Shift', desc: 'Geographic patterns changed after model training' },
      { category: 'Metric Mismatch', desc: 'The wrong importance metric was used' },
      { category: 'Labeling Artifact', desc: 'Credit labels are biased by geography' },
    ],
    correctCategory: 'Evaluation Error',
    reveal: 'Permutation importance underestimates the importance of correlated features. When zip_code is permuted (shuffled), the model can partially recover the geographic signal from correlated features: income, home value, employment type, education. The model does not need zip_code once these correlates are available. Permutation importance measures "how much does the model depend on this feature given all other features are available" — not "does the model use geographic information." The model encodes geographic information through its correlates, and permutation importance misses this entirely.',
    fix: 'For fairness audits, permutation importance is insufficient. Use: (1) Conditional importance: measure importance of zip_code after removing correlated features. (2) Subgroup analysis: directly compute model outputs by geographic region and test for disparate impact. (3) Causal feature attribution: use SHAP interaction values to detect how zip_code interacts with other features. Regulatory compliance requires outcome testing, not just feature importance analysis.',
  },
  {
    id: 'stf11',
    title: 'Ranking Model: Offline Wins, Online Drops',
    flawCategory: 'Metric Mismatch',
    setup: `A recsys team trains a new ranking model. Offline NDCG@10 improves from 0.41 to 0.47 — a +14.6% lift. They ship to production via A/B test. After 7 days, CTR in the treatment arm is 2.1% vs 2.3% in control — a statistically significant -8.7% drop. The team is confused: how can offline quality improve while online engagement drops?

# Offline evaluation
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
      { category: 'Data Leakage', desc: 'The offline test set contained items seen during training' },
      { category: 'Evaluation Error', desc: 'The A/B test was not run long enough to be valid' },
      { category: 'Distribution Shift', desc: 'User preferences changed between offline eval and the A/B test' },
      { category: 'Metric Mismatch', desc: 'NDCG and CTR measure different things — offline quality does not predict online engagement' },
      { category: 'Labeling Artifact', desc: 'Click labels in the offline dataset are systematically biased' },
    ],
    correctCategory: 'Metric Mismatch',
    reveal: 'NDCG measures ranking quality of items the user eventually clicked, using a static offline log. It does not measure whether the ranked items are ones the user would click on a fresh visit. The new model may surface more "relevant-looking" items that are less novel or less clickable in context — improving recall of historically clicked items but hurting discovery. Offline NDCG and online CTR are measuring different things.',
    fix: 'Pair offline NDCG with online-proxy metrics like expected CTR from a click prediction model applied to the ranked slate. Run interleaving experiments before full A/B to catch metric divergence cheaply. Track diversity and novelty alongside relevance — a model that over-indexes on known preferences may have high NDCG but low discovery value.',
  },
  {
    id: 'stf12',
    title: 'Medical Imaging: Annotator Majority-Vote Bias',
    flawCategory: 'Labeling Artifact',
    setup: `A team trains a chest X-ray classifier for pneumonia detection using labels from 3 radiologists (majority vote). The model achieves 94% accuracy on held-out test data. In clinical pilot, sensitivity on actual pneumonia cases is 61% — meaning 39% of pneumonia cases are missed. The held-out test set was labeled by the same 3 radiologists using the same majority-vote protocol.

# Label distribution analysis
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
      { category: 'Data Leakage', desc: 'Test images were used during model training' },
      { category: 'Evaluation Error', desc: 'The test set is too small to be statistically valid' },
      { category: 'Distribution Shift', desc: 'Clinical pilot patients differ from training hospital patients' },
      { category: 'Metric Mismatch', desc: 'Accuracy is the wrong metric for medical diagnosis' },
      { category: 'Labeling Artifact', desc: 'The majority-vote protocol encodes systematic annotator error, not ground truth' },
    ],
    correctCategory: 'Labeling Artifact',
    reveal: '94% test accuracy is meaningless here because the test set uses the same labeling protocol as training. The 29% of cases where annotators disagreed (2-vs-1) were resolved by majority vote — but majority vote does not resolve clinical ground truth. If two radiologists systematically miss early-stage pneumonia and one catches it, majority vote always labels those cases as negative. The model learns to replicate systematic annotator error, not actual pathology. Test accuracy measures agreement with annotators, not diagnostic accuracy.',
    fix: 'Use adjudicated labels for the test set — cases where annotators disagree should be resolved by a senior radiologist or confirmed via follow-up imaging (CT, biopsy). Never share labeling protocol between train and test when the protocol itself may carry systematic error. Track sensitivity and specificity separately, not just accuracy — in imbalanced clinical tasks, accuracy can look high while sensitivity is dangerously low.',
  },
  {
    id: 'stf13',
    title: 'Target Leakage in Credit Scoring',
    flawCategory: 'Data Leakage',
    setup: `A team builds a credit default prediction model for a lending platform. The target label is \`default_90d\` — whether the borrower missed payments for 90+ consecutive days.

Feature engineering includes:

feature_cols = [
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

Feature importance — top 3:
  days_past_due          0.61
  num_delinquencies_2yr  0.14
  credit_score           0.06

The model's AUC of 0.987 impresses leadership. In production, AUC drops to 0.71.`,
    question: 'The model reports 0.987 AUC in evaluation but 0.71 in production. What is the buried flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Information from the test set contaminated training' },
      { category: 'Evaluation Error', desc: 'The evaluation protocol produces inflated results' },
      { category: 'Distribution Shift', desc: 'Train and serve distributions differ' },
      { category: 'Metric Mismatch', desc: 'AUC is the wrong metric for this problem' },
      { category: 'Labeling Artifact', desc: 'The default labels are systematically biased' },
    ],
    correctCategory: 'Data Leakage',
    reveal: '`days_past_due` is a direct proxy for the target label. A borrower who is 90+ days past due IS the event being predicted — the feature is derived from the same underlying event as the label. At training time, the snapshot of `days_past_due` is taken after default has already occurred; at serving time, you are predicting before default occurs. The model achieves 0.987 AUC not because it is powerful, but because it is essentially reading the answer off the label. At serve time, `days_past_due` reflects current (pre-default) payment history — a fundamentally different signal — and the model collapses.',
    fix: 'Audit every feature for causal ordering: does this value become observable before or after the label is determined? Apply a strict point-in-time constraint — all features must reflect the state of the world at the moment of application (loan origination), not the state at label assignment (90 days later). Remove any feature derived from payment behavior that occurs after origination. Use a timeline diagram: draw the prediction point and the label point; every feature must sit to the left of the prediction point.',
  },
  {
    id: 'stf14',
    title: 'Cross-Validation on Time Series',
    flawCategory: 'Evaluation Error',
    setup: `A team builds a model to predict weekly retail sales. They use 104 weeks of historical data and perform 5-fold cross-validation to compare several models.

from sklearn.model_selection import cross_val_score, KFold
from sklearn.ensemble import RandomForestRegressor
import numpy as np

# 104 weeks of (features, sales_volume) pairs
X, y = load_sales_data()   # X includes lag features, promotions, holidays

kf = KFold(n_splits=5, shuffle=True, random_state=0)
model = RandomForestRegressor(n_estimators=200, random_state=0)

cv_scores = cross_val_score(model, X, y, cv=kf, scoring='neg_mae')
print(f"CV MAE: {-cv_scores.mean():.0f} units  std: {cv_scores.std():.0f}")
# Output: CV MAE: 312 units  std: 28

# Production MAE (first 8 weeks after deployment): 891 units

The team trusted the CV score to select the final model.`,
    question: 'CV MAE is 312 units but production MAE is 891. What went wrong?',
    options: [
      { category: 'Data Leakage', desc: 'Information from the test set contaminated training' },
      { category: 'Evaluation Error', desc: 'The cross-validation protocol is wrong for time series' },
      { category: 'Distribution Shift', desc: 'Sales patterns changed after deployment' },
      { category: 'Metric Mismatch', desc: 'MAE is the wrong metric for sales forecasting' },
      { category: 'Labeling Artifact', desc: 'Sales volume labels were recorded incorrectly' },
    ],
    correctCategory: 'Evaluation Error',
    reveal: '`KFold(shuffle=True)` randomises which weeks land in each fold. This means a validation fold may contain week 4 while the training set contains week 103. The model is evaluated on predicting the past using the future — temporal leakage. Lag features (e.g. sales_lag_1, sales_lag_4) computed from future weeks contaminate the training folds. The model learns seasonal patterns perfectly because future seasonality is present in training data. In production, no future data exists, so the model faces a genuinely harder forecasting task. The 312-unit CV MAE reflects interpolation, not extrapolation.',
    fix: 'Replace `KFold` with `TimeSeriesSplit` for any time-ordered data. Better still, implement expanding-window walk-forward validation: train on weeks 1–52, evaluate on weeks 53–56; train on weeks 1–56, evaluate on weeks 57–60; and so on. This directly simulates the production setting — the model always forecasts forward from the last training week, never backward. Also ensure lag features are computed correctly within each fold (no leakage through the lag window across fold boundaries).',
  },
  {
    id: 'stf15',
    title: 'Spurious Correlation: ICU Ventilator Survival',
    flawCategory: 'Distribution Shift',
    setup: `A hospital system trains a mortality prediction model using 3 years of ICU admissions (n=18,400 patients).

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
      { category: 'Data Leakage', desc: 'Future clinical outcomes leaked into training features' },
      { category: 'Evaluation Error', desc: 'The held-out validation set was constructed incorrectly' },
      { category: 'Distribution Shift', desc: 'The model learned a spurious correlation specific to the training ICU' },
      { category: 'Metric Mismatch', desc: 'AUC is the wrong metric for mortality prediction' },
      { category: 'Labeling Artifact', desc: 'Mortality labels were inconsistently recorded across units' },
    ],
    correctCategory: 'Distribution Shift',
    reveal: 'At the training hospital (a tertiary academic center), ventilators are preferentially allocated to patients who are sick but recoverable — patients who are too sick to survive are often not intubated (comfort care decisions, palliative pathways). The population on ventilators is therefore systematically less likely to die not because ventilation is protective, but because the sickest patients are absent from the ventilated group. The model learns a hospital-specific triage policy, not a physiological relationship. At the community hospital, triage protocols differ — more patients are intubated regardless of prognosis — and the spurious protective signal inverts.',
    fix: 'Causal audit every feature that reflects a clinical intervention: interventions are decided by clinicians who already have a prognosis estimate. Use causal DAGs to identify confounders. Before deploying to a new hospital, compare the feature distributions (especially intervention rates) between the training hospital and the target hospital. If they differ, the model may have learned the training hospital\'s implicit triage policy rather than generalizable physiology. External validation on a multi-site dataset is mandatory for clinical deployment.',
  },
  {
    id: 'stf16',
    title: 'NLP Train/Test Overlap at Document Level',
    flawCategory: 'Data Leakage',
    setup: `A team builds a sentence-pair similarity model for a legal document search engine. They train on sentence pairs from 10,000 legal contracts and evaluate on a held-out test set.

Dataset construction:
- 10,000 contracts, each split into sentences
- Positive pairs: two sentences from the same clause
- Negative pairs: random sentences from different clauses
- Train/test split: 80/20 at the sentence-pair level

from sklearn.model_selection import train_test_split
pairs = extract_all_sentence_pairs(contracts)  # ~450,000 pairs
train_pairs, test_pairs = train_test_split(pairs, test_size=0.2, random_state=42)

model = SentenceBERT()
model.fine_tune(train_pairs)
print(f"Test F1: {evaluate(model, test_pairs):.3f}")
# Output: Test F1: 0.931

In a live search evaluation with new contracts, F1 drops to 0.71.`,
    question: 'Test F1 is 0.931 but live performance is 0.71. What is the structural flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Information from the test set contaminated training' },
      { category: 'Evaluation Error', desc: 'The evaluation metric is wrong for similarity models' },
      { category: 'Distribution Shift', desc: 'Live contracts use different legal language' },
      { category: 'Metric Mismatch', desc: 'F1 is the wrong metric for search relevance' },
      { category: 'Labeling Artifact', desc: 'Similarity labels are systematically biased' },
    ],
    correctCategory: 'Data Leakage',
    reveal: 'The train/test split was performed at the sentence-pair level, not the document level. A contract that appears in training will also have sentence pairs in the test set. The model sees text from contract #4821 during training; test pairs from the same contract share vocabulary, clause structure, and even verbatim boilerplate. The model can partially "memorise" document-specific language and match test sentences to training sentences from the same document — not by understanding semantic similarity but by surface lexical overlap. Live contracts are genuinely unseen at the document level, and the inflated 0.931 F1 does not hold.',
    fix: 'Always split at the natural unit of independence — here, the document. Assign entire contracts to train or test, never split pairs across the same contract. `GroupShuffleSplit(groups=contract_ids)` achieves this in scikit-learn. Similarly, for any task with hierarchical structure (users, sessions, documents, patients), the split must happen at the top level of the hierarchy, not at the leaf level. After fixing, the baseline F1 will drop but will be an honest estimate of generalisation to new documents.',
  },
  {
    id: 'stf17',
    title: 'Model Selection Bias on Test Set',
    flawCategory: 'Evaluation Error',
    setup: `A team conducts a hyperparameter sweep to find the best gradient boosting model for predicting customer churn. They have a single fixed test set of 20,000 customers.

search_results = []
for params in hyperparameter_grid:  # 50 configurations
    model = XGBClassifier(**params)
    model.fit(X_train, y_train)
    test_auc = roc_auc_score(y_test, model.predict_proba(X_test)[:,1])
    search_results.append({'params': params, 'test_auc': test_auc})

best = max(search_results, key=lambda x: x['test_auc'])
print(f"Best model test AUC: {best['test_auc']:.3f}")
# Output: Best model test AUC: 0.891

# Reported in the project summary as: "Our model achieves AUC 0.891 on held-out data"

The model ships. Live AUC measured 6 weeks later: 0.847.`,
    question: 'Why is the reported 0.891 AUC an overestimate of true model quality?',
    options: [
      { category: 'Data Leakage', desc: 'Test data was used to select features during preprocessing' },
      { category: 'Evaluation Error', desc: 'Selecting the best model by test performance inflates the reported metric' },
      { category: 'Distribution Shift', desc: 'Customer behavior changed between evaluation and deployment' },
      { category: 'Metric Mismatch', desc: 'AUC is the wrong metric for churn prediction' },
      { category: 'Labeling Artifact', desc: 'Churn labels are inconsistently defined' },
    ],
    correctCategory: 'Evaluation Error',
    reveal: 'With 50 models evaluated on the same test set, the highest observed test AUC is the maximum of 50 random variables — even if all models had true AUC = 0.860, the expected maximum across 50 evaluations would be substantially higher. Each evaluation is a noisy estimate; picking the peak inflates the estimate. The test set has been used as a selection criterion, meaning it is no longer an unbiased estimator of generalisation performance. This is sometimes called "test set peeking" or "evaluation set overfitting." The gap (0.891 vs 0.847) is the selection inflation.',
    fix: 'Reserve a final holdout set that is only touched once — after all model selection decisions are made. Workflow: use a validation set (or cross-validation) for all hyperparameter tuning and model selection; the test set is evaluated exactly once at the very end on the single chosen model. If a third split is impractical, use nested cross-validation (outer loop estimates generalisation, inner loop tunes hyperparameters). When reporting results, always disclose how many models/configurations were compared against the same test set.',
  },
  {
    id: 'stf18',
    title: 'Precision@K Without Exposure Control',
    flawCategory: 'Metric Mismatch',
    setup: `A music streaming platform evaluates its recommendation system offline using Precision@10 — the fraction of the top-10 recommended tracks that the user subsequently listened to.

Offline evaluation results:
  System A (new model):  Precision@10 = 0.38
  System B (old model):  Precision@10 = 0.31

The team ships System A, calling it a +22.6% improvement.

Post-launch user research reveals:
- Long-tail artist discovery is down 34% compared to the previous system
- Users report recommendations feel "predictable" and "repetitive"
- New artists have near-zero probability of appearing in top-10 lists
- Catalog utilisation: top 1% of tracks account for 61% of all recommendations (up from 44%)`,
    question: 'System A wins on Precision@10 but harms catalog diversity. What is the buried flaw in using Precision@10?',
    options: [
      { category: 'Data Leakage', desc: 'Future listening data contaminated the training labels' },
      { category: 'Evaluation Error', desc: 'The Precision@10 calculation was implemented incorrectly' },
      { category: 'Distribution Shift', desc: 'User taste changed between training and deployment' },
      { category: 'Metric Mismatch', desc: 'Precision@10 rewards popularity bias and ignores catalog coverage' },
      { category: 'Labeling Artifact', desc: 'Listening events were attributed to the wrong recommendation' },
    ],
    correctCategory: 'Metric Mismatch',
    reveal: 'Precision@10 is computed against historical listening data, and users can only listen to tracks they were exposed to. Popular tracks appear in listening history at much higher rates than long-tail tracks — not because they are universally preferred, but because they are universally surfaced. System A learned to maximise Precision@10 by recommending the most popular tracks, which have the highest prior probability of appearing in any user\'s listening history regardless of personal taste. Long-tail tracks have near-zero probability of being in the evaluation labels even if the user would genuinely love them. The metric is measuring agreement with historical popularity, not recommendation quality.',
    fix: 'Complement Precision@K with coverage and novelty metrics: Catalog Coverage (fraction of catalog ever recommended), Expected Intra-List Diversity (average pairwise dissimilarity in a recommendation slate), and Novelty (average inverse popularity of recommended items). Use IPS-corrected evaluation to reweight items by the probability they were exposed in the historical data. In A/B tests, measure not just CTR but session depth, long-tail engagement rate, and return-visit rate — these capture discovery value that Precision@K cannot.',
  },
  {
    id: 'stf19',
    title: 'Label Delay in Streaming Predictions',
    flawCategory: 'Labeling Artifact',
    setup: `A fintech company builds a real-time model to predict payment default risk at transaction time. The label is \`default_30d\` — whether the account misses a payment in the next 30 days.

Training data construction:
  - Transactions logged in real time with features (amount, merchant category, time, account balance)
  - Labels joined from the payment outcomes table 30 days later
  - Training set: 6 months of transactions with labels attached

# Naive join — assumes all labels are available
df = transactions.merge(outcomes, on='account_id', how='inner')
# Inner join silently drops accounts that haven't yet resolved (< 30 days old)

model.fit(df[feature_cols], df['default_30d'])
print(f"Validation AUC: {roc_auc_score(val_y, model.predict_proba(val_X)[:,1])}")
# Output: Validation AUC: 0.83

Production AUC (30 days after deployment, measured on resolved accounts): 0.76
Calibration is off: the model underestimates default probability for recently-opened accounts.`,
    question: 'Validation AUC is 0.83 but production AUC is 0.76, with miscalibration on new accounts. What is the buried flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Future payment outcomes contaminated the training features' },
      { category: 'Evaluation Error', desc: 'The validation set was constructed using the wrong time window' },
      { category: 'Distribution Shift', desc: 'Payment behavior changed after the model was deployed' },
      { category: 'Metric Mismatch', desc: 'AUC is the wrong metric for default risk' },
      { category: 'Labeling Artifact', desc: 'The training labels are systematically biased by label resolution delay' },
    ],
    correctCategory: 'Labeling Artifact',
    reveal: 'The inner join silently discards all accounts that have not yet resolved — i.e., accounts opened in the last 30 days at label-creation time. These accounts are disproportionately new customers. New accounts have different risk profiles (no payment history, thin credit file) and are precisely the population where accurate risk assessment matters most. The training set systematically excludes this population, so the model never learns from it. At production time, new accounts arrive constantly and the model encounters a distribution it was never trained on. The inner join creates survivorship bias: only accounts that survived long enough to get a label are included.',
    fix: 'Use a left join and explicitly handle accounts with pending labels (e.g. set a flag `label_resolved = False` for transactions within 30 days of the label cutoff, and exclude them from training or treat them as censored). For survival/delay problems, consider a censored-label model (e.g. survival regression) that can learn from partial observations. Always document the label delay in your data pipeline, and validate that the label window in the training set matches the label window at serving time.',
  },
  {
    id: 'stf20',
    title: 'Multicollinearity Masking Feature Importance',
    flawCategory: 'Evaluation Error',
    setup: `A marketing team builds a linear regression model to predict weekly revenue from advertising spend. The feature set includes three spend channels that are always purchased together in the same budget package:

feature_cols = [
    'tv_spend',          # always correlated with digital
    'digital_spend',     # always correlated with tv
    'programmatic_spend',# subset of digital, r=0.97 with digital_spend
    'email_sent_count',
    'promo_active',
]

from sklearn.linear_model import Ridge
model = Ridge(alpha=1.0)
model.fit(X_train, y_train)

# Feature coefficients (importance proxy)
for feat, coef in zip(feature_cols, model.coef_):
    print(f"  {feat:<25} {coef:+.3f}")

# Output:
#   tv_spend                  +0.041
#   digital_spend             +0.038
#   programmatic_spend        +0.029
#   email_sent_count          +0.187
#   promo_active              +0.312

The team concludes TV and digital are relatively unimportant (low coefficients) and proposes cutting TV budget entirely.`,
    question: 'The model assigns low coefficients to TV and digital spend. What is the flaw in concluding they are unimportant?',
    options: [
      { category: 'Data Leakage', desc: 'Spend data from future weeks contaminated the training features' },
      { category: 'Evaluation Error', desc: 'Coefficient magnitude is misleading when features are highly correlated' },
      { category: 'Distribution Shift', desc: 'The relationship between spend and revenue changed over time' },
      { category: 'Metric Mismatch', desc: 'Revenue is the wrong optimisation target for this model' },
      { category: 'Labeling Artifact', desc: 'Weekly revenue labels are aggregated incorrectly' },
    ],
    correctCategory: 'Evaluation Error',
    reveal: 'When features are highly correlated (r=0.97 between `digital_spend` and `programmatic_spend`), the model distributes the total attribution across all correlated features. The combined importance of `tv_spend + digital_spend + programmatic_spend` is actually substantial — it is just split three ways because the model cannot distinguish their individual contributions. Dropping TV spend would remove a large portion of the correlated group, and revenue would drop significantly — but the individual coefficient of `tv_spend` gave no indication of this. This is a known limitation of coefficient magnitude as a feature importance metric under multicollinearity.',
    fix: 'For correlated features, use grouped or permutation importance: permute the entire group of correlated features together (tv + digital + programmatic) and measure the joint importance drop. Alternatively, use VIF (Variance Inflation Factor) to detect multicollinearity before interpreting coefficients — VIF > 10 is a red flag. For budget allocation decisions, consider using marketing mix modeling (Shapley-value attribution or Bayesian MMM) which handles correlated spend channels explicitly. Never cut budget based on coefficient magnitude alone without checking feature correlations first.',
  },
  {
    id: 'stf21',
    title: 'Optimising CTR While Destroying Session Value',
    flawCategory: 'Metric Mismatch',
    setup: `An ad platform trains a CTR (click-through rate) prediction model to rank ads. They run an offline experiment:

# Training objective: binary cross-entropy on click labels
# Label: did the user click the ad (1) or not (0)?

model = DeepFM(embedding_dim=64, hidden_layers=[256, 128, 64])
model.train(click_log_dataset)

# Offline evaluation
offline_auc = evaluate_auc(model, held_out_click_log)
print(f"Offline AUC: {offline_auc:.3f}")   # 0.792 (up from 0.761 baseline)

They ship via A/B test. After 14 days (n=4.2M sessions):

Metric                  Control    Treatment    Delta
-----------------------------------------------------
CTR                      2.41%      2.73%       +13.3%  *
Revenue per session     $0.91      $0.83        -8.8%   *
Session length (min)    6.2        4.8          -22.6%  *
7-day retention         38.2%      34.1%        -10.7%  *

(* p < 0.01)`,
    question: 'CTR improved +13.3% but revenue and retention both declined. What is the buried flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Click labels from the test set contaminated model training' },
      { category: 'Evaluation Error', desc: 'The A/B test was not run for long enough' },
      { category: 'Distribution Shift', desc: 'User behavior changed between training and deployment' },
      { category: 'Metric Mismatch', desc: 'CTR and AUC optimise for clicks, not for business value' },
      { category: 'Labeling Artifact', desc: 'Click labels include accidental clicks and bot traffic' },
    ],
    correctCategory: 'Metric Mismatch',
    reveal: 'The model was trained to maximise click probability, not business value. It learned to surface ads that are "curiosity clicks" — clickbait-style creatives that get clicked but deliver poor post-click experience. Users click, feel disappointed, shorten their session, and are less likely to return. CTR went up because the model got better at generating clicks; revenue per session fell because post-click conversion quality dropped; retention fell because user trust eroded. Optimising for a proxy metric (clicks) that is imperfectly correlated with the true objective (revenue, retention) produced a model that exploited the proxy while undermining the goal.',
    fix: 'Define the objective hierarchy: revenue > retention > CTR. Train the model on the highest-level signal available — ideally conversion value or a weighted combination of clicks, conversions, and session signals. Use multi-task learning to jointly predict CTR, conversion rate, and post-click engagement. Establish guardrail metrics (revenue per session, 7-day retention) in every A/B test, not just the primary proxy metric. Any experiment that wins on the proxy but hurts a guardrail should be flagged for deep analysis before shipping.',
  },
  {
    id: 'stf22',
    title: 'User-Level vs Request-Level Splitting',
    flawCategory: 'Data Leakage',
    setup: `A team builds a personalised search ranking model. Each training example is a (user, query, result) triple with a relevance label.

Dataset: 2.4M query sessions from 180,000 unique users.

# Standard random split at the request level
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    features, labels, test_size=0.2, random_state=42
)
# X includes: user_id embedding, query_embedding, item_embedding,
#             user_history_features (avg_clicks_by_category, top_genres)

model = LightGBM()
model.fit(X_train, y_train)
ndcg = evaluate_ndcg(model, X_test, y_test)
print(f"Test NDCG@10: {ndcg:.3f}")   # 0.687

# Live evaluation (new users, first 4 weeks post-launch): NDCG@10 = 0.531`,
    question: 'Test NDCG@10 is 0.687 but live performance on new users is 0.531. What is the buried flaw?',
    options: [
      { category: 'Data Leakage', desc: 'The same users appear in both train and test, inflating evaluation metrics' },
      { category: 'Evaluation Error', desc: 'NDCG@10 is computed incorrectly on the test set' },
      { category: 'Distribution Shift', desc: 'New users have different preferences than existing users' },
      { category: 'Metric Mismatch', desc: 'NDCG is the wrong metric for personalised search' },
      { category: 'Labeling Artifact', desc: 'Relevance labels are biased by prior search results' },
    ],
    correctCategory: 'Data Leakage',
    reveal: 'The split is at the request level, so the same user appears in both training and test sets. A user who made 20 search sessions has ~16 in train and ~4 in test. The model learns user-specific preference patterns from those 16 training sessions; when it sees the same user\'s 4 test sessions, it has already seen that user and can leverage the stored user embedding and history features. This is user-level leakage through personalisation features. In production, new users have no prior sessions — the model must generalise to users it has never seen. The 0.687 NDCG reflects performance on known users, not cold-start performance.',
    fix: 'Split at the user level: all sessions from a given user land entirely in train or test. `GroupShuffleSplit(groups=user_ids)` achieves this. Also evaluate separately on cold-start users (users with fewer than N prior sessions) since that is the hardest and most business-critical subpopulation. If the model relies heavily on user history features, track cold-start performance as a standalone metric in every experiment — new user retention depends on it.',
  },
  {
    id: 'stf23',
    title: 'Survivorship Bias in Stock Prediction',
    flawCategory: 'Labeling Artifact',
    setup: `A quant team builds a 6-month return prediction model using 15 years of US equity data. They source their universe from the current S&P 500 constituent list and pull 15 years of historical prices for those 500 companies.

# Build training universe from current S&P 500 components
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
# Output: Sharpe: 1.84

Backtest shows consistent outperformance. Live trading produces Sharpe of 0.31 over 18 months.`,
    question: 'The backtest shows Sharpe of 1.84 but live trading produces 0.31. What is the fundamental flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Future price data was used to construct training features' },
      { category: 'Evaluation Error', desc: 'The Sharpe ratio was computed incorrectly' },
      { category: 'Distribution Shift', desc: 'Market conditions changed between backtest and live trading' },
      { category: 'Metric Mismatch', desc: 'Sharpe ratio is the wrong metric for equity prediction' },
      { category: 'Labeling Artifact', desc: 'The training universe contains only surviving companies, biasing returns upward' },
    ],
    correctCategory: 'Labeling Artifact',
    reveal: 'The training universe was built from today\'s S&P 500 constituents — companies that survived and thrived for 15 years. Over any 15-year window, hundreds of companies were added to or removed from the index: companies that went bankrupt, were acquired at distressed valuations, or declined and were delisted are absent. The model is trained only on winners. Every "historical" data point for a current constituent is actually a survivorship-selected positive example. Return distributions are systematically biased upward. The model learns patterns that correlate with long-term survival, which are not available at prediction time and overstate expected returns for the forward-looking universe.',
    fix: 'Use a point-in-time index membership list: for any training date T, only include companies that were in the index at time T, not companies that happen to still be in the index today. Data vendors (CRSP, Compustat) provide historical constituent lists. At each rebalancing date, the investable universe should be the set of companies that were tradeable at that date — including those that subsequently went bankrupt or were delisted. This is the single most common and most costly mistake in quantitative backtesting.',
  },
  {
    id: 'stf24',
    title: 'Feedback Loop in Production Retraining',
    flawCategory: 'Distribution Shift',
    setup: `A content moderation team deploys a toxicity classifier. The model runs in production and its predictions are used to hide content flagged as toxic (score > 0.7). Moderators review a sample of flagged content to generate labels. These labels feed back into retraining every two weeks.

# Retraining pipeline (runs every 2 weeks)
def retrain_pipeline():
    # Collect labels from moderator review queue
    new_labels = fetch_moderator_labels()        # labels on model-flagged content
    # Add to training data
    training_data = existing_data + new_labels
    new_model = train_classifier(training_data)
    return new_model

After 6 months of biweekly retraining, the team notices:
- False negative rate (toxic content not flagged) rising from 8% to 19%
- The model's precision on flagged items is high (0.94) but recall is falling
- Content from a specific political subreddit is never flagged despite moderator escalations`,
    question: 'The model retrains every 2 weeks and precision stays high, but recall is falling and a whole subreddit escapes detection. What is the flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Moderator labels are contaminated with model predictions' },
      { category: 'Evaluation Error', desc: 'Precision and recall are computed on a biased evaluation set' },
      { category: 'Distribution Shift', desc: 'The feedback loop creates a distribution that diverges from the true data-generating process' },
      { category: 'Metric Mismatch', desc: 'Precision is the wrong primary metric for content moderation' },
      { category: 'Labeling Artifact', desc: 'Moderators systematically disagree with the model\'s decisions' },
    ],
    correctCategory: 'Distribution Shift',
    reveal: 'The retraining pipeline only collects labels on content the model already flagged (score > 0.7). Content that the model does not flag is never reviewed and never generates labels. Over successive retraining cycles, the model gets excellent labels for content that looks like what it already thinks is toxic, but zero labels for content it misses. The label distribution drifts toward content the current model catches. New or evolved forms of toxicity — including the specific political subreddit that adapted its language — are never represented in retraining data. The model becomes increasingly confident in catching old patterns while becoming increasingly blind to new ones. Precision stays high because the model is correct about what it flags; recall drops because the uncaught content is never fed back.',
    fix: 'Reserve a random exploration slice of traffic (e.g. 5% of posts) that bypasses the classifier and goes directly to human review. This provides unbiased labels on content the model would have missed. Add a "low-confidence" queue: route content with scores 0.3–0.7 to moderators for labeling (these are the decision boundary cases most valuable for retraining). Track label distribution statistics across retraining cycles — if the positive label rate in new training data drifts significantly, that signals feedback loop degradation. Maintain a frozen evaluation set assembled independently of model predictions.',
  },
  {
    id: 'stf25',
    title: 'Unstratified CV on Severely Imbalanced Data',
    flawCategory: 'Evaluation Error',
    setup: `A team trains a fraud detection model on a severely imbalanced dataset: 1% fraud, 99% non-fraud (100,000 examples: 1,000 fraud, 99,000 legitimate).

from sklearn.model_selection import KFold, cross_val_score
from sklearn.ensemble import GradientBoostingClassifier

kf = KFold(n_splits=10, shuffle=True, random_state=42)
model = GradientBoostingClassifier()

scores = cross_val_score(model, X, y, cv=kf, scoring='accuracy')
print(f"Mean CV Accuracy: {scores.mean():.4f} +/- {scores.std():.4f}")
# Mean CV Accuracy: 0.9901 +/- 0.0089

# The team reports this as strong model performance.
# Fold 7 breakdown (discovered later):
#   Fold 7 train: 90,000 examples — 890 fraud
#   Fold 7 test:  10,000 examples — 0 fraud (!!!)
#   Fold 7 accuracy: 1.0000 (perfect — the model predicted all non-fraud)`,
    question: 'The model reports 0.9901 mean CV accuracy including a perfect 1.0 fold. What is the flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Fraud labels from the test fold contaminated model training' },
      { category: 'Evaluation Error', desc: 'Unstratified CV on imbalanced data produces unstable and misleading folds' },
      { category: 'Distribution Shift', desc: 'Fraud patterns differ across folds due to temporal ordering' },
      { category: 'Metric Mismatch', desc: 'Accuracy is the wrong metric for fraud detection' },
      { category: 'Labeling Artifact', desc: 'Fraud labels are inconsistently applied across the dataset' },
    ],
    correctCategory: 'Evaluation Error',
    reveal: 'With 1% fraud rate and unstratified 10-fold CV, random chance can assign 0 fraud examples to a fold. Fold 7 had 10,000 test examples and zero fraud cases — the model achieved perfect accuracy by predicting all non-fraud, which is uninformative. The high mean accuracy (0.9901) and high variance (0.0089) are both artifacts of the fold composition instability. The 0.0089 std is inflated by folds with zero positives producing artificially perfect scores. The model was never evaluated on its ability to detect fraud; it was evaluated on its ability to predict the majority class.',
    fix: 'Use `StratifiedKFold` instead of `KFold` for any classification task with imbalance: `StratifiedKFold(n_splits=10, shuffle=True)` ensures each fold preserves the class ratio (approximately 1% fraud in each fold). Also replace accuracy with fraud-relevant metrics: F1 on the positive class, Precision-Recall AUC, or Cohen\'s kappa. As a rule: if any CV fold has fewer than ~30 positive examples, the fold\'s metric estimate is unreliable regardless of stratification — consider using fewer folds or upsampling before CV.',
  },
  {
    id: 'stf26',
    title: 'Temporal Proxy Feature at Serve Time',
    flawCategory: 'Data Leakage',
    setup: `A churn prediction model for a SaaS product is trained using features computed at prediction time (daily batch job).

Training feature construction (daily batch, run at end of each day):
  account_age_days = (today - account_created_at).days   # computed fresh daily

The model is trained on 18 months of daily snapshots. It achieves strong validation performance:
  Validation AUC: 0.881

In production, the daily batch job takes 6 hours and is cached. Due to an infrastructure optimisation, the batch job runs only weekly and the cached features are reused for 7 days.

After 3 weeks:
- Churn recall drops from 78% to 51%
- Accounts that churned on day 5 after the last batch run have stale 'account_age_days'
- The model was trained assuming this feature refreshes daily

# Example of staleness:
# Batch ran Monday. It is now Sunday.
# account_age_days for a Monday-churning account = 365
# account_age_days as the model expects (Sunday) = 372
# Error: 7 days — small but compounded across all age-sensitive thresholds`,
    question: 'Churn recall drops from 78% to 51% after the batch cadence changes from daily to weekly. What is the underlying flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Future churn events were encoded in training features' },
      { category: 'Evaluation Error', desc: 'The model was evaluated on a non-representative validation period' },
      { category: 'Distribution Shift', desc: 'The feature distribution at serve time differs from training due to staleness' },
      { category: 'Metric Mismatch', desc: 'Recall is the wrong metric for churn prioritisation' },
      { category: 'Labeling Artifact', desc: 'Churn labels are assigned inconsistently across accounts' },
    ],
    correctCategory: 'Distribution Shift',
    reveal: 'The model was trained on features refreshed daily — `account_age_days` had at most 1 day of staleness. At weekly batch cadence, the same feature can be up to 7 days stale. The model was trained on a feature distribution where `account_age_days` accurately reflects today\'s account age. At serve time, it receives a feature that may be systematically off by 0–7 days, with a uniform error distribution across the week. Age-sensitive decision boundaries (e.g. "accounts aged 180–190 days have higher churn risk") are shifted. More critically, other time-varying features (days since last login, days since last payment) suffer the same staleness — every time-delta feature in the feature set is now drawn from a different distribution than training.',
    fix: 'Document the expected freshness SLA for every feature at the time the model is trained. Store feature freshness metadata alongside model artifacts: "this model was trained on features with daily refresh; do not serve with staleness > 24 hours." Implement a monitoring check that compares the mean and distribution of time-delta features at serve time against training-time statistics — a stale batch will produce a clear distribution shift signal. If weekly batches are required for cost reasons, retrain the model on weekly-snapshot features so the training and serving distributions match.',
  },
  {
    id: 'stf27',
    title: 'Wrong Population for Offline Evaluation',
    flawCategory: 'Distribution Shift',
    setup: `A university trains an ML model to predict which students are at risk of dropping out. The goal is to trigger early interventions.

Evaluation setup:
  - Training/test population: all enrolled students (n=12,400)
  - Model predicts dropout risk score (0–1)
  - Test AUC: 0.84, Precision@20%: 0.61

In production, the model is integrated into the existing support system:
  - A rule-based system first flags students with GPA < 2.0 OR missed > 3 advising appointments
  - Only rule-flagged students receive the ML model score
  - Advisors use the ML score to prioritise outreach within the flagged pool

After one semester, advisors report the model "adds no value" — it ranks students within the flagged pool almost randomly.
Actual precision of the model within the flagged pool: 0.29 (worse than random for this subgroup).`,
    question: 'Test AUC was 0.84 on all students but the model is useless within the flagged pool. What is the flaw?',
    options: [
      { category: 'Data Leakage', desc: 'Dropout labels from future semesters contaminated the training features' },
      { category: 'Evaluation Error', desc: 'The test set was too small to produce a reliable AUC estimate' },
      { category: 'Distribution Shift', desc: 'The model was evaluated on the full population but deployed on a pre-filtered subpopulation' },
      { category: 'Metric Mismatch', desc: 'AUC is the wrong metric for a ranking-based intervention system' },
      { category: 'Labeling Artifact', desc: 'Dropout labels are inconsistently defined across departments' },
    ],
    correctCategory: 'Distribution Shift',
    reveal: 'The model was trained and evaluated on all 12,400 students — a population that includes low-risk students (GPA 3.8, perfect attendance) who are easy to distinguish from high-risk students. Most of the model\'s discriminative power comes from correctly scoring the easy cases at the extremes of the distribution. In production, the model only operates on students already flagged by the rule-based system (GPA < 2.0 OR missed advising). This flagged population is a hard subgroup: all members already show some risk signal. Within this restricted range, the features that drove the 0.84 AUC on the full population have much less discriminative power — the model was never trained to distinguish high-risk from very-high-risk within this stratum.',
    fix: 'Evaluate the model on the population it will actually serve, not the full population. Re-run offline evaluation exclusively on the subset of students who would be flagged by the rule-based system at each historical time point. This gives an honest estimate of the model\'s value-add within the intervention pipeline. Better still, consider replacing the two-stage system with a single unified ML model trained on the full population but evaluated and calibrated for the operating subpopulation. Whenever a model is downstream of a filter (rule-based, another model, or a business constraint), the evaluation dataset must reflect that filter.',
  },
]

function ScenarioCard({ scenario, state, onPick }) {
  const { open, picked, revealed } = state
  const isCorrect = revealed && picked === scenario.correctCategory

  return (
    <div style={{ border: `1px solid ${open ? 'rgba(240,165,0,0.35)' : 'var(--rim)'}`, borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
      {/* Header */}
      <button onClick={() => onPick('toggle')} style={{ width: '100%', textAlign: 'left', padding: '14px 18px', background: open ? 'rgba(240,165,0,0.05)' : 'var(--depth)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--ink-ghost)', minWidth: '24px' }}>{scenario.id.replace('stf', '').padStart(2, '0')}</span>
        <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{scenario.title}</span>
        <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '4px', background: 'var(--prime-bg-light)', color: 'var(--prime)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>FLAW HUNT</span>
        {revealed && <span style={{ fontSize: '11px', color: isCorrect ? 'var(--mint)' : 'var(--rose)' }}>{isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}</span>}
        <span style={{ color: 'var(--ink-ghost)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-flex' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2l4 3-4 3"/></svg></span>
      </button>

      {open && (
        <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Code/context block */}
          <pre style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--rim)', borderRadius: '8px', padding: '14px 16px', fontSize: '11.5px', color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)', lineHeight: 1.7, overflowX: 'auto', margin: '4px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{scenario.setup}</pre>

          <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink-hi)', margin: 0 }}>{scenario.question}</p>

          {/* 5 flaw category options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {scenario.options.map((opt) => {
              const isPicked = picked === opt.category
              const isAns = opt.category === scenario.correctCategory
              let bg = 'var(--depth)', border = 'var(--rim)', color = 'var(--ink-mid)'
              if (revealed) {
                if (isAns) { bg = 'rgba(52,211,153,0.15)'; border = 'rgba(52,211,153,0.35)'; color = 'var(--ink-hi)' }
                else if (isPicked) { bg = 'rgba(239,68,68,0.15)'; border = 'rgba(239,68,68,0.35)'; color = 'var(--ink-mid)' }
              } else if (isPicked) { bg = 'rgba(240,165,0,0.10)'; border = 'rgba(240,165,0,0.50)'; color = 'var(--ink-hi)' }
              return (
                <button key={opt.category} disabled={revealed} onClick={() => onPick(opt.category)}
                  style={{ textAlign: 'left', padding: 'var(--card-pad-primary)', borderRadius: '8px', background: bg, border: `1px solid ${border}`, cursor: revealed ? 'default' : 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start', transition: 'all 0.12s', width: '100%' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', minWidth: '90px', paddingTop: '2px' }}>{opt.category}</span>
                  <span style={{ fontSize: '13px', color, lineHeight: 1.5 }}>{opt.desc}</span>
                  {revealed && isAns && <span style={{ marginLeft: 'auto', color: 'var(--mint)', fontSize: '12px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg></span>}
                </button>
              )
            })}
          </div>

          {/* Reveal */}
          {revealed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>The Flaw</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{scenario.reveal}</p>
              </div>
              <div style={{ padding: '12px 16px', background: 'rgba(240,165,0,0.05)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>How to prevent it</div>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>{scenario.fix}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SpotTheFlawTab({ onNavigate }) {
  const [states, setStates] = useState(() => {
    const urlTarget = new URLSearchParams(window.location.search).get('scenario')
    const targetIdx = urlTarget ? SCENARIOS.findIndex(s => s.id === urlTarget) : -1
    try {
      const saved = JSON.parse(localStorage.getItem('msl_spot_the_flaw') || 'null')
      if (saved && saved.length === SCENARIOS.length) {
        if (targetIdx !== -1) return saved.map((s, i) => i === targetIdx ? { ...s, open: true } : s)
        return saved
      }
    } catch {}
    return SCENARIOS.map((_, i) => ({ open: i === targetIdx, picked: null, revealed: false }))
  })

  useEffect(() => {
    localStorage.setItem('msl_spot_the_flaw', JSON.stringify(states))
  }, [states])

  function handlePick(idx, action) {
    setStates(prev => prev.map((s, i) => {
      if (i !== idx) return s
      if (action === 'toggle') {
        const opening = !s.open
        window.history.replaceState(null, '', opening ? `?scenario=${SCENARIOS[idx].id}#spottheflaw` : '#spottheflaw')
        return { ...s, open: opening }
      }
      return { ...s, picked: action, revealed: true }
    }))
  }

  const attempted = states.filter(s => s.revealed).length
  const correct = states.filter((s, i) => s.revealed && s.picked === SCENARIOS[i].correctCategory).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <TabHeader title="Spot the Flaw" />
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '580px', margin: '0 0 4px' }}>
          Every scenario looks reasonable. Each contains exactly one buried methodological flaw. Find it before the interviewer does.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>Not code bugs — methodology errors. Data leakage, evaluation mistakes, distribution shift, metric mismatch, labeling artifacts.</p>
        <div style={{ marginTop: '8px' }}><FidelityBadge tier="conceptual" /></div>
      </div>
      <HowToStrip
        skill="Identifying buried methodological flaws"
        steps={['Read the analysis — it looks reasonable by design', 'Select the flaw category you think applies', 'See the exact error and how to fix it']}
      />

      {/* Score strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', background: 'linear-gradient(160deg, var(--card-tint) 0%, var(--depth) 40%)', borderRadius: '10px', border: '1px solid var(--rim)' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{attempted}/{SCENARIOS.length} attempted</span>
        {attempted > 0 && <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{correct} correct ({Math.round(correct / attempted * 100)}%)</span>}
        <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
          <div style={{ width: `${(attempted / SCENARIOS.length) * 100}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Empty state for first-time visitors */}
      {attempted === 0 && (
        <div style={{ marginBottom: '20px', padding: '16px 18px', borderRadius: '10px', background: 'rgba(240,165,0,0.08)', border: '1px dashed rgba(240,165,0,0.30)' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', fontWeight: 700 }}>Start here</div>
          <div style={{ fontSize: '13px', color: 'var(--ink-mid)', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
            New to Spot the Flaw? Begin with <strong style={{ color: 'var(--ink-hi)' }}>scenario #1</strong>. Each scenario presents a real production ML decision; your job is to identify which choice would silently break the model. The full set takes ~45 minutes.
          </div>
        </div>
      )}

      {/* Scenarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SCENARIOS.map((sc, i) => (
          <ScenarioCard key={sc.id} scenario={sc} state={states[i]} onPick={(action) => handlePick(i, action)} />
        ))}
      </div>

      {onNavigate && (
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
          <button onClick={() => onNavigate('combinator')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--prime)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Take the full mock exam in Combinator</span>
            <span style={{ fontSize: '12px', color: 'var(--prime)' }}>→</span>
          </button>
        </div>
      )}

      {onNavigate && (
        <div style={{ background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
          <span style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.5 }}>
            Go deeper → Read <strong style={{ color: 'var(--prime)' }}>The Feature Store Time-Travel Bug: How Point-in-Time Joins Break Under Load</strong> in Gradient
          </span>
          <button onClick={() => onNavigate('gradient')} style={{ background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: '6px', color: 'var(--prime)', fontSize: '12px', fontFamily: 'var(--font-sans)', fontWeight: 500, padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Read in Gradient →
          </button>
        </div>
      )}
    </div>
  )
}
