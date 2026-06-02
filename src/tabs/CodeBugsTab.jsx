import { useState, useEffect } from 'react'

const LS_KEY = 'msl_score:codebugs'

const DOMAIN_COLORS = {
  Spark: 'var(--prime)',
  'Feature Engineering': 'var(--prime)',
  'Model Training': 'var(--prime)',
  SQL: 'var(--prime)',
  MLOps: 'var(--prime)',
  DistTraining: 'var(--prime)',
  SilentData: 'var(--prime)',
}

const BUGS = [
  // ─── SPARK ───────────────────────────────────────────────────────────────
  {
    id: 'S1',
    domain: 'Spark',
    title: 'Spark Job OOM — Skewed Join',
    description: 'This PySpark job joins a 10TB transactions table with a small lookup table but crashes with OOM on executors.',
    code: `from pyspark.sql import SparkSession
from pyspark.sql.functions import col

spark = SparkSession.builder.getOrCreate()
transactions = spark.read.parquet("s3://bucket/transactions/")
merchants = spark.read.parquet("s3://bucket/merchants/")

# Join transactions with merchant lookup
result = transactions.join(merchants, on="merchant_id", how="left")
result.write.parquet("s3://bucket/output/")`,
    options: {
      A: 'Missing `.cache()` before the join',
      B: 'Should use `inner` join instead of `left`',
      C: 'Large table joined without broadcast hint — causes full shuffle; merchant table should be broadcast',
      D: 'Missing `repartition()` before write',
    },
    correct: 'C',
    impact: 'Full shuffle of 10TB transactions data. Each partition must send/receive data over network. OOM when shuffle spill exceeds executor memory.',
    fix: "Add `broadcast` hint: `transactions.join(broadcast(merchants), on='merchant_id', how='left')`. Merchant table (small) is sent to every executor, avoiding the shuffle entirely. Set `spark.sql.autoBroadcastJoinThreshold` to auto-broadcast tables under a size threshold.",
  },
  {
    id: 'S2',
    domain: 'Spark',
    title: 'Spark Streaming — Data Loss on Restart',
    description: 'This Spark Structured Streaming job processes Kafka events but loses progress on restart.',
    code: `from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import StructType, StringType

spark = SparkSession.builder.getOrCreate()
schema = StructType().add("user_id", StringType()).add("event", StringType())

df = (spark.readStream
      .format("kafka")
      .option("kafka.bootstrap.servers", "broker:9092")
      .option("subscribe", "events")
      .load())

parsed = df.select(from_json(col("value").cast("string"), schema).alias("data"))

query = (parsed.writeStream
         .format("delta")
         .option("path", "s3://bucket/events/")
         .trigger(processingTime="1 minute")
         .start())
query.awaitTermination()`,
    options: {
      A: 'Missing `.option("startingOffsets", "earliest")`',
      B: 'Missing `checkpointLocation` option — Spark cannot recover Kafka offsets on restart',
      C: 'Should use `foreachBatch` instead of direct write',
      D: "Delta format doesn't support streaming",
    },
    correct: 'B',
    impact: "Without a checkpoint, Spark loses Kafka offset state on restart. Either replays all messages from beginning (duplicate processing) or starts from latest (data loss), depending on Kafka retention.",
    fix: "Add `.option('checkpointLocation', 's3://bucket/checkpoints/events/')` to the writeStream. Checkpoint stores Kafka offsets and streaming state, enabling exactly-once semantics on restart.",
  },
  {
    id: 'S3',
    domain: 'Spark',
    title: 'Spark — Wrong Window Aggregation',
    description: 'This job computes 7-day rolling revenue per user but produces incorrect results.',
    code: `from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum as spark_sum, window

spark = SparkSession.builder.getOrCreate()
orders = spark.read.parquet("s3://bucket/orders/")

# 7-day rolling revenue per user
result = (orders
    .groupBy("user_id", window(col("order_time"), "7 days"))
    .agg(spark_sum("revenue").alias("rolling_revenue")))

result.write.parquet("s3://bucket/output/")`,
    options: {
      A: 'Should use `sum` not `spark_sum`',
      B: 'Missing `orderBy` before groupBy',
      C: 'Window function creates non-overlapping 7-day tumbling windows, not a rolling/sliding window — needs a slide duration',
      D: 'Should use pandas UDF instead',
    },
    correct: 'C',
    impact: "`window('7 days')` creates tumbling (non-overlapping) windows. User's Jan 1–7 and Jan 8–14 are separate buckets. To compute 'revenue in last 7 days from any point', you need a sliding window.",
    fix: "Use `window(col('order_time'), '7 days', '1 day')` — 7-day window sliding by 1 day. Or use a self-join approach: join orders to all orders within 7 days prior. For time-series rolling aggregations, Pandas on Spark (`orderBy + rangeBetween`) may be cleaner.",
  },
  {
    id: 'S4',
    domain: 'Spark',
    title: 'Spark — UDF Performance Regression',
    description: "A data engineer replaced a SQL expression with a Python UDF for 'flexibility'. The job now takes 10x longer.",
    code: `from pyspark.sql import SparkSession
from pyspark.sql.functions import udf, col
from pyspark.sql.types import FloatType

spark = SparkSession.builder.getOrCreate()
df = spark.read.parquet("s3://bucket/features/")

# Normalize score to 0-1 range
@udf(returnType=FloatType())
def normalize(score, min_val, max_val):
    if max_val == min_val:
        return 0.0
    return float((score - min_val) / (max_val - min_val))

result = df.withColumn(
    "norm_score",
    normalize(col("score"), col("min_score"), col("max_score"))
)
result.write.parquet("s3://bucket/output/")`,
    options: {
      A: 'UDF return type should be DoubleType',
      B: 'Python UDFs break Catalyst optimizer and serialize data row-by-row through Python interpreter — replace with native Spark functions',
      C: 'Should use `pandas_udf` for type safety',
      D: 'Missing null check in UDF',
    },
    correct: 'B',
    impact: "Python UDFs: Catalyst can't optimize them, JVM must serialize each row to Python, process, serialize back. For simple math, this is 10–100x slower than equivalent Spark SQL/native functions.",
    fix: "Use Spark native: `from pyspark.sql.functions import when; df.withColumn('norm_score', when(col('max_score') == col('min_score'), 0.0).otherwise((col('score') - col('min_score')) / (col('max_score') - col('min_score'))))`",
  },

  // ─── FEATURE ENGINEERING ────────────────────────────────────────────────
  {
    id: 'F1',
    domain: 'Feature Engineering',
    title: 'Target Encoding Data Leakage',
    description: 'A feature engineer applies target encoding to the full dataset before train/test split.',
    code: `import pandas as pd
from sklearn.model_selection import train_test_split

df = pd.read_parquet("training_data.parquet")

# Target encode 'category' feature
target_mean = df.groupby('category')['label'].transform('mean')
df['category_encoded'] = target_mean

# Split after encoding
X = df.drop('label', axis=1)
y = df['label']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)`,
    options: {
      A: 'Should use one-hot encoding instead',
      B: '`transform(\'mean\')` is incorrect syntax',
      C: 'Target encoding computed on full dataset including test set — test labels leak into training features',
      D: 'Should stratify the train/test split',
    },
    correct: 'C',
    impact: "Test set labels influence the encoding values. The model implicitly 'sees' test labels during training. Offline metrics look great; production performance disappoints — classic leakage pattern.",
    fix: "Fit encoder on training set only: compute `category_mean = X_train.join(y_train).groupby('category')['label'].mean()`. Then `X_train['cat_enc'] = X_train['category'].map(category_mean)`, `X_test['cat_enc'] = X_test['category'].map(category_mean)`. For k-fold safe encoding, use `category_encoders.TargetEncoder` with cross_val_mode.",
  },
  {
    id: 'F2',
    domain: 'Feature Engineering',
    title: 'Feature Store Point-in-Time Leakage',
    description: 'Training data is created by joining user features to labels without respecting point-in-time correctness.',
    code: `import pandas as pd

labels = pd.read_parquet("labels.parquet")
# columns: user_id, event_time, label

user_features = pd.read_parquet("user_features.parquet")
# columns: user_id, feature_date, feature_value

# Join latest features to each label event
latest_features = (user_features
    .sort_values('feature_date')
    .groupby('user_id')
    .last()
    .reset_index())
training_data = labels.merge(latest_features, on='user_id', how='left')`,
    options: {
      A: "Should use `first()` instead of `last()`",
      B: 'Joins the latest (possibly future) feature value to historical label events — uses future data',
      C: 'Should use an outer join',
      D: 'Missing null handling for users with no features',
    },
    correct: 'B',
    impact: "If a label event happened on Jan 1 and the user's latest feature was updated on Jan 10, the model trains on features from 9 days in the future. Model learns impossible patterns. Production: only past features available → prediction quality collapses.",
    fix: "Point-in-time join: for each (user_id, event_time) label row, find the latest feature row where feature_date <= event_time. In SQL: `LEFT JOIN user_features f ON f.user_id = l.user_id AND f.feature_date = (SELECT MAX(feature_date) FROM user_features WHERE user_id = l.user_id AND feature_date <= l.event_time)`. Feature stores (Feast, Tecton) handle this automatically.",
  },
  {
    id: 'F3',
    domain: 'Feature Engineering',
    title: 'Imputation Fitted on Wrong Data',
    description: 'A preprocessing pipeline imputes missing values but is fitted incorrectly.',
    code: `from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np

df = pd.read_parquet("data.parquet")
X, y = df.drop('target', axis=1), df['target']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Impute missing values
imputer = SimpleImputer(strategy='mean')
imputer.fit(X)  # Fitted on full dataset!
X_train = imputer.transform(X_train)
X_test = imputer.transform(X_test)`,
    options: {
      A: 'Should use median strategy instead of mean',
      B: '`imputer.fit(X)` uses the full dataset including test set — test statistics leak into imputation',
      C: 'Should call `fit_transform` on both train and test',
      D: 'Missing `random_state` in SimpleImputer',
    },
    correct: 'B',
    impact: "The mean used for imputation is computed including test set values. Test data statistics influence training preprocessing. Mild effect on imputation, but violates train/test independence. In production with no test labels, mean will differ.",
    fix: "`imputer.fit(X_train)` only. Then `X_train = imputer.transform(X_train)` and `X_test = imputer.transform(X_test)`. Use sklearn `Pipeline` to enforce this automatically: `Pipeline([('impute', SimpleImputer()), ('model', ...)])`",
  },
  {
    id: 'F4',
    domain: 'Feature Engineering',
    title: 'Infinite Values After Log Transform',
    description: 'A feature pipeline applies log transform to handle skewness but produces inf/NaN values.',
    code: `import pandas as pd
import numpy as np

df = pd.read_parquet("features.parquet")

# Log-transform revenue features to reduce skew
revenue_cols = ['revenue_7d', 'revenue_30d', 'revenue_90d']
for col in revenue_cols:
    df[col] = np.log(df[col])

df.to_parquet("features_transformed.parquet")`,
    options: {
      A: 'Should use `log2` instead of `log`',
      B: '`np.log(0)` = -inf and `np.log(negative)` = NaN — zero/negative revenues produce invalid values',
      C: 'Should normalize before log transform',
      D: 'Log transform should only be applied to training data',
    },
    correct: 'B',
    impact: "Revenue can be 0 (no purchases) or negative (refunds). np.log(0) = -inf, np.log(-1) = NaN. These propagate through the model silently, producing undefined behavior. Tree models may handle NaN differently than linear models.",
    fix: "Use `np.log1p(np.clip(df[col], 0, None))` — clips negatives to 0 (or handle separately), then log(1+x) which is defined at 0. Alternatively: signed log transform `sign(x) * log(1 + |x|)` preserves sign for refunds.",
  },

  // ─── MODEL TRAINING ──────────────────────────────────────────────────────
  {
    id: 'M1',
    domain: 'Model Training',
    title: 'Wrong Cross-Validation on Time Series',
    description: 'A model is cross-validated on time series data using standard k-fold.',
    code: `from sklearn.model_selection import cross_val_score, KFold
from sklearn.ensemble import GradientBoostingClassifier
import pandas as pd

df = pd.read_parquet("timeseries_features.parquet").sort_values('date')
X = df.drop(['date', 'target'], axis=1)
y = df['target']

# 5-fold cross-validation
cv = KFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(GradientBoostingClassifier(), X, y, cv=cv)
print(f"CV AUC: {scores.mean():.3f}")`,
    options: {
      A: 'Should use `StratifiedKFold` for imbalanced classes',
      B: 'KFold with shuffle=True randomly assigns future data to training folds — forward leakage from future to past',
      C: 'Should use more than 5 folds',
      D: "GradientBoostingClassifier needs `scoring='roc_auc'`",
    },
    correct: 'B',
    impact: "Shuffled KFold on time series: fold 3 may use data from month 10 to predict month 2. Model learns future patterns. Offline CV score is optimistically biased. Production performance (always predicting the future) will be significantly worse.",
    fix: "Use `TimeSeriesSplit(n_splits=5)` — each split uses past data only for training and future data for validation. Also consider gap between train and test to prevent label leakage near the split boundary.",
  },
  {
    id: 'M2',
    domain: 'Model Training',
    title: 'Class Imbalance — Using Accuracy',
    description: "A fraud detection model reports 99.5% accuracy and is shipped to production.",
    code: `from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
import pandas as pd

df = pd.read_parquet("fraud_data.parquet")  # 0.5% fraud rate
X, y = df.drop('is_fraud', axis=1), df['is_fraud']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

model = LogisticRegression()
model.fit(X_train, y_train)
preds = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, preds):.3f}")`,
    options: {
      A: 'Logistic Regression is wrong for fraud detection',
      B: 'Test set is too small',
      C: "Accuracy is misleading at 0.5% fraud rate — a model predicting 'no fraud' always achieves 99.5% accuracy",
      D: 'Should use cross-validation instead',
    },
    correct: 'C',
    impact: "Model likely predicts 'no fraud' for everything. Catches 0 actual fraud cases. Accuracy is useless on highly imbalanced data — it measures majority class memorization, not the task.",
    fix: "Use `precision_recall_fscore_support`, `average_precision_score`, or `roc_auc_score`. Also: `class_weight='balanced'` in LogisticRegression, or SMOTE oversampling, or threshold tuning. Primary metric should be precision@recall_threshold (e.g., precision at 80% recall).",
  },
  {
    id: 'M3',
    domain: 'Model Training',
    title: 'Gradient Exploding — Missing Clipping',
    description: 'An LSTM training loop produces NaN losses after a few steps on long sequences.',
    code: `import torch
import torch.nn as nn

model = nn.LSTM(input_size=64, hidden_size=256, num_layers=3, batch_first=True)
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

for batch_x, batch_y in dataloader:
    optimizer.zero_grad()
    output, _ = model(batch_x)
    loss = criterion(output[:, -1, :], batch_y)
    loss.backward()
    optimizer.step()  # No gradient clipping!`,
    options: {
      A: 'Should use SGD instead of Adam for LSTMs',
      B: 'Missing gradient clipping — deep RNNs on long sequences suffer exploding gradients, causing NaN',
      C: '`num_layers=3` is too many',
      D: 'Should use `batch_first=False`',
    },
    correct: 'B',
    impact: "LSTMs with 3 layers on long sequences: gradients multiply through time steps. Without clipping, gradients can explode to inf/NaN within a few steps. Loss goes to NaN, training collapses.",
    fix: "Add `torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)` between `loss.backward()` and `optimizer.step()`. Also: gradient clipping is standard for all RNN training. Monitor gradient norms as a training health metric.",
  },
  {
    id: 'M4',
    domain: 'Model Training',
    title: 'Eval Mode Not Set During Inference',
    description: 'A PyTorch model is deployed but produces different predictions on each call for the same input.',
    code: `import torch
import torch.nn as nn

class RecommenderModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.embedding = nn.Embedding(10000, 64)
        self.dropout = nn.Dropout(0.3)
        self.fc = nn.Linear(64, 1)

    def forward(self, x):
        emb = self.embedding(x)
        emb = self.dropout(emb)
        return self.fc(emb)

model = RecommenderModel()
model.load_state_dict(torch.load("model.pt"))
# Missing model.eval()!

def predict(user_id):
    with torch.no_grad():
        return model(torch.tensor([user_id])).item()`,
    options: {
      A: 'Should use `torch.inference_mode()` instead of `torch.no_grad()`',
      B: 'Missing `model.eval()` — Dropout and BatchNorm behave differently in train vs. eval mode, causing non-deterministic predictions',
      C: '`model.load_state_dict` needs `strict=False`',
      D: 'Embedding lookup is wrong',
    },
    correct: 'B',
    impact: "Dropout(0.3) randomly zeroes 30% of activations during training mode. Without `model.eval()`, inference randomly drops features → different predictions every call for the same input. Non-deterministic ML serving is almost always a bug.",
    fix: "Call `model.eval()` after loading weights. This disables Dropout and switches BatchNorm to use running statistics (not batch statistics). For production: `model.eval()` in the model loading code, not per-request.",
  },

  // ─── SQL ─────────────────────────────────────────────────────────────────
  {
    id: 'Q1',
    domain: 'SQL',
    title: 'NULL Handling in Aggregation',
    description: 'This query reports the average session duration but silently undercounts.',
    code: `SELECT
    user_segment,
    COUNT(*) as session_count,
    AVG(session_duration_seconds) as avg_duration
FROM sessions
GROUP BY user_segment
ORDER BY avg_duration DESC;`,
    options: {
      A: 'Should use `COUNT(1)` instead of `COUNT(*)`',
      B: 'AVG silently ignores NULL values — sessions with NULL duration (e.g., abandoned sessions) are excluded from the average but included in COUNT(*)',
      C: 'Missing `HAVING` clause',
      D: 'Should use `MEDIAN` instead of `AVG`',
    },
    correct: 'B',
    impact: "Abandoned sessions have NULL duration. AVG ignores them, making avg_duration appear higher than it is. COUNT(*) includes them. avg_duration / session_count ratio looks wrong. Business metric is misleadingly optimistic.",
    fix: "Use `AVG(COALESCE(session_duration_seconds, 0))` to treat NULL as 0 (if that's appropriate semantically), or `COUNT(session_duration_seconds)` (counts non-NULL) alongside `COUNT(*)` to expose the NULL rate explicitly.",
  },
  {
    id: 'Q2',
    domain: 'SQL',
    title: "Window Function Ordering Bug",
    description: "This query tries to find each user's second purchase but returns wrong results.",
    code: `SELECT
    user_id,
    order_id,
    order_amount,
    ROW_NUMBER() OVER (
        PARTITION BY user_id ORDER BY order_amount DESC
    ) as purchase_rank
FROM orders
WHERE purchase_rank = 2;`,
    options: {
      A: 'Should use `RANK()` instead of `ROW_NUMBER()`',
      B: 'Window function alias `purchase_rank` cannot be referenced in WHERE clause — must use a subquery or CTE',
      C: 'Should partition by `order_id` not `user_id`',
      D: '`ORDER BY order_amount DESC` should be `ASC`',
    },
    correct: 'B',
    impact: "SQL WHERE clause is evaluated before window functions. Referencing a window function alias in WHERE causes an error (or in some engines silently fails). No rows returned.",
    fix: "Wrap in CTE or subquery: `WITH ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date ASC) AS purchase_rank FROM orders) SELECT * FROM ranked WHERE purchase_rank = 2`. Also: order by `order_date` not `order_amount` to get 2nd purchase by time.",
  },
  {
    id: 'Q3',
    domain: 'SQL',
    title: 'Fanout in JOIN Inflating Metrics',
    description: 'A revenue report shows 3x higher revenue than expected after joining two tables.',
    code: `SELECT
    o.date,
    SUM(o.revenue) as total_revenue,
    COUNT(DISTINCT o.order_id) as order_count
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.date
ORDER BY o.date;`,
    options: {
      A: 'Should use a LEFT JOIN',
      B: 'Joining orders to order_items causes row fanout — each order row is duplicated for every item, inflating SUM(revenue)',
      C: 'Should aggregate order_items first',
      D: 'Missing WHERE clause for date range',
    },
    correct: 'B',
    impact: "If an order has 3 items, it joins to 3 rows in order_items. SUM(o.revenue) counts the order revenue 3 times. Revenue is inflated by average items per order. COUNT(DISTINCT order_id) is correct, but revenue is wrong.",
    fix: "Aggregate before joining: `WITH order_revenue AS (SELECT order_id, SUM(revenue) FROM orders GROUP BY order_id) SELECT date, SUM(r.revenue) FROM order_revenue r JOIN orders o ON r.order_id = o.order_id GROUP BY date`. Or avoid the join entirely if only order-level data is needed.",
  },
  {
    id: 'Q4',
    domain: 'SQL',
    title: 'Incorrect Cohort Retention Query',
    description: 'This retention query shows 100% retention for all cohorts.',
    code: `WITH cohorts AS (
    SELECT user_id, DATE_TRUNC('month', first_seen) as cohort_month
    FROM users
),
activity AS (
    SELECT DISTINCT user_id,
        DATE_TRUNC('month', activity_date) as activity_month
    FROM user_activity
)
SELECT
    c.cohort_month,
    a.activity_month,
    COUNT(DISTINCT a.user_id) / COUNT(DISTINCT c.user_id) as retention_rate
FROM cohorts c
JOIN activity a ON c.user_id = a.user_id
GROUP BY c.cohort_month, a.activity_month;`,
    options: {
      A: 'Should use a LEFT JOIN instead of inner JOIN',
      B: 'COUNT(DISTINCT a.user_id) / COUNT(DISTINCT c.user_id) — numerator and denominator both reference the same joined rows after inner join, so rate is always 1.0',
      C: "DATE_TRUNC should use 'week' not 'month'",
      D: 'Missing ORDER BY clause',
    },
    correct: 'B',
    impact: "After inner JOIN, only users present in both tables remain. COUNT(DISTINCT a.user_id) = COUNT(DISTINCT c.user_id) always. Retention rate = 1.0 for every cohort. Completely wrong metric.",
    fix: "Use LEFT JOIN from cohorts to activity. Denominator: cohort size from cohorts CTE (before join). Numerator: users in activity for that month. `COUNT(DISTINCT a.user_id) * 1.0 / cohort_size` where cohort_size is pre-computed per cohort.",
  },

  // ─── MLOPS ───────────────────────────────────────────────────────────────
  {
    id: 'O1',
    domain: 'MLOps',
    title: 'Model Loaded Inside Request Handler',
    description: 'A FastAPI model serving endpoint loads the model on every request.',
    code: `from fastapi import FastAPI
import pickle
import pandas as pd

app = FastAPI()

@app.post("/predict")
async def predict(features: dict):
    # Load model on every request
    with open("model.pkl", "rb") as f:
        model = pickle.load(f)

    df = pd.DataFrame([features])
    prediction = model.predict(df)
    return {"prediction": int(prediction[0])}`,
    options: {
      A: 'Should use `joblib` instead of `pickle`',
      B: 'Model is loaded from disk on every single request — massive latency overhead and I/O bottleneck',
      C: 'Should use async model loading',
      D: '`pd.DataFrame([features])` is incorrect',
    },
    correct: 'B',
    impact: "Loading a model from disk per request adds 100ms–2s of I/O per call. At 100 req/s, the server spends all its time on disk I/O. Model can't be cached by the OS because it's repeatedly opened. Service will be unusably slow under load.",
    fix: "Load model at startup: `model = None; @app.on_event('startup') async def load_model(): global model; model = pickle.load(open('model.pkl', 'rb'))`. Or use a module-level singleton. In production: use TorchServe/Triton which manage model lifecycle properly.",
  },
  {
    id: 'O2',
    domain: 'MLOps',
    title: 'Silent Training Failure — No Validation',
    description: 'An automated retraining pipeline trains and deploys a new model daily without validation.',
    code: `import mlflow
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
import pandas as pd

def retrain_and_deploy():
    df = pd.read_parquet(f"s3://bucket/data/latest/")
    X, y = df.drop('label', axis=1), df['label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    model = GradientBoostingClassifier(n_estimators=100)
    model.fit(X_train, y_train)

    # Deploy directly without evaluation gate
    with mlflow.start_run():
        mlflow.sklearn.log_model(model, "model")
        mlflow.register_model(
            f"runs:/{mlflow.active_run().info.run_id}/model",
            "prod_model"
        )`,
    options: {
      A: 'Should use `RandomForestClassifier` for automated pipelines',
      B: 'Model is deployed without evaluating performance — a corrupt dataset or bug causes silent production degradation',
      C: 'Should use `cross_val_score` instead of train/test split',
      D: 'MLflow registration syntax is incorrect',
    },
    correct: 'B',
    impact: "If training data is corrupted (wrong schema, all-null features, label bug), the model trains on garbage and is auto-promoted to production. No gate catches this. Production metrics silently degrade until someone notices days later.",
    fix: "Add evaluation gate: compute AUC/F1 on test set, compare to baseline (current production model or minimum threshold). Only promote if `new_auc >= baseline_auc - 0.01`. Log all metrics to MLflow. Add data validation step before training (Great Expectations or custom checks).",
  },
  {
    id: 'O3',
    domain: 'MLOps',
    title: 'Race Condition in Feature Pipeline',
    description: 'A feature pipeline that computes user statistics sometimes produces stale data.',
    code: `import pandas as pd
from datetime import datetime

def compute_user_features(user_id: str) -> dict:
    # Read raw events
    events = pd.read_parquet(f"s3://bucket/events/user={user_id}/")

    # Compute features
    features = {
        "event_count_7d": len(events[
            events['date'] >= datetime.now().date() - pd.Timedelta(days=7)
        ]),
        "last_event_type": events.sort_values('timestamp').iloc[-1]['event_type'],
        "total_spend": events['spend'].sum()
    }

    # Write features
    pd.DataFrame([features]).to_parquet(
        f"s3://bucket/features/user={user_id}/features.parquet"
    )
    return features`,
    options: {
      A: 'Should use a database instead of S3',
      B: '`datetime.now()` called during computation — if pipeline runs near midnight, some records use "today" and others "yesterday" as the reference date, creating inconsistent windows',
      C: 'Missing error handling for empty events',
      D: 'Should compute features in parallel',
    },
    correct: 'B',
    impact: "If the pipeline starts at 11:59 PM and runs for 2+ minutes, users processed before midnight get different 7-day windows than users processed after. Feature inconsistency. Downstream model sees inconsistent training data.",
    fix: "Pass reference_date as a parameter: `def compute_user_features(user_id, reference_date)`. Set it once at pipeline start: `reference_date = datetime.now().date()`. Pass the same value to all workers. Always externalize 'now' in batch pipelines.",
  },
  {
    id: 'O4',
    domain: 'MLOps',
    title: 'Unpinned Dependencies — Reproducibility Failure',
    description: "A model that worked 6 months ago can no longer be reproduced because of dependency drift.",
    code: `# requirements.txt
scikit-learn
pandas
numpy
xgboost
lightgbm`,
    options: {
      A: 'Should list dependencies alphabetically',
      B: 'Unpinned versions — library updates can silently change model behavior, hyperparameter defaults, or break compatibility',
      C: 'Should use conda instead of pip',
      D: 'Missing Python version specification',
    },
    correct: 'B',
    impact: "scikit-learn 1.3 changed default values for several estimators. XGBoost 2.0 changed tree construction. Unpinned deps mean `pip install` today gets different versions than 6 months ago. Model retraining produces different results. Debugging production issues is impossible without reproducible environments.",
    fix: "Pin all versions: `scikit-learn==1.3.2`, `pandas==2.1.0`, etc. Use `pip freeze > requirements.txt` after testing. Better: use Docker with a pinned base image. Best: hash-pinned deps (`pip-compile --generate-hashes`). Also pin Python version in `.python-version` or Dockerfile.",
  },

  // ─── DISTRIBUTED TRAINING ──────────────────────────────────────────────────
  {
    id: 'DT1',
    domain: 'DistTraining',
    title: 'Gradient Accumulation — Wrong Loss Scaling',
    description: 'This PyTorch training loop uses gradient accumulation to simulate a larger batch size but produces unstable training loss.',
    code: `import torch
import torch.nn as nn

model = nn.Linear(512, 10).cuda()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
accumulation_steps = 4

for i, (inputs, labels) in enumerate(dataloader):
    inputs, labels = inputs.cuda(), labels.cuda()
    outputs = model(inputs)
    loss = criterion(outputs, labels)
    loss.backward()

    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()`,
    options: {
      A: 'Missing `loss.detach()` before backward pass',
      B: 'Loss is not divided by `accumulation_steps` — gradients accumulate 4× larger than a true batch-4 gradient, causing effective LR to be 4× too high',
      C: '`optimizer.zero_grad()` should be called before `loss.backward()`',
      D: 'Adam optimizer does not support gradient accumulation',
    },
    correct: 'B',
    impact: "Accumulated gradients are 4× the magnitude of a single-step gradient. Adam's adaptive learning rate partially compensates, but the gradient norm is inflated, causing loss spikes and unstable convergence — especially with large learning rates.",
    fix: "Divide loss by accumulation_steps before backward: `loss = criterion(outputs, labels) / accumulation_steps`. This ensures the accumulated gradient magnitude matches what a true large-batch gradient would produce. Alternatively, use PyTorch's `GradScaler` which handles scaling automatically with AMP.",
  },
  {
    id: 'DT2',
    domain: 'DistTraining',
    title: 'DDP — Unused Parameters Cause Hang',
    description: 'This PyTorch DistributedDataParallel (DDP) training job hangs indefinitely during the first backward pass when using a model with conditional computation.',
    code: `import torch
import torch.nn as nn
from torch.nn.parallel import DistributedDataParallel as DDP

class ConditionalModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.layer1 = nn.Linear(512, 256)
        self.layer2 = nn.Linear(256, 128)
        self.auxiliary = nn.Linear(512, 10)  # only used during warmup

    def forward(self, x, use_auxiliary=False):
        x = self.layer1(x)
        x = self.layer2(x)
        if use_auxiliary:
            return self.auxiliary(x)
        return x

model = DDP(ConditionalModel().cuda(), device_ids=[local_rank])`,
    options: {
      A: 'DDP does not support models with more than 2 layers',
      B: 'The `auxiliary` layer is not used in most forward passes — DDP requires all parameters to participate in every backward pass to synchronise gradients across processes. Unused parameters cause DDP to wait indefinitely for gradient synchronisation that never arrives.',
      C: 'Missing `find_unused_parameters=True` is a performance issue, not a hang',
      D: 'The conditional `use_auxiliary` flag is not supported in multi-GPU training',
    },
    correct: 'B',
    impact: 'DDP hangs at the all-reduce barrier waiting for gradient sync on `auxiliary` layer parameters. All training processes deadlock. Job must be killed manually.',
    fix: 'Pass `find_unused_parameters=True` to DDP: `model = DDP(model, device_ids=[local_rank], find_unused_parameters=True)`. This tells DDP to skip gradient sync for parameters that did not participate in the forward pass. Note: this adds overhead — the cleaner fix is to architect the model so all parameters are always used, or split the auxiliary head into a separate module trained independently.',
  },
  {
    id: 'DT3',
    domain: 'DistTraining',
    title: 'DataLoader Worker — Shared State Corruption',
    description: 'A PyTorch training job with multiple DataLoader workers produces non-deterministic results and occasional NaN losses, even with a fixed random seed.',
    code: `import torch
import numpy as np
from torch.utils.data import DataLoader, Dataset

class AugmentedDataset(Dataset):
    def __init__(self, data):
        self.data = data
        self.rng = np.random.RandomState(42)  # shared RNG

    def __getitem__(self, idx):
        x = self.data[idx]
        # Random augmentation
        noise = self.rng.normal(0, 0.1, x.shape)
        return torch.tensor(x + noise, dtype=torch.float32)

    def __len__(self):
        return len(self.data)

dataset = AugmentedDataset(data)
loader = DataLoader(dataset, batch_size=32, num_workers=4)`,
    options: {
      A: 'NumPy RandomState is not compatible with PyTorch tensors',
      B: 'A single `RandomState` instance is shared across 4 worker processes. Worker processes are forked from the main process and share the same RNG state — concurrent calls to `self.rng.normal()` from multiple workers produce race conditions and corrupt RNG state, causing non-determinism and occasional NaN from state corruption.',
      C: 'The seed 42 is not a valid NumPy random seed',
      D: 'DataLoader workers should not perform augmentation — use torchvision transforms instead',
    },
    correct: 'B',
    impact: 'Non-deterministic augmentation makes experiments non-reproducible. RNG state corruption occasionally produces out-of-range values that propagate to NaN loss. Debugging is extremely difficult because the issue only manifests with num_workers > 1.',
    fix: "Create a fresh RNG instance per worker using PyTorch's worker_init_fn: `def worker_init(worker_id): np.random.seed(42 + worker_id)`. Pass to DataLoader: `DataLoader(..., worker_init_fn=worker_init)`. Alternatively, use per-item seeding: `rng = np.random.RandomState(idx)` inside `__getitem__` — each item gets its own deterministic seed based on its index.",
  },

  // ─── SILENT DATA BUGS ──────────────────────────────────────────────────────
  {
    id: 'SD1',
    domain: 'SilentData',
    title: 'Pandas — Column Order Dependency in Model Input',
    description: 'A trained sklearn model is deployed behind a FastAPI endpoint. Predictions are systematically wrong for some request types, but no exception is raised.',
    code: `import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

model = joblib.load('model.pkl')

def predict(request_data: dict) -> float:
    # Convert request to DataFrame
    df = pd.DataFrame([request_data])

    # Model expects: ['age', 'income', 'tenure', 'product_count']
    prediction = model.predict_proba(df)[0][1]
    return prediction

# Example request
result = predict({
    'income': 85000,
    'age': 34,
    'tenure': 24,
    'product_count': 3
})`,
    options: {
      A: 'The model should use `predict()` not `predict_proba()`',
      B: 'Dict-to-DataFrame conversion does not guarantee column order — if request keys arrive in a different order than training, the model receives features in the wrong columns. sklearn silently accepts the misaligned input and produces wrong predictions with no error.',
      C: 'FastAPI request dicts are always ordered correctly',
      D: 'Missing input validation for data types',
    },
    correct: 'B',
    impact: "Systematic silent mispredictions. `income` (85000) is passed to the `age` column slot; `age` (34) is passed to `income`. The model produces a confident wrong prediction with no error. This affects every request where the client sends keys in a different order than the training column order.",
    fix: "Always explicitly reorder columns to match training: `df = pd.DataFrame([request_data])[FEATURE_COLUMNS]` where `FEATURE_COLUMNS = ['age', 'income', 'tenure', 'product_count']` is defined at the top of the serving module and matches the column order used during training. Better: save the feature column list with the model artifact using joblib so the order is always in sync.",
  },
  {
    id: 'SD2',
    domain: 'SilentData',
    title: 'Float32 Precision Loss in Feature Normalisation',
    description: 'A feature normalisation pipeline converts features to float32 for memory efficiency before passing to the model. A downstream aggregation silently loses precision.',
    code: `import numpy as np

# Large transaction amounts
transaction_amounts = np.array([9999999.99, 10000000.01, 9999999.50], dtype=np.float32)

# Compute daily total
daily_total = np.sum(transaction_amounts)
print(f"Daily total: {daily_total}")

# Check for large transactions
large_txns = transaction_amounts[transaction_amounts > 10_000_000]
print(f"Large transactions: {large_txns}")`,
    options: {
      A: 'NumPy sum is computed incorrectly for float arrays',
      B: 'float32 has ~7 significant decimal digits of precision. Values near 10,000,000 lose sub-dollar precision — 9999999.99 and 10000000.01 may be represented as the same float32 value. The large transaction filter silently misclassifies boundary transactions.',
      C: 'The threshold 10_000_000 should use scientific notation',
      D: 'NumPy boolean indexing does not work with float32 arrays',
    },
    correct: 'B',
    impact: 'Float32 represents ~16,777,216 as the next representable integer after ~8,388,608. For values around 10M, the precision gap is ~1. Transactions of $9,999,999.99 and $10,000,001.00 may map to the same float32 value. Fraud rules, regulatory thresholds, and fee calculations built on float32 financial data silently produce wrong results.',
    fix: "Use float64 for financial amounts — the memory savings from float32 are not worth the precision loss for currency values above ~$10M. If memory is genuinely constrained, store amounts as integer cents (multiply by 100, use int64) which preserves exact representation up to ~$92 trillion. Add a precision audit step: for any feature involving currency amounts, verify the max value against float32's representable precision limit.",
  },
  {
    id: 'SD3',
    domain: 'SilentData',
    title: 'Schema Drift — New Categorical Value at Serving Time',
    description: "A model trained on e-commerce data uses one-hot encoding for `device_type` with categories: [mobile, desktop, tablet]. In production, a new device_type \"smart_tv\" starts appearing. The encoding pipeline silently handles it.",
    code: `import pandas as pd
from sklearn.preprocessing import OneHotEncoder
import joblib

encoder = joblib.load('ohe_encoder.pkl')  # fitted on [mobile, desktop, tablet]

def encode_features(df: pd.DataFrame) -> pd.DataFrame:
    encoded = encoder.transform(df[['device_type']])
    feature_names = encoder.get_feature_names_out(['device_type'])
    return pd.DataFrame(encoded, columns=feature_names)

# New serving request with unseen category
new_data = pd.DataFrame({'device_type': ['smart_tv']})
result = encode_features(new_data)
print(result)  # What does this output?`,
    options: {
      A: 'This will raise a ValueError — OneHotEncoder rejects unseen categories by default',
      B: 'Default sklearn OneHotEncoder raises an error for unseen categories. BUT if `handle_unknown="ignore"` was set during training, the encoder silently outputs all zeros for "smart_tv" — the model receives a valid-looking zero vector and makes a prediction with no signal from device_type, silently degrading for all smart_tv users.',
      C: 'The encoder will automatically add a new column for smart_tv',
      D: 'smart_tv will be mapped to the most similar known category',
    },
    correct: 'B',
    impact: 'Silent all-zero encoding for new categories means the model treats all smart_tv users as if device_type was missing. Depending on model architecture, this can systematically mis-score an entire user segment. The failure is invisible — no exception, no monitoring alert, just degraded predictions for a growing user cohort.',
    fix: "Three approaches in order of preference: (1) Add an \"other\" category to the encoder by including a representative \"other\" sample during training and mapping unseen values to it at serving time. (2) Add a schema validation step before encoding that alerts when a new category appears — treat new categories as a data quality event requiring a model update. (3) Monitor the distribution of each categorical feature's encoded zero-vector rate — a spike indicates unseen categories are arriving.",
  },
]

