import { useState, useEffect } from 'react'
import PythonCell from '../components/PythonCell.jsx'
import FidelityBadge from '../components/FidelityBadge.jsx'
import HowToStrip from '../components/HowToStrip.jsx'

const LS_KEY = 'msl_score:mlcoding'

// ── Problem bank ──────────────────────────────────────────────────────────────
// Tightly scoped to ML-specific Python that appears in real senior/staff interviews.
// NOT generic Python (no string manipulation, no DSA).
// Each problem: starter code + expected output validation + judgment checkpoint.

const PROBLEMS = [
  {
    id: 'mlc1',
    type: 1,
    title: 'Custom Cross-Entropy Loss',
    domain: 'Model Training',
    difficulty: 'mid',
    readMin: 15,
    prompt: `Implement a numerically stable binary cross-entropy loss function from scratch.
Do NOT use sklearn or torch — implement the formula directly with numpy.

Expected: a function bce_loss(y_true, y_pred) that:
• Accepts numpy arrays of true labels (0/1) and predicted probabilities (0–1)
• Clips predictions to avoid log(0)
• Returns the mean loss as a float`,
    starter: `import numpy as np

def bce_loss(y_true, y_pred):
    # Your implementation here
    pass

# Test
y_true = np.array([1, 0, 1, 1, 0])
y_pred = np.array([0.9, 0.1, 0.8, 0.6, 0.3])
print(f"Loss: {bce_loss(y_true, y_pred):.6f}")
# Expected: ~0.236 (you can verify with sklearn)
`,
    solution: `import numpy as np

def bce_loss(y_true, y_pred):
    # Clip to avoid log(0) — standard practice
    eps = 1e-9
    y_pred = np.clip(y_pred, eps, 1 - eps)
    return -np.mean(y_true * np.log(y_pred) + (1 - y_true) * np.log(1 - y_pred))

y_true = np.array([1, 0, 1, 1, 0])
y_pred = np.array([0.9, 0.1, 0.8, 0.6, 0.3])
loss = bce_loss(y_true, y_pred)
print(f"Loss: {loss:.6f}")

# Verify with sklearn
from sklearn.metrics import log_loss
sklearn_loss = log_loss(y_true, y_pred)
print(f"sklearn matches: {abs(loss - sklearn_loss) < 1e-6}")
`,
    checkpoint: 'Your implementation is correct — but what happens if you remove the clipping and a prediction is exactly 0.0 or 1.0?',
    checkpointAnswer: 'log(0) = -infinity. Without clipping, a single perfectly-wrong prediction (predicting 0.0 for a positive example) makes the entire loss undefined (nan/inf). The clip is not optional — it\'s required for numerical stability. Standard clip values are 1e-9 or 1e-7 depending on float precision requirements.',
  },
  {
    id: 'mlc2',
    type: 1,
    title: 'Vectorised Feature Engineering — No Loops',
    domain: 'Feature Engineering',
    difficulty: 'mid',
    readMin: 20,
    prompt: `Given a DataFrame of user sessions, compute the following features WITHOUT using any Python for-loops or .apply():
1. days_since_last_purchase: days between each row's date and that user's most recent purchase date
2. purchase_velocity_7d: number of purchases by that user in the 7 days before the row's date (exclusive)
3. is_repeat_item: 1 if that user has purchased the same item_id before this row's date, else 0

All three must be computed using vectorised pandas/numpy operations only.`,
    starter: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    'user_id':   [1, 1, 1, 2, 2],
    'date':      pd.to_datetime(['2024-01-01','2024-01-05','2024-01-10','2024-01-03','2024-01-08']),
    'item_id':   [101, 102, 101, 201, 201],
    'purchased': [1, 1, 1, 1, 1],
})

# Your implementation here — no for-loops, no .apply()

print(df[['user_id','date','item_id','days_since_last_purchase','purchase_velocity_7d','is_repeat_item']])
`,
    solution: `import pandas as pd
import numpy as np

df = pd.DataFrame({
    'user_id':   [1, 1, 1, 2, 2],
    'date':      pd.to_datetime(['2024-01-01','2024-01-05','2024-01-10','2024-01-03','2024-01-08']),
    'item_id':   [101, 102, 101, 201, 201],
    'purchased': [1, 1, 1, 1, 1],
})
df = df.sort_values(['user_id','date']).reset_index(drop=True)

# 1. days_since_last_purchase (shift within user group)
df['last_purchase'] = df.groupby('user_id')['date'].shift(1)
df['days_since_last_purchase'] = (df['date'] - df['last_purchase']).dt.days

# 2. purchase_velocity_7d (expanding merge on self, then count)
df_merge = df[['user_id','date']].copy()
df_merge.columns = ['user_id','ref_date']
joined = df.merge(df_merge, on='user_id')
mask = (joined['date'] < joined['ref_date']) & (joined['date'] >= joined['ref_date'] - pd.Timedelta('7D'))
df['purchase_velocity_7d'] = joined[mask].groupby(joined[mask].index)['user_id'].count().reindex(df.index, fill_value=0)

# 3. is_repeat_item (cumcount of same item per user, shifted)
df['is_repeat_item'] = (df.groupby(['user_id','item_id']).cumcount() > 0).astype(int)

print(df[['user_id','date','item_id','days_since_last_purchase','purchase_velocity_7d','is_repeat_item']])
`,
    checkpoint: 'This implementation works on the toy dataset. What breaks at production scale with 50M rows?',
    checkpointAnswer: 'The self-join (step 2) creates an N² intermediate DataFrame — 50M rows × 50M rows is impossible in memory. Production fix: use a sorted merge with groupby + rolling window, or compute in Spark with a range join. Also: the `reindex` in step 2 is fragile after a merge that changes index alignment. Production feature stores compute velocity features with pre-aggregated lookup tables, not row-level self-joins.',
  },
  {
    id: 'mlc3',
    type: 1,
    title: 'K-Fold Cross-Validation From Scratch',
    domain: 'Model Evaluation',
    difficulty: 'junior',
    readMin: 15,
    prompt: `Implement k-fold cross-validation from scratch using only numpy (no sklearn KFold).

Your function cross_val_score(X, y, model_fn, k=5) should:
• Split X, y into k folds (no shuffling required for this implementation)
• For each fold: train model_fn on k-1 folds, evaluate on the held-out fold
• Return the list of per-fold accuracies and the mean

model_fn is a callable that accepts (X_train, y_train, X_test) and returns y_pred.`,
    starter: `import numpy as np

def cross_val_score(X, y, model_fn, k=5):
    # Your implementation here
    pass

# Simple test using a majority-class classifier
def majority_classifier(X_train, y_train, X_test):
    majority = np.bincount(y_train).argmax()
    return np.full(len(X_test), majority)

np.random.seed(42)
X = np.random.randn(100, 4)
y = np.random.randint(0, 2, 100)

scores = cross_val_score(X, y, majority_classifier, k=5)
print(f"Per-fold: {[round(s,3) for s in scores]}")
print(f"Mean: {np.mean(scores):.3f}")
`,
    solution: `import numpy as np

def cross_val_score(X, y, model_fn, k=5):
    n = len(X)
    fold_size = n // k
    scores = []
    for i in range(k):
        start, end = i * fold_size, (i + 1) * fold_size if i < k - 1 else n
        mask = np.zeros(n, dtype=bool)
        mask[start:end] = True
        X_test,  y_test  = X[mask],  y[mask]
        X_train, y_train = X[~mask], y[~mask]
        y_pred = model_fn(X_train, y_train, X_test)
        scores.append(np.mean(y_pred == y_test))
    return scores

def majority_classifier(X_train, y_train, X_test):
    majority = np.bincount(y_train).argmax()
    return np.full(len(X_test), majority)

np.random.seed(42)
X = np.random.randn(100, 4)
y = np.random.randint(0, 2, 100)

scores = cross_val_score(X, y, majority_classifier, k=5)
print(f"Per-fold: {[round(s,3) for s in scores]}")
print(f"Mean: {np.mean(scores):.3f}")
`,
    checkpoint: 'Your implementation is correct for i.i.d. data. What breaks when applied to a time series?',
    checkpointAnswer: 'Standard KFold shuffles or assigns folds sequentially, which means validation data can precede training data in time. The model trains on future data and is tested on the past — the classic temporal leakage pattern. Fix: use time-based split where all training data strictly precedes all validation data. sklearn\'s TimeSeriesSplit implements this correctly.',
  },
  {
    id: 'mlc4',
    type: 1,
    title: 'Retry Decorator with Exponential Backoff',
    domain: 'ML Systems',
    difficulty: 'senior',
    readMin: 12,
    prompt: `Implement a @retry decorator that wraps any function with exponential backoff on failure.

Requirements:
• max_retries: number of times to retry before raising the final exception
• base_delay: initial wait time in seconds (doubles on each retry)
• exceptions: tuple of exception types to catch (default: Exception)
• If all retries exhausted, raise the ORIGINAL exception (not a wrapper)
• Log each attempt and delay to stdout

Usage:
  @retry(max_retries=3, base_delay=1.0)
  def call_model_api(payload): ...`,
    starter: `import time
import functools

def retry(max_retries=3, base_delay=1.0, exceptions=(Exception,)):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Your implementation here
            pass
        return wrapper
    return decorator

