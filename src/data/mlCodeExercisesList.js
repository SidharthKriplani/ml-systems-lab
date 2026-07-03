// Auto-graded "implement it from scratch" classical-ML coding exercises.
// Each runs in-browser via Pyodide (numpy available). The runner executes
// `userCode + "\n\n" + tests`; success == no exception raised.
//
// Exercise shape:
//   { id, title, topic, difficulty, prompt, starter, solution, tests, packages, hints }

export const ML_CODE_EXERCISES_LIST = [
  {
    id: "sigmoid",
    title: "Numerically stable sigmoid",
    topic: "Optimization",
    difficulty: "intro",
    prompt:
      "Implement `sigmoid(z)` where `z` is a numpy array (any shape).\n\n" +
      "Return the elementwise logistic function **1 / (1 + e^(-z))** as a float array of the same shape.\n\n" +
      "**Constraint:** it must be numerically stable. A naive `np.exp(-z)` overflows for large negative `z` (e.g. `-1000`) and produces `inf` or `nan`. Handle the sign of `z` separately so the output is always in `(0, 1)` with no warnings.\n\n" +
      "Examples: `sigmoid(0) == 0.5`, `sigmoid(-1000)` is a finite value very close to `0.0`.",
    starter:
      "import numpy as np\n\n" +
      "def sigmoid(z):\n" +
      "    # TODO: return the numerically stable logistic function of z.\n" +
      "    # This stub is wrong on purpose.\n" +
      "    z = np.asarray(z, dtype=float)\n" +
      "    return z\n",
    solution:
      "import numpy as np\n\n" +
      "def sigmoid(z):\n" +
      "    z = np.asarray(z, dtype=float)\n" +
      "    out = np.empty_like(z)\n" +
      "    pos = z >= 0\n" +
      "    neg = ~pos\n" +
      "    # For z >= 0: 1 / (1 + e^-z)\n" +
      "    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n" +
      "    # For z < 0: e^z / (1 + e^z) -- avoids overflow of e^-z\n" +
      "    ez = np.exp(z[neg])\n" +
      "    out[neg] = ez / (1.0 + ez)\n" +
      "    return out\n",
    tests:
      "import numpy as np\n\n" +
      "# Known value at 0\n" +
      "assert np.isclose(float(sigmoid(np.array(0.0))), 0.5), 'sigmoid(0) should be 0.5'\n\n" +
      "# Known values\n" +
      "z = np.array([0.0, 2.0, -2.0])\n" +
      "expected = np.array([0.5, 0.8807970779778823, 0.11920292202211755])\n" +
      "assert np.allclose(sigmoid(z), expected), 'sigmoid values incorrect'\n\n" +
      "# Symmetry: sigmoid(-z) == 1 - sigmoid(z)\n" +
      "z2 = np.array([-3.0, -1.0, 0.5, 4.0])\n" +
      "assert np.allclose(sigmoid(-z2), 1.0 - sigmoid(z2)), 'sigmoid symmetry broken'\n\n" +
      "# Numerical stability: no inf / nan on large-magnitude inputs\n" +
      "big = np.array([-1000.0, 1000.0, -1e6, 1e6])\n" +
      "out = sigmoid(big)\n" +
      "assert np.all(np.isfinite(out)), 'sigmoid produced inf/nan on large inputs'\n" +
      "assert np.all((out >= 0.0) & (out <= 1.0)), 'sigmoid output must be in [0, 1]'\n" +
      "assert out[0] < 1e-300 or out[0] == 0.0, 'sigmoid(-1000) should be ~0'\n" +
      "assert out[1] > 1.0 - 1e-12, 'sigmoid(1000) should be ~1'\n",
    packages: ["numpy"],
    hints: [
      "The naive form `1/(1+np.exp(-z))` overflows when z is very negative because `exp(-z)` blows up.",
      "Split by the sign of z. For z >= 0 use `1/(1+exp(-z))`; for z < 0 use `exp(z)/(1+exp(z))`.",
      "Build an output array with `np.empty_like(z)` and fill the two masks separately so exp only ever sees non-positive arguments.",
    ],
  },

  {
    id: "zscore-standardize",
    title: "Z-score standardize columns",
    topic: "Preprocessing",
    difficulty: "intro",
    prompt:
      "Implement `standardize(X)` where `X` is a 2D numpy array of shape `(n_samples, n_features)`.\n\n" +
      "Return a new array where **each column** has mean 0 and standard deviation 1: `(X - mean) / std`, computed per column.\n\n" +
      "Use the **population** standard deviation (`ddof=0`, divide by n).\n\n" +
      "**Guard:** if a column has `std == 0` (constant column), do not divide by zero. Leave that column centered (all zeros) instead of producing `nan`.",
    starter:
      "import numpy as np\n\n" +
      "def standardize(X):\n" +
      "    # TODO: subtract the per-column mean and divide by the per-column std.\n" +
      "    # This stub is wrong on purpose.\n" +
      "    X = np.asarray(X, dtype=float)\n" +
      "    return X\n",
    solution:
      "import numpy as np\n\n" +
      "def standardize(X):\n" +
      "    X = np.asarray(X, dtype=float)\n" +
      "    mean = X.mean(axis=0)\n" +
      "    std = X.std(axis=0)  # ddof=0 population std\n" +
      "    safe_std = np.where(std == 0, 1.0, std)\n" +
      "    return (X - mean) / safe_std\n",
    tests:
      "import numpy as np\n\n" +
      "X = np.array([[1.0, 10.0],\n" +
      "              [2.0, 20.0],\n" +
      "              [3.0, 30.0],\n" +
      "              [4.0, 40.0]])\n" +
      "Z = standardize(X)\n\n" +
      "# Mean ~ 0 per column\n" +
      "assert np.allclose(Z.mean(axis=0), 0.0, atol=1e-9), 'columns should have mean 0'\n" +
      "# Std ~ 1 per column\n" +
      "assert np.allclose(Z.std(axis=0), 1.0, atol=1e-9), 'columns should have std 1'\n\n" +
      "# Known value: column 0 has mean 2.5, population std sqrt(1.25)\n" +
      "expected_col0 = (np.array([1.0, 2.0, 3.0, 4.0]) - 2.5) / np.sqrt(1.25)\n" +
      "assert np.allclose(Z[:, 0], expected_col0), 'column 0 standardized values incorrect'\n\n" +
      "# Shape preserved\n" +
      "assert Z.shape == X.shape, 'output shape must match input'\n\n" +
      "# Constant-column guard: no nan, column stays at 0\n" +
      "Xc = np.array([[5.0, 1.0],\n" +
      "               [5.0, 2.0],\n" +
      "               [5.0, 3.0]])\n" +
      "Zc = standardize(Xc)\n" +
      "assert np.all(np.isfinite(Zc)), 'constant column must not produce nan/inf'\n" +
      "assert np.allclose(Zc[:, 0], 0.0), 'constant column should be centered to 0'\n",
    packages: ["numpy"],
    hints: [
      "Compute the mean and std along axis=0 so you get one value per column.",
      "numpy's `.std()` defaults to ddof=0 (population), which is what this problem asks for.",
      "For the divide-by-zero guard, replace any std of 0 with 1 (e.g. via `np.where`) before dividing -- the centered column is already all zeros.",
    ],
  },

  {
    id: "gini-impurity",
    title: "Gini impurity",
    topic: "Trees",
    difficulty: "intro",
    prompt:
      "Implement `gini(y)` where `y` is a 1D numpy array of integer class labels.\n\n" +
      "Return the **Gini impurity**: `1 - sum(p_k^2)` where `p_k` is the fraction of samples in class `k`.\n\n" +
      "A pure node (all one class) has impurity `0.0`. A 50/50 binary split has impurity `0.5`. An empty array should return `0.0`.",
    starter:
      "import numpy as np\n\n" +
      "def gini(y):\n" +
      "    # TODO: return 1 - sum of squared class proportions.\n" +
      "    # This stub is wrong on purpose.\n" +
      "    y = np.asarray(y)\n" +
      "    return 1.0\n",
    solution:
      "import numpy as np\n\n" +
      "def gini(y):\n" +
      "    y = np.asarray(y)\n" +
      "    n = y.shape[0]\n" +
      "    if n == 0:\n" +
      "        return 0.0\n" +
      "    _, counts = np.unique(y, return_counts=True)\n" +
      "    p = counts / n\n" +
      "    return float(1.0 - np.sum(p ** 2))\n",
    tests:
      "import numpy as np\n\n" +
      "# Pure node -> 0\n" +
      "assert np.isclose(gini(np.array([1, 1, 1, 1])), 0.0), 'pure node should have gini 0'\n" +
      "assert np.isclose(gini(np.array([0])), 0.0), 'single sample should have gini 0'\n\n" +
      "# 50/50 binary -> 0.5\n" +
      "assert np.isclose(gini(np.array([0, 0, 1, 1])), 0.5), '50/50 split should be 0.5'\n\n" +
      "# Known 3-class value: [0,0,1,2] -> 1 - (0.25 + 0.0625 + 0.0625) = 0.625\n" +
      "assert np.isclose(gini(np.array([0, 0, 1, 2])), 0.625), 'three-class gini incorrect'\n\n" +
      "# Max impurity for k classes uniformly: k=4 uniform -> 1 - 4*(1/4)^2 = 0.75\n" +
      "assert np.isclose(gini(np.array([0, 1, 2, 3])), 0.75), 'uniform 4-class gini incorrect'\n\n" +
      "# Empty -> 0\n" +
      "assert np.isclose(gini(np.array([], dtype=int)), 0.0), 'empty array should be 0'\n",
    packages: ["numpy"],
    hints: [
      "Count how many samples fall in each class -- `np.unique(y, return_counts=True)` gives you the counts.",
      "Turn counts into proportions by dividing by the total number of samples.",
      "Gini = 1 - sum(p_k^2). Handle the empty array up front by returning 0.0.",
    ],
  },

  {
    id: "entropy-infogain",
    title: "Entropy and information gain",
    topic: "Trees",
    difficulty: "core",
    prompt:
      "Implement two functions.\n\n" +
      "**`entropy(y)`** -- Shannon entropy of a 1D label array in **bits** (log base 2): `-sum(p_k * log2(p_k))`, skipping classes with `p_k == 0`. A pure node has entropy `0.0`; a 50/50 binary split has entropy `1.0`. Empty array returns `0.0`.\n\n" +
      "**`info_gain(parent, left, right)`** -- given the parent label array and its two child arrays after a split, return `entropy(parent) - (w_left * entropy(left) + w_right * entropy(right))` where the weights are the fraction of parent samples in each child.",
    starter:
      "import numpy as np\n\n" +
      "def entropy(y):\n" +
      "    # TODO: Shannon entropy in bits (log2), skipping zero-probability classes.\n" +
      "    # This stub is wrong on purpose.\n" +
      "    y = np.asarray(y)\n" +
      "    return 1.0\n\n" +
      "def info_gain(parent, left, right):\n" +
      "    # TODO: entropy(parent) - weighted average of child entropies.\n" +
      "    # This stub is wrong on purpose.\n" +
      "    return 0.0\n",
    solution:
      "import numpy as np\n\n" +
      "def entropy(y):\n" +
      "    y = np.asarray(y)\n" +
      "    n = y.shape[0]\n" +
      "    if n == 0:\n" +
      "        return 0.0\n" +
      "    _, counts = np.unique(y, return_counts=True)\n" +
      "    p = counts / n\n" +
      "    p = p[p > 0]\n" +
      "    return float(-np.sum(p * np.log2(p)))\n\n" +
      "def info_gain(parent, left, right):\n" +
      "    parent = np.asarray(parent)\n" +
      "    left = np.asarray(left)\n" +
      "    right = np.asarray(right)\n" +
      "    n = parent.shape[0]\n" +
      "    if n == 0:\n" +
      "        return 0.0\n" +
      "    w_left = left.shape[0] / n\n" +
      "    w_right = right.shape[0] / n\n" +
      "    child = w_left * entropy(left) + w_right * entropy(right)\n" +
      "    return float(entropy(parent) - child)\n",
    tests:
      "import numpy as np\n\n" +
      "# Pure node -> 0\n" +
      "assert np.isclose(entropy(np.array([1, 1, 1])), 0.0), 'pure node entropy should be 0'\n" +
      "# 50/50 -> 1 bit\n" +
      "assert np.isclose(entropy(np.array([0, 0, 1, 1])), 1.0), '50/50 entropy should be 1 bit'\n" +
      "# Known 3-class: [0,0,0,1] -> -(0.75 log2 0.75 + 0.25 log2 0.25) = 0.8112781\n" +
      "assert np.isclose(entropy(np.array([0, 0, 0, 1])), 0.8112781244591328), 'entropy value incorrect'\n" +
      "# Empty -> 0\n" +
      "assert np.isclose(entropy(np.array([], dtype=int)), 0.0), 'empty entropy should be 0'\n\n" +
      "# Perfect split: parent 50/50, children each pure -> gain equals parent entropy (1.0)\n" +
      "parent = np.array([0, 0, 1, 1])\n" +
      "left = np.array([0, 0])\n" +
      "right = np.array([1, 1])\n" +
      "assert np.isclose(info_gain(parent, left, right), 1.0), 'perfect split gain should be 1.0'\n\n" +
      "# Useless split: children retain parent distribution -> gain 0\n" +
      "p2 = np.array([0, 0, 1, 1])\n" +
      "l2 = np.array([0, 1])\n" +
      "r2 = np.array([0, 1])\n" +
      "assert np.isclose(info_gain(p2, l2, r2), 0.0), 'useless split gain should be 0'\n\n" +
      "# Known partial split: parent [0,0,0,1], left [0,0,0], right [1]\n" +
      "# child entropy = 0 -> gain = entropy(parent) = 0.8112781...\n" +
      "p3 = np.array([0, 0, 0, 1])\n" +
      "assert np.isclose(info_gain(p3, np.array([0, 0, 0]), np.array([1])), 0.8112781244591328), 'partial split gain incorrect'\n",
    packages: ["numpy"],
    hints: [
      "Entropy uses class proportions just like Gini, but the formula is `-sum(p * log2(p))`. Drop any p == 0 before taking the log.",
      "Information gain weights each child's entropy by its share of the parent's samples (child_size / parent_size).",
      "info_gain = entropy(parent) - (w_left*entropy(left) + w_right*entropy(right)). Reuse your entropy function.",
    ],
  },

  {
    id: "logistic-gradient-step",
    title: "Logistic regression gradient step",
    topic: "Optimization",
    difficulty: "core",
    prompt:
      "Implement `grad_step(X, y, w, lr)` performing **one** gradient-descent update for logistic regression.\n\n" +
      "- `X`: shape `(n, d)` feature matrix (no bias column added for you).\n" +
      "- `y`: shape `(n,)` binary labels in `{0, 1}`.\n" +
      "- `w`: shape `(d,)` current weights.\n" +
      "- `lr`: scalar learning rate.\n\n" +
      "The prediction is `p = sigmoid(X @ w)`. The **mean** gradient is `g = X.T @ (p - y) / n`. Return the updated weights `w - lr * g` as a shape `(d,)` array. `w` itself must not be mutated.",
    starter:
      "import numpy as np\n\n" +
      "def sigmoid(z):\n" +
      "    z = np.asarray(z, dtype=float)\n" +
      "    return np.where(z >= 0, 1.0 / (1.0 + np.exp(-np.abs(z))),\n" +
      "                    np.exp(-np.abs(z)) / (1.0 + np.exp(-np.abs(z))))\n\n" +
      "def grad_step(X, y, w, lr):\n" +
      "    # TODO: one logistic-regression gradient-descent step.\n" +
      "    # This stub is wrong on purpose (returns w unchanged).\n" +
      "    return np.asarray(w, dtype=float).copy()\n",
    solution:
      "import numpy as np\n\n" +
      "def sigmoid(z):\n" +
      "    z = np.asarray(z, dtype=float)\n" +
      "    out = np.empty_like(z)\n" +
      "    pos = z >= 0\n" +
      "    neg = ~pos\n" +
      "    out[pos] = 1.0 / (1.0 + np.exp(-z[pos]))\n" +
      "    ez = np.exp(z[neg])\n" +
      "    out[neg] = ez / (1.0 + ez)\n" +
      "    return out\n\n" +
      "def grad_step(X, y, w, lr):\n" +
      "    X = np.asarray(X, dtype=float)\n" +
      "    y = np.asarray(y, dtype=float)\n" +
      "    w = np.asarray(w, dtype=float)\n" +
      "    n = X.shape[0]\n" +
      "    p = sigmoid(X @ w)\n" +
      "    g = X.T @ (p - y) / n\n" +
      "    return w - lr * g\n",
    tests:
      "import numpy as np\n\n" +
      "# Small known case\n" +
      "X = np.array([[1.0, 2.0],\n" +
      "              [1.0, -1.0],\n" +
      "              [1.0, 0.0]])\n" +
      "y = np.array([1.0, 0.0, 1.0])\n" +
      "w = np.array([0.0, 0.0])\n" +
      "lr = 0.5\n\n" +
      "# At w=0, sigmoid(Xw)=0.5 everywhere. p-y = [-0.5, 0.5, -0.5]\n" +
      "# g = X.T @ (p-y) / 3\n" +
      "#   col0 (bias): (-0.5 + 0.5 - 0.5)/3 = -0.16666667\n" +
      "#   col1:        (-1.0 - 0.5 + 0.0)/3 = -0.5\n" +
      "# w_new = w - 0.5*g = [0.08333333, 0.25]\n" +
      "w_new = grad_step(X, y, w, lr)\n" +
      "expected = np.array([0.08333333333333333, 0.25])\n" +
      "assert w_new.shape == (2,), 'output must be shape (d,)'\n" +
      "assert np.allclose(w_new, expected), 'updated weights incorrect'\n\n" +
      "# Original w must not be mutated\n" +
      "assert np.allclose(w, np.array([0.0, 0.0])), 'grad_step must not mutate w'\n\n" +
      "# A gradient step should reduce logistic loss on a separable-ish case\n" +
      "def loss(X, y, w):\n" +
      "    z = X @ w\n" +
      "    # stable log-loss\n" +
      "    return float(np.mean(np.logaddexp(0.0, z) - y * z))\n" +
      "w2 = np.array([0.0, 0.0])\n" +
      "l0 = loss(X, y, w2)\n" +
      "w2b = grad_step(X, y, w2, 0.5)\n" +
      "l1 = loss(X, y, w2b)\n" +
      "assert l1 < l0, 'one gradient step should reduce the loss'\n",
    packages: ["numpy"],
    hints: [
      "Compute predictions first: `p = sigmoid(X @ w)`, a vector of length n.",
      "The gradient of mean logistic loss is `X.T @ (p - y) / n` -- note the division by n (mean, not sum).",
      "Return `w - lr * g`. Copy/convert w with `np.asarray(..., dtype=float)` so you don't mutate the caller's array.",
    ],
  },

  {
    id: "kmeans-one-iteration",
    title: "K-means: one Lloyd iteration",
    topic: "Clustering",
    difficulty: "core",
    prompt:
      "Implement `kmeans_step(X, centroids)` performing **one** Lloyd iteration.\n\n" +
      "- `X`: shape `(n, d)` data points.\n" +
      "- `centroids`: shape `(k, d)` current cluster centers.\n\n" +
      "Return a tuple `(labels, new_centroids)`:\n" +
      "- `labels`: shape `(n,)` int array -- index of the **nearest** centroid (by squared Euclidean distance) for each point.\n" +
      "- `new_centroids`: shape `(k, d)` -- the mean of the points assigned to each cluster. If a cluster gets **no** points, keep its old centroid unchanged (do not produce `nan`).",
    starter:
      "import numpy as np\n\n" +
      "def kmeans_step(X, centroids):\n" +
      "    # TODO: assign each point to nearest centroid, then recompute centroids.\n" +
      "    # This stub is wrong on purpose.\n" +
      "    X = np.asarray(X, dtype=float)\n" +
      "    centroids = np.asarray(centroids, dtype=float)\n" +
      "    labels = np.zeros(X.shape[0], dtype=int)\n" +
      "    return labels, centroids\n",
    solution:
      "import numpy as np\n\n" +
      "def kmeans_step(X, centroids):\n" +
      "    X = np.asarray(X, dtype=float)\n" +
      "    centroids = np.asarray(centroids, dtype=float)\n" +
      "    k = centroids.shape[0]\n" +
      "    # Squared distances: (n, k)\n" +
      "    diff = X[:, None, :] - centroids[None, :, :]\n" +
      "    dist_sq = np.sum(diff ** 2, axis=2)\n" +
      "    labels = np.argmin(dist_sq, axis=1).astype(int)\n" +
      "    new_centroids = centroids.copy()\n" +
      "    for j in range(k):\n" +
      "        mask = labels == j\n" +
      "        if np.any(mask):\n" +
      "            new_centroids[j] = X[mask].mean(axis=0)\n" +
      "    return labels, new_centroids\n",
    tests:
      "import numpy as np\n\n" +
      "# Two clear clusters on the line\n" +
      "X = np.array([[0.0, 0.0],\n" +
      "              [1.0, 0.0],\n" +
      "              [10.0, 0.0],\n" +
      "              [11.0, 0.0]])\n" +
      "centroids = np.array([[0.0, 0.0],\n" +
      "                      [10.0, 0.0]])\n" +
      "labels, new_c = kmeans_step(X, centroids)\n\n" +
      "# First two points -> cluster 0, last two -> cluster 1\n" +
      "assert np.array_equal(labels, np.array([0, 0, 1, 1])), 'assignments incorrect'\n" +
      "assert labels.shape == (4,), 'labels shape must be (n,)'\n\n" +
      "# New centroids are the cluster means: [0.5,0] and [10.5,0]\n" +
      "expected_c = np.array([[0.5, 0.0], [10.5, 0.0]])\n" +
      "assert new_c.shape == (2, 2), 'centroids shape must be (k, d)'\n" +
      "assert np.allclose(new_c, expected_c), 'recomputed centroids incorrect'\n\n" +
      "# Nearest by squared distance, tie-break to lower index handled by argmin\n" +
      "X2 = np.array([[5.0, 0.0]])\n" +
      "c2 = np.array([[0.0, 0.0], [10.0, 0.0]])\n" +
      "lab2, _ = kmeans_step(X2, c2)\n" +
      "assert lab2[0] == 0, 'tie should break to the lower centroid index'\n\n" +
      "# Empty-cluster guard: a centroid with no points keeps its position\n" +
      "X3 = np.array([[0.0, 0.0], [1.0, 0.0]])\n" +
      "c3 = np.array([[0.0, 0.0], [100.0, 0.0]])  # second centroid gets nothing\n" +
      "lab3, new_c3 = kmeans_step(X3, c3)\n" +
      "assert np.all(np.isfinite(new_c3)), 'empty cluster must not produce nan'\n" +
      "assert np.allclose(new_c3[1], np.array([100.0, 0.0])), 'empty cluster should keep old centroid'\n",
    packages: ["numpy"],
    hints: [
      "For assignments, compute the squared distance from every point to every centroid -- broadcasting `X[:, None, :] - centroids[None, :, :]` gives an (n, k, d) difference.",
      "Sum the squared differences over the feature axis to get an (n, k) distance matrix, then `np.argmin(..., axis=1)` for the labels.",
      "Recompute each centroid as the mean of its assigned points. Guard the empty case: if no point is assigned to cluster j, leave its old centroid in place.",
    ],
  },

  {
    id: "confusion-prf1",
    title: "Precision, recall, F1 from scratch",
    topic: "Evaluation",
    difficulty: "core",
    prompt:
      "Implement `prf1(y_true, y_pred)` for **binary** labels in `{0, 1}` (1 = positive).\n\n" +
      "Compute the confusion counts (TP, FP, FN) and return a tuple `(precision, recall, f1)` of floats:\n\n" +
      "- `precision = TP / (TP + FP)`\n" +
      "- `recall = TP / (TP + FN)`\n" +
      "- `f1 = 2 * precision * recall / (precision + recall)`\n\n" +
      "**Zero-division guard:** if any denominator is 0, that metric is `0.0` (never `nan`). In particular F1 is `0.0` when `precision + recall == 0`.",
    starter:
      "import numpy as np\n\n" +
      "def prf1(y_true, y_pred):\n" +
      "    # TODO: compute (precision, recall, f1) from binary label arrays.\n" +
      "    # This stub is wrong on purpose.\n" +
      "    return 1.0, 1.0, 1.0\n",
    solution:
      "import numpy as np\n\n" +
      "def prf1(y_true, y_pred):\n" +
      "    y_true = np.asarray(y_true).astype(int)\n" +
      "    y_pred = np.asarray(y_pred).astype(int)\n" +
      "    tp = int(np.sum((y_pred == 1) & (y_true == 1)))\n" +
      "    fp = int(np.sum((y_pred == 1) & (y_true == 0)))\n" +
      "    fn = int(np.sum((y_pred == 0) & (y_true == 1)))\n" +
      "    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0\n" +
      "    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0\n" +
      "    f1 = (2 * precision * recall / (precision + recall)\n" +
      "          if (precision + recall) > 0 else 0.0)\n" +
      "    return float(precision), float(recall), float(f1)\n",
    tests:
      "import numpy as np\n\n" +
      "# Known case\n" +
      "y_true = np.array([1, 1, 1, 0, 0, 0])\n" +
      "y_pred = np.array([1, 1, 0, 1, 0, 0])\n" +
      "# TP=2, FP=1, FN=1 -> P=2/3, R=2/3, F1=2/3\n" +
      "p, r, f = prf1(y_true, y_pred)\n" +
      "assert np.isclose(p, 2/3), 'precision incorrect'\n" +
      "assert np.isclose(r, 2/3), 'recall incorrect'\n" +
      "assert np.isclose(f, 2/3), 'f1 incorrect'\n\n" +
      "# Perfect prediction\n" +
      "yt = np.array([1, 0, 1, 0])\n" +
      "assert np.allclose(prf1(yt, yt), (1.0, 1.0, 1.0)), 'perfect prediction should be all 1.0'\n\n" +
      "# Asymmetric known case: TP=3, FP=0, FN=2 -> P=1.0, R=0.6, F1=0.75\n" +
      "yt2 = np.array([1, 1, 1, 1, 1, 0])\n" +
      "yp2 = np.array([1, 1, 1, 0, 0, 0])\n" +
      "p2, r2, f2 = prf1(yt2, yp2)\n" +
      "assert np.isclose(p2, 1.0), 'precision (asym) incorrect'\n" +
      "assert np.isclose(r2, 0.6), 'recall (asym) incorrect'\n" +
      "assert np.isclose(f2, 0.75), 'f1 (asym) incorrect'\n\n" +
      "# Zero-division guard: no positive predictions -> all 0.0, no nan\n" +
      "yt3 = np.array([1, 1, 0, 0])\n" +
      "yp3 = np.array([0, 0, 0, 0])\n" +
      "p3, r3, f3 = prf1(yt3, yp3)\n" +
      "assert (p3, r3, f3) == (0.0, 0.0, 0.0), 'no positive predictions should give (0,0,0)'\n" +
      "assert np.isfinite(p3) and np.isfinite(r3) and np.isfinite(f3), 'metrics must not be nan'\n",
    packages: ["numpy"],
    hints: [
      "Build boolean masks: TP is where pred==1 and true==1; FP is pred==1 and true==0; FN is pred==0 and true==1. Sum each mask.",
      "Guard every division: return 0.0 whenever the denominator is 0 instead of dividing.",
      "F1 is the harmonic mean 2PR/(P+R); it must also be 0.0 when P+R == 0.",
    ],
  },

  {
    id: "roc-auc-rank",
    title: "ROC AUC via the rank identity",
    topic: "Evaluation",
    difficulty: "advanced",
    prompt:
      "Implement `auc(y_true, scores)` -- the area under the ROC curve computed via the **Mann-Whitney / rank identity**, not by trapezoidal integration.\n\n" +
      "- `y_true`: shape `(n,)` binary labels in `{0, 1}`.\n" +
      "- `scores`: shape `(n,)` real-valued model scores (higher = more likely positive).\n\n" +
      "AUC equals the probability that a randomly chosen positive scores higher than a randomly chosen negative:\n\n" +
      "`AUC = (1 / (n_pos * n_neg)) * sum over (pos, neg) pairs of [ score_pos > score_neg ] + 0.5 * [ score_pos == score_neg ]`\n\n" +
      "Ties count as `0.5`. A perfect ranking gives `1.0`. If there are no positives or no negatives, return `0.5` (undefined-but-safe).",
    starter:
      "import numpy as np\n\n" +
      "def auc(y_true, scores):\n" +
      "    # TODO: AUC via the rank / Mann-Whitney identity, ties = 0.5.\n" +
      "    # This stub is wrong on purpose.\n" +
      "    return 0.0\n",
    solution:
      "import numpy as np\n\n" +
      "def auc(y_true, scores):\n" +
      "    y_true = np.asarray(y_true).astype(int)\n" +
      "    scores = np.asarray(scores, dtype=float)\n" +
      "    pos = scores[y_true == 1]\n" +
      "    neg = scores[y_true == 0]\n" +
      "    n_pos = pos.shape[0]\n" +
      "    n_neg = neg.shape[0]\n" +
      "    if n_pos == 0 or n_neg == 0:\n" +
      "        return 0.5\n" +
      "    # Pairwise comparison matrix (n_pos, n_neg)\n" +
      "    greater = (pos[:, None] > neg[None, :]).sum()\n" +
      "    ties = (pos[:, None] == neg[None, :]).sum()\n" +
      "    return float((greater + 0.5 * ties) / (n_pos * n_neg))\n",
    tests:
      "import numpy as np\n\n" +
      "# Perfect separation -> 1.0\n" +
      "y = np.array([0, 0, 1, 1])\n" +
      "s = np.array([0.1, 0.2, 0.8, 0.9])\n" +
      "assert np.isclose(auc(y, s), 1.0), 'perfect ranking should be AUC 1.0'\n\n" +
      "# Perfectly wrong -> 0.0\n" +
      "s_bad = np.array([0.9, 0.8, 0.2, 0.1])\n" +
      "assert np.isclose(auc(y, s_bad), 0.0), 'inverted ranking should be AUC 0.0'\n\n" +
      "# Known intermediate value.\n" +
      "# pos scores {0.6, 0.4}, neg scores {0.5, 0.3}. Pairs (pos,neg):\n" +
      "# 0.6>0.5 y, 0.6>0.3 y, 0.4>0.5 n, 0.4>0.3 y -> 3/4 = 0.75\n" +
      "y2 = np.array([0, 1, 0, 1])\n" +
      "s2 = np.array([0.5, 0.6, 0.3, 0.4])\n" +
      "assert np.isclose(auc(y2, s2), 0.75), 'intermediate AUC incorrect'\n\n" +
      "# Ties count as 0.5.\n" +
      "# pos {0.5, 0.5}, neg {0.5, 0.1}. Pairs:\n" +
      "# 0.5 vs 0.5 tie(0.5), 0.5>0.1 (1), 0.5 vs 0.5 tie(0.5), 0.5>0.1 (1) = 3/4 = 0.75\n" +
      "y3 = np.array([1, 1, 0, 0])\n" +
      "s3 = np.array([0.5, 0.5, 0.5, 0.1])\n" +
      "assert np.isclose(auc(y3, s3), 0.75), 'tie handling incorrect'\n\n" +
      "# All-same scores -> every pair is a tie -> 0.5\n" +
      "y4 = np.array([1, 0, 1, 0])\n" +
      "s4 = np.array([0.5, 0.5, 0.5, 0.5])\n" +
      "assert np.isclose(auc(y4, s4), 0.5), 'all-tie AUC should be 0.5'\n\n" +
      "# Degenerate: no negatives -> 0.5 safe fallback\n" +
      "assert np.isclose(auc(np.array([1, 1, 1]), np.array([0.2, 0.5, 0.9])), 0.5), 'no-negative fallback should be 0.5'\n",
    packages: ["numpy"],
    hints: [
      "Split the scores into positives (y==1) and negatives (y==0).",
      "Compare every positive against every negative -- broadcasting `pos[:, None] > neg[None, :]` gives a boolean matrix you can sum.",
      "AUC = (count of pos>neg + 0.5 * count of ties) / (n_pos * n_neg). Return 0.5 if either group is empty.",
    ],
  },
];