const DOMAINS = ['All', 'Spark', 'Feature Engineering', 'Model Training', 'SQL', 'MLOps', 'DistTraining', 'SilentData']

function loadAnswers() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAnswers(answers) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(answers))
  } catch {}
}

function DomainBadge({ domain }) {
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 4,
      border: `1px solid ${DOMAIN_COLORS[domain]}`,
      color: DOMAIN_COLORS[domain],
      fontFamily: 'var(--font-sans)',
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {domain}
    </span>
  )
}

function CodeBlock({ code }) {
  return (
    <pre style={{
      background: 'var(--surface)',
      border: '1px solid var(--rim)',
      borderRadius: 6,
      padding: 12,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      color: 'var(--ink-hi)',
      whiteSpace: 'pre',
      overflowX: 'auto',
      margin: '12px 0',
      lineHeight: 1.6,
    }}>
      {code}
    </pre>
  )
}

function BugCard({ bug, answer, onAnswer }) {
  const [open, setOpen] = useState(false)
  const answered = answer !== undefined
  const isCorrect = answered && answer === bug.correct

  const optionExtraStyle = (key) => {
    if (answered && key !== bug.correct && key !== answer) {
      return { opacity: 0.6 }
    }
    return {
    }
  }

  return (
    <div style={{
      border: '1px solid var(--rim)',
      borderRadius: 8,
      marginBottom: 10,
      background: 'var(--depth)',
      overflow: 'hidden',
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: 13,
          color: 'var(--ink-ghost)',
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
          minWidth: 28,
        }}>
          {bug.id}
        </span>
        <DomainBadge domain={bug.domain} />
        <span style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--ink-hi)',
          fontFamily: 'var(--font-sans)',
        }}>
          {bug.title}
        </span>
        {answered && (
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: isCorrect ? 'var(--mint)' : 'var(--rose)',
            flexShrink: 0,
          }}>
            {isCorrect ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"text-bottom",marginRight:"3px"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}
          </span>
        )}
        <span style={{
          color: 'var(--ink-ghost)',
          fontSize: 12,
          flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{
            fontSize: 13,
            color: 'var(--ink-mid)',
            fontFamily: 'var(--font-sans)',
            margin: '0 0 4px',
            lineHeight: 1.6,
          }}>
            {bug.description}
          </p>

          <CodeBlock code={bug.code} />

          <div style={{ marginTop: 12 }}>
            {Object.entries(bug.options).map(([key, text]) => (
              <button
                key={key}
                className={`msl-option-btn${answered && key === bug.correct ? ' correct' : answered && key === answer ? ' wrong' : ''}`}
                style={{ marginBottom: 6, cursor: answered ? 'default' : 'pointer', ...optionExtraStyle(key) }}
                onClick={() => !answered && onAnswer(bug.id, key)}
                disabled={answered}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  marginRight: 8,
                  color: answered && key === bug.correct ? 'var(--mint)' : answered && key === answer ? 'var(--rose)' : 'var(--ink-ghost)',
                }}>
                  {key})
                </span>
                {text}
              </button>
            ))}
          </div>

          {answered && (
            <div style={{
              marginTop: 14,
              borderTop: '1px solid var(--rim)',
              paddingTop: 14,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isCorrect ? 'var(--mint)' : 'var(--rose)',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {isCorrect ? 'Correct' : 'Wrong'} — Answer: {bug.correct}
                </span>
              </div>

              <div style={{
                background: 'rgba(240,165,0,0.10)',
                border: '1px solid rgba(240,165,0,0.25)',
                borderRadius: 6,
                padding: '10px 12px',
                marginBottom: 10,
              }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--prime)',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 4,
                }}>
                  Production Impact
                </div>
                <p style={{
                  fontSize: 13,
                  color: 'var(--ink-mid)',
                  fontFamily: 'var(--font-sans)',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  {bug.impact}
                </p>
              </div>

              <div className="msl-reveal-panel">
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--prime)',
                  fontFamily: 'var(--font-sans)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 4,
                }}>
                  Fix
                </div>
                <p style={{
                  fontSize: 13,
                  color: 'var(--ink-mid)',
                  fontFamily: 'var(--font-sans)',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  {bug.fix}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Coming Soon ───────────────────────────────────────────────────────────────
// devBrief fields are internal build guidance only — not rendered to users.
const COMING_SOON = []

export default function CodeBugsTab({ onNavigate }) {
  const [answers, setAnswers] = useState(loadAnswers)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    saveAnswers(answers)
  }, [answers])

  const handleAnswer = (bugId, option) => {
    setAnswers(prev => ({ ...prev, [bugId]: option }))
  }

  const score = BUGS.filter(b => answers[b.id] === b.correct).length
  const totalAnswered = Object.keys(answers).length

  const filtered = filter === 'All' ? BUGS : BUGS.filter(b => b.domain === filter)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 22,
          color: 'var(--ink-hi)',
          margin: '0 0 4px',
        }}>
          Code Bugs
        </h2>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--ink-low)',
          margin: '0 0 4px',
        }}>
          Real ML code with exactly one bug buried in it. Read the snippet, identify the failure — Python &amp; SQL.</p>
        <p style={{ fontSize: '13px', color: 'var(--ink-low)', lineHeight: 1.5, margin: 0, fontFamily: 'var(--font-sans)' }}>
          Expand a scenario, read the code, pick what's wrong — then see the fix and the production failure mode it would have caused.</p>
      </div>

      {/* Score summary */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'var(--depth)',
        border: '1px solid var(--rim)',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 20,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--prime)',
          lineHeight: 1,
        }}>
          {score}
          <span style={{ fontSize: 16, color: 'var(--ink-ghost)', fontWeight: 400 }}>/26</span>
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink-hi)',
          }}>
            Bugs caught correctly
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--ink-low)',
          }}>
            {totalAnswered} of 26 attempted
          </div>
        </div>
        {totalAnswered > 0 && (
          <div style={{ marginLeft: 'auto' }}>
            <div style={{
              background: 'var(--surface)',
              borderRadius: 4,
              height: 6,
              width: 120,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(score / 26) * 100}%`,
                background: 'var(--prime)',
                borderRadius: 4,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              color: 'var(--ink-ghost)',
              marginTop: 3,
              textAlign: 'right',
            }}>
              {Math.round((score / 26) * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Domain filter pills */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
      }}>
        {DOMAINS.map(d => {
          const active = filter === d
          const color = d === 'All' ? 'var(--prime)' : DOMAIN_COLORS[d]
          return (
            <button
              key={d}
              onClick={() => setFilter(d)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${active ? color : 'var(--rim)'}`,
                background: active ? `${color}18` : 'transparent',
                color: active ? color : 'var(--ink-low)',
                transition: 'all 0.15s',
              }}
            >
              {d}
              {d !== 'All' && (
                <span style={{ marginLeft: 5, opacity: 0.6, fontWeight: 400 }}>
                  {BUGS.filter(b => b.domain === d && answers[b.id] === b.correct).length}/
                  {BUGS.filter(b => b.domain === d).length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bug cards */}
      <div>
        {filtered.map(bug => (
          <BugCard
            key={bug.id}
            bug={bug}
            answer={answers[bug.id]}
            onAnswer={handleAnswer}
          />
        ))}
      </div>
      {/* ── Coming Soon ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: '48px' }}>
        <div className="eyebrow" style={{ marginBottom: '12px' }}>What's building</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {COMING_SOON.map(m => (
            <div key={m.label} className="card" style={{ padding: 'var(--card-pad-secondary)', opacity: 0.65, borderLeft: '2px solid var(--rim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--ink-mid)' }}>{m.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', padding: '2px 6px', background: 'rgba(255,255,255,0.07)', color: 'var(--ink-ghost)', borderRadius: '3px', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>soon</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-low)', lineHeight: 1.6, margin: 0 }}>{m.userBrief}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