# Test
call_count = 0

@retry(max_retries=3, base_delay=0.1)
def flaky_api():
    global call_count
    call_count += 1
    if call_count < 3:
        raise ConnectionError(f"Attempt {call_count} failed")
    return "success"

result = flaky_api()
print(f"Result: {result}, total calls: {call_count}")
# Expected: Result: success, total calls: 3
`,
    solution: `import time
import functools

def retry(max_retries=3, base_delay=1.0, exceptions=(Exception,)):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    if attempt < max_retries:
                        delay = base_delay * (2 ** attempt)
                        print(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay:.1f}s...")
                        time.sleep(delay)
                    else:
                        print(f"All {max_retries + 1} attempts failed.")
            raise last_exc
        return wrapper
    return decorator

call_count = 0

@retry(max_retries=3, base_delay=0.1)
def flaky_api():
    global call_count
    call_count += 1
    if call_count < 3:
        raise ConnectionError(f"Attempt {call_count} failed")
    return "success"

result = flaky_api()
print(f"Result: {result}, total calls: {call_count}")
`,
    checkpoint: 'Your decorator raises the original exception after retries are exhausted. What is the subtle failure mode if you raise Exception(str(last_exc)) instead of raise last_exc?',
    checkpointAnswer: 'You lose the original exception type and the full stack trace. Downstream code that catches specific exceptions (e.g., except ConnectionError) will fail to match a generic Exception wrapper. The original traceback is also discarded — debugging a production incident becomes much harder. Always re-raise the original exception object (raise last_exc) or use raise with no argument inside the except block to preserve the chain.',
  },
  {
    id: 'mlc5',
    type: 3,
    title: 'ModelConfig Validation with Pydantic',
    domain: 'ML Systems',
    difficulty: 'mid',
    readMin: 10,
    prompt: `Implement a Pydantic ModelConfig class that validates ML training configuration.

Requirements:
• learning_rate: float, must be between 1e-6 and 1.0 (inclusive)
• batch_size: int, must be a power of 2, between 8 and 512
• epochs: int, between 1 and 1000
• model_type: Literal["xgboost", "lightgbm", "neural_net"]
• early_stopping_rounds: optional int, defaults to None; if set, must be > 0
• A computed property: steps_per_epoch(dataset_size: int) → int that returns ceil(dataset_size / batch_size)

All validation errors should be descriptive.`,
    starter: `from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Literal
import math

class ModelConfig(BaseModel):
    learning_rate: float
    batch_size: int
    epochs: int
    model_type: Literal["xgboost", "lightgbm", "neural_net"]
    early_stopping_rounds: Optional[int] = None

    # Add validators and computed method here

# Test
try:
    cfg = ModelConfig(learning_rate=0.01, batch_size=64, epochs=100, model_type="xgboost")
    print(cfg)
    print("steps_per_epoch(10000):", cfg.steps_per_epoch(10000))
except Exception as e:
    print(f"Error: {e}")

# This should fail:
try:
    bad = ModelConfig(learning_rate=2.0, batch_size=60, epochs=0, model_type="svm")
except Exception as e:
    print(f"Caught expected error: {e}")
`,
    solution: `from pydantic import BaseModel, field_validator
from typing import Optional, Literal
import math

class ModelConfig(BaseModel):
    learning_rate: float
    batch_size: int
    epochs: int
    model_type: Literal["xgboost", "lightgbm", "neural_net"]
    early_stopping_rounds: Optional[int] = None

    @field_validator('learning_rate')
    @classmethod
    def validate_lr(cls, v):
        if not (1e-6 <= v <= 1.0):
            raise ValueError(f"learning_rate must be between 1e-6 and 1.0, got {v}")
        return v

    @field_validator('batch_size')
    @classmethod
    def validate_batch_size(cls, v):
        if not (8 <= v <= 512) or (v & (v - 1)) != 0:
            raise ValueError(f"batch_size must be a power of 2 between 8 and 512, got {v}")
        return v

    @field_validator('epochs')
    @classmethod
    def validate_epochs(cls, v):
        if not (1 <= v <= 1000):
            raise ValueError(f"epochs must be between 1 and 1000, got {v}")
        return v

    @field_validator('early_stopping_rounds')
    @classmethod
    def validate_early_stopping(cls, v):
        if v is not None and v <= 0:
            raise ValueError(f"early_stopping_rounds must be > 0 if set, got {v}")
        return v

    def steps_per_epoch(self, dataset_size: int) -> int:
        return math.ceil(dataset_size / self.batch_size)

cfg = ModelConfig(learning_rate=0.01, batch_size=64, epochs=100, model_type="xgboost")
print(cfg)
print("steps_per_epoch(10000):", cfg.steps_per_epoch(10000))

try:
    bad = ModelConfig(learning_rate=2.0, batch_size=60, epochs=0, model_type="svm")
except Exception as e:
    print(f"Caught expected error: {e}")
`,
    checkpoint: 'Your validator correctly rejects batch_size=60 (not a power of 2). The check is (v & (v - 1)) != 0. Why does this bitwise trick work for detecting non-powers of 2?',
    checkpointAnswer: 'Any power of 2 has exactly one bit set in its binary representation (e.g., 64 = 01000000). Subtracting 1 flips all bits below that bit (63 = 00111111). The AND of the two is always 0 for powers of 2. For non-powers (e.g., 60 = 00111100), subtracting 1 gives 59 = 00111011, and 60 & 59 = 00111000 ≠ 0. This is an O(1) check versus iterating through powers.',
  },
  {
    id: 'mlc6',
    type: 1,
    title: 'Pandas CDC Deduplication',
    domain: 'Data Engineering',
    difficulty: 'senior',
    readMin: 15,
    prompt: `You receive a CDC (Change Data Capture) feed as a DataFrame. Each row is an event with:
- record_id: the ID of the business entity
- updated_at: timestamp of the change
- operation: "INSERT", "UPDATE", or "DELETE"
- payload: dict of current values (None for DELETE)

Implement deduplicate_cdc(df) that returns the latest state of each record:
• For each record_id, keep only the latest event by updated_at
• If the latest operation is "DELETE", exclude the record from output entirely
• Return a DataFrame with columns: record_id, payload (unwrap the dict into columns)
• Handle the case where updated_at timestamps may be equal (any stable tiebreak is fine)`,
    starter: `import pandas as pd
from datetime import datetime

def deduplicate_cdc(df: pd.DataFrame) -> pd.DataFrame:
    # Your implementation here
    pass

# Test
events = pd.DataFrame([
    {'record_id': 1, 'updated_at': datetime(2024,1,1,9,0), 'operation': 'INSERT', 'payload': {'name': 'Alice', 'score': 80}},
    {'record_id': 1, 'updated_at': datetime(2024,1,1,10,0), 'operation': 'UPDATE', 'payload': {'name': 'Alice', 'score': 95}},
    {'record_id': 2, 'updated_at': datetime(2024,1,1,9,0), 'operation': 'INSERT', 'payload': {'name': 'Bob', 'score': 70}},
    {'record_id': 2, 'updated_at': datetime(2024,1,1,11,0), 'operation': 'DELETE', 'payload': None},
    {'record_id': 3, 'updated_at': datetime(2024,1,1,8,0), 'operation': 'INSERT', 'payload': {'name': 'Carol', 'score': 88}},
])

result = deduplicate_cdc(events)
print(result)
# Expected: record_id=1 (score 95), record_id=3 (score 88). record_id=2 deleted — excluded.
`,
    solution: `import pandas as pd
from datetime import datetime

def deduplicate_cdc(df: pd.DataFrame) -> pd.DataFrame:
    # Sort by updated_at descending, keep last (latest) event per record_id
    latest = (
        df.sort_values('updated_at', ascending=False)
          .drop_duplicates(subset='record_id', keep='first')
    )

    # Drop deleted records
    active = latest[latest['operation'] != 'DELETE'].copy()

    if active.empty:
        return pd.DataFrame()

    # Unwrap payload dict into columns
    payload_df = pd.json_normalize(active['payload'].tolist())
    payload_df.index = active.index

    result = pd.concat([active[['record_id']].reset_index(drop=True),
                        payload_df.reset_index(drop=True)], axis=1)
    return result

events = pd.DataFrame([
    {'record_id': 1, 'updated_at': datetime(2024,1,1,9,0), 'operation': 'INSERT', 'payload': {'name': 'Alice', 'score': 80}},
    {'record_id': 1, 'updated_at': datetime(2024,1,1,10,0), 'operation': 'UPDATE', 'payload': {'name': 'Alice', 'score': 95}},
    {'record_id': 2, 'updated_at': datetime(2024,1,1,9,0), 'operation': 'INSERT', 'payload': {'name': 'Bob', 'score': 70}},
    {'record_id': 2, 'updated_at': datetime(2024,1,1,11,0), 'operation': 'DELETE', 'payload': None},
    {'record_id': 3, 'updated_at': datetime(2024,1,1,8,0), 'operation': 'INSERT', 'payload': {'name': 'Carol', 'score': 88}},
])

