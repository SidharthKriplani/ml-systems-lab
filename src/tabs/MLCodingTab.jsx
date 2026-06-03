import { useState, useEffect } from 'react'
import PythonCell from '../components/PythonCell.jsx'
import FidelityBadge from '../components/FidelityBadge.jsx'

const LS_KEY = 'msl_score:mlcoding'

// ── Problem bank ──────────────────────────────────────────────────────────────
// Tightly scoped to ML-specific Python that appears in real senior/staff interviews.
// NOT generic Python (no string manipulation, no DSA).
// Each problem: starter code + expected output validation + judgment checkpoint.

const PROBLEMS = [
  {
    id: 'mlc1',
    title: 'Custom Cross-Entropy Loss',
    domain: 'Model Training',
    difficulty: 'mid',
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
    title: 'Vectorised Feature Engineering — No Loops',
    domain: 'Feature Engineering',
    difficulty: 'mid',
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
    title: 'K-Fold Cross-Validation From Scratch',
    domain: 'Model Evaluation',
    difficulty: 'junior',
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
    title: 'Retry Decorator with Exponential Backoff',
    domain: 'ML Systems',
    difficulty: 'senior',
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
    title: 'ModelConfig Validation with Pydantic',
    domain: 'ML Systems',
    difficulty: 'mid',
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
    title: 'Pandas CDC Deduplication',
    domain: 'Data Engineering',
    difficulty: 'senior',
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
    title: 'Diagnosing and Fixing Spark Data Skew',
    domain: 'Data Engineering',
    difficulty: 'senior',
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
]

// ── Problem card component ────────────────────────────────────────────────────
function ProblemCard({ problem, done, onComplete }) {
  const [expanded, setExpanded]     = useState(false)
  const [showSolution, setShowSol]  = useState(false)
  const [cpRevealed, setCpRevealed] = useState(false)
  const [cpPick, setCpPick]         = useState(null)

  const DIFF_COLOR = { junior: 'var(--mint)', mid: 'var(--prime)', senior: 'var(--rose)', staff: 'var(--violet)' }

  return (
    <div style={{ border: `1px solid ${done ? 'var(--mint)' : 'var(--rim)'}`, borderLeft: `3px solid ${done ? 'var(--mint)' : 'var(--prime)'}`, borderRadius: '10px', overflow: 'hidden', background: 'var(--surface)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', textAlign: 'left', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--ink-ghost)', textTransform: 'uppercase' }}>{problem.domain}</span>
            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: DIFF_COLOR[problem.difficulty], border: `1px solid ${DIFF_COLOR[problem.difficulty]}`, borderRadius: '3px', padding: '0 4px', textTransform: 'uppercase' }}>{problem.difficulty}</span>
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
        {PROBLEMS.map(p => (
          <ProblemCard
            key={p.id}
            problem={p}
            done={completedIds.includes(p.id)}
            onComplete={handleComplete}
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
