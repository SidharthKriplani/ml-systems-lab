import { useState, useEffect } from 'react'
import FidelityBadge from '../components/FidelityBadge.jsx'

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
    try {
      const saved = JSON.parse(localStorage.getItem('msl_spot_the_flaw') || 'null')
      if (saved && saved.length === SCENARIOS.length) return saved
    } catch {}
    return SCENARIOS.map(() => ({ open: false, picked: null, revealed: false }))
  })

  useEffect(() => {
    localStorage.setItem('msl_spot_the_flaw', JSON.stringify(states))
  }, [states])

  function handlePick(idx, action) {
    setStates(prev => prev.map((s, i) => {
      if (i !== idx) return s
      if (action === 'toggle') return { ...s, open: !s.open }
      return { ...s, picked: action, revealed: true }
    }))
  }

  const attempted = states.filter(s => s.revealed).length
  const correct = states.filter((s, i) => s.revealed && s.picked === SCENARIOS[i].correctCategory).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>Spot the Flaw</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--ink-mid)', lineHeight: 1.6, maxWidth: '580px', margin: '0 0 4px' }}>
          Every scenario looks reasonable. Each contains exactly one buried methodological flaw. Find it before the interviewer does.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>Not code bugs — methodology errors. Data leakage, evaluation mistakes, distribution shift, metric mismatch, labeling artifacts.</p>
        <div style={{ marginTop: '8px' }}><FidelityBadge tier="conceptual" /></div>
      </div>

      {/* Score strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 16px', background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, var(--depth) 40%)', borderRadius: '10px', border: '1px solid var(--rim)' }}>
        <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>{attempted}/{SCENARIOS.length} attempted</span>
        {attempted > 0 && <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{correct} correct ({Math.round(correct / attempted * 100)}%)</span>}
        <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
          <div style={{ width: `${(attempted / SCENARIOS.length) * 100}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
      </div>

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