result = deduplicate_cdc(events)
print(result)
`,
    checkpoint: 'Your deduplication sorts descending then drop_duplicates to get the latest row. What is the subtle failure mode if the CDC feed has two UPDATE events for the same record_id with identical updated_at timestamps?',
    checkpointAnswer: 'sort_values is not guaranteed stable across equal keys — the row kept by drop_duplicates(keep="first") after sorting could be either of the two tied events, depending on the original DataFrame order. In practice, CDC systems assign monotonically increasing sequence numbers precisely for this reason. The correct fix: add a sequence_number column as a tiebreaker in the sort. If sequence numbers are unavailable, document the non-determinism explicitly — hiding it causes hard-to-debug production inconsistencies.',
  },
  {
    id: 'mlc7',
    type: 1,
    title: 'Diagnosing and Fixing Spark Data Skew',
    domain: 'Data Engineering',
    difficulty: 'senior',
    readMin: 20,
    prompt: `A PySpark job joining user events to a user_profile table takes 3.5 hours. Profiling shows 1 executor processes 80% of the data while 199 sit idle.

Your tasks:
1. Write diagnose_skew(df, key_col) — returns the top 10 keys by count and the skew ratio (max_count / mean_count)
2. Write salt_join(events_df, profiles_df, join_key, n_buckets=10) — implement salted join to distribute hot keys
   - Add a random salt (0 to n_buckets-1) to events_df join key
   - Replicate each profiles_df row n_buckets times with each salt value
   - Join on the salted key, then drop salt columns

Use only PySpark (pyspark.sql.functions). No pandas.`,
    starter: `from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import *

spark = SparkSession.builder.master("local[*]").appName("skew").getOrCreate()
spark.sparkContext.setLogLevel("ERROR")

def diagnose_skew(df, key_col):
    """Return top 10 keys by count + skew ratio (max/mean)."""
    # Your implementation here
    pass

def salt_join(events_df, profiles_df, join_key, n_buckets=10):
    """Salted join to distribute hot keys across partitions."""
    # Your implementation here
    pass

# Test data
events = spark.createDataFrame([
    ("user_A",), ("user_A",), ("user_A",), ("user_A",), ("user_A",),
    ("user_B",), ("user_B",), ("user_C",), ("user_D",), ("user_E",),
], ["user_id"])

profiles = spark.createDataFrame([
    ("user_A", "premium"), ("user_B", "free"),
    ("user_C", "free"), ("user_D", "premium"), ("user_E", "free"),
], ["user_id", "tier"])

print("=== Skew diagnosis ===")
top_keys, skew_ratio = diagnose_skew(events, "user_id")
top_keys.show()
print(f"Skew ratio: {skew_ratio:.1f}x")

print("\\n=== Salted join result ===")
result = salt_join(events, profiles, "user_id", n_buckets=4)
result.show()
`,
    solution: `from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.master("local[*]").appName("skew").getOrCreate()
spark.sparkContext.setLogLevel("ERROR")

def diagnose_skew(df, key_col):
    counts = df.groupBy(key_col).count()
    top10 = counts.orderBy(F.desc("count")).limit(10)
    stats = counts.agg(
        F.max("count").alias("max_count"),
        F.mean("count").alias("mean_count")
    ).collect()[0]
    skew_ratio = stats["max_count"] / stats["mean_count"]
    return top10, skew_ratio

def salt_join(events_df, profiles_df, join_key, n_buckets=10):
    # Add random salt to events
    salted_events = events_df.withColumn(
        "salt", (F.rand() * n_buckets).cast("int")
    ).withColumn(
        "salted_key", F.concat(F.col(join_key), F.lit("_"), F.col("salt"))
    )

    # Replicate profiles for each salt bucket
    buckets_df = spark.range(n_buckets).withColumnRenamed("id", "salt")
    salted_profiles = profiles_df.crossJoin(buckets_df).withColumn(
        "salted_key", F.concat(F.col(join_key), F.lit("_"), F.col("salt"))
    )

    # Join on salted key, drop helper columns
    result = salted_events.join(salted_profiles, on="salted_key", how="left") \
        .drop("salt", "salted_key", salted_profiles[join_key])

    return result

events = spark.createDataFrame([
    ("user_A",), ("user_A",), ("user_A",), ("user_A",), ("user_A",),
    ("user_B",), ("user_B",), ("user_C",), ("user_D",), ("user_E",),
], ["user_id"])

profiles = spark.createDataFrame([
    ("user_A", "premium"), ("user_B", "free"),
    ("user_C", "free"), ("user_D", "premium"), ("user_E", "free"),
], ["user_id", "tier"])

top_keys, skew_ratio = diagnose_skew(events, "user_id")
top_keys.show()
print(f"Skew ratio: {skew_ratio:.1f}x")

result = salt_join(events, profiles, "user_id", n_buckets=4)
result.show()
`,
    checkpoint: 'Your salt_join replicates the profiles table n_buckets times. What is the failure mode when profiles_df is very large (e.g., 500M rows) and n_buckets=20?',
    checkpointAnswer: 'Replicating a 500M-row table 20× produces a 10B-row intermediate dataset. This will OOM the executors and is worse than the original skew problem. Salting only makes sense when profiles_df (the small/dimension table) can be broadcast OR when the skew is in a small subset of keys. The correct production approach for large dimension tables: identify which keys are hot (top 1%), salt only those specific hot keys (partial salting), and handle the remaining keys with a standard join. This bounds the replication factor to hot-key count × n_buckets, not total_rows × n_buckets.',
  },
  {
    id: 'mlc8',
    type: 1,
    title: 'Time-Safe Train/Validation Split',
    domain: 'Feature Engineering',
    difficulty: 'mid',
    readMin: 12,
    prompt: `You have a DataFrame of user transactions with columns:
  user_id (str), transaction_date (datetime), amount (float), is_fraud (int 0/1)

Implement a function that:
1. Creates time-based features: rolling 7-day transaction count and rolling 7-day spend per user
2. Splits into train (before cutoff) and validation (on/after cutoff) WITHOUT any future leakage
3. Returns X_train, X_val, y_train, y_val

The cutoff date is '2024-06-01'.

Constraints:
- Rolling features for a transaction on date D must use only transactions STRICTLY before D (not including D)
- Validation features must NOT be computed using any validation period data
- No sklearn train_test_split — implement the temporal split manually`,
    starter: `import pandas as pd
import numpy as np

def time_safe_split(df: pd.DataFrame, cutoff: str):
    cutoff_dt = pd.to_datetime(cutoff)
    df = df.copy()
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df = df.sort_values(['user_id', 'transaction_date'])

    # TODO: compute rolling_7d_count and rolling_7d_spend per user
    # using only strictly prior transactions

    # TODO: split into train/val on cutoff

    feature_cols = ['rolling_7d_count', 'rolling_7d_spend']
    # return X_train, X_val, y_train, y_val
    pass

# Test data
import random
random.seed(42)
dates = pd.date_range('2024-01-01', '2024-08-31', freq='D')
rows = []
for uid in ['u1', 'u2', 'u3']:
    for _ in range(40):
        rows.append({'user_id': uid, 'transaction_date': random.choice(dates),
                     'amount': round(random.uniform(10, 500), 2),
                     'is_fraud': random.randint(0, 1)})
df = pd.DataFrame(rows)
result = time_safe_split(df, '2024-06-01')
if result:
    X_train, X_val, y_train, y_val = result
    print(f"Train: {len(X_train)} rows, Val: {len(X_val)} rows")
    print(f"Train date range: {df.loc[X_train.index, 'transaction_date'].min().date()} to {df.loc[X_train.index, 'transaction_date'].max().date()}")
    print(f"Val date range: {df.loc[X_val.index, 'transaction_date'].min().date()} to {df.loc[X_val.index, 'transaction_date'].max().date()}")
`,
    solution: `import pandas as pd
import numpy as np

def time_safe_split(df: pd.DataFrame, cutoff: str):
    cutoff_dt = pd.to_datetime(cutoff)
    df = df.copy()
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df = df.sort_values(['user_id', 'transaction_date']).reset_index(drop=True)

    # Point-in-time rolling features: for each row, use only prior rows for the same user
    counts, spends = [], []
    for _, group in df.groupby('user_id', sort=False):
        group = group.sort_values('transaction_date')
        window_counts, window_spends = [], []
        for i, (_, row) in enumerate(group.iterrows()):
            cutoff_7d = row['transaction_date'] - pd.Timedelta(days=7)
            prior = group[
                (group['transaction_date'] >= cutoff_7d) &
                (group['transaction_date'] < row['transaction_date'])
            ]
            window_counts.append(len(prior))
            window_spends.append(prior['amount'].sum())
        counts.extend(window_counts)
        spends.extend(window_spends)

    # Re-align (groupby changes order)
    df_sorted = df.copy()
    df_sorted['rolling_7d_count'] = 0
    df_sorted['rolling_7d_spend'] = 0.0
    idx = 0
    for _, group in df.groupby('user_id', sort=False):
        group_sorted = group.sort_values('transaction_date')
        for loc in group_sorted.index:
            df_sorted.at[loc, 'rolling_7d_count'] = counts[idx]
            df_sorted.at[loc, 'rolling_7d_spend'] = spends[idx]
            idx += 1

    feature_cols = ['rolling_7d_count', 'rolling_7d_spend']
    train = df_sorted[df_sorted['transaction_date'] < cutoff_dt]
    val   = df_sorted[df_sorted['transaction_date'] >= cutoff_dt]

    return (train[feature_cols], val[feature_cols],
            train['is_fraud'], val['is_fraud'])

import random
random.seed(42)
dates = pd.date_range('2024-01-01', '2024-08-31', freq='D')
rows = []
for uid in ['u1', 'u2', 'u3']:
    for _ in range(40):
        rows.append({'user_id': uid, 'transaction_date': random.choice(dates),
                     'amount': round(random.uniform(10, 500), 2),
                     'is_fraud': random.randint(0, 1)})
df = pd.DataFrame(rows)
X_train, X_val, y_train, y_val = time_safe_split(df, '2024-06-01')
print(f"Train: {len(X_train)} rows, Val: {len(X_val)} rows")
print(f"Train rolling_7d_count mean: {X_train['rolling_7d_count'].mean():.2f}")
print(f"Val rolling_7d_count mean: {X_val['rolling_7d_count'].mean():.2f}")
print("No leakage: val features computed from pre-cutoff data only")
`,
    checkpoint: 'What goes wrong if you compute rolling features on the full DataFrame before splitting, instead of point-in-time?',
    checkpointAnswer: 'Rolling features computed on the full DataFrame include future transactions in the window. A transaction on 2024-05-30 would have its rolling_7d_count include transactions from 2024-06-01–06-06 (which are in the window but in the future). The training set learns features that include information about what happens after the train/val cutoff. This inflates training performance and produces a model that cannot be reproduced in production, where future transactions are unavailable at inference time. The production model would receive feature values that are systematically lower than what it trained on.',
  },
  {
    id: 'mlc9',
    type: 1,
    title: 'Weighted Precision@K for Imbalanced Ranking',
    domain: 'Model Evaluation',
    difficulty: 'senior',
    readMin: 14,
    prompt: `In a fraud detection ranking system, not all fraud cases are equal:
- High-value fraud (amount > $10,000): weight = 3.0
- Mid-value fraud (amount $1,000–$10,000): weight = 1.5
- Low-value fraud (amount < $1,000): weight = 1.0

Implement weighted_precision_at_k(y_true, y_scores, amounts, k) that:
1. Ranks transactions by y_scores descending
2. Takes the top-K predictions
3. Returns weighted precision: sum(weights of true positives in top-K) / sum(weights of all items in top-K)
   (weight = fraud weight if true positive, 1.0 if false positive)

Also implement: find_optimal_k(y_true, y_scores, amounts, min_precision=0.6)
Returns the largest K where weighted_precision_at_k >= min_precision.`,
    starter: `import numpy as np

def get_weight(amount):
    if amount > 10000: return 3.0
    if amount >= 1000: return 1.5
    return 1.0

def weighted_precision_at_k(y_true, y_scores, amounts, k):
    # Your implementation
    pass

def find_optimal_k(y_true, y_scores, amounts, min_precision=0.6):
    # Your implementation
    pass

# Test
np.random.seed(42)
n = 1000
y_true  = np.random.binomial(1, 0.05, n)   # 5% fraud rate
y_scores = np.where(y_true, np.random.uniform(0.6, 1.0, n), np.random.uniform(0.0, 0.7, n))
amounts  = np.random.choice([500, 5000, 50000], n, p=[0.7, 0.2, 0.1])

print(f"P@10:  {weighted_precision_at_k(y_true, y_scores, amounts, 10):.3f}")
print(f"P@50:  {weighted_precision_at_k(y_true, y_scores, amounts, 50):.3f}")
print(f"P@100: {weighted_precision_at_k(y_true, y_scores, amounts, 100):.3f}")
print(f"Optimal K (min_prec=0.6): {find_optimal_k(y_true, y_scores, amounts, 0.6)}")
`,
    solution: `import numpy as np

def get_weight(amount):
    if amount > 10000: return 3.0
    if amount >= 1000: return 1.5
    return 1.0

def weighted_precision_at_k(y_true, y_scores, amounts, k):
    y_true   = np.asarray(y_true)
    y_scores = np.asarray(y_scores)
    amounts  = np.asarray(amounts)

    # Rank by score descending, take top K
    sorted_idx = np.argsort(y_scores)[::-1][:k]
    top_k_true   = y_true[sorted_idx]
    top_k_amounts = amounts[sorted_idx]

    numerator   = 0.0
    denominator = 0.0
    for is_fraud, amount in zip(top_k_true, top_k_amounts):
        w = get_weight(amount) if is_fraud else 1.0
        denominator += w
        if is_fraud:
            numerator += w

    return numerator / denominator if denominator > 0 else 0.0

def find_optimal_k(y_true, y_scores, amounts, min_precision=0.6):
    n = len(y_true)
    optimal_k = 0
    for k in range(1, n + 1):
        if weighted_precision_at_k(y_true, y_scores, amounts, k) >= min_precision:
            optimal_k = k
        else:
            break  # precision is monotonically non-increasing as K grows
    return optimal_k

np.random.seed(42)
n = 1000
y_true   = np.random.binomial(1, 0.05, n)
y_scores = np.where(y_true, np.random.uniform(0.6, 1.0, n), np.random.uniform(0.0, 0.7, n))
amounts  = np.random.choice([500, 5000, 50000], n, p=[0.7, 0.2, 0.1])

print(f"P@10:  {weighted_precision_at_k(y_true, y_scores, amounts, 10):.3f}")
print(f"P@50:  {weighted_precision_at_k(y_true, y_scores, amounts, 50):.3f}")
print(f"P@100: {weighted_precision_at_k(y_true, y_scores, amounts, 100):.3f}")
print(f"Optimal K (min_prec=0.6): {find_optimal_k(y_true, y_scores, amounts, 0.6)}")
`,
    checkpoint: 'find_optimal_k uses a break when precision drops below the threshold. When does this break fail to find the true optimal K?',
    checkpointAnswer: 'Precision@K is not strictly monotonically decreasing — it can increase at certain K values if a high-weight true positive appears just outside the current top-K. For example, if the 51st-ranked item is a $50,000 fraud case (weight 3.0), P@51 can be higher than P@50. The break-on-first-failure approach misses this and returns K=50 instead of 51. Correct implementation: iterate all K values and track the maximum K that meets the threshold. The tradeoff is O(n²) time vs O(n) for the break approach — at production scale (n=10M transactions), precompute the sorted order once and iterate the cumulative precision.',
  },
  {
    id: 'mlc10',
    type: 1,
    title: 'Online Mean and Variance (Welford\'s Algorithm)',
    domain: 'Model Training',
    difficulty: 'mid',
    readMin: 12,
    prompt: `A streaming feature pipeline must maintain a running mean and variance for a numeric feature as new data arrives — without storing all past values.

Implement an OnlineStats class using Welford's algorithm:
- update(x): incorporate a new observation
- mean: current mean
- variance: current sample variance (Bessel's correction, n-1)
- std: current standard deviation
- reset(): clear all state

Then implement: z_score_normalize(stream, window_size=None)
- If window_size is None: use all data seen so far
- If window_size=N: use only the last N observations (sliding window)
- Returns each value's z-score at the time it arrives

The sliding window version should NOT store a rolling array — use a deque and update stats incrementally.`,
    starter: `import numpy as np
from collections import deque

class OnlineStats:
    def __init__(self):
        self.reset()

    def reset(self):
        # Your implementation
        pass

    def update(self, x):
        # Welford's online algorithm
        pass

    @property
    def mean(self):
        pass

    @property
    def variance(self):
        pass

    @property
    def std(self):
        pass

def z_score_normalize(stream, window_size=None):
    # Yield z-scores as data arrives
    pass

# Test
stream = [2.1, 3.4, 2.8, 5.1, 2.3, 8.7, 2.9, 3.1, 2.6, 4.2]
print("Full stream z-scores:")
for val, z in zip(stream, z_score_normalize(stream)):
    print(f"  x={val:.1f}  z={z:.3f}")

print("Sliding window (size=4) z-scores:")
for val, z in zip(stream, z_score_normalize(stream, window_size=4)):
    print(f"  x={val:.1f}  z={z:.3f}")
`,
    solution: `import numpy as np
from collections import deque

class OnlineStats:
    def __init__(self):
        self.reset()

    def reset(self):
        self.n   = 0
        self._mean = 0.0
        self._M2   = 0.0   # sum of squared deviations

    def update(self, x):
        self.n += 1
        delta  = x - self._mean
        self._mean += delta / self.n
        delta2 = x - self._mean
        self._M2 += delta * delta2

    @property
    def mean(self):
        return self._mean

    @property
    def variance(self):
        # Sample variance (Bessel's correction)
        return self._M2 / (self.n - 1) if self.n > 1 else 0.0

    @property
    def std(self):
        return self.variance ** 0.5

def z_score_normalize(stream, window_size=None):
    stream = list(stream)

    if window_size is None:
        stats = OnlineStats()
        for x in stream:
            stats.update(x)
            if stats.n < 2 or stats.std == 0:
                yield 0.0
            else:
                yield (x - stats.mean) / stats.std

    else:
        # Sliding window: maintain a deque and incremental sum/sum_sq
        window = deque()
        s, s2  = 0.0, 0.0

        for x in stream:
            # Evict oldest if full
            if len(window) == window_size:
                old = window.popleft()
                s  -= old
                s2 -= old * old

            window.append(x)
            s  += x
            s2 += x * x

            n = len(window)
            if n < 2:
                yield 0.0
            else:
                mean = s / n
                var  = (s2 - n * mean ** 2) / (n - 1)
                std  = max(var, 0.0) ** 0.5
                yield (x - mean) / std if std > 0 else 0.0

stream = [2.1, 3.4, 2.8, 5.1, 2.3, 8.7, 2.9, 3.1, 2.6, 4.2]
print("Full stream z-scores:")
for val, z in zip(stream, z_score_normalize(stream)):
    print(f"  x={val:.1f}  z={z:.3f}")

print("Sliding window (size=4) z-scores:")
for val, z in zip(stream, z_score_normalize(stream, window_size=4)):
    print(f"  x={val:.1f}  z={z:.3f}")
`,
    checkpoint: 'The sliding window version uses s2 - n * mean² to compute variance. Why not use the naive formula sum((x-mean)²)?',
    checkpointAnswer: 'The naive formula requires storing all window values to recompute (x-mean)² after each eviction. The computational trick (s2 - n*mean²) — called the "computational formula for variance" — lets us maintain variance incrementally using only the sum and sum of squares. However, this formula suffers from catastrophic cancellation when values are large and variance is small: subtracting two large similar numbers loses precision. Welford\'s algorithm avoids this by tracking M2 (sum of squared deviations from the running mean) directly. In production, use Welford\'s for numerical stability; use the sum/sum-of-squares trick only when you control the scale of input values.',
  },
  {
    id: 'mlc11',
    type: 1,
    title: 'Early Stopping for Gradient Boosting From Scratch',
    domain: 'Model Training',
    difficulty: 'senior',
    readMin: 15,
    prompt: `Implement early stopping for a gradient boosting loop WITHOUT using sklearn's early stopping.

You are given a simple GBM-like training loop:
- Each round adds a weak learner (provided as fit_round(X_train, residuals) → predictions)
- You evaluate on a validation set after each round
- Stop when validation loss has not improved for \`patience\` rounds
- Restore to the best round (not the last round)

Implement:
1. EarlyStopper class with: should_stop(val_loss) → bool, best_round → int, rounds_without_improvement → int
2. train_with_early_stopping(X_train, y_train, X_val, y_val, n_rounds, patience, learning_rate)

Use MSE as the loss. The weak learner is a shallow decision tree (use sklearn DecisionTreeRegressor depth=3).`,
    starter: `import numpy as np
from sklearn.tree import DecisionTreeRegressor

class EarlyStopper:
    def __init__(self, patience=5, min_delta=1e-4):
        self.patience  = patience
        self.min_delta = min_delta
        # Your init here

    def should_stop(self, val_loss: float) -> bool:
        # Return True if training should stop
        # Update internal state
        pass

    @property
    def best_round(self) -> int:
        pass

    @property
    def rounds_without_improvement(self) -> int:
        pass

def train_with_early_stopping(X_train, y_train, X_val, y_val,
                               n_rounds=200, patience=10, learning_rate=0.1):
    # Returns: predictions on val, best_round, loss_history
    pass

# Test
np.random.seed(42)
n = 500
X = np.random.randn(n, 5)
y = 3*X[:,0] - 2*X[:,1] + np.random.randn(n)*0.5

split = int(0.8*n)
X_train, X_val = X[:split], X[split:]
y_train, y_val = y[:split], y[split:]

preds, best_round, history = train_with_early_stopping(
    X_train, y_train, X_val, y_val, n_rounds=200, patience=10)

if preds is not None:
    final_mse = np.mean((preds - y_val)**2)
    print(f"Best round: {best_round}")
    print(f"Val MSE at best round: {final_mse:.4f}")
    print(f"Total rounds run: {len(history)}")
    print(f"Rounds saved by early stopping: {200 - len(history)}")
`,
    solution: `import numpy as np
from sklearn.tree import DecisionTreeRegressor

class EarlyStopper:
    def __init__(self, patience=5, min_delta=1e-4):
        self.patience   = patience
        self.min_delta  = min_delta
        self._best_loss = float('inf')
        self._best_rnd  = 0
        self._counter   = 0
        self._round     = 0

    def should_stop(self, val_loss: float) -> bool:
        self._round += 1
        if val_loss < self._best_loss - self.min_delta:
            self._best_loss = val_loss
            self._best_rnd  = self._round
            self._counter   = 0
        else:
            self._counter += 1
        return self._counter >= self.patience

    @property
    def best_round(self):
        return self._best_rnd

    @property
    def rounds_without_improvement(self):
        return self._counter

def train_with_early_stopping(X_train, y_train, X_val, y_val,
                               n_rounds=200, patience=10, learning_rate=0.1):
    stopper     = EarlyStopper(patience=patience)
    train_preds = np.zeros(len(X_train))
    val_preds   = np.zeros(len(X_val))
    all_trees   = []
    loss_history = []
    best_val_preds = val_preds.copy()

    for rnd in range(n_rounds):
        residuals = y_train - train_preds
        tree = DecisionTreeRegressor(max_depth=3, random_state=rnd)
        tree.fit(X_train, residuals)
        all_trees.append(tree)

        train_preds += learning_rate * tree.predict(X_train)
        val_preds   += learning_rate * tree.predict(X_val)

        val_mse = np.mean((val_preds - y_val) ** 2)
        loss_history.append(val_mse)

        if val_mse < np.mean((best_val_preds - y_val)**2) - 1e-4:
            best_val_preds = val_preds.copy()

        if stopper.should_stop(val_mse):
            print(f"Early stopping at round {rnd+1}, best round: {stopper.best_round}")
            break

    return best_val_preds, stopper.best_round, loss_history

np.random.seed(42)
n = 500
X = np.random.randn(n, 5)
y = 3*X[:,0] - 2*X[:,1] + np.random.randn(n)*0.5

split = int(0.8*n)
X_train, X_val = X[:split], X[split:]
y_train, y_val = y[:split], y[split:]

preds, best_round, history = train_with_early_stopping(
    X_train, y_train, X_val, y_val, n_rounds=200, patience=10)

final_mse = np.mean((preds - y_val)**2)
print(f"Best round: {best_round}")
print(f"Val MSE at best round: {final_mse:.4f}")
print(f"Total rounds run: {len(history)}")
print(f"Rounds saved by early stopping: {200 - len(history)}")
`,
    checkpoint: 'This implementation restores to the best validation predictions, not the best model weights. What\'s the difference and when does it matter?',
    checkpointAnswer: 'Restoring best predictions works for evaluating the final model but does not give you the trained model object (the list of trees) at the best round. If you need to serve predictions on new data after training, you need to track which round was best and reconstruct the prediction by summing only the trees up to that round. The production pattern: keep a list of all trees, track best_round, then at inference time sum the first best_round trees. Restoring predictions-only is fine for evaluation and hyperparameter search; it is incorrect for model serialisation and deployment.',
  },
  {
    id: 'mlc12',
    type: 1,
    title: 'Permutation Feature Importance From Scratch',
    domain: 'Model Evaluation',
    difficulty: 'staff',
    readMin: 16,
    prompt: `Implement model-agnostic permutation feature importance WITHOUT using sklearn's permutation_importance.

permutation_importance(model, X_val, y_val, metric_fn, n_repeats=5, random_state=42)

Algorithm:
1. Compute baseline metric on (X_val, y_val)
2. For each feature j:
   a. Repeat n_repeats times:
      - Shuffle column j in X_val
      - Compute metric on shuffled data
      - Importance contribution = baseline_metric - shuffled_metric
   b. Importance[j] = mean of n_repeats contributions
   c. Importance_std[j] = std of n_repeats contributions
3. Return: importances array, stds array, feature names

Also implement: plot_importance_text(importances, stds, feature_names)
— prints a sorted ASCII bar chart of feature importances with ±std shown.

Use negative MSE as the metric (higher = better), so importance > 0 means feature matters.`,
    starter: `import numpy as np

def permutation_importance(model, X_val, y_val, metric_fn,
                            n_repeats=5, random_state=42):
    # Your implementation
    pass

def plot_importance_text(importances, stds, feature_names, width=40):
    # ASCII bar chart, sorted by importance descending
    pass

# Test with a simple model
from sklearn.ensemble import RandomForestRegressor
from sklearn.datasets import make_regression

np.random.seed(42)
X, y = make_regression(n_samples=300, n_features=8, n_informative=4,
                        noise=0.1, random_state=42)
feature_names = [f'feature_{i}' for i in range(X.shape[1])]

split = 240
X_train, X_val = X[:split], X[split:]
y_train, y_val = y[:split], y[split:]

model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X_train, y_train)

def neg_mse(model, X, y):
    return -np.mean((model.predict(X) - y)**2)

importances, stds, names = permutation_importance(
    model, X_val, y_val, neg_mse, n_repeats=5)

if importances is not None:
    plot_importance_text(importances, stds, names)
`,
    solution: `import numpy as np

def permutation_importance(model, X_val, y_val, metric_fn,
                            n_repeats=5, random_state=42):
    rng = np.random.RandomState(random_state)
    X_val = np.asarray(X_val)
    y_val = np.asarray(y_val)
    n_features = X_val.shape[1]

    baseline = metric_fn(model, X_val, y_val)
    importances = np.zeros((n_features, n_repeats))

    for j in range(n_features):
        for r in range(n_repeats):
            X_permuted = X_val.copy()
            X_permuted[:, j] = rng.permutation(X_permuted[:, j])
            permuted_score = metric_fn(model, X_permuted, y_val)
            importances[j, r] = baseline - permuted_score

    means = importances.mean(axis=1)
    stds  = importances.std(axis=1)
    return means, stds, list(range(n_features))

def plot_importance_text(importances, stds, feature_names, width=40):
    order = np.argsort(importances)[::-1]
    max_imp = max(abs(importances)) if max(abs(importances)) > 0 else 1
    print(f"\\nPermutation Feature Importance (n_repeats=5):")
    print("-" * 60)
    for i in order:
        name = feature_names[i] if isinstance(feature_names[i], str) else f'feature_{feature_names[i]}'
        bar_len = int(abs(importances[i]) / max_imp * width)
        bar = '█' * bar_len
        sign = '+' if importances[i] >= 0 else '-'
        print(f"  {name:<15} {sign}{abs(importances[i]):.4f} ±{stds[i]:.4f}  |{bar}")
    print("-" * 60)

from sklearn.ensemble import RandomForestRegressor
from sklearn.datasets import make_regression

np.random.seed(42)
X, y = make_regression(n_samples=300, n_features=8, n_informative=4,
                        noise=0.1, random_state=42)
feature_names = [f'feature_{i}' for i in range(X.shape[1])]

split = 240
X_train, X_val = X[:split], X[split:]
y_train, y_val = y[:split], y[split:]

model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X_train, y_train)

def neg_mse(model, X, y):
    return -np.mean((model.predict(X) - y)**2)

importances, stds, names = permutation_importance(
    model, X_val, y_val, neg_mse, n_repeats=5)
plot_importance_text(importances, stds, feature_names)
`,
    checkpoint: 'Permutation importance shuffles one feature at a time. What does it miss that SHAP handles correctly?',
    checkpointAnswer: 'Permutation importance cannot detect feature interactions. If features A and B are correlated and the model uses them jointly (e.g., A×B interaction), shuffling A alone may not reduce performance much because B still carries similar information. SHAP values are additive and account for interactions by computing marginal contributions across all possible feature orderings (Shapley values from cooperative game theory). Permutation importance also does not handle correlated features correctly — shuffling feature A when B is correlated with A creates unrealistic data points that the model was never trained on. SHAP\'s TreeExplainer avoids this by using the actual training data distribution. For production model debugging, permutation importance is a fast first pass; SHAP is the correct tool when features are correlated or interactions matter.',
  },
  {
    id: 'mlc13',
    type: 2,
    title: 'Debug: Leaking Cross-Validator',
    domain: 'Model Evaluation',
    difficulty: 'senior',
    readMin: 18,
    prompt: `The function below is a cross-validated feature selection + model evaluation pipeline.
It runs without errors and reports 94% accuracy. But when you deploy the model, test accuracy is 71%.

Find ALL data leakage bugs. There are two. Fix them. Explain why each one caused the inflated score.

\`\`\`python
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import KFold

def evaluate_pipeline(X, y, k=5, n_features=10):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)             # Line A

    selector = SelectKBest(f_classif, k=n_features)
    X_selected = selector.fit_transform(X_scaled, y)  # Line B

    kf = KFold(n_splits=k, shuffle=True, random_state=42)
    scores = []
    for train_idx, val_idx in kf.split(X_selected):
        X_train, X_val = X_selected[train_idx], X_selected[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        clf = LogisticRegression(max_iter=1000)
        clf.fit(X_train, y_train)
        scores.append(clf.score(X_val, y_val))

    return np.mean(scores)
\`\`\``,
    starter: `import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import KFold

def evaluate_pipeline_fixed(X, y, k=5, n_features=10):
    # Fix the two leakage bugs here.
    # Both preprocessing steps must be fit only on training folds.
    pass

# Generate synthetic data where true accuracy should be ~72%
np.random.seed(42)
X = np.random.randn(300, 50)   # 50 features, mostly noise
y = (X[:, 0] + X[:, 1] > 0).astype(int)  # only first 2 features matter

print("Buggy pipeline score:", round(evaluate_pipeline_buggy(X, y), 4))
print("Fixed pipeline score:", round(evaluate_pipeline_fixed(X, y), 4))
`,
    solution: `import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import KFold

# ── Buggy version (for comparison) ──────────────────────────────────────────
def evaluate_pipeline_buggy(X, y, k=5, n_features=10):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)          # BUG 1: fit on all data

    selector = SelectKBest(f_classif, k=n_features)
    X_selected = selector.fit_transform(X_scaled, y)  # BUG 2: fit on all data

    kf = KFold(n_splits=k, shuffle=True, random_state=42)
    scores = []
    for train_idx, val_idx in kf.split(X_selected):
        X_train, X_val = X_selected[train_idx], X_selected[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]
        clf = LogisticRegression(max_iter=1000)
        clf.fit(X_train, y_train)
        scores.append(clf.score(X_val, y_val))
    return np.mean(scores)

# ── Fixed version ────────────────────────────────────────────────────────────
def evaluate_pipeline_fixed(X, y, k=5, n_features=10):
    kf = KFold(n_splits=k, shuffle=True, random_state=42)
    scores = []
    for train_idx, val_idx in kf.split(X):
        X_train_raw, X_val_raw = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        # FIX 1: fit scaler only on training fold
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train_raw)
        X_val_scaled = scaler.transform(X_val_raw)  # transform only

        # FIX 2: fit selector only on training fold
        selector = SelectKBest(f_classif, k=n_features)
        X_train_sel = selector.fit_transform(X_train_scaled, y_train)
        X_val_sel = selector.transform(X_val_scaled)  # transform only

        clf = LogisticRegression(max_iter=1000)
        clf.fit(X_train_sel, y_train)
        scores.append(clf.score(X_val_sel, y_val))

    return np.mean(scores)

np.random.seed(42)
X = np.random.randn(300, 50)
y = (X[:, 0] + X[:, 1] > 0).astype(int)

print("Buggy:", round(evaluate_pipeline_buggy(X, y), 4))   # ~0.94
print("Fixed:", round(evaluate_pipeline_fixed(X, y), 4))   # ~0.72
`,
    checkpoint: 'Bug 1 (StandardScaler): Fitting on all 300 rows lets validation fold statistics bleed into the scaler. The scaler's mean and std for each feature encode information from validation rows — so the model sees slightly "pre-tuned" val features. Bug 2 (SelectKBest): This is the bigger leak. SelectKBest uses f_classif to rank features by ANOVA F-test with y. When fit on all 300 rows, the feature selector uses validation labels to pick which 10 features to keep. The validation set's own labels determine what features the model sees — this is directly leaking the target. Result: features selected look highly predictive because they're selected using the val labels themselves. The fix: both transforms must be fit exclusively on the training fold inside the loop and applied (not re-fit) to the val fold.',
    checkpointAnswer: 'The key mental model: any fit() call that touches val-fold rows (in X or y) is leakage. The split must happen before any preprocessing step that depends on data statistics. sklearn Pipeline handles this automatically — it fits all steps only on the training data during cross_val_score. The manual fix is equivalent: restructure so that fit() happens inside the loop, on train_idx only.',
  },
  {
    id: 'mlc14',
    type: 3,
    title: 'Optimise: Pandas Feature Engineering at 10× Speed',
    domain: 'Feature Engineering',
    difficulty: 'senior',
    readMin: 15,
    prompt: `The function below computes three rolling features for a 500K-row clickstream DataFrame.
It takes 47 seconds on a standard laptop. You must reduce it to under 5 seconds without changing the output.

\`\`\`python
import pandas as pd

def compute_features_slow(df):
    """
    df has columns: user_id, timestamp, item_id, price
    Sorted by user_id, timestamp ascending.
    Returns df with 3 new columns:
      - n_clicks_7d: clicks by this user in the last 7 days
      - avg_price_seen: mean price of items this user has seen
      - time_since_last_click: seconds since this user's previous click
    """
    results = []
    for idx, row in df.iterrows():
        user_df = df[(df['user_id'] == row['user_id']) &
                     (df['timestamp'] <= row['timestamp'])]
        n7d = user_df[user_df['timestamp'] >= row['timestamp'] - pd.Timedelta('7d')].shape[0]
        avg_p = user_df['price'].mean()
        prev = user_df[user_df['timestamp'] < row['timestamp']]
        t_since = (row['timestamp'] - prev['timestamp'].max()).total_seconds() if not prev.empty else -1
        results.append({'n_clicks_7d': n7d, 'avg_price_seen': avg_p, 'time_since_last': t_since})
    return df.assign(**pd.DataFrame(results, index=df.index))
\`\`\`

Hint: the slow path is iterrows() + repeated DataFrame filtering. Identify the bottleneck pattern and replace with vectorised groupby operations.`,
    starter: `import pandas as pd
import numpy as np

def compute_features_fast(df):
    # Must produce identical output to compute_features_slow.
    # No iterrows(). Target: < 5 seconds on 500K rows.
    # Allowed: groupby, transform, rolling, shift, merge.
    pass

# Generate test data
np.random.seed(42)
n = 10_000   # use small n for Pyodide; conceptually scale to 500K
users = np.random.choice([f'u{i}' for i in range(50)], n)
times = pd.date_range('2024-01-01', periods=n, freq='1min')
df = pd.DataFrame({
    'user_id': users,
    'timestamp': sorted(times),
    'item_id': np.random.randint(1, 1000, n),
    'price': np.random.uniform(10, 500, n).round(2)
}).sort_values(['user_id', 'timestamp']).reset_index(drop=True)

result = compute_features_fast(df)
print(result[['user_id', 'n_clicks_7d', 'avg_price_seen', 'time_since_last']].head(10))
`,
    solution: `import pandas as pd
import numpy as np

def compute_features_fast(df):
    df = df.sort_values(['user_id', 'timestamp']).reset_index(drop=True)

    # ── Feature 1: n_clicks_7d ── rolling count per user in 7-day window
    # groupby + rolling on a count-compatible column
    df = df.set_index('timestamp')
    df['n_clicks_7d'] = (
        df.groupby('user_id')['item_id']
          .transform(lambda x: x.rolling('7D').count())
    )
    df = df.reset_index()

    # ── Feature 2: avg_price_seen ── cumulative mean per user up to each row
    df['avg_price_seen'] = (
        df.groupby('user_id')['price']
          .transform(lambda x: x.expanding().mean())
    )

    # ── Feature 3: time_since_last_click ── shift within user group
    df['prev_timestamp'] = df.groupby('user_id')['timestamp'].shift(1)
    df['time_since_last'] = (
        (df['timestamp'] - df['prev_timestamp']).dt.total_seconds()
    ).fillna(-1)
    df = df.drop(columns=['prev_timestamp'])

    return df

np.random.seed(42)
n = 10_000
users = np.random.choice([f'u{i}' for i in range(50)], n)
times = pd.date_range('2024-01-01', periods=n, freq='1min')
df = pd.DataFrame({
    'user_id': users,
    'timestamp': sorted(times),
    'item_id': np.random.randint(1, 1000, n),
    'price': np.random.uniform(10, 500, n).round(2)
}).sort_values(['user_id', 'timestamp']).reset_index(drop=True)

result = compute_features_fast(df)
print(result[['user_id', 'n_clicks_7d', 'avg_price_seen', 'time_since_last']].head(10))
`,
    checkpoint: 'The slow path runs O(N²) operations — for every row, it re-filters the entire DataFrame by user. At 500K rows that's 250 billion comparisons. The three bottlenecks are: (1) iterrows() — Python-level row iteration, 10–100× slower than vectorised ops. (2) df[df['user_id'] == row['user_id']] inside the loop — a full DataFrame scan per row. (3) pd.Timedelta construction inside the loop — object creation overhead. The fast path: groupby().transform() keeps the result aligned to the original DataFrame index automatically. rolling('7D') uses the timestamp index for efficient window computation without explicit row comparisons. shift(1) within a group computes the previous value in one vectorised pass.',
    checkpointAnswer: 'The production concern is not just speed — it's correctness under data drift. Rolling windows with a DateTime index work correctly if data is sorted. In production, late-arriving events (out-of-order timestamps) break expanding() and rolling() correctness silently. Production feature engineering pipelines must: (1) sort by timestamp before all rolling operations, (2) log the count of out-of-order events, (3) define explicit handling for gaps > window size. The 47s → <5s improvement is table stakes. Production-safe feature engineering requires a watermark strategy, not just vectorisation.',
  },
  {
    id: 'mlc15',
    type: 4,
    title: 'Design: Feature Store for a 100K QPS Recommendation System',
    domain: 'ML Systems',
    difficulty: 'senior',
    readMin: 20,
    prompt: `A two-tower recommendation system needs a feature store serving 100K requests/second with < 10ms p99 latency.

Features break into three groups:
• User features: last 30 days of activity, updated every 6 hours (50 features)
• Item features: price, category, availability — updated every 30 minutes (20 features)
• Real-time context: current session action sequence, last 3 clicks — updated on every event (variable length)

Design the feature store architecture. Your design must address:
1. Storage layer: what DB/cache per feature group and why
2. Update pattern: push vs pull, batch vs streaming
3. Consistency model: what consistency guarantee does each group need?
4. Failure mode: what happens if the feature store is unavailable at serve time?
5. One concrete trade-off you would NOT make and why

This is an open-ended design problem. Write your answer in the code editor as structured comments.
There is no single correct answer. The reveal shows a reference architecture used at scale.`,
    starter: `# Feature Store Design — 100K QPS Recommendation System
# Write your design as structured comments. Cover all 5 points.

# 1. STORAGE LAYER
# User features (50 features, 6hr refresh):
#   Storage: ___
#   Reason: ___
#
# Item features (20 features, 30min refresh):
#   Storage: ___
#   Reason: ___
#
# Real-time context (session events, immediate):
#   Storage: ___
#   Reason: ___

# 2. UPDATE PATTERN
# User features update path: ___
# Item features update path: ___
# Context update path: ___

# 3. CONSISTENCY MODEL
# User features: eventual / strong / session?
# Item features: eventual / strong?
# Context: ___
# Acceptable staleness per group: ___

# 4. FAILURE MODE
# If feature store is down at serve time:
#   Degraded mode strategy: ___
#   What NOT to do: ___

# 5. TRADE-OFF YOU WOULD NOT MAKE
# ___
`,
    solution: `# ─── REFERENCE ARCHITECTURE (used at Airbnb/Uber/Netflix scale) ───────────
# This is one defensible design — not the only one.

# 1. STORAGE LAYER
#
# User features (50 features, 6hr refresh):
#   Storage: Redis Cluster with 30-minute TTL + Cassandra as persistent backing store
#   Reason: Redis gives < 1ms p99 point lookups at 100K QPS.
#     Cassandra handles the persistence and large-scale batch reads for retraining.
#     TTL acts as implicit cache eviction — if the 6hr batch job fails, Redis
#     still serves stale user features (acceptable, see consistency model).
#     Key schema: user:{user_id}:features → MessagePack-encoded feature vector.
#
# Item features (20 features, 30min refresh):
#   Storage: Redis (same cluster, different key prefix) — 100M items max feasible.
#     If item catalogue > 100M: tiered cache (Redis for top-K popular items,
#     Cassandra cold path for long tail).
#   Reason: Item features change more frequently than user features but are
#     shared across all users requesting those items — high cache hit rate.
#
# Real-time context (session events, sub-second):
#   Storage: In-process LRU cache at serving layer + Kafka consumer writing
#     to Redis Sorted Set (session:{user_id}:actions → timestamp-sorted list)
#   Reason: Context must be < 5ms to compute. Network round-trip to Redis is
#     feasible (< 2ms on LAN) but in-process is better for p99. Write path:
#     click event → Kafka → Flink consumer → Redis ZADD with TTL 30min.

# 2. UPDATE PATTERN
#
# User features: batch push every 6 hours.
#   Spark job reads 30-day activity logs → computes 50 features → bulk-writes
#   to Redis via pipeline (batched SET commands). New features overwrite old.
#
# Item features: micro-batch push every 30 minutes.
#   Change data capture (CDC) on items table → Kafka → Flink consumer →
#   Redis SET with item TTL. Only changed items are updated (diff-based push).
#
# Context: streaming push on every user event.
#   Click/session events → Kafka → Flink → Redis ZADD with ZRANGEBYSCORE
#   for retrieval (last 3 clicks = top 3 by timestamp score).

# 3. CONSISTENCY MODEL
#
# User features: eventual consistency, ~6hr staleness acceptable.
#   Recommendation quality does not materially degrade from 6hr-old user
#   embeddings. The key invariant: user features are consistent within a
#   single request (read once, not re-read mid-request).
#
# Item features: eventual, < 30min staleness.
#   One exception: item availability (in-stock / out-of-stock). This needs
#   stronger consistency — staleness causes bad UX (showing unavailable items).
#   Solution: separate availability flag with 5-minute TTL + a sync write
#   path from inventory service on status change (push on state change, not
#   just on schedule).
#
# Context: best-effort real-time, session-consistent.
#   Missing context (cache miss) → fall back to last N from Cassandra cold path.
#   Do not block the request waiting for context — timeout after 3ms, use
#   empty context with popularity-based fallback.

# 4. FAILURE MODE
#
# If Redis is unavailable:
#   Strategy: serve the request with default features (zero vectors for user/item,
#   empty context) + route to a popularity-based ranker that doesn't need features.
#   This degrades recommendation quality but keeps p99 latency within budget.
#
# What NOT to do: block the serving request waiting for Redis recovery.
#   If Redis is down and your serving layer blocks, you have 0 QPS instead of
#   degraded-quality QPS. Always prefer degraded responses over blocking.
#   Never let a feature store outage become a full serving outage.
#
# Circuit breaker pattern: after 3 consecutive Redis timeouts per instance,
#   open the circuit and serve degraded for 30 seconds, then probe.

# 5. TRADE-OFF YOU WOULD NOT MAKE
#
# Would NOT use a single shared Redis cluster for all three feature groups.
#   Reason: context writes at 100K events/sec creates write amplification
#   that degrades read latency for user/item features. The contexts have
#   different access patterns, TTLs, and failure modes.
#   Separate clusters with dedicated resources per feature group gives
#   independent scaling, failure isolation, and independent TTL policies.
#   The added operational cost (3 Redis clusters instead of 1) is justified
#   by the latency SLA. In practice: user+item in one cluster, context in
#   a separate in-process store with Redis fallback.
`,
    checkpoint: 'Most candidates get storage layer right (Redis). The failure modes question is where design judgment shows. What happens at 100K QPS when Redis has a network partition? If your design blocks on failure, you've turned a feature store outage into a full serving outage. The expected answer: serve a degraded response immediately, never block. The availability flag (item in-stock) consistency edge case catches most senior engineers — it's the one item feature that needs near-real-time consistency, which breaks the "batch push every 30 minutes" pattern.',
    checkpointAnswer: 'The production tell: separate the cold path (Cassandra) from the hot path (Redis) from the real-time path (in-process + Kafka). Feature stores that collapse all three into one storage system are technically simpler but operationally fragile. The Feast, Tecton, and Vertex Feature Store architectures all implement this three-tier separation. The trade-off question reveals seniority: a junior engineer worries about getting the architecture right; a senior engineer knows which simplifications are acceptable and which create hidden failure modes.',
  },
]

// ── Problem card component ────────────────────────────────────────────────────
const TYPE_META = {
  1: { label: 'Implement from Scratch', color: '#4EA8DE', short: 'Type 1: Implement' },
  2: { label: 'Debug the Broken System', color: '#F4845F', short: 'Type 2: Debug' },
  3: { label: 'Optimise for Production', color: '#4CAF50', short: 'Type 3: Optimise' },
  4: { label: 'Design Under Constraints', color: 'var(--prime)', short: 'Type 4: Design' },
}

function ProblemCard({ problem, done, onComplete, onNavigate }) {
  const [expanded, setExpanded]     = useState(false)
  const [showSolution, setShowSol]  = useState(false)
  const [cpRevealed, setCpRevealed] = useState(false)
  const [cpPick, setCpPick]         = useState(null)

  const DIFF_COLOR = { junior: 'var(--mint)', mid: 'var(--prime)', senior: 'var(--rose)', staff: 'var(--violet)' }
  const typeMeta = problem.type ? TYPE_META[problem.type] : null

  return (
    <div style={{ border: `1px solid ${done ? 'var(--mint)' : 'var(--rim)'}`, borderLeft: `3px solid ${done ? 'var(--mint)' : 'var(--prime)'}`, borderRadius: '10px', overflow: 'hidden', background: 'var(--surface)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', textTransform: 'uppercase' }}>{problem.domain}</span>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: DIFF_COLOR[problem.difficulty], border: `1px solid ${DIFF_COLOR[problem.difficulty]}`, borderRadius: '3px', padding: '0 4px', textTransform: 'uppercase' }}>{problem.difficulty}</span>
            {typeMeta && <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: typeMeta.color, border: `1px solid ${typeMeta.color}40`, borderRadius: '3px', padding: '0 5px', textTransform: 'none' }}>{typeMeta.short}</span>}
            {problem.readMin && <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)' }}>~{problem.readMin} min</span>}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-hi)', fontFamily: 'var(--font-sans)' }}>{problem.title}</div>
        </div>
        <span style={{ fontSize: '13px', color: done ? 'var(--mint)' : 'var(--ink-ghost)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: '2px' }}>
          {done ? '✓ done' : expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 20px 20px' }}>
          {/* Prompt */}
          <div style={{ background: 'var(--card-scrim)', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', border: '1px solid var(--rim)' }}>
            <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Problem</div>
            <pre style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {problem.prompt}
            </pre>
          </div>

          {/* Starter code + live cell */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
              Write your solution:
            </div>
            <PythonCell initialCode={problem.starter} label={`${problem.title} — starter`} height={220} />
          </div>

          {/* Show solution toggle */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => { setShowSol(s => !s) }}
              style={{ fontSize: '12px' }}
            >
              {showSolution ? 'Hide solution' : 'Show solution'}
            </button>
            {!done && (
              <button
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--prime)', background: 'none', color: 'var(--prime)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                onClick={() => onComplete(problem.id)}
              >
                Mark solved
              </button>
            )}
          </div>

          {showSolution && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-hi)', marginBottom: '8px', fontFamily: 'var(--font-sans)' }}>
                Reference solution:
              </div>
              <PythonCell initialCode={problem.solution} label={`${problem.title} — solution`} height={220} />
            </div>
          )}

          {/* Judgment checkpoint */}
          <div style={{ padding: 'var(--card-pad-secondary)', background: 'var(--prime-bg-light)', border: '1px solid rgba(240,165,0,0.25)', borderLeft: '3px solid var(--prime)', borderRadius: '8px' }}>
            <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Judgment checkpoint</div>
            <p style={{ fontSize: '13px', color: 'var(--ink-hi)', lineHeight: 1.65, margin: '0 0 12px', fontStyle: 'italic' }}>
              {problem.checkpoint}
            </p>
            {!cpRevealed ? (
              <button className="btn-primary" onClick={() => setCpRevealed(true)} style={{ fontSize: '12px' }}>
                Reveal answer
              </button>
            ) : (
              <div className="msl-reveal-panel" style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--ink-mid)', lineHeight: 1.65, margin: 0 }}>
                  {problem.checkpointAnswer}
                </p>
              </div>
            )}
          </div>

          {/* What to do next — shown after checkpoint revealed */}
          {cpRevealed && onNavigate && (
            <div style={{ padding: '12px 16px', background: 'var(--depth)', border: '1px solid var(--rim)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-low)', fontFamily: 'var(--font-sans)' }}>What to do next</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => onNavigate('incidentroom')} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--prime)', background: 'rgba(240,165,0,0.08)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                  Incident Room →
                </button>
                <button onClick={() => onNavigate('combinator')} style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ink-mid)', background: 'var(--surface)', border: '1px solid var(--rim)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
                  Combinator →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────
export default function MLCodingTab({ onNavigate }) {
  const [completedIds, setCompletedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(completedIds))
  }, [completedIds])

  function handleComplete(id) {
    setCompletedIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const [activeType, setActiveType] = useState(0)  // 0 = All

  const filtered = activeType === 0 ? PROBLEMS : PROBLEMS.filter(p => p.type === activeType)
  const done  = completedIds.length
  const total = PROBLEMS.length

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div className="section-eyebrow" style={{ marginBottom: '8px' }}>Interview zone</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', background: 'linear-gradient(135deg, var(--prime) 0%, var(--ink-hi) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 10px' }}>
          ML Coding Rounds
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-low)', lineHeight: 1.7, maxWidth: '580px', margin: '0 0 4px' }}>
          ML-specific Python problems that appear in real senior/staff interviews — custom loss functions, vectorised feature engineering, evaluation from scratch. Not DSA, not string manipulation. Runs live in your browser via Pyodide.
        </p>
        <p style={{ fontSize: '12px', color: 'var(--ink-ghost)', margin: '4px 0 10px' }}>
          Each problem ends with a judgment checkpoint: "your code works — but what breaks in production?"
        </p>
        <div style={{ marginTop: '8px' }}><FidelityBadge tier="faithful" /></div>
      </div>
      <HowToStrip
        skill="Production ML coding judgment"
        steps={['Read the problem and constraints', 'Write your solution in the live editor', 'Answer the judgment checkpoint — what breaks in production?']}
      />

      {/* Type filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[{ id: 0, label: 'All Types' }, ...Object.entries(TYPE_META).map(([k, v]) => ({ id: parseInt(k), label: v.short, color: v.color }))].map(t => (
          <button key={t.id} onClick={() => setActiveType(t.id)}
            style={{
              padding: '5px 12px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontWeight: activeType === t.id ? 600 : 400, border: 'none',
              background: activeType === t.id ? (t.color ? `${t.color}22` : 'rgba(240,165,0,0.15)') : 'rgba(0,0,0,0.25)',
              color: activeType === t.id ? (t.color || 'var(--prime)') : 'var(--ink-low)',
              outline: activeType === t.id ? `1px solid ${t.color || 'var(--prime)'}50` : 'none',
              transition: 'all 0.12s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {done > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: 'var(--card-pad-primary)', background: 'var(--card-scrim)', border: '1px solid var(--rim)', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--ink-low)', fontFamily: 'var(--font-mono)' }}>Problems solved</span>
          <div style={{ flex: 1, height: '3px', background: 'var(--rim)', borderRadius: '2px' }}>
            <div style={{ width: `${Math.round((done / total) * 100)}%`, height: '100%', background: 'var(--prime)', borderRadius: '2px', transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--prime)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{done}/{total}</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(p => (
          <ProblemCard
            key={p.id}
            problem={p}
            done={completedIds.includes(p.id)}
            onComplete={handleComplete}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {onNavigate && (
        <div style={{ marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--rim)' }}>
          <button
            onClick={() => onNavigate('incidentroom')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ fontSize: '12px', color: 'var(--prime)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Try cross-domain diagnosis in Incident Room</span>
            <span style={{ fontSize: '12px', color: 'var(--prime)' }}>→</span>
          </button>
        </div>
      )}
    </div>
  )
}
